// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo, useState } from "react";
import { useInvoiceAccountingEditor, formatCurrency, type PurchaseOrder } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, SearchBar, DataTable, TabStrip, StatusBadge, formatDate, type Column } from "../shared";

const TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "accepted", label: "Accepted" },
  { key: "received", label: "Received" },
  { key: "cancelled", label: "Cancelled" },
];

export default function PurchaseOrderListView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const getVendor = (id: string) => form.vendors.find((v) => v.id === id)?.name || "—";

  const filtered = useMemo(() => {
    let list = [...form.purchaseOrders];
    if (tab !== "all") list = list.filter((po) => po.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((po) => po.poNumber.toLowerCase().includes(q) || getVendor(po.vendorId).toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [form.purchaseOrders, form.vendors, tab, search]);

  const totalAmount = filtered.reduce((s, po) => {
    const t = po.lineItems.reduce((a, li) => a + li.quantity * li.unitPrice, 0);
    return s + t;
  }, 0);

  const columns: Column<PurchaseOrder>[] = [
    { key: "number", label: "PO #", render: (po) => <span className="font-medium text-gray-200">{po.poNumber}</span> },
    { key: "vendor", label: "Vendor", render: (po) => <span className="text-gray-400">{getVendor(po.vendorId)}</span> },
    { key: "date", label: "Date", render: (po) => <span className="text-gray-400">{formatDate(po.date)}</span> },
    { key: "delivery", label: "Delivery", render: (po) => <span className="text-gray-500">{po.expectedDelivery ? formatDate(po.expectedDelivery) : "—"}</span> },
    { key: "amount", label: "Amount", align: "right", render: (po) => {
      const t = po.lineItems.reduce((a, li) => a + li.quantity * li.unitPrice, 0);
      return <span className="font-medium text-gray-300 tabular-nums">{formatCurrency(t)}</span>;
    }},
    { key: "status", label: "Status", render: (po) => <StatusBadge status={po.status} /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Purchase Orders"
        subtitle={`${form.purchaseOrders.length} orders`}
        actions={<Btn variant="primary" size="sm" onClick={() => setView("po-edit", null)}>+ New PO</Btn>}
      />
      <TabStrip tabs={TABS} activeKey={tab} onChange={setTab} />
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="max-w-xs flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Search purchase orders..." /></div>
        {totalAmount > 0 && <span className="text-[11px] text-gray-500 ml-4">Total: {formatCurrency(totalAmount)}</span>}
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <DataTable data={filtered} columns={columns} onRowClick={(po) => setView("po-edit", po.id)} emptyTitle="No purchase orders" emptyDescription="Create a purchase order for vendor supplies" />
      </div>
    </div>
  );
}
