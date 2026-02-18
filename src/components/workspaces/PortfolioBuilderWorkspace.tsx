"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconDroplet,
  IconImage,
  IconUsers,
  IconBriefcase,
  IconCalendar,
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

type PortfolioTemplate = "creative" | "minimal" | "editorial" | "grid" | "dark" | "vibrant";

interface Project {
  title: string;
  description: string;
  client: string;
  year: string;
  tags: string;
}

interface PortfolioConfig {
  template: PortfolioTemplate;
  primaryColor: string;
  ownerName: string;
  tagline: string;
  profession: string;
  email: string;
  website: string;
  aboutText: string;
  coverImageUrl: string;
  projects: Project[];
  activePage: number;
  description: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const TEMPLATES: { id: PortfolioTemplate; name: string }[] = [
  { id: "creative", name: "Creative" },
  { id: "minimal", name: "Minimal" },
  { id: "editorial", name: "Editorial" },
  { id: "grid", name: "Grid" },
  { id: "dark", name: "Dark" },
  { id: "vibrant", name: "Vibrant" },
];

const COLOR_PRESETS = [
  "#1e3a5f", "#0f766e", "#7c3aed", "#b91c1c", "#1e40af",
  "#059669", "#c09c2c", "#334155", "#9f1239", "#06b6d4",
  "#8ae600", "#2d3436",
];

const PAGE_W = 595, PAGE_H = 842; // A4

const DEFAULT_PROJECTS: Project[] = [
  { title: "Zambia Tourism Rebrand", description: "Complete visual identity redesign for Zambia's national tourism board. Included logo, colour palette, typography system, and brand guidelines across print and digital media.", client: "Zambia Tourism Board", year: "2025", tags: "Branding, Identity" },
  { title: "Mosi Mobile App", description: "UI/UX design for a fintech mobile application targeting rural banking in Zambia. Clean, accessible interface designed for low-bandwidth environments.", client: "Mosi Financial", year: "2025", tags: "UI/UX, Mobile" },
  { title: "Kafue National Park Campaign", description: "Environmental awareness campaign with poster series, social media assets, and documentary title sequence for Zambia's largest national park.", client: "ZAWA", year: "2024", tags: "Print, Campaign" },
  { title: "Lusaka City Market Website", description: "E-commerce website design for connecting local artisans with international buyers. Responsive design with integrated payment systems.", client: "Lusaka City Council", year: "2024", tags: "Web, E-commerce" },
];

/* ── Helpers ──────────────────────────────────────────────── */

function getTemplateFontStyle(t: PortfolioTemplate): "modern" | "classic" | "elegant" {
  if (t === "editorial") return "classic";
  if (t === "creative" || t === "vibrant") return "elegant";
  return "modern";
}

function isDarkTemplate(t: PortfolioTemplate): boolean {
  return t === "dark";
}

/* ── Cover Page Renderer ─────────────────────────────────── */

function renderCoverPage(
  ctx: CanvasRenderingContext2D,
  cfg: PortfolioConfig,
  pal: ReturnType<typeof generateColorPalette>,
  fontStyle: "modern" | "classic" | "elegant",
  dark: boolean,
  m: number, cw: number,
  img: HTMLImageElement | null,
) {
  const { template, primaryColor, ownerName, tagline, profession, email, website } = cfg;
  const bgText = dark ? "#ffffff" : pal.textDark;
  const heroH = PAGE_H * 0.5;

  if (template === "vibrant") {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, PAGE_W, heroH);
    ctx.fillStyle = hexToRgba("#ffffff", 0.07);
    ctx.beginPath(); ctx.moveTo(0, heroH * 0.6); ctx.lineTo(PAGE_W, 0); ctx.lineTo(PAGE_W, heroH); ctx.lineTo(0, heroH); ctx.closePath(); ctx.fill();
    ctx.fillStyle = hexToRgba("#ffffff", 0.05);
    ctx.beginPath(); ctx.arc(PAGE_W * 0.8, heroH * 0.3, 100, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(PAGE_W * 0.2, heroH * 0.7, 60, 0, Math.PI * 2); ctx.fill();
  } else if (template === "dark") {
    const grad = ctx.createLinearGradient(0, 0, PAGE_W, heroH);
    grad.addColorStop(0, "#0f172a"); grad.addColorStop(1, hexToRgba(primaryColor, 0.3));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PAGE_W, heroH);
    ctx.strokeStyle = hexToRgba(primaryColor, 0.08);
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * (heroH / 19)); ctx.lineTo(PAGE_W, i * (heroH / 19)); ctx.stroke();
    }
  } else if (template === "editorial") {
    ctx.fillStyle = hexToRgba(primaryColor, 0.04);
    ctx.font = getCanvasFont(900, 100, "classic");
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(ownerName.split(" ")[0] || "", -10, 40);
  } else if (template === "grid") {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, PAGE_W, 8);
    const gridSize = 40;
    ctx.strokeStyle = hexToRgba(primaryColor, 0.06);
    ctx.lineWidth = 0.5;
    for (let x = 0; x < PAGE_W; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, heroH); ctx.stroke();
    }
    for (let y = 0; y < heroH; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PAGE_W, y); ctx.stroke();
    }
  } else if (template === "minimal") {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(m, 50, 40, 4);
  } else {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, PAGE_W, heroH);
    ctx.fillStyle = hexToRgba("#ffffff", 0.04);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(m + i * (cw / 5), heroH * 0.5 + Math.sin(i) * 40, 30 + i * 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const imgInHeader = template === "creative" || template === "vibrant" || template === "dark";
  if (img) {
    ctx.save();
    ctx.globalAlpha = imgInHeader ? 0.2 : 0.15;
    const aspect = img.width / img.height;
    ctx.drawImage(img, 0, 0, PAGE_W, PAGE_W / aspect);
    ctx.restore();
    if (imgInHeader) {
      const grad = ctx.createLinearGradient(0, heroH * 0.5, 0, heroH);
      grad.addColorStop(0, hexToRgba(dark ? "#0f172a" : primaryColor, 0.3));
      grad.addColorStop(1, dark ? "#0f172a" : primaryColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, heroH * 0.5, PAGE_W, heroH * 0.5);
    }
  } else if (imgInHeader) {
    drawImagePlaceholder(ctx, PAGE_W * 0.6, heroH * 0.1, PAGE_W * 0.3, heroH * 0.6, "#ffffff", "Photo", 8);
  }

  const nameY = imgInHeader ? heroH * 0.65 : (template === "editorial" ? 160 : 70);
  const nameColor = imgInHeader ? "#ffffff" : bgText;

  drawProText(ctx, ownerName, m, nameY, {
    fontSize: template === "editorial" ? 38 : 34,
    fontWeight: 800, fontStyle, color: nameColor, maxWidth: cw,
  });

  drawProText(ctx, tagline, m, nameY + 50, {
    fontSize: 14, fontWeight: 400, fontStyle,
    color: imgInHeader ? hexToRgba("#ffffff", 0.8) : pal.textMedium, maxWidth: cw,
  });

  const divY = imgInHeader ? heroH + 20 : nameY + 85;
  drawProDivider(ctx, m, divY, 60, primaryColor, template === "editorial" ? "ornate" : "solid", 2);

  const aboutY = divY + 25;
  ctx.font = getCanvasFont(400, 10, fontStyle);
  const aboutLines = wrapCanvasText(ctx, cfg.aboutText, cw);
  aboutLines.forEach((line, i) => {
    drawProText(ctx, line, m, aboutY + i * 16, {
      fontSize: 10, fontWeight: 400, fontStyle, color: dark ? hexToRgba("#ffffff", 0.7) : pal.textMedium, maxWidth: cw,
    });
  });

  const contactY = aboutY + aboutLines.length * 16 + 25;
  drawProDivider(ctx, m, contactY - 10, cw, dark ? hexToRgba("#ffffff", 0.1) : pal.mediumGray, "solid", 0.5);

  const contactItems = [
    { label: "Profession", value: profession },
    { label: "Email", value: email },
    { label: "Website", value: website },
  ];
  contactItems.forEach((item, i) => {
    const cx = m + i * (cw / 3);
    drawProText(ctx, item.label.toUpperCase(), cx, contactY + 5, {
      fontSize: 7, fontWeight: 600, fontStyle, color: primaryColor, uppercase: true,
    });
    drawProText(ctx, item.value, cx, contactY + 18, {
      fontSize: 9, fontWeight: 400, fontStyle, color: dark ? hexToRgba("#ffffff", 0.6) : pal.textMedium,
    });
  });

  const footY = PAGE_H - 50;
  drawProDivider(ctx, m, footY, cw, dark ? hexToRgba("#ffffff", 0.1) : pal.mediumGray, "solid", 0.5);
  drawProText(ctx, `${cfg.projects.length} Selected Projects`, m, footY + 12, {
    fontSize: 10, fontWeight: 600, fontStyle, color: primaryColor,
  });
  drawProText(ctx, `Portfolio \u2014 ${new Date().getFullYear()}`, PAGE_W - m, footY + 12, {
    fontSize: 9, fontWeight: 400, fontStyle, color: dark ? hexToRgba("#ffffff", 0.4) : pal.textLight, align: "right",
  });
}

