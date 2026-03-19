# Chiko Layer 5 — Full Agent Workflows

## Build Specification

> **Layer:** 5 of 5 (Final Layer)
> **Depends on:** Layer 1 (Action System) ✅, Layer 2 (File Processing) ✅, Layer 3 (Custom Blocks) ✅, Layer 4 (Business Memory) ✅
> **Architecture reference:** `PHASES/CHIKO-AGENT-ARCHITECTURE.md` — Section 7
> **Scope:** Cross-tool workflow engine, programmatic navigation, export actions, autonomous multi-step orchestration

---

## 1. What This Layer Does

Layer 5 transforms Chiko from a single-tool controller into a **multi-tool workflow orchestrator**. Today, Chiko can brilliantly control whichever tool is currently on screen — change branding, add custom blocks, pre-fill from memory, process uploaded files. But it cannot coordinate across tools. If a user says "Create a complete sales book set — invoice, receipt, quotation, delivery note, and purchase order — all matching my branding," Chiko cannot do that. The user must navigate to each tool manually, ask Chiko to configure each one, then export each one.

**After Layer 5, the user experience becomes:**

1. User: "Create my complete sales book set with my branding"
2. Chiko: "I'll create 5 matching documents using your Dramac Solutions branding. Starting with Invoice..."
3. Chiko navigates to the invoice workspace, pre-fills branding from Business Memory, sets accent color, selects a template, adds a QR code block → reports progress
4. Chiko: "Invoice configured. Moving to Receipt..."
5. Chiko navigates to the receipt workspace, pre-fills branding, applies matching style → reports progress
6. Steps repeat for Quotation, Delivery Note, Purchase Order
7. Chiko: "All 5 documents are configured and ready. Would you like me to export them all as PDF?"
8. User: "Yes" → Chiko triggers exports in sequence

**This is the capstone of the 5-layer architecture.** No new concept exists in isolation — Layer 5 composes everything from Layers 1-4 into coordinated multi-step workflows.

---

## 2. The Cross-Tool Problem

### 2.1 The Registration Lifecycle Challenge

The current action system is designed for single-tool control. The fundamental constraint:

- When a tool workspace mounts, its manifest registers with the action registry
- When the user navigates away, the workspace unmounts, the manifest unregisters
- Only manifests for currently-mounted tools are available
- Business Memory is the sole exception — it registers globally in ChikoAssistant with no cleanup

This means Chiko can only execute actions on the tool that is currently visible. If Chiko needs to configure the Invoice workspace and the user is on the Dashboard, Chiko has zero invoice actions available.

### 2.2 The Solution: Navigate-Wait-Execute Pattern

Layer 5 introduces a three-phase pattern for cross-tool orchestration:

1. **Navigate** — Chiko calls a global `navigateToTool` action that programmatically routes to the target workspace
2. **Wait** — The workflow engine waits for the target workspace to mount and its manifest to register with the action registry
3. **Execute** — Once the manifest is registered, Chiko proceeds with the planned actions on that tool

This pattern requires:
- A global workflow manifest (like Business Memory) that is always available regardless of route
- A way to detect when a target manifest has registered (the "ready" signal)
- Workflow state that persists across page navigations

### 2.3 Why Not Pre-Register All Manifests?

An alternative approach would be to register all tool manifests globally on app start. This is rejected because:
- Manifests depend on live store references — they call store methods directly
- Tool stores with `temporal(immer(...))` middleware initialize state on component mount
- Pre-registering would mean manifests reference stores that may not have initialized their editor state yet
- Sales Book and Invoice use different stores for different document types — the store reference depends on which workspace variant is mounted
- Token cost: sending all 58+ action descriptions to the AI on every request would consume approximately 6,000-12,000 tokens before the user even sends a message

The navigate-wait-execute pattern preserves the existing per-tool registration model while enabling cross-tool workflows.

---

## 3. Workflow Engine Store

### 3.1 Purpose

A new Zustand store that tracks the state of multi-step workflows. This store persists via localStorage so that a workflow survives page navigations and accidental browser refreshes.

### 3.2 Workflow State Shape

The store tracks:

| Field | Type | Description |
|---|---|---|
| `activeWorkflow` | `ActiveWorkflow \| null` | The currently running workflow, or null if idle |
| `workflowHistory` | `WorkflowHistoryEntry[]` | Completed workflows (last 10, for reference) |

### 3.3 ActiveWorkflow Shape

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique workflow ID (UUID) |
| `name` | `string` | Human-readable name (e.g., "Complete Sales Book Set") |
| `status` | `"running" \| "paused" \| "awaiting-navigation" \| "awaiting-confirmation" \| "completed" \| "cancelled"` | Current workflow state |
| `steps` | `WorkflowStep[]` | Ordered list of steps |
| `currentStepIndex` | `number` | Zero-based index of the step currently being executed |
| `createdAt` | `string` | ISO timestamp when the workflow was started |
| `pausedAt` | `string \| null` | ISO timestamp when paused, if paused |
| `completedAt` | `string \| null` | ISO timestamp when completed |

### 3.4 WorkflowStep Shape

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique step ID |
| `label` | `string` | Human-readable description (e.g., "Configure Invoice with branding") |
| `toolId` | `string` | The tool workspace this step targets (e.g., "sales-book-a4", "invoice-designer") |
| `status` | `"pending" \| "navigating" \| "in-progress" \| "completed" \| "skipped" \| "failed"` | Step state |
| `actions` | `StepAction[]` | The actions to execute on the target tool |
| `result` | `string \| null` | Summary of what was done (filled after completion) |
| `error` | `string \| null` | Error message if step failed |

