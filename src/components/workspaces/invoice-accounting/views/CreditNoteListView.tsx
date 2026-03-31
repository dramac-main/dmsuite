
"use client";

import { useMemo, useState } from "react";
import { useInvoiceAccountingEditor, formatCurrency, type CreditNote } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, SearchBar, DataTable, TabStrip, StatusBadge, formatDate, type Column } from "../shared";

const TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "applied", label: "Applied" },
  { key: "void", label: "Void" },
];

export default function CreditNoteListView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const getClient = (id: string) => form.clients.find((c) => c.id === id)?.name || "—";

  const filtered = useMemo(() => {
    let list = [...form.creditNotes];
    if (tab !== "all") list = list.filter((cn) => cn.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((cn) => cn.number.toLowerCase().includes(q) || getClient(cn.clientId).toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [form.creditNotes, form.clients, tab, search]);

  const totalAmount = filtered.reduce((s, cn) => {
    const t = cn.lineItems.reduce((a, li) => a + li.quantity * li.unitPrice, 0);
    return s + t;
  }, 0);

  const columns: Column<CreditNote>[] = [
    { key: "number", label: "Credit Note #", render: (cn) => <span className="font-medium text-gray-200">{cn.number}</span> },
    { key: "client", label: "Client", render: (cn) => <span className="text-gray-400">{getClient(cn.clientId)}</span> },
    { key: "date", label: "Date", render: (cn) => <span className="text-gray-400">{formatDate(cn.date)}</span> },
    { key: "amount", label: "Amount", align: "right", render: (cn) => {
      const t = cn.lineItems.reduce((a, li) => a + li.quantity * li.unitPrice, 0);
      return <span className="font-medium text-gray-300 tabular-nums">{formatCurrency(t)}</span>;
    }},
    { key: "status", label: "Status", render: (cn) => <StatusBadge status={cn.status} /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Credit Notes"
        subtitle={`${form.creditNotes.length} credit notes`}
        actions={<Btn variant="primary" size="sm" onClick={() => setView("credit-note-edit", null)}>+ New Credit Note</Btn>}
      />
      <TabStrip tabs={TABS} active={tab} onChange={setTab} />
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="max-w-xs flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Search credit notes..." /></div>
        {totalAmount > 0 && <span className="text-[11px] text-gray-500 ml-4">Total: {formatCurrency(totalAmount)}</span>}
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <DataTable data={filtered} columns={columns} onRowClick={(cn) => setView("credit-note-edit", cn.id)} emptyTitle="No credit notes" emptyDescription="Create a credit note to refund or adjust an invoice" />
      </div>
    </div>
  );
}
