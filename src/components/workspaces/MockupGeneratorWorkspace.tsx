"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconMonitor,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
} from "@/components/icons";
import { cleanAIText, roundRect } from "@/lib/canvas-utils";
import StickyCanvasLayout from "@/components/workspaces/StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "@/components/workspaces/TemplateSlider";

/* ── Types ─────────────────────────────────────────────────── */

type MockupType = "phone" | "laptop" | "desktop" | "tablet" | "tshirt" | "mug" | "card" | "poster" | "billboard" | "book" | "bag" | "box";

interface MockupScene {
  id: MockupType;
  name: string;
  group: "device" | "product";
  width: number;
  height: number;
  screenX: number;
  screenY: number;
  screenW: number;
  screenH: number;
}

interface MockupConfig {
  scene: MockupType;
  bgColor: string;
  deviceColor: string;
  contentColor: string;
  contentText: string;
  contentSubtext: string;
  brandName: string;
  shadowEnabled: boolean;
  description: string;
}

const SCENES: MockupScene[] = [
  /* Devices */
  { id: "phone", name: "Phone", group: "device", width: 500, height: 700, screenX: 140, screenY: 60, screenW: 220, screenH: 440 },
  { id: "laptop", name: "Laptop", group: "device", width: 800, height: 520, screenX: 140, screenY: 35, screenW: 520, screenH: 325 },
  { id: "desktop", name: "Desktop", group: "device", width: 800, height: 600, screenX: 140, screenY: 30, screenW: 520, screenH: 340 },
  { id: "tablet", name: "Tablet", group: "device", width: 600, height: 700, screenX: 95, screenY: 55, screenW: 410, screenH: 520 },
  /* Products */
  { id: "tshirt", name: "T-Shirt", group: "product", width: 600, height: 700, screenX: 180, screenY: 200, screenW: 240, screenH: 200 },
  { id: "mug", name: "Mug", group: "product", width: 600, height: 600, screenX: 175, screenY: 140, screenW: 250, screenH: 200 },
  { id: "card", name: "Business Card", group: "product", width: 700, height: 450, screenX: 120, screenY: 80, screenW: 460, screenH: 270 },
  { id: "poster", name: "Poster", group: "product", width: 600, height: 750, screenX: 125, screenY: 80, screenW: 350, screenH: 500 },
  { id: "billboard", name: "Billboard", group: "product", width: 800, height: 500, screenX: 60, screenY: 50, screenW: 680, screenH: 280 },
  { id: "book", name: "Book Cover", group: "product", width: 600, height: 700, screenX: 155, screenY: 80, screenW: 290, screenH: 420 },
  { id: "bag", name: "Tote Bag", group: "product", width: 600, height: 700, screenX: 160, screenY: 150, screenW: 280, screenH: 280 },
  { id: "box", name: "Package Box", group: "product", width: 700, height: 600, screenX: 150, screenY: 100, screenW: 400, screenH: 320 },
];

const BG_PRESETS = ["#f1f5f9", "#1e293b", "#fef3c7", "#ecfdf5", "#eff6ff", "#fdf2f8", "#f5f3ff", "#111827"];
const DEVICE_COLORS = ["#1e293b", "#f8fafc", "#6366f1", "#0f766e", "#dc2626", "#d97706"];
const CONTENT_COLORS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

/* ── Component ─────────────────────────────────────────────── */

