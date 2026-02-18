// =============================================================================
// DMSuite — Command Stack (Undo/Redo)
// Every document mutation (user edit, AI patch, drag, resize) is wrapped as a
// Command. This gives deterministic undo/redo, AI-safe edits, and coalescing
// for continuous operations (drag, slider).
// =============================================================================

import type { DesignDocumentV2 } from "./schema";

// ---------------------------------------------------------------------------
// Command interface
// ---------------------------------------------------------------------------

export interface Command {
  /** Human-readable description (shown in history panel) */
  label: string;
  /** Category for grouping / coalescing */
  category: "user" | "ai" | "system";
  /** Coalesce key: consecutive commands with the same key merge into one */
  coalesceKey?: string;
  /** Forward apply — produces a new document */
  execute(doc: DesignDocumentV2): DesignDocumentV2;
  /** Reverse — restores the previous document */
  undo(doc: DesignDocumentV2): DesignDocumentV2;
}

// ---------------------------------------------------------------------------
// Command Stack
// ---------------------------------------------------------------------------

export interface CommandStackState {
  /** The current document (after all applied commands) */
  document: DesignDocumentV2;
  /** Undo stack (most recent at end) */
  undoStack: CommandEntry[];
  /** Redo stack (most recent at end) */
  redoStack: CommandEntry[];
  /** Maximum undo depth */
  maxDepth: number;
}

export interface CommandEntry {
  command: Command;
  /** Snapshot BEFORE this command was applied (for reliable undo) */
  snapshotBefore: DesignDocumentV2;
}

/** Create an empty command stack for a document */
export function createCommandStack(doc: DesignDocumentV2, maxDepth = 100): CommandStackState {
  return {
    document: doc,
    undoStack: [],
    redoStack: [],
    maxDepth,
  };
}

/** Execute a command, push onto undo stack, clear redo */
export function executeCommand(state: CommandStackState, cmd: Command): CommandStackState {
  const snapshotBefore = state.document;
  const newDoc = cmd.execute(state.document);

  // Coalesce: if top of undo stack has the same coalesceKey, replace it
  if (cmd.coalesceKey && state.undoStack.length > 0) {
    const top = state.undoStack[state.undoStack.length - 1];
    if (top.command.coalesceKey === cmd.coalesceKey) {
      // Keep the ORIGINAL snapshotBefore from the first coalesced command
      const newUndoStack = [...state.undoStack];
      newUndoStack[newUndoStack.length - 1] = {
        command: cmd,
        snapshotBefore: top.snapshotBefore,
      };
      return {
        ...state,
        document: newDoc,
        undoStack: newUndoStack,
        redoStack: [], // clear redo on new edit
      };
    }
  }

  const newUndoStack = [...state.undoStack, { command: cmd, snapshotBefore }];
  // Trim if over max depth
  if (newUndoStack.length > state.maxDepth) {
    newUndoStack.shift();
  }

  return {
    ...state,
    document: newDoc,
    undoStack: newUndoStack,
    redoStack: [], // clear redo on new edit
  };
}

/** Undo the last command */
export function undo(state: CommandStackState): CommandStackState {
  if (state.undoStack.length === 0) return state;

  const entry = state.undoStack[state.undoStack.length - 1];
  const newUndoStack = state.undoStack.slice(0, -1);

  return {
    ...state,
    document: entry.snapshotBefore,
    undoStack: newUndoStack,
    redoStack: [...state.redoStack, {
      command: entry.command,
      snapshotBefore: state.document,
    }],
  };
}

/** Redo the last undone command */
export function redo(state: CommandStackState): CommandStackState {
  if (state.redoStack.length === 0) return state;

  const entry = state.redoStack[state.redoStack.length - 1];
  const newRedoStack = state.redoStack.slice(0, -1);
  const newDoc = entry.command.execute(state.document);

  return {
    ...state,
    document: newDoc,
    undoStack: [...state.undoStack, {
      command: entry.command,
      snapshotBefore: state.document,
    }],
    redoStack: newRedoStack,
  };
}

/** Check if undo is available */
export function canUndo(state: CommandStackState): boolean {
  return state.undoStack.length > 0;
}

/** Check if redo is available */
export function canRedo(state: CommandStackState): boolean {
  return state.redoStack.length > 0;
}

/** Get undo/redo history labels for UI */
export function getHistory(state: CommandStackState): {
  undoLabels: string[];
  redoLabels: string[];
} {
  return {
    undoLabels: state.undoStack.map(e => e.command.label),
    redoLabels: state.redoStack.map(e => e.command.label).reverse(),
  };
}

// ---------------------------------------------------------------------------
// Pre-built Commands (common operations)
// ---------------------------------------------------------------------------

import {
  updateLayer,
  addLayer,
  removeLayer,
  reorderLayerV2,
  duplicateLayerV2,
  type LayerV2,
  type LayerId,

} from "./schema";

