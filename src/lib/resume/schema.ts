// =============================================================================
// DMSuite — Resume Data Schema
// Zod-validated schema for ALL resume data types. Single source of truth.
// Inspired by Reactive Resume's comprehensive Zod schema (data.ts ~650 lines).
// =============================================================================

import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// Utility schemas
// ---------------------------------------------------------------------------

export const idSchema = z.string().min(1);

export const urlSchema = z.object({
  url: z.string().default(""),
  label: z.string().default(""),
});

export const customFieldSchema = z.object({
  id: idSchema,
  icon: z.string().default(""),
  name: z.string().default(""),
  value: z.string().default(""),
});

// ---------------------------------------------------------------------------
// Basics — Personal information & contact
// ---------------------------------------------------------------------------

export const basicsSchema = z.object({
  name: z.string().default(""),
  headline: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  website: urlSchema.default({ url: "", label: "" }),
  linkedin: z.string().default(""),
  customFields: z.array(customFieldSchema).default([]),
});

export type Basics = z.infer<typeof basicsSchema>;

// ---------------------------------------------------------------------------
// Section item schemas
// ---------------------------------------------------------------------------

export const summarySchema = z.object({
  title: z.string().default("Professional Summary"),
  content: z.string().default(""),
  hidden: z.boolean().default(false),
});

export type Summary = z.infer<typeof summarySchema>;

export const experienceItemSchema = z.object({
  id: idSchema,
  hidden: z.boolean().default(false),
  company: z.string().default(""),
  position: z.string().default(""),
  location: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  isCurrent: z.boolean().default(false),
  website: z.string().default(""),
  description: z.string().default(""),
});

export type ExperienceItem = z.infer<typeof experienceItemSchema>;

export const educationItemSchema = z.object({
  id: idSchema,
  hidden: z.boolean().default(false),
  institution: z.string().default(""),
  degree: z.string().default(""),
  field: z.string().default(""),
  graduationYear: z.string().default(""),
  description: z.string().default(""),
});

export type EducationItem = z.infer<typeof educationItemSchema>;

export const skillItemSchema = z.object({
  id: idSchema,
  hidden: z.boolean().default(false),
  name: z.string().default(""),
  keywords: z.array(z.string()).default([]),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
});

export type SkillItem = z.infer<typeof skillItemSchema>;

export const certificationItemSchema = z.object({
  id: idSchema,
  hidden: z.boolean().default(false),
  name: z.string().default(""),
  issuer: z.string().default(""),
  year: z.string().default(""),
  url: z.string().default(""),
});

export type CertificationItem = z.infer<typeof certificationItemSchema>;

export const languageItemSchema = z.object({
  id: idSchema,
  hidden: z.boolean().default(false),
  name: z.string().default(""),
  proficiency: z.enum(["native", "fluent", "intermediate", "basic"]).default("intermediate"),
});

export type LanguageItem = z.infer<typeof languageItemSchema>;

export const volunteerItemSchema = z.object({
  id: idSchema,
  hidden: z.boolean().default(false),
  organization: z.string().default(""),
  role: z.string().default(""),
  description: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
});

export type VolunteerItem = z.infer<typeof volunteerItemSchema>;

export const projectItemSchema = z.object({
  id: idSchema,
  hidden: z.boolean().default(false),
  name: z.string().default(""),
  description: z.string().default(""),
  url: z.string().default(""),
  keywords: z.array(z.string()).default([]),
});

export type ProjectItem = z.infer<typeof projectItemSchema>;

export const awardItemSchema = z.object({
  id: idSchema,
  hidden: z.boolean().default(false),
  title: z.string().default(""),
  issuer: z.string().default(""),
  date: z.string().default(""),
  description: z.string().default(""),
});

export type AwardItem = z.infer<typeof awardItemSchema>;

export const referenceItemSchema = z.object({
  id: idSchema,
  hidden: z.boolean().default(false),
  name: z.string().default(""),
  relationship: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  description: z.string().default(""),
});

