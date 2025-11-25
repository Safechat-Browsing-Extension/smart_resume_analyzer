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


# # import pickle
# # import uvicorn
# # from fastapi import FastAPI, Request, UploadFile, File, BackgroundTasks
# # from fastapi.middleware.cors import CORSMiddleware
# # from pydantic import BaseModel
# # from typing import Dict, Any, List, Optional
# # import undetected_chromedriver as uc
# # from selenium.webdriver.common.by import By
# # from selenium.webdriver.support.ui import WebDriverWait
# # from selenium.webdriver.support import expected_conditions as EC
# # from selenium.webdriver.common.keys import Keys
# # import time
# # from selenium.webdriver.chrome.options import Options
# # import random
# # import os
# # from groq import Groq
# # import PyPDF2
# # from io import BytesIO
# # import re
# # import json
# # from datetime import datetime
# # import nltk
# # from collections import Counter
# # import matplotlib.pyplot as plt
# # from wordcloud import WordCloud
# # import base64
# # from textblob import TextBlob
# # import numpy as np
# # import os
# # from dotenv import load_dotenv

# # # Load environment variables from .env file
# # load_dotenv()

# # # Initialize Groq client using the variable
# # # This is much safer!
# # client = Groq(api_key=os.getenv("GROQ_API_KEY"))
# # # Initialize Groq client
# # # client = Groq(api_key="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")

# # # Download required NLTK data
# # try:
# #     nltk.data.find('tokenizers/punkt')
# # except LookupError:
# #     nltk.download('punkt')
# #     nltk.download('stopwords')

# # # ==================== UTILITY FUNCTIONS ====================

# # def cleanResume(txt):
# #     """Enhanced resume cleaning with better text processing"""
# #     cleanText = re.sub('http\S+\s', ' ', txt)
# #     cleanText = re.sub('RT|cc', ' ', cleanText)
# #     cleanText = re.sub('#\S+\s', ' ', cleanText)
# #     cleanText = re.sub('@\S+', ' ', cleanText)
# #     cleanText = re.sub('[%s]' % re.escape("""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', cleanText)
# #     cleanText = re.sub(r'[^\x00-\x7f]', ' ', cleanText)
# #     cleanText = re.sub('\s+', ' ', cleanText)
# #     return cleanText.strip()

# # def calculate_ats_score(resume_text):
# #     """Calculate ATS (Applicant Tracking System) compatibility score"""
# #     score = 100
# #     issues = []
    
# #     # Check for email
# #     if not re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text):
# #         score -= 10
# #         issues.append("Missing email address")
    
# #     # Check for phone number
# #     if not re.search(r'\+?\d[\d\s\-\(\)]{8,}\d', resume_text):
# #         score -= 10
# #         issues.append("Missing phone number")
    
# #     # Check for common sections
# #     sections = ['experience', 'education', 'skills', 'projects']
# #     found_sections = sum(1 for section in sections if section.lower() in resume_text.lower())
# #     if found_sections < 3:
# #         score -= 15
# #         issues.append(f"Missing key sections (found {found_sections}/4)")
    
# #     # Check for action verbs
# #     action_verbs = ['developed', 'managed', 'created', 'designed', 'implemented', 'led', 'achieved']
# #     verb_count = sum(1 for verb in action_verbs if verb.lower() in resume_text.lower())
# #     if verb_count < 3:
# #         score -= 10
# #         issues.append("Limited use of action verbs")
    
# #     # Check resume length
# #     word_count = len(resume_text.split())
# #     if word_count < 200:
# #         score -= 15
# #         issues.append("Resume too short")
# #     elif word_count > 1500:
# #         score -= 10
# #         issues.append("Resume too long")
    
# #     return max(0, score), issues

# # def extract_skills(resume_text):
# #     """Extract technical and soft skills from resume"""
# #     tech_skills = [
# #         'python', 'java', 'javascript', 'c++', 'sql', 'html', 'css', 'react', 'angular',
# #         'node', 'django', 'flask', 'mongodb', 'mysql', 'postgresql', 'aws', 'azure',
# #         'docker', 'kubernetes', 'git', 'machine learning', 'deep learning', 'tensorflow',
# #         'pytorch', 'data analysis', 'tableau', 'power bi', 'excel', 'r programming'
# #     ]
    
# #     soft_skills = [
# #         'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
# #         'critical thinking', 'project management', 'time management', 'adaptability'
# #     ]
    
# #     found_tech = [skill for skill in tech_skills if skill.lower() in resume_text.lower()]
# #     found_soft = [skill for skill in soft_skills if skill.lower() in resume_text.lower()]
    
# #     return {
# #         "technical_skills": found_tech,
# #         "soft_skills": found_soft,
# #         "total_skills_count": len(found_tech) + len(found_soft)
# #     }

