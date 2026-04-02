// =============================================================================
// DMSuite — Resume & CV Builder Workspace (V2 — Reactive Resume Inspired)
// Two-panel editor: left accordion sections → right A4/Letter live preview.
// Mobile: toggle between editor / preview with bottom bar.
// =============================================================================

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useResumeEditor, useResumeTemporalStore } from "@/stores/resume-editor";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createResumeManifest } from "@/lib/chiko/manifests/resume";
import { useGoogleFonts } from "@/hooks/useGoogleFonts";
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT } from "@/lib/workspace-constants";
import TemplateRenderer from "@/lib/resume/TemplateRenderer";
import ResumeLeftPanel from "./ResumeLeftPanel";
import ResumeDesignDrawer from "./ResumeDesignDrawer";
import ExportDropdown from "./ExportDropdown";
import {
  WorkspaceHeader,
  IconButton,
  ActionButton,
  BottomBar,
  Icons,
  ConfirmDialog,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import WorkspaceErrorBoundary from "@/components/workspaces/shared/WorkspaceErrorBoundary";
import { FONT_PAIRINGS } from "@/lib/resume/schema";
import "@/styles/workspace-canvas.css";

// ── Main Workspace ──────────────────────────────────────────────────────────

export default function ResumeBuilderWorkspace() {
  // ── Store bindings ──
  const resume = useResumeEditor((s) => s.resume);
  const resetResume = useResumeEditor((s) => s.resetResume);
  const undo = useResumeTemporalStore((s) => s.undo);
  const redo = useResumeTemporalStore((s) => s.redo);
  const canUndo = useResumeTemporalStore((s) => s.pastStates.length > 0);
  const canRedo = useResumeTemporalStore((s) => s.futureStates.length > 0);

  // ── Refs ──
  const chikoOnPrintRef = useRef<(() => void) | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // ── State ──
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [showDesignDrawer, setShowDesignDrawer] = useState(false);
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  // ── Google Fonts ──
  const fontPairingId = useMemo(() => {
    const headingFam = resume.metadata?.typography?.heading?.fontFamily;
    const bodyFam = resume.metadata?.typography?.body?.fontFamily;
    if (!headingFam && !bodyFam) return "inter-inter";
    for (const [key, val] of Object.entries(FONT_PAIRINGS)) {
      if (val.heading === headingFam || val.body === bodyFam) return key;
    }
    return "inter-inter";
  }, [resume.metadata?.typography?.heading?.fontFamily, resume.metadata?.typography?.body?.fontFamily]);
  useGoogleFonts(fontPairingId);

  // ── dispatchDirty on resume changes ──
  const resumeRef = useRef(resume);
  useEffect(() => {
    if (resumeRef.current === resume) return;
    resumeRef.current = resume;
    dispatchDirty();
  }, [resume]);

  // ── dispatchProgress milestones ──
  const prevMilestonesRef = useRef<string>("");
  useEffect(() => {
    const milestones: string[] = [];
    if (resume.basics?.name?.trim()) milestones.push("input");
    if (resume.summary?.content?.trim()) milestones.push("content");
    const key = milestones.join(",");
    if (key !== prevMilestonesRef.current) {
      prevMilestonesRef.current = key;
      milestones.forEach((m) => dispatchProgress(m as "input" | "content"));
    }
  }, [resume.basics?.name, resume.summary?.content]);

  // ── Print handler ──
  const handlePrint = useCallback(() => {
    window.print();
    dispatchProgress("exported");
  }, []);

  // ── Chiko registration ──
  useEffect(() => { chikoOnPrintRef.current = handlePrint; }, [handlePrint]);
  useChikoActions(() => createResumeManifest({ onPrintRef: chikoOnPrintRef }));

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmd = e.ctrlKey || e.metaKey;
      if (isCmd && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (isCmd && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if (isCmd && e.key === "p") { e.preventDefault(); handlePrint(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, handlePrint]);

  // ── Zoom helpers ──
  const zoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX));
  const zoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN));
  const zoomReset = () => setZoom(ZOOM_DEFAULT);

  // ── Start Over ──
  const handleStartOver = useCallback(() => {
    resetResume();
    setShowStartOverDialog(false);
  }, [resetResume]);

  // ── Mobile bottom bar ──
  const mobileActions = useMemo(() => [
    { key: "editor", label: "Editor", icon: Icons.edit },
    { key: "preview", label: "Preview", icon: Icons.preview },
  ], []);

  return (
    <WorkspaceErrorBoundary>
      <div className="flex flex-col h-full bg-gray-950 text-white overflow-hidden">
        {/* Mobile bottom bar */}
        <div className="lg:hidden order-last">
          <BottomBar
            actions={mobileActions}
            activeKey={mobileView}
            onAction={(key) => setMobileView(key as "editor" | "preview")}
          />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* ── Left Panel: Editor ── */}
          <div
            className={`${
              mobileView === "editor" ? "flex" : "hidden"
            } lg:flex flex-col w-full lg:w-80 xl:w-96 border-r border-gray-800 bg-gray-900 overflow-hidden`}
          >
            {/* Header */}
            <WorkspaceHeader title="Resume & CV" subtitle={resume.metadata?.template ?? "onyx"}>
              <IconButton
                onClick={undo}
                disabled={!canUndo}
                icon={Icons.undo}
                title="Undo (Ctrl+Z)"
              />
              <IconButton
                onClick={redo}
                disabled={!canRedo}
                icon={Icons.redo}
                title="Redo (Ctrl+Y)"
              />
              <IconButton
                onClick={() => setShowDesignDrawer(true)}
                icon={Icons.edit}
                title="Design & Templates"
              />
              <ExportDropdown printAreaRef={printAreaRef} />
              <IconButton
                onClick={() => setShowStartOverDialog(true)}
                icon={Icons.close}
                title="Start Over"
              />
            </WorkspaceHeader>

            {/* Scrollable sections */}
            <div className="flex-1 overflow-y-auto">
              <ResumeLeftPanel />
            </div>
          </div>

          {/* ── Right Panel: Preview ── */}
          <div
            className={`${
              mobileView === "preview" ? "flex" : "hidden"
            } lg:flex flex-1 flex-col overflow-hidden bg-gray-950`}
          >
            {/* Zoom toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={zoomOut}
                  className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={zoomReset}
                  className="px-2 py-0.5 text-xs font-mono text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors min-w-[3rem] text-center"
                >
                  {zoom}%
                </button>
                <button
                  onClick={zoomIn}
                  className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {(resume.metadata?.page?.format ?? "a4").toUpperCase()} • {resume.metadata?.layout?.pages?.length ?? 1} page{(resume.metadata?.layout?.pages?.length ?? 1) !== 1 ? "s" : ""}
                </span>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDesignDrawer(true)}
                >
                  Design
                </ActionButton>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto p-6 flex justify-center workspace-canvas">
              <div ref={printAreaRef}>
                <TemplateRenderer data={resume} zoom={zoom / 100} />
              </div>
            </div>
          </div>
        </div>

        {/* Design drawer */}
        <ResumeDesignDrawer
          open={showDesignDrawer}
          onClose={() => setShowDesignDrawer(false)}
        />

        {/* Start Over dialog */}
        <ConfirmDialog
          open={showStartOverDialog}
          title="Start Over?"
          description="This will clear all resume content and reset to defaults. This cannot be undone."
          confirmLabel="Start Over"
          variant="danger"
          onConfirm={handleStartOver}
          onCancel={() => setShowStartOverDialog(false)}
        />
      </div>
    </WorkspaceErrorBoundary>
  );
}
