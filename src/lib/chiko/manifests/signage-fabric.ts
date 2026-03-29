// =============================================================================
// DMSuite — Chiko Action Manifest: Signage & Large Format Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Signage-specific extra actions ──────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_signage_details",
    description: "Update signage text fields: headline, subheadline, bodyText, ctaText, businessName, phone, website, address.",
    category: "signage",
    parameters: {
      headline: { type: "string", description: "Main headline", required: false },
      subheadline: { type: "string", description: "Subheadline text", required: false },
      bodyText: { type: "string", description: "Body text", required: false },
      ctaText: { type: "string", description: "CTA button text", required: false },
      businessName: { type: "string", description: "Business name", required: false },
      phone: { type: "string", description: "Phone number", required: false },
      website: { type: "string", description: "Website URL", required: false },
      address: { type: "string", description: "Physical address", required: false },
    },
  },
];

const SIGNAGE_FIELD_MAP: Record<string, string> = {
  headline: "sgn-headline",
  subheadline: "sgn-subheadline",
  bodyText: "sgn-body-text",
  ctaText: "sgn-cta-text",
  businessName: "sgn-business-name",
  phone: "sgn-phone",
  website: "sgn-website",
  address: "sgn-address",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_signage_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(SIGNAGE_FIELD_MAP)) {
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

export function createSignageFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "signage",
    toolName: "Signage & Large Format Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(SIGNAGE_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { signageFields: fields };
    },
  });
}
