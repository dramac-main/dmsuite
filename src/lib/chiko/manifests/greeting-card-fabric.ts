// =============================================================================
// DMSuite — Chiko Action Manifest: Greeting Card Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Greeting card-specific extra actions ────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_card_details",
    description: "Update greeting card text fields: title, subtitle, occasion label, recipient, message, sender, footer.",
    category: "greeting-card",
    parameters: {
      title: { type: "string", description: "Card title / greeting", required: false },
      subtitle: { type: "string", description: "Subtitle text", required: false },
      occasionLabel: { type: "string", description: "Occasion label (e.g. CELEBRATION)", required: false },
      recipient: { type: "string", description: "Recipient line (e.g. Dear Chanda,)", required: false },
      message: { type: "string", description: "Message body", required: false },
      sender: { type: "string", description: "Sender line", required: false },
      footerNote: { type: "string", description: "Footer note", required: false },
    },
  },
];

const CARD_FIELD_MAP: Record<string, string> = {
  title: "gc-title",
  subtitle: "gc-subtitle",
  occasionLabel: "gc-occasion-label",
  recipient: "gc-recipient",
  message: "gc-message",
  sender: "gc-sender",
  footerNote: "gc-footer-note",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_card_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(CARD_FIELD_MAP)) {
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

export function createGreetingCardFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "greeting-card",
    toolName: "Greeting Card Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(CARD_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { cardFields: fields };
    },
  });
}
