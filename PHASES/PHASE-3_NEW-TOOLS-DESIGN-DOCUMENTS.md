# DMSuite — PHASE 3: New Tool Workspaces — Design & Document Studio

> **Codename:** "Arsenal"
> **Duration:** 6–8 Weeks
> **Goal:** Implement all remaining Design Studio and Document & Print Studio tools to full industry standard. Every tool should be fully functional, export-capable, AI-powered, responsive, and shortcut-enabled.

---

## Global Standards for All New Workspaces

Every workspace built in this phase MUST:
1. **Use `<CanvasWorkspaceShell>`** (from Phase 1) — no duplicated layout code
2. **Use `<WorkspaceShell>`** for non-canvas tools — shared sidebar/topbar/breadcrumbs
3. **Be layer-based** where applicable — full interactive canvas editing
4. **Have undo/redo** — connected to shared undo engine
5. **Have keyboard shortcuts** — registered in global shortcuts registry
6. **Export to proper formats** — PDF for print, HTML for web, PNG/SVG for images
7. **Have AI integration** — AI generates content, supports revision (preserves design)
8. **Be fully mobile-responsive** — tab-based layout on mobile, touch gestures
9. **Use UI primitives** — `Button`, `Input`, `Card`, `Badge`, `Modal` from `@/components/ui`
10. **Use `canvas-utils.ts` functions** — no local duplicates
11. **Save/load project state** — via Zustand persisted store or localStorage
12. **Have proper print specifications** — bleed, safe zones, CMYK approximation where needed
13. **Support Zambian locale defaults** — ZMW currency, +260 phone, Lusaka, Zambia
14. **No hardcoded strings** — all labels, placeholders, and defaults from config/data files

---

## Wave 3.1 — Design Studio: Print & Stationery

### Task 3.1.1 — Brochure Designer
**File:** New `src/components/workspaces/BrochureDesignerWorkspace.tsx`
**Tool ID:** `brochure`
**Features:**
- Fold types: Bi-fold (4 panels), Tri-fold (6 panels), Z-fold, Gate-fold, Accordion
- Page sizes: A4, A3, Letter, Legal, Custom
- Panel-based editing (each panel is a separate editing zone)
- Layer-based per panel (text, images, shapes)
- Print bleed + crop marks
- Inside/outside view toggle
- AI: Generate brochure content from business description
- Export: PDF (print-ready with fold marks), PNG
- Templates: 6+ per fold type (corporate, tourism, education, real estate, health, tech)

### Task 3.1.2 — Letterhead Designer
**File:** New `src/components/workspaces/LetterheadDesignerWorkspace.tsx`
**Tool ID:** `letterhead`
**Features:**
- Page sizes: A4, US Letter, Legal
- Zones: Header (logo + company info), body (write area), footer (contact/legal)
- Layer-based header/footer editing
- Watermark support (faded logo in body area)
- Templates: 6+ (minimal, corporate, elegant, modern, bold, creative)
- AI: Generate company letterhead from business info
- Export: PDF (print-ready), PNG, DOCX template
- Print specs: 3mm bleed, safe zones

### Task 3.1.3 — Envelope Designer
**File:** New `src/components/workspaces/EnvelopeDesignerWorkspace.tsx`
**Tool ID:** `envelope`
**Features:**
- Sizes: DL (220×110mm), C5 (229×162mm), C4 (324×229mm), #10 (241×105mm), Custom
- Front and back editing
- Return address zone, recipient zone, stamp zone
- Window envelope variant (transparent window for address)
- Templates: 6+ matching letterhead styles
- AI: Generate envelope design matching brand kit
- Export: PDF (print-ready), PNG

### Task 3.1.4 — Certificate Designer
**File:** New `src/components/workspaces/CertificateDesignerWorkspace.tsx`
**Tool ID:** `certificate`
**Features:**
- Types: Achievement, Completion, Award, Recognition, Participation, Training
- Sizes: A4 landscape, A4 portrait, Letter landscape
- Decorative borders (gold, silver, bronze, ornate, modern, minimal)
- Seal/stamp placement (circular embossed effect)
- Signature lines with title/role
- Serial number generation
- Batch generation (CSV import for names → multiple certificates)
- Templates: 8+ (academic, corporate, elegant, modern, achievement, training, sports, creative)
- AI: Generate certificate text from event details
- Export: PDF, PNG, batch PDF (all certificates in one file)

