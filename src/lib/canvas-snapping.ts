// =============================================================================
// DMSuite — Canvas Snapping & Smart Guides (Task 2.1.3)
// =============================================================================

import type { Layer, Bounds } from "./canvas-layers";

export interface SnapGuide {
  type: "horizontal" | "vertical";
  position: number;
  label?: string;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

const SNAP_THRESHOLD = 6;

/**
 * Calculate snap position for a dragged layer against other layers and canvas edges.
 */
export function calculateSnap(
  dragging: Bounds,
  others: Layer[],
  canvasWidth: number,
  canvasHeight: number,
  gridSize?: number
): SnapResult {
  let snapX = dragging.x;
  let snapY = dragging.y;
  const guides: SnapGuide[] = [];

  const midX = dragging.x + dragging.width / 2;
  const midY = dragging.y + dragging.height / 2;
  const rightX = dragging.x + dragging.width;
  const bottomY = dragging.y + dragging.height;

  // Snap to grid
  if (gridSize && gridSize > 0) {
    const gx = Math.round(dragging.x / gridSize) * gridSize;
    const gy = Math.round(dragging.y / gridSize) * gridSize;
    if (Math.abs(gx - dragging.x) < SNAP_THRESHOLD) snapX = gx;
    if (Math.abs(gy - dragging.y) < SNAP_THRESHOLD) snapY = gy;
  }

  // Snap to canvas center
  const canvasMidX = canvasWidth / 2;
  const canvasMidY = canvasHeight / 2;

  if (Math.abs(midX - canvasMidX) < SNAP_THRESHOLD) {
    snapX = canvasMidX - dragging.width / 2;
    guides.push({ type: "vertical", position: canvasMidX, label: "Center" });
  }
  if (Math.abs(midY - canvasMidY) < SNAP_THRESHOLD) {
    snapY = canvasMidY - dragging.height / 2;
    guides.push({ type: "horizontal", position: canvasMidY, label: "Center" });
  }

  // Snap to canvas edges
  if (Math.abs(dragging.x) < SNAP_THRESHOLD) {
    snapX = 0;
    guides.push({ type: "vertical", position: 0 });
  }
  if (Math.abs(rightX - canvasWidth) < SNAP_THRESHOLD) {
    snapX = canvasWidth - dragging.width;
    guides.push({ type: "vertical", position: canvasWidth });
  }
  if (Math.abs(dragging.y) < SNAP_THRESHOLD) {
    snapY = 0;
    guides.push({ type: "horizontal", position: 0 });
  }
  if (Math.abs(bottomY - canvasHeight) < SNAP_THRESHOLD) {
    snapY = canvasHeight - dragging.height;
    guides.push({ type: "horizontal", position: canvasHeight });
  }

  // Snap to other layers' edges and centers
  for (const other of others) {
    if (!other.visible) continue;

    const otherMidX = other.x + other.width / 2;
    const otherMidY = other.y + other.height / 2;
    const otherRight = other.x + other.width;
    const otherBottom = other.y + other.height;

    // Left edge → left edge
    if (Math.abs(dragging.x - other.x) < SNAP_THRESHOLD) {
      snapX = other.x;
      guides.push({ type: "vertical", position: other.x });
    }
    // Right edge → right edge
    if (Math.abs(rightX - otherRight) < SNAP_THRESHOLD) {
      snapX = otherRight - dragging.width;
      guides.push({ type: "vertical", position: otherRight });
    }
    // Left edge → right edge
    if (Math.abs(dragging.x - otherRight) < SNAP_THRESHOLD) {
      snapX = otherRight;
      guides.push({ type: "vertical", position: otherRight });
    }
    // Right edge → left edge
    if (Math.abs(rightX - other.x) < SNAP_THRESHOLD) {
      snapX = other.x - dragging.width;
      guides.push({ type: "vertical", position: other.x });
    }
    // Center → center (horizontal)
    if (Math.abs(midX - otherMidX) < SNAP_THRESHOLD) {
      snapX = otherMidX - dragging.width / 2;
      guides.push({ type: "vertical", position: otherMidX });
    }

    // Top edge → top edge
    if (Math.abs(dragging.y - other.y) < SNAP_THRESHOLD) {
      snapY = other.y;
      guides.push({ type: "horizontal", position: other.y });
    }
    // Bottom edge → bottom edge
    if (Math.abs(bottomY - otherBottom) < SNAP_THRESHOLD) {
      snapY = otherBottom - dragging.height;
      guides.push({ type: "horizontal", position: otherBottom });
    }
    // Top → bottom
    if (Math.abs(dragging.y - otherBottom) < SNAP_THRESHOLD) {
      snapY = otherBottom;
      guides.push({ type: "horizontal", position: otherBottom });
    }
    // Bottom → top
    if (Math.abs(bottomY - other.y) < SNAP_THRESHOLD) {
      snapY = other.y - dragging.height;
      guides.push({ type: "horizontal", position: other.y });
    }
    // Center → center (vertical)
    if (Math.abs(midY - otherMidY) < SNAP_THRESHOLD) {
      snapY = otherMidY - dragging.height / 2;
      guides.push({ type: "horizontal", position: otherMidY });
    }
  }

  return { x: snapX, y: snapY, guides };
}

/**
 * Draw snap guide lines on the canvas
 */
export function drawSnapGuides(
  ctx: CanvasRenderingContext2D,
  guides: SnapGuide[],
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.save();
  ctx.strokeStyle = "#06b6d4"; // secondary/cyan
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);

  for (const guide of guides) {
    ctx.beginPath();
    if (guide.type === "vertical") {
      ctx.moveTo(guide.position, 0);
      ctx.lineTo(guide.position, canvasHeight);
    } else {
      ctx.moveTo(0, guide.position);
      ctx.lineTo(canvasWidth, guide.position);
    }
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.restore();
}
