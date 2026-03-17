# Chiko Agent Architecture — The Big Picture

> **Document Type:** Permanent architectural reference
> **Scope:** All 5 layers of Chiko's evolution from chatbot to full AI design agent
> **Rule:** This document describes WHAT to build and WHERE — never HOW. No implementation code. TypeScript interfaces define contracts only.

---

## 1. Vision

Chiko is DMSuite's AI personal assistant. Today, Chiko is a chatbot — it can talk to the user, navigate them to tools, explain features, and brainstorm ideas. It cannot touch any tool. It cannot change a single field, process a file, or remember anything about the user's business.

The goal is to transform Chiko into a **full AI design agent** that can do everything a human can do on the platform:

- **Control any tool** — Change fields, toggle options, select templates, adjust styles
- **Process files** — Extract text, images, and data from PDFs, DOCX, XLSX, images
- **Add custom content** — Insert logos, text blocks, decorative elements into designs
- **Remember the business** — Store and recall company details, branding, preferences
- **Execute full workflows** — "Create a receipt book with my branding" becomes a single command

This is achieved through 5 progressive layers, each building on the previous one.

---

## 2. The 5-Layer Architecture

```
Layer 5: Full Agent Workflows       (multi-tool orchestration, autonomous design)
Layer 4: Business Memory            (persistent user profile, branding, preferences)
Layer 3: Custom Blocks              (schema-driven content insertion into designs)
Layer 2: File Processing            (PDF, DOCX, XLSX, image upload & extraction)
Layer 1: Action System              (Chiko can control tool stores via registered actions)
─────────────────────────────────────────────────────────────────────────────────
Foundation: Current Chiko            (chatbot + navigator, no tool control)
```

Each layer is built, tested, and documented before the next layer's spec is written. This prevents spec drift and ensures each layer is grounded in reality.

---

## 3. Layer 1 — Action System (First to Build)

**Purpose:** Give Chiko the ability to read and write tool state.

**Core concept:** Every tool in DMSuite has a Zustand store. Each store has typed actions (functions that mutate state). Layer 1 creates a **universal action registry** that:

1. Lets any tool **register** its available actions with Chiko
2. Lets Chiko's AI **decide** which actions to call based on natural language
3. Lets the AI **execute** those actions by calling store functions with validated parameters
4. Lets the user **see** what Chiko did and undo it if needed

**What the user experiences after Layer 1:**
- "Set my company name to Dramac Solutions" → Chiko calls `updateBranding({ name: "Dramac Solutions" })`
- "Change the accent color to red" → Chiko calls `updateStyle({ accentColor: "#dc2626" })`
- "Switch to the receipt layout" → Chiko calls `convertToType("receipt")`
- "Add 5 more item rows" → Chiko calls `updateLayout({ itemRowCount: 15 })`
- "What's the current template?" → Chiko reads the store and responds

**Tools already built that would self-register on Day 1:**
- Sales Book Editor (9 document types) — `useSalesBookEditor`
- Invoice Editor — `useInvoiceEditor`
- Resume Editor — `useResumeEditor`
- (All future tool stores follow the same pattern)

**Detailed spec:** See `CHIKO-LAYER-1-SPEC.md`

**✅ Layer 1 Reality (Built — Session 84):**
- 6 new files created: `chiko-actions.ts` (registry store), `useChikoActions.ts` (hook), 3 manifest files (sales-book 9 actions, invoice 18 actions, resume 13 actions), barrel export
- 4 files modified: `route.ts` (tool-use protocol for Claude + OpenAI), `ChikoAssistant.tsx` (action execution + destructive confirmation UI), `chiko.ts` (executedActions on messages), workspace components (hook registrations)
- Stream protocol: `__CHIKO_ACTION__:{json}` delimiter — working
- Claude `tool_use` + OpenAI `function_calling` — both implemented
- Zero TypeScript errors confirmed
- All planned features delivered. No significant deviations from spec.

---

## 4. Layer 2 — File Processing Pipeline

**Purpose:** Allow users to upload files (PDF, DOCX, XLSX, images) and have Chiko extract structured data.

**Core concept:** A server-side processing pipeline that:

1. Accepts file uploads via a dedicated API route
2. Identifies file type and routes to the appropriate extractor
3. Extracts structured data (text, tables, images, metadata)
4. Returns a normalized data structure that Chiko can use to populate tool fields

