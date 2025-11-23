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
from selenium.webdriver.common.keys import Keys
import time
from selenium.webdriver.chrome.options import Options
import random
import os
from groq import Groq
import PyPDF2
from io import BytesIO
import re
import json
from datetime import datetime
import nltk
from collections import Counter
import matplotlib.pyplot as plt
from wordcloud import WordCloud
import base64
from textblob import TextBlob
import numpy as np
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Groq client using the variable
# This is much safer!
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
# Initialize Groq client
# client = Groq(api_key="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")

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

# ==================== UTILITY FUNCTIONS ====================

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
    """Calculate ATS (Applicant Tracking System) compatibility score"""
    score = 100
    issues = []
    
    # Check for email
    if not re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text):
        score -= 10
        issues.append("Missing email address")
    
    # Check for phone number
    if not re.search(r'\+?\d[\d\s\-\(\)]{8,}\d', resume_text):
        score -= 10
        issues.append("Missing phone number")
    
    # Check for common sections
    sections = ['experience', 'education', 'skills', 'projects']
    found_sections = sum(1 for section in sections if section.lower() in resume_text.lower())
    if found_sections < 3:
        score -= 15
        issues.append(f"Missing key sections (found {found_sections}/4)")
    
    # Check for action verbs
    action_verbs = ['developed', 'managed', 'created', 'designed', 'implemented', 'led', 'achieved']
    verb_count = sum(1 for verb in action_verbs if verb.lower() in resume_text.lower())
    if verb_count < 3:
        score -= 10
        issues.append("Limited use of action verbs")
    
    # Check resume length
    word_count = len(resume_text.split())
    if word_count < 200:
        score -= 15
        issues.append("Resume too short")
    elif word_count > 1500:
        score -= 10
        issues.append("Resume too long")
    
    return max(0, score), issues

def extract_skills(resume_text):
    """Extract technical and soft skills from resume"""
    tech_skills = [
        'python', 'java', 'javascript', 'c++', 'sql', 'html', 'css', 'react', 'angular',
        'node', 'django', 'flask', 'mongodb', 'mysql', 'postgresql', 'aws', 'azure',
        'docker', 'kubernetes', 'git', 'machine learning', 'deep learning', 'tensorflow',
        'pytorch', 'data analysis', 'tableau', 'power bi', 'excel', 'r programming'
    ]
    
    soft_skills = [
        'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
        'critical thinking', 'project management', 'time management', 'adaptability'
    ]
    
    found_tech = [skill for skill in tech_skills if skill.lower() in resume_text.lower()]
    found_soft = [skill for skill in soft_skills if skill.lower() in resume_text.lower()]
    
    return {
        "technical_skills": found_tech,
        "soft_skills": found_soft,
        "total_skills_count": len(found_tech) + len(found_soft)
    }

def gap_analysis(resume_text, job_category):
    """Analyze skill gaps for the predicted job category"""
    category_skills_map = {
        "Data Science": ["python", "machine learning", "sql", "statistics", "pandas", "numpy", "scikit-learn"],
        "Web Developer": ["html", "css", "javascript", "react", "node", "api", "responsive design"],
        "Software Engineer": ["algorithms", "data structures", "system design", "git", "testing", "debugging"],
        "DevOps": ["docker", "kubernetes", "ci/cd", "aws", "linux", "terraform", "jenkins"],
        "Data Analyst": ["sql", "excel", "tableau", "power bi", "statistics", "data visualization"]
    }
    
    required_skills = category_skills_map.get(job_category, [])
    resume_lower = resume_text.lower()
    
    present_skills = [skill for skill in required_skills if skill in resume_lower]
    missing_skills = [skill for skill in required_skills if skill not in resume_lower]
    
    return {
        "job_category": job_category,
        "required_skills": required_skills,
        "present_skills": present_skills,
        "missing_skills": missing_skills,
        "skill_match_percentage": round((len(present_skills) / len(required_skills) * 100), 2) if required_skills else 0
    }

def suggest_improvements(resume_text, ats_score, skills_data):
    """AI-powered resume improvement suggestions"""
    suggestions = []
    
    if ats_score < 70:
        suggestions.append("⚠️ Your ATS score is low. Focus on adding missing sections and contact information.")
    
    if skills_data['total_skills_count'] < 5:
        suggestions.append("💡 Add more relevant skills to match job requirements better.")
    
    if len(resume_text.split()) < 300:
        suggestions.append("📝 Expand your resume with more details about your achievements and responsibilities.")
    
    numbers = re.findall(r'\b\d+%|\b\d+\+|\b\d+x', resume_text)
    if len(numbers) < 3:
        suggestions.append("📊 Add quantifiable achievements (e.g., 'Increased sales by 30%') to demonstrate impact.")
    
    return suggestions

