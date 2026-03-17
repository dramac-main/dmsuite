// =============================================================================
// DMSuite — AI Design Generator
// Builds prompts for Claude to generate complete DesignDocumentV2 business card
// designs, parses responses, validates output, and hydrates image layers.
// =============================================================================

import type {
  DesignDocumentV2, LayerV2, LayerId, FrameLayerV2,
  TextLayerV2, ShapeLayerV2, ImageLayerV2, PathLayerV2, IconLayerV2,
  RGBA, Paint, Transform, StrokeSpec, Effect,
} from "./schema";
import {
  TEMPLATE_LIST, TEMPLATE_DEFAULT_THEMES, COLOR_PRESETS,
  MM_PX, BLEED_MM, SAFE_MM,
  cardConfigToDocument,
  type CardConfig,
} from "./business-card-adapter";
import { suggestCombination, generateCardDocument } from "./template-generator";
import type { UserDetails, LogoState, StyleSelection, BriefState } from "@/stores/business-card-wizard";

// =============================================================================
// 1.  Style Descriptions — Creative briefs for each mood direction
//     (used only by local fallback templates — AI gets full freedom)
// =============================================================================

// =============================================================================
// 2.  Template References for Each Mood
// =============================================================================

const MOOD_TEMPLATE_IDS: Record<string, string[]> = {
  "minimal-clean": ["ultra-minimal", "monogram-luxe", "geometric-mark", "frame-minimal", "split-vertical", "diagonal-mono"],
  "bold-modern": ["cyan-tech", "corporate-chevron", "zigzag-overlay", "hex-split", "dot-circle", "wave-gradient"],
  "classic-elegant": ["circle-brand", "full-color-back", "engineering-pro", "clean-accent", "nature-clean", "diamond-brand"],
  "creative-colorful": ["flowing-lines", "neon-watermark", "blueprint-tech", "skyline-silhouette", "world-map", "diagonal-gold"],
  "luxury-premium": ["luxury-divider", "social-band", "organic-pattern", "celtic-stripe", "premium-crest", "gold-construct"],
  "tech-digital": ["cyan-tech", "hex-split", "blueprint-tech", "corporate-chevron", "dot-circle", "wave-gradient"],
  "warm-organic": ["nature-clean", "organic-pattern", "flowing-lines", "clean-accent", "frame-minimal", "split-vertical"],
  "corporate-professional": ["corporate-chevron", "engineering-pro", "circle-brand", "clean-accent", "hex-split", "diamond-brand"],
};

// =============================================================================
// 3.  Icon Library Reference for Prompts
// =============================================================================

const AVAILABLE_ICON_IDS = [
  "phone", "email", "globe", "map-pin", "building",
  "linkedin", "twitter-x", "instagram", "facebook", "youtube",
  "briefcase", "calendar", "clock", "star", "heart",
  "check", "arrow-right", "download", "camera", "user",
];

// =============================================================================
// 4.  Prompt Builder
// =============================================================================

export interface GenerationInput {
  details: UserDetails;
  logo: LogoState;
  style: StyleSelection;
  /** User's free-text brief describing their brand/vision */
  brief: BriefState;
  cardWidth: number;
  cardHeight: number;
  /** Whether to generate only the front side (no back) */
  frontOnly?: boolean;
  /** Card size format key — "standard" | "eu" | "square" */
  cardSizeKey?: string;
  variantIndex?: number;
  totalVariants?: number;
}

/**
 * Build the system prompt for AI design generation.
 * This is the "creative director brief" that instructs Claude to produce
 * a valid DesignDocumentV2 JSON structure.
 */
export function buildDesignGenerationPrompt(input: GenerationInput): {
  systemPrompt: string;
  userMessage: string;
} {
  const { details, logo, brief, cardWidth, cardHeight, frontOnly, cardSizeKey } = input;
  const safeMargin = Math.round(SAFE_MM * MM_PX); // ~59px

  // Infer brand personality from title/company AND brief text
  const brandContext = inferBrandContext(details, brief.description);

  const isFrontOnly = frontOnly || brief.frontOnly;
  const isSquare = cardSizeKey === "square" || cardWidth === cardHeight;
  const cardFormatLabel = cardSizeKey === "eu" ? "EU/ISO standard (85×54mm)" : isSquare ? "Square format (2.5×2.5\")" : "US standard (3.5×2\")";

  // ---------------------------------------------------------------------------
  // SYSTEM PROMPT — restructured for creative freedom
  // ---------------------------------------------------------------------------
  const systemPrompt = `You are an elite graphic designer with 20 years of experience creating award-winning business cards. Return ONLY valid JSON — no markdown, no explanation, no commentary.

RESPONSE FORMAT: ${isFrontOnly ? '{"front":{DesignDocumentV2}}' : '{"front":{DesignDocumentV2},"back":{DesignDocumentV2}}'}

## Canvas
${cardWidth}×${cardHeight}px at 300 DPI (${cardFormatLabel}). Safe area: ${safeMargin}px inset from each edge. All text must fit inside the safe area. children array: first element = behind (background), last element = on top.${isSquare ? " This is a SQUARE card — composition should use the equal width/height to your advantage. Centered and symmetric layouts work especially well." : ""}

## Design Philosophy — CRITICAL
Study how REAL professional business cards look from top print design firms. The vast majority of premium business cards use:
- **Clean white or light-colored backgrounds** — this is the standard for 80%+ of real business cards. White backgrounds look professional, print perfectly, and make text highly readable.
- **Minimal decorative elements** — professional cards do NOT have busy geometric patterns, overlapping circles, or diagonal slashes everywhere. They use whitespace, clean typography, and maybe ONE subtle accent element.
- **The person's NAME as the hero** — large, clear, well-spaced. The name and title should be instantly readable.
- **Tasteful color usage** — 1-3 brand colors used strategically, not splattered across the entire card. Often just the text and a subtle accent line or bar.

Do NOT add excessive geometric shapes. Think: Apple, law firm, architect, premium agency — clean, confident, professional.

**EXCEPTION — Dark Premium Cards:** For tech, creative, or luxury brands, a dark background (charcoal #1a1a1a, navy #0a1628, or near-black #141414) with ONE bright accent color CAN produce stunning results — but ONLY when done with restraint: minimal elements, generous whitespace, crisp typography, and the accent color used sparingly (a divider line, icon tint, or subtle highlight — not splashed everywhere). The key: dark premium cards succeed when 90% of the design is quiet and 10% pops. If the brief suggests a modern/tech/creative identity, this IS a valid approach.

## Available Fonts — ONLY USE THESE
You MUST use one of these font stacks. Do NOT invent font names.
- Modern (sans-serif): "Inter, sans-serif"
- Classic (serif): "Georgia, serif"
- Bold (display sans): "Montserrat, sans-serif"
- Elegant (display serif): "Playfair Display, serif"
- Minimal (neutral sans): "Helvetica Neue, sans-serif"
Pick ONE primary font for headings and ONE for body/contact text. Both must be from this list.

## Element Sizing Guide (at 300 DPI)
- **Name**: 32–48px, font-weight 600–700. This is the HERO — largest text on the card.
- **Title/Position**: 14–20px, font-weight 400–500. Clearly readable but subordinate to name.
- **Company name**: 12–18px, font-weight 500–600. Use letter-spacing 2–6 for elegance (higher values for UPPERCASE).
- **Tagline**: 10–14px, font-weight 300–400, italic or light. Subtle, under the company name or as a divider.
- **Contact text** (email, phone, web, address): 10–13px, font-weight 400. Consistent size across all contacts.
- **Contact icons**: 14–18px wide/tall. Placed left of each contact line with 6–8px gap.
- **Social handles**: 9–12px, font-weight 400. Grouped together, same size.
- **Accent shapes** (lines, bars, borders): 1–3px stroke width for lines, 4–12px height for bars.

## Premium Design Techniques
These subtle techniques separate amateur cards from professional ones. Use 1–2 per card — never all at once:
- **Watermark / Ghost Logo**: Place a large, semi-transparent version of the logo or a brand shape as a background element. Use opacity 0.03–0.06 (nearly invisible). Size it 40–60% of the card width. Position it offset to one side or corner. This adds depth and sophistication without competing with readable content.
- **Subtle Background Pattern**: A very low-opacity (0.03–0.06) geometric or textural pattern across part of the card adds richness. Keep it covering only 40–60% of the card area, not the full surface. Think: fine grid lines, circuit traces for tech, thin diagonal lines, or subtle dot patterns.
- **Accent Divider Bar**: A small colored bar (40–60px wide × 2–3px tall, or 2–3px wide × 30–50px tall) in the brand accent color placed between the name section and contact section. This tiny element creates powerful visual hierarchy.
- **Mixed-Weight Name Typography**: Instead of uniform weight, try: lighter/italic first name (weight 300–400, italic) + bold last name (weight 600–700). Or: regular weight first name + ALL CAPS bold last name. This creates a memorable, editorial feel.
- **Letter-Spacing for Brand Identity**: Company names and titles in UPPERCASE benefit from generous letter-spacing (3–6px). This creates a premium, spaced-out look often seen in luxury, tech, and architecture branding.

## Icon-to-Contact Mapping
When adding contact details, pair each with the correct icon layer:
- Phone → iconId: "phone"
- Email → iconId: "email"
- Website → iconId: "globe"
- Address → iconId: "map-pin"
- LinkedIn → iconId: "linkedin"
- Twitter/X → iconId: "twitter-x"
- Instagram → iconId: "instagram"
- Company/Office → iconId: "building"
Align each icon vertically centered with its contact text line.

## Creative Freedom
You have creative freedom over composition, layout, typography choices, and element placement. But that freedom should produce something a REAL client would print and hand out — not an over-designed dark-themed digital mock-up.

The ONLY constraints are:
1. All text must be inside the safe area (${safeMargin}px inset)
2. The person's name must be the most prominent text element on the front
3. The JSON must conform to the schema below
4. Use only the listed icon IDs for icon layers
5. Text fill colors must contrast with the background (dark bg → light text, light bg → dark text)
6. Use ONLY the font stacks listed above — do not use any other font names
${isFrontOnly
  ? `7. **FRONT-ONLY CARD:** The user wants ONLY a front side. Put EVERYTHING on this one card: name (most prominent), title, company, logo, contact details, and any branding elements. Balance the composition so it doesn't feel crowded — prioritize the most important contact info. Include a small-to-medium logo placement (not dominating). Do NOT generate a back card.`
  : `7. **TRADITIONAL BUSINESS CARD CONVENTION — CRITICAL:**
   - **FRONT CARD** = ALL contact information goes here. Name (most prominent), title, company, phone, email, website, address, social media — ALL on the front. This is how real business cards work at print shops worldwide.
   - **BACK CARD** = Brand identity showcase. Design approaches for the back:
     • **Solid brand-color background** with the logo centered in white/contrasting color — bold, clean, memorable
     • **White/light background** with large logo centered and subtle brand-color accents
     • **Dark background** with brand-color logo and company name — premium feel
     Add company name (can be large), tagline if provided. Consider adding: a repeating watermark pattern of the logo at 3–5% opacity for texture, a website URL at the bottom edge, and a QR code placeholder shape (60×60px square). The back should feel like the "reveal" — when someone flips the card, they get the brand identity moment. If no logo, use a bold typographic monogram or an artistic branding element.
   - NEVER put contact details on the back. NEVER put the logo as the primary element on the front (small logo on front is OK as an accent).`}
