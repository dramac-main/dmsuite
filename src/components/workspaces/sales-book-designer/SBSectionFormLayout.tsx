// =============================================================================
// DMSuite — Sales Book Section: Form Layout
// Item rows, columns, header fields, footer/totals toggles, currency.
// =============================================================================

"use client";

import { useState } from "react";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
import { ITEM_COLUMNS, DOCUMENT_TYPE_CONFIGS, CURRENCIES } from "@/lib/sales-book/schema";
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
    <label className="flex items-center gap-2 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-4 w-7 rounded-full transition-colors shrink-0 ${
          checked ? "bg-primary-500" : "bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
            checked ? "translate-x-3" : ""
          }`}
        />
      </button>
      <span className="text-xs text-gray-300 group-hover:text-gray-100 transition-colors">{label}</span>
    </label>
  );
}

/** Reusable progressive disclosure toggle */
function AdvancedToggle({
  open,
  onToggle,
  label = "Advanced",
}: {
  open: boolean;
  onToggle: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-transform ${open ? "rotate-90" : ""}`}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
      {label}
    </button>
  );
}

export default function SBSectionFormLayout() {
  const form = useSalesBookEditor((s) => s.form);
  const layout = form.formLayout;
  const updateLayout = useSalesBookEditor((s) => s.updateLayout);
  const toggleColumn = useSalesBookEditor((s) => s.toggleColumn);
  const config = DOCUMENT_TYPE_CONFIGS[form.documentType as SalesDocumentType];
  const docType = form.documentType as SalesDocumentType;
  const isReceipt = config.receiptLayout;
  const [showAdvancedHeader, setShowAdvancedHeader] = useState(false);
  const [showAdvancedFooter, setShowAdvancedFooter] = useState(false);

  return (
    <div className="space-y-4">
      {/* Item Rows — hidden for receipts (no item table) */}
      {!isReceipt && (
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
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
          <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
            <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span>
          </div>
        </div>
      )}

      {/* Table Columns — hidden for receipts */}
      {!isReceipt && (
        <div>
          <h3 className="text-[11px] font-medium text-gray-500 mb-2">Item Table Columns</h3>
          <div className="grid grid-cols-2 gap-1.5">
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
      )}

      {/* Receipt notice */}
      {isReceipt && (
        <div className="rounded-lg border border-gray-700/60 bg-gray-800/40 px-3 py-2 text-[11px] text-gray-400 leading-relaxed">
          Receipts use a traditional line-based layout with amount in words, amount box, and payment method fields. No item table is shown.
        </div>
      )}

      {/* Header Fields */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-500 mb-2">Header Fields</h3>
        <div className="grid grid-cols-2 gap-1.5">
          <Toggle checked={layout.showDate} onChange={(v) => updateLayout({ showDate: v })} label="Date" />
          <Toggle checked={layout.showDueDate} onChange={(v) => updateLayout({ showDueDate: v })} label="Due Date" />
          <Toggle checked={layout.showRecipient} onChange={(v) => updateLayout({ showRecipient: v })} label={config.recipientLabel} />
          <Toggle checked={layout.showSender} onChange={(v) => updateLayout({ showSender: v })} label={config.senderLabel} />
          <Toggle checked={layout.showPoNumber} onChange={(v) => updateLayout({ showPoNumber: v })} label="P.O. Number" />
        </div>
        <AdvancedToggle open={showAdvancedHeader} onToggle={() => setShowAdvancedHeader((v) => !v)} label="Custom header fields" />
        {showAdvancedHeader && (
          <div className="mt-2 pl-2 border-l-2 border-gray-700/50 space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <Toggle checked={layout.showCustomField1 ?? false} onChange={(v) => updateLayout({ showCustomField1: v })} label="Custom Field 1" />
              <Toggle checked={layout.showCustomField2 ?? false} onChange={(v) => updateLayout({ showCustomField2: v })} label="Custom Field 2" />
            </div>
            {layout.showCustomField1 && (
              <input
                type="text"
                value={layout.customField1Label ?? ""}
                onChange={(e) => updateLayout({ customField1Label: e.target.value })}
                placeholder="Custom field 1 label (e.g. Job No.)"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
              />
            )}
            {layout.showCustomField2 && (
              <input
                type="text"
                value={layout.customField2Label ?? ""}
                onChange={(e) => updateLayout({ customField2Label: e.target.value })}
                placeholder="Custom field 2 label (e.g. Ref No.)"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none transition-colors"
              />
            )}
          </div>
        )}
      </div>

      {/* Type-Specific Fields */}
      {(docType === "delivery-note" || docType === "quotation" || docType === "proforma-invoice" || docType === "credit-note" || docType === "purchase-order") && (
        <div>
          <h3 className="text-[11px] font-medium text-gray-500 mb-2">Type-Specific Fields</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {docType === "delivery-note" && (
              <>
                <Toggle checked={layout.showVehicleNo ?? true} onChange={(v) => updateLayout({ showVehicleNo: v })} label="Vehicle No." />
                <Toggle checked={layout.showDriverName ?? true} onChange={(v) => updateLayout({ showDriverName: v })} label="Driver Name" />
              </>
            )}
            {docType === "quotation" && (
              <Toggle checked={layout.showValidFor ?? true} onChange={(v) => updateLayout({ showValidFor: v })} label="Valid For" />
            )}
            {docType === "proforma-invoice" && (
              <Toggle checked={layout.showValidUntil ?? true} onChange={(v) => updateLayout({ showValidUntil: v })} label="Valid Until" />
            )}
            {docType === "credit-note" && (
              <>
                <Toggle checked={layout.showOriginalInvoice ?? true} onChange={(v) => updateLayout({ showOriginalInvoice: v })} label="Original Invoice" />
                <Toggle checked={layout.showReasonForCredit ?? true} onChange={(v) => updateLayout({ showReasonForCredit: v })} label="Reason for Credit" />
              </>
            )}
            {docType === "purchase-order" && (
              <>
                <Toggle checked={layout.showShipTo ?? true} onChange={(v) => updateLayout({ showShipTo: v })} label="Ship To" />
                <Toggle checked={layout.showDeliveryBy ?? true} onChange={(v) => updateLayout({ showDeliveryBy: v })} label="Delivery Required By" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Totals & Footer */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-500 mb-2">
          {isReceipt ? "Receipt Fields" : "Totals & Footer"}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {!isReceipt && <Toggle checked={layout.showSubtotal} onChange={(v) => updateLayout({ showSubtotal: v })} label="Subtotal" />}
          {!isReceipt && <Toggle checked={layout.showTotal} onChange={(v) => updateLayout({ showTotal: v })} label="Total" />}
          {!isReceipt && <Toggle checked={layout.showTax} onChange={(v) => updateLayout({ showTax: v })} label="Tax / VAT" />}
          {!isReceipt && <Toggle checked={layout.showDiscount} onChange={(v) => updateLayout({ showDiscount: v })} label="Discount" />}
          <Toggle checked={layout.showAmountInWords} onChange={(v) => updateLayout({ showAmountInWords: v })} label="Amount in Words" />
          <Toggle checked={layout.showSignature} onChange={(v) => updateLayout({ showSignature: v })} label="Signature Lines" />
          {!isReceipt && <Toggle checked={layout.showPaymentInfo} onChange={(v) => updateLayout({ showPaymentInfo: v })} label="Payment Info" />}
        </div>
        <AdvancedToggle open={showAdvancedFooter} onToggle={() => setShowAdvancedFooter((v) => !v)} label="More footer options" />
        {showAdvancedFooter && (
          <div className="mt-2 pl-2 border-l-2 border-gray-700/50 space-y-3">
            <div className="grid grid-cols-2 gap-1.5">
              <Toggle checked={layout.showNotes} onChange={(v) => updateLayout({ showNotes: v })} label="Notes Area" />
              <Toggle checked={layout.showTerms} onChange={(v) => updateLayout({ showTerms: v })} label="Terms" />
            </div>
            {layout.showTerms && (
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Pre-printed Terms</label>
                <textarea
                  rows={2}
                  value={layout.termsText}
                  onChange={(e) => updateLayout({ termsText: e.target.value })}
                  placeholder="Enter terms to pre-print on every form"
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none resize-none transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Custom Footer Text <span className="text-gray-600 font-normal">(pre-printed)</span></label>
              <textarea
                rows={2}
                value={layout.customFooterText ?? ""}
                onChange={(e) => updateLayout({ customFooterText: e.target.value })}
                placeholder="e.g. Thank you for your business! All goods remain property of..."
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none resize-none transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Currency */}
      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
          Currency <span className="text-gray-600">(amounts)</span>
        </label>

        {/* Symbol vs Code display toggle */}
        <div className="flex gap-1.5 mb-2">
          {(["symbol", "code"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => updateLayout({ currencyDisplay: mode })}
              className={`px-3 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                (layout.currencyDisplay ?? "symbol") === mode
                  ? "border-primary-500 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/30"
                  : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200"
              }`}
            >
              {mode === "symbol" ? "Symbol (K, $, €)" : "Code (ZMW, USD, EUR)"}
            </button>
          ))}
        </div>

        {/* Currency selection grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {CURRENCIES.map((c) => {
            const isActive = layout.currencySymbol === c.symbol && (layout.currencyCode ?? "ZMW") === c.code;
            const displayLabel = (layout.currencyDisplay ?? "symbol") === "code" ? c.code : c.symbol;
            return (
              <button
                key={c.code}
                onClick={() => updateLayout({ currencySymbol: c.symbol, currencyCode: c.code })}
                title={`${c.name} (${c.code} — ${c.symbol})`}
                className={`px-2 py-1 rounded-lg border text-xs font-medium transition-all truncate ${
                  isActive
                    ? "border-primary-500 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/30"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                }`}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
