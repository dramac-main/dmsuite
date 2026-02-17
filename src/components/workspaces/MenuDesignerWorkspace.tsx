"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconUtensils,
  IconPlus,
  IconTrash,
} from "@/components/icons";
import { cleanAIText, hexToRgba, getContrastColor } from "@/lib/canvas-utils";

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
  restaurantName: string;
  tagline: string;
  currency: string;
  currencySymbol: string;
  sections: MenuSection[];
  cuisineDescription: string;
  fontStyle: "modern" | "classic" | "bold" | "elegant";
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

const TEMPLATES: { id: MenuTemplate; label: string }[] = [
  { id: "elegant", label: "Elegant" },
  { id: "rustic", label: "Rustic" },
  { id: "modern", label: "Modern" },
  { id: "bistro", label: "Bistro" },
  { id: "fine-dining", label: "Fine Dining" },
  { id: "casual", label: "Casual" },
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

const COLOR_PRESETS = [
  "#1e293b", "#7c2d12", "#14532d", "#1e3a5f",
  "#4a1d96", "#831843", "#713f12", "#0f766e",
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
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");
  const [editSection, setEditSection] = useState<number>(0);

  const [config, setConfig] = useState<MenuConfig>({
    foldType: "single",
    pageSize: "a4",
    template: "elegant",
    primaryColor: "#1e293b",
    accentColor: "#c09c2c",
    restaurantName: "The Lusaka Kitchen",
    tagline: "A Taste of Zambia",
    currency: "ZMW",
    currencySymbol: "K",
    sections: defaultSections(),
    cuisineDescription: "",
    fontStyle: "elegant",
  });

  const ps = PAGE_SIZES.find((p) => p.id === config.pageSize)!;
  const fold = FOLD_TYPES.find((f) => f.id === config.foldType)!;

  /* ── Render ─────────────────────────────────────────────── */
  const render = useCallback(() => {
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
    const isRustic = config.template === "rustic" || config.template === "bistro";
    const isFine = config.template === "fine-dining" || config.template === "elegant";
    const isModern = config.template === "modern" || config.template === "casual";

    // ─── Background ──────────────────────────────────────
    if (isRustic) {
      ctx.fillStyle = "#faf7f0";
    } else if (isFine) {
      ctx.fillStyle = "#fffef8";
    } else {
      ctx.fillStyle = "#ffffff";
    }
    ctx.fillRect(0, 0, totalW, H);

    // Rustic texture dots
    if (isRustic) {
      ctx.fillStyle = hexToRgba("#8b7355", 0.03);
      for (let x = 0; x < totalW; x += 20) {
        for (let y = 0; y < H; y += 20) {
          ctx.beginPath();
          ctx.arc(x + Math.random() * 5, y + Math.random() * 5, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ─── Panel fold lines ────────────────────────────────
    if (fold.panels > 1) {
      for (let i = 1; i < fold.panels; i++) {
        const fx = i * ps.w;
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "#d1d5db";
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
    }
    if (isModern) {
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, totalW, 6);
    }

    // ─── Header area (first panel or top) ────────────────
    const headerW = config.foldType === "single" ? totalW : ps.w;
    const headerPanel = 0;
    const hx = headerPanel * ps.w;
    let curY = 40;

    if (config.template === "modern" || config.template === "casual") {
      // Color block header
      ctx.fillStyle = pc;
      ctx.fillRect(hx, 0, headerW, 120);
      ctx.font = getFont(800, 28, fs);
      ctx.fillStyle = getContrastColor(pc);
      ctx.textAlign = "center";
      ctx.fillText(config.restaurantName.toUpperCase(), hx + headerW / 2, 55);
      ctx.font = getFont(400, 13, fs);
      ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.7);
      ctx.fillText(config.tagline, hx + headerW / 2, 80);
      curY = 140;
    } else if (config.template === "bistro") {
      ctx.font = getFont(700, 30, "bold");
      ctx.fillStyle = pc;
      ctx.textAlign = "center";
      ctx.fillText(config.restaurantName, hx + headerW / 2, curY + 25);
      // Ornamental divider
      ctx.strokeStyle = hexToRgba(ac, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx + headerW * 0.25, curY + 40);
      ctx.lineTo(hx + headerW * 0.75, curY + 40);
      ctx.stroke();
      ctx.font = getFont(400, 12, "classic");
      ctx.fillStyle = "#6b7280";
      ctx.fillText(config.tagline, hx + headerW / 2, curY + 60);
      curY += 80;
    } else {
      // Elegant / Fine Dining / Rustic
      if (isFine) {
        // Decorative line above
        ctx.strokeStyle = hexToRgba(ac, 0.3);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(hx + headerW * 0.2, curY);
        ctx.lineTo(hx + headerW * 0.8, curY);
        ctx.stroke();
        curY += 15;
      }
      ctx.font = getFont(400, 11, fs);
      ctx.fillStyle = hexToRgba(ac, 0.6);
      ctx.textAlign = "center";
      ctx.fillText(config.tagline, hx + headerW / 2, curY + 5);
      curY += 20;
      ctx.font = getFont(700, 28, fs);
      ctx.fillStyle = pc;
      ctx.fillText(config.restaurantName, hx + headerW / 2, curY + 18);
      curY += 30;
      // Decorative divider
      ctx.fillStyle = ac;
      ctx.fillRect(hx + headerW / 2 - 40, curY + 5, 80, 1.5);
      // Diamond
      ctx.save();
      ctx.translate(hx + headerW / 2, curY + 6);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
      curY += 25;
    }

    // ─── Menu Sections ───────────────────────────────────
    const contentW = config.foldType === "single" ? totalW - 60 : ps.w - 40;
    let panelIdx = 0;
    let panelY = curY;
    const maxY = H - 60;

    for (const section of config.sections) {
      if (section.items.length === 0) continue;

      // Check if we need to move to next panel
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
        ctx.fillStyle = pc;
        ctx.fillRect(px, panelY + 18, 30, 3);
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

        // Name + Price
        ctx.font = getFont(600, 12, fs);
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "left";
        const nameText = item.name;
        ctx.fillText(nameText, px, panelY + 5, contentW * 0.65);

        // Dot leader
        const nameW = ctx.measureText(nameText).width;
        const priceText = `${config.currencySymbol}${item.price}`;
        ctx.font = getFont(600, 12, fs);
        const priceW = ctx.measureText(priceText).width;

        ctx.fillStyle = "#d1d5db";
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
          ctx.fillStyle = "#6b7280";
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
          if (item.description) tagX = px + ctx.measureText(item.description).width + 10;
          else tagX = px;

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

      panelY += 15;
    }

    // ─── Footer ──────────────────────────────────────────
    ctx.font = "400 8px Inter, sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.fillText("V = Vegetarian  |  VG = Vegan  |  GF = Gluten Free  |  DF = Dairy Free", totalW / 2, H - 25);
    ctx.fillText("All prices in " + config.currency + ". Service charge not included.", totalW / 2, H - 12);
  }, [config, ps, fold]);

  useEffect(() => { render(); }, [render]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = async () => {
    if (!config.cuisineDescription.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate a restaurant menu for: "${config.cuisineDescription}". Restaurant: "${config.restaurantName}" in Lusaka, Zambia. Currency: ${config.currency} (symbol: ${config.currencySymbol}). Return JSON only: { "restaurantName": "...", "tagline": "...", "sections": [{ "id": "appetizers|mains|desserts|drinks|specials", "label": "...", "items": [{ "name": "...", "description": "...", "price": "number only", "dietary": ["V"|"VG"|"GF"|"DF"] }] }] }. Include 4-5 sections with 2-4 items each. Use realistic Zambian prices (K15-K250). Include some traditional Zambian dishes.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.sections) {
          setConfig((p) => ({
            ...p,
            restaurantName: data.restaurantName || p.restaurantName,
            tagline: data.tagline || p.tagline,
            sections: data.sections.map((s: Partial<MenuSection>) => ({
              id: s.id || "mains",
              label: s.label || SECTION_LABELS[(s.id as MenuSectionId) || "mains"],
              items: (s.items || []).map((it: Partial<MenuItem>) => ({
                name: it?.name || "",
                description: it?.description || "",
                price: String(it?.price || "0"),
                dietary: (it?.dietary || []) as DietaryTag[],
              })),
            })),
          }));
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `menu-${config.restaurantName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const upd = (patch: Partial<MenuConfig>) => setConfig((p) => ({ ...p, ...patch }));

  const addItem = (secIdx: number) => {
    const sections = [...config.sections];
    sections[secIdx] = {
      ...sections[secIdx],
      items: [...sections[secIdx].items, { name: "New Item", description: "", price: "0", dietary: [] }],
    };
    upd({ sections });
  };

  const removeItem = (secIdx: number, itemIdx: number) => {
    const sections = [...config.sections];
    sections[secIdx] = {
      ...sections[secIdx],
      items: sections[secIdx].items.filter((_, i) => i !== itemIdx),
    };
    upd({ sections });
  };

  const updateItem = (secIdx: number, itemIdx: number, patch: Partial<MenuItem>) => {
    const sections = [...config.sections];
    const items = [...sections[secIdx].items];
    items[itemIdx] = { ...items[itemIdx], ...patch };
    sections[secIdx] = { ...sections[secIdx], items };
    upd({ sections });
  };

  const toggleDietary = (secIdx: number, itemIdx: number, tag: DietaryTag) => {
    const item = config.sections[secIdx].items[itemIdx];
    const dietary = item.dietary.includes(tag)
      ? item.dietary.filter((d) => d !== tag)
      : [...item.dietary, tag];
    updateItem(secIdx, itemIdx, { dietary });
  };

  const displayW = config.foldType === "single" ? ps.w : ps.w * fold.panels;

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["canvas", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          {/* General */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconUtensils className="size-4 text-primary-500" />Menu Settings</h3>

            <label className="block text-xs text-gray-400">Restaurant Name</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.restaurantName} onChange={(e) => upd({ restaurantName: e.target.value })} />

            <label className="block text-xs text-gray-400">Tagline</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.tagline} onChange={(e) => upd({ tagline: e.target.value })} />

            <label className="block text-xs text-gray-400">Fold Type</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.foldType} onChange={(e) => upd({ foldType: e.target.value as FoldType })}>
              {FOLD_TYPES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>

            <label className="block text-xs text-gray-400">Page Size</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.pageSize} onChange={(e) => upd({ pageSize: e.target.value as PageSize })}>
              {PAGE_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.w}×{s.h})</option>)}
            </select>

            <label className="block text-xs text-gray-400">Template</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => upd({ template: t.id })} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.template === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{t.label}</button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Currency</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.currency} onChange={(e) => { const c = CURRENCIES.find((x) => x.code === e.target.value); if (c) upd({ currency: c.code, currencySymbol: c.symbol }); }}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} — {c.label}</option>)}
            </select>

            <label className="block text-xs text-gray-400">Colors</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => upd({ primaryColor: c })} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">Primary</label><input type="color" value={config.primaryColor} onChange={(e) => upd({ primaryColor: e.target.value })} className="w-full h-7 rounded cursor-pointer" /></div>
              <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">Accent</label><input type="color" value={config.accentColor} onChange={(e) => upd({ accentColor: e.target.value })} className="w-full h-7 rounded cursor-pointer" /></div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Menu Items</h3>
            {/* Section tabs */}
            <div className="flex gap-1 flex-wrap">
              {config.sections.map((sec, i) => (
                <button key={sec.id} onClick={() => setEditSection(i)} className={`px-2 py-1 rounded-lg text-xs font-medium ${editSection === i ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>{sec.label} ({sec.items.length})</button>
              ))}
            </div>

            {/* Items for selected section */}
            {config.sections[editSection] && (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {config.sections[editSection].items.map((item, ii) => (
                  <div key={ii} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-1.5">
                    <div className="flex gap-1.5">
                      <input className="flex-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Name" value={item.name} onChange={(e) => updateItem(editSection, ii, { name: e.target.value })} />
                      <input className="w-16 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Price" value={item.price} onChange={(e) => updateItem(editSection, ii, { price: e.target.value })} />
                      <button onClick={() => removeItem(editSection, ii)} className="text-gray-500 hover:text-red-400"><IconTrash className="size-3" /></button>
                    </div>
                    <input className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Description" value={item.description} onChange={(e) => updateItem(editSection, ii, { description: e.target.value })} />
                    <div className="flex gap-1">
                      {(["V", "VG", "GF", "DF"] as DietaryTag[]).map((tag) => (
                        <button key={tag} onClick={() => toggleDietary(editSection, ii, tag)} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${item.dietary.includes(tag) ? "text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`} style={item.dietary.includes(tag) ? { backgroundColor: DIETARY_LABELS[tag].color } : {}}>{tag}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => addItem(editSection)} className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-400"><IconPlus className="size-3" />Add Item</button>
              </div>
            )}
          </div>

          {/* AI */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Menu Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the cuisine type and restaurant concept (e.g., 'Upscale Zambian fusion restaurant with traditional and modern dishes')..." value={config.cuisineDescription} onChange={(e) => upd({ cuisineDescription: e.target.value })} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Menu"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button onClick={exportPNG} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><IconDownload className="size-4" />Export PNG</button>
          </div>
        </div>

        {/* Canvas */}
        <div className={`flex-1 min-w-0 ${mobileTab !== "canvas" ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 overflow-auto">
            <canvas ref={canvasRef} style={{ width: Math.min(displayW, 700), height: Math.min(displayW, 700) * (ps.h / displayW) }} className="rounded-lg shadow-lg" />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">{config.template} — {fold.label} — {ps.label} — {config.sections.reduce((a, s) => a + s.items.length, 0)} items</p>
        </div>
      </div>
    </div>
  );
}
