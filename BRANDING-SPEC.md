# DMSuite — Master Branding & Design System Specification

> **Version:** 1.0 — March 2026
> **Purpose:** Single reusable reference for every design & implementation decision.
> Every component, page, workspace, and animation MUST follow this spec.

---

## 1. Brand Identity

### 1.1 Brand Name
- **Full name:** DMSuite — AI Design & Business Suite
- **Short name:** DMSuite
- **Mascot:** Chiko — A friendly, futuristic AI robot assistant

### 1.2 Brand Personality
| Trait        | Expression                              |
|-------------|------------------------------------------|
| **Modern**  | Clean lines, generous whitespace, no clutter |
| **Futuristic** | Glow effects, glassmorphism, subtle gradients |
| **Friendly** | Rounded corners, warm accents, Chiko mascot |
| **Professional** | Consistent spacing, strict color palette, premium feel |
| **Minimalist** | Only essential elements, no decoration for decoration's sake |

### 1.3 Design Philosophy
1. **Less is more** — Remove before adding
2. **Mobile-first** — Design for phone screens first, then scale up
3. **One source of truth** — Every token, color, radius, shadow, spacing is defined in ONE place
4. **Consistency > creativity** — Use the system; don't invent one-offs
5. **Inclusive** — WCAG AA contrast ratios, touch-friendly targets, keyboard navigable

---

## 2. Color System — The Sacred Three + Neutrals

### 2.1 Three Brand Colors (STRICT)

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| **Primary** | Electric Lime | `#84cc16` | CTAs, active states, brand accent, links, primary buttons |
| **Secondary** | Cyan Spark | `#06b6d4` | Secondary accents, gradients WITH primary, info highlights |
| **Neutral** | Deep Slate | `#0f172a` (dark) / `#f8fafc` (light) | Backgrounds, text, surfaces |

> **RULE:** These three colors + their tonal scales + semantic colors are the ONLY colors anywhere on the platform. No other hue may appear unless it is a semantic status color.

### 2.2 Primary Scale (Electric Lime)
```
50:  #f7fee7     — Lightest tint (backgrounds in light mode)
100: #ecfccb     — Very light tint
200: #d9f99d     — Light tint
300: #bef264     — Light accent
400: #a3e635     — Active/hover in light mode
500: #84cc16     — ⭐ BRAND ANCHOR — Primary buttons, links, active indicators
600: #65a30d     — Pressed/active state
700: #4d7c0f     — Dark accent
800: #3f6212     — Very dark accent
900: #365314     — Darkest accent
950: #1a2e05     — Deepest (text on light bg)
```

### 2.3 Secondary Scale (Cyan Spark)
```
50:  #ecfeff     — Lightest tint
100: #cffafe     — Very light
200: #a5f3fc     — Light
300: #67e8f9     — Light medium
400: #22d3ee     — hover
500: #06b6d4     — ⭐ SECONDARY ANCHOR — Tags, secondary badges, accent gradients
600: #0891b2     — Pressed
700: #0e7490     — Dark
800: #155e75     — Very dark
900: #164e63     — Darkest
950: #083344     — Deepest
```

### 2.4 Neutral Scale (Slate)
```
50:  #f8fafc     — Page bg (light mode)
100: #f1f5f9     — Card bg (light), subtle bg
200: #e2e8f0     — Borders (light), disabled text
300: #cbd5e1     — Muted text (light)
400: #94a3b8     — Placeholder text, muted icons
500: #64748b     — Body text (light mode)
600: #475569     — Labels, secondary text (dark on light)
700: #334155     — Borders (dark mode)
800: #1e293b     — Card bg (dark), elevated surfaces
850: #172032     — Subtle elevation (dark, custom stop)
900: #0f172a     — Sidebar, panels (dark mode)
950: #0a0f1a     — Page bg (dark mode) — DEEPEST
```

### 2.5 Semantic Colors (System-Only)
These ONLY appear in their semantic context. Never as decoration.

