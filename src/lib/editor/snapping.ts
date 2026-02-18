// =============================================================================
// DMSuite — Smart Snapping Engine
// Object-to-object snapping with visual smart guides.
// Snaps edges, centers, and spacing to other layers and artboard.
// =============================================================================

import type { DesignDocumentV2, LayerV2, LayerId, FrameLayerV2, Vec2 } from "./schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SnapResult {
  /** Snapped position (adjusted from original) */
  snappedX: number;
  snappedY: number;
  /** Whether X was snapped */
  didSnapX: boolean;
  /** Whether Y was snapped */
  didSnapY: boolean;
  /** Visual guides to draw */
  guides: SnapGuide[];
}

export interface SnapGuide {
  type: "horizontal" | "vertical";
  /** Position in world coordinates */
  position: number;
  /** Start of guide line */
  start: number;
  /** End of guide line */
  end: number;
  /** Label (e.g., spacing value) */
  label?: string;
  /** Color hint */
  color: "align" | "spacing" | "grid";
}

export interface SnapConfig {
  /** Snap tolerance in world pixels */
  tolerance: number;
  /** Snap to other layers */
  snapToLayers: boolean;
  /** Snap to artboard edges/center */
  snapToArtboard: boolean;
  /** Snap to grid */
  snapToGrid: boolean;
  /** Grid size in px */
  gridSize: number;
  /** Show spacing guides between objects */
  showSpacing: boolean;
}

export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  tolerance: 5,
  snapToLayers: true,
  snapToArtboard: true,
  snapToGrid: true,
  gridSize: 8,
  showSpacing: true,
};

// ---------------------------------------------------------------------------
// Core Snapping
// ---------------------------------------------------------------------------

