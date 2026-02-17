"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload,
  IconLayout, IconDroplet, IconType,
  IconCalendar,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont } from "@/lib/canvas-utils";
import {
  drawProText,
  generateColorPalette, exportHighRes, EXPORT_PRESETS,
} from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { Accordion, AccordionSection } from "@/components/ui";

/* ── Types ─────────────────────────────────────────────────── */

type TicketTemplate = "concert" | "sports" | "cinema" | "vip" | "festival" | "corporate";
type TicketSize = "standard" | "wide" | "compact";

interface TicketConfig {
  template: TicketTemplate;
  size: TicketSize;
  primaryColor: string;
  accentColor: string;
  eventName: string;
  eventSubtitle: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  seat: string;
  section: string;
  row: string;
  gate: string;
  price: string;
  currency: string;
  ticketNumber: string;
  barcodeText: string;
  aiPrompt: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const TEMPLATES: { id: TicketTemplate; name: string }[] = [
  { id: "concert", name: "Concert" },
  { id: "sports", name: "Sports" },
  { id: "cinema", name: "Cinema" },
  { id: "vip", name: "VIP" },
  { id: "festival", name: "Festival" },
  { id: "corporate", name: "Corporate" },
];

const SIZES: { id: TicketSize; label: string; w: number; h: number }[] = [
  { id: "standard", label: "Standard (595×200)", w: 595, h: 200 },
  { id: "wide", label: "Wide (700×220)", w: 700, h: 220 },
  { id: "compact", label: "Compact (500×180)", w: 500, h: 180 },
];

const colorPresets = [
  { name: "Navy", primary: "#1e3a5f", accent: "#c09c2c" },
  { name: "Purple", primary: "#7c3aed", accent: "#a78bfa" },
  { name: "Red", primary: "#dc2626", accent: "#fca5a5" },
  { name: "Orange", primary: "#ea580c", accent: "#fdba74" },
  { name: "Teal", primary: "#0d7377", accent: "#14b8a6" },
  { name: "Noir", primary: "#1a1a2e", accent: "#c09c2c" },
  { name: "Indigo", primary: "#6c5ce7", accent: "#a5b4fc" },
  { name: "Forest", primary: "#065f46", accent: "#6ee7b7" },
  { name: "Pink", primary: "#be185d", accent: "#f9a8d4" },
  { name: "Black", primary: "#000000", accent: "#8ae600" },
  { name: "Lime", primary: "#8ae600", accent: "#1e293b" },
  { name: "Cyan", primary: "#06b6d4", accent: "#ffffff" },
];

/* ── Component ───────────────────────────────────────────── */

export default function TicketDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [config, setConfig] = useState<TicketConfig>({
    template: "concert",
    size: "standard",
    primaryColor: "#1a1a2e",
    accentColor: "#c09c2c",
    eventName: "Zambian Music Awards 2026",
    eventSubtitle: "Live Concert & Awards Night",
    date: "Saturday, 28 March 2026",
    time: "18:00",
    venue: "Levy Mwanawasa Stadium",
    city: "Lusaka, Zambia",
    seat: "A-42",
    section: "VIP",
    row: "3",
    gate: "Gate B",
    price: "500",
    currency: "ZMW",
    ticketNumber: "ZMA-2026-00042",
    barcodeText: "ZMA202600042",
    aiPrompt: "",
  });

