// =============================================================================
// DMSuite — Resume Export Utilities
// PDF (jsPDF + html2canvas), DOCX (manual), Plain Text, Clipboard, Print.
// All exports are client-side — no server round-trip needed.
// =============================================================================

import type { ResumeData } from "./schema";
import { PAGE_DIMENSIONS } from "./schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportFormat = "pdf" | "docx" | "txt" | "json" | "clipboard" | "print";

export interface ExportOptions {
  /** Resume data to export */
  resume: ResumeData;
  /** File name without extension */
  fileName?: string;
  /** Callback: progress 0..1 */
  onProgress?: (progress: number) => void;
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  error?: string;
}

// ---------------------------------------------------------------------------
// Master export dispatcher
// ---------------------------------------------------------------------------

export async function exportResume(
  format: ExportFormat,
  options: ExportOptions
): Promise<ExportResult> {
  const fileName = options.fileName ?? sanitizeFileName(options.resume.basics.name || "resume");

  try {
    switch (format) {
      case "pdf":
        await exportPDF(options, fileName);
        break;
      case "docx":
        await exportDOCX(options, fileName);
        break;
      case "txt":
        exportPlainText(options, fileName);
        break;
      case "json":
        exportJSON(options, fileName);
        break;
      case "clipboard":
        await exportClipboard(options);
        break;
      case "print":
        exportPrint();
        break;
      default:
        return { success: false, format, error: `Unknown format: ${format}` };
    }
    return { success: true, format };
  } catch (err) {
    return {
      success: false,
      format,
      error: err instanceof Error ? err.message : "Export failed",
    };
  }
}

// ---------------------------------------------------------------------------
// PDF Export — jsPDF + html2canvas (per-page capture)
// ---------------------------------------------------------------------------

