// =============================================================================
// Invoice Template CSS -- Scoped styles for 10 invoice templates
// Uses [data-invoice-template="..."] attribute scoping to prevent conflicts
// =============================================================================

export const INV_CSS_MODERN_CLEAN = `
[data-invoice-template="modern-clean"] {
  --inv-text-dark: #111827;
  --inv-text-medium: #4b5563;
  --inv-text-light: #9ca3af;
  --inv-bg: #ffffff;
  --inv-border: #e5e7eb;
  --inv-stripe: #f9fafb;
  font-family: var(--inv-body-font, 'Inter', sans-serif);
  color: var(--inv-text-dark);
  background: var(--inv-bg);
  line-height: 1.5;
  overflow-wrap: break-word;
}
[data-invoice-template="modern-clean"] .inv-header {
  background: linear-gradient(135deg, var(--inv-accent), color-mix(in srgb, var(--inv-accent) 80%, #000));
  color: #fff;
  padding: 36px 44px 28px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
[data-invoice-template="modern-clean"] .inv-header-left { flex: 1; }
[data-invoice-template="modern-clean"] .inv-company-name {
  font-family: var(--inv-heading-font, 'Inter', sans-serif);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
}
[data-invoice-template="modern-clean"] .inv-company-details {
  font-size: 10.5px;
  opacity: 0.85;
  line-height: 1.6;
}
[data-invoice-template="modern-clean"] .inv-header-right { text-align: right; }
[data-invoice-template="modern-clean"] .inv-invoice-title {
  font-family: var(--inv-heading-font, 'Inter', sans-serif);
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -1px;
  text-transform: uppercase;
  opacity: 0.95;
}
[data-invoice-template="modern-clean"] .inv-invoice-number {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 2px;
}
[data-invoice-template="modern-clean"] .inv-status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255,255,255,0.2);
  margin-top: 8px;
}
[data-invoice-template="modern-clean"] .inv-body { padding: 28px 44px 20px; }
[data-invoice-template="modern-clean"] .inv-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 28px;
}
[data-invoice-template="modern-clean"] .inv-meta-block {}
[data-invoice-template="modern-clean"] .inv-meta-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="modern-clean"] .inv-meta-value {
  font-size: 12px;
  color: var(--inv-text-dark);
  line-height: 1.5;
}
[data-invoice-template="modern-clean"] .inv-meta-value strong {
  font-weight: 600;
  display: block;
  margin-bottom: 2px;
}
[data-invoice-template="modern-clean"] .inv-detail-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: var(--inv-accent-light);
  border-radius: 8px;
}
[data-invoice-template="modern-clean"] .inv-detail-item { flex: 1; }
[data-invoice-template="modern-clean"] .inv-detail-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
  margin-bottom: 2px;
}
[data-invoice-template="modern-clean"] .inv-detail-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--inv-text-dark);
}
[data-invoice-template="modern-clean"] .inv-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
}
[data-invoice-template="modern-clean"] .inv-table thead th {
  background: var(--inv-accent);
  color: #fff;
  font-size: 9.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 14px;
  text-align: left;
}
[data-invoice-template="modern-clean"] .inv-table thead th:last-child,
[data-invoice-template="modern-clean"] .inv-table thead th.text-right { text-align: right; }
[data-invoice-template="modern-clean"] .inv-table thead th.text-center { text-align: center; }
[data-invoice-template="modern-clean"] .inv-table tbody td {
  padding: 10px 14px;
  font-size: 11.5px;
  border-bottom: 1px solid var(--inv-border);
}
[data-invoice-template="modern-clean"] .inv-table tbody tr:nth-child(even) {
  background: var(--inv-stripe);
}
[data-invoice-template="modern-clean"] .inv-table tbody td.text-right { text-align: right; }
[data-invoice-template="modern-clean"] .inv-table tbody td.text-center { text-align: center; }
[data-invoice-template="modern-clean"] .inv-table tbody td.item-desc {
  font-weight: 500;
  color: var(--inv-text-dark);
}
[data-invoice-template="modern-clean"] .inv-totals {
  margin-left: auto;
  width: 280px;
  margin-bottom: 28px;
}
[data-invoice-template="modern-clean"] .inv-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
  color: var(--inv-text-medium);
}
[data-invoice-template="modern-clean"] .inv-totals-row.grand-total {
  border-top: 2px solid var(--inv-accent);
  margin-top: 6px;
  padding-top: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--inv-accent);
}
[data-invoice-template="modern-clean"] .inv-footer-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--inv-border);
}
[data-invoice-template="modern-clean"] .inv-footer-section {}
[data-invoice-template="modern-clean"] .inv-footer-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="modern-clean"] .inv-footer-text {
  font-size: 10.5px;
  color: var(--inv-text-medium);
  line-height: 1.6;
}
[data-invoice-template="modern-clean"] .inv-signature-area {
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid var(--inv-border);
  display: flex;
  justify-content: flex-end;
}
[data-invoice-template="modern-clean"] .inv-signature-block { text-align: center; }
[data-invoice-template="modern-clean"] .inv-signature-line {
  width: 180px;
  border-bottom: 1px solid var(--inv-text-dark);
  margin-bottom: 6px;
  height: 40px;
}
[data-invoice-template="modern-clean"] .inv-signature-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--inv-text-dark);
}
[data-invoice-template="modern-clean"] .inv-signature-title {
  font-size: 10px;
  color: var(--inv-text-light);
}
[data-invoice-template="modern-clean"] .inv-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 72px;
  font-weight: 800;
  text-transform: uppercase;
  color: rgba(0,0,0,0.04);
  pointer-events: none;
  white-space: nowrap;
}
[data-invoice-template="modern-clean"] .inv-page-footer {
  text-align: center;
  font-size: 9px;
  color: var(--inv-text-light);
  padding: 12px 44px;
  border-top: 1px solid var(--inv-border);
}
`;