# # def gap_analysis(resume_text, job_category):
# #     """Analyze skill gaps for the predicted job category"""
# #     category_skills_map = {
# #         "Data Science": ["python", "machine learning", "sql", "statistics", "pandas", "numpy", "scikit-learn"],
# #         "Web Developer": ["html", "css", "javascript", "react", "node", "api", "responsive design"],
# #         "Software Engineer": ["algorithms", "data structures", "system design", "git", "testing", "debugging"],
# #         "DevOps": ["docker", "kubernetes", "ci/cd", "aws", "linux", "terraform", "jenkins"],
# #         "Data Analyst": ["sql", "excel", "tableau", "power bi", "statistics", "data visualization"]
# #     }
    
# #     required_skills = category_skills_map.get(job_category, [])
# #     resume_lower = resume_text.lower()
    
# #     present_skills = [skill for skill in required_skills if skill in resume_lower]
# #     missing_skills = [skill for skill in required_skills if skill not in resume_lower]
    
# #     return {
# #         "job_category": job_category,
# #         "required_skills": required_skills,
# #         "present_skills": present_skills,
# #         "missing_skills": missing_skills,
# #         "skill_match_percentage": round((len(present_skills) / len(required_skills) * 100), 2) if required_skills else 0
# #     }

# # def suggest_improvements(resume_text, ats_score, skills_data):
# #     """AI-powered resume improvement suggestions"""
# #     suggestions = []
    
# #     if ats_score < 70:
# #         suggestions.append("⚠️ Your ATS score is low. Focus on adding missing sections and contact information.")
    
# #     if skills_data['total_skills_count'] < 5:
# #         suggestions.append("💡 Add more relevant skills to match job requirements better.")
    
# #     if len(resume_text.split()) < 300:
# #         suggestions.append("📝 Expand your resume with more details about your achievements and responsibilities.")
    
# #     numbers = re.findall(r'\b\d+%|\b\d+\+|\b\d+x', resume_text)
# #     if len(numbers) < 3:
# #         suggestions.append("📊 Add quantifiable achievements (e.g., 'Increased sales by 30%') to demonstrate impact.")
    
# #     return suggestions

# # # ==================== LOAD ML MODELS ====================

# # try:
# #     with open('tfidf_advanced.pkl', 'rb') as f:
# #         tfidf = pickle.load(f)
# #     with open('clf_advanced.pkl', 'rb') as f:
# #         model = pickle.load(f)
# #     with open('encoder_advanced.pkl', 'rb') as f:
# #         le = pickle.load(f)
# #     category_classes = le.classes_
# # except FileNotFoundError:
# #     print("Error: Model files not found.")
# #     exit()

# # # ==================== GROQ AI FUNCTIONS ====================

# # def parse_resume_with_groq(resume_text):
# #     """Enhanced resume parsing with Groq AI"""
# #     prompt = f"""
# #     You are an expert resume parser and career advisor. Analyze the following resume comprehensively and extract:
# #     1. Candidate's name, email, phone number
# #     2. Current job title or desired position
# #     3. Years of experience
# #     4. Education details (degree, institution, year)
# #     5. Top 5-7 key skills
# #     6. Summary of experience highlighting major achievements
# #     7. Notable projects or certifications
    
# #     Format output as a JSON object with keys: 'name', 'email', 'phone', 'current_title', 
# #     'years_of_experience', 'education', 'key_skills', 'experience_summary', 'projects_certifications'.
    
# #     Resume Text:
# #     {resume_text}
# #     """
    
# #     try:
# #         chat_completion = client.chat.completions.create(
# #             messages=[{"role": "user", "content": prompt}],
# #             model="llama-3.3-70b-versatile",
# #             response_format={"type": "json_object"}
# #         )
# #         return chat_completion.choices[0].message.content
# #     except Exception as e:
# #         return json.dumps({"error": str(e)})

# # def generate_cover_letter(resume_text, job_title, company_name):
# #     """AI-generated personalized cover letter"""
# #     prompt = f"""
# #     Based on this resume, generate a professional cover letter for the position of {job_title} at {company_name}.
# #     Make it personalized, highlighting relevant skills and experiences from the resume.
# #     Keep it concise (250-300 words) and professional.
    
# #     Resume:
# #     {resume_text[:1500]}
# #     """
    
# #     try:
# #         chat_completion = client.chat.completions.create(
# #             messages=[{"role": "user", "content": prompt}],
# #             model="llama-3.3-70b-versatile"
# #         )
# #         return chat_completion.choices[0].message.content
# #     except Exception as e:
# #         return f"Error generating cover letter: {str(e)}"

# # def generate_interview_prep(resume_text, job_category):
# #     """Generate personalized interview questions based on resume"""
# #     prompt = f"""
# #     Based on this {job_category} resume, generate:
# #     1. 5 technical interview questions the candidate should prepare for
# #     2. 3 behavioral questions based on their experience
# #     3. 2 questions they should ask the interviewer
    
