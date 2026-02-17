"use client";

import { useState, useCallback, useRef } from "react";
import {
  IconBookOpen,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
  IconCheck,
  IconPlus,
  IconTrash,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type Tone = "professional" | "casual" | "academic" | "friendly" | "authoritative" | "humorous";

interface BlogSection {
  id: string;
  heading: string;
  content: string;
  expanded: boolean;
}

interface BlogConfig {
  title: string;
  topic: string;
  tone: Tone;
  wordCountTarget: number;
  seoKeywords: string[];
  description: string;
}

const TONES: { id: Tone; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "academic", label: "Academic" },
  { id: "friendly", label: "Friendly" },
  { id: "authoritative", label: "Authoritative" },
  { id: "humorous", label: "Humorous" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function readingTime(wc: number): string {
  const mins = Math.max(1, Math.ceil(wc / 200));
  return `${mins} min read`;
}

/* ── Component ─────────────────────────────────────────────── */

export default function BlogWriterWorkspace() {
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const keywordInputRef = useRef<HTMLInputElement>(null);
  const [keywordDraft, setKeywordDraft] = useState("");

  const [config, setConfig] = useState<BlogConfig>({
    title: "",
    topic: "",
    tone: "professional",
    wordCountTarget: 1500,
    seoKeywords: [],
    description: "",
  });

  const [sections, setSections] = useState<BlogSection[]>([]);
  const [fullArticle, setFullArticle] = useState("");

  /* ── Keyword management ─────────────────────────────────── */
  const addKeyword = () => {
    const kw = keywordDraft.trim();
    if (kw && !config.seoKeywords.includes(kw)) {
      setConfig((p) => ({ ...p, seoKeywords: [...p.seoKeywords, kw] }));
      setKeywordDraft("");
    }
  };

  const removeKeyword = (kw: string) => {
    setConfig((p) => ({ ...p, seoKeywords: p.seoKeywords.filter((k) => k !== kw) }));
  };

  /* ── Section management ─────────────────────────────────── */
  const toggleSection = (id: string) => {
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, expanded: !sec.expanded } : sec)));
  };

  const updateSectionContent = (id: string, content: string) => {
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, content } : sec)));
  };

  /* ── AI: Generate Outline ───────────────────────────────── */
  const generateOutline = async () => {
    if (!config.topic.trim()) return;
    setLoading(true);
    setLoadingAction("outline");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a blog article outline for the topic: "${config.topic}". Title: "${config.title || config.topic}". Tone: ${config.tone}. Target word count: ${config.wordCountTarget}. SEO keywords: ${config.seoKeywords.join(", ") || "none"}. Return JSON: { "sections": [{ "heading": "Section Title", "content": "" }] }. Generate 5-8 sections with descriptive headings. Do not include content, just headings.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.sections) {
          setSections(
            data.sections.map((s: { heading: string; content: string }) => ({
              id: uid(),
              heading: s.heading,
              content: s.content || "",
              expanded: true,
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

  /* ── AI: Write Section ──────────────────────────────────── */
  const writeSection = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    setLoading(true);
    setLoadingAction(`section-${sectionId}`);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Write the content for a blog section titled "${section.heading}" for the article "${config.title || config.topic}". Tone: ${config.tone}. SEO keywords to naturally include: ${config.seoKeywords.join(", ") || "none"}. Write approximately ${Math.round(config.wordCountTarget / sections.length)} words. Return only the section content as plain text paragraphs (no JSON).`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      updateSectionContent(sectionId, clean);
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── AI: Write Full Article ─────────────────────────────── */
  const writeFullArticle = async () => {
    if (!config.topic.trim()) return;
    setLoading(true);
    setLoadingAction("full");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Write a complete blog article about "${config.topic}". Title: "${config.title || config.topic}". Tone: ${config.tone}. Target word count: ${config.wordCountTarget}. SEO keywords: ${config.seoKeywords.join(", ") || "none"}. Include introduction, ${sections.length > 0 ? sections.map((s) => s.heading).join(", ") : "3-5 well-structured sections"}, and conclusion. Format with Markdown headings (##) and paragraphs.`,
            },
          ],
        }),
      });
      const text = await res.text();
      setFullArticle(cleanAIText(text));
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── Copy & Export ──────────────────────────────────────── */
  const getArticleText = useCallback((): string => {
    if (fullArticle) return fullArticle;
    let md = `# ${config.title || config.topic}\n\n`;
    for (const sec of sections) {
      md += `## ${sec.heading}\n\n${sec.content}\n\n`;
    }
    return md.trim();
  }, [fullArticle, config.title, config.topic, sections]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getArticleText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportFile = (format: "md" | "html") => {
    const text = getArticleText();
    let content = text;
    let ext = "md";
    let mime = "text/markdown";
    if (format === "html") {
      const lines = text.split("\n");
      content = lines
        .map((l) => {
          if (l.startsWith("# ")) return `<h1>${l.slice(2)}</h1>`;
          if (l.startsWith("## ")) return `<h2>${l.slice(3)}</h2>`;
          if (l.startsWith("### ")) return `<h3>${l.slice(4)}</h3>`;
          if (l.trim()) return `<p>${l}</p>`;
          return "";
        })
        .join("\n");
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${config.title || "Blog"}</title></head><body>\n${content}\n</body></html>`;
      ext = "html";
      mime = "text/html";
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(config.title || "blog-article").replace(/\s+/g, "-").toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Computed values ────────────────────────────────────── */
  const totalWords = fullArticle
    ? wordCount(fullArticle)
    : sections.reduce((sum, s) => sum + wordCount(s.content), 0);
  const progress = Math.min(100, Math.round((totalWords / config.wordCountTarget) * 100));

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
          {/* Title & Topic */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconBookOpen className="size-4 text-primary-500" />
              Blog Settings
            </h3>

            <label className="block text-xs text-gray-400">Article Title</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="Enter article title…"
              value={config.title}
              onChange={(e) => setConfig((p) => ({ ...p, title: e.target.value }))}
            />

            <label className="block text-xs text-gray-400">Topic / Brief</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              rows={3}
              placeholder="What is this article about?"
              value={config.topic}
              onChange={(e) => setConfig((p) => ({ ...p, topic: e.target.value }))}
            />
          </div>

          {/* Tone */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Tone</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setConfig((p) => ({ ...p, tone: t.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.tone === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Word Count Target */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">
              Word Count Target: <span className="text-gray-900 dark:text-white font-semibold">{config.wordCountTarget}</span>
            </label>
            <input
              type="range"
              min={300}
              max={5000}
              step={100}
              value={config.wordCountTarget}
              onChange={(e) => setConfig((p) => ({ ...p, wordCountTarget: Number(e.target.value) }))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>300</span>
              <span>5000</span>
            </div>
          </div>

          {/* SEO Keywords */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">SEO Keywords</label>
            <div className="flex gap-2">
              <input
                ref={keywordInputRef}
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="Add keyword…"
                value={keywordDraft}
                onChange={(e) => setKeywordDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              />
              <button
                onClick={addKeyword}
                className="p-1.5 rounded-lg bg-primary-500 text-gray-950 hover:bg-primary-400 transition-colors"
              >
                <IconPlus className="size-4" />
              </button>
            </div>
            {config.seoKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {config.seoKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/10 text-primary-500 text-xs"
                  >
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-primary-300">
                      <IconTrash className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI Actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              AI Writer
            </h3>
            <button
              onClick={generateOutline}
              disabled={loading || !config.topic.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "outline" ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              Generate Outline
            </button>
            <button
              onClick={writeFullArticle}
              disabled={loading || !config.topic.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "full" ? <IconLoader className="size-4 animate-spin" /> : <IconSparkles className="size-4" />}
              {loadingAction === "full" ? "Writing…" : "Write Full Article"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <IconCheck className="size-4 text-success" /> : <IconCopy className="size-4" />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => exportFile("md")}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <IconDownload className="size-3.5" />
                Export MD
              </button>
              <button
                onClick={() => exportFile("html")}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <IconDownload className="size-3.5" />
                Export HTML
              </button>
            </div>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <div className="text-xs text-gray-400">
              Words: <span className="text-gray-900 dark:text-white font-semibold">{totalWords}</span>
              <span className="text-gray-500"> / {config.wordCountTarget}</span>
            </div>
            <div className="text-xs text-gray-400">
              Reading time: <span className="text-gray-900 dark:text-white font-semibold">{readingTime(totalWords)}</span>
            </div>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-primary-500">{progress}%</span>
            <button
              onClick={() => setShowPreview((p) => !p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${showPreview ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
            >
              {showPreview ? "Editor" : "Preview"}
            </button>
          </div>

          {/* Outline Sections */}
          {sections.length > 0 && !fullArticle && !showPreview && (
            <div className="space-y-2">
              {sections.map((sec) => (
                <div key={sec.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                  <button
                    onClick={() => toggleSection(sec.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{sec.heading}</span>
                    <span className="text-gray-400 text-xs">{sec.expanded ? "▼" : "▶"}</span>
                  </button>
                  {sec.expanded && (
                    <div className="px-4 pb-4 space-y-2">
                      <textarea
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        rows={6}
                        placeholder="Write or AI-generate this section…"
                        value={sec.content}
                        onChange={(e) => updateSectionContent(sec.id, e.target.value)}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">{wordCount(sec.content)} words</span>
                        <button
                          onClick={() => writeSection(sec.id)}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-medium hover:bg-primary-500/20 disabled:opacity-50 transition-colors"
                        >
                          {loadingAction === `section-${sec.id}` ? (
                            <IconLoader className="size-3 animate-spin" />
                          ) : (
                            <IconWand className="size-3" />
                          )}
                          AI Write Section
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Full Article Editor / Preview */}
          {(fullArticle || sections.length === 0) && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              {showPreview ? (
                <div className="prose prose-sm dark:prose-invert max-w-none min-h-96">
                  {getArticleText()
                    .split("\n")
                    .map((line, i) => {
                      if (line.startsWith("# ")) return <h1 key={i}>{line.slice(2)}</h1>;
                      if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
                      if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
                      if (line.trim()) return <p key={i}>{line}</p>;
                      return <br key={i} />;
                    })}
                </div>
              ) : (
                <textarea
                  className="w-full min-h-96 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white resize-y font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="Start writing your article here, or use the AI tools in the settings panel…"
                  value={fullArticle || getArticleText()}
                  onChange={(e) => setFullArticle(e.target.value)}
                />
              )}
            </div>
          )}

          {/* Empty State */}
          {sections.length === 0 && !fullArticle && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconBookOpen className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start Your Blog Post</h3>
              <p className="text-sm text-gray-400 max-w-md">
                Enter a topic in the settings panel, generate an outline, and let AI help you write each section — or dive in and write the full article yourself.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
