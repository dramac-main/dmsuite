// =============================================================================
// DMSuite — Align & Distribute Utilities
// Pixel-perfect alignment and distribution commands for selected layers.
// All operations produce undoable Commands.
// =============================================================================

import type { DesignDocumentV2, LayerV2, LayerId, FrameLayerV2 } from "./schema";
import type { Command } from "./commands";
import { createBatchCommand, createUpdateCommand } from "./commands";

// ---------------------------------------------------------------------------
// Alignment Types
// ---------------------------------------------------------------------------

export type AlignAxis = "left" | "center-h" | "right" | "top" | "center-v" | "bottom";
export type DistributeAxis = "horizontal" | "vertical";
export type SpacingMode = "equal" | "custom";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface LayerBounds {
  id: LayerId;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

function getLayerBounds(doc: DesignDocumentV2, ids: LayerId[]): LayerBounds[] {
  return ids
    .map(id => doc.layersById[id])
    .filter(Boolean)
    .map(l => {
      const { x, y } = l.transform.position;
      const { x: w, y: h } = l.transform.size;
      return { id: l.id, x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
    });
}

function getSelectionBounds(bounds: LayerBounds[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of bounds) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  return { minX, minY, maxX, maxY };
}

// ---------------------------------------------------------------------------
// Align Command
// ---------------------------------------------------------------------------

/**
 * Align selected layers along an axis.
 * With 1 layer selected, aligns to the artboard (root frame).
 * With 2+ layers, aligns to the selection bounds.
 */
export function createAlignCommand(
  doc: DesignDocumentV2,
  layerIds: LayerId[],
  axis: AlignAxis
): Command | null {
  if (layerIds.length === 0) return null;

  const bounds = getLayerBounds(doc, layerIds);
  if (bounds.length === 0) return null;

  // Reference bounds: artboard for single selection, selection bounds for multi
  let ref: { minX: number; minY: number; maxX: number; maxY: number };
  if (bounds.length === 1) {
    const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2 | undefined;
    if (!rootFrame) return null;
    ref = { minX: 0, minY: 0, maxX: rootFrame.transform.size.x, maxY: rootFrame.transform.size.y };
  } else {
    ref = getSelectionBounds(bounds);
  }

  const commands: Command[] = [];
  for (const b of bounds) {
    let newX = b.x;
    let newY = b.y;

    switch (axis) {
      case "left":     newX = ref.minX; break;
      case "center-h": newX = (ref.minX + ref.maxX) / 2 - b.w / 2; break;
      case "right":    newX = ref.maxX - b.w; break;
      case "top":      newY = ref.minY; break;
      case "center-v": newY = (ref.minY + ref.maxY) / 2 - b.h / 2; break;
      case "bottom":   newY = ref.maxY - b.h; break;
    }

    newX = Math.round(newX);
    newY = Math.round(newY);

    if (newX !== b.x || newY !== b.y) {
      const layer = doc.layersById[b.id];
      if (layer) {
        commands.push(createUpdateCommand(b.id, {
          transform: { ...layer.transform, position: { x: newX, y: newY } },
        } as Partial<LayerV2>, `Align ${axis}`));
      }
    }
  }

  if (commands.length === 0) return null;
  return createBatchCommand(commands, `Align ${axis}`);
}

// ---------------------------------------------------------------------------
// Distribute Command
// ---------------------------------------------------------------------------

/**
 * Distribute 3+ layers evenly along an axis.
 * The outermost layers stay fixed; inner layers are redistributed.
 */
export function createDistributeCommand(
  doc: DesignDocumentV2,
  layerIds: LayerId[],
  axis: DistributeAxis
): Command | null {
  if (layerIds.length < 3) return null;

  const bounds = getLayerBounds(doc, layerIds);
  if (bounds.length < 3) return null;

  // Sort by position along the axis
  const sorted = [...bounds].sort((a, b) =>
    axis === "horizontal" ? a.cx - b.cx : a.cy - b.cy
  );

  // Calculate total gap
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpan = axis === "horizontal"
    ? last.cx - first.cx
    : last.cy - first.cy;
  const step = totalSpan / (sorted.length - 1);

  const commands: Command[] = [];
  for (let i = 1; i < sorted.length - 1; i++) {
    const b = sorted[i];
    const layer = doc.layersById[b.id];
    if (!layer) continue;

    let newX = b.x;
    let newY = b.y;

    if (axis === "horizontal") {
      const targetCX = first.cx + step * i;
      newX = Math.round(targetCX - b.w / 2);
    } else {
      const targetCY = first.cy + step * i;
      newY = Math.round(targetCY - b.h / 2);
    }

    if (newX !== b.x || newY !== b.y) {
      commands.push(createUpdateCommand(b.id, {
        transform: { ...layer.transform, position: { x: newX, y: newY } },
      } as Partial<LayerV2>, `Distribute ${axis}`));
    }
  }

  if (commands.length === 0) return null;
  return createBatchCommand(commands, `Distribute ${axis}`);
}

// ---------------------------------------------------------------------------
// Space Evenly Command
// ---------------------------------------------------------------------------

/**
 * Set equal spacing between 3+ layers (gap-based, not center-based).
 */
export function createSpaceEvenlyCommand(
  doc: DesignDocumentV2,
  layerIds: LayerId[],
  axis: DistributeAxis,
  customGap?: number
): Command | null {
  if (layerIds.length < 3) return null;

  const bounds = getLayerBounds(doc, layerIds);
  if (bounds.length < 3) return null;

  const sorted = [...bounds].sort((a, b) =>
    axis === "horizontal" ? a.x - b.x : a.y - b.y
  );

  const totalSize = sorted.reduce((sum, b) =>
    sum + (axis === "horizontal" ? b.w : b.h), 0);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpan = axis === "horizontal"
    ? (last.x + last.w) - first.x
    : (last.y + last.h) - first.y;

  const gap = customGap ?? (totalSpan - totalSize) / (sorted.length - 1);

  const commands: Command[] = [];
  let cursor = axis === "horizontal" ? first.x + first.w + gap : first.y + first.h + gap;

  for (let i = 1; i < sorted.length - 1; i++) {
    const b = sorted[i];
    const layer = doc.layersById[b.id];
    if (!layer) continue;

    const newX = axis === "horizontal" ? Math.round(cursor) : b.x;
    const newY = axis === "vertical" ? Math.round(cursor) : b.y;
    cursor += (axis === "horizontal" ? b.w : b.h) + gap;

    if (newX !== b.x || newY !== b.y) {
      commands.push(createUpdateCommand(b.id, {
        transform: { ...layer.transform, position: { x: newX, y: newY } },
      } as Partial<LayerV2>, `Space evenly ${axis}`));
    }
  }

  if (commands.length === 0) return null;
  return createBatchCommand(commands, `Space evenly ${axis}`);
}

// ---------------------------------------------------------------------------
// Flip Command
// ---------------------------------------------------------------------------

export function createFlipCommand(
  doc: DesignDocumentV2,
  layerIds: LayerId[],
  axis: "horizontal" | "vertical"
): Command | null {
  if (layerIds.length === 0) return null;

  const bounds = getLayerBounds(doc, layerIds);
  const ref = getSelectionBounds(bounds);
  const centerX = (ref.minX + ref.maxX) / 2;
  const centerY = (ref.minY + ref.maxY) / 2;

  const commands: Command[] = [];
  for (const b of bounds) {
    const layer = doc.layersById[b.id];
    if (!layer) continue;

    const newX = axis === "horizontal" ? Math.round(centerX * 2 - b.x - b.w) : b.x;
    const newY = axis === "vertical" ? Math.round(centerY * 2 - b.y - b.h) : b.y;

    commands.push(createUpdateCommand(b.id, {
      transform: { ...layer.transform, position: { x: newX, y: newY } },
    } as Partial<LayerV2>, `Flip ${axis}`));
  }

  if (commands.length === 0) return null;
  return createBatchCommand(commands, `Flip ${axis}`);
}