# #     Format as JSON with keys: 'technical_questions', 'behavioral_questions', 'questions_to_ask'.
    
# #     Resume:
# #     {resume_text[:1500]}
# #     """
    
# #     try:
# #         chat_completion = client.chat.completions.create(
# #             messages=[{"role": "user", "content": prompt}],
# #             model="llama-3.3-70b-versatile",
# #             response_format={"type": "json_object"}
# #         )
# #         return chat_completion.choices[0].message.content
# #     except Exception as e:
# #         return json.dumps({"error": str(e)})

# # # ==================== SELENIUM JOB SEARCH (FIXED) ====================

# # def find_jobs_with_selenium(keywords, location="USA", num_jobs=10):
# #     """
# #     🔧 FIXED: Enhanced LinkedIn job search with proper Chrome options
# #     Opens browser and displays job listings for the user
# #     """
# #     print(f"\n🔍 Initializing browser for job search: {keywords}")
    
# #     # Simplified Chrome options that work with undetected-chromedriver
# #     options = uc.ChromeOptions()
# #     options.add_argument("--start-maximized")
# #     options.add_argument("--disable-blink-features=AutomationControlled")
    
# #     # Remove the problematic excludeSwitches option
# #     driver = None
    
# #     try:
# #         # Initialize undetected Chrome with minimal options
# #         driver = uc.Chrome(options=options, version_main=None)
        
# #         # Build LinkedIn job search URL
# #         search_keywords = keywords.replace(" ", "%20")
# #         search_location = location.replace(" ", "%20")
# #         search_url = f"https://www.linkedin.com/jobs/search/?keywords={search_keywords}&location={search_location}"
        
# #         print(f"🌐 Navigating to: {search_url}")
# #         driver.get(search_url)
        
# #         # Wait for page to load
# #         wait = WebDriverWait(driver, 20)
# #         time.sleep(5)
        
# #         # Scroll to load more jobs
# #         print("📜 Loading more job listings...")
# #         for i in range(3):
# #             driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
# #             time.sleep(random.uniform(2, 4))
        
# #         # Extract job listings
# #         job_listings = []
# #         try:
# #             jobs = driver.find_elements(By.CLASS_NAME, "job-search-card")[:num_jobs]
# #             print(f"✅ Found {len(jobs)} job listings")
            
# #             for idx, job in enumerate(jobs, 1):
# #                 try:
# #                     title = job.find_element(By.CLASS_NAME, "base-search-card__title").text
# #                     company = job.find_element(By.CLASS_NAME, "base-search-card__subtitle").text
# #                     location_elem = job.find_element(By.CLASS_NAME, "job-search-card__location").text
# #                     link = job.find_element(By.CSS_SELECTOR, "a.base-card__full-link").get_attribute("href")
                    
# #                     job_listings.append({
# #                         "position": idx,
# #                         "title": title,
# #                         "company": company,
# #                         "location": location_elem,
# #                         "link": link
# #                     })
                    
# #                     print(f"  {idx}. {title} at {company}")
                    
# #                 except Exception as job_error:
# #                     print(f"  ⚠️ Could not parse job {idx}: {str(job_error)}")
# #                     continue
                    
# #         except Exception as extract_error:
# #             print(f"⚠️ Error extracting jobs: {str(extract_error)}")
        
# #         # Keep browser open for user to explore
# #         print(f"\n✅ Browser opened with {len(job_listings)} jobs!")
# #         print("🖱️ Browser will remain open for 120 seconds for you to explore...")
# #         print("💡 You can click on any job to view details")
        
# #         time.sleep(120)  # Keep browser open for 2 minutes
        
# #         return job_listings
        
# #     except Exception as e:
# #         print(f"❌ Error in job search: {str(e)}")
# #         return []
        
# #     finally:
# #         if driver:
# #             print("\n🔒 Closing browser...")
# #             driver.quit()

# # # ==================== ROBUST JOB SEARCH FUNCTIONS ====================

# # def search_jobs_alternative_sites(keywords, location="USA"):
# #     """
# #     STABLE VERSION: Opens multiple tabs without crashing.
# #     """
# #     options = uc.ChromeOptions()
# #     options.add_argument("--start-maximized")
# #     # This helps keep the session stable
# #     options.add_argument("--disable-popup-blocking") 
    
# #     driver = None

# #     try:
# #         driver = uc.Chrome(options=options)
        
# #         # Generate URLs
# #         sites = [
# #             f"https://www.linkedin.com/jobs/search/?keywords={keywords}&location={location}",
# #             f"https://www.indeed.com/jobs?q={keywords.replace(' ', '+')}&l={location}",
# #             f"https://www.glassdoor.com/Job/jobs.htm?sc.keyword={keywords.replace(' ', '+')}",
# #             f"https://www.naukri.com/{keywords.replace(' ', '-')}-jobs"
# #         ]
        