### Task 3.1.5 — Infographic Designer
**File:** New `src/components/workspaces/InfographicDesignerWorkspace.tsx`
**Tool ID:** `infographic`
**Features:**
- Canvas size: Tall vertical (800×2400), Standard (800×1200), Social (1080×1080), Wide (1920×1080)
- Section-based layout (stack sections vertically)
- Section types: Header, Statistics, Timeline, Process, Comparison, Chart, Icons, Quote, CTA, Footer
- Chart types: Bar, Pie, Donut, Line, Progress bars, Icon arrays
- Icon library integration (use `iconMap` icons as infographic elements)
- Color theme system (matches global themes)
- AI: Generate infographic data and layout from topic
- Export: PNG, PDF, SVG
- Templates: 8+ (statistical, timeline, process, comparison, list, how-to, geographic, resume)

### Task 3.1.6 — Menu Designer (Restaurant/Café)
**File:** New `src/components/workspaces/MenuDesignerWorkspace.tsx`
**Tool ID:** `menu-designer`
**Features:**
- Fold types: Single page, Bi-fold, Tri-fold
- Page sizes: A4, A5, Letter, Custom
- Section management: Appetizers, Mains, Desserts, Drinks, Specials, Custom
- Item entries: Name, description, price, dietary icons (V, VG, GF, DF, spicy levels)
- Multi-currency support (ZMW default)
- Photo placement per item
- Templates: 6+ (elegant, rustic, modern, bistro, fine-dining, casual)
- AI: Generate menu from cuisine type + restaurant description
- Export: PDF (print-ready), PNG

### Task 3.1.7 — Packaging & Label Designer
**File:** New `src/components/workspaces/PackagingDesignerWorkspace.tsx`
**Tool ID:** `packaging`
**Features:**
- Package types: Box (with die-cut template), Bottle label, Can wrap, Pouch, Bag
- Die-cut templates with fold lines and cut lines
- 3D preview of packaging (CSS 3D transforms)
- Barcode/QR code generation
- Nutrition facts template (for food packaging)
- Regulatory text zones
- Templates: 6+ (luxury, organic, tech, food, beverage, cosmetics)
- AI: Generate packaging design from product description
- Export: PDF (die-cut ready with crop marks), PNG, SVG

### Task 3.1.8 — Sticker & Label Designer
**File:** New `src/components/workspaces/StickerDesignerWorkspace.tsx`
**Tool ID:** `sticker-label`
**Features:**
- Shapes: Circle, Rectangle, Rounded Rectangle, Oval, Custom die-cut
- Sizes: Standard sticker sizes + custom dimensions
- Sheet layout (multiple stickers per sheet for printing)
- Cut line / safe zone overlay
- Templates: 8+ (product label, address label, price tag, decorative, promotional, QR code, barcode, badge)
- AI: Generate sticker design from product/event info
- Export: PDF (sheet layout), PNG (individual), SVG

---

## Wave 3.2 — Design Studio: Apparel & Merchandise

### Task 3.2.1 — T-Shirt & Apparel Designer
**File:** New `src/components/workspaces/ApparelDesignerWorkspace.tsx`
**Tool ID:** `tshirt-designer`
**Features:**
- Garment types: T-shirt, Hoodie, Cap, Tote Bag, Mug
- Print zones: Front, Back, Left sleeve, Right sleeve
- Garment colors: 12+ base colors (white, black, navy, red, gray, etc.)
- Design area constraints (printable zone per garment type)
- Mockup preview (design on garment 3D-ish view)
- Layer-based design area
- Templates: 6+ (typography, graphic, minimal, vintage, sporty, artistic)
- AI: Generate design from concept/theme
- Export: PNG (design only), PNG (mockup), PDF (print specifications)

### Task 3.2.2 — ID Card & Badge Designer
**File:** New `src/components/workspaces/IDCardDesignerWorkspace.tsx`
**Tool ID:** `id-card`
**Features:**
- Standard sizes: CR-80 (85.6×53.98mm — credit card size), custom
- Front and back editing
- Photo placeholder with crop/resize
- Barcode/QR code generation
- Fields: Name, title, ID number, department, validity dates, photo
- Security features: hologram overlay zone, serial numbers
- Batch generation (CSV → multiple cards)
- Templates: 6+ (corporate, student, visitor, employee, event, membership)
- AI: Generate card layout from organization info
- Export: PDF (print-ready), PNG