interface LayerEdges {
  id: LayerId;
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

function getLayerEdges(layer: LayerV2): LayerEdges {
  const { x, y } = layer.transform.position;
  const { x: w, y: h } = layer.transform.size;
  return {
    id: layer.id,
    left: x,
    right: x + w,
    top: y,
    bottom: y + h,
    centerX: x + w / 2,
    centerY: y + h / 2,
  };
}

/**
 * Compute snap position for a layer being moved.
 * Returns adjusted position + visual guide lines.
 */
export function snapLayer(
  doc: DesignDocumentV2,
  movingId: LayerId,
  proposedX: number,
  proposedY: number,
  config: SnapConfig = DEFAULT_SNAP_CONFIG
): SnapResult {
  const moving = doc.layersById[movingId];
  if (!moving) {
    return { snappedX: proposedX, snappedY: proposedY, didSnapX: false, didSnapY: false, guides: [] };
  }

  const { x: w, y: h } = moving.transform.size;
  const movingEdges: LayerEdges = {
    id: movingId,
    left: proposedX,
    right: proposedX + w,
    top: proposedY,
    bottom: proposedY + h,
    centerX: proposedX + w / 2,
    centerY: proposedY + h / 2,
  };

  const guides: SnapGuide[] = [];
  let bestDx = Infinity;
  let bestDy = Infinity;
  let snapX = proposedX;
  let snapY = proposedY;

  // Collect reference edges from all other visible layers
  const referenceEdges: LayerEdges[] = [];

  // Artboard edges
  if (config.snapToArtboard) {
    const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2 | undefined;
    if (rootFrame) {
      const rw = rootFrame.transform.size.x;
      const rh = rootFrame.transform.size.y;
      referenceEdges.push({
        id: doc.rootFrameId,
        left: 0, right: rw,
        top: 0, bottom: rh,
        centerX: rw / 2, centerY: rh / 2,
      });
    }
  }

  // Other layers
  if (config.snapToLayers) {
    const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2 | undefined;
    if (rootFrame) {
      for (const childId of rootFrame.children) {
        if (childId === movingId) continue;
        const child = doc.layersById[childId];
        if (!child || !child.visible || child.locked) continue;
        referenceEdges.push(getLayerEdges(child));
      }
    }
  }

  const tol = config.tolerance;

  // Test horizontal snap points (left/center/right of moving vs left/center/right of refs)
  const movingXPoints = [
    { value: movingEdges.left, label: "left" },
    { value: movingEdges.centerX, label: "center" },
    { value: movingEdges.right, label: "right" },
  ];

  for (const ref of referenceEdges) {
    const refXPoints = [ref.left, ref.centerX, ref.right];
    const refYPoints = [ref.top, ref.centerY, ref.bottom];

    // Horizontal snapping
    for (const mp of movingXPoints) {
      for (const rp of refXPoints) {
        const dx = Math.abs(mp.value - rp);
        if (dx < tol && dx < Math.abs(bestDx)) {
          bestDx = rp - mp.value;
          snapX = proposedX + bestDx;
        }
      }
    }

    // Vertical snapping
    const movingYPoints = [
      { value: movingEdges.top, label: "top" },
      { value: movingEdges.centerY, label: "center" },
      { value: movingEdges.bottom, label: "bottom" },
    ];

    for (const mp of movingYPoints) {
      for (const rp of refYPoints) {
        const dy = Math.abs(mp.value - rp);
        if (dy < tol && dy < Math.abs(bestDy)) {
          bestDy = rp - mp.value;
          snapY = proposedY + bestDy;
        }
      }
    }
  }

  // Grid snapping (lowest priority — only if no object snap found)
  if (config.snapToGrid && config.gridSize > 0) {
    if (bestDx === Infinity) {
      const gridSnapX = Math.round(proposedX / config.gridSize) * config.gridSize;
      if (Math.abs(gridSnapX - proposedX) < tol) {
        snapX = gridSnapX;
        bestDx = gridSnapX - proposedX;
      }
    }
    if (bestDy === Infinity) {
      const gridSnapY = Math.round(proposedY / config.gridSize) * config.gridSize;
      if (Math.abs(gridSnapY - proposedY) < tol) {
        snapY = gridSnapY;
        bestDy = gridSnapY - proposedY;
      }
    }
  }

  // Generate visual guides for active snaps
  const didSnapX = bestDx !== Infinity;
  const didSnapY = bestDy !== Infinity;

  if (didSnapX) {
    const guideX = snapX + w / 2 + (bestDx > 0 ? -w / 2 : w / 2);
    // Find which reference line we snapped to
    for (const ref of referenceEdges) {
      const refXPoints = [ref.left, ref.centerX, ref.right];
      for (const rp of refXPoints) {
        const snappedMovingEdges = [snapX, snapX + w / 2, snapX + w];
        for (const sme of snappedMovingEdges) {
          if (Math.abs(sme - rp) < 0.5) {
            guides.push({
              type: "vertical",
              position: rp,
              start: Math.min(movingEdges.top, ref.top) - 10,
              end: Math.max(movingEdges.bottom, ref.bottom) + 10,
              color: "align",
            });
          }
        }
      }
    }
  }

  if (didSnapY) {
    for (const ref of referenceEdges) {
      const refYPoints = [ref.top, ref.centerY, ref.bottom];
      for (const rp of refYPoints) {
        const snappedMovingEdges = [snapY, snapY + h / 2, snapY + h];
        for (const sme of snappedMovingEdges) {
          if (Math.abs(sme - rp) < 0.5) {
            guides.push({
              type: "horizontal",
              position: rp,
              start: Math.min(movingEdges.left, ref.left) - 10,
              end: Math.max(movingEdges.right, ref.right) + 10,
              color: "align",
            });
          }
        }
      }
    }
  }

  return {
    snappedX: didSnapX ? snapX : proposedX,
    snappedY: didSnapY ? snapY : proposedY,
    didSnapX,
    didSnapY,
    guides,
  };
}

// ---------------------------------------------------------------------------
// Resize Snapping
// ---------------------------------------------------------------------------

/**
 * Snap during resize operations.
 * Snaps the moving edge/corner to nearby reference points.
 */
export function snapResize(
  doc: DesignDocumentV2,
  resizingId: LayerId,
  handle: string,
  proposedX: number,
  proposedY: number,
  proposedW: number,
  proposedH: number,
  config: SnapConfig = DEFAULT_SNAP_CONFIG
): { x: number; y: number; w: number; h: number; guides: SnapGuide[] } {
  // For resize, we snap the relevant edges
  const guides: SnapGuide[] = [];
  let x = proposedX, y = proposedY, w = proposedW, h = proposedH;

  const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2 | undefined;
  if (!rootFrame || !config.snapToLayers) {
    return { x, y, w, h, guides };
  }

  const tol = config.tolerance;
  const referenceEdges: number[] = [];

  // Collect reference X and Y positions
  const refXs: number[] = [0, rootFrame.transform.size.x / 2, rootFrame.transform.size.x];
  const refYs: number[] = [0, rootFrame.transform.size.y / 2, rootFrame.transform.size.y];

  for (const childId of rootFrame.children) {
    if (childId === resizingId) continue;
    const child = doc.layersById[childId];
    if (!child || !child.visible || child.locked) continue;
    const e = getLayerEdges(child);
    refXs.push(e.left, e.centerX, e.right);
    refYs.push(e.top, e.centerY, e.bottom);
  }

  // Snap right edge for east handles
  if (handle.includes("e")) {
    const rightEdge = x + w;
    for (const rx of refXs) {
      if (Math.abs(rightEdge - rx) < tol) {
        w = rx - x;
        guides.push({ type: "vertical", position: rx, start: y - 10, end: y + h + 10, color: "align" });
        break;
      }
    }
  }

  // Snap left edge for west handles
  if (handle.includes("w")) {
    for (const rx of refXs) {
      if (Math.abs(x - rx) < tol) {
        const dx = rx - x;
        x = rx;
        w -= dx;
        guides.push({ type: "vertical", position: rx, start: y - 10, end: y + h + 10, color: "align" });
        break;
      }
    }
  }

  // Snap bottom edge for south handles
  if (handle.includes("s")) {
    const bottomEdge = y + h;
    for (const ry of refYs) {
      if (Math.abs(bottomEdge - ry) < tol) {
        h = ry - y;
        guides.push({ type: "horizontal", position: ry, start: x - 10, end: x + w + 10, color: "align" });
        break;
      }
    }
  }

  // Snap top edge for north handles
  if (handle.includes("n")) {
    for (const ry of refYs) {
      if (Math.abs(y - ry) < tol) {
        const dy = ry - y;
        y = ry;
        h -= dy;
        guides.push({ type: "horizontal", position: ry, start: x - 10, end: x + w + 10, color: "align" });
        break;
      }
    }
  }

  return { x, y, w: Math.max(1, w), h: Math.max(1, h), guides };
}

// ---------------------------------------------------------------------------
// Draw Snap Guides (for overlay rendering)
// ---------------------------------------------------------------------------

/**
 * Draw snap guide lines on the canvas (called from CanvasEditor overlay).
 */
export function drawSnapGuides(
  ctx: CanvasRenderingContext2D,
  guides: SnapGuide[],
  zoom: number
): void {
  if (guides.length === 0) return;

  ctx.save();
  ctx.lineWidth = 1 / zoom;

  for (const guide of guides) {
    // Color based on type
    switch (guide.color) {
      case "align":
        ctx.strokeStyle = "#ff3366";
        ctx.setLineDash([]);
        break;
      case "spacing":
        ctx.strokeStyle = "#33ccff";
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        break;
      case "grid":
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.setLineDash([2 / zoom, 2 / zoom]);
        break;
    }

    ctx.beginPath();
    if (guide.type === "vertical") {
      ctx.moveTo(guide.position, guide.start);
      ctx.lineTo(guide.position, guide.end);
    } else {
      ctx.moveTo(guide.start, guide.position);
      ctx.lineTo(guide.end, guide.position);
    }
    ctx.stroke();

    // Draw label if present
    if (guide.label) {
      ctx.save();
      ctx.font = `${10 / zoom}px Inter, sans-serif`;
      ctx.fillStyle = ctx.strokeStyle;
      if (guide.type === "vertical") {
        ctx.fillText(guide.label, guide.position + 4 / zoom, (guide.start + guide.end) / 2);
      } else {
        ctx.fillText(guide.label, (guide.start + guide.end) / 2, guide.position - 4 / zoom);
      }
      ctx.restore();
    }
  }

  ctx.restore();
}
