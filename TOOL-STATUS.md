# DMSuite — Tool Development Status Tracker

> **Last updated:** 2026-04-02
> **Total tools registered:** 195+
> **Tools with workspace UI:** 100
> **Tools fully complete:** 25
> **Tools available (ready):** 19
> **Tools coming soon:** 179

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
| 12 | `resume-cv` | Resume & CV Builder | ResumeBuilderWorkspace | Reactive Resume-inspired two-panel editor, 20 pro templates, 13 sections + custom sections, drag-drop reorder, design drawer, live A4 preview |

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

### Color Palette Generator

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 18 | `color-palette` | Color Palette Generator | ColorPaletteWorkspace | **V2 Overhaul** — Realtime Colors quality. 5 color roles, 36 curated presets (Realtime default, GitHub Dark, Vercel Dark, Stripe Dark, etc.), 45+ Google Fonts with metadata, 20 professional font pairings with vibe tags, golden-angle random generation (AAA contrast guaranteed), intelligent dark↔light mode swap (not just text/bg flip — adjusts all 5 roles), 4 live previews (Landing/Dashboard/Blog/E-commerce), WCAG contrast checker (5 pairs), auto-fix contrast issues, Chiko manifest (25+ actions: harmonies/moods/industries/font pairings/contrast/presets), responsive sidebar+preview layout with mobile tabs, export (CSS/Tailwind/SCSS/JSON). Zustand+Immer+persist |

### Document Signer & Form Filler

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 19 | `document-signer` | Document Signer & Form Filler | document-signer/DocumentSignerWorkspace | DocuSeal-inspired. 14 field types (signature/initials/date/text/number/email/phone/checkbox/radio/select/textarea/file/stamp/image), multiple signers with color-coding, signature capture (draw/type/upload), 9 document templates (blank/nda/employment-contract/rental-agreement/service-agreement/sales-contract/freelancer-agreement/partnership-agreement/custom-upload), PDF upload, audit trail, email workflows, branding, 5-tab editor (Document/Fields/Signers/Style/Settings), Figma-style layers, Chiko AI manifest (24 actions + activity logging), Zustand+Immer+persist+Zundo store, print-ready |

### Invoice & Accounting Hub

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 20 | `invoice-tracker` | Invoice & Accounting Hub | invoice-accounting/InvoiceAccountingWorkspace | Invoice Ninja-inspired. Full invoicing, quoting, payments, expense tracking, time tracking, credit notes, purchase orders, client/vendor management, project management, reporting (revenue/P&L/tax summary/aging/client statement/expense/PAYE/NAPSA). Zambian localization (ZMW, ZRA VAT 16%, PAYE brackets, NAPSA 5%+5% capped K1,221.80/mo, Turnover Tax 4%). 23 views (Dashboard/InvoiceList/InvoiceEdit/QuoteList/QuoteEdit/CreditNoteList/CreditNoteEdit/PurchaseOrderList/PurchaseOrderEdit/PaymentList/ExpenseList/ExpenseEdit/ClientList/ClientEdit/VendorList/VendorEdit/ProductList/ProductEdit/ProjectList/ProjectEdit/TimeTracking/Reports/Settings). Zustand+Immer+persist+temporal store (~1500 lines). 4-doc print renderer (invoice/quote/credit-note/purchase-order) with 5 templates (clean/corporate/minimal/bold/classic). Chiko AI manifest (35+ actions). Store adapter. Mobile money support (MTN/Airtel/Zamtel). Multi-currency (ZMW/USD/EUR/GBP/ZAR). 0 TS errors. |

### Sketch Board (Excalidraw Infinite Canvas)

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 21 | `sketch-board` | Sketch Board | sketch-board/SketchBoardWorkspace | Excalidraw-powered (120K★ MIT) infinite canvas. Hand-drawn style diagrams, shapes (rectangle/ellipse/diamond/arrow/line/text), mermaid support, 1,000+ bundled library items from top 30 community libraries (AWS, UML, wireframing, icons, logos, data-viz, etc.), eraser, laser pointer, frames. Custom MainMenu (no external Excalidraw platform links). Dark/light theme sync via `theme` prop. Chiko AI manifest (20 actions). Workspace events (dirty, progress). localStorage persistence. PNG/SVG/JSON/clipboard export. CSS isolation overrides. tldraw V1 fully removed. 0 TS errors. |