export const INV_CSS_CLASSIC_PROFESSIONAL = `
[data-invoice-template="classic-professional"] {
  --inv-text-dark: #1e293b;
  --inv-text-medium: #475569;
  --inv-text-light: #94a3b8;
  --inv-bg: #ffffff;
  --inv-border: #cbd5e1;
  font-family: var(--inv-body-font, 'Source Sans 3', sans-serif);
  color: var(--inv-text-dark);
  background: var(--inv-bg);
  line-height: 1.5;
}
[data-invoice-template="classic-professional"] .inv-header {
  padding: 40px 48px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 3px double var(--inv-accent);
}
[data-invoice-template="classic-professional"] .inv-company-name {
  font-family: var(--inv-heading-font, 'Playfair Display', serif);
  font-size: 26px;
  font-weight: 700;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="classic-professional"] .inv-company-details {
  font-size: 10.5px;
  color: var(--inv-text-medium);
  line-height: 1.6;
}
[data-invoice-template="classic-professional"] .inv-header-right { text-align: right; }
[data-invoice-template="classic-professional"] .inv-invoice-title {
  font-family: var(--inv-heading-font, 'Playfair Display', serif);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--inv-text-medium);
}
[data-invoice-template="classic-professional"] .inv-invoice-number {
  font-size: 22px;
  font-weight: 700;
  color: var(--inv-accent);
  margin-top: 2px;
}
[data-invoice-template="classic-professional"] .inv-status-badge {
  display: inline-block;
  padding: 3px 12px;
  border: 1px solid var(--inv-accent);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 8px;
}
[data-invoice-template="classic-professional"] .inv-body { padding: 28px 48px 20px; }
[data-invoice-template="classic-professional"] .inv-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  margin-bottom: 28px;
}
[data-invoice-template="classic-professional"] .inv-meta-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--inv-text-light);
  margin-bottom: 8px;
}
[data-invoice-template="classic-professional"] .inv-meta-value {
  font-size: 12px;
  color: var(--inv-text-dark);
  line-height: 1.5;
}
[data-invoice-template="classic-professional"] .inv-meta-value strong {
  font-weight: 600;
  display: block;
  margin-bottom: 2px;
}
[data-invoice-template="classic-professional"] .inv-detail-row {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding: 14px 20px;
  border: 1px solid var(--inv-border);
}
[data-invoice-template="classic-professional"] .inv-detail-item { flex: 1; }
[data-invoice-template="classic-professional"] .inv-detail-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-text-light);
  margin-bottom: 3px;
}
[data-invoice-template="classic-professional"] .inv-detail-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--inv-text-dark);
}
[data-invoice-template="classic-professional"] .inv-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
}
[data-invoice-template="classic-professional"] .inv-table thead th {
  border-top: 2px solid var(--inv-accent);
  border-bottom: 2px solid var(--inv-accent);
  font-size: 9.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 10px 14px;
  text-align: left;
  color: var(--inv-accent);
}
[data-invoice-template="classic-professional"] .inv-table thead th:last-child,
[data-invoice-template="classic-professional"] .inv-table thead th.text-right { text-align: right; }
[data-invoice-template="classic-professional"] .inv-table tbody td {
  padding: 10px 14px;
  font-size: 11.5px;
  border-bottom: 1px solid var(--inv-border);
}
[data-invoice-template="classic-professional"] .inv-table tbody td.text-right { text-align: right; }
[data-invoice-template="classic-professional"] .inv-table tbody td.item-desc { font-weight: 500; }
[data-invoice-template="classic-professional"] .inv-totals {
  margin-left: auto;
  width: 260px;
  margin-bottom: 28px;
}
[data-invoice-template="classic-professional"] .inv-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
  color: var(--inv-text-medium);
}
[data-invoice-template="classic-professional"] .inv-totals-row.grand-total {
  border-top: 2px solid var(--inv-accent);
  border-bottom: 2px solid var(--inv-accent);
  margin-top: 6px;
  padding: 10px 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--inv-accent);
}
[data-invoice-template="classic-professional"] .inv-footer-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--inv-border);
}
[data-invoice-template="classic-professional"] .inv-footer-title {
  font-family: var(--inv-heading-font, 'Playfair Display', serif);
  font-size: 11px;
  font-weight: 700;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="classic-professional"] .inv-footer-text {
  font-size: 10.5px;
  color: var(--inv-text-medium);
  line-height: 1.6;
}
[data-invoice-template="classic-professional"] .inv-signature-area {
  margin-top: 30px;
  padding-top: 16px;
  border-top: 1px solid var(--inv-border);
  display: flex;
  justify-content: flex-end;
}
[data-invoice-template="classic-professional"] .inv-signature-block { text-align: center; }
[data-invoice-template="classic-professional"] .inv-signature-line {
  width: 200px;
  border-bottom: 1px solid var(--inv-accent);
  margin-bottom: 6px;
  height: 40px;
}
[data-invoice-template="classic-professional"] .inv-signature-name {
  font-size: 11px;
  font-weight: 600;
}
[data-invoice-template="classic-professional"] .inv-signature-title {
  font-size: 10px;
  color: var(--inv-text-light);
}
[data-invoice-template="classic-professional"] .inv-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 72px;
  font-weight: 800;
  text-transform: uppercase;
  color: rgba(0,0,0,0.04);
  pointer-events: none;
}
[data-invoice-template="classic-professional"] .inv-page-footer {
  text-align: center;
  font-size: 9px;
  color: var(--inv-text-light);
  padding: 12px 48px;
  border-top: 1px solid var(--inv-border);
}
`;

export const INV_CSS_MINIMAL_WHITE = `
[data-invoice-template="minimal-white"] {
  --inv-text-dark: #1e293b;
  --inv-text-medium: #64748b;
  --inv-text-light: #94a3b8;
  --inv-bg: #ffffff;
  --inv-border: #e2e8f0;
  font-family: var(--inv-body-font, 'Lato', sans-serif);
  color: var(--inv-text-dark);
  background: var(--inv-bg);
  line-height: 1.6;
}
[data-invoice-template="minimal-white"] .inv-header {
  padding: 48px 52px 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
[data-invoice-template="minimal-white"] .inv-company-name {
  font-family: var(--inv-heading-font, 'Raleway', sans-serif);
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--inv-text-dark);
}
[data-invoice-template="minimal-white"] .inv-company-details {
  font-size: 10px;
  color: var(--inv-text-light);
  line-height: 1.6;
  margin-top: 4px;
}
[data-invoice-template="minimal-white"] .inv-header-right { text-align: right; }
[data-invoice-template="minimal-white"] .inv-invoice-title {
  font-family: var(--inv-heading-font, 'Raleway', sans-serif);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--inv-text-light);
}
[data-invoice-template="minimal-white"] .inv-invoice-number {
  font-size: 24px;
  font-weight: 300;
  color: var(--inv-text-dark);
  margin-top: 0px;
}
[data-invoice-template="minimal-white"] .inv-status-badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
  border: 1px solid var(--inv-border);
  margin-top: 6px;
}
[data-invoice-template="minimal-white"] .inv-body { padding: 24px 52px 20px; }
[data-invoice-template="minimal-white"] .inv-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}
[data-invoice-template="minimal-white"] .inv-meta-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--inv-text-light);
  margin-bottom: 8px;
}
[data-invoice-template="minimal-white"] .inv-meta-value {
  font-size: 11.5px;
  color: var(--inv-text-medium);
  line-height: 1.6;
}
[data-invoice-template="minimal-white"] .inv-meta-value strong {
  font-weight: 600;
  color: var(--inv-text-dark);
  display: block;
  margin-bottom: 2px;
}
[data-invoice-template="minimal-white"] .inv-detail-row {
  display: flex;
  gap: 32px;
  margin-bottom: 28px;
}
[data-invoice-template="minimal-white"] .inv-detail-item { flex: 1; }
[data-invoice-template="minimal-white"] .inv-detail-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--inv-text-light);
  margin-bottom: 3px;
}
[data-invoice-template="minimal-white"] .inv-detail-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--inv-text-dark);
}
[data-invoice-template="minimal-white"] .inv-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 28px;
}
[data-invoice-template="minimal-white"] .inv-table thead th {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  padding: 10px 0;
  text-align: left;
  color: var(--inv-text-light);
  border-bottom: 1px solid var(--inv-border);
}
[data-invoice-template="minimal-white"] .inv-table thead th:last-child,
[data-invoice-template="minimal-white"] .inv-table thead th.text-right { text-align: right; }
[data-invoice-template="minimal-white"] .inv-table tbody td {
  padding: 10px 0;
  font-size: 11.5px;
  border-bottom: 1px solid #f1f5f9;
}
[data-invoice-template="minimal-white"] .inv-table tbody td.text-right { text-align: right; }
[data-invoice-template="minimal-white"] .inv-table tbody td.item-desc {
  font-weight: 500;
  color: var(--inv-text-dark);
}
[data-invoice-template="minimal-white"] .inv-totals {
  margin-left: auto;
  width: 240px;
  margin-bottom: 32px;
}
[data-invoice-template="minimal-white"] .inv-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 11.5px;
  color: var(--inv-text-medium);
}
[data-invoice-template="minimal-white"] .inv-totals-row.grand-total {
  border-top: 1px solid var(--inv-text-dark);
  margin-top: 8px;
  padding-top: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--inv-text-dark);
}
[data-invoice-template="minimal-white"] .inv-footer-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--inv-border);
}
[data-invoice-template="minimal-white"] .inv-footer-title {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--inv-text-light);
  margin-bottom: 6px;
}
[data-invoice-template="minimal-white"] .inv-footer-text {
  font-size: 10.5px;
  color: var(--inv-text-medium);
  line-height: 1.7;
}
[data-invoice-template="minimal-white"] .inv-signature-area {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
}
[data-invoice-template="minimal-white"] .inv-signature-block { text-align: center; }
[data-invoice-template="minimal-white"] .inv-signature-line {
  width: 160px;
  border-bottom: 1px solid var(--inv-text-light);
  margin-bottom: 6px;
  height: 40px;
}
[data-invoice-template="minimal-white"] .inv-signature-name { font-size: 11px; font-weight: 500; }
[data-invoice-template="minimal-white"] .inv-signature-title { font-size: 10px; color: var(--inv-text-light); }
[data-invoice-template="minimal-white"] .inv-watermark {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 72px; font-weight: 300; text-transform: uppercase;
  color: rgba(0,0,0,0.03); pointer-events: none;
}
[data-invoice-template="minimal-white"] .inv-page-footer {
  text-align: center; font-size: 9px; color: var(--inv-text-light);
  padding: 12px 52px; border-top: 1px solid var(--inv-border);
}
`;

