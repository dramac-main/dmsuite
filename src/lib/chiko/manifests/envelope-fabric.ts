// =============================================================================
// DMSuite — Chiko Action Manifest: Envelope Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Envelope-specific extra actions ─────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_envelope_details",
    description: "Update envelope text fields: companyName, returnAddress, recipientName, recipientAddress.",
    category: "envelope",
    parameters: {
      companyName: { type: "string", description: "Company / sender name", required: false },
      returnAddress: { type: "string", description: "Return address", required: false },
      recipientName: { type: "string", description: "Recipient name", required: false },
      recipientAddress: { type: "string", description: "Recipient address", required: false },
    },
  },
];

const ENVELOPE_FIELD_MAP: Record<string, string> = {
  companyName: "env-company-name",
  returnAddress: "env-return-address",
  recipientName: "env-recipient-name",
  recipientAddress: "env-recipient-address",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_envelope_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(ENVELOPE_FIELD_MAP)) {
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

export function createEnvelopeFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "envelope",
    toolName: "Envelope Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(ENVELOPE_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { envelopeFields: fields };
    },
  });
}
