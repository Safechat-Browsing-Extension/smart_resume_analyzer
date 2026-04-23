import React from 'react';
import { Sparkles, AlertTriangle, X, Target, Cpu as Chip } from 'lucide-react';
import KeywordHeatmap from './KeywordHeatmap';

// ─── ANALYSIS RESULTS ──────────────────────────────────────────────────────────
const AnalysisResults = ({ data }) => {
  if (!data) return null;
  const { classification, dynamic_analysis, resume_score, keyword_frequency } = data;
  return (
    <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Role */}
      <div className="rai-role-card">
        <div className="rai-role-tag"><Target size={11} /> AI-Predicted Role</div>
        <div className="rai-role-title">{classification.predicted_category}</div>
        <div className="rai-role-method">{classification.method}</div>
      </div>

      {/* Heatmap */}
      <KeywordHeatmap keywords={keyword_frequency} />

      {/* Skills + Gaps */}
      <div className="grid-2-1">
        <div className="rai-card">
          <div className="rai-card-body">
            <div className="rai-card-header">
              <div className="rai-card-title-group">
                <div className="rai-icon-box"><Chip size={17} /></div>
                <div><div className="rai-card-label">Technical Skills</div><div className="rai-card-sublabel">{dynamic_analysis.skills_detected.technical.length} detected</div></div>
              </div>
            </div>
            <div className="rai-skills-wrap">
              {dynamic_analysis.skills_detected.technical.map((skill, i) => (
                <span key={i} className="rai-skill">{skill}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="rai-card">
          <div className="rai-card-body">
            <div className="rai-card-header">
              <div className="rai-card-title-group">
                <div className="rai-icon-box"><AlertTriangle size={17} /></div>
                <div><div className="rai-card-label">Critical Gaps</div></div>
              </div>
            </div>
            {dynamic_analysis.gap_analysis.critical_missing_skills.slice(0, 4).map((gap, i) => (
              <div key={i} className="rai-gap-item">
                <div className="rai-gap-icon"><X size={12} /></div>
                <div><div className="rai-gap-name">{gap}</div><div className="rai-gap-sub">High market impact</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Advice */}
      <div className="rai-card">
        <div className="rai-card-body">
          <div className="rai-card-header">
            <div className="rai-card-title-group">
              <div className="rai-icon-box accent"><Sparkles size={17} /></div>
              <div><div className="rai-card-label">AI Strategic Advice</div><div className="rai-card-sublabel">Personalised recommendations</div></div>
            </div>
          </div>
          <div className="grid-2">
            {dynamic_analysis.strategic_advice.map((advice, i) => (
              <div key={i} className="rai-advice-item">
                <div className="rai-advice-row">
                  <div className="rai-advice-dot" />
                  <p className="rai-advice-text">{advice}</p>
                </div>
                <div className="rai-advice-priority">Priority: {i === 0 ? 'High' : 'Medium'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;