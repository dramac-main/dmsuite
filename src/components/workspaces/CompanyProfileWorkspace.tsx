"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconBuilding, IconSparkles, IconWand, IconLoader, IconDownload,
  IconLayout, IconDroplet, IconImage, IconType, IconFileText,
} from "@/components/icons";
import { cleanAIText, roundRect, lighten, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { loadImage, drawImageCover } from "@/lib/graphics-engine";
import { drawProText, drawProDivider, drawHeaderArea, drawTable, drawImagePlaceholder, drawCropMarks, generateColorPalette, getTypographicScale, searchStockImages, exportHighRes, type ExportSettings, EXPORT_PRESETS } from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import { StockImagePanel, type StockImage } from "@/hooks/useStockImages";

/* ── Types ─────────────────────────────────────────────────── */

type ProfileTemplate = "corporate" | "modern" | "creative" | "luxury" | "minimal" | "tech";
type ProfileSection = "about" | "services" | "team" | "stats" | "contact" | "mission" | "values" | "clients" | "portfolio";

interface TeamMember { id: string; name: string; title: string; }
interface ServiceItem { id: string; name: string; description: string; }
interface StatItem { id: string; label: string; value: string; }

interface CompanyProfileConfig {
  template: ProfileTemplate;
  primaryColor: string;
  companyName: string;
  tagline: string;
  industry: string;
  founded: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  aboutText: string;
  missionText: string;
  valuesText: string;
  description: string;
  activePage: number;
  heroImageUrl: string;
  logoUrl: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const TEMPLATES: { id: ProfileTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" },
  { id: "modern", name: "Modern" },
  { id: "creative", name: "Creative" },
  { id: "luxury", name: "Luxury" },
  { id: "minimal", name: "Minimal" },
  { id: "tech", name: "Tech" },
];

const PAGES: { id: ProfileSection; name: string }[] = [
  { id: "about", name: "Cover & About" },
  { id: "services", name: "Our Services" },
  { id: "team", name: "Our Team" },
  { id: "stats", name: "Key Figures" },
  { id: "mission", name: "Mission & Values" },
  { id: "clients", name: "Our Clients" },
  { id: "contact", name: "Contact Us" },
];

const PAGE_W = 595, PAGE_H = 842; // A4

const COLOR_PRESETS = [
  "#1e3a5f", "#0f4c75", "#3c1361", "#0d7377", "#1a1a2e",
  "#2d3436", "#6c5ce7", "#00b894", "#e17055", "#2d1b69",
  "#8ae600", "#06b6d4",
];

/* ── Component ───────────────────────────────────────────── */

export default function CompanyProfileWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [heroImg, setHeroImg] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

  const [config, setConfig] = useState<CompanyProfileConfig>({
    template: "corporate",
    primaryColor: "#1e3a5f",
    companyName: "Meridian Corp",
    tagline: "Innovation Meets Excellence",
    industry: "Technology & Consulting",
    founded: "2015",
    location: "Lusaka, Zambia",
    phone: "+260 97 1234567",
    email: "info@meridiancorp.com",
    website: "www.meridiancorp.com",
    aboutText: "We are a leading provider of innovative business solutions, helping organizations transform and grow in the digital age. With a team of seasoned professionals, we deliver excellence across consulting, technology, and strategic advisory services.",
    missionText: "To empower businesses with cutting-edge solutions that drive sustainable growth and create lasting value for all stakeholders.",
    valuesText: "Integrity • Innovation • Excellence • Collaboration • Client-First",
    description: "",
    activePage: 0,
    heroImageUrl: "",
    logoUrl: "",
  });

  const [team] = useState<TeamMember[]>([
    { id: uid(), name: "John Mwansa", title: "CEO & Founder" },
    { id: uid(), name: "Grace Banda", title: "CTO" },
    { id: uid(), name: "David Tembo", title: "CFO" },
    { id: uid(), name: "Sarah Phiri", title: "Head of Operations" },
    { id: uid(), name: "Michael Zulu", title: "Lead Consultant" },
    { id: uid(), name: "Ruth Ng'andu", title: "Marketing Director" },
  ]);

  const [services] = useState<ServiceItem[]>([
    { id: uid(), name: "Strategy Consulting", description: "Business transformation and growth strategy" },
    { id: uid(), name: "Technology Solutions", description: "Custom software and digital infrastructure" },
    { id: uid(), name: "Brand Development", description: "Identity design and market positioning" },
    { id: uid(), name: "Financial Advisory", description: "Investment planning and risk management" },
  ]);

  const [stats] = useState<StatItem[]>([
    { id: uid(), label: "Years of Experience", value: "9+" },
    { id: uid(), label: "Clients Served", value: "500+" },
    { id: uid(), label: "Projects Completed", value: "1,200+" },
    { id: uid(), label: "Team Members", value: "85" },
  ]);

  const updateConfig = useCallback((partial: Partial<CompanyProfileConfig>) => {
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
    const m = 36; // margin
    const cw = PAGE_W - m * 2; // content width

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    const page = PAGES[activePage]?.id || "about";

    switch (page) {
      case "about": {
        // Hero header area
        const headerH = PAGE_H * 0.42;
        const headerStyle = template === "modern" ? "wave" : template === "creative" ? "diagonal" : template === "minimal" ? "minimal" : "gradient";
        drawHeaderArea(ctx, 0, 0, PAGE_W, headerH, primaryColor, headerStyle as "gradient" | "wave" | "diagonal" | "minimal");

        // Overlay pattern
        if (template !== "minimal") {
          ctx.fillStyle = hexToRgba("#ffffff", 0.04);
          for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * PAGE_W, Math.random() * headerH, Math.random() * 30 + 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Hero image (if available)
        if (heroImg) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          drawImageCover(ctx, heroImg, 0, 0, PAGE_W, headerH);
          ctx.restore();
          // Gradient overlay
          const grad = ctx.createLinearGradient(0, 0, 0, headerH);
          grad.addColorStop(0, hexToRgba(primaryColor, 0.7));
          grad.addColorStop(1, primaryColor);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, PAGE_W, headerH);
        }

        // Logo placeholder
        if (logoImg) {
          const logoSize = 50;
          ctx.drawImage(logoImg, m, m, logoSize, logoSize);
        } else {
          ctx.fillStyle = hexToRgba("#ffffff", 0.2);
          roundRect(ctx, m, m, 50, 50, 8);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = getCanvasFont(800, 16, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(config.companyName.charAt(0), m + 25, m + 25);
        }

        // Company name
        drawProText(ctx, config.companyName, m, headerH * 0.38, {
          fontSize: typo.display, fontWeight: 800, color: "#ffffff",
          maxWidth: cw, shadow: true,
        });

        // Tagline
        drawProText(ctx, config.tagline, m, headerH * 0.55, {
          fontSize: typo.h3, fontWeight: 400, color: hexToRgba("#ffffff", 0.85),
          maxWidth: cw,
        });

        // Industry badge
        ctx.fillStyle = hexToRgba("#ffffff", 0.15);
        const badgeW = ctx.measureText(config.industry.toUpperCase()).width + 20;
        roundRect(ctx, m, headerH * 0.72, badgeW + 10, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = getCanvasFont(600, 9, "modern");
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(config.industry.toUpperCase(), m + 10, headerH * 0.72 + 11);

        // About section
        const aboutY = headerH + 40;
        drawProText(ctx, "ABOUT US", m, aboutY, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProDivider(ctx, m, aboutY + 18, 40, primaryColor, "solid", 2);

        drawProText(ctx, config.aboutText, m, aboutY + 32, {
          fontSize: typo.body, fontWeight: 400, color: pal.textMedium,
          maxWidth: cw, fontStyle: "modern",
        });

        // Quick stats at bottom
        const statsY = PAGE_H - 100;
        drawProDivider(ctx, m, statsY - 20, cw, pal.mediumGray, "gradient", 1);
        const statW = cw / 4;
        stats.forEach((s, i) => {
          const sx = m + i * statW;
          drawProText(ctx, s.value, sx + statW / 2, statsY, {
            fontSize: typo.h2, fontWeight: 800, color: primaryColor, align: "center",
          });
          drawProText(ctx, s.label, sx + statW / 2, statsY + 30, {
            fontSize: typo.caption, fontWeight: 500, color: pal.textLight, align: "center",
          });
        });

        // Footer
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "services": {
        // Page header
        drawHeaderArea(ctx, 0, 0, PAGE_W, 100, primaryColor, "gradient");
        drawProText(ctx, config.companyName, m, 20, { fontSize: 11, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true });
        drawProText(ctx, "Our Services", m, 45, { fontSize: typo.h1, fontWeight: 800, color: "#ffffff" });

        // Services grid
        const gridY = 130;
        const cardW = (cw - 20) / 2;
        const cardH = 150;
        services.forEach((svc, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = m + col * (cardW + 20);
          const cy = gridY + row * (cardH + 16);

          // Card background
          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, cx, cy, cardW, cardH, 10);
          ctx.fill();

          // Accent stripe
          ctx.fillStyle = primaryColor;
          roundRect(ctx, cx, cy, 4, cardH, 4);
          ctx.fill();

          // Icon placeholder
          ctx.fillStyle = pal.primaryMuted;
          roundRect(ctx, cx + 20, cy + 20, 36, 36, 8);
          ctx.fill();
          ctx.fillStyle = primaryColor;
          ctx.font = getCanvasFont(700, 16, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(i + 1), cx + 38, cy + 38);

          // Service name
          drawProText(ctx, svc.name, cx + 20, cy + 72, {
            fontSize: typo.h3, fontWeight: 700, color: pal.textDark,
            maxWidth: cardW - 40,
          });

          // Description
          drawProText(ctx, svc.description, cx + 20, cy + 95, {
            fontSize: typo.caption, fontWeight: 400, color: pal.textMedium,
            maxWidth: cardW - 40,
          });
        });

        // Footer bar
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "team": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 100, primaryColor, "gradient");
        drawProText(ctx, config.companyName, m, 20, { fontSize: 11, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true });
        drawProText(ctx, "Our Team", m, 45, { fontSize: typo.h1, fontWeight: 800, color: "#ffffff" });

        const gridY = 130;
        const cardW = (cw - 40) / 3;
        const cardH = 200;
        team.forEach((member, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const cx = m + col * (cardW + 20);
          const cy = gridY + row * (cardH + 20);

          // Card
          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, cx, cy, cardW, cardH, 10);
          ctx.fill();

          // Avatar circle
          const avatarR = 32;
          ctx.fillStyle = pal.primaryMuted;
          ctx.beginPath();
          ctx.arc(cx + cardW / 2, cy + 50, avatarR, 0, Math.PI * 2);
          ctx.fill();
          // Initials
          ctx.fillStyle = primaryColor;
          ctx.font = getCanvasFont(700, 18, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const initials = member.name.split(" ").map((n) => n[0]).join("");
          ctx.fillText(initials, cx + cardW / 2, cy + 50);

          // Name
          drawProText(ctx, member.name, cx + cardW / 2, cy + 95, {
            fontSize: typo.body, fontWeight: 700, color: pal.textDark, align: "center",
          });

          // Title
          drawProText(ctx, member.title, cx + cardW / 2, cy + 115, {
            fontSize: typo.caption, fontWeight: 400, color: primaryColor, align: "center",
          });

          // Decorative line
          drawProDivider(ctx, cx + cardW * 0.3, cy + 140, cardW * 0.4, pal.primaryMuted, "gradient");
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "stats": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 100, primaryColor, "gradient");
        drawProText(ctx, config.companyName, m, 20, { fontSize: 11, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true });
        drawProText(ctx, "Key Figures", m, 45, { fontSize: typo.h1, fontWeight: 800, color: "#ffffff" });

        const gridY = 150;
        const cardW = (cw - 20) / 2;
        const cardH = 120;
        stats.forEach((stat, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = m + col * (cardW + 20);
          const cy = gridY + row * (cardH + 20);

          // Card with left accent
          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, cx, cy, cardW, cardH, 10);
          ctx.fill();
          ctx.fillStyle = primaryColor;
          roundRect(ctx, cx, cy, 5, cardH, 5);
          ctx.fill();

          drawProText(ctx, stat.value, cx + 24, cy + 25, {
            fontSize: typo.display, fontWeight: 900, color: primaryColor,
          });
          drawProText(ctx, stat.label, cx + 24, cy + 75, {
            fontSize: typo.body, fontWeight: 500, color: pal.textMedium,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "mission": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 100, primaryColor, "gradient");
        drawProText(ctx, config.companyName, m, 20, { fontSize: 11, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true });
        drawProText(ctx, "Mission & Values", m, 45, { fontSize: typo.h1, fontWeight: 800, color: "#ffffff" });

        // Mission section
        const missionY = 140;
        drawProText(ctx, "OUR MISSION", m, missionY, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProDivider(ctx, m, missionY + 18, 40, primaryColor, "solid", 2);

        // Mission statement in large quote style
        ctx.fillStyle = hexToRgba(primaryColor, 0.06);
        roundRect(ctx, m, missionY + 30, cw, 120, 12);
        ctx.fill();

        // Quote mark
        ctx.fillStyle = hexToRgba(primaryColor, 0.15);
        ctx.font = getCanvasFont(900, 60, "classic");
        ctx.textAlign = "left";
        ctx.fillText("\u201C", m + 15, missionY + 70);

        drawProText(ctx, config.missionText, m + 50, missionY + 55, {
          fontSize: typo.body + 2, fontWeight: 500, color: pal.textDark,
          maxWidth: cw - 80, fontStyle: "classic",
        });

        // Values section
        const valuesY = missionY + 180;
        drawProText(ctx, "OUR VALUES", m, valuesY, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProDivider(ctx, m, valuesY + 18, 40, primaryColor, "solid", 2);

        const values = config.valuesText.split("•").map((v) => v.trim()).filter(Boolean);
        values.forEach((val, i) => {
          const vy = valuesY + 35 + i * 50;
          // Value card
          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, m, vy, cw, 40, 8);
          ctx.fill();

          // Number circle
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(m + 22, vy + 20, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = getCanvasFont(700, 11, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(i + 1), m + 22, vy + 20);

          drawProText(ctx, val, m + 48, vy + 12, {
            fontSize: typo.body, fontWeight: 600, color: pal.textDark,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "contact": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, PAGE_H * 0.35, primaryColor, "gradient");
        drawProText(ctx, "Get In Touch", PAGE_W / 2, 100, {
          fontSize: typo.display, fontWeight: 800, color: "#ffffff", align: "center",
        });
        drawProText(ctx, "We'd love to hear from you", PAGE_W / 2, 145, {
          fontSize: typo.h3, fontWeight: 400, color: hexToRgba("#ffffff", 0.7), align: "center",
        });

        // Contact card
        const cardY = PAGE_H * 0.3;
        const cardH = 300;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = hexToRgba("#000000", 0.1);
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
        roundRect(ctx, m + 20, cardY, cw - 40, cardH, 16);
        ctx.fill();
        ctx.shadowColor = "transparent";

        const items = [
          { label: "Phone", value: config.phone },
          { label: "Email", value: config.email },
          { label: "Website", value: config.website },
          { label: "Location", value: config.location },
        ];

        items.forEach((item, i) => {
          const iy = cardY + 40 + i * 60;
          drawProText(ctx, item.label.toUpperCase(), m + 50, iy, {
            fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
          });
          drawProText(ctx, item.value, m + 50, iy + 18, {
            fontSize: typo.body + 1, fontWeight: 500, color: pal.textDark,
          });
          if (i < items.length - 1) {
            drawProDivider(ctx, m + 50, iy + 45, cw - 100, pal.lightGray, "solid");
          }
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      default: {
        // Clients page (default fallback)
        drawHeaderArea(ctx, 0, 0, PAGE_W, 100, primaryColor, "gradient");
        drawProText(ctx, config.companyName, m, 20, { fontSize: 11, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true });
        drawProText(ctx, "Our Clients", m, 45, { fontSize: typo.h1, fontWeight: 800, color: "#ffffff" });

        drawProText(ctx, "Trusted by leading organizations across Africa and beyond", m, 130, {
          fontSize: typo.body + 1, fontWeight: 400, color: pal.textMedium, maxWidth: cw,
        });

        // Client logo placeholders
        const gridY = 180;
        const logoW = (cw - 40) / 3;
        const logoH = 80;
        for (let i = 0; i < 9; i++) {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const lx = m + col * (logoW + 20);
          const ly = gridY + row * (logoH + 16);

          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, lx, ly, logoW, logoH, 8);
          ctx.fill();

          ctx.fillStyle = pal.textLight;
          ctx.font = getCanvasFont(600, 10, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`Client ${i + 1}`, lx + logoW / 2, ly + logoH / 2);
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
  }, [config, heroImg, logoImg, team, services, stats]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  /* ── AI Generate ─────────────────────────────────────────── */

  const handleAIGenerate = useCallback(async () => {
    if (!config.description.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate professional company profile content for: "${config.description}".
Return JSON: { "companyName": "", "tagline": "", "industry": "", "aboutText": "3-4 sentences", "missionText": "1-2 sentences", "valuesText": "5 values separated by •", "services": [{"name":"","description":""}], "stats": [{"label":"","value":""}], "heroImageQuery": "search query for hero image" }`,
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
          companyName: data.companyName || config.companyName,
          tagline: data.tagline || config.tagline,
          industry: data.industry || config.industry,
          aboutText: data.aboutText || config.aboutText,
          missionText: data.missionText || config.missionText,
          valuesText: data.valuesText || config.valuesText,
        });

        // Search for hero image
        if (data.heroImageQuery) {
          const imgs = await searchStockImages(data.heroImageQuery, { perPage: 1 });
          if (imgs.length > 0) {
            try {
              const img = await loadImage(imgs[0].urls.regular);
              setHeroImg(img);
              updateConfig({ heroImageUrl: imgs[0].urls.regular });
            } catch { /* skip */ }
          }
        }
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config.description, isGenerating, updateConfig, config]);

  /* ── Stock Image Handler ─────────────────────────────────── */
  const handleStockImageSelect = useCallback(async (img: StockImage) => {
    try {
      const loaded = await loadImage(img.urls.regular);
      setHeroImg(loaded);
      updateConfig({ heroImageUrl: img.urls.regular });
    } catch { /* skip */ }
  }, [updateConfig]);

  /* ── Export ──────────────────────────────────────────────── */
  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const settings = EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"];
    exportHighRes(canvas, settings, `company-profile-${PAGES[config.activePage]?.id || "page"}`);
  }, [config.activePage]);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const hStyle = t.id === "modern" ? "gradient" : t.id === "creative" ? "centered" : t.id === "minimal" ? "minimal" : "bar";
      drawDocumentThumbnail(ctx, w, h, {
        primaryColor: config.primaryColor,
        headerStyle: hStyle as "bar" | "gradient" | "centered" | "minimal",
        showSections: 3,
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
          value={config.description}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe your company… e.g., 'A fintech startup based in Lusaka offering mobile payment solutions'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Profile</>}
        </button>
      </AccordionSection>

      <AccordionSection id="details" icon={<IconBuilding className="size-3.5" />} label="Company Details">
        <div className="space-y-2">
          {(["companyName", "tagline", "industry", "founded", "location", "phone", "email", "website"] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{field.replace(/([A-Z])/g, " $1")}</label>
              <input
                type="text"
                value={config[field]}
                onChange={(e) => updateConfig({ [field]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="content" icon={<IconFileText className="size-3.5" />} label="Content">
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">About</label>
            <textarea
              value={config.aboutText}
              onChange={(e) => updateConfig({ aboutText: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={3}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Mission</label>
            <textarea
              value={config.missionText}
              onChange={(e) => updateConfig({ missionText: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={2}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Values (• separated)</label>
            <input
              type="text"
              value={config.valuesText}
              onChange={(e) => updateConfig({ valuesText: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="images" icon={<IconImage className="size-3.5" />} label="Images">
        <StockImagePanel onSelect={handleStockImageSelect} />
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
            { id: "print-standard", label: "Print (PDF 300 DPI)", desc: "With crop marks" },
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
        onSelect={(id) => updateConfig({ template: id as ProfileTemplate })}
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
      label={`Company Profile — A4 (${PAGE_W}×${PAGE_H}) — Page ${config.activePage + 1}/${PAGES.length}`}
    />
  );
}
