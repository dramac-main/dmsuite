// =============================================================================
// DMSuite — Editor Store (vNext DesignDocumentV2)
// Zustand store that owns the canonical document state, command stack,
// selection, interaction mode, and AI revision state.
// =============================================================================

import { create } from "zustand";
import type {
  DesignDocumentV2, LayerV2, LayerId,
} from "@/lib/editor/schema";
import {
  createDocumentV2, addLayer, removeLayer, updateLayer,
  reorderLayerV2, duplicateLayerV2,
} from "@/lib/editor/schema";
import type { Command, CommandStackState } from "@/lib/editor/commands";
import { createCommandStack, executeCommand, undo, redo, canUndo, canRedo } from "@/lib/editor/commands";
import type { PatchOp, EditIntent, RevisionScope, PatchResult } from "@/lib/editor/ai-patch";
import { validateAndApplyPatch, processIntent } from "@/lib/editor/ai-patch";

// ---------------------------------------------------------------------------
// Interaction Mode
// ---------------------------------------------------------------------------

export type InteractionMode =
  | "select"
  | "hand"         // pan
  | "text"         // click to add text
  | "shape"        // draw shape
  | "draw"         // freehand path
  | "zoom";

export type DragState =
  | { kind: "idle" }
  | { kind: "move"; layerIds: LayerId[]; startX: number; startY: number; origPositions: Array<{ id: LayerId; x: number; y: number }> }
  | { kind: "resize"; layerId: LayerId; handle: string; startX: number; startY: number; origTransform: { x: number; y: number; w: number; h: number } }
  | { kind: "rotate"; layerId: LayerId; startAngle: number; origRotation: number }
  | { kind: "draw-shape"; shapeType: string; startX: number; startY: number }
  | { kind: "marquee"; startX: number; startY: number; currentX: number; currentY: number }
  | { kind: "pan"; startX: number; startY: number; origOffset: { x: number; y: number } };

// ---------------------------------------------------------------------------
// Viewport State
// ---------------------------------------------------------------------------

export interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  showGrid: boolean;
  showGuides: boolean;
  showBleedSafe: boolean;
  snapEnabled: boolean;
}

// ---------------------------------------------------------------------------
// AI State
// ---------------------------------------------------------------------------

export interface AIRevisionState {
  /** Whether AI revision is running */
  isProcessing: boolean;
  /** Last AI result */
  lastResult: PatchResult | null;
  /** Revision scope */
  scope: RevisionScope;
}

// ---------------------------------------------------------------------------
// Store Type
// ---------------------------------------------------------------------------

interface EditorState {
  // ---- Document ----
  doc: DesignDocumentV2;
  setDoc: (doc: DesignDocumentV2) => void;
  resetDoc: (opts?: { width?: number; height?: number; name?: string }) => void;

  // ---- Command Stack ----
  commandStack: CommandStackState;
  execute: (cmd: Command) => void;
  undoCmd: () => void;
  redoCmd: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // ---- Selection ----
  selectLayers: (ids: LayerId[], additive?: boolean) => void;
  deselectAll: () => void;
  selectedLayerIds: () => LayerId[];

  // ---- Layer CRUD (go through command stack) ----
  addLayerToDoc: (layer: LayerV2, parentId?: LayerId) => void;
  removeLayersFromDoc: (ids: LayerId[]) => void;
  updateLayerInDoc: (id: LayerId, partial: Partial<LayerV2>) => void;
  reorderLayerInDoc: (id: LayerId, direction: "up" | "down" | "top" | "bottom") => void;
  duplicateLayerInDoc: (id: LayerId) => void;

  // ---- Interaction ----
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
  drag: DragState;
  setDrag: (drag: DragState) => void;

  // ---- Viewport ----
  viewport: ViewportState;
  setViewport: (v: Partial<ViewportState>) => void;
  zoomTo: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToCanvas: (canvasWidth: number, canvasHeight: number) => void;

  // ---- AI ----
  ai: AIRevisionState;
  applyAIPatch: (ops: PatchOp[], scope?: RevisionScope) => PatchResult;
  applyAIIntent: (intent: EditIntent, scope?: RevisionScope) => PatchResult;
  setAIScope: (scope: RevisionScope) => void;
  setAIProcessing: (p: boolean) => void;

