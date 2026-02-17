"use client";

import { useState, useCallback } from "react";
import {
  IconTag,
  IconSparkles,
  IconLoader,
  IconCopy,
  IconCheck,
  IconPlus,
  IconTrash,
  IconDownload,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type Category = "electronics" | "fashion" | "food-beverage" | "beauty" | "home" | "auto" | "services";
type Marketplace = "shopify" | "amazon" | "ebay" | "woocommerce" | "local-market";
type DescLength = "short" | "medium" | "long";
type Tone = "luxury" | "value" | "technical" | "lifestyle" | "eco-friendly";

interface ProductConfig {
  name: string;
  category: Category;
  features: string[];
  targetAudience: string;
  price: string;
  marketplace: Marketplace;
  length: DescLength;
  tone: Tone;
  seoKeywords: string;
  description: string;
}

interface Variation {
  id: string;
  label: string;
  content: string;
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "electronics", label: "Electronics" },
  { id: "fashion", label: "Fashion" },
  { id: "food-beverage", label: "Food & Beverage" },
  { id: "beauty", label: "Beauty" },
  { id: "home", label: "Home" },
  { id: "auto", label: "Auto" },
  { id: "services", label: "Services" },
];

const MARKETPLACES: { id: Marketplace; label: string }[] = [
  { id: "shopify", label: "Shopify" },
  { id: "amazon", label: "Amazon" },
  { id: "ebay", label: "eBay" },
  { id: "woocommerce", label: "WooCommerce" },
  { id: "local-market", label: "Local Market" },
];

const LENGTHS: { id: DescLength; label: string; words: number }[] = [
  { id: "short", label: "Short", words: 50 },
  { id: "medium", label: "Medium", words: 150 },
  { id: "long", label: "Long", words: 300 },
];

