// =============================================================================
// DMSuite — Sales Book Step 1: Company Branding
// Optional pre-printed company info (the only filled-in part of the form).
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useSalesBookWizard } from "@/stores/sales-book-wizard";
import { useSalesBookEditor } from "@/stores/sales-book-editor";

export default function SBStepBranding() {
  const { nextStep, prevStep } = useSalesBookWizard();
  const branding = useSalesBookEditor((s) => s.form.companyBranding);
  const update = useSalesBookEditor((s) => s.updateBranding);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center mb-8"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="12" y2="17" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-100">
          Company Branding
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Pre-printed on every form. Leave blank for generic booklets.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Company Name */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Company Name</label>
          <input
            type="text"
            value={branding.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Acme Trading Ltd"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
          />
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Tagline / Slogan</label>
          <input
            type="text"
            value={branding.tagline}
            onChange={(e) => update({ tagline: e.target.value })}
            placeholder="e.g. Quality Parts Since 1998"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Address</label>
          <textarea
            rows={2}
            value={branding.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="Enter company address"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors resize-none"
          />
        </div>

        {/* Phone & Email side-by-side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
            <input
              type="text"
              value={branding.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="+260 97X XXXXXX"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={branding.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="info@company.com"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Website & Tax ID */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Website</label>
            <input
              type="text"
              value={branding.website}
              onChange={(e) => update({ website: e.target.value })}
              placeholder="www.company.com"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Tax ID / TPIN</label>
            <input
              type="text"
              value={branding.taxId}
              onChange={(e) => update({ taxId: e.target.value })}
              placeholder="e.g. 1234567890"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Hint */}
        <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-3 text-xs text-gray-500">
          <strong className="text-gray-400">Tip:</strong> Leave all fields blank to create a
          generic blank form booklet (no company branding). Only filled fields will be pre-printed.
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className="rounded-lg bg-gray-800 border border-gray-700 px-5 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          className="rounded-lg bg-primary-500 px-5 py-2 text-sm font-semibold text-gray-950 hover:bg-primary-400 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
