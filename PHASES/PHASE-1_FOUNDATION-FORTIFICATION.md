# DMSuite — PHASE 1: Foundation Fortification

> **Codename:** "Bedrock"
> **Duration:** 2–3 Weeks
> **Goal:** Fix every existing bug, remove all code duplication, enforce global standards, make the platform PWA-ready with full mobile UX, and add platform-wide keyboard shortcuts.

---

## Wave 1.1 — Critical Bug Fixes & Code Hygiene

### Task 1.1.1 — Replace all `<a href>` with Next.js `<Link>`
**Files:** `Sidebar.tsx`, `HeroBanner.tsx`, `QuickAccess.tsx`, `ToolCard.tsx`, `tools/[categoryId]/[toolId]/page.tsx`, `error.tsx`
**Why:** Every `<a href>` causes a full page reload, destroying client state and killing performance. Next.js `<Link>` does client-side navigation.
**Action:**
- Import `Link` from `next/link` in every file that navigates
- Replace every `<a href="/...">` with `<Link href="/...">`
- Remove the `<a href={undefined}>` pattern on non-ready ToolCards — render a `<div>` instead
- Ensure Sidebar nav items use `<Link>` with `href={`/dashboard#${item.id}`}`

### Task 1.1.2 — Normalize `min-h-screen` → `min-h-dvh`
**Files:** `loading.tsx`, `error.tsx`, `not-found.tsx`
**Why:** `min-h-dvh` accounts for mobile browser chrome (address bar, bottom bar). `min-h-screen` overflows on iOS Safari.
**Action:** Find-and-replace `min-h-screen` → `min-h-dvh` in all layout-level wrappers.

### Task 1.1.3 — Fix Sidebar loading skeleton width mismatch
**File:** `dashboard/loading.tsx`
**Why:** Skeleton uses `w-60 xl:w-64` but actual Sidebar is `w-60`. Causes visual jump.
**Action:** Change skeleton sidebar to `w-60` to match actual sidebar.

### Task 1.1.4 — Fix ThemeSwitch hover color bug in light mode
**File:** `ThemeSwitch.tsx`
**Why:** `hover:text-gray-200` is nearly invisible on light backgrounds.
**Action:** Change to `hover:text-gray-700 dark:hover:text-gray-200`.

### Task 1.1.5 — Fix HeroBanner search `onBlur` race condition
**File:** `HeroBanner.tsx`
**Why:** `setTimeout(200ms)` to delay blur can miss slow device clicks.
**Action:** Use `onMouseDown` + `preventDefault()` on result links instead of `setTimeout`. This prevents the blur from firing before the click registers.

### Task 1.1.6 — Add keyboard navigation to HeroBanner search
**File:** `HeroBanner.tsx`
**Why:** Users can't arrow-key through search results — accessibility gap.
**Action:** Add `activeIndex` state, `ArrowUp/ArrowDown/Enter/Escape` handlers, `scrollIntoView` on active item. Match CommandPalette's keyboard pattern.

### Task 1.1.7 — Fix `jsonld.ts` hardcoded tool count
**File:** `src/lib/jsonld.ts`
**Why:** Description says "116+" but actual count is 193+.
**Action:** Import `totalToolCount` from `tools.ts` and use template literal.

### Task 1.1.8 — Fix manifest.json description
**File:** `public/manifest.json`
**Why:** Description says "116+" tools.
**Action:** Update to "250+" or dynamically generate manifest.

### Task 1.1.9 — Use shared icon components in error/not-found pages
**Files:** `error.tsx`, `not-found.tsx`, `ThemeSwitch.tsx`
**Why:** These files use inline SVGs instead of the shared icon library.
**Action:** Import icons from `@/components/icons` and replace inline SVGs.

### Task 1.1.10 — Fix tool status accuracy in `tools.ts`
**File:** `src/data/tools.ts`
**Why:** 183 tools marked "ready" but only 12 have actual workspace implementations. This is misleading.
**Action:**
- Set all tools without a workspace component to `status: "coming-soon"`
- Keep only tools with actual implementations as `status: "ready"` (the 12 routed tools)
- Mark near-complete tools as `status: "beta"`
- Update `statusConfig` badge labels if needed

---

## Wave 1.2 — Eliminate Code Duplication (DRY)

### Task 1.2.1 — Remove duplicated utility functions from workspace files
**Files:** `BrandIdentityWorkspace.tsx`, `BusinessCardWorkspace.tsx`, `ResumeCVWorkspace.tsx`, `InvoiceDesignerWorkspace.tsx`, `EmailTemplateWorkspace.tsx`
**Why:** `hexToRgba`, `hexToRgb`, `getContrastColor`, `lighten`, `darken`, `roundRect` are duplicated across 5+ files. All exist in `canvas-utils.ts`.
**Action:**
- Export all needed functions from `src/lib/canvas-utils.ts`
- Remove local duplicates from each workspace
- Import from `@/lib/canvas-utils` everywhere