async function exportPDF(options: ExportOptions, fileName: string): Promise<void> {
  options.onProgress?.(0.1);

  // Dynamic imports (lazy for bundle size)
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);

  options.onProgress?.(0.2);

  const format = options.resume.metadata.page.format;
  const dims = PAGE_DIMENSIONS[format];

  // ── Locate the resume preview in the DOM ──
  const original = document.getElementById("resume-preview");
  if (!original) {
    throw new Error("Resume preview element not found. Ensure the preview is visible.");
  }

  // ── Clone into an off-screen container for clean capture ──
  // This avoids capturing CSS transforms (zoom/scale) applied by the editor.
  const exportContainer = document.createElement("div");
  exportContainer.style.cssText =
    "position:fixed;left:-9999px;top:0;z-index:-9999;pointer-events:none;";
  document.body.appendChild(exportContainer);

  const clone = original.cloneNode(true) as HTMLElement;
  // Remove the hidden measurement container from the clone
  const measureContainer = clone.querySelector("[data-measure-container]");
  if (measureContainer) measureContainer.remove();
  // Remove overflow warning overlays from pages
  clone.querySelectorAll("[data-resume-page]").forEach((page) => {
    const wrapper = page.parentElement;
    if (wrapper) {
      // Remove sibling warning divs
      Array.from(wrapper.children).forEach((child) => {
        if (child !== page && child.tagName === "DIV") child.remove();
      });
    }
  });
  exportContainer.appendChild(clone);

  // Wait for fonts to be available in the clone's rendering context
  await document.fonts.ready;
  // Multiple frames to ensure fonts are fully applied — fixes text overlap from
  // fonts not being measured correctly on first render pass.
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, 100)); // Extra safety for complex web fonts

  options.onProgress?.(0.4);

  // ── Find all page elements in the clone ──
  const pageElements = clone.querySelectorAll("[data-resume-page]");
  if (pageElements.length === 0) {
    document.body.removeChild(exportContainer);
    throw new Error("No resume pages found for export.");
  }

  // ── Normalise each page for capture ──
  pageElements.forEach((pageEl) => {
    const el = pageEl as HTMLElement;
    el.style.width = `${dims.width}px`;
    el.style.height = `${dims.height}px`;
    el.style.maxHeight = `${dims.height}px`;
    el.style.overflow = "hidden";
    el.style.boxShadow = "none";
    el.style.borderRadius = "0";
    // Remove ring/border indicators
    el.className = el.className.replace(/ring-\S+/g, "").replace(/shadow-\S+/g, "");
    // Remove spacing between pages in the clone
    const wrapper = el.parentElement;
    if (wrapper) wrapper.style.margin = "0";
  });

  // ── Create PDF with correct page size ──
  const isLandscape = dims.width > dims.height;
  const orientation = isLandscape ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [dims.width, dims.height],
    hotfixes: ["px_scaling"],
  });

  // ── Capture each page individually ──
  for (let i = 0; i < pageElements.length; i++) {
    if (i > 0) {
      pdf.addPage([dims.width, dims.height], orientation);
    }

    const pageEl = pageElements[i] as HTMLElement;

    // Detect the actual background color of the page for proper export.
    // Dark templates need their dark backgrounds preserved — not forced to white.
    const computedBg = window.getComputedStyle(pageEl).backgroundColor;
    const exportBgColor = computedBg && computedBg !== "rgba(0, 0, 0, 0)" && computedBg !== "transparent"
      ? computedBg
      : "#ffffff";

    const canvas = await html2canvas(pageEl, {
      scale: 2, // 2× for crisp print output
      useCORS: true,
      logging: false,
      backgroundColor: exportBgColor,
      width: dims.width,
      height: dims.height,
      // Improve text rendering by ensuring font metrics match the original
      onclone: (_doc, clonedEl) => {
        clonedEl.querySelectorAll("*").forEach((el) => {
          const htmlEl = el as HTMLElement;
          const cs = window.getComputedStyle(htmlEl);
          // Copy all font properties to prevent reflow during capture
          if (cs.fontFamily) htmlEl.style.fontFamily = cs.fontFamily;
          if (cs.fontSize) htmlEl.style.fontSize = cs.fontSize;
          if (cs.lineHeight) htmlEl.style.lineHeight = cs.lineHeight;
          if (cs.letterSpacing && cs.letterSpacing !== "normal") {
            htmlEl.style.letterSpacing = cs.letterSpacing;
          }
        });
      },
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", 0, 0, dims.width, dims.height);

    options.onProgress?.(0.4 + 0.5 * ((i + 1) / pageElements.length));
  }

  // ── Clean up the off-screen clone ──
  document.body.removeChild(exportContainer);

  // ── Set document metadata ──
  pdf.setProperties({
    title: `${options.resume.basics.name} - Resume`,
    creator: "DMSuite Resume Builder",
    subject: "Resume / CV",
  });

  pdf.save(`${fileName}.pdf`);
  options.onProgress?.(1.0);
}

// ---------------------------------------------------------------------------
// DOCX Export — generates simple OpenXML via Blob
// ---------------------------------------------------------------------------

async function exportDOCX(options: ExportOptions, fileName: string): Promise<void> {
  options.onProgress?.(0.3);

  const { resume } = options;
  const content = buildDocxXml(resume);

  options.onProgress?.(0.7);

  // Word 2003 XML (flat OPC) — compatible with Word, LibreOffice, and Google Docs.
  // Use the correct MIME type + .doc extension for the Word 2003 WordML format.
  const blob = new Blob([content], {
    type: "application/msword",
  });

  downloadBlob(blob, `${fileName}.doc`);
  options.onProgress?.(1.0);
}

/**
 * Build a simplified Office Open XML flat document.
 * This produces a .docx-compatible file that Word can open.
 */
function buildDocxXml(resume: ResumeData): string {
  const lines: string[] = [];

  // XML header for flat OPC document
  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  lines.push('<?mso-application progid="Word.Document"?>');
  lines.push('<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml" xmlns:wx="http://schemas.microsoft.com/office/word/2003/auxHint">');
  lines.push("<w:body>");

  // Name
  if (resume.basics.name) {
    lines.push(docxParagraph(resume.basics.name, true, 28));
  }

  // Headline
  if (resume.basics.headline) {
    lines.push(docxParagraph(resume.basics.headline, false, 14));
  }

  // Contact line
  const contactParts = [
    resume.basics.email,
    resume.basics.phone,
    resume.basics.location,
    resume.basics.linkedin,
    resume.basics.website.url,
  ].filter(Boolean);
  if (contactParts.length > 0) {
    lines.push(docxParagraph(contactParts.join("  |  "), false, 10));
  }

  lines.push(docxParagraph("", false, 10)); // spacer

  // Summary
  if (!resume.sections.summary.hidden && resume.sections.summary.content) {
    lines.push(docxParagraph(resume.sections.summary.title, true, 14));
    lines.push(docxParagraph(resume.sections.summary.content, false, 11));
    lines.push(docxParagraph("", false, 10));
  }

  // Experience
  if (!resume.sections.experience.hidden && resume.sections.experience.items.length > 0) {
    lines.push(docxParagraph(resume.sections.experience.title, true, 14));
    for (const exp of resume.sections.experience.items) {
      if (exp.hidden) continue;
      lines.push(docxParagraph(`${exp.position} at ${exp.company}`, true, 11));
      const period = `${exp.startDate} - ${exp.isCurrent ? "Present" : exp.endDate}`;
      lines.push(docxParagraph(`${period}${exp.location ? ` | ${exp.location}` : ""}`, false, 10));
      if (exp.description) {
        lines.push(docxParagraph(exp.description, false, 10));
      }
      lines.push(docxParagraph("", false, 10));
    }
  }

  // Education
  if (!resume.sections.education.hidden && resume.sections.education.items.length > 0) {
    lines.push(docxParagraph(resume.sections.education.title, true, 14));
    for (const edu of resume.sections.education.items) {
      if (edu.hidden) continue;
      lines.push(docxParagraph(`${edu.degree} ${edu.field}`, true, 11));
      lines.push(docxParagraph(`${edu.institution} | ${edu.graduationYear}`, false, 10));
    }
    lines.push(docxParagraph("", false, 10));
  }

  // Skills
  if (!resume.sections.skills.hidden && resume.sections.skills.items.length > 0) {
    lines.push(docxParagraph(resume.sections.skills.title, true, 14));
    for (const skill of resume.sections.skills.items) {
      if (skill.hidden) continue;
      const kw = skill.keywords.length > 0 ? `: ${skill.keywords.join(", ")}` : "";
      lines.push(docxParagraph(`${skill.name}${kw}`, false, 10));
    }
    lines.push(docxParagraph("", false, 10));
  }

  // Certifications
  if (!resume.sections.certifications.hidden && resume.sections.certifications.items.length > 0) {
    lines.push(docxParagraph(resume.sections.certifications.title, true, 14));
    for (const cert of resume.sections.certifications.items) {
      if (cert.hidden) continue;
      lines.push(docxParagraph(`${cert.name} — ${cert.issuer} (${cert.year})`, false, 10));
    }
    lines.push(docxParagraph("", false, 10));
  }

  // Languages
  if (!resume.sections.languages.hidden && resume.sections.languages.items.length > 0) {
    lines.push(docxParagraph(resume.sections.languages.title, true, 14));
    for (const lang of resume.sections.languages.items) {
      if (lang.hidden) continue;
      lines.push(docxParagraph(`${lang.name} — ${lang.proficiency}`, false, 10));
    }
    lines.push(docxParagraph("", false, 10));
  }

  // Projects
  if (!resume.sections.projects.hidden && resume.sections.projects.items.length > 0) {
    lines.push(docxParagraph(resume.sections.projects.title, true, 14));
    for (const proj of resume.sections.projects.items) {
      if (proj.hidden) continue;
      lines.push(docxParagraph(proj.name, true, 11));
      if (proj.description) lines.push(docxParagraph(proj.description, false, 10));
      if (proj.url) lines.push(docxParagraph(proj.url, false, 10));
    }
    lines.push(docxParagraph("", false, 10));
  }

  // Volunteer
  if (!resume.sections.volunteer.hidden && resume.sections.volunteer.items.length > 0) {
    lines.push(docxParagraph(resume.sections.volunteer.title, true, 14));
    for (const vol of resume.sections.volunteer.items) {
      if (vol.hidden) continue;
      lines.push(docxParagraph(`${vol.role} at ${vol.organization}`, true, 11));
      if (vol.description) lines.push(docxParagraph(vol.description, false, 10));
    }
    lines.push(docxParagraph("", false, 10));
  }

  // Awards
  if (!resume.sections.awards.hidden && resume.sections.awards.items.length > 0) {
    lines.push(docxParagraph(resume.sections.awards.title, true, 14));
    for (const award of resume.sections.awards.items) {
      if (award.hidden) continue;
      lines.push(docxParagraph(`${award.title} — ${award.issuer} (${award.date})`, false, 10));
    }
    lines.push(docxParagraph("", false, 10));
  }

  // References
  if (!resume.sections.references.hidden && resume.sections.references.items.length > 0) {
    lines.push(docxParagraph(resume.sections.references.title, true, 14));
    for (const ref of resume.sections.references.items) {
      if (ref.hidden) continue;
      lines.push(docxParagraph(`${ref.name} — ${ref.relationship}`, false, 10));
      if (ref.email) lines.push(docxParagraph(ref.email, false, 10));
    }
  }

  lines.push("</w:body>");
  lines.push("</w:wordDocument>");

  return lines.join("\n");
}

function docxParagraph(text: string, bold: boolean, fontSize: number): string {
  const halfPt = fontSize * 2; // Word uses half-points
  const boldTag = bold ? "<w:b/>" : "";
  const escaped = escapeXml(text);
  return `<w:p><w:pPr><w:rPr>${boldTag}<w:sz w:val="${halfPt}"/></w:rPr></w:pPr><w:r><w:rPr>${boldTag}<w:sz w:val="${halfPt}"/></w:rPr><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
}

// ---------------------------------------------------------------------------
// Plain Text Export
// ---------------------------------------------------------------------------

function exportPlainText(options: ExportOptions, fileName: string): void {
  const text = buildPlainText(options.resume);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${fileName}.txt`);
  options.onProgress?.(1.0);
}

