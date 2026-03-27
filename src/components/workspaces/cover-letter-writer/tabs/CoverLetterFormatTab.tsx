// =============================================================================
// Cover Letter Format Tab — Page size, margins, spacing, line spacing
// =============================================================================

"use client";

import { useState } from "react";
import { useCoverLetterEditor } from "@/stores/cover-letter-editor";
import type { PrintConfig } from "@/stores/cover-letter-editor";
import {
  AccordionSection,
  ChipGroup,
  RangeSlider,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

const icons = {
  page: <SIcon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  margins: <SIcon d="M4 4h16v16H4V4zm2 2v12h12V6H6z" />,
  spacing: <SIcon d="M4 6h16M4 12h16M4 18h16" />,
  lineSpacing: <SIcon d="M4 5h16M4 9h16M4 13h16M4 17h16" />,
};

export default function CoverLetterFormatTab() {
  const store = useCoverLetterEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({
    page: true,
    margins: true,
    spacing: false,
    lineSpacing: false,
  });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const pageSizeOptions = [
    { value: "a4", label: "A4" },
    { value: "letter", label: "Letter" },
    { value: "a5", label: "A5" },
  ];

  const marginOptions = [
    { value: "narrow", label: "Narrow" },
    { value: "standard", label: "Standard" },
    { value: "wide", label: "Wide" },
  ];

  const lineSpacingOptions = [
    { value: "tight", label: "Tight" },
    { value: "normal", label: "Normal" },
    { value: "loose", label: "Loose" },
  ];

  return (
    <div className="space-y-2">
      {/* Page Size */}
      <AccordionSection
        title="Page Size"
        icon={icons.page}
        badge={store.form.printConfig.pageSize.toUpperCase()}
        isOpen={open.page}
        onToggle={() => toggle("page")}
      >
        <ChipGroup
          options={pageSizeOptions}
          value={store.form.printConfig.pageSize}
          onChange={(v) => store.updatePrint({ pageSize: v as PrintConfig["pageSize"] })}
          direction="grid"
          columns={3}
        />
        <p className="text-[10px] text-gray-600 mt-2">
          A4 (210 × 297 mm) is standard internationally. Letter (8.5 × 11 in) is standard in the US.
        </p>
      </AccordionSection>

      {/* Margins */}
      <AccordionSection
        title="Margins"
        icon={icons.margins}
        badge={store.form.printConfig.margins}
        isOpen={open.margins}
        onToggle={() => toggle("margins")}
      >
        <ChipGroup
          options={marginOptions}
          value={store.form.printConfig.margins}
          onChange={(v) => store.updatePrint({ margins: v as PrintConfig["margins"] })}
          direction="grid"
          columns={3}
        />
      </AccordionSection>

      {/* Section Spacing */}
      <AccordionSection
        title="Section Spacing"
        icon={icons.spacing}
        badge={`${store.form.printConfig.sectionSpacing}px`}
        isOpen={open.spacing}
        onToggle={() => toggle("spacing")}
      >
        <RangeSlider
          label="Gap between paragraphs"
          min={8}
          max={32}
          step={2}
          value={store.form.printConfig.sectionSpacing}
          onChange={(v) => store.updatePrint({ sectionSpacing: v })}
        />
      </AccordionSection>

      {/* Line Spacing */}
      <AccordionSection
        title="Line Spacing"
        icon={icons.lineSpacing}
        badge={store.form.printConfig.lineSpacing}
        isOpen={open.lineSpacing}
        onToggle={() => toggle("lineSpacing")}
      >
        <ChipGroup
          options={lineSpacingOptions}
          value={store.form.printConfig.lineSpacing}
          onChange={(v) => store.updatePrint({ lineSpacing: v as PrintConfig["lineSpacing"] })}
          direction="grid"
          columns={3}
        />
      </AccordionSection>

      {/* Export info */}
      <div className="mx-3 mt-4 p-3 rounded-xl border border-gray-700/40 bg-gray-800/20">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Your cover letter will be exported at exact page dimensions with print-quality fonts via PDF. For best results, use your browser&apos;s &ldquo;Save as PDF&rdquo; option when the print dialog appears.
        </p>
      </div>
    </div>
  );
}