export type ReferenceItem = z.infer<typeof referenceItemSchema>;

// ---------------------------------------------------------------------------
// Built-in sections
// ---------------------------------------------------------------------------

export const sectionsSchema = z.object({
  summary: summarySchema.default({
    title: "Professional Summary",
    content: "",
    hidden: false,
  }),
  experience: z.object({
    title: z.string().default("Work Experience"),
    items: z.array(experienceItemSchema).default([]),
    hidden: z.boolean().default(false),
  }).default({ title: "Work Experience", items: [], hidden: false }),
  education: z.object({
    title: z.string().default("Education"),
    items: z.array(educationItemSchema).default([]),
    hidden: z.boolean().default(false),
  }).default({ title: "Education", items: [], hidden: false }),
  skills: z.object({
    title: z.string().default("Skills"),
    items: z.array(skillItemSchema).default([]),
    hidden: z.boolean().default(false),
  }).default({ title: "Skills", items: [], hidden: false }),
  certifications: z.object({
    title: z.string().default("Certifications"),
    items: z.array(certificationItemSchema).default([]),
    hidden: z.boolean().default(false),
  }).default({ title: "Certifications", items: [], hidden: false }),
  languages: z.object({
    title: z.string().default("Languages"),
    items: z.array(languageItemSchema).default([]),
    hidden: z.boolean().default(false),
  }).default({ title: "Languages", items: [], hidden: false }),
  volunteer: z.object({
    title: z.string().default("Volunteer Experience"),
    items: z.array(volunteerItemSchema).default([]),
    hidden: z.boolean().default(false),
  }).default({ title: "Volunteer Experience", items: [], hidden: false }),
  projects: z.object({
    title: z.string().default("Projects"),
    items: z.array(projectItemSchema).default([]),
    hidden: z.boolean().default(false),
  }).default({ title: "Projects", items: [], hidden: false }),
  awards: z.object({
    title: z.string().default("Awards"),
    items: z.array(awardItemSchema).default([]),
    hidden: z.boolean().default(false),
  }).default({ title: "Awards", items: [], hidden: false }),
  references: z.object({
    title: z.string().default("References"),
    items: z.array(referenceItemSchema).default([]),
    hidden: z.boolean().default(false),
  }).default({ title: "References", items: [], hidden: false }),
});

export type Sections = z.infer<typeof sectionsSchema>;

// ---------------------------------------------------------------------------
// Custom sections
// ---------------------------------------------------------------------------

export const customSectionItemSchema = z.object({
  id: idSchema,
  hidden: z.boolean().default(false),
  title: z.string().default(""),
  subtitle: z.string().default(""),
  date: z.string().default(""),
  description: z.string().default(""),
  url: z.string().default(""),
});

export type CustomSectionItem = z.infer<typeof customSectionItemSchema>;

export const customSectionSchema = z.object({
  id: idSchema,
  title: z.string().default("Custom Section"),
  type: z.enum(["basic", "detailed"]).default("basic"),
  items: z.array(customSectionItemSchema).default([]),
  hidden: z.boolean().default(false),
});

export type CustomSection = z.infer<typeof customSectionSchema>;

// ---------------------------------------------------------------------------
// Layout — Per-page section arrangement (from Reactive Resume)
// ---------------------------------------------------------------------------

export const pageLayoutSchema = z.object({
  fullWidth: z.boolean().default(false),
  main: z.array(z.string()).default([]),
  sidebar: z.array(z.string()).default([]),
});

export type PageLayout = z.infer<typeof pageLayoutSchema>;

export const layoutSchema = z.object({
  sidebarWidth: z.number().min(20).max(45).default(35),
  pages: z.array(pageLayoutSchema).default([
    {
      fullWidth: false,
      main: ["summary", "experience", "projects"],
      sidebar: ["skills", "education", "certifications", "languages"],
    },
  ]),
});