export const INV_CSS_BOLD_CORPORATE = `
[data-invoice-template="bold-corporate"] {
  --inv-text-dark: #1e1b4b;
  --inv-text-medium: #4338ca;
  --inv-text-body: #475569;
  --inv-text-light: #94a3b8;
  --inv-bg: #ffffff;
  --inv-border: #e0e7ff;
  --inv-stripe: #f5f3ff;
  font-family: var(--inv-body-font, 'Open Sans', sans-serif);
  color: var(--inv-text-dark);
  background: var(--inv-bg);
  line-height: 1.5;
}
[data-invoice-template="bold-corporate"] .inv-header {
  background: var(--inv-accent);
  color: #fff;
  padding: 32px 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
[data-invoice-template="bold-corporate"] .inv-company-name {
  font-family: var(--inv-heading-font, 'Montserrat', sans-serif);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  text-transform: uppercase;
}
[data-invoice-template="bold-corporate"] .inv-company-details {
  font-size: 10px;
  opacity: 0.8;
  line-height: 1.5;
  margin-top: 4px;
}
[data-invoice-template="bold-corporate"] .inv-header-right { text-align: right; }
[data-invoice-template="bold-corporate"] .inv-invoice-title {
  font-family: var(--inv-heading-font, 'Montserrat', sans-serif);
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -1px;
  text-transform: uppercase;
}
[data-invoice-template="bold-corporate"] .inv-invoice-number {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.85;
  margin-top: 2px;
}
[data-invoice-template="bold-corporate"] .inv-status-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255,255,255,0.2);
  margin-top: 8px;
}
[data-invoice-template="bold-corporate"] .inv-body { padding: 28px 44px 20px; }
[data-invoice-template="bold-corporate"] .inv-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}
[data-invoice-template="bold-corporate"] .inv-meta-label {
  font-family: var(--inv-heading-font, 'Montserrat', sans-serif);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="bold-corporate"] .inv-meta-value {
  font-size: 12px;
  color: var(--inv-text-body);
  line-height: 1.5;
}
[data-invoice-template="bold-corporate"] .inv-meta-value strong {
  font-weight: 700;
  color: var(--inv-text-dark);
  display: block;
  margin-bottom: 2px;
}
[data-invoice-template="bold-corporate"] .inv-detail-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 14px 18px;
  background: var(--inv-accent);
  border-radius: 6px;
  color: #fff;
}
[data-invoice-template="bold-corporate"] .inv-detail-item { flex: 1; }
[data-invoice-template="bold-corporate"] .inv-detail-label {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.7;
  margin-bottom: 2px;
}
[data-invoice-template="bold-corporate"] .inv-detail-value {
  font-size: 13px;
  font-weight: 700;
}
[data-invoice-template="bold-corporate"] .inv-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
}
[data-invoice-template="bold-corporate"] .inv-table thead th {
  background: var(--inv-accent);
  color: #fff;
  font-family: var(--inv-heading-font, 'Montserrat', sans-serif);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 12px 14px;
  text-align: left;
}
[data-invoice-template="bold-corporate"] .inv-table thead th:last-child,
[data-invoice-template="bold-corporate"] .inv-table thead th.text-right { text-align: right; }
[data-invoice-template="bold-corporate"] .inv-table tbody td {
  padding: 11px 14px;
  font-size: 11.5px;
  border-bottom: 1px solid var(--inv-border);
  color: var(--inv-text-body);
}
[data-invoice-template="bold-corporate"] .inv-table tbody tr:nth-child(even) {
  background: var(--inv-stripe);
}
[data-invoice-template="bold-corporate"] .inv-table tbody td.text-right { text-align: right; }
[data-invoice-template="bold-corporate"] .inv-table tbody td.item-desc { font-weight: 600; color: var(--inv-text-dark); }
[data-invoice-template="bold-corporate"] .inv-totals {
  margin-left: auto;
  width: 280px;
  margin-bottom: 28px;
}
[data-invoice-template="bold-corporate"] .inv-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
  font-size: 12px;
  color: var(--inv-text-body);
}
[data-invoice-template="bold-corporate"] .inv-totals-row.grand-total {
  background: var(--inv-accent);
  color: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  margin-top: 8px;
  font-size: 18px;
  font-weight: 800;
}
[data-invoice-template="bold-corporate"] .inv-footer-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid var(--inv-border);
}
[data-invoice-template="bold-corporate"] .inv-footer-title {
  font-family: var(--inv-heading-font, 'Montserrat', sans-serif);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="bold-corporate"] .inv-footer-text {
  font-size: 10.5px;
  color: var(--inv-text-body);
  line-height: 1.6;
}
[data-invoice-template="bold-corporate"] .inv-signature-area {
  margin-top: 28px;
  padding-top: 16px;
  border-top: 2px solid var(--inv-border);
  display: flex;
  justify-content: flex-end;
}
[data-invoice-template="bold-corporate"] .inv-signature-block { text-align: center; }
[data-invoice-template="bold-corporate"] .inv-signature-line {
  width: 180px;
  border-bottom: 2px solid var(--inv-accent);
  margin-bottom: 6px;
  height: 40px;
}
[data-invoice-template="bold-corporate"] .inv-signature-name { font-size: 11px; font-weight: 700; color: var(--inv-text-dark); }
[data-invoice-template="bold-corporate"] .inv-signature-title { font-size: 10px; color: var(--inv-text-light); }
[data-invoice-template="bold-corporate"] .inv-watermark {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 72px; font-weight: 800; text-transform: uppercase;
  color: rgba(67,56,202,0.04); pointer-events: none;
}
[data-invoice-template="bold-corporate"] .inv-page-footer {
  text-align: center; font-size: 9px; color: var(--inv-text-light);
  padding: 12px 44px; border-top: 2px solid var(--inv-border);
}
`;

