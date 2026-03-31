// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo, useState } from "react";
import { useInvoiceAccountingEditor, type Vendor } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, SearchBar, DataTable, type Column } from "../shared";

export default function VendorListView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...form.vendors];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) => v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [form.vendors, search]);

  const columns: Column<Vendor>[] = [
    { key: "name", label: "Vendor Name", render: (v) => <span className="font-semibold text-gray-200">{v.name || "(Unnamed)"}</span> },
    { key: "contact", label: "Contact", render: (v) => <span className="text-gray-400">{v.contactPerson}</span> },
    { key: "email", label: "Email", render: (v) => <span className="text-gray-500">{v.email}</span> },
    { key: "phone", label: "Phone", render: (v) => <span className="text-gray-500">{v.phone}</span> },
    { key: "expenses", label: "Expenses", align: "center", render: (v) => <span className="text-gray-500">{form.expenses.filter((e) => e.vendorId === v.id).length}</span> },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Vendors" subtitle={`${form.vendors.length} total`} actions={<Btn variant="primary" size="sm" onClick={() => setView("vendor-edit", null)}>+ New Vendor</Btn>} />
      <div className="px-4 sm:px-6 py-3"><div className="max-w-xs"><SearchBar value={search} onChange={setSearch} placeholder="Search vendors..." /></div></div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <DataTable data={filtered} columns={columns} onRowClick={(v) => setView("vendor-edit", v.id)} emptyTitle="No vendors yet" emptyDescription="Add vendors to track expenses" />
      </div>
    </div>
  );
}
