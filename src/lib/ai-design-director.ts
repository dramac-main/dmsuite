// =============================================================================
// DMSuite — AI Design Director (Enhanced)
// Utilities for making AI generate professional graphic-rich designs
// instead of just plain text. Integrates stock images, decorative graphics,
// shapes, gradients, and visual elements.
// =============================================================================

import { cleanAIText } from "./canvas-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIDesignResult {
  headline: string;
  subtext: string;
  cta?: string;
  stockImageKeywords: string[];
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
  };
  decorativeElements: string[];
  additionalContent: Record<string, unknown>;
}

export interface AIMenuResult {
  restaurantName: string;
  tagline: string;
  sections: Array<{
    name: string;
    items: Array<{
      name: string;
      description: string;
      price: string;
      imageKeyword?: string;
    }>;
  }>;
  stockImageKeywords: string[];
  ambiance: string;
}

export interface AIBusinessCardResult {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  logoDescription: string;
  colorSuggestion: { primary: string; secondary: string; bg: string };
  designElements: string[];
}

export interface AICertificateResult {
  title: string;
  subtitle: string;
  body: string;
  issuer: string;
  sealText: string;
  borderStyle: string;
  decorativeMotif: string;
}

export interface AIResumeResult {
  summary: string;
  skills: string[];
  experience: Array<{ title: string; company: string; duration: string; bullets: string[] }>;
  education: Array<{ degree: string; school: string; year: string }>;
  profilePhotoKeyword?: string;
}

// ---------------------------------------------------------------------------
// Prompt Builders — Enhanced for Graphics
// ---------------------------------------------------------------------------

/** Build a system prompt that instructs AI to think visually and suggest graphics */
export function buildVisualDesignSystemPrompt(): string {
  return `You are an elite professional graphic designer with 20+ years of experience in branding, print design, and digital media. You think in VISUALS, not just text.

CRITICAL: You must always suggest:
1. STOCK IMAGE KEYWORDS for visual elements (food photos, headshots, product shots, landscapes, etc.)
2. DECORATIVE ELEMENTS that should be drawn (geometric shapes, lines, gradients, patterns, icons)
3. COLOR HARMONY that matches the design's mood
4. VISUAL HIERARCHY through typography scale, spacing, and contrast
5. LAYOUT SUGGESTIONS for professional composition

You are NOT a text generator. You are a VISUAL DESIGNER. Every response must include imagery suggestions.
Respond in JSON format only — no markdown, no explanations outside the JSON.`;
}

/** Build prompt for graphic-rich menu design */
export function buildMenuDesignPrompt(cuisineDescription: string): string {
  return `${buildVisualDesignSystemPrompt()}

Create a complete restaurant menu design for: "${cuisineDescription}"

Include FOOD PHOTOGRAPHY keywords for each dish — the menu should look appetizing with imagery.
Suggest plating styles and food presentation keywords for stock photos.
Default location: Lusaka, Zambia. Default currency: ZMW (K).

RESPOND WITH JSON:
{
  "restaurantName": "Name",
  "tagline": "Tagline",
  "sections": [
    {
      "name": "Section Name",
      "items": [
        { "name": "Dish Name", "description": "appetizing description", "price": "K65", "imageKeyword": "grilled chicken plate" }
      ]
    }
  ],
  "stockImageKeywords": ["keyword for hero image", "keyword for ambiance shot"],
  "ambiance": "description of restaurant atmosphere for background imagery"
}`;
}

/** Build prompt for graphic-rich business card */
export function buildBusinessCardPrompt(businessInfo: string): string {
  return `${buildVisualDesignSystemPrompt()}

Design a professional business card for: "${businessInfo}"

Suggest a LOGO CONCEPT, visual design elements (gradients, geometric accents, texture overlays), 
and a color scheme that conveys professionalism and brand identity.
Default: Lusaka, Zambia. Phone: +260.

RESPOND WITH JSON:
{
  "name": "Full Name",
  "title": "Job Title", 
  "company": "Company Name",
  "email": "email@company.com",
  "phone": "+260 XXX XXX XXX",
  "website": "www.company.com",
  "address": "Address, Lusaka, Zambia",
  "logoDescription": "Description of logo visual concept",
  "colorSuggestion": { "primary": "#hex", "secondary": "#hex", "bg": "#hex" },
  "designElements": ["geometric accent line", "gradient corner", "dotted pattern overlay"]
}`;
}