| Color | Hex | Context |
|-------|-----|---------|
| Success | `#22c55e` | Tool ready, save confirmed, success toast |
| Error | `#ef4444` | Validation errors, delete actions, failure toast |
| Warning | `#f59e0b` | Beta tools, low credits, caution states |
| Info | `#3b82f6` | Coming soon tools, help tips, informational badges |

### 2.6 Color Usage Rules
1. **Dark mode is default** — `.dark` class on `<html>`. Light mode is secondary
2. **NEVER use a hex color directly in a component** — Always use token classes: `bg-primary-500`, `text-gray-400`
3. **NEVER invent a new color** — If you "need" a new color, you're doing it wrong
4. **Gradients**: Only `primary → secondary` direction. Never mix with semantic or gray
5. **Glow effects**: Only primary-500 with opacity (`shadow-primary-500/20`, `ring-primary-500/30`)
6. **Opacity tiers**: `/5` (ghost), `/10` (subtle), `/20` (hover), `/30` (ring/glow), `/50` (glass)
7. **Text hierarchy (dark mode)**: `white` → `gray-300` → `gray-400` → `gray-500` → `gray-600`
8. **Text hierarchy (light mode)**: `gray-900` → `gray-700` → `gray-500` → `gray-400`

### 2.7 Forbidden
- ❌ No reds, pinks, purples, oranges as decorative colors
- ❌ No colored category headers (all categories use primary-500 as accent)
- ❌ No rainbow effects or multi-color badges
- ❌ No `bg-blue-500`, `text-purple-600` or any Tailwind default palette colors
- ❌ No hardcoded hex (`#1e40af`) in component files

---

## 3. Typography System

### 3.1 Font Stack
| Role | Family | Weight Range | Usage |
|------|--------|-------------|-------|
| **Sans** | Inter | 400 (regular), 500 (medium), 600 (semibold), 700 (bold) | All UI text |
| **Mono** | JetBrains Mono | 400, 500 | Code, credit amounts, technical values |

### 3.2 Type Scale (Mobile-First)
| Token | Mobile | sm (640px+) | lg (1024px+) | Usage |
|-------|--------|------------|-------------|-------|
| `hero` | text-2xl | text-3xl | text-4xl | Hero banner headline |
| `pageTitle` | text-xl | text-2xl | — | Page/tool titles |
| `sectionTitle` | text-lg | — | — | Section headings |
| `cardTitle` | text-base | — | — | Card titles, list items |
| `body` | text-sm | — | — | Body paragraphs, descriptions |
| `caption` | text-xs | — | — | Muted labels, timestamps |
| `micro` | text-[0.625rem] | — | — | Uppercase stat labels, badges |

### 3.3 Typography Rules
1. **Font weight hierarchy**: Bold for titles → Semibold for interactive → Medium for emphasis → Regular for body
2. **Letter spacing**: `tracking-tight` on titles, default on body, `tracking-widest` on micro labels
3. **Line height**: Default (1.5) for body, `leading-tight` (1.25) for titles
4. **Max line length**: `max-w-prose` (65ch) for body copy — never let a line exceed this
5. **No font-size hacks**: No `text-[13px]` — use the scale tokens

---

## 4. Spacing & Layout System

### 4.1 Spacing Scale
All spacing uses Tailwind's 4px base unit. These are the ONLY values:

```
0    = 0px
0.5  = 2px
1    = 4px
1.5  = 6px
2    = 8px
2.5  = 10px
3    = 12px     ← Card gap (mobile)
4    = 16px     ← Standard padding, card gap (desktop)
5    = 20px
6    = 24px     ← Section padding
8    = 32px     ← Large section gap
10   = 40px
12   = 48px     ← Hero padding
16   = 64px     ← TopBar height
```

