/**
 * Resume V2 Schema — Adapted directly from Reactive Resume v5
 * https://github.com/AmruthPillai/Reactive-Resume
 * MIT License
 */

import { z } from "zod";

// ── Template Schema ──
export const templateSchema = z.enum([
  "azurill", "bronzor", "chikorita", "ditgar", "ditto", "gengar",
  "glalie", "kakuna", "lapras", "leafish", "onyx", "pikachu", "rhyhorn",
]);
export type Template = z.infer<typeof templateSchema>;

export const TEMPLATE_LIST = templateSchema.options;

// ── Core Sub-schemas ──
export const urlSchema = z.object({
  url: z.string(),
  label: z.string(),
});

export const iconSchema = z.string();

export const itemOptionsSchema = z.object({
  showLinkInTitle: z.boolean().catch(false),
}).catch({ showLinkInTitle: false });

// ── Picture ──
export const pictureSchema = z.object({
  hidden: z.boolean(),
  url: z.string(),
  size: z.number().min(32).max(512),
  rotation: z.number().min(0).max(360),
  aspectRatio: z.number().min(0.5).max(2.5),
  borderRadius: z.number().min(0).max(100),
  borderColor: z.string(),
  borderWidth: z.number().min(0),
  shadowColor: z.string(),
  shadowWidth: z.number().min(0),
});
export type Picture = z.infer<typeof pictureSchema>;

// ── Custom Field ──
export const customFieldSchema = z.object({
  id: z.string(),
  icon: iconSchema,
  text: z.string(),
  link: z.string().catch(""),
});

// ── Basics ──
export const basicsSchema = z.object({
  name: z.string(),
  headline: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  website: urlSchema,
  customFields: z.array(customFieldSchema),
});
export type Basics = z.infer<typeof basicsSchema>;

// ── Summary ──
export const summarySchema = z.object({
  title: z.string(),
  columns: z.number(),
  hidden: z.boolean(),
  content: z.string(),
});

// ── Base Item ──
export const baseItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean(),
  options: itemOptionsSchema.optional(),
});

export const summaryItemSchema = baseItemSchema.extend({
  content: z.string(),
});
export type SummaryItem = z.infer<typeof summaryItemSchema>;

// ── Section Item Schemas ──
export const awardItemSchema = baseItemSchema.extend({
  title: z.string(),
  awarder: z.string(),
  date: z.string(),
  website: urlSchema,
  description: z.string(),
});

export const certificationItemSchema = baseItemSchema.extend({
  title: z.string(),
  issuer: z.string(),
  date: z.string(),
  website: urlSchema,
  description: z.string(),
});

export const educationItemSchema = baseItemSchema.extend({
  school: z.string(),
  degree: z.string(),
  area: z.string(),
  grade: z.string(),
  location: z.string(),
  period: z.string(),
  website: urlSchema,
  description: z.string(),
});

export const roleItemSchema = z.object({
  id: z.string(),
  position: z.string(),
  period: z.string(),
  description: z.string(),
});
export type RoleItem = z.infer<typeof roleItemSchema>;

export const experienceItemSchema = baseItemSchema.extend({
  company: z.string(),
  position: z.string(),
  location: z.string(),
  period: z.string(),
  website: urlSchema,
  description: z.string(),
  roles: z.array(roleItemSchema).catch([]),
});

export const interestItemSchema = baseItemSchema.extend({
  icon: iconSchema,
  name: z.string(),
  keywords: z.array(z.string()).catch([]),
});

export const languageItemSchema = baseItemSchema.extend({
  language: z.string(),
  fluency: z.string(),
  level: z.number().min(0).max(5).catch(0),
});

export const profileItemSchema = baseItemSchema.extend({
  icon: iconSchema,
  network: z.string(),
  username: z.string(),
  website: urlSchema,
});

export const projectItemSchema = baseItemSchema.extend({
  name: z.string(),
  period: z.string(),
  website: urlSchema,
  description: z.string(),
});

export const publicationItemSchema = baseItemSchema.extend({
  title: z.string(),
  publisher: z.string(),
  date: z.string(),
  website: urlSchema,
  description: z.string(),
});

export const referenceItemSchema = baseItemSchema.extend({
  name: z.string(),
  position: z.string(),
  website: urlSchema,
  phone: z.string(),
  description: z.string(),
});

export const skillItemSchema = baseItemSchema.extend({
  icon: iconSchema,
  name: z.string(),
  proficiency: z.string(),
  level: z.number().min(0).max(5).catch(0),
  keywords: z.array(z.string()).catch([]),
});

export const volunteerItemSchema = baseItemSchema.extend({
  organization: z.string(),
  location: z.string(),
  period: z.string(),
  website: urlSchema,
  description: z.string(),
});