### Task 1.2.2 — Extract shared workspace shell component
**File:** New `src/components/workspaces/WorkspaceShell.tsx`
**Why:** All workspaces repeat sidebar, topbar, breadcrumb, header layout.
**Action:**
- Create `<WorkspaceShell>` with: sidebar, topbar, breadcrumbs, tool header (icon + name + status + tags), children slot for workspace content
- Refactor all 12 workspaces to use `<WorkspaceShell>`
- Move the breadcrumb/header code from `tools/[categoryId]/[toolId]/page.tsx` into this shell

### Task 1.2.3 — Extract shared canvas workspace shell
**File:** New `src/components/workspaces/CanvasWorkspaceShell.tsx`
**Why:** Layer-based workspaces (Social, Poster, Banner) share ~85% identical code for: left panel, canvas area, right panel (layers), toolbar, undo/redo, keyboard shortcuts, export tab, mockup tab.
**Action:**
- Create `<CanvasWorkspaceShell>` accepting: `leftPanelContent`, `canvasConfig`, `rightPanelOverrides`, `exportFormats`
- Extract shared layer interaction logic into a custom hook: `useCanvasInteraction()`
- Extract shared export logic into `useExportFormats()`
- Refactor SocialMediaPostWorkspace, PosterFlyerWorkspace, BannerAdWorkspace to use the shell

### Task 1.2.4 — Create shared color lookup maps utility
**File:** Extend `src/lib/colors.ts`
**Why:** `categoryBgMap`, `accentBgMap` duplicated in CategorySection and ToolCard.
**Action:** Consolidate all Tailwind JIT-safe color lookup maps into `colors.ts`, export, and import in components.

### Task 1.2.5 — Consolidate design token sources
**Files:** `src/lib/tokens.ts`, `src/data/config/colors.ts`, `globals.css`
**Why:** Color values exist in 3 places. Single source of truth needed.
**Action:**
- `globals.css` remains the CSS source (Tailwind tokens)
- `tokens.ts` becomes the TS source (for canvas/JS usage)
- `config/colors.ts` re-exports from `tokens.ts` — no duplicate definitions
- Document hierarchy in comments

---

## Wave 1.3 — Dynamic Loading & Performance

### Task 1.3.1 — Lazy-load workspace components
**File:** `src/app/tools/[categoryId]/[toolId]/page.tsx`
**Why:** All 12 workspace components are eagerly imported, inflating the initial bundle by ~15,000+ lines.
**Action:**
- Use `next/dynamic` for every workspace component
- Add loading skeleton for each workspace type
- Convert the `if` chain to a `Record<string, dynamic(() => import(...))>` lookup map

### Task 1.3.2 — Add Suspense boundaries to dashboard
**File:** `src/app/dashboard/page.tsx`
**Why:** The entire dashboard renders as one client tree. Progressive loading improves perceived performance.
**Action:**
- Wrap `CategorySection` list in `<Suspense>` with skeleton fallback
- Wrap `QuickAccess` and `StatsBar` in individual `<Suspense>` boundaries

### Task 1.3.3 — Debounce HeroBanner search
**File:** `HeroBanner.tsx`
**Why:** Search runs on every keystroke through 193+ tools. Fine now but will degrade with 250+.
**Action:** Add 150ms debounce using `useRef` timer pattern (no external lib needed).

### Task 1.3.4 — Implement z-index scale system
**File:** New `src/lib/z-index.ts` + update all components
**Why:** Arbitrary z-indices across components (`z-40`, `z-50`, `z-[400]`) will cause stacking bugs.
**Action:**
- Define z-index scale: `base(0)`, `dropdown(10)`, `sticky(20)`, `overlay(30)`, `modal(40)`, `tooltip(50)`, `commandPalette(60)`
- Add to `globals.css` as custom properties: `--z-modal: 40`
- Update CommandPalette, Sidebar, StockImagePicker, Modal to use scale

---

## Wave 1.4 — PWA & Mobile-First Overhaul

### Task 1.4.1 — Generate all PWA icon assets
**Action:**
- Generate `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.ico` from the Logo SVG
- Place in `public/`
- Generate `og-image.png` (1200×630) with DMSuite branding
- Verify all paths in `layout.tsx` metadata match actual files

### Task 1.4.2 — Enhance manifest.json for full PWA
**File:** `public/manifest.json`
**Action:**
- Add `scope: "/"`
- Add `id: "dmsuite"`
- Add `shortcuts` array (quick links to popular tools)
- Add `screenshots` array
- Add `display_override: ["window-controls-overlay", "standalone", "minimal-ui"]`
- Add `related_applications: []`
- Add `prefer_related_applications: false`
- Add `launch_handler: { client_mode: "auto" }`

