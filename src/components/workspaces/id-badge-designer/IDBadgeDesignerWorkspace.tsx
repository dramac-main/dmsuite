/*  ═══════════════════════════════════════════════════════════════════════════
 *  IDBadgeDesignerWorkspace.tsx — Main Workspace (Pattern A)
 *  3-panel: Editor (tabs) | Preview (badge) | Layers
 *  ═══════════════════════════════════════════════════════════════════════════ */
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  useIDBadgeEditor,
  useIDBadgeUndo,
  BADGE_TEMPLATES,
  BADGE_ACCENT_COLORS,
} from "@/stores/id-badge-editor";
import { printHTML } from "@/lib/print";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createIDBadgeManifest } from "@/lib/chiko/manifests/id-badge";
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import {
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  ZOOM_DEFAULT,
  PAGE_DOTS_THRESHOLD,
  MILESTONE_EDIT_THRESHOLD,
} from "@/lib/workspace-constants";
import IDBadgeRenderer, { getGoogleFontUrl, CARD_PX } from "./IDBadgeRenderer";
import IDBadgeContentTab from "./tabs/IDBadgeContentTab";
import IDBadgeBatchTab from "./tabs/IDBadgeBatchTab";
import IDBadgeBackTab from "./tabs/IDBadgeBackTab";
import IDBadgeStyleTab from "./tabs/IDBadgeStyleTab";
import IDBadgeFormatTab from "./tabs/IDBadgeFormatTab";
import IDBadgeLayersPanel from "./IDBadgeLayersPanel";
import {
  WorkspaceHeader,
  EditorTabNav,
  BottomBar,
  ActionButton,
  IconButton,
  ConfirmDialog,
  Icons,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ── Tab definitions ─────────────────────────────────────────────────────────

const TAB_ICONS = {
  content: <SIcon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  batch: <SIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  back: <SIcon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
  style: <SIcon d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
  format: <SIcon d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />,
};

type EditorTabKey = "content" | "batch" | "back" | "style" | "format";

const EDITOR_TABS: { key: EditorTabKey; label: string; icon: React.ReactNode }[] = [
  { key: "content", label: "Content", icon: TAB_ICONS.content },
  { key: "batch", label: "Batch", icon: TAB_ICONS.batch },
  { key: "back", label: "Back", icon: TAB_ICONS.back },
  { key: "style", label: "Style", icon: TAB_ICONS.style },
  { key: "format", label: "Format", icon: TAB_ICONS.format },
];

const SECTION_TO_TAB: Record<string, EditorTabKey> = {
  "badge-header": "content",
  "badge-photo": "content",
  "badge-name": "content",
  "badge-title": "content",
  "badge-department": "content",
  "badge-employee-id": "content",
  "badge-role": "style",
  "badge-dates": "content",
  "badge-custom": "content",
  "badge-front": "content",
  "badge-back": "back",
  "badge-qr": "back",
  "badge-barcode": "back",
  "badge-magstripe": "back",
  "badge-nfc": "back",
  "badge-holographic": "format",
  "badge-watermark": "format",
  "badge-microtext": "format",
  "badge-security": "format",
  "badge-lanyard": "style",
};

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function IDBadgeDesignerWorkspace() {
  // ── Store ──
  const form = useIDBadgeEditor((s) => s.form);
  const setTemplate = useIDBadgeEditor((s) => s.setTemplate);
  const setAccentColor = useIDBadgeEditor((s) => s.setAccentColor);
  const resetForm = useIDBadgeEditor((s) => s.resetForm);
  const { undo, redo } = useIDBadgeUndo();

  // ── Refs ──
  const printAreaRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const chikoOnPrintRef = useRef<(() => void) | null>(null);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<EditorTabKey>("content");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);
  const [previewPersonIdx, setPreviewPersonIdx] = useState(0);

  const editCount = useMemo(() => {
    let c = 0;
    if (form.firstName) c++;
    if (form.lastName) c++;
    if (form.title) c++;
    if (form.department) c++;
    if (form.employeeId) c++;
    if (form.organizationName) c++;
    if (form.photoUrl) c++;
    if (form.email) c++;
    if (form.backSide.enabled) c++;
    if (form.batchMode) c += form.batchPeople.length;
    return c;
  }, [form]);

  // ── Workspace events ──
  useEffect(() => {
    if (editCount > 0) dispatchDirty();
  }, [editCount]);

  useEffect(() => {
    if (editCount >= MILESTONE_EDIT_THRESHOLD) {
      dispatchProgress("edited");
    }
  }, [editCount]);

  // Highlight hovered section on canvas
  useEffect(() => {
    if (!printAreaRef.current) return;
    const root = printAreaRef.current;
    root.querySelectorAll("[data-badge-section]").forEach((el) => {
      (el as HTMLElement).style.outline =
        hoveredSection && el.getAttribute("data-badge-section") === hoveredSection
          ? "2px solid rgba(139, 92, 246, 0.6)"
          : "";
      (el as HTMLElement).style.outlineOffset = hoveredSection && el.getAttribute("data-badge-section") === hoveredSection ? "2px" : "";
    });
  }, [hoveredSection, form]);

  // ── Handlers ──
  const handlePrint = useCallback(() => {
    if (!printAreaRef.current) return;
    const cardSize = form.format.cardSize;
    const dims = CARD_PX[cardSize] || CARD_PX.cr80;
    const orient = form.format.orientation;
    const widthMm = orient === "landscape" ? 86 : 54;
    const heightMm = orient === "landscape" ? 54 : 86;
    const fontUrl = getGoogleFontUrl(form.style.fontPairing);
    const html = printAreaRef.current.innerHTML;

    printHTML(`
      <!DOCTYPE html>
      <html><head>
        <meta charset="utf-8"/>
        <link href="${fontUrl}" rel="stylesheet"/>
        <style>
          @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { width: ${dims.w}px; height: ${dims.h}px; }
          .badge-canvas-root { transform: none !important; }
        </style>
      </head>
      <body>${html}</body></html>
    `);
  }, [form]);

  // ── Chiko AI ──
  chikoOnPrintRef.current = handlePrint;
  useChikoActions(() =>
    createIDBadgeManifest({
      store: useIDBadgeEditor,
      printRef: chikoOnPrintRef,
    }),
  );

  const handleStartOver = () => {
    resetForm();
    setShowStartOverDialog(false);
    setActiveTab("content");
    setPreviewPersonIdx(0);
  };

  const handleLayerOpenSection = (section: string) => {
    const tab = SECTION_TO_TAB[section];
    if (tab) setActiveTab(tab);
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const sectionEl = target.closest("[data-badge-section]");
    if (sectionEl) {
      const section = sectionEl.getAttribute("data-badge-section");
      if (section) handleLayerOpenSection(section);
    }
  };

  // ── Tab content ──
  const tabContent = (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
      {activeTab === "content" && <IDBadgeContentTab />}
      {activeTab === "batch" && <IDBadgeBatchTab />}
      {activeTab === "back" && <IDBadgeBackTab />}
      {activeTab === "style" && <IDBadgeStyleTab />}
      {activeTab === "format" && <IDBadgeFormatTab />}

      {/* Start Over */}
      <div className="p-4 border-t border-gray-800/30">
        <button
          onClick={() => setShowStartOverDialog(true)}
          className="w-full text-[10px] text-gray-600 hover:text-red-400 transition-colors py-2"
        >
          Start Over
        </button>
      </div>
    </div>
  );

  // ── Editor panel ──
  const editorPanel = (
    <div className="flex flex-col h-full bg-gray-900/60 border-r border-gray-800/40">
      <WorkspaceHeader
        title="ID Badge Designer"
        subtitle={form.organizationName || "Badge Design"}
      >
        <IconButton icon={Icons.undo} onClick={() => undo()} tooltip="Undo" />
        <IconButton icon={Icons.redo} onClick={() => redo()} tooltip="Redo" />
      </WorkspaceHeader>
      <EditorTabNav
        tabs={EDITOR_TABS}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as EditorTabKey)}
      />
      {tabContent}
    </div>
  );

  // ── Preview panel ──
  const batchCount = form.batchPeople.length;
  const showBatchNav = form.batchMode && batchCount > 0;

  const previewPanel = (
    <div className="flex flex-col flex-1 min-w-0 bg-gray-950/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/30 bg-gray-900/30">
        <div className="flex items-center gap-1.5">
          <IconButton icon={Icons.zoomOut} onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))} tooltip="Zoom Out" />
          <span className="text-[10px] text-gray-500 w-10 text-center tabular-nums">{zoom}%</span>
          <IconButton icon={Icons.zoomIn} onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))} tooltip="Zoom In" />
          <IconButton icon={Icons.zoomOut} onClick={() => setZoom(ZOOM_DEFAULT)} tooltip="Reset Zoom" />
        </div>

        <div className="flex items-center gap-2">
          {/* Batch person navigator */}
          {showBatchNav && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-800/40 border border-gray-700/30">
              <button
                onClick={() => setPreviewPersonIdx(Math.max(0, previewPersonIdx - 1))}
                disabled={previewPersonIdx === 0}
                className="text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-[10px] text-gray-400 tabular-nums min-w-12 text-center">
                {previewPersonIdx + 1} / {batchCount}
              </span>
              <button
                onClick={() => setPreviewPersonIdx(Math.min(batchCount - 1, previewPersonIdx + 1))}
                disabled={previewPersonIdx >= batchCount - 1}
                className="text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}

          <ActionButton icon={Icons.print} onClick={handlePrint} variant="primary" size="sm">Print</ActionButton>
        </div>
      </div>

      {/* Template quick-switch strip */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-800/20 overflow-x-auto scrollbar-none">
        {BADGE_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTemplate(t.id)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-medium transition-all ${
              form.style.template === t.id
                ? "bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/20"
                : "text-gray-600 hover:text-gray-400 hover:bg-gray-800/40"
            }`}
          >
            {t.name}
          </button>
        ))}
        <span className="w-px h-4 bg-gray-800/40 mx-1" />
        {BADGE_ACCENT_COLORS.slice(0, 8).map((color) => (
          <button
            key={color}
            onClick={() => setAccentColor(color)}
            className={`flex-shrink-0 w-5 h-5 rounded-full border transition-all ${
              form.style.accentColor === color
                ? "border-white/60 ring-1 ring-primary-500/30 scale-110"
                : "border-gray-700/30 hover:scale-105"
            }`}
            style={{ background: color }}
          />
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={previewScrollRef}
        className="flex-1 overflow-auto flex items-start justify-center p-8 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] [background-size:24px_24px]"
        onClick={handlePreviewClick}
      >
        <div
          ref={printAreaRef}
          className="badge-canvas-root transition-transform"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
        >
          <IDBadgeRenderer data={form} previewPersonIndex={showBatchNav ? previewPersonIdx : undefined} />
        </div>
      </div>
    </div>
  );

  // ── Layout ──
  return (
    <>
      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <BottomBar
          actions={[
            { key: "edit", label: "Edit", icon: Icons.edit },
            { key: "preview", label: "Preview", icon: Icons.preview },
            { key: "print", label: "Print", icon: Icons.print, primary: true },
          ]}
          activeKey={mobileView}
          onAction={(key) => {
            if (key === "print") handlePrint();
            else setMobileView(key as "edit" | "preview");
          }}
        />
      </div>

      {/* Main layout */}
      <div className="flex h-full overflow-hidden">
        {/* Editor */}
        <div className={`w-full lg:w-80 xl:w-96 flex-shrink-0 ${mobileView === "edit" ? "block" : "hidden lg:block"}`}>
          {editorPanel}
        </div>

        {/* Preview + Layers */}
        <div className={`flex flex-1 min-w-0 ${mobileView === "preview" ? "flex" : "hidden lg:flex"}`}>
          {previewPanel}

          {/* Layers panel — desktop only */}
          <div className="hidden xl:block">
            <IDBadgeLayersPanel
              onOpenSection={handleLayerOpenSection}
              onHoverSection={setHoveredSection}
              collapsed={layersCollapsed}
              onToggleCollapse={() => setLayersCollapsed(!layersCollapsed)}
            />
          </div>
        </div>
      </div>

      {/* Start Over dialog */}
      <ConfirmDialog
        open={showStartOverDialog}
        title="Start Over?"
        description="This will clear all badge content and reset to default settings. This cannot be undone."
        confirmLabel="Start Over"
        variant="danger"
        onConfirm={handleStartOver}
        onCancel={() => setShowStartOverDialog(false)}
      />
    </>
  );
}