  // ---- Locked Properties ----
  lockedPaths: Map<LayerId, string[]>;
  lockPath: (layerId: LayerId, path: string) => void;
  unlockPath: (layerId: LayerId, path: string) => void;
  toggleLock: (layerId: LayerId, path: string) => void;
  isPathLocked: (layerId: LayerId, path: string) => boolean;

  // ---- Clipboard ----
  clipboardLayers: LayerV2[];
  copySelection: () => void;
  pasteClipboard: () => void;
  cutSelection: () => void;
}

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

export const useEditorStore = create<EditorState>()((set, get) => ({
  // ---- Document ----
  doc: createDocumentV2({ toolId: "default", name: "Untitled", width: 800, height: 600 }),
  setDoc: (doc) => set({ doc, commandStack: createCommandStack(doc) }),
  resetDoc: (opts) => {
    const newDoc = createDocumentV2({
      toolId: "default",
      name: opts?.name ?? "Untitled",
      width: opts?.width ?? 800,
      height: opts?.height ?? 600,
    });
    set({ doc: newDoc, commandStack: createCommandStack(newDoc) });
  },

  // ---- Command Stack ----
  commandStack: createCommandStack(createDocumentV2({ toolId: "default", name: "Untitled", width: 800, height: 600 })),

  execute: (cmd) => {
    const state = get();
    const newDoc = cmd.execute(state.doc);
    const newStack = executeCommand(state.commandStack, cmd);
    set({ doc: newDoc, commandStack: newStack });
  },

  undoCmd: () => {
    const state = get();
    if (!canUndo(state.commandStack)) return;
    const newStack = undo(state.commandStack);
    set({ doc: newStack.document, commandStack: newStack });
  },

  redoCmd: () => {
    const state = get();
    if (!canRedo(state.commandStack)) return;
    const newStack = redo(state.commandStack);
    set({ doc: newStack.document, commandStack: newStack });
  },

  canUndo: () => canUndo(get().commandStack),
  canRedo: () => canRedo(get().commandStack),

  // ---- Selection ----
  selectLayers: (ids, additive = false) => set((state) => ({
    doc: {
      ...state.doc,
      selection: {
        ...state.doc.selection,
        ids: additive
          ? [...new Set([...state.doc.selection.ids, ...ids])]
          : ids,
      },
    },
  })),

  deselectAll: () => set((state) => ({
    doc: {
      ...state.doc,
      selection: { ...state.doc.selection, ids: [] },
    },
  })),

  selectedLayerIds: () => get().doc.selection.ids,

  // ---- Layer CRUD ----
  addLayerToDoc: (layer, parentId) => {
    const state = get();
    const newDoc = addLayer(state.doc, layer, parentId);
    set({ doc: newDoc });
  },

  removeLayersFromDoc: (ids) => {
    const state = get();
    let newDoc = state.doc;
    for (const id of ids) {
      newDoc = removeLayer(newDoc, id);
    }
    set({ doc: newDoc });
  },

  updateLayerInDoc: (id, partial) => {
    const state = get();
    const newDoc = updateLayer(state.doc, id, partial);
    set({ doc: newDoc });
  },

  reorderLayerInDoc: (id, direction) => {
    const state = get();
    const newDoc = reorderLayerV2(state.doc, id, direction);
    set({ doc: newDoc });
  },

  duplicateLayerInDoc: (id) => {
    const state = get();
    const newDoc = duplicateLayerV2(state.doc, id);
    set({ doc: newDoc });
  },

  // ---- Interaction ----
  mode: "select" as InteractionMode,
  setMode: (mode) => set({ mode }),
  drag: { kind: "idle" } as DragState,
  setDrag: (drag) => set({ drag }),

  // ---- Viewport ----
  viewport: {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    showGrid: false,
    showGuides: true,
    showBleedSafe: false,
    snapEnabled: true,
  },

  setViewport: (v) => set((state) => ({
    viewport: { ...state.viewport, ...v },
  })),

  zoomTo: (z) => set((state) => ({
    viewport: { ...state.viewport, zoom: Math.max(0.1, Math.min(10, z)) },
  })),

  zoomIn: () => set((state) => ({
    viewport: { ...state.viewport, zoom: Math.min(10, state.viewport.zoom * 1.25) },
  })),

  zoomOut: () => set((state) => ({
    viewport: { ...state.viewport, zoom: Math.max(0.1, state.viewport.zoom / 1.25) },
  })),

  fitToCanvas: (containerW, containerH) => {
    const state = get();
    const rootFrame = state.doc.layersById[state.doc.rootFrameId];
    if (!rootFrame) return;
    const { size } = rootFrame.transform;
    const padding = 60;
    const scaleX = (containerW - padding * 2) / size.x;
    const scaleY = (containerH - padding * 2) / size.y;
    const zoom = Math.min(scaleX, scaleY, 2); // Cap at 200%
    set({
      viewport: {
        ...state.viewport,
        zoom,
        offsetX: (containerW - size.x * zoom) / 2,
        offsetY: (containerH - size.y * zoom) / 2,
      },
    });
  },

  // ---- AI ----
  ai: {
    isProcessing: false,
    lastResult: null,
    scope: "full-redesign" as RevisionScope,
  },

  applyAIPatch: (ops, scope) => {
    const state = get();
    const s = scope ?? state.ai.scope;
    const result = validateAndApplyPatch(
      state.doc, ops, s, state.lockedPaths, "AI Patch"
    );
    if (result.success && result.command) {
      const newDoc = result.command.execute(state.doc);
      const newStack = executeCommand(state.commandStack, result.command);
      set({
        doc: newDoc,
        commandStack: newStack,
        ai: { ...state.ai, lastResult: result, isProcessing: false },
      });
    } else {
      set({ ai: { ...state.ai, lastResult: result, isProcessing: false } });
    }
    return result;
  },

  applyAIIntent: (intent, scope) => {
    const state = get();
    const s = scope ?? state.ai.scope;
    const result = processIntent(state.doc, intent, s, state.lockedPaths);
    if (result.success && result.command) {
      const newDoc = result.command.execute(state.doc);
      const newStack = executeCommand(state.commandStack, result.command);
      set({
        doc: newDoc,
        commandStack: newStack,
        ai: { ...state.ai, lastResult: result, isProcessing: false },
      });
    } else {
      set({ ai: { ...state.ai, lastResult: result, isProcessing: false } });
    }
    return result;
  },

  setAIScope: (scope) => set((state) => ({
    ai: { ...state.ai, scope },
  })),

  setAIProcessing: (p) => set((state) => ({
    ai: { ...state.ai, isProcessing: p },
  })),

  // ---- Locked Properties ----
  lockedPaths: new Map(),

  lockPath: (layerId, path) => set((state) => {
    const m = new Map(state.lockedPaths);
    const existing = m.get(layerId) ?? [];
    if (!existing.includes(path)) {
      m.set(layerId, [...existing, path]);
    }
    return { lockedPaths: m };
  }),

  unlockPath: (layerId, path) => set((state) => {
    const m = new Map(state.lockedPaths);
    const existing = m.get(layerId) ?? [];
    m.set(layerId, existing.filter(p => p !== path));
    return { lockedPaths: m };
  }),

  toggleLock: (layerId, path) => {
    if (get().isPathLocked(layerId, path)) {
      get().unlockPath(layerId, path);
    } else {
      get().lockPath(layerId, path);
    }
  },

  isPathLocked: (layerId, path) => {
    const locks = get().lockedPaths.get(layerId) ?? [];
    return locks.includes(path);
  },

  // ---- Clipboard ----
  clipboardLayers: [],

  copySelection: () => {
    const state = get();
    const layers = state.doc.selection.ids
      .map(id => state.doc.layersById[id])
      .filter(Boolean);
    set({ clipboardLayers: JSON.parse(JSON.stringify(layers)) });
  },

  pasteClipboard: () => {
    const state = get();
    if (state.clipboardLayers.length === 0) return;
    let doc = state.doc;
    const newIds: LayerId[] = [];
    for (const layer of state.clipboardLayers) {
      const clone = JSON.parse(JSON.stringify(layer)) as LayerV2;
      clone.id = `${clone.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` as LayerId;
      clone.name = `${clone.name} copy`;
      // Offset to make paste visible
      clone.transform = {
        ...clone.transform,
        position: {
          x: clone.transform.position.x + 20,
          y: clone.transform.position.y + 20,
        },
      };
      doc = addLayer(doc, clone);
      newIds.push(clone.id);
    }
    set({
      doc: { ...doc, selection: { ...doc.selection, ids: newIds } },
    });
  },

  cutSelection: () => {
    const state = get();
    state.copySelection();
    state.removeLayersFromDoc(state.doc.selection.ids);
  },
}));
