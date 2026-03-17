# Business Tools V2 — Comprehensive Rebuild Specification

> **5 Tools. Resume Builder Pattern. Industry-Grade Quality.**
> Created: March 16, 2026

---

## Overview

Rebuilding 5 business document tools from V1 (single-file canvas-based) to V2 (Resume Builder pattern: Zod schema, Zustand store, HTML/CSS templates, smart pagination, multi-format export, AI generation, 3-panel editor).

### Build Order
1. **Invoice Designer** → Unlocks financial document suite pattern
2. **Cover Letter Writer** → Natural resume companion, shares fonts/templates
3. **Proposal & Pitch Deck** → Complex multi-section document
4. **Certificate Designer** → Visual-heavy, different layout paradigm
5. **Contract & Agreement Creator** → Legal-focused, multi-clause architecture

---

## Shared Architecture (All 5 Tools)

### File Structure Per Tool
```
src/lib/{tool-name}/
├── schema.ts              # Zod schema + types + constants
├── templates/
│   ├── template-defs.ts   # Template metadata definitions
│   ├── UniversalTemplate.tsx  # HTML/CSS template renderers
│   ├── templates.ts       # Template registry
│   └── TemplateRenderer.tsx   # Paginated renderer wrapper
├── export.ts              # Multi-format export (PDF, DOCX, etc.)
├── calculations.ts        # Domain-specific calculations (if needed)
└── ai-generator.ts        # AI content generation prompts

src/stores/
├── {tool-name}-editor.ts      # Zustand + Immer + Zundo store
└── {tool-name}-wizard.ts      # Wizard navigation store

src/components/workspaces/{tool-name}/
├── StepEditor.tsx         # 3-panel editor (main)
├── WizardStepIndicator.tsx
├── Step*.tsx              # Wizard step components
└── editor/
    ├── EditorSectionsPanel.tsx   # Left panel
    ├── EditorPreviewPanel.tsx    # Center panel (live preview)
    ├── EditorDesignPanel.tsx     # Right panel
    ├── ExportDropdown.tsx        # Export menu
    ├── AIChatBar.tsx             # AI revision input
    └── index.ts
```

### Pattern Stack
- **Schema**: Zod for runtime validation + TypeScript type inference
- **Store**: Zustand + Immer mutations + Zundo (undo/redo, 100-state history)
- **Templates**: HTML/CSS (DOM-based) with `<style>` tag injection
- **Pagination**: Smart page-breaks, protected zones, greedy first-fit
- **Export**: Client-side (jsPDF + html2canvas for PDF, Word XML for DOCX)
- **AI**: Claude for content generation + natural language revision
- **Editor**: react-resizable-panels 3-panel layout (sections | preview | design)

---

## Tool 1: Invoice Designer

### Schema Fields (InvoiceData)
```
businessInfo: { name, address, email, phone, website, taxId, logo? }
clientInfo: { name, address, email, phone, company, taxId }
invoiceDetails: { number, issueDate, dueDate, poNumber?, terms }
lineItems: [{ id, description, quantity, unitPrice, discount, tax, total }]
taxConfig: { rate, label, isInclusive, additionalTaxes[] }
currency: { code, symbol, locale }
paymentInfo: { bankName, accountNumber, routingNumber, swiftCode, paypal, notes }
totals: { subtotal, discount, tax, shipping, total, amountPaid, balanceDue }
metadata: { template, accentColor, fontPairing, pageFormat, notes, terms }
```

### Templates (10)
1. Modern Clean — Gradient header, clean lines
2. Classic Professional — Traditional serif, formal borders
3. Minimal White — Maximum whitespace, elegant
4. Bold Corporate — Color blocks, strong typography
5. Elegant Line — Thin rules, serif headers
6. Tech Startup — Dark header, monospace numbers
7. Creative Studio — Colorful, design-forward
8. Executive Premium — Double borders, gold accents
9. Freelancer Simple — One-page, compact
10. International — Multi-currency, bilingual support

### Calculations Engine
- Line-item totals with quantity × price − discount
- Per-item tax (inclusive/exclusive)
- Subtotal, total tax, grand total, balance due
- Multi-currency formatting (locale-aware)
- Due date auto-calculation from payment terms
- Discount types: percentage, fixed amount
- Additional taxes (shipping, handling, etc.)

### Export Formats
- PDF (print-ready, 300 DPI)
- XLSX (Excel-compatible, formula cells)
- CSV (accounting software import)
- JSON (data backup)
- Print (browser dialog)

### Wizard Steps
1. Your Business Info (name, address, tax ID, logo upload)
2. Client Info (name, company, address)
3. Line Items (add/remove/reorder, quantity, price, discount)
4. Payment & Terms (bank details, payment terms, notes)
5. Design (template, colors, fonts, page format)
6. Preview & Export (live preview, AI refinement, export)

---

## Tool 2: Cover Letter Writer

### Schema Fields (CoverLetterData)
```
basics: { name, email, phone, location, linkedin, website }
recipient: { name, title, company, address }
jobDetails: { title, reference, source, department }
content: { opening, body[], closing, signature }
metadata: { template, accentColor, fontPairing, pageFormat, tone, date }
```

### Templates (10)
1. Modern Minimalist — Clean, left-aligned
2. Corporate Executive — Formal header block
3. Creative Bold — Color accent sidebar
4. Classic Traditional — Serif, traditional letter format
5. Tech Professional — Monospace accents, clean grid
6. Elegant Serif — Sophisticated, golden rules
7. Startup Casual — Friendly, approachable
8. Academic Formal — Scholarly, structured
9. Design Portfolio — Visual, brand-forward
10. International Business — Multi-format date, formal

