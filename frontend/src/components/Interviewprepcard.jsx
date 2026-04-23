import React, { useState } from 'react';
import axios from 'axios';
import { MessageSquare, Sparkles, Loader2 } from 'lucide-react';

// ─── INTERVIEW PREP ─────────────────────────────────────────────────────────────
const InterviewPrepCard = ({ analysisData }) => {
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('technical');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const gaps = analysisData.dynamic_analysis.gap_analysis.critical_missing_skills || [];
      const resp = await axios.post('http://localhost:8000/generate_interview_questions', {
        resume_text: '[RESUME TEXT — stored client-side]',
        predicted_category: analysisData.classification.predicted_category,
        gaps
      });
      setQuestions(resp.data.questions);
    } catch { alert('Error generating questions'); }
    finally { setLoading(false); }
  };

  return (
    <div className="rai-card">
      <div className="rai-card-body">
        <div className="rai-card-header">
          <div className="rai-card-title-group">
            <div className="rai-icon-box accent"><MessageSquare size={17} /></div>
            <div><div className="rai-card-label">Interview Prep AI</div><div className="rai-card-sublabel">Personalised from your gaps</div></div>
          </div>
          <span className="rai-badge new">New</span>
        </div>
        {!questions ? (
          <button className="rai-btn primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> Generating…</> : <><Sparkles size={15} /> Generate Questions</>}
          </button>
        ) : (
          <>
            <div className="rai-tabs">
              {[['technical','Technical'],['behavioral','Behavioral'],['gap_probing','Gap Probing']].map(([key,label]) => (
                <button key={key} className={`rai-tab${activeTab===key?' active':''}`} onClick={() => setActiveTab(key)}>{label}</button>
              ))}
            </div>
            <div style={{ maxHeight:240, overflowY:'auto', paddingRight:4 }}>
              {(questions[activeTab] || []).map((q, i) => (
                <div key={i} className="rai-q-item">
                  <span className="rai-q-num">Q{i+1}.</span>
                  <p className="rai-q-text">{q}</p>
                </div>
              ))}
            </div>
            <button style={{ fontSize:12, color:'var(--ink-5)', background:'none', border:'none', cursor:'pointer', marginTop:10 }} onClick={() => setQuestions(null)}>Regenerate</button>
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewPrepCard;