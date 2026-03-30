# DMSuite — Tool Development Status Tracker

> **Last updated:** 2026-03-28
> **Total tools registered:** 195+
> **Tools with workspace UI:** 98
> **Tools fully complete:** 17
> **Tools available (ready):** 14
> **Tools coming soon:** 183

---

## Status Legend

| Status | Meaning |
|--------|---------|
| `COMPLETE` | Fully built, QA'd, produces correct output. Ready for production. |
| `SCAFFOLD` | Has a workspace component with real UI code, but NOT reviewed/polished by Drake. May have bugs, broken output, or missing features. |
| `MAPPED` | Has a workspace component mapped in the router but implementation quality is unknown. |
| `NO-UI` | Registered in tools.ts but has NO workspace component yet. Shows placeholder page. |

---

## COMPLETE Tools (Fully Working)

These tools have been personally built, tested, and verified to produce correct results.

### Sales Book Designer (9 tools — 1 shared workspace)

All 9 route to `SalesBookDesignerWorkspace` with different `initialDocumentType` / `initialPageSize`:

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 1 | `invoice-designer` | Invoice Designer | SalesBookWrappers → InvoiceBookWorkspace | v3 tabbed editor, 17 templates, print-ready |
| 2 | `quote-estimate` | Quote / Estimate | SalesBookWrappers → QuotationBookWorkspace | Shared SalesBookDesignerWorkspace |
| 3 | `receipt-designer` | Receipt Designer | SalesBookWrappers → ReceiptBookWorkspace | Receipt-specific layout (amount in words, payment method) |
| 4 | `purchase-order` | Purchase Order | SalesBookWrappers → PurchaseOrderBookWorkspace | Ship-to, delivery-by fields |
| 5 | `delivery-note` | Delivery Note | SalesBookWrappers → DeliveryNoteBookWorkspace | Vehicle, driver name fields |
| 6 | `credit-note` | Credit Note | SalesBookWrappers → CreditNoteBookWorkspace | Original invoice ref, reason for credit |
| 7 | `proforma-invoice` | Proforma Invoice | SalesBookWrappers → ProformaBookWorkspace | Valid-until field |
| 8 | `sales-book-a4` | Sales Book A4 | SalesBookWrappers → SalesBookA4Workspace | Pre-set A4 page size |
| 9 | `sales-book-a5` | Sales Book A5 | SalesBookWrappers → SalesBookA5Workspace | Pre-set A5 page size |

### Statement of Account

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 10 | `statement-of-account` | Statement of Account | SalesBookWrappers → StatementOfAccountWorkspace | Transaction history, balances, aging summaries |

### Contract & Agreement Creator

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 11 | `contract-template` | Contract & Agreement Creator | ContractDesignerWorkspace | 16 contract types, Zambian law citations, 8 visual templates, cover designs |

### Resume / CV Builder

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 12 | `resume-cv` | Resume & CV Builder | ResumeCVWorkspaceV2 | 8-step wizard, multi-template, ATS optimization, 3-panel layout |

### Certificate Designer

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 13 | `certificate` | Certificate Designer | certificate-designer/CertificateDesignerWorkspace | EditorV2 canvas engine, 10 certificate types, 8 SVG-bordered templates, DesignDocumentV2 adapter, Chiko AI manifest (22 actions), AI revision bar, template picker, bidirectional canvas sync, print-ready PDF/PNG, 0 TS errors |

### Diploma & Accreditation Designer

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 14 | `diploma-designer` | Diploma & Accreditation | diploma-designer/DiplomaDesignerWorkspace | 8 diploma types, 10 templates, honors system, accreditation, institutional seal, Chiko AI manifest, Figma-style layers, print-ready |

### Ticket & Pass Designer

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 15 | `ticket-designer` | Ticket & Pass Designer | ticket-designer/TicketDesignerWorkspace | 12 ticket types, 10 templates, QR/barcode SVG, boarding pass, wristband, stub/perforation, serial numbering, Chiko AI manifest, Figma-style layers, print-ready |

### ID Badge & Lanyard Designer

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 16 | `id-badge` | ID Badge & Lanyard Designer | id-badge-designer/IDBadgeDesignerWorkspace | 12 badge types, 10 templates, CR80/CR79/CR100 card sizes, batch/bulk generation, dual-sided (front+back), QR code/barcode/magnetic stripe/NFC, lanyard config, 8 role variants, 8 font pairings, 16 accent colors, security features (holographic/watermark/microtext/sequential numbering), Chiko AI manifest (25 actions), Figma-style layers, print-ready |

### Worksheet & Form Designer

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 17 | `worksheet-designer` | Worksheet & Form Designer | worksheet-designer/WorksheetDesignerWorkspace | 12 document types (educational-worksheet/quiz/exam/survey/feedback-form/registration-form/application-form/order-form/checklist/evaluation-form/sign-in-sheet/generic-form), 8 visual templates, 27 element types across 6 categories, educational specialization (subject/grade/answer key/student fields), answer key page generation, branding & confidentiality, multi-column sections, 6 header styles, 4-tab editor (Content/Elements/Style/Format), Figma-style layers panel, Chiko AI manifest (20+ actions + activity logging), print-ready (A4/Letter/Legal/A5) |

**Shared architecture (Sales Book):**
- Store: `useSalesBookEditor` (Zustand + Immer + Zundo undo)
- Renderer: `BlankFormRenderer` (HTML → print pipeline)
- Tabs: SalesFormTab, SalesBrandTab, SalesStyleTab, SalesPrintTab, SalesAdvancedTab
- UIKit: `SalesUIKit.tsx` (30+ components)
- Layers: `SBLayersPanel.tsx` (Figma-style layer tree)
- Print: `printHTML()` → browser print dialog

---

## SCAFFOLD Tools (Have Workspace — Not Yet Reviewed)

These have real workspace code (state management, canvas/editor, templates) but Drake has NOT personally tested or polished them. They may produce output but correctness is unverified.

### Design Studio

| # | Tool ID | Tool Name | Workspace Component | Dev Status |
|---|---------|-----------|---------------------|------------|
| 1 | `ai-chat` | AI Chat | AIChatWorkspace | `SCAFFOLD` |
| 2 | `logo-generator` | Logo Generator | LogoGeneratorWorkspace | `SCAFFOLD` |
| 3 | `social-media-post` | Social Media Post | SocialMediaPostWorkspace | `SCAFFOLD` |
| 4 | `ai-image-generator` | AI Image Generator | StockImageBrowserWorkspace | `SCAFFOLD` |
| 5 | `photo-retoucher` | Photo Retoucher | StockImageBrowserWorkspace | `SCAFFOLD` |
| 6 | `brand-identity` | Brand Identity | BrandIdentityWorkspace | `SCAFFOLD` |
| 7 | `business-card` | Business Card | BusinessCardWorkspace | `SCAFFOLD` (Fabric.js) |
| 8 | `poster` | Poster Maker | PosterFlyerWorkspace | `SCAFFOLD` |
| 9 | `flyer` | Flyer Maker | PosterFlyerWorkspace | `SCAFFOLD` |
| 10 | `banner-ad` | Banner Ad | BannerAdWorkspace | `SCAFFOLD` |
| 11 | `icon-illustration` | Icon & Illustration | IconGeneratorWorkspace | `SCAFFOLD` |
| 12 | `background-remover` | Background Remover | BackgroundRemoverWorkspace | `SCAFFOLD` |
| 13 | `image-enhancer` | Image Enhancer | ImageEnhancerWorkspace | `SCAFFOLD` |
| 14 | `color-palette` | Color Palette | ColorPaletteWorkspace | `SCAFFOLD` |
| 15 | `mockup-generator` | Mockup Generator | MockupGeneratorWorkspace | `SCAFFOLD` |
| 16 | `presentation` | Presentation Designer | PresentationDesignerWorkspace | `SCAFFOLD` (Fabric.js + multi-slide) |

### Document & Print Studio

