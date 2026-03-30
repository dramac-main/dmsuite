// =============================================================================
// DMSuite — Chiko Action Manifest: Presentation Designer (Fabric.js)
// =============================================================================

import type { Editor } from "@/lib/fabric-editor";
import { createFabricManifest, findObjectByName } from "@/lib/fabric-editor";
import type { ChikoActionManifest, ChikoActionDescriptor, ChikoActionResult } from "@/stores/chiko-actions";
import { fabric } from "fabric";

// ── Presentation-specific extra actions ─────────────────────────────────────

const EXTRA_ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "update_slide_details",
    description:
      "Update presentation slide text fields. Available fields: title, subtitle, body, company, author, date, bullet1, bullet2, bullet3, bullet4, headingLeft, bodyLeft, headingRight, bodyRight, quoteText, quoteAuthor, sectionTitle, slideNumber.",
    category: "presentation",
    parameters: {
      title: { type: "string", description: "Slide title", required: false },
      subtitle: { type: "string", description: "Subtitle text", required: false },
      body: { type: "string", description: "Body/content text", required: false },
      company: { type: "string", description: "Company name", required: false },
      author: { type: "string", description: "Author/presenter name", required: false },
      date: { type: "string", description: "Date string", required: false },
      bullet1: { type: "string", description: "First bullet point", required: false },
      bullet2: { type: "string", description: "Second bullet point", required: false },
      bullet3: { type: "string", description: "Third bullet point", required: false },
      bullet4: { type: "string", description: "Fourth bullet point", required: false },
      headingLeft: { type: "string", description: "Left column heading", required: false },
      bodyLeft: { type: "string", description: "Left column body text", required: false },
      headingRight: { type: "string", description: "Right column heading", required: false },
      bodyRight: { type: "string", description: "Right column body text", required: false },
      quoteText: { type: "string", description: "Quote text", required: false },
      quoteAuthor: { type: "string", description: "Quote attribution", required: false },
      sectionTitle: { type: "string", description: "Section number or title", required: false },
      slideNumber: { type: "string", description: "Slide number", required: false },
    },
  },
];

const PRESENTATION_FIELD_MAP: Record<string, string> = {
  title: "pres-title",
  subtitle: "pres-subtitle",
  body: "pres-body",
  company: "pres-company",
  author: "pres-author",
  date: "pres-date",
  bullet1: "pres-bullet-1",
  bullet2: "pres-bullet-2",
  bullet3: "pres-bullet-3",
  bullet4: "pres-bullet-4",
  headingLeft: "pres-heading-left",
  bodyLeft: "pres-body-left",
  headingRight: "pres-heading-right",
  bodyRight: "pres-body-right",
  quoteText: "pres-quote-text",
  quoteAuthor: "pres-quote-author",
  sectionTitle: "pres-section-title",
  slideNumber: "pres-slide-number",
};

function extraExecute(
  editor: Editor,
  actionName: string,
  params: Record<string, unknown>,
): ChikoActionResult | null {
  if (actionName !== "update_slide_details") return null;

  const updated: string[] = [];
  for (const [field, layerName] of Object.entries(PRESENTATION_FIELD_MAP)) {
    const value = params[field];
    if (typeof value !== "string") continue;
    const obj = findObjectByName(editor.canvas, layerName);
    if (obj && "set" in obj) {
      (obj as fabric.Textbox).set("text", value);
      updated.push(field);
    }
  }

  if (updated.length > 0) {
    editor.canvas.renderAll();
    return { success: true, message: `Updated: ${updated.join(", ")}` };
  }
  return { success: false, message: "No valid fields provided or no matching text objects found on this slide." };
}

// ── Factory ─────────────────────────────────────────────────────────────────

export function createPresentationFabricManifest(editor: Editor): ChikoActionManifest {
  return createFabricManifest({
    toolId: "presentation",
    toolName: "Presentation Designer",
    editor,
    extraActions: EXTRA_ACTIONS,
    extraExecute: (actionName, params) => extraExecute(editor, actionName, params),
    extraState: () => {
      const fields: Record<string, string> = {};
      for (const [field, layerName] of Object.entries(PRESENTATION_FIELD_MAP)) {
        const obj = findObjectByName(editor.canvas, layerName);
        if (obj && "text" in obj) {
          fields[field] = (obj as fabric.Textbox).text || "";
        }
      }
      return { presentationFields: fields };
    },
  });
}