# #         print(f"\n🌐 Opening job search on {len(sites)} platforms...")

# #         # Open first URL in the existing tab
# #         try:
# #             print(f"  1. Opening first tab...")
# #             driver.get(sites[0])
# #         except Exception as e:
# #             print(f"  ❌ Failed to load first site: {e}")

# #         # Open remaining URLs in new tabs
# #         for i in range(1, len(sites)):
# #             url = sites[i]
# #             try:
# #                 # 1. Execute Javascript to open new tab
# #                 driver.execute_script("window.open('about:blank', '_blank');")
                
# #                 # 2. WAIT for the tab to actually open (Crucial for stability)
# #                 time.sleep(1.5) 
                
# #                 # 3. Switch to the LAST tab (The newest one)
# #                 # usage of [-1] is safer than [i]
# #                 driver.switch_to.window(driver.window_handles[-1])
                
# #                 # 4. Load the URL
# #                 print(f"  {i+1}. Opening tab: {url.split('/')[2]}")
# #                 driver.get(url)
                
# #             except Exception as e:
# #                 print(f"  ⚠️ Could not open tab {i+1}: {str(e)}")
# #                 # We continue to the next site instead of crashing entirely
# #                 continue

# #         print(f"\n✅ All tabs opened successfully!")
# #         print("🖱️ Browser will remain open for 3 minutes (180s)...")
        
# #         # Keep browser open
# #         time.sleep(180)

# #     except Exception as e:
# #         print(f"❌ Critical Driver Error: {str(e)}")
        
# #     finally:
# #         # Only quit if driver exists
# #         if driver:
# #             print("\n🔒 Closing browser session...")
# #             try:
# #                 driver.quit()
# #             except:
# #                 pass

# # # ==================== UPDATED API ENDPOINT ====================

# # app = FastAPI(
# #     title="🚀 Advanced AI Resume Analyzer",
# #     description="Comprehensive resume analysis with AI insights, ATS scoring, job matching, and career guidance",
# #     version="2.0.1"
# # )

# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["*"],
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# # class ResumeRequest(BaseModel):
# #     resume_text: str

# # class CoverLetterRequest(BaseModel):
# #     resume_text: str
# #     job_title: str
# #     company_name: str

# # # ==================== API ENDPOINTS ====================

# # @app.get("/", tags=["Home"])
# # async def home():
# #     return {
# #         "message": "🚀 Welcome to Advanced AI Resume Analyzer",
# #         "version": "2.0.1 - FIXED",
# #         "features": [
# #             "Resume Classification",
# #             "ATS Score Analysis", 
# #             "Skill Gap Analysis",
# #             "AI-Powered Job Search (FIXED)",
# #             "Cover Letter Generation",
# #             "Interview Preparation",
# #             "Multi-Platform Job Search"
# #         ]
# #     }

# # @app.post("/analyze_and_search_jobs", tags=["Job Search"])
# # async def analyze_and_search_jobs(
# #     resume_file: UploadFile = File(...),
# #     location: str = "USA",
# #     num_jobs: int = 10
# # ):
# #     """
# #     🔍 FIXED: ANALYZE RESUME + AUTO OPEN LINKEDIN JOBS
# #     Now properly opens browser with job search results
# #     """
# #     try:
# #         # Extract resume text
# #         resume_bytes = await resume_file.read()
# #         pdf_file = BytesIO(resume_bytes)
# #         pdf_reader = PyPDF2.PdfReader(pdf_file)
# #         resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
        
# #         # Predict category
# #         cleaned_resume = cleanResume(resume_text)
# #         vectorized_text = tfidf.transform([cleaned_resume])
# #         predicted_category_index = model.predict(vectorized_text)[0]
# #         predicted_category_name = le.inverse_transform([predicted_category_index])[0]
# #         confidence = model.predict_proba(vectorized_text)[0][predicted_category_index]
        
# #         # Parse resume
# #         parsed_data = parse_resume_with_groq(resume_text)
        
# #         print(f"\n{'='*60}")
# #         print(f"🎯 PREDICTED JOB CATEGORY: {predicted_category_name}")
# #         print(f"📊 Confidence: {confidence*100:.2f}%")
# #         print(f"{'='*60}")
        
# #         # Search jobs (opens browser)
# #         job_listings = find_jobs_with_selenium(predicted_category_name, location, num_jobs)
        
# #         return {
# #             "success": True,
# #             "classification": {
# #                 "predicted_category": predicted_category_name,
# #                 "confidence": f"{confidence * 100:.2f}%"
# #             },
# #             "parsed_resume": json.loads(parsed_data),
# #             "job_search": {
# #                 "search_query": predicted_category_name,
# #                 "location": location,
# #                 "jobs_found": len(job_listings),
# #                 "job_listings": job_listings,
# #                 "browser_status": "Opened and displayed for 120 seconds"
# #             }
# #         }
        
