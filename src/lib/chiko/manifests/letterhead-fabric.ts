// =============================================================================
// DMSuite — Chiko Action Manifest: Letterhead Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Letterhead-specific extra actions ───────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_letterhead_details",
    description: "Update letterhead text fields: company name, tagline, address, phone, email, website, footer info.",
    category: "letterhead",
    parameters: {
      companyName: { type: "string", description: "Company name", required: false },
      tagline: { type: "string", description: "Tagline / slogan", required: false },
      address: { type: "string", description: "Business address", required: false },
      phone: { type: "string", description: "Phone number", required: false },
      email: { type: "string", description: "Email address", required: false },
      website: { type: "string", description: "Website URL", required: false },
      footerInfo: { type: "string", description: "Footer info line", required: false },
    },
  },
];

const LETTERHEAD_FIELD_MAP: Record<string, string> = {
  companyName: "lh-company-name",
  tagline: "lh-tagline",
  address: "lh-address",
  phone: "lh-phone",
  email: "lh-email",
  website: "lh-website",
  footerInfo: "lh-footer-info",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_letterhead_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(LETTERHEAD_FIELD_MAP)) {
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

export function createLetterheadFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "letterhead",
    toolName: "Letterhead Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(LETTERHEAD_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { letterheadFields: fields };
    },
  });
}
