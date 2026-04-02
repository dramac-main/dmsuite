/* ─────────────────────────────────────────────────────────────
   Sketch Board — Zustand Store  (V3)
   Camera & grid are top-level view state (NOT inside doc).
   Only doc mutations are tracked by undo/redo (temporal).
   ───────────────────────────────────────────────────────────── */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import type {
  SketchTool,
  SketchElement,
  ElementStyle,
  Camera,
  GridConfig,
  Point,
  SketchBoardDocument,
  DrawElement,
  EraserElement,
  ShapeElement,
  LineElement,
  ArrowElement,
  TextElement,
  StickyElement,
  ImageElement,
  FillStyle,
  DashStyle,
  ArrowHead,
  SketchFont,
  TextAlign,
} from "@/types/sketch-board";

// ── Defaults ──────────────────────────────────────────────────

const DEFAULT_STYLE: ElementStyle = {
  strokeColor: "#1e1e1e",
  fillColor: "transparent",
  fillStyle: "none",
  strokeWidth: 2,
  dashStyle: "solid",
  opacity: 1,
  fontSize: 20,
  fontFamily: "hand",
  textAlign: "left",
};

const DEFAULT_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

const DEFAULT_GRID: GridConfig = {
  enabled: false,
  size: 20,
  snap: false,
};

const DEFAULT_DOC: SketchBoardDocument = {
  title: "Untitled Board",
  background: "white",
  elements: [],
};

// ── Sticky note color palette ─────────────────────────────────
export const STICKY_COLORS = [
  "#fef08a", // yellow
  "#86efac", // green
  "#93c5fd", // blue
  "#fca5a5", // red
  "#c4b5fd", // purple
  "#fdba74", // orange
  "#f9a8d4", // pink
  "#a5f3fc", // cyan
];

// ── Stroke color palette ──────────────────────────────────────
export const STROKE_COLORS = [
  "#1e1e1e", // black
  "#e03131", // red
  "#2f9e44", // green
  "#1971c2", // blue
  "#f08c00", // orange
  "#7048e8", // purple
  "#0c8599", // teal
  "#868e96", // gray
];

// ── Fill color palette ────────────────────────────────────────
export const FILL_COLORS = [
  "transparent",
  "#ffe3e3", // light red
  "#d3f9d8", // light green
  "#d0ebff", // light blue
  "#fff3bf", // light yellow
  "#e5dbff", // light purple
  "#fff4e6", // light orange
  "#e3fafc", // light teal
];

// ── Background presets ────────────────────────────────────────
export const BACKGROUND_PRESETS = [
  { id: "white", label: "White", value: "#ffffff" },
  { id: "light-gray", label: "Light Gray", value: "#f8f9fa" },
  { id: "warm", label: "Warm", value: "#fff8f0" },
  { id: "dark", label: "Dark", value: "#1a1b1e" },
  { id: "blueprint", label: "Blueprint", value: "#1e3a5f" },
  { id: "paper", label: "Paper", value: "#fdf6e3" },
];

// ── Helper: generate unique ID ────────────────────────────────
let idCounter = 0;
function genId(): string {
  idCounter += 1;
  return `el_${Date.now()}_${idCounter}`;
}

// ── Store Interface ───────────────────────────────────────────

interface SketchBoardState {
  /** The document (only this is tracked by undo/redo) */
  doc: SketchBoardDocument;
  /** Camera / viewport — NOT tracked by undo */
  camera: Camera;
  /** Grid config — NOT tracked by undo */
  grid: GridConfig;
  /** Currently active tool */
  activeTool: SketchTool;
  /** Current style for new elements */
  currentStyle: ElementStyle;
  /** Selected element IDs */
  selectedIds: string[];
  /** Whether user is currently drawing/dragging */
  isDrawing: boolean;

  // ── Document Actions ──
  setDoc: (doc: SketchBoardDocument) => void;
  resetDoc: () => void;
  setTitle: (title: string) => void;
  setBackground: (bg: string) => void;

  // ── Tool Actions ──
  setActiveTool: (tool: SketchTool) => void;
  setCurrentStyle: (style: Partial<ElementStyle>) => void;

  // ── Element CRUD ──
  addElement: (el: SketchElement) => void;
  updateElement: (id: string, patch: Partial<SketchElement>) => void;
  removeElements: (ids: string[]) => void;
  clearAll: () => void;

  // ── Selection ──
  setSelectedIds: (ids: string[]) => void;
  selectAll: () => void;
  deselectAll: () => void;

  // ── Drawing State ──
  setIsDrawing: (v: boolean) => void;

