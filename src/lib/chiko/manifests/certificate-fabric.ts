// =============================================================================
// DMSuite — Chiko Action Manifest: Certificate Designer (Fabric.js)
//
// Uses the universal createFabricManifest() factory from chiko-bridge.ts,
// adding certificate-specific actions for quick-edit fields.
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";

// ── Certificate-specific extra actions ──────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_certificate_details",
    description: "Update certificate text fields: org, title, subtitle, recipient, description, date, ref, and seal text.",
    category: "certificate",
    parameters: {
      org: { type: "string", description: "Organization name", required: false },
      title: { type: "string", description: "Certificate title (e.g. CERTIFICATE OF ACHIEVEMENT)", required: false },
      subtitle: { type: "string", description: "Subtitle text", required: false },
      recipient: { type: "string", description: "Recipient full name", required: false },
      description: { type: "string", description: "Certificate description/body text", required: false },
      date: { type: "string", description: "Date issued text", required: false },
      ref: { type: "string", description: "Reference number text", required: false },
      sealText: { type: "string", description: "Seal inscription text", required: false },
    },
  },
  {
    name: "update_signatories",
    description: "Update signatory names and titles. Supports up to 3 signatories (indices 0, 1, 2).",
    category: "certificate",
    parameters: {
      signatories: {
        type: "string",
        description: 'JSON array of objects [{name, title}] for up to 3 signatories',
        required: true,
      },
    },
  },
];

// ── Field mapping ───────────────────────────────────────────────────────────

const CERT_FIELD_MAP: Record<string, string> = {
  org: "cert-org",
  title: "cert-title",
  subtitle: "cert-subtitle",
  recipient: "cert-recipient",
  description: "cert-description",
  date: "cert-date",
  ref: "cert-ref",
  sealText: "cert-seal-text",
};

// ── Extra execute handler ───────────────────────────────────────────────────

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName === "update_certificate_details") {
    const updated: string[] = [];

    for (const [field, layerName] of Object.entries(CERT_FIELD_MAP)) {
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

  if (actionName === "update_signatories") {
    try {
      const raw = params.signatories;
      const signatories: { name?: string; title?: string }[] =
        typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];

      const updated: string[] = [];

      for (let i = 0; i < Math.min(signatories.length, 3); i++) {
        const sig = signatories[i];

        if (sig.name) {
          const obj = findObjectByName(editor.canvas, `cert-signatory-${i}-name`);
          if (obj && "set" in obj) {
            (obj as fabric.Textbox).set("text", sig.name);
            updated.push(`signatory-${i}-name`);
          }
        }

        if (sig.title) {
          const obj = findObjectByName(editor.canvas, `cert-signatory-${i}-title`);
          if (obj && "set" in obj) {
            (obj as fabric.Textbox).set("text", sig.title);
            updated.push(`signatory-${i}-title`);
          }
        }
      }

      if (updated.length > 0) {
        editor.canvas.renderAll();
        return { success: true, message: `Updated: ${updated.join(", ")}` };
      }

      return { success: false, message: "No signatory fields updated" };
    } catch {
      return { success: false, message: "Invalid signatories format" };
    }
  }

  return null;
}

// ── Factory ─────────────────────────────────────────────────────────────────

import { fabric } from "fabric";

export function createCertificateFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "certificate",
    toolName: "Certificate Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};

      for (const [field, layerName] of Object.entries(CERT_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }

      // Collect signatories
      const signatories: { name: string; title: string }[] = [];
      for (let i = 0; i < 3; i++) {
        const nameObj = findObjectByName(editor.canvas, `cert-signatory-${i}-name`);
        const titleObj = findObjectByName(editor.canvas, `cert-signatory-${i}-title`);
        if (nameObj && "text" in nameObj) {
          signatories.push({
            name: (nameObj as fabric.Textbox).text || "",
            title: titleObj && "text" in titleObj ? (titleObj as fabric.Textbox).text || "" : "",
          });
        }
      }

      return { certificateFields: fields, signatories };
    },
  });
}