/** Move layer(s) by delta — coalesceable */
export function createMoveCommand(layerIds: LayerId[], dx: number, dy: number): Command {
  return {
    label: `Move ${layerIds.length} layer(s)`,
    category: "user",
    coalesceKey: `move-${layerIds.sort().join(",")}`,
    execute(doc) {
      let d = doc;
      for (const id of layerIds) {
        const layer = d.layersById[id];
        if (!layer) continue;
        d = updateLayer(d, id, {
          transform: {
            ...layer.transform,
            position: {
              x: layer.transform.position.x + dx,
              y: layer.transform.position.y + dy,
            },
          },
        } as Partial<LayerV2>);
      }
      return d;
    },
    undo(doc) {
      let d = doc;
      for (const id of layerIds) {
        const layer = d.layersById[id];
        if (!layer) continue;
        d = updateLayer(d, id, {
          transform: {
            ...layer.transform,
            position: {
              x: layer.transform.position.x - dx,
              y: layer.transform.position.y - dy,
            },
          },
        } as Partial<LayerV2>);
      }
      return d;
    },
  };
}

/** Resize layer — coalesceable */
export function createResizeCommand(
  layerId: LayerId,
  newX: number, newY: number,
  newW: number, newH: number,
  prevX: number, prevY: number,
  prevW: number, prevH: number
): Command {
  return {
    label: "Resize layer",
    category: "user",
    coalesceKey: `resize-${layerId}`,
    execute(doc) {
      const layer = doc.layersById[layerId];
      if (!layer) return doc;
      return updateLayer(doc, layerId, {
        transform: {
          ...layer.transform,
          position: { x: newX, y: newY },
          size: { x: newW, y: newH },
        },
      } as Partial<LayerV2>);
    },
    undo(doc) {
      const layer = doc.layersById[layerId];
      if (!layer) return doc;
      return updateLayer(doc, layerId, {
        transform: {
          ...layer.transform,
          position: { x: prevX, y: prevY },
          size: { x: prevW, y: prevH },
        },
      } as Partial<LayerV2>);
    },
  };
}

/** Update any layer property */
export function createUpdateCommand(
  layerId: LayerId,
  changes: Partial<LayerV2>,
  label = "Update layer"
): Command {
  let previousState: Partial<LayerV2> | null = null;

  return {
    label,
    category: "user",
    execute(doc) {
      const layer = doc.layersById[layerId];
      if (!layer) return doc;
      // Capture previous values for the changed keys
      previousState = {} as Record<string, unknown>;
      for (const key of Object.keys(changes)) {
        (previousState as Record<string, unknown>)[key] = (layer as unknown as Record<string, unknown>)[key];
      }
      return updateLayer(doc, layerId, changes);
    },
    undo(doc) {
      if (!previousState) return doc;
      return updateLayer(doc, layerId, previousState);
    },
  };
}

/** Add a new layer */
export function createAddLayerCommand(
  layer: LayerV2,
  parentId?: LayerId,
  label = "Add layer"
): Command {
  return {
    label,
    category: "user",
    execute(doc) {
      return addLayer(doc, layer, parentId);
    },
    undo(doc) {
      return removeLayer(doc, layer.id);
    },
  };
}

/** Delete layer(s) */
export function createDeleteCommand(layerIds: LayerId[]): Command {
  const snapshots: Record<LayerId, LayerV2> = {};

  return {
    label: `Delete ${layerIds.length} layer(s)`,
    category: "user",
    execute(doc) {
      // Capture layers before deletion
      for (const id of layerIds) {
        if (doc.layersById[id]) snapshots[id] = JSON.parse(JSON.stringify(doc.layersById[id]));
      }
      let d = doc;
      for (const id of layerIds) {
        d = removeLayer(d, id);
      }
      return d;
    },
    undo(doc) {
      let d = doc;
      for (const id of layerIds) {
        if (snapshots[id]) {
          d = addLayer(d, snapshots[id], snapshots[id].parentId ?? undefined);
        }
      }
      return d;
    },
  };
}

/** Reorder layer */
export function createReorderCommand(
  layerId: LayerId,
  direction: "up" | "down" | "top" | "bottom"
): Command {
  const reverseDir: Record<string, "up" | "down" | "top" | "bottom"> = {
    up: "down", down: "up", top: "bottom", bottom: "top",
  };
  return {
    label: `Move layer ${direction}`,
    category: "user",
    execute(doc) { return reorderLayerV2(doc, layerId, direction); },
    undo(doc) { return reorderLayerV2(doc, layerId, reverseDir[direction]); },
  };
}

/** Duplicate layer */
export function createDuplicateCommand(layerId: LayerId): Command {
  let newLayerId: LayerId | null = null;

  return {
    label: "Duplicate layer",
    category: "user",
    execute(doc) {
      const newDoc = duplicateLayerV2(doc, layerId);
      // Find the new layer ID (the first selected one that wasn't in the original)
      newLayerId = newDoc.selection.primaryId;
      return newDoc;
    },
    undo(doc) {
      if (!newLayerId) return doc;
      return removeLayer(doc, newLayerId);
    },
  };
}

/** Batch command — wraps multiple commands into one undoable action */
export function createBatchCommand(commands: Command[], label = "Batch edit"): Command {
  return {
    label,
    category: "user",
    execute(doc) {
      let d = doc;
      for (const cmd of commands) {
        d = cmd.execute(d);
      }
      return d;
    },
    undo(doc) {
      let d = doc;
      for (let i = commands.length - 1; i >= 0; i--) {
        d = commands[i].undo(d);
      }
      return d;
    },
  };
}
