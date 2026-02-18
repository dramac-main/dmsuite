// =============================================================================
// DMSuite — AI Patch Protocol
// Two modes: (1) strict JSON patch ops, (2) high-level intents.
// Both are validated, scoped, lock-aware, and produce undoable commands.
// The AI NEVER mutates the document directly — all edits flow through here.
// =============================================================================

import type {
  DesignDocumentV2, LayerV2, LayerId,
  TextLayerV2, ShapeLayerV2, ImageLayerV2, FrameLayerV2,
  IconLayerV2,
  Paint, RGBA,
} from "./schema";
import {
  getLayerOrder,
  createTextLayerV2, createShapeLayerV2, createImageLayerV2,
  createIconLayerV2,
  solidPaint, hexToRGBA, rgbaToHex,
} from "./schema";
import type { Command } from "./commands";
import { createBatchCommand, createUpdateCommand, createAddLayerCommand, createDeleteCommand, createReorderCommand } from "./commands";
import { clampToRange, isWCAG_AA, getReadableColor, contrastRatio } from "./design-rules";

// ---------------------------------------------------------------------------
// 1. Revision Scope (what the AI is allowed to touch)
// ---------------------------------------------------------------------------

export type RevisionScope =
  | "text-only"
  | "colors-only"
  | "layout-only"
  | "element-specific"
  | "full-redesign";

/** Allowed JSON pointer prefixes per scope */
const SCOPE_ALLOWED_PATHS: Record<RevisionScope, string[]> = {
  "text-only": [
    "/text", "/defaultStyle/fontSize", "/defaultStyle/fontWeight",
    "/defaultStyle/fontFamily", "/defaultStyle/italic", "/defaultStyle/underline",
    "/defaultStyle/uppercase", "/defaultStyle/letterSpacing", "/defaultStyle/lineHeight",
    "/defaultStyle/fill", "/defaultStyle/stroke",
    "/paragraphs", "/runs", "/name",
  ],
  "colors-only": [
    "/fills", "/strokes", "/defaultStyle/fill", "/defaultStyle/stroke",
    "/color", "/imageFilters/temperature", "/imageFilters/saturation",
    "/effects",
  ],
  "layout-only": [
    "/transform/position", "/transform/size", "/transform/rotation",
    "/transform/skewX", "/transform/skewY",
    "/constraints",
  ],
  "element-specific": [
    // Everything is allowed for specifically targeted elements
    "/",
  ],
  "full-redesign": [
    // Everything
    "/",
  ],
};

// ---------------------------------------------------------------------------
// 2. Strict Patch Operations
// ---------------------------------------------------------------------------

export interface PatchOp {
  /** Operation type (RFC 6902 subset + custom) */
  op: "replace" | "add" | "remove" | "reorder" | "add-layer" | "remove-layer";
  /** Target layer ID */
  layerId?: LayerId;
  /** JSON pointer path within the layer (e.g., "/defaultStyle/fontSize") */
  path?: string;
  /** New value for replace/add ops */
  value?: unknown;
  /** For reorder */
  direction?: "up" | "down" | "top" | "bottom";
  /** For add-layer: the full layer data */
  layerData?: Partial<LayerV2> & { type: string };
  /** For add-layer: parent ID */
  parentId?: LayerId;
}

