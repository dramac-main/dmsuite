// =============================================================================
// DMSuite — Certificate Quick-Edit Panel
// Left sidebar with certificate-specific fields, syncing bidirectionally
// with the canvas via the certificate store.
// =============================================================================

"use client";

import { useCallback } from "react";
import { useCertificateEditor } from "@/stores/certificate-editor";
import { CERTIFICATE_TYPES, type CertificateType } from "@/data/certificate-templates";
import { CERTIFICATE_TEMPLATES } from "@/data/certificate-templates";

// ---------------------------------------------------------------------------
// Field Component Helpers
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-400 mb-1">{children}</label>;
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none resize-none"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface CertificateQuickEditProps {
  onTemplateChange?: () => void;
}

export default function CertificateQuickEdit({ onTemplateChange }: CertificateQuickEditProps) {
  const { meta, setMeta, setCertificateType, selectedTemplateId, setTemplateId, updateSignatory, addSignatory, removeSignatory } =
    useCertificateEditor();

  const handleTemplateChange = useCallback(
    (id: string) => {
      setTemplateId(id);
      setMeta({ templateId: id });
      onTemplateChange?.();
    },
    [setTemplateId, setMeta, onTemplateChange],
  );

  const handleTypeChange = useCallback(
    (type: string) => {
      setCertificateType(type as CertificateType);
    },
    [setCertificateType],
  );

  return (
    <div className="flex flex-col gap-5 overflow-y-auto p-4 text-gray-100">
      {/* Template */}
      <Section title="Template">
        <div>
          <FieldLabel>Template</FieldLabel>
          <SelectInput
            value={selectedTemplateId}
            onChange={handleTemplateChange}
            options={CERTIFICATE_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
          />
        </div>
        <div>
          <FieldLabel>Certificate Type</FieldLabel>
          <SelectInput
            value={meta.certificateType}
            onChange={handleTypeChange}
            options={CERTIFICATE_TYPES.map((t) => ({ value: t.id, label: t.label }))}
          />
        </div>
      </Section>

      {/* Content */}
      <Section title="Content">
        <div>
          <FieldLabel>Title</FieldLabel>
          <TextInput value={meta.title} onChange={(v) => setMeta({ title: v })} placeholder="Certificate of Achievement" />
        </div>
        <div>
          <FieldLabel>Subtitle</FieldLabel>
          <TextInput value={meta.subtitle} onChange={(v) => setMeta({ subtitle: v })} placeholder="This is proudly presented to" />
        </div>
        <div>
          <FieldLabel>Recipient Name</FieldLabel>
          <TextInput value={meta.recipientName} onChange={(v) => setMeta({ recipientName: v })} placeholder="John Smith" />
        </div>
        <div>
          <FieldLabel>Description</FieldLabel>
          <TextArea value={meta.description} onChange={(v) => setMeta({ description: v })} placeholder="For outstanding performance in..." />
        </div>
        <div>
          <FieldLabel>Additional Text</FieldLabel>
          <TextArea value={meta.additionalText} onChange={(v) => setMeta({ additionalText: v })} placeholder="Optional extra text" rows={2} />
        </div>
      </Section>

      {/* Organization */}
      <Section title="Organization">
        <div>
          <FieldLabel>Organization Name</FieldLabel>
          <TextInput value={meta.organizationName} onChange={(v) => setMeta({ organizationName: v })} placeholder="Acme University" />
        </div>
        <div>
          <FieldLabel>Event / Program</FieldLabel>
          <TextInput value={meta.eventName} onChange={(v) => setMeta({ eventName: v })} placeholder="Annual Summit 2025" />
        </div>
        <div>
          <FieldLabel>Course Name</FieldLabel>
          <TextInput value={meta.courseName} onChange={(v) => setMeta({ courseName: v })} placeholder="Advanced Leadership" />
        </div>
      </Section>

      {/* Dates & Reference */}
      <Section title="Dates & Reference">
        <div>
          <FieldLabel>Date Issued</FieldLabel>
          <TextInput value={meta.dateIssued} onChange={(v) => setMeta({ dateIssued: v })} placeholder="January 1, 2025" />
        </div>
        <div>
          <FieldLabel>Valid Until</FieldLabel>
          <TextInput value={meta.validUntil} onChange={(v) => setMeta({ validUntil: v })} placeholder="Optional" />
        </div>
        <div>
          <FieldLabel>Reference Number</FieldLabel>
          <TextInput value={meta.referenceNumber} onChange={(v) => setMeta({ referenceNumber: v })} placeholder="CERT-2025-001" />
        </div>
      </Section>

      {/* Signatories */}
      <Section title="Signatories">
        {meta.signatories.map((sig, i) => (
          <div key={sig.id} className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Signatory {i + 1}</span>
              {meta.signatories.length > 1 && (
                <button
                  onClick={() => removeSignatory(sig.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
            <TextInput value={sig.name} onChange={(v) => updateSignatory(sig.id, { name: v })} placeholder="Name" />
            <TextInput value={sig.title} onChange={(v) => updateSignatory(sig.id, { title: v })} placeholder="Title" />
            <TextInput value={sig.organization} onChange={(v) => updateSignatory(sig.id, { organization: v })} placeholder="Organization" />
          </div>
        ))}
        {meta.signatories.length < 3 && (
          <button
            onClick={addSignatory}
            className="w-full rounded-lg border border-dashed border-gray-600 py-2 text-xs text-gray-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
          >
            + Add Signatory
          </button>
        )}
      </Section>

      {/* Seal */}
      <Section title="Seal">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={meta.showSeal}
              onChange={(e) => setMeta({ showSeal: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500"
            />
            Show Seal
          </label>
        </div>
        {meta.showSeal && (
          <>
            <div>
              <FieldLabel>Seal Text</FieldLabel>
              <TextInput value={meta.sealText} onChange={(v) => setMeta({ sealText: v })} placeholder="CERTIFIED" />
            </div>
            <div>
              <FieldLabel>Seal Style</FieldLabel>
              <SelectInput
                value={meta.sealStyle}
                onChange={(v) => setMeta({ sealStyle: v as "gold" | "silver" | "embossed" | "stamp" | "none" })}
                options={[
                  { value: "gold", label: "Gold" },
                  { value: "silver", label: "Silver" },
                  { value: "embossed", label: "Embossed" },
                  { value: "stamp", label: "Stamp" },
                  { value: "none", label: "None" },
                ]}
              />
            </div>
          </>
        )}
      </Section>

      {/* Font Scale */}
      <Section title="Advanced">
        <div>
          <FieldLabel>Font Scale ({meta.fontScale.toFixed(1)}x)</FieldLabel>
          <input
            type="range"
            min={0.8}
            max={1.3}
            step={0.05}
            value={meta.fontScale}
            onChange={(e) => setMeta({ fontScale: parseFloat(e.target.value) })}
            className="w-full accent-primary-500"
          />
        </div>
      </Section>
    </div>
  );
}
