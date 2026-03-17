// =============================================================================
// DMSuite — AI Resume Revision Engine
// Dual-mode architecture:
//   Mode 1 — Deterministic intents (structure, design, common operations)
//   Mode 2 — Scoped patch operations (targeted content changes via AI)
//
// Validation pipeline: scope → fidelity → boundary → silent adds → apply → size
// NEVER auto-applies — always returns diff preview for Accept/Reject.
//
// Architecture mirrors src/lib/editor/ai-patch.ts (1,900 lines) adapted for
// resume documents instead of Canvas2D layers.
// =============================================================================

import type { Operation } from "fast-json-patch";
import {
  type ResumeData,
  type TemplateId,
  type ContentFidelityMode,
  type FontScale,
  FONT_PAIRINGS,
  ACCENT_COLORS,
  computeCSSVariables,
} from "./schema";
import {
  type RevisionScope,
  type ValidationPipelineResult,
  runValidationPipeline,
  buildSectionReplacePatch,
  buildItemReplacePatch,
  buildToggleVisibilityPatch,
  buildMoveSectionPatch,
  buildDesignPatch,
  buildReorderPatch,
  parseAndValidateOperations,
  verifyShorterContent,
  verifyLongerContent,
  generateDiff,
  applyResumePatches,
} from "./patch-utils";
import { calculateATSScore } from "./ats-scorer";

// ---------------------------------------------------------------------------
// Intent Types (resume-specific, analogous to ai-patch.ts IntentType)
// ---------------------------------------------------------------------------

export type ResumeIntentType =
  // ---- Content intents (require AI text generation) ----
  | "rewrite-section"
  | "shorten-section"
  | "expand-section"
  | "add-keywords"
  | "regenerate-section"
  | "tailor-for-job"
  | "improve-ats-score"
  // ---- Structure intents (100% deterministic) ----
  | "reorder-sections"
  | "hide-section"
  | "show-section"
  | "move-to-sidebar"
  | "move-to-main"
  | "add-section"
  | "remove-section"
  // ---- Design intents (100% deterministic) ----
  | "change-template"
  | "change-font"
  | "change-color"
  | "change-spacing"
  | "change-page-format";

/** Intents that require AI text generation */
const CONTENT_INTENTS: Set<ResumeIntentType> = new Set([
  "rewrite-section",
  "shorten-section",
  "expand-section",
  "add-keywords",
  "regenerate-section",
  "tailor-for-job",
  "improve-ats-score",
]);

/** Intents that are 100% deterministic — no AI needed */
const DETERMINISTIC_INTENTS: Set<ResumeIntentType> = new Set([
  "reorder-sections",
  "hide-section",
  "show-section",
  "move-to-sidebar",
  "move-to-main",
  "add-section",
  "remove-section",
  "change-template",
  "change-font",
  "change-color",
  "change-spacing",
  "change-page-format",
]);

// ---------------------------------------------------------------------------
// Intent + Context types
// ---------------------------------------------------------------------------

export interface ResumeEditIntent {
  type: ResumeIntentType;
  params?: Record<string, unknown>;
}

export interface RevisionContext {
  scope: RevisionScope;
  contentFidelityMode: ContentFidelityMode;
  targetSectionId?: string;
  targetItemId?: string;
  wizardData: WizardDataSnapshot;
  targetRole: string;
  jobDescription?: string;
}

/** Snapshot of original wizard data for regeneration intents */
export interface WizardDataSnapshot {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
  };
  experiences: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationYear: string;
  }>;
  skills: string[];
  brief: {
    description: string;
    style: string;
    contentFidelityMode: ContentFidelityMode;
    jobDescription: string;
  };
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface RevisionResult {
  success: boolean;
  patches: Operation[];
  rejectedPatches: Array<{ op: Operation; reason: string }>;
  warnings: string[];
  updatedResumeData: ResumeData | null;
  summary: string;
  newATSScore: number;
  intent?: ResumeEditIntent;
}

