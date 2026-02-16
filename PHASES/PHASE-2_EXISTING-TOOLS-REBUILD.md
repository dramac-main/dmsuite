# DMSuite — PHASE 2: Existing Tools — Full Industry-Standard Rebuild

> **Codename:** "Forged in Fire"
> **Duration:** 4–6 Weeks
> **Goal:** Rebuild every existing workspace to be fully functional, industry-standard, with proper export formats, interactive canvases, undo/redo, and AI revision that preserves design intent.

---

## Wave 2.1 — Canvas Infrastructure Upgrade (Shared Layer Engine)

### Task 2.1.1 — Upgrade `canvas-layers.ts` with serialization
**File:** `src/lib/canvas-layers.ts`
**Why:** No save/load capability — all state lost on refresh.
**Action:**
- Add `serializeDocument(doc: DesignDocument): string` (JSON)
- Add `deserializeDocument(json: string): DesignDocument`
- Fix module-global `layerIdCounter` (use UUID generator instead)
- Add `createImageLayer()` factory function
- Add `createGroupLayer()` factory function with child rendering
- Add group interaction logic (select group, expand to edit children)
- Add `cloneLayer()` deep copy utility

### Task 2.1.2 — Add multi-selection support to layer engine
**File:** `src/lib/canvas-layers.ts`
**Action:**
- `Shift+Click` to add/remove from selection
- `Ctrl/⌘+A` to select all
- Multi-layer bounding box for shared resize
- Multi-layer drag (move all selected)
- Multi-layer delete
- Multi-layer duplicate
- Render multi-selection handles (dashed blue border around group)

### Task 2.1.3 — Add snap-to-grid and smart guides
**File:** New `src/lib/canvas-snapping.ts`
**Action:**
- Snap to center (horizontal/vertical)
- Snap to edges of other layers
- Snap to grid (configurable grid size)
- Visual guide lines (cyan lines when snapping)
- Distance indicators (show px distance between elements)
- Toggle snap on/off with `Ctrl+;`

### Task 2.1.4 — Add zoom and pan to canvas
**File:** New `src/hooks/useCanvasViewport.ts`
**Action:**
- Scroll wheel = zoom (0.1x to 8x range)
- `Ctrl+0` = fit to view
- `Ctrl+1` = 100%
- `Ctrl++` / `Ctrl+-` = zoom in/out
- Space + drag = pan
- Pinch-to-zoom on mobile (touch events)
- Zoom indicator in corner (e.g., "150%")
- Mini-map in corner for large canvases

### Task 2.1.5 — Add inline text editing on canvas
**File:** Extend `src/lib/canvas-layers.ts` + workspace components
**Action:**
- Double-click text layer → overlay `<textarea>` at exact position
- Match font, size, color, alignment of the layer
- `Enter` confirms edit, `Escape` cancels
- Real-time preview while typing
- Cursor blinking in the edit field
- Text selection within the overlay

### Task 2.1.6 — Add rulers and guides
**File:** New `src/components/workspaces/CanvasRulers.tsx`
**Action:**
- Horizontal ruler along top of canvas area
- Vertical ruler along left of canvas area
- Click+drag from ruler to create a guide line
- Right-click guide to delete
- Guides visible as dashed lines on canvas
- Toggle rulers with `Ctrl+R`
- Units display (px, mm, in) switchable

### Task 2.1.7 — Add layer alignment & distribution tools
**File:** New toolbar in `CanvasWorkspaceShell.tsx`
**Action:**
- Align: Left, Center, Right, Top, Middle, Bottom
- Distribute: Horizontally, Vertically (equal spacing)
- Works with multi-selection
- Keyboard shortcuts: `Ctrl+Shift+L/C/R/T/M/B`

### Task 2.1.8 — Create `useCanvasInteraction` hook
**File:** New `src/hooks/useCanvasInteraction.ts`
**Why:** Every canvas workspace duplicates mouse event handling.
**Action:**
- Extract all shared canvas mouse/touch handling into one hook
- Returns: `onMouseDown`, `onMouseMove`, `onMouseUp`, `onWheel`, `onTouchStart`, `onTouchMove`, `onTouchEnd`
- Manages: selection, drag, resize, pan, zoom, right-click context menu
- Accepts: `DesignDocument`, `setDocument`, viewport transform
- Handles both mouse and touch events

