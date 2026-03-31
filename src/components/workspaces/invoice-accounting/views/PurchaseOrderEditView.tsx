// @ts-nocheck — Scaffold: store methods not yet implemented
"use client";

import { useState, useEffect } from "react";
import { useInvoiceAccountingEditor, formatCurrency, calculateLineItemAmount, type LineItem, type PurchaseOrder } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, BackButton, DeleteBtn, Field, Input, Textarea, Select, SectionDivider, TaxRatePicker, ProductPicker } from "../shared";

function emptyLine(): LineItem {
  return { id: crypto.randomUUID(), productId: "", description: "", quantity: 1, unitPrice: 0, discount: 0, taxRateId: "", taxRate: 0, taxName: "" };
}

export default function PurchaseOrderEditView({ id: _id }: { id?: string | null }) {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const addPurchaseOrder = useInvoiceAccountingEditor((s) => s.addPurchaseOrder);
  const updatePurchaseOrder = useInvoiceAccountingEditor((s) => s.updatePurchaseOrder);
  const removePurchaseOrder = useInvoiceAccountingEditor((s) => s.removePurchaseOrder);
  const addPOLine = useInvoiceAccountingEditor((s) => s.addPOLine);
  const updatePOLine = useInvoiceAccountingEditor((s) => s.updatePOLine);
  const removePOLine = useInvoiceAccountingEditor((s) => s.removePOLine);

  const existing = form.editingId ? form.purchaseOrders.find((po) => po.id === form.editingId) : null;
  const isNew = !existing;

  const [draft, setDraft] = useState<Partial<PurchaseOrder>>({
    vendorId: "", poNumber: `PO-${String(form.purchaseOrders.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0], expectedDelivery: "", status: "draft",
    lineItems: [emptyLine()], notes: "", shippingAddress: "",
  });

  const po = existing || draft;

  useEffect(() => {
    if (isNew) setDraft((d) => ({ ...d, poNumber: `PO-${String(form.purchaseOrders.length + 1).padStart(4, "0")}` }));
  }, [form.purchaseOrders.length, isNew]);

  const update = (key: string, val: unknown) => {
    if (existing) updatePurchaseOrder(existing.id, { [key]: val });
    else setDraft((d) => ({ ...d, [key]: val }));
  };

  const handleCreate = () => {
    if (!draft.vendorId) return;
    const id = addPurchaseOrder({
      vendorId: draft.vendorId!, poNumber: draft.poNumber!, date: draft.date!, expectedDelivery: draft.expectedDelivery || "",
      status: "draft", lineItems: draft.lineItems || [], notes: draft.notes || "", shippingAddress: draft.shippingAddress || "",
    });
    setView("po-edit", id);
  };

  const handleDelete = () => { if (existing) { removePurchaseOrder(existing.id); setView("po-list"); } };

  const lines = (po.lineItems || []) as LineItem[];
  const subtotal = lines.reduce((s, li) => s + calculateLineItemAmount(li, form.taxRates).lineTotal, 0);
  const taxTotal = lines.reduce((s, li) => s + calculateLineItemAmount(li, form.taxRates).taxAmount, 0);
  const total = subtotal + taxTotal;

  const updateLine = (lineId: string, key: string, val: unknown) => {
    if (existing) updatePOLine(existing.id, lineId, { [key]: val });
    else setDraft((d) => ({ ...d, lineItems: (d.lineItems || []).map((li) => li.id === lineId ? { ...li, [key]: val } : li) }));
  };

  const addLine = () => {
    const line = emptyLine();
    if (existing) addPOLine(existing.id, line);
    else setDraft((d) => ({ ...d, lineItems: [...(d.lineItems || []), line] }));
  };

  const removeLine = (lineId: string) => {
    if (existing) removePOLine(existing.id, lineId);
    else setDraft((d) => ({ ...d, lineItems: (d.lineItems || []).filter((li) => li.id !== lineId) }));
  };

  const vendorOptions = [{ value: "", label: "Select vendor..." }, ...form.vendors.map((v) => ({ value: v.id, label: v.name }))];

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "accepted", label: "Accepted" },
    { value: "received", label: "Received" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={isNew ? "New Purchase Order" : `PO ${existing?.poNumber}`}
        subtitle={isNew ? "Order from a vendor" : undefined}
        actions={
          <div className="flex items-center gap-2">
            <BackButton onClick={() => setView("po-list")} />
            {isNew && <Btn variant="primary" size="sm" onClick={handleCreate} disabled={!draft.vendorId}>Create</Btn>}
            {existing && existing.status === "draft" && <Btn variant="primary" size="sm" onClick={() => updatePurchaseOrder(existing.id, { status: "sent" })}>Mark Sent</Btn>}
            {existing && <DeleteBtn onClick={handleDelete} />}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Vendor">
            <Select value={po.vendorId || ""} onChange={(v) => update("vendorId", v)} options={vendorOptions} />
          </Field>
          <Field label="PO #">
            <Input value={po.poNumber || ""} onChange={(v) => update("poNumber", v)} />
          </Field>
          <Field label="Date">
            <Input type="date" value={po.date || ""} onChange={(v) => update("date", v)} />
          </Field>
          <Field label="Expected Delivery">
            <Input type="date" value={po.expectedDelivery || ""} onChange={(v) => update("expectedDelivery", v)} />
          </Field>
        </div>

        {existing && (
          <Field label="Status">
            <Select value={po.status || "draft"} onChange={(v) => update("status", v)} options={statusOptions} />
          </Field>
        )}

        <Field label="Shipping Address">
          <Textarea value={(po as any).shippingAddress || ""} onChange={(v) => update("shippingAddress", v)} placeholder="Delivery address..." rows={2} />
        </Field>

        <SectionDivider label="Line Items" />

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
                        if (prod) { updateLine(li.id, "productId", pid); updateLine(li.id, "description", prod.name); updateLine(li.id, "unitPrice", prod.cost || prod.price); if (prod.taxRateId) updateLine(li.id, "taxRateId", prod.taxRateId); }
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
            <div className="flex justify-between border-t border-gray-700 pt-1.5 font-semibold"><span className="text-gray-300">Total</span><span className="text-primary-400 tabular-nums">{formatCurrency(total)}</span></div>
          </div>
        </div>

        <Field label="Notes"><Textarea value={po.notes || ""} onChange={(v) => update("notes", v)} placeholder="Internal notes..." rows={3} /></Field>
      </div>
    </div>
  );
}
