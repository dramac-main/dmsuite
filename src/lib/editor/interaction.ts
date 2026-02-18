// =============================================================================
// DMSuite — Editor Interaction Engine
// Pointer state machine: select, move, resize, rotate, draw-shape, marquee, pan
// Handles mouse/touch events and converts them to commands.
// =============================================================================

import type {
  DesignDocumentV2, LayerId, Vec2,
} from "./schema";
import { getLayerOrder } from "./schema";
import type { Command } from "./commands";
import { createMoveCommand, createResizeCommand, createUpdateCommand } from "./commands";
import { hitTestDocument, hitTestHandles } from "./hit-test";
import type { HandleDirection } from "./hit-test";
import { snapToGrid } from "./design-rules";

// ---------------------------------------------------------------------------
// Interaction State
// ---------------------------------------------------------------------------

export type PointerPhase = "idle" | "down" | "dragging";

export interface InteractionState {
  phase: PointerPhase;
  action:
    | { type: "none" }
    | { type: "move"; layerIds: LayerId[]; origins: Record<string, Vec2>; startWorld: Vec2 }
    | { type: "resize"; layerId: LayerId; handle: HandleDirection; startWorld: Vec2; origPos: Vec2; origSize: Vec2 }
    | { type: "rotate"; layerId: LayerId; startAngle: number; origRotation: number }
    | { type: "draw-shape"; shapeType: string; startWorld: Vec2 }
    | { type: "marquee"; startWorld: Vec2; currentWorld: Vec2 }
    | { type: "pan"; startScreen: Vec2; origOffset: Vec2 };
  /** Distance moved so far — used to distinguish click from drag */
  totalDist: number;
}

export function createInteractionState(): InteractionState {
  return {
    phase: "idle",
    action: { type: "none" },
    totalDist: 0,
  };
}

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

