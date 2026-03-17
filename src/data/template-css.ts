// =============================================================================
// Template CSS — Scoped styles for resume templates
// Auto-extracted from HTML templates with [data-template] attribute scoping
// =============================================================================

export const CSS_01 = `
[data-template="modern-minimalist"] {
  --primary: #2D2D2D;
  --accent: #C8A97E;
  --accent-light: rgba(200, 169, 126, 0.12);
  --text-dark: #1A1A1A;
  --text-medium: #555;
  --text-light: #999;
  --bg: #FAFAF8;
  --white: #FFF;
  --border: #E8E5E0;
  position: relative;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="modern-minimalist"] .header {
  padding: 48px 48px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
[data-template="modern-minimalist"] .header-left { flex: 1; }
[data-template="modern-minimalist"] .name {
  font-size: 38px;
  font-weight: 800;
  color: var(--text-dark);
  letter-spacing: -1px;
  line-height: 1.1;
}
[data-template="modern-minimalist"] .title {
  font-size: 14px;
  font-weight: 500;
  color: var(--accent);
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-top: 8px;
}
[data-template="modern-minimalist"] .header-right {
  text-align: right;
  padding-top: 4px;
}
[data-template="modern-minimalist"] .contact-line {
  font-size: 11px;
  color: var(--text-medium);
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
[data-template="modern-minimalist"] .contact-line svg {
  width: 11px; height: 11px;
  fill: var(--accent);
}
[data-template="modern-minimalist"] .header-divider {
  margin: 24px 48px 0;
  height: 2px;
  background: linear-gradient(to right, var(--accent), transparent);
}
[data-template="modern-minimalist"] .content {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 36px;
  padding: 28px 48px 40px;
}
[data-template="modern-minimalist"] .section { margin-bottom: 22px; }
[data-template="modern-minimalist"] .section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 14px;
  padding-bottom: 6px;
  border-bottom: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
}
[data-template="modern-minimalist"] .section-title::before {
  content: '';
  width: 6px; height: 6px;
  background: var(--accent);
  border-radius: 50%;
}
[data-template="modern-minimalist"] .summary {
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-medium);
}
[data-template="modern-minimalist"] .exp-item { margin-bottom: 18px; }
[data-template="modern-minimalist"] .exp-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 3px;
}
[data-template="modern-minimalist"] .exp-role {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-dark);
}
[data-template="modern-minimalist"] .exp-date {
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.5px;
}
[data-template="modern-minimalist"] .exp-company {
  font-size: 11px;
  color: var(--text-medium);
  font-weight: 500;
  margin-bottom: 6px;
}
[data-template="modern-minimalist"] .exp-desc {
  font-size: 11px;
  color: var(--text-medium);
  line-height: 1.6;
}
[data-template="modern-minimalist"] .exp-desc li {
  margin-bottom: 3px;
  margin-left: 14px;
}
[data-template="modern-minimalist"] .exp-desc li::marker {
  color: var(--accent);
}
[data-template="modern-minimalist"] .edu-item { margin-bottom: 12px; }
[data-template="modern-minimalist"] .edu-degree {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dark);
}
[data-template="modern-minimalist"] .edu-school {
  font-size: 11px;
  color: var(--text-medium);
}
[data-template="modern-minimalist"] .edu-year {
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
}
[data-template="modern-minimalist"] .sidebar-section { margin-bottom: 22px; }
[data-template="modern-minimalist"] .skill-tag {
  display: inline-block;
  padding: 5px 12px;
  background: var(--accent-light);
  color: var(--primary);
  font-size: 11px;
  font-weight: 600;
  border-radius: 20px;
  margin: 0 4px 6px 0;
}
[data-template="modern-minimalist"] .lang-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
[data-template="modern-minimalist"] .lang-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-dark);
}
[data-template="modern-minimalist"] .lang-level {
  font-size: 11px;
  color: var(--text-light);
  font-weight: 500;
  letter-spacing: 0.5px;
}
[data-template="modern-minimalist"] .lang-bar {
  width: 100%;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  margin-top: 3px;
}
[data-template="modern-minimalist"] .lang-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
}
[data-template="modern-minimalist"] .interest-item {
  font-size: 11px;
  color: var(--text-medium);
  padding: 4px 0;
  border-bottom: 1px dashed var(--border);
}
[data-template="modern-minimalist"] .interest-item:last-child { border: none; }
[data-template="modern-minimalist"] .cert-item { margin-bottom: 8px; }
[data-template="modern-minimalist"] .cert-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-dark);
}
[data-template="modern-minimalist"] .cert-org {
  font-size: 11px;
  color: var(--text-light);
}
`;

export const CSS_02 = `
[data-template="corporate-executive"] {
  --navy: #0B1D3A;
  --navy-light: #1A3A5C;
  --gold: #C5963A;
  --gold-light: rgba(197, 150, 58, 0.1);
  --text-dark: #1A1A1A;
  --text-medium: #4A4A4A;
  --text-light: #8A8A8A;
  --cream: #FAF8F5;
  --white: #FFF;
  --border: #D4CFC7;
  position: relative;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="corporate-executive"] .banner {
  background: var(--navy);
  padding: 40px 50px 36px;
  position: relative;
  overflow: hidden;
}
[data-template="corporate-executive"] .banner::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right, var(--gold), var(--gold) 30%, transparent 30%);
}
[data-template="corporate-executive"] .banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
[data-template="corporate-executive"] .banner-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 700;
  color: var(--white);
  letter-spacing: 2px;
}
[data-template="corporate-executive"] .banner-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--gold);
  letter-spacing: 5px;
  text-transform: uppercase;
  margin-top: 6px;
}
[data-template="corporate-executive"] .banner-right {
  text-align: right;
}
[data-template="corporate-executive"] .banner-contact {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}
[data-template="corporate-executive"] .banner-contact strong {
  color: var(--gold);
  font-weight: 600;
}
[data-template="corporate-executive"] .body-content {
  padding: 32px 50px;
}
[data-template="corporate-executive"] .exec-summary {
  background: var(--cream);
  border-left: 3px solid var(--gold);
  padding: 18px 22px;
  margin-bottom: 28px;
}
[data-template="corporate-executive"] .exec-summary p {
  font-size: 11px;
  line-height: 1.75;
  color: var(--text-medium);
  font-style: italic;
}
[data-template="corporate-executive"] .section { margin-bottom: 24px; }
[data-template="corporate-executive"] .section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
[data-template="corporate-executive"] .section-icon {
  width: 28px; height: 28px;
  background: var(--navy);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
[data-template="corporate-executive"] .section-icon svg {
  width: 14px; height: 14px;
  fill: var(--gold);
}
[data-template="corporate-executive"] .section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--navy);
  letter-spacing: 1px;
}
[data-template="corporate-executive"] .section-line {
  flex: 1;
  height: 1px;
  background: var(--border);
}
[data-template="corporate-executive"] .exp-item {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 20px;
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid #F0EDE8;
}
[data-template="corporate-executive"] .exp-item:last-child { border-bottom: none; padding-bottom: 0; }
[data-template="corporate-executive"] .exp-date {
  font-size: 11px;
  font-weight: 600;
  color: var(--gold);
  letter-spacing: 0.5px;
}
[data-template="corporate-executive"] .exp-location {
  font-size: 11px;
  color: var(--text-light);
  margin-top: 2px;
}
[data-template="corporate-executive"] .exp-role {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-dark);
}
[data-template="corporate-executive"] .exp-company {
  font-size: 11px;
  color: var(--navy-light);
  font-weight: 600;
  margin-bottom: 6px;
}
[data-template="corporate-executive"] .exp-desc {
  font-size: 11px;
  color: var(--text-medium);
  line-height: 1.65;
}
[data-template="corporate-executive"] .exp-desc li {
  margin-bottom: 2px;
  margin-left: 14px;
}
[data-template="corporate-executive"] .two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}
[data-template="corporate-executive"] .edu-item { margin-bottom: 12px; }
[data-template="corporate-executive"] .edu-degree {
  font-family: 'Cormorant Garamond', serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-dark);
}
[data-template="corporate-executive"] .edu-school {
  font-size: 11px;
  color: var(--text-medium);
}
[data-template="corporate-executive"] .edu-year {
  font-size: 11px;
  color: var(--gold);
  font-weight: 600;
}
[data-template="corporate-executive"] .competency-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
[data-template="corporate-executive"] .comp-item {
  font-size: 11px;
  color: var(--text-medium);
  padding: 6px 10px;
  background: var(--cream);
  border-radius: 3px;
  font-weight: 500;
}
[data-template="corporate-executive"] .achievement-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
[data-template="corporate-executive"] .achievement-icon {
  color: var(--gold);
  font-size: 12px;
  margin-top: 1px;
}
[data-template="corporate-executive"] .achievement-text {
  font-size: 11px;
  color: var(--text-medium);
  line-height: 1.5;
}
`;

export const CSS_03 = `
[data-template="creative-bold"] {
  --hot-pink: #FF2E6C;
  --electric-blue: #3B82F6;
  --dark: #0F0F0F;
  --off-white: #F5F5F0;
  --text-dark: #1A1A1A;
  --text-medium: #555;
  --text-light: #999;
  --yellow: #FBBF24;
  position: relative;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="creative-bold"] .hero {
  background: var(--dark);
  padding: 40px 44px 36px;
  position: relative;
  overflow: hidden;
}
[data-template="creative-bold"] .hero::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -40px;
  width: 200px;
  height: 200px;
  background: var(--hot-pink);
  border-radius: 50%;
  opacity: 0.15;
}
[data-template="creative-bold"] .hero::after {
  content: '';
  position: absolute;
  bottom: -30px;
  right: 120px;
  width: 100px;
  height: 100px;
  background: var(--electric-blue);
  border-radius: 50%;
  opacity: 0.1;
}
[data-template="creative-bold"] .hero-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 20px;
  position: relative;
  z-index: 1;
}
[data-template="creative-bold"] .hero-name {
  font-family: 'Archivo Black', sans-serif;
  font-size: 44px;
  color: white;
  line-height: 1;
  letter-spacing: -1px;
}
[data-template="creative-bold"] .hero-name span {
  color: var(--hot-pink);
}
[data-template="creative-bold"] .hero-title {
  font-size: 13px;
  color: var(--yellow);
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-top: 10px;
}
[data-template="creative-bold"] .hero-contact {
  text-align: right;
}
[data-template="creative-bold"] .hero-contact-item {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  margin-bottom: 4px;
}
[data-template="creative-bold"] .hero-contact-item strong {
  color: var(--hot-pink);
}
[data-template="creative-bold"] .color-strip {
  height: 5px;
  display: flex;
}
[data-template="creative-bold"] .color-strip div { flex: 1; }
[data-template="creative-bold"] .strip-1 { background: var(--hot-pink); }
[data-template="creative-bold"] .strip-2 { background: var(--electric-blue); }
[data-template="creative-bold"] .strip-3 { background: var(--yellow); }
[data-template="creative-bold"] .strip-4 { background: var(--dark); }
[data-template="creative-bold"] .content {
  padding: 28px 44px;
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 32px;
}
[data-template="creative-bold"] .section { margin-bottom: 22px; }
[data-template="creative-bold"] .section-title {
  font-family: 'Archivo Black', sans-serif;
  font-size: 14px;
  color: var(--dark);
  letter-spacing: 1px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
[data-template="creative-bold"] .section-title .dot {
  width: 8px; height: 8px;
  background: var(--hot-pink);
  border-radius: 2px;
  transform: rotate(45deg);
}
[data-template="creative-bold"] .about-text {
  font-size: 11px;
  line-height: 1.75;
  color: var(--text-medium);
  border-left: 3px solid var(--hot-pink);
  padding-left: 14px;
}
[data-template="creative-bold"] .exp-item {
  margin-bottom: 18px;
  position: relative;
  padding-left: 16px;
}
[data-template="creative-bold"] .exp-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 8px; height: 8px;
  border-radius: 50%;
  border: 2px solid var(--electric-blue);
}
[data-template="creative-bold"] .exp-item::after {
  content: '';
  position: absolute;
  left: 3.5px;
  top: 18px;
  width: 1px;
  height: calc(100% - 4px);
  background: #DDD;
}
[data-template="creative-bold"] .exp-item:last-child::after { display: none; }
[data-template="creative-bold"] .exp-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
[data-template="creative-bold"] .exp-role {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-dark);
}
[data-template="creative-bold"] .exp-date {
  font-size: 11px;
  font-weight: 700;
  color: var(--hot-pink);
  letter-spacing: 1px;
  background: rgba(255, 46, 108, 0.08);
  padding: 2px 8px;
  border-radius: 10px;
}
[data-template="creative-bold"] .exp-company {
  font-size: 11px;
  color: var(--electric-blue);
  font-weight: 700;
  margin-bottom: 4px;
}
[data-template="creative-bold"] .exp-desc {
  font-size: 11px;
  color: var(--text-medium);
  line-height: 1.6;
}
[data-template="creative-bold"] .exp-desc li {
  margin-bottom: 2px;
  margin-left: 14px;
}
[data-template="creative-bold"] .exp-desc li::marker {
  color: var(--yellow);
}
[data-template="creative-bold"] .edu-card {
  background: var(--dark);
  color: white;
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
}
[data-template="creative-bold"] .edu-degree {
  font-size: 12px;
  font-weight: 700;
}
[data-template="creative-bold"] .edu-school {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
}
[data-template="creative-bold"] .edu-year {
  font-size: 11px;
  color: var(--yellow);
  font-weight: 700;
  margin-top: 2px;
}
[data-template="creative-bold"] .skill-bar-group { margin-bottom: 10px; }
[data-template="creative-bold"] .skill-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 4px;
}
[data-template="creative-bold"] .skill-pct { color: var(--hot-pink); }
[data-template="creative-bold"] .skill-track {
  height: 5px;
  background: #E5E5E0;
  border-radius: 3px;
  overflow: hidden;
}
[data-template="creative-bold"] .skill-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(to right, var(--hot-pink), var(--electric-blue));
}
[data-template="creative-bold"] .tool-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: var(--dark);
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  margin: 0 4px 6px 0;
}
[data-template="creative-bold"] .award-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: flex-start;
}
[data-template="creative-bold"] .award-badge {
  width: 22px; height: 22px;
  min-width: 22px;
  background: var(--yellow);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}
[data-template="creative-bold"] .award-text {
  font-size: 11px;
  color: var(--text-medium);
  line-height: 1.4;
}
[data-template="creative-bold"] .award-text strong {
  color: var(--text-dark);
  display: block;
}
[data-template="creative-bold"] .social-item {
  font-size: 11px;
  color: var(--text-medium);
  padding: 6px 0;
  border-bottom: 1px dashed #DDD;
}
[data-template="creative-bold"] .social-item:last-child { border: none; }
[data-template="creative-bold"] .social-item strong {
  color: var(--electric-blue);
  display: block;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
`;

