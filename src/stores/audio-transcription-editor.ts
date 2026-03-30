"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";

// ━━━ Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type TranscriptionStatus =
  | "uploading"
  | "transcribing"
  | "ready"
  | "error";

export type ExportFormat = "txt" | "srt" | "vtt" | "json" | "docx" | "pdf";

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface TranscriptionEntry {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  language: string;
  detectedLanguage: string;
  translateToEnglish: boolean;
  creditsUsed: number;
  createdAt: string;
  status: TranscriptionStatus;
  errorMessage: string | null;
}

export interface AudioTranscriptionSettings {
  language: string;
  translateToEnglish: boolean;
  showTimestamps: boolean;
  exportFormat: ExportFormat;
}

export interface AudioTranscriptionFormData {
  transcriptions: TranscriptionEntry[];
  activeTranscriptionId: string | null;
  settings: AudioTranscriptionSettings;
}

interface AudioTranscriptionEditorState {
  form: AudioTranscriptionFormData;

  // ── Ephemeral UI state (NOT persisted) ──
  uploadProgress: number;

  // ── Actions ──
  addTranscription: (entry: TranscriptionEntry) => void;
  updateTranscription: (
    id: string,
    patch: Partial<TranscriptionEntry>
  ) => void;
  removeTranscription: (id: string) => void;
  setActiveTranscription: (id: string | null) => void;
  updateSettings: (patch: Partial<AudioTranscriptionSettings>) => void;
  setUploadProgress: (percent: number) => void;
  clearHistory: () => void;
  resetForm: () => void;
  setForm: (data: AudioTranscriptionFormData) => void;
}

// ━━━ Defaults ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createDefaultForm(): AudioTranscriptionFormData {
  return {
    transcriptions: [],
    activeTranscriptionId: null,
    settings: {
      language: "auto",
      translateToEnglish: false,
      showTimestamps: true,
      exportFormat: "txt",
    },
  };
}

// ━━━ Store ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const useAudioTranscriptionEditor =
  create<AudioTranscriptionEditorState>()(
    temporal(
      persist(
        immer<AudioTranscriptionEditorState>((set) => ({
          form: createDefaultForm(),
          uploadProgress: 0,

          addTranscription: (entry) =>
            set((state) => {
              state.form.transcriptions.unshift(entry);
              state.form.activeTranscriptionId = entry.id;
            }),

          updateTranscription: (id, patch) =>
            set((state) => {
              const idx = state.form.transcriptions.findIndex(
                (t) => t.id === id
              );
              if (idx !== -1) {
                Object.assign(state.form.transcriptions[idx], patch);
              }
            }),

          removeTranscription: (id) =>
            set((state) => {
              state.form.transcriptions = state.form.transcriptions.filter(
                (t) => t.id !== id
              );
              if (state.form.activeTranscriptionId === id) {
                state.form.activeTranscriptionId =
                  state.form.transcriptions[0]?.id ?? null;
              }
            }),

          setActiveTranscription: (id) =>
            set((state) => {
              state.form.activeTranscriptionId = id;
            }),

          updateSettings: (patch) =>
            set((state) => {
              Object.assign(state.form.settings, patch);
            }),

          setUploadProgress: (percent) =>
            set((state) => {
              state.uploadProgress = percent;
            }),

          clearHistory: () =>
            set((state) => {
              state.form.transcriptions = [];
              state.form.activeTranscriptionId = null;
            }),

          resetForm: () =>
            set((state) => {
              state.form = createDefaultForm();
              state.uploadProgress = 0;
            }),

          setForm: (data) =>
            set((state) => {
              state.form = data;
            }),
        })),
        {
          name: "dmsuite-audio-transcription",
          storage: createJSONStorage(() => localStorage),
          partialize: (s) => ({ form: s.form }),
        }
      ),
      {
        partialize: (s) => ({ form: s.form }),
      }
    )
  );
