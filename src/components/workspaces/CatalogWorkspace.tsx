"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconBox,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
} from "@/components/icons";
import { cleanAIText, roundRect } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type CatalogTemplate = "modern" | "classic" | "grid" | "elegant" | "bold" | "minimal";
type LayoutMode = "grid" | "list";

interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  category: string;
}

interface CatalogConfig {
  template: CatalogTemplate;
  layout: LayoutMode;
  primaryColor: string;
  companyName: string;
  catalogTitle: string;
  currency: string;
  currencySymbol: string;
  activeSection: number;
  description: string;
}

const TEMPLATES: { id: CatalogTemplate; name: string }[] = [
  { id: "modern", name: "Modern" },
  { id: "classic", name: "Classic" },
  { id: "grid", name: "Grid" },
  { id: "elegant", name: "Elegant" },
  { id: "bold", name: "Bold" },
  { id: "minimal", name: "Minimal" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

const PAGE_W = 595;
const PAGE_H = 842;

function uid() { return Math.random().toString(36).slice(2, 10); }

function fmtMoney(amount: number, sym: string): string {
  return `${sym}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function defaultProducts(): CatalogProduct[] {
  return [
    { id: uid(), name: "Premium Widget", description: "High-quality widget for everyday use", price: 250, sku: "WDG-001", category: "Widgets" },
    { id: uid(), name: "Deluxe Gadget", description: "Advanced gadget with smart features", price: 450, sku: "GDG-002", category: "Gadgets" },
    { id: uid(), name: "Basic Tool Set", description: "Essential toolset for beginners", price: 180, sku: "TLS-003", category: "Tools" },
    { id: uid(), name: "Pro Kit Bundle", description: "Complete professional kit bundle", price: 1200, sku: "KIT-004", category: "Bundles" },
    { id: uid(), name: "Smart Device X", description: "Connected smart device with app control", price: 750, sku: "SDV-005", category: "Gadgets" },
    { id: uid(), name: "Eco Package", description: "Environmentally friendly packaging solution", price: 320, sku: "ECO-006", category: "Packaging" },
  ];
}

/* ── Component ─────────────────────────────────────────────── */

export default function CatalogWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  const [config, setConfig] = useState<CatalogConfig>({
    template: "modern",
    layout: "grid",
    primaryColor: "#1e40af",
    companyName: "DMSuite Store",
    catalogTitle: "Product Catalog 2025",
    currency: "ZMW",
    currencySymbol: "K",
    activeSection: 0,
    description: "",
  });

  const [products, setProducts] = useState<CatalogProduct[]>(defaultProducts());

  const categories = [...new Set(products.map((p) => p.category))];
  const productsPerPage = config.layout === "grid" ? 4 : 5;
  const totalPages = 2 + Math.ceil(products.length / productsPerPage);
  const sym = config.currencySymbol;

  /* ── Render ─────────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;

    const W = PAGE_W;
    const H = PAGE_H;
    const pc = config.primaryColor;
    const font = "'Inter', 'Segoe UI', sans-serif";
    const M = 40;
    const CW = W - M * 2;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    if (config.activeSection === 0) {
      /* Cover Page */
      if (config.template === "modern" || config.template === "bold") {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, H * 0.55);
        ctx.fillStyle = "#ffffff08";
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(W * 0.7, H * 0.2 + i * 40, 80 + i * 30, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (config.template === "elegant") {
        ctx.strokeStyle = pc;
        ctx.lineWidth = 2;
        ctx.strokeRect(M - 10, M - 10, CW + 20, H - M * 2 + 20);
      } else {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, 8);
      }

      const isDark = ["modern", "bold"].includes(config.template);

      ctx.fillStyle = isDark ? "#ffffffaa" : "#64748b";
      ctx.font = `600 12px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(config.companyName.toUpperCase(), M, H * 0.2);

      ctx.fillStyle = isDark ? "#ffffff" : "#1e293b";
      ctx.font = `bold 32px ${font}`;
      ctx.fillText(config.catalogTitle, M, H * 0.3, CW);

      ctx.fillStyle = isDark ? "#ffffffcc" : "#64748b";
      ctx.font = `14px ${font}`;
      ctx.fillText(`${products.length} Products • ${categories.length} Categories`, M, H * 0.37);

      /* Category list */
      let cy = H * 0.58;
      ctx.fillStyle = isDark ? "#475569" : "#475569";
      ctx.font = `600 11px ${font}`;
      ctx.fillText("CATEGORIES", M, cy);
      cy += 20;
      ctx.font = `12px ${font}`;
      ctx.fillStyle = "#64748b";
      for (const cat of categories) {
        const count = products.filter((p) => p.category === cat).length;
        ctx.fillText(`• ${cat} (${count} items)`, M + 10, cy);
        cy += 18;
      }

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 6, W, 6);

    } else if (config.activeSection === 1) {
      /* Table of Contents */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 22px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText("Table of Contents", M, M + 30);

      let y = M + 70;
      ctx.font = `12px ${font}`;

      ctx.fillStyle = "#1e293b";
      ctx.fillText("Cover", M + 10, y);
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "right";
      ctx.fillText("1", W - M, y);
      y += 24;

      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        ctx.textAlign = "left";
        ctx.fillStyle = "#1e293b";
        ctx.font = `600 12px ${font}`;
        ctx.fillText(cat, M + 10, y);
        ctx.fillStyle = "#94a3b8";
        ctx.font = `12px ${font}`;
        ctx.textAlign = "right";
        ctx.fillText(String(i + 3), W - M, y);
        y += 24;
      }

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);

    } else {
      /* Product pages */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      /* Page header */
      ctx.fillStyle = "#d1d5db";
      ctx.font = `9px ${font}`;
      ctx.textAlign = "right";
      ctx.fillText(config.catalogTitle, W - M, 24);

      const startIdx = (config.activeSection - 2) * productsPerPage;
      const pageProducts = products.slice(startIdx, startIdx + productsPerPage);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 16px ${font}`;
      ctx.textAlign = "left";
      const firstCat = pageProducts[0]?.category || "Products";
      ctx.fillText(firstCat, M, M + 30);

      if (config.layout === "grid") {
        /* 2x2 grid */
        const cols = 2;
        const gap = 16;
        const cardW = (CW - gap) / cols;
        const cardH = 320;

        pageProducts.forEach((prod, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = M + col * (cardW + gap);
          const y = M + 55 + row * (cardH + gap);

          /* Card bg */
          ctx.fillStyle = "#f8fafc";
          roundRect(ctx, x, y, cardW, cardH, 8);
          ctx.fill();

          /* Image placeholder */
          ctx.fillStyle = pc + "15";
          roundRect(ctx, x + 12, y + 12, cardW - 24, 140, 6);
          ctx.fill();
          ctx.fillStyle = pc + "40";
          ctx.font = `bold 24px ${font}`;
          ctx.textAlign = "center";
          ctx.fillText("📦", x + cardW / 2, y + 90);

          /* Product info */
          ctx.textAlign = "left";
          ctx.fillStyle = "#1e293b";
          ctx.font = `bold 13px ${font}`;
          ctx.fillText(prod.name, x + 12, y + 172, cardW - 24);

          ctx.fillStyle = "#64748b";
          ctx.font = `10px ${font}`;
          ctx.fillText(prod.description, x + 12, y + 190, cardW - 24);

          ctx.fillStyle = "#94a3b8";
          ctx.font = `9px ${font}`;
          ctx.fillText(`SKU: ${prod.sku}`, x + 12, y + 210);

          /* Price */
          ctx.fillStyle = pc;
          ctx.font = `bold 16px ${font}`;
          ctx.fillText(fmtMoney(prod.price, sym), x + 12, y + 240);

          /* Category badge */
          ctx.fillStyle = pc + "15";
          const badgeW = ctx.measureText(prod.category).width + 16;
          roundRect(ctx, x + 12, y + 255, badgeW, 20, 4);
          ctx.fill();
          ctx.fillStyle = pc;
          ctx.font = `9px ${font}`;
          ctx.fillText(prod.category, x + 20, y + 268);
        });
      } else {
        /* List layout */
        let y = M + 60;
        for (const prod of pageProducts) {
          /* Row */
          ctx.fillStyle = "#f8fafc";
          roundRect(ctx, M, y, CW, 70, 6);
          ctx.fill();

          /* Image placeholder */
          ctx.fillStyle = pc + "15";
          roundRect(ctx, M + 8, y + 8, 54, 54, 4);
          ctx.fill();
          ctx.fillStyle = pc + "40";
          ctx.font = `20px ${font}`;
          ctx.textAlign = "center";
          ctx.fillText("📦", M + 35, y + 42);

          /* Info */
          ctx.textAlign = "left";
          ctx.fillStyle = "#1e293b";
          ctx.font = `bold 12px ${font}`;
          ctx.fillText(prod.name, M + 74, y + 24);

          ctx.fillStyle = "#64748b";
          ctx.font = `10px ${font}`;
          ctx.fillText(prod.description, M + 74, y + 40, CW - 200);

          ctx.fillStyle = "#94a3b8";
          ctx.font = `9px ${font}`;
          ctx.fillText(`SKU: ${prod.sku}`, M + 74, y + 56);

          /* Price */
          ctx.fillStyle = pc;
          ctx.font = `bold 14px ${font}`;
          ctx.textAlign = "right";
          ctx.fillText(fmtMoney(prod.price, sym), W - M - 12, y + 38);

          y += 80;
        }
      }

      /* Page footer */
      ctx.fillStyle = "#94a3b8";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1} of ${totalPages}`, W / 2, H - 20);

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);
    }
  }, [config, products, categories, productsPerPage, totalPages, sym]);

  useEffect(() => { render(); }, [render]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = async () => {
    if (!config.description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate a product catalog for: ${config.description}. Company: ${config.companyName}. Currency: ZMW. Return JSON: { "catalogTitle": "", "products": [{ "name": "", "description": "", "price": 0, "sku": "", "category": "" }] }. Include 6-8 products with realistic Zambian Kwacha pricing.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.catalogTitle) setConfig((p) => ({ ...p, catalogTitle: data.catalogTitle }));
        if (data.products) {
          setProducts(data.products.map((p: { name: string; description: string; price: number; sku: string; category: string }) => ({
            id: uid(), name: p.name, description: p.description, price: p.price || 0, sku: p.sku || "", category: p.category || "General",
          })));
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
    link.download = `catalog-page-${config.activeSection + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

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
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconBox className="size-4 text-primary-500" />Catalog Settings</h3>

            <label className="block text-xs text-gray-400">Catalog Title</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.catalogTitle} onChange={(e) => setConfig((p) => ({ ...p, catalogTitle: e.target.value }))} />

            <label className="block text-xs text-gray-400">Company</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.companyName} onChange={(e) => setConfig((p) => ({ ...p, companyName: e.target.value }))} />

            <label className="block text-xs text-gray-400">Layout</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["grid", "list"] as const).map((l) => (
                <button key={l} onClick={() => setConfig((p) => ({ ...p, layout: l }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${config.layout === l ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{l}</button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Template</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setConfig((p) => ({ ...p, template: t.id }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.template === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{t.name}</button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Primary Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2 max-h-56 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Products ({products.length})</h3>
            {products.map((prod, i) => (
              <div key={prod.id} className="space-y-1">
                <div className="flex gap-1">
                  <input className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Name" value={prod.name} onChange={(e) => { const p = [...products]; p[i] = { ...p[i], name: e.target.value }; setProducts(p); }} />
                  <input type="number" className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Price" value={prod.price} onChange={(e) => { const p = [...products]; p[i] = { ...p[i], price: Number(e.target.value) }; setProducts(p); }} />
                  <button onClick={() => setProducts((p) => p.filter((_, j) => j !== i))} className="text-xs text-red-500">×</button>
                </div>
                <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-[10px] text-gray-900 dark:text-white" placeholder="Description" value={prod.description} onChange={(e) => { const p = [...products]; p[i] = { ...p[i], description: e.target.value }; setProducts(p); }} />
              </div>
            ))}
            <button onClick={() => setProducts((p) => [...p, { id: uid(), name: "", description: "", price: 0, sku: `SKU-${String(p.length + 1).padStart(3, "0")}`, category: "General" }])} className="text-xs text-primary-500 hover:underline">+ Add Product</button>
          </div>

          {/* AI Generation */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Catalog Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe your product line (e.g. 'Computer accessories for a Lusaka electronics shop')..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Catalog"}
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
            <canvas ref={canvasRef} style={{ width: Math.min(PAGE_W, 500), height: Math.min(PAGE_W, 500) * (PAGE_H / PAGE_W) }} className="rounded-lg shadow-lg" />
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))} className={`px-3 py-1 rounded-lg text-xs font-medium ${config.activeSection === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>{i + 1}</button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Catalog — Page {config.activeSection + 1} of {totalPages} — {PAGE_W}×{PAGE_H}px</p>
        </div>
      </div>
    </div>
  );
}
