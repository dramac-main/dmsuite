/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Fabric Editor Navbar
 *  Top bar: undo/redo, zoom, export menu
 *  ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { useState, type ReactNode } from "react";
import { useFabricEditor } from "./FabricEditor";

export function EditorNavbar({ extra }: { extra?: ReactNode }) {
  const { editor } = useFabricEditor();
  const [showExport, setShowExport] = useState(false);

  if (!editor) return null;

  return (
    <div className="flex h-12 items-center justify-between border-b border-gray-800 bg-gray-950 px-4">
      {/* Left — undo / redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.onUndo()}
          disabled={!editor.canUndo()}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
        <button
          onClick={() => editor.onRedo()}
          disabled={!editor.canRedo()}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
          </svg>
        </button>

        <div className="mx-2 h-6 w-px bg-gray-800" />

        {/* Zoom controls */}
        <button
          onClick={() => editor.zoomOut()}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          title="Zoom Out"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3M8 11h6" />
          </svg>
        </button>
        <button
          onClick={() => editor.autoZoom()}
          className="flex h-8 items-center justify-center rounded-md px-2 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          title="Fit to Screen"
        >
          Fit
        </button>
        <button
          onClick={() => editor.zoomIn()}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          title="Zoom In"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
          </svg>
        </button>
      </div>

      {/* Center — extra navbar content (tool-specific) */}
      <div className="flex items-center gap-2">{extra}</div>

      {/* Right — export */}
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setShowExport(!showExport)}
          className="flex h-8 items-center gap-1.5 rounded-md bg-primary-600 px-3 text-xs font-medium text-white transition-colors hover:bg-primary-500"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" />
          </svg>
          Export
        </button>

        {showExport && (
          <div className="absolute right-0 top-10 z-50 min-w-36 rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl">
            {[
              { label: "PNG", fn: () => editor.savePng() },
              { label: "JPG", fn: () => editor.saveJpg() },
              { label: "SVG", fn: () => editor.saveSvg() },
              { label: "PDF", fn: () => import("@/lib/fabric-editor/export").then((m) => m.exportPdf(editor.canvas)) },
              { label: "JSON", fn: () => editor.saveJson() },
            ].map(({ label, fn }) => (
              <button
                key={label}
                onClick={() => {
                  fn();
                  setShowExport(false);
                }}
                className="flex w-full items-center px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
