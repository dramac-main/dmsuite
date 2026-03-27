"use client";

import { useState } from "react";
import {
  useTicketEditor,
  type BarcodeType,
  type PerforationStyle,
} from "@/stores/ticket-editor";
import {
  AccordionSection,
  FormInput,
  FormSelect,
  FormTextarea,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ━━━ SVG paths ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ICON = {
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  qr: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 3h3v4h-3v-4zm3-3h4v3h-4v-3zm-3 0h3v3h-3v-3zm3 3h4v4h-4v-4z",
  hash: "M7 20l4-16m2 16l4-16M6 9h14M4 15h14",
  scissors: "M6 3v1m0 10v1m0-5H3m3 0h4m-4 0l3-3m-3 3l3 3",
  doc: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
};

const CURRENCY_OPTIONS = [
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "GBP", label: "£ GBP" },
  { value: "JPY", label: "¥ JPY" },
  { value: "CAD", label: "C$ CAD" },
  { value: "AUD", label: "A$ AUD" },
  { value: "ZAR", label: "R ZAR" },
  { value: "NGN", label: "₦ NGN" },
  { value: "KES", label: "KSh KES" },
  { value: "GHS", label: "GH₵ GHS" },
  { value: "XOF", label: "CFA XOF" },
];

export default function TicketDetailsTab() {
  const form = useTicketEditor((s) => s.form);
  const updateAttendee = useTicketEditor((s) => s.updateAttendee);
  const updateBarcode = useTicketEditor((s) => s.updateBarcode);
  const updateSerial = useTicketEditor((s) => s.updateSerial);
  const updateStub = useTicketEditor((s) => s.updateStub);
  const updateOrganizer = useTicketEditor((s) => s.updateOrganizer);

  const [openSection, setOpenSection] = useState<string | null>("attendee");
  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  return (
    <div className="flex flex-col gap-1 p-2">
      {/* ─── Attendee ─── */}
      <AccordionSection
        title="Attendee"
        icon={<SIcon d={ICON.user} />}
        isOpen={openSection === "attendee"}
        onToggle={() => toggle("attendee")}
        badge={form.attendee.attendeeName ? "✓" : undefined}
      >
        <div className="flex flex-col gap-2">
          <FormInput
            label="Attendee Name"
            value={form.attendee.attendeeName}
            onChange={(e) => updateAttendee({ attendeeName: e.target.value })}
            placeholder="e.g. John Doe"
          />
          <FormInput
            label="Email"
            type="email"
            value={form.attendee.attendeeEmail}
            onChange={(e) => updateAttendee({ attendeeEmail: e.target.value })}
            placeholder="e.g. john@example.com"
          />
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Ticket Class"
              value={form.attendee.ticketClass}
              onChange={(e) => updateAttendee({ ticketClass: e.target.value })}
              placeholder="e.g. VIP, General"
            />
            <FormSelect
              label="Age Group"
              value={form.attendee.ageGroup}
              onChange={(e) => updateAttendee({ ageGroup: e.target.value })}
            >
              <option value="Adult">Adult</option>
              <option value="Child">Child</option>
              <option value="Senior">Senior</option>
              <option value="Student">Student</option>
            </FormSelect>
          </div>
        </div>
      </AccordionSection>

      {/* ─── Pricing ─── */}
      <AccordionSection
        title="Pricing"
        icon={<SIcon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
        isOpen={openSection === "pricing"}
        onToggle={() => toggle("pricing")}
        badge={form.price ? "✓" : undefined}
      >
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Price"
              value={form.price}
              onChange={(e) => updateOrganizer({ price: e.target.value })}
              placeholder="e.g. 25.00"
            />
            <FormSelect
              label="Currency"
              value={form.currency}
              onChange={(e) => updateOrganizer({ currency: e.target.value })}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </FormSelect>
          </div>
        </div>
      </AccordionSection>

      {/* ─── Barcode / QR ─── */}
      <AccordionSection
        title="Barcode / QR Code"
        icon={<SIcon d={ICON.qr} />}
        isOpen={openSection === "barcode"}
        onToggle={() => toggle("barcode")}
        badge={form.barcode.type !== "none" ? form.barcode.type.toUpperCase() : undefined}
      >
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-1.5">
            {(["qr", "code128", "none"] as BarcodeType[]).map((t) => (
              <button
                key={t}
                onClick={() => updateBarcode({ type: t })}
                className={`rounded-md px-2 py-1.5 text-[10px] font-medium transition-all border ${
                  form.barcode.type === t
                    ? "border-primary-500 bg-primary-500/10 text-primary-300"
                    : "border-gray-700/40 bg-gray-800/20 text-gray-400 hover:border-gray-600"
                }`}
              >
                {t === "qr" ? "QR Code" : t === "code128" ? "Barcode" : "None"}
              </button>
            ))}
          </div>
          {form.barcode.type !== "none" && (
            <>
              <FormInput
                label="Value"
                value={form.barcode.value}
                onChange={(e) => updateBarcode({ value: e.target.value })}
                placeholder="e.g. TICKET-12345"
              />
              <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.barcode.showValue}
                  onChange={(e) => updateBarcode({ showValue: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30 size-3.5"
                />
                Show value text below barcode
              </label>
            </>
          )}
        </div>
      </AccordionSection>

      {/* ─── Serial Numbering ─── */}
      <AccordionSection
        title="Serial Numbering"
        icon={<SIcon d={ICON.hash} />}
        isOpen={openSection === "serial"}
        onToggle={() => toggle("serial")}
        badge={form.serial.enabled ? "ON" : undefined}
      >
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.serial.enabled}
              onChange={(e) => updateSerial({ enabled: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30 size-3.5"
            />
            Enable serial numbering
          </label>
          {form.serial.enabled && (
            <>
              <FormInput
                label="Prefix"
                value={form.serial.prefix}
                onChange={(e) => updateSerial({ prefix: e.target.value })}
                placeholder="e.g. TKT"
              />
              <div className="grid grid-cols-2 gap-2">
                <FormInput
                  label="Start Number"
                  type="number"
                  value={String(form.serial.startNumber)}
                  onChange={(e) => updateSerial({ startNumber: parseInt(e.target.value) || 1 })}
                />
                <FormInput
                  label="Pad Length"
                  type="number"
                  value={String(form.serial.padLength)}
                  onChange={(e) => updateSerial({ padLength: Math.min(10, Math.max(1, parseInt(e.target.value) || 5)) })}
                />
              </div>
              <div className="text-[10px] text-gray-500 mt-1 font-mono">
                Preview: {form.serial.prefix}{String(form.serial.startNumber).padStart(form.serial.padLength, "0")}
              </div>
            </>
          )}
        </div>
      </AccordionSection>

      {/* ─── Stub / Tear-off ─── */}
      <AccordionSection
        title="Stub / Tear-off"
        icon={<SIcon d={ICON.scissors} />}
        isOpen={openSection === "stub"}
        onToggle={() => toggle("stub")}
        badge={form.stub.enabled ? "ON" : undefined}
      >
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.stub.enabled}
              onChange={(e) => updateStub({ enabled: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30 size-3.5"
            />
            Enable tear-off stub
          </label>
          {form.stub.enabled && (
            <>
              <FormSelect
                label="Perforation Style"
                value={form.stub.perforation}
                onChange={(e) => updateStub({ perforation: e.target.value as PerforationStyle })}
              >
                <option value="dashed">Dashed Line</option>
                <option value="dotted">Dotted Line</option>
                <option value="none">No Perforation</option>
              </FormSelect>
              <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.stub.duplicateInfo}
                  onChange={(e) => updateStub({ duplicateInfo: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30 size-3.5"
                />
                Duplicate key info on stub
              </label>
            </>
          )}
        </div>
      </AccordionSection>

      {/* ─── Organizer ─── */}
      <AccordionSection
        title="Organizer"
        icon={<SIcon d={ICON.building} />}
        isOpen={openSection === "organizer"}
        onToggle={() => toggle("organizer")}
        badge={form.organizerName ? "✓" : undefined}
      >
        <div className="flex flex-col gap-2">
          <FormInput
            label="Organizer Name"
            value={form.organizerName}
            onChange={(e) => updateOrganizer({ organizerName: e.target.value })}
            placeholder="e.g. EventPro Inc."
          />
          <FormInput
            label="Contact"
            value={form.organizerContact}
            onChange={(e) => updateOrganizer({ organizerContact: e.target.value })}
            placeholder="e.g. info@eventpro.com"
          />
          <FormInput
            label="Website"
            value={form.organizerWebsite}
            onChange={(e) => updateOrganizer({ organizerWebsite: e.target.value })}
            placeholder="e.g. www.eventpro.com"
          />
        </div>
      </AccordionSection>

      {/* ─── Terms ─── */}
      <AccordionSection
        title="Terms & Conditions"
        icon={<SIcon d={ICON.doc} />}
        isOpen={openSection === "terms"}
        onToggle={() => toggle("terms")}
        badge={form.terms ? "✓" : undefined}
      >
        <FormTextarea
          label="Fine Print"
          value={form.terms}
          onChange={(e) => updateOrganizer({ terms: e.target.value })}
          placeholder="Non-refundable. No re-entry. ID required."
          rows={3}
        />
      </AccordionSection>
    </div>
  );
}