| # | Tool ID | Tool Name | Workspace Component | Dev Status |
|---|---------|-----------|---------------------|------------|
| 1 | `brochure` | Brochure Designer | BrochureDesignerWorkspace | `SCAFFOLD` |
| 2 | `letterhead` | Letterhead | LetterheadDesignerWorkspace | `SCAFFOLD` |
| 3 | `envelope` | Envelope | EnvelopeDesignerWorkspace | `SCAFFOLD` |
| 4 | `certificate` | Certificate | certificate-designer/CertificateDesignerWorkspace | `COMPLETE` |
| 5 | `infographic` | Infographic | InfographicDesignerWorkspace | `SCAFFOLD` |
| 6 | `menu-designer` | Menu Designer | menu-designer/MenuDesignerWorkspace | `COMPLETE` |
| 7 | `packaging-design` | Packaging Design | PackagingDesignerWorkspace | `SCAFFOLD` |
| 8 | `sticker-designer` | Sticker Designer | StickerDesignerWorkspace | `SCAFFOLD` |
| 9 | `tshirt-merch` | T-Shirt & Merch | ApparelDesignerWorkspace | `SCAFFOLD` |
| 10 | `id-badge` | ID Badge & Lanyard | id-badge-designer/IDBadgeDesignerWorkspace | `COMPLETE` |
| 11 | `gift-voucher` | Gift Voucher / Coupon | CouponDesignerWorkspace | `SCAFFOLD` |
| 12 | `calendar-designer` | Calendar Designer | CalendarDesignerWorkspace | `SCAFFOLD` |
| 13 | `signage` | Signage | SignageDesignerWorkspace | `SCAFFOLD` |
| 14 | `proposal-generator` | Proposal Generator | ProposalWorkspace | `SCAFFOLD` |
| 15 | `contract-template` | Contract & Agreement Creator | ContractDesignerWorkspace | `COMPLETE` |
| 16 | `report-generator` | Report Generator | ReportWorkspace | `SCAFFOLD` |
| 17 | `product-catalog` | Product Catalog | CatalogWorkspace | `SCAFFOLD` |
| 18 | `price-list` | Price List | PriceListWorkspace | `SCAFFOLD` |
| 19 | `company-profile` | Company Profile | CompanyProfileWorkspace | `SCAFFOLD` |
| 20 | `business-plan` | Business Plan Writer | business-plan-writer/BusinessPlanWriterWorkspace | `SCAFFOLD` |
| 21 | `diploma-designer` | Diploma Designer | diploma-designer/DiplomaDesignerWorkspace | `COMPLETE` |
| 22 | `statement-of-account` | Statement of Account | StatementOfAccountWorkspace | `COMPLETE` |
| 23 | `newsletter-print` | Newsletter (Print) | NewsletterPrintWorkspace | `SCAFFOLD` |
| 24 | `employee-handbook` | Employee Handbook | EmployeeHandbookWorkspace | `SCAFFOLD` |
| 25 | `job-description` | Job Description | JobDescriptionWorkspace | `SCAFFOLD` |
| 26 | `lookbook` | Lookbook | LookbookWorkspace | `SCAFFOLD` |
| 27 | `line-sheet` | Line Sheet | LineSheetWorkspace | `SCAFFOLD` |
| 28 | `real-estate-listing` | Real Estate Listing | RealEstateListingWorkspace | `SCAFFOLD` |
| 29 | `event-program` | Event Program | EventProgramWorkspace | `SCAFFOLD` |
| 30 | `ticket-designer` | Ticket Designer | TicketDesignerWorkspace | `SCAFFOLD` |
| 31 | `cover-letter` | Cover Letter Writer | cover-letter-writer/CoverLetterWriterWorkspace | `COMPLETE` |
| 32 | `invitation-designer` | Invitation Designer | InvitationDesignerWorkspace | `SCAFFOLD` |
| 33 | `training-manual` | Training Manual | TrainingManualWorkspace | `SCAFFOLD` |
| 34 | `user-guide` | User Guide | UserGuideWorkspace | `SCAFFOLD` |
| 35 | `white-paper` | White Paper | WhitePaperWorkspace | `SCAFFOLD` |
| 37 | `case-study` | Case Study | CaseStudyWorkspace | `SCAFFOLD` |
| 38 | `media-kit` | Media Kit | MediaKitWorkspace | `SCAFFOLD` |
| 39 | `ebook-creator` | eBook Creator | EbookCreatorWorkspace | `SCAFFOLD` |
| 40 | `portfolio-builder` | Portfolio Builder | PortfolioBuilderWorkspace | `SCAFFOLD` |
| 41 | `greeting-card` | Greeting Card | GreetingCardWorkspace | `SCAFFOLD` |
| 42 | `presentation` | Presentation | PresentationWorkspace | `SCAFFOLD` |
| 43 | `resume-cv` | Resume / CV | ResumeCVWorkspaceV2 | `COMPLETE` |
| 44 | `email-template` | Email Template | EmailTemplateWorkspace | `SCAFFOLD` |

