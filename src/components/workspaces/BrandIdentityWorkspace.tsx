"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles,
  IconDownload,
  IconLoader,
  IconCopy,
  IconDroplet,
  IconType,
  IconWand,
  IconCheck,
  IconLayers,
  IconRefresh,
} from "@/components/icons";

/* ── Types ─────────────────────────────────────────────────── */

interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  background: string;
}

interface FontPairing {
  heading: string;
  headingWeight: number;
  body: string;
  bodyWeight: number;
  label: string;
}

interface PatternConfig {
  type: "dots" | "lines" | "grid" | "circles" | "diagonal" | "chevron";
  color: string;
  opacity: number;
}

interface BrandConfig {
  brandName: string;
  tagline: string;
  industry: string;
  personality: string;
  palette: ColorPalette;
  fontPairing: FontPairing;
  pattern: PatternConfig;
}

/* ── Preset Data ──────────────────────────────────────────── */

const industryPresets = [
  "Technology", "Fashion", "Food & Beverage", "Health & Wellness",
  "Finance", "Real Estate", "Education", "Entertainment",
  "E-commerce", "Travel", "Automotive", "Sports",
];

const personalityPresets = [
  "Professional & Trustworthy", "Bold & Innovative", "Elegant & Luxurious",
  "Playful & Friendly", "Minimalist & Clean", "Organic & Natural",
  "Energetic & Dynamic", "Sophisticated & Premium",
];

const palettePresets: ColorPalette[] = [
  { name: "Electric Lime", primary: "#8ae600", secondary: "#06b6d4", accent: "#f59e0b", neutral: "#6b7280", background: "#030712" },
  { name: "Corporate Blue", primary: "#2563eb", secondary: "#1e40af", accent: "#f97316", neutral: "#64748b", background: "#0f172a" },
  { name: "Sunset Warm", primary: "#f97316", secondary: "#ef4444", accent: "#eab308", neutral: "#78716c", background: "#1c1917" },
  { name: "Luxury Gold", primary: "#c09c2c", secondary: "#7c3aed", accent: "#f0e68c", neutral: "#9ca3af", background: "#0a0a0a" },
  { name: "Nature Green", primary: "#16a34a", secondary: "#15803d", accent: "#84cc16", neutral: "#6b7280", background: "#052e16" },
  { name: "Rose Elegant", primary: "#e11d48", secondary: "#f43f5e", accent: "#fb7185", neutral: "#a1a1aa", background: "#18181b" },
  { name: "Ocean Deep", primary: "#0284c7", secondary: "#0369a1", accent: "#22d3ee", neutral: "#94a3b8", background: "#082f49" },
  { name: "Mono Sleek", primary: "#18181b", secondary: "#3f3f46", accent: "#a1a1aa", neutral: "#71717a", background: "#fafafa" },
];

const fontPairings: FontPairing[] = [
  { heading: "'Inter', sans-serif", headingWeight: 800, body: "'Inter', sans-serif", bodyWeight: 400, label: "Inter / Inter" },
  { heading: "'Georgia', serif", headingWeight: 700, body: "'Arial', sans-serif", bodyWeight: 400, label: "Georgia / Arial" },
  { heading: "'Impact', sans-serif", headingWeight: 900, body: "'Helvetica', sans-serif", bodyWeight: 400, label: "Impact / Helvetica" },
  { heading: "'Playfair Display', serif", headingWeight: 700, body: "'Inter', sans-serif", bodyWeight: 400, label: "Playfair / Inter" },
  { heading: "'Courier New', monospace", headingWeight: 700, body: "'Arial', sans-serif", bodyWeight: 400, label: "Courier / Arial" },
  { heading: "'Trebuchet MS', sans-serif", headingWeight: 700, body: "'Georgia', serif", bodyWeight: 400, label: "Trebuchet / Georgia" },
];

const patternTypes: PatternConfig["type"][] = ["dots", "lines", "grid", "circles", "diagonal", "chevron"];

/* ── Canvas Brand Board Renderer ─────────────────────────── */

function renderBrandBoard(canvas: HTMLCanvasElement, config: BrandConfig) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = 1600;
  const H = 1200;
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const p = config.palette;
  const f = config.fontPairing;

  // Background
  ctx.fillStyle = p.background;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid pattern
  ctx.strokeStyle = `${p.neutral}15`;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ─── Header Section ────────────────────────────────────
  ctx.fillStyle = p.primary;
  ctx.fillRect(0, 0, W, 6);

  ctx.save();
  ctx.font = `300 12px ${f.body}`;
  ctx.fillStyle = `${p.neutral}80`;
  ctx.textAlign = "left";
  ctx.fillText("BRAND IDENTITY KIT", 60, 52);

  ctx.font = `${f.headingWeight} 56px ${f.heading}`;
  ctx.fillStyle = p.primary;
  ctx.fillText(config.brandName || "Your Brand", 60, 120);

  if (config.tagline) {
    ctx.font = `400 20px ${f.body}`;
    ctx.fillStyle = `${p.neutral}`;
    ctx.fillText(config.tagline, 60, 158);
  }
  ctx.restore();

  // ─── Color Palette Section ─────────────────────────────
  const palY = 210;
  ctx.save();
  ctx.font = `600 11px ${f.body}`;
  ctx.fillStyle = `${p.neutral}80`;
  ctx.textAlign = "left";
  ctx.fillText("COLOR PALETTE", 60, palY);

  const colors = [
    { color: p.primary, name: "Primary", hex: p.primary },
    { color: p.secondary, name: "Secondary", hex: p.secondary },
    { color: p.accent, name: "Accent", hex: p.accent },
    { color: p.neutral, name: "Neutral", hex: p.neutral },
    { color: p.background, name: "Background", hex: p.background },
  ];

  const swatchW = 260;
  const swatchH = 140;
  const swatchGap = 20;

  colors.forEach((c, i) => {
    const x = 60 + i * (swatchW + swatchGap);
    const y = palY + 20;

    // Swatch
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.roundRect(x, y, swatchW, swatchH, 12);
    ctx.fill();

    // Border for light colors
    const rgb = hexToRgb(c.color);
    if (rgb[0] + rgb[1] + rgb[2] > 600) {
      ctx.strokeStyle = `${p.neutral}30`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, swatchW, swatchH, 12);
      ctx.stroke();
    }

    // Label
    ctx.font = `600 12px ${f.body}`;
    ctx.fillStyle = `${p.neutral}`;
    ctx.textAlign = "left";
    ctx.fillText(c.name, x, y + swatchH + 22);

    ctx.font = `400 11px 'Courier New', monospace`;
    ctx.fillStyle = `${p.neutral}80`;
    ctx.fillText(c.hex.toUpperCase(), x, y + swatchH + 40);
  });
  ctx.restore();

  // ─── Typography Section ────────────────────────────────
  const typoY = 440;
  ctx.save();
  ctx.font = `600 11px ${f.body}`;
  ctx.fillStyle = `${p.neutral}80`;
  ctx.textAlign = "left";
  ctx.fillText("TYPOGRAPHY", 60, typoY);

  // Heading font showcase
  ctx.font = `${f.headingWeight} 44px ${f.heading}`;
  ctx.fillStyle = getContrastForBg(p.background);
  ctx.fillText("Heading Typeface", 60, typoY + 56);

  ctx.font = `400 14px ${f.body}`;
  ctx.fillStyle = `${p.neutral}`;
  ctx.fillText(`Font: ${f.label.split("/")[0]?.trim()} • Weight: ${f.headingWeight}`, 60, typoY + 82);

  // Size scale
  const sizes = [48, 36, 28, 22, 16, 14, 12];
  const sizeLabels = ["H1", "H2", "H3", "H4", "Body", "Small", "Caption"];
  let sizeY = typoY + 120;
  sizes.forEach((size, i) => {
    ctx.font = `${i < 4 ? f.headingWeight : f.bodyWeight} ${size}px ${i < 4 ? f.heading : f.body}`;
    ctx.fillStyle = getContrastForBg(p.background);
    ctx.globalAlpha = 1 - i * 0.08;
    ctx.fillText(`${sizeLabels[i]} — ${size}px`, 60, sizeY);
    sizeY += size + 16;
  });
  ctx.globalAlpha = 1;

  // Body font showcase (right side)
  ctx.font = `${f.bodyWeight} 18px ${f.body}`;
  ctx.fillStyle = getContrastForBg(p.background);
  const bodyText = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.";
  const bodyLines = wrapText(ctx, bodyText, 620);
  bodyLines.forEach((line, i) => {
    ctx.fillText(line, 860, typoY + 56 + i * 30);
  });

  ctx.font = `400 14px ${f.body}`;
  ctx.fillStyle = `${p.neutral}`;
  ctx.fillText(`Body: ${f.label.split("/")[1]?.trim()} • Weight: ${f.bodyWeight}`, 860, typoY + 56 + bodyLines.length * 30 + 16);

  // Alphabet display
  ctx.font = `300 22px ${f.body}`;
  ctx.fillStyle = `${p.neutral}60`;
  ctx.fillText("Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm", 860, typoY + 170);
  ctx.fillText("Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz", 860, typoY + 200);

  ctx.font = `300 22px ${f.body}`;
  ctx.fillText("0 1 2 3 4 5 6 7 8 9 ! @ # $ % & * ( )", 860, typoY + 240);
  ctx.restore();

  // ─── Brand Pattern Section ─────────────────────────────
  const patY = 810;
  ctx.save();
  ctx.font = `600 11px ${f.body}`;
  ctx.fillStyle = `${p.neutral}80`;
  ctx.textAlign = "left";
  ctx.fillText("BRAND PATTERN", 60, patY);

  // Pattern tile
  const patW = 440;
  const patH = 280;
  ctx.fillStyle = p.background;
  ctx.beginPath();
  ctx.roundRect(60, patY + 20, patW, patH, 12);
  ctx.fill();
  ctx.strokeStyle = `${p.neutral}20`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(60, patY + 20, patW, patH, 12);
  ctx.stroke();

  // Draw pattern
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(60, patY + 20, patW, patH, 12);
  ctx.clip();
  drawPattern(ctx, 60, patY + 20, patW, patH, config.pattern, p.primary);
  ctx.restore();

  // ─── Logo Applications ─────────────────────────────────
  ctx.font = `600 11px ${f.body}`;
  ctx.fillStyle = `${p.neutral}80`;
  ctx.textAlign = "left";
  ctx.fillText("LOGO APPLICATIONS", 560, patY);

  // Dark background app
  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.roundRect(560, patY + 20, 480, 130, 12);
  ctx.fill();
  ctx.font = `${f.headingWeight} 32px ${f.heading}`;
  ctx.fillStyle = p.primary;
  ctx.textAlign = "center";
  ctx.fillText(config.brandName || "Your Brand", 800, patY + 80);
  if (config.tagline) {
    ctx.font = `400 12px ${f.body}`;
    ctx.fillStyle = "#888";
    ctx.fillText(config.tagline, 800, patY + 106);
  }

  // Light background app
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(560, patY + 170, 480, 130, 12);
  ctx.fill();
  ctx.font = `${f.headingWeight} 32px ${f.heading}`;
  ctx.fillStyle = p.primary;
  ctx.textAlign = "center";
  ctx.fillText(config.brandName || "Your Brand", 800, patY + 230);
  if (config.tagline) {
    ctx.font = `400 12px ${f.body}`;
    ctx.fillStyle = "#666";
    ctx.fillText(config.tagline, 800, patY + 256);
  }

  ctx.restore();

  // ─── Footer ────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = p.primary;
  ctx.fillRect(0, H - 4, W, 4);
  ctx.font = `400 10px ${f.body}`;
  ctx.fillStyle = `${p.neutral}50`;
  ctx.textAlign = "left";
  ctx.fillText(`${config.brandName || "Brand"} Identity Kit • Generated by DMSuite`, 60, H - 20);
  ctx.textAlign = "right";
  ctx.fillText(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" }), W - 60, H - 20);
  ctx.restore();
}

/* ── Pattern drawer ──────────────────────────────────────── */

function drawPattern(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  w: number, h: number, pattern: PatternConfig, color: string
) {
  ctx.save();
  ctx.globalAlpha = pattern.opacity;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  switch (pattern.type) {
    case "dots":
      for (let px = x; px < x + w; px += 20) {
        for (let py = y; py < y + h; py += 20) {
          ctx.beginPath();
          ctx.arc(px + 10, py + 10, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    case "lines":
      for (let py = y; py < y + h; py += 12) {
        ctx.beginPath();
        ctx.moveTo(x, py);
        ctx.lineTo(x + w, py);
        ctx.stroke();
      }
      break;
    case "grid":
      for (let px = x; px < x + w; px += 24) {
        ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
      }
      for (let py = y; py < y + h; py += 24) {
        ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
      }
      break;
    case "circles":
      for (let px = x; px < x + w; px += 40) {
        for (let py = y; py < y + h; py += 40) {
          ctx.beginPath();
          ctx.arc(px + 20, py + 20, 14, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    case "diagonal":
      for (let i = -h; i < w + h; i += 16) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + h, y + h);
        ctx.stroke();
      }
      break;
    case "chevron":
      for (let py = y; py < y + h; py += 24) {
        for (let px = x; px < x + w; px += 32) {
          ctx.beginPath();
          ctx.moveTo(px, py + 12);
          ctx.lineTo(px + 16, py);
          ctx.lineTo(px + 32, py + 12);
          ctx.stroke();
        }
      }
      break;
  }
  ctx.restore();
}

/* ── Helpers ──────────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}

function getContrastForBg(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 128 ? "#1a1a1a" : "#f5f5f5";
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxW && current) {
      lines.push(current);
      current = word;
    } else current = test;
  }
  if (current) lines.push(current);
  return lines;
}

/* ── Collapsible Section ─────────────────────────────────── */

function Section({ icon, label, id, open, toggle, children }: {
  icon: React.ReactNode; label: string; id: string;
  open: boolean; toggle: (id: string) => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button onClick={() => toggle(id)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-full">
        {icon}{label}
        <svg className={`size-3 ml-auto transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && children}
    </div>
  );
}

/* ── Component ───────────────────────────────────────────── */

export default function BrandIdentityWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedColors, setCopiedColors] = useState(false);

  const [config, setConfig] = useState<BrandConfig>({
    brandName: "",
    tagline: "",
    industry: "",
    personality: "",
    palette: palettePresets[0],
    fontPairing: fontPairings[0],
    pattern: { type: "dots", color: "#8ae600", opacity: 0.12 },
  });

  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["basics", "palette", "typography"]));
  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateConfig = useCallback((partial: Partial<BrandConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  // Render canvas on config change
  useEffect(() => {
    if (!canvasRef.current) return;
    renderBrandBoard(canvasRef.current, config);
  }, [config]);

  // AI generation
  const generateWithAI = useCallback(async () => {
    if (!config.brandName.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `You are an elite brand identity designer. Create a complete brand identity kit.

Brand: ${config.brandName}
${config.tagline ? `Tagline: ${config.tagline}` : ""}
${config.industry ? `Industry: ${config.industry}` : ""}
${config.personality ? `Personality: ${config.personality}` : ""}

Generate a JSON response with:
{
  "palette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "neutral": "#hex (gray-ish)",
    "background": "#hex (dark)"
  },
  "fontPairing": "index 0-5 (0=Inter, 1=Georgia/Arial, 2=Impact/Helvetica, 3=Playfair/Inter, 4=Courier/Arial, 5=Trebuchet/Georgia)",
  "pattern": "dots|lines|grid|circles|diagonal|chevron",
  "tagline": "suggested tagline if none provided"
}

Return ONLY valid JSON, no markdown.`;

      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }) });
      if (!response.ok) throw new Error("Failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      let fullText = "";
      const decoder = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; fullText += decoder.decode(value, { stream: true }); }

      try {
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          const updates: Partial<BrandConfig> = {};
          if (data.palette) {
            updates.palette = {
              name: "AI Generated",
              primary: data.palette.primary || config.palette.primary,
              secondary: data.palette.secondary || config.palette.secondary,
              accent: data.palette.accent || config.palette.accent,
              neutral: data.palette.neutral || config.palette.neutral,
              background: data.palette.background || config.palette.background,
            };
            updates.pattern = { ...config.pattern, color: data.palette.primary || config.palette.primary };
          }
          if (data.fontPairing !== undefined) {
            const idx = parseInt(String(data.fontPairing));
            if (fontPairings[idx]) updates.fontPairing = fontPairings[idx];
          }
          if (data.pattern && patternTypes.includes(data.pattern)) {
            updates.pattern = { ...(updates.pattern || config.pattern), type: data.pattern };
          }
          if (data.tagline && !config.tagline) {
            updates.tagline = data.tagline;
          }
          updateConfig(updates);
        }
      } catch { /* parse error */ }
    } catch (err) { console.error("AI generation error:", err); }
    finally { setIsGenerating(false); }
  }, [config, updateConfig]);

  // Export
  const handleDownloadPng = useCallback(() => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `${(config.brandName || "brand").replace(/\s+/g, "-").toLowerCase()}-identity-kit.png`;
      a.click(); URL.revokeObjectURL(url);
    }, "image/png");
  }, [config.brandName]);

  const handleCopyColors = useCallback(async () => {
    const p = config.palette;
    const text = `Primary: ${p.primary}\nSecondary: ${p.secondary}\nAccent: ${p.accent}\nNeutral: ${p.neutral}\nBackground: ${p.background}`;
    await navigator.clipboard.writeText(text);
    setCopiedColors(true);
    setTimeout(() => setCopiedColors(false), 2000);
  }, [config.palette]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ── Left Panel ──────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">

        {/* Basics */}
        <Section icon={<IconLayers className="size-3.5" />} label="Brand Basics" id="basics" open={openSections.has("basics")} toggle={toggleSection}>
          <div className="space-y-2.5">
            <input type="text" placeholder="Brand Name" value={config.brandName}
              onChange={(e) => updateConfig({ brandName: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <input type="text" placeholder="Tagline (optional)" value={config.tagline}
              onChange={(e) => updateConfig({ tagline: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />

            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 pt-1">Industry</p>
            <div className="flex flex-wrap gap-1.5">
              {industryPresets.map((ind) => (
                <button key={ind} onClick={() => updateConfig({ industry: ind })}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${config.industry === ind ? "border-primary-500 bg-primary-500/5 text-primary-500" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>{ind}</button>
              ))}
            </div>

            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 pt-1">Brand Personality</p>
            <div className="flex flex-wrap gap-1.5">
              {personalityPresets.map((p) => (
                <button key={p} onClick={() => updateConfig({ personality: p })}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${config.personality === p ? "border-primary-500 bg-primary-500/5 text-primary-500" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>{p}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* Color Palette */}
        <Section icon={<IconDroplet className="size-3.5" />} label="Color Palette" id="palette" open={openSections.has("palette")} toggle={toggleSection}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-1.5">
              {palettePresets.map((preset) => (
                <button key={preset.name} onClick={() => updateConfig({ palette: preset, pattern: { ...config.pattern, color: preset.primary } })}
                  className={`p-2 rounded-xl border text-left transition-all ${config.palette.name === preset.name ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                  <div className="flex gap-0.5 mb-1">
                    {[preset.primary, preset.secondary, preset.accent, preset.neutral].map((c, i) => (
                      <div key={i} className="size-4 rounded-full border border-gray-200/30 dark:border-gray-600/30" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <p className="text-[0.625rem] text-gray-500 dark:text-gray-400 font-medium">{preset.name}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 pt-1">
              {[
                { key: "primary" as const, label: "Primary" },
                { key: "secondary" as const, label: "Secondary" },
                { key: "accent" as const, label: "Accent" },
                { key: "neutral" as const, label: "Neutral" },
                { key: "background" as const, label: "BG" },
              ].map(({ key, label }) => (
                <label key={key} className="flex flex-col items-center gap-1 cursor-pointer">
                  <input type="color" value={config.palette[key]}
                    onChange={(e) => updateConfig({ palette: { ...config.palette, [key]: e.target.value } })}
                    className="size-7 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent" />
                  <span className="text-[0.5rem] text-gray-400">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section icon={<IconType className="size-3.5" />} label="Typography" id="typography" open={openSections.has("typography")} toggle={toggleSection}>
          <div className="grid grid-cols-2 gap-2">
            {fontPairings.map((fp, i) => (
              <button key={i} onClick={() => updateConfig({ fontPairing: fp })}
                className={`p-3 rounded-xl border text-left transition-all ${config.fontPairing.label === fp.label ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5" style={{ fontFamily: fp.heading }}>Heading</p>
                <p className="text-xs text-gray-500 dark:text-gray-400" style={{ fontFamily: fp.body }}>Body text sample</p>
                <p className="text-[0.5rem] text-gray-400 mt-1">{fp.label}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Pattern */}
        <Section icon={<IconLayers className="size-3.5" />} label="Brand Pattern" id="pattern" open={openSections.has("pattern")} toggle={toggleSection}>
          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-1.5">
              {patternTypes.map((type) => (
                <button key={type} onClick={() => updateConfig({ pattern: { ...config.pattern, type } })}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold capitalize transition-all ${config.pattern.type === type ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>{type}</button>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400">Pattern Opacity</span>
                <span className="text-[0.625rem] text-gray-500 tabular-nums">{Math.round(config.pattern.opacity * 100)}%</span>
              </div>
              <input type="range" min="3" max="40" value={Math.round(config.pattern.opacity * 100)}
                onChange={(e) => updateConfig({ pattern: { ...config.pattern, opacity: parseInt(e.target.value) / 100 } })}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary-500" />
            </div>
          </div>
        </Section>

        {/* AI Generate */}
        <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-4">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-3">
            <IconSparkles className="size-3.5" />AI Brand Generator
          </label>
          <button onClick={generateWithAI} disabled={!config.brandName.trim() || isGenerating}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-secondary-500 text-white text-xs font-bold hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating Identity…</> : <><IconWand className="size-3.5" />Generate Brand Identity with AI</>}
          </button>
          <p className="text-[0.5625rem] text-gray-400 text-center mt-1.5">AI will suggest colors, fonts, and pattern based on your brand</p>
        </div>
      </div>

      {/* ── Right Panel: Preview ─────────────────────────── */}
      <div className="lg:col-span-3 space-y-5">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Brand Board Preview</span>
              <span className="text-xs text-gray-400">1600×1200</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handleCopyColors} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {copiedColors ? <IconCheck className="size-3 text-success" /> : <IconCopy className="size-3" />}{copiedColors ? "Copied" : "Colors"}
              </button>
              <button onClick={handleDownloadPng} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 transition-colors">
                <IconDownload className="size-3" />PNG
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center p-6 bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#1f2937_0%_25%,transparent_0%_50%)] bg-size-[24px_24px] min-h-80">
            <div className="shadow-2xl rounded-lg overflow-hidden w-full max-w-2xl">
              <canvas ref={canvasRef} className="w-full h-auto" style={{ aspectRatio: "1600 / 1200" }} />
            </div>
          </div>
        </div>

        {/* Quick color reference */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Quick Color Reference</h3>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Primary", color: config.palette.primary },
              { label: "Secondary", color: config.palette.secondary },
              { label: "Accent", color: config.palette.accent },
              { label: "Neutral", color: config.palette.neutral },
              { label: "Background", color: config.palette.background },
            ].map(({ label, color }) => (
              <div key={label} className="text-center">
                <div className="h-16 rounded-xl border border-gray-200 dark:border-gray-700 mb-2" style={{ backgroundColor: color }} />
                <p className="text-[0.6875rem] font-semibold text-gray-700 dark:text-gray-300">{label}</p>
                <p className="text-[0.5625rem] text-gray-400 font-mono">{color.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Export</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={handleDownloadPng} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 transition-colors hover:bg-primary-500/10">
              <IconDownload className="size-4" /><span className="text-xs font-semibold">Brand Board</span>
              <span className="text-[0.5625rem] opacity-60">1600×1200 PNG</span>
            </button>
            <button onClick={handleCopyColors} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10">
              <IconCopy className="size-4" /><span className="text-xs font-semibold">Copy Colors</span>
              <span className="text-[0.5625rem] opacity-60">All hex values</span>
            </button>
            <button disabled className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed">
              <IconDownload className="size-4" /><span className="text-xs font-semibold">PDF Guide</span>
              <span className="text-[0.5625rem]">Coming soon</span>
            </button>
            <button onClick={() => { updateConfig({}); /* trigger re-render */ }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
              <IconRefresh className="size-4" /><span className="text-xs font-semibold">Refresh</span>
              <span className="text-[0.5625rem] opacity-60">Re-render board</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