### 3.5 StepAction Shape

| Field | Type | Description |
|---|---|---|
| `actionName` | `string` | The manifest action to call (e.g., "updateBranding", "prefillFromMemory") |
| `params` | `Record<string, unknown>` | Parameters for the action |
| `executed` | `boolean` | Whether this action has been executed |
| `result` | `string \| null` | Result message from execution |

### 3.6 Store Actions

| Action | Description |
|---|---|
| `startWorkflow(name, steps)` | Creates an ActiveWorkflow, sets status to "running", currentStepIndex to 0 |
| `advanceStep()` | Marks current step as completed, increments currentStepIndex, sets next step to "navigating" |
| `markStepCompleted(result)` | Sets current step status to "completed" with result string |
| `markStepFailed(error)` | Sets current step status to "failed" with error string, pauses workflow |
| `markActionExecuted(stepIndex, actionIndex, result)` | Marks a specific action within a step as executed |
| `pauseWorkflow()` | Sets status to "paused", records pausedAt timestamp |
| `resumeWorkflow()` | Sets status to "running", clears pausedAt |
| `cancelWorkflow()` | Sets status to "cancelled", moves to history |
| `skipStep()` | Sets current step to "skipped", advances to next step |
| `completeWorkflow()` | Sets status to "completed", moves to history |
| `getActiveWorkflow()` | Returns the current active workflow or null |
| `getProgressSummary()` | Returns a human-readable string summarizing progress (e.g., "Step 3 of 5: Configuring Receipt") |

### 3.7 Persistence Rules

- **Persist:** `activeWorkflow` and `workflowHistory` via Zustand `persist` middleware with localStorage key `"dmsuite-chiko-workflows"`
- **Partialize:** Only `activeWorkflow` and `workflowHistory` are persisted (not any transient UI state)
- **History cap:** Keep last 10 completed/cancelled workflows, drop oldest on overflow
- **No immer/temporal:** Simple flat updates — the undo system operates on individual tool stores, not the workflow store

---

## 4. Workflow Manifest (Global)

### 4.1 Purpose

A new manifest that registers globally in ChikoAssistant (same pattern as Business Memory — useEffect with no cleanup). This manifest gives the AI the ability to manage workflows and navigate between tools.

### 4.2 Manifest Identity

| Field | Value |
|---|---|
| `toolId` | `"workflow-engine"` |
| `toolName` | `"Workflow Engine"` |

### 4.3 Actions

#### 4.3.1 `navigateToTool`

**Category:** Navigation
**Description:** Navigate the user to a specific tool workspace. Used as the first step when Chiko needs to work on a tool that is not currently on screen. After calling this action, Chiko must wait for the tool's manifest to become available before executing actions on it.

**Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `toolId` | `string` | Yes | The tool ID to navigate to (e.g., "sales-book-a4", "invoice-designer", "resume-builder") |

**Behavior:**
1. Looks up the tool in the `toolCategories` data (same lookup as the existing `/navigate` slash command)
2. If not found, returns failure: "Tool not found"
3. Constructs the path using the existing `getToolPath()` helper
4. Calls `router.push(path)` with the existing 500ms setTimeout pattern
5. Returns success: "Navigating to {toolName}..."
6. If a workflow is active, sets the current step status to "navigating"

**Important:** This action does NOT wait for the target page to mount. The wait happens at the orchestration layer (Section 5).

#### 4.3.2 `startWorkflow`

**Category:** Workflow
**Description:** Begin a new multi-step workflow. This action creates a workflow plan and starts execution. Only one workflow can be active at a time.

**Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Human-readable workflow name |
| `steps` | `array` | Yes | Array of step objects, each containing `label` (string), `toolId` (string), and `actions` (array of `{ actionName, params }`) |

**Behavior:**
1. Checks if a workflow is already active — if yes, returns failure: "A workflow is already in progress. Cancel or complete it first."
2. Validates that each step's toolId exists in the tool registry
3. Creates the ActiveWorkflow object with UUID, timestamps, and all steps in "pending" status
4. Sets currentStepIndex to 0
5. Returns success with a summary: "Workflow '{name}' started with {N} steps"

#### 4.3.3 `advanceWorkflow`

**Category:** Workflow
**Description:** Advance the workflow to the next step. Call this after completing all actions in the current step. If all steps are complete, this finishes the workflow.

**Parameters:** None.

**Behavior:**
1. If no active workflow, returns failure
2. Marks current step as completed
3. If there are more steps, increments currentStepIndex, sets next step to "navigating"
4. If this was the last step, calls `completeWorkflow()`, returns "Workflow complete! All {N} steps finished."
5. Returns the next step's label and toolId so the AI knows what to do next

#### 4.3.4 `pauseWorkflow`

**Category:** Workflow
**Description:** Pause the current workflow. The user can resume later. Useful when the user wants to review or manually adjust something mid-workflow.

**Parameters:** None.

**Behavior:**
1. Sets workflow status to "paused"
2. Returns "Workflow paused at step {N} of {total}: {stepLabel}"

#### 4.3.5 `resumeWorkflow`

**Category:** Workflow
**Description:** Resume a paused workflow from where it left off.

**Parameters:** None.

