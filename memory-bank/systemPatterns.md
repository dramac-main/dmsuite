# DMSuite — System Patterns

## Visual Design Language: Glassmorphism + Electric Violet
- **Primary:** Electric Violet `#8b5cf6` (50-950 scale)
- **Secondary:** Neon Cyan `#06b6d4`
- **Neutrals:** Cosmic Slate (`#070b14` darkest)
- **Surface pattern:** `bg-white/60 dark:bg-gray-900/40 backdrop-blur-lg` + `border-white/10 dark:border-white/[0.06]`
- **Hover pattern:** `translate-y` lift + `shadow-xl` with primary glow
- **Interactive reveals:** Slide-up elements on hover (arrows, "Launch" labels)
- **Ambient bg:** Fixed gradient orbs behind content (blurred, low opacity)
- **Single source:** globals.css (`@theme inline`) → tokens.ts → design-system.ts `brand` object

## Architecture: Hub-and-Spoke

```
/dashboard (hub)
    ├── HeroBanner (search + welcome)
    ├── StatsBar (4 metric cards: Total, Part-Edit, AI Providers, Print Ready)
    ├── QuickAccess (12 featured tools, horizontal scroll)
    └── CategorySection × 8 (collapsible, tool grids)
            └── ToolCard × N (status badge, hover lift, link)

/tools/[categoryId]/[toolId] (spoke)
    ├── Breadcrumbs
    ├── Tool header (icon, name, status, tags)
    └── Workspace area (tool-specific UI — placeholder for now)
```

## Key Architectural Decisions

### 1. Data-Driven Everything
- **All tool definitions** live in `src/data/tools.ts` — a single source of truth (250+ tools, 2693 lines)
- Components read from data, never hardcode tool info
- Adding a new tool = adding one object to the `toolCategories` array
- Helper functions: `searchTools()`, `getAllToolsFlat()`, `getToolCountByStatus()`, `getPartEditTools()`, `getToolsByProvider()`, `getPrintReadyTools()`
- Enhanced Tool interface: `aiProviders`, `outputs`, `supportsPartEdit`, `printReady`, `printSizes`
- 10 AI provider types, 22 output formats, 10 print sizes

### 2. Icon Systems
- **UI Icons** (React/SVG): `src/components/icons.tsx` — 75+ inline SVG components, `iconMap` registry for dashboard/UI use
  - **Safe lookup**: Always use `getIcon(key)` helper (returns `FallbackIcon` when key is missing) — NEVER use raw `iconMap[key]` in rendering
  - **FallbackIcon**: Generic rounded rect with info indicator, renders instead of blank space
- **Canvas Icon Library** (Asset Bank): `src/lib/icon-library.ts` — 115 professional vector icons for canvas rendering
  - 8 categories: social-media, contact, business, creative, technology, lifestyle, arrows-ui, commerce
  - API: `drawIcon(ctx, iconId, x, y, size, color, strokeWidth?)`
  - Registry: `ICON_BANK` (metadata array), `ICON_REGISTRY` (O(1) lookup), `ICON_CATEGORIES` (browsable)
  - AI helpers: `getIconListForAI()`, `searchIcons()`, `getAllIconIds()`, `getIconsByCategory()`
  - Injected into AI Design Engine and AI Revision Engine prompts
  - Legacy wrappers in graphics-engine.ts delegate to icon-library (deprecated)

### 2b. Asset Bank Architecture Pattern
- Global shared asset libraries stored in `src/lib/` as standalone modules
- Each asset bank exports: items array (with metadata), registry (O(1) lookup), category list, AI helper functions
- First bank: Icon Library (115 icons, `src/lib/icon-library.ts`)
- Second bank: Abstract Asset Library (90 decorative assets, `src/lib/editor/abstract-library.ts`)
  - 9 categories: modern, minimalist, vintage, corporate, luxury, organic, tech, bold, geometric
  - Each asset has `build(params) → LayerV2[]` with full customization (color, scale, rotation, offset, blend)
  - All layers tagged with `["abstract-asset", "abstract-{id}", color-role-tags]`
  - Integrated into: business-card-adapter (CardConfig + sync), ai-patch (4 intent types), template-generator (AccentLayer), BusinessCardWorkspace (AccordionSection UI)
- Asset banks have ZERO dependencies on other modules (no circular imports)
- All workspaces and AI engines consume asset banks via simple imports

