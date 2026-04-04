// =============================================================================
// DMSuite — Resume DOCX Builder (Enhanced)
// Creates a proper .docx with bullet lists, hyperlinks, and professional layout.
// =============================================================================

import {
  Document, Paragraph, TextRun, HeadingLevel, Packer, ExternalHyperlink,
  AlignmentType, TabStopPosition, TabStopType, LevelFormat,
  BorderStyle, convertMillimetersToTwip,
} from "docx";
import type { ResumeData } from "./schema";
import { SECTION_META } from "./schema";

// ---------------------------------------------------------------------------
// HTML → structured content parser
// ---------------------------------------------------------------------------

interface TextChunk {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
}

interface ParsedBlock {
  type: "paragraph" | "bullet";
  chunks: TextChunk[];
}

function parseHtml(html: string): ParsedBlock[] {
  if (!html?.trim()) return [];

  const blocks: ParsedBlock[] = [];

  // Split by list items and paragraph boundaries
  // Extract <li> items as bullet points
  const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const hasListItems = listItemRegex.test(html);

  if (hasListItems) {
    // Process paragraphs before the first list
    const beforeList = html.split(/<[ou]l[^>]*>/i)[0];
    if (beforeList?.trim()) {
      for (const block of parseInlineContent(beforeList)) {
        blocks.push({ type: "paragraph", chunks: block });
      }
    }

    // Process list items
    let match: RegExpExecArray | null;
    const regex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    while ((match = regex.exec(html)) !== null) {
      const chunks = parseInlineChunks(match[1]);
      if (chunks.length > 0) {
        blocks.push({ type: "bullet", chunks });
      }
    }

    // Process content after the last list
    const afterList = html.split(/<\/[ou]l>/i).pop() ?? "";
    if (afterList?.trim() && !/<li/i.test(afterList)) {
      for (const block of parseInlineContent(afterList)) {
        blocks.push({ type: "paragraph", chunks: block });
      }
    }
  } else {
    // No list — split by <p>, <br>, newlines
    for (const block of parseInlineContent(html)) {
      blocks.push({ type: "paragraph", chunks: block });
    }
  }

  return blocks;
}

function parseInlineContent(html: string): TextChunk[][] {
  // Split by paragraph and br tags
  const segments = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return segments.map((seg) => parseInlineChunks(seg));
}

