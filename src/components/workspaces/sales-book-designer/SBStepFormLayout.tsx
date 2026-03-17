// =============================================================================
// DMSuite — Sales Book Step 2: Form Layout
// Configure which fields and how many item rows appear on the blank form.
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useSalesBookWizard } from "@/stores/sales-book-wizard";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
import { ITEM_COLUMNS, DOCUMENT_TYPE_CONFIGS } from "@/lib/sales-book/schema";
import type { SalesDocumentType } from "@/lib/invoice/schema";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-primary-500" : "bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
      <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">{label}</span>
    </label>
  );
}

// =============================================================================

export default function SBStepFormLayout() {
  const { nextStep, prevStep } = useSalesBookWizard();
  const form = useSalesBookEditor((s) => s.form);
  const layout = form.formLayout;
  const updateLayout = useSalesBookEditor((s) => s.updateLayout);
  const toggleColumn = useSalesBookEditor((s) => s.toggleColumn);
  const config = DOCUMENT_TYPE_CONFIGS[form.documentType as SalesDocumentType];

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center mb-8"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-100">Form Layout</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose which fields and columns to include on your blank {config.label.toLowerCase()} form
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* Item Table Rows */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Blank Item Rows: <span className="text-primary-400 font-bold">{layout.itemRowCount}</span>
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={layout.itemRowCount}
            onChange={(e) => updateLayout({ itemRowCount: Number(e.target.value) })}
            className="w-full accent-primary-500"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span>
          </div>
        </div>

        {/* Table Columns */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Item Table Columns</h3>
          <div className="grid grid-cols-2 gap-2">
            {ITEM_COLUMNS.filter((c) => !c.alwaysOn).map((col) => (
              <Toggle
                key={col.id}
                checked={layout.columns.includes(col.id)}
                onChange={() => toggleColumn(col.id)}
                label={col.label}
              />
            ))}
          </div>
        </div>

        {/* Header Fields */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Header Fields</h3>
          <div className="grid grid-cols-2 gap-2">
            <Toggle checked={layout.showDate} onChange={(v) => updateLayout({ showDate: v })} label="Date" />
            <Toggle checked={layout.showDueDate} onChange={(v) => updateLayout({ showDueDate: v })} label="Due Date" />
            <Toggle checked={layout.showRecipient} onChange={(v) => updateLayout({ showRecipient: v })} label={config.recipientLabel} />
            <Toggle checked={layout.showSender} onChange={(v) => updateLayout({ showSender: v })} label={config.senderLabel} />
            <Toggle checked={layout.showPoNumber} onChange={(v) => updateLayout({ showPoNumber: v })} label="P.O. Number" />
          </div>
        </div>

        {/* Footer / Totals */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Totals & Footer</h3>
          <div className="grid grid-cols-2 gap-2">
            <Toggle checked={layout.showSubtotal} onChange={(v) => updateLayout({ showSubtotal: v })} label="Subtotal" />
            <Toggle checked={layout.showDiscount} onChange={(v) => updateLayout({ showDiscount: v })} label="Discount" />
            <Toggle checked={layout.showTax} onChange={(v) => updateLayout({ showTax: v })} label="Tax / VAT" />
            <Toggle checked={layout.showTotal} onChange={(v) => updateLayout({ showTotal: v })} label="Total" />
            <Toggle checked={layout.showAmountInWords} onChange={(v) => updateLayout({ showAmountInWords: v })} label="Amount in Words" />
            <Toggle checked={layout.showSignature} onChange={(v) => updateLayout({ showSignature: v })} label="Signature Lines" />
            <Toggle checked={layout.showPaymentInfo} onChange={(v) => updateLayout({ showPaymentInfo: v })} label="Payment Info" />
            <Toggle checked={layout.showNotes} onChange={(v) => updateLayout({ showNotes: v })} label="Notes Area" />
            <Toggle checked={layout.showTerms} onChange={(v) => updateLayout({ showTerms: v })} label="Terms & Conditions" />
          </div>
        </div>

        {/* Terms text (shown if terms enabled) */}
        {layout.showTerms && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Pre-printed Terms Text
            </label>
            <textarea
              rows={2}
              value={layout.termsText}
              onChange={(e) => updateLayout({ termsText: e.target.value })}
              placeholder="Enter terms that will be pre-printed on every form"
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none resize-none transition-colors"
            />
          </div>
        )}

        {/* Currency Symbol */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Currency Symbol <span className="text-gray-600">(shown on amount fields)</span>
          </label>
          <input
            type="text"
            value={layout.currencySymbol}
            onChange={(e) => updateLayout({ currencySymbol: e.target.value })}
            placeholder="e.g. K, $, £ (leave blank for none)"
            className="w-40 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
          />
        </div>
      </motion.div>

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
