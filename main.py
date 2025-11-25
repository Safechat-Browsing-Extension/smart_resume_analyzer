
import pickle
import uvicorn
from fastapi import FastAPI, Request, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import random
import os
from groq import Groq
import PyPDF2
from io import BytesIO
import re
import json
from datetime import datetime
import nltk
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

try:
    with open('tfidf_advanced.pkl', 'rb') as f:
        tfidf = pickle.load(f)
    with open('clf_advanced.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('encoder_advanced.pkl', 'rb') as f:
        le = pickle.load(f)
    category_classes = le.classes_
except FileNotFoundError:
    print("Error: Model files not found. Please ensure .pkl files are in the directory.")
    # Create dummy objects for testing if files are missing (REMOVE IN PRODUCTION)
    class Dummy: 
        def predict(self, x): return [0]
        def predict_proba(self, x): return [[0.99]]
        def transform(self, x): return x
    class DummyLE:
        def inverse_transform(self, x): return ["Software Engineer"]
        classes_ = ["Software Engineer"]
    
    tfidf = Dummy()
    model = Dummy()
    le = DummyLE()


def cleanResume(txt):
    """Enhanced resume cleaning with better text processing"""
    cleanText = re.sub('http\S+\s', ' ', txt)
    cleanText = re.sub('RT|cc', ' ', cleanText)
    cleanText = re.sub('#\S+\s', ' ', cleanText)
    cleanText = re.sub('@\S+', ' ', cleanText)
    cleanText = re.sub('[%s]' % re.escape("""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', cleanText)
    cleanText = re.sub(r'[^\x00-\x7f]', ' ', cleanText)
    cleanText = re.sub('\s+', ' ', cleanText)
    return cleanText.strip()

def calculate_ats_score(resume_text):
    """Calculate ATS compatibility score (Rule-based)"""
    score = 100
    issues = []
    if not re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text):
        score -= 10
        issues.append("Missing email address")

    if not re.search(r'\+?\d[\d\s\-\(\)]{8,}\d', resume_text):
        score -= 10
        issues.append("Missing phone number")
    
    word_count = len(resume_text.split())
    if word_count < 200:
        score -= 15
        issues.append("Resume too short")
    elif word_count > 1500:
        score -= 10
        issues.append("Resume too long")
    
    return max(0, score), issues
def advanced_skill_gap_chain(resume_text, predicted_category):
    """
    CHAIN LOGIC: 
    1. Receives the Job Category from the Pickle Model.
    2. Uses AI to dynamically extract skills and perform gap analysis based on that specific category.
    3. Replaces hardcoded lists with LLM intelligence.
    """
    
    prompt = f"""
    You are an expert technical recruiter and career coach. 
    
    CONTEXT:
    A Machine Learning model has classified this resume as a '{predicted_category}' profile.
    
    TASK:
    Based on the resume text below and the industry standards for a Senior '{predicted_category}' role:
    
    1. Extract all Technical Skills found in the text.
    2. Extract all Soft Skills found in the text.
    3. Perform a Gap Analysis: Compare the user's skills against the CURRENT 2024/2025 market requirements for a '{predicted_category}'.
    4. Provide specific improvement suggestions.

    RESUME TEXT:
    {resume_text[:2500]}

    OUTPUT FORMAT (Strict JSON):
    {{
        "extracted_skills": {{
            "technical": ["skill1", "skill2"],
            "soft": ["skill1", "skill2"],
            "total_count": int
        }},
        "gap_analysis": {{
            "job_category_analyzed": "{predicted_category}",
            "critical_missing_skills": ["skill_A", "skill_B"],
            "recommended_learning_path": ["Topic 1", "Topic 2"],
            "market_alignment_score": int (0-100)
        }},
        "strategic_advice": ["tip 1", "tip 2"]
    }}
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a precise data extractor that outputs only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"AI Chain Error: {e}")
        return {
            "extracted_skills": {"technical": [], "soft": [], "total_count": 0},
            "gap_analysis": {"error": "AI Service Unavailable"},
            "strategic_advice": ["Please try again later."]
        }

def generate_cover_letter(resume_text, job_title, company_name):
    """AI-generated personalized cover letter"""
    prompt = f"""
    Based on this resume, generate a professional cover letter for the position of {job_title} at {company_name}.
    Keep it concise (250 words) and professional.
    
    Resume:
    {resume_text[:1500]}
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile"
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Error generating cover letter: {str(e)}"
def search_jobs_alternative_sites(keywords, location="USA"):
    """Opens browser tabs for job search (Stable Version)"""
    options = uc.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-popup-blocking") 
    
    driver = None
    try:
        driver = uc.Chrome(options=options)
        sites = [
            f"https://www.linkedin.com/jobs/search/?keywords={keywords}&location={location}",
            f"https://www.indeed.com/jobs?q={keywords.replace(' ', '+')}&l={location}",
            f"https://www.glassdoor.com/Job/jobs.htm?sc.keyword={keywords.replace(' ', '+')}"
        ]
        driver.get(sites[0])
        for i in range(1, len(sites)):
            driver.execute_script("window.open('about:blank', '_blank');")
            time.sleep(1)
            driver.switch_to.window(driver.window_handles[-1])
            driver.get(sites[i])
        time.sleep(180)
    except Exception as e:
        print(f"Selenium Error: {e}")
    finally:
        if driver:
            try: driver.quit()
            except: pass
app = FastAPI(
    title="🚀 Advanced AI Resume Analyzer (Chain-Enhanced)",
    description="Resume analysis using Hybrid ML (Pickle) + LLM Chain",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CoverLetterRequest(BaseModel):
    resume_text: str
    job_title: str
    company_name: str

@app.post("/comprehensive_analysis", tags=["Advanced Analysis"])
async def comprehensive_analysis(resume_file: UploadFile = File(...)):
    """
    THE ADVANCED PIPELINE:
    1. PDF -> Text
    2. Text -> TFIDF -> Pickle Model -> Predicted Category (Offline ML)
    3. Category + Text -> Groq Chain -> Dynamic Skills & Gap Analysis (GenAI)
    """
    try:
        resume_bytes = await resume_file.read()
        pdf_file = BytesIO(resume_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
        cleaned_resume = cleanResume(resume_text)
        vectorized_text = tfidf.transform([cleaned_resume])
        predicted_category_index = model.predict(vectorized_text)[0]
        predicted_category_name = le.inverse_transform([predicted_category_index])[0]
        confidence = model.predict_proba(vectorized_text)[0][predicted_category_index]
        
        print(f"🤖 Model Prediction: {predicted_category_name} ({confidence:.2f})")
        ats_score, ats_issues = calculate_ats_score(resume_text)
        ai_insights = advanced_skill_gap_chain(resume_text, predicted_category_name)
        
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "classification": {
                "predicted_category": predicted_category_name,
                "confidence_score": f"{confidence * 100:.2f}%",
                "method": "Hybrid (TF-IDF + Random Forest)"
            },
            "ats_metrics": {
                "score": ats_score,
                "issues": ats_issues
            },
            "dynamic_analysis": {
                "skills_detected": ai_insights.get("extracted_skills"),
                "gap_analysis": ai_insights.get("gap_analysis"),
                "strategic_advice": ai_insights.get("strategic_advice")
            }
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/search_jobs_multi", tags=["Job Search"])
async def search_jobs_multi(
    resume_file: UploadFile = File(...),
    location: str = "USA"
):
    """Analyzes resume via ML and opens job searches automatically"""
    try:
        resume_bytes = await resume_file.read()
        pdf_reader = PyPDF2.PdfReader(BytesIO(resume_bytes))
        resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
        cleaned = cleanResume(resume_text)
        vec = tfidf.transform([cleaned])
        category = le.inverse_transform([model.predict(vec)[0]])[0]
        search_jobs_alternative_sites(category, location)
        
        return {"success": True, "category": category, "status": "Browser Opened"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/generate_cover_letter", tags=["Tools"])
async def api_cover_letter(req: CoverLetterRequest):
    res = generate_cover_letter(req.resume_text, req.job_title, req.company_name)
    return {"success": True, "cover_letter": res}

if __name__ == "__main__":
    print("🚀 ADVANCED AI RESUME ANALYZER STARTING...")
    uvicorn.run(app, host="0.0.0.0", port=8000)