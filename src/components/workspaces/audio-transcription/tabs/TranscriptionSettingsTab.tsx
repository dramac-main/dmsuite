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
  { value: "sv", label: "Swedish" },
  { value: "da", label: "Danish" },
  { value: "no", label: "Norwegian" },
  { value: "he", label: "Hebrew" },
  { value: "el", label: "Greek" },
  { value: "vi", label: "Vietnamese" },
  { value: "cs", label: "Czech" },
];

const EXPORT_FORMAT_OPTIONS = [
  { value: "txt", label: "Plain Text (.txt)" },
  { value: "srt", label: "SRT Subtitles (.srt)" },
  { value: "vtt", label: "VTT Subtitles (.vtt)" },
  { value: "json", label: "JSON with Timestamps (.json)" },
];

/* ── Component ───────────────────────────────────────────────── */

export default function TranscriptionSettingsTab() {
  const settings = useAudioTranscriptionEditor((s) => s.form.settings);
  const updateSettings = useAudioTranscriptionEditor((s) => s.updateSettings);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    language: true,
    options: true,
    export: false,
  });

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="divide-y divide-gray-800/30">
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
          <div className="pt-1">
            <Toggle
              label="Translate to English"
              description="Transcribe any language directly to English"
              checked={settings.translateToEnglish}
              onChange={(v) => updateSettings({ translateToEnglish: v })}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Options */}
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
        isOpen={openSections.options ?? false}
        onToggle={() => toggle("options")}
      >
        <div className="px-4 pb-4 space-y-3">
          <Toggle
            label="Show Timestamps"
            description="Display time markers alongside transcript segments"
            checked={settings.showTimestamps}
            onChange={(v) => updateSettings({ showTimestamps: v })}
          />
        </div>
      </AccordionSection>

      {/* Export */}
      <AccordionSection
        title="Export Format"
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
  );
}
