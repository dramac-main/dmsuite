# DMSuite — Progress Tracker

## Overall Status: Session 20 — Phase 1 Foundation Fortification Implemented (Waves 1.1–1.4)

---

## What's Done

### Infrastructure
- [x] Next.js 16.1.6 project scaffolded with Turbopack
- [x] TypeScript strict mode configured
- [x] Tailwind CSS v4 with `@theme inline` design tokens
- [x] PostCSS + Tailwind plugin configured
- [x] ESLint configured
- [x] Dev server on port 6006
- [x] Memory Bank system initialized
- [x] ROADMAP.md created (quarterly phases through 2027)

### Production Dependencies
- [x] framer-motion (animations)
- [x] zustand (state management — stores pending)
- [x] clsx + tailwind-merge (`cn()` utility)
- [x] class-variance-authority (component variants)

### Design System
- [x] Color tokens (primary, secondary, gray, semantic, accents) — Tailwind + TS
- [x] Font setup (Inter sans, JetBrains Mono)
- [x] Dark/light theme system (ThemeProvider + ThemeSwitch)
- [x] 75 SVG icon components with `iconMap` registry (63 mapped)
- [x] Responsive breakpoints (mobile-first: sm/md/lg/xl)
- [x] `cn()` class merge utility (`src/lib/utils.ts`)
- [x] TypeScript design tokens (`src/lib/tokens.ts`)
- [x] UI Primitives library (`src/components/ui/`):
  - [x] Button — 6 variants x 8 sizes (CVA)
  - [x] Input — 3 variants x 4 sizes, icon support (CVA)
  - [x] Badge — 8 variants x 3 sizes, dot option (CVA)
  - [x] Card — 6 variants x 5 padding + Header/Title/Description/Content/Footer (CVA)
  - [x] Skeleton — 3 shapes + SkeletonCard/SkeletonStatCard/SkeletonHeroBanner
  - [x] Modal — Framer Motion animated, 5 sizes, escape/scroll-lock
  - [x] Tooltip — 4 positions, configurable delay
  - [x] Kbd — Keyboard shortcut display
  - [x] Dropdown — Composable: Trigger/Menu/Item/Separator/Label
  - [x] Barrel export index.ts

### Branding & Logo
- [x] SVG Logo component — 3 variants (full, mark, wordmark) (`src/components/Logo.tsx`)
- [x] PWA manifest (`public/manifest.json`)
- [ ] Favicon PNGs (icon-192, icon-512, apple-touch-icon) — referenced but not yet generated
- [ ] Open Graph image (og-image.png) — referenced but not yet generated

### SEO
- [x] Enhanced metadata in layout.tsx (title template, OG, Twitter, icons, manifest)
- [x] Viewport export with theme-color
- [x] Sitemap (`src/app/sitemap.ts`) — auto-generates from toolCategories
- [x] Robots (`src/app/robots.ts`)
- [x] JSON-LD helpers (`src/lib/jsonld.ts`) — webApplicationJsonLd, breadcrumbJsonLd

### Error Handling & Loading
- [x] 404 page (`src/app/not-found.tsx`) — styled with navigation options
- [x] Error page (`src/app/error.tsx`) — error boundary with retry + dev details
- [x] Dashboard loading skeleton (`src/app/dashboard/loading.tsx`)

### Hub Dashboard
- [x] Sidebar with AI suite navigation (8 categories + "New" badges)
- [x] TopBar with theme toggle, notifications, avatar
- [x] HeroBanner with gradient text and live search (instant results dropdown)
- [x] StatsBar (4 metric cards — Total, Part-Edit Ready, AI Providers, Print Ready)
- [x] QuickAccess (horizontal featured tools strip — 12 featured)
- [x] CategorySection (collapsible, ready/beta counts, tool grid)
- [x] ToolCard (status badge, hover effects, description)
- [x] Full dashboard page composition

