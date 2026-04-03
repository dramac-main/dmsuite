// =============================================================================
// DMSuite — Resume Data Schema (Reactive Resume-Aligned)
// Full Zod-validated schema. Single source of truth for all resume types.
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

export type UrlField = z.infer<typeof urlSchema>;

export const customFieldSchema = z.object({
  id: idSchema,
  icon: z.string().default(""),
  text: z.string().default(""),
  link: z.string().default(""),
});

export type CustomField = z.infer<typeof customFieldSchema>;

// ---------------------------------------------------------------------------
// Picture settings
// ---------------------------------------------------------------------------

export const pictureSchema = z.object({
  hidden: z.boolean().default(false),
  url: z.string().default(""),
  size: z.number().min(32).max(512).default(80),
  aspectRatio: z.number().min(0.5).max(2.5).default(1),
  borderRadius: z.number().min(0).max(100).default(0),
  borderColor: z.string().default("rgba(0,0,0,0.5)"),
  borderWidth: z.number().min(0).default(0),
});

export type Picture = z.infer<typeof pictureSchema>;

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
  customFields: z.array(customFieldSchema).default([]),
});

export type Basics = z.infer<typeof basicsSchema>;

// ---------------------------------------------------------------------------
// Summary section
// ---------------------------------------------------------------------------

export const summarySchema = z.object({
  title: z.string().default("Summary"),
  columns: z.number().default(1),
  hidden: z.boolean().default(false),
  content: z.string().default(""),
});

export type Summary = z.infer<typeof summarySchema>;

// ---------------------------------------------------------------------------
// Base item schema (shared by all section items)
// ---------------------------------------------------------------------------

export const itemOptionsSchema = z.object({
  showLinkInTitle: z.boolean().default(false),
}).default({ showLinkInTitle: false });

