# DMSuite — Active Context

## Current Focus
**Phase:** Phases 1–4 PARTIAL — 96 tools routed with dedicated workspaces, 98 tools still need building

### Actual State (Session 24 Updated)
- **194 total tools** defined in tools.ts
- **96 tools** have dedicated workspace routes in page.tsx → status: "ready"  
- **~90 tools** have NO workspace → status: "coming-soon"
- **8 tools** have NO workspace → status: "beta"
- **93 workspace component files** exist in `src/components/workspaces/`
- Build passes with zero TypeScript errors
- All workspaces now use global Accordion component (no more local Section+Set<string>)
- AI Design Engine v2.0 — massively upgraded with 13 sections, 60+ exports

## Recent Changes (Session 26 continued — AI Icon Placement Pipeline)

### Icon Library Enrichment — All 115 Icons Now AI-Ready

#### 1. Rich Descriptions Added to Every Icon
- Added `description: string` field to `IconMeta` interface
- Every single icon now has a 1-2 sentence natural language description covering:
  - **Visual form**: What the icon actually looks like (e.g., "Paper airplane / send arrow pointing right")
  - **Use cases**: When to use it (e.g., "Use for send buttons, submit actions, email sending")
  - **Industries/contexts**: What domains it serves (e.g., "customer support, business messaging")

#### 2. Tags Expanded from 3-5 → 15 Per Icon
- Every icon now has 15 rich tags covering synonyms, related concepts, industry terms, and natural language phrases
- Example: "phone" went from `["call", "telephone", "dial"]` to `["call", "telephone", "dial", "ring", "mobile", "cell", "contact", "support", "hotline", "customer-service", "number", "receiver", "landline", "voicemail", "business-card"]`

#### 3. AI Icon Placement Pipeline (NEW)
- **`AIIconPlacement` interface**: `{ iconId, x, y, size, color }` — tells the system exactly WHERE to draw an icon
- **`drawIconPlacements(ctx, placements[])`**: Renders an array of AI-specified icon placements onto canvas
- **`matchIconsForContext(userText, maxResults)`**: Semantic matching — scores icons by query word overlap, returns top N
- Both `buildGraphicDesignPrompt()` and `buildRevisionPrompt()` now include `"iconPlacements"` in their JSON response schemas
- AI can now specify: which icons, at what position, what size, what color

#### 4. Enhanced Search & AI Functions
- **`searchIcons(query)`**: Now searches across id, label, tags, AND description (full-text, all-words-must-match)
- **`getIconListForAI()`**: Now includes full descriptions so the AI understands each icon's visual form and use cases
- **`getIconListForAICompact()`**: New compact version (IDs + labels only) for token-constrained prompts

### Previous Session 26 Work (Icon Library Creation)

#### 1. New File: `src/lib/icon-library.ts` (~1,200 lines)
- **115 professional vector icons** drawn with pure Canvas2D path commands (no emoji, no text)
- **8 categories**: Social Media (20), Contact & Communication (15), Business & Professional (20), Creative & Design (15), Technology & Web (15), Nature & Lifestyle (10), Arrows & UI (10), Commerce & Finance (10)
- All icons normalized to a 24×24 design grid, infinitely scalable at any DPI
- Consistent API: `drawIcon(ctx, iconId, x, y, size, color, strokeWidth?)`
- Full metadata registry: `ICON_BANK` array with id, label, category, tags per icon
- O(1) lookup: `ICON_REGISTRY` record keyed by icon id → draw function
- AI-ready helpers: `getIconListForAI()`, `searchIcons(query)`, `getAllIconIds()`, `getIconsByCategory()`
- Browsable: `ICON_CATEGORIES` constant with id, label, description, count
- Zero external dependencies — standalone module

#### 2. BusinessCardWorkspace Integration
- Replaced 4 individual icon imports (drawPhoneIcon, drawEmailIcon, drawGlobeIcon, drawLocationIcon) with single `drawIcon()` from icon library
- `drawContactIcon()` dispatcher now maps to icon library IDs: email→"email", phone→"phone", website→"globe", address→"map-pin"
- Phone icon upgraded from **emoji 📱** to professional vector handset path

