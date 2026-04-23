import React, { useState } from 'react';
import axios from 'axios';
import { Map, Loader2 } from 'lucide-react';

// ─── CAREER ROADMAP ─────────────────────────────────────────────────────────────
const CareerRoadmapCard = ({ analysisData }) => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const skills = analysisData.dynamic_analysis.skills_detected.technical || [];
      const resp = await axios.post('http://localhost:8000/generate_career_roadmap', {
        resume_text: '[RESUME_TEXT]',
        predicted_category: analysisData.classification.predicted_category,
        skills
      });
      setRoadmap(resp.data.roadmap);
    } catch { alert('Error generating roadmap'); }
    finally { setLoading(false); }
  };

  return (
    <div className="rai-card">
      <div className="rai-card-body">
        <div className="rai-card-header">
          <div className="rai-card-title-group">
            <div className="rai-icon-box accent"><Map size={17} /></div>
            <div><div className="rai-card-label">Career Roadmap</div><div className="rai-card-sublabel">AI 3-step growth path</div></div>
          </div>
          <span className="rai-badge new">New</span>
        </div>
        {!roadmap ? (
          <button className="rai-btn primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> Building path…</> : <><Map size={15} /> Generate Roadmap</>}
          </button>
        ) : (
          <>
            {(roadmap.steps || []).map((step, i) => (
              <div key={i} className="rai-roadmap-step">
                <div className="rai-roadmap-num">{step.step}</div>
                <div className="rai-roadmap-body">
                  <div className="rai-roadmap-role-label">{step.title}</div>
                  <div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
                    <span className="rai-roadmap-role">{step.role}</span>
                    <span className="rai-roadmap-bump">+{step.estimated_salary_bump}</span>
                  </div>
                  <div className="rai-skills-wrap">
                    {(step.skills_to_gain || []).map((s,j) => <span key={j} className="rai-skill" style={{ fontSize:11 }}>{s}</span>)}
                  </div>
                </div>
              </div>
            ))}
            <button style={{ fontSize:12, color:'var(--ink-5)', background:'none', border:'none', cursor:'pointer', marginTop:4 }} onClick={() => setRoadmap(null)}>Regenerate</button>
          </>
        )}
      </div>
    </div>
  );
};

export default CareerRoadmapCard;