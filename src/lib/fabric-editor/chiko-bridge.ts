/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Chiko ↔ Fabric.js Bridge
 *
 *  Provides a universal Chiko action manifest factory for ALL Fabric-based
 *  tools (certificates, business cards, menus, tickets, etc.).
 *
 *  Instead of each tool manually wiring 30+ actions, they call:
 *    createFabricManifest(toolId, toolName, editor, extraActions?)
 *
 *  This gives Chiko full design control: find/add/edit/remove any object,
 *  change styles, manipulate text, swap images, export, and manage layers.
 *  Tool-specific actions can be passed via extraActions.
 *  ═══════════════════════════════════════════════════════════════════════════ */

import { fabric } from "fabric";
import type {
  ChikoActionManifest,
  ChikoActionDescriptor,
  ChikoActionResult,
} from "@/stores/chiko-actions";
import type { Editor } from "./types";
import { JSON_KEYS } from "./types";
import {
  isTextType,
  findObjectByName,
  findObjectsByNamePrefix,
} from "./utils";

// ── Types ───────────────────────────────────────────────────────────────────

interface FabricBridgeConfig {
  /** Tool identifier (e.g. "certificate-designer") */
  toolId: string;
  /** Human-readable name (e.g. "Certificate Designer") */
  toolName: string;
  /** The Editor instance from useEditor hook */
  editor: Editor;
  /** Optional additional tool-specific actions */
  extraActions?: ChikoActionDescriptor[];
  /** Optional handler for tool-specific action names */
  extraExecute?: (
    actionName: string,
    params: Record<string, unknown>,
  ) => ChikoActionResult | null;
  /** Optional extra state for getState() */
  extraState?: () => Record<string, unknown>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function ok(message: string, state?: Record<string, unknown>): ChikoActionResult {
  return { success: true, message, newState: state };
}

function fail(message: string): ChikoActionResult {
  return { success: false, message };
}

function describeObject(obj: fabric.Object): Record<string, unknown> {
  const base: Record<string, unknown> = {
    name: obj.name,
    type: obj.type,
    left: Math.round(obj.left ?? 0),
    top: Math.round(obj.top ?? 0),
    width: Math.round((obj.width ?? 0) * (obj.scaleX ?? 1)),
    height: Math.round((obj.height ?? 0) * (obj.scaleY ?? 1)),
    fill: obj.fill,
    opacity: obj.opacity,
    angle: obj.angle,
  };
  if (isTextType(obj.type)) {
    const t = obj as fabric.Textbox;
    base.text = t.text;
    base.fontSize = t.fontSize;
    base.fontFamily = t.fontFamily;
    base.fontWeight = t.fontWeight;
    base.fontStyle = t.fontStyle;
    base.textAlign = t.textAlign;
    base.underline = t.underline;
    base.linethrough = t.linethrough;
  }
  if (obj.type === "image") {
    base.src = (obj as fabric.Image).getSrc?.();
  }
  return base;
}

// ── Core Actions (shared across all Fabric tools) ───────────────────────────

const CORE_ACTIONS: ChikoActionDescriptor[] = [
  // ─ Read ─────────────────────────────────────────────────────────────────
  {
    name: "list_objects",
    description: "List all objects on the canvas with their names, types, positions, and key properties",
    parameters: { type: "object", properties: {}, required: [] },
    category: "Canvas",
  },
  {
    name: "get_object",
    description: "Get detailed properties of a specific object by its name",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "Object name" } },
      required: ["name"],
    },
    category: "Canvas",
  },
  {
    name: "find_objects_by_prefix",
    description: "Find all objects whose names start with a prefix (e.g. 'text' finds text-1, text-2)",
    parameters: {
      type: "object",
      properties: { prefix: { type: "string", description: "Name prefix to search" } },
      required: ["prefix"],
    },
    category: "Canvas",
  },

  // ─ Text ─────────────────────────────────────────────────────────────────
  {
    name: "add_text",
    description: "Add a new text element to the canvas",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text content" },
        fontSize: { type: "number", description: "Font size (default 32)" },
        fontFamily: { type: "string", description: "Font name (e.g. Inter, Playfair Display)" },
        fill: { type: "string", description: "Text color (hex or rgba)" },
        fontWeight: { type: "number", description: "Font weight (400=normal, 700=bold)" },
        fontStyle: { type: "string", description: "normal or italic" },
        textAlign: { type: "string", description: "left, center, or right" },
        left: { type: "number", description: "X position" },
        top: { type: "number", description: "Y position" },
        width: { type: "number", description: "Text box width" },
        name: { type: "string", description: "Object name for later reference" },
      },
      required: ["text"],
    },
    category: "Text",
  },
  {
    name: "edit_text",
    description: "Change the text content of an existing text object",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        text: { type: "string", description: "New text content" },
      },
      required: ["name", "text"],
    },
    category: "Text",
  },
  {
    name: "style_text",
    description: "Change style properties of a text object (font, size, color, alignment, etc.)",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        fontSize: { type: "number" },
        fontFamily: { type: "string" },
        fill: { type: "string" },
        fontWeight: { type: "number" },
        fontStyle: { type: "string" },
        textAlign: { type: "string" },
        underline: { type: "boolean" },
        linethrough: { type: "boolean" },
      },
      required: ["name"],
    },
    category: "Text",
  },

  // ─ Shapes ───────────────────────────────────────────────────────────────
  {
    name: "add_shape",
    description: "Add a shape to the canvas (circle, rectangle, rounded-rect, triangle, diamond)",
    parameters: {
      type: "object",
      properties: {
        shape: {
          type: "string",
          description: "Shape type",
          enum: ["circle", "rectangle", "rounded-rect", "triangle", "inverse-triangle", "diamond"],
        },
        fill: { type: "string", description: "Fill color" },
        stroke: { type: "string", description: "Stroke color" },
        strokeWidth: { type: "number" },
        left: { type: "number" },
        top: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
        name: { type: "string", description: "Object name" },
      },
      required: ["shape"],
    },
    category: "Shapes",
  },

  // ─ Images ───────────────────────────────────────────────────────────────
  {
    name: "add_image",
    description: "Add an image to the canvas from a URL",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Image URL" },
        name: { type: "string", description: "Object name" },
        width: { type: "number", description: "Scale to this width" },
      },
      required: ["url"],
    },
    category: "Images",
  },

  // ─ Object Manipulation ──────────────────────────────────────────────────
  {
    name: "move_object",
    description: "Move an object to a new position",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        left: { type: "number", description: "New X position" },
        top: { type: "number", description: "New Y position" },
      },
      required: ["name"],
    },
    category: "Layout",
  },
  {
    name: "resize_object",
    description: "Resize an object by setting new width/height (via scaleX/scaleY)",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        width: { type: "number", description: "New visual width" },
        height: { type: "number", description: "New visual height" },
      },
      required: ["name"],
    },
    category: "Layout",
  },
  {
    name: "rotate_object",
    description: "Rotate an object to a specific angle in degrees",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        angle: { type: "number", description: "Rotation angle in degrees" },
      },
      required: ["name", "angle"],
    },
    category: "Layout",
  },
  {
    name: "style_object",
    description: "Change visual style of any object (fill, stroke, opacity)",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name" },
        fill: { type: "string", description: "Fill color" },
        stroke: { type: "string", description: "Stroke color" },
        strokeWidth: { type: "number" },
        opacity: { type: "number", description: "0–1" },
      },
      required: ["name"],
    },
    category: "Style",
  },
  {
    name: "remove_object",
    description: "Remove an object from the canvas by name",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Object name to remove" },
      },
      required: ["name"],
    },
    category: "Canvas",
    destructive: true,
  },

  // ─ Layer Order ──────────────────────────────────────────────────────────
  {
    name: "bring_forward",
    description: "Bring an object one layer forward",
    parameters: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
    category: "Layers",
  },
  {
    name: "send_backward",
    description: "Send an object one layer backward",
    parameters: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
    category: "Layers",
  },

  // ─ Canvas Settings ──────────────────────────────────────────────────────
  {
    name: "change_background",
    description: "Change the canvas background color",
    parameters: {
      type: "object",
      properties: { color: { type: "string", description: "Background color" } },
      required: ["color"],
    },
    category: "Canvas",
  },
  {
    name: "change_canvas_size",
    description: "Change the canvas dimensions",
    parameters: {
      type: "object",
      properties: {
        width: { type: "number" },
        height: { type: "number" },
      },
      required: ["width", "height"],
    },
    category: "Canvas",
  },

  // ─ Export ────────────────────────────────────────────────────────────────
  {
    name: "export_design",
    description: "Export the current design as PNG, JPG, SVG, PDF, or JSON",
    parameters: {
      type: "object",
      properties: {
        format: {
          type: "string",
          description: "Export format",
          enum: ["png", "jpg", "svg", "pdf", "json"],
        },
      },
      required: ["format"],
    },
    category: "Export",
  },

  // ─ Bulk ─────────────────────────────────────────────────────────────────
  {
    name: "clear_canvas",
    description: "Remove all objects from the canvas (keeps the workspace/clip)",
    parameters: { type: "object", properties: {}, required: [] },
    category: "Canvas",
    destructive: true,
  },

  // ─ SVG Import ───────────────────────────────────────────────────────────
  {
    name: "load_svg",
    description: "Load an SVG string onto the canvas, replacing all current objects. Each SVG element becomes an individually editable Fabric object. Use this to import SVG templates or vector artwork.",
    parameters: {
      type: "object",
      properties: {
        svg: { type: "string", description: "SVG markup string to load" },
      },
      required: ["svg"],
    },
    category: "Canvas",
    destructive: true,
  },
  {
    name: "add_svg",
    description: "Add SVG vector elements to the canvas without removing existing objects. The SVG is imported as a grouped object.",
    parameters: {
      type: "object",
      properties: {
        svg: { type: "string", description: "SVG markup string to add" },
      },
      required: ["svg"],
    },
    category: "Canvas",
  },
];

