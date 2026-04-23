import React, { useState } from 'react';
import axios from 'axios';
import { DollarSign, TrendingUp, Loader2 } from 'lucide-react';

// ─── SALARY ESTIMATOR ──────────────────────────────────────────────────────────
const SalaryEstimatorCard = ({ analysisData }) => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('USA');

  const handleEstimate = async () => {
    setLoading(true);
    try {
      const skills = analysisData.dynamic_analysis.skills_detected.technical || [];
      const resp = await axios.post('http://localhost:8000/estimate_salary', {
        predicted_category: analysisData.classification.predicted_category,
        skills,
        location
      });
      setSalaryData(resp.data.salary_data);
    } catch { alert('Error estimating salary'); }
    finally { setLoading(false); }
  };

  const fmt = (n) => n != null ? `$${(n / 1000).toFixed(0)}k` : 'N/A';
  const tiers = salaryData ? [
    { label: 'Entry', data: salaryData.entry_level },
    { label: 'Mid',   data: salaryData.mid_level },
    { label: 'Senior',data: salaryData.senior_level },
  ] : [];

  return (
    <div className="rai-card">
      <div className="rai-card-body">
        <div className="rai-card-header">
          <div className="rai-card-title-group">
            <div className="rai-icon-box accent"><DollarSign size={17} /></div>
            <div>
              <div className="rai-card-label">Salary Estimator{salaryData && ` · ${salaryData.role_queried}`}</div>
              <div className="rai-card-sublabel">{salaryData ? salaryData.location : '2025 market rate'}</div>
            </div>
          </div>
          {salaryData ? <span className="rai-badge live">{salaryData.market_demand}</span> : <span className="rai-badge new">New</span>}
        </div>
        {!salaryData ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <input className="rai-input" type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (e.g. New York, London)" />
            <button className="rai-btn primary" onClick={handleEstimate} disabled={loading}>
              {loading ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> Estimating…</> : <><TrendingUp size={15} /> Estimate Market Value</>}
            </button>
          </div>
        ) : (
          <>
            <div className="grid-3" style={{ marginBottom:16 }}>
              {tiers.map((tier,i) => (
                <div key={i} className="rai-salary-tier">
                  <div className="rai-salary-tier-label">{tier.label}</div>
                  <div className="rai-salary-tier-range">{fmt(tier.data?.min)} – {fmt(tier.data?.max)}</div>
                  <div className="rai-salary-tier-meta">Median {fmt(tier.data?.median)}</div>
                </div>
              ))}
            </div>
            <div>
              {[['Currency',salaryData.currency],['Sample size',`${salaryData.sample_size} listings`],['Data source',salaryData.data_source?.replace('_',' ')],['Scraped',new Date(salaryData.scraped_at).toLocaleDateString()]].map(([k,v]) => (
                <div key={k} className="rai-meta-row"><span className="rai-meta-key">{k}</span><span className="rai-meta-val">{v}</span></div>
              ))}
            </div>
            <button style={{ fontSize:12, color:'var(--ink-5)', background:'none', border:'none', cursor:'pointer', marginTop:12 }} onClick={() => setSalaryData(null)}>Recalculate</button>
          </>
        )}
      </div>
    </div>
  );
};

export default SalaryEstimatorCard;