### Data Layer — MASSIVELY EXPANDED
- [x] **250+ tools** defined across **8 categories** (was 116 across 6)
- [x] Enhanced Tool interface with `aiProviders`, `outputs`, `supportsPartEdit`, `printReady`, `printSizes`
- [x] New types: `AIProvider` (10 providers), `OutputFormat` (22 formats), `PrintSize` (10 sizes)
- [x] Tool search helper (`searchTools()`)
- [x] Flat tool list helper (`getAllToolsFlat()`)
- [x] Status count helper (`getToolCountByStatus()`)
- [x] Part-edit tools helper (`getPartEditTools()`)
- [x] Provider filter helper (`getToolsByProvider()`)
- [x] Print-ready filter helper (`getPrintReadyTools()`)
- [x] Dynamic hub statistics data (`hubStats`)
- [x] Featured tool IDs list (12 tools)
- [x] Sidebar navigation groups (`suiteNavGroups` — 8 categories)
- [x] Status badge configuration (`statusConfig`)

### State Management (Zustand)
- [x] Sidebar store (`src/stores/sidebar.ts`) — mobile open/close, desktop collapsed, persisted
- [x] Chat store (`src/stores/chat.ts`) — conversations, messages, streaming, persisted
- [x] Preferences store (`src/stores/preferences.ts`) — recents, favorites, settings, persisted
- [x] Barrel export (`src/stores/index.ts`)

### First Tool Workspace — AI Chat
- [x] AI Chat workspace component (`src/components/workspaces/AIChatWorkspace.tsx`)
- [x] Conversation history sidebar with create/delete
- [x] Streaming message display with typing indicator
- [x] Message bubbles with markdown rendering (bold, italic, code, code blocks)
- [x] Copy-to-clipboard on assistant messages
- [x] Suggestion pills for empty state
- [x] Mobile-responsive with collapsible history panel
- [x] Textarea auto-resize, Shift+Enter for newlines
- [x] Model selector — toggle between Claude and GPT-4o
- [x] Dynamic footer text showing selected model
- [x] Multi-provider error message guidance

### Tool Workspaces — Logo Generator (REBUILT v2 — Industry-Level)
- [x] 6 logo styles: wordmark, lettermark, icon-mark, emblem, combo, abstract
- [x] 3 gradient-based SVG variants per style (18 instant designs via useMemo)
- [x] Proper typography system (getFontFamily/getFontWeight/getLetterSpacing/getTrackingWide)
- [x] Adaptive font sizing (heroSize 28-64 based on name length)
- [x] Color helpers (hexToRgb, getContrastColor)
- [x] AI generates 2 additional variants on demand (additive)
- [x] Gallery tab with instant/AI sections, thumbnails with hover labels
- [x] Preview background switcher (checker/white/dark/brand)
- [x] Context preview strip (white, dark, brand backgrounds)
- [x] Multi-resolution PNG export (1x/2x/4x at 1200×600/2400×1200/4800×2400)
- [x] 10 color presets + custom color pickers
- [x] 5 font categories with live preview

### Tool Workspaces — Social Media Post Designer (REBUILT v4 — Layer-Based Architecture)
- [x] **Complete rewrite to layer-based scene graph architecture**
- [x] DesignDocument state with Layer[], layerOrder, selectedLayers, undo/redo stacks
- [x] InteractionState for canvas mouse handling (select, drag, resize)
- [x] 6 platform presets (Instagram post/story, Facebook, Twitter, LinkedIn, YouTube)
- [x] 12 composition options from design-foundation.ts
- [x] AI image analysis via `/api/analyze-image` (Claude Vision)
- [x] AI copy generation via `/api/chat`
- [x] Stock image picker for backgrounds
- [x] Interactive canvas: click to select, drag to move, handles to resize
- [x] Keyboard shortcuts: Del (delete), Ctrl+Z/Shift+Z (undo/redo), Ctrl+D (duplicate)
- [x] 3-tab UI: Design (canvas + toolbar), Export All Sizes (28 formats by platform), Client Preview (6 device mockups)
- [x] Left panel: AI analysis, platform, background, composition, content, AI copy, style controls
- [x] Right panel: layer list with visibility toggles, add text/shape, selected layer properties (position/size/opacity + type-specific)
- [x] Multi-format export via renderToSize() — exports to any selected format dimensions
- [x] Device mockup preview via renderDeviceMockup()
- [x] 8 color themes, custom color pickers, 4 font style options
- [x] Background overlay with intensity control

