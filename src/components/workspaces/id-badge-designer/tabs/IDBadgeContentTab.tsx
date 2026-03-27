"use client";

import { useState } from "react";
import {
  useIDBadgeEditor,
  BADGE_TYPES,
  type BadgeType,
  type RoleVariant,
} from "@/stores/id-badge-editor";
import {
  AccordionSection,
  FormInput,
  FormSelect,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ── Icons ───────────────────────────────────────────────────────────────────

const icons = {
  type: <SIcon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  person: <SIcon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  org: <SIcon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  date: <SIcon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  custom: <SIcon d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
  signatory: <SIcon d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />,
};

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "manager", label: "Manager" },
  { value: "security", label: "Security" },
  { value: "intern", label: "Intern" },
  { value: "contractor", label: "Contractor" },
  { value: "visitor", label: "Visitor" },
  { value: "vip", label: "VIP" },
  { value: "custom", label: "Custom" },
];

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function IDBadgeContentTab() {
  const form = useIDBadgeEditor((s) => s.form);
  const setBadgeType = useIDBadgeEditor((s) => s.setBadgeType);
  const updateContent = useIDBadgeEditor((s) => s.updateContent);
  const updateOrganization = useIDBadgeEditor((s) => s.updateOrganization);
  const updateDates = useIDBadgeEditor((s) => s.updateDates);
  const updateCustomFields = useIDBadgeEditor((s) => s.updateCustomFields);
  const updateSignatory = useIDBadgeEditor((s) => s.updateSignatory);
  const [openSection, setOpenSection] = useState<string | null>("type");

  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Badge Type ── */}
      <AccordionSection
        title="Badge Type"
        icon={icons.type}
        isOpen={openSection === "type"}
        onToggle={() => toggle("type")}
        badge={BADGE_TYPES.find((b) => b.id === form.badgeType)?.name}
      >
        <div className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {BADGE_TYPES.map((bt) => (
              <button
                key={bt.id}
                onClick={() => setBadgeType(bt.id)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                  form.badgeType === bt.id
                    ? "border-primary-500/50 bg-primary-500/10 ring-1 ring-primary-500/20"
                    : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60 hover:bg-gray-800/50"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={form.badgeType === bt.id ? "#a78bfa" : "#64748b"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={bt.icon} />
                </svg>
                <div className="min-w-0">
                  <div className={`text-[11px] font-medium truncate ${form.badgeType === bt.id ? "text-primary-300" : "text-gray-300"}`}>
                    {bt.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-2">
            {BADGE_TYPES.find((b) => b.id === form.badgeType)?.description}
          </p>
        </div>
      </AccordionSection>

      {/* ── Person Information ── */}
      <AccordionSection
        title="Person Information"
        icon={icons.person}
        isOpen={openSection === "person"}
        onToggle={() => toggle("person")}
      >
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="First Name"
              value={form.firstName}
              onChange={(e) => updateContent({ firstName: e.target.value })}
              placeholder="John"
            />
            <FormInput
              label="Last Name"
              value={form.lastName}
              onChange={(e) => updateContent({ lastName: e.target.value })}
              placeholder="Mwamba"
            />
          </div>
          <FormInput
            label="Job Title"
            value={form.title}
            onChange={(e) => updateContent({ title: e.target.value })}
            placeholder="Software Engineer"
          />
          <FormInput
            label="Department"
            value={form.department}
            onChange={(e) => updateContent({ department: e.target.value })}
            placeholder="Technology"
          />
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Employee ID"
              value={form.employeeId}
              onChange={(e) => updateContent({ employeeId: e.target.value })}
              placeholder="EMP-20260001"
            />
            <FormSelect
              label="Role"
              value={form.role}
              onChange={(e) => updateContent({ role: e.target.value as RoleVariant })}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </FormSelect>
          </div>
          <FormInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => updateContent({ email: e.target.value })}
            placeholder="john.mwamba@company.com"
          />
          <FormInput
            label="Phone"
            value={form.phone}
            onChange={(e) => updateContent({ phone: e.target.value })}
            placeholder="+260 977 123 456"
          />
          <FormInput
            label="Access Level"
            value={form.accessLevel}
            onChange={(e) => updateContent({ accessLevel: e.target.value })}
            placeholder="Level 2"
          />

          {/* Photo upload area */}
          <div>
            <SectionLabel>Photo</SectionLabel>
            <div className="mt-1.5">
              {form.photoUrl ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-700/40">
                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${form.photoUrl})` }} />
                  <button
                    onClick={() => updateContent({ photoUrl: "" })}
                    className="absolute top-1 right-1 w-5 h-5 bg-gray-900/80 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-200"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-700/40 flex flex-col items-center justify-center gap-1 text-gray-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[9px]">Add Photo</span>
                  </div>
                  <FormInput
                    label="Photo URL"
                    value={form.photoUrl}
                    onChange={(e) => updateContent({ photoUrl: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* ── Organization ── */}
      <AccordionSection
        title="Organization"
        icon={icons.org}
        isOpen={openSection === "org"}
        onToggle={() => toggle("org")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormInput
            label="Organization Name"
            value={form.organizationName}
            onChange={(e) => updateOrganization({ organizationName: e.target.value })}
            placeholder="DMSuite Solutions"
          />
          <FormInput
            label="Subtitle / Tagline"
            value={form.organizationSubtitle}
            onChange={(e) => updateOrganization({ organizationSubtitle: e.target.value })}
            placeholder="Technology & Innovation"
          />
          <FormInput
            label="Logo URL"
            value={form.organizationLogo}
            onChange={(e) => updateOrganization({ organizationLogo: e.target.value })}
            placeholder="https://example.com/logo.png"
            hint="Optional — organization logo displayed on badge header"
          />
        </div>
      </AccordionSection>

      {/* ── Dates ── */}
      <AccordionSection
        title="Dates"
        icon={icons.date}
        isOpen={openSection === "dates"}
        onToggle={() => toggle("dates")}
      >
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Issue Date"
              type="date"
              value={form.issueDate}
              onChange={(e) => updateDates({ issueDate: e.target.value })}
            />
            <FormInput
              label="Expiry Date"
              type="date"
              value={form.expiryDate}
              onChange={(e) => updateDates({ expiryDate: e.target.value })}
            />
          </div>
        </div>
      </AccordionSection>

      {/* ── Custom Fields ── */}
      <AccordionSection
        title="Custom Fields"
        icon={icons.custom}
        isOpen={openSection === "custom"}
        onToggle={() => toggle("custom")}
      >
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[10px] text-gray-600">Add up to 2 custom fields to display on the badge.</p>
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Field 1 Label"
              value={form.customField1Label}
              onChange={(e) => updateCustomFields({ customField1Label: e.target.value })}
              placeholder="Blood Type"
            />
            <FormInput
              label="Field 1 Value"
              value={form.customField1Value}
              onChange={(e) => updateCustomFields({ customField1Value: e.target.value })}
              placeholder="O+"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Field 2 Label"
              value={form.customField2Label}
              onChange={(e) => updateCustomFields({ customField2Label: e.target.value })}
              placeholder="Floor"
            />
            <FormInput
              label="Field 2 Value"
              value={form.customField2Value}
              onChange={(e) => updateCustomFields({ customField2Value: e.target.value })}
              placeholder="3rd Floor"
            />
          </div>
        </div>
      </AccordionSection>

      {/* ── Authorized Signatory ── */}
      <AccordionSection
        title="Authorized Signatory"
        icon={icons.signatory}
        isOpen={openSection === "signatory"}
        onToggle={() => toggle("signatory")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormInput
            label="Signatory Name"
            value={form.signatory.name}
            onChange={(e) => updateSignatory({ name: e.target.value })}
            placeholder="Jane Banda"
          />
          <FormInput
            label="Signatory Title"
            value={form.signatory.title}
            onChange={(e) => updateSignatory({ title: e.target.value })}
            placeholder="HR Director"
          />
        </div>
      </AccordionSection>
    </div>
  );
}