export interface PatchResult {
  /** Whether the patch was applied successfully */
  success: boolean;
  /** The resulting command (if successful) — undoable */
  command?: Command;
  /** Applied operations */
  applied: PatchOp[];
  /** Rejected operations (with reasons) */
  rejected: Array<{ op: PatchOp; reason: string }>;
  /** Design rule warnings (non-blocking) */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// 3. Validate & Apply Patch
// ---------------------------------------------------------------------------

/**
 * Validate a batch of patch ops against the document + scope + locks,
 * then produce a single undoable Command.
 */
export function validateAndApplyPatch(
  doc: DesignDocumentV2,
  ops: PatchOp[],
  scope: RevisionScope,
  lockedPaths: Map<LayerId, string[]> = new Map(),
  label = "AI Edit"
): PatchResult {
  const applied: PatchOp[] = [];
  const rejected: Array<{ op: PatchOp; reason: string }> = [];
  const warnings: string[] = [];
  const commands: Command[] = [];

  const allowedPrefixes = SCOPE_ALLOWED_PATHS[scope];

  for (const op of ops) {
    // 1. Scope check
    if (op.path && !allowedPrefixes.some(p => p === "/" || op.path!.startsWith(p))) {
      rejected.push({ op, reason: `Path "${op.path}" not allowed in scope "${scope}"` });
      continue;
    }

    // 2. Lock check
    if (op.layerId && op.path) {
      const locks = lockedPaths.get(op.layerId) ?? [];
      if (locks.some(lock => op.path!.startsWith(lock))) {
        rejected.push({ op, reason: `Path "${op.path}" is locked on layer ${op.layerId}` });
        continue;
      }
    }

    // 3. Layer existence check
    if (op.layerId && op.op !== "add-layer" && !doc.layersById[op.layerId]) {
      rejected.push({ op, reason: `Layer "${op.layerId}" not found` });
      continue;
    }

    // 4. Value range validation
    if (op.op === "replace" && op.value !== undefined && op.path) {
      const rangeCheck = validateValueRange(op.path, op.value);
      if (rangeCheck) {
        warnings.push(rangeCheck);
        // Clamp rather than reject
        op.value = clampValue(op.path, op.value);
      }
    }

    // 5. Convert to command
    try {
      const cmd = opToCommand(doc, op);
      if (cmd) {
        commands.push(cmd);
        applied.push(op);
        // Apply incrementally so subsequent ops see the result
        doc = cmd.execute(doc);
      }
    } catch (err) {
      rejected.push({ op, reason: `Execution error: ${(err as Error).message}` });
    }
  }

  // 6. Post-patch design rule check (warnings only — non-blocking)
  const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2 | undefined;
  if (rootFrame) {
    const allLayers = getLayerOrder(doc).filter(l => l.id !== doc.rootFrameId);
    const bg = rootFrame.fills[0]?.kind === "solid" ? rootFrame.fills[0].color : { r: 255, g: 255, b: 255, a: 1 };

    for (const layer of allLayers) {
      if (layer.type === "text") {
        const t = layer as TextLayerV2;
        const textColor = t.defaultStyle.fill.kind === "solid" ? t.defaultStyle.fill.color : null;
        if (textColor && !isWCAG_AA(textColor, bg)) {
          warnings.push(
            `Warning: Text "${t.text.substring(0, 20)}..." may have low contrast (${contrastRatio(textColor, bg).toFixed(1)}:1)`
          );
        }
      }
    }
  }

  if (commands.length === 0) {
    return { success: false, applied, rejected, warnings };
  }

  const batchCmd = createBatchCommand(commands, label);
  batchCmd.category = "ai";

  return { success: true, command: batchCmd, applied, rejected, warnings };
}

// ---------------------------------------------------------------------------
// 4. Op → Command conversion
// ---------------------------------------------------------------------------

function opToCommand(doc: DesignDocumentV2, op: PatchOp): Command | null {
  switch (op.op) {
    case "replace": {
      if (!op.layerId || !op.path) return null;
      const layer = doc.layersById[op.layerId];
      if (!layer) return null;

      const changes = setNestedValue({}, op.path, op.value);
      return createUpdateCommand(op.layerId, changes as Partial<LayerV2>, `Set ${op.path}`);
    }

    case "add": {
      if (!op.layerId || !op.path) return null;
      // For arrays (fills, strokes, effects): push to array
      const layer = doc.layersById[op.layerId];
      if (!layer) return null;

      const changes = setNestedValue({}, op.path, op.value);
      return createUpdateCommand(op.layerId, changes as Partial<LayerV2>, `Add to ${op.path}`);
    }

    case "remove": {
      if (!op.layerId) return null;
      // If path is specified, remove a nested property; otherwise remove the layer
      if (op.path) {
        const changes = setNestedValue({}, op.path, undefined);
        return createUpdateCommand(op.layerId, changes as Partial<LayerV2>, `Remove ${op.path}`);
      }
      return null;
    }

    case "reorder": {
      if (!op.layerId || !op.direction) return null;
      return createReorderCommand(op.layerId, op.direction);
    }

    case "add-layer": {
      if (!op.layerData) return null;
      const newLayer = createLayerFromAIData(op.layerData);
      if (!newLayer) return null;
      return createAddLayerCommand(newLayer, op.parentId, `Add ${newLayer.type} layer`);
    }

    case "remove-layer": {
      if (!op.layerId) return null;
      return createDeleteCommand([op.layerId]);
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 5. High-Level Intents (deterministic translation → patch ops)
// ---------------------------------------------------------------------------

export type IntentType =
  | "make-bigger" | "make-smaller"
  | "align" | "distribute"
  | "change-color" | "make-warmer" | "make-cooler"
  | "increase-contrast" | "improve-hierarchy"
  | "add-spacing" | "reduce-spacing"
  | "center" | "move-to"
  | "make-bold" | "make-lighter"
  | "add-shadow" | "remove-shadow"
  | "add-border" | "remove-border"
  | "change-font-size" | "change-opacity"
  | "swap-colors" | "harmonize-colors"
  | "ensure-readable" | "fix-contrast";

export interface EditIntent {
  type: IntentType;
  /** Target layers — by ID, tag, name, or type */
  target: LayerTarget;
  /** Intent-specific parameters */
  params?: Record<string, unknown>;
}

export interface LayerTarget {
  /** Direct layer IDs */
  ids?: LayerId[];
  /** Match layers by tag */
  tags?: string[];
  /** Match layers by name (contains) */
  nameContains?: string;
  /** Match layers by type */
  layerType?: LayerV2["type"];
  /** Special selectors */
  special?: "all" | "selected" | "largest-text" | "primary-image" | "background";
}

/**
 * Resolve a target to actual layer IDs (deterministic, no AI needed).
 */
export function resolveTarget(doc: DesignDocumentV2, target: LayerTarget): LayerId[] {
  const allLayers = getLayerOrder(doc).filter(l => l.id !== doc.rootFrameId);

  if (target.ids && target.ids.length > 0) {
    return target.ids.filter(id => doc.layersById[id]);
  }

  let candidates = allLayers;

  if (target.tags && target.tags.length > 0) {
    candidates = candidates.filter(l =>
      target.tags!.some(tag => l.tags.includes(tag))
    );
  }

  if (target.nameContains) {
    const search = target.nameContains.toLowerCase();
    candidates = candidates.filter(l => l.name.toLowerCase().includes(search));
  }

  if (target.layerType) {
    candidates = candidates.filter(l => l.type === target.layerType);
  }

  if (target.special) {
    switch (target.special) {
      case "all":
        return allLayers.map(l => l.id);
      case "selected":
        return doc.selection.ids;
      case "largest-text": {
        const texts = allLayers.filter(l => l.type === "text") as TextLayerV2[];
        if (texts.length === 0) return [];
        texts.sort((a, b) => b.defaultStyle.fontSize - a.defaultStyle.fontSize);
        return [texts[0].id];
      }
      case "primary-image": {
        const images = allLayers.filter(l => l.type === "image");
        if (images.length === 0) return [];
        images.sort((a, b) => (b.transform.size.x * b.transform.size.y) - (a.transform.size.x * a.transform.size.y));
        return [images[0].id];
      }
      case "background": {
        return [doc.rootFrameId];
      }
    }
  }

  return candidates.map(l => l.id);
}

/**
 * Convert a high-level intent into concrete patch ops.
 * This is the DETERMINISTIC planner — no AI/LLM needed.
 */
export function intentToPatchOps(doc: DesignDocumentV2, intent: EditIntent): PatchOp[] {
  const layerIds = resolveTarget(doc, intent.target);
  if (layerIds.length === 0) return [];

  const ops: PatchOp[] = [];

  switch (intent.type) {
    case "make-bigger": {
      const factor = (intent.params?.factor as number) ?? 1.2;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        const { size, position } = layer.transform;
        const newW = size.x * factor;
        const newH = size.y * factor;
        // Keep centered
        const newX = position.x - (newW - size.x) / 2;
        const newY = position.y - (newH - size.y) / 2;
        ops.push({ op: "replace", layerId: id, path: "/transform/size", value: { x: newW, y: newH } });
        ops.push({ op: "replace", layerId: id, path: "/transform/position", value: { x: newX, y: newY } });

        // If text, also scale font
        if (layer.type === "text") {
          const t = layer as TextLayerV2;
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontSize", value: Math.round(t.defaultStyle.fontSize * factor) });
        }
      }
      break;
    }

    case "make-smaller": {
      const factor = (intent.params?.factor as number) ?? 0.8;
      // Reuse make-bigger logic with inverted factor
      return intentToPatchOps(doc, { ...intent, type: "make-bigger", params: { factor } });
    }

    case "center": {
      const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2;
      if (!rootFrame) break;
      const canvasW = rootFrame.transform.size.x;
      const canvasH = rootFrame.transform.size.y;
      const axis = (intent.params?.axis as "horizontal" | "vertical" | "both") ?? "both";

      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        const newPos = { ...layer.transform.position };
        if (axis === "horizontal" || axis === "both") {
          newPos.x = (canvasW - layer.transform.size.x) / 2;
        }
        if (axis === "vertical" || axis === "both") {
          newPos.y = (canvasH - layer.transform.size.y) / 2;
        }
        ops.push({ op: "replace", layerId: id, path: "/transform/position", value: newPos });
      }
      break;
    }

    case "change-color": {
      const color = intent.params?.color as string;
      if (!color) break;
      const rgba = hexToRGBA(color);

      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;

        if (layer.type === "text") {
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fill", value: solidPaint(rgba) });
        } else if (layer.type === "shape") {
          ops.push({ op: "replace", layerId: id, path: "/fills/0", value: solidPaint(rgba) });
        } else if (layer.type === "icon") {
          ops.push({ op: "replace", layerId: id, path: "/color", value: rgba });
        }
      }
      break;
    }

    case "make-warmer": {
      const amount = (intent.params?.amount as number) ?? 15;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        const color = getLayerPrimaryColor(layer);
        if (color) {
          const warmer: RGBA = { ...color, r: Math.min(255, color.r + amount), b: Math.max(0, color.b - amount), a: color.a };
          applyColorToLayer(ops, id, layer, warmer);
        }
      }
      break;
    }

    case "make-cooler": {
      const amount = (intent.params?.amount as number) ?? 15;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        const color = getLayerPrimaryColor(layer);
        if (color) {
          const cooler: RGBA = { ...color, r: Math.max(0, color.r - amount), b: Math.min(255, color.b + amount), a: color.a };
          applyColorToLayer(ops, id, layer, cooler);
        }
      }
      break;
    }

