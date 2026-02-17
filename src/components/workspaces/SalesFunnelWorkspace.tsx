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
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type FunnelType = "lead-gen" | "webinar" | "product-launch" | "tripwire" | "consultation";

interface FunnelStage {
  id: string;
  name: string;
  pageTitle: string;
  copy: string;
  ctaText: string;
  conversionRate: number;
}

const FUNNEL_TYPES: { id: FunnelType; label: string }[] = [
  { id: "lead-gen", label: "Lead Gen" },
  { id: "webinar", label: "Webinar" },
  { id: "product-launch", label: "Product Launch" },
  { id: "tripwire", label: "Tripwire" },
  { id: "consultation", label: "Consultation" },
];

const DEFAULT_STAGES: { name: string; rate: number }[] = [
  { name: "Awareness", rate: 100 },
  { name: "Interest", rate: 60 },
  { name: "Decision", rate: 30 },
  { name: "Action", rate: 10 },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeStages(): FunnelStage[] {
  return DEFAULT_STAGES.map((s) => ({
    id: uid(),
    name: s.name,
    pageTitle: "",
    copy: "",
    ctaText: "",
    conversionRate: s.rate,
  }));
}

/* ── Component ─────────────────────────────────────────────── */

export default function SalesFunnelWorkspace() {
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [funnelType, setFunnelType] = useState<FunnelType>("lead-gen");
  const [stages, setStages] = useState<FunnelStage[]>(makeStages());
  const [trafficSource, setTrafficSource] = useState(1000);
  const [price, setPrice] = useState(97);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  /* ── Stage management ───────────────────────────────────── */
  const updateStage = (id: string, field: keyof Omit<FunnelStage, "id" | "name">, value: string | number) => {
    setStages((s) => s.map((st) => (st.id === id ? { ...st, [field]: value } : st)));
  };

  /* ── Calculated metrics ─────────────────────────────────── */
  const getVisitorsAtStage = (idx: number): number => {
    if (idx === 0) return trafficSource;
    const rate = stages[idx].conversionRate / 100;
    return Math.round(getVisitorsAtStage(idx - 1) * rate);
  };

  const finalConversions = getVisitorsAtStage(stages.length - 1);
  const estimatedRevenue = finalConversions * price;
  const overallConversionRate = trafficSource > 0 ? ((finalConversions / trafficSource) * 100).toFixed(2) : "0";

  /* ── AI: Generate Funnel Copy ───────────────────────────── */
  const generateFunnelCopy = async () => {
    setLoading(true);
    setLoadingAction("funnel");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate sales funnel copy for a ${funnelType} funnel with stages: ${stages.map((s) => s.name).join(", ")}. Price point: $${price}. Return JSON: { "stages": [{ "pageTitle": "...", "copy": "...", "ctaText": "..." }] }. Make copy persuasive and conversion-focused. One entry per stage.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.stages && Array.isArray(data.stages)) {
          setStages((prev) =>
            prev.map((st, i) => ({
              ...st,
              pageTitle: data.stages[i]?.pageTitle || st.pageTitle,
              copy: data.stages[i]?.copy || st.copy,
              ctaText: data.stages[i]?.ctaText || st.ctaText,
            }))
          );
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPlan = useCallback(() => {
    let plan = `SALES FUNNEL PLAN — ${funnelType.toUpperCase()}\n`;
    plan += `${"=".repeat(50)}\n\n`;
    plan += `Traffic: ${trafficSource} visitors\nPrice: $${price}\nEstimated Revenue: $${estimatedRevenue.toLocaleString()}\nOverall Conversion: ${overallConversionRate}%\n\n`;
    stages.forEach((st, i) => {
      plan += `STAGE ${i + 1}: ${st.name}\n`;
      plan += `Visitors: ${getVisitorsAtStage(i)}\n`;
      plan += `Page Title: ${st.pageTitle || "(Not set)"}\n`;
      plan += `CTA: ${st.ctaText || "(Not set)"}\n`;
      plan += `Copy:\n${st.copy || "(Not written)"}\n\n`;
    });
    const blob = new Blob([plan], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-funnel-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [stages, funnelType, trafficSource, price, estimatedRevenue, overallConversionRate]);

  const copyPlan = async () => {
    const summary = stages.map((st, i) => `${st.name}: ${getVisitorsAtStage(i)} visitors → ${st.pageTitle || "Untitled"}`).join("\n");
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          {/* Funnel Type */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconChart className="size-4 text-primary-500" />
              Funnel Type
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {FUNNEL_TYPES.map((ft) => (
                <button
                  key={ft.id}
                  onClick={() => setFunnelType(ft.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${funnelType === ft.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {ft.label}
                </button>
              ))}
            </div>
          </div>

          {/* Traffic & Revenue */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Traffic & Revenue</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Monthly Traffic</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={trafficSource}
                onChange={(e) => setTrafficSource(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Product Price ($)</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Per-Stage Conversion Rates */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Conversion Rates</h3>
            {stages.map((st, i) => (
              <div key={st.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-20 truncate">{st.name}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  value={st.conversionRate}
                  onChange={(e) => updateStage(st.id, "conversionRate", Number(e.target.value) || 0)}
                  disabled={i === 0}
                />
                <span className="text-[10px] text-gray-500">%</span>
              </div>
            ))}
          </div>

          {/* AI Actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              AI Tools
            </h3>
            <button
              onClick={generateFunnelCopy}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "funnel" ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loadingAction === "funnel" ? "Generating…" : "Generate Funnel Copy"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button
              onClick={exportPlan}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors"
            >
              <IconDownload className="size-4" />
              Export Funnel Plan
            </button>
            <button
              onClick={copyPlan}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <IconCheck className="size-4 text-success" /> : <IconCopy className="size-4" />}
              {copied ? "Copied!" : "Copy Summary"}
            </button>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Traffic", value: trafficSource.toLocaleString(), color: "text-secondary-500" },
              { label: "Conversions", value: finalConversions.toLocaleString(), color: "text-primary-500" },
              { label: "Revenue", value: `$${estimatedRevenue.toLocaleString()}`, color: "text-success" },
              { label: "Conv. Rate", value: `${overallConversionRate}%`, color: "text-warning" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
                <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-gray-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Funnel Visualizer */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Funnel Stages</h3>
            <div className="space-y-0">
              {stages.map((st, idx) => {
                const visitors = getVisitorsAtStage(idx);
                const widthPct = trafficSource > 0 ? Math.max(20, (visitors / trafficSource) * 100) : 100;
                const isExpanded = expandedStage === st.id;

                return (
                  <div key={st.id}>
                    {/* Connector */}
                    {idx > 0 && (
                      <div className="flex justify-center py-1">
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                      </div>
                    )}

                    {/* Stage Bar */}
                    <button
                      onClick={() => setExpandedStage(isExpanded ? null : st.id)}
                      className="w-full"
                    >
                      <div
                        className="mx-auto rounded-xl py-3 px-4 flex items-center justify-between transition-all cursor-pointer hover:opacity-90"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: `hsl(${140 - idx * 30}, 70%, ${45 + idx * 5}%)`,
                        }}
                      >
                        <span className="text-sm font-semibold text-white">{st.name}</span>
                        <span className="text-sm font-bold text-white">{visitors.toLocaleString()}</span>
                      </div>
                    </button>

                    {/* Expanded Config */}
                    {isExpanded && (
                      <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Page Title</label>
                          <input
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            placeholder={`${st.name} page title…`}
                            value={st.pageTitle}
                            onChange={(e) => updateStage(st.id, "pageTitle", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Copy</label>
                          <textarea
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            rows={4}
                            placeholder="Stage copy…"
                            value={st.copy}
                            onChange={(e) => updateStage(st.id, "copy", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">CTA Button Text</label>
                          <input
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            placeholder="Get Started Now"
                            value={st.ctaText}
                            onChange={(e) => updateStage(st.id, "ctaText", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Calculator */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Revenue Calculator</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-mono">{trafficSource.toLocaleString()}</span>
              <span className="text-gray-400">visitors ×</span>
              <span className="font-mono">{overallConversionRate}%</span>
              <span className="text-gray-400">conv. =</span>
              <span className="font-semibold text-primary-500">{finalConversions}</span>
              <span className="text-gray-400">sales ×</span>
              <span className="font-mono">${price}</span>
              <span className="text-gray-400">=</span>
              <span className="text-lg font-bold text-success">${estimatedRevenue.toLocaleString()}</span>
            </div>
          </div>

          {/* Empty State */}
          {stages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconChart className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Design Your Sales Funnel</h3>
              <p className="text-sm text-gray-400 max-w-md">
                Configure your funnel type and traffic in the settings panel to start planning your conversion strategy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
