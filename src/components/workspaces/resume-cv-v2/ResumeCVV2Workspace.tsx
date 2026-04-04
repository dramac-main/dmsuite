"use client";
/**
 * Resume & CV Builder V2 — Main Workspace
 * 3-panel resizable layout with zoom/pan artboard
 * Adapted from Reactive Resume v5
 */
import React, { useEffect, useRef, useCallback, Suspense } from "react";
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelSeparator,
} from "react-resizable-panels";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useResumeV2Editor } from "@/stores/resume-v2-editor";
import { defaultResumeData } from "@/lib/resume-v2/schema";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import ResumePreview from "./preview/ResumePreview";

/* ═══════════════════════════════════════════════════════
   Header Bar
   ═══════════════════════════════════════════════════════ */
function BuilderHeader() {
  const name = useResumeV2Editor((s) => s.resume.basics.name);
  const resetResume = useResumeV2Editor((s) => s.resetResume);
  const undo = () => useResumeV2Editor.temporal.getState().undo();
  const redo = () => useResumeV2Editor.temporal.getState().redo();

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-700 bg-gray-900 px-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium text-gray-200 truncate max-w-[200px]">
          {name || "Untitled Resume"}
        </h2>
        <span className="rounded bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-medium text-primary-400">
          V2
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => undo()}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          title="Undo (Ctrl+Z)"
        >
          <i className="ph ph-arrow-counter-clockwise text-sm" />
        </button>
        <button
          onClick={() => redo()}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          title="Redo (Ctrl+Y)"
        >
          <i className="ph ph-arrow-clockwise text-sm" />
        </button>
        <div className="mx-1 h-4 w-px bg-gray-700" />
        <button
          onClick={resetResume}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400"
          title="Reset to defaults"
        >
          <i className="ph ph-trash text-sm" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Zoom Controls
   ═══════════════════════════════════════════════════════ */
function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-900/90 p-1 shadow-lg backdrop-blur-sm">
      <button
        onClick={onZoomOut}
        className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
        title="Zoom Out"
      >
        <i className="ph ph-minus text-sm" />
      </button>
      <button
        onClick={onReset}
        className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200"
        title="Reset Zoom"
      >
        Fit
      </button>
      <button
        onClick={onZoomIn}
        className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
        title="Zoom In"
      >
        <i className="ph ph-plus text-sm" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Loading Fallback
   ═══════════════════════════════════════════════════════ */
function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="size-8 animate-spin rounded-full border-2 border-gray-600 border-t-primary-500" />
        <span className="text-sm text-gray-500">Loading builder...</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN WORKSPACE
   ═══════════════════════════════════════════════════════ */
export default function ResumeCVV2Workspace() {
  const initialized = useRef(false);
  const initialize = useResumeV2Editor((s) => s.initialize);
  const hasData = useResumeV2Editor((s) => !!s.resume.basics);

  // Initialize store with default data on first mount (if no persisted data)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      // Only initialize if the store doesn't have valid data already (from persist)
      if (!hasData) {
        initialize(defaultResumeData);
      }
    }
  }, [initialize, hasData]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useResumeV2Editor.temporal.getState().undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        useResumeV2Editor.temporal.getState().redo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-full flex-col bg-gray-950">
      <BuilderHeader />

      {/* Phosphor Icons CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css"
      />

      <PanelGroup orientation="horizontal" className="flex-1 min-h-0">
        {/* Left Sidebar — Section Editors */}
        <Panel
          defaultSize={25}
          minSize={15}
          maxSize={40}
          className="bg-gray-850"
        >
          <Suspense fallback={<LoadingFallback />}>
            <LeftSidebar />
          </Suspense>
        </Panel>

        <PanelSeparator className="w-1 bg-gray-700 hover:bg-primary-500/50 transition-colors" />

        {/* Center — Artboard with Zoom/Pan */}
        <Panel defaultSize={50} minSize={30}>
          <div className="relative h-full bg-gray-800 overflow-hidden">
            <TransformWrapper
              initialScale={0.6}
              minScale={0.2}
              maxScale={3}
              centerOnInit
              wheel={{ step: 0.05 }}
              panning={{ velocityDisabled: true }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <TransformComponent
                    wrapperStyle={{
                      width: "100%",
                      height: "100%",
                    }}
                    contentStyle={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "40px",
                    }}
                  >
                    <ResumePreview />
                  </TransformComponent>
                  <ZoomControls
                    onZoomIn={() => zoomIn(0.2)}
                    onZoomOut={() => zoomOut(0.2)}
                    onReset={() => resetTransform()}
                  />
                </>
              )}
            </TransformWrapper>
          </div>
        </Panel>

        <PanelSeparator className="w-1 bg-gray-700 hover:bg-primary-500/50 transition-colors" />

        {/* Right Sidebar — Design Controls */}
        <Panel
          defaultSize={25}
          minSize={15}
          maxSize={40}
          className="bg-gray-850"
        >
          <Suspense fallback={<LoadingFallback />}>
            <RightSidebar />
          </Suspense>
        </Panel>
      </PanelGroup>
    </div>
  );
}
