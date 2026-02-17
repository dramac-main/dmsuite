"use client";

import { useState } from "react";
import { IconVideo, IconSparkles, IconWand, IconLoader, IconDownload, IconPlay, IconPlus, IconTrash, IconScissors } from "@/components/icons";

/* ── Types ─────────────────────────────────────────────────── */
interface Clip { id: string; name: string; duration: number; start: number; type: "video" | "audio" | "text"; }
type Resolution = "1080p" | "720p" | "480p" | "custom";
type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5";
type ExportFormat = "mp4" | "webm" | "gif";

const RESOLUTIONS: { id: Resolution; label: string }[] = [
  { id: "1080p", label: "1080p (1920×1080)" }, { id: "720p", label: "720p (1280×720)" },
  { id: "480p", label: "480p (854×480)" }, { id: "custom", label: "Custom" },
];

const TRANSITIONS = ["None", "Fade", "Dissolve", "Slide Left", "Slide Right", "Wipe", "Zoom"];

export default function VideoEditorWorkspace() {
  const [clips, setClips] = useState<Clip[]>([
    { id: "1", name: "Intro.mp4", duration: 5, start: 0, type: "video" },
    { id: "2", name: "Main.mp4", duration: 15, start: 5, type: "video" },
    { id: "3", name: "BGM.mp3", duration: 20, start: 0, type: "audio" },
  ]);
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("mp4");
  const [playheadPos, setPlayheadPos] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"timeline" | "settings">("timeline");

  const totalDuration = Math.max(...clips.map((c) => c.start + c.duration), 20);
  const videoClips = clips.filter((c) => c.type === "video");
  const audioClips = clips.filter((c) => c.type === "audio");

  const addClip = (type: "video" | "audio" | "text") => {
    const id = Date.now().toString();
    const lastEnd = Math.max(...clips.filter((c) => c.type === type).map((c) => c.start + c.duration), 0);
    setClips((p) => [...p, { id, name: `${type}-${id.slice(-4)}`, duration: 5, start: lastEnd, type }]);
  };

  const removeClip = (id: string) => { setClips((p) => p.filter((c) => c.id !== id)); if (selectedClip === id) setSelectedClip(null); };

  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["timeline", "settings"] as const).map((t) => (<button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>))}
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings */}
        <div className={`w-full lg:w-72 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconVideo className="size-4 text-primary-500" />Project Settings</h3>
            <label className="block text-xs text-gray-400">Resolution</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)}>{RESOLUTIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
            <label className="block text-xs text-gray-400">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-1.5">{(["16:9", "9:16", "1:1", "4:5"] as const).map((r) => (<button key={r} onClick={() => setAspectRatio(r)} className={`px-2 py-1.5 rounded-lg text-xs font-medium ${aspectRatio === r ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>{r}</button>))}</div>
            <label className="block text-xs text-gray-400">Transition</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white">{TRANSITIONS.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Add Media</h3>
            <div className="flex gap-2">{(["video", "audio", "text"] as const).map((type) => (<button key={type} onClick={() => addClip(type)} className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 capitalize"><IconPlus className="size-3" />{type}</button>))}</div>
          </div>
          {selectedClip && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Clip Properties</h3>
              {(() => { const clip = clips.find((c) => c.id === selectedClip); if (!clip) return null; return (
                <div className="space-y-2">
                  <label className="block text-xs text-gray-400">Name</label>
                  <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={clip.name} onChange={(e) => setClips((p) => p.map((c) => c.id === selectedClip ? { ...c, name: e.target.value } : c))} />
                  <label className="block text-xs text-gray-400">Duration (s)</label>
                  <input type="number" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={clip.duration} onChange={(e) => setClips((p) => p.map((c) => c.id === selectedClip ? { ...c, duration: Number(e.target.value) } : c))} />
                  <button onClick={() => removeClip(selectedClip)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-error hover:bg-error/10"><IconTrash className="size-3" />Remove Clip</button>
                </div>
              ); })()}
            </div>
          )}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export</h3>
            <div className="flex gap-1.5">{(["mp4", "webm", "gif"] as const).map((f) => (<button key={f} onClick={() => setExportFormat(f)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium uppercase ${exportFormat === f ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>{f}</button>))}</div>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400"><IconDownload className="size-4" />Export {exportFormat.toUpperCase()}</button>
          </div>
        </div>

        {/* Main area */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "timeline" ? "hidden md:block" : ""}`}>
          {/* Video Preview */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-black aspect-video flex items-center justify-center">
            <div className="text-center">
              <IconPlay className="size-12 text-white/40 mx-auto mb-2" />
              <p className="text-sm text-white/40">Video Preview</p>
              <p className="text-xs text-white/20 mt-1">Upload media to begin editing</p>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-3 px-4">
            <button onClick={() => setIsPlaying(!isPlaying)} className="size-10 rounded-full bg-primary-500 text-gray-950 flex items-center justify-center hover:bg-primary-400">
              <IconPlay className="size-5" />
            </button>
            <span className="text-xs text-gray-400 font-mono">{Math.floor(playheadPos)}s / {totalDuration}s</span>
            <input type="range" min={0} max={totalDuration} value={playheadPos} onChange={(e) => setPlayheadPos(Number(e.target.value))} className="flex-1" />
            <div className="flex gap-1 text-xs text-gray-500">
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800">J</kbd>
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800">K</kbd>
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800">L</kbd>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Timeline</h3>
              <div className="flex gap-2">
                <button className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-white flex items-center gap-1"><IconScissors className="size-3" />Split</button>
              </div>
            </div>

            {/* Time ruler */}
            <div className="relative h-6 mb-2 border-b border-gray-200 dark:border-gray-700">
              {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }, (_, i) => (
                <span key={i} className="absolute text-[10px] text-gray-400" style={{ left: `${(i * 5 / totalDuration) * 100}%` }}>{i * 5}s</span>
              ))}
              <div className="absolute top-0 bottom-0 w-0.5 bg-primary-500 z-10" style={{ left: `${(playheadPos / totalDuration) * 100}%` }} />
            </div>

            {/* Video track */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">Video</span>
                <div className="flex-1 h-10 bg-gray-50 dark:bg-gray-800 rounded relative overflow-hidden">
                  {videoClips.map((clip) => (
                    <div key={clip.id} onClick={() => setSelectedClip(clip.id)} className={`absolute top-1 bottom-1 rounded px-1 text-[10px] text-white flex items-center truncate cursor-pointer ${selectedClip === clip.id ? "bg-primary-500 ring-2 ring-primary-300" : "bg-info/70 hover:bg-info"}`}
                      style={{ left: `${(clip.start / totalDuration) * 100}%`, width: `${(clip.duration / totalDuration) * 100}%` }}>
                      {clip.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio track */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">Audio</span>
                <div className="flex-1 h-8 bg-gray-50 dark:bg-gray-800 rounded relative overflow-hidden">
                  {audioClips.map((clip) => (
                    <div key={clip.id} onClick={() => setSelectedClip(clip.id)} className={`absolute top-1 bottom-1 rounded px-1 text-[10px] text-white flex items-center truncate cursor-pointer ${selectedClip === clip.id ? "bg-success ring-2 ring-success/50" : "bg-success/60 hover:bg-success/80"}`}
                      style={{ left: `${(clip.start / totalDuration) * 100}%`, width: `${(clip.duration / totalDuration) * 100}%` }}>
                      {clip.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text track */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">Text</span>
                <div className="flex-1 h-6 bg-gray-50 dark:bg-gray-800 rounded relative overflow-hidden">
                  {clips.filter((c) => c.type === "text").map((clip) => (
                    <div key={clip.id} onClick={() => setSelectedClip(clip.id)} className={`absolute top-0.5 bottom-0.5 rounded px-1 text-[10px] text-white flex items-center truncate cursor-pointer ${selectedClip === clip.id ? "bg-warning ring-2 ring-warning/50" : "bg-warning/60 hover:bg-warning/80"}`}
                      style={{ left: `${(clip.start / totalDuration) * 100}%`, width: `${(clip.duration / totalDuration) * 100}%` }}>
                      {clip.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="text-xs text-gray-400 flex gap-4 flex-wrap">
            <span><kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">Space</kbd> Play/Pause</span>
            <span><kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">S</kbd> Split</span>
            <span><kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">Del</kbd> Delete</span>
            <span><kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">I/O</kbd> In/Out</span>
          </div>
        </div>
      </div>
    </div>
  );
}
