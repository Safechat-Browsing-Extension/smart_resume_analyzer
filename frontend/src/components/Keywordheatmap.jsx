import React from 'react';
import { Eye } from 'lucide-react';

// ─── KEYWORD HEATMAP ────────────────────────────────────────────────────────────
const KeywordHeatmap = ({ keywords }) => {
  if (!keywords || keywords.length === 0) return null;
  const getStyle = (weight) => {
    if (weight >= 0.8) return { background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)', fontSize:'16px', fontWeight:700 };
    if (weight >= 0.6) return { background:'rgba(234,179,8,0.1)', color:'#facc15', border:'1px solid rgba(234,179,8,0.2)', fontSize:'14px', fontWeight:600 };
    if (weight >= 0.4) return { background:'rgba(200,241,53,0.08)', color:'var(--accent)', border:'1px solid var(--accent-border)', fontSize:'13px', fontWeight:500 };
    return { background:'rgba(255,255,255,0.04)', color:'var(--ink-3)', border:'1px solid var(--card-border)', fontSize:'12px', fontWeight:400 };
  };
  return (
    <div className="rai-card">
      <div className="rai-card-body">
        <div className="rai-card-header">
          <div className="rai-card-title-group">
            <div className="rai-icon-box accent"><Eye size={18} /></div>
            <div><div className="rai-card-label">Keyword Heatmap</div><div className="rai-card-sublabel">Bigger & brighter = overused</div></div>
          </div>
        </div>
        <div className="rai-heatmap-cloud">
          {keywords.map((item, i) => (
            <span key={i} style={{ ...getStyle(item.weight), padding:'6px 13px', borderRadius:'6px', cursor:'default', transition:'transform 0.15s ease' }}
              title={`"${item.word}" — ${item.count} times`}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              {item.word}
            </span>
          ))}
        </div>
        <div style={{ display:'flex', gap:16, marginTop:14 }}>
          {[['High freq','rgba(239,68,68,0.5)'],['Medium','rgba(234,179,8,0.5)'],['Low freq','rgba(200,241,53,0.4)']].map(([label,c]) => (
            <span key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--ink-4)' }}>
              <span style={{ width:8, height:8, borderRadius:2, background:c, display:'inline-block' }} /> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeywordHeatmap;