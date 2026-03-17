# Chiko Layer 3 — Custom Blocks System Build Specification

> **Document Type:** Consumable build spec (becomes history after implementation)
> **Depends on:** Layer 1 (Action System) ✅ — Layer 2 (File Processing) ✅
> **Prerequisites:** Read ALL memory bank files + CHIKO-AGENT-ARCHITECTURE.md before starting
> **Rule:** This document describes WHAT to build and WHERE. No function bodies, no JSX, no component rendering code. TypeScript interfaces define contracts only. The builder writes all implementation code fresh based on the real codebase at build time.

---

## 1. Prerequisites — Read Before Building

The builder MUST read these files in order before writing any code:

**Memory Bank + Architecture:**
1. `/memory-bank/projectbrief.md` — Project scope and requirements
2. `/memory-bank/systemPatterns.md` — Architecture patterns and conventions
3. `/memory-bank/techContext.md` — Tech stack and constraints
4. `/memory-bank/activeContext.md` — Current state and recent changes
5. `PHASES/CHIKO-AGENT-ARCHITECTURE.md` — Big-picture architecture (Layer 3 section especially)

**Layer 1 + 2 Files (the systems you are extending):**
6. `src/stores/chiko-actions.ts` — Action registry store
7. `src/hooks/useChikoActions.ts` — Registration hook pattern
8. `src/lib/chiko/manifests/sales-book.ts` — Sales book manifest (you'll add custom block actions here)
9. `src/lib/chiko/manifests/invoice.ts` — Invoice manifest (you'll add custom block actions here)
10. `src/lib/chiko/extractors/index.ts` — Layer 2 types (ExtractedFileData, ExtractedImage — images from file uploads feed into image blocks)

**Sales Book System (primary target):**
11. `src/lib/sales-book/schema.ts` — Zod schemas: `SalesBookFormData`, `CompanyBranding`, `FormLayout`, `PrintConfig`, `FormStyle`, `BrandLogosConfig`
12. `src/stores/sales-book-editor.ts` — Store: `useSalesBookEditor` with 12 actions, `temporal(immer(...))` middleware
13. `src/lib/sales-book/BlankFormRenderer.tsx` — The big renderer file: `BlankFormSlip` (table-based invoice/quotation), `BlankReceiptSlip` (card-based receipt), `BlankFormPage`, `BlankFormRenderer` — understand the rendering regions
14. `src/components/workspaces/sales-book-designer/SalesBookDesignerWorkspace.tsx` — Workspace with 6 accordion sections + preview panel

**Invoice System (secondary target):**
15. `src/lib/invoice/schema.ts` — `InvoiceData`, `BusinessInfo`, `LineItem`, `InvoiceMetadata`
16. `src/stores/invoice-editor.ts` — `useInvoiceEditor` with 25+ actions

**Resume System (tertiary — limited scope):**
17. `src/lib/resume/schema.ts` — `ResumeData`, `ResumeSection`, template/font constants
18. `src/stores/resume-editor.ts` — `useResumeEditor`

---

## 2. Current State — What Exists Right Now

### 2.1 Rendering Architecture

DMSuite has **two completely different rendering paradigms**:

1. **Template-based tools** (Sales Books, Invoices, Resumes) — React components rendering structured data into fixed regions. Content flows top-to-bottom through predefined zones: Header → Body → Footer. These tools compose HTML/CSS divs and are exported via `html2canvas-pro` + `jsPDF`.

2. **Canvas-based tools** (vNext Editor) — A Figma-like editor with layers, shapes, paths, and a scene graph (`DesignDocumentV2`). This is a completely different paradigm with its own LayerV2 system, transforms, paint fills, and effects.

**Layer 3 custom blocks target ONLY template-based tools.** The canvas editor already has a rich layer system where users can freely add any element. Custom blocks solve the problem for *template* tools where users cannot freely place content because the layout is predefined.

### 2.2 Sales Book Renderer — Rendering Regions

The `BlankFormRenderer.tsx` file contains two form types:

**`BlankFormSlip` (table-based)** — Used for invoice, quotation, delivery-note, credit-note, proforma-invoice, purchase-order:
```
┌─────────────────────────────────────────┐
│ HEADER                                  │
│ ├─ Company branding (name, logo)        │
│ ├─ Document title + serial number       │
│ ├─ Date/recipient/sender fields         │
│ └─ Type-specific fields (PO#, etc.)     │
├─────────────────────────────────────────┤
│ ITEM TABLE                              │
│ ├─ Column headers (#, Desc, Qty, etc.)  │
│ └─ Blank rows (configurable count)      │
├─────────────────────────────────────────┤
│ TOTALS                                  │
│ ├─ Subtotal / Discount / Tax / Total    │
│ └─ Amount in words                      │
├─────────────────────────────────────────┤  ← CUSTOM BLOCKS INSERT HERE
│ PAYMENT INFO (if enabled)               │
│ NOTES / TERMS (if enabled)              │
│ CUSTOM FOOTER TEXT (if enabled)         │
├─────────────────────────────────────────┤
│ SIGNATURE                               │
│ ├─ Prepared By / Customer Signature     │
├─────────────────────────────────────────┤
│ FOOTER BAR                              │
│ BRAND LOGOS                             │
│ CUT LINE                                │
└─────────────────────────────────────────┘
```

**`BlankReceiptSlip` (card-based)** — Used for receipt documents:
```
┌──────────────────────────────────┬──────┐
│ HEADER (company + serial)        │      │
│ BODY (date, payment type, from)  │ SIDE │
│ AMOUNT BOX                       │ BAR  │
│ ───── custom blocks here ─────── │      │
│ SIGNATURES                       │      │
│ TERMS / FOOTER                   │      │
│ FOOTER BAR                       │      │
│ BRAND LOGOS                      │      │
└──────────────────────────────────┴──────┘
```

### 2.3 Schema — No Custom Blocks Field Yet

The `SalesBookFormData` schema currently has 7 top-level sections:
- `documentType` (string)
- `companyBranding` (CompanyBranding)
- `serialConfig` (SerialConfig)
- `formLayout` (FormLayout)
- `printConfig` (PrintConfig)
- `style` (FormStyle)
- `brandLogos` (BrandLogosConfig)

There is **no `customBlocks` field**. Layer 3 adds it.

The schema already has precedent for extensible content:
- `showCustomField1` / `showCustomField2` + custom labels — simple text-only custom fields
- `customFooterText` — free-text footer
- `brandLogos` — array of logo objects with URL/name

Custom blocks generalize and supersede the simplistic custom fields with a rich, typed block system.

### 2.4 Installed Dependencies

| Package | Usage in Layer 3 |
|---------|------------------|
| `@dnd-kit/core` ^6.3.1 | Drag-and-drop for block reordering in the UI panel |
| `@dnd-kit/sortable` ^10.0.0 | Sortable list for block ordering |
| `@dnd-kit/utilities` ^3.2.2 | DnD utilities |
| `uuid` ^13.0.0 | Generate unique block IDs |
| `html2canvas-pro` ^2.0.1 | Export pipeline (block rendering auto-captured) |
| `jspdf` ^4.1.0 | PDF generation (no changes needed) |

### 2.5 Missing Dependencies

| Package | Purpose | Needs Installing |
|---------|---------|-----------------|
| `qrcode` | Generate QR code images from URLs/text | **Yes — install** |
| `@types/qrcode` | TypeScript types for qrcode | **Yes — install** |

**Note:** `qrcode` is the standard Node.js QR code generator. It supports `toDataURL()` which returns a base64 PNG data URI — perfect for rendering in `<img>` tags using the same pattern as brand logos. **Do NOT install `jsbarcode`** — barcode support is deferred to a later enhancement. Keep scope tight.

### 2.6 Store Patterns

All editor stores use `create<State>()(temporal(immer((set) => ...)))`:
- Mutations via `set((s) => { ... })` with Immer's draft proxy
- Undo/redo built-in via Zundo's temporal middleware
- `fast-deep-equal` for equality checks (prevents duplicate history entries)
- Arrays mutated in-place via `push`, `splice`, `findIndex` (Immer makes this safe)

### 2.7 Export Pipeline — Zero Changes Needed

The export system (`html2canvas-pro` → `jsPDF`) works by capturing the rendered DOM. Since custom blocks render as standard React components within the existing renderer divs, they are automatically captured during export. **No changes to export.ts files are needed.**

---

## 3. Goal — What the User Experiences After Layer 3

**Adding a QR code via Chiko:**
> User: "Add a QR code with my website dramac.com to the bottom of the form"
> Chiko: "I'll add a QR code linking to https://dramac.com after the totals section."
> *(calls `addCustomBlock({ type: "qr-code", position: "after-totals", data: { url: "https://dramac.com", size: 80, alignment: "right", label: "Scan to visit" } })`)* 
> Chiko: "Done! A QR code for dramac.com is now on your form. Check the preview! 📱"

**Adding a divider manually via UI:**
> *(User opens the "Custom Blocks" accordion section in the sidebar)*
> *(Clicks "+ Add Block" → selects "Divider")*
> *(A divider block appears in the list with default settings)*
> *(User adjusts: style = dashed, color = accent, thickness = 2px)*
> *(Preview updates live — a dashed accent-colored line appears between totals and payment info)*

**Chiko suggesting blocks based on uploaded file:**
> *(User previously uploaded company-profile.pdf in Layer 2, Chiko extracted website URL)*
> Chiko: "I noticed your website is dramac.com — want me to add a QR code to your sales book so customers can scan it?"
> User: "Yes, and add a tagline too"
> Chiko: *(calls `addCustomBlock({ type: "qr-code", ... })` and `addCustomBlock({ type: "text", ... })`)*
> "Added a QR code and your tagline! ✨"

**Reordering blocks:**
> *(User has 3 custom blocks: QR code, divider, brand message)*
> *(Drags the QR code from position 3 to position 1 using drag handles)*
> *(Preview re-renders with QR code first, then divider, then brand message)*

**What does NOT work yet after Layer 3:**
- Remembering custom blocks across sessions (Layer 4 — Business Memory)
- Auto-applying blocks across multiple document types (Layer 5 — Workflows)
- Free-position blocks overlaid anywhere on the form (future enhancement)

---

## 4. TypeScript Contracts

### 4.1 Custom Block — Discriminated Union

```typescript
/** Base shape shared by all block types */
interface CustomBlockBase {
  /** Unique ID (uuid) */
  id: string;
  
  /** Block type discriminator */
  type: CustomBlockType;
  
  /** Where this block renders relative to form regions */
  position: BlockPosition;
  
  /** Whether this block is currently visible (can be toggled off without deleting) */
  enabled: boolean;
  
  /** Optional label shown above the block in the rendered form */
  label?: string;
  
  /** Horizontal alignment within the block's container */
  alignment: "left" | "center" | "right";
  
  /** Top/bottom margin in px (controls spacing from adjacent content) */
  marginTop: number;
  marginBottom: number;
}
```

### 4.2 Block Types

```typescript
type CustomBlockType = 
  | "qr-code"
  | "text"
  | "divider"
  | "spacer"
  | "image"
  | "signature-box";
```

### 4.3 QR Code Block

```typescript
interface QRCodeBlock extends CustomBlockBase {
  type: "qr-code";
  data: {
    /** The URL or text encoded in the QR code */
    url: string;
    /** QR code image size in px (width = height, QR codes are square) */
    size: number;
    /** Text label shown below the QR code (e.g., "Scan to pay") */
    caption?: string;
    /** QR code foreground color (default: "#000000") */
    fgColor: string;
    /** QR code background color (default: "#ffffff") */
    bgColor: string;
  };
}
```

### 4.4 Text Block

```typescript
interface TextBlock extends CustomBlockBase {
  type: "text";
  data: {
    /** The text content (supports multiple lines via \n) */
    content: string;
    /** Font size in px */
    fontSize: number;
    /** Font weight: normal or bold */
    fontWeight: "normal" | "bold";
    /** Text color (CSS color string, e.g., "#374151" or "accent" for accent color) */
    color: string;
    /** Whether text is italic */
    italic: boolean;
    /** Whether text should be uppercased */
    uppercase: boolean;
  };
}
```

### 4.5 Divider Block

```typescript
interface DividerBlock extends CustomBlockBase {
  type: "divider";
  data: {
    /** Line style */
    style: "solid" | "dashed" | "dotted" | "double";
    /** Line thickness in px */
    thickness: number;
    /** Line color (CSS color string or "accent") */
    color: string;
    /** Width as percentage of container (10-100) */
    widthPercent: number;
  };
}
```

### 4.6 Spacer Block

```typescript
interface SpacerBlock extends CustomBlockBase {
  type: "spacer";
  data: {
    /** Height of the empty space in px */
    height: number;
  };
}
```

### 4.7 Image Block

```typescript
interface ImageBlock extends CustomBlockBase {
  type: "image";
  data: {
    /** Image source as base64 data URI  */
    src: string;
    /** Display width in px */
    width: number;
    /** Display height in px (auto if 0) */
    height: number;
    /** Object-fit mode */
    objectFit: "contain" | "cover";
    /** Opacity (0-1) */
    opacity: number;
    /** Optional caption below the image */
    caption?: string;
  };
}
```

### 4.8 Signature Box Block

```typescript
interface SignatureBoxBlock extends CustomBlockBase {
  type: "signature-box";
  data: {
    /** Label text below the signature line (e.g., "Approved By", "Client Signature") */
    label: string;
    /** Width of the signature line in px */
    lineWidth: number;
    /** Line style for the signature rule */
    lineStyle: "solid" | "dashed" | "dotted";
  };
}
```

### 4.9 Union Type

```typescript
type CustomBlock = 
  | QRCodeBlock 
  | TextBlock 
  | DividerBlock 
  | SpacerBlock 
  | ImageBlock 
  | SignatureBoxBlock;
```

### 4.10 Block Position

```typescript
/** Where in the form the block renders */
type BlockPosition = 
  | "after-header"      // Between header area and item table
  | "after-items"       // Between item table/totals and payment info (DEFAULT)
  | "before-signature"  // Just above signature lines
  | "after-footer";     // After footer bar and brand logos (very bottom)
```

**Grouping logic:** Blocks at the same position render in array order (first block in the array renders first). The position determines *which region boundary* the block group appears at. All blocks default to `"after-items"`.

### 4.11 Default Block Factories

Each block type has sensible defaults when created:

```typescript
/** Create a new block with default values for its type */
// The builder implements this as a function that takes a type and returns a CustomBlock
// with a fresh uuid, enabled: true, alignment: "center", margins: 8/8, and type-specific defaults:

// QR Code defaults: url = "", size = 80, caption = "", fgColor = "#000000", bgColor = "#ffffff"
// Text defaults: content = "", fontSize = 11, fontWeight = "normal", color = "#374151", italic = false, uppercase = false
// Divider defaults: style = "solid", thickness = 1, color = "accent", widthPercent = 100
// Spacer defaults: height = 16
// Image defaults: src = "", width = 120, height = 0, objectFit = "contain", opacity = 1
// Signature Box defaults: label = "Signature", lineWidth = 160, lineStyle = "solid"
```

---

## 5. Files to Create

### 5.1 `src/lib/sales-book/custom-blocks.ts` — Block Schema + Types + Defaults

**Purpose:** Central definition file for all custom block types, Zod schemas, the discriminated union type, the block position type, and default factory functions.

**What it exports:**
- All TypeScript interfaces from Section 4 above
- `CustomBlock` union type
- `CustomBlockType` and `BlockPosition` types
- `BLOCK_TYPES` constant array with labels and icons for each type
- `BLOCK_POSITIONS` constant array with labels
- `createDefaultBlock(type: CustomBlockType): CustomBlock` — Factory with uuid + sensible defaults
- Zod schemas for validation (optional — only if the builder deems it useful for the store)

**Important:** This file has NO React code, NO rendering, NO store dependencies. It is pure types + data + factory functions. Both the store, renderer, and Chiko manifest import from here.

### 5.2 `src/lib/sales-book/CustomBlockRenderer.tsx` — Block Rendering Components

**Purpose:** Renders an array of `CustomBlock[]` at a given position inside the form renderer.

**What it exports:**
- `CustomBlocksRegion` — A React component that takes `{ blocks: CustomBlock[], position: BlockPosition, accentColor: string, density: number }` and renders all blocks matching that position in array order
- Individual block renderers: `QRCodeBlockRender`, `TextBlockRender`, `DividerBlockRender`, `SpacerBlockRender`, `ImageBlockRender`, `SignatureBoxBlockRender`

**Rendering rules:**
- Each block renders as a self-contained `<div>` with its own margins and alignment
- `alignment` maps to `text-align` on the container and `margin-left: auto` / `margin-right: auto` patterns
- The `"accent"` color keyword in block data fields is resolved to the `accentColor` prop at render time
- `density` is applied to font sizes and dimensions (same scaling pattern as the rest of the renderer)
- `enabled: false` blocks are skipped entirely
- Blocks respect the form's overall font family (passed via CSS inheritance from the parent)
- QR code rendering: use `qrcode.toDataURL(url, { width: size, color: { dark: fgColor, light: bgColor } })` — this is async but can be called in a `useEffect` that writes to local state, or use `qrcode.toCanvas()` in a ref

**QR code rendering approach:**
Since `BlankFormRenderer` is a pure render component (no hooks — it's called inside `.map()` loops), QR codes need to work without `useState`/`useEffect`. Two options:
1. **Pre-generate QR data URIs** in the store when the URL changes (store the `dataUri` alongside `url` in block data) — this keeps rendering pure and synchronous
2. **Use a tiny wrapper component** specifically for QR blocks that manages its own `useState` + `useEffect` for async generation

Option 1 (pre-generate in store) is recommended because:
- The form renderer is performance-sensitive (renders multiple forms per page)
- No flicker on initial render
- Export via html2canvas captures the QR instantly (no async delay)
- Keeps the renderer pure

The store's `addCustomBlock` and `updateCustomBlock` should generate the QR data URI when the block type is `"qr-code"` and the URL is non-empty. Store it as `data._qrDataUri` (prefixed with underscore to signal it's derived, not user-editable).

### 5.3 `src/components/workspaces/sales-book-designer/SBSectionCustomBlocks.tsx` — Sidebar Panel

**Purpose:** The "Custom Blocks" accordion section in the sales book designer sidebar. Allows users to add, configure, reorder, toggle, and remove custom blocks.

**UI Layout:**
```
┌───────────────────────────────────────┐
│ + Add Block          [dropdown/grid]  │
│ ┌─ QR Code  ─ Text  ─ Divider ─────┐ │
│ │  Spacer  ─ Image  ─ Signature     │ │
│ └────────────────────────────────────┘ │
├───────────────────────────────────────┤
│ ═ [drag] QR Code — dramac.com    [✕] │
│   Position: [after-items ▾]           │
│   URL: [________________]             │
│   Size: [──●────] 80px               │
│   Caption: [Scan to visit]            │
├───────────────────────────────────────┤
│ ═ [drag] Divider — dashed        [✕] │
│   Position: [after-items ▾]           │
│   Style: [solid|DASHED|dotted|double] │
│   Thickness: [──●────] 1px           │
│   Width: [────────●──] 100%          │
│   Color: [■ accent  ▾]               │
├───────────────────────────────────────┤
│ ═ [drag] Text — "Thank you..."   [✕] │
│   ...                                 │
└───────────────────────────────────────┘
```

**Component responsibilities:**
1. **"+ Add Block" button** — Opens a small type selector grid (6 block types with icons and labels). Clicking a type creates a new block via `addCustomBlock()` and scrolls to it.
2. **Block list** — Each block in the array is a collapsible card showing:
   - Drag handle (hamburger icon) for reordering via `@dnd-kit/sortable`
   - Block type icon + brief description (e.g., "QR Code — dramac.com")
   - Enable/disable toggle (eye icon)
   - Delete button (× icon, triggers `removeCustomBlock`)
   - Collapsed by default; click to expand and show configuration fields
3. **Configuration fields** — Type-specific inputs:
   - QR Code: URL input, size slider (40-200px), caption input, color pickers (fg/bg)
   - Text: Textarea for content, font size slider (8-24px), weight toggle, color picker, italic/uppercase toggles
   - Divider: Style selector (4 options), thickness slider (1-5px), width slider (10-100%), color picker
   - Spacer: Height slider (4-64px)
   - Image: File picker (opens native file dialog, accepts image/png,image/jpeg,image/svg+xml), width slider (40-300px), height input (0 = auto), opacity slider, object-fit toggle
   - Signature Box: Label input, line width slider (80-300px), line style selector
4. **Position selector** — Dropdown for each block: "After Header", "After Items", "Before Signature", "After Footer"
5. **Drag-and-drop reordering** — Uses `@dnd-kit/sortable` for smooth reorder. On drop, calls `reorderCustomBlocks(fromIndex, toIndex)`.
6. **Empty state** — When no blocks exist, show a subtle message: "Add QR codes, text, dividers, and more to your form"

**Styling:** Follow the exact same patterns as existing SBSection components (same input styling, same label sizes, same spacing, same dark theme colors). Look at `SBSectionBranding.tsx` and `SBSectionFormLayout.tsx` for reference.

**Image block file handling:**
When the user picks an image file for an Image block:
- Validate file type (PNG/JPEG/SVG only) and size (max 2 MB)
- Read via `FileReader.readAsDataURL()` to get the base64 data URI
- Store in block's `data.src`
- Show a small thumbnail preview in the block card

---

## 6. Files to Modify

### 6.1 `src/lib/sales-book/schema.ts` — Add Custom Blocks to Form Data

**Changes needed:**

1. **Import custom block types** from `custom-blocks.ts`

2. **Add `customBlocks` to `salesBookFormSchema`:**
   ```
   customBlocks: z.array(customBlockSchema).default([])
   ```
   Where `customBlockSchema` is a Zod passthrough or a properly typed schema. Since blocks are a discriminated union, a `z.array(z.any())` with runtime type guards is acceptable — the store handles validation. Alternatively, use `z.array(z.record(z.unknown())).default([])` and rely on the TypeScript types for compile-time safety.

3. **Export `CustomBlock` and related types** — Re-export from `custom-blocks.ts` so consumers can import from the schema file (one import source).

4. **Update `createDefaultSalesBookForm`** — Add `customBlocks: []` to the returned object.

5. **Update `convertSalesBookType`** — Preserve `customBlocks` when converting between document types (spread it through):
   ```
   customBlocks: form.customBlocks
   ```

### 6.2 `src/stores/sales-book-editor.ts` — Add Block CRUD Actions

**Changes needed:**

1. **Import types:** `CustomBlock`, `CustomBlockType`, `createDefaultBlock` from `custom-blocks.ts`

2. **Add to `SalesBookEditorState` interface:**
   ```typescript
   // Custom Blocks
   addCustomBlock: (type: CustomBlockType, overrides?: Partial<CustomBlock>) => string;
   updateCustomBlock: (blockId: string, patch: Partial<CustomBlock>) => void;
   removeCustomBlock: (blockId: string) => void;
   reorderCustomBlocks: (fromIndex: number, toIndex: number) => void;
   ```

3. **Implement the 4 actions:**
   - `addCustomBlock`: Creates a block via `createDefaultBlock(type)`, merges any overrides, pushes to `s.form.customBlocks`, returns the block ID
   - `updateCustomBlock`: Finds block by ID, applies `Object.assign(block, patch)` (Immer makes this safe). **Special case:** If block is a QR code and `data.url` changed, regenerate `data._qrDataUri` via `qrcode.toDataURL()` — BUT since store actions should be synchronous, handle this by storing the URL and letting a separate utility or the component handle async generation. (See Section 5.2 for the approach.)
   - `removeCustomBlock`: Splices block from array by ID
   - `reorderCustomBlocks`: Standard array reorder — splice out element at `fromIndex`, insert at `toIndex`

4. **QR code data URI generation:**
   Since Immer set functions must be synchronous and `qrcode.toDataURL()` is async, the QR data URI CANNOT be generated inside the store action. Instead:
   - The store only stores the `url`, `size`, `fgColor`, `bgColor` in the QR code block data
   - The `CustomBlockRenderer` component handles QR generation (see Section 5.2 — use Option 1 if a sync API is available like `qrcode-generator`, or Option 2 with a small wrapper component that does the async call)
   - **Revised recommendation:** Use a **wrapper component** (`QRCodeBlockRender`) with its own `useState` + `useEffect` that calls `qrcode.toDataURL()` and renders an `<img>` once the data URI is ready. This is cleanest and avoids polluting the store with derived data. The brief flicker on first render is acceptable (QR generation takes <10ms).

### 6.3 `src/lib/sales-book/BlankFormRenderer.tsx` — Render Custom Blocks

**Changes needed:**

1. **Import `CustomBlocksRegion`** from `CustomBlockRenderer.tsx`

2. **In `BlankFormSlip` (table-based forms):**
   Insert `<CustomBlocksRegion>` calls at 4 positions:
   
   - **After header area, before item table** → `position="after-header"`
   - **After totals, before payment info** → `position="after-items"` (the primary/default position)
   - **Before signature** → `position="before-signature"`
   - **After brand logos** → `position="after-footer"`
   
   Each call passes: `blocks={form.customBlocks}`, `position="..."`, `accentColor={accent}`, `density={density}`

3. **In `BlankReceiptSlip` (receipt cards):**
   Insert the same 4 `<CustomBlocksRegion>` calls at equivalent positions within the receipt layout. Receipt cards are tighter on space, so the `density` parameter matters — blocks scale down proportionally.

4. **Do NOT restructure the renderer.** The custom block regions are simple insertions (4 lines each) between existing content sections. No refactoring of the existing layout is needed.

### 6.4 `src/components/workspaces/sales-book-designer/SalesBookDesignerWorkspace.tsx` — Add Accordion Section

**Changes needed:**

1. **Import `SBSectionCustomBlocks`** from the new component

2. **Add a new `AccordionSection`** between "Brand & Supplier Logos" and the "Start Over" button:
   ```
   <AccordionSection
     title="Custom Blocks"
     icon={...}  // puzzle piece or grid icon
     isOpen={openSection === "blocks"}
     onToggle={() => toggleSection("blocks")}
     badge={customBlockCount > 0 ? `${customBlockCount} blocks` : undefined}
   >
     <SBSectionCustomBlocks />
   </AccordionSection>
   ```

3. **Add "blocks" to the section toggle state** — The workspace uses a `useState<string | null>("document-type")` for single-section-open behavior. Just add `"blocks"` as a valid value.

### 6.5 `src/lib/chiko/manifests/sales-book.ts` — Add Block Actions to Manifest

**Changes needed:**

Add 4 new actions to the sales book manifest:

1. **`addCustomBlock`**
   - Description: "Add a custom block to the form. Types: qr-code (QR code for URLs/payment links), text (custom text/tagline), divider (horizontal line), spacer (empty space), image (custom image), signature-box (additional signature line)"
   - Parameters: `type` (string enum of 6 types), `position` (string enum of 4 positions, optional — default "after-items"), `data` (object — type-specific config, see block type descriptions)
   - Category: "Customization"
   - Execute: Calls `useSalesBookEditor.getState().addCustomBlock(type, { position, data, ...rest })`

2. **`updateCustomBlock`**
   - Description: "Modify an existing custom block's settings"
   - Parameters: `blockId` (string, required), `data` (object — partial update of block data), `position` (string, optional), `alignment` (string, optional), `enabled` (boolean, optional), `label` (string, optional)
   - Category: "Customization"
   - Execute: Calls `updateCustomBlock(blockId, mergedPatch)`

3. **`removeCustomBlock`**
   - Description: "Remove a custom block from the form"
   - Parameters: `blockId` (string, required)
   - Category: "Customization"
   - Destructive: **true** (requires confirmation)
   - Execute: Calls `removeCustomBlock(blockId)`

4. **`reorderCustomBlocks`**
   - Description: "Reorder custom blocks by changing a block's position in the list"
   - Parameters: `fromIndex` (number), `toIndex` (number)
   - Category: "Customization"
   - Execute: Calls `reorderCustomBlocks(fromIndex, toIndex)`

5. **Update `getState()`** to include custom blocks summary:
   ```
   customBlocks: form.customBlocks.map(b => ({ id: b.id, type: b.type, position: b.position, enabled: b.enabled }))
   ```
   (Only metadata — not full data — to keep tool state payload small)

### 6.6 `src/lib/chiko/manifests/invoice.ts` — Add Block Actions to Invoice Manifest

**Same 4 actions** as the sales book manifest, but calling `useInvoiceEditor.getState()` methods instead.

**Note:** The invoice editor store (`invoice-editor.ts`) also needs the same 4 CRUD actions added. If the `InvoiceData` schema does not yet have a `customBlocks` field, add it following the same pattern as the sales book schema.

**Scope decision:** If the invoice system's renderer is not yet built or is significantly different from the sales book renderer, **defer invoice custom blocks to a follow-up** and only add them to the manifest now (with a TODO comment in the execute function). The primary deliverable is sales book custom blocks.

### 6.7 `src/lib/chiko/manifests/resume.ts` — No Changes

Custom blocks for resumes are out of scope for Layer 3. The resume system uses a completely different rendering approach (CSS-based templates with section layout) and would need a different block insertion strategy. Defer to a future enhancement.

---

## 7. Data Flow — End to End

### 7.1 User Adds a QR Code via Chiko

```
1. User: "Add a QR code with my website dramac.com"
   ↓
2. Message sent to API with actions (Layer 1)
   - actions include addCustomBlock descriptor
   - toolState includes: customBlocks: [] (empty)
   ↓
3. Claude sees the action and responds:
   - tool_use: sales_book_editor__addCustomBlock({
       type: "qr-code",
       position: "after-items",
       data: { url: "https://dramac.com", size: 80, caption: "Scan to visit" }
     })
   - Text: "Adding a QR code for dramac.com! 📱"
   ↓
4. ChikoAssistant receives __CHIKO_ACTION__:{json}
   - Parses: toolId="sales-book-editor", action="addCustomBlock", params={...}
   - Calls registry.execute("sales-book-editor", "addCustomBlock", params)
   ↓
5. Sales book manifest executeAction("addCustomBlock", params):
   - Calls useSalesBookEditor.getState().addCustomBlock("qr-code", { 
       position: "after-items", 
       data: { url: "https://dramac.com", size: 80, caption: "Scan to visit", fgColor: "#000000", bgColor: "#ffffff" } 
     })
   - Returns { success: true, message: "Added QR code block" }
   ↓
6. Store mutation (Immer):
   - Creates new CustomBlock with uuid, type "qr-code", default margins, etc.
   - Pushes to form.customBlocks array
   - Zundo captures undo snapshot
   ↓
7. BlankFormRenderer re-renders:
   - CustomBlocksRegion at position "after-items" finds 1 block
   - QRCodeBlockRender fires useEffect → qrcode.toDataURL("https://dramac.com") → sets dataUri state
   - Renders <img src={dataUri} width={80} height={80} alt="QR Code" />
   - Caption renders below: "Scan to visit"
   ↓
8. User sees QR code on their form preview instantly.
   ↓
9. When user exports to PDF:
   - html2canvas captures the rendered DOM including the QR code <img>
   - jsPDF embeds it — QR code appears in the exported PDF
```

### 7.2 User Adds Blocks via Sidebar UI

```
1. User opens "Custom Blocks" accordion section
   ↓
2. Clicks "+ Add Block" → type selector grid appears
   ↓
3. Clicks "Divider"
   ↓
4. SBSectionCustomBlocks calls:
   useSalesBookEditor.getState().addCustomBlock("divider")
   ↓
5. Store creates new DividerBlock with defaults:
   { id: "abc-123", type: "divider", position: "after-items", enabled: true, 
     alignment: "center", marginTop: 8, marginBottom: 8,
     data: { style: "solid", thickness: 1, color: "accent", widthPercent: 100 } }
   ↓
6. New block card appears in the list (expanded, scrolled into view)
   ↓
7. User changes style to "dashed" → calls updateCustomBlock("abc-123", { data: { style: "dashed" } })
   ↓
8. Preview updates live — dashed line appears between totals and payment info
   ↓
9. User drags QR code block above divider → calls reorderCustomBlocks(1, 0)
   ↓
10. Preview re-renders with blocks in new order
```

### 7.3 Layer 2 → Layer 3 Integration (Uploaded Image as Block)

```
1. User uploads logo-banner.png via Layer 2 (file attachment)
   ↓
2. Layer 2 extracts image: { dataUri: "data:image/png;base64,...", width: 600, height: 100 }
   ↓
3. Chiko: "I see a 600×100 banner image. Want me to add it to your form?"
   ↓
4. User: "Yes, put it at the top"
   ↓
5. Chiko calls addCustomBlock({ 
     type: "image", 
     position: "after-header", 
     data: { src: "__ATTACHED_IMAGE_0__", width: 300, height: 0, objectFit: "contain", opacity: 1 }
   })
   ↓
6. ChikoAssistant intercepts __ATTACHED_IMAGE_0__ → replaces with actual base64
   (same placeholder mechanism from Layer 2)
   ↓
7. Store saves block with the real data URI
   ↓
8. Renderer shows the banner image after the header area
```

### 7.4 Multiple Blocks at Different Positions

```
Form with 3 custom blocks:
  - Block A: Text "Thank you for your business!" at position "before-signature"
  - Block B: Divider (dashed) at position "after-items"
  - Block C: QR code at position "after-items"

Rendered layout:
  HEADER
  ITEM TABLE
  TOTALS
  ──── Block B (Divider — dashed line) ────  ← after-items, index 0
  [QR CODE for dramac.com]                   ← after-items, index 1
  PAYMENT INFO
  NOTES/TERMS
  "Thank you for your business!"             ← before-signature
  SIGNATURE
  FOOTER BAR
  BRAND LOGOS
```

Blocks at the same position render in array order. The user controls order via drag-and-drop.

---

## 8. Rendering in Multi-Form Layouts

Sales book forms can be printed 1, 2, or 3 per page. Custom blocks must work correctly in all densities:

### 8.1 Density Scaling

The renderer already applies a `density` multiplier (1.0, 0.88, or 0.75) to all dimensions. Custom blocks use the same multiplier:

- Font sizes: `fontSize * density`
- QR code size: `size * density`
- Image dimensions: `width * density`, `height * density`
- Margins: `marginTop * density`, `marginBottom * density`
- Divider thickness: stays at configured value (1-5px is thin enough to not need scaling)
- Spacer height: `height * density`

The `CustomBlocksRegion` component receives `density` as a prop and applies it.

### 8.2 Space Constraints

At 3-per-page (receipt layout), each slip is ~374px tall. Custom blocks compete with existing content for vertical space. The renderer does NOT clip or scroll — if blocks push content past the slip boundary, it overflows.

**Mitigation strategy:**
- Default margins are small (8px top/bottom)
- Default QR code size is 80px (×0.75 = 60px at receipt density)
- The sidebar UI shows a subtle warning when total custom block height might exceed available space
- This is a user-responsibility concern — the preview shows exactly what will print

### 8.3 Receipt vs. Form

Receipt slips (`BlankReceiptSlip`) have a horizontal sidebar strip on the right. Custom blocks render in the main content area to the LEFT of the sidebar — same as all other content. No special handling needed beyond the standard padding.

---

## 9. Prompt Engineering Notes

### 9.1 System Prompt Addition for Custom Blocks

When the tool state includes `customBlocks`, add to the system prompt:

```
## Custom Blocks
The user's form currently has {N} custom blocks: {summary of each: type + position}

Available block types:
- qr-code: QR code for URLs/payment links. Set url, size (40-200px), caption, colors.
- text: Custom text/tagline/disclaimer. Set content, fontSize (8-24px), fontWeight, color, italic, uppercase.
- divider: Horizontal line separator. Set style (solid/dashed/dotted/double), thickness (1-5px), color, widthPercent (10-100%).
- spacer: Empty vertical space. Set height (4-64px).
- image: Custom image placed on the form. Use __ATTACHED_IMAGE_N__ for uploaded images.
- signature-box: Additional signature line. Set label, lineWidth (80-300px), lineStyle.

Available positions: after-header, after-items (default), before-signature, after-footer.

When adding blocks, use sensible defaults. For QR codes, validate the URL looks correct.
For images, use __ATTACHED_IMAGE_N__ placeholder if the user uploaded a file.
```

### 9.2 Context-Aware Suggestions

When Chiko detects certain user patterns, it can proactively suggest custom blocks:

- **User sets a website** in company branding → "Want me to add a QR code for your website on the form?"
- **User uploads an image** via Layer 2 → "Want me to place this image on your form as a custom block?"
- **User mentions "divider" or "separator"** → Offer a divider block
- **User mentions "tagline" or "thank you message"** → Offer a text block
- **User mentions "QR"** → Offer a QR code block

These suggestions come naturally from the AI's understanding of the available actions — no special code needed beyond having the actions registered.

---

## 10. Acceptance Criteria — Done When...

### 10.1 Schema + Types
- [ ] `CustomBlock` discriminated union with 6 block types is defined and exported
- [ ] `BlockPosition` type with 4 positions is defined
- [ ] `createDefaultBlock(type)` factory generates correct defaults for each type
- [ ] `SalesBookFormData` includes `customBlocks: CustomBlock[]` (default empty array)
- [ ] `createDefaultSalesBookForm()` includes `customBlocks: []`
- [ ] `convertSalesBookType()` preserves custom blocks

### 10.2 Store
- [ ] `addCustomBlock(type, overrides?)` creates a block, pushes to array, returns ID
- [ ] `updateCustomBlock(blockId, patch)` finds and updates the correct block
- [ ] `removeCustomBlock(blockId)` removes the block from the array
- [ ] `reorderCustomBlocks(fromIndex, toIndex)` swaps blocks correctly
- [ ] All 4 actions are undoable via Zundo (temporal middleware)
- [ ] Store types are clean — no TypeScript errors

### 10.3 Renderer
- [ ] `CustomBlocksRegion` renders blocks filtered by position
- [ ] QR code blocks render as `<img>` with generated QR code PNG
- [ ] Text blocks render with correct font size, weight, color, and style
- [ ] Divider blocks render as styled `<hr>` or `<div>` with correct style/thickness/color
- [ ] Spacer blocks render as empty `<div>` with correct height
- [ ] Image blocks render as `<img>` with correct dimensions, opacity, and object-fit
- [ ] Signature box blocks render as a line with label text below
- [ ] `"accent"` color keyword resolves to the form's accent color
- [ ] Density scaling is applied to all dimensions
- [ ] `enabled: false` blocks are not rendered
- [ ] Custom blocks appear at the correct positions in both `BlankFormSlip` and `BlankReceiptSlip`

### 10.4 Sidebar UI
- [ ] "Custom Blocks" accordion section appears between "Brand Logos" and "Start Over"
- [ ] "+ Add Block" button shows type selector with 6 block types
- [ ] Each block in the list shows type icon, brief description, enable toggle, and delete button
- [ ] Block cards expand to show type-specific configuration fields
- [ ] Drag-and-drop reordering works via `@dnd-kit/sortable`
- [ ] Image block has a file picker that accepts PNG/JPEG/SVG
- [ ] All configuration changes update the preview in real-time
- [ ] Empty state message shows when no blocks exist

### 10.5 Chiko Integration
- [ ] Sales book manifest has 4 new actions: addCustomBlock, updateCustomBlock, removeCustomBlock, reorderCustomBlocks
- [ ] Chiko can add a QR code via natural language
- [ ] Chiko can add a text block via natural language
- [ ] Chiko can add a divider via natural language
- [ ] `getState()` includes custom blocks summary in tool state
- [ ] Image blocks support `__ATTACHED_IMAGE_N__` placeholder from Layer 2
- [ ] removeCustomBlock is marked as destructive (requires confirmation)

### 10.6 Print + Export
- [ ] Custom blocks appear in PDF export (html2canvas captures them)
- [ ] QR codes are fully rendered (not blank) at export time
- [ ] Multiple blocks at the same position render in correct order
- [ ] Blocks scale correctly at 2-per-page and 3-per-page densities

### 10.7 Build Quality
- [ ] Zero TypeScript errors (`npx tsc --noEmit` passes)
- [ ] `qrcode` and `@types/qrcode` packages are installed
- [ ] No new runtime errors in browser console
- [ ] Existing form rendering is unchanged when `customBlocks` is empty
- [ ] Existing Chiko functionality (Layer 1 actions, Layer 2 file upload) still works

---

## 11. What NOT to Touch

- **Do not modify `chiko-actions.ts`** (the registry store). No changes needed.
- **Do not modify `useChikoActions.ts`** (the registration hook). No changes needed.
- **Do not modify any Chiko component files** (`ChikoAssistant.tsx`, `ChikoFAB.tsx`, etc.). The action system already handles everything.
- **Do not modify export files** (`export.ts`). Custom blocks auto-render in DOM.
- **Do not modify `globals.css` or theme tokens.**
- **Do not modify `chiko.ts`** (the Chiko store). No state changes needed there.
- **Do not modify the resume system.** Out of scope for Layer 3.
- **Do not modify the vNext canvas editor system.** Completely different paradigm.
- **Do not add npm dependencies beyond `qrcode` + `@types/qrcode`.** Everything else is already installed.
- **Do not refactor or restructure the `BlankFormRenderer`.** Only add `<CustomBlocksRegion>` calls at the 4 insertion points.

---

## 12. Risk Considerations

### 12.1 QR Code Async in Synchronous Renderer

The `qrcode` library's `toDataURL()` is async. The form renderer is called synchronously inside `.map()` loops. The recommended approach is a small `QRCodeBlockRender` wrapper component with its own `useState`/`useEffect`. This creates a brief flash where the QR code placeholder shows before the data URI generates, but it's <10ms and only happens on initial render or URL change. For export: call `await new Promise(r => setTimeout(r, 100))` before `html2canvas` to ensure QR codes are rendered.

If the builder finds a synchronous QR library (like `qrcode-generator`), that's even better — but `qrcode` is the standard and most reliable.

### 12.2 Space Overflow in Multi-Form Layouts

Adding custom blocks at 3-per-page density could push content past the slip boundary. This is an inherent tradeoff — the user has full preview visibility and can see exactly what will print. No programmatic solution is needed beyond the live preview.

### 12.3 Base64 Image Size in Store

Image blocks store base64 data URIs in Zustand state. A 1 MB image = ~1.37 MB in base64. The Zundo undo history stores snapshots, so each image block change duplicates this data.

**Mitigation:**
- Cap image blocks at 2 MB file size (same as Layer 2 image cap)
- The undo history has a `limit: 100` — old snapshots are discarded
- Since `fast-deep-equal` is used for equality checks, identical snapshots don't create new history entries
- localStorage persistence: `customBlocks` should be included in persistence (unlike attachments) because users expect their blocks to be saved. If images cause localStorage to exceed quota, the persist middleware should handle it gracefully (Zustand's persist has an `onRehydrateStorage` hook).

### 12.4 Invoice System Scope

The invoice rendering system may not be fully built yet (the research found no dedicated invoice renderer component). If the invoice workspace doesn't have a renderer that supports insertion points, **add the manifest actions but defer the renderer integration** to when the invoice renderer is built. The store CRUD actions can be added regardless.

---

## 13. Estimated Scope

**New files:** 3 (custom-blocks.ts, CustomBlockRenderer.tsx, SBSectionCustomBlocks.tsx)
**Modified files:** 6 (schema.ts, sales-book-editor store, BlankFormRenderer, workspace, 2 manifests)
**New dependencies:** 1 (`qrcode` + types)
**Lines of code (rough estimate):** 500-700 new lines, 150-250 modified lines
**Complexity hot spots:**
- QR code async rendering (wrapper component approach)
- Drag-and-drop block reordering UI (dnd-kit integration)
- Discriminated union type handling across schema/store/renderer/manifest

---

## 14. Post-Build Checklist

After Layer 3 is built and verified:

1. Run `npx tsc --noEmit` — must pass with zero errors
2. Test: Add a QR code block → verify it renders on the preview
3. Test: Add a text block → verify font size/weight/color work
4. Test: Add a divider → verify style/thickness/color/width work
5. Test: Add a spacer → verify height adjusts space
6. Test: Add an image block → pick a file → verify image renders
7. Test: Add a signature box → verify line and label render
8. Test: Multiple blocks → verify correct order at same position
9. Test: Different positions → verify blocks appear at correct form regions
10. Test: Drag-and-drop reorder → verify blocks swap correctly
11. Test: Toggle block off → verify it disappears from preview
12. Test: Delete block → verify it's removed
13. Test: 3-per-page layout → verify blocks render at receipt density
14. Test: Export to PDF → verify all blocks (including QR codes) appear
15. Test: Undo/redo → verify block add/remove/update are undoable
16. Test: Ask Chiko "add a QR code with my website" → verify it works
17. Test: Empty customBlocks → verify existing forms render identically to pre-Layer-3
18. Update memory bank (`activeContext.md`, `progress.md`) with Layer 3 completion status
19. Add a "Reality vs. Plan" note to the Layer 3 section of `CHIKO-AGENT-ARCHITECTURE.md`
20. Only then: begin writing `CHIKO-LAYER-4-SPEC.md` for Business Memory