export const INV_CSS_ELEGANT_LINE = `
[data-invoice-template="elegant-line"] {
  --inv-text-dark: #292524;
  --inv-text-medium: #57534e;
  --inv-text-light: #a8a29e;
  --inv-bg: #ffffff;
  --inv-border: #e7e5e4;
  font-family: var(--inv-body-font, 'Proza Libre', sans-serif);
  color: var(--inv-text-dark);
  background: var(--inv-bg);
  line-height: 1.6;
}
[data-invoice-template="elegant-line"] .inv-header {
  padding: 44px 48px 28px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--inv-accent);
}
[data-invoice-template="elegant-line"] .inv-company-name {
  font-family: var(--inv-heading-font, 'Cormorant Garamond', serif);
  font-size: 28px;
  font-weight: 600;
  color: var(--inv-accent);
}
[data-invoice-template="elegant-line"] .inv-company-details {
  font-size: 10px;
  color: var(--inv-text-medium);
  line-height: 1.6;
  margin-top: 4px;
}
[data-invoice-template="elegant-line"] .inv-header-right { text-align: right; }
[data-invoice-template="elegant-line"] .inv-invoice-title {
  font-family: var(--inv-heading-font, 'Cormorant Garamond', serif);
  font-size: 13px;
  font-weight: 400;
  font-style: italic;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--inv-text-light);
}
[data-invoice-template="elegant-line"] .inv-invoice-number {
  font-family: var(--inv-heading-font, 'Cormorant Garamond', serif);
  font-size: 22px;
  font-weight: 700;
  color: var(--inv-accent);
  margin-top: 2px;
}
[data-invoice-template="elegant-line"] .inv-status-badge {
  display: inline-block;
  padding: 3px 12px;
  font-size: 9px;
  font-weight: 500;
  font-style: italic;
  letter-spacing: 1px;
  color: var(--inv-accent);
  border: 1px solid var(--inv-accent);
  margin-top: 8px;
}
[data-invoice-template="elegant-line"] .inv-body { padding: 28px 48px 20px; }
[data-invoice-template="elegant-line"] .inv-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  margin-bottom: 28px;
}
[data-invoice-template="elegant-line"] .inv-meta-label {
  font-family: var(--inv-heading-font, 'Cormorant Garamond', serif);
  font-size: 10px;
  font-style: italic;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--inv-accent);
  margin-bottom: 8px;
}
[data-invoice-template="elegant-line"] .inv-meta-value {
  font-size: 11.5px;
  color: var(--inv-text-medium);
  line-height: 1.6;
}
[data-invoice-template="elegant-line"] .inv-meta-value strong {
  font-weight: 600;
  color: var(--inv-text-dark);
  display: block;
  margin-bottom: 2px;
}
[data-invoice-template="elegant-line"] .inv-detail-row {
  display: flex;
  gap: 24px;
  margin-bottom: 28px;
  padding: 12px 0;
  border-top: 1px solid var(--inv-accent);
  border-bottom: 1px solid var(--inv-accent);
}
[data-invoice-template="elegant-line"] .inv-detail-item { flex: 1; }
[data-invoice-template="elegant-line"] .inv-detail-label {
  font-family: var(--inv-heading-font, 'Cormorant Garamond', serif);
  font-size: 9px;
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--inv-text-light);
  margin-bottom: 3px;
}
[data-invoice-template="elegant-line"] .inv-detail-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--inv-text-dark);
}
[data-invoice-template="elegant-line"] .inv-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 28px;
}
[data-invoice-template="elegant-line"] .inv-table thead th {
  font-family: var(--inv-heading-font, 'Cormorant Garamond', serif);
  font-size: 10px;
  font-style: italic;
  font-weight: 600;
  letter-spacing: 1px;
  padding: 10px 14px;
  text-align: left;
  color: var(--inv-accent);
  border-bottom: 1px solid var(--inv-accent);
}
[data-invoice-template="elegant-line"] .inv-table thead th:last-child,
[data-invoice-template="elegant-line"] .inv-table thead th.text-right { text-align: right; }
[data-invoice-template="elegant-line"] .inv-table tbody td {
  padding: 10px 14px;
  font-size: 11.5px;
  border-bottom: 1px solid var(--inv-border);
}
[data-invoice-template="elegant-line"] .inv-table tbody td.text-right { text-align: right; }
[data-invoice-template="elegant-line"] .inv-table tbody td.item-desc { font-weight: 500; }
[data-invoice-template="elegant-line"] .inv-totals {
  margin-left: auto;
  width: 250px;
  margin-bottom: 28px;
}
[data-invoice-template="elegant-line"] .inv-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 11.5px;
  color: var(--inv-text-medium);
}
[data-invoice-template="elegant-line"] .inv-totals-row.grand-total {
  border-top: 1px solid var(--inv-accent);
  margin-top: 8px;
  padding-top: 10px;
  font-family: var(--inv-heading-font, 'Cormorant Garamond', serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--inv-accent);
}
[data-invoice-template="elegant-line"] .inv-footer-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--inv-border);
}
[data-invoice-template="elegant-line"] .inv-footer-title {
  font-family: var(--inv-heading-font, 'Cormorant Garamond', serif);
  font-size: 11px;
  font-style: italic;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="elegant-line"] .inv-footer-text {
  font-size: 10.5px;
  color: var(--inv-text-medium);
  line-height: 1.6;
}
[data-invoice-template="elegant-line"] .inv-signature-area {
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid var(--inv-border);
  display: flex; justify-content: flex-end;
}
[data-invoice-template="elegant-line"] .inv-signature-block { text-align: center; }
[data-invoice-template="elegant-line"] .inv-signature-line {
  width: 180px;
  border-bottom: 1px solid var(--inv-accent);
  margin-bottom: 6px; height: 40px;
}
[data-invoice-template="elegant-line"] .inv-signature-name { font-size: 11px; font-weight: 600; }
[data-invoice-template="elegant-line"] .inv-signature-title { font-size: 10px; color: var(--inv-text-light); }
[data-invoice-template="elegant-line"] .inv-watermark {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 68px; font-weight: 700;
  font-family: var(--inv-heading-font, 'Cormorant Garamond', serif);
  text-transform: uppercase;
  color: rgba(180,83,9,0.04); pointer-events: none;
}
[data-invoice-template="elegant-line"] .inv-page-footer {
  text-align: center; font-size: 9px; color: var(--inv-text-light);
  padding: 12px 48px; border-top: 1px solid var(--inv-border);
}
`;