### Video & Motion Studio

| # | Tool ID | Tool Name | Workspace Component | Dev Status |
|---|---------|-----------|---------------------|------------|
| 1 | `video-editor` | Video Editor | VideoEditorWorkspace | `SCAFFOLD` |
| 2 | `text-to-video` | Text to Video | AIVideoGeneratorWorkspace | `SCAFFOLD` |
| 3 | `logo-reveal` | Logo Reveal | LogoRevealWorkspace | `SCAFFOLD` |
| 4 | `subtitle-caption` | Subtitle & Caption | SubtitleGeneratorWorkspace | `SCAFFOLD` |
| 5 | `gif-converter` | GIF Converter | GifMakerWorkspace | `SCAFFOLD` |
| 6 | `thumbnail-generator` | Thumbnail Generator | ThumbnailWorkspace | `SCAFFOLD` |
| 7 | `motion-graphics` | Motion Graphics | MotionGraphicsWorkspace | `SCAFFOLD` |
| 8 | `video-compressor` | Video Compressor | VideoCompressorWorkspace | `SCAFFOLD` |
| 9 | `video-script` | Video Script | BlogWriterWorkspace | `SCAFFOLD` |

### Audio & Voice Studio

| # | Tool ID | Tool Name | Workspace Component | Dev Status |
|---|---------|-----------|---------------------|------------|
| 1 | `text-to-speech` | Text to Speech | TextToSpeechWorkspace | `SCAFFOLD` |
| 2 | `voice-cloning` | Voice Cloning | VoiceClonerWorkspace | `SCAFFOLD` |
| 3 | `podcast-editor` | Podcast Editor | PodcastToolsWorkspace | `SCAFFOLD` |
| 4 | `music-generator` | Music Generator | MusicGeneratorWorkspace | `SCAFFOLD` |
| 5 | `audio-transcription` | Audio Transcription | audio-transcription/AudioTranscriptionWorkspace | `COMPLETE` |
| 6 | `voice-flow` | VoiceFlow AI Dictation | voice-flow/VoiceFlowWorkspace | `SCAFFOLD` |

### Content Creation

| # | Tool ID | Tool Name | Workspace Component | Dev Status |
|---|---------|-----------|---------------------|------------|
| 1 | `blog-writer` | Blog Writer | BlogWriterWorkspace | `SCAFFOLD` |
| 2 | `social-caption` | Social Caption | SocialCopyWorkspace | `SCAFFOLD` |
| 3 | `email-campaign` | Email Campaign | EmailCopyWorkspace | `SCAFFOLD` |
| 4 | `product-description` | Product Description | ProductDescriptionWorkspace | `SCAFFOLD` |
| 5 | `content-calendar` | Content Calendar | ContentCalendarWorkspace | `SCAFFOLD` |
| 6 | `seo-optimizer` | SEO Optimizer | SEOOptimizerWorkspace | `SCAFFOLD` |

### Marketing & Sales

| # | Tool ID | Tool Name | Workspace Component | Dev Status |
|---|---------|-----------|---------------------|------------|
| 1 | `landing-page-copy` | Landing Page Copy | LandingPageWorkspace | `SCAFFOLD` |
| 2 | `sales-funnel` | Sales Funnel | SalesFunnelWorkspace | `SCAFFOLD` |
| 3 | `lead-magnet` | Lead Magnet | LeadMagnetWorkspace | `SCAFFOLD` |
| 4 | `email-sequence` | Email Sequence | EmailSequenceWorkspace | `SCAFFOLD` |
| 5 | `qr-code` | QR Code Generator | QRCodeWorkspace | `SCAFFOLD` |
| 6 | `analytics-dashboard` | Analytics Dashboard | AnalyticsDashboardWorkspace | `SCAFFOLD` |

### Web & UI Design

| # | Tool ID | Tool Name | Workspace Component | Dev Status |
|---|---------|-----------|---------------------|------------|
| 1 | `wireframe-generator` | Wireframe Generator | WireframeWorkspace | `SCAFFOLD` |
| 2 | `ui-component-designer` | UI Component Designer | UIComponentWorkspace | `SCAFFOLD` |

