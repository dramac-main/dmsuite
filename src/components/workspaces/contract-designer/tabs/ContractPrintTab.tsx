// =============================================================================
// DMSuite — Contract Print Tab
// Page size, page border, watermark, signature config.
// Follows SalesPrintTab layout patterns.
// =============================================================================

"use client";

import { useState } from "react";
import { useContractEditor } from "@/stores/contract-editor";
import { PAGE_DIMENSIONS } from "@/lib/contract/schema";
import {
  AccordionSection,
  Toggle,
  FormInput,
  FormSelect,
  ChipGroup,
  SectionLabel,
  SelectionCard,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

const icons = {
  page: <SIcon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />,
  watermark: <SIcon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  signature: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 17c1.5-2.5 4-4 7-4s5.5 1.5 7 4" />
      <path d="M17 13c1 0 2-.5 3-1.5s2-2 2-3.5c0-2-1-3-3-3s-3 1-3 3c0 1.5 1 2.5 2 3.5s2 1.5 3 1.5" />
    </svg>
  ),
  numbering: <SIcon d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />,
};

export default function ContractPrintTab() {
  const form = useContractEditor((s) => s.form);
  const updatePrint = useContractEditor((s) => s.updatePrint);
  const updateSignature = useContractEditor((s) => s.updateSignatureConfig);
  const updateStyle = useContractEditor((s) => s.updateStyle);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    page: true,
    watermark: false,
    signature: true,
    numbering: false,
  });

  const toggle = (key: string) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div>
      {/* ── Page Size & Border ── */}
      <AccordionSection
        title="Page Setup"
        icon={icons.page}
        isOpen={openSections.page}
        onToggle={() => toggle("page")}
      >
        <SectionLabel>Page Size</SectionLabel>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(["a4", "letter", "legal"] as const).map((size) => {
            const dim = PAGE_DIMENSIONS[size];
            return (
              <SelectionCard
                key={size}
                selected={form.printConfig.pageSize === size}
                onClick={() => updatePrint({ pageSize: size })}
                className="p-3"
              >
                <div className="text-center">
                  <span className="text-[12px] text-gray-200 font-medium block">
                    {dim.label.split(" ")[0]}
                  </span>
                  <span className="text-[9px] text-gray-500 mt-0.5 block">
                    {dim.label.match(/\((.+)\)/)?.[1]}
                  </span>
                </div>
              </SelectionCard>
            );
          })}
        </div>

        <Toggle
          checked={form.printConfig.showPageBorder}
          onChange={(v) => updatePrint({ showPageBorder: v })}
          label="Show page border"
        />
      </AccordionSection>

      {/* ── Watermark ── */}
      <AccordionSection
        title="Watermark"
        icon={icons.watermark}
        isOpen={openSections.watermark}
        onToggle={() => toggle("watermark")}
      >
        <Toggle
          checked={form.printConfig.showWatermark}
          onChange={(v) => updatePrint({ showWatermark: v })}
          label="Show watermark"
        />
        {form.printConfig.showWatermark && (
          <div className="mt-3">
            <FormInput
              label="Watermark Text"
              value={form.printConfig.watermarkText}
              onChange={(e) => updatePrint({ watermarkText: e.target.value })}
              placeholder="DRAFT"
            />
          </div>
        )}
      </AccordionSection>

      {/* ── Signature Configuration ── */}
      <AccordionSection
        title="Signatures"
        icon={icons.signature}
        isOpen={openSections.signature}
        onToggle={() => toggle("signature")}
      >
        <div className="space-y-3">
          <Toggle
            checked={form.signatureConfig.showDate}
            onChange={(v) => updateSignature({ showDate: v })}
            label="Show date line"
          />
          <Toggle
            checked={form.signatureConfig.showWitness}
            onChange={(v) => updateSignature({ showWitness: v })}
            label="Show witness signatures"
          />
          {form.signatureConfig.showWitness && (
            <FormSelect
              label="No. of Witnesses"
              value={String(form.signatureConfig.witnessCount)}
              onChange={(e) => updateSignature({ witnessCount: Number(e.target.value) })}
            >
              <option value="1">1 Witness</option>
              <option value="2">2 Witnesses</option>
              <option value="3">3 Witnesses</option>
            </FormSelect>
          )}
          <Toggle
            checked={form.signatureConfig.showSeal}
            onChange={(v) => updateSignature({ showSeal: v })}
            label="Show company seal placeholder"
          />
          <div>
            <SectionLabel>Signature Line Style</SectionLabel>
            <ChipGroup
              options={[
                { value: "solid", label: "Solid" },
                { value: "dotted", label: "Dotted" },
              ]}
              value={form.signatureConfig.lineStyle}
              onChange={(v) => updateSignature({ lineStyle: v as "solid" | "dotted" })}
            />
          </div>
        </div>
      </AccordionSection>

      {/* ── Page Numbering ── */}
      <AccordionSection
        title="Page Numbering"
        icon={icons.numbering}
        isOpen={openSections.numbering}
        onToggle={() => toggle("numbering")}
      >
        <Toggle
          checked={form.style.pageNumbering}
          onChange={(v) => updateStyle({ pageNumbering: v })}
          label="Show page numbers"
        />
        {form.style.pageNumbering && (
          <div className="mt-3">
            <ChipGroup
              options={[
                { value: "bottom-center", label: "Center" },
                { value: "bottom-right", label: "Right" },
              ]}
              value={form.style.pageNumberPosition}
              onChange={(v) => updateStyle({ pageNumberPosition: v as "bottom-center" | "bottom-right" })}
            />
          </div>
        )}
      </AccordionSection>
    </div>
  );
}
