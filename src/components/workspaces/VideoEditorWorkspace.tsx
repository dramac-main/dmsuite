"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconVideo,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlay,
  IconPause,
  IconPlus,
  IconTrash,
  IconScissors,
  IconRefresh,
  IconDroplet,
  IconLayout,
  IconCamera,
  IconMusic,
  IconType,
  IconLayers,
  IconImage,
  IconCopy,
} from "@/components/icons";
import { hexToRgba, roundRect, cleanAIText } from "@/lib/canvas-utils";
import StickyCanvasLayout from "./StickyCanvasLayout";

/* ══════════════════════════════════════════════════════════════
   DMSuite — AI Video Editor Workspace
   Canvas-based NLE (Non-Linear Editor) with AI smart-cut, 
   transitions, color grading, text overlays, and multi-track 
   timeline.
   ══════════════════════════════════════════════════════════════ */

/* ── Types ─────────────────────────────────────────────────── */

type ClipType = "video" | "audio" | "text" | "image";

interface Clip {
  id: string;
  name: string;
  type: ClipType;
  start: number;       // seconds on timeline
  duration: number;     // seconds
  color: string;        // track colour
  volume: number;       // 0–100
  opacity: number;      // 0–100
  textContent?: string; // for text clips
  fontSize?: number;
  fontColor?: string;
  textAlign?: "left" | "center" | "right";
  imageUrl?: string;    // for image clips
  trimStart?: number;   // in-point of source
  trimEnd?: number;     // out-point of source
}

type Transition = "none" | "fade" | "dissolve" | "slide-left" | "slide-right" | "wipe" | "zoom" | "push";
type ColorGrade = "none" | "cinematic" | "warm" | "cool" | "vintage" | "high-contrast" | "desaturated" | "neon" | "noir";
type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "4:3" | "21:9";
type Resolution = "4k" | "1080p" | "720p" | "480p";
type ExportFormat = "mp4" | "webm" | "gif";

interface ProjectConfig {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  fps: number;
  bgColor: string;
  transition: Transition;
  transitionDuration: number;
  colorGrade: ColorGrade;
  exportFormat: ExportFormat;
}

/* ── Constants ─────────────────────────────────────────────── */

const ASPECT_DIMS: Record<AspectRatio, { w: number; h: number; label: string }> = {
  "16:9":  { w: 1920, h: 1080, label: "Landscape (16:9)" },
  "9:16":  { w: 1080, h: 1920, label: "Portrait (9:16)" },
  "1:1":   { w: 1080, h: 1080, label: "Square (1:1)" },
  "4:5":   { w: 1080, h: 1350, label: "Social (4:5)" },
  "4:3":   { w: 1440, h: 1080, label: "Classic (4:3)" },
  "21:9":  { w: 2560, h: 1080, label: "Ultrawide (21:9)" },
};

const RESOLUTIONS: { id: Resolution; label: string; scale: number }[] = [
  { id: "4k",    label: "4K (3840×2160)", scale: 2 },
  { id: "1080p", label: "1080p (1920×1080)", scale: 1 },
  { id: "720p",  label: "720p (1280×720)", scale: 0.667 },
  { id: "480p",  label: "480p (854×480)", scale: 0.445 },
];

const FPS_OPTIONS = [24, 25, 30, 60];

const TRANSITIONS: { id: Transition; name: string }[] = [
  { id: "none", name: "None" },
  { id: "fade", name: "Fade" },
  { id: "dissolve", name: "Dissolve" },
  { id: "slide-left", name: "Slide Left" },
  { id: "slide-right", name: "Slide Right" },
  { id: "wipe", name: "Wipe" },
  { id: "zoom", name: "Zoom" },
  { id: "push", name: "Push" },
];

const COLOR_GRADES: { id: ColorGrade; name: string; desc: string }[] = [
  { id: "none",           name: "None",           desc: "Original" },
  { id: "cinematic",      name: "Cinematic",      desc: "Teal & orange film look" },
  { id: "warm",           name: "Warm",           desc: "Golden warm tones" },
  { id: "cool",           name: "Cool",           desc: "Blue cool tones" },
  { id: "vintage",        name: "Vintage",        desc: "Faded retro film" },
  { id: "high-contrast",  name: "High Contrast",  desc: "Punchy blacks & whites" },
  { id: "desaturated",    name: "Desaturated",    desc: "Muted colors" },
  { id: "neon",           name: "Neon",           desc: "Vibrant neon glow" },
  { id: "noir",           name: "Noir",           desc: "Black & white dramatic" },
];

const TRACK_COLORS: Record<ClipType, string> = {
  video: "#3b82f6",   // blue
  audio: "#22c55e",   // green
  text:  "#f59e0b",   // amber
  image: "#a855f7",   // purple
};

const DISPLAY_SCALE = 0.48;

/* ── Easing & Helpers ──────────────────────────────────────── */