// ── Action Executor ─────────────────────────────────────────────────────────

function executeAction(
  actionName: string,
  params: Record<string, unknown>,
  editor: Editor,
): ChikoActionResult | null {
  const { canvas } = editor;

  switch (actionName) {
    // ─ Read ───────────────────────────────────────────────────────────────
    case "list_objects": {
      const objects = canvas
        .getObjects()
        .filter((o) => o.name !== "clip")
        .map(describeObject);
      return ok(`Found ${objects.length} object(s)`, { objects });
    }

    case "get_object": {
      const obj = findObjectByName(canvas, params.name as string);
      if (!obj) return fail(`Object "${params.name}" not found`);
      return ok("Object found", { object: describeObject(obj) });
    }

    case "find_objects_by_prefix": {
      const objs = findObjectsByNamePrefix(canvas, params.prefix as string);
      return ok(`Found ${objs.length} object(s)`, {
        objects: objs.map(describeObject),
      });
    }

    // ─ Text ───────────────────────────────────────────────────────────────
    case "add_text": {
      const textOpts: fabric.ITextboxOptions = {};
      if (params.fontSize) textOpts.fontSize = params.fontSize as number;
      if (params.fontFamily) textOpts.fontFamily = params.fontFamily as string;
      if (params.fill) textOpts.fill = params.fill as string;
      if (params.fontWeight) textOpts.fontWeight = params.fontWeight as number;
      if (params.fontStyle) textOpts.fontStyle = params.fontStyle as "" | "normal" | "italic" | "oblique";
      if (params.textAlign) textOpts.textAlign = params.textAlign as string;
      if (params.left != null) textOpts.left = params.left as number;
      if (params.top != null) textOpts.top = params.top as number;
      if (params.width) textOpts.width = params.width as number;
      if (params.name) textOpts.name = params.name as string;
      editor.addText(params.text as string, textOpts);
      return ok(`Text added: "${(params.text as string).slice(0, 40)}"`);
    }

    case "edit_text": {
      const obj = findObjectByName(canvas, params.name as string);
      if (!obj || !isTextType(obj.type))
        return fail(`Text object "${params.name}" not found`);
      (obj as fabric.Textbox).set({ text: params.text as string });
      canvas.renderAll();
      return ok(`Text updated to: "${(params.text as string).slice(0, 40)}"`);
    }

    case "style_text": {
      const obj = findObjectByName(canvas, params.name as string);
      if (!obj || !isTextType(obj.type))
        return fail(`Text object "${params.name}" not found`);
      const textObj = obj as fabric.Textbox;
      const stylePatch: Record<string, unknown> = {};
      if (params.fontSize != null) stylePatch.fontSize = params.fontSize;
      if (params.fontFamily != null) stylePatch.fontFamily = params.fontFamily;
      if (params.fill != null) stylePatch.fill = params.fill;
      if (params.fontWeight != null) stylePatch.fontWeight = params.fontWeight;
      if (params.fontStyle != null) stylePatch.fontStyle = params.fontStyle;
      if (params.textAlign != null) stylePatch.textAlign = params.textAlign;
      if (params.underline != null) stylePatch.underline = params.underline;
      if (params.linethrough != null) stylePatch.linethrough = params.linethrough;
      textObj.set(stylePatch);
      canvas.renderAll();
      return ok(`Styled "${params.name}"`);
    }

    // ─ Shapes ─────────────────────────────────────────────────────────────
    case "add_shape": {
      switch (params.shape as string) {
        case "circle":
          editor.addCircle();
          break;
        case "rectangle":
          editor.addRectangle();
          break;
        case "rounded-rect":
          editor.addSoftRectangle();
          break;
        case "triangle":
          editor.addTriangle();
          break;
        case "inverse-triangle":
          editor.addInverseTriangle();
          break;
        case "diamond":
          editor.addDiamond();
          break;
        default:
          return fail(`Unknown shape: ${params.shape}`);
      }
      // Apply custom properties to the newly added shape
      const active = canvas.getActiveObject();
      if (active) {
        const shapePatch: Record<string, unknown> = {};
        if (params.fill) shapePatch.fill = params.fill;
        if (params.stroke) shapePatch.stroke = params.stroke;
        if (params.strokeWidth != null) shapePatch.strokeWidth = params.strokeWidth;
        if (params.left != null) shapePatch.left = params.left;
        if (params.top != null) shapePatch.top = params.top;
        if (params.name) shapePatch.name = params.name;
        if (params.width != null) {
          shapePatch.scaleX = (params.width as number) / (active.width ?? 1);
        }
        if (params.height != null) {
          shapePatch.scaleY = (params.height as number) / (active.height ?? 1);
        }
        active.set(shapePatch);
        canvas.renderAll();
      }
      return ok(`Added ${params.shape} shape`);
    }

    // ─ Images ─────────────────────────────────────────────────────────────
    case "add_image": {
      const url = params.url as string;
      // Validate URL format
      try {
        new URL(url);
      } catch {
        return fail("Invalid URL provided");
      }
      editor.addImage(url);
      // Fabric.Image.fromURL is async — name the object after a tick
      if (params.name) {
        setTimeout(() => {
          const active = canvas.getActiveObject();
          if (active) {
            active.set({ name: params.name as string });
            if (params.width) {
              active.scaleToWidth(params.width as number);
            }
            canvas.renderAll();
          }
        }, 100);
      }
      return ok("Image added to canvas");
    }

    // ─ Object Manipulation ────────────────────────────────────────────────
    case "move_object": {
      const obj = findObjectByName(canvas, params.name as string);
      if (!obj) return fail(`Object "${params.name}" not found`);
      const movePatch: Record<string, unknown> = {};
      if (params.left != null) movePatch.left = params.left;
      if (params.top != null) movePatch.top = params.top;
      obj.set(movePatch);
      obj.setCoords();
      canvas.renderAll();
      return ok(`Moved "${params.name}"`);
    }

    case "resize_object": {
      const obj = findObjectByName(canvas, params.name as string);
      if (!obj) return fail(`Object "${params.name}" not found`);
      if (params.width != null) {
        obj.set({ scaleX: (params.width as number) / (obj.width ?? 1) });
      }
      if (params.height != null) {
        obj.set({ scaleY: (params.height as number) / (obj.height ?? 1) });
      }
      obj.setCoords();
      canvas.renderAll();
      return ok(`Resized "${params.name}"`);
    }

    case "rotate_object": {
      const obj = findObjectByName(canvas, params.name as string);
      if (!obj) return fail(`Object "${params.name}" not found`);
      obj.set({ angle: params.angle as number });
      obj.setCoords();
      canvas.renderAll();
      return ok(`Rotated "${params.name}" to ${params.angle}°`);
    }

    case "style_object": {
      const obj = findObjectByName(canvas, params.name as string);
      if (!obj) return fail(`Object "${params.name}" not found`);
      const patch: Record<string, unknown> = {};
      if (params.fill != null) patch.fill = params.fill;
      if (params.stroke != null) patch.stroke = params.stroke;
      if (params.strokeWidth != null) patch.strokeWidth = params.strokeWidth;
      if (params.opacity != null) patch.opacity = params.opacity;
      obj.set(patch);
      canvas.renderAll();
      return ok(`Styled "${params.name}"`);
    }

    case "remove_object": {
      const obj = findObjectByName(canvas, params.name as string);
      if (!obj) return fail(`Object "${params.name}" not found`);
      if (obj.name === "clip") return fail("Cannot remove the workspace clip");
      canvas.remove(obj);
      canvas.renderAll();
      return ok(`Removed "${params.name}"`);
    }

    // ─ Layer Order ────────────────────────────────────────────────────────
    case "bring_forward": {
      const obj = findObjectByName(canvas, params.name as string);
      if (!obj) return fail(`Object "${params.name}" not found`);
      canvas.bringForward(obj);
      canvas.renderAll();
      return ok(`"${params.name}" brought forward`);
    }

    case "send_backward": {
      const obj = findObjectByName(canvas, params.name as string);
      if (!obj) return fail(`Object "${params.name}" not found`);
      canvas.sendBackwards(obj);
      canvas.renderAll();
      // Keep workspace at back
      const ws = editor.getWorkspace();
      ws?.sendToBack();
      return ok(`"${params.name}" sent backward`);
    }

    // ─ Canvas Settings ────────────────────────────────────────────────────
    case "change_background": {
      editor.changeBackground(params.color as string);
      return ok(`Background changed to ${params.color}`);
    }

    case "change_canvas_size": {
      editor.changeSize({
        width: params.width as number,
        height: params.height as number,
      });
      return ok(`Canvas resized to ${params.width}×${params.height}`);
    }

    // ─ Export ──────────────────────────────────────────────────────────────
    case "export_design": {
      const format = params.format as string;
      switch (format) {
        case "png":
          editor.savePng();
          break;
        case "jpg":
          editor.saveJpg();
          break;
        case "svg":
          editor.saveSvg();
          break;
        case "json":
          editor.saveJson();
          break;
        case "pdf":
          // PDF export is async, but we trigger it fire-and-forget here
          import("./export").then((m) => m.exportPdf(canvas));
          break;
        default:
          return fail(`Unknown format: ${format}`);
      }
      return ok(`Exporting as ${format}...`);
    }

    // ─ Bulk ───────────────────────────────────────────────────────────────
    case "clear_canvas": {
      const objects = canvas.getObjects().filter((o) => o.name !== "clip");
      objects.forEach((o) => canvas.remove(o));
      canvas.discardActiveObject();
      canvas.renderAll();
      return ok(`Cleared ${objects.length} object(s) from canvas`);
    }

    // ─ SVG Import ─────────────────────────────────────────────────────────
    case "load_svg": {
      const svg = params.svg as string;
      if (!svg || typeof svg !== "string") return fail("SVG string is required");
      editor.loadSvg(svg);
      return ok("SVG loaded onto canvas — all elements are now individually editable");
    }

    case "add_svg": {
      const svg = params.svg as string;
      if (!svg || typeof svg !== "string") return fail("SVG string is required");
      editor.addSvgElements(svg);
      return ok("SVG elements added to canvas as a group");
    }

    default:
      return null; // Not a core action — let extraExecute handle it
  }
}