export const CSS_04 = `
[data-template="elegant-sidebar"] {
  --sidebar-bg: linear-gradient(175deg, #2C3E50 0%, #1A252F 50%, #0D1B2A 100%);
  --accent: #E8B86D;
  --accent-glow: rgba(232, 184, 109, 0.15);
  --text-dark: #1A1A1A;
  --text-medium: #555;
  --text-light: #999;
  --white: #FFF;
  --cream: #FDFCFA;
  --border: #EBE7E0;
  display: grid;
  grid-template-columns: 220px 1fr;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="elegant-sidebar"] .sidebar {
  background: var(--sidebar-bg);
  padding: 0;
  color: white;
  position: relative;
}
[data-template="elegant-sidebar"] .sidebar::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(232, 184, 109, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(232, 184, 109, 0.05) 0%, transparent 50%);
}
[data-template="elegant-sidebar"] .sidebar-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}
[data-template="elegant-sidebar"] .avatar-area {
  padding: 36px 24px 24px;
  text-align: center;
}
[data-template="elegant-sidebar"] .avatar-ring {
  width: 100px; height: 100px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(232, 184, 109, 0.1);
}
[data-template="elegant-sidebar"] .avatar-initials {
  font-family: 'Playfair Display', serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--accent);
}
[data-template="elegant-sidebar"] .sidebar-name {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 4px;
}
[data-template="elegant-sidebar"] .sidebar-role {
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 3px;
  text-transform: uppercase;
  font-weight: 600;
}
[data-template="elegant-sidebar"] .sidebar-content {
  padding: 0 22px;
  flex: 1;
}
[data-template="elegant-sidebar"] .sb-section { margin-bottom: 18px; }
[data-template="elegant-sidebar"] .sb-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(232, 184, 109, 0.2);
}
[data-template="elegant-sidebar"] .sb-contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
[data-template="elegant-sidebar"] .sb-icon {
  width: 26px; height: 26px;
  min-width: 26px;
  border-radius: 50%;
  background: rgba(232, 184, 109, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
[data-template="elegant-sidebar"] .sb-icon svg {
  width: 12px; height: 12px;
  fill: var(--accent);
}
[data-template="elegant-sidebar"] .sb-contact-text {
  font-size: 11px;
  color: rgba(255,255,255,0.75);
  line-height: 1.4;
}
[data-template="elegant-sidebar"] .sb-skill {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
[data-template="elegant-sidebar"] .sb-skill-name {
  font-size: 11px;
  color: rgba(255,255,255,0.85);
  font-weight: 500;
}
[data-template="elegant-sidebar"] .sb-dots {
  display: flex;
  gap: 4px;
}
[data-template="elegant-sidebar"] .sb-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  border: 1.5px solid var(--accent);
}
[data-template="elegant-sidebar"] .sb-dot.filled {
  background: var(--accent);
}
[data-template="elegant-sidebar"] .sb-lang { margin-bottom: 8px; }
[data-template="elegant-sidebar"] .sb-lang-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
}
[data-template="elegant-sidebar"] .sb-lang-name {
  font-size: 11px;
  color: rgba(255,255,255,0.85);
  font-weight: 500;
}
[data-template="elegant-sidebar"] .sb-lang-level {
  font-size: 11px;
  color: var(--accent);
}
[data-template="elegant-sidebar"] .sb-lang-bar {
  height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
}
[data-template="elegant-sidebar"] .sb-lang-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
}
[data-template="elegant-sidebar"] .sb-hobby {
  display: inline-block;
  padding: 4px 10px;
  border: 1px solid rgba(232, 184, 109, 0.25);
  border-radius: 14px;
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  margin: 0 4px 5px 0;
}
[data-template="elegant-sidebar"] .main {
  padding: 36px 36px 30px;
}
[data-template="elegant-sidebar"] .section { margin-bottom: 22px; }
[data-template="elegant-sidebar"] .section-title {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 4px;
}
[data-template="elegant-sidebar"] .section-subtitle {
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 14px;
}
[data-template="elegant-sidebar"] .section-divider {
  width: 40px;
  height: 2px;
  background: var(--accent);
  margin-bottom: 16px;
}
[data-template="elegant-sidebar"] .summary {
  font-size: 11px;
  line-height: 1.8;
  color: var(--text-medium);
}
[data-template="elegant-sidebar"] .exp-timeline { position: relative; }
[data-template="elegant-sidebar"] .exp-item {
  position: relative;
  padding-left: 22px;
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}
[data-template="elegant-sidebar"] .exp-item:last-child { border-bottom: none; padding-bottom: 0; }
[data-template="elegant-sidebar"] .exp-item::before {
  content: '';
  position: absolute;
  left: 0; top: 5px;
  width: 10px; height: 10px;
  border: 2px solid var(--accent);
  border-radius: 50%;
  background: var(--cream);
}
[data-template="elegant-sidebar"] .exp-item::after {
  content: '';
  position: absolute;
  left: 4.5px;
  top: 18px;
  width: 1px;
  height: calc(100% - 6px);
  background: var(--border);
}
[data-template="elegant-sidebar"] .exp-item:last-child::after { display: none; }
[data-template="elegant-sidebar"] .exp-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
[data-template="elegant-sidebar"] .exp-role {
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-dark);
}
[data-template="elegant-sidebar"] .exp-date {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
}
[data-template="elegant-sidebar"] .exp-company {
  font-size: 11px;
  color: var(--text-medium);
  font-weight: 600;
  margin-bottom: 5px;
}
[data-template="elegant-sidebar"] .exp-desc {
  font-size: 11px;
  color: var(--text-medium);
  line-height: 1.6;
}
[data-template="elegant-sidebar"] .exp-desc li {
  margin-bottom: 2px;
  margin-left: 14px;
}
[data-template="elegant-sidebar"] .edu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
[data-template="elegant-sidebar"] .edu-card {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  transition: border-color 0.2s;
}
[data-template="elegant-sidebar"] .edu-degree {
  font-family: 'Playfair Display', serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 2px;
}
[data-template="elegant-sidebar"] .edu-school {
  font-size: 11px;
  color: var(--text-medium);
}
[data-template="elegant-sidebar"] .edu-year {
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
  margin-top: 4px;
}
`;

export const CSS_05 = `
[data-template="infographic"] {
  --teal: #0D9488;
  --teal-light: #14B8A6;
  --orange: #F97316;
  --purple: #8B5CF6;
  --pink: #EC4899;
  --blue: #3B82F6;
  --dark: #1E293B;
  --medium: #475569;
  --light: #94A3B8;
  --bg: #F8FAFC;
  --white: #FFF;
  --border: #E2E8F0;
  display: grid;
  grid-template-columns: 230px 1fr;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="infographic"] .left-panel {
  background: var(--dark);
  color: white;
  padding: 0;
  position: relative;
}
[data-template="infographic"] .profile-area {
  background: linear-gradient(135deg, var(--teal), var(--teal-light));
  padding: 32px 22px 28px;
  text-align: center;
}
[data-template="infographic"] .profile-avatar {
  width: 88px; height: 88px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.15);
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 900;
}
[data-template="infographic"] .profile-name {
  font-size: 18px;
  font-weight: 800;
}
[data-template="infographic"] .profile-role {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.85;
  margin-top: 4px;
}
[data-template="infographic"] .left-content { padding: 20px 22px; }
[data-template="infographic"] .lp-section { margin-bottom: 18px; }
[data-template="infographic"] .lp-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--teal-light);
  margin-bottom: 10px;
}
[data-template="infographic"] .lp-contact {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
[data-template="infographic"] .lp-contact-icon {
  width: 28px; height: 28px;
  min-width: 28px;
  border-radius: 6px;
  background: rgba(13, 148, 136, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
[data-template="infographic"] .lp-contact-icon svg {
  width: 13px; height: 13px;
  fill: var(--teal-light);
}
[data-template="infographic"] .lp-contact-text {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
}
[data-template="infographic"] .skill-circles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
[data-template="infographic"] .skill-circle { text-align: center; }
[data-template="infographic"] .circle-wrap {
  width: 52px; height: 52px;
  margin: 0 auto 5px;
  position: relative;
}
[data-template="infographic"] .circle-svg {
  transform: rotate(-90deg);
}
[data-template="infographic"] .circle-bg {
  fill: none;
  stroke: rgba(255,255,255,0.1);
  stroke-width: 4;
}
[data-template="infographic"] .circle-fill {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
}
[data-template="infographic"] .circle-pct {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 800;
  color: white;
}
[data-template="infographic"] .skill-circle-label {
  font-size: 11px;
  color: rgba(255,255,255,0.65);
  font-weight: 600;
}
[data-template="infographic"] .sw-item { margin-bottom: 8px; }
[data-template="infographic"] .sw-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255,255,255,0.8);
  font-weight: 600;
  margin-bottom: 3px;
}
[data-template="infographic"] .sw-bar {
  height: 5px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}
[data-template="infographic"] .sw-fill {
  height: 100%;
  border-radius: 3px;
}
[data-template="infographic"] .lang-row {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  align-items: center;
}
[data-template="infographic"] .lang-label {
  font-size: 11px;
  color: rgba(255,255,255,0.8);
  width: 60px;
  font-weight: 600;
}
[data-template="infographic"] .lang-dots {
  display: flex;
  gap: 4px;
}
[data-template="infographic"] .lang-dot {
  width: 10px; height: 10px;
  border-radius: 2px;
  border: 1.5px solid var(--teal-light);
}
[data-template="infographic"] .lang-dot.filled {
  background: var(--teal-light);
}
[data-template="infographic"] .right-panel {
  padding: 36px 32px;
}
[data-template="infographic"] .section { margin-bottom: 22px; }
[data-template="infographic"] .section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
[data-template="infographic"] .section-badge {
  width: 30px; height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
[data-template="infographic"] .section-badge svg {
  width: 16px; height: 16px;
  fill: white;
}
[data-template="infographic"] .section-name {
  font-size: 16px;
  font-weight: 800;
  color: var(--dark);
}
[data-template="infographic"] .section-line {
  flex: 1;
  height: 2px;
  background: var(--border);
}
[data-template="infographic"] .summary-text {
  font-size: 11px;
  line-height: 1.8;
  color: var(--medium);
  padding: 14px;
  background: var(--bg);
  border-radius: 8px;
  border-left: 3px solid var(--teal);
}
[data-template="infographic"] .exp-item {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
[data-template="infographic"] .exp-time {
  text-align: center;
  padding-top: 2px;
}
[data-template="infographic"] .exp-year {
  font-size: 11px;
  font-weight: 800;
  color: var(--teal);
}
[data-template="infographic"] .exp-duration {
  font-size: 11px;
  color: var(--light);
  font-weight: 600;
}
[data-template="infographic"] .exp-card {
  background: var(--bg);
  border-radius: 8px;
  padding: 14px 16px;
  border-left: 3px solid;
}
[data-template="infographic"] .exp-role {
  font-size: 13px;
  font-weight: 800;
  color: var(--dark);
}
[data-template="infographic"] .exp-company {
  font-size: 11px;
  color: var(--medium);
  font-weight: 600;
  margin-bottom: 5px;
}
[data-template="infographic"] .exp-desc {
  font-size: 11px;
  color: var(--medium);
  line-height: 1.5;
}
[data-template="infographic"] .exp-desc li {
  margin-left: 14px;
  margin-bottom: 1px;
}
[data-template="infographic"] .metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
[data-template="infographic"] .metric-card {
  text-align: center;
  padding: 14px 10px;
  border-radius: 8px;
  color: white;
}
[data-template="infographic"] .metric-number {
  font-size: 22px;
  font-weight: 900;
}
[data-template="infographic"] .metric-label {
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.85;
  margin-top: 2px;
}
[data-template="infographic"] .edu-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: flex-start;
}
[data-template="infographic"] .edu-icon {
  width: 32px; height: 32px;
  min-width: 32px;
  border-radius: 8px;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
[data-template="infographic"] .edu-degree {
  font-size: 12px;
  font-weight: 700;
  color: var(--dark);
}
[data-template="infographic"] .edu-school {
  font-size: 11px;
  color: var(--medium);
}
[data-template="infographic"] .edu-year {
  font-size: 11px;
  color: var(--teal);
  font-weight: 700;
}
`;

