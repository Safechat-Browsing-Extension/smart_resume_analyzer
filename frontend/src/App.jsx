import React, { useState } from 'react';
import axios from 'axios';
import { DollarSign, MessageSquare, Map, Eye, Linkedin, Search, Activity } from 'lucide-react';

import injectStyles from './styles/globalStyles';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import AnalysisResults from './components/AnalysisResults';
import ToolsSection from './components/ToolsSection';

// Inject global CSS on load
injectStyles();

// ─── APP ────────────────────────────────────────────────────────────────────────
function App() {
  const [file, setFile] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (uploadedFile) => {
    setFile(uploadedFile);
    setLoading(true);
    const formData = new FormData();
    formData.append('resume_file', uploadedFile);
    try {
      const response = await axios.post('http://localhost:8000/comprehensive_analysis', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysisData(response.data);
    } catch {
      alert('Analysis failed. Ensure backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rai-root">
      <Header />

      <main style={{ maxWidth:1100, margin:'0 auto', padding:'0 32px 80px' }}>

        {/* Hero */}
        {!analysisData && !loading && (
          <div className="rai-hero fade-up">
            <div className="rai-hero-eyebrow"><Activity size={11} /> Final Year AIML Project</div>
            <h1>AI-Powered<br /><em>Resume</em><br />Analysis</h1>
            <p>Seven real-time AI features. Privacy-first architecture. Zero PII exposure. Built for the modern job seeker.</p>
            <div className="rai-feature-chips">
              {[
                [DollarSign,'Salary Estimator'],
                [MessageSquare,'Interview Prep'],
                [Map,'Career Roadmap'],
                [Eye,'Keyword Heatmap'],
                [Linkedin,'LinkedIn AI'],
                [Search,'Job Bot'],
              ].map(([Icon,label],i) => (
                <span key={i} className="rai-chip"><Icon size={12} />{label}</span>
              ))}
            </div>
          </div>
        )}

        {/* Upload */}
        <div style={{ marginBottom:40, paddingTop: analysisData ? 90 : 0 }}>
          <FileUpload onUpload={handleFileUpload} isLoading={loading} />
        </div>

        {/* Results */}
        {analysisData && (
          <div style={{ display:'flex', flexDirection:'column', gap:48 }}>
            <div>
              <div className="rai-section-label">Analysis Results</div>
              <AnalysisResults data={analysisData} />
            </div>
            <hr className="rai-divider" />
            <ToolsSection file={file} analysisData={analysisData} />
          </div>
        )}
      </main>

      <footer className="rai-footer">
        <div className="rai-footer-logo">ResumeAI<span>.Pro</span> <span style={{ color:'var(--ink-5)', fontWeight:400 }}>v4.0</span></div>
        <div className="rai-footer-sub">7 unique AI features · Privacy-first · Llama-3 powered · © 2025</div>
      </footer>
    </div>
  );
}

export default App;