#### 3. Graphics Engine Legacy Wrappers
- Old `drawPhoneIcon/drawEmailIcon/drawGlobeIcon/drawLocationIcon` in graphics-engine.ts now delegate to icon library
- Marked as `@deprecated` — new code should import from `@/lib/icon-library` directly

#### 4. AI Engine Icon Awareness
- `buildGraphicDesignPrompt()` in graphics-engine.ts now injects the full icon catalog into AI prompts
- `buildRevisionPrompt()` in ai-revision.ts now includes icon library for AI revision suggestions
- AI can now reference any of 115 icons by ID when designing or revising

### Previous Session (Session 25 — BusinessCardWorkspace Quality Overhaul)

#### 1. Per-Template Default Color Themes (TEMPLATE_DEFAULT_THEMES)
- **Each of 20 templates now has its OWN unique default color scheme**, applied automatically on selection
- Diverse palette variety: ~7 light backgrounds, ~13 dark backgrounds with completely different accents
- Minimal templates: light, airy (white/linen/cream/ice-blue backgrounds)
- Modern templates: dark, vibrant (neon green on black, purple on charcoal, coral on navy)
- Classic templates: rich, traditional (gold on cream, burgundy, navy/blue)
- Creative templates: vivid, playful (magenta/teal/coral accents)
- Luxury templates: opulent (gold on near-black, marble white, deep red)
- Template thumbnails now show each template's OWN colors (not user's current palette)
- Default initial config changed from all-dark to Executive Clean light theme

#### 2. AI Revision Engine — Deep Reasoning + Hard Scope Enforcement
- **Chain-of-thought reasoning prompt**: Requires AI to think step-by-step before answering
- **Hard scope enforcement in code**: `SCOPE_ALLOWED_FIELDS` map strips unauthorized field changes regardless of AI response
- **Diff validation**: Only applies changes where value actually differs from current design
- Prompt explicitly tells AI which fields are allowed per scope and that unauthorized fields are rejected
- 3-step post-processing pipeline: Validate → Scope-enforce → Diff-check

#### 3. High-Resolution Export (600 DPI / 2x Scale)
- Added `scale` parameter to `renderCard()` function (default=1 for display, 2 for export)
- Added `scale` parameter to `renderBatchCard()` function
- All exports now render at 2x resolution:
  - PNG download: 2100×1200px for US Standard (was 1050×600)
  - PDF export: 2x canvas embedded at exact mm dimensions
  - Clipboard copy: 2x resolution
  - Batch PDF: 2x for all cards
- QR overlay uses logical dimensions to prevent double-scaling
- Card info display updated to show "600 DPI" export quality

#### 4. Enhanced Template Visuals
- Executive Clean: warm gradient wash, refined gradient accent bar, secondary accent dot
- Bold Split: richer gradient panel (3-stop), decorative boundary lines, subtle accent circles, tagline support
- Neon Edge: triple-layer glow effect, corner glow, decorative scan lines, logo glow effect

