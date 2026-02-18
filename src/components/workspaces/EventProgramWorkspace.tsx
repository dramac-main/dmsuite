"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload,
  IconLayout, IconDroplet,
  IconCalendar,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import {
  drawProText, drawProDivider, drawHeaderArea,
  generateColorPalette, getTypographicScale, exportHighRes, EXPORT_PRESETS,
} from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type ProgramTemplate = "corporate" | "creative" | "gala" | "conference" | "minimal" | "festival";

interface SessionItem {
  id: string;
  time: string;
  title: string;
  speaker: string;
  location: string;
}

interface SponsorItem {
  id: string;
  name: string;
  tier: "platinum" | "gold" | "silver";
}

interface EventProgramConfig {
  template: ProgramTemplate;
  primaryColor: string;
  eventName: string;
  tagline: string;
  date: string;
  venue: string;
  city: string;
  organizer: string;
  description: string;
  activePage: number;
  aiPrompt: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

/* ── Constants ─────────────────────────────────────────────── */

const TEMPLATES: { id: ProgramTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" },
  { id: "creative", name: "Creative" },
  { id: "gala", name: "Gala" },
  { id: "conference", name: "Conference" },
  { id: "minimal", name: "Minimal" },
  { id: "festival", name: "Festival" },
];

const PAGES = [
  { id: "cover", name: "Cover" },
  { id: "agenda1", name: "Agenda (AM)" },
  { id: "agenda2", name: "Agenda (PM)" },
  { id: "sponsors", name: "Sponsors" },
];

const PAGE_W = 595, PAGE_H = 842; // A4

const COLOR_PRESETS = [
  "#1e3a5f", "#0d7377", "#2d1b69", "#0f4c75", "#b91c1c",
  "#1a1a2e", "#6c5ce7", "#065f46", "#713f12", "#831843",
  "#8ae600", "#06b6d4",
];

const TIER_COLORS: Record<string, string> = {
  platinum: "#94a3b8",
  gold: "#eab308",
  silver: "#9ca3af",
};

/* ── Component ───────────────────────────────────────────── */

export default function EventProgramWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<EventProgramConfig>({
    template: "corporate",
    primaryColor: "#1e3a5f",
    eventName: "Zambia Business Innovation Summit 2026",
    tagline: "Shaping the Future of Commerce in Southern Africa",
    date: "15–16 March 2026",
    venue: "Mulungushi International Conference Centre",
    city: "Lusaka, Zambia",
    organizer: "Zambia Chamber of Commerce & Industry",
    description: "",
    activePage: 0,
    aiPrompt: "",
  });

  const [sessions, setSessions] = useState<SessionItem[]>([
    { id: uid(), time: "08:00 – 08:30", title: "Registration & Welcome Coffee", speaker: "", location: "Main Lobby" },
    { id: uid(), time: "08:30 – 09:00", title: "Opening Ceremony & Keynote Address", speaker: "Hon. Minister of Commerce", location: "Grand Hall" },
    { id: uid(), time: "09:00 – 09:45", title: "The State of Business Innovation in Zambia", speaker: "Dr. Mwila Chikwanda", location: "Grand Hall" },
    { id: uid(), time: "09:45 – 10:30", title: "Digital Transformation for SMEs", speaker: "Grace Tembo, CEO TechBridge", location: "Grand Hall" },
    { id: uid(), time: "10:30 – 11:00", title: "Tea & Networking Break", speaker: "", location: "Exhibition Area" },
    { id: uid(), time: "11:00 – 11:45", title: "Access to Finance: New Funding Models", speaker: "Panel Discussion", location: "Hall A" },
    { id: uid(), time: "11:45 – 12:30", title: "Green Business & Sustainability", speaker: "James Mulenga, EcoVentures", location: "Hall B" },
    { id: uid(), time: "12:30 – 14:00", title: "Lunch & Exhibition Tour", speaker: "", location: "Banquet Hall" },
    { id: uid(), time: "14:00 – 14:45", title: "Cross-Border Trade Opportunities", speaker: "AfCFTA Representative", location: "Grand Hall" },
    { id: uid(), time: "14:45 – 15:30", title: "Youth Entrepreneurship Workshop", speaker: "Sarah Phiri, StartUp Zambia", location: "Hall A" },
    { id: uid(), time: "15:30 – 16:00", title: "Afternoon Break", speaker: "", location: "Exhibition Area" },
    { id: uid(), time: "16:00 – 16:45", title: "AI & Technology in African Markets", speaker: "David Banda, InnoTech Labs", location: "Grand Hall" },
    { id: uid(), time: "16:45 – 17:30", title: "Closing Remarks & Awards Ceremony", speaker: "ZCCI President", location: "Grand Hall" },
    { id: uid(), time: "18:00 – 21:00", title: "Gala Dinner & Networking", speaker: "", location: "Banquet Hall" },
  ]);

