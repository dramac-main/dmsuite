"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload,
  IconDroplet, IconFileText, IconImage, IconLayout, IconUsers, IconBriefcase,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, drawHeaderArea, generateColorPalette, getTypographicScale, searchStockImages, exportHighRes, EXPORT_PRESETS, drawImagePlaceholder } from "@/lib/ai-design-engine";
import { loadImage, drawImageCover } from "@/lib/graphics-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import { StockImagePanel, type StockImage } from "@/hooks/useStockImages";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type KitTemplate = "corporate" | "creative" | "tech" | "modern" | "editorial" | "bold";

interface SocialStat {
  id: string;
  platform: string;
  followers: string;
}

interface PressContact {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface KeyStat {
  id: string;
  value: string;
  label: string;
}

interface MediaKitConfig {
  template: KitTemplate;
  primaryColor: string;
  companyName: string;
  tagline: string;
  brandOverview: string;
  founded: string;
  headquarters: string;
  website: string;
  activePage: number;
  description: string;
  brandImageUrl: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const TEMPLATES: { id: KitTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" },
  { id: "creative", name: "Creative" },
  { id: "tech", name: "Tech" },
  { id: "modern", name: "Modern" },
  { id: "editorial", name: "Editorial" },
  { id: "bold", name: "Bold" },
];

const PAGE_W = 595, PAGE_H = 842;

const COLOR_PRESETS = [
  "#1e3a5f", "#0f4c75", "#3c1361", "#0d7377", "#1a1a2e",
  "#2d3436", "#6c5ce7", "#00b894", "#e17055", "#2d1b69",
  "#8ae600", "#06b6d4",
];

const PAGES = [
  { id: "cover", name: "Cover" },
  { id: "about", name: "About" },
  { id: "stats", name: "Key Stats" },
  { id: "social", name: "Social Media" },
  { id: "press", name: "Press Contact" },
  { id: "assets", name: "Media Assets" },
];

/* ── Component ───────────────────────────────────────────── */

export default function MediaKitWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [brandImg, setBrandImg] = useState<HTMLImageElement | null>(null);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<MediaKitConfig>({
    template: "corporate",
    primaryColor: "#0d7377",
    companyName: "NovaTech Zambia",
    tagline: "Innovating Africa's Digital Future",
    brandOverview: "NovaTech Zambia is a leading technology startup transforming how businesses across Southern Africa operate through cloud-based solutions, AI-powered analytics, and mobile-first platforms. Founded in Lusaka in 2021, we have grown to serve over 500 enterprise clients across 8 countries. Our mission is to democratize access to world-class technology tools for African businesses of all sizes, empowering them to compete on the global stage.",
    founded: "2021",
    headquarters: "Lusaka, Zambia",
    website: "www.novatech.co.zm",
    activePage: 0,
    description: "",
    brandImageUrl: "",
  });

  const [keyStats, setKeyStats] = useState<KeyStat[]>([
    { id: uid(), value: "500+", label: "Enterprise Clients" },
    { id: uid(), value: "8", label: "Countries Served" },
    { id: uid(), value: "$12M", label: "Revenue (2025)" },
    { id: uid(), value: "95%", label: "Client Retention Rate" },
    { id: uid(), value: "180+", label: "Team Members" },
    { id: uid(), value: "3", label: "Product Lines" },
  ]);

  const [socialStats, setSocialStats] = useState<SocialStat[]>([
    { id: uid(), platform: "LinkedIn", followers: "45,200" },
    { id: uid(), platform: "Twitter / X", followers: "28,500" },
    { id: uid(), platform: "Instagram", followers: "18,300" },
    { id: uid(), platform: "Facebook", followers: "52,100" },
    { id: uid(), platform: "YouTube", followers: "8,900" },
    { id: uid(), platform: "TikTok", followers: "15,700" },
  ]);

  const [pressContacts, setPressContacts] = useState<PressContact[]>([
    { id: uid(), name: "Chipo Mwanza", role: "Head of Communications", email: "chipo@novatech.co.zm" },
    { id: uid(), name: "David Lungu", role: "PR Manager", email: "david@novatech.co.zm" },
    { id: uid(), name: "Grace Tembo", role: "Media Relations", email: "grace@novatech.co.zm" },
  ]);

