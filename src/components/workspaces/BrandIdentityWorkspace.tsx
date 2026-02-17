"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { jsPDF } from "jspdf";
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
  IconShield,
  IconFileText,
  IconBookOpen,
  IconPlus,
  IconTrash,
} from "@/components/icons";
import StickyCanvasLayout from "@/components/workspaces/StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "@/components/workspaces/TemplateSlider";

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

interface ToneOfVoice {
  attributes: string;
  exampleDo: string[];
  exampleDont: string[];
}

interface BrandConfig {
  brandName: string;
  tagline: string;
  industry: string;
  personality: string;
  palette: ColorPalette;
  fontPairing: FontPairing;
  pattern: PatternConfig;
  toneOfVoice: ToneOfVoice;
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
    if (rgb.r + rgb.g + rgb.b > 600) {
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

import { getContrastColor, hexToRgb } from "@/lib/canvas-utils";

function getContrastForBg(hex: string): string {
  return getContrastColor(hex) === "#ffffff" ? "#f5f5f5" : "#1a1a1a";
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

/* ── WCAG Contrast Utilities ──────────────────────────────── */

function sRGBtoLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagLevel(ratio: number): { aa: boolean; aaLarge: boolean; aaa: boolean; aaaLarge: boolean } {
  return {
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}

/* ── SVG Export ──────────────────────────────────────────── */

function exportBrandBoardSVG(config: BrandConfig): string {
  const p = config.palette;
  const f = config.fontPairing;
  const name = config.brandName || "Your Brand";

  const swatchColors = [
    { color: p.primary, name: "Primary" },
    { color: p.secondary, name: "Secondary" },
    { color: p.accent, name: "Accent" },
    { color: p.neutral, name: "Neutral" },
    { color: p.background, name: "Background" },
  ];

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200" width="1600" height="1200">`;
  svg += `<rect width="1600" height="1200" fill="${p.background}"/>`;
  // Header bar
  svg += `<rect width="1600" height="6" fill="${p.primary}"/>`;
  svg += `<text x="60" y="52" fill="${p.neutral}" opacity="0.5" font-size="12" font-family="${f.body}" font-weight="300">BRAND IDENTITY KIT</text>`;
  svg += `<text x="60" y="120" fill="${p.primary}" font-size="56" font-family="${f.heading}" font-weight="${f.headingWeight}">${escapeXml(name)}</text>`;
  if (config.tagline) {
    svg += `<text x="60" y="158" fill="${p.neutral}" font-size="20" font-family="${f.body}">${escapeXml(config.tagline)}</text>`;
  }
  // Color palette section
  svg += `<text x="60" y="210" fill="${p.neutral}" opacity="0.5" font-size="11" font-family="${f.body}" font-weight="600">COLOR PALETTE</text>`;
  swatchColors.forEach((c, i) => {
    const x = 60 + i * 280;
    svg += `<rect x="${x}" y="230" width="260" height="140" rx="12" fill="${c.color}"/>`;
    svg += `<text x="${x}" y="392" fill="${p.neutral}" font-size="12" font-family="${f.body}" font-weight="600">${c.name}</text>`;
    svg += `<text x="${x}" y="410" fill="${p.neutral}" opacity="0.5" font-size="11" font-family="monospace">${c.color.toUpperCase()}</text>`;
  });
  // Typography section
  svg += `<text x="60" y="440" fill="${p.neutral}" opacity="0.5" font-size="11" font-family="${f.body}" font-weight="600">TYPOGRAPHY</text>`;
  svg += `<text x="60" y="496" fill="${getContrastForBg(p.background)}" font-size="44" font-family="${f.heading}" font-weight="${f.headingWeight}">Heading Typeface</text>`;
  svg += `<text x="60" y="522" fill="${p.neutral}" font-size="14" font-family="${f.body}">Font: ${f.label} • Weights: ${f.headingWeight} / ${f.bodyWeight}</text>`;
  // Logo applications
  svg += `<text x="560" y="810" fill="${p.neutral}" opacity="0.5" font-size="11" font-family="${f.body}" font-weight="600">LOGO APPLICATIONS</text>`;
  svg += `<rect x="560" y="830" width="480" height="130" rx="12" fill="#0a0a0a"/>`;
  svg += `<text x="800" y="890" fill="${p.primary}" font-size="32" font-family="${f.heading}" font-weight="${f.headingWeight}" text-anchor="middle">${escapeXml(name)}</text>`;
  svg += `<rect x="560" y="980" width="480" height="130" rx="12" fill="#ffffff"/>`;
  svg += `<text x="800" y="1040" fill="${p.primary}" font-size="32" font-family="${f.heading}" font-weight="${f.headingWeight}" text-anchor="middle">${escapeXml(name)}</text>`;
  // Footer
  svg += `<rect y="1196" width="1600" height="4" fill="${p.primary}"/>`;
  svg += `<text x="60" y="1180" fill="${p.neutral}" opacity="0.3" font-size="10" font-family="${f.body}">${escapeXml(name)} Identity Kit • Generated by DMSuite</text>`;
  svg += `</svg>`;
  return svg;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ── PDF Export ───────────────────────────────────────────── */

function exportBrandPDF(config: BrandConfig) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 20;
  const contentW = W - margin * 2;
  const p = config.palette;
  const f = config.fontPairing;
  const name = config.brandName || "Your Brand";

  // Helper: draw a colored rect
  const drawRect = (x: number, y: number, w: number, h: number, color: string) => {
    const { r, g, b } = hexToRgb(color);
    pdf.setFillColor(r, g, b);
    pdf.roundedRect(x, y, w, h, 2, 2, "F");
  };

  // Helper: set text color from hex
  const setTextColor = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    pdf.setTextColor(r, g, b);
  };

  // ─── PAGE 1: Cover ─────────────────────────────────────
  drawRect(0, 0, W, 297, p.background);
  // Top accent bar
  drawRect(0, 0, W, 4, p.primary);

  // Brand name
  setTextColor(p.primary);
  pdf.setFontSize(42);
  pdf.setFont("helvetica", "bold");
  pdf.text(name, W / 2, 120, { align: "center" });

  if (config.tagline) {
    setTextColor(p.neutral);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text(config.tagline, W / 2, 135, { align: "center" });
  }

  // Subtitle
  setTextColor(p.neutral);
  pdf.setFontSize(10);
  pdf.text("BRAND IDENTITY GUIDELINES", W / 2, 160, { align: "center" });

  // Footer info
  pdf.setFontSize(8);
  setTextColor(p.neutral);
  pdf.text(`${config.industry || ""} ${config.personality ? "• " + config.personality : ""}`.trim(), W / 2, 260, { align: "center" });
  pdf.text(`Generated by DMSuite • ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, W / 2, 280, { align: "center" });
  drawRect(0, 293, W, 4, p.primary);

  // ─── PAGE 2: Color Palette ─────────────────────────────
  pdf.addPage();
  drawRect(0, 0, W, 297, "#ffffff");
  drawRect(0, 0, W, 2, p.primary);

  pdf.setFontSize(9);
  setTextColor("#999999");
  pdf.text("COLOR PALETTE", margin, 20);

  pdf.setFontSize(22);
  setTextColor("#1a1a1a");
  pdf.setFont("helvetica", "bold");
  pdf.text("Brand Colors", margin, 32);
  pdf.setFont("helvetica", "normal");

  const colorEntries = [
    { name: "Primary", hex: p.primary },
    { name: "Secondary", hex: p.secondary },
    { name: "Accent", hex: p.accent },
    { name: "Neutral", hex: p.neutral },
    { name: "Background", hex: p.background },
  ];

  const swatchSize = 30;
  const swatchGap = 4;
  colorEntries.forEach((c, i) => {
    const x = margin + i * (swatchSize + swatchGap);
    drawRect(x, 40, swatchSize, swatchSize, c.hex);
    pdf.setFontSize(7);
    setTextColor("#333333");
    pdf.text(c.name, x, 40 + swatchSize + 6);
    pdf.setFontSize(6);
    setTextColor("#888888");
    pdf.text(c.hex.toUpperCase(), x, 40 + swatchSize + 11);
  });

  // Usage guidelines
  let uy = 100;
  pdf.setFontSize(12);
  setTextColor("#1a1a1a");
  pdf.setFont("helvetica", "bold");
  pdf.text("Color Usage Guidelines", margin, uy);
  pdf.setFont("helvetica", "normal");
  uy += 8;

  const guidelines = [
    `Primary (${p.primary.toUpperCase()}) — Main brand color. Use for logos, headings, and CTAs.`,
    `Secondary (${p.secondary.toUpperCase()}) — Supporting color for accents, links, and secondary elements.`,
    `Accent (${p.accent.toUpperCase()}) — Highlights, badges, and emphasis. Use sparingly.`,
    `Neutral (${p.neutral.toUpperCase()}) — Body text, borders, and subdued UI elements.`,
    `Background (${p.background.toUpperCase()}) — Canvas and page backgrounds.`,
  ];
  pdf.setFontSize(9);
  setTextColor("#444444");
  guidelines.forEach((g) => {
    pdf.text(`• ${g}`, margin, uy, { maxWidth: contentW });
    uy += 10;
  });

  // Large swatches with contrast preview
  uy += 8;
  pdf.setFontSize(12);
  setTextColor("#1a1a1a");
  pdf.setFont("helvetica", "bold");
  pdf.text("Color & Contrast Preview", margin, uy);
  pdf.setFont("helvetica", "normal");
  uy += 8;

  colorEntries.forEach((c) => {
    drawRect(margin, uy, contentW, 16, c.hex);
    const textCol = getContrastForBg(c.hex);
    setTextColor(textCol);
    pdf.setFontSize(10);
    pdf.text(`${c.name}  ${c.hex.toUpperCase()}`, margin + 4, uy + 10);
    uy += 20;
  });

  // ─── PAGE 3: Typography ────────────────────────────────
  pdf.addPage();
  drawRect(0, 0, W, 297, "#ffffff");
  drawRect(0, 0, W, 2, p.primary);

  pdf.setFontSize(9);
  setTextColor("#999999");
  pdf.text("TYPOGRAPHY", margin, 20);

  pdf.setFontSize(22);
  setTextColor("#1a1a1a");
  pdf.setFont("helvetica", "bold");
  pdf.text("Font Pairings", margin, 32);
  pdf.setFont("helvetica", "normal");

  let ty = 45;
  pdf.setFontSize(11);
  setTextColor("#333333");
  pdf.text(`Heading: ${f.label.split("/")[0]?.trim()} — Weight ${f.headingWeight}`, margin, ty); ty += 7;
  pdf.text(`Body: ${f.label.split("/")[1]?.trim()} — Weight ${f.bodyWeight}`, margin, ty); ty += 14;

  // Type scale
  pdf.setFontSize(9);
  setTextColor("#999999");
  pdf.text("TYPE SCALE", margin, ty); ty += 8;

  const typeScales = [
    { label: "H1", size: 32 }, { label: "H2", size: 24 }, { label: "H3", size: 20 },
    { label: "H4", size: 16 }, { label: "Body", size: 12 }, { label: "Small", size: 10 },
    { label: "Caption", size: 8 },
  ];
  typeScales.forEach((ts) => {
    pdf.setFontSize(ts.size > 24 ? 24 : ts.size);
    setTextColor("#1a1a1a");
    const isBold = ["H1", "H2", "H3", "H4"].includes(ts.label);
    pdf.setFont("helvetica", isBold ? "bold" : "normal");
    pdf.text(`${ts.label} — ${ts.size}px`, margin, ty);
    ty += ts.size > 20 ? 14 : ts.size > 12 ? 10 : 7;
  });

  // Pangram
  ty += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  setTextColor("#444444");
  pdf.text("The quick brown fox jumps over the lazy dog.", margin, ty); ty += 6;
  pdf.text("Pack my box with five dozen liquor jugs.", margin, ty); ty += 12;

  // Alphabet
  pdf.setFontSize(14);
  setTextColor("#888888");
  pdf.text("Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm", margin, ty); ty += 8;
  pdf.text("Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz", margin, ty); ty += 8;
  pdf.text("0 1 2 3 4 5 6 7 8 9 ! @ # $ % & * ( )", margin, ty);

  // ─── PAGE 4: Logo Usage ────────────────────────────────
  pdf.addPage();
  drawRect(0, 0, W, 297, "#ffffff");
  drawRect(0, 0, W, 2, p.primary);

  pdf.setFontSize(9);
  setTextColor("#999999");
  pdf.text("LOGO USAGE", margin, 20);

  pdf.setFontSize(22);
  setTextColor("#1a1a1a");
  pdf.setFont("helvetica", "bold");
  pdf.text("Logo Applications", margin, 32);
  pdf.setFont("helvetica", "normal");

  // Dark bg logo
  drawRect(margin, 45, contentW, 40, "#0a0a0a");
  setTextColor(p.primary);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text(name, W / 2, 68, { align: "center" });
  if (config.tagline) {
    pdf.setFontSize(8);
    setTextColor("#888888");
    pdf.setFont("helvetica", "normal");
    pdf.text(config.tagline, W / 2, 78, { align: "center" });
  }

  // Light bg logo
  drawRect(margin, 95, contentW, 40, "#ffffff");
  pdf.setDrawColor(220, 220, 220);
  pdf.roundedRect(margin, 95, contentW, 40, 2, 2, "S");
  setTextColor(p.primary);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text(name, W / 2, 118, { align: "center" });
  if (config.tagline) {
    pdf.setFontSize(8);
    setTextColor("#666666");
    pdf.setFont("helvetica", "normal");
    pdf.text(config.tagline, W / 2, 128, { align: "center" });
  }

  // Color bg logo
  drawRect(margin, 145, contentW, 40, p.primary);
  setTextColor(getContrastForBg(p.primary));
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text(name, W / 2, 168, { align: "center" });

  // Do's and Don'ts
  let ly = 200;
  pdf.setFontSize(12);
  setTextColor("#1a1a1a");
  pdf.setFont("helvetica", "bold");
  pdf.text("Logo Guidelines", margin, ly); ly += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setTextColor("#444444");
  const logoRules = [
    "✓ Always maintain clear space around the logo",
    "✓ Use approved brand colors only",
    "✓ Ensure sufficient contrast against backgrounds",
    "✗ Do not stretch or distort the logo",
    "✗ Do not add effects like drop shadows or outlines",
    "✗ Do not place on busy or clashing backgrounds",
  ];
  logoRules.forEach((rule) => {
    pdf.text(rule, margin, ly); ly += 6;
  });

  // ─── PAGE 5: Pattern ───────────────────────────────────
  pdf.addPage();
  drawRect(0, 0, W, 297, "#ffffff");
  drawRect(0, 0, W, 2, p.primary);

  pdf.setFontSize(9);
  setTextColor("#999999");
  pdf.text("BRAND PATTERN", margin, 20);

  pdf.setFontSize(22);
  setTextColor("#1a1a1a");
  pdf.setFont("helvetica", "bold");
  pdf.text("Pattern Preview", margin, 32);
  pdf.setFont("helvetica", "normal");

  // Pattern description
  pdf.setFontSize(10);
  setTextColor("#444444");
  pdf.text(`Pattern Type: ${config.pattern.type}`, margin, 44);
  pdf.text(`Opacity: ${Math.round(config.pattern.opacity * 100)}%`, margin, 51);
  pdf.text(`Color: ${p.primary.toUpperCase()}`, margin, 58);

  // Pattern swatch (rendered from canvas)
  drawRect(margin, 68, contentW, 60, p.background);
  pdf.setDrawColor(200, 200, 200);
  pdf.roundedRect(margin, 68, contentW, 60, 2, 2, "S");

  // Simple PDF pattern representation
  const pxPerMM = 2;
  const pRgb = hexToRgb(p.primary);
  pdf.setDrawColor(pRgb.r, pRgb.g, pRgb.b);
  pdf.setFillColor(pRgb.r, pRgb.g, pRgb.b);

  if (config.pattern.type === "dots") {
    for (let px = margin + 3; px < margin + contentW; px += 6) {
      for (let py = 71; py < 125; py += 6) {
        pdf.circle(px, py, 0.6 * pxPerMM * config.pattern.opacity, "F");
      }
    }
  } else if (config.pattern.type === "lines") {
    for (let py = 71; py < 125; py += 4) {
      pdf.line(margin + 2, py, margin + contentW - 2, py);
    }
  } else if (config.pattern.type === "grid") {
    for (let px = margin + 3; px < margin + contentW; px += 8) { pdf.line(px, 70, px, 126); }
    for (let py = 71; py < 126; py += 8) { pdf.line(margin + 2, py, margin + contentW - 2, py); }
  }

  // ─── PAGE 6: Tone of Voice ─────────────────────────────
  if (config.toneOfVoice.attributes || config.toneOfVoice.exampleDo.length > 0 || config.toneOfVoice.exampleDont.length > 0) {
    pdf.addPage();
    drawRect(0, 0, W, 297, "#ffffff");
    drawRect(0, 0, W, 2, p.primary);

    pdf.setFontSize(9);
    setTextColor("#999999");
    pdf.text("BRAND VOICE", margin, 20);

    pdf.setFontSize(22);
    setTextColor("#1a1a1a");
    pdf.setFont("helvetica", "bold");
    pdf.text("Tone of Voice", margin, 32);
    pdf.setFont("helvetica", "normal");

    let vy = 44;
    if (config.toneOfVoice.attributes) {
      pdf.setFontSize(11);
      setTextColor("#333333");
      pdf.setFont("helvetica", "bold");
      pdf.text("Voice Attributes", margin, vy); vy += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      setTextColor("#444444");
      const attrs = config.toneOfVoice.attributes.split(",").map((a) => a.trim()).filter(Boolean);
      attrs.forEach((attr) => {
        drawRect(margin, vy - 4, contentW, 9, `${p.primary}15`);
        setTextColor("#333333");
        pdf.text(`• ${attr}`, margin + 3, vy + 2);
        vy += 12;
      });
    }

    if (config.toneOfVoice.exampleDo.length > 0) {
      vy += 6;
      pdf.setFontSize(11);
      setTextColor("#16a34a");
      pdf.setFont("helvetica", "bold");
      pdf.text("✓ Do Say", margin, vy); vy += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      setTextColor("#444444");
      config.toneOfVoice.exampleDo.filter(Boolean).forEach((ex) => {
        pdf.text(`"${ex}"`, margin + 4, vy);
        vy += 7;
      });
    }

    if (config.toneOfVoice.exampleDont.length > 0) {
      vy += 6;
      pdf.setFontSize(11);
      setTextColor("#e11d48");
      pdf.setFont("helvetica", "bold");
      pdf.text("✗ Don't Say", margin, vy); vy += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      setTextColor("#444444");
      config.toneOfVoice.exampleDont.filter(Boolean).forEach((ex) => {
        pdf.text(`"${ex}"`, margin + 4, vy);
        vy += 7;
      });
    }
  }

  // Save
  pdf.save(`${(name).replace(/\s+/g, "-").toLowerCase()}-brand-guidelines.pdf`);
}

/* ── Brand Kit Storage ───────────────────────────────────── */

const BRAND_KIT_KEY = "dmsuite-brand-kit";

function saveBrandKit(config: BrandConfig) {
  try {
    localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(config));
    return true;
  } catch { return false; }
}

function loadBrandKit(): BrandConfig | null {
  try {
    const raw = localStorage.getItem(BRAND_KIT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BrandConfig;
  } catch { return null; }
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
    toneOfVoice: { attributes: "", exampleDo: [""], exampleDont: [""] },
  });

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

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

  // PDF export
  const handleExportPDF = useCallback(() => {
    exportBrandPDF(config);
  }, [config]);

  // SVG export
  const handleExportSVG = useCallback(() => {
    const svg = exportBrandBoardSVG(config);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(config.brandName || "brand").replace(/\s+/g, "-").toLowerCase()}-brand-board.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  // Save brand kit
  const handleSaveBrandKit = useCallback(() => {
    const ok = saveBrandKit(config);
    setSavedFeedback(ok ? "Saved!" : "Error");
    setTimeout(() => setSavedFeedback(null), 2000);
  }, [config]);

  // Load brand kit
  const handleLoadBrandKit = useCallback(() => {
    const loaded = loadBrandKit();
    if (loaded) {
      setConfig(loaded);
      setSavedFeedback("Loaded!");
    } else {
      setSavedFeedback("No saved kit");
    }
    setTimeout(() => setSavedFeedback(null), 2000);
  }, []);

  /* ── Zoom / Display ─────────────────────────────────────── */
  const [zoom, setZoom] = useState(0.75);
  const displayWidth = Math.min(500, 1600) * zoom;
  const displayHeight = displayWidth * (1200 / 1600);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () => palettePresets.map((preset) => ({
      id: preset.name,
      label: preset.name,
      render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.fillStyle = preset.background;
        ctx.fillRect(0, 0, w, h);
        // Top accent bar
        ctx.fillStyle = preset.primary;
        ctx.fillRect(0, 0, w, 3);
        // Color swatches
        const colors = [preset.primary, preset.secondary, preset.accent, preset.neutral];
        const swW = (w - 20) / 4;
        colors.forEach((c, i) => {
          ctx.fillStyle = c;
          ctx.fillRect(8 + i * (swW + 2), h * 0.3, swW, h * 0.25);
        });
        // Label
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 7px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(preset.name, w / 2, h - 6);
      },
    })),
    []
  );

  /* ── Copy to Clipboard ──────────────────────────────────── */
  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch { /* ignore */ }
  }, []);

  return (
    <StickyCanvasLayout
      canvasRef={canvasRef}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
      onZoomFit={() => setZoom(0.75)}
      label={`Brand Identity Kit — 1600×1200px · ${config.palette.name}`}
      mobileTabs={["Canvas", "Settings", "Content"]}
      toolbar={
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-semibold text-gray-200">{config.brandName || "Untitled Brand"}</span>
          {config.industry && <span className="text-gray-500">• {config.industry}</span>}
          {config.personality && <span className="text-gray-500">• {config.personality}</span>}
        </div>
      }
      leftPanel={
        <div className="space-y-3">
          {/* AI Brand Generator */}
          <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
            <label className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-secondary-500 mb-2">
              <IconSparkles className="size-3" />
              AI Brand Generator
            </label>
            <button onClick={generateWithAI} disabled={!config.brandName.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 h-8 rounded-xl bg-linear-to-r from-secondary-500 to-primary-500 text-white text-[0.625rem] font-bold hover:from-secondary-400 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isGenerating ? <><IconLoader className="size-3 animate-spin" />Generating Identity…</> : <><IconWand className="size-3" />Generate Brand Identity with AI</>}
            </button>
            <p className="text-[0.5rem] text-gray-400 text-center mt-1">AI will suggest colors, fonts &amp; pattern</p>
          </div>

          {/* Template Slider — Palette Presets */}
          <TemplateSlider
            templates={templatePreviews}
            activeId={config.palette.name}
            onSelect={(id) => {
              const preset = palettePresets.find((p) => p.name === id);
              if (preset) updateConfig({ palette: preset, pattern: { ...config.pattern, color: preset.primary } });
            }}
            label="Palette Presets"
          />

          {/* Brand Basics */}
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

          {/* Save / Load Brand Kit */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30 p-4">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              <IconLayers className="size-3.5" />Brand Kit Storage
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleSaveBrandKit}
                className="flex items-center justify-center gap-1.5 h-9 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 text-xs font-semibold hover:bg-primary-500/10 transition-colors">
                <IconDownload className="size-3" />Save Brand Kit
              </button>
              <button onClick={handleLoadBrandKit}
                className="flex items-center justify-center gap-1.5 h-9 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 text-xs font-semibold hover:bg-secondary-500/10 transition-colors">
                <IconRefresh className="size-3" />Load Brand Kit
              </button>
            </div>
            {savedFeedback && (
              <p className="text-[0.625rem] text-center mt-2 font-medium text-primary-500 animate-pulse">{savedFeedback}</p>
            )}
          </div>
        </div>
      }
      rightPanel={
        <div className="space-y-4">
          {/* Quick Color Reference */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30 p-3">
            <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-2">Quick Color Reference</h3>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "Primary", color: config.palette.primary },
                { label: "Secondary", color: config.palette.secondary },
                { label: "Accent", color: config.palette.accent },
                { label: "Neutral", color: config.palette.neutral },
                { label: "Background", color: config.palette.background },
              ].map(({ label, color }) => (
                <div key={label} className="text-center">
                  <div className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 mb-1" style={{ backgroundColor: color }} />
                  <p className="text-[0.5rem] font-semibold text-gray-700 dark:text-gray-300">{label}</p>
                  <p className="text-[0.5rem] text-gray-400 font-mono">{color.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Color Accessibility Checker */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30 p-3">
            <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <IconShield className="size-3" />WCAG Accessibility
            </h3>
            <div className="space-y-1.5">
              {(() => {
                const paletteColors = [
                  { label: "Primary", hex: config.palette.primary },
                  { label: "Secondary", hex: config.palette.secondary },
                  { label: "Accent", hex: config.palette.accent },
                  { label: "Neutral", hex: config.palette.neutral },
                  { label: "Background", hex: config.palette.background },
                ];
                const pairs: { fg: typeof paletteColors[0]; bg: typeof paletteColors[0] }[] = [];
                for (let i = 0; i < paletteColors.length; i++) {
                  for (let j = i + 1; j < paletteColors.length; j++) {
                    pairs.push({ fg: paletteColors[i], bg: paletteColors[j] });
                  }
                }
                return pairs.map(({ fg, bg }) => {
                  const ratio = contrastRatio(fg.hex, bg.hex);
                  const level = wcagLevel(ratio);
                  return (
                    <div key={`${fg.label}-${bg.label}`} className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-1 min-w-16">
                        <div className="size-3 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: fg.hex }} />
                        <span className="text-[0.5rem] text-gray-500 dark:text-gray-400">on</span>
                        <div className="size-3 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: bg.hex }} />
                      </div>
                      <span className="text-[0.5rem] font-mono font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                        {ratio.toFixed(1)}:1
                      </span>
                      <div className="flex items-center gap-0.5 ml-auto">
                        <span className={`text-[0.45rem] font-bold px-1 py-0.5 rounded ${level.aa ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                          AA{level.aa ? "✓" : "✗"}
                        </span>
                        <span className={`text-[0.45rem] font-bold px-1 py-0.5 rounded ${level.aaa ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                          AAA{level.aaa ? "✓" : "✗"}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <p className="text-[0.45rem] text-gray-400 mt-1.5">AA ≥ 4.5:1 • AAA ≥ 7:1</p>
          </div>

          {/* Tone of Voice */}
          <Section icon={<IconBookOpen className="size-3.5" />} label="Tone of Voice" id="tone" open={openSections.has("tone")} toggle={toggleSection}>
            <div className="space-y-3">
              <div>
                <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1">Voice Attributes</p>
                <input type="text" placeholder="e.g. Professional, Friendly, Bold" value={config.toneOfVoice.attributes}
                  onChange={(e) => updateConfig({ toneOfVoice: { ...config.toneOfVoice, attributes: e.target.value } })}
                  className="w-full h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
                <p className="text-[0.5rem] text-gray-400 mt-0.5">Comma-separated attributes</p>
              </div>

              <div>
                <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-success mb-1">✓ Do Say (example phrases)</p>
                {config.toneOfVoice.exampleDo.map((ex, i) => (
                  <div key={`do-${i}`} className="flex items-center gap-1.5 mb-1.5">
                    <input type="text" placeholder={`Example phrase ${i + 1}`} value={ex}
                      onChange={(e) => {
                        const next = [...config.toneOfVoice.exampleDo];
                        next[i] = e.target.value;
                        updateConfig({ toneOfVoice: { ...config.toneOfVoice, exampleDo: next } });
                      }}
                      className="flex-1 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-success focus:ring-2 focus:ring-success/20 transition-all" />
                    {config.toneOfVoice.exampleDo.length > 1 && (
                      <button onClick={() => {
                        const next = config.toneOfVoice.exampleDo.filter((_, j) => j !== i);
                        updateConfig({ toneOfVoice: { ...config.toneOfVoice, exampleDo: next } });
                      }} className="text-gray-400 hover:text-error transition-colors"><IconTrash className="size-3" /></button>
                    )}
                  </div>
                ))}
                <button onClick={() => updateConfig({ toneOfVoice: { ...config.toneOfVoice, exampleDo: [...config.toneOfVoice.exampleDo, ""] } })}
                  className="flex items-center gap-1 text-[0.625rem] text-success hover:text-success/80 transition-colors font-medium">
                  <IconPlus className="size-2.5" />Add phrase
                </button>
              </div>

              <div>
                <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-error mb-1">✗ Don&apos;t Say</p>
                {config.toneOfVoice.exampleDont.map((ex, i) => (
                  <div key={`dont-${i}`} className="flex items-center gap-1.5 mb-1.5">
                    <input type="text" placeholder={`Avoid saying ${i + 1}`} value={ex}
                      onChange={(e) => {
                        const next = [...config.toneOfVoice.exampleDont];
                        next[i] = e.target.value;
                        updateConfig({ toneOfVoice: { ...config.toneOfVoice, exampleDont: next } });
                      }}
                      className="flex-1 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-error focus:ring-2 focus:ring-error/20 transition-all" />
                    {config.toneOfVoice.exampleDont.length > 1 && (
                      <button onClick={() => {
                        const next = config.toneOfVoice.exampleDont.filter((_, j) => j !== i);
                        updateConfig({ toneOfVoice: { ...config.toneOfVoice, exampleDont: next } });
                      }} className="text-gray-400 hover:text-error transition-colors"><IconTrash className="size-3" /></button>
                    )}
                  </div>
                ))}
                <button onClick={() => updateConfig({ toneOfVoice: { ...config.toneOfVoice, exampleDont: [...config.toneOfVoice.exampleDont, ""] } })}
                  className="flex items-center gap-1 text-[0.625rem] text-error hover:text-error/80 transition-colors font-medium">
                  <IconPlus className="size-2.5" />Add phrase
                </button>
              </div>
            </div>
          </Section>
        </div>
      }
      actionsBar={
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors"
          >
            <IconDownload className="size-3" />
            PNG
          </button>
          <button
            onClick={handleExportSVG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <IconDownload className="size-3" />
            SVG
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <IconFileText className="size-3" />
            PDF
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <IconCopy className="size-3" />
            Copy
          </button>
          <button
            onClick={handleCopyColors}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            {copiedColors ? <IconCheck className="size-3 text-success" /> : <IconDroplet className="size-3" />}
            {copiedColors ? "Copied!" : "Colors"}
          </button>
        </div>
      }
    />
  );
}
