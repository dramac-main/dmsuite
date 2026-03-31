// =============================================================================
// DMSuite — AI Resume Generator
// Builds prompts for Claude to generate complete ResumeData from wizard input.
// Follows the same architecture as ai-design-generator.ts:
//   buildPrompt → call API → parse JSON → validate → repair → return
// =============================================================================

import {
  type ResumeData,
  type ResumeStyle,
  type TemplateId,
  type FontScale,
  resumeDataSchema,
  createDefaultResumeData,
  createItemId,
  FONT_PAIRINGS,
  ACCENT_COLORS,
} from "./schema";
// Inline types — previously imported from deleted resume-cv-wizard store
export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
}

export interface TargetRole {
  jobTitle: string;
  experienceLevel: "entry" | "mid" | "senior" | "executive";
  industry: string;
  additionalContext: string;
}

export interface ExperienceEntry {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
}

export interface BriefPreferences {
  style: ResumeStyle;
  pageCount: number;
  accentColor: string;
  contentFidelityMode: string;
  jobDescription: string;
  description: string;
}

export interface OptionalSections {
  certifications: { name: string; issuer: string; year: string }[];
  languages: { name: string; proficiency: string }[];
  volunteer: { organization: string; role: string; description: string }[];
  projects: { name: string; description: string; url: string }[];
}

// ---------------------------------------------------------------------------
// Input type (matches what StepGeneration sends)
// ---------------------------------------------------------------------------

export interface ResumeGenerationInput {
  personal: PersonalInfo;
  targetRole: TargetRole;
  experiences: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  brief: BriefPreferences;
  optionalSections?: OptionalSections;
}

// ---------------------------------------------------------------------------
// Style → Template mapping
// ---------------------------------------------------------------------------

