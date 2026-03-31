// =============================================================================
// DMSuite — Document Signer & Form Filler — Workspace
// DocuSeal-inspired document filling & signing platform
// Tabbed editor (Document / Fields / Signers / Style / Settings)
// Mobile: full-screen tabs + bottom action bar
// Desktop: editor panel + preview canvas + layers panel
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useDocumentSignerEditor,
  useDocumentSignerUndo,
  DOCUMENT_TEMPLATES,
} from "@/stores/document-signer-editor";
import { printHTML } from "@/lib/print";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createDocumentSignerManifest } from "@/lib/chiko/manifests/document-signer";
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import {
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  ZOOM_DEFAULT,
  PAGE_DOTS_THRESHOLD,
} from "@/lib/workspace-constants";
import "@/styles/workspace-canvas.css";
import DocumentSignerRenderer, {
  PAGE_PX,
  PAGE_GAP,
  buildPrintHTML,
} from "./DocumentSignerRenderer";
import DocumentSignerDocumentTab from "./tabs/DocumentSignerDocumentTab";
import DocumentSignerFieldsTab from "./tabs/DocumentSignerFieldsTab";
import DocumentSignerSignersTab from "./tabs/DocumentSignerSignersTab";
import DocumentSignerStyleTab from "./tabs/DocumentSignerStyleTab";
import DocumentSignerSettingsTab from "./tabs/DocumentSignerSettingsTab";
import DocumentSignerLayersPanel from "./DocumentSignerLayersPanel";
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
  document: <SIcon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />,
  fields: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  signers: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  style: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <circle cx="13.5" cy="17.5" r="2.5" />
    </svg>
  ),
  settings: <SIcon d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />,
};

const EDITOR_TABS = [
  { key: "document", label: "Document", icon: TAB_ICONS.document },
  { key: "fields", label: "Fields", icon: TAB_ICONS.fields },
  { key: "signers", label: "Signers", icon: TAB_ICONS.signers },
  { key: "style", label: "Style", icon: TAB_ICONS.style },
  { key: "settings", label: "Settings", icon: TAB_ICONS.settings },
] as const;

type EditorTabKey = (typeof EDITOR_TABS)[number]["key"];

// =============================================================================
// Main Workspace
// =============================================================================

