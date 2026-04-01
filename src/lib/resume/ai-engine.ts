// =============================================================================
// DMSuite — Resume AI Generation Engine
// Generates resume content from scratch or refines existing content.
// Used by API routes and Chiko actions.
// =============================================================================

import type { ResumeData } from "./schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResumeGenerateRequest {
  targetRole: string;
  yearsExperience?: number;
  industry?: string;
  keySkills?: string[];
  tone?: "professional" | "creative" | "academic" | "technical";
  existingData?: Partial<ResumeData>;
}

export interface ResumeRevisionRequest {
  resume: ResumeData;
  instruction: string;
  section?: string;
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

export const RESUME_GENERATE_SYSTEM_PROMPT = `You are an expert resume writer and career consultant with 15+ years of experience. You help create professional, ATS-friendly resumes.

RULES:
- Output ONLY valid JSON matching the ResumeData schema
- Every text field that will appear on the resume must be populated
- Use action verbs and quantify achievements where possible
- Keep descriptions concise (2-4 bullet points per role)
- Use HTML for formatting: <strong>, <em>, <ul><li>...</li></ul>
- Make the summary 2-3 sentences, impactful and specific
- Ensure all dates use consistent format (e.g., "Jan 2020 — Present")
- Skills should include relevant keywords for ATS scanning
- Generate realistic but fictional sample data if none provided
- Include 2-3 experience items, 1-2 education items, 5-8 skills
- Set appropriate metadata: template "onyx", Electric Violet accent

SCHEMA (simplified):
{
  "basics": { "name", "headline", "email", "phone", "location", "website": { "url", "label" }, "customFields": [] },
  "picture": { "hidden": true, "url": "", "size": 80, "aspectRatio": 1, "borderRadius": 0, "borderColor": "rgba(0,0,0,0.5)", "borderWidth": 0 },
  "summary": { "title": "Summary", "columns": 1, "hidden": false, "content": "<p>...</p>" },
  "sections": {
    "profiles": { "title": "Profiles", "columns": 1, "hidden": false, "items": [{ "id": "...", "hidden": false, "icon": "", "network": "", "username": "", "website": { "url": "", "label": "" } }] },
    "experience": { "title": "Experience", "columns": 1, "hidden": false, "items": [{ "id": "...", "hidden": false, "company": "", "position": "", "location": "", "period": "", "website": { "url": "", "label": "" }, "description": "<p>...</p>", "roles": [] }] },
    "education": { "title": "Education", "columns": 1, "hidden": false, "items": [{ "id": "...", "hidden": false, "school": "", "degree": "", "area": "", "grade": "", "location": "", "period": "", "website": { "url": "", "label": "" }, "description": "" }] },
    "projects": { "title": "Projects", ... },
    "skills": { "title": "Skills", "columns": 2, "hidden": false, "items": [{ "id": "...", "hidden": false, "icon": "", "name": "", "proficiency": "", "level": 0-5, "keywords": [] }] },
    "languages": { "title": "Languages", "columns": 2, ... },
    "certifications": { ... }, "awards": { ... }, "publications": { ... },
    "volunteer": { ... }, "references": { ... }, "interests": { ... }
  },
  "customSections": [],
  "metadata": { "template": "onyx", "layout": { ... }, "css": { ... }, "page": { ... }, "design": { "colors": { "primary": "rgba(139,92,246,1)", ... }, ... }, "typography": { ... }, "notes": "" }
}`;

export const RESUME_REVISE_SYSTEM_PROMPT = `You are an expert resume editor. The user will provide their current resume data as JSON and an instruction for revision.

RULES:
- Return the COMPLETE MODIFIED ResumeData JSON (not a diff)
- ONLY modify what the instruction asks for
- Keep all existing data intact unless told to change it
- Maintain the exact same schema structure
- Use HTML formatting in description fields (<strong>, <em>, <ul><li>)
- Quantify achievements when improving descriptions
- Keep improvements realistic and professional
- Be ATS-friendly: use standard section titles, include keywords`;

export const RESUME_ATS_SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) expert. Analyze the provided resume JSON and return a structured ATS analysis.

Return a JSON object with this structure:
{
  "score": 0-100,
  "grade": "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F",
  "sections": [
    { "name": "Contact Info", "score": 0-100, "feedback": "..." },
    { "name": "Summary", "score": 0-100, "feedback": "..." },
    { "name": "Experience", "score": 0-100, "feedback": "..." },
    { "name": "Education", "score": 0-100, "feedback": "..." },
    { "name": "Skills", "score": 0-100, "feedback": "..." },
    { "name": "Keywords", "score": 0-100, "feedback": "..." },
    { "name": "Formatting", "score": 0-100, "feedback": "..." }
  ],
  "suggestions": ["...", "...", "..."],
  "missingKeywords": ["...", "..."],
  "strongPoints": ["...", "..."]
}

Analyze for:
- Keyword density and relevance
- Action verb usage
- Quantified achievements
- Standard section naming
- Contact info completeness
- Overall parsability
- Content gaps`;

// ---------------------------------------------------------------------------
// Build messages for API calls
// ---------------------------------------------------------------------------

export function buildGenerateMessages(req: ResumeGenerateRequest) {
  let userPrompt = `Generate a complete professional resume for the following:
- Target Role: ${req.targetRole}`;
  if (req.yearsExperience) userPrompt += `\n- Years of Experience: ${req.yearsExperience}`;
  if (req.industry) userPrompt += `\n- Industry: ${req.industry}`;
  if (req.keySkills?.length) userPrompt += `\n- Key Skills: ${req.keySkills.join(", ")}`;
  if (req.tone) userPrompt += `\n- Tone: ${req.tone}`;
  if (req.existingData?.basics?.name) userPrompt += `\n- Name: ${req.existingData.basics.name}`;

  if (req.existingData) {
    userPrompt += `\n\nExisting data to incorporate:\n${JSON.stringify(req.existingData, null, 2)}`;
  }

  userPrompt += "\n\nReturn ONLY the JSON object — no markdown, no explanation.";

  return [
    { role: "user" as const, content: userPrompt },
  ];
}

export function buildReviseMessages(req: ResumeRevisionRequest) {
  let userPrompt = `Here is the current resume data:\n${JSON.stringify(req.resume, null, 2)}\n\n`;
  userPrompt += `Instruction: ${req.instruction}`;
  if (req.section) userPrompt += `\n\nFocus on the "${req.section}" section.`;
  userPrompt += "\n\nReturn the COMPLETE modified resume JSON — no markdown, no explanation.";

  return [
    { role: "user" as const, content: userPrompt },
  ];
}

export function buildATSMessages(resume: ResumeData, jobDescription?: string) {
  let userPrompt = `Analyze this resume for ATS compatibility:\n${JSON.stringify(resume, null, 2)}`;
  if (jobDescription) {
    userPrompt += `\n\nTarget Job Description:\n${jobDescription}`;
  }
  userPrompt += "\n\nReturn ONLY the JSON analysis object — no markdown, no explanation.";

  return [
    { role: "user" as const, content: userPrompt },
  ];
}
