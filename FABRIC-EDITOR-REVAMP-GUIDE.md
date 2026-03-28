# DMSuite Design Editor Revamp — Comprehensive Guide

## The Honest Truth

Drake, here is the unfiltered reality of where we are and where we need to go.

### What We Built (The Problem)

We built a **custom Canvas 2D rendering engine from scratch**. This means:

- `renderer.ts` — manually draws every rectangle, circle, text, image with raw `ctx.fillRect()`, `ctx.arc()`, `ctx.fillText()` calls
- `hit-test.ts` — custom collision detection we wrote from zero
- `interaction.ts` — custom pointer state machine (select, move, resize, rotate) we wrote from zero
- `snapping.ts` — custom smart guide engine we wrote from zero
- `commands.ts` — custom undo/redo command stack we wrote from zero
- `schema.ts` — custom `DesignDocumentV2` data model with `LayerV2` types we invented
- `business-card-adapter.ts`, `certificate-adapter.ts` — adapter functions that generate layers programmatically (NOT editable templates)

**The result**: A one-way rendering pipeline. Code generates a document, the renderer paints it to a canvas. The user sees an image. They cannot truly edit individual elements the way you would in Canva, Figma, or any real design tool. The "editing" is done through form fields that regenerate the entire document — not by clicking and dragging elements on the canvas.

This is why certificates look like background images you cannot edit. Because functionally, they are.

**We reinvented the wheel — badly.** Fabric.js, the library that powers the Canva clone you found, provides ALL of the above (hit-testing, interaction, snapping, commands, serialization, object model) as a mature, battle-tested, open-source library used by thousands of production applications. We spent sessions building what already existed.

I should have recommended Fabric.js from the start. That was a mistake, and I am being honest about it now.

### What Fabric.js Actually Is

Fabric.js is an HTML5 Canvas library that provides an **object model** on top of the raw Canvas 2D API. Instead of drawing pixels, you work with objects:

```
fabric.Rect     — rectangles (with rounded corners)
fabric.Circle   — circles / ellipses
fabric.Triangle — triangles
fabric.Polygon  — custom polygons (diamonds, stars, arrows)
fabric.Textbox  — editable text with font control
fabric.Image    — placed images (from URL, upload, or stock)
fabric.Path     — SVG paths (complex shapes)
fabric.Group    — grouped objects (move/scale together)
```

Every object is:
- **Selectable** — click to select, shift-click for multi-select
- **Draggable** — grab and move anywhere
- **Resizable** — corner/edge handles to resize
- **Rotatable** — rotation handle
- **Editable** — double-click text to edit inline
- **Styleable** — fill, stroke, opacity, shadow, filters
- **Serializable** — `canvas.toJSON()` saves EVERYTHING, `canvas.loadFromJSON()` restores it perfectly

### What The Canva Clone Uses

The repo you found (Davronov-Alimardon/canva-clone) uses:

| Component | Technology |
|-----------|------------|
| Canvas Engine | **Fabric.js v5.3.0** (`"fabric": "5.3.0-browser"`) |
| Framework | Next.js 14, React 18 |
| State | Zustand |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | Auth.js (NextAuth v5) |
| API Layer | Hono.js |
| AI Features | Replicate (image generation, background removal) |
| Stock Photos | Unsplash API |
| File Upload | UploadThing |
| Payments | Stripe |
| UI | Shadcn UI, Tailwind CSS v3 |

**How templates work**: Templates are stored as **Fabric.js JSON** — the complete serialized state of a canvas (`canvas.toJSON()`). When a user picks a template, it calls `canvas.loadFromJSON(templateJson)` and every element appears as an individually editable object. This is why everything in his editor is "fully editable" — the template IS the editor format.

**How exporting works**: `canvas.toDataURL("png")` for PNG, `canvas.toDataURL("image/jpeg")` for JPG, `canvas.toJSON()` for JSON save. SVG export via `canvas.toSVG()`. PDF needs a separate library (we already have pdf-lib).

### What This Means For Our Templates

Our current approach of SVG border files, PNG thumbnails, and code-generated adapter functions is the wrong paradigm. Here is the correct approach:

**Templates should be Fabric.js JSON documents.** Period.