export const CSS_06 = `
[data-template="dark-professional"] {
  --bg-dark: #0F0F0F;
  --bg-card: #1A1A1A;
  --bg-card-hover: #222;
  --neon-cyan: #00D4AA;
  --neon-purple: #A855F7;
  --neon-blue: #3B82F6;
  --text-white: #F5F5F5;
  --text-gray: #9CA3AF;
  --text-dark-gray: #6B7280;
  --border-dark: #2A2A2A;
  color: var(--text-white);
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="dark-professional"] .header {
  padding: 36px 40px 28px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: center;
  border-bottom: 1px solid var(--border-dark);
  position: relative;
}
[data-template="dark-professional"] .header::before {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 40px;
  width: 60px;
  height: 2px;
  background: var(--neon-cyan);
  box-shadow: 0 0 10px rgba(0, 212, 170, 0.3);
}
[data-template="dark-professional"] .name {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1.1;
}
[data-template="dark-professional"] .name-highlight {
  background: linear-gradient(135deg, var(--neon-cyan), var(--neon-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
[data-template="dark-professional"] .role {
  font-size: 12px;
  color: var(--text-gray);
  font-weight: 400;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-top: 6px;
}
[data-template="dark-professional"] .contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
}
[data-template="dark-professional"] .contact-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--bg-card);
  border-radius: 6px;
  border: 1px solid var(--border-dark);
}
[data-template="dark-professional"] .contact-chip svg {
  width: 11px; height: 11px;
  fill: var(--neon-cyan);
  min-width: 11px;
}
[data-template="dark-professional"] .contact-chip span {
  font-size: 11px;
  color: var(--text-gray);
}
[data-template="dark-professional"] .content {
  display: grid;
  grid-template-columns: 1fr 210px;
  gap: 28px;
  padding: 24px 40px 32px;
}
[data-template="dark-professional"] .section { margin-bottom: 20px; }
[data-template="dark-professional"] .section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--neon-cyan);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
[data-template="dark-professional"] .section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-dark);
}
[data-template="dark-professional"] .summary {
  font-size: 11px;
  line-height: 1.8;
  color: var(--text-gray);
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-dark);
}
[data-template="dark-professional"] .exp-card {
  background: var(--bg-card);
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
}
[data-template="dark-professional"] .exp-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
}
[data-template="dark-professional"] .exp-card:nth-child(1)::before { background: var(--neon-cyan); }
[data-template="dark-professional"] .exp-card:nth-child(2)::before { background: var(--neon-purple); }
[data-template="dark-professional"] .exp-card:nth-child(3)::before { background: var(--neon-blue); }
[data-template="dark-professional"] .exp-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
[data-template="dark-professional"] .exp-role {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-white);
}
[data-template="dark-professional"] .exp-date {
  font-size: 11px;
  color: var(--neon-cyan);
  font-weight: 600;
  letter-spacing: 0.5px;
}
[data-template="dark-professional"] .exp-company {
  font-size: 11px;
  color: var(--text-dark-gray);
  font-weight: 500;
  margin-bottom: 6px;
}
[data-template="dark-professional"] .exp-desc {
  font-size: 11px;
  color: var(--text-gray);
  line-height: 1.5;
}
[data-template="dark-professional"] .exp-desc li {
  margin-left: 14px;
  margin-bottom: 2px;
}
[data-template="dark-professional"] .exp-desc li::marker {
  color: var(--neon-cyan);
}
[data-template="dark-professional"] .exp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
[data-template="dark-professional"] .exp-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 10px;
  background: rgba(0, 212, 170, 0.1);
  color: var(--neon-cyan);
  font-weight: 600;
}
[data-template="dark-professional"] .edu-item {
  padding: 12px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  margin-bottom: 8px;
}
[data-template="dark-professional"] .edu-degree {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-white);
}
[data-template="dark-professional"] .edu-school {
  font-size: 11px;
  color: var(--text-dark-gray);
}
[data-template="dark-professional"] .edu-year {
  font-size: 11px;
  color: var(--neon-purple);
  font-weight: 600;
}
[data-template="dark-professional"] .skill-item { margin-bottom: 8px; }
[data-template="dark-professional"] .skill-top {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-gray);
  font-weight: 600;
  margin-bottom: 4px;
}
[data-template="dark-professional"] .skill-pct {
  color: var(--neon-cyan);
}
[data-template="dark-professional"] .skill-bar {
  height: 4px;
  background: var(--border-dark);
  border-radius: 2px;
  overflow: hidden;
}
[data-template="dark-professional"] .skill-fill {
  height: 100%;
  border-radius: 2px;
}
[data-template="dark-professional"] .cert-card {
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
  margin-bottom: 6px;
}
[data-template="dark-professional"] .cert-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-white);
}
[data-template="dark-professional"] .cert-org {
  font-size: 11px;
  color: var(--text-dark-gray);
}
[data-template="dark-professional"] .lang-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-dark);
}
[data-template="dark-professional"] .lang-item:last-child { border: none; }
[data-template="dark-professional"] .lang-name {
  font-size: 11px;
  color: var(--text-gray);
  font-weight: 500;
}
[data-template="dark-professional"] .lang-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
[data-template="dark-professional"] .project-item {
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
  margin-bottom: 6px;
}
[data-template="dark-professional"] .project-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--neon-cyan);
}
[data-template="dark-professional"] .project-desc {
  font-size: 11px;
  color: var(--text-dark-gray);
  line-height: 1.4;
  margin-top: 2px;
}
`;

export const CSS_07 = `
[data-template="gradient-creative"] {
  --gradient-1: linear-gradient(135deg, #667EEA, #764BA2);
  --gradient-2: linear-gradient(135deg, #F093FB, #F5576C);
  --gradient-3: linear-gradient(135deg, #4FACFE, #00F2FE);
  --purple: #764BA2;
  --pink: #F5576C;
  --blue: #4FACFE;
  --dark: #1A1030;
  --medium: #4A4458;
  --light: #8E859B;
  --bg: #FAFAFE;
  --white: #FFF;
  --border: #EDE8F5;
  position: relative;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="gradient-creative"] .grad-header {
  background: var(--gradient-1);
  padding: 32px 40px 28px;
  position: relative;
  overflow: hidden;
}
[data-template="gradient-creative"] .grad-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: rgba(255,255,255,0.06);
  border-radius: 50%;
}
[data-template="gradient-creative"] .grad-header::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: 10%;
  width: 200px;
  height: 200px;
  background: rgba(255,255,255,0.04);
  border-radius: 50%;
}
[data-template="gradient-creative"] .header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
[data-template="gradient-creative"] .header-tag {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255,255,255,0.15);
  border-radius: 20px;
  font-size: 11px;
  color: white;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 10px;
  backdrop-filter: blur(10px);
}
[data-template="gradient-creative"] .header-name {
  font-size: 36px;
  font-weight: 800;
  color: white;
  line-height: 1.05;
  letter-spacing: -1px;
}
[data-template="gradient-creative"] .header-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  font-weight: 400;
  margin-top: 6px;
}
[data-template="gradient-creative"] .header-contact {
  text-align: right;
}
[data-template="gradient-creative"] .hc-item {
  font-size: 11px;
  color: rgba(255,255,255,0.75);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
[data-template="gradient-creative"] .hc-item svg {
  width: 11px; height: 11px;
  fill: rgba(255,255,255,0.5);
}
[data-template="gradient-creative"] .wave {
  height: 24px;
  background: var(--white);
  position: relative;
  margin-top: -24px;
}
[data-template="gradient-creative"] .wave::before {
  content: '';
  position: absolute;
  top: -24px;
  left: 0; right: 0;
  height: 24px;
  background: var(--white);
  border-radius: 24px 24px 0 0;
}
[data-template="gradient-creative"] .body {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 28px;
  padding: 20px 40px 32px;
}
[data-template="gradient-creative"] .section { margin-bottom: 20px; }
[data-template="gradient-creative"] .section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
[data-template="gradient-creative"] .section-icon {
  width: 24px; height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
[data-template="gradient-creative"] .section-icon svg {
  width: 13px; height: 13px;
  fill: white;
}
[data-template="gradient-creative"] .summary {
  font-size: 11px;
  line-height: 1.8;
  color: var(--medium);
}
[data-template="gradient-creative"] .exp-item {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
[data-template="gradient-creative"] .exp-item:last-child { border: none; padding-bottom: 0; }
[data-template="gradient-creative"] .exp-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
[data-template="gradient-creative"] .exp-role {
  font-size: 13px;
  font-weight: 700;
  color: var(--dark);
}
[data-template="gradient-creative"] .exp-date {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
}
[data-template="gradient-creative"] .exp-company {
  font-size: 11px;
  color: var(--light);
  font-weight: 500;
  margin-bottom: 5px;
}
[data-template="gradient-creative"] .exp-desc {
  font-size: 11px;
  color: var(--medium);
  line-height: 1.6;
}
[data-template="gradient-creative"] .exp-desc li {
  margin-left: 14px;
  margin-bottom: 2px;
}
[data-template="gradient-creative"] .edu-card {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
}
[data-template="gradient-creative"] .edu-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 4px;
}
[data-template="gradient-creative"] .edu-degree {
  font-size: 12px;
  font-weight: 700;
  color: var(--dark);
}
[data-template="gradient-creative"] .edu-school {
  font-size: 11px;
  color: var(--light);
}
[data-template="gradient-creative"] .edu-year {
  font-size: 11px;
  font-weight: 600;
  color: var(--purple);
}
[data-template="gradient-creative"] .skill-pill {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  margin: 0 3px 6px 0;
}
[data-template="gradient-creative"] .interest-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg);
  border-radius: 8px;
  margin-bottom: 6px;
}
[data-template="gradient-creative"] .interest-emoji { font-size: 16px; }
[data-template="gradient-creative"] .interest-text {
  font-size: 11px;
  color: var(--medium);
  font-weight: 500;
}
[data-template="gradient-creative"] .ref-card {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 6px;
}
[data-template="gradient-creative"] .ref-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--dark);
}
[data-template="gradient-creative"] .ref-title {
  font-size: 11px;
  color: var(--light);
}
[data-template="gradient-creative"] .ref-contact {
  font-size: 11px;
  color: var(--purple);
  font-weight: 500;
  margin-top: 2px;
}
[data-template="gradient-creative"] .cert-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
[data-template="gradient-creative"] .cert-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  min-width: 8px;
}
[data-template="gradient-creative"] .cert-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--dark);
}
[data-template="gradient-creative"] .cert-org {
  font-size: 11px;
  color: var(--light);
}
`;