8. **LOGO COLORS ARE BRAND COLORS** — If logo colors are provided, those ARE the company's brand colors. You MUST use them as your primary palette. Build the entire design around those colors. Do not invent unrelated colors.

## DESIGN APPROACH
Each card should feel hand-crafted for this specific person and industry. Consider:
- What background works best for this industry? (Most industries: white/cream. Creative: maybe a bold color. Luxury: maybe black or deep navy.)
- What would this person actually print and proudly hand out?
- Is the design clean enough that a print shop would produce it without issues?
- Would a design director approve this for a real client?

## DESIGN VARIETY — CRITICAL
Each card MUST have a completely different visual approach. Vary ALL of these:
- **Layout**: Try centered, asymmetric, edge-aligned, bottom-heavy, split-panel, or minimal placements
- **Background**: WHITE is perfectly fine and often best. Also try: light gray, cream, pale tints of brand colors, or occasionally dark for specific industries
- **Typography**: Vary sizes within the sizing guide above, mix weights, use letter-spacing creatively, try uppercase vs mixed-case
- **Decorative elements**: LESS IS MORE. A single accent line, a subtle color bar, a thin border — not busy geometric patterns
- **Color strategy**: Use logo/brand colors as the foundation. Monochrome with one accent, brand colors on white, or tonal variations
- **Composition**: The name does NOT have to be left-aligned — try centered, right-aligned, bottom-positioned

## Layout Inspiration (do NOT repeat — pick a DIFFERENT approach each time)${isSquare ? `
A) Centered stack — name large and centered, title below, contact block centered beneath a thin divider, generous padding all around
B) Quadrant — name/title in upper-left quadrant, contact details in lower-right, diagonal visual balance
C) Circular focus — centered circular accent shape or border, text arranged around or inside it
D) Top-heavy — name and branding in the top 60%, contact details compact at bottom
E) Corner anchored — name in one corner, contact cluster in opposite corner, accent line connecting them
F) Full center — everything centered vertically and horizontally, maximally symmetric and elegant
G) Bordered square — inset border creating a framed effect, text centered within
H) Split horizontal — top half for identity (name, title, company), bottom half for contacts, thin divider
I) Minimal square — extreme whitespace, tiny elegant text cluster in center, nothing else
J) Asymmetric — text cluster offset to one side, bold color accent on the opposite side
K) Dark premium square — dark charcoal (#141414) background, name centered in white, bright accent color for divider and icon tints, watermark logo at 3–5% opacity filling the background. Tech/creative feel.
L) Layered depth square — light background with large ghost shape (3–5% opacity) behind text, accent divider bar, contacts in a 2×2 grid at bottom, generous padding all around` : `
A) Classic centered — name and title centered, contact info below, thin accent line divider, clean white background
B) Left-aligned modern — all text left-aligned with generous whitespace, single color bar on left edge
C) Right-weighted — text cluster on right side, subtle brand color accent on left margin
D) Minimalist — maximum whitespace, small elegant text cluster, name in one corner, contact in opposite corner
E) Horizontal divide — clean line or thin bar separating name/title area from contact details
F) Two-column — name and title on left, contact details on right, clean separation
G) Bottom-anchored — name large at top, all contact details grouped neatly at bottom
H) Bordered elegance — thin border rectangle inset from edges, text centered inside the frame
I) Color accent — mostly white/light with one bold brand-color element (sidebar, top bar, or bottom strip)
J) Premium minimal — just name, title, company, and essential contacts — nothing else, maximum elegance
K) Dark premium — dark charcoal or near-black background (#141414) with one bright accent color. Name in white/light, contacts in light gray, thin accent-colored divider bar between name and contacts. Optional: watermark logo at 3–5% opacity as a large background element. Ideal for tech, creative, and luxury brands.
L) Layered depth — white/light background with a large watermark shape or logo ghost (3–5% opacity) behind the main text. Creates visual depth without clutter. Accent bar or thin color strip along one edge. 2×2 contact grid in the lower portion.`}

## Layer Types
- **text**: text, defaultStyle:{fontFamily,fontSize,fontWeight,italic:false,underline:false,strikethrough:false,letterSpacing,lineHeight,fill:{kind:"solid",color:{r,g,b,a}},uppercase}, runs:[], paragraphs:[{align,indent:0,spaceBefore:0,spaceAfter:0}], overflow:"clip", verticalAlign:"top"
- **shape**: shapeType("rectangle"|"ellipse"|"polygon"|"star"), fills[Paint], strokes[{paint:Paint,width:N,align:"center",dash:[],cap:"butt",join:"miter",miterLimit:10}], cornerRadii[N,N,N,N], sides:4, innerRadiusRatio:1
- **image**: imageRef("LOGO_URL"), fit:"contain", focalPoint:{x:0.5,y:0.5}, cropRect:{x:0,y:0,w:1,h:1}, imageFilters:{brightness:0,contrast:0,saturation:0,temperature:0,blur:0,grayscale:false,sepia:false}, fills:[], strokes:[], cornerRadius:0
- **icon**: iconId(string), color:{r,g,b,a}, strokeWidth:1.5
- **path**: geometry:{commands:[{type:"M"|"L"|"C"|"Q"|"Z",x,y,...}],fillRule:"nonzero",closed:bool}, fills[Paint], strokes[StrokeSpec]

Every layer base: id, type, name, tags[], parentId:"root-frame"|"back-root", transform:{position:{x,y},size:{x,y},rotation:0,skewX:0,skewY:0,pivot:{x:0.5,y:0.5}}, opacity:1, blendMode:"normal", visible:true, locked:false, effects:[], constraints:{horizontal:"left",vertical:"top"}

Paint: {"kind":"solid","color":{"r":N,"g":N,"b":N,"a":N}} or {"kind":"gradient","gradientType":"linear","stops":[{"offset":0,"color":{...}},{"offset":1,"color":{...}}],"transform":[1,0,0,1,0,0],"spread":"pad"}

Available icons: ${AVAILABLE_ICON_IDS.join(", ")}
Tags: name, title, company, tagline, contact-text, contact-icon, logo, accent, background, decorative

## Compact JSON Skeleton (shows format only — do NOT copy this design)
{"front":{"id":"front-card","version":2,"name":"Front","toolId":"business-card","rootFrameId":"root-frame","layersById":{"root-frame":{"id":"root-frame","type":"frame","name":"Card","tags":["background","root-frame"],"parentId":null,"transform":{"position":{"x":0,"y":0},"size":{"x":${cardWidth},"y":${cardHeight}},"rotation":0,"skewX":0,"skewY":0,"pivot":{"x":0.5,"y":0.5}},"opacity":1,"blendMode":"normal","visible":true,"locked":false,"effects":[],"constraints":{"horizontal":"left","vertical":"top"},"fills":[YOUR_BG_FILL],"strokes":[],"cornerRadii":[0,0,0,0],"clipContent":true,"children":["...list all child layer ids..."],"bleedMm":${BLEED_MM},"safeAreaMm":${SAFE_MM},"guides":[]}},"selection":[],"resources":[],"meta":{"dpi":300,"units":"px"}}${
  isFrontOnly
    ? "}"
    : `,"back":{"id":"back-card","version":2,"name":"Back","toolId":"business-card","rootFrameId":"back-root","layersById":{"back-root":{"id":"back-root","type":"frame","name":"Card Back","tags":["background","root-frame"],"parentId":null,"transform":{"position":{"x":0,"y":0},"size":{"x":${cardWidth},"y":${cardHeight}},"rotation":0,"skewX":0,"skewY":0,"pivot":{"x":0.5,"y":0.5}},"opacity":1,"blendMode":"normal","visible":true,"locked":false,"effects":[],"constraints":{"horizontal":"left","vertical":"top"},"fills":[YOUR_BG_FILL],"strokes":[],"cornerRadii":[0,0,0,0],"clipContent":true,"children":["...list all child layer ids..."],"bleedMm":${BLEED_MM},"safeAreaMm":${SAFE_MM},"guides":[]}},"selection":[],"resources":[],"meta":{"dpi":300,"units":"px"}}}`
}

The skeleton above shows ONLY the root frames. You MUST add 4-8 child layers ${isFrontOnly ? "on the front" : "per side"} (text, shape, icon, path layers) with your own creative positions, sizes, colors, and composition. Every child layer id must appear in the parent frame's children array.${isFrontOnly ? " Do NOT include a back card in your response." : ""}`;

  // ---------------------------------------------------------------------------
  // USER MESSAGE — brand context + style direction + creative brief
  // ---------------------------------------------------------------------------
  // Build structured contact lines with explicit icon IDs for the AI
  const contactEntries: { label: string; value: string; iconId: string }[] = [];
  if (details.phone) contactEntries.push({ label: "Phone", value: details.phone, iconId: "phone" });
  if (details.email) contactEntries.push({ label: "Email", value: details.email, iconId: "email" });
  if (details.website) contactEntries.push({ label: "Website", value: details.website, iconId: "globe" });
  if (details.address) contactEntries.push({ label: "Address", value: details.address, iconId: "map-pin" });
  if (details.linkedin) contactEntries.push({ label: "LinkedIn", value: details.linkedin, iconId: "linkedin" });
  if (details.twitter) contactEntries.push({ label: "Twitter/X", value: details.twitter, iconId: "twitter-x" });
  if (details.instagram) contactEntries.push({ label: "Instagram", value: details.instagram, iconId: "instagram" });

  const hasContact = contactEntries.length > 0;
  const contactCount = contactEntries.length;

  // Pick a random layout seed letter (A-J) to nudge diversity across generations
  const layoutSeeds = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const variantSeed = input.variantIndex !== undefined
    ? layoutSeeds[input.variantIndex % layoutSeeds.length]
    : layoutSeeds[Math.floor(Math.random() * layoutSeeds.length)];

  const userMessage = `## The Person
Name: ${details.name || "John Smith"}
Title: ${details.title || "Creative Director"}
Company: ${details.company || "Design Studio"}
${details.tagline ? `Tagline: "${details.tagline}"` : ""}

${brandContext}

## Logo
${logo.logoUrl
    ? isFrontOnly
      ? `A logo image is provided. Include it on the front card as a medium-sized element — create an image layer with imageRef:"LOGO_URL" and tag "logo". Balance it with the contact info — don't let it dominate, but give it a clear, intentional placement.${
        logo.logoColors.length > 0
          ? `\n\n**LOGO COLORS (these are the brand colors — USE THEM):** ${logo.logoColors.join(", ")}\nThese colors were extracted directly from the logo. They ARE the company's brand identity. Build your entire color palette around these colors. Use them for text accents, background tints, divider lines, and decorative elements. Do NOT invent unrelated colors like purple or teal if the logo is green and blue.`
          : ""
      }`
      : `A logo image is provided. Use it as the HERO element on the BACK card — create an image layer with imageRef:"LOGO_URL" and tag "logo". On the front, you may include a small version as an accent, but the back should showcase it prominently.${
        logo.logoColors.length > 0
          ? `\n\n**LOGO COLORS (these are the brand colors — USE THEM):** ${logo.logoColors.join(", ")}\nThese colors were extracted directly from the logo. They ARE the company's brand identity. Build your entire color palette around these colors. Use them for text accents, background tints, divider lines, and decorative elements. Do NOT invent unrelated colors like purple or teal if the logo is green and blue.`
          : ""
      }`
    : isFrontOnly
      ? `No logo provided. You may include a small typographic monogram${details.company ? ` using the initials "${getInitials(details.company)}"` : ""} as a subtle branding accent on the front.`
      : `No logo provided. For the back card, create a bold typographic monogram${details.company ? ` using the initials "${getInitials(details.company)}"` : ""}, a striking brand mark, or an artistic typographic treatment. The back should be a memorable brand identity element.`}

## Company & Industry Context
${brief.companyDescription
    ? `"${brief.companyDescription}"\nUse this to understand the industry, clientele, and appropriate design tone.`
    : brief.description
      ? `The user's brief may contain company context — extract any industry or business clues from it. Otherwise infer from the title "${details.title || "Professional"}" and company "${details.company || "Company"}".`
      : `No company description provided. Infer the appropriate industry feel from the title "${details.title || "Professional"}" and company "${details.company || "Company"}".`}