How to create them:
1. **Build templates IN the editor itself** — Chiko designs them, or we design them manually and save the JSON
2. **Import from SVG** — Fabric.js has `fabric.loadSVGFromString()` and `fabric.loadSVGFromURL()` that convert SVG elements into native Fabric objects (each element becomes selectable/editable)
3. **Programmatic generation** — Create Fabric objects in code and serialize to JSON (similar to what our adapters do now, but producing Fabric objects instead of LayerV2)
4. **Design in Illustrator/Figma → Export SVG → Import into editor → Save as JSON template** — This is the professional workflow

SVG import quality with Fabric.js:
- **Simple SVGs** (shapes, text, paths): Excellent conversion, fully editable
- **Complex SVGs** (filters, masks, clipping): Partial support, some elements may flatten
- **SVGs with embedded fonts**: Need font loading (which we already have via font-loader.ts)
- **SVGs with raster images**: Images preserved as fabric.Image objects

This is NOT a "Figma-level SVG parser." Fabric.js handles SVG well for design templates, but extremely complex vector artwork may need simplification. For the types of templates we need (certificates, business cards, tickets, badges, menus, posters) — Fabric.js SVG support is MORE than sufficient.

---

## Architecture Decision: What Uses Fabric.js vs What Keeps HTML/CSS

### Tools That SHOULD Use Fabric.js (Visual Design Tools)

These tools require free-form visual editing — placing, moving, resizing, rotating elements on a canvas:

| # | Tool | Current State | Action |
|---|------|---------------|--------|
| 1 | **Certificate Designer** | Custom Canvas 2D (EditorV2) | REPLACE with Fabric.js |
| 2 | **Diploma & Accreditation** | HTML/CSS renderer | REPLACE with Fabric.js |
| 3 | **Business Card Designer** | Custom Canvas 2D (EditorV2) | REPLACE with Fabric.js |
| 4 | **Ticket & Pass Designer** | Custom Canvas 2D (EditorV2) | REPLACE with Fabric.js |
| 5 | **ID Badge Designer** | Custom Canvas 2D (EditorV2) | REPLACE with Fabric.js |
| 6 | **Menu Designer** | Mixed (planned canvas) | BUILD with Fabric.js |
| 7 | **Poster / Flyer / Banner** | Scaffold | BUILD with Fabric.js |
| 8 | **Social Media Post** | Scaffold | BUILD with Fabric.js |
| 9 | **Brochure Designer** | Scaffold | BUILD with Fabric.js |
| 10 | **Invitation Designer** | Scaffold | BUILD with Fabric.js |
| 11 | **Greeting Card Designer** | Scaffold | BUILD with Fabric.js |
| 12 | **Sticker Designer** | Scaffold | BUILD with Fabric.js |
| 13 | **Coupon Designer** | Scaffold | BUILD with Fabric.js |
| 14 | **Envelope Designer** | Scaffold | BUILD with Fabric.js |
| 15 | **Signage Designer** | Scaffold | BUILD with Fabric.js |
| 16 | **Letterhead Designer** | Scaffold | BUILD with Fabric.js |
| 17 | **Infographic Designer** | Scaffold | BUILD with Fabric.js |
| 18 | **Calendar Designer** | Scaffold | BUILD with Fabric.js |
| 19 | **Apparel Designer** | Scaffold | BUILD with Fabric.js |
| 20 | **Packaging Designer** | Scaffold | BUILD with Fabric.js |

### Tools That KEEP HTML/CSS Rendering (Document Tools)

These tools are text-heavy, paginated documents where HTML/CSS is the correct approach:

| # | Tool | Reason to Keep HTML/CSS |
|---|------|------------------------|
| 1 | **Resume/CV** | Multi-page pagination, text-flow, semantic HTML for ATS |
| 2 | **Invoice/Quote/PO** | Table layouts, line items, calculations, multi-page |
| 3 | **Contract Designer** | Clause management, legal formatting, multi-page |
| 4 | **Worksheet Designer** | Form fields, answer keys, educational formatting |
| 5 | **Cover Letter Writer** | Text-flow document, single page |
| 6 | **Business Plan Writer** | Long-form text document, chapters, tables |
| 7 | **Proposal Writer** | Long-form document |
| 8 | **Report Writer** | Long-form document |

---

## What We Take From The Canva Clone

We are NOT copying his entire codebase. He uses a different tech stack (Drizzle ORM, Hono.js, Neon PostgreSQL, Auth.js, Stripe, UploadThing) — we already have our own backend (Supabase, our own auth, MTN MoMo/Airtel Money payments, etc.).