// ---------------------------------------------------------------------------
// Intent classification — map natural language → intent type
// ---------------------------------------------------------------------------

const INTENT_PATTERNS: Array<{
  patterns: RegExp[];
  type: ResumeIntentType;
  extractParams?: (instruction: string, context: RevisionContext) => Record<string, unknown>;
}> = [
  // Design intents
  {
    patterns: [/change\s+(the\s+)?template\s+to\s+(\w+)/i, /switch\s+(to\s+)?(\w+)\s+template/i, /use\s+(\w+)\s+template/i],
    type: "change-template",
    extractParams: (inst) => {
      const m = inst.match(/(?:template\s+to|to\s+|use\s+)(\w+)/i);
      return { templateId: m?.[1]?.toLowerCase() ?? "classic" };
    },
  },
  {
    patterns: [/change\s+(the\s+)?font/i, /switch\s+font/i, /use\s+(\w+)\s+font/i],
    type: "change-font",
    extractParams: (inst) => {
      // Try to match a known font pairing key
      const lower = inst.toLowerCase();
      for (const key of Object.keys(FONT_PAIRINGS)) {
        if (lower.includes(key.toLowerCase())) return { fontPairing: key };
      }
      return {};
    },
  },
  {
    patterns: [/change\s+(the\s+)?(accent\s+)?colou?r/i, /make\s+it\s+(blue|red|green|teal|purple|orange)/i],
    type: "change-color",
    extractParams: (inst) => {
      const m = inst.match(/(blue|red|green|teal|purple|orange|cyan|pink|indigo|amber)/i);
      const colorMap: Record<string, string> = {
        blue: "rgba(37, 99, 235, 1)",
        red: "rgba(220, 38, 38, 1)",
        green: "rgba(22, 163, 74, 1)",
        teal: "rgba(20, 184, 166, 1)",
        purple: "rgba(147, 51, 234, 1)",
        orange: "rgba(234, 88, 12, 1)",
        cyan: "rgba(6, 182, 212, 1)",
        pink: "rgba(219, 39, 119, 1)",
        indigo: "rgba(79, 70, 229, 1)",
        amber: "rgba(217, 119, 6, 1)",
      };
      return { color: m ? colorMap[m[1].toLowerCase()] : undefined };
    },
  },
  {
    patterns: [/change\s+(the\s+)?spacing/i, /more\s+spacing/i, /less\s+spacing/i, /compact/i, /spacious/i],
    type: "change-spacing",
    extractParams: (inst) => {
      const lower = inst.toLowerCase();
      if (lower.includes("compact") || lower.includes("less") || lower.includes("tight")) return { fontScale: "compact" };
      if (lower.includes("spacious") || lower.includes("more") || lower.includes("roomy")) return { fontScale: "spacious" };
      return { fontScale: "standard" };
    },
  },
  {
    patterns: [/letter\s+size/i, /a4\s+format/i, /change.*page.*format/i],
    type: "change-page-format",
    extractParams: (inst) => {
      return { format: inst.toLowerCase().includes("letter") ? "letter" : "a4" };
    },
  },
  // Structure intents
  {
    patterns: [/hide\s+(the\s+)?(\w+)\s+section/i, /remove\s+(the\s+)?(\w+)\s+section/i],
    type: "hide-section",
    extractParams: (inst) => {
      const m = inst.match(/(?:hide|remove)\s+(?:the\s+)?(\w+)\s+section/i);
      return { sectionId: m?.[1]?.toLowerCase() };
    },
  },
  {
    patterns: [/show\s+(the\s+)?(\w+)\s+section/i, /unhide\s+(the\s+)?(\w+)/i],
    type: "show-section",
    extractParams: (inst) => {
      const m = inst.match(/(?:show|unhide)\s+(?:the\s+)?(\w+)/i);
      return { sectionId: m?.[1]?.toLowerCase() };
    },
  },
  {
    patterns: [/move\s+(\w+)\s+to\s+sidebar/i],
    type: "move-to-sidebar",
    extractParams: (inst) => {
      const m = inst.match(/move\s+(\w+)\s+to\s+sidebar/i);
      return { sectionId: m?.[1]?.toLowerCase() };
    },
  },
  {
    patterns: [/move\s+(\w+)\s+to\s+main/i],
    type: "move-to-main",
    extractParams: (inst) => {
      const m = inst.match(/move\s+(\w+)\s+to\s+main/i);
      return { sectionId: m?.[1]?.toLowerCase() };
    },
  },
  // Content intents
  {
    patterns: [/shorten/i, /make\s+(it\s+)?shorter/i, /more\s+concise/i, /too\s+long/i, /condense/i],
    type: "shorten-section",
  },
  {
    patterns: [/expand/i, /make\s+(it\s+)?longer/i, /add\s+more\s+detail/i, /elaborate/i],
    type: "expand-section",
  },
  {
    patterns: [/rewrite/i, /rephrase/i, /improve\s+the\s+writing/i, /make\s+(it\s+)?sound\s+better/i],
    type: "rewrite-section",
  },
  {
    patterns: [/add\s+keywords/i, /more\s+keywords/i, /ats\s+keywords/i],
    type: "add-keywords",
  },
  {
    patterns: [/regenerate/i, /start\s+over/i, /rewrite\s+from\s+scratch/i],
    type: "regenerate-section",
  },
  {
    patterns: [/tailor/i, /customize\s+for/i, /optimize\s+for\s+(?:this\s+)?job/i],
    type: "tailor-for-job",
  },
  {
    patterns: [/improve\s+(?:the\s+)?ats/i, /ats\s+score/i, /fix\s+ats/i, /better\s+ats/i],
    type: "improve-ats-score",
  },
  {
    patterns: [/fit\s+(?:to\s+|on\s+)?one\s+page/i, /fit\s+(?:to\s+|on\s+)?1\s+page/i],
    type: "shorten-section",
    extractParams: () => ({ fitToPages: 1 }),
  },
];