# #     except Exception as e:
# #         return {
# #             "success": False,
# #             "error": str(e),
# #             "troubleshooting": [
# #                 "Make sure Chrome browser is installed",
# #                 "Check if ChromeDriver is compatible with your Chrome version",
# #                 "Try running: pip install --upgrade undetected-chromedriver"
# #             ]
# #         }

# # @app.post("/search_multiple_platforms", tags=["Job Search"])
# # async def search_multiple_platforms(
# #     resume_file: UploadFile = File(...),
# #     location: str = "USA"
# # ):
# #     """
# #     🌐 Search jobs on Indeed, Glassdoor, and Naukri simultaneously (STABLE)
# #     """
# #     try:
# #         # 1. Extract Resume Text
# #         resume_bytes = await resume_file.read()
# #         pdf_file = BytesIO(resume_bytes)
# #         pdf_reader = PyPDF2.PdfReader(pdf_file)
# #         resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
        
# #         # 2. Predict Category (Using your existing model)
# #         cleaned_resume = cleanResume(resume_text)
# #         vectorized_text = tfidf.transform([cleaned_resume])
# #         predicted_category_index = model.predict(vectorized_text)[0]
# #         predicted_category_name = le.inverse_transform([predicted_category_index])[0]
        
# #         print(f"\n🎯 Category Detected: {predicted_category_name}")
# #         print("🌐 Launching multi-tab browser...")
        
# #         # 3. Run the Search in Background Task or Main Thread
# #         # Note: Since this opens a GUI, we run it directly. 
# #         # For production, you might want BackgroundTasks, but for local tools, this is fine.
# #         search_jobs_alternative_sites(predicted_category_name, location)
        
# #         return {
# #             "success": True,
# #             "predicted_category": predicted_category_name,
# #             "platforms": ["LinkedIn", "Indeed", "Glassdoor", "Naukri"],
# #             "status": "Browser opened successfully"
# #         }
        
# #     except Exception as e:
# #         return {"success": False, "error": str(e)}
# # # ==================== FASTAPI APPLICATION ====================

# # @app.post("/comprehensive_analysis", tags=["Advanced Analysis"])
# # async def comprehensive_analysis(resume_file: UploadFile = File(...)):
# #     """Complete resume analysis without job search"""
# #     try:
# #         resume_bytes = await resume_file.read()
# #         pdf_file = BytesIO(resume_bytes)
# #         pdf_reader = PyPDF2.PdfReader(pdf_file)
# #         resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
        
# #         cleaned_resume = cleanResume(resume_text)
# #         vectorized_text = tfidf.transform([cleaned_resume])
# #         predicted_category_index = model.predict(vectorized_text)[0]
# #         predicted_category_name = le.inverse_transform([predicted_category_index])[0]
# #         confidence = model.predict_proba(vectorized_text)[0][predicted_category_index]
        
# #         ats_score, ats_issues = calculate_ats_score(resume_text)
# #         skills_data = extract_skills(resume_text)
# #         gap_data = gap_analysis(resume_text, predicted_category_name)
# #         parsed_data = parse_resume_with_groq(resume_text)
# #         suggestions = suggest_improvements(resume_text, ats_score, skills_data)
        
# #         return {
# #             "success": True,
# #             "analysis_timestamp": datetime.now().isoformat(),
# #             "classification": {
# #                 "predicted_category": predicted_category_name,
# #                 "confidence": f"{confidence * 100:.2f}%"
# #             },
# #             "ats_analysis": {
# #                 "score": ats_score,
# #                 "grade": "Excellent" if ats_score >= 80 else "Good" if ats_score >= 60 else "Needs Improvement",
# #                 "issues": ats_issues
# #             },
# #             "skills_analysis": skills_data,
# #             "gap_analysis": gap_data,
# #             "parsed_resume": json.loads(parsed_data),
# #             "improvement_suggestions": suggestions
# #         }
        
# #     except Exception as e:
# #         return {"success": False, "error": str(e)}

# # @app.post("/generate_cover_letter", tags=["AI Career Tools"])
# # async def create_cover_letter(request: CoverLetterRequest):
# #     """Generate AI-powered personalized cover letter"""
# #     try:
# #         cover_letter = generate_cover_letter(
# #             request.resume_text,
# #             request.job_title,
# #             request.company_name
# #         )
        
# #         return {
# #             "success": True,
# #             "cover_letter": cover_letter,
# #             "job_title": request.job_title,
# #             "company_name": request.company_name,
# #             "generated_at": datetime.now().isoformat()
# #         }
# #     except Exception as e:
# #         return {"success": False, "error": str(e)}