**What we take (the editor pattern):**

1. **Fabric.js as the canvas engine** — `fabric` npm package v5.3.0
2. **The `useEditor` hook pattern** — initializes Fabric canvas, provides editor API
3. **The sidebar pattern** — tool-specific sidebars (shapes, text, images, colors, templates)
4. **The toolbar pattern** — context-sensitive toolbar based on selected object
5. **JSON serialization for templates and save/load**
6. **History via JSON snapshots** (we adapt this to work with our existing Zustand persistence)

**What we DON'T take:**

- His database layer (we use Supabase)
- His auth system (we use Supabase Auth)
- His payment system (we use MTN MoMo/Airtel)
- His AI system (we use Claude via our own API routes)
- His file upload system (we handle our own)
- His project management (we have our own project storage)
- His UI components (we have our own design system)

---

## Shared Editor Architecture

### Core Principle: ONE editor, MANY tools

Every visual design tool shares the SAME editor component. The only differences are:
1. **Canvas size** (business card = 1050x600, certificate = 2480x1754, poster = 2480x3508, etc.)
2. **Available templates** (certificate templates vs business card templates vs ticket templates)
3. **Quick-edit sidebar** (tool-specific fields — certificate has recipient name, date, institution; business card has contact info, etc.)
4. **Chiko AI context** (tool-specific manifest — Chiko knows what kind of design it is)
5. **Export options** (business card = front/back PDF; certificate = single page; poster = large format)

### File Structure (New)

```
src/
├── lib/
│   └── fabric-editor/                    # NEW — Shared Fabric.js editor engine
│       ├── use-editor.ts                 # Main hook — initializes canvas, provides API
│       ├── use-auto-resize.ts            # Auto-fit canvas to container
│       ├── use-canvas-events.ts          # Selection, modification, creation events
│       ├── use-history.ts                # Undo/redo via JSON snapshots
│       ├── use-hotkeys.ts                # Keyboard shortcuts (Ctrl+Z, Ctrl+C, Delete, etc.)
│       ├── use-clipboard.ts             # Copy/paste fabric objects
│       ├── types.ts                      # Editor types, tool types, defaults
│       ├── utils.ts                      # Helpers (download, text detection, filters)
│       ├── export.ts                     # PNG, JPG, SVG, PDF export pipeline
│       └── chiko-bridge.ts              # Chiko AI ↔ Fabric.js bridge (programmatic manipulation)
│
├── components/
│   └── fabric-editor/                    # NEW — Shared editor UI components
│       ├── FabricEditor.tsx              # Main editor component (canvas + sidebars + toolbar)
│       ├── EditorNavbar.tsx              # Top bar (save, export, undo/redo, zoom)
│       ├── EditorSidebar.tsx             # Left icon sidebar (select, shapes, text, images, etc.)
│       ├── EditorToolbar.tsx             # Context toolbar (changes based on selected object)
│       ├── EditorFooter.tsx              # Bottom bar (zoom slider, canvas size)
│       ├── ShapeSidebar.tsx              # Shape insertion panel
│       ├── TextSidebar.tsx               # Text insertion + font picker
│       ├── ImageSidebar.tsx              # Image upload + stock photos (Unsplash/Pexels)
│       ├── TemplateSidebar.tsx           # Template gallery (filtered per tool)
│       ├── ColorSidebar.tsx              # Fill + stroke color picker
│       ├── OpacitySidebar.tsx            # Opacity slider
│       ├── FilterSidebar.tsx             # Image filters (if applicable)
│       ├── DrawSidebar.tsx               # Freehand drawing tools
│       ├── LayersSidebar.tsx             # Layer list with reorder, lock, visibility
│       └── SettingsSidebar.tsx           # Canvas size, background color
│
├── data/
│   └── templates/                        # NEW — Fabric.js JSON templates
│       ├── certificate-templates.json    # 8+ certificate preset JSONs
│       ├── business-card-templates.json  # 8+ business card preset JSONs
│       ├── ticket-templates.json         # 8+ ticket preset JSONs
│       ├── diploma-templates.json        # 8+ diploma preset JSONs
│       ├── id-badge-templates.json       # 8+ ID badge preset JSONs
│       ├── menu-templates.json           # 8+ menu preset JSONs
│       ├── poster-templates.json         # 8+ poster/flyer preset JSONs
│       └── social-templates.json         # 8+ social media preset JSONs
│
└── components/workspaces/
    ├── certificate-designer/
    │   └── CertificateDesignerWorkspace.tsx  # REWRITTEN — uses FabricEditor + certificate templates + certificate quick-edit
    ├── business-card/
    │   └── BusinessCardWorkspace.tsx          # REWRITTEN — uses FabricEditor + business card templates
    ├── ticket-designer/
    │   └── TicketDesignerWorkspace.tsx        # REWRITTEN — uses FabricEditor + ticket templates
    ├── diploma-designer/
    │   └── DiplomaDesignerWorkspace.tsx       # REWRITTEN — uses FabricEditor + diploma templates
    ├── id-badge-designer/
    │   └── IDCardDesignerWorkspace.tsx        # REWRITTEN — uses FabricEditor + ID badge templates
    └── ... (all other visual design tools follow same pattern)
```