---

## Wave 2.2 — AI Revision Engine (Precise & Design-Preserving)

### Task 2.2.1 — Create AI Revision Protocol
**File:** Extend `src/lib/design-foundation.ts`
**Why:** AI revisions currently regenerate entire designs. Users want surgical changes.
**Action:**
- Define `RevisionScope` type: `'text-only' | 'colors-only' | 'layout-only' | 'element-specific' | 'full-redesign'`
- `buildRevisionPrompt()` sends: current design state (all layers with positions/styles), the specific revision request, scope constraint
- AI response format includes: `changedLayers: [{ layerId, changes: { prop: newValue } }]`
- `applyRevision()` function: patches only the specified layers, leaves everything else untouched
- Add "What to change" dropdown: Text Content, Colors & Theme, Layout & Composition, Specific Element, Full Redesign
- Show diff preview before applying (highlight changed layers)

### Task 2.2.2 — Add revision history
**File:** New `src/stores/revision-history.ts`
**Action:**
- Store revision requests and their results
- "Undo revision" button to revert to previous AI state
- Revision timeline showing all AI interactions
- Compare before/after for each revision

### Task 2.2.3 — Add AI style locking
**Action:**
- Lock individual layer properties (position, color, font, content)
- Locked properties sent to AI as "DO NOT CHANGE" constraints
- Visual lock icon on locked layers in panel
- `Ctrl+L` to lock/unlock selected layer

---

## Wave 2.3 — Rebuild AI Chat Workspace

### Task 2.3.1 — Full markdown rendering
**File:** `AIChatWorkspace.tsx`
**Action:**
- Install and integrate `react-markdown` + `remark-gfm`
- Support: headings, lists, tables, links, images, blockquotes, horizontal rules
- Syntax-highlighted code blocks with `rehype-highlight` or `prism`
- Copy button on code blocks (already exists for messages, extend to blocks)

### Task 2.3.2 — Message editing & regeneration
**Action:**
- Edit button on user messages → inline edit → re-send
- Regenerate button on assistant messages → re-generate from same prompt
- Show "edited" indicator on modified messages
- Branch conversation history (keep both old and new responses)

### Task 2.3.3 — Chat export
**Action:**
- Export as: Markdown, PDF, Plain Text, JSON
- Export single conversation or all conversations
- Include metadata (model used, timestamps)

### Task 2.3.4 — System prompt configuration
**Action:**
- User-configurable system prompt (stored in preferences)
- Presets: "Creative Writer", "Code Assistant", "Business Advisor", "Design Consultant"
- System prompt visible/editable in conversation settings

### Task 2.3.5 — Stop generation button
**Action:**
- "Stop" button visible during streaming
- Aborts fetch request via `AbortController`
- Preserves partial response

### Task 2.3.6 — Token usage display
**Action:**
- Show estimated token count for input
- Show token count for response (from API)
- Running total per conversation
- Warn when approaching context limit

### Task 2.3.7 — Conversation search
**Action:**
- Search across all conversations by content
- Highlight matching text in results
- Jump to specific message

---

## Wave 2.4 — Rebuild Logo Generator

### Task 2.4.1 — Sanitize AI SVG output
**File:** `LogoGeneratorWorkspace.tsx`
**Why:** `dangerouslySetInnerHTML` with raw AI SVG is an XSS risk.
**Action:**
- Parse AI SVG through DOMParser
- Whitelist allowed SVG elements and attributes
- Strip `<script>`, event handlers, `xlink:href="javascript:"`
- Render sanitized SVG

### Task 2.4.2 — Transparent PNG export
**Action:**
- Add "Background" option: White, Black, Transparent, Custom Color
- Transparent PNG uses canvas `clearRect` instead of white fill
- Preview checker pattern for transparent backgrounds

