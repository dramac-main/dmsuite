// =============================================================================
// DMSuite — Resume & CV Builder (Reactive Resume-Inspired)
// Two-panel editor: Left = scrollable section forms, Right = live A4 preview
// No wizard gate — users land directly in the editor.
// Mobile: bottom bar toggles between Edit / Preview / Design / Export views.
// =============================================================================

"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useResumeEditor, useResumeTemporalStore } from "@/stores/resume-editor";
import { useChikoActions } from "@/hooks/useChikoActions";
import { useGoogleFonts } from "@/hooks/useGoogleFonts";
import { createResumeManifest } from "@/lib/chiko/manifests/resume";
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import {
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  ZOOM_DEFAULT,
  PAGE_DOTS_THRESHOLD,
  MILESTONE_EDIT_THRESHOLD,
} from "@/lib/workspace-constants";
import "@/styles/workspace-canvas.css";
import { PAGE_DIMENSIONS } from "@/lib/resume/schema";
import { TEMPLATES } from "@/lib/resume/templates/templates";
import TemplateRenderer, {
  RESUME_PAGE_GAP,
} from "@/lib/resume/templates/TemplateRenderer";
import ResumeLeftPanel from "./ResumeLeftPanel";
import ResumeDesignDrawer from "./ResumeDesignDrawer";
import ExportDropdown from "./ExportDropdown";
import {
  BottomBar,
  WorkspaceHeader,
  IconButton,
  ConfirmDialog,
  Icons,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// =============================================================================
// Main Workspace Component
// =============================================================================

export default function ResumeBuilderWorkspace() {
  const resume = useResumeEditor((s) => s.resume);
  const resetResume = useResumeEditor((s) => s.resetResume);
  const changeTemplate = useResumeEditor((s) => s.changeTemplate);
  const undo = useResumeTemporalStore((s) => s.undo);
  const redo = useResumeTemporalStore((s) => s.redo);
  const pastStates = useResumeTemporalStore((s) => s.pastStates);
  const futureStates = useResumeTemporalStore((s) => s.futureStates);

  const previewScrollRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Mobile view mode
  const [mobileView, setMobileView] = useState<
    "editor" | "preview" | "design"
  >("editor");
  // Zoom
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  // Multi-page tracking
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  // Start-over confirm dialog
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);
  // Design drawer
  const [showDesignDrawer, setShowDesignDrawer] = useState(false);

  // ── Load Google Fonts for the active font pairing ──
  useGoogleFonts(resume.metadata.typography.fontPairing);

  // Derived
  const dims = PAGE_DIMENSIONS[resume.metadata.page.format];
  const pageH = dims.height;
  const pageStep = pageH + RESUME_PAGE_GAP;

  // ── Register Chiko manifest ──
  const manifest = useMemo(
    () => createResumeManifest(),
    []
  );
  useChikoActions(manifest);

  // ── Dispatch workspace events on resume changes ──
  const resumeRef = useRef(resume);
  const editCountRef = useRef(0);
  useEffect(() => {
    if (resumeRef.current === resume) return;
    resumeRef.current = resume;
    editCountRef.current++;
    dispatchDirty();
    if (editCountRef.current >= MILESTONE_EDIT_THRESHOLD) {
      dispatchProgress("edited");
    }
  }, [resume]);

  // ── Zoom controls ──
  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX)),
    []
  );
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN)),
    []
  );
  const zoomReset = useCallback(() => setZoom(ZOOM_DEFAULT), []);

  // ── Page navigation via scroll ──
  const handlePreviewScroll = useCallback(() => {
    const el = previewScrollRef.current;
    if (!el || totalPages <= 1) return;
    const scrolled = el.scrollTop;
    const scaledStep = pageStep * (zoom / 100);
    const page = Math.min(
      totalPages,
      Math.max(1, Math.floor(scrolled / scaledStep) + 1)
    );
    setCurrentPage(page);
  }, [totalPages, pageStep, zoom]);

  const scrollToPage = useCallback(
    (page: number) => {
      const el = previewScrollRef.current;
      if (!el) return;
      const scaledStep = pageStep * (zoom / 100);
      el.scrollTo({ top: (page - 1) * scaledStep, behavior: "smooth" });
    },
    [pageStep, zoom]
  );

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // ── Handle start over ──
  const handleStartOver = useCallback(() => {
    resetResume();
    setShowStartOverDialog(false);
  }, [resetResume]);

  // ── Template strip items ──
  const templateEntries = useMemo(
    () =>
      TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
      })),
    []
  );

  // ── Bottom bar actions (mobile) ──
  const bottomActions = useMemo(
    () => [
      { key: "editor", label: "Edit", icon: <SIcon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /> },
      { key: "preview", label: "Preview", icon: <Icons.eye /> },
      { key: "design", label: "Design", icon: <SIcon d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" /> },
    ],
    []
  );

  // ── Export handler ──
  const handleExport = useCallback(
    async (format: string) => {
      const expMod = await import("@/lib/resume/export");
      const container = printAreaRef.current;
      if (!container) return;
      switch (format) {
        case "pdf":
          await expMod.exportToPdf(container, resume);
          break;
        case "docx":
          expMod.exportToDocx(resume);
          break;
        case "txt":
          expMod.exportToTxt(resume);
          break;
        case "json":
          expMod.exportToJson(resume);
          break;
        case "clipboard":
          expMod.copyToClipboard(resume);
          break;
        case "print":
          expMod.printResume(container);
          break;
      }
      dispatchProgress("exported");
    },
    [resume]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-950">
      {/* ── Desktop: Two-panel layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel: Section Editor (scrollable) ── */}
        <div
          className={`${
            mobileView === "editor" ? "flex" : "hidden"
          } lg:flex flex-col border-r border-gray-800/40 bg-gray-900/60 w-full lg:w-96 xl:w-[420px] shrink-0`}
        >
          {/* Header */}
          <div className="flex items-center justify-between h-11 px-3 border-b border-gray-800/40 bg-gray-900/30 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Resume Builder
              </span>
            </div>
            <div className="flex items-center gap-1">
              <IconButton
                icon={<Icons.undo />}
                title="Undo (Ctrl+Z)"
                onClick={() => undo()}
                disabled={pastStates.length === 0}
              />
              <IconButton
                icon={<Icons.redo />}
                title="Redo (Ctrl+Y)"
                onClick={() => redo()}
                disabled={futureStates.length === 0}
              />
              <IconButton
                icon={
                  <SIcon d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
                }
                title="Design Settings"
                onClick={() => setShowDesignDrawer(true)}
              />
            </div>
          </div>

          {/* Scrollable section editors */}
          <ResumeLeftPanel
            onStartOver={() => setShowStartOverDialog(true)}
            onOpenDesign={() => setShowDesignDrawer(true)}
          />
        </div>

        {/* ── Right Panel: Live Preview ── */}
        <div
          className={`${
            mobileView === "preview" || mobileView === "design"
              ? "flex"
              : "hidden"
          } lg:flex flex-col flex-1 bg-gray-800 overflow-hidden`}
        >
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between h-11 px-3 border-b border-gray-700/40 bg-gray-800/60 shrink-0">
            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <IconButton
                icon={<SIcon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6" />}
                title="Zoom Out"
                onClick={zoomOut}
              />
              <button
                onClick={zoomReset}
                className="text-[11px] font-mono text-gray-400 hover:text-gray-200 px-1.5 min-w-[3rem] text-center"
              >
                {zoom}%
              </button>
              <IconButton
                icon={<SIcon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />}
                title="Zoom In"
                onClick={zoomIn}
              />
            </div>

            {/* Template quick-switch */}
            <div className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-none max-w-[40%]">
              {templateEntries.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  onClick={() => changeTemplate(t.id)}
                  className={`text-[10px] px-2 py-1 rounded whitespace-nowrap transition-colors ${
                    resume.metadata.template === t.id
                      ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-700/40"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Export */}
            <ExportDropdown onExport={handleExport} />
          </div>

          {/* Preview canvas area */}
          <div
            ref={previewScrollRef}
            onScroll={handlePreviewScroll}
            className="flex-1 overflow-auto bg-gray-800 scrollbar-thin"
          >
            <div className="flex justify-center py-6 px-4 min-h-full">
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                  width: dims.width,
                }}
              >
                <div ref={printAreaRef}>
                  <TemplateRenderer
                    resume={resume}
                    pageGap={RESUME_PAGE_GAP}
                    onPageCount={setTotalPages}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 h-8 border-t border-gray-700/40 bg-gray-800/60 shrink-0">
              <button
                onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="text-gray-500 hover:text-gray-300 disabled:opacity-30 p-0.5"
              >
                <SIcon d="M15 19l-7-7 7-7" />
              </button>
              {totalPages <= PAGE_DOTS_THRESHOLD ? (
                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToPage(i + 1)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        currentPage === i + 1
                          ? "bg-primary-400"
                          : "bg-gray-600 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-gray-500 font-mono">
                  {currentPage} / {totalPages}
                </span>
              )}
              <button
                onClick={() =>
                  scrollToPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage >= totalPages}
                className="text-gray-500 hover:text-gray-300 disabled:opacity-30 p-0.5"
              >
                <SIcon d="M9 5l7 7-7 7" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Bottom Bar ── */}
      <div className="lg:hidden">
        <BottomBar
          actions={bottomActions}
          activeKey={mobileView}
          onAction={(key) => {
            if (key === "design") {
              setShowDesignDrawer(true);
              setMobileView("preview");
            } else {
              setMobileView(key as "editor" | "preview");
            }
          }}
        />
      </div>

      {/* ── Design Drawer ── */}
      {showDesignDrawer && (
        <ResumeDesignDrawer
          onClose={() => setShowDesignDrawer(false)}
          onExport={handleExport}
        />
      )}

      {/* ── Start Over Confirm ── */}
      <ConfirmDialog
        open={showStartOverDialog}
        title="Start Over?"
        description="This will erase all your resume data and start fresh. This action cannot be undone."
        variant="danger"
        onConfirm={handleStartOver}
        onCancel={() => setShowStartOverDialog(false)}
      />
    </div>
  );
}