    case "fix-contrast":
    case "ensure-readable": {
      const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2;
      const bg = rootFrame?.fills[0]?.kind === "solid" ? rootFrame.fills[0].color : { r: 255, g: 255, b: 255, a: 1 };

      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer || layer.type !== "text") continue;
        const t = layer as TextLayerV2;
        const textColor = t.defaultStyle.fill.kind === "solid" ? t.defaultStyle.fill.color : null;
        if (textColor && !isWCAG_AA(textColor, bg)) {
          const readable = getReadableColor(bg);
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fill", value: solidPaint(readable) });
        }
      }
      break;
    }

    case "change-font-size": {
      const size = intent.params?.size as number;
      if (!size) break;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (layer?.type === "text") {
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontSize", value: clampToRange(size, "fontSize") });
        }
      }
      break;
    }

    case "change-opacity": {
      const opacity = intent.params?.opacity as number;
      if (opacity === undefined) break;
      for (const id of layerIds) {
        ops.push({ op: "replace", layerId: id, path: "/opacity", value: clampToRange(opacity, "opacity") });
      }
      break;
    }

    case "make-bold": {
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (layer?.type === "text") {
          const t = layer as TextLayerV2;
          const newWeight = Math.min(900, t.defaultStyle.fontWeight + 200);
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontWeight", value: newWeight });
        }
      }
      break;
    }

    case "make-lighter": {
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (layer?.type === "text") {
          const t = layer as TextLayerV2;
          const newWeight = Math.max(100, t.defaultStyle.fontWeight - 200);
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontWeight", value: newWeight });
        }
      }
      break;
    }

    case "add-shadow": {
      for (const id of layerIds) {
        ops.push({
          op: "replace", layerId: id, path: "/effects",
          value: [
            ...(doc.layersById[id]?.effects ?? []),
            {
              type: "drop-shadow",
              enabled: true,
              color: { r: 0, g: 0, b: 0, a: 0.25 },
              offsetX: 2, offsetY: 4, blur: 8, spread: 0,
            },
          ],
        });
      }
      break;
    }

    case "remove-shadow": {
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (layer) {
          ops.push({
            op: "replace", layerId: id, path: "/effects",
            value: layer.effects.filter(e => e.type !== "drop-shadow"),
          });
        }
      }
      break;
    }

    case "add-spacing": {
      const amount = (intent.params?.amount as number) ?? 20;
      for (let i = 1; i < layerIds.length; i++) {
        const layer = doc.layersById[layerIds[i]];
        if (!layer) continue;
        ops.push({
          op: "replace", layerId: layerIds[i], path: "/transform/position",
          value: { x: layer.transform.position.x, y: layer.transform.position.y + amount * i },
        });
      }
      break;
    }

    case "move-to": {
      const x = intent.params?.x as number;
      const y = intent.params?.y as number;
      if (x === undefined && y === undefined) break;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        const newPos = { ...layer.transform.position };
        if (x !== undefined) newPos.x = x;
        if (y !== undefined) newPos.y = y;
        ops.push({ op: "replace", layerId: id, path: "/transform/position", value: newPos });
      }
      break;
    }
  }

  return ops;
}

