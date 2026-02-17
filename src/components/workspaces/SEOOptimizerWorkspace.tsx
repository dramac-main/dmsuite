"use client";

import { useState, useCallback, useMemo } from "react";
import {
  IconChart,
  IconSparkles,
  IconWand,
  IconLoader,
  IconCheck,
  IconCopy,
  IconDownload,
  IconGlobe,
  IconFileText,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type InputMode = "url" | "content";
type CheckStatus = "pass" | "warning" | "fail" | "pending";

interface SEOCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

interface KeywordInfo {
  keyword: string;
  count: number;
  density: number;
}

interface SEOConfig {
  inputMode: InputMode;
  url: string;
  content: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  metaTitle: string;
  metaDescription: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Flesch-Kincaid approximation */
function fleschKincaid(text: string): { grade: number; readability: string } {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length || 1;
  const words = text.trim().split(/\s+/).length || 1;
  const syllables = text
    .toLowerCase()
    .split(/\s+/)
    .reduce((sum, w) => {
      const vowelGroups = w.match(/[aeiouy]+/gi);
      return sum + Math.max(1, vowelGroups ? vowelGroups.length : 1);
    }, 0);

  const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  const rounded = Math.max(1, Math.min(18, Math.round(grade * 10) / 10));

  let readability = "Very Easy";
  if (rounded >= 13) readability = "Very Difficult";
  else if (rounded >= 10) readability = "Difficult";
  else if (rounded >= 8) readability = "Standard";
  else if (rounded >= 6) readability = "Fairly Easy";
  else readability = "Easy";

  return { grade: rounded, readability };
}

/** Calculate keyword density */
function calcKeywordDensity(text: string, keyword: string): KeywordInfo {
  if (!keyword.trim() || !text.trim()) return { keyword, count: 0, density: 0 };
  const words = text.toLowerCase().split(/\s+/);
  const kw = keyword.toLowerCase();
  const count = words.filter((w) => w.includes(kw)).length;
  const density = Math.round((count / words.length) * 1000) / 10;
  return { keyword, count, density };
}

/** Run SEO checks on content */
function runSEOChecks(config: SEOConfig): SEOCheck[] {
  const text = config.content;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const pk = config.primaryKeyword.toLowerCase();

  const checks: SEOCheck[] = [];

  // Title tag
  if (config.metaTitle) {
    const len = config.metaTitle.length;
    checks.push({
      id: uid(),
      label: "Title Tag",
      status: len >= 30 && len <= 60 ? "pass" : len > 0 ? "warning" : "fail",
      detail: config.metaTitle ? `${len} characters (optimal: 30-60)` : "Missing title tag",
    });
  } else {
    checks.push({ id: uid(), label: "Title Tag", status: "fail", detail: "No title tag provided" });
  }

  // Meta description
  if (config.metaDescription) {
    const len = config.metaDescription.length;
    checks.push({
      id: uid(),
      label: "Meta Description",
      status: len >= 120 && len <= 160 ? "pass" : len > 0 ? "warning" : "fail",
      detail: `${len} characters (optimal: 120-160)`,
    });
  } else {
    checks.push({ id: uid(), label: "Meta Description", status: "fail", detail: "No meta description" });
  }

  // H1 presence
  const hasH1 = /^#\s|<h1/i.test(text);
  checks.push({
    id: uid(),
    label: "H1 Heading",
    status: hasH1 ? "pass" : "warning",
    detail: hasH1 ? "H1 heading found" : "No H1 heading detected in content",
  });

  // Keyword density
  if (pk) {
    const density = calcKeywordDensity(text, pk);
    checks.push({
      id: uid(),
      label: "Keyword Density",
      status: density.density >= 1 && density.density <= 3 ? "pass" : density.density > 0 ? "warning" : "fail",
      detail: `"${pk}" appears ${density.count} times (${density.density}%) — optimal: 1-3%`,
    });
  } else {
    checks.push({ id: uid(), label: "Keyword Density", status: "pending", detail: "Enter a primary keyword to check" });
  }

  // Image alts
  const imgCount = (text.match(/<img/gi) || []).length + (text.match(/!\[/g) || []).length;
  const altCount = (text.match(/alt=["'][^"']+["']/gi) || []).length + (text.match(/!\[[^\]]+\]/g) || []).length;
  checks.push({
    id: uid(),
    label: "Image Alt Text",
    status: imgCount === 0 ? "warning" : altCount >= imgCount ? "pass" : "warning",
    detail: imgCount === 0 ? "No images detected" : `${altCount}/${imgCount} images have alt text`,
  });

  // Internal links
  const linkCount = (text.match(/\[.*?\]\(.*?\)/g) || []).length + (text.match(/<a\s/gi) || []).length;
  checks.push({
    id: uid(),
    label: "Internal Links",
    status: linkCount >= 2 ? "pass" : linkCount > 0 ? "warning" : "fail",
    detail: `${linkCount} links found (aim for 2+ internal links)`,
  });

  // Word count
  checks.push({
    id: uid(),
    label: "Word Count",
    status: wordCount >= 300 ? "pass" : wordCount >= 100 ? "warning" : "fail",
    detail: `${wordCount} words (aim for 300+ for SEO)`,
  });

  // Readability
  if (wordCount >= 20) {
    const fk = fleschKincaid(text);
    checks.push({
      id: uid(),
      label: "Readability",
      status: fk.grade <= 10 ? "pass" : fk.grade <= 14 ? "warning" : "fail",
      detail: `Grade ${fk.grade} — ${fk.readability} (aim for grade ≤ 10)`,
    });
  } else {
    checks.push({ id: uid(), label: "Readability", status: "pending", detail: "Need 20+ words to calculate" });
  }

  return checks;
}

/* ── Component ─────────────────────────────────────────────── */

export default function SEOOptimizerWorkspace() {
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [copied, setCopied] = useState(false);
  const [secondaryDraft, setSecondaryDraft] = useState("");

  const [config, setConfig] = useState<SEOConfig>({
    inputMode: "content",
    url: "",
    content: "",
    primaryKeyword: "",
    secondaryKeywords: [],
    metaTitle: "",
    metaDescription: "",
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);

  /* ── Derived values ─────────────────────────────────────── */
  const checks = useMemo(() => runSEOChecks(config), [config]);

  const seoScore = useMemo(() => {
    if (checks.length === 0) return 0;
    const passWeight = 100 / checks.length;
    return Math.round(
      checks.reduce((sum, c) => {
        if (c.status === "pass") return sum + passWeight;
        if (c.status === "warning") return sum + passWeight * 0.5;
        return sum;
      }, 0)
    );
  }, [checks]);

  const scoreColor = seoScore >= 80 ? "text-green-500" : seoScore >= 50 ? "text-yellow-500" : "text-red-500";
  const scoreBg = seoScore >= 80 ? "stroke-green-500" : seoScore >= 50 ? "stroke-yellow-500" : "stroke-red-500";

  const wordCount = config.content.trim() ? config.content.trim().split(/\s+/).length : 0;
  const readability = wordCount >= 20 ? fleschKincaid(config.content) : null;

  const primaryDensity = config.primaryKeyword
    ? calcKeywordDensity(config.content, config.primaryKeyword)
    : null;

  const secondaryDensities = config.secondaryKeywords.map((kw) =>
    calcKeywordDensity(config.content, kw)
  );

  /* ── Secondary keyword management ───────────────────────── */
  const addSecondaryKeyword = () => {
    const kw = secondaryDraft.trim();
    if (kw && !config.secondaryKeywords.includes(kw)) {
      setConfig((p) => ({ ...p, secondaryKeywords: [...p.secondaryKeywords, kw] }));
      setSecondaryDraft("");
    }
  };

  /* ── AI: Get suggestions ────────────────────────────────── */
  const getSuggestions = async () => {
    if (!config.content.trim() && !config.url.trim()) return;
    setLoading(true);
    setLoadingAction("suggestions");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Analyze this content for SEO and provide actionable improvement suggestions. Content: "${config.content.slice(0, 2000)}". Primary keyword: "${config.primaryKeyword}". Meta title: "${config.metaTitle}". Meta description: "${config.metaDescription}". Return JSON: { "suggestions": ["suggestion 1", "suggestion 2", ...] }. Provide 5-8 specific, actionable suggestions.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.suggestions) setSuggestions(data.suggestions);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── AI: Generate meta ──────────────────────────────────── */
  const generateMeta = async () => {
    if (!config.content.trim() && !config.primaryKeyword.trim()) return;
    setLoading(true);
    setLoadingAction("meta");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate an SEO-optimized meta title (30-60 chars) and meta description (120-160 chars) for content about: "${config.primaryKeyword || config.content.slice(0, 200)}". Keywords: ${[config.primaryKeyword, ...config.secondaryKeywords].filter(Boolean).join(", ")}. Return JSON: { "metaTitle": "", "metaDescription": "" }. Make them compelling and keyword-rich.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.metaTitle) setConfig((p) => ({ ...p, metaTitle: data.metaTitle }));
        if (data.metaDescription) setConfig((p) => ({ ...p, metaDescription: data.metaDescription }));
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── Export report ──────────────────────────────────────── */
  const exportReport = () => {
    let report = `SEO Analysis Report\n${"=".repeat(50)}\n\n`;
    report += `Score: ${seoScore}/100\n`;
    report += `Word Count: ${wordCount}\n`;
    if (readability) report += `Readability: Grade ${readability.grade} (${readability.readability})\n`;
    report += `Primary Keyword: ${config.primaryKeyword || "Not set"}\n\n`;

    report += `Meta Title: ${config.metaTitle || "Not set"}\n`;
    report += `Meta Description: ${config.metaDescription || "Not set"}\n\n`;

    report += `Checklist\n${"-".repeat(30)}\n`;
    for (const check of checks) {
      const icon = check.status === "pass" ? "✅" : check.status === "warning" ? "⚠️" : check.status === "fail" ? "❌" : "⏳";
      report += `${icon} ${check.label}: ${check.detail}\n`;
    }

    if (primaryDensity) {
      report += `\nKeyword Density\n${"-".repeat(30)}\n`;
      report += `${primaryDensity.keyword}: ${primaryDensity.count} occurrences (${primaryDensity.density}%)\n`;
      for (const sd of secondaryDensities) {
        report += `${sd.keyword}: ${sd.count} occurrences (${sd.density}%)\n`;
      }
    }

    if (suggestions.length > 0) {
      report += `\nSuggestions\n${"-".repeat(30)}\n`;
      suggestions.forEach((s, i) => {
        report += `${i + 1}. ${s}\n`;
      });
    }

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seo-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Status icon ────────────────────────────────────────── */
  const StatusIcon = ({ status }: { status: CheckStatus }) => {
    if (status === "pass") return <span className="text-green-500 text-sm">✓</span>;
    if (status === "warning") return <span className="text-yellow-500 text-sm">⚠</span>;
    if (status === "fail") return <span className="text-red-500 text-sm">✗</span>;
    return <span className="text-gray-400 text-sm">○</span>;
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
          {/* Input Mode */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconChart className="size-4 text-primary-500" />
              SEO Analyzer
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setConfig((p) => ({ ...p, inputMode: "content" }))}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.inputMode === "content" ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
              >
                <IconFileText className="size-3.5" />
                Content
              </button>
              <button
                onClick={() => setConfig((p) => ({ ...p, inputMode: "url" }))}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.inputMode === "url" ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
              >
                <IconGlobe className="size-3.5" />
                URL
              </button>
            </div>

            {config.inputMode === "url" && (
              <input
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="https://example.com/page"
                value={config.url}
                onChange={(e) => setConfig((p) => ({ ...p, url: e.target.value }))}
              />
            )}
          </div>

          {/* Keywords */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Primary Keyword</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="e.g. digital marketing Zambia"
              value={config.primaryKeyword}
              onChange={(e) => setConfig((p) => ({ ...p, primaryKeyword: e.target.value }))}
            />

            <label className="block text-xs text-gray-400">Secondary Keywords</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="Add keyword…"
                value={secondaryDraft}
                onChange={(e) => setSecondaryDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSecondaryKeyword()}
              />
              <button
                onClick={addSecondaryKeyword}
                className="p-1.5 rounded-lg bg-primary-500 text-gray-950 hover:bg-primary-400 transition-colors"
              >
                +
              </button>
            </div>
            {config.secondaryKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {config.secondaryKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/10 text-primary-500 text-xs cursor-pointer"
                    onClick={() =>
                      setConfig((p) => ({ ...p, secondaryKeywords: p.secondaryKeywords.filter((_, idx) => idx !== i) }))
                    }
                  >
                    {kw} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Meta Tags */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Meta Title</label>
              <span className="text-[10px] text-gray-400">{config.metaTitle.length}/60</span>
            </div>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="Page title for search results…"
              value={config.metaTitle}
              onChange={(e) => setConfig((p) => ({ ...p, metaTitle: e.target.value }))}
            />

            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Meta Description</label>
              <span className="text-[10px] text-gray-400">{config.metaDescription.length}/160</span>
            </div>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              rows={3}
              placeholder="Page description for search results…"
              value={config.metaDescription}
              onChange={(e) => setConfig((p) => ({ ...p, metaDescription: e.target.value }))}
            />
          </div>

          {/* AI Actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              AI SEO Tools
            </h3>
            <button
              onClick={generateMeta}
              disabled={loading || (!config.content.trim() && !config.primaryKeyword.trim())}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "meta" ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              Generate Meta Tags
            </button>
            <button
              onClick={getSuggestions}
              disabled={loading || (!config.content.trim() && !config.url.trim())}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "suggestions" ? <IconLoader className="size-4 animate-spin" /> : <IconSparkles className="size-4" />}
              {loadingAction === "suggestions" ? "Analyzing…" : "Get AI Suggestions"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <button
              onClick={exportReport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <IconDownload className="size-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* SEO Score */}
          <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            {/* Circular Progress */}
            <div className="relative size-28 shrink-0">
              <svg className="size-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(seoScore / 100) * 326.7} 326.7`}
                  className={scoreBg}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${scoreColor}`}>{seoScore}</span>
                <span className="text-[10px] text-gray-400">/ 100</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">SEO Score</h3>
              <p className="text-sm text-gray-400 mt-1">
                {seoScore >= 80
                  ? "Great! Your content is well-optimized for search engines."
                  : seoScore >= 50
                    ? "Good start, but there are improvements to be made."
                    : "Needs work. Follow the checklist below to improve."}
              </p>
              <div className="flex gap-4 mt-3 justify-center sm:justify-start">
                <div className="text-xs text-gray-400">
                  Words: <span className="font-semibold text-gray-900 dark:text-white">{wordCount}</span>
                </div>
                {readability && (
                  <div className="text-xs text-gray-400">
                    Grade: <span className="font-semibold text-gray-900 dark:text-white">{readability.grade}</span>{" "}
                    ({readability.readability})
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Input */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Content</h3>
            <textarea
              className="w-full min-h-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white resize-y font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="Paste your content here for SEO analysis…"
              value={config.content}
              onChange={(e) => setConfig((p) => ({ ...p, content: e.target.value }))}
            />
          </div>

          {/* Checklist */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">SEO Checklist</h3>
            <div className="space-y-2">
              {checks.map((check) => (
                <div key={check.id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <StatusIcon status={check.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{check.label}</p>
                    <p className="text-[10px] text-gray-400">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keyword Density */}
          {(primaryDensity || secondaryDensities.length > 0) && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Keyword Density</h3>
              <div className="space-y-2">
                {primaryDensity && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary-500" />
                      <span className="text-xs font-medium text-gray-900 dark:text-white">{primaryDensity.keyword}</span>
                      <span className="text-[10px] text-gray-400">(primary)</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">{primaryDensity.density}%</span> · {primaryDensity.count} occurrences
                    </div>
                  </div>
                )}
                {secondaryDensities.map((sd, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-secondary-500" />
                      <span className="text-xs font-medium text-gray-900 dark:text-white">{sd.keyword}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">{sd.density}%</span> · {sd.count} occurrences
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <IconSparkles className="size-4 text-primary-500" />
                AI Suggestions
              </h3>
              <ul className="space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <span className="text-primary-500 font-bold shrink-0">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Search Preview */}
          {(config.metaTitle || config.metaDescription) && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Search Result Preview</h3>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <p className="text-blue-600 text-base font-medium truncate">{config.metaTitle || "Page Title"}</p>
                <p className="text-green-700 dark:text-green-500 text-xs mt-0.5">{config.url || "https://example.com/page"}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{config.metaDescription || "Page description will appear here…"}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!config.content && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconChart className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">SEO Optimizer</h3>
              <p className="text-sm text-gray-400 max-w-md">
                Paste your content, set your target keywords, and get instant SEO analysis with actionable recommendations to improve your search rankings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
