// =============================================================================
// DMSuite — Diploma Designer: Content Tab
// Institution, program, recipient, conferral, accreditation, dates, references
// =============================================================================

"use client";

import {
  useDiplomaEditor,
  DIPLOMA_TYPES,
  HONORS_LEVELS,
  type DiplomaType,
  type HonorsLevel,
} from "@/stores/diploma-editor";
import {
  AccordionSection,
  FormInput,
  FormTextarea,
  FormSelect,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import { useState } from "react";

// ━━━ Icons ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const icons = {
  type: <SIcon d="M12 15l-2 5L7 11l2-8 3 3 3-3 2 8-3 9z" />,
  institution: <SIcon d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />,
  recipient: <SIcon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" />,
  program: <SIcon d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />,
  accred: <SIcon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  dates: <SIcon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />,
};

export default function DiplomaContentTab() {
  const form = useDiplomaEditor((s) => s.form);
  const setDiplomaType = useDiplomaEditor((s) => s.setDiplomaType);
  const updateInstitution = useDiplomaEditor((s) => s.updateInstitution);
  const updateRecipient = useDiplomaEditor((s) => s.updateRecipient);
  const updateProgram = useDiplomaEditor((s) => s.updateProgram);
  const updateConferral = useDiplomaEditor((s) => s.updateConferral);
  const updateAccreditation = useDiplomaEditor((s) => s.updateAccreditation);
  const updateDates = useDiplomaEditor((s) => s.updateDates);
  const updateReference = useDiplomaEditor((s) => s.updateReference);

  const [openSection, setOpenSection] = useState<string | null>("type");

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Diploma Type ── */}
      <AccordionSection
        title="Diploma Type"
        icon={icons.type}
        isOpen={openSection === "type"}
        onToggle={() => setOpenSection(openSection === "type" ? null : "type")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormSelect
            label="Type"
            value={form.diplomaType}
            onChange={(e) => setDiplomaType(e.target.value as DiplomaType)}
          >
            {DIPLOMA_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </FormSelect>
        </div>
      </AccordionSection>

      {/* ── Institution ── */}
      <AccordionSection
        title="Institution"
        icon={icons.institution}
        isOpen={openSection === "institution"}
        onToggle={() => setOpenSection(openSection === "institution" ? null : "institution")}
        badge={form.institutionName ? "✓" : undefined}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormInput
            label="Institution Name"
            value={form.institutionName}
            onChange={(e) => updateInstitution({ institutionName: e.target.value })}
            placeholder="University of Zambia"
          />
          <FormInput
            label="Subtitle / Faculty"
            value={form.institutionSubtitle}
            onChange={(e) => updateInstitution({ institutionSubtitle: e.target.value })}
            placeholder="School of Business & Management"
          />
          <FormInput
            label="Motto"
            value={form.institutionMotto}
            onChange={(e) => updateInstitution({ institutionMotto: e.target.value })}
            placeholder="Knowledge is Power"
          />
        </div>
      </AccordionSection>

      {/* ── Recipient ── */}
      <AccordionSection
        title="Recipient"
        icon={icons.recipient}
        isOpen={openSection === "recipient"}
        onToggle={() => setOpenSection(openSection === "recipient" ? null : "recipient")}
        badge={form.recipientName ? "✓" : undefined}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormInput
            label="Recipient Full Name"
            value={form.recipientName}
            onChange={(e) => updateRecipient({ recipientName: e.target.value })}
            placeholder="Full legal name of the graduate"
          />
          <FormInput
            label="Student / Registration ID"
            value={form.recipientId}
            onChange={(e) => updateRecipient({ recipientId: e.target.value })}
            placeholder="STU-2026-12345"
          />
        </div>
      </AccordionSection>

      {/* ── Program ── */}
      <AccordionSection
        title="Program / Degree"
        icon={icons.program}
        isOpen={openSection === "program"}
        onToggle={() => setOpenSection(openSection === "program" ? null : "program")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormInput
            label="Program / Degree Name"
            value={form.programName}
            onChange={(e) => updateProgram({ programName: e.target.value })}
            placeholder="Master of Business Administration"
          />
          <FormInput
            label="Field of Study"
            value={form.fieldOfStudy}
            onChange={(e) => updateProgram({ fieldOfStudy: e.target.value })}
            placeholder="Computer Science"
          />
          <FormSelect
            label="Honors / Distinction"
            value={form.honors}
            onChange={(e) => updateProgram({ honors: e.target.value as HonorsLevel })}
          >
            {HONORS_LEVELS.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </FormSelect>
          <FormTextarea
            label="Conferral Text"
            value={form.conferralText}
            onChange={(e) => updateConferral({ conferralText: e.target.value })}
            placeholder="The Board of Trustees, on recommendation of the Faculty, has conferred upon"
            rows={2}
          />
          <FormTextarea
            label="Resolution Text"
            value={form.resolutionText}
            onChange={(e) => updateConferral({ resolutionText: e.target.value })}
            placeholder="By resolution of the Academic Senate"
            rows={2}
          />
        </div>
      </AccordionSection>

      {/* ── Accreditation ── */}
      <AccordionSection
        title="Accreditation"
        icon={icons.accred}
        isOpen={openSection === "accreditation"}
        onToggle={() => setOpenSection(openSection === "accreditation" ? null : "accreditation")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormInput
            label="Accreditation Body"
            value={form.accreditationBody}
            onChange={(e) => updateAccreditation({ accreditationBody: e.target.value })}
            placeholder="Higher Education Authority"
          />
          <FormInput
            label="Accreditation Number"
            value={form.accreditationNumber}
            onChange={(e) => updateAccreditation({ accreditationNumber: e.target.value })}
            placeholder="HEA/ACC/2026/1234"
          />
        </div>
      </AccordionSection>

      {/* ── Dates & Reference ── */}
      <AccordionSection
        title="Dates & Reference"
        icon={icons.dates}
        isOpen={openSection === "dates"}
        onToggle={() => setOpenSection(openSection === "dates" ? null : "dates")}
      >
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Date Conferred"
              type="date"
              value={form.dateConferred}
              onChange={(e) => updateDates({ dateConferred: e.target.value })}
            />
            <FormInput
              label="Graduation Date"
              type="date"
              value={form.graduationDate}
              onChange={(e) => updateDates({ graduationDate: e.target.value })}
            />
          </div>
          <FormInput
            label="Registration Number"
            value={form.registrationNumber}
            onChange={(e) => updateReference({ registrationNumber: e.target.value })}
            placeholder="REG-2026-00001"
          />
          <FormInput
            label="Serial Number"
            value={form.serialNumber}
            onChange={(e) => updateReference({ serialNumber: e.target.value })}
            placeholder="DIP-SN-000001"
          />
        </div>
      </AccordionSection>
    </div>
  );
}
