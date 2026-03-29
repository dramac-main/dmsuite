// =============================================================================
// DMSuite — Chiko Action Manifest: ID Badge & Lanyard Designer (Fabric.js)
//
// Uses the universal createFabricManifest() factory from chiko-bridge.ts,
// adding badge-specific actions for quick-edit fields.
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";

// ── Badge-specific extra actions ────────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_badge_details",
    description: "Update ID badge text fields: organization, person info, role, employee ID, contact, dates, signatory.",
    category: "id-badge",
    parameters: {
      orgName: { type: "string", description: "Organization name", required: false },
      orgSubtitle: { type: "string", description: "Department / division subtitle", required: false },
      firstName: { type: "string", description: "First name", required: false },
      lastName: { type: "string", description: "Last name", required: false },
      title: { type: "string", description: "Job title", required: false },
      department: { type: "string", description: "Department", required: false },
      role: { type: "string", description: "Role badge text (e.g. STAFF, VIP)", required: false },
      employeeId: { type: "string", description: "Employee ID (e.g. ID: EMP-0001)", required: false },
      accessLevel: { type: "string", description: "Access level (e.g. Access: Level 1)", required: false },
      email: { type: "string", description: "Email address", required: false },
      phone: { type: "string", description: "Phone number", required: false },
      issueDate: { type: "string", description: "Issue date", required: false },
      expiryDate: { type: "string", description: "Expiry date", required: false },
      signatoryName: { type: "string", description: "Authorized signatory name", required: false },
      signatoryTitle: { type: "string", description: "Signatory title", required: false },
    },
  },
];

// ── Field mapping ───────────────────────────────────────────────────────────

const BADGE_FIELD_MAP: Record<string, string> = {
  orgName: "badge-org-name",
  orgSubtitle: "badge-org-subtitle",
  firstName: "badge-first-name",
  lastName: "badge-last-name",
  title: "badge-title",
  department: "badge-department",
  role: "badge-role",
  employeeId: "badge-employee-id",
  accessLevel: "badge-access-level",
  email: "badge-email",
  phone: "badge-phone",
  issueDate: "badge-issue-date",
  expiryDate: "badge-expiry-date",
  signatoryName: "badge-signatory-name",
  signatoryTitle: "badge-signatory-title",
};

// ── Extra execute handler ───────────────────────────────────────────────────

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_badge_details") return null;

  const updated: string[] = [];

  for (const [field, layerName] of Object.entries(BADGE_FIELD_MAP)) {
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

// ── Factory ─────────────────────────────────────────────────────────────────

import { fabric } from "fabric";

export function createIDBadgeFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "id-badge",
    toolName: "ID Badge & Lanyard Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};

      for (const [field, layerName] of Object.entries(BADGE_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }

      return { badgeFields: fields };
    },
  });
}
