// =============================================================================
// DMSuite — Chiko Action Manifest: Infographic Maker (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Infographic-specific extra actions ──────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_infographic_details",
    description: "Update infographic text fields: title, subtitle, stat values/labels, step labels, footer.",
    category: "infographic",
    parameters: {
      title: { type: "string", description: "Main title", required: false },
      subtitle: { type: "string", description: "Subtitle text", required: false },
      stat1Value: { type: "string", description: "Stat 1 value", required: false },
      stat1Label: { type: "string", description: "Stat 1 label", required: false },
      stat2Value: { type: "string", description: "Stat 2 value", required: false },
      stat2Label: { type: "string", description: "Stat 2 label", required: false },
      stat3Value: { type: "string", description: "Stat 3 value", required: false },
      stat3Label: { type: "string", description: "Stat 3 label", required: false },
      step1: { type: "string", description: "Step 1 text", required: false },
      step2: { type: "string", description: "Step 2 text", required: false },
      step3: { type: "string", description: "Step 3 text", required: false },
      footer: { type: "string", description: "Footer text", required: false },
    },
  },
];

const INFOGRAPHIC_FIELD_MAP: Record<string, string> = {
  title: "inf-title",
  subtitle: "inf-subtitle",
  stat1Value: "inf-stat-1-value",
  stat1Label: "inf-stat-1-label",
  stat2Value: "inf-stat-2-value",
  stat2Label: "inf-stat-2-label",
  stat3Value: "inf-stat-3-value",
  stat3Label: "inf-stat-3-label",
  step1: "inf-step-1",
  step2: "inf-step-2",
  step3: "inf-step-3",
  footer: "inf-footer",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_infographic_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(INFOGRAPHIC_FIELD_MAP)) {
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

export function createInfographicFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "infographic",
    toolName: "Infographic Maker",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(INFOGRAPHIC_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { infographicFields: fields };
    },
  });
}