export const CSS_08 = `
[data-template="classic-corporate"] {
  --charcoal: #2B2B2B;
  --steel: #4A6274;
  --blue-accent: #2563EB;
  --blue-light: rgba(37, 99, 235, 0.06);
  --text-dark: #1A1A1A;
  --text-medium: #4A4A4A;
  --text-light: #7A7A7A;
  --white: #FFF;
  --bg: #FCFCFC;
  --border: #E5E5E5;
  --border-light: #F0F0F0;
  padding: 0;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="classic-corporate"] .header {
  padding: 44px 48px 32px;
  border-bottom: 3px solid var(--charcoal);
}
[data-template="classic-corporate"] .header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
[data-template="classic-corporate"] .full-name {
  font-family: 'Libre Baskerville', serif;
  font-size: 30px;
  font-weight: 700;
  color: var(--charcoal);
  letter-spacing: 0.5px;
}
[data-template="classic-corporate"] .job-title {
  font-size: 12px;
  color: var(--blue-accent);
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 4px;
}
[data-template="classic-corporate"] .contact-block {
  display: flex;
  gap: 20px;
}
[data-template="classic-corporate"] .cb-item {
  font-size: 11px;
  color: var(--text-medium);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
[data-template="classic-corporate"] .cb-item svg {
  width: 11px; height: 11px;
  fill: var(--blue-accent);
  min-width: 11px;
}
[data-template="classic-corporate"] .body-content {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 0;
}
[data-template="classic-corporate"] .main-column {
  padding: 28px 32px 28px 48px;
  border-right: 1px solid var(--border);
}
[data-template="classic-corporate"] .section { margin-bottom: 22px; }
[data-template="classic-corporate"] .section-title {
  font-family: 'Libre Baskerville', serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--charcoal);
  margin-bottom: 4px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
[data-template="classic-corporate"] .profile-text {
  font-size: 11px;
  line-height: 1.75;
  color: var(--text-medium);
  margin-top: 10px;
}
[data-template="classic-corporate"] .exp-item {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 16px;
}
[data-template="classic-corporate"] .exp-dates {
  font-size: 11px;
  font-weight: 600;
  color: var(--blue-accent);
}
[data-template="classic-corporate"] .exp-loc {
  font-size: 11px;
  color: var(--text-light);
  margin-top: 1px;
}
[data-template="classic-corporate"] .exp-role {
  font-family: 'Libre Baskerville', serif;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-dark);
}
[data-template="classic-corporate"] .exp-company {
  font-size: 11px;
  color: var(--text-medium);
  font-weight: 600;
  margin-bottom: 5px;
}
[data-template="classic-corporate"] .exp-bullets {
  font-size: 11px;
  color: var(--text-medium);
  line-height: 1.6;
}
[data-template="classic-corporate"] .exp-bullets li {
  margin-left: 14px;
  margin-bottom: 2px;
}
[data-template="classic-corporate"] .exp-bullets li::marker {
  color: var(--blue-accent);
}
[data-template="classic-corporate"] .edu-item {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 16px;
}
[data-template="classic-corporate"] .edu-year {
  font-size: 11px;
  font-weight: 600;
  color: var(--blue-accent);
}
[data-template="classic-corporate"] .edu-degree {
  font-family: 'Libre Baskerville', serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dark);
}
[data-template="classic-corporate"] .edu-school {
  font-size: 11px;
  color: var(--text-medium);
}
[data-template="classic-corporate"] .edu-note {
  font-size: 11px;
  color: var(--text-light);
  font-style: italic;
}
[data-template="classic-corporate"] .right-column {
  padding: 28px 24px;
  background: var(--bg);
}
[data-template="classic-corporate"] .rc-section { margin-bottom: 20px; }
[data-template="classic-corporate"] .rc-title {
  font-family: 'Libre Baskerville', serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--charcoal);
  padding-bottom: 5px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 10px;
}
[data-template="classic-corporate"] .competency {
  font-size: 11px;
  color: var(--text-medium);
  padding: 5px 0;
  border-bottom: 1px dotted var(--border-light);
  display: flex;
  align-items: center;
  gap: 6px;
}
[data-template="classic-corporate"] .competency:last-child { border: none; }
[data-template="classic-corporate"] .comp-bullet {
  width: 5px; height: 5px;
  min-width: 5px;
  background: var(--blue-accent);
  border-radius: 50%;
}
[data-template="classic-corporate"] .sw-item { margin-bottom: 6px; }
[data-template="classic-corporate"] .sw-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 2px;
}
[data-template="classic-corporate"] .sw-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
}
[data-template="classic-corporate"] .sw-fill {
  height: 100%;
  background: var(--blue-accent);
  border-radius: 2px;
}
[data-template="classic-corporate"] .lang-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px dotted var(--border-light);
}
[data-template="classic-corporate"] .lang-row:last-child { border: none; }
[data-template="classic-corporate"] .lang-name {
  font-size: 11px;
  color: var(--text-dark);
  font-weight: 600;
}
[data-template="classic-corporate"] .lang-level {
  font-size: 11px;
  color: var(--blue-accent);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
[data-template="classic-corporate"] .affiliation {
  font-size: 11px;
  color: var(--text-medium);
  padding: 4px 0;
  line-height: 1.4;
}
[data-template="classic-corporate"] .affiliation strong {
  color: var(--text-dark);
  display: block;
}
`;

export const CSS_09 = `
[data-template="artistic-portfolio"] {
  --coral: #FF6B6B;
  --coral-light: rgba(255, 107, 107, 0.08);
  --mint: #51CF66;
  --lavender: #845EF7;
  --amber: #FCC419;
  --sky: #339AF0;
  --dark: #212529;
  --medium: #495057;
  --light: #ADB5BD;
  --bg: #F8F9FA;
  --white: #FFF;
  --border: #E9ECEF;
  position: relative;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="artistic-portfolio"] .deco-circle {
  position: absolute;
  border-radius: 50%;
  z-index: 0;
}
[data-template="artistic-portfolio"] .deco-1 {
  width: 180px; height: 180px;
  background: var(--coral-light);
  top: -40px; right: -40px;
}
[data-template="artistic-portfolio"] .deco-2 {
  width: 120px; height: 120px;
  background: rgba(81, 207, 102, 0.06);
  bottom: 80px; left: -30px;
}
[data-template="artistic-portfolio"] .deco-3 {
  width: 80px; height: 80px;
  background: rgba(132, 94, 247, 0.06);
  top: 300px; right: 20px;
}
[data-template="artistic-portfolio"] .header {
  position: relative;
  z-index: 1;
  padding: 48px 48px 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 28px;
  align-items: center;
}
[data-template="artistic-portfolio"] .avatar-box {
  width: 110px; height: 110px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--coral), var(--lavender));
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-3deg);
}
[data-template="artistic-portfolio"] .avatar-initials {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 38px;
  font-weight: 800;
  color: white;
  transform: rotate(3deg);
}
[data-template="artistic-portfolio"] .name {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 36px;
  font-weight: 800;
  color: var(--dark);
  line-height: 1.1;
  letter-spacing: -0.5px;
}
[data-template="artistic-portfolio"] .role {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 14px;
  color: var(--coral);
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 4px;
}
[data-template="artistic-portfolio"] .contact-row {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  flex-wrap: wrap;
}
[data-template="artistic-portfolio"] .contact-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  color: var(--medium);
  padding: 4px 10px;
  background: var(--bg);
  border-radius: 14px;
}
[data-template="artistic-portfolio"] .contact-pill svg {
  width: 10px; height: 10px;
  fill: var(--coral);
}
[data-template="artistic-portfolio"] .color-bar {
  margin: 24px 48px 0;
  height: 4px;
  border-radius: 2px;
  display: flex;
  gap: 4px;
}
[data-template="artistic-portfolio"] .cb-seg {
  flex: 1;
  border-radius: 2px;
}
[data-template="artistic-portfolio"] .body {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 210px;
  gap: 28px;
  padding: 24px 48px 32px;
}
[data-template="artistic-portfolio"] .section { margin-bottom: 20px; }
[data-template="artistic-portfolio"] .section-title {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
[data-template="artistic-portfolio"] .st-shape {
  width: 18px; height: 18px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  transform: rotate(-5deg);
}
[data-template="artistic-portfolio"] .about {
  font-size: 13px;
  line-height: 1.7;
  color: var(--medium);
}
[data-template="artistic-portfolio"] .exp-card {
  margin-bottom: 16px;
  padding: 14px 16px;
  background: var(--bg);
  border-radius: 12px;
  position: relative;
}
[data-template="artistic-portfolio"] .exp-accent {
  position: absolute;
  top: 14px; left: 0;
  width: 4px; height: 20px;
  border-radius: 0 3px 3px 0;
}
[data-template="artistic-portfolio"] .exp-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
[data-template="artistic-portfolio"] .exp-role {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--dark);
}
[data-template="artistic-portfolio"] .exp-date {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--coral);
}
[data-template="artistic-portfolio"] .exp-company {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  color: var(--light);
  font-weight: 600;
  margin-bottom: 5px;
}
[data-template="artistic-portfolio"] .exp-desc {
  font-size: 11px;
  color: var(--medium);
  line-height: 1.5;
}
[data-template="artistic-portfolio"] .exp-desc li {
  margin-left: 14px;
  margin-bottom: 2px;
}
[data-template="artistic-portfolio"] .project-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
[data-template="artistic-portfolio"] .project-card {
  padding: 12px;
  border-radius: 10px;
  color: white;
  position: relative;
  overflow: hidden;
}
[data-template="artistic-portfolio"] .project-card::before {
  content: '';
  position: absolute;
  top: -15px; right: -15px;
  width: 50px; height: 50px;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
}
[data-template="artistic-portfolio"] .project-name {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 2px;
}
[data-template="artistic-portfolio"] .project-type {
  font-size: 11px;
  opacity: 0.8;
}
[data-template="artistic-portfolio"] .project-stat {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 16px;
  font-weight: 800;
  margin-top: 4px;
}
[data-template="artistic-portfolio"] .skill-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
[data-template="artistic-portfolio"] .skill-dot {
  width: 8px; height: 8px;
  border-radius: 3px;
  min-width: 8px;
  transform: rotate(45deg);
}
[data-template="artistic-portfolio"] .skill-name {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--dark);
}
[data-template="artistic-portfolio"] .award-card {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 6px;
}
[data-template="artistic-portfolio"] .award-year {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--coral);
  letter-spacing: 1px;
}
[data-template="artistic-portfolio"] .award-name {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--dark);
}
[data-template="artistic-portfolio"] .award-org {
  font-size: 11px;
  color: var(--light);
}
[data-template="artistic-portfolio"] .edu-mini { margin-bottom: 8px; }
[data-template="artistic-portfolio"] .edu-degree {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--dark);
}
[data-template="artistic-portfolio"] .edu-school {
  font-size: 11px;
  color: var(--light);
}
[data-template="artistic-portfolio"] .edu-year {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  color: var(--lavender);
  font-weight: 600;
}
[data-template="artistic-portfolio"] .hobby-bubble {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 20px;
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 11px;
  font-weight: 600;
  margin: 0 4px 5px 0;
  border: 1.5px solid;
}
`;

export const CSS_10 = `
[data-template="tech-modern"] {
  --bg: #0C1222;
  --bg-card: #111827;
  --bg-card-alt: #1E293B;
  --green: #22C55E;
  --green-dim: rgba(34, 197, 94, 0.1);
  --cyan: #06B6D4;
  --amber: #F59E0B;
  --purple: #A78BFA;
  --red: #EF4444;
  --text-white: #F1F5F9;
  --text-gray: #94A3B8;
  --text-dark: #64748B;
  --border: #1E293B;
  --line: #334155;
  color: var(--text-white);
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="tech-modern"] .terminal-bar {
  background: var(--bg-card);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border);
}
[data-template="tech-modern"] .term-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
}
[data-template="tech-modern"] .term-red { background: #EF4444; }
[data-template="tech-modern"] .term-yellow { background: #F59E0B; }
[data-template="tech-modern"] .term-green { background: #22C55E; }
[data-template="tech-modern"] .term-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-dark);
  margin-left: 8px;
}
[data-template="tech-modern"] .header {
  padding: 28px 36px 24px;
  border-bottom: 1px solid var(--border);
}
[data-template="tech-modern"] .header-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: start;
}
[data-template="tech-modern"] .comment {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-dark);
}
[data-template="tech-modern"] .name-line {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-gray);
  margin-top: 4px;
}
[data-template="tech-modern"] .name-line .keyword { color: var(--purple); }
[data-template="tech-modern"] .name-line .func { color: var(--cyan); }
[data-template="tech-modern"] .name-line .string { color: var(--green); }
[data-template="tech-modern"] .name-line .number { color: var(--amber); }
[data-template="tech-modern"] .name-line .paren { color: var(--text-dark); }
[data-template="tech-modern"] .big-name {
  font-size: 32px;
  font-weight: 800;
  margin-top: 6px;
  line-height: 1.1;
}
[data-template="tech-modern"] .big-name .first { color: var(--text-white); }
[data-template="tech-modern"] .big-name .last { color: var(--cyan); }
[data-template="tech-modern"] .big-role {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--green);
  margin-top: 4px;
}
[data-template="tech-modern"] .status-badges {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}
[data-template="tech-modern"] .status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-gray);
}
[data-template="tech-modern"] .status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
}
[data-template="tech-modern"] .content {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 24px;
  padding: 20px 36px 28px;
}
[data-template="tech-modern"] .section { margin-bottom: 18px; }
[data-template="tech-modern"] .section-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--cyan);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
[data-template="tech-modern"] .section-title .bracket { color: var(--purple); }
[data-template="tech-modern"] .section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}
[data-template="tech-modern"] .config-block {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.7;
}
[data-template="tech-modern"] .config-key { color: var(--cyan); }
[data-template="tech-modern"] .config-val { color: var(--green); }
[data-template="tech-modern"] .config-comment { color: var(--text-dark); }
[data-template="tech-modern"] .exp-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 8px;
}
[data-template="tech-modern"] .exp-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
[data-template="tech-modern"] .exp-role {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-white);
}
[data-template="tech-modern"] .exp-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--amber);
}
[data-template="tech-modern"] .exp-company {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--cyan);
  margin-bottom: 6px;
}
[data-template="tech-modern"] .exp-bullets {
  font-size: 11px;
  color: var(--text-gray);
  line-height: 1.55;
}
[data-template="tech-modern"] .exp-bullets li {
  margin-left: 14px;
  margin-bottom: 2px;
}
[data-template="tech-modern"] .exp-bullets li::marker { color: var(--green); }
[data-template="tech-modern"] .exp-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
[data-template="tech-modern"] .stack-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 600;
}
[data-template="tech-modern"] .edu-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 6px;
}
[data-template="tech-modern"] .edu-degree {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-white);
}
[data-template="tech-modern"] .edu-school {
  font-size: 11px;
  color: var(--text-dark);
}
[data-template="tech-modern"] .edu-year {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--green);
}
[data-template="tech-modern"] .tech-category { margin-bottom: 10px; }
[data-template="tech-modern"] .tech-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-dark);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
[data-template="tech-modern"] .tech-items {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
[data-template="tech-modern"] .tech-item {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 3px 7px;
  background: var(--bg-card-alt);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-gray);
}
[data-template="tech-modern"] .gh-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}
[data-template="tech-modern"] .gh-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
[data-template="tech-modern"] .gh-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-dark);
}
[data-template="tech-modern"] .gh-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
}
[data-template="tech-modern"] .cert-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
[data-template="tech-modern"] .cert-icon {
  width: 20px; height: 20px;
  min-width: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}
[data-template="tech-modern"] .cert-text {
  font-size: 11px;
  color: var(--text-gray);
}
[data-template="tech-modern"] .cert-text strong {
  color: var(--text-white);
  display: block;
  font-size: 11px;
}
[data-template="tech-modern"] .contact-code {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.7;
}
[data-template="tech-modern"] .cc-key { color: var(--cyan); }
[data-template="tech-modern"] .cc-val { color: var(--green); }
`;

