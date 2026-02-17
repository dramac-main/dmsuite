"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload,
  IconLayout, IconDroplet, IconImage, IconFileText,
  IconHome, IconUsers,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { loadImage, drawImageCover } from "@/lib/graphics-engine";
import {
  drawProText, drawProDivider, drawHeaderArea, drawImagePlaceholder,
  generateColorPalette, getTypographicScale, exportHighRes, EXPORT_PRESETS,
} from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import { StockImagePanel, type StockImage } from "@/hooks/useStockImages";

/* ── Types ─────────────────────────────────────────────────── */

type ListingTemplate = "modern" | "luxury" | "minimal" | "classic" | "bold" | "elegant";

interface PropertySpec {
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  garage: string;
  yearBuilt: string;
  lotSize: string;
}

interface AgentInfo {
  name: string;
  phone: string;
  email: string;
  agency: string;
}

interface RealEstateConfig {
  template: ListingTemplate;
  primaryColor: string;
  propertyName: string;
  address: string;
  city: string;
  price: string;
  currency: string;
  status: string;
  description: string;
  features: string;
  specs: PropertySpec;
  agent: AgentInfo;
  aiPrompt: string;
  heroImageUrl: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const TEMPLATES: { id: ListingTemplate; name: string }[] = [
  { id: "modern", name: "Modern" },
  { id: "luxury", name: "Luxury" },
  { id: "minimal", name: "Minimal" },
  { id: "classic", name: "Classic" },
  { id: "bold", name: "Bold" },
  { id: "elegant", name: "Elegant" },
];

const PAGE_W = 595, PAGE_H = 842; // A4

const COLOR_PRESETS = [
  "#1e3a5f", "#0d7377", "#2d1b69", "#b91c1c", "#0f4c75",
  "#1a1a2e", "#6c5ce7", "#065f46", "#713f12", "#831843",
  "#8ae600", "#06b6d4",
];



/* ── Component ───────────────────────────────────────────── */

export default function RealEstateListingWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [heroImg, setHeroImg] = useState<HTMLImageElement | null>(null);

  const [config, setConfig] = useState<RealEstateConfig>({
    template: "modern",
    primaryColor: "#1e3a5f",
    propertyName: "4 Bedroom House in Kabulonga",
    address: "Plot 42, Kabulonga Road",
    city: "Lusaka, Zambia",
    price: "2,500,000",
    currency: "ZMW",
    status: "FOR SALE",
    description:
      "Stunning 4-bedroom family home located in the prestigious Kabulonga area of Lusaka. This beautifully designed property features spacious living areas, a modern kitchen with granite countertops, a manicured garden with swimming pool, and a double garage. Perfect for families seeking comfort and security in one of Lusaka's most sought-after neighborhoods.",
    features:
      "Swimming Pool, Borehole, Solar Panels, CCTV Security, Electric Fence, Servant's Quarters, Built-in Wardrobes, Granite Countertops",
    specs: {
      bedrooms: "4",
      bathrooms: "3",
      sqft: "3,200",
      garage: "2",
      yearBuilt: "2021",
      lotSize: "1,200 m²",
    },
    agent: {
      name: "Grace Mwansa",
      phone: "+260 97 1234567",
      email: "grace@lusakaproperty.co.zm",
      agency: "Lusaka Property Partners",
    },
    aiPrompt: "",
    heroImageUrl: "",
  });

  const updateConfig = useCallback((partial: Partial<RealEstateConfig>) => {
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

    const { template, primaryColor } = config;
    const pal = generateColorPalette(primaryColor);
    const typo = getTypographicScale(PAGE_H);
    const m = 32;
    const cw = PAGE_W - m * 2;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    /* ── Hero / Photo Section ────────────────────────────── */
    const heroH = template === "luxury" ? PAGE_H * 0.45 : template === "bold" ? PAGE_H * 0.42 : PAGE_H * 0.38;

    if (heroImg) {
      ctx.save();
      if (template === "modern" || template === "bold") {
        // Full bleed hero
        drawImageCover(ctx, heroImg, 0, 0, PAGE_W, heroH);
      } else if (template === "luxury") {
        drawImageCover(ctx, heroImg, 0, 0, PAGE_W, heroH);
      } else {
        // Inset hero with margin
        roundRect(ctx, m, m, cw, heroH - m * 2, 8);
        ctx.clip();
        drawImageCover(ctx, heroImg, m, m, cw, heroH - m * 2);
      }
      ctx.restore();
      // Gradient overlay at bottom
      const grad = ctx.createLinearGradient(0, heroH - 100, 0, heroH);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, hexToRgba("#000000", 0.6));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, PAGE_W, heroH);
    } else {
      // Placeholder photo area
      drawHeaderArea(ctx, 0, 0, PAGE_W, heroH, primaryColor, template === "minimal" ? "minimal" : "gradient");
      drawImagePlaceholder(ctx, PAGE_W / 2 - 40, heroH / 2 - 30, 80, 60, primaryColor);
      drawProText(ctx, "Property Photo", PAGE_W / 2, heroH / 2 + 50, {
        fontSize: typo.caption, fontWeight: 500, color: hexToRgba("#ffffff", 0.6), align: "center",
      });
    }

