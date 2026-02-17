"use client";

import { useState, useCallback } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconCopy,
  IconCheck,
  IconMaximize,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type ComponentKind =
  | "button"
  | "card"
  | "input"
  | "modal"
  | "navbar"
  | "hero"
  | "pricing"
  | "footer"
  | "alert"
  | "badge";

type Framework = "react" | "vue" | "html" | "tailwind";
type StyleVariant = "solid" | "outline" | "ghost" | "gradient";
type ComponentSize = "sm" | "md" | "lg";

interface ComponentConfig {
  kind: ComponentKind;
  framework: Framework;
  variant: StyleVariant;
  size: ComponentSize;
  colorTheme: string;
  borderRadius: number;
}

const COMPONENT_KINDS: { id: ComponentKind; label: string }[] = [
  { id: "button", label: "Button" },
  { id: "card", label: "Card" },
  { id: "input", label: "Input" },
  { id: "modal", label: "Modal" },
  { id: "navbar", label: "Navbar" },
  { id: "hero", label: "Hero Section" },
  { id: "pricing", label: "Pricing Table" },
  { id: "footer", label: "Footer" },
  { id: "alert", label: "Alert" },
  { id: "badge", label: "Badge" },
];

const FRAMEWORKS: { id: Framework; label: string }[] = [
  { id: "react", label: "React" },
  { id: "vue", label: "Vue" },
  { id: "html", label: "HTML/CSS" },
  { id: "tailwind", label: "Tailwind" },
];

const STYLE_VARIANTS: { id: StyleVariant; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "outline", label: "Outline" },
  { id: "ghost", label: "Ghost" },
  { id: "gradient", label: "Gradient" },
];

const SIZES: { id: ComponentSize; label: string }[] = [
  { id: "sm", label: "SM" },
  { id: "md", label: "MD" },
  { id: "lg", label: "LG" },
];

