"use client";

import { useState } from "react";
import { IconMic, IconSparkles, IconLoader, IconPlay, IconDownload, IconCheck } from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

type VoiceId = "male-deep" | "male-standard" | "female-warm" | "female-professional" | "child" | "narrator";

interface VoiceOption {
  id: VoiceId;
  label: string;
  description: string;
}

const VOICES: VoiceOption[] = [
  { id: "male-deep", label: "Male Deep", description: "Rich, authoritative tone" },
  { id: "male-standard", label: "Male Standard", description: "Neutral, clear voice" },
  { id: "female-warm", label: "Female Warm", description: "Friendly, approachable" },
  { id: "female-professional", label: "Female Professional", description: "Crisp, articulate" },
  { id: "child", label: "Child", description: "Youthful, energetic" },
  { id: "narrator", label: "Narrator", description: "Storytelling, dramatic" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bem", label: "Bemba" },
  { value: "nya", label: "Nyanja" },
  { value: "toi", label: "Tonga" },
  { value: "loz", label: "Lozi" },
  { value: "fr", label: "French" },
  { value: "pt", label: "Portuguese" },
];

const MAX_CHARS = 5000;

export default function TextToSpeechWorkspace() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<VoiceId>("female-professional");
  const [language, setLanguage] = useState("en");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [emphasis, setEmphasis] = useState(false);
  const [ssmlMode, setSsmlMode] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("settings");

  const generateScript = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a compelling speech script suitable for text-to-speech in ${LANGUAGES.find((l) => l.value === language)?.label || "English"}. Topic: general greeting and introduction. Keep it under 500 words. Return just the script text, no JSON.`,
            },
          ],
        }),
      });
      const raw = await res.text();
      setText(cleanAIText(raw));
    } catch {
      /* ignore */
    }
    setGenerating(false);
  };

  const handlePlay = () => {
    setPlaying(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPlaying(false);
          return 0;
        }
        return p + 2;
      });
    }, 100);
  };

  return (
    <div>
      {/* Mobile tab toggle */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["content", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize ${
              mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Panel */}
        <div
          className={`w-full lg:w-80 shrink-0 overflow-y-auto space-y-4 ${
            mobileTab !== "settings" ? "hidden md:block" : ""
          }`}
        >
          {/* Voice Selector */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconMic className="size-4 text-primary-500" />
              Voice Selection
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoice(v.id)}
                  className={`p-2.5 rounded-lg text-left transition-all ${
                    voice === v.id
                      ? "bg-primary-500/10 border-2 border-primary-500 ring-1 ring-primary-500/30"
                      : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <span className="text-xs font-semibold text-gray-900 dark:text-white block">{v.label}</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">{v.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language & Controls */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Language & Controls</h3>

            <label className="block text-xs text-gray-400">Language</label>
            <select
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>

            <label className="block text-xs text-gray-400">Speed: {speed.toFixed(1)}x</label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>0.5x</span>
              <span>2x</span>
            </div>

            <label className="block text-xs text-gray-400">Pitch: {pitch > 0 ? `+${pitch}` : pitch}</label>
            <input
              type="range"
              min={-10}
              max={10}
              step={1}
              value={pitch}
              onChange={(e) => setPitch(parseInt(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>-10</span>
              <span>+10</span>
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300">Emphasis</span>
              <button
                onClick={() => setEmphasis(!emphasis)}
                className={`w-9 h-5 rounded-full transition-colors ${
                  emphasis ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    emphasis ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300">SSML Mode</span>
              <button
                onClick={() => setSsmlMode(!ssmlMode)}
                className={`w-9 h-5 rounded-full transition-colors ${
                  ssmlMode ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    ssmlMode ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                <IconDownload className="size-3" />
                MP3
              </button>
              <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                <IconDownload className="size-3" />
                WAV
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div
          className={`flex-1 min-w-0 space-y-4 ${
            mobileTab !== "content" ? "hidden md:block" : ""
          }`}
        >
          {/* Text Input */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Input Text</h3>
              <button
                onClick={generateScript}
                disabled={generating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 disabled:opacity-50"
              >
                {generating ? (
                  <IconLoader className="size-3 animate-spin" />
                ) : (
                  <IconSparkles className="size-3" />
                )}
                Generate Script
              </button>
            </div>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none font-mono"
              rows={12}
              maxLength={MAX_CHARS}
              placeholder={
                ssmlMode
                  ? '<speak>\n  <p>Hello, welcome to <emphasis level="strong">DMSuite</emphasis>.</p>\n</speak>'
                  : "Type or paste your text here, or use the AI Generate Script button..."
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
              </span>
              {ssmlMode && (
                <span className="text-[10px] text-info font-medium">SSML mode active</span>
              )}
            </div>
          </div>

          {/* Audio Preview */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Audio Preview</h3>

            {/* Waveform placeholder */}
            <div className="w-full h-20 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {text.trim() ? (
                <div className="flex items-end gap-0.5 h-full py-2">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all ${
                        playing && progress > (i / 60) * 100
                          ? "bg-primary-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                      style={{
                        height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Enter text to preview audio</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlay}
                disabled={!text.trim() || playing}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50"
              >
                <IconPlay className="size-4" />
              </button>
              <div className="flex-1">
                <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-400 tabular-nums w-12 text-right">
                {playing ? `${Math.floor(progress)}%` : "0:00"}
              </span>
            </div>

            {/* Info row */}
            <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                {VOICES.find((v) => v.id === voice)?.label}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                {LANGUAGES.find((l) => l.value === language)?.label}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                {speed.toFixed(1)}x
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                Pitch {pitch > 0 ? `+${pitch}` : pitch}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
