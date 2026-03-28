# Certificate Designer — Definitive Canvas Editor Rebuild (V3)

> **Purpose:** Complete, self-contained specification for an AI agent to **delete the existing form-based certificate tool** and **rebuild it as a production-grade canvas editor** using DMSuite's EditorV2 engine **plus critical infrastructure upgrades** that close 6 show-stopping rendering/export gaps. Every architectural decision, file path, data structure, library choice, and implementation detail is specified with precision.
>
> **Why V3 exists:** V2 said "use the existing renderers" — but the existing renderers have fatal gaps for certificates: PDF exports only embed Helvetica font (not Playfair Display), drop all effects (shadows, glow), render gradients as black, rasterize SVG borders at screen DPI (~150), and don't wait for Google Font loading before first canvas render. This V3 fixes all of that.
>
> **Reference Implementation:** Business Card Designer (`BusinessCardWorkspace.tsx` + `StepEditor.tsx` + `business-card-adapter.ts`) is the production EditorV2 pattern. Certificate follows it exactly, with the infrastructure upgrades below.
>
> **For the executing agent:** You are in the same workspace. Every file path is absolute from `d:\dramac-ai-suite`. Every import is verified against the actual codebase. `grep` any claim — it's all checkable. This document does NOT contain implementation code — it gives you the exact specifications, data structures, and behavioral requirements. You write the code. You are trusted to make excellent implementation decisions based on these specs.

---

## TABLE OF CONTENTS

