"use client";

// =============================================================================
// DMSuite — Color Palette Generator Workspace (Realtime Colors–inspired)
// Professional UI/UX, fully responsive, dark/light swap, rich previews.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createColorPaletteManifest } from "@/lib/chiko/manifests/color-palette";
import {
  useColorPaletteStore,
  PRESET_PALETTES,
  FONT_PAIRINGS,
  FONT_OPTIONS,
  FONT_CATALOG,
  contrastRatio,
  hexToRgb,
  hexToHsl,
  hslToHex,
  type ColorRoles,
  type PreviewMode,
  type ExportFormat,
  type CuratedFontPairing,
  type PresetPalette,
} from "@/stores/color-palette";

// ---------------------------------------------------------------------------
// Google Fonts loader
// ---------------------------------------------------------------------------

const loadedFonts = new Set<string>();

function loadGoogleFont(name: string) {
  if (typeof window === "undefined" || loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const meta = FONT_CATALOG.find((f) => f.name === name);
  const weights = meta?.weights || "400;700";
  const id = `gf-${name.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
}

// ---------------------------------------------------------------------------
// Clipboard helper
// ---------------------------------------------------------------------------

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

// ---------------------------------------------------------------------------
// Tiny SVG icons (inline for performance — no extra imports needed)
// ---------------------------------------------------------------------------

const Ico = {
  shuffle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  ),
  swap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5-3h4a1 1 0 0 1 1 1v1H9V4a1 1 0 0 1 1-1z" />
    </svg>
  ),
  chevDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  type: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  contrast: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" /><path d="M12 2v20" /><path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Color swatch with interactive color picker */
function ColorSwatch({
  role,
  hex,
  label,
  onChange,
}: {
  role: string;
  hex: string;
  label: string;
  onChange: (hex: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(hex);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInputVal(hex); }, [hex]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyToClipboard(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleSubmit = () => {
    const v = inputVal.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      onChange(v);
    } else if (/^[0-9a-fA-F]{6}$/.test(v)) {
      onChange(`#${v}`);
    }
    setEditing(false);
  };

  return (
    <div className="group flex flex-col gap-2">
      <div className="relative">
        {/* Color preview circle */}
        <label className="relative block w-full aspect-square rounded-2xl cursor-pointer overflow-hidden border-2 border-white/10 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl">
          <div className="absolute inset-0" style={{ backgroundColor: hex }} />
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        {/* Copy button overlay */}
        <button
          onClick={handleCopy}
          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          title="Copy hex"
        >
          {copied ? Ico.check : Ico.copy}
        </button>
      </div>
      {/* Label */}
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        {editing ? (
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full text-center text-xs font-mono bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 outline-none focus:border-primary-500"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-mono text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            {hex.toUpperCase()}
          </button>
        )}
      </div>
    </div>
  );
}

/** Contrast badge */
function ContrastBadge({ ratio, small }: { ratio: number; small?: boolean }) {
  const label = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "FAIL";
  const color =
    ratio >= 7
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : ratio >= 4.5
        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
        : "bg-red-500/20 text-red-400 border-red-500/30";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${color} ${small ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"}`}>
      {label} <span className={small ? "text-[9px]" : "text-[11px]"}>{ratio.toFixed(1)}</span>
    </span>
  );
}

