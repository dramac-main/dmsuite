// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo } from "react";
import {
  useInvoiceAccountingEditor,
  formatCurrency,
  calculateInvoiceTotals,
  calculateLineItemAmount,
  type LineItem,
} from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, BackButton, Field, Input, Textarea, Select, ClientPicker, TaxRatePicker, ProductPicker, StatusBadge, DeleteBtn, SectionDivider, formatDate } from "../shared";

export default function QuoteEditView({ id }: { id: string | null }) {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const updateQuote = useInvoiceAccountingEditor((s) => s.updateQuote);
  const addQuoteLineItem = useInvoiceAccountingEditor((s) => s.addQuoteLineItem);
  const updateQuoteLineItem = useInvoiceAccountingEditor((s) => s.updateQuoteLineItem);
  const removeQuoteLineItem = useInvoiceAccountingEditor((s) => s.removeQuoteLineItem);
  const setQuoteStatus = useInvoiceAccountingEditor((s) => s.setQuoteStatus);
  const convertQuoteToInvoice = useInvoiceAccountingEditor((s) => s.convertQuoteToInvoice);
  const removeQuote = useInvoiceAccountingEditor((s) => s.removeQuote);

  const quote = useMemo(() => {
    if (!id) return null;
    return form.quotes.find((q) => q.id === id) || null;
  }, [form.quotes, id]);

  if (!quote) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Quote not found" actions={<Btn variant="ghost" size="sm" onClick={() => setView("quotes")}>← Back</Btn>} />
      </div>
    );
  }

  const totals = calculateInvoiceTotals(quote.lineItems, quote.taxMode, quote.discount);

  const handleConvert = () => {
    const invId = convertQuoteToInvoice(quote.id);
    setView("invoice-edit", invId);
  };

  const handleAddFromProduct = (productId: string) => {
    const product = form.products.find((p) => p.id === productId);
    if (!product) return;
    const tax = form.taxes.find((t) => t.id === product.taxRateId);
    addQuoteLineItem(quote.id, {
      productId: product.id,
      description: product.name + (product.description ? ` — ${product.description}` : ""),
      unitPrice: product.unitPrice,
      taxRateId: product.taxRateId,
      taxRate: tax?.rate ?? 0,
      taxName: tax?.name ?? "No Tax",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={quote.number}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={quote.status} />
            {quote.status === "draft" && <Btn variant="secondary" size="sm" onClick={() => setQuoteStatus(quote.id, "sent")}>Mark Sent</Btn>}
            {(quote.status === "sent" || quote.status === "approved") && <Btn variant="primary" size="sm" onClick={handleConvert}>Convert to Invoice</Btn>}
            <Btn variant="danger" size="xs" onClick={() => { removeQuote(quote.id); setView("quotes"); }}>Delete</Btn>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
          <BackButton onClick={() => setView("quotes")} label="All Quotes" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Client" required><ClientPicker value={quote.clientId} onChange={(v) => updateQuote(quote.id, { clientId: v })} /></Field>
            <Field label="Quote Number"><Input value={quote.number} onChange={(v) => updateQuote(quote.id, { number: v })} /></Field>
            <Field label="Quote Date"><Input type="date" value={quote.date} onChange={(v) => updateQuote(quote.id, { date: v })} /></Field>
            <Field label="Valid Until"><Input type="date" value={quote.validUntil} onChange={(v) => updateQuote(quote.id, { validUntil: v })} /></Field>
            <Field label="Tax Mode">
              <Select value={quote.taxMode} onChange={(v) => updateQuote(quote.id, { taxMode: v as "inclusive" | "exclusive" })} options={[{ value: "exclusive", label: "Tax Exclusive" }, { value: "inclusive", label: "Tax Inclusive" }]} />
            </Field>
          </div>

          <SectionDivider title="Line Items" />
          <div className="space-y-2">
            {quote.lineItems.map((item, idx) => (
              <QuoteLineItemRow key={item.id} item={item} index={idx} quoteId={quote.id} taxMode={quote.taxMode} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="secondary" size="sm" onClick={() => addQuoteLineItem(quote.id)}>+ Add Line</Btn>
            {form.products.length > 0 && <div className="flex-1 max-w-xs"><ProductPicker value="" onChange={handleAddFromProduct} /></div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount Type">
              <Select value={quote.discount.type} onChange={(v) => updateQuote(quote.id, { discount: { ...quote.discount, type: v as "percent" | "fixed" } })} options={[{ value: "percent", label: "Percentage" }, { value: "fixed", label: "Fixed" }]} />
            </Field>
            <Field label={quote.discount.type === "percent" ? "Discount %" : "Discount Amount"}>
              <Input type="number" value={quote.discount.value} onChange={(v) => updateQuote(quote.id, { discount: { ...quote.discount, value: parseFloat(v) || 0 } })} />
            </Field>
          </div>

          <div className="rounded-xl border border-gray-800/40 p-4 space-y-2">
            <div className="flex justify-between text-[11px]"><span className="text-gray-500">Subtotal</span><span className="text-gray-300 tabular-nums">{formatCurrency(totals.subtotal, quote.currency)}</span></div>
            {totals.discountAmount > 0 && <div className="flex justify-between text-[11px]"><span className="text-gray-500">Discount</span><span className="text-red-400 tabular-nums">-{formatCurrency(totals.discountAmount, quote.currency)}</span></div>}
            <div className="flex justify-between text-[11px]"><span className="text-gray-500">Tax</span><span className="text-gray-300 tabular-nums">{formatCurrency(totals.taxTotal, quote.currency)}</span></div>
            <div className="border-t border-gray-800/40 pt-2 flex justify-between text-sm"><span className="font-semibold text-gray-200">Total</span><span className="font-bold text-gray-100 tabular-nums">{formatCurrency(totals.total, quote.currency)}</span></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Field label="Notes"><Textarea value={quote.notes} onChange={(v) => updateQuote(quote.id, { notes: v })} /></Field>
            <Field label="Terms"><Textarea value={quote.terms} onChange={(v) => updateQuote(quote.id, { terms: v })} /></Field>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuoteLineItemRow({ item, index, quoteId, taxMode }: { item: LineItem; index: number; quoteId: string; taxMode: "inclusive" | "exclusive" }) {
  const updateQuoteLineItem = useInvoiceAccountingEditor((s) => s.updateQuoteLineItem);
  const removeQuoteLineItem = useInvoiceAccountingEditor((s) => s.removeQuoteLineItem);
  const calc = calculateLineItemAmount(item, taxMode);

  return (
    <div className="rounded-lg border border-gray-800/30 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[9px] font-bold text-gray-600 mt-1">#{index + 1}</span>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div className="sm:col-span-2"><Input value={item.description} onChange={(v) => updateQuoteLineItem(quoteId, item.id, { description: v })} placeholder="Description" /></div>
          <Input type="number" value={item.quantity} onChange={(v) => updateQuoteLineItem(quoteId, item.id, { quantity: parseFloat(v) || 0 })} placeholder="Qty" />
          <Input type="number" value={item.unitPrice} onChange={(v) => updateQuoteLineItem(quoteId, item.id, { unitPrice: parseFloat(v) || 0 })} placeholder="Price" />
        </div>
        <DeleteBtn onClick={() => removeQuoteLineItem(quoteId, item.id)} />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 max-w-[200px]"><TaxRatePicker value={item.taxRateId} onChange={(v) => updateQuoteLineItem(quoteId, item.id, { taxRateId: v })} /></div>
        <Input type="number" value={item.discount} onChange={(v) => updateQuoteLineItem(quoteId, item.id, { discount: parseFloat(v) || 0 })} placeholder="Disc %" className="w-20" />
        <span className="text-[10px] text-gray-500 tabular-nums ml-auto">{formatCurrency(calc.total)}</span>
      </div>
    </div>
  );
}