export type Layout = z.infer<typeof layoutSchema>;

// ---------------------------------------------------------------------------
// Design metadata — CSS custom properties + visual configuration
// ---------------------------------------------------------------------------

export const templateId = z.enum([
  // ── Pro Templates (20 HTML-based) ──
  "modern-minimalist",
  "corporate-executive",
  "creative-bold",
  "elegant-sidebar",
  "infographic",
  "dark-professional",
  "gradient-creative",
  "classic-corporate",
  "artistic-portfolio",
  "tech-modern",
  "swiss-typographic",
  "newspaper-editorial",
  "brutalist-mono",
  "pastel-soft",
  "split-duotone",
  "architecture-blueprint",
  "retro-vintage",
  "medical-clean",
  "neon-glass",
  "corporate-stripe",
]);

export type TemplateId = z.infer<typeof templateId>;

export const pageFormatSchema = z.enum([
  "a4",
  "letter",
  "a5",
  "b5",
  "linkedin-banner",   // 1584×396  → social sharing
  "instagram-square",  // 1080×1080 → social sharing
]);
export type PageFormat = z.infer<typeof pageFormatSchema>;

export const colorIntensitySchema = z.enum(["subtle", "standard", "bold"]);
export type ColorIntensity = z.infer<typeof colorIntensitySchema>;

export const fontScaleSchema = z.enum(["compact", "standard", "spacious"]);
export type FontScale = z.infer<typeof fontScaleSchema>;

export const marginPresetSchema = z.enum(["narrow", "standard", "wide"]);
export type MarginPreset = z.infer<typeof marginPresetSchema>;

export const sectionSpacingSchema = z.enum(["compact", "standard", "relaxed"]);
export type SectionSpacing = z.infer<typeof sectionSpacingSchema>;

export const lineSpacingSchema = z.enum(["tight", "normal", "loose"]);
export type LineSpacing = z.infer<typeof lineSpacingSchema>;

export const metadataSchema = z.object({
  template: templateId.default("modern-minimalist"),
  layout: layoutSchema.default({
    sidebarWidth: 35,
    pages: [
      {
        fullWidth: false,
        main: ["summary", "experience", "projects"],
        sidebar: ["skills", "education", "certifications", "languages"],
      },
    ],
  }),
  css: z.object({
    enabled: z.boolean().default(false),
    value: z.string().default(""),
  }).default({ enabled: false, value: "" }),
  page: z.object({
    format: pageFormatSchema.default("a4"),
    marginPreset: marginPresetSchema.default("standard"),
    sectionSpacing: sectionSpacingSchema.default("standard"),
    lineSpacing: lineSpacingSchema.default("normal"),
  }).default({
    format: "a4",
    marginPreset: "standard",
    sectionSpacing: "standard",
    lineSpacing: "normal",
  }),
  design: z.object({
    primaryColor: z.string().default("rgba(37, 99, 235, 1)"),
    backgroundColor: z.string().default("rgba(255, 255, 255, 1)"),
    textColor: z.string().default("rgba(0, 0, 0, 1)"),
    colorIntensity: colorIntensitySchema.default("standard"),
  }).default({
    primaryColor: "rgba(37, 99, 235, 1)",
    backgroundColor: "rgba(255, 255, 255, 1)",
    textColor: "rgba(0, 0, 0, 1)",
    colorIntensity: "standard",
  }),
  typography: z.object({
    fontPairing: z.string().default("inter-georgia"),
    fontScale: fontScaleSchema.default("standard"),
  }).default({
    fontPairing: "inter-georgia",
    fontScale: "standard",
  }),
});

export type Metadata = z.infer<typeof metadataSchema>;

// ---------------------------------------------------------------------------
// Complete resume data
// ---------------------------------------------------------------------------