    // Status badge
    const statusBadgeW = ctx.measureText(config.status).width + 30;
    if (template === "luxury" || template === "elegant") {
      ctx.fillStyle = primaryColor;
      roundRect(ctx, m, heroH - 50, statusBadgeW + 10, 28, 4);
      ctx.fill();
    } else if (template === "bold") {
      ctx.fillStyle = "#e11d48";
      ctx.fillRect(m, heroH - 50, statusBadgeW + 10, 28);
    } else {
      ctx.fillStyle = hexToRgba(primaryColor, 0.9);
      roundRect(ctx, m, heroH - 50, statusBadgeW + 10, 28, 14);
      ctx.fill();
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = getCanvasFont(700, 10, "modern");
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(config.status, m + 12, heroH - 36);

    /* ── Price overlay on hero ─────────────────────────────── */
    if (heroImg) {
      drawProText(ctx, `${config.currency} ${config.price}`, PAGE_W - m, heroH - 18, {
        fontSize: typo.h2, fontWeight: 900, color: "#ffffff", align: "right", shadow: true,
      });
    }

    /* ── Property Details Section ──────────────────────────── */
    let curY = heroH + 24;

    // Property Name
    drawProText(ctx, config.propertyName, m, curY, {
      fontSize: template === "luxury" ? typo.h1 + 2 : typo.h1,
      fontWeight: 800, color: pal.textDark, maxWidth: cw,
      fontStyle: template === "elegant" ? "classic" : "modern",
    });
    curY += typo.h1 + 10;

    // Address line
    drawProText(ctx, `${config.address}, ${config.city}`, m, curY, {
      fontSize: typo.body, fontWeight: 400, color: pal.textMedium, maxWidth: cw,
    });
    curY += typo.body + 6;

    // Price (if no hero image to display it on)
    if (!heroImg) {
      drawProText(ctx, `${config.currency} ${config.price}`, m, curY, {
        fontSize: typo.h2 + 2, fontWeight: 900, color: primaryColor,
      });
      curY += typo.h2 + 14;
    } else {
      curY += 8;
    }

    // Divider
    drawProDivider(ctx, m, curY, cw, pal.lightGray, "gradient");
    curY += 16;

    /* ── Specs Row ──────────────────────────────────────────── */
    const specItems = [
      { label: "Bedrooms", value: config.specs.bedrooms, icon: "🛏" },
      { label: "Bathrooms", value: config.specs.bathrooms, icon: "🚿" },
      { label: "Area", value: `${config.specs.sqft} sqft`, icon: "📐" },
      { label: "Garage", value: config.specs.garage, icon: "🚗" },
    ];
    const specW = cw / specItems.length;

    specItems.forEach((spec, i) => {
      const sx = m + i * specW;

      // Spec card
      if (template === "modern" || template === "bold") {
        ctx.fillStyle = pal.offWhite;
        roundRect(ctx, sx + 2, curY, specW - 8, 52, 8);
        ctx.fill();
      } else if (template === "luxury" || template === "elegant") {
        ctx.strokeStyle = pal.lightGray;
        ctx.lineWidth = 1;
        roundRect(ctx, sx + 2, curY, specW - 8, 52, 6);
        ctx.stroke();
      }

      // Value
      drawProText(ctx, spec.value, sx + specW / 2, curY + 14, {
        fontSize: typo.h3, fontWeight: 800, color: primaryColor, align: "center",
      });
      // Label
      drawProText(ctx, spec.label, sx + specW / 2, curY + 36, {
        fontSize: typo.caption, fontWeight: 500, color: pal.textMedium, align: "center",
      });
    });
    curY += 68;

    /* ── Description ───────────────────────────────────────── */
    drawProText(ctx, "PROPERTY DESCRIPTION", m, curY, {
      fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
    });
    drawProDivider(ctx, m, curY + 14, 40, primaryColor, "solid", 2);
    curY += 24;

    ctx.font = getCanvasFont(400, typo.caption + 1, "modern");
    const descLines = wrapCanvasText(ctx, config.description, cw);
    descLines.forEach((line, i) => {
      ctx.fillStyle = pal.textMedium;
      ctx.font = getCanvasFont(400, typo.caption + 1, "modern");
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(line, m, curY + i * (typo.caption + 6));
    });
    curY += descLines.length * (typo.caption + 6) + 14;

    /* ── Features List ─────────────────────────────────────── */
    if (curY < PAGE_H - 220) {
      drawProText(ctx, "KEY FEATURES", m, curY, {
        fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
      });
      drawProDivider(ctx, m, curY + 14, 40, primaryColor, "solid", 2);
      curY += 26;

      const featuresList = config.features.split(",").map((f) => f.trim()).filter(Boolean);
      const colW = cw / 2;
      featuresList.forEach((feat, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const fx = m + col * colW;
        const fy = curY + row * 18;

        // Bullet
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(fx + 5, fy + 5, 3, 0, Math.PI * 2);
        ctx.fill();

        drawProText(ctx, feat, fx + 16, fy, {
          fontSize: typo.caption, fontWeight: 500, color: pal.textDark,
        });
      });
      curY += Math.ceil(featuresList.length / 2) * 18 + 14;
    }

    /* ── Map Placeholder ───────────────────────────────────── */
    if (curY < PAGE_H - 160) {
      const mapH = 80;
      ctx.fillStyle = pal.offWhite;
      roundRect(ctx, m, curY, cw, mapH, 8);
      ctx.fill();
      ctx.strokeStyle = pal.lightGray;
      ctx.lineWidth = 1;
      roundRect(ctx, m, curY, cw, mapH, 8);
      ctx.stroke();

      // Map icon
      drawProText(ctx, "📍 " + config.address + ", " + config.city, PAGE_W / 2, curY + mapH / 2, {
        fontSize: typo.caption, fontWeight: 500, color: pal.textMedium, align: "center",
      });
      curY += mapH + 18;
    }

    /* ── Agent Info Footer ─────────────────────────────────── */
    const footerH = 80;
    const footerY = PAGE_H - footerH - 12;

    // Divider above footer
    drawProDivider(ctx, m, footerY - 8, cw, pal.lightGray, "solid");

    // Agent info section
    if (template === "luxury" || template === "elegant") {
      ctx.fillStyle = hexToRgba(primaryColor, 0.04);
      roundRect(ctx, m, footerY, cw, footerH, 8);
      ctx.fill();
    }

    // Agent photo placeholder
    const avatarR = 22;
    ctx.fillStyle = pal.primaryMuted;
    ctx.beginPath();
    ctx.arc(m + avatarR + 8, footerY + footerH / 2, avatarR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = primaryColor;
    ctx.font = getCanvasFont(700, 14, "modern");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const agentInitials = config.agent.name.split(" ").map((n) => n[0]).join("");
    ctx.fillText(agentInitials, m + avatarR + 8, footerY + footerH / 2);

    // Agent details
    const agentX = m + avatarR * 2 + 24;
    drawProText(ctx, config.agent.name, agentX, footerY + 12, {
      fontSize: typo.body, fontWeight: 700, color: pal.textDark,
    });
    drawProText(ctx, config.agent.agency, agentX, footerY + 28, {
      fontSize: typo.caption, fontWeight: 500, color: primaryColor,
    });
    drawProText(ctx, config.agent.phone, agentX, footerY + 44, {
      fontSize: typo.caption, fontWeight: 400, color: pal.textMedium,
    });
    drawProText(ctx, config.agent.email, agentX, footerY + 58, {
      fontSize: typo.caption, fontWeight: 400, color: pal.textMedium,
    });

    // Agency logo area (right side)
    const logoArea = 60;
    ctx.fillStyle = pal.offWhite;
    roundRect(ctx, PAGE_W - m - logoArea, footerY + 10, logoArea, logoArea, 8);
    ctx.fill();
    ctx.fillStyle = pal.textLight;
    ctx.font = getCanvasFont(600, 7, "modern");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AGENCY", PAGE_W - m - logoArea / 2, footerY + 10 + logoArea / 2 - 5);
    ctx.fillText("LOGO", PAGE_W - m - logoArea / 2, footerY + 10 + logoArea / 2 + 5);

    // Bottom accent bar
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
  }, [config, heroImg]);

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
            content: `Generate a professional real estate property listing for: "${config.aiPrompt}".
Return JSON: { "propertyName": "", "address": "", "city": "", "price": "", "currency": "ZMW", "status": "FOR SALE", "description": "3-4 sentences about the property", "features": "comma-separated list of 8 features", "specs": { "bedrooms": "", "bathrooms": "", "sqft": "", "garage": "", "yearBuilt": "", "lotSize": "" }, "agent": { "name": "", "phone": "", "email": "", "agency": "" } }`,
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
          propertyName: data.propertyName || config.propertyName,
          address: data.address || config.address,
          city: data.city || config.city,
          price: data.price || config.price,
          currency: data.currency || config.currency,
          status: data.status || config.status,
          description: data.description || config.description,
          features: data.features || config.features,
        });
        if (data.specs) {
          updateConfig({
            specs: { ...config.specs, ...data.specs },
          });
        }
        if (data.agent) {
          updateConfig({
            agent: { ...config.agent, ...data.agent },
          });
        }
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config, isGenerating, updateConfig]);

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
    exportHighRes(canvas, settings, `real-estate-listing`);
  }, []);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const hStyle = t.id === "modern" ? "bar" : t.id === "luxury" ? "gradient" : t.id === "minimal" ? "minimal" : t.id === "bold" ? "bar" : "gradient";
      drawDocumentThumbnail(ctx, w, h, {
        primaryColor: config.primaryColor,
        headerStyle: hStyle as "bar" | "gradient" | "minimal",
        showPhoto: true,
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
          value={config.aiPrompt}
          onChange={(e) => updateConfig({ aiPrompt: e.target.value })}
          placeholder="Describe a property… e.g., '5 bedroom luxury home in Ibex Hill, Lusaka with swimming pool and garden'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.aiPrompt.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Listing</>}
        </button>
      </AccordionSection>

      <AccordionSection id="property" icon={<IconHome className="size-3.5" />} label="Property Details">
        <div className="space-y-2">
          {([
            { key: "propertyName", label: "Property Name" },
            { key: "address", label: "Address" },
            { key: "city", label: "City" },
            { key: "price", label: "Price" },
            { key: "currency", label: "Currency" },
            { key: "status", label: "Status" },
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

      <AccordionSection id="specs" icon={<IconLayout className="size-3.5" />} label="Specifications">
        <div className="space-y-2">
          {([
            { key: "bedrooms", label: "Bedrooms" },
            { key: "bathrooms", label: "Bathrooms" },
            { key: "sqft", label: "Area (sqft)" },
            { key: "garage", label: "Garage Spaces" },
            { key: "yearBuilt", label: "Year Built" },
            { key: "lotSize", label: "Lot Size" },
          ] as const).map(({ key, label }) => (
            <div key={key}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{label}</label>
              <input
                type="text"
                value={config.specs[key]}
                onChange={(e) => updateConfig({ specs: { ...config.specs, [key]: e.target.value } })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="content" icon={<IconFileText className="size-3.5" />} label="Content">
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Description</label>
            <textarea
              value={config.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={4}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Features (comma-separated)</label>
            <textarea
              value={config.features}
              onChange={(e) => updateConfig({ features: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={3}
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="agent" icon={<IconUsers className="size-3.5" />} label="Agent Info">
        <div className="space-y-2">
          {([
            { key: "name", label: "Agent Name" },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "agency", label: "Agency" },
          ] as const).map(({ key, label }) => (
            <div key={key}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{label}</label>
              <input
                type="text"
                value={config.agent[key]}
                onChange={(e) => updateConfig({ agent: { ...config.agent, [key]: e.target.value } })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="images" icon={<IconImage className="size-3.5" />} label="Property Photos">
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
        onSelect={(id) => updateConfig({ template: id as ListingTemplate })}
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
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
      onZoomFit={() => setZoom(1)}
      label={`Real Estate Feature Sheet — A4 (${PAGE_W}×${PAGE_H})`}
    />
  );
}
