# DMSuite — Canonical Tool Creation Guide

> **Purpose:** This document is the single authoritative reference for any AI agent, developer, or contributor building a new tool workspace in DMSuite. It codifies every architectural pattern, UI convention, Chiko integration contract, state management recipe, and styling rule observed across all existing production-quality tools. Follow this guide line-for-line to produce a workspace that is visually indistinguishable from every other tool in the suite — while remaining fully flexible for tool-specific controls and logic.

---

## TABLE OF CONTENTS

1. [Platform Identity](#1-platform-identity)
2. [Technology Stack & Constraints](#2-technology-stack--constraints)
3. [File Architecture & Naming](#3-file-architecture--naming)
4. [Tool Registration in the Data Layer](#4-tool-registration-in-the-data-layer)
5. [Workspace Layout Patterns](#5-workspace-layout-patterns)
6. [Shared UI Component Library](#6-shared-ui-component-library)
7. [Zustand Store Architecture](#7-zustand-store-architecture)
8. [Tab System & Editor Panel](#8-tab-system--editor-panel)
9. [Canvas / Preview Panel](#9-canvas--preview-panel)
10. [Layers Panel](#10-layers-panel)
11. [Canvas Section Highlighting](#11-canvas-section-highlighting)
12. [Zoom, Page Navigation & Scroll Sync](#12-zoom-page-navigation--scroll-sync)
13. [Mobile & Responsive Rules](#13-mobile--responsive-rules)
14. [Toolbar, Undo/Redo & Keyboard Shortcuts](#14-toolbar-undoredo--keyboard-shortcuts)
15. [Export, Print & Download](#15-export-print--download)
16. [Chiko AI Manifest Contract](#16-chiko-ai-manifest-contract)
17. [Activity Logging & Revert System](#17-activity-logging--revert-system)
18. [Business Memory Integration](#18-business-memory-integration)
19. [Advanced Settings Integration](#19-advanced-settings-integration)
20. [Workspace Events & Milestone Progress](#20-workspace-events--milestone-progress)
21. [Credit System Integration](#21-credit-system-integration)
22. [Wizard-to-Editor Pattern](#22-wizard-to-editor-pattern)
23. [Renderer Component Pattern](#23-renderer-component-pattern)
24. [Color, Typography & Token Rules](#24-color-typography--token-rules)
25. [Animation & Motion Rules](#25-animation--motion-rules)
26. [Accessibility Requirements](#26-accessibility-requirements)
27. [Testing & Validation Checklist](#27-testing--validation-checklist)
28. [TOOL-STATUS.md & devStatus Tracking](#28-tool-statusmd--devstatus-tracking)
29. [Complete Scaffold Template](#29-complete-scaffold-template)
30. [Reference Implementations](#30-reference-implementations)

---

## 1. PLATFORM IDENTITY

DMSuite is a dark-first, glassmorphic, AI-powered creative suite. Every tool must embody these design principles:

- **Visual Language:** Electric Violet primary (`#8b5cf6`), Neon Cyan secondary (`#06b6d4`), Cosmic Slate neutrals (`#070b14` darkest). Glassmorphic surfaces with backdrop-blur, translucent borders (`border-white/[0.06]`), and ambient gradient orbs behind content.
- **Interaction Feel:** Hover-lift cards, smooth 200–300ms transitions, Framer Motion for expand/collapse/tabs. Micro-interactions on every interactive element.
- **Typography:** Inter for body, JetBrains Mono for code/values. Tight, compact labels at 10–11px; body at 13px; headings at 14–16px in editor panels. All uppercase for section labels and tab text.
- **Dark-First:** Dark mode is default. Every surface needs both `dark:` and light variants. Dark hierarchy: `gray-950` body → `gray-900` sidebar → `gray-800/60` inputs → `gray-700/60` borders.
- **Premium Feel:** No generic template aesthetics. Every pixel must feel like a paid professional product.

---

## 2. TECHNOLOGY STACK & CONSTRAINTS

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js (App Router, Turbopack) | 16+ | File-based routing in `src/app/` |
| UI | React | 19 | Standard hooks, `"use client"` for interactivity |
| Language | TypeScript | 5.x strict | No `any` types, no `@ts-ignore` |
| Styling | Tailwind CSS v4 | `@theme inline` | **No** `tailwind.config.js`, **no** arbitrary values when tokens exist |
| State | Zustand 5 | + Zundo (temporal) + Immer | Persisted in localStorage |
| Animation | Framer Motion | 12+ | All expand/collapse, tab transitions, modals |
| Icons | Custom inline SVGs | `src/components/icons.tsx` | 81+ icons + `iconMap` registry |

### Hard Rules

- **NEVER** hardcode hex colors — use Tailwind tokens: `bg-primary-500`, `text-gray-400`
- **NEVER** use pixel values — use Tailwind spacing: `p-5`, `gap-6`, `h-9`
- **NEVER** use `bg-gradient-to-br` — Tailwind v4 syntax is `bg-linear-to-br`
- **NEVER** use `w-[4.5rem]` when a token exists — use `w-18`
- **NEVER** inline mock data in components — all data lives in `src/data/`
- **NEVER** use raw `iconMap[key]` in JSX — use `getIcon(key)` helper (returns FallbackIcon for missing keys)
- **ALL** interactive components must have `"use client"` directive
- **ALL** form state must live in Zustand stores, not component-local `useState`

---

## 3. FILE ARCHITECTURE & NAMING

For a new tool with id `{tool-id}` in category `{category-id}`:

```
src/
├── components/workspaces/{tool-id}/
│   ├── {ToolName}Workspace.tsx         # Main workspace component (Pattern 1, 2, or 3)
│   ├── {ToolName}Renderer.tsx          # Document/canvas renderer (HTML for preview/print)
│   ├── {ToolName}LayersPanel.tsx        # Figma-style layer tree (for document tools)
│   ├── tabs/                            # Editor tab content components
│   │   ├── {ToolName}ContentTab.tsx     # Primary content/data editing tab
│   │   ├── {ToolName}StyleTab.tsx       # Template, colors, fonts
│   │   ├── {ToolName}FormatTab.tsx      # Page size, margins, print settings
│   │   └── {ToolName}{Custom}Tab.tsx    # Tool-specific tabs as needed
│   └── editor/                          # Sub-components for complex editing panels
│       └── {ToolName}EditorPanel.tsx
├── stores/{tool-id}-editor.ts           # Zustand store (temporal + persist + immer)
├── lib/{tool-id}/                       # Business logic, schemas, utilities
│   ├── schema.ts                        # Zod schemas, TypeScript types, defaults
│   └── export.ts                        # Export handlers (PDF, DOCX, etc.)
└── lib/chiko/manifests/{tool-id}.ts     # Chiko AI action manifest
```

### Shared Infrastructure Files (Already Exist — Import, Don't Recreate)

```
src/
├── lib/
│   ├── workspace-events.ts              # Typed event constants + dispatch helpers
│   └── workspace-constants.ts           # Zoom limits, page thresholds, milestone counts
├── styles/
│   └── workspace-canvas.css             # Section highlighting CSS for all tool canvases
└── components/workspaces/shared/
    ├── WorkspaceUIKit.tsx               # Re-exports all shared UI components
    └── WorkspaceErrorBoundary.tsx       # React error boundary for workspace panels
```

### Naming Conventions

| Component | Convention | Example |
|-----------|-----------|---------|
| Workspace component | `{PascalName}Workspace` | `CertificateDesignerWorkspace` |
| Store hook | `use{PascalName}Editor` | `useCertificateEditor` |
| Store state interface | `{PascalName}EditorState` | `CertificateEditorState` |
| Renderer component | `{PascalName}Renderer` | `CertificateRenderer` |
| Layers panel | `{PascalName}LayersPanel` | `CertificateLayersPanel` |
| Chiko manifest factory | `create{PascalName}Manifest` | `createCertificateManifest` |
| Store persistence key | `dmsuite-{tool-id}` | `"dmsuite-certificate-designer"` |

---

## 4. TOOL REGISTRATION IN THE DATA LAYER

### Step 1: Add to `src/data/tools.ts`

Add a `Tool` object inside the correct category's `tools` array:

```typescript
{
  id: "certificate-designer",           // Kebab-case, used in URLs
  name: "Certificate Designer",          // Display name
  description: "Design professional certificates and awards", // One line
  icon: "award",                         // Key from iconMap in icons.tsx
  status: "ready",                       // "ready" | "beta" | "coming-soon"
  tags: ["certificate", "award", "diploma", "achievement", "print"],
  devStatus: "scaffold",                 // Start as scaffold, mark complete when done
  aiProviders: ["claude"],               // AI providers used
  outputs: ["pdf", "png", "jpg"],        // Export formats
  supportsPartEdit: true,                // Can edit individual elements
  printReady: true,                      // Supports print output
  printSizes: ["A4", "letter", "A5"],    // Available sizes
}
```

### Step 2: Add icon if missing

If the icon key doesn't exist in `src/components/icons.tsx`, add the SVG component there and register it in `iconMap`:

```typescript
export function IconAward(props: SVGProps) { return <svg ...>...</svg>; }
// In iconMap:
award: IconAward,
```

### Step 3: Register in Tool Page Router

In `src/app/tools/[categoryId]/[toolId]/page.tsx`, add a dynamic import case:

```typescript
case "certificate-designer":
  return dynamic(() => import("@/components/workspaces/certificate-designer/CertificateDesignerWorkspace"));
```

### Step 4: Add credit mapping in `src/data/credit-costs.ts`

```typescript
// In TOOL_CREDIT_MAP:
"certificate-designer": "certificate-design",

// In CREDIT_COSTS (if new operation):
"certificate-design": 15,
```

### Step 5: Update `TOOL-STATUS.md`

Add the tool to the appropriate section (SCAFFOLD → COMPLETE when finished).

---

## 5. WORKSPACE LAYOUT PATTERNS

Every tool in DMSuite uses one of three workspace layout patterns. Choose the pattern that best fits the tool's interaction model.

### Pattern A: Multi-Tab Editor with Preview + Layers

**Used by:** Contract Designer, Invoice Designer, Resume Editor, Sales Book Designer, Quote/Estimate, Receipt, Purchase Order, Delivery Note, Credit Note, Proforma Invoice

**Layout:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ (Tool Page Shell - h-12 compact header provided by page.tsx)            │
├───────────────┬─────────────────────────────────────┬───────────────────┤
│ Editor Panel  │ Preview/Canvas Panel                │ Layers Panel      │
│ (w-80 fixed)  │ (flex-1)                            │ (w-56 / w-8)      │
│               │                                     │                   │
│ WorkspaceHdr  │ Toolbar: zoom, template, export     │ "Layers" header   │
│ EditorTabNav  │ ┌───────────────────────────┐       │ Layer tree        │
│               │ │                           │       │  └─ Section A     │
│ Tab Content:  │ │   Rendered Document       │       │  └─ Section B     │
│ • Scrollable  │ │   (zoom-scaled)           │       ��  └─ Section C     │
│ • AccordionSx │ │                           │       │                   │
│ • Form inputs │ └───────────────────────────┘       │ Legend footer     │
│               │ Page Nav: [◀] [●●●] [▶]            │ [Collapse ▶]      │
│ [Start Over]  │                                     │                   │
├───────────────┴─────────────────────────────────────┴───────────────────┤
│ Mobile BottomBar (lg:hidden): [Edit] [Preview] [Export←primary]         │
└──────────────────────────────────────────────────────────────────────────┘
```

**Editor Panel (Left):**
- Fixed width `lg:w-80 xl:w-96`
- Contains `WorkspaceHeader` → `EditorTabNav` → tab content → "Start Over" button
- Scrollable content area with `overflow-y-auto scrollbar-thin`

**Preview Panel (Center):**
- `flex-1` fills remaining space
- Dark background `bg-gray-800` or `bg-gray-900`
- Document centered with `flex items-start justify-center`
- Zoom-scaled via CSS `transform: scale(zoom/100)` with `transform-origin: top center`
- Above document: toolbar row with zoom controls, template strip, export button
- Below document: page navigation bar

**Layers Panel (Right):**
- Expanded: `w-56` with full layer tree
- Collapsed: `w-8` vertical tab with icon + rotated "Layers" text
- Toggle between states on click
- Desktop only: `hidden lg:flex`

### Pattern B: Wizard-to-Editor

**Used by:** Business Card, Resume/CV, Brochure, Presentation (tools with multi-step data collection before generation)

**Flow:**
```
Steps 0-N: Wizard (centered cards, step indicators, animations)
  → AI Generation Step (loading spinner, progress)
  → Full Editor (identical to Pattern A)
```

**Wizard Phase:**
- Centered content `max-w-2xl mx-auto`
- Step indicator strip at top
- Framer Motion `AnimatePresence` for step transitions:
  ```typescript
  enter: { y: direction === "forward" ? 60 : -60, opacity: 0, scale: 0.98 }
  center: { y: 0, opacity: 1, scale: 1 }
  exit: { y: direction === "forward" ? -60 : 60, opacity: 0, scale: 0.98 }
  ```
- Next/Back buttons at bottom
- Progress dispatched per step: `workspace:progress { progress: stepPercent }`

**Editor Phase:**
- Identical to Pattern A (3-panel layout with tabs, preview, layers)
- Workspace component wraps both phases and conditionally renders

### Pattern C: Canvas-Based Layer Editor

**Used by:** Social Media Post, Poster/Flyer, Banner Ad, Logo Generator (freeform visual editors)

**Layout:**
```
┌────────────────┬──────────────────────────────┬──────────────┐
│ Settings Panel │ Interactive Canvas           │ Layers+Export │
│ (w-80)         │ (flex-1)                     │ Panel         │
│                │ Zoom controls                │              │
│ Format dropdown│ ┌─────────────────────┐      │ ◉ Layer 1    │
│ Color pickers  │ │ Click/drag canvas   │      │ ◯ Layer 2    │
│ Font selectors │ │ Selection handles   │      │ ○ Layer 3    │
│ Text inputs    │ │ Resize + rotate     │      │              │
│                │ └─────────────────────┘      │ Export tab   │
│ Accordion sxns │ Resolution info              │ PNG/JPG/SVG  │
└────────────────┴──────────────────────────────┴──────────────┘
```

---

## 6. SHARED UI COMPONENT LIBRARY

**Import from:** `@/components/workspaces/shared/WorkspaceUIKit`

Every tool workspace MUST use these shared components for UI consistency. Never create custom versions of these primitives.

### Core Form Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `FormInput` | Text input | `label?, hint?, ...InputHTMLAttributes` |
| `FormTextarea` | Multi-line input | `label?, hint?, ...TextareaHTMLAttributes` |
| `FormSelect` | Dropdown select | `label?, hint?, ...SelectHTMLAttributes` |
| `Toggle` | On/off switch | `checked, onChange, label, description?` |
| `RangeSlider` | Numeric slider | `label, value, onChange, min, max, step?, suffix?` |
| `ColorSwatchPicker` | Color selection | `colors, value, onChange` |
| `ChipGroup` | Pill selector | `options, value, onChange, direction?, columns?` |

### Layout Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `AccordionSection` | Collapsible section | `title, icon, isOpen, onToggle, badge?, highlighted?` |
| `EditorTabNav` | Tab navigation | `tabs: EditorTab[], activeTab, onTabChange` |
| `WorkspaceHeader` | Panel header bar | `title, subtitle?, statusDot?, children (right slot)` |
| `BottomBar` | Mobile action bar | `actions, activeKey?, onAction` |
| `MobileTabBar` | Mobile tab switch | `tabs, activeTab, onTabChange` |
| `SectionLabel` | Section heading | `children` (uppercase, 11px, gray-500) |
| `EmptyState` | No-content placeholder | `icon?, title, description?, action?` |
| `SectionCard` | Content container | `title?, description?, children` |

### Button Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `ActionButton` | CTA button | `variant: "primary"/"secondary"/"ghost"/"danger", size?, icon?` |
| `IconButton` | Icon-only button | `icon, tooltip?, ...ButtonHTMLAttributes` |
| `ConfirmDialog` | Destructive confirm | `open, title, description?, variant?, onConfirm, onCancel` |

### Utility Components

| Component | Purpose |
|-----------|---------|
| `SIcon` | Inline SVG path helper: `<SIcon d="M..." extra?={} />` |
| `Icons` | Pre-built SVG icons: `Icons.undo`, `Icons.redo`, `Icons.print`, etc. |
| `TabIcons` | Tab-specific icons: `TabIcons.form`, `TabIcons.brand`, `TabIcons.style`, `TabIcons.print` |
| `InfoBadge` | Small badge: variants `"default"`, `"primary"`, `"muted"` |
| `AdvancedToggle` | Progressive disclosure: chevron + "Advanced" label |
| `SelectionCard` | Template/option picker card with selected state + checkmark |
| `WorkspaceErrorBoundary` | React error boundary for workspace tab content — catches runtime errors with retry UI |

### Styling Constants (Follow These Exactly)

```
// Form Inputs
Input bg:     bg-gray-800/60
Input border: border-gray-700/60
Focus border: border-primary-500/50
Focus ring:   ring-2 ring-primary-500/20
Input text:   text-[13px] text-gray-200
Label:        text-[11px] font-medium text-gray-500 mb-1.5
Hint:         text-[10px] text-gray-600 mt-1

// Section Headers
SectionLabel: text-[11px] font-semibold text-gray-500 uppercase tracking-wider

// Tab Navigation
Tab text:     text-[11px] font-semibold uppercase tracking-wide
Active tab:   text-primary-400 (animated underline via Framer Motion layoutId)
Inactive tab: text-gray-500 hover:text-gray-300

// Buttons
Primary:      bg-primary-500 text-gray-950 hover:bg-primary-400 shadow-sm shadow-primary-500/20
Secondary:    bg-gray-800 text-gray-200 border border-gray-700/60 hover:bg-gray-700
Ghost:        text-gray-400 hover:text-gray-200 hover:bg-white/6
Danger:       bg-error/15 text-error border border-error/20 hover:bg-error/25

// Toggle Switch
Track off:    bg-gray-700
Track on:     bg-primary-500
Thumb:        bg-white shadow-sm (translate-x-0 ↔ translate-x-4)

// Accordion Section
Border:       border-b border-gray-800/40
Button:       px-4 py-3.5, text-[13px] font-medium text-gray-200
Expand anim:  Framer Motion height: 0→auto, opacity: 0→1, duration 250ms

// Workspace Header
Height:       h-11
Background:   bg-gray-900/30
Border:       border-b border-gray-800/40
Title:        text-xs font-semibold text-gray-300 uppercase tracking-wide
Subtitle:     text-[10px] font-mono text-gray-600
```

---

## 7. ZUSTAND STORE ARCHITECTURE

Every tool editor must have a dedicated Zustand store following this exact pattern:

### Store File Template (`src/stores/{tool-id}-editor.ts`)

```typescript
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";

// ━━━ Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface {ToolName}FormData {
  // All tool-specific form fields
}

interface {ToolName}EditorState {
  form: {ToolName}FormData;

  // ── Actions ──
  update{Section}: (data: Partial<{SectionType}>) => void;
  setTemplate: (template: string) => void;
  setAccentColor: (color: string) => void;
  resetForm: () => void;
  setForm: (data: {ToolName}FormData) => void;  // For Chiko revert
}

// ━━━ Defaults ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createDefault{ToolName}Form(): {ToolName}FormData {
  return {
    // All default values
  };
}

// ━━━ Store ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const use{ToolName}Editor = create<{ToolName}EditorState>()(
  temporal(
    persist(
      immer<{ToolName}EditorState>((set) => ({
        form: createDefault{ToolName}Form(),

        update{Section}: (data) =>
          set((state) => {
            Object.assign(state.form.{section}, data);
          }),

        setTemplate: (template) =>
          set((state) => {
            state.form.style.template = template;
          }),

        setAccentColor: (color) =>
          set((state) => {
            state.form.style.accentColor = color;
          }),

        resetForm: () =>
          set((state) => {
            state.form = createDefault{ToolName}Form();
          }),

        setForm: (data) =>
          set((state) => {
            state.form = data;
          }),
      })),
      {
        name: "dmsuite-{tool-id}",
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ form: s.form }),  // Only persist form data
      }
    ),
    {
      partialize: (s) => ({ form: s.form }),  // Only track form changes for undo
    }
  )
);
```

### Middleware Stacking Order (CRITICAL)

The correct order is **`temporal(persist(immer(...)))`**:

| Wrapper | Position | Reason |
|---------|----------|--------|
| `temporal` | **Outermost** | Undo history is NOT persisted to localStorage |
| `persist` | **Middle** | Only form data is serialized to localStorage |
| `immer` | **Innermost** | Enables `state.form.x = y` draft mutations |
```

### Accent Color Lock Pattern

When a tool supports accent color + templates, implement the lock pattern **inside the Zustand state** (NOT as a module-level variable) to prevent template-switch from overriding user-chosen colors:

```typescript
// In state interface:
interface {ToolName}EditorState {
  form: {ToolName}FormData;
  accentColorLocked: boolean;  // Lives in Zustand state, NOT module-level
  // ... actions
}

// In store:
accentColorLocked: false,

setAccentColor: (color) => set((state) => {
  state.form.style.accentColor = color;
  state.accentColorLocked = true;  // User explicitly chose this color
}),

setTemplate: (template) => set((state) => {
  state.form.style.template = template;
  if (!state.accentColorLocked) {
    state.form.style.accentColor = templateDefaults[template].accent;
  }
}),

resetForm: () => set((state) => {
  state.form = createDefaultForm();
  state.accentColorLocked = false;  // Unlock on reset
}),

// In persist partialize — include accentColorLocked so it survives page refresh:
partialize: (s) => ({ form: s.form, accentColorLocked: s.accentColorLocked }),
```

> **Why not module-level `let`?** Module-level variables are invisible to Zustand's persist and temporal middleware. They reset on page navigation in Next.js, can desync across hot reloads, and cannot be restored by undo/redo.

### Temporal Store Access (Undo/Redo)

```typescript
// In workspace component:
const { undo, redo, pastStates, futureStates } =
  use{ToolName}Editor.temporal.getState();

const canUndo = pastStates.length > 0;
const canRedo = futureStates.length > 0;
```

---

## 8. TAB SYSTEM & EDITOR PANEL

Every multi-feature tool uses a tabbed editor panel. Define tabs as a typed constant:

```typescript
const EDITOR_TABS = [
  { key: "content",  label: "Content",  icon: <SIcon d="M..." /> },
  { key: "details",  label: "Details",  icon: <SIcon d="M..." /> },
  { key: "style",    label: "Style",    icon: <TabIcons.style /> },
  { key: "format",   label: "Format",   icon: <TabIcons.print /> },
] as const;

type EditorTabKey = (typeof EDITOR_TABS)[number]["key"];
```

### Tab Rules

- **Minimum 3 tabs, maximum 6 tabs** for any tool
- **First tab** is always the primary content/data tab (what the user is creating)
- **Last tab** is always format/print settings
- **Second-to-last tab** is always style/appearance settings
- **Middle tabs** are tool-specific (parties, sections, items, etc.)
- Tab text is **always uppercase** at `text-[11px] font-semibold tracking-wide`
- Active tab indicator is **animated with Framer Motion** `layoutId="editor-tab-indicator"`

### Tab Content Rendering

Wrap tab content in `WorkspaceErrorBoundary` to catch runtime errors without crashing the entire workspace:

```tsx
import { WorkspaceErrorBoundary } from "@/components/workspaces/shared/WorkspaceUIKit";

<div className="flex-1 overflow-y-auto scrollbar-thin">
  <WorkspaceErrorBoundary>
    {activeTab === "content" && <{ToolName}ContentTab />}
    {activeTab === "details" && <{ToolName}DetailsTab />}
    {activeTab === "style"   && <{ToolName}StyleTab />}
    {activeTab === "format"  && <{ToolName}FormatTab />}
  </WorkspaceErrorBoundary>

  {/* Start Over button — always at bottom of every tab */}
  <div className="p-4 border-t border-gray-800/30">
    <ActionButton
      variant="danger"
      size="sm"
      onClick={() => setConfirmReset(true)}
      className="w-full"
    >
      Start Over
    </ActionButton>
  </div>
</div>
```

### Standard Tabs (Use These Templates)

**Style Tab** (every document/design tool needs this):
- Template strip: horizontal scrollable thumbnails
- Accent color: `ColorSwatchPicker` with 12–16 color options  
- Font pairing: list of `SelectionCard` options
- Font scale: buttons or `RangeSlider`
- Header style: `ChipGroup` selector (if applicable)
- Advanced toggle: links to `AdvancedSettingsPanel`

**Format Tab** (every printable tool needs this):
- Page size: `ChipGroup` with A4/Letter/Legal/A5 (grouped by Print/Web)
- Margins: `ChipGroup` with "narrow"/"standard"/"wide" or `RangeSlider`
- Section spacing: `RangeSlider`
- Line spacing: `ChipGroup` with "tight"/"normal"/"loose"
- Export info: `InfoBadge` showing dimensions + DPI

---

## 9. CANVAS / PREVIEW PANEL

The center panel renders the tool's output in a paginated, zoom-controlled preview.

### Structure

```tsx
<div className="flex-1 flex flex-col bg-gray-800 dark:bg-gray-900">
  {/* ── Toolbar Row ── */}
  <div className="flex items-center gap-2 px-3 h-10 border-b border-gray-800/40 bg-gray-900/30">
    {/* Zoom controls */}
    <div className="flex items-center gap-1">
      <IconButton onClick={zoomOut} icon={Icons.zoomOut} />
      <span className="text-[10px] text-gray-500 font-mono w-9 text-center">{zoom}%</span>
      <IconButton onClick={zoomIn} icon={Icons.zoomIn} />
      <button onClick={zoomReset} className="text-[9px] text-gray-600 hover:text-gray-400 px-1.5">
        Reset
      </button>
    </div>

    <div className="flex-1" />

    {/* Template quick-switch strip (optional) */}
    {/* Convert/type-switch dropdown (optional) */}
    {/* Export/Print button */}
    <ActionButton variant="primary" size="sm" icon={Icons.print} onClick={handleExport}>
      Export
    </ActionButton>
  </div>

  {/* ── Scrollable Preview Area ── */}
  <div
    ref={previewRef}
    className="flex-1 overflow-auto scrollbar-thin p-6"
    onScroll={handlePreviewScroll}
  >
    <div
      className="{tool-id}-canvas-root"
      style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
    >
      <{ToolName}Renderer
        data={form}
        onPageCount={setPageCount}
      />
    </div>
  </div>

  {/* ── Page Navigation Bar ── */}
  {pageCount > 1 && (
    <div className="flex items-center justify-center gap-2 h-8 border-t border-gray-800/40 bg-gray-900/30">
      <IconButton onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} />
      {pageCount <= PAGE_DOTS_THRESHOLD ? (
        /* Dot indicators */
        <div className="flex gap-1.5">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i + 1)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                currentPage === i + 1 ? "bg-primary-400" : "bg-gray-600 hover:bg-gray-500"
              )}
            />
          ))}
        </div>
      ) : (
        /* Text counter for long documents */
        <span className="text-[10px] font-mono text-gray-500">
          Page {currentPage} / {pageCount}
        </span>
      )}
      <IconButton onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pageCount} />
    </div>
  )}
</div>
```

### Zoom Rules

Import constants from `@/lib/workspace-constants` — never hardcode these values:

```typescript
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT, PAGE_DOTS_THRESHOLD } from "@/lib/workspace-constants";

const [zoom, setZoom] = useState(ZOOM_DEFAULT);
const zoomIn = () => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP));
const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP));
const zoomReset = () => setZoom(ZOOM_DEFAULT);
```

- Range: `ZOOM_MIN` (30%) to `ZOOM_MAX` (200%)
- Default: `ZOOM_DEFAULT` (100%)
- Step: `ZOOM_STEP` (10%) per click
- Reset button returns to `ZOOM_DEFAULT`
- Applied via CSS `transform: scale(zoom/100)` with `transformOrigin: "top center"`
- Value display: `text-[10px] font-mono text-gray-500`

### Page Navigation Rules

- For ≤`PAGE_DOTS_THRESHOLD` (8) pages: dot indicators (`w-2 h-2 rounded-full`)
- For >`PAGE_DOTS_THRESHOLD` pages: text counter `"Page {n} / {total}"`
- Smooth scroll: `el.scrollTo({ top: (page - 1) * pageStep, behavior: "smooth" })`
- `pageStep = pageHeight + PAGE_GAP` (usually `PAGE_GAP = 16`)
- Scroll tracking: `onScroll` handler calculates `Math.round(scrollTop / pageStep) + 1`

---

## 10. LAYERS PANEL

For document-based tools (contracts, invoices, resumes, certificates, etc.), implement a Figma-style layers panel.

### Structure

```tsx
// ── Collapsed state (w-8) ──
<button className="flex flex-col items-center justify-center gap-2 h-full w-8 
  border-l border-gray-800/40 bg-gray-900/20 hover:bg-gray-800/30">
  <LayersSvgIcon className="w-4 h-4 text-gray-500" />
  <span className="text-[9px] font-medium text-gray-500 [writing-mode:vertical-lr]">
    Layers
  </span>
</button>

// ── Expanded state (w-56) ──
<div className="w-56 border-l border-gray-800/40 bg-gray-900/20 flex flex-col">
  {/* Header */}
  <div className="flex items-center justify-between px-3 h-10 border-b border-gray-800/30">
    <div className="flex items-center gap-2">
      <LayersSvgIcon className="w-3.5 h-3.5 text-gray-500" />
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
        Layers
      </span>
      <InfoBadge>{visibleCount}/{totalCount}</InfoBadge>
    </div>
    <IconButton icon={Icons.close} onClick={() => setExpanded(false)} />
  </div>

  {/* Scrollable tree */}
  <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
    {layers.map(layer => (
      <LayerRow key={layer.id} layer={layer} depth={0} />
    ))}
  </div>

  {/* Legend footer */}
  <div className="px-3 py-2 border-t border-gray-800/30 text-[9px] text-gray-600">
    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-400/80 mr-1" /> Visible
    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-600/40 ml-2 mr-1" /> Hidden
  </div>
</div>
```

### LayerRow Component

```tsx
function LayerRow({ layer, depth }: { layer: LayerNode; depth: number }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <button
        className="group flex items-center gap-1.5 w-full text-left hover:bg-primary-500/12
          hover:text-primary-200 transition-colors"
        style={{ paddingLeft: `${10 + depth * 16}px` }}
        onMouseEnter={() => onHoverSection(layer.sectionId)}
        onMouseLeave={() => onHoverSection(null)}
        onClick={() => onClickSection(layer.sectionId)}
      >
        {/* Expand arrow (if has children) */}
        {layer.children?.length > 0 && (
          <span className={cn("transition-transform", expanded && "rotate-90")}>▸</span>
        )}

        {/* Visibility dot */}
        <span className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          layer.visible ? "bg-primary-400/80" : "bg-gray-600/40"
        )} />

        {/* Label */}
        <span className="text-[11px] text-gray-300 truncate flex-1">{layer.label}</span>

        {/* Badge (item count) */}
        {layer.count && (
          <span className="text-[9px] text-gray-600 mr-2">{layer.count}</span>
        )}

        {/* Eye toggle (visible on hover) */}
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
        >
          {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </button>

      {/* Children */}
      {expanded && layer.children?.map(child => (
        <LayerRow key={child.id} layer={child} depth={depth + 1} />
      ))}
    </>
  );
}
```

### Layer Tree Construction

Build a `useLayers()` hook that reads from the tool's Zustand store and constructs a hierarchical tree:

```typescript
function useLayers(): LayerNode[] {
  const form = use{ToolName}Editor(s => s.form);

  return useMemo(() => [
    {
      id: "header",
      label: "Header",
      sectionId: "header",
      visible: true,
      children: [
        { id: "title", label: form.title || "Untitled", sectionId: "header", visible: true },
        { id: "subtitle", label: form.subtitle || "No subtitle", sectionId: "header", visible: true },
      ],
    },
    // ... more sections derived from form state
  ], [form]);
}
```

---

## 11. CANVAS SECTION HIGHLIGHTING

Connect the layers panel to the canvas preview with hover/click highlights.

### Data Attributes on Rendered Sections

In the Renderer component, add `data-{tool-prefix}-section` attributes to every major section:

```tsx
<div data-ct-section="header" className="...">Header content</div>
<div data-ct-section="parties" className="...">Parties content</div>
<div data-ct-section="clause-1" className="...">Clause 1</div>
```

### CSS Highlight Rules (Shared Stylesheet)

All section highlighting CSS lives in **`src/styles/workspace-canvas.css`** — import it in your workspace component instead of adding inline `<style>` blocks:

```typescript
import "@/styles/workspace-canvas.css";
```

To add highlighting for a new tool, append a new block to `workspace-canvas.css` following this pattern (change only the prefix):

```css
/* ---------------------------------------------------------------------------
   {Tool Name}
   --------------------------------------------------------------------------- */

.{tool-prefix}-canvas-root [data-{tool-prefix}-section] {
  transition: outline 0.15s ease, box-shadow 0.15s ease;
  outline: 2px solid transparent;
  border-radius: 2px;
  cursor: pointer;
}

.{tool-prefix}-canvas-root [data-{tool-prefix}-section]:hover {
  outline: 2px solid rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.06);
}

.{tool-prefix}-canvas-root [data-{tool-prefix}-section].{tool-prefix}-layer-highlight {
  outline: 2px solid rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.1);
}
```

The shared file already includes a consolidated `@media print` block that strips all highlighting prefixes. **Do NOT add inline `<style>` blocks** in workspace components — they cause duplication and make maintenance harder.

### Highlight Application (useEffect in workspace)

```typescript
useEffect(() => {
  const container = previewRef.current;
  if (!container) return;

  // Remove all existing highlights
  container.querySelectorAll(`.${TOOL_PREFIX}-layer-highlight`)
    .forEach(el => el.classList.remove(`${TOOL_PREFIX}-layer-highlight`));

  // Apply highlight for hovered section
  if (hoveredSection) {
    container.querySelectorAll(`[data-${TOOL_PREFIX}-section="${hoveredSection}"]`)
      .forEach(el => el.classList.add(`${TOOL_PREFIX}-layer-highlight`));
  }
}, [hoveredSection]);
```

### Click-to-Edit on Canvas

```typescript
function handlePreviewClick(e: React.MouseEvent) {
  const target = (e.target as HTMLElement).closest(`[data-${TOOL_PREFIX}-section]`);
  if (!target) return;

  const sectionId = target.getAttribute(`data-${TOOL_PREFIX}-section`);
  if (!sectionId) return;

  // Map section to editor tab
  const tabMap: Record<string, EditorTabKey> = {
    "header": "content",
    "parties": "details",
    "clause-1": "content",
    // ... map all sections to tabs
  };

  const tab = tabMap[sectionId];
  if (tab) setActiveTab(tab);
}
```

---

## 12. ZOOM, PAGE NAVIGATION & SCROLL SYNC

### Zoom Implementation

```typescript
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT } from "@/lib/workspace-constants";

const [zoom, setZoom] = useState(ZOOM_DEFAULT);

const zoomIn = () => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP));
const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP));
const zoomReset = () => setZoom(ZOOM_DEFAULT);
```

### Page Navigation with Scroll Sync

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [pageCount, setPageCount] = useState(1);

// Get page dimensions from renderer
const pagePx = PAGE_PX[form.pageSize] || PAGE_PX.a4;
const pageStep = pagePx.h + PAGE_GAP;

// Scroll to specific page
function goToPage(page: number) {
  if (page < 1 || page > pageCount) return;
  const el = previewRef.current;
  if (!el) return;
  el.scrollTo({ top: (page - 1) * pageStep * (zoom / 100), behavior: "smooth" });
  setCurrentPage(page);
}

// Track current page from scroll position
function handlePreviewScroll() {
  const el = previewRef.current;
  if (!el) return;
  const scrollTop = el.scrollTop / (zoom / 100);
  const page = Math.min(pageCount, Math.max(1, Math.round(scrollTop / pageStep) + 1));
  setCurrentPage(page);
}
```

---

## 13. MOBILE & RESPONSIVE RULES

### Breakpoint Strategy

| Breakpoint | Layout |
|-----------|--------|
| Default (mobile) | Single panel, full-width, bottom action bar |
| `md` (768px+) | 2-column: editor + preview (no layers) |
| `lg` (1024px+) | 3-panel: editor + preview + layers. Sidebar visible |
| `xl` (1280px+) | Wider editor panel (`xl:w-96`), extra spacing |

### Mobile View State

```typescript
const [mobileView, setMobileView] = useState<"editor" | "preview" | "layers">("editor");
```

### Mobile Bottom Action Bar

```tsx
<BottomBar
  actions={[
    { key: "editor",  label: "Edit",    icon: Icons.edit },
    { key: "preview", label: "Preview", icon: Icons.preview },
    { key: "export",  label: "Export",   icon: Icons.print, primary: true },
  ]}
  activeKey={mobileView}
  onAction={(key) => {
    if (key === "export") handleExport();
    else setMobileView(key as "editor" | "preview");
  }}
/>
```

### Responsive Panel Visibility

```tsx
{/* Editor Panel — visible on mobile "editor" view OR desktop always */}
<div className={cn(
  "lg:w-80 xl:w-96 flex-shrink-0 border-r border-gray-800/40 flex flex-col",
  mobileView !== "editor" && "hidden lg:flex"
)}>
  {/* Editor content */}
</div>

{/* Preview Panel — visible on mobile "preview" view OR desktop always */}
<div className={cn(
  "flex-1 flex flex-col",
  mobileView !== "preview" && "hidden lg:flex"
)}>
  {/* Preview content */}
</div>

{/* Layers Panel — desktop only */}
<div className="hidden lg:flex">
  <{ToolName}LayersPanel />
</div>
```

---

## 14. TOOLBAR, UNDO/REDO & KEYBOARD SHORTCUTS

### WorkspaceHeader with Undo/Redo

```tsx
<WorkspaceHeader
  title={form.title || "Untitled Document"}
  subtitle={`${itemCount} items`}
>
  <IconButton
    icon={Icons.undo}
    onClick={undo}
    disabled={!canUndo}
    tooltip="Undo (Ctrl+Z)"
  />
  <IconButton
    icon={Icons.redo}
    onClick={redo}
    disabled={!canRedo}
    tooltip="Redo (Ctrl+Y)"
  />
</WorkspaceHeader>
```

### Keyboard Shortcuts

Register in the workspace with `useEffect`:

```typescript
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
    if (ctrl && e.key === "p") {
      e.preventDefault();
      handleExport();
    }
  }

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [undo, redo, handleExport]);
```

---

## 15. EXPORT, PRINT & DOWNLOAD

### Print Handler Pattern

```typescript
const handleExport = useCallback(() => {
  // Dispatch export milestone
  dispatchProgress("exported");

  // Print implementation
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
    <head>
      <title>${form.title || "Document"}</title>
      <style>
        @page { size: ${form.pageSize === "a4" ? "A4" : "letter"}; margin: 0; }
        body { margin: 0; padding: 0; }
        /* Tool-specific print styles */
      </style>
      ${googleFontLink}
    </head>
    <body>${renderedHTML}</body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
}, [form]);
```

### Export Formats

| Format | Method | Notes |
|--------|--------|-------|
| Print/PDF | `window.open` + `print()` | Browser print dialog with @page CSS |
| PNG/JPG | `html2canvas` or Canvas API | Capture rendered HTML as image |
| DOCX | `docx` npm package | Build document programmatically |
| JSON | `JSON.stringify(form)` | Raw data export for backup |
| Clipboard | `navigator.clipboard.writeText()` | Plain text version |

---

## 16. CHIKO AI MANIFEST CONTRACT

**CRITICAL:** Every tool MUST register a Chiko manifest. This is how the AI assistant interacts with the tool. Without a manifest, Chiko cannot help the user with the tool.

### Manifest File (`src/lib/chiko/manifests/{tool-id}.ts`)

```typescript
import { type ChikoActionManifest } from "@/stores/chiko-actions";
import { withActivityLogging } from "@/stores/activity-log";
import { use{ToolName}Editor } from "@/stores/{tool-id}-editor";

export function create{ToolName}Manifest(opts?: {
  onPrintRef?: React.MutableRefObject<(() => void) | null>;
}): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "{tool-id}",
    toolName: "{Tool Display Name}",

    // ━━━ Read-Only State Reader ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    getState: () => {
      const { form } = use{ToolName}Editor.getState();
      return {
        // Return ALL form fields (sanitized for AI consumption)
        // Mask sensitive data (bank accounts → "****1234")
        // Include counts/summaries for arrays
      };
    },

    // ━━━ Action Definitions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    actions: [
      // ── READ ──
      {
        name: "readCurrentState",
        description: "Get all current settings and contents (read-only, no changes)",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },

      // ── CONTENT (tool-specific) ──
      {
        name: "updateTitle",
        description: "Set the document title",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "New title" },
          },
          required: ["title"],
        },
        category: "Content",
      },
      // Add ALL content-editing actions...

      // ── STYLE (standard for all tools) ──
      {
        name: "updateStyle",
        description: "Change visual styling: template, accent color, font pairing",
        parameters: {
          type: "object",
          properties: {
            template: { type: "string", enum: ["template-a", "template-b", "..."] },
            accentColor: { type: "string", description: "Hex color like #8b5cf6" },
            fontPairing: { type: "string", enum: ["inter-jetbrains", "..."] },
          },
        },
        category: "Style",
      },

      // ── FORMAT (standard for all tools) ──
      {
        name: "updateFormat",
        description: "Change page size, margins, spacing",
        parameters: {
          type: "object",
          properties: {
            pageSize: { type: "string", enum: ["a4", "letter", "legal", "a5"] },
            margins: { type: "string", enum: ["narrow", "standard", "wide"] },
          },
        },
        category: "Format",
      },

      // ── EXPORT ──
      {
        name: "exportDocument",
        description: "Export or print the document",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["print", "pdf", "png", "json"] },
          },
        },
        category: "Export",
      },

      // ── VALIDATE ──
      {
        name: "validateBeforeExport",
        description: "Check for errors/warnings before exporting",
        parameters: { type: "object", properties: {} },
        category: "Validate",
      },

      // ── RESET (destructive) ──
      {
        name: "resetForm",
        description: "Reset all fields to defaults (destructive, ask for confirmation)",
        parameters: { type: "object", properties: {} },
        category: "Reset",
        destructive: true,
      },
    ],

    // ━━━ Action Executor ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    executeAction: (actionName, params) => {
      const store = use{ToolName}Editor.getState();

      switch (actionName) {
        case "readCurrentState":
          return { success: true, message: "Current state read", newState: baseManifest.getState() };

        case "updateTitle":
          store.updateContent({ title: params.title as string });
          return { success: true, message: `Title updated to "${params.title}"` };

        case "updateStyle": {
          if (params.template) store.setTemplate(params.template as string);
          if (params.accentColor) store.setAccentColor(params.accentColor as string);
          if (params.fontPairing) store.updateStyle({ fontPairing: params.fontPairing as string });
          return { success: true, message: "Style updated" };
        }

        case "exportDocument":
          if (params.format === "print" && opts?.onPrintRef?.current) {
            opts.onPrintRef.current();
          }
          return { success: true, message: `Export triggered (${params.format})` };

        case "resetForm":
          store.resetForm();
          return { success: true, message: "Form reset to defaults" };

        default:
          return { success: false, message: `Unknown action: ${actionName}` };
      }
    },
  };

  // ━━━ Wrap with Activity Logging ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return withActivityLogging(
    baseManifest,
    () => use{ToolName}Editor.getState().form,          // Full state snapshot
    (snapshot) => use{ToolName}Editor.getState().setForm(snapshot as {ToolName}FormData),  // Restore
  );
}
```

### Manifest Registration in Workspace Component

```typescript
import { useChikoActions } from "@/hooks/useChikoActions";
import { create{ToolName}Manifest } from "@/lib/chiko/manifests/{tool-id}";

export default function {ToolName}Workspace() {
  const chikoOnPrintRef = useRef<(() => void) | null>(null);

  const handleExport = useCallback(() => { /* ... */ }, []);

  // Keep ref in sync with latest handler
  useEffect(() => {
    chikoOnPrintRef.current = handleExport;
  }, [handleExport]);

  // Register Chiko manifest (runs once)
  useChikoActions(() => create{ToolName}Manifest({ onPrintRef: chikoOnPrintRef }));

  // ... rest of component
}
```

### Mandatory Chiko Actions (Every Tool Must Have These)

| Action | Category | Description |
|--------|----------|-------------|
| `readCurrentState` | Read | Returns full tool state (read-only) |
| `updateStyle` | Style | Template, accent color, font changes |
| `updateFormat` | Format | Page size, margins, spacing |
| `exportDocument` | Export | Print/PDF/PNG export |
| `validateBeforeExport` | Validate | Pre-export error/warning check |
| `resetForm` | Reset | Destructive full reset (flag `destructive: true`) |
| `getActivityLog` | History | Auto-added by `withActivityLogging` |
| `revertToState` | History | Auto-added by `withActivityLogging` |

### Tool-Specific Actions (Add as needed)

Examples from existing tools:
- Contract: `addClause`, `toggleClause`, `updatePartyA`, `updatePartyB`, `convertToType`, `updateSignatureConfig`
- Invoice: `addLineItem`, `updateLineItem`, `removeLineItem`, `setCurrency`, `setPaymentTerms`
- Resume: `addSectionItem`, `removeSectionItem`, `toggleSectionVisibility`, `changeTemplate`
- Sales Book: `updateBranding`, `updateSerial`, `toggleColumn`, `updateLayout`

### Parameter Documentation Rules

Every action parameter MUST include:
- `type`: JSON Schema type (`"string"`, `"number"`, `"boolean"`, `"array"`)
- `description`: Human-readable description for the AI
- `enum` (for constrained values): exact list of valid values
- `required`: array of mandatory parameter names

---

## 17. ACTIVITY LOGGING & REVERT SYSTEM

The `withActivityLogging` wrapper automatically:

1. Captures a **full state snapshot** before every mutating action
2. Logs the action name, description, timestamp, and source ("user" | "chiko")
3. Adds `getActivityLog` and `revertToState` actions to the manifest
4. Stores up to 50 entries per tool (session-only, not persisted)

### What the Wrapper Needs

```typescript
withActivityLogging(
  baseManifest,
  () => store.getState().form,                    // getFullSnapshot: returns serializable state
  (snapshot) => store.getState().setForm(snapshot) // restoreSnapshot: restores full state
)
```

### Read-Only Actions (Not Logged)

The following action names are treated as read-only and are NOT logged:
- `readCurrentState`
- `getActivityLog`
- Any action prefixed with `read` or `get`

---

## 18. BUSINESS MEMORY INTEGRATION

If the tool involves business/personal information (invoices, contracts, business cards, resumes, etc.), integrate with the Business Memory system.

### Add `prefillFromMemory` Action

```typescript
{
  name: "prefillFromMemory",
  description: "Fill fields from saved business profile",
  parameters: { type: "object", properties: {} },
  category: "Content",
}

// In executeAction:
case "prefillFromMemory": {
  const profile = useBusinessMemory.getState().profile;
  if (!profile?.companyName) {
    return { success: false, message: "No business profile saved yet" };
  }
  store.updateBusinessInfo(mapProfileTo{ToolName}(profile));
  return { success: true, message: "Pre-filled from business memory" };
}
```

### Field Mapper

Add a mapping function in `src/lib/chiko/field-mapper.ts`:

```typescript
export function mapProfileTo{ToolName}(profile: BusinessProfile): Partial<{ToolFields}> {
  return {
    companyName: profile.companyName,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    // ... map all relevant fields
  };
}
```

---

## 19. ADVANCED SETTINGS INTEGRATION

Every document/print tool must include the global Advanced Settings panel for fine-grained design control.

### Include in Style Tab or as Separate Section

```tsx
import AdvancedSettingsPanel from "@/components/workspaces/AdvancedSettingsPanel";

// In the Style tab or as a separate "Advanced" tab:
<AdvancedSettingsPanel />
```

### Consume in Canvas/Renderer

```typescript
import {
  getAdvancedSettings,
  scaledFontSize,
  scaledMarginX,
  getPatternOpacity,
  getExportScale,
} from "@/stores/advanced-helpers";

// In renderer/canvas:
const settings = getAdvancedSettings();
const titleSize = scaledFontSize(24, "heading");  // 24 × headingScale
const bodySize = scaledFontSize(13, "body");       // 13 × bodyScale
const marginX = scaledMarginX(50);                 // 50 × marginHorizontal
```

### Re-render on Settings Change

```typescript
// In workspace component:
const advancedSettings = useAdvancedSettingsStore(s => s.settings);
// This triggers re-render when any setting changes
```

---

## 20. WORKSPACE EVENTS & MILESTONE PROGRESS

Every workspace MUST dispatch these custom events for the tool page shell to track progress.

### Event Types

Import typed helpers from `@/lib/workspace-events` — never use raw `window.dispatchEvent(new CustomEvent(...))` calls:

```typescript
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import type { WorkspaceMilestone } from "@/lib/workspace-events";

// 1. Mark work as dirty (triggers input/edited milestones automatically)
dispatchDirty();

// 2. Report specific milestones
dispatchProgress("input");
dispatchProgress("content");
dispatchProgress("edited");
dispatchProgress("exported");
```

The `WORKSPACE_EVENTS` constants object is also exported for listeners:

```typescript
import { WORKSPACE_EVENTS } from "@/lib/workspace-events";

// Listening for events (in tool page shell):
window.addEventListener(WORKSPACE_EVENTS.DIRTY, handler);
window.addEventListener(WORKSPACE_EVENTS.PROGRESS, handler);
```

### When to Dispatch

| Helper Call | When |
|-------------|------|
| `dispatchDirty()` | Any form field change (attach to store subscriber or onChange handlers) |
| `dispatchProgress("input")` | User has entered meaningful data (title, name, key fields) |
| `dispatchProgress("content")` | AI has generated content OR user has created substantial content |
| `dispatchProgress("edited")` | User has made 3+ refinements after content exists |
| `dispatchProgress("exported")` | User successfully printed, downloaded, or exported |
| Raw `workspace:progress` with `{ progress: N }` | Wizard step changes (calculate percentage from step/totalSteps) |

### Implementation Pattern (Tab-Based Editor)

```typescript
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import { MILESTONE_EDIT_THRESHOLD } from "@/lib/workspace-constants";

// In workspace component, track form changes:
useEffect(() => {
  // Input milestone: key fields filled
  if (form.title.length > 0 || form.clientName.length > 0) {
    dispatchProgress("input");
  }

  // Content milestone: substantial content exists
  if (form.items.length > 0 || form.sections.some(s => s.content.length > 0)) {
    dispatchProgress("content");
  }
}, [form.title, form.clientName, form.items.length]);

// Track edit count for "edited" milestone:
const editCountRef = useRef(0);
useEffect(() => {
  editCountRef.current++;
  if (editCountRef.current >= MILESTONE_EDIT_THRESHOLD) {
    dispatchProgress("edited");
  }
}, [form]);
```

### Implementation Pattern (Wizard-Based Tool)

```typescript
import { dispatchProgress } from "@/lib/workspace-events";

useEffect(() => {
  const stepProgress = Math.round((currentStep / totalSteps) * 80);
  window.dispatchEvent(new CustomEvent("workspace:progress", {
    detail: { progress: stepProgress }
  }));

  if (currentStep >= 2) {
    dispatchProgress("input");
  }
  if (currentStep >= totalSteps) {
    dispatchProgress("content");
  }
}, [currentStep]);
```

---

## 21. CREDIT SYSTEM INTEGRATION

### API Route for AI Generation

If the tool calls an AI API (Claude, etc.), create or reuse an API route:

```typescript
// src/app/api/{tool-id}/route.ts
import { checkCredits, deductCredits } from "@/lib/supabase/credits";

export async function POST(req: Request) {
  const user = await getAuthUser();

  // Check credits
  const { allowed } = await checkCredits(user.id, "{operation-key}");
  if (!allowed) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  // Call AI API...

  // Deduct credits on success
  await deductCredits(user.id, CREDIT_COSTS["{operation-key}"], "{operation-key}", "Generated {description}");

  return NextResponse.json({ result });
}
```

### Credit Cost Display

Show credit cost to user before expensive operations:

```tsx
<ActionButton variant="primary" onClick={handleGenerate}>
  Generate ({getToolCreditCost("{tool-id}")} credits)
</ActionButton>
```

---

## 22. WIZARD-TO-EDITOR PATTERN

For tools that collect information before generating content.

### Wizard Store (`src/stores/{tool-id}-wizard.ts`)

```typescript
export const use{ToolName}Wizard = create<WizardState>()(
  persist((set) => ({
    currentStep: 0,
    totalSteps: 6,  // 0-indexed
    direction: "forward" as "forward" | "backward",

    // Step data
    step1Data: {},
    step2Data: {},
    // ...

    nextStep: () => set(s => ({
      currentStep: Math.min(s.totalSteps, s.currentStep + 1),
      direction: "forward",
    })),

    prevStep: () => set(s => ({
      currentStep: Math.max(0, s.currentStep - 1),
      direction: "backward",
    })),

    goToStep: (step: number) => set({ currentStep: step }),
  }), {
    name: "dmsuite-{tool-id}-wizard",
    storage: createJSONStorage(() => sessionStorage),  // Session only for wizards
  })
);
```

### Wizard Step Animation

```tsx
<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={currentStep}
    custom={direction}
    variants={{
      enter: (dir: string) => ({
        y: dir === "forward" ? 60 : -60,
        opacity: 0,
        scale: 0.98,
      }),
      center: { y: 0, opacity: 1, scale: 1 },
      exit: (dir: string) => ({
        y: dir === "forward" ? -60 : 60,
        opacity: 0,
        scale: 0.98,
      }),
    }}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {renderStep(currentStep)}
  </motion.div>
</AnimatePresence>
```

### Rehydration Safety (CRITICAL)

Prevent the wizard from landing on a generation step on revisit:

```typescript
// In wizard store persist config:
onRehydrateStorage: () => (state) => {
  if (!state) return;

  // Check if editor data already exists
  const editorData = localStorage.getItem("dmsuite-{tool-id}");
  if (editorData) {
    const parsed = JSON.parse(editorData);
    if (parsed?.state?.form?.title) {
      // Data exists — go straight to editor
      state.currentStep = state.totalSteps;
      return;
    }
  }

  // If stuck on generation step, go back to brief
  if (state.currentStep === state.totalSteps - 1) {
    state.currentStep = Math.max(0, state.totalSteps - 2);
  }
}
```

---

## 23. RENDERER COMPONENT PATTERN

Every tool's visual output is rendered by a dedicated Renderer component.

### Renderer File (`src/components/workspaces/{tool-id}/{ToolName}Renderer.tsx`)

```tsx
"use client";

// ━━━ Page Constants (exported for workspace calculations) ━━━
export const PAGE_PX: Record<string, { w: number; h: number }> = {
  a4: { w: 794, h: 1123 },
  letter: { w: 816, h: 1056 },
  legal: { w: 816, h: 1344 },
  a5: { w: 559, h: 794 },
};

export const PAGE_GAP = 16;

// ━━━ Renderer Props ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface {ToolName}RendererProps {
  data: {ToolName}FormData;
  onPageCount?: (count: number) => void;
  pageGap?: number;
}

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function {ToolName}Renderer({ data, onPageCount, pageGap = PAGE_GAP }: {ToolName}RendererProps) {
  const pageDims = PAGE_PX[data.pageSize] || PAGE_PX.a4;

  // ── Consume Advanced Settings ──
  const settings = getAdvancedSettings();
  const titleSize = scaledFontSize(24, "heading");
  const bodySize = scaledFontSize(13, "body");

  // ── Font loading (Google Fonts) ──
  const fontUrl = getGoogleFontUrl(data.style.fontPairing);

  // ── Pagination logic ──
  const pages = useMemo(() => paginate(data, pageDims), [data, pageDims]);

  useEffect(() => {
    onPageCount?.(pages.length);
  }, [pages.length, onPageCount]);

  return (
    <>
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}

      <div className="flex flex-col items-center" style={{ gap: pageGap }}>
        {pages.map((page, i) => (
          <div
            key={i}
            data-{tool-prefix}-page={i + 1}
            className="bg-white shadow-2xl shadow-black/20"
            style={{
              width: pageDims.w,
              height: pageDims.h,
              fontFamily: getFontFamily(data.style.fontPairing),
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Render sections with data-{tool-prefix}-section attributes */}
            <div data-{tool-prefix}-section="header" className="...">
              <h1 style={{ fontSize: titleSize }}>{data.title}</h1>
            </div>

            {/* ... more sections */}
          </div>
        ))}
      </div>
    </>
  );
}
```

### Renderer Rules

- Output is **pure HTML/CSS** (not canvas) for document tools
- Each page is a discrete `<div>` with exact pixel dimensions
- Pages are separated by `gap` (default 16px)
- Sections tagged with `data-{tool-prefix}-section` for layer highlighting
- Google Fonts loaded via `<link>` tag
- Advanced Settings consumed via helper functions (not store hooks)
- `onPageCount` callback updates parent workspace's page nav
- Print styles use `@page { size: A4; margin: 0; }` for zero-margin printing

---

## 24. COLOR, TYPOGRAPHY & TOKEN RULES

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-500` | `#8b5cf6` | Brand violet — buttons, active states, accents |
| `primary-400` | `#a78bfa` | Lighter violet — active tab text, highlight outlines |
| `secondary-500` | `#06b6d4` | Neon cyan — secondary accents, badges |
| `gray-950` | `#070b14` | Page background (dark mode) |
| `gray-900` | `#0c1222` | Sidebar, panels |
| `gray-800` | `#1e293b` | Card backgrounds, input backgrounds |
| `gray-700` | `#334155` | Borders, dividers |
| `gray-600` | `#475569` | Muted text, secondary labels |
| `gray-500` | `#64748b` | Tertiary text, icons, placeholders |
| `gray-400` | `#94a3b8` | Body text (dark mode) |
| `gray-300` | `#cbd5e1` | Primary text (dark mode) |
| `gray-200` | `#e2e8f0` | Emphasized text (dark mode) |
| `success` | `#22c55e` | Ready badges, positive states |
| `error` | `#ef4444` | Error badges, danger buttons, destructive actions |
| `warning` | `#f59e0b` | Beta badges, caution states |
| `info` | `#3b82f6` | Info badges, coming-soon states |

### Typography Scale

| Context | Size | Weight | Color |
|---------|------|--------|-------|
| Tab label | `text-[11px]` | `font-semibold` | `text-gray-500` (inactive), `text-primary-400` (active) |
| Section label | `text-[11px]` | `font-semibold uppercase tracking-wider` | `text-gray-500` |
| Form label | `text-[11px]` | `font-medium` | `text-gray-500` |
| Form input | `text-[13px]` | — | `text-gray-200` |
| Panel title | `text-xs` | `font-semibold uppercase tracking-wide` | `text-gray-300` |
| Hint/description | `text-[10px]` | — | `text-gray-600` |
| Badge text | `text-[10px]` | `font-medium` | varies |
| Mono value | `text-[10px]` | `font-mono` | `text-primary-400` |
| Layer label | `text-[11px]` | — | `text-gray-300` |
| Layer count | `text-[9px]` | — | `text-gray-600` |
| Zoom display | `text-[10px]` | `font-mono` | `text-gray-500` |
| Page counter | `text-[10px]` | `font-mono` | `text-gray-500` |

### Glassmorphic Surface Recipe

```
Background:  bg-white/60 dark:bg-gray-900/40
Backdrop:    backdrop-blur-lg
Border:      border border-white/10 dark:border-white/[0.06]
```

### Gradient Syntax (Tailwind v4)

```
✅ bg-linear-to-br from-primary-500 via-primary-600 to-secondary-500
❌ bg-gradient-to-br (old syntax — DO NOT USE)
```

---

## 25. ANIMATION & MOTION RULES

### Framer Motion Presets

| Animation | Properties | Duration |
|-----------|-----------|----------|
| Accordion expand | `height: 0→auto, opacity: 0→1` | 250ms |
| Tab indicator | `layoutId="editor-tab-indicator"` | auto (spring) |
| Modal appear | `opacity: 0→1, scale: 0.95→1` | 200ms |
| Wizard step | `y: ±60, opacity: 0→1, scale: 0.98→1` | 300ms |
| Toast slide | `x: 100→0, opacity: 0→1` | 200ms |

### CSS Transitions

| Element | Property | Duration |
|---------|----------|----------|
| Hover lift | `translate-y, shadow` | 300ms |
| Color change | `color, background-color` | 150ms |
| Border focus | `border-color, ring` | 150ms |
| Icon rotate | `transform (rotate)` | 200ms |
| Layer highlight | `outline, box-shadow` | 150ms |

### Animation Rules

- Use **Framer Motion** for all layout animations (expand/collapse, enter/exit, shared layout)
- Use **CSS transitions** for hover states, focus rings, and color changes
- Never animate `width` or `height` directly with CSS — use Framer Motion for layout shifts
- All durations must be 150ms–300ms (never slower unless it's a page transition)
- Use `ease-in-out` or spring physics — never linear easing

---

## 26. ACCESSIBILITY REQUIREMENTS

- All interactive elements must have visible focus states (`ring-2 ring-primary-500/20`)
- Toggle switches: `role="switch"`, `aria-checked`
- Accordion sections: `aria-expanded`, `aria-controls`
- Modals: `role="dialog"`, trap focus, Escape to close, click outside to close
- Icon-only buttons: `aria-label` or `tooltip` text
- Color contrast: Text on dark backgrounds must meet WCAG AA (4.5:1 ratio minimum)
- Keyboard navigation: Tab through all interactive elements, Enter/Space to activate
- Screen reader: Meaningful labels on all form inputs

---

## 27. TESTING & VALIDATION CHECKLIST

Before marking any tool as `devStatus: "complete"`:

### TypeScript
- [ ] `npx tsc --noEmit` — zero errors
- [ ] No `any` types, no `@ts-ignore`

### Build
- [ ] `npm run build` — compiles successfully
- [ ] No unused imports or variables

### Functionality
- [ ] All tabs render correctly
- [ ] Form inputs update store state
- [ ] Preview renders document from store state
- [ ] Undo/Redo works (Ctrl+Z / Ctrl+Y)
- [ ] Export/Print produces correct output
- [ ] Template switching works (previews update)
- [ ] Accent color changes apply correctly
- [ ] Page size changes reflect in preview
- [ ] Layers panel hover highlights work
- [ ] Click-to-edit on canvas navigates to correct tab
- [ ] Start Over resets form (with confirmation dialog)

### Chiko Integration
- [ ] Manifest registered (tool appears in Chiko's action list)
- [ ] `readCurrentState` returns full state
- [ ] All write actions execute correctly
- [ ] Activity log captures mutations with before-snapshots
- [ ] `revertToState` restores previous state
- [ ] `validateBeforeExport` returns meaningful errors/warnings
- [ ] `prefillFromMemory` works (if business-related tool)

### Responsive
- [ ] Mobile: single-panel view with BottomBar
- [ ] Tablet: 2-panel (editor + preview)
- [ ] Desktop: 3-panel (editor + preview + layers)
- [ ] BottomBar hidden on desktop (`lg:hidden`)
- [ ] Layer panel collapsed by default on smaller screens

### Events
- [ ] `workspace:dirty` dispatched on form changes
- [ ] `workspace:progress` dispatched with milestones
- [ ] `workspace:progress` dispatched with `exported` on export

### Visual
- [ ] Dark mode looks correct (all surfaces, borders, text)
- [ ] Light mode looks correct (all variants applied)
- [ ] No hardcoded hex colors — all token-based
- [ ] No pixel values — all Tailwind spacing
- [ ] Animations smooth (accordion, tabs, hover)

---

## 28. TOOL-STATUS.md & devStatus TRACKING

After completing a tool:

1. Update `devStatus` in `src/data/tools.ts`:
   ```typescript
   devStatus: "complete",
   ```

2. Move the tool to the COMPLETE section in `TOOL-STATUS.md`

3. Add a changelog entry:
   ```
   | YYYY-MM-DD | tool-id (Tool Name) | Summary of work done | Drake |
   ```

---

## 29. COMPLETE SCAFFOLD TEMPLATE

Below is a minimal but complete scaffold for a new tab-based editor tool. Copy and adapt.

### Files to Create

1. `src/stores/{tool-id}-editor.ts` — Zustand store
2. `src/components/workspaces/{tool-id}/{ToolName}Workspace.tsx` — Main workspace
3. `src/components/workspaces/{tool-id}/{ToolName}Renderer.tsx` — Document renderer
4. `src/components/workspaces/{tool-id}/{ToolName}LayersPanel.tsx` — Layers panel
5. `src/components/workspaces/{tool-id}/tabs/{ToolName}ContentTab.tsx` — Content tab
6. `src/components/workspaces/{tool-id}/tabs/{ToolName}StyleTab.tsx` — Style tab
7. `src/components/workspaces/{tool-id}/tabs/{ToolName}FormatTab.tsx` — Format tab
8. `src/lib/chiko/manifests/{tool-id}.ts` — Chiko manifest

### Files to Modify

1. `src/data/tools.ts` — Add tool definition (or update `devStatus`)
2. `src/app/tools/[categoryId]/[toolId]/page.tsx` — Add dynamic import case
3. `src/data/credit-costs.ts` — Add credit mapping
4. `TOOL-STATUS.md` — Update tracker

---

## 30. REFERENCE IMPLEMENTATIONS

Study these existing tools as gold-standard references:

| Tool | Pattern | Key Features | Location |
|------|---------|-------------|----------|
| **Contract Designer** | Tab Editor + Preview + Layers | 5 tabs, 16 types, Zambian law, 9 templates, cover page, fillable fields, full Chiko manifest | `src/components/workspaces/contract-designer/` |
| **Invoice Designer** | Tab Editor + Preview | Line items, calculations, multi-currency, payment terms, business memory prefill | `src/components/workspaces/invoice-designer/` |
| **Resume/CV** | Wizard → Tab Editor + Preview + Layers | 8-step wizard, 4-tab editor, 20 templates, ATS parsing, sections toggle | `src/components/workspaces/resume-cv/` |
| **Business Card** | Wizard → Canvas Editor | 6-step wizard, design director AI, abstract asset library, 3D preview | `src/components/workspaces/BusinessCardWorkspace.tsx` |
| **Sales Book** | Tab Editor + Preview | Tabbed, serial numbering, column visibility, cut lines, form layout | `src/components/workspaces/sales-book-designer/` |

---

## APPENDIX A: COMPLETE ACTION CATEGORY TAXONOMY

When defining Chiko actions, use these standard category names:

| Category | Purpose | Examples |
|----------|---------|---------|
| `Read` | Non-mutating state queries | `readCurrentState` |
| `Content` | Primary content editing | `updateTitle`, `addItem`, `removeItem` |
| `Details` | Secondary/metadata fields | `updatePartyA`, `setDate`, `setReference` |
| `Style` | Visual appearance | `updateStyle`, `setTemplate`, `setAccentColor` |
| `Format` | Page/print settings | `updateFormat`, `setPageSize` |
| `Export` | Output generation | `exportDocument`, `exportPrint` |
| `Validate` | Pre-export checks | `validateBeforeExport` |
| `Reset` | Destructive resets | `resetForm` (flag `destructive: true`) |
| `History` | Auto-added by logging | `getActivityLog`, `revertToState` |

---

## APPENDIX B: TEMPLATE STRIP PATTERN

For tools with multiple visual templates:

```tsx
<div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
  {TEMPLATES.map(t => (
    <button
      key={t.id}
      onClick={() => store.setTemplate(t.id)}
      className={cn(
        "flex-shrink-0 w-16 h-20 rounded-lg border-2 transition-all overflow-hidden",
        form.style.template === t.id
          ? "border-primary-500 ring-2 ring-primary-500/20 scale-105"
          : "border-gray-700/40 hover:border-gray-600/60"
      )}
    >
      {/* Template thumbnail or miniature preview */}
      <div className="w-full h-full" style={{ background: t.previewColor }}>
        <span className="text-[7px] text-gray-400 p-1 block truncate">{t.name}</span>
      </div>
    </button>
  ))}
</div>
```

---

## APPENDIX C: CONFIRM RESET DIALOG PATTERN

```tsx
const [confirmReset, setConfirmReset] = useState(false);

<ConfirmDialog
  open={confirmReset}
  title="Start Over?"
  description="This will reset all fields to defaults. This cannot be undone."
  variant="danger"
  confirmLabel="Reset Everything"
  cancelLabel="Keep Working"
  onConfirm={() => {
    store.resetForm();
    setConfirmReset(false);
  }}
  onCancel={() => setConfirmReset(false)}
/>
```

---

## APPENDIX D: SIDEBAR INTEGRATION PATTERN

Every workspace page is wrapped with the app sidebar:

```tsx
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useSidebarStore } from "@/stores/sidebar";
import { sidebarConfig } from "@/lib/design-system";

export default function ToolPage() {
  const pinned = useSidebarStore(s => s.pinned);

  return (
    <div className="h-dvh flex overflow-hidden">
      <Sidebar />
      <main className={cn(
        "flex-1 flex flex-col min-w-0",
        sidebarConfig.transition,
        pinned ? sidebarConfig.mainMarginExpanded : sidebarConfig.mainMarginCollapsed
      )}>
        {/* h-12 header bar (provided by tool page) */}
        {/* flex-1 workspace area (your workspace component) */}
      </main>
    </div>
  );
}
```

**Note:** The tool page shell (`src/app/tools/[categoryId]/[toolId]/page.tsx`) handles sidebar integration automatically. Your workspace component receives the full remaining viewport height.

---

## APPENDIX E: GOOGLE FONTS LOADING PATTERN

```typescript
// Font pairings definition
const FONT_PAIRINGS: Record<string, { heading: string; body: string; google: string }> = {
  "inter-jetbrains": {
    heading: "Inter",
    body: "JetBrains Mono",
    google: "Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500",
  },
  "playfair-lato": {
    heading: "Playfair Display",
    body: "Lato",
    google: "Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700",
  },
  // ... more pairings
};

// In renderer:
function getGoogleFontUrl(pairingId: string): string | null {
  const pair = FONT_PAIRINGS[pairingId];
  if (!pair) return null;
  return `https://fonts.googleapis.com/css2?family=${pair.google}&display=swap`;
}
```

---

*This document is the law. Every new tool must conform to every section. Deviations require explicit approval and documentation as architectural decisions in the memory bank.*
