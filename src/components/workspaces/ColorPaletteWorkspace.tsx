"use client";

// =============================================================================
// DMSuite — Color Palette Generator Workspace (Realtime Colors Inspired)
// Visualise your 5-colour palette on a real website layout in real time.
// Text · Background · Primary · Secondary · Accent + Font pairing.
// =============================================================================

import { useState, useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import {
  IconRefresh,
  IconCopy,
  IconCheck,
  IconDownload,
  IconChevronDown,
  IconEye,
  IconType,
  IconDroplet,
  IconPalette,
  IconSparkles,
  IconPlus,
  IconTrash,
  IconStar,
} from "@/components/icons";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createColorPaletteManifest } from "@/lib/chiko/manifests/color-palette";
import {
  useColorPaletteStore,
  PRESET_PALETTES,
  FONT_OPTIONS,
  type ColorRoles,
  type PreviewMode,
} from "@/stores/color-palette";

// ---------------------------------------------------------------------------
// Google Fonts loader
// ---------------------------------------------------------------------------

const loadedFonts = new Set<string>();

function loadGoogleFont(family: string) {
  if (loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

// ---------------------------------------------------------------------------
// WCAG contrast helpers
// ---------------------------------------------------------------------------

function hexToLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagBadge(fg: string, bg: string) {
  const ratio = contrastRatio(fg, bg);
  if (ratio >= 7) return { label: "AAA", color: "#16a34a" };
  if (ratio >= 4.5) return { label: "AA", color: "#2563eb" };
  if (ratio >= 3) return { label: "AA18", color: "#f59e0b" };
  return { label: "Fail", color: "#dc2626" };
}

// ---------------------------------------------------------------------------
// Export generators
// ---------------------------------------------------------------------------

function exportCSS(c: ColorRoles, fonts: { heading: string; body: string }) {
  return `:root {
  --color-text: ${c.text};
  --color-background: ${c.background};
  --color-primary: ${c.primary};
  --color-secondary: ${c.secondary};
  --color-accent: ${c.accent};
  --font-heading: '${fonts.heading}', sans-serif;
  --font-body: '${fonts.body}', sans-serif;
}`;
}

function exportTailwind(c: ColorRoles) {
  return `@theme inline {
  --color-text: ${c.text};
  --color-background: ${c.background};
  --color-primary: ${c.primary};
  --color-secondary: ${c.secondary};
  --color-accent: ${c.accent};
}`;
}

function exportSCSS(c: ColorRoles, fonts: { heading: string; body: string }) {
  return `$color-text: ${c.text};
$color-background: ${c.background};
$color-primary: ${c.primary};
$color-secondary: ${c.secondary};
$color-accent: ${c.accent};
$font-heading: '${fonts.heading}', sans-serif;
$font-body: '${fonts.body}', sans-serif;`;
}

function exportJSON(c: ColorRoles, fonts: { heading: string; body: string }) {
  return JSON.stringify({ colors: c, fonts }, null, 2);
}

function exportSVG(c: ColorRoles) {
  const roles = Object.entries(c);
  const w = 60, gap = 4, pad = 16;
  const totalW = pad * 2 + roles.length * w + (roles.length - 1) * gap;
  const h = 100;
  const rects = roles.map(([label, hex], i) => {
    const x = pad + i * (w + gap);
    return `  <rect x="${x}" y="${pad}" width="${w}" height="${h - 40}" rx="8" fill="${hex}" />
  <text x="${x + w / 2}" y="${h - 8}" text-anchor="middle" font-size="9" font-family="sans-serif" fill="#666">${label}</text>
  <text x="${x + w / 2}" y="${h + 4}" text-anchor="middle" font-size="8" font-family="monospace" fill="#999">${hex}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${h + 12}" width="${totalW}" height="${h + 12}">\n${rects.join("\n")}\n</svg>`;
}

// ---------------------------------------------------------------------------
// Click-outside hook
// ---------------------------------------------------------------------------

function useClickOutside(ref: RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// ---------------------------------------------------------------------------
// Safe clipboard write
// ---------------------------------------------------------------------------

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

// ---------------------------------------------------------------------------
// Tiny color swatch component
// ---------------------------------------------------------------------------

function ColorSwatch({ color, role, onChange }: { color: string; role: string; onChange: (hex: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [hex, setHex] = useState(color);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setHex(color); }, [color]);

  const handleHexChange = (v: string) => {
    setHex(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
  };

  const handleCopy = () => {
    copyToClipboard(color).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={() => inputRef.current?.click()}
        className="relative w-14 h-14 rounded-xl border-2 border-white/10 shadow-lg transition-transform hover:scale-110 cursor-pointer"
        style={{ backgroundColor: color }}
        title={`Pick ${role} color`}
      >
        <input
          ref={inputRef}
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </button>
      <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
        {role}
      </span>
      {editing ? (
        <input
          className="w-20 text-center text-xs font-mono bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-gray-800 dark:text-gray-200 outline-none"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
          autoFocus
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          onContextMenu={(e) => { e.preventDefault(); handleCopy(); }}
          className="text-xs font-mono text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-text"
          title="Click to edit · Right-click to copy"
        >
          {color.toUpperCase()}
        </button>
      )}
      <button
        onClick={handleCopy}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title="Copy hex"
      >
        {copied ? <IconCheck className="w-3.5 h-3.5 text-green-500" /> : <IconCopy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview Layouts
// ---------------------------------------------------------------------------

function LandingPreview({ c, fonts }: { c: ColorRoles; fonts: { heading: string; body: string } }) {
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: c.background, fontFamily: `'${fonts.body}', sans-serif` }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: c.secondary }}>
        <span className="text-lg font-bold" style={{ color: c.primary, fontFamily: `'${fonts.heading}', sans-serif` }}>YourBrand</span>
        <div className="flex gap-4 text-sm" style={{ color: c.text }}>
          <span>Features</span><span>Pricing</span><span>About</span>
        </div>
        <button className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: c.primary, color: c.background }}>
          Sign Up
        </button>
      </nav>
      {/* Hero */}
      <section className="px-8 py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: c.text, fontFamily: `'${fonts.heading}', sans-serif` }}>
          Build something beautiful
        </h1>
        <p className="max-w-lg mx-auto mb-8 leading-relaxed" style={{ color: c.text, opacity: 0.75 }}>
          A modern toolkit for designers and developers. Ship fast, look great, delight every user on every device.
        </p>
        <div className="flex justify-center gap-3">
          <button className="px-6 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: c.primary, color: c.background }}>
            Get Started
          </button>
          <button className="px-6 py-2.5 rounded-lg font-semibold border-2 transition-opacity hover:opacity-90" style={{ borderColor: c.accent, color: c.accent }}>
            Learn More
          </button>
        </div>
      </section>
      {/* Feature Cards */}
      <section className="px-8 pb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {["Fast Performance", "Beautiful Design", "Easy Integration"].map((t, i) => (
          <div key={i} className="p-5 rounded-xl" style={{ backgroundColor: c.secondary }}>
            <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: i === 2 ? c.accent : c.primary, color: c.background }}>
              {["⚡", "🎨", "🔗"][i]}
            </div>
            <h3 className="font-semibold mb-1.5" style={{ color: c.text, fontFamily: `'${fonts.heading}', sans-serif` }}>{t}</h3>
            <p className="text-sm leading-relaxed" style={{ color: c.text, opacity: 0.7 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.
            </p>
          </div>
        ))}
      </section>
      {/* CTA Banner */}
      <section className="mx-8 mb-8 p-8 rounded-xl text-center" style={{ backgroundColor: c.primary }}>
        <h2 className="text-xl font-bold mb-2" style={{ color: c.background, fontFamily: `'${fonts.heading}', sans-serif` }}>Ready to get started?</h2>
        <p className="text-sm mb-4" style={{ color: c.background, opacity: 0.85 }}>Join thousands of creators building with our platform.</p>
        <button className="px-6 py-2 rounded-lg font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: c.background, color: c.primary }}>
          Start Free Trial
        </button>
      </section>
      {/* Footer */}
      <footer className="px-8 py-6 text-center text-xs border-t" style={{ color: c.text, opacity: 0.5, borderColor: c.secondary }}>
        © 2025 YourBrand. All rights reserved.
      </footer>
    </div>
  );
}

