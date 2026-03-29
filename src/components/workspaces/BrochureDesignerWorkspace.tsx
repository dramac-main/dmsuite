// =============================================================================
// DMSuite — Brochure Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for brochure design.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { BROCHURE_FABRIC_TEMPLATES } from "@/data/brochure-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";
import { createBrochureFabricManifest } from "@/lib/chiko/manifests/brochure-fabric";

// ── Quick-edit fields for brochure details ──────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "company-name", label: "Company Name", type: "text", targetLayer: "bro-company-name", placeholder: "DMSUITE SOLUTIONS" },
  { key: "cover-title", label: "Cover Title", type: "text", targetLayer: "bro-cover-title", placeholder: "Transform Your Business" },
  { key: "cover-body", label: "Cover Body", type: "text", targetLayer: "bro-cover-body", placeholder: "Description text..." },
  { key: "tagline", label: "Tagline", type: "text", targetLayer: "bro-tagline", placeholder: "Innovation · Excellence · Growth" },
  { key: "section-1-heading", label: "Section 1 Heading", type: "text", targetLayer: "bro-section-1-heading", placeholder: "Our Services" },
  { key: "section-1-body", label: "Section 1 Body", type: "text", targetLayer: "bro-section-1-body", placeholder: "Service details..." },
  { key: "section-2-heading", label: "Section 2 Heading", type: "text", targetLayer: "bro-section-2-heading", placeholder: "Why Choose Us" },
  { key: "section-2-body", label: "Section 2 Body", type: "text", targetLayer: "bro-section-2-body", placeholder: "Benefits..." },
  { key: "cta", label: "CTA Button", type: "text", targetLayer: "bro-cta", placeholder: "GET IN TOUCH" },
  { key: "phone", label: "Phone", type: "text", targetLayer: "bro-phone", placeholder: "+260 977 123 456" },
  { key: "website", label: "Website", type: "text", targetLayer: "bro-website", placeholder: "www.dmsuite.com" },
  { key: "address", label: "Address", type: "text", targetLayer: "bro-address", placeholder: "Plot 1234, Cairo Road, Lusaka" },
];

// ── Editor config — A4 landscape (842 × 595 px) ────────────────────────────
const BROCHURE_CONFIG: FabricEditorConfig = {
  toolId: "brochure",
  defaultWidth: 842,
  defaultHeight: 595,
  templates: BROCHURE_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function BrochureDesignerWorkspace() {
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
        config={BROCHURE_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createBrochureFabricManifest}
      />
    </div>
  );
}