### Task 2.4.3 — Logo mockup previews
**Action:**
- Show logo on: business card, letterhead, t-shirt, signage, mobile app icon, website header
- Use canvas compositing for mockup rendering
- Switchable mockup backgrounds

### Task 2.4.4 — PDF export
**Action:**
- Export logo sheet as PDF (all variants on one page)
- Include usage guidelines (minimum size, clear space)
- Use `jsPDF` library

### Task 2.4.5 — Add keyboard shortcuts
**Action:**
- `Ctrl+E` quick export
- `Ctrl+S` download current
- `←/→` cycle through variants
- `1-6` select style
- `Ctrl+G` generate AI variants

---

## Wave 2.5 — Rebuild Social Media Post, Poster, Banner (Shared Engine)

### Task 2.5.1 — Refactor into shared CanvasWorkspaceShell
**Why:** These 3 workspaces share ~85% code (~5,600 lines of duplication).
**Action:**
- All 3 use `<CanvasWorkspaceShell>` from Wave 1.2 Task 1.2.3
- Each workspace only provides: format presets, composition options, tool-specific fields, export format filters
- Shared: canvas rendering, layer panel, style controls, AI Director, export, mockups

### Task 2.5.2 — Add missing features to Social Media Post
**Action:**
- Image crop within layer (define crop region on uploaded image)
- Hashtag generator (AI generates relevant hashtags)
- Character count per platform (with warnings)
- Multi-post carousel mode (Instagram carousel / LinkedIn carousel)
- Schedule post placeholder (future API integration)
- Brand kit integration (load brand colors/fonts/logo)

### Task 2.5.3 — Add missing features to Poster/Flyer
**Action:**
- Print bleed and trim marks (3mm standard bleed)
- Safe zone overlay (shows printable area)
- CMYK color preview (approximate with CSS filter)
- PDF export with crop marks and bleed
- QR code placement (generate QR from URL input)
- Spell check integration (browser native `spellcheck` attribute)
- Grid system overlay

### Task 2.5.4 — Add missing features to Banner Ad
**Action:**
- HTML5/CSS export for web display ads
- GIF animation support (frame-by-frame editor)
- Click-through URL configuration
- File size indicator (warn if > 150KB for Google Ads)
- Ad network compliance checker (validates dimensions for Google, Meta, IAB)
- Animation timeline for animated banners
- Preview in mockup frames (browser, mobile app, sidebar)

---

## Wave 2.6 — Rebuild Brand Identity & Business Card (Convert to Layer-Based)

### Task 2.6.1 — Brand Identity Kit → Layer-based
**File:** `BrandIdentityWorkspace.tsx`
**Action:**
- Convert from static canvas render to full layer-based architecture
- Interactive editing: click to select, drag to reposition brand elements
- Add: Logo upload, Google Fonts integration, color accessibility checker
- PDF export with full brand guidelines document
- SVG export of brand board
- Tone of voice section
- Pattern preview thumbnails before applying
- Brand kit save/load to preferences store

### Task 2.6.2 — Business Card Designer → Layer-based
**File:** `BusinessCardWorkspace.tsx`
**Action:**
- Convert from static canvas render to full layer-based architecture
- Interactive editing on both front and back
- Add: QR code generator, print bleed/safe zones, PDF export with crop marks
- CMYK color support (approximate)
- Custom card dimensions (beyond 3 presets)
- Side-by-side front/back preview
- Multiple card types (standard, folded, die-cut shapes)
- Logo upload and placement
- Save/load projects

---

## Wave 2.7 — Rebuild Presentation Designer

### Task 2.7.1 — Convert to layer-based editing
**File:** `PresentationWorkspace.tsx`
**Action:**
- Each slide element becomes an interactive layer
- Click to select, drag to move, handles to resize
- Double-click text to edit inline
- All canvas workspace shortcuts apply

### Task 2.7.2 — Full export support
**Action:**
- PPTX export (use `pptxgenjs` library)
- PDF export (all slides as pages)
- PNG export of all slides (zip download)
- SVG export per slide

