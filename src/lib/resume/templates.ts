// =============================================================================
// DMSuite — Resume Template Definitions
// 20 carefully crafted, modern & minimalist resume templates.
// Each template has a distinct visual identity, refined color palette,
// curated font pairing, and intentional layout choices.
//
// Design principles:
// - Typography-driven hierarchy (not decorative elements)
// - Print-safe, ATS-friendly color choices
// - Generous whitespace and breathing room
// - Every combination tested: bulky content, minimal content, single-column
// - Font pairings chosen for contrast + readability at small sizes
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

  // ---------------------------------------------------------------------------
  // 1. ONYX — Platform Default / Professional Executive
  // The signature DMSuite template. Electric Violet accent with a subtle
  // sidebar tint. Serif headings give it gravitas; banner header anchors the
  // page. Thin line dividers keep sections distinct without clutter.
  // Best for: Senior professionals, executives, consultants.
  // ---------------------------------------------------------------------------
  onyx: {
    id: "onyx",
    name: "Onyx",
    description: "Refined executive style — violet accent with subtle sidebar tint",
    thumbnail: "💎",
    accentColor: "rgba(109,40,217,1)",   // violet-700 — deeper, more authoritative
    fontPairing: "ibmplex-serif",
    sidebarWidth: 34,
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

  // ---------------------------------------------------------------------------
  // 2. AZURILL — Nordic Minimal
  // Ultra-clean Scandinavian-inspired design. Muted slate accent disappears
  // into the typography, letting the content speak. Centered header creates
  // a calm, symmetrical opening. No dividers — whitespace is the separator.
  // Skills shown as chips for a contemporary feel.
  // Best for: Designers, UX professionals, minimalism-forward roles.
  // ---------------------------------------------------------------------------
  azurill: {
    id: "azurill",
    name: "Azurill",
    description: "Nordic minimal — muted tones, centered header, pure whitespace",
    thumbnail: "❄️",
    accentColor: "rgba(71,85,105,1)",    // slate-600 — sophisticated neutral
    fontPairing: "inter-inter",
    sidebarWidth: 33,
    sidebarLeft: false,
    style: {
      headerStyle: "centered",
      sectionDivider: "none",
      skillStyle: "chips",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: false,
    },
  },

  // ---------------------------------------------------------------------------
  // 3. BRONZOR — Editorial Classic
  // Inspired by newspaper editorial layouts. Warm near-black accent with
  // Playfair Display headings creates an authoritative, literary feel.
  // Thick bottom borders on section titles echo editorial column rules.
  // Centered header with bold serif name is the focal point.
  // Best for: Writers, editors, academics, law, publishing.
  // ---------------------------------------------------------------------------
  bronzor: {
    id: "bronzor",
    name: "Bronzor",
    description: "Editorial serif — warm charcoal tones with bold section rules",
    thumbnail: "📰",
    accentColor: "rgba(41,37,36,1)",     // stone-800 — warm near-black
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

  // ---------------------------------------------------------------------------
  // 4. CHIKORITA — Fresh Modern
  // Contemporary and approachable. Deep teal accent feels energetic yet
  // professional. Poppins geometric headings + Inter body create a clean,
  // friendly contrast. No dividers — hierarchy through typography alone.
  // Chip-style skills add a modern, tag-based feel.
  // Best for: Startups, tech, product roles, marketing.
  // ---------------------------------------------------------------------------
  chikorita: {
    id: "chikorita",
    name: "Chikorita",
    description: "Fresh geometric — teal accent, clean typography, zero clutter",
    thumbnail: "🌿",
    accentColor: "rgba(13,148,136,1)",   // teal-600 — deep, sophisticated teal
    fontPairing: "poppins-inter",
    sidebarWidth: 32,
    sidebarLeft: false,
    style: {
      headerStyle: "classic",
      sectionDivider: "none",
      skillStyle: "chips",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: false,
    },
  },

  // ---------------------------------------------------------------------------
  // 5. DITTO — Swiss Precision
  // Inspired by Swiss/International Typographic Style. Near-black accent
  // with IBM Plex Sans creates a grid-like, rational design. Every element
  // is aligned and intentional. Thin line dividers provide just enough
  // structure. Progress bars for skills reinforce the systematic feel.
  // Best for: Engineers, analysts, finance, operations, any corporate role.
  // ---------------------------------------------------------------------------
  ditto: {
    id: "ditto",
    name: "Ditto",
    description: "Swiss precision — systematic layout, near-black accent, san-serif clean",
    thumbnail: "⬛",
    accentColor: "rgba(23,23,23,1)",     // neutral-900 — near-black
    fontPairing: "ibmplex-sans",
    sidebarWidth: 34,
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

  // ---------------------------------------------------------------------------
  // 6. GENGAR — Bold Studio
  // High visual impact with a tinted left sidebar. Deep indigo accent
  // with DM Serif Display creates dramatic typographic contrast against
  // DM Sans body text. No dividers — the sidebar background itself
  // provides the structural separation. Bars for skills match the bold feel.
  // Best for: Creative directors, brand strategists, architects, bold roles.
  // ---------------------------------------------------------------------------
  gengar: {
    id: "gengar",
    name: "Gengar",
    description: "Bold studio — deep indigo left sidebar with dramatic serif contrast",
    thumbnail: "🎭",
    accentColor: "rgba(67,56,202,1)",    // indigo-700 — deep, rich indigo
    fontPairing: "dmserif-dmsans",
    sidebarWidth: 36,
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

  // ---------------------------------------------------------------------------
  // 7. GLALIE — Corporate Frost
  // Cool, composed, and buttoned-up. Slate blue accent with Raleway/Lato
  // is the quintessential corporate template. Subtle dotted dividers add
  // gentle structure without heaviness. Compact mode uses space efficiently.
  // Dot-style skill indicators feel measured and professional.
  // Best for: Banking, consulting, government, traditional corporate.
  // ---------------------------------------------------------------------------
  glalie: {
    id: "glalie",
    name: "Glalie",
    description: "Corporate frost — cool slate, dotted dividers, compact & composed",
    thumbnail: "🧊",
    accentColor: "rgba(51,65,85,1)",     // slate-700 — cool corporate blue-gray
    fontPairing: "raleway-lato",
    sidebarWidth: 32,
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

  // ---------------------------------------------------------------------------
  // 8. KAKUNA — Single Column Focus
  // Maximum content space with zero sidebar. Warm amber accent adds
  // personality without distraction. Crimson Pro/Work Sans pairing gives
  // it a warm, approachable editorial quality. Inline dates keep the
  // reading flow horizontal. Grouped skills maximize information density.
  // Best for: Career changers, academia, research, content-heavy resumes.
  // ---------------------------------------------------------------------------
  kakuna: {
    id: "kakuna",
    name: "Kakuna",
    description: "Single column — full-width layout for maximum content space",
    thumbnail: "📄",
    accentColor: "rgba(161,98,7,1)",     // amber-700 — warm, print-friendly ochre
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

  // ---------------------------------------------------------------------------
  // 9. LAPRAS — Ocean Professional
  // Balanced and trustworthy. Deep blue accent with Inter's neutral
  // geometry creates a template that works in any industry. Classic
  // header with thin line dividers — nothing flashy, everything
  // intentional. Chip-style skills add a modern touch to an otherwise
  // traditional layout.
  // Best for: Versatile — works across all industries and experience levels.
  // ---------------------------------------------------------------------------
  lapras: {
    id: "lapras",
    name: "Lapras",
    description: "Ocean professional — deep blue, balanced layout, universally trusted",
    thumbnail: "🌊",
    accentColor: "rgba(29,78,216,1)",    // blue-700 — trustworthy deep blue
    fontPairing: "inter-inter",
    sidebarWidth: 34,
    sidebarLeft: false,
    style: {
      headerStyle: "classic",
      sectionDivider: "line",
      skillStyle: "chips",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: false,
    },
  },

  // ---------------------------------------------------------------------------
  // 10. LEAFISH — Organic Elegance
  // Serene and cultured. Forest green accent with Cormorant Garamond
  // headings creates a distinctly elegant, literary feel. Timeline markers
  // add vertical rhythm to the experience section. The serif/sans contrast
  // (Cormorant heading, Proza body) gives it scholarly character.
  // Best for: Non-profits, education, healthcare, sustainability, arts.
  // ---------------------------------------------------------------------------
  leafish: {
    id: "leafish",
    name: "Leafish",
    description: "Organic elegance — forest green, serif headings, timeline rhythm",
    thumbnail: "🍃",
    accentColor: "rgba(21,128,61,1)",    // green-700 — rich, print-optimized forest
    fontPairing: "cormorant-proza",
    sidebarWidth: 33,
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

  // ---------------------------------------------------------------------------
  // 11. PIKACHU — Dynamic Split
  // Energetic and confident. Rich amber/gold accent with Montserrat
  // headings creates a bold, modern impression. Split header puts the
  // name and contact info on opposing sides for visual tension. Double
  // section dividers add a distinctive flourish. Chips for skills
  // keep the dynamic energy flowing.
  // Best for: Sales, marketing, entrepreneurship, startup founders.
  // ---------------------------------------------------------------------------
  pikachu: {
    id: "pikachu",
    name: "Pikachu",
    description: "Dynamic split — amber accent, split header, bold & energetic",
    thumbnail: "⚡",
    accentColor: "rgba(217,119,6,1)",    // amber-600 — rich gold, print-safe
    fontPairing: "montserrat-opensans",
    sidebarWidth: 35,
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

  // ---------------------------------------------------------------------------
  // 12. RHYHORN — Structured Matrix
  // Systematic and grounded. Cool zinc-gray accent with Space Grotesk
  // headings gives it a technical, no-nonsense character. Left sidebar
  // with subtle background tint creates clear information hierarchy.
  // Thick dividers echo data-table aesthetics. Plain skill lists are
  // information-dense and scannable.
  // Best for: Engineering, data science, IT, DevOps, technical management.
  // ---------------------------------------------------------------------------
  rhyhorn: {
    id: "rhyhorn",
    name: "Rhyhorn",
    description: "Structured matrix — zinc-gray, left sidebar, technical & grounded",
    thumbnail: "🔧",
    accentColor: "rgba(82,82,91,1)",     // zinc-600 — neutral, technical gray
    fontPairing: "spacegrotesk-inter",
    sidebarWidth: 38,
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

  // ---------------------------------------------------------------------------
  // 13. DITGAR — Midnight Canvas
  // Creative and distinctive. Rich purple accent with Poppins/Inter
  // creates a modern, expressive feel. Left sidebar with background
  // tint provides visual weight on the left. Thin line dividers keep
  // it organized. Progress bars for skills match the modern aesthetic.
  // Best for: Creative professionals, designers, photographers, artists.
  // ---------------------------------------------------------------------------
  ditgar: {
    id: "ditgar",
    name: "Ditgar",
    description: "Midnight canvas — rich purple, left sidebar, creative & expressive",
    thumbnail: "🎨",
    accentColor: "rgba(126,34,206,1)",   // purple-700 — rich, deep purple
    fontPairing: "poppins-inter",
    sidebarWidth: 36,
    sidebarLeft: true,
    style: {
      headerStyle: "sidebar-header",
      sectionDivider: "line",
      skillStyle: "bars",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: true,
    },
  },

  // ---------------------------------------------------------------------------
  // 14. NIDORAN — Executive Crimson
  // Commanding and sophisticated. Deep rose-red accent commands attention
  // while Merriweather/Roboto pairing grounds it in credibility. Banner
  // header with thick section dividers creates a structured, authoritative
  // layout. Dot-style skills feel measured and precise.
  // Best for: C-suite executives, board members, leadership roles.
  // ---------------------------------------------------------------------------
  nidoran: {
    id: "nidoran",
    name: "Nidoran",
    description: "Executive crimson — commanding rose-red accent with serif authority",
    thumbnail: "🔴",
    accentColor: "rgba(190,18,60,1)",    // rose-700 — print-safe deep crimson
    fontPairing: "merriweather-roboto",
    sidebarWidth: 34,
    sidebarLeft: false,
    style: {
      headerStyle: "banner",
      sectionDivider: "thick",
      skillStyle: "dots",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: true,
    },
  },

  // ---------------------------------------------------------------------------
  // 15. EEVEE — Adaptive Modern
  // Versatile and balanced. Warm violet-pink accent with Garamond/Nunito
  // pairing creates a template that adapts to any tone — corporate or
  // creative. Minimal header keeps focus on content. Timeline markers
  // add visual progression. Skills grouped for density.
  // Best for: Career changers, hybrid roles, portfolio + experience mix.
  // ---------------------------------------------------------------------------
  eevee: {
    id: "eevee",
    name: "Eevee",
    description: "Adaptive modern — warm violet-pink, timeline markers, versatile layout",
    thumbnail: "🦊",
    accentColor: "rgba(168,85,247,1)",   // purple-500 — vibrant yet professional
    fontPairing: "garamond-nunito",
    sidebarWidth: 33,
    sidebarLeft: false,
    style: {
      headerStyle: "minimal",
      sectionDivider: "line",
      skillStyle: "grouped",
      dateStyle: "right",
      compact: false,
      hasTimeline: true,
      hasSidebarBg: false,
    },
  },

  // ---------------------------------------------------------------------------
  // 16. SNORLAX — Comfortable Classic
  // Warm and inviting. Soft slate accent with generous whitespace creates
  // a comfortable reading experience. Full-width single-column layout
  // gives content maximum breathing room. Raleway/Lato for approachable
  // typography. Dotted dividers add gentle rhythm.
  // Best for: Teaching, counseling, healthcare, non-technical roles.
  // ---------------------------------------------------------------------------
  snorlax: {
    id: "snorlax",
    name: "Snorlax",
    description: "Comfortable classic — soft slate, full-width, generous whitespace",
    thumbnail: "😴",
    accentColor: "rgba(100,116,139,1)",  // slate-500 — soft, approachable gray
    fontPairing: "raleway-lato",
    sidebarWidth: 0,
    sidebarLeft: false,
    style: {
      headerStyle: "centered",
      sectionDivider: "dotted",
      skillStyle: "plain",
      dateStyle: "below",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: false,
    },
  },

  // ---------------------------------------------------------------------------
  // 17. JOLTEON — Electric Edge
  // Sharp and high-energy. Vibrant amber-yellow accent with Space Grotesk
  // headings creates a bold, tech-forward impression. Split header for
  // visual tension. Chip-style skills feel modern and tagged. Compact
  // mode packs information densely for experienced professionals.
  // Best for: Startup founders, growth marketers, product managers.
  // ---------------------------------------------------------------------------
  jolteon: {
    id: "jolteon",
    name: "Jolteon",
    description: "Electric edge — vibrant amber, split header, compact & high-energy",
    thumbnail: "⚡",
    accentColor: "rgba(245,158,11,1)",   // amber-500 — electric, vibrant gold
    fontPairing: "spacegrotesk-inter",
    sidebarWidth: 35,
    sidebarLeft: false,
    style: {
      headerStyle: "split",
      sectionDivider: "line",
      skillStyle: "chips",
      dateStyle: "right",
      compact: true,
      hasTimeline: false,
      hasSidebarBg: false,
    },
  },

  // ---------------------------------------------------------------------------
  // 18. CLEFAIRY — Soft Elegance
  // Gentle and refined. Rose-pink accent with Crimson Pro/Work Sans
  // creates a warm, welcoming impression. Centered header with no
  // sidebar keeps the layout intimate. Thin line dividers provide
  // structure without aggression. Bar-style skills for visual balance.
  // Best for: HR, communications, event planning, creative services.
  // ---------------------------------------------------------------------------
  clefairy: {
    id: "clefairy",
    name: "Clefairy",
    description: "Soft elegance — rose-pink accent, centered header, warm & refined",
    thumbnail: "🌸",
    accentColor: "rgba(225,29,72,1)",    // rose-600 — warm rose-pink
    fontPairing: "crimsonpro-worksans",
    sidebarWidth: 32,
    sidebarLeft: false,
    style: {
      headerStyle: "centered",
      sectionDivider: "line",
      skillStyle: "bars",
      dateStyle: "right",
      compact: false,
      hasTimeline: false,
      hasSidebarBg: false,
    },
  },

  // ---------------------------------------------------------------------------
  // 19. UMBREON — Dark Professional
  // Intriguing and modern. Deep blue-slate accent with IBM Plex Serif
  // creates a distinctive, professional feel. Right sidebar with subtle
  // background tint. Timeline markers add career progression visualization.
  // Double dividers create a unique section rhythm.
  // Best for: Architecture, design management, luxury brands, consulting.
  // ---------------------------------------------------------------------------
  umbreon: {
    id: "umbreon",
    name: "Umbreon",
    description: "Dark professional — deep blue-slate, right sidebar with timeline",
    thumbnail: "🌙",
    accentColor: "rgba(30,58,138,1)",    // blue-900 — deep midnight blue
    fontPairing: "ibmplex-serif",
    sidebarWidth: 35,
    sidebarLeft: false,
    style: {
      headerStyle: "classic",
      sectionDivider: "double",
      skillStyle: "dots",
      dateStyle: "right",
      compact: false,
      hasTimeline: true,
      hasSidebarBg: true,
    },
  },

  // ---------------------------------------------------------------------------
  // 20. MEWTWO — Monochrome Power
  // Commanding and modern. Pure black accent with Montserrat/Open Sans
  // creates a bold, high-contrast design. Left sidebar with tinted
  // background gives strong structural hierarchy. Thick section dividers
  // and grouped skills create information density. Banner header spans
  // full width for maximum name presence.
  // Best for: Executives, tech leaders, senior engineers, VPs.
  // ---------------------------------------------------------------------------
  mewtwo: {
    id: "mewtwo",
    name: "Mewtwo",
    description: "Monochrome power — pure black, left sidebar, bold & commanding",
    thumbnail: "⬛",
    accentColor: "rgba(0,0,0,1)",        // pure black — maximum contrast
    fontPairing: "montserrat-opensans",
    sidebarWidth: 37,
    sidebarLeft: true,
    style: {
      headerStyle: "banner",
      sectionDivider: "thick",
      skillStyle: "grouped",
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
