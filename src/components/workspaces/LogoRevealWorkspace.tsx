"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconPlay,
  IconSparkles,
  IconDownload,
  IconLoader,
  IconRefresh,
  IconDroplet,
  IconWand,
  IconLayout,
  IconCamera,
  IconPause,
} from "@/components/icons";
import { hexToRgba, getContrastColor, roundRect } from "@/lib/canvas-utils";
import StickyCanvasLayout from "./StickyCanvasLayout";

/* ── Types ─────────────────────────────────────────────────── */

type AnimationStyle =
  | "fade-in"
  | "particle-assemble"
  | "draw-on"
  | "glitch"
  | "scale-bounce"
  | "blur-reveal"
  | "slice-reveal"
  | "wipe-right";

type BgMode = "solid" | "gradient" | "radial";

interface LogoRevealConfig {
  logoText: string;
  tagline: string;
  animation: AnimationStyle;
  duration: number;
  bgMode: BgMode;
  bgColor1: string;
  bgColor2: string;
  textColor: string;
  accentColor: string;
  fontStyle: "modern" | "bold" | "elegant" | "mono";
  logoSize: number;
  showTagline: boolean;
  showParticles: boolean;
  particleCount: number;
}

/* ── Constants ─────────────────────────────────────────────── */

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const DISPLAY_SCALE = 0.48;

const ANIMATIONS: { id: AnimationStyle; name: string; desc: string }[] = [
  { id: "fade-in", name: "Fade In", desc: "Smooth opacity reveal with subtle scale" },
  { id: "particle-assemble", name: "Particle Assemble", desc: "Dots converge to form the logo" },
  { id: "draw-on", name: "Draw On", desc: "Animated stroke drawing" },
  { id: "glitch", name: "Glitch", desc: "Digital glitch fragments" },
  { id: "scale-bounce", name: "Scale Bounce", desc: "Elastic zoom entrance" },
  { id: "blur-reveal", name: "Blur Reveal", desc: "Blur to sharp focus" },
  { id: "slice-reveal", name: "Slice Reveal", desc: "Horizontal slice open" },
  { id: "wipe-right", name: "Wipe Right", desc: "Wipe from left to right" },
];

const COLOR_PRESETS = [
  { name: "Dark Pro", bg1: "#0a0a0a", bg2: "#1a1a2e", text: "#ffffff", accent: "#8ae600" },
  { name: "Midnight", bg1: "#0f172a", bg2: "#1e293b", text: "#f1f5f9", accent: "#3b82f6" },
  { name: "Ember", bg1: "#1c1917", bg2: "#292524", text: "#fafaf9", accent: "#f97316" },
  { name: "Royal", bg1: "#1e1b4b", bg2: "#312e81", text: "#e0e7ff", accent: "#a78bfa" },
  { name: "Forest", bg1: "#052e16", bg2: "#14532d", text: "#dcfce7", accent: "#4ade80" },
  { name: "Clean White", bg1: "#ffffff", bg2: "#f1f5f9", text: "#0f172a", accent: "#8ae600" },
  { name: "Warm Sand", bg1: "#fef3c7", bg2: "#fde68a", text: "#451a03", accent: "#d97706" },
  { name: "Crimson", bg1: "#1a0000", bg2: "#2d0000", text: "#fecdd3", accent: "#ef4444" },
];

const FONT_MAP: Record<string, { family: string; weight: number; tracking: number }> = {
  modern: { family: "Inter, system-ui, sans-serif", weight: 700, tracking: 4 },
  bold: { family: "'Arial Black', Impact, sans-serif", weight: 900, tracking: 6 },
  elegant: { family: "Georgia, 'Times New Roman', serif", weight: 400, tracking: 8 },
  mono: { family: "'JetBrains Mono', 'Courier New', monospace", weight: 600, tracking: 3 },
};

/* ── Easing ────────────────────────────────────────────────── */

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeOutElastic(t: number) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
}
function easeInOutQuad(t: number) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

/* ── Particle System ───────────────────────────────────────── */

interface Particle {
  x: number; y: number;
  targetX: number; targetY: number;
  size: number;
  color: string;
  delay: number;
  speed: number;
}