# # @app.post("/interview_preparation", tags=["AI Career Tools"])
# # async def prepare_interview(resume_file: UploadFile = File(...)):
# #     """Generate personalized interview questions"""
# #     try:
# #         resume_bytes = await resume_file.read()
# #         pdf_file = BytesIO(resume_bytes)
# #         pdf_reader = PyPDF2.PdfReader(pdf_file)
# #         resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
        
# #         cleaned_resume = cleanResume(resume_text)
# #         vectorized_text = tfidf.transform([cleaned_resume])
# #         predicted_category_index = model.predict(vectorized_text)[0]
# #         predicted_category_name = le.inverse_transform([predicted_category_index])[0]
        
# #         interview_data = generate_interview_prep(resume_text, predicted_category_name)
        
# #         return {
# #             "success": True,
# #             "job_category": predicted_category_name,
# #             "interview_preparation": json.loads(interview_data),
# #             "tips": [
# #                 "Research the company thoroughly",
# #                 "Prepare examples using STAR method",
# #                 "Practice answers out loud",
# #                 "Prepare thoughtful questions for interviewer"
# #             ]
# #         }
# #     except Exception as e:
# #         return {"success": False, "error": str(e)}

# # @app.get("/supported_categories", tags=["Information"])
# # async def get_supported_categories():
# #     """Get list of all supported job categories"""
# #     return {
# #         "total_categories": len(category_classes),
# #         "categories": category_classes.tolist()
# #     }

# # if __name__ == "__main__":
# #     print("\n" + "="*60)
# #     print("🚀 ADVANCED AI RESUME ANALYZER v2.0.1 - FIXED")
# #     print("="*60)
# #     print("📍 Server: http://localhost:8000")
# #     print("📚 API Docs: http://localhost:8000/docs")
# #     print("✅ Job Search: FIXED - Now opens browser properly")
# #     print("="*60 + "\n")
    
# #     uvicorn.run(app, host="0.0.0.0", port=8000)
# import pickle
# import uvicorn
# from fastapi import FastAPI, Request, UploadFile, File, BackgroundTasks
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import Dict, Any, List, Optional
# import undetected_chromedriver as uc
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from selenium.webdriver.common.keys import Keys
# import time
# from selenium.webdriver.chrome.options import Options
# import random
# import os
# from groq import Groq
# import PyPDF2
# from io import BytesIO
# import re
# import json
# from datetime import datetime
# import nltk
# import numpy as np
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# # Initialize Groq client
# client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# # Download required NLTK data
# try:
#     nltk.data.find('tokenizers/punkt')
# except LookupError:
#     nltk.download('punkt')
#     nltk.download('stopwords')

# # ==================== UTILITY FUNCTIONS ====================

# def cleanResume(txt):
#     """Enhanced resume cleaning"""
#     cleanText = re.sub('http\S+\s', ' ', txt)
#     cleanText = re.sub('RT|cc', ' ', cleanText)
#     cleanText = re.sub('#\S+\s', ' ', cleanText)
#     cleanText = re.sub('@\S+', ' ', cleanText)
#     cleanText = re.sub('[%s]' % re.escape("""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', cleanText)
#     cleanText = re.sub(r'[^\x00-\x7f]', ' ', cleanText)
#     cleanText = re.sub('\s+', ' ', cleanText)
#     return cleanText.strip()

# def calculate_ats_score(resume_text):
#     """Calculate ATS compatibility score (Rule-based baseline)"""
#     score = 100
#     issues = []
    
#     # Basic Checks
#     if not re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text):
#         score -= 10
#         issues.append("Missing email address")
    
#     if not re.search(r'\+?\d[\d\s\-\(\)]{8,}\d', resume_text):
#         score -= 10
#         issues.append("Missing phone number")
        
#     sections = ['experience', 'education', 'skills', 'projects']
#     found_sections = sum(1 for section in sections if section.lower() in resume_text.lower())
#     if found_sections < 3:
#         score -= 15
#         issues.append(f"Missing key sections (found {found_sections}/4)")

#     word_count = len(resume_text.split())
#     if word_count < 200:
#         score -= 15
#         issues.append("Resume too short")
    
#     return max(0, score), issues

# def clean_json_response(response_text):
#     """Helper to clean LLM markdown response to pure JSON"""
#     if "```json" in response_text:
#         response_text = response_text.split("```json")[1].split("```")[0]
#     elif "```" in response_text:
#         response_text = response_text.split("```")[1].split("```")[0]
#     return response_text.strip()

# # ==================== ADVANCED AI FUNCTIONS (DYNAMIC) ====================