export default function DocumentSignerWorkspace() {
  const form = useDocumentSignerEditor((s) => s.form);
  const resetForm = useDocumentSignerEditor((s) => s.resetForm);
  const updateField = useDocumentSignerEditor((s) => s.updateField);
  const setSelectedFieldId = useDocumentSignerEditor((s) => s.setSelectedFieldId);
  const addAuditEntry = useDocumentSignerEditor((s) => s.addAuditEntry);
  const { undo, redo, canUndo, canRedo } = useDocumentSignerUndo();

  const printAreaRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const chikoOnPrintRef = useRef<(() => void) | null>(null);

  const [activeTab, setActiveTab] = useState<EditorTabKey>("document");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  const pageDim = PAGE_PX.a4;
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
    if (form.documentName.trim() && form.documentName !== "Untitled Document") milestones.push("input");
    if (form.fields.length > 0) milestones.push("content");
    if (form.signers.some((s) => s.email)) milestones.push("recipients");
    if (form.fields.some((f) => f.value)) milestones.push("filled");
    const key = milestones.join(",");
    if (key !== prevMilestonesRef.current) {
      prevMilestonesRef.current = key;
      milestones.forEach((m) => dispatchProgress(m as "input" | "content"));
    }
  }, [form.documentName, form.fields, form.signers]);

  // Page count from renderer
  const handlePageCount = useCallback((count: number) => {
    setTotalPages(count);
    setCurrentPage((prev) => Math.min(prev, Math.max(1, count)));
  }, []);

  // Print / Export
  const handlePrint = useCallback(() => {
    const html = buildPrintHTML(form);
    printHTML(html);
    addAuditEntry("document_exported", "User", "Document exported as PDF");
    dispatchProgress("exported");
  }, [form, addAuditEntry]);

  useEffect(() => {
    chikoOnPrintRef.current = handlePrint;
  }, [handlePrint]);

  // Register Chiko manifest
  useChikoActions(() =>
    createDocumentSignerManifest({ onPrintRef: chikoOnPrintRef })
  );

  const handleStartOver = useCallback(() => {
    resetForm();
    setShowStartOverDialog(false);
    setActiveTab("document");
  }, [resetForm]);

  // Page navigation
  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(totalPages, page));
      setCurrentPage(clamped);
      const el = previewScrollRef.current;
      if (el) el.scrollTo({ top: (clamped - 1) * pageStep, behavior: "smooth" });
    },
    [totalPages, pageStep]
  );

  const handlePreviewScroll = useCallback(() => {
    const el = previewScrollRef.current;
    if (!el) return;
    const page = Math.min(totalPages, Math.floor(el.scrollTop / pageStep) + 1);
    setCurrentPage(page);
  }, [totalPages, pageStep]);

  // Field drag end handler
  const handleFieldDragEnd = useCallback(
    (fieldId: string, x: number, y: number) => {
      updateField(fieldId, { x, y });
    },
    [updateField]
  );

  // Layer → tab mapping
  const handleLayerOpenSection = useCallback((section: string) => {
    const map: Record<string, EditorTabKey> = {
      document: "document",
      fields: "fields",
      signers: "signers",
      style: "style",
      settings: "settings",
    };
    setActiveTab(map[section] ?? "document");
    setMobileView("editor");
  }, []);

  // ── Tab content ──
  const tabContent = (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <WorkspaceErrorBoundary>
        {activeTab === "document" && <DocumentSignerDocumentTab />}
        {activeTab === "fields" && <DocumentSignerFieldsTab />}
        {activeTab === "signers" && <DocumentSignerSignersTab />}
        {activeTab === "style" && <DocumentSignerStyleTab />}
        {activeTab === "settings" && <DocumentSignerSettingsTab />}
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
  const docType = form.documentType.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const editorPanel = (
    <div className="flex flex-col h-full">
      <WorkspaceHeader title="Document Signer" subtitle={docType}>
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
          <IconButton
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
            icon={Icons.zoomOut}
            tooltip="Zoom out"
          />
          <span className="text-[10px] text-gray-500 w-9 text-center font-mono tabular-nums">
            {zoom}%
          </span>
          <IconButton
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
            icon={Icons.zoomIn}
            tooltip="Zoom in"
          />
          <button
            onClick={() => setZoom(ZOOM_DEFAULT)}
            className="text-[10px] text-gray-600 hover:text-gray-400 px-1.5 py-0.5 rounded-md hover:bg-white/4 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Status badge */}
          <span
            className={`text-[9px] font-medium px-2 py-0.5 rounded-full mr-1 ${
              form.status === "completed"
                ? "bg-green-500/20 text-green-400"
                : form.status === "in-progress"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-gray-700/40 text-gray-500"
            }`}
          >
            {form.status.replace("-", " ").toUpperCase()}
          </span>
          <ActionButton variant="primary" size="sm" icon={Icons.print} onClick={handlePrint}>
            Export
          </ActionButton>
        </div>
      </div>

      {/* Template quick-switch strip */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-gray-800/30 overflow-x-auto scrollbar-none">
        <span className="text-[8px] text-gray-600 shrink-0 mr-0.5 uppercase tracking-widest font-bold">
          TPL
        </span>
        {DOCUMENT_TEMPLATES.filter((t) => t.id !== "custom-upload").map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => useDocumentSignerEditor.getState().applyTemplate(tpl.id)}
            className={`shrink-0 flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all ${
              form.documentType === tpl.type
                ? "border-primary-500/50 bg-primary-500/10 text-primary-300"
                : "border-gray-700/40 text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/10"
              style={{ backgroundColor: tpl.thumbnailColor }}
            />
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Preview canvas */}
      <div
        ref={previewScrollRef}
        className="flex-1 overflow-auto"
        onScroll={handlePreviewScroll}
        style={{ backgroundColor: "#374151" }}
      >
        <div
          className="flex justify-center py-6 px-4"
          style={{ minHeight: "100%" }}
        >
          <div style={{ position: "relative" }}>
            <div
              id="ds-print-area"
              ref={printAreaRef}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <DocumentSignerRenderer
                form={form}
                onPageCount={handlePageCount}
                pageGap={PAGE_GAP}
                onFieldClick={(id) => {
                  setSelectedFieldId(id);
                  setActiveTab("fields");
                }}
                selectedFieldId={form.selectedFieldId}
                onFieldDragEnd={handleFieldDragEnd}
              />
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
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
          <div className="flex-1 flex flex-col overflow-hidden">{previewPanel}</div>
          <div className="hidden lg:flex">
            <DocumentSignerLayersPanel
              onOpenSection={handleLayerOpenSection}
              onHoverSection={() => {}}
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
        description="This will reset your entire document. All fields, signers, and signatures will be lost."
        confirmLabel="Reset Everything"
        onConfirm={handleStartOver}
        onCancel={() => setShowStartOverDialog(false)}
        variant="danger"
      />
    </div>
  );
}
