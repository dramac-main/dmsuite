// =============================================================================
// DMSuite — Coupon & Gift Voucher Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for coupon/voucher design.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { COUPON_FABRIC_TEMPLATES } from "@/data/coupon-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";
import { createCouponFabricManifest } from "@/lib/chiko/manifests/coupon-fabric";

// ── Quick-edit fields for coupon details ────────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "business-name", label: "Business Name", type: "text", targetLayer: "cpn-business-name", placeholder: "DMSuite Store" },
  { key: "headline", label: "Headline", type: "text", targetLayer: "cpn-headline", placeholder: "SPECIAL OFFER" },
  { key: "discount-value", label: "Discount Value", type: "text", targetLayer: "cpn-discount-value", placeholder: "25%" },
  { key: "discount-label", label: "Discount Label", type: "text", targetLayer: "cpn-discount-label", placeholder: "OFF" },
  { key: "description", label: "Description", type: "text", targetLayer: "cpn-description", placeholder: "On all products..." },
  { key: "coupon-code", label: "Coupon Code", type: "text", targetLayer: "cpn-coupon-code", placeholder: "DMS-A7K3X2" },
  { key: "expiry-date", label: "Expiry Date", type: "text", targetLayer: "cpn-expiry-date", placeholder: "Valid until: 30 April 2026" },
  { key: "terms", label: "Terms", type: "text", targetLayer: "cpn-terms", placeholder: "Terms & conditions..." },
];

// ── Editor config — 900 × 400 px (standard coupon) ─────────────────────────
const COUPON_CONFIG: FabricEditorConfig = {
  toolId: "gift-voucher",
  defaultWidth: 900,
  defaultHeight: 400,
  templates: COUPON_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function CouponDesignerWorkspace() {
  const { fabricJson, setFabricState } = useFabricProjectStore();
  const hasDispatchedRef = useRef(false);

  useEffect(() => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;
    window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { progress: 70 } }));
    window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "content" } }));
  }, []);

  const handleSave = useCallback(
    (json: string, width: number, height: number) => {
      setFabricState(json, width, height);
      window.dispatchEvent(new CustomEvent("workspace:dirty"));
    },
    [setFabricState],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <FabricEditor
        config={COUPON_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createCouponFabricManifest}
      />
    </div>
  );
}
