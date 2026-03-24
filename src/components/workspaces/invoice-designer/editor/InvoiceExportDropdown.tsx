// =============================================================================
// DMSuite — Invoice Export Dropdown
// PDF, CSV, Plain Text, JSON, Clipboard, and Print export options.
// =============================================================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Icons ──

function IconDownload({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconFileText({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconTable({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function IconCode({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconClipboard({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  );
}

function IconPrinter({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Export format definitions ──

export type InvoiceExportFormat = "pdf" | "csv" | "txt" | "json" | "clipboard" | "print";

interface ExportOption {
  id: InvoiceExportFormat;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { id: "pdf", label: "Export PDF", description: "High-quality PDF invoice", icon: IconFileText, shortcut: "Ctrl+Shift+P" },
  { id: "csv", label: "Export CSV", description: "Spreadsheet-ready format", icon: IconTable, shortcut: "Ctrl+Shift+E" },
  { id: "txt", label: "Plain Text", description: "Simple text invoice", icon: IconFileText },
  { id: "json", label: "Export JSON", description: "Raw data for import/backup", icon: IconCode },
  { id: "clipboard", label: "Copy to Clipboard", description: "Copy invoice text", icon: IconClipboard, shortcut: "Ctrl+Shift+C" },
  { id: "print", label: "Print", description: "Send to printer", icon: IconPrinter, shortcut: "Ctrl+P" },
];

// =============================================================================

interface InvoiceExportDropdownProps {
  onExport: (format: InvoiceExportFormat) => void;
  isExporting?: boolean;
}

export default function InvoiceExportDropdown({ onExport, isExporting = false }: InvoiceExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [isOpen]);

  const handleExport = useCallback(
    (format: InvoiceExportFormat) => {
      setIsOpen(false);
      onExport(format);
    },
    [onExport]
  );

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-3 py-1.5 text-xs font-medium text-gray-950 transition-all hover:bg-primary-400 disabled:opacity-50"
      >
        {isExporting ? (
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <IconDownload className="w-3.5 h-3.5" />
        )}
        Export
        <IconChevronDown className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 z-40 w-64 rounded-xl border border-gray-700/60 bg-gray-900/95 shadow-2xl backdrop-blur-md overflow-hidden"
          >
            <div className="py-1">
              {EXPORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleExport(option.id)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors text-gray-400 hover:bg-gray-800/60 hover:text-white"
                >
                  <option.icon className="shrink-0 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{option.label}</div>
                    <div className="text-xs text-gray-600">{option.description}</div>
                  </div>
                  {option.shortcut && (
                    <kbd className="text-xs text-gray-600 bg-gray-800/40 border border-gray-700/50 rounded px-1.5 py-0.5 shrink-0">
                      {option.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