**Processing capabilities by file type:**

- **PDF:** Extract text (per page), embedded images, tables (heuristic row/column detection), metadata (author, title, creation date). Use cases: user uploads an existing invoice PDF → Chiko extracts company details, line items, and pre-fills the form.
- **DOCX:** Extract paragraphs, headings, tables, embedded images, styles. Use cases: user uploads a company profile document → Chiko extracts branding text, contact details.
- **XLSX:** Extract sheets, rows, columns, cell values, formulas (resolved values). Use cases: user uploads a product price list → Chiko maps columns to line items.
- **Images (PNG, JPG, SVG):** Extract as base64 for logo placement. Optionally run OCR for text extraction from scanned documents. Use cases: user uploads a company logo → Chiko sets it as the brand logo.

**Data flow:**
1. User drags a file onto the Chiko panel (or says "upload my logo")
2. File is sent to the processing API route
3. API extracts structured data and returns it
4. Chiko presents a summary: "I found your company name, address, phone, and logo. Want me to fill in the form?"
5. User confirms → Chiko uses Layer 1 actions to populate tool fields

**Key design decisions:**
- Server-side extraction (not client-side) for security and consistency
- All file processing happens in memory — files are never persisted on the server
- Maximum file size enforced at the API level
- Extracted data is sanitized before being passed to tool actions
- This layer depends on Layer 1 being complete (it uses actions to populate fields)

---

## 5. Layer 3 — Custom Blocks System

**Purpose:** Allow Chiko (and users) to add custom visual elements to designs without editing template source code.

**Core concept:** A schema-driven content insertion system. Instead of Chiko editing JSX or HTML templates directly (fragile, dangerous), designs support **custom blocks** — structured data objects that renderers know how to display.

**Why not let Chiko edit templates directly?**
- Templates are complex JSX with precise CSS for print quality
- One wrong edit breaks the entire layout
- Print dimensions, margins, and spacing are calibrated
- The industry standard (Canva, Notion, Gutenberg) uses structured blocks, not raw code editing

**Block types (initial set):**

1. **Text Block** — A paragraph of custom text with font, size, color, alignment
2. **Image Block** — A placed image with position, size, crop, opacity
3. **Divider Block** — A horizontal rule with style (solid, dashed, dotted), color, thickness
4. **Spacer Block** — Empty vertical space with configurable height
5. **QR Code Block** — A QR code generated from a URL with size and position
6. **Table Block** — A custom mini-table with configurable rows/columns and content
7. **Signature Block** — A signature line with label text

**How it works:**
- Each tool's schema gains a `customBlocks` array field
- Each block has a `type`, `position` (before-header, after-header, before-footer, after-footer, free-position), and type-specific properties
- Renderers iterate `customBlocks` and render them at the specified positions
- Chiko can add, modify, reorder, and remove blocks via Layer 1 actions
- Users can also manually manage blocks through UI (a "Custom Blocks" section panel)

**Example conversation:**
- User: "Add a QR code with my website at the bottom right"
- Chiko: Calls `addCustomBlock({ type: "qr-code", position: "after-footer", data: { url: "https://dramac.com", size: 80, alignment: "right" } })`

**This layer depends on:**
- Layer 1 (actions to add/modify/remove blocks)
- Renderers being updated to support block rendering

---

## 6. Layer 4 — Business Memory

**Purpose:** Persistent storage of user's business details, branding, and preferences across sessions and tools.

**Core concept:** A local-first persistent profile system that stores:

1. **Company Profile** — Name, tagline, address, phone, email, website, TPIN, registration numbers
2. **Brand Assets** — Logo URLs (stored as data URIs or local references), brand colors, fonts
3. **Banking Details** — All 11 banking fields (stored once, reused across all sales documents)
4. **Design Preferences** — Preferred accent color, font pairing, template style
5. **Team Members** — Names and titles for signature blocks
6. **Frequently Used Settings** — Default currency, page size, forms per page, binding position

**How it works:**
- A dedicated Zustand store with localStorage persistence (like the existing Chiko store)
- When Chiko encounters business information (via conversation or file extraction), it asks the user: "Want me to remember this for future use?"
- When populating a new tool, Chiko checks the business memory first: "I see you've used Dramac Solutions before. Want me to pre-fill your company details?"
- Business memory is read-only for Chiko's AI — the user must explicitly approve any changes to stored data
- Memory is local-only — nothing is sent to any server

