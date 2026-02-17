"use client";

import { useState, useRef } from "react";
import { IconMic, IconLoader, IconPlay, IconDownload, IconPlus, IconTrash, IconCheck } from "@/components/icons";

type Quality = "draft" | "standard" | "high";

interface AudioSample {
  id: string;
  name: string;
  duration: number;
  size: number;
}

export default function VoiceClonerWorkspace() {
  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [quality, setQuality] = useState<Quality>("standard");
  const [trainingProgress, setTrainingProgress] = useState<number | null>(null);
  const [synthesisText, setSynthesisText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [cloneReady, setCloneReady] = useState(false);
  const [playingOriginal, setPlayingOriginal] = useState(false);
  const [playingCloned, setPlayingCloned] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("settings");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("audio/")
    );
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const addFiles = (files: File[]) => {
    const newSamples: AudioSample[] = files.map((f) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: f.name,
      duration: Math.round(Math.random() * 60 + 10),
      size: f.size,
    }));
    setSamples((prev) => [...prev, ...newSamples]);
  };

  const removeSample = (id: string) => {
    setSamples((prev) => prev.filter((s) => s.id !== id));
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const startTraining = () => {
    setTrainingProgress(0);
    const interval = setInterval(() => {
      setTrainingProgress((p) => {
        if (p === null || p >= 100) {
          clearInterval(interval);
          setCloneReady(true);
          return 100;
        }
        return p + 2;
      });
    }, 200);
  };

  const totalDuration = samples.reduce((s, a) => s + a.duration, 0);

  return (
    <div>
      {/* Safety Disclaimer */}
      <div className="mb-4 p-3 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-2">
        <span className="text-warning text-lg mt-0.5">⚠</span>
        <div>
          <p className="text-xs font-semibold text-warning">Voice Cloning Ethics & Safety</p>
          <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">
            Only clone voices you own or have explicit permission to use. Unauthorized voice
            cloning may violate local laws. Generated content is watermarked for traceability.
          </p>
        </div>
      </div>

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
          {/* Upload Zone */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconMic className="size-4 text-primary-500" />
              Voice Samples
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
                Drag & drop audio files or click to browse
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                WAV, MP3, M4A • Min 30s total recommended
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Sample list */}
            {samples.length > 0 && (
              <div className="space-y-2">
                {samples.map((sample) => (
                  <div
                    key={sample.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <IconMic className="size-3 text-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 dark:text-white truncate">
                        {sample.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatDuration(sample.duration)} • {formatSize(sample.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeSample(sample.id)}
                      className="text-gray-400 hover:text-error"
                    >
                      <IconTrash className="size-3" />
                    </button>
                  </div>
                ))}
                <div className="text-[10px] text-gray-400 text-center">
                  {samples.length} sample{samples.length !== 1 ? "s" : ""} •{" "}
                  {formatDuration(totalDuration)} total
                </div>
              </div>
            )}
          </div>

          {/* Quality */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quality</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {(["draft", "standard", "high"] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium capitalize ${
                    quality === q
                      ? "bg-primary-500 text-gray-950"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Train Button */}
          <button
            onClick={startTraining}
            disabled={samples.length === 0 || (trainingProgress !== null && trainingProgress < 100)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50"
          >
            {trainingProgress !== null && trainingProgress < 100 ? (
              <>
                <IconLoader className="size-4 animate-spin" />
                Training… {trainingProgress}%
              </>
            ) : cloneReady ? (
              <>
                <IconCheck className="size-4" />
                Retrain Clone
              </>
            ) : (
              <>
                <IconMic className="size-4" />
                Start Training
              </>
            )}
          </button>

          {/* Training Progress */}
          {trainingProgress !== null && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-300">Training Progress</span>
                <span className="text-xs font-medium text-primary-500">{trainingProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
              {trainingProgress === 100 && (
                <p className="text-[10px] text-success font-medium">
                  ✓ Voice clone ready
                </p>
              )}
            </div>
          )}

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!cloneReady || !synthesisText.trim()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <IconDownload className="size-3" />
                MP3
              </button>
              <button
                disabled={!cloneReady || !synthesisText.trim()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
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
          {/* Synthesis Input */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Synthesize with Cloned Voice
            </h3>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
              rows={6}
              placeholder={
                cloneReady
                  ? "Type text to synthesize with your cloned voice…"
                  : "Upload voice samples and train the model first…"
              }
              disabled={!cloneReady}
              value={synthesisText}
              onChange={(e) => setSynthesisText(e.target.value)}
            />
          </div>

          {/* Voice Comparison */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Voice Comparison
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Original Sample
                </p>
                <div className="h-16 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  {samples.length > 0 ? (
                    <div className="flex items-end gap-0.5 h-full py-2 px-2">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all ${
                            playingOriginal
                              ? "bg-info animate-pulse"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ height: `${20 + Math.sin(i * 0.7) * 40 + Math.random() * 15}%` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400">No samples</p>
                  )}
                </div>
                <button
                  disabled={samples.length === 0}
                  onClick={() => {
                    setPlayingOriginal(true);
                    setTimeout(() => setPlayingOriginal(false), 3000);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <IconPlay className="size-3" />
                  Play Original
                </button>
              </div>

              {/* Cloned */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Cloned Voice
                </p>
                <div className="h-16 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  {cloneReady ? (
                    <div className="flex items-end gap-0.5 h-full py-2 px-2">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all ${
                            playingCloned
                              ? "bg-primary-500 animate-pulse"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          style={{ height: `${20 + Math.sin(i * 0.6) * 35 + Math.random() * 20}%` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400">Not trained</p>
                  )}
                </div>
                <button
                  disabled={!cloneReady}
                  onClick={() => {
                    setPlayingCloned(true);
                    setTimeout(() => setPlayingCloned(false), 3000);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <IconPlay className="size-3" />
                  Play Cloned
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                {samples.length} samples
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                {formatDuration(totalDuration)} total
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                Quality: {quality}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full ${
                  cloneReady ? "bg-success/15 text-success" : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                {cloneReady ? "Clone ready" : "Not trained"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