**Behavior:**
1. If no active workflow or workflow is not paused, returns failure
2. Sets status to "running"
3. Returns the current step details so the AI can continue

#### 4.3.6 `cancelWorkflow`

**Category:** Workflow
**Description:** Cancel the active workflow. This stops execution but does not undo changes already made to individual tools.

**Parameters:** None.
**Destructive:** Yes — requires user confirmation.

**Behavior:**
1. Sets workflow status to "cancelled"
2. Moves to history
3. Returns "Workflow cancelled. Changes made to individual tools are preserved — use undo on each tool to revert."

#### 4.3.7 `getWorkflowStatus`

**Category:** Workflow
**Description:** Get the current status of the active workflow, including which step is in progress and what has been completed.

**Parameters:** None.

**Behavior:**
1. If no active workflow, returns "No workflow is currently active"
2. Returns a structured summary: workflow name, status, current step index, step-by-step status list

#### 4.3.8 `skipStep`

**Category:** Workflow
**Description:** Skip the current workflow step and move to the next one.

**Parameters:** None.

**Behavior:**
1. Marks current step as "skipped"
2. Advances to next step
3. Returns what was skipped and what's next

**Total: 8 workflow manifest actions**

### 4.4 getState()

Returns:
- Whether a workflow is active
- Workflow name, status, and progress summary
- Current step label and toolId
- Number of completed steps vs total steps
- Available tools: short list of tool IDs that Chiko commonly navigates to

---

## 5. The Wait-For-Manifest Orchestration

### 5.1 The Core Problem

After `navigateToTool` is called, there is a gap:
1. `router.push()` is called (500ms delay for UX)
2. React unmounts the current page → old manifest unregisters
3. React mounts the new page → new workspace component initializes
4. The workspace's `useChikoActions` hook fires → new manifest registers

Between step 1 and step 4, there is a period where the target manifest is not yet registered. If the AI immediately tries to call actions on the target tool, it will fail ("Tool not registered").

### 5.2 The Solution: Registry Subscription + Ready Signal

The orchestration layer subscribes to the action registry and waits for the target manifest to appear.

**Implementation approach:**

1. After `navigateToTool` succeeds, the workflow engine sets a "waiting for" flag with the expected `toolId`
2. A subscription on the `chiko-actions` registry store watches for manifest registrations
3. When the expected manifest appears in the registry, the "ready" signal fires
4. The workflow engine clears the waiting flag and signals that the AI can proceed
5. If the manifest does not appear within a timeout (5 seconds), the step is marked as failed with an error

**Integration with the stream handler:**

In ChikoAssistant, after a `navigateToTool` action is executed during a workflow, the stream handler should NOT immediately continue to the next AI action. Instead:
1. The navigate action executes → returns "Navigating to..."
2. The stream processing pauses action execution (not the text stream)
3. A manifest-ready listener is set up on the action registry
4. When ready fires, the remaining queued actions (if any from the same response) resume execution

However, in practice, the more robust pattern is:

1. The AI calls `navigateToTool` as one tool-call in its response
2. The AI's response ends (it cannot call actions on a tool that isn't registered yet)
3. ChikoAssistant detects that a workflow is active AND the navigate action just completed
4. ChikoAssistant waits for the target manifest to register (subscribe to registry)
5. Once the manifest is registered, ChikoAssistant sends an **automatic follow-up message** to the AI with the workflow context: "Navigation complete. {toolName} is now active. Current workflow step: {stepLabel}. The following actions are now available: [list from new manifest]. Please proceed with the planned actions."
6. The AI responds with the actions for this tool, which are now valid because the manifest is registered

### 5.3 The Auto-Continue Pattern

This is the key innovation for Layer 5. When a workflow is active:

1. **After every AI response that ends a step,** ChikoAssistant checks if there's a next step
2. If yes, it automatically sends a continuation prompt to the AI: "Step {N} complete. Next step: {label} on {toolName}. Please navigate and proceed."
3. The AI responds by calling `navigateToTool` → then the manifest-ready wait → then another auto-continue
4. This creates a **self-driving loop** where Chiko autonomously progresses through the workflow

**Guardrails on auto-continue:**
- Maximum of 20 auto-continue cycles before requiring user confirmation
- User can type any message at any time to interrupt the workflow
- Each step's completion is displayed in the chat with a visual workflow progress indicator
- Destructive actions still require explicit user confirmation (existing Layer 1 behavior)
- If any step fails, the workflow pauses and asks the user what to do

### 5.4 Timing Constants

| Constant | Value | Purpose |
|---|---|---|
| Navigate delay | 500ms | Existing `setTimeout` before `router.push` |
| Manifest ready timeout | 5000ms | Maximum wait for target manifest to register after navigation |
| Manifest poll interval | 100ms | How often to check if the registry has the expected toolId (if using polling instead of subscription) |
| Auto-continue delay | 800ms | Pause between completing a step and sending the auto-continue message (UX breathing room) |
| Max auto-continue cycles | 20 | Hard limit before requiring user input |

---

## 6. Export Actions

### 6.1 Why Export Needs to Be an Action

For Chiko to execute a complete workflow (configure all documents, then export them all), it needs the ability to trigger exports programmatically. Currently, all export functions are called from UI button handlers — Chiko has no way to invoke them.

### 6.2 New Export Actions per Manifest

#### Sales Book Export Action

Add to the existing `sales-book` manifest:

| Action | Description |
|---|---|
| `exportPrint` | Open the browser print dialog for the current sales book form. This triggers the same `window.print()` flow as the Print button in the UI. |

**Parameters:** None.

**Behavior:**
Calls the existing `handlePrint()` logic — opens a new window with the print area HTML and calls `window.print()`. Returns success with "Print dialog opened for {documentType}."

**Note:** Since `handlePrint()` currently lives inside the workspace component (not the store), this action needs access to the DOM print area. The manifest factory should accept a callback reference to the print handler, injected by the workspace component when creating the manifest.

#### Invoice Export Action

Add to the existing `invoice` manifest:

| Action | Description |
|---|---|
| `exportDocument` | Export the current invoice as the specified format |

**Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `format` | `string` | Yes | One of: "pdf", "csv", "txt", "json", "clipboard", "print" |

**Behavior:**
Calls the existing `exportInvoice(format, options)` function with the current invoice data from the store. Returns success with "Exported invoice as {format}."

**Note:** The `exportInvoice` function requires `containerRef` (a DOM element reference) for PDF export. Similar to the sales book print handler, the manifest factory should accept a callback reference.

#### Resume Export Action

Add to the existing `resume` manifest:

| Action | Description |
|---|---|
| `exportDocument` | Export the current resume as the specified format |

**Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `format` | `string` | Yes | One of: "pdf", "docx", "txt", "json", "clipboard", "print" |

**Behavior:**
Calls the existing `exportResume(format, options)` function with the current resume data from the store. Returns success with "Exported resume as {format}."

### 6.3 DOM Reference Pattern for Export

Export functions that generate PDFs need DOM element references (for html2canvas-pro to capture). The current manifests are pure data/store operations — they don't hold DOM refs.

**Solution:** The manifest factory functions already accept store references. Extend this pattern to accept optional callback refs:

1. The workspace component creates a ref for its export/print handler (it already has these)
2. When building the manifest factory call, the workspace passes `{ onExport: exportHandlerRef }` or similar
3. The manifest's `exportDocument` action calls this ref when invoked
4. If the ref is not available (e.g., tool just navigated to, DOM not yet painted), the action returns a soft failure: "Export not ready yet — please wait a moment and try again"

**Important:** Since the manifest factory is called once on mount (via `useChikoActions`), and refs may not be stable at mount time, the factory should accept a ref object (React `RefObject`) that is read at execution time, not at registration time.

---

## 7. System Prompt Enhancement

### 7.1 Workflow Context Injection

The existing system prompt (in `route.ts`) already receives tool state and business profile. For Layer 5, add a **workflow context section** that is included whenever a workflow is active.

#### New system prompt block (injected conditionally):

**Section name:** "Active Workflow Context"

**Content to include:**
- Workflow name and overall status
- Total steps and current step index
- For each step: label, toolId, status (pending/completed/skipped/failed/in-progress)
- What the current step expects (planned actions)
- What has been completed so far (step results)

**When to include:** Only when `workflowStore.activeWorkflow` is not null.

### 7.2 Workflow-Aware Instructions

Add these behavioral rules to the system prompt when a workflow is active:

1. "You are currently executing a multi-step workflow. Stay focused on the current step. Do not skip ahead or go back to previous steps."
2. "After completing all actions for the current step, call `workflow_engine__advanceWorkflow` to move to the next step."
3. "If a step fails, explain the failure to the user and pause the workflow using `workflow_engine__pauseWorkflow`."
4. "When navigating to a new tool, call `workflow_engine__navigateToTool` with the target toolId. Wait for the continuation prompt before executing actions."
5. "Always pre-fill from Business Memory when starting a new document, if the user has a stored profile."
6. "Report progress clearly — tell the user which step you are on, what you are doing, and what is next."

### 7.3 Token Budget Consideration

The current `max_tokens` is set to 2048. For workflow responses where the AI needs to call multiple actions (navigate + pre-fill + update style + add custom block), 2048 may be tight.

**Recommendation:** When a workflow is active, increase `max_tokens` to 4096. This gives the AI room to emit multiple tool_use blocks plus explanatory text in a single response. The increase is conditional — only applied when the workflow engine reports an active workflow.

---

## 8. ChikoAssistant Integration

### 8.1 What Changes in ChikoAssistant

ChikoAssistant is the orchestration hub. For Layer 5, it needs these modifications:

#### 8.1.1 Workflow Manifest Registration

Same pattern as Business Memory — register the workflow manifest globally in the existing `useEffect` block that already registers the business-memory manifest. The workflow manifest has no cleanup (always available).

#### 8.1.2 Workflow State in API Payload

Add `workflowContext` to the fetch body sent to the API route. This is a string summary of the active workflow state (from `getProgressSummary()`). Include it alongside the existing `businessProfile` and `toolState` fields.

#### 8.1.3 Auto-Continue Logic

New `useEffect` that watches two things:
1. The workflow store's `activeWorkflow.status`
2. The action registry's `manifests` Map (to detect newly registered manifests)

**Logic:**

```
if activeWorkflow exists AND status is "running":
  if current step status is "navigating":
    // Wait for target manifest
    targetToolId = current step's toolId
    if registry has manifest with targetToolId:
      update step status to "in-progress"
      send auto-continue message to AI:
        "Navigation complete. Now on {toolName}. Proceed with step {N}: {stepLabel}"
    else:
      // Still waiting — do nothing (will re-check on next registry change)
  
  if current step status is "completed" AND there is a next step:
    wait 800ms (auto-continue delay)
    send auto-continue message:
      "Step {N} complete: {result}. Next step: {nextLabel} on {nextToolId}. Please proceed."
  
  if all steps completed:
    send completion message:
      "Workflow complete! Here's a summary: {step results}"
```

