// =============================================================================
// DMSuite — Sales Book Step 5: Preview & Export
// Full-screen preview of the blank form with zoom, convert, and export.
// =============================================================================

"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useSalesBookWizard } from "@/stores/sales-book-wizard";
import { useSalesBookEditor, useSalesBookUndo } from "@/stores/sales-book-editor";
import { printHTML } from "@/lib/print";
import {
  SALES_DOCUMENT_TYPES,
  DOCUMENT_TYPE_CONFIGS,
  totalFormCount,
  totalPageCount,
} from "@/lib/sales-book/schema";
import type { SalesDocumentType } from "@/lib/invoice/schema";
import BlankFormRenderer from "@/lib/sales-book/BlankFormRenderer";

// =============================================================================

export default function SBStepPreview() {
  const { prevStep } = useSalesBookWizard();
  const form = useSalesBookEditor((s) => s.form);
  const convertToType = useSalesBookEditor((s) => s.convertToType);
  const { undo, redo, canUndo, canRedo } = useSalesBookUndo();

  const [zoom, setZoom] = useState(60);
  const [showConvert, setShowConvert] = useState(false);
  const convertRef = useRef<HTMLDivElement>(null);

  const config = DOCUMENT_TYPE_CONFIGS[form.documentType as SalesDocumentType];
  const forms = totalFormCount(form.serialConfig);
  const pages = totalPageCount(form.serialConfig, form.printConfig);

  // Pages to show in preview (max 3 for performance)
  const previewPages = Math.min(3, pages);

  const handleConvert = useCallback((type: SalesDocumentType) => {
    convertToType(type);
    setShowConvert(false);
  }, [convertToType]);

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          {/* Back */}
          <button
            onClick={prevStep}
            className="flex items-center gap-1. text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          <div className="w-px h-5 bg-gray-800" />

          {/* Title */}
          <span className="text-sm font-semibold text-gray-200">{config.title}</span>
          <span className="text-[10px] text-gray-600 font-mono">{forms} forms · {pages} pages</span>

          <div className="w-px h-5 bg-gray-800" />

          {/* Undo / Redo */}
          <button onClick={() => undo()} disabled={!canUndo} className="p-1 text-gray-500 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Undo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button onClick={() => redo()} disabled={!canRedo} className="p-1 text-gray-500 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" title="Redo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(20, z - 10))}
              className="p-1 text-gray-500 hover:text-gray-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            <span className="text-xs text-gray-400 w-9 text-center font-mono">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="p-1 text-gray-500 hover:text-gray-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>

          <div className="w-px h-5 bg-gray-800" />

          {/* Convert dropdown */}
          <div className="relative" ref={convertRef}>
            <button
              onClick={() => setShowConvert(!showConvert)}
              className="flex items-center gap-1.5 rounded-md bg-gray-800 border border-gray-700 px-2.5 py-1 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
              </svg>
              Convert To…
            </button>
            {showConvert && (
              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-lg bg-gray-800 border border-gray-700 shadow-xl py-1">
                {SALES_DOCUMENT_TYPES.filter((t) => t !== form.documentType).map((type) => {
                  const tc = DOCUMENT_TYPE_CONFIGS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleConvert(type)}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
                    >
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
            className="flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1 text-xs font-semibold text-gray-950 hover:bg-primary-400 transition-colors"
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

      {/* ── Preview Area ── */}
      <div className="flex-1 overflow-auto bg-gray-950/50" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "20px 20px" }}>
        <div
          className="flex flex-col items-center py-8 px-4"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
        >
          <div id="sb-print-area">
            <BlankFormRenderer
              form={form}
              previewPageCount={previewPages}
            />
          </div>
          {pages > previewPages && (
            <div className="text-xs text-gray-600 mt-4">
              Showing {previewPages} of {pages} pages in preview. All {pages} pages will be printed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