const TONES: { id: Tone; label: string }[] = [
  { id: "luxury", label: "Luxury" },
  { id: "value", label: "Value" },
  { id: "technical", label: "Technical" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "eco-friendly", label: "Eco-friendly" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Component ─────────────────────────────────────────────── */

export default function ProductDescriptionWorkspace() {
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [featureDraft, setFeatureDraft] = useState("");

  const [config, setConfig] = useState<ProductConfig>({
    name: "",
    category: "electronics",
    features: [],
    targetAudience: "",
    price: "",
    marketplace: "shopify",
    length: "medium",
    tone: "lifestyle",
    seoKeywords: "",
    description: "",
  });

  const [variations, setVariations] = useState<Variation[]>([]);
  const [activeVariation, setActiveVariation] = useState<string | null>(null);

  /* ── Feature management ─────────────────────────────────── */
  const addFeature = () => {
    const f = featureDraft.trim();
    if (f) {
      setConfig((p) => ({ ...p, features: [...p.features, f] }));
      setFeatureDraft("");
    }
  };

  const removeFeature = (idx: number) => {
    setConfig((p) => ({ ...p, features: p.features.filter((_, i) => i !== idx) }));
  };

  /* ── AI: Generate Description ───────────────────────────── */
  const generate = useCallback(async () => {
    if (!config.name.trim()) return;
    setLoading(true);
    try {
      const wordTarget = LENGTHS.find((l) => l.id === config.length)?.words || 150;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Write 3 product description variations for: "${config.name}". Category: ${config.category}. Key features: ${config.features.join(", ") || "N/A"}. Target audience: "${config.targetAudience || "general consumers"}". Price: K${config.price || "N/A"} ZMW. Marketplace: ${config.marketplace}. Tone: ${config.tone}. Length: ~${wordTarget} words each. SEO keywords: "${config.seoKeywords || "none"}". ${config.description ? `Additional context: ${config.description}` : ""}. Zambian market context. Return JSON: { "variations": [{ "content": "description text" }, { "content": "description text" }, { "content": "description text" }] }. Make each variation unique in approach and structure.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.variations) {
          const vars = data.variations.map((v: { content: string }, i: number) => ({
            id: uid(),
            label: `Variation ${String.fromCharCode(65 + i)}`,
            content: v.content,
          }));
          setVariations(vars);
          setActiveVariation(vars[0]?.id || null);
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [config]);

  /* ── Copy & Export ──────────────────────────────────────── */
  const copyVariation = async (id: string) => {
    const v = variations.find((vr) => vr.id === id);
    if (!v) return;
    await navigator.clipboard.writeText(v.content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportVariation = (id: string) => {
    const v = variations.find((vr) => vr.id === id);
    if (!v) return;
    const blob = new Blob([v.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(config.name || "product").replace(/\s+/g, "-").toLowerCase()}-${v.label.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeContent = variations.find((v) => v.id === activeVariation);

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
          {/* Product Info */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconTag className="size-4 text-primary-500" />
              Product Details
            </h3>

            <label className="block text-xs text-gray-400">Product Name</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="e.g. Smart Solar Charger Pro"
              value={config.name}
              onChange={(e) => setConfig((p) => ({ ...p, name: e.target.value }))}
            />

            <label className="block text-xs text-gray-400">Category</label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setConfig((p) => ({ ...p, category: c.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.category === c.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Price (ZMW)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">K</span>
              <input
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="0.00"
                value={config.price}
                onChange={(e) => setConfig((p) => ({ ...p, price: e.target.value }))}
              />
            </div>

            <label className="block text-xs text-gray-400">Target Audience</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="e.g. Young professionals, homeowners…"
              value={config.targetAudience}
              onChange={(e) => setConfig((p) => ({ ...p, targetAudience: e.target.value }))}
            />
          </div>

          {/* Features */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Key Features</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="Add feature…"
                value={featureDraft}
                onChange={(e) => setFeatureDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFeature()}
              />
              <button
                onClick={addFeature}
                className="p-1.5 rounded-lg bg-primary-500 text-gray-950 hover:bg-primary-400 transition-colors"
              >
                <IconPlus className="size-4" />
              </button>
            </div>
            {config.features.length > 0 && (
              <ul className="space-y-1">
                {config.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5">
                    <span className="flex-1">{f}</span>
                    <button onClick={() => removeFeature(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <IconTrash className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Marketplace & Length & Tone */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Marketplace</label>
            <div className="grid grid-cols-2 gap-1.5">
              {MARKETPLACES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setConfig((p) => ({ ...p, marketplace: m.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.marketplace === m.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <label className="block text-xs text-gray-400 mt-2">Description Length</label>
            <div className="grid grid-cols-3 gap-1.5">
              {LENGTHS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setConfig((p) => ({ ...p, length: l.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.length === l.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {l.label}
                  <span className="block text-[10px] opacity-70">~{l.words}w</span>
                </button>
              ))}
            </div>

            <label className="block text-xs text-gray-400 mt-2">Tone</label>
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

          {/* SEO & AI */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">SEO Keywords</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="e.g. solar charger, portable power, eco…"
              value={config.seoKeywords}
              onChange={(e) => setConfig((p) => ({ ...p, seoKeywords: e.target.value }))}
            />

            <label className="block text-xs text-gray-400">Additional Context</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              rows={2}
              placeholder="Any extra details for AI…"
              value={config.description}
              onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))}
            />

            <button
              onClick={generate}
              disabled={loading || !config.name.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconSparkles className="size-4" />}
              {loading ? "Generating…" : "Generate Descriptions"}
            </button>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Variation Tabs */}
          {variations.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {variations.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVariation(v.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeVariation === v.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}

          {/* Active Variation Editor */}
          {activeContent && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{activeContent.label}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyVariation(activeContent.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {copiedId === activeContent.id ? <IconCheck className="size-3 text-success" /> : <IconCopy className="size-3" />}
                    {copiedId === activeContent.id ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={() => exportVariation(activeContent.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <IconDownload className="size-3" />
                    Export
                  </button>
                </div>
              </div>
              <textarea
                className="w-full min-h-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={activeContent.content}
                onChange={(e) => {
                  const val = e.target.value;
                  setVariations((prev) => prev.map((v) => (v.id === activeContent.id ? { ...v, content: val } : v)));
                }}
              />
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>{activeContent.content.trim().split(/\s+/).length} words</span>
                <span>Marketplace: {MARKETPLACES.find((m) => m.id === config.marketplace)?.label}</span>
              </div>
            </div>
          )}

          {/* Product Summary Card */}
          {config.name && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <h4 className="text-xs text-gray-400 mb-2">Product Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Name:</span>{" "}
                  <span className="text-gray-900 dark:text-white font-medium">{config.name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Category:</span>{" "}
                  <span className="text-gray-900 dark:text-white font-medium">{CATEGORIES.find((c) => c.id === config.category)?.label}</span>
                </div>
                {config.price && (
                  <div>
                    <span className="text-gray-400">Price:</span>{" "}
                    <span className="text-gray-900 dark:text-white font-medium">K{config.price}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Features:</span>{" "}
                  <span className="text-gray-900 dark:text-white font-medium">{config.features.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {variations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconTag className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Product Description Writer</h3>
              <p className="text-sm text-gray-400 max-w-md">
                Enter your product details in the settings panel, then generate AI-powered descriptions tailored for your chosen marketplace and audience.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
