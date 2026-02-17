"use client";

import { useState, useRef } from "react";
import { IconHeadphones, IconPlay, IconLoader, IconDownload, IconPlus, IconTrash, IconCheck, IconImage } from "@/components/icons";

type ToolTab = "record" | "edit" | "enhance" | "distribute";
type EQPreset = "voice" | "music" | "interview" | "outdoor";

interface Segment {
  id: string;
  label: string;
  start: number;
  end: number;
}

const PLATFORMS = [
  { id: "spotify", label: "Spotify" },
  { id: "apple", label: "Apple Podcasts" },
  { id: "google", label: "Google Podcasts" },
  { id: "youtube", label: "YouTube" },
];

export default function PodcastToolsWorkspace() {
  const [activeTab, setActiveTab] = useState<ToolTab>("record");
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("settings");

  // Record
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Edit
  const [editFile, setEditFile] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Enhance
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [normalization, setNormalization] = useState(true);
  const [eqPreset, setEqPreset] = useState<EQPreset>("voice");

  // Distribute
  const [rssFeedUrl, setRssFeedUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["spotify", "apple"]);

  // Metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showNotes, setShowNotes] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [season, setSeason] = useState(1);
  const [coverArt, setCoverArt] = useState<string | null>(null);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleRecord = () => {
    if (recording) {
      setRecording(false);
      setPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setRecording(true);
      setPaused(false);
      timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
    }
  };

  const togglePause = () => {
    if (paused) {
      setPaused(false);
      timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
    } else {
      setPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const addSegment = () => {
    setSegments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        label: `Segment ${prev.length + 1}`,
        start: trimStart,
        end: trimEnd,
      },
    ]);
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toolTabs: { id: ToolTab; label: string }[] = [
    { id: "record", label: "Record" },
    { id: "edit", label: "Edit" },
    { id: "enhance", label: "Enhance" },
    { id: "distribute", label: "Distribute" },
  ];

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
          {/* Tool Tabs */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconHeadphones className="size-4 text-primary-500" />
              Podcast Tools
            </h3>
            <div className="grid grid-cols-4 gap-1">
              {toolTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-1.5 py-1.5 rounded-lg text-[10px] font-medium ${
                    activeTab === tab.id
                      ? "bg-primary-500 text-gray-950"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab-specific settings */}
          {activeTab === "record" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recording</h3>
              <div className="text-center py-4">
                <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                  {formatTime(recordTime)}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {recording ? (paused ? "Paused" : "Recording…") : "Ready"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleRecord}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
                    recording
                      ? "bg-error text-white"
                      : "bg-primary-500 text-gray-950"
                  }`}
                >
                  {recording ? "■ Stop" : "● Record"}
                </button>
                {recording && (
                  <button
                    onClick={togglePause}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    {paused ? "▶ Resume" : "⏸ Pause"}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "edit" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Edit Audio</h3>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) setEditFile(f.name);
                }}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
                  isDragging
                    ? "border-primary-500 bg-primary-500/5"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <p className="text-xs text-gray-400">
                  {editFile || "Drop audio file to edit"}
                </p>
              </div>

              <label className="block text-xs text-gray-400">
                Trim Start: {trimStart}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={trimStart}
                onChange={(e) => setTrimStart(parseInt(e.target.value))}
                className="w-full accent-primary-500"
              />

              <label className="block text-xs text-gray-400">
                Trim End: {trimEnd}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={trimEnd}
                onChange={(e) => setTrimEnd(parseInt(e.target.value))}
                className="w-full accent-primary-500"
              />

              <button
                onClick={addSegment}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <IconPlus className="size-3" />
                Add Segment
              </button>

              {segments.length > 0 && (
                <div className="space-y-1.5">
                  {segments.map((seg) => (
                    <div
                      key={seg.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {seg.label} ({seg.start}%–{seg.end}%)
                      </span>
                      <button
                        onClick={() =>
                          setSegments((p) => p.filter((s) => s.id !== seg.id))
                        }
                        className="text-gray-400 hover:text-error"
                      >
                        <IconTrash className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "enhance" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Enhance</h3>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-300">Noise Reduction</span>
                <button
                  onClick={() => setNoiseReduction(!noiseReduction)}
                  className={`w-9 h-5 rounded-full transition-colors ${
                    noiseReduction ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      noiseReduction ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-300">Normalization</span>
                <button
                  onClick={() => setNormalization(!normalization)}
                  className={`w-9 h-5 rounded-full transition-colors ${
                    normalization ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      normalization ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <label className="block text-xs text-gray-400">EQ Preset</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["voice", "music", "interview", "outdoor"] as const).map((eq) => (
                  <button
                    key={eq}
                    onClick={() => setEqPreset(eq)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium capitalize ${
                      eqPreset === eq
                        ? "bg-primary-500 text-gray-950"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "distribute" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Distribution</h3>

              <label className="block text-xs text-gray-400">RSS Feed URL</label>
              <input
                type="url"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                placeholder="https://yourshow.com/feed.xml"
                value={rssFeedUrl}
                onChange={(e) => setRssFeedUrl(e.target.value)}
              />

              <label className="block text-xs text-gray-400">Platforms</label>
              <div className="space-y-1.5">
                {PLATFORMS.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(p.id)}
                      onChange={() => togglePlatform(p.id)}
                      className="rounded accent-primary-500"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {["MP3", "WAV", "M4A"].map((fmt) => (
                <button
                  key={fmt}
                  className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <IconDownload className="size-3" />
                  {fmt}
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
          {/* Waveform / Recording area */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {activeTab === "record" ? "Waveform" : activeTab === "edit" ? "Audio Editor" : activeTab === "enhance" ? "Enhancement Preview" : "Distribution Status"}
            </h3>
            <div className="w-full h-32 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {recording ? (
                <div className="flex items-end gap-0.5 h-full py-3 px-2">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-primary-500 animate-pulse"
                      style={{
                        height: `${20 + Math.sin(i * 0.4 + recordTime) * 30 + Math.random() * 25}%`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  {activeTab === "record"
                    ? "Press Record to start capturing audio"
                    : activeTab === "edit"
                    ? "Upload an audio file to edit"
                    : activeTab === "enhance"
                    ? "Audio enhancement preview"
                    : "Distribution status will appear here"}
                </p>
              )}
            </div>
          </div>

          {/* Episode Metadata */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Episode Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  placeholder="Episode title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Season</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    value={season}
                    onChange={(e) => setSeason(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Episode #</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
                rows={3}
                placeholder="Episode description…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Show Notes</label>
              <textarea
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none font-mono"
                rows={4}
                placeholder="Links, timestamps, references…"
                value={showNotes}
                onChange={(e) => setShowNotes(e.target.value)}
              />
            </div>

            {/* Cover Art */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cover Art</label>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                  {coverArt ? (
                    <img src={coverArt} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <IconImage className="size-6 text-gray-400" />
                  )}
                </div>
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                  <IconPlus className="size-3" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setCoverArt(URL.createObjectURL(f));
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                S{season}E{episodeNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                EQ: {eqPreset}
              </span>
              {noiseReduction && (
                <span className="px-2 py-0.5 rounded-full bg-success/15 text-success">
                  Noise reduction
                </span>
              )}
              {normalization && (
                <span className="px-2 py-0.5 rounded-full bg-success/15 text-success">
                  Normalized
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                {selectedPlatforms.length} platforms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