export const resumeDataSchema = z.object({
  basics: basicsSchema.default({
    name: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    website: { url: "", label: "" },
    linkedin: "",
    customFields: [],
  }),
  sections: sectionsSchema.default({
    summary: { title: "Professional Summary", content: "", hidden: false },
    experience: { title: "Work Experience", items: [], hidden: false },
    education: { title: "Education", items: [], hidden: false },
    skills: { title: "Skills", items: [], hidden: false },
    certifications: { title: "Certifications", items: [], hidden: false },
    languages: { title: "Languages", items: [], hidden: false },
    volunteer: { title: "Volunteer Experience", items: [], hidden: false },
    projects: { title: "Projects", items: [], hidden: false },
    awards: { title: "Awards", items: [], hidden: false },
    references: { title: "References", items: [], hidden: false },
  }),
  customSections: z.array(customSectionSchema).default([]),
  metadata: metadataSchema.default({
    template: "modern-minimalist",
    layout: {
      sidebarWidth: 35,
      pages: [
        {
          fullWidth: false,
          main: ["summary", "experience", "projects"],
          sidebar: ["skills", "education", "certifications", "languages"],
        },
      ],
    },
    css: { enabled: false, value: "" },
    page: { format: "a4", marginPreset: "standard", sectionSpacing: "standard", lineSpacing: "normal" },
    design: {
      primaryColor: "rgba(37, 99, 235, 1)",
      backgroundColor: "rgba(255, 255, 255, 1)",
      textColor: "rgba(0, 0, 0, 1)",
      colorIntensity: "standard",
    },
    typography: { fontPairing: "inter-georgia", fontScale: "standard" },
  }),
});

export type ResumeData = z.infer<typeof resumeDataSchema>;

// ---------------------------------------------------------------------------
// Defaults factory
// ---------------------------------------------------------------------------

export function createDefaultResumeData(): ResumeData {
  return resumeDataSchema.parse({});
}

export function createItemId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Font pairings — used by the typography controls
// ---------------------------------------------------------------------------

