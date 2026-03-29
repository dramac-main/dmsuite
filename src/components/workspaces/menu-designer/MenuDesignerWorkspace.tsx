// =============================================================================
// DMSuite — Menu Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for menu/food-menu design.
// Replaces the legacy tab-based workspace with a direct canvas editor.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { MENU_FABRIC_TEMPLATES } from "@/data/menu-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";
import { createMenuDesignerFabricManifest } from "@/lib/chiko/manifests/menu-designer-fabric";

// ── Quick-edit fields for menu details ──────────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "restaurant-name", label: "Restaurant Name", type: "text", targetLayer: "menu-restaurant-name", placeholder: "Restaurant Name" },
  { key: "tagline", label: "Tagline", type: "text", targetLayer: "menu-tagline", placeholder: "Fine Dining & Cocktails" },
  { key: "header-note", label: "Header Note", type: "text", targetLayer: "menu-header-note", placeholder: "All prices inclusive of tax..." },
  { key: "footer-note", label: "Footer / Legend", type: "text", targetLayer: "menu-footer-note", placeholder: "V = Vegetarian | VG = Vegan..." },
  { key: "section-0-title", label: "Section 1 Title", type: "text", targetLayer: "menu-section-0-title", placeholder: "Starters" },
  { key: "section-0-items", label: "Section 1 Items", type: "text", targetLayer: "menu-section-0-items", placeholder: "Item  ·  $12\nItem  ·  $14" },
  { key: "section-1-title", label: "Section 2 Title", type: "text", targetLayer: "menu-section-1-title", placeholder: "Main Course" },
  { key: "section-1-items", label: "Section 2 Items", type: "text", targetLayer: "menu-section-1-items", placeholder: "Item  ·  $28\nItem  ·  $36" },
  { key: "section-2-title", label: "Section 3 Title", type: "text", targetLayer: "menu-section-2-title", placeholder: "Desserts" },
  { key: "section-2-items", label: "Section 3 Items", type: "text", targetLayer: "menu-section-2-items", placeholder: "Item  ·  $12\nItem  ·  $14" },
];

// ── Editor config ───────────────────────────────────────────────────────────
// A4 Portrait: 794 × 1123 px (210 × 297 mm @ 96 DPI)
const MENU_CONFIG: FabricEditorConfig = {
  toolId: "menu-designer",
  defaultWidth: 794,
  defaultHeight: 1123,
  templates: MENU_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function MenuDesignerWorkspace() {
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
        config={MENU_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createMenuDesignerFabricManifest}
      />
    </div>
  );
}