export const INV_CSS_TECH_STARTUP = `
[data-invoice-template="tech-startup"] {
  --inv-text-dark: #111827;
  --inv-text-medium: #4b5563;
  --inv-text-light: #9ca3af;
  --inv-bg: #ffffff;
  --inv-border: #e5e7eb;
  --inv-stripe: #f0fdf4;
  font-family: var(--inv-body-font, 'Inter', sans-serif);
  color: var(--inv-text-dark);
  background: var(--inv-bg);
  line-height: 1.5;
}
[data-invoice-template="tech-startup"] .inv-header {
  background: #111827;
  color: #fff;
  padding: 32px 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
[data-invoice-template="tech-startup"] .inv-company-name {
  font-family: var(--inv-heading-font, 'Space Grotesk', sans-serif);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
[data-invoice-template="tech-startup"] .inv-company-details {
  font-size: 10px;
  color: #9ca3af;
  line-height: 1.5;
  margin-top: 4px;
}
[data-invoice-template="tech-startup"] .inv-header-right { text-align: right; }
[data-invoice-template="tech-startup"] .inv-invoice-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 1px;
  color: var(--inv-accent);
}
[data-invoice-template="tech-startup"] .inv-invoice-number {
  font-family: 'JetBrains Mono', monospace;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-top: 2px;
}
[data-invoice-template="tech-startup"] .inv-status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: var(--inv-accent);
  color: #fff;
  margin-top: 8px;
}
[data-invoice-template="tech-startup"] .inv-body { padding: 28px 44px 20px; }
[data-invoice-template="tech-startup"] .inv-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}
[data-invoice-template="tech-startup"] .inv-meta-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="tech-startup"] .inv-meta-value {
  font-size: 12px;
  color: var(--inv-text-medium);
  line-height: 1.5;
}
[data-invoice-template="tech-startup"] .inv-meta-value strong {
  font-weight: 600;
  color: var(--inv-text-dark);
  display: block;
  margin-bottom: 2px;
}
[data-invoice-template="tech-startup"] .inv-detail-row {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #111827;
  border-radius: 8px;
  color: #fff;
}
[data-invoice-template="tech-startup"] .inv-detail-item { flex: 1; }
[data-invoice-template="tech-startup"] .inv-detail-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
  margin-bottom: 2px;
}
[data-invoice-template="tech-startup"] .inv-detail-value {
  font-size: 13px;
  font-weight: 600;
}
[data-invoice-template="tech-startup"] .inv-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
}
[data-invoice-template="tech-startup"] .inv-table thead th {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 14px;
  text-align: left;
  color: var(--inv-text-light);
  border-bottom: 2px solid var(--inv-accent);
}
[data-invoice-template="tech-startup"] .inv-table thead th:last-child,
[data-invoice-template="tech-startup"] .inv-table thead th.text-right { text-align: right; }
[data-invoice-template="tech-startup"] .inv-table tbody td {
  padding: 10px 14px;
  font-size: 11.5px;
  border-bottom: 1px solid var(--inv-border);
}
[data-invoice-template="tech-startup"] .inv-table tbody td.text-right {
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
[data-invoice-template="tech-startup"] .inv-table tbody td.item-desc { font-weight: 500; }
[data-invoice-template="tech-startup"] .inv-totals {
  margin-left: auto;
  width: 280px;
  margin-bottom: 28px;
}
[data-invoice-template="tech-startup"] .inv-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
  color: var(--inv-text-medium);
}
[data-invoice-template="tech-startup"] .inv-totals-row .amount {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
[data-invoice-template="tech-startup"] .inv-totals-row.grand-total {
  background: #111827;
  color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 8px;
  font-size: 18px;
  font-weight: 700;
}
[data-invoice-template="tech-startup"] .inv-totals-row.grand-total .amount {
  color: var(--inv-accent);
  font-size: 16px;
}
[data-invoice-template="tech-startup"] .inv-footer-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--inv-border);
}
[data-invoice-template="tech-startup"] .inv-footer-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="tech-startup"] .inv-footer-text {
  font-size: 10.5px;
  color: var(--inv-text-medium);
  line-height: 1.6;
}
[data-invoice-template="tech-startup"] .inv-signature-area {
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid var(--inv-border);
  display: flex; justify-content: flex-end;
}
[data-invoice-template="tech-startup"] .inv-signature-block { text-align: center; }
[data-invoice-template="tech-startup"] .inv-signature-line {
  width: 180px; border-bottom: 2px solid #111827;
  margin-bottom: 6px; height: 40px;
}
[data-invoice-template="tech-startup"] .inv-signature-name { font-size: 11px; font-weight: 600; }
[data-invoice-template="tech-startup"] .inv-signature-title { font-size: 10px; color: var(--inv-text-light); }
[data-invoice-template="tech-startup"] .inv-watermark {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-family: 'JetBrains Mono', monospace;
  font-size: 60px; font-weight: 700; text-transform: uppercase;
  color: rgba(5,150,105,0.04); pointer-events: none;
}
[data-invoice-template="tech-startup"] .inv-page-footer {
  text-align: center; font-size: 9px; color: var(--inv-text-light);
  font-family: 'JetBrains Mono', monospace;
  padding: 12px 44px; border-top: 1px solid var(--inv-border);
}
`;