1. [Platform Context & Vision](#1-platform-context--vision)
2. [Infrastructure Gap Analysis (Why V2 Wasn't Enough)](#2-infrastructure-gap-analysis)
3. [New Dependencies to Install](#3-new-dependencies-to-install)
4. [Infrastructure Upgrades (Shared — Benefits ALL Tools)](#4-infrastructure-upgrades)
5. [EditorV2 Schema Reference (Exact Types)](#5-editorv2-schema-reference)
6. [What to Delete (Old Certificate System)](#6-what-to-delete)
7. [SVG Asset Inventory and Migration](#7-svg-asset-inventory-and-migration)
8. [What to Create (New Certificate System)](#8-what-to-create)
9. [Certificate Template Registry (8 Templates)](#9-certificate-template-registry)
10. [CertificateConfig Type Definition](#10-certificateconfig-type-definition)
11. [Template → DesignDocumentV2 Adapter](#11-template--designdocumentv2-adapter)
12. [Seal Rendering Specification](#12-seal-rendering-specification)
13. [Certificate Store (Zustand)](#13-certificate-store-zustand)
14. [Workspace Component](#14-workspace-component)
15. [Chiko AI Manifest (Canvas-Aware)](#15-chiko-ai-manifest-canvas-aware)
16. [AI Design Generation](#16-ai-design-generation)
17. [Store Adapter (Project System)](#17-store-adapter-project-system)
18. [Export Pipeline (PNG / PDF / Print)](#18-export-pipeline)
19. [Workspace Events & Milestones](#19-workspace-events--milestones)
20. [Responsive & Mobile Rules](#20-responsive--mobile-rules)
21. [Styling & Token Rules](#21-styling--token-rules)
22. [Integration Touchpoints](#22-integration-touchpoints)
23. [Validation & Testing Checklist](#23-validation--testing-checklist)
24. [Template Expansion Guide (For Drake)](#24-template-expansion-guide)
25. [Admin Template Management (Future Phase)](#25-admin-template-management)
26. [User Asset Upload (Future Phase)](#26-user-asset-upload)

---

## 1. PLATFORM CONTEXT & VISION

### What is DMSuite?

DMSuite is an AI-powered graphic design platform with **~280+ tools** across 8 categories. Users primarily **prompt Chiko AI** to design; the canvas is for manual refinement. Think Canva meets Illustrator, but AI-first.

### The User Flow

```
1. User opens Certificate Designer
2. Picks a template from gallery  —OR—  prompts Chiko: "Create a gold achievement cert for Jane Smith"
3. Chiko generates a DesignDocumentV2 with layers (border, title, recipient, seal, etc.)
4. Canvas renders the live certificate
5. User prompts Chiko for revisions  —OR—  manually edits layers on canvas
6. User exports as PDF (vector, selectable text, correct fonts) or PNG (high-DPI raster)
```

### Why EditorV2?

DMSuite has TWO canvas systems. EditorV2 is the correct choice:

| Feature | Canvas-Layers (System 1) | EditorV2 (System 2) |
|---------|--------------------------|----------------------|
| Layer Types | 6 basic | 10+ (text, shape, image, icon, path, frame, group, boolean) |
| Effects | Shadow only | 7 stackable (shadow, blur, glow, outline, color adjust, noise) |
| Blend Modes | None | 16 modes |
| AI Integration | None | `applyAIPatch()` + `applyAIIntent()` |
| Undo/Redo | Manual history | Command stack with coalescing |
| Used By | Social media, posters | **Business cards, resumes — production-proven** |

EditorV2 is used by the Business Card Designer (the most complete tool in DMSuite). Certificate follows that exact pattern.

### Reusability

This is tool #1 of ~200. Every infrastructure upgrade benefits ALL tools immediately. Every certificate-specific pattern is extractable.

---

## 2. INFRASTRUCTURE GAP ANALYSIS

### 6 Show-Stopping Gaps Found in the Existing Pipeline

These gaps affect ALL EditorV2 tools, not just certificates. Fixing them here upgrades the entire platform.

| # | Gap | Impact | Where | Fix |
|---|-----|--------|-------|-----|
| 1 | **PDF only embeds Helvetica** | All PDFs use Helvetica regardless of design. Playfair Display, Cormorant Garamond, etc. — all lost. | `src/lib/editor/pdf-renderer.ts` lines 157-173: `loadFontCache()` only loads `StandardFonts.Helvetica*` | Wire up `@pdf-lib/fontkit` (already in `package.json` but never imported). Fetch Google Font TTF binaries, embed via `pdfDoc.embedFont(ttfBytes)`. |
| 2 | **PDF drops ALL effects** | Drop shadows, glow, outline — silently lost in PDF. | `pdf-renderer.ts`: no effect handling code exists | Render effect layers to high-DPI raster (Canvas2D → PNG → embed) as composited overlay. For drop shadows specifically, use pdf-lib's native shadow drawing. |
| 3 | **PDF renders gradients as black** | `paintToRgb()` at line ~195 falls back to `rgb(0,0,0)` for non-solid paints. | `pdf-renderer.ts` line ~195: `// Gradient/pattern/image → fallback to black` | Implement gradient-to-PDF conversion using pdf-lib's SVG path approach, or raster fallback for complex gradients. |
| 4 | **Canvas doesn't wait for font loading** | First render shows fallback system fonts. User sees "serif" flash before Playfair loads. | `src/lib/editor/renderer.ts`: no font-readiness check | Add `FontFaceObserver` to detect load completion. Gate canvas render on font readiness. Show loading skeleton until fonts resolve. |
| 5 | **SVG borders rasterize at ~150 DPI** | SVG border images embedded via Canvas2D at 2x DPI. For A4 (3508px), that's only ~150 DPI effective. Print needs 300+. | `pdf-renderer.ts` image embedding: `const tmpCanvas... scale * 2` | Use `@resvg/resvg-wasm` for pixel-perfect SVG→PNG at arbitrary DPI on the server side route. For client-side PDF, render SVG to high-DPI canvas (4x or higher). |
| 6 | **Post-effects stub (canvas renderer)** | Blur, glow, outline, color adjust, noise all hit a stub: `// Placeholder for future implementation` | `renderer.ts` line 578: `function applyPostEffects()` is empty | Implement off-screen compositing for each effect type using Canvas2D and OffscreenCanvas. |

### Evidence (Verifiable)

```bash
# Gap 1: Only Helvetica in PDF
grep -n "StandardFonts" src/lib/editor/pdf-renderer.ts
# → Lines 160-163: Helvetica, HelveticaBold, HelveticaOblique, HelveticaBoldOblique

# Gap 1: fontkit in package.json but never used
grep -rn "fontkit" src/
# → ZERO results (it's listed in package.json but never imported)

# Gap 3: Gradient falls back to black
grep -n "fallback to black" src/lib/editor/pdf-renderer.ts
# → "Gradient/pattern/image → fallback to black"

# Gap 4: No font loading in renderer
grep -n "font.*load\|FontFace\|fontface" src/lib/editor/renderer.ts
# → ZERO results

# Gap 6: Post-effects stub
grep -n "Placeholder" src/lib/editor/renderer.ts
# → "Placeholder for future implementation"
```

---

## 3. NEW DEPENDENCIES TO INSTALL

```bash
npm install fontfaceobserver @resvg/resvg-wasm
npm install -D @types/fontfaceobserver
```

| Package | Version | Purpose | Size | Weekly Downloads |
|---------|---------|---------|------|-----------------|
| `fontfaceobserver` | ^2.3.0 | Detect when Google Fonts finish loading. Promise-based, 1.3KB gzipped. Battle-tested (3.6M weekly downloads). | 1.3KB gz | 3,611,299 |
| `@resvg/resvg-wasm` | ^2.6.2 | Pixel-perfect SVG rendering with custom font support. Rust-powered WASM, zero server dependencies. Correct output guaranteed. | 2.53MB (WASM binary) | 506,945 |
| `@types/fontfaceobserver` | latest | TypeScript declarations for fontfaceobserver | — | — |

### Already Installed But Unused

| Package | Status | Action |
|---------|--------|--------|
| `@pdf-lib/fontkit` ^1.1.1 | In `package.json`, NEVER imported | **Wire it up** in `pdf-renderer.ts` |
| `pdf-lib` ^1.17.1 | Primary PDF library, working | Keep — upgrade font pipeline |
| `jspdf` ^4.1.0 | In `package.json`, only used by resume/invoice HTML path | Keep as-is |

### Why These Specific Tools?

**`fontfaceobserver`** over alternatives:
- `document.fonts.ready` (native FontLoading API) — Not available in all browsers, no per-font granularity, unreliable for Canvas2D
- `webfontloader` (Google/TypeKit) — Heavier (11KB), callback-based not Promise-based, last updated 2017
- `fontfaceobserver` — 1.3KB, Promise-based, scroll-event detection (most efficient), works everywhere including IE8+

**`@resvg/resvg-wasm`** over alternatives:
- `canvg` — Renders SVG via Canvas2D in the browser. Lossy, doesn't support all SVG features, no custom font loading
- `svg2img` — Node.js only, uses `node-canvas` (native addon), can't run in browser
- `sharp` — Node.js only, C++ binding, server-side only
- `@resvg/resvg-wasm` — Rust-compiled WASM, runs in browser AND Node.js, supports custom fonts, filters, patterns, clips, masks. Pixel-perfect SVG spec compliance. 994K weekly downloads.

**Why not replace `pdf-lib`?**
- `pdf-lib` is solid for what it does. The gap is just font embedding (fixable with `fontkit`) and effects (fixable with raster fallback). No need to swap PDF engines.

---

## 4. INFRASTRUCTURE UPGRADES

These upgrades go into **shared** files that benefit ALL tools (business cards, resumes, invoices — everything). No code is prescribed here — the executing agent writes the implementation. What follows are the exact behavioral requirements, strategies, and constraints.

### UPGRADE 1: Custom Font Embedding in PDF

**File to modify:** `src/lib/editor/pdf-renderer.ts`

**Problem:** The function `loadFontCache()` (around line 157) only embeds four `StandardFonts.Helvetica*` variants. Every PDF from every tool shows Helvetica regardless of what font the design uses. The package `@pdf-lib/fontkit` version 1.1.1 is in `package.json` but has never been imported or used anywhere in the codebase.

**Required behavior:**

1. Import and register `fontkit` with every `PDFDocument` before embedding fonts — `pdfDoc.registerFontkit(fontkit)` is the single line that unlocks custom font embedding in `pdf-lib`.

2. Scan the document's text layers to collect every unique font family + weight + italic combination. The `TextLayerV2` type has `defaultStyle.fontFamily`, `defaultStyle.fontWeight`, and `defaultStyle.italic` at the layer level, plus per-run overrides in `runs[].style`.

3. For each unique font variant, fetch the actual TTF binary from Google Fonts. **CRITICAL CORS WARNING:** Browsers forbid setting the `User-Agent` header in `fetch()` — it's a CORS-forbidden header name. A client-side fetch to the Google Fonts CSS2 API with a custom User-Agent will silently fail in every browser. **The solution is a server-side API route** at `src/app/api/fonts/route.ts` that:
   - Receives a font family, weight, and style as query parameters
   - Fetches the Google Fonts CSS2 API from the server side (where there are no CORS restrictions) using a User-Agent string that triggers TTF/OTF format responses (not WOFF2, which pdf-lib cannot embed)
   - Extracts the `src: url(...)` from the returned CSS
   - Fetches the binary font file and returns it as `application/octet-stream`
   - Caches results in a `Map` keyed by family+weight+style so the same font is never fetched twice per server lifecycle

4. Embed each fetched TTF into the PDF with subsetting enabled — `pdfDoc.embedFont(ttfBytes, { subset: true })` — which reduces file size by only including glyphs actually used.

5. Build a lookup map keyed by `"FamilyName|weight|italic"` string → `PDFFont`. When rendering text to PDF, look up the embedded font from this map. If the custom font failed to load, fall back to the matching Helvetica variant (the existing `selectFont()` function).

6. Keep the existing `loadFontCache()` function and Helvetica embedding intact as the fallback. Create a new `loadFontCacheV2()` that calls the old one for fallback, then overlays custom fonts.

### UPGRADE 2: Gradient and Non-Solid Paint Rendering in PDF

**File to modify:** `src/lib/editor/pdf-renderer.ts`

**Problem:** The function `paintToRgb()` (around line 195) returns `rgb(0,0,0)` (solid black) for any paint that isn't `kind: "solid"`. Every gradient, pattern, and image fill renders as black in PDF exports.

**Required behavior:**

For any layer whose fill is a `GradientPaint`, `PatternPaint`, or `ImagePaint`:

1. Create a temporary Canvas2D surface (use `document.createElement("canvas")` for Safari compatibility — NOT `OffscreenCanvas`, which Safari only added in 16.4 and may be unavailable). Set its dimensions to the layer's size multiplied by a DPI scale factor of 4 (which gives ~300 DPI for A4-sized documents).

2. Use the existing Canvas2D renderer functions to paint the fill onto this temporary canvas — the Canvas2D renderer already handles all paint types correctly (linear/radial/angular gradients, patterns, image fills).

3. Export the temporary canvas as a PNG blob/array buffer.

4. Embed that PNG into the PDF using `pdfDoc.embedPng()` and draw it at the layer's position with the layer's dimensions.

5. **Safari fallback:** Always use `document.createElement("canvas")` for the temporary surface, never `OffscreenCanvas`. Set `.width` and `.height` on the element directly. Use `canvas.toDataURL("image/png")` → base64 decode if `convertToBlob` is unavailable. This ensures the fallback works in Safari 14+, Firefox, Chrome, and Edge.

6. For `SolidPaint`, continue using the existing vector path (no rasterization needed). Only rasterize when the paint is non-solid.

### UPGRADE 3: Post-Effects Implementation in Canvas Renderer

**File to modify:** `src/lib/editor/renderer.ts`

**Problem:** The function `applyPostEffects()` at line 578 is an empty placeholder: `"Post-effects (outline, glow, noise) require off-screen compositing — Placeholder for future implementation"`. The existing codebase defines 7 effect types in `schema.ts` but only `drop-shadow` (handled in `applyPreEffects()`) actually works.

**The 7 effect types in the schema** (from `src/lib/editor/schema.ts`):

| Type | Discriminator | Key Fields |
|------|--------------|------------|
| `DropShadowEffect` | `"drop-shadow"` | `color: RGBA`, `offsetX`, `offsetY`, `blur`, `spread` |
| `InnerShadowEffect` | `"inner-shadow"` | `color: RGBA`, `offsetX`, `offsetY`, `blur` |
| `BlurEffect` | `"blur"` | `blurType: "gaussian" \| "motion"`, `radius`, `angle` |
| `GlowEffect` | `"glow"` | `color: RGBA`, `radius`, `intensity` (0–1), `inner: boolean` |
| `OutlineEffect` | `"outline"` | `color: RGBA`, `width` |
| `ColorAdjustEffect` | `"color-adjust"` | `brightness`, `contrast`, `saturation`, `temperature`, `tint` (-100–100), `hueRotate` (0–360) |
| `NoiseEffect` | `"noise"` | `intensity` (0–1), `monochrome: boolean` |

**CRITICAL IMPLEMENTATION CONSTRAINT — Canvas2D filter timing:**

Canvas2D's `ctx.filter` property (used for blur, color-adjust) must be set **BEFORE** any draw calls. Setting it after drawing has zero effect. This means effects that use `ctx.filter` cannot be "applied on top" — they require **re-rendering the layer to a temporary canvas** with the filter set first, then compositing the result back.

**Required behavior for each effect type:**

1. **Blur (`"blur"`):** Create a temporary canvas the size of the layer (plus padding for blur overflow = `radius * 2` pixels each side). Set `ctx.filter = "blur(Rpx)"` on that temp canvas BEFORE drawing the layer content. For motion blur, use `"blur(Rpx)"` combined with a directional transform (rotate by `angle`, blur, rotate back). Draw the blurred result onto the main canvas at the layer position.

2. **Glow (`"glow"`):** Glow is visually equivalent to multiple zero-offset drop shadows stacked. On the temporary canvas, set `ctx.shadowColor` to the glow color, `ctx.shadowBlur` to the radius, `ctx.shadowOffsetX/Y` to 0, then draw the layer shape/text multiple times (3 passes gives a nice glow buildup — `Math.ceil(intensity * 3)` passes). For `inner: true`, clip to the layer bounds and use inner-shadow technique (draw the inverse). Composite the glow canvas onto the main canvas.

3. **Outline (`"outline"`):** On a temporary canvas, draw the layer shape path(s) with `ctx.strokeStyle` set to the outline color and `ctx.lineWidth` set to `width * 2` (because stroke is centered on the path). Do this BEFORE drawing the fill, so the outline appears behind the content. Then draw the filled content on top. Composite back.

4. **Color Adjust (`"color-adjust"`):** Build a CSS filter string from the effect fields: `brightness()`, `contrast()`, `saturate()`, `hue-rotate()` — note that the schema stores brightness/contrast/saturation as -100 to 100, but CSS filter expects multipliers (1.0 = normal, so `brightness: 50` means `brightness(1.5)`). Temperature and tint don't have direct CSS filter equivalents — implement them as hue-rotate + sepia combinations or skip them for now. Set `ctx.filter` BEFORE drawing the layer to a temp canvas.

5. **Noise (`"noise"`):** After rendering the layer to a temporary canvas, read the pixel data with `getImageData()`. For each pixel, add a random value: if `monochrome`, add the same random offset to R/G/B channels; if not monochrome, add different random offsets per channel. The offset magnitude = `(Math.random() - 0.5) * intensity * 255`. Write back with `putImageData()`. Composite onto main canvas.

6. **Inner Shadow (`"inner-shadow"`):** Similar to drop shadow but clipped inside the shape. Draw the layer shape as a clip path, then draw a large shadow-casting rectangle OUTSIDE the clip area — the shadow will fall inward. Use `ctx.shadowColor`, `ctx.shadowBlur`, `ctx.shadowOffsetX/Y`.

7. **Drop Shadow (`"drop-shadow"`):** Already implemented in `applyPreEffects()` — no changes needed here.

**Stacking:** Effects are applied in the order they appear in the layer's `effects` array. Each effect wraps the previous result. Use the temporary-canvas-per-effect approach to ensure correct stacking.

### UPGRADE 4: Font Readiness Detection for Canvas Rendering

**New file:** `src/lib/editor/font-loader.ts`

**Problem:** The Canvas2D renderer uses whatever font is currently available when `ctx.font = "..."` is set. If a Google Font hasn't finished loading, Canvas2D silently falls back to the browser's default serif/sans-serif. The user sees a "flash of wrong font" on first render.

**Required behavior:**

1. Export a function `ensureFontReady(family, weight?, style?)` that returns a `Promise<void>` resolving when the font is ready for Canvas2D rendering. The function should:
   - Skip system fonts (Inter, Arial, Helvetica, Georgia, sans-serif, serif, monospace) — they're always available
   - Inject a Google Fonts `<link>` stylesheet into `<head>` if not already present (matching the approach in `src/hooks/useGoogleFonts.ts` — dynamically build the URL from family + weight range)
   - Use `fontfaceobserver` to detect when the font is actually rasterizable: `new FontFaceObserver(family, { weight, style }).load(null, 10_000)` — 10 second timeout
   - Cache results in a module-level `Set<string>` so the same font is never re-checked
   - On failure, log a warning and mark as "done" (don't retry — fallback is fine)

2. Export a function `ensureDocumentFontsReady(doc: DesignDocumentV2)` that scans ALL text layers in the document, collects unique font+weight+style combos, and calls `ensureFontReady()` for each. Returns `Promise<void>` that resolves when ALL fonts are ready.

3. The workspace component should call `ensureDocumentFontsReady(doc)` before showing the canvas. Display a loading skeleton (template name, pulsing gray rectangles) until the promise resolves.

### UPGRADE 5: High-Fidelity SVG Border Rendering

**New file:** `src/lib/editor/svg-renderer.ts`

**Problem:** SVG border images embedded in PDF via Canvas2D are rasterized at only 2× scale. For an A4-landscape canvas (3508px wide), that's only ~150 DPI effective. Professional print requires 300+ DPI.

**Required behavior:**

1. Export a function `renderSvgToHighDpiPng(svgString, targetWidth, targetHeight, dpiScale?)` that renders an SVG string to a PNG blob at the specified DPI scale (default 4× for 300 DPI on A4).

2. **Client-side approach (primary):** Create a regular `<canvas>` element (NOT `OffscreenCanvas` — for Safari compatibility). Set its pixel dimensions to `targetWidth * dpiScale` × `targetHeight * dpiScale`. Create an `Image` element, set its `src` to a `blob:` URL created from the SVG string. On load, draw the image onto the canvas at the scaled dimensions. Export as PNG via `canvas.toBlob()`.

3. **Optional server-side API route** at `src/app/api/render-svg/route.ts` using `@resvg/resvg-wasm` for pixel-perfect rendering. This is a POST endpoint that accepts an SVG string and desired width, initializes the WASM module on first call, creates a `Resvg` instance with `fitTo: { mode: "width", value: desiredWidth }`, renders to PNG, and returns the binary. This route also accepts optional `fontBuffers` (base64-encoded TTF binaries) for SVG files that reference non-system fonts.

4. The PDF export pipeline should use the client-side renderer (or optionally the server route) to pre-render SVG border images at print DPI before embedding them.

### UPGRADE 6: Effects in PDF Export

**File to modify:** `src/lib/editor/pdf-renderer.ts`

**Problem:** PDF export silently drops all layer effects. There's no handling for any effect type in the PDF render path.

**Required behavior:**

1. Before rendering each layer to PDF, check whether it has any enabled effects (other than `drop-shadow`, which pdf-lib can approximate with native `drawRectangle` shadow options).

2. If a layer has complex effects (blur, glow, outline, noise, color-adjust, inner-shadow), render that entire layer — including all its effects — to a high-DPI temporary Canvas2D surface using the canvas renderer's effect pipeline (Upgrade 3 above). The DPI scale should be 4× for print quality.

3. Add padding around the temporary canvas (at least 50px × dpiScale on each side) to accommodate shadow/glow overflow that extends beyond the layer bounds.

4. Export the temporary canvas as PNG, embed in the PDF with `pdfDoc.embedPng()`, and draw at the layer's position (adjusted for the padding offset).

5. For layers WITHOUT complex effects, continue using the existing vector rendering path (text stays selectable, shapes stay vector). This is critical — don't rasterize everything; only rasterize layers that have effects the PDF format can't represent natively.

6. **Safari compatibility:** Same as Upgrade 2 — use `document.createElement("canvas")` for temporary surfaces, not `OffscreenCanvas`.

---

## 5. EDITORV2 SCHEMA REFERENCE (Exact Types)

The executing agent should read `src/lib/editor/schema.ts` directly for the full picture. Below are the critical types needed for the certificate adapter. These are EXACT field names and types from the codebase — not approximations.

### DesignDocumentV2

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Document ID |
| `version` | `2` (literal) | Always 2 |
| `name` | `string` | Document name |
| `toolId` | `string` | e.g., `"certificate-designer"` |
| `rootFrameId` | `string` | ID of the root `FrameLayerV2` |
| `layersById` | `Record<string, LayerV2>` | Flat map of ALL layers |
| `selection` | `{ ids: string[], primaryId: string \| null }` | Current selection |
| `resources` | `ResourceRef[]` | External images/fonts |
| `meta` | `{ createdAt, updatedAt, dpi, units, toolConfig? }` | Metadata |

### LayerV2 Base Fields (shared by all layer types)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Layer ID |
| `type` | `"text" \| "shape" \| "image" \| "frame" \| "path" \| "icon" \| "boolean-group" \| "group"` | Discriminator |
| `name` | `string` | Display name in layers panel |
| `tags` | `string[]` | Semantic tags for AI targeting |
| `parentId` | `string \| null` | Parent layer (root frame for top-level) |
| `transform` | `Transform` | Position, size, rotation, skew, flip, pivot |
| `opacity` | `number` (0–1) | Layer opacity |
| `blendMode` | `BlendMode` | One of 16 blend modes |
| `visible` | `boolean` | Visibility |
| `locked` | `boolean` | Lock for editing |
| `effects` | `Effect[]` | Stackable effects array |
| `constraints` | `Constraints` | Resize constraints |

### Transform

`{ position: { x, y }, size: { x: width, y: height }, rotation, skewX, skewY, flipX?, flipY?, pivot: { x: 0.5, y: 0.5 } }`

### TextLayerV2

The text layer has: `text` (raw string), `defaultStyle` (TextStyle object), `runs` (array of `{ start, end, style: Partial<TextStyle> }` for rich text), `paragraphs` (array of `{ align, indent, spaceBefore, spaceAfter }`), `overflow` ("clip" | "ellipsis" | "expand"), `verticalAlign` ("top" | "middle" | "bottom").

**TextStyle fields:** `fontFamily` (string), `fontSize` (number), `fontWeight` (numeric: 400, 700, etc.), `italic` (boolean), `underline` (boolean), `strikethrough` (boolean), `letterSpacing` (number), `lineHeight` (number), `fill` (Paint), `stroke?` (StrokeSpec), `uppercase` (boolean).

### ShapeLayerV2

`shapeType` ("rectangle" | "ellipse" | "triangle" | "polygon" | "star" | "line"), `fills` (Paint[]), `strokes` (StrokeSpec[]), `cornerRadii` ([topLeft, topRight, bottomRight, bottomLeft]), `sides` (for polygon/star), `innerRadiusRatio` (for star, 0–1).

### ImageLayerV2

`imageRef` (URL or resource ID), `fit` ("cover" | "contain" | "stretch" | "fill"), `focalPoint` ({ x, y } normalized 0–1), `cropRect` ({ x, y, w, h } normalized 0–1), `imageFilters` ({ brightness, contrast, saturation, temperature, blur, grayscale, sepia }), `fills` (Paint[] overlays), `strokes` (StrokeSpec[]), `cornerRadius` (single number).

### Paint Types (Discriminator: `kind`, NOT `type`)

| Variant | `kind` | Key Fields |
|---------|--------|------------|
| `SolidPaint` | `"solid"` | `color: RGBA` where RGBA is `{ r, g, b, a }` (r/g/b: 0–255, a: 0–1) |
| `GradientPaint` | `"gradient"` | `gradientType` ("linear" | "radial" | "angular" | "diamond"), `stops: GradientStop[]` (each `{ offset: number, color: RGBA }`), `transform: Matrix2D`, `spread` |
| `PatternPaint` | `"pattern"` | `patternType` (12 types: "dots", "lines", "diagonal-lines", "crosshatch", "waves", "triangles", "hexagons", "circles", "chevrons", "diamond", "noise", "grid"), `color: RGBA`, `scale`, `rotation`, `opacity`, `spacing` |
| `ImagePaint` | `"image"` | `imageRef`, `fit`, `opacity`, `transform` |

### StrokeSpec

`{ paint: Paint, width: number, align: "center" | "inside" | "outside", dash: number[], cap, join, miterLimit }`

### BlendMode (16 values)

`"normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity"`

---

## 6. WHAT TO DELETE (Old Certificate System)

Delete these 10 files (the entire old form-based certificate system):

| # | File | Lines | Reason |
|---|------|-------|--------|
| 1 | `src/stores/certificate-editor.ts` | ~412 | Form-based store with `CertificateFormData` — replaced by canvas store |
| 2 | `src/components/workspaces/certificate-designer/CertificateDesignerWorkspace.tsx` | ~349 | Form-based workspace with tabbed editor — replaced by canvas workspace |
| 3 | `src/components/workspaces/certificate-designer/CertificateRenderer.tsx` | ~1085 | HTML/CSS renderer with Canvas2D border decorations — replaced by EditorV2 |
| 4 | `src/components/workspaces/certificate-designer/CertificateLayersPanel.tsx` | ~430 | Fake layers panel (display-only, non-interactive) — EditorV2 has real ones |
| 5 | `src/components/workspaces/certificate-designer/tabs/CertificateContentTab.tsx` | ~200 | Form tab — no more tabs |
| 6 | `src/components/workspaces/certificate-designer/tabs/CertificateDetailsTab.tsx` | ~168 | Form tab |
| 7 | `src/components/workspaces/certificate-designer/tabs/CertificateStyleTab.tsx` | ~170 | Form tab |
| 8 | `src/components/workspaces/certificate-designer/tabs/CertificateFormatTab.tsx` | ~108 | Form tab |
| 9 | `src/lib/chiko/manifests/certificate.ts` | ~470 | Form-field-based Chiko manifest — replaced by canvas-aware manifest |
| 10 | `src/lib/store-adapters.ts` → `getCertificateAdapter()` | ~30 | Only the certificate function — replaced with canvas-based version |

**Also delete:** The entire `tabs/` directory: `src/components/workspaces/certificate-designer/tabs/`

**Total: ~3,422 lines of obsolete code.**

**DO NOT delete:** The SVG files in `/certificates/` at the project root — they get moved (see Section 7).

---

## 7. SVG ASSET INVENTORY AND MIGRATION

The project root `/certificates/` directory contains 8 SVG files and 8 matching PNG files. These are the decorative border/frame assets for certificate templates. They must be moved to `public/templates/certificates/` so Next.js can serve them as static assets.

### SVG Files (source → destination)

| # | Current filename | Suggested renamed filename | Assigned to template |
|---|-----------------|---------------------------|---------------------|
| 1 | `1166971_4650.svg` | `classic-gold-border.svg` | `classic-gold` |
| 2 | `2477188_343489-PAOJU9-140.svg` | `classic-blue-border.svg` | `classic-blue` |
| 3 | `49574882_8945599.svg` | `teal-modern-border.svg` | `teal-modern` |
| 4 | `vecteezy_achievement-award-certificate-design-template_5261867.svg` | `burgundy-ornate-border.svg` | `burgundy-ornate` |
| 5 | `vecteezy_certificate-certificate-of-appreciation-template_14929968.svg` | `antique-parchment-border.svg` | `antique-parchment` |
| 6 | `vecteezy_classic-certificate-template_23018900.svg` | `silver-minimal-border.svg` | `silver-minimal` |
| 7 | `vecteezy_classic-style-certificate-template_22284241.svg` | `botanical-modern-border.svg` | `botanical-modern` |
| 8 | `vecteezy_creative-certificate-template_21835851.svg` | `dark-prestige-border.svg` | `dark-prestige` |

### Migration Steps

1. Create the directory `public/templates/certificates/` and `public/templates/certificates/thumbs/`
2. Copy each SVG from `/certificates/` to `public/templates/certificates/` with the renamed filename
3. The matching PNGs in `/certificates/png/` can be used as thumbnail bases — resize to 600×424 and save to `public/templates/certificates/thumbs/{template-id}.png`
4. After confirming the new paths work, the original `/certificates/` directory can be removed

### SVG Usage

Each template definition (Section 9) references its border SVG via the `svgBorderPath` field, pointing to `/templates/certificates/{filename}.svg`. The adapter (Section 11) creates an `ImageLayerV2` with this path as the `imageRef`, positioned at `(0, 0)` and sized to the full canvas dimensions `(W, H)`. This layer sits behind all text content and is tagged `["border", "frame", "decorative"]`.

---

## 8. WHAT TO CREATE (New Certificate System)

### Certificate-Specific Files (10 files)

| # | File | Purpose | Spec Section |
|---|------|---------|-------------|
| 1 | `src/data/certificate-templates.ts` | Template registry — 8 templates with metadata, colors, fonts, layout hints | Section 9 |
| 2 | `src/lib/editor/certificate-adapter.ts` | `CertificateConfig` → `DesignDocumentV2` conversion (like `business-card-adapter.ts`) | Section 11 |
| 3 | `src/lib/editor/certificate-design-generator.ts` | AI prompt builder for Chiko/Claude to generate certificate DesignDocumentV2 JSON | Section 16 |
| 4 | `src/stores/certificate-editor.ts` | New Zustand store — certificate metadata + EditorV2 bridge | Section 13 |
| 5 | `src/components/workspaces/certificate-designer/CertificateDesignerWorkspace.tsx` | Main workspace — template picker → canvas editor | Section 14 |
| 6 | `src/components/workspaces/certificate-designer/CertificateEditor.tsx` | Canvas editor panel with AI revision bar (like `StepEditor.tsx`) | Section 14 |
| 7 | `src/components/workspaces/certificate-designer/CertificateQuickEdit.tsx` | Left panel: certificate-specific field quick-edit | Section 14 |
| 8 | `src/components/workspaces/certificate-designer/CertificateTemplatePicker.tsx` | Template gallery grid | Section 14 |
| 9 | `src/lib/chiko/manifests/certificate.ts` | Canvas-aware Chiko manifest with layer operations | Section 15 |
| 10 | `src/lib/store-adapters.ts` → `getCertificateAdapter()` | Updated project system adapter | Section 17 |

### Infrastructure Files (3 new + 2 modified)

| # | File | Type | Purpose | Spec Section |
|---|------|------|---------|-------------|
| 11 | `src/lib/editor/font-loader.ts` | **NEW** | `ensureFontReady()` + `ensureDocumentFontsReady()` using FontFaceObserver | Section 4, Upgrade 4 |
| 12 | `src/lib/editor/svg-renderer.ts` | **NEW** | `renderSvgToHighDpiPng()` for SVG border rendering at print DPI | Section 4, Upgrade 5 |
| 13 | `src/app/api/fonts/route.ts` | **NEW** | Server-side Google Font TTF fetching (avoids CORS issue) | Section 4, Upgrade 1 |
| 14 | `src/lib/editor/pdf-renderer.ts` | **MODIFY** | Add custom font embedding, gradient raster fallback, effects raster fallback | Section 4, Upgrades 1–2, 6 |
| 15 | `src/lib/editor/renderer.ts` | **MODIFY** | Implement `applyPostEffects()` (glow, outline, noise, color-adjust, blur) | Section 4, Upgrade 3 |

### Optional Infrastructure Files

| # | File | Type | Purpose | Spec Section |
|---|------|------|---------|-------------|
| 16 | `src/app/api/render-svg/route.ts` | **NEW** (optional) | Server-side SVG rendering via `@resvg/resvg-wasm` | Section 4, Upgrade 5 |

### Asset Files

| # | Action | Description |
|---|--------|-------------|
| 17 | **MOVE** 8 SVGs | From `/certificates/` root to `public/templates/certificates/` (see Section 7 for mapping) |
| 18 | **CREATE** thumbnails | 600×424 PNG previews at `public/templates/certificates/thumbs/{id}.png` |

---

## 9. CERTIFICATE TEMPLATE REGISTRY (8 Templates)

**File:** `src/data/certificate-templates.ts`

### Template Interface

Each template has: `id` (string), `name` (string), `category` ("formal" | "modern" | "artistic" | "minimal"), `description` (string), `thumbnail` (path to 600×424 PNG), `width` (always 3508), `height` (always 2480 for landscape, 2480×3508 for portrait — all templates are A4 landscape at 300 DPI), `colors` (object with background, primary, secondary, text, accent), `fontPairing` (object with heading, body, accent google font names + googleImport string), `layout` (object with borderStyle, headerPosition, sealPosition, signatoryPosition, orientation), `svgBorderPath` (path to SVG in public/templates/certificates/), `tags` (string array).

### Certificate Types

The adapter supports these certificate types, each with a default title:

`achievement` → "Certificate of Achievement", `completion` → "Certificate of Completion", `appreciation` → "Certificate of Appreciation", `participation` → "Certificate of Participation", `training` → "Certificate of Training", `recognition` → "Certificate of Recognition", `award` → "Certificate of Award", `excellence` → "Certificate of Excellence", `honorary` → "Honorary Certificate", `membership` → "Certificate of Membership"

### Template 1: `classic-gold`

- **Name:** Classic Gold
- **Category:** formal
- **Description:** Formal, gold and parchment certificate with ornate decorative borders. Perfect for traditional institutions and achievements.
- **Colors:** background `#faf6e8` (warm parchment), primary `#b8860b` (dark goldenrod), secondary `#d4af37` (gold), text `#2c1810` (dark sepia), accent `#8b6914` (bronzed gold)
- **Fonts:** heading `Playfair Display` (weights 400, 600, 700), body `Lato` (weights 300, 400, 700), accent `Great Vibes` (weight 400, script for recipient name)
- **Layout:** borderStyle `ornate`, headerPosition `top-center`, sealPosition `bottom-right`, signatoryPosition `bottom-spread`, orientation `landscape`
- **SVG Border:** `/templates/certificates/classic-gold-border.svg`
- **Tags:** formal, classic, gold, traditional, achievement, parchment

### Template 2: `classic-blue`

- **Name:** Classic Blue
- **Category:** formal
- **Description:** Stately navy and silver certificate. Ideal for academic awards, diplomas, and corporate recognition.
- **Colors:** background `#f0f4f8` (cool white), primary `#35517D` (navy), secondary `#4a6fa5` (steel blue), text `#1a2744` (dark navy), accent `#8faabe` (silver blue)
- **Fonts:** heading `Playfair Display` (weights 400, 600, 700), body `Lato` (weights 300, 400, 700), accent `Dancing Script` (weight 400–700, elegant cursive)
- **Layout:** borderStyle `ornate`, headerPosition `top-center`, sealPosition `bottom-right`, signatoryPosition `bottom-spread`, orientation `landscape`
- **SVG Border:** `/templates/certificates/classic-blue-border.svg`
- **Tags:** formal, classic, blue, navy, academic, diploma

### Template 3: `burgundy-ornate`

- **Name:** Burgundy Ornate
- **Category:** formal
- **Description:** Rich burgundy and gold with elaborate ornate borders. Ceremonial and distinguished for awards of excellence.
- **Colors:** background `#f9f3f0` (rose white), primary `#4C0C1E` (deep burgundy), secondary `#7a1f3a` (wine), text `#2a0a14` (darkest burgundy), accent `#c4a35a` (antique gold)
- **Fonts:** heading `Crimson Text` (weights 400, 600, 700), body `Source Sans 3` (weights 300, 400, 600), accent `Parisienne` (weight 400, ornate script)
- **Layout:** borderStyle `ornate`, headerPosition `top-center`, sealPosition `bottom-right`, signatoryPosition `bottom-spread`, orientation `landscape`
- **SVG Border:** `/templates/certificates/burgundy-ornate-border.svg`
- **Tags:** formal, burgundy, ornate, ceremonial, wine, elegant

### Template 4: `teal-modern`

- **Name:** Teal Modern
- **Category:** modern
- **Description:** Clean, contemporary design with teal accents and simple geometric borders. Great for tech companies, workshops, and online courses.
- **Colors:** background `#f0fafa` (light teal wash), primary `#1a7f8f` (deep teal), secondary `#20b2aa` (light sea green), text `#1a1a2a` (near black), accent `#14b8a6` (bright teal)
- **Fonts:** heading `Poppins` (weights 400, 600, 700), body `Inter` (weights 300, 400, 600), accent `Caveat` (weight 400–700, casual handwriting)
- **Layout:** borderStyle `simple`, headerPosition `top-center`, sealPosition `bottom-center`, signatoryPosition `bottom-spread`, orientation `landscape`
- **SVG Border:** `/templates/certificates/teal-modern-border.svg`
- **Tags:** modern, teal, clean, tech, minimalist, course

### Template 5: `silver-minimal`

- **Name:** Silver Minimal
- **Category:** minimal
- **Description:** Ultra-clean design with gray tones and understated double-line border. Professional and uncluttered for corporate training and certifications.
- **Colors:** background `#ffffff` (pure white), primary `#4a4a4a` (charcoal), secondary `#c0c0c0` (silver), text `#1a1a1a` (near black), accent `#808080` (medium gray)
- **Fonts:** heading `Cormorant Garamond` (weights 400, 600, 700), body `Montserrat` (weights 300, 400, 600), accent `Satisfy` (weight 400, flowing script)
- **Layout:** borderStyle `double-line`, headerPosition `top-center`, sealPosition `bottom-right`, signatoryPosition `bottom-spread`, orientation `landscape`
- **SVG Border:** `/templates/certificates/silver-minimal-border.svg`
- **Tags:** minimal, silver, clean, corporate, professional, simple

### Template 6: `antique-parchment`

- **Name:** Antique Parchment
- **Category:** formal
- **Description:** Vintage-style certificate that evokes aged parchment with warm sepia tones and classic ornate borders. Perfect for honors, heritage awards, and historical societies.
- **Colors:** background `#f5eed7` (aged parchment), primary `#3F3F41` (charcoal gray), secondary `#8b7355` (warm brown), text `#2c2418` (dark sepia), accent `#a08c5a` (antique brass)
- **Fonts:** heading `Cormorant Garamond` (weights 400, 600, 700), body `Montserrat` (weights 300, 400, 600), accent `Pinyon Script` (weight 400, calligraphic)
- **Layout:** borderStyle `ornate`, headerPosition `top-center`, sealPosition `bottom-right`, signatoryPosition `bottom-spread`, orientation `landscape`
- **SVG Border:** `/templates/certificates/antique-parchment-border.svg`
- **Tags:** formal, antique, parchment, vintage, heritage, warm

### Template 7: `botanical-modern`

- **Name:** Botanical Modern
- **Category:** artistic
- **Description:** Elegant design with botanical corner flourishes on a clean background. Navy and sage green create a calming, artistic feel. Ideal for creative awards, environmental programs, and wellness certifications.
- **Colors:** background `#f8faf5` (light sage wash), primary `#1B2650` (deep navy), secondary `#6b8e5b` (sage green), text `#1a2040` (dark navy), accent `#8cb07a` (soft green)
- **Fonts:** heading `Cormorant Garamond` (weights 400, 600, 700), body `Montserrat` (weights 300, 400, 600), accent `Sacramento` (weight 400, relaxed script)
- **Layout:** borderStyle `corner-only`, headerPosition `top-center`, sealPosition `bottom-center`, signatoryPosition `bottom-spread`, orientation `landscape`
- **SVG Border:** `/templates/certificates/botanical-modern-border.svg`
- **Tags:** artistic, botanical, green, navy, nature, creative

### Template 8: `dark-prestige`

- **Name:** Dark Prestige
- **Category:** modern
- **Description:** Bold, dark-background certificate with gold accents. The inverted color scheme creates a premium, exclusive feel. Perfect for VIP awards, executive recognitions, and luxury events.
- **Colors:** background `#1a1a2e` (deep dark blue-black), primary `#d4af37` (rich gold), secondary `#f0d060` (bright gold), text `#e8e0d0` (warm cream on dark), accent `#b8860b` (dark goldenrod)
- **Fonts:** heading `Playfair Display` (weights 400, 600, 700), body `Inter` (weights 300, 400, 600), accent `Alex Brush` (weight 400, brush script)
- **Layout:** borderStyle `simple`, headerPosition `top-center`, sealPosition `bottom-right`, signatoryPosition `bottom-spread`, orientation `landscape`
- **SVG Border:** `/templates/certificates/dark-prestige-border.svg`
- **Tags:** modern, dark, gold, prestige, luxury, premium, vip

### Helper Function

Export a `getCertificateTemplate(id)` function that looks up a template by ID, returning the first template as default if not found.

---

## 10. CERTIFICATECONFIG TYPE DEFINITION

The `CertificateConfig` type represents the user's input data — what goes ON the certificate. It's separate from the template (which controls HOW it looks). The adapter (Section 11) combines a `CertificateConfig` + a `CertificateTemplate` to produce a `DesignDocumentV2`.

### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `certificateType` | `CertificateType` | `"achievement"` | Determines default title text |
| `title` | `string` | `"Certificate of Achievement"` | Main title (overrides type default when user sets it) |
| `subtitle` | `string` | `"This is proudly presented to"` | Subtitle line above recipient |
| `recipientName` | `string` | `""` | Recipient's full name (largest text on cert) |
| `description` | `string` | `""` | Body text — what the certificate is for |
| `additionalText` | `string` | `""` | Extra body text below description |
| `organizationName` | `string` | `""` | Issuing organization name |
| `organizationSubtitle` | `string` | `""` | Sub-org or department |
| `eventName` | `string` | `""` | Event or program name |
| `courseName` | `string` | `""` | Course name (for completion certs) |
| `dateIssued` | `string` | today's date | Date string displayed on cert |
| `validUntil` | `string` | `""` | Expiry date (optional) |
| `referenceNumber` | `string` | `""` | Certificate reference/serial number |
| `signatories` | `Array<{ id, name, title, organization }>` | `[{ name: "", title: "", organization: "" }]` | Up to 3 signature blocks |
| `showSeal` | `boolean` | `true` | Whether to show the seal graphic |
| `sealText` | `string` | `"CERTIFIED"` | Text inside the seal |
| `sealStyle` | `"gold" \| "silver" \| "embossed" \| "stamp" \| "none"` | `"gold"` | Seal visual style |
| `logoUrl` | `string \| null` | `null` | URL to organization logo (user upload) |
| `templateId` | `string` | `"classic-gold"` | Which template to use |
| `fontScale` | `number` | `1.0` | Global font size multiplier (0.8–1.3) |

---

## 11. TEMPLATE → DesignDocumentV2 ADAPTER

**File:** `src/lib/editor/certificate-adapter.ts`

This is the most important file — it converts a `CertificateConfig` + `CertificateTemplate` into a fully-positioned `DesignDocumentV2` with all layers. It follows the exact pattern of `src/lib/editor/business-card-adapter.ts` (2,400 lines, production code).

### Semantic Tags (CRITICAL — Required for AI Targeting)

Every layer MUST have semantic tags so Chiko AI can find and modify specific elements. These exact tag strings are used in both the Chiko manifest and the AI revision pipeline:

| Layer | Tags |
|-------|------|
| Background | `["background", "bg"]` |
| Border/Frame | `["border", "frame", "decorative"]` |
| Title | `["title", "heading", "certificate-title"]` |
| Subtitle | `["subtitle", "subheading", "presented-to"]` |
| Recipient Name | `["recipient-name", "primary-text", "name"]` |
| Description | `["description", "body-text"]` |
| Additional Text | `["additional-text", "body-text"]` |
| Organization | `["organization", "org-name"]` |
| Date | `["date", "meta", "date-issued"]` |
| Reference Number | `["reference", "meta", "ref-number"]` |
| Signatory N | `["signatory-N", "signatory", "signature"]` (where N is index) |
| Signature Line | `["signature-line", "signatory", "decorative"]` |
| Seal Shape | `["seal", "seal-shape", "decorative"]` |
| Seal Text | `["seal", "seal-text"]` |
| Logo | `["logo", "branding", "user-uploaded"]` |
| Decorative Element | `["decorative", "ornament", "accent"]` |

### Main Conversion Function

`certificateConfigToDocument(cfg: CertificateConfig, template: CertificateTemplate) → DesignDocumentV2`

This function creates a flat layer map with 15–25 layers (depending on optional fields). It returns a valid `DesignDocumentV2` with `version: 2`, a root frame layer, and all content layers as children.

### Canvas Dimensions and Safe Area

All 8 templates use **3508 × 2480 pixels** (A4 landscape at 300 DPI). The safe margin is **150px** on all sides (approximately 4.3% of width). Content must stay within the safe area: x from 150 to 3358, y from 150 to 2330.

### Layer-by-Layer Positioning (Vertical Stack, Centered)

The default layout follows the old renderer's vertical centering pattern, scaled up from CSS pixels (1123×794) to print pixels (3508×2480). The scale factor is approximately 3.12× (3508/1123). All positions are calculated as percentages of canvas size for consistency.

**Font scaling formula** (from business card adapter pattern): `fontScale(W) = W / 1050`. For a 3508-wide canvas, this gives a base multiplier of ~3.34. Font sizes below are already at the final print pixel values.

**Layer centering formula:** `x = Math.round((W - layerW) / 2)` — same as business card adapter.

**Layer stacking (top to bottom):**

1. **Root Frame** (FrameLayerV2): position `(0, 0)`, size `(W, H)` (3508 × 2480). This is the document root; all other layers are children of this frame.

2. **Background** (ShapeLayerV2 rectangle): position `(0, 0)`, size `(W, H)`. Fill is a `SolidPaint` with the template's `colors.background`. Tagged `["background", "bg"]`.

3. **SVG Border** (ImageLayerV2): position `(0, 0)`, size `(W, H)`. `imageRef` is the template's `svgBorderPath` (e.g., `/templates/certificates/classic-gold-border.svg`). `fit: "stretch"`. Tagged `["border", "frame", "decorative"]`. Only created if the template has a `svgBorderPath`.

4. **Organization Name** (TextLayerV2): position y ≈ 8% from top (y: ~200), centered horizontally. Width: 60% of W (~2105). Font: template body font, weight 600, size 40–48px. Fill: template `colors.primary`. Uppercase, letter-spacing 3–4. Tagged `["organization", "org-name"]`. Only created if `cfg.organizationName` is non-empty.

5. **Title** (TextLayerV2 — e.g., "CERTIFICATE OF ACHIEVEMENT"): position y ≈ 15–18% from top (y: ~400). Centered horizontally. Width: 80% of W (~2806). Font: template heading font, weight 700, size 90–112px (approximately 32–36px old × 3.12 scale). Fill: template `colors.primary`. Uppercase, letter-spacing 5–8. Tagged `["title", "heading", "certificate-title"]`.

6. **Decorative Divider** (ShapeLayerV2 line or rectangle): position y ≈ below title + 30px gap. Width: 20–30% of W (~700–1050), height: 3–4px. Centered horizontally. Fill: template `colors.secondary` or `colors.accent`. Tagged `["decorative", "ornament", "divider"]`. Optional — only for templates with `borderStyle: "ornate"` or `"double-line"`.

7. **Subtitle** (TextLayerV2 — e.g., "This is proudly presented to"): position y ≈ 30% from top (y: ~740). Centered. Width: 50% of W (~1754). Font: template body font, weight 300 (light), size 36–42px, italic. Fill: template `colors.text` at 70% opacity. Tagged `["subtitle", "subheading", "presented-to"]`.

8. **Recipient Name** (TextLayerV2 — the biggest, most prominent text): position y ≈ 36–38% from top (y: ~900). Centered. Width: 70% of W (~2456). Font: template **accent** font (the script/decorative font), weight 400, size 62–80px (approximately 32px old × 2.5). Fill: template `colors.primary`. Tagged `["recipient-name", "primary-text", "name"]`. This is the visual focal point.

9. **Recipient Underline** (ShapeLayerV2 line): position y ≈ below recipient + 10px. Width: min(50% of W, 1050), height: 2–3px. Centered. Fill: template `colors.secondary`. Tagged `["decorative", "underline"]`.

10. **Description** (TextLayerV2): position y ≈ 46–48% from top (y: ~1150). Centered, text-align center. Width: 65% of W (~2280). Font: template body font, weight 400, size 30–36px, line-height 1.5. Fill: template `colors.text`. Tagged `["description", "body-text"]`.

11. **Additional Text** (TextLayerV2): position y ≈ below description + 20px gap. Same styling as description but may be smaller (26–30px). Tagged `["additional-text", "body-text"]`. Only created if `cfg.additionalText` is non-empty.

12. **Date Line** (TextLayerV2): position y ≈ 62–66% from top (y: ~1600). Centered. Width: 40% of W. Font: body font, weight 400, size 24–28px. Fill: template `colors.text`. Format: "Date: {dateIssued}". Tagged `["date", "meta", "date-issued"]`.

13. **Reference Number** (TextLayerV2): position y ≈ below date + 10px. Same width/font as date but smaller (20–22px), lighter opacity (60%). Tagged `["reference", "meta", "ref-number"]`. Only created if `cfg.referenceNumber` is non-empty.

14. **Signatory Block(s)** (3-layer group per signatory: line + name + title): position y ≈ 75–82% from top (y: ~1900–2050). For `signatoryPosition: "bottom-spread"` with N signatories, divide the content width evenly: each signatory block is centered in its Nth column. For 1 signatory, center it. For 2, place at 33% and 66% of W. For 3, place at 25%, 50%, 75% of W.
    - **Signature line** (ShapeLayerV2): Width ~350px, height 2px. Fill: template `colors.text` at 50% opacity. Tagged `["signature-line", "signatory", "decorative"]`.
    - **Signer name** (TextLayerV2): Below line + 15px. Font: body, weight 600, size 22–26px. Tagged `["signatory-N", "signatory", "name"]`.
    - **Signer title** (TextLayerV2): Below name + 5px. Font: body, weight 400, size 18–20px, 70% opacity. Tagged `["signatory-N", "signatory", "title"]`.
    - **Signer org** (TextLayerV2): Below title + 3px. Font: body, weight 400, size 16–18px, 50% opacity. Tagged `["signatory-N", "signatory", "organization"]`. Only if the signer's org differs from main org.

15. **Seal** (see Section 12 for full spec): position depends on template's `sealPosition` — `"bottom-right"` places it at approximately x: W - 150 - sealSize, y: H - 150 - sealSize. `"bottom-center"` places it centered horizontally at y: H - 200 - sealSize. Seal is 200–280px diameter. Created only if `cfg.showSeal` is true.

### Optional LAYOUT_MAP for Per-Template Custom Layouts

Some templates may need unique positioning that differs from the default stack. The adapter can have a `LAYOUT_MAP` (same pattern as business card adapter) — a record mapping template IDs to custom layout functions. If a template ID exists in the map, use that function; otherwise use the default centering layout described above. Initially, the default layout works for all 8 templates.

### Sync Functions

The adapter also exports:
- `syncTextToCertificateDoc(doc, cfg)` — updates tagged text layers with new content values, preserving their positions and styles. Finds layers by tag, replaces their text content only.
- `syncColorsToCertificateDoc(doc, colors)` — updates paint fills/strokes across all layers to match new colors. Background fill, text fills, shape fills, etc.
- `regenerateCertificateFromTemplate(cfg, template)` — complete regeneration when user switches template. Preserves the text content from cfg, applies entirely new layout from the new template.

### Async Wrapper (Font Loading)

The workspace should call an async version `certificateConfigToDocumentAsync(cfg, template)` that:
1. Creates the document synchronously via the adapter
2. Calls `ensureDocumentFontsReady(doc)` (from font-loader.ts, Section 4 Upgrade 4)
3. Returns the document only after all fonts are ready for Canvas2D rendering

---

## 12. SEAL RENDERING SPECIFICATION

The seal is a circular badge element placed on the certificate. It consists of concentric shapes and centered text — NOT circular/curved text (the existing old renderer uses centered text only, and this spec maintains that approach).

### Visual Reference (from old CertificateRenderer.tsx)

The old renderer creates seals using CSS border-radius circles with 3 concentric rings and centered text. This spec reproduces the same visual using EditorV2 layers (ShapeLayerV2 ellipses + TextLayerV2).

### Seal Sizes

| Context | Size |
|---------|------|
| A4 landscape (3508×2480) | 280px diameter (8% of W) |
| A4 portrait if ever supported | 240px diameter |
| Minimum usable size | 160px |

### Seal Anatomy (5 layers, from back to front)

1. **Outer Ring** (ShapeLayerV2, type `"ellipse"`): Full seal diameter (280×280). Fill depends on seal style (see below). Tagged `["seal", "seal-shape", "seal-outer"]`.

2. **Middle Ring** (ShapeLayerV2, type `"ellipse"`): Inset by 15px on each side (250×250), centered within the outer ring. Fill: slightly different shade/gradient to create a ring effect. Or use a stroke on the outer ring instead of a separate layer. Tagged `["seal", "seal-shape", "seal-middle"]`.

3. **Inner Circle** (ShapeLayerV2, type `"ellipse"`): Inset by 25px from outer (230×230), centered. Fill: primary or matching gradient. Tagged `["seal", "seal-shape", "seal-inner"]`.

4. **Seal Text** (TextLayerV2): Centered within the inner circle. Text is the `cfg.sealText` value (default "CERTIFIED"). Font: template heading font, weight 700, size calculated as `max(20, sealDiameter × 0.12)` (approximately 34px for 280px seal). Uppercase, letter-spacing `0.15em`. Fill: contrasting color (white on gold, dark on silver). Text align center, vertical align middle. Tagged `["seal", "seal-text"]`.

5. **Optional Star/Decorative** (ShapeLayerV2, type `"star"` with 5 points or similar): Small (40–50px), positioned at the top of the seal, centered horizontally. Only for certain seal styles. Tagged `["seal", "seal-decoration", "decorative"]`.

### Seal Color Styles

**Gold** (`sealStyle: "gold"`):
- Outer ring fill: `GradientPaint` with stops — `#d4a843` at 0%, `#b8860b` at 50%, `#d4a843` at 100% (radial gradient for a metallic shine)
- Inner circle fill: `SolidPaint` `#b8860b` (dark gold)
- Text fill: `SolidPaint` white `{ r: 255, g: 255, b: 255, a: 1 }`

**Silver** (`sealStyle: "silver"`):
- Outer ring fill: `GradientPaint` with stops — `#c0c0c0` at 0%, `#808080` at 50%, `#c0c0c0` at 100%
- Inner circle fill: `SolidPaint` `#808080` (medium gray)
- Text fill: `SolidPaint` white

**Embossed** (`sealStyle: "embossed"`):
- Outer ring fill: `SolidPaint` using template's `colors.accent` at 15% opacity (a: 0.15)
- Inner circle fill: `SolidPaint` using template's `colors.accent` at 10% opacity
- Text fill: template's `colors.accent` at full opacity
- Add a subtle `DropShadowEffect` (offsetX: 1, offsetY: 1, blur: 2, color: black at 20% opacity) to the seal layers for the embossed look

**Stamp** (`sealStyle: "stamp"`):
- Outer ring fill: transparent background. Stroke: `#c0392b` (red) with width 4, dash `[6, 3]` for a dashed circle
- Middle ring: another dashed stroke ring inset, `#c0392b`, width 2
- Inner: no fill, just the text
- Text fill: `SolidPaint` `#c0392b` (red)
- Overall slightly rotated (layer rotation: -5 to -15 degrees) to look hand-stamped

### Seal Positioning

Based on template's `sealPosition`:
- `"bottom-right"`: x = W - safeMargin - sealDiameter - 50 (extra padding from border), y = H - safeMargin - sealDiameter - 50
- `"bottom-center"`: x = (W - sealDiameter) / 2, y = H - safeMargin - sealDiameter - 30
- `"none"`: don't create seal layers

---

## 13. CERTIFICATE STORE (Zustand)

**File:** `src/stores/certificate-editor.ts`

Same two-store architecture as Business Card (wizard store + shared editor store via `src/stores/editor.ts`).

### State Shape

The store holds **metadata** (all the certificate fields from CertificateConfig), a **document snapshot** (the `DesignDocumentV2` for syncing with the editor store), the **selected template ID**, **generation state** (isGenerating, error), and a **fontsReady** boolean that gates canvas rendering.

### Actions

| Action | Description |
|--------|-------------|
| `setMeta(patch)` | Partial update to any CertificateConfig field |
| `setTemplateId(id)` | Switch template, triggers regeneration |
| `setDocumentSnapshot(doc)` | Store the DesignDocumentV2 for persistence |
| `setCertificateType(type)` | Change cert type, auto-updates title to default |
| `updateSignatory(id, patch)` | Update a single signatory's name/title/org |
| `addSignatory()` | Add new signatory (max 3), returns new ID |
| `removeSignatory(id)` | Remove signatory by ID |
| `setGenerating(bool)` | Toggle AI generation loading state |
| `setGenerationError(err)` | Set or clear generation error message |
| `setFontsReady(bool)` | Font loading complete flag |
| `resetToDefaults(type?)` | Reset all fields to defaults for given cert type |

### Persistence

Use Zustand `persist` middleware with `sessionStorage` (NOT `localStorage` — documents are too large). Persist only metadata and selectedTemplateId. Do NOT persist the documentSnapshot — it's recreated from the template on each session.

Store name: `"dmsuite-certificate-v2"`, version 1.

### Bidirectional Sync (Business Card Pattern)

The certificate editor component maintains sync between the certificate store (metadata) and the shared editor store (DesignDocumentV2). This uses the same pattern as `StepEditor.tsx` in the business card:

- A `isSyncingRef` (boolean ref) prevents circular loops
- **Certificate store → Editor store:** When `documentSnapshot` changes (and it's a new reference), set `isSyncingRef = true`, push the snapshot to the shared editor store via `setDoc()`, then asynchronously clear the flag via `queueMicrotask`
- **Editor store → Certificate store:** When the shared editor's `doc` changes (and we're NOT in a sync cycle), push it back to `setDocumentSnapshot()` and extract tag-based metadata from the doc back to the certificate store via a helper `extractMetadataFromDoc(doc)` that reads tagged layers
- This ensures form edits appear on canvas AND canvas edits appear in the form — without infinite loops

---

## 14. WORKSPACE COMPONENT

**File:** `src/components/workspaces/certificate-designer/CertificateDesignerWorkspace.tsx`

### Flow (Simpler Than Business Card — No Multi-Step Wizard)

The workspace has 4 states:

**State 1 — Template Picker:** A responsive grid of template thumbnail cards plus an "Ask Chiko" button and a "Start Blank" option. Each card shows the template name, category badge, and a 600×424 preview PNG. Selecting a template advances to State 2.

**State 2 — Font Loading:** Shows a skeleton/loading state while Google Fonts load. Displays the template name and pulsing gray rectangles approximating the certificate layout. Calls `certificateConfigToDocumentAsync()` which internally waits for `ensureDocumentFontsReady()`. When fonts resolve, advances to State 3.

**State 3 — Canvas Editor:** The main editing view (see layout below). All EditorV2 components are active. User can edit on canvas, use quick-edit panel, or prompt Chiko for revisions.

**State 4 — Export:** Triggered by toolbar button. PNG/PDF/Print download.

### Desktop Layout (≥1024px)

```
┌────────────────────────────────────────────────────────────────┐
│  EditorToolbar (modes, undo/redo, zoom, grid, snap, align)    │
├────────────┬───────────────────────────────┬───────────────────┤
│ Quick-Edit │         CanvasEditor          │  LayersListPanel  │
│ Panel      │  ┌─────────────────────────┐  │  LayerProperties  │
│ (272px)    │  │   Certificate Canvas    │  │  Panel            │
│            │  │   (DesignDocumentV2)    │  │  (272px)          │
│ Template ▾ │  │                         │  │                   │
│ Type ▾     │  │                         │  │                   │
│ Title      │  │                         │  │                   │
│ Recipient  │  │                         │  │                   │
│ Org        │  │                         │  │                   │
│ Dates      │  │                         │  │                   │
│ Signers    │  │                         │  │                   │
│ Seal ▾     │  └─────────────────────────┘  │                   │
├────────────┴───────────────────────────────┴───────────────────┤
│  AI Revision Bar [instruction input] [chips: "Add gold border"]│
└────────────────────────────────────────────────────────────────┘
```

The Quick-Edit panel (left, 272px) contains certificate-specific form fields that sync bidirectionally with the canvas. The right panels (LayersListPanel + LayerPropertiesPanel) are the standard EditorV2 components — do NOT recreate them. The AI Revision Bar is the same component used in `StepEditor.tsx` — an input field where the user types instructions for Chiko to modify the design.

---

## 15. CHIKO AI MANIFEST (Canvas-Aware)

**File:** `src/lib/chiko/manifests/certificate.ts`

### Action List (22 actions)

| Category | Actions |
|----------|---------|
| **Content** | `updateContent`, `updateOrganization`, `updateEvent`, `updateDates`, `setCertificateType` |
| **Canvas** | `addTextLayer`, `addShapeLayer`, `addImageLayer`, `updateLayer`, `removeLayer`, `moveLayer`, `reorderLayer`, `duplicateLayer` |
| **Style** | `changeTemplate`, `updateColors`, `updateFonts` |
| **Seal** | `updateSeal` |
| **AI** | `generateDesign`, `reviseDesign` |
| **Export** | `exportDocument`, `validateBeforeExport` |
| **Read** | `readCurrentState` |
| **System** | `resetAll`, `prefillFromMemory` |

### Layer Lookup by Tag

The manifest's action handlers find layers by searching `Object.values(doc.layersById)` for layers whose `tags` array includes the target tag. This is how Chiko AI targets specific certificate elements without knowing layer IDs.

### Content Action → Canvas Sync Pattern

When Chiko processes a content update (e.g., "change the recipient to John Smith"):
1. Update the certificate metadata store (`setMeta({ recipientName: "John Smith" })`)
2. Find the canvas layer tagged `"recipient-name"` in the document
3. Update that layer's text content to the new value
4. Push the modified document back to the editor store
5. Return a success response with a human-readable confirmation message

This same pattern applies to all content actions — update metadata, find layer by tag, modify layer, push to editor. For style actions (colors, fonts), update the relevant paint/text-style properties on matching layers.

---

## 16. AI DESIGN GENERATION

**File:** `src/lib/editor/certificate-design-generator.ts`

### Prompt Architecture (Same as Business Card Pattern)

Study `src/lib/editor/ai-design-generator.ts` — the business card generator. Certificate follows the exact same approach.

**System prompt** tells the AI model:
- Canvas dimensions (3508×2480 at 300 DPI, 150px safe margins)
- Certificate design philosophy (formal, hierarchical typography, visual balance, professional appearance)
- Available fonts from the selected template's font pairing
- Element sizing guide (title 90–112px, recipient 62–80px, body 30–36px, etc.)
- Semantic tag requirements (MUST tag every layer — list all tags from Section 11)
- The full DesignDocumentV2 JSON schema (the AI must output valid JSON matching this schema)
- Available ShapeLayerV2 types (rectangle, ellipse, line, star for seal)
- Available Paint types with example values (SolidPaint with `kind: "solid"`, GradientPaint with `kind: "gradient"`)

**User message** includes:
- Certificate type and custom title
- Recipient name and description text
- Organization and signatory details
- Style hints (colors, formality level)
- Brand colors from business memory (if available from `src/stores/business-memory.ts`)
- Specific user request (e.g., "make it look modern with teal accents")

### Fallback (No AI Available)

If the AI generation API call fails (timeout, error, user has no credits), ALWAYS fall back to `certificateConfigToDocument()` — the deterministic adapter from Section 11. The user must always get a complete, styled document. Never show an error with no document.

---

## 17. STORE ADAPTER (Project System)

**File:** `src/lib/store-adapters.ts` — update the `getCertificateAdapter()` function

The store adapter bridges the certificate store with DMSuite's project save/load system. It has two methods:

- `readFields()`: Reads the current certificate metadata from `useCertificateEditor.getState()` and serializes the `documentSnapshot` to JSON. Returns a flat object with all metadata fields plus a `documentSnapshot` string field.

- `writeFields(data)`: Receives the flat object from a loaded project. Sets the metadata fields via `setMeta()`, then parses the `documentSnapshot` JSON string back into a `DesignDocumentV2` object and pushes it to both the certificate store (`setDocumentSnapshot()`) and the shared editor store (`setDoc()`).

- `toolId`: `"certificate"`
- `toolName`: `"Certificate Designer"`

---

## 18. EXPORT PIPELINE (PNG / PDF / Print)

### PNG Export

Render the DesignDocumentV2 to a canvas via `renderToCanvas(doc, scale)` (existing function in `renderer.ts`). Use scale 2 for screen display, scale 3 for high-quality download, scale 1 for quick preview. Convert to blob via `canvas.toBlob("image/png")` and trigger download. Before rendering, call `ensureDocumentFontsReady(doc)` to guarantee correct font rendering.

### PDF Export (With All 6 Infrastructure Upgrades)

Call `renderDocumentToPdf(doc, options)` — the existing function in `pdf-renderer.ts` as modified by Section 4 upgrades. After the upgrades, this function will:

- Embed actual Google Fonts (not Helvetica) via fontkit (Upgrade 1)
- Render gradients correctly via raster fallback (Upgrade 2)
- Apply effects via raster fallback for complex effects (Upgrade 6)
- Render SVG borders at print DPI (Upgrade 5)
- Keep text as selectable vector where possible (layers without effects)

Pass `fileName` and `author` (organization name) in options. Download via `downloadPdf(pdfBytes, filename)`.

### Print

Render to a high-DPI canvas (scale 3), convert to data URL, create a hidden iframe with an `<img>` element displaying the data URL at 100% width, and trigger `iframe.contentWindow.print()`. This is the same approach used by business card print.

---

## 19. WORKSPACE EVENTS & MILESTONES

The workspace dispatches events for the DMSuite shell:

- **Dirty state:** Dispatch `dirty: true` on any document change (canvas edit, form edit, template switch). Dispatch `dirty: false` after save or export.
- **Progress milestones:** 10% (template picker shown), 30% (template selected, fonts loading), 50% (document created, editor ready), 70% (editing in progress — first user edit), 90% (ready for export — all required fields filled), 100% (exported successfully).

---

## 20. RESPONSIVE & MOBILE RULES

| Breakpoint | Layout |
|-----------|--------|
| `< 768px` | Template picker 2-col. Canvas full-width, panels hidden. Bottom sheet for layers. |
| `768-1023px` | Template picker 3-col. Canvas + collapsible right panel. Left panel hidden. |
| `≥ 1024px` | 3-panel: left (272px) + canvas + right (272px). Full toolbar. |
| `≥ 1280px` | Extra spacing. |

Mobile canvas: pinch-to-zoom, two-finger pan, tap to select, long-press for context menu.

---

## 21. STYLING & TOKEN RULES

NEVER use hardcoded hex in workspace CHROME (panels, toolbar, buttons). Use Tailwind tokens: `bg-gray-950`, `bg-gray-900`, `bg-gray-800`, `border-gray-700`, `text-gray-100`, `text-gray-300`, `text-gray-400`, `bg-primary-500`, `text-primary-400`, `ring-primary-500`.

The **certificate canvas content** (what's INSIDE the DesignDocumentV2) uses colors from the TEMPLATE definition, not DMSuite tokens. These are stored as RGBA paint values in layer fills.

Dark mode is default. All surfaces need light/dark variants via `dark:` Tailwind classes.

---

## 22. INTEGRATION TOUCHPOINTS

### Files to Modify (NOT Delete/Recreate)

| File | Change |
|------|--------|
| `src/lib/editor/pdf-renderer.ts` | Add fontkit integration, gradient fallback, effects fallback (Section 4, Upgrades 1–2, 6) |
| `src/lib/editor/renderer.ts` | Implement `applyPostEffects()` (Section 4, Upgrade 3) |
| `src/lib/store-adapters.ts` | Replace `getCertificateAdapter()` function only |
| `src/lib/chiko/manifests/index.ts` | Verify re-export of updated certificate manifest |
| `src/data/tools.ts` | Set `devStatus: "scaffold"` during dev, then `"complete"` |
| `TOOL-STATUS.md` | Update certificate status |
| `package.json` | Add `fontfaceobserver`, `@resvg/resvg-wasm`, `@types/fontfaceobserver` |

### Files NOT to Touch

All shared editor infrastructure — `src/stores/editor.ts`, `src/components/editor/*`, `src/lib/editor/schema.ts`, `src/lib/editor/commands.ts`, `src/lib/editor/interaction.ts`, `src/lib/editor/hit-test.ts`.

---

## 23. VALIDATION & TESTING CHECKLIST

### Phase 0: Infrastructure Upgrades (Benefits ALL tools)

- [ ] `npm install fontfaceobserver @resvg/resvg-wasm @types/fontfaceobserver` succeeds
- [ ] `src/lib/editor/font-loader.ts` created with `ensureFontReady()` and `ensureDocumentFontsReady()`
- [ ] `src/lib/editor/svg-renderer.ts` created with `renderSvgToHighDpiPng()`
- [ ] `pdf-renderer.ts`: `fontkit` imported and `pdfDoc.registerFontkit()` called
- [ ] `pdf-renderer.ts`: `loadFontCacheV2()` fetches Google Font TTF binaries
- [ ] `pdf-renderer.ts`: Text renders in correct fonts (not Helvetica) in PDF export
- [ ] `pdf-renderer.ts`: Gradient shapes render correctly (not black)
- [ ] `pdf-renderer.ts`: Layers with effects render via raster fallback
- [ ] `renderer.ts`: `applyPostEffects()` implements blur, glow, outline, noise, color-adjust
- [ ] **Business Card PDF export still works** (regression test)
- [ ] TypeScript compiles with 0 errors

### Phase 1: Certificate Infrastructure

- [ ] 8 SVGs moved to `public/templates/certificates/` (renamed per Section 7)
- [ ] Thumbnail PNGs created at `public/templates/certificates/thumbs/`
- [ ] Old 10 files deleted
- [ ] `certificate-templates.ts` has 8 templates with correct SVG paths
- [ ] `certificate-adapter.ts` creates valid `DesignDocumentV2` from any template
- [ ] Every layer has semantic tags (verify with `Object.values(doc.layersById).every(l => l.tags.length > 0)`)
- [ ] `certificate-editor.ts` store created with metadata + persistence
- [ ] 0 TypeScript errors

### Phase 2: Canvas Editor

- [ ] Template picker shows 8 templates in responsive grid
- [ ] Selecting template shows font loading skeleton → then editor
- [ ] Canvas renders all layers with CORRECT fonts (not system fallback)
- [ ] Layers panel shows correct hierarchy
- [ ] Click layer → selected on canvas with 8-point handles
- [ ] Drag to move, handles to resize
- [ ] Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)
- [ ] Zoom (scroll wheel, toolbar buttons)
- [ ] Grid toggle, snap guides, bleed/safe area
- [ ] Templates switch preserves text content

### Phase 3: Quick-Edit Panel + Sync

- [ ] All certificate fields shown in left panel
- [ ] Editing recipient name → updates canvas "recipient-name" tagged layer
- [ ] Editing on canvas → updates quick-edit fields
- [ ] No circular sync loops (verify `isSyncingRef` works)

### Phase 4: Chiko Integration

- [ ] Manifest registers on mount, unregisters on unmount
- [ ] `readCurrentState` returns all metadata + layer summary
- [ ] `updateContent` updates both metadata and canvas layers
- [ ] `addTextLayer` creates visible new layer
- [ ] `updateLayer` finds layer by tag and modifies it
- [ ] `removeLayer` removes layer from canvas
- [ ] `changeTemplate` switches template, preserves text
- [ ] `generateDesign` calls AI, creates full document, loads fonts
- [ ] `reviseDesign` patches document via AI revision pipeline
- [ ] `exportDocument` triggers download

### Phase 5: Export Quality

- [ ] **PNG at 1x**: Correct fonts, effects visible, gradients correct
- [ ] **PNG at 2x**: Higher resolution, same visual fidelity
- [ ] **PNG at 3x**: Print-quality resolution
- [ ] **PDF**: Text is SELECTABLE (not rasterized)
- [ ] **PDF**: Fonts are CORRECT (Playfair Display, not Helvetica)
- [ ] **PDF**: Drop shadows visible (raster fallback)
- [ ] **PDF**: Gradients render correctly (not black)
- [ ] **PDF**: SVG borders sharp at 300 DPI
- [ ] **Print**: Browser print dialog shows correct preview

### Phase 6: Project System

- [ ] Save project stores certificate metadata + document
- [ ] Load project restores canvas correctly
- [ ] Dirty state dispatches correctly
- [ ] Progress milestones dispatch correctly

### Phase 7: Responsive

- [ ] Mobile: template picker 2-col, canvas full-width
- [ ] Tablet: canvas + collapsible panel
- [ ] Desktop: 3-panel layout
- [ ] Touch: pinch-to-zoom, two-finger pan

---

## 24. TEMPLATE EXPANSION GUIDE (For Drake)

### Adding a New Certificate Template

**Step 1: Prepare SVG Border**
- Clean the SVG: remove embedded fonts and external references
- Set the viewBox to match the canvas dimensions: `0 0 3508 2480` for A4 landscape (or custom for other sizes)
- Save to `public/templates/certificates/your-template-border.svg`
- Ensure the center 60–70% of the SVG is clear/transparent for text content — borders and decorations should be around the edges

**Step 2: Create Thumbnail**
- Create a 600×424 PNG showing a sample certificate rendered with the template
- Save to `public/templates/certificates/thumbs/your-template.png`

**Step 3: Add Template Definition**
- Open `src/data/certificate-templates.ts`
- Add a new entry to the `CERTIFICATE_TEMPLATES` array following the exact format described in Section 9
- Use the same field structure: id, name, category, description, thumbnail path, width (3508), height (2480), colors (background/primary/secondary/text/accent), fontPairing (heading/body/accent + googleImport), layout (borderStyle/headerPosition/sealPosition/signatoryPosition/orientation), svgBorderPath, tags
- All font names must be valid Google Fonts

**Step 4: (Optional) Custom Layout Function**
- If the template needs unique positioning (e.g., title on the left, image on the right), add a custom layout function in `certificate-adapter.ts` and register it in the `LAYOUT_MAP` keyed by the template ID
- If no custom layout is needed, the default centered vertical stack works for most certificates

**Step 5: Rebuild & Test**
- Run `npm run build` to verify no TypeScript errors
- Open the Certificate Designer, find the new template in the gallery, select it, verify fonts and layout render correctly, then export a PDF and verify fonts are embedded correctly

---

## 25. ADMIN TEMPLATE MANAGEMENT (Future Phase)

> Not built yet. Specifying for future implementation.

Admin panel at `/admin/templates/certificates` would allow: uploading SVG borders, setting colors and fonts, previewing with test data, and publishing. For now, templates are code-level in `src/data/certificate-templates.ts`. Drake adds templates manually using Section 24's guide.

---

## 26. USER ASSET UPLOAD (Future Phase)

Users upload logos, signatures, and custom seals via Chiko's existing upload flow (`/api/chiko/upload`). Chiko creates `ImageLayerV2` layers tagged appropriately (`"logo"`, `"signature"`, `"seal"`). No new infrastructure needed — the existing upload pipeline and ImageLayerV2 handling already support this.

---

## APPENDIX A: REFERENCE FILES

### Canvas Engine (DO NOT MODIFY unless specified in Section 4)
- `src/stores/editor.ts` — Zustand store
- `src/lib/editor/schema.ts` — DesignDocumentV2 types
- `src/lib/editor/commands.ts` — Command stack
- `src/lib/editor/renderer.ts` — Canvas2D renderer **← MODIFY: applyPostEffects()**
- `src/lib/editor/pdf-renderer.ts` — PDF export **← MODIFY: font/gradient/effects**
- `src/lib/editor/interaction.ts` — Pointer state machine
- `src/lib/editor/hit-test.ts` — Spatial queries
- `src/lib/editor/snapping.ts` — Snap guides
- `src/lib/editor/ai-patch.ts` — AI revision pipeline

### Editor Components (DO NOT MODIFY)
- `src/components/editor/CanvasEditor.tsx`
- `src/components/editor/EditorToolbar.tsx`
- `src/components/editor/LayersListPanel.tsx`
- `src/components/editor/LayerPropertiesPanel.tsx`
- `src/components/editor/TextStyleEditor.tsx`
- `src/components/editor/FillStrokeEditor.tsx`
- `src/components/editor/EffectsEditor.tsx`

### Business Card (REFERENCE PATTERN — study this)
- `src/components/workspaces/BusinessCardWorkspace.tsx` — Wizard flow
- `src/components/workspaces/business-card/StepEditor.tsx` — Canvas step with AI revision
- `src/stores/business-card-wizard.ts` — Wizard store
- `src/lib/editor/business-card-adapter.ts` — Template → DesignDocumentV2 (2,400 lines, most important reference)
- `src/lib/editor/ai-design-generator.ts` — AI generation prompt builder
- `src/lib/editor/template-generator.ts` — Fallback template engine (40 recipes × 60 themes × 12 accent kits)
- `src/lib/chiko/manifests/business-card.ts` — Chiko manifest

---

## APPENDIX B: EXECUTION ORDER

The executing agent MUST follow this sequence:

```
1. Install dependencies           (npm install fontfaceobserver @resvg/resvg-wasm @types/fontfaceobserver)
2. Create font-loader.ts          (Section 4, Upgrade 4)
3. Create svg-renderer.ts         (Section 4, Upgrade 5)
4. Create api/fonts/route.ts      (Section 4, Upgrade 1 — server-side font fetching)
5. Modify renderer.ts             (Section 4, Upgrade 3 — implement applyPostEffects)
6. Modify pdf-renderer.ts         (Section 4, Upgrades 1, 2, 6 — fonts, gradients, effects)
7. Run: npx tsc --noEmit          (verify 0 errors — infrastructure upgrades must work first)
8. Test: Business Card PDF export  (regression — must still work)
9. Move SVGs to public/templates/certificates/ (see Section 7 for rename mapping)
10. Create thumbnail PNGs
11. Delete old certificate files   (Section 6)
12. Create certificate-templates.ts (Section 9 — 8 templates)
13. Create certificate-adapter.ts  (Section 11 + Section 12 seal spec)
14. Create certificate-editor.ts store (Section 13)
15. Create CertificateTemplatePicker.tsx (Section 14)
16. Create CertificateQuickEdit.tsx (Section 14)
17. Create CertificateEditor.tsx   (Section 14)
18. Create CertificateDesignerWorkspace.tsx (Section 14)
19. Create certificate manifest    (Section 15)
20. Update store-adapters.ts       (Section 17)
21. Run: npx tsc --noEmit          (verify 0 errors)
22. Update TOOL-STATUS.md + devStatus in tools.ts
23. Test full flow: template picker → canvas → edit → Chiko → export PNG → export PDF
```

---

## APPENDIX C: ARCHITECTURE DECISIONS LOG

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canvas engine | EditorV2 | Illustrator-grade, production-proven in business cards |
| Font loading | `fontfaceobserver` | 1.3KB, Promise-based, 3.6M weekly downloads, scroll-event efficient |
| SVG rendering | `@resvg/resvg-wasm` | Pixel-perfect, Rust-powered, custom font support, browser WASM |
| PDF fonts | `@pdf-lib/fontkit` (wire up existing dep) | Already in package.json, just needs import + registration |
| PDF effects | Raster fallback (Canvas2D → PNG → embed) | Same approach Canva/Figma use. Correct output guaranteed. |
| Gradient PDF | Raster fallback at 4x DPI | 4x gives 300 DPI for A4, which is professional print quality |
| Store pattern | Metadata store + shared editor store | Business card pattern, proven bidirectional sync |
| Workspace flow | Template picker → editor (no wizard) | Certificates are simpler than business cards |
| Persistence | `sessionStorage` | Document too large for localStorage; recreated from template on new session |
| Sync guards | `isSyncingRef` | Prevents circular loops; battle-tested in business card |