### How Each Workspace Works

Every visual design workspace is a thin wrapper:

```tsx
// Example: CertificateDesignerWorkspace.tsx (simplified concept)

export default function CertificateDesignerWorkspace() {
  return (
    <FabricEditor
      toolId="certificate-designer"
      defaultWidth={2480}           // A4 landscape at 300 DPI
      defaultHeight={1754}
      templates={certificateTemplates}  // Fabric.js JSON templates
      quickEditFields={[               // Tool-specific sidebar fields
        { key: "recipientName", label: "Recipient Name", type: "text", targetLayer: "recipient-name" },
        { key: "courseName", label: "Course/Award", type: "text", targetLayer: "course-name" },
        { key: "date", label: "Date", type: "date", targetLayer: "date-text" },
        { key: "institution", label: "Institution", type: "text", targetLayer: "institution-name" },
        { key: "signatory", label: "Signatory", type: "text", targetLayer: "signatory-name" },
      ]}
      chikoManifest={certificateManifest}
      exportOptions={["png", "pdf", "jpg"]}
    />
  );
}
```

### How Chiko AI Integration Works

This is critical — Chiko must have FULL programmatic control of the Fabric canvas.

**The `chiko-bridge.ts` module** translates Chiko's AI instructions into Fabric.js operations:

```
Chiko says: "Change the title to 'Certificate of Excellence'"
Bridge does: canvas.getObjects().find(o => o.name === 'title-text').set({ text: 'Certificate of Excellence' })

Chiko says: "Make the background navy blue"
Bridge does: workspace.set({ fill: '#1a1a4f' }); canvas.renderAll()

Chiko says: "Add a gold border"
Bridge does: new fabric.Rect({ stroke: '#d4a843', strokeWidth: 8, fill: 'transparent', ... }); canvas.add(rect)

Chiko says: "Move the logo to top-left"
Bridge does: canvas.getObjects().find(o => o.name === 'logo').set({ left: 50, top: 50 })

Chiko says: "Apply a luxury gold theme"
Bridge does: (batch operations — change colors, fonts, add decorative elements, rearrange layout)

Chiko says: "Create a certificate from scratch"
Bridge does: (generates Fabric objects programmatically — background, border, title, body text, seal, signatures — then adds all to canvas)
```

Key: Every Fabric object gets a `name` property (like `"title-text"`, `"logo"`, `"background"`, `"border"`, `"seal"`) so Chiko can find and manipulate specific elements.

### How Templates Are Created

**Method 1: Designed In-Editor (Primary)**
1. Open the editor
2. Add shapes, text, images, decorations
3. Style everything (colors, fonts, effects)
4. Name every object (for Chiko targeting)
5. Export as JSON → save as template

**Method 2: SVG Import**
1. Design in Illustrator/Figma
2. Export as SVG
3. Use `fabric.loadSVGFromString()` to import
4. Each SVG element becomes an editable Fabric object
5. Name the objects
6. Save as JSON template

**Method 3: AI Generation**
1. User tells Chiko: "Create a modern certificate design"
2. Chiko generates Fabric objects programmatically via chiko-bridge.ts
3. User tweaks in the editor
4. Can save as personal template

**Method 4: Hybrid**
1. Use SVG for complex decorative borders/frames
2. Import into Fabric
3. Add text and other elements natively
4. Save the complete composition as JSON

---

## What Gets Deleted (Old System)

### Files To Remove