### 4.2 Layout Constants (from design-system.ts)
| Token | Value | Usage |
|-------|-------|-------|
| `topBarHeight` | h-16 (64px) | Fixed header height |
| `sidebarExpanded` | w-64 (256px) | Desktop pinned sidebar |
| `sidebarCollapsed` | w-16 (64px) | Desktop collapsed sidebar (icons only) |
| `mobileBottomNav` | h-14 (56px) | Mobile bottom navigation |
| `pageMaxWidth` | max-w-screen-2xl | Content area maximum |
| `pagePadding` | px-4 py-4 / sm:px-6 sm:py-6 | Edge padding |
| `canvasMaxWidth` | 560px | Default canvas display width |
| `settingsPanel` | w-80 (320px) | Left settings panel |
| `detailsPanel` | w-72 (288px) | Right details panel |

### 4.3 Grid System
| Breakpoint | Columns | Gap | Context |
|-----------|---------|-----|---------|
| Default (mobile) | 1 | gap-3 (12px) | Tool cards, settings panels |
| sm (640px) | 2 | gap-4 (16px) | Tool grid, stats |
| lg (1024px) | 3 | gap-4 (16px) | Tool grid |
| xl (1280px) | 4 | gap-4 (16px) | Dashboard tool grid |

### 4.4 Spacing Rules
1. **Mobile inner padding**: `p-4` (16px) everywhere — cards, sections, modals
2. **Desktop inner padding**: `p-6` (24px) on larger surfaces
3. **Gap between sibling cards**: `gap-3` mobile, `gap-4` desktop
4. **Section vertical spacing**: `space-y-6` between major sections
5. **Component internal spacing**: `space-y-3` or `space-y-4` within cards
6. **Icon-to-text gap**: `gap-2` (8px) for inline, `gap-3` (12px) for nav items
7. **Bottom safe padding**: `pb-20` on mobile pages (accounts for bottom nav + safe area)

---

## 5. Responsive Breakpoints (Mobile-First)

### 5.1 Breakpoint Definitions
| Token | Width | What Changes |
|-------|-------|-------------|
| **Default** | 0–639px | Single column, stacked layout, bottom nav visible, sidebar hidden |
| **sm** | 640px+ | 2 columns for grids, slightly larger typography |
| **md** | 768px+ | Desktop-ish layout begins, mobile tabs hide, all panels visible |
| **lg** | 1024px+ | Sidebar visible (collapsed or pinned), 3-column grids |
| **xl** | 1280px+ | 4-column grids, extra spacing, max-width containers |

### 5.2 Mobile-First Rules
1. **Default styles = mobile styles** — Add complexity at larger breakpoints, never the reverse
2. **Touch targets**: Minimum `44px × 44px` (size-11) for all tap targets on mobile
3. **Bottom nav**: `h-14` fixed at bottom for mobile (`lg:hidden`)
4. **Sidebar**: Overlay drawer on mobile, collapsible panel on desktop
5. **Tool workspaces**: Mobile tab bar (`md:hidden`) to switch between Canvas/Content and Settings
6. **Chiko FAB**: Positioned above bottom nav with safe-area respect
7. **Chiko panel**: Full-screen on mobile (`inset-0`), drawer on desktop (`w-96`)
8. **Scrolling**: Use `dvh` units instead of `vh` (respects mobile browser chrome)
9. **Horizontal overflow**: NEVER on mobile — all content must wrap or scroll
10. **Input fields**: `text-base` minimum (prevents iOS zoom on focus)

### 5.3 Safe Area Support
```css
padding-bottom: env(safe-area-inset-bottom, 0px);
padding-top: env(safe-area-inset-top, 0px);
```
Applied to: bottom nav, FABs, fixed headers, modal bottoms

---

## 6. Component Recipes (Global)

### 6.1 Surface Elevation Hierarchy (Dark Mode)
```
Layer 0 — Page background:      bg-gray-950 (#0a0f1a)
Layer 1 — Sidebar / top panels: bg-gray-900 (#0f172a)
Layer 2 — Cards, sections:      bg-gray-900 (#0f172a) + border border-gray-800
Layer 3 — Elevated (modals):    bg-gray-800 (#1e293b)
Layer 4 — Overlays:             bg-gray-900/50 backdrop-blur-xl (glass)
```