### Tool Workspaces — Brand Identity Kit (NEW — Canvas-Based)
- [x] Canvas-based brand board rendering (1600×1200)
- [x] 6 board sections: header, color palette, typography, brand pattern, logo applications, footer
- [x] 8 palette presets (Professional, Tech, Nature, Bold, Minimal, Luxury, Playful, Corporate)
- [x] 6 font pairings (Inter+Mono, Playfair+Source, Roboto Slab+Roboto, etc.)
- [x] 6 pattern types (dots, lines, waves, triangles, hexagons, circles)
- [x] AI brand generation via `/api/chat`
- [x] PNG export + clipboard copy
- [x] Routed via `brand-identity` tool ID

### Tool Workspaces — Business Card Designer (NEW — Canvas-Based)
- [x] 6 layout renderers: Clean Left, Centered, Bold Split, Accent Bar, Diagonal, Gradient Edge
- [x] 3 card styles: standard (1050×600), square (750×750), rounded (1050×600)
- [x] Front/back card rendering with back side design (logo + website)
- [x] Contact fields: name, title, company, email, phone, website, address
- [x] 8 color presets, 4 font styles
- [x] AI design suggestion via `/api/chat`
- [x] Print-ready output with trim marks
- [x] PNG export + clipboard copy
- [x] Routed via `business-card` tool ID

### Tool Workspaces — Poster & Flyer Designer (REBUILT v2 — Layer-Based Architecture)
- [x] **Complete rewrite to layer-based scene graph architecture**
- [x] DesignDocument state with undo/redo, InteractionState for canvas interaction
- [x] 8 format presets: A3/A4/A5 Portrait, Tabloid, Letter, Square, DL Flyer, A5 Landscape
- [x] 12 composition options from design-foundation.ts
- [x] Event-specific fields: date, venue (appended to subtext in layer generation)
- [x] Interactive canvas: select, drag, resize with undo/redo and keyboard shortcuts
- [x] 3-tab UI: Design, Export All Sizes (28 formats), Client Preview (device mockups)
- [x] Left panel: format sizes, background, composition, content (incl. event fields), AI copy, style
- [x] Right panel: layer list, properties editor
- [x] Multi-format export via renderToSize(), device mockup preview
- [x] AI copy generation with event-specific output (headline, subtext, CTA, date, venue)
- [x] Stock image picker for backgrounds, overlay intensity control
- [x] 8 color themes, 4 font styles, print-focused defaults

### Tool Workspaces — Banner Ad Designer (REBUILT v2 — Layer-Based Architecture)
- [x] **Complete rewrite to layer-based scene graph architecture**
- [x] DesignDocument state with undo/redo, InteractionState for canvas interaction
- [x] 12 IAB standard sizes: Leaderboard, Full/Half Banner, Med/Lg Rectangle, Square, Wide/Std Skyscraper, Billboard, Large Leaderboard, Half Page, Portrait
- [x] Sizes categorized: Standard, Rectangle, Skyscraper, Premium
- [x] 6 composition options from design-foundation.ts
- [x] Interactive canvas: select, drag, resize with undo/redo and keyboard shortcuts
- [x] 2-tab UI: Design (canvas + quick export), Export All Sizes (28 formats by platform)
- [x] Left panel: size selector (categorized), background, composition, content (headline/subtext/CTA/brand), AI ad copy, style
- [x] Right panel: layer list, properties editor, quick size switch
- [x] Multi-format export via renderToSize()
- [x] AI ad copy generation (concise digital advertising copy)
- [x] Stock image picker for backgrounds, overlay intensity control
- [x] 8 color themes, 4 font styles (modern/compact/bold/elegant), "compact" as default
- [x] brandName field with smart positioning

