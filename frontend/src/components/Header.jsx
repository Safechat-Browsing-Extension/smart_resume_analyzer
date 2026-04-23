import React, { useState, useEffect } from 'react';
import { Brain, Lock, Zap } from 'lucide-react';

// ─── HEADER ────────────────────────────────────────────────────────────────────
const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <header className={`rai-header${scrolled ? ' scrolled' : ''}`}>
      <div className="rai-header-inner">
        <div className="rai-logo">
          <div className="rai-logo-mark">
            <Brain size={18} />
          </div>
          <span className="rai-logo-name">ResumeAI<span>.Pro</span></span>
        </div>
        <div className="rai-header-pills">
          <span className="rai-pill active">
            <Lock size={11} /> PII Scrubbing
          </span>
          <span className="rai-pill active">
            <Zap size={11} /> Llama-3
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;