export const baseItemSchema = z.object({
  id: idSchema,
  hidden: z.boolean().default(false),
  options: itemOptionsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Section item schemas
// ---------------------------------------------------------------------------

export const profileItemSchema = baseItemSchema.extend({
  icon: z.string().default(""),
  network: z.string().default(""),
  username: z.string().default(""),
  website: urlSchema.default({ url: "", label: "" }),
});
export type ProfileItem = z.infer<typeof profileItemSchema>;

export const roleItemSchema = z.object({
  id: idSchema,
  position: z.string().default(""),
  period: z.string().default(""),
  description: z.string().default(""),
});
export type RoleItem = z.infer<typeof roleItemSchema>;

export const experienceItemSchema = baseItemSchema.extend({
  company: z.string().default(""),
  position: z.string().default(""),
  location: z.string().default(""),
  period: z.string().default(""),
  website: urlSchema.default({ url: "", label: "" }),
  description: z.string().default(""),
  roles: z.array(roleItemSchema).default([]),
});
export type ExperienceItem = z.infer<typeof experienceItemSchema>;

export const educationItemSchema = baseItemSchema.extend({
  school: z.string().default(""),
  degree: z.string().default(""),
  area: z.string().default(""),
  grade: z.string().default(""),
  location: z.string().default(""),
  period: z.string().default(""),
  website: urlSchema.default({ url: "", label: "" }),
  description: z.string().default(""),
});
export type EducationItem = z.infer<typeof educationItemSchema>;

export const projectItemSchema = baseItemSchema.extend({
  name: z.string().default(""),
  period: z.string().default(""),
  website: urlSchema.default({ url: "", label: "" }),
  description: z.string().default(""),
});
export type ProjectItem = z.infer<typeof projectItemSchema>;

export const skillItemSchema = baseItemSchema.extend({
  icon: z.string().default(""),
  name: z.string().default(""),
  proficiency: z.string().default(""),
  level: z.number().min(0).max(5).default(0),
  keywords: z.array(z.string()).default([]),
});
export type SkillItem = z.infer<typeof skillItemSchema>;

export const languageItemSchema = baseItemSchema.extend({
  language: z.string().default(""),
  fluency: z.string().default(""),
  level: z.number().min(0).max(5).default(0),
});
export type LanguageItem = z.infer<typeof languageItemSchema>;

export const interestItemSchema = baseItemSchema.extend({
  icon: z.string().default(""),
  name: z.string().default(""),
  keywords: z.array(z.string()).default([]),
});
export type InterestItem = z.infer<typeof interestItemSchema>;

export const awardItemSchema = baseItemSchema.extend({
  title: z.string().default(""),
  awarder: z.string().default(""),
  date: z.string().default(""),
  website: urlSchema.default({ url: "", label: "" }),
  description: z.string().default(""),
});
export type AwardItem = z.infer<typeof awardItemSchema>;

export const certificationItemSchema = baseItemSchema.extend({
  title: z.string().default(""),
  issuer: z.string().default(""),
  date: z.string().default(""),
  website: urlSchema.default({ url: "", label: "" }),
  description: z.string().default(""),
});
export type CertificationItem = z.infer<typeof certificationItemSchema>;

export const publicationItemSchema = baseItemSchema.extend({
  title: z.string().default(""),
  publisher: z.string().default(""),
  date: z.string().default(""),
  website: urlSchema.default({ url: "", label: "" }),
  description: z.string().default(""),
});
export type PublicationItem = z.infer<typeof publicationItemSchema>;

export const volunteerItemSchema = baseItemSchema.extend({
  organization: z.string().default(""),
  location: z.string().default(""),
  period: z.string().default(""),
  website: urlSchema.default({ url: "", label: "" }),
  description: z.string().default(""),
});
export type VolunteerItem = z.infer<typeof volunteerItemSchema>;

export const referenceItemSchema = baseItemSchema.extend({
  name: z.string().default(""),
  position: z.string().default(""),
  phone: z.string().default(""),
  website: urlSchema.default({ url: "", label: "" }),
  description: z.string().default(""),
});
export type ReferenceItem = z.infer<typeof referenceItemSchema>;

// ---------------------------------------------------------------------------
// Section schemas (title + columns + hidden + items[])
// ---------------------------------------------------------------------------

export const baseSectionSchema = z.object({
  title: z.string().default(""),
  columns: z.number().default(1),
  hidden: z.boolean().default(false),
});

export const sectionsSchema = z.object({
  profiles: baseSectionSchema.extend({ items: z.array(profileItemSchema).default([]) }),
  experience: baseSectionSchema.extend({ items: z.array(experienceItemSchema).default([]) }),
  education: baseSectionSchema.extend({ items: z.array(educationItemSchema).default([]) }),
  projects: baseSectionSchema.extend({ items: z.array(projectItemSchema).default([]) }),
  skills: baseSectionSchema.extend({ items: z.array(skillItemSchema).default([]) }),
  languages: baseSectionSchema.extend({ items: z.array(languageItemSchema).default([]) }),
  interests: baseSectionSchema.extend({ items: z.array(interestItemSchema).default([]) }),
  awards: baseSectionSchema.extend({ items: z.array(awardItemSchema).default([]) }),
  certifications: baseSectionSchema.extend({ items: z.array(certificationItemSchema).default([]) }),
  publications: baseSectionSchema.extend({ items: z.array(publicationItemSchema).default([]) }),
  volunteer: baseSectionSchema.extend({ items: z.array(volunteerItemSchema).default([]) }),
  references: baseSectionSchema.extend({ items: z.array(referenceItemSchema).default([]) }),
});

export type SectionKey = keyof z.infer<typeof sectionsSchema>;
export type SectionData = z.infer<typeof sectionsSchema>[SectionKey];

// ---------------------------------------------------------------------------
// Custom sections
// ---------------------------------------------------------------------------

export type CustomSectionType =
  | "experience" | "education" | "projects" | "skills" | "languages"
  | "interests" | "awards" | "certifications" | "publications"
  | "volunteer" | "references" | "summary" | "profiles";

export const customSectionSchema = baseSectionSchema.extend({
  id: idSchema,
  type: z.string().default("summary"),
  items: z.array(z.any()).default([]),
});

export type CustomSection = z.infer<typeof customSectionSchema>;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const typographyItemSchema = z.object({
  fontFamily: z.string().default("IBM Plex Serif"),
  fontWeight: z.string().default("400"),
  fontSize: z.number().min(6).max(24).default(11),
  lineHeight: z.number().min(0.5).max(4).default(1.5),
});

export type TypographyItem = z.infer<typeof typographyItemSchema>;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const pageLayoutSchema = z.object({
  fullWidth: z.boolean().default(false),
  main: z.array(z.string()).default([]),
  sidebar: z.array(z.string()).default([]),
});

export type PageLayout = z.infer<typeof pageLayoutSchema>;

export const layoutSchema = z.object({
  sidebarWidth: z.number().min(10).max(50).default(35),
  pages: z.array(pageLayoutSchema).default([]),
});

// ---------------------------------------------------------------------------
// Level design
// ---------------------------------------------------------------------------

export type LevelType = "hidden" | "circle" | "square" | "rectangle" | "progress-bar";

export const levelDesignSchema = z.object({
  icon: z.string().default("star"),
  type: z.enum(["hidden", "circle", "square", "rectangle", "progress-bar"]).default("circle"),
});

// ---------------------------------------------------------------------------
// Color design
// ---------------------------------------------------------------------------

export const colorDesignSchema = z.object({
  primary: z.string().default("rgba(139,92,246,1)"),
  text: z.string().default("rgba(0,0,0,1)"),
  background: z.string().default("rgba(255,255,255,1)"),
});

export type ColorDesign = z.infer<typeof colorDesignSchema>;

// ---------------------------------------------------------------------------
// Metadata (template, layout, page, design, typography)
// ---------------------------------------------------------------------------

export const TEMPLATE_IDS = [
  "azurill", "bronzor", "chikorita", "ditto", "ditgar", "gengar",
  "glalie", "kakuna", "lapras", "leafish", "onyx", "pikachu", "rhyhorn",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const metadataSchema = z.object({
  template: z.string().default("onyx"),
  layout: layoutSchema.default({
    sidebarWidth: 35,
    pages: [{
      fullWidth: false,
      main: ["summary", "experience", "education", "projects", "volunteer", "references"],
      sidebar: ["profiles", "skills", "certifications", "languages", "awards", "interests", "publications"],
    }],
  }),
  css: z.object({
    enabled: z.boolean().default(false),
    value: z.string().default(""),
  }).default({ enabled: false, value: "" }),
  page: z.object({
    format: z.enum(["a4", "letter"]).default("a4"),
    marginX: z.number().min(0).default(36),
    marginY: z.number().min(0).default(28),
    gapX: z.number().min(0).default(12),
    gapY: z.number().min(0).default(8),
    locale: z.string().default("en-US"),
    hideIcons: z.boolean().default(false),
  }).default({ format: "a4", marginX: 36, marginY: 28, gapX: 12, gapY: 8, locale: "en-US", hideIcons: false }),
  design: z.object({
    colors: colorDesignSchema.default({ primary: "rgba(139,92,246,1)", text: "rgba(0,0,0,1)", background: "rgba(255,255,255,1)" }),
    level: levelDesignSchema.default({ icon: "star", type: "circle" }),
  }).default({
    colors: { primary: "rgba(139,92,246,1)", text: "rgba(0,0,0,1)", background: "rgba(255,255,255,1)" },
    level: { icon: "star", type: "circle" },
  }),
  typography: z.object({
    body: typographyItemSchema.default({ fontFamily: "IBM Plex Serif", fontWeight: "400", fontSize: 11, lineHeight: 1.5 }),
    heading: typographyItemSchema.default({ fontFamily: "IBM Plex Serif", fontWeight: "600", fontSize: 14, lineHeight: 1.5 }),
  }).default({
    body: { fontFamily: "IBM Plex Serif", fontWeight: "400", fontSize: 11, lineHeight: 1.5 },
    heading: { fontFamily: "IBM Plex Serif", fontWeight: "600", fontSize: 14, lineHeight: 1.5 },
  }),
  notes: z.string().default(""),
});

export type Metadata = z.infer<typeof metadataSchema>;

// ---------------------------------------------------------------------------
// Full Resume Data schema
// ---------------------------------------------------------------------------

export const resumeDataSchema = z.object({
  basics: basicsSchema.default({
    name: "", headline: "", email: "", phone: "", location: "",
    website: { url: "", label: "" }, customFields: [],
  }),
  picture: pictureSchema.default({
    hidden: false, url: "", size: 80, aspectRatio: 1,
    borderRadius: 0, borderColor: "rgba(0,0,0,0.5)", borderWidth: 0,
  }),
  summary: summarySchema.default({
    title: "Summary", columns: 1, hidden: false, content: "",
  }),
  sections: sectionsSchema.default({
    profiles: { title: "Profiles", columns: 1, hidden: false, items: [] },
    experience: { title: "Experience", columns: 1, hidden: false, items: [] },
    education: { title: "Education", columns: 1, hidden: false, items: [] },
    projects: { title: "Projects", columns: 1, hidden: false, items: [] },
    skills: { title: "Skills", columns: 2, hidden: false, items: [] },
    languages: { title: "Languages", columns: 2, hidden: false, items: [] },
    interests: { title: "Interests", columns: 2, hidden: false, items: [] },
    awards: { title: "Awards", columns: 1, hidden: false, items: [] },
    certifications: { title: "Certifications", columns: 1, hidden: false, items: [] },
    publications: { title: "Publications", columns: 1, hidden: false, items: [] },
    volunteer: { title: "Volunteer", columns: 1, hidden: false, items: [] },
    references: { title: "References", columns: 1, hidden: false, items: [] },
  }),
  customSections: z.array(customSectionSchema).default([]),
  metadata: metadataSchema.default({
    template: "onyx",
    layout: {
      sidebarWidth: 35,
      pages: [{
        fullWidth: false,
        main: ["summary", "experience", "education", "projects", "volunteer", "references"],
        sidebar: ["profiles", "skills", "certifications", "languages", "awards", "interests", "publications"],
      }],
    },
    css: { enabled: false, value: "" },
    page: { format: "a4", marginX: 36, marginY: 28, gapX: 12, gapY: 8, locale: "en-US", hideIcons: false },
    design: {
      colors: { primary: "rgba(139,92,246,1)", text: "rgba(0,0,0,1)", background: "rgba(255,255,255,1)" },
      level: { icon: "star", type: "circle" },
    },
    typography: {
      body: { fontFamily: "IBM Plex Serif", fontWeight: "400", fontSize: 11, lineHeight: 1.5 },
      heading: { fontFamily: "IBM Plex Serif", fontWeight: "600", fontSize: 14, lineHeight: 1.5 },
    },
    notes: "",
  }),
});

export type ResumeData = z.infer<typeof resumeDataSchema>;

// ---------------------------------------------------------------------------
// Default data factory
// ---------------------------------------------------------------------------

export function createDefaultResumeData(): ResumeData {
  return resumeDataSchema.parse({});
}

// ---------------------------------------------------------------------------
// Page dimensions (mm → rendered at 96 DPI)
// ---------------------------------------------------------------------------

export const PAGE_DIMENSIONS = {
  a4: { width: 210, height: 297, label: "A4 (210 × 297 mm)" },
  letter: { width: 216, height: 279, label: "US Letter (8.5 × 11 in)" },
} as const;

export type PageFormat = keyof typeof PAGE_DIMENSIONS;

// mm to px at 96dpi (1mm = 3.7795px)
export function mmToPx(mm: number): number {
  return Math.round(mm * 3.7795);
}

// ---------------------------------------------------------------------------
// Font helpers
// ---------------------------------------------------------------------------

export const POPULAR_FONTS = [
  "IBM Plex Serif", "IBM Plex Sans", "Inter", "Roboto", "Open Sans",
  "Lato", "Montserrat", "Fira Sans", "Fira Sans Condensed", "Merriweather",
  "Playfair Display", "Source Sans 3", "Nunito", "Raleway", "Outfit",
  "Work Sans", "Poppins", "DM Sans", "Rubik", "Space Grotesk",
  "Crimson Text", "Libre Baskerville", "EB Garamond", "PT Serif",
  "Josefin Sans", "Ubuntu", "Cabin", "Karla", "Quicksand", "Barlow",
] as const;

/**
 * Curated font pairings for the Resume builder.
 * Keyed by pairing id so useGoogleFonts can look them up with `FONT_PAIRINGS[id]`.
 */
export const FONT_PAIRINGS: Record<string, { heading: string; body: string }> = {
  "ibmplex-serif":         { heading: "IBM Plex Serif",      body: "IBM Plex Serif" },
  "ibmplex-sans":          { heading: "IBM Plex Sans",       body: "IBM Plex Sans" },
  "inter-inter":           { heading: "Inter",               body: "Inter" },
  "playfair-source":       { heading: "Playfair Display",    body: "Source Sans 3" },
  "montserrat-opensans":   { heading: "Montserrat",          body: "Open Sans" },
  "raleway-lato":          { heading: "Raleway",             body: "Lato" },
  "poppins-inter":         { heading: "Poppins",             body: "Inter" },
  "dmserif-dmsans":        { heading: "DM Serif Display",    body: "DM Sans" },
  "cormorant-proza":       { heading: "Cormorant Garamond",  body: "Proza Libre" },
  "spacegrotesk-inter":    { heading: "Space Grotesk",       body: "Inter" },
  "crimsonpro-worksans":   { heading: "Crimson Pro",         body: "Work Sans" },
  "merriweather-roboto":   { heading: "Merriweather",        body: "Roboto" },
  "garamond-nunito":       { heading: "EB Garamond",         body: "Nunito" },
};

// ---------------------------------------------------------------------------
// Section metadata — display labels & icons
// ---------------------------------------------------------------------------

export const SECTION_META: Record<SectionKey, { label: string; icon: string }> = {
  profiles: { label: "Profiles", icon: "globe" },
  experience: { label: "Experience", icon: "briefcase" },
  education: { label: "Education", icon: "academic-cap" },
  projects: { label: "Projects", icon: "folder" },
  skills: { label: "Skills", icon: "star" },
  languages: { label: "Languages", icon: "language" },
  interests: { label: "Interests", icon: "heart" },
  awards: { label: "Awards", icon: "trophy" },
  certifications: { label: "Certifications", icon: "badge" },
  publications: { label: "Publications", icon: "book" },
  volunteer: { label: "Volunteer", icon: "users" },
  references: { label: "References", icon: "user" },
};

// ---------------------------------------------------------------------------
// Item factory helpers (create blank items with unique id)
// ---------------------------------------------------------------------------

let _counter = 0;
function uid(): string {
  return `${Date.now().toString(36)}-${(++_counter).toString(36)}`;
}

export function createBlankItem(sectionKey: SectionKey): Record<string, unknown> {
  const id = uid();
  const base = { id, hidden: false };

  switch (sectionKey) {
    case "profiles":
      return { ...base, icon: "", network: "", username: "", website: { url: "", label: "" } };
    case "experience":
      return { ...base, company: "", position: "", location: "", period: "", website: { url: "", label: "" }, description: "", roles: [] };
    case "education":
      return { ...base, school: "", degree: "", area: "", grade: "", location: "", period: "", website: { url: "", label: "" }, description: "" };
    case "projects":
      return { ...base, name: "", period: "", website: { url: "", label: "" }, description: "" };
    case "skills":
      return { ...base, icon: "", name: "", proficiency: "", level: 0, keywords: [] };
    case "languages":
      return { ...base, language: "", fluency: "", level: 0 };
    case "interests":
      return { ...base, icon: "", name: "", keywords: [] };
    case "awards":
      return { ...base, title: "", awarder: "", date: "", website: { url: "", label: "" }, description: "" };
    case "certifications":
      return { ...base, title: "", issuer: "", date: "", website: { url: "", label: "" }, description: "" };
    case "publications":
      return { ...base, title: "", publisher: "", date: "", website: { url: "", label: "" }, description: "" };
    case "volunteer":
      return { ...base, organization: "", location: "", period: "", website: { url: "", label: "" }, description: "" };
    case "references":
      return { ...base, name: "", position: "", phone: "", website: { url: "", label: "" }, description: "" };
    default:
      return base;
  }
}
