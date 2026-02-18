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
- First bank: Icon Library (115 icons). Future banks: Patterns, Textures, Illustrations, Shapes, etc.
- Asset banks have ZERO dependencies on other modules (no circular imports)
- All workspaces and AI engines consume asset banks via simple imports

### 3. Client Component Strategy
- All interactive components use `"use client"` directive
- State management is local (useState) — Zustand stores planned
- Sidebar open/close state lifted to dashboard page, passed as props

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
