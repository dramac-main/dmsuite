"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";

// ━━━ Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ToneOption =
  | "natural"
  | "professional"
  | "casual"
  | "technical"
  | "academic"
  | "creative";

export type TranscriptStatus =
  | "recording"
  | "transcribing"
  | "post-processing"
  | "ready"
  | "error";

export type RecordingMode = "hold" | "tap";

export interface TranscriptEntry {
  id: string;
  rawTranscript: string;
  cleanedTranscript: string;
  editedTranscript: string;
  tone: ToneOption;
  language: string;
  duration: number;
  creditsUsed: number;
  createdAt: string;
  status: TranscriptStatus;
  errorMessage: string | null;
}

export interface VoiceFlowSettings {
  tone: ToneOption;
  language: string;
  autoPostProcess: boolean;
  autoCopyToClipboard: boolean;
  customVocabulary: string;
  context: string;
  showRawTranscript: boolean;
  recordingMode: RecordingMode;
}

export interface VoiceFlowFormData {
  transcripts: TranscriptEntry[];
  activeTranscriptId: string | null;
  settings: VoiceFlowSettings;
}

interface VoiceFlowEditorState {
  form: VoiceFlowFormData;

  // ── Ephemeral UI state (NOT persisted, NOT tracked by undo) ──
  isRecording: boolean;
  recordingDuration: number;

  // ── Actions ──
  addTranscript: (entry: TranscriptEntry) => void;
  updateTranscript: (id: string, patch: Partial<TranscriptEntry>) => void;
  removeTranscript: (id: string) => void;
  setActiveTranscript: (id: string | null) => void;
  updateSettings: (patch: Partial<VoiceFlowSettings>) => void;
  setRecording: (isRecording: boolean) => void;
  setRecordingDuration: (seconds: number) => void;
  clearHistory: () => void;
  resetForm: () => void;
  setForm: (data: VoiceFlowFormData) => void;
}

// ━━━ Defaults ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createDefaultForm(): VoiceFlowFormData {
  return {
    transcripts: [],
    activeTranscriptId: null,
    settings: {
      tone: "natural",
      language: "en",
      autoPostProcess: true,
      autoCopyToClipboard: false,
      customVocabulary: "",
      context: "",
      showRawTranscript: false,
      recordingMode: "hold",
    },
  };
}

// ━━━ Store ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const useVoiceFlowEditor = create<VoiceFlowEditorState>()(
  temporal(
    persist(
      immer<VoiceFlowEditorState>((set) => ({
        form: createDefaultForm(),
        isRecording: false,
        recordingDuration: 0,

        addTranscript: (entry) =>
          set((state) => {
            state.form.transcripts.unshift(entry);
            state.form.activeTranscriptId = entry.id;
          }),

        updateTranscript: (id, patch) =>
          set((state) => {
            const idx = state.form.transcripts.findIndex((t) => t.id === id);
            if (idx !== -1) {
              Object.assign(state.form.transcripts[idx], patch);
            }
          }),

        removeTranscript: (id) =>
          set((state) => {
            state.form.transcripts = state.form.transcripts.filter(
              (t) => t.id !== id
            );
            if (state.form.activeTranscriptId === id) {
              state.form.activeTranscriptId =
                state.form.transcripts[0]?.id ?? null;
            }
          }),

        setActiveTranscript: (id) =>
          set((state) => {
            state.form.activeTranscriptId = id;
          }),

        updateSettings: (patch) =>
          set((state) => {
            Object.assign(state.form.settings, patch);
          }),

        setRecording: (isRecording) =>
          set((state) => {
            state.isRecording = isRecording;
          }),

        setRecordingDuration: (seconds) =>
          set((state) => {
            state.recordingDuration = seconds;
          }),

        clearHistory: () =>
          set((state) => {
            state.form.transcripts = [];
            state.form.activeTranscriptId = null;
          }),

        resetForm: () =>
          set((state) => {
            state.form = createDefaultForm();
            state.isRecording = false;
            state.recordingDuration = 0;
          }),

        setForm: (data) =>
          set((state) => {
            state.form = data;
          }),
      })),
      {
        name: "dmsuite-voice-flow",
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ form: s.form }),
      }
    ),
    {
      partialize: (s) => ({ form: s.form }),
    }
  )
);
