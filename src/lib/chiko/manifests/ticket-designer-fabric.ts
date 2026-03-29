// =============================================================================
// DMSuite — Chiko Action Manifest: Ticket & Pass Designer (Fabric.js)
//
// Uses the universal createFabricManifest() factory from chiko-bridge.ts,
// adding ticket-specific actions for quick-edit fields.
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";

// ── Ticket-specific extra actions ───────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_ticket_details",
    description: "Update ticket text fields: event name, subtitle, venue, date, time, seating, price, attendee, organizer, serial.",
    category: "ticket",
    parameters: {
      eventName: { type: "string", description: "Event name", required: false },
      eventSubtitle: { type: "string", description: "Event subtitle/tour name", required: false },
      venue: { type: "string", description: "Venue name", required: false },
      date: { type: "string", description: "Event date", required: false },
      time: { type: "string", description: "Event time", required: false },
      section: { type: "string", description: "Seating section", required: false },
      row: { type: "string", description: "Seating row", required: false },
      seat: { type: "string", description: "Seat number", required: false },
      gate: { type: "string", description: "Gate identifier", required: false },
      price: { type: "string", description: "Ticket price", required: false },
      attendee: { type: "string", description: "Attendee name", required: false },
      organizer: { type: "string", description: "Organizer name", required: false },
      serial: { type: "string", description: "Serial / ticket number", required: false },
    },
  },
];

// ── Field mapping ───────────────────────────────────────────────────────────

const TICKET_FIELD_MAP: Record<string, string> = {
  eventName: "tkt-event-name",
  eventSubtitle: "tkt-event-subtitle",
  venue: "tkt-venue",
  date: "tkt-date",
  time: "tkt-time",
  section: "tkt-section",
  row: "tkt-row",
  seat: "tkt-seat",
  gate: "tkt-gate",
  price: "tkt-price",
  attendee: "tkt-attendee",
  organizer: "tkt-organizer",
  serial: "tkt-serial",
};

// ── Extra execute handler ───────────────────────────────────────────────────

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_ticket_details") return null;

  const updated: string[] = [];

  for (const [field, layerName] of Object.entries(TICKET_FIELD_MAP)) {
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

import { fabric } from "fabric";

export function createTicketDesignerFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "ticket-designer",
    toolName: "Ticket & Pass Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};

      for (const [field, layerName] of Object.entries(TICKET_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }

      return { ticketFields: fields };
    },
  });
}
