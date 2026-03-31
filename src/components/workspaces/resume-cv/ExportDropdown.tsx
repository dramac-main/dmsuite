// =============================================================================
// DMSuite — Resume Export Dropdown
// Download as PDF, DOCX, TXT, JSON, copy to clipboard, or print.
// =============================================================================

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { SIcon } from "@/components/workspaces/shared/WorkspaceUIKit";

const EXPORT_OPTIONS = [
  { key: "pdf", label: "Download PDF", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { key: "docx", label: "Download DOCX", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { key: "txt", label: "Download TXT", icon: "M4 6h16M4 12h16m-7 6h7" },
  { key: "json", label: "Download JSON", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  { key: "clipboard", label: "Copy to Clipboard", icon: "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" },
  { key: "print", label: "Print", icon: "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" },
];

interface ExportDropdownProps {
  onExport: (format: string) => void;
}

export default function ExportDropdown({ onExport }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleExport = useCallback(
    (key: string) => {
      setOpen(false);
      onExport(key);
    },
    [onExport]
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-300 hover:text-gray-100 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 rounded-md transition-colors"
      >
        <SIcon
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
        Export
        <SIcon
          d={open ? "M19 9l-7 7-7-7" : "M19 15l-7-7-7 7"}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-gray-700/40 rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
          {EXPORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleExport(opt.key)}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors"
            >
              <SIcon d={opt.icon} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
