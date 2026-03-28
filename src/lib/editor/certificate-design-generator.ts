// =============================================================================
// DMSuite — Certificate AI Design Generator
// Builds prompts for Claude to generate DesignDocumentV2 certificate designs,
// with deterministic fallback to the adapter when AI is unavailable.
// =============================================================================

import type { DesignDocumentV2 } from "./schema";
import type { CertificateConfig } from "./certificate-adapter";
import {
  certificateConfigToDocument,
  certificateConfigToDocumentAsync,
} from "./certificate-adapter";
import {
  getCertificateTemplate,
  type CertificateTemplate,
  CERTIFICATE_TEMPLATES,
} from "@/data/certificate-templates";

// =============================================================================
// 1.  Generation Input
// =============================================================================

export interface CertificateGenerationInput {
  config: CertificateConfig;
  template: CertificateTemplate;
  /** User's free-text style/design instruction */
  userInstruction?: string;
}

// =============================================================================
// 2.  Prompt Builder
// =============================================================================

export function buildCertificateDesignPrompt(input: CertificateGenerationInput): {
  systemPrompt: string;
  userMessage: string;
} {
  const { config, template, userInstruction } = input;
  const W = template.width;
  const H = template.height;
  const SAFE = 150;

  const systemPrompt = `You are an elite award-winning graphic designer specializing in formal certificates and diplomas. Return ONLY valid JSON — no markdown, no explanation, no commentary.

RESPONSE FORMAT: {"document":{DesignDocumentV2}}

## Canvas
${W}×${H}px at 300 DPI (A4 landscape). Safe area: ${SAFE}px inset from each edge. All text and decorative elements must fit within x:${SAFE}–${W - SAFE}, y:${SAFE}–${H - SAFE}. children array: first element = behind (background), last element = on top.

## Certificate Design Philosophy — CRITICAL
Study how REAL formal certificates look from universities, government bodies, and professional organizations:
- **Formal hierarchy**: The recipient's name is the hero — largest and most prominent text.
- **Balanced composition**: Certificate content is vertically centered with consistent spacing.
- **Typography**: Use at most 3 font families (heading, body, accent/script). The accent font is for the recipient name.
- **Restraint in decoration**: A beautiful border frame and perhaps one seal — NOT busy patterns.
- **Color harmony**: 2-4 colors from the template palette, applied consistently.
- **Seal placement**: Bottom-right or bottom-center, 200-280px diameter.
- **Signatory blocks**: Evenly spaced across the bottom, each with a line, name, and title.

## Available Fonts
Use ONLY fonts from the template's font pairing:
- Heading: "${template.fontPairing.heading}" (weights: ${template.fontPairing.headingWeights.join(", ")})
- Body: "${template.fontPairing.body}" (weights: ${template.fontPairing.bodyWeights.join(", ")})
- Accent: "${template.fontPairing.accent}" (script/decorative, weight 400)

## Template Colors
- background: ${template.colors.background}
- primary: ${template.colors.primary}
- secondary: ${template.colors.secondary}
- text: ${template.colors.text}
- accent: ${template.colors.accent}

## Required Semantic Tags — EVERY layer MUST have tags
| Layer | Tags |
|-------|------|
| Background | ["background", "bg"] |
| Border/Frame | ["border", "frame", "decorative"] |
| Title | ["title", "heading", "certificate-title"] |
| Subtitle | ["subtitle", "subheading", "presented-to"] |
| Recipient Name | ["recipient-name", "primary-text", "name"] |
| Description | ["description", "body-text"] |
| Organization | ["organization", "org-name"] |
| Date | ["date", "meta", "date-issued"] |
| Signatory N | ["signatory-N", "signatory", "signature"] |
| Seal Shape | ["seal", "seal-shape", "decorative"] |
| Seal Text | ["seal", "seal-text"] |
| Decorative | ["decorative", "ornament", "accent"] |

## DesignDocumentV2 Schema
\`\`\`
{
  version: 2,
  toolId: "certificate",
  name: string,
  width: ${W}, height: ${H},
  dpi: 300,
  rootFrameId: string (UUID),
  layersById: { [id: string]: LayerV2 },
  selection: [], background: null
}
\`\`\`

### LayerV2 Types
- **FrameLayerV2**: { type:"frame", id, name, x, y, width, height, children:string[], fills:Paint[], visible, opacity, tags }
- **TextLayerV2**: { type:"text", id, name, x, y, width, height, text:string, defaultStyle:{fontFamily,fontWeight,fontSize,fills:Paint[],letterSpacing?,lineHeight?}, align:"left"|"center"|"right", visible, opacity, tags }
- **ShapeLayerV2**: { type:"shape", id, name, x, y, width, height, shapeType:"rectangle"|"ellipse"|"line"|"star", fills:Paint[], strokes?:StrokeSpec[], cornerRadii?:[n,n,n,n], visible, opacity, tags }
- **ImageLayerV2**: { type:"image", id, name, x, y, width, height, imageRef:string, fit:"fill"|"fit"|"stretch", visible, opacity, tags }

### Paint Types
- SolidPaint: { kind:"solid", color:{r,g,b,a} } where r,g,b are 0-1 floats
- GradientPaint: { kind:"gradient", gradientType:"linear"|"radial", stops:[{offset:0-1,color:{r,g,b,a}}], from?:{x,y}, to?:{x,y} }

## Font Size Guide (at 300 DPI)
- Title: 90–112px (uppercase, letter-spacing 5-8)
- Recipient name: 62–80px (accent font)
- Subtitle: 36–42px (italic, light weight)
- Body text: 30–36px
- Signatory text: 22–26px
- Date/reference: 24–28px
- Organization name: 40–48px (uppercase, letter-spacing 3-4)
`;

  const userMessage = `Create a stunning certificate design with these details:

**Certificate Type:** ${config.certificateType}
**Title:** ${config.title}
**Subtitle:** ${config.subtitle}
**Recipient:** ${config.recipientName || "[Recipient Name]"}
**Description:** ${config.description || "For outstanding achievement"}
${config.additionalText ? `**Additional Text:** ${config.additionalText}` : ""}
**Organization:** ${config.organizationName || "[Organization]"}
${config.eventName ? `**Event:** ${config.eventName}` : ""}
${config.courseName ? `**Course:** ${config.courseName}` : ""}
**Date Issued:** ${config.dateIssued}
${config.referenceNumber ? `**Reference:** ${config.referenceNumber}` : ""}
**Signatories:** ${config.signatories.map((s, i) => `${i + 1}. ${s.name || "Signatory"} — ${s.title || "Title"}`).join("; ")}
**Seal:** ${config.showSeal ? `Yes, style: ${config.sealStyle}, text: "${config.sealText}"` : "No seal"}
**Template:** ${template.name} (${template.category})
**SVG Border:** Use imageRef "${template.svgBorderPath}" as the border layer (fit: "stretch", full canvas size)

${userInstruction ? `**Special Instructions:** ${userInstruction}` : "Design should follow the template's formal aesthetic with beautiful typography and balanced composition."}

Return ONLY the JSON. The design must be production-quality — this will be printed at high resolution.`;

  return { systemPrompt, userMessage };
}

