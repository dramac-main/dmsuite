# DMSuite — Active Context

## Current Focus
**Phase:** Phase 1 + Phase 2 + Phase 3 + Phase 4 COMPLETE — All workspaces implemented

Session implemented ALL Phase 3 (Design & Document Studio — codename "Arsenal") and ALL Phase 4 (Video, Audio, Content, Marketing & Web Studios — codename "Full Spectrum"). Build passes with zero TypeScript errors.

### Phase 1 Completed (Foundation Fortification)
- Wave 1.1: Bug fixes, Link migration, skeleton fixes, manifest updates
- Wave 1.2: DRY refactoring, WorkspaceShell, CanvasWorkspaceShell, color maps
- Wave 1.3: Dynamic imports, Suspense, debounce, z-index scale
- Wave 1.4: PWA manifest, service worker, MobileBottomNav, mobile sidebar, InstallPrompt
- Wave 1.5: Shortcuts registry, global shortcuts, canvas shortcuts, ShortcutsHelpModal
- Wave 1.6: Skip-to-content, focus trap in Modal, accessibility audit

### Phase 2 Completed (Existing Tools Rebuild)
- Wave 2.1–2.9: Canvas infrastructure, AI revision engine, all 12 workspace rebuilds

### Phase 3 Completed (New Tool Workspaces — Design & Document Studio)
- Wave 3.1: Print & Stationery — Brochure, Letterhead, Envelope, Certificate, Infographic, Menu, Packaging, Sticker (8 workspaces)
- Wave 3.2: Apparel & Merchandise — Apparel/T-shirt, ID Card/Badge (2 workspaces)
- Wave 3.3: Promotional — Coupon/Gift Voucher, Calendar, Signage (3 workspaces)
- Wave 3.4: Business Documents — Proposal, Contract, Quotation, Report, Receipt, Catalog (6 workspaces)
- Wave 3.5: Sales Materials — Sales Book A4, Sales Book A5, Price List (3 workspaces)
- Wave 3.6: Mockups — Mockup Generator (1 workspace)

### Phase 4 Completed (Video, Audio, Content, Marketing & Web Studios)
- Wave 4.1: Video & Motion — Video Editor, AI Video Generator, Logo Reveal, Subtitle Generator, GIF Maker, Thumbnail, Motion Graphics, Video Compressor (8 workspaces)
- Wave 4.2: Audio & Voice — Text-to-Speech, Voice Cloner, Podcast Tools, Music Generator, Transcription (5 workspaces)
- Wave 4.3: Content Writing — Blog Writer, Social Copy, Email Copy, Product Description, Content Calendar, SEO Optimizer (6 workspaces)
- Wave 4.4: Marketing & Sales — Landing Page, Sales Funnel, Lead Magnet, Email Sequence, QR Code, Analytics Dashboard (6 workspaces)
- Wave 4.5: Web & UI Design — Wireframe, UI Component, Color Palette, Icon Generator (4 workspaces)
- Wave 4.6: Utilities — File Converter, Batch Processor, Background Remover, Image Enhancer, PDF Tools (5 workspaces)

### Phase Documents (PHASES/ directory)
- `MASTER-PLAN.md` — Overview, dependencies, success metrics, standards
- `PHASE-1_FOUNDATION-FORTIFICATION.md` — Bug fixes, DRY, performance, PWA, mobile nav, shortcuts, accessibility
- `PHASE-2_EXISTING-TOOLS-REBUILD.md` — Canvas engine upgrade, AI revision engine, rebuild all 12 workspaces
- `PHASE-3_NEW-TOOLS-DESIGN-DOCUMENTS.md` — 20+ new Design & Document studio workspaces
- `PHASE-4_VIDEO-AUDIO-CONTENT-MARKETING-WEB.md` — Video, Audio, Content, Marketing, Web, Utilities studios
- `PHASE-5_PLATFORM-MATURITY-LAUNCH.md` — Supabase, auth, collaboration, payment, deployment

## Recent Changes (Session 18 — Workspace Quality Overhaul)

### HeroBanner.tsx — z-index fix
- Added `z-20` to `<section>` element to fix search dropdown being hidden behind dashboard content

