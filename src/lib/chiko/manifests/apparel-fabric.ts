// =============================================================================
// DMSuite — Chiko Action Manifest: T-Shirt & Apparel Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Apparel-specific extra actions ──────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_apparel_details",
    description: "Update apparel text fields: designText, subText.",
    category: "apparel",
    parameters: {
      designText: { type: "string", description: "Main design text", required: false },
      subText: { type: "string", description: "Supporting sub text", required: false },
    },
  },
];

const APPAREL_FIELD_MAP: Record<string, string> = {
  designText: "apr-design-text",
  subText: "apr-sub-text",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_apparel_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(APPAREL_FIELD_MAP)) {
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
  return { success: false, message: "No valid fields provided" };
}

// ── Factory ─────────────────────────────────────────────────────────────────

export function createApparelFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "tshirt-merch",
    toolName: "T-Shirt & Apparel Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(APPAREL_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { apparelFields: fields };
    },
  });
}