### AI Chat Assistant

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 22 | `ai-chat` | AI Chat Assistant | ai-chat/AIChatWorkspace | **Rebuilt from scratch using @lobehub/ui (MIT) chat components.** Uses actual LobeChat UI components: ChatList, ChatItem, ChatInputArea, ChatHeader, BackBottom, DraggablePanel. 6 AI models (Claude Sonnet 4/Haiku, GPT-4o/mini, Gemini 2.0 Flash, DeepSeek) across 4 providers. Streaming via /api/chat (Vercel AI SDK). Conversation sidebar with search, pinned sections. Model selector dropdown. Settings panel (system prompt, temperature, max tokens). Zustand+persist store (~300 lines). Store adapter. Credit system (5cr/message). 0 TS errors. |

### AI Flow Builder (Visual Workflow Canvas)

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| 23 | `ai-flow-builder` | AI Flow Builder | ai-flow-builder/AIFlowBuilderWorkspace | Langflow-inspired visual AI workflow builder. @xyflow/react v12 node-based canvas with drag-drop node palette. 22 node types across 8 categories (inputs/outputs/models/prompts/processing/memory/agents/tools). 7 port data types (message/data/model/memory/tool/embeddings/any) with color-coded connection handles and type-safe validation. 6 pre-built starter templates (Basic Chatbot/RAG Pipeline/Agent with Tools/Content Generator/Translation Pipeline/Multi-Model Comparison). Custom FlowNode component with typed ports, status indicators (running/complete/error/frozen), output preview. NodePalette sidebar with search/filter and category grouping. NodeInspector right panel with all param types (text/textarea/number/select/boolean/json/slider). PlaygroundChat panel for testing flows with execution trigger. Topological sort execution engine calling /api/chat/ai-flow-builder for LLM nodes. Snap-to-grid, MiniMap, Controls, Background grid. Zustand+Immer+persist+temporal store (undo/redo). 3-panel responsive layout (palette/canvas/inspector+playground) with mobile bottom nav. Keyboard shortcuts (Ctrl+Z/Y/S). Export/import JSON flows. Chiko AI manifest (30+ actions across 9 categories: Flow/Nodes/Connections/Templates/Flow Management/Playground/Canvas/Info/Settings — including build_flow composite action). Store adapter. API route with auth+credit+Anthropic+token tracking. 0 TS errors. |

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
| 1 | `logo-generator` | Logo Generator | LogoGeneratorWorkspace | `SCAFFOLD` |
| 3 | `social-media-post` | Social Media Post | SocialMediaPostWorkspace | `SCAFFOLD` |
| 4 | `ai-image-generator` | AI Image Generator | StockImageBrowserWorkspace | `SCAFFOLD` |
| 5 | `photo-retoucher` | Photo Retoucher | StockImageBrowserWorkspace | `SCAFFOLD` |
| 6 | `brand-identity` | Brand Identity | BrandIdentityWorkspace | `SCAFFOLD` |
| 7 | `business-card` | Business Card | BusinessCardWorkspace | `SCAFFOLD` (Fabric.js) |
| 8 | `poster` | Poster Maker | PosterFlyerWorkspace | `SCAFFOLD` |
| 9 | `flyer` | Flyer Maker | PosterFlyerWorkspace | `SCAFFOLD` |
| 10 | `banner-ad` | Banner Ad | BannerAdWorkspace | `SCAFFOLD` |
| 11 | `icon-illustration` | Icon & Illustration | IconGeneratorWorkspace | `SCAFFOLD` |
| 12 | `background-remover` | Background Remover | BackgroundRemoverWorkspace | `COMPLETE` |
| 13 | `image-enhancer` | Image Enhancer | ImageEnhancerWorkspace | `SCAFFOLD` |
| 14 | `color-palette` | Color Palette | ColorPaletteWorkspace | `COMPLETE` |
| 15 | `mockup-generator` | Mockup Generator | MockupGeneratorWorkspace | `SCAFFOLD` |
| 16 | `presentation` | Presentation Designer | SlidevPresenterWorkspace | `COMPLETE` (Slidev-inspired markdown presenter) |
| 17 | `reveal-presenter` | Reveal.js Presenter | RevealPresenterWorkspace | `SCAFFOLD` (Reveal.js 6.0 HTML slide editor) |

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
| 42 | `presentation` | Presentation | SlidevPresenterWorkspace | `COMPLETE` |
| 43 | `resume-cv` | Resume / CV | ResumeBuilderWorkspace | `COMPLETE` |
| 44 | `resume-cv-v2` | Resume Builder V2 (Reactive) | resume-cv-v2/ResumeCVV2Workspace | `SCAFFOLD` |
| 45 | `email-template` | Email Template | EmailTemplateWorkspace | `SCAFFOLD` |

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
| 3 | `pdf-tools` | PDF Tools Suite | PDFToolsWorkspace (pdf-tools/) | `COMPLETE` |

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
- `barcode-generator`, `watermark-tool`
- `color-converter`, `unit-converter`, `contrast-checker`

