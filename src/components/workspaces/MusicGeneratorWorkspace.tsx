"use client";

import { useState } from "react";
import { IconMusic, IconSparkles, IconWand, IconLoader, IconDownload, IconPlay, IconCheck } from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

type Genre = "pop" | "jazz" | "classical" | "electronic" | "african" | "hip-hop" | "rnb" | "ambient" | "rock" | "lo-fi";
type Mood = "happy" | "sad" | "energetic" | "calm" | "dark" | "uplifting" | "romantic" | "epic";

const GENRES: { id: Genre; label: string }[] = [
  { id: "pop", label: "Pop" },
  { id: "jazz", label: "Jazz" },
  { id: "classical", label: "Classical" },
  { id: "electronic", label: "Electronic" },
  { id: "african", label: "African" },
  { id: "hip-hop", label: "Hip-Hop" },
  { id: "rnb", label: "R&B" },
  { id: "ambient", label: "Ambient" },
  { id: "rock", label: "Rock" },
  { id: "lo-fi", label: "Lo-Fi" },
];

const MOODS: { id: Mood; label: string }[] = [
  { id: "happy", label: "Happy" },
  { id: "sad", label: "Sad" },
  { id: "energetic", label: "Energetic" },
  { id: "calm", label: "Calm" },
  { id: "dark", label: "Dark" },
  { id: "uplifting", label: "Uplifting" },
  { id: "romantic", label: "Romantic" },
  { id: "epic", label: "Epic" },
];

const INSTRUMENTS = [
  "Piano", "Guitar", "Drums", "Bass", "Strings", "Synth", "Marimba", "Kalimba",
];

const KEYS = [
  "C major", "C minor", "C# major", "C# minor",
  "D major", "D minor", "D# major", "D# minor",
  "E major", "E minor",
  "F major", "F minor", "F# major", "F# minor",
  "G major", "G minor", "G# major", "G# minor",
  "A major", "A minor", "A# major", "A# minor",
  "B major", "B minor",
];

interface GenerationJob {
  id: string;
  prompt: string;
  genre: Genre;
  mood: Mood;
  status: "queued" | "generating" | "complete" | "error";
  progress: number;
}

