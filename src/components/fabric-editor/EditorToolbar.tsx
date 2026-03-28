/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Fabric Editor Toolbar
 *  Context-sensitive toolbar: shows relevant controls based on selection.
 *  ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { useFabricEditor } from "./FabricEditor";
import { isTextType } from "@/lib/fabric-editor";

export function EditorToolbar() {
  const { editor, setActiveTool } = useFabricEditor();

  if (!editor) return null;

  const hasSelection = editor.selectedObjects.length > 0;
  const firstSel = editor.selectedObjects[0];
  const isText = firstSel && isTextType(firstSel.type);

  return (
    <div className="flex h-10 items-center gap-1 border-b border-gray-800 bg-gray-950/80 px-3 overflow-x-auto">
      {!hasSelection && (
        <span className="text-xs text-gray-500">Select an object to edit its properties</span>
      )}

      {hasSelection && (
        <>
          {/* Fill color */}
          <button
            onClick={() => setActiveTool("fill")}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-gray-300 transition-colors hover:bg-gray-800"
            title="Fill color"
          >
            <div
              className="h-4 w-4 rounded border border-gray-600"
              style={{ backgroundColor: editor.getActiveFillColor() }}
            />
            Fill
          </button>

          {/* Stroke color */}
          <button
            onClick={() => setActiveTool("stroke-color")}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-gray-300 transition-colors hover:bg-gray-800"
            title="Stroke color"
          >
            <div
              className="h-4 w-4 rounded border-2 border-gray-600"
              style={{ borderColor: editor.getActiveStrokeColor() }}
            />
            Stroke
          </button>

          {/* Stroke width */}
          <button
            onClick={() => setActiveTool("stroke-width")}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-gray-300 transition-colors hover:bg-gray-800"
            title="Stroke width"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 12h18" />
            </svg>
            {editor.getActiveStrokeWidth()}px
          </button>

          {/* Opacity */}
          <button
            onClick={() => setActiveTool("opacity")}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-gray-300 transition-colors hover:bg-gray-800"
            title="Opacity"
          >
            {Math.round(editor.getActiveOpacity() * 100)}%
          </button>

          <div className="mx-1 h-5 w-px bg-gray-800" />

          {/* Text-specific controls */}
          {isText && (
            <>
              <button
                onClick={() => setActiveTool("font")}
                className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-gray-300 transition-colors hover:bg-gray-800"
                title="Font"
              >
                <span className="max-w-20 truncate">{editor.getActiveFontFamily()}</span>
              </button>

              {/* Font size */}
              <div className="flex items-center rounded-md border border-gray-700 bg-gray-800/50">
                <button
                  onClick={() => editor.changeFontSize(Math.max(8, editor.getActiveFontSize() - 1))}
                  className="flex h-6 w-6 items-center justify-center text-gray-400 hover:text-gray-200"
                >
                  −
                </button>
                <span className="w-8 text-center text-xs text-gray-300">
                  {editor.getActiveFontSize()}
                </span>
                <button
                  onClick={() => editor.changeFontSize(Math.min(200, editor.getActiveFontSize() + 1))}
                  className="flex h-6 w-6 items-center justify-center text-gray-400 hover:text-gray-200"
                >
                  +
                </button>
              </div>

              {/* Bold */}
              <button
                onClick={() =>
                  editor.changeFontWeight(editor.getActiveFontWeight() >= 700 ? 400 : 700)
                }
                className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                  editor.getActiveFontWeight() >= 700
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
                title="Bold"
              >
                <strong>B</strong>
              </button>

              {/* Italic */}
              <button
                onClick={() =>
                  editor.changeFontStyle(editor.getActiveFontStyle() === "italic" ? "normal" : "italic")
                }
                className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                  editor.getActiveFontStyle() === "italic"
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
                title="Italic"
              >
                <em>I</em>
              </button>

              {/* Underline */}
              <button
                onClick={() => editor.changeFontUnderline(!editor.getActiveFontUnderline())}
                className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                  editor.getActiveFontUnderline()
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
                title="Underline"
              >
                <span className="underline">U</span>
              </button>

              {/* Strikethrough */}
              <button
                onClick={() => editor.changeFontLinethrough(!editor.getActiveFontLinethrough())}
                className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                  editor.getActiveFontLinethrough()
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
                title="Strikethrough"
              >
                <span className="line-through">S</span>
              </button>

              <div className="mx-1 h-5 w-px bg-gray-800" />

              {/* Text alignment */}
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => editor.changeTextAlign(align)}
                  className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                    editor.getActiveTextAlign() === align
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                  title={`Align ${align}`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    {align === "left" && <><path d="M17 10H3" /><path d="M21 6H3" /><path d="M21 14H3" /><path d="M17 18H3" /></>}
                    {align === "center" && <><path d="M17 10H7" /><path d="M21 6H3" /><path d="M21 14H3" /><path d="M17 18H7" /></>}
                    {align === "right" && <><path d="M21 10H7" /><path d="M21 6H3" /><path d="M21 14H3" /><path d="M21 18H7" /></>}
                  </svg>
                </button>
              ))}

              {/* Filter */}
              <button
                onClick={() => setActiveTool("filter")}
                className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
                title="Filters"
              >
                Filter
              </button>
            </>
          )}

          <div className="mx-1 h-5 w-px bg-gray-800" />

          {/* Layer order */}
          <button
            onClick={() => editor.bringForward()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
            title="Bring forward"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
          <button
            onClick={() => editor.sendBackwards()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
            title="Send backward"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={() => editor.delete()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-900/30 hover:text-red-400"
            title="Delete (Del)"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
