// =============================================================================
// DMSuite — Diploma & Accreditation Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for diploma/degree design.
// Replaces the legacy tab-based workspace with a direct canvas editor.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { DIPLOMA_FABRIC_TEMPLATES } from "@/data/diploma-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";
import { createDiplomaFabricManifest } from "@/lib/chiko/manifests/diploma-fabric";

// ── Quick-edit fields for diploma details ───────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "institution", label: "Institution", type: "text", targetLayer: "dip-institution", placeholder: "University Name" },
  { key: "institution-subtitle", label: "Faculty / School", type: "text", targetLayer: "dip-institution-subtitle", placeholder: "School of Graduate Studies" },
  { key: "institution-motto", label: "Motto", type: "text", targetLayer: "dip-institution-motto", placeholder: "Excellence in Education" },
  { key: "recipient", label: "Recipient Name", type: "text", targetLayer: "dip-recipient", placeholder: "Full Legal Name" },
  { key: "recipient-id", label: "Student ID", type: "text", targetLayer: "dip-recipient-id", placeholder: "Student ID: 000000" },
  { key: "program", label: "Degree / Program", type: "text", targetLayer: "dip-program", placeholder: "Bachelor of Science" },
  { key: "field-of-study", label: "Field of Study", type: "text", targetLayer: "dip-field-of-study", placeholder: "in Computer Science" },
  { key: "honors", label: "Honors", type: "text", targetLayer: "dip-honors", placeholder: "Cum Laude" },
  { key: "conferral", label: "Conferral Text", type: "text", targetLayer: "dip-conferral", placeholder: "This is to certify that" },
  { key: "resolution", label: "Resolution Text", type: "text", targetLayer: "dip-resolution", placeholder: "having completed all requirements..." },
  { key: "date-conferred", label: "Date Conferred", type: "text", targetLayer: "dip-date-conferred", placeholder: "Conferred: January 1, 2025" },
  { key: "graduation-date", label: "Graduation Date", type: "text", targetLayer: "dip-graduation-date", placeholder: "Graduation: December 15, 2024" },
  { key: "accreditation-body", label: "Accreditation Body", type: "text", targetLayer: "dip-accreditation-body", placeholder: "Accredited by..." },
  { key: "accreditation-number", label: "Accreditation No.", type: "text", targetLayer: "dip-accreditation-number", placeholder: "ACC-2025-001" },
  { key: "registration", label: "Reg. Number", type: "text", targetLayer: "dip-registration", placeholder: "Reg. No: REG-2025-00001" },
  { key: "serial", label: "Serial Number", type: "text", targetLayer: "dip-serial", placeholder: "Serial: DIP-2025-00001" },
];

// ── Editor config ───────────────────────────────────────────────────────────
// A4 Landscape: 1123 × 794 px (297 × 210 mm @ 96 DPI)
const DIPLOMA_CONFIG: FabricEditorConfig = {
  toolId: "diploma-designer",
  defaultWidth: 1123,
  defaultHeight: 794,
  templates: DIPLOMA_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "svg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function DiplomaDesignerWorkspace() {
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
        config={DIPLOMA_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createDiplomaFabricManifest}
      />
    </div>
  );
}
