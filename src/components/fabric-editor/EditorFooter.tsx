/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Fabric Editor Footer
 *  Bottom bar: zoom percentage, canvas size info
 *  ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { useFabricEditor } from "./FabricEditor";

export function EditorFooter() {
  const { editor, config } = useFabricEditor();

  if (!editor) return null;

  const ws = editor.getWorkspace() as { width?: number; height?: number } | undefined;
  const width = ws?.width ?? config.defaultWidth;
  const height = ws?.height ?? config.defaultHeight;
  const zoom = Math.round((editor.canvas.getZoom?.() ?? 1) * 100);

  return (
    <div className="flex h-8 items-center justify-between border-t border-gray-800 bg-gray-950/80 px-4">
      <span className="text-xs text-gray-500">
        {width} × {height}px
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => editor.zoomOut()}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          −
        </button>
        <span className="w-10 text-center text-xs text-gray-400">{zoom}%</span>
        <button
          onClick={() => editor.zoomIn()}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          +
        </button>
        <button
          onClick={() => editor.autoZoom()}
          className="ml-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          title="Fit to screen"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
