// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo, useState } from "react";
import { useInvoiceAccountingEditor, formatCurrency, type Product } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, SearchBar, DataTable, type Column } from "../shared";

export default function ProductListView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...form.products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [form.products, search]);

  const columns: Column<Product>[] = [
    { key: "name", label: "Product / Service", render: (p) => (
      <div><span className="font-semibold text-gray-200">{p.name || "(Unnamed)"}</span>{p.isService && <span className="ml-1.5 text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">Service</span>}</div>
    )},
    { key: "sku", label: "SKU", render: (p) => <span className="text-gray-500 font-mono text-[10px]">{p.sku || "—"}</span> },
    { key: "category", label: "Category", render: (p) => <span className="text-gray-400">{p.category || "—"}</span> },
    { key: "price", label: "Price", align: "right", render: (p) => <span className="font-semibold text-gray-200 tabular-nums">{formatCurrency(p.unitPrice)}</span> },
    { key: "cost", label: "Cost", align: "right", render: (p) => <span className="text-gray-500 tabular-nums">{p.cost > 0 ? formatCurrency(p.cost) : "—"}</span> },
    { key: "stock", label: "Stock", align: "center", render: (p) => p.trackInventory ? <span className={`tabular-nums ${p.inStock <= 0 ? "text-red-400" : "text-gray-400"}`}>{p.inStock}</span> : <span className="text-gray-600">—</span> },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Products & Services" subtitle={`${form.products.length} items`} actions={<Btn variant="primary" size="sm" onClick={() => setView("product-edit", null)}>+ New Product</Btn>} />
      <div className="px-4 sm:px-6 py-3"><div className="max-w-xs"><SearchBar value={search} onChange={setSearch} placeholder="Search products..." /></div></div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <DataTable data={filtered} columns={columns} onRowClick={(p) => setView("product-edit", p.id)} emptyTitle="No products yet" emptyDescription="Add products and services for quick invoice line items" />
      </div>
    </div>
  );
}
