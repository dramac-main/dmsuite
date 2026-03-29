// =============================================================================
// DMSuite — Chiko Action Manifest: Sticker & Decal Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Sticker-specific extra actions ──────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_sticker_details",
    description: "Update sticker text fields: title, subtitle, line1, line2, line3, price.",
    category: "sticker",
    parameters: {
      title: { type: "string", description: "Title / brand name", required: false },
      subtitle: { type: "string", description: "Subtitle text", required: false },
      line1: { type: "string", description: "Line 1 text", required: false },
      line2: { type: "string", description: "Line 2 text", required: false },
      line3: { type: "string", description: "Line 3 text", required: false },
      price: { type: "string", description: "Price label", required: false },
    },
  },
];

const STICKER_FIELD_MAP: Record<string, string> = {
  title: "stk-title",
  subtitle: "stk-subtitle",
  line1: "stk-line1",
  line2: "stk-line2",
  line3: "stk-line3",
  price: "stk-price",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_sticker_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(STICKER_FIELD_MAP)) {
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

export function createStickerFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "sticker-designer",
    toolName: "Sticker & Decal Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(STICKER_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { stickerFields: fields };
    },
  });
}
