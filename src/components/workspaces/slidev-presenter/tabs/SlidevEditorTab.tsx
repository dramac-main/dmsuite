"use client";

// =============================================================================
// DMSuite — Slidev Editor Tab: Full-document & per-slide markdown editing
// =============================================================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { SlidevSlide } from "@/lib/slidev/parser";
import { SectionLabel } from "@/components/workspaces/shared/WorkspaceUIKit";

interface SlidevEditorTabProps {
  markdown: string;
  slides: SlidevSlide[];
  activeSlideIndex: number;
  onMarkdownChange: (md: string) => void;
  onSlideContentChange: (index: number, content: string) => void;
  onSlideNotesChange: (index: number, notes: string) => void;
}

type EditorMode = "document" | "slide";

export default function SlidevEditorTab({
  markdown,
  slides,
  activeSlideIndex,
  onMarkdownChange,
  onSlideContentChange,
  onSlideNotesChange,
}: SlidevEditorTabProps) {
  const [mode, setMode] = useState<EditorMode>("document");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSlide = slides[activeSlideIndex];

  // Auto-scroll textarea to keep cursor visible
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [mode]);

  // Handle tab key for indentation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const value = ta.value;
        const newValue = value.substring(0, start) + "  " + value.substring(end);
        if (mode === "document") {
          onMarkdownChange(newValue);
        }
        // Restore cursor
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    },
    [mode, onMarkdownChange],
  );

  // Line count for document mode
  const lineCount = markdown.split("\n").length;

  return (
    <div className="flex flex-col h-full gap-2 overflow-hidden">
      {/* ── Mode toggle ────────────────────── */}
      <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-0.5">
        <button
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === "document"
              ? "bg-primary-500/20 text-primary-400 shadow-sm"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setMode("document")}
        >
          Full Document
        </button>
        <button
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === "slide"
              ? "bg-primary-500/20 text-primary-400 shadow-sm"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setMode("slide")}
        >
          Slide {activeSlideIndex + 1}
        </button>
      </div>

      {mode === "document" ? (
        /* ── Full document editor ─────────── */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <SectionLabel>
              Markdown ({lineCount} lines · {slides.length} slides)
            </SectionLabel>
          </div>
          <div className="flex-1 relative overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => onMarkdownChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-full p-3 bg-transparent text-gray-200 text-sm resize-none outline-none placeholder-gray-600"
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 1.6,
                tabSize: 2,
              }}
              placeholder="Write your presentation in Markdown..."
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
          {/* Syntax hint */}
          <div className="mt-1 text-[10px] text-gray-500 flex gap-3 flex-wrap">
            <span>
              <code className="text-gray-400">---</code> = new slide
            </span>
            <span>
              <code className="text-gray-400"># Heading</code>
            </span>
            <span>
              <code className="text-gray-400">```lang</code> = code
            </span>
            <span>
              <code className="text-gray-400">$math$</code> = KaTeX
            </span>
            <span>
              <code className="text-gray-400">::right::</code> = column split
            </span>
          </div>
        </div>
      ) : (
        /* ── Per-slide editor ────────────── */
        <div className="flex-1 flex flex-col overflow-hidden gap-2">
          {activeSlide ? (
            <>
              {/* Slide info header */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  Slide {activeSlideIndex + 1} of {slides.length}
                </span>
                <span className="px-2 py-0.5 bg-gray-800 rounded text-[10px] uppercase tracking-wide">
                  {activeSlide.layout}
                </span>
              </div>

              {/* Content editor */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <SectionLabel>Content</SectionLabel>
                <div className="flex-1 rounded-lg border border-gray-700 bg-gray-900 mt-1 overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    value={activeSlide.content}
                    onChange={(e) =>
                      onSlideContentChange(activeSlideIndex, e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    className="w-full h-full p-3 bg-transparent text-gray-200 text-sm resize-none outline-none placeholder-gray-600"
                    style={{
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      lineHeight: 1.6,
                      tabSize: 2,
                    }}
                    placeholder="Slide content (Markdown)..."
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Notes editor */}
              <div>
                <SectionLabel>Speaker Notes</SectionLabel>
                <textarea
                  value={activeSlide.notes}
                  onChange={(e) =>
                    onSlideNotesChange(activeSlideIndex, e.target.value)
                  }
                  placeholder="Speaker notes (visible in presenter mode)..."
                  className="w-full mt-1 p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs resize-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none placeholder-gray-500"
                  rows={3}
                  spellCheck={false}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              No slide selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