### Infrastructure Libraries (Session 14 — NEW)
- [x] **`src/lib/canvas-utils.ts`** (~673 lines) — Shared canvas drawing utilities (extracted from duplicated code)
- [x] **`src/lib/canvas-layers.ts`** (~1024 lines) — Layer-based scene graph engine with interactive editing
- [x] **`src/lib/design-foundation.ts`** (~1760 lines) — Professional design rules engine + AI Design Director

### AI Design Director (Session 15 — MAJOR UPGRADE)
- [x] `AIDesignDirective` & `AIShapeDirective` types — Structured AI output format
- [x] `parseAIDesignDirective()` — JSON + regex fallback parser for AI responses
- [x] `buildDesignDirectorPrompt()` — Elite design prompt (composition, colors, fonts, intensity, copy)
- [x] `generateLayoutLayers()` rewrite — Full visual designs with hero shapes, accent shapes, glass cards, geometric decorations
- [x] 12 composition-specific hero shape generators (gradient orbs, sidebar panels, diagonal stripes, stacked glass cards, etc.)
- [x] Accent bar/shape generators with intensity-based escalation
- [x] Glass card overlay generators for text readability
- [x] "accent" zone handling → gradient ShapeLayer panels (was previously ignored)
- [x] "image" zone handling → radial gradient placeholder shapes (was previously ignored)
- [x] `visualIntensity` parameter (0=minimal to 3=maximal) controls layer count & effects
- [x] SocialMediaPostWorkspace `generateCopy()` → `generateFullDesign()` — AI returns composition + colors + fonts + intensity + copy
- [x] PosterFlyerWorkspace `generateCopy()` → `generateFullDesign()` — Same upgrade
- [x] BannerAdWorkspace `generateCopy()` → `generateFullDesign()` — Same upgrade
- [x] UI: "AI Copy Generator" → "AI Design Director" with gradient button styling
- [x] All 3 workspaces pass `config.visualIntensity` to `generateLayoutLayers()`

### Session 16 — Usability & Quality Fixes
- [x] **Decorative guide shapes removed from layers** — `generateLayoutLayers()` no longer creates DecorativeLayer objects; template decorations now rendered as subtle background art via `drawTemplateDecorations()` at very low opacity
- [x] **`renderFullDesignToCanvas()` — NEW** — Offscreen canvas renderer for mockups/exports. Renders complete design pipeline (background → foundation → layers → watermark) independently of canvasRef
- [x] **Device mockups FIXED** — All mockup useEffects now use `renderFullDesignToCanvas()` to create offscreen canvas, eliminating race condition where canvasRef was blank. Proper dependencies in useEffect.
- [x] **AI revision capability** — `buildDesignDirectorPrompt()` now accepts optional `revision` parameter with `currentDesign` state + `revisionRequest` text. Revision mode tells AI to "ONLY change what the client asked to change"
- [x] **`generateFullDesign()` upgraded** — All 3 workspaces now support `mode: "fresh" | "revise"`. Revise mode sends full current design state to AI.
- [x] **Revision UI** — All 3 workspaces have: revision text input + "Revise" button (appears after first generation), "Regenerate Design" button label when design exists, Enter key support
- [x] **Import cleanup** — Removed `createDecorativeLayer` from all workspaces. Kept `createShapeLayer`/`ShapeLayer` (still used in + Shape button and property panels)
- [x] **`CompositionTemplate` type fix** — Replaced `DecorativeLayer["decorationType"]` with inline union type since DecorativeLayer import was removed
- [x] **Design prompt improved** — Better guidance for visual quality (contrast, emotion-evoking colors)