### Task 1.4.3 — Add service worker for offline capability
**File:** New `public/sw.js` + registration in `layout.tsx`
**Why:** PWA requires service worker for offline functionality.
**Action:**
- Create service worker with cache-first strategy for static assets
- Network-first for API routes
- Add offline fallback page
- Register SW in layout with `navigator.serviceWorker.register()`

### Task 1.4.4 — Create Mobile Bottom Navigation Bar
**File:** New `src/components/MobileBottomNav.tsx`
**Why:** Mobile apps have bottom navigation for quick access. This is critical for mobile UX.
**Action:**
- Create fixed bottom nav visible only on `< lg` screens
- 5 tabs: Home (Dashboard), Search (opens CommandPalette), Create (quick tool access), Recents, Menu (sidebar toggle)
- Each tab has icon + label
- Active tab highlighted with primary color
- Hide when keyboard is open (detect via `visualViewport` API)
- Animate in/out with Framer Motion
- Uses `safe-area-inset-bottom` for notch devices
- Integrate into `layout.tsx` inside ThemeProvider

### Task 1.4.5 — Mobile-optimize Sidebar for bottom nav
**File:** `Sidebar.tsx`
**Why:** On mobile, sidebar should be a full-screen overlay triggered from bottom nav "Menu" tab.
**Action:**
- On `< lg`: Sidebar becomes slide-in overlay from left (already partially done)
- Add backdrop blur
- Add swipe-to-close gesture (Framer Motion `drag`)
- Close on navigation (link click)
- Trap focus within sidebar when open

### Task 1.4.6 — Make all workspace panels mobile-friendly
**Files:** All workspace components
**Why:** 3-panel layouts (left + canvas + right) don't work on phones.
**Action:**
- On `< md`: Switch to single-column layout with tabs
- Tab 1: Canvas (full width, touch gestures)
- Tab 2: Settings (left panel content)
- Tab 3: Layers (right panel content, for layer-based workspaces)
- Add swipe gesture between tabs
- Canvas gets pinch-to-zoom on mobile
- All buttons/inputs get minimum 44px touch targets

### Task 1.4.7 — Add `viewport-fit=cover` for notch devices
**File:** `layout.tsx`
**Why:** Needed for edge-to-edge display on iPhones with notch/Dynamic Island.
**Action:**
- Add `viewportFit: "cover"` to viewport export
- Use `env(safe-area-inset-*)` padding on bottom nav, sidebar, and full-width elements

### Task 1.4.8 — Add install prompt for PWA
**File:** New `src/components/InstallPrompt.tsx`
**Why:** Users need to be prompted to install the PWA.
**Action:**
- Listen for `beforeinstallprompt` event
- Show dismissible banner/modal with "Install DMSuite" CTA
- Track install state in preferences store
- Only show once per session, respect dismissal

---

## Wave 1.5 — Platform-Wide Keyboard Shortcuts

### Task 1.5.1 — Create global shortcuts registry
**File:** New `src/lib/shortcuts.ts`
**Why:** Shortcuts should be centrally registered, discoverable, and conflict-free.
**Action:**
- Define `Shortcut` type: `{ key: string, ctrl?: boolean, shift?: boolean, alt?: boolean, meta?: boolean, action: string, description: string, scope: 'global' | 'workspace' | 'canvas' }`
- Create `GLOBAL_SHORTCUTS` registry (platform-wide)
- Create `WORKSPACE_SHORTCUTS` registry (tool-specific)
- Create `CANVAS_SHORTCUTS` registry (canvas-specific)
- Export `formatShortcut()` for display (e.g., "⌘K" or "Ctrl+K")
- Export `matchShortcut(event, shortcut)` helper

