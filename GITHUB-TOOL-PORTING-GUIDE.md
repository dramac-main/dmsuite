# DMSuite — GitHub Open-Source Tool Porting Guide

> **Purpose:** A comprehensive, zero-fault guide for porting any tested open-source tool from GitHub into DMSuite. **ONE approach: always copy the original tool directly** — install it as an npm package or copy its source files, then wrap it in a thin DMSuite workspace. The source code IS the implementation. You adapt it, you don't reimagine it. Follow every step — skip nothing.

---

## Table of Contents

1. [Philosophy & Ground Rules](#1-philosophy--ground-rules)
2. [Pre-Port Assessment](#2-pre-port-assessment)
3. [The Copy-Paste-and-Adapt Process](#3-the-copy-paste-and-adapt-process)
4. [Branding & Theme Compliance Protocol](#4-branding--theme-compliance-protocol)
5. [Pre-Port Analysis Checklist](#5-pre-port-analysis-checklist)
6. [Platform Integration Points (The 8-Point Contract)](#6-platform-integration-points-the-8-point-contract)
7. [Handling Non-React Source Repos](#7-handling-non-react-source-repos)
8. [Step-by-Step Rebuild Process — Replace Existing Tool](#8-step-by-step-rebuild-process--replace-existing-tool)
9. [Dependency Management Rules](#9-dependency-management-rules)
10. [Styling & Theme Compliance](#10-styling--theme-compliance)
11. [State Management Patterns](#11-state-management-patterns)
12. [Chiko AI Manifest Guide](#12-chiko-ai-manifest-guide)
13. [Workspace Events Contract](#13-workspace-events-contract)
14. [Project Persistence Wiring](#14-project-persistence-wiring)
15. [Testing & Verification Protocol](#15-testing--verification-protocol)
16. [Common Failure Modes & Fixes](#16-common-failure-modes--fixes)
17. [File Checklist Template](#17-file-checklist-template)
18. [Tool Type Matrix — Which Pattern to Use](#18-tool-type-matrix--which-pattern-to-use)
19. [TOOL-STATUS.md & tools.ts Update Protocol](#19-tool-statusmd--toolsts-update-protocol)

---

## 1. Philosophy & Ground Rules

### The Core Principle
**ALWAYS copy the tool directly from GitHub. Never rewrite from scratch.**

There is ONE approach — find the best open-source implementation, bring it into DMSuite as-is, and surgically adapt only what's needed. The source code IS the implementation. You are a mechanic, not an architect.

| Variant | When | What You Do |
|---------|------|-------------|
| **📦 NPM Package** | Source is published on npm (e.g., `@excalidraw/excalidraw`, `@xyflow/react`) | **Install the package, create a thin wrapper workspace** — the package does everything, you just wire DMSuite integration. |
| **📁 Source Copy** | Source is a full app repo (not a standalone npm package) | **Copy-paste the source files into DMSuite**, then surgically adapt — swap imports, state hooks, and hardcoded colors. The UI stays intact. TypeScript is your checklist. |

### Why This Works (Proven by Sketch Board)

**The old approach** (rewriting from scratch) caused:
- AI agents "reimagining" the UI instead of replicating it → missing features, broken states
- Edge cases dropped because the AI summarized the logic instead of preserving it
- Hours spent recreating what already works

**The copy-directly approach** (proven with Excalidraw → Sketch Board) ensures:
- ✅ Every feature works because the proven code is preserved
- ✅ Every edge case is handled because the original developer's work stays intact
- ✅ AI agent's job is reduced to mechanical wiring, not creative interpretation
- ✅ TypeScript compiler catches every remaining incompatibility — zero guessing
- ✅ The source tool's community maintains and improves it — DMSuite benefits for free

### Ground Rules

| Rule | Why |
|------|-----|
| **NEVER rewrite a tool from scratch** | If a tested open-source version exists, USE IT. Wrapping > rewriting. |
| **NEVER import the source repo's dependencies blindly** | They may conflict with DMSuite's existing deps. Check first. |
| **NEVER hardcode colors, fonts, or spacing** | ALL visual tokens must come from DMSuite's Tailwind theme. |
| **ALWAYS wire the 8 integration points** | These are ALWAYS written fresh — they're DMSuite-specific. |
| **Test the source repo FIRST** | Run it locally or its live demo. Use every feature. This is your spec. |
| **One tool = one session** | Don't port 3 tools at once. Port one, verify end-to-end, commit. |
| **Copy ALL component files, not just the "main" one** | Missing a sub-component causes runtime crashes. Copy the entire feature. |
| **Let `tsc --noEmit` be your TODO list** | Every TypeScript error = one thing to adapt. Fix them ALL. When tsc passes, you're done. |
| **Keep the UI structure exactly as source** | Don't "improve" the layout or reorganize components. The source UI is proven to work. |
| **ONLY change what breaks or what violates DMSuite branding** | If it compiles and follows our theme tokens, leave it alone. |

### What "Porting" Actually Means

#### Variant A: NPM Package (Preferred)
```
@excalidraw/excalidraw (npm)          DMSuite (Target)
├── npm install                →      Package in node_modules (UNTOUCHED)
├── <Excalidraw /> component   →      Wrapped inside thin SketchBoardWorkspace.tsx
├── Their CSS                  →      Imported + CSS isolation overrides in globals.css
├── Their API (refs, callbacks)→      Wired to our theme, events, Chiko manifest
├── Their library system       →      Adapted to our server-side categorized system
└── Their settings/config      →      Mapped to our workspace props
```

#### Variant B: Source File Copy
```
GitHub Repo (Source)                  DMSuite (Target)
├── Their components          →      COPY into our workspace folder, adapt imports
├── Their state (Zustand)     →      KEEP if Zustand, wrap with our persist/immer/temporal
├── Their state (Context/etc) →      Convert to our Zustand pattern
├── Their Tailwind classes    →      KEEP — but replace any hardcoded colors with our tokens
├── Their CSS/styles          →      Convert to Tailwind v4 tokens + CSS isolation if needed
├── Their core logic/engine   →      COPY as-is (pure functions need no changes)
├── Their config/types        →      COPY, rename to our conventions
└── Their package deps        →      CHECK against our package.json — use ours where overlap exists
```

**What you ALWAYS copy/preserve:**
- The tool's core functionality (the ENTIRE library or component tree)
- Pure computation logic (algorithms, parsers, transformers, math)
- Data schemas/types (adapted to our naming conventions)
- Template definitions (converted to our format)

**What you ALWAYS write fresh:**
- The 8 integration points (store adapter, Chiko manifest, workspace events, etc.)
- CSS isolation overrides (to protect the tool's UI from Tailwind preflight)
- These are DMSuite-specific glue code that no source repo will have

---

## 2. Pre-Port Assessment

**This is the FIRST thing you do. Before any code, assess the source repo to plan your integration approach.**

### Step 1: Find the Best Open-Source Implementation

Before building anything, search GitHub for the best existing tool:

```
□ Search GitHub for: "[tool name] open source" — sort by stars
□ Check npm for published packages: "npm search [tool name]"
□ Compare top 3-5 results by: stars, last commit date, feature completeness, license
□ Prefer: MIT/Apache-2.0 license, active maintenance, published npm package, React-based
□ AVOID: AGPL/BSL/custom licenses, abandoned repos (>1yr no commits), massive bundle size
```

### Step 2: Determine Integration Variant

| If the source is... | Use Variant | Example |
|---------------------|-------------|---------|
| Published on npm as a React component | **📦 NPM Package** — install + thin wrapper | `@excalidraw/excalidraw`, `@xyflow/react`, `fabric` |
| Published on npm as a non-React library | **📦 NPM Package** — install + build React wrapper around its API | `mermaid`, `highlight.js`, `pdfjs-dist` |
| A full React app on GitHub (not on npm) | **📁 Source Copy** — copy component files, adapt imports | Custom resume builder repos, design tool repos |
| A full non-React app (Vue/Svelte/Angular) | **📦 NPM Package** — look for the underlying library it uses (most Vue/Svelte tools use a framework-agnostic core) | Vue diagram editor → uses `elkjs` (pure JS) under the hood |
| Pure vanilla JS / no framework | **📁 Source Copy** — copy the JS engine, build a React wrapper | Canvas libraries, algorithm implementations |

### Step 3: Quick Viability Checklist

```
□ License is MIT / Apache-2.0 / BSD                          (BLOCKING if not)
□ No production license enforcement (watermarks, feature gates) (BLOCKING if present)
□ Works with React 19 (check peer deps)                       (fixable with --legacy-peer-deps)
□ Bundle size is reasonable (<5MB gzipped for the core)       (warning if larger)
□ Has TypeScript types (built-in or @types/)                  (nice-to-have, can add .d.ts)
□ Active maintenance (commits in last 6 months)               (warning if stale)
□ No hard dependency on a different React framework           (check for Next.js Pages Router, Remix, etc.)
```

### Key Insight: Every Tool Has a Core Library

**Even non-React tools have a portable core.** The pattern is:

```
Vue/Svelte App (their repo)           What You Actually Install
├── Vue components (SKIP)      →      ✗ Don't need these
├── Svelte templates (SKIP)    →      ✗ Don't need these  
├── Core JS engine (USE THIS)  →      ✓ npm install their-core-library
└── API/types (USE THIS)       →      ✓ Import types, build React wrapper
```

**Real examples from DMSuite:**
- Sketch Board → installed `@excalidraw/excalidraw` (npm package, React component)
- AI Flow Builder → installed `@xyflow/react` (npm package, React component)
- Fabric tools → installed `fabric` (npm package, vanilla JS canvas library)
- PDF tools → installed `pdf-lib` (npm package, pure JS library)

---

## 3. The Copy-Paste-and-Adapt Process

> **This is THE process for every tool port.** The source code IS the implementation — you are adapting it to run inside DMSuite, not reimagining it. The UI stays intact. TypeScript catches everything that needs changing. If the source is an npm package, you install it and wrap it. If it's source files, you copy them and adapt.

### The Core Idea

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. COPY all source component files into DMSuite workspace folder  │
│  2. RUN tsc --noEmit → get the FULL list of errors                 │
│  3. FIX ONLY what TypeScript flags:                                │
│     • Broken imports → swap to our @/ paths                        │
│     • Missing types → add them                                     │
│     • Wrong state hooks → swap to our Zustand store                │
│  4. AUDIT className strings → replace hardcoded colors with tokens │
│  5. WIRE the 8 integration points (always written fresh)           │
│  6. BUILD + TEST                                                   │
│                                                                    │
│  RULE: If TypeScript doesn't complain about it, DON'T TOUCH IT.   │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase F1: Fetch & Integrate Source

#### Variant A: NPM Package (Install + Wrap)
```
Step F1.1  □  Install the package:
             npm install @scope/package-name --legacy-peer-deps  (if React 18 peer dep)
Step F1.2  □  Create the workspace wrapper:
             src/components/workspaces/tool-name/ToolNameWorkspace.tsx
             - Dynamic import the package (avoid SSR issues):
               const [mod, setMod] = useState(null);
               useEffect(() => { import("package-name").then(setMod); }, []);
             - Render their component with DMSuite theme sync
             - Wire workspace events, Chiko manifest, persistence
Step F1.3  □  Handle CSS:
             - Import their CSS in a local .css file or excalidraw-theme.css pattern
             - Add CSS isolation overrides in globals.css (Section 16: CSS Isolation)
             - Tailwind preflight WILL break their UI — protect it
Step F1.4  □  DO NOT copy: their source components, their build config, their routing
             (You're using their PACKAGE, not their repo)
```

#### Variant B: Source File Copy
```
Step F1.1  □  Fetch the source repo (clone or read via GitHub URL)
Step F1.2  □  Identify ALL component files that make up the tool's UI
             - The main workspace/page component
             - ALL sub-components it imports (panels, dialogs, toolbars, etc.)
             - ALL hooks it uses (custom hooks)
             - ALL utility functions it imports
             - ALL type definitions it uses
             - ALL constants/config files it references
Step F1.3  □  Copy these files into DMSuite:
             - Components → src/components/workspaces/tool-name/
             - Hooks → src/hooks/ (or keep inline in workspace folder if tool-specific)
             - Utils/engine → src/lib/tool-name/
             - Types → src/types/tool-name.ts (or inline in component)
             - Constants/templates → src/data/tool-name-*.ts
Step F1.4  □  DO NOT copy: their layout shell, auth, theme toggle, router, package.json
             (DMSuite already has all of these)
```

### Phase F2: TypeScript Error-Driven Adaptation

**This is the most important phase. TypeScript IS your migration checklist.**

```
Step F2.1  □  Run: npx tsc --noEmit 2>&1 | head -100
             Every error is something you MUST fix. No error = nothing to change.

Step F2.2  □  Fix import errors (most common):
             SOURCE:  import { Button } from "../components/ui/Button"
             FIX:     import { Button } from "@/components/ui/Button"  ← IF we have it
                 OR:  Inline the component / create minimal version   ← IF we don't

             SOURCE:  import { useAppStore } from "../store"
             FIX:     import { useToolNameEditor } from "@/stores/tool-name-editor"

             SOURCE:  import { FiDownload } from "react-icons/fi"
             FIX:     import { IconDownload } from "@/components/icons"

             SOURCE:  import styles from "./Component.module.css"
             FIX:     DELETE this import, convert CSS module classes to Tailwind

Step F2.3  □  Fix state management hooks:
             SOURCE:  const dispatch = useDispatch()
                      dispatch(setTitle("new"))
             FIX:     const { setTitle } = useToolNameEditor()
                      setTitle("new")

             SOURCE:  const title = useSelector(state => state.tool.title)
             FIX:     const title = useToolNameEditor(s => s.form.title)

             SOURCE:  const [state, setState] = useContext(ToolContext)
             FIX:     const state = useToolNameEditor()

Step F2.4  □  Fix component library imports:
             If source uses shadcn/ui, MUI, Ant Design, Chakra, etc.:
             - Simple components (Button, Input, Select): replace with our Tailwind equivalents
               or create a minimal local version in the workspace folder
             - Complex components (DataTable, Calendar, Dialog): check if we have one in
               src/components/ui/, if not, build a minimal Tailwind version
             - DO NOT install their component library

Step F2.5  □  Fix routing:
             SOURCE:  import { useRouter } from "next/navigation" → router.push("/tool/...")
             FIX:     Remove or adapt — tools are single-page workspaces in DMSuite

             SOURCE:  import { Link } from "react-router-dom"
             FIX:     import Link from "next/link" (if actually needed, usually not)

Step F2.6  □  Run tsc --noEmit again
             Repeat until 0 errors. Each pass should have fewer errors.

Step F2.7  □  IMPORTANT: Do NOT suppress errors with `as any` or `@ts-ignore`
             Every error represents a real incompatibility. Fix it properly.
```

### Phase F3: Branding Compliance Sweep

**The UI layout stays exactly as source. You are ONLY changing colors/spacing to use DMSuite tokens.**

```
Step F3.1  □  Search for hardcoded hex colors in className strings:
             Find:    className="text-[#4f46e5]"  or  className="bg-[#1e1e2e]"
             Replace: className="text-primary-500"  or  className="bg-gray-900"
             (See Section 4 for the full color mapping table)

Step F3.2  □  Search for hardcoded hex colors in inline styles:
             Find:    style={{ color: '#4f46e5', background: '#111' }}
             Replace: Use className with Tailwind tokens instead
             EXCEPTION: Dynamic colors that MUST be computed at runtime (e.g., user picks a color)
                        are OK as inline styles — but use CSS variables where possible

Step F3.3  □  Search for hardcoded pixel values in className strings:
             Find:    className="w-[73px]" or className="h-[200px]"
             Replace: className="w-18" or className="h-48" (nearest token)
             EXCEPTION: Very specific sizes for canvas/SVG rendering are OK

Step F3.4  □  Verify dark mode compliance:
             Every bg-*, text-*, border-* class should have a dark: variant
             If source repo doesn't support dark mode, ADD dark: variants now:
             SOURCE:  className="bg-white text-gray-900"
             FIX:     className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"

Step F3.5  □  Verify Tailwind v4 syntax:
             Find:    bg-gradient-to-br  (v3 syntax)
             Replace: bg-linear-to-br    (v4 syntax)

Step F3.6  □  Replace any external icon imports:
             Find:    import { X } from "lucide-react"
                 OR:  import { FiX } from "react-icons/fi"
             Replace: import { IconClose } from "@/components/icons"
             If we don't have the icon, add it to src/components/icons.tsx + iconMap
```

### Phase F4: State Management Adaptation

**If the source uses Zustand already, this is easy. If it uses Redux/Context, create our store from their state shape.**

```
Step F4.1  □  Identify the source's state shape:
             Look at their store/context for ALL state fields and actions
             Document: { field: type, field: type, ... }

Step F4.2  □  Create our Zustand store with their EXACT same fields:
             File: src/stores/tool-name-editor.ts
             - Preserve their field names (don't rename unless necessary)
             - Add our middleware: persist + immer (+ temporal if undo/redo needed)
             - Add setForm() and resetForm() for DMSuite compatibility
             - localStorage key: "dmsuite-tool-name"

Step F4.3  □  If source uses Zustand already:
             - COPY their store file
             - WRAP with our persist + immer middleware
             - ADD setForm() / resetForm() if missing
             - CHANGE the persist key to "dmsuite-tool-name"
             - That's it.

Step F4.4  □  In the copied components, find-replace state hooks:
             If source uses Redux:    useSelector(s => s.xxx) → useToolNameEditor(s => s.xxx)
             If source uses Context:  useToolContext() → useToolNameEditor()
             If source uses Zustand:  useSourceStore() → useToolNameEditor()
```

### Phase F5: Wire the 8 Integration Points

**These are ALWAYS written fresh. No source repo has them.**

```
Step F5.1  □  Ensure workspace component has "use client" as FIRST LINE
Step F5.2  □  Add to page.tsx dynamic imports:
             "your-tool-id": dynamic(() => import("@/components/workspaces/tool-name/ToolNameWorkspace")),
Step F5.3  □  Create store adapter in src/lib/store-adapters.ts
Step F5.4  □  Create Chiko manifest in src/lib/chiko/manifests/tool-name.ts
Step F5.5  □  Add workspace event dispatching in the workspace component:
             - workspace:dirty on any user edit
             - workspace:progress on milestones
             - workspace:save on export
Step F5.6  □  Update src/data/tools.ts entry (status: "ready", devStatus: "complete")
Step F5.7  □  Update src/data/credit-costs.ts (if AI-powered)
Step F5.8  □  Add icon to src/components/icons.tsx if needed
```

(See Section 6 for full details on each integration point.)

### Phase F6: Compile, Build, Test

```
Step F6.1  □  npx tsc --noEmit → MUST be 0 errors
Step F6.2  □  npm run build → MUST succeed
Step F6.3  □  npm run dev → navigate to tool
             □  Verify it loads (no blank screen)
             □  Verify ALL features work exactly as in the source repo
             □  Verify dark mode looks correct
             □  Verify light mode looks correct
Step F6.4  □  Compare source repo side-by-side with DMSuite version:
             Every feature in source MUST work identically in DMSuite.
             If something is missing or broken, the copy was incomplete — go back to F1.
```

### Port Checklist (copy this for each tool)

```markdown
## Tool Port: [Tool Name] from [Source Repo URL]

### Source Assessment
- [ ] Source type: NPM Package / Source Copy
- [ ] License: MIT / Apache-2.0 / BSD / Other: ___
- [ ] Package name (if npm): ___
- [ ] React-based: YES/NO
- [ ] TypeScript: YES/NO
- [ ] Has Tailwind: YES/NO

### Files Copied
- [ ] Listed ALL source files needed
- [ ] Copied to correct DMSuite locations
- [ ] Did NOT copy: layout, auth, theme, router

### TypeScript Adaptation (tsc --noEmit driven)
- [ ] Fixed all import paths
- [ ] Replaced state management hooks
- [ ] Replaced component library imports
- [ ] Replaced icon imports
- [ ] 0 TypeScript errors remaining

### Branding Compliance
- [ ] No hardcoded hex colors in className
- [ ] No hardcoded hex colors in inline styles
- [ ] No hardcoded pixel values (except canvas/SVG)
- [ ] Dark mode variants on all surfaces
- [ ] Tailwind v4 syntax (bg-linear-to, not bg-gradient-to)
- [ ] All icons from @/components/icons

### 8 Integration Points
- [ ] tools.ts entry updated
- [ ] Dynamic import in page.tsx
- [ ] Store adapter in store-adapters.ts
- [ ] Chiko manifest created + barrel exported
- [ ] Workspace events dispatched
- [ ] Credit costs (if AI-powered)
- [ ] Icon added (if needed)
- [ ] "use client" directive present

### Verification
- [ ] tsc --noEmit: 0 errors
- [ ] npm run build: success
- [ ] Tool loads in browser
- [ ] All source features work identically
- [ ] Dark + light mode correct
- [ ] TOOL-STATUS.md updated
```

---

## 4. Branding & Theme Compliance Protocol

> **The UI layout, structure, and interactions from the source repo stay UNTOUCHED. You ONLY change the visual tokens so colours, fonts, and spacing pull from DMSuite's theme — never hardcoded.**

### The Golden Rule
```
✅ The copied code should reference DMSuite's Tailwind design tokens for ALL visual properties.
✅ The UI structure, layout, component hierarchy, and interactions remain exactly as source.
❌ Do NOT redesign, rearrange, or "improve" the UI.
❌ Do NOT hardcode ANY hex color, pixel value, or font family.
```

### Color Token Mapping Table

When you find hardcoded colors in the source, map them to DMSuite tokens:

| Source Color | Likely Purpose | DMSuite Token |
|-------------|----------------|---------------|
| `#4f46e5`, `#6366f1`, `#8b5cf6` | Primary/accent | `primary-500`, `primary-400` |
| `#06b6d4`, `#0ea5e9`, `#22d3ee` | Secondary/info | `secondary-500`, `info` |
| `#10b981`, `#22c55e` | Success | `success` |
| `#ef4444`, `#f43f5e` | Error/danger | `error` |
| `#f59e0b`, `#eab308` | Warning | `warning` |
| `#ffffff`, `#fafafa` | Light background | `white dark:bg-gray-900` |
| `#f3f4f6`, `#f9fafb` | Light surface | `gray-100 dark:bg-gray-800` |
| `#e5e7eb`, `#d1d5db` | Border (light) | `gray-200 dark:border-gray-700` |
| `#111827`, `#1f2937` | Dark background | `gray-900` |
| `#374151`, `#4b5563` | Dark surface | `gray-700`, `gray-600` |
| `#6b7280`, `#9ca3af` | Muted text | `gray-500 dark:text-gray-400` |
| `#111827`, `#030712` | Primary text (light mode) | `gray-900 dark:text-gray-100` |
| Any specific brand color | Depends | Map to nearest primary/secondary/gray token |

### Font Compliance

```
SOURCE:  font-family: 'Helvetica', sans-serif
FIX:     className="font-sans"                  ← uses Inter (our theme font)

SOURCE:  font-family: 'Fira Code', monospace
FIX:     className="font-mono"                  ← uses JetBrains Mono (our theme font)

NEVER:   style={{ fontFamily: 'Custom Font' }}
```

### Spacing Compliance

```
SOURCE:  className="p-[18px]"    →  className="p-4" or "p-5"     (nearest token: 16px or 20px)
SOURCE:  className="gap-[14px]"  →  className="gap-3.5"          (nearest token: 14px)
SOURCE:  className="w-[300px]"   →  className="w-72" or "w-80"   (nearest: 288px or 320px)
SOURCE:  className="h-[calc(100vh-64px)]" → className="h-[calc(100vh-64px)]"  ← OK, this is layout math
```

**Exception:** `calc()` expressions for layout dimensions are acceptable as arbitrary values since they're responsive layout math, not design tokens.

### What NOT to Change

```
✅ KEEP: Component structure and hierarchy
✅ KEEP: Event handlers and user interactions
✅ KEEP: Conditional rendering logic
✅ KEEP: Animation/transition classes (if using Tailwind or framer-motion)
✅ KEEP: Responsive breakpoints (sm:, md:, lg:, xl:)
✅ KEEP: Accessibility attributes (aria-*, role, tabIndex)
✅ KEEP: Form validation logic
✅ KEEP: Error/loading/empty state handling
```

---

## 5. Pre-Port Analysis Checklist

Before writing any code, complete this analysis of the GitHub repo:

### A. Run the Source Repo Locally
```
□ Clone the repo
□ Install dependencies (note their package.json)
□ Run the dev server
□ Use EVERY feature — screenshot each one
□ Note the tech stack (React? Vue? Svelte? Vanilla?)
□ Note the styling approach (CSS modules? Tailwind? styled-components?)
□ Note the state management (Redux? Zustand? Context? MobX? Signals?)
□ Note the build system (Vite? CRA? Next.js? Webpack?)
```

### B. Feature Inventory
Create a markdown table of every feature:

```markdown
| # | Feature | Source File(s) | Portable? | DMSuite Pattern | Priority |
|---|---------|----------------|-----------|-----------------|----------|
| 1 | PDF Merge | src/lib/merge.ts | YES - pure logic | lib/tool-name/engine.ts | P0 |
| 2 | Drag-drop upload | src/components/Upload.tsx | NO - rewrite | workspace component | P0 |
| 3 | Dark mode | src/theme/* | NO - use ours | Already handled | Skip |
| 4 | Auth | src/auth/* | NO - use ours | Already handled | Skip |
| 5 | Export PNG | src/utils/export.ts | PARTIAL | adapt to our export | P1 |
```

### C. Dependency Audit
```markdown
| Dependency | Version | Already in DMSuite? | Conflict Risk? | Action |
|------------|---------|---------------------|----------------|--------|
| fabric | 5.3.0 | YES (v5.3.0) | None | Use ours |
| pdf-lib | 1.17.1 | YES (v1.17.1) | None | Use ours |
| some-lib | 2.1.0 | NO | Check | Evaluate |
| redux | 5.0.0 | NO | Zustand conflict | DO NOT INSTALL |
```

### D. Architecture Classification

Classify the tool into one of DMSuite's 4 workspace patterns:

| Pattern | When to Use | Examples in DMSuite |
|---------|-------------|---------------------|
| **Pattern A: Fabric.js Visual Editor** | Canvas-based design tools (certificates, posters, cards, etc.) | BusinessCardWorkspace, CertificateDesignerWorkspace, BannerAdWorkspace |
| **Pattern B: Form-based Document Editor** | Structured document editors with form inputs → rendered output | ContractWorkspace, ResumeBuilderWorkspace, SalesBookWorkspace |
| **Pattern C: Utility/Processor** | Tools that process input → output (no persistent canvas) | BackgroundRemoverWorkspace, PDFToolsWorkspace, FileConverterWorkspace |
| **Pattern D: AI Content Generator** | Text/content gen tools with AI at the core | BlogWriterWorkspace, SocialCopyWorkspace |

---

## 6. Platform Integration Points (The 8-Point Contract)

**Every tool MUST wire into exactly these 8 integration points.** Missing ANY of them causes bugs or broken features. This is the checklist that guarantees zero faults.

### The 8-Point Contract

```
┌────────────────────────────────────────────────────────────────┐
│  1. TOOLS.TS ENTRY           — Tool exists in the registry     │
│  2. WORKSPACE COMPONENT      — The actual UI                   │
│  3. DYNAMIC IMPORT           — Router knows about it           │
│  4. ZUSTAND STORE            — State management                │
│  5. STORE ADAPTER            — Project persistence bridge      │
│  6. CHIKO MANIFEST           — AI assistant integration        │
│  7. WORKSPACE EVENTS         — Progress/dirty tracking         │
│  8. CREDIT COSTS             — Pricing (if AI-powered)         │
│                                                                │
│  OPTIONAL:                                                     │
│  • API Route(s)              — If server-side AI is needed     │
│  • Template Data             — If tool has presets/templates   │
│  • Lib Engine Module         — Core logic (reusable)           │
└────────────────────────────────────────────────────────────────┘
```

### Integration Point Details

#### 1. `src/data/tools.ts` — Tool Registry Entry
```typescript
{
  id: "your-tool-id",           // kebab-case, unique across all 250+ tools
  name: "Your Tool Name",       // Human-readable
  description: "What it does",  // 1-2 sentences
  icon: "iconKey",              // Must exist in iconMap (src/components/icons.tsx)
  status: "ready",              // "ready" | "beta" | "coming-soon"
  tags: ["tag1", "tag2"],       // For dashboard search
  devStatus: "complete",        // "complete" | "scaffold" | "no-ui"
  aiProviders: ["claude"],      // Which AI (if any)
  outputs: ["pdf", "png"],      // Export formats
  supportsPartEdit: true,       // Optional
  printReady: true,             // Optional
  printSizes: ["A4", "letter"], // Optional
}
```

#### 2. Workspace Component — `src/components/workspaces/[tool-name]/ToolNameWorkspace.tsx`
```typescript
"use client";
// MUST have "use client" directive — it's interactive

export default function ToolNameWorkspace() {
  // ... workspace UI
}
```

#### 3. Dynamic Import — `src/app/tools/[categoryId]/[toolId]/page.tsx`
```typescript
// In the workspaceComponents Record:
"your-tool-id": dynamic(() => import("@/components/workspaces/[tool-name]/ToolNameWorkspace")),
```

#### 4. Zustand Store — `src/stores/tool-name-editor.ts`
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";

// Store with persist + immer + undo/redo
export const useToolNameEditor = create<ToolNameState>()(
  temporal(
    persist(
      immer((set, get) => ({
        form: { /* initial state */ },
        // ... actions
        setForm: (form) => set({ form }),
        resetForm: () => set({ form: { /* initial */ } }),
      })),
      { name: "dmsuite-tool-name" }  // localStorage key
    )
  )
);
```

#### 5. Store Adapter — `src/lib/store-adapters.ts`
```typescript
// Add adapter function:
function getToolNameAdapter(): StoreAdapter {
  const { useToolNameEditor } = require("@/stores/tool-name-editor");
  return {
    getSnapshot: () => {
      const { form } = useToolNameEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useToolNameEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useToolNameEditor.getState().resetForm();
      nukePersistStorage("dmsuite-tool-name");
    },
    subscribe: (cb) => useToolNameEditor.subscribe(cb),
  };
}

// Add to ADAPTER_FACTORIES:
"your-tool-id": getToolNameAdapter,
```

#### 6. Chiko Manifest — `src/lib/chiko/manifests/tool-name.ts`
```typescript
import type { ChikoActionManifest } from "@/stores/chiko-actions";

export function createToolNameManifest(/* refs/store */): ChikoActionManifest {
  return {
    toolId: "your-tool-id",
    toolName: "Your Tool Name",
    actions: [
      {
        name: "readCurrentState",
        description: "Read the current state of the tool",
        parameters: {},
        category: "Info",
      },
      // ... more actions
    ],
    getState: () => { /* return current state */ },
    executeAction: (name, params) => { /* handle actions */ },
  };
}
```
Then add to barrel export in `src/lib/chiko/manifests/index.ts`.

#### 7. Workspace Events — Dispatched from workspace component
```typescript
// When user makes any change:
window.dispatchEvent(new CustomEvent("workspace:dirty"));

// When meaningful progress happens:
window.dispatchEvent(new CustomEvent("workspace:progress", {
  detail: { milestone: "input" }     // or "content" or "exported"
}));

// For wizard-style progress:
window.dispatchEvent(new CustomEvent("workspace:progress", {
  detail: { progress: 50 }           // percentage 0-100
}));

// When user exports/saves output:
window.dispatchEvent(new CustomEvent("workspace:save"));
```

#### 8. Credit Costs — `src/data/credit-costs.ts`
```typescript
// In CREDIT_COSTS object:
"tool-name-generate": 10,   // AI generation cost
"tool-name-revise": 8,      // AI revision cost

// In TOOL_CREDIT_MAP:
"your-tool-id": "tool-name-generate",
```

---

## 7. Handling Non-React Source Repos

> **Even when the source repo uses Vue, Svelte, Angular, or vanilla JS — you still DON'T rewrite from scratch.** Instead, find the underlying library and install it. Every complex tool has a framework-agnostic core.

### The Strategy: Install the Core, Wrap in React

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. IDENTIFY the core library the source repo depends on            │
│  2. INSTALL that library via npm (it's almost always available)     │
│  3. CREATE a thin React wrapper workspace component                │
│  4. WIRE the library's API to DMSuite integration points           │
│  5. ADD CSS isolation to protect the library's UI from Tailwind    │
│  6. NEVER rewrite the library's logic — use it as-is               │
│                                                                    │
│  RULE: If you find yourself writing >500 lines of custom logic,   │
│  you're doing it wrong. Find a better library.                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Real Examples from DMSuite

| Source Repo | Framework | What We Actually Used | How |
|-------------|-----------|----------------------|-----|
| Excalidraw (React app) | React | `@excalidraw/excalidraw` npm package | Installed, thin wrapper, CSS isolation |
| ReactFlow (React lib) | React | `@xyflow/react` npm package | Installed, created FlowCanvas + custom nodes |
| Fabric.js demos | Vanilla JS | `fabric` npm package | Installed, created `use-editor.ts` hook + FabricEditor |
| PDF.js viewer apps | Various | `pdf-lib` npm package | Installed, used for PDF manipulation |

### Step-by-Step: Non-React Source → DMSuite Tool

```
Step 1  □  Clone the source repo and study its package.json
           - What is the CORE dependency that does the heavy lifting?
           - Is that core dependency published on npm?
           - Is it framework-agnostic (no React/Vue/Svelte required)?

Step 2  □  Install the core library:
           npm install core-library-name
           npm install @types/core-library-name  (if separate types)

Step 3  □  Create the workspace wrapper:
           src/components/workspaces/tool-name/ToolNameWorkspace.tsx
           "use client";

           - Dynamic import the library (avoid SSR):
             useEffect(() => { import("core-library").then(setLib); }, []);
           - Initialize the library on a DOM ref (if it renders to canvas/DOM)
           - Expose the library's API via refs for Chiko integration
           - Sync DMSuite theme with the library's theme API

Step 4  □  Handle the library's CSS:
           - If the library has CSS: import it in a local .css wrapper file
           - Add CSS isolation in globals.css to prevent Tailwind conflicts
           - Test BOTH dark and light themes

Step 5  □  Copy any supplementary logic from the source repo:
           - Utility functions, data processing, export helpers
           - Template definitions, preset configurations
           - BUT NOT: their components, their state management, their routing

Step 6  □  Wire the 8 DMSuite integration points (Section 6)
           These are always written fresh — same as any other port.

Step 7  □  Test: tsc --noEmit → npm run build → verify in browser
```

### What If There's No Published npm Package?

Rare, but it happens. In this case:

```
1. Check if the repo's core logic is in a separate /lib or /src/lib folder
   → Copy ONLY those pure JS/TS files into src/lib/tool-name/
   → Build a React component around that logic

2. Check if someone has forked/extracted the core into a standalone package
   → npm search for related packages

3. As a last resort: copy the source's component files verbatim
   → Convert their framework-specific code to React
   → This is STILL copying, not rewriting — preserve their logic exactly
   → Only change what's needed to make it React + TypeScript
```

---

## 8. Step-by-Step Rebuild Process — Replace Existing Tool

When you find a better GitHub implementation of a tool that already exists in DMSuite, follow this enhanced process.

### CRITICAL: Complete Erasure Protocol

**The old tool must be COMPLETELY REMOVED before building the new one.** Partial replacements cause ghost imports, type conflicts, and state contamination.

### Phase R1: Document What Exists

```
Step R1.1  □  List ALL files belonging to the current tool:
            □  Workspace component(s) — src/components/workspaces/tool-name/
            □  Store — src/stores/tool-name-editor.ts
            □  Manifest — src/lib/chiko/manifests/tool-name.ts
            □  Engine/lib — src/lib/tool-name/
            □  Templates — src/data/tool-name-templates.ts
            □  API routes — src/app/api/chat/tool-name/
            □  Types — src/types/tool-name.ts

Step R1.2  □  Note all integration points that reference the old tool:
            □  page.tsx dynamic import entry
            □  store-adapters.ts adapter function + ADAPTER_FACTORIES entry
            □  manifests/index.ts barrel export
            □  tools.ts entry (keep this — just update it)
            □  credit-costs.ts entries (keep these — just update if needed)
            □  Any other files that import from the old tool's files
```

### Phase R2: Complete Erasure

```
Step R2.1  □  Delete ALL old workspace components
            rm -rf src/components/workspaces/tool-name/
            (or individual files if tool is a single .tsx file)

Step R2.2  □  Delete old store (ONLY if the store shape is completely different)
            rm src/stores/tool-name-editor.ts
            ⚠ If just enhancing, you may REWRITE the store in-place instead

Step R2.3  □  Delete old manifest
            rm src/lib/chiko/manifests/tool-name.ts

Step R2.4  □  Delete old engine/lib code
            rm -rf src/lib/tool-name/

Step R2.5  □  Delete old templates
            rm src/data/tool-name-templates.ts

Step R2.6  □  Delete old API routes (if being replaced)
            rm -rf src/app/api/chat/tool-name/

Step R2.7  □  Clean up broken imports:
            - In page.tsx: Comment out the dynamic import line (don't delete — need the key)
            - In store-adapters.ts: Comment out or stub the adapter function
            - In manifests/index.ts: Comment out the barrel export
            - Run tsc --noEmit to find ALL remaining broken imports
            - Fix every broken import (comment/remove lines)

Step R2.8  □  Verify clean state:
            npx tsc --noEmit — must have 0 errors
            This confirms complete erasure with no ghost references
```

### Phase R3: Build New Tool

Follow Section 3 (The Copy-Paste-and-Adapt Process) exactly — find the best open-source implementation, install it or copy it, and wire the 8 integration points.

### Phase R4: Data Migration Consideration

```
Step R4.1  □  If the store shape changed, OLD project data is incompatible
            - restoreSnapshot() should handle missing/extra fields gracefully
            - Add fallback defaults for new fields
            - Add version field to store for future migrations

Step R4.2  □  If the localStorage persist key changed, old data orphans
            - If you kept the same key ("dmsuite-tool-name"), old data
              will attempt to rehydrate — make sure shape is compatible
            - If you changed the key, old data is simply ignored (safe)

Step R4.3  □  User's existing projects for this tool:
            - IndexedDB + Supabase project_data still has old snapshots
            - restoreSnapshot() MUST handle old format without crashing
            - Pattern: add null checks for every field being accessed
```

---

## 9. Dependency Management Rules

### Rule 1: Check Before Installing
```bash
# Before: npm install some-new-package
# FIRST check if it exists:
cat package.json | grep "some-new-package"
# Or search for builtins that do the same thing
```

### Rule 2: Existing Dependencies (USE these, do NOT install alternatives)

| Purpose | Package in DMSuite | Do NOT Install |
|---------|-------------------|----------------|
| Canvas/Design | `fabric` (v5) | paper.js, konva, pixi.js |
| PDF | `pdf-lib`, `@pdf-lib/fontkit` | jsPDF, pdfmake, react-pdf |
| State | `zustand`, `immer`, `zundo` | redux, mobx, recoil, jotai |
| Animation | `framer-motion` | react-spring, gsap |
| Styling | Tailwind CSS v4 | styled-components, emotion, CSS modules |
| Icons | Custom SVGs (`icons.tsx`) | lucide-react, react-icons, heroicons |
| Utils | `clsx`, `tailwind-merge` | classnames |
| Fonts | `fontfaceobserver` | webfontloader |
| Auth | `@supabase/supabase-js` | firebase, auth0, clerk |
| AI | `anthropic` (via API routes) | openai, langchain |
| Dates | Native `Date` or `Intl` | moment, dayjs, date-fns |
| HTTP | Native `fetch` | axios |

### Rule 3: When to Install New Packages

ONLY install a new package when:
1. DMSuite has no existing solution for that functionality
2. The package provides core tool functionality that cannot be reasonably hand-coded
3. It has >10k weekly npm downloads (established, maintained)
4. It has TypeScript types (built-in or `@types/`)
5. It doesn't import React/Vue/Angular (pure library preferred)
6. Bundle size is reasonable (check with `bundlephobia.com`)

**Examples of acceptable new installs:**
- `@imgly/background-removal` — ONNX model for bg removal (unique capability)
- `highlight.js` — Code syntax highlighting (not worth hand-coding)
- `katex` — Math equation rendering (complex)
- `mermaid` — Diagram rendering (complex)

**Examples of REJECTED installs:**
- `react-beautiful-dnd` — Use native drag events or Framer Motion
- `react-hook-form` — Simple useState/useReducer is fine
- `react-query` — Simple fetch + useState is fine for our use case
- `lodash` — Use native JS methods

### Rule 4: Peer Dependency Conflicts
If `npm install` shows peer dependency warnings:
```bash
# Check if it's a real conflict:
npm ls conflicting-package
# If the versions are close and it works, use --legacy-peer-deps
npm install new-package --legacy-peer-deps
# If it's a major version mismatch, find an alternative package
```

---

## 10. Styling & Theme Compliance

### Absolute Rules (Violation = Broken UI in production)

```
❌ NEVER: style={{ color: '#ff0000' }}
❌ NEVER: className="text-[#ff0000]"
❌ NEVER: className="w-[73px]"
❌ NEVER: className="bg-gradient-to-br"   (Tailwind v3 syntax)
✅ ALWAYS: className="text-error"
✅ ALWAYS: className="w-18"               (use tokens)
✅ ALWAYS: className="bg-linear-to-br"    (Tailwind v4 syntax)
```

### Dark Mode Compliance Pattern
Every surface element needs BOTH light and dark variants:
```tsx
// Background layers (darkest → lightest):
className="bg-gray-50 dark:bg-gray-950"     // page body
className="bg-white dark:bg-gray-900"       // sidebar, main panels
className="bg-gray-100 dark:bg-gray-800"    // cards, sections
className="bg-gray-200 dark:bg-gray-700"    // hover states, borders

// Text:
className="text-gray-900 dark:text-gray-100"   // primary text
className="text-gray-600 dark:text-gray-400"   // secondary text
className="text-gray-400 dark:text-gray-500"   // muted/placeholder

// Borders:
className="border-gray-200 dark:border-gray-700"   // standard
className="border-gray-300 dark:border-gray-600"   // emphasized

// Interactive:
className="bg-primary-500 hover:bg-primary-600 text-white"   // primary button
className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600" // secondary
```

### Converting Source Repo Styles

| Source Repo CSS | DMSuite Tailwind |
|----------------|------------------|
| `color: #333` | `text-gray-800 dark:text-gray-200` |
| `background: #1a1a2e` | `bg-gray-900` |
| `border: 1px solid #ddd` | `border border-gray-200 dark:border-gray-700` |
| `font-size: 14px` | `text-sm` |
| `padding: 16px` | `p-4` |
| `margin: 8px 16px` | `mx-4 my-2` |
| `border-radius: 8px` | `rounded-lg` |
| `box-shadow: ...` | `shadow-md` or `shadow-lg` |
| `display: flex; gap: 12px` | `flex gap-3` |
| `width: 300px` | `w-72` or `w-80` (nearest token) |

### Glassmorphism Pattern (for elevated surfaces)
```tsx
className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-lg border border-white/10 dark:border-white/[0.06] rounded-xl"
```

### Icons: Using DMSuite Icon System
```tsx
// NEVER import from another icon library
// ❌ import { FiScissors } from "react-icons/fi"
// ❌ import { Scissors } from "lucide-react"

// ✅ Use DMSuite icons:
import { IconScissors, IconDownload, IconCheck } from "@/components/icons";
// OR dynamic lookup:
import { getIcon } from "@/components/icons";
const ToolIcon = getIcon("scissors"); // Returns component or FallbackIcon
```

---

## 11. State Management Patterns

### Pattern A Store: Fabric.js Tools (use shared store)
```typescript
// These tools use the shared useFabricProjectStore
// No custom store needed — state lives in Fabric.js canvas JSON
import { useFabricProjectStore } from "@/stores/fabric-project";

// The workspace just reads/writes fabricJson:
const { fabricJson, setFabricState } = useFabricProjectStore();
```

### Pattern B Store: Form-based Document Tools
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";

// Define your form state interface
interface ToolForm {
  title: string;
  sections: Section[];
  style: StyleConfig;
  // ... all fields
}

// Default state (used for reset)
const DEFAULT_FORM: ToolForm = {
  title: "Untitled",
  sections: [],
  style: { template: "default", accentColor: "#8b5cf6" },
};

interface ToolState {
  form: ToolForm;
  // Actions
  setForm: (form: ToolForm) => void;
  resetForm: () => void;
  updateField: <K extends keyof ToolForm>(key: K, value: ToolForm[K]) => void;
  // ... tool-specific actions
}

export const useToolEditor = create<ToolState>()(
  temporal(
    persist(
      immer((set) => ({
        form: DEFAULT_FORM,
        setForm: (form) => set({ form }),
        resetForm: () => set({ form: DEFAULT_FORM }),
        updateField: (key, value) => set((s) => { s.form[key] = value; }),
      })),
      { name: "dmsuite-tool-name" }  // Unique localStorage key
    )
  )
);
```

### Pattern C Store: Utility Tools (often stateless)
```typescript
// Many utility tools don't need a persistent store
// They use local useState in the component
// Only create a Zustand store if:
//   - User expects to resume work after refresh
//   - Tool has significant configuration to persist
//   - Project system integration is needed
```

### Key Rules for ALL Stores
1. **persist key MUST be unique**: `"dmsuite-{tool-name}"` — collision = data corruption
2. **resetForm() MUST return EXACT initial state**: Not `{}`, but the full default shape
3. **immer enables direct mutation**: `set((s) => { s.form.title = "new" })` is valid
4. **temporal enables undo/redo**: Components access via `useToolEditor.temporal.getState().undo()`

---

## 12. Chiko AI Manifest Guide

### Manifest Structure
Every tool's manifest follows this exact pattern:

```typescript
import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";

export function createToolNameManifest(store: ReturnType<typeof useToolEditor>): ChikoActionManifest {
  return {
    toolId: "your-tool-id",
    toolName: "Your Tool Name",
    actions: [
      // ── Info Actions (always include these) ──
      {
        name: "readCurrentState",
        description: "Read the complete current state of the tool workspace",
        parameters: {},
        category: "Info",
      },

      // ── Content Actions ──
      {
        name: "updateTitle",
        description: "Change the document title",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "New title text" },
          },
          required: ["title"],
        },
        category: "Content",
      },

      // ── Style Actions ──
      {
        name: "changeTemplate",
        description: "Switch to a different visual template",
        parameters: {
          type: "object",
          properties: {
            templateId: { type: "string", description: "Template ID", enum: ["clean", "bold", "minimal"] },
          },
          required: ["templateId"],
        },
        category: "Style",
      },

      // ── Export Actions ──
      {
        name: "triggerExport",
        description: "Export the current document",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["pdf", "png"] },
          },
        },
        category: "Export",
      },
    ],

    getState: () => {
      const state = store.getState();
      return {
        title: state.form.title,
        template: state.form.style.template,
        sectionCount: state.form.sections.length,
        // Return a readable summary — not the raw store dump
      };
    },

    executeAction: (name: string, params: Record<string, unknown>): ChikoActionResult => {
      try {
        const s = store.getState();
        switch (name) {
          case "readCurrentState":
            return {
              success: true,
              message: `Tool state: title="${s.form.title}", template="${s.form.style.template}", ${s.form.sections.length} sections`,
            };

          case "updateTitle":
            s.updateField("title", params.title as string);
            return { success: true, message: `Title updated to "${params.title}"` };

          case "changeTemplate":
            s.updateField("style", { ...s.form.style, template: params.templateId as string });
            return { success: true, message: `Template changed to ${params.templateId}` };

          default:
            return { success: false, message: `Unknown action: ${name}` };
        }
      } catch (err) {
        return { success: false, message: `Error: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };
}
```

### Registering the Manifest in Workspace
```typescript
// In your workspace component:
import { useChikoActions } from "@/hooks/useChikoActions";
import { createToolNameManifest } from "@/lib/chiko/manifests/tool-name";
import { useToolEditor } from "@/stores/tool-name-editor";

function ToolNameWorkspace() {
  const store = useToolEditor;
  useChikoActions(useCallback(() => createToolNameManifest(store), [store]));
  // ... rest of component
}
```

### For Fabric.js Tools (use chikoManifestFactory prop)
```typescript
function ToolNameWorkspace() {
  return (
    <FabricEditor
      config={TOOL_CONFIG}
      onSave={handleSave}
      chikoManifestFactory={(editor) => createToolNameFabricManifest(editor)}
    />
  );
}
```

### Minimum Required Actions (for any tool)
1. `readCurrentState` — Chiko MUST be able to read what's in the tool
2. At least ONE write action — Chiko should be able to modify something
3. Category labels for UI grouping

---

## 13. Workspace Events Contract

### Events That MUST Be Dispatched

Every workspace MUST dispatch these events at the right moments. The tool page (`page.tsx`) listens for them to manage project progress, auto-save, and UI indicators.

```typescript
// ═══ REQUIRED ═══

// 1. workspace:dirty — When user makes ANY change to the workspace
//    Triggers: Project "input" milestone on first fire, "edited" on 5th+
window.dispatchEvent(new CustomEvent("workspace:dirty"));

// 2. workspace:progress — When meaningful milestones are reached
//    Milestones: "input" | "content" | "edited" | "exported"
window.dispatchEvent(new CustomEvent("workspace:progress", {
  detail: { milestone: "content" }
}));

// OR percentage-based:
window.dispatchEvent(new CustomEvent("workspace:progress", {
  detail: { progress: 75 }  // 0-100
}));

// 3. workspace:save — When user explicitly exports/downloads
//    Triggers: Save indicator flash
window.dispatchEvent(new CustomEvent("workspace:save"));

// ═══ WHEN TO FIRE EACH ═══
// User types in a field         → workspace:dirty
// User changes a template       → workspace:dirty
// User fills first field        → workspace:progress { milestone: "input" }
// Content is substantially done → workspace:progress { milestone: "content" }
// User exports PDF/PNG          → workspace:progress { milestone: "exported" } + workspace:save
```

### Important: Fire on Mount for Tools That Load with Content
```typescript
// If tool loads with a template or pre-filled content:
useEffect(() => {
  if (hasDispatchedRef.current) return;
  hasDispatchedRef.current = true;
  window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { progress: 70 } }));
  window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "content" } }));
}, []);
```

---

## 14. Project Persistence Wiring

### How It Works (Automatic if Adapter is Correct)

```
User opens tool → page.tsx creates project → useProjectData hook activates
                                            ↓
                                   getOrCreateAdapter(toolId)
                                            ↓
                              adapter.subscribe() watches for changes
                                            ↓
                              adapter.getSnapshot() captures state
                                            ↓
                              saves to IndexedDB + Supabase (debounced 3s)
```

### Requirements for Persistence to Work

1. ✅ Store adapter exists in `ADAPTER_FACTORIES` for the tool's ID
2. ✅ `getSnapshot()` returns a serializable plain object (no functions, no classes, no circular refs)
3. ✅ `restoreSnapshot(data)` correctly merges data back into the store
4. ✅ `resetStore()` does TWO things: resets state AND nukes localStorage key
5. ✅ `subscribe(cb)` returns an unsubscribe function (Zustand's `.subscribe()` does this automatically)

### Common Persistence Bugs

| Bug | Cause | Fix |
|-----|-------|-----|
| Data doesn't save | Adapter missing from `ADAPTER_FACTORIES` | Add the adapter mapping |
| Data doesn't load on refresh | `restoreSnapshot()` has wrong field names | Match exactly what `getSnapshot()` returns |
| Old project bleeds into new | `resetStore()` doesn't nuke localStorage | Add `nukePersistStorage("dmsuite-key")` |
| Store crashes on load | Old snapshot has missing fields | Add null-checks/defaults in `restoreSnapshot()` |
| Adapter returns `{}` | Store hasn't initialized yet | Lazy `require()` ensures store is loaded |

---

## 15. Testing & Verification Protocol

### Mandatory Checks (ALL must pass before marking complete)

#### Level 1: Compilation
```bash
npx tsc --noEmit          # 0 errors
npm run build             # Succeeds
npm run lint              # No critical warnings
```

#### Level 2: Load & Render
```
□ Tool card visible on dashboard with correct icon + name
□ Click tool → workspace loads (no blank screen, no console errors)
□ All UI elements render correctly in dark mode
□ All UI elements render correctly in light mode
□ Responsive: works at 375px, 768px, 1024px, 1440px widths
```

#### Level 3: Functionality (compare to GitHub source)
```
□ Core feature 1 works identically to source
□ Core feature 2 works identically to source
□ Core feature N works identically to source
□ Export produces correct, usable output file
□ Import/upload handles valid files correctly
□ Error states shown for invalid input (not silent failures)
```

#### Level 4: Integration
```
□ workspace:dirty dispatches on edit (check DevTools console)
□ workspace:progress dispatches on milestones
□ Project auto-saves after 3s of inactivity (check IndexedDB)
□ Closing and reopening tool restores last state
□ Chiko "readCurrentState" returns meaningful data
□ Chiko can execute at least one modification action
□ Undo/redo works (Ctrl+Z / Ctrl+Y) if applicable
```

#### Level 5: Edge Cases
```
□ Empty state (no input) — doesn't crash
□ Rapid template switching — no orphaned state
□ Switching between tools and back — state preserved
□ New project creation — starts clean
□ Very large input — handles gracefully (no freeze >2s)
```

---

## 16. Common Failure Modes & Fixes

### Failure: Blank Screen After Loading

**Causes (in order of likelihood):**
1. Missing `"use client"` directive
2. Import error — component doesn't exist at import path
3. Runtime null reference — accessing `.something` on undefined
4. Dynamic import path doesn't match actual file location

**Fix protocol:**
```
1. Open browser DevTools Console → check for errors
2. Check the dynamic import path in page.tsx matches the actual file
3. Verify "use client" is the FIRST line of the workspace component
4. Check that all imports resolve (no typos in import paths)
```

### Failure: TypeScript Errors After Porting

**Common causes:**
1. Source repo uses different React version (event handler types differ)
2. Source repo uses `any` everywhere (strict mode catches this)
3. Source repo uses CSS modules (importing `.module.css` files)
4. Missing type definitions for new dependencies

**Fix protocol:**
```
1. Run: npx tsc --noEmit 2>&1 | head -50
2. Fix errors one-by-one, starting from the first
3. Don't use `as any` — define proper types
4. For third-party libs without types: create a minimal .d.ts declaration
```

### Failure: Styles Look Wrong / Broken

**Common causes:**
1. Copied CSS classes from source (they don't exist in Tailwind v4)
2. Used v3 syntax: `bg-gradient-to-br` instead of `bg-linear-to-br`
3. Hardcoded hex colors instead of tokens
4. Missing dark mode variants

**Fix protocol:**
```
1. Search workspace for any hex color (#xxx) — replace with tokens
2. Search for "gradient-to" — replace with "linear-to"
3. Add dark: variants for ALL bg, text, border classes
4. Test in both themes
```

### Failure: State Not Persisting

**Common causes:**
1. Store adapter missing from `ADAPTER_FACTORIES`
2. `getSnapshot()` returns non-serializable data (functions, DOM elements)
3. Zustand persist key collision with another tool
4. `restoreSnapshot()` crashes on old data shape

**Fix protocol:**
```
1. Check store-adapters.ts has entry for the tool ID
2. Verify getSnapshot() returns plain JSON (stringify test)
3. Check localStorage key is unique: "dmsuite-{tool-name}"
4. Add try/catch + null checks in restoreSnapshot()
```

### Failure: Chiko Can't Control the Tool

**Common causes:**
1. `useChikoActions` not called in workspace component
2. Manifest factory not wrapped in `useCallback`
3. `executeAction` switch doesn't match action names
4. Manifest not exported from `manifests/index.ts`

**Fix protocol:**
```
1. Verify useChikoActions() is called in the workspace
2. Check manifest is exported from the barrel
3. Console.log in executeAction to verify it's being called
4. Ensure action names in actions[] match switch cases
```

### Failure: Third-Party Component UI Invisible / Broken (CSS Isolation)

**This is the #1 failure mode when porting tools.** When embedding a third-party React component (Excalidraw, xyflow, Fabric.js canvas UI, etc.), its internal styles can be overridden by:

1. **Tailwind v4 preflight** — Resets `button { background-color: transparent; color: inherit }` which leaks into the component's container and overrides its own CSS custom properties
2. **DMSuite dark mode body styles** — `body { color: ... }` cascades into `color: inherit` rules inside the component, causing icons/text that use `currentColor` to become invisible
3. **CSS custom property conflicts** — If the component uses `--color-text`, `--color-panel` etc. and DMSuite also defines vars with the same names

**Symptoms:**
- Toolbars, menus, panels render but are blank/invisible
- Icons missing (component uses `mask-image` + `background-color: currentColor` pattern)
- Buttons look like empty rectangles
- Dark mode works but light mode is broken (or vice versa)

**Fix protocol:**
```
1. Identify the component's root container class (e.g. `.tl-container`)
2. Add CSS isolation overrides in globals.css SCOPED to that container:

   .tl-container button {
     background-color: revert;
     color: revert;
   }

3. Reset text/background colors to prevent DMSuite body styles leaking in:

   .tl-container {
     color: initial;
   }

4. If the component uses CSS mask icons:

   .tl-container [class*="icon"] {
     background-color: revert;
   }

5. For theme sync, use the component's API (not CSS):
   editor.user.updateUserPreferences({ colorScheme: theme })
```

**Import order matters:**
```css
/* globals.css — tldraw CSS MUST come AFTER Tailwind base */
@import "tailwindcss";
@import "tldraw/tldraw.css";
/* Then your .tl-container overrides at the end of the file */
```

**Key lesson:** Always test BOTH themes. Tailwind preflight issues often only surface in one theme because the other happens to have matching colors by coincidence.

### Failure: Vercel Build Fails with ERESOLVE (Peer Dependency Conflict)

**Cause:** The ported library peers on `react@^18` but DMSuite uses React 19. Locally `npm install --legacy-peer-deps` works, but Vercel's default `npm install` does not use `--legacy-peer-deps`.

**Fix:**
```
1. Create .npmrc in project root:
   legacy-peer-deps=true

2. Commit .npmrc to git — Vercel reads it automatically
```

**Warning:** This suppresses ALL peer dep warnings. Only use when you've verified the library actually works with React 19.

### Failure: License Enforcement in Production (Hidden Paywall)

**Cause:** Some open-source libraries (e.g., tldraw v4+) changed their license from MIT to a commercial model. The library may work perfectly in development (`localhost`) but enforce licensing restrictions in production:
- Hide the UI after a timeout
- Overlay a watermark
- Disable features
- Show "unlicensed" warnings

**Detection protocol:**
```
1. BEFORE starting a port, check the library's LICENSE file:
   - MIT / Apache-2.0 / BSD → safe
   - AGPL / BSL / Custom → read carefully
2. Check for license enforcement code: search for "license", "watermark", "production"
3. Test on a non-localhost URL (e.g. ngrok, Vercel preview deploy)
4. If the library recently changed licenses, check if older MIT versions are still usable
```

**Fix:** If a library has switched to a commercial license, use the last MIT-licensed version. Example: `tldraw@2.4.6` (MIT) instead of `tldraw@4.x` (commercial).

---

## 17. File Checklist Template

Copy this for each tool port and check off every item:

```markdown
## Tool Port: [Tool Name] from [GitHub Repo URL]

### Classification
- Tool ID: `your-tool-id`
- Pattern: A (Fabric) / B (Form) / C (Utility) / D (AI Content)
- Category: design / document / video / audio / content / marketing / web / utility

### Files Created
- [ ] `src/components/workspaces/tool-name/ToolNameWorkspace.tsx`
- [ ] `src/stores/tool-name-editor.ts` (if needed)
- [ ] `src/lib/chiko/manifests/tool-name.ts`
- [ ] `src/lib/tool-name/engine.ts` (if complex logic)
- [ ] `src/data/tool-name-templates.ts` (if templates)
- [ ] `src/app/api/chat/tool-name/route.ts` (if AI API needed)

### Files Modified
- [ ] `src/app/tools/[categoryId]/[toolId]/page.tsx` — dynamic import added
- [ ] `src/lib/store-adapters.ts` — adapter + ADAPTER_FACTORIES entry
- [ ] `src/lib/chiko/manifests/index.ts` — barrel export
- [ ] `src/data/tools.ts` — status: ready, devStatus: complete
- [ ] `src/data/credit-costs.ts` — cost + mapping (if AI)
- [ ] `src/components/icons.tsx` — new icon (if needed)

### Verification
- [ ] `tsc --noEmit` — 0 errors
- [ ] `npm run build` — success
- [ ] Dashboard shows tool correctly
- [ ] Workspace loads without errors
- [ ] Core features work (list them)
- [ ] Export works
- [ ] Dark mode correct
- [ ] Light mode correct
- [ ] Mobile responsive
- [ ] Project persistence works
- [ ] Chiko integration works
- [ ] TOOL-STATUS.md updated
- [ ] Committed
```

---

## 18. Tool Type Matrix — Which Pattern to Use

| If the GitHub tool is... | Use Pattern | Store Type | Example |
|--------------------------|-------------|------------|---------|
| A visual canvas editor (drag-drop design) | A: Fabric.js | `useFabricProjectStore` (shared) | Canva-like, poster maker |
| A structured form → rendered document | B: Form-based | Custom Zustand + immer + persist + temporal | Resume builder, invoice maker |
| A file processor (input → transform → output) | C: Utility | Local `useState` or lightweight Zustand | PDF tools, image compressor |
| An AI text generator | D: AI Content | Custom Zustand + persist | Blog writer, copy generator |
| A code editor / text editor | B: Form-based (modified) | Custom Zustand + persist | Markdown editor, code playground |
| A data visualization / chart tool | C: Utility or A: Fabric.js | Depends on interactivity | Chart maker, analytics |
| A media player/editor (audio/video) | C: Utility | Custom Zustand + persist | Podcast editor, video trimmer |

### Pattern Decision Tree
```
Does the tool have a visual canvas with draggable objects?
  YES → Pattern A (Fabric.js)
  NO →
    Does the tool have structured form inputs that produce a formatted document?
      YES → Pattern B (Form-based)
      NO →
        Does the tool process input files into output files?
          YES → Pattern C (Utility)
          NO →
            Does the tool primarily generate text/content via AI?
              YES → Pattern D (AI Content)
              NO → Pattern C (Utility) — default fallback
```

---

## 19. TOOL-STATUS.md & tools.ts Update Protocol

### MANDATORY after every tool build/rebuild

#### In `src/data/tools.ts`:
```typescript
// Find the tool entry and update:
{
  id: "your-tool-id",
  // ...
  status: "ready",           // Change from "coming-soon" to "ready"
  devStatus: "complete",     // Change from "scaffold" or "no-ui" to "complete"
}
```

#### In `TOOL-STATUS.md`:
1. Move the tool from SCAFFOLD/NO-UI section to COMPLETE section
2. Add full description in the COMPLETE table
3. Add a changelog entry:

```markdown
| YYYY-MM-DD | tool-id (Tool Name) | Full build ported from [repo-name]: [feature list]. [Source: github.com/user/repo]. 0 TS errors. | Drake |
```

#### Update Counts
Increment the "Tools fully complete" count in the header.

---

## Quick Reference: The Porting Commandments

1. **Thou shalt NEVER rewrite from scratch** — find the best open-source tool, copy it directly, adapt only what's needed
2. **Thou shalt ALWAYS search GitHub/npm FIRST** — someone has already built it better than you will from scratch
3. **Thou shalt prefer npm packages over source copies** — install + thin wrapper is the ideal (Excalidraw pattern)
4. **Thou shalt let TypeScript be thy checklist** — `tsc --noEmit` errors = things to fix, nothing else
5. **Thou shalt NEVER hardcode colors, fonts, or spacing** — all visual tokens from DMSuite's theme
6. **Thou shalt wire ALL 8 integration points** — these are ALWAYS written fresh
7. **Thou shalt run `tsc --noEmit` before AND after** — 0 errors is the only acceptable result
8. **Thou shalt test in BOTH themes** — dark mode is default, but light must work too
9. **Thou shalt add CSS isolation for third-party components** — Tailwind preflight WILL break their UI
10. **Thou shalt NOT install competing libraries** — use what DMSuite already has
11. **Thou shalt dispatch workspace events** — progress tracking breaks without them
12. **Thou shalt verify Chiko access** — every tool must be AI-controllable
13. **Thou shalt NOT "improve" the source UI** — if it works in the source, preserve it exactly
14. **Thou shalt commit with a descriptive message and update TOOL-STATUS.md** — the tracker is law