### AI Integration
- Generate cover letter from resume data + job description
- Tone adjustment (professional, casual, confident, enthusiastic)
- Keyword optimization from job listing
- Paragraph-level revision with diff preview

### Export Formats
- PDF, DOCX, TXT, JSON, clipboard, print

---

## Tool 3: Proposal & Pitch Deck

### Schema Fields (ProposalData)
```
basics: { companyName, logoUrl?, tagline, contactInfo }
client: { name, company, address, email }
projectInfo: { title, date, validUntil, referenceNumber }
sections: {
  coverPage: { headline, subtitle, backgroundImage? }
  executiveSummary: { content }
  problemStatement: { content, bulletPoints[] }
  proposedSolution: { content, features[] }
  scope: { deliverables[], timeline[], milestones[] }
  pricing: { lineItems[], subtotal, tax, total, paymentSchedule[] }
  team: { members[{ name, role, bio, photo? }] }
  caseStudies: [{ title, client, challenge, solution, result }]
  terms: { content, clauses[] }
  nextSteps: { content, cta }
}
metadata: { template, accentColor, fontPairing, pageFormat }
```

### Templates (10)
1. Modern Agency — Clean sections, bold headers
2. Corporate Enterprise — Navy/gold, formal
3. Creative Studio — Colorful, magazine-style
4. Tech Startup — Dark theme, metric cards
5. Consultancy Premium — Elegant, data-heavy
6. Minimalist Clean — Whitespace, typography-first
7. Bold Impact — Full-width imagery, large type
8. Professional Services — Two-column, structured
9. Executive Brief — Compact, one-pager option
10. International Business — Multi-language ready

### Export: PDF, PPTX (slide format), DOCX, JSON

---

## Tool 4: Certificate Designer

### Schema Fields (CertificateData)
```
basics: { title, subtitle, organization, organizationLogo? }
recipient: { name, title? }
details: { description, date, expiryDate?, serialNumber?, courseHours? }
signatures: [{ name, title, signature? }]
style: { border, seal, badge?, watermark?, orientation }
metadata: { template, accentColor, fontPairing, pageFormat }
```

### Templates (10)
1. Classic Formal — Ornamental border, gold seal
2. Modern Clean — Minimalist, typography-first
3. Corporate Professional — Company branding, clean lines
4. Academic — University style, parchment feel
5. Creative Award — Artistic, colorful, unique shape
6. Elegant Gold — Luxury, foil effects, serif
7. Tech Achievement — Circuit/hexagon motifs, dark theme
8. Sports/Competition — Dynamic, champion feel
9. Workshop/Training — Professional development
10. Honor Roll — Star/badge/ribbon accent

### Export: PDF (A4/Letter/A3), PNG (high-res), print

---

## Tool 5: Contract & Agreement Creator

### Schema Fields (ContractData)
```
parties: { party1: { name, title, company, address }, party2: {...} }
contractInfo: { title, type, effectiveDate, endDate?, referenceNumber }
sections: {
  recitals: { content }
  definitions: [{ term, definition }]
  clauses: [{ id, title, content, subclauses[] }]
  obligations: [{ party, description }]
  compensation: { type, amount?, schedule?, currency }
  termination: { conditions, noticePeriod, consequences }
  confidentiality: { content, duration }
  disputeResolution: { method, jurisdiction, governingLaw }
  miscellaneous: { content }
}
signatures: [{ name, title, company, date, witness? }]
metadata: { template, accentColor, fontPairing, pageFormat }
```

### Contract Types
- Service Agreement, NDA, Employment Contract, Freelancer Agreement,
  Partnership Agreement, Lease Agreement, Sales Contract, Licensing Agreement,
  Consulting Agreement, Non-Compete

### Templates (10)
1. Modern Legal — Clean, professional legal format
2. Classic Formal — Traditional legal document
3. Corporate Standard — Enterprise-grade formatting
4. Simplified Plain — Easy-to-read, minimal design
5. Government Format — Regulatory compliance style
6. International — Multi-jurisdiction, bilingual
7. Creative Services — Design industry focused
8. Technology — Software/SaaS agreements
9. Real Estate — Property-focused layout
10. Human Resources — Employment-focused

### Export: PDF, DOCX, print, JSON

---

## Quality Checklist (Per Tool)

### Must-Have Features
- [ ] Zod schema with full runtime validation
- [ ] Zustand store with Immer + Zundo (undo/redo)
- [ ] 10 HTML/CSS pro templates with Google Fonts
- [ ] Smart pagination (no split items/sections)
- [ ] Multi-format export (PDF minimum)
- [ ] AI content generation
- [ ] Natural language AI revision with diff preview
- [ ] 3-panel editor (sections | preview | design)
- [ ] Wizard flow for data collection
- [ ] Template carousel with visual previews
- [ ] Accent color picker
- [ ] Font pairing selector
- [ ] Page format picker (A4, Letter, etc.)
- [ ] Responsive layout (mobile + desktop)
- [ ] Zero TypeScript errors
- [ ] Production build clean

### Nice-to-Have
- [ ] Domain-specific scoring (like ATS for resumes)
- [ ] Import from file (PDF/DOCX upload)
- [ ] Batch generation (multiple at once)
- [ ] Auto-save to localStorage
- [ ] Chiko integration (tool-specific tips)