**Custom Canvas Engine (replaced by Fabric.js):**
- `src/lib/editor/renderer.ts` — Custom Canvas 2D renderer
- `src/lib/editor/hit-test.ts` — Custom hit testing
- `src/lib/editor/interaction.ts` — Custom pointer state machine
- `src/lib/editor/snapping.ts` — Custom snap engine
- `src/lib/editor/commands.ts` — Custom undo/redo
- `src/lib/editor/schema.ts` — Custom DesignDocumentV2 model
- `src/lib/editor/ai-patch.ts` — Custom AI patch protocol
- `src/lib/editor/business-card-adapter.ts` — Code-generated business card layouts
- `src/lib/editor/certificate-adapter.ts` — Code-generated certificate layouts
- `src/lib/editor/certificate-design-generator.ts` — AI certificate generator (old format)
- `src/lib/editor/template-generator.ts` — Parametric template engine (old format)
- `src/lib/editor/card-template-helpers.ts` — Business card helpers (old format)
- `src/lib/editor/ai-design-generator.ts` — AI design generator (old format)
- `src/lib/editor/v1-migration.ts` — Legacy migration (no longer needed)
- `src/lib/editor/align-distribute.ts` — Custom alignment (Fabric.js has this built-in)
- `src/lib/editor/design-rules.ts` — Can be rebuilt as a lighter Fabric.js validator
- `src/lib/editor/index.ts` — Barrel export

**Custom Editor Components (replaced by Fabric editor components):**
- `src/components/editor/CanvasEditor.tsx` — Custom canvas editor
- `src/components/editor/EditorToolbar.tsx` — Custom toolbar
- `src/components/editor/LayersListPanel.tsx` — Custom layers panel
- `src/components/editor/LayerPropertiesPanel.tsx` — Custom properties panel
- `src/components/editor/TextStyleEditor.tsx` — Custom text editor
- `src/components/editor/FillStrokeEditor.tsx` — Custom fill/stroke editor
- `src/components/editor/TransformEditor.tsx` — Custom transform editor
- `src/components/editor/EffectsEditor.tsx` — Custom effects editor
- `src/components/editor/AlignDistributeBar.tsx` — Custom alignment bar
- `src/components/editor/IconPickerPopover.tsx` — Custom icon picker
- `src/components/editor/ColorPickerPopover.tsx` — Custom color picker
- `src/components/editor/index.ts` — Barrel export

**Old Workspace Implementations (will be rewritten as thin wrappers):**
- Certificate designer workspace files
- Business card workspace files (StepEditor pattern)
- Ticket designer workspace files
- ID badge designer workspace files
- Diploma canvas workspace

**Old Stores (replaced by unified Fabric editor store):**
- `src/stores/editor.ts` — Custom editor store
- `src/stores/certificate-editor.ts` — Certificate-specific store
- `src/stores/diploma-canvas.ts` — Diploma canvas store

### Files To KEEP

**Still Needed:**
- `src/lib/editor/font-loader.ts` — Font loading is still useful
- `src/lib/editor/pdf-renderer.ts` — PDF export (adapt to work with Fabric canvas data)
- `src/lib/editor/svg-renderer.ts` — SVG-to-PNG conversion (useful for template thumbnails)
- `src/lib/editor/abstract-library.ts` — Decorative assets (adapt to produce Fabric objects instead of LayerV2)
- `src/lib/icon-library.ts` — Icon bank (adapt to produce Fabric objects)
- `src/data/certificate-templates.ts` — Template metadata (adapt to reference Fabric JSON)

**Untouched (HTML/CSS tools):**
- Everything in `src/lib/resume/`
- Everything in `src/lib/invoice/`
- Everything in `src/lib/contract/`
- Everything in `src/lib/worksheet/`
- Resume, Invoice, Contract, Worksheet workspace components
- All corresponding stores (resume-editor.ts, invoice-editor.ts, etc.)

---

## Implementation Plan — Phase Order

### Phase 0: Foundation (ONE session)
1. Install `fabric` package (v5.3.0 or latest v5.x)
2. Install `@types/fabric` (v5.3.0)
3. Create `src/lib/fabric-editor/` directory structure
4. Implement `use-editor.ts` — core hook (adapted from Canva clone pattern)
5. Implement `use-auto-resize.ts` — responsive canvas
6. Implement `use-canvas-events.ts` — selection tracking
7. Implement `use-history.ts` — JSON-based undo/redo
8. Implement `use-hotkeys.ts` — keyboard shortcuts
9. Implement `use-clipboard.ts` — copy/paste
10. Implement `types.ts` — editor types adapted for our system
11. Implement `utils.ts` — helpers
12. Implement `export.ts` — PNG/JPG/PDF/SVG export
13. Implement `chiko-bridge.ts` — AI manipulation API
14. TypeScript check: 0 errors

