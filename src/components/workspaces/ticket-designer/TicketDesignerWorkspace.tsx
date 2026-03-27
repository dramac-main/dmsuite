// =============================================================================
// DMSuite — Ticket & Pass Designer Workspace
// Pattern A: Multi-Tab Editor (left) + Preview (center) + Layers (right)
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useTicketEditor,
  useTicketUndo,
  TICKET_TYPES,
  type TicketType,
} from "@/stores/ticket-editor";
import { printHTML } from "@/lib/print";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createTicketDesignerManifest } from "@/lib/chiko/manifests/ticket-designer";
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import {
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  ZOOM_DEFAULT,
} from "@/lib/workspace-constants";
import "@/styles/workspace-canvas.css";

import TicketRenderer, { getGoogleFontUrl, PAGE_PX } from "./TicketRenderer";
import TicketLayersPanel from "./TicketLayersPanel";
import TicketContentTab from "./tabs/TicketContentTab";
import TicketDetailsTab from "./tabs/TicketDetailsTab";
import TicketStyleTab from "./tabs/TicketStyleTab";
import TicketFormatTab from "./tabs/TicketFormatTab";

import {
  EditorTabNav,
  BottomBar,
  WorkspaceHeader,
  IconButton,
  ActionButton,
  ConfirmDialog,
  Icons,
  SIcon,
  type EditorTab,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ━━━ Tab config ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const EDITOR_TABS = [
  {
    key: "content",
    label: "Content",
    icon: (
      <SIcon d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    ),
  },
  {
    key: "details",
    label: "Details",
    icon: (
      <SIcon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
  },
  {
    key: "style",
    label: "Style",
    icon: (
      <SIcon d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a6 6 0 00-6-6h-2" />
    ),
  },
  {
    key: "format",
    label: "Format",
    icon: (
      <SIcon d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    ),
  },
] as const;

type EditorTabKey = (typeof EDITOR_TABS)[number]["key"];

// Tab map for click-through from layers
const SECTION_TO_TAB: Record<string, EditorTabKey> = {
  header: "content",
  details: "content",
  attendee: "details",
  seating: "content",
  barcode: "details",
  stub: "details",
  footer: "details",
};

// ━━━ Main Workspace ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function TicketDesignerWorkspace() {
  // ── Local UI state ──
  const [activeTab, setActiveTab] = useState<EditorTabKey>("content");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  // ── Store ──
  const form = useTicketEditor((s) => s.form);
  const resetForm = useTicketEditor((s) => s.resetForm);
  const { undo, redo, canUndo, canRedo } = useTicketUndo();

  // ── Refs ──
  const printAreaRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const chikoOnPrintRef = useRef<(() => void) | null>(null);
  const formRef = useRef(form);

  // ── Dirty tracking ──
  useEffect(() => {
    if (formRef.current === form) return;
    formRef.current = form;
    dispatchDirty();
  }, [form]);

  // ── Milestone progress ──
  useEffect(() => {
    const milestones: string[] = [];
    if (form.event.eventName.trim().length > 0) milestones.push("input");
    if (form.event.venueName.trim().length > 0 || form.attendee.attendeeName.trim().length > 0) milestones.push("content");
    milestones.forEach((m) => dispatchProgress(m as "input" | "content"));
  }, [form.event.eventName, form.event.venueName, form.attendee.attendeeName]);

  // ── Canvas highlight on layer hover ──
  useEffect(() => {
    const container = printAreaRef.current;
    if (!container) return;
    container.querySelectorAll(".tk-layer-highlight").forEach((el) =>
      el.classList.remove("tk-layer-highlight")
    );
    if (hoveredSection && /^[a-z-]+$/.test(hoveredSection)) {
      container.querySelectorAll(`[data-tk-section="${hoveredSection}"]`).forEach((el) =>
        el.classList.add("tk-layer-highlight")
      );
    }
  }, [hoveredSection]);

  // ── Print handler ──
  const handlePrint = useCallback(() => {
    const printEl = document.getElementById("tk-print-area");
    if (!printEl) return;

    const fontUrl = getGoogleFontUrl(form.style.fontPairing);
    const fontLink = fontUrl ? `<link rel="stylesheet" href="${fontUrl}">` : "";

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${form.event.eventName || "Ticket"}</title>${fontLink}<style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;justify-content:center;align-items:start;min-height:100vh;padding:12mm;background:#fff}@media print{body{padding:0}@page{margin:6mm}}</style></head><body>${printEl.innerHTML}</body></html>`;

    printHTML(html);
    dispatchProgress("exported");
  }, [form.event.eventName, form.style.fontPairing]);

  // ── Chiko registration ──
  useEffect(() => {
    chikoOnPrintRef.current = handlePrint;
  }, [handlePrint]);

  useChikoActions(() => createTicketDesignerManifest({ onPrintRef: chikoOnPrintRef }));

  // ── Layer click → tab ──
  const handleLayerClick = useCallback(
    (section: string) => {
      const tab = SECTION_TO_TAB[section];
      if (tab) setActiveTab(tab);
    },
    []
  );

  // ── Start over ──
  const handleStartOver = useCallback(() => {
    resetForm();
    setShowStartOverDialog(false);
  }, [resetForm]);

  // ── Tab content ──
  let tabContent: React.ReactNode;
  switch (activeTab) {
    case "content":
      tabContent = <TicketContentTab />;
      break;
    case "details":
      tabContent = <TicketDetailsTab />;
      break;
    case "style":
      tabContent = <TicketStyleTab />;
      break;
    case "format":
      tabContent = <TicketFormatTab />;
      break;
  }

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100 overflow-hidden">
      {/* ─── Header ─── */}
      <WorkspaceHeader
        title="Ticket & Pass Designer"
        subtitle={form.event.eventName}
      >
        <IconButton
          onClick={() => undo()}
          disabled={!canUndo}
          icon={Icons.undo}
          tooltip="Undo"
        />
        <IconButton
          onClick={() => redo()}
          disabled={!canRedo}
          icon={Icons.redo}
          tooltip="Redo"
        />
        <IconButton
          onClick={() => setShowStartOverDialog(true)}
          icon={Icons.close}
          tooltip="Start Over"
        />
        <ActionButton onClick={handlePrint} icon={Icons.print}>
          Print
        </ActionButton>
      </WorkspaceHeader>

      {/* ─── Mobile bottom nav ─── */}
      <div className="lg:hidden order-last">
        <BottomBar
          actions={[
            { key: "editor", label: "Editor", icon: Icons.edit },
            { key: "preview", label: "Preview", icon: Icons.preview },
          ]}
          activeKey={mobileView}
          onAction={(key) => setMobileView(key as "editor" | "preview")}
        />
      </div>

      {/* ─── Main content ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Editor panel */}
        <div
          className={`${
            mobileView === "editor" ? "flex" : "hidden"
          } lg:flex flex-col shrink-0 w-full lg:w-80 border-r border-gray-800/60 bg-gray-900/40`}
        >
          <EditorTabNav
            tabs={EDITOR_TABS as unknown as EditorTab[]}
            activeTab={activeTab}
            onTabChange={(key: string) => setActiveTab(key as EditorTabKey)}
          />
          <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
            {tabContent}
          </div>
        </div>

        {/* CENTER: Preview */}
        <div
          className={`${
            mobileView === "preview" ? "flex" : "hidden"
          } lg:flex flex-col flex-1 min-w-0`}
        >
          {/* Zoom bar */}
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 border-b border-gray-800/40 bg-gray-900/20 shrink-0">
            <IconButton
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
              icon={Icons.zoomOut}
              title="Zoom Out"
            />
            <span className="text-[10px] text-gray-500 w-9 text-center font-mono tabular-nums">
              {zoom}%
            </span>
            <IconButton
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
              icon={Icons.zoomIn}
              title="Zoom In"
            />
            <button
              onClick={() => setZoom(ZOOM_DEFAULT)}
              className="ml-2 text-[9px] text-gray-600 hover:text-gray-400 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Canvas */}
          <div
            ref={previewScrollRef}
            className="flex-1 overflow-auto p-6 lg:p-10 workspace-canvas-bg"
          >
            <div
              className="flex items-start justify-center min-h-full"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <div id="tk-print-area" ref={printAreaRef}>
                <TicketRenderer data={form} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Layers panel */}
        <TicketLayersPanel
          onOpenSection={handleLayerClick}
          onHoverSection={setHoveredSection}
          collapsed={layersCollapsed}
          onToggleCollapse={() => setLayersCollapsed(!layersCollapsed)}
        />
      </div>

      {/* ─── Start Over dialog ─── */}
      <ConfirmDialog
        open={showStartOverDialog}
        title="Start Over?"
        description="This will reset all ticket content and settings to defaults. This cannot be undone."
        confirmLabel="Start Over"
        variant="danger"
        onConfirm={handleStartOver}
        onCancel={() => setShowStartOverDialog(false)}
      />
    </div>
  );
}
