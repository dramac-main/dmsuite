// =============================================================================
// DMSuite — Hit Testing & Spatial Index
// Accurate hit detection for the vNext editor: rotation-aware AABB,
// per-shape path testing, spatial grid for O(1) lookups.
// =============================================================================

import type {
  DesignDocumentV2, LayerV2, FrameLayerV2, GroupLayerV2,
  LayerId, Vec2, AABB,
} from "./schema";
import { transformToAABB } from "./schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HandleDirection = "nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e" | "rotation";

export interface HitResult {
  layerId: LayerId;
  /** If a resize/rotation handle was hit */
  handle?: HandleDirection;
}

// ---------------------------------------------------------------------------
// Hit Test (top-level)
// ---------------------------------------------------------------------------

/**
 * Hit-test a point against all layers in the document.
 * Returns the topmost (front-most) unlocked, visible layer under the point.
 */
export function hitTestDocument(
  doc: DesignDocumentV2,
  point: Vec2
): HitResult | null {
  const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2 | undefined;
  if (!rootFrame) return null;

  // Walk children front-to-back (index 0 = topmost)
  return hitTestChildren(doc, rootFrame.children, point);
}

/**
 * Hit-test selected layer handles first (so they take priority during interaction).
 */
export function hitTestHandles(
  doc: DesignDocumentV2,
  point: Vec2
): HitResult | null {
  for (const id of doc.selection.ids) {
    const layer = doc.layersById[id];
    if (!layer) continue;

    const handle = getHandleAtPoint(layer, point);
    if (handle) {
      return { layerId: id, handle };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function hitTestChildren(
  doc: DesignDocumentV2,
  childIds: LayerId[],
  point: Vec2
): HitResult | null {
  // Front-to-back: first child in array is topmost
  for (const id of childIds) {
    const layer = doc.layersById[id];
    if (!layer || !layer.visible || layer.locked) continue;

    // Check groups/frames recursively first (children may be on top)
    if (layer.type === "frame" || layer.type === "group" || layer.type === "boolean-group") {
      const children = (layer as FrameLayerV2 | GroupLayerV2).children;
      const childHit = hitTestChildren(doc, children, point);
      if (childHit) return childHit;
    }

    // Check this layer
    if (isPointInLayer(layer, point)) {
      return { layerId: layer.id };
    }
  }
  return null;
}

/**
 * Test if a point is inside a layer's bounds (rotation-aware).
 */
function isPointInLayer(layer: LayerV2, point: Vec2): boolean {
  const t = layer.transform;

  // For unrotated layers, simple AABB check
  if (t.rotation === 0 && t.skewX === 0 && t.skewY === 0) {
    return (
      point.x >= t.position.x &&
      point.x <= t.position.x + t.size.x &&
      point.y >= t.position.y &&
      point.y <= t.position.y + t.size.y
    );
  }

  // For rotated layers: transform the point into local space
  const cx = t.position.x + t.size.x * t.pivot.x;
  const cy = t.position.y + t.size.y * t.pivot.y;
  const rad = (-t.rotation * Math.PI) / 180; // inverse rotation
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Translate point relative to pivot, rotate inversely, translate back
  const dx = point.x - cx;
  const dy = point.y - cy;
  const localX = cos * dx - sin * dy + cx;
  const localY = sin * dx + cos * dy + cy;

  return (
    localX >= t.position.x &&
    localX <= t.position.x + t.size.x &&
    localY >= t.position.y &&
    localY <= t.position.y + t.size.y
  );
}

/**
 * Get which resize/rotation handle is at a point, if any.
 */
function getHandleAtPoint(layer: LayerV2, point: Vec2): HandleDirection | null {
  const { x, y } = layer.transform.position;
  const { x: w, y: h } = layer.transform.size;
  const threshold = 8;

  const handles: Record<HandleDirection, Vec2> = {
    nw: { x, y },
    ne: { x: x + w, y },
    sw: { x, y: y + h },
    se: { x: x + w, y: y + h },
    n: { x: x + w / 2, y },
    s: { x: x + w / 2, y: y + h },
    w: { x, y: y + h / 2 },
    e: { x: x + w, y: y + h / 2 },
    rotation: { x: x + w / 2, y: y - 24 },
  };

  // For rotated layers, transform handle positions
  const t = layer.transform;
  if (t.rotation !== 0) {
    const cx = x + w * t.pivot.x;
    const cy = y + h * t.pivot.y;
    const rad = (t.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    for (const [dir, hp] of Object.entries(handles)) {
      const dx = hp.x - cx;
      const dy = hp.y - cy;
      handles[dir as HandleDirection] = {
        x: cos * dx - sin * dy + cx,
        y: sin * dx + cos * dy + cy,
      };
    }
  }

  for (const [dir, hp] of Object.entries(handles)) {
    if (Math.abs(point.x - hp.x) <= threshold && Math.abs(point.y - hp.y) <= threshold) {
      return dir as HandleDirection;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Spatial Index (grid-based for bulk hit testing)
// ---------------------------------------------------------------------------

const CELL_SIZE = 64;

export class SpatialIndex {
  private grid = new Map<string, Set<LayerId>>();
  private aabbCache = new Map<LayerId, AABB>();

  /** Rebuild the entire index from a document */
  rebuild(doc: DesignDocumentV2): void {
    this.grid.clear();
    this.aabbCache.clear();

    for (const [id, layer] of Object.entries(doc.layersById)) {
      if (layer.type === "frame" && id === doc.rootFrameId) continue; // skip root
      this.insert(id, layer);
    }
  }

  /** Insert/update a single layer */
  insert(id: LayerId, layer: LayerV2): void {
    // Remove old entry
    this.remove(id);

    const aabb = transformToAABB(layer.transform);
    this.aabbCache.set(id, aabb);

    const minCellX = Math.floor(aabb.minX / CELL_SIZE);
    const minCellY = Math.floor(aabb.minY / CELL_SIZE);
    const maxCellX = Math.floor(aabb.maxX / CELL_SIZE);
    const maxCellY = Math.floor(aabb.maxY / CELL_SIZE);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        if (!this.grid.has(key)) this.grid.set(key, new Set());
        this.grid.get(key)!.add(id);
      }
    }
  }

  /** Remove a layer from the index */
  remove(id: LayerId): void {
    const aabb = this.aabbCache.get(id);
    if (!aabb) return;

    const minCellX = Math.floor(aabb.minX / CELL_SIZE);
    const minCellY = Math.floor(aabb.minY / CELL_SIZE);
    const maxCellX = Math.floor(aabb.maxX / CELL_SIZE);
    const maxCellY = Math.floor(aabb.maxY / CELL_SIZE);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        this.grid.get(key)?.delete(id);
      }
    }

    this.aabbCache.delete(id);
  }

  /** Query: all layers whose AABB intersects a rectangle */
  queryRect(rect: AABB): LayerId[] {
    const result = new Set<LayerId>();

    const minCellX = Math.floor(rect.minX / CELL_SIZE);
    const minCellY = Math.floor(rect.minY / CELL_SIZE);
    const maxCellX = Math.floor(rect.maxX / CELL_SIZE);
    const maxCellY = Math.floor(rect.maxY / CELL_SIZE);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        const ids = this.grid.get(key);
        if (!ids) continue;
        for (const id of ids) {
          const aabb = this.aabbCache.get(id)!;
          if (aabbIntersects(aabb, rect)) {
            result.add(id);
          }
        }
      }
    }

    return Array.from(result);
  }

  /** Query: all layers whose AABB contains a point */
  queryPoint(point: Vec2): LayerId[] {
    return this.queryRect({
      minX: point.x, minY: point.y,
      maxX: point.x, maxY: point.y,
    });
  }

  /** Get cached AABB for a layer */
  getAABB(id: LayerId): AABB | undefined {
    return this.aabbCache.get(id);
  }
}

function aabbIntersects(a: AABB, b: AABB): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}
