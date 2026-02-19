# DMSuite — System Patterns

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

### 3. Client Component Strategy
- All interactive components use `"use client"` directive
- Local config state per workspace via `useState<XxxConfig>()` — workspace-specific settings
- Global design settings via Zustand `useAdvancedSettingsStore` — shared across all tools
- Sidebar open/close state in `useSidebarStore`

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
  └── renderToCanvas(doc, scale) — off-screen export

HitTest (hit-test.ts) — Selection Engine
  ├── hitTestDocument(doc, point) — top-down recursive
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
- Color custom properties: `--color-primary-500: #8ae600`
- Available colors: primary, secondary, gray, success, error, warning, info, wire-transfer, bank-transfer
- **NO pink, purple, or other default Tailwind colors** — only theme-defined colors

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
