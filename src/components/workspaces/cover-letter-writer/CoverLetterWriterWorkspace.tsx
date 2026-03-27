// =============================================================================
// DMSuite — Cover Letter Writer Workspace
// Tabbed editor (Content / Target / Style / Format)
// Mobile: full-screen tabs + bottom action bar
// Desktop: editor panel + preview canvas + layers panel
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCoverLetterEditor, useCoverLetterUndo, COVER_LETTER_TEMPLATES } from "@/stores/cover-letter-editor";
import { printHTML } from "@/lib/print";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createCoverLetterManifest } from "@/lib/chiko/manifests/cover-letter";
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT, PAGE_DOTS_THRESHOLD } from "@/lib/workspace-constants";
import "@/styles/workspace-canvas.css";
import CoverLetterRenderer, { PAGE_PX, PAGE_GAP, getGoogleFontUrl, buildPrintHTML } from "./CoverLetterRenderer";
import CoverLetterContentTab from "./tabs/CoverLetterContentTab";
import CoverLetterTargetTab from "./tabs/CoverLetterTargetTab";
import CoverLetterStyleTab from "./tabs/CoverLetterStyleTab";
import CoverLetterFormatTab from "./tabs/CoverLetterFormatTab";
import CoverLetterLayersPanel from "./CoverLetterLayersPanel";
import {
  EditorTabNav,
  BottomBar,
  WorkspaceHeader,
  IconButton,
  ActionButton,
  ConfirmDialog,
  Icons,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import WorkspaceErrorBoundary from "@/components/workspaces/shared/WorkspaceErrorBoundary";

// =============================================================================
// Tab definitions
// =============================================================================

const TAB_ICONS = {
  content: <SIcon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  target: <SIcon d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  style: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="13.5" cy="17.5" r="2.5" />
    </svg>
  ),
  format: <SIcon d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />,
};

const EDITOR_TABS = [
  { key: "content", label: "Content", icon: TAB_ICONS.content },
  { key: "target", label: "Target", icon: TAB_ICONS.target },
  { key: "style", label: "Style", icon: TAB_ICONS.style },
  { key: "format", label: "Format", icon: TAB_ICONS.format },
] as const;

type EditorTabKey = (typeof EDITOR_TABS)[number]["key"];

// =============================================================================
// Main Workspace
// =============================================================================