### 2c. Credit Pricing Architecture
```
src/data/credit-costs.ts — Single Source of Truth (client-safe)
  ├── CREDIT_COSTS: Record<string, number>  — operation → credits mapping
  ├── CREDIT_PACKS: { name, credits, priceZMW, priceLabel }[]  — 4 packs
  ├── TOOL_CREDIT_MAP: Record<string, string>  — 95+ toolId → operation key
  ├── getCreditCostClient(operation) — safe lookup with fallback
  └── getToolCreditCost(toolId) — toolId → cost via TOOL_CREDIT_MAP → CREDIT_COSTS

src/lib/supabase/credits.ts — Server-side credit operations
  ├── Imports CREDIT_COSTS from credit-costs.ts (re-exports)
  ├── getCreditCost(operation) — server-side lookup
  ├── checkCredits(userId, operation) — balance check
  ├── deductCredits(userId, amount, operation, desc) — DB deduction
  ├── addCredits(userId, amount, desc) — purchase/bonus
  └── refundCredits(userId, amount, operation, desc) — failure refund

Pricing Model:
  ├── 3x markup over API costs → ≥60% gross margin
  ├── Pack tiers: Starter K49/100cr, Popular K199/500cr, Pro K499/1500cr, Agency K1299/5000cr
  ├── Credit value range: K0.49/cr (Starter) → K0.26/cr (Agency)
  └── Default signup: 50 credits (enough for ~10 chats or 1 business card)

Key Rule: Refund ACTUAL cost on failure, never hardcode amounts
```

### 2d. Project Storage Architecture (Supabase + IndexedDB)
```
Write Path (save):
  Workspace → StoreAdapter.getSnapshot()
    → IndexedDB (fast local cache — immediate)
    → Supabase project_data (debounced 3s, retry on failure)

Read Path (load):
  IndexedDB cache hit? → use it (fast)
  IndexedDB miss? → Supabase project_data → cache to IndexedDB
  Supabase miss? → Legacy migration (one-time localStorage → IndexedDB)
  All miss? → resetStore() (nuclear: resets Zustand + removes persist localStorage key)

Project Metadata (user_projects table):
  id (text PK), user_id (FK profiles), tool_id, name, progress, milestones[], has_data
  RLS: users can only CRUD their own projects

Project Data (project_data table):
  project_id (FK PK), user_id, tool_id, data (JSONB), saved_at, size_bytes
  RLS: users can only CRUD their own data

Sync Strategy:
  ├── syncFromServer() called on mount (workspace page, projects page, dashboard)
  ├── Resolution effect GATED on hasSynced — prevents duplicates after clear site data
  ├── Auto-select most recent project (no picker gate) — like Figma/Canva
  ├── Picker only shown on explicit request (Projects button in header)
  ├── Picker onClose: creates NEW project if dismissed without selection (never loads old)
  ├── key={activeProjectId} on WorkspaceComponent forces full unmount+remount
  ├── Server is authoritative — server projects replace local by ID
  ├── Local-only projects (created offline) get pushed to server during sync
  ├── All store mutations (add, update, rename, delete) fire-and-forget to Supabase
  ├── hasSynced = true even on error — falls back to local-only, never blocks UI
  └── Offline resilient — IndexedDB works without network, syncs when back online

Performance:
  ├── Auth: getSession() (memory read) + 60s TTL cache (no network per op)
  ├── Supabase saves debounced 3s — batches rapid edits
  ├── Failed saves re-queued for retry on next save attempt
  └── Pending saves flushed on project switch and unmount

Nuclear Reset (store-adapters.ts):
  resetStore() does TWO things:
  1. Resets in-memory Zustand state (e.g., resetResume())
  2. Removes persist localStorage key (nukePersistStorage("dmsuite-resume"))
  This prevents stale data from bleeding into new projects via rehydration

Auto-Save (Session 145):
  Direct Zustand store subscription in useProjectData — no event pipeline needed
  adapter.subscribe(cb) → detects changes via JSON comparison → debounce 1.5s → saveToProject()
  isTransitioningRef guard prevents saving during project switches
  All 13 adapters have subscribe method
```

### 2e. User Data Persistence Architecture (Session 145)
```
User-Level Data (survives browser cache clear):
  Zustand stores (localStorage) ←→ useUserDataSync ←→ Supabase user_data table (KV store)

Table: user_data
  user_id (uuid FK), data_key (text), data (JSONB), updated_at
  Composite PK: (user_id, data_key)
  RLS: auth.uid() = user_id

Data Keys: analytics, preferences, advanced-settings, business-memory, chiko, chat, notifications, export-history

Sync Flow (on mount):
  1. fetchAllUserData() — bulk load all user data keys from Supabase
  2. Smart merge into local stores (strategy per key):
     - analytics: Math.max() of each metric per tool (handles partial syncs)
     - business-memory: newer updatedAt wins
     - chat: merge conversations by ID (server + local-only)
     - preferences/advanced-settings/chiko: server wins
  3. isRestoringRef prevents save-back loops during restore

Sync Flow (on change):
  1. Store subscriptions detect changes (JSON dirty comparison)
  2. debouncedSaveUserData() — 3s batching per key
  3. Failed saves retry on next attempt
  4. flushAllPendingSaves() on beforeunload

Service: src/lib/supabase/user-data.ts
Hook: src/hooks/useUserDataSync.ts (mounted in ClientShell.tsx)
```

