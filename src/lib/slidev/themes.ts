// =============================================================================
// DMSuite — Slidev Themes: 10 Presentation Theme Presets
// Inspired by Slidev's theme ecosystem, adapted for DMSuite.
// =============================================================================

export interface SlidevTheme {
  id: string;
  name: string;
  // Surfaces
  bg: string;
  bgSecondary: string;
  bgCode: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textCode: string;
  // Accents
  accent: string;
  accentSoft: string;
  // Typography
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  // Dark or light
  isDark: boolean;
}

// ── 10 theme presets ────────────────────────────────────────────────────────

export const SLIDEV_THEMES: SlidevTheme[] = [
  // 1 — Default: DMSuite dark with lime accent
  {
    id: "default",
    name: "Default",
    bg: "#121212",
    bgSecondary: "#1a1a1a",
    bgCode: "#1e1e1e",
    textPrimary: "#e4e4e7",
    textSecondary: "#a1a1aa",
    textCode: "#d4d4d8",
    accent: "#a3e635",
    accentSoft: "rgba(163,230,53,0.15)",
    headingFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'Fira Code', monospace",
    isDark: true,
  },
  // 2 — Seriph: Elegant serif, warm gold
  {
    id: "seriph",
    name: "Seriph",
    bg: "#1b1b1b",
    bgSecondary: "#252525",
    bgCode: "#2a2a2a",
    textPrimary: "#f5f0e8",
    textSecondary: "#c4b89a",
    textCode: "#e8dcc8",
    accent: "#d4a853",
    accentSoft: "rgba(212,168,83,0.15)",
    headingFont: "Georgia, 'Times New Roman', serif",
    bodyFont: "Georgia, 'Times New Roman', serif",
    monoFont: "'JetBrains Mono', 'Courier New', monospace",
    isDark: true,
  },
  // 3 — Apple Basic: Clean white, blue accent
  {
    id: "apple-basic",
    name: "Apple Basic",
    bg: "#ffffff",
    bgSecondary: "#f5f5f7",
    bgCode: "#f0f0f2",
    textPrimary: "#1d1d1f",
    textSecondary: "#6e6e73",
    textCode: "#1d1d1f",
    accent: "#0071e3",
    accentSoft: "rgba(0,113,227,0.08)",
    headingFont: "'Inter', -apple-system, sans-serif",
    bodyFont: "'Inter', -apple-system, sans-serif",
    monoFont: "'JetBrains Mono', 'SF Mono', monospace",
    isDark: false,
  },
  // 4 — Dracula: Classic dev dark theme
  {
    id: "dracula",
    name: "Dracula",
    bg: "#282a36",
    bgSecondary: "#343746",
    bgCode: "#21222c",
    textPrimary: "#f8f8f2",
    textSecondary: "#6272a4",
    textCode: "#f8f8f2",
    accent: "#ff79c6",
    accentSoft: "rgba(255,121,198,0.15)",
    headingFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'Fira Code', monospace",
    isDark: true,
  },
  // 5 — Academic: Paper & ink, scholarly
  {
    id: "academic",
    name: "Academic",
    bg: "#fafaf9",
    bgSecondary: "#f0eeeb",
    bgCode: "#e8e5e0",
    textPrimary: "#292524",
    textSecondary: "#78716c",
    textCode: "#44403c",
    accent: "#92400e",
    accentSoft: "rgba(146,64,14,0.08)",
    headingFont: "Georgia, 'Times New Roman', serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'Courier New', monospace",
    isDark: false,
  },
  // 6 — Geist: Vercel-inspired pure dark
  {
    id: "geist",
    name: "Geist",
    bg: "#000000",
    bgSecondary: "#111111",
    bgCode: "#0a0a0a",
    textPrimary: "#ededed",
    textSecondary: "#888888",
    textCode: "#ededed",
    accent: "#ffffff",
    accentSoft: "rgba(255,255,255,0.1)",
    headingFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'Geist Mono', monospace",
    isDark: true,
  },
  // 7 — Purplin: Creative purple
  {
    id: "purplin",
    name: "Purplin",
    bg: "#1e1644",
    bgSecondary: "#271e52",
    bgCode: "#1a1240",
    textPrimary: "#eee8ff",
    textSecondary: "#a78bfa",
    textCode: "#e0d6ff",
    accent: "#06d6a0",
    accentSoft: "rgba(6,214,160,0.15)",
    headingFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    isDark: true,
  },
  // 8 — Penguin: Navy corporate
  {
    id: "penguin",
    name: "Penguin",
    bg: "#0f172a",
    bgSecondary: "#1e293b",
    bgCode: "#0c1322",
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
    textCode: "#e2e8f0",
    accent: "#38bdf8",
    accentSoft: "rgba(56,189,248,0.12)",
    headingFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    isDark: true,
  },
  // 9 — Mokka: Warm coffee tones
  {
    id: "mokka",
    name: "Mokka",
    bg: "#2c1810",
    bgSecondary: "#3a241a",
    bgCode: "#231410",
    textPrimary: "#fef3c7",
    textSecondary: "#d6b88c",
    textCode: "#fde68a",
    accent: "#f59e0b",
    accentSoft: "rgba(245,158,11,0.15)",
    headingFont: "Georgia, 'Garamond', serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'Courier New', monospace",
    isDark: true,
  },
  // 10 — Neon: Vibrant dark
  {
    id: "neon",
    name: "Neon",
    bg: "#09090b",
    bgSecondary: "#18181b",
    bgCode: "#111113",
    textPrimary: "#fafafa",
    textSecondary: "#a1a1aa",
    textCode: "#f4f4f5",
    accent: "#22d3ee",
    accentSoft: "rgba(34,211,238,0.12)",
    headingFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    isDark: true,
  },
];

export const DEFAULT_THEME = SLIDEV_THEMES[0];

export function getThemeById(id: string): SlidevTheme {
  return SLIDEV_THEMES.find((t) => t.id === id) || DEFAULT_THEME;
}