## Creative Brief
${brief.description
    ? `The user describes their vision: "${brief.description}"\n\nUse this as your primary creative direction — it may contain both company context AND style preferences. Interpret it freely and bring your own design expertise.`
    : "No specific direction given. Design a clean, professional card that this person would proudly hand out. Think about what's appropriate for their industry."}

## Tagline Placement
${details.tagline
    ? `The user has a tagline: "${details.tagline}". Include it as a subtle text element — typically below the company name on the front, or as a prominent element on the back card. Use a smaller, lighter font (10-14px, weight 300-400). Consider using italic or letter-spacing for elegance.`
    : "No tagline provided — skip this element."}

## Color & Typography
${logo.logoColors.length > 0
    ? `USE THE LOGO COLORS as your primary palette: ${logo.logoColors.join(", ")}. Build the entire design around these brand colors. For backgrounds, white or very light tints of these colors work best. For text, use dark gray (#1a1a1a to #333333) or one of the brand colors for accents.`
    : `Choose colors appropriate for this person's industry and role. When in doubt, use a white background with dark text and one sophisticated accent color. Do NOT default to dark backgrounds with neon colors.`}

Choose fonts from the whitelist above. Recommended pairings:
- Tech/startup/modern: "Inter, sans-serif" for everything, or "Helvetica Neue, sans-serif" for headings + "Inter, sans-serif" for body
- Law/finance/luxury: "Playfair Display, serif" for name + "Inter, sans-serif" for contacts
- Creative/agency: "Montserrat, sans-serif" for headings + "Inter, sans-serif" for body
- Classic/traditional: "Georgia, serif" for name + "Inter, sans-serif" for contacts
- Minimal/clean: "Helvetica Neue, sans-serif" for everything

## Contact Details (FRONT card — all contact info goes here)
${hasContact
    ? contactEntries.map(c => `- ${c.label}: ${c.value} → use iconId: "${c.iconId}"`).join("\n") + `\n\n${contactCount} contact fields total.${contactCount >= 6 ? " This is a LOT of info — use compact 9-11px text, tight 18-22px line spacing, and consider a two-column layout for contacts." : contactCount >= 4 ? " Use 10-13px text with 20-24px line spacing. Consider a two-column (2×2) contact grid for visual balance, or a single column grouped in the lower or right portion." : " With few contacts, you have plenty of space — use generous spacing and larger contact text (12-14px)."}\nFor each contact, create an icon layer (14-16px) aligned left of the text with a 6-8px gap. Group all contacts together in a visually clean block.`
    : "No contact details provided — feature name, title, and company prominently on the front."}

${isFrontOnly
    ? ""
    : `## Back Card Direction
The back card is the BRAND IDENTITY moment — when someone flips the card, they should be impressed. Design it as a visual statement:
- Feature the logo (or monogram) LARGE and centered — this is the hero element
- Include company name prominently, and tagline if provided
- Consider a bold approach: solid brand-color background with logo in white/contrasting color
- Add depth: a repeating watermark pattern of the logo at 3–5% opacity, or a subtle background texture
- Optionally include a website URL (small, bottom edge) or a QR code placeholder (60×60px square)
- No contact information on the back — EVER
Keep it clean, bold, and visually impactful.${logo.logoColors.length > 0 ? ` Use the brand colors from the logo as the back card's primary palette — a solid brand-color background with white/light elements is a powerful approach.` : ""}
`}
## Layout Approach
Use layout inspiration "${variantSeed}" from the system prompt as your starting point — then make it YOUR OWN. Remember: white/light backgrounds are perfectly fine and often the most professional choice. If using a dark background, keep it CLEAN and MINIMAL — no busy patterns. Use the Premium Design Techniques from the system prompt for sophistication.

Create one exceptional, print-ready business card.${isFrontOnly ? " Design only the front side — do NOT include a back card." : " Both sides should feel like a cohesive, matched set — same color palette and visual language."}`;

  return { systemPrompt, userMessage };
}

// =============================================================================
// 5.  Response Parser & Validator
// =============================================================================

/**
 * Attempt to repair truncated JSON (e.g. from max_tokens cutoff).
 * Strips incomplete trailing values then closes all open brackets/braces.
 */
