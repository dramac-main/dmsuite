// =============================================================================
// DMSuite — Certificate Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for certificate design.
// Replaces the legacy state-machine workspace with a direct canvas editor.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { CERTIFICATE_FABRIC_TEMPLATES } from "@/data/certificate-fabric-templates";
import { createCertificateFabricManifest } from "@/lib/chiko/manifests/certificate-fabric";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";

// ── Quick-edit fields for certificate details ───────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "org", label: "Organization", type: "text", targetLayer: "cert-org", placeholder: "Organization Name" },
  { key: "title", label: "Certificate Title", type: "text", targetLayer: "cert-title", placeholder: "CERTIFICATE OF ACHIEVEMENT" },
  { key: "subtitle", label: "Subtitle", type: "text", targetLayer: "cert-subtitle", placeholder: "This certificate is proudly presented to" },
  { key: "recipient", label: "Recipient Name", type: "text", targetLayer: "cert-recipient", placeholder: "Recipient Name" },
  { key: "description", label: "Description", type: "textarea", targetLayer: "cert-description", placeholder: "For outstanding performance..." },
  { key: "date", label: "Date", type: "text", targetLayer: "cert-date", placeholder: "Date: January 1, 2026" },
  { key: "ref", label: "Reference Number", type: "text", targetLayer: "cert-ref", placeholder: "Ref: CERT-2026-001" },
  { key: "sig0-name", label: "Signatory 1 Name", type: "text", targetLayer: "cert-signatory-0-name", placeholder: "Signatory Name" },
  { key: "sig0-title", label: "Signatory 1 Title", type: "text", targetLayer: "cert-signatory-0-title", placeholder: "Position / Title" },
  { key: "sig1-name", label: "Signatory 2 Name", type: "text", targetLayer: "cert-signatory-1-name", placeholder: "Signatory Name" },
  { key: "sig1-title", label: "Signatory 2 Title", type: "text", targetLayer: "cert-signatory-1-title", placeholder: "Position / Title" },
  { key: "sig2-name", label: "Signatory 3 Name", type: "text", targetLayer: "cert-signatory-2-name", placeholder: "Signatory Name" },
  { key: "sig2-title", label: "Signatory 3 Title", type: "text", targetLayer: "cert-signatory-2-title", placeholder: "Position / Title" },
  { key: "seal-text", label: "Seal Text", type: "text", targetLayer: "cert-seal-text", placeholder: "CERTIFIED" },
];

// ── Editor config ───────────────────────────────────────────────────────────
// A4 Landscape at 300 DPI: 3508 × 2480 px
const CERTIFICATE_CONFIG: FabricEditorConfig = {
  toolId: "certificate",
  defaultWidth: 3508,
  defaultHeight: 2480,
  templates: CERTIFICATE_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "svg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function CertificateDesignerWorkspace() {
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
        config={CERTIFICATE_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createCertificateFabricManifest}
      />
    </div>
  );
}