  const updateConfig = useCallback((partial: Partial<MediaKitConfig>) => {
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
    const m = 40;
    const cw = PAGE_W - m * 2;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    const page = PAGES[activePage]?.id || "cover";

    switch (page) {
      case "cover": {
        const headerH = PAGE_H * 0.6;
        const style = template === "creative" ? "diagonal" : template === "modern" ? "wave" : template === "bold" ? "split" : template === "editorial" ? "minimal" : "gradient";
        drawHeaderArea(ctx, 0, 0, PAGE_W, headerH, primaryColor, style as "gradient" | "diagonal" | "wave" | "split" | "minimal");

        // Brand image overlay
        if (brandImg) {
          ctx.save();
          ctx.globalAlpha = 0.2;
          drawImageCover(ctx, brandImg, 0, 0, PAGE_W, headerH);
          ctx.restore();
          const grad = ctx.createLinearGradient(0, 0, 0, headerH);
          grad.addColorStop(0, hexToRgba(primaryColor, 0.6));
          grad.addColorStop(1, primaryColor);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, PAGE_W, headerH);
        }

        // Pattern
        if (template !== "editorial") {
          ctx.fillStyle = hexToRgba("#ffffff", 0.03);
          for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * PAGE_W, Math.random() * headerH, Math.random() * 40 + 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // MEDIA KIT badge
        ctx.fillStyle = hexToRgba("#ffffff", 0.15);
        ctx.font = getCanvasFont(600, 9, "modern");
        const badgeText = "PRESS & MEDIA KIT";
        const badgeW = ctx.measureText(badgeText).width + 24;
        roundRect(ctx, m, m + 10, badgeW, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(badgeText, m + 12, m + 21);

        // Company name
        drawProText(ctx, config.companyName, m, headerH * 0.42, {
          fontSize: typo.display + 6, fontWeight: 800, color: "#ffffff",
          maxWidth: cw, shadow: true,
        });

        // Tagline
        drawProText(ctx, config.tagline, m, headerH * 0.6, {
          fontSize: typo.h3, fontWeight: 400, color: hexToRgba("#ffffff", 0.85),
          maxWidth: cw,
        });

        // Decorative line
        ctx.fillStyle = hexToRgba("#ffffff", 0.35);
        ctx.fillRect(m, headerH * 0.76, 60, 3);

        // Quick info below
        const infoY = headerH + 40;
        const items = [
          { label: "FOUNDED", value: config.founded },
          { label: "HQ", value: config.headquarters },
          { label: "WEB", value: config.website },
        ];
        items.forEach((item, i) => {
          const ix = m + i * (cw / 3);
          drawProText(ctx, item.label, ix, infoY, {
            fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
          });
          drawProText(ctx, item.value, ix, infoY + 18, {
            fontSize: typo.body, fontWeight: 500, color: pal.textDark,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "about": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, config.companyName, m, 18, {
          fontSize: 9, fontWeight: 600, color: hexToRgba("#ffffff", 0.6), uppercase: true,
        });
        drawProText(ctx, "Brand Overview", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        let yPos = 120;
        drawProDivider(ctx, m, yPos, 40, primaryColor, "solid", 2);
        yPos += 16;

        ctx.font = getCanvasFont(400, typo.body + 1, "modern");
        const aboutLines = wrapCanvasText(ctx, config.brandOverview, cw);
        ctx.fillStyle = pal.textDark;
        aboutLines.forEach((line) => {
          ctx.fillText(line, m, yPos);
          yPos += typo.body + 8;
        });

        // Brand imagery placeholder
        yPos += 24;
        if (brandImg) {
          ctx.save();
          roundRect(ctx, m, yPos, cw, 200, 12);
          ctx.clip();
          drawImageCover(ctx, brandImg, m, yPos, cw, 200);
          ctx.restore();
        } else {
          drawImagePlaceholder(ctx, m, yPos, cw, 200, primaryColor, "Brand Imagery", 12);
        }

        // Quick highlights
        yPos += 220;
        const highlights = [`Founded ${config.founded}`, config.headquarters, config.website];
        highlights.forEach((h, i) => {
          const hx = m + i * (cw / 3);
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(hx + 6, yPos + 6, 4, 0, Math.PI * 2);
          ctx.fill();
          drawProText(ctx, h, hx + 18, yPos, {
            fontSize: typo.caption, fontWeight: 500, color: pal.textMedium,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "stats": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, "AT A GLANCE", m, 18, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Key Statistics", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        const gridY = 130;
        const cardW = (cw - 20) / 2;
        const cardH = 110;
        keyStats.forEach((stat, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = m + col * (cardW + 20);
          const cy = gridY + row * (cardH + 14);

          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, cx, cy, cardW, cardH, 12);
          ctx.fill();
          ctx.fillStyle = primaryColor;
          roundRect(ctx, cx, cy, 5, cardH, 5);
          ctx.fill();

          drawProText(ctx, stat.value, cx + 24, cy + 22, {
            fontSize: typo.display, fontWeight: 900, color: primaryColor,
          });
          drawProDivider(ctx, cx + 24, cy + 58, cardW - 48, pal.lightGray, "gradient");
          drawProText(ctx, stat.label, cx + 24, cy + 74, {
            fontSize: typo.body, fontWeight: 500, color: pal.textMedium,
            maxWidth: cardW - 48,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "social": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, "DIGITAL PRESENCE", m, 18, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Social Media", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        // Calculate total
        const totalFollowers = socialStats.reduce((sum, s) => {
          const num = parseInt(s.followers.replace(/[^0-9]/g, ""), 10);
          return sum + (isNaN(num) ? 0 : num);
        }, 0);

        // Total banner
        const bannerY = 120;
        ctx.fillStyle = hexToRgba(primaryColor, 0.06);
        roundRect(ctx, m, bannerY, cw, 60, 10);
        ctx.fill();
        drawProText(ctx, "TOTAL REACH", m + 20, bannerY + 14, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProText(ctx, `${totalFollowers.toLocaleString()}+ followers`, m + 20, bannerY + 35, {
          fontSize: typo.h2, fontWeight: 800, color: pal.textDark,
        });

        // Social platform cards
        const gridY = bannerY + 80;
        const cardW = (cw - 20) / 2;
        const cardH = 70;
        socialStats.forEach((social, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = m + col * (cardW + 20);
          const cy = gridY + row * (cardH + 12);

          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, cx, cy, cardW, cardH, 10);
          ctx.fill();

          // Platform icon placeholder
          ctx.fillStyle = pal.primaryMuted;
          roundRect(ctx, cx + 14, cy + 18, 32, 32, 8);
          ctx.fill();
          ctx.fillStyle = primaryColor;
          ctx.font = getCanvasFont(700, 12, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(social.platform.charAt(0), cx + 30, cy + 34);

          drawProText(ctx, social.platform, cx + 58, cy + 18, {
            fontSize: typo.caption, fontWeight: 600, color: pal.textMedium,
          });
          drawProText(ctx, social.followers, cx + 58, cy + 38, {
            fontSize: typo.h3, fontWeight: 800, color: pal.textDark,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "press": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, "GET IN TOUCH", m, 18, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Press Contacts", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        let yPos = 130;
        pressContacts.forEach((contact, i) => {
          ctx.fillStyle = i % 2 === 0 ? pal.offWhite : "#ffffff";
          roundRect(ctx, m, yPos, cw, 90, 10);
          ctx.fill();

          // Avatar circle
          ctx.fillStyle = pal.primaryMuted;
          ctx.beginPath();
          ctx.arc(m + 35, yPos + 45, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = primaryColor;
          ctx.font = getCanvasFont(700, 16, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const initials = contact.name.split(" ").map((n) => n[0]).join("");
          ctx.fillText(initials, m + 35, yPos + 45);

          drawProText(ctx, contact.name, m + 70, yPos + 22, {
            fontSize: typo.body + 1, fontWeight: 700, color: pal.textDark,
          });
          drawProText(ctx, contact.role, m + 70, yPos + 42, {
            fontSize: typo.caption, fontWeight: 500, color: primaryColor,
          });
          drawProText(ctx, contact.email, m + 70, yPos + 60, {
            fontSize: typo.caption, fontWeight: 400, color: pal.textMedium,
          });

          yPos += 104;
        });

        // General enquiry
        yPos += 20;
        ctx.fillStyle = hexToRgba(primaryColor, 0.06);
        roundRect(ctx, m, yPos, cw, 60, 10);
        ctx.fill();
        ctx.fillStyle = primaryColor;
        roundRect(ctx, m, yPos, 4, 60, 4);
        ctx.fill();

        drawProText(ctx, "GENERAL MEDIA ENQUIRIES", m + 18, yPos + 14, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProText(ctx, `press@${config.website.replace("www.", "")}`, m + 18, yPos + 34, {
          fontSize: typo.body, fontWeight: 500, color: pal.textDark,
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "assets": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, "BRAND ASSETS", m, 18, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Media Assets", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        let yPos = 125;

        // Logo section
        drawProText(ctx, "LOGOS", m, yPos, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProDivider(ctx, m, yPos + 16, cw, primaryColor, "solid", 1);
        yPos += 28;

        const logoW = (cw - 30) / 3;
        const logos = ["Primary Logo", "White Logo", "Icon Only"];
        logos.forEach((label, i) => {
          const lx = m + i * (logoW + 15);
          drawImagePlaceholder(ctx, lx, yPos, logoW, 80, primaryColor, label, 8);
        });
        yPos += 100;

        // Brand colors section
        drawProText(ctx, "BRAND COLORS", m, yPos, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProDivider(ctx, m, yPos + 16, cw, primaryColor, "solid", 1);
        yPos += 28;

        const colors = [primaryColor, pal.primaryMuted, pal.textDark, pal.mediumGray, "#ffffff"];
        const colorW = (cw - 20) / 5;
        colors.forEach((c, i) => {
          const cx = m + i * (colorW + 5);
          ctx.fillStyle = c;
          roundRect(ctx, cx, yPos, colorW, 50, 8);
          ctx.fill();
          if (c === "#ffffff") {
            ctx.strokeStyle = pal.lightGray;
            ctx.lineWidth = 1;
            roundRect(ctx, cx, yPos, colorW, 50, 8);
            ctx.stroke();
          }
          ctx.fillStyle = pal.textLight;
          ctx.font = getCanvasFont(500, 7, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(c.toUpperCase(), cx + colorW / 2, yPos + 56);
        });
        yPos += 80;

        // Typography section
        drawProText(ctx, "TYPOGRAPHY", m, yPos, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProDivider(ctx, m, yPos + 16, cw, primaryColor, "solid", 1);
        yPos += 28;

        ctx.fillStyle = pal.offWhite;
        roundRect(ctx, m, yPos, cw, 100, 10);
        ctx.fill();

        drawProText(ctx, "Aa", m + 20, yPos + 15, {
          fontSize: typo.display + 10, fontWeight: 800, color: primaryColor,
        });
        drawProText(ctx, "Primary: Inter / Sans-Serif", m + 100, yPos + 20, {
          fontSize: typo.body, fontWeight: 600, color: pal.textDark,
        });
        drawProText(ctx, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", m + 100, yPos + 44, {
          fontSize: typo.caption, fontWeight: 400, color: pal.textMedium,
        });
        drawProText(ctx, "abcdefghijklmnopqrstuvwxyz 0123456789", m + 100, yPos + 62, {
          fontSize: typo.caption, fontWeight: 400, color: pal.textMedium,
        });
        drawProText(ctx, "Weights: Regular, Medium, Bold, Extra Bold", m + 100, yPos + 80, {
          fontSize: typo.caption, fontWeight: 400, color: pal.textLight,
        });

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
  }, [config, brandImg, keyStats, socialStats, pressContacts, advancedSettings]);

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
            content: `Generate a press/media kit for: "${config.description}".
Return JSON: { "companyName": "", "tagline": "", "brandOverview": "4-5 sentences", "founded": "", "headquarters": "", "website": "", "keyStats": [{ "value": "", "label": "" }], "socialStats": [{ "platform": "", "followers": "" }], "pressContacts": [{ "name": "", "role": "", "email": "" }], "brandImageQuery": "" }
Generate 6 key stats, 6 social platforms, and 3 press contacts.`,
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
          brandOverview: data.brandOverview || config.brandOverview,
          founded: data.founded || config.founded,
          headquarters: data.headquarters || config.headquarters,
          website: data.website || config.website,
        });
        if (data.keyStats?.length) {
          setKeyStats(data.keyStats.map((s: { value: string; label: string }) => ({
            id: uid(), value: s.value, label: s.label,
          })));
        }
        if (data.socialStats?.length) {
          setSocialStats(data.socialStats.map((s: { platform: string; followers: string }) => ({
            id: uid(), platform: s.platform, followers: s.followers,
          })));
        }
        if (data.pressContacts?.length) {
          setPressContacts(data.pressContacts.map((c: { name: string; role: string; email: string }) => ({
            id: uid(), name: c.name, role: c.role, email: c.email,
          })));
        }
        if (data.brandImageQuery) {
          const imgs = await searchStockImages(data.brandImageQuery, { perPage: 1 });
          if (imgs.length > 0) {
            try {
              const img = await loadImage(imgs[0].urls.regular);
              setBrandImg(img);
              updateConfig({ brandImageUrl: imgs[0].urls.regular });
            } catch { /* skip */ }
          }
        }
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config, isGenerating, updateConfig]);

  /* ── Stock Image Handler ─────────────────────────────────── */

  const handleStockImageSelect = useCallback(async (img: StockImage) => {
    try {
      const loaded = await loadImage(img.urls.regular);
      setBrandImg(loaded);
      updateConfig({ brandImageUrl: img.urls.regular });
    } catch { /* skip */ }
  }, [updateConfig]);

  /* ── Export ──────────────────────────────────────────────── */

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const settings = EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"];
    exportHighRes(canvas, settings, `media-kit-${PAGES[config.activePage]?.id || "page"}`);
  }, [config.activePage]);

  /* ── Template Previews ──────────────────────────────────── */

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const hStyle = t.id === "creative" ? "gradient" : t.id === "modern" ? "gradient" : t.id === "bold" ? "bar" : t.id === "editorial" ? "minimal" : "bar";
      drawDocumentThumbnail(ctx, w, h, {
        primaryColor: config.primaryColor,
        headerStyle: hStyle as "bar" | "gradient" | "minimal",
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
          value={config.description}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe your company for the media kit… e.g., 'A Zambian fintech startup offering mobile payments'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Media Kit</>}
        </button>
      </AccordionSection>

      <AccordionSection id="details" icon={<IconFileText className="size-3.5" />} label="Brand Details">
        <div className="space-y-2">
          {(["companyName", "tagline", "founded", "headquarters", "website"] as const).map((field) => (
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
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Brand Overview</label>
            <textarea
              value={config.brandOverview}
              onChange={(e) => updateConfig({ brandOverview: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={4}
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="stats" icon={<IconBriefcase className="size-3.5" />} label="Key Stats">
        <div className="space-y-2">
          {keyStats.map((stat, i) => (
            <div key={stat.id} className="flex gap-1.5">
              <input
                type="text"
                value={stat.value}
                onChange={(e) => {
                  const updated = [...keyStats];
                  updated[i] = { ...stat, value: e.target.value };
                  setKeyStats(updated);
                }}
                className="w-1/3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Value"
              />
              <input
                type="text"
                value={stat.label}
                onChange={(e) => {
                  const updated = [...keyStats];
                  updated[i] = { ...stat, label: e.target.value };
                  setKeyStats(updated);
                }}
                className="w-2/3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Label"
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="social" icon={<IconUsers className="size-3.5" />} label="Social Media">
        <div className="space-y-2">
          {socialStats.map((social, i) => (
            <div key={social.id} className="flex gap-1.5">
              <input
                type="text"
                value={social.platform}
                onChange={(e) => {
                  const updated = [...socialStats];
                  updated[i] = { ...social, platform: e.target.value };
                  setSocialStats(updated);
                }}
                className="w-1/2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Platform"
              />
              <input
                type="text"
                value={social.followers}
                onChange={(e) => {
                  const updated = [...socialStats];
                  updated[i] = { ...social, followers: e.target.value };
                  setSocialStats(updated);
                }}
                className="w-1/2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Followers"
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="press" icon={<IconLayout className="size-3.5" />} label="Press Contacts">
        <div className="space-y-2">
          {pressContacts.map((contact, i) => (
            <div key={contact.id} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 space-y-1">
              <input
                type="text"
                value={contact.name}
                onChange={(e) => {
                  const updated = [...pressContacts];
                  updated[i] = { ...contact, name: e.target.value };
                  setPressContacts(updated);
                }}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Name"
              />
              <input
                type="text"
                value={contact.role}
                onChange={(e) => {
                  const updated = [...pressContacts];
                  updated[i] = { ...contact, role: e.target.value };
                  setPressContacts(updated);
                }}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Role"
              />
              <input
                type="text"
                value={contact.email}
                onChange={(e) => {
                  const updated = [...pressContacts];
                  updated[i] = { ...contact, email: e.target.value };
                  setPressContacts(updated);
                }}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Email"
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="images" icon={<IconImage className="size-3.5" />} label="Brand Image">
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
        onSelect={(id) => updateConfig({ template: id as KitTemplate })}
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
      label={`Media Kit — A4 (${PAGE_W}×${PAGE_H}) — Page ${config.activePage + 1}/${PAGES.length}`}
    />
  );
}