  const [sponsors, setSponsors] = useState<SponsorItem[]>([
    { id: uid(), name: "Zambia National Commercial Bank", tier: "platinum" },
    { id: uid(), name: "MTN Zambia", tier: "platinum" },
    { id: uid(), name: "Stanbic Bank Zambia", tier: "gold" },
    { id: uid(), name: "Airtel Zambia", tier: "gold" },
    { id: uid(), name: "Zambia Breweries", tier: "gold" },
    { id: uid(), name: "ZESCO Limited", tier: "silver" },
    { id: uid(), name: "Madison Insurance", tier: "silver" },
    { id: uid(), name: "Trade Kings Group", tier: "silver" },
    { id: uid(), name: "Zambeef Products", tier: "silver" },
  ]);

  const updateConfig = useCallback((partial: Partial<EventProgramConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

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
    const typo = getTypographicScale(PAGE_H);
    const m = 36;
    const cw = PAGE_W - m * 2;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    const page = PAGES[activePage]?.id || "cover";

    switch (page) {
      /* ── Cover Page ───────────────────────────────────────── */
      case "cover": {
        const headerH = template === "gala" ? PAGE_H * 0.55 : template === "festival" ? PAGE_H * 0.5 : PAGE_H * 0.45;
        const headerStyle = template === "creative" ? "diagonal" : template === "gala" ? "wave" : template === "minimal" ? "minimal" : "gradient";
        drawHeaderArea(ctx, 0, 0, PAGE_W, headerH, primaryColor, headerStyle as "gradient" | "wave" | "diagonal" | "minimal");

        // Decorative pattern for gala/festival
        if (template === "gala" || template === "festival") {
          ctx.fillStyle = hexToRgba("#ffffff", 0.04);
          for (let i = 0; i < 30; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * PAGE_W, Math.random() * headerH, Math.random() * 20 + 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Conference badge at top
        if (template === "conference" || template === "corporate") {
          const badgeText = config.organizer.toUpperCase();
          ctx.fillStyle = hexToRgba("#ffffff", 0.15);
          const bw = ctx.measureText(badgeText).width + 30;
          roundRect(ctx, m, m + 10, bw + 10, 22, 11);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = getCanvasFont(600, 8, "modern");
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(badgeText, m + 12, m + 21);
        }

        // Event name
        const nameY = headerH * 0.35;
        drawProText(ctx, config.eventName, m, nameY, {
          fontSize: template === "gala" ? typo.display + 4 : typo.display,
          fontWeight: 900, color: "#ffffff", maxWidth: cw,
          fontStyle: template === "gala" ? "classic" : "modern",
          shadow: true,
        });

        // Tagline
        drawProText(ctx, config.tagline, m, nameY + typo.display + 16, {
          fontSize: typo.h3, fontWeight: 400, color: hexToRgba("#ffffff", 0.8),
          maxWidth: cw,
        });

        // Date & venue line
        const infoY = headerH - 60;
        drawProText(ctx, `📅 ${config.date}`, m, infoY, {
          fontSize: typo.body, fontWeight: 600, color: "#ffffff",
        });
        drawProText(ctx, `📍 ${config.venue}, ${config.city}`, m, infoY + 22, {
          fontSize: typo.body, fontWeight: 400, color: hexToRgba("#ffffff", 0.8),
        });

        // About section below header
        let curY = headerH + 32;
        drawProText(ctx, "ABOUT THE EVENT", m, curY, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProDivider(ctx, m, curY + 14, 40, primaryColor, "solid", 2);
        curY += 28;

        const aboutText = `Join leading innovators, entrepreneurs, and policy makers at the ${config.eventName}. This premier gathering brings together thought leaders from across Southern Africa to explore opportunities in digital transformation, sustainable business, and cross-border trade.`;
        ctx.font = getCanvasFont(400, typo.caption + 1, "modern");
        const aboutLines = wrapCanvasText(ctx, aboutText, cw);
        aboutLines.forEach((line, i) => {
          ctx.fillStyle = pal.textMedium;
          ctx.font = getCanvasFont(400, typo.caption + 1, "modern");
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(line, m, curY + i * (typo.caption + 6));
        });
        curY += aboutLines.length * (typo.caption + 6) + 20;

        // Quick info cards
        const infoItems = [
          { label: "DATE", value: config.date },
          { label: "VENUE", value: config.venue },
          { label: "SESSIONS", value: `${sessions.length}` },
          { label: "SPEAKERS", value: `${sessions.filter(s => s.speaker).length}+` },
        ];
        const cardW = (cw - 18) / 4;
        infoItems.forEach((item, i) => {
          const cx = m + i * (cardW + 6);
          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, cx, curY, cardW, 56, 8);
          ctx.fill();

          drawProText(ctx, item.value, cx + cardW / 2, curY + 16, {
            fontSize: typo.h3, fontWeight: 800, color: primaryColor, align: "center",
          });
          drawProText(ctx, item.label, cx + cardW / 2, curY + 38, {
            fontSize: 7, fontWeight: 600, color: pal.textLight, align: "center",
          });
        });

        // Organizer at bottom
        drawProDivider(ctx, m, PAGE_H - 60, cw, pal.lightGray, "solid");
        drawProText(ctx, `Organized by ${config.organizer}`, PAGE_W / 2, PAGE_H - 36, {
          fontSize: typo.caption, fontWeight: 500, color: pal.textMedium, align: "center",
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      /* ── Agenda AM ─────────────────────────────────────────── */
      case "agenda1": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 80, primaryColor, "gradient");
        drawProText(ctx, config.eventName, m, 16, {
          fontSize: 10, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Programme — Morning Sessions", m, 36, {
          fontSize: typo.h2, fontWeight: 800, color: "#ffffff",
        });
        drawProText(ctx, config.date, PAGE_W - m, 40, {
          fontSize: typo.caption, fontWeight: 600, color: hexToRgba("#ffffff", 0.7), align: "right",
        });

        let curY = 100;
        const morningItems = sessions.slice(0, 7);

        morningItems.forEach((session, i) => {
          const rowH = session.speaker ? 54 : 40;
          const isBreak = session.title.toLowerCase().includes("break") || session.title.toLowerCase().includes("lunch") || session.title.toLowerCase().includes("registration") || session.title.toLowerCase().includes("coffee");

          // Alternating row background
          if (i % 2 === 0 && !isBreak) {
            ctx.fillStyle = pal.offWhite;
            roundRect(ctx, m, curY, cw, rowH, 6);
            ctx.fill();
          }

          // Break styling
          if (isBreak) {
            ctx.fillStyle = hexToRgba(primaryColor, 0.06);
            roundRect(ctx, m, curY, cw, rowH, 6);
            ctx.fill();
            ctx.fillStyle = primaryColor;
            roundRect(ctx, m, curY, 3, rowH, 3);
            ctx.fill();
          }

          // Time column
          drawProText(ctx, session.time, m + 10, curY + 10, {
            fontSize: typo.caption, fontWeight: 700, color: primaryColor,
          });

          // Title
          drawProText(ctx, session.title, m + 110, curY + 10, {
            fontSize: typo.body, fontWeight: 600, color: pal.textDark, maxWidth: cw - 120,
          });

          // Speaker & location
          if (session.speaker) {
            drawProText(ctx, session.speaker, m + 110, curY + 28, {
              fontSize: typo.caption, fontWeight: 400, color: pal.textMedium,
            });
            drawProText(ctx, session.location, PAGE_W - m - 10, curY + 28, {
              fontSize: typo.caption, fontWeight: 400, color: pal.textLight, align: "right",
            });
          } else {
            drawProText(ctx, session.location, PAGE_W - m - 10, curY + 10, {
              fontSize: typo.caption, fontWeight: 400, color: pal.textLight, align: "right",
            });
          }

          curY += rowH + 4;
        });

        // Footer
        drawProDivider(ctx, m, PAGE_H - 50, cw, pal.lightGray, "solid");
        drawProText(ctx, `${config.venue} • ${config.city}`, PAGE_W / 2, PAGE_H - 30, {
          fontSize: typo.caption, fontWeight: 500, color: pal.textLight, align: "center",
        });
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      /* ── Agenda PM ─────────────────────────────────────────── */
      case "agenda2": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 80, primaryColor, "gradient");
        drawProText(ctx, config.eventName, m, 16, {
          fontSize: 10, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Programme — Afternoon Sessions", m, 36, {
          fontSize: typo.h2, fontWeight: 800, color: "#ffffff",
        });
        drawProText(ctx, config.date, PAGE_W - m, 40, {
          fontSize: typo.caption, fontWeight: 600, color: hexToRgba("#ffffff", 0.7), align: "right",
        });

        let curY = 100;
        const pmItems = sessions.slice(7);

        pmItems.forEach((session, i) => {
          const rowH = session.speaker ? 54 : 40;
          const isBreak = session.title.toLowerCase().includes("break") || session.title.toLowerCase().includes("dinner") || session.title.toLowerCase().includes("lunch");

          if (i % 2 === 0 && !isBreak) {
            ctx.fillStyle = pal.offWhite;
            roundRect(ctx, m, curY, cw, rowH, 6);
            ctx.fill();
          }
          if (isBreak) {
            ctx.fillStyle = hexToRgba(primaryColor, 0.06);
            roundRect(ctx, m, curY, cw, rowH, 6);
            ctx.fill();
            ctx.fillStyle = primaryColor;
            roundRect(ctx, m, curY, 3, rowH, 3);
            ctx.fill();
          }

          drawProText(ctx, session.time, m + 10, curY + 10, {
            fontSize: typo.caption, fontWeight: 700, color: primaryColor,
          });
          drawProText(ctx, session.title, m + 110, curY + 10, {
            fontSize: typo.body, fontWeight: 600, color: pal.textDark, maxWidth: cw - 120,
          });
          if (session.speaker) {
            drawProText(ctx, session.speaker, m + 110, curY + 28, {
              fontSize: typo.caption, fontWeight: 400, color: pal.textMedium,
            });
            drawProText(ctx, session.location, PAGE_W - m - 10, curY + 28, {
              fontSize: typo.caption, fontWeight: 400, color: pal.textLight, align: "right",
            });
          } else {
            drawProText(ctx, session.location, PAGE_W - m - 10, curY + 10, {
              fontSize: typo.caption, fontWeight: 400, color: pal.textLight, align: "right",
            });
          }
          curY += rowH + 4;
        });

        // Notes section
        curY += 20;
        drawProText(ctx, "IMPORTANT NOTES", m, curY, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProDivider(ctx, m, curY + 14, 40, primaryColor, "solid", 2);
        curY += 28;

        const notes = [
          "All sessions will be held in English with simultaneous translation available.",
          "Delegates are requested to wear their badges at all times.",
          "Wi-Fi: Connect to \"ZCCI_SUMMIT\" — Password: Innovation2026",
          "Emergency contact: +260 97 9999999",
        ];
        notes.forEach((note, i) => {
          ctx.fillStyle = pal.textMedium;
          ctx.font = getCanvasFont(400, typo.caption, "modern");
          ctx.textAlign = "left";
          ctx.textBaseline = "top";

          // Bullet
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(m + 5, curY + i * 18 + 5, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = pal.textMedium;
          ctx.fillText(note, m + 16, curY + i * 18);
        });

        // Footer
        drawProDivider(ctx, m, PAGE_H - 50, cw, pal.lightGray, "solid");
        drawProText(ctx, `${config.venue} • ${config.city}`, PAGE_W / 2, PAGE_H - 30, {
          fontSize: typo.caption, fontWeight: 500, color: pal.textLight, align: "center",
        });
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      /* ── Sponsors ──────────────────────────────────────────── */
      case "sponsors": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 80, primaryColor, "gradient");
        drawProText(ctx, config.eventName, m, 16, {
          fontSize: 10, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Our Sponsors & Partners", m, 36, {
          fontSize: typo.h2, fontWeight: 800, color: "#ffffff",
        });

        let curY = 110;

        // Group sponsors by tier
        const tiers: ("platinum" | "gold" | "silver")[] = ["platinum", "gold", "silver"];
        tiers.forEach((tier) => {
          const tierSponsors = sponsors.filter((s) => s.tier === tier);
          if (tierSponsors.length === 0) return;

          // Tier header
          drawProText(ctx, `${tier.toUpperCase()} SPONSORS`, m, curY, {
            fontSize: typo.label, fontWeight: 700, color: TIER_COLORS[tier], uppercase: true,
          });
          drawProDivider(ctx, m, curY + 14, 40, TIER_COLORS[tier], "solid", 2);
          curY += 28;

          // Sponsor logos grid
          const cols = tier === "platinum" ? 2 : 3;
          const logoW = (cw - (cols - 1) * 12) / cols;
          const logoH = tier === "platinum" ? 80 : 60;

          tierSponsors.forEach((sponsor, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const sx = m + col * (logoW + 12);
            const sy = curY + row * (logoH + 10);

            // Sponsor card
            ctx.fillStyle = pal.offWhite;
            roundRect(ctx, sx, sy, logoW, logoH, 8);
            ctx.fill();

            // Border accent
            ctx.strokeStyle = hexToRgba(TIER_COLORS[tier], 0.3);
            ctx.lineWidth = 1;
            roundRect(ctx, sx, sy, logoW, logoH, 8);
            ctx.stroke();

            // Sponsor name
            drawProText(ctx, sponsor.name, sx + logoW / 2, sy + logoH / 2, {
              fontSize: tier === "platinum" ? typo.body : typo.caption,
              fontWeight: 600, color: pal.textDark, align: "center",
              maxWidth: logoW - 16,
            });
          });

          curY += Math.ceil(tierSponsors.length / cols) * (logoH + 10) + 20;
        });

        // Thank you message
        if (curY < PAGE_H - 100) {
          ctx.fillStyle = hexToRgba(primaryColor, 0.04);
          roundRect(ctx, m, curY, cw, 60, 10);
          ctx.fill();
          drawProText(ctx, "Thank you to all our sponsors and partners for making this event possible.", PAGE_W / 2, curY + 22, {
            fontSize: typo.body, fontWeight: 500, color: pal.textMedium, align: "center",
            maxWidth: cw - 40,
          });
        }

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }
    }

    // Page number
    ctx.fillStyle = pal.textLight;
    ctx.font = getCanvasFont(500, 9, "modern");
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${activePage + 1} / ${PAGES.length}`, PAGE_W / 2, PAGE_H - 14);
  }, [config, sessions, sponsors, advancedSettings]);

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
            content: `Generate a professional event program agenda for: "${config.aiPrompt}".
Return JSON: { "eventName": "", "tagline": "", "date": "", "venue": "", "city": "", "organizer": "", "sessions": [{ "time": "HH:MM – HH:MM", "title": "", "speaker": "", "location": "" }], "sponsors": [{ "name": "", "tier": "platinum|gold|silver" }] }
Include 10-14 realistic sessions with breaks. Use Zambian context if applicable.`,
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
          tagline: data.tagline || config.tagline,
          date: data.date || config.date,
          venue: data.venue || config.venue,
          city: data.city || config.city,
          organizer: data.organizer || config.organizer,
        });
        if (Array.isArray(data.sessions)) {
          setSessions(data.sessions.map((s: Omit<SessionItem, "id">) => ({ ...s, id: uid() })));
        }
        if (Array.isArray(data.sponsors)) {
          setSponsors(data.sponsors.map((s: Omit<SponsorItem, "id">) => ({ ...s, id: uid() })));
        }
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config, isGenerating, updateConfig]);

  /* ── Session management ──────────────────────────────────── */
  const addSession = useCallback(() => {
    setSessions((prev) => [...prev, { id: uid(), time: "00:00 – 00:00", title: "New Session", speaker: "", location: "" }]);
  }, []);

  const removeSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSession = useCallback((id: string, partial: Partial<SessionItem>) => {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, ...partial } : s));
  }, []);

  /* ── Export ──────────────────────────────────────────────── */
  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const settings = EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"];
    exportHighRes(canvas, settings, `event-program-${PAGES[config.activePage]?.id || "page"}`);
  }, [config.activePage]);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const hStyle = t.id === "corporate" ? "bar" : t.id === "gala" ? "gradient" : t.id === "minimal" ? "minimal" : t.id === "creative" ? "centered" : "gradient";
      drawDocumentThumbnail(ctx, w, h, {
        primaryColor: config.primaryColor,
        headerStyle: hStyle as "bar" | "gradient" | "minimal" | "centered",
        showSections: 4,
      });
    },
  }));

  const displayW = 380;
  const displayH = Math.round(displayW * (PAGE_H / PAGE_W));

  /* ── Left Panel ──────────────────────────────────────────── */
  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea
          value={config.aiPrompt}
          onChange={(e) => updateConfig({ aiPrompt: e.target.value })}
          placeholder="Describe your event… e.g., 'Annual tech conference in Lusaka with 200 delegates'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.aiPrompt.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Program</>}
        </button>
      </AccordionSection>

      <AccordionSection id="event" icon={<IconCalendar className="size-3.5" />} label="Event Details">
        <div className="space-y-2">
          {([
            { key: "eventName", label: "Event Name" },
            { key: "tagline", label: "Tagline" },
            { key: "date", label: "Date" },
            { key: "venue", label: "Venue" },
            { key: "city", label: "City" },
            { key: "organizer", label: "Organizer" },
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

      <AccordionSection id="sessions" icon={<IconLayout className="size-3.5" />} label={`Sessions (${sessions.length})`}>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {sessions.map((session) => (
            <div key={session.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 space-y-1">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={session.time}
                  onChange={(e) => updateSession(session.id, { time: e.target.value })}
                  className="w-24 bg-gray-200 dark:bg-gray-700 border-0 rounded px-1.5 py-0.5 text-[10px] text-gray-900 dark:text-white focus:outline-none"
                  placeholder="Time"
                />
                <input
                  type="text"
                  value={session.title}
                  onChange={(e) => updateSession(session.id, { title: e.target.value })}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 border-0 rounded px-1.5 py-0.5 text-[10px] text-gray-900 dark:text-white focus:outline-none"
                  placeholder="Title"
                />
                <button
                  onClick={() => removeSession(session.id)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <span className="text-xs">✕</span>
                </button>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={session.speaker}
                  onChange={(e) => updateSession(session.id, { speaker: e.target.value })}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 border-0 rounded px-1.5 py-0.5 text-[10px] text-gray-900 dark:text-white focus:outline-none"
                  placeholder="Speaker"
                />
                <input
                  type="text"
                  value={session.location}
                  onChange={(e) => updateSession(session.id, { location: e.target.value })}
                  className="w-24 bg-gray-200 dark:bg-gray-700 border-0 rounded px-1.5 py-0.5 text-[10px] text-gray-900 dark:text-white focus:outline-none"
                  placeholder="Location"
                />
              </div>
            </div>
          ))}
          <button
            onClick={addSession}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            + Add Session
          </button>
        </div>
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style & Colors">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-gray-500 uppercase">Primary Color</label>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => updateConfig({ primaryColor: c })}
                className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            type="color"
            value={config.primaryColor}
            onChange={(e) => updateConfig({ primaryColor: e.target.value })}
            className="w-full h-8 rounded-lg cursor-pointer"
          />
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
          {/* Advanced Settings — Global */}
        <AdvancedSettingsPanel />

      </Accordion>
  );

  /* ── Toolbar ─────────────────────────────────────────────── */
  const toolbar = (
    <div className="flex items-center gap-1.5">
      {PAGES.map((p, i) => (
        <button
          key={p.id}
          onClick={() => updateConfig({ activePage: i })}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            config.activePage === i
              ? "bg-primary-500 text-gray-950"
              : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );

  /* ── Right Panel ─────────────────────────────────────────── */
  const rightPanel = (
    <div className="space-y-4">
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => updateConfig({ template: id as ProgramTemplate })}
        thumbWidth={120}
        thumbHeight={170}
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
      toolbar={toolbar}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
      onZoomFit={() => setZoom(1)}
      label={`Event Program — A4 (${PAGE_W}×${PAGE_H}) — Page ${config.activePage + 1}/${PAGES.length}`}
    />
  );
}