# ==================== LOAD ML MODELS ====================

try:
    with open('tfidf_advanced.pkl', 'rb') as f:
        tfidf = pickle.load(f)
    with open('clf_advanced.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('encoder_advanced.pkl', 'rb') as f:
        le = pickle.load(f)
    category_classes = le.classes_
except FileNotFoundError:
    print("Error: Model files not found.")
    exit()

# ==================== GROQ AI FUNCTIONS ====================

def parse_resume_with_groq(resume_text):
    """Enhanced resume parsing with Groq AI"""
    prompt = f"""
    You are an expert resume parser and career advisor. Analyze the following resume comprehensively and extract:
    1. Candidate's name, email, phone number
    2. Current job title or desired position
    3. Years of experience
    4. Education details (degree, institution, year)
    5. Top 5-7 key skills
    6. Summary of experience highlighting major achievements
    7. Notable projects or certifications
    
    Format output as a JSON object with keys: 'name', 'email', 'phone', 'current_title', 
    'years_of_experience', 'education', 'key_skills', 'experience_summary', 'projects_certifications'.
    
    Resume Text:
    {resume_text}
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return json.dumps({"error": str(e)})

def generate_cover_letter(resume_text, job_title, company_name):
    """AI-generated personalized cover letter"""
    prompt = f"""
    Based on this resume, generate a professional cover letter for the position of {job_title} at {company_name}.
    Make it personalized, highlighting relevant skills and experiences from the resume.
    Keep it concise (250-300 words) and professional.
    
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

def generate_interview_prep(resume_text, job_category):
    """Generate personalized interview questions based on resume"""
    prompt = f"""
    Based on this {job_category} resume, generate:
    1. 5 technical interview questions the candidate should prepare for
    2. 3 behavioral questions based on their experience
    3. 2 questions they should ask the interviewer
    
    Format as JSON with keys: 'technical_questions', 'behavioral_questions', 'questions_to_ask'.
    
    Resume:
    {resume_text[:1500]}
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return json.dumps({"error": str(e)})

# ==================== SELENIUM JOB SEARCH (FIXED) ====================

def find_jobs_with_selenium(keywords, location="USA", num_jobs=10):
    """
    🔧 FIXED: Enhanced LinkedIn job search with proper Chrome options
    Opens browser and displays job listings for the user
    """
    print(f"\n🔍 Initializing browser for job search: {keywords}")
    
    # Simplified Chrome options that work with undetected-chromedriver
    options = uc.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    
    # Remove the problematic excludeSwitches option
    driver = None
    
    try:
        # Initialize undetected Chrome with minimal options
        driver = uc.Chrome(options=options, version_main=None)
        
        # Build LinkedIn job search URL
        search_keywords = keywords.replace(" ", "%20")
        search_location = location.replace(" ", "%20")
        search_url = f"https://www.linkedin.com/jobs/search/?keywords={search_keywords}&location={search_location}"
        
        print(f"🌐 Navigating to: {search_url}")
        driver.get(search_url)
        
        # Wait for page to load
        wait = WebDriverWait(driver, 20)
        time.sleep(5)
        
        # Scroll to load more jobs
        print("📜 Loading more job listings...")
        for i in range(3):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(random.uniform(2, 4))
        
        # Extract job listings
        job_listings = []
        try:
            jobs = driver.find_elements(By.CLASS_NAME, "job-search-card")[:num_jobs]
            print(f"✅ Found {len(jobs)} job listings")
            
            for idx, job in enumerate(jobs, 1):
                try:
                    title = job.find_element(By.CLASS_NAME, "base-search-card__title").text
                    company = job.find_element(By.CLASS_NAME, "base-search-card__subtitle").text
                    location_elem = job.find_element(By.CLASS_NAME, "job-search-card__location").text
                    link = job.find_element(By.CSS_SELECTOR, "a.base-card__full-link").get_attribute("href")
                    
                    job_listings.append({
                        "position": idx,
                        "title": title,
                        "company": company,
                        "location": location_elem,
                        "link": link
                    })
                    
                    print(f"  {idx}. {title} at {company}")
                    
                except Exception as job_error:
                    print(f"  ⚠️ Could not parse job {idx}: {str(job_error)}")
                    continue
                    
        except Exception as extract_error:
            print(f"⚠️ Error extracting jobs: {str(extract_error)}")
        
        # Keep browser open for user to explore
        print(f"\n✅ Browser opened with {len(job_listings)} jobs!")
        print("🖱️ Browser will remain open for 120 seconds for you to explore...")
        print("💡 You can click on any job to view details")
        
        time.sleep(120)  # Keep browser open for 2 minutes
        
        return job_listings
        
    except Exception as e:
        print(f"❌ Error in job search: {str(e)}")
        return []
        
    finally:
        if driver:
            print("\n🔒 Closing browser...")
            driver.quit()

# ==================== ROBUST JOB SEARCH FUNCTIONS ====================

def search_jobs_alternative_sites(keywords, location="USA"):
    """
    STABLE VERSION: Opens multiple tabs without crashing.
    """
    options = uc.ChromeOptions()
    options.add_argument("--start-maximized")
    # This helps keep the session stable
    options.add_argument("--disable-popup-blocking") 
    
    driver = None

    try:
        driver = uc.Chrome(options=options)
        
        # Generate URLs
        sites = [
            f"https://www.linkedin.com/jobs/search/?keywords={keywords}&location={location}",
            f"https://www.indeed.com/jobs?q={keywords.replace(' ', '+')}&l={location}",
            f"https://www.glassdoor.com/Job/jobs.htm?sc.keyword={keywords.replace(' ', '+')}",
            f"https://www.naukri.com/{keywords.replace(' ', '-')}-jobs"
        ]
        
        print(f"\n🌐 Opening job search on {len(sites)} platforms...")

        # Open first URL in the existing tab
        try:
            print(f"  1. Opening first tab...")
            driver.get(sites[0])
        except Exception as e:
            print(f"  ❌ Failed to load first site: {e}")

        # Open remaining URLs in new tabs
        for i in range(1, len(sites)):
            url = sites[i]
            try:
                # 1. Execute Javascript to open new tab
                driver.execute_script("window.open('about:blank', '_blank');")
                
                # 2. WAIT for the tab to actually open (Crucial for stability)
                time.sleep(1.5) 
                
                # 3. Switch to the LAST tab (The newest one)
                # usage of [-1] is safer than [i]
                driver.switch_to.window(driver.window_handles[-1])
                
                # 4. Load the URL
                print(f"  {i+1}. Opening tab: {url.split('/')[2]}")
                driver.get(url)
                
            except Exception as e:
                print(f"  ⚠️ Could not open tab {i+1}: {str(e)}")
                # We continue to the next site instead of crashing entirely
                continue

        print(f"\n✅ All tabs opened successfully!")
        print("🖱️ Browser will remain open for 3 minutes (180s)...")
        
        # Keep browser open
        time.sleep(180)

    except Exception as e:
        print(f"❌ Critical Driver Error: {str(e)}")
        
    finally:
        # Only quit if driver exists
        if driver:
            print("\n🔒 Closing browser session...")
            try:
                driver.quit()
            except:
                pass

# ==================== UPDATED API ENDPOINT ====================

app = FastAPI(
    title="🚀 Advanced AI Resume Analyzer",
    description="Comprehensive resume analysis with AI insights, ATS scoring, job matching, and career guidance",
    version="2.0.1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResumeRequest(BaseModel):
    resume_text: str

class CoverLetterRequest(BaseModel):
    resume_text: str
    job_title: str
    company_name: str

# ==================== API ENDPOINTS ====================

@app.get("/", tags=["Home"])
async def home():
    return {
        "message": "🚀 Welcome to Advanced AI Resume Analyzer",
        "version": "2.0.1 - FIXED",
        "features": [
            "Resume Classification",
            "ATS Score Analysis", 
            "Skill Gap Analysis",
            "AI-Powered Job Search (FIXED)",
            "Cover Letter Generation",
            "Interview Preparation",
            "Multi-Platform Job Search"
        ]
    }

@app.post("/analyze_and_search_jobs", tags=["Job Search"])
async def analyze_and_search_jobs(
    resume_file: UploadFile = File(...),
    location: str = "USA",
    num_jobs: int = 10
):
    """
    🔍 FIXED: ANALYZE RESUME + AUTO OPEN LINKEDIN JOBS
    Now properly opens browser with job search results
    """
    try:
        # Extract resume text
        resume_bytes = await resume_file.read()
        pdf_file = BytesIO(resume_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
        
        # Predict category
        cleaned_resume = cleanResume(resume_text)
        vectorized_text = tfidf.transform([cleaned_resume])
        predicted_category_index = model.predict(vectorized_text)[0]
        predicted_category_name = le.inverse_transform([predicted_category_index])[0]
        confidence = model.predict_proba(vectorized_text)[0][predicted_category_index]
        
        # Parse resume
        parsed_data = parse_resume_with_groq(resume_text)
        
        print(f"\n{'='*60}")
        print(f"🎯 PREDICTED JOB CATEGORY: {predicted_category_name}")
        print(f"📊 Confidence: {confidence*100:.2f}%")
        print(f"{'='*60}")
        
        # Search jobs (opens browser)
        job_listings = find_jobs_with_selenium(predicted_category_name, location, num_jobs)
        
        return {
            "success": True,
            "classification": {
                "predicted_category": predicted_category_name,
                "confidence": f"{confidence * 100:.2f}%"
            },
            "parsed_resume": json.loads(parsed_data),
            "job_search": {
                "search_query": predicted_category_name,
                "location": location,
                "jobs_found": len(job_listings),
                "job_listings": job_listings,
                "browser_status": "Opened and displayed for 120 seconds"
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "troubleshooting": [
                "Make sure Chrome browser is installed",
                "Check if ChromeDriver is compatible with your Chrome version",
                "Try running: pip install --upgrade undetected-chromedriver"
            ]
        }

@app.post("/search_multiple_platforms", tags=["Job Search"])
async def search_multiple_platforms(
    resume_file: UploadFile = File(...),
    location: str = "USA"
):
    """
    🌐 Search jobs on Indeed, Glassdoor, and Naukri simultaneously (STABLE)
    """
    try:
        # 1. Extract Resume Text
        resume_bytes = await resume_file.read()
        pdf_file = BytesIO(resume_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
        
        # 2. Predict Category (Using your existing model)
        cleaned_resume = cleanResume(resume_text)
        vectorized_text = tfidf.transform([cleaned_resume])
        predicted_category_index = model.predict(vectorized_text)[0]
        predicted_category_name = le.inverse_transform([predicted_category_index])[0]
        
        print(f"\n🎯 Category Detected: {predicted_category_name}")
        print("🌐 Launching multi-tab browser...")
        
        # 3. Run the Search in Background Task or Main Thread
        # Note: Since this opens a GUI, we run it directly. 
        # For production, you might want BackgroundTasks, but for local tools, this is fine.
        search_jobs_alternative_sites(predicted_category_name, location)
        
        return {
            "success": True,
            "predicted_category": predicted_category_name,
            "platforms": ["LinkedIn", "Indeed", "Glassdoor", "Naukri"],
            "status": "Browser opened successfully"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}
# ==================== FASTAPI APPLICATION ====================

@app.post("/comprehensive_analysis", tags=["Advanced Analysis"])
async def comprehensive_analysis(resume_file: UploadFile = File(...)):
    """Complete resume analysis without job search"""
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
        
        ats_score, ats_issues = calculate_ats_score(resume_text)
        skills_data = extract_skills(resume_text)
        gap_data = gap_analysis(resume_text, predicted_category_name)
        parsed_data = parse_resume_with_groq(resume_text)
        suggestions = suggest_improvements(resume_text, ats_score, skills_data)
        
        return {
            "success": True,
            "analysis_timestamp": datetime.now().isoformat(),
            "classification": {
                "predicted_category": predicted_category_name,
                "confidence": f"{confidence * 100:.2f}%"
            },
            "ats_analysis": {
                "score": ats_score,
                "grade": "Excellent" if ats_score >= 80 else "Good" if ats_score >= 60 else "Needs Improvement",
                "issues": ats_issues
            },
            "skills_analysis": skills_data,
            "gap_analysis": gap_data,
            "parsed_resume": json.loads(parsed_data),
            "improvement_suggestions": suggestions
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/generate_cover_letter", tags=["AI Career Tools"])
async def create_cover_letter(request: CoverLetterRequest):
    """Generate AI-powered personalized cover letter"""
    try:
        cover_letter = generate_cover_letter(
            request.resume_text,
            request.job_title,
            request.company_name
        )
        
        return {
            "success": True,
            "cover_letter": cover_letter,
            "job_title": request.job_title,
            "company_name": request.company_name,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/interview_preparation", tags=["AI Career Tools"])
async def prepare_interview(resume_file: UploadFile = File(...)):
    """Generate personalized interview questions"""
    try:
        resume_bytes = await resume_file.read()
        pdf_file = BytesIO(resume_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        resume_text = "".join([page.extract_text() for page in pdf_reader.pages])
        
        cleaned_resume = cleanResume(resume_text)
        vectorized_text = tfidf.transform([cleaned_resume])
        predicted_category_index = model.predict(vectorized_text)[0]
        predicted_category_name = le.inverse_transform([predicted_category_index])[0]
        
        interview_data = generate_interview_prep(resume_text, predicted_category_name)
        
        return {
            "success": True,
            "job_category": predicted_category_name,
            "interview_preparation": json.loads(interview_data),
            "tips": [
                "Research the company thoroughly",
                "Prepare examples using STAR method",
                "Practice answers out loud",
                "Prepare thoughtful questions for interviewer"
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/supported_categories", tags=["Information"])
async def get_supported_categories():
    """Get list of all supported job categories"""
    return {
        "total_categories": len(category_classes),
        "categories": category_classes.tolist()
    }

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 ADVANCED AI RESUME ANALYZER v2.0.1 - FIXED")
    print("="*60)
    print("📍 Server: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("✅ Job Search: FIXED - Now opens browser properly")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)