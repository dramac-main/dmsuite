
"use client";

import { useMemo } from "react";
import { useInvoiceAccountingEditor, type Project, type ProjectStatus } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, BackButton, Field, Input, Textarea, Select, SectionDivider, ClientPicker } from "../shared";

const PROJECT_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

export default function ProjectEditView({ id }: { id: string | null }) {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const addProject = useInvoiceAccountingEditor((s) => s.addProject);
  const updateProject = useInvoiceAccountingEditor((s) => s.updateProject);
  const removeProject = useInvoiceAccountingEditor((s) => s.removeProject);

  const project = useMemo(() => {
    if (!id) return null;
    return form.projects.find((p) => p.id === id) || null;
  }, [form.projects, id]);

  if (!id) {
    const newId = addProject({ name: "", clientId: form.clients[0]?.id || "", budgetHours: 0, budgetAmount: 0, hourlyRate: 0, status: "active", notes: "", color: "#8b5cf6" });
    setView("project-edit", newId);
    return null;
  }

  if (!project) return <div className="flex flex-col h-full"><PageHeader title="Project not found" actions={<Btn variant="ghost" size="sm" onClick={() => setView("projects")}>← Back</Btn>} /></div>;

  const update = (data: Partial<Project>) => updateProject(project.id, data);
  const hoursLogged = form.timeEntries.filter((t) => t.projectId === project.id).reduce((s, t) => s + t.duration, 0) / 60;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={project.name || "New Project"} actions={
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="sm" onClick={() => setView("time-tracking")}>Time Entries</Btn>
          <Btn variant="danger" size="xs" onClick={() => { removeProject(project.id); setView("projects"); }}>Delete</Btn>
        </div>
      } />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
          <BackButton onClick={() => setView("projects")} label="All Projects" />

          <SectionDivider title="Project Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Project Name" required><Input value={project.name} onChange={(v) => update({ name: v })} placeholder="Project name" /></Field>
            <Field label="Client"><ClientPicker value={project.clientId} onChange={(v) => update({ clientId: v })} /></Field>
            <Field label="Status">
              <Select value={project.status} onChange={(v) => update({ status: v as ProjectStatus })} options={[{ value: "active", label: "Active" }, { value: "completed", label: "Completed" }, { value: "on-hold", label: "On Hold" }]} />
            </Field>
            <Field label="Hourly Rate (ZMW)"><Input type="number" value={project.hourlyRate} onChange={(v) => update({ hourlyRate: parseFloat(v) || 0 })} /></Field>
            <Field label="Budget Hours"><Input type="number" value={project.budgetHours} onChange={(v) => update({ budgetHours: parseFloat(v) || 0 })} /></Field>
            <Field label="Budget Amount"><Input type="number" value={project.budgetAmount} onChange={(v) => update({ budgetAmount: parseFloat(v) || 0 })} /></Field>
          </div>

          <Field label="Color">
            <div className="flex items-center gap-2">
              {PROJECT_COLORS.map((c) => (
                <button key={c} onClick={() => update({ color: c })} className={`w-6 h-6 rounded-full border-2 transition-all ${project.color === c ? "border-white scale-110" : "border-transparent hover:border-white/30"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </Field>

          <Field label="Notes"><Textarea value={project.notes} onChange={(v) => update({ notes: v })} /></Field>

          {/* Summary */}
          <div className="rounded-xl border border-gray-800/40 p-4 space-y-2">
            <div className="flex justify-between text-[11px]"><span className="text-gray-500">Hours Logged</span><span className="text-gray-300 tabular-nums">{hoursLogged.toFixed(1)}h</span></div>
            {project.budgetHours > 0 && <div className="flex justify-between text-[11px]"><span className="text-gray-500">Budget Remaining</span><span className={`tabular-nums ${hoursLogged > project.budgetHours ? "text-red-400" : "text-gray-300"}`}>{(project.budgetHours - hoursLogged).toFixed(1)}h</span></div>}
            <div className="flex justify-between text-[11px]"><span className="text-gray-500">Time Entries</span><span className="text-gray-300">{form.timeEntries.filter((t) => t.projectId === project.id).length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