function repairTruncatedJson(json: string): string | null {
  // Must start with { to be a JSON object
  if (!json.trim().startsWith("{")) return null;

  let s = json.trim();

  // Strip any trailing incomplete string (unmatched quote)
  // Count quotes — if odd number, we're inside an unterminated string
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

  // If we ended inside a string, truncate to last complete position
  if (inString) {
    s = s.slice(0, lastCompletePos);
  }

  // Strip trailing comma or colon (incomplete key-value)
  s = s.replace(/[,:\s]+$/, "");

  // Strip any trailing incomplete value (number, true, false, null fragments)
  s = s.replace(/[,:\s]+([\w.+\-]+)$/, "");

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

  // Only repair if we have unclosed structures
  if (braces <= 0 && brackets <= 0) return null;

  // Close all open brackets then braces
  while (brackets > 0) { s += "]"; brackets--; }
  while (braces > 0) { s += "}"; braces--; }

  return s;
}

/**
 * Parse a single DesignDocumentV2 from a parsed JSON object.
 */
function parseSingleDoc(parsed: Record<string, unknown>, defaultName: string): {
  doc: DesignDocumentV2 | null;
  error: string | null;
} {
  // Validate required top-level fields
  if (!parsed.rootFrameId || typeof parsed.rootFrameId !== "string") {
    return { doc: null, error: "Missing rootFrameId" };
  }
  if (!parsed.layersById || typeof parsed.layersById !== "object") {
    return { doc: null, error: "Missing layersById" };
  }

  const layersById = parsed.layersById as Record<string, Record<string, unknown>>;
  const rootFrameId = parsed.rootFrameId as string;
  if (!layersById[rootFrameId]) {
    return { doc: null, error: `Root frame "${rootFrameId}" not found in layersById` };
  }

  const repairedLayers: Record<string, LayerV2> = {};
  const errors: string[] = [];

  for (const [id, layer] of Object.entries(layersById)) {
    try {
      const repaired = repairLayer(id, layer as Record<string, unknown>);
      repairedLayers[id] = repaired;
    } catch (e) {
      errors.push(`Layer "${id}": ${(e as Error).message}`);
    }
  }

  if (!repairedLayers[rootFrameId]) {
    return { doc: null, error: `Root frame could not be repaired: ${errors.join("; ")}` };
  }

  const rootFrame = repairedLayers[rootFrameId] as FrameLayerV2;
  if (rootFrame.children) {
    rootFrame.children = rootFrame.children.filter((childId: string) => {
      if (!repairedLayers[childId]) {
        errors.push(`Child "${childId}" referenced but not in layersById — removed`);
        return false;
      }
      return true;
    });
  }

  const doc: DesignDocumentV2 = {
    id: (parsed.id as string) || `card-${Date.now()}`,
    version: 2,
    name: (parsed.name as string) || defaultName,
    toolId: "business-card",
    rootFrameId,
    layersById: repairedLayers as Record<LayerId, LayerV2>,
    selection: { ids: [], primaryId: null },
    resources: [],
    meta: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dpi: 300,
      units: "px",
      ...(parsed.meta as Record<string, unknown> || {}),
    },
  };

  return { doc, error: errors.length > 0 ? `Repaired ${errors.length} issues: ${errors.slice(0, 3).join("; ")}` : null };
}

/**
 * Extract JSON string from raw AI text, handling markdown code blocks, preamble, etc.
 */
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

  return jsonStr;
}

/**
 * Safely parse JSON, with truncation repair on failure.
 */
function safeParseJson(jsonStr: string): { parsed: Record<string, unknown> | null; error: string | null } {
  try {
    return { parsed: JSON.parse(jsonStr), error: null };
  } catch (e) {
    const repaired = repairTruncatedJson(jsonStr);
    if (repaired) {
      try {
        console.warn("[AI Generator] Repaired truncated JSON successfully");
        return { parsed: JSON.parse(repaired), error: null };
      } catch {
        return { parsed: null, error: `Failed to parse JSON: ${(e as Error).message}` };
      }
    }
    return { parsed: null, error: `Failed to parse JSON: ${(e as Error).message}` };
  }
}

/**
 * Parse the raw AI response string and return front (and optionally back) DesignDocumentV2.
 * Handles the {"front": {...}, "back": {...}} envelope format as well as legacy single-doc format.
 */
export function parseDesignResponse(raw: string): {
  doc: DesignDocumentV2 | null;
  backDoc: DesignDocumentV2 | null;
  error: string | null;
} {
  const jsonStr = extractJsonString(raw);
  const { parsed, error: parseError } = safeParseJson(jsonStr);

  if (!parsed) {
    return { doc: null, backDoc: null, error: parseError };
  }

  // Check if this is the {"front": {...}, "back": {...}} envelope
  if (parsed.front && typeof parsed.front === "object" && (parsed.front as Record<string, unknown>).layersById) {
    const frontResult = parseSingleDoc(parsed.front as Record<string, unknown>, "Business Card - Front");
    let backResult: { doc: DesignDocumentV2 | null; error: string | null } = { doc: null, error: null };

    if (parsed.back && typeof parsed.back === "object" && (parsed.back as Record<string, unknown>).layersById) {
      backResult = parseSingleDoc(parsed.back as Record<string, unknown>, "Business Card - Back");
    }

    const combinedErrors = [frontResult.error, backResult.error].filter(Boolean).join("; ");
    return {
      doc: frontResult.doc,
      backDoc: backResult.doc,
      error: combinedErrors || null,
    };
  }

  // Legacy single-document format (no envelope)
  const result = parseSingleDoc(parsed, "AI Generated Business Card");
  return { doc: result.doc, backDoc: null, error: result.error };
}

// =============================================================================
// 5b.  Post-Parse Document Validation & Fixup
// =============================================================================

/**
 * Validate a parsed document and fix common AI mistakes:
 * - Text layers with 0-size transforms
 * - Elements positioned completely off-canvas
 * - Missing text fill colors (would be invisible)
 * - Ensure children order is correct (background first, text last)
 */
function validateAndFixDocument(doc: DesignDocumentV2): void {
  const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2;
  if (!rootFrame) return;

  const cardW = rootFrame.transform.size.x;
  const cardH = rootFrame.transform.size.y;

  // Determine background luminance for contrast checking
  const bgFill = rootFrame.fills?.[0];
  let bgLum = 0.1; // assume dark by default
  if (bgFill?.kind === "solid") {
    const c = bgFill.color;
    bgLum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  } else if (bgFill?.kind === "gradient") {
    // Estimate from first stop
    const firstStop = (bgFill as { stops?: Array<{ color: RGBA }> }).stops?.[0]?.color;
    if (firstStop) bgLum = (0.299 * firstStop.r + 0.587 * firstStop.g + 0.114 * firstStop.b) / 255;
  }

  for (const layer of Object.values(doc.layersById)) {
    if (layer.id === doc.rootFrameId) continue;

    // Fix text layers
    if (layer.type === "text") {
      const textLayer = layer as TextLayerV2;

      // Ensure text has valid size (AI sometimes makes text 0-width)
      if (textLayer.transform.size.x < 50) {
        textLayer.transform.size.x = Math.min(400, cardW - textLayer.transform.position.x - 40);
      }
      // Ensure height is at least enough for the font
      const minH = (textLayer.defaultStyle?.fontSize ?? 16) * 1.8;
      if (textLayer.transform.size.y < minH) {
        textLayer.transform.size.y = minH;
      }

      // Clamp position to be on-canvas
      if (textLayer.transform.position.x < 0) textLayer.transform.position.x = 40;
      if (textLayer.transform.position.y < 0) textLayer.transform.position.y = 40;
      if (textLayer.transform.position.x > cardW - 20) textLayer.transform.position.x = cardW / 2;
      if (textLayer.transform.position.y > cardH - 20) textLayer.transform.position.y = cardH / 2;

      // Ensure text has a visible fill with adequate contrast
      if (textLayer.defaultStyle) {
        if (!textLayer.defaultStyle.fill) {
          // Default fill based on background luminance
          textLayer.defaultStyle.fill = bgLum < 0.5
            ? { kind: "solid", color: { r: 255, g: 255, b: 255, a: 1 } }
            : { kind: "solid", color: { r: 20, g: 20, b: 30, a: 1 } };
        } else if (textLayer.defaultStyle.fill.kind === "solid") {
          // Check if text color has adequate contrast against background
          const tc = textLayer.defaultStyle.fill.color;
          const textLum = (0.299 * tc.r + 0.587 * tc.g + 0.114 * tc.b) / 255;
          const contrastRatio = Math.abs(textLum - bgLum);
          // If contrast is too low (< 0.25), flip to high-contrast color
          if (contrastRatio < 0.25 && tc.a > 0.5) {
            textLayer.defaultStyle.fill = bgLum < 0.5
              ? { kind: "solid", color: { r: 255, g: 255, b: 255, a: 1 } }
              : { kind: "solid", color: { r: 20, g: 20, b: 30, a: 1 } };
          }
        }

        if (!textLayer.defaultStyle.fontSize || textLayer.defaultStyle.fontSize < 6) {
          textLayer.defaultStyle.fontSize = 14;
        }
        if (!textLayer.defaultStyle.fontFamily) {
          textLayer.defaultStyle.fontFamily = "Inter, sans-serif";
        }
      }
    }

    // Fix shape/path layers with 0-size
    if (layer.type === "shape" || layer.type === "path") {
      if (layer.transform.size.x < 1) layer.transform.size.x = 50;
      if (layer.transform.size.y < 1) layer.transform.size.y = 50;
    }

    // Fix icon layers — validate iconId exists, ensure minimum size
    if (layer.type === "icon") {
      const iconLayer = layer as IconLayerV2;
      // Remap common AI mistakes to valid IDs
      const ICON_ALIASES: Record<string, string> = {
        "external-link": "globe",
        "share": "arrow-right",
        "mail": "email",
        "location": "map-pin",
        "twitter": "twitter-x",
        "x": "twitter-x",
        "tel": "phone",
        "call": "phone",
        "web": "globe",
        "website": "globe",
        "address": "map-pin",
        "link": "globe",
        "company": "building",
        "work": "briefcase",
        "schedule": "calendar",
        "time": "clock",
        "like": "heart",
        "favorite": "star",
        "person": "user",
        "profile": "user",
      };
      if (ICON_ALIASES[iconLayer.iconId]) {
        iconLayer.iconId = ICON_ALIASES[iconLayer.iconId];
      }
      // Ensure minimum icon size
      if (iconLayer.transform.size.x < 10) iconLayer.transform.size.x = 16;
      if (iconLayer.transform.size.y < 10) iconLayer.transform.size.y = 16;
    }
  }

  // Ensure children order has text layers AFTER shape/image layers (text on top)
  if (rootFrame.children && rootFrame.children.length > 1) {
    const bgIds: string[] = [];
    const shapeIds: string[] = [];
    const textIds: string[] = [];
    const otherIds: string[] = [];

    for (const childId of rootFrame.children) {
      const layer = doc.layersById[childId];
      if (!layer) continue;
      if (layer.tags?.includes("background") || layer.tags?.includes("pattern")) {
        bgIds.push(childId);
      } else if (layer.type === "text" || layer.type === "icon") {
        textIds.push(childId);
      } else if (layer.type === "shape" || layer.type === "path" || layer.type === "image") {
        shapeIds.push(childId);
      } else {
        otherIds.push(childId);
      }
    }

    // Rebuild: backgrounds first (behind), then shapes, then other, then text (on top)
    rootFrame.children = [...bgIds, ...shapeIds, ...otherIds, ...textIds];
  }
}