export default function MockupGeneratorWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState<MockupConfig>({
    scene: "phone",
    bgColor: "#f1f5f9",
    deviceColor: "#1e293b",
    contentColor: "#1e40af",
    contentText: "Your Brand",
    contentSubtext: "Preview your design in context",
    brandName: "DMSuite",
    shadowEnabled: true,
    description: "",
  });

  const scene = SCENES.find((s) => s.id === config.scene) || SCENES[0];

  /* ── Render ─────────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = scene.width;
    canvas.height = scene.height;

    const W = scene.width;
    const H = scene.height;
    const dc = config.deviceColor;
    const cc = config.contentColor;
    const font = "'Inter', 'Segoe UI', sans-serif";

    /* Background */
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, W, H);

    /* Background pattern */
    ctx.fillStyle = config.bgColor === "#111827" || config.bgColor === "#1e293b" ? "#ffffff06" : "#00000006";
    for (let gx = 0; gx < W; gx += 30) {
      for (let gy = 0; gy < H; gy += 30) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* Shadow */
    if (config.shadowEnabled) {
      ctx.fillStyle = "#00000015";
      if (scene.group === "device") {
        roundRect(ctx, scene.screenX + 8, scene.screenY + 12, scene.screenW, scene.screenH + 30, 16);
        ctx.fill();
      } else {
        ctx.fillRect(scene.screenX + 6, scene.screenY + 8, scene.screenW, scene.screenH);
      }
    }

    /* Device/Product frame */
    if (scene.id === "phone") {
      /* Phone body */
      ctx.fillStyle = dc;
      roundRect(ctx, scene.screenX - 20, scene.screenY - 30, scene.screenW + 40, scene.screenH + 90, 28);
      ctx.fill();

      /* Notch */
      ctx.fillStyle = dc;
      roundRect(ctx, W / 2 - 40, scene.screenY - 10, 80, 20, 10);
      ctx.fill();

      /* Camera dot */
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.arc(W / 2 + 20, scene.screenY, 5, 0, Math.PI * 2);
      ctx.fill();

      /* Home indicator */
      ctx.fillStyle = "#475569";
      roundRect(ctx, W / 2 - 30, scene.screenY + scene.screenH + 24, 60, 5, 3);
      ctx.fill();

    } else if (scene.id === "laptop") {
      /* Screen bezel */
      ctx.fillStyle = dc;
      roundRect(ctx, scene.screenX - 15, scene.screenY - 15, scene.screenW + 30, scene.screenH + 25, 10);
      ctx.fill();

      /* Base */
      ctx.fillStyle = dc;
      ctx.beginPath();
      ctx.moveTo(90, scene.screenY + scene.screenH + 15);
      ctx.lineTo(W - 90, scene.screenY + scene.screenH + 15);
      ctx.lineTo(W - 60, scene.screenY + scene.screenH + 50);
      ctx.lineTo(60, scene.screenY + scene.screenH + 50);
      ctx.closePath();
      ctx.fill();

      /* Touchpad */
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      roundRect(ctx, W / 2 - 50, scene.screenY + scene.screenH + 25, 100, 15, 3);
      ctx.stroke();

    } else if (scene.id === "desktop") {
      /* Monitor bezel */
      ctx.fillStyle = dc;
      roundRect(ctx, scene.screenX - 18, scene.screenY - 18, scene.screenW + 36, scene.screenH + 30, 8);
      ctx.fill();

      /* Stand neck */
      ctx.fillStyle = dc;
      ctx.fillRect(W / 2 - 20, scene.screenY + scene.screenH + 16, 40, 60);

      /* Stand base */
      ctx.fillStyle = dc;
      roundRect(ctx, W / 2 - 80, scene.screenY + scene.screenH + 70, 160, 12, 6);
      ctx.fill();

    } else if (scene.id === "tablet") {
      ctx.fillStyle = dc;
      roundRect(ctx, scene.screenX - 20, scene.screenY - 30, scene.screenW + 40, scene.screenH + 70, 20);
      ctx.fill();

      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.arc(W / 2, scene.screenY + scene.screenH + 24, 12, 0, Math.PI * 2);
      ctx.fill();

    } else if (scene.id === "tshirt") {
      /* T-shirt outline */
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(180, 80);
      ctx.quadraticCurveTo(120, 90, 60, 160);
      ctx.lineTo(100, 220);
      ctx.lineTo(140, 180);
      ctx.lineTo(140, 600);
      ctx.lineTo(460, 600);
      ctx.lineTo(460, 180);
      ctx.lineTo(500, 220);
      ctx.lineTo(540, 160);
      ctx.quadraticCurveTo(480, 90, 420, 80);
      ctx.quadraticCurveTo(350, 110, 300, 110);
      ctx.quadraticCurveTo(250, 110, 180, 80);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.stroke();

    } else if (scene.id === "mug") {
      /* Mug body */
      ctx.fillStyle = "#f8fafc";
      roundRect(ctx, 150, 120, 280, 340, 12);
      ctx.fill();

      /* Handle */
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(460, 280, 60, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      roundRect(ctx, 150, 120, 280, 340, 12);
      ctx.stroke();

    } else if (scene.id === "card") {
      /* Card body */
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#00000020";
      ctx.shadowBlur = config.shadowEnabled ? 20 : 0;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      roundRect(ctx, scene.screenX - 10, scene.screenY - 10, scene.screenW + 20, scene.screenH + 20, 8);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

    } else {
      /* Generic frame for poster, billboard, book, bag, box */
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(scene.screenX - 6, scene.screenY - 6, scene.screenW + 12, scene.screenH + 12);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.strokeRect(scene.screenX - 6, scene.screenY - 6, scene.screenW + 12, scene.screenH + 12);
    }

    /* Screen / Content area */
    ctx.fillStyle = cc;
    ctx.fillRect(scene.screenX, scene.screenY, scene.screenW, scene.screenH);

    /* Content gradient overlay */
    const grad = ctx.createLinearGradient(scene.screenX, scene.screenY, scene.screenX, scene.screenY + scene.screenH);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(1, "#00000030");
    ctx.fillStyle = grad;
    ctx.fillRect(scene.screenX, scene.screenY, scene.screenW, scene.screenH);

    /* Pattern in content area */
    ctx.fillStyle = "#ffffff10";
    ctx.beginPath();
    ctx.arc(scene.screenX + scene.screenW * 0.7, scene.screenY + scene.screenH * 0.3, scene.screenW * 0.25, 0, Math.PI * 2);
    ctx.fill();

    /* Brand / Content text */
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    const cCx = scene.screenX + scene.screenW / 2;
    const cCy = scene.screenY + scene.screenH / 2;

    const textScale = Math.min(scene.screenW / 300, 1.2);

    ctx.font = `bold ${Math.round(24 * textScale)}px ${font}`;
    ctx.fillText(config.contentText, cCx, cCy - 10 * textScale, scene.screenW - 40);

    if (config.contentSubtext) {
      ctx.fillStyle = "#ffffffbb";
      ctx.font = `${Math.round(12 * textScale)}px ${font}`;
      ctx.fillText(config.contentSubtext, cCx, cCy + 16 * textScale, scene.screenW - 40);
    }

    /* Brand watermark */
    if (config.brandName) {
      ctx.fillStyle = "#ffffff60";
      ctx.font = `600 ${Math.round(10 * textScale)}px ${font}`;
      ctx.fillText(config.brandName, cCx, scene.screenY + scene.screenH - 14 * textScale);
    }

    /* Scene label */
    const isDarkBg = config.bgColor === "#111827" || config.bgColor === "#1e293b";
    ctx.fillStyle = isDarkBg ? "#ffffff30" : "#00000020";
    ctx.font = `9px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(`${scene.name} Mockup — ${scene.width}×${scene.height}`, W / 2, H - 10);
  }, [config, scene]);

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
            content: `Generate mockup content for: ${config.description}. Return JSON: { "contentText": "", "contentSubtext": "", "brandName": "", "bgColor": "#hex", "contentColor": "#hex" }. Make it professional and eye-catching.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        setConfig((p) => ({
          ...p,
          contentText: data.contentText || p.contentText,
          contentSubtext: data.contentSubtext || p.contentSubtext,
          brandName: data.brandName || p.brandName,
          bgColor: data.bgColor || p.bgColor,
          contentColor: data.contentColor || p.contentColor,
        }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `mockup-${scene.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const devices = SCENES.filter((s) => s.group === "device");
  const products = SCENES.filter((s) => s.group === "product");

  /* ── Zoom / Display ─────────────────────────────────────── */
  const [zoom, setZoom] = useState(0.75);
  const displayWidth = Math.min(550, scene.width) * zoom;
  const displayHeight = displayWidth * (scene.height / scene.width);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () => SCENES.map((s) => ({
      id: s.id,
      label: s.name,
      render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = config.deviceColor;
        const sx = (s.screenX / s.width) * w;
        const sy = (s.screenY / s.height) * h;
        const sw = (s.screenW / s.width) * w;
        const sh = (s.screenH / s.height) * h;
        roundRect(ctx, sx, sy, sw, sh, 3);
        ctx.fill();
        ctx.fillStyle = config.contentColor;
        ctx.fillRect(sx + 2, sy + 2, sw - 4, sh - 4);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 7px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(s.name, w / 2, h - 4);
      },
    })),
    [config.bgColor, config.deviceColor, config.contentColor]
  );

  /* ── Copy to Clipboard ──────────────────────────────────── */
  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch { /* ignore */ }
  }, []);

  /* ── Panel Definitions for StickyCanvasLayout ───────────── */
  const leftPanel = (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconMonitor className="size-4 text-primary-500" />Mockup Settings</h3>

        <label className="block text-xs text-gray-400">Device Mockups</label>
        <div className="grid grid-cols-4 gap-1.5">
          {devices.map((s) => (
            <button key={s.id} onClick={() => setConfig((p) => ({ ...p, scene: s.id }))} className={`px-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${config.scene === s.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{s.name}</button>
          ))}
        </div>

        <label className="block text-xs text-gray-400">Product Mockups</label>
        <div className="grid grid-cols-4 gap-1.5">
          {products.map((s) => (
            <button key={s.id} onClick={() => setConfig((p) => ({ ...p, scene: s.id }))} className={`px-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${config.scene === s.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{s.name}</button>
          ))}
        </div>

        <label className="block text-xs text-gray-400">Content Text</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.contentText} onChange={(e) => setConfig((p) => ({ ...p, contentText: e.target.value }))} />

        <label className="block text-xs text-gray-400">Subtext</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.contentSubtext} onChange={(e) => setConfig((p) => ({ ...p, contentSubtext: e.target.value }))} />

        <label className="block text-xs text-gray-400">Brand Name</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.brandName} onChange={(e) => setConfig((p) => ({ ...p, brandName: e.target.value }))} />

        <label className="block text-xs text-gray-400">Background</label>
        <div className="flex gap-1.5 flex-wrap">
          {BG_PRESETS.map((c) => (
            <button key={c} onClick={() => setConfig((p) => ({ ...p, bgColor: c }))} className={`size-7 rounded-full border-2 ${config.bgColor === c ? "border-primary-500 scale-110" : "border-gray-300 dark:border-gray-600"}`} style={{ backgroundColor: c }} />
          ))}
        </div>

        <label className="block text-xs text-gray-400">Device Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {DEVICE_COLORS.map((c) => (
            <button key={c} onClick={() => setConfig((p) => ({ ...p, deviceColor: c }))} className={`size-7 rounded-full border-2 ${config.deviceColor === c ? "border-primary-500 scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
          ))}
        </div>

        <label className="block text-xs text-gray-400">Content Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {CONTENT_COLORS.map((c) => (
            <button key={c} onClick={() => setConfig((p) => ({ ...p, contentColor: c }))} className={`size-7 rounded-full border-2 ${config.contentColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" checked={config.shadowEnabled} onChange={(e) => setConfig((p) => ({ ...p, shadowEnabled: e.target.checked }))} className="rounded" />
          <label className="text-xs text-gray-400">Drop shadow</label>
        </div>
      </div>

      {/* AI Generation */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Mockup Content</h3>
        <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the brand/product to preview (e.g. 'Fitness app for Zambian market')..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
        <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
          {loading ? "Generating…" : "Generate Content"}
        </button>
      </div>

      {/* Template Slider */}
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.scene}
        onSelect={(id) => setConfig((p) => ({ ...p, scene: id as MockupType }))}
        label="Scene Presets"
      />
    </>
  );

  return (
    <StickyCanvasLayout
      canvasRef={canvasRef}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
      onZoomFit={() => setZoom(0.75)}
      label={`${scene.name} Mockup — ${scene.width}×${scene.height}px`}
      mobileTabs={["Canvas", "Settings"]}
      leftPanel={leftPanel}
      actionsBar={
        <div className="flex items-center gap-2">
          <button
            onClick={exportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors"
          >
            <IconDownload className="size-3" />
            PNG
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <IconCopy className="size-3" />
            Copy
          </button>
        </div>
      }
    />
  );
}
