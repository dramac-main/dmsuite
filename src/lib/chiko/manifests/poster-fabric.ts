// =============================================================================
// DMSuite — Chiko Action Manifest: Poster & Flyer Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Poster-specific extra actions ───────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_poster_details",
    description: "Update poster/flyer text fields: headline, subtext, label, event date, venue, CTA, description, organizer, brand, footer.",
    category: "poster",
    parameters: {
      headline: { type: "string", description: "Main headline text", required: false },
      subtext: { type: "string", description: "Supporting text", required: false },
      label: { type: "string", description: "Label / category tag", required: false },
      eventDate: { type: "string", description: "Event date", required: false },
      venue: { type: "string", description: "Venue name", required: false },
      cta: { type: "string", description: "CTA button text", required: false },
      description: { type: "string", description: "Body description text", required: false },
      organizer: { type: "string", description: "Organizer name", required: false },
      brand: { type: "string", description: "Brand name", required: false },
      footerNote: { type: "string", description: "Footer note text", required: false },
    },
  },
];

const POSTER_FIELD_MAP: Record<string, string> = {
  headline: "pst-headline",
  subtext: "pst-subtext",
  label: "pst-label",
  eventDate: "pst-event-date",
  venue: "pst-venue",
  cta: "pst-cta",
  description: "pst-description",
  organizer: "pst-organizer",
  brand: "pst-brand",
  footerNote: "pst-footer-note",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_poster_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(POSTER_FIELD_MAP)) {
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

export function createPosterFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "poster",
    toolName: "Poster & Flyer Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(POSTER_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { posterFields: fields };
    },
  });
}
