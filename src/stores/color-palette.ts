// =============================================================================
// DMSuite — Color Palette Generator Store (Realtime Colors Style)
// Zustand store with 5 color roles, font pairing, palettes, presets.
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
// Curated preset palettes
// ---------------------------------------------------------------------------

export interface PresetPalette {
  id: string;
  name: string;
  colors: ColorRoles;
  fonts: FontPairing;
}

export const PRESET_PALETTES: PresetPalette[] = [
  {
    id: "midnight-aurora",
    name: "Midnight Aurora",
    colors: { text: "#e2e8f0", background: "#0f172a", primary: "#8b5cf6", secondary: "#1e293b", accent: "#06b6d4" },
    fonts: { heading: "Inter", body: "Inter" },
  },
  {
    id: "sunrise-warm",
    name: "Sunrise Warm",
    colors: { text: "#1c1917", background: "#fffbeb", primary: "#f59e0b", secondary: "#fef3c7", accent: "#ef4444" },
    fonts: { heading: "Playfair Display", body: "Source Sans 3" },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    colors: { text: "#0c4a6e", background: "#f0f9ff", primary: "#0284c7", secondary: "#e0f2fe", accent: "#0d9488" },
    fonts: { heading: "Poppins", body: "Open Sans" },
  },
  {
    id: "forest-green",
    name: "Forest Canopy",
    colors: { text: "#14532d", background: "#f0fdf4", primary: "#16a34a", secondary: "#dcfce7", accent: "#854d0e" },
    fonts: { heading: "Merriweather", body: "Lato" },
  },
  {
    id: "cyber-neon",
    name: "Cyber Neon",
    colors: { text: "#c4f0ff", background: "#020617", primary: "#22d3ee", secondary: "#0f172a", accent: "#f43f5e" },
    fonts: { heading: "Space Grotesk", body: "JetBrains Mono" },
  },
  {
    id: "elegant-mono",
    name: "Elegant Mono",
    colors: { text: "#18181b", background: "#fafafa", primary: "#18181b", secondary: "#f4f4f5", accent: "#a855f7" },
    fonts: { heading: "DM Serif Display", body: "DM Sans" },
  },
  {
    id: "coral-sunset",
    name: "Coral Sunset",
    colors: { text: "#1e1b4b", background: "#fef7f0", primary: "#f97316", secondary: "#fff7ed", accent: "#6366f1" },
    fonts: { heading: "Sora", body: "Nunito" },
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    colors: { text: "#faf5ff", background: "#1e1033", primary: "#a855f7", secondary: "#2d1b4e", accent: "#fbbf24" },
    fonts: { heading: "Outfit", body: "Inter" },
  },
  {
    id: "fresh-mint",
    name: "Fresh Mint",
    colors: { text: "#064e3b", background: "#f0fdfa", primary: "#14b8a6", secondary: "#ccfbf1", accent: "#ec4899" },
    fonts: { heading: "Plus Jakarta Sans", body: "IBM Plex Sans" },
  },
  {
    id: "classic-blue",
    name: "Classic Professional",
    colors: { text: "#1e3a5f", background: "#ffffff", primary: "#2563eb", secondary: "#eff6ff", accent: "#dc2626" },
    fonts: { heading: "Inter", body: "Inter" },
  },
];

// ---------------------------------------------------------------------------
// Font options
// ---------------------------------------------------------------------------