### Session 18 — Quality Overhaul: Workspace Rebuilds
- [x] **HeroBanner z-index fix** — `z-20` on `<section>` to fix search dropdown hidden behind content
- [x] **ResumeCVWorkspace.tsx REBUILT** (~1697 lines) — 4 page sizes (A4/Letter/A5/Legal), 6 templates (Clean/Sidebar/Executive/Creative/Compact/Infographic), skill bars with % + circular charts, decorative shapes, timeline dots, Zambian locale (+260, Lusaka), content overflow protection, word-wrap page clipping
- [x] **InvoiceDesignerWorkspace.tsx REBUILT** (~1294 lines) — 3 page sizes, 7 currencies (ZMW default), 6 graphic templates (gradient headers, rotated text, dot grids, border frames), zebra-striped tables, 16% VAT, Zambian context AI prompts
- [x] **EmailTemplateWorkspace.tsx REBUILT** (~901 lines) — 6 templates, 6 themes with color schemes, dynamic canvas height, content blocks (heading/text/button/divider/image/spacer), hero headers, destination-over compositing, footer with unsubscribe, width slider, TypeScript narrowing fix
- [x] **PresentationWorkspace.tsx REBUILT** (~1061 lines) — 3 aspect ratios (16:9/4:3/16:10), 8 themes, 9 layouts with rich rendering (decorative circles, dot grids, accent bars, gradients, numbered bullets, image placeholders, quote marks), 4 font styles, slide CRUD, speaker notes, navigation, Zambian locale AI
- [x] **TypeScript fixes** — Non-null assertion (`!`) on `getContext("2d")` for all 4 workspaces (fixes nested function narrowing), type narrowing fix in EmailTemplate block editor (text||heading branch)
- [x] **Build verified** — `next build` passes with 0 errors, 10 routes generated

### Tool Workspaces — Stock Image Browser (NEW)
- [x] Standalone workspace for image-related tools
- [x] 12 curated collections (Business, Technology, Nature, etc.)
- [x] Masonry grid with hover overlays and provider badges
- [x] Detail modal with full-size preview and navigation arrows
- [x] Download and copy attribution functionality
- [x] Provider filtering (All/Unsplash/Pexels/Pixabay) and pagination
- [x] Wired to: ai-image-generator, image-enhancer, background-remover, photo-retoucher

### Reusable Components — StockImagePicker (NEW)
- [x] Modal component for searching/selecting stock photos
- [x] Queries unified /api/images endpoint
- [x] Provider filtering, suggestion tags, masonry grid
- [x] Used by SocialMediaPostWorkspace (and available for future workspaces)

### Command Palette (FIXED)
- [x] Cmd+K global search across 250+ tools
- [x] Removed unused searchTools import
- [x] Theme toggle uses useTheme() hook (syncs with ThemeProvider)
- [x] Favorites, recents, quick actions
- [x] Full keyboard navigation

### API Routes
- [x] `/api/chat` route (`src/app/api/chat/route.ts`) — streaming Claude API integration
- [x] `/api/images` route (`src/app/api/images/route.ts`) — unified stock image search (Unsplash/Pexels/Pixabay)
- [x] `/api/analyze-image` route (`src/app/api/analyze-image/route.ts`) — Claude Vision image composition analysis (faces, products, safe zones, colors, mood)
- [x] SSE parsing for Anthropic response format
- [x] DMSuite-specific system prompt
- [x] Error handling with helpful configuration messages

### Dynamic Class Fixes
- [x] Color lookup map utility (`src/lib/colors.ts`)
- [x] ToolCard safe hover background lookup
- [x] CategorySection safe icon background lookup
- [x] Tool workspace page safe icon background lookup

### Routing
- [x] `/` -> redirect to `/dashboard`
- [x] `/dashboard` -> hub page
- [x] `/dashboard#[categoryId]` -> scroll anchors
- [x] `/tools/[categoryId]/[toolId]` -> tool workspace (placeholder)
- [x] `/sitemap.xml` -> auto-generated
- [x] `/robots.txt` -> configured

### Cleanup
- [x] Deleted legacy financial components
- [x] Deleted legacy `dashboard.ts` mock data
- [x] Deleted placeholder SVGs

---

## What's Left

