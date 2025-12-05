
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

# --- 1. SETUP & CONFIGURATION ---
load_dotenv()

# Check for API Key
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY not found in environment variables!")

client = Groq(api_key=api_key)

# NLTK Setup
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

# Load ML Models
try:
    with open('tfidf_advanced.pkl', 'rb') as f:
        tfidf = pickle.load(f)
    with open('clf_advanced.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('encoder_advanced.pkl', 'rb') as f:
        le = pickle.load(f)
    category_classes = le.classes_
except FileNotFoundError:
    print("⚠️ Error: Model files not found. Using Dummy models for testing.")
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

# --- 2. PRIVACY & SECURITY LAYER (NEW) ---
class PIIScrubber:
    """
    Handles the redaction of sensitive data before it is sent to the AI.
    This ensures user privacy by keeping PII local.
    """
    @staticmethod
    def scrub(text):
        # 1. Redact Email Addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        text = re.sub(email_pattern, "[EMAIL_REDACTED]", text)

        # 2. Redact Phone Numbers (US/Intl formats)
        phone_pattern = r'(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}'
        text = re.sub(phone_pattern, "[PHONE_REDACTED]", text)

        # 3. Redact Specific Social Links (LinkedIn/Github profiles often contain names)
        url_pattern = r'https?://(www\.)?(linkedin|github)\.com/[\w-]+'
        text = re.sub(url_pattern, "[PROFILE_URL_REDACTED]", text)

        return text

# Initialize Scrubber
pii_scrubber = PIIScrubber()

# --- 3. HELPER FUNCTIONS ---

def cleanResume(txt):
    """Enhanced resume cleaning for ML classification"""
    cleanText = re.sub('http\S+\s', ' ', txt)
    cleanText = re.sub('RT|cc', ' ', cleanText)
    cleanText = re.sub('#\S+\s', ' ', cleanText)
    cleanText = re.sub('@\S+', ' ', cleanText)
    cleanText = re.sub('[%s]' % re.escape("""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', cleanText)
    cleanText = re.sub(r'[^\x00-\x7f]', ' ', cleanText)
    cleanText = re.sub('\s+', ' ', cleanText)
    return cleanText.strip()

def advanced_skill_gap_chain(resume_text, predicted_category):
    """
    Performs AI analysis on ANONYMIZED text.
    """
    
    # [PRIVACY STEP] Scrub PII before sending to AI
    anonymized_text = pii_scrubber.scrub(resume_text)
    
    prompt = f"""
    You are an expert technical recruiter and career coach. 
    
    CONTEXT:
    A Machine Learning model has classified this resume as a '{predicted_category}' profile.
    
    TASK:
    Based on the resume text below and the industry standards for a Senior '{predicted_category}' role:
    
    1. Extract all Technical Skills found in the text.
    2. Extract all Soft Skills found in the text.
    3. Perform a Gap Analysis: Compare the user's skills against the CURRENT 2025 market requirements.
    4. Provide specific improvement suggestions.

    IMPORTANT: The resume text has been anonymized (emails/phones removed). 
    Focus only on skills and experience.

    RESUME TEXT:
    {anonymized_text[:2500]}

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
    """AI-generated personalized cover letter with PRIVACY PROTECTION"""
    
    # [PRIVACY STEP] Scrub PII
    anonymized_text = pii_scrubber.scrub(resume_text)

    prompt = f"""
    Based on this ANONYMIZED resume, generate a professional cover letter for the position of {job_title} at {company_name}.
    
    PRIVACY INSTRUCTIONS:
    1. The resume text has [REDACTED] placeholders for email and phone.
    2. Do NOT invent a name or contact info. 
    3. Use placeholders like "[Candidate Name]", "[Your Email]", and "[Your Phone]" in the letter header and signature.
    4. Keep it concise (250 words).
    
    Resume:
    {anonymized_text[:1500]}
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
        driver = uc.Chrome(options=options, version_main=142) # Adjust version if needed
        
        sites = [
            f"https://www.linkedin.com/jobs/search/?keywords={keywords}&location={location}",
            f"https://www.indeed.com/jobs?q={keywords.replace(' ', '+')}&l={location}",
            f"https://www.glassdoor.com/Job/jobs.htm?sc.keyword={keywords.replace(' ', '+')}"
        ]
        
        # Navigate to the first site
        driver.get(sites[0])
        
        # Open the rest in new tabs
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

# --- 4. API ENDPOINTS ---

app = FastAPI(
    title="🚀 Advanced AI Resume Analyzer (Privacy Enhanced)",
    description="Resume analysis using Hybrid ML + LLM Chain with PII Redaction",
    version="3.1.0"
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
    try:
        # 1. Read File
        resume_bytes = await resume_file.read()
        pdf_file = BytesIO(resume_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
        
        # 2. Local Classification (Uses Cleaned Text, safe locally)
        cleaned_resume = cleanResume(resume_text)
        vectorized_text = tfidf.transform([cleaned_resume])
        predicted_category_index = model.predict(vectorized_text)[0]
        predicted_category_name = le.inverse_transform([predicted_category_index])[0]
        confidence = model.predict_proba(vectorized_text)[0][predicted_category_index]
        
        print(f"🤖 Model Prediction: {predicted_category_name} ({confidence:.2f})")
        
        # 3. Local ATS Check (Uses Raw Text to check for missing emails, safe locally)
        # ats_score, ats_issues = calculate_ats_score(resume_text)
        
        # 4. AI Analysis (Uses SCRUBBED text to protect privacy)
        # The scrubbing happens inside this function now
        ai_insights = advanced_skill_gap_chain(resume_text, predicted_category_name)
        
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "classification": {
                "predicted_category": predicted_category_name,
                "confidence_score": f"{confidence * 100:.2f}%",
                "method": "Hybrid (TF-IDF + Random Forest)"
            },
            # "ats_metrics": {
            #     "score": ats_score,
            #     "issues": ats_issues
            # },
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
    # The privacy scrubbing happens inside this function
    res = generate_cover_letter(req.resume_text, req.job_title, req.company_name)
    return {"success": True, "cover_letter": res}

if __name__ == "__main__":
    print("🚀 ADVANCED AI RESUME ANALYZER (PRIVACY ENABLED) STARTING...")
    uvicorn.run(app, host="0.0.0.0", port=8000)