import pickle
import uvicorn
from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import Dict, Any
from fastapi import FastAPI, UploadFile, File
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from selenium.webdriver.chrome.options import Options
import random
import os
from groq import Groq
import PyPDF2
from io import BytesIO
client = Groq(api_key="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")

import re
def cleanResume(txt):
    """
    Cleans the resume text by removing URLs, RT/cc, hashtags, mentions, 
    punctuation, non-ASCII characters, and extra spaces.
    """
    cleanText = re.sub('http\S+\s', ' ', txt)
    cleanText = re.sub('RT|cc', ' ', cleanText)
    cleanText = re.sub('#\S+\s', ' ', cleanText)
    cleanText = re.sub('@\S+', ' ', cleanText)
    cleanText = re.sub('[%s]' % re.escape("""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', cleanText)
    cleanText = re.sub(r'[^\x00-\x7f]', ' ', cleanText)
    cleanText = re.sub('\s+', ' ', cleanText)
    return cleanText
try:
    with open('tfidf_advanced.pkl', 'rb') as f:
        tfidf = pickle.load(f)
    
    with open('clf_advanced.pkl', 'rb') as f:
        model = pickle.load(f)

    with open('encoder_advanced.pkl', 'rb') as f:
        le = pickle.load(f)
    category_classes = le.classes_

except FileNotFoundError:
    print("Error: Model files not found. Please ensure 'tfidf_advanced.pkl', 'clf_advanced.pkl', and 'encoder_advanced.pkl' are in the same directory.")
    exit()
def parse_resume_with_groq(resume_text):
    """
    Parses a resume using a Groq-powered LLM to extract key details.
    """
    prompt = f"""
    You are an expert resume parser. Analyze the following resume text and extract the candidate's name, email, phone number, and a summary of their skills and experience. Format the output as a JSON object with the keys 'name', 'email', 'phone', 'summary', and 'skills'.

    Resume Text:
    {resume_text}
    """
    
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="openai/gpt-oss-20b",  # A fast and capable model
        response_format={"type": "json_object"}
    )
    
    return chat_completion.choices[0].message.content

def find_jobs_with_selenium(keywords, location="USA"):
    """
    Uses Selenium with Undetected ChromeDriver to search for jobs on LinkedIn,
    filtered by keywords (predicted category).
    """
    options = Options()
    options.headless = False  # Make sure the browser is visible
    options.add_argument("--start-maximized")  # Maximize the window
    options.add_argument("--disable-blink-features=AutomationControlled")  # Disable automation detection
    driver = uc.Chrome(options=options, use_subprocess=True)

    try:
        driver.get("https://www.linkedin.com/jobs/search/")
        wait = WebDriverWait(driver, 20)
        search_box = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "jobs-search-box__text-input")))
        search_box.clear()
        search_box.send_keys(keywords)
        location_box = driver.find_element(By.CSS_SELECTOR, "input[aria-label='City, state, or zip code']")
        location_box.clear()
        location_box.send_keys(location)
        search_box.send_keys(u'\ue007')  # Enter key
        time.sleep(5)
        last_height = driver.execute_script("return document.body.scrollHeight")
        while True:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(random.uniform(2, 4))  # Random wait between scrolls
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        jobs = driver.find_elements(By.CLASS_NAME, "jobs-search-results__list-item")
        job_listings = []
        for job in jobs:
            try:
                title = job.find_element(By.CLASS_NAME, "base-search-card__title").text
                company = job.find_element(By.CLASS_NAME, "base-search-card__subtitle").text
                link = job.find_element(By.CLASS_NAME, "base-card__full-link").get_attribute("href")
                if keywords.lower() in title.lower():
                    job_listings.append({"title": title, "company": company, "link": link})
            except Exception as e:
                print(f"Error extracting job: {e}")

        return job_listings

    except Exception as e:
        print(f"An error occurred: {e}")
        return []
    finally:
        driver.quit()

app = FastAPI(
    title="Resume Category Classifier API",
    description="A real-time API for classifying resumes into job categories using a trained machine learning model.",
    version="1.0.0",
)
class ResumeRequest(BaseModel):
    resume_text: str
@app.get("/ping", tags=["Health Check"])
async def ping():
    """
    Health check endpoint. Returns a simple message to indicate the service is running.
    """
    return {"message": "Service is up and running!"}

@app.post("/predict_category", tags=["Prediction"])
async def predict_category(request: ResumeRequest):
    """
    Predicts the job category of a given resume text.

    Args:
        resume_text (str): The raw text content of the resume.

    Returns:
        A dictionary with the predicted category and a confidence score.
    """
    try:
        cleaned_resume = cleanResume(request.resume_text)
        vectorized_text = tfidf.transform([cleaned_resume])
        prediction_array = model.predict(vectorized_text)
        predicted_category_index = prediction_array[0]
        prediction_probabilities = model.predict_proba(vectorized_text)
        confidence_score = prediction_probabilities[0][predicted_category_index]
        predicted_category_name = le.inverse_transform([predicted_category_index])[0]
        return {
            "predicted_category": predicted_category_name,
            "confidence_score": f"{confidence_score:.4f}",
            "confidence_percentage": f"{confidence_score * 100:.2f}%"
        }

    except Exception as e:
        return {"error": str(e)}
@app.post("/analyze_and_search", tags=["Advanced Features"])
async def analyze_and_search(resume_file: UploadFile = File(...)):
    """
    Analyzes an uploaded resume, predicts its category, extracts key data,
    and finds relevant job listings.
    """
    try:
        resume_text_bytes = await resume_file.read()
        pdf_file = BytesIO(resume_text_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        resume_text = ""
        for page in pdf_reader.pages:
            resume_text += page.extract_text()
        
        cleaned_resume = cleanResume(resume_text)
        vectorized_text = tfidf.transform([cleaned_resume])
        predicted_category_index = model.predict(vectorized_text)[0]
        predicted_category_name = le.inverse_transform([predicted_category_index])[0]
        parsed_data = parse_resume_with_groq(resume_text)

        job_listings = find_jobs_with_selenium(predicted_category_name)
        return {
            "classification_result": {
                "predicted_category": predicted_category_name
            },
            "parsed_resume_data": parsed_data,
            "relevant_job_listings": job_listings
        }

    except Exception as e:
        return {"error": str(e)}
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


