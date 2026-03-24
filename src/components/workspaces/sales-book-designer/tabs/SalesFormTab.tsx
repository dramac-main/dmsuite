// =============================================================================
// DMSuite — Sales Form Tab
// Document type selection + item rows + columns + header/footer fields
// Mobile-first, clean layout with progressive disclosure
// =============================================================================

"use client";

import { useState } from "react";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
import {
  SALES_DOCUMENT_TYPES,
  DOCUMENT_TYPE_CONFIGS,
  ITEM_COLUMNS,
  CURRENCIES,
} from "@/lib/sales-book/schema";
import type { SalesDocumentType } from "@/lib/invoice/schema";
import {
  Toggle,
  AdvancedToggle,
  SectionCard,
  SelectionCard,
  RangeSlider,
  FormInput,
  SectionLabel,
} from "../SalesUIKit";

// ── Color accent per document type (brand-only: primary-500 / Electric Violet) ──

const TYPE_COLORS: Record<SalesDocumentType, string> = {
  "invoice":          "border-primary-500/40 bg-primary-500/8 ring-primary-500/20",
  "quotation":        "border-primary-500/40 bg-primary-500/8 ring-primary-500/20",
  "receipt":          "border-primary-500/40 bg-primary-500/8 ring-primary-500/20",
  "delivery-note":    "border-primary-500/40 bg-primary-500/8 ring-primary-500/20",
  "credit-note":      "border-primary-500/40 bg-primary-500/8 ring-primary-500/20",
  "proforma-invoice": "border-primary-500/40 bg-primary-500/8 ring-primary-500/20",
  "purchase-order":   "border-primary-500/40 bg-primary-500/8 ring-primary-500/20",
};

const TYPE_ICONS: Record<SalesDocumentType, React.ReactNode> = {
  "invoice": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>,
  "quotation": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>,
  "receipt": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  "delivery-note": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  "credit-note": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M15 13H9"/></svg>,
  "proforma-invoice": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="15" r="3"/></svg>,
  "purchase-order": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
};

// =============================================================================