// =============================================================================
// 3.  AI Generation (with deterministic fallback)
// =============================================================================

export async function generateCertificateDesign(
  input: CertificateGenerationInput,
): Promise<DesignDocumentV2> {
  const { config, template } = input;

  try {
    const { systemPrompt, userMessage } = buildCertificateDesignPrompt(input);

    const response = await fetch("/api/chat/design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt, userMessage }),
    });

    if (!response.ok) {
      // Fallback on any API error (402 no credits, 500 server error, etc.)
      return certificateConfigToDocument(config, template);
    }

    const text = await response.text();

    // Extract JSON from response (may be wrapped in markdown code fences)
    let jsonStr = text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    const parsed = JSON.parse(jsonStr);
    const doc: DesignDocumentV2 = parsed.document ?? parsed.front ?? parsed;

    // Basic validation
    if (!doc.version || !doc.rootFrameId || !doc.layersById) {
      return certificateConfigToDocument(config, template);
    }

    // Ensure toolId is set correctly
    doc.toolId = "certificate";

    return doc;
  } catch {
    // ALWAYS fallback to deterministic adapter — user must never see a blank canvas
    return certificateConfigToDocument(config, template);
  }
}

// =============================================================================
// 4.  Generate with font preloading (async wrapper)
// =============================================================================

export async function generateCertificateDesignAsync(
  input: CertificateGenerationInput,
): Promise<DesignDocumentV2> {
  try {
    return await generateCertificateDesign(input);
  } catch {
    // Ultimate fallback with font loading
    return certificateConfigToDocumentAsync(input.config, input.template);
  }
}