/**
 * Full intent processing pipeline: resolve → plan → validate → command
 */
export function processIntent(
  doc: DesignDocumentV2,
  intent: EditIntent,
  scope: RevisionScope = "full-redesign",
  lockedPaths: Map<LayerId, string[]> = new Map()
): PatchResult {
  const ops = intentToPatchOps(doc, intent);
  return validateAndApplyPatch(doc, ops, scope, lockedPaths, `AI: ${intent.type}`);
}

// ---------------------------------------------------------------------------
// 6. AI Response Parser (parse LLM output → patch ops)
// ---------------------------------------------------------------------------

export interface AIRevisionResponse {
  /** Strict patch operations */
  patchOps?: PatchOp[];
  /** High-level intents */
  intents?: EditIntent[];
  /** Summary of what was changed */
  summary: string;
}

/**
 * Parse an AI response string into structured patch ops / intents.
 */
export function parseAIRevisionResponse(raw: string): AIRevisionResponse | null {
  try {
    // Extract JSON from potential markdown wrapping
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const jsonStr = jsonMatch[1] ?? jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    return {
      patchOps: Array.isArray(parsed.patchOps) ? parsed.patchOps : undefined,
      intents: Array.isArray(parsed.intents) ? parsed.intents : undefined,
      summary: parsed.summary ?? "AI revision applied",
    };
  } catch {
    return null;
  }
}

