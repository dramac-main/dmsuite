"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconCalendar,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconTrash,
  IconPrinter,
} from "@/components/icons";
import { cleanAIText, hexToRgba } from "@/lib/canvas-utils";
import StickyCanvasLayout from "@/components/workspaces/StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "@/components/workspaces/TemplateSlider";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ══════════════════════════════════════════════════════════════
   DMSuite — Calendar Designer Workspace
   Full-featured calendar designer with single-month and
   year-at-a-glance views, custom events/markers, Zambian
   public holidays, multiple templates, month navigation,
   and high-quality PNG export.
   ══════════════════════════════════════════════════════════════ */

/* ── Types ─────────────────────────────────────────────────── */

type CalendarType = "wall" | "desk" | "planner" | "poster" | "year-view";
type CalendarTemplate = "corporate" | "nature" | "minimal" | "vibrant" | "dark" | "elegant";
type WeekStart = "monday" | "sunday";
type ViewMode = "month" | "year";

interface CalendarEvent {
  id: string;
  date: string; // "YYYY-MM-DD"
  label: string;
  color: string;
}

interface CalendarConfig {
  type: CalendarType;
  template: CalendarTemplate;
  primaryColor: string;
  accentColor: string;
  year: number;
  month: number;
  weekStart: WeekStart;
  viewMode: ViewMode;
  title: string;
  subtitle: string;
  description: string;
  showWeekNumbers: boolean;
  showHolidays: boolean;
  showEvents: boolean;
  headerImage: boolean;
}

/* ── Constants ─────────────────────────────────────────────── */

const TYPES: { id: CalendarType; name: string; w: number; h: number }[] = [
  { id: "wall",      name: "Wall Calendar",  w: 1200, h: 900 },
  { id: "desk",      name: "Desk Calendar",  w: 1050, h: 600 },
  { id: "planner",   name: "Planner (A4)",   w: 842,  h: 1191 },
  { id: "poster",    name: "Poster",         w: 900,  h: 1200 },
  { id: "year-view", name: "Year at Glance", w: 1200, h: 900 },
];

const TEMPLATES: { id: CalendarTemplate; name: string; headerBg: string; textColor: string; gridBg: string }[] = [
  { id: "corporate", name: "Corporate",  headerBg: "#1e40af", textColor: "#ffffff", gridBg: "#ffffff" },
  { id: "nature",    name: "Nature",     headerBg: "#065f46", textColor: "#ffffff", gridBg: "#f0fdf4" },
  { id: "minimal",   name: "Minimal",    headerBg: "#f8fafc", textColor: "#1e293b", gridBg: "#ffffff" },
  { id: "vibrant",   name: "Vibrant",    headerBg: "#7c3aed", textColor: "#ffffff", gridBg: "#faf5ff" },
  { id: "dark",      name: "Dark Mode",  headerBg: "#111827", textColor: "#f9fafb", gridBg: "#1f2937" },
  { id: "elegant",   name: "Elegant",    headerBg: "#1c1917", textColor: "#fbbf24", gridBg: "#fefce8" },
];

const COLOR_PRESETS = [
  "#1e40af", "#0f766e", "#7c3aed", "#dc2626",
  "#ea580c", "#0284c7", "#4f46e5", "#059669",
  "#be185d", "#ca8a04", "#0891b2", "#7e22ce",
];

