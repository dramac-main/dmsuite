// =============================================================================
// DMSuite — Ticket & Pass Designer Workspace (Fabric.js Editor)
// Thin wrapper around the universal FabricEditor for ticket/pass design.
// Replaces the legacy tab-based workspace with a direct canvas editor.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { TICKET_FABRIC_TEMPLATES } from "@/data/ticket-fabric-templates";
import type { FabricEditorConfig, QuickEditField } from "@/lib/fabric-editor";
import { createTicketDesignerFabricManifest } from "@/lib/chiko/manifests/ticket-designer-fabric";

// ── Quick-edit fields for ticket details ────────────────────────────────────
const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "event-name", label: "Event Name", type: "text", targetLayer: "tkt-event-name", placeholder: "Event Name" },
  { key: "event-subtitle", label: "Subtitle", type: "text", targetLayer: "tkt-event-subtitle", placeholder: "Tour / Series Name" },
  { key: "venue", label: "Venue", type: "text", targetLayer: "tkt-venue", placeholder: "Venue Name" },
  { key: "date", label: "Date", type: "text", targetLayer: "tkt-date", placeholder: "Jan 1, 2026" },
  { key: "time", label: "Time", type: "text", targetLayer: "tkt-time", placeholder: "7:00 PM" },
  { key: "section", label: "Section", type: "text", targetLayer: "tkt-section", placeholder: "A1" },
  { key: "row", label: "Row", type: "text", targetLayer: "tkt-row", placeholder: "12" },
  { key: "seat", label: "Seat", type: "text", targetLayer: "tkt-seat", placeholder: "5" },
  { key: "gate", label: "Gate", type: "text", targetLayer: "tkt-gate", placeholder: "B" },
  { key: "price", label: "Price", type: "text", targetLayer: "tkt-price", placeholder: "$50.00" },
  { key: "attendee", label: "Attendee", type: "text", targetLayer: "tkt-attendee", placeholder: "Attendee Name" },
  { key: "organizer", label: "Organizer", type: "text", targetLayer: "tkt-organizer", placeholder: "Organizer Name" },
  { key: "serial", label: "Serial #", type: "text", targetLayer: "tkt-serial", placeholder: "TKT-001" },
];

// ── Editor config ───────────────────────────────────────────────────────────
// Standard ticket: 816 × 336 px (8.5 × 3.5 in @ 96 DPI)
const TICKET_CONFIG: FabricEditorConfig = {
  toolId: "ticket-designer",
  defaultWidth: 816,
  defaultHeight: 336,
  templates: TICKET_FABRIC_TEMPLATES,
  quickEditFields: QUICK_EDIT_FIELDS,
  exportOptions: ["png", "jpg", "pdf", "json"],
};

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function TicketDesignerWorkspace() {
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
        config={TICKET_CONFIG}
        defaultState={fabricJson ?? undefined}
        onSave={handleSave}
        chikoManifestFactory={createTicketDesignerFabricManifest}
      />
    </div>
  );
}
