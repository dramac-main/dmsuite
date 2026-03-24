// =============================================================================
// DMSuite — Invoice Editor: Sections Panel (Left)
// Inline editing of all invoice data: business, client, items, payment, notes.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import {
  calcLineItemTotal,
  calcLineItemTax,
  formatMoney,
  CURRENCIES,
  PAYMENT_TERMS,
  INVOICE_STATUSES,
  type PaymentTermsId,
  type InvoiceStatus,
} from "@/lib/invoice/schema";

// ── Icons ──

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconPanelLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

// ── Tiny field ──

function F({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  const cls =
    "w-full rounded bg-gray-800/60 border border-gray-700/40 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none transition focus:border-primary-500/50";
  return (
    <div className="space-y-0.5">
      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

// ── Accordion ──

type SectionId = "details" | "business" | "client" | "items" | "payment" | "notes" | "charges";

function AccordionSection({
  id,
  title,
  openId,
  onToggle,
  badge,
  children,
}: {
  id: SectionId;
  title: string;
  openId: SectionId | null;
  onToggle: (id: SectionId) => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isOpen = openId === id;
  return (
    <div className="border-b border-gray-800/40">
      <button
        onClick={() => onToggle(id)}
        className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
      >
        <span className="flex items-center gap-2">
          {title}
          {badge}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <IconChevronDown className="text-gray-600" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================

interface Props {
  onCollapse: () => void;
}

export default function InvoiceEditorSectionsPanel({ onCollapse }: Props) {
  const invoice = useInvoiceEditor((s) => s.invoice);
  const updateBusinessInfo = useInvoiceEditor((s) => s.updateBusinessInfo);
  const updateClientInfo = useInvoiceEditor((s) => s.updateClientInfo);
  const setInvoiceNumber = useInvoiceEditor((s) => s.setInvoiceNumber);
  const setIssueDate = useInvoiceEditor((s) => s.setIssueDate);
  const setDueDate = useInvoiceEditor((s) => s.setDueDate);
  const setPoNumber = useInvoiceEditor((s) => s.setPoNumber);
  const setPaymentTerms = useInvoiceEditor((s) => s.setPaymentTerms);
  const setStatus = useInvoiceEditor((s) => s.setStatus);
  const addLineItem = useInvoiceEditor((s) => s.addLineItem);
  const updateLineItem = useInvoiceEditor((s) => s.updateLineItem);
  const removeLineItem = useInvoiceEditor((s) => s.removeLineItem);
  const setCurrency = useInvoiceEditor((s) => s.setCurrency);
  const updatePaymentInfo = useInvoiceEditor((s) => s.updatePaymentInfo);
  const setNotes = useInvoiceEditor((s) => s.setNotes);
  const setTerms = useInvoiceEditor((s) => s.setTerms);
  const addCharge = useInvoiceEditor((s) => s.addCharge);
  const updateCharge = useInvoiceEditor((s) => s.updateCharge);
  const removeCharge = useInvoiceEditor((s) => s.removeCharge);

  const [openId, setOpenId] = useState<SectionId | null>("items");

  const toggle = useCallback(
    (id: SectionId) => setOpenId((prev) => (prev === id ? null : id)),
    []
  );

  const b = invoice.businessInfo;
  const c = invoice.clientInfo;
  const cur = invoice.currency;

  return (
    <div className="h-full flex flex-col bg-gray-900/60 border-r border-gray-800/40">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/40">
        <span className="text-xs font-semibold text-gray-300">Invoice Data</span>
        <button
          onClick={onCollapse}
          className="rounded p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 transition-colors"
          title="Collapse panel"
        >
          <IconPanelLeft />
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {/* ── Invoice Details ── */}
        <AccordionSection id="details" title="Invoice Details" openId={openId} onToggle={toggle}>
          <div className="grid grid-cols-2 gap-2">
            <F label="Invoice #" value={invoice.invoiceNumber} onChange={setInvoiceNumber} placeholder="INV-001" />
            <div className="space-y-0.5">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</label>
              <select
                value={invoice.status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full rounded bg-gray-800/60 border border-gray-700/40 px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-primary-500/50"
              >
                {INVOICE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="Issue Date" value={invoice.issueDate} onChange={setIssueDate} type="date" />
            <F label="Due Date" value={invoice.dueDate} onChange={setDueDate} type="date" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Terms</label>
              <select
                value={invoice.paymentTerms}
                onChange={(e) => {
                  setPaymentTerms(e.target.value as PaymentTermsId);
                  if (invoice.issueDate) setIssueDate(invoice.issueDate);
                }}
                className="w-full rounded bg-gray-800/60 border border-gray-700/40 px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-primary-500/50"
              >
                {PAYMENT_TERMS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Currency</label>
              <select
                value={cur.code}
                onChange={(e) => {
                  const found = CURRENCIES.find((c) => c.code === e.target.value);
                  if (found) setCurrency({ code: found.code, symbol: found.symbol, locale: found.locale });
                }}
                className="w-full rounded bg-gray-800/60 border border-gray-700/40 px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-primary-500/50"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>
          </div>
          <F label="P.O. Number" value={invoice.poNumber} onChange={setPoNumber} placeholder="Optional" />
        </AccordionSection>

        {/* ── Business ── */}
        <AccordionSection id="business" title="Your Business" openId={openId} onToggle={toggle}>
          <F label="Company" value={b.name} onChange={(v) => updateBusinessInfo({ name: v })} placeholder="Acme Corp" />
          <F label="Address" value={b.address} onChange={(v) => updateBusinessInfo({ address: v })} multiline />
          <div className="grid grid-cols-2 gap-2">
            <F label="Email" value={b.email} onChange={(v) => updateBusinessInfo({ email: v })} />
            <F label="Phone" value={b.phone} onChange={(v) => updateBusinessInfo({ phone: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="Website" value={b.website} onChange={(v) => updateBusinessInfo({ website: v })} />
            <F label="Tax ID" value={b.taxId} onChange={(v) => updateBusinessInfo({ taxId: v })} />
          </div>
        </AccordionSection>

        {/* ── Client ── */}
        <AccordionSection id="client" title="Client" openId={openId} onToggle={toggle}>
          <div className="grid grid-cols-2 gap-2">
            <F label="Name" value={c.name} onChange={(v) => updateClientInfo({ name: v })} />
            <F label="Company" value={c.company} onChange={(v) => updateClientInfo({ company: v })} />
          </div>
          <F label="Address" value={c.address} onChange={(v) => updateClientInfo({ address: v })} multiline />
          <div className="grid grid-cols-2 gap-2">
            <F label="Email" value={c.email} onChange={(v) => updateClientInfo({ email: v })} />
            <F label="Phone" value={c.phone} onChange={(v) => updateClientInfo({ phone: v })} />
          </div>
          <F label="Tax ID" value={c.taxId} onChange={(v) => updateClientInfo({ taxId: v })} />
        </AccordionSection>

        {/* ── Line Items ── */}
        <AccordionSection
          id="items"
          title="Line Items"
          openId={openId}
          onToggle={toggle}
          badge={
            <span className="rounded-full bg-gray-700/60 px-1.5 py-0.5 text-[9px] text-gray-400">
              {invoice.lineItems.length}
            </span>
          }
        >
          {invoice.lineItems.map((item, idx) => {
            const total = calcLineItemTotal(item) + calcLineItemTax(item);
            return (
              <div
                key={item.id}
                className="rounded-xl border border-gray-700/40 bg-gray-800/20 p-2 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500">#{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-gray-300 tabular-nums">
                      {formatMoney(total, cur)}
                    </span>
                    <button
                      onClick={() => removeLineItem(item.id)}
                      className="rounded p-0.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                  placeholder="Description"
                  className="w-full rounded bg-gray-800/50 border border-gray-700/30 px-2 py-1 text-xs text-gray-200 outline-none focus:border-primary-500/50"
                />
                <div className="grid grid-cols-3 gap-1.5">
                  <F
                    label="Qty"
                    value={item.quantity}
                    onChange={(v) => updateLineItem(item.id, { quantity: parseFloat(v) || 0 })}
                    type="number"
                  />
                  <F
                    label="Price"
                    value={item.unitPrice}
                    onChange={(v) => updateLineItem(item.id, { unitPrice: parseFloat(v) || 0 })}
                    type="number"
                  />
                  <F
                    label="Tax %"
                    value={item.taxRate}
                    onChange={(v) => updateLineItem(item.id, { taxRate: parseFloat(v) || 0 })}
                    type="number"
                  />
                </div>
              </div>
            );
          })}
          <button
            onClick={() => addLineItem()}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-dashed border-gray-700/40 py-2 text-[11px] text-gray-500 hover:text-primary-400 hover:border-primary-500/30 transition-colors"
          >
            <IconPlus /> Add Item
          </button>
        </AccordionSection>

        {/* ── Additional Charges ── */}
        <AccordionSection id="charges" title="Additional Charges" openId={openId} onToggle={toggle}>
          {invoice.additionalCharges.map((ch) => (
            <div key={ch.id} className="flex items-center gap-2">
              <input
                type="text"
                value={ch.label}
                onChange={(e) => updateCharge(ch.id, { label: e.target.value })}
                placeholder="Label"
                className="flex-1 rounded bg-gray-800/50 border border-gray-700/30 px-2 py-1 text-xs text-gray-200 outline-none focus:border-primary-500/50"
              />
              <input
                type="number"
                value={ch.amount}
                onChange={(e) => updateCharge(ch.id, { amount: parseFloat(e.target.value) || 0 })}
                className="w-20 rounded bg-gray-800/50 border border-gray-700/30 px-2 py-1 text-xs text-gray-200 outline-none focus:border-primary-500/50 tabular-nums"
              />
              <select
                value={ch.type}
                onChange={(e) => updateCharge(ch.id, { type: e.target.value as "percent" | "fixed" })}
                className="rounded bg-gray-800/50 border border-gray-700/30 px-1.5 py-1 text-xs text-gray-200 outline-none"
              >
                <option value="fixed">Fixed</option>
                <option value="percent">%</option>
              </select>
              <button
                onClick={() => removeCharge(ch.id)}
                className="rounded p-0.5 text-gray-600 hover:text-red-400 transition-colors"
              >
                <IconTrash />
              </button>
            </div>
          ))}
          <button
            onClick={() => addCharge()}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-dashed border-gray-700/40 py-1.5 text-[11px] text-gray-500 hover:text-primary-400 hover:border-primary-500/30 transition-colors"
          >
            <IconPlus /> Add Charge
          </button>
        </AccordionSection>

        {/* ── Payment ── */}
        <AccordionSection id="payment" title="Payment Info" openId={openId} onToggle={toggle}>
          <div className="grid grid-cols-2 gap-2">
            <F label="Bank" value={invoice.paymentInfo.bankName} onChange={(v) => updatePaymentInfo({ bankName: v })} />
            <F label="Account Name" value={invoice.paymentInfo.accountName} onChange={(v) => updatePaymentInfo({ accountName: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="Account #" value={invoice.paymentInfo.accountNumber} onChange={(v) => updatePaymentInfo({ accountNumber: v })} />
            <F label="Routing #" value={invoice.paymentInfo.routingNumber} onChange={(v) => updatePaymentInfo({ routingNumber: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="SWIFT" value={invoice.paymentInfo.swiftCode} onChange={(v) => updatePaymentInfo({ swiftCode: v })} />
            <F label="PayPal" value={invoice.paymentInfo.paypalEmail} onChange={(v) => updatePaymentInfo({ paypalEmail: v })} />
          </div>
        </AccordionSection>

        {/* ── Notes & Terms ── */}
        <AccordionSection id="notes" title="Notes & Terms" openId={openId} onToggle={toggle}>
          <F label="Notes" value={invoice.notes} onChange={setNotes} multiline placeholder="Thank you for your business!" />
          <F label="Terms & Conditions" value={invoice.terms} onChange={setTerms} multiline />
        </AccordionSection>
      </div>
    </div>
  );
}