export const INV_CSS_CREATIVE_STUDIO = `
[data-invoice-template="creative-studio"] {
  --inv-text-dark: #1e1b4b;
  --inv-text-medium: #6b7280;
  --inv-text-light: #9ca3af;
  --inv-bg: #ffffff;
  --inv-border: #e5e7eb;
  --inv-stripe: #faf5ff;
  font-family: var(--inv-body-font, 'Inter', sans-serif);
  color: var(--inv-text-dark);
  background: var(--inv-bg);
  line-height: 1.5;
}
[data-invoice-template="creative-studio"] .inv-header {
  padding: 36px 44px 0;
  display: flex;
  gap: 32px;
}
[data-invoice-template="creative-studio"] .inv-header-sidebar {
  width: 6px;
  background: linear-gradient(to bottom, var(--inv-accent), #ec4899);
  border-radius: 3px;
  min-height: 80px;
}
[data-invoice-template="creative-studio"] .inv-header-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 24px;
  border-bottom: 2px solid var(--inv-accent);
}
[data-invoice-template="creative-studio"] .inv-company-name {
  font-family: var(--inv-heading-font, 'Poppins', sans-serif);
  font-size: 24px;
  font-weight: 700;
  color: var(--inv-accent);
}
[data-invoice-template="creative-studio"] .inv-company-details {
  font-size: 10.5px;
  color: var(--inv-text-medium);
  line-height: 1.6;
  margin-top: 4px;
}
[data-invoice-template="creative-studio"] .inv-header-right { text-align: right; }
[data-invoice-template="creative-studio"] .inv-invoice-title {
  font-family: var(--inv-heading-font, 'Poppins', sans-serif);
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--inv-accent), #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
[data-invoice-template="creative-studio"] .inv-invoice-number {
  font-size: 12px;
  color: var(--inv-text-medium);
  margin-top: 2px;
}
[data-invoice-template="creative-studio"] .inv-status-badge {
  display: inline-block;
  padding: 3px 14px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--inv-accent), #ec4899);
  color: #fff;
  margin-top: 8px;
}
[data-invoice-template="creative-studio"] .inv-body { padding: 28px 44px 20px; }
[data-invoice-template="creative-studio"] .inv-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 28px;
}
[data-invoice-template="creative-studio"] .inv-meta-label {
  font-family: var(--inv-heading-font, 'Poppins', sans-serif);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="creative-studio"] .inv-meta-value {
  font-size: 12px;
  color: var(--inv-text-medium);
  line-height: 1.5;
}
[data-invoice-template="creative-studio"] .inv-meta-value strong {
  font-weight: 600;
  color: var(--inv-text-dark);
  display: block;
  margin-bottom: 2px;
}
[data-invoice-template="creative-studio"] .inv-detail-row {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding: 14px 18px;
  background: var(--inv-accent-light);
  border-radius: 12px;
  border-left: 4px solid var(--inv-accent);
}
[data-invoice-template="creative-studio"] .inv-detail-item { flex: 1; }
[data-invoice-template="creative-studio"] .inv-detail-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--inv-accent);
  margin-bottom: 2px;
}
[data-invoice-template="creative-studio"] .inv-detail-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--inv-text-dark);
}
[data-invoice-template="creative-studio"] .inv-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
}
[data-invoice-template="creative-studio"] .inv-table thead th {
  background: var(--inv-accent-light);
  font-family: var(--inv-heading-font, 'Poppins', sans-serif);
  font-size: 9.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 14px;
  text-align: left;
  color: var(--inv-accent);
  border-bottom: 2px solid var(--inv-accent);
}
[data-invoice-template="creative-studio"] .inv-table thead th:last-child,
[data-invoice-template="creative-studio"] .inv-table thead th.text-right { text-align: right; }
[data-invoice-template="creative-studio"] .inv-table tbody td {
  padding: 10px 14px;
  font-size: 11.5px;
  border-bottom: 1px solid var(--inv-border);
}
[data-invoice-template="creative-studio"] .inv-table tbody tr:nth-child(even) { background: var(--inv-stripe); }
[data-invoice-template="creative-studio"] .inv-table tbody td.text-right { text-align: right; }
[data-invoice-template="creative-studio"] .inv-table tbody td.item-desc { font-weight: 500; }
[data-invoice-template="creative-studio"] .inv-totals {
  margin-left: auto;
  width: 270px;
  margin-bottom: 28px;
}
[data-invoice-template="creative-studio"] .inv-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
  color: var(--inv-text-medium);
}
[data-invoice-template="creative-studio"] .inv-totals-row.grand-total {
  background: linear-gradient(135deg, var(--inv-accent), #ec4899);
  color: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  margin-top: 8px;
  font-size: 18px;
  font-weight: 700;
}
[data-invoice-template="creative-studio"] .inv-footer-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--inv-border);
}
[data-invoice-template="creative-studio"] .inv-footer-title {
  font-family: var(--inv-heading-font, 'Poppins', sans-serif);
  font-size: 10px;
  font-weight: 600;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="creative-studio"] .inv-footer-text {
  font-size: 10.5px;
  color: var(--inv-text-medium);
  line-height: 1.6;
}
[data-invoice-template="creative-studio"] .inv-signature-area {
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid var(--inv-border);
  display: flex; justify-content: flex-end;
}
[data-invoice-template="creative-studio"] .inv-signature-block { text-align: center; }
[data-invoice-template="creative-studio"] .inv-signature-line {
  width: 180px; border-bottom: 2px solid var(--inv-accent);
  margin-bottom: 6px; height: 40px;
}
[data-invoice-template="creative-studio"] .inv-signature-name { font-size: 11px; font-weight: 600; }
[data-invoice-template="creative-studio"] .inv-signature-title { font-size: 10px; color: var(--inv-text-light); }
[data-invoice-template="creative-studio"] .inv-watermark {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 72px; font-weight: 700; text-transform: uppercase;
  color: rgba(124,58,237,0.04); pointer-events: none;
}
[data-invoice-template="creative-studio"] .inv-page-footer {
  text-align: center; font-size: 9px; color: var(--inv-text-light);
  padding: 12px 44px; border-top: 1px solid var(--inv-border);
}
`;

export const INV_CSS_EXECUTIVE_PREMIUM = `
[data-invoice-template="executive-premium"] {
  --inv-text-dark: #1c1917;
  --inv-text-medium: #57534e;
  --inv-text-light: #a8a29e;
  --inv-bg: #ffffff;
  --inv-border: #d6d3d1;
  font-family: var(--inv-body-font, 'DM Sans', sans-serif);
  color: var(--inv-text-dark);
  background: var(--inv-bg);
  line-height: 1.5;
}
[data-invoice-template="executive-premium"] .inv-header {
  padding: 40px 48px;
  text-align: center;
  border-bottom: 1px solid var(--inv-border);
}
[data-invoice-template="executive-premium"] .inv-header-border {
  border-bottom: 3px solid var(--inv-accent);
  padding-bottom: 4px;
  margin-bottom: 4px;
  display: inline-block;
}
[data-invoice-template="executive-premium"] .inv-company-name {
  font-family: var(--inv-heading-font, 'DM Serif Display', serif);
  font-size: 28px;
  font-weight: 400;
  color: var(--inv-accent);
  letter-spacing: 1px;
}
[data-invoice-template="executive-premium"] .inv-company-details {
  font-size: 10px;
  color: var(--inv-text-medium);
  line-height: 1.6;
  margin-top: 8px;
}
[data-invoice-template="executive-premium"] .inv-invoice-title-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}
[data-invoice-template="executive-premium"] .inv-title-ornament {
  width: 40px; height: 1px; background: var(--inv-accent);
}
[data-invoice-template="executive-premium"] .inv-invoice-title {
  font-family: var(--inv-heading-font, 'DM Serif Display', serif);
  font-size: 14px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--inv-text-medium);
}
[data-invoice-template="executive-premium"] .inv-invoice-number {
  font-size: 20px;
  font-weight: 700;
  color: var(--inv-accent);
  margin-top: 4px;
}
[data-invoice-template="executive-premium"] .inv-status-badge {
  display: inline-block;
  padding: 3px 16px;
  border: 1px solid var(--inv-accent);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--inv-accent);
  margin-top: 8px;
}
[data-invoice-template="executive-premium"] .inv-body { padding: 28px 48px 20px; }
[data-invoice-template="executive-premium"] .inv-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  margin-bottom: 28px;
}
[data-invoice-template="executive-premium"] .inv-meta-label {
  font-family: var(--inv-heading-font, 'DM Serif Display', serif);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--inv-accent);
  margin-bottom: 8px;
}
[data-invoice-template="executive-premium"] .inv-meta-value {
  font-size: 12px;
  color: var(--inv-text-medium);
  line-height: 1.5;
}
[data-invoice-template="executive-premium"] .inv-meta-value strong {
  font-weight: 600;
  color: var(--inv-text-dark);
  display: block;
  margin-bottom: 2px;
}
[data-invoice-template="executive-premium"] .inv-detail-row {
  display: flex;
  gap: 24px;
  margin-bottom: 28px;
  padding: 14px 20px;
  border: 1px solid var(--inv-accent);
  border-radius: 0;
}
[data-invoice-template="executive-premium"] .inv-detail-item { flex: 1; text-align: center; }
[data-invoice-template="executive-premium"] .inv-detail-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--inv-text-light);
  margin-bottom: 3px;
}
[data-invoice-template="executive-premium"] .inv-detail-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--inv-accent);
}
[data-invoice-template="executive-premium"] .inv-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 28px;
}
[data-invoice-template="executive-premium"] .inv-table thead th {
  border-top: 1px solid var(--inv-accent);
  border-bottom: 3px double var(--inv-accent);
  font-family: var(--inv-heading-font, 'DM Serif Display', serif);
  font-size: 10px;
  letter-spacing: 1px;
  padding: 10px 14px;
  text-align: left;
  color: var(--inv-accent);
}
[data-invoice-template="executive-premium"] .inv-table thead th:last-child,
[data-invoice-template="executive-premium"] .inv-table thead th.text-right { text-align: right; }
[data-invoice-template="executive-premium"] .inv-table tbody td {
  padding: 10px 14px;
  font-size: 11.5px;
  border-bottom: 1px solid var(--inv-border);
}
[data-invoice-template="executive-premium"] .inv-table tbody td.text-right { text-align: right; }
[data-invoice-template="executive-premium"] .inv-table tbody td.item-desc { font-weight: 500; }
[data-invoice-template="executive-premium"] .inv-totals {
  margin-left: auto;
  width: 260px;
  margin-bottom: 28px;
}
[data-invoice-template="executive-premium"] .inv-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
  color: var(--inv-text-medium);
}
[data-invoice-template="executive-premium"] .inv-totals-row.grand-total {
  border-top: 3px double var(--inv-accent);
  margin-top: 8px;
  padding-top: 10px;
  font-family: var(--inv-heading-font, 'DM Serif Display', serif);
  font-size: 20px;
  color: var(--inv-accent);
}
[data-invoice-template="executive-premium"] .inv-footer-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--inv-border);
}
[data-invoice-template="executive-premium"] .inv-footer-title {
  font-family: var(--inv-heading-font, 'DM Serif Display', serif);
  font-size: 11px;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="executive-premium"] .inv-footer-text {
  font-size: 10.5px;
  color: var(--inv-text-medium);
  line-height: 1.6;
}
[data-invoice-template="executive-premium"] .inv-signature-area {
  margin-top: 30px;
  padding-top: 16px;
  border-top: 1px solid var(--inv-border);
  display: flex; justify-content: flex-end;
}
[data-invoice-template="executive-premium"] .inv-signature-block { text-align: center; }
[data-invoice-template="executive-premium"] .inv-signature-line {
  width: 200px;
  border-bottom: 1px solid var(--inv-accent);
  margin-bottom: 6px; height: 40px;
}
[data-invoice-template="executive-premium"] .inv-signature-name { font-size: 11px; font-weight: 600; }
[data-invoice-template="executive-premium"] .inv-signature-title { font-size: 10px; color: var(--inv-text-light); }
[data-invoice-template="executive-premium"] .inv-watermark {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-family: var(--inv-heading-font, 'DM Serif Display', serif);
  font-size: 72px; text-transform: uppercase;
  color: rgba(180,83,9,0.04); pointer-events: none;
}
[data-invoice-template="executive-premium"] .inv-page-footer {
  text-align: center; font-size: 9px; color: var(--inv-text-light);
  padding: 12px 48px; border-top: 1px solid var(--inv-border);
}
`;

