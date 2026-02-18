"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconShield,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";
import StickyCanvasLayout from "@/components/workspaces/StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "@/components/workspaces/TemplateSlider";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type CardSide = "front" | "back";
type CardTemplate = "corporate" | "student" | "visitor" | "employee" | "event" | "membership";

interface IDCardConfig {
  name: string;
  title: string;
  idNumber: string;
  department: string;
  organization: string;
  phone: string;
  email: string;
  address: string;
  issueDate: string;
  expiryDate: string;
  template: CardTemplate;
  primaryColor: string;
  side: CardSide;
  description: string;
}

const TEMPLATES: { id: CardTemplate; name: string; desc: string }[] = [
  { id: "corporate", name: "Corporate", desc: "Professional office badge" },
  { id: "student", name: "Student", desc: "School/university ID" },
  { id: "visitor", name: "Visitor", desc: "Temporary access pass" },
  { id: "employee", name: "Employee", desc: "Staff identification" },
  { id: "event", name: "Event", desc: "Conference/event badge" },
  { id: "membership", name: "Membership", desc: "Club/gym membership" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

/* CR-80 card dimensions scaled: 856×540 at ~2x for clarity */
const CARD_W = 856;
const CARD_H = 540;

/* ── Component ─────────────────────────────────────────────── */

export default function IDCardDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<IDCardConfig>({
    name: "John Mwamba",
    title: "Software Engineer",
    idNumber: "EMP-20260001",
    department: "Technology",
    organization: "DMSuite Solutions",
    phone: "+260 977 123 456",
    email: "john@dmsuite.com",
    address: "Plot 123, Cairo Road, Lusaka",
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    template: "corporate",
    primaryColor: "#1e40af",
    side: "front",
    description: "",
  });

  /* ── Render ─────────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = CARD_W;
    canvas.height = CARD_H;

    const W = CARD_W;
    const H = CARD_H;
    const pc = config.primaryColor;
    const font = "'Inter', 'Segoe UI', sans-serif";

    /* White base */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    if (config.side === "front") {
      renderFront(ctx, W, H, pc, font);
    } else {
      renderBack(ctx, W, H, pc, font);
    }

    /* Card border */
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    function renderFront(c: CanvasRenderingContext2D, w: number, h: number, primary: string, f: string) {
      const tmpl = config.template;

      /* Header region */
      if (tmpl === "corporate" || tmpl === "employee") {
        c.fillStyle = primary;
        c.fillRect(0, 0, w, 120);
        /* Diagonal accent */
        c.beginPath();
        c.moveTo(0, 120);
        c.lineTo(w, 90);
        c.lineTo(w, 120);
        c.closePath();
        c.fillStyle = primary;
        c.fill();
      } else if (tmpl === "student") {
        const grad = c.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, primary);
        grad.addColorStop(1, primary + "99");
        c.fillStyle = grad;
        c.fillRect(0, 0, w, 100);
      } else if (tmpl === "visitor") {
        c.fillStyle = "#fef3c7";
        c.fillRect(0, 0, w, h);
        c.fillStyle = primary;
        c.fillRect(0, 0, w, 80);
        /* VISITOR watermark */
        c.save();
        c.globalAlpha = 0.06;
        c.font = `bold 120px ${f}`;
        c.fillStyle = primary;
        c.textAlign = "center";
        c.fillText("VISITOR", w / 2, h / 2 + 40);
        c.restore();
      } else if (tmpl === "event") {
        c.fillStyle = primary;
        c.fillRect(0, 0, w, 140);
        /* Decorative circles */
        c.beginPath();
        c.arc(w - 60, 60, 80, 0, Math.PI * 2);
        c.fillStyle = primary + "40";
        c.fill();
      } else if (tmpl === "membership") {
        const grad = c.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, primary);
        grad.addColorStop(1, "#111827");
        c.fillStyle = grad;
        c.fillRect(0, 0, w, h);
        /* Gold stripe */
        c.fillStyle = "#fbbf24";
        c.fillRect(0, h - 8, w, 8);
      }

      const isLightCard = tmpl === "visitor";
      const headerH = tmpl === "event" ? 140 : tmpl === "corporate" || tmpl === "employee" ? 120 : tmpl === "student" ? 100 : 80;

      /* Organization name on header */
      c.fillStyle = tmpl === "membership" ? "#ffffff" : tmpl === "visitor" ? "#ffffff" : "#ffffff";
      c.font = `bold 22px ${f}`;
      c.textAlign = "left";
      c.fillText(config.organization, 24, 45);

      if (tmpl === "event") {
        c.font = `600 14px ${f}`;
        c.fillStyle = "#ffffffcc";
        c.fillText("EVENT BADGE", 24, 70);
      }

      /* Photo placeholder */
      const photoX = 30;
      const photoY = headerH + 20;
      const photoSize = 140;
      c.fillStyle = "#e5e7eb";
      c.fillRect(photoX, photoY, photoSize, photoSize);
      c.strokeStyle = primary + "40";
      c.lineWidth = 2;
      c.strokeRect(photoX, photoY, photoSize, photoSize);
      /* Camera icon placeholder */
      c.fillStyle = "#9ca3af";
      c.font = `11px ${f}`;
      c.textAlign = "center";
      c.fillText("PHOTO", photoX + photoSize / 2, photoY + photoSize / 2 + 4);

      /* Details */
      const detailX = photoX + photoSize + 30;
      const detailY = headerH + 30;
      const textColor = tmpl === "membership" ? "#ffffff" : "#1e293b";
      const subColor = tmpl === "membership" ? "#d1d5db" : "#64748b";

      c.textAlign = "left";
      c.fillStyle = textColor;
      c.font = `bold 26px ${f}`;
      c.fillText(config.name, detailX, detailY + 10);

      c.fillStyle = primary === "#ffffff" ? "#1e40af" : tmpl === "membership" ? "#fbbf24" : primary;
      c.font = `600 15px ${f}`;
      c.fillText(config.title, detailX, detailY + 36);

      c.fillStyle = subColor;
      c.font = `13px ${f}`;
      c.fillText(`ID: ${config.idNumber}`, detailX, detailY + 62);
      c.fillText(`Department: ${config.department}`, detailX, detailY + 82);
      c.fillText(`Phone: ${config.phone}`, detailX, detailY + 102);

      /* Issue / Expiry at bottom */
      c.fillStyle = subColor;
      c.font = `11px ${f}`;
      c.textAlign = "left";
      c.fillText(`Issued: ${config.issueDate}`, 30, h - 24);
      c.fillText(`Expires: ${config.expiryDate}`, 30, h - 10);

      /* Barcode zone (right bottom) */
      const barcodeX = w - 200;
      const barcodeY = h - 80;
      c.fillStyle = "#f3f4f6";
      c.fillRect(barcodeX, barcodeY, 170, 55);
      c.strokeStyle = "#d1d5db";
      c.lineWidth = 1;
      c.strokeRect(barcodeX, barcodeY, 170, 55);
      /* Simulated barcode lines */
      c.fillStyle = "#1e293b";
      for (let i = 0; i < 30; i++) {
        const bw = Math.random() > 0.5 ? 2 : 3;
        c.fillRect(barcodeX + 10 + i * 5, barcodeY + 8, bw, 28);
      }
      c.fillStyle = "#6b7280";
      c.font = `10px ${f}`;
      c.textAlign = "center";
      c.fillText(config.idNumber, barcodeX + 85, barcodeY + 48);

      /* Template-specific accents */
      if (tmpl === "corporate") {
        c.fillStyle = primary + "15";
        c.fillRect(0, h - 6, w, 6);
      }
    }

    function renderBack(c: CanvasRenderingContext2D, w: number, h: number, primary: string, f: string) {
      /* Back side */
      c.fillStyle = "#f8fafc";
      c.fillRect(0, 0, w, h);

      /* Header stripe */
      c.fillStyle = primary;
      c.fillRect(0, 0, w, 60);
      c.fillStyle = "#ffffff";
      c.font = `bold 18px ${f}`;
      c.textAlign = "center";
      c.fillText(config.organization, w / 2, 38);

      /* Magnetic stripe simulation */
      c.fillStyle = "#374151";
      c.fillRect(0, 80, w, 50);

      /* Contact info */
      c.fillStyle = "#475569";
      c.font = `12px ${f}`;
      c.textAlign = "center";
      let y = 170;
      c.fillText(config.address, w / 2, y); y += 20;
      c.fillText(`Phone: ${config.phone}`, w / 2, y); y += 20;
      c.fillText(`Email: ${config.email}`, w / 2, y); y += 20;

      /* QR placeholder */
      const qrSize = 100;
      const qrX = w / 2 - qrSize / 2;
      const qrY = y + 20;
      c.fillStyle = "#e5e7eb";
      c.fillRect(qrX, qrY, qrSize, qrSize);
      c.strokeStyle = "#d1d5db";
      c.strokeRect(qrX, qrY, qrSize, qrSize);
      c.fillStyle = "#9ca3af";
      c.font = `11px ${f}`;
      c.fillText("QR CODE", w / 2, qrY + qrSize / 2 + 4);

      /* Terms text */
      c.fillStyle = "#94a3b8";
      c.font = `9px ${f}`;
      c.fillText("This card is the property of " + config.organization + ".", w / 2, h - 40);
      c.fillText("If found, please return to the address above.", w / 2, h - 26);

      /* Bottom accent */
      c.fillStyle = primary;
      c.fillRect(0, h - 6, w, 6);
    }
  }, [config, advancedSettings]);

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
            content: `Generate ID card details for: ${config.description}. Organization: ${config.organization}. Template: ${config.template}. Based in Lusaka, Zambia. Return JSON: { "name": "", "title": "", "idNumber": "", "department": "", "phone": "+260...", "email": "", "address": "..., Lusaka" }`,
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
          name: data.name || p.name,
          title: data.title || p.title,
          idNumber: data.idNumber || p.idNumber,
          department: data.department || p.department,
          phone: data.phone || p.phone,
          email: data.email || p.email,
          address: data.address || p.address,
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
    link.download = `id-card-${config.side}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ── Zoom & Display ─────────────────────────────────────── */
  const [zoom, setZoom] = useState(1);
  const displayWidth = Math.min(480, CARD_W);
  const displayHeight = displayWidth * (CARD_H / CARD_W);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () =>
      TEMPLATES.map((t) => ({
        id: t.id,
        label: t.name,
        render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
          const pc = config.primaryColor;
          if (t.id === "corporate" || t.id === "employee") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, w, h * 0.22);
          } else if (t.id === "student") {
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, pc);
            grad.addColorStop(1, pc + "99");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h * 0.2);
          } else if (t.id === "visitor") {
            ctx.fillStyle = "#fef3c7";
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, w, h * 0.15);
          } else if (t.id === "event") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, w, h * 0.26);
          } else if (t.id === "membership") {
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, pc);
            grad.addColorStop(1, "#111827");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          }
          ctx.fillStyle = "#e5e7eb";
          ctx.fillRect(w * 0.06, h * 0.35, w * 0.25, w * 0.25);
          ctx.fillStyle = "#94a3b8";
          ctx.font = `bold ${Math.round(w * 0.07)}px sans-serif`;
          ctx.textAlign = "left";
          ctx.fillText(t.name, w * 0.38, h * 0.55);
          ctx.strokeStyle = "#d1d5db";
          ctx.lineWidth = 1;
          ctx.strokeRect(0, 0, w, h);
        },
      })),
    [config.primaryColor]
  );

  /* ── Copy Canvas ────────────────────────────────────────── */
  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      }, "image/png");
    } catch {
      /* clipboard may not be available */
    }
  }, []);

  /* ── Left Panel ─────────────────────────────────────────── */
  const leftPanel = (
    <div className="space-y-4">
      {/* Template Slider */}
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => setConfig((p) => ({ ...p, template: id as CardTemplate }))}
        thumbWidth={140}
        thumbHeight={88}
        label="Template"
      />

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconShield className="size-4 text-primary-500" />ID Card Settings</h3>

        <label className="block text-xs text-gray-400">Organization</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.organization} onChange={(e) => setConfig((p) => ({ ...p, organization: e.target.value }))} />

        <label className="block text-xs text-gray-400">Full Name</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.name} onChange={(e) => setConfig((p) => ({ ...p, name: e.target.value }))} />

        <label className="block text-xs text-gray-400">Title / Role</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.title} onChange={(e) => setConfig((p) => ({ ...p, title: e.target.value }))} />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400">ID Number</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.idNumber} onChange={(e) => setConfig((p) => ({ ...p, idNumber: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-400">Department</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.department} onChange={(e) => setConfig((p) => ({ ...p, department: e.target.value }))} />
          </div>
        </div>

        <label className="block text-xs text-gray-400">Phone</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.phone} onChange={(e) => setConfig((p) => ({ ...p, phone: e.target.value }))} />

        <label className="block text-xs text-gray-400">Email</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.email} onChange={(e) => setConfig((p) => ({ ...p, email: e.target.value }))} />

        <label className="block text-xs text-gray-400">Address</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.address} onChange={(e) => setConfig((p) => ({ ...p, address: e.target.value }))} />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400">Issue Date</label>
            <input type="date" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.issueDate} onChange={(e) => setConfig((p) => ({ ...p, issueDate: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-400">Expiry Date</label>
            <input type="date" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.expiryDate} onChange={(e) => setConfig((p) => ({ ...p, expiryDate: e.target.value }))} />
          </div>
        </div>

        <label className="block text-xs text-gray-400">Card Side</label>
        <div className="flex gap-2">
          {(["front", "back"] as const).map((s) => (
            <button key={s} onClick={() => setConfig((p) => ({ ...p, side: s }))} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold capitalize ${config.side === s ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>{s}</button>
          ))}
        </div>

        <label className="block text-xs text-gray-400">Primary Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* AI Generation */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Content Generator</h3>
        <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the card holder (e.g. 'Senior engineer at a tech company in Lusaka')..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
        <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
          {loading ? "Generating…" : "Generate Content"}
        </button>
      </div>

      {/* Advanced Settings — Global */}
      <AdvancedSettingsPanel />
    </div>
  );

  // ── Toolbar ───────────────────────────────────────────
  const toolbar = (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-gray-400 capitalize">{config.side}</span>
      <span className="text-gray-600 dark:text-gray-600">·</span>
      <span className="text-xs text-gray-500">{config.template}</span>
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      canvasRef={canvasRef}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      label={`CR-80 ID Card · ${config.side} · ${CARD_W}×${CARD_H}px`}
      toolbar={toolbar}
      mobileTabs={["Canvas", "Settings"]}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
      onZoomFit={() => setZoom(1)}
      actionsBar={
        <div className="flex items-center gap-2">
          <button
            onClick={exportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors"
          >
            <IconDownload className="size-3" />
            Download PNG
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