function DashboardPreview({ c, fonts }: { c: ColorRoles; fonts: { heading: string; body: string } }) {
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: c.background, fontFamily: `'${fonts.body}', sans-serif` }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: c.secondary }}>
        <span className="font-bold" style={{ color: c.primary, fontFamily: `'${fonts.heading}', sans-serif` }}>Dashboard</span>
        <div className="flex gap-2">
          <div className="w-7 h-7 rounded-full" style={{ backgroundColor: c.accent }} />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-5">
        {[["Revenue", "$42,580", "+12%"], ["Users", "8,429", "+5%"], ["Orders", "1,243", "+18%"]].map(([label, val, delta], i) => (
          <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: c.secondary }}>
            <p className="text-xs mb-1" style={{ color: c.text, opacity: 0.6 }}>{label}</p>
            <p className="text-xl font-bold" style={{ color: c.text, fontFamily: `'${fonts.heading}', sans-serif` }}>{val}</p>
            <span className="text-xs font-medium" style={{ color: c.accent }}>{delta}</span>
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="mx-5 mb-5 rounded-xl overflow-hidden" style={{ backgroundColor: c.secondary }}>
        <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold" style={{ color: c.text, opacity: 0.5 }}>
          <span>Name</span><span>Email</span><span>Status</span><span>Amount</span>
        </div>
        {[
          ["Alice Chen", "alice@mail.com", "Active", "$2,450"],
          ["Bob Smith", "bob@mail.com", "Pending", "$1,820"],
          ["Carol Wu", "carol@mail.com", "Active", "$3,100"],
        ].map(([name, email, status, amount], i) => (
          <div key={i} className="grid grid-cols-4 px-4 py-3 text-sm border-t" style={{ borderColor: c.background, color: c.text }}>
            <span className="font-medium">{name}</span>
            <span style={{ opacity: 0.7 }}>{email}</span>
            <span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: status === "Active" ? c.primary : c.accent, color: c.background }}>
                {status}
              </span>
            </span>
            <span className="font-semibold">{amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogPreview({ c, fonts }: { c: ColorRoles; fonts: { heading: string; body: string } }) {
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: c.background, fontFamily: `'${fonts.body}', sans-serif` }}>
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: c.secondary }}>
        <span className="font-bold" style={{ color: c.text, fontFamily: `'${fonts.heading}', sans-serif` }}>The Blog</span>
        <div className="flex gap-3 text-sm" style={{ color: c.text, opacity: 0.6 }}>
          <span>Home</span><span>Archive</span><span>About</span>
        </div>
      </div>
      {/* Featured */}
      <div className="p-6">
        <div className="rounded-xl p-6 mb-4" style={{ backgroundColor: c.secondary }}>
          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: c.accent, color: c.background }}>Featured</span>
          <h2 className="text-2xl font-bold mt-3 mb-2" style={{ color: c.text, fontFamily: `'${fonts.heading}', sans-serif` }}>
            The Art of Color Theory in Modern Design
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: c.text, opacity: 0.7 }}>
            Explore how thoughtful color combinations can transform user experience and create lasting impressions across digital products.
          </p>
          <button className="text-sm font-semibold" style={{ color: c.primary }}>Read more →</button>
        </div>
        {/* Articles list */}
        {["Typography Trends for 2025", "Building Accessible Interfaces"].map((title, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-t" style={{ borderColor: c.secondary }}>
            <div className="w-12 h-12 rounded-lg shrink-0" style={{ backgroundColor: i === 0 ? c.primary : c.accent, opacity: 0.3 }} />
            <div>
              <h3 className="text-sm font-semibold" style={{ color: c.text, fontFamily: `'${fonts.heading}', sans-serif` }}>{title}</h3>
              <p className="text-xs" style={{ color: c.text, opacity: 0.5 }}>3 min read</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EcommercePreview({ c, fonts }: { c: ColorRoles; fonts: { heading: string; body: string } }) {
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: c.background, fontFamily: `'${fonts.body}', sans-serif` }}>
      {/* Header */}
      <div className="px-6 py-3 flex items-center justify-between border-b" style={{ borderColor: c.secondary }}>
        <span className="font-bold" style={{ color: c.primary, fontFamily: `'${fonts.heading}', sans-serif` }}>Shop</span>
        <div className="flex gap-4 text-sm" style={{ color: c.text }}>
          <span>New</span><span>Sale</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: c.accent, color: c.background }}>3</div>
        </div>
      </div>
      {/* Banner */}
      <div className="p-6 text-center" style={{ backgroundColor: c.primary }}>
        <h2 className="text-xl font-bold mb-1" style={{ color: c.background, fontFamily: `'${fonts.heading}', sans-serif` }}>Summer Sale — 30% Off</h2>
        <p className="text-sm" style={{ color: c.background, opacity: 0.85 }}>Use code SUMMER30 at checkout</p>
      </div>
      {/* Products */}
      <div className="grid grid-cols-2 gap-4 p-6">
        {[
          ["Premium Jacket", "$129.00", "$179.00"],
          ["Canvas Sneakers", "$89.00", "$119.00"],
          ["Designer Watch", "$299.00", "$399.00"],
          ["Leather Bag", "$199.00", "$259.00"],
        ].map(([name, price, orig], i) => (
          <div key={i} className="rounded-lg overflow-hidden" style={{ backgroundColor: c.secondary }}>
            <div className="h-24" style={{ backgroundColor: c.primary, opacity: 0.15 }} />
            <div className="p-3">
              <h3 className="text-sm font-semibold mb-1" style={{ color: c.text, fontFamily: `'${fonts.heading}', sans-serif` }}>{name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: c.accent }}>{price}</span>
                <span className="text-xs line-through" style={{ color: c.text, opacity: 0.4 }}>{orig}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mondrian panel — 60-30-10 color distribution
// ---------------------------------------------------------------------------

function MondrianPanel({ c }: { c: ColorRoles }) {
  return (
    <div className="grid grid-cols-6 grid-rows-4 gap-1 w-full aspect-3/2 rounded-lg overflow-hidden">
      {/* Background – 60% */}
      <div className="col-span-4 row-span-3" style={{ backgroundColor: c.background }} />
      {/* Primary – 30% */}
      <div className="col-span-2 row-span-2" style={{ backgroundColor: c.primary }} />
      {/* Secondary */}
      <div className="col-span-2 row-span-2" style={{ backgroundColor: c.secondary }} />
      {/* Accent – 10% */}
      <div className="col-span-1 row-span-1" style={{ backgroundColor: c.accent }} />
      {/* Text */}
      <div className="col-span-3 row-span-1" style={{ backgroundColor: c.text }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contrast grid
// ---------------------------------------------------------------------------

function ContrastGrid({ c }: { c: ColorRoles }) {
  const pairs: [string, string, string][] = [
    ["Text / BG", c.text, c.background],
    ["Primary / BG", c.primary, c.background],
    ["Accent / BG", c.accent, c.background],
    ["BG / Primary", c.background, c.primary],
    ["BG / Accent", c.background, c.accent],
    ["Text / Secondary", c.text, c.secondary],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {pairs.map(([label, fg, bg]) => {
        const badge = wcagBadge(fg, bg);
        const ratio = contrastRatio(fg, bg).toFixed(1);
        return (
          <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-white/5">
            <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: bg, color: fg }}>
              Aa
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{label}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{ratio}</span>
                <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: badge.color, color: "#fff" }}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Workspace
// ---------------------------------------------------------------------------

const PREVIEW_MODES: { id: PreviewMode; label: string }[] = [
  { id: "landing", label: "Landing" },
  { id: "dashboard", label: "Dashboard" },
  { id: "blog", label: "Blog" },
  { id: "ecommerce", label: "E-commerce" },
];

export default function ColorPaletteWorkspace() {
  const {
    colors, fonts, previewMode, savedPalettes,
    setColor, setPreviewMode, randomize, applyPreset,
    swapTextAndBg, savePalette, deletePalette, loadPalette, setFont,
  } = useColorPaletteStore();

  const [showPresets, setShowPresets] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showFonts, setShowFonts] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [tab, setTab] = useState<"preview" | "colors" | "export">("preview");
  const [linkCopied, setLinkCopied] = useState(false);

  // Click-outside refs for dropdowns
  const presetsRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  useClickOutside(presetsRef, useCallback(() => setShowPresets(false), []));
  useClickOutside(exportRef, useCallback(() => setShowExport(false), []));
  useClickOutside(savedRef, useCallback(() => setShowSaved(false), []));

  // Load Google fonts
  useEffect(() => {
    loadGoogleFont(fonts.heading);
    loadGoogleFont(fonts.body);
  }, [fonts.heading, fonts.body]);

  // Parse share URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t"), b = params.get("b"), p = params.get("p"), s = params.get("s"), a = params.get("a");
    if (t && b && p && s && a) {
      const hexRe = /^[0-9a-fA-F]{6}$/;
      if ([t, b, p, s, a].every((v) => hexRe.test(v))) {
        setColor("text", `#${t}`);
        setColor("background", `#${b}`);
        setColor("primary", `#${p}`);
        setColor("secondary", `#${s}`);
        setColor("accent", `#${a}`);
      }
    }
    const fh = params.get("fh"), fb = params.get("fb");
    if (fh) setFont("heading", fh);
    if (fb) setFont("body", fb);
    // Clean URL after parsing
    if (params.toString()) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Spacebar to randomize
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        randomize();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [randomize]);

  // Chiko registration
  useChikoActions(useCallback(() => createColorPaletteManifest(), []));

  // Export handler
  const handleExport = useCallback((format: string) => {
    let content = "";
    let filename = "";
    let mime = "text/plain";

    switch (format) {
      case "css":
        content = exportCSS(colors, fonts); filename = "palette.css"; mime = "text/css"; break;
      case "tailwind":
        content = exportTailwind(colors); filename = "palette-tailwind.css"; mime = "text/css"; break;
      case "scss":
        content = exportSCSS(colors, fonts); filename = "palette.scss"; break;
      case "json":
        content = exportJSON(colors, fonts); filename = "palette.json"; mime = "application/json"; break;
      case "svg":
        content = exportSVG(colors); filename = "palette.svg"; mime = "image/svg+xml"; break;
      default: return;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  }, [colors, fonts]);

  // Copy link
  const handleCopyLink = useCallback(() => {
    const params = new URLSearchParams({
      t: colors.text.replace("#", ""),
      b: colors.background.replace("#", ""),
      p: colors.primary.replace("#", ""),
      s: colors.secondary.replace("#", ""),
      a: colors.accent.replace("#", ""),
      fh: fonts.heading,
      fb: fonts.body,
    });
    copyToClipboard(`${window.location.origin}${window.location.pathname}?${params.toString()}`).then((ok) => {
      if (ok) {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    });
  }, [colors, fonts]);

  // Preview component
  const PreviewComponent = useMemo(() => {
    switch (previewMode) {
      case "landing": return LandingPreview;
      case "dashboard": return DashboardPreview;
      case "blog": return BlogPreview;
      case "ecommerce": return EcommercePreview;
    }
  }, [previewMode]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex-wrap">
        {/* Randomize */}
        <button
          onClick={randomize}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Randomize (Spacebar)"
        >
          <IconRefresh className="w-4 h-4" />
          <span className="hidden sm:inline">Randomize</span>
        </button>

        {/* Swap Text ↔ BG */}
        <button
          onClick={swapTextAndBg}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Swap Text & Background"
        >
          <span className="text-base">⇄</span>
          <span className="hidden sm:inline">Swap</span>
        </button>

        {/* Presets dropdown */}
        <div className="relative" ref={presetsRef}>
          <button
            onClick={() => { setShowPresets(!showPresets); setShowExport(false); setShowFonts(false); setShowSaved(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <IconSparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Presets</span>
            <IconChevronDown className="w-3 h-3" />
          </button>
          {showPresets && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
              {PRESET_PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { applyPreset(p); setShowPresets(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="flex gap-0.5">
                    {Object.values(p.colors).map((col, i) => (
                      <div key={i} className="w-5 h-5 rounded-sm first:rounded-l-md last:rounded-r-md" style={{ backgroundColor: col }} />
                    ))}
                  </div>
                  <span className="text-sm">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fonts toggle */}
        <button
          onClick={() => { setShowFonts(!showFonts); setShowPresets(false); setShowExport(false); setShowSaved(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <IconType className="w-4 h-4" />
          <span className="hidden sm:inline">Fonts</span>
        </button>

        {/* Preview mode tabs */}
        <div className="hidden lg:flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 ml-auto">
          {PREVIEW_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setPreviewMode(m.id)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                previewMode === m.id
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "hover:bg-white/50 dark:hover:bg-gray-700/50"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Saved palettes */}
        <div className="relative" ref={savedRef}>
          <button
            onClick={() => { setShowSaved(!showSaved); setShowPresets(false); setShowExport(false); setShowFonts(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <IconStar className="w-4 h-4" />
            <span className="hidden sm:inline">Saved</span>
            {savedPalettes.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500 text-white">{savedPalettes.length}</span>
            )}
          </button>
          {showSaved && (
            <div className="absolute top-full right-0 mt-1 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
              {/* Save new */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-2 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 border-none outline-none"
                    placeholder="Palette name…"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && saveName.trim()) {
                        savePalette(saveName.trim());
                        setSaveName("");
                      }
                    }}
                  />
                  <button
                    onClick={() => { if (saveName.trim()) { savePalette(saveName.trim()); setSaveName(""); } }}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                  >
                    <IconPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {savedPalettes.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">No saved palettes yet</p>
              ) : (
                savedPalettes.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                    <button onClick={() => { loadPalette(p); setShowSaved(false); }} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className="flex gap-0.5 shrink-0">
                        {Object.values(p.colors).map((col, i) => (
                          <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: col }} />
                        ))}
                      </div>
                      <span className="text-sm truncate">{p.name}</span>
                    </button>
                    <button
                      onClick={() => deletePalette(p.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Export dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => { setShowExport(!showExport); setShowPresets(false); setShowFonts(false); setShowSaved(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-500 text-white hover:bg-violet-600 transition-colors"
          >
            <IconDownload className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
            <IconChevronDown className="w-3 h-3" />
          </button>
          {showExport && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
              {[
                { id: "css", label: "CSS Variables" },
                { id: "tailwind", label: "Tailwind v4" },
                { id: "scss", label: "SCSS Variables" },
                { id: "json", label: "JSON" },
                { id: "svg", label: "SVG Swatches" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleExport(f.id)}
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {f.label}
                </button>
              ))}
              <hr className="border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => { handleCopyLink(); setShowExport(false); }}
                className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <IconCopy className="w-3.5 h-3.5" /> {linkCopied ? "Copied!" : "Copy Share Link"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Fonts panel ──────────────────────────────────────────── */}
      {showFonts && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Heading</label>
            <select
              value={fonts.heading}
              onChange={(e) => setFont("heading", e.target.value)}
              className="px-2 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 border-none outline-none"
            >
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Body</label>
            <select
              value={fonts.body}
              onChange={(e) => setFont("body", e.target.value)}
              className="px-2 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 border-none outline-none"
            >
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
            <span style={{ fontFamily: `'${fonts.heading}', sans-serif` }} className="font-semibold">Heading</span>
            {" / "}
            <span style={{ fontFamily: `'${fonts.body}', sans-serif` }}>Body text</span>
          </div>
        </div>
      )}

      {/* ── Mobile tabs ──────────────────────────────────────────── */}
      <div className="flex lg:hidden border-b border-gray-200 dark:border-gray-800">
        {(["preview", "colors", "export"] as const).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
              tab === t2
                ? "border-b-2 border-violet-500 text-violet-600 dark:text-violet-400"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t2}
          </button>
        ))}
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left sidebar — Color swatches + contrast (desktop) or inline (mobile tab) */}
        <aside className={`lg:w-72 xl:w-80 lg:border-r border-gray-200 dark:border-gray-800 overflow-y-auto bg-white/50 dark:bg-gray-900/50 ${tab !== "colors" ? "hidden lg:block" : ""}`}>
          <div className="p-4 space-y-6">
            {/* Color roles */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                <IconDroplet className="w-3.5 h-3.5" /> Colors
              </h3>
              <div className="flex justify-around">
                {(["text", "background", "primary", "secondary", "accent"] as (keyof ColorRoles)[]).map((role) => (
                  <ColorSwatch
                    key={role}
                    role={role === "background" ? "bg" : role === "secondary" ? "sec" : role === "text" ? "txt" : role}
                    color={colors[role]}
                    onChange={(hex) => setColor(role, hex)}
                  />
                ))}
              </div>
            </div>

            {/* Mondrian distribution */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Color Distribution
              </h3>
              <MondrianPanel c={colors} />
            </div>

            {/* Contrast checker */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                <IconEye className="w-3.5 h-3.5" /> Contrast
              </h3>
              <ContrastGrid c={colors} />
            </div>

            {/* Preview mode (mobile) */}
            <div className="lg:hidden">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Preview Mode
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PREVIEW_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setPreviewMode(m.id); setTab("preview"); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      previewMode === m.id
                        ? "bg-violet-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Center — Live preview */}
        <main className={`flex-1 overflow-y-auto p-4 lg:p-8 ${tab !== "preview" ? "hidden lg:block" : ""}`}>
          <div className="max-w-3xl mx-auto">
            <PreviewComponent c={colors} fonts={fonts} />
          </div>
        </main>

        {/* Right panel — Export (mobile only shows in export tab) */}
        <aside className={`lg:w-72 xl:w-80 lg:border-l border-gray-200 dark:border-gray-800 overflow-y-auto bg-white/50 dark:bg-gray-900/50 ${tab !== "export" ? "hidden lg:block" : ""}`}>
          <div className="p-4 space-y-6">
            {/* Quick Export */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                <IconDownload className="w-3.5 h-3.5" /> Export
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "css", label: "CSS" },
                  { id: "tailwind", label: "Tailwind v4" },
                  { id: "scss", label: "SCSS" },
                  { id: "json", label: "JSON" },
                  { id: "svg", label: "SVG" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleExport(f.id)}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full mt-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <IconCopy className="w-3.5 h-3.5" /> {linkCopied ? "Copied!" : "Copy Share Link"}
              </button>
            </div>

            {/* CSS Preview */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                CSS Preview
              </h3>
              <pre className="text-xs font-mono p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                {exportCSS(colors, fonts)}
              </pre>
            </div>

            {/* Palette info */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                <IconPalette className="w-3.5 h-3.5" /> Tips
              </h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 leading-relaxed">
                <li>• Press <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[10px] font-mono">Space</kbd> to randomize</li>
                <li>• Right-click a hex code to copy it</li>
                <li>• Background = 60%, Primary = 30%, Accent = 10%</li>
                <li>• Aim for AA (4.5:1) contrast on all text</li>
                <li>• Ask Chiko for mood or industry palettes</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
