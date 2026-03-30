"use client";

import { useState } from "react";
import { useAudioTranscriptionEditor } from "@/stores/audio-transcription-editor";
import {
  AccordionSection,
  FormSelect,
  Toggle,
} from "@/components/workspaces/shared/WorkspaceUIKit";

/* ── Language options ────────────────────────────────────────── */

const LANGUAGE_OPTIONS = [
  { value: "auto", label: "Auto-Detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "nl", label: "Dutch" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
  { value: "sw", label: "Swahili" },
  { value: "ru", label: "Russian" },
  { value: "tr", label: "Turkish" },
  { value: "pl", label: "Polish" },
];

const EXPORT_FORMAT_OPTIONS = [
  { value: "txt", label: "Plain Text (.txt)" },
  { value: "srt", label: "SRT Subtitles (.srt)" },
  { value: "vtt", label: "VTT Subtitles (.vtt)" },
  { value: "json", label: "JSON (.json)" },
];

/* ── Props ───────────────────────────────────────────────────── */

interface TranscriptionSettingsPanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

/* ── Component ───────────────────────────────────────────────── */

export default function TranscriptionSettingsPanel({
  collapsed,
  onToggle,
}: TranscriptionSettingsPanelProps) {
  const settings = useAudioTranscriptionEditor((s) => s.form.settings);
  const updateSettings = useAudioTranscriptionEditor((s) => s.updateSettings);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    language: true,
    display: true,
    export: true,
  });

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ── Collapsed state ─────────────────────────────────────── */

  if (collapsed) {
    return (
      <div
        onClick={onToggle}
        className="w-8 shrink-0 border-l border-gray-800/40 bg-gray-900/20 flex flex-col items-center pt-4 cursor-pointer hover:bg-gray-800/20 transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-3.5 h-3.5 text-gray-500 mb-2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
        <span className="text-[9px] text-gray-600 [writing-mode:vertical-rl] rotate-180 tracking-widest uppercase font-medium">
          Settings
        </span>
      </div>
    );
  }

  /* ── Expanded state ──────────────────────────────────────── */

  return (
    <div className="w-64 shrink-0 border-l border-gray-800/40 bg-gray-900/20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-gray-800/40">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Settings
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          title="Collapse panel"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-3.5 h-3.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Language */}
        <AccordionSection
          title="Language"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-3.5 h-3.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          }
          isOpen={openSections.language ?? false}
          onToggle={() => toggle("language")}
        >
          <div className="px-4 pb-4 space-y-3">
            <FormSelect
              label="Audio Language"
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
            <Toggle
              label="Translate to English"
              description="Transcribe any language directly to English"
              checked={settings.translateToEnglish}
              onChange={(v) => updateSettings({ translateToEnglish: v })}
            />
          </div>
        </AccordionSection>

        {/* Display */}
        <AccordionSection
          title="Display"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-3.5 h-3.5"
            >
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
          }
          isOpen={openSections.display ?? false}
          onToggle={() => toggle("display")}
        >
          <div className="px-4 pb-4 space-y-3">
            <Toggle
              label="Show Timestamps"
              description="Display time markers alongside transcript"
              checked={settings.showTimestamps}
              onChange={(v) => updateSettings({ showTimestamps: v })}
            />
          </div>
        </AccordionSection>

        {/* Export */}
        <AccordionSection
          title="Export"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-3.5 h-3.5"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          }
          isOpen={openSections.export ?? false}
          onToggle={() => toggle("export")}
        >
          <div className="px-4 pb-4 space-y-3">
            <FormSelect
              label="Default Format"
              value={settings.exportFormat}
              onChange={(e) =>
                updateSettings({
                  exportFormat: e.target.value as "txt" | "srt" | "vtt" | "json" | "docx" | "pdf",
                })
              }
            >
              {EXPORT_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}
