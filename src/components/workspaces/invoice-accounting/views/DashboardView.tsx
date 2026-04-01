
"use client";

import { useMemo } from "react";
import {
  useInvoiceAccountingEditor,
  formatCurrency,
  calculateInvoiceTotals,
  getInvoiceBalance,
} from "@/stores/invoice-accounting-editor";
import { StatCard, StatusBadge, Btn, formatDate } from "../shared";

export default function DashboardView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const currency = form.business?.currency ?? "ZMW";

  // ── Computed stats ──
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let totalPaid = 0;
    let totalExpenses = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const inv of (form.invoices ?? [])) {
      if (inv.status === "cancelled" || inv.status === "draft") continue;
      const totals = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
      const balance = getInvoiceBalance(inv, form.payments ?? []);
      totalRevenue += totals.total;
      totalOutstanding += balance;
      if (inv.status === "overdue") totalOverdue += balance;
      if (inv.status === "paid") totalPaid += totals.total;
    }

    const recentExpenses = (form.expenses ?? []).filter(
      (e) => new Date(e.date) >= thirtyDaysAgo
    );
    totalExpenses = recentExpenses.reduce((s, e) => s + e.amount, 0);

    return { totalRevenue, totalOutstanding, totalOverdue, totalPaid, totalExpenses };
  }, [form.invoices, form.payments, form.expenses]);

  // ── Recent invoices ──
  const recentInvoices = useMemo(
    () =>
      [...(form.invoices ?? [])]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [form.invoices]
  );

  // ── Recent payments ──
  const recentPayments = useMemo(
    () =>
      [...(form.payments ?? [])]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [form.payments]
  );

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Welcome banner */}
        <div className="rounded-xl border border-gray-800/40 bg-linear-to-br from-primary-500/5 via-gray-900/50 to-gray-900/50 p-5">
          <h2 className="text-base font-bold text-gray-100 mb-1">
            {form.business?.name || "Your Business"}
          </h2>
          <p className="text-[11px] text-gray-500 mb-4">
            {form.business?.name
              ? `Welcome back! Here's your financial overview.`
              : "Set up your business details in Settings to get started."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" size="sm" onClick={() => setView("invoices")}>
              New Invoice
            </Btn>
            <Btn variant="secondary" size="sm" onClick={() => setView("quotes")}>
              New Quote
            </Btn>
            {!form.business?.name && (
              <Btn variant="ghost" size="sm" onClick={() => setView("settings")}>
                Set Up Business →
              </Btn>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue, currency)}
            color="green"
            onClick={() => setView("reports")}
          />
          <StatCard
            label="Outstanding"
            value={formatCurrency(stats.totalOutstanding, currency)}
            color="amber"
            onClick={() => setView("invoices")}
          />
          <StatCard
            label="Overdue"
            value={formatCurrency(stats.totalOverdue, currency)}
            color="red"
            subValue={`${(form.invoices ?? []).filter((i) => i.status === "overdue").length} invoices`}
            onClick={() => setView("invoices")}
          />
          <StatCard
            label="Paid (All time)"
            value={formatCurrency(stats.totalPaid, currency)}
            color="blue"
          />
          <StatCard
            label="Expenses (30d)"
            value={formatCurrency(stats.totalExpenses, currency)}
            color="purple"
            onClick={() => setView("expenses")}
          />
        </div>

        {/* Quick counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Clients"
            value={(form.clients ?? []).length}
            onClick={() => setView("clients")}
          />
          <StatCard
            label="Products"
            value={(form.products ?? []).length}
            onClick={() => setView("products")}
          />
          <StatCard
            label="Open Quotes"
            value={(form.quotes ?? []).filter((q) => q.status === "sent" || q.status === "draft").length}
            onClick={() => setView("quotes")}
          />
          <StatCard
            label="Projects"
            value={(form.projects ?? []).length}
            onClick={() => setView("projects")}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent invoices */}
          <div className="rounded-xl border border-gray-800/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/40">
              <span className="text-[11px] font-semibold text-gray-300">Recent Invoices</span>
              <Btn variant="ghost" size="xs" onClick={() => setView("invoices")}>View All</Btn>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="p-6 text-center text-[11px] text-gray-600">No invoices yet</div>
            ) : (
              <div className="divide-y divide-gray-800/20">
                {recentInvoices.map((inv) => {
                  const client = (form.clients ?? []).find((c) => c.id === inv.clientId);
                  const totals = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
                  return (
                    <button
                      key={inv.id}
                      onClick={() => setView("invoice-edit", inv.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/2 transition-colors text-left"
                    >
                      <div>
                        <div className="text-[11px] font-medium text-gray-300">{inv.number}</div>
                        <div className="text-[10px] text-gray-500">{client?.name || "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-semibold text-gray-200 tabular-nums">
                          {formatCurrency(totals.total, inv.currency)}
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent payments */}
          <div className="rounded-xl border border-gray-800/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/40">
              <span className="text-[11px] font-semibold text-gray-300">Recent Payments</span>
              <Btn variant="ghost" size="xs" onClick={() => setView("payments")}>View All</Btn>
            </div>
            {recentPayments.length === 0 ? (
              <div className="p-6 text-center text-[11px] text-gray-600">No payments recorded</div>
            ) : (
              <div className="divide-y divide-gray-800/20">
                {recentPayments.map((pay) => {
                  const client = (form.clients ?? []).find((c) => c.id === pay.clientId);
                  const inv = (form.invoices ?? []).find((i) => i.id === pay.invoiceId);
                  return (
                    <div key={pay.id} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <div className="text-[11px] font-medium text-gray-300">{client?.name || "—"}</div>
                        <div className="text-[10px] text-gray-500">{inv?.number || "—"} · {pay.method}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-semibold text-emerald-400 tabular-nums">
                          +{formatCurrency(pay.amount, pay.currency)}
                        </div>
                        <div className="text-[9px] text-gray-600">{formatDate(pay.date)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
