// =============================================================================
// DMSuite — T-Shirt & Apparel Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for apparel design.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { APPAREL_FABRIC_TEMPLATES } from "@/data/apparel-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";

// ── Quick-edit fields for apparel details ───────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "design-text", label: "Design Text", type: "text", targetLayer: "apr-design-text", placeholder: "DMSuite" },
  { key: "sub-text", label: "Sub Text", type: "text", targetLayer: "apr-sub-text", placeholder: "Design Excellence" },
];

// ── Editor config — T-shirt (500 × 600 px) ─────────────────────────────────
const APPAREL_CONFIG: FabricEditorConfig = {
  toolId: "tshirt-merch",
  defaultWidth: 500,
  defaultHeight: 600,
  templates: APPAREL_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function ApparelDesignerWorkspace() {
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
        config={APPAREL_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
      />
    </div>
  );
}