  // ── Z-ordering ──
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  // ── Camera (NOT undoable) ──
  setCamera: (camera: Camera) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToContent: () => void;

  // ── Grid (NOT undoable) ──
  setGrid: (grid: Partial<GridConfig>) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;

  // ── Clipboard ──
  duplicateSelected: () => void;

  // ── High-Level Helpers ──
  addRectangle: (x: number, y: number, w: number, h: number) => string;
  addEllipse: (x: number, y: number, w: number, h: number) => string;
  addDiamond: (x: number, y: number, w: number, h: number) => string;
  addTriangle: (x: number, y: number, w: number, h: number) => string;
  addLine: (x1: number, y1: number, x2: number, y2: number) => string;
  addArrow: (x1: number, y1: number, x2: number, y2: number) => string;
  addText: (x: number, y: number, text: string) => string;
  addSticky: (x: number, y: number, text: string, color?: string) => string;
  addFreehand: (points: Point[]) => string;
  lockElement: (id: string, locked: boolean) => void;
  setElementStyle: (id: string, style: Partial<ElementStyle>) => void;
  moveElement: (id: string, dx: number, dy: number) => void;
  resizeElement: (id: string, w: number, h: number) => void;
  rotateElement: (id: string, angle: number) => void;
  updateText: (id: string, text: string) => void;
}

// ── Store ─────────────────────────────────────────────────────