**Example conversation:**
- User opens a new invoice tool
- Chiko: "Hey! I remember your company details from last time. Want me to pre-fill Dramac Solutions' info?"
- User: "Yes, and update the phone number to +260 977 123 456"
- Chiko: Pre-fills all fields from memory, updates phone in both the tool and business memory

**This layer depends on:**
- Layer 1 (actions to populate fields)
- Layer 2 (file processing can feed into business memory)

---

## 7. Layer 5 — Full Agent Workflows

**Purpose:** Chiko can execute complex multi-step workflows autonomously, coordinating across multiple tools and making design decisions.

**Core concept:** Workflow templates — predefined sequences of actions that Chiko can execute with user-provided parameters and AI-driven decisions.

**Example workflows:**

1. **"Create my complete sales book set"**
   - Chiko creates invoice, receipt, quotation, delivery note, and purchase order books
   - All share the same branding (from business memory)
   - Each has document-type-appropriate defaults
   - Chiko selects matching template styles across all documents

2. **"Build me a brand identity"**
   - Chiko generates a logo
   - Creates business cards with the logo
   - Creates letterhead with the logo
   - Generates a brand color palette
   - Saves everything to business memory

3. **"Process this client's files and create their invoices"**
   - User uploads a price list (XLSX) and company logo (PNG)
   - Chiko extracts product data and logo (Layer 2)
   - Creates an invoice template pre-filled with their products
   - Asks user for any missing details

**How it works:**
- Workflows are defined as named sequences of steps
- Each step references Layer 1 actions, Layer 2 file processing, Layer 3 block insertion, or Layer 4 memory lookups
- The AI decides how to connect steps — e.g., which accent color to use, how many rows to include
- User can pause, modify, and resume workflows at any step
- Each step is undoable independently

**This layer depends on:** All previous layers being stable and tested.

---

## 8. Universal Action Registration Pattern

This is the foundational pattern that makes everything work. Every tool store registers its capabilities with Chiko's action system. This is how Chiko knows what it can do on any page.

### 8.1 How Registration Works

Each tool page component calls a registration hook when it mounts. This hook:
1. Reads the tool's store interface (what actions exist)
2. Builds a descriptor object listing each action with its name, description, parameter schema, and the actual function reference
3. Registers this descriptor with a central action registry
4. Unregisters when the component unmounts (so Chiko only knows about tools currently on screen)

### 8.2 Action Descriptor Structure

Each registered action has:
- **name** — Machine-readable identifier (e.g., `updateBranding`)
- **description** — Natural language description for the AI (e.g., "Update the company branding fields like name, tagline, address, phone, email")
- **parameters** — A JSON Schema-like description of what the action accepts
- **category** — Grouping for UI display (e.g., "Branding", "Layout", "Style")
- **execute** — The actual function reference that performs the action
- **readState** — Optional function that returns current relevant state for the AI to read

### 8.3 How the AI Uses Registered Actions

When a user sends a message to Chiko while on a tool page:
1. The API route receives the message AND the list of currently registered action descriptors (names, descriptions, parameter schemas — NOT function references)
2. The AI model sees these as available "tools" (using the AI provider's function-calling / tool-use protocol)
3. The AI decides whether to call an action, ask for clarification, or just respond with text
4. If the AI requests an action call, the response includes the action name and parameters
5. The client-side code looks up the action in the registry by name
6. The client validates the parameters against the schema
7. The client executes the action function with the validated parameters
8. The result is reflected in the tool's live preview instantly (because it's a direct Zustand store mutation)

### 8.4 Why Client-Side Execution

Actions execute on the client, not the server. This is critical because:
- Tool stores are client-side Zustand stores — they can't be mutated from the server
- Changes appear instantly in the live preview (no round-trip delay)
- Undo/redo works naturally through the existing Zundo temporal middleware
- No need to serialize/deserialize complex state objects
- The AI only provides intent (action name + parameters) — the client handles execution

### 8.5 How New Tools Self-Register

When a developer builds a new tool (e.g., a poster designer), they:
1. Create the tool's Zustand store with typed actions (existing pattern)
2. Create an action manifest — a static description of available actions for AI consumption
3. Call the registration hook in their tool workspace component
4. Chiko automatically gains the ability to control this new tool

