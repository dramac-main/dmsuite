// =============================================================================
// DMSuite — Invoice Editor Right Panel: Design Controls
// Template selection, accent color, font pairing, page format.
// Only one accordion section open at a time for clean compact UX.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import {
  ACCENT_COLORS,
  FONT_PAIRINGS,
  PAGE_FORMATS,
  PAGE_DIMENSIONS,
  type FontPairingId,
  type PageFormat,
  type InvoiceTemplateId,
} from "@/lib/invoice/schema";
import { INVOICE_TEMPLATES } from "@/lib/invoice/templates/template-defs";

// ── Icons ──

function IconPalette({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6.5" cy="13.5" r="2.5" /><circle cx="17.5" cy="13.5" r="2.5" /><circle cx="13.5" cy="20.5" r="2.5" />
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
    </svg>
  );
}

function IconPanelRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
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

// ── Accordion ──

type DesignSectionId = "template" | "accent" | "fonts" | "format";

function DesignAccordion({
  id,
  title,
  isOpen,
  onToggle,
  children,
}: {
  id: DesignSectionId;
  title: string;
  isOpen: boolean;
  onToggle: (id: DesignSectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-800/50">
      <button
        onClick={() => onToggle(id)}
        className="flex items-center justify-between w-full py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
      >
        <span>{title}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <IconChevronDown className="text-gray-600" />
        </motion.div>
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
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Template mini-structure sketch ──

function TemplateThumbnail({ headerStyle, accentColor }: { headerStyle: string; accentColor: string }) {
  // Shows a tiny structural wireframe representing the template layout
  const accent = accentColor;
  const accentFade = `${accentColor}33`;
  const line = "bg-gray-600/30";
  const lineShort = "bg-gray-600/20";

  return (
    <div className="w-full h-14 rounded-md bg-white/5 overflow-hidden flex flex-col mb-1.5">
      {/* Header zone */}
      {headerStyle === "banner" ? (
        <div className="h-4 flex items-center px-1.5 gap-1" style={{ background: accent }}>
          <div className="w-5 h-1 rounded-full bg-white/70" />
          <div className="ml-auto w-4 h-1.5 rounded-sm bg-white/40" />
        </div>
      ) : headerStyle === "split" ? (
        <div className="h-4 flex items-center justify-between px-1.5 border-b" style={{ borderColor: accentFade }}>
          <div className="w-5 h-1 rounded-full" style={{ background: accent }} />
          <div className="w-4 h-1 rounded-full" style={{ background: accentFade }} />
        </div>
      ) : headerStyle === "minimal" ? (
        <div className="h-3 flex items-center justify-between px-1.5">
          <div className="w-5 h-0.5 rounded-full bg-gray-500/40" />
          <div className="w-3 h-0.5 rounded-full bg-gray-500/30" />
        </div>
      ) : headerStyle === "centered" ? (
        <div className="h-4 flex flex-col items-center justify-center gap-0.5 border-b" style={{ borderColor: accentFade }}>
          <div className="w-6 h-1 rounded-full" style={{ background: accent }} />
          <div className="w-3 h-0.5 rounded-full bg-gray-500/30" />
        </div>
      ) : headerStyle === "sidebar" ? (
        <div className="h-4 flex items-center gap-1 px-1">
          <div className="w-0.5 h-3 rounded-full" style={{ background: accent }} />
          <div className="flex-1 flex items-center justify-between">
            <div className="w-5 h-1 rounded-full bg-gray-500/40" />
            <div className="w-3 h-1 rounded-full" style={{ background: accentFade }} />
          </div>
        </div>
      ) : (
        <div className="h-4 flex items-center px-1.5 gap-1" style={{ background: accent }}>
          <div className="w-5 h-1 rounded-full bg-white/70" />
        </div>
      )}
      {/* Body wireframe */}
      <div className="flex-1 px-1.5 py-1 flex flex-col gap-0.5">
        <div className="flex gap-2">
          <div className={`w-4 h-0.5 rounded-full ${lineShort}`} />
          <div className={`w-3 h-0.5 rounded-full ${lineShort}`} />
        </div>
        <div className="flex gap-0.5">
          <div className="flex-1 h-[3px] rounded-sm" style={{ background: accentFade }} />
        </div>
        <div className={`w-full h-0.5 rounded-full ${line}`} />
        <div className={`w-5/6 h-0.5 rounded-full ${line}`} />
        <div className={`w-4/6 h-0.5 rounded-full ${line}`} />
      </div>
    </div>
  );
}

// ── Template Grid ──

function TemplateGrid() {
  const invoice = useInvoiceEditor((s) => s.invoice);
  const setTemplate = useInvoiceEditor((s) => s.setTemplate);
  const activeId = invoice.metadata.template;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {INVOICE_TEMPLATES.map((tmpl) => {
          const isActive = tmpl.id === activeId;
          return (
            <button
              key={tmpl.id}
              onClick={() => setTemplate(tmpl.id as InvoiceTemplateId)}
              className={`relative rounded-lg border p-2 text-left transition-all ${
                isActive
                  ? "border-primary-500/60 bg-primary-500/10 ring-1 ring-primary-500/20"
                  : "border-gray-700/50 bg-gray-800/30 hover:border-gray-600"
              }`}
            >
              <TemplateThumbnail
                headerStyle={tmpl.headerStyle}
                accentColor={invoice.metadata.accentColor}
              />
              <span className="text-[10px] font-semibold text-gray-200 leading-tight block truncate">
                {tmpl.name}
              </span>
              <span className="text-[9px] text-gray-500 leading-tight block truncate">
                {tmpl.headerStyle} · {tmpl.tableStyle}
              </span>
              {isActive && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                  <IconCheck className="text-gray-950" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
        <span className="text-[10px] font-medium text-gray-400">
          {INVOICE_TEMPLATES.find((t) => t.id === activeId)?.name ?? "Modern Clean"}
        </span>
      </div>
    </div>
  );
}

// ── Font Pairing List ──

function FontPairingList() {
  const invoice = useInvoiceEditor((s) => s.invoice);
  const setFontPairing = useInvoiceEditor((s) => s.setFontPairing);
  const activePairing = invoice.metadata.fontPairing;

  return (
    <div className="space-y-1.5">
      {FONT_PAIRINGS.map((fp) => {
        const isActive = activePairing === fp.id;
        return (
          <button
            key={fp.id}
            onClick={() => setFontPairing(fp.id as FontPairingId)}
            className={`flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-left transition-all ${
              isActive
                ? "border-primary-500/60 bg-primary-500/10 ring-1 ring-primary-500/20"
                : "border-gray-700/50 bg-gray-800/30 hover:border-gray-600"
            }`}
          >
            <div className="flex-1 min-w-0">
              <span
                className="block text-xs font-semibold text-gray-200 leading-tight truncate"
                style={{ fontFamily: fp.heading }}
              >
                {fp.label}
              </span>
              <span
                className="block text-[10px] text-gray-500 mt-0.5 leading-tight truncate"
                style={{ fontFamily: fp.body }}
              >
                Heading &amp; Body preview
              </span>
            </div>
            {isActive && <IconCheck className="shrink-0 text-primary-400" />}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================

interface Props {
  onCollapse: () => void;
}

export default function InvoiceEditorDesignPanel({ onCollapse }: Props) {
  const invoice = useInvoiceEditor((s) => s.invoice);
  const setAccentColor = useInvoiceEditor((s) => s.setAccentColor);
  const setPageFormat = useInvoiceEditor((s) => s.setPageFormat);

  const [openSection, setOpenSection] = useState<DesignSectionId | null>("template");

  const handleToggle = useCallback(
    (id: DesignSectionId) => setOpenSection((prev) => (prev === id ? null : id)),
    []
  );

  return (
    <div className="h-full flex flex-col bg-gray-900/60 border-l border-gray-800/40">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/40">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
          <IconPalette className="text-gray-500" />
          Design
        </span>
        <button
          onClick={onCollapse}
          className="rounded p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 transition-colors"
          title="Collapse panel"
        >
          <IconPanelRight />
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {/* Template */}
        <DesignAccordion id="template" title="Template" isOpen={openSection === "template"} onToggle={handleToggle}>
          <TemplateGrid />
        </DesignAccordion>

        {/* Accent Color */}
        <DesignAccordion id="accent" title="Accent Color" isOpen={openSection === "accent"} onToggle={handleToggle}>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((ac) => (
              <button
                key={ac.id}
                onClick={() => setAccentColor(ac.hex)}
                title={ac.label}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  invoice.metadata.accentColor === ac.hex
                    ? "border-white scale-110"
                    : "border-transparent hover:border-gray-500"
                }`}
                style={{ backgroundColor: ac.hex }}
              />
            ))}
          </div>
        </DesignAccordion>

        {/* Font Pairing */}
        <DesignAccordion id="fonts" title="Font Pairing" isOpen={openSection === "fonts"} onToggle={handleToggle}>
          <FontPairingList />
        </DesignAccordion>

        {/* Page Format */}
        <DesignAccordion id="format" title="Page Format" isOpen={openSection === "format"} onToggle={handleToggle}>
          <div className="grid grid-cols-2 gap-1.5">
            {PAGE_FORMATS.map((fmt) => {
              const dim = PAGE_DIMENSIONS[fmt];
              return (
                <button
                  key={fmt}
                  onClick={() => setPageFormat(fmt)}
                  className={`rounded-md border py-2 text-center transition-all ${
                    invoice.metadata.pageFormat === fmt
                      ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                      : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <span className="text-xs font-medium block">{dim.label.split(" (")[0]}</span>
                  <span className="text-[9px] text-gray-500">{dim.w} × {dim.h}</span>
                </button>
              );
            })}
          </div>
        </DesignAccordion>
      </div>
    </div>
  );
}
