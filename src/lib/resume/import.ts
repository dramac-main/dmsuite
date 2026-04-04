// =============================================================================
// DMSuite — Resume Import Parsers
// Supports: DMSuite JSON, JSON Resume, Reactive Resume, LinkedIn JSON,
// and plain text (returns partial data for AI completion).
// =============================================================================

import type { ResumeData, SectionKey } from "./schema";
import { createDefaultResumeData } from "./schema";

// ---------------------------------------------------------------------------
// UID helper
// ---------------------------------------------------------------------------
let _counter = 0;
function uid(): string {
  return `${Date.now().toString(36)}-${(++_counter).toString(36)}`;
}

// ---------------------------------------------------------------------------
// Format Detection
// ---------------------------------------------------------------------------

export type ImportFormat = "dmsuite" | "jsonresume" | "reactive-resume" | "linkedin" | "unknown";

export function detectFormat(json: Record<string, unknown>): ImportFormat {
  // DMSuite format: has metadata.template, sections, basics at top level
  if (json.metadata && json.sections && json.basics && (json.metadata as Record<string, unknown>).template) {
    return "dmsuite";
  }

  // Reactive Resume v4/v5: has data.basics OR top-level with metadata.template as templateId
  if (json.data && typeof json.data === "object") {
    const data = json.data as Record<string, unknown>;
    if (data.basics && data.sections && data.metadata) return "reactive-resume";
  }

  // JSON Resume standard: has basics.name, basics.email at top, work/education arrays
  if (json.basics && typeof json.basics === "object") {
    const basics = json.basics as Record<string, unknown>;
    if ((basics.name || basics.label) && (json.work || json.education || json.skills)) {
      return "jsonresume";
    }
  }

  // LinkedIn export: has profile, positions, educations
  if (json.profile || json.positions || json.educations) {
    return "linkedin";
  }

  return "unknown";
}

// ---------------------------------------------------------------------------
// DMSuite Format (our own)
// ---------------------------------------------------------------------------

export function importDMSuiteJSON(json: Record<string, unknown>): ResumeData {
  // Already in our format — validate and fill defaults
  const base = createDefaultResumeData();
  return deepMergeResume(json as Partial<ResumeData>, base);
}

// ---------------------------------------------------------------------------
// JSON Resume Standard (https://jsonresume.org/schema/)
// ---------------------------------------------------------------------------

interface JSONResumeBasics {
  name?: string;
  label?: string;
  image?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: { address?: string; city?: string; region?: string; countryCode?: string; postalCode?: string };
  profiles?: Array<{ network?: string; username?: string; url?: string }>;
}

interface JSONResumeWork {
  name?: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
  location?: string;
}

interface JSONResumeEducation {
  institution?: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
}

interface JSONResumeSkill {
  name?: string;
  level?: string;
  keywords?: string[];
}

interface JSONResumeProject {
  name?: string;
  description?: string;
  highlights?: string[];
  keywords?: string[];
  startDate?: string;
  endDate?: string;
  url?: string;
  roles?: string[];
  entity?: string;
  type?: string;
}

interface JSONResumeAward {
  title?: string;
  date?: string;
  awarder?: string;
  summary?: string;
}

interface JSONResumeCertificate {
  name?: string;
  date?: string;
  issuer?: string;
  url?: string;
}

interface JSONResumePublication {
  name?: string;
  publisher?: string;
  releaseDate?: string;
  url?: string;
  summary?: string;
}