/**
 * Build the AI prompt that teaches the model the patch protocol.
 */
export function buildAIPatchPrompt(
  doc: DesignDocumentV2,
  userInstruction: string,
  scope: RevisionScope,
  lockedPaths: Map<LayerId, string[]> = new Map()
): string {
  const allLayers = getLayerOrder(doc).filter(l => l.id !== doc.rootFrameId);
  const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2;

  const layerDescriptions = allLayers.map(l => {
    const pos = l.transform.position;
    const size = l.transform.size;
    let desc = `ID: ${l.id} | Name: "${l.name}" | Type: ${l.type} | Tags: [${l.tags.join(", ")}] | Pos: (${Math.round(pos.x)}, ${Math.round(pos.y)}) | Size: ${Math.round(size.x)}×${Math.round(size.y)} | Opacity: ${l.opacity}`;

    if (l.type === "text") {
      const t = l as TextLayerV2;
      desc += ` | Text: "${t.text}" | FontSize: ${t.defaultStyle.fontSize} | Weight: ${t.defaultStyle.fontWeight} | Color: ${paintToHex(t.defaultStyle.fill)}`;
    } else if (l.type === "shape") {
      const s = l as ShapeLayerV2;
      desc += ` | Shape: ${s.shapeType} | Fill: ${s.fills.map(f => f.kind === "solid" ? rgbaToHex(f.color) : f.kind).join(",")}`;
    } else if (l.type === "icon") {
      const ic = l as IconLayerV2;
      desc += ` | IconID: ${ic.iconId} | Color: ${rgbaToHex(ic.color)}`;
    } else if (l.type === "image") {
      desc += ` | ImageRef: ${(l as ImageLayerV2).imageRef.substring(0, 50)}`;
    }

    // Show locked properties
    const locks = lockedPaths.get(l.id);
    if (locks && locks.length > 0) {
      desc += ` | LOCKED: [${locks.join(", ")}]`;
    }

    return desc;
  });

  const scopeDesc: Record<RevisionScope, string> = {
    "text-only": "ONLY modify text content, fonts, text colors. Do NOT change positions, sizes, or non-text layers.",
    "colors-only": "ONLY modify colors, fills, strokes, gradients. Do NOT change positions, sizes, or text content.",
    "layout-only": "ONLY modify positions, sizes, rotation. Do NOT change colors or text content.",
    "element-specific": "Only modify the specifically targeted layers. Leave everything else unchanged.",
    "full-redesign": "You may modify any property of any layer, add or remove layers.",
  };

  return `You are a PRECISION design revision AI for DMSuite. You operate via a strict patch protocol.

## CURRENT DESIGN
Canvas: ${rootFrame?.transform.size.x}×${rootFrame?.transform.size.y}px
Background: ${rootFrame?.fills[0]?.kind === "solid" ? rgbaToHex(rootFrame.fills[0].color) : "gradient/pattern"}

### Layers (front-to-back):
${layerDescriptions.join("\n")}

## SCOPE: "${scope}"
${scopeDesc[scope]}

## USER REQUEST
"${userInstruction}"

## RESPONSE FORMAT
You have TWO options. Use whichever is most appropriate (or both):

### Option A: Strict Patch Operations (for precise changes)
{
  "patchOps": [
    { "op": "replace", "layerId": "layer-id", "path": "/transform/size", "value": { "x": 200, "y": 100 } },
    { "op": "replace", "layerId": "layer-id", "path": "/defaultStyle/fontSize", "value": 32 },
    { "op": "add-layer", "layerData": { "type": "text", "text": "New text", "tags": ["footer"] }, "parentId": "root-frame-id" },
    { "op": "remove-layer", "layerId": "layer-to-remove" }
  ],
  "summary": "Brief description"
}

### Option B: High-Level Intents (for semantic changes)
{
  "intents": [
    { "type": "make-bigger", "target": { "tags": ["logo"] }, "params": { "factor": 1.5 } },
    { "type": "center", "target": { "nameContains": "heading" }, "params": { "axis": "horizontal" } },
    { "type": "change-color", "target": { "layerType": "text" }, "params": { "color": "#ff0000" } },
    { "type": "fix-contrast", "target": { "special": "all" } }
  ],
  "summary": "Brief description"
}

### Available Intent Types:
make-bigger, make-smaller, center, change-color, make-warmer, make-cooler,
fix-contrast, ensure-readable, change-font-size, change-opacity, make-bold,
make-lighter, add-shadow, remove-shadow, add-spacing, move-to

### Target Selectors:
- { "ids": ["exact-layer-id"] }
- { "tags": ["logo", "headline"] }
- { "nameContains": "contact" }
- { "layerType": "text" }
- { "special": "all" | "selected" | "largest-text" | "primary-image" | "background" }

## RULES
1. Make the SMALLEST change that satisfies the request
2. Respect all LOCKED properties
3. Ensure WCAG AA contrast (≥4.5:1) for all text
4. Stay within the canvas bounds
5. Maintain visual hierarchy and balance
6. Return valid JSON only — no markdown, no explanations outside JSON`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const parts = path.split("/").filter(Boolean);
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  if (parts.length > 0) {
    current[parts[parts.length - 1]] = value;
  }
  return obj;
}