### Utilities & Workflow

| # | Tool ID | Tool Name | Workspace Component | Dev Status |
|---|---------|-----------|---------------------|------------|
| 1 | `file-converter` | File Converter | FileConverterWorkspace | `SCAFFOLD` |
| 2 | `batch-processor` | Batch Processor | BatchProcessorWorkspace | `SCAFFOLD` |
| 3 | `pdf-tools` | PDF Tools | PDFToolsWorkspace | `SCAFFOLD` |

---

## NO-UI Tools (No Workspace Component Yet)

These are registered in `src/data/tools.ts` but have no workspace component in the page router. They show a placeholder "Coming Soon" page.

<details>
<summary>Click to expand full list (100+ tools)</summary>

### Design Studio
- `logo-animation`, `brand-guidelines`, `compliment-slip`, `stamp-seal`
- `social-media-story`, `social-media-carousel`, `social-profile-kit`, `pinterest-pin`
- `rack-card`, `door-hanger`, `magazine-layout`, `book-cover`, `newspaper-ad`
- `image-inpainting`, `label-designer`
- `vehicle-wrap`, `window-graphics`, `exhibition-stand`, `uniform-designer`
- `pattern-texture`, `typography-pairing`, `mood-board`

### Video & Motion Studio
- `video-trimmer`, `video-merger`, `intro-outro`, `text-animation`
- `kinetic-typography`, `transition-effects`, `particle-effects`, `3d-text`
- `image-to-video`, `ai-b-roll`, `social-video`, `product-demo`
- `explainer-video`, `testimonial-video`, `promo-video`, `countdown-timer`
- `slideshow-video`, `color-grading`, `audio-sync`, `screen-recorder`
- `video-background-remover`

### Audio & Voice Studio
- `voiceover-studio`, `sound-effects`, `audio-enhancer`, `audio-converter`

### Content Creation
- `website-copy`, `ebook-writer`, `thread-writer`, `hashtag-generator`
- `cold-outreach`, `meta-description`, `ad-copy`, `tagline-slogan`
- `content-repurposer`, `press-release`, `speech-writer`, `podcast-notes`
- `youtube-description`, `testimonial-generator`, `ai-translator`, `grammar-checker`

### Marketing & Sales
- `marketing-strategy`, `campaign-builder`, `social-strategy`, `brand-positioning`
- `go-to-market`, `customer-persona`, `competitor-analysis`, `market-research`
- `swot-analysis`, `sales-deck`, `proposal-writer`, `ab-test-copy`
- `pricing-calculator`, `roi-calculator`

### Web & UI Design
- `website-builder`, `app-screen-designer`, `favicon-generator`
- `og-image-generator`, `screenshot-beautifier`, `css-gradient`, `svg-animator`

### Utilities & Workflow
- `ai-image-chat`, `image-compression`, `brand-kit-manager`, `asset-library`
- `style-guide`, `project-manager`, `client-brief`, `feedback-collector`
- `invoice-tracker`, `barcode-generator`, `watermark-tool`
- `color-converter`, `unit-converter`, `contrast-checker`

</details>

---

## Counts Summary

| Status | Count | Description |
|--------|-------|-------------|
| **COMPLETE** | 12 | Sales Books (9) + Statement of Account + Contract & Agreement + Resume/CV |
| **SCAFFOLD** | 85 | Has workspace UI but untested/unpolished — all set to "coming-soon" |
| **NO-UI** | 100+ | Placeholder page only — all set to "coming-soon" |
| **READY** | 10 | Available to users (complete tools only) |
| **COMING-SOON** | 185 | Grayed out in dashboard |
| **TOTAL** | 195+ | Registered in tools.ts |

---

## How to Use This Tracker

1. **When you finish working on a tool**, move it from `SCAFFOLD` to `COMPLETE` and add notes about what was done.
2. **Add a date** next to the tool when marking it complete so you can track velocity.
3. **Priority order** for next tools to complete — pick from SCAFFOLD list since they already have UI code.

### Suggested Next Priorities (High-Impact SCAFFOLD Tools)

These already have substantial workspace code and would benefit most from a polish pass:

