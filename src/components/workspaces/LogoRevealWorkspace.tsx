"use client";

import { useState } from "react";
import { IconPlay, IconSparkles, IconDownload, IconMusic } from "@/components/icons";

type AnimationStyle = "fade-in" | "particle" | "draw-on" | "glitch" | "3d-flip" | "bounce" | "scale-up" | "liquid-morph";
type BgOption = "solid" | "gradient" | "transparent";

const ANIMATIONS: { id: AnimationStyle; name: string; desc: string }[] = [
  { id: "fade-in", name: "Fade In", desc: "Smooth fade from transparent" },
  { id: "particle", name: "Particle Assemble", desc: "Particles form the logo" },
  { id: "draw-on", name: "Draw On", desc: "Stroke reveal effect" },
  { id: "glitch", name: "Glitch", desc: "Digital glitch reveal" },
  { id: "3d-flip", name: "3D Flip", desc: "3D rotation entrance" },
  { id: "bounce", name: "Bounce", desc: "Bouncy entrance" },
  { id: "scale-up", name: "Scale Up", desc: "Zoom from small" },
  { id: "liquid-morph", name: "Liquid Morph", desc: "Liquid morphing reveal" },
];

const SOUNDS = ["None", "Whoosh", "Impact", "Sparkle", "Cinematic", "Digital"];

export default function LogoRevealWorkspace() {
  const [animation, setAnimation] = useState<AnimationStyle>("fade-in");
  const [duration, setDuration] = useState(4);
  const [bgOption, setBgOption] = useState<BgOption>("solid");
  const [bgColor, setBgColor] = useState("#000000");
  const [sound, setSound] = useState("Whoosh");
  const [isLooping, setIsLooping] = useState(true);
  const [mobileTab, setMobileTab] = useState<"preview" | "settings">("preview");

  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["preview", "settings"] as const).map((t) => (<button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>))}
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconPlay className="size-4 text-primary-500" />Logo Upload</h3>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer">
              <IconSparkles className="size-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drop your logo here</p>
              <p className="text-xs text-gray-400 mt-1">SVG or PNG recommended</p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Animation Style</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">{ANIMATIONS.map((a) => (
              <button key={a.id} onClick={() => setAnimation(a.id)} className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${animation === a.id ? "bg-primary-500/10 text-primary-500 border border-primary-500/30" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <span className="font-medium">{a.name}</span>
                <span className="block text-[10px] text-gray-400 mt-0.5">{a.desc}</span>
              </button>
            ))}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Settings</h3>
            <label className="block text-xs text-gray-400">Duration: {duration}s</label>
            <input type="range" min={2} max={8} step={0.5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full" />
            <label className="block text-xs text-gray-400">Background</label>
            <div className="flex gap-1.5">{(["solid", "gradient", "transparent"] as const).map((b) => (<button key={b} onClick={() => setBgOption(b)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium capitalize ${bgOption === b ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>{b}</button>))}</div>
            {bgOption === "solid" && (
              <div className="flex gap-1.5 flex-wrap">{["#000000", "#ffffff", "#1e293b", "#0f172a", "#1e40af", "#7c3aed"].map((c) => (<button key={c} onClick={() => setBgColor(c)} className={`size-7 rounded-full border-2 ${bgColor === c ? "border-primary-500 scale-110" : "border-gray-300 dark:border-gray-600"}`} style={{ backgroundColor: c }} />))}</div>
            )}
            <label className="block text-xs text-gray-400">Sound Effect</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={sound} onChange={(e) => setSound(e.target.value)}>{SOUNDS.map((s) => <option key={s}>{s}</option>)}</select>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer"><input type="checkbox" checked={isLooping} onChange={(e) => setIsLooping(e.target.checked)} className="rounded" />Loop preview</label>
          </div>
          <div className="space-y-2">
            {["MP4", "GIF", "WebM"].map((fmt) => (
              <button key={fmt} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"><IconDownload className="size-4" />Export {fmt}</button>
            ))}
          </div>
        </div>
        <div className={`flex-1 min-w-0 ${mobileTab !== "preview" ? "hidden md:block" : ""}`}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 aspect-video flex items-center justify-center" style={{ backgroundColor: bgColor }}>
            <div className="text-center"><IconPlay className="size-16 text-white/20 mx-auto mb-3" /><p className="text-sm text-white/30">Logo Animation Preview</p><p className="text-xs text-white/20 mt-1">{ANIMATIONS.find((a) => a.id === animation)?.name} — {duration}s</p></div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            <button className="size-12 rounded-full bg-primary-500 text-gray-950 flex items-center justify-center hover:bg-primary-400"><IconPlay className="size-6" /></button>
            <span className="text-xs text-gray-400">{isLooping ? "Looping" : "Single play"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
