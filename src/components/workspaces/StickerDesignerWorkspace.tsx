// =============================================================================
// DMSuite — Sticker & Decal Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for sticker design.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { STICKER_FABRIC_TEMPLATES } from "@/data/sticker-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";

// ── Quick-edit fields for sticker details ───────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "title", label: "Title / Brand", type: "text", targetLayer: "stk-title", placeholder: "DMSuite" },
  { key: "subtitle", label: "Subtitle", type: "text", targetLayer: "stk-subtitle", placeholder: "Premium Quality" },
  { key: "line1", label: "Line 1", type: "text", targetLayer: "stk-line1", placeholder: "Handmade in Lusaka" },
  { key: "line2", label: "Line 2", type: "text", targetLayer: "stk-line2", placeholder: "Zambia" },
  { key: "line3", label: "Line 3", type: "text", targetLayer: "stk-line3", placeholder: "www.dmsuite.com" },
  { key: "price", label: "Price", type: "text", targetLayer: "stk-price", placeholder: "K49.99" },
];

// ── Editor config — 300 × 300 px (3" square sticker) ───────────────────────
const STICKER_CONFIG: FabricEditorConfig = {
  toolId: "sticker-designer",
  defaultWidth: 300,
  defaultHeight: 300,
  templates: STICKER_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function StickerDesignerWorkspace() {
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
        config={STICKER_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
      />
    </div>
  );
}
