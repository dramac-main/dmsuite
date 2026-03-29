// =============================================================================
// DMSuite — Business Card Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for business card design.
// Replaces the legacy 6-step wizard with a direct canvas editor.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { BUSINESS_CARD_TEMPLATES } from "@/data/business-card-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";
import { createBusinessCardFabricManifest } from "@/lib/chiko/manifests/business-card-fabric";

// ── Quick-edit fields for business card details ─────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "name", label: "Full Name", type: "text", targetLayer: "bc-name", placeholder: "Your Name" },
  { key: "title", label: "Job Title", type: "text", targetLayer: "bc-title", placeholder: "Job Title" },
  { key: "company", label: "Company", type: "text", targetLayer: "bc-company", placeholder: "Company Name" },
  { key: "phone", label: "Phone", type: "text", targetLayer: "bc-phone", placeholder: "+1 (555) 000-0000" },
  { key: "email", label: "Email", type: "text", targetLayer: "bc-email", placeholder: "name@company.com" },
  { key: "website", label: "Website", type: "text", targetLayer: "bc-website", placeholder: "www.company.com" },
  { key: "address", label: "Address", type: "text", targetLayer: "bc-address", placeholder: "123 Business St, City" },
];

// ── Editor config ───────────────────────────────────────────────────────────
// Standard business card: 1050 × 600 px (3.5 × 2 in @ 300 DPI)
const BUSINESS_CARD_CONFIG: FabricEditorConfig = {
  toolId: "business-card",
  defaultWidth: 1050,
  defaultHeight: 600,
  templates: BUSINESS_CARD_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function BusinessCardWorkspace() {
  const { fabricJson, setFabricState } = useFabricProjectStore();
  const hasDispatchedRef = useRef(false);

  // Dispatch progress milestones on mount
  useEffect(() => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;
    // Editor is immediately active — fire content milestone
    window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { progress: 70 } }));
    window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "content" } }));
  }, []);

  // Save callback — stores Fabric JSON in the project store for persistence
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
        config={BUSINESS_CARD_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createBusinessCardFabricManifest}
      />
    </div>
  );
}
