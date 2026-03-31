
"use client";

import { useMemo, useState } from "react";
import { useInvoiceAccountingEditor, formatCurrency, type Payment, PAYMENT_METHODS } from "@/stores/invoice-accounting-editor";
import { PageHeader, SearchBar, TabStrip, DataTable, formatDate, type Column } from "../shared";

export default function PaymentListView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const getClientName = (id: string) => form.clients.find((c) => c.id === id)?.name || "—";
  const getInvoiceNumber = (id: string) => form.invoices.find((i) => i.id === id)?.number || "—";

  const filtered = useMemo(() => {
    let list = [...form.payments];
    if (methodFilter !== "all") list = list.filter((p) => p.method === methodFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => getClientName(p.clientId).toLowerCase().includes(q) || getInvoiceNumber(p.invoiceId).toLowerCase().includes(q) || p.reference.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [form.payments, form.clients, form.invoices, methodFilter, search]);

  const totalReceived = useMemo(() => form.payments.reduce((s, p) => s + p.amount, 0), [form.payments]);

  const columns: Column<Payment>[] = [
    { key: "date", label: "Date", render: (p) => <span className="text-gray-300">{formatDate(p.date)}</span> },
    { key: "client", label: "Client", render: (p) => <span className="text-gray-400">{getClientName(p.clientId)}</span> },
    { key: "invoice", label: "Invoice", render: (p) => (
      <button onClick={(e) => { e.stopPropagation(); setView("invoice-edit", p.invoiceId); }} className="text-primary-400 hover:text-primary-300 font-medium">
        {getInvoiceNumber(p.invoiceId)}
      </button>
    )},
    { key: "method", label: "Method", render: (p) => <span className="text-gray-500 capitalize">{p.method.replace("-", " ")}</span> },
    { key: "reference", label: "Reference", render: (p) => <span className="text-gray-500 font-mono text-[10px]">{p.reference || "—"}</span> },
    { key: "amount", label: "Amount", align: "right", render: (p) => <span className="font-semibold text-emerald-400 tabular-nums">{formatCurrency(p.amount, p.currency)}</span> },
  ];

  const methodTabs = [{ key: "all", label: "All" }, ...PAYMENT_METHODS.map((m) => ({ key: m.value, label: m.label }))];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Payments" subtitle={`${form.payments.length} total · ${formatCurrency(totalReceived, form.business.currency)} received`} />
      <TabStrip tabs={methodTabs.map((t) => ({ ...t, count: t.key === "all" ? form.payments.length : form.payments.filter((p) => p.method === t.key).length }))} active={methodFilter} onChange={setMethodFilter} />
      <div className="px-4 sm:px-6 py-3"><div className="max-w-xs"><SearchBar value={search} onChange={setSearch} placeholder="Search payments..." /></div></div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <DataTable data={filtered} columns={columns} emptyTitle="No payments recorded" emptyDescription="Payments are recorded from the invoice edit page" />
      </div>
    </div>
  );
}
