"use client";

import { useState, useCallback, useRef } from "react";
import {
  IconSubtitles,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlus,
  IconTrash,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

interface SubtitleEntry {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
}

type SubPosition = "top" | "center" | "bottom";

interface SubtitleConfig {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  bgColor: string;
  bgOpacity: number;
  position: SubPosition;
  burnIn: boolean;
  aiPrompt: string;
}

const FONT_OPTIONS = [
  "Inter", "Arial", "Helvetica", "Georgia", "Courier New", "Verdana", "Trebuchet MS",
];

const FONT_SIZES = [14, 16, 18, 20, 24, 28, 32, 36, 42, 48];

const COLOR_PRESETS = ["#ffffff", "#ffff00", "#00ff00", "#00ffff", "#ff6600", "#ff0000", "#f0f0f0", "#1e293b"];

function uid(): string {
  return "sub_" + Math.random().toString(36).slice(2, 9);
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatSrtTime(ts: string): string {
  /* Expects HH:MM:SS.mmm or MM:SS.mmm; normalises to SRT format 00:00:00,000 */
  const parts = ts.replace(",", ".").split(":");
  if (parts.length === 2) return `00:${pad2(+parts[0])}:${parts[1].replace(".", ",")}`;
  if (parts.length === 3) return `${pad2(+parts[0])}:${pad2(+parts[1])}:${parts[2].replace(".", ",")}`;
  return ts;
}

function formatVttTime(ts: string): string {
  const parts = ts.replace(",", ".").split(":");
  if (parts.length === 2) return `00:${pad2(+parts[0])}:${parts[1]}`;
  if (parts.length === 3) return `${pad2(+parts[0])}:${pad2(+parts[1])}:${parts[2]}`;
  return ts;
}

/* ── Component ─────────────────────────────────────────────── */

export default function SubtitleGeneratorWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [entries, setEntries] = useState<SubtitleEntry[]>([
    { id: uid(), startTime: "00:00:01.000", endTime: "00:00:04.000", text: "Welcome to DMSuite" },
    { id: uid(), startTime: "00:00:04.500", endTime: "00:00:08.000", text: "Create professional subtitles easily" },
  ]);

  const [config, setConfig] = useState<SubtitleConfig>({
    fontFamily: "Inter",
    fontSize: 24,
    fontColor: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 70,
    position: "bottom",
    burnIn: false,
    aiPrompt: "",
  });

  /* ── File Handling ──────────────────────────────────────── */
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) return;
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  /* ── Entry CRUD ─────────────────────────────────────────── */
  const addEntry = () => {
    const last = entries[entries.length - 1];
    const newStart = last ? last.endTime : "00:00:00.000";
    const secs = parseFloat(newStart.split(":").pop()?.replace(",", ".") ?? "0");
    const newEnd = newStart.replace(/[\d.]+$/, (secs + 3).toFixed(3));
    setEntries((p) => [...p, { id: uid(), startTime: newStart, endTime: newEnd, text: "" }]);
  };

  const removeEntry = (id: string) => setEntries((p) => p.filter((e) => e.id !== id));

  const updateEntry = (id: string, field: keyof SubtitleEntry, value: string) =>
    setEntries((p) => p.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = async () => {
    if (!config.aiPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate subtitles for a video about: ${config.aiPrompt}. Return JSON array: [{ "startTime": "00:00:01.000", "endTime": "00:00:04.000", "text": "..." }]. Generate 6-10 entries with realistic timing. Keep each line under 42 characters.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        const data = JSON.parse(match[0]) as { startTime: string; endTime: string; text: string }[];
        setEntries(data.map((d) => ({ id: uid(), ...d })));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export SRT ─────────────────────────────────────────── */
  const exportSrt = () => {
    const srt = entries
      .map((e, i) => `${i + 1}\n${formatSrtTime(e.startTime)} --> ${formatSrtTime(e.endTime)}\n${e.text}\n`)
      .join("\n");
    downloadText(srt, "subtitles.srt", "text/plain");
  };

  /* ── Export VTT ─────────────────────────────────────────── */
  const exportVtt = () => {
    const vtt = "WEBVTT\n\n" + entries
      .map((e) => `${formatVttTime(e.startTime)} --> ${formatVttTime(e.endTime)}\n${e.text}\n`)
      .join("\n");
    downloadText(vtt, "subtitles.vtt", "text/vtt");
  };

  const downloadText = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile tab toggle */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["content", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Settings Panel ──────────────────────────────── */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          {/* Style */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSubtitles className="size-4 text-primary-500" />Subtitle Style
            </h3>

            <label className="block text-xs text-gray-400">Font Family</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.fontFamily} onChange={(e) => setConfig((p) => ({ ...p, fontFamily: e.target.value }))}>
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>

            <label className="block text-xs text-gray-400">Font Size</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.fontSize} onChange={(e) => setConfig((p) => ({ ...p, fontSize: +e.target.value }))}>
              {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
            </select>

            <label className="block text-xs text-gray-400">Font Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => setConfig((p) => ({ ...p, fontColor: c }))} className={`size-7 rounded-full border-2 transition-transform ${config.fontColor === c ? "border-primary-500 scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={config.fontColor} onChange={(e) => setConfig((p) => ({ ...p, fontColor: e.target.value }))} className="size-7 rounded-full cursor-pointer" />
            </div>

            <label className="block text-xs text-gray-400">Background Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.bgColor} onChange={(e) => setConfig((p) => ({ ...p, bgColor: e.target.value }))} className="size-8 rounded-lg cursor-pointer" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{config.bgColor}</span>
            </div>

            <label className="block text-xs text-gray-400">Background Opacity — {config.bgOpacity}%</label>
            <input type="range" min={0} max={100} value={config.bgOpacity} onChange={(e) => setConfig((p) => ({ ...p, bgOpacity: +e.target.value }))} className="w-full accent-primary-500" />

            <label className="block text-xs text-gray-400">Position</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["top", "center", "bottom"] as const).map((pos) => (
                <button key={pos} onClick={() => setConfig((p) => ({ ...p, position: pos }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${config.position === pos ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{pos}</button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-400">Burn-in to Video</span>
              <button onClick={() => setConfig((p) => ({ ...p, burnIn: !p.burnIn }))} className={`relative w-10 h-5 rounded-full transition-colors ${config.burnIn ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-700"}`}>
                <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${config.burnIn ? "translate-x-5" : ""}`} />
              </button>
            </div>
          </div>

          {/* AI Generation */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />AI Subtitle Generator
            </h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe your video content (e.g. 'Product demo for a Zambian fintech app')…" value={config.aiPrompt} onChange={(e) => setConfig((p) => ({ ...p, aiPrompt: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Subtitles"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Export</h3>
            <button onClick={exportSrt} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <IconDownload className="size-4" />Export SRT
            </button>
            <button onClick={exportVtt} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <IconDownload className="size-4" />Export VTT
            </button>
          </div>
        </div>

        {/* ── Content Area ────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden md:block" : ""}`}>
          {/* Video Upload Zone */}
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

          {!videoUrl ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-colors ${dragOver ? "border-primary-500 bg-primary-500/10" : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-primary-500/50"}`}
            >
              <IconSubtitles className="size-10 text-gray-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Drag & drop a video file or click to browse</p>
              <p className="text-xs text-gray-400">MP4, WebM, MOV supported</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden bg-black">
              <video src={videoUrl} controls className="w-full max-h-80 object-contain" />
              <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
                <span className="text-xs text-gray-400 truncate">{videoFile?.name}</span>
                <button onClick={() => { setVideoFile(null); setVideoUrl(null); }} className="text-xs text-red-400 hover:text-red-300">Remove</button>
              </div>
            </div>
          )}

          {/* Subtitle Preview */}
          <div className="rounded-2xl bg-gray-100 dark:bg-gray-800/50 p-4">
            <div className="relative bg-gray-900 rounded-xl min-h-40 flex items-end justify-center p-6 overflow-hidden" style={{ alignItems: config.position === "top" ? "flex-start" : config.position === "center" ? "center" : "flex-end" }}>
              {entries.length > 0 && (
                <div className="px-4 py-2 rounded-lg text-center max-w-xl" style={{ backgroundColor: config.bgColor + Math.round(config.bgOpacity * 2.55).toString(16).padStart(2, "0"), color: config.fontColor, fontFamily: config.fontFamily, fontSize: config.fontSize * 0.6 }}>
                  {entries[0]?.text || "Subtitle preview"}
                </div>
              )}
            </div>
          </div>

          {/* Subtitle Entries List */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <IconSubtitles className="size-4 text-primary-500" />Subtitle Entries ({entries.length})
              </h3>
              <button onClick={addEntry} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-semibold hover:bg-primary-400 transition-colors">
                <IconPlus className="size-3.5" />Add
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {entries.map((entry, i) => (
                <div key={entry.id} className={`rounded-lg border p-3 space-y-2 transition-colors ${editingId === entry.id ? "border-primary-500 bg-primary-500/5" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"}`} onClick={() => setEditingId(entry.id)}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-400">#{i + 1}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeEntry(entry.id); }} className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                      <IconTrash className="size-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Start</label>
                      <input className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs font-mono text-gray-900 dark:text-white" value={entry.startTime} onChange={(e) => updateEntry(entry.id, "startTime", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">End</label>
                      <input className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs font-mono text-gray-900 dark:text-white" value={entry.endTime} onChange={(e) => updateEntry(entry.id, "endTime", e.target.value)} />
                    </div>
                  </div>
                  <textarea className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-white resize-none" rows={2} placeholder="Subtitle text…" value={entry.text} onChange={(e) => updateEntry(entry.id, "text", e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            {entries.length} subtitle{entries.length !== 1 ? "s" : ""} • {config.position} positioned • {config.fontFamily} {config.fontSize}px
          </p>
        </div>
      </div>
    </div>
  );
}