### Previous Session (Session 24 — BusinessCardWorkspace Complete Overhaul)
- Full 2700-line production rewrite with 20 professional templates
- AI Design Director + AI Revision Engine + Batch Processing
- 5 card back styles, 12 color presets, 9 patterns, 5 card sizes
- Logo upload, print-ready export, side-by-side preview
- US Standard (3.5×2"), EU/ISO (85×54mm), Japan (91×55mm), Square, Rounded, Custom (mm input)

#### Additional Features
- 12 color presets (Lime Pro, Navy, Charcoal, Midnight, Gold Rush, Forest, Ocean, White Linen, Burgundy, Slate, Coral, Sage)
- 9 pattern options (dots, lines, diagonal, crosshatch, waves, hexagons, chevrons, diamond)
- Logo upload (file + URL) with fallback initials (circle/square shapes)
- Side-by-side front/back preview
- Contact icons toggle
- QR code placeholder
- Template category filtering (All/Minimal/Modern/Classic/Creative/Luxury)
- TemplateSlider with visual canvas-rendered previews

## Previous Session Changes (Session 23 — Accordion Migration + AI Design Engine v2.0)

### AI Design Engine v2.0 (`src/lib/ai-design-engine.ts`)
Complete rewrite from 708 lines → 1200+ lines with 13 major sections:
1. **Color Science** — HSL conversion, WCAG contrast, accessible palettes, harmony generators (complementary/analogous/triadic/split-complementary/tetradic), color mixing
2. **Typography** — Modular-scale type ramp with configurable ratio, optimal line-height/letter-spacing
3. **Layout & Grid** — Column-based grid system, golden-ratio split, baseline snapping, safe areas
4. **Spacing & Rhythm** — Proportional spacing system (xxs→xxxl + section)
5. **Drawing Helpers** — 10 header styles (gradient/solid/diagonal/split/minimal/wave/angular/radial/duotone/stripe), pro text with underline/strikethrough/ellipsis/shadow, 8 divider styles (solid/gradient/dashed/dots/ornate/double/groove/wave), tables with rowBgFn/highlightLast, badges, cards with accent bars, pull quotes, stat callouts, icon circles, 5 bullet list styles, progress bars
6. **Decorative** — Corner flourishes (4 styles), seals/rosettes, dot patterns, stripe patterns, noise texture overlay
7. **Print Production** — Crop marks, registration marks, CMYK colour bars, slug lines
8. **Stock Images** — Search API, draw with cover-fit, gradient-fade overlays
9. **Watermarks** — Single diagonal + tiled repeating patterns
10. **Export** — 4 presets (72/150/300/600 DPI), high-res re-render
11. **Design-Decision System** — Mood-based suggestions for headers, dividers, fonts, bullets, corners, margins
12. **Visual Hierarchy** — Automatic weight computation for title/subtitle/heading/body/caption/stat
13. **Page Renderers** — Backgrounds with texture, footers with 3 styles, section headings with numbering

### Accordion Migration (7 workspaces migrated)
Replaced old `Set<string>` + local `Section` component pattern with global `Accordion` + `AccordionSection`:
- CertificateDesignerWorkspace ✅
- BusinessCardWorkspace ✅
- BrandIdentityWorkspace ✅ (2 Accordion instances — left/right panels)
- BannerAdWorkspace ✅ (2 Accordion instances — left/right panels)
- MenuDesignerWorkspace ✅ (dynamic label preserved)
- PosterFlyerWorkspace ✅ (inline SVG icon preserved)
- SocialMediaPostWorkspace ✅ (2 Accordion instances — left/right panels)

### Agent-Built Workspace Spot-Check (3/19 checked)
- CoverLetterWorkspace: Good quality ✅
- WhitePaperWorkspace: Very good quality ✅ (Math.random flicker noted)
- MediaKitWorkspace: Very good quality ✅ (Math.random flicker noted)

## Previous Session Changes (Session 22 — Document & Business Tools Mass Build)

### 24 New Workspace Files Created
Built complete, production-ready document/business tool workspaces:

**Directly Created (5 hand-built workspaces):**
1. **DiplomaDesignerWorkspace** — Formal diploma/certificate with ornate borders, seal, signature lines, corner decorations. 6 templates (classic/elegant/modern/university/ornate/executive), gold accent picker, orientation toggle.
2. **StatementOfAccountWorkspace** — Financial statement with transaction table, running balance, debit/credit columns, closing balance callout, payment status indicator. Editable transaction rows.
3. **NewsletterPrintWorkspace** — Multi-page newsletter with masthead, info bar, hero story area, article grid, 2-page support. Stock image integration for hero.
4. **EmployeeHandbookWorkspace** — Multi-page handbook with cover + chapters. Chapter management (add/remove/edit), creative/professional templates, page navigation.
5. **JobDescriptionWorkspace** — Professional JD with responsibilities, requirements, benefits lists (all editable). Employment type badge, info strip, salary display.

**Agent-Built (19 workspaces):**
6. **LookbookWorkspace** — Fashion lookbook with cover + product pages, price/item code, editorial layouts
7. **LineSheetWorkspace** — Wholesale line sheet with 2×2 product grid, wholesale/retail/MOQ pricing
8. **RealEstateListingWorkspace** — Property feature sheet with specs, agent info
9. **EventProgramWorkspace** — Multi-session event program with schedule
10. **TicketDesignerWorkspace** — Event ticket with barcode area, tear-off stub
11. **CoverLetterWorkspace** — Professional cover letter with AI body generation
12. **InvitationDesignerWorkspace** — Event invitations (wedding/corporate/party)
13. **TrainingManualWorkspace** — Multi-page training manual with chapters
14. **UserGuideWorkspace** — Documentation/user guide with TOC, numbered steps
15. **WorksheetDesignerWorkspace** — Printable worksheets/forms with fields
16. **WhitePaperWorkspace** — Professional white paper with sections
17. **CaseStudyWorkspace** — Case study with challenge/solution/results format
18. **MediaKitWorkspace** — Press/media kit with stats, contacts, brand assets
19. **EbookCreatorWorkspace** — eBook with cover + chapters, pull quotes
20. **PortfolioBuilderWorkspace** — Creative portfolio with project showcase
21. **GreetingCardWorkspace** — Cards (birthday/thankyou/holiday)
22. **CalendarDesignerWorkspace** — Already existed, verified
23. **CompanyProfileWorkspace** — Already existed, verified
24. **BusinessPlanWorkspace** — Already existed, verified

### Route Updates
- Added 24 new dynamic imports to `page.tsx` tool workspace router
- All new workspaces properly linked: `id → Component`

### Tool Status Updates
- 24 tools changed from "coming-soon" to "ready" in `tools.ts`

### Bug Fixes
- Renamed `useStockImages.ts` → `useStockImages.tsx` (file contained JSX)
- Fixed `IconDollarSign` → `IconBriefcase` (icon didn't exist)
- Fixed `StockImagePanel` prop usage (removed invalid `stockImages` prop)
- Fixed `generateColorPalette()` object indexing (was using array-style `[1]`)
- Removed unused hook imports across 4 workspaces

### Phase 1 Completed (Foundation Fortification) ✅
- Wave 1.1–1.6: Bug fixes, DRY, performance, PWA, shortcuts, accessibility

### Phase 2 Completed (Existing Tools Rebuild) ✅
- Wave 2.1–2.9: Canvas infrastructure, AI revision engine, all 12 workspace rebuilds

### Phase 3 PARTIAL (New Design & Document Workspaces)
- **Document/Business tools: COMPLETE** — All 38 document tools now have workspaces ("ready")
- Other categories still have ~90 tools with no workspace

### Phase 4 PARTIAL (Video, Audio, Content, Marketing, Web)
- Workspace files exist but many are incomplete shells
- Video/audio workspaces are mostly non-functional

## Session 22 Infrastructure Created

### Global Accordion Component (`src/components/ui/Accordion.tsx`)
- Single-open behavior enforced via React Context
- `Accordion` root + `AccordionSection` children + `useAccordion` hook
- Exported via `src/components/ui/index.ts` barrel

### AI Design Engine (`src/lib/ai-design-engine.ts`) — v2.0
Complete professional design-decision engine. 1200+ lines, 60+ exports.
- **Color Science**: `hexToHsl`, `hslToHex`, `contrastRatio`, `getContrastText`, `ensureContrast`, `generateColorPalette`, `generateHarmony`, `mixColors`
- **Typography**: `getTypographicScale`, `optimalLineHeight`, `optimalLetterSpacing`
- **Layout**: `createLayoutGrid`, `columnX`, `snapToBaseline`, `goldenSplit`
- **Spacing**: `createSpacingSystem` (xxs→xxxl)
- **Drawing**: `drawHeaderArea` (10 styles), `drawProText` (with underline/strikethrough/ellipsis), `drawProDivider` (8 styles), `drawTable`, `drawBadge`, `drawImagePlaceholder`, `drawCard`, `drawPullQuote`, `drawStatCallout`, `drawIconCircle`, `drawBulletList` (5 styles), `drawProgressBar`
- **Decorative**: `drawCornerFlourishes` (4 styles), `drawSeal`, `drawDotPattern`, `drawStripePattern`, `drawNoiseOverlay`
- **Print**: `drawCropMarks`, `drawRegistrationMark`, `drawColorBars`, `drawSlugLine`
- **Stock**: `searchStockImages`, `drawStockImage`, `drawImageWithGradientOverlay`
- **Watermarks**: `drawWatermark`, `drawTiledWatermark`
- **Export**: `EXPORT_PRESETS`, `exportHighRes`
- **Design Decisions**: `suggestHeaderStyle`, `suggestDividerStyle`, `suggestFontStyle`, `suggestBulletStyle`, `suggestCornerStyle`, `suggestMargin`, `computeHierarchy`
- **Page Renderers**: `drawPageBackground`, `drawPageFooter`, `drawSectionHeading`
- **Types**: `DesignBrief`, `DesignMood` (12 moods), `DesignElement`, `DesignComposition`, `HeaderStyle`, `DividerStyle`, `ProTextOpts`, `TableColumn`, `TableOpts`, `CardOpts`, `ExportSettings`
- **NOTE:** `generateColorPalette()` returns an OBJECT with keys: primary, primaryLight, primaryDark, primaryMuted, primarySubtle, primaryVivid, tint50→tint900, textDark, textMedium, textLight, textOnPrimary, white, offWhite, lightGray, mediumGray, borderGray, success, warning, error, info

### Stock Image Hook (`src/hooks/useStockImages.tsx`)
- `useStockImages()` hook: manages search query, results, loading state
- `StockImagePanel` component: self-contained search UI with grid thumbnails
- Props: `{ onSelect: (image: StockImage) => void; className?: string }` — NO `stockImages` prop
- `StockImage` type: `{ id, urls: { thumb, regular, full }, description, ... }`

## Previous Session Changes
- Session 21: MotionGraphics rebuilt (900+ lines), CalendarDesigner rebuilt (700+ lines)
- Session 20: VideoEditor & TextToSpeech rebuilt, full 69-workspace audit
- Session 19: Fake routes removed, LogoReveal & AIVideoGenerator rebuilt

## Workspace Quality Audit Results

### SOLID — Production Quality (~44 workspaces)
Design tools: SocialMediaPost, BannerAd, PosterFlyer, ResumeCV, BusinessCard, Invoice,
Presentation, BrandIdentity, LogoGenerator, EmailTemplate, MenuDesigner, Certificate,
Infographic, Packaging, Sticker, Brochure, Apparel, Letterhead, Envelope,
Catalog, Contract, Coupon, IDCard, MockupGenerator, PriceList, Proposal,
Quotation, Receipt, Report, SalesBookA4, SalesBookA5, Signage, Thumbnail, Wireframe

Utility/content tools: AIChatWorkspace, AnalyticsDashboard, BlogWriter, ColorPalette,
ContentCalendar, EmailCopy, EmailSequence, IconGenerator, ProductDescription,
QRCode, SEOOptimizer, SocialCopy, StockImageBrowser, UIComponent

### NEEDS ENHANCEMENT (~15 workspaces)
These are functional but simulate backend processing:
BackgroundRemover, BatchProcessor, FileConverter, GifMaker, ImageEnhancer,
LandingPage, LeadMagnet, MusicGenerator,
PDFTools, PodcastTools, SalesFunnel, SubtitleGenerator, Transcription,
VideoCompressor, VoiceCloner

### REBUILT THIS SESSION (6 workspaces total, Sessions 19-21)
VideoEditor, TextToSpeech, LogoReveal, AIVideoGenerator, MotionGraphics, CalendarDesigner

## Next Steps (Priority Order)
1. **Spot-check remaining agent-built workspaces** — 16 of 19 still unchecked
2. **Fix Math.random() flicker** — WhitePaper + MediaKit use random values in render (causes flickering decorative elements)
3. **Enhance remaining thin workspaces** — 15 needs-enhancement workspaces (mostly simulated backends)
4. **Build missing tools (~90)** — Across design, video, audio, content-writing, marketing, web-ui, utilities categories
5. **Backend integrations** — Real video/audio/PDF processing (requires server)
6. **Phase 5: Platform Maturity** — Auth, DB, payments, deployment

## Active Decisions
- **Tool-by-tool approach** — No shortcuts, no routing tools to wrong workspaces
- **Quality over speed** — Each tool must have proper functionality
- **Stock images** — Must integrate `/api/images` in design workspaces
- **Print-ready exports** — PDFs with crop marks, high-res PNGs, editable SVGs
- **AI generates real content** — Not placeholder text
- **Canvas render pipeline** — 5-stage: Background → Foundation → Layers → Selection → Watermark
- **Layer-based scene graph** — DesignDocument → Layer[] architecture
- **Shared infrastructure** — canvas-utils.ts, canvas-layers.ts, design-foundation.ts
- **Multi-provider AI** — Claude primary, OpenAI secondary, auto-fallback
- **No database yet** — Supabase planned (Phase 5)
