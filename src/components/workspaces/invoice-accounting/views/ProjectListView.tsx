// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo, useState } from "react";
import { useInvoiceAccountingEditor, formatCurrency, type Project } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, SearchBar, DataTable, StatusBadge, type Column } from "../shared";

export default function ProjectListView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const [search, setSearch] = useState("");

  const getClientName = (id: string) => form.clients.find((c) => c.id === id)?.name || "—";
  const getHoursLogged = (projId: string) => form.timeEntries.filter((t) => t.projectId === projId).reduce((s, t) => s + t.duration, 0) / 60;

  const filtered = useMemo(() => {
    let list = [...form.projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || getClientName(p.clientId).toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [form.projects, form.clients, search]);

  const columns: Column<Project>[] = [
    { key: "name", label: "Project", render: (p) => (
      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || "#8b5cf6" }} /><span className="font-semibold text-gray-200">{p.name}</span></div>
    )},
    { key: "client", label: "Client", render: (p) => <span className="text-gray-400">{getClientName(p.clientId)}</span> },
    { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "hours", label: "Hours", align: "right", render: (p) => <span className="text-gray-400 tabular-nums">{getHoursLogged(p.id).toFixed(1)}h / {p.budgetHours}h</span> },
    { key: "rate", label: "Rate", align: "right", render: (p) => <span className="text-gray-500 tabular-nums">{formatCurrency(p.hourlyRate)}/hr</span> },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Projects" subtitle={`${form.projects.length} total`} actions={<Btn variant="primary" size="sm" onClick={() => setView("project-edit", null)}>+ New Project</Btn>} />
      <div className="px-4 sm:px-6 py-3"><div className="max-w-xs"><SearchBar value={search} onChange={setSearch} placeholder="Search projects..." /></div></div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <DataTable data={filtered} columns={columns} onRowClick={(p) => setView("project-edit", p.id)} emptyTitle="No projects yet" emptyDescription="Create projects to organize time tracking" />
      </div>
    </div>
  );
}