1. **`resume-cv`** — ResumeCVWorkspaceV2 (8-step wizard, multi-template, ATS optimization)
2. **`business-card`** — BusinessCardWorkspace (7-step wizard, logo upload, generation)
3. **`presentation`** — PresentationWorkspace (slide management, PptxGenJS export)
4. **`brochure`** — BrochureDesignerWorkspace (bi/tri/z/gate folds, panel content)
5. **`poster` / `flyer`** — PosterFlyerWorkspace (canvas, overlays, stock images)
6. **`logo-generator`** — LogoGeneratorWorkspace (style/font/color config)
7. **`email-template`** — EmailTemplateWorkspace (blocks, responsive preview)
8. **`brand-identity`** — BrandIdentityWorkspace (colors, fonts, patterns)

---

## Change Log

| Date | Tool(s) | Change | By |
|------|---------|--------|----|
| 2025-07-17 | contract-template (Contract & Agreement Creator) | Full rebuild: 8 contract types, 8 visual templates, Zustand+Immer+Zundo store, HTML/CSS renderer, 5-tab editor (Document/Parties/Clauses/Style/Print), Figma-style layers panel, click-to-edit, undo/redo, print-ready, responsive layout | Drake |
| 2026-03-25 | Sales Books (9) | Initial COMPLETE — v3 tabbed editor, layers panel, brand colors, mobile fixes | Drake |
| | | Tracker created | — |
| 2026-07-24 | contract-template (Contract & Agreement Creator) | Zambian Law Enhancement: 16 contract types (added tenancy-agreement), all with comprehensive Zambian Act citations (30+ Acts), enhanced preambles, COMMON_CLAUSES with ZMW/WHT/VAT/Arbitration refs, created zambian-legal-reference.ts, fixed "ip" → "intellectual-property" TS errors, removed dead code | Drake |
| 2026-03-25 | contract-template (Contract & Agreement Creator) | Cover Design Picker: 6 optional cover templates (classic/corporate/dark-executive/accent-split/bold-frame/minimal-line) + "none" option; visual mini-preview grid in Style tab; Chiko coverDesign param; 0 TS errors | Drake |
| 2026-07-24 | resume-cv (Resume / CV) | Controls & Multi-Page Fix: Dynamic CSS override system (accent color per-template, section spacing, line spacing, font scale, margin presets), sidebar section break detection, A4 default, hardcoded accent overrides for templates 11 & 13, verified layers toggle | Drake |
| 2026-03-26 | ALL tools | Bulk status update: 95 tools changed from ready/beta → coming-soon. Only 10 personally-worked tools remain as "ready": 7 sales books, statement-of-account, contract-template, resume-cv. Added devStatus: "complete" to resume-cv and statement-of-account. | Drake |
| 2026-03-26 | certificate (Certificate Designer) | Full build: Zustand+Immer+Zundo store, 10 certificate types, 10 visual templates, HTML/CSS renderer with ornamental borders/seals/signatures, 4-tab editor (Content/Details/Style/Format), Figma-style layers panel, Chiko AI manifest (16 actions), print-ready, 0 TS errors | Drake |
| 2026-03-26 | diploma-designer (Diploma & Accreditation) | Full build: Zustand+Immer+Zundo store, 8 diploma types, 10 templates, honors system (8 levels), accreditation fields, HTML/CSS renderer with institutional seal, 4-tab editor, Figma-style layers, Chiko AI manifest (18 actions), print-ready, 0 TS errors | Drake |
| 2026-03-26 | ticket-designer (Ticket & Pass Designer) | Full build: Zustand+Immer+Zundo store, 12 ticket types (event/concert/movie/sports/boarding-pass/transit/vip/festival/raffle/parking/admission/conference), 10 templates, 7 sizes, QR code & Code128 barcode SVG generation, boarding pass layout, wristband layout, stub/perforation/serial numbering, 4-tab editor (Content/Details/Style/Format), Figma-style layers panel, Chiko AI manifest (17 actions), print-ready, 0 TS errors | Drake |
| 2026-03-27 | menu-designer (Menu Designer) | Full build: Zustand+Immer+Zundo store, 13 menu types (restaurant/café/bar-cocktail/fine-dining/buffet/prix-fixe/wedding-event/takeaway/food-truck/wine-list/kids/dessert/brunch), 12 visual templates, 30 currencies, 10 dietary tags, 10 font pairings, 5 price display styles, 11 divider styles, 3 column layouts, 6 page sizes (A4/Letter/A5/DL/Square/Tabloid) with landscape variants, 3 fold types (flat/bi-fold/tri-fold), paginated HTML/CSS renderer, 4-tab editor (Content/Menu/Style/Format), Figma-style layers panel, Chiko AI manifest (17 actions), print-ready, Zambian default (ZMW currency, Lusaka sample data) | Drake |
| 2026-03-27 | business-plan (Business Plan Writer) | Full build: Zustand+Immer+Zundo store, 8 plan types (startup/traditional/strategic/investor/lean/franchise/nonprofit/internal), 8 visual templates, 12 toggleable sections, SWOT grid, TAM/SAM/SOM visual, financial projections table, team cards, competitor analysis, 4 cover page styles, 5 header styles, paginated HTML/CSS renderer with cover/TOC, 5-tab editor (Content/Sections/Financials/Style/Format), Figma-style layers panel, Chiko AI manifest (16 actions + activity logging), print-ready, 0 TS errors | Drake |
| 2026-03-27 | id-badge (ID Badge & Lanyard Designer) | Full build: Zustand+Immer+Zundo store, 12 badge types (corporate/student/visitor/event/conference/contractor/vip/membership/security/volunteer/intern), 10 templates, CR80/CR79/CR100/custom card sizes, batch/bulk CSV import+manual add, dual-sided design (front+back), QR code (4 content types)/barcode (Code128/Code39)/magnetic stripe/NFC zone, lanyard config (breakaway clip/badge holder/branding), 8 role variants with colors, 8 font pairings, 16 accent colors, security features (holographic zone/watermark/microtext border/sequential numbering), 5-tab editor (Content/Batch/Back/Style/Format), Figma-style layers panel, Chiko AI manifest (25 actions + activity logging), print-ready multi-up layouts (single/2-up/4-up/8-up/10-up), 0 TS errors | Drake |
| 2026-03-28 | cover-letter (Cover Letter Writer) | Full build: Zustand+Immer+Zundo store, 12 letter types (general/targeted/referral/internal/career-change/entry-level/executive/academic/creative/technical/networking/follow-up), 6 tones (professional/confident/enthusiastic/conversational/formal/creative), 8 visual templates, 5 header styles (standard/banner/sidebar/minimal/boxed), 8 font pairings, 16 accent colors, job targeting (title/description/requirements/mission/whyThisCompany), personal background (skills/achievements/education/certifications), paginated HTML/CSS renderer with Google Fonts, 4-tab editor (Content/Target/Style/Format), Figma-style layers panel, Chiko AI manifest (14 actions + activity logging with prefillFromMemory), print-ready (A4/Letter), 0 TS errors | Drake |
| 2026-03-28 | worksheet-designer (Worksheet & Form Designer) | Full build: Zustand+Immer+Zundo store, 12 document types (educational-worksheet/quiz/exam/survey/feedback-form/registration-form/application-form/order-form/checklist/evaluation-form/sign-in-sheet/generic-form), 8 visual templates (clean-modern/academic-classic/playful-bright/minimal-mono/professional-blue/warm-earth/bold-contrast/pastel-soft), 27 element types across 6 categories (input/choice/scale/educational/structure/special), educational specialization (9 subjects, 16 grade levels, student name/date/score fields, answer key page with points & explanations), branding & confidentiality, multi-column sections with visibility toggle, 6 header styles (banner/underline/border/boxed/playful/minimal), paginated HTML/CSS renderer with Google Fonts, 4-tab editor (Content/Elements/Style/Format), Figma-style layers panel with layer tree, Chiko AI manifest (20+ actions + activity logging + prefillFromMemory), print-ready (A4/Letter/Legal/A5), 0 TS errors | Drake |
| 2026-03-28 | certificate (Certificate Designer), diploma-designer (Diploma & Accreditation) | Architecture fix: switched routing/adapters/Chiko manifests from Canvas2D workspaces to correct Pattern A (HTML/CSS renderer) workspaces in certificate-designer/ and diploma-designer/. Manifests fully rewritten to use certificate-editor/diploma-editor form-based stores. Chiko re-enabled in CertificateDesignerWorkspace with chikoOnPrintRef. 0 TS errors. | Drake |
| 2026-03-29 | certificate (Certificate Designer) | Complete EditorV2 canvas rebuild: migrated from HTML/CSS form-based renderer to production-grade DesignDocumentV2 canvas editor. 6 infrastructure upgrades (font-loader, svg-renderer, api/fonts, renderer post-effects, pdf-renderer fontkit+gradients+effects). 8 SVG-bordered templates with font pairings. New certificate-adapter.ts (CertificateConfig→DesignDocumentV2 with 15-25 tagged layers, 4 seal styles, signatory blocks). New Zustand store with sessionStorage persistence. 4 workspace components (TemplatePicker, QuickEdit, CertificateEditor with AI revision bar, CertificateDesignerWorkspace state machine). Chiko manifest rewritten (22 actions, 8 categories, tag-based layer lookup). Store adapter updated for project save/load. AI design generator with deterministic fallback. Bidirectional sync (StepEditor pattern). 0 TS errors. | Drake |
| 2026-03-30 | business-card (Business Card Designer) | Fabric.js migration (Phase 2): Replaced 6-step wizard with direct Fabric.js canvas editor. Created 8 Fabric.js JSON templates (Modern Minimal, Corporate Bold, Creative Gradient, Elegant Classic, Tech Startup, Nature Organic, Executive Premium, Vibrant Pop) at 1050×600px (3.5×2in @300DPI). Named objects (bc-name/bc-title/bc-company/bc-phone/bc-email/bc-website/bc-address) for quick-edit targeting. New FabricEditor wrapper with quick-edit fields. Chiko manifest via createFabricManifest() + update_contact_details action. New fabric-project.ts Zustand store for save/load. Store adapter rewritten for Fabric JSON persistence. 0 TS errors. | Drake |
| 2025-07-22 | voice-flow (VoiceFlow AI Dictation) | Full build: Zustand+Immer+Zundo store, Groq Whisper Large V3 transcription API, Anthropic Claude Haiku 4.5 post-processing API, 6 tones (natural/professional/casual/technical/academic/creative), 14 languages, hold/tap recording modes, waveform visualization (Web Audio AnalyserNode), auto-copy, custom vocabulary, 3-panel responsive layout (recorder+history/transcript-editor/settings), Chiko AI manifest (10 actions + activity logging), store adapter, credit system (3cr short/8cr long), 0 hardcoded colors | Drake |
| 2025-07-22 | presentation (Presentation Designer) | Fabric.js multi-slide scaffold: 10 Fabric.js JSON templates (Midnight Title/Content/Bullets/TwoColumn/Quote, Corporate Title/Content, Sunset Title, Green Section Divider, Blank) at 960×540 (16:9). Multi-slide workspace with SlideData interface, slide CRUD (add/duplicate/delete/move/select), slideJsonCache ref for slide switching, FabricEditor remount via key prop. 6 aspect ratios (16:9/4:3/16:10/A4-L/A4-P/Letter-L). AspectRatioPicker dropdown. Collapsible slides panel (w-56/w-10). SlideThumbnail with Framer Motion. Chiko manifest via createFabricManifest() + update_slide_details action (18 field mappings). Store adapter (960×540). Named objects (pres-title/subtitle/body/company/author/date/bullet1-4/headingLeft/Right/bodyLeft/Right/quoteText/quoteAuthor/sectionTitle/slideNumber). 0 TS errors. | Drake |
| 2025-07-23 | audio-transcription (Audio Transcription) | Full build: Zustand+Immer+Zundo store, Groq Whisper Large V3 verbose_json transcription API (segments with timestamps), 17 languages + auto-detect, translate-to-English, drag-and-drop file upload (audio+video: MP3/MP4/M4A/WAV/OGG/WebM/MOV/FLAC/AAC/AVI/MKV), 3-tier credit system (short 5cr/standard 12cr/long 20cr based on file size), 4 export formats (TXT/SRT/VTT/JSON), 3-panel responsive layout (upload+history-settings/transcript-viewer/settings-panel), Chiko AI manifest (7 actions + activity logging), store adapter, 25MB max file size, 60s API timeout, 20 req/min rate limit | Drake |
