"use client";

import { useState } from "react";
import { useIDBadgeEditor, type BarcodeType } from "@/stores/id-badge-editor";
import {
  AccordionSection,
  FormInput,
  FormSelect,
  Toggle,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ── Icons ───────────────────────────────────────────────────────────────────

const icons = {
  back: <SIcon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
  qr: <SIcon d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />,
  barcode: <SIcon d="M2 5h2v14H2zm4 0h1v14H6zm3 0h2v14H9zm4 0h1v14h-1zm3 0h2v14h-2zm4 0h1v14h-1z" />,
  magnetic: <SIcon d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
  nfc: <SIcon d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />,
  text: <SIcon d="M4 6h16M4 12h16m-7 6h7" />,
  contact: <SIcon d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
};

const BARCODE_TYPES: { value: BarcodeType; label: string }[] = [
  { value: "code128", label: "Code 128" },
  { value: "code39", label: "Code 39" },
  { value: "qr", label: "QR Code" },
  { value: "none", label: "None" },
];

const QR_CONTENT_OPTIONS = [
  { value: "employee-id", label: "Employee ID" },
  { value: "vcard", label: "vCard Contact" },
  { value: "url", label: "URL Link" },
  { value: "custom", label: "Custom Value" },
] as const;

const BARCODE_CONTENT_OPTIONS = [
  { value: "employee-id", label: "Employee ID" },
  { value: "custom", label: "Custom Value" },
] as const;

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function IDBadgeBackTab() {
  const form = useIDBadgeEditor((s) => s.form);
  const updateBackSide = useIDBadgeEditor((s) => s.updateBackSide);
  const [openSection, setOpenSection] = useState<string | null>("general");

  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);
  const bs = form.backSide;

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── General ── */}
      <AccordionSection
        title="Back Side"
        icon={icons.back}
        isOpen={openSection === "general"}
        onToggle={() => toggle("general")}
      >
        <div className="px-4 pb-4 space-y-3">
          <Toggle
            label="Enable Back Side"
            description="Design the reverse side of the badge"
            checked={bs.enabled}
            onChange={(v) => updateBackSide({ enabled: v })}
          />
        </div>
      </AccordionSection>

      {bs.enabled && (
        <>
          {/* ── QR Code ── */}
          <AccordionSection
            title="QR Code"
            icon={icons.qr}
            isOpen={openSection === "qr"}
            onToggle={() => toggle("qr")}
          >
            <div className="px-4 pb-4 space-y-3">
              <Toggle
                label="Show QR Code"
                description="Encode employee data or a link"
                checked={bs.showQrCode}
                onChange={(v) => updateBackSide({ showQrCode: v })}
              />
              {bs.showQrCode && (
                <>
                  <FormSelect
                    label="QR Content Type"
                    value={bs.qrContent}
                    onChange={(e) => updateBackSide({ qrContent: e.target.value as typeof bs.qrContent })}
                  >
                    {QR_CONTENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </FormSelect>
                  {bs.qrContent === "custom" && (
                    <FormInput
                      label="Custom QR Value"
                      value={bs.qrCustomValue}
                      onChange={(e) => updateBackSide({ qrCustomValue: e.target.value })}
                      placeholder="https://verify.company.com?id={employeeId}"
                      hint="Use {employeeId}, {firstName}, {lastName} as placeholders"
                    />
                  )}
                </>
              )}
            </div>
          </AccordionSection>

          {/* ── Barcode ── */}
          <AccordionSection
            title="Barcode"
            icon={icons.barcode}
            isOpen={openSection === "barcode"}
            onToggle={() => toggle("barcode")}
          >
            <div className="px-4 pb-4 space-y-3">
              <Toggle
                label="Show Barcode"
                description="Add a linear barcode encoding employee ID"
                checked={bs.showBarcode}
                onChange={(v) => updateBackSide({ showBarcode: v })}
              />
              {bs.showBarcode && (
                <>
                  <FormSelect
                    label="Barcode Type"
                    value={bs.barcodeType}
                    onChange={(e) => updateBackSide({ barcodeType: e.target.value as BarcodeType })}
                  >
                    {BARCODE_TYPES.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </FormSelect>
                  <FormSelect
                    label="Barcode Content"
                    value={bs.barcodeContent}
                    onChange={(e) => updateBackSide({ barcodeContent: e.target.value as typeof bs.barcodeContent })}
                  >
                    {BARCODE_CONTENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </FormSelect>
                  {bs.barcodeContent === "custom" && (
                    <FormInput
                      label="Custom Barcode Value"
                      value={bs.barcodeCustomValue}
                      onChange={(e) => updateBackSide({ barcodeCustomValue: e.target.value })}
                      placeholder="{employeeId}"
                      hint="ID that will be encoded in the barcode"
                    />
                  )}
                </>
              )}
            </div>
          </AccordionSection>

          {/* ── Magnetic Stripe ── */}
          <AccordionSection
            title="Magnetic Stripe"
            icon={icons.magnetic}
            isOpen={openSection === "magstripe"}
            onToggle={() => toggle("magstripe")}
          >
            <div className="px-4 pb-4 space-y-3">
              <Toggle
                label="Show Magnetic Stripe"
                description="Visual magnetic stripe for access cards"
                checked={bs.showMagneticStripe}
                onChange={(v) => updateBackSide({ showMagneticStripe: v })}
              />
              {bs.showMagneticStripe && (
                <p className="text-[10px] text-gray-600">
                  A dark magnetic stripe will be rendered across the upper back of the badge.
                </p>
              )}
            </div>
          </AccordionSection>

          {/* ── NFC / RFID ── */}
          <AccordionSection
            title="NFC / RFID Zone"
            icon={icons.nfc}
            isOpen={openSection === "nfc"}
            onToggle={() => toggle("nfc")}
          >
            <div className="px-4 pb-4 space-y-3">
              <Toggle
                label="Show NFC/RFID Indicator"
                description="Mark the contactless chip zone"
                checked={bs.showNfcZone}
                onChange={(v) => updateBackSide({ showNfcZone: v })}
              />
              {bs.showNfcZone && (
                <p className="text-[10px] text-gray-600">
                  A contactless symbol will be printed at the badge center indicating NFC/RFID chip placement.
                </p>
              )}
            </div>
          </AccordionSection>

          {/* ── Contact & Terms ── */}
          <AccordionSection
            title="Contact & Terms"
            icon={icons.contact}
            isOpen={openSection === "contact"}
            onToggle={() => toggle("contact")}
          >
            <div className="px-4 pb-4 space-y-3">
              <Toggle
                label="Show Contact Info"
                description="Display contact details on the back"
                checked={bs.showContactInfo}
                onChange={(v) => updateBackSide({ showContactInfo: v })}
              />
              <Toggle
                label="Show Emergency Contact"
                checked={bs.showEmergencyContact}
                onChange={(v) => updateBackSide({ showEmergencyContact: v })}
              />
              {bs.showEmergencyContact && (
                <FormInput
                  label="Emergency Phone"
                  value={bs.emergencyPhone}
                  onChange={(e) => updateBackSide({ emergencyPhone: e.target.value })}
                  placeholder="Emergency: +260 977 911 000"
                />
              )}
              <Toggle
                label="Show Return Address"
                checked={bs.showReturnAddress}
                onChange={(v) => updateBackSide({ showReturnAddress: v })}
              />
              {bs.showReturnAddress && (
                <FormInput
                  label="Return Address"
                  value={bs.returnAddress}
                  onChange={(e) => updateBackSide({ returnAddress: e.target.value })}
                  placeholder="Return to: HR Dept, Plot 123, Cairo Rd, Lusaka"
                />
              )}
              <Toggle
                label="Show Terms / Legal Text"
                checked={bs.showTermsText}
                onChange={(v) => updateBackSide({ showTermsText: v })}
              />
              {bs.showTermsText && (
                <div>
                  <label className="block text-[10px] text-gray-500 font-medium mb-1">Terms / Legal Text</label>
                  <textarea
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-700/40 bg-gray-800/40 text-[11px] text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500/30 focus:border-primary-500/30"
                    rows={3}
                    value={bs.termsText}
                    onChange={(e) => updateBackSide({ termsText: e.target.value })}
                    placeholder="This badge remains the property of the organization. Unauthorized use is prohibited."
                  />
                </div>
              )}
            </div>
          </AccordionSection>
        </>
      )}
    </div>
  );
}
