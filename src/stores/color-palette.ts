// =============================================================================
// DMSuite — Color Palette Generator Store (Realtime Colors Style)
// Zustand + Immer + persist. 5 color roles, 36 curated palettes,
// perceptual-quality random generation, dark/light mode swap, 45+ fonts.
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColorRoles {
  text: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface FontPairing {
  heading: string;
  body: string;
}

export type FontCategory = "sans" | "serif" | "display" | "mono";

export interface FontMeta {
  name: string;
  category: FontCategory;
  weights: string;
}

export type HarmonyMode =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "tetradic"
  | "monochromatic";

export type ExportFormat = "css" | "tailwind" | "scss" | "json" | "svg" | "png";

export interface SavedPalette {
  id: string;
  name: string;
  colors: ColorRoles;
  fonts: FontPairing;
  createdAt: number;
}

export type PreviewMode = "landing" | "dashboard" | "blog" | "ecommerce";

// ---------------------------------------------------------------------------
// Font catalog — 45+ Google Fonts with metadata
// ---------------------------------------------------------------------------

export const FONT_CATALOG: FontMeta[] = [
  // Sans-serif
  { name: "Inter", category: "sans", weights: "400;500;600;700" },
  { name: "Poppins", category: "sans", weights: "400;500;600;700" },
  { name: "Open Sans", category: "sans", weights: "400;500;600;700" },
  { name: "Roboto", category: "sans", weights: "400;500;700" },
  { name: "Lato", category: "sans", weights: "400;700" },
  { name: "Montserrat", category: "sans", weights: "400;500;600;700" },
  { name: "Source Sans 3", category: "sans", weights: "400;600;700" },
  { name: "Nunito", category: "sans", weights: "400;600;700" },
  { name: "Raleway", category: "sans", weights: "400;500;600;700" },
  { name: "DM Sans", category: "sans", weights: "400;500;600;700" },
  { name: "Plus Jakarta Sans", category: "sans", weights: "400;500;600;700" },
  { name: "IBM Plex Sans", category: "sans", weights: "400;500;600;700" },
  { name: "Space Grotesk", category: "sans", weights: "400;500;600;700" },
  { name: "Outfit", category: "sans", weights: "400;500;600;700" },
  { name: "Sora", category: "sans", weights: "400;500;600;700" },
  { name: "Manrope", category: "sans", weights: "400;500;600;700" },
  { name: "Work Sans", category: "sans", weights: "400;500;600;700" },
  { name: "Rubik", category: "sans", weights: "400;500;600;700" },
  { name: "Figtree", category: "sans", weights: "400;500;600;700" },
  { name: "Lexend", category: "sans", weights: "400;500;600;700" },
  { name: "Urbanist", category: "sans", weights: "400;500;600;700" },
  // Serif
  { name: "Playfair Display", category: "serif", weights: "400;500;600;700" },
  { name: "Merriweather", category: "serif", weights: "400;700" },
  { name: "DM Serif Display", category: "serif", weights: "400" },
  { name: "Lora", category: "serif", weights: "400;500;600;700" },
  { name: "Libre Baskerville", category: "serif", weights: "400;700" },
  { name: "Cormorant Garamond", category: "serif", weights: "400;500;600;700" },
  { name: "Crimson Text", category: "serif", weights: "400;600;700" },
  { name: "Bitter", category: "serif", weights: "400;500;600;700" },
  { name: "EB Garamond", category: "serif", weights: "400;500;600;700" },
  { name: "Fraunces", category: "serif", weights: "400;500;600;700" },
  { name: "Noto Serif", category: "serif", weights: "400;500;600;700" },
  { name: "Source Serif 4", category: "serif", weights: "400;600;700" },
  // Display
  { name: "Bricolage Grotesque", category: "display", weights: "400;500;600;700" },
  // Mono
  { name: "JetBrains Mono", category: "mono", weights: "400;500;600;700" },
  { name: "Fira Code", category: "mono", weights: "400;500;600;700" },
  { name: "Source Code Pro", category: "mono", weights: "400;500;600;700" },
  { name: "IBM Plex Mono", category: "mono", weights: "400;500;600;700" },
  { name: "Space Mono", category: "mono", weights: "400;700" },
];

export const FONT_OPTIONS = FONT_CATALOG.map((f) => f.name);

// ---------------------------------------------------------------------------
// Curated font pairings — 20 professional combos
// ---------------------------------------------------------------------------

export interface CuratedFontPairing {
  id: string;
  name: string;
  heading: string;
  body: string;
  vibe: string;
}

export const FONT_PAIRINGS: CuratedFontPairing[] = [
  { id: "modern-clean", name: "Modern Clean", heading: "Inter", body: "Inter", vibe: "Minimal, technology" },
  { id: "editorial", name: "Editorial", heading: "Playfair Display", body: "Source Sans 3", vibe: "Magazine, news" },
  { id: "startup", name: "Startup", heading: "Plus Jakarta Sans", body: "Inter", vibe: "SaaS, product" },
  { id: "elegant-serif", name: "Elegant Serif", heading: "Cormorant Garamond", body: "Lato", vibe: "Luxury, fashion" },
  { id: "bold-modern", name: "Bold & Modern", heading: "Space Grotesk", body: "DM Sans", vibe: "Bold, creative" },
  { id: "classic-pair", name: "Classic Pair", heading: "Merriweather", body: "Open Sans", vibe: "Blog, article" },
  { id: "geometric", name: "Geometric", heading: "Poppins", body: "Nunito", vibe: "Friendly, rounded" },
  { id: "corporate", name: "Corporate", heading: "IBM Plex Sans", body: "IBM Plex Sans", vibe: "Enterprise, B2B" },
  { id: "designer", name: "Designer", heading: "Outfit", body: "DM Sans", vibe: "Portfolio, agency" },
  { id: "literary", name: "Literary", heading: "EB Garamond", body: "Source Serif 4", vibe: "Publishing, academic" },
  { id: "cafe", name: "Café & Bakery", heading: "Fraunces", body: "Lato", vibe: "F&B, artisan" },
  { id: "techie", name: "Techie", heading: "Space Grotesk", body: "JetBrains Mono", vibe: "Dev tools, hacker" },
  { id: "fresh", name: "Fresh & Friendly", heading: "Sora", body: "Nunito", vibe: "Health, wellness" },
  { id: "swiss", name: "Swiss Precision", heading: "Work Sans", body: "Inter", vibe: "Finance, analytics" },
  { id: "creative-duo", name: "Creative Duo", heading: "Bricolage Grotesque", body: "DM Sans", vibe: "Design, creative" },
  { id: "warm-serif", name: "Warm Serif", heading: "Lora", body: "Raleway", vibe: "Lifestyle, travel" },
  { id: "neo-grotesque", name: "Neo Grotesque", heading: "Manrope", body: "Inter", vibe: "Web3, fintech" },
  { id: "display-sans", name: "Display + Sans", heading: "DM Serif Display", body: "DM Sans", vibe: "Media, branding" },
  { id: "sharp", name: "Sharp & Direct", heading: "Urbanist", body: "Inter", vibe: "Marketplace, e-comm" },
  { id: "playful-mono", name: "Playful Mono", heading: "Rubik", body: "Space Mono", vibe: "Retro, playful" },
];

// ---------------------------------------------------------------------------
// 36 curated preset palettes — inspired by Realtime Colors quality
// ---------------------------------------------------------------------------

export interface PresetPalette {
  id: string;
  name: string;
  colors: ColorRoles;
  fonts: FontPairing;
}

export const PRESET_PALETTES: PresetPalette[] = [
  // ── Realtime Colors defaults & classics ──
  { id: "realtime-default", name: "Realtime Default", colors: { text: "#050315", background: "#fbfbfe", primary: "#2f27ce", secondary: "#dedcff", accent: "#433bff" }, fonts: { heading: "Inter", body: "Inter" } },
  { id: "indigo-dream", name: "Indigo Dream", colors: { text: "#eef0ff", background: "#080d27", primary: "#8094ff", secondary: "#1a2350", accent: "#ff6b6b" }, fonts: { heading: "Space Grotesk", body: "Inter" } },
  { id: "fresh-lime", name: "Fresh Lime", colors: { text: "#1a2e05", background: "#f8fdf2", primary: "#4d7c0f", secondary: "#ecfccb", accent: "#b91c1c" }, fonts: { heading: "Plus Jakarta Sans", body: "DM Sans" } },
  { id: "rose-garden", name: "Rose Garden", colors: { text: "#2d0a1e", background: "#fef7fb", primary: "#be185d", secondary: "#fce7f3", accent: "#7c3aed" }, fonts: { heading: "Playfair Display", body: "Lato" } },
  { id: "midnight-blue", name: "Midnight Blue", colors: { text: "#dbeafe", background: "#0c1524", primary: "#3b82f6", secondary: "#172554", accent: "#f97316" }, fonts: { heading: "Inter", body: "Inter" } },
  { id: "warm-sand", name: "Warm Sand", colors: { text: "#292524", background: "#faf7f5", primary: "#c2410c", secondary: "#fed7aa", accent: "#1d4ed8" }, fonts: { heading: "Merriweather", body: "Open Sans" } },
  { id: "cyber-neon", name: "Cyber Neon", colors: { text: "#c4f0ff", background: "#020617", primary: "#22d3ee", secondary: "#0f172a", accent: "#f43f5e" }, fonts: { heading: "Space Grotesk", body: "JetBrains Mono" } },
  { id: "forest-canopy", name: "Forest Canopy", colors: { text: "#14532d", background: "#f0fdf4", primary: "#16a34a", secondary: "#dcfce7", accent: "#854d0e" }, fonts: { heading: "Merriweather", body: "Lato" } },
  { id: "sunset-orange", name: "Sunset Orange", colors: { text: "#1c1917", background: "#fffbf5", primary: "#ea580c", secondary: "#fff7ed", accent: "#0d9488" }, fonts: { heading: "Poppins", body: "Nunito" } },
  { id: "royal-purple", name: "Royal Purple", colors: { text: "#faf5ff", background: "#1e1033", primary: "#a855f7", secondary: "#2d1b4e", accent: "#fbbf24" }, fonts: { heading: "Outfit", body: "Inter" } },
  // ── Professional & corporate ──
  { id: "classic-pro", name: "Classic Professional", colors: { text: "#1e3a5f", background: "#ffffff", primary: "#2563eb", secondary: "#eff6ff", accent: "#dc2626" }, fonts: { heading: "Inter", body: "Inter" } },
  { id: "enterprise", name: "Enterprise", colors: { text: "#1e293b", background: "#f8fafc", primary: "#0f172a", secondary: "#e2e8f0", accent: "#0284c7" }, fonts: { heading: "IBM Plex Sans", body: "IBM Plex Sans" } },
  { id: "legal-firm", name: "Legal Firm", colors: { text: "#1c1917", background: "#fafaf9", primary: "#292524", secondary: "#f5f5f4", accent: "#b45309" }, fonts: { heading: "EB Garamond", body: "Source Serif 4" } },
  { id: "healthcare", name: "Healthcare", colors: { text: "#064e3b", background: "#f0fdfa", primary: "#0d9488", secondary: "#ccfbf1", accent: "#2563eb" }, fonts: { heading: "Plus Jakarta Sans", body: "Open Sans" } },
  // ── Trendy & creative ──
  { id: "vaporwave", name: "Vaporwave", colors: { text: "#f0e6ff", background: "#0a0015", primary: "#c084fc", secondary: "#1e0a3c", accent: "#fb7185" }, fonts: { heading: "Space Grotesk", body: "DM Sans" } },
  { id: "coral-reef", name: "Coral Reef", colors: { text: "#1e1b4b", background: "#fef7f0", primary: "#f97316", secondary: "#fff7ed", accent: "#6366f1" }, fonts: { heading: "Sora", body: "Nunito" } },
  { id: "aurora-borealis", name: "Aurora Borealis", colors: { text: "#e2e8f0", background: "#0f172a", primary: "#8b5cf6", secondary: "#1e293b", accent: "#06b6d4" }, fonts: { heading: "Outfit", body: "Inter" } },
  { id: "minimalist-gray", name: "Minimalist Gray", colors: { text: "#18181b", background: "#fafafa", primary: "#18181b", secondary: "#f4f4f5", accent: "#a855f7" }, fonts: { heading: "DM Serif Display", body: "DM Sans" } },
  { id: "earth-tone", name: "Earth Tone", colors: { text: "#2d1b0e", background: "#faf3eb", primary: "#8b6f47", secondary: "#e8d5b7", accent: "#526b2d" }, fonts: { heading: "Fraunces", body: "Lato" } },
  { id: "ocean-deep", name: "Ocean Deep", colors: { text: "#bae6fd", background: "#0c1929", primary: "#0ea5e9", secondary: "#0c4a6e", accent: "#a78bfa" }, fonts: { heading: "Manrope", body: "Inter" } },
  // ── Modern dark themes ──
  { id: "github-dark", name: "GitHub Dark", colors: { text: "#c9d1d9", background: "#0d1117", primary: "#58a6ff", secondary: "#161b22", accent: "#f78166" }, fonts: { heading: "Inter", body: "Inter" } },
  { id: "vercel-dark", name: "Vercel Dark", colors: { text: "#ededed", background: "#000000", primary: "#ffffff", secondary: "#111111", accent: "#0070f3" }, fonts: { heading: "Inter", body: "Inter" } },
  { id: "stripe-dark", name: "Stripe Dark", colors: { text: "#e6ebf1", background: "#0a2540", primary: "#635bff", secondary: "#1a3a5c", accent: "#00d4aa" }, fonts: { heading: "Sora", body: "Inter" } },
  // ── Light & bright ──
  { id: "notion-light", name: "Notion Light", colors: { text: "#37352f", background: "#ffffff", primary: "#2f80ed", secondary: "#f7f6f3", accent: "#eb5757" }, fonts: { heading: "Inter", body: "Inter" } },
  { id: "pastel-dream", name: "Pastel Dream", colors: { text: "#3d3d3d", background: "#fdf6f0", primary: "#b5838d", secondary: "#ffd6e0", accent: "#6d6875" }, fonts: { heading: "Poppins", body: "Nunito" } },
  { id: "spring-garden", name: "Spring Garden", colors: { text: "#1a2e05", background: "#fefce8", primary: "#65a30d", secondary: "#ecfccb", accent: "#e11d48" }, fonts: { heading: "Outfit", body: "DM Sans" } },
  { id: "lavender-field", name: "Lavender Field", colors: { text: "#3b0764", background: "#faf5ff", primary: "#7c3aed", secondary: "#ede9fe", accent: "#059669" }, fonts: { heading: "Lora", body: "Raleway" } },
  { id: "peach-cream", name: "Peach & Cream", colors: { text: "#431407", background: "#fff8f5", primary: "#fb923c", secondary: "#ffedd5", accent: "#0891b2" }, fonts: { heading: "DM Serif Display", body: "DM Sans" } },
  // ── Industry-specific ──
  { id: "fintech", name: "Fintech", colors: { text: "#f0fdf4", background: "#022c22", primary: "#10b981", secondary: "#064e3b", accent: "#fbbf24" }, fonts: { heading: "Manrope", body: "Inter" } },
  { id: "saas-product", name: "SaaS Product", colors: { text: "#1e293b", background: "#ffffff", primary: "#6366f1", secondary: "#eef2ff", accent: "#f43f5e" }, fonts: { heading: "Plus Jakarta Sans", body: "Inter" } },
  { id: "luxury-brand", name: "Luxury Brand", colors: { text: "#f5f0e8", background: "#1a1a1a", primary: "#d4af37", secondary: "#2a2a2a", accent: "#c77dff" }, fonts: { heading: "Cormorant Garamond", body: "Lato" } },
  { id: "food-drink", name: "Food & Drink", colors: { text: "#431407", background: "#fff7ed", primary: "#ea580c", secondary: "#ffedd5", accent: "#65a30d" }, fonts: { heading: "Fraunces", body: "Lato" } },
  { id: "fitness-bold", name: "Fitness Bold", colors: { text: "#fafafa", background: "#18181b", primary: "#ef4444", secondary: "#27272a", accent: "#f59e0b" }, fonts: { heading: "Urbanist", body: "Inter" } },
  { id: "education", name: "Education", colors: { text: "#1e3a5f", background: "#f8fafc", primary: "#2563eb", secondary: "#eff6ff", accent: "#f59e0b" }, fonts: { heading: "Nunito", body: "Open Sans" } },
  { id: "nonprofit", name: "Nonprofit", colors: { text: "#1e3a5f", background: "#f0f9ff", primary: "#059669", secondary: "#ecfdf5", accent: "#e11d48" }, fonts: { heading: "Lora", body: "Inter" } },
  { id: "real-estate", name: "Real Estate", colors: { text: "#14532d", background: "#f0fdf4", primary: "#15803d", secondary: "#dcfce7", accent: "#1d4ed8" }, fonts: { heading: "Work Sans", body: "Inter" } },
];

// ---------------------------------------------------------------------------
// HSL color utilities
// ---------------------------------------------------------------------------

export function hslToHex(h: number, s: number, l: number): string {
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  const s01 = s / 100;
  const l01 = l / 100;
  const a = s01 * Math.min(l01, 1 - l01);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l01 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue = 0;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / d + 2) / 6;
  else hue = ((r - g) / d + 4) / 6;
  return [Math.round(hue * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// ---------------------------------------------------------------------------
// High-quality palette generation engine
// Golden angle hue stepping + perceptual lightness for guaranteed harmonious
// palettes that rival Realtime Colors quality.
// ---------------------------------------------------------------------------

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function generateRandomPalette(): ColorRoles {
  const isDark = Math.random() > 0.5;
  const baseHue = Math.floor(Math.random() * 360);
  const goldenAngle = 137.508;
  const accentHue = (baseHue + goldenAngle) % 360;
  const secondaryHueOffset = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 20);
  const secondaryHue = ((baseHue + secondaryHueOffset) % 360 + 360) % 360;

  if (isDark) {
    const bgL = 3 + Math.random() * 7;
    const bgS = 15 + Math.random() * 30;
    const bg = hslToHex(baseHue, bgS, bgL);
    const text = hslToHex(baseHue, 5 + Math.random() * 15, 85 + Math.random() * 10);
    const primary = hslToHex(baseHue, 55 + Math.random() * 35, 55 + Math.random() * 15);
    const secondary = hslToHex(secondaryHue, 15 + Math.random() * 25, bgL + 5 + Math.random() * 8);
    const accent = hslToHex(accentHue, 60 + Math.random() * 35, 50 + Math.random() * 20);

    if (contrastRatio(text, bg) < 7) {
      return { text: hslToHex(baseHue, 8, 93), background: bg, primary, secondary, accent };
    }
    return { text, background: bg, primary, secondary, accent };
  }

  const bgL = 96 + Math.random() * 3;
  const bgS = 5 + Math.random() * 30;
  const bg = hslToHex(baseHue, bgS, bgL);
  const text = hslToHex(baseHue, 30 + Math.random() * 40, 5 + Math.random() * 12);
  const primary = hslToHex(baseHue, 60 + Math.random() * 35, 35 + Math.random() * 20);
  const secondary = hslToHex(secondaryHue, 30 + Math.random() * 40, 88 + Math.random() * 8);
  const accent = hslToHex(accentHue, 65 + Math.random() * 30, 35 + Math.random() * 20);

  if (contrastRatio(text, bg) < 7) {
    return { text: hslToHex(baseHue, 35, 8), background: bg, primary, secondary, accent };
  }
  return { text, background: bg, primary, secondary, accent };
}

function deriveSwappedPalette(colors: ColorRoles): ColorRoles {
  const bgLum = relativeLuminance(colors.background);
  const isCurrentlyLight = bgLum > 0.5;

  if (isCurrentlyLight) {
    const [th, ts] = hexToHsl(colors.text);
    const [, , bgL] = hexToHsl(colors.background);
    const darkBg = hslToHex(th, clamp(ts, 15, 45), clamp(5, 3, 12));
    const lightText = hslToHex(th, clamp(ts * 0.3, 5, 20), clamp(bgL, 85, 95));
    const [sh, ss] = hexToHsl(colors.secondary);
    const darkSec = hslToHex(sh, clamp(ss * 0.5, 10, 30), 12 + Math.random() * 8);
    const [ph, ps, pl] = hexToHsl(colors.primary);
    const boostP = pl < 50 ? hslToHex(ph, ps, clamp(pl + 20, 50, 70)) : colors.primary;
    const [ah, as, al] = hexToHsl(colors.accent);
    const boostA = al < 50 ? hslToHex(ah, as, clamp(al + 15, 45, 65)) : colors.accent;
    return { text: lightText, background: darkBg, primary: boostP, secondary: darkSec, accent: boostA };
  }

  const [bh, bs] = hexToHsl(colors.background);
  const lightBg = hslToHex(bh, clamp(bs * 0.4, 5, 25), 97 + Math.random() * 2);
  const darkText = hslToHex(bh, clamp(bs, 20, 50), 8 + Math.random() * 7);
  const [sh, ss] = hexToHsl(colors.secondary);
  const lightSec = hslToHex(sh, clamp(ss * 0.6, 20, 50), 88 + Math.random() * 8);
  const [ph, ps, pl] = hexToHsl(colors.primary);
  const darkenP = pl > 60 ? hslToHex(ph, ps, clamp(pl - 20, 30, 55)) : colors.primary;
  const [ah, as, al] = hexToHsl(colors.accent);
  const darkenA = al > 60 ? hslToHex(ah, as, clamp(al - 15, 35, 55)) : colors.accent;
  return { text: darkText, background: lightBg, primary: darkenP, secondary: lightSec, accent: darkenA };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface ColorPaletteState {
  colors: ColorRoles;
  fonts: FontPairing;
  previewMode: PreviewMode;
  savedPalettes: SavedPalette[];

  setColor: (role: keyof ColorRoles, hex: string) => void;
  setColors: (colors: Partial<ColorRoles>) => void;
  setFont: (role: keyof FontPairing, font: string) => void;
  setFonts: (fonts: Partial<FontPairing>) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  randomize: () => void;
  applyPreset: (preset: PresetPalette) => void;
  savePalette: (name: string) => void;
  deletePalette: (id: string) => void;
  loadPalette: (palette: SavedPalette) => void;
  swapTextAndBg: () => void;
  reset: () => void;
}

const DEFAULT_COLORS: ColorRoles = {
  text: "#050315",
  background: "#fbfbfe",
  primary: "#2f27ce",
  secondary: "#dedcff",
  accent: "#433bff",
};

const DEFAULT_FONTS: FontPairing = {
  heading: "Inter",
  body: "Inter",
};

export const useColorPaletteStore = create<ColorPaletteState>()(
  persist(
    immer((set) => ({
      colors: { ...DEFAULT_COLORS },
      fonts: { ...DEFAULT_FONTS },
      previewMode: "landing" as PreviewMode,
      savedPalettes: [] as SavedPalette[],

      setColor: (role, hex) =>
        set((s) => { s.colors[role] = hex; }),

      setColors: (colors) =>
        set((s) => { Object.assign(s.colors, colors); }),

      setFont: (role, font) =>
        set((s) => { s.fonts[role] = font; }),

      setFonts: (fonts) =>
        set((s) => { Object.assign(s.fonts, fonts); }),

      setPreviewMode: (mode) =>
        set((s) => { s.previewMode = mode; }),

      randomize: () =>
        set((s) => {
          s.colors = generateRandomPalette();
          if (Math.random() < 0.3) {
            const fp = pick(FONT_PAIRINGS);
            s.fonts = { heading: fp.heading, body: fp.body };
          }
        }),

      applyPreset: (preset) =>
        set((s) => {
          s.colors = { ...preset.colors };
          s.fonts = { ...preset.fonts };
        }),

      savePalette: (name) =>
        set((s) => {
          s.savedPalettes.push({
            id: uid(), name: name || `Palette ${s.savedPalettes.length + 1}`,
            colors: { ...s.colors }, fonts: { ...s.fonts }, createdAt: Date.now(),
          });
        }),

      deletePalette: (id) =>
        set((s) => { s.savedPalettes = s.savedPalettes.filter((p) => p.id !== id); }),

      loadPalette: (palette) =>
        set((s) => {
          s.colors = { ...palette.colors };
          s.fonts = { ...palette.fonts };
        }),

      swapTextAndBg: () =>
        set((s) => { s.colors = deriveSwappedPalette(s.colors); }),

      reset: () =>
        set((s) => {
          s.colors = { ...DEFAULT_COLORS };
          s.fonts = { ...DEFAULT_FONTS };
          s.previewMode = "landing";
        }),
    })),
    { name: "dmsuite-color-palette" }
  )
);
