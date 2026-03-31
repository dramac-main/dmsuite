// =============================================================================
// DMSuite — Color Palette Generator — Chiko Action Manifest
// Full AI control over palette colors, fonts, presets, saved palettes, swap,
// contrast checking, export, and more.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import {
  useColorPaletteStore,
  PRESET_PALETTES,
  FONT_PAIRINGS,
  FONT_OPTIONS,
  contrastRatio,
  hexToHsl,
  hslToHex,
  type ColorRoles,
  type ExportFormat,
  type HarmonyMode,
  type PreviewMode,
} from "@/stores/color-palette";
import { withActivityLogging } from "@/stores/activity-log";

// ---------------------------------------------------------------------------
// Harmony generators — 6 modes
// ---------------------------------------------------------------------------

function harmonyPalette(baseHex: string, mode: HarmonyMode): ColorRoles {
  const [h, s, l] = hexToHsl(baseHex);
  const wrap = (deg: number) => ((deg % 360) + 360) % 360;
  switch (mode) {
    case "complementary":
      return {
        text: hslToHex(h, 30, 10), background: hslToHex(h, 15, 97),
        primary: baseHex, secondary: hslToHex(h, s * 0.3, 90),
        accent: hslToHex(wrap(h + 180), s, l),
      };
    case "analogous":
      return {
        text: hslToHex(h, 25, 10), background: hslToHex(h, 10, 97),
        primary: baseHex, secondary: hslToHex(wrap(h + 30), s * 0.3, 90),
        accent: hslToHex(wrap(h - 30), s, l),
      };
    case "triadic":
      return {
        text: hslToHex(h, 25, 10), background: hslToHex(h, 12, 97),
        primary: baseHex, secondary: hslToHex(wrap(h + 120), s * 0.3, 88),
        accent: hslToHex(wrap(h + 240), s, l),
      };
    case "split-complementary":
      return {
        text: hslToHex(h, 25, 10), background: hslToHex(h, 12, 97),
        primary: baseHex, secondary: hslToHex(wrap(h + 150), s * 0.3, 90),
        accent: hslToHex(wrap(h + 210), s, l),
      };
    case "tetradic":
      return {
        text: hslToHex(h, 25, 10), background: hslToHex(h, 12, 97),
        primary: baseHex, secondary: hslToHex(wrap(h + 90), s * 0.35, 88),
        accent: hslToHex(wrap(h + 180), s, l),
      };
    case "monochromatic":
      return {
        text: hslToHex(h, s, 10), background: hslToHex(h, s * 0.1, 97),
        primary: baseHex, secondary: hslToHex(h, s * 0.25, 88),
        accent: hslToHex(h, s, Math.min(l + 20, 90)),
      };
  }
}

// ---------------------------------------------------------------------------
// Mood → color mapping — 12 moods
// ---------------------------------------------------------------------------

const MOOD_MAP: Record<string, () => ColorRoles> = {
  calm: () => ({ text: "#1e3a5f", background: "#f0f4f8", primary: "#3b82f6", secondary: "#dbeafe", accent: "#64748b" }),
  energetic: () => ({ text: "#1c1917", background: "#fffbeb", primary: "#f59e0b", secondary: "#fef3c7", accent: "#ef4444" }),
  professional: () => ({ text: "#1e293b", background: "#f8fafc", primary: "#0f172a", secondary: "#e2e8f0", accent: "#0284c7" }),
  playful: () => ({ text: "#3d0066", background: "#fdf4ff", primary: "#d946ef", secondary: "#f5d0fe", accent: "#f97316" }),
  luxury: () => ({ text: "#f5f0e8", background: "#1a1a1a", primary: "#d4af37", secondary: "#2a2a2a", accent: "#c77dff" }),
  nature: () => ({ text: "#14532d", background: "#f0fdf4", primary: "#16a34a", secondary: "#dcfce7", accent: "#854d0e" }),
  tech: () => ({ text: "#c4f0ff", background: "#020617", primary: "#22d3ee", secondary: "#0f172a", accent: "#f43f5e" }),
  warm: () => ({ text: "#431407", background: "#fff7ed", primary: "#ea580c", secondary: "#ffedd5", accent: "#65a30d" }),
  cool: () => ({ text: "#bae6fd", background: "#0c1929", primary: "#0ea5e9", secondary: "#0c4a6e", accent: "#a78bfa" }),
  dark: () => ({ text: "#e2e8f0", background: "#0f172a", primary: "#8b5cf6", secondary: "#1e293b", accent: "#06b6d4" }),
  minimalist: () => ({ text: "#18181b", background: "#fafafa", primary: "#18181b", secondary: "#f4f4f5", accent: "#a855f7" }),
  bold: () => ({ text: "#fafafa", background: "#18181b", primary: "#ef4444", secondary: "#27272a", accent: "#f59e0b" }),
};

