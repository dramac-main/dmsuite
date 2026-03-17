// =============================================================================
// DMSuite — Editor Bottom Toolbar (v2)
// Persistent dock bar: Undo/Redo, AI trigger, Template Carousel trigger,
// Zoom controls, ATS mini-badge.
// =============================================================================

"use client";

import { useState } from "react";
import { useResumeEditor, useResumeTemporalStore } from "@/stores/resume-editor";
import { useResumeEditorUI, type PreviewZoom } from "@/stores/resume-editor-ui";
import TemplateCarousel from "./TemplateCarousel";

// ── Inline SVG Icons ──

function IconUndo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function IconRedo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconZoomIn({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function IconZoomOut({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function IconShield({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconCommand({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function IconLayout({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function IconChevronUp({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface EditorBottomToolbarProps {
  onOpenCommandPalette: () => void;
}

export default function EditorBottomToolbar({ onOpenCommandPalette }: EditorBottomToolbarProps) {
  const undo = useResumeTemporalStore((s) => s.undo);
  const redo = useResumeTemporalStore((s) => s.redo);
  const pastStates = useResumeTemporalStore((s) => s.pastStates);
  const futureStates = useResumeTemporalStore((s) => s.futureStates);

  const resume = useResumeEditor((s) => s.resume);

  const zoom = useResumeEditorUI((s) => s.zoom);
  const setZoom = useResumeEditorUI((s) => s.setZoom);
  const zoomIn = useResumeEditorUI((s) => s.zoomIn);
  const zoomOut = useResumeEditorUI((s) => s.zoomOut);
  const atsScore = useResumeEditorUI((s) => s.atsScore);

  const [isCarouselOpen, setIsCarouselOpen] = useState(false);

  const templateName: Record<string, string> = {
    classic: "Classic",
    modern: "Modern",
    "two-column": "Two Column",
    minimal: "Minimal",
    executive: "Executive",
    creative: "Creative",
  };

  return (
    <div className="relative">
      {/* Template Carousel — slides up from bottom */}
      <TemplateCarousel
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
      />

      {/* Toolbar bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900/90 border-t border-gray-800/60 backdrop-blur-sm">
        {/* Left: Undo/Redo + Command Palette trigger */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={undo}
            disabled={pastStates.length === 0}
            className="rounded p-1.5 text-gray-500 transition-colors hover:text-gray-300 hover:bg-gray-800/60 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <IconUndo />
          </button>
          <button
            onClick={redo}
            disabled={futureStates.length === 0}
            className="rounded p-1.5 text-gray-500 transition-colors hover:text-gray-300 hover:bg-gray-800/60 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <IconRedo />
          </button>

          <div className="w-px h-4 bg-gray-800 mx-1" />

          <button
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:text-gray-300 hover:bg-gray-800/60"
            title="Command Palette (Ctrl+K)"
          >
            <IconCommand />
            <span className="hidden sm:inline">AI</span>
            <kbd className="hidden md:inline text-xs text-gray-600 bg-gray-800/40 border border-gray-700/50 rounded px-1 py-0.5 ml-1">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Center: Template Carousel Trigger */}
        <button
          onClick={() => setIsCarouselOpen(!isCarouselOpen)}
          className={`hidden md:inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-all border ${
            isCarouselOpen
              ? "border-primary-500/40 bg-primary-500/10 text-primary-300"
              : "border-gray-700/50 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:text-gray-200"
          }`}
        >
          <IconLayout />
          <span className="font-medium">{templateName[resume.metadata.template] ?? "Modern"}</span>
          <IconChevronUp className={`transition-transform ${isCarouselOpen ? "" : "rotate-180"}`} />
        </button>

        {/* Right: Zoom + ATS Badge */}
        <div className="flex items-center gap-2">
          {/* ATS mini badge */}
          {atsScore !== null && (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                atsScore >= 80
                  ? "bg-green-500/10 text-green-400"
                  : atsScore >= 60
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              <IconShield />
              {atsScore}
            </div>
          )}

          <div className="w-px h-4 bg-gray-800" />

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={zoomOut}
              className="rounded p-1 text-gray-500 hover:text-gray-300 transition-colors"
              title="Zoom out"
            >
              <IconZoomOut />
            </button>
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value) as PreviewZoom)}
              className="bg-transparent text-xs text-gray-400 outline-none cursor-pointer px-0.5 w-12 text-center"
            >
              <option value={50} className="bg-gray-900">50%</option>
              <option value={75} className="bg-gray-900">75%</option>
              <option value={100} className="bg-gray-900">100%</option>
              <option value={125} className="bg-gray-900">125%</option>
              <option value={150} className="bg-gray-900">150%</option>
            </select>
            <button
              onClick={zoomIn}
              className="rounded p-1 text-gray-500 hover:text-gray-300 transition-colors"
              title="Zoom in"
            >
              <IconZoomIn />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