export const INV_CSS_FREELANCER_SIMPLE = `
[data-invoice-template="freelancer-simple"] {
  --inv-text-dark: #111827;
  --inv-text-medium: #4b5563;
  --inv-text-light: #9ca3af;
  --inv-bg: #ffffff;
  --inv-border: #e5e7eb;
  font-family: var(--inv-body-font, 'IBM Plex Sans', sans-serif);
  color: var(--inv-text-dark);
  background: var(--inv-bg);
  line-height: 1.5;
}
[data-invoice-template="freelancer-simple"] .inv-header {
  padding: 32px 40px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 2px solid var(--inv-accent);
}
[data-invoice-template="freelancer-simple"] .inv-company-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--inv-text-dark);
}
[data-invoice-template="freelancer-simple"] .inv-company-details {
  font-size: 10px;
  color: var(--inv-text-medium);
  line-height: 1.5;
  margin-top: 2px;
}
[data-invoice-template="freelancer-simple"] .inv-header-right { text-align: right; }
[data-invoice-template="freelancer-simple"] .inv-invoice-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
}
[data-invoice-template="freelancer-simple"] .inv-invoice-number {
  font-size: 18px;
  font-weight: 700;
  color: var(--inv-text-dark);
}
[data-invoice-template="freelancer-simple"] .inv-status-badge {
  display: inline-block;
  padding: 2px 10px;
  border: 1px solid var(--inv-accent);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--inv-accent);
  margin-top: 4px;
}
[data-invoice-template="freelancer-simple"] .inv-body { padding: 20px 40px 16px; }
[data-invoice-template="freelancer-simple"] .inv-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
[data-invoice-template="freelancer-simple"] .inv-meta-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--inv-accent);
  margin-bottom: 4px;
}
[data-invoice-template="freelancer-simple"] .inv-meta-value {
  font-size: 11.5px;
  color: var(--inv-text-medium);
  line-height: 1.5;
}
[data-invoice-template="freelancer-simple"] .inv-meta-value strong {
  font-weight: 600;
  color: var(--inv-text-dark);
  display: block;
  margin-bottom: 1px;
}
[data-invoice-template="freelancer-simple"] .inv-detail-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  font-size: 11px;
}
[data-invoice-template="freelancer-simple"] .inv-detail-item { flex: 1; }
[data-invoice-template="freelancer-simple"] .inv-detail-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--inv-text-light);
  margin-bottom: 2px;
}
[data-invoice-template="freelancer-simple"] .inv-detail-value {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--inv-text-dark);
}
[data-invoice-template="freelancer-simple"] .inv-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
[data-invoice-template="freelancer-simple"] .inv-table thead th {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 10px;
  text-align: left;
  color: var(--inv-text-light);
  border-bottom: 1px solid var(--inv-border);
}
[data-invoice-template="freelancer-simple"] .inv-table thead th:last-child,
[data-invoice-template="freelancer-simple"] .inv-table thead th.text-right { text-align: right; }
[data-invoice-template="freelancer-simple"] .inv-table tbody td {
  padding: 8px 10px;
  font-size: 11px;
  border-bottom: 1px solid #f3f4f6;
}
[data-invoice-template="freelancer-simple"] .inv-table tbody td.text-right { text-align: right; }
[data-invoice-template="freelancer-simple"] .inv-table tbody td.item-desc { font-weight: 500; }
[data-invoice-template="freelancer-simple"] .inv-totals {
  margin-left: auto;
  width: 220px;
  margin-bottom: 20px;
}
[data-invoice-template="freelancer-simple"] .inv-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 11.5px;
  color: var(--inv-text-medium);
}
[data-invoice-template="freelancer-simple"] .inv-totals-row.grand-total {
  border-top: 2px solid var(--inv-accent);
  margin-top: 6px;
  padding-top: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--inv-accent);
}
[data-invoice-template="freelancer-simple"] .inv-footer-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--inv-border);
}
[data-invoice-template="freelancer-simple"] .inv-footer-title {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--inv-accent);
  margin-bottom: 4px;
}
[data-invoice-template="freelancer-simple"] .inv-footer-text {
  font-size: 10px;
  color: var(--inv-text-medium);
  line-height: 1.5;
}
[data-invoice-template="freelancer-simple"] .inv-signature-area {
  margin-top: 20px; padding-top: 12px;
  border-top: 1px solid var(--inv-border);
  display: flex; justify-content: flex-end;
}
[data-invoice-template="freelancer-simple"] .inv-signature-block { text-align: center; }
[data-invoice-template="freelancer-simple"] .inv-signature-line {
  width: 160px; border-bottom: 1px solid var(--inv-text-dark);
  margin-bottom: 4px; height: 32px;
}
[data-invoice-template="freelancer-simple"] .inv-signature-name { font-size: 10px; font-weight: 600; }
[data-invoice-template="freelancer-simple"] .inv-signature-title { font-size: 9px; color: var(--inv-text-light); }
[data-invoice-template="freelancer-simple"] .inv-watermark {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 64px; font-weight: 700; text-transform: uppercase;
  color: rgba(0,0,0,0.03); pointer-events: none;
}
[data-invoice-template="freelancer-simple"] .inv-page-footer {
  text-align: center; font-size: 9px; color: var(--inv-text-light);
  padding: 10px 40px; border-top: 1px solid var(--inv-border);
}
`;