### Phase 1: Shared Editor UI (ONE session)
1. Create `src/components/fabric-editor/FabricEditor.tsx` — main editor shell
2. Create all sidebar components (shapes, text, images, colors, templates, layers, etc.)
3. Create toolbar component (context-sensitive)
4. Create navbar component (save, export, undo/redo)
5. Create footer component (zoom, canvas info)
6. Style everything with our Tailwind v4 design system (dark mode, glassmorphism)
7. Wire Chiko AI revision bar into the editor
8. TypeScript check: 0 errors

### Phase 2: First Tool Migration — Business Card (ONE session)
1. Create business card Fabric.js JSON templates (8 designs minimum)
2. Rewrite BusinessCardWorkspace to use FabricEditor
3. Wire Chiko manifest to chiko-bridge.ts
4. Test: create, edit, export PNG/PDF
5. Verify project save/load works with Fabric JSON
6. TypeScript check: 0 errors

### Phase 3: Certificate Designer Migration (ONE session)
1. Create certificate Fabric.js JSON templates (8 designs minimum)
2. Rewrite CertificateDesignerWorkspace to use FabricEditor
3. Wire Chiko manifest
4. Test all export formats
5. TypeScript check: 0 errors

### Phase 4: Remaining Tool Migrations (ONE session each)
- Ticket Designer
- ID Badge Designer
- Diploma Designer
- Menu Designer

### Phase 5: New Tools (ONE session each)
- Poster/Flyer/Banner
- Social Media Post
- Brochure
- Invitation
- Any remaining visual design tools

### Phase 6: Cleanup (ONE session)
1. Delete all old Custom Canvas 2D files
2. Delete old editor components
3. Delete old stores
4. Update memory bank
5. Final TypeScript check
6. Final build check

---

## Chiko AI — Full Design Control

With Fabric.js, Chiko can do EVERYTHING programmatically:

**Text Operations:**
- Add/edit/remove any text element
- Change font family, size, weight, style, alignment, color
- Position text precisely (x, y coordinates)
- Apply text effects (underline, strikethrough, shadow)

**Shape Operations:**
- Add rectangles, circles, triangles, polygons, stars, lines
- Change fill color, stroke color, stroke width
- Apply rounded corners, gradients
- Position and resize any shape

**Image Operations:**
- Add images from URL
- Resize and position images
- Apply filters (blur, brightness, contrast, grayscale, sepia, etc.)
- Remove background (via AI API call)

**Layout Operations:**
- Align objects (left, center, right, top, middle, bottom)
- Distribute objects evenly
- Group/ungroup objects
- Reorder z-index (bring forward, send backward)
- Lock/unlock objects

**Template Operations:**
- Load any template by name
- Swap templates while preserving user content
- Create designs from scratch (generate all objects programmatically)

**Style Operations:**
- Apply color themes (change all colors at once)
- Apply font themes (change all fonts at once)
- Change canvas background
- Change canvas size

**Export Operations:**
- Export as PNG, JPG, SVG, PDF
- Set export quality/resolution

This means Chiko can create **stunning, pixel-perfect designs** entirely through AI — the user just describes what they want, and Chiko builds it on the Fabric canvas. The user can then tweak anything by clicking and editing directly.

---

## Template Strategy — Getting Professional Templates

### Option 1: Design In The Editor + AI (FREE, scalable)
- Chiko generates designs programmatically
- Build up a library of AI-generated templates over time
- Users can save their designs as personal templates
- Community templates (users share designs)

### Option 2: SVG Import From Free Resources (FREE)
- Sites like Freepik, Vecteezy, SVGRepo have free SVG templates
- Import SVG → Fabric objects → Save as JSON template
- Need to verify license compatibility for each source

### Option 3: Design In Illustrator/Figma (PROFESSIONAL)
- Design templates professionally
- Export as SVG
- Import into editor
- Name all elements for Chiko targeting
- Save as JSON template

