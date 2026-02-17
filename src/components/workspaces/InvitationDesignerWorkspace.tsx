"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload,
  IconLayout, IconDroplet, IconImage,
  IconCalendar, IconUsers,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { loadImage, drawImageCover } from "@/lib/graphics-engine";
import {
  drawProText, drawProDivider,
  generateColorPalette, getTypographicScale, exportHighRes, EXPORT_PRESETS,
} from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { Accordion, AccordionSection } from "@/components/ui";
import { StockImagePanel, type StockImage } from "@/hooks/useStockImages";

/* ── Types ─────────────────────────────────────────────────── */

type InvitationTemplate = "wedding" | "corporate" | "party" | "elegant" | "minimal" | "floral";
type EventType = "wedding" | "corporate" | "party" | "graduation" | "birthday" | "baby-shower";
type PageFormat = "a5" | "a4" | "square";

interface InvitationConfig {
  template: InvitationTemplate;
  eventType: EventType;
  pageFormat: PageFormat;
  primaryColor: string;
  accentColor: string;
  hostNames: string;
  eventTitle: string;
  eventSubtitle: string;
  date: string;
  time: string;
  venue: string;
  venueAddress: string;
  city: string;
  rsvpPhone: string;
  rsvpEmail: string;
  rsvpDeadline: string;
  dressCode: string;
  additionalInfo: string;
  aiPrompt: string;
  bgImageUrl: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const TEMPLATES: { id: InvitationTemplate; name: string }[] = [
  { id: "wedding", name: "Wedding" },
  { id: "corporate", name: "Corporate" },
  { id: "party", name: "Party" },
  { id: "elegant", name: "Elegant" },
  { id: "minimal", name: "Minimal" },
  { id: "floral", name: "Floral" },
];

const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: "wedding", label: "Wedding" },
  { id: "corporate", label: "Corporate Event" },
  { id: "party", label: "Party" },
  { id: "graduation", label: "Graduation" },
  { id: "birthday", label: "Birthday" },
  { id: "baby-shower", label: "Baby Shower" },
];

const PAGE_FORMATS: { id: PageFormat; label: string; w: number; h: number }[] = [
  { id: "a5", label: "A5 (420×595)", w: 420, h: 595 },
  { id: "a4", label: "A4 (595×842)", w: 595, h: 842 },
  { id: "square", label: "Square (500×500)", w: 500, h: 500 },
];

const colorPresets = [
  { name: "Navy Gold", primary: "#1e3a5f", accent: "#c09c2c" },
  { name: "Rose Gold", primary: "#831843", accent: "#d4a574" },
  { name: "Sage", primary: "#065f46", accent: "#6ee7b7" },
  { name: "Burgundy", primary: "#7f1d1d", accent: "#fca5a5" },
  { name: "Royal Purple", primary: "#4a1d96", accent: "#c4b5fd" },
  { name: "Classic Gold", primary: "#713f12", accent: "#fef3c7" },
  { name: "Teal", primary: "#0d7377", accent: "#99f6e4" },
  { name: "Midnight", primary: "#1a1a2e", accent: "#c09c2c" },
  { name: "Blush", primary: "#be185d", accent: "#fce7f3" },
  { name: "Ocean Blue", primary: "#1e40af", accent: "#bfdbfe" },
  { name: "Lilac", primary: "#7c3aed", accent: "#ede9fe" },
  { name: "Ivory", primary: "#92400e", accent: "#fef3c7" },
];

/* ── Component ───────────────────────────────────────────── */