/**
 * Repair a single layer — fill in missing defaults, clamp values, fix types.
 */
function repairLayer(id: string, raw: Record<string, unknown>): LayerV2 {
  const type = raw.type as string;
  if (!type || !["text", "shape", "image", "frame", "path", "icon", "boolean-group", "group"].includes(type)) {
    throw new Error(`Invalid layer type: ${type}`);
  }

  // Build base layer properties
  const transform = repairTransform(raw.transform as Record<string, unknown> | undefined);

  const base = {
    id,
    type,
    name: (raw.name as string) || id,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t: unknown) => typeof t === "string") : [],
    parentId: (raw.parentId as string) ?? null,
    transform,
    opacity: clamp(typeof raw.opacity === "number" ? raw.opacity : 1, 0, 1),
    blendMode: (raw.blendMode as string) || "normal",
    visible: raw.visible !== false,
    locked: raw.locked === true,
    effects: Array.isArray(raw.effects) ? raw.effects.map(repairEffect) : [],
    constraints: (raw.constraints as { horizontal: string; vertical: string }) || { horizontal: "left", vertical: "top" },
  };

  switch (type) {
    case "text":
      return {
        ...base,
        text: (raw.text as string) || "",
        defaultStyle: repairTextStyle(raw.defaultStyle as Record<string, unknown> | undefined),
        runs: Array.isArray(raw.runs) ? raw.runs : [],
        paragraphs: Array.isArray(raw.paragraphs) && raw.paragraphs.length > 0
          ? raw.paragraphs
          : [{ align: "left", indent: 0, spaceBefore: 0, spaceAfter: 0 }],
        overflow: (raw.overflow as string) || "clip",
        verticalAlign: (raw.verticalAlign as string) || "top",
      } as TextLayerV2;

    case "shape":
      return {
        ...base,
        shapeType: (raw.shapeType as string) || "rectangle",
        fills: Array.isArray(raw.fills) ? raw.fills.map(repairPaint) : [],
        strokes: repairStrokes(raw.strokes),
        cornerRadii: repairCornerRadii(raw.cornerRadii),
        sides: typeof raw.sides === "number" ? raw.sides : 4,
        innerRadiusRatio: typeof raw.innerRadiusRatio === "number" ? raw.innerRadiusRatio : 0.5,
      } as ShapeLayerV2;

    case "image":
      return {
        ...base,
        imageRef: (raw.imageRef as string) || "",
        fit: (raw.fit as string) || "contain",
        focalPoint: (raw.focalPoint as { x: number; y: number }) || { x: 0.5, y: 0.5 },
        cropRect: (raw.cropRect as { x: number; y: number; w: number; h: number }) || { x: 0, y: 0, w: 1, h: 1 },
        imageFilters: {
          brightness: 0, contrast: 0, saturation: 0, temperature: 0,
          blur: 0, grayscale: false, sepia: false,
          ...(raw.imageFilters as Record<string, unknown> || {}),
        },
        fills: Array.isArray(raw.fills) ? raw.fills.map(repairPaint) : [],
        strokes: repairStrokes(raw.strokes),
        cornerRadius: typeof raw.cornerRadius === "number" ? raw.cornerRadius : 0,
      } as ImageLayerV2;

    case "frame":
      return {
        ...base,
        fills: Array.isArray(raw.fills) ? raw.fills.map(repairPaint) : [],
        strokes: repairStrokes(raw.strokes),
        cornerRadii: repairCornerRadii(raw.cornerRadii),
        clipContent: raw.clipContent !== false,
        children: Array.isArray(raw.children) ? raw.children : [],
        bleedMm: typeof raw.bleedMm === "number" ? raw.bleedMm : BLEED_MM,
        safeAreaMm: typeof raw.safeAreaMm === "number" ? raw.safeAreaMm : SAFE_MM,
        guides: Array.isArray(raw.guides) ? raw.guides : [],
      } as FrameLayerV2;

    case "path":
      return {
        ...base,
        geometry: (raw.geometry as PathLayerV2["geometry"]) || { commands: [], fillRule: "nonzero", closed: false },
        fills: Array.isArray(raw.fills) ? raw.fills.map(repairPaint) : [],
        strokes: repairStrokes(raw.strokes),
      } as PathLayerV2;

    case "icon":
      return {
        ...base,
        iconId: (raw.iconId as string) || "star",
        color: repairRGBA(raw.color as Record<string, unknown> | undefined),
        strokeWidth: typeof raw.strokeWidth === "number" ? raw.strokeWidth : 1.5,
      } as IconLayerV2;

    case "group":
    case "boolean-group":
      return {
        ...base,
        children: Array.isArray(raw.children) ? raw.children : [],
        ...(type === "boolean-group" ? {
          operation: (raw.operation as string) || "union",
          fills: Array.isArray(raw.fills) ? raw.fills.map(repairPaint) : [],
          strokes: repairStrokes(raw.strokes),
        } : {}),
      } as LayerV2;

    default:
      throw new Error(`Unknown layer type: ${type}`);
  }
}

function repairTransform(raw: Record<string, unknown> | undefined): Transform {
  if (!raw) return { position: { x: 0, y: 0 }, size: { x: 100, y: 100 }, rotation: 0, skewX: 0, skewY: 0, pivot: { x: 0.5, y: 0.5 } };
  const pos = raw.position as { x?: number; y?: number } | undefined;
  const size = raw.size as { x?: number; y?: number } | undefined;
  const pivot = raw.pivot as { x?: number; y?: number } | undefined;
  return {
    position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
    size: { x: Math.max(1, size?.x ?? 100), y: Math.max(1, size?.y ?? 100) },
    rotation: typeof raw.rotation === "number" ? raw.rotation : 0,
    skewX: typeof raw.skewX === "number" ? raw.skewX : 0,
    skewY: typeof raw.skewY === "number" ? raw.skewY : 0,
    pivot: { x: pivot?.x ?? 0.5, y: pivot?.y ?? 0.5 },
  };
}

function repairTextStyle(raw: Record<string, unknown> | undefined): TextLayerV2["defaultStyle"] {
  if (!raw) return {
    fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 400,
    italic: false, underline: false, strikethrough: false,
    letterSpacing: 0, lineHeight: 1.4,
    fill: { kind: "solid", color: { r: 0, g: 0, b: 0, a: 1 } },
    uppercase: false,
  };
  return {
    fontFamily: normalizeFontFamily((raw.fontFamily as string) || "Inter, sans-serif"),
    fontSize: Math.max(6, typeof raw.fontSize === "number" ? raw.fontSize : 16),
    fontWeight: typeof raw.fontWeight === "number" ? raw.fontWeight : 400,
    italic: raw.italic === true,
    underline: raw.underline === true,
    strikethrough: raw.strikethrough === true,
    letterSpacing: typeof raw.letterSpacing === "number" ? raw.letterSpacing : 0,
    lineHeight: typeof raw.lineHeight === "number" ? raw.lineHeight : 1.4,
    fill: raw.fill ? repairPaint(raw.fill) : { kind: "solid", color: { r: 0, g: 0, b: 0, a: 1 } },
    uppercase: raw.uppercase === true,
  };
}

