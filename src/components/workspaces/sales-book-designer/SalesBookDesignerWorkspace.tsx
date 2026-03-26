// =============================================================================
// DMSuite — Sales Book Designer Workspace (v3)
// Complete redesign: tabbed editor (Form/Brand/Style/Print/More)
// Mobile: full-screen tabs + bottom action bar
// Tablet: slim editor + preview
// Desktop: editor panel + preview canvas + layers panel
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSalesBookEditor, useSalesBookUndo } from "@/stores/sales-book-editor";
import { printHTML } from "@/lib/print";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createSalesBookManifest } from "@/lib/chiko/manifests/sales-book";
import {
  SALES_DOCUMENT_TYPES,
  DOCUMENT_TYPE_CONFIGS,
  SALES_BOOK_TEMPLATES,
  totalFormCount,
  totalPageCount,
} from "@/lib/sales-book/schema";
import type { SalesDocumentType } from "@/lib/invoice/schema";
import BlankFormRenderer from "@/lib/sales-book/BlankFormRenderer";
import SalesFormTab from "./tabs/SalesFormTab";
import SalesBrandTab from "./tabs/SalesBrandTab";
import SalesStyleTab from "./tabs/SalesStyleTab";
import SalesPrintTab from "./tabs/SalesPrintTab";
import SalesAdvancedTab from "./tabs/SalesAdvancedTab";
import SBLayersPanel from "./SBLayersPanel";
import {
  EditorTabNav,
  BottomBar,
  WorkspaceHeader,
  IconButton,
  ActionButton,
  ConfirmDialog,
  Icons,
  TabIcons,
} from "./SalesUIKit";

// =============================================================================
// Editor tab definitions
// =============================================================================

const EDITOR_TABS = [
  { key: "form", label: "Form", icon: TabIcons.form },
  { key: "brand", label: "Brand", icon: TabIcons.brand },
  { key: "style", label: "Style", icon: TabIcons.style },
  { key: "print", label: "Print", icon: TabIcons.print },
  { key: "more", label: "More", icon: TabIcons.more },
] as const;

type EditorTabKey = (typeof EDITOR_TABS)[number]["key"];

// =============================================================================
// Main Workspace
// =============================================================================

interface Props {
  initialDocumentType?: SalesDocumentType;
  initialPageSize?: "a4" | "a5" | "letter" | "legal";
}