interface JSONResumeVolunteer {
  organization?: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

interface JSONResumeLanguage {
  language?: string;
  fluency?: string;
}

interface JSONResumeInterest {
  name?: string;
  keywords?: string[];
}

interface JSONResumeReference {
  name?: string;
  reference?: string;
}

export function importJSONResume(json: Record<string, unknown>): ResumeData {
  const data = createDefaultResumeData();
  const basics = json.basics as JSONResumeBasics | undefined;

  // Basics
  if (basics) {
    data.basics.name = basics.name || "";
    data.basics.headline = basics.label || "";
    data.basics.email = basics.email || "";
    data.basics.phone = basics.phone || "";
    if (basics.location) {
      const loc = basics.location;
      data.basics.location = [loc.city, loc.region, loc.countryCode].filter(Boolean).join(", ");
    }
    if (basics.url) {
      data.basics.website = { url: basics.url, label: "Website" };
    }
    if (basics.image) {
      data.picture.url = basics.image;
      data.picture.hidden = false;
    }
    if (basics.summary) {
      data.summary.content = basics.summary;
    }
  }

  // Profiles
  const profiles = (basics?.profiles || json.profiles) as JSONResumeBasics["profiles"];
  if (profiles?.length) {
    data.sections.profiles.items = profiles.map((p) => ({
      id: uid(), hidden: false, icon: "", network: p.network || "",
      username: p.username || "", website: { url: p.url || "", label: p.network || "" },
    }));
  }

  // Work → Experience
  const work = json.work as JSONResumeWork[] | undefined;
  if (work?.length) {
    data.sections.experience.items = work.map((w) => ({
      id: uid(), hidden: false, company: w.name || "", position: w.position || "",
      location: w.location || "", period: formatPeriod(w.startDate, w.endDate),
      website: { url: w.url || "", label: "" },
      description: buildDescription(w.summary, w.highlights),
      roles: [],
    }));
  }

  // Education
  const education = json.education as JSONResumeEducation[] | undefined;
  if (education?.length) {
    data.sections.education.items = education.map((e) => ({
      id: uid(), hidden: false, school: e.institution || "", degree: e.studyType || "",
      area: e.area || "", grade: e.score || "", location: "",
      period: formatPeriod(e.startDate, e.endDate),
      website: { url: e.url || "", label: "" },
      description: e.courses?.length ? `<ul>${e.courses.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : "",
    }));
  }

  // Skills
  const skills = json.skills as JSONResumeSkill[] | undefined;
  if (skills?.length) {
    data.sections.skills.items = skills.map((s) => ({
      id: uid(), hidden: false, icon: "", name: s.name || "",
      proficiency: s.level || "", level: proficiencyToLevel(s.level),
      keywords: s.keywords || [],
    }));
  }

  // Projects
  const projects = json.projects as JSONResumeProject[] | undefined;
  if (projects?.length) {
    data.sections.projects.items = projects.map((p) => ({
      id: uid(), hidden: false, name: p.name || "",
      period: formatPeriod(p.startDate, p.endDate),
      website: { url: p.url || "", label: "" },
      description: buildDescription(p.description, p.highlights),
    }));
  }

  // Awards
  const awards = json.awards as JSONResumeAward[] | undefined;
  if (awards?.length) {
    data.sections.awards.items = awards.map((a) => ({
      id: uid(), hidden: false, title: a.title || "", awarder: a.awarder || "",
      date: a.date || "", website: { url: "", label: "" }, description: a.summary || "",
    }));
  }

  // Certificates
  const certificates = json.certificates as JSONResumeCertificate[] | undefined;
  if (certificates?.length) {
    data.sections.certifications.items = certificates.map((c) => ({
      id: uid(), hidden: false, title: c.name || "", issuer: c.issuer || "",
      date: c.date || "", website: { url: c.url || "", label: "" }, description: "",
    }));
  }

  // Publications
  const publications = json.publications as JSONResumePublication[] | undefined;
  if (publications?.length) {
    data.sections.publications.items = publications.map((p) => ({
      id: uid(), hidden: false, title: p.name || "", publisher: p.publisher || "",
      date: p.releaseDate || "", website: { url: p.url || "", label: "" }, description: p.summary || "",
    }));
  }

  // Volunteer
  const volunteer = json.volunteer as JSONResumeVolunteer[] | undefined;
  if (volunteer?.length) {
    data.sections.volunteer.items = volunteer.map((v) => ({
      id: uid(), hidden: false, organization: v.organization || "", location: "",
      period: formatPeriod(v.startDate, v.endDate),
      website: { url: v.url || "", label: "" },
      description: buildDescription(v.summary, v.highlights),
    }));
  }

  // Languages
  const languages = json.languages as JSONResumeLanguage[] | undefined;
  if (languages?.length) {
    data.sections.languages.items = languages.map((l) => ({
      id: uid(), hidden: false, language: l.language || "",
      fluency: l.fluency || "", level: fluencyToLevel(l.fluency),
    }));
  }

  // Interests
  const interests = json.interests as JSONResumeInterest[] | undefined;
  if (interests?.length) {
    data.sections.interests.items = interests.map((i) => ({
      id: uid(), hidden: false, icon: "", name: i.name || "", keywords: i.keywords || [],
    }));
  }

  // References
  const references = json.references as JSONResumeReference[] | undefined;
  if (references?.length) {
    data.sections.references.items = references.map((r) => ({
      id: uid(), hidden: false, name: r.name || "", position: "",
      phone: "", website: { url: "", label: "" }, description: r.reference || "",
    }));
  }

  return data;
}

// ---------------------------------------------------------------------------
// Reactive Resume Format (v4/v5)
// ---------------------------------------------------------------------------

export function importReactiveResume(json: Record<string, unknown>): ResumeData {
  // Reactive Resume wraps data in a `data` key
  const inner = (json.data ?? json) as Record<string, unknown>;

  // If it has our exact shape, treat as DMSuite-compatible
  if (inner.metadata && inner.sections && inner.basics) {
    return importDMSuiteJSON(inner);
  }

  // Otherwise attempt JSON Resume-style parsing of the inner data
  return importJSONResume(inner);
}

// ---------------------------------------------------------------------------
// LinkedIn JSON Export
// ---------------------------------------------------------------------------

interface LinkedInProfile {
  firstName?: string;
  lastName?: string;
  headline?: string;
  emailAddress?: string;
  location?: { name?: string };
  summary?: string;
  pictureUrl?: string;
}

interface LinkedInPosition {
  title?: string;
  company?: { name?: string };
  location?: { name?: string };
  startDate?: { month?: number; year?: number };
  endDate?: { month?: number; year?: number };
  summary?: string;
  isCurrent?: boolean;
}

interface LinkedInEducation {
  schoolName?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: { year?: number };
  endDate?: { year?: number };
  activities?: string;
  notes?: string;
}

export function importLinkedIn(json: Record<string, unknown>): ResumeData {
  const data = createDefaultResumeData();
  const profile = json.profile as LinkedInProfile | undefined;

  if (profile) {
    data.basics.name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
    data.basics.headline = profile.headline || "";
    data.basics.email = profile.emailAddress || "";
    if (profile.location?.name) data.basics.location = profile.location.name;
    if (profile.summary) data.summary.content = profile.summary;
    if (profile.pictureUrl) {
      data.picture.url = profile.pictureUrl;
      data.picture.hidden = false;
    }
  }

  // Positions → Experience
  const positions = json.positions as LinkedInPosition[] | undefined;
  if (positions?.length) {
    data.sections.experience.items = positions.map((p) => ({
      id: uid(), hidden: false, company: p.company?.name || "", position: p.title || "",
      location: p.location?.name || "",
      period: formatLinkedInPeriod(p.startDate, p.endDate, p.isCurrent),
      website: { url: "", label: "" }, description: p.summary || "", roles: [],
    }));
  }

  // Educations → Education
  const educations = json.educations as LinkedInEducation[] | undefined;
  if (educations?.length) {
    data.sections.education.items = educations.map((e) => ({
      id: uid(), hidden: false, school: e.schoolName || "", degree: e.degree || "",
      area: e.fieldOfStudy || "", grade: "", location: "",
      period: formatLinkedInPeriod(e.startDate as LinkedInPosition["startDate"], e.endDate as LinkedInPosition["endDate"]),
      website: { url: "", label: "" },
      description: [e.activities, e.notes].filter(Boolean).join("\n"),
    }));
  }

  // Skills
  const skills = json.skills as Array<{ name?: string }> | undefined;
  if (skills?.length) {
    data.sections.skills.items = skills.map((s) => ({
      id: uid(), hidden: false, icon: "", name: s.name || "",
      proficiency: "", level: 0, keywords: [],
    }));
  }

  // Languages
  const languages = json.languages as Array<{ name?: string; proficiency?: string }> | undefined;
  if (languages?.length) {
    data.sections.languages.items = languages.map((l) => ({
      id: uid(), hidden: false, language: l.name || "",
      fluency: l.proficiency || "", level: fluencyToLevel(l.proficiency),
    }));
  }

  // Certifications
  const certifications = json.certifications as Array<{ name?: string; authority?: string; startDate?: string }> | undefined;
  if (certifications?.length) {
    data.sections.certifications.items = certifications.map((c) => ({
      id: uid(), hidden: false, title: c.name || "", issuer: c.authority || "",
      date: c.startDate || "", website: { url: "", label: "" }, description: "",
    }));
  }

  return data;
}

// ---------------------------------------------------------------------------
// Plain Text Parser (basic extraction for AI-assisted completion)
// ---------------------------------------------------------------------------

export function importPlainText(text: string): Partial<ResumeData> {
  const data = createDefaultResumeData();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // First non-empty line as name
  if (lines.length > 0) {
    data.basics.name = lines[0];
  }

  // Simple email extraction
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (emailMatch) data.basics.email = emailMatch[0];

  // Simple phone extraction
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  if (phoneMatch) data.basics.phone = phoneMatch[0];

  // Put the entire text as summary for AI to process
  if (lines.length > 1) {
    data.summary.content = lines.slice(1).join("\n");
  }

  return data;
}

// ---------------------------------------------------------------------------
// Auto-import dispatcher
// ---------------------------------------------------------------------------

export interface ImportResult {
  data: ResumeData;
  format: ImportFormat;
  warnings: string[];
}

export function autoImport(fileContent: string): ImportResult {
  const warnings: string[] = [];

  // Try JSON parse
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(fileContent) as Record<string, unknown>;
  } catch {
    // Not JSON — treat as plain text
    const data = importPlainText(fileContent) as ResumeData;
    warnings.push("File was not valid JSON — parsed as plain text. Consider using AI generation to build a complete resume from this data.");
    return { data, format: "unknown", warnings };
  }

  const format = detectFormat(json);

  switch (format) {
    case "dmsuite":
      return { data: importDMSuiteJSON(json), format, warnings };
    case "jsonresume":
      return { data: importJSONResume(json), format, warnings };
    case "reactive-resume":
      return { data: importReactiveResume(json), format, warnings };
    case "linkedin":
      return { data: importLinkedIn(json), format, warnings };
    default:
      // Try JSON Resume as fallback for unknown JSON
      try {
        const data = importJSONResume(json);
        warnings.push("Could not auto-detect format — imported as JSON Resume. Some fields may not have been mapped.");
        return { data, format: "unknown", warnings };
      } catch {
        warnings.push("Unrecognized format. Please use DMSuite JSON, JSON Resume, Reactive Resume, or LinkedIn export format.");
        return { data: createDefaultResumeData(), format: "unknown", warnings };
      }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatPeriod(start?: string, end?: string): string {
  if (!start && !end) return "";
  if (start && end) return `${start} — ${end}`;
  if (start) return `${start} — Present`;
  return end || "";
}

function formatLinkedInPeriod(
  start?: { month?: number; year?: number },
  end?: { month?: number; year?: number },
  isCurrent?: boolean,
): string {
  const fmt = (d?: { month?: number; year?: number }) => {
    if (!d?.year) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return d.month ? `${months[d.month - 1]} ${d.year}` : `${d.year}`;
  };
  const s = fmt(start);
  const e = isCurrent ? "Present" : fmt(end);
  if (s && e) return `${s} — ${e}`;
  if (s) return `${s} — Present`;
  return e;
}

function buildDescription(summary?: string, highlights?: string[]): string {
  const parts: string[] = [];
  if (summary) parts.push(`<p>${esc(summary)}</p>`);
  if (highlights?.length) {
    parts.push(`<ul>${highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`);
  }
  return parts.join("");
}

function proficiencyToLevel(proficiency?: string): number {
  if (!proficiency) return 0;
  const lower = proficiency.toLowerCase();
  if (lower.includes("master") || lower.includes("expert") || lower.includes("advanced")) return 5;
  if (lower.includes("intermediate") || lower.includes("proficient")) return 3;
  if (lower.includes("beginner") || lower.includes("novice") || lower.includes("basic")) return 1;
  return 0;
}

function fluencyToLevel(fluency?: string): number {
  if (!fluency) return 0;
  const lower = fluency.toLowerCase();
  if (lower.includes("native") || lower.includes("bilingual") || lower.includes("c2")) return 5;
  if (lower.includes("fluent") || lower.includes("professional") || lower.includes("c1")) return 4;
  if (lower.includes("upper") || lower.includes("b2")) return 3;
  if (lower.includes("intermediate") || lower.includes("b1")) return 2;
  if (lower.includes("elementary") || lower.includes("a2") || lower.includes("a1") || lower.includes("basic")) return 1;
  return 0;
}

function deepMergeResume(source: Partial<ResumeData>, defaults: ResumeData): ResumeData {
  const result = { ...defaults };

  if (source.basics) result.basics = { ...defaults.basics, ...source.basics };
  if (source.picture) result.picture = { ...defaults.picture, ...source.picture };
  if (source.summary) result.summary = { ...defaults.summary, ...source.summary };

  if (source.sections) {
    const sectionKeys = Object.keys(defaults.sections) as SectionKey[];
    for (const key of sectionKeys) {
      if (source.sections[key]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const srcSection = source.sections[key] as any;
        const defSection = defaults.sections[key] as any;
        (result.sections as any)[key] = {
          ...defSection,
          ...srcSection,
          items: srcSection.items?.length ? srcSection.items : defSection.items,
        };
      }
    }
  }

  if (source.customSections) result.customSections = source.customSections;

  if (source.metadata) {
    result.metadata = {
      ...defaults.metadata,
      ...source.metadata,
      layout: source.metadata.layout ?? defaults.metadata.layout,
      css: source.metadata.css ? { ...defaults.metadata.css, ...source.metadata.css } : defaults.metadata.css,
      page: source.metadata.page ? { ...defaults.metadata.page, ...source.metadata.page } : defaults.metadata.page,
      design: source.metadata.design ? {
        colors: source.metadata.design.colors ? { ...defaults.metadata.design.colors, ...source.metadata.design.colors } : defaults.metadata.design.colors,
        level: source.metadata.design.level ? { ...defaults.metadata.design.level, ...source.metadata.design.level } : defaults.metadata.design.level,
      } : defaults.metadata.design,
      typography: source.metadata.typography ? {
        body: source.metadata.typography.body ? { ...defaults.metadata.typography.body, ...source.metadata.typography.body } : defaults.metadata.typography.body,
        heading: source.metadata.typography.heading ? { ...defaults.metadata.typography.heading, ...source.metadata.typography.heading } : defaults.metadata.typography.heading,
      } : defaults.metadata.typography,
    };
  }

  return result;
}
