"use client";

import { useState, useCallback } from "react";
import {
  IconGlobe,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlus,
  IconTrash,
  IconCheck,
  IconCopy,
  IconMonitor,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type PageGoal = "lead-capture" | "product-launch" | "event-registration" | "coming-soon" | "app-download" | "webinar";
type FontPairing = "modern" | "classic" | "bold" | "minimal";
type SectionType = "hero" | "features" | "testimonials" | "pricing" | "faq" | "cta" | "footer";

interface Section {
  id: string;
  type: SectionType;
  headline: string;
  subtext: string;
  buttonText: string;
  buttonUrl: string;
}

interface LandingTemplate {
  id: string;
  label: string;
  description: string;
  sections: SectionType[];
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}

const PAGE_GOALS: { id: PageGoal; label: string }[] = [
  { id: "lead-capture", label: "Lead Capture" },
  { id: "product-launch", label: "Product Launch" },
  { id: "event-registration", label: "Event Registration" },
  { id: "coming-soon", label: "Coming Soon" },
  { id: "app-download", label: "App Download" },
  { id: "webinar", label: "Webinar" },
];

const SECTION_TYPES: { id: SectionType; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "features", label: "Features" },
  { id: "testimonials", label: "Testimonials" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "cta", label: "CTA" },
  { id: "footer", label: "Footer" },
];

const FONT_PAIRINGS: { id: FontPairing; label: string; desc: string }[] = [
  { id: "modern", label: "Modern", desc: "Inter + Space Grotesk" },
  { id: "classic", label: "Classic", desc: "Georgia + Helvetica" },
  { id: "bold", label: "Bold", desc: "Poppins + Montserrat" },
  { id: "minimal", label: "Minimal", desc: "DM Sans + IBM Plex" },
];

