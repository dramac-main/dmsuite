// =============================================================================
// DMSuite — Social Media Post Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for social media post design.
// Default canvas: 1080 × 1080 px (Instagram Post / Square).
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { SOCIAL_MEDIA_FABRIC_TEMPLATES } from "@/data/social-media-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";

// ── Quick-edit fields for social media post details ─────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "headline", label: "Headline", type: "text", targetLayer: "smp-headline", placeholder: "Your Bold Headline" },
  { key: "subtext", label: "Supporting Text", type: "text", targetLayer: "smp-subtext", placeholder: "Add context..." },
  { key: "body", label: "Body Copy", type: "text", targetLayer: "smp-body", placeholder: "Share your message..." },
  { key: "label", label: "Label / Tag", type: "text", targetLayer: "smp-label", placeholder: "ANNOUNCEMENT" },
  { key: "cta", label: "CTA Button", type: "text", targetLayer: "smp-cta", placeholder: "LEARN MORE" },
  { key: "date", label: "Date", type: "text", targetLayer: "smp-date", placeholder: "March 2026" },
  { key: "hashtag", label: "Hashtags", type: "text", targetLayer: "smp-hashtag", placeholder: "#DMSuite #Design" },
  { key: "brand", label: "Brand", type: "text", targetLayer: "smp-brand", placeholder: "DMSUITE" },
  { key: "handle", label: "Handle", type: "text", targetLayer: "smp-handle", placeholder: "@dmsuite" },
];

// ── Editor config — Square 1080 × 1080 px (Instagram Post) ─────────────────
const SOCIAL_CONFIG: FabricEditorConfig = {
  toolId: "social-media-post",
  defaultWidth: 1080,
  defaultHeight: 1080,
  templates: SOCIAL_MEDIA_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function SocialMediaPostWorkspace() {
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
        config={SOCIAL_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
      />
    </div>
  );
}