### ResumeCVWorkspace.tsx — REBUILT (~1697 lines)
- 4 page sizes: A4 (595×842), US Letter (612×792), A5 (420×595), Legal (612×1008)
- 6 templates: Clean, Sidebar, Executive, Creative, Compact, Infographic (replaced "Academic")
- SkillEntry type with name + level (0-100) for skill bars
- Skill bars with percentage indicators + circular proficiency charts (infographic template)
- Timeline dots, decorative accent shapes, dot patterns, gradient headers
- Content overflow protection via maxY boundary checking throughout
- Word-wrap with page clipping (wrapClip function)
- Zambian locale defaults (phone: +260, location: Lusaka, Zambia)
- Helpers: safeText, wrapClip, sectionHeader, drawSkillBar, drawSkillCircle, drawAccentShapes, renderExperience, renderEducation, roundRect, lighten
- Non-null assertion on getContext("2d") for TypeScript nested function narrowing

### InvoiceDesignerWorkspace.tsx — REBUILT (~1294 lines)
- 3 page sizes: A4 (595×842), US Letter (612×792), Legal (612×1008)
- 7 currencies: ZMW (K, Zambian Kwacha — default), USD, GBP, EUR, ZAR, KES, NGN
- 6 graphic-rich templates: Modern (gradient header + circle), Classic (centered business), Minimal (clean whitespace), Bold (left color strip + rotated INVOICE text), Elegant (thin border frame, serif), Corporate (header bar + dot grid)
- Shared drawItemTable() with zebra striping, proper column alignment
- drawAddresses(), drawInvoiceMeta() helpers
- 16% VAT default (Zambian standard), fmtMoney() currency formatter
- Content overflow protection via maxY boundary
- Zambian AI prompt defaults (Plot addresses, +260 phones, ZMW values)
- Non-null assertion on getContext("2d")

### EmailTemplateWorkspace.tsx — REBUILT (~901 lines)
- 6 templates: Newsletter, Promotional, Transactional, Welcome, Announcement, Minimal
- 6 themes: Light, Dark, Branded, Elegant, Modern, Bold — each with proper color schemes
- Dynamic canvas height based on content block estimation
- Content blocks: heading, text, button, divider, image, spacer
- Proper block rendering with word-wrap, per-block alignment (left/center/right)
- Card body background with destination-over compositing
- Hero headers for promotional/welcome/announcement templates
- Decorative gradient headers, circles
- Footer with unsubscribe/preferences links
- Width slider (400-700px)
- Zambian defaults in footer + AI prompts
- Fixed TypeScript type narrowing error in block editor (text||heading branch)
- Non-null assertion on getContext("2d")

### PresentationWorkspace.tsx — REBUILT (~1061 lines)
- 3 aspect ratios: 16:9 (960×540), 4:3 (720×540), 16:10 (900×562)
- 8 themes: Midnight, Corporate, Ocean, Sunset, Forest, Monochrome, Rosé, Neon
- 9 slide layouts: Title, Content, Bullets, Two Column, Image Left, Image Right, Quote, Section Break, Blank
- 4 font styles: Modern, Classic, Bold, Minimal
- Rich canvas rendering per layout with decorative elements:
  - Corner circles, dot grids, accent bars, gradient backgrounds
  - Numbered bullet circles, vertical dividers for two-column
  - Image placeholders with icon + rounded borders
  - Large decorative quotation marks for quote layout
  - Section break gradient overlay
- Slide number display + bottom accent line
- Content overflow protection (safeText + wrapText functions)
- Slide CRUD: add/delete, filmstrip with thumbnails showing theme colors
- Speaker notes per slide (not rendered on canvas)
- AI generation via /api/chat with Zambian locale context
- Navigation arrows + slide counter
- Export single slide as PNG
- Non-null assertion on getContext("2d")

### Build Status
- ✅ `next build` compiles successfully with zero TypeScript errors
- ✅ 10 routes generated
- ✅ TypeScript strict mode passing

