// =============================================================================
// DMSuite — Chiko Action Manifest: Coupon & Gift Voucher Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest } from "@/lib/fabric-editor";
import { findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Coupon-specific extra actions ───────────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_coupon_details",
    description: "Update coupon/voucher text fields: businessName, headline, discountValue, discountLabel, description, couponCode, expiryDate, terms.",
    category: "coupon",
    parameters: {
      businessName: { type: "string", description: "Business name", required: false },
      headline: { type: "string", description: "Headline text", required: false },
      discountValue: { type: "string", description: "Discount value (e.g. 25%)", required: false },
      discountLabel: { type: "string", description: "Discount label (e.g. OFF)", required: false },
      description: { type: "string", description: "Description text", required: false },
      couponCode: { type: "string", description: "Coupon code", required: false },
      expiryDate: { type: "string", description: "Expiry date text", required: false },
      terms: { type: "string", description: "Terms and conditions", required: false },
    },
  },
];

const COUPON_FIELD_MAP: Record<string, string> = {
  businessName: "cpn-business-name",
  headline: "cpn-headline",
  discountValue: "cpn-discount-value",
  discountLabel: "cpn-discount-label",
  description: "cpn-description",
  couponCode: "cpn-coupon-code",
  expiryDate: "cpn-expiry-date",
  terms: "cpn-terms",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_coupon_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(COUPON_FIELD_MAP)) {
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

export function createCouponFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "gift-voucher",
    toolName: "Coupon & Gift Voucher Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(COUPON_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { couponFields: fields };
    },
  });
}
