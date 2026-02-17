"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconBookOpen,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
} from "@/components/icons";
import { cleanAIText, roundRect } from "@/lib/canvas-utils";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";

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

  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch { /* ignore */ }
  }, []);

  /* ── Zoom & Display ─────────────────────────────────────── */
  const [zoom, setZoom] = useState(0.75);
  const displayWidth = PAGE_W * zoom;
  const displayHeight = PAGE_H * zoom;

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () => TEMPLATES.map((t) => ({
      id: t.id,
      label: t.name,
      render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);

        /* Top accent */
        ctx.fillStyle = config.primaryColor;
        ctx.fillRect(0, 0, w, 4);

        /* Template label */
        ctx.fillStyle = config.primaryColor;
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(t.name.toUpperCase(), w / 2, h * 0.35);

        /* Simulated text lines */
        ctx.fillStyle = "#e2e8f0";
        for (let i = 0; i < 4; i++) {
          const lw = w * (0.4 + Math.random() * 0.35);
          ctx.fillRect((w - lw) / 2, h * 0.48 + i * 8, lw, 3);
        }

        /* Bottom bar */
        ctx.fillStyle = config.primaryColor + "30";
        ctx.fillRect(0, h - 6, w, 6);
      },
    })),
    [config.primaryColor]
  );

  /* ── Left Panel ─────────────────────────────────────────── */
  const leftPanel = (
    <div className="space-y-3">
      {/* AI Content Generator */}
      <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-2.5">
          <IconSparkles className="size-3.5" />AI Content Generator
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3 py-2 text-xs text-gray-900 dark:text-white resize-none placeholder:text-gray-400 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20"
          rows={3} placeholder="Describe the company/product for the sales book..."
          value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))}
        />
        <button onClick={generateAI} disabled={loading || !config.description.trim()}
          className="w-full mt-2 flex items-center justify-center gap-2 h-10 rounded-xl bg-secondary-500 text-white text-xs font-bold hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Content</>}
        </button>
      </div>

      {/* Template Slider */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Templates</h3>
        <TemplateSlider
          templates={templatePreviews}
          activeId={config.template}
          onSelect={(id) => setConfig((p) => ({ ...p, template: id as SalesBookTemplate }))}
          thumbWidth={140}
          thumbHeight={100}
          label=""
        />
      </div>

      {/* Book Settings */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3 space-y-2">
        <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5"><IconBookOpen className="size-3.5 text-primary-500" />Book Settings</h3>

        <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 block">Book Title</label>
        <input className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" value={config.bookTitle} onChange={(e) => setConfig((p) => ({ ...p, bookTitle: e.target.value }))} />

        <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 block">Tagline</label>
        <input className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" value={config.tagline} onChange={(e) => setConfig((p) => ({ ...p, tagline: e.target.value }))} />

        <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 block">Company</label>
        <input className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" value={config.companyName} onChange={(e) => setConfig((p) => ({ ...p, companyName: e.target.value }))} />

        <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 block">Phone</label>
        <input className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" value={config.phone} onChange={(e) => setConfig((p) => ({ ...p, phone: e.target.value }))} />

        <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 block">Email</label>
        <input className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" value={config.email} onChange={(e) => setConfig((p) => ({ ...p, email: e.target.value }))} />

        <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 block mt-1">Primary Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110 ring-1 ring-primary-500/30" : "border-transparent"}`} style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* Pages */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3 space-y-2 max-h-52 overflow-y-auto">
        <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pages ({pages.length})</h3>
        {pages.map((pg, i) => (
          <button key={pg.id} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${config.activeSection === i ? "bg-primary-500/10 text-primary-500 font-semibold" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
            {i + 1}. {pg.title}
          </button>
        ))}
      </div>

      {/* Content Editor */}
      {pages[config.activeSection] && !["cover", "back-cover", "contact"].includes(pages[config.activeSection].type) && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 block">{pages[config.activeSection].title} Content</label>
          <textarea className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-xs text-gray-900 dark:text-white resize-none placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" rows={4} value={pages[config.activeSection].content} onChange={(e) => { const p = [...pages]; p[config.activeSection] = { ...p[config.activeSection], content: e.target.value }; setPages(p); }} />
        </div>
      )}
    </div>
  );

  /* ── Right Panel ────────────────────────────────────────── */
  const rightPanel = (
    <div className="space-y-4">
      {/* Export */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">Export</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={exportPNG} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 transition-colors hover:bg-primary-500/10">
            <IconDownload className="size-4" /><span className="text-xs font-semibold">.png</span>
          </button>
          <button onClick={handleCopy} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10">
            <IconCopy className="size-4" /><span className="text-xs font-semibold">Clipboard</span>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Book Info</h3>
        <div className="space-y-1 text-xs text-gray-400">
          <p>Template: <span className="text-gray-300 capitalize">{config.template}</span></p>
          <p>Pages: <span className="text-gray-300">{pages.length}</span></p>
          <p>Current: <span className="text-gray-300">{pages[config.activeSection]?.title}</span></p>
          <p>Resolution: <span className="text-gray-300">{PAGE_W}×{PAGE_H}px</span></p>
        </div>
      </div>
    </div>
  );

  /* ── Toolbar ────────────────────────────────────────────── */
  const toolbar = (
    <div className="flex items-center gap-2">
      <IconBookOpen className="size-3.5 text-primary-500" />
      <span className="text-xs font-semibold text-gray-400 capitalize">{config.template}</span>
      <span className="text-gray-600">·</span>
      <span className="text-xs text-gray-500">Page {config.activeSection + 1}/{pages.length}</span>
      <span className="text-gray-600">·</span>
      <div className="flex items-center gap-1">
        {pages.map((pg, i) => (
          <button key={pg.id} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))} className={`px-2 py-0.5 rounded text-[0.625rem] font-medium transition-colors ${config.activeSection === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"}`}>{i + 1}</button>
        ))}
      </div>
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      label={`Sales Book A5 — ${config.template} — Page ${config.activeSection + 1}/${pages.length} — ${PAGE_W}×${PAGE_H}px`}
      toolbar={toolbar}
      mobileTabs={["Canvas", "Settings"]}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
      onZoomFit={() => setZoom(0.75)}
      actionsBar={
        <div className="flex items-center gap-2">
          <button onClick={exportPNG} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors">
            <IconDownload className="size-3" />Download PNG
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors">
            <IconCopy className="size-3" />Copy
          </button>
        </div>
      }
    />
  );
}
