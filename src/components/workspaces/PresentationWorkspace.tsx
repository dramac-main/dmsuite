"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconPresentation,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlus,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  subtitle: string;
  body: string;
  bullets: string[];
  note: string;
}

interface PresentationConfig {
  theme: PresentationTheme;
  aspectRatio: AspectRatio;
  fontStyle: "modern" | "classic" | "bold" | "minimal";
  primaryColor: string;
  description: string;
}

type AspectRatio = "16:9" | "4:3" | "16:10";
type PresentationTheme =
  | "midnight"
  | "corporate"
  | "ocean"
  | "sunset"
  | "forest"
  | "monochrome"
  | "rose"
  | "neon";
type SlideLayout =
  | "title"
  | "content"
  | "two-column"
  | "image-left"
  | "image-right"
  | "quote"
  | "section"
  | "bullets"
  | "blank";

const ASPECT_RATIOS: { id: AspectRatio; w: number; h: number }[] = [
  { id: "16:9", w: 960, h: 540 },
  { id: "4:3", w: 720, h: 540 },
  { id: "16:10", w: 900, h: 562 },
];

const THEMES: {
  id: PresentationTheme;
  name: string;
  bg: string;
  fg: string;
  accent: string;
  muted: string;
}[] = [
  {
    id: "midnight",
    name: "Midnight",
    bg: "#0f172a",
    fg: "#f1f5f9",
    accent: "#3b82f6",
    muted: "#64748b",
  },
  {
    id: "corporate",
    name: "Corporate",
    bg: "#ffffff",
    fg: "#1e293b",
    accent: "#1e40af",
    muted: "#94a3b8",
  },
  {
    id: "ocean",
    name: "Ocean",
    bg: "#0c4a6e",
    fg: "#e0f2fe",
    accent: "#22d3ee",
    muted: "#7dd3fc",
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: "#1c1917",
    fg: "#fef3c7",
    accent: "#f97316",
    muted: "#a8a29e",
  },
  {
    id: "forest",
    name: "Forest",
    bg: "#14532d",
    fg: "#dcfce7",
    accent: "#4ade80",
    muted: "#86efac",
  },
  {
    id: "monochrome",
    name: "Mono",
    bg: "#18181b",
    fg: "#f4f4f5",
    accent: "#a1a1aa",
    muted: "#71717a",
  },
  {
    id: "rose",
    name: "Ros\u00e9",
    bg: "#fff1f2",
    fg: "#1c1917",
    accent: "#e11d48",
    muted: "#fda4af",
  },
  {
    id: "neon",
    name: "Neon",
    bg: "#0a0a0a",
    fg: "#f5f5f5",
    accent: "#a855f7",
    muted: "#525252",
  },
];

