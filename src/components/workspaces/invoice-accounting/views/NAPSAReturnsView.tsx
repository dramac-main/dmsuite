"use client";

import { useState, useCallback, useMemo } from "react";
import {
  useInvoiceAccountingEditor,
  formatCurrency,
  type NAPSAReturn,
} from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, StatCard, EmptyView } from "../shared";

// ── Status colors ──

function returnStatusColor(status: NAPSAReturn["status"]): string {
  switch (status) {
    case "paid": return "bg-success-500/15 text-success-400 border-success-500/30";
    case "submitted": return "bg-primary-500/15 text-primary-300 border-primary-500/30";
    default: return "bg-gray-800 text-gray-500 border-gray-700/50";
  }
}

function ReturnStatusBadge({ status }: { status: NAPSAReturn["status"] }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${returnStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[Number(m) - 1] || m} ${y}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function NAPSAReturnsView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const generateNAPSAReturn = useInvoiceAccountingEditor((s) => s.generateNAPSAReturn);
  const updateNAPSAReturnStatus = useInvoiceAccountingEditor((s) => s.updateNAPSAReturnStatus);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const returns = form.napsaReturns;
  const employees = form.napsaEmployees;
  const activeEmployees = employees.filter((e) => e.isActive);

  // Stats
  const totalPaid = returns.filter((r) => r.status === "paid").reduce((s, r) => s + r.grandTotal, 0);
  const draftCount = returns.filter((r) => r.status === "draft").length;
  const submittedCount = returns.filter((r) => r.status === "submitted").length;

  // Generate for current month
  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const hasCurrentReturn = returns.some((r) => r.month === currentMonth);

  const handleGenerate = useCallback(() => {
    if (activeEmployees.length === 0) {
      alert("No active employees. Add employees first.");
      return;
    }
    const month = prompt("Generate return for month (YYYY-MM):", currentMonth);
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return;
    if (returns.some((r) => r.month === month)) {
      alert(`Return for ${formatMonth(month)} already exists.`);
      return;
    }
    generateNAPSAReturn(month);
  }, [activeEmployees.length, currentMonth, returns, generateNAPSAReturn]);

  const handleGenerateCurrent = useCallback(() => {
    if (activeEmployees.length === 0) {
      alert("No active employees. Add employees first.");
      return;
    }
    generateNAPSAReturn(currentMonth);
  }, [activeEmployees.length, currentMonth, generateNAPSAReturn]);

  const handleStatusChange = useCallback((id: string, status: NAPSAReturn["status"]) => {
    updateNAPSAReturnStatus(id, status);
  }, [updateNAPSAReturnStatus]);

  // Export CSV
  const handleExportCSV = useCallback((ret: NAPSAReturn) => {
    const empMap = new Map(employees.map((e) => [e.id, e]));
    const rows = [
      ["Employee Name", "NRC", "NAPSA No.", "Gross Salary", "Employee (5%)", "Employer (5%)", "Total"],
      ...ret.employeeContributions.map((c) => {
        const emp = empMap.get(c.employeeId);
        return [
          emp?.name || "Unknown",
          emp?.nrcNumber || "",
          emp?.napsaMemberNo || "",
          c.grossSalary.toFixed(2),
          c.employeeAmount.toFixed(2),
          c.employerAmount.toFixed(2),
          c.totalAmount.toFixed(2),
        ];
      }),
      [],
      ["", "", "", "TOTALS", ret.totalEmployeeContrib.toFixed(2), ret.totalEmployerContrib.toFixed(2), ret.grandTotal.toFixed(2)],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `napsa-return-${ret.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [employees]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="NAPSA Returns"
        subtitle="Monthly contribution returns for NAPSA"
        actions={
          <div className="flex items-center gap-2">
            <Btn size="sm" variant="ghost" onClick={() => setView("napsa-employees")}>
              Manage Employees
            </Btn>
            {!hasCurrentReturn && activeEmployees.length > 0 ? (
              <Btn size="sm" onClick={handleGenerateCurrent}>
                Generate {formatMonth(currentMonth)}
              </Btn>
            ) : (
              <Btn size="sm" onClick={handleGenerate}>
                Generate Return
              </Btn>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Returns" value={returns.length} />
          <StatCard label="Draft" value={draftCount} />
          <StatCard label="Submitted" value={submittedCount} color="blue" />
          <StatCard label="Total Paid" value={formatCurrency(totalPaid)} color="green" />
        </div>

        {/* iCARE info */}
        <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 px-4 py-3 text-[11px] text-gray-400 space-y-1">
          <p>
            NAPSA does not offer a public API. Submit returns via the{" "}
            <a href="https://icare.napsa.co.zm" target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-secondary-300 underline font-medium">
              iCARE Portal
            </a>
            . Use the CSV export to prepare your data.
          </p>
        </div>

        {/* Returns list */}
        {returns.length === 0 ? (
          <EmptyView
            icon={<svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gray-600"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M7 7h10M7 11h7M7 15h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>}
            title="No returns generated"
            description={
              activeEmployees.length === 0
                ? "Add employees first, then generate monthly returns."
                : `Generate a return for ${formatMonth(currentMonth)} to calculate contributions.`
            }
            action={activeEmployees.length === 0 ? "Add Employees" : `Generate ${formatMonth(currentMonth)}`}
            onAction={activeEmployees.length === 0 ? () => setView("napsa-employees") : handleGenerateCurrent}
          />
        ) : (
          <div className="space-y-3">
            {returns
              .sort((a, b) => b.month.localeCompare(a.month))
              .map((ret) => {
                const isExpanded = expandedId === ret.id;
                const empMap = new Map(employees.map((e) => [e.id, e]));
                return (
                  <div
                    key={ret.id}
                    className="rounded-xl border border-gray-800/40 overflow-hidden transition-colors hover:border-gray-700/50"
                  >
                    {/* Header row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ret.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ReturnStatusBadge status={ret.status} />
                        <span className="text-sm font-semibold text-gray-200">{formatMonth(ret.month)}</span>
                        <span className="text-[10px] text-gray-600">
                          {ret.employeeContributions.length} employee{ret.employeeContributions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-primary-300">
                          {formatCurrency(ret.grandTotal)}
                        </span>
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        >
                          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-gray-800/40 px-4 py-3 space-y-3 bg-gray-900/20">
                        {/* Contribution breakdown */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="text-gray-500 border-b border-gray-800/40">
                                <th className="text-left py-1.5 font-medium">Employee</th>
                                <th className="text-right py-1.5 font-medium">Gross</th>
                                <th className="text-right py-1.5 font-medium">Employee (5%)</th>
                                <th className="text-right py-1.5 font-medium">Employer (5%)</th>
                                <th className="text-right py-1.5 font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ret.employeeContributions.map((c) => {
                                const emp = empMap.get(c.employeeId);
                                return (
                                  <tr key={c.employeeId} className="border-b border-gray-800/20">
                                    <td className="py-1.5 text-gray-300">{emp?.name || "Unknown"}</td>
                                    <td className="py-1.5 text-right text-gray-400">K{c.grossSalary.toLocaleString()}</td>
                                    <td className="py-1.5 text-right text-gray-400">K{c.employeeAmount.toLocaleString()}</td>
                                    <td className="py-1.5 text-right text-gray-400">K{c.employerAmount.toLocaleString()}</td>
                                    <td className="py-1.5 text-right text-gray-200 font-medium">K{c.totalAmount.toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-gray-700/40 font-semibold">
                                <td className="py-2 text-gray-300">TOTALS</td>
                                <td className="py-2 text-right text-gray-400">
                                  K{ret.employeeContributions.reduce((s, c) => s + c.grossSalary, 0).toLocaleString()}
                                </td>
                                <td className="py-2 text-right text-gray-400">K{ret.totalEmployeeContrib.toLocaleString()}</td>
                                <td className="py-2 text-right text-gray-400">K{ret.totalEmployerContrib.toLocaleString()}</td>
                                <td className="py-2 text-right text-primary-300">K{ret.grandTotal.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[10px] text-gray-600">
                            Created: {new Date(ret.createdAt).toLocaleDateString()}
                            {ret.submittedAt && ` · Submitted: ${new Date(ret.submittedAt).toLocaleDateString()}`}
                            {ret.paidAt && ` · Paid: ${new Date(ret.paidAt).toLocaleDateString()}`}
                          </div>
                          <div className="flex items-center gap-2">
                            <Btn size="sm" variant="ghost" onClick={() => handleExportCSV(ret)}>
                              Export CSV
                            </Btn>
                            {ret.status === "draft" && (
                              <Btn size="sm" variant="secondary" onClick={() => handleStatusChange(ret.id, "submitted")}>
                                Mark Submitted
                              </Btn>
                            )}
                            {ret.status === "submitted" && (
                              <Btn size="sm" onClick={() => handleStatusChange(ret.id, "paid")}>
                                Mark Paid
                              </Btn>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