// ── Section Schemas ──
export const baseSectionSchema = z.object({
  title: z.string(),
  columns: z.number(),
  hidden: z.boolean(),
});

export const sectionsSchema = z.object({
  profiles: baseSectionSchema.extend({ items: z.array(profileItemSchema) }),
  experience: baseSectionSchema.extend({ items: z.array(experienceItemSchema) }),
  education: baseSectionSchema.extend({ items: z.array(educationItemSchema) }),
  projects: baseSectionSchema.extend({ items: z.array(projectItemSchema) }),
  skills: baseSectionSchema.extend({ items: z.array(skillItemSchema) }),
  languages: baseSectionSchema.extend({ items: z.array(languageItemSchema) }),
  interests: baseSectionSchema.extend({ items: z.array(interestItemSchema) }),
  awards: baseSectionSchema.extend({ items: z.array(awardItemSchema) }),
  certifications: baseSectionSchema.extend({ items: z.array(certificationItemSchema) }),
  publications: baseSectionSchema.extend({ items: z.array(publicationItemSchema) }),
  volunteer: baseSectionSchema.extend({ items: z.array(volunteerItemSchema) }),
  references: baseSectionSchema.extend({ items: z.array(referenceItemSchema) }),
});

export type SectionType = keyof z.infer<typeof sectionsSchema>;
export type SectionData<T extends SectionType = SectionType> = z.infer<typeof sectionsSchema>[T];
export type SectionItem<T extends SectionType = SectionType> = SectionData<T>["items"][number];

// Concrete item type aliases for convenience
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type SkillItem = z.infer<typeof skillItemSchema>;
export type LanguageItem = z.infer<typeof languageItemSchema>;
export type ProfileItem = z.infer<typeof profileItemSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type AwardItem = z.infer<typeof awardItemSchema>;
export type CertificationItem = z.infer<typeof certificationItemSchema>;
export type PublicationItem = z.infer<typeof publicationItemSchema>;
export type VolunteerItem = z.infer<typeof volunteerItemSchema>;
export type ReferenceItem = z.infer<typeof referenceItemSchema>;
export type InterestItem = z.infer<typeof interestItemSchema>;
export type CustomFieldItem = z.infer<typeof customFieldSchema>;
export type PageFormat = z.infer<typeof pageSchema>["format"];

export const SECTION_TYPES: SectionType[] = [
  "profiles", "experience", "education", "projects", "skills",
  "languages", "interests", "awards", "certifications",
  "publications", "volunteer", "references",
];

// ── Custom Section ──
export const customSectionItemSchema = z.union([
  summaryItemSchema, profileItemSchema, experienceItemSchema, educationItemSchema,
  projectItemSchema, skillItemSchema, languageItemSchema, interestItemSchema,
  awardItemSchema, certificationItemSchema, publicationItemSchema,
  volunteerItemSchema, referenceItemSchema,
]);

export type CustomSectionItem = z.infer<typeof customSectionItemSchema>;

export type CustomSectionType = SectionType | "summary";

export const customSectionSchema = baseSectionSchema.extend({
  id: z.string(),
  type: z.enum(["summary", ...SECTION_TYPES] as [string, ...string[]]),
  items: z.array(customSectionItemSchema),
});
export type CustomSection = z.infer<typeof customSectionSchema>;

// ── Typography ──
export const fontWeightSchema = z.enum(["100", "200", "300", "400", "500", "600", "700", "800", "900"]);

export const typographyItemSchema = z.object({
  fontFamily: z.string(),
  fontWeights: z.array(fontWeightSchema).catch(["400"]),
  fontSize: z.number().min(6).max(24).catch(11),
  lineHeight: z.number().min(0.5).max(4).catch(1.5),
});

export const typographySchema = z.object({
  body: typographyItemSchema,
  heading: typographyItemSchema,
});

// ── Layout ──
export const pageLayoutSchema = z.object({
  fullWidth: z.boolean(),
  main: z.array(z.string()),
  sidebar: z.array(z.string()),
});
export type PageLayout = z.infer<typeof pageLayoutSchema>;

export const layoutSchema = z.object({
  sidebarWidth: z.number().min(10).max(50).catch(35),
  pages: z.array(pageLayoutSchema),
});

// ── CSS / Page / Design ──
export const cssSchema = z.object({
  enabled: z.boolean(),
  value: z.string(),
});

export const pageSchema = z.object({
  gapX: z.number().min(0),
  gapY: z.number().min(0),
  marginX: z.number().min(0),
  marginY: z.number().min(0),
  format: z.enum(["a4", "letter", "free-form"]).catch("a4"),
  locale: z.string().catch("en-US"),
  hideIcons: z.boolean().catch(false),
});

export const levelDesignSchema = z.object({
  icon: iconSchema,
  type: z.enum(["hidden", "circle", "square", "rectangle", "rectangle-full", "progress-bar", "icon"]),
});

