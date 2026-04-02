/* ─────────────────────────────────────────────────────────────
   Sketch Board — Types
   Infinite canvas whiteboard inspired by tldraw
   ───────────────────────────────────────────────────────────── */

/** Available drawing/shape tool modes */
export type SketchTool =
  | "select"
  | "hand"
  | "draw"
  | "eraser"
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "triangle"
  | "line"
  | "arrow"
  | "text"
  | "sticky"
  | "image";

/** Fill style for shapes */
export type FillStyle = "none" | "solid" | "hachure" | "cross-hatch";

/** Stroke dash style */
export type DashStyle = "solid" | "dashed" | "dotted";

/** Arrow head type */
export type ArrowHead = "none" | "arrow" | "triangle" | "circle" | "diamond";

/** Font family for text elements */
export type SketchFont = "hand" | "sans" | "serif" | "mono";

/** Text alignment */
export type TextAlign = "left" | "center" | "right";

/** Element size preset */
export type SizePreset = "S" | "M" | "L" | "XL";

/** 2D point */
export interface Point {
  x: number;
  y: number;
}

/** Bounding box */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Style properties shared by all elements */
export interface ElementStyle {
  strokeColor: string;
  fillColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  dashStyle: DashStyle;
  opacity: number;
  fontSize: number;
  fontFamily: SketchFont;
  textAlign: TextAlign;
}

/** Base element that all shapes extend */
export interface BaseElement {
  id: string;
  type: SketchTool;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  style: ElementStyle;
  locked: boolean;
  /** For z-ordering */
  zIndex: number;
}

/** Freehand drawing path */
export interface DrawElement extends BaseElement {
  type: "draw";
  points: Point[];
  /** Pressure data if available */
  pressures?: number[];
}

/** Eraser strokes (stored to support undo) */
export interface EraserElement extends BaseElement {
  type: "eraser";
  points: Point[];
}

/** Rectangle, ellipse, diamond, triangle shapes */
export interface ShapeElement extends BaseElement {
  type: "rectangle" | "ellipse" | "diamond" | "triangle";
}

/** Line segment (no arrowheads) */
export interface LineElement extends BaseElement {
  type: "line";
  start: Point;
  end: Point;
}

/** Arrow connector */
export interface ArrowElement extends BaseElement {
  type: "arrow";
  start: Point;
  end: Point;
  startHead: ArrowHead;
  endHead: ArrowHead;
  /** If connected to elements, store their IDs */
  startBinding?: string;
  endBinding?: string;
}

/** Text block */
export interface TextElement extends BaseElement {
  type: "text";
  text: string;
}

/** Sticky note */
export interface StickyElement extends BaseElement {
  type: "sticky";
  text: string;
  stickyColor: string;
}

/** Embedded image */
export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
}

/** Union of all element types */
export type SketchElement =
  | DrawElement
  | EraserElement
  | ShapeElement
  | LineElement
  | ArrowElement
  | TextElement
  | StickyElement
  | ImageElement;

/** Camera/viewport state */
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

/** Grid config */
export interface GridConfig {
  enabled: boolean;
  size: number;
  snap: boolean;
}

/** The full board document */
export interface SketchBoardDocument {
  /** Document title */
  title: string;
  /** Canvas background color key */
  background: string;
  /** All elements on the canvas */
  elements: SketchElement[];
  /** Current camera position */
  camera: Camera;
  /** Grid settings */
  grid: GridConfig;
}
