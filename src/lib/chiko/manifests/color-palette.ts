// =============================================================================
// DMSuite — Color Palette Generator Action Manifest for Chiko
// Gives Chiko AI full control over the Realtime Colors-style palette tool:
// Color roles (text/bg/primary/secondary/accent), fonts, presets,
// harmonies, contrast checking, export, randomize, save/load palettes.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import {
  useColorPaletteStore,
  PRESET_PALETTES,
  FONT_OPTIONS,
  type ColorRoles,
  type PreviewMode,
} from "@/stores/color-palette";
import { withActivityLogging } from "@/stores/activity-log";

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagGrade(ratio: number): string {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "FAIL";
}

// ---------------------------------------------------------------------------
// Read state
// ---------------------------------------------------------------------------

function readState(): Record<string, unknown> {
  const { colors, fonts, previewMode, savedPalettes, darkMode } = useColorPaletteStore.getState();
  const [rT, gT, bT] = hexToRgb(colors.text);
  const [hT, sT, lT] = rgbToHsl(rT, gT, bT);
  const textOnBg = contrastRatio(colors.text, colors.background);
  const primaryOnBg = contrastRatio(colors.primary, colors.background);
  const accentOnBg = contrastRatio(colors.accent, colors.background);
  const textOnPrimary = contrastRatio(colors.text, colors.primary);
  const textOnSecondary = contrastRatio(colors.text, colors.secondary);

  return {
    colors,
    colorsHSL: {
      text: `hsl(${hT}, ${sT}%, ${lT}%)`,
      background: (() => { const [r,g,b] = hexToRgb(colors.background); const [h,s,l] = rgbToHsl(r,g,b); return `hsl(${h}, ${s}%, ${l}%)`; })(),
      primary: (() => { const [r,g,b] = hexToRgb(colors.primary); const [h,s,l] = rgbToHsl(r,g,b); return `hsl(${h}, ${s}%, ${l}%)`; })(),
      secondary: (() => { const [r,g,b] = hexToRgb(colors.secondary); const [h,s,l] = rgbToHsl(r,g,b); return `hsl(${h}, ${s}%, ${l}%)`; })(),
      accent: (() => { const [r,g,b] = hexToRgb(colors.accent); const [h,s,l] = rgbToHsl(r,g,b); return `hsl(${h}, ${s}%, ${l}%)`; })(),
    },
    contrastChecks: {
      textOnBackground: { ratio: +textOnBg.toFixed(2), grade: wcagGrade(textOnBg) },
      primaryOnBackground: { ratio: +primaryOnBg.toFixed(2), grade: wcagGrade(primaryOnBg) },
      accentOnBackground: { ratio: +accentOnBg.toFixed(2), grade: wcagGrade(accentOnBg) },
      textOnPrimary: { ratio: +textOnPrimary.toFixed(2), grade: wcagGrade(textOnPrimary) },
      textOnSecondary: { ratio: +textOnSecondary.toFixed(2), grade: wcagGrade(textOnSecondary) },
    },
    fonts,
    previewMode,
    darkMode,
    savedPaletteCount: savedPalettes.length,
    savedPaletteNames: savedPalettes.map((p) => p.name),
    availablePresets: PRESET_PALETTES.map((p) => ({ id: p.id, name: p.name })),
    availableFonts: FONT_OPTIONS,
    availablePreviewModes: ["landing", "dashboard", "blog", "ecommerce"],
  };
}

// ---------------------------------------------------------------------------
// Success / error helpers
// ---------------------------------------------------------------------------

function ok(msg: string): ChikoActionResult {
  return { success: true, message: msg, newState: readState() };
}

