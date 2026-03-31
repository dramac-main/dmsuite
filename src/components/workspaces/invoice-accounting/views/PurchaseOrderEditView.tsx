"use client";

import { useState } from "react";
import { useInvoiceAccountingEditor, formatCurrency, calculateLineItemAmount, type LineItem } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, BackButton, DeleteBtn, Field, Input, Textarea, Select, SectionDivider, TaxRatePicker, ProductPicker, VendorPicker } from "../shared";

function emptyLine(): LineItem {
  return { id: crypto.randomUUID(), productId: "", description: "", quantity: 1, unitPrice: 0, discount: 0, taxRateId: "", taxRate: 0, taxName: "" };
}

export default function PurchaseOrderEditView({ id: _id }: { id?: string | null }) {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const createPurchaseOrder = useInvoiceAccountingEditor((s) => s.createPurchaseOrder);
  const updatePurchaseOrder = useInvoiceAccountingEditor((s) => s.updatePurchaseOrder);
  const removePurchaseOrder = useInvoiceAccountingEditor((s) => s.removePurchaseOrder);
  const addPOLineItem = useInvoiceAccountingEditor((s) => s.addPOLineItem);
  const updatePOLineItem = useInvoiceAccountingEditor((s) => s.updatePOLineItem);
  const removePOLineItem = useInvoiceAccountingEditor((s) => s.removePOLineItem);

  const existing = form.activeRecordId ? form.purchaseOrders.find((po) => po.id === form.activeRecordId) : null;
  const isNew = !existing;

  const [draftVendorId, setDraftVendorId] = useState("");
  const [draftDate, setDraftDate] = useState(new Date().toISOString().split("T")[0]);
  const [draftExpectedDate, setDraftExpectedDate] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftLines, setDraftLines] = useState<LineItem[]>([emptyLine()]);

  const vendorId = existing ? existing.vendorId : draftVendorId;
  const lines = existing ? existing.lineItems : draftLines;
  const taxMode = existing?.taxMode || "exclusive";

  // Compute totals
  const subtotal = lines.reduce((s, li) => s + calculateLineItemAmount(li, taxMode).subtotal, 0);
  const taxTotal = lines.reduce((s, li) => s + calculateLineItemAmount(li, taxMode).tax, 0);
  const total = subtotal + taxTotal;

  const handleCreate = () => {
    if (!draftVendorId) return;
    const poId = createPurchaseOrder(draftVendorId);
    // Apply draft values
    updatePurchaseOrder(poId, {
      date: draftDate,
      expectedDate: draftExpectedDate,
      notes: draftNotes,
    });
    // Add draft line items
    for (const li of draftLines) {
      if (li.description || li.productId) {
        addPOLineItem(poId, {
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
    setView("purchase-order-edit", poId);
  };

  const handleDelete = () => {
    if (existing) {
      removePurchaseOrder(existing.id);
      setView("purchase-orders");
    }
  };

  const updateLine = (lineId: string, key: string, val: unknown) => {
    if (existing) {
      updatePOLineItem(existing.id, lineId, { [key]: val });
    } else {
      setDraftLines((prev) => prev.map((li) => li.id === lineId ? { ...li, [key]: val } : li));
    }
  };

  const addLine = () => {
    const line = emptyLine();
    if (existing) {
      addPOLineItem(existing.id, line);
    } else {
      setDraftLines((prev) => [...prev, line]);
    }
  };

  const removeLine = (lineId: string) => {
    if (existing) {
      removePOLineItem(existing.id, lineId);
    } else {
      setDraftLines((prev) => prev.filter((li) => li.id !== lineId));
    }
  };

  const applyProduct = (lineId: string, productId: string) => {
    const prod = form.products.find((p) => p.id === productId);
    if (prod) {
      updateLine(lineId, "productId", productId);
      updateLine(lineId, "description", prod.name);
      updateLine(lineId, "unitPrice", prod.cost || prod.unitPrice);
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
        title={isNew ? "New Purchase Order" : `PO ${existing?.number}`}
        subtitle={isNew ? "Order from a vendor" : undefined}
        actions={
          <div className="flex items-center gap-2">
            <BackButton onClick={() => setView("purchase-orders")} />
            {isNew && <Btn variant="primary" size="sm" onClick={handleCreate} disabled={!draftVendorId}>Create</Btn>}
            {existing && existing.status === "draft" && (
              <Btn variant="primary" size="sm" onClick={() => updatePurchaseOrder(existing.id, { status: "sent" })}>Mark Sent</Btn>
            )}
            {existing && <DeleteBtn onClick={handleDelete} />}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Vendor">
            <VendorPicker
              value={vendorId}
              onChange={(v) => {
                if (existing) updatePurchaseOrder(existing.id, { vendorId: v });
                else setDraftVendorId(v);
              }}
            />
          </Field>
          <Field label="PO #">
            <Input value={existing?.number || `PO-${String(form.purchaseOrders.length + 1).padStart(4, "0")}`} onChange={(v) => { if (existing) updatePurchaseOrder(existing.id, { number: v }); }} disabled={isNew} />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={existing ? existing.date : draftDate}
              onChange={(v) => {
                if (existing) updatePurchaseOrder(existing.id, { date: v });
                else setDraftDate(v);
              }}
            />
          </Field>
          <Field label="Expected Delivery">
            <Input
              type="date"
              value={existing ? existing.expectedDate : draftExpectedDate}
              onChange={(v) => {
                if (existing) updatePurchaseOrder(existing.id, { expectedDate: v });
                else setDraftExpectedDate(v);
              }}
            />
          </Field>
        </div>

        {existing && (
          <Field label="Status">
            <Select value={existing.status || "draft"} onChange={(v) => updatePurchaseOrder(existing.id, { status: v as "draft" | "sent" | "accepted" | "received" | "cancelled" })} options={statusOptions} />
          </Field>
        )}

        <SectionDivider title="Line Items" />

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
              <span className="text-gray-300">Total</span>
              <span className="text-primary-400 tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <Field label="Notes">
          <Textarea
            value={existing ? existing.notes : draftNotes}
            onChange={(v) => {
              if (existing) updatePurchaseOrder(existing.id, { notes: v });
              else setDraftNotes(v);
            }}
            placeholder="Internal notes..."
            rows={3}
          />
        </Field>
      </div>
    </div>
  );
}