### Task 2.7.3 — Slideshow presenter mode
**Action:**
- Full-screen slideshow with keyboard navigation
- Speaker notes visible on presenter's screen (dual monitor concept)
- Slide timer
- Laser pointer cursor

### Task 2.7.4 — Slide management
**Action:**
- Drag-reorder slides in filmstrip
- Copy/paste slides
- Duplicate slide
- Master slide/template system
- Section dividers in filmstrip

### Task 2.7.5 — Rich content
**Action:**
- Image upload and placement on slides
- Chart/graph insertion (bar, line, pie from data)
- Table insertion
- Video embed placeholder
- Icon library for slide decorations

---

## Wave 2.8 — Rebuild Resume, Invoice, Email Template

### Task 2.8.1 — Resume/CV → PDF export + ATS support
**File:** `ResumeCVWorkspace.tsx`
**Action:**
- PDF export using `jsPDF` (critical — resumes MUST be PDF)
- ATS compatibility scoring (check for parseable text, avoid images-only)
- Multi-page support (content flows to page 2+ instead of truncating)
- Section reordering via drag-drop
- Custom sections (Certifications, Volunteering, Publications, Languages)
- LinkedIn import (URL → parse public profile)
- Grammar/spell check suggestions
- A/B template comparison view

### Task 2.8.2 — Invoice Designer → PDF export + payment
**File:** `InvoiceDesignerWorkspace.tsx`
**Action:**
- PDF export (critical — invoices MUST be PDF)
- Line item reorder via drag-drop
- Bank details / payment methods section
- Payment terms configuration (Net 15/30/60/90, Due on Receipt)
- Invoice numbering sequence management
- Recurring invoice flag
- Discount per line item (% or fixed)
- Tax-exempt line items toggle
- Client database (save/load client info)
- Logo upload for company branding
- Email invoice directly (future)

### Task 2.8.3 — Email Template → HTML export
**File:** `EmailTemplateWorkspace.tsx`
**Action:**
- HTML export (the #1 requirement — email templates MUST output HTML)
- Generate responsive HTML using table-based layout (for email client compat)
- Mobile preview mode (side-by-side desktop/mobile)
- Drag-drop block reordering
- Custom HTML/code blocks for advanced users
- Merge tags / personalization variables (`{{first_name}}`, `{{company}}`)
- Email client compatibility indicator (Gmail ✓, Outlook ✓, Apple Mail ✓)
- Send test email (via API integration placeholder)
- Copy HTML to clipboard button
- Plain text version generation

---

## Wave 2.9 — Stock Image Browser & Logo Generator Enhancement

### Task 2.9.1 — Stock Image Browser upgrades
**File:** `StockImageBrowserWorkspace.tsx`
**Action:**
- Image collections/boards (save images to named boards)
- Color search (filter by dominant color)
- Orientation filter (portrait/landscape/square)
- Resolution filter (min width/height)
- License type filter (commercial, editorial)
- Similar image search (find visually similar images)
- Inline crop/resize before download
- Favorite images (persist to preferences)

---

## Deliverables Checklist — Phase 2
- [ ] All 12 workspaces fully functional with proper export formats
- [ ] PDF export working in: Resume, Invoice, Presentation, Logo, Brand Identity, Business Card, Poster
- [ ] HTML export working in: Email Template, Banner Ad
- [ ] PPTX export working in: Presentation
- [ ] All canvas workspaces have: zoom, pan, snap, rulers, alignment tools
- [ ] All canvas workspaces have: inline text editing, multi-selection
- [ ] All workspaces have: undo/redo, keyboard shortcuts
- [ ] AI revision preserves design (surgical changes, not full regeneration)
- [ ] AI Chat has full markdown, code highlighting, export, search
- [ ] Brand Identity & Business Card converted to layer-based
- [ ] Presentation has slideshow mode and PPTX export
- [ ] Zero code duplication between similar workspaces
- [ ] Save/load project state for all workspaces
- [ ] All workspaces use UI primitives from `src/components/ui/`