const COLOR_THEMES = [
  { name: "Lime", value: "#8ae600" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Red", value: "#ef4444" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Pink", value: "#ec4899" },
  { name: "Gray", value: "#6b7280" },
];

/* ── Preview HTML generators ──────────────────────────────── */

function buildPreviewHTML(cfg: ComponentConfig): string {
  const { kind, variant, size, colorTheme, borderRadius } = cfg;
  const r = `${borderRadius}px`;
  const pad = size === "sm" ? "8px 16px" : size === "lg" ? "16px 32px" : "12px 24px";
  const font = size === "sm" ? "13px" : size === "lg" ? "18px" : "15px";

  const base = `font-family:Inter,system-ui,sans-serif;border-radius:${r};font-size:${font};`;
  const bg =
    variant === "solid"
      ? `background:${colorTheme};color:#fff;border:none;`
      : variant === "outline"
        ? `background:transparent;color:${colorTheme};border:2px solid ${colorTheme};`
        : variant === "ghost"
          ? `background:transparent;color:${colorTheme};border:none;`
          : `background:linear-gradient(135deg,${colorTheme},#1e293b);color:#fff;border:none;`;

  switch (kind) {
    case "button":
      return `<button style="${base}${bg}padding:${pad};cursor:pointer;font-weight:600;">Button</button>`;
    case "badge":
      return `<span style="${base}${bg}padding:4px 12px;display:inline-block;font-weight:600;font-size:12px;">Badge</span>`;
    case "alert":
      return `<div style="${base}${bg}padding:${pad};display:flex;align-items:center;gap:8px;">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/></svg>
        <span>This is an alert message.</span>
      </div>`;
    case "input":
      return `<div style="font-family:Inter,system-ui,sans-serif;">
        <label style="display:block;margin-bottom:6px;font-size:13px;color:#94a3b8;">Label</label>
        <input type="text" placeholder="Enter value…" style="${base}padding:${pad};width:260px;background:#1e293b;color:#fff;border:1px solid ${colorTheme}40;outline:none;" />
      </div>`;
    case "card":
      return `<div style="${base}background:#1e293b;border:1px solid ${colorTheme}30;padding:24px;max-width:320px;">
        <h3 style="margin:0 0 8px;color:#fff;font-size:16px;font-weight:700;">Card Title</h3>
        <p style="margin:0 0 16px;color:#94a3b8;font-size:13px;line-height:1.5;">This is a sample card component with some placeholder content to demonstrate the layout.</p>
        <button style="${base}${bg}padding:8px 16px;cursor:pointer;font-weight:600;font-size:13px;">Action</button>
      </div>`;
    case "modal":
      return `<div style="background:#0f172a;border-radius:${r};border:1px solid ${colorTheme}30;padding:32px;max-width:400px;font-family:Inter,system-ui,sans-serif;position:relative;">
        <h2 style="margin:0 0 8px;color:#fff;font-size:18px;font-weight:700;">Modal Title</h2>
        <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;">Are you sure you want to continue? This action cannot be undone.</p>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button style="padding:8px 16px;border-radius:${r};background:#334155;color:#fff;border:none;cursor:pointer;font-size:13px;">Cancel</button>
          <button style="padding:8px 16px;border-radius:${r};${bg}cursor:pointer;font-weight:600;font-size:13px;">Confirm</button>
        </div>
      </div>`;
    case "navbar":
      return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:#0f172a;border-radius:${r};border:1px solid ${colorTheme}20;font-family:Inter,system-ui,sans-serif;">
        <span style="font-weight:700;color:${colorTheme};font-size:16px;">Brand</span>
        <div style="display:flex;gap:20px;">
          <a style="color:#e2e8f0;text-decoration:none;font-size:13px;">Home</a>
          <a style="color:#94a3b8;text-decoration:none;font-size:13px;">About</a>
          <a style="color:#94a3b8;text-decoration:none;font-size:13px;">Contact</a>
        </div>
        <button style="padding:6px 16px;border-radius:${r};${bg}cursor:pointer;font-weight:600;font-size:13px;">Sign Up</button>
      </nav>`;
    case "hero":
      return `<div style="text-align:center;padding:48px 32px;background:linear-gradient(180deg,#0f172a,#1e293b);border-radius:${r};font-family:Inter,system-ui,sans-serif;">
        <h1 style="margin:0 0 12px;color:#fff;font-size:28px;font-weight:800;">Build Amazing Products</h1>
        <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;max-width:480px;margin-left:auto;margin-right:auto;line-height:1.6;">Create stunning web applications with our powerful design toolkit and AI-powered workflows.</p>
        <button style="padding:12px 32px;border-radius:${r};${bg}cursor:pointer;font-weight:700;font-size:15px;">Get Started</button>
      </div>`;
    case "pricing":
      return `<div style="background:#0f172a;border-radius:${r};border:2px solid ${colorTheme};padding:32px;max-width:280px;text-align:center;font-family:Inter,system-ui,sans-serif;">
        <p style="margin:0 0 4px;color:${colorTheme};font-size:13px;font-weight:600;text-transform:uppercase;">Pro Plan</p>
        <p style="margin:0 0 16px;color:#fff;font-size:36px;font-weight:800;">$29<span style="font-size:14px;color:#94a3b8;">/mo</span></p>
        <ul style="list-style:none;padding:0;margin:0 0 24px;text-align:left;color:#cbd5e1;font-size:13px;line-height:2;">
          <li>✓ Unlimited projects</li><li>✓ Priority support</li><li>✓ Custom domains</li>
        </ul>
        <button style="width:100%;padding:10px;border-radius:${r};${bg}cursor:pointer;font-weight:700;font-size:14px;">Choose Plan</button>
      </div>`;
    case "footer":
      return `<footer style="display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:#0f172a;border-radius:${r};border-top:1px solid ${colorTheme}20;font-family:Inter,system-ui,sans-serif;">
        <span style="color:#64748b;font-size:12px;">© 2026 Brand. All rights reserved.</span>
        <div style="display:flex;gap:16px;">
          <a style="color:#94a3b8;font-size:12px;text-decoration:none;">Privacy</a>
          <a style="color:#94a3b8;font-size:12px;text-decoration:none;">Terms</a>
          <a style="color:#94a3b8;font-size:12px;text-decoration:none;">Contact</a>
        </div>
      </footer>`;
    default:
      return `<div style="padding:24px;color:#94a3b8;">Select a component</div>`;
  }
}

/* ── Component ─────────────────────────────────────────────── */

export default function UIComponentWorkspace() {
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [copied, setCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const [config, setConfig] = useState<ComponentConfig>({
    kind: "button",
    framework: "react",
    variant: "solid",
    size: "md",
    colorTheme: "#8ae600",
    borderRadius: 8,
  });

  const previewHTML = buildPreviewHTML(config);

  /* ── AI: Generate Component ─────────────────────────────── */
  const generateComponent = async () => {
    setLoading(true);
    try {
      const kind = COMPONENT_KINDS.find((c) => c.id === config.kind)?.label ?? config.kind;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a ${kind} UI component using ${FRAMEWORKS.find((f) => f.id === config.framework)?.label ?? config.framework}. Style: ${config.variant}. Size: ${config.size}. Color theme: ${config.colorTheme}. Border radius: ${config.borderRadius}px. Return ONLY the code for the component with no explanations. Make it production-ready, accessible, and well-structured.`,
            },
          ],
        }),
      });
      const text = await res.text();
      setGeneratedCode(cleanAIText(text));
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  /* ── Copy code ──────────────────────────────────────────── */
  const copyCode = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
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
        <div
          className={`w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto ${mobileTab !== "settings" ? "hidden lg:block" : ""}`}
        >
          {/* Component Type */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconMaximize className="size-4 text-primary-500" />
              Component
            </h3>
            <label className="block text-xs text-gray-400">Component Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {COMPONENT_KINDS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setConfig((p) => ({ ...p, kind: c.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.kind === c.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Framework */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Framework</label>
            <div className="grid grid-cols-2 gap-1.5">
              {FRAMEWORKS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setConfig((p) => ({ ...p, framework: f.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.framework === f.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style Variant */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Style Variant</label>
            <div className="grid grid-cols-2 gap-1.5">
              {STYLE_VARIANTS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setConfig((p) => ({ ...p, variant: v.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.variant === v.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Size</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setConfig((p) => ({ ...p, size: s.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.size === s.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Theme */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Color Theme</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_THEMES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setConfig((p) => ({ ...p, colorTheme: c.value }))}
                  className={`size-8 rounded-full border-2 transition-transform hover:scale-110 ${config.colorTheme === c.value ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.colorTheme}
                onChange={(e) => setConfig((p) => ({ ...p, colorTheme: e.target.value }))}
                className="size-8 rounded cursor-pointer bg-transparent border-0"
              />
              <input
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={config.colorTheme}
                onChange={(e) => setConfig((p) => ({ ...p, colorTheme: e.target.value }))}
              />
            </div>
          </div>

          {/* Border Radius */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">
              Border Radius: <span className="text-gray-900 dark:text-white font-semibold">{config.borderRadius}px</span>
            </label>
            <input
              type="range"
              min={0}
              max={32}
              step={1}
              value={config.borderRadius}
              onChange={(e) => setConfig((p) => ({ ...p, borderRadius: Number(e.target.value) }))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>0</span>
              <span>32px</span>
            </div>
          </div>

          {/* AI Generate */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              AI Generator
            </h3>
            <button
              onClick={generateComponent}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <IconLoader className="size-4 animate-spin" />
              ) : (
                <IconWand className="size-4" />
              )}
              {loading ? "Generating…" : "Generate Component"}
            </button>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div
          className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}
        >
          {/* Live Preview */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-400">Live Preview</span>
              <button
                onClick={() => setFullscreen((p) => !p)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <IconMaximize className="size-4" />
              </button>
            </div>
            <div
              className={`flex items-center justify-center bg-gray-950 ${fullscreen ? "min-h-screen" : "min-h-64"} p-8 transition-all`}
            >
              <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
            </div>
          </div>

          {/* Variants Gallery */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Variant Gallery</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STYLE_VARIANTS.map((v) => (
                <div key={v.id} className="space-y-2">
                  <div className="flex items-center justify-center bg-gray-950 rounded-lg p-4 min-h-20">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: buildPreviewHTML({ ...config, variant: v.id }),
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 text-center font-medium">{v.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Code */}
          {generatedCode && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-400">Generated Code</span>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  {copied ? (
                    <>
                      <IconCheck className="size-3 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <IconCopy className="size-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs text-gray-300 bg-gray-950 font-mono leading-relaxed max-h-96">
                <code>{generatedCode}</code>
              </pre>
            </div>
          )}

          {/* Empty State */}
          {!generatedCode && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconMaximize className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Generate Component Code
              </h3>
              <p className="text-sm text-gray-400 max-w-md">
                Configure your component in the settings panel, preview it live above, then use AI to generate production-ready code.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
