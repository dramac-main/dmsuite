"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useVoiceFlowEditor, type TranscriptEntry } from "@/stores/voice-flow-editor";
import {
  WorkspaceHeader,
  EditorTabNav,
  BottomBar,
  ActionButton,
  ConfirmDialog,
  WorkspaceErrorBoundary,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import { MILESTONE_EDIT_THRESHOLD } from "@/lib/workspace-constants";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createVoiceFlowManifest } from "@/lib/chiko/manifests/voice-flow";

import VoiceFlowRecorder from "./VoiceFlowRecorder";
import VoiceFlowTranscriptEditor from "./VoiceFlowTranscriptEditor";
import VoiceFlowSettingsPanel from "./VoiceFlowSettingsPanel";
import VoiceFlowHistoryTab from "./tabs/VoiceFlowHistoryTab";
import VoiceFlowSettingsTab from "./tabs/VoiceFlowSettingsTab";

import type { EditorTab } from "@/components/workspaces/shared/WorkspaceUIKit";

/* ── Editor Tabs ─────────────────────────────────────────────── */

const EDITOR_TABS: EditorTab[] = [
  {
    key: "history",
    label: "History",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
        <polyline points="12 8 12 12 14 14" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

/* ── Component ───────────────────────────────────────────────── */

export default function VoiceFlowWorkspace() {
  const isRecording = useVoiceFlowEditor((s) => s.isRecording);
  const settings = useVoiceFlowEditor((s) => s.form.settings);
  const transcripts = useVoiceFlowEditor((s) => s.form.transcripts);
  const addTranscript = useVoiceFlowEditor((s) => s.addTranscript);
  const updateTranscript = useVoiceFlowEditor((s) => s.updateTranscript);
  const resetForm = useVoiceFlowEditor((s) => s.resetForm);

  const [activeTab, setActiveTab] = useState<string>("history");
  const [settingsPanelCollapsed, setSettingsPanelCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState<"recorder" | "transcript" | "settings">("recorder");
  const [confirmReset, setConfirmReset] = useState(false);

  const editCountRef = useRef(0);

  /* ── Chiko manifest ────────────────────────────────────────── */

  const chikoOnCopyRef = useRef<(() => void) | null>(null);

  const handleCopyToClipboard = useCallback(async () => {
    const state = useVoiceFlowEditor.getState();
    const entry = state.form.transcripts.find(
      (t) => t.id === state.form.activeTranscriptId
    );
    if (entry) {
      const text = entry.editedTranscript || entry.cleanedTranscript || entry.rawTranscript;
      await navigator.clipboard.writeText(text).catch(() => {});
    }
  }, []);

  useEffect(() => {
    chikoOnCopyRef.current = handleCopyToClipboard;
  }, [handleCopyToClipboard]);

  useChikoActions(() => createVoiceFlowManifest({ onPrintRef: chikoOnCopyRef }));

  /* ── Workspace events ──────────────────────────────────────── */

  useEffect(() => {
    if (transcripts.length > 0) {
      dispatchProgress("input");
    }
    if (transcripts.some((t) => t.status === "ready")) {
      dispatchProgress("content");
    }
  }, [transcripts]);

  useEffect(() => {
    editCountRef.current++;
    if (editCountRef.current >= MILESTONE_EDIT_THRESHOLD) {
      dispatchProgress("edited");
    }
  }, [transcripts]);

  /* ── Recording complete handler ────────────────────────────── */

  const handleRecordingComplete = useCallback(
    async (file: File, duration: number) => {
      const entryId = crypto.randomUUID();
      const now = new Date().toISOString();

      const newEntry: TranscriptEntry = {
        id: entryId,
        rawTranscript: "",
        cleanedTranscript: "",
        editedTranscript: "",
        tone: settings.tone,
        language: settings.language,
        duration,
        creditsUsed: 0,
        createdAt: now,
        status: "transcribing",
        errorMessage: null,
      };

      addTranscript(newEntry);
      dispatchDirty();

      try {
        /* ── Stage 1: Transcribe ─────────────────────────────── */
        const formData = new FormData();
        formData.append("file", file);
        if (settings.language && settings.language !== "auto") {
          formData.append("language", settings.language);
        }

        const transcribeRes = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!transcribeRes.ok) {
          const err = await transcribeRes.json().catch(() => ({ error: "Transcription failed" }));
          updateTranscript(entryId, {
            status: "error",
            errorMessage: err.error || "Transcription failed",
          });
          return;
        }

        const transcribeData = await transcribeRes.json();
        const rawTranscript = transcribeData.transcript || "";
        const creditsUsed = transcribeData.creditsUsed || 0;

        if (!rawTranscript) {
          updateTranscript(entryId, {
            status: "ready",
            rawTranscript: "",
            cleanedTranscript: "",
            editedTranscript: "",
            creditsUsed,
            errorMessage: "No speech detected",
          });
          return;
        }

        /* ── Stage 2: Post-process ───────────────────────────── */
        if (settings.autoPostProcess) {
          updateTranscript(entryId, {
            rawTranscript,
            creditsUsed,
            status: "post-processing",
          });

          const postRes = await fetch("/api/voice/post-process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript: rawTranscript,
              context: settings.context,
              tone: settings.tone,
              vocabulary: settings.customVocabulary,
              language: settings.language,
            }),
          });

          if (!postRes.ok) {
            // Post-processing failed — still show raw transcript
            updateTranscript(entryId, {
              status: "ready",
              cleanedTranscript: rawTranscript,
              editedTranscript: rawTranscript,
            });
          } else {
            const postData = await postRes.json();
            const cleaned = postData.cleaned || rawTranscript;
            updateTranscript(entryId, {
              status: "ready",
              cleanedTranscript: cleaned,
              editedTranscript: cleaned,
            });
          }
        } else {
          // No post-processing — use raw directly
          updateTranscript(entryId, {
            status: "ready",
            rawTranscript,
            cleanedTranscript: rawTranscript,
            editedTranscript: rawTranscript,
            creditsUsed,
          });
        }

        dispatchProgress("content");

        /* ── Auto-copy ───────────────────────────────────────── */
        if (settings.autoCopyToClipboard) {
          const state = useVoiceFlowEditor.getState();
          const entry = state.form.transcripts.find((t) => t.id === entryId);
          if (entry) {
            const text = entry.editedTranscript || entry.cleanedTranscript || entry.rawTranscript;
            await navigator.clipboard.writeText(text).catch(() => {});
          }
        }
      } catch {
        updateTranscript(entryId, {
          status: "error",
          errorMessage: "An unexpected error occurred",
        });
      }
    },
    [settings, addTranscript, updateTranscript]
  );

  /* ── Keyboard shortcuts ────────────────────────────────────── */

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useVoiceFlowEditor.temporal.getState().undo();
      }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        useVoiceFlowEditor.temporal.getState().redo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* ── Render ────────────────────────────────────────────────── */

  const { undo, redo, pastStates, futureStates } = useVoiceFlowEditor.temporal.getState();
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Left Panel — Recording & History ─────────────────── */}
      <div
        className={`lg:w-80 xl:w-96 shrink-0 border-r border-gray-800/40 flex flex-col bg-gray-900/20 ${
          mobileView !== "recorder" ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Header */}
        <WorkspaceHeader title="VoiceFlow" subtitle="3 credits per use">
          <button
            type="button"
            onClick={() => undo()}
            disabled={!canUndo}
            className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => redo()}
            disabled={!canRedo}
            className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" />
            </svg>
          </button>
        </WorkspaceHeader>

        {/* Recorder */}
        <VoiceFlowRecorder onRecordingComplete={handleRecordingComplete} />

        {/* Tabs */}
        <EditorTabNav
          tabs={EDITOR_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <WorkspaceErrorBoundary>
            {activeTab === "history" && <VoiceFlowHistoryTab />}
            {activeTab === "settings" && <VoiceFlowSettingsTab />}
          </WorkspaceErrorBoundary>

          {/* Start Over */}
          <div className="p-4 border-t border-gray-800/30">
            <ActionButton
              variant="danger"
              size="sm"
              onClick={() => setConfirmReset(true)}
              className="w-full"
            >
              Start Over
            </ActionButton>
          </div>
        </div>
      </div>

      {/* ── Center Panel — Transcript Editor ─────────────────── */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          mobileView !== "transcript" ? "hidden lg:flex" : "flex"
        }`}
      >
        <VoiceFlowTranscriptEditor />
      </div>

      {/* ── Right Panel — Settings (desktop only) ────────────── */}
      <div className="hidden lg:flex">
        <VoiceFlowSettingsPanel
          collapsed={settingsPanelCollapsed}
          onToggle={() => setSettingsPanelCollapsed(!settingsPanelCollapsed)}
        />
      </div>

      {/* ── Mobile settings view ─────────────────────────────── */}
      {mobileView === "settings" && (
        <div className="flex-1 flex flex-col lg:hidden overflow-y-auto">
          <VoiceFlowSettingsTab />
        </div>
      )}

      {/* ── Mobile Bottom Bar ────────────────────────────────── */}
      <BottomBar
        actions={[
          {
            key: "recorder",
            label: isRecording ? "Stop" : "Record",
            icon: isRecording ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
            ),
            primary: true,
          },
          {
            key: "transcript",
            label: "Text",
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            ),
          },
          {
            key: "settings",
            label: "Settings",
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            ),
          },
        ]}
        activeKey={mobileView}
        onAction={(key) => {
          if (key === "recorder") {
            setMobileView("recorder");
          } else {
            setMobileView(key as "transcript" | "settings");
          }
        }}
      />

      {/* ── Confirm Reset Dialog ─────────────────────────────── */}
      <ConfirmDialog
        open={confirmReset}
        title="Start Over"
        description="This will clear all transcripts, history, and settings. This action cannot be undone."
        variant="danger"
        onConfirm={() => {
          resetForm();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
