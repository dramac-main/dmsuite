"use client";

import { useState, useCallback } from "react";
import {
  IconChart,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
  IconCheck,
  IconFilter,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type DashboardType = "website" | "social-media" | "email-campaign" | "sales" | "content-performance";
type DateRange = "7d" | "30d" | "90d" | "year" | "custom";

interface KPICard {
  label: string;
  value: string;
  change: number;
  color: string;
}

interface PageRow {
  rank: number;
  title: string;
  views: number;
  engagement: string;
}

interface TrafficSource {
  name: string;
  percentage: number;
  color: string;
}

interface GoalItem {
  id: string;
  name: string;
  target: number;
  current: number;
}

const DASHBOARD_TYPES: { id: DashboardType; label: string }[] = [
  { id: "website", label: "Website" },
  { id: "social-media", label: "Social Media" },
  { id: "email-campaign", label: "Email Campaign" },
  { id: "sales", label: "Sales" },
  { id: "content-performance", label: "Content Performance" },
];

const DATE_RANGES: { id: DateRange; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "year", label: "Year" },
  { id: "custom", label: "Custom" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Sample Data ──────────────────────────────────────────── */

const SAMPLE_KPIS: Record<DashboardType, KPICard[]> = {
  website: [
    { label: "Visitors", value: "12,847", change: 12.5, color: "text-primary-500" },
    { label: "Page Views", value: "38,291", change: 8.3, color: "text-secondary-500" },
    { label: "Bounce Rate", value: "34.2%", change: -5.1, color: "text-success" },
    { label: "Avg. Session", value: "3m 24s", change: 2.1, color: "text-warning" },
  ],
  "social-media": [
    { label: "Followers", value: "8,432", change: 15.2, color: "text-primary-500" },
    { label: "Engagement", value: "4.8%", change: 3.7, color: "text-secondary-500" },
    { label: "Reach", value: "45,120", change: 22.1, color: "text-success" },
    { label: "Shares", value: "1,204", change: -2.4, color: "text-warning" },
  ],
  "email-campaign": [
    { label: "Sent", value: "5,000", change: 0, color: "text-primary-500" },
    { label: "Open Rate", value: "42.3%", change: 5.8, color: "text-secondary-500" },
    { label: "Click Rate", value: "8.7%", change: 1.2, color: "text-success" },
    { label: "Unsubs", value: "12", change: -3.0, color: "text-warning" },
  ],
  sales: [
    { label: "Revenue", value: "$24,580", change: 18.4, color: "text-primary-500" },
    { label: "Orders", value: "342", change: 9.6, color: "text-secondary-500" },
    { label: "AOV", value: "$71.87", change: 4.2, color: "text-success" },
    { label: "Refunds", value: "$840", change: -12.3, color: "text-warning" },
  ],
  "content-performance": [
    { label: "Articles", value: "48", change: 6, color: "text-primary-500" },
    { label: "Total Views", value: "89,120", change: 14.5, color: "text-secondary-500" },
    { label: "Avg. Time", value: "4m 12s", change: 8.3, color: "text-success" },
    { label: "Conversions", value: "234", change: 11.2, color: "text-warning" },
  ],
};

const SAMPLE_PAGES: PageRow[] = [
  { rank: 1, title: "How to Start a Business in Zambia", views: 4821, engagement: "68%" },
  { rank: 2, title: "Best Digital Marketing Strategies", views: 3654, engagement: "55%" },
  { rank: 3, title: "Product Launch Checklist", views: 2987, engagement: "72%" },
  { rank: 4, title: "Email Marketing Guide 2026", views: 2341, engagement: "48%" },
  { rank: 5, title: "Social Media Trends", views: 1892, engagement: "61%" },
];

const SAMPLE_TRAFFIC: TrafficSource[] = [
  { name: "Organic", percentage: 42, color: "bg-primary-500" },
  { name: "Social", percentage: 24, color: "bg-secondary-500" },
  { name: "Email", percentage: 15, color: "bg-success" },
  { name: "Direct", percentage: 12, color: "bg-warning" },
  { name: "Referral", percentage: 7, color: "bg-info" },
];

const SAMPLE_CHART = [65, 45, 72, 58, 80, 68, 90, 75, 55, 82, 70, 95];
const CHART_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ── Component ─────────────────────────────────────────────── */

export default function AnalyticsDashboardWorkspace() {
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [dashboardType, setDashboardType] = useState<DashboardType>("website");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [aiInsights, setAiInsights] = useState("");
  const [goals, setGoals] = useState<GoalItem[]>([
    { id: uid(), name: "Monthly Signups", target: 500, current: 342 },
    { id: uid(), name: "Revenue Target", target: 30000, current: 24580 },
    { id: uid(), name: "Email List Growth", target: 1000, current: 780 },
  ]);

  const kpis = SAMPLE_KPIS[dashboardType];

  /* ── Goal management ────────────────────────────────────── */
  const updateGoal = (id: string, field: keyof Omit<GoalItem, "id">, value: string | number) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const addGoal = () => {
    setGoals((prev) => [...prev, { id: uid(), name: "", target: 100, current: 0 }]);
  };

  const removeGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  /* ── AI Insights ────────────────────────────────────────── */
  const generateInsights = async () => {
    setLoading(true);
    setLoadingAction("insights");
    try {
      const kpiSummary = kpis.map((k) => `${k.label}: ${k.value} (${k.change > 0 ? "+" : ""}${k.change}%)`).join(", ");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Analyze this ${dashboardType} analytics data and provide 4-5 actionable insights. KPIs: ${kpiSummary}. Traffic sources: ${SAMPLE_TRAFFIC.map((t) => `${t.name}: ${t.percentage}%`).join(", ")}. Date range: ${dateRange}. Goals: ${goals.map((g) => `${g.name}: ${g.current}/${g.target}`).join(", ")}. Provide specific, data-driven recommendations. Return plain text with bullet points.`,
            },
          ],
        }),
      });
      const text = await res.text();
      setAiInsights(cleanAIText(text));
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportReport = useCallback(
    (format: "csv" | "text") => {
      if (format === "csv") {
        let csv = "Metric,Value,Change\n";
        kpis.forEach((k) => {
          csv += `"${k.label}","${k.value}","${k.change}%"\n`;
        });
        csv += "\nPage,Views,Engagement\n";
        SAMPLE_PAGES.forEach((p) => {
          csv += `"${p.title}",${p.views},"${p.engagement}"\n`;
        });
        csv += "\nSource,Percentage\n";
        SAMPLE_TRAFFIC.forEach((t) => {
          csv += `"${t.name}",${t.percentage}%\n`;
        });
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${dashboardType}-report.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        let report = `ANALYTICS REPORT — ${dashboardType.toUpperCase()}\n`;
        report += `Date Range: ${DATE_RANGES.find((r) => r.id === dateRange)?.label}\n`;
        report += `${"=".repeat(50)}\n\n`;
        report += `KEY METRICS\n${"-".repeat(30)}\n`;
        kpis.forEach((k) => {
          report += `${k.label}: ${k.value} (${k.change > 0 ? "+" : ""}${k.change}%)\n`;
        });
        report += `\nTOP PAGES\n${"-".repeat(30)}\n`;
        SAMPLE_PAGES.forEach((p) => {
          report += `${p.rank}. ${p.title} — ${p.views} views (${p.engagement})\n`;
        });
        report += `\nTRAFFIC SOURCES\n${"-".repeat(30)}\n`;
        SAMPLE_TRAFFIC.forEach((t) => {
          report += `${t.name}: ${t.percentage}%\n`;
        });
        if (aiInsights) {
          report += `\nAI INSIGHTS\n${"-".repeat(30)}\n${aiInsights}\n`;
        }
        const blob = new Blob([report], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${dashboardType}-report.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [kpis, dashboardType, dateRange, aiInsights]
  );

  const copyInsights = async () => {
    if (!aiInsights) return;
    await navigator.clipboard.writeText(aiInsights);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Chart max ──────────────────────────────────────────── */
  const chartMax = Math.max(...SAMPLE_CHART);

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
          {/* Dashboard Type */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconChart className="size-4 text-primary-500" />
              Dashboard Type
            </h3>
            <div className="space-y-1.5">
              {DASHBOARD_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => setDashboardType(dt.id)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${dashboardType === dt.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconFilter className="size-4 text-primary-500" />
              Date Range
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {DATE_RANGES.map((dr) => (
                <button
                  key={dr.id}
                  onClick={() => setDateRange(dr.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${dateRange === dr.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {dr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Goals</h3>
              <button
                onClick={addGoal}
                className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-primary-500 transition-colors"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>
            {goals.map((goal) => (
              <div key={goal.id} className="space-y-1.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    placeholder="Goal name"
                    value={goal.name}
                    onChange={(e) => updateGoal(goal.id, "name", e.target.value)}
                  />
                  <button onClick={() => removeGoal(goal.id)} className="text-gray-400 hover:text-error transition-colors">
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400">Current</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none"
                      value={goal.current}
                      onChange={(e) => updateGoal(goal.id, "current", Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Target</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none"
                      value={goal.target}
                      onChange={(e) => updateGoal(goal.id, "target", Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, goal.target > 0 ? (goal.current / goal.target) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI Actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              AI Insights
            </h3>
            <button
              onClick={generateInsights}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "insights" ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loadingAction === "insights" ? "Analyzing…" : "Analyze Data"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => exportReport("csv")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors"
              >
                <IconDownload className="size-4" />
                CSV
              </button>
              <button
                onClick={() => exportReport("text")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors"
              >
                <IconDownload className="size-4" />
                Report
              </button>
            </div>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-1">{kpi.label}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-xs font-semibold ${kpi.change > 0 ? "text-success" : kpi.change < 0 ? "text-error" : "text-gray-400"}`}>
                    {kpi.change > 0 ? "↑" : kpi.change < 0 ? "↓" : "→"} {Math.abs(kpi.change)}%
                  </span>
                  <span className="text-[10px] text-gray-400">vs prev.</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Area */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Performance Overview</h3>
            <div className="flex items-end gap-2 h-48">
              {SAMPLE_CHART.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-md bg-primary-500 hover:bg-primary-400 transition-colors"
                      style={{ height: `${(val / chartMax) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400">{CHART_LABELS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Pages Table */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Top Pages / Posts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-4">#</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-4">Title</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2 pr-4">Views</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_PAGES.map((page) => (
                    <tr key={page.rank} className="border-b border-gray-50 dark:border-gray-800/50">
                      <td className="py-2 pr-4 text-xs text-gray-400">{page.rank}</td>
                      <td className="py-2 pr-4 text-xs text-gray-900 dark:text-white font-medium">{page.title}</td>
                      <td className="py-2 pr-4 text-xs text-gray-600 dark:text-gray-300 text-right">{page.views.toLocaleString()}</td>
                      <td className="py-2 text-xs text-primary-500 font-semibold text-right">{page.engagement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Traffic Sources</h3>
            <div className="space-y-3">
              {SAMPLE_TRAFFIC.map((src) => (
                <div key={src.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-300">{src.name}</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{src.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${src.color} transition-all`} style={{ width: `${src.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals / Conversions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Goals & Conversions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {goals.map((goal) => {
                const pct = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
                return (
                  <div key={goal.id} className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{goal.name || "Unnamed Goal"}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-bold text-primary-500">{goal.current.toLocaleString()}</span>
                      <span className="text-xs text-gray-400">/ {goal.target.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-success" : pct >= 60 ? "bg-primary-500" : "bg-warning"}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{pct}% complete</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insights */}
          {aiInsights && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <IconSparkles className="size-4 text-primary-500" />
                  AI Insights
                </h3>
                <button
                  onClick={copyInsights}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {copied ? <IconCheck className="size-3 text-success" /> : <IconCopy className="size-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {aiInsights}
              </div>
            </div>
          )}

          {/* Empty Insights Prompt */}
          {!aiInsights && (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center">
              <IconSparkles className="size-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                Click &quot;Analyze Data&quot; in the settings panel to get AI-powered insights about your analytics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