function createParticles(count: number, canvasW: number, canvasH: number, color: string): Particle[] {
  const particles: Particle[] = [];
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const spread = Math.max(canvasW, canvasH) * 0.5;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * spread;
    // Target: cluster around the logo center
    const targetAngle = Math.random() * Math.PI * 2;
    const targetDist = Math.random() * 120 + 20;
    particles.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      targetX: cx + Math.cos(targetAngle) * targetDist,
      targetY: cy + Math.sin(targetAngle) * targetDist,
      size: Math.random() * 4 + 1.5,
      color,
      delay: Math.random() * 0.4,
      speed: 0.6 + Math.random() * 0.4,
    });
  }
  return particles;
}

/* ── Component ─────────────────────────────────────────────── */

export default function LogoRevealWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const [config, setConfig] = useState<LogoRevealConfig>({
    logoText: "DMSuite",
    tagline: "AI Creative Suite",
    animation: "fade-in",
    duration: 3,
    bgMode: "gradient",
    bgColor1: "#0a0a0a",
    bgColor2: "#1a1a2e",
    textColor: "#ffffff",
    accentColor: "#8ae600",
    fontStyle: "modern",
    logoSize: 80,
    showTagline: true,
    showParticles: true,
    particleCount: 120,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);

  const update = useCallback(<K extends keyof LogoRevealConfig>(key: K, val: LogoRevealConfig[K]) => {
    setConfig((p) => ({ ...p, [key]: val }));
  }, []);

  // ── Draw static frame (progress-based) ───────────────────
  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, t: number) => {
      const w = CANVAS_W;
      const h = CANVAS_H;
      ctx.clearRect(0, 0, w, h);

      // Background
      if (config.bgMode === "solid") {
        ctx.fillStyle = config.bgColor1;
        ctx.fillRect(0, 0, w, h);
      } else if (config.bgMode === "gradient") {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, config.bgColor1);
        grad.addColorStop(1, config.bgColor2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else {
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
        grad.addColorStop(0, config.bgColor2);
        grad.addColorStop(1, config.bgColor1);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Ambient particles (background decoration)
      if (config.showParticles && config.animation !== "particle-assemble") {
        const pAlpha = Math.min(t * 2, 1) * 0.15;
        particlesRef.current.forEach((p) => {
          ctx.globalAlpha = pAlpha;
          ctx.fillStyle = config.accentColor;
          ctx.beginPath();
          ctx.arc(p.targetX, p.targetY, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }

      // Accent glow behind logo
      const glowAlpha = easeOutCubic(Math.min(t * 1.5, 1)) * 0.12;
      if (glowAlpha > 0) {
        const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 320);
        glow.addColorStop(0, hexToRgba(config.accentColor, glowAlpha));
        glow.addColorStop(1, hexToRgba(config.accentColor, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
      }

      // Logo text rendering based on animation style
      const font = FONT_MAP[config.fontStyle];
      const fontSize = config.logoSize;
      ctx.font = `${font.weight} ${fontSize}px ${font.family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const logoY = config.showTagline ? h / 2 - 20 : h / 2;

      switch (config.animation) {
        case "fade-in": {
          const alpha = easeOutCubic(t);
          const scale = 0.85 + easeOutCubic(t) * 0.15;
          ctx.save();
          ctx.translate(w / 2, logoY);
          ctx.scale(scale, scale);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = config.textColor;
          ctx.letterSpacing = `${font.tracking}px`;
          ctx.fillText(config.logoText, 0, 0);
          ctx.restore();
          break;
        }

        case "particle-assemble": {
          // Particles converge to form text
          const convergence = easeOutCubic(Math.min(t / 0.7, 1));
          const textAlpha = t > 0.65 ? easeOutCubic((t - 0.65) / 0.35) : 0;

          // Draw converging particles
          particlesRef.current.forEach((p) => {
            const pt = Math.max(0, Math.min(1, (t - p.delay) / (0.6 * p.speed)));
            const eased = easeOutCubic(pt);
            const cx = p.x + (p.targetX - p.x) * eased * convergence;
            const cy = p.y + (p.targetY - p.y) * eased * convergence;
            const size = p.size * (1 - eased * 0.4);
            const alpha = Math.min(pt * 3, 1) * (1 - textAlpha * 0.8);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
            ctx.fill();
          });

          // Reveal text once particles settle
          if (textAlpha > 0) {
            ctx.globalAlpha = textAlpha;
            ctx.fillStyle = config.textColor;
            ctx.font = `${font.weight} ${fontSize}px ${font.family}`;
            ctx.letterSpacing = `${font.tracking}px`;
            ctx.fillText(config.logoText, w / 2, logoY);
          }
          ctx.globalAlpha = 1;
          break;
        }

        case "draw-on": {
          // Stroke reveal via clip
          const revealWidth = easeInOutQuad(t) * (w * 0.8);
          ctx.save();
          ctx.beginPath();
          ctx.rect(w / 2 - revealWidth / 2, 0, revealWidth, h);
          ctx.clip();
          ctx.fillStyle = config.textColor;
          ctx.letterSpacing = `${font.tracking}px`;
          ctx.fillText(config.logoText, w / 2, logoY);
          // Stroke outline
          ctx.strokeStyle = config.accentColor;
          ctx.lineWidth = 2;
          ctx.strokeText(config.logoText, w / 2, logoY);
          ctx.restore();

          // Moving cursor line
          if (t < 0.95) {
            const cursorX = w / 2 - revealWidth / 2 + revealWidth;
            ctx.strokeStyle = config.accentColor;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(cursorX, logoY - fontSize * 0.6);
            ctx.lineTo(cursorX, logoY + fontSize * 0.6);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          break;
        }

        case "glitch": {
          ctx.fillStyle = config.textColor;
          ctx.letterSpacing = `${font.tracking}px`;
          // Draw main text
          const glitchIntensity = t < 0.6 ? (1 - t / 0.6) * 20 : 0;
          const mainAlpha = easeOutCubic(Math.min(t * 2, 1));
          ctx.globalAlpha = mainAlpha;

          // Glitch slices
          if (glitchIntensity > 1) {
            const slices = 5;
            const sliceH = fontSize * 1.2 / slices;
            for (let i = 0; i < slices; i++) {
              const offsetX = (Math.random() - 0.5) * glitchIntensity * 2;
              ctx.save();
              ctx.beginPath();
              ctx.rect(0, logoY - fontSize * 0.6 + i * sliceH, w, sliceH);
              ctx.clip();
              ctx.fillText(config.logoText, w / 2 + offsetX, logoY);
              ctx.restore();
            }
            // Color channel split
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = "#ff0000";
            ctx.fillText(config.logoText, w / 2 + glitchIntensity * 0.5, logoY);
            ctx.fillStyle = "#00ffff";
            ctx.fillText(config.logoText, w / 2 - glitchIntensity * 0.5, logoY);
            ctx.fillStyle = config.textColor;
            ctx.globalAlpha = mainAlpha;
          }
          ctx.fillText(config.logoText, w / 2, logoY);
          ctx.globalAlpha = 1;
          break;
        }

        case "scale-bounce": {
          const scale = easeOutElastic(t);
          ctx.save();
          ctx.translate(w / 2, logoY);
          ctx.scale(scale, scale);
          ctx.globalAlpha = Math.min(t * 4, 1);
          ctx.fillStyle = config.textColor;
          ctx.letterSpacing = `${font.tracking}px`;
          ctx.fillText(config.logoText, 0, 0);
          ctx.restore();
          break;
        }

        case "blur-reveal": {
          // Canvas blur isn't available everywhere; simulate with multiple renders
          const clarity = easeOutCubic(t);
          const passes = Math.max(1, Math.round((1 - clarity) * 6));
          ctx.fillStyle = config.textColor;
          ctx.letterSpacing = `${font.tracking}px`;
          ctx.globalAlpha = clarity;
          for (let i = 0; i < passes; i++) {
            const ox = (Math.random() - 0.5) * (1 - clarity) * 30;
            const oy = (Math.random() - 0.5) * (1 - clarity) * 30;
            ctx.globalAlpha = clarity * 0.3;
            ctx.fillText(config.logoText, w / 2 + ox, logoY + oy);
          }
          ctx.globalAlpha = clarity;
          ctx.fillText(config.logoText, w / 2, logoY);
          ctx.globalAlpha = 1;
          break;
        }

        case "slice-reveal": {
          const revealT = easeOutCubic(t);
          const sliceCount = 8;
          const sliceH = h / sliceCount;
          ctx.fillStyle = config.textColor;
          ctx.letterSpacing = `${font.tracking}px`;
          for (let i = 0; i < sliceCount; i++) {
            const sliceProgress = Math.max(0, Math.min(1, (revealT - i * 0.06) / 0.5));
            const offsetX = (1 - sliceProgress) * (i % 2 === 0 ? -150 : 150);
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, i * sliceH, w, sliceH);
            ctx.clip();
            ctx.globalAlpha = sliceProgress;
            ctx.fillText(config.logoText, w / 2 + offsetX, logoY);
            ctx.restore();
          }
          ctx.globalAlpha = 1;
          break;
        }

        case "wipe-right": {
          const wipeX = easeInOutQuad(t) * w;
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, wipeX, h);
          ctx.clip();
          ctx.fillStyle = config.textColor;
          ctx.letterSpacing = `${font.tracking}px`;
          ctx.fillText(config.logoText, w / 2, logoY);
          ctx.restore();

          // Wipe edge glow
          if (t < 0.95 && wipeX > 0 && wipeX < w) {
            const edgeGrad = ctx.createLinearGradient(wipeX - 40, 0, wipeX + 10, 0);
            edgeGrad.addColorStop(0, "transparent");
            edgeGrad.addColorStop(0.5, hexToRgba(config.accentColor, 0.6));
            edgeGrad.addColorStop(1, "transparent");
            ctx.fillStyle = edgeGrad;
            ctx.fillRect(wipeX - 40, 0, 50, h);
          }
          break;
        }
      }

      // Tagline
      if (config.showTagline && config.tagline.trim()) {
        const taglineAlpha = t > 0.5 ? easeOutCubic((t - 0.5) / 0.5) : 0;
        const taglineY = logoY + fontSize * 0.75 + 20;
        ctx.globalAlpha = taglineAlpha;
        ctx.fillStyle = hexToRgba(config.textColor, 0.65);
        ctx.font = `300 ${Math.round(fontSize * 0.26)}px ${font.family}`;
        ctx.letterSpacing = `${Math.round(font.tracking * 1.5)}px`;
        ctx.fillText(config.tagline.toUpperCase(), w / 2, taglineY);
        ctx.globalAlpha = 1;
      }

      // Accent line below tagline
      if (t > 0.6) {
        const lineAlpha = easeOutCubic((t - 0.6) / 0.4);
        const lineWidth = lineAlpha * 120;
        const lineY = logoY + fontSize * 0.75 + (config.showTagline ? 50 : 30);
        ctx.strokeStyle = config.accentColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = lineAlpha * 0.7;
        ctx.beginPath();
        ctx.moveTo(w / 2 - lineWidth / 2, lineY);
        ctx.lineTo(w / 2 + lineWidth / 2, lineY);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    },
    [config],
  );

  // ── Initialize particles when config changes ────────────
  useEffect(() => {
    particlesRef.current = createParticles(
      config.particleCount, CANVAS_W, CANVAS_H, config.accentColor,
    );
  }, [config.particleCount, config.accentColor]);

  // ── Draw initial static frame ───────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d")!;
    if (!isPlaying) {
      drawFrame(ctx, 1); // Show completed state when not playing
    }
  }, [drawFrame, isPlaying]);

  // ── Animation loop ──────────────────────────────────────
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
  }, [isPlaying, config.duration, drawFrame]);

  // Cleanup
  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  // ── AI Suggest ──────────────────────────────────────────
  const aiSuggest = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Suggest a logo reveal animation configuration for a brand called "${config.logoText}" with tagline "${config.tagline}". Return ONLY a JSON object with these keys:
- animation: one of ${ANIMATIONS.map(a => a.id).join(", ")}
- bgMode: "solid" | "gradient" | "radial"
- bgColor1: hex color
- bgColor2: hex color
- textColor: hex color
- accentColor: hex color
- fontStyle: "modern" | "bold" | "elegant" | "mono"
- duration: number 2-6
- showParticles: boolean
- tagline: improved tagline text
Return ONLY the JSON, no explanation.`,
          }],
        }),
      });
      const text = await res.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestion = JSON.parse(jsonMatch[0]);
        setConfig((p) => ({
          ...p,
          animation: suggestion.animation || p.animation,
          bgMode: suggestion.bgMode || p.bgMode,
          bgColor1: suggestion.bgColor1 || p.bgColor1,
          bgColor2: suggestion.bgColor2 || p.bgColor2,
          textColor: suggestion.textColor || p.textColor,
          accentColor: suggestion.accentColor || p.accentColor,
          fontStyle: suggestion.fontStyle || p.fontStyle,
          duration: suggestion.duration || p.duration,
          showParticles: suggestion.showParticles ?? p.showParticles,
          tagline: suggestion.tagline || p.tagline,
        }));
      }
    } catch { /* ignore */ }
    setAiLoading(false);
  }, [config.logoText, config.tagline]);

  // ── Export ──────────────────────────────────────────────
  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    drawFrame(ctx, 1);
    const link = document.createElement("a");
    link.download = `${config.logoText.replace(/\s+/g, "-").toLowerCase()}-reveal-${CANVAS_W}x${CANVAS_H}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [drawFrame, config.logoText]);

  const exportGIF = useCallback(() => {
    // Export multiple frames as individual PNGs (actual GIF encoding would require a library)
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d")!;
    const frameCount = Math.round(config.duration * 15); // 15 fps
    for (let i = 0; i <= frameCount; i++) {
      const t = i / frameCount;
      drawFrame(ctx, t);
      if (i === frameCount) {
        // Export final frame
        const link = document.createElement("a");
        link.download = `${config.logoText.replace(/\s+/g, "-").toLowerCase()}-reveal-final.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    }
  }, [drawFrame, config.duration, config.logoText]);

  // ── Left Panel ─────────────────────────────────────────
  const leftPanel = (
    <div className="space-y-4">
      {/* Brand Info */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconSparkles className="size-4 text-primary-500" />
          Brand Info
        </h3>
        <label className="block text-xs text-gray-400">Logo Text</label>
        <input
          type="text"
          value={config.logoText}
          onChange={(e) => update("logoText", e.target.value)}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
          placeholder="Your Brand Name"
        />
        <label className="block text-xs text-gray-400">Tagline</label>
        <input
          type="text"
          value={config.tagline}
          onChange={(e) => update("tagline", e.target.value)}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
          placeholder="Your tagline here"
        />
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showTagline}
            onChange={(e) => update("showTagline", e.target.checked)}
            className="rounded"
          />
          Show tagline
        </label>
      </div>

      {/* Animation Style */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconLayout className="size-4 text-secondary-500" />
          Animation Style
        </h3>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {ANIMATIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => update("animation", a.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                config.animation === a.id
                  ? "bg-primary-500/10 text-primary-500 border border-primary-500/30"
                  : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
              }`}
            >
              <span className="font-medium">{a.name}</span>
              <span className="block text-[10px] text-gray-400 mt-0.5">{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration & Size */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Timing & Size</h3>
        <label className="block text-xs text-gray-400">Duration: {config.duration}s</label>
        <input
          type="range" min={1} max={8} step={0.5}
          value={config.duration}
          onChange={(e) => update("duration", Number(e.target.value))}
          className="w-full accent-primary-500"
        />
        <label className="block text-xs text-gray-400">Logo Size: {config.logoSize}px</label>
        <input
          type="range" min={40} max={160} step={4}
          value={config.logoSize}
          onChange={(e) => update("logoSize", Number(e.target.value))}
          className="w-full accent-primary-500"
        />
        <label className="block text-xs text-gray-400">Font Style</label>
        <div className="grid grid-cols-2 gap-1.5">
          {(["modern", "bold", "elegant", "mono"] as const).map((f) => (
            <button
              key={f}
              onClick={() => update("fontStyle", f)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium capitalize ${
                config.fontStyle === f
                  ? "bg-primary-500 text-gray-950"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconDroplet className="size-4 text-secondary-500" />
          Colors
        </h3>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.name}
              title={c.name}
              onClick={() =>
                setConfig((p) => ({
                  ...p,
                  bgColor1: c.bg1,
                  bgColor2: c.bg2,
                  textColor: c.text,
                  accentColor: c.accent,
                }))
              }
              className={`size-8 rounded-full border-2 relative overflow-hidden ${
                config.bgColor1 === c.bg1 && config.accentColor === c.accent
                  ? "border-primary-500 scale-110"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c.bg1} 50%, ${c.accent} 50%)` }} />
            </button>
          ))}
        </div>
        <label className="block text-xs text-gray-400">Background Mode</label>
        <div className="flex gap-1.5">
          {(["solid", "gradient", "radial"] as const).map((m) => (
            <button
              key={m}
              onClick={() => update("bgMode", m)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium capitalize ${
                config.bgMode === m
                  ? "bg-primary-500 text-gray-950"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Background 1</label>
            <input
              type="color"
              value={config.bgColor1}
              onChange={(e) => update("bgColor1", e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Background 2</label>
            <input
              type="color"
              value={config.bgColor2}
              onChange={(e) => update("bgColor2", e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Text</label>
            <input
              type="color"
              value={config.textColor}
              onChange={(e) => update("textColor", e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Accent</label>
            <input
              type="color"
              value={config.accentColor}
              onChange={(e) => update("accentColor", e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Particles */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={config.showParticles}
            onChange={(e) => update("showParticles", e.target.checked)}
            className="rounded"
          />
          Background Particles
        </label>
        {config.showParticles && (
          <>
            <label className="block text-xs text-gray-400">Count: {config.particleCount}</label>
            <input
              type="range" min={30} max={300} step={10}
              value={config.particleCount}
              onChange={(e) => update("particleCount", Number(e.target.value))}
              className="w-full accent-primary-500"
            />
          </>
        )}
      </div>

      {/* AI Suggest */}
      <button
        onClick={aiSuggest}
        disabled={aiLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-primary-500 to-secondary-500 text-gray-950 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {aiLoading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
        AI Suggest Style
      </button>

      {/* Export */}
      <div className="space-y-2">
        <button
          onClick={exportPNG}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <IconDownload className="size-4" />
          Export PNG (1920×1080)
        </button>
        <button
          onClick={exportGIF}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <IconCamera className="size-4" />
          Export Final Frame
        </button>
      </div>
    </div>
  );

  // ── Right Panel ─────────────────────────────────────────
  const rightPanel = (
    <div className="space-y-4">
      {/* Timeline / Progress */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Timeline</h3>
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
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors"
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
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <IconRefresh className="size-4" />
          </button>
        </div>
      </div>

      {/* Preview Scrubber */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Scrub Preview</h3>
        <p className="text-[10px] text-gray-400">Drag to preview any frame</p>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
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

      {/* Info */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Output Info</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>Resolution: {CANVAS_W}×{CANVAS_H} (Full HD)</p>
          <p>Animation: {ANIMATIONS.find((a) => a.id === config.animation)?.name}</p>
          <p>Duration: {config.duration}s</p>
          <p>Font: {config.fontStyle}</p>
          <p>Particles: {config.showParticles ? config.particleCount : "Off"}</p>
        </div>
      </div>
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={CANVAS_W * DISPLAY_SCALE}
      displayHeight={CANVAS_H * DISPLAY_SCALE}
      label={`Logo Reveal — ${CANVAS_W}×${CANVAS_H} • ${ANIMATIONS.find((a) => a.id === config.animation)?.name} • ${config.duration}s`}
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
            {isPlaying ? "Pause" : "Play Animation"}
          </button>
          <span className="text-xs text-gray-400 font-mono">{(progress * config.duration).toFixed(1)}s / {config.duration}s</span>
        </div>
      }
    />
  );
}