/* ── Project Page Renderer ───────────────────────────────── */

function renderProjectPage(
  ctx: CanvasRenderingContext2D,
  cfg: PortfolioConfig,
  pal: ReturnType<typeof generateColorPalette>,
  fontStyle: "modern" | "classic" | "elegant",
  dark: boolean,
  m: number, cw: number,
  project: Project,
  projIdx: number,
  pageNum: number,
  totalPgs: number,
) {
  const { template, primaryColor } = cfg;
  const bgText = dark ? "#ffffff" : pal.textDark;

  ctx.fillStyle = dark ? "#0f172a" : template === "editorial" ? "#faf8f5" : "#ffffff";
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  drawProText(ctx, cfg.ownerName, m, 22, {
    fontSize: 8, fontWeight: 500, fontStyle, color: dark ? hexToRgba("#ffffff", 0.4) : pal.textLight,
  });
  drawProText(ctx, `Project ${projIdx + 1}`, PAGE_W - m, 22, {
    fontSize: 8, fontWeight: 500, fontStyle, color: dark ? hexToRgba("#ffffff", 0.4) : pal.textLight, align: "right",
  });
  drawProDivider(ctx, m, 36, cw, dark ? hexToRgba("#ffffff", 0.1) : pal.mediumGray, "solid", 0.5);

  const numY = 55;
  if (template === "creative" || template === "vibrant") {
    ctx.fillStyle = hexToRgba(primaryColor, 0.06);
    ctx.font = getCanvasFont(900, 140, fontStyle);
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(String(projIdx + 1).padStart(2, "0"), PAGE_W - m + 10, numY - 30);
  }

  drawProText(ctx, `PROJECT ${String(projIdx + 1).padStart(2, "0")}`, m, numY, {
    fontSize: 10, fontWeight: 600, fontStyle, color: primaryColor, uppercase: true,
  });

  const titleY = numY + 25;
  drawProText(ctx, project.title, m, titleY, {
    fontSize: template === "editorial" ? 28 : 26,
    fontWeight: 800, fontStyle, color: bgText, maxWidth: cw,
  });

  drawProDivider(ctx, m, titleY + 45, template === "minimal" ? 30 : 60, primaryColor, "solid", 2);

  const imgAreaY = titleY + 65;
  const imgAreaH = 260;
  if (template === "grid") {
    const gapW = 10;
    const halfW = (cw - gapW) / 2;
    const halfH = (imgAreaH - gapW) / 2;
    drawImagePlaceholder(ctx, m, imgAreaY, halfW, halfH, dark ? "#ffffff" : primaryColor, "Image 1", 6);
    drawImagePlaceholder(ctx, m + halfW + gapW, imgAreaY, halfW, halfH, dark ? "#ffffff" : primaryColor, "Image 2", 6);
    drawImagePlaceholder(ctx, m, imgAreaY + halfH + gapW, halfW, halfH, dark ? "#ffffff" : primaryColor, "Image 3", 6);
    drawImagePlaceholder(ctx, m + halfW + gapW, imgAreaY + halfH + gapW, halfW, halfH, dark ? "#ffffff" : primaryColor, "Image 4", 6);
  } else {
    drawImagePlaceholder(ctx, m, imgAreaY, cw, imgAreaH, dark ? "#ffffff" : primaryColor, "Project Showcase", 8);
  }

  const detailY = imgAreaY + imgAreaH + 30;

  ctx.font = getCanvasFont(400, 11, fontStyle);
  const descLines = wrapCanvasText(ctx, project.description, cw);
  descLines.forEach((line, i) => {
    drawProText(ctx, line, m, detailY + i * 17, {
      fontSize: 11, fontWeight: 400, fontStyle, color: dark ? hexToRgba("#ffffff", 0.7) : pal.textMedium, maxWidth: cw,
    });
  });

  const metaY = detailY + descLines.length * 17 + 25;
  drawProDivider(ctx, m, metaY - 10, cw, dark ? hexToRgba("#ffffff", 0.1) : pal.mediumGray, "solid", 0.5);

  const metaItems = [
    { label: "Client", value: project.client },
    { label: "Year", value: project.year },
    { label: "Category", value: project.tags },
  ];
  const metaColW = cw / 3;
  metaItems.forEach((item, i) => {
    const mx = m + i * metaColW;
    ctx.fillStyle = dark ? hexToRgba("#ffffff", 0.04) : hexToRgba(primaryColor, 0.04);
    roundRect(ctx, mx, metaY, metaColW - 10, 50, 6);
    ctx.fill();

    drawProText(ctx, item.label.toUpperCase(), mx + 10, metaY + 10, {
      fontSize: 7, fontWeight: 600, fontStyle, color: primaryColor, uppercase: true,
    });
    drawProText(ctx, item.value, mx + 10, metaY + 26, {
      fontSize: 10, fontWeight: 500, fontStyle, color: bgText,
    });
  });

  if (project.tags) {
    const tagsY = metaY + 70;
    const tags = project.tags.split(",").map((s) => s.trim());
    let tagX = m;
    tags.forEach((tag) => {
      const tw = ctx.measureText(tag).width + 20;
      ctx.fillStyle = hexToRgba(primaryColor, dark ? 0.2 : 0.1);
      roundRect(ctx, tagX, tagsY, tw, 22, 11);
      ctx.fill();
      drawProText(ctx, tag, tagX + 10, tagsY + 5, {
        fontSize: 9, fontWeight: 500, fontStyle, color: primaryColor,
      });
      tagX += tw + 8;
    });
  }

  const footerY = PAGE_H - 40;
  drawProDivider(ctx, m, footerY, cw, dark ? hexToRgba("#ffffff", 0.1) : pal.mediumGray, "solid", 0.5);
  drawProText(ctx, String(pageNum), PAGE_W / 2, footerY + 10, {
    fontSize: 9, fontWeight: 500, fontStyle, color: dark ? hexToRgba("#ffffff", 0.4) : pal.textLight, align: "center",
  });
  drawProText(ctx, `${pageNum} / ${totalPgs}`, PAGE_W - m, footerY + 10, {
    fontSize: 8, fontWeight: 400, fontStyle, color: dark ? hexToRgba("#ffffff", 0.4) : pal.textLight, align: "right",
  });
}