### 6.2 Surface Elevation Hierarchy (Light Mode)
```
Layer 0 — Page background:      bg-gray-50 (#f8fafc)
Layer 1 — Sidebar / top panels: bg-white
Layer 2 — Cards:                bg-white + border border-gray-200
Layer 3 — Elevated (modals):    bg-white + shadow-lg
Layer 4 — Overlays:             bg-white/50 backdrop-blur-xl (glass)
```

### 6.3 Card Pattern
```tsx
// Standard card — EVERYWHERE
className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"

// Interactive card (tool cards, clickable)
className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900
           hover:border-gray-300 dark:hover:border-gray-700
           hover:-translate-y-0.5 hover:shadow-lg
           transition-all duration-200 cursor-pointer"

// Glass card (hero, modals over blurred bg)
className="rounded-2xl border border-white/10 dark:border-gray-700/50
           bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl"

// Active/highlighted card
className="rounded-2xl border-2 border-primary-500/30 bg-primary-500/5"
```

### 6.4 Button Patterns
```tsx
// Primary button
className="h-10 px-4 rounded-lg font-semibold text-sm
           bg-primary-500 text-gray-950
           hover:bg-primary-400 active:bg-primary-600
           transition-colors shadow-sm shadow-primary-500/20"

// Secondary button
className="h-10 px-4 rounded-lg font-medium text-sm
           bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
           hover:bg-gray-200 dark:hover:bg-gray-700
           border border-gray-200 dark:border-gray-700
           transition-colors"

// Ghost button
className="h-10 px-4 rounded-lg font-medium text-sm
           text-gray-600 dark:text-gray-400
           hover:text-gray-900 dark:hover:text-gray-200
           hover:bg-gray-100 dark:hover:bg-gray-800
           transition-colors"

// Icon button
className="flex items-center justify-center size-10 rounded-lg
           text-gray-500 hover:text-gray-700 dark:hover:text-gray-200
           hover:bg-gray-100 dark:hover:bg-gray-800
           transition-colors"
```

### 6.5 Badge Patterns
```tsx
// Status badges (ONLY semantic)
"Ready"       → bg-success/15 text-success
"Beta"        → bg-warning/15 text-warning
"Coming Soon" → bg-info/15 text-info

// Brand badge (AI/Pro)
className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
           bg-primary-500/10 text-primary-500 text-xs font-medium"

// Count badge
className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800
           text-gray-500 text-xs font-medium"

// Credit badge
className="px-2 py-0.5 rounded-full bg-primary-500/10
           text-primary-500 text-xs font-mono font-medium"
```

### 6.6 Input Patterns
```tsx
// Text input
className="w-full h-10 rounded-lg px-3 text-sm
           bg-gray-100 dark:bg-gray-800/50
           border border-gray-200 dark:border-gray-700
           text-gray-900 dark:text-gray-200
           placeholder:text-gray-400
           focus:outline-none focus:ring-2 focus:ring-primary-500/40
           focus:border-primary-500/50 transition-all"

// Search input with icon
className="w-full h-10 rounded-lg pl-10 pr-4 text-sm ..."
```

---

## 7. Radius System
| Token | Value | Usage |
|-------|-------|-------|
| `rounded-md` | 6px | Small: badges, toggles, tooltips |
| `rounded-lg` | 8px | Standard: buttons, inputs, small cards |
| `rounded-xl` | 12px | Medium: dropdown menus, modals, panels |
| `rounded-2xl` | 16px | Large: cards, sections, workspace panels |
| `rounded-3xl` | 24px | XL: hero card, splash elements |
| `rounded-full` | 9999px | Pills: tags, badges, avatar, FABs |

---

