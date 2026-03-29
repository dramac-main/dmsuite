// =============================================================================
// DMSuite — Greeting Card Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for greeting card design.
// Default canvas: A5 portrait 420 × 595 px (front cover page).
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { GREETING_CARD_FABRIC_TEMPLATES } from "@/data/greeting-card-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";

// ── Quick-edit fields for greeting card details ─────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "title", label: "Title", type: "text", targetLayer: "gc-title", placeholder: "Happy Birthday!" },
  { key: "subtitle", label: "Subtitle", type: "text", targetLayer: "gc-subtitle", placeholder: "A Special Day" },
  { key: "occasion-label", label: "Occasion Label", type: "text", targetLayer: "gc-occasion-label", placeholder: "CELEBRATION" },
  { key: "recipient", label: "Recipient", type: "text", targetLayer: "gc-recipient", placeholder: "Dear Chanda," },
  { key: "message", label: "Message", type: "text", targetLayer: "gc-message", placeholder: "Your heartfelt message..." },
  { key: "sender", label: "Sender", type: "text", targetLayer: "gc-sender", placeholder: "With love, Mwila" },
  { key: "footer-note", label: "Footer", type: "text", targetLayer: "gc-footer-note", placeholder: "Designed with love" },
];

// ── Editor config — A5 portrait (420 × 595 px) ─────────────────────────────
const GREETING_CARD_CONFIG: FabricEditorConfig = {
  toolId: "greeting-card",
  defaultWidth: 420,
  defaultHeight: 595,
  templates: GREETING_CARD_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function GreetingCardWorkspace() {
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
        config={GREETING_CARD_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
      />
    </div>
  );
}
