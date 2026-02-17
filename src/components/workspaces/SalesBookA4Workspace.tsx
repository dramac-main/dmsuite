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

type SalesBookTemplate = "corporate" | "creative" | "tech" | "luxury" | "startup" | "professional";
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
  website: string;
  activeSection: number;
  description: string;
}

const TEMPLATES: { id: SalesBookTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" },
  { id: "creative", name: "Creative" },
  { id: "tech", name: "Tech" },
  { id: "luxury", name: "Luxury" },
  { id: "startup", name: "Startup" },
  { id: "professional", name: "Professional" },
];

const PAGE_TYPES: { id: PageType; name: string }[] = [
  { id: "cover", name: "Cover" },
  { id: "intro", name: "Introduction" },
  { id: "product", name: "Product" },
  { id: "features", name: "Features" },
  { id: "testimonials", name: "Testimonials" },
  { id: "pricing", name: "Pricing" },
  { id: "contact", name: "Contact" },
  { id: "back-cover", name: "Back Cover" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

const PAGE_W = 595;
const PAGE_H = 842;

function uid() { return Math.random().toString(36).slice(2, 10); }

function defaultPages(): SalesBookPage[] {
  return [
    { id: uid(), type: "cover", title: "Cover", content: "" },
    { id: uid(), type: "intro", title: "About Us", content: "We are a leading solutions provider in Zambia, committed to delivering excellence. Our team of experts brings years of experience to every project." },
    { id: uid(), type: "product", title: "Our Solutions", content: "We offer a comprehensive range of products and services designed to meet your unique needs. Each solution is tailored for maximum impact and value." },
    { id: uid(), type: "features", title: "Key Features", content: "Innovation • Reliability • Scalability • 24/7 Support • Custom Solutions • Local Expertise" },
    { id: uid(), type: "testimonials", title: "What Our Clients Say", content: "\"Outstanding service and delivery. Highly recommended.\" — John M., Lusaka\n\n\"Transformed our business operations completely.\" — Sarah K., Ndola\n\n\"Professional team with excellent local knowledge.\" — David C., Kitwe" },
    { id: uid(), type: "pricing", title: "Our Packages", content: "Starter: K5,000/mo • Professional: K12,000/mo • Enterprise: K25,000/mo" },
    { id: uid(), type: "contact", title: "Get In Touch", content: "" },
    { id: uid(), type: "back-cover", title: "Back Cover", content: "" },
  ];
}

/* ── Component ─────────────────────────────────────────────── */

export default function SalesBookA4Workspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  const [config, setConfig] = useState<SalesBookConfig>({
    template: "corporate",
    primaryColor: "#1e40af",
    companyName: "DMSuite Solutions",
    bookTitle: "Company Profile & Services",
    tagline: "Empowering Zambian Businesses",
    phone: "+260 977 123 456",
    email: "info@dmsuite.com",
    address: "Plot 123, Cairo Road, Lusaka, Zambia",
    website: "www.dmsuite.com",
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
    const M = 50;
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
      /* Cover */
      if (config.template === "corporate") {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, H * 0.55);
        ctx.fillStyle = "#ffffff08";
        ctx.beginPath();
        ctx.arc(W - 60, H * 0.35, 140, 0, Math.PI * 2);
        ctx.fill();
      } else if (config.template === "creative") {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, pc);
        grad.addColorStop(0.6, "#7c3aed");
        grad.addColorStop(1, "#0f172a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      } else if (config.template === "luxury") {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = pc + "40";
        ctx.lineWidth = 1;
        ctx.strokeRect(M - 15, M - 15, CW + 30, H - M * 2 + 30);
      } else if (config.template === "tech") {
        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, W, H);
        /* Grid pattern */
        ctx.strokeStyle = "#ffffff08";
        ctx.lineWidth = 1;
        for (let gx = 0; gx < W; gx += 40) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, H);
          ctx.stroke();
        }
        for (let gy = 0; gy < H; gy += 40) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, 10);
      }

      const isDark = ["corporate", "creative", "luxury", "tech"].includes(config.template);

      ctx.fillStyle = isDark ? "#ffffffaa" : "#64748b";
      ctx.font = `600 12px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(config.companyName.toUpperCase(), M, H * 0.2);

      ctx.fillStyle = isDark ? "#ffffff" : "#1e293b";
      ctx.font = `bold 34px ${font}`;
      ctx.fillText(config.bookTitle, M, H * 0.3, CW);

      ctx.fillStyle = isDark ? "#ffffffcc" : pc;
      ctx.font = `italic 16px ${font}`;
      ctx.fillText(config.tagline, M, H * 0.37);

      /* Contact bar at bottom */
      const barY = H - 80;
      ctx.fillStyle = isDark ? "#ffffff15" : pc + "08";
      ctx.fillRect(0, barY, W, 80);

      ctx.fillStyle = isDark ? "#ffffffcc" : "#475569";
      ctx.font = `11px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`${config.phone}  •  ${config.email}  •  ${config.website}`, W / 2, barY + 35);

    } else if (page.type === "back-cover") {
      /* Back cover */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 28px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(config.companyName, W / 2, H * 0.4);

      ctx.fillStyle = "#ffffffaa";
      ctx.font = `14px ${font}`;
      ctx.fillText(config.tagline, W / 2, H * 0.47);

      ctx.fillStyle = "#ffffffcc";
      ctx.font = `12px ${font}`;
      ctx.fillText(config.phone, W / 2, H * 0.56);
      ctx.fillText(config.email, W / 2, H * 0.59);
      ctx.fillText(config.website, W / 2, H * 0.62);
      ctx.fillText(config.address, W / 2, H * 0.65);

    } else if (page.type === "contact") {
      /* Contact page */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 24px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText("Get In Touch", M, M + 40);

      ctx.strokeStyle = pc;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(M, M + 52);
      ctx.lineTo(M + 80, M + 52);
      ctx.stroke();

      let y = M + 90;
      const contactItems = [
        { label: "Phone", value: config.phone },
        { label: "Email", value: config.email },
        { label: "Website", value: config.website },
        { label: "Address", value: config.address },
      ];

      for (const item of contactItems) {
        ctx.fillStyle = pc + "10";
        roundRect(ctx, M, y, CW, 60, 8);
        ctx.fill();

        ctx.fillStyle = pc;
        ctx.font = `600 11px ${font}`;
        ctx.textAlign = "left";
        ctx.fillText(item.label.toUpperCase(), M + 16, y + 24);

        ctx.fillStyle = "#1e293b";
        ctx.font = `14px ${font}`;
        ctx.fillText(item.value, M + 16, y + 44);

        y += 74;
      }

      /* Map placeholder */
      y += 10;
      ctx.fillStyle = "#f1f5f9";
      roundRect(ctx, M, y, CW, 180, 8);
      ctx.fill();
      ctx.fillStyle = "#94a3b8";
      ctx.font = `14px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("📍 Map — " + config.address, W / 2, y + 95);

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);

    } else if (page.type === "features") {
      /* Features page */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 24px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(page.title, M, M + 40);

      const features = page.content.split("•").map((f) => f.trim()).filter(Boolean);
      let y = M + 80;
      const cols = 2;
      const colW = CW / cols;

      features.forEach((feat, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = M + col * colW;
        const fy = y + row * 110;

        ctx.fillStyle = pc + "08";
        roundRect(ctx, x + 4, fy, colW - 16, 90, 8);
        ctx.fill();

        ctx.fillStyle = pc;
        ctx.font = `bold 20px ${font}`;
        ctx.textAlign = "center";
        ctx.fillText("✓", x + 30, fy + 40);

        ctx.fillStyle = "#1e293b";
        ctx.font = `bold 13px ${font}`;
        ctx.textAlign = "left";
        ctx.fillText(feat, x + 50, fy + 38, colW - 70);
      });

      ctx.fillStyle = "#94a3b8";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1} of ${pages.length}`, W / 2, H - 20);
      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);

    } else {
      /* Generic content page (intro, product, testimonials, pricing) */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      /* Running header */
      ctx.fillStyle = "#d1d5db";
      ctx.font = `9px ${font}`;
      ctx.textAlign = "right";
      ctx.fillText(config.bookTitle, W - M, 24);

      /* Section title */
      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 24px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(page.title, M, M + 40);

      ctx.strokeStyle = pc;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(M, M + 52);
      ctx.lineTo(M + 60, M + 52);
      ctx.stroke();

      /* Decorative image placeholder */
      ctx.fillStyle = pc + "08";
      roundRect(ctx, M, M + 70, CW, 160, 8);
      ctx.fill();
      ctx.fillStyle = pc + "25";
      ctx.font = `40px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("📋", W / 2, M + 160);

      /* Content */
      ctx.fillStyle = "#475569";
      ctx.font = `12px ${font}`;
      ctx.textAlign = "left";
      wrapText(page.content, M, M + 260, CW, 20);

      /* Footer */
      ctx.fillStyle = "#94a3b8";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1} of ${pages.length}`, W / 2, H - 20);
      ctx.textAlign = "left";
      ctx.fillText(config.companyName, M, H - 20);

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
            content: `Generate sales book content for: ${config.description}. Company: ${config.companyName}. Based in Lusaka, Zambia. Return JSON: { "bookTitle": "", "tagline": "", "pages": [{ "type": "intro|product|features|testimonials|pricing|contact", "title": "", "content": "" }] }`,
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
    link.download = `salesbook-a4-page-${config.activeSection + 1}.png`;
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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconBookOpen className="size-4 text-primary-500" />Sales Book (A4)</h3>

            <label className="block text-xs text-gray-400">Book Title</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.bookTitle} onChange={(e) => setConfig((p) => ({ ...p, bookTitle: e.target.value }))} />

            <label className="block text-xs text-gray-400">Tagline</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.tagline} onChange={(e) => setConfig((p) => ({ ...p, tagline: e.target.value }))} />

            <label className="block text-xs text-gray-400">Company</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.companyName} onChange={(e) => setConfig((p) => ({ ...p, companyName: e.target.value }))} />

            <label className="block text-xs text-gray-400">Phone</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.phone} onChange={(e) => setConfig((p) => ({ ...p, phone: e.target.value }))} />

            <label className="block text-xs text-gray-400">Email</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.email} onChange={(e) => setConfig((p) => ({ ...p, email: e.target.value }))} />

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
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2 max-h-52 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pages ({pages.length})</h3>
            {pages.map((pg, i) => (
              <button key={pg.id} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${config.activeSection === i ? "bg-primary-500/10 text-primary-500 font-semibold" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                {i + 1}. {pg.title}
              </button>
            ))}
            <div className="flex gap-1">
              <select className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" id="addPageType">
                {PAGE_TYPES.filter((pt) => !["cover", "back-cover"].includes(pt.id)).map((pt) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
              <button onClick={() => {
                const sel = (document.getElementById("addPageType") as HTMLSelectElement)?.value as PageType;
                setPages((p) => [...p.slice(0, -1), { id: uid(), type: sel, title: PAGE_TYPES.find((pt) => pt.id === sel)?.name || sel, content: "" }, p[p.length - 1]]);
              }} className="px-2 py-1 text-xs text-primary-500 hover:underline">+ Add</button>
            </div>
          </div>

          {/* Content Editor */}
          {pages[config.activeSection] && !["cover", "back-cover"].includes(pages[config.activeSection].type) && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
              <label className="block text-xs text-gray-400">{pages[config.activeSection].title} Content</label>
              <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={4} value={pages[config.activeSection].content} onChange={(e) => { const p = [...pages]; p[config.activeSection] = { ...p[config.activeSection], content: e.target.value }; setPages(p); }} />
            </div>
          )}

          {/* AI Generation */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Content Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the company/product for the sales book..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
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
            <canvas ref={canvasRef} style={{ width: Math.min(PAGE_W, 500), height: Math.min(PAGE_W, 500) * (PAGE_H / PAGE_W) }} className="rounded-lg shadow-lg" />
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {pages.map((pg, i) => (
              <button key={pg.id} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))} className={`px-3 py-1 rounded-lg text-xs font-medium ${config.activeSection === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>{i + 1}</button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Sales Book A4 — {pages[config.activeSection]?.title} — {PAGE_W}×{PAGE_H}px</p>
        </div>
      </div>
    </div>
  );
}
