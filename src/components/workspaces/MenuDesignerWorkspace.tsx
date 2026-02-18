"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconUtensils,
  IconPlus,
  IconTrash,
  IconCopy,
  IconDroplet,
  IconType,
  IconLayout,
  IconPrinter,
} from "@/components/icons";
import { cleanAIText, hexToRgba, getContrastColor, roundRect } from "@/lib/canvas-utils";
import {
  drawPattern,
  drawDivider,
  drawAccentCircle,
  drawGradient,
  drawTextWithShadow,
  drawSeal,
} from "@/lib/graphics-engine";
import { drawMenuThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { jsPDF } from "jspdf";

/* ── Types ─────────────────────────────────────────────────── */

type FoldType = "single" | "bi-fold" | "tri-fold";
type PageSize = "a4" | "a5" | "letter";
type MenuTemplate = "elegant" | "rustic" | "modern" | "bistro" | "fine-dining" | "casual";
type MenuSectionId = "appetizers" | "mains" | "desserts" | "drinks" | "specials";
type DietaryTag = "V" | "VG" | "GF" | "DF";

interface MenuItem {
  name: string;
  description: string;
  price: string;
  dietary: DietaryTag[];
}

interface MenuSection {
  id: MenuSectionId;
  label: string;
  items: MenuItem[];
}

interface MenuConfig {
  foldType: FoldType;
  pageSize: PageSize;
  template: MenuTemplate;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  restaurantName: string;
  tagline: string;
  currency: string;
  currencySymbol: string;
  sections: MenuSection[];
  cuisineDescription: string;
  fontStyle: "modern" | "classic" | "bold" | "elegant";
  patternType: string;
  showDietaryLegend: boolean;
}

/* ── Constants ─────────────────────────────────────────────── */

const FOLD_TYPES: { id: FoldType; label: string; panels: number }[] = [
  { id: "single", label: "Single Page", panels: 1 },
  { id: "bi-fold", label: "Bi-Fold", panels: 2 },
  { id: "tri-fold", label: "Tri-Fold", panels: 3 },
];

const PAGE_SIZES: { id: PageSize; label: string; w: number; h: number }[] = [
  { id: "a4", label: "A4", w: 595, h: 842 },
  { id: "a5", label: "A5", w: 420, h: 595 },
  { id: "letter", label: "Letter", w: 612, h: 792 },
];

const TEMPLATES: { id: MenuTemplate; label: string; desc: string }[] = [
  { id: "elegant", label: "Elegant", desc: "Refined serif" },
  { id: "rustic", label: "Rustic", desc: "Warm earthy" },
  { id: "modern", label: "Modern", desc: "Clean sans" },
  { id: "bistro", label: "Bistro", desc: "Bold casual" },
  { id: "fine-dining", label: "Fine Dining", desc: "Luxe minimal" },
  { id: "casual", label: "Casual", desc: "Fun colorful" },
];

const SECTION_LABELS: Record<MenuSectionId, string> = {
  appetizers: "Appetizers",
  mains: "Main Course",
  desserts: "Desserts",
  drinks: "Drinks",
  specials: "Chef's Specials",
};

const DIETARY_LABELS: Record<DietaryTag, { label: string; color: string }> = {
  V: { label: "Vegetarian", color: "#16a34a" },
  VG: { label: "Vegan", color: "#059669" },
  GF: { label: "Gluten Free", color: "#d97706" },
  DF: { label: "Dairy Free", color: "#2563eb" },
};

const colorPresets = [
  { name: "Dark", primary: "#1e293b", accent: "#c09c2c", bg: "#fffef8" },
  { name: "Rustic", primary: "#7c2d12", accent: "#d97706", bg: "#faf7f0" },
  { name: "Forest", primary: "#14532d", accent: "#16a34a", bg: "#f0fdf4" },
  { name: "Ocean", primary: "#1e3a5f", accent: "#0ea5e9", bg: "#f0f9ff" },
  { name: "Purple", primary: "#4a1d96", accent: "#8b5cf6", bg: "#faf5ff" },
  { name: "Rose", primary: "#831843", accent: "#f43f5e", bg: "#fff1f2" },
  { name: "Gold", primary: "#713f12", accent: "#eab308", bg: "#fefce8" },
  { name: "Teal", primary: "#0f766e", accent: "#14b8a6", bg: "#f0fdfa" },
  { name: "Dark Mode", primary: "#f8fafc", accent: "#c09c2c", bg: "#0f172a" },
  { name: "Charcoal", primary: "#ffffff", accent: "#8ae600", bg: "#18181b" },
];

const patternOptions = [
  { id: "none", label: "None" },
  { id: "dots", label: "Dots" },
  { id: "lines", label: "Lines" },
  { id: "diagonal-lines", label: "Diagonal" },
  { id: "crosshatch", label: "Crosshatch" },
  { id: "waves", label: "Waves" },
  { id: "diamond", label: "Diamond" },
];

const CURRENCIES = [
  { code: "ZMW", symbol: "K", label: "Zambian Kwacha" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
];

function defaultSections(): MenuSection[] {
  return [
    { id: "appetizers", label: "Appetizers", items: [
      { name: "Garden Salad", description: "Fresh greens with vinaigrette", price: "45", dietary: ["V", "GF"] },
      { name: "Mushroom Soup", description: "Creamy wild mushroom soup", price: "55", dietary: ["V"] },
    ]},
    { id: "mains", label: "Main Course", items: [
      { name: "Grilled Tilapia", description: "Lake Kariba tilapia with nshima and vegetables", price: "120", dietary: ["GF"] },
      { name: "Beef Stew", description: "Slow-cooked Zambian beef with seasonal greens", price: "110", dietary: ["GF", "DF"] },
      { name: "Village Chicken", description: "Free-range chicken with rice and gravy", price: "95", dietary: [] },
    ]},
    { id: "desserts", label: "Desserts", items: [
      { name: "Munkoyo Ice Cream", description: "Traditional Zambian flavour ice cream", price: "40", dietary: ["V"] },
    ]},
    { id: "drinks", label: "Drinks", items: [
      { name: "Fresh Mango Juice", description: "Seasonal Zambian mangoes", price: "25", dietary: ["V", "VG", "GF", "DF"] },
      { name: "Zambian Tea", description: "Black tea with milk", price: "15", dietary: ["V"] },
    ]},
  ];
}

/* ── Font helpers ──────────────────────────────────────────── */

function getFontFamily(style: MenuConfig["fontStyle"]): string {
  switch (style) {
    case "classic": return "Georgia, 'Times New Roman', serif";
    case "bold": return "'Impact', 'Arial Black', sans-serif";
    case "elegant": return "'Didot', 'Bodoni MT', Georgia, serif";
    default: return "Inter, 'Helvetica Neue', Arial, sans-serif";
  }
}

function getFont(w: number, s: number, style: MenuConfig["fontStyle"]): string {
  return `${w} ${s}px ${getFontFamily(style)}`;
}

/* ── Word-wrap helper ──────────────────────────────────────── */

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line + (line ? " " : "") + w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ── Component ─────────────────────────────────────────────── */

export default function MenuDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [editSection, setEditSection] = useState<number>(0);
  const [zoom, setZoom] = useState(1);

  const [config, setConfig] = useState<MenuConfig>({
    foldType: "single",
    pageSize: "a4",
    template: "elegant",
    primaryColor: "#1e293b",
    accentColor: "#c09c2c",
    bgColor: "#fffef8",
    restaurantName: "The Lusaka Kitchen",
    tagline: "A Taste of Zambia",
    currency: "ZMW",
    currencySymbol: "K",
    sections: defaultSections(),
    cuisineDescription: "",
    fontStyle: "elegant",
    patternType: "none",
    showDietaryLegend: true,
  });


  const ps = PAGE_SIZES.find((p) => p.id === config.pageSize)!;
  const fold = FOLD_TYPES.find((f) => f.id === config.foldType)!;
  const upd = useCallback((patch: Partial<MenuConfig>) => setConfig((p) => ({ ...p, ...patch })), []);

  // ── Visual Template Previews ──────────────────────────
  const templatePreviews = useMemo<TemplatePreview[]>(
    () => TEMPLATES.map((t) => ({
      id: t.id,
      label: t.label,
      render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const styles: Record<string, "elegant" | "rustic" | "modern" | "bistro"> = {
          "elegant": "elegant",
          "rustic": "rustic",
          "modern": "modern",
          "bistro": "bistro",
          "fine-dining": "elegant",
          "casual": "modern",
        };
        drawMenuThumbnail(ctx, w, h, {
          primaryColor: config.primaryColor,
          style: styles[t.id] || "elegant",
        });
      },
    })),
    [config.primaryColor, config.accentColor, config.bgColor]
  );

  /* ── Render ─────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const totalW = config.foldType === "single" ? ps.w : ps.w * fold.panels;
    const H = ps.h;
    canvas.width = totalW;
    canvas.height = H;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const pc = config.primaryColor;
    const ac = config.accentColor;
    const fs = config.fontStyle;
    const isDark = config.bgColor.startsWith("#0") || config.bgColor.startsWith("#1");
    const isRustic = config.template === "rustic" || config.template === "bistro";
    const isFine = config.template === "fine-dining" || config.template === "elegant";
    const isModern = config.template === "modern" || config.template === "casual";

    // ─── Background ──────────────────────────────────────
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, totalW, H);

    // Pattern overlay
    if (config.patternType && config.patternType !== "none") {
      drawPattern(
        ctx, 0, 0, totalW, H,
        config.patternType as Parameters<typeof drawPattern>[5],
        pc, 0.025, 30
      );
    }

    // Rustic texture
    if (isRustic && config.patternType === "none") {
      ctx.fillStyle = hexToRgba("#8b7355", 0.03);
      for (let x = 0; x < totalW; x += 20) {
        for (let y = 0; y < H; y += 20) {
          ctx.beginPath();
          ctx.arc(x + Math.random() * 5, y + Math.random() * 5, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Decorative circles
    if (isFine) {
      drawAccentCircle(ctx, totalW * 0.9, H * 0.05, totalW * 0.08, ac, 0.04);
      drawAccentCircle(ctx, totalW * 0.05, H * 0.95, totalW * 0.06, ac, 0.03);
    }

    // ─── Panel fold lines ────────────────────────────────
    if (fold.panels > 1) {
      for (let i = 1; i < fold.panels; i++) {
        const fx = i * ps.w;
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = hexToRgba(pc, 0.15);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx, 0);
        ctx.lineTo(fx, H);
        ctx.stroke();
        ctx.restore();
      }
    }

    // ─── Border ──────────────────────────────────────────
    if (isFine) {
      ctx.strokeStyle = hexToRgba(ac, 0.4);
      ctx.lineWidth = 2;
      ctx.strokeRect(15, 15, totalW - 30, H - 30);
      ctx.strokeStyle = hexToRgba(ac, 0.2);
      ctx.lineWidth = 0.5;
      ctx.strokeRect(20, 20, totalW - 40, H - 40);
      // Corner ornaments
      const corners = [[22, 22], [totalW - 22, 22], [22, H - 22], [totalW - 22, H - 22]];
      corners.forEach(([cx, cy]) => {
        ctx.fillStyle = ac;
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    if (isModern) {
      const topGrad = ctx.createLinearGradient(0, 0, totalW, 0);
      topGrad.addColorStop(0, pc);
      topGrad.addColorStop(1, ac);
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, totalW, 6);
    }

    // ─── Header area ────────────────────────────────────
    const headerW = config.foldType === "single" ? totalW : ps.w;
    const hx = 0;
    let curY = 40;

    if (isModern) {
      // Color block header with gradient
      drawGradient(ctx, hx, 0, headerW, 120, 135, [
        { offset: 0, color: pc },
        { offset: 1, color: hexToRgba(ac, 0.8) },
      ]);
      drawPattern(ctx, hx, 0, headerW, 120, "dots", getContrastColor(pc), 0.04, 20);

      ctx.font = getFont(800, 28, fs);
      ctx.fillStyle = getContrastColor(pc);
      ctx.textAlign = "center";
      drawTextWithShadow(ctx, config.restaurantName.toUpperCase(), hx + headerW / 2, 55, { shadowBlur: 4, shadowColor: "rgba(0,0,0,0.3)" });

      ctx.font = getFont(400, 13, fs);
      ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.7);
      ctx.fillText(config.tagline, hx + headerW / 2, 80);

      // Divider below header
      drawDivider(ctx, hx + headerW * 0.3, 105, headerW * 0.4, "gradient", getContrastColor(pc), 0.3);
      curY = 140;
    } else if (config.template === "bistro") {
      ctx.font = getFont(700, 30, "bold");
      ctx.fillStyle = pc;
      ctx.textAlign = "center";
      drawTextWithShadow(ctx, config.restaurantName, hx + headerW / 2, curY + 25);

      drawDivider(ctx, hx + headerW * 0.25, curY + 40, headerW * 0.5, "ornate", ac, 0.5);

      ctx.font = getFont(400, 12, "classic");
      ctx.fillStyle = isDark ? hexToRgba(pc, 0.6) : "#6b7280";
      ctx.fillText(config.tagline, hx + headerW / 2, curY + 60);
      curY += 80;
    } else {
      // Elegant / Fine Dining / Rustic
      if (isFine) {
        drawDivider(ctx, hx + headerW * 0.2, curY, headerW * 0.6, "diamond", ac, 0.3);
        curY += 15;
      }
      ctx.font = getFont(400, 11, fs);
      ctx.fillStyle = hexToRgba(ac, 0.6);
      ctx.textAlign = "center";
      ctx.fillText(config.tagline, hx + headerW / 2, curY + 5);
      curY += 20;

      ctx.font = getFont(700, 28, fs);
      ctx.fillStyle = pc;
      drawTextWithShadow(ctx, config.restaurantName, hx + headerW / 2, curY + 18);
      curY += 30;

      // Ornate divider with diamond
      drawDivider(ctx, hx + headerW / 2 - 40, curY + 5, 80, "diamond", ac, 0.5);
      curY += 25;
    }

    // ─── Menu Sections ───────────────────────────────────
    const contentW = config.foldType === "single" ? totalW - 60 : ps.w - 40;
    let panelIdx = 0;
    let panelY = curY;
    const maxY = H - 60;
    const textColor = isDark ? hexToRgba(pc, 0.85) : "#1e293b";
    const subTextColor = isDark ? hexToRgba(pc, 0.5) : "#6b7280";

    for (const section of config.sections) {
      if (section.items.length === 0) continue;

      const estHeight = 40 + section.items.length * 55;
      if (panelY + estHeight > maxY && panelIdx < fold.panels - 1) {
        panelIdx++;
        panelY = 40;
      }

      const px = config.foldType === "single" ? 30 : panelIdx * ps.w + 20;

      // Section header
      if (isFine || config.template === "elegant") {
        ctx.font = getFont(400, 10, fs);
        ctx.fillStyle = hexToRgba(ac, 0.5);
        ctx.textAlign = "center";
        ctx.fillText("— " + section.label.toUpperCase() + " —", px + contentW / 2, panelY + 10);
      } else if (isModern) {
        ctx.font = getFont(700, 16, "modern");
        ctx.fillStyle = pc;
        ctx.textAlign = "left";
        ctx.fillText(section.label.toUpperCase(), px, panelY + 12);
        // Accent underline
        const labelW = ctx.measureText(section.label.toUpperCase()).width;
        ctx.fillStyle = ac;
        roundRect(ctx, px, panelY + 18, Math.min(labelW, 30), 3, 1.5);
        ctx.fill();
      } else {
        ctx.font = getFont(700, 15, fs);
        ctx.fillStyle = pc;
        ctx.textAlign = "center";
        ctx.fillText(section.label, px + contentW / 2, panelY + 12);
      }
      panelY += 30;

      // Items
      for (const item of section.items) {
        if (panelY > maxY) break;

        // Name + dot leader + Price
        ctx.font = getFont(600, 12, fs);
        ctx.fillStyle = textColor;
        ctx.textAlign = "left";
        ctx.fillText(item.name, px, panelY + 5, contentW * 0.65);

        const nameW = ctx.measureText(item.name).width;
        const priceText = `${config.currencySymbol}${item.price}`;
        ctx.font = getFont(600, 12, fs);
        const priceW = ctx.measureText(priceText).width;

        // Dot leader
        ctx.fillStyle = hexToRgba(pc, 0.15);
        ctx.font = "400 10px Inter, sans-serif";
        const dotsStart = px + nameW + 8;
        const dotsEnd = px + contentW - priceW - 8;
        if (dotsEnd > dotsStart) {
          let dotX = dotsStart;
          while (dotX < dotsEnd) {
            ctx.fillText("·", dotX, panelY + 5);
            dotX += 6;
          }
        }

        // Price
        ctx.font = getFont(600, 12, fs);
        ctx.fillStyle = ac;
        ctx.textAlign = "right";
        ctx.fillText(priceText, px + contentW, panelY + 5);

        // Description
        if (item.description) {
          ctx.font = getFont(400, 10, fs);
          ctx.fillStyle = subTextColor;
          ctx.textAlign = "left";
          const descLines = wrapText(ctx, item.description, contentW * 0.75);
          descLines.forEach((line, li) => {
            ctx.fillText(line, px, panelY + 20 + li * 14);
          });
          panelY += 14 * (descLines.length - 1);
        }

        // Dietary tags
        if (item.dietary.length > 0) {
          let tagX = px;
          if (item.description) {
            ctx.font = getFont(400, 10, fs);
            tagX = px + Math.min(ctx.measureText(item.description).width + 10, contentW * 0.5);
          }
          ctx.font = "600 8px Inter, sans-serif";
          for (const tag of item.dietary) {
            const dc = DIETARY_LABELS[tag];
            const tw = ctx.measureText(tag).width + 8;
            ctx.fillStyle = hexToRgba(dc.color, 0.15);
            ctx.beginPath();
            ctx.roundRect(tagX, panelY + 12, tw, 14, 3);
            ctx.fill();
            ctx.fillStyle = dc.color;
            ctx.textAlign = "left";
            ctx.fillText(tag, tagX + 4, panelY + 22);
            tagX += tw + 4;
          }
        }

        panelY += 45;
      }

      // Section divider
      if (isFine) {
        drawDivider(ctx, px + contentW * 0.2, panelY - 8, contentW * 0.6, "diamond", ac, 0.15);
      }
      panelY += 15;
    }

    // ─── Footer ──────────────────────────────────────────
    if (config.showDietaryLegend) {
      ctx.font = "400 8px Inter, sans-serif";
      ctx.fillStyle = subTextColor;
      ctx.textAlign = "center";
      ctx.fillText("V = Vegetarian  |  VG = Vegan  |  GF = Gluten Free  |  DF = Dairy Free", totalW / 2, H - 25);
    }
    ctx.font = "400 8px Inter, sans-serif";
    ctx.fillStyle = hexToRgba(subTextColor, 0.6);
    ctx.textAlign = "center";
    ctx.fillText("All prices in " + config.currency + ". Service charge not included.", totalW / 2, H - 12);

    // ─── Decorative footer element ───────────────────────
    if (isFine) {
      drawDivider(ctx, totalW * 0.35, H - 38, totalW * 0.3, "ornate", ac, 0.2);
    }
  }, [config, ps, fold]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = useCallback(async () => {
    if (!config.cuisineDescription.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are an expert restaurant consultant and menu designer. Generate a premium restaurant menu.

Restaurant: "${config.restaurantName}" in Lusaka, Zambia.
Cuisine Description: "${config.cuisineDescription}"
Currency: ${config.currency} (symbol: ${config.currencySymbol})

Return ONLY valid JSON:
{
  "restaurantName": "...",
  "tagline": "...",
  "template": "elegant|rustic|modern|bistro|fine-dining|casual",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "fontStyle": "modern|classic|bold|elegant",
  "pattern": "none|dots|lines|diagonal-lines|crosshatch|waves|diamond",
  "sections": [
    {
      "id": "appetizers|mains|desserts|drinks|specials",
      "label": "Section Name",
      "items": [
        {
          "name": "Dish Name",
          "description": "Brief appetizing description",
          "price": "number only",
          "dietary": ["V","VG","GF","DF"]
        }
      ]
    }
  ]
}

Include 4-5 sections with 2-4 items each. Use realistic Zambian prices (K15-K250). Include traditional Zambian dishes where appropriate. Pick the template and colors that best match the cuisine style.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        const updates: Partial<MenuConfig> = {};
        if (data.sections) {
          updates.sections = data.sections.map((s: Partial<MenuSection>) => ({
            id: s.id || "mains",
            label: s.label || SECTION_LABELS[(s.id as MenuSectionId) || "mains"],
            items: (s.items || []).map((it: Partial<MenuItem>) => ({
              name: it?.name || "",
              description: it?.description || "",
              price: String(it?.price || "0"),
              dietary: (it?.dietary || []) as DietaryTag[],
            })),
          }));
        }
        if (data.restaurantName) updates.restaurantName = data.restaurantName;
        if (data.tagline) updates.tagline = data.tagline;
        if (data.template && TEMPLATES.some((t) => t.id === data.template)) updates.template = data.template;
        if (data.primaryColor?.match(/^#[0-9a-fA-F]{6}$/)) updates.primaryColor = data.primaryColor;
        if (data.accentColor?.match(/^#[0-9a-fA-F]{6}$/)) updates.accentColor = data.accentColor;
        if (data.fontStyle && ["modern", "classic", "bold", "elegant"].includes(data.fontStyle)) updates.fontStyle = data.fontStyle;
        if (data.pattern && patternOptions.some((p) => p.id === data.pattern)) updates.patternType = data.pattern;
        upd(updates);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [config, upd]);

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `menu-${config.restaurantName.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [config.restaurantName]);

  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch { /* ignore */ }
  }, []);

  const handleExportPdf = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const totalW = config.foldType === "single" ? ps.w : ps.w * fold.panels;
    const wMm = totalW / (595 / 210);
    const hMm = ps.h / (842 / 297);
    const pdf = new jsPDF({
      orientation: wMm > hMm ? "l" : "p",
      unit: "mm",
      format: [wMm, hMm],
    });
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, wMm, hMm);
    pdf.save(`menu-${config.restaurantName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }, [config, ps, fold]);

  const addItem = useCallback((secIdx: number) => {
    const sections = [...config.sections];
    sections[secIdx] = {
      ...sections[secIdx],
      items: [...sections[secIdx].items, { name: "New Item", description: "", price: "0", dietary: [] }],
    };
    upd({ sections });
  }, [config.sections, upd]);

  const removeItem = useCallback((secIdx: number, itemIdx: number) => {
    const sections = [...config.sections];
    sections[secIdx] = {
      ...sections[secIdx],
      items: sections[secIdx].items.filter((_, i) => i !== itemIdx),
    };
    upd({ sections });
  }, [config.sections, upd]);

  const updateItem = useCallback((secIdx: number, itemIdx: number, patch: Partial<MenuItem>) => {
    const sections = [...config.sections];
    const items = [...sections[secIdx].items];
    items[itemIdx] = { ...items[itemIdx], ...patch };
    sections[secIdx] = { ...sections[secIdx], items };
    upd({ sections });
  }, [config.sections, upd]);

  const toggleDietary = useCallback((secIdx: number, itemIdx: number, tag: DietaryTag) => {
    const item = config.sections[secIdx].items[itemIdx];
    const dietary = item.dietary.includes(tag)
      ? item.dietary.filter((d) => d !== tag)
      : [...item.dietary, tag];
    updateItem(secIdx, itemIdx, { dietary });
  }, [config.sections, updateItem]);

  const displayW = config.foldType === "single" ? Math.min(ps.w, 500) : Math.min(ps.w * fold.panels, 700);
  const displayH = displayW * (ps.h / (config.foldType === "single" ? ps.w : ps.w * fold.panels));
  const totalItems = config.sections.reduce((a, s) => a + s.items.length, 0);

  /* ── Left Panel ─────────────────────────────────────────── */
  const leftPanel = (
    <div className="space-y-3">
      <Accordion defaultOpen="templates">
      {/* Template Slider */}
      <AccordionSection icon={<IconLayout className="size-3.5" />} label="Templates" id="templates">
        <TemplateSlider
          templates={templatePreviews}
          activeId={config.template}
          onSelect={(id) => upd({ template: id as MenuTemplate })}
          thumbWidth={110}
          thumbHeight={150}
          label=""
        />
      </AccordionSection>

      {/* Restaurant Details */}
      <AccordionSection icon={<IconUtensils className="size-3.5" />} label="Restaurant Details" id="details">
        <div className="space-y-2">
          <input placeholder="Restaurant Name" value={config.restaurantName} onChange={(e) => upd({ restaurantName: e.target.value })}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
          <input placeholder="Tagline" value={config.tagline} onChange={(e) => upd({ tagline: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Fold Type</label>
              <select value={config.foldType} onChange={(e) => upd({ foldType: e.target.value as FoldType })}
                className="w-full h-9 px-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs">
                {FOLD_TYPES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Page Size</label>
              <select value={config.pageSize} onChange={(e) => upd({ pageSize: e.target.value as PageSize })}
                className="w-full h-9 px-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs">
                {PAGE_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Currency</label>
            <select value={config.currency} onChange={(e) => { const c = CURRENCIES.find((x) => x.code === e.target.value); if (c) upd({ currency: c.code, currencySymbol: c.symbol }); }}
              className="w-full h-9 px-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs">
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} — {c.label}</option>)}
            </select>
          </div>
        </div>
      </AccordionSection>

      {/* Menu Items Editor */}
      <AccordionSection icon={<IconType className="size-3.5" />} label={`Menu Items (${totalItems})`} id="items">
        <div className="space-y-2">
          {/* Section tabs */}
          <div className="flex gap-1 flex-wrap">
            {config.sections.map((sec, i) => (
              <button key={sec.id} onClick={() => setEditSection(i)}
                className={`px-2 py-1 rounded-lg text-[0.625rem] font-medium transition-all ${editSection === i ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                {sec.label} ({sec.items.length})
              </button>
            ))}
          </div>

          {/* Items */}
          {config.sections[editSection] && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {config.sections[editSection].items.map((item, ii) => (
                <div key={ii} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-1">
                  <div className="flex gap-1.5">
                    <input className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Name" value={item.name} onChange={(e) => updateItem(editSection, ii, { name: e.target.value })} />
                    <input className="w-14 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white text-center" placeholder="Price" value={item.price} onChange={(e) => updateItem(editSection, ii, { price: e.target.value })} />
                    <button onClick={() => removeItem(editSection, ii)} className="text-gray-400 hover:text-error-400 transition-colors"><IconTrash className="size-3" /></button>
                  </div>
                  <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Description" value={item.description} onChange={(e) => updateItem(editSection, ii, { description: e.target.value })} />
                  <div className="flex gap-1">
                    {(["V", "VG", "GF", "DF"] as DietaryTag[]).map((tag) => (
                      <button key={tag} onClick={() => toggleDietary(editSection, ii, tag)}
                        className={`px-1.5 py-0.5 rounded text-[0.5625rem] font-bold transition-colors ${item.dietary.includes(tag) ? "text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`}
                        style={item.dietary.includes(tag) ? { backgroundColor: DIETARY_LABELS[tag].color } : {}}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => addItem(editSection)} className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-400 transition-colors">
                <IconPlus className="size-3" />Add Item
              </button>
            </div>
          )}
        </div>
      </AccordionSection>

      {/* Style */}
      <AccordionSection icon={<IconDroplet className="size-3.5" />} label="Style" id="style">
        <div className="space-y-3">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400">Color Theme</p>
          <div className="grid grid-cols-5 gap-1.5">
            {colorPresets.map((theme) => (
              <button key={theme.name} onClick={() => upd({ primaryColor: theme.primary, accentColor: theme.accent, bgColor: theme.bg })}
                className={`p-1.5 rounded-lg border text-center transition-all ${config.primaryColor === theme.primary && config.bgColor === theme.bg ? "border-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                <div className="flex gap-0.5 justify-center mb-0.5">
                  <div className="size-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <div className="size-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                </div>
                <span className="text-[0.5rem] text-gray-400">{theme.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {([{ key: "primaryColor", label: "Primary" }, { key: "accentColor", label: "Accent" }, { key: "bgColor", label: "BG" }] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1 cursor-pointer">
                <input type="color" value={config[key]} onChange={(e) => upd({ [key]: e.target.value })} className="size-6 rounded border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent" />
                <span className="text-[0.5625rem] text-gray-400">{label}</span>
              </label>
            ))}
          </div>

          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 pt-1">Typography</p>
          <div className="flex flex-wrap gap-1.5">
            {(["modern", "classic", "bold", "elegant"] as const).map((style) => (
              <button key={style} onClick={() => upd({ fontStyle: style })}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold capitalize transition-all ${config.fontStyle === style ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}
                style={{ fontFamily: getFontFamily(style) }}>
                {style}
              </button>
            ))}
          </div>

          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 pt-1">Pattern</p>
          <div className="flex flex-wrap gap-1">
            {patternOptions.map((p) => (
              <button key={p.id} onClick={() => upd({ patternType: p.id })}
                className={`px-2 py-1 rounded-lg border text-[0.625rem] font-medium transition-all ${config.patternType === p.id ? "border-primary-500 bg-primary-500/5 text-primary-500" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>
                {p.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" checked={config.showDietaryLegend} onChange={(e) => upd({ showDietaryLegend: e.target.checked })}
              className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
            <span className="text-xs text-gray-600 dark:text-gray-300">Show dietary legend</span>
          </label>
        </div>
      </AccordionSection>
      </Accordion>

      {/* AI */}
      <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-2.5">
          <IconSparkles className="size-3.5" />AI Menu Director
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3 py-2 text-xs text-gray-900 dark:text-white resize-none placeholder:text-gray-400 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20"
          rows={3} placeholder="Describe cuisine type and concept (e.g., 'Upscale Zambian fusion with traditional and modern dishes')..."
          value={config.cuisineDescription} onChange={(e) => upd({ cuisineDescription: e.target.value })}
        />
        <button onClick={generateAI} disabled={loading || !config.cuisineDescription.trim()}
          className="w-full mt-2 flex items-center justify-center gap-2 h-10 rounded-xl bg-secondary-500 text-white text-xs font-bold hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? <><IconLoader className="size-3.5 animate-spin" />Designing…</> : <><IconWand className="size-3.5" />Generate Menu</>}
        </button>
        <p className="text-[0.5625rem] text-gray-400 text-center mt-1.5">AI suggests items, colors, template & typography</p>
      </div>
    </div>
  );

  /* ── Right Panel ────────────────────────────────────────── */
  const rightPanel = (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">Export</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={exportPNG} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 transition-colors hover:bg-primary-500/10">
            <IconDownload className="size-4" /><span className="text-xs font-semibold">.png</span>
          </button>
          <button onClick={handleCopy} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10">
            <IconCopy className="size-4" /><span className="text-xs font-semibold">Clipboard</span>
          </button>
          <button onClick={handleExportPdf} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-info-500/30 bg-info-500/5 text-info-500 transition-colors hover:bg-info-500/10">
            <IconPrinter className="size-4" /><span className="text-xs font-semibold">.pdf</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Menu Info</h3>
        <div className="space-y-1 text-xs text-gray-400">
          <p>Template: <span className="text-gray-300 capitalize">{config.template}</span></p>
          <p>Format: <span className="text-gray-300">{fold.label} · {ps.label}</span></p>
          <p>Items: <span className="text-gray-300">{totalItems}</span></p>
          <p>Sections: <span className="text-gray-300">{config.sections.filter((s) => s.items.length > 0).length}</span></p>
          <p>Font: <span className="text-gray-300 capitalize">{config.fontStyle}</span></p>
          <p>Pattern: <span className="text-gray-300 capitalize">{config.patternType}</span></p>
          <p>Currency: <span className="text-gray-300">{config.currencySymbol} ({config.currency})</span></p>
        </div>
      </div>

      {/* Dietary Legend */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Dietary Tags</h3>
        <div className="space-y-1">
          {(Object.entries(DIETARY_LABELS) as [DietaryTag, { label: string; color: string }][]).map(([tag, info]) => (
            <div key={tag} className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[0.5625rem] font-bold text-white" style={{ backgroundColor: info.color }}>{tag}</span>
              <span className="text-xs text-gray-400">{info.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const toolbar = (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-gray-400 capitalize">{config.template}</span>
      <span className="text-gray-600">·</span>
      <span className="text-xs text-gray-500">{fold.label} · {ps.label}</span>
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={displayW}
      displayHeight={displayH}
      label={`${config.template} — ${fold.label} — ${ps.label} — ${totalItems} items`}
      toolbar={toolbar}
      mobileTabs={["Canvas", "Settings"]}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
      onZoomFit={() => setZoom(1)}
      actionsBar={
        <div className="flex items-center gap-2">
          <button onClick={exportPNG} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors">
            <IconDownload className="size-3" />Download PNG
          </button>
          <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors">
            <IconPrinter className="size-3" />PDF
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors">
            <IconCopy className="size-3" />Copy
          </button>
        </div>
      }
    />
  );
}
