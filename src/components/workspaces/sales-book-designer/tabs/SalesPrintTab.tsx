// =============================================================================
// DMSuite — Sales Print Tab
// Forms per page, page size, binding, serial numbering, cut lines
// Mobile-first, responsive grid layout
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
import {
  Toggle,
  SectionCard,
  SectionLabel,
  SelectionCard,
  FormInput,
  FormSelect,
} from "../SalesUIKit";

export default function SalesPrintTab() {
  const form = useSalesBookEditor((s) => s.form);
  const serial = form.serialConfig;
  const print = form.printConfig;
  const updateSerial = useSalesBookEditor((s) => s.updateSerial);
  const updatePrint = useSalesBookEditor((s) => s.updatePrint);
  const updateLayout = useSalesBookEditor((s) => s.updateLayout);

  const forms = totalFormCount(serial);
  const pages = totalPageCount(serial, print);

  return (
    <div className="space-y-5 p-4">
      {/* ── Forms Per Page ── */}
      <SectionCard title="Forms Per Page" description="How many forms fit on each printed page">
        <div className="grid grid-cols-3 gap-2.5">
          {FORMS_PER_PAGE_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.value}
              selected={print.formsPerPage === opt.value}
              onClick={() => {
                updatePrint({ formsPerPage: opt.value, showCutLines: opt.value > 1 });
                if (opt.value === 2) updateLayout({ itemRowCount: Math.min(form.formLayout.itemRowCount, 8) });
                if (opt.value === 3) updateLayout({ itemRowCount: Math.min(form.formLayout.itemRowCount, 4) });
              }}
              className="p-3"
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-7 h-10 rounded border border-gray-600/60 flex flex-col gap-0.5 p-0.5">
                  {Array.from({ length: opt.value }, (_, i) => (
                    <div key={i} className={`flex-1 rounded-sm ${print.formsPerPage === opt.value ? "bg-primary-500/30" : "bg-gray-700/60"}`} />
                  ))}
                </div>
                <span className="text-[11px] text-gray-300 font-medium">{opt.value}/page</span>
              </div>
            </SelectionCard>
          ))}
        </div>
      </SectionCard>

      {/* ── Page Size ── */}
      <SectionCard title="Page Size">
        <div className="grid grid-cols-3 gap-2.5">
          {(["a4", "letter", "legal"] as const).map((size) => {
            const dim = PAGE_DIMENSIONS[size];
            return (
              <SelectionCard
                key={size}
                selected={print.pageSize === size}
                onClick={() => updatePrint({ pageSize: size })}
                className="p-3"
              >
                <div className="text-center">
                  <span className="text-[12px] text-gray-200 font-medium block">{dim.label.split(" ")[0]}</span>
                  <span className="text-[9px] text-gray-500 mt-0.5 block">{dim.label.match(/\((.+)\)/)?.[1]}</span>
                </div>
              </SelectionCard>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Binding Position ── */}
      <SectionCard title="Binding Position" description="Where the stapling/padding edge is">
        <div className="grid grid-cols-2 gap-2.5">
          {([
            { value: "left" as const, label: "Left Side", desc: "Flip right" },
            { value: "top" as const, label: "Top Edge", desc: "Flip up" },
          ]).map((opt) => (
            <SelectionCard
              key={opt.value}
              selected={print.bindingPosition === opt.value}
              onClick={() => updatePrint({ bindingPosition: opt.value })}
              className="p-3"
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-10 rounded border border-gray-600/60 relative overflow-hidden`}>
                  <div className={`absolute ${opt.value === "left" ? "left-0 top-0 bottom-0 w-1.5" : "left-0 top-0 right-0 h-1.5"} ${print.bindingPosition === opt.value ? "bg-primary-500/40" : "bg-gray-600"}`} />
                </div>
                <span className="text-[11px] text-gray-300 font-medium">{opt.label}</span>
                <span className="text-[9px] text-gray-600">{opt.desc}</span>
              </div>
            </SelectionCard>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-2">
          Adds ~12mm gutter on the binding edge for stapling/padding.
        </p>
      </SectionCard>

      {/* ── Serial Numbering ── */}
      <SectionCard title="Serial Numbering">
        <Toggle
          checked={serial.showSerial}
          onChange={(v) => updateSerial({ showSerial: v })}
          label="Show serial numbers on each form"
        />

        {serial.showSerial && (
          <div className="space-y-3 mt-3">
            <FormInput
              label="Prefix"
              value={serial.prefix}
              onChange={(e) => updateSerial({ prefix: e.target.value })}
              placeholder="INV-"
              className="w-32"
            />
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Start #"
                type="number"
                value={String(serial.startNumber)}
                onChange={(e) => updateSerial({ startNumber: Math.max(1, Number(e.target.value)) })}
              />
              <FormInput
                label="End #"
                type="number"
                value={String(serial.endNumber)}
                onChange={(e) => updateSerial({ endNumber: Math.max(serial.startNumber, Number(e.target.value)) })}
              />
            </div>
            <FormSelect
              label="Zero-padding"
              value={String(serial.digitCount)}
              onChange={(e) => updateSerial({ digitCount: Number(e.target.value) })}
            >
              <option value="3">3 digits (001)</option>
              <option value="4">4 digits (0001)</option>
              <option value="5">5 digits (00001)</option>
              <option value="6">6 digits (000001)</option>
            </FormSelect>

            {/* Preview */}
            <div className="rounded-xl bg-gray-800/40 border border-gray-700/40 p-3">
              <div className="font-mono text-xs text-gray-300">
                {formatSerialNumber(serial, 0)} → {formatSerialNumber(serial, forms - 1)}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {forms} forms · {pages} pages ({print.formsPerPage}/page)
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Cut Lines ── */}
      {print.formsPerPage > 1 && (
        <SectionCard>
          <Toggle
            checked={print.showCutLines}
            onChange={(v) => updatePrint({ showCutLines: v })}
            label="Show cut lines between forms"
          />
        </SectionCard>
      )}
    </div>
  );
}