### 3. Client Component Strategy
- All interactive components use `"use client"` directive
- Local config state per workspace via `useState<XxxConfig>()` — workspace-specific settings
- Global design settings via Zustand `useAdvancedSettingsStore` — shared across all tools
- Sidebar open/close state in `useSidebarStore`

### 3a. Activity Log + Revert System
```
ActivityLog Store (activity-log.ts) — non-persisted (session only)
  ├── log: Record<toolId, ActivityEntry[]>  — per-tool history (50 max)
  ├── logActivity(toolId, action, desc, snapshot, source)
  ├── getLog(toolId, limit) / getEntry(toolId, entryId)
  ├── getSnapshot(toolId, entryId) — parse JSON snapshot
  └── clearLog(toolId)

withActivityLogging(manifest, getFullSnapshot, restoreSnapshot) → wrapped manifest
  ├── Auto-logs every Chiko action with before-snapshot
  ├── Adds getActivityLog action (read history)
  ├── Adds revertToState action (restore snapshot by entry ID)
  ├── _chikoMode flag tracks source (user vs chiko)
  └── Read-only actions (readCurrentState) are not logged

Color Persistence Pattern:
  ├── Module-level _accentLocked boolean per store
  ├── setAccentColor() / updateStyle/Metadata(accentColor) → locks
  ├── setTemplate() / updateStyle(template) → only syncs accent if !locked
  ├── reset / setData → unlocks (fresh start)
  └── Resume already correct (changeTemplate never touches primaryColor)
```

### 3b. Global Advanced Settings Architecture
```
Zustand Store (advanced-settings.ts) — persisted in localStorage
  ├── typography: { headingScale, bodyScale, labelScale, letterSpacing, lineHeight, ... }
  ├── colorEffects: { patternOpacity, decorativeOpacity, dividerOpacity, textShadow, ... }
  ├── spacing: { marginH, marginV, padding, sectionGap, elementGap, offsetX/Y }
  ├── iconGraphic: { iconSize, iconStroke, iconGap, logo, qr, seal, shape }
  ├── borderDivider: { borderWidth, borderRadius, dividerThickness, dividerLength, corner }
  └── exportQuality: { exportScale (1/2/3x DPI), jpegQuality, bleed, cropMarks, pdfMargin }

Helpers (advanced-helpers.ts) — pure functions, no React
  ├── getAdvancedSettings() — synchronous store snapshot reader
  ├── scaledFontSize(base, tier) — applies heading/body/label scale
  ├── scaledIconSize/Gap/Stroke() — icon multipliers
  ├── getPatternOpacity(base) — pattern overlay multiplier
  └── getExportScale() — DPI multiplier for export handlers

UI Panel (AdvancedSettingsPanel.tsx) — drop-in shared component
  ├── 6 collapsible AccordionSections
  ├── ~40 controls (SliderRow, ToggleRow, SelectRow)
  ├── Per-section Reset + Master Reset All
  └── Props: sections?, standalone?, className?
```
- **All defaults = 1.0 multiplier** — zero visual regression unless user tweaks
- **Canvas functions read via `getAdvancedSettings()`** — safe outside React (synchronous snapshot)
- **Re-render triggered via `useAdvancedSettingsStore(s => s.settings)`** subscription in component
- **61 canvas workspaces** have the panel + subscription integrated

