"use client";

import { useState } from "react";
import { IconVideo, IconSparkles, IconWand, IconLoader, IconDownload } from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

type StylePreset = "cinematic" | "animated" | "documentary" | "commercial" | "social-media";
type Duration = "3" | "5" | "10" | "15" | "30";

interface GenerationJob { id: string; prompt: string; style: StylePreset; duration: Duration; status: "queued" | "generating" | "complete" | "error"; progress: number; }

export default function AIVideoGeneratorWorkspace() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StylePreset>("cinematic");
  const [duration, setDuration] = useState<Duration>("5");
  const [resolution, setResolution] = useState("1080p");
  const [loading, setLoading] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [mobileTab, setMobileTab] = useState<"preview" | "settings">("settings");

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Enhance this video generation prompt for maximum visual quality. Keep it under 200 words. Original: "${prompt}". Return just the enhanced prompt text, no JSON.` }] }),
      });
      const text = await res.text();
      setEnhancedPrompt(cleanAIText(text));
    } catch { /* ignore */ }
    setLoading(false);
  };

  const startGeneration = () => {
    const job: GenerationJob = {
      id: Date.now().toString(), prompt: enhancedPrompt || prompt,
      style, duration, status: "queued", progress: 0,
    };
    setJobs((p) => [job, ...p]);
    // Simulate progress
    setTimeout(() => setJobs((p) => p.map((j) => j.id === job.id ? { ...j, status: "generating", progress: 30 } : j)), 1000);
    setTimeout(() => setJobs((p) => p.map((j) => j.id === job.id ? { ...j, progress: 70 } : j)), 3000);
    setTimeout(() => setJobs((p) => p.map((j) => j.id === job.id ? { ...j, status: "complete", progress: 100 } : j)), 5000);
  };

  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["preview", "settings"] as const).map((t) => (<button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>))}
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconVideo className="size-4 text-primary-500" />Text to Video</h3>
            <label className="block text-xs text-gray-400">Describe your video scene</label>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={4} placeholder="A golden sunrise over the Zambezi River with birds flying across the sky…" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <button onClick={enhancePrompt} disabled={loading || !prompt.trim()} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">
              {loading ? <IconLoader className="size-3 animate-spin" /> : <IconSparkles className="size-3" />}Enhance Prompt
            </button>
            {enhancedPrompt && (
              <div className="p-2 rounded-lg bg-primary-500/5 border border-primary-500/20 text-xs text-gray-600 dark:text-gray-300">{enhancedPrompt}</div>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Style & Settings</h3>
            <label className="block text-xs text-gray-400">Style</label>
            <div className="grid grid-cols-2 gap-1.5">{(["cinematic", "animated", "documentary", "commercial", "social-media"] as const).map((s) => (<button key={s} onClick={() => setStyle(s)} className={`px-2 py-1.5 rounded-lg text-xs font-medium capitalize ${style === s ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>{s.replace("-", " ")}</button>))}</div>
            <label className="block text-xs text-gray-400">Duration</label>
            <div className="flex gap-1.5">{(["3", "5", "10", "15", "30"] as const).map((d) => (<button key={d} onClick={() => setDuration(d)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium ${duration === d ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>{d}s</button>))}</div>
            <label className="block text-xs text-gray-400">Resolution</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={resolution} onChange={(e) => setResolution(e.target.value)}>
              <option value="1080p">1080p</option><option value="720p">720p</option><option value="4k">4K</option>
            </select>
          </div>
          <button onClick={startGeneration} disabled={!prompt.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50">
            <IconWand className="size-4" />Generate Video
          </button>
        </div>

        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "preview" ? "hidden md:block" : ""}`}>
          {/* Preview */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-black aspect-video flex items-center justify-center">
            <div className="text-center"><IconVideo className="size-12 text-white/30 mx-auto mb-2" /><p className="text-sm text-white/30">Video preview will appear here</p></div>
          </div>
          {/* Queue */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Generation Queue</h3>
            {jobs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No generations yet. Enter a prompt and click Generate.</p>
            ) : (
              <div className="space-y-3">{jobs.map((job) => (
                <div key={job.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{job.prompt.slice(0, 60)}…</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${job.status === "complete" ? "bg-success/15 text-success" : job.status === "generating" ? "bg-warning/15 text-warning" : job.status === "error" ? "bg-error/15 text-error" : "bg-info/15 text-info"}`}>{job.status}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700"><div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${job.progress}%` }} /></div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>{job.style} • {job.duration}s</span>
                    {job.status === "complete" && <button className="flex items-center gap-1 text-primary-500 hover:text-primary-400"><IconDownload className="size-3" />Download</button>}
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