// ── getState — describes the current canvas to the AI ───────────────────────

function getCanvasState(
  editor: Editor,
  extraState?: () => Record<string, unknown>,
): Record<string, unknown> {
  const { canvas } = editor;
  const ws = editor.getWorkspace() as fabric.Rect | undefined;

  const objects = canvas
    .getObjects()
    .filter((o) => o.name !== "clip")
    .map(describeObject);

  const state: Record<string, unknown> = {
    canvasWidth: ws?.width ?? canvas.getWidth(),
    canvasHeight: ws?.height ?? canvas.getHeight(),
    background: ws?.fill ?? "white",
    objectCount: objects.length,
    objects,
    selectedObjects: editor.selectedObjects.map(describeObject),
  };

  if (extraState) {
    Object.assign(state, extraState());
  }

  return state;
}

// ── Factory — creates the manifest for any Fabric-based tool ────────────────

export function createFabricManifest(config: FabricBridgeConfig): ChikoActionManifest {
  const { toolId, toolName, editor, extraActions, extraExecute, extraState } = config;

  const allActions = [...CORE_ACTIONS, ...(extraActions ?? [])];

  return {
    toolId,
    toolName,
    actions: allActions,
    getState: () => getCanvasState(editor, extraState),
    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      // Try extra actions first (tool-specific overrides)
      if (extraExecute) {
        const result = extraExecute(actionName, params);
        if (result) return result;
      }
      // Then try core actions
      const coreResult = executeAction(actionName, params, editor);
      if (coreResult) return coreResult;
      // Unknown action
      return fail(`Unknown action: ${actionName}`);
    },
  };
}

