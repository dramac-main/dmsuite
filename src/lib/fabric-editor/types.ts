import { fabric } from "fabric";
import type { ITextboxOptions } from "fabric/fabric-impl";

// ─── Custom JSON keys persisted with canvas.toJSON() ────────────────────────
export const JSON_KEYS = [
  "name",
  "selectable",
  "hasControls",
  "editable",
  "lockMovementX",
  "lockMovementY",
  "lockScalingX",
  "lockScalingY",
  "lockRotation",
  "data",           // arbitrary metadata (tool-specific)
] as const;

// ─── Active tool (sidebar selection) ────────────────────────────────────────
export type ActiveTool =
  | "select"
  | "shapes"
  | "text"
  | "images"
  | "draw"
  | "fill"
  | "stroke-color"
  | "stroke-width"
  | "font"
  | "opacity"
  | "filter"
  | "settings"
  | "ai"
  | "remove-bg"
  | "templates"
  | "layers"
  | "quick-edit";

/** Tools whose sidebar should auto-close when the selection clears */
export const SELECTION_DEPENDENT_TOOLS: ActiveTool[] = [
  "fill",
  "font",
  "filter",
  "opacity",
  "remove-bg",
  "stroke-color",
  "stroke-width",
];

// ─── Default values ─────────────────────────────────────────────────────────
export const FILL_COLOR = "rgba(0,0,0,1)";
export const STROKE_COLOR = "rgba(0,0,0,1)";
export const STROKE_WIDTH = 2;
export const STROKE_DASH_ARRAY: number[] = [];
export const FONT_FAMILY = "Inter";
export const FONT_SIZE = 32;
export const FONT_WEIGHT = 400;

// ─── Shape presets ──────────────────────────────────────────────────────────
export const CIRCLE_OPTIONS: fabric.ICircleOptions = {
  radius: 150,
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
};

export const RECTANGLE_OPTIONS: fabric.IRectOptions = {
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
  width: 400,
  height: 400,
  angle: 0,
};

export const DIAMOND_OPTIONS: fabric.IObjectOptions = {
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
  width: 600,
  height: 600,
  angle: 0,
};

export const TRIANGLE_OPTIONS: fabric.ITriangleOptions = {
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
  width: 400,
  height: 400,
  angle: 0,
};

export const TEXT_OPTIONS: ITextboxOptions = {
  type: "textbox",
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  fontSize: FONT_SIZE,
  fontFamily: FONT_FAMILY,
};

// ─── Image filters ──────────────────────────────────────────────────────────
export const FILTERS = [
  "none",
  "polaroid",
  "sepia",
  "kodachrome",
  "contrast",
  "brightness",
  "greyscale",
  "brownie",
  "vintage",
  "technicolor",
  "pixelate",
  "invert",
  "blur",
  "sharpen",
  "emboss",
  "blacknwhite",
  "vibrance",
  "huerotate",
] as const;

export type FilterName = (typeof FILTERS)[number];

// ─── Font list ──────────────────────────────────────────────────────────────
export const FONTS = [
  "Inter",
  "Arial",
  "Arial Black",
  "Verdana",
  "Helvetica",
  "Tahoma",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Courier New",
  "Palatino",
  "Impact",
  "Lucida Sans Unicode",
  "Playfair Display",
  "Montserrat",
  "Open Sans",
  "Lato",
  "Roboto",
  "Poppins",
  "Oswald",
  "Raleway",
  "PT Serif",
  "Merriweather",
  "Dancing Script",
  "Pacifico",
  "Great Vibes",
  "Cinzel",
] as const;

// ─── Export formats ─────────────────────────────────────────────────────────
export type ExportFormat = "png" | "jpg" | "svg" | "pdf" | "json";

// ─── Quick-edit fields (tool-specific sidebar) ──────────────────────────────
export interface QuickEditField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "color" | "number" | "image";
  targetLayer: string;           // Fabric object `name` to target
  placeholder?: string;
  options?: { label: string; value: string }[];
}