/**
 * Normalize AI-generated font family strings to one of the allowed font stacks.
 * If the AI invents a font name not in the whitelist, map it to the closest match.
 */
const ALLOWED_FONTS: Array<{ keywords: string[]; stack: string }> = [
  { keywords: ["inter", "sf pro", "segoe"],                    stack: "Inter, sans-serif" },
  { keywords: ["georgia", "garamond", "times", "cambria"],     stack: "Georgia, serif" },
  { keywords: ["montserrat", "arial black", "impact", "oswald", "raleway", "poppins"], stack: "Montserrat, sans-serif" },
  { keywords: ["playfair", "didot", "bodoni", "cormorant", "libre baskerville", "merriweather"], stack: "Playfair Display, serif" },
  { keywords: ["helvetica", "arial", "roboto", "open sans", "lato", "nunito", "source sans"], stack: "Helvetica Neue, sans-serif" },
];

function normalizeFontFamily(fontFamily: string): string {
  const lower = fontFamily.toLowerCase();
  // Check if it already contains an allowed font keyword
  for (const { keywords, stack } of ALLOWED_FONTS) {
    if (keywords.some(k => lower.includes(k))) return stack;
  }
  // Fallback: classify as serif or sans-serif based on generic family
  if (lower.includes("serif") && !lower.includes("sans")) return "Georgia, serif";
  return "Inter, sans-serif";
}

function repairPaint(raw: unknown): Paint {
  if (!raw || typeof raw !== "object") return { kind: "solid", color: { r: 0, g: 0, b: 0, a: 1 } };
  const p = raw as Record<string, unknown>;
  if (p.kind === "gradient") {
    return {
      kind: "gradient",
      gradientType: (p.gradientType as string) || "linear",
      stops: Array.isArray(p.stops) ? p.stops.map((s: Record<string, unknown>) => ({
        offset: typeof s.offset === "number" ? s.offset : 0,
        color: repairRGBA(s.color as Record<string, unknown>),
      })) : [{ offset: 0, color: { r: 0, g: 0, b: 0, a: 1 } }, { offset: 1, color: { r: 255, g: 255, b: 255, a: 1 } }],
      transform: (Array.isArray(p.transform) ? p.transform : [1, 0, 0, 1, 0, 0]) as [number, number, number, number, number, number],
      spread: (p.spread as "pad" | "reflect" | "repeat") || "pad",
    } as Paint;
  }
  if (p.kind === "pattern") {
    return {
      kind: "pattern",
      patternType: (p.patternType as string) || "dots",
      color: repairRGBA(p.color as Record<string, unknown>),
      scale: typeof p.scale === "number" ? p.scale : 1,
      rotation: typeof p.rotation === "number" ? p.rotation : 0,
      opacity: typeof p.opacity === "number" ? p.opacity : 0.1,
      spacing: typeof p.spacing === "number" ? p.spacing : 20,
    } as Paint;
  }
  // Default: solid
  return {
    kind: "solid",
    color: repairRGBA(p.color as Record<string, unknown>),
  };
}

function repairRGBA(raw: Record<string, unknown> | undefined): RGBA {
  if (!raw) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: clamp(typeof raw.r === "number" ? Math.round(raw.r) : 0, 0, 255),
    g: clamp(typeof raw.g === "number" ? Math.round(raw.g) : 0, 0, 255),
    b: clamp(typeof raw.b === "number" ? Math.round(raw.b) : 0, 0, 255),
    a: clamp(typeof raw.a === "number" ? raw.a : 1, 0, 1),
  };
}

/**
 * Repair an AI-generated stroke object into a valid StrokeSpec.
 * The AI often generates strokes in wrong formats:
 * - As a plain paint object: {"kind":"solid","color":{...}}
 * - With missing fields: {"paint":{...},"width":2} (no dash, cap, etc.)
 * - With "color" instead of "paint": {"color":{...},"width":1}
 */
function repairStroke(raw: unknown): StrokeSpec {
  if (!raw || typeof raw !== "object") {
    return { paint: { kind: "solid", color: { r: 0, g: 0, b: 0, a: 1 } }, width: 1, align: "center", dash: [], cap: "butt", join: "miter", miterLimit: 10 };
  }
  const s = raw as Record<string, unknown>;

  // Determine the paint — AI might put it as "paint", or at top-level as "kind"+"color"
  let paint: Paint;
  if (s.paint && typeof s.paint === "object") {
    paint = repairPaint(s.paint);
  } else if (s.kind && typeof s.kind === "string") {
    // Stroke IS a paint object (common AI mistake)
    paint = repairPaint(s);
  } else if (s.color && typeof s.color === "object") {
    // Has "color" at top level
    paint = { kind: "solid", color: repairRGBA(s.color as Record<string, unknown>) };
  } else {
    paint = { kind: "solid", color: { r: 0, g: 0, b: 0, a: 1 } };
  }

  return {
    paint,
    width: typeof s.width === "number" ? Math.max(0.1, s.width) : 1,
    align: (s.align as "center" | "inside" | "outside") || "center",
    dash: Array.isArray(s.dash) ? s.dash : [],
    cap: (s.cap as "butt" | "round" | "square") || "butt",
    join: (s.join as "miter" | "round" | "bevel") || "miter",
    miterLimit: typeof s.miterLimit === "number" ? s.miterLimit : 10,
  };
}

/** Repair an array of raw stroke objects into valid StrokeSpec[] */
function repairStrokes(raw: unknown): StrokeSpec[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(repairStroke);
}

/**
 * Repair a single effect object — ensure `enabled` defaults to true.
 * The AI often omits `enabled` entirely, which causes the renderer to skip the effect.
 */
function repairEffect(raw: unknown): Effect {
  if (!raw || typeof raw !== "object") return { type: "drop-shadow", enabled: true, color: { r: 0, g: 0, b: 0, a: 0.3 }, blur: 4, offsetX: 2, offsetY: 2, spread: 0 } as Effect;
  const e = { ...(raw as Record<string, unknown>) };
  // Default `enabled` to true — AI almost never outputs this but the renderer requires it
  if (typeof e.enabled !== "boolean") {
    e.enabled = true;
  }
  // Ensure shadow colors are valid
  if (e.type === "drop-shadow" && e.color && typeof e.color === "object") {
    e.color = repairRGBA(e.color as Record<string, unknown>);
  }
  return e as unknown as Effect;
}