export default function MusicGeneratorWorkspace() {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState<Genre>("electronic");
  const [mood, setMood] = useState<Mood>("energetic");
  const [duration, setDuration] = useState(60);
  const [tempo, setTempo] = useState(120);
  const [musicalKey, setMusicalKey] = useState("C major");
  const [instruments, setInstruments] = useState<string[]>(["Piano", "Drums"]);
  const [loading, setLoading] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [playing, setPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("settings");

  const toggleInstrument = (inst: string) => {
    setInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Enhance this music generation prompt for maximum quality. Include genre: ${genre}, mood: ${mood}, instruments: ${instruments.join(", ")}, tempo: ${tempo} BPM, key: ${musicalKey}. Keep it under 100 words. Original: "${prompt}". Return just the enhanced prompt text, no JSON.`,
            },
          ],
        }),
      });
      const raw = await res.text();
      setEnhancedPrompt(cleanAIText(raw));
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  const startGeneration = () => {
    const job: GenerationJob = {
      id: Date.now().toString(),
      prompt: enhancedPrompt || prompt,
      genre,
      mood,
      status: "queued",
      progress: 0,
    };
    setJobs((prev) => [job, ...prev]);
    setTimeout(() => setJobs((p) => p.map((j) => j.id === job.id ? { ...j, status: "generating", progress: 25 } : j)), 1000);
    setTimeout(() => setJobs((p) => p.map((j) => j.id === job.id ? { ...j, progress: 60 } : j)), 3000);
    setTimeout(() => setJobs((p) => p.map((j) => j.id === job.id ? { ...j, progress: 90 } : j)), 5000);
    setTimeout(() => setJobs((p) => p.map((j) => j.id === job.id ? { ...j, status: "complete", progress: 100 } : j)), 7000);
  };

  const handlePlay = () => {
    setPlaying(true);
    setPlayProgress(0);
    const interval = setInterval(() => {
      setPlayProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPlaying(false);
          return 0;
        }
        return p + 1;
      });
    }, 80);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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
          {/* Prompt */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconMusic className="size-4 text-primary-500" />
              Music Description
            </h3>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
              rows={3}
              placeholder="Describe the music you want to create…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={enhancePrompt}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? <IconLoader className="size-3 animate-spin" /> : <IconSparkles className="size-3" />}
              Enhance Prompt
            </button>
            {enhancedPrompt && (
              <div className="p-2 rounded-lg bg-primary-500/5 border border-primary-500/20 text-xs text-gray-600 dark:text-gray-300">
                {enhancedPrompt}
              </div>
            )}
          </div>

          {/* Genre */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Genre</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGenre(g.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium ${
                    genre === g.id
                      ? "bg-primary-500 text-gray-950"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Mood</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium ${
                    mood === m.id
                      ? "bg-primary-500 text-gray-950"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Tempo & Key */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Parameters</h3>

            <label className="block text-xs text-gray-400">
              Duration: {formatDuration(duration)}
            </label>
            <input
              type="range"
              min={15}
              max={300}
              step={5}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>0:15</span>
              <span>5:00</span>
            </div>

            <label className="block text-xs text-gray-400">Tempo: {tempo} BPM</label>
            <input
              type="number"
              min={60}
              max={200}
              value={tempo}
              onChange={(e) => setTempo(Math.min(200, Math.max(60, parseInt(e.target.value) || 60)))}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />

            <label className="block text-xs text-gray-400">Key</label>
            <select
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              value={musicalKey}
              onChange={(e) => setMusicalKey(e.target.value)}
            >
              {KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Instruments */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Instruments</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {INSTRUMENTS.map((inst) => (
                <label
                  key={inst}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={instruments.includes(inst)}
                    onChange={() => toggleInstrument(inst)}
                    className="rounded accent-primary-500"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300">{inst}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={startGeneration}
            disabled={!prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50"
          >
            <IconWand className="size-4" />
            Generate Music
          </button>
        </div>

        {/* Content Area */}
        <div
          className={`flex-1 min-w-0 space-y-4 ${
            mobileTab !== "content" ? "hidden md:block" : ""
          }`}
        >
          {/* Audio Preview */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Audio Preview</h3>

            <div className="w-full h-24 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {jobs.some((j) => j.status === "complete") ? (
                <div className="flex items-end gap-0.5 h-full py-3 px-2">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all ${
                        playing && playProgress > (i / 60) * 100
                          ? "bg-primary-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                      style={{
                        height: `${15 + Math.sin(i * 0.3) * 25 + Math.cos(i * 0.7) * 20 + Math.random() * 10}%`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Generate music to preview</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePlay}
                disabled={!jobs.some((j) => j.status === "complete") || playing}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50"
              >
                <IconPlay className="size-4" />
              </button>
              <div className="flex-1">
                <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all"
                    style={{ width: `${playProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-400 tabular-nums w-12 text-right">
                {formatDuration(duration)}
              </span>
            </div>

            {/* Info */}
            <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 capitalize">{genre}</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 capitalize">{mood}</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">{tempo} BPM</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">{musicalKey}</span>
            </div>

            {/* Export */}
            <div className="flex gap-2">
              <button
                disabled={!jobs.some((j) => j.status === "complete")}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <IconDownload className="size-3" />
                MP3
              </button>
              <button
                disabled={!jobs.some((j) => j.status === "complete")}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <IconDownload className="size-3" />
                WAV
              </button>
            </div>
          </div>

          {/* Generation Queue */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Generation Queue
            </h3>
            {jobs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No generations yet. Describe your music and click Generate.
              </p>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">
                        {job.prompt.slice(0, 60)}…
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          job.status === "complete"
                            ? "bg-success/15 text-success"
                            : job.status === "generating"
                            ? "bg-warning/15 text-warning"
                            : job.status === "error"
                            ? "bg-error/15 text-error"
                            : "bg-info/15 text-info"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span className="capitalize">
                        {job.genre} • {job.mood}
                      </span>
                      {job.status === "complete" && (
                        <button className="flex items-center gap-1 text-primary-500 hover:text-primary-400">
                          <IconDownload className="size-3" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