export const FONT_PAIRINGS: Record<string, { heading: string; body: string; label: string }> = {
  // ── Classic pairings ──
  "inter-georgia": { heading: "Georgia, serif", body: "'Inter', sans-serif", label: "Inter + Georgia" },
  "playfair-source": { heading: "'Playfair Display', serif", body: "'Source Sans 3', sans-serif", label: "Playfair + Source Sans" },
  "roboto-roboto-slab": { heading: "'Roboto Slab', serif", body: "'Roboto', sans-serif", label: "Roboto + Roboto Slab" },
  "merriweather-open": { heading: "'Merriweather', serif", body: "'Open Sans', sans-serif", label: "Merriweather + Open Sans" },
  "lato-lora": { heading: "'Lora', serif", body: "'Lato', sans-serif", label: "Lato + Lora" },
  "inter-inter": { heading: "'Inter', sans-serif", body: "'Inter', sans-serif", label: "Inter (Sans Only)" },
  "georgia-georgia": { heading: "Georgia, serif", body: "Georgia, serif", label: "Georgia (Serif Only)" },
  "system": { heading: "system-ui, sans-serif", body: "system-ui, sans-serif", label: "System Default" },
  // ── Pro template pairings ──
  "jakarta-jakarta": { heading: "'Plus Jakarta Sans', sans-serif", body: "'Plus Jakarta Sans', sans-serif", label: "Jakarta Sans" },
  "cormorant-raleway": { heading: "'Cormorant Garamond', serif", body: "'Raleway', sans-serif", label: "Cormorant + Raleway" },
  "archivo-dm": { heading: "'Archivo Black', sans-serif", body: "'DM Sans', sans-serif", label: "Archivo + DM Sans" },
  "nunito-nunito": { heading: "'Nunito', sans-serif", body: "'Nunito', sans-serif", label: "Nunito" },
  "outfit-outfit": { heading: "'Outfit', sans-serif", body: "'Outfit', sans-serif", label: "Outfit" },
  "sora-sora": { heading: "'Sora', sans-serif", body: "'Sora', sans-serif", label: "Sora" },
  "baskerville-open": { heading: "'Libre Baskerville', serif", body: "'Open Sans', sans-serif", label: "Baskerville + Open Sans" },
  "bricolage-crimson": { heading: "'Bricolage Grotesque', sans-serif", body: "'Crimson Pro', serif", label: "Bricolage + Crimson" },
  "jetbrains-inter": { heading: "'JetBrains Mono', monospace", body: "'Inter', sans-serif", label: "JetBrains Mono + Inter" },
  "ibm-plex-ibm-plex": { heading: "'IBM Plex Sans', sans-serif", body: "'IBM Plex Sans', sans-serif", label: "IBM Plex Sans" },
  "playfair-lora": { heading: "'Playfair Display', serif", body: "'Lora', serif", label: "Playfair + Lora" },
  "space-mono-grotesk": { heading: "'Space Mono', monospace", body: "'Space Grotesk', sans-serif", label: "Space Mono + Grotesk" },
  "quicksand-quicksand": { heading: "'Quicksand', sans-serif", body: "'Quicksand', sans-serif", label: "Quicksand" },
  "manrope-manrope": { heading: "'Manrope', sans-serif", body: "'Manrope', sans-serif", label: "Manrope" },
  "dm-sans-mono": { heading: "'DM Sans', sans-serif", body: "'DM Mono', monospace", label: "DM Sans + DM Mono" },
  "stint-josefin": { heading: "'Stint Ultra Expanded', serif", body: "'Josefin Sans', sans-serif", label: "Stint + Josefin" },
  "figtree-figtree": { heading: "'Figtree', sans-serif", body: "'Figtree', sans-serif", label: "Figtree" },
  "poppins-poppins": { heading: "'Poppins', sans-serif", body: "'Poppins', sans-serif", label: "Poppins" },
  "source-sans-source-sans": { heading: "'Source Sans 3', sans-serif", body: "'Source Sans 3', sans-serif", label: "Source Sans 3" },
};

// ---------------------------------------------------------------------------
// Page dimensions in pixels (at 96 DPI for screen rendering)
// ---------------------------------------------------------------------------

export const PAGE_DIMENSIONS = {
  // ── Print sizes ──
  a4:     { width: 794, height: 1123 },   // 210mm × 297mm at 96 DPI
  letter: { width: 816, height: 1056 },   // 8.5in × 11in at 96 DPI
  a5:     { width: 559, height: 794  },   // 148mm × 210mm at 96 DPI
  b5:     { width: 665, height: 945  },   // 176mm × 250mm at 96 DPI
  // ── Web / social sharing ──
  "linkedin-banner":  { width: 1584, height: 396  },
  "instagram-square": { width: 1080, height: 1080 },
} as const;

/** Human-readable labels for the page format picker */
export const PAGE_FORMAT_LABELS: Record<PageFormat, { label: string; group: "print" | "web" }> = {
  a4:                { label: "A4",               group: "print" },
  letter:            { label: "US Letter",        group: "print" },
  a5:                { label: "A5",               group: "print" },
  b5:                { label: "B5",               group: "print" },
  "linkedin-banner": { label: "LinkedIn Banner",  group: "web"   },
  "instagram-square":{ label: "Instagram Square", group: "web"   },
};

// ---------------------------------------------------------------------------
// CSS variable computation from metadata
// ---------------------------------------------------------------------------

const MARGIN_VALUES: Record<string, { x: number; y: number }> = {
  narrow: { x: 28, y: 28 },
  standard: { x: 40, y: 40 },
  wide: { x: 56, y: 56 },
};

const SECTION_GAP_VALUES: Record<string, number> = {
  compact: 8,
  standard: 12,
  relaxed: 18,
};

const LINE_HEIGHT_VALUES: Record<string, number> = {
  tight: 1.3,
  normal: 1.5,
  loose: 1.7,
};

