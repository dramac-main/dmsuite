// =============================================================================
// DMSuite — Invitation Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for invitation design.
// Default canvas: A5 portrait 420 × 595 px.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { INVITATION_FABRIC_TEMPLATES } from "@/data/invitation-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";
import { createInvitationFabricManifest } from "@/lib/chiko/manifests/invitation-fabric";

// ── Quick-edit fields for invitation details ────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "host-names", label: "Host Names", type: "text", targetLayer: "inv-host-names", placeholder: "Mr. & Mrs. Joseph Mwansa" },
  { key: "event-title", label: "Event Title", type: "text", targetLayer: "inv-event-title", placeholder: "The Wedding Celebration" },
  { key: "event-subtitle", label: "Subtitle", type: "text", targetLayer: "inv-event-subtitle", placeholder: "of their daughter" },
  { key: "date", label: "Date", type: "text", targetLayer: "inv-date", placeholder: "Saturday, 21 March 2026" },
  { key: "time", label: "Time", type: "text", targetLayer: "inv-time", placeholder: "at 14:00" },
  { key: "venue", label: "Venue", type: "text", targetLayer: "inv-venue", placeholder: "Cathedral of the Holy Cross" },
  { key: "venue-address", label: "Venue Address", type: "text", targetLayer: "inv-venue-address", placeholder: "Freedom Way" },
  { key: "city", label: "City", type: "text", targetLayer: "inv-city", placeholder: "Lusaka, Zambia" },
  { key: "dress-code", label: "Dress Code", type: "text", targetLayer: "inv-dress-code", placeholder: "Formal / Traditional" },
  { key: "additional-info", label: "Additional Info", type: "text", targetLayer: "inv-additional-info", placeholder: "Reception to follow..." },
  { key: "rsvp-phone", label: "RSVP Phone", type: "text", targetLayer: "inv-rsvp-phone", placeholder: "+260 97 1234567" },
  { key: "rsvp-email", label: "RSVP Email", type: "text", targetLayer: "inv-rsvp-email", placeholder: "rsvp@example.com" },
  { key: "rsvp-deadline", label: "RSVP Deadline", type: "text", targetLayer: "inv-rsvp-deadline", placeholder: "Kindly respond by 1 March 2026" },
];

// ── Editor config — A5 portrait (420 × 595 px) ─────────────────────────────
const INVITATION_CONFIG: FabricEditorConfig = {
  toolId: "invitation-designer",
  defaultWidth: 420,
  defaultHeight: 595,
  templates: INVITATION_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function InvitationDesignerWorkspace() {
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
        config={INVITATION_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createInvitationFabricManifest}
      />
    </div>
  );
}
