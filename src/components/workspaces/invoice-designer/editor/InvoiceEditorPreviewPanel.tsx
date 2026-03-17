// =============================================================================
// DMSuite — Invoice Editor: Preview Panel (Center)
// Live artboard with zoom-pan, InvoiceTemplateRenderer.
// =============================================================================

"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { PAGE_DIMENSIONS, DOCUMENT_TYPE_CONFIGS } from "@/lib/invoice/schema";
import InvoiceTemplateRenderer from "@/lib/invoice/templates/InvoiceTemplateRenderer";
import ReceiptBookRenderer from "@/lib/invoice/templates/ReceiptBookRenderer";

// ---------------------------------------------------------------------------

interface InvoiceEditorPreviewPanelProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function InvoiceEditorPreviewPanel({
  zoom,
  onZoomIn,
  onZoomOut,
}: InvoiceEditorPreviewPanelProps) {
  const invoice = useInvoiceEditor((s) => s.invoice);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);

  const computeFitScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const dims = PAGE_DIMENSIONS[invoice.metadata.pageFormat];
    const availableWidth = el.clientWidth - 96;
    if (availableWidth > 0 && dims.w > 0) {
      setAutoScale(Math.min(availableWidth / dims.w, 1));
    }
  }, [invoice.metadata.pageFormat]);

  useEffect(() => {
    computeFitScale();
    const ro = new ResizeObserver(() => computeFitScale());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [computeFitScale]);

  const combinedScale = autoScale * zoom;

  return (
    <div ref={containerRef} className="h-full relative bg-gray-950/80 overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <TransformWrapper
        initialScale={1}
        minScale={0.3}
        maxScale={3}
        centerOnInit
        wheel={{ step: 0.05 }}
        panning={{ velocityDisabled: true }}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass="flex items-start justify-center py-8"
        >
          <div
            style={{
              transform: `scale(${combinedScale})`,
              transformOrigin: "top center",
            }}
          >
            {DOCUMENT_TYPE_CONFIGS[invoice.documentType ?? "invoice"]?.receiptLayout ? (
              <ReceiptBookRenderer
                invoice={invoice}
                id="invoice-preview"
              />
            ) : (
              <InvoiceTemplateRenderer
                invoice={invoice}
                id="invoice-preview"
                showOverflowWarning
              />
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Format label */}
      <div className="absolute bottom-3 left-3 rounded-full bg-gray-900/80 border border-gray-800/50 px-2 py-0.5 text-[10px] text-gray-500 backdrop-blur-sm">
        {invoice.metadata.pageFormat.toUpperCase()}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded-lg bg-gray-900/85 border border-gray-800/50 backdrop-blur-sm px-1 py-0.5">
        <button
          onClick={onZoomOut}
          className="rounded p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors"
          title="Zoom out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <span className="min-w-[38px] text-center text-xs tabular-nums text-gray-400">{Math.round(zoom * 100)}%</span>
        <button
          onClick={onZoomIn}
          className="rounded p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors"
          title="Zoom in"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>
    </div>
  );
}