// =============================================================================
// Templates 11-20
// =============================================================================

export const CSS_11 = `
[data-template="swiss-typographic"] {
  position: relative;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="swiss-typographic"] .top-rule {
  height: 6px;
  background: #E63946;
}
[data-template="swiss-typographic"] .header {
  padding: 36px 40px 24px;
  border-bottom: 1px solid #E0E0E0;
}
[data-template="swiss-typographic"] .name {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #1A1A1A;
  line-height: 1;
}
[data-template="swiss-typographic"] .role {
  font-size: 14px;
  font-weight: 400;
  color: #E63946;
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-top: 6px;
}
[data-template="swiss-typographic"] .contact-row {
  display: flex;
  gap: 20px;
  margin-top: 14px;
  flex-wrap: wrap;
}
[data-template="swiss-typographic"] .contact-item {
  font-size: 11px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
}
[data-template="swiss-typographic"] .contact-item svg {
  width: 11px; height: 11px;
  fill: #E63946;
  flex-shrink: 0;
}
[data-template="swiss-typographic"] .content {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 0;
}
[data-template="swiss-typographic"] .main {
  padding: 24px 28px 32px 40px;
  border-right: 1px solid #E0E0E0;
}
[data-template="swiss-typographic"] .sidebar {
  padding: 24px 24px 32px 20px;
}
[data-template="swiss-typographic"] .section { margin-bottom: 20px; }
[data-template="swiss-typographic"] .section:last-child { margin-bottom: 0; }
[data-template="swiss-typographic"] .section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #E63946;
  margin-bottom: 10px;
  padding-bottom: 4px;
  border-bottom: 2px solid #1A1A1A;
}
[data-template="swiss-typographic"] .summary {
  font-size: 12px;
  line-height: 1.6;
  color: #444;
}
[data-template="swiss-typographic"] .exp-item { margin-bottom: 16px; }
[data-template="swiss-typographic"] .exp-item:last-child { margin-bottom: 0; }
[data-template="swiss-typographic"] .exp-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
[data-template="swiss-typographic"] .exp-role {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A1A;
}
[data-template="swiss-typographic"] .exp-date {
  font-size: 11px;
  color: #999;
  font-weight: 500;
}
[data-template="swiss-typographic"] .exp-company {
  font-size: 12px;
  color: #E63946;
  font-weight: 500;
  margin-top: 1px;
}
[data-template="swiss-typographic"] .exp-desc {
  font-size: 11px;
  color: #555;
  line-height: 1.55;
  margin-top: 4px;
}
[data-template="swiss-typographic"] .exp-desc li {
  margin-left: 14px;
  margin-bottom: 2px;
}
[data-template="swiss-typographic"] .edu-item { margin-bottom: 12px; }
[data-template="swiss-typographic"] .edu-item:last-child { margin-bottom: 0; }
[data-template="swiss-typographic"] .edu-degree {
  font-size: 12px;
  font-weight: 600;
  color: #1A1A1A;
}
[data-template="swiss-typographic"] .edu-school {
  font-size: 11px;
  color: #666;
}
[data-template="swiss-typographic"] .edu-year {
  font-size: 11px;
  color: #999;
}
[data-template="swiss-typographic"] .sb-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #E63946;
  margin-bottom: 8px;
  padding-bottom: 3px;
  border-bottom: 2px solid #1A1A1A;
}
[data-template="swiss-typographic"] .sb-section { margin-bottom: 18px; }
[data-template="swiss-typographic"] .sb-section:last-child { margin-bottom: 0; }
[data-template="swiss-typographic"] .skill-item {
  font-size: 11px;
  color: #333;
  margin-bottom: 6px;
  padding-left: 10px;
  position: relative;
}
[data-template="swiss-typographic"] .skill-item::before {
  content: '—';
  position: absolute;
  left: 0;
  color: #E63946;
  font-weight: 700;
}
[data-template="swiss-typographic"] .lang-item {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 5px;
}
[data-template="swiss-typographic"] .lang-name { color: #333; }
[data-template="swiss-typographic"] .lang-level { color: #999; font-weight: 500; }
[data-template="swiss-typographic"] .cert-item { margin-bottom: 8px; }
[data-template="swiss-typographic"] .cert-name {
  font-size: 11px;
  font-weight: 500;
  color: #333;
}
[data-template="swiss-typographic"] .cert-org {
  font-size: 11px;
  color: #999;
}
[data-template="swiss-typographic"] .interest-list {
  font-size: 11px;
  color: #444;
  line-height: 1.8;
}
`;

export const CSS_12 = `
[data-template="newspaper-editorial"] {
  padding: 36px 36px 32px;
  position: relative;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="newspaper-editorial"] .masthead {
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 3px double #1A1A1A;
}
[data-template="newspaper-editorial"] .dateline {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 4px;
}
[data-template="newspaper-editorial"] .name {
  font-family: 'Playfair Display', serif;
  font-size: 44px;
  font-weight: 900;
  color: #1A1A1A;
  line-height: 1;
  letter-spacing: -1px;
}
[data-template="newspaper-editorial"] .tagline {
  font-size: 13px;
  font-style: italic;
  color: #666;
  margin-top: 6px;
}
[data-template="newspaper-editorial"] .contact-bar {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #DDD;
}
[data-template="newspaper-editorial"] .contact-item {
  font-size: 11px;
  color: #777;
}
[data-template="newspaper-editorial"] .columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 18px;
}
[data-template="newspaper-editorial"] .col-left { border-right: 1px solid #DDD; padding-right: 22px; }
[data-template="newspaper-editorial"] .col-right { padding-left: 2px; }
[data-template="newspaper-editorial"] .section { margin-bottom: 16px; }
[data-template="newspaper-editorial"] .section:last-child { margin-bottom: 0; }
[data-template="newspaper-editorial"] .section-title {
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  font-weight: 700;
  color: #1A1A1A;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #CCC;
}
[data-template="newspaper-editorial"] .lede {
  font-size: 13px;
  line-height: 1.65;
  color: #333;
  text-align: justify;
}
[data-template="newspaper-editorial"] .lede::first-letter {
  font-family: 'Playfair Display', serif;
  font-size: 36px;
  float: left;
  line-height: 0.8;
  margin-right: 4px;
  margin-top: 4px;
  color: #1A1A1A;
  font-weight: 900;
}
[data-template="newspaper-editorial"] .exp-item { margin-bottom: 14px; }
[data-template="newspaper-editorial"] .exp-item:last-child { margin-bottom: 0; }
[data-template="newspaper-editorial"] .exp-headline {
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  font-weight: 700;
  color: #1A1A1A;
  line-height: 1.3;
}
[data-template="newspaper-editorial"] .exp-byline {
  font-size: 11px;
  color: #888;
  font-style: italic;
  margin-top: 1px;
}
[data-template="newspaper-editorial"] .exp-body {
  font-size: 11px;
  color: #444;
  line-height: 1.55;
  margin-top: 4px;
  text-align: justify;
}
[data-template="newspaper-editorial"] .edu-item { margin-bottom: 10px; }
[data-template="newspaper-editorial"] .edu-item:last-child { margin-bottom: 0; }
[data-template="newspaper-editorial"] .edu-degree {
  font-family: 'Playfair Display', serif;
  font-size: 12px;
  font-weight: 700;
  color: #1A1A1A;
}
[data-template="newspaper-editorial"] .edu-detail {
  font-size: 11px;
  color: #666;
  font-style: italic;
}
[data-template="newspaper-editorial"] .skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 10px;
}
[data-template="newspaper-editorial"] .skill-item {
  font-size: 11px;
  color: #333;
  padding: 3px 0;
  border-bottom: 1px dotted #DDD;
}
[data-template="newspaper-editorial"] .award-item { margin-bottom: 8px; }
[data-template="newspaper-editorial"] .award-item:last-child { margin-bottom: 0; }
[data-template="newspaper-editorial"] .award-name {
  font-size: 12px;
  font-weight: 500;
  color: #1A1A1A;
}
[data-template="newspaper-editorial"] .award-detail {
  font-size: 11px;
  color: #888;
  font-style: italic;
}
[data-template="newspaper-editorial"] .pub-item {
  margin-bottom: 8px;
  font-size: 11px;
  color: #444;
  line-height: 1.5;
}
[data-template="newspaper-editorial"] .pub-item em { color: #1A1A1A; font-weight: 500; }
[data-template="newspaper-editorial"] .footer {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 3px double #1A1A1A;
  text-align: center;
  font-size: 11px;
  color: #AAA;
  font-style: italic;
}
`;

export const CSS_13 = `
[data-template="brutalist-mono"] {
  position: relative;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="brutalist-mono"] .header {
  background: #000;
  color: #FFF;
  padding: 32px 36px 28px;
  position: relative;
}
[data-template="brutalist-mono"] .header-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 20px;
}
[data-template="brutalist-mono"] .name {
  font-family: 'Space Mono', monospace;
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 2px;
}
[data-template="brutalist-mono"] .role {
  font-size: 13px;
  font-weight: 400;
  color: #00FF88;
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-top: 6px;
}
[data-template="brutalist-mono"] .header-contact { text-align: right; }
[data-template="brutalist-mono"] .hc-line {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: #AAA;
  margin-bottom: 3px;
}
[data-template="brutalist-mono"] .hc-line span { color: #00FF88; }
[data-template="brutalist-mono"] .stripe-bar {
  height: 8px;
  background: repeating-linear-gradient(90deg, #000 0px, #000 4px, #00FF88 4px, #00FF88 8px, #FFF 8px, #FFF 12px);
}
[data-template="brutalist-mono"] .body { padding: 24px 36px 28px; }
[data-template="brutalist-mono"] .section { margin-bottom: 20px; }
[data-template="brutalist-mono"] .section:last-child { margin-bottom: 0; }
[data-template="brutalist-mono"] .section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
[data-template="brutalist-mono"] .section-number {
  font-family: 'Space Mono', monospace;
  font-size: 22px;
  font-weight: 700;
  color: #000;
  line-height: 1;
}
[data-template="brutalist-mono"] .section-title {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #000;
  padding-bottom: 3px;
  border-bottom: 3px solid #000;
}
[data-template="brutalist-mono"] .summary {
  font-size: 12px;
  line-height: 1.6;
  color: #333;
  border-left: 4px solid #00FF88;
  padding-left: 14px;
}
[data-template="brutalist-mono"] .exp-grid {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 0;
}
[data-template="brutalist-mono"] .exp-item { display: contents; }
[data-template="brutalist-mono"] .exp-date-col {
  padding: 10px 12px 10px 0;
  border-right: 3px solid #000;
  text-align: right;
}
[data-template="brutalist-mono"] .exp-date {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: #666;
  font-weight: 700;
}
[data-template="brutalist-mono"] .exp-content {
  padding: 10px 0 10px 14px;
  border-bottom: 1px solid #E0E0E0;
}
[data-template="brutalist-mono"] .exp-item:last-child .exp-content { border-bottom: none; }
[data-template="brutalist-mono"] .exp-role {
  font-size: 13px;
  font-weight: 600;
  color: #000;
}
[data-template="brutalist-mono"] .exp-company {
  font-size: 11px;
  color: #00AA66;
  font-weight: 500;
  margin-top: 1px;
}
[data-template="brutalist-mono"] .exp-desc {
  font-size: 11px;
  color: #555;
  line-height: 1.5;
  margin-top: 4px;
}
[data-template="brutalist-mono"] .bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
[data-template="brutalist-mono"] .edu-item {
  margin-bottom: 10px;
  padding-left: 12px;
  border-left: 3px solid #000;
}
[data-template="brutalist-mono"] .edu-item:last-child { margin-bottom: 0; }
[data-template="brutalist-mono"] .edu-degree { font-size: 12px; font-weight: 600; color: #000; }
[data-template="brutalist-mono"] .edu-school { font-size: 11px; color: #666; }
[data-template="brutalist-mono"] .edu-year { font-family: 'Space Mono', monospace; font-size: 11px; color: #999; }
[data-template="brutalist-mono"] .skill-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}
[data-template="brutalist-mono"] .skill-tag {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  padding: 4px 8px;
  background: #000;
  color: #00FF88;
  display: inline-block;
}
[data-template="brutalist-mono"] .cert-item { margin-bottom: 6px; }
[data-template="brutalist-mono"] .cert-name { font-size: 11px; font-weight: 500; color: #000; }
[data-template="brutalist-mono"] .cert-org { font-size: 11px; color: #888; }
[data-template="brutalist-mono"] .lang-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  padding: 3px 0;
  border-bottom: 1px dashed #DDD;
}
[data-template="brutalist-mono"] .lang-name { color: #333; font-weight: 500; }
[data-template="brutalist-mono"] .lang-level { color: #888; }
`;