export default function InvitationDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);

  const [config, setConfig] = useState<InvitationConfig>({
    template: "wedding",
    eventType: "wedding",
    pageFormat: "a5",
    primaryColor: "#1e3a5f",
    accentColor: "#c09c2c",
    hostNames: "Mr. & Mrs. Joseph Mwansa",
    eventTitle: "The Wedding Celebration",
    eventSubtitle: "of their daughter",
    date: "Saturday, 21 March 2026",
    time: "14:00",
    venue: "Cathedral of the Holy Cross",
    venueAddress: "Freedom Way",
    city: "Lusaka, Zambia",
    rsvpPhone: "+260 97 1234567",
    rsvpEmail: "rsvp@mwansawedding.com",
    rsvpDeadline: "1 March 2026",
    dressCode: "Formal / Traditional",
    additionalInfo: "Reception to follow at Taj Pamodzi Hotel, Great East Road, Lusaka",
    aiPrompt: "",
    bgImageUrl: "",
  });

  const updateConfig = useCallback((partial: Partial<InvitationConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const currentFormat = PAGE_FORMATS.find((f) => f.id === config.pageFormat) || PAGE_FORMATS[0];
  const PAGE_W = currentFormat.w;
  const PAGE_H = currentFormat.h;

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

    const { template, primaryColor, accentColor } = config;
    const pal = generateColorPalette(primaryColor);
    const typo = getTypographicScale(PAGE_H);
    const m = template === "minimal" ? 40 : 32;
    const cw = PAGE_W - m * 2;

    /* ── Background ─────────────────────────────────────────── */
    if (bgImg) {
      drawImageCover(ctx, bgImg, 0, 0, PAGE_W, PAGE_H);
      // Overlay
      const overlayAlpha = template === "minimal" ? 0.85 : template === "elegant" ? 0.7 : 0.6;
      ctx.fillStyle = hexToRgba("#ffffff", overlayAlpha);
      ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    } else {
      // Template-specific backgrounds
      if (template === "wedding" || template === "elegant") {
        ctx.fillStyle = "#fffef8";
        ctx.fillRect(0, 0, PAGE_W, PAGE_H);
      } else if (template === "party") {
        const grad = ctx.createLinearGradient(0, 0, 0, PAGE_H);
        grad.addColorStop(0, hexToRgba(primaryColor, 0.05));
        grad.addColorStop(1, hexToRgba(accentColor, 0.08));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, PAGE_W, PAGE_H);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, PAGE_W, PAGE_H);
      } else if (template === "corporate") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, PAGE_W, PAGE_H);
      } else if (template === "floral") {
        ctx.fillStyle = "#fdf8f0";
        ctx.fillRect(0, 0, PAGE_W, PAGE_H);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, PAGE_W, PAGE_H);
      }
    }

    /* ── Decorative Border ──────────────────────────────────── */
    if (template === "wedding" || template === "elegant") {
      // Double-line ornate border
      ctx.strokeStyle = hexToRgba(accentColor, 0.4);
      ctx.lineWidth = 1;
      roundRect(ctx, 14, 14, PAGE_W - 28, PAGE_H - 28, 0);
      ctx.stroke();
      ctx.strokeStyle = hexToRgba(accentColor, 0.25);
      ctx.lineWidth = 0.5;
      roundRect(ctx, 20, 20, PAGE_W - 40, PAGE_H - 40, 0);
      ctx.stroke();

      // Corner ornaments
      const corners = [
        { x: 16, y: 16, sx: 1, sy: 1 },
        { x: PAGE_W - 16, y: 16, sx: -1, sy: 1 },
        { x: 16, y: PAGE_H - 16, sx: 1, sy: -1 },
        { x: PAGE_W - 16, y: PAGE_H - 16, sx: -1, sy: -1 },
      ];
      corners.forEach(({ x, y, sx, sy }) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(sx, sy);
        ctx.fillStyle = accentColor;
        // Small decorative fleur
        ctx.beginPath();
        ctx.arc(4, 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(0, 3, 12, 1);
        ctx.fillRect(3, 0, 1, 12);
        ctx.restore();
      });
    } else if (template === "floral") {
      // Soft rounded border with floral corners
      ctx.strokeStyle = hexToRgba(primaryColor, 0.2);
      ctx.lineWidth = 1.5;
      roundRect(ctx, 18, 18, PAGE_W - 36, PAGE_H - 36, 12);
      ctx.stroke();

      // Floral corner decoration (stylized circles)
      const floralCorners = [
        { x: 18, y: 18 },
        { x: PAGE_W - 18, y: 18 },
        { x: 18, y: PAGE_H - 18 },
        { x: PAGE_W - 18, y: PAGE_H - 18 },
      ];
      floralCorners.forEach(({ x, y }) => {
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const r = 8;
          ctx.fillStyle = hexToRgba(accentColor, 0.15);
          ctx.beginPath();
          ctx.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = hexToRgba(primaryColor, 0.3);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (template === "party") {
      // Colorful dots border
      ctx.fillStyle = hexToRgba(accentColor, 0.15);
      for (let i = 0; i < PAGE_W; i += 16) {
        ctx.beginPath(); ctx.arc(i, 8, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(i, PAGE_H - 8, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < PAGE_H; i += 16) {
        ctx.beginPath(); ctx.arc(8, i, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(PAGE_W - 8, i, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    } else if (template === "corporate") {
      // Clean accent line at top
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, PAGE_W, 5);
    }

    /* ── Content ────────────────────────────────────────────── */
    const centerX = PAGE_W / 2;
    let curY = template === "corporate" ? m + 20 : m + 30;

    // Host names / "You are invited" line
    if (template === "wedding" || template === "elegant") {
      drawProText(ctx, config.hostNames, centerX, curY, {
        fontSize: typo.body, fontWeight: 400, color: pal.textMedium, align: "center",
        fontStyle: "classic",
      });
      curY += typo.body + 6;

      drawProText(ctx, "request the honour of your presence", centerX, curY, {
        fontSize: typo.caption, fontWeight: 400, color: pal.textLight, align: "center",
        fontStyle: "classic",
      });
      curY += typo.caption + 6;

      drawProText(ctx, config.eventSubtitle, centerX, curY, {
        fontSize: typo.caption, fontWeight: 400, color: pal.textLight, align: "center",
        fontStyle: "classic",
      });
      curY += typo.caption + 14;
    } else if (template === "corporate") {
      drawProText(ctx, config.hostNames, centerX, curY, {
        fontSize: typo.body, fontWeight: 600, color: primaryColor, align: "center",
      });
      curY += typo.body + 4;
      drawProText(ctx, "cordially invites you to", centerX, curY, {
        fontSize: typo.caption, fontWeight: 400, color: pal.textMedium, align: "center",
      });
      curY += typo.caption + 14;
    } else if (template === "party") {
      drawProText(ctx, "YOU'RE INVITED!", centerX, curY, {
        fontSize: typo.h2, fontWeight: 900, color: primaryColor, align: "center",
      });
      curY += typo.h2 + 4;
      drawProText(ctx, config.hostNames, centerX, curY, {
        fontSize: typo.caption, fontWeight: 500, color: pal.textMedium, align: "center",
      });
      curY += typo.caption + 14;
    } else if (template === "floral") {
      drawProText(ctx, config.hostNames, centerX, curY, {
        fontSize: typo.body, fontWeight: 400, color: pal.textMedium, align: "center",
        fontStyle: "classic",
      });
      curY += typo.body + 4;
      drawProText(ctx, "invite you to celebrate", centerX, curY, {
        fontSize: typo.caption, fontWeight: 400, color: pal.textLight, align: "center",
        fontStyle: "classic",
      });
      curY += typo.caption + 14;
    } else {
      // minimal
      drawProText(ctx, config.hostNames, centerX, curY, {
        fontSize: typo.caption, fontWeight: 500, color: pal.textMedium, align: "center",
      });
      curY += typo.caption + 16;
    }

    /* ── Decorative divider ──────────────────────────────────── */
    if (template === "wedding" || template === "elegant" || template === "floral") {
      const divW = 60;
      drawProDivider(ctx, centerX - divW / 2, curY, divW, accentColor, "gradient");
      curY += 12;
    }

    /* ── Event Title ─────────────────────────────────────────── */
    const titleSize = template === "party" ? typo.display + 2 :
                     template === "wedding" || template === "elegant" ? typo.h1 + 4 :
                     template === "corporate" ? typo.h1 : typo.h2;
    const titleFont: "classic" | "modern" | "bold" = template === "wedding" || template === "elegant" || template === "floral" ? "classic" :
                     template === "party" ? "bold" : "modern";

    drawProText(ctx, config.eventTitle, centerX, curY, {
      fontSize: titleSize,
      fontWeight: template === "minimal" ? 700 : 800,
      color: template === "party" ? primaryColor : pal.textDark,
      align: "center", maxWidth: cw,
      fontStyle: titleFont,
    });
    curY += titleSize + 16;

    /* ── Decorative divider after title ──────────────────────── */
    if (template !== "corporate" && template !== "minimal") {
      const divW = 80;
      drawProDivider(ctx, centerX - divW / 2, curY, divW, accentColor, "gradient");
      curY += 16;
    } else {
      curY += 6;
    }

    /* ── Date, Time, Venue ────────────────────────────────────── */
    // Date
    drawProText(ctx, config.date, centerX, curY, {
      fontSize: typo.body + 1, fontWeight: 600, color: primaryColor, align: "center",
      fontStyle: titleFont,
    });
    curY += typo.body + 8;

    // Time
    drawProText(ctx, `at ${config.time}`, centerX, curY, {
      fontSize: typo.body, fontWeight: 400, color: pal.textMedium, align: "center",
    });
    curY += typo.body + 12;

    // Venue
    drawProText(ctx, config.venue, centerX, curY, {
      fontSize: typo.body + 1, fontWeight: 700, color: pal.textDark, align: "center",
      fontStyle: titleFont,
    });
    curY += typo.body + 4;

    drawProText(ctx, `${config.venueAddress}, ${config.city}`, centerX, curY, {
      fontSize: typo.caption, fontWeight: 400, color: pal.textMedium, align: "center",
    });
    curY += typo.caption + 18;

    /* ── Dress Code ──────────────────────────────────────────── */
    if (config.dressCode) {
      if (template === "corporate" || template === "party") {
        ctx.fillStyle = hexToRgba(primaryColor, 0.06);
        const dcW = 160;
        roundRect(ctx, centerX - dcW / 2, curY, dcW, 28, 14);
        ctx.fill();
        drawProText(ctx, `Dress Code: ${config.dressCode}`, centerX, curY + 8, {
          fontSize: typo.caption, fontWeight: 500, color: primaryColor, align: "center",
        });
      } else {
        drawProText(ctx, `Attire: ${config.dressCode}`, centerX, curY, {
          fontSize: typo.caption, fontWeight: 500, color: pal.textMedium, align: "center",
          fontStyle: "classic",
        });
      }
      curY += 32;
    }

    /* ── Additional Info ─────────────────────────────────────── */
    if (config.additionalInfo && curY < PAGE_H - 120) {
      ctx.font = getCanvasFont(400, typo.caption, "modern");
      const infoLines = wrapCanvasText(ctx, config.additionalInfo, cw - 20);
      infoLines.forEach((line, i) => {
        ctx.fillStyle = pal.textMedium;
        ctx.font = getCanvasFont(400, typo.caption, titleFont);
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(line, centerX, curY + i * (typo.caption + 4));
      });
      curY += infoLines.length * (typo.caption + 4) + 14;
    }

    /* ── RSVP Section ────────────────────────────────────────── */
    if (curY < PAGE_H - 80) {
      // Decorative line
      if (template !== "minimal") {
        const rl = 40;
        drawProDivider(ctx, centerX - rl / 2, curY, rl, accentColor, "gradient");
        curY += 14;
      }

      drawProText(ctx, "RSVP", centerX, curY, {
        fontSize: typo.label + 1, fontWeight: 700, color: primaryColor, align: "center",
        uppercase: true,
      });
      curY += typo.label + 8;

      if (config.rsvpPhone) {
        drawProText(ctx, config.rsvpPhone, centerX, curY, {
          fontSize: typo.caption, fontWeight: 500, color: pal.textMedium, align: "center",
        });
        curY += typo.caption + 4;
      }
      if (config.rsvpEmail) {
        drawProText(ctx, config.rsvpEmail, centerX, curY, {
          fontSize: typo.caption, fontWeight: 500, color: primaryColor, align: "center",
        });
        curY += typo.caption + 4;
      }
      if (config.rsvpDeadline) {
        drawProText(ctx, `Please respond by ${config.rsvpDeadline}`, centerX, curY, {
          fontSize: typo.caption - 1, fontWeight: 400, color: pal.textLight, align: "center",
          fontStyle: "classic",
        });
      }
    }

    /* ── Footer decoration ───────────────────────────────────── */
    if (template === "corporate") {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, PAGE_H - 5, PAGE_W, 5);
    } else if (template === "party") {
      // Repeat dots border at bottom
      ctx.fillStyle = hexToRgba(accentColor, 0.2);
      for (let i = 0; i < PAGE_W; i += 10) {
        ctx.beginPath();
        ctx.arc(i, PAGE_H - 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (template === "minimal") {
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(centerX, PAGE_H - 18, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [config, bgImg, PAGE_W, PAGE_H]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  /* ── AI Generate ─────────────────────────────────────────── */

  const handleAIGenerate = useCallback(async () => {
    if (!config.aiPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate invitation details for: "${config.aiPrompt}".
Return JSON: { "hostNames": "", "eventTitle": "", "eventSubtitle": "", "date": "day, DD Month YYYY", "time": "HH:MM", "venue": "", "venueAddress": "", "city": "", "dressCode": "", "additionalInfo": "one sentence", "rsvpPhone": "+260...", "rsvpEmail": "", "rsvpDeadline": "DD Month YYYY", "eventType": "wedding|corporate|party|graduation|birthday|baby-shower" }
Use Zambian context.`,
          }],
        }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      let text = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      const cleaned = cleanAIText(text);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        updateConfig({
          hostNames: data.hostNames || config.hostNames,
          eventTitle: data.eventTitle || config.eventTitle,
          eventSubtitle: data.eventSubtitle || config.eventSubtitle,
          date: data.date || config.date,
          time: data.time || config.time,
          venue: data.venue || config.venue,
          venueAddress: data.venueAddress || config.venueAddress,
          city: data.city || config.city,
          dressCode: data.dressCode || config.dressCode,
          additionalInfo: data.additionalInfo || config.additionalInfo,
          rsvpPhone: data.rsvpPhone || config.rsvpPhone,
          rsvpEmail: data.rsvpEmail || config.rsvpEmail,
          rsvpDeadline: data.rsvpDeadline || config.rsvpDeadline,
          eventType: data.eventType || config.eventType,
        });
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config, isGenerating, updateConfig]);

  /* ── Stock Image Handler ─────────────────────────────────── */
  const handleStockImageSelect = useCallback(async (img: StockImage) => {
    try {
      const loaded = await loadImage(img.urls.regular);
      setBgImg(loaded);
      updateConfig({ bgImageUrl: img.urls.regular });
    } catch { /* skip */ }
  }, [updateConfig]);

  /* ── Export ──────────────────────────────────────────────── */
  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const settings = EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"];
    exportHighRes(canvas, settings, `invitation-${config.eventType}`);
  }, [config.eventType]);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Invitation-style thumbnail
      ctx.fillStyle = t.id === "wedding" || t.id === "elegant" || t.id === "floral" ? "#fffef8" : "#ffffff";
      roundRect(ctx, 0, 0, w, h, 3);
      ctx.fill();

      // Border
      if (t.id === "wedding" || t.id === "elegant") {
        ctx.strokeStyle = hexToRgba(config.accentColor, 0.3);
        ctx.lineWidth = 0.5;
        roundRect(ctx, 3, 3, w - 6, h - 6, 0);
        ctx.stroke();
      } else if (t.id === "corporate") {
        ctx.fillStyle = config.primaryColor;
        ctx.fillRect(0, 0, w, 3);
        ctx.fillRect(0, h - 3, w, 3);
      } else if (t.id === "party") {
        for (let i = 0; i < w; i += 8) {
          ctx.fillStyle = hexToRgba(config.accentColor, 0.2);
          ctx.beginPath(); ctx.arc(i, 3, 1.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(i, h - 3, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Center text lines placeholder
      const cx = w / 2;
      ctx.fillStyle = hexToRgba(config.primaryColor, 0.2);
      ctx.fillRect(cx - w * 0.25, h * 0.25, w * 0.5, 2);
      ctx.fillStyle = hexToRgba(config.primaryColor, 0.5);
      ctx.fillRect(cx - w * 0.35, h * 0.38, w * 0.7, 3);
      ctx.fillStyle = hexToRgba(config.primaryColor, 0.15);
      ctx.fillRect(cx - w * 0.2, h * 0.52, w * 0.4, 2);
      ctx.fillRect(cx - w * 0.22, h * 0.58, w * 0.44, 2);
      ctx.fillStyle = hexToRgba(config.primaryColor, 0.3);
      ctx.fillRect(cx - w * 0.12, h * 0.72, w * 0.24, 2);
    },
  }));

  const displayW = 340;
  const displayH = Math.round(displayW * (PAGE_H / PAGE_W));

  /* ── Left Panel ──────────────────────────────────────────── */
  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea
          value={config.aiPrompt}
          onChange={(e) => updateConfig({ aiPrompt: e.target.value })}
          placeholder="Describe your event… e.g., 'Traditional Zambian wedding at Anglican Cathedral, Lusaka for 200 guests'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.aiPrompt.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Invitation</>}
        </button>
      </AccordionSection>

      <AccordionSection id="event" icon={<IconCalendar className="size-3.5" />} label="Event Details">
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Event Type</label>
            <select
              value={config.eventType}
              onChange={(e) => updateConfig({ eventType: e.target.value as EventType })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {EVENT_TYPES.map((et) => (
                <option key={et.id} value={et.id}>{et.label}</option>
              ))}
            </select>
          </div>
          {([
            { key: "hostNames", label: "Host Names" },
            { key: "eventTitle", label: "Event Title" },
            { key: "eventSubtitle", label: "Subtitle" },
            { key: "date", label: "Date" },
            { key: "time", label: "Time" },
            { key: "venue", label: "Venue" },
            { key: "venueAddress", label: "Venue Address" },
            { key: "city", label: "City" },
            { key: "dressCode", label: "Dress Code" },
          ] as const).map(({ key, label }) => (
            <div key={key}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{label}</label>
              <input
                type="text"
                value={config[key]}
                onChange={(e) => updateConfig({ [key]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Additional Info</label>
            <textarea
              value={config.additionalInfo}
              onChange={(e) => updateConfig({ additionalInfo: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={2}
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="rsvp" icon={<IconUsers className="size-3.5" />} label="RSVP">
        <div className="space-y-2">
          {([
            { key: "rsvpPhone", label: "RSVP Phone" },
            { key: "rsvpEmail", label: "RSVP Email" },
            { key: "rsvpDeadline", label: "RSVP Deadline" },
          ] as const).map(({ key, label }) => (
            <div key={key}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{label}</label>
              <input
                type="text"
                value={config[key]}
                onChange={(e) => updateConfig({ [key]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="images" icon={<IconImage className="size-3.5" />} label="Background Image">
        <StockImagePanel onSelect={handleStockImageSelect} />
      </AccordionSection>

      <AccordionSection id="format" icon={<IconLayout className="size-3.5" />} label="Page Format">
        <div className="space-y-1.5">
          {PAGE_FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => updateConfig({ pageFormat: f.id })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                config.pageFormat === f.id
                  ? "bg-primary-500 text-gray-950"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <span>{f.label}</span>
              <span className="text-[10px] opacity-60">{f.w}×{f.h}</span>
            </button>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style & Colors">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Color Preset</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {colorPresets.map((c) => (
                <button
                  key={c.primary}
                  onClick={() => updateConfig({ primaryColor: c.primary, accentColor: c.accent })}
                  className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c.primary ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c.primary }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Primary Color</label>
            <input
              type="color"
              value={config.primaryColor}
              onChange={(e) => updateConfig({ primaryColor: e.target.value })}
              className="w-full h-8 rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Accent Color</label>
            <input
              type="color"
              value={config.accentColor}
              onChange={(e) => updateConfig({ accentColor: e.target.value })}
              className="w-full h-8 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="export" icon={<IconDownload className="size-3.5" />} label="Export">
        <div className="space-y-1.5">
          {[
            { id: "web-standard", label: "Web (PNG 2×)", desc: "150 DPI" },
            { id: "print-standard", label: "Print (PNG 300 DPI)", desc: "High quality" },
            { id: "print-ultra", label: "Ultra Print (600 DPI)", desc: "Maximum quality" },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleExport(preset.id)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              <span>{preset.label}</span>
              <span className="text-[10px] text-gray-400">{preset.desc}</span>
            </button>
          ))}
        </div>
      </AccordionSection>
    </Accordion>
  );

  /* ── Right Panel ─────────────────────────────────────────── */
  const rightPanel = (
    <div className="space-y-4">
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => updateConfig({ template: id as InvitationTemplate })}
        thumbWidth={100}
        thumbHeight={140}
      />
    </div>
  );

  return (
    <StickyCanvasLayout
      canvasRef={canvasRef}
      displayWidth={displayW}
      displayHeight={displayH}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
      onZoomFit={() => setZoom(1)}
      label={`Invitation Designer — ${currentFormat.label} (${PAGE_W}×${PAGE_H})`}
    />
  );
}
