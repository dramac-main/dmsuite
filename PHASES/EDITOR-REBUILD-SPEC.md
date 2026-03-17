# DMSuite Editor Rebuild — Phased Specification

> **Purpose:** This document is the complete specification for rebuilding the DMSuite business card editor's UI layer, AI prompt philosophy, and interaction engine. It is written for a developer (human or AI) who has never seen this codebase before, and must be implementable from this document alone.
>
> **Critical rule:** The rendering engine, scene-graph schema, command system, hit-test engine, AI patch engine, and icon library are FINISHED and TESTED. They must NOT be rewritten or restructured. This rebuild targets only the UI components, the editor Zustand store (one architectural fix), the AI generation prompt content, and the interaction engine's incomplete tools.

---

## Table of Contents

1. [Architecture Overview — What Exists and What Changes](#1-architecture-overview)
2. [Phase A — AI Prompt Liberation](#phase-a)
3. [Phase B — Editor Store Architectural Fix](#phase-b)
4. [Phase C — Editor UI Rebuild](#phase-c)
5. [Phase D — Interaction Engine Completion](#phase-d)
6. [Phase E — AI Revision UX](#phase-e)
7. [Phase F — Post-Rebuild Cleanup](#phase-f)
8. [Integration Contract Reference](#integration-contracts)
9. [Verification Checklist](#verification)

---

## 1. Architecture Overview — What Exists and What Changes <a id="1-architecture-overview"></a>

### The Two Layers

The editor has two distinct layers:

**ENGINE LAYER (DO NOT TOUCH):**
These files are battle-tested, bug-free, and fully functional. The implementing developer must import from them, never rewrite them.

| File | Location | Purpose | Lines |
|------|----------|---------|-------|
| schema.ts | `src/lib/editor/schema.ts` | DesignDocumentV2 scene-graph types. 8 layer types (text, shape, image, frame, path, icon, group, boolean-group). Paint system (solid, gradient, image, pattern). Effects pipeline (7 types). Transform, blend modes, constraints, rich text, path geometry. All CRUD functions (addLayer, removeLayer, updateLayer, reorderLayerV2, duplicateLayerV2, getLayerOrder). | 1,088 |
| renderer.ts | `src/lib/editor/renderer.ts` | Canvas2D renderer for DesignDocumentV2. Renders all layer types with proper z-order (children[0]=behind, children[last]=on top). Forward iteration. Effects, blending, clipping. Selection handles. Export-quality rendering. | 747 |
| commands.ts | `src/lib/editor/commands.ts` | Undo/redo command system. Command interface with execute/undo functions. Snapshot-based stack with coalescing. Pre-built commands: createMoveCommand, createResizeCommand, createUpdateCommand, createAddLayerCommand, createDeleteCommand, createReorderCommand, createDuplicateCommand, createBatchCommand. Max depth 100. | 382 |
| hit-test.ts | `src/lib/editor/hit-test.ts` | Rotation-aware point-in-layer hit detection. SpatialIndex grid for performance. Handle hit-testing (8 resize handles + rotation). | 283 |
| ai-patch.ts | `src/lib/editor/ai-patch.ts` | AI revision protocol. 48 EditIntent types. 7 PatchOp types. 5 RevisionScope levels. Deep-set that preserves sibling properties. Scope enforcement. Lock-awareness. WCAG contrast checking. buildAIPatchPrompt, parseAIRevisionResponse, processIntent, validateAndApplyPatch. | 1,900 |
| icon-library.ts | `src/lib/editor/icon-library.ts` | 115+ inline SVG icon definitions. ICON_BANK registry. renderIconToCanvas function. getAvailableIcons, searchIcons, getIconsByCategory. | 2,495 |
| business-card-adapter.ts | `src/lib/editor/business-card-adapter.ts` | CardConfig to DesignDocumentV2 conversion. 30 template layouts. Contact layer builder. Logo layer builder. Color/text sync. | 6,805 |
| interaction.ts | `src/lib/editor/interaction.ts` | Pointer state machine. Working: select, move, resize, rotate, marquee, pan. Incomplete: shape draw (starts but no move/up), text (no implementation), draw (no implementation). | 450 |
| design-rules.ts | `src/lib/editor/design-rules.ts` | Color science, typography scales, spacing grids, print safety, snap-to-grid. | ~600 |
| snapping.ts | `src/lib/editor/snapping.ts` | Smart snapping: edge-to-edge, center-to-center, distribution. Snap guides rendering. | ~300 |
| ai-design-generator.ts | `src/lib/editor/ai-design-generator.ts` | AI prompt builder, response parser, document validator/repairer. The PROMPT CONTENT changes in Phase A, but the parser/validator/repair functions must NOT be changed. | 1,459 |

**UI LAYER (REBUILD TARGETS):**

| File | Location | Purpose | Lines | Action |
|------|----------|---------|-------|--------|
| editor.ts | `src/stores/editor.ts` | Zustand store | 413 | Fix (Phase B) |
| CanvasEditor.tsx | `src/components/editor/CanvasEditor.tsx` | Canvas component | 551 | Rebuild (Phase C) |
| EditorToolbar.tsx | `src/components/editor/EditorToolbar.tsx` | Toolbar | 194 | Rebuild (Phase C) |
| LayersListPanel.tsx | `src/components/editor/LayersListPanel.tsx` | Layers panel | 218 | Rebuild (Phase C) |
| LayerPropertiesPanel.tsx | `src/components/editor/LayerPropertiesPanel.tsx` | Properties inspector | 565 | Enhance (Phase C) |
| StepEditor.tsx | `src/components/workspaces/business-card/StepEditor.tsx` | Editor page layout | 300 | Rebuild (Phase C) |
| interaction.ts | `src/lib/editor/interaction.ts` | Pointer state machine | 450 | Complete (Phase D) |

**UI LAYER (KEEP AS-IS — these are working sub-components):**

| File | Purpose | Status |
|------|---------|--------|
| TextStyleEditor.tsx | 12 fonts, all weights, color, italic, alignment, spacing, overflow | Working ✅ |
| ColorPickerPopover.tsx | Full HSV color pad, hex input, RGB, opacity, 24 presets | Working ✅ |
| AlignDistributeBar.tsx | 6 align + 2 distribute actions | Working ✅ |
| TransformEditor.tsx | Position, size, rotation, skew, opacity, flip, aspect lock | Working ✅ |
| BusinessCardLayerQuickEdit.tsx | 12 semantic elements, batch color editing by tag | Working ✅ |

### Key Conventions

- **Z-Order:** children[0]=behind (drawn first), children[last]=on top (drawn last). The layers panel displays them REVERSED so topmost appears first. Never change this convention.
- **Card Size:** 1050×600px at 300 DPI. BLEED_MM=3, SAFE_MM=5 (~59px safe margin).
- **Framework:** Next.js 16+, React 19, TypeScript strict, Tailwind CSS v4 with `@theme inline`.
- **State:** Zustand 5.0.11. The editor store is a standalone store, not part of the wizard store.
- **Dark-First Theme:** Dark mode is default. Surfaces: gray-950 body → gray-900 sidebar → gray-800 cards → gray-700 borders.

---

## Phase A — AI Prompt Liberation <a id="phase-a"></a>

### Goal
Transform the AI design generation prompt from a prescriptive, rule-heavy approach to a context-rich, creatively-free approach. The AI should receive rich context about the brand and industry, see reference designs for inspiration, and be free to create professional designs without being micromanaged on pixel positions.

### What Changes
Only the `buildDesignGenerationPrompt` function in `src/lib/editor/ai-design-generator.ts` is modified. Specifically, only the string content of `systemPrompt` and `userMessage`. The function signature, return type, and all other functions in the file remain identical.

### What Must NOT Change
- The function signature: `buildDesignGenerationPrompt(input: GenerationInput): { systemPrompt: string; userMessage: string }`
- The `GenerationInput` interface
- The `parseDesignResponse` function
- The `repairTruncatedJson` function
- The `parseSingleDoc` function
- The `validateAndFixDocument` function
- The `repairLayer` function
- The `repairStroke`, `repairStrokes`, `repairEffect` functions
- The `callDesignAPI` function
- The `AVAILABLE_ICON_IDS` array
- The `MOOD_TEMPLATE_IDS` mapping
- Any function below the prompt builder

### Philosophy Change

**REMOVE from prompt (prescriptive rules):**
- Hard-coded font size ranges ("Name text: fontSize 28-36")
- Hard-coded position formulas ("position: safeMargin + 20")
- Rigid layout rules ("FRONT: Name (largest, boldest), title, company name, logo")
- Hard-coded size constraints ("transform.size.x >= 400")
- Explicit instructions like "Text layers MUST be LAST in children"

**KEEP in prompt (non-negotiable structural requirements):**
- The JSON schema. The AI must still produce `{"front":{DesignDocumentV2},"back":{DesignDocumentV2}}`. This is not about style — it's about the renderer being able to parse the output.
- The complete JSON example. Keep the structural example but label it clearly as "structural reference for JSON format only — do NOT copy this design."
- The available icon IDs list. The AI must use icons from this list.
- The canvas dimensions and safe area. The AI needs to know the physical constraints.
- The layer type reference. The AI needs to know the schema.
- The children ordering convention: "children array: first element = behind (background), last element = on top." This is a rendering contract, not a design rule.

**ADD to prompt (context and freedom):**

1. **Industry Context.** The user's company name, title, and industry (if inferable) should be passed as rich context. For example: "This person is a Creative Director at a design studio. The card should reflect the creative industry — confident, visually striking, showing design sensibility." The implementing developer should add an `industry` field to the `UserDetails` type in the wizard store if one doesn't already exist, or infer it from the job title and company name.

2. **Brand Personality Context.** Instead of telling the AI "use fontSize 32 fontWeight 700", describe the brand personality: "This is a premium brand that values elegance and restraint" or "This is a tech startup that values energy and innovation."

3. **Reference Design Descriptions.** The `MOOD_STYLE_DESCRIPTIONS` object already contains excellent creative briefs for each style (minimal-clean, bold-modern, classic-elegant, etc.). These should remain and be used MORE prominently. They should be the primary design direction, not a supplement to rigid rules.

4. **Creative Freedom Statement.** Add a clear statement: "You are an elite designer. You have complete creative freedom over composition, layout, typography choices, element placement, decorative elements, and color usage. The only constraints are: (a) all text must be inside the safe area, (b) the person's name must be the most prominent text element, (c) the JSON must conform to the schema, and (d) use only the listed icon IDs."

5. **Anti-Pattern Warning.** Add: "Do NOT produce generic, template-looking designs. Every design should feel hand-crafted and unique. Surprise the viewer with creative composition, unexpected color pairings, or distinctive typography treatments."

### The Restructured System Prompt (Content Guidance)

The system prompt should be restructured into these sections, in this order:

1. **Role and Response Format** (2-3 sentences): You are an elite designer. Return only JSON in the specified format.
2. **Canvas Constraints** (2-3 sentences): Dimensions, safe area, the one structural rule about children ordering.
3. **Creative Freedom** (1 paragraph): You have full creative freedom. The only constraints are readability, safe area, name prominence, valid JSON, and valid icon IDs.
4. **Brand Context** (dynamic): Everything about the person, company, industry, personality.
5. **Style Direction** (from MOOD_STYLE_DESCRIPTIONS): The full creative brief for the selected mood.
6. **JSON Schema Reference** (compact): Layer types, paint format, available icons. Keep this compact — the AI knows JSON.
7. **Structural Example** (the existing complete example): Clearly labeled as "JSON format reference only — create your own unique design."

### The Restructured User Message (Content Guidance)

The user message should contain:
1. Brand information (name, title, company, contact details, social links)
2. Logo status (provided URL or "no logo — use typography")
3. Color palette (if user selected specific colors) or "choose your own professional palette"
4. Font preference (if selected) or "choose appropriate fonts"
5. A single sentence: "Create one exceptional, print-ready business card that would impress a design director."

### Modifications to Supporting Data

The `MOOD_STYLE_DESCRIPTIONS` object is already excellent and should be kept as-is. It provides exactly the kind of rich, creative-brief-style guidance that gives AI context without constraining it.

The `MOOD_TEMPLATE_IDS` object is used for the offline fallback template generator and must remain unchanged.

The `AVAILABLE_ICON_IDS` array must remain unchanged. It lists the 20 icon IDs that actually exist in the icon library.

### Testing Criteria for Phase A
- The prompt must still produce valid JSON that `parseDesignResponse` can parse.
- The total prompt size should remain under 5,000 tokens (currently ~3,660).
- Designs should show more visual variety across different generations.
- Designs should feel less "template-like" and more custom.
- All text must still be inside the safe area (the validator fixes this post-parse, but the prompt should encourage it).
- The back card should have contact info with icons when contact details are provided.

---

## Phase B — Editor Store Architectural Fix <a id="phase-b"></a>

### Goal
Fix the one critical architectural bug in the editor Zustand store: layer CRUD operations bypass the command stack, making them non-undoable.

### The Bug

In `src/stores/editor.ts`, these five functions mutate the document directly via `set({ doc: newDoc })` without creating a Command:

1. `addLayerToDoc(layer, parentId)` — calls `addLayer()` then `set({ doc })`. No command created.
2. `removeLayersFromDoc(ids)` — calls `removeLayer()` in a loop then `set({ doc })`. No command created.
3. `updateLayerInDoc(id, partial)` — calls `updateLayer()` then `set({ doc })`. No command created.
4. `reorderLayerInDoc(id, direction)` — calls `reorderLayerV2()` then `set({ doc })`. No command created.
5. `duplicateLayerInDoc(id)` — calls `duplicateLayerV2()` then `set({ doc })`. No command created.

Meanwhile, the command system already has pre-built commands for ALL of these operations:
- `createAddLayerCommand(layer, parentId)` — in `commands.ts`
- `createDeleteCommand(layerIds)` — in `commands.ts`
- `createUpdateCommand(layerId, changes, label)` — in `commands.ts`
- `createReorderCommand(layerId, direction)` — in `commands.ts`
- `createDuplicateCommand(layerId)` — in `commands.ts`

### The Fix

Each of the five store functions must be rewritten to:
1. Create the appropriate Command object from `commands.ts`
2. Call the store's own `execute(cmd)` method (which already handles both executing the command AND pushing it onto the undo stack)

The store's `execute` method already works correctly:
```
execute: (cmd) => {
    const state = get();
    const newDoc = cmd.execute(state.doc);
    const newStack = executeCommand(state.commandStack, cmd);
    set({ doc: newDoc, commandStack: newStack });
}
```

So each CRUD function should simply become a wrapper that creates a command and calls `execute`.

### Specific Changes

**addLayerToDoc:** Create a `createAddLayerCommand(layer, parentId)` and call `get().execute(cmd)`.

**removeLayersFromDoc:** Create a `createDeleteCommand(ids)` and call `get().execute(cmd)`.

**updateLayerInDoc:** Create a `createUpdateCommand(id, partial)` and call `get().execute(cmd)`. Note: `createUpdateCommand` captures previous state inside its `execute` function, so this is safe.

**reorderLayerInDoc:** Create a `createReorderCommand(id, direction)` and call `get().execute(cmd)`.

**duplicateLayerInDoc:** Create a `createDuplicateCommand(id)` and call `get().execute(cmd)`.

### Additional Fix: Clipboard Operations

The `pasteClipboard` and `cutSelection` functions also bypass the command stack. These should be fixed too:

**pasteClipboard:** Should create a `createBatchCommand` wrapping multiple `createAddLayerCommand` calls, then `execute` the batch.

**cutSelection:** Should create a batch of `createDeleteCommand` (after copying to clipboard), then `execute`.

### What Must NOT Change
- The `execute`, `undoCmd`, `redoCmd`, `canUndo`, `canRedo` implementations — they already work correctly.
- The `selectLayers`, `deselectAll`, `selectedLayerIds` implementations — selection is not a command (it's transient UI state, not undoable).
- The viewport functions (`setViewport`, `zoomTo`, `zoomIn`, `zoomOut`, `fitToCanvas`) — viewport state is not undoable.
- The AI functions (`applyAIPatch`, `applyAIIntent`, `setAIScope`, `setAIProcessing`) — these already use the command stack correctly.
- The lock functions — these are transient UI state.
- The `EditorState` interface — the function signatures stay the same, only the implementations change.

### Import Requirements
The store file must import the command factory functions from `@/lib/editor/commands`:
- `createAddLayerCommand`
- `createDeleteCommand`
- `createUpdateCommand`
- `createReorderCommand`
- `createDuplicateCommand`
- `createBatchCommand`

Some of these may already be imported. Check and add any missing ones.

### Testing Criteria for Phase B
- Add a text layer via the UI → Ctrl+Z should undo it (layer disappears).
- Delete a layer → Ctrl+Z should undo it (layer reappears).
- Change a layer property → Ctrl+Z should revert it.
- Reorder a layer → Ctrl+Z should reverse the reorder.
- Duplicate a layer → Ctrl+Z should remove the duplicate.
- Paste layers → Ctrl+Z should remove the pasted layers.
- The undo/redo buttons in the toolbar should enable/disable correctly.

---

## Phase C — Editor UI Rebuild <a id="phase-c"></a>

### Goal
Rebuild the editor's visual UI to professional, industry-standard quality. The editor should look and feel like a real design tool — clean, precise, with real SVG icons, proper spacing, and every button functional.

### C.1 — Canvas Background Fix

**Current problem:** The canvas workspace background is hardcoded to `#1a1a2e` (a dark purple-blue). This is wrong — design tools use neutral grays so the background doesn't influence color perception of the design.

**Fix:** Change the `workspaceBg` default in `CanvasEditor.tsx` from `"#1a1a2e"` to a neutral dark gray. Use the Tailwind token equivalent of `gray-800` for dark mode (approximately `#1f2937` or the value from the project's theme). The `StepEditor.tsx` should also pass the correct `workspaceBg` prop if it overrides it.

The area OUTSIDE the card artboard should be this neutral gray. The card itself renders its own background via the root frame's fills. This distinction is already implemented correctly — the workspace background is drawn first, then the viewport-transformed document is drawn on top.

### C.2 — Toolbar Rebuild (EditorToolbar.tsx)

**Current problems:**
- Tool icons are emoji characters (↖, ✋, T, □, ✎) instead of proper SVG icons.
- The Text, Shape, and Draw tool buttons exist but do nothing — clicking them sets the mode in the store but no tool logic runs.
- No "add layer" actions anywhere in the toolbar.

**Rebuild specification:**

The toolbar should be a single horizontal bar at the top of the editor area. It should contain these groups, separated by visual dividers:

**Group 1 — Interaction Mode Tools:**
Each button should be a 28×28px square with an SVG icon, a tooltip showing the tool name and keyboard shortcut, and an active state (highlighted when selected).

| Tool | Icon Description | Shortcut | Behavior |
|------|-----------------|----------|----------|
| Select (arrow cursor) | A diagonal arrow pointing up-left | V | Sets mode to "select". This works already. |
| Pan (hand) | An open hand | H | Sets mode to "hand". This works already. |

These two modes are the only ones that work fully today. Text, Shape, and Draw should NOT appear in this group until Phase D completes their interaction logic.

**Group 2 — Add Layer Actions:**
These are action buttons (not mode toggles) that immediately create a new layer:

| Action | Icon Description | Behavior |
|--------|-----------------|----------|
| Add Text | A text cursor (I-beam or "T" with a plus badge) | Creates a new TextLayerV2 at the center of the visible viewport with default text "New Text", selects it, and opens the properties panel focused on text editing. Uses `createAddLayerCommand` through the store. |
| Add Shape | A rectangle with a plus badge | Creates a new ShapeLayerV2 (rectangle, 150×100) at viewport center, selects it. |
| Add Icon | A star or sparkle with a plus badge | Opens an icon picker popover (see C.6), then creates an IconLayerV2 with the chosen icon at viewport center. |

Each "add" action must:
1. Calculate the center of the current viewport in world coordinates using `screenToWorld(canvasWidth/2, canvasHeight/2, viewport)`.
2. Create the appropriate layer with a unique ID (use the pattern `${type}-${Date.now()}-${random4chars}`).
3. Use the store's `addLayerToDoc` (which after Phase B will go through the command stack).
4. Select the new layer.

**Group 3 — Undo / Redo:**
Keep the existing undo/redo buttons but replace emoji arrows with proper SVG icons (curved arrow left for undo, curved arrow right for redo). Tooltips should show "Undo (Ctrl+Z)" and "Redo (Ctrl+Shift+Z)". Disabled state when stack is empty.

**Group 4 — Zoom:**
Keep the existing zoom controls (−, percentage, +) but style them more cleanly. The percentage button resets to 100% on click. Consider adding "Fit to Canvas" as a button (calls `store.fitToCanvas`).

**Group 5 — Alignment (Contextual):**
Keep the existing `AlignDistributeBar` component — it works. Show it only when one or more layers are selected (this logic already exists).

**Group 6 — View Toggles:**
Replace emoji icons (#, ⊞, ⊡) with proper SVG icons:
- Grid toggle: A small grid pattern
- Guides toggle: Crossed lines with arrows
- Snap toggle: A magnet
- Add: Bleed/safe area toggle (sends `showBleedSafe` to viewport). Icon: A card with dashed inner border.

**Visual Design:**
- Background: `bg-gray-900` with `border-b border-gray-700/50`
- Button default: `text-gray-400 hover:text-gray-200 hover:bg-gray-800`
- Button active: `bg-primary-500/20 text-primary-400 border border-primary-500/30`
- Button disabled: `opacity-30 cursor-not-allowed`
- Dividers: A thin vertical line `w-px h-5 bg-gray-700/50 mx-1`
- All icons should be 16×16 SVG, stroke-based (1.5px stroke), matching the project's icon style.

**Where do the SVG icons come from?**
The project has 75+ SVG icons in `src/components/icons.tsx` with an `iconMap` registry. Check if suitable icons exist there first. If not, create new inline SVG components following the same pattern (props for size, className, passed to an `<svg>` element). Register any new icons in `iconMap`. Do NOT use an external icon library — this project uses custom inline SVGs only.

### C.3 — Layers Panel Rebuild (LayersListPanel.tsx)

**Current problems:**
- The `onMoveUp`, `onMoveDown`, and `onDelete` handlers are passed as props to `LayerRow` but the JSX never renders buttons for them. The functions exist but are invisible.
- No drag-to-reorder.
- Layer type icons are emoji characters.
- No right-click context menu.

**Rebuild specification:**

**Layer Row Layout:**
Each layer row should contain, left to right:
1. A drag handle (⋮⋮ or grip dots) — 12px wide, `text-gray-600`, `cursor-grab`.
2. Layer type icon — 14×14 SVG icon (not emoji). Use small, simple icons: "T" for text, a rectangle for shape, a landscape icon for image, a star for icon, a pen for path, a folder for group.
3. Color swatch — 12×12 rounded square showing the layer's primary fill color (the existing `getLayerSwatchColor` function works correctly, keep it).
4. Layer name — truncated text, takes remaining space. For text layers, append a gray preview of the text content (the existing logic does this, keep it).
5. Visibility toggle — an eye icon (open eye = visible, closed/struck-through eye = hidden).
6. Lock toggle — a lock icon (open lock = unlocked, closed lock = locked).
7. Delete button — a trash icon, only visible on hover of the row. Clicking calls `removeLayersFromDoc([layer.id])`.

**Layer Row States:**
- Default: `bg-transparent text-gray-400`
- Hover: `bg-gray-800/50 text-gray-300` + shows delete button
- Selected: `bg-primary-500/10 border-l-2 border-l-primary-500 text-gray-200`
- Locked layers should appear slightly dimmed (`opacity-60`)
- Hidden layers should appear even more dimmed (`opacity-40`) with a strikethrough on the name

**Reorder:**
Clicking up/down is fine as a V1 approach. Add small arrow buttons that appear on hover, positioned between the drag handle and the type icon, one pointing up and one pointing down. They call `reorderLayerInDoc` which after Phase B will be undoable.

Future enhancement (not required for this rebuild): Drag-to-reorder using HTML5 drag events or a library like dnd-kit. Not required now.

**Panel Header:**
- Title: "Layers" in uppercase tracking-wider text, `text-gray-500 text-[10px] font-semibold`
- Layer count badge on the right
- The header should NOT have add-layer buttons — those are in the toolbar (C.2).

**Multi-select:**
The existing Shift/Ctrl+click multi-select logic in the `handleSelect` callback works correctly. Keep it.

### C.4 — Properties Panel Enhancement (LayerPropertiesPanel.tsx)

**Current state:** This panel is actually comprehensive and mostly working. It has sections for transform, text styling, fill, stroke, icon ID, image filters, effects, blend mode, constraints, and tags. The sub-components it uses (TextStyleEditor, ColorPickerPopover, TransformEditor) are all working.

**The one major problem:** The icon ID field is a raw text input. The user has to type "phone" or "email" by hand. This must become an icon picker.

**Changes:**

1. **Icon Picker:** Replace the raw text input for `iconId` with a button that opens an icon picker popover. The popover should:
   - Show a grid of all available icons from the icon library.
   - Use `getAvailableIcons()` from `src/lib/editor/icon-library.ts` to get the list.
   - Each icon renders as a 32×32 cell showing the icon (use `renderIconToCanvas` or render the SVG path directly).
   - Include a search/filter input at the top.
   - Use `searchIcons(query)` from the icon library to filter.
   - Show category tabs or filters using `getIconsByCategory()`.
   - When the user clicks an icon, update the layer's `iconId` via `updateLayerInDoc`.
   - Close the popover after selection.

2. **Section Collapsibility:** Each section (Transform, Text, Fill, Stroke, Effects, etc.) should be collapsible with a small chevron toggle. This is a polish item — the panel can get long when all sections are open.

3. **Empty State:** When no layer is selected, show a centered message: "Select a layer to edit its properties" in `text-gray-600`.

4. **Multi-Select State:** When multiple layers are selected, show only the shared properties (transform section with "Mixed" values, opacity slider, blend mode dropdown). This is an enhancement — if complex, simply show "N layers selected" with just the align/distribute bar.

### C.5 — StepEditor Layout Rebuild

**Current state:** `StepEditor.tsx` is the page-level component that composes the three-column editor layout for the business card wizard's "Refine & Edit" step. It has: left panel (Quick Edit + AI Revision), center (Canvas), right panel (Layers + Properties).

**Current problems:**
- Does not pass `showBleedSafe` or `workspaceBg` to `CanvasEditor`.
- The AI revision section is functional but the UX is basic (just chips + text input).
- The front/back toggle is small and easy to miss.

**Rebuild specification:**

**Top Bar:**
- Left side: Back button ("← Back to Preview"), Front/Back toggle (larger, pill-shaped, clearly showing which side is active with a smooth animated transition), document name display.
- Right side: Layers panel toggle button, "Export →" button (primary action, `bg-primary-500 text-gray-950`).
- The EditorToolbar should render directly below this top bar, visually connected.

**Three-Column Layout:**
- Left panel: Width 256px. Contains Quick Edit section and AI Revision section (details in Phase E).
- Center: Flex-1. Contains CanvasEditor with proper props: `workspaceBg` set to neutral gray, `showBleedSafe={viewport.showBleedSafe}`.
- Right panel: Width 280px. Contains Layers panel (top, flex-shrink-0, max-height 40%) and Properties panel (bottom, flex-1, overflow-y-auto). Togglable via the Layers button.

**Bidirectional Sync:**
The existing sync logic between the wizard store and editor store (using guard refs to prevent circular updates) works correctly. Keep the `isSyncingRef` and `lastLoadedDocRef` pattern. The sync triggers on `documents.currentSide` changes (wizard → editor) and on `doc` changes (editor → wizard).

### C.6 — Icon Picker Component (New)

This is a new component needed by the Properties Panel (C.4) and the Add Icon toolbar action (C.2).

**Component:** `IconPickerPopover.tsx` in `src/components/editor/`

**Behavior:**
- Trigger: A button showing the currently selected icon (or a "Choose icon" placeholder).
- Popover: A floating panel (320×400px) anchored to the trigger button.
- Search: A text input at the top with placeholder "Search icons..."
- Categories: Horizontal pill tabs for icon categories (the icon library has categories).
- Grid: 6-column grid of icon cells. Each cell is 44×44px, showing the icon centered at 24×24 with the icon's name as tooltip.
- Selection: Click an icon → fires `onSelect(iconId: string)` callback → popover closes.
- Current selection: The currently selected icon has a `ring-2 ring-primary-500` highlight.

**Data source:** Import `getAvailableIcons`, `searchIcons`, `getIconsByCategory`, `renderIconToCanvas` from `@/lib/editor/icon-library`. The `getAvailableIcons` function returns `Array<{id: string, name: string, category: string, tags: string[]}>`. The `renderIconToCanvas` function draws an icon onto a canvas context given its ID, position, size, and color.

**Rendering each icon in the picker:**
For each icon cell, create a small `<canvas>` element (44×44) and use `renderIconToCanvas` to draw the icon. Alternatively, if the icon library exports SVG path data, render directly as `<svg>` elements (more performant for a grid). Check what the icon library exports and choose the simpler approach.

---

## Phase D — Interaction Engine Completion <a id="phase-d"></a>

### Goal
Complete the interaction engine's unfinished tools so that the Text, Shape, and Draw mode buttons actually work.

### What Exists

The file `src/lib/editor/interaction.ts` exports three functions:
- `handlePointerDown(doc, istate, mode, worldPoint, screenPoint, viewport, shiftKey, metaKey, shapeType?)` → `InteractionResult`
- `handlePointerMove(doc, istate, worldPoint, screenPoint, viewport, snapEnabled)` → `InteractionResult`
- `handlePointerUp(doc, istate, worldPoint)` → `InteractionResult`

Each returns an `InteractionResult` containing:
- `state`: Updated interaction state
- `commands`: Array of Command objects to execute
- `selection`: Selection changes to apply
- `viewportDelta`: Viewport changes to apply
- `needsRepaint`: Whether canvas needs redraw
- `cursor`: CSS cursor string

The `CanvasEditor.tsx` component calls these functions in its mouse handlers and applies the results to the store. This wiring is correct and should not change.

### D.1 — Shape Drawing Tool

**Current state:** `handlePointerDown` handles `mode === "shape"` by creating a `draw-shape` action with `startWorld` and `shapeType`. But `handlePointerMove` has no case for `draw-shape`, and `handlePointerUp` has no case for it either. The shape is started but never completed.

**Required implementation:**

In `handlePointerMove`, add a case for `action.type === "draw-shape"`:
- Calculate the rectangle from `action.startWorld` to `worldPoint`.
- The width is `Math.abs(worldPoint.x - action.startWorld.x)`, height similarly.
- The position is the top-left corner (min of start and current point for each axis).
- Enforce a minimum size of 10×10.
- If snap is enabled, snap the position and size to grid.
- Do NOT create a command during drag — instead, store the current rectangle in the action state (add `currentWorld` to the draw-shape action type).
- Set cursor to "crosshair".
- Set needsRepaint to true.
- The CanvasEditor's render function should draw a preview rectangle during the drag (add a case similar to the marquee preview but with a solid stroke and no fill, using the primary accent color).

In `handlePointerUp`, add a case for `action.type === "draw-shape"`:
- If the drag was large enough (totalDist >= threshold), create the shape.
- Build a new `ShapeLayerV2` object with:
  - `id`: Generated unique ID
  - `type`: "shape"
  - `shapeType`: from `action.shapeType` (default "rectangle")
  - `name`: "Rectangle" (or appropriate name for the shape type)
  - `tags`: ["shape"]
  - `transform`: position and size from the drawn rectangle
  - `fills`: One solid fill in a default color (e.g., `{kind:"solid", color:{r:100,g:149,b:237,a:1}}` — cornflower blue)
  - `strokes`: Empty array
  - `cornerRadii`: [0,0,0,0]
  - `sides`: 4 (or appropriate for shape type)
  - `innerRadiusRatio`: 1
  - All other LayerBaseV2 defaults (opacity 1, blendMode "normal", visible true, locked false, etc.)
- Create a `createAddLayerCommand` for this layer.
- Return it in `commands`.
- Set `selection` to the new layer's ID.
- Reset mode back to "select" after shape creation.

**Shape type:** The toolbar's shape button should have a dropdown or sub-menu allowing the user to choose: Rectangle, Ellipse, Triangle, Line. The selected shape type is passed as the `shapeType` parameter to `handlePointerDown`. For V1, just defaulting to "rectangle" is acceptable.

### D.2 — Text Creation Tool

**Current state:** `handlePointerDown` and the other handlers have no implementation for `mode === "text"`. The mode can be set but nothing happens.

**Required implementation:**

Text tool behavior should be simple for V1: Click to place a text layer.

In `handlePointerDown`, when `mode === "text"`:
- Create a new `TextLayerV2` at the click position (`worldPoint`) with:
  - `id`: Generated unique ID
  - `type`: "text"
  - `text`: "New Text"
  - `name`: "Text"
  - `tags`: ["text"]
  - `transform`: Position at `worldPoint`, size `{x: 200, y: 40}`
  - `defaultStyle`: `{fontFamily: "Inter", fontSize: 16, fontWeight: 400, italic: false, underline: false, strikethrough: false, letterSpacing: 0, lineHeight: 1.4, fill: {kind: "solid", color: {r:255, g:255, b:255, a:1}}, uppercase: false}`
  - `runs`: empty array
  - `paragraphs`: `[{align: "left", indent: 0, spaceBefore: 0, spaceAfter: 0}]`
  - `overflow`: "clip"
  - `verticalAlign`: "top"
  - All other LayerBaseV2 defaults
- Create a `createAddLayerCommand` for this layer.
- Return it in `commands`.
- Set `selection` to the new layer's ID.
- Switch mode back to "select".

The user then edits the text content in the Properties Panel's text input, which already works.

Future enhancement (not V1): Click-drag to define a text box size, inline text editing directly on canvas. These are complex features that require a text cursor, text selection, and keyboard input handling on the canvas. Not required for this rebuild.

### D.3 — Draw Tool (Freehand Path)

**Current state:** No implementation for `mode === "draw"`.

**This is the lowest priority tool.** For V1, the Draw tool can remain unimplemented but should show a "Coming Soon" toast or tooltip when selected. The button can appear in the toolbar with reduced opacity and a "soon" badge.

If implemented:

In `handlePointerDown` when `mode === "draw"`:
- Start collecting path points. Initialize an array of `Vec2` points.
- Set cursor to "crosshair".

In `handlePointerMove` during draw:
- Add the current `worldPoint` to the points array.
- Build a temporary PathGeometry from the points for preview rendering.
- Set needsRepaint.

In `handlePointerUp`:
- If enough points collected (> 2), create a `PathLayerV2` with:
  - `geometry.commands`: Convert collected points into a series of `{type:"M"}` (first point) followed by `{type:"L"}` for each subsequent point, ending with `{type:"Z"}` if the path is closed (start and end within 10px of each other).
  - Optionally smooth the path using Catmull-Rom → Cubic Bezier conversion for natural-looking curves.
  - `fills`: empty array
  - `strokes`: One stroke with 2px width in white
- Create command and return.
- Switch mode back to "select".

### D.4 — Interaction State Type Update

The `InteractionState` type's `action` union and the `DragState` type in the editor store need to be in sync. If new action types are added (like `draw-path`), the corresponding types must be added to both files. The `DragState` in `src/stores/editor.ts` defines: idle, move, resize, rotate, draw-shape, marquee, pan. If adding `draw-path`, add it to `DragState` too.

### D.5 — Shape Preview During Draw

The `CanvasEditor.tsx` render function currently draws a marquee preview when `istate.action.type === "marquee"`. A similar preview must be added for `draw-shape`:

When `istate.action.type === "draw-shape"` and `istate.phase === "dragging"`:
- Draw a dashed rectangle (or ellipse, depending on shapeType) from `action.startWorld` to `action.currentWorld`.
- Use the primary accent color (`#a3e635` or `primary-400`) for the stroke.
- Use a very low opacity fill (`rgba(163, 230, 53, 0.05)`).
- Line width should be `1 / vp.zoom` to appear constant size regardless of zoom.

### Testing Criteria for Phase D
- Shape tool: Click-drag on canvas → rectangle appears → it's selected → properties panel shows shape properties → Ctrl+Z removes it.
- Text tool: Click on canvas → text layer appears with "New Text" → it's selected → can edit text in properties panel → Ctrl+Z removes it.
- Draw tool: Either works or shows "Coming Soon" gracefully.
- After using any creation tool, mode returns to "select".

---

## Phase E — AI Revision UX <a id="phase-e"></a>

### Goal
Make AI revision a first-class, polished experience with proper feedback, error handling, and richer context.

### Current State
The AI revision in `StepEditor.tsx` works: 8 suggestion chips + free text input → calls `/api/chat/design` → parses response → applies intents/patches. But:
- No success/error feedback to the user.
- No revision history.
- The AI revision prompt does not include any context about the current design's visual state.
- The suggestion chips are generic and don't adapt to the current design.

### E.1 — Feedback States

When an AI revision is in progress:
- Show a loading overlay on the canvas (semi-transparent) with a spinner and "AI is revising..." text.
- The revision input and chips should be disabled.
- The AI processing indicator already exists in CanvasEditor (a pulsing dot) — keep it, but also dim the canvas slightly.

When a revision succeeds:
- Show a brief success toast or banner (2-3 seconds) saying "Revision applied" with a checkmark icon.
- The user should be able to Ctrl+Z to undo the revision (this already works if the AI patch goes through the command stack, which it does — `applyAIPatch` and `applyAIIntent` both create commands).

When a revision fails:
- Show an error toast with a clear message: "Revision failed — try rephrasing your request."
- Log the error details to console for debugging.
- Re-enable the input so the user can try again.

### E.2 — Revision History

Add a simple revision history below the AI revision input:
- Show the last 5 revision instructions with their status (✓ success, ✗ failed).
- Each history entry is a small pill showing the truncated instruction text.
- Clicking a history entry repopulates the input (so the user can retry or modify).

Store this history in the StepEditor's local state (not the Zustand store — it's session-only).

### E.3 — Contextual Suggestion Chips

Instead of static chips, generate contextual suggestions based on the current design state:

1. Read the current document's layers and generate suggestions like:
   - If the background is dark: "Lighten background", "Add gradient overlay"
   - If there's no decorative element: "Add accent shape", "Add pattern"
   - If text is small: "Make text larger", "Increase name prominence"
   - If many effects: "Simplify effects", "Remove shadows"

2. Always include a few universal chips: "Make it bolder", "More minimal", "Swap colors", "Improve spacing"

3. Limit to 8 chips maximum.

This is a polish feature — if too complex, keep the static chips from the current implementation.

### E.4 — AI Context Enhancement

When building the revision prompt (the `handleRevision` function), pass richer context:
- The current design's semantic tags (what elements exist — name, title, company, contact, logo, decorative).
- The current color palette (what colors are used).
- The current font family.
- How many layers exist.

The `buildAIPatchPrompt` function from `ai-patch.ts` already accepts the document and builds context from it. The current implementation passes the doc correctly. No changes needed to `ai-patch.ts` — but the `handleRevision` function in StepEditor should ensure it passes the latest doc state, not a stale reference.

### E.5 — Keyboard Shortcut for AI Revision

Add a keyboard shortcut to focus the AI revision input: pressing `/` (slash) when the canvas is focused should focus the revision text input. This is a common pattern in modern tools (Notion, Linear, etc.).

In `CanvasEditor.tsx`'s `handleKeyDown`, add:
```
if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
    // Focus AI revision input
    // This requires the StepEditor to pass a ref or callback
}
```

The mechanism: `StepEditor` passes an `onRequestAIFocus` callback to `CanvasEditor` (via a new optional prop). When `/` is pressed, `CanvasEditor` calls this callback, and `StepEditor` focuses the revision input using its `revisionInputRef`.

### Testing Criteria for Phase E
- Submit a revision → see loading state → see success/failure feedback.
- Failed revision shows error message and re-enables input.
- Revision history shows recent attempts.
- Ctrl+Z after a successful revision undoes it.
- Pressing `/` on canvas focuses the revision input.

---

## Phase F — Post-Rebuild Cleanup <a id="phase-f"></a>

### Goal
Once Phases A–E are implemented and verified, delete all dead files and development artifacts that have accumulated across 47 sessions. This phase produces zero functional changes — it only removes dead weight from the repository.

### F.1 — Dead Source File (Delete Immediately)

| File | Lines | Reason |
|------|-------|--------|
| `src/components/workspaces/BusinessCardWorkspace.legacy.tsx` | ~1,734 | The old monolithic 3,800-line workspace saved as a backup when the wizard system replaced it. Zero imports from anywhere in the codebase. The current production workspace is the 125-line `BusinessCardWorkspace.tsx` that loads the wizard. |

### F.2 — One-Off Development Scripts (Delete Entire Folder)

The `scripts/` folder contains 33 Python files (~11,450 lines total) that were used during past sessions to analyze reference business card images and bulk-edit template code. Every script has already been executed — their changes are in the codebase. None are referenced by `package.json`, any build process, or any CI pipeline.

**Delete the entire `scripts/` directory.** All 33 files:

**Image analysis scripts (12 files):**
- `analyze-6ed0.py`, `analyze-6ed0-v2.py`, `analyze-6ed0-v3.py` — Pixel sampling of reference card 6ed0
- `analyze-89fb-deep.py`, `analyze-89fb-v2.py`, `analyze-89fb-v3.py`, `analyze-89fb-v4.py` — SH monogram card analysis
- `analyze-business-cards.py` — Claude vision API batch analyzer
- `analyze-card-deep.py`, `analyze-card-detail.py`, `analyze-card-elements.py`, `analyze-card-final.py` — Various card pixel extraction

**Template fix scripts (13 files):**
- `add-logo-to-templates.py` — Added watermark logo calls to 15 layouts
- `fix-clean-accent.py`, `fix-contact-overflow.py`, `fix-corporate-chevron.py` — Individual template fixes
- `fix-cyan-tech.py`, `fix-cyan-tech-back.py` — Cyan-tech template rewrites
- `fix-ff-errors.py`, `fix-font-stacks.py`, `fix-fonts.py` — Font family hardcode fixes
- `fix-logo-company.py` — Logo/company text duplication guard
- `fix-wave-gradient.py`, `fix-zigzag-overlay.py` — Template layout fixes
- `swap-front-back.py` — Swapped front/back for 11 reversed templates

**Template rewrite scripts (6 files):**
- `rewrite-classic-templates.py`, `rewrite-classic-templates-v2.py` — Classic section bulk rewrite
- `rewrite-creative-templates.py`, `rewrite-luxury-templates.py` — Category rewrites
- `rewrite-minimal-templates.py`, `rewrite-modern-templates.py` — Category rewrites

**Verification scripts (2 files):**
- `verify-modern.py`, `verify-templates.py` — Quick existence checks

### F.3 — Reference Image Assets (Delete Entire Folder)

The `business-card-examples/` folder contains:
- **32 reference JPG images** (~1.85 MB) — The original professional business card photos that inspired the 30 template designs.
- **`analysis/` subfolder** — 38 markdown files with pixel-perfect analysis of each reference image (exact colors, fonts, positions, decorative elements).
- **`mockups/` subfolder** — 5 additional reference mockup images.

All design information from these images has been fully extracted and encoded into:
- `TEMPLATE-SPECIFICATIONS.md` (the 30 template specs)
- `LOGO-TREATMENT-SYSTEM.md` (the 12 logo techniques)
- `src/lib/editor/card-template-helpers.ts` (shape builders, path generators)
- `src/lib/editor/business-card-adapter.ts` (30 template layout functions)

The reference images and analysis files are no longer needed. **Delete the entire `business-card-examples/` directory.**

The only files that reference this folder are:
1. The `scripts/` folder (being deleted in F.2)
2. `BUSINESS-CARD-AI-OVERHAUL.md` (being deleted in F.4)

### F.4 — Completed Planning Documents (Delete)

These root-level markdown files were planning/instruction documents used during past development sessions. Their content has been fully implemented and their design decisions are captured in the memory bank.

| File | Purpose | Why Delete |
|------|---------|------------|
| `BUSINESS-CARD-AI-OVERHAUL.md` | Master plan for the AI-powered business card redesign | Fully implemented across sessions 40-47. All architectural decisions captured in memory bank. |
| `TEMPLATE-REBUILD-PROMPT.md` | Instructions for the AI that rebuilt all 30 templates pixel-perfect | All 30 templates rebuilt and verified. The prompt was consumed by the implementing AI and is no longer needed. |
| `TEMPLATE-SPECIFICATIONS.md` | Exact pixel specs for all 30 template designs | Fully encoded into `business-card-adapter.ts` and `card-template-helpers.ts`. The code IS the spec now. |
| `LOGO-TREATMENT-SYSTEM.md` | 12 logo treatment techniques (T1-T12) | Fully encoded into `card-template-helpers.ts` line 865+. The code IS the spec now. |
| `TOOL-AUDIT-GUIDE.md` | Tracking document for the 50-issue deep audit | Audit completed in Session 38. All 12 fixes implemented. |
| `DEVELOPER-PROMPT.md` | General developer instructions | Superseded by `.github/copilot-instructions.md` and the memory bank system. |
| `design-brief.jsonc` | Early design direction notes | Superseded by the memory bank and actual implementation. |

**Keep these root-level files:**
- `README.md` — Project readme (always keep)
- `ROADMAP.md` — High-level project roadmap (still relevant for future phases)
- `PHASES/` folder — Contains this spec and the master plan (actively in use)

### F.5 — Verify No Broken Imports

After all deletions, run:
1. TypeScript build: `npx tsc --noEmit` — must pass with zero errors
2. Next.js build: `npm run build` — must complete successfully
3. Dev server: `npm run dev` — must start without errors

None of the deleted files are imported by any TypeScript/JavaScript source file. The only references are in other files being deleted (scripts referencing business-card-examples) and in memory bank files (which are documentation, not code).

### Cleanup Summary

| Category | Items | Estimated Size |
|----------|-------|----------------|
| Dead source file | 1 file (`.legacy.tsx`) | ~1,734 lines |
| Development scripts | 33 Python files | ~11,450 lines |
| Reference images + analysis | 32 JPGs + 38 MDs + 5 mockups | ~2.5 MB + ~15,000 lines |
| Completed planning docs | 7 markdown files | ~8,000 lines |
| **Total removed** | **~116 files** | **~36,000 lines + ~2.5 MB images** |

---

## Integration Contract Reference <a id="integration-contracts"></a>

This section documents the exact imports, types, and function signatures that the implementing developer must use. These are the contracts between the engine layer (frozen) and the UI layer (being rebuilt).

### From `src/lib/editor/schema.ts`

**Types to import:**
- `DesignDocumentV2` — the document type. Contains `rootFrameId`, `layersById`, `selection`, `resources`, `meta`.
- `LayerV2` — union of all layer types (TextLayerV2 | ShapeLayerV2 | ImageLayerV2 | FrameLayerV2 | PathLayerV2 | IconLayerV2 | GroupLayerV2 | BooleanGroupLayerV2).
- `LayerId` — branded string type for layer IDs.
- `TextLayerV2`, `ShapeLayerV2`, `ImageLayerV2`, `FrameLayerV2`, `PathLayerV2`, `IconLayerV2` — individual layer types.
- `RGBA` — `{r: number, g: number, b: number, a: number}` where r/g/b are 0-255 and a is 0-1.
- `Vec2` — `{x: number, y: number}`.
- `Paint` — union: SolidPaint | GradientPaint | ImagePaint | PatternPaint. Most common: `{kind: "solid", color: RGBA}`.
- `Transform` — `{position: Vec2, size: Vec2, rotation: number, skewX: number, skewY: number, flipX?: boolean, flipY?: boolean, pivot: Vec2}`.
- `BlendMode` — string literal union (16 modes).
- `Effect` — union of 7 effect types (drop-shadow, inner-shadow, blur, glow, outline, color-adjust, noise).

**Functions to import:**
- `addLayer(doc, layer, parentId?) → DesignDocumentV2` — appends layer to parent's children.
- `removeLayer(doc, layerId) → DesignDocumentV2` — removes layer by ID.
- `updateLayer(doc, layerId, partial) → DesignDocumentV2` — shallow-merges partial into layer.
- `reorderLayerV2(doc, layerId, direction) → DesignDocumentV2` — moves layer within children array.
- `duplicateLayerV2(doc, layerId) → DesignDocumentV2` — clones layer with new ID.
- `getLayerOrder(doc) → LayerV2[]` — returns all layers in render order (0=behind, last=on top).
- `defaultTransform(x, y, w, h) → Transform` — creates a transform with default rotation/skew/pivot.
- `rgbaToHex(color: RGBA) → string` — converts RGBA to hex string.
- `createDocumentV2(opts) → DesignDocumentV2` — creates empty document.

### From `src/lib/editor/commands.ts`

**Types to import:**
- `Command` — `{label: string, category: string, coalesceKey?: string, execute(doc) → doc, undo(doc) → doc}`.

**Functions to import:**
- `createMoveCommand(layerIds, dx, dy) → Command`
- `createResizeCommand(layerId, newX, newY, newW, newH, prevX, prevY, prevW, prevH) → Command`
- `createUpdateCommand(layerId, changes, label?) → Command`
- `createAddLayerCommand(layer, parentId?, label?) → Command`
- `createDeleteCommand(layerIds) → Command`
- `createReorderCommand(layerId, direction) → Command`
- `createDuplicateCommand(layerId) → Command`
- `createBatchCommand(commands, label?) → Command`

### From `src/lib/editor/renderer.ts`

**Functions to import:**
- `renderDocumentV2(ctx, doc, options?) → void` — renders the full document to a Canvas2D context.
- `drawSelectionHandlesV2(ctx, layer) → void` — draws selection handles for a layer.

**Types:**
- `RenderOptions` — `{showSelection?: boolean, showGuides?: boolean, showBleedSafe?: boolean, scaleFactor?: number}`. The `scaleFactor` should ALWAYS be 1 when rendering inside the editor viewport (the viewport transform handles zoom). Only use scaleFactor > 1 for export rendering.

### From `src/lib/editor/interaction.ts`

**Functions to import:**
- `handlePointerDown(doc, istate, mode, worldPoint, screenPoint, viewport, shiftKey, metaKey, shapeType?) → InteractionResult`
- `handlePointerMove(doc, istate, worldPoint, screenPoint, viewport, snapEnabled) → InteractionResult`
- `handlePointerUp(doc, istate, worldPoint) → InteractionResult`
- `handleKeyAction(doc, key, ctrlKey, shiftKey) → KeyAction | null`
- `createInteractionState() → InteractionState`
- `screenToWorld(sx, sy, viewport) → Vec2`
- `worldToScreen(wx, wy, viewport) → Vec2`

### From `src/lib/editor/icon-library.ts`

**Functions to import:**
- `getAvailableIcons() → Array<{id, name, category, tags}>` — full icon catalog.
- `searchIcons(query) → Array<{id, name, category, tags}>` — fuzzy search.
- `getIconsByCategory() → Record<string, Array<{id, name, ...}>>` — grouped by category.
- `renderIconToCanvas(ctx, iconId, x, y, size, color) → void` — draws an icon onto a canvas context.

### From `src/lib/editor/ai-patch.ts`

**Functions to import (used by StepEditor's revision handler):**
- `buildAIPatchPrompt(doc, instruction, scope, lockedPaths) → string`
- `parseAIRevisionResponse(text) → {intents?, patchOps?}`
- `processIntent(doc, intent, scope?, lockedPaths?) → PatchResult`
- `validateAndApplyPatch(doc, ops, scope, lockedPaths?, label?) → PatchResult`

**Types:**
- `PatchResult` — `{success: boolean, command?: Command, errors: string[], warnings: string[]}`
- `RevisionScope` — `"full-redesign" | "colors-only" | "typography-only" | "layout-only" | "content-only"`

### From `src/stores/editor.ts`

**The store hook:** `useEditorStore` — Zustand hook returning `EditorState`.

**Key state and actions (all accessed via the hook):**
- `doc` — current DesignDocumentV2
- `setDoc(doc)` — replaces document (resets command stack)
- `execute(cmd)` — executes a command through the undo stack
- `undoCmd()` / `redoCmd()` — undo/redo
- `canUndo()` / `canRedo()` — check availability
- `selectLayers(ids, additive?)` — set selection
- `deselectAll()` — clear selection
- `selectedLayerIds()` — get selected IDs
- `addLayerToDoc(layer, parentId?)` — add layer (after Phase B: undoable)
- `removeLayersFromDoc(ids)` — delete layers (after Phase B: undoable)
- `updateLayerInDoc(id, partial)` — update layer (after Phase B: undoable)
- `reorderLayerInDoc(id, direction)` — reorder (after Phase B: undoable)
- `duplicateLayerInDoc(id)` — duplicate (after Phase B: undoable)
- `mode` / `setMode(mode)` — current interaction mode
- `viewport` / `setViewport(partial)` — viewport state
- `zoomIn()` / `zoomOut()` / `zoomTo(z)` / `fitToCanvas(w, h)` — zoom controls
- `ai` — AI revision state
- `applyAIPatch(ops, scope?)` — apply AI patch operations
- `applyAIIntent(intent, scope?)` — apply single AI intent
- `copySelection()` / `pasteClipboard()` / `cutSelection()` — clipboard

### From `src/stores/business-card-wizard.ts`

**Used by StepEditor for sync:**
- `useBusinessCardWizard()` — hook returning wizard state
- `documents.frontDoc` / `documents.backDoc` — the two card documents
- `documents.currentSide` — "front" | "back"
- `setFrontDoc(doc)` / `setBackDoc(doc)` — update wizard documents
- `setCurrentSide(side)` — switch front/back
- `nextStep()` / `prevStep()` — wizard navigation

---

## Verification Checklist <a id="verification"></a>

After all phases are complete, verify:

### Phase A Verification
- [ ] Generate a business card with "minimal-clean" style — should look unique, not template-like
- [ ] Generate a business card with "bold-modern" style — should be visually striking with creative composition
- [ ] Generate two cards with the same inputs — they should look notably different from each other
- [ ] All generated cards have valid JSON that `parseDesignResponse` handles
- [ ] All text is inside the safe area (or the validator fixes it post-parse)
- [ ] Back cards have icon + text contact pairs when contact info is provided
- [ ] Build passes with zero TypeScript errors

### Phase B Verification
- [ ] Add layer → Ctrl+Z removes it
- [ ] Delete layer → Ctrl+Z restores it
- [ ] Update layer property → Ctrl+Z reverts it
- [ ] Reorder layer → Ctrl+Z reverses it
- [ ] Duplicate layer → Ctrl+Z removes duplicate
- [ ] Paste → Ctrl+Z removes pasted layers
- [ ] Redo works after undo for all above
- [ ] Build passes with zero TypeScript errors

### Phase C Verification
- [ ] Canvas background is neutral gray (not purple-blue)
- [ ] All toolbar icons are SVG (no emoji)
- [ ] Add Text button creates a text layer at viewport center
- [ ] Add Shape button creates a rectangle at viewport center
- [ ] Add Icon button opens picker, creates icon layer after selection
- [ ] Layers panel shows delete button on hover
- [ ] Layers panel delete button works
- [ ] Layers panel reorder arrows work
- [ ] Layer type icons are SVG (not emoji)
- [ ] Icon ID in properties panel uses picker (not text input)
- [ ] All tooltips show keyboard shortcuts
- [ ] Bleed/safe area toggle in toolbar
- [ ] Build passes with zero TypeScript errors

### Phase D Verification
- [ ] Shape tool: Click-drag creates rectangle, appears in layers, selectable, undoable
- [ ] Shape tool: Preview rectangle visible during drag
- [ ] Text tool: Click creates text layer, selectable, editable in properties, undoable
- [ ] Mode returns to "select" after creating a layer
- [ ] Draw tool: Either functional or shows "Coming Soon"
- [ ] Build passes with zero TypeScript errors

### Phase E Verification
- [ ] Loading state visible during AI revision
- [ ] Success feedback shown after revision
- [ ] Error feedback shown on failure
- [ ] Revision history shows last 5 attempts
- [ ] Ctrl+Z undoes AI revision
- [ ] `/` key focuses revision input
- [ ] Build passes with zero TypeScript errors

### Phase F Verification
- [ ] `BusinessCardWorkspace.legacy.tsx` deleted
- [ ] Entire `scripts/` folder deleted (33 Python files)
- [ ] Entire `business-card-examples/` folder deleted (32 JPGs + 38 analysis MDs + 5 mockups)
- [ ] 7 completed planning docs deleted (BUSINESS-CARD-AI-OVERHAUL.md, TEMPLATE-REBUILD-PROMPT.md, TEMPLATE-SPECIFICATIONS.md, LOGO-TREATMENT-SYSTEM.md, TOOL-AUDIT-GUIDE.md, DEVELOPER-PROMPT.md, design-brief.jsonc)
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes successfully
- [ ] `npm run dev` starts without errors
- [ ] No broken imports anywhere

### General
- [ ] All existing features still work (select, move, resize, rotate, marquee, pan, zoom, snap, grid)
- [ ] Business card wizard flow works end-to-end (enter details → choose style → generate → edit → export)
- [ ] Dark mode styling consistent throughout
- [ ] No console errors or warnings in normal operation
- [ ] TypeScript strict mode — zero errors

---

## Implementation Order

The phases are ordered by dependency and risk:

1. **Phase B first** — smallest change, highest impact. Without undoable CRUD, everything else feels broken. This is 20 lines of code changes in one file.

2. **Phase A second** — prompt changes are independent of UI. Can be tested immediately by generating cards.

3. **Phase C third** — the bulk of the work. The UI rebuild depends on Phase B (add-layer buttons need undoable CRUD).

4. **Phase D fourth** — interaction engine completion depends on Phase C (toolbar needs to expose the tools).

5. **Phase E fifth** — AI revision UX depends on Phase C (layout changes) and benefits from Phase A (better AI output).

6. **Phase F last** — cleanup. Only after all phases are verified working. Delete dead files, scripts, reference images, and completed planning docs. ~116 files, ~36,000 lines, ~2.5 MB images removed.

Each phase can be tested independently before moving to the next. If any phase is blocked, the others can proceed (except C needs B, and D needs C for the toolbar). Phase F must be last — never delete files until everything is verified.

---

*Document version: 1.0 — Generated from complete codebase audit of all engine and UI files.*