const TEMPLATES: LandingTemplate[] = [
  { id: "saas", label: "SaaS", description: "Software product landing page", sections: ["hero", "features", "pricing", "testimonials", "cta", "footer"] },
  { id: "ecommerce", label: "E-commerce", description: "Product showcase & purchase", sections: ["hero", "features", "testimonials", "pricing", "faq", "footer"] },
  { id: "agency", label: "Agency", description: "Services & portfolio showcase", sections: ["hero", "features", "testimonials", "cta", "footer"] },
  { id: "portfolio", label: "Portfolio", description: "Personal / creative portfolio", sections: ["hero", "features", "cta", "footer"] },
  { id: "restaurant", label: "Restaurant", description: "Menu & reservation focus", sections: ["hero", "features", "testimonials", "cta", "footer"] },
  { id: "real-estate", label: "Real Estate", description: "Property listings & inquiry", sections: ["hero", "features", "pricing", "testimonials", "cta", "footer"] },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeSection(type: SectionType): Section {
  return { id: uid(), type, headline: "", subtext: "", buttonText: "", buttonUrl: "" };
}

/* ── Component ─────────────────────────────────────────────── */

export default function LandingPageWorkspace() {
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);

  const [goal, setGoal] = useState<PageGoal>("lead-capture");
  const [fontPairing, setFontPairing] = useState<FontPairing>("modern");
  const [colors, setColors] = useState<ColorScheme>({ primary: "#8ae600", secondary: "#06b6d4", accent: "#f59e0b" });
  const [sections, setSections] = useState<Section[]>([makeSection("hero"), makeSection("features"), makeSection("cta"), makeSection("footer")]);

  /* ── Section management ─────────────────────────────────── */
  const addSection = (type: SectionType) => {
    setSections((s) => [...s, makeSection(type)]);
  };

  const removeSection = (id: string) => {
    setSections((s) => s.filter((sec) => sec.id !== id));
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const updateSection = (id: string, field: keyof Omit<Section, "id" | "type">, value: string) => {
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, [field]: value } : sec)));
  };

  const applyTemplate = (tpl: LandingTemplate) => {
    setSections(tpl.sections.map((t) => makeSection(t)));
  };

  /* ── AI: Generate Section Content ───────────────────────── */
  const generateSectionContent = async (sectionId: string) => {
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
              content: `Generate landing page content for a "${section.type}" section. Page goal: ${goal}. Font style: ${fontPairing}. Return JSON: { "headline": "...", "subtext": "...", "buttonText": "...", "buttonUrl": "#" }. Make it compelling and conversion-focused. Keep headline under 10 words, subtext 2 sentences max.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        setSections((s) =>
          s.map((sec) =>
            sec.id === sectionId
              ? {
                  ...sec,
                  headline: data.headline || sec.headline,
                  subtext: data.subtext || sec.subtext,
                  buttonText: data.buttonText || sec.buttonText,
                  buttonUrl: data.buttonUrl || sec.buttonUrl,
                }
              : sec
          )
        );
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── Export HTML ─────────────────────────────────────────── */
  const exportHTML = useCallback(() => {
    const sectionHtml = sections
      .map((sec) => {
        const style = sec.type === "hero" ? `background-color:${colors.primary};color:#fff;padding:80px 40px;text-align:center` : "padding:60px 40px;text-align:center";
        return `<section style="${style}"><h2>${sec.headline || sec.type.toUpperCase()}</h2><p>${sec.subtext}</p>${sec.buttonText ? `<a href="${sec.buttonUrl || "#"}" style="display:inline-block;margin-top:16px;padding:12px 32px;background:${colors.accent};color:#fff;border-radius:8px;text-decoration:none">${sec.buttonText}</a>` : ""}</section>`;
      })
      .join("\n");
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Landing Page</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;color:#222}section{border-bottom:1px solid #eee}h2{font-size:2rem;margin-bottom:12px}p{font-size:1.1rem;opacity:.85;max-width:600px;margin:0 auto}</style></head><body>${sectionHtml}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "landing-page.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [sections, colors]);

  const copyHTML = async () => {
    const simpleHtml = sections.map((s) => `<section><h2>${s.headline || s.type}</h2><p>${s.subtext}</p></section>`).join("\n");
    await navigator.clipboard.writeText(simpleHtml);
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
          {/* Page Goal */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconGlobe className="size-4 text-primary-500" />
              Page Goal
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {PAGE_GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${goal === g.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template Gallery */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Templates</h3>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-left hover:border-primary-500 transition-colors"
                >
                  <span className="text-xs font-semibold text-gray-900 dark:text-white block">{tpl.label}</span>
                  <span className="text-[10px] text-gray-400">{tpl.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Color Scheme</h3>
            {(["primary", "secondary", "accent"] as const).map((c) => (
              <div key={c} className="flex items-center gap-3">
                <label className="text-xs text-gray-400 capitalize w-20">{c}</label>
                <input
                  type="color"
                  value={colors[c]}
                  onChange={(e) => setColors((p) => ({ ...p, [c]: e.target.value }))}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                />
                <span className="text-[10px] text-gray-500 font-mono">{colors[c]}</span>
              </div>
            ))}
          </div>

          {/* Font Pairing */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Font Pairing</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {FONT_PAIRINGS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontPairing(f.id)}
                  className={`px-2 py-2 rounded-lg text-left transition-colors ${fontPairing === f.id ? "bg-primary-500/10 border border-primary-500 text-primary-500" : "bg-gray-100 dark:bg-gray-800 border border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  <span className="text-xs font-semibold block">{f.label}</span>
                  <span className="text-[10px] opacity-60">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Section */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Add Section</h3>
            <div className="flex flex-wrap gap-1.5">
              {SECTION_TYPES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => addSection(st.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <IconPlus className="size-3" />
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button
              onClick={exportHTML}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors"
            >
              <IconDownload className="size-4" />
              Export HTML
            </button>
            <button
              onClick={copyHTML}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <IconCheck className="size-4 text-success" /> : <IconCopy className="size-4" />}
              {copied ? "Copied!" : "Copy HTML"}
            </button>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Preview Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <span className="text-xs text-gray-400">{sections.length} sections</span>
            <button
              onClick={() => setMobilePreview((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mobilePreview ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
            >
              <IconMonitor className="size-3.5" />
              {mobilePreview ? "Desktop View" : "Mobile Preview"}
            </button>
          </div>

          {/* Sections */}
          <div className={`space-y-3 mx-auto ${mobilePreview ? "max-w-sm" : ""}`}>
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center size-6 rounded-lg bg-primary-500/10 text-primary-500 text-[10px] font-bold">{idx + 1}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{sec.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveSection(sec.id, -1)} disabled={idx === 0} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 text-xs">▲</button>
                    <button onClick={() => moveSection(sec.id, 1)} disabled={idx === sections.length - 1} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 text-xs">▼</button>
                    <button onClick={() => removeSection(sec.id)} className="p-1 rounded text-gray-400 hover:text-error transition-colors"><IconTrash className="size-3.5" /></button>
                  </div>
                </div>

                {/* Section Fields */}
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Headline</label>
                    <input
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      placeholder="Section headline…"
                      value={sec.headline}
                      onChange={(e) => updateSection(sec.id, "headline", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Subtext</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      rows={2}
                      placeholder="Supporting text…"
                      value={sec.subtext}
                      onChange={(e) => updateSection(sec.id, "subtext", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Button Text</label>
                      <input
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        placeholder="Get Started"
                        value={sec.buttonText}
                        onChange={(e) => updateSection(sec.id, "buttonText", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Button URL</label>
                      <input
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        placeholder="#signup"
                        value={sec.buttonUrl}
                        onChange={(e) => updateSection(sec.id, "buttonUrl", e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => generateSectionContent(sec.id)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-medium hover:bg-primary-500/20 disabled:opacity-50 transition-colors"
                  >
                    {loadingAction === `section-${sec.id}` ? <IconLoader className="size-3 animate-spin" /> : <IconWand className="size-3" />}
                    AI Generate Content
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {sections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconGlobe className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Build Your Landing Page</h3>
              <p className="text-sm text-gray-400 max-w-md">
                Choose a template or add sections from the settings panel to start building your landing page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