export interface ViewportTransform {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

/** Screen (pixel) coords → world (document) coords */
export function screenToWorld(sx: number, sy: number, vp: ViewportTransform): Vec2 {
  return {
    x: (sx - vp.offsetX) / vp.zoom,
    y: (sy - vp.offsetY) / vp.zoom,
  };
}

/** World coords → screen coords */
export function worldToScreen(wx: number, wy: number, vp: ViewportTransform): Vec2 {
  return {
    x: wx * vp.zoom + vp.offsetX,
    y: wy * vp.zoom + vp.offsetY,
  };
}

// ---------------------------------------------------------------------------
// Event result — what the component should do after processing an event
// ---------------------------------------------------------------------------

export interface InteractionResult {
  /** Updated interaction state */
  state: InteractionState;
  /** Commands to execute (undoable) */
  commands: Command[];
  /** Selection changes */
  selection?: { ids: LayerId[]; additive?: boolean };
  /** Viewport changes */
  viewportDelta?: Partial<ViewportTransform>;
  /** Whether canvas needs repaint */
  needsRepaint: boolean;
  /** Cursor to show */
  cursor: string;
}

const DRAG_THRESHOLD = 3; // pixels before a press becomes a drag

// ---------------------------------------------------------------------------
// Pointer Down
// ---------------------------------------------------------------------------

export function handlePointerDown(
  doc: DesignDocumentV2,
  istate: InteractionState,
  mode: "select" | "hand" | "text" | "shape" | "draw" | "zoom",
  worldPoint: Vec2,
  screenPoint: Vec2,
  viewport: ViewportTransform,
  shiftKey: boolean,
  metaKey: boolean,
  shapeType?: string
): InteractionResult {
  const result: InteractionResult = {
    state: { ...istate, phase: "down", totalDist: 0 },
    commands: [],
    needsRepaint: false,
    cursor: "default",
  };

  if (mode === "hand") {
    result.state.action = {
      type: "pan",
      startScreen: screenPoint,
      origOffset: { x: viewport.offsetX, y: viewport.offsetY },
    };
    result.cursor = "grabbing";
    return result;
  }

  if (mode === "shape" && shapeType) {
    result.state.action = {
      type: "draw-shape",
      shapeType,
      startWorld: worldPoint,
    };
    result.cursor = "crosshair";
    return result;
  }

  // Select mode: check handles first, then layers
  if (mode === "select") {
    // Check resize/rotation handles on selected layers
    const handleHit = hitTestHandles(doc, worldPoint);
    if (handleHit && handleHit.handle) {
      const layer = doc.layersById[handleHit.layerId];
      const handle = handleHit.handle;
      if (layer) {
        if (handle === "rotation") {
          const centerX = layer.transform.position.x + layer.transform.size.x / 2;
          const centerY = layer.transform.position.y + layer.transform.size.y / 2;
          const startAngle = Math.atan2(
            worldPoint.y - centerY,
            worldPoint.x - centerX
          );
          result.state.action = {
            type: "rotate",
            layerId: handleHit.layerId,
            startAngle,
            origRotation: layer.transform.rotation,
          };
        } else {
          result.state.action = {
            type: "resize",
            layerId: handleHit.layerId,
            handle,
            startWorld: worldPoint,
            origPos: { ...layer.transform.position },
            origSize: { ...layer.transform.size },
          };
        }
        result.cursor = getCursorForHandle(handle);
        return result;
      }
    }

    // Hit test layers
    const hit = hitTestDocument(doc, worldPoint);
    if (hit) {
      const alreadySelected = doc.selection.ids.includes(hit.layerId);
      if (shiftKey || metaKey) {
        // Toggle selection
        if (alreadySelected) {
          result.selection = { ids: doc.selection.ids.filter(id => id !== hit.layerId) };
        } else {
          result.selection = { ids: [...doc.selection.ids, hit.layerId] };
        }
      } else if (!alreadySelected) {
        result.selection = { ids: [hit.layerId] };
      }

      // Prepare move
      const selectedIds = result.selection?.ids ?? doc.selection.ids;
      const targetIds = selectedIds.includes(hit.layerId) ? selectedIds : [hit.layerId];
      const origins: Record<string, Vec2> = {};
      for (const id of targetIds) {
        const l = doc.layersById[id];
        if (l) origins[id] = { ...l.transform.position };
      }
      result.state.action = {
        type: "move",
        layerIds: targetIds,
        origins,
        startWorld: worldPoint,
      };
      result.cursor = "move";
      result.needsRepaint = true;
      return result;
    }

    // Clicked empty space — start marquee or deselect
    result.selection = { ids: [] };
    result.state.action = {
      type: "marquee",
      startWorld: worldPoint,
      currentWorld: worldPoint,
    };
    result.needsRepaint = true;
    return result;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Pointer Move (drag)
// ---------------------------------------------------------------------------

export function handlePointerMove(
  doc: DesignDocumentV2,
  istate: InteractionState,
  worldPoint: Vec2,
  screenPoint: Vec2,
  viewport: ViewportTransform,
  snapEnabled: boolean
): InteractionResult {
  const result: InteractionResult = {
    state: { ...istate },
    commands: [],
    needsRepaint: false,
    cursor: "default",
  };

  if (istate.phase === "idle") {
    // Hover cursor
    const handleHit = hitTestHandles(doc, worldPoint);
    if (handleHit && handleHit.handle) {
      result.cursor = getCursorForHandle(handleHit.handle);
      return result;
    }
    const hit = hitTestDocument(doc, worldPoint);
    result.cursor = hit ? "move" : "default";
    return result;
  }

  // Calculate distance from start for drag threshold
  const action = istate.action;
  if (action.type === "none") return result;

  const dist = istate.totalDist + 1; // Simplified — real impl uses actual distance
  result.state.totalDist = dist;

  const isDragging = dist >= DRAG_THRESHOLD;
  if (isDragging && istate.phase === "down") {
    result.state.phase = "dragging";
  }

  if (result.state.phase !== "dragging") return result;

  switch (action.type) {
    case "move": {
      const dx = worldPoint.x - action.startWorld.x;
      const dy = worldPoint.y - action.startWorld.y;
      let effectiveDx = dx;
      let effectiveDy = dy;
      if (snapEnabled) {
        // Snap the first layer's new position to grid, compute snapped delta
        const firstId = action.layerIds[0];
        const firstOrig = action.origins[firstId];
        if (firstOrig) {
          effectiveDx = snapToGrid(firstOrig.x + dx) - firstOrig.x;
          effectiveDy = snapToGrid(firstOrig.y + dy) - firstOrig.y;
        }
      }
      result.commands = [createMoveCommand(action.layerIds, effectiveDx, effectiveDy)];
      result.cursor = "move";
      result.needsRepaint = true;
      break;
    }

    case "resize": {
      const { layerId, handle, startWorld, origPos, origSize } = action;
      const dx = worldPoint.x - startWorld.x;
      const dy = worldPoint.y - startWorld.y;

      let newX = origPos.x;
      let newY = origPos.y;
      let newW = origSize.x;
      let newH = origSize.y;

      // Apply resize based on handle
      if (handle.includes("e")) { newW = Math.max(10, origSize.x + dx); }
      if (handle.includes("w")) { newW = Math.max(10, origSize.x - dx); newX = origPos.x + dx; }
      if (handle.includes("s")) { newH = Math.max(10, origSize.y + dy); }
      if (handle.includes("n")) { newH = Math.max(10, origSize.y - dy); newY = origPos.y + dy; }

      if (snapEnabled) {
        newX = snapToGrid(newX);
        newY = snapToGrid(newY);
        newW = snapToGrid(newW);
        newH = snapToGrid(newH);
      }

      result.commands = [createResizeCommand(layerId, newX, newY, newW, newH, origPos.x, origPos.y, origSize.x, origSize.y)];
      result.cursor = getCursorForHandle(handle);
      result.needsRepaint = true;
      break;
    }

    case "rotate": {
      const layer = doc.layersById[action.layerId];
      if (!layer) break;
      const centerX = layer.transform.position.x + layer.transform.size.x / 2;
      const centerY = layer.transform.position.y + layer.transform.size.y / 2;
      const currentAngle = Math.atan2(worldPoint.y - centerY, worldPoint.x - centerX);
      const deltaAngle = (currentAngle - action.startAngle) * (180 / Math.PI);
      let newRotation = action.origRotation + deltaAngle;
      // Snap to 15° increments when close
      if (Math.abs(newRotation % 15) < 3) {
        newRotation = Math.round(newRotation / 15) * 15;
      }
      result.commands = [
        createUpdateCommand(action.layerId, { transform: { ...layer.transform, rotation: newRotation } } as Partial<typeof layer>, "Rotate"),
      ];
      result.cursor = "crosshair";
      result.needsRepaint = true;
      break;
    }

    case "marquee": {
      result.state.action = { ...action, currentWorld: worldPoint };
      result.cursor = "crosshair";
      result.needsRepaint = true;
      break;
    }

    case "pan": {
      const dx = screenPoint.x - action.startScreen.x;
      const dy = screenPoint.y - action.startScreen.y;
      result.viewportDelta = {
        offsetX: action.origOffset.x + dx,
        offsetY: action.origOffset.y + dy,
      };
      result.cursor = "grabbing";
      result.needsRepaint = true;
      break;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Pointer Up
// ---------------------------------------------------------------------------

export function handlePointerUp(
  doc: DesignDocumentV2,
  istate: InteractionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  worldPoint: Vec2
): InteractionResult {
  const result: InteractionResult = {
    state: createInteractionState(),
    commands: [],
    needsRepaint: true,
    cursor: "default",
  };

  if (istate.action.type === "marquee" && istate.phase === "dragging") {
    const { startWorld, currentWorld } = istate.action as { type: "marquee"; startWorld: Vec2; currentWorld: Vec2 };
    const minX = Math.min(startWorld.x, currentWorld.x);
    const minY = Math.min(startWorld.y, currentWorld.y);
    const maxX = Math.max(startWorld.x, currentWorld.x);
    const maxY = Math.max(startWorld.y, currentWorld.y);

    const allLayers = getLayerOrder(doc).filter(l => l.id !== doc.rootFrameId);
    const selected = allLayers.filter(l => {
      const pos = l.transform.position;
      const size = l.transform.size;
      return (
        pos.x < maxX && pos.x + size.x > minX &&
        pos.y < maxY && pos.y + size.y > minY
      );
    });
    result.selection = { ids: selected.map(l => l.id) };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts for interaction
// ---------------------------------------------------------------------------

export interface KeyAction {
  commands: Command[];
  selection?: { ids: LayerId[] };
  needsRepaint: boolean;
}

export function handleKeyAction(
  doc: DesignDocumentV2,
  key: string,
  ctrlKey: boolean,
  shiftKey: boolean
): KeyAction | null {
  const selected = doc.selection.ids;
  if (selected.length === 0) return null;

  const nudge = shiftKey ? 10 : 1;

  switch (key) {
    case "ArrowLeft":
      return { commands: [createMoveCommand(selected, -nudge, 0)], needsRepaint: true };
    case "ArrowRight":
      return { commands: [createMoveCommand(selected, nudge, 0)], needsRepaint: true };
    case "ArrowUp":
      return { commands: [createMoveCommand(selected, 0, -nudge)], needsRepaint: true };
    case "ArrowDown":
      return { commands: [createMoveCommand(selected, 0, nudge)], needsRepaint: true };

    case "Delete":
    case "Backspace": {
      // createDeleteCommand is handled at the store level
      return { commands: [], selection: { ids: [] }, needsRepaint: true };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Cursor helpers
// ---------------------------------------------------------------------------

function getCursorForHandle(handle: HandleDirection): string {
  switch (handle) {
    case "nw": case "se": return "nwse-resize";
    case "ne": case "sw": return "nesw-resize";
    case "n": case "s": return "ns-resize";
    case "e": case "w": return "ew-resize";
    case "rotation": return "crosshair";
    default: return "default";
  }
}