/** Dropdown selector */
function Dropdown({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-gray-400">{icon}</span>}
      <label className="text-[11px] uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-colors appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview layouts
// ---------------------------------------------------------------------------

function PreviewLanding({ colors, fonts }: { colors: ColorRoles; fonts: { heading: string; body: string } }) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: colors.background, borderColor: colors.secondary, fontFamily: `'${fonts.body}', sans-serif` }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 border-b" style={{ borderColor: colors.secondary }}>
        <span className="font-bold text-sm sm:text-base" style={{ color: colors.primary, fontFamily: `'${fonts.heading}', sans-serif` }}>Brand</span>
        <div className="hidden sm:flex gap-4 text-xs" style={{ color: colors.text }}>
          <span>Features</span><span>Pricing</span><span>About</span>
        </div>
        <button className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: colors.primary, color: colors.background }}>Get Started</button>
      </nav>
      {/* Hero */}
      <div className="px-4 sm:px-8 py-8 sm:py-12 text-center">
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-3 leading-tight" style={{ color: colors.text, fontFamily: `'${fonts.heading}', sans-serif` }}>
          Build something amazing today
        </h1>
        <p className="text-sm sm:text-base max-w-lg mx-auto mb-6 leading-relaxed" style={{ color: `${colors.text}cc` }}>
          The all-in-one platform for teams who want to ship faster. Start free, scale as you grow.
        </p>
        <div className="flex justify-center gap-3">
          <button className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-transform hover:scale-105" style={{ backgroundColor: colors.primary, color: colors.background }}>
            Start Free Trial
          </button>
          <button className="px-5 py-2.5 rounded-lg text-sm font-semibold border" style={{ color: colors.primary, borderColor: colors.primary }}>
            Learn More
          </button>
        </div>
      </div>
      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-8 pb-8">
        {[
          { title: "Lightning Fast", desc: "Optimized for speed at every level" },
          { title: "Secure by Default", desc: "Enterprise-grade security built in" },
          { title: "Always Available", desc: "99.99% uptime guaranteed SLA" },
        ].map((f) => (
          <div key={f.title} className="p-4 rounded-xl" style={{ backgroundColor: colors.secondary }}>
            <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
              <span className="text-xs font-bold" style={{ color: colors.background }}>✦</span>
            </div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: colors.text, fontFamily: `'${fonts.heading}', sans-serif` }}>{f.title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: `${colors.text}99` }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewDashboard({ colors, fonts }: { colors: ColorRoles; fonts: { heading: string; body: string } }) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: colors.background, borderColor: colors.secondary, fontFamily: `'${fonts.body}', sans-serif` }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: colors.secondary }}>
        <span className="font-bold text-sm" style={{ color: colors.primary, fontFamily: `'${fonts.heading}', sans-serif` }}>Dashboard</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: colors.accent }} />
        </div>
      </div>
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden sm:block w-40 border-r p-3 space-y-1" style={{ borderColor: colors.secondary }}>
          {["Overview", "Analytics", "Projects", "Settings"].map((item, i) => (
            <div
              key={item}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium"
              style={{
                backgroundColor: i === 0 ? colors.primary : "transparent",
                color: i === 0 ? colors.background : colors.text,
              }}
            >
              {item}
            </div>
          ))}
        </div>
        {/* Main */}
        <div className="flex-1 p-4">
          <h2 className="text-base font-bold mb-3" style={{ color: colors.text, fontFamily: `'${fonts.heading}', sans-serif` }}>Overview</h2>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {[
              { label: "Revenue", value: "$24,500" },
              { label: "Users", value: "1,248" },
              { label: "Growth", value: "+18.2%" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: `${colors.text}88` }}>{s.label}</p>
                <p className="text-sm sm:text-lg font-bold" style={{ color: colors.text }}>{s.value}</p>
              </div>
            ))}
          </div>
          {/* Chart placeholder */}
          <div className="rounded-lg p-4 h-28" style={{ backgroundColor: colors.secondary }}>
            <div className="flex items-end gap-1.5 h-full">
              {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${h}%`,
                    backgroundColor: i === 11 ? colors.accent : colors.primary,
                    opacity: i === 11 ? 1 : 0.6 + (i * 0.03),
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewBlog({ colors, fonts }: { colors: ColorRoles; fonts: { heading: string; body: string } }) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: colors.background, borderColor: colors.secondary, fontFamily: `'${fonts.body}', sans-serif` }}>
      <div className="px-4 sm:px-8 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.secondary }}>
        <span className="font-bold text-sm" style={{ color: colors.text, fontFamily: `'${fonts.heading}', sans-serif` }}>The Blog</span>
        <span className="text-xs" style={{ color: colors.primary }}>Subscribe</span>
      </div>
      <div className="px-4 sm:px-8 py-6 max-w-2xl">
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.accent, color: colors.background }}>Featured</span>
        </div>
        <h1 className="text-lg sm:text-2xl font-bold mb-2 leading-tight" style={{ color: colors.text, fontFamily: `'${fonts.heading}', sans-serif` }}>
          The Future of Design Systems in 2025
        </h1>
        <p className="text-xs mb-4" style={{ color: `${colors.text}88` }}>
          January 15, 2025 · 8 min read
        </p>
        <p className="text-sm leading-relaxed mb-4" style={{ color: `${colors.text}dd` }}>
          Design systems have evolved from simple style guides to comprehensive frameworks that define how organizations build digital products. In this article, we explore the emerging trends shaping the future of design at scale.
        </p>
        <p className="text-sm leading-relaxed mb-4" style={{ color: `${colors.text}dd` }}>
          From AI-powered theming to component-level analytics, the landscape is changing rapidly. Here's what you need to know about staying ahead.
        </p>
        <blockquote className="border-l-4 pl-4 my-4 py-1" style={{ borderColor: colors.primary }}>
          <p className="text-sm italic" style={{ color: colors.text }}>"Good design is about making complex things simple."</p>
        </blockquote>
        <div className="flex gap-2 mt-4">
          {["Design", "Systems", "Trends"].map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ color: colors.primary, borderColor: colors.secondary }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewEcommerce({ colors, fonts }: { colors: ColorRoles; fonts: { heading: string; body: string } }) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: colors.background, borderColor: colors.secondary, fontFamily: `'${fonts.body}', sans-serif` }}>
      <div className="px-4 sm:px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: colors.secondary }}>
        <span className="font-bold text-sm" style={{ color: colors.text, fontFamily: `'${fonts.heading}', sans-serif` }}>Store</span>
        <div className="flex gap-3 text-xs" style={{ color: colors.text }}>
          <span>Shop</span><span>Cart (2)</span>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: "Premium Headphones", price: "$349", badge: "New" },
            { name: "Wireless Keyboard", price: "$129", badge: null },
            { name: "Smart Watch Pro", price: "$499", badge: "Sale" },
          ].map((product) => (
            <div key={product.name} className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.secondary }}>
              <div className="aspect-square relative" style={{ backgroundColor: `${colors.primary}15` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: `${colors.primary}30` }} />
                </div>
                {product.badge && (
                  <span
                    className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: product.badge === "Sale" ? colors.accent : colors.primary,
                      color: colors.background,
                    }}
                  >
                    {product.badge}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-xs font-semibold mb-1" style={{ color: colors.text, fontFamily: `'${fonts.heading}', sans-serif` }}>{product.name}</h3>
                <p className="text-sm font-bold mb-2" style={{ color: colors.primary }}>{product.price}</p>
                <button className="w-full py-1.5 rounded-md text-[10px] font-semibold" style={{ backgroundColor: colors.primary, color: colors.background }}>
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export code generators
// ---------------------------------------------------------------------------

function generateExportCode(colors: ColorRoles, fonts: { heading: string; body: string }, format: ExportFormat): string {
  switch (format) {
    case "css":
      return `:root {\n  --color-text: ${colors.text};\n  --color-background: ${colors.background};\n  --color-primary: ${colors.primary};\n  --color-secondary: ${colors.secondary};\n  --color-accent: ${colors.accent};\n\n  --font-heading: '${fonts.heading}', sans-serif;\n  --font-body: '${fonts.body}', sans-serif;\n}`;
    case "scss":
      return `$color-text: ${colors.text};\n$color-background: ${colors.background};\n$color-primary: ${colors.primary};\n$color-secondary: ${colors.secondary};\n$color-accent: ${colors.accent};\n\n$font-heading: '${fonts.heading}', sans-serif;\n$font-body: '${fonts.body}', sans-serif;`;
    case "tailwind":
      return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        text: '${colors.text}',\n        background: '${colors.background}',\n        primary: '${colors.primary}',\n        secondary: '${colors.secondary}',\n        accent: '${colors.accent}',\n      },\n      fontFamily: {\n        heading: ['${fonts.heading}', 'sans-serif'],\n        body: ['${fonts.body}', 'sans-serif'],\n      },\n    },\n  },\n};`;
    case "json":
      return JSON.stringify({ colors, fonts }, null, 2);
    default:
      return JSON.stringify({ colors, fonts }, null, 2);
  }
}

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type SidebarTab = "colors" | "presets" | "fonts" | "contrast" | "saved" | "export";

