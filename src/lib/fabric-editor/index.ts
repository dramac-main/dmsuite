/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Fabric Editor Barrel Export
 *  ═══════════════════════════════════════════════════════════════════════════ */

// Types & constants
export {
  JSON_KEYS,
  SELECTION_DEPENDENT_TOOLS,
  FILL_COLOR,
  STROKE_COLOR,
  STROKE_WIDTH,
  STROKE_DASH_ARRAY,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  CIRCLE_OPTIONS,
  RECTANGLE_OPTIONS,
  DIAMOND_OPTIONS,
  TRIANGLE_OPTIONS,
  TEXT_OPTIONS,
  FILTERS,
  FONTS,
} from "./types";

export type {
  ActiveTool,
  FilterName,
  ExportFormat,
  QuickEditField,
  FabricTemplate,
  FabricEditorConfig,
  EditorHookProps,
  BuildEditorProps,
  Editor,
} from "./types";

// Main hook
export { useEditor } from "./use-editor";

// Export pipeline
export {
  exportPng,
  exportJpg,
  exportSvg,
  exportJson,
  exportPdf,
  exportCanvas,
  getCanvasJson,
  getCanvasDataUrl,
  printCanvas,
} from "./export";
export type { ExportOptions } from "./export";

// Chiko AI bridge
export {
  createFabricManifest,
  loadTemplateJson,
  bulkReplaceText,
  batchGenerate,
} from "./chiko-bridge";

// Font loading
export { ensureFontReady } from "./font-loader";

// Utils
export {
  isTextType,
  downloadFile,
  createFilter,
  transformText,
  findObjectByName,
  findObjectsByNamePrefix,
  generateObjectName,
  clamp,
} from "./utils";
