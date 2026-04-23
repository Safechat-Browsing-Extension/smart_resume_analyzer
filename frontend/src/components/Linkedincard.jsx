import React, { useState } from 'react';
import axios from 'axios';
import { Linkedin, Loader2 } from 'lucide-react';

// ─── LINKEDIN OPTIMIZER ─────────────────────────────────────────────────────────
const LinkedInCard = ({ analysisData }) => {
  const [linkedInData, setLinkedInData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const skills = analysisData.dynamic_analysis.skills_detected.technical || [];
      const resp = await axios.post('http://localhost:8000/generate_linkedin', {
        resume_text: '[RESUME_TEXT]',
        predicted_category: analysisData.classification.predicted_category,
        top_skills: skills.slice(0, 8)
      });
      setLinkedInData(resp.data.linkedin);
    } catch { alert('Error generating LinkedIn content'); }
    finally { setLoading(false); }
  };

  const copyText = async (text, idx) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="rai-card">
      <div className="rai-card-body">
        <div className="rai-card-header">
          <div className="rai-card-title-group">
            <div className="rai-icon-box accent"><Linkedin size={17} /></div>
            <div><div className="rai-card-label">LinkedIn Optimizer</div><div className="rai-card-sublabel">AI headline + about section</div></div>
          </div>
          <span className="rai-badge new">New</span>
        </div>
        {!linkedInData ? (
          <button className="rai-btn primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> Crafting profile…</> : <><Linkedin size={15} /> Generate LinkedIn Content</>}
          </button>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--ink-5)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Headline Options</div>
              {(linkedInData.headline_options || []).map((h, i) => (
                <div key={i} className="rai-li-headline">
                  <p className="rai-li-headline-text">{h}</p>
                  <button className="rai-copy-btn" onClick={() => copyText(h, i)}>{copiedIdx===i ? '✓ Copied' : 'Copy'}</button>
                </div>
              ))}
            </div>
            {linkedInData.about_summary && (
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--ink-5)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>About Summary</div>
                <div style={{ padding:'14px 16px', background:'rgba(255,255,255,0.025)', border:'1px solid var(--card-border)', borderRadius:'var(--radius-md)', fontSize:13, color:'var(--ink-2)', lineHeight:1.65, maxHeight:130, overflowY:'auto' }}>
                  {linkedInData.about_summary}
                </div>
                <button className="rai-copy-btn" style={{ marginTop:8 }} onClick={() => copyText(linkedInData.about_summary, 99)}>
                  {copiedIdx===99 ? '✓ Copied' : 'Copy Summary'}
                </button>
              </div>
            )}
            {(linkedInData.top_keywords_for_seo || []).length > 0 && (
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--ink-5)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>SEO Keywords</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {linkedInData.top_keywords_for_seo.map((kw,i) => <span key={i} className="rai-seo-tag">{kw}</span>)}
                </div>
              </div>
            )}
            <button style={{ fontSize:12, color:'var(--ink-5)', background:'none', border:'none', cursor:'pointer' }} onClick={() => setLinkedInData(null)}>Regenerate</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInCard;