"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconDroplet,
  IconFileText,
  IconImage,
  IconLayout,
  IconHome,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, generateColorPalette, exportHighRes, EXPORT_PRESETS, drawImagePlaceholder } from "@/lib/ai-design-engine";
import { StockImagePanel, type StockImage } from "@/hooks/useStockImages";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { Accordion, AccordionSection } from "@/components/ui";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type CardTemplate = "birthday" | "thankyou" | "holiday" | "congrats" | "sympathy" | "love";
type CardPage = "front" | "inside-left" | "inside-right" | "back";

interface GreetingCardConfig {
  template: CardTemplate;
  primaryColor: string;
  secondaryColor: string;
  recipientName: string;
  senderName: string;
  frontTitle: string;
  frontSubtitle: string;
  insideMessage: string;
  backMessage: string;
  coverImageUrl: string;
  activePage: CardPage;
  description: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const CARD_PAGES: { id: CardPage; name: string }[] = [
  { id: "front", name: "Front Cover" },
  { id: "inside-left", name: "Inside Left" },
  { id: "inside-right", name: "Inside Right" },
  { id: "back", name: "Back" },
];

const TEMPLATES: { id: CardTemplate; name: string; defaultTitle: string; defaultMessage: string }[] = [
  { id: "birthday", name: "Birthday", defaultTitle: "Happy Birthday!", defaultMessage: "Wishing you a day filled with love, laughter, and all the things that make you happiest. May this year bring you closer to your dreams." },
  { id: "thankyou", name: "Thank You", defaultTitle: "Thank You!", defaultMessage: "Your kindness and generosity have touched my heart. I am truly grateful for everything you have done. Thank you from the bottom of my heart." },
  { id: "holiday", name: "Holiday", defaultTitle: "Season's Greetings", defaultMessage: "May the warmth of the season fill your home with joy and your heart with love. Wishing you peace and happiness throughout the holidays." },
  { id: "congrats", name: "Congratulations", defaultTitle: "Congratulations!", defaultMessage: "What an incredible achievement! Your hard work and dedication have truly paid off. Here is to celebrating your success and all the wonderful things ahead." },
  { id: "sympathy", name: "Sympathy", defaultTitle: "With Deepest Sympathy", defaultMessage: "Words cannot express how sorry we are for your loss. Please know that you are in our thoughts and prayers during this difficult time. With love and compassion." },
  { id: "love", name: "Love", defaultTitle: "With All My Love", defaultMessage: "You are the sunshine in my days and the stars in my nights. Every moment with you is a gift I treasure. I love you more than words can say." },
];

const COLOR_PRESETS = [
  "#e11d48", "#ec4899", "#8b5cf6", "#3b82f6", "#06b6d4",
  "#10b981", "#f59e0b", "#c09c2c", "#1e3a5f", "#334155",
  "#8ae600", "#dc2626",
];

// A5 folded card: 420×595
const PAGE_W = 420, PAGE_H = 595;

/* ── Helpers ──────────────────────────────────────────────── */

function getTemplateFontStyle(t: CardTemplate): "modern" | "classic" | "elegant" {
  if (t === "sympathy" || t === "love") return "elegant";
  if (t === "holiday") return "classic";
  return "modern";
}

function getTemplateColors(t: CardTemplate, primary: string): { bg: string; accent: string } {
  switch (t) {
    case "birthday": return { bg: "#fffbeb", accent: "#fbbf24" };
    case "thankyou": return { bg: "#f0fdf4", accent: "#10b981" };
    case "holiday": return { bg: "#fef2f2", accent: "#dc2626" };
    case "congrats": return { bg: "#f5f3ff", accent: "#8b5cf6" };
    case "sympathy": return { bg: "#f8fafc", accent: "#94a3b8" };
    case "love": return { bg: "#fff1f2", accent: primary };
    default: return { bg: "#ffffff", accent: primary };
  }
}

function drawDecorativeBorder(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  color: string, style: CardTemplate,
) {
  ctx.save();
  ctx.strokeStyle = color;

  if (style === "birthday") {
    // Confetti dots border
    ctx.fillStyle = hexToRgba(color, 0.15);
    const colors = [color, hexToRgba(color, 0.6), hexToRgba("#fbbf24", 0.4), hexToRgba("#ec4899", 0.3)];
    for (let i = 0; i < 40; i++) {
      const side = i % 4;
      let x: number, y: number;
      if (side === 0) { x = Math.random() * w; y = Math.random() * 25 + 5; }
      else if (side === 1) { x = Math.random() * w; y = h - Math.random() * 25 - 5; }
      else if (side === 2) { x = Math.random() * 25 + 5; y = Math.random() * h; }
      else { x = w - Math.random() * 25 - 5; y = Math.random() * h; }
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath(); ctx.arc(x, y, Math.random() * 4 + 2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (style === "holiday") {
    // Classic double-line border with corner ornaments
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, w - 30, h - 30);
    ctx.lineWidth = 0.5;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    // Corner flourishes
    const corners = [[20, 20], [w - 20, 20], [20, h - 20], [w - 20, h - 20]];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    });
  } else if (style === "love") {
    // Hearts border
    ctx.fillStyle = hexToRgba(color, 0.12);
    for (let i = 0; i < 20; i++) {
      const side = i % 4;
      let hx: number, hy: number;
      if (side === 0) { hx = 30 + (i / 4) * (w - 60) / 5; hy = 15; }
      else if (side === 1) { hx = 30 + (i / 4) * (w - 60) / 5; hy = h - 15; }
      else if (side === 2) { hx = 15; hy = 30 + ((i - 2) / 4) * (h - 60) / 5; }
      else { hx = w - 15; hy = 30 + ((i - 3) / 4) * (h - 60) / 5; }
      drawHeartShape(ctx, hx, hy, 8);
    }
  } else if (style === "sympathy") {
    // Subtle thin border with rounded corners
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = hexToRgba(color, 0.3);
    roundRect(ctx, 18, 18, w - 36, h - 36, 12);
    ctx.stroke();
  } else {
    // Default elegant frame
    ctx.lineWidth = 1.5;
    ctx.strokeRect(12, 12, w - 24, h - 24);
  }
  ctx.restore();
}

function drawHeartShape(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.quadraticCurveTo(x, y, x + size / 4, y);
  ctx.quadraticCurveTo(x + size / 2, y, x + size / 2, y + size / 4);
  ctx.quadraticCurveTo(x + size / 2, y, x + size * 3 / 4, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + size / 4);
  ctx.quadraticCurveTo(x + size, y + size / 2, x + size / 2, y + size * 3 / 4);
  ctx.quadraticCurveTo(x, y + size / 2, x, y + size / 4);
  ctx.fill();
}

function drawPatternFill(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, template: CardTemplate) {
  ctx.save();
  ctx.fillStyle = hexToRgba(color, 0.03);

  if (template === "birthday") {
    // Stars pattern
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      const ss = Math.random() * 8 + 4;
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
        const method = j === 0 ? "moveTo" : "lineTo";
        ctx[method](sx + ss * Math.cos(angle), sy + ss * Math.sin(angle));
      }
      ctx.closePath(); ctx.fill();
    }
  } else if (template === "love") {
    // Scattered hearts
    for (let i = 0; i < 15; i++) {
      ctx.fillStyle = hexToRgba(color, 0.04 + Math.random() * 0.03);
      drawHeartShape(ctx, Math.random() * w, Math.random() * h, 10 + Math.random() * 15);
    }
  } else if (template === "holiday") {
    // Snowflake dots
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 3 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Subtle diagonal lines
    ctx.strokeStyle = hexToRgba(color, 0.04);
    ctx.lineWidth = 0.5;
    for (let i = -h; i < w + h; i += 30) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
    }
  }
  ctx.restore();
}

/* ── Front Cover Renderer ────────────────────────────────── */

function renderFrontPage(
  ctx: CanvasRenderingContext2D,
  cfg: GreetingCardConfig,
  pal: ReturnType<typeof generateColorPalette>,
  fontStyle: "modern" | "classic" | "elegant",
  tColors: { bg: string; accent: string },
  m: number, cw: number,
  img: HTMLImageElement | null,
) {
  const { template, primaryColor, frontTitle, frontSubtitle } = cfg;

  ctx.fillStyle = tColors.bg;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  drawPatternFill(ctx, PAGE_W, PAGE_H, primaryColor, template);
  drawDecorativeBorder(ctx, PAGE_W, PAGE_H, primaryColor, template);

  const imgH = PAGE_H * 0.35;
  if (img) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    const aspect = img.width / img.height;
    const drawW = cw;
    const drawH = drawW / aspect;
    roundRect(ctx, m, m + 15, drawW, Math.min(drawH, imgH), 8);
    ctx.clip();
    ctx.drawImage(img, m, m + 15, drawW, Math.min(drawH, imgH));
    ctx.restore();
  } else {
    drawImagePlaceholder(ctx, m, m + 15, cw, imgH, primaryColor, "Add Image", 8);
  }

  const titleY = m + imgH + 50;
  if (template === "birthday" || template === "congrats") {
    ctx.fillStyle = hexToRgba(primaryColor, 0.1);
    ctx.beginPath(); ctx.arc(PAGE_W / 2, titleY - 20, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hexToRgba(tColors.accent, 0.3);
    ctx.beginPath(); ctx.arc(PAGE_W / 2, titleY - 20, 15, 0, Math.PI * 2); ctx.fill();
  }

  drawProText(ctx, frontTitle, PAGE_W / 2, titleY, {
    fontSize: template === "sympathy" ? 24 : 30,
    fontWeight: 800, fontStyle, color: primaryColor, align: "center", maxWidth: cw,
  });

  const divY = titleY + 50;
  drawProDivider(ctx, PAGE_W / 2 - 30, divY, 60, primaryColor, template === "holiday" ? "ornate" : "gradient", 2);

  drawProText(ctx, frontSubtitle, PAGE_W / 2, divY + 18, {
    fontSize: 12, fontWeight: 400, fontStyle, color: pal.textMedium, align: "center", maxWidth: cw,
  });

  if (cfg.recipientName) {
    const recY = PAGE_H - m - 60;
    drawProText(ctx, "For", PAGE_W / 2, recY, {
      fontSize: 10, fontWeight: 400, fontStyle, color: pal.textLight, align: "center",
    });
    drawProText(ctx, cfg.recipientName, PAGE_W / 2, recY + 18, {
      fontSize: 20, fontWeight: 700, fontStyle: "elegant", color: primaryColor, align: "center",
    });
  }
}

/* ── Inside Left Renderer ────────────────────────────────── */

function renderInsideLeft(
  ctx: CanvasRenderingContext2D,
  cfg: GreetingCardConfig,
  pal: ReturnType<typeof generateColorPalette>,
  fontStyle: "modern" | "classic" | "elegant",
  tColors: { bg: string; accent: string },
  m: number, _cw: number,
) {
  void _cw;
  const { template, primaryColor } = cfg;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  drawPatternFill(ctx, PAGE_W, PAGE_H, primaryColor, template);

  const centerY = PAGE_H / 2;

  if (template === "birthday") {
    ctx.fillStyle = hexToRgba(primaryColor, 0.08);
    roundRect(ctx, PAGE_W / 2 - 40, centerY - 30, 80, 60, 6);
    ctx.fill();
    ctx.fillStyle = hexToRgba(tColors.accent, 0.15);
    ctx.fillRect(PAGE_W / 2 - 3, centerY - 30, 6, 60);
    ctx.fillRect(PAGE_W / 2 - 40, centerY - 5, 80, 6);
    ctx.fillStyle = hexToRgba(primaryColor, 0.12);
    ctx.beginPath(); ctx.arc(PAGE_W / 2 - 12, centerY - 35, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(PAGE_W / 2 + 12, centerY - 35, 10, 0, Math.PI * 2); ctx.fill();
  } else if (template === "love") {
    ctx.fillStyle = hexToRgba(primaryColor, 0.06);
    drawHeartShape(ctx, PAGE_W / 2 - 40, centerY - 30, 80);
  } else if (template === "holiday") {
    ctx.strokeStyle = hexToRgba(primaryColor, 0.12);
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(PAGE_W / 2, centerY);
      ctx.lineTo(PAGE_W / 2 + Math.cos(angle) * 50, centerY + Math.sin(angle) * 50);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = hexToRgba(primaryColor, 0.06);
    ctx.font = getCanvasFont(800, 120, fontStyle);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\u201C", PAGE_W / 2, centerY);
  }

  drawProText(ctx, "Open with care \u2764", PAGE_W / 2, PAGE_H - m - 20, {
    fontSize: 8, fontWeight: 400, fontStyle: "elegant", color: pal.textLight, align: "center",
  });
}

/* ── Inside Right Renderer ───────────────────────────────── */

function renderInsideRight(
  ctx: CanvasRenderingContext2D,
  cfg: GreetingCardConfig,
  pal: ReturnType<typeof generateColorPalette>,
  fontStyle: "modern" | "classic" | "elegant",
  tColors: { bg: string; accent: string },
  m: number, cw: number,
) {
  const { template, primaryColor, insideMessage, recipientName, senderName } = cfg;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  ctx.fillStyle = hexToRgba(primaryColor, 0.04);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(60, 0); ctx.lineTo(0, 60); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(PAGE_W, PAGE_H); ctx.lineTo(PAGE_W - 60, PAGE_H); ctx.lineTo(PAGE_W, PAGE_H - 60); ctx.closePath(); ctx.fill();

  const dearY = m + 40;
  drawProText(ctx, `Dear ${recipientName},`, m + 20, dearY, {
    fontSize: 16, fontWeight: 600, fontStyle: "elegant", color: primaryColor, maxWidth: cw - 40,
  });
  drawProDivider(ctx, m + 20, dearY + 30, 40, hexToRgba(primaryColor, 0.3), "gradient", 1);

  const msgY = dearY + 50;
  ctx.font = getCanvasFont(400, 12, fontStyle);
  const msgLines = wrapCanvasText(ctx, insideMessage, cw - 40);
  const lineH = 22;

  msgLines.forEach((line, i) => {
    drawProText(ctx, line, PAGE_W / 2, msgY + i * lineH, {
      fontSize: 12, fontWeight: 400, fontStyle: "elegant", color: pal.textDark, align: "center", maxWidth: cw - 40,
    });
  });

  const sigY = msgY + msgLines.length * lineH + 40;
  drawProDivider(ctx, PAGE_W / 2 - 30, sigY, 60, hexToRgba(primaryColor, 0.2), "gradient", 1);

  drawProText(ctx, senderName, PAGE_W / 2, sigY + 18, {
    fontSize: 14, fontWeight: 500, fontStyle: "elegant", color: primaryColor, align: "center",
  });

  if (template === "birthday" || template === "congrats") {
    const bY = PAGE_H - m - 40;
    ctx.fillStyle = hexToRgba(tColors.accent, 0.08);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(PAGE_W / 2 - 40 + i * 20, bY, 6 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ── Back Page Renderer ──────────────────────────────────── */

function renderBackPage(
  ctx: CanvasRenderingContext2D,
  cfg: GreetingCardConfig,
  pal: ReturnType<typeof generateColorPalette>,
  fontStyle: "modern" | "classic" | "elegant",
  tColors: { bg: string; accent: string },
  m: number, cw: number,
) {
  const { primaryColor, backMessage } = cfg;

  ctx.fillStyle = tColors.bg;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  const centerY = PAGE_H / 2;

  ctx.fillStyle = hexToRgba(primaryColor, 0.1);
  roundRect(ctx, PAGE_W / 2 - 20, centerY - 20, 40, 40, 8);
  ctx.fill();

  ctx.fillStyle = hexToRgba(primaryColor, 0.3);
  ctx.font = getCanvasFont(800, 16, fontStyle);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DM", PAGE_W / 2, centerY);

  ctx.font = getCanvasFont(400, 8, fontStyle);
  const backLines = wrapCanvasText(ctx, backMessage, cw - 60);
  backLines.forEach((line, i) => {
    drawProText(ctx, line, PAGE_W / 2, centerY + 40 + i * 14, {
      fontSize: 8, fontWeight: 400, fontStyle, color: pal.textLight, align: "center", maxWidth: cw - 60,
    });
  });

  drawProDivider(ctx, PAGE_W / 2 - 40, PAGE_H - m - 10, 80, pal.mediumGray, "gradient", 0.5);
}

/* ── Component ───────────────────────────────────────────── */

export default function GreetingCardWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [coverImg, setCoverImg] = useState<HTMLImageElement | null>(null);

  const defaultTemplate = TEMPLATES[0];
  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<GreetingCardConfig>({
    template: "birthday",
    primaryColor: "#e11d48",
    secondaryColor: "#fbbf24",
    recipientName: "Chanda",
    senderName: "With love, Mwila",
    frontTitle: defaultTemplate.defaultTitle,
    frontSubtitle: "A Special Day for a Special Person",
    insideMessage: defaultTemplate.defaultMessage,
    backMessage: "Designed with love using DMSuite • www.dmsuite.com",
    coverImageUrl: "",
    activePage: "front",
    description: "",
  });

  const updateConfig = useCallback((p: Partial<GreetingCardConfig>) => setConfig((prev) => ({ ...prev, ...p })), []);

  /* ── Load cover image ─────────────────────────────────────── */
  useEffect(() => {
    if (!config.coverImageUrl) { setCoverImg(null); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setCoverImg(img);
    img.onerror = () => setCoverImg(null);
    img.src = config.coverImageUrl;
  }, [config.coverImageUrl, advancedSettings]);

  /* ── Canvas Render ───────────────────────────────────────── */

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = PAGE_W * 2;
    canvas.height = PAGE_H * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const { template, primaryColor, activePage } = config;
    const pal = generateColorPalette(primaryColor);
    const fontStyle = getTemplateFontStyle(template);
    const tColors = getTemplateColors(template, primaryColor);
    const m = 35;
    const cw = PAGE_W - m * 2;

    switch (activePage) {
      case "front":
        renderFrontPage(ctx, config, pal, fontStyle, tColors, m, cw, coverImg);
        break;
      case "inside-left":
        renderInsideLeft(ctx, config, pal, fontStyle, tColors, m, cw);
        break;
      case "inside-right":
        renderInsideRight(ctx, config, pal, fontStyle, tColors, m, cw);
        break;
      case "back":
        renderBackPage(ctx, config, pal, fontStyle, tColors, m, cw);
        break;
    }
  }, [config, coverImg]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  /* ── AI Generate ─────────────────────────────────────────── */

  const handleAIGenerate = useCallback(async () => {
    if (isGenerating || !config.description.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a greeting card writer. Return valid JSON only." },
            { role: "user", content: `Write a greeting card for: ${config.description}. Return JSON: {"frontTitle":"…","frontSubtitle":"…","insideMessage":"warm heartfelt message…","recipientName":"…","senderName":"With love, …","backMessage":"…"}. Make it warm and personal.` },
          ],
        }),
      });
      const data = await res.json();
      const text = cleanAIText(data.choices?.[0]?.message?.content || data.content || "");
      const parsed = JSON.parse(text);
      if (parsed.frontTitle) {
        updateConfig({
          frontTitle: parsed.frontTitle,
          frontSubtitle: parsed.frontSubtitle || config.frontSubtitle,
          insideMessage: parsed.insideMessage || config.insideMessage,
          recipientName: parsed.recipientName || config.recipientName,
          senderName: parsed.senderName || config.senderName,
          backMessage: parsed.backMessage || config.backMessage,
        });
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config.description, config.frontSubtitle, config.insideMessage, config.recipientName, config.senderName, config.backMessage, isGenerating, updateConfig]);

  /* ── Stock Image Handler ─────────────────────────────────── */

  const handleStockImageSelect = useCallback((img: StockImage) => {
    updateConfig({ coverImageUrl: img.urls.regular });
  }, [updateConfig]);

  /* ── Export ──────────────────────────────────────────────── */

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], `greeting-card-${config.activePage}`);
  }, [config.activePage]);

  /* ── Template Change ────────────────────────────────────── */

  const handleTemplateChange = useCallback((id: string) => {
    const tmpl = TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      updateConfig({
        template: id as CardTemplate,
        frontTitle: tmpl.defaultTitle,
        insideMessage: tmpl.defaultMessage,
      });
    }
  }, [updateConfig]);

  /* ── Template Previews ──────────────────────────────────── */

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const tc = getTemplateColors(t.id, config.primaryColor);
      ctx.fillStyle = tc.bg;
      ctx.fillRect(0, 0, w, h);
      // Image placeholder
      ctx.fillStyle = hexToRgba(config.primaryColor, 0.08);
      ctx.fillRect(w * 0.1, h * 0.05, w * 0.8, h * 0.35);
      // Title
      ctx.fillStyle = hexToRgba(config.primaryColor, 0.5);
      ctx.fillRect(w * 0.15, h * 0.5, w * 0.7, h * 0.05);
      // Subtitle
      ctx.fillStyle = hexToRgba(config.primaryColor, 0.2);
      ctx.fillRect(w * 0.25, h * 0.6, w * 0.5, h * 0.03);
      // Border hint
      if (t.id === "holiday") {
        ctx.strokeStyle = hexToRgba(config.primaryColor, 0.3);
        ctx.lineWidth = 0.5; ctx.strokeRect(3, 3, w - 6, h - 6);
      }
    },
  }));

  const displayW = 320;
  const displayH = Math.round(displayW * (PAGE_H / PAGE_W));

  /* ── Left Panel ──────────────────────────────────────────── */

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea
          value={config.description}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe your card… e.g., 'Birthday card for my grandmother who loves gardening'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={3}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Card</>}
        </button>
      </AccordionSection>

      <AccordionSection id="front" icon={<IconHome className="size-3.5" />} label="Front Cover">
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Title</label>
            <input type="text" value={config.frontTitle} onChange={(e) => updateConfig({ frontTitle: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Subtitle</label>
            <input type="text" value={config.frontSubtitle} onChange={(e) => updateConfig({ frontSubtitle: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Recipient Name</label>
            <input type="text" value={config.recipientName} onChange={(e) => updateConfig({ recipientName: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="message" icon={<IconFileText className="size-3.5" />} label="Message">
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Inside Message</label>
            <textarea value={config.insideMessage} onChange={(e) => updateConfig({ insideMessage: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={4} />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Sender</label>
            <input type="text" value={config.senderName} onChange={(e) => updateConfig({ senderName: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Back Text</label>
            <input type="text" value={config.backMessage} onChange={(e) => updateConfig({ backMessage: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="images" icon={<IconImage className="size-3.5" />} label="Cover Image">
        <StockImagePanel onSelect={handleStockImageSelect} />
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style & Colors">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-gray-500 uppercase">Primary Color</label>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((c) => (
              <button key={c} onClick={() => updateConfig({ primaryColor: c })}
                className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <input type="color" value={config.primaryColor} onChange={(e) => updateConfig({ primaryColor: e.target.value })}
            className="w-full h-8 rounded-lg cursor-pointer" />
        </div>
      </AccordionSection>

      <AccordionSection id="pages" icon={<IconLayout className="size-3.5" />} label="Pages">
        <div className="flex flex-wrap gap-1.5">
          {CARD_PAGES.map((p) => (
            <button key={p.id}
              onClick={() => updateConfig({ activePage: p.id })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${config.activePage === p.id ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
            >{p.name}</button>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="export" icon={<IconDownload className="size-3.5" />} label="Export">
        <div className="space-y-1.5">
          {[
            { id: "web-standard", label: "Web (PNG 2×)", desc: "150 DPI" },
            { id: "print-standard", label: "Print (300 DPI)", desc: "With crop marks" },
            { id: "print-ultra", label: "Ultra Print (600 DPI)", desc: "Maximum quality" },
          ].map((preset) => (
            <button key={preset.id} onClick={() => handleExport(preset.id)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors">
              <span>{preset.label}</span>
              <span className="text-[10px] text-gray-400">{preset.desc}</span>
            </button>
          ))}
        </div>
      </AccordionSection>
          {/* Advanced Settings — Global */}
        <AdvancedSettingsPanel />

      </Accordion>
  );

  /* ── Right Panel ─────────────────────────────────────────── */

  const rightPanel = (
    <TemplateSlider
      templates={templatePreviews}
      activeId={config.template}
      onSelect={handleTemplateChange}
      thumbWidth={110}
      thumbHeight={155}
    />
  );

  /* ── Toolbar ─────────────────────────────────────────────── */

  const toolbar = (
    <div className="flex items-center gap-1.5">
      {CARD_PAGES.map((p) => (
        <button key={p.id}
          onClick={() => updateConfig({ activePage: p.id })}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${config.activePage === p.id ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
        >{p.name}</button>
      ))}
    </div>
  );

  return (
    <StickyCanvasLayout
      canvasRef={canvasRef}
      displayWidth={displayW}
      displayHeight={displayH}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      toolbar={toolbar}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
      onZoomFit={() => setZoom(1)}
      label={`Greeting Card — ${CARD_PAGES.find((p) => p.id === config.activePage)?.name || "Front"} — A5 (${PAGE_W}×${PAGE_H})`}
    />
  );
}