export const FONT_OPTIONS = [
  "Inter", "Poppins", "Open Sans", "Roboto", "Lato", "Montserrat",
  "Source Sans 3", "Nunito", "Raleway", "DM Sans", "Plus Jakarta Sans",
  "IBM Plex Sans", "Space Grotesk", "Outfit", "Sora", "Manrope",
  "Playfair Display", "Merriweather", "DM Serif Display", "Lora",
  "Libre Baskerville", "Cormorant Garamond", "Crimson Text", "Bitter",
  "JetBrains Mono", "Fira Code", "Source Code Pro",
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface ColorPaletteState {
  colors: ColorRoles;
  fonts: FontPairing;
  previewMode: PreviewMode;
  savedPalettes: SavedPalette[];
  darkMode: boolean;

  // Actions
  setColor: (role: keyof ColorRoles, hex: string) => void;
  setColors: (colors: Partial<ColorRoles>) => void;
  setFont: (role: keyof FontPairing, font: string) => void;
  setFonts: (fonts: Partial<FontPairing>) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  setDarkMode: (dark: boolean) => void;
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

// ---------------------------------------------------------------------------
// Random color generation helpers
// ---------------------------------------------------------------------------

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function randomHue(): number {
  return Math.floor(Math.random() * 360);
}

function generateRandomPalette(): ColorRoles {
  const isDark = Math.random() > 0.5;
  const hue = randomHue();
  const hue2 = (hue + 30 + Math.floor(Math.random() * 60)) % 360;
  const accentHue = (hue + 150 + Math.floor(Math.random() * 60)) % 360;

  if (isDark) {
    return {
      text: hslToHex(hue, 10 + Math.random() * 20, 85 + Math.random() * 10),
      background: hslToHex(hue, 20 + Math.random() * 30, 5 + Math.random() * 10),
      primary: hslToHex(hue, 60 + Math.random() * 30, 55 + Math.random() * 15),
      secondary: hslToHex(hue2, 20 + Math.random() * 30, 15 + Math.random() * 10),
      accent: hslToHex(accentHue, 70 + Math.random() * 25, 55 + Math.random() * 15),
    };
  }
  return {
    text: hslToHex(hue, 30 + Math.random() * 40, 10 + Math.random() * 15),
    background: hslToHex(hue, 5 + Math.random() * 20, 95 + Math.random() * 4),
    primary: hslToHex(hue, 60 + Math.random() * 30, 40 + Math.random() * 15),
    secondary: hslToHex(hue2, 20 + Math.random() * 40, 85 + Math.random() * 10),
    accent: hslToHex(accentHue, 70 + Math.random() * 25, 45 + Math.random() * 15),
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Create store
// ---------------------------------------------------------------------------

export const useColorPaletteStore = create<ColorPaletteState>()(
  persist(
    immer((set) => ({
      colors: { ...DEFAULT_COLORS },
      fonts: { ...DEFAULT_FONTS },
      previewMode: "landing" as PreviewMode,
      savedPalettes: [] as SavedPalette[],
      darkMode: false,

      setColor: (role, hex) =>
        set((s) => {
          s.colors[role] = hex;
        }),

      setColors: (colors) =>
        set((s) => {
          Object.assign(s.colors, colors);
        }),

      setFont: (role, font) =>
        set((s) => {
          s.fonts[role] = font;
        }),

      setFonts: (fonts) =>
        set((s) => {
          Object.assign(s.fonts, fonts);
        }),

      setPreviewMode: (mode) =>
        set((s) => {
          s.previewMode = mode;
        }),

      setDarkMode: (dark) =>
        set((s) => {
          s.darkMode = dark;
        }),

      randomize: () =>
        set((s) => {
          const p = generateRandomPalette();
          s.colors = p;
        }),

      applyPreset: (preset) =>
        set((s) => {
          s.colors = { ...preset.colors };
          s.fonts = { ...preset.fonts };
        }),

      savePalette: (name) =>
        set((s) => {
          s.savedPalettes.push({
            id: uid(),
            name: name || `Palette ${s.savedPalettes.length + 1}`,
            colors: { ...s.colors },
            fonts: { ...s.fonts },
            createdAt: Date.now(),
          });
        }),

      deletePalette: (id) =>
        set((s) => {
          s.savedPalettes = s.savedPalettes.filter((p) => p.id !== id);
        }),

      loadPalette: (palette) =>
        set((s) => {
          s.colors = { ...palette.colors };
          s.fonts = { ...palette.fonts };
        }),

      swapTextAndBg: () =>
        set((s) => {
          const tmp = s.colors.text;
          s.colors.text = s.colors.background;
          s.colors.background = tmp;
        }),

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
