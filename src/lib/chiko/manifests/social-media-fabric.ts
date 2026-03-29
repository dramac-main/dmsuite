// =============================================================================
// DMSuite — Chiko Action Manifest: Social Media Post Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Social media-specific extra actions ─────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_post_details",
    description: "Update social media post text fields: headline, subtext, body, label, CTA, date, hashtags, brand, handle.",
    category: "social",
    parameters: {
      headline: { type: "string", description: "Main headline", required: false },
      subtext: { type: "string", description: "Supporting text", required: false },
      body: { type: "string", description: "Body copy", required: false },
      label: { type: "string", description: "Label / tag", required: false },
      cta: { type: "string", description: "CTA button text", required: false },
      date: { type: "string", description: "Date text", required: false },
      hashtag: { type: "string", description: "Hashtags", required: false },
      brand: { type: "string", description: "Brand name", required: false },
      handle: { type: "string", description: "Social handle", required: false },
    },
  },
];

const POST_FIELD_MAP: Record<string, string> = {
  headline: "smp-headline",
  subtext: "smp-subtext",
  body: "smp-body",
  label: "smp-label",
  cta: "smp-cta",
  date: "smp-date",
  hashtag: "smp-hashtag",
  brand: "smp-brand",
  handle: "smp-handle",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_post_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(POST_FIELD_MAP)) {
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

export function createSocialMediaFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "social-media-post",
    toolName: "Social Media Post Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(POST_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { postFields: fields };
    },
  });
}
