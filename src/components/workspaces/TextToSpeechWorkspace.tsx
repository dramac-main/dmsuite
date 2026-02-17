"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconMic,
  IconSparkles,
  IconWand,
  IconLoader,
  IconPlay,
  IconPause,
  IconDownload,
  IconRefresh,
  IconDroplet,
  IconLayout,
  IconCopy,
  IconType,
  IconMusic,
} from "@/components/icons";
import { hexToRgba, roundRect, cleanAIText } from "@/lib/canvas-utils";
import StickyCanvasLayout from "./StickyCanvasLayout";

/* ══════════════════════════════════════════════════════════════
   DMSuite — Text-to-Speech Workspace
   Canvas-based audio waveform visualization with AI script 
   generation, 6 voice profiles, speed/pitch/emphasis controls,
   multi-language support, and real browser SpeechSynthesis API.
   ══════════════════════════════════════════════════════════════ */

/* ── Types ─────────────────────────────────────────────────── */

type VoiceId = "male-deep" | "male-standard" | "female-warm" | "female-professional" | "child" | "narrator";
type OutputFormat = "mp3" | "wav" | "ogg";

interface VoiceOption {
  id: VoiceId;
  label: string;
  description: string;
  color: string;
  pitch: number;  // SpeechSynthesis pitch default
  rate: number;   // SpeechSynthesis rate default
}

/* ── Constants ─────────────────────────────────────────────── */

const VOICES: VoiceOption[] = [
  { id: "male-deep",           label: "Male Deep",           description: "Rich, authoritative tone",    color: "#3b82f6", pitch: 0.7, rate: 0.9 },
  { id: "male-standard",       label: "Male Standard",       description: "Neutral, clear voice",        color: "#06b6d4", pitch: 1.0, rate: 1.0 },
  { id: "female-warm",         label: "Female Warm",         description: "Friendly, approachable",      color: "#f59e0b", pitch: 1.2, rate: 0.95 },
  { id: "female-professional", label: "Female Professional", description: "Crisp, articulate",           color: "#8b5cf6", pitch: 1.1, rate: 1.0 },
  { id: "child",               label: "Child",               description: "Youthful, energetic",         color: "#22c55e", pitch: 1.6, rate: 1.1 },
  { id: "narrator",            label: "Narrator",            description: "Storytelling, dramatic",      color: "#ef4444", pitch: 0.9, rate: 0.85 },
];

const LANGUAGES = [
  { value: "en-US",  label: "English (US)", flag: "🇺🇸" },
  { value: "en-GB",  label: "English (UK)", flag: "🇬🇧" },
  { value: "en-ZA",  label: "English (SA)", flag: "🇿🇦" },
  { value: "fr-FR",  label: "French",       flag: "🇫🇷" },
  { value: "pt-BR",  label: "Portuguese",   flag: "🇧🇷" },
  { value: "es-ES",  label: "Spanish",      flag: "🇪🇸" },
  { value: "de-DE",  label: "German",       flag: "🇩🇪" },
  { value: "sw",     label: "Swahili",      flag: "🇹🇿" },
];

const SCRIPT_TEMPLATES = [
  { id: "intro",       label: "Introduction" },
  { id: "promo",       label: "Promotion" },
  { id: "narration",   label: "Narration" },
  { id: "podcast",     label: "Podcast Opener" },
  { id: "announcement", label: "Announcement" },
  { id: "tutorial",    label: "Tutorial" },
];

const MAX_CHARS = 5000;
const CANVAS_W = 1200;
const CANVAS_H = 600;
const DISPLAY_SCALE = 0.58;

/* ── Helpers ───────────────────────────────────────────────── */

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Generate deterministic pseudo-waveform data from text
function generateWaveformData(text: string, samples: number): number[] {
  const data: number[] = [];
  const len = text.length || 1;
  for (let i = 0; i < samples; i++) {
    const charIdx = Math.floor((i / samples) * len);
    const char = text.charCodeAt(charIdx % len) || 65;
    const base = (char % 40) / 40;
    const wave1 = Math.sin(i * 0.08 + char * 0.1) * 0.3;
    const wave2 = Math.cos(i * 0.15 + char * 0.05) * 0.15;
    const wave3 = Math.sin(i * 0.03) * 0.2;
    const noise = ((char * i * 7) % 100) / 500;
    const value = clamp(base + wave1 + wave2 + wave3 + noise, 0.05, 1);
    data.push(value);

    // Silence gaps at sentence boundaries
    const textProgress = i / samples;
    const textPos = Math.floor(textProgress * len);
    const ch = text[textPos];
    if (ch === "." || ch === "!" || ch === "?") {
      const silenceLen = 4;
      for (let j = 0; j < silenceLen && i + j + 1 < samples; j++) {
        data.push(0.02 + Math.random() * 0.03);
        i++;
      }
    }
  }
  return data.slice(0, samples);
}

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

export default function TextToSpeechWorkspace() {
  /* ── State ─────────────────────────────────────────────── */
  const [text, setText] = useState("Welcome to DMSuite, the ultimate AI-powered design and business creative suite. Whether you're crafting stunning presentations, designing brand materials, or creating social media content — DMSuite has every tool you need to bring your vision to life.");
  const [voiceId, setVoiceId] = useState<VoiceId>("female-professional");
  const [language, setLanguage] = useState("en-US");
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(80);
  const [emphasis, setEmphasis] = useState(false);
  const [ssmlMode, setSsmlMode] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("mp3");
  const [scriptTemplate, setScriptTemplate] = useState("intro");
  const [generating, setGenerating] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0); // 0 to 1
  const [estimatedDuration, setEstimatedDuration] = useState(0); // seconds

  const [zoom, setZoom] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  /* ── Derived ───────────────────────────────────────────── */
  const voice = useMemo(() => VOICES.find(v => v.id === voiceId) ?? VOICES[3], [voiceId]);
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const estimatedTime = useMemo(() => {
    const wpm = 150 * speed; // avg 150 WPM at 1x
    const dur = wordCount > 0 ? (wordCount / wpm) * 60 : 0;
    return dur;
  }, [wordCount, speed]);

  useEffect(() => { setEstimatedDuration(estimatedTime); }, [estimatedTime]);

  const waveformData = useMemo(() => generateWaveformData(text, 300), [text]);
  const displayW = CANVAS_W * DISPLAY_SCALE;
  const displayH = CANVAS_H * DISPLAY_SCALE;

  /* ── Draw Waveform Canvas ──────────────────────────────── */
  const drawCanvas = useCallback((progress: number) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d", { alpha: false });
    if (!ctx) return;

    const w = CANVAS_W;
    const h = CANVAS_H;
    cvs.width = w;
    cvs.height = h;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0a0c10");
    bg.addColorStop(1, "#0f1218");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Waveform area
    const waveY = 100;
    const waveH = 280;
    const midY = waveY + waveH / 2;
    const padX = 60;
    const waveW = w - padX * 2;

    // Center line
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, midY);
    ctx.lineTo(padX + waveW, midY);
    ctx.stroke();

    // Waveform bars
    const samples = waveformData.length;
    const barW = Math.max(2, waveW / samples - 1);
    const barGap = waveW / samples;

    for (let i = 0; i < samples; i++) {
      const x = padX + i * barGap;
      const amp = waveformData[i] * (waveH / 2) * 0.85;
      const barProgress = i / samples;
      const isPlayed = barProgress <= progress;

      // Color based on voice and play state
      if (isPlayed) {
        ctx.fillStyle = voice.color;
      } else {
        ctx.fillStyle = hexToRgba(voice.color, 0.2);
      }

      // Mirror waveform (top + bottom)
      roundRect(ctx, x, midY - amp, barW, amp, 1);
      ctx.fill();
      roundRect(ctx, x, midY, barW, amp * 0.7, 1);
      ctx.fill();
    }

    // Playhead line
    if (progress > 0 && progress < 1) {
      const phX = padX + progress * waveW;
      ctx.strokeStyle = voice.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(phX, waveY - 10);
      ctx.lineTo(phX, waveY + waveH + 10);
      ctx.stroke();

      // Playhead glow
      const glow = ctx.createRadialGradient(phX, midY, 0, phX, midY, 30);
      glow.addColorStop(0, hexToRgba(voice.color, 0.2));
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(phX - 30, waveY, 60, waveH);
    }

    // ── Top info bar ──
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    roundRect(ctx, 20, 16, 400, 44, 10);
    ctx.fill();

    ctx.font = "bold 14px Inter, system-ui, sans-serif";
    ctx.fillStyle = voice.color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`🎙️ ${voice.label}`, 36, 38);

    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#8ae600";
    ctx.fillText(`${fmtTime(progress * estimatedDuration)} / ${fmtTime(estimatedDuration)}`, 200, 38);

    ctx.fillStyle = "#666";
    ctx.fillText(`${wordCount} words • ${speed.toFixed(1)}x`, 320, 38);

    // ── Bottom info ──
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    roundRect(ctx, 20, h - 80, w - 40, 60, 10);
    ctx.fill();

    // Text preview (scrolling with progress)
    ctx.save();
    ctx.beginPath();
    ctx.rect(30, h - 75, w - 60, 50);
    ctx.clip();

    ctx.font = "13px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#888";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const words = text.split(/\s+/);
    const currentWordIdx = Math.floor(progress * words.length);
    const visibleStart = Math.max(0, currentWordIdx - 8);
    const visibleEnd = Math.min(words.length, currentWordIdx + 20);

    let xPos = 40;
    for (let i = visibleStart; i < visibleEnd; i++) {
      const word = words[i] + " ";
      const metrics = ctx.measureText(word);
      if (xPos + metrics.width > w - 40) break;

      if (i < currentWordIdx) {
        ctx.fillStyle = hexToRgba(voice.color, 0.8);
      } else if (i === currentWordIdx) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Inter, system-ui, sans-serif";
      } else {
        ctx.fillStyle = "#555";
        ctx.font = "13px Inter, system-ui, sans-serif";
      }
      ctx.fillText(word, xPos, h - 50);
      xPos += metrics.width;
    }
    ctx.restore();

    // Language / format badge
    const lang = LANGUAGES.find(l => l.value === language);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundRect(ctx, w - 200, 20, 180, 36, 8);
    ctx.fill();
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#aaa";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(`${lang?.flag || "🌐"} ${lang?.label || language} • ${outputFormat.toUpperCase()}`, w - 30, 38);

    // Volume meter
    const volBarW = 6;
    const volBarH = 80;
    const volX = w - 34;
    const volY = h - 190;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    roundRect(ctx, volX, volY, volBarW, volBarH, 3);
    ctx.fill();
    const volFill = (volume / 100) * volBarH;
    ctx.fillStyle = hexToRgba(voice.color, 0.5);
    roundRect(ctx, volX, volY + volBarH - volFill, volBarW, volFill, 3);
    ctx.fill();
    ctx.font = "9px Inter, sans-serif";
    ctx.fillStyle = "#555";
    ctx.textAlign = "center";
    ctx.fillText("VOL", volX + volBarW / 2, volY - 8);

    // Emphasis indicator
    if (emphasis) {
      ctx.fillStyle = hexToRgba("#f59e0b", 0.15);
      roundRect(ctx, w - 100, h - 88, 70, 18, 4);
      ctx.fill();
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.fillStyle = "#f59e0b";
      ctx.textAlign = "center";
      ctx.fillText("EMPHASIS", w - 65, h - 78);
    }

  }, [waveformData, voice, estimatedDuration, wordCount, speed, text, language, outputFormat, volume, emphasis]);

  /* ── Canvas render on state change ─────────────────────── */
  useEffect(() => {
    drawCanvas(playProgress);
  }, [drawCanvas, playProgress]);

  /* ── Playback with browser SpeechSynthesis ─────────────── */
  const startPlayback = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      // Fallback: simulated playback
      setIsPlaying(true);
      setPlayProgress(0);
      return;
    }

    // Stop any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = speed * voice.rate;
    utterance.pitch = clamp(voice.pitch + pitch * 0.1, 0.1, 2);
    utterance.volume = volume / 100;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.startsWith(language.split("-")[0]));
    if (langVoice) utterance.voice = langVoice;

    utterance.onstart = () => {
      setIsPlaying(true);
      setPlayProgress(0);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setPlayProgress(1);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [text, language, speed, voice, pitch, volume]);

  const stopPlayback = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setPlayProgress(0);
  }, []);

  // Simulated progress animation (since SpeechSynthesis doesn't give progress events easily)
  useEffect(() => {
    if (!isPlaying) return;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      setPlayProgress(prev => {
        const next = prev + dt / Math.max(estimatedDuration, 1);
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, estimatedDuration]);

  /* ── AI Script Generation ──────────────────────────────── */
  const generateScript = async () => {
    setGenerating(true);
    try {
      const lang = LANGUAGES.find(l => l.value === language)?.label || "English";
      const template = SCRIPT_TEMPLATES.find(t => t.id === scriptTemplate)?.label || "Introduction";
      const voiceDesc = voice.description;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate a compelling ${template.toLowerCase()} script suitable for text-to-speech in ${lang}. The voice character is "${voice.label}" (${voiceDesc}), so match the tone appropriately. Keep it under 300 words. Use natural pacing with appropriate pauses (periods, commas). Do NOT include any stage directions, speaker names, or formatting. Return ONLY the script text that should be spoken aloud.`,
          }],
        }),
      });
      const raw = await res.text();
      const cleaned = cleanAIText(raw);
      setText(cleaned);
    } catch { /* ignore */ }
    setGenerating(false);
  };

  /* ── Export ─────────────────────────────────────────────── */
  const exportFrame = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const link = document.createElement("a");
    link.download = `tts-waveform-${voice.label.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = cvs.toDataURL("image/png");
    link.click();
  };

  const copyText = () => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */

  const leftPanel = (
    <div className="space-y-4">
      {/* ── Voice Selection ──────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconMic className="size-4 text-primary-500" />
          Voice
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {VOICES.map(v => (
            <button key={v.id} onClick={() => setVoiceId(v.id)}
              className={`p-2.5 rounded-lg text-left transition-all ${
                voiceId === v.id
                  ? "ring-2 ring-offset-1 ring-offset-gray-900"
                  : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-600"
              }`}
              style={voiceId === v.id ? { backgroundColor: hexToRgba(v.color, 0.15), borderColor: v.color } : {}}>
              <span className="text-xs font-semibold text-gray-900 dark:text-white block">{v.label}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5">{v.description}</span>
              <span className="inline-block size-2 rounded-full mt-1" style={{ backgroundColor: v.color }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Language ─────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Language</h3>
        <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
          value={language} onChange={e => setLanguage(e.target.value)}>
          {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.flag} {l.label}</option>)}
        </select>
      </div>

      {/* ── Controls ─────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Audio Controls</h3>

        <label className="block text-xs text-gray-500 dark:text-gray-400">Speed: {speed.toFixed(1)}x</label>
        <input type="range" min={0.5} max={2} step={0.1} value={speed}
          onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full accent-primary-500" />

        <label className="block text-xs text-gray-500 dark:text-gray-400">Pitch: {pitch > 0 ? `+${pitch}` : pitch}</label>
        <input type="range" min={-10} max={10} step={1} value={pitch}
          onChange={e => setPitch(parseInt(e.target.value))} className="w-full accent-primary-500" />

        <label className="block text-xs text-gray-500 dark:text-gray-400">Volume: {volume}%</label>
        <input type="range" min={0} max={100} step={5} value={volume}
          onChange={e => setVolume(Number(e.target.value))} className="w-full accent-success" />

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-300">Emphasis</span>
          <button onClick={() => setEmphasis(!emphasis)}
            className={`w-9 h-5 rounded-full transition-colors ${emphasis ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${emphasis ? "translate-x-4.5" : "translate-x-0.5"}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-300">SSML Mode</span>
          <button onClick={() => setSsmlMode(!ssmlMode)}
            className={`w-9 h-5 rounded-full transition-colors ${ssmlMode ? "bg-info" : "bg-gray-300 dark:bg-gray-600"}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${ssmlMode ? "translate-x-4.5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      {/* ── AI Script Generator ──────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconSparkles className="size-4 text-primary-500" />
          AI Script Generator
        </h3>
        <label className="block text-xs text-gray-500 dark:text-gray-400">Script Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {SCRIPT_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setScriptTemplate(t.id)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                scriptTemplate === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}>{t.label}</button>
          ))}
        </div>
        <button onClick={generateScript} disabled={generating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {generating ? <><IconLoader className="size-4 animate-spin" />Generating…</> : <><IconWand className="size-4" />Generate Script</>}
        </button>
      </div>

      {/* ── Export ────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconDownload className="size-4 text-primary-500" />
          Export
        </h3>
        <div className="flex gap-1.5">
          {(["mp3", "wav", "ogg"] as OutputFormat[]).map(f => (
            <button key={f} onClick={() => setOutputFormat(f)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium uppercase transition-colors ${
                outputFormat === f ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300"
              }`}>{f}</button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 text-center">Audio export requires server-side processing (coming soon)</p>
      </div>
    </div>
  );

  /* ── Right Panel (Text Editor) ─────────────────────────── */
  const rightPanel = (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <IconType className="size-4 text-primary-500" />
            Script Text
          </h3>
          <button onClick={copyText}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
            <IconCopy className="size-3" />Copy
          </button>
        </div>
        <textarea
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none font-mono leading-relaxed"
          rows={14}
          maxLength={MAX_CHARS}
          placeholder={ssmlMode
            ? '<speak>\n  <p>Hello, welcome to <emphasis level="strong">DMSuite</emphasis>.</p>\n</speak>'
            : "Type or paste your text here, or use the AI Generate Script button…"
          }
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters</span>
          <span>{wordCount} words • ~{fmtTime(estimatedDuration)}</span>
        </div>
        {ssmlMode && (
          <div className="px-2 py-1.5 rounded-lg bg-info/10 border border-info/20">
            <p className="text-[10px] text-info font-medium">SSML mode active — use SSML tags for advanced control</p>
          </div>
        )}
      </div>

      {/* ── Stats ────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Info</h3>
        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <span className="text-gray-500">Words</span>
          <span className="text-gray-300 font-mono">{wordCount}</span>
          <span className="text-gray-500">Characters</span>
          <span className="text-gray-300 font-mono">{text.length}</span>
          <span className="text-gray-500">Est. Duration</span>
          <span className="text-gray-300 font-mono">{fmtTime(estimatedDuration)}</span>
          <span className="text-gray-500">Voice</span>
          <span className="text-gray-300">{voice.label}</span>
          <span className="text-gray-500">Language</span>
          <span className="text-gray-300">{LANGUAGES.find(l => l.value === language)?.label}</span>
          <span className="text-gray-500">Speed</span>
          <span className="text-gray-300 font-mono">{speed.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );

  /* ── Toolbar ───────────────────────────────────────────── */
  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={isPlaying ? stopPlayback : startPlayback} disabled={!text.trim()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors">
        {isPlaying ? <IconPause className="size-3.5" /> : <IconPlay className="size-3.5" />}
        {isPlaying ? "Stop" : "Play"}
      </button>
      <button onClick={() => { setPlayProgress(0); stopPlayback(); }}
        className="px-2 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-white transition-colors">
        <IconRefresh className="size-3.5" />
      </button>
      <span className="text-xs font-mono min-w-20 text-center" style={{ color: voice.color }}>
        {fmtTime(playProgress * estimatedDuration)} / {fmtTime(estimatedDuration)}
      </span>
      <input type="range" min={0} max={1} step={0.001} value={playProgress}
        onChange={e => setPlayProgress(Number(e.target.value))}
        className="flex-1 min-w-32 accent-primary-500" />
    </div>
  );

  const actionsBar = (
    <div className="flex items-center gap-2">
      <button onClick={exportFrame}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors">
        <IconDownload className="size-3" />Export Waveform PNG
      </button>
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={displayW}
      displayHeight={displayH}
      label={`${voice.label} • ${LANGUAGES.find(l => l.value === language)?.label} • ${speed.toFixed(1)}x — ${fmtTime(estimatedDuration)}`}
      toolbar={toolbar}
      mobileTabs={["Waveform", "Settings", "Script"]}
      zoom={zoom}
      onZoomIn={() => setZoom(z => Math.min(2, z + 0.1))}
      onZoomOut={() => setZoom(z => Math.max(0.3, z - 0.1))}
      onZoomFit={() => setZoom(1)}
      actionsBar={actionsBar}
    />
  );
}
