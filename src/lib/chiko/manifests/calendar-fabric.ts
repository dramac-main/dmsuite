// =============================================================================
// DMSuite — Chiko Action Manifest: Calendar Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Calendar-specific extra actions ─────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_calendar_details",
    description: "Update calendar text fields: title, subtitle, monthLabel, yearLabel, footerText.",
    category: "calendar",
    parameters: {
      title: { type: "string", description: "Calendar title", required: false },
      subtitle: { type: "string", description: "Subtitle / tagline", required: false },
      monthLabel: { type: "string", description: "Month label (e.g. MARCH)", required: false },
      yearLabel: { type: "string", description: "Year label (e.g. 2026)", required: false },
      footerText: { type: "string", description: "Footer text", required: false },
    },
  },
];

const CALENDAR_FIELD_MAP: Record<string, string> = {
  title: "cal-title",
  subtitle: "cal-subtitle",
  monthLabel: "cal-month-label",
  yearLabel: "cal-year-label",
  footerText: "cal-footer-text",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_calendar_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(CALENDAR_FIELD_MAP)) {
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

export function createCalendarFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "calendar-designer",
    toolName: "Calendar Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(CALENDAR_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { calendarFields: fields };
    },
  });
}
