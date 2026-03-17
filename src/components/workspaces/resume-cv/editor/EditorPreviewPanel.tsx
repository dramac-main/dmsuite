// =============================================================================
// DMSuite — Resume Editor Center Panel: Live Preview
// Artboard-style preview using TemplateRenderer.
// Uses react-zoom-pan-pinch for smooth artboard interaction.
// Auto-fits to container width on mount. Supports DiffOverlay.
// =============================================================================

"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useResumeEditor } from "@/stores/resume-editor";
import { useResumeEditorUI } from "@/stores/resume-editor-ui";
import { useGoogleFonts } from "@/hooks/useGoogleFonts";
import { PAGE_DIMENSIONS } from "@/lib/resume/schema";
import TemplateRenderer from "@/lib/resume/templates/TemplateRenderer";
import DiffOverlay from "./DiffOverlay";
import type { Operation } from "fast-json-patch";

// ---------------------------------------------------------------------------
// Types for pending diff state
// ---------------------------------------------------------------------------

export interface PendingDiffState {
  originalResume: import("@/lib/resume/schema").ResumeData;
  patches: Operation[];
  rejectedPatches: Array<{ op: Operation; reason: string }>;
  warnings: string[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Main Preview Panel
// ---------------------------------------------------------------------------

interface EditorPreviewPanelProps {
  pendingDiff?: PendingDiffState | null;
  onAcceptDiff?: () => void;
  onRejectDiff?: () => void;
}

export default function EditorPreviewPanel({
  pendingDiff,
  onAcceptDiff,
  onRejectDiff,
}: EditorPreviewPanelProps) {
  const resume = useResumeEditor((s) => s.resume);
  const zoom = useResumeEditorUI((s) => s.zoom);
  const zoomIn = useResumeEditorUI((s) => s.zoomIn);
  const zoomOut = useResumeEditorUI((s) => s.zoomOut);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);

  // ── Load Google Fonts for the active font pairing ──
  useGoogleFonts(resume.metadata.typography.fontPairing);

  // Compute a fit-to-width scale based on container width vs page width
  const computeFitScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const dims = PAGE_DIMENSIONS[resume.metadata.page.format];
    const containerWidth = el.clientWidth;
    // Leave 48px padding on each side
    const availableWidth = containerWidth - 96;
    if (availableWidth > 0 && dims.width > 0) {
      const fit = Math.min(availableWidth / dims.width, 1);
      setAutoScale(fit);
    }
  }, [resume.metadata.page.format]);

  useEffect(() => {
    computeFitScale();
    const ro = new ResizeObserver(() => computeFitScale());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [computeFitScale]);

  // Combined scale: autoScale to fit container, then user zoom on top
  const combinedScale = autoScale * (zoom / 100);

  return (
    <div ref={containerRef} className="h-full relative bg-gray-950/80 overflow-hidden">
      {/* Checkerboard pattern to indicate artboard area */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Diff overlay bar when revision is pending */}
      {pendingDiff && onAcceptDiff && onRejectDiff && (
        <DiffOverlay
          originalResume={pendingDiff.originalResume}
          patches={pendingDiff.patches}
          rejectedPatches={pendingDiff.rejectedPatches}
          warnings={pendingDiff.warnings}
          summary={pendingDiff.summary}
          onAccept={onAcceptDiff}
          onReject={onRejectDiff}
        />
      )}

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
            <TemplateRenderer
              resume={resume}
              id="resume-preview"
              showOverflowWarning
            />
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Format label */}
      <div className="absolute bottom-3 left-3 rounded-full bg-gray-900/80 border border-gray-800/50 px-2 py-0.5 text-[10px] text-gray-500 backdrop-blur-sm">
        {resume.metadata.page.format.toUpperCase()}
      </div>

      {/* Floating zoom controls (Figma/Canva-style) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-0.5 rounded-lg bg-gray-900/85 border border-gray-800/50 backdrop-blur-sm px-1 py-0.5">
        <button
          onClick={zoomOut}
          className="rounded p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors"
          title="Zoom out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <span className="min-w-[38px] text-center text-xs tabular-nums text-gray-400">
          {zoom}%
        </span>
        <button
          onClick={zoomIn}
          className="rounded p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-colors"
          title="Zoom in"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>
    </div>
  );
}