---

## Wave 3.3 — Design Studio: Marketing Collateral

### Task 3.3.1 — Coupon & Voucher Designer
**File:** New `src/components/workspaces/CouponDesignerWorkspace.tsx`
**Tool ID:** `coupon-voucher`
**Features:**
- Types: Discount coupon, Gift voucher, Event ticket
- Sizes: Standard coupon, ticket size, DL, custom
- Tear-off perforation line
- Unique code generation (for tracking)
- QR code with redemption URL
- Expiry date field
- Terms & conditions text area
- Templates: 6+ (retail, restaurant, spa, travel, gift, event)
- AI: Generate coupon/voucher from promotion details
- Export: PDF, PNG

### Task 3.3.2 — Calendar Designer
**File:** New `src/components/workspaces/CalendarDesignerWorkspace.tsx`
**Tool ID:** `calendar`
**Features:**
- Types: Wall calendar (12 months), Desk calendar, Planner, Poster calendar
- Year selection + start month
- Holiday markers (Zambian public holidays default + custom)
- Image area per month (photo calendar)
- Grid customization (Monday vs Sunday start)
- Templates: 4+ (photo, corporate, minimal, artistic)
- AI: Generate themed photo descriptions per month
- Export: PDF (all months), PNG (per month)

### Task 3.3.3 — Signage & Banner Designer (Physical)
**File:** New `src/components/workspaces/SignageDesignerWorkspace.tsx`
**Tool ID:** `signage`
**Features:**
- Sizes: Pull-up banner (850×2000mm), A-frame, Window decal, Billboard ratios, Custom
- High-res output (300 DPI calculations)
- Viewing distance indicator (text size recommendations)
- Safe zone for hardware mounting (grommet holes, pole pockets)
- Templates: 6+ (retail, event, directional, promotional, real estate, construction)
- AI: Generate signage from business/event details
- Export: PDF (high-res), PNG

---

## Wave 3.4 — Document & Print Studio: Business Documents

### Task 3.4.1 — Proposal Generator
**File:** New `src/components/workspaces/ProposalWorkspace.tsx`
**Tool ID:** `proposal`
**Features:**
- Multi-page document (cover, executive summary, scope, timeline, pricing, terms, appendices)
- Page navigation (thumbnail sidebar like Presentation)
- Section reordering via drag-drop
- Rich text editing per section (bold, italic, lists, headings)
- Pricing table with auto-calculations
- Timeline/milestone visualization
- Company branding header/footer
- Templates: 6+ (consulting, creative, technical, construction, marketing, general)
- AI: Generate full proposal from project brief
- Export: PDF (professional), DOCX

### Task 3.4.2 — Contract Builder
**File:** New `src/components/workspaces/ContractWorkspace.tsx`
**Tool ID:** `contract`
**Features:**
- Clause library (pre-written legal clauses: NDA, non-compete, payment terms, liability, IP ownership)
- Party details (Party A / Party B with full info)
- Signature blocks with date lines
- Clause reordering and toggling (include/exclude)
- Section numbering (auto-incrementing 1.1, 1.2, etc.)
- Templates: 6+ (service agreement, NDA, employment, freelance, partnership, sales)
- AI: Generate contract from deal description
- Export: PDF, DOCX
- Legal disclaimer: "Generated for reference — consult legal counsel"

### Task 3.4.3 — Quotation Generator
**File:** New `src/components/workspaces/QuotationWorkspace.tsx`
**Tool ID:** `quotation`
**Features:**
- Line items with quantity, unit price, total
- Subtotal, discount, tax (VAT 16% default), total calculations
- Validity period (e.g., "Valid for 30 days")
- Terms & conditions section
- Company branding (logo, address, contact)
- Client details section
- Quote numbering sequence
- Templates: 6+ (modern, classic, minimal, detailed, corporate, creative)
- AI: Generate quote from project description
- Export: PDF, PNG

### Task 3.4.4 — Report Generator
**File:** New `src/components/workspaces/ReportWorkspace.tsx`
**Tool ID:** `report`
**Features:**
- Multi-page: Cover, Table of Contents (auto-generated), Executive Summary, Body sections, Appendices
- Chart/graph insertion (bar, line, pie, donut from data input)
- Table insertion with styling
- Image insertion
- Page headers/footers with page numbers
- Templates: 6+ (annual report, project report, research, marketing, financial, progress)
- AI: Generate report from data points and topic
- Export: PDF, DOCX