const STYLE_TO_TEMPLATE: Record<ResumeStyle, TemplateId> = {
  professional: "classic-corporate",
  modern: "modern-minimalist",
  creative: "creative-bold",
  executive: "corporate-executive",
};

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildResumeGenerationPrompt(input: ResumeGenerationInput): {
  systemPrompt: string;
  userMessage: string;
} {
  const { personal, targetRole, experiences, education, skills, brief, optionalSections } = input;

  const isKeepExact = brief.contentFidelityMode === "keep-exact";

  // =========================================================================
  // SYSTEM PROMPT
  // =========================================================================
  const systemPrompt = `You are a world-class resume writer with 15 years of experience in career coaching, ATS optimization, and professional document design. You write resumes that help people land interviews at top companies.

Return ONLY valid JSON — no markdown, no explanation, no commentary, no code fences.

## Your Task
Generate a complete, professional resume in JSON format from the user's raw input data. The resume must be ATS-optimized, well-written, and tailored to the target role.

## Content Rules
${isKeepExact
  ? `CONTENT FIDELITY MODE: "keep-exact" — The user wants their EXACT words preserved. Do NOT rewrite, rephrase, or embellish their descriptions. Use their text verbatim. You may ONLY: organize/structure the content, add proper section headings, format dates consistently, and fill in the professional summary (since they didn't write one). Do NOT change any experience descriptions, education details, or skill names.`
  : `CONTENT FIDELITY MODE: "ai-enhanced" — You have full creative freedom to enhance the content. Rewrite experience bullet points with strong action verbs and quantified achievements. Write a compelling professional summary. Organize skills strategically. Make every word count for ATS optimization.`
}

## Writing Guidelines (for ai-enhanced mode)
- Professional summary: 2-3 sentences, mention years of experience, key expertise areas, and the target role
- Experience bullet points: Start with strong action verbs (Led, Developed, Implemented, Optimized, etc.), include metrics/numbers where plausible, 3-5 bullets per position
- Skills: Group into categories if there are many (e.g., "Programming Languages", "Tools & Frameworks")
- Education: Include degree, field, institution, graduation year
- All dates should be consistently formatted
- No first-person pronouns
- No generic filler phrases ("responsible for", "duties included")

## JSON Response Format
Return a single JSON object conforming EXACTLY to this schema:

{
  "basics": {
    "name": "string",
    "headline": "string (job title / professional tagline)",
    "email": "string",
    "phone": "string",
    "location": "string",
    "website": { "url": "string", "label": "string" },
    "linkedin": "string",
    "customFields": []
  },
  "sections": {
    "summary": {
      "title": "Professional Summary",
      "content": "string (2-3 sentence professional summary)",
      "hidden": false
    },
    "experience": {
      "title": "Work Experience",
      "items": [
        {
          "id": "string (unique)",
          "hidden": false,
          "company": "string",
          "position": "string",
          "location": "string",
          "startDate": "string (e.g., 'Jan 2020')",
          "endDate": "string (e.g., 'Present' or 'Dec 2023')",
          "isCurrent": boolean,
          "website": "",
          "description": "string (bullet points as a single string, each bullet on a new line starting with '- ')"
        }
      ],
      "hidden": false
    },
    "education": {
      "title": "Education",
      "items": [
        {
          "id": "string (unique)",
          "hidden": false,
          "institution": "string",
          "degree": "string",
          "field": "string",
          "graduationYear": "string",
          "description": "string (optional honors, activities, GPA)"
        }
      ],
      "hidden": false
    },
    "skills": {
      "title": "Skills",
      "items": [
        {
          "id": "string (unique)",
          "hidden": false,
          "name": "string (category name, e.g., 'Technical Skills')",
          "keywords": ["string", "string"],
          "proficiency": "beginner" | "intermediate" | "advanced" | "expert" (optional)
        }
      ],
      "hidden": false
    },
    "certifications": {
      "title": "Certifications",
      "items": [
        {
          "id": "string (unique)",
          "hidden": false,
          "name": "string (certification name)",
          "issuer": "string (issuing organization)",
          "year": "string (e.g., '2023')",
          "url": "string (optional, empty string if none)"
        }
      ],
      "hidden": boolean (true if no certifications provided)
    },
    "languages": {
      "title": "Languages",
      "items": [
        {
          "id": "string (unique)",
          "hidden": false,
          "name": "string (language name, e.g., 'English')",
          "proficiency": "native" | "fluent" | "intermediate" | "basic"
        }
      ],
      "hidden": boolean (true if no languages provided)
    },
    "volunteer": {
      "title": "Volunteer Experience",
      "items": [
        {
          "id": "string (unique)",
          "hidden": false,
          "organization": "string",
          "role": "string",
          "description": "string",
          "startDate": "string",
          "endDate": "string"
        }
      ],
      "hidden": boolean (true if no volunteer experience provided)
    },
    "projects": {
      "title": "Projects",
      "items": [
        {
          "id": "string (unique)",
          "hidden": false,
          "name": "string (project name)",
          "description": "string (project description, bullets separated by newlines)",
          "url": "string (optional, empty string if none)",
          "keywords": ["string", "string"]
        }
      ],
      "hidden": boolean (true if no projects provided)
    },
    "awards": {
      "title": "Awards",
      "items": [
        {
          "id": "string (unique)",
          "hidden": false,
          "title": "string (award name)",
          "issuer": "string",
          "date": "string",
          "description": "string"
        }
      ],
      "hidden": true
    },
    "references": { "title": "References", "items": [], "hidden": true }
  },
  "customSections": [],
  "metadata": {
    "template": "modern-minimalist" | "corporate-executive" | "creative-bold" | "elegant-sidebar" | "infographic" | "dark-professional" | "gradient-creative" | "classic-corporate" | "artistic-portfolio" | "tech-modern" | "swiss-typographic" | "newspaper-editorial" | "brutalist-mono" | "pastel-soft" | "split-duotone" | "architecture-blueprint" | "retro-vintage" | "medical-clean" | "neon-glass" | "corporate-stripe",
    "layout": {
      "sidebarWidth": number (30-40),
      "pages": [
        {
          "fullWidth": boolean,
          "main": ["section_id", ...],
          "sidebar": ["section_id", ...]
        }
      ]
    },
    "css": { "enabled": false, "value": "" },
    "page": {
      "format": "letter",
      "marginPreset": "standard",
      "sectionSpacing": "standard",
      "lineSpacing": "normal"
    },
    "design": {
      "primaryColor": "string (rgba color)",
      "backgroundColor": "rgba(255, 255, 255, 1)",
      "textColor": "rgba(0, 0, 0, 1)",
      "colorIntensity": "standard"
    },
    "typography": {
      "fontPairing": "string (one of: ${Object.keys(FONT_PAIRINGS).join(", ")})",
      "fontScale": "compact" | "standard" | "spacious"
    }
  }
}

## Template Selection Guide
- "modern-minimalist": Clean, refined design with gold accents and elegant spacing. Best for creative professionals, designers, marketers.
- "corporate-executive": Formal navy banner with gold accents. Best for senior executives, C-level, directors, finance, law.
- "creative-bold": Bold colors, unique sidebar styling. Best for designers, artists, marketing, creative roles.
- "elegant-sidebar": Sophisticated left sidebar with subtle gradients. Best for consultants, managers, professionals.
- "infographic": Visual resume with charts and graphics. Best for data-driven roles, analysts, tech.
- "dark-professional": Dark theme with high contrast. Best for tech, software engineers, developers.
- "classic-corporate": Traditional corporate style. Best for traditional industries, government, education.
- "tech-modern": Modern tech-focused design. Best for software engineers, IT professionals.
- "swiss-typographic": Clean Swiss-style typography. Best for design, architecture, creative fields.
- "pastel-soft": Soft colors and gentle design. Best for healthcare, education, non-profit.

## Layout Rules
- For single-column templates (corporate-executive, brutalist-mono, architecture-blueprint): put ALL sections in "main", leave "sidebar" empty, set "fullWidth" to true
- For two-column templates (all others): put primary content (summary, experience, projects) in "main" and secondary content (skills, education, certifications, languages) in "sidebar"
- Order sections by importance for the target role
- Hide sections that have no content (set "hidden": true)

## Design Rules
- Use the accent color provided by the user
- Choose a font pairing that matches the style
- For "professional" style: use inter-georgia or merriweather-open
- For "modern" style: use inter-inter or jakarta-jakarta
- For "creative" style: use playfair-source or crimson-nunito
- For "executive" style: use cormorant-raleway or merriweather-open`;

  // =========================================================================
  // USER MESSAGE — all wizard data
  // =========================================================================
  const experienceText = experiences.length > 0
    ? experiences.map((exp, i) =>
        `Position ${i + 1}:
  Company: ${exp.company}
  Position: ${exp.position}
  Period: ${exp.startDate} - ${exp.isCurrent ? "Present" : exp.endDate}
  Description: ${exp.description || "(no description provided)"}`
      ).join("\n\n")
    : "(No experience provided — this might be an entry-level candidate)";

  const educationText = education.length > 0
    ? education.map((edu, i) =>
        `Education ${i + 1}:
  Institution: ${edu.institution}
  Degree: ${edu.degree}
  Field: ${edu.field}
  Graduation: ${edu.graduationYear}`
      ).join("\n\n")
    : "(No education provided)";

  const skillsText = skills.length > 0
    ? `Skills: ${skills.join(", ")}`
    : "(No skills provided)";

  const optionalText = buildOptionalSectionsText(optionalSections);

  const userMessage = `Generate a professional resume for this candidate:

## Personal Information
Name: ${personal.name}
Email: ${personal.email}
Phone: ${personal.phone || "(not provided)"}
Location: ${personal.location || "(not provided)"}
LinkedIn: ${personal.linkedin || "(not provided)"}
Website: ${personal.website || "(not provided)"}

## Target Role
Job Title: ${targetRole.jobTitle}
Experience Level: ${targetRole.experienceLevel}
Industry: ${targetRole.industry || "(not specified)"}
Additional Context: ${targetRole.additionalContext || "(none)"}

## Work Experience
${experienceText}

## Education
${educationText}

## ${skillsText}

${optionalText}

## Preferences
Resume Style: ${brief.style}
Page Count Preference: ${brief.pageCount}
Accent Color: ${brief.accentColor}
Content Fidelity: ${brief.contentFidelityMode}
${brief.jobDescription ? `\n## Target Job Description (optimize for this)\n${brief.jobDescription}` : ""}
${brief.description ? `\n## Additional Notes\n${brief.description}` : ""}

Generate the complete resume JSON now.`;

  return { systemPrompt, userMessage };
}

// ---------------------------------------------------------------------------
// Optional sections text builder
// ---------------------------------------------------------------------------

function buildOptionalSectionsText(optional?: OptionalSections): string {
  if (!optional) return "";
  const parts: string[] = [];

  if (optional.certifications.length > 0) {
    parts.push("## Certifications\n" + optional.certifications.map((c) =>
      `- ${c.name} (${c.issuer}, ${c.year})`
    ).join("\n"));
  }

  if (optional.languages.length > 0) {
    parts.push("## Languages\n" + optional.languages.map((l) =>
      `- ${l.name}: ${l.proficiency}`
    ).join("\n"));
  }

  if (optional.volunteer.length > 0) {
    parts.push("## Volunteer Experience\n" + optional.volunteer.map((v) =>
      `- ${v.role} at ${v.organization}: ${v.description}`
    ).join("\n"));
  }

  if (optional.projects.length > 0) {
    parts.push("## Projects\n" + optional.projects.map((p) =>
      `- ${p.name}: ${p.description}${p.url ? ` (${p.url})` : ""}`
    ).join("\n"));
  }

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Response parser — extract JSON, repair truncation, validate
// ---------------------------------------------------------------------------

/**
 * Parse the raw AI response text into a validated ResumeData object.
 */
export function parseResumeResponse(rawText: string, wasTruncated: boolean): ResumeData {
  // 1. Extract JSON string
  let jsonStr = extractJsonString(rawText);

  // 2. If truncated, attempt repair
  if (wasTruncated) {
    const repaired = repairTruncatedJson(jsonStr);
    if (repaired) jsonStr = repaired;
  }

  // 3. Parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  // 4. Validate with Zod
  const result = resumeDataSchema.safeParse(parsed);
  if (result.success) {
    return ensureItemIds(result.data);
  }

  // Log initial validation errors for debugging
  if ('error' in result) {
    const zodErr = result.error;
    console.warn("[resume-parse] Initial Zod validation errors:", JSON.stringify(zodErr.issues?.slice(0, 10), null, 2));
  }

  // 5. Attempt repair and re-validate
  const repaired = repairResumeData(parsed as Record<string, unknown>);
  const retryResult = resumeDataSchema.safeParse(repaired);
  if (retryResult.success) {
    return ensureItemIds(retryResult.data);
  }

  // Log repair-attempt errors for debugging
  if ('error' in retryResult) {
    const zodErr = retryResult.error;
    console.error("[resume-parse] Post-repair Zod errors:", JSON.stringify(zodErr.issues?.slice(0, 10), null, 2));
  }

  throw new Error("AI response does not conform to resume schema after repair attempt");
}

// ---------------------------------------------------------------------------
// JSON extraction (same pattern as ai-design-generator.ts)
// ---------------------------------------------------------------------------

function extractJsonString(raw: string): string {
  let jsonStr = raw.trim();

  // Try to extract from ```json ... ``` blocks
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // Try to find raw JSON object
  if (!jsonStr.startsWith("{")) {
    const jsonStart = jsonStr.indexOf("{");
    if (jsonStart >= 0) {
      jsonStr = jsonStr.slice(jsonStart);
    }
  }

  // Remove trailing non-JSON
  const lastBrace = jsonStr.lastIndexOf("}");
  if (lastBrace >= 0 && lastBrace < jsonStr.length - 1) {
    jsonStr = jsonStr.slice(0, lastBrace + 1);
  }

  return jsonStr;
}

// ---------------------------------------------------------------------------
// Truncated JSON repair (from ai-design-generator.ts)
// ---------------------------------------------------------------------------

function repairTruncatedJson(json: string): string | null {
  let s = json.trim();

  // Strip trailing incomplete string (unmatched quote)
  let inString = false;
  let lastCompletePos = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (ch === "\\" && i + 1 < s.length) {
        i++; // skip escaped char
      } else if (ch === '"') {
        inString = false;
        lastCompletePos = i + 1;
      }
    } else {
      if (ch === '"') {
        inString = true;
      } else if ("{}[]:,".includes(ch)) {
        lastCompletePos = i + 1;
      }
    }
  }

  if (inString) {
    s = s.slice(0, lastCompletePos);
  }

  // Strip trailing comma or colon
  s = s.replace(/[,:\s]+$/, "");

  // Count open braces and brackets
  let braces = 0;
  let brackets = 0;
  inString = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (ch === "\\" && i + 1 < s.length) i++;
      else if (ch === '"') inString = false;
    } else {
      if (ch === '"') inString = true;
      else if (ch === "{") braces++;
      else if (ch === "}") braces--;
      else if (ch === "[") brackets++;
      else if (ch === "]") brackets--;
    }
  }

  if (braces <= 0 && brackets <= 0) return null;

  while (brackets > 0) { s += "]"; brackets--; }
  while (braces > 0) { s += "}"; braces--; }

  return s;
}

// ---------------------------------------------------------------------------
// Data repair — fix common AI mistakes
// ---------------------------------------------------------------------------

function repairResumeData(raw: Record<string, unknown>): Record<string, unknown> {
  const data = { ...raw };

  // Ensure basics exists
  if (!data.basics || typeof data.basics !== "object") {
    data.basics = {};
  }
  // Ensure basics.website is an object (AI sometimes returns a string)
  const basics = data.basics as Record<string, unknown>;
  if (basics.website && typeof basics.website === "string") {
    basics.website = { url: basics.website, label: "Website" };
  } else if (!basics.website || typeof basics.website !== "object") {
    basics.website = { url: "", label: "" };
  }
  if (!Array.isArray(basics.customFields)) basics.customFields = [];

  // Ensure sections exists
  if (!data.sections || typeof data.sections !== "object") {
    data.sections = {};
  }

  // Ensure metadata exists
  if (!data.metadata || typeof data.metadata !== "object") {
    data.metadata = {};
  }

  // Ensure customSections exists
  if (!data.customSections) {
    data.customSections = [];
  }

  // Fix sections — ensure each has required structure
  const sections = data.sections as Record<string, unknown>;
  const sectionKeys = [
    "summary", "experience", "education", "skills",
    "certifications", "languages", "volunteer", "projects",
    "awards", "references",
  ];

  for (const key of sectionKeys) {
    if (key === "summary") {
      if (!sections[key] || typeof sections[key] !== "object") {
        sections[key] = { title: "Professional Summary", content: "", hidden: false };
      }
    } else {
      const sect = sections[key] as Record<string, unknown> | undefined;
      if (!sect || typeof sect !== "object") {
        sections[key] = { title: key.charAt(0).toUpperCase() + key.slice(1), items: [], hidden: true };
      } else {
        if (!Array.isArray(sect.items)) {
          sect.items = [];
        }
      }
    }
  }

  // ── Deep item repair — fix enums, ensure IDs, normalize field names ──
  const sects = data.sections as Record<string, { items?: Record<string, unknown>[] }>;

  // Language proficiency normalization
  const LANG_PROFICIENCY_MAP: Record<string, string> = {
    "native": "native", "c2": "native", "mother tongue": "native",
    "fluent": "fluent", "c1": "fluent", "proficient": "fluent", "professional": "fluent",
    "advanced": "fluent", "near-native": "fluent", "bilingual": "native",
    "intermediate": "intermediate", "b2": "intermediate", "b1": "intermediate",
    "conversational": "intermediate", "working": "intermediate",
    "basic": "basic", "a2": "basic", "a1": "basic", "elementary": "basic",
    "beginner": "basic", "limited": "basic",
  };
  if (sects.languages?.items) {
    for (const item of sects.languages.items) {
      if (!item.id) item.id = createItemId();
      const raw = String(item.proficiency ?? "intermediate").toLowerCase().trim();
      item.proficiency = LANG_PROFICIENCY_MAP[raw] ?? "intermediate";
      // Fix common AI field name mistakes
      if (!item.name && item.language) { item.name = item.language; delete item.language; }
    }
  }

  // Skill proficiency normalization
  const SKILL_PROFICIENCY_MAP: Record<string, string> = {
    "beginner": "beginner", "basic": "beginner", "novice": "beginner", "entry": "beginner",
    "intermediate": "intermediate", "proficient": "intermediate", "competent": "intermediate",
    "advanced": "advanced", "skilled": "advanced", "senior": "advanced",
    "expert": "expert", "master": "expert", "lead": "expert",
  };
  if (sects.skills?.items) {
    for (const item of sects.skills.items) {
      if (!item.id) item.id = createItemId();
      if (item.proficiency) {
        const raw = String(item.proficiency).toLowerCase().trim();
        const mapped = SKILL_PROFICIENCY_MAP[raw];
        if (mapped) item.proficiency = mapped;
        else delete item.proficiency; // remove invalid values — field is optional
      }
      if (!Array.isArray(item.keywords)) item.keywords = [];
    }
  }

  // Experience items repair
  if (sects.experience?.items) {
    for (const item of sects.experience.items) {
      if (!item.id) item.id = createItemId();
      // Common AI field name mistakes
      if (!item.position && item.title) { item.position = item.title; delete item.title; }
      if (!item.position && item.role) { item.position = item.role; delete item.role; }
      if (typeof item.isCurrent !== "boolean") item.isCurrent = false;
      if (!item.description) item.description = "";
      if (!item.website) item.website = "";
      if (!item.location) item.location = "";
    }
  }

  // Education items repair
  if (sects.education?.items) {
    for (const item of sects.education.items) {
      if (!item.id) item.id = createItemId();
      if (!item.institution && item.school) { item.institution = item.school; delete item.school; }
      if (!item.graduationYear && item.year) { item.graduationYear = item.year; delete item.year; }
      if (!item.description) item.description = "";
    }
  }

  // Certification items repair
  if (sects.certifications?.items) {
    for (const item of sects.certifications.items) {
      if (!item.id) item.id = createItemId();
      if (!item.url) item.url = "";
      if (!item.year) item.year = "";
    }
  }

  // Volunteer items repair
  if (sects.volunteer?.items) {
    for (const item of sects.volunteer.items) {
      if (!item.id) item.id = createItemId();
      if (!item.role && item.position) { item.role = item.position; delete item.position; }
      if (!item.startDate) item.startDate = "";
      if (!item.endDate) item.endDate = "";
      if (!item.description) item.description = "";
    }
  }

  // Project items repair
  if (sects.projects?.items) {
    for (const item of sects.projects.items) {
      if (!item.id) item.id = createItemId();
      if (!item.url) item.url = "";
      if (!Array.isArray(item.keywords)) item.keywords = [];
      if (!item.description) item.description = "";
    }
  }

  // Award items repair
  if (sects.awards?.items) {
    for (const item of sects.awards.items) {
      if (!item.id) item.id = createItemId();
      if (!item.title && item.name) { item.title = item.name; delete item.name; }
      if (!item.date) item.date = "";
      if (!item.issuer) item.issuer = "";
      if (!item.description) item.description = "";
    }
  }

  // Reference items repair
  if (sects.references?.items) {
    for (const item of sects.references.items) {
      if (!item.id) item.id = createItemId();
      if (!item.relationship) item.relationship = "";
      if (!item.phone) item.phone = "";
      if (!item.email) item.email = "";
      if (!item.description) item.description = "";
    }
  }

  // Fix metadata
  const meta = data.metadata as Record<string, unknown>;
  // Fix legacy template IDs to new pro templates
  const legacyTemplateMap: Record<string, string> = {
    "classic": "classic-corporate",
    "modern": "modern-minimalist",
    "two-column": "elegant-sidebar",
    "minimal": "swiss-typographic",
    "executive": "corporate-executive",
    "creative": "creative-bold",
  };
  if (!meta.template || legacyTemplateMap[meta.template as string]) {
    meta.template = legacyTemplateMap[meta.template as string] ?? "modern-minimalist";
  }
  // Validate template is one of the known IDs
  const validTemplates = [
    "modern-minimalist", "corporate-executive", "creative-bold", "elegant-sidebar",
    "infographic", "dark-professional", "gradient-creative", "classic-corporate",
    "artistic-portfolio", "tech-modern", "swiss-typographic", "newspaper-editorial",
    "brutalist-mono", "pastel-soft", "split-duotone", "architecture-blueprint",
    "retro-vintage", "medical-clean", "neon-glass", "corporate-stripe",
  ];
  if (!validTemplates.includes(meta.template as string)) {
    meta.template = "modern-minimalist";
  }
  if (!meta.layout) {
    meta.layout = {
      sidebarWidth: 35,
      pages: [{
        fullWidth: false,
        main: ["summary", "experience", "projects"],
        sidebar: ["skills", "education", "certifications", "languages"],
      }],
    };
  }
  // Fix layout.pages if it's missing or malformed
  const layout = meta.layout as Record<string, unknown>;
  if (!Array.isArray(layout.pages) || layout.pages.length === 0) {
    layout.pages = [{
      fullWidth: false,
      main: ["summary", "experience", "projects"],
      sidebar: ["skills", "education", "certifications", "languages"],
    }];
  }
  if (typeof layout.sidebarWidth !== "number" || layout.sidebarWidth < 20 || layout.sidebarWidth > 45) {
    layout.sidebarWidth = 35;
  }
  if (!meta.css) meta.css = { enabled: false, value: "" };
  if (!meta.page) meta.page = { format: "letter", marginPreset: "standard", sectionSpacing: "standard", lineSpacing: "normal" };
  if (!meta.design) meta.design = { primaryColor: "rgba(37, 99, 235, 1)", backgroundColor: "rgba(255, 255, 255, 1)", textColor: "rgba(0, 0, 0, 1)", colorIntensity: "standard" };
  if (!meta.typography) meta.typography = { fontPairing: "inter-georgia", fontScale: "standard" };

  // Validate enum fields in metadata sub-objects
  const page = meta.page as Record<string, unknown>;
  if (!["a4", "letter", "a5", "b5", "linkedin-banner", "instagram-square"].includes(page.format as string)) page.format = "letter";
  if (!["narrow", "standard", "wide"].includes(page.marginPreset as string)) page.marginPreset = "standard";
  if (!["compact", "standard", "relaxed"].includes(page.sectionSpacing as string)) page.sectionSpacing = "standard";
  if (!["tight", "normal", "loose"].includes(page.lineSpacing as string)) page.lineSpacing = "normal";
  const design = meta.design as Record<string, unknown>;
  if (!["subtle", "standard", "bold"].includes(design.colorIntensity as string)) design.colorIntensity = "standard";
  const typo = meta.typography as Record<string, unknown>;
  if (!["compact", "standard", "spacious"].includes(typo.fontScale as string)) typo.fontScale = "standard";

  return data;
}

// ---------------------------------------------------------------------------
// Ensure all items have valid IDs
// ---------------------------------------------------------------------------

function ensureItemIds(data: ResumeData): ResumeData {
  const sections = data.sections;

  // For each section with items, ensure each item has an id
  const sectionKeys = [
    "experience", "education", "skills", "certifications",
    "languages", "volunteer", "projects", "awards", "references",
  ] as const;

  for (const key of sectionKeys) {
    const section = sections[key];
    if (section && "items" in section) {
      for (const item of section.items) {
        if (!item.id) {
          (item as { id: string }).id = createItemId();
        }
      }
    }
  }

  // Custom sections
  for (const cs of data.customSections) {
    if (!cs.id) cs.id = createItemId();
    for (const item of cs.items) {
      if (!item.id) (item as { id: string }).id = createItemId();
    }
  }

  return data;
}

// ---------------------------------------------------------------------------
// Local fallback — build from raw wizard data without AI
// ---------------------------------------------------------------------------

export function buildFallbackResume(input: ResumeGenerationInput): ResumeData {
  const { personal, targetRole, experiences, education, skills, brief, optionalSections } = input;

  const data = createDefaultResumeData();

  // Basics
  data.basics.name = personal.name;
  data.basics.email = personal.email;
  data.basics.phone = personal.phone;
  data.basics.location = personal.location;
  data.basics.linkedin = personal.linkedin;
  data.basics.headline = targetRole.jobTitle;
  if (personal.website) {
    data.basics.website = { url: personal.website, label: "Website" };
  }

  // Summary (simple generated)
  const yearsLabel = targetRole.experienceLevel === "entry" ? ""
    : targetRole.experienceLevel === "mid" ? "with several years of experience "
    : targetRole.experienceLevel === "senior" ? "with extensive experience "
    : "a seasoned leader ";
  data.sections.summary.content = `${personal.name} is a ${targetRole.jobTitle} ${yearsLabel}in the ${targetRole.industry || "professional"} industry, bringing strong expertise in ${skills.slice(0, 3).join(", ") || "the field"}.`;
  data.sections.summary.hidden = false;

  // Experience
  data.sections.experience.items = experiences.map((exp) => ({
    id: createItemId(),
    hidden: false,
    company: exp.company,
    position: exp.position,
    location: "",
    startDate: exp.startDate,
    endDate: exp.isCurrent ? "Present" : exp.endDate,
    isCurrent: exp.isCurrent,
    website: "",
    description: exp.description,
  }));
  data.sections.experience.hidden = experiences.length === 0;

  // Education
  data.sections.education.items = education.map((edu) => ({
    id: createItemId(),
    hidden: false,
    institution: edu.institution,
    degree: edu.degree,
    field: edu.field,
    graduationYear: edu.graduationYear,
    description: "",
  }));
  data.sections.education.hidden = education.length === 0;

  // Skills — create individual items (one per skill) for direct rendering
  if (skills.length > 0) {
    data.sections.skills.items = skills.map((s) => ({
      id: createItemId(),
      hidden: false,
      name: s,
      keywords: [],
    }));
    data.sections.skills.hidden = false;
  }

  // Optional sections
  if (optionalSections) {
    // Certifications
    if (optionalSections.certifications.length > 0) {
      data.sections.certifications.items = optionalSections.certifications.map((c) => ({
        id: createItemId(),
        hidden: false,
        name: c.name,
        issuer: c.issuer,
        year: c.year,
        url: "",
      }));
      data.sections.certifications.hidden = false;
    }

    // Languages
    if (optionalSections.languages.length > 0) {
      data.sections.languages.items = optionalSections.languages.map((l) => ({
        id: createItemId(),
        hidden: false,
        name: l.name,
        proficiency: l.proficiency as "native" | "fluent" | "intermediate" | "basic",
      }));
      data.sections.languages.hidden = false;
    }

    // Volunteer
    if (optionalSections.volunteer.length > 0) {
      data.sections.volunteer.items = optionalSections.volunteer.map((v) => ({
        id: createItemId(),
        hidden: false,
        organization: v.organization,
        role: v.role,
        description: v.description,
        startDate: "",
        endDate: "",
      }));
      data.sections.volunteer.hidden = false;
    }

    // Projects
    if (optionalSections.projects.length > 0) {
      data.sections.projects.items = optionalSections.projects.map((p) => ({
        id: createItemId(),
        hidden: false,
        name: p.name,
        description: p.description,
        url: p.url,
        keywords: [],
      }));
      data.sections.projects.hidden = false;
    }
  }

  // Metadata — design choices
  data.metadata.template = STYLE_TO_TEMPLATE[brief.style] ?? "modern-minimalist";
  data.metadata.design.primaryColor = brief.accentColor;

  // Typography based on style
  const fontMap: Record<ResumeStyle, string> = {
    professional: "inter-georgia",
    modern: "inter-inter",
    creative: "playfair-source",
    executive: "merriweather-open",
  };
  data.metadata.typography.fontPairing = fontMap[brief.style] ?? "inter-georgia";

  // Layout based on template (use template-defs for accuracy)
  const template = data.metadata.template;
  // Two-column templates based on new pro template definitions
  const twoColumnTemplates = [
    "modern-minimalist", "creative-bold", "elegant-sidebar", "infographic",
    "dark-professional", "gradient-creative", "classic-corporate", "artistic-portfolio",
    "tech-modern", "swiss-typographic", "newspaper-editorial", "pastel-soft",
    "split-duotone", "retro-vintage", "medical-clean", "neon-glass", "corporate-stripe"
  ];
  const isTwoColumn = twoColumnTemplates.includes(template);
  if (isTwoColumn) {
    data.metadata.layout.pages = [{
      fullWidth: false,
      main: ["summary", "experience", "projects"],
      sidebar: ["skills", "education", "certifications", "languages"],
    }];
  } else {
    data.metadata.layout.pages = [{
      fullWidth: true,
      main: ["summary", "experience", "education", "skills", "certifications", "languages", "projects"],
      sidebar: [],
    }];
  }

  return data;
}
