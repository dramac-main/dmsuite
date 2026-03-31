// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo, useState, useEffect } from "react";
import { useInvoiceAccountingEditor, formatCurrency, type TimeEntry } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, SearchBar, DataTable, DeleteBtn, Field, Input, Select, formatDate, type Column } from "../shared";

export default function TimeTrackingView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const addTimeEntry = useInvoiceAccountingEditor((s) => s.addTimeEntry);
  const updateTimeEntry = useInvoiceAccountingEditor((s) => s.updateTimeEntry);
  const removeTimeEntry = useInvoiceAccountingEditor((s) => s.removeTimeEntry);
  const startTimer = useInvoiceAccountingEditor((s) => s.startTimer);
  const stopTimer = useInvoiceAccountingEditor((s) => s.stopTimer);
  const convertTimeToInvoice = useInvoiceAccountingEditor((s) => s.convertTimeToInvoice);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [elapsed, setElapsed] = useState(0);

  const isTimerRunning = !!form.activeTimerStart;
  const timerProject = form.projects.find((p) => p.id === form.activeTimerProjectId);

  useEffect(() => {
    if (!form.activeTimerStart) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(form.activeTimerStart!).getTime()) / 1000));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [form.activeTimerStart]);

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getProjectName = (id: string) => form.projects.find((p) => p.id === id)?.name || "—";

  const filtered = useMemo(() => {
    let list = [...form.timeEntries];
    if (projectFilter !== "all") list = list.filter((t) => t.projectId === projectFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.description.toLowerCase().includes(q) || getProjectName(t.projectId).toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [form.timeEntries, form.projects, projectFilter, search]);

  const billableEntries = filtered.filter((t) => t.isBillable && !t.invoiced);

  const handleStartTimer = (projectId: string) => {
    if (isTimerRunning) stopTimer();
    startTimer(projectId);
  };

  const handleConvertToInvoice = () => {
    if (!projectFilter || projectFilter === "all") return;
    const ids = billableEntries.map((t) => t.id);
    if (ids.length === 0) return;
    const invId = convertTimeToInvoice(projectFilter, ids);
    if (invId) setView("invoice-edit", invId);
  };

  const columns: Column<TimeEntry>[] = [
    { key: "date", label: "Date", render: (t) => <span className="text-gray-300">{formatDate(t.date)}</span> },
    { key: "project", label: "Project", render: (t) => <span className="text-gray-400">{getProjectName(t.projectId)}</span> },
    { key: "desc", label: "Description", render: (t) => <span className="text-gray-200">{t.description || "—"}</span> },
    { key: "duration", label: "Duration", align: "right", render: (t) => <span className="font-medium text-gray-300 tabular-nums">{(t.duration / 60).toFixed(1)}h</span> },
    { key: "amount", label: "Amount", align: "right", render: (t) => <span className="text-gray-400 tabular-nums">{formatCurrency((t.duration / 60) * t.hourlyRate)}</span> },
    { key: "status", label: "", render: (t) => (
      <div className="flex items-center gap-1">
        {t.invoiced && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Invoiced</span>}
        {t.isBillable && !t.invoiced && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Billable</span>}
        <DeleteBtn onClick={() => removeTimeEntry(t.id)} />
      </div>
    )},
  ];

  const projectTabs = [{ key: "all", label: "All" }, ...form.projects.map((p) => ({ key: p.id, label: p.name }))];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Time Tracking"
        subtitle={`${form.timeEntries.length} entries`}
        actions={
          <div className="flex items-center gap-2">
            {billableEntries.length > 0 && projectFilter !== "all" && (
              <Btn variant="primary" size="sm" onClick={handleConvertToInvoice}>
                Invoice {billableEntries.length} entries
              </Btn>
            )}
          </div>
        }
      />

      {/* Timer bar */}
      <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-gray-800/40 bg-gray-900/30">
        {isTimerRunning ? (
          <>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-gray-400">{timerProject?.name}</span>
            <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">{formatElapsed(elapsed)}</span>
            <Btn variant="danger" size="xs" onClick={() => stopTimer()}>Stop</Btn>
          </>
        ) : (
          <>
            <span className="text-[11px] text-gray-500">Start timer:</span>
            {form.projects.length === 0 ? (
              <Btn variant="ghost" size="xs" onClick={() => setView("project-edit", null)}>Create a project first</Btn>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {form.projects.filter((p) => p.status === "active").map((p) => (
                  <Btn key={p.id} variant="secondary" size="xs" onClick={() => handleStartTimer(p.id)}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || "#8b5cf6" }} />
                    {p.name}
                  </Btn>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-0.5 px-4 sm:px-6 border-b border-gray-800/40 overflow-x-auto scrollbar-none">
        {projectTabs.map((tab) => (
          <button key={tab.key} onClick={() => setProjectFilter(tab.key)} className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-all whitespace-nowrap ${projectFilter === tab.key ? "border-primary-500 text-primary-300" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 sm:px-6 py-3"><div className="max-w-xs"><SearchBar value={search} onChange={setSearch} placeholder="Search time entries..." /></div></div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <DataTable data={filtered} columns={columns} emptyTitle="No time entries" emptyDescription="Start a timer or add manual entries" />
      </div>
    </div>
  );
}