  const updateConfig = useCallback((partial: Partial<TicketConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const currentSize = SIZES.find((s) => s.id === config.size) || SIZES[0];
  const PAGE_W = currentSize.w;
  const PAGE_H = currentSize.h;

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
    const _pal = generateColorPalette(primaryColor);
    void _pal;
    const m = 16;
    const stubW = 130; // tear-off stub width
    const mainW = PAGE_W - stubW;
    const perfX = mainW; // perforation x

    /* ── Background ─────────────────────────────────────────── */
    // Main ticket area
    ctx.fillStyle = primaryColor;
    roundRect(ctx, 0, 0, PAGE_W, PAGE_H, 10);
    ctx.fill();

    // Template-specific background styling
    if (template === "concert" || template === "festival") {
      // Diagonal stripes
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 8;
      for (let i = -PAGE_H; i < PAGE_W + PAGE_H; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + PAGE_H, PAGE_H);
        ctx.stroke();
      }
      ctx.restore();
    } else if (template === "vip") {
      // Gradient overlay
      const grad = ctx.createLinearGradient(0, 0, PAGE_W, 0);
      grad.addColorStop(0, primaryColor);
      grad.addColorStop(0.7, hexToRgba(accentColor, 0.3));
      grad.addColorStop(1, primaryColor);
      ctx.fillStyle = grad;
      roundRect(ctx, 0, 0, PAGE_W, PAGE_H, 10);
      ctx.fill();
    } else if (template === "sports") {
      // Bold geometric accents
      ctx.fillStyle = hexToRgba(accentColor, 0.15);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(120, 0);
      ctx.lineTo(0, PAGE_H);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(mainW, 0);
      ctx.lineTo(mainW - 60, 0);
      ctx.lineTo(mainW, PAGE_H * 0.4);
      ctx.closePath();
      ctx.fill();
    } else if (template === "cinema") {
      // Film strip border
      ctx.fillStyle = hexToRgba("#ffffff", 0.08);
      for (let y = 8; y < PAGE_H - 8; y += 20) {
        roundRect(ctx, 6, y, 10, 14, 2);
        ctx.fill();
      }
    } else if (template === "corporate") {
      // Subtle bottom accent
      const grad = ctx.createLinearGradient(0, PAGE_H - 30, 0, PAGE_H);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, hexToRgba(accentColor, 0.2));
      ctx.fillStyle = grad;
      ctx.fillRect(0, PAGE_H - 30, mainW, 30);
    }