export default function SalesFormTab() {
  const form = useSalesBookEditor((s) => s.form);
  const layout = form.formLayout;
  const updateLayout = useSalesBookEditor((s) => s.updateLayout);
  const toggleColumn = useSalesBookEditor((s) => s.toggleColumn);
  const convertToType = useSalesBookEditor((s) => s.convertToType);

  const config = DOCUMENT_TYPE_CONFIGS[form.documentType as SalesDocumentType];
  const docType = form.documentType as SalesDocumentType;
  const isReceipt = config.receiptLayout;

  const [showAdvancedHeader, setShowAdvancedHeader] = useState(false);
  const [showAdvancedFooter, setShowAdvancedFooter] = useState(false);
  const [showFieldLabels, setShowFieldLabels] = useState(false);

  return (
    <div className="space-y-5 p-4">
      {/* ── Document Type ── */}
      <SectionCard title="Document Type" description="Choose the type of sales form">
        <div className="grid grid-cols-2 gap-2">
          {SALES_DOCUMENT_TYPES.map((type) => {
            const cfg = DOCUMENT_TYPE_CONFIGS[type];
            const selected = docType === type;
            return (
              <SelectionCard
                key={type}
                selected={selected}
                onClick={() => convertToType(type)}
                colorAccent={TYPE_COLORS[type]}
                className="p-2.5"
              >
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 mt-0.5 ${selected ? "text-gray-200" : "text-gray-500"}`}>
                    {TYPE_ICONS[type]}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-gray-200 leading-tight">{cfg.label}</div>
                    <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{cfg.description}</div>
                  </div>
                </div>
              </SelectionCard>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Item Rows (hidden for receipts) ── */}
      {!isReceipt && (
        <SectionCard title="Item Table" description="Configure the line items grid">
          <div className="space-y-4">
            <RangeSlider
              label="Blank Rows"
              value={layout.itemRowCount}
              onChange={(v) => updateLayout({ itemRowCount: v })}
              min={1}
              max={20}
              suffix=" rows"
            />

            <div>
              <SectionLabel>Visible Columns</SectionLabel>
              <div className="grid grid-cols-2 gap-2 mt-1">
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
          </div>
        </SectionCard>
      )}

      {/* Receipt notice */}
      {isReceipt && (
        <SectionCard>
          <p className="text-[12px] text-gray-400 leading-relaxed">
            Receipts use a traditional line-based layout with amount in words, amount box, and payment method fields.
          </p>
        </SectionCard>
      )}

      {/* ── Header Fields ── */}
      <SectionCard title="Header Fields" description="What appears at the top of each form">
        <div className="grid grid-cols-2 gap-2">
          <Toggle checked={layout.showDate} onChange={(v) => updateLayout({ showDate: v })} label="Date" />
          <Toggle checked={layout.showDueDate} onChange={(v) => updateLayout({ showDueDate: v })} label="Due Date" />
          <Toggle checked={layout.showRecipient} onChange={(v) => updateLayout({ showRecipient: v })} label={config.recipientLabel} />
          <Toggle checked={layout.showSender} onChange={(v) => updateLayout({ showSender: v })} label={config.senderLabel} />
          <Toggle checked={layout.showPoNumber} onChange={(v) => updateLayout({ showPoNumber: v })} label="P.O. Number" />
        </div>

        <AdvancedToggle open={showAdvancedHeader} onToggle={() => setShowAdvancedHeader((v) => !v)} label="Custom header fields" />
        {showAdvancedHeader && (
          <div className="mt-3 pl-3 border-l-2 border-primary-500/20 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <Toggle checked={layout.showCustomField1 ?? false} onChange={(v) => updateLayout({ showCustomField1: v })} label="Custom Field 1" />
              <Toggle checked={layout.showCustomField2 ?? false} onChange={(v) => updateLayout({ showCustomField2: v })} label="Custom Field 2" />
            </div>
            {layout.showCustomField1 && (
              <FormInput
                value={layout.customField1Label ?? ""}
                onChange={(e) => updateLayout({ customField1Label: e.target.value })}
                placeholder="Custom field 1 label (e.g. Job No.)"
              />
            )}
            {layout.showCustomField2 && (
              <FormInput
                value={layout.customField2Label ?? ""}
                onChange={(e) => updateLayout({ customField2Label: e.target.value })}
                placeholder="Custom field 2 label (e.g. Ref No.)"
              />
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Type-Specific Fields ── */}
      {(docType === "delivery-note" || docType === "quotation" || docType === "proforma-invoice" || docType === "credit-note" || docType === "purchase-order") && (
        <SectionCard title={`${config.label} Fields`}>
          <div className="grid grid-cols-2 gap-2">
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
        </SectionCard>
      )}

      {/* ── Totals & Footer ── */}
      <SectionCard title={isReceipt ? "Receipt Fields" : "Totals & Footer"}>
        <div className="grid grid-cols-2 gap-2">
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
          <div className="mt-3 pl-3 border-l-2 border-primary-500/20 space-y-3">
            <div className="grid grid-cols-2 gap-2">
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
                  className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3.5 py-2 text-[13px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Custom Footer Text</label>
              <textarea
                rows={2}
                value={layout.customFooterText ?? ""}
                onChange={(e) => updateLayout({ customFooterText: e.target.value })}
                placeholder="e.g. Thank you for your business!"
                className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3.5 py-2 text-[13px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none transition-all"
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Currency ── */}
      <SectionCard title="Currency" description="Choose the currency symbol for your forms">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Toggle
              checked={layout.currencyDisplay === "symbol"}
              onChange={(v) => updateLayout({ currencyDisplay: v ? "symbol" : "code" })}
              label={layout.currencyDisplay === "symbol" ? "Symbol (K, $, €)" : "Code (ZMW, USD)"}
            />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {CURRENCIES.map((c) => {
              const isActive = layout.currencyCode === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => updateLayout({ currencyCode: c.code, currencySymbol: c.symbol })}
                  className={`rounded-xl border px-2.5 py-2 text-center transition-all active:scale-[0.97] ${
                    isActive
                      ? "border-primary-500/50 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/20"
                      : "border-gray-700/40 bg-gray-800/30 text-gray-400 hover:border-gray-600/60 hover:text-gray-300"
                  }`}
                >
                  <span className="text-[12px] font-semibold block">{c.symbol}</span>
                  <span className="text-[9px] text-gray-500 block mt-0.5">{c.code}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* ── Field Labels Override ── */}
      <AdvancedToggle open={showFieldLabels} onToggle={() => setShowFieldLabels((v) => !v)} label="Customize field labels" />
      {showFieldLabels && (
        <SectionCard>
          <p className="text-[11px] text-gray-500 mb-3">Override default labels printed on the form. Leave blank to use defaults.</p>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Document Title"
              value={layout.columnLabels?.documentTitle ?? ""}
              onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), documentTitle: e.target.value } })}
              placeholder={config.label}
            />
            <FormInput
              label="Date Label"
              value={layout.columnLabels?.dateLabel ?? ""}
              onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), dateLabel: e.target.value } })}
              placeholder="DATE"
            />
            <FormInput
              label="Subtotal"
              value={layout.subtotalLabel ?? ""}
              onChange={(e) => updateLayout({ subtotalLabel: e.target.value })}
              placeholder="Subtotal"
            />
            <FormInput
              label="Total"
              value={layout.totalLabel ?? ""}
              onChange={(e) => updateLayout({ totalLabel: e.target.value })}
              placeholder="Total"
            />
            <FormInput
              label="Tax Label"
              value={layout.taxLabel ?? ""}
              onChange={(e) => updateLayout({ taxLabel: e.target.value })}
              placeholder="Tax / VAT"
            />
            <FormInput
              label="Discount"
              value={layout.discountLabel ?? ""}
              onChange={(e) => updateLayout({ discountLabel: e.target.value })}
              placeholder="Discount"
            />
          </div>
        </SectionCard>
      )}
    </div>
  );
}
