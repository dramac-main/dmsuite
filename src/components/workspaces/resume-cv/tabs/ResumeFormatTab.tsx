// =============================================================================
// DMSuite — Resume Format Tab
// Page format, spacing, and output settings.
// Mirrors Contract's Print tab pattern: page size, margins, spacing controls.
// =============================================================================

"use client";

import { useResumeEditor } from "@/stores/resume-editor";
import { PAGE_FORMAT_LABELS, type PageFormat } from "@/lib/resume/schema";

// ── Section heading ──

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60 pb-1.5 mb-3">
      {children}
    </h3>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function ResumeFormatTab() {
  const resume = useResumeEditor((s) => s.resume);
  const updateResume = useResumeEditor((s) => s.updateResume);

  return (
    <div className="space-y-5 p-4">
      {/* ── Page Size ── */}
      <div>
        <SectionHeading>Page Size</SectionHeading>
        <div className="space-y-2">
          <p className="text-[10px] text-gray-600 uppercase tracking-wide">
            Print
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              Object.entries(PAGE_FORMAT_LABELS) as [
                PageFormat,
                { label: string; group: string },
              ][]
            )
              .filter(([, meta]) => meta.group === "print")
              .map(([fmt, meta]) => (
                <button
                  key={fmt}
                  onClick={() =>
                    updateResume((d) => {
                      d.metadata.page.format = fmt;
                    })
                  }
                  className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                    resume.metadata.page.format === fmt
                      ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                      : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {meta.label}
                </button>
              ))}
          </div>

          <p className="text-[10px] text-gray-600 uppercase tracking-wide mt-3">
            Web &amp; Social
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              Object.entries(PAGE_FORMAT_LABELS) as [
                PageFormat,
                { label: string; group: string },
              ][]
            )
              .filter(([, meta]) => meta.group === "web")
              .map(([fmt, meta]) => (
                <button
                  key={fmt}
                  onClick={() =>
                    updateResume((d) => {
                      d.metadata.page.format = fmt;
                    })
                  }
                  className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                    resume.metadata.page.format === fmt
                      ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                      : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {meta.label}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* ── Section Spacing ── */}
      <div>
        <SectionHeading>Section Spacing</SectionHeading>
        <div className="grid grid-cols-3 gap-2">
          {(["compact", "standard", "relaxed"] as const).map((sp) => (
            <button
              key={sp}
              onClick={() =>
                updateResume((d) => {
                  d.metadata.page.sectionSpacing = sp;
                })
              }
              className={`rounded-lg border py-2 text-xs font-medium transition-all capitalize ${
                resume.metadata.page.sectionSpacing === sp
                  ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                  : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
              }`}
            >
              {sp}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5">
          Controls vertical space between resume sections
        </p>
      </div>

      {/* ── Page Margins ── */}
      <div>
        <SectionHeading>Margins</SectionHeading>
        <div className="grid grid-cols-3 gap-2">
          {(["narrow", "standard", "wide"] as const).map((margin) => (
            <button
              key={margin}
              onClick={() =>
                updateResume((d) => {
                  d.metadata.page.marginPreset = margin;
                })
              }
              className={`rounded-lg border py-2 text-xs font-medium transition-all capitalize ${
                resume.metadata.page.marginPreset === margin
                  ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                  : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
              }`}
            >
              {margin}
            </button>
          ))}
        </div>
      </div>

      {/* ── Line Spacing ── */}
      <div>
        <SectionHeading>Line Spacing</SectionHeading>
        <div className="grid grid-cols-3 gap-2">
          {(["tight", "normal", "loose"] as const).map((ls) => (
            <button
              key={ls}
              onClick={() =>
                updateResume((d) => {
                  d.metadata.page.lineSpacing = ls;
                })
              }
              className={`rounded-lg border py-2 text-xs font-medium transition-all capitalize ${
                resume.metadata.page.lineSpacing === ls
                  ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                  : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
              }`}
            >
              {ls}
            </button>
          ))}
        </div>
      </div>

      {/* ── Export info ── */}
      <div className="rounded-lg border border-gray-800/50 bg-gray-800/20 p-3 space-y-2">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
          Export Options
        </h4>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Use the Export button in the preview toolbar to print or download
          your resume as PDF, DOCX, JSON, or plain text.
        </p>
      </div>
    </div>
  );
}
