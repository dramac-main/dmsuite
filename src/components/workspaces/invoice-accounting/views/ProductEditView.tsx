// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo } from "react";
import { useInvoiceAccountingEditor, type Product } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, BackButton, Field, Input, Textarea, Select, SectionDivider, TaxRatePicker } from "../shared";

export default function ProductEditView({ id }: { id: string | null }) {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const addProduct = useInvoiceAccountingEditor((s) => s.addProduct);
  const updateProduct = useInvoiceAccountingEditor((s) => s.updateProduct);
  const removeProduct = useInvoiceAccountingEditor((s) => s.removeProduct);

  const product = useMemo(() => {
    if (!id) return null;
    return form.products.find((p) => p.id === id) || null;
  }, [form.products, id]);

  if (!id) {
    const newId = addProduct({
      name: "", description: "", unitPrice: 0, cost: 0,
      taxRateId: form.taxes.find((t) => t.isDefault)?.id || "vat-standard",
      unit: "each", sku: "", inStock: 0, trackInventory: false, category: "", isService: false,
    });
    setView("product-edit", newId);
    return null;
  }

  if (!product) {
    return <div className="flex flex-col h-full"><PageHeader title="Product not found" actions={<Btn variant="ghost" size="sm" onClick={() => setView("products")}>← Back</Btn>} /></div>;
  }

  const update = (data: Partial<Product>) => updateProduct(product.id, data);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={product.name || "New Product"} actions={<Btn variant="danger" size="xs" onClick={() => { removeProduct(product.id); setView("products"); }}>Delete</Btn>} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
          <BackButton onClick={() => setView("products")} label="All Products" />

          <SectionDivider title="Basic Info" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" required><Input value={product.name} onChange={(v) => update({ name: v })} placeholder="Product or service name" /></Field>
            <Field label="SKU"><Input value={product.sku} onChange={(v) => update({ sku: v })} placeholder="Stock code" /></Field>
            <Field label="Category"><Input value={product.category} onChange={(v) => update({ category: v })} placeholder="e.g. Consulting, Hardware" /></Field>
            <Field label="Type">
              <Select value={product.isService ? "service" : "product"} onChange={(v) => update({ isService: v === "service" })} options={[{ value: "product", label: "Product" }, { value: "service", label: "Service" }]} />
            </Field>
          </div>
          <Field label="Description"><Textarea value={product.description} onChange={(v) => update({ description: v })} placeholder="Product description" rows={2} /></Field>

          <SectionDivider title="Pricing" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Sell Price (ZMW)" required><Input type="number" value={product.unitPrice} onChange={(v) => update({ unitPrice: parseFloat(v) || 0 })} /></Field>
            <Field label="Cost Price"><Input type="number" value={product.cost} onChange={(v) => update({ cost: parseFloat(v) || 0 })} /></Field>
            <Field label="Unit"><Input value={product.unit} onChange={(v) => update({ unit: v })} placeholder="each, hour, kg" /></Field>
          </div>
          <Field label="Tax Rate"><TaxRatePicker value={product.taxRateId} onChange={(v) => update({ taxRateId: v })} /></Field>

          {!product.isService && (
            <>
              <SectionDivider title="Inventory" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Track Inventory">
                  <Select value={product.trackInventory ? "yes" : "no"} onChange={(v) => update({ trackInventory: v === "yes" })} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
                </Field>
                {product.trackInventory && (
                  <Field label="Current Stock"><Input type="number" value={product.inStock} onChange={(v) => update({ inStock: parseInt(v) || 0 })} /></Field>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
