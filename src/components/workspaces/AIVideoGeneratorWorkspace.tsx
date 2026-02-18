"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconVideo,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlay,
  IconPause,
  IconRefresh,
  IconDroplet,
  IconLayout,
  IconCamera,
  IconImage,
} from "@/components/icons";
import { hexToRgba, roundRect } from "@/lib/canvas-utils";
import { cleanAIText } from "@/lib/canvas-utils";
import StickyCanvasLayout from "./StickyCanvasLayout";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type StylePreset = "cinematic" | "animated" | "documentary" | "commercial" | "social-media" | "abstract" | "minimal" | "dramatic";

interface SceneConfig {
  prompt: string;
  enhancedPrompt: string;
  style: StylePreset;
  duration: number;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3";
  colorMood: string;
  bgColor1: string;
  bgColor2: string;
  accentColor: string;
  textOverlay: string;
  showTextOverlay: boolean;
  motionIntensity: number;
  cameraMotion: "static" | "pan-left" | "pan-right" | "zoom-in" | "zoom-out" | "orbit";
}

/* ── Constants ─────────────────────────────────────────────── */

const ASPECT_RATIOS: Record<string, { w: number; h: number; label: string }> = {
  "16:9": { w: 1920, h: 1080, label: "Landscape (16:9)" },
  "9:16": { w: 1080, h: 1920, label: "Portrait (9:16)" },
  "1:1": { w: 1080, h: 1080, label: "Square (1:1)" },
  "4:3": { w: 1440, h: 1080, label: "Classic (4:3)" },
};

const STYLE_PRESETS: { id: StylePreset; name: string; desc: string; colors: [string, string] }[] = [
  { id: "cinematic", name: "Cinematic", desc: "Film-like depth and tones", colors: ["#1a1a2e", "#16213e"] },
  { id: "animated", name: "Animated", desc: "Vibrant cartoon style", colors: ["#667eea", "#764ba2"] },
  { id: "documentary", name: "Documentary", desc: "Natural, realistic feel", colors: ["#2c3e50", "#34495e"] },
  { id: "commercial", name: "Commercial", desc: "Clean, brand-ready", colors: ["#0a0a0a", "#1a1a1a"] },
  { id: "social-media", name: "Social Media", desc: "Eye-catching, trendy", colors: ["#833ab4", "#fd1d1d"] },
  { id: "abstract", name: "Abstract", desc: "Artistic motion patterns", colors: ["#0f0c29", "#302b63"] },
  { id: "minimal", name: "Minimal", desc: "Clean, simple, elegant", colors: ["#fafafa", "#e0e0e0"] },
  { id: "dramatic", name: "Dramatic", desc: "High contrast, intense", colors: ["#0d0d0d", "#1a0000"] },
];

const CAMERA_MOTIONS = [
  { id: "static", label: "Static" },
  { id: "pan-left", label: "Pan Left" },
  { id: "pan-right", label: "Pan Right" },
  { id: "zoom-in", label: "Zoom In" },
  { id: "zoom-out", label: "Zoom Out" },
  { id: "orbit", label: "Orbit" },
] as const;

const COLOR_MOODS = [
  { name: "Warm", bg1: "#1a1a0f", bg2: "#2d1f0e", accent: "#f59e0b" },
  { name: "Cool", bg1: "#0f1a2e", bg2: "#0e1f3d", accent: "#3b82f6" },
  { name: "Neon", bg1: "#0a0a0a", bg2: "#1a0a2e", accent: "#8ae600" },
  { name: "Golden", bg1: "#1a1708", bg2: "#2d2810", accent: "#eab308" },
  { name: "Teal", bg1: "#0a1a1a", bg2: "#0e2d2d", accent: "#14b8a6" },
  { name: "Rose", bg1: "#1a0a0f", bg2: "#2d0e1f", accent: "#f43f5e" },
  { name: "Midnight", bg1: "#0f0f1a", bg2: "#1a1a3d", accent: "#a78bfa" },
  { name: "Monochrome", bg1: "#0a0a0a", bg2: "#1a1a1a", accent: "#d4d4d4" },
];

const DISPLAY_SCALE = 0.48;

/* ── Easing ────────────────────────────────────────────────── */
function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOutQuad(t: number) { return 1 - (1 - t) * (1 - t); }

