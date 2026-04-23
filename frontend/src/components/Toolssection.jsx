import React, { useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { Search, FileText, Sparkles, Loader2, Rocket, X } from 'lucide-react';
import InterviewPrepCard from './InterviewPrepCard';
import SalaryEstimatorCard from './SalaryEstimatorCard';
import CareerRoadmapCard from './CareerRoadmapCard';
import LinkedInCard from './LinkedInCard';

// ─── TOOLS SECTION ──────────────────────────────────────────────────────────────
const ToolsSection = ({ file, analysisData }) => {
  const [jobLocation, setJobLocation] = useState('Remote');
  const [isSearching, setIsSearching] = useState(false);
  const [clData, setClData] = useState({ title:'', company:'', text:'' });
  const [generatedCL, setGeneratedCL] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleJobSearch = async () => {
    if (!file) return alert('Please upload a resume first');
    setIsSearching(true);
    const formData = new FormData();
    formData.append('resume_file', file);
    try {
      await axios.post(`http://localhost:8000/search_jobs_multi?location=${jobLocation}`, formData);
      alert('Browser automation launched!');
    } catch { alert('Error starting search'); }
    finally { setIsSearching(false); }
  };

  const handleGenerateCL = async () => {
    setIsGenerating(true);
    try {
      const resp = await axios.post('http://localhost:8000/generate_cover_letter', { resume_text: clData.text, job_title: clData.title, company_name: clData.company });
      setGeneratedCL(resp.data.cover_letter);
    } catch { alert('Error generating letter'); }
    finally { setIsGenerating(false); }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    doc.setFont('helvetica','bold'); doc.setFontSize(18);
    doc.text('Cover Letter', margin, 20);
    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    doc.text(doc.splitTextToSize(generatedCL, doc.internal.pageSize.getWidth() - margin*2), margin, 40);
    doc.save(`${clData.company || 'Cover_Letter'}_ResumeAI.pdf`);
  };

  return (
    <div>
      <div className="rai-section-label">AI Career Tools</div>

      {analysisData && (
        <div style={{ display:'flex', flexDirection:'column', gap:20, marginBottom:20 }}>
          <div className="grid-2">
            <InterviewPrepCard analysisData={analysisData} />
            <SalaryEstimatorCard analysisData={analysisData} />
          </div>
          <div className="grid-2">
            <CareerRoadmapCard analysisData={analysisData} />
            <LinkedInCard analysisData={analysisData} />
          </div>
        </div>
      )}

      {/* Job Search + Cover Letter */}
      <div className="grid-2">
        {/* Job Search */}
        <div className="rai-card">
          <div className="rai-card-body">
            <div className="rai-card-header">
              <div className="rai-card-title-group">
                <div className="rai-icon-box accent"><Search size={17} /></div>
                <div><div className="rai-card-label">Smart Job Search</div><div className="rai-card-sublabel">Selenium automation</div></div>
              </div>
              <span className="rai-badge live">Live</span>
            </div>
            <div className="rai-loc-toggle">
              {['Remote','Hybrid','On-site'].map(t => (
                <button key={t} className={`rai-loc-btn${jobLocation===t?' active':''}`} onClick={() => setJobLocation(t)}>{t}</button>
              ))}
            </div>
            <input className="rai-input" type="text" value={jobLocation} onChange={e => setJobLocation(e.target.value)} placeholder="Custom location…" style={{ marginBottom:10 }} />
            <button className="rai-btn primary" onClick={handleJobSearch} disabled={isSearching || !file}>
              {isSearching ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> Searching…</> : <><Rocket size={15} /> Launch Job Bot</>}
            </button>
          </div>
        </div>

        {/* Cover Letter */}
        <div className="rai-card">
          <div className="rai-card-body">
            <div className="rai-card-header">
              <div className="rai-card-title-group">
                <div className="rai-icon-box accent"><FileText size={17} /></div>
                <div><div className="rai-card-label">AI Cover Letter</div><div className="rai-card-sublabel">Context-aware generation</div></div>
              </div>
            </div>
            {!generatedCL ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <input className="rai-input" placeholder="Job Title" onChange={e => setClData({...clData, title: e.target.value})} />
                <input className="rai-input" placeholder="Company Name" onChange={e => setClData({...clData, company: e.target.value})} />
                <textarea className="rai-input" placeholder="Paste resume text…" onChange={e => setClData({...clData, text: e.target.value})} />
                <button className="rai-btn primary" onClick={handleGenerateCL} disabled={isGenerating}>
                  {isGenerating ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> AI writing…</> : <><Sparkles size={15} /> Generate Letter</>}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:'var(--ink-5)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Generated Letter</span>
                  <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-5)' }} onClick={() => setGeneratedCL('')}><X size={15} /></button>
                </div>
                <div className="rai-cl-body">{generatedCL}</div>
                <div className="rai-cl-actions">
                  <button className="rai-btn ghost" onClick={() => navigator.clipboard.writeText(generatedCL)}>Copy</button>
                  <button className="rai-btn primary" onClick={handleDownloadPDF}>Download PDF</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsSection;