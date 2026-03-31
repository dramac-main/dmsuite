// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo, useState } from "react";
import { useInvoiceAccountingEditor, type Client, getClientBalance, formatCurrency } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, SearchBar, DataTable, formatDate, type Column } from "../shared";

export default function ClientListView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...form.clients];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [form.clients, search]);

  const columns: Column<Client>[] = [
    { key: "name", label: "Name", render: (c) => <span className="font-semibold text-gray-200">{c.name || "(Unnamed)"}</span> },
    { key: "contact", label: "Contact", render: (c) => <span className="text-gray-400">{c.contactPerson}</span> },
    { key: "email", label: "Email", render: (c) => <span className="text-gray-500">{c.email}</span> },
    { key: "phone", label: "Phone", render: (c) => <span className="text-gray-500">{c.phone}</span> },
    {
      key: "balance", label: "Balance", align: "right",
      render: (c) => {
        const bal = getClientBalance(c.id, form.invoices, form.payments);
        return <span className={`font-semibold tabular-nums ${bal > 0 ? "text-amber-400" : "text-gray-500"}`}>{formatCurrency(bal, c.currency)}</span>;
      },
    },
    {
      key: "invoices", label: "Invoices", align: "center",
      render: (c) => <span className="text-gray-500">{form.invoices.filter((i) => i.clientId === c.id).length}</span>,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Clients" subtitle={`${form.clients.length} total`} actions={<Btn variant="primary" size="sm" onClick={() => setView("client-edit", null)}>+ New Client</Btn>} />
      <div className="px-4 sm:px-6 py-3"><div className="max-w-xs"><SearchBar value={search} onChange={setSearch} placeholder="Search clients..." /></div></div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <DataTable data={filtered} columns={columns} onRowClick={(c) => setView("client-edit", c.id)} emptyTitle="No clients yet" emptyDescription="Add your first client to start invoicing" />
      </div>
    </div>
  );
}