// ── Convenience: load a Fabric template JSON into the canvas ────────────────

export function loadTemplateJson(
  editor: Editor,
  json: string,
  onComplete?: () => void,
): void {
  editor.loadJson(json);
  if (onComplete) {
    // loadFromJSON is async internally — small delay for safety
    setTimeout(onComplete, 200);
  }
}

// ── Convenience: replace text across all matching objects ────────────────────

export function bulkReplaceText(
  editor: Editor,
  replacements: Record<string, string>,
): number {
  const { canvas } = editor;
  let count = 0;

  canvas.getObjects().forEach((obj) => {
    if (!isTextType(obj.type) || !obj.name) return;
    const newText = replacements[obj.name];
    if (newText !== undefined) {
      (obj as fabric.Textbox).set({ text: newText });
      count++;
    }
  });

  if (count > 0) canvas.renderAll();
  return count;
}

// ── Convenience: batch generate from template ───────────────────────────────
// Given a template JSON and an array of data rows, returns canvas JSON variants.

export async function batchGenerate(
  templateJson: string,
  dataRows: Record<string, string>[],
): Promise<string[]> {
  // Create an offscreen canvas for batch rendering
  const offscreen = new fabric.StaticCanvas(null, {
    width: 1200,
    height: 900,
  });

  const results: string[] = [];

  for (const row of dataRows) {
    await new Promise<void>((resolve) => {
      offscreen.loadFromJSON(JSON.parse(templateJson), () => {
        // Replace text objects matching the row keys
        offscreen.getObjects().forEach((obj) => {
          if (isTextType(obj.type) && obj.name && row[obj.name] !== undefined) {
            (obj as fabric.Textbox).set({ text: row[obj.name] });
          }
        });
        offscreen.renderAll();

        const json = JSON.stringify(
          offscreen.toJSON(JSON_KEYS as unknown as string[]),
        );
        results.push(json);
        resolve();
      });
    });
  }

  offscreen.dispose();
  return results;
}
