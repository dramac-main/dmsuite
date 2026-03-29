// =============================================================================
// DMSuite — Chiko Action Manifest: Menu Designer (Fabric.js)
//
// Uses the universal createFabricManifest() factory from chiko-bridge.ts,
// adding menu-specific actions for quick-edit fields.
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";

// ── Menu-specific extra actions ─────────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_menu_header",
    description: "Update menu header text fields: restaurant name, tagline, header note, footer note.",
    category: "menu",
    parameters: {
      restaurantName: { type: "string", description: "Restaurant name", required: false },
      tagline: { type: "string", description: "Tagline / subtitle", required: false },
      headerNote: { type: "string", description: "Header note (allergy info, etc.)", required: false },
      footerNote: { type: "string", description: "Footer / dietary legend", required: false },
    },
  },
  {
    name: "update_menu_section",
    description: "Update a menu section title and items. Index 0-2.",
    category: "menu",
    parameters: {
      index: { type: "number", description: "Section index (0, 1, or 2)", required: true },
      title: { type: "string", description: "Section title (e.g. Starters)", required: false },
      items: { type: "string", description: "Multi-line items text, each line: 'Item Name  ·  $Price'", required: false },
    },
  },
];

// ── Field mapping for header fields ─────────────────────────────────────────

const HEADER_FIELD_MAP: Record<string, string> = {
  restaurantName: "menu-restaurant-name",
  tagline: "menu-tagline",
  headerNote: "menu-header-note",
  footerNote: "menu-footer-note",
};

// ── Extra execute handler ───────────────────────────────────────────────────

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName === "update_menu_header") {
    const updated: string[] = [];

    for (const [field, layerName] of Object.entries(HEADER_FIELD_MAP)) {
      const value = params[field];
      if (typeof value !== "string") continue;

      const obj = findObjectByName(editor.canvas, layerName);
      if (obj && "set" in obj) {
        (obj as fabric.Textbox).set("text", value);
        updated.push(field);
      }
    }

    if (updated.length > 0) {
      editor.canvas.renderAll();
      return { success: true, message: `Updated: ${updated.join(", ")}` };
    }
    return { success: false, message: "No recognised header fields provided." };
  }

  if (actionName === "update_menu_section") {
    const idx = params.index;
    if (typeof idx !== "number" || idx < 0 || idx > 2) {
      return { success: false, message: "index must be 0, 1, or 2." };
    }

    const updated: string[] = [];

    if (typeof params.title === "string") {
      const titleObj = findObjectByName(editor.canvas, `menu-section-${idx}-title`);
      if (titleObj && "set" in titleObj) {
        (titleObj as fabric.Textbox).set("text", params.title);
        updated.push("title");
      }
    }

    if (typeof params.items === "string") {
      const itemsObj = findObjectByName(editor.canvas, `menu-section-${idx}-items`);
      if (itemsObj && "set" in itemsObj) {
        (itemsObj as fabric.Textbox).set("text", params.items);
        updated.push("items");
      }
    }

    if (updated.length > 0) {
      editor.canvas.renderAll();
      return { success: true, message: `Section ${idx} updated: ${updated.join(", ")}` };
    }
    return { success: false, message: "No title or items provided." };
  }

  return null;
}

// ── Factory ─────────────────────────────────────────────────────────────────

import { fabric } from "fabric";

export function createMenuDesignerFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "menu-designer",
    toolName: "Menu Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};

      // Header fields
      for (const [field, layerName] of Object.entries(HEADER_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }

      // Section fields
      for (let i = 0; i < 3; i++) {
        const titleObj = findObjectByName(editor.canvas, `menu-section-${i}-title`);
        const itemsObj = findObjectByName(editor.canvas, `menu-section-${i}-items`);
        if (titleObj && "text" in titleObj) fields[`section${i}Title`] = (titleObj as fabric.Textbox).text || "";
        if (itemsObj && "text" in itemsObj) fields[`section${i}Items`] = (itemsObj as fabric.Textbox).text || "";
      }

      return { menuFields: fields };
    },
  });
}