export const CSS_14 = `
[data-template="pastel-soft"] {
  --pink: #F8A4C8;
  --lavender: #C4B5E0;
  --mint: #A8E6CF;
  --peach: #FFDAB9;
  --sky: #B8D4E3;
  --dark: #3D3D3D;
  --text: #4A4A4A;
  --light-text: #888;
  position: relative;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="pastel-soft"] .header {
  padding: 32px 36px 24px;
  background: linear-gradient(135deg, #FDE8F0 0%, #F0E6F6 50%, #E6F0F8 100%);
  position: relative;
}
[data-template="pastel-soft"] .header::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--pink), var(--lavender), var(--mint), var(--sky));
}
[data-template="pastel-soft"] .header-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
[data-template="pastel-soft"] .name {
  font-size: 36px;
  font-weight: 700;
  color: var(--dark);
  line-height: 1.05;
}
[data-template="pastel-soft"] .role {
  font-size: 14px;
  color: #9B7DB8;
  font-weight: 600;
  margin-top: 4px;
}
[data-template="pastel-soft"] .contact-col { text-align: right; }
[data-template="pastel-soft"] .contact-item {
  font-size: 11px;
  color: #777;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}
[data-template="pastel-soft"] .contact-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
[data-template="pastel-soft"] .body {
  display: grid;
  grid-template-columns: 1fr 190px;
  gap: 24px;
  padding: 24px 36px 28px;
}
[data-template="pastel-soft"] .section { margin-bottom: 18px; }
[data-template="pastel-soft"] .section:last-child { margin-bottom: 0; }
[data-template="pastel-soft"] .section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--dark);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
[data-template="pastel-soft"] .section-title::before {
  content: '';
  width: 14px; height: 14px;
  border-radius: 4px;
  flex-shrink: 0;
}
[data-template="pastel-soft"] .section-title.pink::before { background: var(--pink); }
[data-template="pastel-soft"] .section-title.lavender::before { background: var(--lavender); }
[data-template="pastel-soft"] .section-title.mint::before { background: var(--mint); }
[data-template="pastel-soft"] .section-title.peach::before { background: var(--peach); }
[data-template="pastel-soft"] .section-title.sky::before { background: var(--sky); }
[data-template="pastel-soft"] .summary {
  font-size: 12px; line-height: 1.6; color: var(--text);
}
[data-template="pastel-soft"] .exp-item {
  margin-bottom: 14px;
  padding-left: 14px;
  border-left: 3px solid var(--lavender);
}
[data-template="pastel-soft"] .exp-item:last-child { margin-bottom: 0; }
[data-template="pastel-soft"] .exp-item:nth-child(2) { border-color: var(--mint); }
[data-template="pastel-soft"] .exp-item:nth-child(3) { border-color: var(--pink); }
[data-template="pastel-soft"] .exp-item:nth-child(4) { border-color: var(--sky); }
[data-template="pastel-soft"] .exp-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
[data-template="pastel-soft"] .exp-role { font-size: 13px; font-weight: 700; color: var(--dark); }
[data-template="pastel-soft"] .exp-date { font-size: 11px; color: var(--light-text); font-weight: 600; }
[data-template="pastel-soft"] .exp-company { font-size: 12px; color: #9B7DB8; font-weight: 600; }
[data-template="pastel-soft"] .exp-desc {
  font-size: 11px; color: #666; line-height: 1.5; margin-top: 3px;
}
[data-template="pastel-soft"] .edu-item {
  background: #F8F5FA;
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 8px;
}
[data-template="pastel-soft"] .edu-item:last-child { margin-bottom: 0; }
[data-template="pastel-soft"] .edu-degree { font-size: 12px; font-weight: 700; color: var(--dark); }
[data-template="pastel-soft"] .edu-school { font-size: 11px; color: #888; }
[data-template="pastel-soft"] .edu-year { font-size: 11px; color: #AAA; }
[data-template="pastel-soft"] .sb-section { margin-bottom: 16px; }
[data-template="pastel-soft"] .sb-section:last-child { margin-bottom: 0; }
[data-template="pastel-soft"] .sb-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 2px; color: var(--dark); margin-bottom: 8px;
  display: flex; align-items: center; gap: 5px;
}
[data-template="pastel-soft"] .sb-title::before {
  content: '';
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
[data-template="pastel-soft"] .sb-title.pink::before { background: var(--pink); }
[data-template="pastel-soft"] .sb-title.lavender::before { background: var(--lavender); }
[data-template="pastel-soft"] .sb-title.mint::before { background: var(--mint); }
[data-template="pastel-soft"] .sb-title.peach::before { background: var(--peach); }
[data-template="pastel-soft"] .sb-title.sky::before { background: var(--sky); }
[data-template="pastel-soft"] .skill-pills { display: flex; flex-wrap: wrap; gap: 4px; }
[data-template="pastel-soft"] .skill-pill {
  font-size: 11px; padding: 3px 10px; border-radius: 12px; font-weight: 600; color: #555;
}
[data-template="pastel-soft"] .skill-pill:nth-child(5n+1) { background: #FDE8F0; }
[data-template="pastel-soft"] .skill-pill:nth-child(5n+2) { background: #EDE6F6; }
[data-template="pastel-soft"] .skill-pill:nth-child(5n+3) { background: #E6F8EF; }
[data-template="pastel-soft"] .skill-pill:nth-child(5n+4) { background: #FFF3E6; }
[data-template="pastel-soft"] .skill-pill:nth-child(5n+5) { background: #E6F0F8; }
[data-template="pastel-soft"] .lang-item {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
}
[data-template="pastel-soft"] .lang-name { font-size: 11px; color: #444; }
[data-template="pastel-soft"] .lang-dots { display: flex; gap: 3px; }
[data-template="pastel-soft"] .lang-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #E8E4EF;
}
[data-template="pastel-soft"] .lang-dot.filled { background: var(--lavender); }
[data-template="pastel-soft"] .cert-item { margin-bottom: 8px; }
[data-template="pastel-soft"] .cert-name { font-size: 11px; font-weight: 600; color: #444; }
[data-template="pastel-soft"] .cert-org { font-size: 11px; color: #AAA; }
[data-template="pastel-soft"] .interest-item {
  font-size: 11px; color: #555; margin-bottom: 4px; padding-left: 14px; position: relative;
}
[data-template="pastel-soft"] .interest-item::before {
  content: '♡'; position: absolute; left: 0; color: var(--pink);
}
`;

export const CSS_15 = `
[data-template="split-duotone"] {
  --teal: #0D4F4F;
  --coral: #FF6B5A;
  --cream: #FFF9F5;
  --dark: #1A1A1A;
  display: grid;
  grid-template-columns: 210px 1fr;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
[data-template="split-duotone"] .left {
  background: var(--teal);
  color: #FFF;
  padding: 32px 20px 28px;
  display: flex;
  flex-direction: column;
}
[data-template="split-duotone"] .avatar-ring {
  width: 80px; height: 80px;
  border-radius: 50%;
  border: 3px solid var(--coral);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}
[data-template="split-duotone"] .avatar-initials {
  font-size: 28px; font-weight: 800; color: var(--coral);
}
[data-template="split-duotone"] .left-name {
  text-align: center; font-size: 18px; font-weight: 700; line-height: 1.2;
}
[data-template="split-duotone"] .left-role {
  text-align: center; font-size: 11px; color: var(--coral); font-weight: 500;
  margin-top: 3px; margin-bottom: 20px;
}
[data-template="split-duotone"] .left-section { margin-bottom: 16px; }
[data-template="split-duotone"] .left-section:last-child { margin-bottom: 0; }
[data-template="split-duotone"] .left-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
  color: var(--coral); margin-bottom: 8px; padding-bottom: 3px;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}
[data-template="split-duotone"] .lc-item {
  font-size: 11px; color: rgba(255,255,255,0.8); margin-bottom: 5px;
  display: flex; align-items: flex-start; gap: 6px; line-height: 1.3;
}
[data-template="split-duotone"] .lc-icon {
  width: 11px; height: 11px; fill: var(--coral); flex-shrink: 0; margin-top: 1px;
}
[data-template="split-duotone"] .skill-row { margin-bottom: 8px; }
[data-template="split-duotone"] .skill-row:last-child { margin-bottom: 0; }
[data-template="split-duotone"] .skill-name { font-size: 11px; color: #FFF; margin-bottom: 3px; }
[data-template="split-duotone"] .skill-bar {
  height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px;
}
[data-template="split-duotone"] .skill-fill {
  height: 100%; background: var(--coral); border-radius: 2px;
}
[data-template="split-duotone"] .lang-row {
  display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;
}
[data-template="split-duotone"] .lang-name { color: #FFF; }
[data-template="split-duotone"] .lang-level { color: rgba(255,255,255,0.5); }
[data-template="split-duotone"] .interest {
  font-size: 11px; color: rgba(255,255,255,0.75); margin-bottom: 3px;
}
[data-template="split-duotone"] .right {
  background: var(--cream); padding: 32px 32px 28px;
}
[data-template="split-duotone"] .section { margin-bottom: 20px; }
[data-template="split-duotone"] .section:last-child { margin-bottom: 0; }
[data-template="split-duotone"] .section-title {
  font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;
  color: var(--teal); margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
}
[data-template="split-duotone"] .section-title::after {
  content: ''; flex: 1; height: 2px; background: var(--teal); opacity: 0.2;
}
[data-template="split-duotone"] .summary { font-size: 12px; line-height: 1.65; color: #555; }
[data-template="split-duotone"] .exp-item {
  margin-bottom: 16px; position: relative; padding-left: 16px;
}
[data-template="split-duotone"] .exp-item:last-child { margin-bottom: 0; }
[data-template="split-duotone"] .exp-item::before {
  content: ''; position: absolute; left: 0; top: 4px;
  width: 8px; height: 8px; border-radius: 50%; background: var(--coral);
}
[data-template="split-duotone"] .exp-item::after {
  content: ''; position: absolute; left: 3.5px; top: 14px; bottom: -12px;
  width: 1px; background: #DDD;
}
[data-template="split-duotone"] .exp-item:last-child::after { display: none; }
[data-template="split-duotone"] .exp-header {
  display: flex; justify-content: space-between; align-items: baseline;
}
[data-template="split-duotone"] .exp-role { font-size: 13px; font-weight: 700; color: var(--dark); }
[data-template="split-duotone"] .exp-date { font-size: 11px; color: var(--coral); font-weight: 600; }
[data-template="split-duotone"] .exp-company { font-size: 12px; color: var(--teal); font-weight: 600; }
[data-template="split-duotone"] .exp-desc { font-size: 11px; color: #666; line-height: 1.55; margin-top: 3px; }
[data-template="split-duotone"] .edu-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
[data-template="split-duotone"] .edu-card {
  background: #FFF; padding: 12px; border-radius: 8px; border-left: 3px solid var(--coral);
}
[data-template="split-duotone"] .edu-degree { font-size: 12px; font-weight: 700; color: var(--dark); }
[data-template="split-duotone"] .edu-school { font-size: 11px; color: #888; margin-top: 1px; }
[data-template="split-duotone"] .edu-year { font-size: 11px; color: var(--coral); font-weight: 600; }
[data-template="split-duotone"] .cert-row { display: flex; flex-wrap: wrap; gap: 6px; }
[data-template="split-duotone"] .cert-tag {
  font-size: 11px; padding: 4px 10px; background: var(--teal);
  color: #FFF; border-radius: 14px; font-weight: 500;
}
`;

