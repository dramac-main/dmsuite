// =============================================================================
// DMSuite — Chiko Action Manifest: Brochure Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Brochure-specific extra actions ─────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_brochure_details",
    description: "Update brochure text fields: companyName, coverTitle, coverBody, tagline, section headings/bodies, CTA, phone, website, address.",
    category: "brochure",
    parameters: {
      companyName: { type: "string", description: "Company name", required: false },
      coverTitle: { type: "string", description: "Cover title text", required: false },
      coverBody: { type: "string", description: "Cover body text", required: false },
      tagline: { type: "string", description: "Tagline", required: false },
      section1Heading: { type: "string", description: "Section 1 heading", required: false },
      section1Body: { type: "string", description: "Section 1 body", required: false },
      section2Heading: { type: "string", description: "Section 2 heading", required: false },
      section2Body: { type: "string", description: "Section 2 body", required: false },
      cta: { type: "string", description: "CTA button text", required: false },
      phone: { type: "string", description: "Phone number", required: false },
      website: { type: "string", description: "Website URL", required: false },
      address: { type: "string", description: "Physical address", required: false },
    },
  },
];

const BROCHURE_FIELD_MAP: Record<string, string> = {
  companyName: "bro-company-name",
  coverTitle: "bro-cover-title",
  coverBody: "bro-cover-body",
  tagline: "bro-tagline",
  section1Heading: "bro-section-1-heading",
  section1Body: "bro-section-1-body",
  section2Heading: "bro-section-2-heading",
  section2Body: "bro-section-2-body",
  cta: "bro-cta",
  phone: "bro-phone",
  website: "bro-website",
  address: "bro-address",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_brochure_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(BROCHURE_FIELD_MAP)) {
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

export function createBrochureFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "brochure",
    toolName: "Brochure Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(BROCHURE_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { brochureFields: fields };
    },
  });
}
