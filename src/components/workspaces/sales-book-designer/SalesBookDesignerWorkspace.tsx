// =============================================================================
// DMSuite — Sales Book Designer Workspace (v2)
// Split-screen layout: Left = accordion editor sections, Right = live preview.
// Desktop: side-by-side | Mobile: tab-based (Editor | Preview)
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import SBSectionDocumentType from "./SBSectionDocumentType";
import SBSectionBranding from "./SBSectionBranding";
import SBSectionFormLayout from "./SBSectionFormLayout";
import SBSectionPrintConfig from "./SBSectionPrintConfig";
import SBSectionStyle from "./SBSectionStyle";
import SBSectionBrandLogos from "./SBSectionBrandLogos";
import SBSectionCustomBlocks from "./SBSectionCustomBlocks";
import SBLayersPanel from "./SBLayersPanel";

// ── Accordion Section Wrapper ──

function AccordionSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  badge,
  highlighted,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`border-b border-gray-800/60 transition-shadow duration-700 ${highlighted ? "sb-section-glow" : ""}`}>
      <button
        onClick={onToggle}
        className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-800/30 transition-colors group"
      >
        <span className="text-gray-400 group-hover:text-gray-200 transition-colors mr-3 shrink-0">
          {icon}
        </span>
        <span className="text-sm font-medium text-gray-200 flex-1">{title}</span>
        {badge && (
          <span className="text-[10px] font-medium text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-full px-2 py-0.5 mr-2">
            {badge}
          </span>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-gray-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section Icons ──

const SIcon = ({ d, extra }: { d: string; extra?: React.ReactNode }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{extra}
  </svg>
);

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

  // Print handler ref for Chiko manifest
  const printRef = useRef<(() => void) | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Register Chiko action manifest for this tool
  useChikoActions(() => createSalesBookManifest({ onPrintRef: printRef }));

  // Accordion state — only one section open at a time for clean UX
  const [openSection, setOpenSection] = useState<string | null>("document-type");

  // Mobile tab
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  // Zoom
  const [zoom, setZoom] = useState(100);

  // Convert dropdown
  const [showConvert, setShowConvert] = useState(false);

  // Layers panel
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived
  const forms = totalFormCount(form.serialConfig);
  const pages = totalPageCount(form.serialConfig, form.printConfig);
  const previewPages = 1;
  const config = DOCUMENT_TYPE_CONFIGS[form.documentType as SalesDocumentType];

  // Initialize document type and page size from wrapper props
  useEffect(() => {
    if (initialDocumentType) {
      setDocumentType(initialDocumentType);
    }
    if (initialPageSize) {
      updatePrint({ pageSize: initialPageSize });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight elements on canvas when hovering a layer
  useEffect(() => {
    const container = printAreaRef.current;
    if (!container) return;
    // Clear all highlights first
    container.querySelectorAll(".sb-layer-highlight").forEach((el) => el.classList.remove("sb-layer-highlight"));
    if (hoveredSection && /^[a-z-]+$/.test(hoveredSection)) {
      container.querySelectorAll(`[data-sb-section="${hoveredSection}"]`).forEach((el) => el.classList.add("sb-layer-highlight"));
    }
  }, [hoveredSection]);

  const toggleSection = useCallback((key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  }, []);

  // Click-to-edit: clicking an element with data-sb-section opens that sidebar section
  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-sb-section]");
    if (!target) return;
    const section = target.dataset.sbSection;
    if (!section) return;
    setOpenSection(section);
    // On mobile, also switch to the editor tab
    setMobileTab("editor");
  }, []);

  // Layers panel → open sidebar section + glow animation
  const handleLayerOpenSection = useCallback((section: string) => {
    setOpenSection(section);
    setMobileTab("editor");
    // Trigger glow and auto-clear after 1.5s
    setHighlightedSection(section);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedSection(null), 1500);
  }, []);

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
  }, [config.title, form.printConfig.pageSize]);
  printRef.current = handlePrint;

  const handleStartOver = useCallback(() => {
    if (confirm("Start a new form? All changes will be lost.")) {
      resetForm(initialDocumentType);
    }
  }, [resetForm, initialDocumentType]);

  // ── Editor Panel ──
  const editorPanel = (
    <div className="flex flex-col h-full">
      {/* Editor header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-500" />
          <h2 className="text-sm font-semibold text-gray-200">{config.title}</h2>
          <span className="text-[10px] font-mono text-gray-600">
            {forms} forms · {pages} pg
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            className="p-1.5 rounded text-gray-500 hover:text-gray-200 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            className="p-1.5 rounded text-gray-500 hover:text-gray-200 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable accordion sections */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AccordionSection
          title="Document Type"
          icon={<SIcon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" extra={<polyline points="14 2 14 8 20 8" />} />}
          isOpen={openSection === "document-type"}
          onToggle={() => toggleSection("document-type")}
          badge={config.label}
          highlighted={highlightedSection === "document-type"}
        >
          <SBSectionDocumentType />
        </AccordionSection>

        <AccordionSection
          title="Company Branding"
          icon={<SIcon d="M3 3h18v18H3z" extra={<><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /></>} />}
          isOpen={openSection === "branding"}
          onToggle={() => toggleSection("branding")}
          badge={form.companyBranding.name || undefined}
          highlighted={highlightedSection === "branding"}
        >
          <SBSectionBranding />
        </AccordionSection>

        <AccordionSection
          title="Form Layout"
          icon={<SIcon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />}
          isOpen={openSection === "layout"}
          onToggle={() => toggleSection("layout")}
          badge={`${form.formLayout.itemRowCount} rows`}
          highlighted={highlightedSection === "layout"}
        >
          <SBSectionFormLayout />
        </AccordionSection>

        <AccordionSection
          title="Print & Serial"
          icon={<SIcon d="M6 9V2h12v7" extra={<><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>} />}
          isOpen={openSection === "print"}
          onToggle={() => toggleSection("print")}
          badge={`${form.printConfig.formsPerPage}/page`}
          highlighted={highlightedSection === "print"}
        >
          <SBSectionPrintConfig />
        </AccordionSection>

        <AccordionSection
          title="Style & Template"
          icon={<SIcon d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.36-.12-.68-.37-.93-.24-.26-.37-.58-.37-.93 0-.75.6-1.35 1.35-1.35H16c3.31 0 6-2.69 6-6 0-5.52-4.48-9.8-10-9.8z" />}
          isOpen={openSection === "style"}
          onToggle={() => toggleSection("style")}
          highlighted={highlightedSection === "style"}
        >
          <SBSectionStyle />
        </AccordionSection>

        <AccordionSection
          title="Brand & Supplier Logos"
          icon={<SIcon d="M3 3h18v18H3z" extra={<><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>} />}
          isOpen={openSection === "logos"}
          onToggle={() => toggleSection("logos")}
          badge={form.brandLogos.enabled ? `${form.brandLogos.logos.length} logos` : undefined}
          highlighted={highlightedSection === "logos"}
        >
          <SBSectionBrandLogos />
        </AccordionSection>

        <AccordionSection
          title="Custom Blocks"
          icon={<SIcon d="M10 2h4v4h-4z" extra={<><rect x="2" y="10" width="4" height="4" /><rect x="18" y="10" width="4" height="4" /><rect x="10" y="18" width="4" height="4" /><line x1="12" y1="6" x2="12" y2="10" /><line x1="6" y1="12" x2="10" y2="12" /><line x1="14" y1="12" x2="18" y2="12" /><line x1="12" y1="14" x2="12" y2="18" /></>} />}
          isOpen={openSection === "blocks"}
          onToggle={() => toggleSection("blocks")}
          badge={form.customBlocks?.length > 0 ? `${form.customBlocks.length} blocks` : undefined}
          highlighted={highlightedSection === "blocks"}
        >
          <SBSectionCustomBlocks />
        </AccordionSection>

        {/* Start Over */}
        <div className="p-4">
          <button
            onClick={handleStartOver}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 py-2 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );

  // ── Preview Panel ──
  const previewPanel = (
    <div className="flex flex-col h-full bg-gray-900/30">
      {/* Preview toolbar */}
      <div className="shrink-0 flex items-center justify-between h-11 px-3 border-b border-gray-800/60 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.max(30, z - 10))} className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <span className="text-[11px] text-gray-500 w-10 text-center font-mono">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <button onClick={() => setZoom(100)} className="text-[10px] text-gray-600 hover:text-gray-400 px-1.5 py-0.5 rounded hover:bg-gray-800 transition-colors">
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Convert dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowConvert(!showConvert)}
              className="flex items-center gap-1.5 rounded-md bg-gray-800 border border-gray-700 px-2.5 py-1 text-[11px] text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
              </svg>
              Convert
            </button>
            {showConvert && (
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg bg-gray-800 border border-gray-700 shadow-xl py-1">
                {SALES_DOCUMENT_TYPES.filter((t) => t !== form.documentType).map((type) => {
                  const tc = DOCUMENT_TYPE_CONFIGS[type];
                  return (
                    <button key={type} onClick={() => handleConvert(type)} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors">
                      {tc.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Print / Export */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1 text-[11px] font-semibold text-gray-950 hover:bg-primary-400 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print / Export
          </button>
        </div>
      </div>

      {/* Template quick-switch strip */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-800/40 overflow-x-auto scrollbar-thin">
        <span className="text-[9px] text-gray-600 shrink-0 mr-1">Template:</span>
        {SALES_BOOK_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => updateStyle({ template: tpl.id, accentColor: tpl.accent, borderStyle: tpl.borderStyle })}
            className={`shrink-0 flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] transition-all ${
              form.style.template === tpl.id
                ? "border-primary-500 bg-primary-500/10 text-primary-300"
                : "border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tpl.accent }} />
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Preview canvas */}
      <div
        className="flex-1 overflow-auto sb-preview-canvas"
        onClick={handlePreviewClick}
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      >
        {/* Hover highlight for clickable preview areas + layer hover highlight — hidden during print */}
        <style>{`
          .sb-preview-canvas [data-sb-section] { transition: outline 0.15s ease, box-shadow 0.15s ease; outline: 2px solid transparent; border-radius: 2px; }
          .sb-preview-canvas [data-sb-section]:hover { outline: 2px solid rgba(132,204,22,0.5); box-shadow: 0 0 0 4px rgba(132,204,22,0.08); }
          .sb-preview-canvas [data-sb-section].sb-layer-highlight { outline: 2px solid rgba(132,204,22,0.7); box-shadow: 0 0 0 6px rgba(132,204,22,0.12); }
          @media print { .sb-preview-canvas [data-sb-section] { outline: none !important; box-shadow: none !important; cursor: default !important; } }
          @keyframes sb-glow-pulse { 0% { box-shadow: 0 0 0 0 rgba(132,204,22,0.4); } 50% { box-shadow: 0 0 12px 4px rgba(132,204,22,0.25); } 100% { box-shadow: 0 0 0 0 rgba(132,204,22,0); } }
          .sb-section-glow { animation: sb-glow-pulse 1.5s ease-out; }
        `}</style>
        <div
          className="flex flex-col items-center py-6 px-4"
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
      {/* Mobile tab bar */}
      <div className="lg:hidden shrink-0 flex border-b border-gray-800/60">
        {(["editor", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
              mobileTab === tab
                ? "text-primary-400 border-b-2 border-primary-500 bg-gray-900/50"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab === "editor" ? "Editor" : "Preview"}
          </button>
        ))}
      </div>

      {/* Split screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left editor panel */}
        <div
          className={`${
            mobileTab === "editor" ? "flex" : "hidden"
          } lg:flex w-full lg:w-95 xl:w-105 lg:min-w-90 shrink-0 flex-col border-r border-gray-800/60 bg-gray-950 overflow-hidden`}
        >
          {editorPanel}
        </div>

        {/* Right: preview + layers */}
        <div
          className={`${
            mobileTab === "preview" ? "flex" : "hidden"
          } lg:flex flex-1 overflow-hidden`}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            {previewPanel}
          </div>
          {/* Layers panel — desktop only */}
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
    </div>
  );
}
