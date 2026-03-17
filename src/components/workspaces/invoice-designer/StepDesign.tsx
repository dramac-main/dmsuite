// =============================================================================
// DMSuite — Invoice Step 4: Design
// Template selection, accent color, font pairing, page format.
// Includes live mini-preview of the selected template.
// =============================================================================

"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvoiceWizard } from "@/stores/invoice-wizard";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import {
  ACCENT_COLORS,
  FONT_PAIRINGS,
  PAGE_FORMATS,
  PAGE_DIMENSIONS,
  createSampleInvoiceData,
  type FontPairingId,
  type PageFormat,
  type InvoiceData,
  DOCUMENT_TYPE_CONFIGS,
} from "@/lib/invoice/schema";
import { INVOICE_TEMPLATES } from "@/lib/invoice/templates/template-defs";
import InvoiceTemplateRenderer from "@/lib/invoice/templates/InvoiceTemplateRenderer";
import ReceiptBookRenderer from "@/lib/invoice/templates/ReceiptBookRenderer";

// ── Icons ──

function IconPaintbrush({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
      <path d="M14.5 17.5 4.5 15" />
    </svg>
  );
}

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconArrowLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ── Live Preview Panel ──

function LivePreview({ invoice }: { invoice: InvoiceData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);

  const dims = PAGE_DIMENSIONS[invoice.metadata.pageFormat];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const computeScale = () => {
      const available = el.clientWidth - 32;
      if (available > 0 && dims.w > 0) {
        setScale(Math.min(available / dims.w, 0.5));
      }
    };
    computeScale();
    const ro = new ResizeObserver(() => computeScale());
    ro.observe(el);
    return () => ro.disconnect();
  }, [dims.w]);

  return (
    <div ref={containerRef} className="relative rounded-xl border border-gray-700/40 bg-gray-950/60 overflow-hidden">
      <div className="absolute top-2 left-3 z-10 text-[9px] font-medium text-gray-500 uppercase tracking-wider">
        Live Preview
      </div>
      <div className="pt-7 pb-4 px-4 flex justify-center overflow-hidden">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: `${dims.w}px`,
            height: `${Math.round(dims.h * scale + 16)}px`,
            maxHeight: `${Math.round(dims.h * scale + 16)}px`,
            overflow: "hidden",
          }}
        >
          <InvoiceTemplateRenderer
            invoice={invoice}
            showOverflowWarning={false}
          />
          {DOCUMENT_TYPE_CONFIGS[invoice.documentType ?? "invoice"]?.receiptLayout && (
            <div className="mt-4">
              <ReceiptBookRenderer
                invoice={invoice}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================

export default function StepDesign() {
  const { nextStep, prevStep } = useInvoiceWizard();
  const invoice = useInvoiceEditor((s) => s.invoice);
  const setTemplate = useInvoiceEditor((s) => s.setTemplate);
  const setAccentColor = useInvoiceEditor((s) => s.setAccentColor);
  const setFontPairing = useInvoiceEditor((s) => s.setFontPairing);
  const setPageFormat = useInvoiceEditor((s) => s.setPageFormat);

  const meta = invoice.metadata;
  const [openSection, setOpenSection] = useState<"template" | "accent" | "fonts" | "format">(
    "template"
  );

  const toggleSection = useCallback(
    (id: "template" | "accent" | "fonts" | "format") =>
      setOpenSection((prev) => (prev === id ? prev : id)),
    []
  );

  // Use user's data if they've entered it, else fall back to sample data for preview
  const hasUserData = invoice.businessInfo.name.trim() !== "" || invoice.lineItems.some((li) => li.description.trim() !== "");
  const previewInvoice = useMemo(() => {
    if (hasUserData) return invoice;
    return createSampleInvoiceData({
      template: meta.template,
      accentColor: meta.accentColor,
      fontPairing: meta.fontPairing,
      pageFormat: meta.pageFormat,
    }, invoice.documentType ?? "invoice");
  }, [hasUserData, invoice, meta.template, meta.accentColor, meta.fontPairing, meta.pageFormat]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center text-center mb-8"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 mb-4">
          <IconPaintbrush className="text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-100">Design & Style</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose a template and customize the look of your invoice.
        </p>
      </motion.div>

      {/* Two-column layout: controls + live preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Design controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1 rounded-xl border border-gray-700/40 bg-gray-800/20 overflow-hidden"
        >
          {/* ── Template ── */}
          <DesignSection
            title="Template"
            isOpen={openSection === "template"}
            onToggle={() => toggleSection("template")}
          >
            <div className="grid grid-cols-2 gap-3">
              {INVOICE_TEMPLATES.map((t) => {
                const isActive = meta.template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`relative rounded-xl p-3 text-left transition-all border ${
                      isActive
                        ? "border-primary-500/60 bg-primary-500/10 ring-1 ring-primary-500/30"
                        : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-primary-500">
                        <IconCheck className="text-gray-950" />
                      </div>
                    )}
                    <div className="text-sm font-medium text-gray-200">{t.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                      {t.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </DesignSection>

          {/* ── Accent Color ── */}
          <DesignSection
            title="Accent Color"
            isOpen={openSection === "accent"}
            onToggle={() => toggleSection("accent")}
          >
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((c) => {
                const isActive = meta.accentColor === c.hex;
                return (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c.hex)}
                    title={c.label}
                    className={`relative w-8 h-8 rounded-full transition-all ${
                      isActive ? "ring-2 ring-primary-400 ring-offset-2 ring-offset-gray-900 scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isActive && (
                      <IconCheck className="absolute inset-0 m-auto text-white drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </DesignSection>

          {/* ── Fonts ── */}
          <DesignSection
            title="Font Pairing"
            isOpen={openSection === "fonts"}
            onToggle={() => toggleSection("fonts")}
          >
            <div className="grid grid-cols-2 gap-2">
              {FONT_PAIRINGS.map((f) => {
                const isActive = meta.fontPairing === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFontPairing(f.id as FontPairingId)}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition-all border ${
                      isActive
                        ? "border-primary-500/60 bg-primary-500/10 text-gray-200"
                        : "border-gray-700/40 bg-gray-800/30 text-gray-400 hover:text-gray-200 hover:border-gray-600/60"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </DesignSection>

          {/* ── Format ── */}
          <DesignSection
            title="Page Format"
            isOpen={openSection === "format"}
            onToggle={() => toggleSection("format")}
          >
            <div className="flex gap-2">
              {PAGE_FORMATS.map((f) => {
                const isActive = meta.pageFormat === f;
                const dims = PAGE_DIMENSIONS[f];
                return (
                  <button
                    key={f}
                    onClick={() => setPageFormat(f as PageFormat)}
                    className={`flex-1 rounded-lg p-3 text-center transition-all border ${
                      isActive
                        ? "border-primary-500/60 bg-primary-500/10"
                        : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-200">{f.toUpperCase()}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{dims.label}</div>
                  </button>
                );
              })}
            </div>
          </DesignSection>
        </motion.div>

        {/* Right: Live Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden lg:block"
        >
          <LivePreview invoice={previewInvoice} />
          {!hasUserData && (
            <p className="text-[10px] text-gray-600 text-center mt-2">
              Showing sample data — your info will appear once entered
            </p>
          )}
        </motion.div>
      </div>

      {/* Nav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-between mt-8"
      >
        <button
          onClick={prevStep}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={nextStep}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-gray-950 transition-all hover:bg-primary-400 active:scale-[0.98]"
        >
          Open Editor
          <IconArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accordion section helper
// ---------------------------------------------------------------------------

function DesignSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-700/30 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
      >
        <span>{title}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-600"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
