// =============================================================================
// DMSuite — Contract Designer Workspace (v1)
// Tabbed editor (Document/Parties/Clauses/Style/Print)
// Mobile: full-screen tabs + bottom action bar
// Tablet: slim editor + preview
// Desktop: editor panel + preview canvas + layers panel
// Follows the SalesBookDesignerWorkspace.tsx architecture exactly.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useContractEditor, useContractUndo } from "@/stores/contract-editor";
import { printHTML } from "@/lib/print";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createContractManifest } from "@/lib/chiko/manifests/contract";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_CONFIGS,
  CONTRACT_TEMPLATES,
} from "@/lib/contract/schema";
import type { ContractType } from "@/lib/contract/schema";
import ContractRenderer, { PAGE_PX, PAGE_GAP, getGoogleFontUrl } from "@/lib/contract/ContractRenderer";
import ContractDocumentTab from "./tabs/ContractDocumentTab";
import ContractPartiesTab from "./tabs/ContractPartiesTab";
import ContractClausesTab from "./tabs/ContractClausesTab";
import ContractStyleTab from "./tabs/ContractStyleTab";
import ContractPrintTab from "./tabs/ContractPrintTab";
import ContractLayersPanel from "./ContractLayersPanel";
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

// =============================================================================
// Editor tab definitions
// =============================================================================

const TAB_ICONS = {
  document: <SIcon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />,
  parties: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  clauses: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  style: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="13.5" cy="17.5" r="2.5" />
    </svg>
  ),
  print: <SIcon d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />,
};

const EDITOR_TABS = [
  { key: "document", label: "Document", icon: TAB_ICONS.document },
  { key: "parties", label: "Parties", icon: TAB_ICONS.parties },
  { key: "clauses", label: "Clauses", icon: TAB_ICONS.clauses },
  { key: "style", label: "Style", icon: TAB_ICONS.style },
  { key: "print", label: "Print", icon: TAB_ICONS.print },
] as const;

type EditorTabKey = (typeof EDITOR_TABS)[number]["key"];

// =============================================================================
// Main Workspace
// =============================================================================

interface Props {
  initialContractType?: ContractType;
}

