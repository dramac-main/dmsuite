// @ts-nocheck — Scaffold: store methods not yet implemented
"use client";

import { useState, useEffect, useMemo } from "react";
import { useInvoiceAccountingEditor, formatCurrency, calculateLineItemAmount, type LineItem, type CreditNote } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, BackButton, DeleteBtn, Field, Input, Textarea, Select, ClientPicker, TaxRatePicker, ProductPicker, SectionDivider, formatDate } from "../shared";

function emptyLine(): LineItem {
  return { id: crypto.randomUUID(), productId: "", description: "", quantity: 1, unitPrice: 0, discount: 0, taxRateId: "", taxRate: 0, taxName: "" };
}

export default function CreditNoteEditView({ id: _id }: { id?: string | null }) {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const addCreditNote = useInvoiceAccountingEditor((s) => s.addCreditNote);
  const updateCreditNote = useInvoiceAccountingEditor((s) => s.updateCreditNote);
  const removeCreditNote = useInvoiceAccountingEditor((s) => s.removeCreditNote);
  const addCreditNoteLine = useInvoiceAccountingEditor((s) => s.addCreditNoteLine);
  const updateCreditNoteLine = useInvoiceAccountingEditor((s) => s.updateCreditNoteLine);
  const removeCreditNoteLine = useInvoiceAccountingEditor((s) => s.removeCreditNoteLine);

  const existing = form.editingId ? form.creditNotes.find((cn) => cn.id === form.editingId) : null;
  const isNew = !existing;

  // Local draft state for new credit notes
  const [draft, setDraft] = useState<Partial<CreditNote>>({
    clientId: "", invoiceId: "", creditNoteNumber: `CN-${String(form.creditNotes.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0], status: "draft", lineItems: [emptyLine()], notes: "", reason: "",
  });

  const cn = existing || draft;

  useEffect(() => {
    if (isNew && !draft.clientId && form.editingId === null) {
      setDraft((d) => ({ ...d, creditNoteNumber: `CN-${String(form.creditNotes.length + 1).padStart(4, "0")}` }));
    }
  }, [form.creditNotes.length, isNew, draft.clientId, form.editingId]);

  const update = (key: string, val: unknown) => {
    if (existing) updateCreditNote(existing.id, { [key]: val });
    else setDraft((d) => ({ ...d, [key]: val }));
  };

  const handleCreate = () => {
    if (!draft.clientId) return;
    const id = addCreditNote({
      clientId: draft.clientId!, invoiceId: draft.invoiceId || "", creditNoteNumber: draft.creditNoteNumber!,
      date: draft.date!, status: "draft", lineItems: draft.lineItems || [], notes: draft.notes || "", reason: draft.reason || "",
    });
    setView("creditnote-edit", id);
  };

  const handleDelete = () => { if (existing) { removeCreditNote(existing.id); setView("creditnote-list"); } };

  const lines = (cn.lineItems || []) as LineItem[];
  const subtotal = lines.reduce((s, li) => s + calculateLineItemAmount(li, form.taxRates).lineTotal, 0);
  const taxTotal = lines.reduce((s, li) => s + calculateLineItemAmount(li, form.taxRates).taxAmount, 0);
  const total = subtotal + taxTotal;

  const clientInvoices = form.invoices.filter((inv) => inv.clientId === cn.clientId);

  const updateLine = (lineId: string, key: string, val: unknown) => {
    if (existing) updateCreditNoteLine(existing.id, lineId, { [key]: val });
    else setDraft((d) => ({ ...d, lineItems: (d.lineItems || []).map((li) => li.id === lineId ? { ...li, [key]: val } : li) }));
  };

  const addLine = () => {
    const line = emptyLine();
    if (existing) addCreditNoteLine(existing.id, line);
    else setDraft((d) => ({ ...d, lineItems: [...(d.lineItems || []), line] }));
  };

  const removeLine = (lineId: string) => {
    if (existing) removeCreditNoteLine(existing.id, lineId);
    else setDraft((d) => ({ ...d, lineItems: (d.lineItems || []).filter((li) => li.id !== lineId) }));
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={isNew ? "New Credit Note" : `Credit Note ${existing?.creditNoteNumber}`}
        subtitle={isNew ? "Create a credit/refund" : undefined}
        actions={
          <div className="flex items-center gap-2">
            <BackButton onClick={() => setView("creditnote-list")} />
            {isNew && <Btn variant="primary" size="sm" onClick={handleCreate} disabled={!draft.clientId}>Create</Btn>}
            {existing && existing.status === "draft" && <Btn variant="primary" size="sm" onClick={() => updateCreditNote(existing.id, { status: "sent" })}>Mark Sent</Btn>}
            {existing && <DeleteBtn onClick={handleDelete} />}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Header fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Client">
            <ClientPicker clients={form.clients} value={cn.clientId || ""} onChange={(v) => update("clientId", v)} />
          </Field>
          <Field label="Credit Note #">
            <Input value={cn.creditNoteNumber || ""} onChange={(v) => update("creditNoteNumber", v)} />
          </Field>
          <Field label="Date">
            <Input type="date" value={cn.date || ""} onChange={(v) => update("date", v)} />
          </Field>
          <Field label="Linked Invoice">
            <Select value={cn.invoiceId || ""} onChange={(v) => update("invoiceId", v)} options={[{ value: "", label: "None" }, ...clientInvoices.map((inv) => ({ value: inv.id, label: `${inv.invoiceNumber} (${formatCurrency(inv.total)})` }))]} />
          </Field>
        </div>

        <Field label="Reason"><Input value={(cn as any).reason || ""} onChange={(v) => update("reason", v)} placeholder="Reason for credit note..." /></Field>

        <SectionDivider label="Line Items" />

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
                const calc = calculateLineItemAmount(li, form.taxRates);
                return (
                  <tr key={li.id} className="border-b border-gray-800/20">
                    <td className="py-1.5 pr-2">
                      <ProductPicker products={form.products} value={li.productId} onChange={(pid) => {
                        const prod = form.products.find((p) => p.id === pid);
                        if (prod) { updateLine(li.id, "productId", pid); updateLine(li.id, "description", prod.name); updateLine(li.id, "unitPrice", prod.price); if (prod.taxRateId) updateLine(li.id, "taxRateId", prod.taxRateId); }
                        else updateLine(li.id, "productId", pid);
                      }} />
                    </td>
                    <td className="py-1.5 pr-2"><Input value={li.description} onChange={(v) => updateLine(li.id, "description", v)} placeholder="Description" /></td>
                    <td className="py-1.5 pr-2"><Input type="number" value={String(li.quantity)} onChange={(v) => updateLine(li.id, "quantity", Number(v) || 0)} /></td>
                    <td className="py-1.5 pr-2"><Input type="number" value={String(li.unitPrice)} onChange={(v) => updateLine(li.id, "unitPrice", Number(v) || 0)} /></td>
                    <td className="py-1.5 pr-2"><TaxRatePicker rates={form.taxRates} value={li.taxRateId} onChange={(v) => updateLine(li.id, "taxRateId", v)} /></td>
                    <td className="py-1.5 pr-2 text-right font-medium text-gray-300 tabular-nums">{formatCurrency(calc.lineTotal + calc.taxAmount)}</td>
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
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="text-gray-300 tabular-nums">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="text-gray-300 tabular-nums">{formatCurrency(taxTotal)}</span></div>
            <div className="flex justify-between border-t border-gray-700 pt-1.5 font-semibold"><span className="text-gray-300">Credit Total</span><span className="text-primary-400 tabular-nums">{formatCurrency(total)}</span></div>
          </div>
        </div>

        <Field label="Notes"><Textarea value={cn.notes || ""} onChange={(v) => update("notes", v)} placeholder="Internal notes..." rows={3} /></Field>
      </div>
    </div>
  );
}
