# Chiko Layer 2 — File Processing Pipeline Build Specification

> **Document Type:** Consumable build spec (becomes history after implementation)
> **Depends on:** Layer 1 (Action System) — COMPLETE ✅
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
5. `PHASES/CHIKO-AGENT-ARCHITECTURE.md` — Big-picture architecture (Layer 2 section especially)

**Layer 1 Files (the system you are extending):**
6. `src/stores/chiko-actions.ts` — Action registry store (contracts, register/unregister/execute)
7. `src/hooks/useChikoActions.ts` — Registration hook pattern
8. `src/lib/chiko/manifests/sales-book.ts` — Example manifest (see how actions dispatch to stores)
9. `src/app/api/chiko/route.ts` — API endpoint with tool-use protocol, `__CHIKO_ACTION__` stream events
10. `src/components/Chiko/ChikoAssistant.tsx` — Chat panel with action execution pipeline

**Chiko Core:**
11. `src/stores/chiko.ts` — Chiko state store (ChikoMessage, ChikoContext, executedActions)
12. `src/components/Chiko/index.ts` — Barrel exports

**Tool Stores (targets for auto-fill):**
13. `src/stores/sales-book-editor.ts` — Sales book store actions
14. `src/stores/invoice-editor.ts` — Invoice store actions
15. `src/stores/resume-editor.ts` — Resume store actions
16. `src/lib/sales-book/schema.ts` — CompanyBranding type (fields Chiko fills from extracted data)

---

## 2. Current State — What Exists Right Now

### 2.1 Layer 1 Action System (Built — Working)

Layer 1 is complete. Chiko can control tool stores via natural language:
- **Registry:** `src/stores/chiko-actions.ts` — `useChikoActionRegistry` with `register`, `unregister`, `execute`, `readState`, `getActionDescriptorsForAI`
- **Hook:** `src/hooks/useChikoActions.ts` — `useChikoActions(manifestFactory)` handles mount/unmount
- **Manifests:** `src/lib/chiko/manifests/` — sales-book (9 actions), invoice (18 actions), resume (13 actions)
- **API:** `src/app/api/chiko/route.ts` — Accepts `{ messages, context, actions, toolState }`, uses Claude tool_use / OpenAI function_calling, emits `__CHIKO_ACTION__:{json}` in stream
- **Client:** `src/components/Chiko/ChikoAssistant.tsx` — Parses `__CHIKO_ACTION__:` events, executes via registry, destructive confirmation UI, tracks `executedActions`
- **Stream protocol:** `__CHIKO_ACTION__:{json}\n` delimiter for action events in mixed text+action stream

### 2.2 Installed Dependencies (Already Available)

These npm packages are already in `package.json` — do NOT re-install them:

| Package | Version | Purpose |
|---------|---------|---------|
| `pdf-parse` | ^2.4.5 | Extract text from PDF files |
| `@types/pdf-parse` | ^1.1.5 | TypeScript types for pdf-parse |
| `mammoth` | ^1.11.0 | Extract text, headings, tables from DOCX files |
| `sharp` | (transitive via Next.js) | Image processing — resize, convert, metadata extraction |
| `jszip` | ^3.10.1 | ZIP handling (used by mammoth internally, also for XLSX parsing) |

### 2.3 Missing Dependencies

| Package | Purpose | Needs Installing |
|---------|---------|-----------------|
| `xlsx` (SheetJS) | Parse XLSX/XLS spreadsheets, extract sheets/rows/columns | **Yes — install** |

**Note:** `xlsx` is the standard for spreadsheet parsing in Node.js. The community edition (`xlsx`) works for reading. Install it before building.

### 2.4 ChikoAssistant — No File UI Yet

The current Chiko chat panel (`ChikoAssistant.tsx`, ~1150 lines post-Layer-1) has:
- Text input with auto-resize textarea
- Slash command autocomplete overlay
- Action execution pipeline (Layer 1)
- Destructive action confirmation bar
- Quick suggestion chips
- **No file upload button, no drag-and-drop zone, no file preview**

### 2.5 API Routes — No Upload Route

There is no `/api/chiko/upload` or similar route. The only Chiko endpoint is `POST /api/chiko` which accepts JSON (text messages + actions). File upload requires a new route that accepts `multipart/form-data`.

---

## 3. Goal — What the User Experiences After Layer 2

When Layer 2 is complete:

**Drag-and-drop a logo:**
> *(User drags company-logo.png onto Chiko's chat panel)*
> Chiko: "Got your logo! 🖼️ It's a **1200×400 PNG** image. Want me to set it as your company logo?"
> User: "Yes"
> Chiko: *(calls `updateBranding({ logoUrl: "data:image/png;base64,..." })`)* "Done! Your logo is now on the form. ✨"

**Upload a PDF invoice:**
> *(User clicks the attachment button and selects existing-invoice.pdf)*
> Chiko: "I extracted the following from your PDF:
> - **Company:** Dramac Solutions Ltd
> - **Address:** Plot 123, Cairo Road, Lusaka
> - **Phone:** +260 977 123 456
> - **Email:** info@dramac.com
> - **TPIN:** 1234567890
> 
> Want me to fill in your form with these details?"
> User: "Yes, all of it"
> Chiko: *(calls `updateBranding({ name: "Dramac Solutions Ltd", address: "Plot 123, Cairo Road, Lusaka", ... })`)* "All filled in! Check the preview. 🚀"

**Upload a spreadsheet:**
> *(User uploads price-list.xlsx)*
> Chiko: "Found a spreadsheet with **3 sheets**. Sheet 1 ('Products') has **47 rows** and columns: Product Name, SKU, Unit Price, Quantity. Want me to use this data?"
> User: "Yes, add those as line items"
> Chiko: *(calls `addLineItem` for each row)* "Added 47 line items from your price list! 📊"

**Upload a Word document:**
> *(User uploads company-profile.docx)*
> Chiko: "Extracted from your document:
> - **Title:** Dramac Solutions Company Profile
> - **Headings found:** 8
> - **Tables found:** 2
> - **Images found:** 1 (company logo)
> 
> I can see your company details in this. Want me to pull the branding info?"

**What does NOT work yet after Layer 2:**
- Custom visual blocks in designs (Layer 3)
- Remembering files/data across sessions (Layer 4)
- Multi-tool workflows (Layer 5)

---

## 4. TypeScript Contracts

### 4.1 Extracted File Data (Normalized Output from All Extractors)

```typescript
/** Unified output from any file extractor */
interface ExtractedFileData {
  /** Original filename */
  fileName: string;
  
  /** MIME type of the uploaded file */
  mimeType: string;
  
  /** File size in bytes */
  fileSize: number;
  
  /** Type of extraction that was performed */
  extractionType: "pdf" | "docx" | "xlsx" | "image";
  
  /** Extracted text content (full text, paragraphs joined by newlines) */
  text?: string;
  
  /** Structured text blocks (headings, paragraphs, with hierarchy) */
  textBlocks?: TextBlock[];
  
  /** Extracted tables (2D arrays of cell strings) */
  tables?: ExtractedTable[];
  
  /** Extracted or uploaded images as base64 data URIs */
  images?: ExtractedImage[];
  
  /** Document metadata (author, title, dates) */
  metadata?: Record<string, string>;
  
  /** For XLSX: sheet names and basic info */
  sheets?: SheetInfo[];
  
  /** AI-generated summary of what was found (from the extraction step) */
  summary: string;
}
```

### 4.2 Text Block

```typescript
interface TextBlock {
  /** Block type */
  type: "heading" | "paragraph" | "list-item";
  
  /** Heading level (1-6) if type is "heading" */
  level?: number;
  
  /** The text content */
  content: string;
}
```

### 4.3 Extracted Table

```typescript
interface ExtractedTable {
  /** Optional table title or caption */
  title?: string;
  
  /** Whether the first row appears to be headers */
  hasHeaders: boolean;
  
  /** Header row (if hasHeaders is true) */
  headers?: string[];
  
  /** Data rows — each row is an array of cell strings */
  rows: string[][];
}
```

### 4.4 Extracted Image

```typescript
interface ExtractedImage {
  /** Base64 data URI (e.g., "data:image/png;base64,...") */
  dataUri: string;
  
  /** Image width in pixels */
  width: number;
  
  /** Image height in pixels */
  height: number;
  
  /** MIME type (image/png, image/jpeg, image/svg+xml) */
  mimeType: string;
  
  /** Original filename or generated name */
  name: string;
}
```

### 4.5 Sheet Info (XLSX)

```typescript
interface SheetInfo {
  /** Sheet name */
  name: string;
  
  /** Number of data rows (excluding empty) */
  rowCount: number;
  
  /** Column headers (first row values) */
  columns: string[];
}
```

### 4.6 Upload Request/Response

```typescript
/** Client sends this to the upload API */
// (multipart/form-data with a "file" field — not a JSON interface)

/** Server responds with this */
interface FileUploadResponse {
  success: boolean;
  data?: ExtractedFileData;
  error?: string;
}
```

### 4.7 Chiko File Attachment (Client-Side State)

```typescript
/** Attached file state in the Chiko store */
interface ChikoFileAttachment {
  /** Unique ID for this attachment */
  id: string;
  
  /** Original filename */
  fileName: string;
  
  /** File size in bytes */
  fileSize: number;
  
  /** MIME type */
  mimeType: string;
  
  /** Upload status */
  status: "pending" | "uploading" | "processing" | "ready" | "error";
  
  /** Upload progress (0-100) */
  progress: number;
  
  /** Extracted data (populated when status is "ready") */
  extractedData?: ExtractedFileData;
  
  /** Error message (populated when status is "error") */
  error?: string;
  
  /** Thumbnail preview for images (small base64 data URI) */
  thumbnail?: string;
}
```

---

## 5. Files to Create

### 5.1 `src/app/api/chiko/upload/route.ts` — File Upload API Route

**Purpose:** Server-side endpoint that accepts file uploads, extracts structured data, and returns it.

**What it does:**
1. Accepts `POST` with `multipart/form-data` containing a single `file` field
2. Validates: file exists, size is within limit, MIME type is allowed
3. Reads the file into a `Buffer` in memory (never writes to disk)
4. Routes to the appropriate extractor based on MIME type
5. Returns a `FileUploadResponse` JSON object

**Validation rules:**
- Maximum file size: **10 MB** (configurable via constant)
- Allowed MIME types:
  - PDF: `application/pdf`
  - DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - XLSX: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`
  - Images: `image/png`, `image/jpeg`, `image/jpg`, `image/svg+xml`, `image/webp`
- File field name must be `file`
- Only ONE file per request

**Error responses:**
- 400: Missing file, file too large, unsupported type
- 500: Extraction failed (with sanitized error message — never expose internal paths or stack traces)

**Security:**
- No file is ever written to disk — everything happens in memory
- Filenames from the client are never used to construct file paths
- Extracted data is sanitized: no script tags, no executable content
- SVG content is sanitized before being passed through (remove `<script>`, event handlers, external references)
- Base64 image data is validated as legitimate image data before returning

### 5.2 `src/lib/chiko/extractors/pdf-extractor.ts` — PDF Extraction

**Purpose:** Extract text, metadata, and page info from PDF buffers.

**Uses:** `pdf-parse` (already installed)

**What it extracts:**
- Full text content (all pages concatenated, with page separators)
- Page count
- Metadata: title, author, creator, creation date, modification date
- **Heuristic field detection:** After extracting text, apply regex patterns to identify common business fields:
  - Company name (first prominent text line, or text near a logo)
  - Phone numbers (regex: international phone patterns)
  - Email addresses (regex: standard email pattern)
  - Physical addresses (multi-line text blocks with city/country patterns)
  - Tax ID / TPIN (regex: numeric strings near "TPIN", "Tax ID", "TIN" labels)
  - Website URLs (regex: URLs starting with http/https or www)
  - Bank details (text near "Bank", "Account", "Branch" labels)

**Output:** `ExtractedFileData` with `extractionType: "pdf"`, populated `text`, `metadata`, and `textBlocks`

**Important:** `pdf-parse` does not extract images from PDFs reliably. Do NOT attempt image extraction from PDFs — just extract text. If the user needs to extract a logo from a PDF, tell them to export/screenshot the logo as a PNG and upload that separately.

### 5.3 `src/lib/chiko/extractors/docx-extractor.ts` — DOCX Extraction

**Purpose:** Extract text, headings, tables, and embedded images from DOCX buffers.

**Uses:** `mammoth` (already installed)

**What it extracts:**
- Full text as HTML (mammoth's default output), then stripped to plain text for the `text` field
- Headings with hierarchy (mammoth preserves heading levels)
- Tables (mammoth converts to HTML tables — parse the HTML to extract `ExtractedTable` arrays)
- Embedded images (mammoth provides image callbacks — extract as base64 data URIs)
- Apply the same heuristic field detection regex patterns as the PDF extractor

**Output:** `ExtractedFileData` with `extractionType: "docx"`, populated `text`, `textBlocks`, `tables`, and `images`

**Note on mammoth's image handling:**
Mammoth provides an `options.convertImage` callback that receives each embedded image with its buffer and content type. Use this to convert images to base64 data URIs and collect them in the `images` array. Limit total image data to 5 MB to prevent response bloat — if images exceed this, include only the first few and note that others were omitted.

### 5.4 `src/lib/chiko/extractors/xlsx-extractor.ts` — XLSX Extraction

**Purpose:** Extract sheet names, column headers, and row data from XLSX buffers.

**Uses:** `xlsx` (needs to be installed)

**What it extracts:**
- All sheet names
- For each sheet: column headers (first row), row count, and the actual row data
- Cell values are converted to strings (numbers formatted, dates formatted, booleans as "Yes"/"No")
- Empty rows are skipped
- Maximum 500 rows per sheet (truncate with a note if more)

**Output:** `ExtractedFileData` with `extractionType: "xlsx"`, populated `sheets` and `tables`

**Heuristic detection:**
- If columns contain headers like "Name", "Company", "Phone", "Email", "Address" — recognize this as a contacts/business data sheet
- If columns contain "Price", "Qty", "Amount", "Description" — recognize as a line-items/product sheet
- Include this recognition in the `summary` field

### 5.5 `src/lib/chiko/extractors/image-extractor.ts` — Image Extraction

**Purpose:** Process uploaded images — validate, get dimensions, generate thumbnail, return as data URI.

**Uses:** Native Node.js `Buffer` operations. For dimension detection, use basic header parsing (PNG/JPEG headers contain dimensions) or `sharp` if available via Next.js.

**What it does:**
- Validate the image buffer (check magic bytes match the declared MIME type)
- Extract dimensions (width × height)
- Generate a small thumbnail (max 200px wide) for preview in the chat panel
- Convert the full image to a base64 data URI
- For SVG: sanitize the SVG content (remove `<script>`, `on*` event handlers, `xlink:href` to external URLs, `<use>` with external references), then return as `data:image/svg+xml;base64,...`

**Output:** `ExtractedFileData` with `extractionType: "image"`, populated `images` (single image in the array) and `summary` (e.g., "1200×400 PNG image, 245 KB")

**Size limit:** If the image is larger than 2 MB after base64 encoding, resize it to a maximum dimension of 2000px (maintaining aspect ratio) before encoding. This prevents massive data URIs from bloating the client state and API payloads.

### 5.6 `src/lib/chiko/extractors/index.ts` — Barrel Export + Router

**Purpose:** Single entry point that routes a file buffer to the correct extractor based on MIME type.

**What it exports:**
- `extractFile(buffer: Buffer, fileName: string, mimeType: string): Promise<ExtractedFileData>` — The main router function
- All individual extractors (for direct use if needed)
- All TypeScript types (`ExtractedFileData`, `TextBlock`, `ExtractedTable`, `ExtractedImage`, `SheetInfo`)

### 5.7 `src/lib/chiko/extractors/field-detector.ts` — Heuristic Business Field Detection

**Purpose:** Shared utility that scans extracted text for common business data fields using regex patterns.

**What it detects:**
- **Company name:** First heading or first line of prominent text
- **Phone numbers:** International patterns (+260..., +1..., etc.), local patterns with area codes
- **Email addresses:** Standard email regex
- **Physical addresses:** Multi-line blocks that look like street addresses (contains number + street/road/avenue + city)
- **Tax IDs / TPIN:** Numeric strings (6-12 digits) near "TPIN", "Tax ID", "TIN", "VAT" labels
- **Website URLs:** http/https URLs, www. prefixes
- **Banking details:** Text near "Bank", "Account", "SWIFT", "IBAN", "Branch" labels

**Output:** A plain object mapping field names to detected values:
```typescript
interface DetectedBusinessFields {
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  taxId?: string;
  bankName?: string;
  bankAccount?: string;
  bankBranch?: string;
  [key: string]: string | undefined;  // Allow additional detected fields
}
```

This is used by the PDF and DOCX extractors to enrich their output. The detected fields are included in the `summary` and also passed to the AI so it can map them to tool actions.

---

## 6. Files to Modify

### 6.1 `src/stores/chiko.ts` — Add File Attachment State

**Current state:** Has `ChikoMessage`, `ChikoContext`, `inputDraft`, UI state, message CRUD. No file state.

**Changes needed:**

1. **Add `ChikoFileAttachment` interface** to the module (see contract in Section 4.7)

2. **Add file state to `ChikoState`:**
   - `attachments: ChikoFileAttachment[]` — Currently attached files (pending upload or ready)
   
3. **Add file actions:**
   - `addAttachment(file: { fileName: string; fileSize: number; mimeType: string }) => string` — Creates a new pending attachment, returns its ID
   - `updateAttachment(id: string, patch: Partial<ChikoFileAttachment>) => void` — Updates attachment status, progress, extracted data
   - `removeAttachment(id: string) => void` — Removes an attachment
   - `clearAttachments() => void` — Removes all attachments

4. **Do NOT persist attachments.** Add `attachments` to the default state (empty array) but exclude it from the `partialize` function in the persist config. File data can be large and should not be saved to localStorage.

### 6.2 `src/components/Chiko/ChikoAssistant.tsx` — Add File Upload UI + Integration

**Current state:** ~1150 lines. Has text input, slash commands, action execution. No file handling.

**Changes needed:**

1. **Add a file attachment button** next to the send button in the input area. A small paperclip or "+" icon that opens a native file picker (`<input type="file">`) with the allowed MIME types.

2. **Add drag-and-drop support** on the entire chat panel. When a file is dragged over the panel:
   - Show a visual drop zone indicator (subtle border highlight or overlay)
   - On drop: capture the file and start the upload flow

3. **File upload flow (triggered by button or drop):**
   - Validate file size and type client-side (reject immediately if invalid, show error in chat)
   - Call `addAttachment()` to create a pending attachment in the store
   - Show a compact file preview chip in the input area (filename, size, progress bar)
   - `POST` the file to `/api/chiko/upload` as `multipart/form-data`
   - Update attachment status as it progresses: `uploading` → `processing` → `ready` or `error`
   - When `ready`: store the `ExtractedFileData` on the attachment

4. **Include extracted file data in the next message to the AI:**
   When the user sends a message AND there are `ready` attachments:
   - Add the extracted data summary to the user's message context (not inline in the text — as a separate `fileContext` field in the API body)
   - The AI sees: "The user uploaded [filename]. Extracted data: [summary]. Detected fields: [detected fields]. The user said: [their message]"
   - After sending, clear the attachments

5. **Auto-send on upload (optional enhancement):**
   If the user drops/attaches a file without typing a message, Chiko should automatically add a system-level prompt like "The user uploaded a file. Analyze the contents and offer to use the data." This triggers the AI to respond with suggestions.

6. **File preview in chat messages:**
   When a message includes file context, show a compact file badge in the message bubble:
   - File icon (document, image, spreadsheet, etc.)  based on type
   - Filename and size
   - Image files: show the thumbnail inline

### 6.3 `src/app/api/chiko/route.ts` — Accept File Context

**Current state:** POST accepts `{ messages, context, actions, toolState }`. No file data.

**Changes needed:**

1. **Accept a `fileContext` field** in the POST body:
   ```typescript
   fileContext?: {
     fileName: string;
     extractionType: string;
     summary: string;
     detectedFields?: Record<string, string>;
     tables?: { title?: string; headers?: string[]; rowCount: number }[];
     images?: { name: string; width: number; height: number; mimeType: string }[];
   };
   ```
   This is a SUMMARY of the extracted data — NOT the full data (no raw text, no base64 images). The full data lives on the client.

2. **Append file context to the system prompt** when `fileContext` is present:
   ```
   ## Uploaded File
   The user uploaded: [fileName] ([extractionType])
   Summary: [summary]
   Detected business fields: [JSON of detectedFields]
   Tables found: [table summaries]
   Images found: [image summaries]
   
   Use the detected fields to suggest filling in the user's current tool. 
   Call the appropriate actions to populate fields. Always confirm with the 
   user before making changes based on extracted data.
   ```

3. **Do NOT send base64 image data to the AI.** The AI only sees metadata (dimensions, filename, MIME type). The actual image data is stored client-side and applied via Layer 1 actions when the AI decides to set a logo.

### 6.4 `src/lib/chiko/manifests/sales-book.ts` — Add Logo Action

**Current state:** Has 9 actions. `updateBranding` accepts text fields but `logoUrl` is not in the parameters schema.

**Changes needed:**

Add `logoUrl` to the `updateBranding` action's parameters:
```
logoUrl: { type: "string", description: "Company logo as a data URI (base64 encoded image)" }
```

The store's `updateBranding` already accepts `Partial<CompanyBranding>`, and the schema has `logoUrl: z.string().optional()`, so the store side already supports it. Only the manifest's parameter schema needs the addition.

### 6.5 `src/lib/chiko/manifests/invoice.ts` — Add Logo Action

**Same change:** Add `logoUrl` to the `updateBusinessInfo` action's parameters schema.

### 6.6 `src/lib/chiko/manifests/resume.ts` — No Changes Needed

The resume schema does not use company logos in the same way. No changes required for Layer 2.

---

## 7. Data Flow — End to End

### 7.1 Image Upload: Logo Placement

```
1. User drags company-logo.png onto Chiko's chat panel
   ↓
2. ChikoAssistant detects the dropped file:
   - Validates: image/png, 245 KB (under 10 MB limit)
   - Calls addAttachment({ fileName: "company-logo.png", fileSize: 245000, mimeType: "image/png" })
   - Shows file chip in input area with "Uploading..." status
   ↓
3. POST /api/chiko/upload with FormData containing the file
   ↓
4. Upload route:
   - Reads file into Buffer
   - Detects MIME type: image/png
   - Routes to image-extractor
   ↓
5. Image extractor:
   - Validates PNG magic bytes
   - Extracts dimensions: 1200×400
   - Generates 200px-wide thumbnail
   - Converts full image to base64 data URI
   - Returns ExtractedFileData {
       fileName: "company-logo.png",
       mimeType: "image/png",
       fileSize: 245000,
       extractionType: "image",
       images: [{ dataUri: "data:image/png;base64,...", width: 1200, height: 400, mimeType: "image/png", name: "company-logo.png" }],
       summary: "1200×400 PNG image (245 KB)"
     }
   ↓
6. Client receives response:
   - updateAttachment(id, { status: "ready", extractedData: ..., thumbnail: ... })
   - File chip shows ✓ ready state
   ↓
7. User doesn't type a message — auto-prompt triggers:
   - Sends message with fileContext: { fileName, extractionType: "image", summary: "1200×400 PNG image" }
   ↓
8. API route appends to system prompt:
   "The user uploaded: company-logo.png (image). Summary: 1200×400 PNG image (245 KB). 
    Suggest setting it as the company logo."
   ↓
9. Claude responds:
   - Text: "Got your logo! 🖼️ It's a **1200×400 PNG** image. Want me to set it as your company logo?"
   - No tool_use call yet (waiting for user confirmation)
   ↓
10. User: "Yes"
    ↓
11. Next message to API includes actions + toolState as before.
    Claude sees the logo data is available and responds:
    - tool_use: sales_book_editor__updateBranding({ logoUrl: "data:image/png;base64,..." })
    - Text: "Done! Your logo is now on the form. ✨"
    ↓
12. ChikoAssistant executes the action:
    - registry.execute("sales-book-editor", "updateBranding", { logoUrl: "data:image/png;base64,..." })
    - The image data URI was stored on the client-side attachment — the AI references it
    ↓
13. Form preview updates instantly with the logo.
```

**Critical detail for step 11-12:** The AI needs to know the actual base64 data URI to include it in the action call. However, sending the full base64 to the AI would be extremely expensive (token-wise). **Solution:** When the user confirms logo placement, the client-side code should handle this special case:

- The AI responds with: `updateBranding({ logoUrl: "__ATTACHED_IMAGE_0__" })`
- The client intercepts this placeholder and replaces it with the actual base64 data URI from the attachment before executing the action
- This keeps the AI token usage minimal while still enabling image placement

Alternatively, simpler approach: When the message includes an image attachment and the AI calls `updateBranding`, the client automatically checks if any ready image attachments exist and injects the `logoUrl` from the first image attachment into the params. The AI just needs to call `updateBranding({})` or `updateBranding({ name: "..." })` while on a page with a pending image — the client fills in the `logoUrl`.

**Choose the approach that is simpler to implement.** The simpler alternative is recommended.

### 7.2 PDF Upload: Business Data Extraction

```
1. User clicks attachment button → selects existing-invoice.pdf
   ↓
2. File validated, uploaded to /api/chiko/upload
   ↓
3. PDF extractor:
   - pdf-parse extracts text: "INVOICE\nDramac Solutions Ltd\nPlot 123, Cairo Road...\n+260 977 123 456..."
   - field-detector runs regex patterns:
     - companyName: "Dramac Solutions Ltd"
     - address: "Plot 123, Cairo Road, Lusaka"
     - phone: "+260 977 123 456"
     - email: "info@dramac.com"
     - taxId: "1234567890"
   - summary built: "PDF invoice, 2 pages. Detected: company name, address, phone, email, TPIN"
   ↓
4. Client receives ExtractedFileData, shows file chip
   ↓
5. Auto-prompt sends to API with fileContext including detectedFields
   ↓
6. Claude sees detected fields and responds:
   "I extracted the following from your PDF:
   - **Company:** Dramac Solutions Ltd
   - **Address:** Plot 123, Cairo Road, Lusaka
   - **Phone:** +260 977 123 456
   - **Email:** info@dramac.com
   - **TPIN:** 1234567890
   
   Want me to fill in your form with these details?"
   ↓
7. User: "Yes, all of it"
   ↓
8. Claude calls:
   tool_use: sales_book_editor__updateBranding({
     name: "Dramac Solutions Ltd",
     address: "Plot 123, Cairo Road, Lusaka",
     phone: "+260 977 123 456",
     email: "info@dramac.com",
     taxId: "1234567890"
   })
   ↓
9. Action executes, form updates instantly.
```

### 7.3 XLSX Upload: Line Item Population

```
1. User uploads price-list.xlsx
   ↓
2. XLSX extractor:
   - Reads 3 sheets
   - Sheet "Products": 47 rows, columns: ["Product Name", "SKU", "Unit Price", "Quantity"]
   - Detected as: line-items/product data
   - summary: "XLSX with 3 sheets. 'Products' sheet has 47 rows: Product Name, SKU, Unit Price, Quantity"
   ↓
3. fileContext sent to Claude with sheet info and column headers
   ↓
4. Claude responds with a summary and offers to add line items
   ↓
5. User confirms → Claude calls addLineItem for each row
   (or calls a batch action if available on the tool)
```

### 7.4 No Tool Page: File Uploaded on Dashboard

```
1. User is on /dashboard (no tool registered, no actions available)
   ↓
2. User uploads a file
   ↓
3. File is processed normally (extraction still works)
   ↓
4. Claude sees the extracted data but has NO tool actions available
   ↓
5. Claude responds: "I extracted your company details! To use this data, 
    head to a tool like the **Sales Book Designer** (/tools/documents/invoice-designer)
    and I'll fill in the form for you."
   ↓
6. User navigates to the tool → Chiko can now use the data
   (Extracted data persists in attachments until cleared)
```

---

## 8. Prompt Engineering Notes

### 8.1 Additional System Prompt When Files Are Present

When `fileContext` is included in the request, append:

```
## Uploaded File Context
The user has uploaded a file. Here are the extracted details:

File: {fileName} ({extractionType}, {fileSize formatted})
Summary: {summary}

{If detectedFields:}
Detected Business Fields:
{JSON.stringify(detectedFields, null, 2)}

{If tables:}
Tables Found: {tables.length}
{For each table: "- {title}: {headers.join(', ')} ({rowCount} rows)"}

{If images:}
Images Found: {images.length}
{For each image: "- {name}: {width}×{height} {mimeType}"}

Instructions:
- Present the extracted information clearly to the user
- Offer to use the data to populate the current tool's fields
- Always confirm with the user before making changes
- For images: offer to set as company logo if on a branding-enabled tool
- For tables: explain what data you found and how you'd map it to the tool
- If no tool actions are available, suggest which tool the user should navigate to
```

### 8.2 Image Placeholder Convention

When the AI wants to set a logo from an uploaded image, it should reference a placeholder:
- Convention: `"__ATTACHED_IMAGE_0__"` for the first attached image, `"__ATTACHED_IMAGE_1__"` for the second, etc.
- Include this instruction in the system prompt when images are in the file context:
  ```
  When you want to set a logo or image from the uploaded file, use the 
  placeholder "__ATTACHED_IMAGE_0__" as the value. The client will 
  replace this with the actual image data.
  ```
- The client-side action executor intercepts these placeholders and replaces them with the real base64 data URI from the attachment

---

## 9. Acceptance Criteria — Done When...

### 9.1 File Upload Infrastructure
- [ ] `POST /api/chiko/upload` route exists and accepts multipart/form-data
- [ ] File size validation rejects files over 10 MB with a clear error message
- [ ] MIME type validation rejects unsupported file types
- [ ] No file is ever written to disk — all processing is in-memory
- [ ] SVG content is sanitized (no scripts, no event handlers, no external references)

### 9.2 Extractors
- [ ] PDF extractor returns text content, metadata, and heuristically detected business fields
- [ ] DOCX extractor returns text, headings, tables, and embedded images
- [ ] XLSX extractor returns sheet names, column headers, and row data (max 500 rows/sheet)
- [ ] Image extractor validates image buffers, extracts dimensions, generates thumbnails, returns data URIs
- [ ] Image extractor resizes images larger than 2 MB to a max dimension of 2000px
- [ ] Field detector identifies phone, email, address, company name, tax ID, and banking details from text
- [ ] All extractors return normalized `ExtractedFileData` objects

### 9.3 Client-Side Integration
- [ ] Chiko chat panel has a file attachment button (paperclip icon near input)
- [ ] Drag-and-drop works on the entire chat panel with a visual indicator
- [ ] File upload progress is shown as a compact chip in the input area
- [ ] Uploaded images show a thumbnail preview in the chat
- [ ] File context (summary, detected fields) is sent to the AI in the next message
- [ ] Auto-prompt triggers when a file is uploaded without a user message
- [ ] `__ATTACHED_IMAGE_0__` placeholders in AI action params are replaced with real base64 data

### 9.4 AI Integration
- [ ] The AI correctly summarizes extracted file contents
- [ ] The AI offers to populate tool fields from detected data
- [ ] The AI calls Layer 1 actions to fill in branding/business fields from extracted data
- [ ] The AI correctly handles image uploads by offering to set as logo
- [ ] When no tool actions are registered, the AI suggests navigating to a relevant tool
- [ ] The AI does not make changes without user confirmation on file-sourced data

### 9.5 Build Quality
- [ ] Zero TypeScript errors (`npx tsc --noEmit` passes)
- [ ] No new runtime errors in the browser console
- [ ] `xlsx` package is installed and working
- [ ] Existing Layer 1 functionality continues to work unchanged
- [ ] Existing Chiko chat (no files) continues to work unchanged

---

## 10. What NOT to Touch

- **Do not modify any tool store implementations** (`sales-book-editor.ts`, `invoice-editor.ts`, `resume-editor.ts`). The stores already accept the data shapes — only manifests need parameter additions.
- **Do not modify `chiko-actions.ts`** (the registry store). Layer 2 uses Layer 1 actions as-is.
- **Do not modify the `useChikoActions` hook.** No changes needed.
- **Do not modify any renderers, schemas, or template files.**
- **Do not modify Chiko3DAvatar, ChikoFAB, ChikoOnboarding, ChikoAvatar.** These are visual-only.
- **Do not modify any CSS, layouts, or theme tokens.** The file upload UI should use existing Tailwind classes.
- **Do not add any npm dependencies beyond `xlsx`.** `pdf-parse`, `mammoth`, and `sharp` are already installed. `jszip` is already installed (used by mammoth). All other extraction uses native Node.js Buffer operations.

---

## 11. Risk Considerations

### 11.1 Large File Handling

PDF and DOCX files can be large. All processing happens in memory, so a 10 MB file temporarily uses 10 MB+ of server memory. For a single-user local-first app this is acceptable. If the app ever becomes multi-user, consider streaming or chunked processing.

### 11.2 Token Cost for AI Calls

File context adds tokens to the AI request. The `fileContext` object sent to the API should be a SUMMARY, not the full extracted text. Keep the total file context under 2000 tokens. This means:
- `summary`: 1-2 sentences
- `detectedFields`: only the fields that were found (not null entries)
- `tables`: only title, headers, and row count (not actual row data)
- `images`: only metadata (not base64)

If the user asks the AI to "read" specific parts of the document (e.g., "what's on page 3?"), the full text can be sent in a follow-up message — but only on demand, not by default.

### 11.3 Base64 Image Size

A 1 MB PNG becomes ~1.37 MB in base64. A company logo is typically 50-500 KB, but photos can be 5+ MB. The image extractor MUST enforce the 2 MB / 2000px cap to prevent:
- Browser memory issues (storing large data URIs in Zustand)
- Slow form preview rendering (large data URI in an `<img>` tag)
- localStorage overflow (if the tool's form data is accidentally persisted with the logo)

### 11.4 pdf-parse Limitations

`pdf-parse` is text-only — it cannot:
- Extract images from PDFs
- Parse complex table layouts (it gets the text but not the structure)
- Handle scanned/image-only PDFs (no OCR)

The field detector's regex patterns compensate for the lack of structure by identifying data patterns in the flat text. This works well for business documents but poorly for complex layouts.

### 11.5 Race Conditions

If the user uploads a file and immediately sends a message before the upload completes:
- The message goes out without file context
- When the upload completes, the next message will include the file context
- This is acceptable behavior — no need to block message sending on upload completion

---

## 12. Estimated Scope

**New files:** 7 (upload route, 4 extractors, field detector, barrel export)
**Modified files:** 4 (chiko store, ChikoAssistant, API route, 2 manifests)
**New dependency:** 1 (`xlsx`)
**Lines of code (rough estimate):** 600-900 new lines, 200-350 modified lines
**Complexity hot spots:**
- The image placeholder resolution (intercepting `__ATTACHED_IMAGE_0__` before action execution)
- Drag-and-drop UX in ChikoAssistant (visual feedback, multiple file handling)
- Field detector regex accuracy (business document patterns vary widely)

---

## 13. Post-Build Checklist

After Layer 2 is built and verified:

1. Run `npx tsc --noEmit` — must pass with zero errors
2. Test PDF upload: drop a text-based PDF → verify extracted text and detected fields
3. Test image upload: drop a PNG logo → verify dimensions detected, thumbnail shown, logo set on form
4. Test DOCX upload: upload a Word doc with headings and tables → verify extraction
5. Test XLSX upload: upload a spreadsheet → verify sheet/column detection
6. Test file too large: upload a 15 MB file → verify rejection with clear error
7. Test unsupported type: upload a .exe or .zip → verify rejection
8. Test drag-and-drop: drag files onto the Chiko panel → verify drop zone indicator and upload
9. Test no tool page: upload on dashboard → verify AI suggests navigating to a tool
10. Test Layer 1 unchanged: on a tool page, ask Chiko to change a field without files → works as before
11. Test SVG sanitization: upload an SVG with a `<script>` tag → verify script is stripped
12. Update memory bank (`activeContext.md`, `progress.md`) with Layer 2 completion status
13. Add a "Reality vs. Plan" note to the Layer 2 section of `CHIKO-AGENT-ARCHITECTURE.md`
14. Only then: begin writing `CHIKO-LAYER-3-SPEC.md` for Custom Blocks