    /* ── Perforation line ───────────────────────────────────── */
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = hexToRgba("#ffffff", 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(perfX, 8);
    ctx.lineTo(perfX, PAGE_H - 8);
    ctx.stroke();
    ctx.setLineDash([]);

    // Notch circles at perforation
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(perfX, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(perfX, PAGE_H, 8, 0, Math.PI * 2);
    ctx.fill();

    // Cover the notch areas that extend outside
    ctx.fillStyle = template === "vip" ? primaryColor : primaryColor;
    ctx.beginPath();
    ctx.arc(perfX, -1, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(perfX, PAGE_H + 1, 8, 0, Math.PI * 2);
    ctx.fill();
    // Re-draw the notch semicircles to create cutout effect
    // Actually use clip approach: draw white semicircles that look like paper
    ctx.save();
    ctx.fillStyle = "#f8fafc"; // simulated paper color behind
    ctx.beginPath();
    ctx.arc(perfX, 0, 8, 0, Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(perfX, PAGE_H, 8, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* ── Main Ticket Content ────────────────────────────────── */
    const contentX = template === "cinema" ? m + 16 : m;

    // Accent line / badge
    if (template === "vip") {
      ctx.fillStyle = accentColor;
      roundRect(ctx, contentX, m, 50, 18, 9);
      ctx.fill();
      ctx.fillStyle = primaryColor;
      ctx.font = getCanvasFont(800, 8, "modern");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("VIP", contentX + 25, m + 9);
    } else if (template === "festival") {
      ctx.fillStyle = accentColor;
      ctx.fillRect(contentX, m, 30, 3);
    }

    // Event name
    const nameY = template === "vip" ? m + 28 : m + 8;
    drawProText(ctx, config.eventName, contentX, nameY, {
      fontSize: template === "vip" ? 18 : 16,
      fontWeight: 900, color: "#ffffff", maxWidth: mainW - m * 2 - 20,
      fontStyle: template === "corporate" ? "modern" : template === "vip" ? "classic" : "bold",
    });

    // Subtitle
    drawProText(ctx, config.eventSubtitle, contentX, nameY + 22, {
      fontSize: 9, fontWeight: 400, color: hexToRgba("#ffffff", 0.7),
      maxWidth: mainW - m * 2 - 20,
    });

    // Accent divider
    const divY = nameY + 38;
    ctx.fillStyle = accentColor;
    if (template === "corporate") {
      ctx.fillRect(contentX, divY, 40, 2);
    } else {
      ctx.fillRect(contentX, divY, mainW - m * 2, 1);
    }

    // Details row
    const detailY = divY + 14;
    const detailItems = [
      { label: "DATE", value: config.date },
      { label: "TIME", value: config.time },
      { label: "VENUE", value: config.venue },
    ];
    const detailW = (mainW - m * 2) / 3;

    detailItems.forEach((item, i) => {
      const dx = contentX + i * detailW;
      ctx.fillStyle = hexToRgba("#ffffff", 0.5);
      ctx.font = getCanvasFont(600, 7, "modern");
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(item.label, dx, detailY);

      ctx.fillStyle = "#ffffff";
      ctx.font = getCanvasFont(600, 9, "modern");
      ctx.fillText(item.value, dx, detailY + 11);
    });

    // Seat info row
    const seatY = detailY + 34;
    const seatItems = [
      { label: "SECTION", value: config.section },
      { label: "ROW", value: config.row },
      { label: "SEAT", value: config.seat },
      { label: "GATE", value: config.gate },
    ];
    const seatW = (mainW - m * 2) / 4;

    seatItems.forEach((item, i) => {
      const sx = contentX + i * seatW;
      ctx.fillStyle = hexToRgba("#ffffff", 0.5);
      ctx.font = getCanvasFont(600, 7, "modern");
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(item.label, sx, seatY);

      ctx.fillStyle = accentColor;
      ctx.font = getCanvasFont(800, 12, "modern");
      ctx.fillText(item.value, sx, seatY + 11);
    });

    // Price at bottom of main
    const priceY = PAGE_H - m - 14;
    drawProText(ctx, `${config.currency} ${config.price}`, contentX, priceY, {
      fontSize: 12, fontWeight: 800, color: accentColor,
    });
    drawProText(ctx, config.ticketNumber, mainW - m - 10, priceY + 2, {
      fontSize: 7, fontWeight: 500, color: hexToRgba("#ffffff", 0.4), align: "right",
    });

    /* ── Tear-off Stub ──────────────────────────────────────── */
    const stubX = perfX + 10;

    // Stub content (rotated text for some templates)
    ctx.save();
    if (template === "concert" || template === "festival" || template === "vip") {
      // Vertical text on stub
      ctx.translate(stubX + stubW / 2 - 5, PAGE_H / 2);
      ctx.rotate(-Math.PI / 2);

      ctx.fillStyle = "#ffffff";
      ctx.font = getCanvasFont(800, 10, "modern");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.eventName, 0, -20);

      ctx.fillStyle = hexToRgba("#ffffff", 0.6);
      ctx.font = getCanvasFont(500, 7, "modern");
      ctx.fillText(`${config.date} • ${config.time}`, 0, -4);

      ctx.fillStyle = accentColor;
      ctx.font = getCanvasFont(800, 9, "modern");
      ctx.fillText(`${config.section} / ${config.seat}`, 0, 14);
    } else {
      // Horizontal text on stub
      ctx.fillStyle = "#ffffff";
      ctx.font = getCanvasFont(700, 8, "modern");
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const lines = [
        config.eventName.substring(0, 20),
        config.date,
        config.time,
        `${config.section} / ${config.seat}`,
        config.venue.substring(0, 18),
      ];
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? "#ffffff" : i === 3 ? accentColor : hexToRgba("#ffffff", 0.7);
        ctx.font = getCanvasFont(i === 0 ? 700 : i === 3 ? 800 : 400, i === 0 ? 8 : i === 3 ? 10 : 7, "modern");
        ctx.fillText(line, stubX, m + i * 16);
      });
    }
    ctx.restore();

    // Barcode placeholder on stub
    const barcodeY = PAGE_H - m - 40;
    const barcodeW = stubW - 24;
    const barcodeH = 30;
    const bcX = perfX + 12;

    ctx.fillStyle = "#ffffff";
    roundRect(ctx, bcX, barcodeY, barcodeW, barcodeH, 3);
    ctx.fill();

    // Simulated barcode lines
    ctx.fillStyle = "#000000";
    let bx = bcX + 4;
    for (let i = 0; i < 30; i++) {
      const barW = Math.random() > 0.5 ? 2 : 1;
      ctx.fillRect(bx, barcodeY + 3, barW, barcodeH - 12);
      bx += barW + (Math.random() > 0.5 ? 2 : 1);
      if (bx > bcX + barcodeW - 8) break;
    }

    // Barcode number
    ctx.fillStyle = "#333333";
    ctx.font = getCanvasFont(500, 6, "modern");
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(config.barcodeText, bcX + barcodeW / 2, barcodeY + barcodeH - 8);
  }, [config, PAGE_W, PAGE_H]);

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
            content: `Generate ticket details for: "${config.aiPrompt}".
Return JSON: { "eventName": "", "eventSubtitle": "", "date": "day, DD Month YYYY", "time": "HH:MM", "venue": "", "city": "", "seat": "", "section": "", "row": "", "gate": "", "price": "", "currency": "ZMW", "ticketNumber": "" }`,
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
          eventName: data.eventName || config.eventName,
          eventSubtitle: data.eventSubtitle || config.eventSubtitle,
          date: data.date || config.date,
          time: data.time || config.time,
          venue: data.venue || config.venue,
          city: data.city || config.city,
          seat: data.seat || config.seat,
          section: data.section || config.section,
          row: data.row || config.row,
          gate: data.gate || config.gate,
          price: data.price || config.price,
          currency: data.currency || config.currency,
          ticketNumber: data.ticketNumber || config.ticketNumber,
        });
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config, isGenerating, updateConfig]);

  /* ── Export ──────────────────────────────────────────────── */
  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const settings = EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"];
    exportHighRes(canvas, settings, `ticket-${config.template}`);
  }, [config.template]);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Landscape ticket thumbnail
      const ticketH = h * 0.35;
      const ticketY = (h - ticketH) / 2;
      const color = t.id === "vip" ? "#1a1a2e" : t.id === "concert" ? "#7c3aed" : t.id === "sports" ? "#dc2626" : config.primaryColor;

      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = color;
      roundRect(ctx, 4, ticketY, w - 8, ticketH, 4);
      ctx.fill();

      // Perforation
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = hexToRgba("#ffffff", 0.3);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.75, ticketY + 2);
      ctx.lineTo(w * 0.75, ticketY + ticketH - 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Text placeholders
      ctx.fillStyle = hexToRgba("#ffffff", 0.8);
      ctx.fillRect(8, ticketY + 6, w * 0.4, 3);
      ctx.fillStyle = hexToRgba("#ffffff", 0.4);
      ctx.fillRect(8, ticketY + 12, w * 0.25, 2);
    },
  }));

  const displayW = 480;
  const displayH = Math.round(displayW * (PAGE_H / PAGE_W));

  /* ── Left Panel ──────────────────────────────────────────── */
  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea
          value={config.aiPrompt}
          onChange={(e) => updateConfig({ aiPrompt: e.target.value })}
          placeholder="Describe your event… e.g., 'Afro-fusion concert at National Heroes Stadium, Lusaka'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={3}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.aiPrompt.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Ticket</>}
        </button>
      </AccordionSection>

      <AccordionSection id="event" icon={<IconCalendar className="size-3.5" />} label="Event Details">
        <div className="space-y-2">
          {([
            { key: "eventName", label: "Event Name" },
            { key: "eventSubtitle", label: "Subtitle" },
            { key: "date", label: "Date" },
            { key: "time", label: "Time" },
            { key: "venue", label: "Venue" },
            { key: "city", label: "City" },
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

      <AccordionSection id="seating" icon={<IconLayout className="size-3.5" />} label="Seating & Pricing">
        <div className="space-y-2">
          {([
            { key: "section", label: "Section" },
            { key: "row", label: "Row" },
            { key: "seat", label: "Seat" },
            { key: "gate", label: "Gate" },
            { key: "price", label: "Price" },
            { key: "currency", label: "Currency" },
            { key: "ticketNumber", label: "Ticket #" },
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

      <AccordionSection id="size" icon={<IconType className="size-3.5" />} label="Ticket Size">
        <div className="space-y-1.5">
          {SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => updateConfig({ size: s.id })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                config.size === s.id
                  ? "bg-primary-500 text-gray-950"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <span>{s.label}</span>
              <span className="text-[10px] opacity-60">{s.w}×{s.h}</span>
            </button>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style & Colors">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Primary Color</label>
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
            <input
              type="color"
              value={config.primaryColor}
              onChange={(e) => updateConfig({ primaryColor: e.target.value })}
              className="w-full h-8 rounded-lg cursor-pointer mt-1"
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
        onSelect={(id) => updateConfig({ template: id as TicketTemplate })}
        thumbWidth={140}
        thumbHeight={80}
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
      label={`Ticket Designer — ${currentSize.label} (${PAGE_W}×${PAGE_H})`}
    />
  );
}