export const colorDesignSchema = z.object({
  primary: z.string(),
  text: z.string(),
  background: z.string(),
});

export const designSchema = z.object({
  level: levelDesignSchema,
  colors: colorDesignSchema,
});

// ── Metadata ──
export const metadataSchema = z.object({
  template: templateSchema.catch("onyx"),
  layout: layoutSchema,
  css: cssSchema,
  page: pageSchema,
  design: designSchema,
  typography: typographySchema,
  notes: z.string(),
});

// ── Full Resume Data ──
export const resumeDataSchema = z.object({
  picture: pictureSchema,
  basics: basicsSchema,
  summary: summarySchema,
  sections: sectionsSchema,
  customSections: z.array(customSectionSchema),
  metadata: metadataSchema,
});

export type ResumeData = z.infer<typeof resumeDataSchema>;

// ── Page Dimensions ──
export const PAGE_DIMENSIONS = {
  a4: { width: 210, height: 297 },
  letter: { width: 216, height: 279 },
  "free-form": { width: 210, height: 297 },
} as const;

// mm → px at 96 DPI
const MM_TO_PX = 96 / 25.4;
export const pageDimensionsAsPixels = {
  a4: { width: Math.round(210 * MM_TO_PX), height: Math.round(297 * MM_TO_PX) },
  letter: { width: Math.round(216 * MM_TO_PX), height: Math.round(279 * MM_TO_PX) },
  "free-form": { width: Math.round(210 * MM_TO_PX), height: 99999 },
};

// ── Default Resume Data ──
export const defaultResumeData: ResumeData = {
  picture: {
    hidden: false, url: "", size: 80, rotation: 0,
    aspectRatio: 1, borderRadius: 0,
    borderColor: "rgba(0, 0, 0, 0.5)", borderWidth: 0,
    shadowColor: "rgba(0, 0, 0, 0.5)", shadowWidth: 0,
  },
  basics: {
    name: "", headline: "", email: "", phone: "", location: "",
    website: { url: "", label: "" },
    customFields: [],
  },
  summary: { title: "Summary", columns: 1, hidden: false, content: "" },
  sections: {
    profiles: { title: "Profiles", columns: 3, hidden: false, items: [] },
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
  },
  customSections: [],
  metadata: {
    template: "onyx",
    layout: {
      sidebarWidth: 35,
      pages: [{
        fullWidth: false,
        main: ["profiles", "summary", "experience", "education", "projects", "volunteer", "references"],
        sidebar: ["skills", "certifications", "awards", "languages", "interests", "publications"],
      }],
    },
    css: { enabled: false, value: "" },
    page: { gapX: 4, gapY: 6, marginX: 14, marginY: 12, format: "a4", locale: "en-US", hideIcons: false },
    design: {
      colors: {
        primary: "rgba(220, 38, 38, 1)",
        text: "rgba(0, 0, 0, 1)",
        background: "rgba(255, 255, 255, 1)",
      },
      level: { icon: "star", type: "circle" },
    },
    typography: {
      body: { fontFamily: "IBM Plex Serif", fontWeights: ["400", "500"], fontSize: 10, lineHeight: 1.5 },
      heading: { fontFamily: "IBM Plex Serif", fontWeights: ["600"], fontSize: 14, lineHeight: 1.5 },
    },
    notes: "",
  },
};

// ── Section titles & icons ──
export type LeftSidebarSection =
  | "picture" | "basics" | "summary" | "profiles" | "experience" | "education"
  | "projects" | "skills" | "languages" | "interests" | "awards"
  | "certifications" | "publications" | "volunteer" | "references" | "custom";

export const LEFT_SIDEBAR_SECTIONS: LeftSidebarSection[] = [
  "picture", "basics", "summary", "profiles", "experience", "education",
  "projects", "skills", "languages", "interests", "awards",
  "certifications", "publications", "volunteer", "references", "custom",
];

export type RightSidebarSection =
  | "template" | "layout" | "typography" | "design" | "page" | "css" | "notes" | "export";

export const RIGHT_SIDEBAR_SECTIONS: RightSidebarSection[] = [
  "template", "layout", "typography", "design", "page", "css", "notes", "export",
];

export function getSectionTitle(type: string): string {
  const titles: Record<string, string> = {
    picture: "Picture", basics: "Basics", summary: "Summary", profiles: "Profiles",
    experience: "Experience", education: "Education", projects: "Projects",
    skills: "Skills", languages: "Languages", interests: "Interests",
    awards: "Awards", certifications: "Certifications", publications: "Publications",
    volunteer: "Volunteer", references: "References", custom: "Custom Sections",
    template: "Template", layout: "Layout", typography: "Typography",
    design: "Design", page: "Page", css: "Custom CSS", notes: "Notes", export: "Export",
  };
  return titles[type] ?? type;
}
