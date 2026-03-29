// =============================================================================
// DMSuite — Letterhead Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for letterhead design.
// Default canvas: A4 portrait 595 × 842 px.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { LETTERHEAD_FABRIC_TEMPLATES } from "@/data/letterhead-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";
import { createLetterheadFabricManifest } from "@/lib/chiko/manifests/letterhead-fabric";

// ── Quick-edit fields for letterhead details ────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "company-name", label: "Company Name", type: "text", targetLayer: "lh-company-name", placeholder: "DMSuite Solutions" },
  { key: "tagline", label: "Tagline", type: "text", targetLayer: "lh-tagline", placeholder: "AI-Powered Design Excellence" },
  { key: "address", label: "Address", type: "text", targetLayer: "lh-address", placeholder: "Plot 1234, Cairo Road, Lusaka" },
  { key: "phone", label: "Phone", type: "text", targetLayer: "lh-phone", placeholder: "+260 97 1234567" },
  { key: "email", label: "Email", type: "text", targetLayer: "lh-email", placeholder: "info@dmsuite.com" },
  { key: "website", label: "Website", type: "text", targetLayer: "lh-website", placeholder: "www.dmsuite.com" },
  { key: "footer-info", label: "Footer Info", type: "text", targetLayer: "lh-footer-info", placeholder: "Full contact line..." },
];

// ── Editor config — A4 portrait (595 × 842 px) ─────────────────────────────
const LETTERHEAD_CONFIG: FabricEditorConfig = {
  toolId: "letterhead",
  defaultWidth: 595,
  defaultHeight: 842,
  templates: LETTERHEAD_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function LetterheadDesignerWorkspace() {
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
        config={LETTERHEAD_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createLetterheadFabricManifest}
      />
    </div>
  );
}
