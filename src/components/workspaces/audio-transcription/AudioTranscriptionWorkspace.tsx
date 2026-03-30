"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  useAudioTranscriptionEditor,
  type TranscriptionEntry,
} from "@/stores/audio-transcription-editor";
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
import { createAudioTranscriptionManifest } from "@/lib/chiko/manifests/audio-transcription";

import FileUploadZone from "./FileUploadZone";
import TranscriptViewer from "./TranscriptViewer";
import TranscriptionSettingsPanel from "./TranscriptionSettingsPanel";
import TranscriptionHistoryTab from "./tabs/TranscriptionHistoryTab";
import TranscriptionSettingsTab from "./tabs/TranscriptionSettingsTab";

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

export default function AudioTranscriptionWorkspace() {
  const transcriptions = useAudioTranscriptionEditor((s) => s.form.transcriptions);
  const settings = useAudioTranscriptionEditor((s) => s.form.settings);
  const addTranscription = useAudioTranscriptionEditor((s) => s.addTranscription);
  const updateTranscription = useAudioTranscriptionEditor((s) => s.updateTranscription);
  const setUploadProgress = useAudioTranscriptionEditor((s) => s.setUploadProgress);
  const resetForm = useAudioTranscriptionEditor((s) => s.resetForm);

  const [activeTab, setActiveTab] = useState<string>("history");
  const [settingsPanelCollapsed, setSettingsPanelCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState<"upload" | "transcript" | "settings">("upload");
  const [confirmReset, setConfirmReset] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const editCountRef = useRef(0);

  /* ── Chiko manifest ────────────────────────────────────────── */

  const chikoExportRef = useRef<(() => void) | null>(null);

  const handleCopyToClipboard = useCallback(async () => {
    const state = useAudioTranscriptionEditor.getState();
    const entry = state.form.transcriptions.find(
      (t) => t.id === state.form.activeTranscriptionId
    );
    if (entry) {
      const text =
        entry.segments.length > 0
          ? entry.segments.map((s) => s.text).join("\n")
          : entry.transcript;
      await navigator.clipboard.writeText(text).catch(() => {});
    }
  }, []);

  useEffect(() => {
    chikoExportRef.current = handleCopyToClipboard;
  }, [handleCopyToClipboard]);

  useChikoActions(() => createAudioTranscriptionManifest({ onCopyRef: chikoExportRef }));

  /* ── Workspace events ──────────────────────────────────────── */

  useEffect(() => {
    if (transcriptions.length > 0) {
      dispatchProgress("input");
    }
    if (transcriptions.some((t) => t.status === "ready")) {
      dispatchProgress("content");
    }
  }, [transcriptions]);

  useEffect(() => {
    editCountRef.current++;
    if (editCountRef.current >= MILESTONE_EDIT_THRESHOLD) {
      dispatchProgress("edited");
    }
  }, [transcriptions]);

  /* ── File upload handler ───────────────────────────────────── */

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setIsProcessing(true);

      for (const file of files) {
        const entryId = crypto.randomUUID();
        const now = new Date().toISOString();

        const newEntry: TranscriptionEntry = {
          id: entryId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          transcript: "",
          segments: [],
          duration: 0,
          language: settings.language,
          detectedLanguage: "",
          translateToEnglish: settings.translateToEnglish,
          creditsUsed: 0,
          createdAt: now,
          status: "uploading",
          errorMessage: null,
        };

        addTranscription(newEntry);
        dispatchDirty();

        try {
          /* ── Upload & transcribe ──────────────────────────── */
          setUploadProgress(10);
          updateTranscription(entryId, { status: "uploading" });

          const formData = new FormData();
          formData.append("file", file);
          if (settings.language && settings.language !== "auto") {
            formData.append("language", settings.language);
          }
          if (settings.translateToEnglish) {
            formData.append("translate", "true");
          }

          setUploadProgress(30);
          updateTranscription(entryId, { status: "transcribing" });

          const res = await fetch("/api/audio/transcribe", {
            method: "POST",
            body: formData,
          });

          setUploadProgress(90);

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Transcription failed" }));
            updateTranscription(entryId, {
              status: "error",
              errorMessage: err.error || "Transcription failed",
            });
            continue;
          }

          const data = await res.json();

          updateTranscription(entryId, {
            status: "ready",
            transcript: data.transcript || "",
            segments: (data.segments || []).map(
              (seg: { id: number; start: number; end: number; text: string }) => ({
                id: seg.id,
                start: seg.start,
                end: seg.end,
                text: seg.text,
              })
            ),
            duration: data.duration || 0,
            detectedLanguage: data.language || "",
            creditsUsed: data.creditsUsed || 0,
          });

          setUploadProgress(100);
          dispatchProgress("content");
        } catch {
          updateTranscription(entryId, {
            status: "error",
            errorMessage: "An unexpected error occurred",
          });
        }
      }

      setIsProcessing(false);
      setUploadProgress(0);
    },
    [settings, addTranscription, updateTranscription, setUploadProgress]
  );

  /* ── Keyboard shortcuts ────────────────────────────────────── */

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useAudioTranscriptionEditor.temporal.getState().undo();
      }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        useAudioTranscriptionEditor.temporal.getState().redo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* ── Render ────────────────────────────────────────────────── */

  const { undo, redo, pastStates, futureStates } =
    useAudioTranscriptionEditor.temporal.getState();
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Left Panel — Upload & History ─────────────────────── */}
      <div
        className={`lg:w-80 xl:w-96 shrink-0 border-r border-gray-800/40 flex flex-col bg-gray-900/20 ${
          mobileView !== "upload" ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Header */}
        <WorkspaceHeader title="Audio Transcription" subtitle="5–20 credits per file">
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

        {/* Upload zone */}
        <FileUploadZone onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />

        {/* Tabs */}
        <EditorTabNav
          tabs={EDITOR_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <WorkspaceErrorBoundary>
            {activeTab === "history" && <TranscriptionHistoryTab />}
            {activeTab === "settings" && <TranscriptionSettingsTab />}
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

      {/* ── Center Panel — Transcript Viewer ─────────────────── */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          mobileView !== "transcript" ? "hidden lg:flex" : "flex"
        }`}
      >
        <TranscriptViewer />
      </div>

      {/* ── Right Panel — Settings (desktop only) ────────────── */}
      <div className="hidden lg:flex">
        <TranscriptionSettingsPanel
          collapsed={settingsPanelCollapsed}
          onToggle={() => setSettingsPanelCollapsed(!settingsPanelCollapsed)}
        />
      </div>

      {/* ── Mobile settings view ─────────────────────────────── */}
      {mobileView === "settings" && (
        <div className="flex-1 flex flex-col lg:hidden overflow-y-auto">
          <TranscriptionSettingsTab />
        </div>
      )}

      {/* ── Mobile Bottom Bar ────────────────────────────────── */}
      <BottomBar
        actions={[
          {
            key: "upload",
            label: "Upload",
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
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
        onAction={(key) => setMobileView(key as "upload" | "transcript" | "settings")}
      />

      {/* ── Confirm Reset Dialog ─────────────────────────────── */}
      <ConfirmDialog
        open={confirmReset}
        title="Start Over"
        description="This will clear all transcriptions, history, and settings. This action cannot be undone."
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