The registration pattern is the same regardless of what the tool does. A sales book tool registers `updateBranding`, a resume tool registers `addSectionItem`, a video tool registers `setDuration`. The system is universal.

---

## 9. Integration with Existing Codebase

### 9.1 Current Chiko Stack (What Exists Today)

| File | Purpose | Size |
|------|---------|------|
| `src/stores/chiko.ts` | Chiko state, messages, context | ~155 lines |
| `src/app/api/chiko/route.ts` | Streaming API endpoint, system prompt | ~650 lines |
| `src/components/Chiko/ChikoAssistant.tsx` | Main chat panel, slash commands, navigation | ~900 lines |
| `src/components/Chiko/ChikoFAB.tsx` | Floating action button | ~150 lines |
| `src/components/Chiko/Chiko3DAvatar.tsx` | 3D robot avatar with expressions | ~700 lines |
| `src/components/Chiko/ChikoAvatar.tsx` | Simple static avatar | ~50 lines |
| `src/components/Chiko/ChikoOnboarding.tsx` | First-time onboarding flow | ~200 lines |
| `src/components/Chiko/index.ts` | Barrel exports | 5 lines |

### 9.2 Tool Stores (First Integration Targets)

| Store | File | Key Actions |
|-------|------|-------------|
| Sales Book | `src/stores/sales-book-editor.ts` | `updateBranding`, `updateSerial`, `updateLayout`, `updatePrint`, `updateStyle`, `updateBrandLogos`, `toggleColumn`, `resetForm`, `convertToType` |
| Invoice | `src/stores/invoice-editor.ts` | `updateBusinessInfo`, `updateClientInfo`, `addLineItem`, `updateLineItem`, `setCurrency`, `updateTax`, `updatePaymentInfo`, `setTemplate`, `setAccentColor` |
| Resume | `src/stores/resume-editor.ts` | `setResume`, `updateResume`, `changeTemplate`, `addSectionItem`, `updateSectionItem`, `removeSectionItem`, `reorderSectionItems`, `setAccentColor`, `setFontPairing` |

### 9.3 Shared Patterns Across All Stores

All editor stores follow the same architecture:
- **Middleware stack:** `create<State>()(temporal(immer((set) => ...)))`
- **Mutation pattern:** `set((s) => { Object.assign(s.form.section, patch) })`
- **Undo/redo:** Built-in via Zundo's `temporal` wrapper with `pastStates`/`futureStates`
- **Type safety:** All actions accept typed partial objects (e.g., `Partial<CompanyBranding>`)

This consistency means the action registration pattern only needs to be designed once and works for every store.

---

## 10. Security Boundaries

### 10.1 What the AI Can Do
- Call registered actions with validated parameters
- Read current tool state (what the user sees on screen)
- Suggest actions and ask for confirmation
- Process uploaded files on the server

### 10.2 What the AI Cannot Do
- Execute arbitrary code
- Access the filesystem
- Make network requests beyond the AI provider API
- Modify stores that haven't registered actions
- Bypass parameter validation
- Act without the user seeing the result (all changes are reflected in the live preview)

### 10.3 Validation Rules
- All action parameters are validated against the registered schema before execution
- File uploads have size limits and type restrictions
- Business memory changes require explicit user confirmation
- The AI never receives function references — only action descriptors
- The client-side registry is the sole executor of actions

---

## 11. What This Document Does NOT Cover

- **Implementation code** — Each layer's spec describes what to build; the builder writes the code fresh
- **UI/UX design** — How the action confirmation UI looks, animation details, etc. are decided during implementation
- **Specific prompt engineering** — The exact system prompt modifications are part of each layer's build
- **Testing strategy** — Each layer's spec will include acceptance criteria, not test implementations
- **Deployment** — This is a local-first application; no deployment infrastructure is needed
- **Third-party integrations** — Cloud storage, external APIs, etc. are out of scope for all 5 layers

---

## 12. Document Maintenance

This document is updated when:
- A layer is completed and its actual implementation differs from the plan
- A new insight or constraint is discovered that affects the overall architecture
- A new layer is proposed beyond the current 5
- The user's vision for Chiko evolves

Each completed layer should add a brief "Reality vs. Plan" note to its section, documenting any deviations from this architecture that occurred during implementation.
