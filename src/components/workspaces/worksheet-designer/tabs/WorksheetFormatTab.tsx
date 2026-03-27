// =============================================================================
// Worksheet Format Tab — Page size, margins, spacing, line spacing, field size
// =============================================================================

"use client";

import { useState } from "react";
import { useWorksheetEditor } from "@/stores/worksheet-editor";
import { PAGE_FORMATS } from "@/lib/worksheet/schema";
import type { WorksheetPrintConfig } from "@/lib/worksheet/schema";
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
  fieldSize: <SIcon d="M4 6h16M4 12h16M4 18h7" />,
};

export default function WorksheetFormatTab() {
  const store = useWorksheetEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({
    page: true,
    margins: true,
    spacing: false,
    lineSpacing: false,
    fieldSize: false,
  });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const pageSizeOptions = PAGE_FORMATS.map((pf) => ({
    value: pf,
    label: pf.toUpperCase(),
  }));

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

  const fieldSizeOptions = [
    { value: "compact", label: "Compact" },
    { value: "standard", label: "Standard" },
    { value: "large", label: "Large" },
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
          onChange={(v) => store.updatePrintConfig({ pageSize: v as WorksheetPrintConfig["pageSize"] })}
          direction="grid"
          columns={2}
        />
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
          onChange={(v) => store.updatePrintConfig({ margins: v as WorksheetPrintConfig["margins"] })}
          direction="grid"
          columns={3}
        />
      </AccordionSection>

      {/* Section Spacing */}
      <AccordionSection
        title="Section Spacing"
        icon={icons.spacing}
        badge={`Level ${store.form.printConfig.sectionSpacing}`}
        isOpen={open.spacing}
        onToggle={() => toggle("spacing")}
      >
        <RangeSlider
          label="Gap between sections"
          min={0}
          max={4}
          step={1}
          value={store.form.printConfig.sectionSpacing}
          onChange={(v) => store.updatePrintConfig({ sectionSpacing: v })}
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
          onChange={(v) => store.updatePrintConfig({ lineSpacing: v as WorksheetPrintConfig["lineSpacing"] })}
          direction="grid"
          columns={3}
        />
      </AccordionSection>

      {/* Field Size (for handwriting areas) */}
      <AccordionSection
        title="Field Size"
        icon={icons.fieldSize}
        badge={store.form.printConfig.fieldSize}
        isOpen={open.fieldSize}
        onToggle={() => toggle("fieldSize")}
      >
        <ChipGroup
          options={fieldSizeOptions}
          value={store.form.printConfig.fieldSize}
          onChange={(v) => store.updatePrintConfig({ fieldSize: v as WorksheetPrintConfig["fieldSize"] })}
          direction="grid"
          columns={3}
        />
        <p className="text-[9px] text-gray-500 mt-1.5">
          Controls the height of text fields, writing lines, and input areas. Use &quot;Large&quot; for younger students or handwritten forms.
        </p>
      </AccordionSection>
    </div>
  );
}
