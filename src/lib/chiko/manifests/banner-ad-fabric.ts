// =============================================================================
// DMSuite — Chiko Action Manifest: Banner Ad Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Banner-specific extra actions ───────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_banner_details",
    description: "Update banner ad text fields: headline, subtext, ctaText, brandName.",
    category: "banner",
    parameters: {
      headline: { type: "string", description: "Main headline text", required: false },
      subtext: { type: "string", description: "Supporting subtext", required: false },
      ctaText: { type: "string", description: "CTA button text", required: false },
      brandName: { type: "string", description: "Brand name", required: false },
    },
  },
];

const BANNER_FIELD_MAP: Record<string, string> = {
  headline: "ban-headline",
  subtext: "ban-subtext",
  ctaText: "ban-cta-text",
  brandName: "ban-brand-name",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_banner_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(BANNER_FIELD_MAP)) {
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

export function createBannerAdFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "banner-ad",
    toolName: "Banner Ad Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(BANNER_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { bannerFields: fields };
    },
  });
}
