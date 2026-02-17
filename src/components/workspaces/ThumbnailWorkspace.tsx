"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconImage,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type TemplateName = "tech" | "gaming" | "education" | "vlog" | "business" | "cooking" | "fitness" | "review";

interface PlatformPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

interface ThumbnailConfig {
  platform: string;
  template: TemplateName;
  headline: string;
  subtext: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  fontStyle: "sans" | "serif" | "mono" | "display";
  aiPrompt: string;
}

/* ── Data ──────────────────────────────────────────────────── */

const PLATFORMS: PlatformPreset[] = [
  { id: "youtube", label: "YouTube", width: 1280, height: 720 },
  { id: "twitch", label: "Twitch", width: 1920, height: 1080 },
  { id: "podcast", label: "Podcast", width: 3000, height: 3000 },
  { id: "blog", label: "Blog", width: 1200, height: 630 },
];

const TEMPLATES: { id: TemplateName; label: string; bgColor: string; textColor: string; accent: string }[] = [
  { id: "tech", label: "Tech", bgColor: "#0f172a", textColor: "#e2e8f0", accent: "#3b82f6" },
  { id: "gaming", label: "Gaming", bgColor: "#1a0533", textColor: "#ffffff", accent: "#a855f7" },
  { id: "education", label: "Education", bgColor: "#1e3a5f", textColor: "#ffffff", accent: "#22d3ee" },
  { id: "vlog", label: "Vlog", bgColor: "#fef3c7", textColor: "#1c1917", accent: "#f59e0b" },
  { id: "business", label: "Business", bgColor: "#111827", textColor: "#ffffff", accent: "#8ae600" },
  { id: "cooking", label: "Cooking", bgColor: "#451a03", textColor: "#fff7ed", accent: "#ea580c" },
  { id: "fitness", label: "Fitness", bgColor: "#052e16", textColor: "#ffffff", accent: "#22c55e" },
  { id: "review", label: "Review", bgColor: "#1e1b4b", textColor: "#ffffff", accent: "#f472b6" },
];

const COLOR_PRESETS = ["#0f172a", "#1e1b4b", "#1a0533", "#451a03", "#052e16", "#1c1917", "#fef3c7", "#ffffff"];

const FONT_MAP: Record<string, string> = {
  sans: "'Inter', 'Segoe UI', sans-serif",
  serif: "'Georgia', 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
  display: "'Impact', 'Arial Black', sans-serif",
};

/* ── Component ─────────────────────────────────────────────── */