### Task 3.4.5 — Receipt Generator
**File:** New `src/components/workspaces/ReceiptWorkspace.tsx`
**Tool ID:** `receipt`
**Features:**
- Standard receipt format (narrow + wide options)
- Line items with quantity, price, total
- Tax breakdown
- Payment method indicator
- Receipt numbering
- Company details
- Templates: 4+ (POS-style, professional, minimal, detailed)
- AI: Generate receipt from transaction details
- Export: PDF, PNG, thermal printer format

### Task 3.4.6 — Catalog / Product Sheet Designer
**File:** New `src/components/workspaces/CatalogWorkspace.tsx`
**Tool ID:** `catalog`
**Features:**
- Multi-page product catalog
- Product cards with: image, name, description, price, SKU
- Grid and list layout options per page
- Category sections with headers
- Index/table of contents auto-generation
- Templates: 6+ (fashion, electronics, food, furniture, automotive, jewelry)
- AI: Generate product descriptions from images/names
- Export: PDF (print-ready), digital flipbook view

---

## Wave 3.5 — Document & Print Studio: Sales Materials

### Task 3.5.1 — Sales Book Creator (A4)
**File:** New `src/components/workspaces/SalesBookA4Workspace.tsx`
**Tool ID:** `sales-book-a4`
**Features:**
- Multi-page A4 document with professional layout
- Page types: Cover, Introduction, Product pages, Features, Testimonials, Pricing, Contact, Back Cover
- Rich content per page (text, images, charts, tables)
- Page thumbnails sidebar with reorder
- Master page templates (header/footer consistency)
- Company branding throughout
- Templates: 6+ (corporate, creative, tech, luxury, industrial, services)
- AI: Generate sales book from company/product description
- Export: PDF (print-ready A4), digital view

### Task 3.5.2 — Sales Book Creator (A5)
**File:** New `src/components/workspaces/SalesBookA5Workspace.tsx`
**Tool ID:** `sales-book-a5`
**Features:** Same as A4 but adapted for A5 dimensions (148×210mm)
- Compact typography system
- Content reflowed for smaller format
- Shared logic with A4 (use shared base component)

### Task 3.5.3 — Price List Designer
**File:** New `src/components/workspaces/PriceListWorkspace.tsx`
**Tool ID:** `price-list`
**Features:**
- Categories with items (name, description, price, unit)
- Multi-column layout options
- Currency support (ZMW default)
- Effective date and validity
- Special offers/promotions highlight
- Templates: 4+ (clean, corporate, restaurant, services)
- AI: Generate price list from business type
- Export: PDF, PNG

---

## Wave 3.6 — Mockup Generator

### Task 3.6.1 — Device & Product Mockup Generator
**File:** New `src/components/workspaces/MockupGeneratorWorkspace.tsx`
**Tool ID:** `mockup-generator`
**Features:**
- Device mockups: iPhone, Android phone, iPad, Laptop, Desktop, Watch
- Product mockups: T-shirt, Mug, Tote bag, Business card, Book cover, Box
- Scene mockups: Office desk, Coffee shop, Billboard, Bus stop
- Upload design → auto-place on mockup with perspective transform
- Adjust: position, scale, rotation, shadow, reflection
- Multiple mockups in one scene
- Templates: 12+ mockup scenes
- AI: Suggest best mockup for design type
- Export: PNG (high-res), JPEG

---

## Deliverables Checklist — Phase 3
- [ ] 20+ new workspace components fully built
- [ ] All use shared shell components (no layout duplication)
- [ ] All layer-based workspaces use shared canvas engine
- [ ] All export to industry-standard formats (PDF, PNG, SVG, DOCX, HTML)
- [ ] All have AI content generation with revision support
- [ ] All have keyboard shortcuts registered in global registry
- [ ] All mobile-responsive (tab layout on small screens)
- [ ] All use UI primitives from `@/components/ui/`
- [ ] All support save/load project state
- [ ] Print tools have bleed, crop marks, safe zones
- [ ] Multi-page documents have page navigation + thumbnails
- [ ] Zambian locale defaults where applicable