const LAYOUTS: { id: SlideLayout; name: string }[] = [
  { id: "title", name: "Title Slide" },
  { id: "content", name: "Content" },
  { id: "bullets", name: "Bullet List" },
  { id: "two-column", name: "Two Column" },
  { id: "image-left", name: "Image Left" },
  { id: "image-right", name: "Image Right" },
  { id: "quote", name: "Quote" },
  { id: "section", name: "Section Break" },
  { id: "blank", name: "Blank" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Canvas Helpers ────────────────────────────────────────── */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── Component ─────────────────────────────────────────────── */

export default function PresentationWorkspace() {
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: uid(),
      layout: "title",
      title: "",
      subtitle: "",
      body: "",
      bullets: [],
      note: "",
    },
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [config, setConfig] = useState<PresentationConfig>({
    theme: "midnight",
    aspectRatio: "16:9",
    fontStyle: "modern",
    primaryColor: "#3b82f6",
    description: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const updateConfig = useCallback((upd: Partial<PresentationConfig>) => {
    setConfig((p) => ({ ...p, ...upd }));
  }, []);

  const slide = slides[currentSlide] || slides[0];
  const themeData =
    THEMES.find((t) => t.id === config.theme) || THEMES[0];
  const dims =
    ASPECT_RATIOS.find((a) => a.id === config.aspectRatio) ||
    ASPECT_RATIOS[0];

  /* ── Canvas Render ──────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const W = dims.w;
    const H = dims.h;
    canvas.width = W;
    canvas.height = H;

    const { bg, fg, accent, muted } = themeData;
    const fontBase =
      config.fontStyle === "classic"
        ? "Georgia, serif"
        : config.fontStyle === "bold"
          ? "'Arial Black', sans-serif"
          : config.fontStyle === "minimal"
            ? "'Helvetica Neue', Helvetica, sans-serif"
            : "'Inter', 'Segoe UI', sans-serif";

    const M = 48; /* margin */
    const CW = W - M * 2;
    const CH = H - M * 2;

    /* Background */
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* Decorative background elements */
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = accent;
    /* Corner circles */
    ctx.beginPath();
    ctx.arc(W, 0, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, H, 120, 0, Math.PI * 2);
    ctx.fill();
    /* Dot grid */
    for (let gx = W - 120; gx < W - 20; gx += 14) {
      for (let gy = H - 100; gy < H - 20; gy += 14) {
        ctx.beginPath();
        ctx.arc(gx, gy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    /* Slide number */
    ctx.fillStyle = muted;
    ctx.font = `400 10px ${fontBase}`;
    ctx.textAlign = "right";
    ctx.fillText(
      `${currentSlide + 1} / ${slides.length}`,
      W - M,
      H - 18,
      100,
    );
    ctx.textAlign = "left";

    /* Bottom accent line */
    ctx.fillStyle = accent;
    ctx.fillRect(M, H - 6, CW, 2);

    function safeText(text: string, x: number, y: number, mw: number) {
      if (y > H - 10) return;
      ctx.fillText(text, x, y, mw);
    }

    function wrapText(
      text: string,
      x: number,
      y: number,
      mw: number,
      lh: number,
    ): number {
      const words = text.split(" ");
      let line = "";
      let cy = y;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > mw && line) {
          if (cy > H - 20) return cy;
          ctx.fillText(line.trim(), x, cy, mw);
          line = word + " ";
          cy += lh;
        } else {
          line = test;
        }
      }
      if (cy <= H - 20) ctx.fillText(line.trim(), x, cy, mw);
      return cy + lh;
    }

    function drawImagePlaceholder(
      x: number,
      y: number,
      w: number,
      h: number,
    ) {
      ctx.fillStyle = accent + "11";
      roundRect(ctx, x, y, w, h, 8);
      ctx.fill();
      ctx.strokeStyle = accent + "33";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.font = `400 12px ${fontBase}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("\uD83D\uDDBC Image", x + w / 2, y + h / 2, w - 20);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    const layout = slide.layout;
    const title = slide.title || "Slide Title";
    const subtitle = slide.subtitle || "";
    const body = slide.body || "";
    const bullets = slide.bullets.filter((b) => b.trim());

    /* ═══════════════════════════════════════════════════════ */
    /* Layout: Title                                          */
    /* ═══════════════════════════════════════════════════════ */
    if (layout === "title") {
      /* Center everything */
      ctx.textAlign = "center";

      /* Decorative accent bar */
      ctx.fillStyle = accent;
      ctx.fillRect(W / 2 - 30, H * 0.38, 60, 3);

      ctx.fillStyle = fg;
      ctx.font = `800 ${config.fontStyle === "bold" ? 38 : 34}px ${fontBase}`;
      const titleY = H * 0.48;
      safeText(title, W / 2, titleY, CW);

      if (subtitle) {
        ctx.fillStyle = muted;
        ctx.font = `300 16px ${fontBase}`;
        safeText(subtitle, W / 2, titleY + 40, CW);
      }

      if (body) {
        ctx.fillStyle = muted;
        ctx.font = `400 12px ${fontBase}`;
        safeText(body, W / 2, titleY + 70, CW * 0.7);
      }

      ctx.textAlign = "left";

      /* ═══════════════════════════════════════════════════════ */
      /* Layout: Section Break                                  */
      /* ═══════════════════════════════════════════════════════ */
    } else if (layout === "section") {
      /* Large accent background */
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, accent + "22");
      grad.addColorStop(1, accent + "08");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";
      ctx.fillStyle = fg;
      ctx.font = `700 30px ${fontBase}`;
      safeText(title, W / 2, H * 0.46, CW);

      if (subtitle) {
        ctx.fillStyle = accent;
        ctx.font = `400 14px ${fontBase}`;
        safeText(subtitle, W / 2, H * 0.46 + 36, CW);
      }
      ctx.textAlign = "left";

      /* ═══════════════════════════════════════════════════════ */
      /* Layout: Content                                        */
      /* ═══════════════════════════════════════════════════════ */
    } else if (layout === "content") {
      ctx.fillStyle = fg;
      ctx.font = `700 22px ${fontBase}`;
      safeText(title, M, M + 30, CW);

      /* Accent underline */
      ctx.fillStyle = accent;
      ctx.fillRect(M, M + 38, 40, 3);

      let cy = M + 60;
      if (body) {
        ctx.fillStyle = fg;
        ctx.font = `400 13px ${fontBase}`;
        cy = wrapText(body, M, cy, CW, 20);
      }

      if (bullets.length > 0 && cy < H - 40) {
        cy += 8;
        bullets.forEach((b) => {
          if (cy > H - 30) return;
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(M + 6, cy - 4, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = fg;
          ctx.font = `400 12px ${fontBase}`;
          safeText(b, M + 18, cy, CW - 18);
          cy += 24;
        });
      }

      /* ═══════════════════════════════════════════════════════ */
      /* Layout: Bullets                                        */
      /* ═══════════════════════════════════════════════════════ */
    } else if (layout === "bullets") {
      ctx.fillStyle = fg;
      ctx.font = `700 22px ${fontBase}`;
      safeText(title, M, M + 30, CW);
      ctx.fillStyle = accent;
      ctx.fillRect(M, M + 38, 40, 3);

      let cy = M + 60;
      if (subtitle) {
        ctx.fillStyle = muted;
        ctx.font = `400 12px ${fontBase}`;
        safeText(subtitle, M, cy, CW);
        cy += 24;
      }

      bullets.forEach((b, idx) => {
        if (cy > H - 40) return;
        /* Numbered circle */
        ctx.fillStyle = accent + "22";
        ctx.beginPath();
        ctx.arc(M + 14, cy + 2, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = accent;
        ctx.font = `700 10px ${fontBase}`;
        ctx.textAlign = "center";
        ctx.fillText(String(idx + 1), M + 14, cy + 6, 20);
        ctx.textAlign = "left";

        ctx.fillStyle = fg;
        ctx.font = `400 13px ${fontBase}`;
        safeText(b, M + 34, cy + 5, CW - 40);
        cy += 32;
      });

      /* ═══════════════════════════════════════════════════════ */
      /* Layout: Two Column                                     */
      /* ═══════════════════════════════════════════════════════ */
    } else if (layout === "two-column") {
      ctx.fillStyle = fg;
      ctx.font = `700 22px ${fontBase}`;
      safeText(title, M, M + 30, CW);
      ctx.fillStyle = accent;
      ctx.fillRect(M, M + 38, 40, 3);

      const colW = (CW - 30) / 2;
      const col1X = M;
      const col2X = M + colW + 30;
      let cy = M + 58;

      /* Left column: body */
      if (body) {
        ctx.fillStyle = fg;
        ctx.font = `400 12px ${fontBase}`;
        cy = wrapText(body, col1X, cy, colW, 18);
      }

      /* Right column: bullets */
      let ry = M + 58;
      bullets.forEach((b) => {
        if (ry > H - 30) return;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(col2X + 4, ry - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = fg;
        ctx.font = `400 12px ${fontBase}`;
        safeText(b, col2X + 14, ry, colW - 14);
        ry += 22;
      });

      /* Vertical divider */
      ctx.strokeStyle = accent + "33";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(M + colW + 15, M + 50);
      ctx.lineTo(M + colW + 15, Math.max(cy, ry));
      ctx.stroke();

      /* ═══════════════════════════════════════════════════════ */
      /* Layout: Image Left                                     */
      /* ═══════════════════════════════════════════════════════ */
    } else if (layout === "image-left") {
      const imgW = Math.round(CW * 0.42);
      const imgH = CH - 20;
      drawImagePlaceholder(M, M + 10, imgW, imgH);

      const txtX = M + imgW + 24;
      const txtW = CW - imgW - 24;

      ctx.fillStyle = fg;
      ctx.font = `700 20px ${fontBase}`;
      let ty = M + 36;
      safeText(title, txtX, ty, txtW);
      ty += 10;
      ctx.fillStyle = accent;
      ctx.fillRect(txtX, ty, 30, 2);
      ty += 18;

      if (body) {
        ctx.fillStyle = fg;
        ctx.font = `400 12px ${fontBase}`;
        ty = wrapText(body, txtX, ty, txtW, 18);
        ty += 4;
      }

      bullets.forEach((b) => {
        if (ty > H - 30) return;
        ctx.fillStyle = accent;
        ctx.font = `400 12px ${fontBase}`;
        safeText("\u2022 " + b, txtX, ty, txtW);
        ty += 20;
      });

      /* ═══════════════════════════════════════════════════════ */
      /* Layout: Image Right                                    */
      /* ═══════════════════════════════════════════════════════ */
    } else if (layout === "image-right") {
      const imgW = Math.round(CW * 0.42);
      const imgH = CH - 20;
      drawImagePlaceholder(W - M - imgW, M + 10, imgW, imgH);

      const txtW = CW - imgW - 24;

      ctx.fillStyle = fg;
      ctx.font = `700 20px ${fontBase}`;
      let ty = M + 36;
      safeText(title, M, ty, txtW);
      ty += 10;
      ctx.fillStyle = accent;
      ctx.fillRect(M, ty, 30, 2);
      ty += 18;

      if (body) {
        ctx.fillStyle = fg;
        ctx.font = `400 12px ${fontBase}`;
        ty = wrapText(body, M, ty, txtW, 18);
        ty += 4;
      }

      bullets.forEach((b) => {
        if (ty > H - 30) return;
        ctx.fillStyle = accent;
        ctx.font = `400 12px ${fontBase}`;
        safeText("\u2022 " + b, M, ty, txtW);
        ty += 20;
      });

      /* ═══════════════════════════════════════════════════════ */
      /* Layout: Quote                                          */
      /* ═══════════════════════════════════════════════════════ */
    } else if (layout === "quote") {
      /* Large quotation mark */
      ctx.fillStyle = accent + "22";
      ctx.font = `700 120px Georgia, serif`;
      ctx.fillText("\u201C", M, H * 0.35, 100);

      ctx.textAlign = "center";
      ctx.fillStyle = fg;
      ctx.font = `italic 300 18px ${fontBase}`;
      const quoteW = CW * 0.75;
      wrapText(
        title,
        W / 2,
        H * 0.38,
        quoteW,
        28,
      );

      if (subtitle) {
        ctx.fillStyle = accent;
        ctx.font = `600 12px ${fontBase}`;
        ctx.fillText(
          "\u2014 " + subtitle,
          W / 2,
          H * 0.68,
          quoteW,
        );
      }
      ctx.textAlign = "left";

      /* ═══════════════════════════════════════════════════════ */
      /* Layout: Blank                                          */
      /* ═══════════════════════════════════════════════════════ */
    } else {
      /* Just decorations, no content layout */
      if (title) {
        ctx.fillStyle = fg;
        ctx.font = `700 22px ${fontBase}`;
        safeText(title, M, M + 30, CW);
      }
    }
  }, [slide, config, themeData, dims, currentSlide, slides.length]);

  /* ── AI Generation ──────────────────────────────────────── */
  const generatePresentation = useCallback(async () => {
    if (!config.description.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `You are a professional presentation designer. Create a slide deck.

DESCRIPTION: "${config.description}"
THEME: ${config.theme}
LOCALE: Zambia

Return ONLY a JSON object (no markdown, no backticks):
{
  "slides": [
    { "layout": "title", "title": "Presentation Title", "subtitle": "Subtitle or tagline", "body": "", "bullets": [] },
    { "layout": "content", "title": "Section Title", "subtitle": "", "body": "Detailed paragraph content...", "bullets": [] },
    { "layout": "bullets", "title": "Key Points", "subtitle": "Overview", "body": "", "bullets": ["Point 1", "Point 2", "Point 3", "Point 4"] },
    { "layout": "two-column", "title": "Comparison", "subtitle": "", "body": "Left column explanation text", "bullets": ["Right bullet 1", "Right bullet 2"] },
    { "layout": "image-right", "title": "Visual Section", "subtitle": "", "body": "Description of what image represents", "bullets": [] },
    { "layout": "quote", "title": "An inspiring quote relevant to the topic", "subtitle": "Author Name", "body": "", "bullets": [] },
    { "layout": "section", "title": "Next Section", "subtitle": "Transition slide", "body": "", "bullets": [] },
    { "layout": "content", "title": "Summary", "subtitle": "", "body": "Final thoughts and call to action", "bullets": ["Key takeaway 1", "Key takeaway 2"] }
  ]
}

Layout types: title, content, bullets, two-column, image-left, image-right, quote, section, blank

Rules:
- 6-10 slides with varied layouts
- Professional, engaging content
- Use bullets sparingly (3-5 items max)
- Include a title slide, section breaks, and a summary
- Keep text concise (presentation-style, not essay-style)`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!response.ok) throw new Error("Failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      let fullText = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.slides?.length) {
          setSlides(
            data.slides.map(
              (s: {
                layout?: string;
                title?: string;
                subtitle?: string;
                body?: string;
                bullets?: string[];
              }) => ({
                id: uid(),
                layout: s.layout || "content",
                title: cleanAIText(s.title || ""),
                subtitle: cleanAIText(s.subtitle || ""),
                body: cleanAIText(s.body || ""),
                bullets: (s.bullets || []).map((b: string) =>
                  cleanAIText(b),
                ),
                note: "",
              }),
            ),
          );
          setCurrentSlide(0);
        }
      }
    } catch {
      /* silent */
    } finally {
      setIsGenerating(false);
    }
  }, [config]);

  /* ── Export ──────────────────────────────────────────────── */
  const exportSlide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `slide-${currentSlide + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [currentSlide]);

  const updateSlide = useCallback(
    (upd: Partial<Slide>) => {
      setSlides((p) =>
        p.map((s, i) => (i === currentSlide ? { ...s, ...upd } : s)),
      );
    },
    [currentSlide],
  );

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* ── Left Panel ── */}
      <div className="w-72 shrink-0 overflow-y-auto space-y-3 pr-1">
        {/* AI Director */}
        <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
          <label className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-secondary-500 mb-2">
            <IconSparkles className="size-3" />
            AI Presentation Director
          </label>
          <textarea
            rows={3}
            placeholder="Describe your presentation topic, audience, and goals..."
            value={config.description}
            onChange={(e) => updateConfig({ description: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-secondary-500/20 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-secondary-500/50 focus:ring-2 focus:ring-secondary-500/20 transition-all resize-none mb-2"
          />
          <button
            onClick={generatePresentation}
            disabled={!config.description.trim() || isGenerating}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-linear-to-r from-secondary-500 to-primary-500 text-white text-[0.625rem] font-bold hover:from-secondary-400 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <IconLoader className="size-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <IconWand className="size-3" /> Generate Deck
              </>
            )}
          </button>
        </div>

        {/* Aspect Ratio */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.id}
                onClick={() => updateConfig({ aspectRatio: ar.id })}
                className={`py-1.5 rounded-lg text-[0.625rem] font-semibold transition-all ${config.aspectRatio === ar.id ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                {ar.id}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Theme
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  updateConfig({
                    theme: t.id,
                    primaryColor: t.accent,
                  })
                }
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${config.theme === t.id ? "ring-2 ring-primary-500" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <div
                  className="size-5 rounded-full border border-gray-200 dark:border-gray-700"
                  style={{ backgroundColor: t.bg }}
                />
                <span className="text-[0.5rem] text-gray-500">
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Font */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Font
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(["modern", "classic", "minimal", "bold"] as const).map(
              (fs) => (
                <button
                  key={fs}
                  onClick={() => updateConfig({ fontStyle: fs })}
                  className={`py-1 rounded-lg text-[0.5625rem] font-semibold capitalize transition-all ${config.fontStyle === fs ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                >
                  {fs}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Export */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3">
          <button
            onClick={exportSlide}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-linear-to-r from-primary-500 to-secondary-500 text-white text-[0.625rem] font-bold hover:from-primary-400 hover:to-secondary-400 transition-colors"
          >
            <IconDownload className="size-3" /> Export Slide (PNG)
          </button>
        </div>

        {/* Slide thumbnails */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
              Slides ({slides.length})
            </label>
            <button
              onClick={() => {
                setSlides((p) => [
                  ...p,
                  {
                    id: uid(),
                    layout: "content",
                    title: "",
                    subtitle: "",
                    body: "",
                    bullets: [],
                    note: "",
                  },
                ]);
                setCurrentSlide(slides.length);
              }}
              className="text-primary-500 hover:text-primary-400"
            >
              <IconPlus className="size-3.5" />
            </button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(i)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${currentSlide === i ? "bg-primary-500/10 ring-1 ring-primary-500/30" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
              >
                <span
                  className="size-5 rounded flex items-center justify-center text-[0.5rem] font-bold shrink-0"
                  style={{
                    backgroundColor: themeData.bg,
                    color: themeData.fg,
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-[0.5625rem] text-gray-600 dark:text-gray-400 truncate">
                  {s.title || s.layout}
                </span>
                {slides.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlides((p) => p.filter((_, j) => j !== i));
                      if (currentSlide >= slides.length - 1)
                        setCurrentSlide(Math.max(0, slides.length - 2));
                    }}
                    className="ml-auto text-gray-300 hover:text-red-500"
                  >
                    <IconTrash className="size-2.5" />
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Center: Canvas ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-auto p-4 gap-3">
        <canvas
          ref={canvasRef}
          className="shadow-2xl rounded-sm"
          style={{
            maxWidth: "100%",
            maxHeight: "calc(100% - 40px)",
            width: "auto",
            height: "auto",
            backgroundColor: themeData.bg,
          }}
        />
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
            disabled={currentSlide === 0}
            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <IconChevronLeft className="size-4" />
          </button>
          <span className="text-xs text-gray-500 font-medium">
            {currentSlide + 1} / {slides.length}
          </span>
          <button
            onClick={() =>
              setCurrentSlide((p) =>
                Math.min(slides.length - 1, p + 1),
              )
            }
            disabled={currentSlide === slides.length - 1}
            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <IconChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Right Panel: Slide Editor ── */}
      <div className="w-80 shrink-0 overflow-y-auto space-y-3 pl-1">
        {/* Layout selector */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            <IconPresentation className="size-3 inline mr-1" />
            Slide Layout
          </label>
          <div className="grid grid-cols-3 gap-1">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => updateSlide({ layout: l.id })}
                className={`py-1.5 px-1 rounded-lg text-[0.5625rem] font-semibold transition-all ${slide.layout === l.id ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Slide Content
          </label>
          <div>
            <label className="text-[0.5625rem] text-gray-500">Title</label>
            <input
              type="text"
              value={slide.title}
              onChange={(e) => updateSlide({ title: e.target.value })}
              placeholder="Slide title..."
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[0.5625rem] text-gray-500">
              Subtitle
            </label>
            <input
              type="text"
              value={slide.subtitle}
              onChange={(e) => updateSlide({ subtitle: e.target.value })}
              placeholder="Subtitle or tagline..."
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[0.5625rem] text-gray-500">Body</label>
            <textarea
              rows={3}
              value={slide.body}
              onChange={(e) => updateSlide({ body: e.target.value })}
              placeholder="Main content..."
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all resize-none"
            />
          </div>
        </div>

        {/* Bullets */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Bullet Points
          </label>
          {slide.bullets.map((b, i) => (
            <div key={i} className="flex gap-1">
              <input
                type="text"
                value={b}
                onChange={(e) => {
                  const newB = [...slide.bullets];
                  newB[i] = e.target.value;
                  updateSlide({ bullets: newB });
                }}
                placeholder={`Point ${i + 1}...`}
                className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50"
              />
              <button
                onClick={() =>
                  updateSlide({
                    bullets: slide.bullets.filter((_, j) => j !== i),
                  })
                }
                className="text-gray-400 hover:text-red-500 text-xs"
              >
                x
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              updateSlide({ bullets: [...slide.bullets, ""] })
            }
            className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-[0.5625rem] text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
          >
            <IconPlus className="size-3 inline mr-1" /> Add Bullet
          </button>
        </div>

        {/* Speaker Notes */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Speaker Notes
          </label>
          <textarea
            rows={3}
            value={slide.note}
            onChange={(e) => updateSlide({ note: e.target.value })}
            placeholder="Notes for this slide (not shown on canvas)..."
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}