### Option 4: Purchase Premium Template Packs (PAID)
- Sites like Creative Market, Envato Elements sell template packs
- Would need SVG/vector format
- Import and convert to Fabric.js JSON
- Adds premium tier value

### Recommended Approach
Start with Option 1 (Chiko-generated) + Option 2 (free SVG imports) for launch. Add Option 3 and 4 as the platform matures. The beauty of Fabric.js JSON templates is that they can come from ANY source — AI-generated, SVG-imported, or hand-designed — and they all end up as the same editable format.

---

## Integration With Existing DMSuite Systems

### Project Storage (Already Built)
Our Supabase + IndexedDB project storage works perfectly. Instead of storing a DesignDocumentV2 JSONB blob, we store a Fabric.js JSON blob. Same pipeline, different format.

```
Write: canvas.toJSON(JSON_KEYS) → IndexedDB + Supabase project_data
Read:  Supabase/IndexedDB → canvas.loadFromJSON(data)
```

### Credit System (Already Built)
No changes needed. Chiko AI operations still cost credits. The credit deduction happens at the API layer, not the editor layer.

### Auth & Payments (Already Built)
No changes needed. Editor is purely client-side rendering.

### Chiko Chat (Already Built)
Chiko's chat interface stays the same. The only change is the manifest actions map to Fabric.js operations (via chiko-bridge.ts) instead of DesignDocumentV2 operations.

---

## FAQ — Common Concerns

**Q: Does Fabric.js support SVG templates?**
A: Yes. `fabric.loadSVGFromString()` and `fabric.loadSVGFromURL()` convert SVG elements to native Fabric objects. Each path, text, and shape becomes individually editable. Complex SVGs with advanced filters may need simplification, but standard design templates work well.

**Q: Can we do print-ready 300 DPI export?**
A: Yes. Set the canvas multiplier on export: `canvas.toDataURL({ multiplier: 3 })` for 3x resolution. Combined with our existing pdf-renderer.ts (adapted for Fabric), we get print-quality output.

**Q: What about the existing templates we already designed?**
A: The SVG borders we created can be imported into Fabric.js. The programmatic adapter logic needs to be rewritten to produce Fabric objects, but the visual design concepts transfer directly.

**Q: Will this break the HTML/CSS tools (resume, invoice, etc.)?**
A: No. The HTML/CSS rendering pipeline is completely separate and unaffected. We only replace the Canvas 2D system.

**Q: How big is Fabric.js? Will it slow down the site?**
A: Fabric.js v5 is about 300KB minified. It only loads on pages that use the design editor (dynamic import). Dashboard, resume editor, invoice editor, etc. are unaffected.

**Q: Can multiple people edit the same design?**
A: Not real-time collaborative editing (that would require CRDT/OT protocol). But save/load via project storage works. Real-time collab is a future consideration.

---

## Summary

| Aspect | Old System | New System (Fabric.js) |
|--------|------------|----------------------|
| Canvas engine | Custom Canvas 2D (renderer.ts) | Fabric.js v5 |
| Object selection | Custom hit-test.ts | Built-in |
| Drag/resize/rotate | Custom interaction.ts | Built-in |
| Snapping | Custom snapping.ts | Can add via events |
| Undo/redo | Custom commands.ts | JSON snapshots |
| Template format | Code-generated LayerV2 | Fabric.js JSON (fully editable) |
| Template creation | Code-only (adapters) | Visual editor + SVG import + AI |
| AI control | Complex ai-patch.ts protocol | Direct Fabric object manipulation |
| Text editing | Form fields → regenerate | Click text → edit inline on canvas |
| Save/load | Custom DesignDocumentV2 JSON | Fabric JSON (canvas.toJSON/loadFromJSON) |
| Export PNG | Custom renderDocumentV2() | canvas.toDataURL() |
| Export PDF | Custom pdf-renderer.ts | Adapted pdf-renderer + canvas data |
| Export SVG | Not supported natively | canvas.toSVG() built-in |
| Lines of custom code | ~5000+ across 20 files | ~1500 across 12 files (mostly UI) |
| Battle-tested | No (custom-built) | Yes (used by thousands of projects) |

**Bottom line**: This is absolutely achievable. It is the correct path. It is what we should have done from the start. The Canva clone proves the approach works. The tools we need (certificate, business card, ticket, badge, menu, poster, etc.) are the exact use case Fabric.js was built for.

Let us get started.