### 3c. vNext Editor Architecture (NEW — Session 28)
```
DesignDocumentV2 (schema.ts) — Canonical Scene Graph
  ├── layersById: Record<LayerId, LayerV2>  (8 types: text, shape, image, frame, path, icon, boolean-group, group)
  ├── rootFrameId (artboard with bleed/safe zones, guide lines)
  ├── selection: LayerId[]
  ├── resources: { images, fonts }
  └── meta: { toolId, name, createdAt, modifiedAt, version }

CommandStack (commands.ts) — Undo/Redo with Coalescing
  ├── execute(command) — snapshot-based
  ├── undo() / redo() — returns new CommandStackState
  ├── Pre-built: move, resize, update, add, delete, reorder, duplicate, batch
  └── coalesceKey for grouping rapid edits (e.g., typing, dragging)

Renderer (renderer.ts) — Canvas2D Drawing
  ├── renderDocumentV2(ctx, doc, opts) — full document render
  ├── Per-type: renderFrame, renderText, renderShape, renderImage, renderIcon, renderPath, renderGroup
  ├── Paint system: solid, gradient (linear/radial/conic), image, pattern
  ├── Effects: drop-shadow, inner-shadow, blur, glow, outline, color-adjust, noise
  ├── 16 blend modes mapped to Canvas API compositeOperation
  ├── renderToCanvas(doc, scale) — off-screen export
  └── Z-ORDER CONVENTION: children[0]=behind (drawn first), children[last]=on top (drawn last)
      - renderFrame & renderGroup iterate FORWARD (i=0 → length-1)
      - addLayer APPENDS to children (new layers go on top)
      - reorderLayerV2: "up"=bring forward (swap idx+1), "down"=send backward (swap idx-1)
      - hitTestChildren iterates REVERSE (front-most checked first for selection)
      - getLayerOrder returns [0]=behind, [last]=on top
      - LayersListPanel reverses for display (front at panel top)

HitTest (hit-test.ts) — Selection Engine
  ├── hitTestDocument(doc, point) — front-to-back recursive (last child checked first)
  ├── hitTestHandles(doc, point) — resize/rotation handle detection
  ├── isPointInLayer() — rotation-aware local-space transform
  └── SpatialIndex — grid-based (64px cells) for large documents

Interaction (interaction.ts) — Pointer State Machine
  ├── States: idle → down → dragging
  ├── Actions: move, resize, rotate, draw-shape, marquee, pan
  ├── screenToWorld/worldToScreen coordinate conversion
  └── Keyboard: arrow nudge (1px / 10px+Shift)

DesignRules (design-rules.ts) — Professional Knowledge
  ├── Color: WCAG contrast, harmony (6 types), clash detection, tint ladders
  ├── Typography: 8 modular scales, min font sizes, line height/letter spacing ranges
  ├── Spacing: 8px grid, golden ratio, print margins, rule of thirds
  ├── Validation: validateDesign() → RuleViolation[]
  └── AI ranges: PROPERTY_RANGES with min/max/step for 13 categories

AI Patch Protocol (ai-patch.ts) — AI ↔ Editor Bridge
  ├── Dual-mode: strict PatchOp (RFC 6902 subset) OR high-level EditIntent
  ├── PatchOp: replace, add, remove, reorder, add-layer, remove-layer
  ├── EditIntent: 35 types (make-bigger, center, change-color, fix-contrast, add-effect, set-fill, add-gradient-fill, flip, set-font, set-text-style, set-image-filters, reorder-layer, ...)
  ├── LayerTarget: by IDs, tags, nameContains, layerType, special selectors
  ├── resolveTarget(doc, target) — deterministic layer resolution
  ├── intentToPatchOps(doc, intent) — NO AI NEEDED, deterministic compiler
  ├── validateAndApplyPatch(doc, ops, scope, lockedPaths) — scope enforcement + WCAG check
  ├── processIntent(doc, intent, scope, lockedPaths) — full pipeline
  ├── RevisionScope: text-only, colors-only, layout-only, element-specific, full-redesign
  ├── buildAIPatchPrompt(doc, instruction, scope, lockedPaths) — AI system prompt generator
  └── parseAIRevisionResponse(raw) — JSON extractor from LLM output

Align & Distribute (align-distribute.ts) — Layout Commands
  ├── createAlignCommand(doc, ids, axis) — align to artboard or selection bounds
  ├── createDistributeCommand(doc, ids, axis) — redistribute 3+ layers evenly
  ├── createSpaceEvenlyCommand(doc, ids, axis, gap?) — equal gap spacing
  └── createFlipCommand(doc, ids, axis) — horizontal/vertical flip

Smart Snapping (snapping.ts) — Visual Guides
  ├── snapLayer(doc, id, x, y, config) → SnapResult (adjusted pos + guides)
  ├── snapResize(doc, id, handle, x, y, w, h, config) — resize snapping
  ├── drawSnapGuides(ctx, guides, zoom) — overlay renderer
  └── Wired into CanvasEditor during drag operations

React Components (components/editor/)
  ├── CanvasEditor — universal editor kernel (RAF loop, resize, viewport, grid, overlays, snap guides)
  ├── EditorToolbar — mode tools, undo/redo, zoom, view toggles, contextual AlignDistributeBar
  ├── LayerPropertiesPanel — full inspector (integrates all sub-editors below)
  ├── LayersListPanel — layer list with visibility/lock toggles
  ├── ColorPickerPopover — HSV picker with hex/RGB/opacity/presets
  ├── FillStrokeEditor — multi-fill/stroke with solid/gradient/pattern
  ├── TextStyleEditor — font, size, weight, color, alignment, spacing, overflow
  ├── TransformEditor — position, size, rotation, skew, opacity, flip
  ├── EffectsEditor — 7 stackable effect types with per-type controls
  └── AlignDistributeBar — 6 align + 2 distribute actions

Zustand Store (stores/editor.ts)
  ├── document + commandStack management
  ├── selection (additive/deselect), layer CRUD
  ├── interaction mode + drag state
  ├── viewport (zoom/pan/showGrid/showGuides/snap)
  ├── AI state (scope, processing, patch/intent application)
  ├── locked paths (per-layer property locking for AI)
  └── clipboard (copy/paste/cut with offset)
```