# def extract_skills_advanced(resume_text):
#     """
#     AI-Driven Skill Extraction (No hardcoded lists).
#     Identifies specific tech stacks, tools, and soft skills contextually.
#     """
#     prompt = f"""
#     Analyze the following resume text and extract all professional skills.
#     Categorize them strictly into: 
#     1. 'technical_skills' (Programming languages, core technologies)
#     2. 'tools_and_frameworks' (Libraries, software, platforms like AWS/Docker)
#     3. 'soft_skills' (Interpersonal, leadership)
    
#     Return ONLY a valid JSON object with these keys. Do not add markdown formatting.
    
#     Resume:
#     {resume_text[:2000]}
#     """
    
#     try:
#         chat_completion = client.chat.completions.create(
#             messages=[{"role": "user", "content": prompt}],
#             model="llama-3.3-70b-versatile",
#             response_format={"type": "json_object"}
#         )
#         return json.loads(chat_completion.choices[0].message.content)
#     except Exception as e:
#         return {
#             "technical_skills": [],
#             "tools_and_frameworks": [],
#             "soft_skills": [],
#             "error": str(e)
#         }

# def gap_analysis_chain(resume_text, predicted_category):
#     """
#     Advanced Chain-Wise Logic:
#     1. Takes the ML-Predicted Category.
#     2. Uses AI to compare the Resume vs. Industry Standards for THAT specific category.
#     """
#     prompt = f"""
#     Act as a Senior Technical Recruiter. 
#     The Machine Learning model has classified this candidate's resume as: '{predicted_category}'.
    
#     Perform a Gap Analysis comparing this resume specifically against modern 2024/2025 industry standards for a '{predicted_category}' role.
    
#     Return a JSON object with:
#     1. 'missing_critical_skills': List of high-priority skills missing for this specific role.
#     2. 'recommended_projects': 2 specific project ideas to bridge these gaps.
#     3. 'skill_match_percentage': An estimated integer score (0-100) based on role fit.
    
#     Resume Text:
#     {resume_text[:2000]}
#     """
    
#     try:
#         chat_completion = client.chat.completions.create(
#             messages=[{"role": "user", "content": prompt}],
#             model="llama-3.3-70b-versatile",
#             response_format={"type": "json_object"}
#         )
#         return json.loads(chat_completion.choices[0].message.content)
#     except Exception as e:
#         return {"error": str(e), "skill_match_percentage": 0}

# def suggest_improvements_advanced(resume_text, ats_score, gap_data):
#     """Generate suggestions based on the AI gap analysis"""
#     suggestions = []
    
#     if ats_score < 70:
#         suggestions.append("⚠️ Improve ATS formatting (headers, contact info).")
        
#     if gap_data.get('missing_critical_skills'):
#         missing = ", ".join(gap_data['missing_critical_skills'][:3])
#         suggestions.append(f"💡 Critical Skills Missing: Acquire knowledge in {missing}.")
        
#     if len(resume_text.split()) < 300:
#         suggestions.append("📝 Resume is brief. Expand on project details using STAR method.")
        
#     return suggestions

# # ==================== LOAD ML MODELS ====================

# try:
#     with open('tfidf_advanced.pkl', 'rb') as f:
#         tfidf = pickle.load(f)
#     with open('clf_advanced.pkl', 'rb') as f:
#         model = pickle.load(f)
#     with open('encoder_advanced.pkl', 'rb') as f:
#         le = pickle.load(f)
# except FileNotFoundError:
#     print("❌ Error: ML Model files (pkl) not found. Please ensure tfidf_advanced.pkl, clf_advanced.pkl, and encoder_advanced.pkl exist.")
#     exit()

# # ==================== GROQ PARSING ====================

# def parse_resume_with_groq(resume_text):
#     prompt = f"""
#     Extract the following from the resume as JSON:
#     name, email, phone, current_role, total_experience_years (number), education (list), experience_summary.
    
#     Resume:
#     {resume_text[:2000]}
#     """
#     try:
#         chat_completion = client.chat.completions.create(
#             messages=[{"role": "user", "content": prompt}],
#             model="llama-3.3-70b-versatile",
#             response_format={"type": "json_object"}
#         )
#         return chat_completion.choices[0].message.content
#     except Exception as e:
#         return json.dumps({"error": str(e)})

# # ==================== SELENIUM SEARCH ====================

# def find_jobs_with_selenium(keywords, location="USA", num_jobs=10):
#     """Opens browser and searches jobs"""
#     print(f"\n🔍 Searching for: {keywords}")
#     options = uc.ChromeOptions()
#     options.add_argument("--start-maximized")
#     options.add_argument("--disable-popup-blocking")
    
#     driver = None
#     job_listings = []
    
#     try:
#         driver = uc.Chrome(options=options)
        
#         # LinkedIn Search URL
#         search_keywords = keywords.replace(" ", "%20")
#         search_location = location.replace(" ", "%20")
#         url = f"https://www.linkedin.com/jobs/search/?keywords={search_keywords}&location={search_location}"
        
#         driver.get(url)
#         time.sleep(5)
        
