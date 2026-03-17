// =============================================================================
// DMSuite — Sales Book Step 3: Print & Serial Config
// Forms per page, serial numbering, page size, and cut lines.
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useSalesBookWizard } from "@/stores/sales-book-wizard";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
import {
  FORMS_PER_PAGE_OPTIONS,
  PAGE_DIMENSIONS,
  DOCUMENT_TYPE_CONFIGS,
  formatSerialNumber,
  totalFormCount,
  totalPageCount,
} from "@/lib/sales-book/schema";
import type { SalesDocumentType, PageFormat } from "@/lib/invoice/schema";

// =============================================================================

export default function SBStepPrintConfig() {
  const { nextStep, prevStep } = useSalesBookWizard();
  const form = useSalesBookEditor((s) => s.form);
  const serial = form.serialConfig;
  const print = form.printConfig;
  const updateSerial = useSalesBookEditor((s) => s.updateSerial);
  const updatePrint = useSalesBookEditor((s) => s.updatePrint);
  const updateLayout = useSalesBookEditor((s) => s.updateLayout);
  const config = DOCUMENT_TYPE_CONFIGS[form.documentType as SalesDocumentType];

  const forms = totalFormCount(serial);
  const pages = totalPageCount(serial, print);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center mb-8"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-100">Print & Serial</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure how your {config.label.toLowerCase()} booklet will be printed
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* Forms Per Page */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Forms Per Page</h3>
          <div className="grid grid-cols-3 gap-2">
            {FORMS_PER_PAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  updatePrint({ formsPerPage: opt.value, showCutLines: opt.value > 1 });
                  // Auto-adjust row count for multi-form layouts
                  if (opt.value === 2) updateLayout({ itemRowCount: Math.min(form.formLayout.itemRowCount, 8) });
                  if (opt.value === 3) updateLayout({ itemRowCount: Math.min(form.formLayout.itemRowCount, 4) });
                }}
                className={`rounded-lg border p-3 text-center transition-all ${
                  print.formsPerPage === opt.value
                    ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                {/* Visual preview */}
                <div className="flex flex-col items-center gap-1 mb-2">
                  <div className="w-8 h-11 rounded border border-gray-600 flex flex-col gap-0.5 p-0.5">
                    {Array.from({ length: opt.value }, (_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm ${
                          print.formsPerPage === opt.value ? "bg-primary-500/30" : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-300 font-medium">{opt.value} per page</span>
              </button>
            ))}
          </div>
        </div>

        {/* Page Size */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Page Size</h3>
          <div className="grid grid-cols-3 gap-2">
            {(["a4", "letter", "legal"] as const).map((size) => {
              const dim = PAGE_DIMENSIONS[size];
              return (
                <button
                  key={size}
                  onClick={() => updatePrint({ pageSize: size })}
                  className={`rounded-lg border p-3 text-center transition-all ${
                    print.pageSize === size
                      ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                      : "border-gray-700 bg-gray-800 hover:border-gray-600"
                  }`}
                >
                  <span className="text-sm text-gray-200 font-medium">{dim.label.split(" ")[0]}</span>
                  <div className="text-[10px] text-gray-500 mt-0.5">{dim.label.match(/\((.+)\)/)?.[1]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Serial Numbering */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Serial Numbering</h3>

          <label className="flex items-center gap-2.5 cursor-pointer mb-3">
            <button
              type="button"
              role="switch"
              aria-checked={serial.showSerial}
              onClick={() => updateSerial({ showSerial: !serial.showSerial })}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                serial.showSerial ? "bg-primary-500" : "bg-gray-700"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${serial.showSerial ? "translate-x-4" : ""}`} />
            </button>
            <span className="text-sm text-gray-300">Show serial numbers on forms</span>
          </label>

          {serial.showSerial && (
            <div className="space-y-3 pl-1">
              {/* Prefix */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Prefix</label>
                <input
                  type="text"
                  value={serial.prefix}
                  onChange={(e) => updateSerial({ prefix: e.target.value })}
                  className="w-32 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-gray-100 font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
                />
              </div>

              {/* Start & End */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Number</label>
                  <input
                    type="number"
                    min={1}
                    value={serial.startNumber}
                    onChange={(e) => updateSerial({ startNumber: Math.max(1, Number(e.target.value)) })}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-gray-100 font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Number</label>
                  <input
                    type="number"
                    min={serial.startNumber}
                    value={serial.endNumber}
                    onChange={(e) => updateSerial({ endNumber: Math.max(serial.startNumber, Number(e.target.value)) })}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-gray-100 font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Digit Count */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Zero-padding Digits</label>
                <select
                  value={serial.digitCount}
                  onChange={(e) => updateSerial({ digitCount: Number(e.target.value) })}
                  className="w-24 rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-gray-100 focus:border-primary-500 outline-none transition-colors"
                >
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                </select>
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-gray-800/60 border border-gray-700/50 p-3">
                <div className="text-[10px] text-gray-500 mb-1">Preview</div>
                <div className="font-mono text-sm text-gray-300">
                  {formatSerialNumber(serial, 0)} → {formatSerialNumber(serial, forms - 1)}
                </div>
                <div className="text-[10px] text-gray-600 mt-1">
                  {forms} forms · {pages} pages ({print.formsPerPage}/page)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cut Lines */}
        {print.formsPerPage > 1 && (
          <label className="flex items-center gap-2.5 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={print.showCutLines}
              onClick={() => updatePrint({ showCutLines: !print.showCutLines })}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                print.showCutLines ? "bg-primary-500" : "bg-gray-700"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${print.showCutLines ? "translate-x-4" : ""}`} />
            </button>
            <span className="text-sm text-gray-300">Show cut/perforation lines between forms</span>
          </label>
        )}
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
