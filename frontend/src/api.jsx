import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const analyzeResume = async (file) => {
  const formData = new FormData();
  formData.append('resume_file', file);
  const response = await axios.post(`${API_URL}/comprehensive_analysis`, formData);
  return response.data;
};

export const searchJobs = async (file, location) => {
  const formData = new FormData();
  formData.append('resume_file', file);
  const response = await axios.post(`${API_URL}/search_jobs_multi?location=${location}`, formData);
  return response.data;
};

export const generateCoverLetter = async (resumeText, jobTitle, companyName) => {
  const response = await axios.post(`${API_URL}/generate_cover_letter`, {
    resume_text: resumeText,
    job_title: jobTitle,
    company_name: companyName
  });
  return response.data;
};