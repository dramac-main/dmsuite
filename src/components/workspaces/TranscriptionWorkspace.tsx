"use client";

import { useState, useRef } from "react";
import { IconFileText, IconLoader, IconDownload, IconPlus, IconCheck, IconGlobe } from "@/components/icons";

type TimestampGranularity = "sentence" | "word";

interface TranscriptLine {
  id: string;
  timestamp: string;
  speaker: string;
  text: string;
  confidence: number;
}

const LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "bem", label: "Bemba" },
  { value: "nya", label: "Nyanja" },
  { value: "toi", label: "Tonga" },
  { value: "loz", label: "Lozi" },
  { value: "fr", label: "French" },
  { value: "pt", label: "Portuguese" },
  { value: "es", label: "Spanish" },
  { value: "sw", label: "Swahili" },
];

const EXPORT_FORMATS = [
  { id: "txt", label: "TXT" },
  { id: "srt", label: "SRT" },
  { id: "vtt", label: "VTT" },
  { id: "docx", label: "DOCX" },
  { id: "json", label: "JSON" },
];

export default function TranscriptionWorkspace() {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [language, setLanguage] = useState("auto");
  const [diarization, setDiarization] = useState(true);
  const [granularity, setGranularity] = useState<TimestampGranularity>("sentence");
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptProgress, setTranscriptProgress] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("settings");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      setUploadedFile(f.name);
      setTranscript([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setUploadedFile(f.name);
      setTranscript([]);
    }
  };

  const startTranscription = () => {
    if (!uploadedFile) return;
    setTranscribing(true);
    setTranscriptProgress(0);
    setTranscript([]);

    const sampleLines: Omit<TranscriptLine, "id">[] = [
      { timestamp: "00:00:01", speaker: "Speaker 1", text: "Welcome to today's session. We're going to discuss the latest updates to the platform.", confidence: 0.97 },
      { timestamp: "00:00:08", speaker: "Speaker 2", text: "Thanks for having me. I'm excited to share what we've been working on.", confidence: 0.94 },
      { timestamp: "00:00:14", speaker: "Speaker 1", text: "Let's start with the design tools. Can you walk us through the new features?", confidence: 0.92 },
      { timestamp: "00:00:22", speaker: "Speaker 2", text: "Absolutely. We've added AI-powered suggestions for color palettes and typography.", confidence: 0.89 },
      { timestamp: "00:00:30", speaker: "Speaker 2", text: "The brand identity generator now supports export to multiple formats including PDF.", confidence: 0.95 },
      { timestamp: "00:00:38", speaker: "Speaker 1", text: "That sounds great. What about the audio and video production tools?", confidence: 0.91 },
      { timestamp: "00:00:44", speaker: "Speaker 2", text: "We now have a full podcast suite with recording, editing, and distribution features.", confidence: 0.88 },
      { timestamp: "00:00:52", speaker: "Speaker 1", text: "Excellent. Let's dive deeper into each one. Starting with the music generator.", confidence: 0.93 },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index >= sampleLines.length) {
        clearInterval(interval);
        setTranscribing(false);
        setTranscriptProgress(100);
        return;
      }
      setTranscript((prev) => [
        ...prev,
        { ...sampleLines[index], id: Date.now().toString() + index },
      ]);
      setTranscriptProgress(Math.round(((index + 1) / sampleLines.length) * 100));
      index++;
    }, 800);
  };

  const updateTranscriptText = (id: string, newText: string) => {
    setTranscript((prev) =>
      prev.map((line) => (line.id === id ? { ...line, text: newText } : line))
    );
    setEditingId(null);
  };

  const filteredTranscript = searchQuery.trim()
    ? transcript.filter(
        (line) =>
          line.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          line.speaker.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transcript;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return "text-success";
    if (confidence >= 0.85) return "text-warning";
    return "text-error";
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
          {/* Upload */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconFileText className="size-4 text-primary-500" />
              Audio / Video File
            </h3>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary-500 bg-primary-500/5"
                  : "border-gray-300 dark:border-gray-600 hover:border-primary-500/50"
              }`}
            >
              <IconPlus className="size-6 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400">
                Drag & drop audio/video file or click to browse
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                MP3, WAV, M4A, MP4, MOV, WEBM
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            {uploadedFile && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <IconFileText className="size-3 text-primary-500 shrink-0" />
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">
                  {uploadedFile}
                </span>
                <IconCheck className="size-3 text-success" />
              </div>
            )}
          </div>

          {/* Language */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconGlobe className="size-4 text-primary-500" />
              Language
            </h3>
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
          </div>

          {/* Options */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Options</h3>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-300 block">
                  Speaker Diarization
                </span>
                <span className="text-[10px] text-gray-400">Identify different speakers</span>
              </div>
              <button
                onClick={() => setDiarization(!diarization)}
                className={`w-9 h-5 rounded-full transition-colors ${
                  diarization ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    diarization ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <label className="block text-xs text-gray-400">Timestamp Granularity</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["sentence", "word"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium capitalize ${
                    granularity === g
                      ? "bg-primary-500 text-gray-950"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Transcribe */}
          <button
            onClick={startTranscription}
            disabled={!uploadedFile || transcribing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50"
          >
            {transcribing ? (
              <>
                <IconLoader className="size-4 animate-spin" />
                Transcribing… {transcriptProgress}%
              </>
            ) : (
              <>
                <IconFileText className="size-4" />
                Start Transcription
              </>
            )}
          </button>

          {/* Progress */}
          {(transcribing || transcriptProgress === 100) && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-300">Progress</span>
                <span className="text-xs font-medium text-primary-500">
                  {transcriptProgress}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{ width: `${transcriptProgress}%` }}
                />
              </div>
              {transcriptProgress === 100 && (
                <p className="text-[10px] text-success font-medium">
                  ✓ Transcription complete • {transcript.length} segments
                </p>
              )}
            </div>
          )}

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {EXPORT_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  disabled={transcript.length === 0}
                  className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <IconDownload className="size-3" />
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div
          className={`flex-1 min-w-0 space-y-4 ${
            mobileTab !== "content" ? "hidden md:block" : ""
          }`}
        >
          {/* Search */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                placeholder="Search transcript…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {filteredTranscript.length} match{filteredTranscript.length !== 1 ? "es" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Transcript */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Transcript
              </h3>
              {transcript.length > 0 && (
                <span className="text-[10px] text-gray-400">
                  {transcript.length} segments • Click to edit
                </span>
              )}
            </div>

            {transcript.length === 0 ? (
              <div className="text-center py-12">
                <IconFileText className="size-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  {transcribing
                    ? "Transcribing audio…"
                    : "Upload a file and start transcription"}
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filteredTranscript.map((line) => (
                  <div
                    key={line.id}
                    className="group flex gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {/* Timestamp */}
                    <span className="text-[10px] text-gray-400 font-mono tabular-nums whitespace-nowrap pt-0.5">
                      {line.timestamp}
                    </span>

                    {/* Speaker */}
                    {diarization && (
                      <span className="text-[10px] font-semibold text-info whitespace-nowrap pt-0.5">
                        {line.speaker}
                      </span>
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      {editingId === line.id ? (
                        <textarea
                          className="w-full rounded border border-primary-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white resize-none"
                          rows={2}
                          defaultValue={line.text}
                          autoFocus
                          onBlur={(e) => updateTranscriptText(line.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              updateTranscriptText(line.id, e.currentTarget.value);
                            }
                          }}
                        />
                      ) : (
                        <p
                          className="text-xs text-gray-600 dark:text-gray-300 cursor-pointer"
                          onClick={() => setEditingId(line.id)}
                        >
                          {searchQuery.trim()
                            ? line.text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")).map((part, i) =>
                                part.toLowerCase() === searchQuery.toLowerCase() ? (
                                  <mark key={i} className="bg-warning/30 text-gray-900 dark:text-white rounded px-0.5">
                                    {part}
                                  </mark>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )
                            : line.text}
                        </p>
                      )}
                    </div>

                    {/* Confidence */}
                    <span
                      className={`text-[10px] font-medium tabular-nums whitespace-nowrap pt-0.5 ${getConfidenceColor(
                        line.confidence
                      )}`}
                    >
                      {Math.round(line.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          {transcript.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                  {transcript.length} segments
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                  {LANGUAGES.find((l) => l.value === language)?.label || "Auto"}
                </span>
                {diarization && (
                  <span className="px-2 py-0.5 rounded-full bg-success/15 text-success">
                    Speaker ID
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 capitalize">
                  {granularity} timestamps
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                  Avg confidence:{" "}
                  {transcript.length > 0
                    ? Math.round(
                        (transcript.reduce((s, l) => s + l.confidence, 0) / transcript.length) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