**Key design decisions:**
- **DesignDocumentV2 is the single source of truth** — every visual element is a Layer with JSON-addressable properties
- **Two AI modes**: Low-level PatchOps for precision, high-level EditIntents for "make logo bigger" natural language
- **Intent compiler is deterministic** — common intents (make-bigger, center, change-color) need NO AI call
- **Scope + lock enforcement** — AI can be constrained to only modify text, or colors, or specific layers
- **Backward compatible** — old canvas-layers.ts kept for existing workspaces; migration is per-workspace
- **Migration strategy**: BusinessCard first (reference), then roll to all 60+ canvas workspaces

### 3d. Resume Template Architecture (Session 59)
```
Resume Template System (26 templates: 6 legacy + 20 pro)

template-defs.ts — ProTemplateDefinition Registry
  ├── PRO_TEMPLATES: ProTemplateDefinition[] (20 configs)
  ├── Each config: id, name, layout, sidebarWidthPx, pagePadding
  ├── ColorPalette (12 props): background, cardBg, sidebarBg, headerBg,
  │   accent, accentLight, accentSecondary, accentTertiary,
  │   textDark, textMedium, textLight, border
  ├── Typography: defaultFontPairing, googleFontUrl, baseFontSize, headingSize, subheadingSize
  ├── Styles: headerStyle (9 types), sectionTitleStyle (10 types), skillDisplay (6 types)
  ├── Layout: mainSections[], sidebarSections[], isTwoColumn, hasDarkSidebar, hasAvatar
  └── Helpers: getProTemplate(id), isProTemplate(id)

UniversalTemplate.tsx — Config-Driven Universal Renderer
  ├── generateTemplateCSS(config) → scoped <style> with [data-pro-template="id"] selectors
  ├── Header styles: split, banner, bold-strip, gradient, code, masthead, in-sidebar, ornamental
  ├── Section title decorations: all 10 styles with CSS
  ├── Skill display: bar, dot, tag, simple, percentage, star
  ├── Layout components: SidebarRight, SidebarLeft, TwoEqual, SingleColumn
  └── createProTemplateComponent(id) → React component (factory function)

templates.ts — Registry
  ├── TEMPLATES: TemplateMetadata[] (26 total, pro first)
  ├── TemplateMetadata: id, name, description, columns, isPro?, accentPreview?, isDark?
  └── Merges pro (from template-defs) + legacy (6 hand-coded)

TemplateRenderer.tsx — Dynamic Resolution
  ├── LEGACY_COMPONENTS: Record<string, ComponentType> (6 templates)
  ├── proComponentCache: Map for lazy creation via createProTemplateComponent()
  ├── getTemplateComponent(id) → checks legacy → checks/creates pro
  ├── Google Fonts <link> injection for pro templates
  └── ResumePage applies pro palette (backgroundColor, textColor, fontFamily, fontSize, padding)

schema.ts — 26 templateId values, 28 FONT_PAIRINGS, FONT_SCALE_MULTIPLIER (compact/standard/spacious)
pagination.ts — TEMPLATE_CONFIG for all 26, MIN_FILL_RATIO=0.35
export.ts — Triple-frame font wait, dynamic backgroundColor, onclone font resolution
```

**Key design decisions:**
- **Config-driven templates** — All 20 pro templates share one UniversalTemplate component with per-template CSS
- **Scoped CSS** — `[data-pro-template="id"]` attribute selectors prevent style leaking
- **Google Fonts per template** — Each pro template has its own font URL loaded via `<link>` tag
- **Factory pattern** — `createProTemplateComponent(id)` wraps UniversalTemplate with pre-bound config
- **Lazy creation** — Pro components created on first use, cached in `proComponentCache` Map
- **Pro-first ordering** — Pro templates shown before legacy in registry/carousel
- **Template switching** — `changeTemplate()` in store auto-sets font pairing + layout from pro definition

### 4. Styling Patterns
- **Tailwind tokens only** — never hex values, never pixel values
- **Dark-first**: Write dark styles as default, add light with `dark:` inversion
- **`cn()` utility** — Always use `cn()` from `@/lib/utils` for conditional/merged classes
- **CVA pattern** — All UI primitives use `class-variance-authority` for type-safe variants
- **Glassmorphic cards**: `bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl`
- **Hover lifts**: `hover:-translate-y-0.5 hover:shadow-lg transition-all`
- **Status badges**: Colored dots + bg/text classes from `statusConfig`
- **Glow effects**: Absolute-positioned blurred circles for ambient light