### Immediate — More Workspaces & Polish
- [x] Presentation Designer workspace (9 layouts, 8 themes, slide filmstrip, AI generation)
- [x] Resume/CV Builder workspace (6 templates, tabbed editor, A4 canvas, AI generation)
- [x] Invoice Designer workspace (6 templates, line items, auto-calc, tax/currency, AI generation)
- [x] Email Template workspace (6 types, 6 themes, block-based editor, AI generation)
- [ ] More tool workspaces (Brochure, Letterhead, Envelope, Infographic, etc.)
- [ ] Part-edit / consistency engine architecture (layer system, style locking, version history)
- [ ] Generate favicon/icon PNG assets from Logo SVG
- [ ] Add OPENAI_API_KEY to .env.local for GPT support
- [ ] Wire sidebar store into dashboard/tool pages (replace local useState)

### Q1 — Core Platform & First AI Tools
- [ ] Integrate Logo component into Sidebar
- [x] API routes (`/api/chat`) — done (multi-provider)
- [x] Claude API integration — done (streaming)
- [x] OpenAI API integration — done (streaming)
- [x] Command palette (Cmd+K) — done and fixed
- [ ] Page transitions with Framer Motion
- [ ] Migrate dashboard components to use UI primitives
- [ ] Supabase integration (auth + database)
- [ ] Vercel AI SDK for streaming responses

### Q2 — Creative Expansion
- [x] Logo Generator workspace — done and rebuilt with rich SVGs
- [x] Social Media Post Designer workspace — done and rebuilt with 6 layouts
- [ ] Background Remover workspace
- [ ] Brand Kit Manager page
- [ ] Projects system page
- [ ] Asset library & file management
- [ ] Image generation API integration

### Q3 — Content & Marketing Suite
- [ ] Video editor workspace
- [ ] Sales Book Creator workspace
- [ ] Email Campaign Builder
- [ ] Content Calendar
- [ ] Export pipeline (PDF, PNG, SVG, video)
- [ ] Template marketplace

### Q4 — Platform Maturity & Launch
- [ ] Performance optimization
- [ ] Analytics & usage tracking
- [ ] Team collaboration features
- [ ] API for third-party integrations
- [ ] Documentation site
- [ ] Beta launch

---

## Known Issues
1. **~240 tools still show placeholder workspace** — 11 tool routes now have functional workspaces (AI Chat, Logo Generator, Social Media Post, Brand Identity Kit, Business Card, Poster, Flyer, AI Image Generator, Image Enhancer, Background Remover, Photo Retoucher)
2. **Favicon PNGs missing** — Referenced in layout.tsx and manifest.json but not yet generated
3. **OG image missing** — Referenced but not yet created
4. **Tooltip animation** — Uses `animate-in` which requires custom keyframe
5. **Requires `.env.local`** with `ANTHROPIC_API_KEY` for Claude (configured), `OPENAI_API_KEY` for GPT (not yet added), and stock image API keys (Unsplash, Pexels, Pixabay — all configured)
6. **Sidebar store** created but not yet wired into actual sidebar/dashboard components
7. **Brand Identity Kit & Business Card** not yet converted to layer-based architecture

---

## Tool Category Breakdown (CURRENT — 250+ tools)
| Category | ID | Color | Tools | New? |
|---|---|---|---|---|
| Design Studio | design | primary-500 | ~46 | — |
| Document & Print Studio | documents | secondary-500 | ~41 | — |
| Video & Motion Studio | video | error | ~32 | — |
| Audio & Voice Studio | audio | info | ~9 | NEW |
| Content Creation | content | warning | ~24 | — |
| Marketing & Sales | marketing | wire-transfer | ~18 | — |
| Web & UI Design | web | bank-transfer | ~10 | NEW |
| Utilities & Workflow | utilities | gray-500 | ~20 | — |
| **TOTAL** | | | **250+** | |

---

## File Registry

