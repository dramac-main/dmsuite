// =============================================================================
// DMSuite — Certificate Designer: Content Tab
// Primary content editing: type, title, recipient, description, org, event
// =============================================================================

"use client";

import {
  useCertificateEditor,
  CERTIFICATE_TYPES,
  type CertificateType,
} from "@/stores/certificate-editor";
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

const cerIcons = {
  type: <SIcon d="M12 15l-2 5L7 11l2-8 3 3 3-3 2 8-3 9z" />,
  content: <SIcon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />,
  org: <SIcon d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />,
  event: <SIcon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />,
};

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CertificateContentTab() {
  const form = useCertificateEditor((s) => s.form);
  const setCertificateType = useCertificateEditor((s) => s.setCertificateType);
  const updateContent = useCertificateEditor((s) => s.updateContent);
  const updateOrganization = useCertificateEditor((s) => s.updateOrganization);
  const updateEvent = useCertificateEditor((s) => s.updateEvent);
  const updateDates = useCertificateEditor((s) => s.updateDates);

  const [openSection, setOpenSection] = useState<string | null>("type");

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Certificate Type ── */}
      <AccordionSection
        title="Certificate Type"
        icon={cerIcons.type}
        isOpen={openSection === "type"}
        onToggle={() => setOpenSection(openSection === "type" ? null : "type")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormSelect
            label="Type"
            value={form.certificateType}
            onChange={(e) => setCertificateType(e.target.value as CertificateType)}
          >
            {CERTIFICATE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </FormSelect>
        </div>
      </AccordionSection>

      {/* ── Content ── */}
      <AccordionSection
        title="Content"
        icon={cerIcons.content}
        isOpen={openSection === "content"}
        onToggle={() => setOpenSection(openSection === "content" ? null : "content")}
        badge={form.recipientName ? "✓" : undefined}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormInput
            label="Certificate Title"
            value={form.title}
            onChange={(e) => updateContent({ title: e.target.value })}
            placeholder="Certificate of Achievement"
          />
          <FormInput
            label="Subtitle / Presented To"
            value={form.subtitle}
            onChange={(e) => updateContent({ subtitle: e.target.value })}
            placeholder="This certificate is proudly presented to"
          />
          <FormInput
            label="Recipient Name"
            value={form.recipientName}
            onChange={(e) => updateContent({ recipientName: e.target.value })}
            placeholder="Full name of the recipient"
          />
          <FormTextarea
            label="Description"
            value={form.description}
            onChange={(e) => updateContent({ description: e.target.value })}
            placeholder="In recognition of outstanding performance..."
            rows={3}
          />
          <FormTextarea
            label="Additional Text"
            value={form.additionalText}
            onChange={(e) => updateContent({ additionalText: e.target.value })}
            placeholder="Optional extra message or details"
            rows={2}
          />
        </div>
      </AccordionSection>

      {/* ── Organization ── */}
      <AccordionSection
        title="Organization"
        icon={cerIcons.org}
        isOpen={openSection === "org"}
        onToggle={() => setOpenSection(openSection === "org" ? null : "org")}
        badge={form.organizationName ? "✓" : undefined}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormInput
            label="Organization Name"
            value={form.organizationName}
            onChange={(e) => updateOrganization({ organizationName: e.target.value })}
            placeholder="Company, institution or organization"
          />
          <FormInput
            label="Organization Subtitle"
            value={form.organizationSubtitle}
            onChange={(e) => updateOrganization({ organizationSubtitle: e.target.value })}
            placeholder="Department, division, or tagline"
          />
        </div>
      </AccordionSection>

      {/* ── Event / Program ── */}
      <AccordionSection
        title="Event / Program"
        icon={cerIcons.event}
        isOpen={openSection === "event"}
        onToggle={() => setOpenSection(openSection === "event" ? null : "event")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormInput
            label="Event Name"
            value={form.eventName}
            onChange={(e) => updateEvent({ eventName: e.target.value })}
            placeholder="Annual Awards Ceremony 2026"
          />
          <FormInput
            label="Course / Program Name"
            value={form.courseName}
            onChange={(e) => updateEvent({ courseName: e.target.value })}
            placeholder="Advanced Leadership Program"
          />
          <SectionLabel>Dates & Reference</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Date Issued"
              type="date"
              value={form.dateIssued}
              onChange={(e) => updateDates({ dateIssued: e.target.value })}
            />
            <FormInput
              label="Valid Until"
              type="date"
              value={form.validUntil}
              onChange={(e) => updateDates({ validUntil: e.target.value })}
            />
          </div>
          <FormInput
            label="Reference / Serial Number"
            value={form.referenceNumber}
            onChange={(e) => updateDates({ referenceNumber: e.target.value })}
            placeholder="CERT-2026-001"
          />
        </div>
      </AccordionSection>
    </div>
  );
}
