// =============================================================================
// DMSuite — Banner Ad Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for display ad design.
// Default: 300 × 250 px (IAB Medium Rectangle)
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { BANNER_AD_FABRIC_TEMPLATES } from "@/data/banner-ad-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";
import { createBannerAdFabricManifest } from "@/lib/chiko/manifests/banner-ad-fabric";

// ── Quick-edit fields for banner ad text ────────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "headline", label: "Headline", type: "text", targetLayer: "ban-headline", placeholder: "Your Headline" },
  { key: "subtext", label: "Subtext", type: "text", targetLayer: "ban-subtext", placeholder: "Supporting text" },
  { key: "cta-text", label: "CTA Button", type: "text", targetLayer: "ban-cta-text", placeholder: "Learn More" },
  { key: "brand-name", label: "Brand Name", type: "text", targetLayer: "ban-brand-name", placeholder: "DMSuite" },
];

// ── Editor config — IAB Medium Rectangle (300 × 250 px) ────────────────────
const BANNER_AD_CONFIG: FabricEditorConfig = {
  toolId: "banner-ad",
  defaultWidth: 300,
  defaultHeight: 250,
  templates: BANNER_AD_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function BannerAdWorkspace() {
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
        config={BANNER_AD_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createBannerAdFabricManifest}
      />
    </div>
  );
}