const EVENT_COLORS = ["#ef4444", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#6366f1"];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LETTERS_MON = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_LETTERS_SUN = ["S", "M", "T", "W", "T", "F", "S"];

/* ── Zambian Public Holidays ──────────────────────────────── */

const ZAMBIAN_HOLIDAYS: Record<string, string> = {
  "1-1":   "New Year's Day",
  "3-8":   "Women's Day",
  "3-12":  "Youth Day",
  "5-1":   "Labour Day",
  "5-25":  "Africa Day",
  "7-7":   "Heroes' Day",
  "7-8":   "Unity Day",
  "8-1":   "Farmers' Day",
  "10-18": "Nat'l Prayer Day",
  "10-24": "Independence Day",
  "12-25": "Christmas Day",
};

/* ── Date Helpers ─────────────────────────────────────────── */

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function getWeekNumber(year: number, month: number, day: number): number {
  const d = new Date(year, month, day);
  const startOfYear = new Date(year, 0, 1);
  const diff = d.getTime() - startOfYear.getTime();
  return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
}

function makeId() { return Math.random().toString(36).slice(2, 9); }

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

export default function CalendarDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(0.65);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<CalendarConfig>({
    type: "wall",
    template: "corporate",
    primaryColor: "#1e40af",
    accentColor: "#ef4444",
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    weekStart: "monday",
    viewMode: "month",
    title: "",
    subtitle: "",
    description: "",
    showWeekNumbers: false,
    showHolidays: true,
    showEvents: true,
    headerImage: true,
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventLabel, setNewEventLabel] = useState("");
  const [newEventColor, setNewEventColor] = useState("#3b82f6");

  /* ── Derived ────────────────────────────────────────────── */
  const calType = TYPES.find((t) => t.id === config.type) || TYPES[0];
  const tmpl = TEMPLATES.find((t) => t.id === config.template) || TEMPLATES[0];
  const CW = calType.w;
  const CH = calType.h;
  const displayWidth = Math.min(CW, 560);
  const displayHeight = displayWidth * (CH / CW);

  /* ── Month Navigation ───────────────────────────────────── */
  const prevMonth = () => {
    setConfig((p) => {
      if (p.month === 0) return { ...p, month: 11, year: p.year - 1 };
      return { ...p, month: p.month - 1 };
    });
  };

  const nextMonth = () => {
    setConfig((p) => {
      if (p.month === 11) return { ...p, month: 0, year: p.year + 1 };
      return { ...p, month: p.month + 1 };
    });
  };

  /* ── Add Event ──────────────────────────────────────────── */
  const addEvent = () => {
    if (!newEventDate || !newEventLabel.trim()) return;
    setEvents((p) => [...p, { id: makeId(), date: newEventDate, label: newEventLabel.trim(), color: newEventColor }]);
    setNewEventLabel("");
  };

  const removeEvent = (id: string) => {
    setEvents((p) => p.filter((e) => e.id !== id));
  };

  /* ── Get Events For Date ────────────────────────────────── */
  const getEventsForDate = useCallback((year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  }, [events]);

  /* ── Visual Template Previews ───────────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () => TEMPLATES.map((t) => ({
      id: t.id,
      label: t.name,
      render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        // Background
        ctx.fillStyle = t.gridBg;
        ctx.fillRect(0, 0, w, h);
        // Header
        const headerH = h * 0.3;
        if (t.id === "dark") {
          ctx.fillStyle = t.headerBg;
          ctx.fillRect(0, 0, w, h);
        }
        if (t.id === "vibrant") {
          const g = ctx.createLinearGradient(0, 0, w, 0);
          g.addColorStop(0, config.primaryColor); g.addColorStop(1, t.headerBg);
          ctx.fillStyle = g;
        } else {
          ctx.fillStyle = t.headerBg;
        }
        ctx.fillRect(0, 0, w, headerH);
        // Title text
        ctx.fillStyle = t.textColor;
        ctx.font = "bold 8px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Month", 5, headerH - 4);
        // Mini grid
        const gTop = headerH + 3;
        const cw = (w - 8) / 7;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 7; c++) {
            ctx.fillStyle = t.id === "dark" ? "#374151" : "#e2e8f0";
            ctx.fillRect(4 + c * cw, gTop + r * 8, cw - 1, 6);
          }
        }
        ctx.strokeStyle = t.id === "dark" ? "#374151" : "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, w, h);
      },
    })),
    [config.primaryColor],
  );

  /* ── Render: Single Month ───────────────────────────────── */
  const renderMonth = useCallback((ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, year: number, month: number, isMain: boolean) => {
    const pc = config.primaryColor;
    const ac = config.accentColor;
    const font = "'Inter', 'Segoe UI', sans-serif";
    const dayLabels = config.weekStart === "monday" ? (isMain ? DAY_LABELS_MON : DAY_LETTERS_MON) : (isMain ? DAY_LABELS_SUN : DAY_LETTERS_SUN);
    const monthName = MONTH_NAMES[month];
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    let startOffset = firstDay;
    if (config.weekStart === "monday") {
      startOffset = firstDay === 0 ? 6 : firstDay - 1;
    }
    const rows = Math.ceil((startOffset + daysInMonth) / 7);
    const cols = config.showWeekNumbers && isMain ? 8 : 7;
    const headerH = isMain ? (config.headerImage ? h * 0.3 : h * 0.12) : h * 0.18;
    const dayHeaderH = isMain ? 28 : 14;
    const gridTop = headerH + dayHeaderH + (isMain ? 8 : 4);
    const gridPadX = isMain ? 16 : 4;
    const cellW = (w - gridPadX * 2) / cols;
    const cellH = Math.min((h - gridTop - (isMain ? 16 : 4)) / rows, isMain ? 70 : 16);

    // Determine dark mode
    const isDark = config.template === "dark";
    const bgColor = isDark ? "#1f2937" : tmpl.gridBg;
    const borderColor = isDark ? "#374151" : "#e2e8f0";
    const dayTextColor = isDark ? "#e5e7eb" : "#1e293b";
    const mutedTextColor = isDark ? "#6b7280" : "#94a3b8";

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(x0, y0, w, h);

    // Header
    if (isMain && config.headerImage) {
      if (config.template === "vibrant") {
        const g = ctx.createLinearGradient(x0, y0, x0 + w, y0);
        g.addColorStop(0, pc); g.addColorStop(0.5, "#f59e0b"); g.addColorStop(1, ac);
        ctx.fillStyle = g;
      } else if (config.template === "nature") {
        const g = ctx.createLinearGradient(x0, y0, x0 + w, y0 + headerH);
        g.addColorStop(0, "#065f46"); g.addColorStop(1, "#059669");
        ctx.fillStyle = g;
      } else if (config.template === "elegant") {
        ctx.fillStyle = "#1c1917";
      } else if (isDark) {
        const g = ctx.createLinearGradient(x0, y0, x0 + w, y0 + headerH);
        g.addColorStop(0, "#111827"); g.addColorStop(1, pc);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = pc;
      }
      ctx.fillRect(x0, y0, w, headerH);

      // Decorative circles
      ctx.fillStyle = hexToRgba("#ffffff", 0.06);
      ctx.beginPath(); ctx.arc(x0 + w - 100, y0 + headerH / 2, 70, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x0 + w - 60, y0 + headerH / 2 + 30, 40, 0, Math.PI * 2); ctx.fill();

      // Nature: leaf shapes
      if (config.template === "nature") {
        ctx.fillStyle = hexToRgba("#ffffff", 0.08);
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(x0 + 80 + i * (w / 5), y0 + headerH / 2, 20, 40, Math.PI / 4 + i * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Month title
      const titleColor = config.template === "elegant" ? "#fbbf24" : (config.template === "minimal" ? "#1e293b" : "#ffffff");
      ctx.fillStyle = titleColor;
      ctx.font = `bold ${w < 400 ? 22 : 40}px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(monthName, x0 + 24, y0 + headerH - 48);
      ctx.font = `300 ${w < 400 ? 16 : 28}px ${font}`;
      ctx.fillText(String(year), x0 + 24, y0 + headerH - 16);

      // Custom title / subtitle
      if (config.title) {
        ctx.textAlign = "right";
        ctx.font = `600 ${w < 400 ? 10 : 16}px ${font}`;
        ctx.fillText(config.title, x0 + w - 24, y0 + headerH - 48);
      }
      if (config.subtitle) {
        ctx.textAlign = "right";
        ctx.font = `${w < 400 ? 9 : 13}px ${font}`;
        ctx.fillStyle = hexToRgba(titleColor, 0.8);
        ctx.fillText(config.subtitle, x0 + w - 24, y0 + headerH - 28);
      }
    } else if (isMain) {
      // No header image — compact header
      ctx.fillStyle = isDark ? "#111827" : pc;
      ctx.fillRect(x0, y0, w, headerH);
      ctx.fillStyle = isDark ? "#f9fafb" : "#ffffff";
      ctx.font = `bold 24px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`${monthName} ${year}`, x0 + w / 2, y0 + headerH - 10);
    } else {
      // Mini month header
      ctx.fillStyle = isDark ? "#111827" : pc;
      ctx.fillRect(x0, y0, w, headerH);
      ctx.fillStyle = isDark ? "#f9fafb" : "#ffffff";
      ctx.font = `bold 10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`${MONTH_SHORT[month]} ${year}`, x0 + w / 2, y0 + headerH - 4);
    }

    // Separator
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0 + gridPadX, y0 + headerH + dayHeaderH);
    ctx.lineTo(x0 + w - gridPadX, y0 + headerH + dayHeaderH);
    ctx.stroke();

    // Day headers
    ctx.textAlign = "center";
    ctx.font = `600 ${isMain ? 11 : 8}px ${font}`;
    const weekNumOffset = (config.showWeekNumbers && isMain) ? 1 : 0;
    if (config.showWeekNumbers && isMain) {
      ctx.fillStyle = mutedTextColor;
      ctx.fillText("Wk", x0 + gridPadX + cellW / 2, y0 + headerH + dayHeaderH - (isMain ? 8 : 3));
    }
    for (let d = 0; d < 7; d++) {
      const cx = x0 + gridPadX + (d + weekNumOffset) * cellW + cellW / 2;
      const isSunday = (config.weekStart === "sunday" && d === 0) || (config.weekStart === "monday" && d === 6);
      const isSaturday = (config.weekStart === "sunday" && d === 6) || (config.weekStart === "monday" && d === 5);
      ctx.fillStyle = isSunday ? ac : isSaturday ? hexToRgba(ac, 0.6) : mutedTextColor;
      ctx.fillText(dayLabels[d], cx, y0 + headerH + dayHeaderH - (isMain ? 8 : 3));
    }

    // Day cells
    const today = new Date();
    const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();

    for (let day = 1; day <= daysInMonth; day++) {
      const idx = startOffset + day - 1;
      const col = idx % 7;
      const row = Math.floor(idx / 7);
      const cx = x0 + gridPadX + (col + weekNumOffset) * cellW;
      const cy = y0 + gridTop + row * cellH;

      // Week number
      if (col === 0 && config.showWeekNumbers && isMain) {
        const wn = getWeekNumber(year, month, day);
        ctx.fillStyle = mutedTextColor;
        ctx.font = `9px ${font}`;
        ctx.textAlign = "center";
        ctx.fillText(String(wn), x0 + gridPadX + cellW / 2, cy + (isMain ? 16 : 10));
      }

      const holidayKey = `${month + 1}-${day}`;
      const holiday = config.showHolidays ? ZAMBIAN_HOLIDAYS[holidayKey] : undefined;
      const isSunday = (config.weekStart === "sunday" && col === 0) || (config.weekStart === "monday" && col === 6);
      const isSaturday = (config.weekStart === "sunday" && col === 6) || (config.weekStart === "monday" && col === 5);
      const isToday = isCurrentMonth && day === today.getDate();
      const dayEvents = config.showEvents ? getEventsForDate(year, month, day) : [];

      // Cell background
      if (isMain) {
        // Subtle grid lines
        ctx.strokeStyle = hexToRgba(borderColor, 0.5);
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cx, cy, cellW, cellH);

        if (holiday) {
          ctx.fillStyle = isDark ? hexToRgba(ac, 0.1) : "#fef2f2";
          ctx.fillRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
        }
      }

      // Today highlight
      if (isToday) {
        if (isMain) {
          ctx.fillStyle = pc;
          ctx.beginPath();
          ctx.arc(cx + cellW / 2, cy + (isMain ? 14 : 8), isMain ? 14 : 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
        } else {
          ctx.fillStyle = pc;
          ctx.beginPath();
          ctx.arc(cx + cellW / 2, cy + 8, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
        }
      } else if (holiday) {
        ctx.fillStyle = ac;
      } else if (isSunday) {
        ctx.fillStyle = hexToRgba(ac, 0.8);
      } else if (isSaturday) {
        ctx.fillStyle = hexToRgba(ac, 0.5);
      } else {
        ctx.fillStyle = dayTextColor;
      }

      ctx.font = `${isMain ? "600" : "normal"} ${isMain ? 13 : 8}px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(String(day), cx + cellW / 2, cy + (isMain ? 18 : 10));

      // Holiday label (main view only)
      if (holiday && isMain) {
        ctx.fillStyle = ac;
        ctx.font = `8px ${font}`;
        ctx.fillText(holiday, cx + cellW / 2, cy + 32, cellW - 6);
      }

      // Event dots/labels (main view only)
      if (dayEvents.length > 0 && isMain) {
        const dotY = cy + (holiday ? 42 : 32);
        dayEvents.slice(0, 2).forEach((evt, ei) => {
          ctx.fillStyle = evt.color;
          ctx.beginPath();
          ctx.arc(cx + cellW / 2 - 8 + ei * 10, dotY, 3, 0, Math.PI * 2);
          ctx.fill();
          if (cellH > 50) {
            ctx.font = `7px ${font}`;
            ctx.textAlign = "left";
            ctx.fillText(evt.label, cx + 4, dotY + 12 + ei * 10, cellW - 8);
          }
        });
        if (dayEvents.length > 2) {
          ctx.fillStyle = mutedTextColor;
          ctx.font = `7px ${font}`;
          ctx.textAlign = "center";
          ctx.fillText(`+${dayEvents.length - 2}`, cx + cellW / 2 + 12, dotY);
        }
      }
    }

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isDark ? 0.5 : 1;
    ctx.strokeRect(x0, y0, w, h);
  }, [config, tmpl, getEventsForDate]);

  /* ── Render: Year View ──────────────────────────────────── */
  const renderYearView = useCallback((ctx: CanvasRenderingContext2D) => {
    const font = "'Inter', 'Segoe UI', sans-serif";
    const isDark = config.template === "dark";
    const bgColor = isDark ? "#0f172a" : tmpl.gridBg;

    // Full background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CW, CH);

    // Year header
    const headerH = 70;
    if (isDark) {
      const g = ctx.createLinearGradient(0, 0, CW, 0);
      g.addColorStop(0, "#111827"); g.addColorStop(1, config.primaryColor);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = config.primaryColor;
    }
    ctx.fillRect(0, 0, CW, headerH);

    ctx.fillStyle = isDark ? "#f9fafb" : "#ffffff";
    ctx.font = `bold 36px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(String(config.year), CW / 2, 48);

    if (config.title) {
      ctx.font = `14px ${font}`;
      ctx.fillStyle = hexToRgba(isDark ? "#f9fafb" : "#ffffff", 0.7);
      ctx.fillText(config.title, CW / 2, 65);
    }

    // 4×3 grid of mini months
    const pad = 16;
    const gridTop = headerH + pad;
    const cols = 4;
    const rows = 3;
    const mW = (CW - pad * (cols + 1)) / cols;
    const mH = (CH - gridTop - pad * (rows + 1)) / rows;

    for (let m = 0; m < 12; m++) {
      const col = m % cols;
      const row = Math.floor(m / cols);
      const mx = pad + col * (mW + pad);
      const my = gridTop + pad + row * (mH + pad);
      renderMonth(ctx, mx, my, mW, mH, config.year, m, false);
    }
  }, [config, CW, CH, tmpl, renderMonth]);

  /* ── Main Render ────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = CW;
    canvas.height = CH;

    if (config.viewMode === "year" || config.type === "year-view") {
      renderYearView(ctx);
    } else {
      renderMonth(ctx, 0, 0, CW, CH, config.year, config.month, true);

      // Mini prev/next month strip at bottom (for wall/desk types)
      if ((config.type === "wall" || config.type === "desk") && CH > 600) {
        const stripH = 100;
        const stripY = CH - stripH - 8;
        const miniW = (CW - 48) / 2;

        // Previous month
        const prevM = config.month === 0 ? 11 : config.month - 1;
        const prevY = config.month === 0 ? config.year - 1 : config.year;
        renderMonth(ctx, 16, stripY, miniW, stripH, prevY, prevM, false);

        // Next month
        const nextM = config.month === 11 ? 0 : config.month + 1;
        const nextY = config.month === 11 ? config.year + 1 : config.year;
        renderMonth(ctx, 16 + miniW + 16, stripY, miniW, stripH, nextY, nextM, false);
      }
    }
  }, [config, CW, CH, renderMonth, renderYearView, advancedSettings]);

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
            content: `Generate calendar details for: "${config.description}". Month: ${MONTH_NAMES[config.month]} ${config.year}. Type: ${config.type}. Based in Lusaka, Zambia. Return JSON: { "title": "", "subtitle": "", "events": [{ "date": "YYYY-MM-DD", "label": "", "color": "#hex" }] }. Include 3-5 relevant events/dates. Professional tone.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.title) setConfig((p) => ({ ...p, title: data.title }));
        if (data.subtitle) setConfig((p) => ({ ...p, subtitle: data.subtitle }));
        if (data.events && Array.isArray(data.events)) {
          const newEvents = data.events.map((e: { date: string; label: string; color?: string }) => ({
            id: makeId(),
            date: e.date,
            label: e.label,
            color: e.color || "#3b82f6",
          }));
          setEvents((p) => [...p, ...newEvents]);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Copy ───────────────────────────────────────────────── */
  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch { /* ignore */ }
  }, []);

  /* ── Export ─────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const monthStr = config.viewMode === "year" ? "year" : MONTH_NAMES[config.month].toLowerCase();
    link.download = `calendar-${monthStr}-${config.year}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const exportHiResPNG = () => {
    // Render at 2x for print quality
    const hiCanvas = document.createElement("canvas");
    hiCanvas.width = CW * 2;
    hiCanvas.height = CH * 2;
    const ctx = hiCanvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);

    // Re-render at 2x
    if (config.viewMode === "year" || config.type === "year-view") {
      renderYearView(ctx);
    } else {
      renderMonth(ctx, 0, 0, CW, CH, config.year, config.month, true);
    }

    const link = document.createElement("a");
    const monthStr = config.viewMode === "year" ? "year" : MONTH_NAMES[config.month].toLowerCase();
    link.download = `calendar-${monthStr}-${config.year}-hires.png`;
    link.href = hiCanvas.toDataURL("image/png");
    link.click();
  };

  /* ══════════════════════════════════════════════════════════
     UI — Left Panel
     ══════════════════════════════════════════════════════════ */

  const leftPanel = (
    <div className="space-y-4">
      {/* AI Theme Generator */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconSparkles className="size-4 text-primary-500" />AI Theme
        </h3>
        <textarea
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
          rows={2} placeholder="Describe the theme (e.g. 'Church calendar with service times')…"
          value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))}
        />
        <button onClick={generateAI} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
          {loading ? "Generating…" : "Generate Theme & Events"}
        </button>
      </div>

      {/* Template Slider */}
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => setConfig((p) => ({ ...p, template: id as CalendarTemplate }))}
        label="Templates"
      />

      {/* Calendar Settings */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconCalendar className="size-4 text-primary-500" />Settings
        </h3>

        {/* View Mode */}
        <label className="block text-xs text-gray-400">View Mode</label>
        <div className="flex gap-1.5">
          {(["month", "year"] as const).map((v) => (
            <button key={v} onClick={() => setConfig((p) => ({ ...p, viewMode: v }))}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold capitalize ${
                config.viewMode === v ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}>{v === "year" ? "Year View" : "Month View"}</button>
          ))}
        </div>

        {/* Calendar Type */}
        <label className="block text-xs text-gray-400">Calendar Type</label>
        <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
          value={config.type} onChange={(e) => setConfig((p) => ({ ...p, type: e.target.value as CalendarType }))}>
          {TYPES.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.w}×{t.h})</option>)}
        </select>

        {/* Year & Month with navigation */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-500">
            <IconChevronLeft className="size-4" />
          </button>
          <div className="flex-1 grid grid-cols-2 gap-1.5">
            <input type="number" min={2020} max={2100}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white text-center"
              value={config.year} onChange={(e) => setConfig((p) => ({ ...p, year: +e.target.value }))} />
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white"
              value={config.month} onChange={(e) => setConfig((p) => ({ ...p, month: +e.target.value }))}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-500">
            <IconChevronRight className="size-4" />
          </button>
        </div>

        {/* Week Start */}
        <label className="block text-xs text-gray-400">Week Starts</label>
        <div className="flex gap-1.5">
          {(["monday", "sunday"] as const).map((s) => (
            <button key={s} onClick={() => setConfig((p) => ({ ...p, weekStart: s }))}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                config.weekStart === s ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}>{s}</button>
          ))}
        </div>

        {/* Colors */}
        <label className="block text-xs text-gray-400">Primary Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))}
              className={`size-6 rounded-full border-2 transition ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }} />
          ))}
          <input type="color" value={config.primaryColor}
            onChange={(e) => setConfig((p) => ({ ...p, primaryColor: e.target.value }))}
            className="size-6 rounded-full cursor-pointer border-0" />
        </div>

        <label className="block text-xs text-gray-400">Accent Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={config.accentColor}
            onChange={(e) => setConfig((p) => ({ ...p, accentColor: e.target.value }))}
            className="size-7 rounded-lg cursor-pointer border-0" />
          <span className="text-xs text-gray-500">{config.accentColor}</span>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          {[
            { key: "showHolidays" as const, label: "Show Zambian Holidays 🇿🇲" },
            { key: "showWeekNumbers" as const, label: "Week Numbers" },
            { key: "showEvents" as const, label: "Show Events" },
            { key: "headerImage" as const, label: "Header Area" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input type="checkbox" checked={config[key]}
                onChange={(e) => setConfig((p) => ({ ...p, [key]: e.target.checked }))}
                className="accent-primary-500" />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     UI — Right Panel (Content & Events)
     ══════════════════════════════════════════════════════════ */

  const rightPanel = (
    <div className="space-y-4">
      {/* Content */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Content</h3>

        <label className="block text-xs text-gray-400">Title</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white"
          value={config.title} onChange={(e) => setConfig((p) => ({ ...p, title: e.target.value }))}
          placeholder="Calendar title" />

        <label className="block text-xs text-gray-400">Subtitle</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white"
          value={config.subtitle} onChange={(e) => setConfig((p) => ({ ...p, subtitle: e.target.value }))}
          placeholder="Subtitle or tagline" />
      </div>

      {/* Events Manager */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconPlus className="size-4 text-primary-500" />Events
        </h3>

        {/* Add event */}
        <div className="space-y-2">
          <input type="date"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white"
            value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
          <input
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white"
            value={newEventLabel} onChange={(e) => setNewEventLabel(e.target.value)}
            placeholder="Event name" />
          <div className="flex items-center gap-1.5">
            {EVENT_COLORS.map((c) => (
              <button key={c} onClick={() => setNewEventColor(c)}
                className={`size-5 rounded-full border-2 transition ${newEventColor === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <button onClick={addEvent}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-semibold hover:bg-primary-500/20 transition-colors">
            <IconPlus className="size-3" />Add Event
          </button>
        </div>

        {/* Event list */}
        {events.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {events.map((evt) => (
              <div key={evt.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: evt.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{evt.label}</p>
                  <p className="text-[10px] text-gray-500">{evt.date}</p>
                </div>
                <button onClick={() => removeEvent(evt.id)} className="p-0.5 text-gray-400 hover:text-red-400">
                  <IconTrash className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {events.length === 0 && (
          <p className="text-[10px] text-gray-500 text-center py-2">No custom events yet. Add events above or use AI to generate them.</p>
        )}
      </div>

      {/* Zambian Holidays */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">🇿🇲 Zambian Holidays</h3>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {Object.entries(ZAMBIAN_HOLIDAYS).map(([key, name]) => {
            const [m, d] = key.split("-").map(Number);
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-16 shrink-0 font-mono">{MONTH_SHORT[m - 1]} {d}</span>
                <span className="text-gray-700 dark:text-gray-300">{name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Settings — Global */}
      <AdvancedSettingsPanel />

      {/* Export */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconDownload className="size-4 text-primary-500" />Export
        </h3>
        <button onClick={exportPNG}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors">
          <IconDownload className="size-4" />Download PNG
        </button>
        <button onClick={exportHiResPNG}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <IconPrinter className="size-4" />Hi-Res PNG (2×)
        </button>
        <button onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <IconCopy className="size-4" />Copy to Clipboard
        </button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     Toolbar
     ══════════════════════════════════════════════════════════ */

  const toolbar = (
    <div className="flex items-center gap-2">
      {config.viewMode === "month" && (
        <>
          <button onClick={prevMonth} className="p-1 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-gray-700/50 transition-colors">
            <IconChevronLeft className="size-4" />
          </button>
          <span className="text-xs font-semibold text-gray-200 min-w-28 text-center">
            {MONTH_NAMES[config.month]} {config.year}
          </span>
          <button onClick={nextMonth} className="p-1 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-gray-700/50 transition-colors">
            <IconChevronRight className="size-4" />
          </button>
        </>
      )}
      {config.viewMode === "year" && (
        <>
          <button onClick={() => setConfig((p) => ({ ...p, year: p.year - 1 }))} className="p-1 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-gray-700/50 transition-colors">
            <IconChevronLeft className="size-4" />
          </button>
          <span className="text-xs font-semibold text-gray-200 min-w-16 text-center">{config.year}</span>
          <button onClick={() => setConfig((p) => ({ ...p, year: p.year + 1 }))} className="p-1 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-gray-700/50 transition-colors">
            <IconChevronRight className="size-4" />
          </button>
        </>
      )}
      <span className="text-[10px] text-gray-500 ml-2">{calType.name} • {config.template}</span>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     Layout
     ══════════════════════════════════════════════════════════ */

  return (
    <StickyCanvasLayout
      canvasRef={canvasRef}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.15, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.15, 0.25))}
      onZoomFit={() => setZoom(0.65)}
      label={`${calType.name} — ${config.viewMode === "year" ? config.year : `${MONTH_NAMES[config.month]} ${config.year}`} — ${CW}×${CH}px`}
      mobileTabs={["Canvas", "Settings", "Events"]}
      toolbar={toolbar}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
}