export default function CoverLetterWriterWorkspace() {
  const form = useCoverLetterEditor((s) => s.form);
  const resetForm = useCoverLetterEditor((s) => s.resetForm);
  const updateStyle = useCoverLetterEditor((s) => s.updateStyle);
  const setTemplate = useCoverLetterEditor((s) => s.setTemplate);
  const { undo, redo, canUndo, canRedo } = useCoverLetterUndo();

  const printAreaRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const chikoOnPrintRef = useRef<(() => void) | null>(null);

  const [activeTab, setActiveTab] = useState<EditorTabKey>("content");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  const pageDim = PAGE_PX[form.printConfig.pageSize] ?? PAGE_PX.a4;
  const pageH = pageDim.h;
  const pageStep = pageH + PAGE_GAP;

  // Dispatch workspace:dirty on form changes
  const formRef = useRef(form);
  useEffect(() => {
    if (formRef.current === form) return;
    formRef.current = form;
    dispatchDirty();
  }, [form]);

  // Dispatch progress milestones
  const prevMilestonesRef = useRef<string>("");
  useEffect(() => {
    const milestones: string[] = [];
    const hasInput = form.sender.fullName.trim().length > 0 || form.recipient.companyName.trim().length > 0;
    const hasContent = form.content.openingHook.trim().length > 0;
    if (hasInput) milestones.push("input");
    if (hasContent) milestones.push("content");
    const key = milestones.join(",");
    if (key !== prevMilestonesRef.current) {
      prevMilestonesRef.current = key;
      milestones.forEach((m) => dispatchProgress(m as "input" | "content"));
    }
  }, [form.sender.fullName, form.recipient.companyName, form.content.openingHook]);

  // Highlight sections on canvas when hovering layers
  useEffect(() => {
    const container = printAreaRef.current;
    if (!container) return;
    container.querySelectorAll(".cl-layer-highlight").forEach((el) => el.classList.remove("cl-layer-highlight"));
    if (hoveredSection && /^[a-z-]+$/.test(hoveredSection)) {
      container.querySelectorAll(`[data-cl-section="${hoveredSection}"]`).forEach((el) => el.classList.add("cl-layer-highlight"));
    }
  }, [hoveredSection]);

  // Page count from renderer
  const handlePageCount = useCallback((count: number) => {
    setTotalPages(count);
    setCurrentPage((prev) => Math.min(prev, Math.max(1, count)));
  }, []);

  // Reset page on major changes
  useEffect(() => {
    setCurrentPage(1);
    if (previewScrollRef.current) previewScrollRef.current.scrollTop = 0;
  }, [form.printConfig.pageSize]);

  // Print / Export
  const handlePrint = useCallback(() => {
    const html = buildPrintHTML(form);
    printHTML(html);
    dispatchProgress("exported");
  }, [form]);

  // Keep Chiko's print ref in sync
  useEffect(() => {
    chikoOnPrintRef.current = handlePrint;
  }, [handlePrint]);

  // Register Chiko manifest
  useChikoActions(() => createCoverLetterManifest({ onPrintRef: chikoOnPrintRef }));

  const handleStartOver = useCallback(() => {
    resetForm();
    setShowStartOverDialog(false);
    setActiveTab("content");
  }, [resetForm]);

  // Page navigation
  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(totalPages, page));
      setCurrentPage(clamped);
      const el = previewScrollRef.current;
      if (el) el.scrollTo({ top: (clamped - 1) * pageStep, behavior: "smooth" });
    },
    [totalPages, pageStep],
  );

  const handlePreviewScroll = useCallback(() => {
    const el = previewScrollRef.current;
    if (!el) return;
    const page = Math.min(totalPages, Math.floor(el.scrollTop / pageStep) + 1);
    setCurrentPage(page);
  }, [totalPages, pageStep]);

  // Layer → tab mapping
  const handleLayerOpenSection = useCallback((section: string) => {
    const map: Record<string, EditorTabKey> = {
      header: "content",
      recipient: "content",
      date: "content",
      subject: "style",
      salutation: "content",
      opening: "content",
      qualifications: "content",
      "company-fit": "content",
      closing: "content",
      signoff: "content",
      ps: "content",
    };
    setActiveTab(map[section] ?? "content");
    setMobileView("editor");
  }, []);

  // Click-to-edit on preview
  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cl-section]");
    if (!target) return;
    const section = target.dataset.clSection;
    if (!section) return;
    handleLayerOpenSection(section);
  }, [handleLayerOpenSection]);

  // ── Tab content ──
  const tabContent = (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <WorkspaceErrorBoundary>
        {activeTab === "content" && <CoverLetterContentTab />}
        {activeTab === "target" && <CoverLetterTargetTab />}
        {activeTab === "style" && <CoverLetterStyleTab />}
        {activeTab === "format" && <CoverLetterFormatTab />}
      </WorkspaceErrorBoundary>

      <div className="p-4 pb-8">
        <button
          onClick={() => setShowStartOverDialog(true)}
          className="w-full py-2 text-[11px] font-medium text-gray-600 hover:text-gray-400 border border-gray-800/50 hover:border-gray-700/60 rounded-xl transition-all active:scale-[0.98]"
        >
          Start Over
        </button>
      </div>
    </div>
  );

  // ── Editor panel ──
  const letterType = form.letterType.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const editorPanel = (
    <div className="flex flex-col h-full">
      <WorkspaceHeader title="Cover Letter" subtitle={letterType}>
        <IconButton onClick={() => undo()} disabled={!canUndo} icon={Icons.undo} tooltip="Undo" />
        <IconButton onClick={() => redo()} disabled={!canRedo} icon={Icons.redo} tooltip="Redo" />
      </WorkspaceHeader>

      <EditorTabNav
        tabs={EDITOR_TABS.map((t) => ({ key: t.key, label: t.label, icon: t.icon }))}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as EditorTabKey)}
      />

      {tabContent}
    </div>
  );

  // ── Preview panel ──
  const previewPanel = (
    <div className="flex flex-col h-full bg-gray-950/40">
      {/* Preview toolbar */}
      <div className="shrink-0 flex items-center justify-between h-10 px-3 border-b border-gray-800/40">
        <div className="flex items-center gap-1">
          <IconButton onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))} icon={Icons.zoomOut} tooltip="Zoom out" />
          <span className="text-[10px] text-gray-500 w-9 text-center font-mono tabular-nums">{zoom}%</span>
          <IconButton onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))} icon={Icons.zoomIn} tooltip="Zoom in" />
          <button onClick={() => setZoom(ZOOM_DEFAULT)} className="text-[10px] text-gray-600 hover:text-gray-400 px-1.5 py-0.5 rounded-md hover:bg-white/4 transition-colors">
            Reset
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <ActionButton variant="primary" size="sm" icon={Icons.print} onClick={handlePrint}>
            Export
          </ActionButton>
        </div>
      </div>

      {/* Template quick-switch strip */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-gray-800/30 overflow-x-auto scrollbar-none">
        <span className="text-[8px] text-gray-600 shrink-0 mr-0.5 uppercase tracking-widest font-bold">TPL</span>
        {COVER_LETTER_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setTemplate(tpl.id)}
            className={`shrink-0 flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all ${
              form.style.template === tpl.id
                ? "border-primary-500/50 bg-primary-500/10 text-primary-300"
                : "border-gray-700/40 text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/10" style={{ backgroundColor: tpl.accent }} />
            {tpl.label}
          </button>
        ))}
      </div>

      {/* Preview canvas */}
      <div
        ref={previewScrollRef}
        className="flex-1 overflow-auto"
        onScroll={handlePreviewScroll}
        onClick={handlePreviewClick}
        style={{ backgroundColor: "#374151" }}
      >
        <div
          className="cl-canvas-root flex justify-center py-6 px-4"
          style={{ minHeight: "100%" }}
        >
          <div style={{ position: "relative" }}>
            <div
              id="cl-print-area"
              ref={printAreaRef}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <CoverLetterRenderer form={form} onPageCount={handlePageCount} pageGap={PAGE_GAP} />
            </div>
          </div>
        </div>
      </div>

      {/* Page navigation bar */}
      <div className="shrink-0 flex items-center justify-center gap-2 h-10 border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm px-3">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Previous page"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {totalPages <= PAGE_DOTS_THRESHOLD ? (
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                title={`Page ${i + 1}`}
                className={`rounded-full transition-all ${
                  i + 1 === currentPage
                    ? "w-5 h-1.5 bg-primary-400"
                    : "w-1.5 h-1.5 bg-gray-600 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-gray-400 tabular-nums font-mono min-w-15 text-center">
            {currentPage} / {totalPages}
          </span>
        )}

        <span className="text-[10px] text-gray-600 tabular-nums hidden sm:block">
          pg {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Next page"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );

  // ── Layout ──
  return (
    <div className="flex flex-col h-full bg-gray-950 text-white overflow-hidden">
      {/* Mobile bottom bar */}
      <div className="lg:hidden order-last">
        <BottomBar
          actions={[
            { key: "editor", label: "Edit", icon: Icons.edit },
            { key: "preview", label: "Preview", icon: Icons.preview },
            { key: "print", label: "Export", icon: Icons.print, primary: true },
          ]}
          activeKey={mobileView}
          onAction={(key) => {
            if (key === "print") handlePrint();
            else setMobileView(key as "editor" | "preview");
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div
          className={`${
            mobileView === "editor" ? "flex" : "hidden"
          } lg:flex w-full lg:w-80 xl:w-96 lg:min-w-72 shrink-0 flex-col border-r border-gray-800/40 bg-gray-950 overflow-hidden`}
        >
          {editorPanel}
        </div>

        {/* Preview + layers */}
        <div
          className={`${
            mobileView === "preview" ? "flex" : "hidden"
          } lg:flex flex-1 overflow-hidden`}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            {previewPanel}
          </div>
          <div className="hidden lg:flex">
            <CoverLetterLayersPanel
              onOpenSection={handleLayerOpenSection}
              onHoverSection={setHoveredSection}
              collapsed={layersCollapsed}
              onToggleCollapse={() => setLayersCollapsed((p) => !p)}
            />
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={showStartOverDialog}
        title="Start Over?"
        description="This will reset your entire cover letter. You cannot undo this action."
        confirmLabel="Reset Everything"
        onConfirm={handleStartOver}
        onCancel={() => setShowStartOverDialog(false)}
        variant="danger"
      />
    </div>
  );
}