### Task 1.5.2 — Implement global shortcuts
**File:** New `src/hooks/useGlobalShortcuts.ts` + `layout.tsx`
**Action — Global shortcuts to implement:**
| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + K` | Open Command Palette (exists) |
| `Ctrl/⌘ + /` | Toggle theme |
| `Ctrl/⌘ + B` | Toggle sidebar |
| `Ctrl/⌘ + ,` | Open preferences |
| `Ctrl/⌘ + H` | Go to Dashboard |
| `Ctrl/⌘ + Shift + F` | Focus global search |
| `Escape` | Close any modal/overlay |
| `?` | Show keyboard shortcuts help modal |

### Task 1.5.3 — Implement canvas workspace shortcuts
**Action — Shortcuts for all canvas-based workspaces:**
| Shortcut | Action |
|----------|--------|
| `Delete / Backspace` | Delete selected layer (exists) |
| `Ctrl/⌘ + Z` | Undo (exists) |
| `Ctrl/⌘ + Shift + Z` | Redo (exists) |
| `Ctrl/⌘ + D` | Duplicate layer (exists) |
| `Ctrl/⌘ + A` | Select all layers |
| `Ctrl/⌘ + Shift + A` | Deselect all |
| `Ctrl/⌘ + C` | Copy layer |
| `Ctrl/⌘ + V` | Paste layer |
| `Ctrl/⌘ + X` | Cut layer |
| `Ctrl/⌘ + G` | Group selected layers |
| `Ctrl/⌘ + Shift + G` | Ungroup |
| `Ctrl/⌘ + ]` | Bring forward |
| `Ctrl/⌘ + [` | Send backward |
| `Ctrl/⌘ + Shift + ]` | Bring to front |
| `Ctrl/⌘ + Shift + [` | Send to back |
| `Ctrl/⌘ + E` | Quick export |
| `Ctrl/⌘ + S` | Save project (when implemented) |
| `+` / `-` | Zoom in/out |
| `Ctrl/⌘ + 0` | Zoom to fit |
| `Ctrl/⌘ + 1` | Zoom to 100% |
| `Space + drag` | Pan canvas |
| `T` | Add text layer |
| `R` | Add rectangle shape |
| `Arrow keys` | Nudge selected layer 1px |
| `Shift + Arrow` | Nudge selected layer 10px |
| `Enter` | Edit text (when text layer selected) |
| `Escape` | Deselect / exit edit mode |
| `Tab` | Cycle through layers |
| `Ctrl/⌘ + L` | Toggle layer panel |
| `F` | Toggle fullscreen preview |

### Task 1.5.4 — Implement tool-specific shortcuts
**Action — Per-tool shortcuts:**
| Tool | Shortcut | Action |
|------|----------|--------|
| AI Chat | `Ctrl+Enter` | Send message |
| AI Chat | `Ctrl+N` | New conversation |
| AI Chat | `Ctrl+Shift+C` | Copy last response |
| Presentation | `←/→` | Navigate slides |
| Presentation | `Ctrl+M` | New slide |
| Presentation | `Ctrl+Shift+D` | Duplicate slide |
| Presentation | `F5` | Start slideshow |
| Resume | `Ctrl+P` | Preview/print |
| Invoice | `Ctrl+P` | Preview/print |

### Task 1.5.5 — Create shortcuts help modal
**File:** New `src/components/ShortcutsHelpModal.tsx`
**Action:**
- Triggered by `?` key or help button
- Organized by scope (Global, Canvas, Tool-Specific)
- Uses `<Kbd>` component for each shortcut
- Searchable within the modal
- Categorized with expandable sections

### Task 1.5.6 — Add shortcuts display to CommandPalette
**File:** `CommandPalette.tsx`
**Action:** Show keyboard shortcut badges next to actions that have them (e.g., "Toggle Theme" shows `⌘/`).

---

## Wave 1.6 — Accessibility & Standards

### Task 1.6.1 — Add ARIA labels and roles
**Files:** All interactive components
**Action:**
- All buttons get `aria-label` where text isn't sufficient
- Sidebar gets `role="navigation"` and `aria-label="Main navigation"`
- Canvas gets `role="img"` with `aria-label` describing the design
- Layer panel gets `role="list"` with `role="listitem"` on layers
- All form inputs get associated labels
- Status badges get `aria-live="polite"` for screen readers

### Task 1.6.2 — Focus management
**Action:**
- Trap focus in modals (Modal, CommandPalette, StockImagePicker)
- Return focus to trigger element on modal close
- Visible focus rings on all interactive elements (already using Tailwind `focus-visible:ring-2`)
- Skip-to-content link at top of page

### Task 1.6.3 — Color contrast audit
**Action:**
- Verify all text meets WCAG AA (4.5:1 for normal, 3:1 for large text)
- Fix any failing contrast ratios in both dark and light modes
- Ensure status badges are distinguishable without color (icons/text suffice)

---

## Deliverables Checklist — Phase 1
- [ ] Zero `<a href>` for internal navigation — all `<Link>`
- [ ] All layouts use `min-h-dvh`
- [ ] Zero duplicated utility functions across workspaces
- [ ] Shared `WorkspaceShell` component in use
- [ ] All workspace components lazy-loaded
- [ ] PWA fully functional (icons, manifest, service worker, install prompt)
- [ ] Mobile bottom navigation bar working
- [ ] All workspaces mobile-responsive (tab-based on mobile)
- [ ] 30+ keyboard shortcuts working platform-wide
- [ ] Shortcuts help modal accessible via `?`
- [ ] Global z-index scale enforced
- [ ] ARIA labels on all interactive elements
- [ ] Tool statuses accurate (`ready` only for implemented tools)
- [ ] HeroBanner search has keyboard navigation
- [ ] Theme toggle shortcut working
- [ ] Performance: workspace components code-split
