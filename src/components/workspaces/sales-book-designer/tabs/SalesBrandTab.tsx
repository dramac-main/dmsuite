// =============================================================================
// DMSuite — Sales Brand Tab
// Company branding: logo, company info, banking details
// Mobile-first, uses SalesUIKit form primitives
// =============================================================================

"use client";

import { useCallback, useRef, useState } from "react";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
import {
  FormInput,
  FormTextarea,
  AdvancedToggle,
  SectionCard,
  SectionLabel,
} from "../SalesUIKit";

export default function SalesBrandTab() {
  const branding = useSalesBookEditor((s) => s.form.companyBranding);
  const update = useSalesBookEditor((s) => s.updateBranding);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showBanking, setShowBanking] = useState(false);

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          update({ logoUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
    },
    [update],
  );

  return (
    <div className="space-y-5 p-4">
      {/* ── Logo ── */}
      <SectionCard title="Company Logo">
        <div className="flex items-center gap-4">
          {branding.logoUrl ? (
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="h-14 w-auto rounded-xl border border-gray-700/60 object-contain bg-white/5 p-2"
              />
              <button
                onClick={() => update({ logoUrl: undefined })}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2.5 rounded-xl border border-dashed border-gray-700/60 bg-gray-800/30 px-5 py-3.5 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors active:scale-[0.97]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Upload Logo
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
        <p className="text-[10px] text-gray-600 mt-2">PNG, JPG, SVG or WebP. Max 2 MB.</p>
      </SectionCard>

      {/* ── Company Info ── */}
      <SectionCard title="Company Info" description="Printed on every form">
        <div className="space-y-3">
          <FormInput
            label="Company Name"
            value={branding.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Acme Trading Ltd"
          />
          <FormInput
            label="Tagline / Slogan"
            value={branding.tagline}
            onChange={(e) => update({ tagline: e.target.value })}
            placeholder="e.g. Quality Parts Since 1998"
          />
          <FormTextarea
            label="Address"
            value={branding.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="Company address"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Phone"
              value={branding.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="+260 97X XXX"
            />
            <FormInput
              label="Email"
              value={branding.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="info@co.com"
              type="email"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Website"
              value={branding.website}
              onChange={(e) => update({ website: e.target.value })}
              placeholder="www.co.com"
            />
            <FormInput
              label="TPIN"
              value={branding.taxId}
              onChange={(e) => update({ taxId: e.target.value })}
              placeholder="1234567890"
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Banking Details ── */}
      <SectionCard>
        <AdvancedToggle
          open={showBanking}
          onToggle={() => setShowBanking((v) => !v)}
          label="Banking details (pre-printed on forms)"
        />
        {showBanking && (
          <div className="mt-3 space-y-3">
            <FormInput
              label="Bank Name"
              value={branding.bankName}
              onChange={(e) => update({ bankName: e.target.value })}
              placeholder="Bank name"
            />
            <FormInput
              label="Account Holder"
              value={branding.bankAccountName}
              onChange={(e) => update({ bankAccountName: e.target.value })}
              placeholder="Account holder name"
            />
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Account Number"
                value={branding.bankAccount}
                onChange={(e) => update({ bankAccount: e.target.value })}
                placeholder="Account number"
              />
              <FormInput
                label="Branch"
                value={branding.bankBranch}
                onChange={(e) => update({ bankBranch: e.target.value })}
                placeholder="Branch name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Branch Code"
                value={branding.bankBranchCode}
                onChange={(e) => update({ bankBranchCode: e.target.value })}
                placeholder="Branch code"
              />
              <FormInput
                label="Sort / Routing Code"
                value={branding.bankSortCode}
                onChange={(e) => update({ bankSortCode: e.target.value })}
                placeholder="Sort code"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="SWIFT / BIC"
                value={branding.bankSwiftBic}
                onChange={(e) => update({ bankSwiftBic: e.target.value })}
                placeholder="SWIFTCODE"
              />
              <FormInput
                label="IBAN"
                value={branding.bankIban}
                onChange={(e) => update({ bankIban: e.target.value })}
                placeholder="ZM00 ..."
              />
            </div>

          </div>
        )}
      </SectionCard>
    </div>
  );
}
