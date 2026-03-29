// =============================================================================
// DMSuite — Poster & Flyer Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for poster/flyer design.
// Replaces the legacy Canvas 2D workspace with a direct canvas editor.
// Supports both "poster" and "flyer" tool IDs (same editor, same templates).
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { POSTER_FABRIC_TEMPLATES } from "@/data/poster-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";
import { createPosterFabricManifest } from "@/lib/chiko/manifests/poster-fabric";

// ── Quick-edit fields for poster/flyer details ──────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "headline", label: "Headline", type: "text", targetLayer: "pst-headline", placeholder: "Event Headline" },
  { key: "subtext", label: "Supporting Text", type: "text", targetLayer: "pst-subtext", placeholder: "Description text" },
  { key: "label", label: "Label / Category", type: "text", targetLayer: "pst-label", placeholder: "UPCOMING EVENT" },
  { key: "event-date", label: "Event Date", type: "text", targetLayer: "pst-event-date", placeholder: "Saturday, 15 March 2026" },
  { key: "venue", label: "Venue", type: "text", targetLayer: "pst-venue", placeholder: "Convention Centre, Lusaka" },
  { key: "cta", label: "CTA Button", type: "text", targetLayer: "pst-cta", placeholder: "GET YOUR TICKETS" },
  { key: "description", label: "Body Text", type: "text", targetLayer: "pst-description", placeholder: "More details..." },
  { key: "organizer", label: "Organizer", type: "text", targetLayer: "pst-organizer", placeholder: "Presented by..." },
  { key: "brand", label: "Brand", type: "text", targetLayer: "pst-brand", placeholder: "DMSUITE" },
  { key: "footer-note", label: "Footer Note", type: "text", targetLayer: "pst-footer-note", placeholder: "www.dmsuite.com" },
];

// ── Editor config — A4 portrait (794 × 1123 px) ────────────────────────────
const POSTER_CONFIG: FabricEditorConfig = {
  toolId: "poster",
  defaultWidth: 794,
  defaultHeight: 1123,
  templates: POSTER_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function PosterFlyerWorkspace() {
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
        config={POSTER_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createPosterFabricManifest}
      />
    </div>
  );
}
