"use client";

import { useState, useCallback, useMemo } from "react";
import {
  IconCalendar,
  IconSparkles,
  IconLoader,
  IconPlus,
  IconTrash,
  IconDownload,
  IconCheck,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type ContentType = "blog" | "social" | "email" | "video" | "podcast";
type ContentStatus = "draft" | "scheduled" | "published";
type ViewMode = "month" | "week";

interface ContentItem {
  id: string;
  date: string; // YYYY-MM-DD
  type: ContentType;
  title: string;
  platform: string;
  status: ContentStatus;
}

const CONTENT_TYPES: { id: ContentType; label: string; colorClass: string; bgClass: string }[] = [
  { id: "blog", label: "Blog", colorClass: "text-blue-500", bgClass: "bg-blue-500" },
  { id: "social", label: "Social", colorClass: "text-green-500", bgClass: "bg-green-500" },
  { id: "email", label: "Email", colorClass: "text-purple-500", bgClass: "bg-purple-500" },
  { id: "video", label: "Video", colorClass: "text-red-500", bgClass: "bg-red-500" },
  { id: "podcast", label: "Podcast", colorClass: "text-orange-500", bgClass: "bg-orange-500" },
];

const STATUSES: ContentStatus[] = ["draft", "scheduled", "published"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatMonth(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/* ── Component ─────────────────────────────────────────────── */

export default function ContentCalendarWorkspace() {
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [items, setItems] = useState<ContentItem[]>([]);

  /* Modal state */
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Omit<ContentItem, "id">>({
    date: "",
    type: "blog",
    title: "",
    platform: "",
    status: "draft",
  });

  /* ── Navigation ─────────────────────────────────────────── */
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  /* ── Calendar grid data ─────────────────────────────────── */
  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const cells: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month fill
    const prevDays = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const pm = viewMonth === 0 ? 11 : viewMonth - 1;
      const py = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ day: d, dateStr: toDateStr(py, pm, d), isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, dateStr: toDateStr(viewYear, viewMonth, d), isCurrentMonth: true });
    }

    // Next month fill
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nm = viewMonth === 11 ? 0 : viewMonth + 1;
      const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ day: d, dateStr: toDateStr(ny, nm, d), isCurrentMonth: false });
    }

    return cells;
  }, [viewYear, viewMonth]);

  /* ── Week view data ─────────────────────────────────────── */
  const weekGrid = useMemo(() => {
    const today = selectedDate ? new Date(selectedDate) : new Date(viewYear, viewMonth, 1);
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    const cells: { day: number; dateStr: string; isCurrentMonth: boolean; dayName: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      cells.push({
        day: d.getDate(),
        dateStr: toDateStr(d.getFullYear(), d.getMonth(), d.getDate()),
        isCurrentMonth: d.getMonth() === viewMonth,
        dayName: DAYS[i],
      });
    }
    return cells;
  }, [viewYear, viewMonth, selectedDate]);

  /* ── Items helpers ──────────────────────────────────────── */
  const getItemsForDate = useCallback(
    (dateStr: string) => items.filter((i) => i.date === dateStr),
    [items]
  );

  const addItem = () => {
    if (!newItem.title.trim() || !newItem.date) return;
    setItems((prev) => [...prev, { ...newItem, id: uid() }]);
    setShowAddModal(false);
    setNewItem({ date: "", type: "blog", title: "", platform: "", status: "draft" });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  /* ── AI: Suggest Content Plan ───────────────────────────── */
  const suggestPlan = async () => {
    setLoading(true);
    try {
      const monthName = formatMonth(viewYear, viewMonth);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a content marketing calendar for ${monthName}. Create 12-15 content items spread across the month. Return JSON: { "items": [{ "date": "YYYY-MM-DD", "type": "blog|social|email|video|podcast", "title": "Content title", "platform": "Platform name", "status": "draft" }] }. Use dates in ${viewYear}-${String(viewMonth + 1).padStart(2, "0")}. Mix content types. Focus on engaging business content for a Zambian audience. Include social media posts, blog articles, email newsletters, and video ideas.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.items) {
          const newItems: ContentItem[] = data.items.map(
            (item: { date: string; type: string; title: string; platform: string; status: string }) => ({
              id: uid(),
              date: item.date,
              type: (["blog", "social", "email", "video", "podcast"].includes(item.type) ? item.type : "blog") as ContentType,
              title: item.title,
              platform: item.platform || "",
              status: (item.status as ContentStatus) || "draft",
            })
          );
          setItems((prev) => [...prev, ...newItems]);
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  /* ── Export CSV ──────────────────────────────────────────── */
  const exportCSV = () => {
    const header = "Date,Type,Title,Platform,Status\n";
    const rows = items
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((i) => `${i.date},${i.type},"${i.title.replace(/"/g, '""')}",${i.platform},${i.status}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-calendar-${viewYear}-${String(viewMonth + 1).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Selected day items ─────────────────────────────────── */
  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : [];

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 lg:hidden">
        {(["content", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Settings Panel ──────────────────────────────── */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto ${mobileTab !== "settings" ? "hidden lg:block" : ""}`}>
          {/* View Controls */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconCalendar className="size-4 text-primary-500" />
              Calendar View
            </h3>

            <div className="grid grid-cols-2 gap-1.5">
              {(["month", "week"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${viewMode === m ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                ◀ Prev
              </button>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMonth(viewYear, viewMonth)}</span>
              <button onClick={nextMonth} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Next ▶
              </button>
            </div>
          </div>

          {/* Content Type Legend */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <label className="block text-xs text-gray-400">Content Types</label>
            {CONTENT_TYPES.map((ct) => (
              <div key={ct.id} className="flex items-center gap-2">
                <span className={`size-3 rounded-full ${ct.bgClass}`} />
                <span className="text-xs text-gray-700 dark:text-gray-300">{ct.label}</span>
              </div>
            ))}
          </div>

          {/* Add Content */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <button
              onClick={() => {
                setNewItem((p) => ({ ...p, date: selectedDate || toDateStr(viewYear, viewMonth, 1) }));
                setShowAddModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <IconPlus className="size-4" />
              Add Content
            </button>
          </div>

          {/* AI Suggest */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              AI Content Planner
            </h3>
            <button
              onClick={suggestPlan}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconSparkles className="size-4" />}
              {loading ? "Planning…" : "Suggest Content Plan"}
            </button>
            <p className="text-[10px] text-gray-400">AI will generate 12-15 content items for {formatMonth(viewYear, viewMonth)}.</p>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <button
              onClick={exportCSV}
              disabled={items.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <IconDownload className="size-4" />
              Export CSV
            </button>
          </div>

          {/* Selected Day Items */}
          {selectedDate && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h3>
              {selectedItems.length === 0 ? (
                <p className="text-xs text-gray-400">No content scheduled for this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map((item) => {
                    const typeInfo = CONTENT_TYPES.find((ct) => ct.id === item.type);
                    return (
                      <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <span className={`size-2.5 rounded-full mt-1 shrink-0 ${typeInfo?.bgClass || "bg-gray-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                          <p className="text-[10px] text-gray-400">{item.platform} · {item.status}</p>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                          <IconTrash className="size-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Content Area (Calendar) ──────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Calendar Header */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <button onClick={prevMonth} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              ◀
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{formatMonth(viewYear, viewMonth)}</h2>
            <button onClick={nextMonth} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              ▶
            </button>
          </div>

          {/* Month View */}
          {viewMode === "month" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {DAYS.map((d) => (
                  <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {d}
                  </div>
                ))}
              </div>
              {/* Day Cells */}
              <div className="grid grid-cols-7">
                {calendarGrid.map((cell, idx) => {
                  const dayItems = getItemsForDate(cell.dateStr);
                  const isSelected = selectedDate === cell.dateStr;
                  const isToday =
                    cell.dateStr === toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(cell.dateStr)}
                      className={`min-h-20 p-1.5 text-left border border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        !cell.isCurrentMonth ? "opacity-40" : ""
                      } ${isSelected ? "ring-2 ring-primary-500 ring-inset" : ""}`}
                    >
                      <span
                        className={`inline-flex items-center justify-center size-6 rounded-full text-xs font-medium ${
                          isToday
                            ? "bg-primary-500 text-gray-950"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {cell.day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayItems.slice(0, 3).map((item) => {
                          const typeInfo = CONTENT_TYPES.find((ct) => ct.id === item.type);
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate ${typeInfo?.bgClass || "bg-gray-400"} text-white`}
                            >
                              <span className="truncate">{item.title}</span>
                            </div>
                          );
                        })}
                        {dayItems.length > 3 && (
                          <span className="text-[9px] text-gray-400 px-1">+{dayItems.length - 3} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === "week" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="grid grid-cols-7">
                {weekGrid.map((cell, idx) => {
                  const dayItems = getItemsForDate(cell.dateStr);
                  const isSelected = selectedDate === cell.dateStr;
                  const isToday = cell.dateStr === toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(cell.dateStr)}
                      className={`min-h-48 p-2 text-left border border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        isSelected ? "ring-2 ring-primary-500 ring-inset" : ""
                      }`}
                    >
                      <div className="text-center mb-2">
                        <span className="text-[10px] text-gray-400 block">{cell.dayName}</span>
                        <span
                          className={`inline-flex items-center justify-center size-8 rounded-full text-sm font-semibold ${
                            isToday ? "bg-primary-500 text-gray-950" : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {cell.day}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayItems.map((item) => {
                          const typeInfo = CONTENT_TYPES.find((ct) => ct.id === item.type);
                          return (
                            <div
                              key={item.id}
                              className={`px-1.5 py-1 rounded text-[10px] truncate ${typeInfo?.bgClass || "bg-gray-400"} text-white`}
                            >
                              {item.title}
                            </div>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CONTENT_TYPES.map((ct) => {
              const count = items.filter((i) => i.type === ct.id).length;
              return (
                <div key={ct.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 text-center">
                  <span className={`size-3 rounded-full inline-block ${ct.bgClass} mb-1`} />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{count}</p>
                  <p className="text-[10px] text-gray-400">{ct.label}</p>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconCalendar className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Plan Your Content</h3>
              <p className="text-sm text-gray-400 max-w-md">
                Click on a day to select it, then add content items manually or let AI suggest a full content plan for the month.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Content Modal ─────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Content Item</h3>

            <label className="block text-xs text-gray-400">Date</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              value={newItem.date}
              onChange={(e) => setNewItem((p) => ({ ...p, date: e.target.value }))}
            />

            <label className="block text-xs text-gray-400">Content Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setNewItem((p) => ({ ...p, type: ct.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${newItem.type === ct.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
                >
                  {ct.label}
                </button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Title</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="Content title…"
              value={newItem.title}
              onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
            />

            <label className="block text-xs text-gray-400">Platform</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="e.g. LinkedIn, Blog, YouTube…"
              value={newItem.platform}
              onChange={(e) => setNewItem((p) => ({ ...p, platform: e.target.value }))}
            />

            <label className="block text-xs text-gray-400">Status</label>
            <div className="grid grid-cols-3 gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setNewItem((p) => ({ ...p, status: s }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${newItem.status === s ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={addItem}
                disabled={!newItem.title.trim() || !newItem.date}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
              >
                <IconCheck className="size-4" />
                Add
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
