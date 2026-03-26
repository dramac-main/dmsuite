// =============================================================================
// DMSuite — Resume Step 7: Full-Screen Editor
// Architecture mirrors ContractDesignerWorkspace.tsx:
//   Fixed editor sidebar (tabbed: Sections | Design) + Preview canvas + Page nav
// Mobile: bottom toggle bar (Edit / Preview / Export)
// Desktop: editor panel + preview canvas with page navigation
// =============================================================================

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useResumeEditor, useResumeTemporalStore } from "@/stores/resume-editor";
import { useResumeEditorUI } from "@/stores/resume-editor-ui";
import { useResumeCVWizard } from "@/stores/resume-cv-wizard";
import { useChikoActions } from "@/hooks/useChikoActions";
import { useGoogleFonts } from "@/hooks/useGoogleFonts";
import { createResumeManifest } from "@/lib/chiko/manifests/resume";
import { PAGE_DIMENSIONS } from "@/lib/resume/schema";
import { TEMPLATES } from "@/lib/resume/templates/templates";
import TemplateRenderer, { RESUME_PAGE_GAP } from "@/lib/resume/templates/TemplateRenderer";
import type { TemplateId } from "@/lib/resume/schema";
import EditorSectionsPanel from "./editor/EditorSectionsPanel";
import EditorDesignPanel from "./editor/EditorDesignPanel";
import DiffOverlay from "./editor/DiffOverlay";
import AIChatBar from "./editor/AIChatBar";
import ExportDropdown, { type ExportFormat } from "./editor/ExportDropdown";
import type { PendingDiffState } from "./editor/EditorPreviewPanel";
import {
  EditorTabNav,
  BottomBar,
  WorkspaceHeader,
  IconButton,
  ActionButton,
  Icons,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// =============================================================================
// Editor tab definitions — mirror Contract workspace pattern
// =============================================================================

const TAB_ICONS = {
  sections: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  design: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="13.5" cy="17.5" r="2.5" />
    </svg>
  ),
};

const EDITOR_TABS = [
  { key: "sections", label: "Sections", icon: TAB_ICONS.sections },
  { key: "design", label: "Design", icon: TAB_ICONS.design },
] as const;

type EditorTabKey = (typeof EDITOR_TABS)[number]["key"];

// =============================================================================
// Main Editor Component
// =============================================================================

