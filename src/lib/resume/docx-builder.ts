// =============================================================================
// DMSuite — Resume DOCX Builder
// Creates a proper .docx file using the docx library
// =============================================================================

import {
  Document, Paragraph, TextRun, HeadingLevel, Packer,
  AlignmentType, TabStopPosition, TabStopType,
  BorderStyle, convertMillimetersToTwip,
} from "docx";
import type { ResumeData } from "./schema";
import { SECTION_META } from "./schema";

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sectionHeading(title: string, color: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: convertMillimetersToTwip(4), after: convertMillimetersToTwip(1) },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: color.replace("#", "") } },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 22,
        color: color.replace("#", ""),
        font: "Calibri",
      }),
    ],
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: convertMillimetersToTwip(1) },
    children: [
      new TextRun({ text, size: 20, font: "Calibri" }),
    ],
  });
}

function rgbaToHex(rgba: string): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    const r = parseInt(m[1]).toString(16).padStart(2, "0");
    const g = parseInt(m[2]).toString(16).padStart(2, "0");
    const b = parseInt(m[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  if (rgba.startsWith("#")) return rgba;
  return "#000000";
}

export async function generateDocx(data: ResumeData): Promise<Blob> {
  const paragraphs: Paragraph[] = [];
  const primaryColor = rgbaToHex(data.metadata?.design?.colors?.primary ?? "rgba(0,0,0,1)");
  const colorHex = primaryColor.replace("#", "");

  // ---- Header: Name ----
  const basics = data.basics;
  if (basics?.name) {
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      spacing: { after: convertMillimetersToTwip(1) },
      children: [
        new TextRun({
          text: basics.name,
          bold: true,
          size: 32,
          color: colorHex,
          font: "Calibri",
        }),
      ],
    }));
  }

  // ---- Headline ----
  if (basics?.headline) {
    paragraphs.push(new Paragraph({
      spacing: { after: convertMillimetersToTwip(1) },
      children: [
        new TextRun({ text: basics.headline, size: 22, italics: true, font: "Calibri" }),
      ],
    }));
  }

  // ---- Contact line ----
  const contactParts = [basics?.email, basics?.phone, basics?.location, basics?.website?.url].filter(Boolean);
  if (contactParts.length > 0) {
    paragraphs.push(new Paragraph({
      spacing: { after: convertMillimetersToTwip(2) },
      children: [
        new TextRun({ text: contactParts.join("  •  "), size: 18, color: "666666", font: "Calibri" }),
      ],
    }));
  }

  // ---- Summary ----
  if (data.summary?.content && !data.summary.hidden) {
    paragraphs.push(sectionHeading(data.summary.title || "Summary", primaryColor));
    const lines = stripHtml(data.summary.content).split("\n").filter(Boolean);
    for (const line of lines) {
      paragraphs.push(bodyText(line));
    }
  }

  // ---- Standard sections ----
  const sectionOrder: Array<keyof typeof data.sections> = [
    "experience", "education", "projects", "skills", "languages",
    "certifications", "awards", "publications", "volunteer", "references", "interests", "profiles",
  ];

  for (const key of sectionOrder) {
    const section = data.sections?.[key];
    if (!section || section.hidden || !section.items?.length) continue;

    const meta = SECTION_META[key];
    paragraphs.push(sectionHeading(section.title || meta?.label || key, primaryColor));

    for (const item of section.items) {
      if ((item as { hidden?: boolean }).hidden) continue;

      const title = (item as Record<string, unknown>).position ??
        (item as Record<string, unknown>).title ??
        (item as Record<string, unknown>).name ??
        (item as Record<string, unknown>).school ??
        (item as Record<string, unknown>).organization ??
        (item as Record<string, unknown>).language ?? "";
      const subtitle = (item as Record<string, unknown>).company ??
        (item as Record<string, unknown>).issuer ??
        (item as Record<string, unknown>).publisher ??
        (item as Record<string, unknown>).awarder ??
        (item as Record<string, unknown>).network ?? "";
      const period = (item as Record<string, unknown>).period ??
        (item as Record<string, unknown>).date ?? "";
      const desc = (item as Record<string, unknown>).description ?? "";
      const keywords = ((item as Record<string, unknown>).keywords ?? []) as string[];

      // Title line with period on the right
      const titleRuns: TextRun[] = [];
      if (title) titleRuns.push(new TextRun({ text: String(title), bold: true, size: 21, font: "Calibri" }));
      if (subtitle) titleRuns.push(new TextRun({ text: `  —  ${String(subtitle)}`, size: 20, font: "Calibri" }));
      if (period) titleRuns.push(new TextRun({ text: `\t${String(period)}`, size: 18, color: "888888", font: "Calibri" }));

      if (titleRuns.length > 0) {
        paragraphs.push(new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          spacing: { before: convertMillimetersToTwip(1.5), after: convertMillimetersToTwip(0.5) },
          children: titleRuns,
        }));
      }

      if (desc) {
        const descLines = stripHtml(String(desc)).split("\n").filter(Boolean);
        for (const line of descLines) {
          paragraphs.push(bodyText(line));
        }
      }

      if (keywords.length > 0) {
        paragraphs.push(new Paragraph({
          spacing: { after: convertMillimetersToTwip(1) },
          children: [
            new TextRun({ text: keywords.join(", "), size: 18, italics: true, color: "888888", font: "Calibri" }),
          ],
        }));
      }
    }
  }

  // ---- Build document ----
  const doc = new Document({
    creator: "DMSuite Resume Builder",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20 },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertMillimetersToTwip(15),
            bottom: convertMillimetersToTwip(15),
            left: convertMillimetersToTwip(18),
            right: convertMillimetersToTwip(18),
          },
        },
      },
      children: paragraphs,
    }],
  });

  return await Packer.toBlob(doc);
}