### 5. UI Primitive Pattern (CVA + cn)
```tsx
const variants = cva("base-classes", {
  variants: { variant: { ... }, size: { ... } },
  defaultVariants: { variant: "default", size: "md" },
});

const Component = forwardRef<HTMLElement, Props>(
  ({ className, variant, size, ...props }, ref) => (
    <element className={cn(variants({ variant, size, className }))} ref={ref} {...props} />
  )
);
```
- Import from barrel: `import { Button, Card, Badge } from "@/components/ui"`
- All primitives support `className` override via `cn()` merging

### 6. Tailwind CSS v4 Specifics
- Theme via `@theme inline {}` in `globals.css` (NOT tailwind.config.js)
- Gradient: `bg-linear-to-br` (NOT `bg-gradient-to-br`)
- Use standard tokens: `w-18` (NOT `w-[4.5rem]`)
- Color custom properties: `--color-primary-500: #84cc16`
- Available colors: primary, secondary, gray, success, error, warning, info, wire-transfer, bank-transfer
- **NO pink, purple, or other default Tailwind colors** — only theme-defined colors

### 6b. Central Design System (`src/lib/design-system.ts`) — Session 53
Single source of truth for ALL layout constants, class patterns, and recipes:
```
sidebar:     expandedWidth, collapsedWidth, mainMarginExpanded, mainMarginCollapsed, expandedPx, collapsedPx, transition
layout:      maxWidth, pagePadding, topBarHeight, container
surfaces:    page, sidebar, card, glass, elevated, input, hoverItem, activeItem, muted
borders:     default, subtle, sidebar, card, focusRing, dashed, accent
typography:  pageTitle, sectionTitle, cardTitle, body, muted, label, breadcrumb, logo
interactive: hoverLift, buttonHover, iconButton, iconButtonSm, navItem, searchInput
statusBadge: ready, beta, coming-soon (each has bg/text/dot/label)
animations:  fast, normal, slow, colors, sidebarSpring, fade
gradients:   brand, brandSubtle, cardDark
shadows:     brand, cardHover, sm
radii:       sm, md, lg, xl, full
recipes:     card, tag, aiBadge, notifDot, logoMark, avatar, placeholder
```
- Import: `import { sidebar, surfaces, typography } from "@/lib/design-system"`
- Components NEVER hardcode repeated class patterns — always from design-system

### 6c. Hover-to-Expand Sidebar Architecture — Session 53
```
useSidebarStore (Zustand, persisted in localStorage)
  ├── mobileOpen: boolean (transient)
  ├── hovered: boolean (transient — mouse enter/leave with debounce)
  ├── pinned: boolean (persisted — user pins sidebar open permanently)
  ├── openMobile() / closeMobile() / toggleMobile()
  ├── setHovered(bool) — called by debounced mouse handlers
  ├── togglePinned() — user clicks pin button
  └── setPinned(bool) — explicit pin control

design-system.ts sidebar config:
  ├── expandedWidth: "w-60"   collapsedWidth: "w-18"
  ├── mainMarginExpanded: "lg:ml-60" (used when pinned)
  ├── mainMarginCollapsed: "lg:ml-18" (used when not pinned)
  ├── hoverExpandDelay: 100ms   hoverCollapseDelay: 300ms
  └── overlayShadow: "shadow-2xl shadow-black/20 dark:shadow-black/50"

Sidebar.tsx (zero props, reads ALL state from store):
  ├── isExpanded = pinned || hovered
  ├── isOverlay = hovered && !pinned (overlay shadow applied)
  ├── onMouseEnter: debounced expand (100ms)
  ├── onMouseLeave: debounced collapse (300ms)
  ├── Desktop: always starts collapsed (icons only)
  │   ├── Hover → expands as overlay (shadow, no layout shift)
  │   └── Pinned → expands and pushes content
  ├── Mobile: unchanged overlay drawer with swipe-to-close
  ├── Pin button: thumbtack icon (pinned=green, unpinned=gray+rotated)
  └── Navigation clears hover state on pathname change

Pages (dashboard, tools, WorkspaceShell):
  └── Main margin: pinned ? lg:ml-60 : lg:ml-18
```

### 7. Component Composition
```
DashboardPage
  ├── Sidebar (suiteNavGroups from tools.ts — 8 categories)
  ├── TopBar (theme toggle, notifications, avatar)
  ├── HeroBanner (searchTools() for live search — 250+ tools)
  ├── StatsBar (hubStats — dynamic counts)
  ├── QuickAccess (featuredToolIds → getAllToolsFlat() — 12 tools)
  └── CategorySection[] (toolCategories — 8 categories)
        └── ToolCard[] (individual tool)
```