</details>

---

## Counts Summary

| Status | Count | Description |
|--------|-------|-------------|
| **COMPLETE** | 24 | Sales Books (9) + Statement of Account + Contract & Agreement + Resume/CV + Certificate + Diploma + Ticket + Menu + ID Badge + Worksheet + Cover Letter + Color Palette + Background Remover + PDF Tools + Document Signer + Invoice & Accounting + Sketch Board (Excalidraw) + Presentation + AI Chat + AI Flow Builder |
| **SCAFFOLD** | 84 | Has workspace UI but untested/unpolished — all set to "coming-soon" |
| **NO-UI** | 100+ | Placeholder page only — all set to "coming-soon" |
| **READY** | 12 | Available to users (complete tools only) |
| **COMING-SOON** | 184 | Grayed out in dashboard |
| **TOTAL** | 195+ | Registered in tools.ts |

---

## How to Use This Tracker

1. **When you finish working on a tool**, move it from `SCAFFOLD` to `COMPLETE` and add notes about what was done.
2. **Add a date** next to the tool when marking it complete so you can track velocity.
3. **Priority order** for next tools to complete — pick from SCAFFOLD list since they already have UI code.

### Suggested Next Priorities (High-Impact SCAFFOLD Tools)

These already have substantial workspace code and would benefit most from a polish pass:

