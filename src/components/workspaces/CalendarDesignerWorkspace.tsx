// =============================================================================
// DMSuite — Calendar Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for calendar design.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { CALENDAR_FABRIC_TEMPLATES } from "@/data/calendar-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";

// ── Quick-edit fields for calendar details ──────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "title", label: "Title", type: "text", targetLayer: "cal-title", placeholder: "My Calendar" },
  { key: "subtitle", label: "Subtitle", type: "text", targetLayer: "cal-subtitle", placeholder: "Company tagline" },
  { key: "month-label", label: "Month", type: "text", targetLayer: "cal-month-label", placeholder: "MARCH" },
  { key: "year-label", label: "Year", type: "text", targetLayer: "cal-year-label", placeholder: "2026" },
  { key: "footer-text", label: "Footer", type: "text", targetLayer: "cal-footer-text", placeholder: "www.dmsuite.com" },
];

// ── Editor config — Wall calendar (1200 × 900 px) ──────────────────────────
const CALENDAR_CONFIG: FabricEditorConfig = {
  toolId: "calendar-designer",
  defaultWidth: 1200,
  defaultHeight: 900,
  templates: CALENDAR_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function CalendarDesignerWorkspace() {
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
        config={CALENDAR_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
      />
    </div>
  );
}
