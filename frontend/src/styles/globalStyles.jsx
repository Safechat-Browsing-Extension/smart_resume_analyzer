// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const injectStyles = () => {
  const el = document.createElement('style');
  el.innerText = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --ink-0: #ffffff;
      --ink-1: #f4f4f2;
      --ink-2: #e2e2de;
      --ink-3: #b4b4ae;
      --ink-4: #7a7a74;
      --ink-5: #3d3d38;
      --ink-6: #1e1e1b;
      --ink-7: #111110;
      --accent: #c8f135;
      --accent-dim: #a8cc1c;
      --accent-bg: rgba(200,241,53,0.08);
      --accent-border: rgba(200,241,53,0.2);
      --card-bg: rgba(30,30,27,0.6);
      --card-border: rgba(255,255,255,0.07);
      --surface: #18181600;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --radius-xl: 22px;
      --font-display: 'Syne', sans-serif;
      --font-body: 'DM Sans', sans-serif;
    }

    body {
      font-family: var(--font-body);
      background: var(--ink-7);
      color: var(--ink-1);
      -webkit-font-smoothing: antialiased;
    }

    .rai-root { min-height: 100vh; background: var(--ink-7); }

    /* ─── HEADER ─── */
    .rai-header {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      transition: all 0.4s ease;
    }
    .rai-header.scrolled {
      background: rgba(17,17,16,0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--card-border);
    }
    .rai-header-inner {
      max-width: 1100px; margin: 0 auto; padding: 0 32px;
      height: 64px; display: flex; align-items: center; justify-content: space-between;
    }
    .rai-logo {
      display: flex; align-items: center; gap: 12px; text-decoration: none;
    }
    .rai-logo-mark {
      width: 36px; height: 36px; border-radius: var(--radius-md);
      background: var(--accent); display: flex; align-items: center; justify-content: center;
    }
    .rai-logo-mark svg { color: var(--ink-7); }
    .rai-logo-name {
      font-family: var(--font-display); font-size: 18px; font-weight: 700;
      color: var(--ink-0); letter-spacing: -0.3px;
    }
    .rai-logo-name span { color: var(--accent); }
    .rai-header-pills { display: flex; align-items: center; gap: 8px; }
    .rai-pill {
      display: flex; align-items: center; gap: 6px; padding: 5px 12px;
      background: rgba(255,255,255,0.04); border: 1px solid var(--card-border);
      border-radius: 100px; font-size: 12px; font-weight: 500; color: var(--ink-3);
      white-space: nowrap;
    }
    .rai-pill svg { width: 12px; height: 12px; }
    .rai-pill.active { color: var(--accent); border-color: var(--accent-border); background: var(--accent-bg); }

    /* ─── HERO ─── */
    .rai-hero { padding: 120px 32px 80px; max-width: 1100px; margin: 0 auto; }
    .rai-hero-eyebrow {
      display: inline-flex; align-items: center; gap: 8px; margin-bottom: 28px;
      padding: 6px 14px; background: var(--accent-bg); border: 1px solid var(--accent-border);
      border-radius: 100px; font-size: 12px; font-weight: 500; color: var(--accent);
      letter-spacing: 0.06em; text-transform: uppercase;
    }
    .rai-hero-eyebrow svg { width: 12px; height: 12px; }
    .rai-hero h1 {
      font-family: var(--font-display); font-size: clamp(44px, 6vw, 72px);
      font-weight: 800; line-height: 1.0; letter-spacing: -2px; color: var(--ink-0);
      margin-bottom: 20px;
    }
    .rai-hero h1 em { font-style: normal; color: var(--accent); }
    .rai-hero p {
      font-size: 17px; font-weight: 300; color: var(--ink-3); line-height: 1.7;
      max-width: 540px; margin-bottom: 40px;
    }
    .rai-feature-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .rai-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 100px;
      background: rgba(255,255,255,0.04); border: 1px solid var(--card-border);
      font-size: 12px; font-weight: 500; color: var(--ink-3);
      transition: all 0.2s ease; cursor: default;
    }
    .rai-chip svg { width: 12px; height: 12px; opacity: 0.6; }
    .rai-chip:hover { border-color: rgba(200,241,53,0.25); color: var(--ink-1); }

    /* ─── UPLOAD ─── */
    .rai-upload-zone {
      position: relative; border: 1px solid var(--card-border);
      border-radius: var(--radius-xl); padding: 64px 32px; text-align: center;
      background: var(--card-bg); transition: all 0.3s ease;
      backdrop-filter: blur(12px); cursor: pointer;
      overflow: hidden;
    }
    .rai-upload-zone::before {
      content: ''; position: absolute; inset: 0; border-radius: var(--radius-xl);
      background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(200,241,53,0.04) 0%, transparent 70%);
      pointer-events: none;
    }
    .rai-upload-zone.drag-active, .rai-upload-zone:hover {
      border-color: var(--accent-border);
      background: rgba(200,241,53,0.03);
    }
    .rai-upload-icon {
      width: 72px; height: 72px; margin: 0 auto 24px;
      background: rgba(200,241,53,0.1); border: 1px solid var(--accent-border);
      border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;
    }
    .rai-upload-icon svg { color: var(--accent); }
    .rai-upload-zone h3 {
      font-family: var(--font-display); font-size: 24px; font-weight: 700;
      color: var(--ink-0); margin-bottom: 8px; letter-spacing: -0.5px;
    }
    .rai-upload-zone p { font-size: 14px; color: var(--ink-4); margin-bottom: 24px; }
    .rai-upload-meta { display: flex; align-items: center; justify-content: center; gap: 20px; }
    .rai-upload-meta-item {
      display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-4);
    }
    .rai-upload-meta-item svg { width: 13px; height: 13px; color: var(--accent); }

    /* ─── SECTION LABEL ─── */
    .rai-section-label {
      font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--ink-4); margin-bottom: 20px;
      display: flex; align-items: center; gap: 10px;
    }
    .rai-section-label::after {
      content: ''; flex: 1; height: 1px; background: var(--card-border);
    }

    /* ─── PREDICTED ROLE CARD ─── */
    .rai-role-card {
      border: 1px solid var(--card-border); border-radius: var(--radius-xl);
      padding: 40px 44px; background: var(--card-bg); backdrop-filter: blur(12px);
      position: relative; overflow: hidden;
    }
    .rai-role-card::after {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, var(--accent-border), transparent);
    }
    .rai-role-tag {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 100px; margin-bottom: 16px;
      background: var(--accent-bg); border: 1px solid var(--accent-border);
      font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--accent);
    }
    .rai-role-tag svg { width: 11px; height: 11px; }
    .rai-role-title {
      font-family: var(--font-display); font-size: clamp(32px, 4vw, 48px);
      font-weight: 800; letter-spacing: -1.5px; color: var(--ink-0); line-height: 1.05;
    }
    .rai-role-method { font-size: 13px; color: var(--ink-4); margin-top: 10px; }

    /* ─── CARD ─── */
    .rai-card {
      border: 1px solid var(--card-border); border-radius: var(--radius-xl);
      background: var(--card-bg); backdrop-filter: blur(12px);
      transition: border-color 0.2s ease;
    }
    .rai-card:hover { border-color: rgba(255,255,255,0.12); }
    .rai-card-body { padding: 28px 32px; }
    .rai-card-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 22px;
    }
    .rai-card-title-group { display: flex; align-items: center; gap: 12px; }
    .rai-icon-box {
      width: 38px; height: 38px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.05); border: 1px solid var(--card-border);
    }
    .rai-icon-box.accent { background: var(--accent-bg); border-color: var(--accent-border); }
    .rai-icon-box svg { width: 18px; height: 18px; }
    .rai-icon-box.accent svg { color: var(--accent); }
    .rai-icon-box svg { color: var(--ink-3); }
    .rai-card-label { font-size: 14px; font-weight: 500; color: var(--ink-1); }
    .rai-card-sublabel { font-size: 12px; color: var(--ink-4); margin-top: 2px; }
    .rai-badge {
      padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600;
      letter-spacing: 0.05em; text-transform: uppercase;
    }
    .rai-badge.new { background: var(--accent-bg); border: 1px solid var(--accent-border); color: var(--accent); }
    .rai-badge.live { background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.2); color: #4ade80; }

    /* ─── SKILL TAGS ─── */
    .rai-skill {
      display: inline-flex; padding: 6px 14px; border-radius: var(--radius-sm);
      font-size: 12px; font-weight: 500; color: var(--ink-2);
      background: rgba(255,255,255,0.04); border: 1px solid var(--card-border);
      transition: all 0.15s ease;
    }
    .rai-skill:hover { background: rgba(200,241,53,0.06); border-color: var(--accent-border); color: var(--accent); }
    .rai-skills-wrap { display: flex; flex-wrap: wrap; gap: 8px; }

    /* ─── GAP ITEM ─── */
    .rai-gap-item {
      display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px;
      border-radius: var(--radius-md); border: 1px solid rgba(239,68,68,0.12);
      background: rgba(239,68,68,0.04); margin-bottom: 10px;
    }
    .rai-gap-icon {
      width: 28px; height: 28px; border-radius: var(--radius-sm); flex-shrink: 0;
      background: rgba(239,68,68,0.1); display: flex; align-items: center; justify-content: center;
    }
    .rai-gap-icon svg { width: 13px; height: 13px; color: #f87171; }
    .rai-gap-name { font-size: 13px; font-weight: 500; color: var(--ink-1); }
    .rai-gap-sub { font-size: 11px; color: var(--ink-4); margin-top: 2px; }

    /* ─── ADVICE CARD ─── */
    .rai-advice-item {
      padding: 18px 20px; border-radius: var(--radius-md);
      border: 1px solid var(--card-border); background: rgba(255,255,255,0.025);
      transition: all 0.2s ease;
    }
    .rai-advice-item:hover { border-color: var(--accent-border); background: var(--accent-bg); }
    .rai-advice-row { display: flex; align-items: flex-start; gap: 12px; }
    .rai-advice-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; margin-top: 6px; }
    .rai-advice-text { font-size: 13px; font-weight: 400; color: var(--ink-2); line-height: 1.6; }
    .rai-advice-priority { font-size: 11px; font-weight: 600; color: var(--ink-4); margin-top: 10px; letter-spacing: 0.06em; text-transform: uppercase; }

    /* ─── HEATMAP ─── */
    .rai-heatmap-cloud { display: flex; flex-wrap: wrap; gap: 8px; padding: 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); }

    /* ─── BTN ─── */
    .rai-btn {
      width: 100%; padding: 13px 20px; border-radius: var(--radius-md);
      font-family: var(--font-body); font-size: 14px; font-weight: 500;
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      gap: 8px; transition: all 0.2s ease; text-align: center;
    }
    .rai-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .rai-btn.primary {
      background: var(--accent); color: var(--ink-7);
    }
    .rai-btn.primary:not(:disabled):hover { background: var(--accent-dim); }
    .rai-btn.ghost {
      background: rgba(255,255,255,0.04); border: 1px solid var(--card-border); color: var(--ink-2);
    }
    .rai-btn.ghost:not(:disabled):hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }
    .rai-btn svg { width: 15px; height: 15px; }

    /* ─── INPUT ─── */
    .rai-input {
      width: 100%; padding: 11px 16px; border-radius: var(--radius-md);
      background: rgba(255,255,255,0.04); border: 1px solid var(--card-border);
      color: var(--ink-1); font-family: var(--font-body); font-size: 14px;
      outline: none; transition: border-color 0.2s ease;
    }
    .rai-input::placeholder { color: var(--ink-4); }
    .rai-input:focus { border-color: var(--accent-border); }
    textarea.rai-input { resize: none; min-height: 100px; }

    /* ─── TAB BAR ─── */
    .rai-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: rgba(255,255,255,0.03); border-radius: var(--radius-md); padding: 4px; }
    .rai-tab {
      flex: 1; padding: 8px 12px; border-radius: var(--radius-sm);
      font-size: 12px; font-weight: 500; background: none; border: none;
      color: var(--ink-4); cursor: pointer; transition: all 0.15s ease;
    }
    .rai-tab.active { background: rgba(200,241,53,0.12); color: var(--accent); }

    /* ─── GRID HELPERS ─── */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    @media(max-width: 768px) {
      .grid-2, .grid-3, .grid-2-1 { grid-template-columns: 1fr; }
    }

    /* ─── Q ITEM ─── */
    .rai-q-item {
      display: flex; gap: 12px; padding: 12px 14px; border-radius: var(--radius-md);
      background: rgba(255,255,255,0.025); border: 1px solid var(--card-border); margin-bottom: 8px;
    }
    .rai-q-num { font-size: 12px; font-weight: 700; color: var(--accent); flex-shrink: 0; padding-top: 1px; }
    .rai-q-text { font-size: 13px; color: var(--ink-2); line-height: 1.55; }

    /* ─── SALARY TIERS ─── */
    .rai-salary-tier {
      padding: 16px; border-radius: var(--radius-md); text-align: center;
      background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
    }
    .rai-salary-tier-label { font-size: 11px; font-weight: 500; color: var(--ink-4); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.07em; }
    .rai-salary-tier-range { font-size: 15px; font-weight: 600; color: var(--ink-0); }
    .rai-salary-tier-meta { font-size: 11px; color: var(--ink-4); margin-top: 4px; }

    /* ─── ROADMAP STEP ─── */
    .rai-roadmap-step { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
    .rai-roadmap-num {
      width: 32px; height: 32px; border-radius: 50%; background: var(--accent);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      font-size: 13px; font-weight: 700; color: var(--ink-7);
    }
    .rai-roadmap-body {
      flex: 1; padding: 16px 18px; border-radius: var(--radius-md);
      background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
    }
    .rai-roadmap-role-label { font-size: 11px; color: var(--ink-4); margin-bottom: 4px; }
    .rai-roadmap-role { font-size: 15px; font-weight: 600; color: var(--ink-0); margin-bottom: 10px; }
    .rai-roadmap-bump {
      display: inline-flex; padding: 3px 9px; border-radius: 100px;
      font-size: 11px; font-weight: 600; background: rgba(74,222,128,0.1); color: #4ade80;
      border: 1px solid rgba(74,222,128,0.2); margin-left: 8px;
    }

    /* ─── META TABLE ─── */
    .rai-meta-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--card-border); font-size: 13px; }
    .rai-meta-row:last-child { border-bottom: none; }
    .rai-meta-key { color: var(--ink-4); }
    .rai-meta-val { color: var(--ink-1); font-weight: 500; }

    /* ─── SECTION DIVIDER ─── */
    .rai-divider { border: none; border-top: 1px solid var(--card-border); margin: 48px 0; }

    /* ─── TOOLS SECTION TITLE ─── */
    .rai-tools-heading {
      font-family: var(--font-display); font-size: 28px; font-weight: 700;
      letter-spacing: -0.8px; color: var(--ink-0); margin-bottom: 6px;
    }
    .rai-tools-sub { font-size: 14px; color: var(--ink-4); margin-bottom: 32px; }

    /* ─── CL RESULT ─── */
    .rai-cl-body {
      padding: 20px; background: rgba(255,255,255,0.025); border: 1px solid var(--card-border);
      border-radius: var(--radius-md); font-size: 13px; color: var(--ink-2);
      line-height: 1.7; max-height: 220px; overflow-y: auto; white-space: pre-wrap;
    }
    .rai-cl-actions { display: flex; gap: 10px; margin-top: 14px; }
    .rai-cl-actions .rai-btn { flex: 1; }

    /* ─── COPY BTN ─── */
    .rai-copy-btn {
      padding: 5px 12px; border-radius: var(--radius-sm); font-size: 11px; font-weight: 600;
      background: rgba(200,241,53,0.1); color: var(--accent); border: 1px solid var(--accent-border);
      cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
    }
    .rai-copy-btn:hover { background: rgba(200,241,53,0.18); }

    /* ─── LINKEDIN ─── */
    .rai-li-headline {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; border-radius: var(--radius-md);
      background: rgba(255,255,255,0.025); border: 1px solid var(--card-border); margin-bottom: 8px;
    }
    .rai-li-headline-text { font-size: 13px; color: var(--ink-1); flex: 1; line-height: 1.4; }

    /* ─── SEO TAGS ─── */
    .rai-seo-tag {
      display: inline-flex; padding: 4px 10px; border-radius: var(--radius-sm);
      font-size: 11px; font-weight: 500; background: rgba(200,241,53,0.06);
      color: var(--accent); border: 1px solid var(--accent-border);
    }

    /* ─── TOGGLE LOCATION BTN ─── */
    .rai-loc-toggle { display: flex; gap: 6px; margin-bottom: 12px; }
    .rai-loc-btn {
      flex: 1; padding: 8px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 500;
      background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
      color: var(--ink-4); cursor: pointer; transition: all 0.15s ease;
    }
    .rai-loc-btn.active { background: rgba(200,241,53,0.1); border-color: var(--accent-border); color: var(--accent); }

    /* ─── FOOTER ─── */
    .rai-footer {
      border-top: 1px solid var(--card-border); padding: 40px 32px; text-align: center;
    }
    .rai-footer-logo {
      font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--ink-2);
      margin-bottom: 8px;
    }
    .rai-footer-logo span { color: var(--accent); }
    .rai-footer-sub { font-size: 12px; color: var(--ink-5); }

    /* ─── ANIM ─── */
    @keyframes fadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }
    .fade-up { animation: fadeUp 0.45s ease both; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ─── SCROLL ─── */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--card-border); border-radius: 4px; }
  `;
  document.head.appendChild(el);
};

export default injectStyles;