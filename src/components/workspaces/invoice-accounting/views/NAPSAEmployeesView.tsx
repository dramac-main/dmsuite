"use client";

import { useState, useCallback } from "react";
import {
  useInvoiceAccountingEditor,
  formatCurrency,
  calculateNAPSA,
  NAPSA_RATE,
  NAPSA_MONTHLY_CEILING,
  type NAPSAEmployee,
} from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, Field, Input, EmptyView, StatCard, SearchBar } from "../shared";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function NAPSAEmployeesView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const addNAPSAEmployee = useInvoiceAccountingEditor((s) => s.addNAPSAEmployee);
  const updateNAPSAEmployee = useInvoiceAccountingEditor((s) => s.updateNAPSAEmployee);
  const removeNAPSAEmployee = useInvoiceAccountingEditor((s) => s.removeNAPSAEmployee);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<NAPSAEmployee, "id">>({
    name: "",
    nrcNumber: "",
    napsaMemberNo: "",
    grossSalary: 0,
    department: "",
    position: "",
    startDate: new Date().toISOString().split("T")[0],
    isActive: true,
  });

  const employees = form.napsaEmployees ?? [];
  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.nrcNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = employees.filter((e) => e.isActive).length;
  const totalMonthlyContrib = employees
    .filter((e) => e.isActive)
    .reduce((sum, e) => sum + calculateNAPSA(e.grossSalary).total, 0);
  const totalGross = employees.filter((e) => e.isActive).reduce((sum, e) => sum + e.grossSalary, 0);

  const resetDraft = useCallback(() => {
    setDraft({
      name: "",
      nrcNumber: "",
      napsaMemberNo: "",
      grossSalary: 0,
      department: "",
      position: "",
      startDate: new Date().toISOString().split("T")[0],
      isActive: true,
    });
    setEditId(null);
    setShowForm(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!draft.name.trim()) return;
    if (editId) {
      updateNAPSAEmployee(editId, draft);
    } else {
      addNAPSAEmployee(draft);
    }
    resetDraft();
  }, [draft, editId, addNAPSAEmployee, updateNAPSAEmployee, resetDraft]);

  const handleEdit = useCallback((emp: NAPSAEmployee) => {
    setDraft({
      name: emp.name,
      nrcNumber: emp.nrcNumber,
      napsaMemberNo: emp.napsaMemberNo,
      grossSalary: emp.grossSalary,
      department: emp.department,
      position: emp.position,
      startDate: emp.startDate,
      isActive: emp.isActive,
    });
    setEditId(emp.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm("Remove this employee from NAPSA records?")) {
      removeNAPSAEmployee(id);
    }
  }, [removeNAPSAEmployee]);

  const D = (key: keyof typeof draft, val: string | number | boolean) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="NAPSA Employees"
        subtitle="National Pension Scheme Authority — Employee register"
        actions={
          <Btn size="sm" onClick={() => { resetDraft(); setShowForm(true); }}>
            + Add Employee
          </Btn>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Employees" value={employees.length} />
          <StatCard label="Active" value={activeCount} color="green" />
          <StatCard label="Monthly Gross" value={formatCurrency(totalGross)} />
          <StatCard label="Monthly Contributions" value={formatCurrency(totalMonthlyContrib)} color="blue" />
        </div>

        {/* NAPSA Info Banner */}
        <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 px-4 py-3 text-[11px] text-gray-400 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-secondary-400">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" /><path d="M8 5v1M8 8v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            NAPSA Contribution Rules
          </div>
          <p>Employee: <strong className="text-gray-300">{NAPSA_RATE * 100}%</strong> of gross salary, capped at <strong className="text-gray-300">K{NAPSA_MONTHLY_CEILING.toLocaleString()}/mo</strong></p>
          <p>Employer: <strong className="text-gray-300">{NAPSA_RATE * 100}%</strong> of gross salary, capped at <strong className="text-gray-300">K{NAPSA_MONTHLY_CEILING.toLocaleString()}/mo</strong></p>
          <p className="text-gray-600">No public API available. Use <a href="https://icare.napsa.co.zm" target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-secondary-300 underline">iCARE Portal</a> for online submissions.</p>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="rounded-xl border border-primary-500/20 bg-gray-900/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-200">
                {editId ? "Edit Employee" : "Add Employee"}
              </span>
              <button onClick={resetDraft} className="text-[10px] text-gray-500 hover:text-gray-300">Cancel</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *">
                <Input value={draft.name} onChange={(v) => D("name", v)} placeholder="John Mwale" />
              </Field>
              <Field label="NRC Number">
                <Input value={draft.nrcNumber} onChange={(v) => D("nrcNumber", v)} placeholder="123456/78/1" />
              </Field>
              <Field label="NAPSA Member No.">
                <Input value={draft.napsaMemberNo} onChange={(v) => D("napsaMemberNo", v)} placeholder="NAPSA-001234" />
              </Field>
              <Field label="Monthly Gross Salary (ZMW)">
                <Input
                  value={draft.grossSalary ? String(draft.grossSalary) : ""}
                  onChange={(v) => D("grossSalary", Number(v) || 0)}
                  placeholder="5000"
                />
              </Field>
              <Field label="Department">
                <Input value={draft.department} onChange={(v) => D("department", v)} placeholder="Engineering" />
              </Field>
              <Field label="Position">
                <Input value={draft.position} onChange={(v) => D("position", v)} placeholder="Software Engineer" />
              </Field>
              <Field label="Start Date">
                <Input value={draft.startDate} onChange={(v) => D("startDate", v)} placeholder="2024-01-15" />
              </Field>
              <Field label="Status">
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(e) => D("isActive", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30"
                    />
                    <span className="text-xs text-gray-300">Active Employee</span>
                  </label>
                </div>
              </Field>
            </div>

            {/* Preview calculation */}
            {draft.grossSalary > 0 && (
              <div className="rounded-lg border border-gray-800/40 bg-gray-900/30 p-3">
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Contribution Preview</div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-gray-500">Employee (5%)</div>
                    <div className="text-gray-200 font-medium">K{calculateNAPSA(draft.grossSalary).employee.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Employer (5%)</div>
                    <div className="text-gray-200 font-medium">K{calculateNAPSA(draft.grossSalary).employer.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total</div>
                    <div className="text-primary-300 font-semibold">K{calculateNAPSA(draft.grossSalary).total.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Btn variant="ghost" size="sm" onClick={resetDraft}>Cancel</Btn>
              <Btn size="sm" onClick={handleSave} disabled={!draft.name.trim()}>
                {editId ? "Update" : "Add Employee"}
              </Btn>
            </div>
          </div>
        )}

        {/* Search + Employee List */}
        <div className="space-y-3">
          {employees.length > 0 && (
            <SearchBar value={search} onChange={setSearch} placeholder="Search employees…" />
          )}

          {filtered.length === 0 && employees.length === 0 ? (
            <EmptyView
              icon={<svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gray-600"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M5 20c0-4 3.1-7 7-7s7 3 7 7" stroke="currentColor" strokeWidth="1.5" /></svg>}
              title="No employees registered"
              description="Add employees to calculate NAPSA contributions and generate monthly returns."
              action="Add First Employee"
              onAction={() => { resetDraft(); setShowForm(true); }}
            />
          ) : filtered.length === 0 ? (
            <EmptyView
              icon={<svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gray-600"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              title="No matches"
              description="Try a different search term."
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((emp) => {
                const napsa = calculateNAPSA(emp.grossSalary);
                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-800/40 hover:border-gray-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${emp.isActive ? "bg-success-400" : "bg-gray-600"}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-200">{emp.name}</span>
                          {emp.napsaMemberNo && (
                            <span className="text-[10px] text-gray-600 font-mono">{emp.napsaMemberNo}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {emp.position}{emp.department ? ` · ${emp.department}` : ""} · NRC: {emp.nrcNumber || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-gray-300 font-medium">K{emp.grossSalary.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-600">K{napsa.total.toLocaleString()}/mo contrib</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(emp)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                          title="Edit"
                        >
                          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-error-400 hover:bg-error-500/10 transition-colors"
                          title="Remove"
                        >
                          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><path d="M3 5h10l-1 9H4L3 5zM6.5 3h3M2 5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer link to returns */}
        {employees.length > 0 && (
          <div className="flex justify-center pt-2">
            <Btn variant="ghost" size="sm" onClick={() => setView("napsa-returns")}>
              View Monthly Returns →
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
