// =============================================================================
// DMSuite — Contract Document Tab
// Contract type selection, title, dates, jurisdiction, preamble.
// =============================================================================

"use client";

import React, { useState } from "react";
import { useContractEditor } from "@/stores/contract-editor";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_CONFIGS,
  type ContractType,
} from "@/lib/contract/schema";
import {
  AccordionSection,
  Toggle,
  FormInput,
  FormTextarea,
  SIcon,
  SelectionCard,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// Section icons
const icons = {
  type: <SIcon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  info: <SIcon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  legal: <SIcon d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />,
  preamble: <SIcon d="M4 6h16M4 10h16M4 14h10" />,
};

const CONTRACT_TYPE_ICONS: Record<string, string> = {
  "service-agreement": "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  "nda": "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  "employment-contract": "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  "freelance-agreement": "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  "partnership-agreement": "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  "lease-agreement": "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  "sales-agreement": "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
  "consulting-agreement": "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
};

export default function ContractDocumentTab() {
  const form = useContractEditor((s) => s.form);
  const setContractType = useContractEditor((s) => s.setContractType);
  const updateDocumentInfo = useContractEditor((s) => s.updateDocumentInfo);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    type: true,
    info: true,
    legal: false,
    preamble: false,
  });

  const toggle = (key: string) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div>
      {/* Contract Type Selection */}
      <AccordionSection
        title="Contract Type"
        icon={icons.type}
        isOpen={openSections.type}
        onToggle={() => toggle("type")}
        badge={CONTRACT_TYPE_CONFIGS[form.contractType].shortLabel}
      >
        <div className="grid grid-cols-2 gap-2">
          {CONTRACT_TYPES.map((type) => {
            const cfg = CONTRACT_TYPE_CONFIGS[type];
            const selected = form.contractType === type;
            return (
              <SelectionCard key={type} selected={selected} onClick={() => setContractType(type)}>
                <div className="flex items-start gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={selected ? "text-primary-400" : "text-gray-500"}>
                    <path d={CONTRACT_TYPE_ICONS[type] ?? CONTRACT_TYPE_ICONS["service-agreement"]} />
                  </svg>
                  <div className="min-w-0">
                    <div className={`text-[12px] font-semibold ${selected ? "text-primary-300" : "text-gray-300"}`}>{cfg.shortLabel}</div>
                    <div className="text-[10px] text-gray-500 leading-tight mt-0.5 line-clamp-2">{cfg.description}</div>
                  </div>
                </div>
              </SelectionCard>
            );
          })}
        </div>
      </AccordionSection>

      {/* Document Information */}
      <AccordionSection
        title="Document Details"
        icon={icons.info}
        isOpen={openSections.info}
        onToggle={() => toggle("info")}
      >
        <div className="space-y-3">
          <FormInput
            label="Contract Title"
            value={form.documentInfo.title}
            onChange={(e) => updateDocumentInfo({ title: e.target.value })}
            placeholder="e.g. Service Agreement"
          />
          <FormInput
            label="Subtitle (optional)"
            value={form.documentInfo.subtitle}
            onChange={(e) => updateDocumentInfo({ subtitle: e.target.value })}
            placeholder="e.g. For Web Development Services"
          />
          <FormInput
            label="Reference Number"
            value={form.documentInfo.referenceNumber}
            onChange={(e) => updateDocumentInfo({ referenceNumber: e.target.value })}
            placeholder="e.g. CA-2026-001"
          />
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Effective Date"
              type="date"
              value={form.documentInfo.effectiveDate}
              onChange={(e) => updateDocumentInfo({ effectiveDate: e.target.value })}
            />
            <FormInput
              label="Expiry Date"
              type="date"
              value={form.documentInfo.expiryDate}
              onChange={(e) => updateDocumentInfo({ expiryDate: e.target.value })}
            />
          </div>
          <Toggle
            label="Show 'CONFIDENTIAL' banner"
            description="Displays a confidential label on the document"
            checked={form.documentInfo.showConfidentialBanner}
            onChange={(v) => updateDocumentInfo({ showConfidentialBanner: v })}
          />
          <Toggle
            label="Show Table of Contents"
            description="Auto-generated from enabled clauses"
            checked={form.documentInfo.showTableOfContents}
            onChange={(v) => updateDocumentInfo({ showTableOfContents: v })}
          />
        </div>
      </AccordionSection>

      {/* Legal / Jurisdiction */}
      <AccordionSection
        title="Jurisdiction & Law"
        icon={icons.legal}
        isOpen={openSections.legal}
        onToggle={() => toggle("legal")}
      >
        <div className="space-y-3">
          <FormInput
            label="Jurisdiction"
            value={form.documentInfo.jurisdiction}
            onChange={(e) => updateDocumentInfo({ jurisdiction: e.target.value })}
            placeholder="e.g. Republic of Zambia"
          />
          <FormInput
            label="Governing Law"
            value={form.documentInfo.governingLaw}
            onChange={(e) => updateDocumentInfo({ governingLaw: e.target.value })}
            placeholder="e.g. Laws of the Republic of Zambia"
          />
        </div>
      </AccordionSection>

      {/* Preamble */}
      <AccordionSection
        title="Preamble / Recitals"
        icon={icons.preamble}
        isOpen={openSections.preamble}
        onToggle={() => toggle("preamble")}
      >
        <FormTextarea
          label="Opening statement"
          hint="Introduction text that sets context for the agreement"
          value={form.documentInfo.preambleText}
          onChange={(e) => updateDocumentInfo({ preambleText: e.target.value })}
          rows={4}
          placeholder="This Agreement is entered into between..."
        />
      </AccordionSection>
    </div>
  );
}
