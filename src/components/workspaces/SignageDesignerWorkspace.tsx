// =============================================================================
// DMSuite — Signage & Large Format Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for signage design.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { SIGNAGE_FABRIC_TEMPLATES } from "@/data/signage-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";

// ── Quick-edit fields for signage details ───────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "headline", label: "Headline", type: "text", targetLayer: "sgn-headline", placeholder: "GRAND OPENING" },
  { key: "subheadline", label: "Subheadline", type: "text", targetLayer: "sgn-subheadline", placeholder: "Now Open in Lusaka" },
  { key: "body-text", label: "Body Text", type: "text", targetLayer: "sgn-body-text", placeholder: "Visit our new store..." },
  { key: "cta-text", label: "CTA Button", type: "text", targetLayer: "sgn-cta-text", placeholder: "VISIT TODAY" },
  { key: "business-name", label: "Business Name", type: "text", targetLayer: "sgn-business-name", placeholder: "DMSuite Store" },
  { key: "phone", label: "Phone", type: "text", targetLayer: "sgn-phone", placeholder: "+260 977 123 456" },
  { key: "website", label: "Website", type: "text", targetLayer: "sgn-website", placeholder: "www.dmsuite.com" },
  { key: "address", label: "Address", type: "text", targetLayer: "sgn-address", placeholder: "Plot 123, Cairo Road, Lusaka" },
];

// ── Editor config — Pull-up banner (425 × 1000 px) ─────────────────────────
const SIGNAGE_CONFIG: FabricEditorConfig = {
  toolId: "signage",
  defaultWidth: 425,
  defaultHeight: 1000,
  templates: SIGNAGE_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function SignageDesignerWorkspace() {
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
        config={SIGNAGE_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
      />
    </div>
  );
}