export default function ThumbnailWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  const [config, setConfig] = useState<ThumbnailConfig>({
    platform: "youtube",
    template: "tech",
    headline: "How to Build Amazing Apps",
    subtext: "Step-by-step tutorial for beginners",
    bgColor: "#0f172a",
    textColor: "#e2e8f0",
    accentColor: "#3b82f6",
    fontStyle: "sans",
    aiPrompt: "",
  });

  const currentPlatform = PLATFORMS.find((p) => p.id === config.platform) ?? PLATFORMS[0];

  /* ── Render Canvas ──────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = currentPlatform.width;
    const H = currentPlatform.height;
    canvas.width = W;
    canvas.height = H;

    const font = FONT_MAP[config.fontStyle] ?? FONT_MAP.sans;
    const isSquare = W === H;
    const scale = isSquare ? W / 1280 : 1;

    /* Background */
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, W, H);

    /* Accent decorations per template */
    ctx.save();
    if (config.template === "tech") {
      /* Grid dots */
      ctx.fillStyle = config.accentColor + "15";
      for (let x = 40; x < W; x += 60) {
        for (let y = 40; y < H; y += 60) {
          ctx.beginPath();
          ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      /* Accent bar */
      ctx.fillStyle = config.accentColor;
      ctx.fillRect(0, H - 8 * scale, W, 8 * scale);
    } else if (config.template === "gaming") {
      /* Diagonal slashes */
      ctx.strokeStyle = config.accentColor + "30";
      ctx.lineWidth = 3 * scale;
      for (let i = -H; i < W; i += 80) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.stroke();
      }
    } else if (config.template === "education") {
      /* Accent circle */
      ctx.beginPath();
      ctx.arc(W * 0.85, H * 0.5, 200 * scale, 0, Math.PI * 2);
      ctx.fillStyle = config.accentColor + "20";
      ctx.fill();
    } else if (config.template === "vlog") {
      /* Rounded accent blob */
      ctx.beginPath();
      ctx.arc(W * 0.15, H * 0.8, 150 * scale, 0, Math.PI * 2);
      ctx.fillStyle = config.accentColor + "30";
      ctx.fill();
    } else if (config.template === "business") {
      /* Corner accent */
      ctx.fillStyle = config.accentColor;
      ctx.fillRect(0, 0, 6 * scale, H);
      ctx.fillRect(0, 0, W, 6 * scale);
    } else if (config.template === "cooking") {
      /* Warm gradient overlay */
      const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.6);
      grad.addColorStop(0, config.accentColor + "15");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (config.template === "fitness") {
      /* Diagonal stripe */
      ctx.fillStyle = config.accentColor + "20";
      ctx.beginPath();
      ctx.moveTo(W * 0.6, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, H);
      ctx.lineTo(W * 0.4, H);
      ctx.closePath();
      ctx.fill();
    } else if (config.template === "review") {
      /* Star shapes (simplified as circles) */
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(W * 0.1 + i * 50 * scale, H * 0.85, 14 * scale, 0, Math.PI * 2);
        ctx.fillStyle = config.accentColor + "60";
        ctx.fill();
      }
    }
    ctx.restore();

    /* Headline */
    const headlineSize = Math.round((isSquare ? 80 : 64) * scale);
    ctx.fillStyle = config.textColor;
    ctx.font = `bold ${headlineSize}px ${font}`;
    ctx.textAlign = "left";

    /* Outline effect */
    ctx.strokeStyle = config.accentColor + "80";
    ctx.lineWidth = 2 * scale;
    ctx.lineJoin = "round";

    const headX = 60 * scale;
    const headY = H * (isSquare ? 0.42 : 0.45);
    const maxTextW = W - 120 * scale;

    /* Word-wrap headline */
    const headWords = config.headline.split(" ");
    const headLines: string[] = [];
    let headLine = "";
    for (const word of headWords) {
      const test = headLine + word + " ";
      if (ctx.measureText(test).width > maxTextW && headLine) {
        headLines.push(headLine.trim());
        headLine = word + " ";
      } else {
        headLine = test;
      }
    }
    if (headLine) headLines.push(headLine.trim());

    headLines.forEach((line, i) => {
      const y = headY + i * (headlineSize * 1.2);
      ctx.strokeText(line, headX, y);
      ctx.fillText(line, headX, y);
    });

    /* Subtext */
    const subSize = Math.round((isSquare ? 36 : 28) * scale);
    ctx.font = `${subSize}px ${font}`;
    ctx.fillStyle = config.textColor + "bb";
    const subY = headY + headLines.length * (headlineSize * 1.2) + 30 * scale;

    const subWords = config.subtext.split(" ");
    const subLines: string[] = [];
    let subLine = "";
    for (const word of subWords) {
      const test = subLine + word + " ";
      if (ctx.measureText(test).width > maxTextW && subLine) {
        subLines.push(subLine.trim());
        subLine = word + " ";
      } else {
        subLine = test;
      }
    }
    if (subLine) subLines.push(subLine.trim());

    subLines.forEach((line, i) => {
      ctx.fillText(line, headX, subY + i * (subSize * 1.4));
    });

    /* Accent bar under headline */
    ctx.fillStyle = config.accentColor;
    const barY = headY + headLines.length * (headlineSize * 1.2) + 8 * scale;
    ctx.fillRect(headX, barY, 100 * scale, 4 * scale);
  }, [config, currentPlatform]);

  useEffect(() => { render(); }, [render]);

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
            content: `Generate a thumbnail title for: ${config.aiPrompt}. Platform: ${config.platform}. Return JSON: { "headline": "", "subtext": "" }. Headline max 8 words. Subtext max 12 words. Make it attention-grabbing.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        setConfig((p) => ({
          ...p,
          headline: data.headline || p.headline,
          subtext: data.subtext || p.subtext,
        }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Apply Template ─────────────────────────────────────── */
  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    setConfig((p) => ({
      ...p,
      template: t.id,
      bgColor: t.bgColor,
      textColor: t.textColor,
      accentColor: t.accent,
    }));
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportImage = (format: "png" | "jpeg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `thumbnail-${config.platform}.${format}`;
    link.href = canvas.toDataURL(format === "jpeg" ? "image/jpeg" : "image/png", 0.95);
    link.click();
  };

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile tab toggle */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["canvas", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Settings Panel ──────────────────────────────── */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          {/* Platform */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconImage className="size-4 text-primary-500" />Platform
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {PLATFORMS.map((p) => (
                <button key={p.id} onClick={() => setConfig((c) => ({ ...c, platform: p.id }))} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${config.platform === p.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                  <span className="block">{p.label}</span>
                  <span className="text-[10px] opacity-70">{p.width}×{p.height}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Content</h3>

            <label className="block text-xs text-gray-400">Headline</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.headline} onChange={(e) => setConfig((p) => ({ ...p, headline: e.target.value }))} />

            <label className="block text-xs text-gray-400">Subtext</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.subtext} onChange={(e) => setConfig((p) => ({ ...p, subtext: e.target.value }))} />

            <label className="block text-xs text-gray-400">Font Style</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["sans", "serif", "mono", "display"] as const).map((f) => (
                <button key={f} onClick={() => setConfig((p) => ({ ...p, fontStyle: f }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${config.fontStyle === f ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{f}</button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Colors</h3>

            <label className="block text-xs text-gray-400">Background</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => setConfig((p) => ({ ...p, bgColor: c }))} className={`size-7 rounded-full border-2 transition-transform ${config.bgColor === c ? "border-primary-500 scale-110" : "border-gray-300 dark:border-gray-600"}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={config.bgColor} onChange={(e) => setConfig((p) => ({ ...p, bgColor: e.target.value }))} className="size-7 rounded-full cursor-pointer" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Text</label>
                <input type="color" value={config.textColor} onChange={(e) => setConfig((p) => ({ ...p, textColor: e.target.value }))} className="size-8 rounded-lg cursor-pointer" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Accent</label>
                <input type="color" value={config.accentColor} onChange={(e) => setConfig((p) => ({ ...p, accentColor: e.target.value }))} className="size-8 rounded-lg cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Templates</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => applyTemplate(t)} className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${config.template === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                  <span className="size-4 rounded-full" style={{ backgroundColor: t.accent }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />AI Title Generator
            </h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} placeholder="Describe your video (e.g. 'React tutorial for Zambian devs')…" value={config.aiPrompt} onChange={(e) => setConfig((p) => ({ ...p, aiPrompt: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Title"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Export</h3>
            <button onClick={() => exportImage("png")} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <IconDownload className="size-4" />Export PNG
            </button>
            <button onClick={() => exportImage("jpeg")} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <IconDownload className="size-4" />Export JPEG
            </button>
          </div>
        </div>

        {/* ── Canvas Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 ${mobileTab !== "canvas" ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 overflow-auto">
            <canvas
              ref={canvasRef}
              style={{ width: "100%", maxWidth: 700, aspectRatio: `${currentPlatform.width}/${currentPlatform.height}` }}
              className="rounded-lg shadow-lg"
            />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            {currentPlatform.label} — {currentPlatform.width}×{currentPlatform.height}px • {config.template} template
          </p>
        </div>
      </div>
    </div>
  );
}
