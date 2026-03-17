// =============================================================================
// DMSuite — Sales Book Section: Print & Serial Config
// Forms per page, page size, serial numbering, cut lines.
// =============================================================================

"use client";

import { useSalesBookEditor } from "@/stores/sales-book-editor";
import {
  FORMS_PER_PAGE_OPTIONS,
  PAGE_DIMENSIONS,
  formatSerialNumber,
  totalFormCount,
  totalPageCount,
} from "@/lib/sales-book/schema";

export default function SBSectionPrintConfig() {
  const form = useSalesBookEditor((s) => s.form);
  const serial = form.serialConfig;
  const print = form.printConfig;
  const updateSerial = useSalesBookEditor((s) => s.updateSerial);
  const updatePrint = useSalesBookEditor((s) => s.updatePrint);
  const updateLayout = useSalesBookEditor((s) => s.updateLayout);

  const forms = totalFormCount(serial);
  const pages = totalPageCount(serial, print);

  return (
    <div className="space-y-4">
      {/* Forms Per Page */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-500 mb-2">Forms Per Page</h3>
        <div className="grid grid-cols-3 gap-2">
          {FORMS_PER_PAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                updatePrint({ formsPerPage: opt.value, showCutLines: opt.value > 1 });
                if (opt.value === 2) updateLayout({ itemRowCount: Math.min(form.formLayout.itemRowCount, 8) });
                if (opt.value === 3) updateLayout({ itemRowCount: Math.min(form.formLayout.itemRowCount, 4) });
              }}
              className={`rounded-lg border p-2 text-center transition-all ${
                print.formsPerPage === opt.value
                  ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <div className="flex flex-col items-center gap-1 mb-1">
                <div className="w-6 h-9 rounded border border-gray-600 flex flex-col gap-0.5 p-0.5">
                  {Array.from({ length: opt.value }, (_, i) => (
                    <div key={i} className={`flex-1 rounded-sm ${print.formsPerPage === opt.value ? "bg-primary-500/30" : "bg-gray-700"}`} />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-gray-300 font-medium">{opt.value}/page</span>
            </button>
          ))}
        </div>
      </div>

      {/* Page Size */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-500 mb-2">Page Size</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["a4", "letter", "legal"] as const).map((size) => {
            const dim = PAGE_DIMENSIONS[size];
            return (
              <button
                key={size}
                onClick={() => updatePrint({ pageSize: size })}
                className={`rounded-lg border p-2 text-center transition-all ${
                  print.pageSize === size
                    ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                <span className="text-xs text-gray-200 font-medium">{dim.label.split(" ")[0]}</span>
                <div className="text-[9px] text-gray-500 mt-0.5">{dim.label.match(/\((.+)\)/)?.[1]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Binding Position */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-500 mb-2">Binding Position</h3>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: "left" as const, label: "Left Side", desc: "Flip right →" },
            { value: "top" as const, label: "Top Edge", desc: "Flip up ↑" },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => updatePrint({ bindingPosition: opt.value })}
              className={`rounded-lg border p-2 text-center transition-all ${
                print.bindingPosition === opt.value
                  ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <div className="flex flex-col items-center gap-1 mb-1">
                <div className={`w-7 h-9 rounded border border-gray-600 relative overflow-hidden ${print.bindingPosition === opt.value ? "border-primary-500/50" : ""}`}>
                  <div className={`absolute ${opt.value === "left" ? "left-0 top-0 bottom-0 w-1.5" : "left-0 top-0 right-0 h-1.5"} ${print.bindingPosition === opt.value ? "bg-primary-500/40" : "bg-gray-600"}`} />
                </div>
              </div>
              <span className="text-[10px] text-gray-300 font-medium block">{opt.label}</span>
              <span className="text-[8px] text-gray-600">{opt.desc}</span>
            </button>
          ))}
        </div>
        <div className="mt-1.5 text-[10px] text-gray-600">
          Adds {"\u2248"}12mm gutter on the binding edge for stapling/padding.
        </div>
      </div>

      {/* Serial Numbering */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-500 mb-2">Serial Numbering</h3>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <button
            type="button"
            role="switch"
            aria-checked={serial.showSerial}
            onClick={() => updateSerial({ showSerial: !serial.showSerial })}
            className={`relative h-4 w-7 rounded-full transition-colors shrink-0 ${serial.showSerial ? "bg-primary-500" : "bg-gray-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${serial.showSerial ? "translate-x-3" : ""}`} />
          </button>
          <span className="text-xs text-gray-300">Show serial numbers</span>
        </label>

        {serial.showSerial && (
          <div className="space-y-2 pl-0.5">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Prefix</label>
              <input
                type="text"
                value={serial.prefix}
                onChange={(e) => updateSerial({ prefix: e.target.value })}
                className="w-28 rounded-lg bg-gray-800 border border-gray-700 px-2.5 py-1 text-sm text-gray-100 font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Start #</label>
                <input type="number" min={1} value={serial.startNumber} onChange={(e) => updateSerial({ startNumber: Math.max(1, Number(e.target.value)) })} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-2.5 py-1 text-sm text-gray-100 font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">End #</label>
                <input type="number" min={serial.startNumber} value={serial.endNumber} onChange={(e) => updateSerial({ endNumber: Math.max(serial.startNumber, Number(e.target.value)) })} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-2.5 py-1 text-sm text-gray-100 font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Zero-padding</label>
              <select
                value={serial.digitCount}
                onChange={(e) => updateSerial({ digitCount: Number(e.target.value) })}
                className="w-20 rounded-lg bg-gray-800 border border-gray-700 px-2.5 py-1 text-sm text-gray-100 focus:border-primary-500 outline-none transition-colors"
              >
                <option value={3}>3</option><option value={4}>4</option><option value={5}>5</option><option value={6}>6</option>
              </select>
            </div>
            <div className="rounded-lg bg-gray-800/60 border border-gray-700/50 p-2">
              <div className="font-mono text-xs text-gray-300">
                {formatSerialNumber(serial, 0)} → {formatSerialNumber(serial, forms - 1)}
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">
                {forms} forms · {pages} pages ({print.formsPerPage}/page)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cut Lines */}
      {print.formsPerPage > 1 && (
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            role="switch"
            aria-checked={print.showCutLines}
            onClick={() => updatePrint({ showCutLines: !print.showCutLines })}
            className={`relative h-4 w-7 rounded-full transition-colors shrink-0 ${print.showCutLines ? "bg-primary-500" : "bg-gray-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${print.showCutLines ? "translate-x-3" : ""}`} />
          </button>
          <span className="text-xs text-gray-300">Show cut lines between forms</span>
        </label>
      )}
    </div>
  );
}