// ---------------------------------------------------------------------------
// Industry → preset mapping — 10 industries
// ---------------------------------------------------------------------------

const INDUSTRY_MAP: Record<string, string> = {
  technology: "saas-product",
  finance: "fintech",
  healthcare: "healthcare",
  education: "education",
  food: "food-drink",
  luxury: "luxury-brand",
  fitness: "fitness-bold",
  nonprofit: "nonprofit",
  realestate: "real-estate",
  corporate: "enterprise",
};

// ---------------------------------------------------------------------------
// Manifest factory
// ---------------------------------------------------------------------------

export function createColorPaletteManifest(): ChikoActionManifest {
  const presetNames = PRESET_PALETTES.map((p) => p.id).join(", ");
  const fontPairingNames = FONT_PAIRINGS.map((p) => `${p.id} (${p.name} — ${p.vibe})`).join(", ");
  const moodNames = Object.keys(MOOD_MAP).join(", ");
  const industryNames = Object.keys(INDUSTRY_MAP).join(", ");
  const fontList = FONT_OPTIONS.join(", ");

  const baseManifest: ChikoActionManifest = {
    toolId: "color-palette",
    toolName: "Color Palette Generator",
    actions: [
      // ── Read state ──
      {
        name: "readCurrentState",
        description: "Read the complete current state of the palette — all 5 color roles, fonts, preview mode, saved palettes count, and contrast ratios for key pairs.",
        parameters: { type: "object", properties: {} },
        category: "State",
      },
      // ── Colors ──
      {
        name: "setColor",
        description: "Set a single color role. Roles: text, background, primary, secondary, accent.",
        parameters: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["text", "background", "primary", "secondary", "accent"] },
            hex: { type: "string", description: "Hex color value (e.g. #2f27ce)" },
          },
          required: ["role", "hex"],
        },
        category: "Design",
      },
      {
        name: "setColors",
        description: "Set multiple color roles at once. Only include the roles you want to change.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string" }, background: { type: "string" },
            primary: { type: "string" }, secondary: { type: "string" },
            accent: { type: "string" },
          },
        },
        category: "Design",
      },
      // ── Swap (dark/light mode toggle) ──
      {
        name: "swap",
        description: "Toggle between dark and light mode. This intelligently converts the entire palette: if the current background is light it becomes dark (and vice-versa), with text, primary, secondary, and accent all adjusted for readability in the new mode.",
        parameters: { type: "object", properties: {} },
        category: "Design",
      },
      // ── Randomize ──
      {
        name: "randomize",
        description: "Generate a completely new random palette using the golden-angle algorithm. Guarantees AAA contrast between text and background. 30% chance to also randomize fonts.",
        parameters: { type: "object", properties: {} },
        category: "Design",
      },
      // ── Presets ──
      {
        name: "applyPreset",
        description: `Apply a curated preset palette. Available presets (36 total): ${presetNames}`,
        parameters: {
          type: "object",
          properties: {
            presetId: { type: "string", description: "Preset ID from the available list" },
          },
          required: ["presetId"],
        },
        category: "Design",
      },
      // ── Harmony ──
      {
        name: "generateHarmony",
        description: "Generate a palette from a base color using color theory harmonies. Modes: complementary, analogous, triadic, split-complementary, tetradic, monochromatic.",
        parameters: {
          type: "object",
          properties: {
            baseColor: { type: "string", description: "Base hex color (e.g. #2f27ce)" },
            mode: { type: "string", enum: ["complementary", "analogous", "triadic", "split-complementary", "tetradic", "monochromatic"] },
          },
          required: ["baseColor", "mode"],
        },
        category: "Design",
      },
      // ── Mood-based palette ──
      {
        name: "generateFromMood",
        description: `Generate a palette that matches a mood/feeling. Available moods: ${moodNames}`,
        parameters: {
          type: "object",
          properties: {
            mood: { type: "string", description: "Mood name from available list" },
          },
          required: ["mood"],
        },
        category: "Design",
      },
      // ── Industry-based palette ──
      {
        name: "generateForIndustry",
        description: `Apply a palette suitable for a specific industry. Available: ${industryNames}`,
        parameters: {
          type: "object",
          properties: {
            industry: { type: "string", description: "Industry name from available list" },
          },
          required: ["industry"],
        },
        category: "Design",
      },
      // ── Fonts ──
      {
        name: "setFont",
        description: `Set a single font role (heading or body). Available fonts: ${fontList}`,
        parameters: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["heading", "body"] },
            font: { type: "string", description: "Google Font name" },
          },
          required: ["role", "font"],
        },
        category: "Typography",
      },
      {
        name: "setFonts",
        description: "Set both heading and body fonts at once. Only include the roles you want to change.",
        parameters: {
          type: "object",
          properties: {
            heading: { type: "string" },
            body: { type: "string" },
          },
        },
        category: "Typography",
      },
      {
        name: "applyFontPairing",
        description: `Apply a curated font pairing preset. Available pairings: ${fontPairingNames}`,
        parameters: {
          type: "object",
          properties: {
            pairingId: { type: "string", description: "Font pairing ID from available list" },
          },
          required: ["pairingId"],
        },
        category: "Typography",
      },
      // ── Contrast ──
      {
        name: "checkContrast",
        description: "Check the contrast ratio between two specific colors. Returns WCAG AAA / AA / Fail rating.",
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
        description: "Check contrast ratios for all important color pairs in the current palette (text/bg, primary/bg, accent/bg, text/secondary, primary/secondary).",
        parameters: { type: "object", properties: {} },
        category: "Accessibility",
      },
      {
        name: "fixContrastIssues",
        description: "Automatically fix any contrast issues in the current palette to ensure WCAG AA compliance. Adjusts lightness of text, primary, and accent to meet minimum 4.5:1 against their backgrounds.",
        parameters: { type: "object", properties: {} },
        category: "Accessibility",
      },
      // ── Preview ──
      {
        name: "setPreviewMode",
        description: "Set the preview layout. Options: landing, dashboard, blog, ecommerce.",
        parameters: {
          type: "object",
          properties: {
            mode: { type: "string", enum: ["landing", "dashboard", "blog", "ecommerce"] },
          },
          required: ["mode"],
        },
        category: "Preview",
      },
      // ── Save / Load / Delete ──
      {
        name: "savePalette",
        description: "Save the current palette to the user's collection.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name for the saved palette" },
          },
          required: ["name"],
        },
        category: "Collection",
      },
      {
        name: "loadPalette",
        description: "Load a saved palette by its ID.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Saved palette ID" },
          },
          required: ["id"],
        },
        category: "Collection",
      },
      {
        name: "deletePalette",
        description: "Delete a saved palette by its ID.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Saved palette ID" },
          },
          required: ["id"],
        },
        category: "Collection",
      },
      // ── Export ──
      {
        name: "exportPalette",
        description: "Export the current palette. Formats: css, tailwind, scss, json. The export content is returned in the response.",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["css", "tailwind", "scss", "json"] },
          },
          required: ["format"],
        },
        category: "Export",
      },
      // ── Reset ──
      {
        name: "reset",
        description: "Reset the palette to Realtime Colors defaults (text: #050315, bg: #fbfbfe, primary: #2f27ce, secondary: #dedcff, accent: #433bff, Inter/Inter).",
        parameters: { type: "object", properties: {} },
        category: "General",
      },
    ],

    getState: () => {
      const s = useColorPaletteStore.getState();
      const cr = (a: string, b: string) => contrastRatio(a, b).toFixed(2);
      return {
        colors: s.colors,
        fonts: s.fonts,
        previewMode: s.previewMode,
        savedPalettesCount: s.savedPalettes.length,
        contrast: {
          textOnBg: cr(s.colors.text, s.colors.background),
          primaryOnBg: cr(s.colors.primary, s.colors.background),
          accentOnBg: cr(s.colors.accent, s.colors.background),
          textOnSecondary: cr(s.colors.text, s.colors.secondary),
        },
        availablePresets: PRESET_PALETTES.length,
        availableFontPairings: FONT_PAIRINGS.length,
        availableFonts: FONT_OPTIONS.length,
      };
    },

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      try {
        const store = useColorPaletteStore.getState();

        switch (actionName) {
          case "readCurrentState": {
            const cr = (a: string, b: string) => contrastRatio(a, b).toFixed(2);
            return {
              success: true,
              message: `Colors: text=${store.colors.text}, bg=${store.colors.background}, primary=${store.colors.primary}, secondary=${store.colors.secondary}, accent=${store.colors.accent}. Fonts: heading=${store.fonts.heading}, body=${store.fonts.body}. Preview: ${store.previewMode}. Saved: ${store.savedPalettes.length}. Contrast — text/bg: ${cr(store.colors.text, store.colors.background)}, primary/bg: ${cr(store.colors.primary, store.colors.background)}, accent/bg: ${cr(store.colors.accent, store.colors.background)}.`,
            };
          }

          case "setColor":
            store.setColor(params.role as keyof ColorRoles, params.hex as string);
            return { success: true, message: `Set ${params.role} to ${params.hex}` };

          case "setColors": {
            const colorParams: Partial<ColorRoles> = {};
            for (const k of ["text", "background", "primary", "secondary", "accent"] as const) {
              if (params[k]) colorParams[k] = params[k] as string;
            }
            store.setColors(colorParams);
            return { success: true, message: `Updated colors: ${Object.keys(colorParams).join(", ")}` };
          }

          case "swap":
            store.swapTextAndBg();
            return { success: true, message: "Palette swapped (dark ↔ light mode toggle)" };

          case "randomize":
            store.randomize();
            return { success: true, message: "New random palette generated" };

          case "applyPreset": {
            const preset = PRESET_PALETTES.find((p) => p.id === params.presetId);
            if (!preset) return { success: false, message: `Preset "${params.presetId}" not found` };
            store.applyPreset(preset);
            return { success: true, message: `Applied preset: ${preset.name}` };
          }

          case "generateHarmony": {
            const colors = harmonyPalette(params.baseColor as string, params.mode as HarmonyMode);
            store.setColors(colors);
            return { success: true, message: `Generated ${params.mode} harmony from ${params.baseColor}` };
          }

          case "generateFromMood": {
            const gen = MOOD_MAP[params.mood as string];
            if (!gen) return { success: false, message: `Unknown mood: ${params.mood}. Available: ${Object.keys(MOOD_MAP).join(", ")}` };
            store.setColors(gen());
            return { success: true, message: `Applied ${params.mood} mood palette` };
          }

          case "generateForIndustry": {
            const presetId = INDUSTRY_MAP[params.industry as string];
            if (!presetId) return { success: false, message: `Unknown industry: ${params.industry}. Available: ${Object.keys(INDUSTRY_MAP).join(", ")}` };
            const preset = PRESET_PALETTES.find((p) => p.id === presetId);
            if (!preset) return { success: false, message: `Preset not found for industry` };
            store.applyPreset(preset);
            return { success: true, message: `Applied ${params.industry} industry palette: ${preset.name}` };
          }

          case "setFont":
            store.setFont(params.role as "heading" | "body", params.font as string);
            return { success: true, message: `Set ${params.role} font to ${params.font}` };

          case "setFonts": {
            const fontParams: Partial<{ heading: string; body: string }> = {};
            if (params.heading) fontParams.heading = params.heading as string;
            if (params.body) fontParams.body = params.body as string;
            store.setFonts(fontParams);
            return { success: true, message: `Updated fonts: ${Object.keys(fontParams).join(", ")}` };
          }

          case "applyFontPairing": {
            const fp = FONT_PAIRINGS.find((p) => p.id === params.pairingId);
            if (!fp) return { success: false, message: `Font pairing "${params.pairingId}" not found` };
            store.setFonts({ heading: fp.heading, body: fp.body });
            return { success: true, message: `Applied font pairing: ${fp.name} (${fp.heading} / ${fp.body})` };
          }

          case "checkContrast": {
            const ratio = contrastRatio(params.color1 as string, params.color2 as string);
            const rating = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "Fail";
            return { success: true, message: `Contrast ${params.color1}/${params.color2}: ${ratio.toFixed(2)}:1 (WCAG ${rating})` };
          }

          case "checkAllContrasts": {
            const c = store.colors;
            const pairs = [
              ["text/bg", c.text, c.background],
              ["primary/bg", c.primary, c.background],
              ["accent/bg", c.accent, c.background],
              ["text/secondary", c.text, c.secondary],
              ["primary/secondary", c.primary, c.secondary],
            ] as const;
            const results = pairs.map(([label, a, b]) => {
              const r = contrastRatio(a, b);
              return `${label}: ${r.toFixed(2)}:1 (${r >= 7 ? "AAA" : r >= 4.5 ? "AA" : "FAIL"})`;
            });
            return { success: true, message: results.join(" | ") };
          }

          case "fixContrastIssues": {
            const c = { ...store.colors };
            const fixes: string[] = [];
            const fix = (fg: string, bg: string, role: keyof ColorRoles) => {
              let ratio = contrastRatio(fg, bg);
              if (ratio >= 4.5) return fg;
              const [h, s, l] = hexToHsl(fg);
              const bgLum = hexToHsl(bg)[2];
              const dir = bgLum > 50 ? -1 : 1;
              let nl = l;
              for (let i = 0; i < 80 && ratio < 4.5; i++) {
                nl = Math.max(0, Math.min(100, nl + dir * 2));
                const candidate = hslToHex(h, s, nl);
                ratio = contrastRatio(candidate, bg);
                if (ratio >= 4.5) { fixes.push(role); return candidate; }
              }
              return fg;
            };
            c.text = fix(c.text, c.background, "text");
            c.primary = fix(c.primary, c.background, "primary");
            c.accent = fix(c.accent, c.background, "accent");
            store.setColors(c);
            return { success: true, message: fixes.length ? `Fixed contrast for: ${fixes.join(", ")}` : "All contrasts already meet WCAG AA" };
          }

          case "setPreviewMode":
            store.setPreviewMode(params.mode as PreviewMode);
            return { success: true, message: `Preview mode set to ${params.mode}` };

          case "savePalette":
            store.savePalette(params.name as string);
            return { success: true, message: `Palette saved as "${params.name}"` };

          case "loadPalette": {
            const pal = store.savedPalettes.find((p) => p.id === params.id);
            if (!pal) return { success: false, message: `Palette with ID "${params.id}" not found` };
            store.loadPalette(pal);
            return { success: true, message: `Loaded palette: ${pal.name}` };
          }

          case "deletePalette":
            store.deletePalette(params.id as string);
            return { success: true, message: "Palette deleted" };

          case "exportPalette": {
            const fmt = params.format as ExportFormat;
            const c = store.colors;
            let code: string;
            switch (fmt) {
              case "css":
                code = `:root {\n  --text: ${c.text};\n  --background: ${c.background};\n  --primary: ${c.primary};\n  --secondary: ${c.secondary};\n  --accent: ${c.accent};\n}`;
                break;
              case "scss":
                code = `$text: ${c.text};\n$background: ${c.background};\n$primary: ${c.primary};\n$secondary: ${c.secondary};\n$accent: ${c.accent};`;
                break;
              case "tailwind":
                code = `colors: {\n  text: '${c.text}',\n  background: '${c.background}',\n  primary: '${c.primary}',\n  secondary: '${c.secondary}',\n  accent: '${c.accent}',\n}`;
                break;
              case "json":
                code = JSON.stringify(c, null, 2);
                break;
              default:
                code = JSON.stringify(c, null, 2);
            }
            return { success: true, message: `Export (${fmt}):\n${code}` };
          }

          case "reset":
            store.reset();
            return { success: true, message: "Palette reset to defaults" };

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Action failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useColorPaletteStore.getState(),
    (snapshot) => {
      const s = snapshot as { colors: ColorRoles; fonts: { heading: string; body: string } };
      useColorPaletteStore.getState().setColors(s.colors);
      useColorPaletteStore.getState().setFonts(s.fonts);
    },
  );
}
