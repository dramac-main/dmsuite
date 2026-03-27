// =============================================================================
// Cover Letter Content Tab — Sender, Recipient, Date, Letter body
// =============================================================================

"use client";

import { useState } from "react";
import { useCoverLetterEditor } from "@/stores/cover-letter-editor";
import {
  AccordionSection,
  FormInput,
  FormTextarea,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

const icons = {
  sender: <SIcon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  recipient: <SIcon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  date: <SIcon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  body: <SIcon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
};

export default function CoverLetterContentTab() {
  const store = useCoverLetterEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({
    sender: true,
    recipient: false,
    date: false,
    body: false,
  });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const senderFilled = [store.form.sender.fullName, store.form.sender.email].filter(Boolean).length;
  const recipientFilled = [store.form.recipient.hiringManagerName, store.form.recipient.companyName].filter(Boolean).length;
  const bodyFilled = [
    store.form.content.openingHook,
    store.form.content.bodyQualifications,
    store.form.content.bodyCompanyFit,
    store.form.content.closingCallToAction,
  ].filter(Boolean).length;

  return (
    <div className="space-y-2">
      {/* Sender Info */}
      <AccordionSection
        title="Your Details"
        icon={icons.sender}
        badge={senderFilled > 0 ? `${senderFilled} filled` : undefined}
        isOpen={open.sender}
        onToggle={() => toggle("sender")}
      >
        <div className="space-y-2">
          <FormInput
            label="Full Name"
            value={store.form.sender.fullName}
            onChange={(e) => store.updateSender({ fullName: e.target.value })}
            placeholder="John Doe"
          />
          <FormInput
            label="Job Title / Role"
            value={store.form.sender.jobTitle}
            onChange={(e) => store.updateSender({ jobTitle: e.target.value })}
            placeholder="Senior Product Designer"
          />
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Email"
              value={store.form.sender.email}
              onChange={(e) => store.updateSender({ email: e.target.value })}
              placeholder="john@example.com"
            />
            <FormInput
              label="Phone"
              value={store.form.sender.phone}
              onChange={(e) => store.updateSender({ phone: e.target.value })}
              placeholder="+1 (555) 000‑0000"
            />
          </div>
          <FormInput
            label="Location"
            value={store.form.sender.location}
            onChange={(e) => store.updateSender({ location: e.target.value })}
            placeholder="New York, NY"
          />
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="LinkedIn"
              value={store.form.sender.linkedIn}
              onChange={(e) => store.updateSender({ linkedIn: e.target.value })}
              placeholder="linkedin.com/in/johndoe"
            />
            <FormInput
              label="Website"
              value={store.form.sender.website}
              onChange={(e) => store.updateSender({ website: e.target.value })}
              placeholder="johndoe.com"
            />
          </div>
        </div>
      </AccordionSection>

      {/* Recipient Info */}
      <AccordionSection
        title="Recipient"
        icon={icons.recipient}
        badge={recipientFilled > 0 ? `${recipientFilled} filled` : undefined}
        isOpen={open.recipient}
        onToggle={() => toggle("recipient")}
      >
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Hiring Manager"
              value={store.form.recipient.hiringManagerName}
              onChange={(e) => store.updateRecipient({ hiringManagerName: e.target.value })}
              placeholder="Jane Smith"
            />
            <FormInput
              label="Title"
              value={store.form.recipient.hiringManagerTitle}
              onChange={(e) => store.updateRecipient({ hiringManagerTitle: e.target.value })}
              placeholder="Hiring Manager"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Company"
              value={store.form.recipient.companyName}
              onChange={(e) => store.updateRecipient({ companyName: e.target.value })}
              placeholder="Acme Inc."
            />
            <FormInput
              label="Department"
              value={store.form.recipient.department}
              onChange={(e) => store.updateRecipient({ department: e.target.value })}
              placeholder="Human Resources"
            />
          </div>
          <FormInput
            label="Company Address"
            value={store.form.recipient.companyAddress}
            onChange={(e) => store.updateRecipient({ companyAddress: e.target.value })}
            placeholder="123 Main St, Suite 100, San Francisco, CA"
          />
        </div>
      </AccordionSection>

      {/* Date & Salutation */}
      <AccordionSection
        title="Date & Greeting"
        icon={icons.date}
        badge={store.form.date ? "set" : undefined}
        isOpen={open.date}
        onToggle={() => toggle("date")}
      >
        <div className="space-y-2">
          <FormInput
            label="Date"
            value={store.form.date}
            onChange={(e) => store.setDate(e.target.value)}
            type="date"
          />
          <FormInput
            label="Salutation"
            value={store.form.content.salutation}
            onChange={(e) => store.updateContent({ salutation: e.target.value })}
            placeholder="Dear Hiring Manager,"
          />
        </div>
      </AccordionSection>

      {/* Letter Body */}
      <AccordionSection
        title="Letter Body"
        icon={icons.body}
        badge={bodyFilled > 0 ? `${bodyFilled}/4 paragraphs` : undefined}
        isOpen={open.body}
        onToggle={() => toggle("body")}
      >
        <div className="space-y-3">
          <FormTextarea
            label="Opening Hook"
            value={store.form.content.openingHook}
            onChange={(e) => store.updateContent({ openingHook: e.target.value })}
            placeholder="I'm writing to express my enthusiastic interest in the [Position] role at [Company]. With my background in…"
            rows={4}
          />
          <FormTextarea
            label="Qualifications & Experience"
            value={store.form.content.bodyQualifications}
            onChange={(e) => store.updateContent({ bodyQualifications: e.target.value })}
            placeholder="In my current role as [Title] at [Company], I have successfully… For example, I increased revenue by 35% through…"
            rows={5}
          />
          <FormTextarea
            label="Company Fit & Motivation"
            value={store.form.content.bodyCompanyFit}
            onChange={(e) => store.updateContent({ bodyCompanyFit: e.target.value })}
            placeholder="What particularly excites me about [Company] is your commitment to… I believe my experience in [area] directly aligns with…"
            rows={4}
          />
          <FormTextarea
            label="Closing & Call to Action"
            value={store.form.content.closingCallToAction}
            onChange={(e) => store.updateContent({ closingCallToAction: e.target.value })}
            placeholder="I would welcome the opportunity to discuss how my skills can contribute to your team. I'm available for an interview at your earliest convenience…"
            rows={3}
          />

          <div className="border-t border-gray-800/50 pt-3 space-y-2">
            <FormInput
              label="Sign-Off"
              value={store.form.content.signOff}
              onChange={(e) => store.updateContent({ signOff: e.target.value })}
              placeholder="Sincerely,"
            />
            <FormTextarea
              label="P.S. (optional)"
              value={store.form.content.postScript}
              onChange={(e) => store.updateContent({ postScript: e.target.value })}
              placeholder="I've attached my portfolio showcasing recent projects relevant to this role."
              rows={2}
            />
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}
