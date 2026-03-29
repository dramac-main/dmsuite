// =============================================================================
// DMSuite — Packaging Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for packaging design.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { PACKAGING_FABRIC_TEMPLATES } from "@/data/packaging-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";

// ── Quick-edit fields for packaging details ─────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "product-name", label: "Product Name", type: "text", targetLayer: "pkg-product-name", placeholder: "Zambian Gold" },
  { key: "brand-name", label: "Brand Name", type: "text", targetLayer: "pkg-brand-name", placeholder: "DMSUITE FOODS" },
  { key: "tagline", label: "Tagline", type: "text", targetLayer: "pkg-tagline", placeholder: "Naturally Delicious" },
  { key: "weight", label: "Weight / Volume", type: "text", targetLayer: "pkg-weight", placeholder: "500g" },
  { key: "ingredients", label: "Ingredients", type: "text", targetLayer: "pkg-ingredients", placeholder: "Maize, Sugar, Salt..." },
  { key: "barcode", label: "Barcode Number", type: "text", targetLayer: "pkg-barcode", placeholder: "6009876543210" },
];

// ── Editor config — Box die-cut (900 × 700 px) ─────────────────────────────
const PACKAGING_CONFIG: FabricEditorConfig = {
  toolId: "packaging-design",
  defaultWidth: 900,
  defaultHeight: 700,
  templates: PACKAGING_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function PackagingDesignerWorkspace() {
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
        config={PACKAGING_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
      />
    </div>
  );
}
