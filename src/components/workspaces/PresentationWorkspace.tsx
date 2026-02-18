"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
  IconChevronUp,
  IconChevronDown,
  IconCopy,
  IconClipboard,
  IconImage,
  IconChart,
  IconMaximize,
} from "@/components/icons";
import { cleanAIText, roundRect } from "@/lib/canvas-utils";
import PptxGenJS from "pptxgenjs";
import { jsPDF } from "jspdf";
import StickyCanvasLayout from "@/components/workspaces/StickyCanvasLayout";
import TemplateSlider, {
  type TemplatePreview,
} from "@/components/workspaces/TemplateSlider";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  subtitle: string;
  body: string;
  bullets: string[];
  note: string;
  imageUrl: string;
  chartPlaceholder: "" | "bar" | "line" | "pie";
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
      imageUrl: "",
      chartPlaceholder: "",
    },
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [clipboardSlide, setClipboardSlide] = useState<Slide | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const presentRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

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

  /* ── Zoom & display ─────────────────────────────────────── */
  const [zoom, setZoom] = useState(0.75);
  const displayWidth = dims.w * zoom;
  const displayHeight = dims.h * zoom;

  /* ── Theme Previews for TemplateSlider ──────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () =>
      THEMES.map((t) => ({
        id: t.id,
        label: t.name,
        render(ctx: CanvasRenderingContext2D, w: number, h: number) {
          /* Mini slide preview with theme colours */
          ctx.fillStyle = t.bg;
          ctx.fillRect(0, 0, w, h);
          /* Accent bar */
          ctx.fillStyle = t.accent;
          ctx.fillRect(0, h * 0.82, w, 2);
          /* Decorative circle */
          ctx.globalAlpha = 0.08;
          ctx.fillStyle = t.accent;
          ctx.beginPath();
          ctx.arc(w * 0.85, h * 0.15, w * 0.22, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          /* Title line */
          ctx.fillStyle = t.fg;
          ctx.fillRect(w * 0.12, h * 0.3, w * 0.55, 4);
          /* Subtitle line */
          ctx.fillStyle = t.muted;
          ctx.fillRect(w * 0.2, h * 0.45, w * 0.4, 3);
          /* Bullet dots */
          ctx.fillStyle = t.accent;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(w * 0.18, h * 0.58 + i * (h * 0.07), 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = t.fg + "66";
            ctx.fillRect(w * 0.24, h * 0.565 + i * (h * 0.07), w * 0.45, 2);
            ctx.fillStyle = t.accent;
          }
        },
      })),
    [],
  );

  /* ── Copy to Clipboard ──────────────────────────────────── */
  const handleCopy = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    });
  }, []);

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

    /* ── Draw uploaded image if present ────────────────────── */
    if (slide.imageUrl) {
      const img = loadedImagesRef.current.get(slide.imageUrl);
      if (img) {
        const imgW = 160;
        const imgH = 120;
        const imgX = W - M - imgW;
        const imgY = M + 10;
        ctx.save();
        roundRect(ctx, imgX, imgY, imgW, imgH, 6);
        ctx.clip();
        ctx.drawImage(img, imgX, imgY, imgW, imgH);
        ctx.restore();
        ctx.strokeStyle = accent + "33";
        ctx.lineWidth = 1;
        roundRect(ctx, imgX, imgY, imgW, imgH, 6);
        ctx.stroke();
      }
    }

    /* ── Draw chart placeholder if present ─────────────────── */
    if (slide.chartPlaceholder) {
      const cw = 180;
      const ch = 100;
      const cx = W - M - cw;
      const cy2 = H - M - ch - 10;
      ctx.fillStyle = accent + "11";
      ctx.fillRect(cx, cy2, cw, ch);
      ctx.strokeStyle = accent + "44";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy2, cw, ch);

      /* Draw mini chart icon */
      ctx.fillStyle = accent + "44";
      if (slide.chartPlaceholder === "bar") {
        const bw = 14;
        const gap = 6;
        const bars = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8];
        bars.forEach((h, idx) => {
          const bx = cx + 24 + idx * (bw + gap);
          const bh = (ch - 40) * h;
          const by = cy2 + ch - 20 - bh;
          ctx.fillRect(bx, by, bw, bh);
        });
      } else if (slide.chartPlaceholder === "line") {
        ctx.strokeStyle = accent + "66";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const pts = [0.6, 0.3, 0.5, 0.2, 0.4, 0.15, 0.35];
        pts.forEach((p, idx) => {
          const px = cx + 20 + idx * ((cw - 40) / (pts.length - 1));
          const py = cy2 + 15 + (ch - 35) * p;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      } else if (slide.chartPlaceholder === "pie") {
        const pcx = cx + cw / 2;
        const pcy = cy2 + ch / 2;
        const pr = Math.min(cw, ch) / 2 - 15;
        const slices = [0.35, 0.25, 0.2, 0.2];
        let startAngle = -Math.PI / 2;
        const alphas = ["44", "66", "33", "22"];
        slices.forEach((s, idx) => {
          const endAngle = startAngle + s * Math.PI * 2;
          ctx.fillStyle = accent + alphas[idx];
          ctx.beginPath();
          ctx.moveTo(pcx, pcy);
          ctx.arc(pcx, pcy, pr, startAngle, endAngle);
          ctx.closePath();
          ctx.fill();
          startAngle = endAngle;
        });
      }

      ctx.fillStyle = muted;
      ctx.font = `600 11px ${fontBase}`;
      ctx.textAlign = "center";
      ctx.fillText(
        `Chart: ${slide.chartPlaceholder.charAt(0).toUpperCase() + slide.chartPlaceholder.slice(1)}`,
        cx + cw / 2,
        cy2 + ch - 6,
        cw - 20,
      );
      ctx.textAlign = "left";
    }
  }, [slide, config, themeData, dims, currentSlide, slides.length, advancedSettings]);

  /* ── Load images for slides ─────────────────────────────── */
  useEffect(() => {
    slides.forEach((s) => {
      if (s.imageUrl && !loadedImagesRef.current.has(s.imageUrl)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          loadedImagesRef.current.set(s.imageUrl, img);
          /* Trigger re-render to paint image on canvas */
          setSlides((prev) => [...prev]);
        };
        img.src = s.imageUrl;
      }
    });
  }, [slides]);

  /* ── Presenter Mode Keyboard ────────────────────────────── */
  useEffect(() => {
    if (!isPresentMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide((p) => Math.min(slides.length - 1, p + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlide((p) => Math.max(0, p - 1));
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsPresentMode(false);
        if (document.fullscreenElement) document.exitFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPresentMode, slides.length]);

  /* Exit present mode if fullscreen exits externally */
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement && isPresentMode) {
        setIsPresentMode(false);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [isPresentMode]);

  /* ── Present Mode Toggle ────────────────────────────────── */
  const enterPresentMode = useCallback(() => {
    setIsPresentMode(true);
    setTimeout(() => {
      presentRef.current?.requestFullscreen?.();
    }, 50);
  }, []);

  /* ── Slide Management ───────────────────────────────────── */
  const moveSlide = useCallback(
    (index: number, direction: "up" | "down") => {
      setSlides((prev) => {
        const next = [...prev];
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= next.length) return prev;
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
      const target = direction === "up" ? index - 1 : index + 1;
      if (target >= 0 && target < slides.length) setCurrentSlide(target);
    },
    [slides.length],
  );

  const duplicateSlide = useCallback(
    (index: number) => {
      const src = slides[index];
      const dup: Slide = { ...src, id: uid(), bullets: [...src.bullets] };
      setSlides((prev) => [
        ...prev.slice(0, index + 1),
        dup,
        ...prev.slice(index + 1),
      ]);
      setCurrentSlide(index + 1);
    },
    [slides],
  );

  const copySlide = useCallback(
    (index: number) => {
      setClipboardSlide({ ...slides[index], bullets: [...slides[index].bullets] });
    },
    [slides],
  );

  const pasteSlide = useCallback(() => {
    if (!clipboardSlide) return;
    const pasted: Slide = { ...clipboardSlide, id: uid(), bullets: [...clipboardSlide.bullets] };
    setSlides((prev) => [
      ...prev.slice(0, currentSlide + 1),
      pasted,
      ...prev.slice(currentSlide + 1),
    ]);
    setCurrentSlide(currentSlide + 1);
  }, [clipboardSlide, currentSlide]);

  /* ── Helper: render one slide to an off-screen canvas ──── */
  const renderSlideToCanvas = useCallback(
    (slideIndex: number): HTMLCanvasElement => {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = dims.w;
      offCanvas.height = dims.h;
      const ctx = offCanvas.getContext("2d")!;
      const { bg, fg, accent, muted } = themeData;
      const fontBase =
        config.fontStyle === "classic"
          ? "Georgia, serif"
          : config.fontStyle === "bold"
            ? "'Arial Black', sans-serif"
            : config.fontStyle === "minimal"
              ? "'Helvetica Neue', Helvetica, sans-serif"
              : "'Inter', 'Segoe UI', sans-serif";
      const W = dims.w;
      const H = dims.h;
      const M = 48;
      const CW = W - M * 2;
      const s = slides[slideIndex];

      /* Background */
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      /* Decorative elements */
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(W, 0, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, H, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      /* Slide number */
      ctx.fillStyle = muted;
      ctx.font = `400 10px ${fontBase}`;
      ctx.textAlign = "right";
      ctx.fillText(`${slideIndex + 1} / ${slides.length}`, W - M, H - 18, 100);
      ctx.textAlign = "left";

      /* Bottom accent line */
      ctx.fillStyle = accent;
      ctx.fillRect(M, H - 6, CW, 2);

      /* Title */
      const title = s.title || "Slide Title";
      ctx.fillStyle = fg;
      if (s.layout === "title") {
        ctx.textAlign = "center";
        ctx.fillStyle = accent;
        ctx.fillRect(W / 2 - 30, H * 0.38, 60, 3);
        ctx.fillStyle = fg;
        ctx.font = `800 ${config.fontStyle === "bold" ? 38 : 34}px ${fontBase}`;
        ctx.fillText(title, W / 2, H * 0.48, CW);
        if (s.subtitle) {
          ctx.fillStyle = muted;
          ctx.font = `300 16px ${fontBase}`;
          ctx.fillText(s.subtitle, W / 2, H * 0.48 + 40, CW);
        }
        ctx.textAlign = "left";
      } else {
        ctx.font = `700 22px ${fontBase}`;
        ctx.fillText(title, M, M + 30, CW);
        ctx.fillStyle = accent;
        ctx.fillRect(M, M + 38, 40, 3);
        let cy = M + 60;
        if (s.body) {
          ctx.fillStyle = fg;
          ctx.font = `400 13px ${fontBase}`;
          const words = s.body.split(" ");
          let line = "";
          for (const word of words) {
            const test = line + word + " ";
            if (ctx.measureText(test).width > CW && line) {
              ctx.fillText(line.trim(), M, cy, CW);
              line = word + " ";
              cy += 20;
            } else line = test;
          }
          ctx.fillText(line.trim(), M, cy, CW);
          cy += 24;
        }
        s.bullets.filter((b) => b.trim()).forEach((b) => {
          if (cy > H - 30) return;
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(M + 6, cy - 4, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = fg;
          ctx.font = `400 12px ${fontBase}`;
          ctx.fillText(b, M + 18, cy, CW - 18);
          cy += 24;
        });
      }

      /* Draw uploaded image if present */
      if (s.imageUrl) {
        const img = loadedImagesRef.current.get(s.imageUrl);
        if (img) {
          const imgW = 160;
          const imgH = 120;
          const imgX = W - M - imgW;
          const imgY = M + 10;
          ctx.drawImage(img, imgX, imgY, imgW, imgH);
        }
      }

      /* Draw chart placeholder if present */
      if (s.chartPlaceholder) {
        const cw = 180;
        const ch = 100;
        const cx = W - M - cw;
        const cy2 = H - M - ch - 10;
        ctx.fillStyle = accent + "11";
        ctx.fillRect(cx, cy2, cw, ch);
        ctx.strokeStyle = accent + "44";
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, cy2, cw, ch);
        ctx.fillStyle = muted;
        ctx.font = `600 11px ${fontBase}`;
        ctx.textAlign = "center";
        ctx.fillText(
          `Chart: ${s.chartPlaceholder.charAt(0).toUpperCase() + s.chartPlaceholder.slice(1)}`,
          cx + cw / 2,
          cy2 + ch / 2 + 4,
          cw - 20,
        );
        ctx.textAlign = "left";
      }

      return offCanvas;
    },
    [slides, dims, themeData, config],
  );

  /* ── PPTX Export ────────────────────────────────────────── */
  const exportPPTX = useCallback(async () => {
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    const { bg, fg, accent, muted } = themeData;

    for (const s of slides) {
      const pptSlide = pptx.addSlide();
      pptSlide.background = { color: bg.replace("#", "") };

      const fontFace =
        config.fontStyle === "classic"
          ? "Georgia"
          : config.fontStyle === "bold"
            ? "Arial Black"
            : config.fontStyle === "minimal"
              ? "Helvetica"
              : "Segoe UI";

      /* Title text */
      if (s.title) {
        const isTitleSlide = s.layout === "title" || s.layout === "section";
        pptSlide.addText(s.title, {
          x: isTitleSlide ? 1 : 0.5,
          y: isTitleSlide ? "40%" : 0.3,
          w: isTitleSlide ? 8 : 9,
          h: 0.8,
          fontSize: isTitleSlide ? 32 : 22,
          fontFace,
          color: fg.replace("#", ""),
          bold: true,
          align: isTitleSlide ? "center" : "left",
        });
      }

      /* Subtitle */
      if (s.subtitle) {
        pptSlide.addText(s.subtitle, {
          x: s.layout === "title" ? 1 : 0.5,
          y: s.layout === "title" ? "55%" : 1.0,
          w: 8,
          h: 0.5,
          fontSize: 14,
          fontFace,
          color: muted.replace("#", ""),
          align: s.layout === "title" ? "center" : "left",
        });
      }

      /* Body */
      if (s.body) {
        pptSlide.addText(s.body, {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 2.5,
          fontSize: 12,
          fontFace,
          color: fg.replace("#", ""),
        });
      }

      /* Bullets */
      const filteredBullets = s.bullets.filter((b) => b.trim());
      if (filteredBullets.length > 0) {
        pptSlide.addText(
          filteredBullets.map((b) => ({
            text: b,
            options: { bullet: true, color: fg.replace("#", "") },
          })),
          {
            x: 0.5,
            y: s.body ? 3.8 : 1.5,
            w: 9,
            h: 2,
            fontSize: 12,
            fontFace,
            color: fg.replace("#", ""),
          },
        );
      }

      /* Chart placeholder as shape */
      if (s.chartPlaceholder) {
        pptSlide.addShape(pptx.ShapeType.rect, {
          x: 6.5,
          y: 3.5,
          w: 3,
          h: 1.8,
          fill: { color: accent.replace("#", ""), transparency: 90 },
          line: { color: accent.replace("#", ""), width: 1 },
        });
        pptSlide.addText(
          `Chart: ${s.chartPlaceholder.charAt(0).toUpperCase() + s.chartPlaceholder.slice(1)}`,
          {
            x: 6.5,
            y: 3.5,
            w: 3,
            h: 1.8,
            fontSize: 11,
            fontFace,
            color: muted.replace("#", ""),
            align: "center",
            valign: "middle",
          },
        );
      }

      /* Accent bar at bottom */
      pptSlide.addShape(pptx.ShapeType.rect, {
        x: 0.5,
        y: 5.2,
        w: 9,
        h: 0.04,
        fill: { color: accent.replace("#", "") },
      });
    }

    await pptx.writeFile({ fileName: "presentation.pptx" });
  }, [slides, themeData, config]);

  /* ── PDF Export ──────────────────────────────────────────── */
  const exportPDF = useCallback(() => {
    const isWide = dims.w > dims.h;
    const pdf = new jsPDF({
      orientation: isWide ? "landscape" : "portrait",
      unit: "px",
      format: [dims.w, dims.h],
    });

    slides.forEach((_, idx) => {
      if (idx > 0) pdf.addPage([dims.w, dims.h], isWide ? "landscape" : "portrait");
      const offCanvas = renderSlideToCanvas(idx);
      const imgData = offCanvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, dims.w, dims.h);
    });

    pdf.save("presentation.pdf");
  }, [slides, dims, renderSlideToCanvas]);

  /* ── PNG All Slides Export ──────────────────────────────── */
  const exportAllPNG = useCallback(() => {
    slides.forEach((_, idx) => {
      const offCanvas = renderSlideToCanvas(idx);
      const link = document.createElement("a");
      link.download = `slide-${idx + 1}.png`;
      link.href = offCanvas.toDataURL("image/png");
      link.click();
    });
  }, [slides, renderSlideToCanvas]);

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
                imageUrl: "",
                chartPlaceholder: "",
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
  }, [config, advancedSettings]);

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

  /* ── Image Upload Handler ───────────────────────────────── */
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        if (url) updateSlide({ imageUrl: url });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [updateSlide],
  );

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
      <StickyCanvasLayout
        canvasRef={canvasRef}
        displayWidth={displayWidth}
        displayHeight={displayHeight}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(2, z + 0.1))}
        onZoomOut={() => setZoom((z) => Math.max(0.3, z - 0.1))}
        onZoomFit={() => setZoom(0.75)}
        label={`Presentation — ${config.aspectRatio} — Slide ${currentSlide + 1}/${slides.length}`}
        mobileTabs={["Canvas", "Design", "Editor"]}
        /* ── Toolbar: slide navigation + present ───────────── */
        toolbar={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
              disabled={currentSlide === 0}
              className="p-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <IconChevronLeft className="size-3.5" />
            </button>
            <span className="text-[0.625rem] text-gray-500 font-semibold tabular-nums">
              {currentSlide + 1} / {slides.length}
            </span>
            <button
              onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))}
              disabled={currentSlide === slides.length - 1}
              className="p-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <IconChevronRight className="size-3.5" />
            </button>
            <button
              onClick={enterPresentMode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-primary-500/30 text-primary-500 text-[0.625rem] font-bold hover:bg-primary-500/10 transition-colors"
            >
              <IconMaximize className="size-3" /> Present
            </button>
          </div>
        }
        /* ── Actions Bar: exports ──────────────────────────── */
        actionsBar={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportPPTX}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-linear-to-r from-primary-500 to-secondary-500 text-white text-[0.625rem] font-bold hover:from-primary-400 hover:to-secondary-400 transition-colors"
            >
              <IconDownload className="size-3" /> PPTX
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[0.625rem] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <IconDownload className="size-3" /> PDF
            </button>
            <button
              onClick={exportSlide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[0.625rem] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <IconDownload className="size-3" /> PNG
            </button>
            <button
              onClick={exportAllPNG}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[0.625rem] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <IconDownload className="size-3" /> All PNG
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[0.625rem] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <IconCopy className="size-3" /> Copy
            </button>
          </div>
        }
        /* ── Left Panel: AI + Design + Slides ──────────────── */
        leftPanel={
          <div className="space-y-3">
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

            {/* Theme Previews */}
            <TemplateSlider
              templates={templatePreviews}
              activeId={config.theme}
              onSelect={(id) =>
                updateConfig({
                  theme: id as PresentationTheme,
                  primaryColor: THEMES.find((t) => t.id === id)?.accent ?? config.primaryColor,
                })
              }
              thumbWidth={120}
              thumbHeight={72}
              label="Theme"
            />

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

            {/* Font */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
              <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
                Font Style
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

            {/* Slide Filmstrip */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
                  Slides ({slides.length})
                </label>
                <div className="flex items-center gap-1">
                  {clipboardSlide && (
                    <button
                      onClick={pasteSlide}
                      title="Paste slide"
                      className="text-secondary-500 hover:text-secondary-400"
                    >
                      <IconClipboard className="size-3.5" />
                    </button>
                  )}
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
                          imageUrl: "",
                          chartPlaceholder: "",
                        },
                      ]);
                      setCurrentSlide(slides.length);
                    }}
                    className="text-primary-500 hover:text-primary-400"
                  >
                    <IconPlus className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {slides.map((s, i) => (
                  <div
                    key={s.id}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer ${currentSlide === i ? "bg-primary-500/10 ring-1 ring-primary-500/30" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
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
                    <span className="text-[0.5625rem] text-gray-600 dark:text-gray-400 truncate flex-1 min-w-0">
                      {s.title || s.layout}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => moveSlide(i, "up")}
                        disabled={i === 0}
                        title="Move up"
                        className="text-gray-400 hover:text-primary-500 disabled:opacity-20"
                      >
                        <IconChevronUp className="size-2.5" />
                      </button>
                      <button
                        onClick={() => moveSlide(i, "down")}
                        disabled={i === slides.length - 1}
                        title="Move down"
                        className="text-gray-400 hover:text-primary-500 disabled:opacity-20"
                      >
                        <IconChevronDown className="size-2.5" />
                      </button>
                      <button
                        onClick={() => duplicateSlide(i)}
                        title="Duplicate"
                        className="text-gray-400 hover:text-secondary-500"
                      >
                        <IconCopy className="size-2.5" />
                      </button>
                      <button
                        onClick={() => copySlide(i)}
                        title="Copy to clipboard"
                        className="text-gray-400 hover:text-secondary-500"
                      >
                        <IconClipboard className="size-2.5" />
                      </button>
                      {slides.length > 1 && (
                        <button
                          onClick={() => {
                            setSlides((p) => p.filter((_, j) => j !== i));
                            if (currentSlide >= slides.length - 1)
                              setCurrentSlide(Math.max(0, slides.length - 2));
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <IconTrash className="size-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Settings — Global */}
            <AdvancedSettingsPanel />
          </div>
        }
        /* ── Right Panel: Slide Editor ─────────────────────── */
        rightPanel={
          <div className="space-y-3">
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

            {/* Image Upload */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
              <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
                <IconImage className="size-3 inline mr-1" />
                Slide Image
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {slide.imageUrl ? (
                <div className="space-y-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageUrl}
                    alt="Slide"
                    className="w-full h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="flex-1 py-1 rounded-lg text-[0.5625rem] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => updateSlide({ imageUrl: "" })}
                      className="flex-1 py-1 rounded-lg text-[0.5625rem] font-semibold bg-gray-100 dark:bg-gray-800 text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full py-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-[0.5625rem] text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors flex flex-col items-center gap-1"
                >
                  <IconImage className="size-4" />
                  Upload Image
                </button>
              )}
              <div>
                <label className="text-[0.5625rem] text-gray-500">Or paste URL</label>
                <input
                  type="url"
                  value={slide.imageUrl}
                  onChange={(e) => updateSlide({ imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
              <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
                <IconChart className="size-3 inline mr-1" />
                Chart Placeholder
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(["" , "bar", "line", "pie"] as const).map((ct) => (
                  <button
                    key={ct || "none"}
                    onClick={() => updateSlide({ chartPlaceholder: ct })}
                    className={`py-1.5 rounded-lg text-[0.5625rem] font-semibold capitalize transition-all ${
                      slide.chartPlaceholder === ct
                        ? "bg-primary-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {ct || "None"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        }
      />

      {/* ── Presenter Mode Overlay ── */}
      {isPresentMode && (
        <div
          ref={presentRef}
          className="fixed inset-0 z-9999 bg-black flex flex-col items-center justify-center"
          onClick={(e) => {
            /* Click right half = next, left half = previous */
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x > rect.width / 2) {
              setCurrentSlide((p) => Math.min(slides.length - 1, p + 1));
            } else {
              setCurrentSlide((p) => Math.max(0, p - 1));
            }
          }}
        >
          <canvas
            ref={(el) => {
              if (!el) return;
              /* Render current slide full-screen */
              const offCanvas = renderSlideToCanvas(currentSlide);
              el.width = offCanvas.width;
              el.height = offCanvas.height;
              const ctx = el.getContext("2d");
              if (ctx) ctx.drawImage(offCanvas, 0, 0);
            }}
            className="max-w-full max-h-full"
            style={{ objectFit: "contain" }}
          />
          {/* Slide counter */}
          <div className="absolute bottom-6 right-8 text-white/60 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
            {currentSlide + 1} / {slides.length}
          </div>
          {/* ESC hint */}
          <div className="absolute top-6 right-8 text-white/30 text-xs">
            Press ESC to exit
          </div>
        </div>
      )}
    </>
  );
}