export default function SalesBookDesignerWorkspace({ initialDocumentType, initialPageSize }: Props) {
  const form = useSalesBookEditor((s) => s.form);
  const setDocumentType = useSalesBookEditor((s) => s.setDocumentType);
  const convertToType = useSalesBookEditor((s) => s.convertToType);
  const resetForm = useSalesBookEditor((s) => s.resetForm);
  const updateStyle = useSalesBookEditor((s) => s.updateStyle);
  const updatePrint = useSalesBookEditor((s) => s.updatePrint);
  const { undo, redo, canUndo, canRedo } = useSalesBookUndo();

  const printRef = useRef<(() => void) | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useChikoActions(() => createSalesBookManifest({ onPrintRef: printRef }));

  // Active editor tab
  const [activeTab, setActiveTab] = useState<EditorTabKey>("form");

  // Mobile view mode: editor or preview
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  // Zoom
  const [zoom, setZoom] = useState(100);

  // Convert dropdown
  const [showConvert, setShowConvert] = useState(false);
  const convertRef = useRef<HTMLDivElement>(null);

  // Layers panel
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Confirm dialog for "Start Over"
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  // Derived
  const forms = totalFormCount(form.serialConfig);
  const pages = totalPageCount(form.serialConfig, form.printConfig);
  const previewPages = 1;
  const config = DOCUMENT_TYPE_CONFIGS[form.documentType as SalesDocumentType];

  // Initialize document type and page size from wrapper props
  useEffect(() => {
    if (initialDocumentType) setDocumentType(initialDocumentType);
    if (initialPageSize) updatePrint({ pageSize: initialPageSize });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dispatch workspace:dirty on form changes so SaveIndicator + projects track activity
  const formRef = useRef(form);
  useEffect(() => {
    if (formRef.current === form) return; // skip initial mount
    formRef.current = form;
    window.dispatchEvent(new CustomEvent("workspace:dirty"));
  }, [form]);

  // Dispatch milestone progress based on actual content state
  const prevSBMilestonesRef = useRef<string>("");
  useEffect(() => {
    const milestones: string[] = [];
    // "input" — company branding has been filled
    const hasInput = form.companyBranding.name.trim().length > 0;
    if (hasInput) milestones.push("input");
    // "content" — form has serial entries configured
    if (forms > 0) milestones.push("content");
    const key = milestones.join(",");
    if (key !== prevSBMilestonesRef.current) {
      prevSBMilestonesRef.current = key;
      milestones.forEach((m) =>
        window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: m } }))
      );
    }
  }, [form.companyBranding.name, forms]);

  // Highlight elements on canvas when hovering a layer
  useEffect(() => {
    const container = printAreaRef.current;
    if (!container) return;
    container.querySelectorAll(".sb-layer-highlight").forEach((el) => el.classList.remove("sb-layer-highlight"));
    if (hoveredSection && /^[a-z-]+$/.test(hoveredSection)) {
      container.querySelectorAll(`[data-sb-section="${hoveredSection}"]`).forEach((el) => el.classList.add("sb-layer-highlight"));
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

  const handleConvert = useCallback(
    (type: SalesDocumentType) => {
      convertToType(type);
      setShowConvert(false);
    },
    [convertToType],
  );

  const handlePrint = useCallback(() => {
    const printEl = document.getElementById("sb-print-area");
    if (!printEl) return;
    const html = `<!DOCTYPE html><html><head>
      <title>${config.title} - Sales Book</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: ${form.printConfig.pageSize === "a4" ? "A4" : form.printConfig.pageSize === "letter" ? "letter" : "legal"} portrait; margin: 0; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        [data-sales-book-page] { page-break-after: always; }
        [data-sales-book-page]:last-child { page-break-after: auto; }
      </style></head><body>${printEl.innerHTML}</body></html>`;
    printHTML(html);
    window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "exported" } }));
  }, [config.title, form.printConfig.pageSize]);
  printRef.current = handlePrint;

  const handleStartOver = useCallback(() => {
    resetForm(initialDocumentType);
    setShowStartOverDialog(false);
    setActiveTab("form");
  }, [resetForm, initialDocumentType]);

  // Tab-to-section mapping for layers panel click
  const handleLayerOpenSection = useCallback((section: string) => {
    const sectionToTab: Record<string, EditorTabKey> = {
      "document-type": "form", layout: "form", branding: "brand",
      style: "style", print: "print", logos: "more", blocks: "more",
    };
    setActiveTab(sectionToTab[section] ?? "form");
    setMobileView("editor");
  }, []);

  // Click-to-edit on preview
  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-sb-section]");
    if (!target) return;
    const section = target.dataset.sbSection;
    if (!section) return;
    handleLayerOpenSection(section);
  }, [handleLayerOpenSection]);

  // ── Tab Content ──
  const tabContent = (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {activeTab === "form" && <SalesFormTab />}
      {activeTab === "brand" && <SalesBrandTab />}
      {activeTab === "style" && <SalesStyleTab />}
      {activeTab === "print" && <SalesPrintTab />}
      {activeTab === "more" && <SalesAdvancedTab />}

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
      <WorkspaceHeader title={config.title} subtitle={`${forms} forms · ${pages} pg`}>
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
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-black/40 py-1">
                {SALES_DOCUMENT_TYPES.filter((t) => t !== form.documentType).map((type) => {
                  const tc = DOCUMENT_TYPE_CONFIGS[type];
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
        {SALES_BOOK_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => updateStyle({ template: tpl.id, accentColor: tpl.accent, borderStyle: tpl.borderStyle })}
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

      {/* Preview canvas */}
      <div
        className="flex-1 overflow-auto"
        onClick={handlePreviewClick}
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        <style>{`
          .sb-canvas-root [data-sb-section] { transition: outline 0.15s ease, box-shadow 0.15s ease; outline: 2px solid transparent; border-radius: 2px; cursor: pointer; }
          .sb-canvas-root [data-sb-section]:hover { outline: 2px solid rgba(139,92,246,0.4); box-shadow: 0 0 0 4px rgba(139,92,246,0.06); }
          .sb-canvas-root [data-sb-section].sb-layer-highlight { outline: 2px solid rgba(139,92,246,0.6); box-shadow: 0 0 0 6px rgba(139,92,246,0.1); }
          @media print { .sb-canvas-root [data-sb-section] { outline: none !important; box-shadow: none !important; cursor: default !important; } }
        `}</style>
        <div
          className="sb-canvas-root flex flex-col items-center py-6 px-4"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
        >
          <div id="sb-print-area" ref={printAreaRef}>
            <BlankFormRenderer form={form} previewPageCount={previewPages} />
          </div>
          {pages > previewPages && (
            <div className="text-[10px] text-gray-600 mt-4">
              Showing {previewPages} of {pages} pages · All {pages} will print
            </div>
          )}
        </div>
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
            <SBLayersPanel
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
        description="This will reset all your form settings. You cannot undo this action."
        confirmLabel="Reset Everything"
        onConfirm={handleStartOver}
        onCancel={() => setShowStartOverDialog(false)}
        variant="danger"
      />
    </div>
  );
}