export default function StepEditor() {
  const resume = useResumeEditor((s) => s.resume);
  const setResume = useResumeEditor((s) => s.setResume);
  const changeTemplate = useResumeEditor((s) => s.changeTemplate);
  const undo = useResumeTemporalStore((s) => s.undo);
  const redo = useResumeTemporalStore((s) => s.redo);
  const pastStates = useResumeTemporalStore((s) => s.pastStates);
  const futureStates = useResumeTemporalStore((s) => s.futureStates);
  const atsScore = useResumeEditorUI((s) => s.atsScore);
  const setIsExporting = useResumeEditorUI((s) => s.setIsExporting);
  const goToStep = useResumeCVWizard((s) => s.goToStep);

  const previewScrollRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Active editor tab
  const [activeTab, setActiveTab] = useState<EditorTabKey>("sections");
  // Mobile view mode
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  // Zoom
  const [zoom, setZoom] = useState(100);
  // Multi-page tracking
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  // Diff overlay
  const [pendingDiff, setPendingDiff] = useState<PendingDiffState | null>(null);

  // ── Load Google Fonts for the active font pairing ──
  useGoogleFonts(resume.metadata.typography.fontPairing);

  // Derived
  const dims = PAGE_DIMENSIONS[resume.metadata.page.format];
  const pageH = dims.height;
  const pageStep = pageH + RESUME_PAGE_GAP;

  // ── Page count callback from TemplateRenderer ──
  const handlePageCount = useCallback((count: number) => {
    setTotalPages(count);
    setCurrentPage((prev) => Math.min(prev, Math.max(1, count)));
  }, []);

  // Reset to page 1 when template or page format changes
  useEffect(() => {
    setCurrentPage(1);
    if (previewScrollRef.current) previewScrollRef.current.scrollTop = 0;
  }, [resume.metadata.template, resume.metadata.page.format]);

  // ── Page navigation (contract pattern) ──
  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(totalPages, page));
      setCurrentPage(clamped);
      const el = previewScrollRef.current;
      if (el) el.scrollTo({ top: (clamped - 1) * pageStep, behavior: "smooth" });
    },
    [totalPages, pageStep],
  );

  const handlePreviewScroll = useCallback(() => {
    const el = previewScrollRef.current;
    if (!el) return;
    const page = Math.min(totalPages, Math.floor(el.scrollTop / pageStep) + 1);
    setCurrentPage(page);
  }, [totalPages, pageStep]);

  // ── Keyboard shortcut: Ctrl+K → focus AI chat bar ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const chatInput = document.querySelector<HTMLInputElement>("[data-chat-input]");
        chatInput?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Handle AI revision (ChatGPT-style chat bar) ──
  const handleAIRevision = useCallback(async (instruction: string) => {
    try {
      const { performAIRevision } = await import("@/lib/resume/ai-revision-engine");
      const wizardState = useResumeCVWizard.getState();
      const currentResume = useResumeEditor.getState().resume;

      const context: import("@/lib/resume/ai-revision-engine").RevisionContext = {
        scope: "full",
        contentFidelityMode: wizardState.brief.contentFidelityMode,
        wizardData: {
          personal: {
            name: wizardState.personal.name,
            email: wizardState.personal.email,
            phone: wizardState.personal.phone,
            location: wizardState.personal.location,
            linkedin: wizardState.personal.linkedin,
            website: wizardState.personal.website,
          },
          experiences: wizardState.experiences.map((exp) => ({
            company: exp.company,
            position: exp.position,
            startDate: exp.startDate,
            endDate: exp.endDate,
            isCurrent: exp.isCurrent,
            description: exp.description,
          })),
          education: wizardState.education.map((edu) => ({
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            graduationYear: edu.graduationYear,
          })),
          skills: wizardState.skills,
          brief: {
            description: wizardState.brief.description,
            style: wizardState.brief.style,
            contentFidelityMode: wizardState.brief.contentFidelityMode,
            jobDescription: wizardState.brief.jobDescription,
          },
        },
        targetRole: wizardState.targetRole.jobTitle,
        jobDescription: wizardState.brief.jobDescription || undefined,
      };

      const result = await performAIRevision(instruction, currentResume, context);

      if (result.success && result.updatedResumeData) {
        const snapshot = structuredClone(currentResume);
        setResume(result.updatedResumeData);
        setPendingDiff({
          originalResume: snapshot,
          patches: result.patches,
          rejectedPatches: result.rejectedPatches,
          warnings: result.warnings,
          summary: result.summary,
        });
      }
    } catch {
      // Silent fail — user will see no diff
    }
  }, [setResume]);

  const handleAcceptDiff = useCallback(() => {
    setPendingDiff(null);
  }, []);

  const handleRejectDiff = useCallback(() => {
    if (pendingDiff) {
      setResume(pendingDiff.originalResume);
    }
    setPendingDiff(null);
  }, [pendingDiff, setResume]);

  // ── Export handler ──
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (format === "print") {
      const printEl = document.getElementById("resume-print-area");
      if (!printEl) return;
      const { printHTML } = await import("@/lib/print");
      const pageSize = resume.metadata.page.format === "a4" ? "A4" : "letter";
      const html = `<!DOCTYPE html><html><head>
        <title>${resume.basics.name || "Resume"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: ${pageSize} portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          [data-measure-container] { display: none !important; }
          [data-resume-pages] { gap: 0 !important; }
          [data-resume-page] { page-break-after: always; }
          [data-resume-page]:last-child { page-break-after: auto; }
        </style></head><body>${printEl.innerHTML}</body></html>`;
      printHTML(html);
      return;
    }
    setIsExporting(true);
    try {
      const { exportResume } = await import("@/lib/resume/export");
      const result = await exportResume(format, {
        resume,
        fileName: resume.basics.name || "resume",
      });
      if (!result.success) {
        console.error(`Export failed: ${result.error}`);
      }
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  }, [resume, setIsExporting]);

  // Register Chiko resume manifest
  const exportRef = useRef<((format: string) => Promise<void>) | null>(null);
  exportRef.current = handleExport as (format: string) => Promise<void>;
  useChikoActions(() => createResumeManifest({ onExportRef: exportRef }));

  // Section count for header subtitle
  const sectionCount = Object.values(resume.sections).filter(
    (s) => s && typeof s === "object" && "hidden" in s && !s.hidden
  ).length;

  // ── Tab content ──
  const tabContent = (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {activeTab === "sections" && <EditorSectionsPanel />}
      {activeTab === "design" && <EditorDesignPanel />}

      {/* Start Over — always at the bottom */}
      <div className="p-4 pb-8">
        <button
          onClick={() => {
            if (confirm("Start a new resume? Your current progress will be cleared.")) {
              goToStep(0);
            }
          }}
          className="w-full py-2 text-[11px] font-medium text-gray-600 hover:text-gray-400 border border-gray-800/50 hover:border-gray-700/60 rounded-xl transition-all active:scale-[0.98]"
        >
          Start Over
        </button>
      </div>
    </div>
  );

  // ── Editor Panel (left sidebar) ──
  const editorPanel = (
    <div className="flex flex-col h-full">
      {/* Header — contract-style WorkspaceHeader */}
      <WorkspaceHeader
        title="Resume Editor"
        subtitle={`${sectionCount} sections`}
      >
        <IconButton onClick={() => undo()} disabled={pastStates.length === 0} icon={Icons.undo} tooltip="Undo" />
        <IconButton onClick={() => redo()} disabled={futureStates.length === 0} icon={Icons.redo} tooltip="Redo" />
      </WorkspaceHeader>

      {/* Tab navigation — Sections / Design */}
      <EditorTabNav
        tabs={EDITOR_TABS.map((t) => ({ key: t.key, label: t.label, icon: t.icon }))}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as EditorTabKey)}
      />

      {/* Tab content */}
      {tabContent}
    </div>
  );

  // ── Preview Panel (center) ──
  const previewPanel = (
    <div className="flex flex-col h-full bg-gray-950/40">
      {/* Preview toolbar — zoom + ATS + export */}
      <div className="shrink-0 flex items-center justify-between h-10 px-3 border-b border-gray-800/40">
        <div className="flex items-center gap-1">
          <IconButton onClick={() => setZoom((z) => Math.max(30, z - 10))} icon={Icons.zoomOut} tooltip="Zoom out" />
          <span className="text-[10px] text-gray-500 w-9 text-center font-mono tabular-nums">{zoom}%</span>
          <IconButton onClick={() => setZoom((z) => Math.min(200, z + 10))} icon={Icons.zoomIn} tooltip="Zoom in" />
          <button onClick={() => setZoom(100)} className="text-[10px] text-gray-600 hover:text-gray-400 px-1.5 py-0.5 rounded-md hover:bg-white/4 transition-colors">
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          {atsScore !== null && (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                atsScore >= 80
                  ? "bg-green-500/10 text-green-400"
                  : atsScore >= 60
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              ATS {atsScore}%
            </div>
          )}
          <ExportDropdown onExport={handleExport} />
        </div>
      </div>

      {/* Template quick-switch strip (contract pattern) */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-gray-800/30 overflow-x-auto scrollbar-none">
        <span className="text-[8px] text-gray-600 shrink-0 mr-0.5 uppercase tracking-widest font-bold">TPL</span>
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => changeTemplate(tpl.id)}
            className={`shrink-0 flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all ${
              resume.metadata.template === tpl.id
                ? "border-primary-500/50 bg-primary-500/10 text-primary-300"
                : "border-gray-700/40 text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
          >
            {tpl.accentPreview && (
              <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/10" style={{ backgroundColor: tpl.accentPreview }} />
            )}
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Preview canvas — PDF viewer style (grey bg + page shadows) */}
      <div
        ref={previewScrollRef}
        className="flex-1 overflow-auto"
        onScroll={handlePreviewScroll}
        style={{ backgroundColor: "#374151" }}
      >
        {/* Diff overlay bar when revision is pending */}
        {pendingDiff && (
          <DiffOverlay
            originalResume={pendingDiff.originalResume}
            patches={pendingDiff.patches}
            rejectedPatches={pendingDiff.rejectedPatches}
            warnings={pendingDiff.warnings}
            summary={pendingDiff.summary}
            onAccept={handleAcceptDiff}
            onReject={handleRejectDiff}
          />
        )}

        <style>{`
          .resume-canvas-root [data-resume-page] { box-shadow: 0 4px 32px rgba(0,0,0,0.45); }
          @media print { .resume-canvas-root [data-resume-page] { box-shadow: none !important; } }
        `}</style>

        <div
          className="resume-canvas-root flex justify-center py-6 px-4"
          style={{ minHeight: "100%" }}
        >
          <div style={{ position: "relative" }}>
            <div
              id="resume-print-area"
              ref={printAreaRef}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <TemplateRenderer
                resume={resume}
                onPageCount={handlePageCount}
                pageGap={RESUME_PAGE_GAP}
                showOverflowWarning
              />
            </div>
          </div>
        </div>
      </div>

      {/* Wondershare/Acrobat-style page navigation bar (contract pattern) */}
      <div className="shrink-0 flex items-center justify-center gap-2 h-10 border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm px-3">
        {/* Prev page */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Previous page"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Page dots for ≤8 pages */}
        {totalPages <= 8 ? (
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                title={`Page ${i + 1}`}
                className={`rounded-full transition-all ${
                  i + 1 === currentPage
                    ? "w-5 h-1.5 bg-primary-400"
                    : "w-1.5 h-1.5 bg-gray-600 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-gray-400 tabular-nums font-mono min-w-15 text-center">
            {currentPage} / {totalPages}
          </span>
        )}

        {/* Page text label */}
        <span className="text-[10px] text-gray-600 tabular-nums hidden sm:block">
          pg {currentPage} of {totalPages}
        </span>

        {/* Next page */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Next page"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );

  // ── Layout — matches Contract workspace ──
  return (
    <div className="flex flex-col h-full bg-gray-950 text-white overflow-hidden">
      {/* Mobile bottom action bar */}
      <div className="lg:hidden order-last">
        <BottomBar
          actions={[
            { key: "editor", label: "Edit", icon: Icons.edit },
            { key: "preview", label: "Preview", icon: Icons.preview },
            { key: "export", label: "Export", icon: Icons.print, primary: true },
          ]}
          activeKey={mobileView}
          onAction={(key) => {
            if (key === "export") handleExport("print");
            else setMobileView(key as "editor" | "preview");
          }}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor panel (fixed sidebar) */}
        <div
          className={`${
            mobileView === "editor" ? "flex" : "hidden"
          } lg:flex w-full lg:w-80 xl:w-96 lg:min-w-72 shrink-0 flex-col border-r border-gray-800/40 bg-gray-950 overflow-hidden`}
        >
          {editorPanel}
        </div>

        {/* Preview */}
        <div
          className={`${
            mobileView === "preview" ? "flex" : "hidden"
          } lg:flex flex-1 overflow-hidden relative`}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            {previewPanel}
          </div>
        </div>
      </div>

      {/* Floating AI chat bar */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 lg:left-[calc(50%+10rem)] lg:max-w-lg">
        <AIChatBar onExecute={handleAIRevision} />
      </div>
    </div>
  );
}