### 8. Routing Pattern
- `/` → redirects to `/dashboard`
- `/dashboard` → hub page with all 8 categories
- `/dashboard#[categoryId]` → scroll to category section
- `/tools/[categoryId]/[toolId]` → tool workspace
- `/tools/[categoryId]/[toolId]?project={id}` → tool workspace with specific project loaded

### 8b. Project Persistence Architecture (Session 134)
```
Per-Project Data Storage (IndexedDB + Store Adapters)

src/lib/project-data.ts — IndexedDB CRUD Service
  ├── DB: dmsuite-projects-db, version 1, store: project-data
  ├── ProjectSnapshot: { projectId, toolId, data, savedAt, sizeBytes }
  ├── saveProjectData(projectId, toolId, data) — upsert with size tracking
  ├── loadProjectData(projectId) — retrieve snapshot
  ├── deleteProjectData(projectId) — cleanup
  ├── duplicateProjectData(sourceId, targetId) — copy snapshot
  ├── listProjectDataByTool(toolId) — list all for picker
  ├── migrateLegacyData(toolId) — one-time localStorage→IndexedDB migration
  └── Legacy map: dmsuite-resume→resume-cv, dmsuite-contract→contract-template,
      dmsuite-invoice→invoice-designer, dmsuite-sales-book→sales-book

src/lib/store-adapters.ts — Centralized Adapter Factory
  ├── StoreAdapter: { getSnapshot(), restoreSnapshot(data), resetStore() }
  ├── getOrCreateAdapter(toolId) — cached factory with lazy require()
  ├── Contract adapter: form ↔ useContractStore.setForm/resetForm
  ├── Invoice adapters (7 variants): invoice ↔ useInvoiceStore.setInvoice/resetInvoice
  ├── Resume adapter: resume ↔ useResumeStore.setResume/resetResume
  ├── SalesBook adapter: form ↔ useSalesBookEditor.setForm/resetForm
  └── Generic adapter: empty snapshot (fallback for tools without stores)

src/hooks/useProjectData.ts — React Bridge Hook
  ├── Uses getOrCreateAdapter(toolId) to get snapshot/restore functions
  ├── Auto-loads from IndexedDB when projectId changes
  ├── Listens for workspace:save → auto-persists to IndexedDB
  ├── Returns: { isLoading, isLoaded, projectId, saveToProject, loadFromProject }
  └── Calls migrateLegacyData(toolId) on first load

src/stores/projects.ts — Enhanced Project Metadata Store
  ├── renameProject(id, name) — inline rename
  ├── duplicateProject(id, newName) — clones metadata + IndexedDB data
  ├── getProjectsForTool(toolId) — filter helper
  ├── hasData?: boolean — tracks if project has saved data
  └── Project limit: 200 (was 50)

Flow:
  Tool page loads → read ?project param
    ├── Has param → validate → useProjectData loads from IndexedDB → restoreSnapshot()
    ├── No param + existing projects → show ProjectPickerModal
    └── No projects → auto-create after 5s dwell time
  
  workspace:save fires → useProjectData → getSnapshot() → saveProjectData(IndexedDB)
```

### 9. Theme System
- `ThemeProvider` wraps entire app in layout.tsx
- Uses lazy initializer to read `localStorage` (avoids flash)
- Toggles `.dark` class on `<html>` element
- `ThemeSwitch` component renders sun/moon icons

### 10. Category Color System
Each category has 3 color classes:
- `colorClass`: Background (e.g., `bg-primary-500`)
- `textColorClass`: Text color (e.g., `text-primary-500`)
- `ringColorClass`: Ring/border with opacity (e.g., `ring-primary-500/30`)

**Known issue**: Template literals like `bg-${color}/10` need lookup maps for Tailwind JIT.

## File Responsibilities
| File | Single Responsibility |
|---|---|
| `tools.ts` | 250+ tools, 8 categories, search, stats, nav, helpers |
| `icons.tsx` | 75 SVG icon components + iconMap registry (63 mapped) |
| `Sidebar.tsx` | Navigation sidebar with 8 category links |
| `CategorySection.tsx` | Collapsible category section with tool grid |
| `ToolCard.tsx` | Individual tool card with status badge |
| `HeroBanner.tsx` | Hero with live search across 250+ tools |
| `StatsBar.tsx` | 4 dynamic stat cards from hubStats |
| `QuickAccess.tsx` | Featured tools horizontal strip |
| `TopBar.tsx` | Header bar with title, theme toggle, notifications |
| `HeroBanner.tsx` | Welcome message + live search with dropdown results |
| `StatsBar.tsx` | 4 metric cards showing tool count, projects, credits, time |
| `QuickAccess.tsx` | Horizontal scroll strip of featured tools |
| `CategorySection.tsx` | Collapsible category header + responsive tool grid |
| `ToolCard.tsx` | Individual tool card with status, description, hover effects |

