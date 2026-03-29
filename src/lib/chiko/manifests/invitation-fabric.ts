// =============================================================================
// DMSuite — Chiko Action Manifest: Invitation Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Invitation-specific extra actions ───────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_invitation_details",
    description: "Update invitation text fields: host names, event title, subtitle, date, time, venue, address, city, dress code, RSVP info.",
    category: "invitation",
    parameters: {
      hostNames: { type: "string", description: "Host names", required: false },
      eventTitle: { type: "string", description: "Event title", required: false },
      eventSubtitle: { type: "string", description: "Event subtitle", required: false },
      date: { type: "string", description: "Event date", required: false },
      time: { type: "string", description: "Event time", required: false },
      venue: { type: "string", description: "Venue name", required: false },
      venueAddress: { type: "string", description: "Venue address", required: false },
      city: { type: "string", description: "City", required: false },
      dressCode: { type: "string", description: "Dress code", required: false },
      additionalInfo: { type: "string", description: "Additional information", required: false },
      rsvpPhone: { type: "string", description: "RSVP phone number", required: false },
      rsvpEmail: { type: "string", description: "RSVP email", required: false },
      rsvpDeadline: { type: "string", description: "RSVP deadline", required: false },
    },
  },
];

const INVITATION_FIELD_MAP: Record<string, string> = {
  hostNames: "inv-host-names",
  eventTitle: "inv-event-title",
  eventSubtitle: "inv-event-subtitle",
  date: "inv-date",
  time: "inv-time",
  venue: "inv-venue",
  venueAddress: "inv-venue-address",
  city: "inv-city",
  dressCode: "inv-dress-code",
  additionalInfo: "inv-additional-info",
  rsvpPhone: "inv-rsvp-phone",
  rsvpEmail: "inv-rsvp-email",
  rsvpDeadline: "inv-rsvp-deadline",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_invitation_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(INVITATION_FIELD_MAP)) {
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

export function createInvitationFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "invitation-designer",
    toolName: "Invitation Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(INVITATION_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { invitationFields: fields };
    },
  });
}