const FONT_SCALE_MULTIPLIER: Record<string, number> = {
  compact: 0.9,
  standard: 1.0,
  spacious: 1.1,
};

export function computeCSSVariables(metadata: Metadata): Record<string, string> {
  const dims = PAGE_DIMENSIONS[metadata.page.format];
  const margins = MARGIN_VALUES[metadata.page.marginPreset] ?? MARGIN_VALUES.standard;
  const sectionGap = SECTION_GAP_VALUES[metadata.page.sectionSpacing] ?? 12;
  const lineHeight = LINE_HEIGHT_VALUES[metadata.page.lineSpacing] ?? 1.5;
  const fontScale = FONT_SCALE_MULTIPLIER[metadata.typography.fontScale] ?? 1.0;
  const pairing = FONT_PAIRINGS[metadata.typography.fontPairing] ?? FONT_PAIRINGS["inter-georgia"];

  return {
    "--page-width": `${dims.width}px`,
    "--page-height": `${dims.height}px`,
    "--page-margin-x": `${margins.x}pt`,
    "--page-margin-y": `${margins.y}pt`,
    "--page-gap-x": "20pt",
    "--page-gap-y": `${sectionGap}pt`,
    "--page-sidebar-width": `${metadata.layout.sidebarWidth}%`,
    "--page-primary-color": metadata.design.primaryColor,
    "--page-background-color": metadata.design.backgroundColor,
    "--page-text-color": metadata.design.textColor,
    "--page-body-font-family": pairing.body,
    "--page-body-font-size": `${Math.round(10 * fontScale)}pt`,
    "--page-body-font-weight": "400",
    "--page-body-line-height": `${lineHeight}`,
    "--page-heading-font-family": pairing.heading,
    "--page-heading-font-size": `${Math.round(14 * fontScale)}pt`,
    "--page-heading-font-weight": "700",
    "--section-border-width": "1px",
    "--section-border-color": metadata.design.primaryColor,
  };
}

// ---------------------------------------------------------------------------
// Accent color presets for the wizard
// ---------------------------------------------------------------------------

export const ACCENT_COLORS = [
  { name: "Deep Blue", value: "rgba(37, 99, 235, 1)" },
  { name: "Teal", value: "rgba(20, 184, 166, 1)" },
  { name: "Burgundy", value: "rgba(159, 18, 57, 1)" },
  { name: "Forest Green", value: "rgba(22, 101, 52, 1)" },
  { name: "Slate", value: "rgba(71, 85, 105, 1)" },
  { name: "Navy", value: "rgba(30, 58, 138, 1)" },
  { name: "Dark Purple", value: "rgba(88, 28, 135, 1)" },
  { name: "Charcoal", value: "rgba(55, 65, 81, 1)" },
  { name: "Coral", value: "rgba(220, 38, 38, 1)" },
  { name: "Gold", value: "rgba(161, 98, 7, 1)" },
] as const;

// ---------------------------------------------------------------------------
// Resume style presets for the wizard
// ---------------------------------------------------------------------------

export type ResumeStyle = "professional" | "modern" | "creative" | "executive";
export type PageCountPreference = "one" | "two" | "auto";
export type ContentFidelityMode = "keep-exact" | "ai-enhanced";
export type ExperienceLevel = "entry" | "mid" | "senior" | "executive";

// ---------------------------------------------------------------------------
// Built-in section IDs (type-safe)
// ---------------------------------------------------------------------------

export const BUILT_IN_SECTIONS = [
  "summary", "experience", "education", "skills",
  "certifications", "languages", "volunteer", "projects",
  "awards", "references",
] as const;

export type BuiltInSectionId = typeof BUILT_IN_SECTIONS[number];

export function isBuiltInSection(id: string): id is BuiltInSectionId {
  return BUILT_IN_SECTIONS.includes(id as BuiltInSectionId);
}
