# DMSuite — Active Context

## Current Focus
**Phase:** Session 20 — Phase 1 Foundation Fortification Implementation

Session 20 implemented Phase 1 (Foundation Fortification) covering Waves 1.1–1.4, fixing critical bugs, eliminating code duplication, improving performance, and adding accessibility/keyboard navigation.

### Phase 1 Changes Implemented

#### Wave 1.1 — Critical Bug Fixes & Code Hygiene
- **`<a href>` → `<Link>`** — Replaced in 6 files: Sidebar, HeroBanner, QuickAccess, ToolCard, error, tools page
- **`min-h-screen` → `min-h-dvh`** — Fixed in loading.tsx, error.tsx, not-found.tsx
- **Loading skeleton width** — Fixed `w-60 xl:w-64` → `w-60` to match Sidebar
- **ThemeSwitch hover** — Fixed light-mode hover text `hover:text-gray-200` → `hover:text-gray-900`
- **HeroBanner search** — Fixed onBlur race condition (containerRef + relatedTarget)
- **Manifest + jsonld** — Updated "116+" to "250+"
- **Inline SVGs** — Replaced with `<IconRefresh>`, `<IconHome>` from shared icons
- **ToolCard** — Uses `<Link>` for ready, `<div>` for non-ready

#### Wave 1.2 — DRY & Code Consolidation
- **Color maps** — Consolidated to `@/lib/colors.ts` (`bgOpacity10`, `groupHoverBg10`)
- **Dynamic imports** — 12 workspace imports now use `next/dynamic`
- **Workspace lookup map** — Replaced if-chain with `workspaceComponents[toolId]`

#### Wave 1.3 — PWA & Mobile Fixes
- **viewportFit** — Added `viewportFit: "cover"` to layout.tsx

#### Wave 1.4 — Keyboard & Accessibility
- **Sidebar** — Added `aria-label="Main navigation"`
- **HeroBanner** — Arrow key nav, combobox ARIA, visual highlight
- **CommandPalette** — Fixed React 19 Compiler warnings

#### Lint Cleanup
- Fixed z-index bracket notation (4 files), break-words, flex-shrink-0, aspect ratios (2), unused imports

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
- ✅ **AI Chat workspace** — Model selector (Claude/GPT), streaming, conversation history
- ✅ **Logo Generator workspace** — 18 instant designs + AI, 6 styles, PNG+SVG export
- ✅ **Social Media Post workspace** — LAYER-BASED: AI Design Director with revision, 6 platforms, 12 compositions, device mockups
- ✅ **Brand Identity Kit workspace** — Canvas brand board, 8 palettes, 6 font pairings, 6 patterns
- ✅ **Business Card Designer workspace** — 6 layouts, front/back, 3 card styles, print-ready
- ✅ **Poster & Flyer Designer workspace** — LAYER-BASED: AI Design Director with revision, mockups
- ✅ **Banner Ad Designer workspace** — LAYER-BASED: AI Design Director with revision
- ✅ **Presentation Designer workspace** — REBUILT: 9 layouts, 8 themes, 3 aspect ratios, rich graphics, decorative elements, slide filmstrip, AI generation
- ✅ **Resume/CV Builder workspace** — REBUILT: 6 templates, 4 page sizes, skill bars + circles, overflow protection, Zambian defaults
- ✅ **Invoice Designer workspace** — REBUILT: 6 graphic templates, 3 page sizes, ZMW currency default, 16% VAT, overflow protection
- ✅ **Email Template workspace** — REBUILT: 6 templates, 6 themes, dynamic height, block-based content, proper containment
- ✅ **AI Image Analysis API** — Claude Vision for composition analysis
- ✅ **Stock Image Browser** — Routes 4 image tools
- ✅ Multi-AI API: Claude + OpenAI with auto-fallback
- ✅ Zustand stores: sidebar, chat, preferences (all persisted)
- ✅ 82 SVG icon components (70 in iconMap)
- ✅ 9 reusable UI primitives
- ✅ SEO, sitemap, robots, JSON-LD
- ⚠️ ~181 tools still show placeholder workspace (183 marked ready, only 12 implemented)
- ⚠️ Part-Edit / Consistency Engine not yet built
- ⚠️ Favicon/icon PNG files not generated
- ⚠️ Brand Identity Kit & Business Card not yet converted to layer-based architecture
- ⚠️ Interactive canvas editing (click-to-edit) not yet implemented in new workspaces
- ⚠️ No PDF export in any tool (critical gap for resume, invoice, presentation)
- ⚠️ No HTML export for email templates (critical gap)
- ⚠️ 3 layer-based workspaces share ~85% code (~5,600 lines duplication)
- ✅ All `<a href>` replaced with Next.js `<Link>` (Phase 1 Wave 1.1)
- ⚠️ No mobile bottom navigation bar
- ⚠️ No service worker (PWA incomplete)
- ⚠️ Workspaces don't use UI primitives from `@/components/ui/`
- ⚠️ Only 8 keyboard shortcuts total (need 30+)

## Next Steps (Priority Order — Follow PHASES/ Documents)
1. **Phase 1: Foundation Fortification** — Fix bugs, DRY, PWA, mobile nav, shortcuts
2. **Phase 2: Rebuild Existing Tools** — Canvas engine, AI revision, proper exports
3. **Phase 3: New Design & Document Tools** — 20+ new workspaces
4. **Phase 4: Video/Audio/Content/Marketing/Web** — Complete all studios
5. **Phase 5: Platform Maturity & Launch** — Auth, DB, payments, deployment

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
