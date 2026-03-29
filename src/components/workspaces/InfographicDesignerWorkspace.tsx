// =============================================================================
// DMSuite — Infographic Maker Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for infographic design.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { INFOGRAPHIC_FABRIC_TEMPLATES } from "@/data/infographic-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";

// ── Quick-edit fields for infographic details ───────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "title", label: "Title", type: "text", targetLayer: "inf-title", placeholder: "Data-Driven Insights" },
  { key: "subtitle", label: "Subtitle", type: "text", targetLayer: "inf-subtitle", placeholder: "Key findings from our research" },
  { key: "stat-1-value", label: "Stat 1 Value", type: "text", targetLayer: "inf-stat-1-value", placeholder: "85%" },
  { key: "stat-1-label", label: "Stat 1 Label", type: "text", targetLayer: "inf-stat-1-label", placeholder: "Success Rate" },
  { key: "stat-2-value", label: "Stat 2 Value", type: "text", targetLayer: "inf-stat-2-value", placeholder: "2.4M" },
  { key: "stat-2-label", label: "Stat 2 Label", type: "text", targetLayer: "inf-stat-2-label", placeholder: "Users Reached" },
  { key: "stat-3-value", label: "Stat 3 Value", type: "text", targetLayer: "inf-stat-3-value", placeholder: "150+" },
  { key: "stat-3-label", label: "Stat 3 Label", type: "text", targetLayer: "inf-stat-3-label", placeholder: "Countries" },
  { key: "step-1", label: "Step 1", type: "text", targetLayer: "inf-step-1", placeholder: "Research & Discovery" },
  { key: "step-2", label: "Step 2", type: "text", targetLayer: "inf-step-2", placeholder: "Design & Develop" },
  { key: "step-3", label: "Step 3", type: "text", targetLayer: "inf-step-3", placeholder: "Test & Deploy" },
  { key: "footer", label: "Footer", type: "text", targetLayer: "inf-footer", placeholder: "www.dmsuite.com" },
];

// ── Editor config — Standard infographic (800 × 1200 px) ───────────────────
const INFOGRAPHIC_CONFIG: FabricEditorConfig = {
  toolId: "infographic",
  defaultWidth: 800,
  defaultHeight: 1200,
  templates: INFOGRAPHIC_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function InfographicDesignerWorkspace() {
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
        config={INFOGRAPHIC_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
      />
    </div>
  );
}
