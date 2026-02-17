"use client";

import { useState, useCallback } from "react";
import {
  IconFilm,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type MotionCategory = "lower-thirds" | "title-cards" | "transitions" | "intros" | "social-bumpers";

interface MotionTemplate {
  id: string;
  name: string;
  category: MotionCategory;
  description: string;
  duration: number;
  preview: string;
}

interface MotionConfig {
  category: MotionCategory;
  selectedTemplate: string;
  textInput: string;
  primaryColor: string;
  secondaryColor: string;
  duration: number;
  aiPrompt: string;
}

/* ── Data ──────────────────────────────────────────────────── */

const CATEGORIES: { id: MotionCategory; label: string; desc: string }[] = [
  { id: "lower-thirds", label: "Lower Thirds", desc: "Name/title overlays" },
  { id: "title-cards", label: "Title Cards", desc: "Section dividers" },
  { id: "transitions", label: "Transitions", desc: "Scene transitions" },
  { id: "intros", label: "Intros", desc: "Video openers" },
  { id: "social-bumpers", label: "Social Bumpers", desc: "Quick social clips" },
];

const TEMPLATES: MotionTemplate[] = [
  /* Lower Thirds */
  { id: "lt-slide", name: "Slide In", category: "lower-thirds", description: "Clean slide-in bar with name and title", duration: 4, preview: "▰▰▱▱" },
  { id: "lt-fade", name: "Fade Reveal", category: "lower-thirds", description: "Elegant fade-in with underline accent", duration: 3, preview: "▰▱▱▱" },
  { id: "lt-box", name: "Box Frame", category: "lower-thirds", description: "Bordered box with accent corner", duration: 4, preview: "◻◼▱▱" },
  { id: "lt-modern", name: "Modern Split", category: "lower-thirds", description: "Split color bar with bold typography", duration: 3.5, preview: "◧◨▱▱" },

  /* Title Cards */
  { id: "tc-center", name: "Center Focus", category: "title-cards", description: "Centered text with expanding accent lines", duration: 3, preview: "─▰─" },
  { id: "tc-kinetic", name: "Kinetic Type", category: "title-cards", description: "Dynamic word-by-word reveal", duration: 4, preview: "▰▰▰" },
  { id: "tc-minimal", name: "Minimal", category: "title-cards", description: "Clean minimal fade with subtle motion", duration: 2.5, preview: "▱▰▱" },
  { id: "tc-bold", name: "Bold Impact", category: "title-cards", description: "Large bold text with color wipe", duration: 3, preview: "▰▰▰" },

  /* Transitions */
  { id: "tr-wipe", name: "Color Wipe", category: "transitions", description: "Smooth color wipe left to right", duration: 1, preview: "◀▰▶" },
  { id: "tr-zoom", name: "Zoom Blur", category: "transitions", description: "Quick zoom with motion blur", duration: 0.8, preview: "◎▰◎" },
  { id: "tr-glitch", name: "Glitch Cut", category: "transitions", description: "Digital glitch-style transition", duration: 0.6, preview: "▒▓▒" },
  { id: "tr-circle", name: "Circle Reveal", category: "transitions", description: "Expanding circle iris transition", duration: 1.2, preview: "○▰●" },

  /* Intros */
  { id: "in-logo", name: "Logo Reveal", category: "intros", description: "Particles converge to form logo/text", duration: 5, preview: "✦▰✦" },
  { id: "in-typo", name: "Typography", category: "intros", description: "Staggered text animation with accents", duration: 4, preview: "A▰Z" },
  { id: "in-wave", name: "Wave Motion", category: "intros", description: "Flowing wave reveals brand elements", duration: 5, preview: "~▰~" },
  { id: "in-3d", name: "3D Perspective", category: "intros", description: "Text with 3D perspective rotation", duration: 4.5, preview: "◇▰◆" },

  /* Social Bumpers */
  { id: "sb-follow", name: "Follow CTA", category: "social-bumpers", description: "Quick follow/subscribe call to action", duration: 3, preview: "♥▰" },
  { id: "sb-like", name: "Like & Share", category: "social-bumpers", description: "Animated like and share reminder", duration: 2.5, preview: "👍▰" },
  { id: "sb-end", name: "End Screen", category: "social-bumpers", description: "Video end screen with social links", duration: 5, preview: "▰▰▰" },
  { id: "sb-subscribe", name: "Subscribe Bell", category: "social-bumpers", description: "Animated subscribe button with bell", duration: 3, preview: "🔔▰" },
];

const COLOR_PRESETS = ["#8ae600", "#3b82f6", "#ef4444", "#f59e0b", "#a855f7", "#06b6d4", "#ec4899", "#10b981"];

/* ── Component ─────────────────────────────────────────────── */

export default function MotionGraphicsWorkspace() {
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"preview" | "settings">("preview");

  const [config, setConfig] = useState<MotionConfig>({
    category: "lower-thirds",
    selectedTemplate: "lt-slide",
    textInput: "John Doe — Creative Director",
    primaryColor: "#8ae600",
    secondaryColor: "#111827",
    duration: 4,
    aiPrompt: "",
  });

  const filteredTemplates = TEMPLATES.filter((t) => t.category === config.category);
  const activeTemplate = TEMPLATES.find((t) => t.id === config.selectedTemplate);

  /* ── Select Template ────────────────────────────────────── */
  const selectTemplate = (id: string) => {
    const tmpl = TEMPLATES.find((t) => t.id === id);
    if (tmpl) setConfig((p) => ({ ...p, selectedTemplate: id, duration: tmpl.duration }));
  };

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
            content: `Suggest text for a ${config.category.replace("-", " ")} motion graphic about: ${config.aiPrompt}. Return JSON: { "text": "" }. Max 30 characters. Professional tone.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.text) setConfig((p) => ({ ...p, textInput: data.text }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export (placeholder) ───────────────────────────────── */
  const exportFile = (format: "mp4" | "gif" | "webm") => {
    alert(`Export as ${format.toUpperCase()} — Motion graphics rendering requires server-side processing. Template: ${activeTemplate?.name ?? "None"}`);
  };

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile tab toggle */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["preview", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Settings Panel ──────────────────────────────── */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          {/* Category Selector */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconFilm className="size-4 text-primary-500" />Category
            </h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => { setConfig((p) => ({ ...p, category: cat.id })); const first = TEMPLATES.find((t) => t.category === cat.id); if (first) selectTemplate(first.id); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${config.category === cat.id ? "bg-primary-500/10 text-primary-500 border border-primary-500/30" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                  <span className="text-xs font-medium">{cat.label}</span>
                  <span className="text-[10px] opacity-60">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Customization */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Customization</h3>

            <label className="block text-xs text-gray-400">Text</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.textInput} onChange={(e) => setConfig((p) => ({ ...p, textInput: e.target.value }))} placeholder="Enter display text…" />

            <label className="block text-xs text-gray-400">Primary Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 transition-transform ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={config.primaryColor} onChange={(e) => setConfig((p) => ({ ...p, primaryColor: e.target.value }))} className="size-7 rounded-full cursor-pointer" />
            </div>

            <label className="block text-xs text-gray-400">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.secondaryColor} onChange={(e) => setConfig((p) => ({ ...p, secondaryColor: e.target.value }))} className="size-8 rounded-lg cursor-pointer" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{config.secondaryColor}</span>
            </div>

            <label className="block text-xs text-gray-400">Duration — {config.duration.toFixed(1)}s</label>
            <input type="range" min={0.5} max={10} step={0.1} value={config.duration} onChange={(e) => setConfig((p) => ({ ...p, duration: +e.target.value }))} className="w-full accent-primary-500" />
          </div>

          {/* AI */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />AI Text Suggest
            </h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} placeholder="Describe the context (e.g. 'tech podcast host introduction')…" value={config.aiPrompt} onChange={(e) => setConfig((p) => ({ ...p, aiPrompt: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Suggest Text"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Export</h3>
            <button onClick={() => exportFile("mp4")} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <IconDownload className="size-4" />Export MP4
            </button>
            <button onClick={() => exportFile("gif")} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <IconDownload className="size-4" />Export GIF
            </button>
            <button onClick={() => exportFile("webm")} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <IconDownload className="size-4" />Export WebM
            </button>
          </div>
        </div>

        {/* ── Preview Area ────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "preview" ? "hidden md:block" : ""}`}>
          {/* Template Gallery */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {CATEGORIES.find((c) => c.id === config.category)?.label} Templates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filteredTemplates.map((tmpl) => (
                <button key={tmpl.id} onClick={() => selectTemplate(tmpl.id)} className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${config.selectedTemplate === tmpl.id ? "border-primary-500 bg-primary-500/5 shadow-lg shadow-primary-500/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                  <div className="text-2xl font-mono text-center mb-2 text-gray-500 dark:text-gray-400">{tmpl.preview}</div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{tmpl.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{tmpl.description}</p>
                  <p className="text-[10px] text-primary-500 mt-1">{tmpl.duration}s</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-2xl bg-gray-100 dark:bg-gray-800/50 p-6">
            <div className="relative rounded-xl bg-gray-900 overflow-hidden mx-auto" style={{ aspectRatio: "16/9", maxWidth: 700 }}>
              {/* Simulated preview */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <IconFilm className="size-10 text-gray-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-400">Motion Preview</p>
                  {activeTemplate && (
                    <p className="text-xs text-gray-500">{activeTemplate.name} — {activeTemplate.description}</p>
                  )}
                </div>
              </div>

              {/* Lower-third preview simulation */}
              {config.category === "lower-thirds" && config.textInput && (
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3 rounded-lg overflow-hidden" style={{ backgroundColor: config.secondaryColor }}>
                    <div className="w-1.5 self-stretch" style={{ backgroundColor: config.primaryColor }} />
                    <div className="py-2.5 pr-4">
                      <p className="text-sm font-bold text-white">{config.textInput.split("—")[0]?.trim()}</p>
                      {config.textInput.includes("—") && (
                        <p className="text-xs" style={{ color: config.primaryColor }}>{config.textInput.split("—")[1]?.trim()}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Title card preview simulation */}
              {config.category === "title-cards" && config.textInput && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-0.5 mx-auto mb-4" style={{ backgroundColor: config.primaryColor }} />
                    <p className="text-2xl font-bold text-white">{config.textInput}</p>
                    <div className="w-16 h-0.5 mx-auto mt-4" style={{ backgroundColor: config.primaryColor }} />
                  </div>
                </div>
              )}

              {/* Social bumper preview simulation */}
              {config.category === "social-bumpers" && config.textInput && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="px-6 py-3 rounded-full font-bold text-sm" style={{ backgroundColor: config.primaryColor, color: config.secondaryColor }}>
                    {config.textInput}
                  </div>
                </div>
              )}

              {/* Duration indicator */}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-gray-300">
                {config.duration.toFixed(1)}s
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            {CATEGORIES.find((c) => c.id === config.category)?.label} • {activeTemplate?.name ?? "No template"} • {config.duration}s duration
          </p>
        </div>
      </div>
    </div>
  );
}
