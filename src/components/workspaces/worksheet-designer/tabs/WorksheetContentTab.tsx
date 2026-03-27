// =============================================================================
// Worksheet Content Tab — Document type, title, instructions, educational
// settings, branding options
// =============================================================================

"use client";

import { useState } from "react";
import { useWorksheetEditor } from "@/stores/worksheet-editor";
import {
  AccordionSection,
  FormInput,
  FormTextarea,
  FormSelect,
  Toggle,
  SIcon,
  SelectionCard,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_CONFIGS,
  EDUCATIONAL_SUBJECTS,
  EDUCATIONAL_SUBJECT_LABELS,
  GRADE_LEVELS,
  GRADE_LEVEL_LABELS,
} from "@/lib/worksheet/schema";
import type { EducationalSubject, GradeLevel } from "@/lib/worksheet/schema";

// ── Tab icons ──
const icons = {
  docType: <SIcon d="M13 10V3L4 14h7v7l9-11h-7z" />,
  meta: <SIcon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  education: <SIcon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  branding: <SIcon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  answerKey: <SIcon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

export default function WorksheetContentTab() {
  const store = useWorksheetEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({
    docType: true,
    meta: true,
    education: false,
    branding: false,
    answerKey: false,
  });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const isEducational = store.form.documentType === "educational-worksheet";
  const currentConfig = DOCUMENT_TYPE_CONFIGS[store.form.documentType];

  return (
    <div className="space-y-2">
      {/* Document Type */}
      <AccordionSection
        title="Document Type"
        icon={icons.docType}
        badge={currentConfig.shortLabel}
        isOpen={open.docType}
        onToggle={() => toggle("docType")}
      >
        <div className="grid grid-cols-2 gap-2">
          {DOCUMENT_TYPES.map((dt) => {
            const cfg = DOCUMENT_TYPE_CONFIGS[dt];
            return (
              <SelectionCard
                key={dt}
                selected={store.form.documentType === dt}
                onClick={() => store.setDocumentType(dt)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 text-gray-400 shrink-0"><SIcon d={cfg.icon} /></span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold truncate">{cfg.shortLabel}</div>
                    <div className="text-[9px] text-gray-500 truncate">{cfg.description}</div>
                  </div>
                </div>
              </SelectionCard>
            );
          })}
        </div>
      </AccordionSection>

      {/* Document Info */}
      <AccordionSection
        title="Document Info"
        icon={icons.meta}
        isOpen={open.meta}
        onToggle={() => toggle("meta")}
      >
        <div className="space-y-2">
          <FormInput
            label="Title"
            value={store.form.title}
            onChange={(e) => store.updateMeta({ title: e.target.value })}
            placeholder={currentConfig.label}
          />
          <FormTextarea
            label="Instructions"
            value={store.form.instructions}
            onChange={(e) => store.updateMeta({ instructions: e.target.value })}
            placeholder="Enter instructions for the person filling out this form..."
            rows={3}
          />
        </div>
      </AccordionSection>

      {/* Educational Settings (only for educational worksheets) */}
      {isEducational && (
        <AccordionSection
          title="Educational Settings"
          icon={icons.education}
          isOpen={open.education}
          onToggle={() => toggle("education")}
        >
          <div className="space-y-2">
            <FormSelect
              label="Subject"
              value={store.form.subject ?? "general"}
              onChange={(e) => store.updateMeta({ subject: e.target.value as EducationalSubject })}
            >
              {EDUCATIONAL_SUBJECTS.map((s) => (
                <option key={s} value={s}>{EDUCATIONAL_SUBJECT_LABELS[s]}</option>
              ))}
            </FormSelect>
            <FormSelect
              label="Grade Level"
              value={store.form.gradeLevel ?? "grade-5"}
              onChange={(e) => store.updateMeta({ gradeLevel: e.target.value as GradeLevel })}
            >
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>{GRADE_LEVEL_LABELS[g]}</option>
              ))}
            </FormSelect>
            <Toggle
              label="Student Name Field"
              checked={store.form.studentNameField}
              onChange={(v) => store.updateMeta({ studentNameField: v })}
            />
            <Toggle
              label="Date Field"
              checked={store.form.dateField}
              onChange={(v) => store.updateMeta({ dateField: v })}
            />
            <Toggle
              label="Score Field"
              checked={store.form.scoreField}
              onChange={(v) => store.updateMeta({ scoreField: v })}
            />
          </div>
        </AccordionSection>
      )}

      {/* Branding & Header */}
      <AccordionSection
        title="Branding"
        icon={icons.branding}
        isOpen={open.branding}
        onToggle={() => toggle("branding")}
      >
        <div className="space-y-2">
          <FormInput
            label="Organization"
            value={store.form.branding.organization}
            onChange={(e) => store.updateBranding({ organization: e.target.value })}
            placeholder="Company or school name"
          />
          <FormInput
            label="Subtitle"
            value={store.form.branding.subtitle}
            onChange={(e) => store.updateBranding({ subtitle: e.target.value })}
            placeholder="Department, class, etc."
          />
          <FormInput
            label="Form Number"
            value={store.form.branding.formNumber}
            onChange={(e) => store.updateBranding({ formNumber: e.target.value })}
            placeholder="e.g. FORM-001"
          />
          <FormInput
            label="Date"
            value={store.form.branding.date}
            onChange={(e) => store.updateBranding({ date: e.target.value })}
            placeholder="Date or version"
          />
          <FormInput
            label="Confidentiality"
            value={store.form.branding.confidentiality ?? ""}
            onChange={(e) => store.updateBranding({ confidentiality: e.target.value })}
            placeholder="e.g. CONFIDENTIAL"
          />
          <FormInput
            label="Contact Info"
            value={store.form.branding.contactInfo ?? ""}
            onChange={(e) => store.updateBranding({ contactInfo: e.target.value })}
            placeholder="Phone, email, address"
          />
        </div>
      </AccordionSection>

      {/* Answer Key Settings */}
      {isEducational && (
        <AccordionSection
          title="Answer Key"
          icon={icons.answerKey}
          badge={store.form.answerKey.enabled ? "ON" : "OFF"}
          isOpen={open.answerKey}
          onToggle={() => toggle("answerKey")}
        >
          <div className="space-y-2">
            <Toggle
              label="Generate Answer Key Page"
              checked={store.form.answerKey.enabled}
              onChange={(v) => store.updateAnswerKey({ enabled: v })}
            />
            {store.form.answerKey.enabled && (
              <>
                <Toggle
                  label="Show Points"
                  checked={store.form.answerKey.showPoints}
                  onChange={(v) => store.updateAnswerKey({ showPoints: v })}
                />
                <Toggle
                  label="Show Explanations"
                  checked={store.form.answerKey.showExplanations}
                  onChange={(v) => store.updateAnswerKey({ showExplanations: v })}
                />
                <FormInput
                  label="Header Text"
                  value={store.form.answerKey.headerText}
                  onChange={(e) => store.updateAnswerKey({ headerText: e.target.value })}
                  placeholder="ANSWER KEY"
                />
              </>
            )}
          </div>
        </AccordionSection>
      )}
    </div>
  );
}