function validateValueRange(path: string, value: unknown): string | null {
  if (typeof value !== "number") return null;

  if (path.includes("opacity")) {
    if (value < 0 || value > 1) return `Opacity ${value} clamped to [0, 1]`;
  }
  if (path.includes("fontSize")) {
    if (value < 4 || value > 800) return `Font size ${value} clamped to [4, 800]`;
  }
  if (path.includes("fontWeight")) {
    if (value < 100 || value > 900) return `Font weight ${value} clamped to [100, 900]`;
  }
  return null;
}

function clampValue(path: string, value: unknown): unknown {
  if (typeof value !== "number") return value;
  if (path.includes("opacity")) return clampToRange(value, "opacity");
  if (path.includes("fontSize")) return clampToRange(value, "fontSize");
  if (path.includes("fontWeight")) return clampToRange(value, "fontWeight");
  if (path.includes("rotation")) return clampToRange(value, "rotation");
  return value;
}

function getLayerPrimaryColor(layer: LayerV2): RGBA | null {
  if (layer.type === "text") {
    const fill = (layer as TextLayerV2).defaultStyle.fill;
    return fill.kind === "solid" ? fill.color : null;
  }
  if (layer.type === "shape") {
    const fill = (layer as ShapeLayerV2).fills[0];
    return fill?.kind === "solid" ? fill.color : null;
  }
  if (layer.type === "icon") {
    return (layer as IconLayerV2).color;
  }
  return null;
}