/* ── Component ─────────────────────────────────────────────── */

export default function AIVideoGeneratorWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<SceneConfig>({
    prompt: "",
    enhancedPrompt: "",
    style: "cinematic",
    duration: 5,
    aspectRatio: "16:9",
    colorMood: "Neon",
    bgColor1: "#0a0a0a",
    bgColor2: "#1a0a2e",
    accentColor: "#8ae600",
    textOverlay: "",
    showTextOverlay: false,
    motionIntensity: 5,
    cameraMotion: "zoom-in",
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [storyboard, setStoryboard] = useState<string[]>([]);

  const dims = ASPECT_RATIOS[config.aspectRatio];

  const update = useCallback(<K extends keyof SceneConfig>(key: K, val: SceneConfig[K]) => {
    setConfig((p) => ({ ...p, [key]: val }));
  }, []);

  /* ── Canvas rendering (motion-graphic storyboard visualization) ── */
  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, t: number) => {
      const w = dims.w;
      const h = dims.h;
      ctx.clearRect(0, 0, w, h);

      // Camera motion transforms
      ctx.save();
      const intensity = config.motionIntensity / 10;
      switch (config.cameraMotion) {
        case "pan-left": {
          const shift = easeInOutCubic(t) * 80 * intensity;
          ctx.translate(-shift, 0);
          break;
        }
        case "pan-right": {
          const shift = easeInOutCubic(t) * 80 * intensity;
          ctx.translate(shift, 0);
          break;
        }
        case "zoom-in": {
          const scale = 1 + easeInOutCubic(t) * 0.15 * intensity;
          ctx.translate(w / 2, h / 2);
          ctx.scale(scale, scale);
          ctx.translate(-w / 2, -h / 2);
          break;
        }
        case "zoom-out": {
          const scale = 1 + (1 - easeInOutCubic(t)) * 0.15 * intensity;
          ctx.translate(w / 2, h / 2);
          ctx.scale(scale, scale);
          ctx.translate(-w / 2, -h / 2);
          break;
        }
        case "orbit": {
          const angle = Math.sin(t * Math.PI * 2) * 0.02 * intensity;
          ctx.translate(w / 2, h / 2);
          ctx.rotate(angle);
          ctx.translate(-w / 2, -h / 2);
          break;
        }
      }

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, w * 0.5, h);
      grad.addColorStop(0, config.bgColor1);
      grad.addColorStop(1, config.bgColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -100, w + 200, h + 200);

      // Animated geometric shapes based on style
      const phaseT = (t * Math.PI * 2);
      ctx.globalAlpha = 0.08;

      // Large ambient circles
      for (let i = 0; i < 5; i++) {
        const cx = w * (0.2 + i * 0.15) + Math.sin(phaseT + i) * 40 * intensity;
        const cy = h * (0.3 + Math.cos(phaseT + i * 0.7) * 0.2);
        const r = 80 + i * 30 + Math.sin(phaseT * 0.5 + i) * 20;
        const circGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        circGrad.addColorStop(0, config.accentColor);
        circGrad.addColorStop(1, "transparent");
        ctx.fillStyle = circGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Grid lines
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = config.accentColor;
      ctx.lineWidth = 1;
      const gridSpacing = 60;
      for (let x = 0; x < w + 200; x += gridSpacing) {
        const shiftedX = x + Math.sin(phaseT * 0.3) * 10;
        ctx.beginPath();
        ctx.moveTo(shiftedX, 0);
        ctx.lineTo(shiftedX, h);
        ctx.stroke();
      }
      for (let y = 0; y < h + 200; y += gridSpacing) {
        const shiftedY = y + Math.cos(phaseT * 0.3) * 10;
        ctx.beginPath();
        ctx.moveTo(0, shiftedY);
        ctx.lineTo(w, shiftedY);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Floating particles
      for (let i = 0; i < 30; i++) {
        const px = (w * ((i * 37) % 100) / 100 + Math.sin(phaseT + i * 2.1) * 30) % w;
        const py = (h * ((i * 53) % 100) / 100 + Math.cos(phaseT + i * 1.7) * 20) % h;
        const size = 2 + Math.sin(phaseT + i) * 1.5;
        ctx.globalAlpha = 0.2 + Math.sin(phaseT + i * 0.5) * 0.15;
        ctx.fillStyle = config.accentColor;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(size, 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Large accent glow
      const glowGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.35);
      glowGrad.addColorStop(0, hexToRgba(config.accentColor, 0.08));
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // Scene description text (representing the prompt)
      const displayText = config.enhancedPrompt || config.prompt || "Enter a scene description to preview";
      const textAlpha = easeOutQuad(Math.min(t * 3, 1));
      ctx.globalAlpha = textAlpha * 0.6;
      ctx.fillStyle = "#ffffff";
      ctx.font = `300 ${Math.round(Math.min(w, h) * 0.025)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Word wrap the scene description
      const maxLineW = w * 0.6;
      const words = displayText.split(" ");
      const lines: string[] = [];
      let currentLine = "";
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(test).width > maxLineW && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);
      const lineH = Math.min(w, h) * 0.04;
      const startY = h * 0.5 - (lines.length - 1) * lineH / 2;
      lines.slice(0, 4).forEach((line, i) => {
        ctx.fillText(line, w / 2, startY + i * lineH);
      });
      ctx.globalAlpha = 1;

      // Text overlay
      if (config.showTextOverlay && config.textOverlay.trim()) {
        const overlayAlpha = t > 0.3 ? easeOutQuad((t - 0.3) / 0.7) : 0;
        ctx.globalAlpha = overlayAlpha;
        ctx.fillStyle = "#ffffff";
        ctx.font = `700 ${Math.round(Math.min(w, h) * 0.06)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(config.textOverlay, w / 2, h * 0.85);

        // Shadow behind overlay text
        ctx.globalAlpha = overlayAlpha * 0.3;
        ctx.fillStyle = "#000000";
        ctx.fillText(config.textOverlay, w / 2 + 2, h * 0.85 + 2);
        ctx.globalAlpha = 1;
      }

      // Style-specific badge
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = config.accentColor;
      ctx.font = `600 ${Math.round(Math.min(w, h) * 0.015)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "left";
      const styleLabel = STYLE_PRESETS.find((s) => s.id === config.style)?.name || config.style;
      ctx.fillText(`${styleLabel.toUpperCase()} • ${dims.w}×${dims.h}`, 30, h - 30);
      ctx.globalAlpha = 1;

      // Timeline bar at bottom
      ctx.fillStyle = hexToRgba(config.accentColor, 0.3);
      ctx.fillRect(0, h - 4, w, 4);
      ctx.fillStyle = config.accentColor;
      ctx.fillRect(0, h - 4, w * t, 4);

      ctx.restore(); // Restore camera motion
    },
    [config, dims],
  );

  /* ── Draw initial static frame ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext("2d")!;
    if (!isPlaying) drawFrame(ctx, progress || 0.5);
  }, [drawFrame, isPlaying, dims, progress]);

  /* ── Animation loop ── */
  const play = useCallback(() => {
    if (isPlaying) {
      cancelAnimationFrame(animRef.current);
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    startTimeRef.current = performance.now();
    const durationMs = config.duration * 1000;

    const loop = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / durationMs, 1);
      setProgress(t);
      drawFrame(ctx, t);
      if (t < 1) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        setIsPlaying(false);
      }
    };
    animRef.current = requestAnimationFrame(loop);
  }, [isPlaying, config.duration, drawFrame, advancedSettings]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  /* ── AI Enhance Prompt ── */
  const enhancePrompt = useCallback(async () => {
    if (!config.prompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are a video scene director. Enhance this scene description for maximum visual quality. Include lighting, camera angle, color mood, and movement details. Keep under 150 words. Style: ${config.style}. Original: "${config.prompt}". Return just the enhanced description text, no JSON or explanation.`,
          }],
        }),
      });
      const text = await res.text();
      update("enhancedPrompt", cleanAIText(text));
    } catch { /* ignore */ }
    setAiLoading(false);
  }, [config.prompt, config.style, update]);

  /* ── AI Generate Storyboard ── */
  const generateStoryboard = useCallback(async () => {
    if (!config.prompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Create a 4-shot storyboard for this scene: "${config.prompt}". Style: ${config.style}. Duration: ${config.duration}s. For each shot, provide a brief 1-sentence description of the visual. Return ONLY a JSON array of 4 strings, no other text. Example: ["Shot 1 description", "Shot 2 description", "Shot 3 description", "Shot 4 description"]`,
          }],
        }),
      });
      const text = await res.text();
      const arrMatch = text.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        setStoryboard(JSON.parse(arrMatch[0]));
      }
    } catch { /* ignore */ }
    setAiLoading(false);
  }, [config.prompt, config.style, config.duration]);

  /* ── Export ── */
  const exportFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    drawFrame(ctx, progress);
    const link = document.createElement("a");
    link.download = `video-scene-${config.style}-${dims.w}x${dims.h}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [drawFrame, progress, config.style, dims]);

  const exportAllFrames = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext("2d")!;
    // Export key frames
    const keyFrames = [0, 0.25, 0.5, 0.75, 1];
    keyFrames.forEach((t, i) => {
      drawFrame(ctx, t);
      const link = document.createElement("a");
      link.download = `video-scene-frame-${i + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  }, [drawFrame, dims]);

  /* ── Left Panel ── */
  const leftPanel = (
    <div className="space-y-4">
      {/* Scene Description */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconVideo className="size-4 text-primary-500" />
          Scene Description
        </h3>
        <textarea
          value={config.prompt}
          onChange={(e) => update("prompt", e.target.value)}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
          rows={3}
          placeholder="A golden sunrise over the Zambezi River with birds flying across the sky…"
        />
        <button
          onClick={enhancePrompt}
          disabled={aiLoading || !config.prompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          {aiLoading ? <IconLoader className="size-3 animate-spin" /> : <IconSparkles className="size-3" />}
          AI Enhance Prompt
        </button>
        {config.enhancedPrompt && (
          <div className="p-2 rounded-lg bg-primary-500/5 border border-primary-500/20 text-xs text-gray-600 dark:text-gray-300">
            {config.enhancedPrompt}
          </div>
        )}
      </div>

      {/* Style Preset */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconLayout className="size-4 text-secondary-500" />
          Visual Style
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {STYLE_PRESETS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                update("style", s.id);
                setConfig((p) => ({ ...p, bgColor1: s.colors[0], bgColor2: s.colors[1] }));
              }}
              className={`text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                config.style === s.id
                  ? "bg-primary-500/10 text-primary-500 border border-primary-500/30"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent"
              }`}
            >
              <span className="font-medium block">{s.name}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio & Duration */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Format</h3>
        <label className="block text-xs text-gray-400">Aspect Ratio</label>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(ASPECT_RATIOS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => update("aspectRatio", key as SceneConfig["aspectRatio"])}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium ${
                config.aspectRatio === key
                  ? "bg-primary-500 text-gray-950"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
        <label className="block text-xs text-gray-400">Duration: {config.duration}s</label>
        <input
          type="range" min={3} max={30} step={1}
          value={config.duration}
          onChange={(e) => update("duration", Number(e.target.value))}
          className="w-full accent-primary-500"
        />
        <label className="block text-xs text-gray-400">Motion Intensity: {config.motionIntensity}</label>
        <input
          type="range" min={0} max={10} step={1}
          value={config.motionIntensity}
          onChange={(e) => update("motionIntensity", Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Camera Motion */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconCamera className="size-4 text-secondary-500" />
          Camera Motion
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {CAMERA_MOTIONS.map((cm) => (
            <button
              key={cm.id}
              onClick={() => update("cameraMotion", cm.id)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium ${
                config.cameraMotion === cm.id
                  ? "bg-primary-500 text-gray-950"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              {cm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color Mood */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconDroplet className="size-4 text-secondary-500" />
          Color Mood
        </h3>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_MOODS.map((c) => (
            <button
              key={c.name}
              title={c.name}
              onClick={() =>
                setConfig((p) => ({ ...p, bgColor1: c.bg1, bgColor2: c.bg2, accentColor: c.accent, colorMood: c.name }))
              }
              className={`size-8 rounded-full border-2 relative overflow-hidden ${
                config.colorMood === c.name ? "border-primary-500 scale-110" : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c.bg1} 50%, ${c.accent} 50%)` }} />
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">BG 1</label>
            <input type="color" value={config.bgColor1} onChange={(e) => update("bgColor1", e.target.value)} className="w-full h-7 rounded cursor-pointer" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">BG 2</label>
            <input type="color" value={config.bgColor2} onChange={(e) => update("bgColor2", e.target.value)} className="w-full h-7 rounded cursor-pointer" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Accent</label>
            <input type="color" value={config.accentColor} onChange={(e) => update("accentColor", e.target.value)} className="w-full h-7 rounded cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Text Overlay */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={config.showTextOverlay}
            onChange={(e) => update("showTextOverlay", e.target.checked)}
            className="rounded"
          />
          Text Overlay
        </label>
        {config.showTextOverlay && (
          <input
            type="text"
            value={config.textOverlay}
            onChange={(e) => update("textOverlay", e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            placeholder="Your Headline"
          />
        )}
      </div>

      {/* AI Actions */}
      <div className="space-y-2">
        <button
          onClick={generateStoryboard}
          disabled={aiLoading || !config.prompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-primary-500 to-secondary-500 text-gray-950 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {aiLoading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
          AI Generate Storyboard
        </button>
      </div>
    </div>
  );

  /* ── Right Panel ── */
  const rightPanel = (
    <div className="space-y-4">
      {/* Playback Controls */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Playback</h3>
        <div className="relative w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-primary-500 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{(progress * config.duration).toFixed(1)}s</span>
          <span>{config.duration}s</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={play}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400"
          >
            {isPlaying ? <IconPause className="size-4" /> : <IconPlay className="size-4" />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              cancelAnimationFrame(animRef.current);
              setIsPlaying(false);
              setProgress(0);
              const ctx = canvasRef.current?.getContext("2d");
              if (ctx) drawFrame(ctx, 0);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <IconRefresh className="size-4" />
          </button>
        </div>
        {/* Scrubber */}
        <label className="block text-[10px] text-gray-400">Scrub</label>
        <input
          type="range" min={0} max={1} step={0.01}
          value={progress}
          onChange={(e) => {
            const t = Number(e.target.value);
            setProgress(t);
            if (!isPlaying) {
              const ctx = canvasRef.current?.getContext("2d");
              if (ctx) drawFrame(ctx, t);
            }
          }}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Storyboard */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Storyboard</h3>
        {storyboard.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            Enter a scene description and click &quot;AI Generate Storyboard&quot; to create a shot list.
          </p>
        ) : (
          <div className="space-y-2">
            {storyboard.map((shot, i) => (
              <div
                key={i}
                className="flex gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <span className="shrink-0 size-5 rounded bg-primary-500/10 text-primary-500 text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-300">{shot}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Settings — Global */}
      <AdvancedSettingsPanel />

      {/* Export */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export</h3>
        <button
          onClick={exportFrame}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <IconDownload className="size-4" />
          Current Frame (PNG)
        </button>
        <button
          onClick={exportAllFrames}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <IconImage className="size-4" />
          Key Frames (5 PNGs)
        </button>
      </div>

      {/* Output Info */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Output Info</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>Resolution: {dims.w}×{dims.h}</p>
          <p>Style: {STYLE_PRESETS.find((s) => s.id === config.style)?.name}</p>
          <p>Duration: {config.duration}s</p>
          <p>Camera: {CAMERA_MOTIONS.find((c) => c.id === config.cameraMotion)?.label}</p>
          <p>Motion: {config.motionIntensity}/10</p>
        </div>
      </div>
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={dims.w * DISPLAY_SCALE}
      displayHeight={dims.h * DISPLAY_SCALE}
      label={`AI Video Scene — ${dims.w}×${dims.h} • ${STYLE_PRESETS.find((s) => s.id === config.style)?.name} • ${config.duration}s`}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.3))}
      onZoomFit={() => setZoom(1)}
      actionsBar={
        <div className="flex items-center gap-3">
          <button
            onClick={play}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors"
          >
            {isPlaying ? <IconPause className="size-4" /> : <IconPlay className="size-4" />}
            {isPlaying ? "Pause" : "Preview Motion"}
          </button>
          <span className="text-xs text-gray-400 font-mono">
            {(progress * config.duration).toFixed(1)}s / {config.duration}s
          </span>
        </div>
      }
    />
  );
}