export const INV_CSS_INTERNATIONAL = `
[data-invoice-template="international"] {
  --inv-text-dark: #134e4a;
  --inv-text-medium: #4b5563;
  --inv-text-light: #9ca3af;
  --inv-bg: #ffffff;
  --inv-border: #d1d5db;
  font-family: var(--inv-body-font, 'Inter', sans-serif);
  color: var(--inv-text-dark);
  background: var(--inv-bg);
  line-height: 1.5;
}
[data-invoice-template="international"] .inv-header {
  padding: 36px 44px 28px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid var(--inv-accent);
}
[data-invoice-template="international"] .inv-company-name {
  font-family: var(--inv-heading-font, 'Bitter', serif);
  font-size: 22px;
  font-weight: 700;
  color: var(--inv-accent);
}
[data-invoice-template="international"] .inv-company-details {
  font-size: 10px;
  color: var(--inv-text-medium);
  line-height: 1.6;
  margin-top: 4px;
}
[data-invoice-template="international"] .inv-header-right { text-align: right; }
[data-invoice-template="international"] .inv-invoice-title {
  font-family: var(--inv-heading-font, 'Bitter', serif);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--inv-text-medium);
}
[data-invoice-template="international"] .inv-invoice-number {
  font-size: 22px;
  font-weight: 700;
  color: var(--inv-accent);
  margin-top: 2px;
}
[data-invoice-template="international"] .inv-status-badge {
  display: inline-block;
  padding: 3px 12px;
  border: 2px solid var(--inv-accent);
  border-radius: 2px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
  margin-top: 8px;
}
[data-invoice-template="international"] .inv-body { padding: 28px 44px 20px; }
[data-invoice-template="international"] .inv-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 28px;
}
[data-invoice-template="international"] .inv-meta-label {
  font-family: var(--inv-heading-font, 'Bitter', serif);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="international"] .inv-meta-value {
  font-size: 12px;
  color: var(--inv-text-medium);
  line-height: 1.5;
}
[data-invoice-template="international"] .inv-meta-value strong {
  font-weight: 600;
  color: var(--inv-text-dark);
  display: block;
  margin-bottom: 2px;
}
[data-invoice-template="international"] .inv-detail-row {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding: 14px 18px;
  border: 1px solid var(--inv-accent);
  background: var(--inv-accent-light);
}
[data-invoice-template="international"] .inv-detail-item { flex: 1; }
[data-invoice-template="international"] .inv-detail-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--inv-accent);
  margin-bottom: 3px;
}
[data-invoice-template="international"] .inv-detail-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--inv-text-dark);
}
[data-invoice-template="international"] .inv-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
  border: 1px solid var(--inv-border);
}
[data-invoice-template="international"] .inv-table thead th {
  background: var(--inv-accent);
  color: #fff;
  font-family: var(--inv-heading-font, 'Bitter', serif);
  font-size: 9.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 14px;
  text-align: left;
  border-right: 1px solid rgba(255,255,255,0.2);
}
[data-invoice-template="international"] .inv-table thead th:last-child { border-right: 0; }
[data-invoice-template="international"] .inv-table thead th.text-right { text-align: right; }
[data-invoice-template="international"] .inv-table tbody td {
  padding: 10px 14px;
  font-size: 11.5px;
  border-bottom: 1px solid var(--inv-border);
  border-right: 1px solid var(--inv-border);
}
[data-invoice-template="international"] .inv-table tbody td:last-child { border-right: 0; }
[data-invoice-template="international"] .inv-table tbody td.text-right { text-align: right; }
[data-invoice-template="international"] .inv-table tbody td.item-desc { font-weight: 500; }
[data-invoice-template="international"] .inv-totals {
  margin-left: auto;
  width: 280px;
  margin-bottom: 28px;
  border: 1px solid var(--inv-border);
  padding: 12px 16px;
}
[data-invoice-template="international"] .inv-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 12px;
  color: var(--inv-text-medium);
}
[data-invoice-template="international"] .inv-totals-row.grand-total {
  border-top: 2px solid var(--inv-accent);
  margin-top: 6px;
  padding-top: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--inv-accent);
}
[data-invoice-template="international"] .inv-footer-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid var(--inv-accent);
}
[data-invoice-template="international"] .inv-footer-title {
  font-family: var(--inv-heading-font, 'Bitter', serif);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--inv-accent);
  margin-bottom: 6px;
}
[data-invoice-template="international"] .inv-footer-text {
  font-size: 10.5px;
  color: var(--inv-text-medium);
  line-height: 1.6;
}
[data-invoice-template="international"] .inv-signature-area {
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid var(--inv-border);
  display: flex; justify-content: flex-end;
}
[data-invoice-template="international"] .inv-signature-block { text-align: center; }
[data-invoice-template="international"] .inv-signature-line {
  width: 180px; border-bottom: 2px solid var(--inv-accent);
  margin-bottom: 6px; height: 40px;
}
[data-invoice-template="international"] .inv-signature-name { font-size: 11px; font-weight: 600; }
[data-invoice-template="international"] .inv-signature-title { font-size: 10px; color: var(--inv-text-light); }
[data-invoice-template="international"] .inv-watermark {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 72px; font-weight: 800; text-transform: uppercase;
  color: rgba(15,118,110,0.04); pointer-events: none;
}
[data-invoice-template="international"] .inv-page-footer {
  text-align: center; font-size: 9px; color: var(--inv-text-light);
  padding: 12px 44px; border-top: 2px solid var(--inv-accent);
}
`;

// ---------------------------------------------------------------------------
// Aggregate CSS map (same pattern as resume TEMPLATE_CSS)
// ---------------------------------------------------------------------------

export const INVOICE_TEMPLATE_CSS: Record<string, string> = {
  "modern-clean":          INV_CSS_MODERN_CLEAN,
  "classic-professional":  INV_CSS_CLASSIC_PROFESSIONAL,
  "minimal-white":         INV_CSS_MINIMAL_WHITE,
  "bold-corporate":        INV_CSS_BOLD_CORPORATE,
  "elegant-line":          INV_CSS_ELEGANT_LINE,
  "tech-startup":          INV_CSS_TECH_STARTUP,
  "creative-studio":       INV_CSS_CREATIVE_STUDIO,
  "executive-premium":     INV_CSS_EXECUTIVE_PREMIUM,
  "freelancer-simple":     INV_CSS_FREELANCER_SIMPLE,
  "international":         INV_CSS_INTERNATIONAL,
};
