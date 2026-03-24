// =============================================================================
// DMSuite — Sales Document Step 6: Full-Screen Editor
// Three-panel layout: Left (data) | Center (live preview) | Right (design)
// Uses react-resizable-panels for flexible layout. Integrates export + conversion.
// =============================================================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Panel, Group, Separator, usePanelRef } from "react-resizable-panels";
import { useInvoiceEditor, useInvoiceUndo } from "@/stores/invoice-editor";
import { useInvoiceWizard } from "@/stores/invoice-wizard";
import {
  SALES_DOCUMENT_TYPES,
  DOCUMENT_TYPE_CONFIGS,
  type SalesDocumentType,
} from "@/lib/invoice/schema";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createInvoiceManifest } from "@/lib/chiko/manifests";
import InvoiceEditorSectionsPanel from "./editor/InvoiceEditorSectionsPanel";
import InvoiceEditorPreviewPanel from "./editor/InvoiceEditorPreviewPanel";
import InvoiceEditorDesignPanel from "./editor/InvoiceEditorDesignPanel";
import InvoiceExportDropdown, { type InvoiceExportFormat } from "./editor/InvoiceExportDropdown";

// ── Icons ──

function IconUndo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function IconRedo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconArrowLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconConvert({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Convert To Dropdown
// ---------------------------------------------------------------------------

function ConvertToDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const documentType = useInvoiceEditor((s) => s.invoice.documentType);
  const convertToType = useInvoiceEditor((s) => s.convertToType);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const otherTypes = SALES_DOCUMENT_TYPES.filter((t) => t !== (documentType ?? "invoice"));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:text-gray-200 hover:bg-gray-800/60"
        title="Convert to another document type"
      >
        <IconConvert />
        <span className="hidden sm:inline">Convert</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 rounded-xl bg-gray-900 border border-gray-700/60 shadow-xl z-50 py-1">
          <div className="px-3 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            Convert to…
          </div>
          {otherTypes.map((type) => {
            const config = DOCUMENT_TYPE_CONFIGS[type];
            return (
              <button
                key={type}
                onClick={() => {
                  convertToType(type);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800/60 hover:text-gray-100 transition-colors text-left"
              >
                <span className="font-mono text-[9px] text-gray-500 w-8">{config.numberPrefix.replace("-", "")}</span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor Toolbar
// ---------------------------------------------------------------------------

function EditorToolbar({
  onExport,
  isExporting,
}: {
  onExport: (format: InvoiceExportFormat) => void;
  isExporting: boolean;
}) {
  const { undo, redo, canUndo, canRedo } = useInvoiceUndo();
  const goToStep = useInvoiceWizard((s) => s.goToStep);
  const documentType = useInvoiceEditor((s) => s.invoice.documentType);
  const dtConfig = DOCUMENT_TYPE_CONFIGS[documentType ?? "invoice"];

  const handleBack = useCallback(() => {
    goToStep(5);
  }, [goToStep]);

  return (
    <div className="relative z-50 flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800/60 backdrop-blur-sm">
      {/* Left: Back + Undo/Redo + Convert */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:text-gray-200 hover:bg-gray-800/60"
          title="Back to wizard"
        >
          <IconArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="w-px h-5 bg-gray-800" />
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:text-gray-200 hover:bg-gray-800/60 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo"
        >
          <IconUndo />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:text-gray-200 hover:bg-gray-800/60 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo"
        >
          <IconRedo />
        </button>
        <div className="w-px h-5 bg-gray-800" />
        <ConvertToDropdown />
      </div>

      {/* Center: Dynamic Title */}
      <h1 className="text-sm font-medium text-gray-300 hidden md:block">
        {dtConfig.label} Editor
      </h1>

      {/* Right: Export */}
      <div className="flex items-center gap-3">
        <InvoiceExportDropdown onExport={onExport} isExporting={isExporting} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Editor Component
// ---------------------------------------------------------------------------

export default function StepEditor() {
  const leftPanelRef = usePanelRef();
  const rightPanelRef = usePanelRef();

  const toggleLeftPanel = useCallback(() => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  }, [leftPanelRef]);

  const toggleRightPanel = useCallback(() => {
    const panel = rightPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  }, [rightPanelRef]);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const invoice = useInvoiceEditor((s) => s.invoice);

  // Zoom state for preview panel
  const [zoom, setZoom] = useState(1);
  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.1, 3)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.1, 0.3)), []);

  // Export handler (lazily imports export module)
  const handleExport = useCallback(
    async (format: InvoiceExportFormat) => {
      setIsExporting(true);
      try {
        const { exportInvoice } = await import("@/lib/invoice/export");
        const result = await exportInvoice(format, {
          invoice,
          fileName: `invoice-${invoice.invoiceNumber || "draft"}`,
        });
        if (!result.success) {
          console.error(`Invoice export failed: ${result.error}`);
        }
      } catch (err) {
        console.error("Invoice export error:", err);
      } finally {
        setIsExporting(false);
      }
    },
    [invoice]
  );

  // Register Chiko invoice manifest with export ref
  const exportRef = useRef<((format: string) => Promise<void>) | null>(null);
  exportRef.current = handleExport as (format: string) => Promise<void>;
  useChikoActions(() => createInvoiceManifest({ onExportRef: exportRef }));

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <EditorToolbar onExport={handleExport} isExporting={isExporting} />

      <div className="flex-1 min-h-0 relative">
        <Group
          orientation="horizontal"
          id="invoice-editor"
          defaultLayout={{ sections: 20, preview: 60, design: 20 }}
          className="h-full"
        >
          {/* Left Panel — Invoice Data */}
          <Panel
            id="sections"
            collapsible
            collapsedSize="0"
            minSize="15"
            maxSize="40"
            panelRef={leftPanelRef}
          >
            <InvoiceEditorSectionsPanel onCollapse={toggleLeftPanel} />
          </Panel>

          <Separator className="group relative flex w-1.5 items-center justify-center transition-colors hover:bg-primary-500/10 active:bg-primary-500/20 data-[separator=hover]:bg-primary-500/10 data-[separator=active]:bg-primary-500/20">
            <div className="h-8 w-0.5 rounded-full bg-gray-700 transition-colors group-hover:bg-primary-500/60 group-active:bg-primary-500" />
          </Separator>

          {/* Center Panel — Live Preview */}
          <Panel id="preview" minSize="25">
            <InvoiceEditorPreviewPanel
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
            />
          </Panel>

          <Separator className="group relative flex w-1.5 items-center justify-center transition-colors hover:bg-primary-500/10 active:bg-primary-500/20 data-[separator=hover]:bg-primary-500/10 data-[separator=active]:bg-primary-500/20">
            <div className="h-8 w-0.5 rounded-full bg-gray-700 transition-colors group-hover:bg-primary-500/60 group-active:bg-primary-500" />
          </Separator>

          {/* Right Panel — Design */}
          <Panel
            id="design"
            collapsible
            collapsedSize="0"
            minSize="15"
            maxSize="40"
            panelRef={rightPanelRef}
          >
            <InvoiceEditorDesignPanel onCollapse={toggleRightPanel} />
          </Panel>
        </Group>
      </div>
    </div>
  );
}
