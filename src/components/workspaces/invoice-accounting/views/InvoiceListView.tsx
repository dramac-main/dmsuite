// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo, useState } from "react";
import {
  useInvoiceAccountingEditor,
  formatCurrency,
  calculateInvoiceTotals,
  type Invoice,
  type InvoiceStatus,
} from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, StatusBadge, SearchBar, TabStrip, DataTable, EmptyView, formatDate, type Column } from "../shared";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "partial", label: "Partial" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
];

export default function InvoiceListView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const createInvoice = useInvoiceAccountingEditor((s) => s.createInvoice);
  const setSelectedIds = useInvoiceAccountingEditor((s) => s.setSelectedIds);
  const bulkSetInvoiceStatus = useInvoiceAccountingEditor((s) => s.bulkSetInvoiceStatus);
  const bulkDeleteInvoices = useInvoiceAccountingEditor((s) => s.bulkDeleteInvoices);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getClientName = (clientId: string) => form.clients.find((c) => c.id === clientId)?.name || "—";

  const filtered = useMemo(() => {
    let list = [...form.invoices];
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.number.toLowerCase().includes(q) ||
          getClientName(i.clientId).toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [form.invoices, form.clients, statusFilter, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: form.invoices.length };
    for (const inv of form.invoices) counts[inv.status] = (counts[inv.status] || 0) + 1;
    return counts;
  }, [form.invoices]);

  const handleNew = () => {
    if (form.clients.length === 0) {
      setView("client-edit", null);
      return;
    }
    const id = createInvoice(form.clients[0].id);
    setView("invoice-edit", id);
  };

  const columns: Column<Invoice>[] = [
    {
      key: "number",
      label: "Invoice #",
      render: (inv) => <span className="font-semibold text-gray-200">{inv.number}</span>,
    },
    {
      key: "client",
      label: "Client",
      render: (inv) => <span className="text-gray-400">{getClientName(inv.clientId)}</span>,
    },
    {
      key: "date",
      label: "Date",
      render: (inv) => <span className="text-gray-500">{formatDate(inv.date)}</span>,
    },
    {
      key: "due",
      label: "Due",
      render: (inv) => <span className="text-gray-500">{formatDate(inv.dueDate)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (inv) => <StatusBadge status={inv.status} />,
    },
    {
      key: "total",
      label: "Amount",
      align: "right",
      render: (inv) => {
        const totals = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
        return <span className="font-semibold text-gray-200 tabular-nums">{formatCurrency(totals.total, inv.currency)}</span>;
      },
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Invoices"
        subtitle={`${form.invoices.length} total`}
        actions={
          <Btn variant="primary" size="sm" onClick={handleNew}>
            + New Invoice
          </Btn>
        }
      />

      <TabStrip
        tabs={STATUS_TABS.map((t) => ({ ...t, count: statusCounts[t.key] || 0 }))}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-xs">
            <SearchBar value={search} onChange={setSearch} placeholder="Search invoices..." />
          </div>
          {form.selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">{form.selectedIds.length} selected</span>
              <Btn variant="secondary" size="xs" onClick={() => bulkSetInvoiceStatus(form.selectedIds, "sent")}>
                Mark Sent
              </Btn>
              <Btn variant="danger" size="xs" onClick={() => { bulkDeleteInvoices(form.selectedIds); setSelectedIds([]); }}>
                Delete
              </Btn>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <DataTable
          data={filtered}
          columns={columns}
          onRowClick={(inv) => setView("invoice-edit", inv.id)}
          selectedIds={form.selectedIds}
          onSelectionChange={setSelectedIds}
          emptyTitle="No invoices yet"
          emptyDescription="Create your first invoice to start tracking revenue"
        />
      </div>
    </div>
  );
}