1. **`resume-cv`** — ResumeBuilderWorkspace (Reactive Resume-inspired two-panel editor, 20 pro templates, 13 sections + custom, drag-drop reorder)
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
| 2026-03-31 | background-remover (Background Remover) | Full production build: Real AI-powered background removal using @imgly/background-removal (ONNX model, runs 100% client-side). Lazy-loaded model with progress tracking. 5 background replacement modes (transparent/solid color with 10 presets/gradient with 5 directions/custom image/blur original). Interactive before/after comparison slider with draggable handle (mouse+touch). Full-resolution canvas composite rendering for export. 3 export formats (PNG/JPEG/WebP) with quality control. Batch mode for multi-image processing. Real progress bar with percentage. Workspace events integration (workspace:dirty/save/progress). Responsive mobile tabs. No server required — all processing in-browser. | Drake |
| 2025-07-27 | pdf-tools (PDF Tools Suite) | Full production build inspired by Stirling-PDF: 18 client-side PDF operations (merge/split/extract/rotate/delete-pages/reorder/reverse/compress/watermark/page-numbers/stamp/protect/metadata/convert/multi-page-layout/overlay/scale/info). pdf-lib engine (20+ functions in src/lib/pdf/pdf-engine.ts). Chiko AI manifest (18 actions, 9 categories: Navigation/Page Ops/Optimize/Content/Security/Convert/Advanced/Actions/Read). Dark-first responsive workspace with tool grid (5 categories), settings panels per tool, drag-drop file upload, multi-file merge/overlay, real-time progress, compression results display, PDF info viewer with metadata+page sizes. Free tier (no AI cost, all processing client-side). 0 TS errors. | Drake |
| 2025-07-28 | color-palette (Color Palette Generator) | Full build: Realtime Colors-inspired palette generator. Zustand+Immer+persist store. 5 color roles (text/background/primary/secondary/accent). Font pairing (27 Google Fonts, heading+body). 4 live website preview layouts (Landing/Dashboard/Blog/E-commerce) with real-time color/font application. Mondrian 60-30-10 color distribution panel. WCAG contrast grid (6 pairs, AA/AAA/Fail badges). 10 curated preset palettes (Midnight Aurora/Sunrise Warm/Ocean Breeze/Forest Canopy/Cyber Neon/Elegant Mono/Coral Sunset/Royal Purple/Fresh Mint/Classic Professional). Save/load user palettes. Export (CSS Variables/Tailwind v4/SCSS/JSON). Share link generator. Spacebar randomize shortcut. Swap text↔background. Chiko AI manifest (25+ actions: set colors, apply presets, generate harmonies [6 modes], generate from mood [12 moods], generate for industry [10 industries], check WCAG contrast, fix contrast issues, manage saved palettes, export). 3-column responsive layout (color sidebar/live preview/export panel) with mobile tabs. 0 TS errors. | Drake |
| 2025-07-29 | sketch-board (Sketch Board) | Full build: tldraw-inspired infinite canvas whiteboard. Custom SVG rendering engine with camera transform (pan/zoom/infinite canvas). 13 tools, freehand drawing with bezier smoothing, shapes (rect/ellipse/diamond/triangle), lines, arrows, text, sticky notes. Style panel (stroke/fill/width/dash/opacity/font). Grid+snap. Background presets. Export PNG/SVG. Keyboard shortcuts. Zustand+Immer+persist+temporal store. Chiko AI manifest (40+ actions including composite: flowchart/mind-map/sticky-wall). Store adapter. 0 TS errors. | Drake |
| 2025-07-28 | color-palette (Color Palette Generator) | **V2 Major Overhaul**: Rewrote all 3 files from scratch. 36 curated presets (Realtime Default, Indigo Dream, Cyber Neon, GitHub Dark, Vercel Dark, Stripe Dark, Vaporwave, Aurora Borealis, etc.). 45+ Google Fonts with FontMeta (name, category, weights). 20 professional font pairings with vibe tags (Modern Clean, Editorial, Startup, Elegant Serif, etc.). Golden-angle random palette generation engine with perceptual lightness rules and AAA contrast guarantee. Intelligent dark↔light mode swap (derives new values for all 5 color roles, not just text/bg flip). Polished sidebar+preview layout with 6 tabs (Colors, Presets, Fonts, A11y, Saved, Export). Rich previews (Landing/Dashboard/Blog/E-commerce). Font pairing selector with search and vibe labels. WCAG contrast checker (5 pairs with visual badges). Auto-fix contrast issues. Mobile-responsive (tab toggle between Controls and Preview). Chiko manifest updated (25+ actions including applyFontPairing). 0 TS errors. | Drake |
| 2025-07-29 | document-signer (Document Signer & Form Filler) | Full build: DocuSeal-inspired document filling & signing platform. Zustand+Immer+persist+Zundo store. 14 field types (signature/initials/date/text/number/email/phone/checkbox/radio/select/textarea/file/stamp/image). Multiple signers with color-coding. Signature capture (draw canvas with color/width controls, type with 6 font choices, upload mode). 9 document templates (blank/nda/employment-contract/rental-agreement/service-agreement/sales-contract/freelancer-agreement/partnership-agreement/custom-upload). PDF upload support. Audit trail with timestamped entries. Email workflows (subject templates, reminders, CC, reply-to). Branding (company name/logo/brand color). 5-tab editor (Document/Fields/Signers/Style/Settings). Figma-style layers panel. Chiko AI manifest (24 actions + activity logging). Store adapter. Print-ready PDF export. 0 TS errors. | Drake |
| 2025-07-29 | invoice-tracker (Invoice & Accounting Hub) | Full build: Invoice Ninja-inspired invoicing & accounting platform. Zambian localization (ZMW, ZRA VAT 16%, PAYE brackets, NAPSA 5%+5% capped K1,221.80/mo, Turnover Tax 4%). Zustand+Immer+persist+temporal store (~1500 lines). 23 views (Dashboard/InvoiceList+Edit/QuoteList+Edit/CreditNoteList+Edit/PurchaseOrderList+Edit/PaymentList/ExpenseList+Edit/ClientList+Edit/VendorList+Edit/ProductList+Edit/ProjectList+Edit/TimeTracking/Reports/Settings). 4-doc print renderer (invoice/quote/credit-note/purchase-order) with 5 templates each (clean/corporate/minimal/bold/classic). Shared UI components (StatusBadge/PageHeader/TabStrip/StatCard/ClientPicker/VendorPicker/ProductPicker/TaxRatePicker/SectionDivider). Multi-currency (ZMW/USD/EUR/GBP/ZAR). Mobile money (MTN MoMo/Airtel Money/Zamtel Kwacha). Chiko AI manifest (35+ actions: create/edit all document types, add line items, set tax rates, generate reports, manage clients/vendors/products). Store adapter. 0 TS errors. | Drake |
| 2026-04-02 | ai-chat (AI Chat Assistant) | Full LibreChat-inspired rebuild: Deleted old scaffold AIChatWorkspace.tsx. New enhanced Zustand+Immer+persist store with ChatProvider (claude/openai), ChatMessage (bookmarked/tokenEstimate/parentId), ChatConversation (pinned/folder/temporary/systemPrompt), 6 builtin presets + custom presets, conversation CRUD/pin/duplicate/fork/folders/bookmarks, export (md/json/txt). Enhanced /api/chat route with dynamic systemPrompt passthrough. New workspace at ai-chat/AIChatWorkspace.tsx: conversation sidebar (search/date-grouped/pinned/folders/context menus), message bubbles (ReactMarkdown+remarkGfm+rehypeHighlight, copy/bookmark/fork/edit+resend/regenerate), model picker (Claude/GPT-4o), system prompt panel with preset pills, streaming with AbortController, token estimation, empty state with 6 suggestions, responsive mobile sidebar overlay, export dropdown. Chiko AI manifest (13 actions, 5 categories). Store adapter. 8-point integration contract wired (page.tsx/store-adapters/manifests/tools.ts/stores-index). Status → ready, devStatus → complete. 0 TS errors. | Drake |
| 2026-04-03 | ai-chat (AI Chat Assistant) | **V2: LibreChat-faithful UI overhaul**: Complete ground-up UI rewrite. Removed old DMSuite card-in-card patterns. New design: full-bleed dark theme (bg-gray-900 main, bg-gray-950 sidebar) matching LibreChat/ChatGPT aesthetic. Key changes: (1) No rounded-2xl card wrapper—fills entire workspace area. (2) Pill-shaped input area (rounded-3xl) with paperclip file upload button inside, ArrowUp send button. (3) Model selector as prominent dropdown at top-left (LibreChat style). (4) Temporary chat: violet-tinted input border + banner notification above messages, hidden from sidebar. (5) Code blocks with language label header + copy button. (6) Custom markdown components (CodeBlock, inline code). (7) File upload: FileAttachment type in store, base64 data URLs, image preview in messages, file chips above input. (8) Multimodal API: Updated /api/chat/route.ts for image_url→Anthropic image source conversion. (9) Right panel: toggleable Presets/Prompts and Bookmarks side panels. (10) Message actions: copy/edit/bookmark/fork/regenerate on hover. (11) Sidebar: pen icon New Chat, search, date-grouped, pinned, folders, edit/delete/pin inline on hover (no context menu). (12) Empty state: centered logo + "How can I help you today?" + 6 suggestion cards. (13) Disclaimer text below input. (14) Send button: white circle with ArrowUp icon (ChatGPT style). (15) Stop button: gray circle with stop square icon. 0 TS errors. | Drake |
| 2025-07-30 | resume-cv (Resume & CV Builder) | **Complete Reactive Resume-inspired rebuild**: Replaced 8-step wizard with two-panel editor (left scrollable sections + right live A4 preview). 7 new components (ResumeBuilderWorkspace, ResumeLeftPanel, BasicsSection, SummarySection, ListSection, ResumeDesignDrawer, ExportDropdown). 13 built-in sections (basics/summary/profiles/experience/education/skills/certifications/languages/projects/volunteer/awards/publications/interests/references) + custom sections. Schema enhanced with 3 new sections (profiles/publications/interests) + photo field. ListSection: generic drag-drop reorder, per-item expand/collapse, keywords chip editor, text/textarea/select/keywords field types. Design drawer: 20 pro template grid, accent color swatches + custom picker, color intensity, font pairing selector, font scale, page format, margins, section/line spacing, sidebar width. Mobile: bottom bar toggles editor/preview/design views. Keyboard shortcuts (Ctrl+Z/Y). Chiko manifest updated. AI generator types inlined (removed wizard dependency). 0 TS errors. | Drake |
| 2025-07-31 | resume-cv (Resume & CV Builder) | **V2 cont'd — AI, API, Chiko manifest, full wiring**: Created 3 API routes (generate/revise/parse with credit check+deduct+refund pattern, Anthropic Claude). AI engine (system prompts for generate/revise/ATS, message builders). Full Chiko manifest (40+ actions across 8 categories: Info/Content/Style/Typography/Layout/AI/Export/Misc — readState, readSectionItems, updateBasics/Picture/Summary, section CRUD, custom sections, changeTemplate, colors, typography with font pairing lookup, level design, CSS, layout ops, generateResume, reviseResume, scoreATS, acceptRevision, rejectRevision, export, validate, prefillFromMemory, importJSON, resetResume). Full workspace component (two-panel layout, zoom toolbar, Google Fonts hook, dispatchDirty/dispatchProgress, keyboard shortcuts Ctrl+Z/Y/P, mobile bottom bar, design drawer, export dropdown, start-over dialog). All TypeScript errors fixed (metadata path corrections, ConfirmDialog props, Icons registry alignment). 0 TS errors. | Drake |
| 2025-07-30 | presentation (Presentation Designer) | **Slidev-inspired markdown rebuild**: Replaced Fabric.js multi-slide editor with Slidev-inspired markdown slide deck creator. 10 new files. Core markdown parser (parseSlidevMarkdown/reconstructMarkdown) with YAML frontmatter extraction. 17 slide layouts (default/center/cover/intro/end/section/statement/fact/quote/two-cols/two-cols-header/image/image-left/image-right/full/iframe/none). 10 themes (Default/Seriph/Apple Basic/Dracula/Academic/Geist/Purplin/Penguin/Mokka/Neon). Zustand+Immer+persist+Zundo store with markdown as single source of truth. SlidevSlideRenderer with dynamic highlight.js code highlighting, KaTeX math rendering, Mermaid diagram rendering, v-click animations, two-cols layout support. Navigator panel with slide thumbnails, move/duplicate/delete, speaker notes. 3-tab editor (Editor/Theme/Settings). Full Document + per-slide editing modes. Presenter overlay (current+next slide, notes, timer). Fullscreen presentation with keyboard nav (→/Space/←/Backspace/F/P/O/D). Slide overview grid. Drawing overlay (canvas pen with color/width picker). Print/export via browser print. Chiko AI manifest (25 actions across 8 categories: Info/Content/Layout/Metadata/Style/Navigation/Export/Reset). NPM deps: marked, highlight.js, katex, mermaid. 0 TS errors. | Drake |
| 2025-08-01 | ai-flow-builder (AI Flow Builder) | Full Langflow-inspired build: @xyflow/react v12 visual node canvas. 22 node types across 8 categories (inputs/outputs/models/prompts/processing/memory/agents/tools). Node registry with 7 port data types (message/data/model/memory/tool/embeddings/any). Topological sort execution engine (/api/chat/ai-flow-builder). 6 pre-built templates. Zustand+Immer+persist+temporal store. 5 workspace components (FlowNode/NodePalette/NodeInspector/PlaygroundChat/FlowCanvas) + AIFlowBuilderWorkspace parent. Chiko AI manifest (30+ actions including build_flow composite). Store adapter. API route (auth+credits+Anthropic+token tracking). All 8-point integration wired (page.tsx/store-adapters/manifests/tools.ts/credit-costs). Status → ready, devStatus → complete. 0 TS errors. | Drake |
| 2025-08-01 | sketch-board (Sketch Board) | **V2 consolidation**: Deleted V1 custom SVG renderer (SketchBoardWorkspace, sketch-board-editor store, sketch-board types, V1 Chiko manifest). Promoted V2 infinite canvas to be the sole Sketch Board. Renamed all files/IDs from sketch-board-v2 → sketch-board. Removed all tldraw branding from user-facing text (tool name, description, tags). Updated store adapter (IndexedDB persistence). Updated TOOL-STATUS entry. 0 TS errors. | Drake |
| 2025-08-02 | sketch-board-v2 (Sketch Board V2) | **Excalidraw port**: Full Excalidraw-powered (v0.18.0, 120K★ MIT) infinite canvas as Sketch Board V2 for side-by-side comparison with tldraw-based V1. New workspace (SketchBoardV2Workspace.tsx) with dynamic import, theme sync via `theme` prop, localStorage persistence, workspace events (dirty/progress). Chiko AI manifest (20 actions across 7 categories: Info — readCurrentState/listElements/getSelectedElements/showToast; Navigation — scrollToContent; Create — createRectangle/Ellipse/Diamond/Text/Arrow/Line; Modify — deleteSelected/selectAll/clearCanvas/setBackgroundColor; Tool — setActiveTool; View — toggleGrid/toggleZenMode; Export — exportInfo; History — clearHistory). All 8 integration points wired: tools.ts entry, page.tsx dynamic import, store-adapters.ts generic adapter, manifests/index.ts barrel export, TOOL-STATUS.md entry+changelog. CSS isolation overrides in globals.css (.excalidraw-wrapper scope). Hand-drawn style, built-in shape libraries, mermaid diagrams, eraser, laser pointer, frames, PNG/SVG/JSON/clipboard export, offline-ready. Status → ready, devStatus → complete. 0 TS errors. | Drake |
| 2025-08-03 | sketch-board (Sketch Board) | **Final Excalidraw consolidation**: Removed tldraw V1 entirely (workspace, manifest, CSS isolation, tldraw dependency). Promoted Excalidraw as sole Sketch Board. Bundled top 30 community libraries (1,006 items, 8.2MB) — AWS, UML, wireframing, icons, logos, data-viz, system design, etc. Libraries auto-load on canvas mount via `updateLibrary()` API. Custom `<MainMenu>` removes all external Excalidraw platform links (Socials, LiveCollaboration). CSS hides "Browse libraries" and external anchors (github/discord/twitter/excalidraw.com). Self-contained — no external platform dependencies. 0 TS errors. | Drake |
| 2025-08-03 | resume-cv (Resume & CV Builder) | **V3 Enhancement Pass**: (1) Import system: new import.ts parser supporting 5 formats (DMSuite JSON, JSON Resume standard, Reactive Resume, LinkedIn export, plain text) with auto-detection + ImportDialog.tsx component (drag-drop upload, format detection badge, data preview before confirm). (2) DOCX export rewrite: proper HTML→bullet list parsing, hyperlinks (mailto/tel/URLs), bold/italic inline formatting, layout-aware section ordering from metadata, contact line with clickable links, social profiles row. (3) Templates expanded 13→20: added nidoran (Executive Crimson), eevee (Adaptive Modern), snorlax (Comfortable Classic), jolteon (Electric Edge), clefairy (Soft Elegance), umbreon (Dark Professional), mewtwo (Monochrome Power) — each with distinct accent color, font pairing, header style, skill style, and visual identity. 0 TS errors. | Drake |
| 2025-08-04 | ai-chat (AI Chat Assistant) | **V3: Lobe Chat-inspired full rewrite**: Complete erasure of V2 LibreChat code + rebuild using Lobe Chat (60K★) patterns. New store (ai-chat-editor.ts ~560 lines): 6 models (Claude Sonnet 4/Haiku 4, GPT-4o/mini, Gemini 2.0 Flash, DeepSeek V3) across 4 providers (claude/openai/gemini/deepseek). Agent persona system (6 built-in: DMSuite Assistant/Creative Writer/Code Assistant/Data Analyst/Business Advisor/Design Consultant + custom). Topic threading. Conversation CRUD (create/delete/rename/pin/archive/duplicate). Message actions (copy/edit/bookmark/fork/regenerate). Export (json/markdown/text) + import. New API route (/api/chat) with multi-provider streaming (Anthropic/OpenAI/Google/DeepSeek), auth+credits pipeline. New workspace (AIChatWorkspace.tsx ~700 lines): collapsible left sidebar with conversation list (pinned/recent sections, inline rename/pin/delete), search. Center: message bubbles with full markdown (ReactMarkdown+remarkGfm+remarkMath+rehypeHighlight+rehypeKatex), code blocks with language header+copy, message action toolbar on hover. Agent selector modal. Model selector dropdown. File upload (paperclip, image preview, multi-file). Empty state with 6 suggestion cards. Streaming indicator. Export dropdown (markdown/json/text + import). Mobile sidebar overlay. Chiko manifest (12 actions: readCurrentState, conversation CRUD, setModel, setAgent, listAgents, exportConversation, reset + activity logging). Store adapter. All 8-point integration wired. remark-math + rehype-katex deps added. 0 TS errors. | Drake |
| 2025-08-04 | ai-chat-v2 (AI Chat V2 Lobe) | **New tool: Lobe Chat–faithful 3-panel chat** as separate tool for side-by-side comparison with V3. Store (ai-chat-v2-editor.ts ~850 lines): Session-based architecture (vs V3 Conversation), SessionGroup with collapsible sections, Topic threading per session, 10 built-in agents (LobeChat Assistant/Creative Muse/Code Pilot/Data Scientist/Strategy Advisor/UX Architect/Copy Chief/DevOps Engineer/Language Tutor/Research Analyst). Per-session model/temperature/maxTokens/systemPrompt overrides. Session CRUD + group management + topic CRUD + agent CRUD/clone. Workspace (AIChatV2Workspace.tsx ~1500 lines): 3-panel layout — Session sidebar (left 72w, groups/pinned/search/agent avatars) + Chat area (center, model selector dropdown with provider groups, agent badge, message bubbles with translate/TTS/bookmark/fork/regenerate actions) + Right panel (Topic panel 60w OR Settings panel 80w with agent market tab, temperature/maxTokens sliders, inline system prompt editor). Empty state with 6 featured agents grid + 4 suggestion chips. Streaming with AbortController. File upload. Mobile sidebar overlay. Export/import. Chiko manifest (13 actions: state/session CRUD/model/agent/topics/export/reset + activity logging). Reuses existing /api/chat route. All 8-point integration wired. 0 TS errors. | Drake |
| 2025-08-04 | resume-cv-v2 (Resume Builder V2) | **New tool: Reactive Resume v5 port** as separate tool for side-by-side comparison with V1. Faithful adaptation of Reactive Resume v5 (36K★, MIT). Schema (schema.ts ~310 lines): Full Zod schema with 13 section types, 13 Pokemon-named templates, urlSchema, pictureSchema, basicsSchema, summarySchema, 11 section item schemas, metadata (typography/design/layout/page/css/notes), PageDimensions. Store (resume-v2-editor.ts ~290 lines): Zustand+Immer+persist+temporal (zundo undo/redo). 30+ actions (updateBasics/Summary/Picture field-based, section CRUD, template/design/typography/layout/page/CSS/notes). Hooks (hooks.ts): useCSSVariables (20+ CSS custom properties), useWebfonts (Google Fonts FontFace API), createId, stripHtml. 13 templates (Onyx/Pikachu/Gengar/Glalie/Azurill/Bronzor/Chikorita/Ditgar/Ditto/Kakuna/Lapras/Leafish/Rhyhorn) with template registry. Shared renderers (12 section item renderers + PageSection generic + PageLevel with 6 level design types). 3-panel workspace: left sidebar (15 section editors with generic ListSectionEditor supporting dot-notation nested fields), center artboard (react-zoom-pan-pinch), right sidebar (template picker/layout/typography/design/page/CSS/notes/export). Preview CSS module with template variants. JSON import/export. Print export. All integration wired (page.tsx, tools.ts, store-adapters.ts). 0 TS errors. | Drake |
| 2026-04-04 | ai-chat (AI Chat Assistant) | **Vercel AI SDK migration**: Replaced ~250 lines of raw fetch calls + SSE parsing with Vercel AI SDK (`ai` v6, Apache-2.0). Installed `ai@6.0.146`, `@ai-sdk/anthropic@3.0.66`, `@ai-sdk/openai@3.0.50`, `@ai-sdk/google@3.0.58`. API route (`/api/chat/route.ts`) rewritten from 360→140 lines: unified `streamText()` replaces 4 separate provider functions (`streamClaude`, `streamOpenAI`, `streamGemini`, `streamDeepSeek`) + custom `transformSSE()`. Provider mapping via `anthropic()`, `openai()`, `google()`, `createOpenAI()` (DeepSeek). Message conversion handles multimodal `image_url` → AI SDK `image` parts. Returns `toTextStreamResponse()` — same plain-text streaming format, zero client changes needed. Auth + credit pipeline (check/deduct/refund) unchanged. Also fixed pre-existing `getGenericAdapter()` missing `subscribe` in `store-adapters.ts`. 0 new TS errors. | Drake |
| 2026-04-04 | document-signer (Document Signer & Form Filler) | **NPM package upgrade**: Replaced custom canvas signature drawing with `react-signature-canvas` (MIT) — smooth Bézier curves, touch support, `getTrimmedCanvas()` for whitespace cropping. Added `react-pdf` (Apache-2.0) for real PDF page rendering when PDFs are uploaded (pdfjs-dist worker, dynamic import SSR-false, page loading/error states). Created `src/lib/document-signer/pdf-export.ts` — real PDF generation via `pdf-lib` + `@pdf-lib/fontkit`: for uploaded PDFs loads original and embeds signatures/field values in-place, for template docs generates new A4 PDF with title/company/description/fields. Export wired into workspace with HTML print fallback. CSS isolation for react-pdf in `workspace-canvas.css`. 0 TS errors. | Drake |
| 2026-04-05 | reveal-presenter (Reveal.js Presenter) | **New tool: Reveal.js 6.0 port** (68K★ MIT). Separate tool from existing Slidev `presentation`. Zustand+Immer+persist+temporal store (reveal-presenter-editor.ts ~410 lines). 14 themes (black/white/league/beige/night/serif/simple/solarized/moon/dracula/sky/blood/black-contrast/white-contrast). 6 transitions (none/fade/slide/convex/concave/zoom) × 3 speeds. Per-slide background/transition overrides. Speaker notes. generateHTML() standalone export. Workspace (RevealPresenterWorkspace.tsx ~1050 lines): 3-panel editor (left slide list+settings, center live reveal.js preview, right slide editor). Dynamic reveal.js+plugin import (notes/highlight/markdown/math/search/zoom). CDN theme CSS loader. Fullscreen presenter mode (F5). Overview grid (O). Keyboard shortcuts (Ctrl+Z/Y undo/redo). HTML export download. Chiko manifest (25+ actions across 8 categories: info/content/metadata/style/options/generation/navigation/export/reset + activity logging via withActivityLogging wrapper). CSS isolation in globals.css (.reveal-presenter-wrapper scope). All 8-point integration wired (page.tsx/tools.ts/store-adapters.ts/manifests/credit-costs.ts). 0 TS errors. | Drake |
| 2026-04-05 | ai-chat (AI Chat Assistant) | **Complete rebuild using @lobehub/ui MIT components.** Deleted ALL prior code (AIChatWorkspace ~1200 lines, AIChatV2Workspace ~1200 lines, 2 Zustand stores ~1500 lines, 2 Chiko manifests ~700 lines). Installed @lobehub/ui v5.6.4 + antd + antd-style + motion. New workspace uses actual LobeChat components: ChatList, ChatItem, ChatInputArea, ChatHeader, ChatHeaderTitle, BackBottom, DraggablePanel, ThemeProvider. Consolidated ai-chat + ai-chat-v2 into single tool. New store (ai-chat-editor.ts ~300 lines): conversations, streaming, model/provider/temp/tokens settings, message CRUD. Sidebar with search, pinned/unpinned sections. Model selector (6 models, 4 providers). Settings panel. Empty state. next.config.ts updated with transpilePackages. 0 TS errors. | Drake |