function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOutQuad(t: number) { return 1 - (1 - t) * (1 - t); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const f = Math.floor((s % 1) * 100);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${f.toString().padStart(2, "0")}`;
}

let _clipId = 0;
function nextId() { return `clip-${Date.now()}-${++_clipId}`; }

/* ── Default Clips ─────────────────────────────────────────── */

function defaultClips(): Clip[] {
  return [
    { id: nextId(), name: "Intro Scene", type: "video", start: 0, duration: 4, color: TRACK_COLORS.video, volume: 100, opacity: 100 },
    { id: nextId(), name: "Main Content", type: "video", start: 4, duration: 8, color: TRACK_COLORS.video, volume: 100, opacity: 100 },
    { id: nextId(), name: "Outro", type: "video", start: 12, duration: 3, color: TRACK_COLORS.video, volume: 100, opacity: 100 },
    { id: nextId(), name: "Background Music", type: "audio", start: 0, duration: 15, color: TRACK_COLORS.audio, volume: 60, opacity: 100 },
    { id: nextId(), name: "Title Card", type: "text", start: 0.5, duration: 3, color: TRACK_COLORS.text, volume: 100, opacity: 100, textContent: "MY VIDEO", fontSize: 72, fontColor: "#ffffff", textAlign: "center" },
  ];
}

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

export default function VideoEditorWorkspace() {
  /* ── State ─────────────────────────────────────────────── */
  const [clips, setClips] = useState<Clip[]>(defaultClips);
  const [config, setConfig] = useState<ProjectConfig>({
    aspectRatio: "16:9",
    resolution: "1080p",
    fps: 30,
    bgColor: "#0a0a0a",
    transition: "fade",
    transitionDuration: 0.5,
    colorGrade: "cinematic",
    exportFormat: "mp4",
  });

  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timelineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  /* ── Derived ───────────────────────────────────────────── */
  const dims = ASPECT_DIMS[config.aspectRatio];
  const canvasW = dims.w;
  const canvasH = dims.h;
  const totalDuration = useMemo(() => Math.max(...clips.map(c => c.start + c.duration), 1), [clips]);
  const displayW = canvasW * DISPLAY_SCALE;
  const displayH = canvasH * DISPLAY_SCALE;
  const selectedClip = useMemo(() => clips.find(c => c.id === selectedClipId) ?? null, [clips, selectedClipId]);

  // Timeline dimensions
  const TIMELINE_H = 200;
  const TIMELINE_W = 900;
  const TRACK_H = 32;
  const RULER_H = 24;
  const TRACK_GAP = 4;
  const LABEL_W = 56;

  /* ── Color Grading ─────────────────────────────────────── */
  function applyColorGrade(ctx: CanvasRenderingContext2D, grade: ColorGrade, w: number, h: number) {
    if (grade === "none") return;
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    const gradeColors: Record<string, [string, number][]> = {
      cinematic:       [["#0d3b66", 0.18], ["#ff6f00", 0.08]],
      warm:            [["#ffa726", 0.15]],
      cool:            [["#1565c0", 0.15]],
      vintage:         [["#d4a574", 0.2], ["#8b7355", 0.1]],
      "high-contrast": [],
      desaturated:     [["#808080", 0.3]],
      neon:            [["#e040fb", 0.1], ["#00e5ff", 0.08]],
      noir:            [["#000000", 0.4]],
    };
    const overlays = gradeColors[grade] ?? [];
    for (const [color, alpha] of overlays) {
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.fillRect(0, 0, w, h);
    }
    if (grade === "high-contrast") {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, w, h);
    }
    if (grade === "noir") {
      ctx.globalCompositeOperation = "saturation";
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  /* ── Draw transition effect between two clips ─────────── */
  function drawTransition(ctx: CanvasRenderingContext2D, progress: number, w: number, h: number, type: Transition) {
    if (type === "none" || progress >= 1) return;
    ctx.save();
    const t = easeInOutCubic(progress);
    switch (type) {
      case "fade":
        ctx.fillStyle = hexToRgba("#000000", 1 - t);
        ctx.fillRect(0, 0, w, h);
        break;
      case "dissolve": {
        const dotSize = 8;
        ctx.fillStyle = hexToRgba("#000000", 0.9);
        for (let x = 0; x < w; x += dotSize) {
          for (let y = 0; y < h; y += dotSize) {
            const threshold = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) / 2;
            if (threshold > t) ctx.fillRect(x, y, dotSize, dotSize);
          }
        }
        break;
      }
      case "slide-left":
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(lerp(0, -w, t), 0, w, h);
        break;
      case "slide-right":
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(lerp(0, w, t) - w, 0, w, h);
        break;
      case "wipe":
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(w * t, 0, w * (1 - t), h);
        break;
      case "zoom": {
        const s = lerp(1.3, 1, t);
        ctx.fillStyle = hexToRgba("#000000", 1 - t);
        ctx.translate(w / 2, h / 2);
        ctx.scale(s, s);
        ctx.translate(-w / 2, -h / 2);
        ctx.fillRect(0, 0, w, h);
        break;
      }
      case "push":
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(0, lerp(-h, 0, t) + h, w, h);
        break;
    }
    ctx.restore();
  }

  /* ── Generate waveform-like data for audio clips ────────── */
  function drawWaveform(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, color: string) {
    ctx.save();
    ctx.strokeStyle = hexToRgba(color, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    const mid = y + h / 2;
    for (let i = 0; i < w; i += 2) {
      const amp = (Math.sin(i * 0.15 + seed) * Math.cos(i * 0.07 + seed * 0.3) + Math.sin(i * 0.3 + seed * 2)) * h * 0.35;
      ctx.moveTo(x + i, mid - amp);
      ctx.lineTo(x + i, mid + amp);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ── Draw video frame scene (preview canvas) ────────────── */
  const drawPreviewFrame = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const w = canvasW;
    const h = canvasH;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, w, h);

    // Find which video clip is active at time t
    const activeVideoClips = clips.filter(c => c.type === "video" && t >= c.start && t < c.start + c.duration);
    const activeTextClips = clips.filter(c => c.type === "text" && t >= c.start && t < c.start + c.duration);
    const activeImageClips = clips.filter(c => c.type === "image" && t >= c.start && t < c.start + c.duration);
    const activeAudioClips = clips.filter(c => c.type === "audio" && t >= c.start && t < c.start + c.duration);

    // Render video clip representations
    for (const clip of activeVideoClips) {
      const clipProgress = (t - clip.start) / clip.duration;
      ctx.save();
      ctx.globalAlpha = clip.opacity / 100;

      // Check if we're in a transition zone (start or end)
      const transDur = config.transitionDuration;
      const transInProgress = clamp((t - clip.start) / transDur, 0, 1);
      const transOutProgress = clamp((clip.start + clip.duration - t) / transDur, 0, 1);

      // Generate a visual scene for this clip (simulated)
      const seed = parseInt(clip.id.replace(/\D/g, "").slice(-6), 10) || 0;
      drawVideoScene(ctx, w, h, clipProgress, clip.name, seed);

      // Apply transition at clip start
      if (transInProgress < 1) {
        drawTransition(ctx, transInProgress, w, h, config.transition);
      }
      // Apply transition at clip end
      if (transOutProgress < 1) {
        drawTransition(ctx, transOutProgress, w, h, config.transition);
      }

      ctx.restore();
    }

    // Render image clips
    for (const clip of activeImageClips) {
      ctx.save();
      ctx.globalAlpha = clip.opacity / 100;
      // Draw image placeholder
      const pad = 80;
      ctx.fillStyle = hexToRgba("#a855f7", 0.15);
      ctx.fillRect(pad, pad, w - pad * 2, h - pad * 2);
      ctx.strokeStyle = hexToRgba("#a855f7", 0.4);
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
      ctx.setLineDash([]);
      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 24px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`📷 ${clip.name}`, w / 2, h / 2);
      ctx.restore();
    }

    // Render text overlays
    for (const clip of activeTextClips) {
      ctx.save();
      ctx.globalAlpha = clip.opacity / 100;
      const text = clip.textContent || clip.name;
      const size = clip.fontSize || 64;
      ctx.font = `bold ${size}px Inter, system-ui, sans-serif`;
      ctx.textAlign = (clip.textAlign as CanvasTextAlign) || "center";
      ctx.textBaseline = "middle";

      // Text shadow
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(text, w / 2 + 3, h / 2 + 3);

      // Main text
      ctx.fillStyle = clip.fontColor || "#ffffff";
      ctx.fillText(text, w / 2, h / 2);
      ctx.restore();
    }

    // Audio indicator (waveform overlay at bottom)
    if (activeAudioClips.length > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      const barH = 40;
      ctx.fillStyle = hexToRgba("#22c55e", 0.08);
      ctx.fillRect(0, h - barH - 20, w, barH);
      drawWaveform(ctx, 20, h - barH - 20, w - 40, barH, t * 5, "#22c55e");
      ctx.restore();
    }

    // Apply color grading
    applyColorGrade(ctx, config.colorGrade, w, h);

    // Timecode overlay
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundRect(ctx, 16, 16, 160, 32, 6);
    ctx.fill();
    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#8ae600";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`⏱ ${fmtTime(t)} / ${fmtTime(totalDuration)}`, 28, 32);
    ctx.restore();

    // If no clips at current time, show "no content" indicator
    if (activeVideoClips.length === 0 && activeTextClips.length === 0 && activeImageClips.length === 0) {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = "bold 20px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No clip at this position", w / 2, h / 2);
      ctx.font = "14px Inter, system-ui, sans-serif";
      ctx.fillText("Add video, image, or text clips to the timeline", w / 2, h / 2 + 30);
      ctx.restore();
    }
  }, [clips, config, canvasW, canvasH, totalDuration]);

  /* ── Generate a simulated video scene for a clip ────────── */
  function drawVideoScene(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number, name: string, seed: number) {
    // Create visual content that represents different scenes
    const hue = (seed * 47) % 360;
    const sat = 50 + (seed % 30);

    // Gradient background scene
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, `hsla(${hue}, ${sat}%, 15%, 1)`);
    grad.addColorStop(0.5, `hsla(${(hue + 30) % 360}, ${sat}%, 20%, 1)`);
    grad.addColorStop(1, `hsla(${(hue + 60) % 360}, ${sat}%, 12%, 1)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Animated geometric shapes
    const shapeCount = 6 + (seed % 5);
    for (let i = 0; i < shapeCount; i++) {
      const sx = ((seed * (i + 1) * 137) % w);
      const sy = ((seed * (i + 1) * 89) % h);
      const size = 40 + ((seed * (i + 1)) % 120);
      const alpha = 0.05 + (i % 4) * 0.03;
      const drift = Math.sin(progress * Math.PI * 2 + i) * 20;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsla(${(hue + i * 40) % 360}, 60%, 60%, 1)`;
      ctx.translate(sx + drift, sy + drift * 0.5);
      ctx.rotate(progress * Math.PI * 0.5 + i);

      if (i % 3 === 0) {
        ctx.fillRect(-size / 2, -size / 2, size, size);
      } else if (i % 3 === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Subtle grid overlay
    ctx.save();
    ctx.strokeStyle = `hsla(${hue}, 30%, 40%, 0.05)`;
    ctx.lineWidth = 1;
    const gridSize = 60;
    const gridOffset = (progress * 30) % gridSize;
    for (let x = gridOffset; x < w; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = gridOffset; y < h; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();

    // Light flare
    const flareX = w * 0.3 + Math.sin(progress * Math.PI) * w * 0.2;
    const flareY = h * 0.3;
    const flareGrad = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, 200);
    flareGrad.addColorStop(0, `hsla(${hue}, 80%, 80%, 0.12)`);
    flareGrad.addColorStop(1, `hsla(${hue}, 80%, 80%, 0)`);
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, 0, w, h);

    // Clip name label
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    roundRect(ctx, w - 220, h - 52, 200, 32, 6);
    ctx.fill();
    ctx.font = "bold 13px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(`🎬 ${name}`, w - 36, h - 36);
    ctx.restore();
  }

  /* ── Draw Timeline Canvas ──────────────────────────────── */
  const drawTimeline = useCallback((tlCtx: CanvasRenderingContext2D) => {
    const w = TIMELINE_W * 2; // 2x for retina
    const h = TIMELINE_H * 2;
    const scale = 2;
    tlCtx.clearRect(0, 0, w, h);

    // Background
    tlCtx.fillStyle = "#0f0f0f";
    tlCtx.fillRect(0, 0, w, h);

    const pxPerSec = ((w - LABEL_W * scale) / Math.max(totalDuration * 1.1, 5)) * timelineZoom;
    const ox = LABEL_W * scale; // offset for labels

    // ── Ruler ──
    tlCtx.fillStyle = "#1a1a1a";
    tlCtx.fillRect(0, 0, w, RULER_H * scale);
    tlCtx.strokeStyle = "#333";
    tlCtx.lineWidth = 1;
    tlCtx.beginPath();
    tlCtx.moveTo(0, RULER_H * scale);
    tlCtx.lineTo(w, RULER_H * scale);
    tlCtx.stroke();

    // Time marks
    const step = totalDuration <= 10 ? 1 : totalDuration <= 30 ? 2 : totalDuration <= 60 ? 5 : 10;
    for (let t = 0; t <= totalDuration + step; t += step) {
      const x = ox + t * pxPerSec;
      if (x > w) break;
      tlCtx.strokeStyle = "#444";
      tlCtx.lineWidth = 1;
      tlCtx.beginPath();
      tlCtx.moveTo(x, RULER_H * scale * 0.4);
      tlCtx.lineTo(x, RULER_H * scale);
      tlCtx.stroke();

      tlCtx.font = `${10 * scale}px 'JetBrains Mono', monospace`;
      tlCtx.fillStyle = "#888";
      tlCtx.textAlign = "center";
      tlCtx.fillText(`${t}s`, x, RULER_H * scale * 0.35);
    }

    // Sub-second ticks
    const subStep = step <= 2 ? 0.5 : 1;
    for (let t = 0; t <= totalDuration + subStep; t += subStep) {
      const x = ox + t * pxPerSec;
      if (x > w) break;
      tlCtx.strokeStyle = "#2a2a2a";
      tlCtx.lineWidth = 1;
      tlCtx.beginPath();
      tlCtx.moveTo(x, RULER_H * scale * 0.7);
      tlCtx.lineTo(x, RULER_H * scale);
      tlCtx.stroke();
    }

    // ── Tracks ──
    const tracks: { type: ClipType; label: string; icon: string; color: string }[] = [
      { type: "video", label: "V1", icon: "🎬", color: TRACK_COLORS.video },
      { type: "image", label: "IMG", icon: "🖼️", color: TRACK_COLORS.image },
      { type: "text",  label: "TXT", icon: "T",  color: TRACK_COLORS.text },
      { type: "audio", label: "A1",  icon: "🎵", color: TRACK_COLORS.audio },
    ];

    tracks.forEach((track, ti) => {
      const ty = (RULER_H + TRACK_GAP + ti * (TRACK_H + TRACK_GAP)) * scale;
      const th = TRACK_H * scale;

      // Track background
      tlCtx.fillStyle = "#141414";
      tlCtx.fillRect(ox, ty, w - ox, th);

      // Track label
      tlCtx.fillStyle = "#1a1a1a";
      tlCtx.fillRect(0, ty, ox, th);
      tlCtx.font = `bold ${10 * scale}px Inter, system-ui, sans-serif`;
      tlCtx.fillStyle = hexToRgba(track.color, 0.8);
      tlCtx.textAlign = "center";
      tlCtx.textBaseline = "middle";
      tlCtx.fillText(`${track.icon} ${track.label}`, ox / 2, ty + th / 2);

      // Clips on this track
      const trackClips = clips.filter(c => c.type === track.type);
      for (const clip of trackClips) {
        const cx = ox + clip.start * pxPerSec;
        const cw = clip.duration * pxPerSec;
        const isSelected = clip.id === selectedClipId;

        // Clip body
        tlCtx.save();
        tlCtx.fillStyle = hexToRgba(clip.color, isSelected ? 0.9 : 0.6);
        const radius = 4 * scale;
        roundRect(tlCtx, cx, ty + 2 * scale, cw, th - 4 * scale, radius);
        tlCtx.fill();

        // Selection ring
        if (isSelected) {
          tlCtx.strokeStyle = "#ffffff";
          tlCtx.lineWidth = 2 * scale;
          roundRect(tlCtx, cx, ty + 2 * scale, cw, th - 4 * scale, radius);
          tlCtx.stroke();
        }

        // Clip label
        if (cw > 40 * scale) {
          tlCtx.font = `bold ${9 * scale}px Inter, system-ui, sans-serif`;
          tlCtx.fillStyle = "#ffffff";
          tlCtx.textAlign = "left";
          tlCtx.textBaseline = "middle";
          const maxLabelW = cw - 12 * scale;
          const label = clip.name;
          tlCtx.save();
          tlCtx.beginPath();
          tlCtx.rect(cx + 6 * scale, ty, maxLabelW, th);
          tlCtx.clip();
          tlCtx.fillText(label, cx + 6 * scale, ty + th / 2);
          tlCtx.restore();
        }

        // Audio waveform inside audio clips
        if (clip.type === "audio" && cw > 20 * scale) {
          const seed = parseInt(clip.id.replace(/\D/g, "").slice(-4), 10) || 1;
          tlCtx.save();
          tlCtx.beginPath();
          tlCtx.rect(cx, ty, cw, th);
          tlCtx.clip();
          drawWaveform(tlCtx, cx + 4 * scale, ty + 4 * scale, cw - 8 * scale, th - 8 * scale, seed, "#ffffff");
          tlCtx.restore();
        }

        tlCtx.restore();
      }
    });

    // ── Playhead ──
    const phX = ox + playhead * pxPerSec;
    tlCtx.strokeStyle = "#8ae600";
    tlCtx.lineWidth = 2 * scale;
    tlCtx.beginPath();
    tlCtx.moveTo(phX, 0);
    tlCtx.lineTo(phX, h);
    tlCtx.stroke();

    // Playhead triangle
    tlCtx.fillStyle = "#8ae600";
    tlCtx.beginPath();
    tlCtx.moveTo(phX - 6 * scale, 0);
    tlCtx.lineTo(phX + 6 * scale, 0);
    tlCtx.lineTo(phX, 10 * scale);
    tlCtx.closePath();
    tlCtx.fill();
  }, [clips, playhead, selectedClipId, totalDuration, timelineZoom]);

  /* ── Canvas initialization & render loop ───────────────── */
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    cvs.width = canvasW;
    cvs.height = canvasH;
    const ctx = cvs.getContext("2d", { alpha: false });
    if (ctx) drawPreviewFrame(ctx, playhead);
  }, [canvasW, canvasH, drawPreviewFrame, playhead]);

  // Timeline canvas
  useEffect(() => {
    const cvs = timelineCanvasRef.current;
    if (!cvs) return;
    cvs.width = TIMELINE_W * 2;
    cvs.height = TIMELINE_H * 2;
    const ctx = cvs.getContext("2d");
    if (ctx) drawTimeline(ctx);
  }, [drawTimeline]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      setPlayhead(prev => {
        const next = prev + dt;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, totalDuration]);

  /* ── Clip Operations ───────────────────────────────────── */
  const addClip = (type: ClipType) => {
    const lastEnd = Math.max(...clips.filter(c => c.type === type).map(c => c.start + c.duration), 0);
    const defaults: Partial<Clip> = {};
    if (type === "text") {
      defaults.textContent = "YOUR TEXT";
      defaults.fontSize = 64;
      defaults.fontColor = "#ffffff";
      defaults.textAlign = "center";
    }
    setClips(p => [...p, {
      id: nextId(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${clips.filter(c => c.type === type).length + 1}`,
      type,
      start: lastEnd,
      duration: type === "text" ? 3 : 5,
      color: TRACK_COLORS[type],
      volume: type === "audio" ? 80 : 100,
      opacity: 100,
      ...defaults,
    }]);
  };

  const removeClip = (id: string) => {
    setClips(p => p.filter(c => c.id !== id));
    if (selectedClipId === id) setSelectedClipId(null);
  };

  const duplicateClip = (id: string) => {
    const clip = clips.find(c => c.id === id);
    if (!clip) return;
    setClips(p => [...p, { ...clip, id: nextId(), name: `${clip.name} (copy)`, start: clip.start + clip.duration }]);
  };

  const splitClipAtPlayhead = () => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;
    if (playhead <= clip.start || playhead >= clip.start + clip.duration) return;

    const splitPoint = playhead - clip.start;
    const newClip1: Clip = { ...clip, duration: splitPoint };
    const newClip2: Clip = { ...clip, id: nextId(), name: `${clip.name} (B)`, start: playhead, duration: clip.duration - splitPoint };
    setClips(p => [...p.filter(c => c.id !== selectedClipId), newClip1, newClip2]);
  };

  const updateClip = (id: string, updates: Partial<Clip>) => {
    setClips(p => p.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  /* ── AI Smart Cut ──────────────────────────────────────── */
  const aiSmartCut = async () => {
    setAiLoading(true);
    setAiSuggestion("");
    try {
      const clipSummary = clips.map(c => `${c.type}: "${c.name}" from ${c.start}s for ${c.duration}s`).join("; ");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are an expert video editor AI. Analyze this timeline and suggest smart editing improvements. Timeline (total ${totalDuration}s): ${clipSummary}. Project: ${config.aspectRatio} ${config.resolution} ${config.fps}fps, color grade: ${config.colorGrade}, transitions: ${config.transition}. Suggest 3-5 specific edits: cut points, transition changes, pacing improvements, text timing, audio volume adjustments. Format as numbered list. Be specific with timecodes.`,
          }],
        }),
      });
      const data = await res.json();
      const text = cleanAIText(data.choices?.[0]?.message?.content || data.result || "Could not generate suggestions.");
      setAiSuggestion(text);
    } catch {
      setAiSuggestion("AI service unavailable. Try again later.");
    }
    setAiLoading(false);
  };

  /* ── Timeline Click Handler ────────────────────────────── */
  const handleTimelineClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * TIMELINE_W * 2;
    const y = (e.clientY - rect.top) / rect.height * TIMELINE_H * 2;
    const scale = 2;
    const ox = LABEL_W * scale;
    const pxPerSec = ((TIMELINE_W * 2 - ox) / Math.max(totalDuration * 1.1, 5)) * timelineZoom;

    // Check if click is on ruler → seek
    if (y < RULER_H * scale) {
      const t = (x - ox) / pxPerSec;
      setPlayhead(clamp(t, 0, totalDuration));
      return;
    }

    // Check if click is on a clip
    const tracks: ClipType[] = ["video", "image", "text", "audio"];
    for (let ti = 0; ti < tracks.length; ti++) {
      const ty = (RULER_H + TRACK_GAP + ti * (TRACK_H + TRACK_GAP)) * scale;
      const th = TRACK_H * scale;
      if (y >= ty && y < ty + th) {
        const trackClips = clips.filter(c => c.type === tracks[ti]);
        for (const clip of trackClips) {
          const cx = ox + clip.start * pxPerSec;
          const cw = clip.duration * pxPerSec;
          if (x >= cx && x < cx + cw) {
            setSelectedClipId(clip.id);
            return;
          }
        }
        // Clicked on empty space in track — deselect
        setSelectedClipId(null);
        // Also seek to that position
        const t = (x - ox) / pxPerSec;
        setPlayhead(clamp(t, 0, totalDuration));
        return;
      }
    }
    setSelectedClipId(null);
  };

  /* ── Export as PNG snapshot ─────────────────────────────── */
  const exportFrame = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const link = document.createElement("a");
    link.download = `video-frame-${fmtTime(playhead).replace(/[:.]/g, "-")}.png`;
    link.href = cvs.toDataURL("image/png");
    link.click();
  };

  /* ── Keyboard Shortcuts ────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          setIsPlaying(p => !p);
          break;
        case "j":
          setPlayhead(p => clamp(p - 2, 0, totalDuration));
          break;
        case "k":
          setIsPlaying(p => !p);
          break;
        case "l":
          setPlayhead(p => clamp(p + 2, 0, totalDuration));
          break;
        case "s":
          if (!e.ctrlKey && !e.metaKey) splitClipAtPlayhead();
          break;
        case "Delete":
        case "Backspace":
          if (selectedClipId) removeClip(selectedClipId);
          break;
        case "ArrowLeft":
          setPlayhead(p => clamp(p - (1 / config.fps), 0, totalDuration));
          break;
        case "ArrowRight":
          setPlayhead(p => clamp(p + (1 / config.fps), 0, totalDuration));
          break;
        case "Home":
          setPlayhead(0);
          break;
        case "End":
          setPlayhead(totalDuration);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalDuration, selectedClipId, config.fps]);

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */

  const leftPanel = (
    <div className="space-y-4">
      {/* ── Project Settings ─────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconVideo className="size-4 text-primary-500" />
          Project Settings
        </h3>

        <label className="block text-xs text-gray-500 dark:text-gray-400">Aspect Ratio</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(ASPECT_DIMS) as AspectRatio[]).map(ar => (
            <button key={ar} onClick={() => setConfig(p => ({ ...p, aspectRatio: ar }))}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                config.aspectRatio === ar ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}>{ar}</button>
          ))}
        </div>

        <label className="block text-xs text-gray-500 dark:text-gray-400">Resolution</label>
        <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
          value={config.resolution} onChange={e => setConfig(p => ({ ...p, resolution: e.target.value as Resolution }))}>
          {RESOLUTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>

        <label className="block text-xs text-gray-500 dark:text-gray-400">Frame Rate</label>
        <div className="flex gap-1.5">
          {FPS_OPTIONS.map(fps => (
            <button key={fps} onClick={() => setConfig(p => ({ ...p, fps }))}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                config.fps === fps ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}>{fps}</button>
          ))}
        </div>

        <label className="block text-xs text-gray-500 dark:text-gray-400">Background Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={config.bgColor} onChange={e => setConfig(p => ({ ...p, bgColor: e.target.value }))}
            className="size-8 rounded cursor-pointer border border-gray-300 dark:border-gray-600" />
          <span className="text-xs font-mono text-gray-400">{config.bgColor}</span>
        </div>
      </div>

      {/* ── Transitions ──────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconLayers className="size-4 text-info" />
          Transitions
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {TRANSITIONS.map(tr => (
            <button key={tr.id} onClick={() => setConfig(p => ({ ...p, transition: tr.id }))}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                config.transition === tr.id ? "bg-info text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}>{tr.name}</button>
          ))}
        </div>
        <label className="block text-xs text-gray-500 dark:text-gray-400">Duration: {config.transitionDuration}s</label>
        <input type="range" min={0.1} max={2} step={0.1} value={config.transitionDuration}
          onChange={e => setConfig(p => ({ ...p, transitionDuration: Number(e.target.value) }))}
          className="w-full accent-info" />
      </div>

      {/* ── Color Grading ────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconDroplet className="size-4 text-secondary-500" />
          Color Grading
        </h3>
        <div className="space-y-1">
          {COLOR_GRADES.map(cg => (
            <button key={cg.id} onClick={() => setConfig(p => ({ ...p, colorGrade: cg.id }))}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                config.colorGrade === cg.id
                  ? "bg-secondary-500/20 text-secondary-400 ring-1 ring-secondary-500/40"
                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-300"
              }`}>
              <span className="font-medium">{cg.name}</span>
              <span className="ml-2 text-gray-500">{cg.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Add Media ────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconPlus className="size-4 text-success" />
          Add Media
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {([
            { type: "video" as ClipType, icon: <IconVideo className="size-3.5" />, label: "Video", color: "text-info" },
            { type: "audio" as ClipType, icon: <IconMusic className="size-3.5" />, label: "Audio", color: "text-success" },
            { type: "text" as ClipType, icon: <IconType className="size-3.5" />, label: "Text", color: "text-warning" },
            { type: "image" as ClipType, icon: <IconImage className="size-3.5" />, label: "Image", color: "text-[#a855f7]" },
          ]).map(item => (
            <button key={item.type} onClick={() => addClip(item.type)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <span className={item.color}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Smart Cut ─────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconSparkles className="size-4 text-primary-500" />
          AI Smart Edit
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          AI will analyze your timeline and suggest smart cuts, transitions, pacing, and volume adjustments.
        </p>
        <button onClick={aiSmartCut} disabled={aiLoading || clips.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {aiLoading ? <><IconLoader className="size-4 animate-spin" />Analyzing…</> : <><IconWand className="size-4" />Analyze Timeline</>}
        </button>
        {aiSuggestion && (
          <div className="mt-2 rounded-lg bg-primary-500/5 border border-primary-500/20 p-3">
            <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{aiSuggestion}</p>
          </div>
        )}
      </div>

      {/* ── Export ────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconDownload className="size-4 text-primary-500" />
          Export
        </h3>
        <label className="block text-xs text-gray-500 dark:text-gray-400">Format</label>
        <div className="flex gap-1.5">
          {(["mp4", "webm", "gif"] as ExportFormat[]).map(f => (
            <button key={f} onClick={() => setConfig(p => ({ ...p, exportFormat: f }))}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium uppercase transition-colors ${
                config.exportFormat === f ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}>{f}</button>
          ))}
        </div>
        <button onClick={exportFrame}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <IconCamera className="size-4" />
          Export Current Frame (PNG)
        </button>
        <p className="text-[10px] text-gray-500 text-center">Full video export requires server-side rendering (coming soon)</p>
      </div>
    </div>
  );

  /* ── Right Panel (Clip Properties) ─────────────────────── */
  const rightPanel = (
    <div className="space-y-4">
      {/* ── Clip List ────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconLayers className="size-4 text-primary-500" />
          Clips ({clips.length})
        </h3>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {clips.sort((a, b) => a.start - b.start).map(clip => (
            <button key={clip.id} onClick={() => setSelectedClipId(clip.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
                selectedClipId === clip.id ? "bg-gray-200 dark:bg-gray-700 ring-1 ring-primary-500/40" : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}>
              <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: clip.color }} />
              <span className="text-xs font-medium text-gray-900 dark:text-white truncate flex-1">{clip.name}</span>
              <span className="text-[10px] text-gray-400 font-mono shrink-0">{clip.duration.toFixed(1)}s</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Selected Clip Properties ─────────────────────── */}
      {selectedClip && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Clip Properties</h3>

          <label className="block text-xs text-gray-500 dark:text-gray-400">Name</label>
          <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            value={selectedClip.name} onChange={e => updateClip(selectedClip.id, { name: e.target.value })} />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">Start (s)</label>
              <input type="number" step="0.1" min="0" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                value={selectedClip.start} onChange={e => updateClip(selectedClip.id, { start: Math.max(0, Number(e.target.value)) })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">Duration (s)</label>
              <input type="number" step="0.1" min="0.1" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                value={selectedClip.duration} onChange={e => updateClip(selectedClip.id, { duration: Math.max(0.1, Number(e.target.value)) })} />
            </div>
          </div>

          <label className="block text-xs text-gray-500 dark:text-gray-400">Opacity: {selectedClip.opacity}%</label>
          <input type="range" min={0} max={100} value={selectedClip.opacity}
            onChange={e => updateClip(selectedClip.id, { opacity: Number(e.target.value) })}
            className="w-full accent-primary-500" />

          {(selectedClip.type === "video" || selectedClip.type === "audio") && (
            <>
              <label className="block text-xs text-gray-500 dark:text-gray-400">Volume: {selectedClip.volume}%</label>
              <input type="range" min={0} max={100} value={selectedClip.volume}
                onChange={e => updateClip(selectedClip.id, { volume: Number(e.target.value) })}
                className="w-full accent-success" />
            </>
          )}

          {selectedClip.type === "text" && (
            <>
              <label className="block text-xs text-gray-500 dark:text-gray-400">Text Content</label>
              <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                value={selectedClip.textContent || ""} onChange={e => updateClip(selectedClip.id, { textContent: e.target.value })} />

              <label className="block text-xs text-gray-500 dark:text-gray-400">Font Size: {selectedClip.fontSize}px</label>
              <input type="range" min={16} max={200} value={selectedClip.fontSize || 64}
                onChange={e => updateClip(selectedClip.id, { fontSize: Number(e.target.value) })}
                className="w-full accent-warning" />

              <label className="block text-xs text-gray-500 dark:text-gray-400">Text Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={selectedClip.fontColor || "#ffffff"}
                  onChange={e => updateClip(selectedClip.id, { fontColor: e.target.value })}
                  className="size-8 rounded cursor-pointer border border-gray-300 dark:border-gray-600" />
                <span className="text-xs font-mono text-gray-400">{selectedClip.fontColor || "#ffffff"}</span>
              </div>

              <label className="block text-xs text-gray-500 dark:text-gray-400">Align</label>
              <div className="flex gap-1.5">
                {(["left", "center", "right"] as const).map(a => (
                  <button key={a} onClick={() => updateClip(selectedClip.id, { textAlign: a })}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      (selectedClip.textAlign || "center") === a ? "bg-warning text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}>{a}</button>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => duplicateClip(selectedClip.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <IconCopy className="size-3" />Duplicate
            </button>
            <button onClick={() => removeClip(selectedClip.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-error hover:bg-error/10 transition-colors">
              <IconTrash className="size-3" />Delete
            </button>
          </div>
        </div>
      )}

      {/* ── Info ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Project Info</h3>
        <div className="grid grid-cols-2 gap-y-1 text-xs">
          <span className="text-gray-400">Duration</span>
          <span className="text-gray-300 font-mono">{fmtTime(totalDuration)}</span>
          <span className="text-gray-400">Clips</span>
          <span className="text-gray-300">{clips.length}</span>
          <span className="text-gray-400">Size</span>
          <span className="text-gray-300">{ASPECT_DIMS[config.aspectRatio].label}</span>
          <span className="text-gray-400">FPS</span>
          <span className="text-gray-300">{config.fps}</span>
          <span className="text-gray-400">Grade</span>
          <span className="text-gray-300">{COLOR_GRADES.find(c => c.id === config.colorGrade)?.name}</span>
        </div>
      </div>
    </div>
  );

  /* ── Toolbar ───────────────────────────────────────────── */
  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={() => setIsPlaying(p => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 transition-colors">
        {isPlaying ? <IconPause className="size-3.5" /> : <IconPlay className="size-3.5" />}
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button onClick={() => { setPlayhead(0); setIsPlaying(false); }}
        className="px-2 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-white transition-colors">
        ⏮ Start
      </button>
      <span className="text-xs font-mono text-primary-500 min-w-24 text-center">{fmtTime(playhead)} / {fmtTime(totalDuration)}</span>
      <button onClick={splitClipAtPlayhead} disabled={!selectedClipId}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
        title="Split selected clip at playhead">
        <IconScissors className="size-3" />Split
      </button>
    </div>
  );

  /* ── Actions Bar (Timeline) ────────────────────────────── */
  const actionsBar = (
    <div className="w-full space-y-2">
      {/* Timeline zoom control */}
      <div className="flex items-center gap-2 justify-between px-1">
        <span className="text-[10px] text-gray-500 font-mono">Timeline Zoom</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setTimelineZoom(p => Math.max(0.3, p - 0.2))}
            className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-white transition-colors">−</button>
          <span className="text-[10px] font-mono text-gray-400 min-w-8 text-center">{Math.round(timelineZoom * 100)}%</span>
          <button onClick={() => setTimelineZoom(p => Math.min(4, p + 0.2))}
            className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-white transition-colors">+</button>
        </div>
      </div>

      {/* Canvas-based timeline */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-black">
        <canvas
          ref={timelineCanvasRef}
          width={TIMELINE_W * 2}
          height={TIMELINE_H * 2}
          style={{ width: TIMELINE_W, height: TIMELINE_H }}
          className="cursor-pointer block"
          onClick={handleTimelineClick}
        />
      </div>

      {/* Keyboard hints */}
      <div className="flex gap-3 flex-wrap text-[10px] text-gray-500 px-1">
        <span><kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400">Space</kbd> Play/Pause</span>
        <span><kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400">J</kbd><kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400 ml-0.5">K</kbd><kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400 ml-0.5">L</kbd> Seek</span>
        <span><kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400">S</kbd> Split</span>
        <span><kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400">←</kbd><kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400 ml-0.5">→</kbd> Frame step</span>
        <span><kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-400">Del</kbd> Delete</span>
      </div>
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={displayW}
      displayHeight={displayH}
      label={`${config.aspectRatio} • ${config.resolution} • ${config.fps}fps — ${fmtTime(totalDuration)}`}
      toolbar={toolbar}
      mobileTabs={["Preview", "Settings", "Clips"]}
      zoom={zoom}
      onZoomIn={() => setZoom(z => Math.min(2, z + 0.1))}
      onZoomOut={() => setZoom(z => Math.max(0.3, z - 0.1))}
      onZoomFit={() => setZoom(1)}
      actionsBar={actionsBar}
    />
  );
}
