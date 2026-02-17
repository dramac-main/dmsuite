"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconBookOpen,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
} from "@/components/icons";
import { cleanAIText, roundRect } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type SalesBookTemplate = "compact" | "modern" | "clean" | "vibrant" | "mono" | "professional";
type PageType = "cover" | "intro" | "product" | "features" | "testimonials" | "pricing" | "contact" | "back-cover";

interface SalesBookPage {
  id: string;
  type: PageType;
  title: string;
  content: string;
}

interface SalesBookConfig {
  template: SalesBookTemplate;
  primaryColor: string;
  companyName: string;
  bookTitle: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  activeSection: number;
  description: string;
}

const TEMPLATES: { id: SalesBookTemplate; name: string }[] = [
  { id: "compact", name: "Compact" },
  { id: "modern", name: "Modern" },
  { id: "clean", name: "Clean" },
  { id: "vibrant", name: "Vibrant" },
  { id: "mono", name: "Mono" },
  { id: "professional", name: "Professional" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

const PAGE_W = 420;
const PAGE_H = 595;

function uid() { return Math.random().toString(36).slice(2, 10); }

function defaultPages(): SalesBookPage[] {
  return [
    { id: uid(), type: "cover", title: "Cover", content: "" },
    { id: uid(), type: "intro", title: "About Us", content: "A leading Zambian solutions provider committed to excellence, innovation, and local expertise." },
    { id: uid(), type: "product", title: "Our Solutions", content: "We deliver tailored products and services designed for the Zambian market. Quality and value guaranteed." },
    { id: uid(), type: "features", title: "Why Choose Us", content: "Local expertise • 24/7 Support • Custom solutions • Competitive pricing • Fast delivery" },
    { id: uid(), type: "testimonials", title: "Client Stories", content: "\"Exceptional service!\" — John M., Lusaka\n\"Highly recommended.\" — Sarah K., Ndola" },
    { id: uid(), type: "pricing", title: "Packages", content: "Starter: K3,000/mo\nPro: K8,000/mo\nEnterprise: K18,000/mo" },
    { id: uid(), type: "contact", title: "Contact Us", content: "" },
    { id: uid(), type: "back-cover", title: "Back Cover", content: "" },
  ];
}

/* ── Component ─────────────────────────────────────────────── */

export default function SalesBookA5Workspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  const [config, setConfig] = useState<SalesBookConfig>({
    template: "compact",
    primaryColor: "#0f766e",
    companyName: "DMSuite Solutions",
    bookTitle: "Company Profile",
    tagline: "Empowering Zambian Businesses",
    phone: "+260 977 123 456",
    email: "info@dmsuite.com",
    address: "Plot 123, Cairo Road, Lusaka",
    activeSection: 0,
    description: "",
  });

  const [pages, setPages] = useState<SalesBookPage[]>(defaultPages());

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
    const M = 30;
    const CW = W - M * 2;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const page = pages[config.activeSection];
    if (!page) return;

    function wrapText(text: string, x: number, y: number, mw: number, lh: number): number {
      const lines = text.split("\n");
      let cy = y;
      for (const ln of lines) {
        const words = ln.split(" ");
        let line = "";
        for (const word of words) {
          const test = line + word + " ";
          if (ctx.measureText(test).width > mw && line) {
            if (cy > H - M) return cy;
            ctx.fillText(line.trim(), x, cy, mw);
            line = word + " ";
            cy += lh;
          } else { line = test; }
        }
        if (cy <= H - M) ctx.fillText(line.trim(), x, cy, mw);
        cy += lh;
      }
      return cy;
    }

    if (page.type === "cover") {
      if (config.template === "compact" || config.template === "modern") {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, H * 0.5);
      } else if (config.template === "vibrant") {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, pc);
        grad.addColorStop(1, "#7c3aed");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      } else if (config.template === "mono") {
        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = pc;
        ctx.fillRect(M, H * 0.42, CW, 3);
      } else {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, 8);
      }

      const isDark = ["compact", "modern", "vibrant", "mono"].includes(config.template);

      ctx.fillStyle = isDark ? "#ffffffaa" : "#64748b";
      ctx.font = `600 10px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(config.companyName.toUpperCase(), M, H * 0.18);

      ctx.fillStyle = isDark ? "#ffffff" : "#1e293b";
      ctx.font = `bold 22px ${font}`;
      ctx.fillText(config.bookTitle, M, H * 0.28, CW);

      ctx.fillStyle = isDark ? "#ffffffbb" : pc;
      ctx.font = `italic 11px ${font}`;
      ctx.fillText(config.tagline, M, H * 0.34);

      /* Contact */
      const infoY = isDark && config.template !== "vibrant" ? H * 0.58 : H * 0.58;
      ctx.fillStyle = isDark && config.template === "vibrant" ? "#ffffffcc" : "#475569";
      ctx.font = `10px ${font}`;
      ctx.fillText(config.phone, M, infoY);
      ctx.fillText(config.email, M, infoY + 14);
      ctx.fillText(config.address, M, infoY + 28);

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);

    } else if (page.type === "back-cover") {
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 20px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(config.companyName, W / 2, H * 0.4);

      ctx.fillStyle = "#ffffffaa";
      ctx.font = `11px ${font}`;
      ctx.fillText(config.tagline, W / 2, H * 0.46);
      ctx.fillText(config.phone, W / 2, H * 0.54);
      ctx.fillText(config.email, W / 2, H * 0.57);

    } else if (page.type === "contact") {
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 4);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 18px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText("Contact Us", M, M + 30);

      let y = M + 60;
      const items = [
        { label: "Phone", value: config.phone },
        { label: "Email", value: config.email },
        { label: "Address", value: config.address },
      ];

      for (const item of items) {
        ctx.fillStyle = pc + "10";
        roundRect(ctx, M, y, CW, 50, 6);
        ctx.fill();

        ctx.fillStyle = pc;
        ctx.font = `600 9px ${font}`;
        ctx.textAlign = "left";
        ctx.fillText(item.label.toUpperCase(), M + 12, y + 20);

        ctx.fillStyle = "#1e293b";
        ctx.font = `11px ${font}`;
        ctx.fillText(item.value, M + 12, y + 36);

        y += 60;
      }

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);

    } else if (page.type === "features") {
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 4);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 18px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(page.title, M, M + 30);

      const features = page.content.split("•").map((f) => f.trim()).filter(Boolean);
      let y = M + 60;

      for (const feat of features) {
        ctx.fillStyle = pc + "08";
        roundRect(ctx, M, y, CW, 40, 6);
        ctx.fill();

        ctx.fillStyle = pc;
        ctx.font = `bold 14px ${font}`;
        ctx.textAlign = "left";
        ctx.fillText("✓", M + 10, y + 26);

        ctx.fillStyle = "#1e293b";
        ctx.font = `11px ${font}`;
        ctx.fillText(feat, M + 30, y + 26, CW - 44);

        y += 48;
        if (y > H - M - 20) break;
      }

      ctx.fillStyle = "#94a3b8";
      ctx.font = `9px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1}`, W / 2, H - 14);
      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);

    } else {
      /* Generic content */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 4);

      ctx.fillStyle = "#d1d5db";
      ctx.font = `8px ${font}`;
      ctx.textAlign = "right";
      ctx.fillText(config.bookTitle, W - M, 18);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 18px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(page.title, M, M + 30);

      ctx.strokeStyle = pc;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(M, M + 38);
      ctx.lineTo(M + 40, M + 38);
      ctx.stroke();

      /* Image placeholder */
      ctx.fillStyle = pc + "08";
      roundRect(ctx, M, M + 50, CW, 100, 6);
      ctx.fill();
      ctx.fillStyle = pc + "20";
      ctx.font = `28px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("📋", W / 2, M + 108);

      /* Content (compact) */
      ctx.fillStyle = "#475569";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "left";
      wrapText(page.content, M, M + 176, CW, 15);

      ctx.fillStyle = "#94a3b8";
      ctx.font = `9px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1}`, W / 2, H - 14);
      ctx.textAlign = "left";
      ctx.fillText(config.companyName, M, H - 14);
      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);
    }
  }, [config, pages]);

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
            content: `Generate compact A5 sales book content for: ${config.description}. Company: ${config.companyName}. Lusaka, Zambia. Keep text concise for A5 format. Return JSON: { "bookTitle": "", "tagline": "", "pages": [{ "type": "intro|product|features|testimonials|pricing", "title": "", "content": "" }] }`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.bookTitle) setConfig((p) => ({ ...p, bookTitle: data.bookTitle, tagline: data.tagline || p.tagline }));
        if (data.pages) {
          setPages((prev) => {
            const updated = [...prev];
            for (const dp of data.pages) {
              const idx = updated.findIndex((p) => p.type === dp.type);
              if (idx >= 0) {
                updated[idx] = { ...updated[idx], title: dp.title || updated[idx].title, content: dp.content || updated[idx].content };
              }
            }
            return updated;
          });
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
    link.download = `salesbook-a5-page-${config.activeSection + 1}.png`;
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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconBookOpen className="size-4 text-primary-500" />Sales Book (A5)</h3>

            <label className="block text-xs text-gray-400">Book Title</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.bookTitle} onChange={(e) => setConfig((p) => ({ ...p, bookTitle: e.target.value }))} />

            <label className="block text-xs text-gray-400">Tagline</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.tagline} onChange={(e) => setConfig((p) => ({ ...p, tagline: e.target.value }))} />

            <label className="block text-xs text-gray-400">Company</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.companyName} onChange={(e) => setConfig((p) => ({ ...p, companyName: e.target.value }))} />

            <label className="block text-xs text-gray-400">Phone</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.phone} onChange={(e) => setConfig((p) => ({ ...p, phone: e.target.value }))} />

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

          {/* Pages */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2 max-h-48 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pages ({pages.length})</h3>
            {pages.map((pg, i) => (
              <button key={pg.id} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${config.activeSection === i ? "bg-primary-500/10 text-primary-500 font-semibold" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                {i + 1}. {pg.title}
              </button>
            ))}
          </div>

          {/* Content Editor */}
          {pages[config.activeSection] && !["cover", "back-cover", "contact"].includes(pages[config.activeSection].type) && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
              <label className="block text-xs text-gray-400">{pages[config.activeSection].title}</label>
              <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} value={pages[config.activeSection].content} onChange={(e) => { const p = [...pages]; p[config.activeSection] = { ...p[config.activeSection], content: e.target.value }; setPages(p); }} />
            </div>
          )}

          {/* AI Generation */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Content Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the company/product..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Content"}
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
            <canvas ref={canvasRef} style={{ width: Math.min(PAGE_W, 400), height: Math.min(PAGE_W, 400) * (PAGE_H / PAGE_W) }} className="rounded-lg shadow-lg" />
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {pages.map((pg, i) => (
              <button key={pg.id} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))} className={`px-3 py-1 rounded-lg text-xs font-medium ${config.activeSection === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>{i + 1}</button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Sales Book A5 — {pages[config.activeSection]?.title} — {PAGE_W}×{PAGE_H}px</p>
        </div>
      </div>
    </div>
  );
}