#### 8.1.4 Auto-Continue Message Type

Auto-continue messages should appear in the chat history as system messages with a distinct visual style — not as user messages (the user didn't type them) and not invisible (the user should see workflow progress). Use a new message type or a flag on the message:

| Field | Value |
|---|---|
| `role` | `"user"` (required by the AI API) |
| `isAutoContinue` | `true` (new flag for UI styling) |

Visually, these render as compact workflow progress cards — not full message bubbles. They should show: a workflow progress indicator (step X of Y), the instruction text, and optionally a "Pause" button.

#### 8.1.5 Workflow Progress UI

When a workflow is active, show a **persistent workflow banner** at the top of the Chiko chat panel:

- Workflow name
- Progress bar (steps completed / total steps)
- Current step label
- Status indicator (running / paused / awaiting navigation)
- Pause button
- Cancel button (with confirmation)

This banner is outside the message scroll area so it's always visible.

#### 8.1.6 User Interruption Handling

If the user sends a message while a workflow is running, the workflow should NOT auto-cancel. Instead:

1. The user message is sent to the AI as normal
2. The workflow context is included in the system prompt as usual
3. The AI can decide to: answer the question and continue the workflow, pause the workflow if the user is changing direction, or modify the remaining steps
4. The auto-continue chain pauses while the user is actively chatting (resume after the AI's response if the workflow is still running)

---

## 9. Slash Commands

### 9.1 New Workflow Slash Commands

Add to the existing `handleLocalCommand()` function:

| Command | Aliases | Behavior |
|---|---|---|
| `/workflow status` | `/wf status` | Shows current workflow status (if any) |
| `/workflow pause` | `/wf pause` | Pauses the active workflow |
| `/workflow resume` | `/wf resume` | Resumes a paused workflow |
| `/workflow cancel` | `/wf cancel` | Cancels the active workflow (with confirmation) |
| `/workflow history` | `/wf history` | Shows last 10 completed workflows |

These are local commands — they do NOT go to the AI. They directly interact with the workflow store.

### 9.2 Natural Language Workflow Triggers

The existing natural language navigation detection regex catches phrases like "take me to..." and "go to...". Add similar detection for common workflow phrases:

| Pattern | Triggers |
|---|---|
| "create my sales book set" | Sends the message to the AI with workflow context — the AI decides to start a workflow |
| "build my brand identity" | Same — sent to AI |
| "set up all my business documents" | Same — sent to AI |

These do NOT trigger hardcoded workflows. They are simply sent to the AI, which decides whether to call `startWorkflow` based on the user's intent and available context. The AI is the workflow planner — the client is the executor.

---

## 10. AI as the Workflow Planner

### 10.1 Why the AI Plans Workflows (Not Hardcoded Templates)

An earlier design (Architecture doc Section 7) described "workflow templates" — predefined sequences. This spec moves away from hardcoded templates for these reasons:

1. **Flexibility:** The AI can create workflows based on ANY natural language request, not just predefined ones
2. **Context-awareness:** The AI knows the user's business profile, current tool state, and conversation history — it can tailor the workflow dynamically
3. **Adaptability:** If a step fails or the user wants a change, the AI can re-plan on the fly
4. **Simplicity:** No workflow template registry to maintain — the AI model is the template engine
5. **Discoverable:** Users don't need to know workflow names or syntax — they just describe what they want

### 10.2 How the AI Creates a Workflow

When the user requests something multi-step, the AI calls `startWorkflow` with a dynamically generated plan:

**Example — "Create my complete sales book set":**

The AI analyzes:
- User has Business Memory profile → will pre-fill from memory
- User wants a "complete" set → invoice, receipt, quotation, delivery note, purchase order
- All Sales Book document types use the same workspace with `convertToType`

The AI calls `startWorkflow`:
```
name: "Complete Sales Book Set — Dramac Solutions"
steps: [
  { label: "Configure Invoice book", toolId: "sales-book-a4", actions: [
    { actionName: "resetForm", params: { documentType: "invoice" } },
    { actionName: "prefillFromMemory", params: {} },
    { actionName: "updateStyle", params: { accentColor: "#2563eb", fontPairing: "modern" } }
  ]},
  { label: "Configure Receipt book", toolId: "sales-book-a4", actions: [
    { actionName: "convertToType", params: { type: "receipt" } },
    { actionName: "prefillFromMemory", params: {} }
  ]},
  { label: "Configure Quotation book", toolId: "sales-book-a4", actions: [
    { actionName: "convertToType", params: { type: "quotation" } },
    { actionName: "prefillFromMemory", params: {} }
  ]},
  { label: "Configure Delivery Note book", toolId: "sales-book-a4", actions: [
    { actionName: "convertToType", params: { type: "delivery-note" } },
    { actionName: "prefillFromMemory", params: {} }
  ]},
  { label: "Configure Purchase Order book", toolId: "sales-book-a4", actions: [
    { actionName: "convertToType", params: { type: "purchase-order" } },
    { actionName: "prefillFromMemory", params: {} }
  ]}
]
```

**Important nuance:** All Sales Book document types share the same `sales-book-a4` workspace. The AI calls `convertToType` to switch between types WITHOUT navigating away. The workflow engine recognizes that the toolId hasn't changed and skips the navigate-wait cycle for consecutive steps on the same tool.

### 10.3 Same-Tool Step Optimization

When two consecutive steps target the same `toolId`, the workflow engine:
1. Skips the `navigateToTool` call (already on the right page)
2. Skips the manifest-ready wait (manifest is already registered)
3. Immediately sets the step to "in-progress"
4. Sends the auto-continue message without the navigation phase

This makes same-tool workflows (like configuring multiple document types) feel much faster.

### 10.4 Cross-Tool Workflow Example

**"Build me a brand identity":**

```
name: "Brand Identity Package — Dramac Solutions"
steps: [
  { label: "Create logo", toolId: "ai-logo-generator", actions: [
    { actionName: "generateLogo", params: { companyName: "Dramac Solutions", style: "modern" } }
  ]},
  { label: "Design business card", toolId: "business-card-wizard", actions: [
    { actionName: "prefillFromMemory", params: {} },
    { actionName: "setStyle", params: { template: "modern-dark" } }
  ]},
  { label: "Set up invoice template", toolId: "sales-book-a4", actions: [
    { actionName: "prefillFromMemory", params: {} },
    { actionName: "updateStyle", params: { accentColor: "#2563eb" } }
  ]},
  { label: "Save branding to Business Memory", toolId: "business-memory", actions: [
    { actionName: "saveProfile", params: { preferredAccentColor: "#2563eb" } }
  ]}
]
```

**Note:** This workflow references tools that may not yet have Chiko manifests (ai-logo-generator, business-card-wizard). The workflow engine handles this gracefully — if the target tool's manifest doesn't register within the timeout, the step is marked as "failed" and the AI is informed. The AI can then skip that step or ask the user to configure it manually.

---

## 11. File List

### 11.1 New Files to Create

| # | File | Purpose | Approximate Size |
|---|---|---|---|
| 1 | `src/stores/chiko-workflows.ts` | Workflow engine Zustand store with persist middleware | ~200 lines |
| 2 | `src/lib/chiko/manifests/workflow-engine.ts` | Global workflow manifest (8 actions): navigate, start, advance, pause, resume, cancel, status, skip | ~350 lines |

### 11.2 Files to Modify

| # | File | Changes |
|---|---|---|
| 3 | `src/lib/chiko/manifests/index.ts` | Add barrel export for `createWorkflowManifest` |
| 4 | `src/lib/chiko/manifests/sales-book.ts` | Add `exportPrint` action; accept optional print handler ref in factory |
| 5 | `src/lib/chiko/manifests/invoice.ts` | Add `exportDocument` action; accept optional export handler ref in factory |
| 6 | `src/lib/chiko/manifests/resume.ts` | Add `exportDocument` action; accept optional export handler ref in factory |
| 7 | `src/app/api/chiko/route.ts` | Add `workflowContext` to request body; inject workflow context into system prompt; increase max_tokens to 4096 when workflow active |
| 8 | `src/components/Chiko/ChikoAssistant.tsx` | Register workflow manifest globally; add auto-continue logic; add workflow progress UI banner; add `/workflow` slash commands; add manifest-ready detection; pass workflowContext in API payload |
| 9 | `src/components/workspaces/sales-book-designer/SalesBookDesignerWorkspace.tsx` | Pass print handler ref to manifest factory |
| 10 | `src/components/workspaces/invoice-designer/InvoiceDesignerWorkspace.tsx` | Register invoice manifest via `useChikoActions`; pass export handler ref (**fixes the missing registration bug**) |

**Total: 2 new files, 8 modified files**

---

## 12. Data Flow

### 12.1 Workflow Start Flow

```
User: "Create my sales book set with matching branding"
    ↓
ChikoAssistant sends message to API (with businessProfile, toolState, workflowContext: null)
    ↓
API route includes workflow instructions in system prompt
    ↓
AI decides this needs a multi-step workflow
    ↓
AI responds with tool_use: workflow_engine__startWorkflow({ name, steps })
    ↓
Stream emits __CHIKO_ACTION__: startWorkflow
    ↓
ChikoAssistant executes → workflow store creates ActiveWorkflow
    ↓
AI also emits text explaining the plan to the user
    ↓
AI may also emit actions for step 1 (if the user is already on the right tool)
    ↓
Step 1 actions execute → step marked completed
    ↓
Auto-continue fires → sends next step prompt to AI
    ↓
... cycle repeats through all steps ...
    ↓
Last step completes → AI calls advanceWorkflow → workflow marked complete
    ↓
Chiko shows completion summary
```

### 12.2 Cross-Tool Navigation Flow

```
Step N completes on Tool A
    ↓
Auto-continue fires: "Next step: {label} on {Tool B}"
    ↓
AI calls workflow_engine__navigateToTool({ toolId: "tool-b" })
    ↓
Action executes: router.push() → page navigation begins
    ↓
React unmounts Tool A workspace → Tool A manifest unregisters
    ↓
React mounts Tool B workspace → Tool B manifest registers
    ↓
ChikoAssistant detects: workflow status is "running" AND current step toolId matches newly registered manifest
    ↓
Auto-continue fires: "Navigation complete. Tool B is active. Proceed with step N+1."
    ↓
AI responds with Tool B actions → execute → step completes
```

### 12.3 Pause/Resume Flow

```
User types a message during an active workflow
    ↓
Auto-continue chain pauses (any pending auto-continue timer is cleared)
    ↓
User message is sent to AI with full workflow context
    ↓
AI responds — may pause workflow, answer question, or modify plan
    ↓
If workflow still running: auto-continue resumes after AI response
If workflow paused: user must say "resume" or use /workflow resume
```

---

## 13. Edge Cases and Error Handling

### 13.1 Navigation to Unregistered Tool

If the AI navigates to a tool that doesn't have a Chiko manifest (e.g., business-card-wizard which currently has no manifest), the manifest-ready timeout (5s) will fire. The step is marked as "failed" with the error: "Tool {toolId} did not register a Chiko manifest within the timeout period. This tool may not support Chiko automation yet."

The AI is informed of this failure in the next auto-continue message and can decide to skip the step or ask the user to configure the tool manually.

### 13.2 Browser Refresh Mid-Workflow

The workflow state persists in localStorage. On page reload:
1. ChikoAssistant mounts, reads workflow store → finds active workflow
2. The workflow status is preserved (running/paused)
3. The current page may or may not match the expected step's toolId
4. If the user landed on the right tool page, the manifest registers → auto-continue can resume
5. If the user landed on a different page (e.g., dashboard), the workflow status is shown in the banner, but auto-continue does NOT fire. The user can use `/workflow resume` or say "continue my workflow"

### 13.3 Concurrent User Actions

If the user manually changes tool settings while Chiko is executing a workflow step, the changes are preserved. Chiko's actions apply on top of whatever state exists — it uses the same store methods a human would. There is no conflict resolution because there is no race condition — Chiko's actions execute sequentially in the main thread.

### 13.4 Workflow Cancellation Mid-Step

If the user cancels during an active step (actions partially executed), the already-executed actions are NOT reverted automatically. Each tool has its own undo history (via Zundo temporal middleware). The cancellation message tells the user: "Changes made so far are preserved. Use undo on each tool to revert."

### 13.5 Token Budget Overflow

If the workflow context + tool state + business profile + message history exceeds the AI provider's context window, the system prompt should truncate workflow history (completed step results) before truncating anything else. Completed steps only need their status ("completed") — not the full result text — in the system prompt.

### 13.6 Multiple Steps on Same Tool

When consecutive steps target the same toolId, the store state carries over between steps. This means step 2 can build on step 1's changes. For example: step 1 does `resetForm("invoice")` + `prefillFromMemory`, step 2 does `convertToType("receipt")` — the branding from step 1 is preserved because `convertToType` preserves branding fields (existing behavior).

### 13.7 Invoice Manifest Registration Fix

The subagent exploration revealed that the invoice manifest (`src/lib/chiko/manifests/invoice.ts`) has 23 fully implemented actions but is NEVER registered by any workspace component. This is a pre-existing bug from Layer 1.

**Fix as part of Layer 5:** Add `useChikoActions(createInvoiceManifest)` to the invoice-designer workspace component. This also provides the opportunity to pass the export handler ref for the new `exportDocument` action.

**Note:** The "invoice-designer" workspace referenced here is the standalone invoice editor at `src/components/workspaces/invoice-designer/`, NOT the Sales Book wrapper that handles invoice books. The Sales Book's `InvoiceBookWorkspace` already has Chiko support via the sales-book manifest.

---

## 14. Workflow Progress UI Specification

### 14.1 Workflow Banner

A compact, persistent banner that appears at the top of the Chiko chat panel when a workflow is active.

**Visual structure:**
- Background: `bg-primary-500/10` with `border-primary-500/30` left border accent
- Top row: Workflow name (bold, truncated at 40 chars) + Status badge ("Running" / "Paused" / "Navigating...")
- Middle row: Progress bar — thin track with filled segments for completed steps, pulsing segment for current step
- Bottom row: Current step label + "Pause" / "Cancel" buttons (small, ghost style)

**States:**
- Running: Progress bar pulses on current step, status badge is primary/green
- Paused: Progress bar is static, status badge is amber/yellow
- Awaiting navigation: Progress bar pulses, status badge says "Navigating to {toolName}..."
- Completed: Banner shows completion summary for 5 seconds, then auto-dismisses

### 14.2 Step Progress Cards in Chat

Each completed step appears as a compact card in the chat message stream:

**Visual structure:**
- Small roundel with step number (e.g., "1", "2", "3")
- Step label text
- Status icon: checkmark (completed), skip icon (skipped), X (failed)
- Collapsible detail: what actions were executed

These cards render inline in the chat where the auto-continue messages occur, NOT as separate message bubbles.

### 14.3 Completion Summary

When a workflow finishes, Chiko sends a final message with:
- Workflow name + total time elapsed
- Step-by-step results list
- Count of successful / skipped / failed steps
- If any exports were done, a summary of exported files

---

## 15. Acceptance Criteria

### 15.1 Core Workflow Engine

- [ ] Workflow store exists at `src/stores/chiko-workflows.ts` with all state shapes and actions from Section 3
- [ ] Workflow store persists to localStorage under key `"dmsuite-chiko-workflows"`
- [ ] Only one workflow can be active at a time
- [ ] Workflow history is capped at 10 entries

### 15.2 Workflow Manifest

- [ ] Workflow manifest registers globally in ChikoAssistant (no cleanup)
- [ ] All 8 actions from Section 4.3 are implemented and functional
- [ ] `navigateToTool` correctly resolves tool paths using existing `getToolPath` logic
- [ ] `cancelWorkflow` is marked as destructive (requires confirmation)

### 15.3 Navigate-Wait-Execute

- [ ] After `navigateToTool` is called, ChikoAssistant waits for the target manifest to register
- [ ] If the manifest registers within 5 seconds, the workflow continues automatically
- [ ] If the manifest does not register within 5 seconds, the step is marked as failed
- [ ] Same-tool consecutive steps skip the navigation phase entirely

### 15.4 Auto-Continue

- [ ] When a workflow step completes, an auto-continue message is sent after 800ms
- [ ] Auto-continue messages appear in chat with distinct styling (not as user messages)
- [ ] Auto-continue pauses when the user sends a manual message
- [ ] Auto-continue resumes after the AI responds to the user's interruption (if workflow still running)
- [ ] Maximum 20 auto-continue cycles before requiring user confirmation

### 15.5 Export Actions

- [ ] Sales Book manifest has `exportPrint` action that triggers the print dialog
- [ ] Invoice manifest has `exportDocument` action supporting all 6 formats
- [ ] Resume manifest has `exportDocument` action supporting all 6 formats
- [ ] Export actions handle missing DOM refs gracefully with a retry-friendly error message

### 15.6 System Prompt

- [ ] Workflow context is injected into the system prompt when a workflow is active
- [ ] Workflow-specific behavioral rules are included (Section 7.2)
- [ ] `max_tokens` increases to 4096 when a workflow is active
- [ ] `workflowContext` field is added to the API request body

### 15.7 Slash Commands

- [ ] `/workflow status` shows current workflow info
- [ ] `/workflow pause` pauses the active workflow
- [ ] `/workflow resume` resumes a paused workflow
- [ ] `/workflow cancel` cancels with confirmation
- [ ] `/workflow history` shows last 10 completed workflows
- [ ] `/wf` aliases work for all commands

### 15.8 UI

- [ ] Workflow progress banner appears at top of Chiko panel when workflow is active
- [ ] Banner shows name, progress bar, current step, action buttons
- [ ] Step completion cards appear inline in chat
- [ ] Auto-continue messages render as compact workflow progress cards
- [ ] Banner auto-dismisses 5 seconds after workflow completion

### 15.9 Invoice Manifest Bug Fix

- [ ] Invoice designer workspace registers the invoice manifest via `useChikoActions`
- [ ] All 23 invoice manifest actions are accessible to Chiko when on the invoice page

### 15.10 Build Verification

- [ ] Zero TypeScript errors (tsc --noEmit passes clean)
- [ ] No hardcoded hex colors — all colors use Tailwind tokens
- [ ] No pixel values — all spacing uses Tailwind spacing scale
- [ ] All new components are `"use client"` where required
- [ ] No console.log statements left in production code

---

## 16. What This Does NOT Include

To keep Layer 5 focused and buildable, the following are explicitly out of scope:

1. **Workflow editing UI** — Users cannot visually build or edit workflow steps via a drag-and-drop interface. Workflows are created by the AI based on natural language.
2. **Workflow sharing** — Workflows are local only. No import/export of workflow definitions.
3. **Parallel step execution** — All steps execute sequentially. No parallel branches.
4. **Conditional branching** — Steps cannot have if/else logic. The AI handles decisions dynamically.
5. **Scheduled workflows** — No timer-based or scheduled execution.
6. **Cross-session resume** — If a workflow is interrupted by closing the browser, the state is preserved but auto-continue does NOT resume on next visit. The user must explicitly resume.
7. **Manifests for all 99 tools** — Only tools with existing manifests (Sales Book, Invoice, Resume) and Business Memory are orchestrated. Other tools will gain manifests in future work.
8. **Workflow-to-workflow chaining** — One workflow at a time. No nesting.

---

## 17. Dependencies and Build Order

### 17.1 Build Sequence

The builder should implement in this order:

1. **Workflow store** (`chiko-workflows.ts`) — Pure state management, no external dependencies
2. **Workflow manifest** (`workflow-engine.ts`) — Depends on workflow store + action registry + tool data
3. **Barrel export update** (`manifests/index.ts`) — One-line addition
4. **Export actions on existing manifests** — Sales Book, Invoice, Resume (parallel-safe edits)
5. **Invoice manifest registration fix** — `InvoiceDesignerWorkspace.tsx`
6. **API route update** (`route.ts`) — workflowContext + max_tokens conditional
7. **ChikoAssistant integration** — Global registration + auto-continue + progress UI + slash commands (largest change, do last)

### 17.2 External Dependencies

**No new npm packages required.** Layer 5 composes existing capabilities:
- Zustand (already installed) for the workflow store
- Existing `persist` middleware pattern for localStorage
- Existing `router.push()` for navigation
- Existing export functions for each tool
- Existing action registry subscription via Zustand's `subscribe`

### 17.3 Verification Steps

After building:
1. Run `npx tsc --noEmit` — must show zero errors
2. Manually test: Open Chiko on dashboard, say "Create my sales book set" → verify workflow starts, navigates, configures
3. Test pause/resume via `/workflow pause` and `/workflow resume`
4. Test cancellation via `/workflow cancel`
5. Test browser refresh mid-workflow → verify state persists and banner shows
6. Test user interruption mid-workflow → verify auto-continue pauses and resumes
7. Test navigation to a tool without a manifest → verify graceful timeout failure
