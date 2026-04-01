// =============================================================================
// DMSuite — Resume Template Definitions
// 11 Reactive Resume-inspired templates (Pokémon-named) — each with unique
// layout, color defaults, font selection, and visual personality.
// =============================================================================

import type { TemplateId } from "./schema";

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  thumbnail: string; // emoji placeholder — real thumbnails later
  accentColor: string; // default primary color (rgba)
  fontPairing: string; // key into FONT_PAIRINGS
  sidebarWidth: number;
  /** When true, the sidebar is rendered on the left instead of right */
  sidebarLeft: boolean;
  /** Visual variant hints for the renderer */
  style: {
    headerStyle: "banner" | "classic" | "minimal" | "centered" | "split" | "sidebar-header";
    sectionDivider: "line" | "dotted" | "none" | "thick" | "double";
    skillStyle: "chips" | "bars" | "dots" | "plain" | "grouped";
    dateStyle: "right" | "inline" | "below";
    compact: boolean;
    hasTimeline: boolean;
    hasSidebarBg: boolean;
  };
}

export const TEMPLATE_CONFIGS: Record<TemplateId, TemplateConfig> = {
  azurill: {
    id: "azurill",
    name: "Azurill",
    description: "Clean two-column with accent sidebar background",
    thumbnail: "🔵",
    accentColor: "rgba(59,130,246,1)",
    fontPairing: "inter-inter",
    sidebarWidth: 35,
    sidebarLeft: false,
    style: {
      headerStyle: "banner",
      sectionDivider: "line",
      skillStyle: "bars",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: true,
    },
  },
  bronzor: {
    id: "bronzor",
    name: "Bronzor",
    description: "Bold centered header with thick section dividers",
    thumbnail: "🟤",
    accentColor: "rgba(180,83,9,1)",
    fontPairing: "playfair-source",
    sidebarWidth: 30,
    sidebarLeft: false,
    style: {
      headerStyle: "centered",
      sectionDivider: "thick",
      skillStyle: "dots",
      dateStyle: "below",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: false,
    },
  },
  chikorita: {
    id: "chikorita",
    name: "Chikorita",
    description: "Fresh green minimal layout with timeline markers",
    thumbnail: "🌿",
    accentColor: "rgba(34,197,94,1)",
    fontPairing: "poppins-inter",
    sidebarWidth: 32,
    sidebarLeft: false,
    style: {
      headerStyle: "classic",
      sectionDivider: "none",
      skillStyle: "chips",
      dateStyle: "right",
      compact: false,
      hasTimeline: true,
      hasSidebarBg: false,
    },
  },
  ditto: {
    id: "ditto",
    name: "Ditto",
    description: "Versatile minimalist — adapts to any profession",
    thumbnail: "🟣",
    accentColor: "rgba(139,92,246,1)",
    fontPairing: "ibmplex-serif",
    sidebarWidth: 35,
    sidebarLeft: false,
    style: {
      headerStyle: "classic",
      sectionDivider: "line",
      skillStyle: "bars",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: false,
    },
  },
  gengar: {
    id: "gengar",
    name: "Gengar",
    description: "Dark sidebar with bold contrast — standout design",
    thumbnail: "👻",
    accentColor: "rgba(124,58,237,1)",
    fontPairing: "dmserif-dmsans",
    sidebarWidth: 38,
    sidebarLeft: true,
    style: {
      headerStyle: "sidebar-header",
      sectionDivider: "none",
      skillStyle: "bars",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: true,
    },
  },
  glalie: {
    id: "glalie",
    name: "Glalie",
    description: "Icy clean corporate look with dotted separators",
    thumbnail: "🧊",
    accentColor: "rgba(14,165,233,1)",
    fontPairing: "raleway-lato",
    sidebarWidth: 33,
    sidebarLeft: false,
    style: {
      headerStyle: "classic",
      sectionDivider: "dotted",
      skillStyle: "dots",
      dateStyle: "right",
      compact: true,
      hasTimeline: false,
      hasSidebarBg: false,
    },
  },
  kakuna: {
    id: "kakuna",
    name: "Kakuna",
    description: "Compact single-column — maximum content space",
    thumbnail: "🟡",
    accentColor: "rgba(234,179,8,1)",
    fontPairing: "crimsonpro-worksans",
    sidebarWidth: 0,
    sidebarLeft: false,
    style: {
      headerStyle: "minimal",
      sectionDivider: "line",
      skillStyle: "grouped",
      dateStyle: "inline",
      compact: true,
      hasTimeline: false,
      hasSidebarBg: false,
    },
  },
  leafish: {
    id: "leafish",
    name: "Leafish",
    description: "Organic layout with subtle accent touches",
    thumbnail: "🍃",
    accentColor: "rgba(16,185,129,1)",
    fontPairing: "cormorant-proza",
    sidebarWidth: 34,
    sidebarLeft: false,
    style: {
      headerStyle: "classic",
      sectionDivider: "line",
      skillStyle: "plain",
      dateStyle: "right",
      compact: false,
      hasTimeline: true,
      hasSidebarBg: false,
    },
  },
  onyx: {
    id: "onyx",
    name: "Onyx",
    description: "DMSuite default — Electric Violet accent, professional",
    thumbnail: "💎",
    accentColor: "rgba(139,92,246,1)",
    fontPairing: "ibmplex-serif",
    sidebarWidth: 35,
    sidebarLeft: false,
    style: {
      headerStyle: "banner",
      sectionDivider: "line",
      skillStyle: "bars",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: true,
    },
  },
  pikachu: {
    id: "pikachu",
    name: "Pikachu",
    description: "Energetic split-header with dual-accent lines",
    thumbnail: "⚡",
    accentColor: "rgba(234,179,8,1)",
    fontPairing: "montserrat-opensans",
    sidebarWidth: 36,
    sidebarLeft: false,
    style: {
      headerStyle: "split",
      sectionDivider: "double",
      skillStyle: "chips",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: false,
    },
  },
  rhyhorn: {
    id: "rhyhorn",
    name: "Rhyhorn",
    description: "Robust left-sidebar with structured sections",
    thumbnail: "🪨",
    accentColor: "rgba(107,114,128,1)",
    fontPairing: "spacegrotesk-inter",
    sidebarWidth: 40,
    sidebarLeft: true,
    style: {
      headerStyle: "sidebar-header",
      sectionDivider: "thick",
      skillStyle: "plain",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: true,
    },
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATE_CONFIGS);

export function getTemplateConfig(id: TemplateId): TemplateConfig {
  return TEMPLATE_CONFIGS[id] ?? TEMPLATE_CONFIGS.onyx;
}