/**
 * Build an ATS-friendly plain text version of the resume.
 * No formatting, no special characters — just clean text.
 */
export function buildPlainText(resume: ResumeData): string {
  const lines: string[] = [];

  // Header
  if (resume.basics.name) lines.push(resume.basics.name.toUpperCase());
  if (resume.basics.headline) lines.push(resume.basics.headline);
  const contact = [
    resume.basics.email,
    resume.basics.phone,
    resume.basics.location,
    resume.basics.linkedin,
    resume.basics.website.url,
  ].filter(Boolean).join(" | ");
  if (contact) lines.push(contact);
  lines.push("");

  // Summary
  if (!resume.sections.summary.hidden && resume.sections.summary.content) {
    lines.push(resume.sections.summary.title.toUpperCase());
    lines.push(separatorLine());
    lines.push(stripHtml(resume.sections.summary.content));
    lines.push("");
  }

  // Experience
  if (!resume.sections.experience.hidden && resume.sections.experience.items.length > 0) {
    lines.push(resume.sections.experience.title.toUpperCase());
    lines.push(separatorLine());
    for (const exp of resume.sections.experience.items) {
      if (exp.hidden) continue;
      lines.push(`${exp.position} | ${exp.company}`);
      lines.push(`${exp.startDate} - ${exp.isCurrent ? "Present" : exp.endDate}${exp.location ? ` | ${exp.location}` : ""}`);
      if (exp.description) {
        lines.push(stripHtml(exp.description));
      }
      lines.push("");
    }
  }

  // Education
  if (!resume.sections.education.hidden && resume.sections.education.items.length > 0) {
    lines.push(resume.sections.education.title.toUpperCase());
    lines.push(separatorLine());
    for (const edu of resume.sections.education.items) {
      if (edu.hidden) continue;
      lines.push(`${edu.degree} ${edu.field}`);
      lines.push(`${edu.institution} | ${edu.graduationYear}`);
      lines.push("");
    }
  }

  // Skills
  if (!resume.sections.skills.hidden && resume.sections.skills.items.length > 0) {
    lines.push(resume.sections.skills.title.toUpperCase());
    lines.push(separatorLine());
    for (const skill of resume.sections.skills.items) {
      if (skill.hidden) continue;
      const kw = skill.keywords.length > 0 ? `: ${skill.keywords.join(", ")}` : "";
      lines.push(`${skill.name}${kw}`);
    }
    lines.push("");
  }

  // Certifications
  if (!resume.sections.certifications.hidden && resume.sections.certifications.items.length > 0) {
    lines.push(resume.sections.certifications.title.toUpperCase());
    lines.push(separatorLine());
    for (const cert of resume.sections.certifications.items) {
      if (cert.hidden) continue;
      lines.push(`${cert.name} - ${cert.issuer} (${cert.year})`);
    }
    lines.push("");
  }

  // Languages
  if (!resume.sections.languages.hidden && resume.sections.languages.items.length > 0) {
    lines.push(resume.sections.languages.title.toUpperCase());
    lines.push(separatorLine());
    for (const lang of resume.sections.languages.items) {
      if (lang.hidden) continue;
      lines.push(`${lang.name} - ${lang.proficiency}`);
    }
    lines.push("");
  }

  // Projects
  if (!resume.sections.projects.hidden && resume.sections.projects.items.length > 0) {
    lines.push(resume.sections.projects.title.toUpperCase());
    lines.push(separatorLine());
    for (const proj of resume.sections.projects.items) {
      if (proj.hidden) continue;
      lines.push(proj.name);
      if (proj.description) lines.push(stripHtml(proj.description));
      if (proj.url) lines.push(proj.url);
      lines.push("");
    }
  }

  // Volunteer
  if (!resume.sections.volunteer.hidden && resume.sections.volunteer.items.length > 0) {
    lines.push(resume.sections.volunteer.title.toUpperCase());
    lines.push(separatorLine());
    for (const vol of resume.sections.volunteer.items) {
      if (vol.hidden) continue;
      lines.push(`${vol.role} at ${vol.organization}`);
      if (vol.description) lines.push(stripHtml(vol.description));
      lines.push("");
    }
  }

  // Awards
  if (!resume.sections.awards.hidden && resume.sections.awards.items.length > 0) {
    lines.push(resume.sections.awards.title.toUpperCase());
    lines.push(separatorLine());
    for (const award of resume.sections.awards.items) {
      if (award.hidden) continue;
      lines.push(`${award.title} - ${award.issuer} (${award.date})`);
    }
    lines.push("");
  }

  // References
  if (!resume.sections.references.hidden && resume.sections.references.items.length > 0) {
    lines.push(resume.sections.references.title.toUpperCase());
    lines.push(separatorLine());
    for (const ref of resume.sections.references.items) {
      if (ref.hidden) continue;
      lines.push(`${ref.name} - ${ref.relationship}`);
      if (ref.email) lines.push(ref.email);
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

// ---------------------------------------------------------------------------
// JSON Export
// ---------------------------------------------------------------------------

function exportJSON(options: ExportOptions, fileName: string): void {
  const json = JSON.stringify(options.resume, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `${fileName}.json`);
  options.onProgress?.(1.0);
}

// ---------------------------------------------------------------------------
// Clipboard Export
// ---------------------------------------------------------------------------

async function exportClipboard(options: ExportOptions): Promise<void> {
  const text = buildPlainText(options.resume);

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  options.onProgress?.(1.0);
}

// ---------------------------------------------------------------------------
// Print Export
// ---------------------------------------------------------------------------

function exportPrint(): void {
  // The print stylesheet should handle layout
  // We target the #resume-preview element specifically
  window.print();
}

// ---------------------------------------------------------------------------
// Utility Helpers
// ---------------------------------------------------------------------------

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Delay revoke to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 50) || "resume";
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function separatorLine(): string {
  return "─".repeat(50);
}