## Current State of the App
- ✅ Dashboard at `/dashboard` with 250+ AI tools
- ✅ **Command Palette** — Cmd+K global search, theme toggle fixed
- ✅ **AI Chat workspace** — Full react-markdown, message editing/regeneration, export (MD/JSON/TXT), system prompts, stop generation, token display, conversation search
- ✅ **Logo Generator workspace** — 18 instant designs + AI, SVG sanitization, transparent PNG, PDF logo sheet, keyboard shortcuts
- ✅ **Social Media Post workspace** — LAYER-BASED: AI Design Director, hashtag generator, character counts, carousel mode
- ✅ **Brand Identity Kit workspace** — PDF brand guidelines, SVG export, WCAG accessibility checker, tone of voice, brand kit save/load
- ✅ **Business Card Designer workspace** — QR code, print bleed/safe zones, PDF with crop marks, custom dimensions, side-by-side preview
- ✅ **Poster & Flyer Designer workspace** — LAYER-BASED: print bleed, safe zones, PDF export, QR code, grid overlay
- ✅ **Banner Ad Designer workspace** — LAYER-BASED: HTML5 export, click-through URL, file size indicator, ad compliance checker, mockup frames
- ✅ **Presentation Designer workspace** — PPTX export, PDF export, slideshow mode, slide management, image upload, chart placeholders
- ✅ **Resume/CV Builder workspace** — PDF export (jsPDF), ATS scoring, section reorder, custom sections
- ✅ **Invoice Designer workspace** — PDF export, line item reorder, payment terms, discounts, bank details
- ✅ **Email Template workspace** — HTML export (table-based), mobile preview, merge tags, copy HTML, plain text version
- ✅ **Stock Image Browser** — Collections/boards, color search, orientation filter, favorites
- ✅ Multi-AI API: Claude + OpenAI with auto-fallback
- ✅ Zustand stores: sidebar, chat, preferences, revision-history (all persisted)
- ✅ 82+ SVG icon components (70+ in iconMap)
- ✅ 9 reusable UI primitives
- ✅ SEO, sitemap, robots, JSON-LD
- ✅ PWA: manifest, service worker, install prompt, mobile bottom nav
- ✅ Keyboard shortcuts: global, canvas, workspace-specific
- ✅ Accessibility: skip-to-content, focus traps, ARIA attributes
- ✅ Canvas infrastructure: UUID layers, serialization, multi-selection, snapping, viewport/zoom, alignment
- ✅ AI revision engine with style locking
- ⚠️ ~181 tools still show placeholder workspace
- ⚠️ Part-Edit / Consistency Engine not yet built
- ⚠️ Favicon/icon PNG files not generated

## Next Steps (Priority Order — Follow PHASES/ Documents)
1. **Phase 3: New Design & Document Tools** — 20+ new workspaces (PHASES/PHASE-3)
2. **Phase 4: Video/Audio/Content/Marketing/Web** — Complete all studios (PHASES/PHASE-4)
3. **Phase 5: Platform Maturity & Launch** — Auth, DB, payments, deployment (PHASES/PHASE-5)

## Active Decisions
- **Foundation art vs layers** — Background design elements (hero shapes, accent bars, glass cards, geometric decorations) render directly on canvas context via `renderCompositionFoundation()` — they are NOT Layer objects, NOT selectable, NOT in the layer panel. Only content (text, CTA, template decorations) are interactive layers.
- **Zone x interpretation** — In CompositionTemplates, zone `x` values represent CENTER point for center-aligned zones. `generateLayoutLayers()` converts: `x = (zone.x - zone.width/2) * canvasWidth` for center alignment.
- **Canvas render pipeline** — 5-stage: (1) Background fill/image → (2) Foundation art → (3) Document layers back-to-front → (4) Selection handles → (5) Watermark/border
- **AI Design Director** — AI generates FULL design (composition + colors + fonts + intensity + copy), not just text. Applied as single config update that triggers layer regeneration
- **Visual intensity levels** — 0 (minimal/clean) to 3 (maximal/dramatic). Controls number of shape layers, decorative elements, and visual effects
- **Composition-specific hero shapes** — Each of 12 composition types gets unique gradient panels, orbs, sidebar panels, stripes, glass cards
- **Layer-based scene graph** — All canvas workspaces use DesignDocument → Layer[] → renderLayer() → hitTest → drawSelectionHandles architecture
- **Shared infrastructure** — canvas-utils.ts, canvas-layers.ts, design-foundation.ts eliminate code duplication
- **Design foundation rules** — 16 composition types, 28 export formats, 6 device mockups guide all layout generation
- **Factory function pattern** — base defaults → `...partial` → explicit overrides with `as const` type literals
- **Interactive editing** — All canvases support select/drag/resize with undo/redo stacks, keyboard shortcuts (Del, Ctrl+Z/Shift+Z, Ctrl+D)
- **Multi-format export** — renderToSize() scales any DesignDocument to any export format dimensions
- **3-tab workspace UI** — Design (canvas) / Export All Sizes (format grid) / Client Preview (device mockups)
- **clean() / cleanAIText()** pattern — All AI text extraction strips markdown artifacts
- **Instant client-side SVG generation** — useMemo generates variants live, AI is additive
- **Model selector in Chat** — Simple toggle, sends provider to API route
- **CVA + cn() pattern** for all UI components
- **Multi-provider AI** — Claude primary, OpenAI secondary, auto-fallback
- **Workspace pattern** — Each tool gets its own workspace component, routed via toolId switch
- **Safe color lookup maps** — Never use template literals for dynamic Tailwind classes
- **No database yet** — Supabase planned
- **No auth yet** — Planned