/** Build prompt for graphic-rich certificate */
export function buildCertificatePrompt(eventInfo: string): string {
  return `${buildVisualDesignSystemPrompt()}

Design a professional certificate for: "${eventInfo}"

Include ornate decorative border suggestions, seal/stamp text, and visual motif ideas.
The certificate should look prestigious and worthy of framing.

RESPOND WITH JSON:
{
  "title": "Certificate Title",
  "subtitle": "Of Achievement / Completion / etc.",
  "body": "This certifies that [RECIPIENT NAME] has successfully...",
  "issuer": "Organization or institution name",
  "sealText": "CERTIFIED\\nORGANIZATION",
  "borderStyle": "gold/silver/bronze/ornate/modern",
  "decorativeMotif": "Description of decorative elements (laurels, ribbons, shields, etc.)"
}`;
}

/** Build prompt for graphic-rich resume/CV */
export function buildResumePrompt(professionalInfo: string): string {
  return `${buildVisualDesignSystemPrompt()}

Create a professional resume/CV for: "${professionalInfo}"

Include suggestions for a professional headshot photo keyword, infographic-style skill bars,
and visual layout that's both ATS-friendly and visually impressive.
Default: Lusaka, Zambia.

RESPOND WITH JSON:
{
  "summary": "Professional summary paragraph",
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "experience": [
    { "title": "Job Title", "company": "Company", "duration": "2023 - Present", "bullets": ["Achievement 1", "Achievement 2"] }
  ],
  "education": [
    { "degree": "Degree", "school": "University", "year": "2023" }
  ],
  "profilePhotoKeyword": "professional headshot business portrait"
}`;
}

/** Build prompt for any generic graphic-rich design */
export function buildGenericDesignPrompt(toolType: string, userRequest: string, dimensions: { w: number; h: number }): string {
  return `${buildVisualDesignSystemPrompt()}

Create a professional ${toolType} design for: "${userRequest}"
Canvas: ${dimensions.w}×${dimensions.h}px

RESPOND WITH JSON:
{
  "headline": "Main headline text",
  "subtext": "Supporting text",
  "cta": "Call to action text",
  "stockImageKeywords": ["keyword1", "keyword2", "keyword3"],
  "colorPalette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "bg": "#hex" },
  "decorativeElements": ["element1", "element2"],
  "additionalContent": {}
}`;
}

// ---------------------------------------------------------------------------
// AI Response Parsing
// ---------------------------------------------------------------------------

/** Parse AI JSON response with fallbacks */
export function parseAIDesignResponse<T>(raw: string): T | null {
  const cleaned = cleanAIText(raw);
  
  // Try direct JSON parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting JSON from markdown code block
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch { /* continue */ }
    }

    // Try finding JSON object in the string
    const braceMatch = cleaned.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch { /* continue */ }
    }
  }
  
  return null;
}

// ---------------------------------------------------------------------------
// Stock Image URL Helpers
// ---------------------------------------------------------------------------

/** Generate a stock image search URL for the API */
export function getStockImageSearchUrl(keyword: string, size = "regular"): string {
  return `/api/images?query=${encodeURIComponent(keyword)}&per_page=1&size=${size}`;
}

/** Fetch a single stock image URL from keyword */
export async function fetchStockImageUrl(keyword: string): Promise<string | null> {
  try {
    const res = await fetch(getStockImageSearchUrl(keyword));
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results || data.photos || [];
    if (results.length === 0) return null;
    return results[0].urls?.regular || results[0].src?.large || results[0].url || null;
  } catch {
    return null;
  }
}

/** Fetch multiple stock image URLs from keywords */
export async function fetchStockImages(keywords: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const promises = keywords.map(async (kw) => {
    const url = await fetchStockImageUrl(kw);
    if (url) map.set(kw, url);
  });
  await Promise.allSettled(promises);
  return map;
}