export const CSS_16 = `
[data-template="architecture-blueprint"] {
  --navy: #0A1628; --blue: #2563EB; --steel: #64748B; --grid: #E8ECF0;
  position: relative;
  overflow-wrap: break-word;
  word-wrap: break-word;
  background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 20px 20px;
}
[data-template="architecture-blueprint"] .header {
  background: var(--navy); padding: 28px 36px;
  display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 20px;
}
[data-template="architecture-blueprint"] .name { font-size: 32px; font-weight: 700; color: #FFF; letter-spacing: -0.5px; }
[data-template="architecture-blueprint"] .name span { color: var(--blue); }
[data-template="architecture-blueprint"] .role { font-size: 13px; color: #94A3B8; font-weight: 400; margin-top: 2px; letter-spacing: 1px; }
[data-template="architecture-blueprint"] .contact-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px;
}
[data-template="architecture-blueprint"] .contact-item {
  font-size: 11px; color: #94A3B8; display: flex; align-items: center; gap: 5px;
}
[data-template="architecture-blueprint"] .contact-item svg { width: 11px; height: 11px; fill: var(--blue); flex-shrink: 0; }
[data-template="architecture-blueprint"] .frame {
  border: 2px solid var(--navy); margin: 16px; padding: 20px 24px; position: relative;
}
[data-template="architecture-blueprint"] .frame-label {
  position: absolute; top: -8px; right: 20px; background: #FDFDFD;
  padding: 0 8px; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--steel);
}
[data-template="architecture-blueprint"] .section { margin-bottom: 18px; }
[data-template="architecture-blueprint"] .section:last-child { margin-bottom: 0; }
[data-template="architecture-blueprint"] .section-title {
  font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500;
  text-transform: uppercase; letter-spacing: 3px; color: var(--navy);
  margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid var(--navy);
  display: flex; align-items: center; gap: 6px;
}
[data-template="architecture-blueprint"] .section-title::before { content: '◆'; color: var(--blue); font-size: 11px; }
[data-template="architecture-blueprint"] .summary { font-size: 12px; line-height: 1.6; color: #555; }
[data-template="architecture-blueprint"] .exp-grid { display: grid; grid-template-columns: 80px 1fr; }
[data-template="architecture-blueprint"] .exp-item { display: contents; }
[data-template="architecture-blueprint"] .exp-year {
  font-family: 'DM Mono', monospace; font-size: 11px; color: var(--blue); font-weight: 500;
  padding: 8px 10px 8px 0; border-right: 2px solid var(--navy); text-align: right;
}
[data-template="architecture-blueprint"] .exp-body { padding: 8px 0 8px 14px; border-bottom: 1px dashed var(--grid); }
[data-template="architecture-blueprint"] .exp-item:last-child .exp-body { border-bottom: none; }
[data-template="architecture-blueprint"] .exp-role { font-size: 13px; font-weight: 700; color: var(--navy); }
[data-template="architecture-blueprint"] .exp-company { font-size: 11px; color: var(--blue); font-weight: 500; }
[data-template="architecture-blueprint"] .exp-desc { font-size: 11px; color: #666; line-height: 1.5; margin-top: 3px; }
[data-template="architecture-blueprint"] .two-col {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
}
[data-template="architecture-blueprint"] .edu-item { margin-bottom: 10px; }
[data-template="architecture-blueprint"] .edu-item:last-child { margin-bottom: 0; }
[data-template="architecture-blueprint"] .edu-degree { font-size: 12px; font-weight: 600; color: var(--navy); }
[data-template="architecture-blueprint"] .edu-school { font-size: 11px; color: var(--steel); }
[data-template="architecture-blueprint"] .edu-year { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--blue); }
[data-template="architecture-blueprint"] .skill-cat { margin-bottom: 8px; }
[data-template="architecture-blueprint"] .skill-cat-title {
  font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; color: var(--navy); margin-bottom: 3px;
}
[data-template="architecture-blueprint"] .skill-items { font-size: 11px; color: #666; line-height: 1.6; }
[data-template="architecture-blueprint"] .sw-row {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
}
[data-template="architecture-blueprint"] .sw-name { font-size: 11px; color: #444; }
[data-template="architecture-blueprint"] .sw-bar { width: 80px; height: 4px; background: var(--grid); border-radius: 2px; }
[data-template="architecture-blueprint"] .sw-fill { height: 100%; background: var(--navy); border-radius: 2px; }
[data-template="architecture-blueprint"] .cert-item { margin-bottom: 6px; }
[data-template="architecture-blueprint"] .cert-name { font-size: 11px; font-weight: 500; color: var(--navy); }
[data-template="architecture-blueprint"] .cert-org { font-size: 11px; color: var(--steel); }
[data-template="architecture-blueprint"] .title-block {
  margin-top: 14px; border: 2px solid var(--navy);
  display: grid; grid-template-columns: 1fr 1fr 1fr;
}
[data-template="architecture-blueprint"] .tb-cell { padding: 6px 10px; border-right: 1px solid var(--navy); }
[data-template="architecture-blueprint"] .tb-cell:last-child { border-right: none; }
[data-template="architecture-blueprint"] .tb-label { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--steel); }
[data-template="architecture-blueprint"] .tb-value { font-size: 11px; font-weight: 600; color: var(--navy); }
`;

export const CSS_17 = `
[data-template="retro-vintage"] {
  --brown: #5C3D2E; --gold: #C4973B; --cream: #FBF6EE; --tan: #EDE4D4; --text: #3A3A3A;
  position: relative; overflow-wrap: break-word; word-wrap: break-word;
  background: var(--cream); border: 3px solid var(--brown);
}
[data-template="retro-vintage"] .inner-border {
  position: absolute; top: 6px; left: 6px; right: 6px; bottom: 6px;
  border: 1px solid var(--gold); pointer-events: none;
}
[data-template="retro-vintage"] .header {
  text-align: center; padding: 28px 36px 18px;
  border-bottom: 2px solid var(--brown); margin: 0 10px;
}
[data-template="retro-vintage"] .ornament { font-size: 16px; color: var(--gold); letter-spacing: 6px; margin-bottom: 4px; }
[data-template="retro-vintage"] .name {
  font-family: 'Stint Ultra Expanded', serif; font-size: 30px; color: var(--brown);
  text-transform: uppercase; letter-spacing: 4px; line-height: 1.1;
}
[data-template="retro-vintage"] .role {
  font-size: 12px; color: var(--gold); text-transform: uppercase;
  letter-spacing: 5px; font-weight: 400; margin-top: 6px;
}
[data-template="retro-vintage"] .contact-row {
  display: flex; justify-content: center; gap: 16px; margin-top: 10px; flex-wrap: wrap;
}
[data-template="retro-vintage"] .contact-item { font-size: 11px; color: #777; }
[data-template="retro-vintage"] .contact-item span { color: var(--gold); }
[data-template="retro-vintage"] .body {
  display: grid; grid-template-columns: 1fr 170px; gap: 0; margin: 0 10px;
}
[data-template="retro-vintage"] .main { padding: 20px 20px 24px 26px; border-right: 1px solid var(--tan); }
[data-template="retro-vintage"] .sidebar {
  padding: 20px 16px 24px; background: linear-gradient(180deg, var(--cream) 0%, #F5EDE0 100%);
}
[data-template="retro-vintage"] .section { margin-bottom: 16px; }
[data-template="retro-vintage"] .section:last-child { margin-bottom: 0; }
[data-template="retro-vintage"] .section-title {
  font-family: 'Stint Ultra Expanded', serif; font-size: 12px; color: var(--brown);
  text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px;
  text-align: center; position: relative;
}
[data-template="retro-vintage"] .section-title::before,
[data-template="retro-vintage"] .section-title::after { content: '—'; margin: 0 6px; color: var(--gold); }
[data-template="retro-vintage"] .summary {
  font-size: 12px; line-height: 1.65; color: var(--text);
  text-align: center; font-style: italic; font-weight: 300;
}
[data-template="retro-vintage"] .exp-item { margin-bottom: 14px; text-align: center; }
[data-template="retro-vintage"] .exp-item:last-child { margin-bottom: 0; }
[data-template="retro-vintage"] .exp-role {
  font-size: 13px; font-weight: 700; color: var(--brown); text-transform: uppercase; letter-spacing: 1px;
}
[data-template="retro-vintage"] .exp-company { font-size: 12px; color: var(--gold); font-weight: 500; }
[data-template="retro-vintage"] .exp-date { font-size: 11px; color: #999; }
[data-template="retro-vintage"] .exp-desc { font-size: 11px; color: #555; line-height: 1.55; margin-top: 4px; text-align: left; }
[data-template="retro-vintage"] .exp-divider { text-align: center; color: var(--gold); font-size: 11px; margin: 8px 0; letter-spacing: 4px; }
[data-template="retro-vintage"] .edu-item { text-align: center; margin-bottom: 10px; }
[data-template="retro-vintage"] .edu-item:last-child { margin-bottom: 0; }
[data-template="retro-vintage"] .edu-degree { font-size: 12px; font-weight: 600; color: var(--brown); }
[data-template="retro-vintage"] .edu-school { font-size: 11px; color: #888; }
[data-template="retro-vintage"] .edu-year { font-size: 11px; color: var(--gold); }
[data-template="retro-vintage"] .sb-section { margin-bottom: 14px; }
[data-template="retro-vintage"] .sb-section:last-child { margin-bottom: 0; }
[data-template="retro-vintage"] .sb-title {
  font-family: 'Stint Ultra Expanded', serif; font-size: 11px; color: var(--brown);
  text-transform: uppercase; letter-spacing: 2px; text-align: center;
  margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid var(--tan);
}
[data-template="retro-vintage"] .skill-item {
  font-size: 11px; color: var(--text); text-align: center; margin-bottom: 4px; padding: 2px 0;
}
[data-template="retro-vintage"] .skill-item:last-child { margin-bottom: 0; }
[data-template="retro-vintage"] .lang-item {
  display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;
}
[data-template="retro-vintage"] .lang-name { color: var(--text); }
[data-template="retro-vintage"] .lang-level { color: var(--gold); font-style: italic; }
[data-template="retro-vintage"] .cert-item { text-align: center; margin-bottom: 8px; }
[data-template="retro-vintage"] .cert-name { font-size: 11px; font-weight: 500; color: var(--text); }
[data-template="retro-vintage"] .cert-org { font-size: 11px; color: #AAA; font-style: italic; }
[data-template="retro-vintage"] .interest-item { font-size: 11px; color: #666; text-align: center; margin-bottom: 3px; }
[data-template="retro-vintage"] .footer {
  text-align: center; padding: 8px; margin: 0 10px; border-top: 2px solid var(--brown);
}
[data-template="retro-vintage"] .footer-ornament { color: var(--gold); font-size: 12px; letter-spacing: 4px; }
`;

export const CSS_18 = `
[data-template="medical-clean"] {
  --teal: #0891B2; --dark-teal: #155E75; --light-teal: #E0F7FA; --dark: #1E293B;
  position: relative; overflow-wrap: break-word; word-wrap: break-word;
}
[data-template="medical-clean"] .header {
  display: grid; grid-template-columns: 1fr auto; align-items: center;
  padding: 28px 36px; border-bottom: 4px solid var(--teal);
}
[data-template="medical-clean"] .name { font-size: 34px; font-weight: 800; color: var(--dark); line-height: 1; }
[data-template="medical-clean"] .credentials { font-size: 14px; color: var(--teal); font-weight: 600; margin-top: 2px; }
[data-template="medical-clean"] .role { font-size: 12px; color: #64748B; margin-top: 4px; }
[data-template="medical-clean"] .contact-card {
  background: var(--light-teal); padding: 12px 16px; border-radius: 8px;
}
[data-template="medical-clean"] .cc-item {
  font-size: 11px; color: var(--dark-teal); margin-bottom: 3px;
  display: flex; align-items: center; gap: 6px;
}
[data-template="medical-clean"] .cc-item:last-child { margin-bottom: 0; }
[data-template="medical-clean"] .cc-item svg { width: 12px; height: 12px; fill: var(--teal); flex-shrink: 0; }
[data-template="medical-clean"] .body {
  display: grid; grid-template-columns: 1fr 190px; gap: 0;
}
[data-template="medical-clean"] .main { padding: 22px 24px 28px 36px; }
[data-template="medical-clean"] .sidebar {
  padding: 22px 20px 28px; background: #F8FAFB; border-left: 1px solid #E8ECEF;
}
[data-template="medical-clean"] .section { margin-bottom: 18px; }
[data-template="medical-clean"] .section:last-child { margin-bottom: 0; }
[data-template="medical-clean"] .section-title {
  font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;
  color: var(--teal); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
}
[data-template="medical-clean"] .summary { font-size: 12px; line-height: 1.6; color: #555; }
[data-template="medical-clean"] .exp-item { margin-bottom: 14px; }
[data-template="medical-clean"] .exp-item:last-child { margin-bottom: 0; }
[data-template="medical-clean"] .exp-top { display: flex; justify-content: space-between; align-items: baseline; }
[data-template="medical-clean"] .exp-role { font-size: 13px; font-weight: 700; color: var(--dark); }
[data-template="medical-clean"] .exp-date { font-size: 11px; color: var(--teal); font-weight: 600; }
[data-template="medical-clean"] .exp-company { font-size: 12px; color: #64748B; font-weight: 500; }
[data-template="medical-clean"] .exp-desc { font-size: 11px; color: #666; line-height: 1.55; margin-top: 3px; }
[data-template="medical-clean"] .exp-desc li { margin-left: 14px; margin-bottom: 2px; }
[data-template="medical-clean"] .edu-item { margin-bottom: 10px; }
[data-template="medical-clean"] .edu-item:last-child { margin-bottom: 0; }
[data-template="medical-clean"] .edu-degree { font-size: 12px; font-weight: 700; color: var(--dark); }
[data-template="medical-clean"] .edu-school { font-size: 11px; color: #64748B; }
[data-template="medical-clean"] .edu-year { font-size: 11px; color: var(--teal); }
[data-template="medical-clean"] .sb-section { margin-bottom: 16px; }
[data-template="medical-clean"] .sb-section:last-child { margin-bottom: 0; }
[data-template="medical-clean"] .sb-title {
  font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;
  color: var(--teal); margin-bottom: 8px; padding-bottom: 3px; border-bottom: 2px solid var(--teal);
}
[data-template="medical-clean"] .skill-item {
  font-size: 11px; color: #444; padding: 3px 0; border-bottom: 1px solid #EEE;
}
[data-template="medical-clean"] .skill-item:last-child { border-bottom: none; }
[data-template="medical-clean"] .license-item { margin-bottom: 6px; }
[data-template="medical-clean"] .license-name { font-size: 11px; font-weight: 600; color: var(--dark); }
[data-template="medical-clean"] .license-detail { font-size: 11px; color: #888; }
[data-template="medical-clean"] .lang-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
[data-template="medical-clean"] .lang-name { color: #444; }
[data-template="medical-clean"] .lang-level { color: var(--teal); font-weight: 500; }
[data-template="medical-clean"] .affil-item {
  font-size: 11px; color: #555; margin-bottom: 4px; padding-left: 10px; position: relative;
}
[data-template="medical-clean"] .affil-item::before {
  content: '+'; position: absolute; left: 0; color: var(--teal); font-weight: 700;
}
`;

