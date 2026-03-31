// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo, useState } from "react";
import { useInvoiceAccountingEditor, formatCurrency, type Expense, EXPENSE_CATEGORIES } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, SearchBar, TabStrip, DataTable, formatDate, type Column } from "../shared";

export default function ExpenseListView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const getVendorName = (id: string) => form.vendors.find((v) => v.id === id)?.name || "—";
  const getCategoryLabel = (cat: string) => EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  const filtered = useMemo(() => {
    let list = [...form.expenses];
    if (catFilter !== "all") list = list.filter((e) => e.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.description.toLowerCase().includes(q) || getVendorName(e.vendorId).toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [form.expenses, form.vendors, catFilter, search]);

  const totalExpenses = useMemo(() => form.expenses.reduce((s, e) => s + e.amount, 0), [form.expenses]);

  const columns: Column<Expense>[] = [
    { key: "date", label: "Date", render: (e) => <span className="text-gray-300">{formatDate(e.date)}</span> },
    { key: "desc", label: "Description", render: (e) => <span className="font-medium text-gray-200">{e.description || "—"}</span> },
    { key: "vendor", label: "Vendor", render: (e) => <span className="text-gray-400">{getVendorName(e.vendorId)}</span> },
    { key: "category", label: "Category", render: (e) => <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800/40 text-gray-400">{getCategoryLabel(e.category)}</span> },
    { key: "amount", label: "Amount", align: "right", render: (e) => <span className="font-semibold text-gray-200 tabular-nums">{formatCurrency(e.amount, e.currency)}</span> },
  ];

  const catTabs = [{ key: "all", label: "All" }, ...EXPENSE_CATEGORIES.slice(0, 5).map((c) => ({ key: c.value, label: c.label }))];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Expenses" subtitle={`${form.expenses.length} total · ${formatCurrency(totalExpenses, form.business.currency)} spent`} actions={<Btn variant="primary" size="sm" onClick={() => setView("expense-edit", null)}>+ New Expense</Btn>} />
      <TabStrip tabs={catTabs.map((t) => ({ ...t, count: t.key === "all" ? form.expenses.length : form.expenses.filter((e) => e.category === t.key).length }))} active={catFilter} onChange={setCatFilter} />
      <div className="px-4 sm:px-6 py-3"><div className="max-w-xs"><SearchBar value={search} onChange={setSearch} placeholder="Search expenses..." /></div></div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <DataTable data={filtered} columns={columns} onRowClick={(e) => setView("expense-edit", e.id)} emptyTitle="No expenses recorded" emptyDescription="Track your business expenses here" />
      </div>
    </div>
  );
}
