// =============================================================================
// DMSuite — Sales Book Section: Form Layout
// Item rows, columns, header fields, footer/totals toggles, currency.
// =============================================================================

"use client";

import { useState } from "react";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
import { ITEM_COLUMNS, DOCUMENT_TYPE_CONFIGS, CURRENCIES } from "@/lib/sales-book/schema";
import type { SalesDocumentType } from "@/lib/invoice/schema";
import { Toggle, AdvancedToggle, SectionLabel } from "./SalesUIKit";

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
  const [showFieldLabels, setShowFieldLabels] = useState(false);

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
          <SectionLabel>Item Table Columns</SectionLabel>
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
      )}

      {/* Receipt notice */}
      {isReceipt && (
        <div className="rounded-xl border border-gray-700/40 bg-gray-800/30 px-3.5 py-2.5 text-[11px] text-gray-400 leading-relaxed">
          Receipts use a traditional line-based layout with amount in words, amount box, and payment method fields. No item table is shown.
        </div>
      )}

      {/* Header Fields */}
      <div>
        <SectionLabel>Header Fields</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <Toggle checked={layout.showDate} onChange={(v) => updateLayout({ showDate: v })} label="Date" />
          <Toggle checked={layout.showDueDate} onChange={(v) => updateLayout({ showDueDate: v })} label="Due Date" />
          <Toggle checked={layout.showRecipient} onChange={(v) => updateLayout({ showRecipient: v })} label={config.recipientLabel} />
          <Toggle checked={layout.showSender} onChange={(v) => updateLayout({ showSender: v })} label={config.senderLabel} />
          <Toggle checked={layout.showPoNumber} onChange={(v) => updateLayout({ showPoNumber: v })} label="P.O. Number" />
        </div>
        <AdvancedToggle open={showAdvancedHeader} onToggle={() => setShowAdvancedHeader((v) => !v)} label="Custom header fields" />
        {showAdvancedHeader && (
          <div className="mt-2 pl-3 border-l-2 border-primary-500/20 ml-0.5 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Toggle checked={layout.showCustomField1 ?? false} onChange={(v) => updateLayout({ showCustomField1: v })} label="Custom Field 1" />
              <Toggle checked={layout.showCustomField2 ?? false} onChange={(v) => updateLayout({ showCustomField2: v })} label="Custom Field 2" />
            </div>
            {layout.showCustomField1 && (
              <input
                type="text"
                value={layout.customField1Label ?? ""}
                onChange={(e) => updateLayout({ customField1Label: e.target.value })}
                placeholder="Custom field 1 label (e.g. Job No.)"
                className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3.5 py-2 text-[13px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
            )}
            {layout.showCustomField2 && (
              <input
                type="text"
                value={layout.customField2Label ?? ""}
                onChange={(e) => updateLayout({ customField2Label: e.target.value })}
                placeholder="Custom field 2 label (e.g. Ref No.)"
                className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3.5 py-2 text-[13px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
            )}
          </div>
        )}
      </div>

      {/* Type-Specific Fields */}
      {(docType === "delivery-note" || docType === "quotation" || docType === "proforma-invoice" || docType === "credit-note" || docType === "purchase-order") && (
        <div>
          <SectionLabel>Type-Specific Fields</SectionLabel>
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
        </div>
      )}

      {/* Totals & Footer */}
      <div>
        <SectionLabel>
          {isReceipt ? "Receipt Fields" : "Totals & Footer"}
        </SectionLabel>
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
          <div className="mt-2 pl-3 border-l-2 border-primary-500/20 ml-0.5 space-y-3">
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
              <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Custom Footer Text <span className="text-gray-600 font-normal">(pre-printed)</span></label>
              <textarea
                rows={2}
                value={layout.customFooterText ?? ""}
                onChange={(e) => updateLayout({ customFooterText: e.target.value })}
                placeholder="e.g. Thank you for your business! All goods remain property of..."
                className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3.5 py-2 text-[13px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Editable Field Labels */}
      <div>
        <AdvancedToggle open={showFieldLabels} onToggle={() => setShowFieldLabels((v) => !v)} label="Customize field labels" />
        {showFieldLabels && (
          <div className="mt-2 pl-2 border-l-2 border-gray-700/50 space-y-2">
            <p className="text-[10px] text-gray-500">Override default labels printed on the form. Leave blank to use defaults.</p>

            {/* Document Title & Form Field Labels */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Document & Form Fields</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={layout.columnLabels?.["doc_title"] ?? ""}
                  onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), doc_title: e.target.value } })}
                  placeholder={config.title}
                  className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
                <input
                  type="text"
                  value={layout.columnLabels?.["field_recipient"] ?? ""}
                  onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_recipient: e.target.value } })}
                  placeholder={config.recipientLabel}
                  className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
                {layout.showSender && (
                  <input
                    type="text"
                    value={layout.columnLabels?.["field_sender"] ?? ""}
                    onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_sender: e.target.value } })}
                    placeholder={config.senderLabel}
                    className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                )}
                {layout.showDate && (
                  <input
                    type="text"
                    value={layout.columnLabels?.["field_date"] ?? ""}
                    onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_date: e.target.value } })}
                    placeholder="Date"
                    className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                )}
                {layout.showDueDate && (
                  <input
                    type="text"
                    value={layout.columnLabels?.["field_dueDate"] ?? ""}
                    onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_dueDate: e.target.value } })}
                    placeholder="Due Date"
                    className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                )}
                {layout.showPoNumber && (
                  <input
                    type="text"
                    value={layout.columnLabels?.["field_poNumber"] ?? ""}
                    onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_poNumber: e.target.value } })}
                    placeholder="P.O. Number"
                    className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                )}
                {layout.showAmountInWords && (
                  <input
                    type="text"
                    value={layout.columnLabels?.["field_amountWords"] ?? ""}
                    onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_amountWords: e.target.value } })}
                    placeholder="Amount in Words"
                    className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                )}
              </div>
            </div>

            {/* Column Headers — non-receipt only */}
            {!isReceipt && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Column Headers</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ITEM_COLUMNS.filter((c) => c.alwaysOn || layout.columns.includes(c.id)).map((col) => (
                    <input
                      key={col.id}
                      type="text"
                      value={layout.columnLabels?.[col.id] ?? ""}
                      onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), [col.id]: e.target.value } })}
                      placeholder={col.label}
                      className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Receipt field labels */}
            {isReceipt && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Receipt Fields</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "receipt_receivedFrom", placeholder: "Received from" },
                    { key: "receipt_sumOf", placeholder: "The sum of" },
                    { key: "receipt_paymentFor", placeholder: "Being payment for" },
                    { key: "receipt_payment", placeholder: "Payment" },
                    { key: "receipt_chequeRef", placeholder: "Cheque/Ref No" },
                    { key: "receipt_amount", placeholder: "Amount" },
                  ].map(({ key, placeholder }) => (
                    <input
                      key={key}
                      type="text"
                      value={layout.columnLabels?.[key] ?? ""}
                      onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), [key]: e.target.value } })}
                      placeholder={placeholder}
                      className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Totals Labels */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Totals Labels</h4>
              <div className="grid grid-cols-2 gap-2">
                {layout.showSubtotal && (
                  <input
                    type="text"
                    value={layout.subtotalLabel ?? ""}
                    onChange={(e) => updateLayout({ subtotalLabel: e.target.value })}
                    placeholder="Subtotal"
                    className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                )}
                {layout.showDiscount && (
                  <input
                    type="text"
                    value={layout.discountLabel ?? ""}
                    onChange={(e) => updateLayout({ discountLabel: e.target.value })}
                    placeholder="Discount"
                    className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                )}
                {layout.showTax && (
                  <input
                    type="text"
                    value={layout.taxLabel ?? ""}
                    onChange={(e) => updateLayout({ taxLabel: e.target.value })}
                    placeholder="Tax / VAT"
                    className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                )}
                {layout.showTotal && (
                  <input
                    type="text"
                    value={layout.totalLabel ?? ""}
                    onChange={(e) => updateLayout({ totalLabel: e.target.value })}
                    placeholder={config.amountLabel}
                    className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                )}
              </div>
            </div>

            {/* Signature Labels */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Signature Labels</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={layout.columnLabels?.["sig_left"] ?? ""}
                  onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), sig_left: e.target.value } })}
                  placeholder={isReceipt ? "Cashier / Received By" : docType === "purchase-order" ? "Authorized By" : docType === "delivery-note" ? "Delivered By" : "Prepared By"}
                  className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
                <input
                  type="text"
                  value={layout.columnLabels?.["sig_right"] ?? ""}
                  onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), sig_right: e.target.value } })}
                  placeholder={isReceipt ? "Authorized Signature" : docType === "purchase-order" ? "Approved By" : "Customer Signature"}
                  className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Receipt Payment Method Labels */}
            {isReceipt && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Payment Method Labels</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "receipt_cashLabel", placeholder: "Cash" },
                    { key: "receipt_chequeLabel", placeholder: "Cheque" },
                    { key: "receipt_transferLabel", placeholder: "Transfer" },
                    { key: "receipt_mobileLabel", placeholder: "Mobile" },
                  ].map(({ key, placeholder }) => (
                    <input
                      key={key}
                      type="text"
                      value={layout.columnLabels?.[key] ?? ""}
                      onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), [key]: e.target.value } })}
                      placeholder={placeholder}
                      className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Type-Specific Field Labels */}
            {docType === "quotation" && layout.showValidFor !== false && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Quotation Labels</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={layout.columnLabels?.["field_validFor"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_validFor: e.target.value } })} placeholder="Valid For" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                  <input type="text" value={layout.columnLabels?.["field_validForSuffix"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_validForSuffix: e.target.value } })} placeholder="Days from date of issue" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                </div>
              </div>
            )}
            {docType === "proforma-invoice" && layout.showValidUntil !== false && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Proforma Labels</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={layout.columnLabels?.["field_validUntil"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_validUntil: e.target.value } })} placeholder="Valid Until" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                </div>
              </div>
            )}
            {docType === "credit-note" && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Credit Note Labels</h4>
                <div className="grid grid-cols-2 gap-2">
                  {layout.showOriginalInvoice !== false && (
                    <>
                      <input type="text" value={layout.columnLabels?.["field_originalInvoiceNum"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_originalInvoiceNum: e.target.value } })} placeholder="Original Invoice #" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                      <input type="text" value={layout.columnLabels?.["field_originalInvoiceDate"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_originalInvoiceDate: e.target.value } })} placeholder="Original Invoice Date" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                    </>
                  )}
                  {layout.showReasonForCredit !== false && (
                    <input type="text" value={layout.columnLabels?.["field_reasonForCredit"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_reasonForCredit: e.target.value } })} placeholder="Reason for Credit" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                  )}
                </div>
              </div>
            )}
            {docType === "purchase-order" && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Purchase Order Labels</h4>
                <div className="grid grid-cols-2 gap-2">
                  {layout.showShipTo !== false && (
                    <input type="text" value={layout.columnLabels?.["field_shipTo"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_shipTo: e.target.value } })} placeholder="Ship To" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                  )}
                  {layout.showDeliveryBy !== false && (
                    <input type="text" value={layout.columnLabels?.["field_deliveryReqBy"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_deliveryReqBy: e.target.value } })} placeholder="Delivery Required By" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                  )}
                </div>
              </div>
            )}
            {docType === "delivery-note" && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Delivery Note Labels</h4>
                <div className="grid grid-cols-2 gap-2">
                  {layout.showVehicleNo !== false && (
                    <input type="text" value={layout.columnLabels?.["field_vehicleNo"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_vehicleNo: e.target.value } })} placeholder="Vehicle No." className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                  )}
                  {layout.showDriverName !== false && (
                    <input type="text" value={layout.columnLabels?.["field_driverName"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_driverName: e.target.value } })} placeholder="Driver Name" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                  )}
                  <input type="text" value={layout.columnLabels?.["field_goodsCondition"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_goodsCondition: e.target.value } })} placeholder="Goods Condition" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                  <input type="text" value={layout.columnLabels?.["field_goodLabel"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_goodLabel: e.target.value } })} placeholder="Good" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                  <input type="text" value={layout.columnLabels?.["field_damagedLabel"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_damagedLabel: e.target.value } })} placeholder="Damaged" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                </div>
              </div>
            )}

            {/* Banking / Payment Labels */}
            {layout.showPaymentInfo && !isReceipt && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Payment Info Labels</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "bank_sectionTitle", placeholder: "Payment Details" },
                    { key: "bank_bankName", placeholder: "Bank:" },
                    { key: "bank_accountName", placeholder: "Account Name:" },
                    { key: "bank_accountNo", placeholder: "Account No:" },
                    { key: "bank_branch", placeholder: "Branch:" },
                    { key: "bank_branchCode", placeholder: "Branch Code:" },
                    { key: "bank_swiftBic", placeholder: "SWIFT/BIC:" },
                    { key: "bank_iban", placeholder: "IBAN:" },
                    { key: "bank_sortCode", placeholder: "Sort/Routing Code:" },
                    { key: "bank_reference", placeholder: "Reference:" },
                  ].map(({ key, placeholder }) => (
                    <input
                      key={key}
                      type="text"
                      value={layout.columnLabels?.[key] ?? ""}
                      onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), [key]: e.target.value } })}
                      placeholder={placeholder}
                      className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Labels (Grid layout, TPIN) */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Other Labels</h4>
              <div className="grid grid-cols-2 gap-2">
                {form.companyBranding.taxId && (
                  <input type="text" value={layout.columnLabels?.["field_tpinLabel"] ?? ""} onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), field_tpinLabel: e.target.value } })} placeholder="TPIN" className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" />
                )}
                {[
                  { key: "grid_company", placeholder: "Company / Company Name" },
                  { key: "grid_phone", placeholder: "Tel / Phone" },
                  { key: "grid_address", placeholder: "Address" },
                  { key: "grid_email", placeholder: "Email" },
                ].map(({ key, placeholder }) => (
                  <input
                    key={key}
                    type="text"
                    value={layout.columnLabels?.[key] ?? ""}
                    onChange={(e) => updateLayout({ columnLabels: { ...(layout.columnLabels ?? {}), [key]: e.target.value } })}
                    placeholder={placeholder}
                    className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-[11px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                ))}
              </div>
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
