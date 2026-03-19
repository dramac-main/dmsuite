// =============================================================================
// DMSuite — Resume Step 7: Full-Screen Editor
// Three-panel layout: Left (section forms) | Center (live preview) | Right (design)
// Uses react-resizable-panels for flexible layout.
// Integrates: AIChatBar (ChatGPT-style), ExportDropdown, DiffOverlay.
// =============================================================================

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Panel, Group, Separator, usePanelRef } from "react-resizable-panels";
import { useResumeEditor, useResumeTemporalStore } from "@/stores/resume-editor";
import { useResumeEditorUI } from "@/stores/resume-editor-ui";
import { useResumeCVWizard } from "@/stores/resume-cv-wizard";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createResumeManifest } from "@/lib/chiko/manifests/resume";
import EditorSectionsPanel from "./editor/EditorSectionsPanel";
import EditorPreviewPanel, { type PendingDiffState } from "./editor/EditorPreviewPanel";
import EditorDesignPanel from "./editor/EditorDesignPanel";
import AIChatBar from "./editor/AIChatBar";
import ExportDropdown, { type ExportFormat } from "./editor/ExportDropdown";

// ── Inline SVG Icons ──

function IconUndo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function IconRedo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconArrowLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconShield({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Editor Toolbar
// ---------------------------------------------------------------------------

function EditorToolbar({ onExport }: { onExport: (format: ExportFormat) => void }) {
  const undo = useResumeTemporalStore((s) => s.undo);
  const redo = useResumeTemporalStore((s) => s.redo);
  const pastStates = useResumeTemporalStore((s) => s.pastStates);
  const futureStates = useResumeTemporalStore((s) => s.futureStates);
  const atsScore = useResumeEditorUI((s) => s.atsScore);
  const goToStep = useResumeCVWizard((s) => s.goToStep);

  const handleBack = useCallback(() => {
    goToStep(6);
  }, [goToStep]);

  return (
    <div className="relative z-50 flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800/60 backdrop-blur-sm">
      {/* Left: Back + Undo/Redo */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:text-gray-200 hover:bg-gray-800/60"
          title="Back to wizard"
        >
          <IconArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="w-px h-5 bg-gray-800" />
        <button
          onClick={undo}
          disabled={pastStates.length === 0}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:text-gray-200 hover:bg-gray-800/60 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo"
        >
          <IconUndo />
        </button>
        <button
          onClick={redo}
          disabled={futureStates.length === 0}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:text-gray-200 hover:bg-gray-800/60 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo"
        >
          <IconRedo />
        </button>
      </div>

      {/* Center: Title */}
      <h1 className="text-sm font-medium text-gray-300 hidden md:block">
        Resume Editor
      </h1>

      {/* Right: ATS Score + Export Dropdown */}
      <div className="flex items-center gap-3">
        {atsScore !== null && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              atsScore >= 80
                ? "bg-green-500/10 text-green-400"
                : atsScore >= 60
                ? "bg-yellow-500/10 text-yellow-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            <IconShield />
            ATS: {atsScore}%
          </div>
        )}
        <ExportDropdown onExport={onExport} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Editor Component
// ---------------------------------------------------------------------------

export default function StepEditor() {
  // ---- Panel imperative handles (Reactive Resume pattern) ----
  // usePanelRef gives imperative control: .collapse(), .expand(), .isCollapsed(), .resize()
  const leftPanelRef = usePanelRef();
  const rightPanelRef = usePanelRef();

  const toggleLeftPanel = useCallback(() => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  }, [leftPanelRef]);

  const toggleRightPanel = useCallback(() => {
    const panel = rightPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  }, [rightPanelRef]);

  // ---- Diff overlay state ----
  const [pendingDiff, setPendingDiff] = useState<PendingDiffState | null>(null);
  const resume = useResumeEditor((s) => s.resume);
  const setResume = useResumeEditor((s) => s.setResume);
  const setIsExporting = useResumeEditorUI((s) => s.setIsExporting);

  // ---- Keyboard shortcut: Ctrl+K → focus AI chat bar ----
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        // Focus the chat bar input
        const chatInput = document.querySelector<HTMLInputElement>('[data-chat-input]');
        chatInput?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---- Handle AI revision (from ChatGPT-style chat bar) ----
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
        // Show diff first — NEVER auto-apply
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

  // ---- Accept diff ----
  const handleAcceptDiff = useCallback(() => {
    // The resume is already updated — just clear the diff overlay
    setPendingDiff(null);
  }, []);

  // ---- Reject diff ----
  const handleRejectDiff = useCallback(() => {
    if (pendingDiff) {
      // Restore the exact snapshot taken before the AI revision was applied.
      // Using undo() here would be fragile — if the user made other edits
      // while the diff overlay was showing, undo() would revert the wrong change.
      setResume(pendingDiff.originalResume);
    }
    setPendingDiff(null);
  }, [pendingDiff, setResume]);

  // ---- Export handler ----
  const handleExport = useCallback(async (format: ExportFormat) => {
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

  // Register Chiko resume manifest with export ref
  const exportRef = useRef<((format: string) => Promise<void>) | null>(null);
  exportRef.current = handleExport as (format: string) => Promise<void>;
  useChikoActions(() => createResumeManifest({ onExportRef: exportRef }));

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <EditorToolbar onExport={handleExport} />

      <div className="flex-1 min-h-0 relative">
        <Group
          orientation="horizontal"
          id="resume-editor"
          defaultLayout={{ "sections": 20, "preview": 60, "design": 20 }}
          className="h-full"
        >
          {/* Left Panel — Section Forms */}
          <Panel
            id="sections"
            collapsible
            collapsedSize="0"
            minSize="15"
            maxSize="40"
            panelRef={leftPanelRef}
          >
            <EditorSectionsPanel onCollapse={toggleLeftPanel} />
          </Panel>

          <Separator className="group relative flex w-1.5 items-center justify-center transition-colors hover:bg-primary-500/10 active:bg-primary-500/20 data-[separator=hover]:bg-primary-500/10 data-[separator=active]:bg-primary-500/20">
            <div className="h-8 w-0.5 rounded-full bg-gray-700 transition-colors group-hover:bg-primary-500/60 group-active:bg-primary-500" />
          </Separator>

          {/* Center Panel — Live Preview */}
          <Panel
            id="preview"
            minSize="25"
          >
            <EditorPreviewPanel
              pendingDiff={pendingDiff}
              onAcceptDiff={handleAcceptDiff}
              onRejectDiff={handleRejectDiff}
            />
          </Panel>

          <Separator className="group relative flex w-1.5 items-center justify-center transition-colors hover:bg-primary-500/10 active:bg-primary-500/20 data-[separator=hover]:bg-primary-500/10 data-[separator=active]:bg-primary-500/20">
            <div className="h-8 w-0.5 rounded-full bg-gray-700 transition-colors group-hover:bg-primary-500/60 group-active:bg-primary-500" />
          </Separator>

          {/* Right Panel — Design */}
          <Panel
            id="design"
            collapsible
            collapsedSize="0"
            minSize="15"
            maxSize="40"
            panelRef={rightPanelRef}
          >
            <EditorDesignPanel onCollapse={toggleRightPanel} />
          </Panel>
        </Group>

        {/* ChatGPT-style AI chat bar — floating at bottom center */}
        <AIChatBar onExecute={handleAIRevision} />
      </div>
    </div>
  );
}
