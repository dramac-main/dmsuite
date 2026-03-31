"use client";

import { useState, useEffect } from "react";
import { useInvoiceAccountingEditor, formatCurrency, calculateLineItemAmount, type LineItem } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, BackButton, DeleteBtn, Field, Input, Textarea, Select, ClientPicker, TaxRatePicker, ProductPicker, SectionDivider, formatDate } from "../shared";

function emptyLine(): LineItem {
  return { id: crypto.randomUUID(), productId: "", description: "", quantity: 1, unitPrice: 0, discount: 0, taxRateId: "", taxRate: 0, taxName: "" };
}

export default function CreditNoteEditView({ id: _id }: { id?: string | null }) {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const createCreditNote = useInvoiceAccountingEditor((s) => s.createCreditNote);
  const updateCreditNote = useInvoiceAccountingEditor((s) => s.updateCreditNote);
  const removeCreditNote = useInvoiceAccountingEditor((s) => s.removeCreditNote);
  const addCreditNoteLineItem = useInvoiceAccountingEditor((s) => s.addCreditNoteLineItem);
  const updateCreditNoteLineItem = useInvoiceAccountingEditor((s) => s.updateCreditNoteLineItem);
  const removeCreditNoteLineItem = useInvoiceAccountingEditor((s) => s.removeCreditNoteLineItem);

  const existing = form.activeRecordId ? form.creditNotes.find((cn) => cn.id === form.activeRecordId) : null;
  const isNew = !existing;

  const [draftClientId, setDraftClientId] = useState("");
  const [draftInvoiceId, setDraftInvoiceId] = useState("");
  const [draftDate, setDraftDate] = useState(new Date().toISOString().split("T")[0]);
  const [draftReason, setDraftReason] = useState("");
  const [draftLines, setDraftLines] = useState<LineItem[]>([emptyLine()]);

  const clientId = existing ? existing.clientId : draftClientId;
  const lines = existing ? existing.lineItems : draftLines;

  // Compute totals — credit notes have no taxMode field, default to "exclusive"
  const taxMode = "exclusive" as const;
  const subtotal = lines.reduce((s, li) => s + calculateLineItemAmount(li, taxMode).subtotal, 0);
  const taxTotal = lines.reduce((s, li) => s + calculateLineItemAmount(li, taxMode).tax, 0);
  const total = subtotal + taxTotal;

  const clientInvoices = form.invoices.filter((inv) => inv.clientId === clientId);

  const handleCreate = () => {
    if (!draftClientId) return;
    const cnId = createCreditNote(draftClientId, draftInvoiceId || undefined);
    // Apply draft values
    updateCreditNote(cnId, {
      date: draftDate,
      reason: draftReason,
    });
    // Add draft line items
    for (const li of draftLines) {
      if (li.description || li.productId) {
        addCreditNoteLineItem(cnId, {
          productId: li.productId,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          discount: li.discount,
          taxRateId: li.taxRateId,
          taxRate: li.taxRate,
          taxName: li.taxName,
        });
      }
    }
    setView("credit-note-edit", cnId);
  };

  const handleDelete = () => {
    if (existing) {
      removeCreditNote(existing.id);
      setView("credit-notes");
    }
  };

  const updateLine = (lineId: string, key: string, val: unknown) => {
    if (existing) {
      updateCreditNoteLineItem(existing.id, lineId, { [key]: val });
    } else {
      setDraftLines((prev) => prev.map((li) => li.id === lineId ? { ...li, [key]: val } : li));
    }
  };

  const addLine = () => {
    const line = emptyLine();
    if (existing) {
      addCreditNoteLineItem(existing.id, line);
    } else {
      setDraftLines((prev) => [...prev, line]);
    }
  };

  const removeLine = (lineId: string) => {
    if (existing) {
      removeCreditNoteLineItem(existing.id, lineId);
    } else {
      setDraftLines((prev) => prev.filter((li) => li.id !== lineId));
    }
  };

  const applyProduct = (lineId: string, productId: string) => {
    const prod = form.products.find((p) => p.id === productId);
    if (prod) {
      updateLine(lineId, "productId", productId);
      updateLine(lineId, "description", prod.name);
      updateLine(lineId, "unitPrice", prod.unitPrice);
      if (prod.taxRateId) {
        const tax = form.taxes.find((t) => t.id === prod.taxRateId);
        updateLine(lineId, "taxRateId", prod.taxRateId);
        if (tax) {
          updateLine(lineId, "taxRate", tax.rate);
          updateLine(lineId, "taxName", tax.name);
        }
      }
    } else {
      updateLine(lineId, "productId", productId);
    }
  };

  const applyTax = (lineId: string, taxRateId: string) => {
    const tax = form.taxes.find((t) => t.id === taxRateId);
    updateLine(lineId, "taxRateId", taxRateId);
    if (tax) {
      updateLine(lineId, "taxRate", tax.rate);
      updateLine(lineId, "taxName", tax.name);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={isNew ? "New Credit Note" : `Credit Note ${existing?.number}`}
        subtitle={isNew ? "Create a credit/refund" : undefined}
        actions={
          <div className="flex items-center gap-2">
            <BackButton onClick={() => setView("credit-notes")} />
            {isNew && <Btn variant="primary" size="sm" onClick={handleCreate} disabled={!draftClientId}>Create</Btn>}
            {existing && existing.status === "draft" && (
              <Btn variant="primary" size="sm" onClick={() => updateCreditNote(existing.id, { status: "sent" })}>Mark Sent</Btn>
            )}
            {existing && <DeleteBtn onClick={handleDelete} />}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Header fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Client">
            <ClientPicker
              value={clientId}
              onChange={(v) => {
                if (existing) updateCreditNote(existing.id, { clientId: v });
                else setDraftClientId(v);
              }}
            />
          </Field>
          <Field label="Credit Note #">
            <Input value={existing?.number || `CN-${String(form.creditNotes.length + 1).padStart(4, "0")}`} onChange={(v) => { if (existing) updateCreditNote(existing.id, { number: v }); }} disabled={isNew} />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={existing ? existing.date : draftDate}
              onChange={(v) => {
                if (existing) updateCreditNote(existing.id, { date: v });
                else setDraftDate(v);
              }}
            />
          </Field>
          <Field label="Linked Invoice">
            <Select
              value={existing ? existing.invoiceId : draftInvoiceId}
              onChange={(v) => {
                if (existing) updateCreditNote(existing.id, { invoiceId: v });
                else setDraftInvoiceId(v);
              }}
              options={[
                { value: "", label: "None" },
                ...clientInvoices.map((inv) => ({
                  value: inv.id,
                  label: `${inv.number} (${formatCurrency(calculateLineItemAmount(inv.lineItems[0] || emptyLine(), inv.taxMode).total, inv.currency)})`,
                })),
              ]}
            />
          </Field>
        </div>

        <Field label="Reason">
          <Input
            value={existing ? existing.reason : draftReason}
            onChange={(v) => {
              if (existing) updateCreditNote(existing.id, { reason: v });
              else setDraftReason(v);
            }}
            placeholder="Reason for credit note..."
          />
        </Field>

        <SectionDivider title="Line Items" />

        {/* Line items table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800/40">
                <th className="text-left py-2 pr-2 font-medium">Product</th>
                <th className="text-left py-2 pr-2 font-medium">Description</th>
                <th className="text-right py-2 pr-2 font-medium w-20">Qty</th>
                <th className="text-right py-2 pr-2 font-medium w-24">Price</th>
                <th className="text-left py-2 pr-2 font-medium w-32">Tax</th>
                <th className="text-right py-2 pr-2 font-medium w-24">Total</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((li) => {
                const calc = calculateLineItemAmount(li, taxMode);
                return (
                  <tr key={li.id} className="border-b border-gray-800/20">
                    <td className="py-1.5 pr-2">
                      <ProductPicker value={li.productId} onChange={(pid) => applyProduct(li.id, pid)} />
                    </td>
                    <td className="py-1.5 pr-2">
                      <Input value={li.description} onChange={(v) => updateLine(li.id, "description", v)} placeholder="Description" />
                    </td>
                    <td className="py-1.5 pr-2">
                      <Input type="number" value={String(li.quantity)} onChange={(v) => updateLine(li.id, "quantity", Number(v) || 0)} />
                    </td>
                    <td className="py-1.5 pr-2">
                      <Input type="number" value={String(li.unitPrice)} onChange={(v) => updateLine(li.id, "unitPrice", Number(v) || 0)} />
                    </td>
                    <td className="py-1.5 pr-2">
                      <TaxRatePicker value={li.taxRateId} onChange={(tid) => applyTax(li.id, tid)} />
                    </td>
                    <td className="py-1.5 pr-2 text-right font-medium text-gray-300 tabular-nums">
                      {formatCurrency(calc.total)}
                    </td>
                    <td className="py-1.5"><DeleteBtn onClick={() => removeLine(li.id)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Btn variant="ghost" size="xs" onClick={addLine} className="mt-2">+ Add Line</Btn>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-300 tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tax</span>
              <span className="text-gray-300 tabular-nums">{formatCurrency(taxTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-1.5 font-semibold">
              <span className="text-gray-300">Credit Total</span>
              <span className="text-primary-400 tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
