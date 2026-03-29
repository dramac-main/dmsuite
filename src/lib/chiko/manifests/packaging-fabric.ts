// =============================================================================
// DMSuite — Chiko Action Manifest: Packaging Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Packaging-specific extra actions ────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_packaging_details",
    description: "Update packaging text fields: productName, brandName, tagline, weight, ingredients, barcode.",
    category: "packaging",
    parameters: {
      productName: { type: "string", description: "Product name", required: false },
      brandName: { type: "string", description: "Brand name", required: false },
      tagline: { type: "string", description: "Product tagline", required: false },
      weight: { type: "string", description: "Weight / volume", required: false },
      ingredients: { type: "string", description: "Ingredients list", required: false },
      barcode: { type: "string", description: "Barcode number", required: false },
    },
  },
];

const PACKAGING_FIELD_MAP: Record<string, string> = {
  productName: "pkg-product-name",
  brandName: "pkg-brand-name",
  tagline: "pkg-tagline",
  weight: "pkg-weight",
  ingredients: "pkg-ingredients",
  barcode: "pkg-barcode",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_packaging_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(PACKAGING_FIELD_MAP)) {
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

export function createPackagingFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "packaging-design",
    toolName: "Packaging Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(PACKAGING_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { packagingFields: fields };
    },
  });
}