/**
 * Classify a natural language instruction into an intent type.
 */
export function classifyIntent(
  instruction: string,
  context: RevisionContext
): ResumeEditIntent | null {
  const lower = instruction.toLowerCase().trim();

  for (const rule of INTENT_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(lower)) {
        const params = rule.extractParams?.(instruction, context) ?? {};

        // Auto-inject target section from context
        if (context.targetSectionId && !params.sectionId) {
          params.sectionId = context.targetSectionId;
        }

        return { type: rule.type, params };
      }
    }
  }

  // Default: if we have a target section, assume rewrite
  if (context.targetSectionId) {
    return {
      type: "rewrite-section",
      params: { sectionId: context.targetSectionId },
    };
  }

  // Broad request — return null (will use Mode 2 scoped patches)
  return null;
}

// ---------------------------------------------------------------------------
// Mode 1: Deterministic intent execution
// ---------------------------------------------------------------------------

/**
 * Execute a deterministic intent and produce JSON Patch operations.
 * These intents require NO AI text generation.
 */
export function executeDeterministicIntent(
  resume: ResumeData,
  intent: ResumeEditIntent
): { operations: Operation[]; summary: string } {
  const params = intent.params ?? {};

  switch (intent.type) {
    case "change-template": {
      const templateId = params.templateId as TemplateId | undefined;
      if (!templateId) return { operations: [], summary: "No template specified" };
      return {
        operations: buildDesignPatch("template", templateId),
        summary: `Changed template to "${templateId}"`,
      };
    }

    case "change-font": {
      const pairingKey = params.fontPairing as string | undefined;
      if (!pairingKey || !(pairingKey in FONT_PAIRINGS)) {
        return { operations: [], summary: "Unknown font pairing" };
      }
      return {
        operations: buildDesignPatch("typography/fontPairing", pairingKey),
        summary: `Changed font to "${FONT_PAIRINGS[pairingKey].label}"`,
      };
    }

    case "change-color": {
      const color = params.color as string | undefined;
      if (!color) return { operations: [], summary: "No color specified" };
      const colorEntry = ACCENT_COLORS.find((c) => c.value === color);
      return {
        operations: buildDesignPatch("design/primaryColor", color),
        summary: `Changed accent color to ${colorEntry?.name ?? "custom"}`,
      };
    }

    case "change-spacing": {
      const fontScale = params.fontScale as FontScale | undefined;
      if (!fontScale) return { operations: [], summary: "No spacing specified" };
      return {
        operations: buildDesignPatch("typography/fontScale", fontScale),
        summary: `Changed spacing to "${fontScale}"`,
      };
    }

    case "change-page-format": {
      const format = params.format as "a4" | "letter" | undefined;
      if (!format) return { operations: [], summary: "No format specified" };
      return {
        operations: buildDesignPatch("page/format", format),
        summary: `Changed page format to ${format.toUpperCase()}`,
      };
    }

    case "hide-section": {
      const sectionId = params.sectionId as string | undefined;
      if (!sectionId) return { operations: [], summary: "No section specified" };
      return {
        operations: buildToggleVisibilityPatch(sectionId, true),
        summary: `Hidden "${sectionId}" section`,
      };
    }

    case "show-section": {
      const sectionId = params.sectionId as string | undefined;
      if (!sectionId) return { operations: [], summary: "No section specified" };
      return {
        operations: buildToggleVisibilityPatch(sectionId, false),
        summary: `Shown "${sectionId}" section`,
      };
    }

    case "move-to-sidebar": {
      const sectionId = params.sectionId as string | undefined;
      if (!sectionId) return { operations: [], summary: "No section specified" };
      return {
        operations: buildMoveSectionPatch(
          resume.metadata.layout,
          sectionId,
          "sidebar",
          0
        ),
        summary: `Moved "${sectionId}" to sidebar`,
      };
    }

    case "move-to-main": {
      const sectionId = params.sectionId as string | undefined;
      if (!sectionId) return { operations: [], summary: "No section specified" };
      return {
        operations: buildMoveSectionPatch(
          resume.metadata.layout,
          sectionId,
          "main",
          0
        ),
        summary: `Moved "${sectionId}" to main column`,
      };
    }

    case "reorder-sections": {
      const sectionId = params.sectionId as string | undefined;
      const direction = params.direction as "up" | "down" | undefined;
      if (!sectionId || !direction) return { operations: [], summary: "No section or direction" };

      // Find the section in layout and move it
      const pages = resume.metadata.layout.pages;
      for (let pi = 0; pi < pages.length; pi++) {
        const page = pages[pi];
        for (const col of ["main", "sidebar"] as const) {
          const idx = page[col].indexOf(sectionId);
          if (idx === -1) continue;
          const newIdx = direction === "up" ? Math.max(0, idx - 1) : Math.min(page[col].length - 1, idx + 1);
          if (newIdx === idx) return { operations: [], summary: "Section is already at the edge" };
          return {
            operations: buildReorderPatch(
              `metadata/layout/pages/${pi}/${col}` as unknown as string,
              idx,
              newIdx,
              page[col]
            ),
            summary: `Moved "${sectionId}" ${direction}`,
          };
        }
      }
      return { operations: [], summary: "Section not found in layout" };
    }

    default:
      return { operations: [], summary: `Unknown deterministic intent: ${intent.type}` };
  }
}