export const CSS_19 = `
[data-template="neon-glass"] {
  --bg: #0F0A1A; --card: rgba(255,255,255,0.05); --card-border: rgba(255,255,255,0.08);
  --neon-pink: #FF2D78; --neon-blue: #00C2FF; --neon-purple: #B44AFF;
  position: relative; background: var(--bg); color: #E0E0E0;
  overflow-wrap: break-word; word-wrap: break-word;
}
[data-template="neon-glass"]::before {
  content: ''; position: absolute; top: -100px; right: -100px;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(180,74,255,0.12) 0%, transparent 70%);
  pointer-events: none;
}
[data-template="neon-glass"]::after {
  content: ''; position: absolute; bottom: -80px; left: -80px;
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(0,194,255,0.08) 0%, transparent 70%);
  pointer-events: none;
}
[data-template="neon-glass"] .header { padding: 30px 34px 22px; position: relative; z-index: 1; }
[data-template="neon-glass"] .header-flex { display: flex; justify-content: space-between; align-items: flex-end; }
[data-template="neon-glass"] .name {
  font-size: 38px; font-weight: 800; line-height: 1;
  background: linear-gradient(135deg, var(--neon-pink), var(--neon-purple), var(--neon-blue));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
[data-template="neon-glass"] .role { font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 400; margin-top: 4px; }
[data-template="neon-glass"] .contact-list { text-align: right; }
[data-template="neon-glass"] .contact-item { font-size: 11px; color: rgba(255,255,255,0.45); margin-bottom: 3px; }
[data-template="neon-glass"] .contact-item span { color: var(--neon-blue); }
[data-template="neon-glass"] .glass {
  background: var(--card); border: 1px solid var(--card-border);
  border-radius: 12px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
[data-template="neon-glass"] .body {
  display: grid; grid-template-columns: 1fr 190px; gap: 16px;
  padding: 8px 20px 24px; position: relative; z-index: 1;
}
[data-template="neon-glass"] .section { margin-bottom: 14px; }
[data-template="neon-glass"] .section:last-child { margin-bottom: 0; }
[data-template="neon-glass"] .section-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px;
  margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1);
  background: linear-gradient(90deg, var(--neon-pink), var(--neon-blue));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
[data-template="neon-glass"] .summary { font-size: 12px; line-height: 1.6; color: rgba(255,255,255,0.6); font-weight: 300; }
[data-template="neon-glass"] .exp-card { padding: 12px 14px; margin-bottom: 10px; }
[data-template="neon-glass"] .exp-card:last-child { margin-bottom: 0; }
[data-template="neon-glass"] .exp-top { display: flex; justify-content: space-between; align-items: baseline; }
[data-template="neon-glass"] .exp-role { font-size: 13px; font-weight: 600; color: #FFF; }
[data-template="neon-glass"] .exp-date { font-size: 11px; color: var(--neon-pink); font-weight: 500; }
[data-template="neon-glass"] .exp-company { font-size: 11px; color: var(--neon-blue); font-weight: 500; }
[data-template="neon-glass"] .exp-desc { font-size: 11px; color: rgba(255,255,255,0.5); line-height: 1.5; margin-top: 4px; }
[data-template="neon-glass"] .edu-card { padding: 10px 14px; margin-bottom: 8px; }
[data-template="neon-glass"] .edu-card:last-child { margin-bottom: 0; }
[data-template="neon-glass"] .edu-degree { font-size: 12px; font-weight: 600; color: #FFF; }
[data-template="neon-glass"] .edu-school { font-size: 11px; color: rgba(255,255,255,0.4); }
[data-template="neon-glass"] .edu-year { font-size: 11px; color: var(--neon-purple); font-weight: 500; }
[data-template="neon-glass"] .sidebar-inner { padding: 14px; }
[data-template="neon-glass"] .sb-section { margin-bottom: 16px; }
[data-template="neon-glass"] .sb-section:last-child { margin-bottom: 0; }
[data-template="neon-glass"] .sb-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 2px; color: var(--neon-pink); margin-bottom: 8px;
}
[data-template="neon-glass"] .skill-pills { display: flex; flex-wrap: wrap; gap: 4px; }
[data-template="neon-glass"] .skill-pill {
  font-size: 11px; padding: 3px 8px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-weight: 400;
}
[data-template="neon-glass"] .skill-pill:nth-child(3n+1) { border-color: rgba(255,45,120,0.3); }
[data-template="neon-glass"] .skill-pill:nth-child(3n+2) { border-color: rgba(0,194,255,0.3); }
[data-template="neon-glass"] .skill-pill:nth-child(3n+3) { border-color: rgba(180,74,255,0.3); }
[data-template="neon-glass"] .lang-item { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
[data-template="neon-glass"] .lang-name { color: rgba(255,255,255,0.6); }
[data-template="neon-glass"] .lang-level { color: var(--neon-blue); font-weight: 500; }
[data-template="neon-glass"] .cert-item { margin-bottom: 6px; }
[data-template="neon-glass"] .cert-name { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.7); }
[data-template="neon-glass"] .cert-org { font-size: 11px; color: rgba(255,255,255,0.3); }
[data-template="neon-glass"] .interest { font-size: 11px; color: rgba(255,255,255,0.45); margin-bottom: 3px; }
`;

export const CSS_20 = `
[data-template="corporate-stripe"] {
  --navy: #1B2A4A; --accent: #D4A84B; --light-navy: #2A3F6A; --bg: #FAFBFC;
  position: relative; overflow-wrap: break-word; word-wrap: break-word;
}
[data-template="corporate-stripe"] .left-stripe {
  position: absolute; top: 0; left: 0; width: 8px; height: 100%;
  background: linear-gradient(180deg, var(--navy) 0%, var(--light-navy) 50%, var(--accent) 100%);
}
[data-template="corporate-stripe"] .header {
  margin-left: 8px; background: var(--navy); padding: 28px 32px;
  display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 20px;
}
[data-template="corporate-stripe"] .name { font-size: 32px; font-weight: 800; color: #FFF; letter-spacing: -0.5px; }
[data-template="corporate-stripe"] .role { font-size: 13px; color: var(--accent); font-weight: 400; margin-top: 2px; }
[data-template="corporate-stripe"] .contact-col { text-align: right; }
[data-template="corporate-stripe"] .contact-item {
  font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 3px;
  display: flex; align-items: center; justify-content: flex-end; gap: 5px;
}
[data-template="corporate-stripe"] .contact-item svg { width: 11px; height: 11px; fill: var(--accent); flex-shrink: 0; }
[data-template="corporate-stripe"] .body {
  margin-left: 8px; display: grid; grid-template-columns: 1fr 185px; gap: 0;
}
[data-template="corporate-stripe"] .main { padding: 22px 24px 28px 32px; }
[data-template="corporate-stripe"] .sidebar { padding: 22px 20px 28px 16px; border-left: 1px solid #E0E3E8; }
[data-template="corporate-stripe"] .section { margin-bottom: 18px; }
[data-template="corporate-stripe"] .section:last-child { margin-bottom: 0; }
[data-template="corporate-stripe"] .section-title {
  font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
  color: var(--navy); margin-bottom: 8px; padding-bottom: 4px;
  border-bottom: 3px solid var(--accent); display: inline-block;
}
[data-template="corporate-stripe"] .summary { font-size: 12px; line-height: 1.65; color: #555; }
[data-template="corporate-stripe"] .exp-item { margin-bottom: 14px; }
[data-template="corporate-stripe"] .exp-item:last-child { margin-bottom: 0; }
[data-template="corporate-stripe"] .exp-header { display: flex; justify-content: space-between; align-items: baseline; }
[data-template="corporate-stripe"] .exp-role { font-size: 13px; font-weight: 700; color: var(--navy); }
[data-template="corporate-stripe"] .exp-date { font-size: 11px; color: var(--accent); font-weight: 600; }
[data-template="corporate-stripe"] .exp-company { font-size: 12px; color: var(--light-navy); font-weight: 500; }
[data-template="corporate-stripe"] .exp-desc { font-size: 11px; color: #666; line-height: 1.55; margin-top: 3px; }
[data-template="corporate-stripe"] .exp-desc li { margin-left: 14px; margin-bottom: 2px; }
[data-template="corporate-stripe"] .edu-item { margin-bottom: 10px; }
[data-template="corporate-stripe"] .edu-item:last-child { margin-bottom: 0; }
[data-template="corporate-stripe"] .edu-degree { font-size: 12px; font-weight: 700; color: var(--navy); }
[data-template="corporate-stripe"] .edu-school { font-size: 11px; color: #888; }
[data-template="corporate-stripe"] .edu-year { font-size: 11px; color: var(--accent); }
[data-template="corporate-stripe"] .sb-section { margin-bottom: 16px; }
[data-template="corporate-stripe"] .sb-section:last-child { margin-bottom: 0; }
[data-template="corporate-stripe"] .sb-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
  color: var(--navy); margin-bottom: 8px; padding-bottom: 3px; border-bottom: 2px solid var(--accent);
}
[data-template="corporate-stripe"] .skill-item {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; color: #444; margin-bottom: 5px;
}
[data-template="corporate-stripe"] .skill-dots { display: flex; gap: 3px; }
[data-template="corporate-stripe"] .skill-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #E0E3E8;
}
[data-template="corporate-stripe"] .skill-dot.active { background: var(--navy); }
[data-template="corporate-stripe"] .lang-item {
  display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;
}
[data-template="corporate-stripe"] .lang-name { color: #444; }
[data-template="corporate-stripe"] .lang-level { color: #888; font-weight: 500; }
[data-template="corporate-stripe"] .cert-item { margin-bottom: 8px; }
[data-template="corporate-stripe"] .cert-name { font-size: 11px; font-weight: 600; color: #333; }
[data-template="corporate-stripe"] .cert-org { font-size: 11px; color: #999; }
[data-template="corporate-stripe"] .affil-item { font-size: 11px; color: #555; margin-bottom: 3px; }
`;

// =============================================================================
// Combined map for easy lookup by template ID
// =============================================================================
export const TEMPLATE_CSS: Record<string, string> = {
  'modern-minimalist': CSS_01,
  'corporate-executive': CSS_02,
  'creative-bold': CSS_03,
  'elegant-sidebar': CSS_04,
  'infographic': CSS_05,
  'dark-professional': CSS_06,
  'gradient-creative': CSS_07,
  'classic-corporate': CSS_08,
  'artistic-portfolio': CSS_09,
  'tech-modern': CSS_10,
  'swiss-typographic': CSS_11,
  'newspaper-editorial': CSS_12,
  'brutalist-mono': CSS_13,
  'pastel-soft': CSS_14,
  'split-duotone': CSS_15,
  'architecture-blueprint': CSS_16,
  'retro-vintage': CSS_17,
  'medical-clean': CSS_18,
  'neon-glass': CSS_19,
  'corporate-stripe': CSS_20,
};
