// =============================================================================
// DMSuite — Pro Template Definitions (Simplified Metadata)
// Each template's CSS lives in src/data/template-css.ts.
// Each template's JSX lives in UniversalTemplate.tsx.
// This file only holds metadata for the registry, store, and pagination.
// =============================================================================

import type { TemplateId } from "@/lib/resume/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProTemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  /** Google Fonts URL for the template */
  googleFontUrl: string;
  /** CSS font-family for headings */
  headingFont: string;
  /** CSS font-family for body text */
  bodyFont: string;
  /** Default font pairing key (matches FONT_PAIRINGS in schema) */
  defaultFontPairing: string;
  /** Whether the template background is dark */
  isDark: boolean;
  /** Background color (for page rendering) */
  backgroundColor: string;
  /** Primary accent color (for thumbnail previews) */
  accent: string;
  /** Whether the template uses two-column layout */
  isTwoColumn: boolean;
  /** Sidebar position: left, right, or none */
  sidebarPosition: "left" | "right" | "none";
  /** Sidebar width in px (0 for no sidebar) */
  sidebarWidthPx: number;
  /** Sections placed in the main column */
  mainSections: string[];
  /** Sections placed in the sidebar column */
  sidebarSections: string[];
}

// ---------------------------------------------------------------------------
// Template Definitions
// ---------------------------------------------------------------------------

export const PRO_TEMPLATES: ProTemplateDefinition[] = [
  // 01 — Modern Minimalist
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    description: "Clean and refined with gold accents and elegant spacing",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap",
    headingFont: "'Plus Jakarta Sans', sans-serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    defaultFontPairing: "jakarta-jakarta",
    isDark: false,
    backgroundColor: "#FAFAF8",
    accent: "#C8A97E",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 220,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "languages", "certifications"],
  },

  // 02 — Corporate Executive
  {
    id: "corporate-executive",
    name: "Corporate Executive",
    description: "Formal navy banner with gold accents for senior professionals",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700;800&family=Raleway:wght@300;400;500;600;700&display=swap",
    headingFont: "'Cormorant Garamond', serif",
    bodyFont: "'Raleway', sans-serif",
    defaultFontPairing: "cormorant-raleway",
    isDark: false,
    backgroundColor: "#FFFFFF",
    accent: "#C5963A",
    isTwoColumn: false,
    sidebarPosition: "none",
    sidebarWidthPx: 0,
    mainSections: ["summary", "experience", "projects", "certifications"],
    sidebarSections: ["skills", "education", "languages"],
  },

  // 03 — Creative Bold
  {
    id: "creative-bold",
    name: "Creative Bold",
    description: "Bold dark header with vibrant pink, blue, and yellow accents",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@300;400;500;600;700&display=swap",
    headingFont: "'Archivo Black', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    defaultFontPairing: "archivo-dm",
    isDark: false,
    backgroundColor: "#F5F5F0",
    accent: "#FF2E6C",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 200,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 04 — Elegant Sidebar
  {
    id: "elegant-sidebar",
    name: "Elegant Sidebar",
    description: "Dark gradient sidebar with gold accents and serif headings",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&display=swap",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    defaultFontPairing: "playfair-source",
    isDark: false,
    backgroundColor: "#FDFCFA",
    accent: "#E8B86D",
    isTwoColumn: true,
    sidebarPosition: "left",
    sidebarWidthPx: 220,
    mainSections: ["summary", "experience", "projects", "certifications"],
    sidebarSections: ["skills", "education", "languages"],
  },

  // 05 — Infographic
  {
    id: "infographic",
    name: "Infographic",
    description: "Visual infographic style with circular progress bars and metrics",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800;900&display=swap",
    headingFont: "'Nunito', sans-serif",
    bodyFont: "'Nunito', sans-serif",
    defaultFontPairing: "nunito-nunito",
    isDark: false,
    backgroundColor: "#F8FAFC",
    accent: "#0D9488",
    isTwoColumn: true,
    sidebarPosition: "left",
    sidebarWidthPx: 230,
    mainSections: ["summary", "experience", "projects", "certifications"],
    sidebarSections: ["skills", "education", "languages"],
  },

  // 06 — Dark Professional
  {
    id: "dark-professional",
    name: "Dark Professional",
    description: "Full dark theme with neon cyan and purple accents",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap",
    headingFont: "'Outfit', sans-serif",
    bodyFont: "'Outfit', sans-serif",
    defaultFontPairing: "outfit-outfit",
    isDark: true,
    backgroundColor: "#0F0F0F",
    accent: "#00D4AA",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 210,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 07 — Gradient Creative
  {
    id: "gradient-creative",
    name: "Gradient Creative",
    description: "Purple-pink gradient header with colorful accents throughout",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap",
    headingFont: "'Sora', sans-serif",
    bodyFont: "'Sora', sans-serif",
    defaultFontPairing: "sora-sora",
    isDark: false,
    backgroundColor: "#FAFAFE",
    accent: "#764BA2",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 200,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "languages", "certifications"],
  },

  // 08 — Classic Corporate
  {
    id: "classic-corporate",
    name: "Classic Corporate",
    description: "Timeless serif+sans pairing with structured corporate layout",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Open+Sans:wght@300;400;500;600;700&display=swap",
    headingFont: "'Libre Baskerville', serif",
    bodyFont: "'Open Sans', sans-serif",
    defaultFontPairing: "baskerville-open",
    isDark: false,
    backgroundColor: "#FCFCFC",
    accent: "#2563EB",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 200,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 09 — Artistic Portfolio
  {
    id: "artistic-portfolio",
    name: "Artistic Portfolio",
    description: "Colorful with decorative shapes and gradient project cards",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Crimson+Pro:wght@300;400;500;600;700&display=swap",
    headingFont: "'Bricolage Grotesque', sans-serif",
    bodyFont: "'Crimson Pro', serif",
    defaultFontPairing: "bricolage-crimson",
    isDark: false,
    backgroundColor: "#F8F9FA",
    accent: "#FF6B6B",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 210,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 10 — Tech Modern
  {
    id: "tech-modern",
    name: "Tech Modern",
    description: "Dark terminal aesthetic with code syntax highlights",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
    headingFont: "'JetBrains Mono', monospace",
    bodyFont: "'Inter', sans-serif",
    defaultFontPairing: "jetbrains-inter",
    isDark: true,
    backgroundColor: "#0C1222",
    accent: "#22C55E",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 200,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 11 — Swiss Typographic
  {
    id: "swiss-typographic",
    name: "Swiss Typographic",
    description: "Minimal red + black Swiss design with typographic hierarchy",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap",
    headingFont: "'IBM Plex Sans', sans-serif",
    bodyFont: "'IBM Plex Sans', sans-serif",
    defaultFontPairing: "ibm-plex-ibm-plex",
    isDark: false,
    backgroundColor: "#FFFFFF",
    accent: "#E63946",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 180,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 12 — Newspaper Editorial
  {
    id: "newspaper-editorial",
    name: "Newspaper Editorial",
    description: "Classic newspaper layout with serif fonts and drop caps",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Lora:wght@400;500;600;700&family=Lora:ital,wght@1,400;1,500&display=swap",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Lora', serif",
    defaultFontPairing: "playfair-lora",
    isDark: false,
    backgroundColor: "#FDF9F3",
    accent: "#1A1A1A",
    isTwoColumn: true,
    sidebarPosition: "none",
    sidebarWidthPx: 0,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 13 — Brutalist Mono
  {
    id: "brutalist-mono",
    name: "Brutalist Mono",
    description: "Raw brutalist design with monospace type and neon green accent",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
    headingFont: "'Space Mono', monospace",
    bodyFont: "'Space Grotesk', sans-serif",
    defaultFontPairing: "space-mono-grotesk",
    isDark: false,
    backgroundColor: "#FAFAFA",
    accent: "#00FF88",
    isTwoColumn: false,
    sidebarPosition: "none",
    sidebarWidthPx: 0,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 14 — Pastel Soft
  {
    id: "pastel-soft",
    name: "Pastel Soft",
    description: "Gentle pastel gradients with rounded, friendly design",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap",
    headingFont: "'Quicksand', sans-serif",
    bodyFont: "'Quicksand', sans-serif",
    defaultFontPairing: "quicksand-quicksand",
    isDark: false,
    backgroundColor: "#FFFFFF",
    accent: "#F8A4C8",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 190,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 15 — Split Duotone
  {
    id: "split-duotone",
    name: "Split Duotone",
    description: "Teal/coral two-tone split with warm cream right panel",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap",
    headingFont: "'Manrope', sans-serif",
    bodyFont: "'Manrope', sans-serif",
    defaultFontPairing: "manrope-manrope",
    isDark: false,
    backgroundColor: "#FFF9F5",
    accent: "#FF6B5A",
    isTwoColumn: true,
    sidebarPosition: "left",
    sidebarWidthPx: 210,
    mainSections: ["summary", "experience", "projects", "certifications"],
    sidebarSections: ["skills", "education", "languages"],
  },

  // 16 — Architecture Blueprint
  {
    id: "architecture-blueprint",
    name: "Architecture Blueprint",
    description: "Technical blueprint grid with navy headers and diamond markers",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap",
    headingFont: "'DM Sans', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    defaultFontPairing: "dm-sans-mono",
    isDark: false,
    backgroundColor: "#FDFDFD",
    accent: "#2563EB",
    isTwoColumn: false,
    sidebarPosition: "none",
    sidebarWidthPx: 0,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 17 — Retro Vintage
  {
    id: "retro-vintage",
    name: "Retro Vintage",
    description: "Ornamental vintage design with brown/gold palette",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Stint+Ultra+Expanded&family=Josefin+Sans:wght@300;400;500;600;700&display=swap",
    headingFont: "'Stint Ultra Expanded', serif",
    bodyFont: "'Josefin Sans', sans-serif",
    defaultFontPairing: "stint-josefin",
    isDark: false,
    backgroundColor: "#FBF6EE",
    accent: "#C4973B",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 170,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 18 — Medical Clean
  {
    id: "medical-clean",
    name: "Medical Clean",
    description: "Clean teal/white professional design for medical fields",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800&display=swap",
    headingFont: "'Figtree', sans-serif",
    bodyFont: "'Figtree', sans-serif",
    defaultFontPairing: "figtree-figtree",
    isDark: false,
    backgroundColor: "#FFFFFF",
    accent: "#0891B2",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 190,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 19 — Neon Glass
  {
    id: "neon-glass",
    name: "Neon Glass",
    description: "Dark glassmorphism with neon pink/blue/purple gradients",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap",
    headingFont: "'Poppins', sans-serif",
    bodyFont: "'Poppins', sans-serif",
    defaultFontPairing: "poppins-poppins",
    isDark: true,
    backgroundColor: "#0F0A1A",
    accent: "#FF2D78",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 190,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },

  // 20 — Corporate Stripe
  {
    id: "corporate-stripe",
    name: "Corporate Stripe",
    description: "Navy header with gold accent stripe and clean corporate layout",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap",
    headingFont: "'Source Sans 3', sans-serif",
    bodyFont: "'Source Sans 3', sans-serif",
    defaultFontPairing: "source-sans-source-sans",
    isDark: false,
    backgroundColor: "#FAFBFC",
    accent: "#D4A84B",
    isTwoColumn: true,
    sidebarPosition: "right",
    sidebarWidthPx: 185,
    mainSections: ["summary", "experience", "projects"],
    sidebarSections: ["skills", "education", "certifications", "languages"],
  },
];

// ---------------------------------------------------------------------------
// Lookup Helpers
// ---------------------------------------------------------------------------

const PRO_TEMPLATE_MAP = new Map(PRO_TEMPLATES.map((t) => [t.id, t]));

export function getProTemplate(id: TemplateId): ProTemplateDefinition | undefined {
  return PRO_TEMPLATE_MAP.get(id);
}

export function isProTemplate(id: TemplateId): boolean {
  return PRO_TEMPLATE_MAP.has(id);
}