## 8. Shadow System
| Token | Classes | Usage |
|-------|---------|-------|
| **None** | — | Default for most elements |
| **Subtle** | `shadow-sm` | Buttons, tags |
| **Card hover** | `shadow-lg shadow-black/5 dark:shadow-black/20` | Card hover states |
| **Brand glow** | `shadow-lg shadow-primary-500/20` | Logo, primary FAB, brand elements |
| **Sidebar overlay** | `shadow-2xl shadow-black/20 dark:shadow-black/50` | Expanded sidebar overlay |
| **Modal** | `shadow-2xl` | Modals, dropdowns, command palette |

---

## 9. Animation & Motion System

### 9.1 Timing
| Token | Duration | Usage |
|-------|----------|-------|
| `fast` | 150ms | Color changes, opacity, icon swaps |
| `normal` | 200ms | Most transitions: hover, focus, toggle |
| `slow` | 300ms | Layout shifts, panel open/close |
| `slower` | 500ms | Complex entrances, page transitions |

### 9.2 Easing
| Token | Curve | Usage |
|-------|-------|-------|
| `default` | ease-in-out | Most UI transitions |
| `spring` | cubic-bezier(0.175, 0.885, 0.32, 1.275) | Bouncy entrances, FAB, Chiko |
| `snappy` | cubic-bezier(0.23, 1, 0.32, 1) | Quick transitions, tooltip |

### 9.3 Framer Motion Presets
```tsx
// Fade in
initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}

// Slide up
initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}

// Scale in
initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}

// Spring bounce
transition={{ type: "spring", damping: 25, stiffness: 300 }}

// Stagger children
transition={{ staggerChildren: 0.05 }}
```

### 9.4 Animation Rules
1. **Every animation must have a purpose** — no decoration animations
2. **Duration ≤ 300ms** for micro-interactions (hover, toggle, badge)
3. **Duration 300–500ms** for layout changes (panel open, modal entrance)
4. **Infinite animations ONLY for**: Chiko idle, loading indicators, ambient glows
5. **prefer-reduced-motion**: All infinite animations MUST respect `prefers-reduced-motion: reduce`
6. **No jank**: Transform/opacity only — never animate width, height, top, left

---

## 10. Chiko Mascot Branding

### 10.1 Identity
- **Name**: Chiko
- **Persona**: Friendly, helpful, slightly playful AI companion
- **Form**: Rounded robot with glowing lime eyes, antenna, modern geometric body
- **Color**: Primary lime (`#84cc16`) eyes + accents, cyan (`#06b6d4`) antenna tip, gray-200 body

### 10.2 Expression States
| State | Trigger | Visual |
|-------|---------|--------|
| `idle` | Default standing | Gentle floating bob (2px, 3s ease-in-out infinite) |
| `thinking` | Generating AI response | Head tilt, eyes narrow, body sway |
| `speaking` | Response streaming | Subtle bounce, eyes open wider |
| `happy` | Task completed | Quick excited bounce, eyes squint |
| `listening` | Waiting for input | Slight head tilt, alert posture |
| `error` | Failure state | Slight head droop, eyes dim |
| `success` | Confirmation | Eyes glow brighter, brief sparkle |

### 10.3 Animation Physics
1. **Gravity feel**: All vertical motion uses spring easing with bounce
2. **Breathing**: 3s cycle, subtle scale on glow ring (0.95 → 1.05)
3. **Eye blink**: Random interval (3–6s), quick (150ms squish and recover)
4. **Response to interaction**: All expression changes tween smoothly (200ms)
5. **Never static**: Even in idle state, Chiko always has micro-motion (glow + float)
6. **Physics-based**: Use `type: "spring"` with real-world damping/stiffness values
7. **Deceleration**: All motion decelerates naturally — never stops abruptly

