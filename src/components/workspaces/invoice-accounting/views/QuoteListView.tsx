// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo, useState } from "react";
import { useInvoiceAccountingEditor, formatCurrency, calculateInvoiceTotals, type Quote } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, StatusBadge, SearchBar, TabStrip, DataTable, formatDate, type Column } from "../shared";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "approved", label: "Approved" },
  { key: "converted", label: "Converted" },
];

export default function QuoteListView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const createQuote = useInvoiceAccountingEditor((s) => s.createQuote);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getClientName = (id: string) => form.clients.find((c) => c.id === id)?.name || "—";

  const filtered = useMemo(() => {
    let list = [...form.quotes];
    if (statusFilter !== "all") list = list.filter((q) => q.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((item) => item.number.toLowerCase().includes(q) || getClientName(item.clientId).toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [form.quotes, form.clients, statusFilter, search]);

  const handleNew = () => {
    if (form.clients.length === 0) { setView("client-edit", null); return; }
    const id = createQuote(form.clients[0].id);
    setView("quote-edit", id);
  };

  const columns: Column<Quote>[] = [
    { key: "number", label: "Quote #", render: (q) => <span className="font-semibold text-gray-200">{q.number}</span> },
    { key: "client", label: "Client", render: (q) => <span className="text-gray-400">{getClientName(q.clientId)}</span> },
    { key: "date", label: "Date", render: (q) => <span className="text-gray-500">{formatDate(q.date)}</span> },
    { key: "valid", label: "Valid Until", render: (q) => <span className="text-gray-500">{formatDate(q.validUntil)}</span> },
    { key: "status", label: "Status", render: (q) => <StatusBadge status={q.status} /> },
    {
      key: "total", label: "Amount", align: "right",
      render: (q) => {
        const t = calculateInvoiceTotals(q.lineItems, q.taxMode, q.discount);
        return <span className="font-semibold text-gray-200 tabular-nums">{formatCurrency(t.total, q.currency)}</span>;
      },
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Quotes" subtitle={`${form.quotes.length} total`} actions={<Btn variant="primary" size="sm" onClick={handleNew}>+ New Quote</Btn>} />
      <TabStrip tabs={STATUS_TABS.map((t) => ({ ...t, count: form.quotes.filter((q) => t.key === "all" || q.status === t.key).length }))} active={statusFilter} onChange={setStatusFilter} />
      <div className="px-4 sm:px-6 py-3"><div className="max-w-xs"><SearchBar value={search} onChange={setSearch} placeholder="Search quotes..." /></div></div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <DataTable data={filtered} columns={columns} onRowClick={(q) => setView("quote-edit", q.id)} emptyTitle="No quotes yet" emptyDescription="Create quotes and convert them to invoices" />
      </div>
    </div>
  );
}