#         # Simple extraction logic
#         jobs = driver.find_elements(By.CLASS_NAME, "job-search-card")[:num_jobs]
#         for idx, job in enumerate(jobs, 1):
#             try:
#                 title = job.find_element(By.CLASS_NAME, "base-search-card__title").text.strip()
#                 company = job.find_element(By.CLASS_NAME, "base-search-card__subtitle").text.strip()
#                 link = job.find_element(By.CSS_SELECTOR, "a.base-card__full-link").get_attribute("href")
#                 job_listings.append({"title": title, "company": company, "link": link})
#             except:
#                 continue
                
#         print(f"✅ Browser opened with {len(job_listings)} jobs. Keeping open for 60s.")
#         time.sleep(60) 
        
#     except Exception as e:
#         print(f"Search Error: {e}")
#     finally:
#         if driver:
#             driver.quit()
    
#     return job_listings

# # ==================== API SETUP ====================

# app = FastAPI(title="🚀 Advanced AI Resume Analyzer", version="3.0.0")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class CoverLetterRequest(BaseModel):
#     resume_text: str
#     job_title: str
#     company_name: str

# # ==================== API ENDPOINTS ====================

# @app.post("/comprehensive_analysis", tags=["Advanced Analysis"])
# async def comprehensive_analysis(resume_file: UploadFile = File(...)):
#     """
#     Advanced Logic Flow:
#     1. Clean Text
#     2. ML Model predicts Job Category (from .pkl)
#     3. Category is passed to AI for Contextual Gap Analysis
#     4. AI extracts dynamic skills
#     """
#     try:
#         # 1. Read & Clean
#         resume_bytes = await resume_file.read()
#         pdf_reader = PyPDF2.PdfReader(BytesIO(resume_bytes))
#         resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
#         cleaned_resume = cleanResume(resume_text)
        
#         # 2. ML Prediction (Strictly using .pkl models)
#         vectorized_text = tfidf.transform([cleaned_resume])
#         predicted_category_index = model.predict(vectorized_text)[0]
#         predicted_category_name = le.inverse_transform([predicted_category_index])[0]
#         confidence = float(model.predict_proba(vectorized_text)[0][predicted_category_index])
        
#         print(f"🎯 ML Prediction: {predicted_category_name} ({confidence:.2f})")
        
#         # 3. Advanced AI Extraction (Dynamic, not hardcoded)
#         # We perform these calls in parallel concept (or sequential here for safety)
#         parsed_data_json = parse_resume_with_groq(resume_text)
#         skills_data_advanced = extract_skills_advanced(resume_text)
        
#         # 4. Chain-Wise Gap Analysis
#         # We pass the ML Result (predicted_category_name) into the AI Prompt
#         gap_analysis_data = gap_analysis_chain(resume_text, predicted_category_name)
        
#         # 5. Compile Results
#         ats_score, ats_issues = calculate_ats_score(resume_text)
#         suggestions = suggest_improvements_advanced(resume_text, ats_score, gap_analysis_data)
        
#         return {
#             "success": True,
#             "timestamp": datetime.now().isoformat(),
#             "classification": {
#                 "predicted_category": predicted_category_name,
#                 "confidence": f"{confidence * 100:.2f}%",
#                 "method": "Hybrid (TF-IDF ML + AI Verification)"
#             },
#             "ats_analysis": {
#                 "score": ats_score,
#                 "issues": ats_issues
#             },
#             "advanced_skills_analysis": skills_data_advanced,
#             "role_specific_gap_analysis": gap_analysis_data,
#             "improvement_plan": suggestions,
#             "parsed_details": json.loads(parsed_data_json)
#         }
        
#     except Exception as e:
#         return {"success": False, "error": str(e)}

# @app.post("/analyze_and_search_jobs", tags=["Job Search"])
# async def analyze_and_search_jobs(
#     resume_file: UploadFile = File(...),
#     location: str = "USA",
#     num_jobs: int = 10
# ):
#     try:
#         # Read
#         resume_bytes = await resume_file.read()
#         pdf_reader = PyPDF2.PdfReader(BytesIO(resume_bytes))
#         resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
        
#         # ML Predict
#         cleaned_resume = cleanResume(resume_text)
#         vectorized_text = tfidf.transform([cleaned_resume])
#         predicted_category_name = le.inverse_transform([model.predict(vectorized_text)])[0]
        
#         # Search
#         listings = find_jobs_with_selenium(predicted_category_name, location, num_jobs)
        
#         return {
#             "success": True,
#             "category": predicted_category_name,
#             "jobs": listings
#         }
#     except Exception as e:
#         return {"success": False, "error": str(e)}

# if __name__ == "__main__":
#     print("🚀 Starting Advanced Resume Analyzer v3.0...")
#     uvicorn.run(app, host="0.0.0.0", port=8000)