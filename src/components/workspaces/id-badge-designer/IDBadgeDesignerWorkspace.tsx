// =============================================================================
// DMSuite — ID Badge & Lanyard Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for ID badge design.
// Replaces the legacy tab-based workspace with a direct canvas editor.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { ID_BADGE_FABRIC_TEMPLATES } from "@/data/id-badge-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";

// ── Quick-edit fields for badge details ─────────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "org-name", label: "Organization", type: "text", targetLayer: "badge-org-name", placeholder: "Organization Name" },
  { key: "org-subtitle", label: "Dept / Division", type: "text", targetLayer: "badge-org-subtitle", placeholder: "Department / Division" },
  { key: "first-name", label: "First Name", type: "text", targetLayer: "badge-first-name", placeholder: "First Name" },
  { key: "last-name", label: "Last Name", type: "text", targetLayer: "badge-last-name", placeholder: "Last Name" },
  { key: "title", label: "Job Title", type: "text", targetLayer: "badge-title", placeholder: "Job Title" },
  { key: "department", label: "Department", type: "text", targetLayer: "badge-department", placeholder: "Department" },
  { key: "role", label: "Role Badge", type: "text", targetLayer: "badge-role", placeholder: "STAFF" },
  { key: "employee-id", label: "Employee ID", type: "text", targetLayer: "badge-employee-id", placeholder: "ID: EMP-0001" },
  { key: "access-level", label: "Access Level", type: "text", targetLayer: "badge-access-level", placeholder: "Access: Level 1" },
  { key: "email", label: "Email", type: "text", targetLayer: "badge-email", placeholder: "email@company.com" },
  { key: "phone", label: "Phone", type: "text", targetLayer: "badge-phone", placeholder: "+1 (555) 000-0000" },
  { key: "issue-date", label: "Issue Date", type: "text", targetLayer: "badge-issue-date", placeholder: "Issued: 01/01/2025" },
  { key: "expiry-date", label: "Expiry Date", type: "text", targetLayer: "badge-expiry-date", placeholder: "Expires: 01/01/2026" },
  { key: "signatory-name", label: "Authorized By", type: "text", targetLayer: "badge-signatory-name", placeholder: "Authorized By" },
  { key: "signatory-title", label: "Signatory Title", type: "text", targetLayer: "badge-signatory-title", placeholder: "Director of HR" },
];

// ── Editor config ───────────────────────────────────────────────────────────
// CR80 Standard: 1013 × 638 px (85.6 × 54 mm @ 300 DPI)
const ID_BADGE_CONFIG: FabricEditorConfig = {
  toolId: "id-badge",
  defaultWidth: 1013,
  defaultHeight: 638,
  templates: ID_BADGE_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function IDBadgeDesignerWorkspace() {
  const { fabricJson, setFabricState } = useFabricProjectStore();
  const hasDispatchedRef = useRef(false);

  // Dispatch progress milestones on mount
  useEffect(() => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;
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
        config={ID_BADGE_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
      />
    </div>
  );
}
