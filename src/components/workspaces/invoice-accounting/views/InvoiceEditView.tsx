
"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useInvoiceAccountingEditor,
  formatCurrency,
  calculateInvoiceTotals,
  calculateLineItemAmount,
  type Invoice,
  type LineItem,
  type InvoiceStatus,
  PAYMENT_METHODS,
} from "@/stores/invoice-accounting-editor";
import {
  PageHeader, Btn, BackButton, Field, Input, Textarea, Select, ClientPicker,
  TaxRatePicker, ProductPicker, StatusBadge, DeleteBtn, SectionDivider, formatDate,
} from "../shared";

export default function InvoiceEditView({ id }: { id: string | null }) {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const createInvoice = useInvoiceAccountingEditor((s) => s.createInvoice);
  const updateInvoice = useInvoiceAccountingEditor((s) => s.updateInvoice);
  const addInvoiceLineItem = useInvoiceAccountingEditor((s) => s.addInvoiceLineItem);
  const updateInvoiceLineItem = useInvoiceAccountingEditor((s) => s.updateInvoiceLineItem);
  const removeInvoiceLineItem = useInvoiceAccountingEditor((s) => s.removeInvoiceLineItem);
  const setInvoiceStatus = useInvoiceAccountingEditor((s) => s.setInvoiceStatus);
  const duplicateInvoice = useInvoiceAccountingEditor((s) => s.duplicateInvoice);
  const removeInvoice = useInvoiceAccountingEditor((s) => s.removeInvoice);
  const recordPayment = useInvoiceAccountingEditor((s) => s.recordPayment);

  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank-transfer");
  const [payRef, setPayRef] = useState("");

  // If id is null, create a new invoice
  const invoice = useMemo(() => {
    if (!id) return null;
    return form.invoices.find((i) => i.id === id) || null;
  }, [form.invoices, id]);

  if (!invoice) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Invoice not found" actions={<Btn variant="ghost" size="sm" onClick={() => setView("invoices")}>← Back</Btn>} />
        <div className="flex-1 flex items-center justify-center text-[11px] text-gray-500">This invoice doesn&apos;t exist or was deleted.</div>
      </div>
    );
  }

  const totals = calculateInvoiceTotals(invoice.lineItems, invoice.taxMode, invoice.discount);
  const paidAmount = form.payments.filter((p) => p.invoiceId === invoice.id).reduce((s, p) => s + p.amount, 0);
  const balance = totals.total - paidAmount;
  const client = form.clients.find((c) => c.id === invoice.clientId);

  const handleAddLine = () => {
    addInvoiceLineItem(invoice.id);
  };

  const handleAddFromProduct = (productId: string) => {
    const product = form.products.find((p) => p.id === productId);
    if (!product) return;
    const tax = form.taxes.find((t) => t.id === product.taxRateId);
    addInvoiceLineItem(invoice.id, {
      productId: product.id,
      description: product.name + (product.description ? ` — ${product.description}` : ""),
      unitPrice: product.unitPrice,
      taxRateId: product.taxRateId,
      taxRate: tax?.rate ?? 0,
      taxName: tax?.name ?? "No Tax",
    });
  };

  const handleRecordPayment = () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    recordPayment(invoice.id, {
      amount,
      date: new Date().toISOString().slice(0, 10),
      method: payMethod as never,
      reference: payRef,
      notes: "",
      currency: invoice.currency,
    });
    setShowPayment(false);
    setPayAmount("");
    setPayRef("");
  };

  const handleDuplicate = () => {
    const newId = duplicateInvoice(invoice.id);
    setView("invoice-edit", newId);
  };

  const handleDelete = () => {
    removeInvoice(invoice.id);
    setView("invoices");
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={invoice.number}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={invoice.status} />
            {invoice.status === "draft" && (
              <Btn variant="primary" size="sm" onClick={() => setInvoiceStatus(invoice.id, "sent")}>
                Mark Sent
              </Btn>
            )}
            {(invoice.status === "sent" || invoice.status === "partial") && (
              <Btn variant="primary" size="sm" onClick={() => setShowPayment(true)}>
                Record Payment
              </Btn>
            )}
            <Btn variant="secondary" size="sm" onClick={handleDuplicate}>Duplicate</Btn>
            <Btn variant="danger" size="xs" onClick={handleDelete}>Delete</Btn>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Back link */}
          <BackButton onClick={() => setView("invoices")} label="All Invoices" />

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Client" required>
              <ClientPicker value={invoice.clientId} onChange={(v) => updateInvoice(invoice.id, { clientId: v })} />
            </Field>
            <Field label="Invoice Number">
              <Input value={invoice.number} onChange={(v) => updateInvoice(invoice.id, { number: v })} />
            </Field>
            <Field label="Invoice Date">
              <Input type="date" value={invoice.date} onChange={(v) => updateInvoice(invoice.id, { date: v })} />
            </Field>
            <Field label="Due Date">
              <Input type="date" value={invoice.dueDate} onChange={(v) => updateInvoice(invoice.id, { dueDate: v })} />
            </Field>
            <Field label="PO Number">
              <Input value={invoice.poNumber} onChange={(v) => updateInvoice(invoice.id, { poNumber: v })} placeholder="Client's PO reference" />
            </Field>
            <Field label="Tax Mode">
              <Select
                value={invoice.taxMode}
                onChange={(v) => updateInvoice(invoice.id, { taxMode: v as "inclusive" | "exclusive" })}
                options={[
                  { value: "exclusive", label: "Tax Exclusive (add tax on top)" },
                  { value: "inclusive", label: "Tax Inclusive (tax included in price)" },
                ]}
              />
            </Field>
          </div>

          {/* Line Items */}
          <SectionDivider title="Line Items" />

          <div className="space-y-2">
            {invoice.lineItems.map((item, idx) => (
              <LineItemRow
                key={item.id}
                item={item}
                index={idx}
                invoiceId={invoice.id}
                taxMode={invoice.taxMode}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Btn variant="secondary" size="sm" onClick={handleAddLine}>+ Add Line</Btn>
            {form.products.length > 0 && (
              <div className="flex-1 max-w-xs">
                <ProductPicker value="" onChange={handleAddFromProduct} />
              </div>
            )}
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount Type">
              <Select
                value={invoice.discount.type}
                onChange={(v) => updateInvoice(invoice.id, { discount: { ...invoice.discount, type: v as "percent" | "fixed" } })}
                options={[
                  { value: "percent", label: "Percentage (%)" },
                  { value: "fixed", label: "Fixed Amount" },
                ]}
              />
            </Field>
            <Field label={invoice.discount.type === "percent" ? "Discount %" : "Discount Amount"}>
              <Input
                type="number"
                value={invoice.discount.value}
                onChange={(v) => updateInvoice(invoice.id, { discount: { ...invoice.discount, value: parseFloat(v) || 0 } })}
              />
            </Field>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-gray-800/40 p-4 space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-300 tabular-nums">{formatCurrency(totals.subtotal, invoice.currency)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Discount</span>
                <span className="text-red-400 tabular-nums">-{formatCurrency(totals.discountAmount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">Tax</span>
              <span className="text-gray-300 tabular-nums">{formatCurrency(totals.taxTotal, invoice.currency)}</span>
            </div>
            <div className="border-t border-gray-800/40 pt-2 flex justify-between text-sm">
              <span className="font-semibold text-gray-200">Total</span>
              <span className="font-bold text-gray-100 tabular-nums">{formatCurrency(totals.total, invoice.currency)}</span>
            </div>
            {paidAmount > 0 && (
              <>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-emerald-400 tabular-nums">-{formatCurrency(paidAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-200">Balance Due</span>
                  <span className={`font-bold tabular-nums ${balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {formatCurrency(balance, invoice.currency)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Notes / Terms */}
          <div className="grid grid-cols-1 gap-4">
            <Field label="Notes">
              <Textarea value={invoice.notes} onChange={(v) => updateInvoice(invoice.id, { notes: v })} placeholder="Notes visible to client" />
            </Field>
            <Field label="Terms & Conditions">
              <Textarea value={invoice.terms} onChange={(v) => updateInvoice(invoice.id, { terms: v })} placeholder="Payment terms" />
            </Field>
            <Field label="Footer">
              <Input value={invoice.footer} onChange={(v) => updateInvoice(invoice.id, { footer: v })} placeholder="Footer text" />
            </Field>
          </div>

          {/* Payments received */}
          {form.payments.filter((p) => p.invoiceId === invoice.id).length > 0 && (
            <>
              <SectionDivider title="Payments Received" />
              <div className="space-y-2">
                {form.payments
                  .filter((p) => p.invoiceId === invoice.id)
                  .map((pay) => (
                    <div key={pay.id} className="flex items-center justify-between rounded-lg border border-gray-800/30 px-3 py-2">
                      <div>
                        <div className="text-[11px] font-medium text-gray-300">{formatDate(pay.date)}</div>
                        <div className="text-[10px] text-gray-500">{pay.method} · {pay.reference || "No ref"}</div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-400 tabular-nums">
                        {formatCurrency(pay.amount, pay.currency)}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment dialog */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl bg-gray-900 border border-gray-700/40 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200">Record Payment</h3>
            <p className="text-[11px] text-gray-500">
              Balance due: {formatCurrency(balance, invoice.currency)}
            </p>
            <Field label="Amount">
              <Input type="number" value={payAmount} onChange={setPayAmount} placeholder={balance.toFixed(2)} />
            </Field>
            <Field label="Method">
              <Select value={payMethod} onChange={setPayMethod} options={PAYMENT_METHODS} />
            </Field>
            <Field label="Reference">
              <Input value={payRef} onChange={setPayRef} placeholder="Transaction reference" />
            </Field>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" size="sm" onClick={() => setShowPayment(false)}>Cancel</Btn>
              <Btn variant="primary" size="sm" onClick={handleRecordPayment}>Record Payment</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Line Item Row ──

function LineItemRow({
  item,
  index,
  invoiceId,
  taxMode,
}: {
  item: LineItem;
  index: number;
  invoiceId: string;
  taxMode: "inclusive" | "exclusive";
}) {
  const updateInvoiceLineItem = useInvoiceAccountingEditor((s) => s.updateInvoiceLineItem);
  const removeInvoiceLineItem = useInvoiceAccountingEditor((s) => s.removeInvoiceLineItem);

  const calc = calculateLineItemAmount(item, taxMode);

  return (
    <div className="rounded-lg border border-gray-800/30 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[9px] font-bold text-gray-600 mt-1">#{index + 1}</span>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div className="sm:col-span-2">
            <Input
              value={item.description}
              onChange={(v) => updateInvoiceLineItem(invoiceId, item.id, { description: v })}
              placeholder="Description"
            />
          </div>
          <Input
            type="number"
            value={item.quantity}
            onChange={(v) => updateInvoiceLineItem(invoiceId, item.id, { quantity: parseFloat(v) || 0 })}
            placeholder="Qty"
          />
          <Input
            type="number"
            value={item.unitPrice}
            onChange={(v) => updateInvoiceLineItem(invoiceId, item.id, { unitPrice: parseFloat(v) || 0 })}
            placeholder="Unit Price"
          />
        </div>
        <DeleteBtn onClick={() => removeInvoiceLineItem(invoiceId, item.id)} />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 max-w-[200px]">
          <TaxRatePicker
            value={item.taxRateId}
            onChange={(v) => updateInvoiceLineItem(invoiceId, item.id, { taxRateId: v })}
          />
        </div>
        <Input
          type="number"
          value={item.discount}
          onChange={(v) => updateInvoiceLineItem(invoiceId, item.id, { discount: parseFloat(v) || 0 })}
          placeholder="Disc %"
          className="w-20"
        />
        <span className="text-[10px] text-gray-500 tabular-nums ml-auto">
          {formatCurrency(calc.total)}
        </span>
      </div>
    </div>
  );
}