### 10.4 Chiko Sizes
| Size | Dimensions | Where |
|------|-----------|-------|
| `xs` | 24×24 | Inline with text (badges, labels) |
| `sm` | 32×32 | Chat avatar, message thread |
| `md` | 48×48 | FAB, sidebar |
| `lg` | 80×80 | Chat panel header |
| `xl` | 120×120 | Onboarding, empty states |
| `hero` | 200×200 | Landing page, about section |

---

## 11. Icon System

### 11.1 Architecture
- **All icons are custom inline SVGs** in `src/components/icons.tsx`
- **Registered in `iconMap`** with string keys for data-driven lookup
- **Fallback**: `getIcon(key)` returns `FallbackIcon` when key is missing
- **Style**: 24×24 viewBox, 2px stroke, round caps & joins, `currentColor`

### 11.2 Icon Usage Rules
1. **Always use `getIcon(key)`** — NEVER `iconMap[key]` directly
2. **Size with Tailwind**: `className="size-5"` (20px standard), `size-4` (16px small), `size-6` (24px large)
3. **Color via inheritance**: Icons use `currentColor` — set color on parent
4. **Consistency**: Same icon = same meaning everywhere. Don't reuse icons for different concepts
5. **Branded feel**: All icons use rounded strokes (2px wide) for friendly, modern appearance

### 11.3 Branded UI Shapes
```
• Round elements: rounded-full (avatars, FABs, badges, status dots)
• Cards: rounded-2xl (consistent 16px radius)
• Buttons: rounded-lg (8px radius)
• Inputs: rounded-lg (8px radius)
• Logo mark: rounded-xl (12px radius) with gradient fill
```

---

## 12. Mobile Workspace Pattern

### 12.1 Universal Mobile Tab Component
Every tool workspace on mobile MUST use the shared mobile tab pattern:

```tsx
// Mobile tabs (hidden on md+ where all panels are visible)
<div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
  {tabs.map((tab, i) => (
    <button
      key={tab}
      onClick={() => setMobileTab(i)}
      className={cn(
        "flex-1 py-3 text-xs font-semibold capitalize transition-colors",
        mobileTab === i
          ? "text-primary-500 border-b-2 border-primary-500"
          : "text-gray-400 hover:text-gray-300"
      )}
    >
      {tab}
    </button>
  ))}
</div>

// Each panel: hidden unless its tab is active (on mobile)
<div className={cn("w-full lg:w-80", mobileTab !== tabIndex && "hidden md:block")}>
  {panel}
</div>
```

### 12.2 Workspace Layout Rules
1. **Canvas/content panel**: `order-1` (always first on mobile)
2. **Settings panel**: `order-2` (second tab on mobile, left side on desktop)
3. **Details/layers panel**: `order-3` (third tab on mobile, right side on desktop)
4. **Direction**: `flex flex-col lg:flex-row`
5. **Desktop sticky**: Canvas uses `lg:sticky lg:top-4`
6. **Height**: `min-h-[calc(100dvh-260px)]` (use dvh, respect topbar + breadcrumb)
7. **Bottom padding on mobile**: `pb-20` to clear bottom nav

---

## 13. Global Architecture Rules

### 13.1 File Organization
```
globals.css          — ONLY place for CSS @theme tokens
design-system.ts     — ONLY place for layout/surface/recipe class patterns
tokens.ts            — ONLY place for JS color/font/breakpoint values
z-index.ts           — ONLY place for stacking context values
colors.ts            — ONLY place for safe JIT color class maps
```

### 13.2 What Must Be Global
| Concern | File | Why |
|---------|------|-----|
| Color palette | globals.css | One palette change propagates everywhere |
| Font families | globals.css | Font swap = one edit |
| Spacing scale | Tailwind default | Never custom spacing |
| Surface patterns | design-system.ts | Cards/panels look identical everywhere |
| Typography scale | design-system.ts | Heading sizes consistent |
| Border patterns | design-system.ts | Border colors/widths consistent |
| Shadow patterns | design-system.ts | Hover effects identical |
| Animation timing | design-system.ts | Motion feels unified |
| Z-index layers | z-index.ts | No stacking conflicts |
| Status badges | design-system.ts | Ready/Beta/Coming consistent |
| Button patterns | design-system.ts | Same buttons everywhere |

