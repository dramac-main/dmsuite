"use client";

import { useState } from "react";
import { useVoiceFlowEditor, type ToneOption } from "@/stores/voice-flow-editor";
import {
  FormTextarea,
  FormSelect,
  ChipGroup,
  Toggle,
  AccordionSection,
} from "@/components/workspaces/shared/WorkspaceUIKit";

/* ── Tone options ────────────────────────────────────────────── */

const TONE_OPTIONS: { value: ToneOption; label: string }[] = [
  { value: "natural", label: "Natural" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "technical", label: "Technical" },
  { value: "academic", label: "Academic" },
  { value: "creative", label: "Creative" },
];

/* ── Language options ────────────────────────────────────────── */

const LANGUAGE_OPTIONS = [
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
  { value: "auto", label: "Auto-detect" },
];

/* ── Props ───────────────────────────────────────────────────── */

interface VoiceFlowSettingsPanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

/* ── Component ───────────────────────────────────────────────── */

export default function VoiceFlowSettingsPanel({
  collapsed,
  onToggle,
}: VoiceFlowSettingsPanelProps) {
  const settings = useVoiceFlowEditor((s) => s.form.settings);
  const updateSettings = useVoiceFlowEditor((s) => s.updateSettings);

  const [contextOpen, setContextOpen] = useState(true);
  const [toneOpen, setToneOpen] = useState(true);
  const [langOpen, setLangOpen] = useState(false);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  /* ── Collapsed state ───────────────────────────────────────── */

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex flex-col items-center justify-center gap-2 h-full w-8 border-l border-gray-800/40 bg-gray-900/20 hover:bg-gray-800/30 transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-4 h-4 text-gray-500"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
        <span className="text-[9px] font-medium text-gray-500 [writing-mode:vertical-lr]">
          Settings
        </span>
      </button>
    );
  }

  /* ── Expanded state ────────────────────────────────────────── */

  return (
    <div className="w-64 border-l border-gray-800/40 bg-gray-900/20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-gray-800/30 shrink-0">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-3.5 h-3.5 text-gray-500"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Settings
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Scrollable settings */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Context */}
        <AccordionSection
          title="Context"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>}
          isOpen={contextOpen}
          onToggle={() => setContextOpen(!contextOpen)}
        >
          <div className="px-3 pb-3">
            <FormTextarea
              value={settings.context}
              onChange={(e) => updateSettings({ context: e.target.value })}
              placeholder="Replying to an email from Sarah about the Q2 report..."
              rows={3}
              hint="Describe what you're working on to improve accuracy"
            />
          </div>
        </AccordionSection>

        {/* Tone */}
        <AccordionSection
          title="Tone"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /></svg>}
          isOpen={toneOpen}
          onToggle={() => setToneOpen(!toneOpen)}
        >
          <div className="px-3 pb-3">
            <ChipGroup
              options={TONE_OPTIONS}
              value={settings.tone}
              onChange={(v) => updateSettings({ tone: v as ToneOption })}
              columns={2}
            />
          </div>
        </AccordionSection>

        {/* Language */}
        <AccordionSection
          title="Language"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>}
          isOpen={langOpen}
          onToggle={() => setLangOpen(!langOpen)}
        >
          <div className="px-3 pb-3">
            <FormSelect
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </div>
        </AccordionSection>

        {/* Custom Vocabulary */}
        <AccordionSection
          title="Custom Vocabulary"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>}
          isOpen={vocabOpen}
          onToggle={() => setVocabOpen(!vocabOpen)}
        >
          <div className="px-3 pb-3">
            <FormTextarea
              value={settings.customVocabulary}
              onChange={(e) =>
                updateSettings({ customVocabulary: e.target.value })
              }
              placeholder="DMSuite, Chiko, Zambia, Kwacha, Flutterwave"
              rows={2}
              hint="Comma-separated terms to ensure correct spelling"
            />
          </div>
        </AccordionSection>

        {/* Preferences */}
        <AccordionSection
          title="Preferences"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>}
          isOpen={prefsOpen}
          onToggle={() => setPrefsOpen(!prefsOpen)}
        >
          <div className="px-3 pb-3 flex flex-col gap-3">
            <Toggle
              checked={settings.autoPostProcess}
              onChange={(v) => updateSettings({ autoPostProcess: v })}
              label="Auto-clean transcript"
              description="Automatically polish text after transcription"
            />
            <Toggle
              checked={settings.autoCopyToClipboard}
              onChange={(v) => updateSettings({ autoCopyToClipboard: v })}
              label="Auto-copy to clipboard"
              description="Copy cleaned text to clipboard when ready"
            />
            <Toggle
              checked={settings.showRawTranscript}
              onChange={(v) => updateSettings({ showRawTranscript: v })}
              label="Show raw transcript"
              description="Show the unprocessed transcript below the editor"
            />
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}
