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
import { buildAbstractAsset, getAbstractListForAI } from "./abstract-library";
import { getIconListForAICompact } from "@/lib/icon-library";

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
  op: "replace" | "add" | "remove" | "reorder" | "add-layer" | "remove-layer" | "add-layer-v2";
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
  /** For add-layer-v2: a fully pre-built LayerV2 (used by abstract asset intents) */
  layerV2?: LayerV2;
  /** For add-layer / add-layer-v2: parent ID */
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
    if (op.layerId && op.op !== "add-layer" && op.op !== "add-layer-v2" && !doc.layersById[op.layerId]) {
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

/**
 * Deep-set a value at a JSON pointer path within a layer, returning a minimal
 * Partial<LayerV2> that preserves ALL sibling properties at every nesting level.
 *
 * This is critical: `updateLayer` does a shallow merge, so if we blindly pass
 * `{ defaultStyle: { fill: x } }` it would clobber fontSize, fontWeight, etc.
 * Instead we clone the top-level key and set only the nested value within it.
 *
 * Handles both object keys and array indices (e.g., /fills/0, /effects/1).
 */
function deepSetOnLayer(layer: LayerV2, path: string, value: unknown): Partial<LayerV2> {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return {};

  const topKey = parts[0];
  const layerAny = layer as unknown as Record<string, unknown>;

  // Simple case: top-level replacement
  if (parts.length === 1) {
    return { [topKey]: value } as Partial<LayerV2>;
  }

  // Deep clone the top-level value so we never mutate the live document
  const topValue: unknown = JSON.parse(JSON.stringify(layerAny[topKey] ?? {}));

  // Navigate to the parent of the target node
  let current: unknown = topValue;
  for (let i = 1; i < parts.length - 1; i++) {
    const key = parts[i];
    const idx = Number(key);
    if (Array.isArray(current)) {
      if (!isNaN(idx)) {
        if (current[idx] == null || typeof current[idx] !== "object") {
          (current as unknown[])[idx] = {};
        }
        current = (current as unknown[])[idx];
      }
    } else if (current && typeof current === "object") {
      const obj = current as Record<string, unknown>;
      if (obj[key] == null || typeof obj[key] !== "object") {
        obj[key] = {};
      }
      current = obj[key];
    }
  }

  // Set the final key
  const lastKey = parts[parts.length - 1];
  const lastIdx = Number(lastKey);
  if (Array.isArray(current)) {
    if (!isNaN(lastIdx)) {
      (current as unknown[])[lastIdx] = value;
    }
  } else if (current && typeof current === "object") {
    (current as Record<string, unknown>)[lastKey] = value;
  }

  return { [topKey]: topValue } as Partial<LayerV2>;
}

/**
 * Push a value to an array at a JSON pointer path within a layer.
 * The path should point to the array (e.g., "/effects", "/fills").
 */
function deepPushToLayer(layer: LayerV2, path: string, value: unknown): Partial<LayerV2> {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return {};

  const topKey = parts[0];
  const layerAny = layer as unknown as Record<string, unknown>;
  const topValue: unknown = JSON.parse(JSON.stringify(layerAny[topKey] ?? (parts.length === 1 ? [] : {})));

  if (parts.length === 1) {
    if (Array.isArray(topValue)) {
      (topValue as unknown[]).push(value);
    }
    return { [topKey]: topValue } as Partial<LayerV2>;
  }

  // Navigate to target array and push
  let current: unknown = topValue;
  for (let i = 1; i < parts.length; i++) {
    const key = parts[i];
    const idx = Number(key);
    if (Array.isArray(current)) {
      if (!isNaN(idx)) current = (current as unknown[])[idx];
    } else if (current && typeof current === "object") {
      const obj = current as Record<string, unknown>;
      if (i === parts.length - 1) {
        if (Array.isArray(obj[key])) {
          (obj[key] as unknown[]).push(value);
        } else {
          obj[key] = [value];
        }
        break;
      }
      if (obj[key] == null || typeof obj[key] !== "object") obj[key] = {};
      current = obj[key];
    }
  }

  return { [topKey]: topValue } as Partial<LayerV2>;
}

/**
 * Remove a value at a JSON pointer path within a layer.
 * For array elements (e.g., /effects/0), splices out that index.
 * For object keys, deletes the property.
 */
function deepRemoveFromLayer(layer: LayerV2, path: string): Partial<LayerV2> {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return {};

  const topKey = parts[0];
  const layerAny = layer as unknown as Record<string, unknown>;

  if (parts.length === 1) {
    return { [topKey]: undefined } as Partial<LayerV2>;
  }

  const topValue: unknown = JSON.parse(JSON.stringify(layerAny[topKey] ?? {}));

  let current: unknown = topValue;
  for (let i = 1; i < parts.length - 1; i++) {
    const key = parts[i];
    const idx = Number(key);
    if (Array.isArray(current)) {
      if (!isNaN(idx)) current = (current as unknown[])[idx];
    } else if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[key];
    }
    if (current == null) return { [topKey]: topValue } as Partial<LayerV2>;
  }

  const lastKey = parts[parts.length - 1];
  const lastIdx = Number(lastKey);
  if (Array.isArray(current)) {
    if (!isNaN(lastIdx)) (current as unknown[]).splice(lastIdx, 1);
  } else if (current && typeof current === "object") {
    delete (current as Record<string, unknown>)[lastKey];
  }

  return { [topKey]: topValue } as Partial<LayerV2>;
}