### 13.3 What Must NOT Be Global
- Tool-specific logic (each workspace owns its config)
- Tool-specific data (all in `src/data/tools.ts`)
- Canvas rendering code (per-tool, uses tokens for colors only)

### 13.4 Import Pattern
```tsx
// CORRECT — import from design system
import { surfaces, borders, typography, recipes } from "@/lib/design-system";

// CORRECT — use Tailwind token classes
className="bg-primary-500 text-gray-400 rounded-2xl"

// WRONG — hardcoded values
className="bg-[#84cc16] text-[#94a3b8]"
style={{ borderRadius: "16px", color: "#1e293b" }}
```

---

## 14. Accessibility Standards

1. **Color contrast**: WCAG AA minimum (4.5:1 for body text, 3:1 for large text)
2. **Touch targets**: 44×44px minimum on mobile (size-11)
3. **Focus rings**: Visible `ring-2 ring-primary-500/40` on all interactive elements
4. **Skip link**: "Skip to main content" link at top of page
5. **ARIA labels**: All icon-only buttons must have `aria-label`
6. **Keyboard nav**: Tab through all interactive elements, Enter/Space to activate
7. **Reduced motion**: Respect `prefers-reduced-motion: reduce` for infinite animations
8. **Semantic HTML**: `<nav>`, `<main>`, `<header>`, `<section>`, `<button>` — not `<div onClick>`

---

## 15. Performance Rules

1. **Dynamic imports**: All workspace components loaded with `next/dynamic`
2. **SSR false**: Client-only components (Chiko, bottom nav, canvas editors) marked `{ ssr: false }`
3. **Image optimization**: Use `next/image` with proper width/height/sizes
4. **Font loading**: `display: swap` on both font families
5. **Bundle splitting**: Each tool workspace is a separate chunk
6. **Icons inline**: SVG icons inline (no HTTP requests, tree-shakeable)

---

## 16. Checklist for Every New Component

- [ ] Uses design-system.ts tokens for surfaces, borders, typography
- [ ] Zero hardcoded hex colors
- [ ] Zero hardcoded pixel values (use Tailwind spacing)
- [ ] Mobile-first classes (default = mobile, then `sm:`, `md:`, `lg:`)
- [ ] Touch targets ≥ 44px on mobile
- [ ] Dark mode variant for every surface/text color
- [ ] Focus ring on interactive elements
- [ ] ARIA label on icon-only buttons
- [ ] Transitions use design system timing (200ms default)
- [ ] Uses `cn()` for conditional class composition
- [ ] Rounded corners follow radius system
- [ ] Only brand colors (primary, secondary, gray, semantic)

---

## 17. Quick Reference Card

```
PALETTE:    Lime #84cc16 | Cyan #06b6d4 | Slate #0a0f1a–#f8fafc
FONTS:      Inter (UI) | JetBrains Mono (code/numbers)
RADIUS:     md (btn) → lg (input) → xl (dropdown) → 2xl (card) → full (pill)
SPACING:    4px base → p-4 standard → gap-3/gap-4 grid → p-6 section
SHADOWS:    none → sm → lg → 2xl (ascending elevation)
MOTION:     150ms fast → 200ms normal → 300ms slow → spring for Chiko
GRID:       1 col → sm:2 → lg:3 → xl:4
SIDEBAR:    64px collapsed → 256px expanded (desktop only)
TOPBAR:     64px height
BOTTOM NAV: 56px height (mobile only ≤lg)
CHIKO FAB:  Above bottom nav, 48px circle
```

---

*This document is the single source of truth for DMSuite's visual identity.
Every designer, developer, and AI agent working on this platform must follow it.
Any deviation is a bug.*