// ---------------------------------------------------------------------------
// Mode 2: AI prompt builder for content revisions
// ---------------------------------------------------------------------------

/**
 * Build the system + user prompt for AI content revisions.
 * Follows the same pattern as buildAIPatchPrompt in ai-patch.ts.
 */
export function buildRevisionPrompt(
  resume: ResumeData,
  instruction: string,
  intent: ResumeEditIntent,
  context: RevisionContext
): { systemPrompt: string; userMessage: string } {
  const sectionId = (intent.params?.sectionId as string) ?? context.targetSectionId;
  const isKeepExact = context.contentFidelityMode === "keep-exact";

  const scopeDescriptions: Record<RevisionScope, string> = {
    "content-only": "You may ONLY modify text content in sections (descriptions, titles, keywords). Do NOT touch template, colors, fonts, spacing, or layout.",
    "design-only": "You may ONLY modify design settings (template, colors, fonts, spacing). Do NOT touch any text content.",
    "section-specific": `You may ONLY modify the "${sectionId}" section. Do NOT touch any other section or metadata.`,
    "full": "You may modify both content and design settings as needed.",
  };

  // Build a compact representation of the current resume for the AI
  const resumeSnapshot = buildResumeSnapshot(resume, sectionId);

  const systemPrompt = `You are a precision resume revision AI for DMSuite. You operate via RFC 6902 JSON Patch operations on a Zod-validated resume schema.

## RULES
1. Return ONLY valid JSON — no markdown, no explanation, no code fences.
2. Every operation must be a valid RFC 6902 JSON Patch op: { "op": "replace"|"add"|"remove", "path": "/json/pointer/path", "value": ... }
3. Paths use JSON Pointer syntax (RFC 6901): /sections/experience/items/0/description
4. SCOPE: ${scopeDescriptions[context.scope]}
5. ${isKeepExact
    ? 'CONTENT FIDELITY: "keep-exact" — Do NOT modify any user-written text. You may ONLY restructure, reorder, or adjust design/metadata.'
    : 'CONTENT FIDELITY: "ai-enhanced" — You have freedom to rewrite text for clarity, impact, and ATS optimization.'}
6. Do NOT add new sections or items unless explicitly asked.
7. Do NOT remove sections or items unless explicitly asked.
8. For text content: use strong action verbs, quantified achievements, no first-person pronouns, no generic filler.
9. All text must be ATS-friendly — standard headings, clean formatting.

## RESUME SCHEMA PATHS
- /basics/name, /basics/headline, /basics/email, /basics/phone, /basics/location
- /basics/website/url, /basics/website/label
- /sections/summary/content — Professional summary text
- /sections/summary/title — Section heading
- /sections/experience/items/N/company, position, startDate, endDate, description, location
- /sections/education/items/N/institution, degree, field, graduationYear
- /sections/skills/items/N/name (category name), keywords (string array)
- /sections/certifications/items/N/name, issuer, year
- /sections/languages/items/N/name, proficiency
- /sections/volunteer/items/N/organization, role, description
- /sections/projects/items/N/name, description, url
- /sections/awards/items/N/title, issuer, year, description
- /sections/references/items/N/name, relationship, contact
- /metadata/template — TemplateId: "classic"|"modern"|"two-column"|"minimal"|"executive"|"creative"
- /metadata/design/primaryColor — accent color (rgba string)
- /metadata/typography/fontPairing — font key
- /metadata/typography/fontScale — "compact"|"standard"|"spacious"

## RESPONSE FORMAT
{
  "operations": [
    { "op": "replace", "path": "/sections/summary/content", "value": "New summary text..." },
    { "op": "replace", "path": "/sections/experience/items/0/description", "value": "New bullet points..." }
  ],
  "summary": "Brief human-readable description of changes made"
}`;

  const userMessage = `## CURRENT RESUME STATE
${resumeSnapshot}

## TARGET ROLE: ${context.targetRole}
${context.jobDescription ? `## JOB DESCRIPTION:\n${context.jobDescription.slice(0, 2000)}` : ""}

## USER INSTRUCTION
"${instruction}"

## INTENT: ${intent.type}${sectionId ? ` (target: ${sectionId})` : ""}
${intent.type === "shorten-section" ? "CONSTRAINT: The modified content MUST be shorter than the original." : ""}
${intent.type === "expand-section" ? "CONSTRAINT: The modified content MUST be longer than the original." : ""}
${intent.type === "add-keywords" ? `CONSTRAINT: Add ATS-relevant keywords for "${context.targetRole}" role.` : ""}
${intent.type === "tailor-for-job" && context.jobDescription ? "CONSTRAINT: Align content with the job description keywords and requirements." : ""}

Generate the JSON Patch operations now.`;

  return { systemPrompt, userMessage };
}

/**
 * Build a compact snapshot of the resume for the AI prompt.
 */
function buildResumeSnapshot(resume: ResumeData, targetSectionId?: string): string {
  const lines: string[] = [];

  // Basics
  lines.push(`Name: ${resume.basics.name}`);
  lines.push(`Headline: ${resume.basics.headline}`);
  lines.push(`Email: ${resume.basics.email} | Phone: ${resume.basics.phone} | Location: ${resume.basics.location}`);

  // Template & design
  lines.push(`\nTemplate: ${resume.metadata.template} | Font: ${resume.metadata.typography.fontPairing} | Scale: ${resume.metadata.typography.fontScale}`);
  lines.push(`Color: ${resume.metadata.design.primaryColor}`);

  // Sections
  const s = resume.sections;

  // Summary
  if (!s.summary.hidden) {
    lines.push(`\n## ${s.summary.title}${targetSectionId === "summary" ? " [TARGET]" : ""}`);
    lines.push(s.summary.content || "(empty)");
  }

  // Experience
  if (!s.experience.hidden && s.experience.items.length > 0) {
    lines.push(`\n## ${s.experience.title}${targetSectionId === "experience" ? " [TARGET]" : ""}`);
    for (let i = 0; i < s.experience.items.length; i++) {
      const item = s.experience.items[i];
      if (item.hidden) continue;
      lines.push(`[${i}] ${item.position} at ${item.company} (${item.startDate} - ${item.isCurrent ? "Present" : item.endDate})`);
      lines.push(`    ${item.description || "(no description)"}`);
    }
  }

  // Education
  if (!s.education.hidden && s.education.items.length > 0) {
    lines.push(`\n## ${s.education.title}${targetSectionId === "education" ? " [TARGET]" : ""}`);
    for (let i = 0; i < s.education.items.length; i++) {
      const item = s.education.items[i];
      if (item.hidden) continue;
      lines.push(`[${i}] ${item.degree} in ${item.field} — ${item.institution} (${item.graduationYear})`);
    }
  }

  // Skills
  if (!s.skills.hidden && s.skills.items.length > 0) {
    lines.push(`\n## ${s.skills.title}${targetSectionId === "skills" ? " [TARGET]" : ""}`);
    for (let i = 0; i < s.skills.items.length; i++) {
      const item = s.skills.items[i];
      if (item.hidden) continue;
      lines.push(`[${i}] ${item.name}: ${item.keywords.join(", ")}`);
    }
  }

  // Other sections (compact)
  const otherSections = [
    { key: "certifications", data: s.certifications },
    { key: "languages", data: s.languages },
    { key: "volunteer", data: s.volunteer },
    { key: "projects", data: s.projects },
    { key: "awards", data: s.awards },
    { key: "references", data: s.references },
  ] as const;

  for (const { key, data } of otherSections) {
    if (data.hidden || data.items.length === 0) continue;
    lines.push(`\n## ${data.title}${targetSectionId === key ? " [TARGET]" : ""}`);
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if ((item as { hidden?: boolean }).hidden) continue;
      const vals = Object.values(item)
        .filter((v): v is string => typeof v === "string" && v.length > 0 && v !== item.id);
      lines.push(`[${i}] ${vals.join(" | ")}`);
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// AI response parser
// ---------------------------------------------------------------------------

interface AIRevisionResponse {
  operations: Operation[];
  summary: string;
}

/**
 * Parse the AI response into operations + summary.
 */
export function parseRevisionResponse(raw: string): AIRevisionResponse | null {
  try {
    // Extract JSON from potential markdown wrapping
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [raw];
    const jsonStr = jsonMatch[1] ?? jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    if (!parsed.operations || !Array.isArray(parsed.operations)) return null;

    // Validate each operation
    const operations = parseAndValidateOperations(parsed.operations);

    return {
      operations,
      summary: parsed.summary ?? "AI revision applied",
    };
  } catch {
    // Try to extract operations even from malformed JSON
    try {
      const opsMatch = raw.match(/"operations"\s*:\s*(\[[\s\S]*?\])/);
      if (!opsMatch) return null;
      const ops = JSON.parse(opsMatch[1]);
      const operations = parseAndValidateOperations(ops);
      return { operations, summary: "AI revision applied" };
    } catch {
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Main entry point: performAIRevision
// ---------------------------------------------------------------------------

/**
 * The main revision function. Classifies the instruction, executes deterministic
 * intents directly or calls the AI for content intents, runs all patches through
 * the validation pipeline, and returns the result for diff preview.
 *
 * NEVER auto-applies — always returns diff for Accept/Reject.
 */
export async function performAIRevision(
  instruction: string,
  currentResumeData: ResumeData,
  context: RevisionContext
): Promise<RevisionResult> {
  // 1. Classify instruction into an intent
  const intent = classifyIntent(instruction, context);

  // 2a. If it's a deterministic intent, execute directly
  if (intent && DETERMINISTIC_INTENTS.has(intent.type)) {
    const { operations, summary } = executeDeterministicIntent(
      currentResumeData,
      intent
    );

    if (operations.length === 0) {
      return {
        success: false,
        patches: [],
        rejectedPatches: [],
        warnings: [summary],
        updatedResumeData: null,
        summary,
        newATSScore: calculateATSScore(currentResumeData, context.targetRole).total,
        intent,
      };
    }

    // Run through validation pipeline
    const pipelineResult = runValidationPipeline(currentResumeData, operations, {
      scope: context.scope,
      contentFidelityMode: context.contentFidelityMode,
      targetSectionId: context.targetSectionId,
      intent: intent.type,
    });

    return buildResult(pipelineResult, intent, currentResumeData, context);
  }

  // 2b. Content intent or unclassified — needs AI
  const effectiveIntent = intent ?? { type: "rewrite-section" as ResumeIntentType, params: {} };

  // Content fidelity guard for "keep-exact" mode
  if (
    context.contentFidelityMode === "keep-exact" &&
    CONTENT_INTENTS.has(effectiveIntent.type)
  ) {
    return {
      success: false,
      patches: [],
      rejectedPatches: [],
      warnings: [
        'Content fidelity mode is "keep-exact" — AI cannot modify text content. Switch to "ai-enhanced" mode to allow text changes, or make a design/structure change instead.',
      ],
      updatedResumeData: null,
      summary: "Blocked by content fidelity mode",
      newATSScore: calculateATSScore(currentResumeData, context.targetRole).total,
      intent: effectiveIntent,
    };
  }

  // Build prompt and call AI
  const { systemPrompt, userMessage } = buildRevisionPrompt(
    currentResumeData,
    instruction,
    effectiveIntent,
    context
  );

  try {
    const response = await fetch("/api/chat/resume/revise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt, userMessage }),
    });

    if (!response.ok) {
      return {
        success: false,
        patches: [],
        rejectedPatches: [],
        warnings: [`AI request failed: ${response.status} ${response.statusText}`],
        updatedResumeData: null,
        summary: "AI revision failed",
        newATSScore: calculateATSScore(currentResumeData, context.targetRole).total,
        intent: effectiveIntent,
      };
    }

    const data = await response.json();
    const rawText = data.text as string;

    // Parse AI response
    const parsed = parseRevisionResponse(rawText);
    if (!parsed || parsed.operations.length === 0) {
      return {
        success: false,
        patches: [],
        rejectedPatches: [],
        warnings: ["AI returned no valid operations"],
        updatedResumeData: null,
        summary: "AI revision produced no changes",
        newATSScore: calculateATSScore(currentResumeData, context.targetRole).total,
        intent: effectiveIntent,
      };
    }

    // Run through validation pipeline
    const pipelineResult = runValidationPipeline(
      currentResumeData,
      parsed.operations,
      {
        scope: context.scope,
        contentFidelityMode: context.contentFidelityMode,
        targetSectionId: context.targetSectionId,
        intent: effectiveIntent.type,
      }
    );

    // Additional directional checks for shorten/expand
    if (pipelineResult.success && pipelineResult.newDocument) {
      if (effectiveIntent.type === "shorten-section") {
        const targetPath = context.targetSectionId
          ? `/sections/${context.targetSectionId}`
          : undefined;
        if (!verifyShorterContent(currentResumeData, pipelineResult.newDocument, targetPath)) {
          pipelineResult.warnings.push(
            "The AI revision did not actually shorten the content. Review carefully."
          );
        }
      }
      if (effectiveIntent.type === "expand-section") {
        const targetPath = context.targetSectionId
          ? `/sections/${context.targetSectionId}`
          : undefined;
        if (!verifyLongerContent(currentResumeData, pipelineResult.newDocument, targetPath)) {
          pipelineResult.warnings.push(
            "The AI revision did not actually expand the content. Review carefully."
          );
        }
      }
    }

    const result = buildResult(
      pipelineResult,
      effectiveIntent,
      currentResumeData,
      context
    );
    result.summary = parsed.summary;
    return result;
  } catch (err) {
    return {
      success: false,
      patches: [],
      rejectedPatches: [],
      warnings: [`AI revision error: ${err instanceof Error ? err.message : String(err)}`],
      updatedResumeData: null,
      summary: "AI revision failed",
      newATSScore: calculateATSScore(currentResumeData, context.targetRole).total,
      intent: effectiveIntent,
    };
  }
}

// ---------------------------------------------------------------------------
// Convenience: execute a direct intent (for button actions)
// ---------------------------------------------------------------------------

/**
 * Execute a specific intent directly without NL classification.
 * Used by UI buttons (e.g., "Rewrite" button on a section).
 */
export async function executeDirectIntent(
  intent: ResumeEditIntent,
  currentResumeData: ResumeData,
  context: RevisionContext
): Promise<RevisionResult> {
  if (DETERMINISTIC_INTENTS.has(intent.type)) {
    const { operations, summary } = executeDeterministicIntent(
      currentResumeData,
      intent
    );

    if (operations.length === 0) {
      return {
        success: false,
        patches: [],
        rejectedPatches: [],
        warnings: [summary],
        updatedResumeData: null,
        summary,
        newATSScore: calculateATSScore(currentResumeData, context.targetRole).total,
        intent,
      };
    }

    const pipelineResult = runValidationPipeline(currentResumeData, operations, {
      scope: context.scope,
      contentFidelityMode: context.contentFidelityMode,
      targetSectionId: context.targetSectionId,
      intent: intent.type,
    });

    return buildResult(pipelineResult, intent, currentResumeData, context);
  }

  // Content intent — delegate to the full performAIRevision
  const description = `${intent.type}${intent.params?.sectionId ? ` the ${intent.params.sectionId} section` : ""}`;
  return performAIRevision(description, currentResumeData, context);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildResult(
  pipelineResult: ValidationPipelineResult,
  intent: ResumeEditIntent,
  originalResume: ResumeData,
  context: RevisionContext
): RevisionResult {
  const newATSScore = pipelineResult.newDocument
    ? calculateATSScore(pipelineResult.newDocument, context.targetRole).total
    : calculateATSScore(originalResume, context.targetRole).total;

  return {
    success: pipelineResult.success,
    patches: pipelineResult.allowed,
    rejectedPatches: pipelineResult.rejected,
    warnings: pipelineResult.warnings,
    updatedResumeData: pipelineResult.newDocument ?? null,
    summary: pipelineResult.success
      ? `Applied ${pipelineResult.allowed.length} change${pipelineResult.allowed.length !== 1 ? "s" : ""}`
      : "Revision could not be applied",
    newATSScore,
    intent,
  };
}