export default function ContractDesignerWorkspace({ initialContractType }: Props) {
  const form = useContractEditor((s) => s.form);
  const setContractType = useContractEditor((s) => s.setContractType);
  const convertToType = useContractEditor((s) => s.convertToType);
  const resetForm = useContractEditor((s) => s.resetForm);
  const updateStyle = useContractEditor((s) => s.updateStyle);
  const { undo, redo, canUndo, canRedo } = useContractUndo();

  const printAreaRef = useRef<HTMLDivElement>(null);
  // Scroll container ref for the preview area
  const previewScrollRef = useRef<HTMLDivElement>(null);
  // Ref for Chiko print action
  const chikoOnPrintRef = useRef<(() => void) | null>(null);

  // Active editor tab
  const [activeTab, setActiveTab] = useState<EditorTabKey>("document");

  // Mobile view mode
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  // Zoom
  const [zoom, setZoom] = useState(100);

  // Multi-page tracking
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Convert dropdown
  const [showConvert, setShowConvert] = useState(false);
  const convertRef = useRef<HTMLDivElement>(null);

  // Layers panel
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Confirm dialog for "Start Over"
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  // Derived
  const config = CONTRACT_TYPE_CONFIGS[form.contractType];
  const enabledClauses = form.clauses.filter((c) => c.enabled).length;
  const pageDim = PAGE_PX[form.printConfig.pageSize] ?? PAGE_PX.a4;
  const pageH = pageDim.h;
  const pageStep = pageH + PAGE_GAP; // scroll distance between page starts

  // Initialize contract type from wrapper props
  useEffect(() => {
    if (initialContractType) setContractType(initialContractType);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dispatch workspace:dirty on form changes so SaveIndicator + projects track activity
  const formRef = useRef(form);
  useEffect(() => {
    if (formRef.current === form) return;
    formRef.current = form;
    window.dispatchEvent(new CustomEvent("workspace:dirty"));
  }, [form]);

  // Dispatch milestone progress based on actual content state
  const prevMilestonesRef = useRef<string>("");
  useEffect(() => {
    const milestones: string[] = [];
    // "input" — parties or document info filled
    const hasInput = form.documentInfo.title.trim().length > 0 ||
      form.partyA.name.trim().length > 0 || form.partyB.name.trim().length > 0;
    if (hasInput) milestones.push("input");
    // "content" — at least one enabled clause exists
    if (enabledClauses > 0) milestones.push("content");
    const key = milestones.join(",");
    if (key !== prevMilestonesRef.current) {
      prevMilestonesRef.current = key;
      milestones.forEach((m) =>
        window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: m } }))
      );
    }
  }, [form.documentInfo.title, form.partyA.name, form.partyB.name, enabledClauses]);

  // Highlight elements on canvas when hovering a layer
  useEffect(() => {
    const container = printAreaRef.current;
    if (!container) return;
    container.querySelectorAll(".ct-layer-highlight").forEach((el) => el.classList.remove("ct-layer-highlight"));
    if (hoveredSection && /^[a-z-]+$/.test(hoveredSection)) {
      container.querySelectorAll(`[data-ct-section="${hoveredSection}"]`).forEach((el) => el.classList.add("ct-layer-highlight"));
    }
  }, [hoveredSection]);

  // Close convert dropdown on outside click
  useEffect(() => {
    if (!showConvert) return;
    const handler = (e: MouseEvent) => {
      if (convertRef.current && !convertRef.current.contains(e.target as Node)) setShowConvert(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showConvert]);

  // Page count is reported by the renderer via onPageCount callback
  const handlePageCount = useCallback((count: number) => {
    setTotalPages(count);
    // Clamp current page if it exceeds new total (e.g., clauses were removed)
    setCurrentPage((prev) => Math.min(prev, Math.max(1, count)));
  }, []);

  // Reset to page 1 when contract type or page size changes
  useEffect(() => {
    setCurrentPage(1);
    if (previewScrollRef.current) previewScrollRef.current.scrollTop = 0;
  }, [form.contractType, form.printConfig.pageSize]);

  const handleConvert = useCallback(
    (type: ContractType) => {
      convertToType(type);
      setShowConvert(false);
    },
    [convertToType],
  );

  const handlePrint = useCallback(() => {
    const printEl = document.getElementById("ct-print-area");
    if (!printEl) return;
    const pageSize = form.printConfig.pageSize === "a4" ? "A4" : form.printConfig.pageSize === "letter" ? "letter" : "legal";
    const fontLink = `<link rel="stylesheet" href="${getGoogleFontUrl(form.style.fontPairing)}" />`;
    const html = `<!DOCTYPE html><html><head>
      <title>${form.documentInfo.title} - Contract</title>
      ${fontLink}
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: ${pageSize} portrait; margin: 0; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        [data-ct-measure] { display: none !important; }
        [data-ct-pages] { gap: 0 !important; }
        [data-contract-page] { page-break-after: always; }
        [data-contract-page]:last-child { page-break-after: auto; }
      </style></head><body>${printEl.innerHTML}</body></html>`;
    printHTML(html);
    window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "exported" } }));
  }, [form.documentInfo.title, form.printConfig.pageSize, form.style.fontPairing]);

  // Keep Chiko's print ref in sync
  useEffect(() => {
    chikoOnPrintRef.current = handlePrint;
  }, [handlePrint]);

  // Register Chiko manifest
  useChikoActions(() => createContractManifest({ onPrintRef: chikoOnPrintRef }));

  const handleStartOver = useCallback(() => {
    resetForm(initialContractType);
    setShowStartOverDialog(false);
    setActiveTab("document");
  }, [resetForm, initialContractType]);

  // Page navigation — accounts for page gap between discrete page divs
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

  // Tab-to-section mapping for layers panel click
  const handleLayerOpenSection = useCallback((section: string) => {
    const sectionToTab: Record<string, EditorTabKey> = {
      document: "document",
      parties: "parties",
      clauses: "clauses",
      style: "style",
      print: "print",
    };
    setActiveTab(sectionToTab[section] ?? "document");
    setMobileView("editor");
  }, []);

  // Click-to-edit on preview
  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-ct-section]");
    if (!target) return;
    const section = target.dataset.ctSection;
    if (!section) return;
    handleLayerOpenSection(section);
  }, [handleLayerOpenSection]);

  // ── Tab Content ──
  const tabContent = (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {activeTab === "document" && <ContractDocumentTab />}
      {activeTab === "parties" && <ContractPartiesTab />}
      {activeTab === "clauses" && <ContractClausesTab />}
      {activeTab === "style" && <ContractStyleTab />}
      {activeTab === "print" && <ContractPrintTab />}

      {/* Start Over — always at the bottom */}
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

  // ── Editor Panel ──
  const editorPanel = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <WorkspaceHeader
        title={config.label}
        subtitle={`${enabledClauses} clauses`}
      >
        <IconButton onClick={() => undo()} disabled={!canUndo} icon={Icons.undo} tooltip="Undo" />
        <IconButton onClick={() => redo()} disabled={!canRedo} icon={Icons.redo} tooltip="Redo" />
      </WorkspaceHeader>

      {/* Tab navigation */}
      <EditorTabNav
        tabs={EDITOR_TABS.map((t) => ({ key: t.key, label: t.label, icon: t.icon }))}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as EditorTabKey)}
      />

      {/* Tab content */}
      {tabContent}
    </div>
  );

  // ── Preview Panel ──
  const previewPanel = (
    <div className="flex flex-col h-full bg-gray-950/40">
      {/* Preview toolbar */}
      <div className="shrink-0 flex items-center justify-between h-10 px-3 border-b border-gray-800/40">
        <div className="flex items-center gap-1">
          <IconButton onClick={() => setZoom((z) => Math.max(30, z - 10))} icon={Icons.zoomOut} tooltip="Zoom out" />
          <span className="text-[10px] text-gray-500 w-9 text-center font-mono tabular-nums">{zoom}%</span>
          <IconButton onClick={() => setZoom((z) => Math.min(200, z + 10))} icon={Icons.zoomIn} tooltip="Zoom in" />
          <button onClick={() => setZoom(100)} className="text-[10px] text-gray-600 hover:text-gray-400 px-1.5 py-0.5 rounded-md hover:bg-white/4 transition-colors">
            Reset
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Convert dropdown */}
          <div className="relative" ref={convertRef}>
            <ActionButton variant="secondary" size="sm" icon={Icons.convert} onClick={() => setShowConvert(!showConvert)}>
              Convert
            </ActionButton>
            {showConvert && (
              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-black/40 py-1">
                {CONTRACT_TYPES.filter((t) => t !== form.contractType).map((type) => {
                  const tc = CONTRACT_TYPE_CONFIGS[type];
                  return (
                    <button key={type} onClick={() => handleConvert(type)} className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-white/6 hover:text-gray-100 transition-colors">
                      {tc.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Print / Export */}
          <ActionButton variant="primary" size="sm" icon={Icons.print} onClick={handlePrint}>
            Print
          </ActionButton>
        </div>
      </div>

      {/* Template quick-switch strip */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-gray-800/30 overflow-x-auto scrollbar-none">
        <span className="text-[8px] text-gray-600 shrink-0 mr-0.5 uppercase tracking-widest font-bold">TPL</span>
        {CONTRACT_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => updateStyle({ template: tpl.id, accentColor: tpl.accent, headerStyle: tpl.headerStyle })}
            className={`shrink-0 flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all ${
              form.style.template === tpl.id
                ? "border-primary-500/50 bg-primary-500/10 text-primary-300"
                : "border-gray-700/40 text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/10" style={{ backgroundColor: tpl.accent }} />
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Preview canvas — PDF viewer style (grey bg + page shadows) */}
      <div
        ref={previewScrollRef}
        className="flex-1 overflow-auto"
        onScroll={handlePreviewScroll}
        onClick={handlePreviewClick}
        style={{ backgroundColor: "#374151" }}
      >
        <style>{`
          .ct-canvas-root [data-ct-section] { transition: outline 0.15s ease, box-shadow 0.15s ease; outline: 2px solid transparent; border-radius: 2px; cursor: pointer; }
          .ct-canvas-root [data-ct-section]:hover { outline: 2px solid rgba(139,92,246,0.4); box-shadow: 0 0 0 4px rgba(139,92,246,0.06); }
          .ct-canvas-root [data-ct-section].ct-layer-highlight { outline: 2px solid rgba(139,92,246,0.6); box-shadow: 0 0 0 6px rgba(139,92,246,0.1); }
          .ct-canvas-root [data-contract-page] { box-shadow: 0 4px 32px rgba(0,0,0,0.45); }
          @media print { .ct-canvas-root [data-ct-section] { outline: none !important; box-shadow: none !important; cursor: default !important; } .ct-canvas-root [data-contract-page] { box-shadow: none !important; } }
        `}</style>
        <div
          className="ct-canvas-root flex justify-center py-6 px-4"
          style={{ minHeight: "100%" }}
        >
          {/* Page-sized container with overflow visible — inner doc is naturally wider */}
          <div style={{ position: "relative" }}>
            {/* The document — paginated with discrete page divs */}
            <div
              id="ct-print-area"
              ref={printAreaRef}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <ContractRenderer form={form} onPageCount={handlePageCount} pageGap={PAGE_GAP} />
            </div>
          </div>
        </div>
      </div>

      {/* Wondershare / Acrobat-style page navigation bar */}
      <div className="shrink-0 flex items-center justify-center gap-2 h-10 border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm px-3">
        {/* Prev page */}
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

        {/* Page dots for ≤8 pages */}
        {totalPages <= 8 ? (
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
          /* Text counter for long docs */
          <span className="text-[11px] text-gray-400 tabular-nums font-mono min-w-[60px] text-center">
            {currentPage} / {totalPages}
          </span>
        )}

        {/* Page text label */}
        <span className="text-[10px] text-gray-600 tabular-nums hidden sm:block">
          pg {currentPage} of {totalPages}
        </span>

        {/* Next page */}
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
      {/* Mobile bottom action bar */}
      <div className="lg:hidden order-last">
        <BottomBar
          actions={[
            { key: "editor", label: "Edit", icon: Icons.edit },
            { key: "preview", label: "Preview", icon: Icons.preview },
            { key: "print", label: "Print", icon: Icons.print, primary: true },
          ]}
          activeKey={mobileView}
          onAction={(key) => {
            if (key === "print") handlePrint();
            else setMobileView(key as "editor" | "preview");
          }}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor panel */}
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
            <ContractLayersPanel
              onOpenSection={handleLayerOpenSection}
              onHoverSection={setHoveredSection}
              collapsed={layersCollapsed}
              onToggleCollapse={() => setLayersCollapsed((p) => !p)}
            />
          </div>
        </div>
      </div>

      {/* Confirm dialog for Start Over */}
      <ConfirmDialog
        open={showStartOverDialog}
        title="Start Over?"
        description="This will reset all your contract settings and clauses. You cannot undo this action."
        confirmLabel="Reset Everything"
        onConfirm={handleStartOver}
        onCancel={() => setShowStartOverDialog(false)}
        variant="danger"
      />
    </div>
  );
}