function repairCornerRadii(raw: unknown): [number, number, number, number] {
  if (Array.isArray(raw) && raw.length >= 4) {
    return [
      Math.max(0, Number(raw[0]) || 0),
      Math.max(0, Number(raw[1]) || 0),
      Math.max(0, Number(raw[2]) || 0),
      Math.max(0, Number(raw[3]) || 0),
    ];
  }
  return [0, 0, 0, 0];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// =============================================================================
// 6.  Image Layer Hydration
// =============================================================================

/**
 * Hydrate all ImageLayerV2 nodes by loading their imageRef as HTMLImageElement.
 * Must be called before any rendering.
 */
export async function hydrateImageLayers(
  doc: DesignDocumentV2,
  imageMap: Record<string, string>
): Promise<DesignDocumentV2> {
  let updated = doc;
  const layers = Object.values(doc.layersById);

  for (const layer of layers) {
    if (layer.type !== "image") continue;
    const imgLayer = layer as ImageLayerV2;

    // Resolve the actual URL
    let url = imgLayer.imageRef;
    if (imageMap[url]) {
      url = imageMap[url];
    }
    // Also check for placeholder strings
    if (url === "LOGO_URL" || url === "LOGO_URL_PLACEHOLDER") {
      url = imageMap["LOGO_URL"] || imageMap["logo"] || "";
    }

    if (!url) continue;

    try {
      const img = await loadImage(url);
      const layerWithImage = {
        ...updated.layersById[layer.id],
        imageRef: url,
      } as LayerV2;
      // Attach runtime image element for canvas rendering (not part of serialized schema)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (layerWithImage as any)._imageElement = img;
      updated = {
        ...updated,
        layersById: {
          ...updated.layersById,
          [layer.id]: layerWithImage,
        },
      };
    } catch (e) {
      console.warn(`Failed to load image for layer "${layer.id}":`, e);
    }
  }

  return updated;
}

/**
 * Load an image URL and return the HTMLImageElement.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${url}`));
    img.src = url;
  });
}

// =============================================================================
// 7.  Multi-Design Generation
// =============================================================================

/**
 * Generate multiple business card designs by making parallel API calls.
 * Each call gets a different variant direction for visual diversity.
 *
 * If ALL AI calls fail (credit exhaustion, rate limit, network) the function
 * falls back to the local 28 800-combination template engine so the wizard
 * never presents a dead end.
 */
export interface GenerationResult {
  designs: DesignDocumentV2[];
  backDesigns: (DesignDocumentV2 | null)[];
  descriptions: string[];
  errors: string[];
  /** "ai" = Claude-generated, "local" = template-engine fallback */
  source: "ai" | "local";
  /** Human-readable reason when source is "local" */
  fallbackReason?: string;
}

export async function generateMultipleDesigns(
  input: Omit<GenerationInput, "variantIndex" | "totalVariants">,
  count: number = 1,
  signal?: AbortSignal,
): Promise<GenerationResult> {
  const designs: DesignDocumentV2[] = [];
  const backDesigns: (DesignDocumentV2 | null)[] = [];
  const descriptions: string[] = [];
  const errors: string[] = [];

  // --- 1. Try AI generation first ----------------------------------------
  let aiFailed = false;
  let failureReason = "";
  try {
    const calls = Array.from({ length: count }, (_, i) => {
      const { systemPrompt, userMessage } = buildDesignGenerationPrompt({
        ...input,
        variantIndex: i,
        totalVariants: count,
      });
      return callDesignAPI(systemPrompt, userMessage, signal);
    });

    const results = await Promise.allSettled(calls);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        // If the signal was aborted (user cancelled or component unmounted),
        // re-throw so the caller's catch block can handle it silently.
        const reason = result.reason;
        if (
          reason instanceof DOMException && reason.name === "AbortError" ||
          reason?.name === "AbortError" ||
          (signal && signal.aborted)
        ) {
          throw reason instanceof Error ? reason : new DOMException("The operation was aborted.", "AbortError");
        }

        const msg = String(result.reason);
        // Detect API-level failures that make retrying pointless
        if (/credit.balance|billing|quota|rate.limit/i.test(msg)) {
          aiFailed = true;
          failureReason = "API credits exhausted — please top up your Anthropic account.";
        } else if (/API error (4\d{2}|5\d{2})/i.test(msg)) {
          aiFailed = true;
          failureReason = failureReason || "AI service temporarily unavailable.";
        } else if (/fetch|network|ECONNREFUSED|timeout/i.test(msg)) {
          aiFailed = true;
          failureReason = failureReason || "Network error — check your internet connection.";
        }
        errors.push(`Variant ${i + 1}: ${result.reason}`);
        continue;
      }

      const rawResponse = result.value;
      console.log(`[AI Generator] Raw response length: ${rawResponse.length} chars`);
      const { doc, backDoc, error } = parseDesignResponse(rawResponse);

      if (doc) {
        // Log diagnostic info about the generated document
        const layers = Object.values(doc.layersById);
        const textLayers = layers.filter(l => l.type === "text");
        const shapeLayers = layers.filter(l => l.type === "shape");
        const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2;
        console.log(`[AI Generator] Front doc: ${layers.length} layers (${textLayers.length} text, ${shapeLayers.length} shapes), children: ${rootFrame?.children?.length ?? 0}`);
        for (const tl of textLayers) {
          const t = tl as TextLayerV2;
          console.log(`  Text "${t.name}": "${t.text?.substring(0, 30)}" at (${t.transform.position.x},${t.transform.position.y}) size ${t.transform.size.x}x${t.transform.size.y} fontSize=${t.defaultStyle?.fontSize} fill=${JSON.stringify(t.defaultStyle?.fill)}`);
        }
        if (backDoc) {
          const backLayers = Object.values(backDoc.layersById);
          console.log(`[AI Generator] Back doc: ${backLayers.length} layers`);
        }

        // Post-parse validation: ensure text layers have valid transforms
        validateAndFixDocument(doc);
        if (backDoc) validateAndFixDocument(backDoc);

        let hydratedFront = doc;
        let hydratedBack = backDoc;
        if (input.logo.logoUrl) {
          const imageMap = {
            "LOGO_URL": input.logo.logoUrl,
            "LOGO_URL_PLACEHOLDER": input.logo.logoUrl,
            "logo": input.logo.logoUrl,
          };
          hydratedFront = await hydrateImageLayers(doc, imageMap);
          if (hydratedBack) {
            hydratedBack = await hydrateImageLayers(hydratedBack, imageMap);
          }
        }
        designs.push(hydratedFront);
        backDesigns.push(hydratedBack);
        descriptions.push(describeDesign(hydratedFront, i));
      } else {
        errors.push(`Variant ${i + 1}: ${error}`);
      }
    }
  } catch (e) {
    // Re-throw user-initiated abort, fall back on everything else
    if ((e as Error).name === "AbortError") throw e;
    aiFailed = true;
    failureReason = failureReason || `Unexpected error: ${(e as Error).message}`;
  }

  // If AI produced at least one design, return them
  if (designs.length > 0) {
    return { designs, backDesigns, descriptions, errors, source: "ai" };
  }

  // --- 2. Fallback: generate designs locally (template engine) ------------
  if (aiFailed) {
    console.warn(
      `[AI Generator] API unavailable (${failureReason}) — falling back to local template engine.`,
    );
    const local = generateLocalDesigns(input, count);
    return {
      designs: local.designs,
      backDesigns: local.designs.map(() => null),
      descriptions: local.descriptions,
      errors: [],
      source: "local",
      fallbackReason: failureReason,
    };
  }

  // All calls resolved but produced zero parseable designs
  return { designs, backDesigns, descriptions, errors, source: "ai" };
}

// =============================================================================
// 7a. Local Fallback Generator (no AI required)
// =============================================================================

/** Maps wizard StyleMood → template-generator style category */
const MOOD_TO_STYLE: Record<string, "minimal" | "modern" | "classic" | "creative" | "luxury"> = {
  "minimal-clean": "minimal",
  "bold-modern": "modern",
  "classic-elegant": "classic",
  "creative-colorful": "creative",
  "luxury-premium": "luxury",
  "tech-digital": "modern",
  "warm-organic": "classic",
  "corporate-professional": "classic",
};

/** Maps wizard StyleMood → template-generator CardTheme mood */
const MOOD_TO_THEME_MOOD: Record<string, "light" | "dark" | "vibrant" | "muted" | "metallic"> = {
  "minimal-clean": "muted",
  "bold-modern": "vibrant",
  "classic-elegant": "light",
  "creative-colorful": "vibrant",
  "luxury-premium": "metallic",
  "tech-digital": "dark",
  "warm-organic": "light",
  "corporate-professional": "light",
};

/**
 * Generate designs locally using the template engine — no AI API needed.
 * 
 * Produces `count` diverse designs by alternating between:
 *  A. Parametric recipe engine (suggestCombination → generateCardDocument)
 *  B. Curated adapter templates (cardConfigToDocument with mood-matched templates)
 * Each design uses a wildly different seed + alternating light/dark mood to
 * maximise visual variety even within the same style category.
 */
function generateLocalDesigns(
  input: Omit<GenerationInput, "variantIndex" | "totalVariants">,
  count: number,
): { designs: DesignDocumentV2[]; descriptions: string[] } {
  const { details, logo, style } = input;
  const designs: DesignDocumentV2[] = [];
  const descriptions: string[] = [];

  const colors = resolveColors(style);
  const styleCat = style.selectedMood ? MOOD_TO_STYLE[style.selectedMood] ?? "modern" : "modern";
  const themeMood = style.selectedMood ? MOOD_TO_THEME_MOOD[style.selectedMood] ?? "light" : "light";

  const fontStyle: CardConfig["fontStyle"] =
    style.fontPreference === "classic" ? "classic"
    : style.fontPreference === "bold" ? "bold"
    : "modern";

  // Build a base CardConfig from wizard inputs
  const baseCfg: CardConfig = {
    name: details.name || "Your Name",
    title: details.title || "Job Title",
    company: details.company || "Company",
    tagline: details.tagline || "",
    email: details.email || "name@example.com",
    phone: details.phone || "+1 (555) 123-4567",
    website: details.website || "",
    address: details.address || "",
    linkedin: details.linkedin || "",
    twitter: details.twitter || "",
    instagram: details.instagram || "",
    template: "ultra-minimal",
    primaryColor: colors.primary || "#333333",
    secondaryColor: colors.secondary || "#888888",
    textColor: colors.text || "#333333",
    bgColor: colors.bg || "#ffffff",
    fontStyle,
    cardStyle: "standard",
    customWidthMm: 89,
    customHeightMm: 51,
    side: "front",
    logoUrl: logo.logoUrl || "",
    patternType: "none",
    showContactIcons: true,
    qrCodeUrl: "",
    backStyle: "minimal",
  };

  // Alternate theme moods across variants for variety
  const MOOD_VARIANTS: typeof themeMood[] = ["light", "dark", "vibrant", "muted", "metallic"];
  // Shuffle pool based on current time for regeneration diversity
  const moodPool = [themeMood, ...MOOD_VARIANTS.filter(m => m !== themeMood).sort(() => Math.random() - 0.5)];
  // Alternate style categories for maximum visual diversity
  const ALL_STYLES: typeof styleCat[] = ["minimal", "modern", "classic", "creative", "luxury"];
  const stylePool = [styleCat, ...ALL_STYLES.filter(s => s !== styleCat).sort(() => Math.random() - 0.5)];

  // Build the mood-matched template pool up-front
  const moodTemplates = style.selectedMood ? MOOD_TEMPLATE_IDS[style.selectedMood] : null;
  const templatePool = moodTemplates?.length
    ? moodTemplates
    : style.selectedReferenceIds?.length
      ? style.selectedReferenceIds
      : TEMPLATE_LIST.filter(t => t.category === styleCat).map(t => t.id);

  for (let i = 0; designs.length < count && i < count + 4 /* allow retries */; i++) {
    try {
      // Alternate between parametric engine (even i) and adapter templates (odd i)
      if (i % 2 === 0) {
        // ---- Strategy A: Parametric recipe engine ----
        const variantStyle = stylePool[i % stylePool.length];
        const variantMood = moodPool[i % moodPool.length];
        // Use a large prime multiplier + random for maximum seed diversity
        const seed = Date.now() + i * 104729 + Math.floor(Math.random() * 1000000);
        const combo = suggestCombination(variantStyle, variantMood, seed);
        const doc = generateCardDocument({
          cfg: { ...baseCfg },
          recipeId: combo.recipeId,
          themeId: combo.themeId,
          accentKitId: combo.accentKitId,
          useCfgColors: !!colors.primary,
          logoImg: logo.logoElement ?? undefined,
        });
        designs.push(doc);
        descriptions.push(describeDesign(doc, designs.length - 1));
      } else {
        // ---- Strategy B: Curated adapter template ----
        const tplIdx = Math.floor(i / 2) % templatePool.length;
        const templateId = templatePool[tplIdx];
        const theme = TEMPLATE_DEFAULT_THEMES[templateId];
        if (!theme) continue;

        const doc = cardConfigToDocument(
          {
            ...baseCfg,
            template: templateId,
            primaryColor: colors.primary || theme.primary,
            secondaryColor: colors.secondary || theme.secondary,
            textColor: colors.text || theme.text,
            bgColor: colors.bg || theme.bg,
            fontStyle: colors.primary ? fontStyle : theme.font,
            patternType: theme.pattern,
          },
          { logoImg: logo.logoElement ?? undefined },
        );
        designs.push(doc);
        descriptions.push(describeDesign(doc, designs.length - 1));
      }
    } catch (e) {
      console.warn(`[Local Generator] Variant ${i} failed:`, e);
    }
  }

  return { designs, descriptions };
}