function err(msg: string): ChikoActionResult {
  return { success: false, message: msg };
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function validHex(hex: unknown): hex is string {
  return typeof hex === "string" && HEX_RE.test(hex);
}

// ---------------------------------------------------------------------------
// Manifest factory
// ---------------------------------------------------------------------------

export function createColorPaletteManifest(): ChikoActionManifest {
  const base: ChikoActionManifest = {
    toolId: "color-palette",
    toolName: "Color Palette Generator (Realtime Colors)",

    getState: readState,

    actions: [
      // ── Read ──
      {
        name: "readCurrentState",
        description:
          "Read the full current state: all 5 color roles (text, background, primary, secondary, accent), fonts, contrast checks (WCAG AA/AAA), preview mode, saved palettes, and available presets.",
        parameters: { type: "object", properties: {}, required: [] },
        category: "Read",
      },

      // ── Color role setters ──
      {
        name: "setTextColor",
        description: "Set the text color (used for headings, body text, and labels).",
        parameters: {
          type: "object",
          properties: { hex: { type: "string", description: "Hex color e.g. #1a1a2e" } },
          required: ["hex"],
        },
        category: "Colors",
      },
      {
        name: "setBackgroundColor",
        description: "Set the background/page color.",
        parameters: {
          type: "object",
          properties: { hex: { type: "string", description: "Hex color e.g. #fafafa" } },
          required: ["hex"],
        },
        category: "Colors",
      },
      {
        name: "setPrimaryColor",
        description: "Set the primary brand color (used for main CTAs, headers, primary sections).",
        parameters: {
          type: "object",
          properties: { hex: { type: "string", description: "Hex color e.g. #6366f1" } },
          required: ["hex"],
        },
        category: "Colors",
      },
      {
        name: "setSecondaryColor",
        description: "Set the secondary color (used for cards, info sections, secondary buttons).",
        parameters: {
          type: "object",
          properties: { hex: { type: "string", description: "Hex color e.g. #e0e7ff" } },
          required: ["hex"],
        },
        category: "Colors",
      },
      {
        name: "setAccentColor",
        description: "Set the accent color (used for highlights, links, images, decorative elements).",
        parameters: {
          type: "object",
          properties: { hex: { type: "string", description: "Hex color e.g. #f43f5e" } },
          required: ["hex"],
        },
        category: "Colors",
      },
      {
        name: "setAllColors",
        description: "Set all 5 color roles at once. Great for applying a complete theme.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Text color hex" },
            background: { type: "string", description: "Background color hex" },
            primary: { type: "string", description: "Primary color hex" },
            secondary: { type: "string", description: "Secondary color hex" },
            accent: { type: "string", description: "Accent color hex" },
          },
          required: ["text", "background", "primary", "secondary", "accent"],
        },
        category: "Colors",
      },
      {
        name: "swapTextAndBackground",
        description: "Swap the text and background colors (toggle between light and dark mode feel).",
        parameters: { type: "object", properties: {}, required: [] },
        category: "Colors",
      },

      // ── Fonts ──
      {
        name: "setHeadingFont",
        description: "Set the heading font family. Use a Google Font name from availableFonts.",
        parameters: {
          type: "object",
          properties: { font: { type: "string", description: "Font family name e.g. 'Playfair Display'" } },
          required: ["font"],
        },
        category: "Typography",
      },
      {
        name: "setBodyFont",
        description: "Set the body text font family. Use a Google Font name from availableFonts.",
        parameters: {
          type: "object",
          properties: { font: { type: "string", description: "Font family name e.g. 'Inter'" } },
          required: ["font"],
        },
        category: "Typography",
      },
      {
        name: "setFontPairing",
        description: "Set both heading and body fonts at once.",
        parameters: {
          type: "object",
          properties: {
            heading: { type: "string", description: "Heading font family" },
            body: { type: "string", description: "Body font family" },
          },
          required: ["heading", "body"],
        },
        category: "Typography",
      },

      // ── Generation ──
      {
        name: "randomize",
        description: "Generate a completely random color palette. Great for exploration and inspiration.",
        parameters: { type: "object", properties: {}, required: [] },
        category: "Generate",
      },
      {
        name: "applyPreset",
        description:
          "Apply a curated preset palette by ID. Available: " +
          PRESET_PALETTES.map((p) => `${p.id} (${p.name})`).join(", "),
        parameters: {
          type: "object",
          properties: {
            presetId: { type: "string", description: "Preset ID from availablePresets" },
          },
          required: ["presetId"],
        },
        category: "Generate",
      },
      {
        name: "generateHarmony",
        description:
          "Generate a color harmony based on the current primary color. Modes: complementary, analogous, triadic, split-complementary, tetradic, monochromatic.",
        parameters: {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["complementary", "analogous", "triadic", "split-complementary", "tetradic", "monochromatic"],
              description: "Color harmony type",
            },
          },
          required: ["mode"],
        },
        category: "Generate",
      },
      {
        name: "generateFromMood",
        description:
          "Generate a palette matching a mood/aesthetic. Moods: vibrant, pastel, earthy, neon, corporate, luxury, minimalist, playful, warm, cool, dark, elegant.",
        parameters: {
          type: "object",
          properties: {
            mood: { type: "string", description: "Target mood/aesthetic" },
          },
          required: ["mood"],
        },
        category: "Generate",
      },
      {
        name: "generateForIndustry",
        description:
          "Generate a professional palette suited for a specific industry (tech, healthcare, finance, food, fashion, education, legal, real-estate, fitness, nonprofit).",
        parameters: {
          type: "object",
          properties: {
            industry: { type: "string", description: "Target industry" },
          },
          required: ["industry"],
        },
        category: "Generate",
      },

      // ── Preview ──
      {
        name: "setPreviewMode",
        description: "Change the live website preview layout: landing, dashboard, blog, or ecommerce.",
        parameters: {
          type: "object",
          properties: {
            mode: { type: "string", enum: ["landing", "dashboard", "blog", "ecommerce"], description: "Preview layout" },
          },
          required: ["mode"],
        },
        category: "Preview",
      },

      // ── Contrast ──
      {
        name: "checkContrast",
        description: "Check WCAG contrast ratio between any two colors.",
        parameters: {
          type: "object",
          properties: {
            color1: { type: "string", description: "First hex color" },
            color2: { type: "string", description: "Second hex color" },
          },
          required: ["color1", "color2"],
        },
        category: "Accessibility",
      },
      {
        name: "checkAllContrasts",
        description: "Check WCAG contrast ratios for all important color combinations in the current palette.",
        parameters: { type: "object", properties: {}, required: [] },
        category: "Accessibility",
      },
      {
        name: "fixContrastIssues",
        description: "Automatically adjust colors to meet WCAG AA contrast requirements while preserving the palette's feel.",
        parameters: { type: "object", properties: {}, required: [] },
        category: "Accessibility",
      },

      // ── Save / Load ──
      {
        name: "savePalette",
        description: "Save the current palette with a name for later use.",
        parameters: {
          type: "object",
          properties: { name: { type: "string", description: "Palette name" } },
          required: ["name"],
        },
        category: "Library",
      },
      {
        name: "loadSavedPalette",
        description: "Load a previously saved palette by name.",
        parameters: {
          type: "object",
          properties: { name: { type: "string", description: "Saved palette name" } },
          required: ["name"],
        },
        category: "Library",
      },
      {
        name: "deleteSavedPalette",
        description: "Delete a saved palette by name.",
        parameters: {
          type: "object",
          properties: { name: { type: "string", description: "Saved palette name" } },
          required: ["name"],
        },
        category: "Library",
        destructive: true,
      },

      // ── Export ──
      {
        name: "exportPalette",
        description: "Export the current palette. Formats: css, tailwind, scss, json, svg.",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["css", "tailwind", "scss", "json", "svg"], description: "Export format" },
          },
          required: ["format"],
        },
        category: "Export",
      },

      // ── Reset ──
      {
        name: "resetToDefaults",
        description: "Reset all colors and fonts to the default Realtime Colors palette.",
        parameters: { type: "object", properties: {}, required: [] },
        category: "Utility",
        destructive: true,
      },
    ],

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useColorPaletteStore.getState();

      switch (actionName) {
        case "readCurrentState":
          return { success: true, message: "Current palette state", newState: readState() };

        // ── Colors ──
        case "setTextColor": {
          const hex = params.hex;
          if (!validHex(hex)) return err("Invalid hex. Use format #rrggbb");
          store.setColor("text", hex);
          return ok(`Text color set to ${hex}`);
        }
        case "setBackgroundColor": {
          const hex = params.hex;
          if (!validHex(hex)) return err("Invalid hex. Use format #rrggbb");
          store.setColor("background", hex);
          return ok(`Background color set to ${hex}`);
        }
        case "setPrimaryColor": {
          const hex = params.hex;
          if (!validHex(hex)) return err("Invalid hex. Use format #rrggbb");
          store.setColor("primary", hex);
          return ok(`Primary color set to ${hex}`);
        }
        case "setSecondaryColor": {
          const hex = params.hex;
          if (!validHex(hex)) return err("Invalid hex. Use format #rrggbb");
          store.setColor("secondary", hex);
          return ok(`Secondary color set to ${hex}`);
        }
        case "setAccentColor": {
          const hex = params.hex;
          if (!validHex(hex)) return err("Invalid hex. Use format #rrggbb");
          store.setColor("accent", hex);
          return ok(`Accent color set to ${hex}`);
        }
        case "setAllColors": {
          const { text, background, primary, secondary, accent } = params as Record<string, string>;
          for (const [k, v] of Object.entries({ text, background, primary, secondary, accent })) {
            if (!validHex(v)) return err(`Invalid hex for ${k}: ${v}`);
          }
          store.setColors({ text, background, primary, secondary, accent });
          return ok("All 5 color roles updated");
        }
        case "swapTextAndBackground": {
          store.swapTextAndBg();
          return ok("Text and background colors swapped");
        }

        // ── Fonts ──
        case "setHeadingFont": {
          const font = params.font as string;
          if (!font) return err("Font name required");
          store.setFont("heading", font);
          return ok(`Heading font set to ${font}`);
        }
        case "setBodyFont": {
          const font = params.font as string;
          if (!font) return err("Font name required");
          store.setFont("body", font);
          return ok(`Body font set to ${font}`);
        }
        case "setFontPairing": {
          const { heading, body } = params as { heading: string; body: string };
          if (!heading || !body) return err("Both heading and body font required");
          store.setFonts({ heading, body });
          return ok(`Fonts set: ${heading} / ${body}`);
        }

        // ── Generation ──
        case "randomize": {
          store.randomize();
          return ok("Random palette generated");
        }
        case "applyPreset": {
          const preset = PRESET_PALETTES.find((p) => p.id === params.presetId);
          if (!preset) return err(`Unknown preset: ${params.presetId}. Available: ${PRESET_PALETTES.map(p => p.id).join(", ")}`);
          store.applyPreset(preset);
          return ok(`Preset "${preset.name}" applied`);
        }
        case "generateHarmony": {
          const mode = params.mode as string;
          const { colors } = useColorPaletteStore.getState();
          const [r, g, b] = hexToRgb(colors.primary);
          const [h, s, l] = rgbToHsl(r, g, b);

          let newColors: Partial<ColorRoles> = {};
          switch (mode) {
            case "complementary":
              newColors = { secondary: hslToHex((h + 180) % 360, s, l * 0.9), accent: hslToHex((h + 180) % 360, s * 0.8, l * 1.1) };
              break;
            case "analogous":
              newColors = { secondary: hslToHex((h + 30) % 360, s * 0.7, l + 20 > 100 ? 90 : l + 20), accent: hslToHex((h - 30 + 360) % 360, s, l) };
              break;
            case "triadic":
              newColors = { secondary: hslToHex((h + 120) % 360, s * 0.6, l + 25 > 100 ? 90 : l + 25), accent: hslToHex((h + 240) % 360, s, l) };
              break;
            case "split-complementary":
              newColors = { secondary: hslToHex((h + 150) % 360, s * 0.6, l + 20 > 100 ? 90 : l + 20), accent: hslToHex((h + 210) % 360, s, l) };
              break;
            case "tetradic":
              newColors = { secondary: hslToHex((h + 90) % 360, s * 0.6, l + 20 > 100 ? 90 : l + 20), accent: hslToHex((h + 180) % 360, s, l) };
              break;
            case "monochromatic":
              newColors = { secondary: hslToHex(h, s * 0.3, Math.min(95, l + 35)), accent: hslToHex(h, s * 0.9, Math.max(20, l - 15)) };
              break;
            default:
              return err(`Unknown harmony mode: ${mode}`);
          }
          store.setColors(newColors);
          return ok(`${mode} harmony applied from primary ${colors.primary}`);
        }
        case "generateFromMood": {
          const mood = (params.mood as string).toLowerCase();
          const moodMap: Record<string, ColorRoles> = {
            vibrant: { text: "#1a1a2e", background: "#fefefe", primary: "#e63946", secondary: "#f1faee", accent: "#457b9d" },
            pastel: { text: "#3d3d3d", background: "#fdf6f0", primary: "#b5838d", secondary: "#ffd6e0", accent: "#6d6875" },
            earthy: { text: "#2d1b0e", background: "#faf3eb", primary: "#8b6f47", secondary: "#e8d5b7", accent: "#526b2d" },
            neon: { text: "#e0ffff", background: "#0a0a0a", primary: "#00ff88", secondary: "#1a1a2e", accent: "#ff00ff" },
            corporate: { text: "#1e293b", background: "#ffffff", primary: "#1d4ed8", secondary: "#eff6ff", accent: "#0891b2" },
            luxury: { text: "#f5f0e8", background: "#1a1a1a", primary: "#d4af37", secondary: "#2a2a2a", accent: "#c77dff" },
            minimalist: { text: "#171717", background: "#fafafa", primary: "#404040", secondary: "#f5f5f5", accent: "#737373" },
            playful: { text: "#1e1b4b", background: "#fefce8", primary: "#f97316", secondary: "#fef9c3", accent: "#a855f7" },
            warm: { text: "#431407", background: "#fffbf5", primary: "#ea580c", secondary: "#fed7aa", accent: "#b91c1c" },
            cool: { text: "#0c4a6e", background: "#f0f9ff", primary: "#0ea5e9", secondary: "#e0f2fe", accent: "#6366f1" },
            dark: { text: "#e2e8f0", background: "#0f172a", primary: "#8b5cf6", secondary: "#1e293b", accent: "#06b6d4" },
            elegant: { text: "#1c1917", background: "#fafaf9", primary: "#44403c", secondary: "#f5f5f4", accent: "#a16207" },
          };
          const colors = moodMap[mood];
          if (!colors) return err(`Unknown mood. Available: ${Object.keys(moodMap).join(", ")}`);
          store.setColors(colors);
          return ok(`"${mood}" mood palette applied`);
        }
        case "generateForIndustry": {
          const industry = (params.industry as string).toLowerCase();
          const industryMap: Record<string, ColorRoles> = {
            tech: { text: "#e2e8f0", background: "#0f172a", primary: "#3b82f6", secondary: "#1e293b", accent: "#22d3ee" },
            healthcare: { text: "#1e3a5f", background: "#f0f9ff", primary: "#0891b2", secondary: "#e0f2fe", accent: "#10b981" },
            finance: { text: "#1e293b", background: "#ffffff", primary: "#1d4ed8", secondary: "#f1f5f9", accent: "#059669" },
            food: { text: "#431407", background: "#fff7ed", primary: "#ea580c", secondary: "#ffedd5", accent: "#65a30d" },
            fashion: { text: "#18181b", background: "#fafafa", primary: "#18181b", secondary: "#f4f4f5", accent: "#e11d48" },
            education: { text: "#1e3a5f", background: "#f8fafc", primary: "#2563eb", secondary: "#eff6ff", accent: "#f59e0b" },
            legal: { text: "#1c1917", background: "#fafaf9", primary: "#292524", secondary: "#f5f5f4", accent: "#b45309" },
            "real-estate": { text: "#14532d", background: "#f0fdf4", primary: "#15803d", secondary: "#dcfce7", accent: "#1d4ed8" },
            fitness: { text: "#fafafa", background: "#18181b", primary: "#ef4444", secondary: "#27272a", accent: "#f59e0b" },
            nonprofit: { text: "#1e3a5f", background: "#f0f9ff", primary: "#059669", secondary: "#ecfdf5", accent: "#e11d48" },
          };
          const colors = industryMap[industry];
          if (!colors) return err(`Unknown industry. Available: ${Object.keys(industryMap).join(", ")}`);
          store.setColors(colors);
          return ok(`"${industry}" industry palette applied`);
        }

        // ── Preview ──
        case "setPreviewMode": {
          const mode = params.mode as PreviewMode;
          if (!["landing", "dashboard", "blog", "ecommerce"].includes(mode))
            return err("Invalid mode. Use: landing, dashboard, blog, ecommerce");
          store.setPreviewMode(mode);
          return ok(`Preview mode set to ${mode}`);
        }

        // ── Contrast ──
        case "checkContrast": {
          const c1 = params.color1 as string;
          const c2 = params.color2 as string;
          if (!validHex(c1) || !validHex(c2)) return err("Both colors must be valid hex");
          const ratio = contrastRatio(c1, c2);
          const grade = wcagGrade(ratio);
          return { success: true, message: `Contrast ${c1} / ${c2}: ${ratio.toFixed(2)}:1 → ${grade}`, newState: { ratio: +ratio.toFixed(2), grade, passesAA: ratio >= 4.5, passesAAA: ratio >= 7 } };
        }
        case "checkAllContrasts": {
          return { success: true, message: "All contrast checks", newState: readState() };
        }
        case "fixContrastIssues": {
          const { colors } = useColorPaletteStore.getState();
          const fixes: string[] = [];
          const bgLum = relativeLuminance(colors.background);

          // Fix text-on-background
          if (contrastRatio(colors.text, colors.background) < 4.5) {
            store.setColor("text", bgLum > 0.5 ? "#1a1a2e" : "#e8e8f0");
            fixes.push("text");
          }

          // Fix primary-on-background (need at least 3:1 for large text / UI)
          if (contrastRatio(colors.primary, colors.background) < 3) {
            const pHsl = hexToHsl(colors.primary);
            pHsl[2] = bgLum > 0.5 ? Math.min(pHsl[2], 40) : Math.max(pHsl[2], 60);
            store.setColor("primary", hslToHex(pHsl[0], pHsl[1], pHsl[2]));
            fixes.push("primary");
          }

          // Fix accent-on-background (need at least 3:1)
          if (contrastRatio(colors.accent, colors.background) < 3) {
            const aHsl = hexToHsl(colors.accent);
            aHsl[2] = bgLum > 0.5 ? Math.min(aHsl[2], 40) : Math.max(aHsl[2], 60);
            store.setColor("accent", hslToHex(aHsl[0], aHsl[1], aHsl[2]));
            fixes.push("accent");
          }

          if (fixes.length === 0) return ok("All colors already pass contrast checks");
          return ok(`Fixed contrast for: ${fixes.join(", ")}. Text→AA (4.5:1), primary/accent→3:1 on background.`);
        }

        // ── Save / Load ──
        case "savePalette": {
          const name = params.name as string;
          if (!name) return err("Name required");
          store.savePalette(name);
          return ok(`Palette saved as "${name}"`);
        }
        case "loadSavedPalette": {
          const name = params.name as string;
          const saved = useColorPaletteStore.getState().savedPalettes.find(
            (p) => p.name.toLowerCase() === name.toLowerCase()
          );
          if (!saved) return err(`No saved palette named "${name}"`);
          store.loadPalette(saved);
          return ok(`Loaded palette "${saved.name}"`);
        }
        case "deleteSavedPalette": {
          const name = params.name as string;
          const saved = useColorPaletteStore.getState().savedPalettes.find(
            (p) => p.name.toLowerCase() === name.toLowerCase()
          );
          if (!saved) return err(`No saved palette named "${name}"`);
          store.deletePalette(saved.id);
          return ok(`Deleted palette "${saved.name}"`);
        }

        // ── Export ──
        case "exportPalette": {
          // Chiko can trigger export - the workspace handles the actual file download
          return ok(`Export format: ${params.format}. Use the Export panel in the toolbar to download.`);
        }

        // ── Reset ──
        case "resetToDefaults": {
          store.reset();
          return ok("All colors and fonts reset to defaults");
        }

        default:
          return err(`Unknown action: ${actionName}`);
      }
    },
  };

  return withActivityLogging(
    base,
    () => JSON.stringify(readState()),
    (snapshot: unknown) => {
      try {
        const data = JSON.parse(snapshot as string);
        if (data.colors) useColorPaletteStore.getState().setColors(data.colors);
        if (data.fonts) useColorPaletteStore.getState().setFonts(data.fonts);
      } catch { /* ignore */ }
    }
  );
}
