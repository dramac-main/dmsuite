# Chiko Layer 1 — Action System Build Specification

> **Document Type:** Consumable build spec (becomes history after implementation)
> **Prerequisites:** Read ALL memory bank files + CHIKO-AGENT-ARCHITECTURE.md before starting
> **Rule:** This document describes WHAT to build and WHERE. No function bodies, no JSX, no component rendering code. TypeScript interfaces define contracts only. The builder writes all implementation code fresh based on the real codebase at build time.

---

## 1. Prerequisites — Read Before Building

The builder MUST read these files in order before writing any code:

1. `/memory-bank/projectbrief.md` — Project scope and requirements
2. `/memory-bank/systemPatterns.md` — Architecture patterns and conventions
3. `/memory-bank/techContext.md` — Tech stack and constraints
4. `/memory-bank/activeContext.md` — Current state and recent changes
5. `PHASES/CHIKO-AGENT-ARCHITECTURE.md` — The big picture this layer fits into

Then read the actual source files that will be modified or referenced:

6. `src/stores/chiko.ts` — Current Chiko store (the state you're extending)
7. `src/app/api/chiko/route.ts` — Current API endpoint (the streaming pipeline you're modifying)
8. `src/components/Chiko/ChikoAssistant.tsx` — Current chat panel (where action execution happens)
9. `src/stores/sales-book-editor.ts` — First tool store to integrate (your test target)
10. `src/lib/sales-book/schema.ts` — The Zod schemas that define valid data shapes
11. `src/stores/invoice-editor.ts` — Second tool store to integrate
12. `src/stores/resume-editor.ts` — Third tool store to integrate

---

## 2. Current State — What Exists Right Now

### 2.1 Chiko Store (`src/stores/chiko.ts`, ~155 lines)

**State shape:**
- `isOpen`, `isGenerating`, `isMinimized` — UI state booleans
- `messages: ChikoMessage[]` — Conversation history
- `inputDraft: string` — Current input field value
- `context: ChikoContext` — Current page/tool awareness
- `hasGreeted`, `hasNotification` — Session flags

**`ChikoMessage` type:**
- `id`, `role` ("user" | "assistant" | "system"), `content`, `timestamp`
- `actions?: ChikoAction[]` — Optional quick-action chips (currently: navigate, tool, explain, create, action types)

**`ChikoContext` type:**
- `currentPath`, `currentToolId?`, `currentCategoryId?`, `pageType` ("dashboard" | "tool" | "other")

**Key gap:** No concept of registered actions, no way to know what a tool can do, no action execution tracking.

### 2.2 Chiko API (`src/app/api/chiko/route.ts`, ~650 lines)

**Current flow:**
1. POST receives `{ messages, context }`
2. System prompt is the massive `CHIKO_SYSTEM_PROMPT` constant (~160 lines) listing all 194 tools
3. Context is appended: current path, page type, tool ID, category ID
4. Provider resolved: Claude (default) → OpenAI (fallback)
5. Streaming response sent back (text chunks, no structured data)

**Key gap:** The API sends a text-only system prompt. There is no function-calling / tool-use protocol. The AI cannot request structured actions — it can only output text. The response stream is pure text, not a structured format that could contain action requests.

### 2.3 ChikoAssistant (`src/components/Chiko/ChikoAssistant.tsx`, ~900 lines)

**Current flow:**
1. User types message
2. If starts with `/` → handled locally (slash commands: navigate, search, details, etc.)
3. If matches navigation regex (`/^(?:take me to|go to|open|...)\s+(.+)/i`) → `router.push()`
4. Otherwise → sent to API, streamed response displayed

**Key gap:** After receiving the AI response, there is no parsing for action requests. The response is displayed as-is. There is no mechanism to execute store actions based on AI output.

### 2.4 Tool Stores (What They Look Like)

**Sales Book (`src/stores/sales-book-editor.ts`, ~175 lines):**
- State: `form: SalesBookFormData`
- Actions: `setDocumentType`, `convertToType`, `setForm`, `resetForm`, `updateBranding(Partial<CompanyBranding>)`, `updateSerial(Partial<SerialConfig>)`, `updateLayout(Partial<FormLayout>)`, `updatePrint(Partial<PrintConfig>)`, `updateStyle(Partial<FormStyle>)`, `updateBrandLogos(Partial<BrandLogosConfig>)`, `addBrandLogo(BrandLogo)`, `removeBrandLogo(index)`, `toggleColumn(columnId)`
- Middleware: `temporal(immer(...))`
- Undo: `useSalesBookUndo()` exposes `undo`, `redo`, `canUndo`, `canRedo`

**Invoice (`src/stores/invoice-editor.ts`, ~130+ lines):**
- State: `invoice: InvoiceData`
- Actions: `setDocumentType`, `convertToType`, `setInvoice`, `updateInvoice(recipe)`, `resetInvoice`, `updateBusinessInfo(Partial<BusinessInfo>)`, `updateClientInfo(Partial<ClientInfo>)`, `setInvoiceNumber`, `setIssueDate`, `setDueDate`, `setPoNumber`, `setPaymentTerms`, `setStatus`, `addLineItem`, `updateLineItem(id, Partial<LineItem>)`, `removeLineItem(id)`, `reorderLineItems(from, to)`, `duplicateLineItem(id)`, `addCharge`, `updateCharge(id, Partial)`, `removeCharge(id)`, `setCurrency(CurrencyConfig)`, `updateTax(Partial<TaxConfig>)`, `updatePaymentInfo(Partial<PaymentInfo>)`, `updateSignature(Partial<Signature>)`, `setNotes`, `setTerms`, `setTemplate`, `setAccentColor`, `setFontPairing`, `setPageFormat`, `updateMetadata(Partial<InvoiceMetadata>)`

**Resume (`src/stores/resume-editor.ts`, ~100+ lines):**
- State: `resume: ResumeData`
- Actions: `setResume`, `updateResume(recipe)`, `resetResume`, `changeTemplate(TemplateId)`, `addSectionItem(sectionKey, item)`, `updateSectionItem(sectionKey, index, data)`, `removeSectionItem(sectionKey, index)`, `reorderSectionItems(sectionKey, from, to)`, `toggleSectionVisibility(sectionKey)`, `renameSectionTitle(sectionKey, title)`, `addCustomSection(title)`, `removeCustomSection(sectionId)`, `moveSectionToColumn(sectionKey, column, pageIndex)`, `setAccentColor`, `setFontPairing`, `setFontScale`

**Common pattern across all stores:** Every action is a named function on the store that accepts typed parameters. Mutations happen via Immer's draft pattern. Undo history is automatic via Zundo.

---

## 3. Goal — What the User Experiences After Layer 1

When Layer 1 is complete, the user can have conversations like this while on a tool page:

**On the Sales Book Designer:**
> User: "Set my company name to Dramac Solutions and the phone to +260 977 123 456"
> Chiko: "Done! I've updated your company name to **Dramac Solutions** and phone to **+260 977 123 456**. ✨"
> *(The live form preview updates instantly)*

> User: "Switch to the modern template with a blue accent color"
> Chiko: "Switched to **Modern** template with accent color **#2563eb**! Looking sharp. 🎨"

> User: "How many item rows do I have right now?"
> Chiko: "Your form currently has **10 item rows**. Want me to change that?"

> User: "Change the currency to USD and show the code instead of the symbol"
> Chiko: "Updated! Currency is now **USD** displayed as the code. 💰"

**On the Resume Builder:**
> User: "Change my template to Swiss Typographic"
> Chiko: "Template changed to **Swiss Typographic**! Clean and elegant. 🇨🇭"

> User: "Add a new work experience entry"
> Chiko: "Added a new work experience entry. Fill in the details! 📝"

**What does NOT work yet (that's fine — those are later layers):**
- Uploading files (Layer 2)
- Adding custom visual blocks (Layer 3)
- Auto-filling from remembered business details (Layer 4)
- Multi-tool workflows (Layer 5)

---

## 4. TypeScript Contracts

These are the interfaces that define how components communicate. They are contracts — not implementations.

### 4.1 Action Descriptor (How a Tool Describes One Action)

```typescript
interface ChikoActionDescriptor {
  /** Machine-readable action name — matches the store function name */
  name: string;
  
  /** Human-readable description for the AI to understand what this does */
  description: string;
  
  /** JSON Schema describing the parameters this action accepts.
   *  Used by the AI provider's function-calling protocol. */
  parameters: Record<string, unknown>;
  
  /** Grouping label for UI organization (e.g., "Branding", "Layout") */
  category: string;
  
  /** Whether this action is destructive (resets, deletes, removes) — 
   *  triggers confirmation prompt before execution */
  destructive?: boolean;
}
```

### 4.2 Action Manifest (What a Tool Registers with Chiko)

```typescript
interface ChikoActionManifest {
  /** Which tool this manifest belongs to (e.g., "sales-book-editor") */
  toolId: string;
  
  /** Human-readable tool name for AI context (e.g., "Sales Book Designer") */
  toolName: string;
  
  /** List of all actions this tool exposes to Chiko */
  actions: ChikoActionDescriptor[];
  
  /** Function that returns current tool state as a plain object for AI to read.
   *  This is called when the AI needs to know the current state. */
  getState: () => Record<string, unknown>;
  
  /** Function that executes a named action with given parameters.
   *  Returns a result message (success/error) for the AI to report. */
  executeAction: (actionName: string, params: Record<string, unknown>) => ChikoActionResult;
}
```

### 4.3 Action Result (What Comes Back After Execution)

```typescript
interface ChikoActionResult {
  /** Whether the action succeeded */
  success: boolean;
  
  /** Human-readable message describing what happened */
  message: string;
  
  /** The new relevant state after the action (optional, for AI to reference) */
  newState?: Record<string, unknown>;
}
```

### 4.4 Action Registry (Central Store That Holds All Registered Manifests)

```typescript
interface ChikoActionRegistryState {
  /** Currently registered manifests (keyed by toolId) */
  manifests: Map<string, ChikoActionManifest>;
  
  /** Register a tool's action manifest */
  register: (manifest: ChikoActionManifest) => void;
  
  /** Unregister a tool when its page unmounts */
  unregister: (toolId: string) => void;
  
  /** Get AI-consumable description of all registered actions 
   *  (for injection into the system prompt or tool-use protocol) */
  getActionDescriptorsForAI: () => AIToolDescriptor[];
  
  /** Execute an action by tool ID and action name */
  execute: (toolId: string, actionName: string, params: Record<string, unknown>) => ChikoActionResult;
  
  /** Read current state from a registered tool */
  readState: (toolId: string) => Record<string, unknown> | null;
}
```

### 4.5 AI Tool Descriptor (What Gets Sent to the AI Provider)

```typescript
/** Matches the format expected by Claude's tool_use or OpenAI's function_calling */
interface AIToolDescriptor {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}
```

### 4.6 AI Response with Actions (Structured Response from the API)

```typescript
/** When the AI decides to call an action, this is what comes back 
 *  alongside or instead of text */
interface ChikoActionRequest {
  /** The action to execute (format: "toolId.actionName") */
  action: string;
  
  /** Parameters for the action */
  params: Record<string, unknown>;
}
```

---

## 5. Files to Create

### 5.1 `src/stores/chiko-actions.ts` — Action Registry Store

**Purpose:** Central Zustand store that holds all registered tool manifests and provides execute/read capabilities.

**What it contains:**
- The `ChikoActionRegistryState` interface implementation
- A plain `create` store (no persistence — manifests are re-registered on mount)
- `register(manifest)` — Adds a manifest to the map
- `unregister(toolId)` — Removes a manifest from the map
- `getActionDescriptorsForAI()` — Converts all registered manifests into the format needed by Claude/OpenAI tool-use protocol
- `execute(toolId, actionName, params)` — Looks up the manifest, finds the action, calls `executeAction`, returns result
- `readState(toolId)` — Calls the manifest's `getState()` and returns the plain object

**Important:** This store has NO persistence. Manifests live only as long as their tool component is mounted. When the user leaves a tool page, its manifest is unregistered.

### 5.2 `src/hooks/useChikoActions.ts` — Registration Hook

**Purpose:** A React hook that tool workspace components call to register their action manifest with Chiko.

**What it does:**
1. Accepts a manifest factory function (or static manifest)
2. On mount: calls `register(manifest)` on the registry store
3. On unmount: calls `unregister(toolId)`
4. Re-registers if the factory function changes (memo-safe)

**Usage pattern (what tool workspaces will do):**
A tool workspace component (e.g., the sales book designer workspace) will call this hook, passing in a manifest that describes all the actions available on that specific tool. The hook handles the lifecycle — register on mount, unregister on unmount.

### 5.3 Action Manifest Files (One Per Tool)

Each tool gets a manifest file that describes its available actions for Chiko. These are static descriptor files — they define WHAT actions exist and WHAT parameters they accept, but they don't contain the action implementations (those already exist in the stores).

#### 5.3.1 `src/lib/chiko/manifests/sales-book.ts`

**Actions to expose (from `useSalesBookEditor`):**

| Action Name | Description for AI | Parameters (JSON Schema) | Category | Destructive |
|---|---|---|---|---|
| `updateBranding` | Update company branding fields (name, tagline, address, phone, email, website, TPIN, banking details) | Partial CompanyBranding — each field is an optional string | Branding | No |
| `updateSerial` | Change the serial numbering (prefix, start/end number, digit count, show/hide) | Partial SerialConfig — prefix: string, startNumber/endNumber/digitCount: number, showSerial: boolean | Numbering | No |
| `updateLayout` | Change form layout options (row count, currency, date/recipient/sender toggles, footer toggles, custom fields) | Partial FormLayout — all fields optional, matching the schema | Layout | No |
| `toggleColumn` | Toggle a table column on/off | columnId: string (one of: index, description, quantity, unit, unitPrice, discount, tax, amount) | Layout | No |
| `updatePrint` | Change print settings (forms per page, page size, page count, cut lines, page numbers, binding position) | Partial PrintConfig | Print | No |
| `updateStyle` | Change visual style (template, accent color, font pairing, field style, border style) | Partial FormStyle | Style | No |
| `convertToType` | Switch to a different document type (invoice, receipt, quotation, etc.) | type: SalesDocumentType enum string | Document | No |
| `resetForm` | Reset the form to defaults for the current document type | docType?: SalesDocumentType (optional, defaults to current) | Document | **Yes** |
| `readCurrentState` | *(Read-only)* Get the current form configuration | None | — | — |

#### 5.3.2 `src/lib/chiko/manifests/invoice.ts`

**Actions to expose (from `useInvoiceEditor`):**

| Action Name | Description for AI | Key Parameters | Category | Destructive |
|---|---|---|---|---|
| `updateBusinessInfo` | Update the sender's business information | Partial BusinessInfo (name, email, phone, address, taxId, logoUrl) | Business | No |
| `updateClientInfo` | Update the recipient/client information | Partial ClientInfo (name, email, phone, address, companyName) | Client | No |
| `setInvoiceNumber` | Set the invoice number | num: string | Details | No |
| `setIssueDate` | Set the issue/creation date | date: string (ISO format) | Details | No |
| `setDueDate` | Set the payment due date | date: string (ISO format) | Details | No |
| `addLineItem` | Add a new blank line item to the invoice | None | Items | No |
| `updateLineItem` | Update an existing line item | id: string, patch: Partial LineItem | Items | No |
| `removeLineItem` | Remove a line item | id: string | Items | No |
| `setCurrency` | Change the currency configuration | CurrencyConfig object | Finance | No |
| `updateTax` | Update tax configuration | Partial TaxConfig | Finance | No |
| `updatePaymentInfo` | Update payment information (bank details, payment terms) | Partial PaymentInfo | Finance | No |
| `setNotes` | Set the notes text | notes: string | Content | No |
| `setTerms` | Set the terms and conditions text | terms: string | Content | No |
| `setTemplate` | Change the visual template | template: string | Design | No |
| `setAccentColor` | Change the accent color | color: string (hex) | Design | No |
| `setFontPairing` | Change the font pairing | fp: string (font pairing ID) | Design | No |
| `resetInvoice` | Reset to defaults | docType?: SalesDocumentType | Document | **Yes** |
| `readCurrentState` | Get the current invoice data | None | — | — |

#### 5.3.3 `src/lib/chiko/manifests/resume.ts`

**Actions to expose (from `useResumeEditor`):**

| Action Name | Description for AI | Key Parameters | Category | Destructive |
|---|---|---|---|---|
| `changeTemplate` | Switch to a different resume template | templateId: TemplateId string | Design | No |
| `setAccentColor` | Change the accent/theme color | color: string (hex) | Design | No |
| `setFontPairing` | Change the font combination | pairingId: string | Design | No |
| `setFontScale` | Change the font size scale | scale: "compact" \| "standard" \| "spacious" | Design | No |
| `addSectionItem` | Add a new item to a resume section (e.g., new work experience entry) | sectionKey: string, item: object with section-specific fields | Content | No |
| `updateSectionItem` | Update an existing section item | sectionKey: string, itemIndex: number, data: object | Content | No |
| `removeSectionItem` | Remove a section item | sectionKey: string, itemIndex: number | Content | **Yes** |
| `reorderSectionItems` | Move a section item up or down | sectionKey: string, fromIndex: number, toIndex: number | Content | No |
| `toggleSectionVisibility` | Show or hide a resume section | sectionKey: string | Layout | No |
| `addCustomSection` | Add a new custom section to the resume | title: string | Content | No |
| `removeCustomSection` | Remove a custom section | sectionId: string | Content | **Yes** |
| `resetResume` | Reset to default empty resume | None | Document | **Yes** |
| `readCurrentState` | Get the current resume data | None | — | — |

### 5.4 `src/lib/chiko/manifests/index.ts` — Barrel Export

Exports all manifest builder functions for easy import.

---

## 6. Files to Modify

### 6.1 `src/app/api/chiko/route.ts` — Add Tool-Use Protocol

**Current state:** Sends a text-only system prompt. Returns a text stream. No concept of function calling.

**Changes needed:**

1. **Accept registered actions in the request body.** The POST body currently accepts `{ messages, context }`. Extend it to also accept `{ actions?: AIToolDescriptor[] }`. These are the AI-consumable action descriptors generated by `getActionDescriptorsForAI()`.

2. **When actions are present, use the AI provider's tool-use protocol.**

   For **Claude**: Add a `tools` array to the API request alongside `messages` and `system`. Each tool in the array has `name`, `description`, and `input_schema` matching the `AIToolDescriptor` format. Claude will respond with `tool_use` content blocks when it wants to call an action.

   For **OpenAI**: Add a `tools` array with `type: "function"` entries and `function` objects containing `name`, `description`, and `parameters`. OpenAI will respond with `tool_calls` in the message when it wants to call an action.

3. **Handle structured responses alongside text.** When the AI provider responds with tool-use blocks:
   - Extract the action name and parameters from the tool-use block
   - Include them as a JSON event in the stream (a new event type, distinct from text chunks)
   - Continue streaming any text content normally

4. **Add state context to the system prompt.** When actions are registered, append a "Current Tool State" section to the system prompt. This is a JSON representation of the current tool state (from `readState()`), so the AI knows what values are currently set.

5. **Add action instructions to the system prompt.** When actions are available, append instructions telling the AI:
   - It can call actions to modify the user's design
   - It should confirm what it did after calling an action
   - It should ask for clarification if the user's request is ambiguous
   - For destructive actions, it should ask for confirmation first
   - It can read the current state to answer questions about the design

**Stream format evolution:**
- **Current:** Pure text chunks (`data: "text content"`)
- **New:** Text chunks AND action events (`data: {"type": "action", "action": "sales-book-editor.updateBranding", "params": {"name": "Dramac"}}`)
- The client needs to detect which type each chunk is and handle accordingly

### 6.2 `src/components/Chiko/ChikoAssistant.tsx` — Add Action Execution

**Current state:** Receives pure text stream. Appends text to last assistant message. No action handling.

**Changes needed:**

1. **Send registered actions with the API request.** Before calling `/api/chiko`, read the action registry's `getActionDescriptorsForAI()` and include the descriptors in the request body.

2. **Parse the response stream for action events.** The stream will now contain two types of data:
   - Text chunks (append to message as before)
   - Action events (JSON objects with action name and parameters)
   
   When an action event is detected in the stream:
   - Call `execute(toolId, actionName, params)` on the action registry
   - The action result (success/failure + message) should be noted
   - Continue displaying the AI's text response (which will explain what it did)

3. **Show action feedback in the chat.** After executing an action, the existing message display handles this — the AI's text response will say "Done! I've updated X to Y." The live preview updates instantly because the store was mutated directly.

4. **Handle destructive action confirmation.** When the AI requests a destructive action (marked `destructive: true` in the manifest):
   - Pause execution
   - Show a confirmation prompt in the chat (e.g., "Chiko wants to reset your form. Allow?")
   - Only execute if the user confirms
   - If the user declines, send a message back to the AI saying the action was declined

5. **Include current state in the API request context.** Read the current tool state from the registry and include it in the context sent to the API, so the AI knows what values are currently set when answering questions.

### 6.3 `src/stores/chiko.ts` — Minor Extensions

**Changes needed:**

1. **Add action execution tracking to ChikoMessage.** Extend the `ChikoMessage` type to optionally include:
   - `executedActions?: { action: string; params: Record<string, unknown>; success: boolean }[]`
   - This is for display purposes — showing the user what actions were taken in a message

2. **No other changes.** The Chiko store remains focused on chat state. The action registry is a separate store.

### 6.4 Tool Workspace Components — Add Registration Calls

Each tool workspace component needs to call the `useChikoActions` hook to register its manifest when the component mounts.

**Files to modify:**

- The sales book designer workspace component (the top-level component that renders the sales book editor). Find it by tracing from the route `src/app/tools/[categoryId]/[toolId]/page.tsx` → the workspace component for sales book tools.
- The invoice designer workspace component.
- The resume/CV builder workspace component.

**What the modification looks like (conceptually):**
At the top of each workspace component, call the registration hook with the appropriate manifest. The hook takes care of registering on mount and unregistering on unmount. The manifest references the tool's store for state reading and action execution.

---

## 7. Data Flow — End to End

### 7.1 Happy Path: User Asks Chiko to Change a Field

```
1. User types: "Change my company name to Dramac Solutions"
   ↓
2. ChikoAssistant.sendMessage() is called
   ↓
3. ChikoAssistant reads the action registry:
   - Gets AIToolDescriptor[] from getActionDescriptorsForAI()
   - Gets current tool state from readState()
   ↓
4. POST /api/chiko with:
   {
     messages: [...conversation history, user message],
     context: { currentPath, pageType, currentToolId },
     actions: [AIToolDescriptor for updateBranding, updateLayout, ...],
     toolState: { form: { companyBranding: { name: "", ... }, ... } }
   }
   ↓
5. API builds system prompt:
   - Base CHIKO_SYSTEM_PROMPT (existing)
   - + context section (existing)
   - + "You have the following tools available:" section (new)
   - + "Current tool state:" JSON section (new)
   ↓
6. API calls Claude with tools array:
   claude.messages.create({
     model, system, messages,
     tools: [{ name: "updateBranding", description: "...", input_schema: {...} }],
     stream: true,
   })
   ↓
7. Claude responds with:
   - A tool_use block: { name: "updateBranding", input: { name: "Dramac Solutions" } }
   - A text block: "Done! I've updated your company name to **Dramac Solutions**. ✨"
   ↓
8. API streams the response, encoding tool_use blocks as JSON events
   and text blocks as plain text chunks
   ↓
9. ChikoAssistant receives the stream:
   - Detects the action event
   - Calls registry.execute("sales-book-editor", "updateBranding", { name: "Dramac Solutions" })
   ↓
10. Registry looks up the sales-book-editor manifest:
    - Finds the executeAction function
    - Calls it with ("updateBranding", { name: "Dramac Solutions" })
    ↓
11. The manifest's executeAction calls useSalesBookEditor.getState().updateBranding({ name: "Dramac Solutions" })
    ↓
12. Zustand Immer mutation fires:
    - s.form.companyBranding.name = "Dramac Solutions"
    - Zundo records the undo state
    ↓
13. The live form preview re-renders with the new company name
    ↓
14. ChikoAssistant continues processing the text stream:
    - Displays "Done! I've updated your company name to **Dramac Solutions**. ✨"
    ↓
15. User sees the change in real-time and the confirmation message.
    User can undo with Ctrl+Z (existing undo system).
```

### 7.2 Read Path: User Asks About Current State

```
1. User types: "What template am I using?"
   ↓
2. Same flow as above — actions and toolState are sent to the API
   ↓
3. Claude sees the current state in the system prompt:
   { style: { template: "classic", accentColor: "#1e40af", ... } }
   ↓
4. Claude responds with text only (no tool_use — this is a read-only query):
   "You're currently using the **Classic** template with a blue accent color (#1e40af). Want to try something different?"
   ↓
5. No action execution needed. Text is displayed as-is.
```

### 7.3 Destructive Path: Action Requires Confirmation

```
1. User types: "Reset my form"
   ↓
2. Claude decides to call resetForm (marked destructive: true)
   ↓
3. ChikoAssistant detects the action event and checks destructive flag
   ↓
4. Instead of executing immediately, shows inline confirmation:
   "⚠️ Chiko wants to reset your form to defaults. This will erase all your current settings. [Allow] [Cancel]"
   ↓
5a. User clicks [Allow]:
    - Execute the action
    - Display Claude's confirmation text
    ↓
5b. User clicks [Cancel]:
    - Don't execute the action
    - Display: "No worries, I'll leave it as is! 😊"
```

### 7.4 No Actions Available: Dashboard or Non-Tool Page

```
1. User is on /dashboard (no tool is mounted, registry is empty)
   ↓
2. User types a message
   ↓
3. getActionDescriptorsForAI() returns empty array
   ↓
4. API receives no actions — does NOT include tool-use in the Claude request
   ↓
5. Claude responds as it does today — pure text, navigation suggestions,
   tool recommendations, etc. No change from current behavior.
```

---

## 8. AI Provider Integration Details

### 8.1 Claude Tool-Use Protocol

Claude supports tool use natively. The relevant parts of the API:

**Request format additions:**
- Add `tools` array to the request body (alongside `model`, `system`, `messages`)
- Each tool has: `name` (string), `description` (string), `input_schema` (JSON Schema object)

**Response format when tool use occurs:**
- The response content array may contain `tool_use` blocks mixed with `text` blocks
- A `tool_use` block has: `type: "tool_use"`, `id` (string), `name` (tool name), `input` (the parameters)
- In streaming mode, `tool_use` blocks come as `content_block_start` and `content_block_delta` events with `type: "input_json_delta"`

**Important considerations:**
- Tool names must be alphanumeric with underscores (no dots, no hyphens). Convert action names accordingly (e.g., `sales_book_editor__updateBranding`)
- The AI may call multiple tools in one response
- Each tool call needs a `tool_result` to be sent back in a follow-up request if continuing the conversation. For Layer 1, we execute immediately and include the result in the next user message context.

### 8.2 OpenAI Function-Calling Protocol

OpenAI uses a similar but differently structured approach:

**Request format additions:**
- Add `tools` array with `{ type: "function", function: { name, description, parameters } }` objects
- Or use the older `functions` array (deprecated but simpler)

**Response format when function calling occurs:**
- `message.tool_calls` array with `{ id, type: "function", function: { name, arguments: JSON string } }`
- In streaming mode, tool calls come as deltas with `tool_calls` array

**The API route must handle both providers.** Use an abstraction that normalizes tool-use requests and responses into a common format regardless of which provider is used.

---

## 9. Prompt Engineering Notes

### 9.1 Additional System Prompt Context (When Actions Are Available)

When the request includes registered actions, append the following sections to the system prompt:

**Section: Available Actions**
```
## Tool Control
You can control the user's current design tool by calling the available functions.
When the user asks you to change something, use the appropriate function instead of just describing what they should do.
Always confirm what you changed after executing an action.
For destructive actions (reset, delete), ask for confirmation before proceeding.
You can read the current state to answer questions about the design without making changes.
```

**Section: Current State**
```
## Current Tool State
The user is currently working in: [tool name]
Current configuration:
[JSON representation of current state]
```

### 9.2 AI Behavior Guidelines

Include in the system prompt when actions are available:
- Prefer calling actions over describing manual steps
- For ambiguous requests, ask one clarifying question (don't guess)
- When changing multiple fields, call the fewest actions possible (e.g., one `updateBranding` call with multiple fields, not separate calls for each field)
- After calling an action, briefly confirm what was changed
- If an action fails, explain what went wrong and suggest an alternative
- Never fabricate state — read it from the provided context

---

## 10. Acceptance Criteria — Done When...

### 10.1 Core Functionality
- [ ] A central action registry store exists and tools can register/unregister manifests
- [ ] The `useChikoActions` hook handles mount/unmount registration lifecycle
- [ ] The Sales Book Designer registers its full action manifest when mounted
- [ ] The Invoice Designer registers its full action manifest when mounted
- [ ] The Resume Builder registers its full action manifest when mounted
- [ ] When no actions are registered (e.g., on dashboard), Chiko works exactly as before
- [ ] The API route accepts action descriptors and passes them to Claude's tool-use protocol
- [ ] The API route also works with OpenAI's function-calling protocol (fallback provider)
- [ ] The streaming response correctly interleaves text chunks and action events
- [ ] ChikoAssistant parses the stream and executes actions via the registry
- [ ] Executed actions immediately reflect in the tool's live preview
- [ ] Destructive actions show a confirmation prompt before executing
- [ ] The user can undo any Chiko-executed action with the existing undo system (Ctrl+Z)

### 10.2 AI Quality
- [ ] The AI correctly identifies which action to call for common natural-language requests
- [ ] The AI reads the current tool state to answer "what is..." questions
- [ ] The AI batches multiple field changes into a single action call when possible
- [ ] The AI asks for clarification rather than guessing when the request is ambiguous
- [ ] The AI handles gracefully when the user's request doesn't match any available action

### 10.3 Build Quality
- [ ] Zero TypeScript errors (`npx tsc --noEmit` passes)
- [ ] No new runtime errors in the browser console
- [ ] The action registry is properly cleaned up when navigating away from tool pages
- [ ] Memory usage does not increase unboundedly (manifests are garbage-collected on unmount)

---

## 11. What NOT to Touch

- **Do not modify any tool store implementations.** The stores (`sales-book-editor.ts`, `invoice-editor.ts`, `resume-editor.ts`) should remain exactly as they are. Actions are called from outside the store, not added to it.
- **Do not modify the Chiko 3D avatar, FAB, onboarding, or static avatar components.** These are visual-only and unrelated to the action system.
- **Do not modify the tool registry (`src/data/tools.ts`).** This is the 194-tool catalog — not related to Chiko's action system.
- **Do not modify any CSS, layouts, or theme tokens.** Layer 1 is purely functional, not visual.
- **Do not add any new UI beyond the destructive action confirmation.** The confirmation prompt is the only new visual element. Everything else uses existing chat rendering.
- **Do not add any npm dependencies unless absolutely essential.** The AI providers' tool-use APIs are called via existing `fetch` — no SDK needed. JSON Schema validation can use Zod's `.safeParse()` which is already installed.

---

## 12. Risk Considerations

### 12.1 Streaming Complexity

The current stream handler reads pure text chunks. Adding action events to the same stream creates a mixed-format stream. The parser must handle:
- Text-only responses (when AI doesn't call any action)
- Action-only responses (when AI calls an action without additional text)
- Mixed responses (text + action interleaved)
- Multiple actions in one response

Consider using a delimiter format: Lines starting with a special prefix (e.g., `__CHIKO_ACTION__:`) are action events; everything else is text. Or use Server-Sent Events (SSE) with named event types.

### 12.2 Provider Differences

Claude and OpenAI handle tool use differently. The API route must normalize:
- Request format (Claude `tools` vs OpenAI `functions`)
- Response parsing (Claude `tool_use` content blocks vs OpenAI `tool_calls`)
- Streaming format (Claude `content_block_delta` vs OpenAI `tool_calls` delta)

An internal adapter function should convert between provider-specific formats and a common internal format.

### 12.3 Race Conditions

Actions mutate Zustand stores synchronously, so race conditions are unlikely. However, if the AI sends multiple action events in rapid succession, ensure they execute in order. Process action events sequentially within a single response — do not parallelize.

### 12.4 Error Recovery

If an action fails (invalid parameters, store constraint violation):
- The error message should be captured in the `ChikoActionResult`
- The AI's text response may reference a "successful" change that actually failed
- Consider displaying the action result status alongside the message
- For critical failures, append an error notice to the chat

---

## 13. Estimated Scope

**New files:** 5-6 (registry store, hook, 3 manifest files, barrel export)
**Modified files:** 4 (API route, ChikoAssistant, Chiko store, 3 tool workspace components)
**Lines of code (rough estimate):** 800-1200 new lines, 150-300 modified lines
**Complexity hot spot:** The API route streaming handler — parsing mixed text+action events from two different AI providers

---

## 14. Post-Build Checklist

After Layer 1 is built and verified:

1. Run `npx tsc --noEmit` — must pass with zero errors
2. Test on Sales Book Designer: "Set company name to Test Co" → verify form preview updates
3. Test on Invoice Designer: "Change accent color to green" → verify live preview changes
4. Test on Resume Builder: "Switch to Swiss Typographic template" → verify template changes
5. Test on Dashboard: regular chat conversation still works with no actions
6. Test navigation: moving between tool pages correctly registers/unregisters manifests
7. Test undo: Ctrl+Z after Chiko makes a change reverts it
8. Test destructive: "Reset my form" should prompt for confirmation
9. Update memory bank (`activeContext.md`, `progress.md`) with Layer 1 completion status
10. Write a brief "Reality vs. Plan" note in the Layer 1 section of `CHIKO-AGENT-ARCHITECTURE.md`
11. Only then: begin writing `CHIKO-LAYER-2-SPEC.md` for File Processing
