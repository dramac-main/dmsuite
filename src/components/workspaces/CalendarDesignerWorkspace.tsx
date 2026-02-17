"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconCalendar,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type CalendarType = "wall" | "desk" | "planner" | "poster";
type CalendarTemplate = "corporate" | "nature" | "minimal" | "vibrant";
type WeekStart = "monday" | "sunday";

interface CalendarConfig {
  type: CalendarType;
  template: CalendarTemplate;
  primaryColor: string;
  year: number;
  month: number;
  weekStart: WeekStart;
  title: string;
  subtitle: string;
  description: string;
}

const TYPES: { id: CalendarType; name: string; w: number; h: number }[] = [
  { id: "wall", name: "Wall Calendar", w: 800, h: 600 },
  { id: "desk", name: "Desk Calendar", w: 700, h: 400 },
  { id: "planner", name: "Planner", w: 595, h: 842 },
  { id: "poster", name: "Poster", w: 600, h: 800 },
];

const TEMPLATES: { id: CalendarTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" },
  { id: "nature", name: "Nature" },
  { id: "minimal", name: "Minimal" },
  { id: "vibrant", name: "Vibrant" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_LABELS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* Zambian public holidays (month-day) */
const ZAMBIAN_HOLIDAYS: Record<string, string> = {
  "1-1": "New Year",
  "3-8": "Women's Day",
  "3-12": "Youth Day",
  "5-1": "Labour Day",
  "5-25": "Africa Day",
  "7-7": "Heroes' Day",
  "7-8": "Unity Day",
  "8-1": "Farmers' Day",
  "10-18": "Nat'l Prayer Day",
  "10-24": "Independence Day",
  "12-25": "Christmas",
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/* ── Component ─────────────────────────────────────────────── */

export default function CalendarDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  const [config, setConfig] = useState<CalendarConfig>({
    type: "wall",
    template: "corporate",
    primaryColor: "#1e40af",
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    weekStart: "monday",
    title: "",
    subtitle: "",
    description: "",
  });

  const calType = TYPES.find((t) => t.id === config.type) || TYPES[0];
  const CW = calType.w;
  const CH = calType.h;

  /* ── Render ─────────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = CW;
    canvas.height = CH;

    const pc = config.primaryColor;
    const font = "'Inter', 'Segoe UI', sans-serif";

    /* Background */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CW, CH);

    const monthName = MONTH_NAMES[config.month];
    const daysInMonth = getDaysInMonth(config.year, config.month);
    const firstDay = getFirstDayOfMonth(config.year, config.month);
    const dayLabels = config.weekStart === "monday" ? DAY_LABELS_MON : DAY_LABELS_SUN;

    /* Adjust first day offset for Monday start */
    let startOffset = firstDay;
    if (config.weekStart === "monday") {
      startOffset = firstDay === 0 ? 6 : firstDay - 1;
    }

    /* Image area (top section for wall/poster types) */
    const imageAreaH = config.type === "planner" ? 80 : config.type === "desk" ? 80 : CH * 0.35;

    if (config.template === "corporate") {
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, CW, imageAreaH);
      ctx.fillStyle = pc + "20";
      ctx.beginPath();
      ctx.arc(CW - 80, imageAreaH / 2, 60, 0, Math.PI * 2);
      ctx.fill();
    } else if (config.template === "nature") {
      const grad = ctx.createLinearGradient(0, 0, CW, imageAreaH);
      grad.addColorStop(0, "#065f46");
      grad.addColorStop(1, "#059669");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CW, imageAreaH);
      /* Leaf shapes */
      ctx.fillStyle = "#ffffff15";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(100 + i * 160, imageAreaH / 2, 30, 50, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (config.template === "vibrant") {
      const grad = ctx.createLinearGradient(0, 0, CW, 0);
      grad.addColorStop(0, pc);
      grad.addColorStop(0.5, "#f59e0b");
      grad.addColorStop(1, "#ef4444");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CW, imageAreaH);
    } else {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, CW, imageAreaH);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, imageAreaH);
      ctx.lineTo(CW, imageAreaH);
      ctx.stroke();
    }

    /* Month / Year title in image area */
    ctx.fillStyle = config.template === "minimal" ? "#1e293b" : "#ffffff";
    ctx.font = `bold 32px ${font}`;
    ctx.textAlign = "left";
    ctx.fillText(monthName, 30, imageAreaH - 40);
    ctx.font = `300 24px ${font}`;
    ctx.fillText(String(config.year), 30, imageAreaH - 12);

    if (config.title) {
      ctx.textAlign = "right";
      ctx.font = `600 14px ${font}`;
      ctx.fillText(config.title, CW - 30, imageAreaH - 40);
    }
    if (config.subtitle) {
      ctx.textAlign = "right";
      ctx.font = `12px ${font}`;
      ctx.fillText(config.subtitle, CW - 30, imageAreaH - 20);
    }

    /* Grid area */
    const gridTop = imageAreaH + 16;
    const gridPadding = 20;
    const gridW = CW - gridPadding * 2;
    const cellW = gridW / 7;
    const availableH = CH - gridTop - 30;
    const rows = Math.ceil((startOffset + daysInMonth) / 7);
    const cellH = Math.min(availableH / (rows + 1), 60);

    /* Day headers */
    ctx.textAlign = "center";
    ctx.font = `600 11px ${font}`;
    for (let d = 0; d < 7; d++) {
      const x = gridPadding + d * cellW + cellW / 2;
      const isSunday = (config.weekStart === "sunday" && d === 0) || (config.weekStart === "monday" && d === 6);
      ctx.fillStyle = isSunday ? "#ef4444" : "#64748b";
      ctx.fillText(dayLabels[d], x, gridTop + 14);
    }

    /* Separator */
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gridPadding, gridTop + 22);
    ctx.lineTo(CW - gridPadding, gridTop + 22);
    ctx.stroke();

    /* Day cells */
    const cellStartY = gridTop + 28;
    for (let day = 1; day <= daysInMonth; day++) {
      const idx = startOffset + day - 1;
      const col = idx % 7;
      const row = Math.floor(idx / 7);
      const x = gridPadding + col * cellW;
      const y = cellStartY + row * cellH;

      /* Holiday check */
      const holidayKey = `${config.month + 1}-${day}`;
      const holiday = ZAMBIAN_HOLIDAYS[holidayKey];
      const isSunday = (config.weekStart === "sunday" && col === 0) || (config.weekStart === "monday" && col === 6);

      /* Today highlight */
      const today = new Date();
      const isToday = day === today.getDate() && config.month === today.getMonth() && config.year === today.getFullYear();

      if (isToday) {
        ctx.fillStyle = pc;
        ctx.beginPath();
        ctx.arc(x + cellW / 2, y + 12, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
      } else if (holiday) {
        ctx.fillStyle = "#fef2f2";
        ctx.fillRect(x + 2, y, cellW - 4, cellH - 2);
        ctx.fillStyle = "#ef4444";
      } else if (isSunday) {
        ctx.fillStyle = "#ef4444";
      } else {
        ctx.fillStyle = "#1e293b";
      }

      ctx.font = `600 13px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(String(day), x + cellW / 2, y + 16);

      if (holiday) {
        ctx.fillStyle = "#ef4444";
        ctx.font = `8px ${font}`;
        ctx.fillText(holiday, x + cellW / 2, y + 28, cellW - 6);
      }
    }

    /* Border */
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, CW, CH);
  }, [config, CW, CH]);

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
            content: `Generate calendar details for: ${config.description}. Month: ${MONTH_NAMES[config.month]} ${config.year}. Type: ${config.type}. Based in Lusaka, Zambia. Return JSON: { "title": "", "subtitle": "" }`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        setConfig((p) => ({ ...p, title: data.title || p.title, subtitle: data.subtitle || p.subtitle }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `calendar-${MONTH_NAMES[config.month].toLowerCase()}-${config.year}.png`;
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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconCalendar className="size-4 text-primary-500" />Calendar Settings</h3>

            <label className="block text-xs text-gray-400">Calendar Type</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.type} onChange={(e) => setConfig((p) => ({ ...p, type: e.target.value as CalendarType }))}>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-400">Year</label>
                <input type="number" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.year} onChange={(e) => setConfig((p) => ({ ...p, year: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400">Month</label>
                <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.month} onChange={(e) => setConfig((p) => ({ ...p, month: Number(e.target.value) }))}>
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
            </div>

            <label className="block text-xs text-gray-400">Week Start</label>
            <div className="flex gap-2">
              {(["monday", "sunday"] as const).map((s) => (
                <button key={s} onClick={() => setConfig((p) => ({ ...p, weekStart: s }))} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold capitalize ${config.weekStart === s ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>{s}</button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Title</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.title} onChange={(e) => setConfig((p) => ({ ...p, title: e.target.value }))} placeholder="Optional title" />

            <label className="block text-xs text-gray-400">Subtitle</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.subtitle} onChange={(e) => setConfig((p) => ({ ...p, subtitle: e.target.value }))} placeholder="Optional subtitle" />

            <label className="block text-xs text-gray-400">Template</label>
            <div className="grid grid-cols-2 gap-1.5">
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

          {/* Zambian Holidays Info */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">🇿🇲 Zambian Holidays</h3>
            <p className="text-xs text-gray-400">Public holidays are highlighted in red on the calendar grid. Includes all gazetted Zambian holidays.</p>
          </div>

          {/* AI Generation */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Theme Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the calendar theme (e.g. 'Corporate calendar for a Lusaka law firm')..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Theme"}
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
            <canvas ref={canvasRef} style={{ width: Math.min(CW, 700), height: Math.min(CW, 700) * (CH / CW) }} className="rounded-lg shadow-lg" />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">{calType.name} — {MONTH_NAMES[config.month]} {config.year} — {CW}×{CH}px</p>
        </div>
      </div>
    </div>
  );
}