// ─── Template definition ────────────────────────────────────────────────────
export interface FabricTemplate {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  json: string;                  // Fabric.js JSON (stringified)
  svg?: string;                  // Optional inline SVG string — if present, loadSvg is used instead of loadJson
  svgUrl?: string;               // Optional SVG URL — fetched on demand then treated like svg field
  isPro?: boolean;
}

// ─── Editor hook props ──────────────────────────────────────────────────────
export interface EditorHookProps {
  defaultState?: string;         // initial Fabric JSON
  defaultWidth?: number;
  defaultHeight?: number;
  clearSelectionCallback?: () => void;
  saveCallback?: (values: { json: string; height: number; width: number }) => void;
}

// ─── Build-editor props (internal) ──────────────────────────────────────────
export interface BuildEditorProps {
  save: (skip?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  autoZoom: () => void;
  copy: () => void;
  paste: () => void;
  canvas: fabric.Canvas;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  selectedObjects: fabric.Object[];
  strokeDashArray: number[];
  fontFamily: string;
  setStrokeDashArray: (value: number[]) => void;
  setFillColor: (value: string) => void;
  setStrokeColor: (value: string) => void;
  setStrokeWidth: (value: number) => void;
  setFontFamily: (value: string) => void;
}

// ─── Editor API (returned by useEditor → buildEditor) ───────────────────────
export interface Editor {
  // Export
  savePng: () => void;
  saveJpg: () => void;
  saveSvg: () => void;
  saveJson: () => void;
  loadJson: (json: string) => void;
  loadSvg: (svgString: string) => void;
  addSvgElements: (svgString: string) => void;

  // History
  onUndo: () => void;
  onRedo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Viewport
  autoZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;

  // Canvas settings
  getWorkspace: () => fabric.Object | undefined;
  changeBackground: (value: string) => void;
  changeSize: (value: { width: number; height: number }) => void;

  // Drawing
  enableDrawingMode: () => void;
  disableDrawingMode: () => void;

  // Clipboard
  onCopy: () => void;
  onPaste: () => void;

  // Images
  changeImageFilter: (value: string) => void;
  addImage: (value: string) => void;

  // Object management
  delete: () => void;
  bringForward: () => void;
  sendBackwards: () => void;

  // Text
  addText: (value: string, options?: ITextboxOptions) => void;
  changeFontSize: (value: number) => void;
  getActiveFontSize: () => number;
  changeTextAlign: (value: string) => void;
  getActiveTextAlign: () => string;
  changeFontUnderline: (value: boolean) => void;
  getActiveFontUnderline: () => boolean;
  changeFontLinethrough: (value: boolean) => void;
  getActiveFontLinethrough: () => boolean;
  changeFontStyle: (value: string) => void;
  getActiveFontStyle: () => string;
  changeFontWeight: (value: number) => void;
  getActiveFontWeight: () => number;
  changeFontFamily: (value: string) => void;
  getActiveFontFamily: () => string;

  // Style
  changeOpacity: (value: number) => void;
  getActiveOpacity: () => number;
  changeFillColor: (value: string) => void;
  getActiveFillColor: () => string;
  changeStrokeColor: (value: string) => void;
  getActiveStrokeColor: () => string;
  changeStrokeWidth: (value: number) => void;
  getActiveStrokeWidth: () => number;
  changeStrokeDashArray: (value: number[]) => void;
  getActiveStrokeDashArray: () => number[];

  // Shapes
  addCircle: () => void;
  addSoftRectangle: () => void;
  addRectangle: () => void;
  addTriangle: () => void;
  addInverseTriangle: () => void;
  addDiamond: () => void;

  // Direct canvas access (for Chiko bridge)
  canvas: fabric.Canvas;
  selectedObjects: fabric.Object[];
}

// ─── Workspace config (per-tool) ────────────────────────────────────────────
export interface FabricEditorConfig {
  toolId: string;
  defaultWidth: number;
  defaultHeight: number;
  templates: FabricTemplate[];
  quickEditFields?: QuickEditField[];
  exportOptions?: ExportFormat[];
}
