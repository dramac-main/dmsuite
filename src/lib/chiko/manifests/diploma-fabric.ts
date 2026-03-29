// =============================================================================
// DMSuite — Chiko Action Manifest: Diploma & Accreditation Designer (Fabric.js)
//
// Uses the universal createFabricManifest() factory from chiko-bridge.ts,
// adding diploma-specific actions for quick-edit fields and signatories.
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";

// ── Diploma-specific extra actions ──────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_diploma_details",
    description: "Update diploma text fields: institution, recipient, program, field, honors, dates, accreditation, serial numbers.",
    category: "diploma",
    parameters: {
      institution: { type: "string", description: "Institution name", required: false },
      institutionSubtitle: { type: "string", description: "Faculty / school name", required: false },
      institutionMotto: { type: "string", description: "Institutional motto", required: false },
      recipient: { type: "string", description: "Recipient full name", required: false },
      recipientId: { type: "string", description: "Student ID", required: false },
      program: { type: "string", description: "Degree / program name", required: false },
      fieldOfStudy: { type: "string", description: "Field of study", required: false },
      honors: { type: "string", description: "Honors designation", required: false },
      conferral: { type: "string", description: "Conferral text", required: false },
      resolution: { type: "string", description: "Resolution text", required: false },
      dateConferred: { type: "string", description: "Date conferred", required: false },
      graduationDate: { type: "string", description: "Graduation date", required: false },
      accreditationBody: { type: "string", description: "Accreditation body", required: false },
      accreditationNumber: { type: "string", description: "Accreditation number", required: false },
      registration: { type: "string", description: "Registration number", required: false },
      serial: { type: "string", description: "Serial number", required: false },
    },
  },
  {
    name: "update_signatories",
    description: "Update diploma signatory names and titles. Accepts a JSON array of up to 2 signatories.",
    category: "diploma",
    parameters: {
      signatories: { type: "string", description: 'JSON array of {name, title} objects, e.g. [{"name":"Dr. Smith","title":"Chancellor"},{"name":"J. Doe","title":"Registrar"}]', required: true },
    },
  },
];

// ── Field mapping ───────────────────────────────────────────────────────────

const DIPLOMA_FIELD_MAP: Record<string, string> = {
  institution: "dip-institution",
  institutionSubtitle: "dip-institution-subtitle",
  institutionMotto: "dip-institution-motto",
  recipient: "dip-recipient",
  recipientId: "dip-recipient-id",
  program: "dip-program",
  fieldOfStudy: "dip-field-of-study",
  honors: "dip-honors",
  conferral: "dip-conferral",
  resolution: "dip-resolution",
  dateConferred: "dip-date-conferred",
  graduationDate: "dip-graduation-date",
  accreditationBody: "dip-accreditation-body",
  accreditationNumber: "dip-accreditation-number",
  registration: "dip-registration",
  serial: "dip-serial",
};

// ── Extra execute handler ───────────────────────────────────────────────────

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName === "update_diploma_details") {
    const updated: string[] = [];

    for (const [field, layerName] of Object.entries(DIPLOMA_FIELD_MAP)) {
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
    return { success: false, message: "No recognised fields provided." };
  }

  if (actionName === "update_signatories") {
    const raw = params.signatories;
    if (typeof raw !== "string") return { success: false, message: "signatories must be a JSON string." };

    let signatories: { name: string; title: string }[];
    try {
      signatories = JSON.parse(raw);
    } catch {
      return { success: false, message: "Invalid JSON for signatories." };
    }

    if (!Array.isArray(signatories)) return { success: false, message: "signatories must be an array." };

    const updated: string[] = [];
    const max = Math.min(signatories.length, 2);
    for (let i = 0; i < max; i++) {
      const s = signatories[i];
      if (s.name) {
        const nameObj = findObjectByName(editor.canvas, `dip-signatory-${i}-name`);
        if (nameObj && "set" in nameObj) {
          (nameObj as fabric.Textbox).set("text", s.name);
          updated.push(`signatory-${i}-name`);
        }
      }
      if (s.title) {
        const titleObj = findObjectByName(editor.canvas, `dip-signatory-${i}-title`);
        if (titleObj && "set" in titleObj) {
          (titleObj as fabric.Textbox).set("text", s.title);
          updated.push(`signatory-${i}-title`);
        }
      }
    }

    if (updated.length > 0) {
      editor.canvas.renderAll();
      return { success: true, message: `Updated signatories: ${updated.join(", ")}` };
    }
    return { success: false, message: "No signatory fields updated." };
  }

  return null;
}

// ── Factory ─────────────────────────────────────────────────────────────────

import { fabric } from "fabric";

export function createDiplomaFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "diploma-designer",
    toolName: "Diploma & Accreditation Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};

      for (const [field, layerName] of Object.entries(DIPLOMA_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }

      // Include signatories
      for (let i = 0; i < 2; i++) {
        const nameObj = findObjectByName(editor.canvas, `dip-signatory-${i}-name`);
        const titleObj = findObjectByName(editor.canvas, `dip-signatory-${i}-title`);
        if (nameObj && "text" in nameObj) fields[`signatory${i}Name`] = (nameObj as fabric.Textbox).text || "";
        if (titleObj && "text" in titleObj) fields[`signatory${i}Title`] = (titleObj as fabric.Textbox).text || "";
      }

      return { diplomaFields: fields };
    },
  });
}