function applyColorToLayer(ops: PatchOp[], id: LayerId, layer: LayerV2, color: RGBA): void {
  if (layer.type === "text") {
    ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fill", value: solidPaint(color) });
  } else if (layer.type === "shape") {
    ops.push({ op: "replace", layerId: id, path: "/fills/0", value: solidPaint(color) });
  } else if (layer.type === "icon") {
    ops.push({ op: "replace", layerId: id, path: "/color", value: color });
  }
}

function paintToHex(paint: Paint): string {
  if (paint.kind === "solid") return rgbaToHex(paint.color);
  return paint.kind;
}

function createLayerFromAIData(data: Partial<LayerV2> & { type: string }): LayerV2 | null {
  switch (data.type) {
    case "text": {
      const d = data as Partial<TextLayerV2>;
      return createTextLayerV2({
        text: d.text ?? "New Text",
        x: d.transform?.position?.x,
        y: d.transform?.position?.y,
        width: d.transform?.size?.x,
        height: d.transform?.size?.y,
        fontSize: d.defaultStyle?.fontSize,
        fontWeight: d.defaultStyle?.fontWeight,
        color: d.defaultStyle?.fill?.kind === "solid" ? d.defaultStyle.fill.color : undefined,
        align: d.paragraphs?.[0]?.align,
        tags: d.tags,
        name: d.name,
      });
    }
    case "shape": {
      const d = data as Partial<ShapeLayerV2>;
      return createShapeLayerV2({
        shapeType: d.shapeType,
        x: d.transform?.position?.x,
        y: d.transform?.position?.y,
        width: d.transform?.size?.x,
        height: d.transform?.size?.y,
        fill: d.fills?.[0],
        stroke: d.strokes?.[0],
        tags: d.tags,
        name: d.name,
      });
    }
    case "icon": {
      const d = data as Partial<IconLayerV2>;
      if (!d.iconId) return null;
      return createIconLayerV2({
        iconId: d.iconId,
        x: d.transform?.position?.x,
        y: d.transform?.position?.y,
        size: d.transform?.size?.x,
        color: d.color,
        tags: d.tags,
        name: d.name,
      });
    }
    case "image": {
      const d = data as Partial<ImageLayerV2>;
      if (!d.imageRef) return null;
      return createImageLayerV2({
        imageRef: d.imageRef,
        x: d.transform?.position?.x,
        y: d.transform?.position?.y,
        width: d.transform?.size?.x,
        height: d.transform?.size?.y,
        fit: d.fit,
        tags: d.tags,
        name: d.name,
      });
    }
    default:
      return null;
  }
}