### 11. Document Font & Color Extraction Architecture (Session 105)
```
Upload Pipeline (src/lib/chiko/extractors/)
  ├── index.ts — ExtractedFileData { text, headings, tables, images, documentFonts?, documentColors?, ... }
  ├── pdf-extractor.ts — extractPdf(buffer)
  │     ├── getText() → plain text (unchanged)
  │     ├── load() → PDFDocumentProxy (pdfjs-dist)
  │     │     ├── getTextContent() → styles[fontName].fontFamily → cleanFontName()
  │     │     └── getOperatorList() → fnArray (OPS codes) → RGB/CMYK → hex → filterNeutrals
  │     └── Returns: { text, pageCount, documentFonts, documentColors }
  └── docx-extractor.ts — extractDocx(buffer)
        ├── mammoth.convertToHtml() → text (unchanged)
        ├── JSZip → raw XML parsing:
        │     ├── word/document.xml → <w:rFonts> fonts, <w:color>/<w:shd> colors
        │     ├── word/styles.xml → font families
        │     └── word/theme/theme1.xml → <a:latin> fonts, accent colors (boosted x10)
        └── Returns: { text, headings, tables, images, documentFonts, documentColors }

Data Flow:
  ChikoAssistant.tsx (fileContext) → route.ts (AI prompt injection)
    ├── "Document Fonts" section → explicit font→pairing mapping table (16 entries)
    ├── "Document Colors" section → FIRST color = accent, exact hex values
    └── Rule: "never override extracted styling with guesses"
```

### 12. WorkspaceUIKit Component API Patterns (Session 141)
**CRITICAL** — these API patterns were discovered empirically and differ from what you might assume:

```
Form Controls (Native Event Handlers):
  FormInput:      onChange={(e) => fn(e.target.value)}  — native ChangeEvent<HTMLInputElement>
  FormTextarea:   onChange={(e) => fn(e.target.value)}  — native ChangeEvent<HTMLTextAreaElement>
  FormSelect:     onChange={(e) => fn(e.target.value)}  — native ChangeEvent<HTMLSelectElement>
                  ⚠️ NO `options` prop — use <option> children: <FormSelect><option value="x">X</option></FormSelect>

Clean Value Callbacks:
  Toggle:           onChange={(checked: boolean) => fn(checked)}
  ChipGroup:        onChange={(value: string) => fn(value)}
                    direction: "horizontal" | "grid"  ⚠️ NOT "row"
  ColorSwatchPicker: onChange={(color: {hex, label}) => fn(color)}
                    colors: {hex: string, label: string}[]  ⚠️ NOT string[]
  RangeSlider:      onChange={(value: number) => fn(value)}

Common Mistakes to Avoid:
  ❌ onChange={(v) => fn(v)}         — FormInput/Textarea/Select don't pass clean values
  ❌ <FormSelect options={[...]} /> — FormSelect has no options prop
  ❌ direction="row"                 — ChipGroup only accepts "horizontal" | "grid"
  ❌ colors={strings[]}              — ColorSwatchPicker needs {hex, label}[] objects
```

### 13. HTML/CSS Workspace Build Pattern (Pattern A)
Standard structure for document-type tools (invoice, contract, resume, certificate, business plan, worksheet):

```
File Structure:
  src/lib/{tool}/schema.ts                           — Types, configs, defaults, factories
  src/stores/{tool}-editor.ts                        — Zustand + Immer + Zundo (temporal undo/redo)
  src/lib/{tool}/{Tool}Renderer.tsx                  — Paginated HTML/CSS renderer
  src/components/workspaces/{tool}/tabs/*Tab.tsx      — 3-5 editor tabs
  src/components/workspaces/{tool}/{Tool}LayersPanel.tsx  — Figma-style layers
  src/components/workspaces/{tool}/{Tool}Workspace.tsx    — 3-panel main component
  src/lib/chiko/manifests/{tool}.ts                  — Chiko AI action manifest

Registration Checklist:
  ✅ tools.ts: status → "ready", devStatus → "complete"
  ✅ page.tsx: dynamic import path
  ✅ credit-costs.ts: TOOL_CREDIT_MAP entry
  ✅ workspace-canvas.css: .{tool}-canvas-root highlight rules
  ✅ TOOL-STATUS.md: move to COMPLETE, add changelog

Store Middleware Stack:
  temporal(persist(immer((...) => ({ ...state, ...actions }))))
  partialize: (state) => ({...stateOnly}) as StateType  — cast needed for temporal compat
```