/**
 * Call the design generation API endpoint.
 */
async function callDesignAPI(
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/chat/design", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt,
      userMessage,
    }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  // Check if the AI response was truncated due to max_tokens
  const wasTruncated = response.headers.get("X-Truncated") === "true";
  if (wasTruncated) {
    console.warn("[AI Generator] ⚠️ Response was TRUNCATED by max_tokens — JSON will be repaired but may lose back-card data");
  }

  return response.text();
}

/**
 * Generate a short description of a design based on its layers.
 */
function describeDesign(doc: DesignDocumentV2, index: number): string {
  const layers = Object.values(doc.layersById);
  const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2;

  // Detect background color
  const bgPaint = rootFrame?.fills?.[0];
  let bgDesc = "white";
  if (bgPaint?.kind === "solid") {
    const c = bgPaint.color;
    const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
    bgDesc = lum < 0.3 ? "dark" : lum < 0.6 ? "medium" : "light";
  } else if (bgPaint?.kind === "gradient") {
    bgDesc = "gradient";
  }

  // Count decorative elements
  const decorCount = layers.filter(l => l.tags.includes("decorative") || l.tags.includes("accent")).length;

  // Detect style
  const styleWords = [];
  if (decorCount <= 2) styleWords.push("Minimal");
  else if (decorCount <= 5) styleWords.push("Balanced");
  else styleWords.push("Detailed");

  styleWords.push(bgDesc === "dark" ? "on dark" : bgDesc === "gradient" ? "with gradient" : "on light");

  // Find accent color if any
  const accentLayers = layers.filter(l => l.tags.includes("accent") && l.type === "shape");
  if (accentLayers.length > 0) {
    const sl = accentLayers[0] as ShapeLayerV2;
    if (sl.fills?.[0]?.kind === "solid") {
      const c = sl.fills[0].color;
      styleWords.push(`— accent ${rgbToName(c.r, c.g, c.b)}`);
    }
  }

  return `Design ${index + 1}: ${styleWords.join(" ")}`;
}

// =============================================================================
// 8.  Helpers
// =============================================================================

function resolveColors(style: StyleSelection): {
  primary: string | null;
  secondary: string | null;
  text: string | null;
  bg: string | null;
} {
  // Custom colors take highest priority
  if (style.customColors.primary || style.customColors.bg) {
    return style.customColors;
  }

  // Color preset override
  if (style.colorOverride) {
    const preset = COLOR_PRESETS.find(p => p.name === style.colorOverride);
    if (preset) {
      return { primary: preset.primary, secondary: preset.secondary, text: preset.text, bg: preset.bg };
    }
  }

  // Mood-based template default colors
  if (style.selectedMood) {
    const templateIds = MOOD_TEMPLATE_IDS[style.selectedMood];
    if (templateIds?.length) {
      const firstTheme = TEMPLATE_DEFAULT_THEMES[templateIds[0]];
      if (firstTheme) {
        return { primary: firstTheme.primary, secondary: firstTheme.secondary, text: firstTheme.text, bg: firstTheme.bg };
      }
    }
  }

  // Reference selection
  if (style.selectedReferenceIds.length > 0) {
    const theme = TEMPLATE_DEFAULT_THEMES[style.selectedReferenceIds[0]];
    if (theme) {
      return { primary: theme.primary, secondary: theme.secondary, text: theme.text, bg: theme.bg };
    }
  }

  return { primary: null, secondary: null, text: null, bg: null };
}

function getInitials(company: string): string {
  return company
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

/**
 * Infer brand personality and industry context from the user's details.
 * This gives the AI rich context without prescriptive rules.
 */
function inferBrandContext(details: UserDetails, briefDescription?: string): string {
  const title = (details.title || "").toLowerCase();
  const company = (details.company || "").toLowerCase();
  const brief = (briefDescription || "").toLowerCase();

  // Industry inference from title/company keywords
  const industryKeywords: Array<{ keywords: string[]; context: string }> = [
    { keywords: ["design", "creative", "art", "ux", "ui", "graphic", "visual"], context: "This is a creative professional. The card should exude design sensibility — confident, visually striking, and showing an eye for detail." },
    { keywords: ["tech", "software", "engineer", "develop", "program", "data", "cyber", "digital", "it "], context: "This is a technology professional. The card should feel modern, precise, and forward-thinking — clean geometry, technical confidence." },
    { keywords: ["financ", "bank", "invest", "account", "consult", "advisory", "wealth"], context: "This is a finance professional. The card should communicate trust, stability, and sophistication — refined, authoritative, and polished." },
    { keywords: ["law", "legal", "attorney", "counsel", "advocate", "barrister"], context: "This is a legal professional. The card should project authority, credibility, and tradition — elegant and commanding." },
    { keywords: ["market", "brand", "advertis", "media", "pr ", "public relation", "communic", "content"], context: "This is a marketing/media professional. The card should be attention-grabbing and memorable — bold yet strategic." },
    { keywords: ["medical", "doctor", "health", "clinic", "pharma", "dental", "therap", "nurse", "surgeon"], context: "This is a healthcare professional. The card should feel trustworthy, clean, and professional — calm confidence and clarity." },
    { keywords: ["architect", "interior", "construct", "build", "real estate", "property", "realt"], context: "This is a property/architecture professional. The card should feel structural, spatial, and premium — strong lines and presence." },
    { keywords: ["photo", "film", "video", "cinemato", "studio", "production"], context: "This is a visual storytelling professional. The card should feel cinematic and artful — dramatic, memorable, image-conscious." },
    { keywords: ["chef", "restaurant", "food", "culinar", "cater", "bakery", "café", "bistro"], context: "This is a food industry professional. The card should feel warm, inviting, and artisanal — rich textures and appetizing tones." },
    { keywords: ["fashion", "style", "boutique", "apparel", "model", "beauty", "cosmetic"], context: "This is a fashion/beauty professional. The card should feel chic, stylish, and editorial — runway-worthy sophistication." },
    { keywords: ["music", "audio", "sound", "producer", "dj", "composer", "artist"], context: "This is a music/audio professional. The card should feel rhythmic and expressive — creative energy with artistic edge." },
    { keywords: ["coach", "train", "fitness", "sport", "athlet", "wellness", "yoga"], context: "This is a wellness/fitness professional. The card should feel energetic, clean, and motivating — dynamic and health-conscious." },
    { keywords: ["teach", "educ", "profess", "academ", "school", "universit", "instruct", "tutor"], context: "This is an education professional. The card should feel approachable, intelligent, and trustworthy." },
    { keywords: ["ceo", "founder", "owner", "president", "director", "chief", "managing", "partner", "executive", "vp "], context: "This is a senior leader. The card should project executive presence — premium, commanding, and distinctive." },
  ];

  const combined = `${title} ${company} ${brief}`;
  for (const { keywords, context } of industryKeywords) {
    if (keywords.some(k => combined.includes(k))) {
      return `## Brand Personality\n${context}`;
    }
  }

  // Generic fallback — still gives the AI useful direction
  return `## Brand Personality\nDesign a card that reflects professionalism and individuality. Consider what "${details.title || "Professional"}" at "${details.company || "a company"}" would want — something that makes a strong first impression and feels distinctly theirs.`;
}

function rgbToName(r: number, g: number, b: number): string {
  const hsl = rgbToHsl(r, g, b);
  const h = hsl[0];
  const s = hsl[1];
  const l = hsl[2];
  if (s < 10) return l < 30 ? "dark" : l > 70 ? "light" : "gray";
  if (h < 30) return "red";
  if (h < 60) return "orange";
  if (h < 90) return "yellow";
  if (h < 150) return "green";
  if (h < 210) return "cyan";
  if (h < 270) return "blue";
  if (h < 330) return "purple";
  return "red";
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}
