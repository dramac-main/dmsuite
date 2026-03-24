// =============================================================================
// DMSuite — Sales Book Section: Company Branding
// Company name, tagline, address, contact info + logo upload.
// =============================================================================

"use client";

import { useCallback, useRef, useState } from "react";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
import { FormInput, FormTextarea, AdvancedToggle } from "./SalesUIKit";

export default function SBSectionBranding() {
  const branding = useSalesBookEditor((s) => s.form.companyBranding);
  const update = useSalesBookEditor((s) => s.updateBranding);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showAdvancedBanking, setShowAdvancedBanking] = useState(false);

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo must be under 2 MB");
        return;
      }
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

  const inputCls =
    "w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3.5 py-2 text-[13px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all";
  const labelCls = "block text-[11px] font-medium text-gray-500 mb-1.5";

  return (
    <div className="space-y-3">
      {/* Logo upload */}
      <div>
        <label className={labelCls}>Company Logo</label>
        <div className="flex items-center gap-3">
          {branding.logoUrl ? (
            <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="h-10 w-auto rounded border border-gray-700 object-contain bg-white/5 p-1"
              />
              <button
                onClick={() => update({ logoUrl: undefined })}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-dashed border-gray-700/60 bg-gray-800/30 px-4 py-2.5 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors active:scale-[0.97]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      </div>

      {/* Company Name */}
      <div>
        <label className={labelCls}>Company Name</label>
        <input
          type="text"
          value={branding.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Acme Trading Ltd"
          className={inputCls}
        />
      </div>

      {/* Tagline */}
      <div>
        <label className={labelCls}>Tagline / Slogan</label>
        <input
          type="text"
          value={branding.tagline}
          onChange={(e) => update({ tagline: e.target.value })}
          placeholder="e.g. Quality Parts Since 1998"
          className={inputCls}
        />
      </div>

      {/* Address */}
      <div>
        <label className={labelCls}>Address</label>
        <textarea
          rows={2}
          value={branding.address}
          onChange={(e) => update({ address: e.target.value })}
          placeholder="Enter company address"
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Phone & Email */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelCls}>Phone</label>
          <input type="text" value={branding.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="+260 97X XXX" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" value={branding.email} onChange={(e) => update({ email: e.target.value })} placeholder="info@co.com" className={inputCls} />
        </div>
      </div>

      {/* Website & TPIN */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelCls}>Website</label>
          <input type="text" value={branding.website} onChange={(e) => update({ website: e.target.value })} placeholder="www.co.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>TPIN</label>
          <input type="text" value={branding.taxId} onChange={(e) => update({ taxId: e.target.value })} placeholder="1234567890" className={inputCls} />
        </div>
      </div>

      {/* Banking Details — pre-printed on forms */}
      <div>
        <label className={labelCls}>Banking Details <span className="text-gray-600 font-normal">(pre-printed)</span></label>
        <div className="space-y-2">
          {/* Basic banking — always visible */}
          <input
            type="text"
            value={branding.bankName}
            onChange={(e) => update({ bankName: e.target.value })}
            placeholder="Bank name"
            className={inputCls}
          />
          <input
            type="text"
            value={branding.bankAccountName}
            onChange={(e) => update({ bankAccountName: e.target.value })}
            placeholder="Account holder name"
            className={inputCls}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="text"
              value={branding.bankAccount}
              onChange={(e) => update({ bankAccount: e.target.value })}
              placeholder="Account number"
              className={inputCls}
            />
            <input
              type="text"
              value={branding.bankBranch}
              onChange={(e) => update({ bankBranch: e.target.value })}
              placeholder="Branch name"
              className={inputCls}
            />
          </div>

          {/* Advanced banking toggle */}
          <AdvancedToggle
            open={showAdvancedBanking}
            onToggle={() => setShowAdvancedBanking((v) => !v)}
            label="More banking fields"
          />

          {/* Advanced banking — hidden by default */}
          {showAdvancedBanking && (
            <div className="space-y-2.5 pl-3 border-l-2 border-primary-500/20 ml-0.5">
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={branding.bankBranchCode}
                  onChange={(e) => update({ bankBranchCode: e.target.value })}
                  placeholder="Branch code"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={branding.bankSortCode}
                  onChange={(e) => update({ bankSortCode: e.target.value })}
                  placeholder="Sort / routing code"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={branding.bankSwiftBic}
                  onChange={(e) => update({ bankSwiftBic: e.target.value })}
                  placeholder="SWIFT / BIC code"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={branding.bankIban}
                  onChange={(e) => update({ bankIban: e.target.value })}
                  placeholder="IBAN"
                  className={inputCls}
                />
              </div>
              <input
                type="text"
                value={branding.bankReference}
                onChange={(e) => update({ bankReference: e.target.value })}
                placeholder="Payment reference / memo"
                className={inputCls}
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={branding.bankCustomLabel}
                  onChange={(e) => update({ bankCustomLabel: e.target.value })}
                  placeholder="Custom field label"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={branding.bankCustomValue}
                  onChange={(e) => update({ bankCustomValue: e.target.value })}
                  placeholder="Custom field value"
                  className={inputCls}
                />
              </div>
            </div>
          )}
        </div>
        <div className="mt-1 text-[10px] text-gray-600">
          Only filled fields appear on printed forms. Leave blank to omit.
        </div>
      </div>

      {/* Hint */}
      <div className="rounded-xl bg-gray-800/30 border border-gray-700/30 p-3 text-[11px] text-gray-500">
        <strong className="text-gray-400">Tip:</strong> Leave blank for generic booklets. Only filled fields will print.
      </div>
    </div>
  );
}