/* ── Component ───────────────────────────────────────────── */

export default function PortfolioBuilderWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [coverImg, setCoverImg] = useState<HTMLImageElement | null>(null);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<PortfolioConfig>({
    template: "creative",
    primaryColor: "#7c3aed",
    ownerName: "Thandiwe Mulenga",
    tagline: "Visual Storyteller & Brand Designer",
    profession: "Graphic Designer",
    email: "thandiwe@studio.co.zm",
    website: "www.thandiwecreative.com",
    aboutText: "I am a multidisciplinary graphic designer based in Lusaka, Zambia, with over 8 years of experience in branding, print, and digital design. I specialise in creating visual identities that celebrate African culture while meeting international standards.",
    coverImageUrl: "",
    projects: DEFAULT_PROJECTS,
    activePage: 0,
    description: "",
  });

  const updateConfig = useCallback((p: Partial<PortfolioConfig>) => setConfig((prev) => ({ ...prev, ...p })), []);

  const totalPages = 1 + config.projects.length; // cover + project pages

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
    const dark = isDarkTemplate(template);
    const m = 40;
    const cw = PAGE_W - m * 2;

    // Page base
    ctx.fillStyle = dark ? "#0f172a" : template === "editorial" ? "#faf8f5" : "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    if (activePage === 0) {
      renderCoverPage(ctx, config, pal, fontStyle, dark, m, cw, coverImg);
    } else {
      const projIdx = activePage - 1;
      const project = config.projects[projIdx];
      if (project) {
        renderProjectPage(ctx, config, pal, fontStyle, dark, m, cw, project, projIdx, activePage, totalPages);
      }
    }
  }, [config, coverImg, totalPages]);

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
            { role: "system", content: "You are a portfolio content writer. Return valid JSON only." },
            { role: "user", content: `Generate portfolio content for: ${config.description}. Return JSON: {"ownerName":"…","tagline":"…","profession":"…","email":"…","website":"…","aboutText":"…","projects":[{"title":"…","description":"…","client":"…","year":"…","tags":"…"}]} with 4 projects. Zambian context preferred.` },
          ],
        }),
      });
      const data = await res.json();
      const text = cleanAIText(data.choices?.[0]?.message?.content || data.content || "");
      const parsed = JSON.parse(text);
      if (parsed.ownerName) {
        updateConfig({
          ownerName: parsed.ownerName,
          tagline: parsed.tagline || config.tagline,
          profession: parsed.profession || config.profession,
          email: parsed.email || config.email,
          website: parsed.website || config.website,
          aboutText: parsed.aboutText || config.aboutText,
          projects: (parsed.projects || []).map((p: { title?: string; description?: string; client?: string; year?: string; tags?: string }) => ({
            title: p.title || "Untitled Project",
            description: p.description || "",
            client: p.client || "",
            year: p.year || "2025",
            tags: p.tags || "",
          })),
        });
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config.description, config.tagline, config.profession, config.email, config.website, config.aboutText, isGenerating, updateConfig]);

  /* ── Stock Image Handler ─────────────────────────────────── */

  const handleStockImageSelect = useCallback((img: StockImage) => {
    updateConfig({ coverImageUrl: img.urls.regular });
  }, [updateConfig]);

  /* ── Export ──────────────────────────────────────────────── */

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], `portfolio-page-${config.activePage}`);
  }, [config.activePage]);

  /* ── Template Previews ──────────────────────────────────── */

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const isDark = t.id === "dark";
      ctx.fillStyle = isDark ? "#0f172a" : t.id === "editorial" ? "#faf8f5" : "#ffffff";
      ctx.fillRect(0, 0, w, h);
      const c = config.primaryColor;
      if (t.id === "creative" || t.id === "vibrant") {
        ctx.fillStyle = c; ctx.fillRect(0, 0, w, h * 0.45);
      } else if (isDark) {
        const grad = ctx.createLinearGradient(0, 0, w, h * 0.4);
        grad.addColorStop(0, "#0f172a"); grad.addColorStop(1, hexToRgba(c, 0.3));
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h * 0.4);
      } else if (t.id === "grid") {
        ctx.fillStyle = c; ctx.fillRect(0, 0, w, 4);
      } else if (t.id === "minimal") {
        ctx.fillStyle = c; ctx.fillRect(w * 0.08, h * 0.1, w * 0.15, 2);
      }
      // Name placeholder
      ctx.fillStyle = hexToRgba(isDark ? "#ffffff" : c, 0.4);
      ctx.fillRect(w * 0.08, h * 0.55, w * 0.65, h * 0.04);
      ctx.fillRect(w * 0.08, h * 0.63, w * 0.45, h * 0.025);
      // Image placeholder
      ctx.fillStyle = hexToRgba(isDark ? "#ffffff" : c, 0.08);
      ctx.fillRect(w * 0.08, h * 0.75, w * 0.84, h * 0.15);
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
          placeholder="Describe your portfolio… e.g., 'A Zambian photographer specializing in wildlife and landscapes'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={3}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Portfolio</>}
        </button>
      </AccordionSection>

      <AccordionSection id="details" icon={<IconUsers className="size-3.5" />} label="Profile">
        <div className="space-y-2">
          {(["ownerName", "tagline", "profession", "email", "website"] as const).map((f) => (
            <div key={f}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{f.replace(/([A-Z])/g, " $1")}</label>
              <input
                type="text"
                value={config[f]}
                onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">About</label>
            <textarea
              value={config.aboutText}
              onChange={(e) => updateConfig({ aboutText: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={3}
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="projects" icon={<IconBriefcase className="size-3.5" />} label={`Projects (${config.projects.length})`}>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {config.projects.map((proj, i) => (
            <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold text-gray-500">Project {i + 1}</span>
                <button onClick={() => updateConfig({ projects: config.projects.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-300 text-xs">×</button>
              </div>
              <input type="text" value={proj.title}
                onChange={(e) => { const u = [...config.projects]; u[i] = { ...u[i], title: e.target.value }; updateConfig({ projects: u }); }}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" placeholder="Title" />
              <textarea value={proj.description}
                onChange={(e) => { const u = [...config.projects]; u[i] = { ...u[i], description: e.target.value }; updateConfig({ projects: u }); }}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white resize-none" rows={2} placeholder="Description" />
              <div className="flex gap-1">
                <input type="text" value={proj.client}
                  onChange={(e) => { const u = [...config.projects]; u[i] = { ...u[i], client: e.target.value }; updateConfig({ projects: u }); }}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" placeholder="Client" />
                <input type="text" value={proj.year}
                  onChange={(e) => { const u = [...config.projects]; u[i] = { ...u[i], year: e.target.value }; updateConfig({ projects: u }); }}
                  className="w-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" placeholder="Year" />
              </div>
              <input type="text" value={proj.tags}
                onChange={(e) => { const u = [...config.projects]; u[i] = { ...u[i], tags: e.target.value }; updateConfig({ projects: u }); }}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" placeholder="Tags (comma separated)" />
            </div>
          ))}
          <button
            onClick={() => updateConfig({ projects: [...config.projects, { title: "New Project", description: "", client: "", year: String(new Date().getFullYear()), tags: "" }] })}
            className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-500 hover:text-primary-500 hover:border-primary-500 transition-colors"
          >+ Add Project</button>
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

      <AccordionSection id="pages" icon={<IconCalendar className="size-3.5" />} label="Pages">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => updateConfig({ activePage: 0 })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${config.activePage === 0 ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
          >Cover</button>
          {config.projects.map((_, i) => (
            <button key={i}
              onClick={() => updateConfig({ activePage: i + 1 })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${config.activePage === i + 1 ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
            >P{i + 1}</button>
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
      onSelect={(id) => updateConfig({ template: id as PortfolioTemplate })}
      thumbWidth={120}
      thumbHeight={170}
    />
  );

  /* ── Toolbar ─────────────────────────────────────────────── */

  const toolbar = (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => updateConfig({ activePage: Math.max(0, config.activePage - 1) })}
        disabled={config.activePage === 0}
        className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-30"
      >‹ Prev</button>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Page {config.activePage + 1} / {totalPages}
      </span>
      <button
        onClick={() => updateConfig({ activePage: Math.min(totalPages - 1, config.activePage + 1) })}
        disabled={config.activePage >= totalPages - 1}
        className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-30"
      >Next ›</button>
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
      label={`Portfolio — ${config.activePage === 0 ? "Cover" : `Project ${config.activePage}`} — A4 (${PAGE_W}×${PAGE_H})`}
    />
  );
}
