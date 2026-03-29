// =============================================================================
// DMSuite — Envelope Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for envelope design.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { ENVELOPE_FABRIC_TEMPLATES } from "@/data/envelope-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";
import { createEnvelopeFabricManifest } from "@/lib/chiko/manifests/envelope-fabric";

// ── Quick-edit fields for envelope details ──────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "company-name", label: "Company Name", type: "text", targetLayer: "env-company-name", placeholder: "DMSuite Solutions" },
  { key: "return-address", label: "Return Address", type: "text", targetLayer: "env-return-address", placeholder: "Plot 1234, Cairo Road\nLusaka, Zambia" },
  { key: "recipient-name", label: "Recipient Name", type: "text", targetLayer: "env-recipient-name", placeholder: "John Doe" },
  { key: "recipient-address", label: "Recipient Address", type: "text", targetLayer: "env-recipient-address", placeholder: "123 Main Street\nKitwe, Zambia" },
];

// ── Editor config — DL envelope (624 × 312 px) ─────────────────────────────
const ENVELOPE_CONFIG: FabricEditorConfig = {
  toolId: "envelope",
  defaultWidth: 624,
  defaultHeight: 312,
  templates: ENVELOPE_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function EnvelopeDesignerWorkspace() {
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
        config={ENVELOPE_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createEnvelopeFabricManifest}
      />
    </div>
  );
}