### Libraries
| File | Purpose |
|---|---|
| `src/lib/utils.ts` | `cn()` class merge utility |
| `src/lib/tokens.ts` | TypeScript design tokens |
| `src/lib/jsonld.ts` | JSON-LD structured data helpers |
| `src/lib/colors.ts` | Safe color class lookup maps (JIT-safe) |

### Zustand Stores (`src/stores/`)
| File | Exports |
|---|---|
| `sidebar.ts` | `useSidebarStore` — mobile/desktop sidebar state |
| `chat.ts` | `useChatStore` — conversations, messages, streaming |
| `preferences.ts` | `usePreferencesStore` — recents, favorites, settings |
| `index.ts` | Barrel export of all stores |

### Tool Workspaces (`src/components/workspaces/`)
| File | Purpose |
|---|---|
| `AIChatWorkspace.tsx` | Full AI chat UI with conversation history, streaming, markdown |
| `LogoGeneratorWorkspace.tsx` | Logo creation with typography system, gradient SVGs, multi-res export |
| `SocialMediaPostWorkspace.tsx` | Canvas-based social post with AI image analysis, smart text, 8 layouts |
| `StockImageBrowserWorkspace.tsx` | Stock image search/browse/download with detail modal |
| `BrandIdentityWorkspace.tsx` | Canvas brand board with palettes, typography, patterns, AI generation |
| `BusinessCardWorkspace.tsx` | Canvas business card with 6 layouts, front/back, 3 card styles |
| `PosterFlyerWorkspace.tsx` | Canvas poster/flyer with 8 formats, 6 layouts, event fields |
| `BannerAdWorkspace.tsx` | Canvas banner ads with 12 IAB sizes, 6 layouts, adaptive rendering |
| `PresentationWorkspace.tsx` | Slide deck: 9 layouts, 8 themes, 3 aspect ratios, rich graphics, AI generation |
| `ResumeCVWorkspace.tsx` | Resume/CV: 6 templates, 4 page sizes, skill bars/circles, Zambian locale |
| `InvoiceDesignerWorkspace.tsx` | Invoice: 6 templates, 3 page sizes, ZMW currency, 16% VAT, graphic headers |
| `EmailTemplateWorkspace.tsx` | Email: 6 templates, 6 themes, block-based content, dynamic height |

### Reusable Components
| File | Purpose |
|---|---|
| `src/components/StockImagePicker.tsx` | Modal for searching/selecting stock photos from Unsplash/Pexels/Pixabay |

### Global Components
| File | Purpose |
|---|---|
| `src/components/CommandPalette.tsx` | Cmd+K search overlay — fuzzy search 250+ tools, recents, favorites, actions |

### API Routes
| Route | Purpose |
|---|---|
| `src/app/api/chat/route.ts` | Multi-provider AI proxy (Claude + OpenAI) with streaming, GET for status |
| `src/app/api/images/route.ts` | Unified stock image search (Unsplash/Pexels/Pixabay), normalized results |
| `src/app/api/analyze-image/route.ts` | Claude Vision image analysis — faces, products, safe zones, colors, mood |

### UI Primitives (`src/components/ui/`)
| File | Exports |
|---|---|
| `Button.tsx` | Button, buttonVariants |
| `Input.tsx` | Input, inputVariants |
| `Badge.tsx` | Badge, badgeVariants |
| `Card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `Skeleton.tsx` | Skeleton, SkeletonCard, SkeletonStatCard, SkeletonHeroBanner |
| `Modal.tsx` | Modal |
| `Tooltip.tsx` | Tooltip |
| `Kbd.tsx` | Kbd |
| `Dropdown.tsx` | Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSeparator, DropdownLabel |
| `index.ts` | Barrel export of all UI primitives |

### Data
| File | Purpose |
|---|---|
| `src/data/tools.ts` | **250+ tools, 8 categories**, enhanced types, helpers, stats, nav |
| `src/data/config/colors.ts` | JS color palette definitions |

### Branding
| File | Purpose |
|---|---|
| `src/components/Logo.tsx` | SVG Logo component (full/mark/wordmark) |
| `public/manifest.json` | PWA web app manifest |