export const useSketchBoardEditor = create<SketchBoardState>()(
  temporal(
    persist(
      immer((set, get) => ({
        doc: { ...DEFAULT_DOC },
        camera: { ...DEFAULT_CAMERA },
        grid: { ...DEFAULT_GRID },
        activeTool: "select" as SketchTool,
        currentStyle: { ...DEFAULT_STYLE },
        selectedIds: [] as string[],
        isDrawing: false,

        // ── Document Actions ──
        setDoc: (doc) => set({ doc }),
        resetDoc: () =>
          set({
            doc: { ...DEFAULT_DOC, elements: [] },
            camera: { ...DEFAULT_CAMERA },
            grid: { ...DEFAULT_GRID },
            selectedIds: [],
            activeTool: "select",
          }),
        setTitle: (title) =>
          set((s) => {
            s.doc.title = title;
          }),
        setBackground: (bg) =>
          set((s) => {
            s.doc.background = bg;
          }),

        // ── Tool ──
        setActiveTool: (tool) => set({ activeTool: tool }),
        setCurrentStyle: (style) =>
          set((s) => {
            Object.assign(s.currentStyle, style);
          }),

        // ── Element CRUD ──
        addElement: (el) =>
          set((s) => {
            s.doc.elements.push(el);
          }),
        updateElement: (id, patch) =>
          set((s) => {
            const el = s.doc.elements.find((e: SketchElement) => e.id === id);
            if (el) Object.assign(el, patch);
          }),
        removeElements: (ids) =>
          set((s) => {
            s.doc.elements = s.doc.elements.filter(
              (e: SketchElement) => !ids.includes(e.id)
            );
            s.selectedIds = s.selectedIds.filter(
              (sid: string) => !ids.includes(sid)
            );
          }),
        clearAll: () =>
          set((s) => {
            s.doc.elements = [];
            s.selectedIds = [];
          }),

        // ── Selection ──
        setSelectedIds: (ids) => set({ selectedIds: ids }),
        selectAll: () =>
          set((s) => ({
            selectedIds: s.doc.elements.map((e: SketchElement) => e.id),
          })),
        deselectAll: () => set({ selectedIds: [] }),

        // ── Drawing ──
        setIsDrawing: (v) => set({ isDrawing: v }),

        // ── Z-ordering ──
        bringToFront: (id) =>
          set((s) => {
            const maxZ = Math.max(
              ...s.doc.elements.map((e: SketchElement) => e.zIndex),
              0
            );
            const el = s.doc.elements.find((e: SketchElement) => e.id === id);
            if (el) el.zIndex = maxZ + 1;
          }),
        sendToBack: (id) =>
          set((s) => {
            const minZ = Math.min(
              ...s.doc.elements.map((e: SketchElement) => e.zIndex),
              0
            );
            const el = s.doc.elements.find((e: SketchElement) => e.id === id);
            if (el) el.zIndex = minZ - 1;
          }),
        bringForward: (id) =>
          set((s) => {
            const el = s.doc.elements.find((e: SketchElement) => e.id === id);
            if (el) el.zIndex += 1;
          }),
        sendBackward: (id) =>
          set((s) => {
            const el = s.doc.elements.find((e: SketchElement) => e.id === id);
            if (el) el.zIndex -= 1;
          }),

        // ── Camera (top-level — NOT tracked by undo) ──
        setCamera: (camera) => set({ camera }),
        zoomIn: () =>
          set((s) => {
            s.camera.zoom = Math.min(s.camera.zoom * 1.25, 8);
          }),
        zoomOut: () =>
          set((s) => {
            s.camera.zoom = Math.max(s.camera.zoom / 1.25, 0.1);
          }),
        resetZoom: () => set({ camera: { x: 0, y: 0, zoom: 1 } }),
        fitToContent: () =>
          set((s) => {
            const elems = s.doc.elements;
            if (elems.length === 0) {
              s.camera = { x: 0, y: 0, zoom: 1 };
              return;
            }
            let minX = Infinity,
              minY = Infinity,
              maxX = -Infinity,
              maxY = -Infinity;
            for (const e of elems) {
              const el = e as SketchElement;
              minX = Math.min(minX, el.x);
              minY = Math.min(minY, el.y);
              maxX = Math.max(maxX, el.x + el.width);
              maxY = Math.max(maxY, el.y + el.height);
            }
            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;
            s.camera = { x: -cx + 500, y: -cy + 350, zoom: 1 };
          }),

        // ── Grid (top-level — NOT tracked by undo) ──
        setGrid: (grid) =>
          set((s) => {
            Object.assign(s.grid, grid);
          }),
        toggleGrid: () =>
          set((s) => {
            s.grid.enabled = !s.grid.enabled;
          }),
        toggleSnap: () =>
          set((s) => {
            s.grid.snap = !s.grid.snap;
          }),

        // ── Clipboard ──
        duplicateSelected: () =>
          set((s) => {
            const selected = s.doc.elements.filter((e: SketchElement) =>
              s.selectedIds.includes(e.id)
            );
            const newIds: string[] = [];
            for (const orig of selected) {
              const clone = JSON.parse(JSON.stringify(orig)) as SketchElement;
              clone.id = genId();
              clone.x += 20;
              clone.y += 20;
              s.doc.elements.push(clone);
              newIds.push(clone.id);
            }
            s.selectedIds = newIds;
          }),

        // ── High-Level Helpers ──
        addRectangle: (x, y, w, h) => {
          const id = genId();
          const style = get().currentStyle;
          const maxZ = Math.max(
            ...get().doc.elements.map((e) => e.zIndex),
            0
          );
          const el: ShapeElement = {
            id,
            type: "rectangle",
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            style: { ...style },
            locked: false,
            zIndex: maxZ + 1,
          };
          set((s) => {
            s.doc.elements.push(el as never);
          });
          return id;
        },
        addEllipse: (x, y, w, h) => {
          const id = genId();
          const style = get().currentStyle;
          const maxZ = Math.max(
            ...get().doc.elements.map((e) => e.zIndex),
            0
          );
          const el: ShapeElement = {
            id,
            type: "ellipse",
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            style: { ...style },
            locked: false,
            zIndex: maxZ + 1,
          };
          set((s) => {
            s.doc.elements.push(el as never);
          });
          return id;
        },
        addDiamond: (x, y, w, h) => {
          const id = genId();
          const style = get().currentStyle;
          const maxZ = Math.max(
            ...get().doc.elements.map((e) => e.zIndex),
            0
          );
          const el: ShapeElement = {
            id,
            type: "diamond",
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            style: { ...style },
            locked: false,
            zIndex: maxZ + 1,
          };
          set((s) => {
            s.doc.elements.push(el as never);
          });
          return id;
        },
        addTriangle: (x, y, w, h) => {
          const id = genId();
          const style = get().currentStyle;
          const maxZ = Math.max(
            ...get().doc.elements.map((e) => e.zIndex),
            0
          );
          const el: ShapeElement = {
            id,
            type: "triangle",
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            style: { ...style },
            locked: false,
            zIndex: maxZ + 1,
          };
          set((s) => {
            s.doc.elements.push(el as never);
          });
          return id;
        },
        addLine: (x1, y1, x2, y2) => {
          const id = genId();
          const style = get().currentStyle;
          const maxZ = Math.max(
            ...get().doc.elements.map((e) => e.zIndex),
            0
          );
          const el: LineElement = {
            id,
            type: "line",
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
            rotation: 0,
            style: { ...style },
            locked: false,
            zIndex: maxZ + 1,
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
          };
          set((s) => {
            s.doc.elements.push(el as never);
          });
          return id;
        },
        addArrow: (x1, y1, x2, y2) => {
          const id = genId();
          const style = get().currentStyle;
          const maxZ = Math.max(
            ...get().doc.elements.map((e) => e.zIndex),
            0
          );
          const el: ArrowElement = {
            id,
            type: "arrow",
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
            rotation: 0,
            style: { ...style },
            locked: false,
            zIndex: maxZ + 1,
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
            startHead: "none",
            endHead: "arrow",
          };
          set((s) => {
            s.doc.elements.push(el as never);
          });
          return id;
        },
        addText: (x, y, text) => {
          const id = genId();
          const style = get().currentStyle;
          const maxZ = Math.max(
            ...get().doc.elements.map((e) => e.zIndex),
            0
          );
          const el: TextElement = {
            id,
            type: "text",
            x,
            y,
            width: 200,
            height: 40,
            rotation: 0,
            style: { ...style },
            locked: false,
            zIndex: maxZ + 1,
            text,
          };
          set((s) => {
            s.doc.elements.push(el as never);
          });
          return id;
        },
        addSticky: (x, y, text, color) => {
          const id = genId();
          const style = get().currentStyle;
          const maxZ = Math.max(
            ...get().doc.elements.map((e) => e.zIndex),
            0
          );
          const el: StickyElement = {
            id,
            type: "sticky",
            x,
            y,
            width: 200,
            height: 200,
            rotation: 0,
            style: { ...style },
            locked: false,
            zIndex: maxZ + 1,
            text,
            stickyColor: color ?? STICKY_COLORS[0],
          };
          set((s) => {
            s.doc.elements.push(el as never);
          });
          return id;
        },
        addFreehand: (points) => {
          const id = genId();
          const style = get().currentStyle;
          const maxZ = Math.max(
            ...get().doc.elements.map((e) => e.zIndex),
            0
          );
          if (points.length === 0) return id;
          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          }
          const el: DrawElement = {
            id,
            type: "draw",
            x: minX,
            y: minY,
            width: maxX - minX || 1,
            height: maxY - minY || 1,
            rotation: 0,
            style: { ...style },
            locked: false,
            zIndex: maxZ + 1,
            points,
          };
          set((s) => {
            s.doc.elements.push(el as never);
          });
          return id;
        },
        lockElement: (id, locked) =>
          set((s) => {
            const el = s.doc.elements.find((e: SketchElement) => e.id === id);
            if (el) el.locked = locked;
          }),
        setElementStyle: (id, style) =>
          set((s) => {
            const el = s.doc.elements.find((e: SketchElement) => e.id === id);
            if (el) Object.assign(el.style, style);
          }),
        moveElement: (id, dx, dy) =>
          set((s) => {
            const el = s.doc.elements.find((e: SketchElement) => e.id === id);
            if (el && !el.locked) {
              el.x += dx;
              el.y += dy;
            }
          }),
        resizeElement: (id, w, h) =>
          set((s) => {
            const el = s.doc.elements.find((e: SketchElement) => e.id === id);
            if (el && !el.locked) {
              el.width = w;
              el.height = h;
            }
          }),
        rotateElement: (id, angle) =>
          set((s) => {
            const el = s.doc.elements.find((e: SketchElement) => e.id === id);
            if (el && !el.locked) {
              el.rotation = angle;
            }
          }),
        updateText: (id, text) =>
          set((s) => {
            const el = s.doc.elements.find((e: SketchElement) => e.id === id);
            if (el && "text" in el) {
              (el as TextElement | StickyElement).text = text;
            }
          }),
      })),
      {
        name: "dmsuite-sketch-board",
        version: 2,
        migrate: (persisted: unknown, version: number) => {
          const s = persisted as Record<string, unknown>;
          if (version < 2) {
            // V1 had camera & grid nested inside doc — move to top-level
            const doc = s.doc as Record<string, unknown> | undefined;
            if (doc?.camera) {
              s.camera = doc.camera;
              delete doc.camera;
            } else {
              s.camera = { ...DEFAULT_CAMERA };
            }
            if (doc?.grid) {
              s.grid = doc.grid;
              delete doc.grid;
            } else {
              s.grid = { ...DEFAULT_GRID };
            }
          }
          return s as unknown as SketchBoardState;
        },
      }
    ),
    {
      // ── Temporal: only track doc mutations for undo/redo ──
      // Camera, grid, activeTool, selectedIds, currentStyle are EXCLUDED.
      partialize: (state) => ({ doc: state.doc }),
      limit: 100,
    }
  )
);