const SIDEBAR_TABS: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { id: "colors", label: "Colors", icon: Ico.grid },
  { id: "presets", label: "Presets", icon: Ico.layers },
  { id: "fonts", label: "Fonts", icon: Ico.type },
  { id: "contrast", label: "A11y", icon: Ico.contrast },
  { id: "saved", label: "Saved", icon: Ico.heart },
  { id: "export", label: "Export", icon: Ico.code },
];

// ---------------------------------------------------------------------------
// Main workspace component
// ---------------------------------------------------------------------------

export default function ColorPaletteWorkspace() {
  // Chiko manifest
  useChikoActions(useCallback(() => createColorPaletteManifest(), []));

  // Store
  const colors = useColorPaletteStore((s) => s.colors);
  const fonts = useColorPaletteStore((s) => s.fonts);
  const previewMode = useColorPaletteStore((s) => s.previewMode);
  const savedPalettes = useColorPaletteStore((s) => s.savedPalettes);
  const setColor = useColorPaletteStore((s) => s.setColor);
  const setFont = useColorPaletteStore((s) => s.setFont);
  const setFonts = useColorPaletteStore((s) => s.setFonts);
  const setPreviewMode = useColorPaletteStore((s) => s.setPreviewMode);
  const randomize = useColorPaletteStore((s) => s.randomize);
  const swapTextAndBg = useColorPaletteStore((s) => s.swapTextAndBg);
  const applyPreset = useColorPaletteStore((s) => s.applyPreset);
  const savePalette = useColorPaletteStore((s) => s.savePalette);
  const deletePalette = useColorPaletteStore((s) => s.deletePalette);
  const loadPalette = useColorPaletteStore((s) => s.loadPalette);
  const reset = useColorPaletteStore((s) => s.reset);

  // Local state
  const [activeTab, setActiveTab] = useState<SidebarTab>("colors");
  const [copiedExport, setCopiedExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("css");
  const [saveName, setSaveName] = useState("");
  const [presetSearch, setPresetSearch] = useState("");
  const [fontPairingSearch, setFontPairingSearch] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"sidebar" | "preview">("preview");

  // Load fonts
  useEffect(() => {
    loadGoogleFont(fonts.heading);
    loadGoogleFont(fonts.body);
  }, [fonts]);

  // Detect dark palette
  const isDarkPalette = useMemo(() => {
    const [, , l] = hexToHsl(colors.background);
    return l < 50;
  }, [colors.background]);

  // Contrast pairs
  const contrastPairs = useMemo(() => [
    { label: "Text / BG", fg: colors.text, bg: colors.background },
    { label: "Primary / BG", fg: colors.primary, bg: colors.background },
    { label: "Accent / BG", fg: colors.accent, bg: colors.background },
    { label: "Text / Secondary", fg: colors.text, bg: colors.secondary },
    { label: "Primary / Secondary", fg: colors.primary, bg: colors.secondary },
  ], [colors]);

  // Export code
  const exportCode = useMemo(
    () => generateExportCode(colors, fonts, exportFormat),
    [colors, fonts, exportFormat]
  );

  // Filter presets
  const filteredPresets = useMemo(() => {
    if (!presetSearch.trim()) return PRESET_PALETTES;
    const q = presetSearch.toLowerCase();
    return PRESET_PALETTES.filter((p) => p.id.includes(q) || p.name.toLowerCase().includes(q));
  }, [presetSearch]);

  // Filter font pairings
  const filteredPairings = useMemo(() => {
    if (!fontPairingSearch.trim()) return FONT_PAIRINGS;
    const q = fontPairingSearch.toLowerCase();
    return FONT_PAIRINGS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.vibe.toLowerCase().includes(q) || p.heading.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
    );
  }, [fontPairingSearch]);

  // Handle save
  const handleSave = () => {
    if (!saveName.trim()) {
      savePalette(`Palette ${savedPalettes.length + 1}`);
    } else {
      savePalette(saveName.trim());
    }
    setSaveName("");
  };

  // Handle copy export
  const handleCopyExport = async () => {
    await copyToClipboard(exportCode);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 1500);
  };

  // ---------------------------------------------------------------------------
  // Sidebar panel content
  // ---------------------------------------------------------------------------

  const renderSidebarContent = () => {
    switch (activeTab) {
      case "colors":
        return (
          <div className="space-y-5">
            {/* Color swatches */}
            <div className="grid grid-cols-5 gap-3">
              {(["text", "background", "primary", "secondary", "accent"] as const).map((role) => (
                <ColorSwatch
                  key={role}
                  role={role}
                  hex={colors[role]}
                  label={role === "background" ? "BG" : role.slice(0, 3).toUpperCase()}
                  onChange={(hex) => setColor(role, hex)}
                />
              ))}
            </div>
            {/* Quick contrast check */}
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800/50 space-y-2">
              <p className="text-[11px] uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400">Quick Contrast</p>
              {contrastPairs.slice(0, 3).map((pair) => {
                const ratio = contrastRatio(pair.fg, pair.bg);
                return (
                  <div key={pair.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{pair.label}</span>
                    <ContrastBadge ratio={ratio} small />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "presets":
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search presets..."
              value={presetSearch}
              onChange={(e) => setPresetSearch(e.target.value)}
              className="w-full text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500 transition-colors"
            />
            <div className="space-y-1.5 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1 scrollbar-thin">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors text-left group"
                >
                  {/* Mini palette preview */}
                  <div className="flex gap-0.5 shrink-0">
                    {(["text", "background", "primary", "secondary", "accent"] as const).map((role) => (
                      <div
                        key={role}
                        className="w-4 h-8 first:rounded-l-md last:rounded-r-md"
                        style={{ backgroundColor: preset.colors[role] }}
                      />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">{preset.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "fonts":
        return (
          <div className="space-y-4">
            {/* Individual selectors */}
            <Dropdown
              label="Heading"
              value={fonts.heading}
              options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
              onChange={(v) => setFont("heading", v)}
              icon={Ico.type}
            />
            <Dropdown
              label="Body"
              value={fonts.body}
              options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
              onChange={(v) => setFont("body", v)}
              icon={Ico.type}
            />
            {/* Font pairings */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-[11px] uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-2">Curated Pairings</p>
              <input
                type="text"
                placeholder="Search pairings..."
                value={fontPairingSearch}
                onChange={(e) => setFontPairingSearch(e.target.value)}
                className="w-full text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500 transition-colors mb-2"
              />
              <div className="space-y-1 max-h-[calc(100vh-28rem)] overflow-y-auto pr-1 scrollbar-thin">
                {filteredPairings.map((fp) => {
                  const isActive = fonts.heading === fp.heading && fonts.body === fp.body;
                  return (
                    <button
                      key={fp.id}
                      onClick={() => {
                        setFonts({ heading: fp.heading, body: fp.body });
                        loadGoogleFont(fp.heading);
                        loadGoogleFont(fp.body);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors ${isActive ? "bg-primary-500/10 border border-primary-500/30" : "hover:bg-gray-100 dark:hover:bg-gray-800/60 border border-transparent"}`}
                    >
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{fp.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {fp.heading} / {fp.body} — <span className="italic">{fp.vibe}</span>
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "contrast":
        return (
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400">WCAG Contrast Ratios</p>
            {contrastPairs.map((pair) => {
              const ratio = contrastRatio(pair.fg, pair.bg);
              return (
                <div key={pair.label} className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{pair.label}</span>
                    <ContrastBadge ratio={ratio} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md border border-white/10" style={{ backgroundColor: pair.bg }}>
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: pair.fg }}>Aa</div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">{ratio.toFixed(2)}:1</span>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "saved":
        return (
          <div className="space-y-3">
            {/* Save form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Palette name..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500"
              />
              <button
                onClick={handleSave}
                className="px-3 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                {Ico.save}
              </button>
            </div>
            {/* List */}
            {savedPalettes.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">No saved palettes yet</p>
            ) : (
              <div className="space-y-1.5 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1 scrollbar-thin">
                {savedPalettes.map((pal) => (
                  <div
                    key={pal.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors group"
                  >
                    <button onClick={() => loadPalette(pal)} className="flex-1 flex items-center gap-2 text-left min-w-0">
                      <div className="flex gap-0.5 shrink-0">
                        {(["text", "background", "primary", "secondary", "accent"] as const).map((role) => (
                          <div key={role} className="w-3 h-6 first:rounded-l last:rounded-r" style={{ backgroundColor: pal.colors[role] }} />
                        ))}
                      </div>
                      <span className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">{pal.name}</span>
                    </button>
                    <button
                      onClick={() => deletePalette(pal.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {Ico.trash}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "export":
        return (
          <div className="space-y-3">
            <div className="flex gap-1.5">
              {(["css", "tailwind", "scss", "json"] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${exportFormat === fmt ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="relative">
              <pre className="text-xs font-mono bg-gray-900 text-gray-200 rounded-xl p-4 overflow-x-auto max-h-64 scrollbar-thin">
                {exportCode}
              </pre>
              <button
                onClick={handleCopyExport}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              >
                {copiedExport ? Ico.check : Ico.copy}
              </button>
            </div>
          </div>
        );
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-gray-950">
      {/* ── Top toolbar ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
        {/* Randomize */}
        <button
          onClick={randomize}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 active:scale-95 transition-all shadow-sm"
          title="Generate random palette"
        >
          {Ico.shuffle}
          <span className="hidden sm:inline">Randomize</span>
        </button>

        {/* Swap (dark/light toggle) */}
        <button
          onClick={swapTextAndBg}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-700 active:scale-95 transition-all"
          title={isDarkPalette ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkPalette ? Ico.sun : Ico.moon}
          <span className="hidden sm:inline">{isDarkPalette ? "Light" : "Dark"}</span>
        </button>

        {/* Preview mode selector */}
        <div className="hidden md:flex items-center gap-1 ml-2 px-1 py-0.5 rounded-lg bg-gray-200 dark:bg-gray-800">
          {(["landing", "dashboard", "blog", "ecommerce"] as PreviewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                previewMode === mode
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {mode === "ecommerce" ? "Shop" : mode}
            </button>
          ))}
        </div>

        {/* Mobile preview mode */}
        <select
          value={previewMode}
          onChange={(e) => setPreviewMode(e.target.value as PreviewMode)}
          className="md:hidden ml-1 text-xs bg-gray-200 dark:bg-gray-800 border-none rounded-lg px-2 py-1.5 outline-none appearance-none text-gray-700 dark:text-gray-300"
        >
          <option value="landing">Landing</option>
          <option value="dashboard">Dashboard</option>
          <option value="blog">Blog</option>
          <option value="ecommerce">Shop</option>
        </select>

        <div className="flex-1" />

        {/* Reset */}
        <button
          onClick={reset}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title="Reset to defaults"
        >
          Reset
        </button>
      </div>

      {/* ── Mobile tab toggle ── */}
      <div className="md:hidden flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setMobilePanel("preview")}
          className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${mobilePanel === "preview" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-b-2 border-primary-500" : "text-gray-500 dark:text-gray-400"}`}
        >
          {Ico.eye} Preview
        </button>
        <button
          onClick={() => setMobilePanel("sidebar")}
          className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${mobilePanel === "sidebar" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-b-2 border-primary-500" : "text-gray-500 dark:text-gray-400"}`}
        >
          {Ico.grid} Controls
        </button>
      </div>

      {/* ── Main body ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Sidebar (left panel) ── */}
        <div className={`w-full md:w-80 lg:w-[22rem] shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden bg-white dark:bg-gray-950 ${mobilePanel === "sidebar" ? "flex" : "hidden md:flex"}`}>
          {/* Sidebar tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 px-2 shrink-0 overflow-x-auto scrollbar-thin">
            {SIDEBAR_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-500"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            {renderSidebarContent()}
          </div>
        </div>

        {/* ── Preview (right panel) ── */}
        <div className={`flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900/50 ${mobilePanel === "preview" ? "block" : "hidden md:block"}`}>
          <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Color strip header */}
            <div className="flex rounded-xl overflow-hidden mb-6 shadow-lg h-12 sm:h-16">
              {(["text", "background", "primary", "secondary", "accent"] as const).map((role) => (
                <div key={role} className="flex-1 relative group" style={{ backgroundColor: colors[role] }}>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold"
                    style={{ color: contrastRatio("#ffffff", colors[role]) > 3 ? "#ffffff" : "#000000" }}
                  >
                    {colors[role].toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* Preview layout */}
            {previewMode === "landing" && <PreviewLanding colors={colors} fonts={fonts} />}
            {previewMode === "dashboard" && <PreviewDashboard colors={colors} fonts={fonts} />}
            {previewMode === "blog" && <PreviewBlog colors={colors} fonts={fonts} />}
            {previewMode === "ecommerce" && <PreviewEcommerce colors={colors} fonts={fonts} />}

            {/* Font preview section */}
            <div className="mt-6 p-4 sm:p-6 rounded-xl border" style={{ backgroundColor: colors.background, borderColor: colors.secondary }}>
              <p className="text-[10px] uppercase tracking-wider font-medium mb-3 text-gray-400 dark:text-gray-500">Typography Preview</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: `${colors.text}66` }}>Heading — {fonts.heading}</p>
                  <h2 className="text-xl sm:text-2xl font-bold" style={{ color: colors.text, fontFamily: `'${fonts.heading}', sans-serif` }}>
                    The quick brown fox jumps over the lazy dog
                  </h2>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: `${colors.text}66` }}>Body — {fonts.body}</p>
                  <p className="text-sm leading-relaxed" style={{ color: `${colors.text}dd`, fontFamily: `'${fonts.body}', sans-serif` }}>
                    Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed. The arrangement of type involves selecting typefaces, point sizes, line lengths, line-spacing, and letter-spacing.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.primary, color: colors.background }}>Primary Button</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.accent, color: colors.background }}>Accent Button</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ borderColor: colors.primary, color: colors.primary }}>Outlined</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.secondary, color: colors.text }}>Secondary</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
