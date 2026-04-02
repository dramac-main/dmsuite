// =============================================================================
// Resume & CV — Export Dropdown
// Supports: PDF, DOCX, TXT, JSON, clipboard, print
// =============================================================================

"use client";

import React, { useCallback, useRef, useState } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import type { ResumeData } from "@/lib/resume/schema";
import { generateDocx } from "@/lib/resume/docx-builder";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

type ExportFormat = "pdf" | "docx" | "txt" | "json" | "clipboard" | "print";

const EXPORT_OPTIONS: { format: ExportFormat; label: string; description: string }[] = [
  { format: "pdf", label: "PDF", description: "Print-ready document" },
  { format: "docx", label: "DOCX", description: "Word-compatible" },
  { format: "txt", label: "Plain Text", description: "ATS-friendly text" },
  { format: "json", label: "JSON", description: "Data backup / import" },
  { format: "clipboard", label: "Copy Text", description: "Paste anywhere" },
  { format: "print", label: "Print", description: "Browser print dialog" },
];

// ---------------------------------------------------------------------------
// Export functions
// ---------------------------------------------------------------------------

function resumeToPlainText(data: ResumeData): string {
  const lines: string[] = [];
  const b = data?.basics;
  if (b?.name) lines.push(b.name.toUpperCase());
  if (b?.headline) lines.push(b.headline);
  const contact = [b?.email, b?.phone, b?.location, b?.website?.url].filter(Boolean).join(" | ");
  if (contact) lines.push(contact);
  lines.push("");

  if (data?.summary?.content && !data.summary.hidden) {
    lines.push("SUMMARY");
    lines.push("-".repeat(40));
    lines.push(stripHtml(data.summary.content));
    lines.push("");
  }

  const sectionOrder: Array<keyof typeof data.sections> = [
    "experience", "education", "projects", "skills", "languages",
    "certifications", "awards", "publications", "volunteer", "references", "interests", "profiles",
  ];

  for (const key of sectionOrder) {
    const section = data?.sections?.[key];
    if (!section || section.hidden || !section.items?.length) continue;
    lines.push((section.title || key).toUpperCase());
    lines.push("-".repeat(40));
    for (const item of section.items) {
      if ((item as { hidden?: boolean }).hidden) continue;
      const title = (item as Record<string, unknown>).position ?? (item as Record<string, unknown>).title ?? (item as Record<string, unknown>).name ?? (item as Record<string, unknown>).school ?? (item as Record<string, unknown>).organization ?? (item as Record<string, unknown>).language ?? "";
      const subtitle = (item as Record<string, unknown>).company ?? (item as Record<string, unknown>).issuer ?? (item as Record<string, unknown>).publisher ?? (item as Record<string, unknown>).awarder ?? (item as Record<string, unknown>).network ?? "";
      const period = (item as Record<string, unknown>).period ?? (item as Record<string, unknown>).date ?? "";
      const desc = (item as Record<string, unknown>).description ?? "";
      const keywords = ((item as Record<string, unknown>).keywords ?? []) as string[];

      const parts = [title, subtitle, period].filter(Boolean);
      lines.push(parts.join(" — "));
      if (desc) lines.push(stripHtml(String(desc)));
      if (keywords.length > 0) lines.push(`Keywords: ${keywords.join(", ")}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(text: string, filename: string, mime = "text/plain") {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExportDropdownProps {
  printAreaRef: React.RefObject<HTMLDivElement | null>;
}

export default function ExportDropdown({ printAreaRef }: ExportDropdownProps) {
  const resume = useResumeEditor((s) => s.resume);
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setExporting(format);
      const name = resume?.basics?.name || "resume";
      const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");

      try {
        switch (format) {
          case "json":
            downloadText(JSON.stringify(resume, null, 2), `${safeName}.json`, "application/json");
            break;

          case "txt":
            downloadText(resumeToPlainText(resume), `${safeName}.txt`);
            break;

          case "docx": {
            const docxBlob = await generateDocx(resume);
            downloadBlob(docxBlob, `${safeName}.docx`);
            break;
          }

          case "clipboard": {
            const text = resumeToPlainText(resume);
            await navigator.clipboard.writeText(text);
            break;
          }

          case "print":
            if (printAreaRef.current) {
              // Clone the resume at 100% zoom so print output is clean
              const clone = printAreaRef.current.cloneNode(true) as HTMLElement;
              // Remove any transform scaling from the clone
              const pages = clone.querySelectorAll(".resume-page");
              clone.style.transform = "none";
              const printWindow = window.open("", "_blank");
              if (printWindow) {
                // Copy font stylesheets
                const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                  .map((el) => el.outerHTML).join("\n");
                const styleTags = Array.from(document.querySelectorAll("style"))
                  .map((el) => el.outerHTML).join("\n");
                printWindow.document.write(`<html><head><title>${name} — Resume</title>
                  ${linkTags}
                  ${styleTags}
                  <style>
                    body{margin:0;padding:0;background:#fff}
                    .resume-page{box-shadow:none!important}
                    @media print{@page{margin:0;size:auto}.resume-page{box-shadow:none!important}}
                  </style>
                  </head><body>${clone.outerHTML}</body></html>`);
                printWindow.document.close();
                // Wait for fonts to load before printing
                setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
              }
            }
            break;

          case "pdf":
            if (printAreaRef.current) {
              // Find all resume pages and export each as a PDF page
              const pageElements = printAreaRef.current.querySelectorAll(".resume-page");
              const elements = pageElements.length > 0 ? Array.from(pageElements) : [printAreaRef.current];
              const format = resume?.metadata?.page?.format === "letter" ? "letter" : "a4";
              const pdfWidthMM = format === "letter" ? 215.9 : 210;
              const pdfHeightMM = format === "letter" ? 279.4 : 297;

              const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format });

              for (let i = 0; i < elements.length; i++) {
                const el = elements[i] as HTMLElement;
                const canvas = await html2canvas(el, {
                  scale: 2,
                  useCORS: true,
                  logging: false,
                  backgroundColor: "#ffffff",
                });
                const imgData = canvas.toDataURL("image/png");
                if (i > 0) pdf.addPage(format, "portrait");
                pdf.addImage(imgData, "PNG", 0, 0, pdfWidthMM, pdfHeightMM);
              }
              pdf.save(`${safeName}.pdf`);
            }
            break;
        }
      } finally {
        setExporting(null);
        setOpen(false);
      }
    },
    [resume, printAreaRef],
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 border border-primary-500/30 transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl bg-gray-900/95 border border-gray-700/50 shadow-xl overflow-hidden">
            {EXPORT_OPTIONS.map((opt) => (
              <button
                key={opt.format}
                onClick={() => handleExport(opt.format)}
                disabled={!!exporting}
                className="flex items-start gap-3 w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-gray-200">{opt.label}</div>
                  <div className="text-[10px] text-gray-500">{opt.description}</div>
                </div>
                {exporting === opt.format && (
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export API for Chiko and scripts
// ---------------------------------------------------------------------------

export async function exportResume(
  resume: ResumeData,
  format: ExportFormat,
): Promise<{ success: boolean; message: string }> {
  const name = resume?.basics?.name || "resume";
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");

  switch (format) {
    case "json":
      downloadText(JSON.stringify(resume, null, 2), `${safeName}.json`, "application/json");
      return { success: true, message: `Exported ${safeName}.json` };
    case "txt":
      downloadText(resumeToPlainText(resume), `${safeName}.txt`);
      return { success: true, message: `Exported ${safeName}.txt` };
    case "docx": {
      const docxBlob = await generateDocx(resume);
      downloadBlob(docxBlob, `${safeName}.docx`);
      return { success: true, message: `Exported ${safeName}.docx` };
    }
    case "clipboard": {
      await navigator.clipboard.writeText(resumeToPlainText(resume));
      return { success: true, message: "Copied to clipboard" };
    }
    default:
      return { success: false, message: `Export format "${format}" requires browser context (use the Export button)` };
  }
}