function opToCommand(doc: DesignDocumentV2, op: PatchOp): Command | null {
  switch (op.op) {
    case "replace": {
      if (!op.layerId || !op.path) return null;
      const layer = doc.layersById[op.layerId];
      if (!layer) return null;
      // Use deep-set so sibling properties are never clobbered
      const changes = deepSetOnLayer(layer, op.path, op.value);
      return createUpdateCommand(op.layerId, changes as Partial<LayerV2>, `Set ${op.path}`);
    }

    case "add": {
      if (!op.layerId || !op.path) return null;
      const layer = doc.layersById[op.layerId];
      if (!layer) return null;
      // Push to the target array, preserving existing items
      const changes = deepPushToLayer(layer, op.path, op.value);
      return createUpdateCommand(op.layerId, changes as Partial<LayerV2>, `Add to ${op.path}`);
    }

    case "remove": {
      if (!op.layerId) return null;
      if (op.path) {
        const layer = doc.layersById[op.layerId];
        if (!layer) return null;
        const changes = deepRemoveFromLayer(layer, op.path);
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

    case "add-layer-v2": {
      if (!op.layerV2) return null;
      return createAddLayerCommand(op.layerV2, op.parentId, `Add ${op.layerV2.type} layer`);
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
  | "ensure-readable" | "fix-contrast"
  // ---- Pro intent types (M3.5) ----
  | "add-effect" | "remove-effect" | "update-effect"
  | "set-fill" | "add-gradient-fill" | "add-pattern-fill"
  | "set-stroke" | "remove-stroke"
  | "set-blend-mode"
  | "set-corner-radius"
  | "flip" | "rotate"
  | "set-font" | "set-text-style"
  | "set-image-filters"
  | "reorder-layer"
  // ---- Abstract asset intent types (M3.10) ----
  | "add-abstract-asset" | "remove-abstract-asset"
  | "swap-abstract-asset" | "configure-abstract-asset"
  // ---- Card-specific design intents (M3.11) ----
  | "make-luxurious" | "make-minimalist" | "make-corporate" | "make-creative"
  | "apply-typographic-scale" | "balance-visual-weight"
  | "improve-name-hierarchy" | "add-visual-accent"
  | "refine-contact-layout" | "modernize-design"
  | "add-brand-consistency" | "improve-whitespace"
  | "swap-icon";

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

    // ================================================================
    // Pro intent implementations (M3.5 — Full AI Control)
    // ================================================================

    case "add-effect": {
      const effectType = (intent.params?.effectType as string) ?? "drop-shadow";
      const defaults: Record<string, unknown> = {
        "drop-shadow": { type: "drop-shadow", enabled: true, color: { r: 0, g: 0, b: 0, a: 0.25 }, offsetX: 2, offsetY: 4, blur: 8, spread: 0 },
        "inner-shadow": { type: "inner-shadow", enabled: true, color: { r: 0, g: 0, b: 0, a: 0.2 }, offsetX: 1, offsetY: 2, blur: 4, spread: 0 },
        "blur": { type: "blur", enabled: true, blurType: "gaussian", radius: 4, angle: 0 },
        "glow": { type: "glow", enabled: true, color: { r: 163, g: 230, b: 53, a: 0.6 }, inner: false, radius: 8, intensity: 0.5 },
        "outline": { type: "outline", enabled: true, color: { r: 255, g: 255, b: 255, a: 1 }, width: 2 },
        "color-adjust": { type: "color-adjust", enabled: true, brightness: 0, contrast: 0, saturation: 0, temperature: 0, hueRotate: 0 },
        "noise": { type: "noise", enabled: true, intensity: 0.3, monochrome: true },
      };
      const overrides = (intent.params?.overrides ?? {}) as Record<string, unknown>;
      const effect = { ...(defaults[effectType] ?? defaults["drop-shadow"]) as Record<string, unknown>, ...overrides };
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        ops.push({ op: "replace", layerId: id, path: "/effects", value: [...layer.effects, effect] });
      }
      break;
    }

    case "remove-effect": {
      const effectType = intent.params?.effectType as string;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        const filtered = effectType
          ? layer.effects.filter(e => e.type !== effectType)
          : []; // Remove all if no type specified
        ops.push({ op: "replace", layerId: id, path: "/effects", value: filtered });
      }
      break;
    }

    case "update-effect": {
      const effectType = intent.params?.effectType as string;
      const updates = intent.params?.updates as Record<string, unknown>;
      if (!effectType || !updates) break;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        const newEffects = layer.effects.map(e =>
          e.type === effectType ? { ...e, ...updates } : e
        );
        ops.push({ op: "replace", layerId: id, path: "/effects", value: newEffects });
      }
      break;
    }

    case "set-fill": {
      const color = intent.params?.color as string;
      const opacity = (intent.params?.opacity as number) ?? 1;
      if (!color) break;
      const rgba = { ...hexToRGBA(color), a: opacity };
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        if (layer.type === "shape" || layer.type === "frame" || layer.type === "path") {
          ops.push({ op: "replace", layerId: id, path: "/fills", value: [solidPaint(rgba)] });
        } else if (layer.type === "text") {
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fill", value: solidPaint(rgba) });
        } else if (layer.type === "icon") {
          ops.push({ op: "replace", layerId: id, path: "/color", value: rgba });
        }
      }
      break;
    }

    case "add-gradient-fill": {
      const gradType = (intent.params?.gradientType as string) ?? "linear";
      const angle = (intent.params?.angle as number) ?? 180;
      const stops = (intent.params?.stops as Array<{ offset: number; color: string }>) ??
        [{ offset: 0, color: "#a3e635" }, { offset: 1, color: "#06b6d4" }];
      const gradient = {
        kind: "gradient" as const,
        type: gradType,
        angle,
        stops: stops.map(s => ({ offset: s.offset, color: hexToRGBA(s.color) })),
      };
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        if (layer.type === "shape" || layer.type === "frame" || layer.type === "path") {
          ops.push({ op: "replace", layerId: id, path: "/fills", value: [gradient] });
        } else if (layer.type === "text") {
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fill", value: gradient });
        }
      }
      break;
    }

    case "add-pattern-fill": {
      const patternType = (intent.params?.patternType as string) ?? "dots";
      const patternOpacity = (intent.params?.opacity as number) ?? 0.3;
      const patternScale = (intent.params?.scale as number) ?? 1;
      const pattern = {
        kind: "pattern" as const,
        patternType,
        opacity: patternOpacity,
        scale: patternScale,
        spacing: (intent.params?.spacing as number) ?? 10,
        color: hexToRGBA((intent.params?.color as string) ?? "#ffffff"),
      };
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        if (layer.type === "shape" || layer.type === "frame") {
          const current = (layer as ShapeLayerV2).fills ?? [];
          ops.push({ op: "replace", layerId: id, path: "/fills", value: [...current, pattern] });
        }
      }
      break;
    }

    case "set-stroke": {
      const color = intent.params?.color as string;
      const width = (intent.params?.width as number) ?? 2;
      const align = (intent.params?.align as string) ?? "center";
      if (!color) break;
      const stroke = {
        paint: solidPaint(hexToRGBA(color)),
        width,
        align,
        cap: "round" as const,
        join: "round" as const,
        dashArray: [] as number[],
      };
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        if (layer.type === "shape" || layer.type === "frame" || layer.type === "path") {
          ops.push({ op: "replace", layerId: id, path: "/strokes", value: [stroke] });
        }
      }
      break;
    }

    case "remove-stroke": {
      for (const id of layerIds) {
        ops.push({ op: "replace", layerId: id, path: "/strokes", value: [] });
      }
      break;
    }

    case "set-blend-mode": {
      const blendMode = (intent.params?.blendMode as string) ?? "normal";
      for (const id of layerIds) {
        ops.push({ op: "replace", layerId: id, path: "/blendMode", value: blendMode });
      }
      break;
    }

    case "set-corner-radius": {
      const radius = (intent.params?.radius as number) ?? 8;
      const individual = intent.params?.individual as [number, number, number, number] | undefined;
      const radii = individual ?? [radius, radius, radius, radius];
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        if (layer.type === "shape" || layer.type === "frame") {
          ops.push({ op: "replace", layerId: id, path: "/cornerRadii", value: radii });
        }
      }
      break;
    }

    case "flip": {
      const axis = (intent.params?.axis as "horizontal" | "vertical") ?? "horizontal";
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        // Flip by adjusting skew (180° on relevant axis simulates flip)
        if (axis === "horizontal") {
          ops.push({ op: "replace", layerId: id, path: "/transform/skewY", value: layer.transform.skewY === 0 ? 180 : 0 });
        } else {
          ops.push({ op: "replace", layerId: id, path: "/transform/skewX", value: layer.transform.skewX === 0 ? 180 : 0 });
        }
      }
      break;
    }

    case "rotate": {
      const angle = (intent.params?.angle as number) ?? 90;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        ops.push({ op: "replace", layerId: id, path: "/transform/rotation", value: layer.transform.rotation + angle });
      }
      break;
    }

    case "set-font": {
      const fontFamily = intent.params?.fontFamily as string;
      const fontSize = intent.params?.fontSize as number | undefined;
      const fontWeight = intent.params?.fontWeight as number | undefined;
      if (!fontFamily && !fontSize && !fontWeight) break;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (layer?.type !== "text") continue;
        const t = layer as TextLayerV2;
        const newStyle = { ...t.defaultStyle };
        if (fontFamily) newStyle.fontFamily = fontFamily;
        if (fontSize) newStyle.fontSize = clampToRange(fontSize, "fontSize");
        if (fontWeight) newStyle.fontWeight = clampToRange(fontWeight, "fontWeight");
        ops.push({ op: "replace", layerId: id, path: "/defaultStyle", value: newStyle });
      }
      break;
    }

    case "set-text-style": {
      const italic = intent.params?.italic as boolean | undefined;
      const underline = intent.params?.underline as boolean | undefined;
      const uppercase = intent.params?.uppercase as boolean | undefined;
      const letterSpacing = intent.params?.letterSpacing as number | undefined;
      const lineHeight = intent.params?.lineHeight as number | undefined;
      const textAlign = intent.params?.align as string | undefined;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (layer?.type !== "text") continue;
        const t = layer as TextLayerV2;
        const newStyle = { ...t.defaultStyle };
        if (italic !== undefined) newStyle.italic = italic;
        if (underline !== undefined) newStyle.underline = underline;
        if (uppercase !== undefined) newStyle.uppercase = uppercase;
        if (letterSpacing !== undefined) newStyle.letterSpacing = letterSpacing;
        if (lineHeight !== undefined) newStyle.lineHeight = lineHeight;
        ops.push({ op: "replace", layerId: id, path: "/defaultStyle", value: newStyle });
        if (textAlign) {
          ops.push({ op: "replace", layerId: id, path: "/paragraphs/0/align", value: textAlign });
        }
      }
      break;
    }

    case "set-image-filters": {
      const filters = intent.params as Record<string, unknown>;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (layer?.type !== "image") continue;
        const img = layer as ImageLayerV2;
        ops.push({ op: "replace", layerId: id, path: "/imageFilters", value: { ...img.imageFilters, ...filters } });
      }
      break;
    }

    case "reorder-layer": {
      const direction = (intent.params?.direction as "up" | "down" | "top" | "bottom") ?? "up";
      for (const id of layerIds) {
        ops.push({ op: "reorder", layerId: id, direction });
      }
      break;
    }

    // ================================================================
    // Abstract asset intent implementations (M3.10)
    // ================================================================

    case "add-abstract-asset": {
      const addAssetId = intent.params?.assetId as string;
      if (!addAssetId) break;
      const addFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2;
      if (!addFrame) break;
      const addW = addFrame.transform.size.x;
      const addH = addFrame.transform.size.y;
      const addBg = addFrame.fills?.[0]?.kind === "solid" ? rgbaToHex(addFrame.fills[0].color) : "#ffffff";
      // Infer primary color from existing accent/abstract layers in the doc
      const docLayers = getLayerOrder(doc);
      const hintLayer = docLayers.find(l => l.tags.includes("accent") || l.tags.includes("abstract-asset"));
      const hintFill = hintLayer?.type === "shape" ? (hintLayer as ShapeLayerV2).fills?.[0] : undefined;
      const hintPrimary = hintFill?.kind === "solid" ? rgbaToHex(hintFill.color) : null;
      const addLayers = buildAbstractAsset(addAssetId, {
        W: addW, H: addH,
        primary: (intent.params?.primaryColor as string) ?? hintPrimary ?? "#a3e635",
        secondary: (intent.params?.secondaryColor as string) ?? "#06b6d4",
        text: (intent.params?.textColor as string) ?? "#ffffff",
        bg: addBg,
        opacity: (intent.params?.opacity as number) ?? 1,
        scale: (intent.params?.scale as number) ?? 1,
        rotation: (intent.params?.rotation as number) ?? 0,
        xOffset: (intent.params?.xOffset as number) ?? 0,
        yOffset: (intent.params?.yOffset as number) ?? 0,
        blendMode: intent.params?.blendMode as string | undefined,
        colorOverride: intent.params?.colorOverride as string | undefined,
      });
      for (const layer of addLayers) {
        ops.push({ op: "add-layer-v2", layerV2: layer });
      }
      break;
    }

    case "remove-abstract-asset": {
      // Safety guard: only remove layers actually tagged as abstract assets
      for (const id of layerIds) {
        if (doc.layersById[id]?.tags.includes("abstract-asset")) {
          ops.push({ op: "remove-layer", layerId: id });
        }
      }
      break;
    }

    case "swap-abstract-asset": {
      const swapAssetId = intent.params?.assetId as string;
      if (!swapAssetId || layerIds.length === 0) break;
      const swapFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2;
      if (!swapFrame) break;
      const swapW = swapFrame.transform.size.x;
      const swapH = swapFrame.transform.size.y;
      const swapBg = swapFrame.fills?.[0]?.kind === "solid" ? rgbaToHex(swapFrame.fills[0].color) : "#ffffff";
      // Read existing fill color from first matched layer to preserve palette
      const swapExisting = doc.layersById[layerIds[0]];
      const swapFill = swapExisting?.type === "shape" ? (swapExisting as ShapeLayerV2).fills?.[0] : undefined;
      const swapPrimary = swapFill?.kind === "solid" ? rgbaToHex(swapFill.color) : "#a3e635";
      // Remove all old abstract layers from the target set
      for (const id of layerIds) {
        if (doc.layersById[id]?.tags.includes("abstract-asset")) {
          ops.push({ op: "remove-layer", layerId: id });
        }
      }
      // Build and add the replacement asset
      const swapLayers = buildAbstractAsset(swapAssetId, {
        W: swapW, H: swapH,
        primary: (intent.params?.primaryColor as string) ?? swapPrimary,
        secondary: (intent.params?.secondaryColor as string) ?? "#06b6d4",
        text: (intent.params?.textColor as string) ?? "#ffffff",
        bg: swapBg,
        opacity: (intent.params?.opacity as number) ?? 1,
        scale: (intent.params?.scale as number) ?? 1,
        rotation: (intent.params?.rotation as number) ?? 0,
      });
      for (const layer of swapLayers) {
        ops.push({ op: "add-layer-v2", layerV2: layer });
      }
      break;
    }

    case "configure-abstract-asset": {
      const cfgOpacity = intent.params?.opacity as number | undefined;
      const cfgBlend = intent.params?.blendMode as string | undefined;
      const cfgScale = intent.params?.scale as number | undefined;
      const cfgRotation = intent.params?.rotation as number | undefined;
      const cfgColor = intent.params?.color as string | undefined;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer?.tags.includes("abstract-asset")) continue;
        if (cfgOpacity !== undefined) {
          ops.push({ op: "replace", layerId: id, path: "/opacity", value: clampToRange(cfgOpacity, "opacity") });
        }
        if (cfgBlend) {
          ops.push({ op: "replace", layerId: id, path: "/blendMode", value: cfgBlend });
        }
        if (cfgRotation !== undefined) {
          ops.push({ op: "replace", layerId: id, path: "/transform/rotation", value: cfgRotation });
        }
        if (cfgScale !== undefined && cfgScale !== 1) {
          ops.push({ op: "replace", layerId: id, path: "/transform/size", value: { x: Math.round(layer.transform.size.x * cfgScale), y: Math.round(layer.transform.size.y * cfgScale) } });
        }
        if (cfgColor) {
          const cfgRgba = hexToRGBA(cfgColor);
          if (layer.type === "shape" || layer.type === "path") {
            ops.push({ op: "replace", layerId: id, path: "/fills", value: [{ kind: "solid", color: cfgRgba, opacity: 1 }] });
          }
        }
      }
      break;
    }

    // ================================================================
    // Card-specific design intents (M3.11)
    // ================================================================

    case "make-luxurious": {
      // Boost name weight, add subtle shadow, enrich accent colors
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        if (layer.type === "text" && layer.tags.includes("name")) {
          const t = layer as TextLayerV2;
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontWeight", value: Math.min(900, t.defaultStyle.fontWeight + 100) });
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/letterSpacing", value: 1.5 });
          ops.push({
            op: "replace", layerId: id, path: "/effects",
            value: [...layer.effects, {
              type: "drop-shadow", enabled: true,
              color: { r: 0, g: 0, b: 0, a: 0.12 },
              offsetX: 0, offsetY: 2, blur: 6, spread: 0,
            }],
          });
        }
        if (layer.type === "text" && layer.tags.includes("title")) {
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/uppercase", value: true });
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/letterSpacing", value: 2.0 });
        }
      }
      break;
    }

    case "make-minimalist": {
      // Strip shadows/effects, reduce font weights, increase spacing
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        if (layer.effects.length > 0) {
          ops.push({ op: "replace", layerId: id, path: "/effects", value: [] });
        }
        if (layer.type === "text") {
          const t = layer as TextLayerV2;
          if (t.defaultStyle.fontWeight > 500) {
            ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontWeight", value: 400 });
          }
        }
        // Reduce opacity of decorative elements
        if (layer.tags.includes("decorative") && layer.opacity > 0.3) {
          ops.push({ op: "replace", layerId: id, path: "/opacity", value: layer.opacity * 0.5 });
        }
      }
      break;
    }

    case "make-corporate": {
      // Standardize fonts, ensure clean alignment, conservative colors
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        if (layer.type === "text") {
          const t = layer as TextLayerV2;
          if (layer.tags.includes("name")) {
            ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontWeight", value: 600 });
          }
          if (layer.tags.includes("title") || layer.tags.includes("company")) {
            ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontWeight", value: 400 });
            ops.push({ op: "replace", layerId: id, path: "/defaultStyle/uppercase", value: true });
            ops.push({ op: "replace", layerId: id, path: "/defaultStyle/letterSpacing", value: 1.0 });
          }
        }
      }
      break;
    }

    case "make-creative": {
      // Bold weights, add glow effects, increase contrast
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        if (layer.type === "text" && layer.tags.includes("name")) {
          const t = layer as TextLayerV2;
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontWeight", value: 800 });
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontSize", value: Math.round(t.defaultStyle.fontSize * 1.1) });
        }
        // Add glow to accent elements
        if (layer.tags.includes("accent") || layer.tags.includes("decorative")) {
          const color = getLayerPrimaryColor(layer);
          if (color) {
            ops.push({
              op: "replace", layerId: id, path: "/effects",
              value: [...layer.effects, {
                type: "glow", enabled: true,
                color: { ...color, a: 0.4 }, inner: false, radius: 6, intensity: 0.3,
              }],
            });
          }
        }
      }
      break;
    }

    case "apply-typographic-scale": {
      // Apply a professional typographic scale (1.25 ratio)
      const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2;
      if (!rootFrame) break;
      const baseSize = 21; // ~7pt contact text
      const scale = (intent.params?.ratio as number) ?? 1.25;
      const typeSizes = {
        contact: baseSize,
        tagline: Math.round(baseSize * scale),
        title: Math.round(baseSize * scale * scale),
        company: Math.round(baseSize * scale * scale),
        name: Math.round(baseSize * scale * scale * scale),
      };
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (layer?.type !== "text") continue;
        let newSize: number | undefined;
        if (layer.tags.includes("name")) newSize = typeSizes.name;
        else if (layer.tags.includes("title")) newSize = typeSizes.title;
        else if (layer.tags.includes("company")) newSize = typeSizes.company;
        else if (layer.tags.includes("tagline")) newSize = typeSizes.tagline;
        else if (layer.tags.some(t => t.startsWith("contact-"))) newSize = typeSizes.contact;
        if (newSize) {
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontSize", value: newSize });
        }
      }
      break;
    }

    case "balance-visual-weight": {
      // Even out spacing between text groups
      const textLayers = layerIds.map(id => doc.layersById[id]).filter(l => l?.type === "text") as TextLayerV2[];
      if (textLayers.length < 2) break;
      textLayers.sort((a, b) => a.transform.position.y - b.transform.position.y);
      const totalSpan = textLayers[textLayers.length - 1].transform.position.y - textLayers[0].transform.position.y;
      const evenGap = totalSpan / (textLayers.length - 1);
      for (let i = 1; i < textLayers.length; i++) {
        const newY = textLayers[0].transform.position.y + evenGap * i;
        ops.push({
          op: "replace", layerId: textLayers[i].id, path: "/transform/position",
          value: { x: textLayers[i].transform.position.x, y: Math.round(newY) },
        });
      }
      break;
    }

    case "improve-name-hierarchy": {
      // Make name visually dominant: larger, bolder, more contrast
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer || layer.type !== "text") continue;
        const t = layer as TextLayerV2;
        if (layer.tags.includes("name")) {
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontSize", value: Math.round(t.defaultStyle.fontSize * 1.15) });
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontWeight", value: Math.min(800, t.defaultStyle.fontWeight + 200) });
        }
        // Reduce non-name text slightly
        if (layer.tags.includes("title") || layer.tags.includes("company")) {
          ops.push({ op: "replace", layerId: id, path: "/defaultStyle/fontSize", value: Math.round(t.defaultStyle.fontSize * 0.95) });
        }
      }
      break;
    }

    case "add-visual-accent": {
      // Add a subtle accent line or glow to decorative elements
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        if (layer.tags.includes("accent") || layer.tags.includes("decorative")) {
          ops.push({ op: "replace", layerId: id, path: "/opacity", value: Math.min(1, layer.opacity + 0.15) });
        }
      }
      break;
    }

    case "refine-contact-layout": {
      // Improve contact block spacing and alignment
      const contactLayers = layerIds.map(id => doc.layersById[id]).filter(l => l?.tags.some(t => t.startsWith("contact-")));
      if (contactLayers.length < 2) break;
      contactLayers.sort((a, b) => a!.transform.position.y - b!.transform.position.y);
      const firstY = contactLayers[0]!.transform.position.y;
      const gap = (intent.params?.gap as number) ?? 32;
      for (let i = 0; i < contactLayers.length; i++) {
        const layer = contactLayers[i]!;
        ops.push({
          op: "replace", layerId: layer.id, path: "/transform/position",
          value: { x: layer.transform.position.x, y: Math.round(firstY + i * gap) },
        });
      }
      break;
    }

    case "modernize-design": {
      // Reduce border radii, clean up effects, use contemporary spacing
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer) continue;
        if (layer.type === "shape" && (layer as ShapeLayerV2).cornerRadii) {
          ops.push({ op: "replace", layerId: id, path: "/cornerRadii", value: [4, 4, 4, 4] });
        }
        // Remove heavy shadows, keep light ones
        if (layer.effects.some(e => e.type === "drop-shadow")) {
          const modernEffects = layer.effects.map(e =>
            e.type === "drop-shadow" ? { ...e, blur: 4, offsetY: 2, color: { ...(e as { color: RGBA }).color, a: 0.08 } } : e
          );
          ops.push({ op: "replace", layerId: id, path: "/effects", value: modernEffects });
        }
      }
      break;
    }

    case "add-brand-consistency": {
      // Find the primary color from accent elements and apply to all accents
      const accentLayers = layerIds.map(id => doc.layersById[id]).filter(l => l?.tags.includes("accent"));
      if (accentLayers.length === 0) break;
      const firstColor = getLayerPrimaryColor(accentLayers[0]!);
      if (!firstColor) break;
      for (const layer of accentLayers) {
        if (!layer) continue;
        applyColorToLayer(ops, layer.id, layer, firstColor);
      }
      break;
    }

    case "improve-whitespace": {
      // Increase padding/margins for all content layers
      const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2;
      if (!rootFrame) break;
      const padding = (intent.params?.padding as number) ?? 15;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer || layer.id === doc.rootFrameId) continue;
        if (layer.tags.includes("decorative") || layer.tags.includes("background-gradient")) continue;
        const pos = layer.transform.position;
        const size = layer.transform.size;
        const canvasW = rootFrame.transform.size.x;
        const canvasH = rootFrame.transform.size.y;
        // Push inward if too close to edges
        const newX = Math.max(padding, Math.min(pos.x, canvasW - size.x - padding));
        const newY = Math.max(padding, Math.min(pos.y, canvasH - size.y - padding));
        if (newX !== pos.x || newY !== pos.y) {
          ops.push({ op: "replace", layerId: id, path: "/transform/position", value: { x: newX, y: newY } });
        }
      }
      break;
    }

    case "swap-icon": {
      // Replace the iconId on target icon layers (e.g. change phone icon style, swap contact icons)
      const newIconId = intent.params?.iconId as string;
      if (!newIconId) break;
      for (const id of layerIds) {
        const layer = doc.layersById[id];
        if (!layer || layer.type !== "icon") continue;
        ops.push({ op: "replace", layerId: id, path: "/iconId", value: newIconId });
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
  const abstractCatalog = getAbstractListForAI();
  const iconCatalog = getIconListForAICompact();

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
    "colors-only": "ONLY modify colors, fills, strokes, gradients. Do NOT change positions, sizes, or text content. Use tag-based targeting from the SEMANTIC ELEMENT MAP below to target the SPECIFIC element the user names.",
    "layout-only": "ONLY modify positions, sizes, rotation. Do NOT change colors or text content.",
    "element-specific": "Only modify the SPECIFIC element(s) the user names. Use tag-based targeting from the SEMANTIC ELEMENT MAP below. Leave ALL other layers unchanged.",
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

## ABSTRACT ASSET CATALOG (use these IDs for add-abstract-asset / swap-abstract-asset intents)
${abstractCatalog}

## ICON LIBRARY (use these IDs for swap-icon intent and /iconId path replacements)
${iconCatalog}

## SEMANTIC ELEMENT → TAG MAP (BUSINESS CARD)
Use these tags to target SPECIFIC elements — NEVER use layerType to hit all-text when the user names a specific element:
| User says…                              | Target selector to use              |
|-----------------------------------------|-------------------------------------|
| "name", "full name", "person's name"    | { "tags": ["name"] }                |
| "title", "job title", "position"        | { "tags": ["title"] }               |
| "company", "company name", "business"   | { "tags": ["company"] }             |
| "tagline", "subtitle", "slogan"         | { "tags": ["tagline"] }             |
| "contact", "email", "phone", "website"  | { "tags": ["contact-text"] }        |
| "contact icons"                         | { "tags": ["contact-icon"] }        |
| "linkedin", "my linkedin"               | { "tags": ["contact-linkedin"] }    |
| "twitter", "twitter/x", "my twitter"   | { "tags": ["contact-twitter"] }     |
| "instagram", "my instagram"             | { "tags": ["contact-instagram"] }   |
| "phone icon", "email icon" (specific)   | { "tags": ["icon-phone"] } / ["icon-email"] etc. |
| "accent", "line", "bar", "decorative"   | { "tags": ["accent"] }              |
| "logo", "brand mark"                    | { "tags": ["logo"] }                |
| "QR code", "qr"                         | { "tags": ["qr-code"] }             |
| "pattern", "overlay", "texture"         | { "tags": ["pattern"] }             |
| "border", "frame border"                | { "tags": ["border"] }              |
| "corner", "corner marks"                | { "tags": ["corner"] }              |
| "abstract", "abstract element"          | { "tags": ["abstract-asset"] }      |
| "abstract shard", "diagonal shard"      | { "tags": ["abstract-modern-shard"] }|
| "decorative element", "decoration"      | { "tags": ["decorative"] }          |
| "background", "card background"         | { "special": "background" }         |
| "ALL text", "every text element"        | { "layerType": "text" }  ← ONLY for GLOBAL changes |

## CRITICAL TARGETING RULE
⚠️ When the user mentions a SPECIFIC element by name (name, title, company, contact, accent, background),
you MUST use the tag-based target from the map above.
NEVER use { "layerType": "text" } or { "special": "all" } for a named-element request —
that would change EVERY layer, not just the requested one.

## RESPONSE FORMAT
You have TWO options. Use whichever is most appropriate (or both):

### Option A: Strict Patch Operations (for precise changes)
Use the layer ID from the layer list above. The path is a JSON pointer into the layer object.
{
  "patchOps": [
    { "op": "replace", "layerId": "EXACT-LAYER-ID-FROM-LIST", "path": "/defaultStyle/fill", "value": { "kind": "solid", "color": { "r": 255, "g": 0, "b": 0, "a": 1 }, "opacity": 1 } },
    { "op": "replace", "layerId": "EXACT-LAYER-ID-FROM-LIST", "path": "/defaultStyle/fontSize", "value": 32 }
  ],
  "summary": "Brief description"
}

### Editable Paths by Layer Type

**TEXT layer** — the richest layer type:
| Property          | Path                              | Value format                              |
|-------------------|-----------------------------------|-------------------------------------------|
| Fill color        | /defaultStyle/fill                | { "kind": "solid", "color": {r,g,b,a}, "opacity": 1 } |
| Gradient fill     | /defaultStyle/fill                | { "kind": "gradient", "type": "linear", "angle": 135, "stops": [{offset:0,color:{r,g,b,a}},{offset:1,color:{r,g,b,a}}] } |
| Font size         | /defaultStyle/fontSize            | number (px, 4–800)                        |
| Font weight       | /defaultStyle/fontWeight          | 100/200/300/400/500/600/700/800/900       |
| Font family       | /defaultStyle/fontFamily          | string, e.g. "Inter", "Playfair Display"  |
| Italic            | /defaultStyle/italic              | true / false                              |
| Underline         | /defaultStyle/underline           | true / false                              |
| Strikethrough     | /defaultStyle/strikethrough       | true / false                              |
| Uppercase         | /defaultStyle/uppercase           | true / false                              |
| Letter spacing    | /defaultStyle/letterSpacing       | number (px, e.g. 2.5)                     |
| Line height       | /defaultStyle/lineHeight          | number (multiplier, e.g. 1.4)             |
| Text alignment    | /paragraphs/0/align               | "left" / "center" / "right" / "justify"   |
| Text content      | /text                             | string                                    |
| Opacity           | /opacity                          | number 0–1                                |
| Blend mode        | /blendMode                        | "normal"/"multiply"/"screen"/"overlay"/…  |
| Effects           | /effects                          | array of effect objects (see below)       |

**SHAPE layer:**
| Property          | Path                              | Value format                              |
|-------------------|-----------------------------------|-------------------------------------------|
| Fill (solid)      | /fills                            | [{ "kind": "solid", "color": {r,g,b,a}, "opacity": 1 }] |
| Fill (gradient)   | /fills                            | [{ "kind": "gradient", "type": "linear", "angle": 135, "stops": [...] }] |
| Fill (pattern)    | /fills                            | [{ "kind": "pattern", "patternType": "dots", "opacity": 0.3, "scale": 1 }] |
| Stroke            | /strokes                          | [{ "paint": {kind:"solid",color:{r,g,b,a},"opacity":1}, "width": 2, "align": "center" }] |
| Corner radii      | /cornerRadii                      | [topLeft, topRight, bottomRight, bottomLeft] (numbers) |
| Shape type        | /shapeType                        | "rectangle"/"ellipse"/"triangle"/"polygon"/"star"/"line" |
| Polygon sides     | /sides                            | number 3–24                               |
| Star inner ratio  | /innerRadiusRatio                 | number 0.1–0.9                            |
| Opacity           | /opacity                          | number 0–1                                |
| Blend mode        | /blendMode                        | string                                    |
| Effects           | /effects                          | array of effect objects                   |

**FRAME layer (card background):**
| Property          | Path                              | Value format                              |
|-------------------|-----------------------------------|-------------------------------------------|
| Background fill   | /fills                            | same as shape fills                       |
| Border stroke     | /strokes                          | same as shape strokes                     |
| Corner radii      | /cornerRadii                      | [tl, tr, br, bl]                          |

**IMAGE layer:**
| Property          | Path                              | Value format                              |
|-------------------|-----------------------------------|-------------------------------------------|
| Brightness        | /imageFilters/brightness          | number -100 to 100                        |
| Contrast          | /imageFilters/contrast            | number -100 to 100                        |
| Saturation        | /imageFilters/saturation          | number -100 to 100                        |
| Temperature       | /imageFilters/temperature         | number -100 to 100                        |
| Blur              | /imageFilters/blur                | number 0–20                               |
| Grayscale         | /imageFilters/grayscale           | true / false                              |
| Sepia             | /imageFilters/sepia               | true / false                              |
| Fit mode          | /fit                              | "cover"/"contain"/"stretch"/"fill"        |
| Corner radius     | /cornerRadius                     | number                                    |
| Overlay fill      | /fills                            | array of paint objects                    |
| Opacity           | /opacity                          | number 0–1                                |
| Blend mode        | /blendMode                        | string                                    |

**ICON layer:**
| Property          | Path                              | Value format                              |
|-------------------|-----------------------------------|-------------------------------------------|
| Icon type (swap)  | /iconId                           | string — valid ID from ICON LIBRARY above |
| Color             | /color                            | { "r": 0, "g": 0, "b": 0, "a": 1 }       |
| Stroke width      | /strokeWidth                      | number 0.5–10                             |
| Opacity           | /opacity                          | number 0–1                                |

**ALL layers (base properties):**
| Property          | Path                              | Value format                              |
|-------------------|-----------------------------------|-------------------------------------------|
| Opacity           | /opacity                          | number 0–1                                |
| Blend mode        | /blendMode                        | "normal"/"multiply"/"screen"/"overlay"/"darken"/"lighten"/"color-dodge"/"color-burn"/"hard-light"/"soft-light"/"difference"/"exclusion"/"hue"/"saturation"/"color"/"luminosity" |
| Effects           | /effects                          | see effect schema below                   |
| Position X        | /transform/position/x             | number (px)                               |
| Position Y        | /transform/position/y             | number (px)                               |
| Width             | /transform/size/x                 | number (px)                               |
| Height            | /transform/size/y                 | number (px)                               |
| Rotation          | /transform/rotation               | number (degrees)                          |

**Effect Object Schema** (for /effects array — use with "add-effect" intent or patchOps "/effects" replace):
  drop-shadow: { "type": "drop-shadow", "color": {"r":0,"g":0,"b":0,"a":0.4}, "offsetX": 4, "offsetY": 4, "blur": 8, "spread": 0, "enabled": true }
  inner-shadow: { "type": "inner-shadow", "color": {"r":0,"g":0,"b":0,"a":0.3}, "offsetX": 0, "offsetY": 2, "blur": 6, "spread": 0, "enabled": true }
  blur:         { "type": "blur", "radius": 4, "enabled": true }
  glow:         { "type": "glow", "color": {"r":163,"g":230,"b":53,"a":0.6}, "blur": 12, "spread": 4, "enabled": true }
  outline:      { "type": "outline", "color": {"r":255,"g":255,"b":255,"a":1}, "width": 2, "enabled": true }

### Option B: High-Level Intents (for semantic changes)
{
  "intents": [
    { "type": "change-color", "target": { "tags": ["title"] }, "params": { "color": "#ff0000" } },
    { "type": "make-bigger", "target": { "tags": ["logo"] }, "params": { "factor": 1.5 } },
    { "type": "center", "target": { "tags": ["name"] }, "params": { "axis": "horizontal" } },
    { "type": "fix-contrast", "target": { "special": "all" } }
  ],
  "summary": "Brief description"
}

### Available Intent Types:
make-bigger, make-smaller, center, change-color, make-warmer, make-cooler,
fix-contrast, ensure-readable, change-font-size, change-opacity, make-bold,
make-lighter, add-shadow, remove-shadow, add-spacing, move-to,
add-effect, remove-effect, update-effect,
set-fill, add-gradient-fill, add-pattern-fill,
set-stroke, remove-stroke, set-blend-mode,
set-corner-radius, flip, rotate,
set-font, set-text-style, set-image-filters, reorder-layer,
add-abstract-asset, remove-abstract-asset, swap-abstract-asset, configure-abstract-asset,
make-luxurious, make-minimalist, make-corporate, make-creative,
apply-typographic-scale, balance-visual-weight, improve-name-hierarchy,
add-visual-accent, refine-contact-layout, modernize-design,
add-brand-consistency, improve-whitespace,
swap-icon

### Card Design Intents (M3.11):
| Intent                   | Params                          | What it does                                     |
|--------------------------|---------------------------------|--------------------------------------------------|
| make-luxurious           | none                            | Boosts name weight, adds shadow, letter-spacing  |
| make-minimalist          | none                            | Strips effects, reduces weights, dims decoratives|
| make-corporate           | none                            | Standardizes fonts, adds uppercase titles         |
| make-creative            | none                            | Bold weights, glow effects, larger name           |
| apply-typographic-scale  | { ratio?: number }              | Applies professional type scale (default 1.25)   |
| balance-visual-weight    | none                            | Evenly spaces text elements vertically            |
| improve-name-hierarchy   | none                            | Makes name larger/bolder, slightly reduces others|
| add-visual-accent        | none                            | Increases accent/decorative element visibility    |
| refine-contact-layout    | { gap?: number }                | Re-spaces contact lines evenly                   |
| modernize-design         | none                            | Cleans up shadows/radii for contemporary look    |
| add-brand-consistency    | none                            | Unifies accent colors across the card            |
| improve-whitespace       | { padding?: number }            | Pushes content away from card edges              |
| swap-icon                | { iconId* (from ICON LIBRARY) } | Swaps icon type on target icon layer(s)          |

### Abstract Asset Intent Params:
- add-abstract-asset: params { assetId* (ID from ABSTRACT ASSET CATALOG above), primaryColor?, secondaryColor?, textColor?, opacity?, scale?, rotation?, xOffset?, yOffset?, blendMode?, colorOverride? }
  target: any (asset is added to document)
- remove-abstract-asset: params {} — target: { "tags": ["abstract-asset"] } or specific abstract tag like "abstract-modern-shard"
- swap-abstract-asset: params { assetId* } + same optional params as add — target: existing abstract layers to replace
- configure-abstract-asset: params { opacity?, blendMode?, scale?, rotation?, color? } — target: { "tags": ["abstract-asset"] } or specific abstract tag

### Effect Types (for add-effect):
drop-shadow, inner-shadow, blur, glow, outline, color-adjust, noise

### Gradient Types (for add-gradient-fill):
linear, radial, angular, diamond (with stops: [{ offset: 0, color: "#hex" }])

### Target Selectors (choose the MOST SPECIFIC one that matches):
- { "ids": ["exact-layer-id"] }          ← most precise — use when you know the ID from the layer list
- { "tags": ["name"] }                   ← use for named semantic elements (name/title/company/etc.)
- { "nameContains": "contact" }          ← use when tags are unknown but name matches
- { "layerType": "text" }               ← ONLY for "change ALL text" requests
- { "special": "all" | "selected" | "largest-text" | "primary-image" | "background" }

## RULES
1. Make the SMALLEST change that satisfies the request — only touch the SPECIFIC element named
2. Respect all LOCKED properties
3. Ensure WCAG AA contrast (≥4.5:1) for all text after the change
4. Stay within the canvas bounds
5. Maintain visual hierarchy and balance
6. Return valid JSON only — no markdown, no explanations outside JSON
7. NEVER use { "layerType": "text" } when the user names a specific element like "name" or "title"`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