function parseInlineChunks(html: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  // Process inline tags: <strong>, <b>, <em>, <i>, <a>
  let working = html;

  // Simple inline parser — handles nested bold/italic/links
  const inlineRegex = /<(strong|b|em|i|a)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let lastIndex = 0;
  let inlineMatch: RegExpExecArray | null;

  while ((inlineMatch = inlineRegex.exec(working)) !== null) {
    // Text before this tag
    if (inlineMatch.index > lastIndex) {
      const before = stripTags(working.slice(lastIndex, inlineMatch.index));
      if (before) chunks.push({ text: before });
    }

    const tag = inlineMatch[1].toLowerCase();
    const attrs = inlineMatch[2];
    const inner = stripTags(inlineMatch[3]);

    if (tag === "a") {
      const hrefMatch = attrs.match(/href=["']([^"']+)["']/);
      chunks.push({
        text: inner,
        href: hrefMatch?.[1],
      });
    } else if (tag === "strong" || tag === "b") {
      chunks.push({ text: inner, bold: true });
    } else if (tag === "em" || tag === "i") {
      chunks.push({ text: inner, italic: true });
    }

    lastIndex = inlineMatch.index + inlineMatch[0].length;
  }

  // Remaining text after last tag
  if (lastIndex < working.length) {
    const remaining = stripTags(working.slice(lastIndex));
    if (remaining) chunks.push({ text: remaining });
  }

  // If no inline tags were found, just return plain text
  if (chunks.length === 0) {
    const plain = stripTags(html);
    if (plain) chunks.push({ text: plain });
  }

  return chunks;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// ---------------------------------------------------------------------------
// Paragraph builders
// ---------------------------------------------------------------------------

function sectionHeading(title: string, color: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: convertMillimetersToTwip(4), after: convertMillimetersToTwip(1.5) },
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

function chunksToRuns(chunks: TextChunk[], baseFontSize = 20): (TextRun | ExternalHyperlink)[] {
  return chunks.map((chunk) => {
    if (chunk.href) {
      return new ExternalHyperlink({
        link: chunk.href,
        children: [
          new TextRun({
            text: chunk.text,
            style: "Hyperlink",
            size: baseFontSize,
            font: "Calibri",
          }),
        ],
      });
    }
    return new TextRun({
      text: chunk.text,
      bold: chunk.bold,
      italics: chunk.italic,
      size: baseFontSize,
      font: "Calibri",
    });
  });
}

function richParagraph(chunks: TextChunk[]): Paragraph {
  return new Paragraph({
    spacing: { after: convertMillimetersToTwip(0.5) },
    children: chunksToRuns(chunks),
  });
}

function bulletParagraph(chunks: TextChunk[]): Paragraph {
  return new Paragraph({
    numbering: { reference: "resume-bullets", level: 0 },
    spacing: { after: convertMillimetersToTwip(0.5) },
    children: chunksToRuns(chunks),
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: convertMillimetersToTwip(0.5) },
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

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

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

  // ---- Contact line with hyperlinks ----
  const contactRuns: (TextRun | ExternalHyperlink)[] = [];
  const contactItems: Array<{ text: string; href?: string }> = [];
  if (basics?.email) contactItems.push({ text: basics.email, href: `mailto:${basics.email}` });
  if (basics?.phone) contactItems.push({ text: basics.phone, href: `tel:${basics.phone}` });
  if (basics?.location) contactItems.push({ text: basics.location });
  if (basics?.website?.url) contactItems.push({ text: basics.website.label || basics.website.url, href: basics.website.url });

  contactItems.forEach((item, i) => {
    if (i > 0) {
      contactRuns.push(new TextRun({ text: "  •  ", size: 18, color: "999999", font: "Calibri" }));
    }
    if (item.href) {
      contactRuns.push(new ExternalHyperlink({
        link: item.href,
        children: [new TextRun({ text: item.text, style: "Hyperlink", size: 18, font: "Calibri" })],
      }));
    } else {
      contactRuns.push(new TextRun({ text: item.text, size: 18, color: "666666", font: "Calibri" }));
    }
  });

  if (contactRuns.length > 0) {
    paragraphs.push(new Paragraph({
      spacing: { after: convertMillimetersToTwip(2) },
      children: contactRuns,
    }));
  }

  // ---- Profiles (social links) ----
  const profiles = data.sections?.profiles;
  if (profiles && !profiles.hidden && profiles.items?.length) {
    const profileRuns: (TextRun | ExternalHyperlink)[] = [];
    profiles.items.forEach((p, i) => {
      if ((p as { hidden?: boolean }).hidden) return;
      const network = (p as Record<string, unknown>).network as string ?? "";
      const username = (p as Record<string, unknown>).username as string ?? "";
      const url = ((p as Record<string, unknown>).website as { url?: string })?.url ?? "";
      if (i > 0) profileRuns.push(new TextRun({ text: "  •  ", size: 18, color: "999999", font: "Calibri" }));
      const label = `${network}${username ? `: ${username}` : ""}`;
      if (url) {
        profileRuns.push(new ExternalHyperlink({
          link: url,
          children: [new TextRun({ text: label, style: "Hyperlink", size: 18, font: "Calibri" })],
        }));
      } else {
        profileRuns.push(new TextRun({ text: label, size: 18, color: "666666", font: "Calibri" }));
      }
    });
    if (profileRuns.length > 0) {
      paragraphs.push(new Paragraph({
        spacing: { after: convertMillimetersToTwip(2) },
        children: profileRuns,
      }));
    }
  }

  // ---- Summary ----
  if (data.summary?.content && !data.summary.hidden) {
    paragraphs.push(sectionHeading(data.summary.title || "Summary", primaryColor));
    const blocks = parseHtml(data.summary.content);
    for (const block of blocks) {
      paragraphs.push(block.type === "bullet" ? bulletParagraph(block.chunks) : richParagraph(block.chunks));
    }
  }

  // ---- Standard sections in layout order ----
  const sectionOrder = getSectionOrder(data);

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
        (item as Record<string, unknown>).degree ??
        (item as Record<string, unknown>).network ?? "";
      const period = (item as Record<string, unknown>).period ??
        (item as Record<string, unknown>).date ?? "";
      const location = (item as Record<string, unknown>).location ?? "";
      const desc = (item as Record<string, unknown>).description ?? "";
      const keywords = ((item as Record<string, unknown>).keywords ?? []) as string[];
      const website = (item as Record<string, unknown>).website as { url?: string; label?: string } | undefined;
      const fluency = (item as Record<string, unknown>).fluency ?? "";
      const proficiency = (item as Record<string, unknown>).proficiency ?? "";
      const area = (item as Record<string, unknown>).area ?? "";
      const grade = (item as Record<string, unknown>).grade ?? "";

      // Title line with right-aligned period
      const titleRuns: (TextRun | ExternalHyperlink)[] = [];
      if (title) titleRuns.push(new TextRun({ text: String(title), bold: true, size: 21, font: "Calibri" }));
      if (subtitle) titleRuns.push(new TextRun({ text: `  —  ${String(subtitle)}`, size: 20, font: "Calibri" }));
      if (area) titleRuns.push(new TextRun({ text: `, ${String(area)}`, size: 20, font: "Calibri" }));
      if (period) titleRuns.push(new TextRun({ text: `\t${String(period)}`, size: 18, color: "888888", font: "Calibri" }));

      if (titleRuns.length > 0) {
        paragraphs.push(new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          spacing: { before: convertMillimetersToTwip(1.5), after: convertMillimetersToTwip(0.3) },
          children: titleRuns,
        }));
      }

      // Subtitle line (location, grade, fluency, website)
      const subParts: string[] = [];
      if (location) subParts.push(String(location));
      if (grade) subParts.push(`GPA: ${String(grade)}`);
      if (fluency) subParts.push(String(fluency));
      if (proficiency) subParts.push(String(proficiency));

      if (subParts.length > 0 || website?.url) {
        const subRuns: (TextRun | ExternalHyperlink)[] = [];
        if (subParts.length) {
          subRuns.push(new TextRun({ text: subParts.join("  •  "), size: 18, color: "888888", font: "Calibri" }));
        }
        if (website?.url) {
          if (subRuns.length) subRuns.push(new TextRun({ text: "  •  ", size: 18, color: "999999", font: "Calibri" }));
          subRuns.push(new ExternalHyperlink({
            link: website.url,
            children: [new TextRun({ text: website.label || website.url, style: "Hyperlink", size: 18, font: "Calibri" })],
          }));
        }
        paragraphs.push(new Paragraph({
          spacing: { after: convertMillimetersToTwip(0.5) },
          children: subRuns,
        }));
      }

      // Description with proper bullet list support
      if (desc) {
        const blocks = parseHtml(String(desc));
        for (const block of blocks) {
          paragraphs.push(block.type === "bullet" ? bulletParagraph(block.chunks) : richParagraph(block.chunks));
        }
      }

      // Keywords
      if (keywords.length > 0) {
        paragraphs.push(new Paragraph({
          spacing: { after: convertMillimetersToTwip(1) },
          children: [
            new TextRun({ text: keywords.join("  •  "), size: 18, italics: true, color: "888888", font: "Calibri" }),
          ],
        }));
      }
    }
  }

  // ---- Build document ----
  const doc = new Document({
    creator: "DMSuite Resume Builder",
    numbering: {
      config: [{
        reference: "resume-bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: convertMillimetersToTwip(5), hanging: convertMillimetersToTwip(3) } } },
        }],
      }],
    },
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

// ---------------------------------------------------------------------------
// Derive section order from layout metadata (flattens pages → main + sidebar)
// ---------------------------------------------------------------------------

function getSectionOrder(data: ResumeData): Array<keyof typeof data.sections> {
  const DEFAULT_ORDER: Array<keyof typeof data.sections> = [
    "experience", "education", "projects", "skills", "languages",
    "certifications", "awards", "publications", "volunteer", "references", "interests",
  ];

  const layout = data.metadata?.layout;
  if (!layout?.pages?.length) return DEFAULT_ORDER;

  const order: Array<keyof typeof data.sections> = [];
  for (const page of layout.pages) {
    // Main column first, then sidebar
    for (const col of [page.main, page.sidebar]) {
      if (!col?.length) continue;
      for (const key of col) {
        if (key !== "profiles" && !order.includes(key as keyof typeof data.sections)) {
          order.push(key as keyof typeof data.sections);
        }
      }
    }
  }

  // Add any sections not in the layout
  for (const key of DEFAULT_ORDER) {
    if (!order.includes(key)) order.push(key);
  }

  return order;
}
