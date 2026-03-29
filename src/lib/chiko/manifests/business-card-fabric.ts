// =============================================================================
// DMSuite — Chiko Action Manifest: Business Card Designer (Fabric.js)
//
// Uses the universal createFabricManifest() factory from chiko-bridge.ts,
// adding business-card-specific actions for quick-edit fields.
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";

// ── Business-card-specific extra actions ────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_contact_details",
    description: "Update one or more contact fields on the business card (name, title, company, phone, email, website, address).",
    category: "business-card",
    parameters: {
      name: { type: "string", description: "Full name", required: false },
      title: { type: "string", description: "Job title", required: false },
      company: { type: "string", description: "Company name", required: false },
      phone: { type: "string", description: "Phone number", required: false },
      email: { type: "string", description: "Email address", required: false },
      website: { type: "string", description: "Website URL", required: false },
      address: { type: "string", description: "Physical address", required: false },
    },
  },
];

// ── Extra execute handler ───────────────────────────────────────────────────

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_contact_details") return null;

  const fieldMap: Record<string, string> = {
    name: "bc-name",
    title: "bc-title",
    company: "bc-company",
    phone: "bc-phone",
    email: "bc-email",
    website: "bc-website",
    address: "bc-address",
  };

  const updated: string[] = [];

  for (const [field, layerName] of Object.entries(fieldMap)) {
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

// Need fabric import for the Textbox type reference above
import { fabric } from "fabric";

export function createBusinessCardFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "business-card",
    toolName: "Business Card Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      // Expose current business card field values
      const fields: Record<string, string> = {};
      const fieldMap: Record<string, string> = {
        name: "bc-name",
        title: "bc-title",
        company: "bc-company",
        phone: "bc-phone",
        email: "bc-email",
        website: "bc-website",
        address: "bc-address",
      };
      for (const [field, layerName] of Object.entries(fieldMap)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { contactFields: fields };
    },
  });
}
