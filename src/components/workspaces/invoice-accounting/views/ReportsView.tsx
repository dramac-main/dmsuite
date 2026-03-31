"use client";

import { useState, useMemo } from "react";
import { useInvoiceAccountingEditor, formatCurrency, calculateInvoiceTotals, calculatePAYE, calculateNAPSA } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, StatCard, TabStrip, Field, Input, SectionDivider } from "../shared";

type ReportKey = "revenue" | "profit-loss" | "tax-summary" | "aging" | "paye" | "napsa" | "client-revenue" | "expense-breakdown";

const REPORT_TABS: { key: ReportKey; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "profit-loss", label: "Profit & Loss" },
  { key: "tax-summary", label: "Tax Summary" },
  { key: "aging", label: "Aging" },
  { key: "paye", label: "PAYE" },
  { key: "napsa", label: "NAPSA" },
  { key: "client-revenue", label: "By Client" },
  { key: "expense-breakdown", label: "Expenses" },
];

const ZERO_DISCOUNT = { type: "fixed" as const, value: 0 };

export default function ReportsView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const [activeReport, setActiveReport] = useState<ReportKey>("revenue");
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split("T")[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  const inRange = (date: string) => date >= dateFrom && date <= dateTo;

  const metrics = useMemo(() => {
    const periodInvoices = form.invoices.filter((inv) => inRange(inv.date));
    const periodExpenses = form.expenses.filter((exp) => inRange(exp.date));
    const periodPayments = form.payments.filter((p) => inRange(p.date));

    const totalRevenue = periodPayments.reduce((s, p) => s + p.amount, 0);
    const totalInvoiced = periodInvoices.reduce((s, inv) => {
      const t = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
      return s + t.total;
    }, 0);
    const totalExpenses = periodExpenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const taxCollected = periodInvoices.reduce((s, inv) => {
      const t = calculateInvoiceTotals(inv.lineItems, inv.taxMode, ZERO_DISCOUNT);
      return s + t.taxTotal;
    }, 0);
    const taxPaidOnExpenses = periodExpenses.reduce((s, exp) => {
      if (!exp.taxRateId) return s;
      const tr = form.taxes.find((t) => t.id === exp.taxRateId);
      return s + (tr ? exp.amount * (tr.rate / 100) : 0);
    }, 0);

    const today = new Date();
    const aging = { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyDays: 0, overNinety: 0 };
    form.invoices.filter((inv) => inv.status === "sent" || inv.status === "partial").forEach((inv) => {
      const t = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
      const paid = form.payments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0);
      const balance = t.total - paid;
      if (balance <= 0) return;
      const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.date);
      const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
      if (days <= 0) aging.current += balance;
      else if (days <= 30) aging.thirtyDays += balance;
      else if (days <= 60) aging.sixtyDays += balance;
      else if (days <= 90) aging.ninetyDays += balance;
      else aging.overNinety += balance;
    });

    const clientRevenue = form.clients.map((c) => {
      const clientInvs = periodInvoices.filter((inv) => inv.clientId === c.id);
      const rev = clientInvs.reduce((s, inv) => {
        const t = calculateInvoiceTotals(inv.lineItems, inv.taxMode, ZERO_DISCOUNT);
        return s + t.total;
      }, 0);
      return { name: c.name, revenue: rev, count: clientInvs.length };
    }).filter((c) => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);

    const expenseByCategory: Record<string, number> = {};
    periodExpenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });
    const expenseBreakdown = Object.entries(expenseByCategory).map(([cat, amount]) => ({ category: cat, amount })).sort((a, b) => b.amount - a.amount);

    return { totalRevenue, totalInvoiced, totalExpenses, netProfit, taxCollected, taxPaidOnExpenses, aging, clientRevenue, expenseBreakdown, periodInvoices, periodPayments };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, dateFrom, dateTo]);

  const renderReport = () => {
    switch (activeReport) {
      case "revenue":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Invoiced" value={formatCurrency(metrics.totalInvoiced)} color="blue" />
              <StatCard label="Revenue (Paid)" value={formatCurrency(metrics.totalRevenue)} color="green" />
              <StatCard label="Payments" value={String(metrics.periodPayments.length)} color="purple" />
              <StatCard label="Invoices" value={String(metrics.periodInvoices.length)} color="amber" />
            </div>
            <SectionDivider title="Invoice Breakdown" />
            <table className="w-full text-[11px]">
              <thead><tr className="text-gray-500 border-b border-gray-800/40"><th className="text-left py-2">Invoice</th><th className="text-left py-2">Client</th><th className="text-left py-2">Date</th><th className="text-right py-2">Amount</th><th className="text-left py-2">Status</th></tr></thead>
              <tbody>
                {metrics.periodInvoices.slice(0, 50).map((inv) => {
                  const t = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
                  const client = form.clients.find((c) => c.id === inv.clientId);
                  return (
                    <tr key={inv.id} className="border-b border-gray-800/20">
                      <td className="py-1.5 text-gray-300">{inv.number}</td>
                      <td className="py-1.5 text-gray-400">{client?.name || "\u2014"}</td>
                      <td className="py-1.5 text-gray-500">{inv.date}</td>
                      <td className="py-1.5 text-right text-gray-300 tabular-nums">{formatCurrency(t.total)}</td>
                      <td className="py-1.5"><span className={`px-1.5 py-0.5 rounded-full text-[9px] ${inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{inv.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

      case "profit-loss":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Revenue" value={formatCurrency(metrics.totalRevenue)} color="green" />
              <StatCard label="Expenses" value={formatCurrency(metrics.totalExpenses)} color="red" />
              <StatCard label="Net Profit" value={formatCurrency(metrics.netProfit)} color={metrics.netProfit >= 0 ? "green" : "red"} />
            </div>
            <SectionDivider title="Expense Breakdown" />
            <div className="space-y-2">
              {metrics.expenseBreakdown.map((e) => (
                <div key={e.category} className="flex items-center justify-between py-1.5 border-b border-gray-800/20">
                  <span className="text-[11px] text-gray-400 capitalize">{e.category.replace(/_/g, " ")}</span>
                  <span className="text-[11px] text-gray-300 tabular-nums">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-700">
              <div className="text-right"><span className="text-[11px] text-gray-500">Net: </span><span className={`text-sm font-semibold tabular-nums ${metrics.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(metrics.netProfit)}</span></div>
            </div>
          </div>
        );

      case "tax-summary":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="VAT Collected" value={formatCurrency(metrics.taxCollected)} color="blue" />
              <StatCard label="Tax on Expenses" value={formatCurrency(metrics.taxPaidOnExpenses)} color="purple" />
              <StatCard label="Net Tax Payable" value={formatCurrency(metrics.taxCollected - metrics.taxPaidOnExpenses)} color="amber" />
            </div>
            <SectionDivider title="Tax Rates Applied" />
            <div className="space-y-2">
              {form.taxes.map((tr) => (
                <div key={tr.id} className="flex items-center justify-between py-1.5 border-b border-gray-800/20">
                  <div><span className="text-[11px] text-gray-300">{tr.name}</span><span className="text-[10px] text-gray-500 ml-2">{tr.rate}%</span></div>
                  <span className="text-[10px] text-gray-500">{tr.isDefault ? "Default" : ""}</span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-[10px] text-amber-400">ZRA VAT Return: File monthly by the 18th. Standard rate: 16%. Export supplies are zero-rated.</p>
            </div>
          </div>
        );

      case "aging":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Current" value={formatCurrency(metrics.aging.current)} color="green" />
              <StatCard label="1-30 Days" value={formatCurrency(metrics.aging.thirtyDays)} color="blue" />
              <StatCard label="31-60 Days" value={formatCurrency(metrics.aging.sixtyDays)} color="purple" />
              <StatCard label="61-90 Days" value={formatCurrency(metrics.aging.ninetyDays)} color="red" />
              <StatCard label=">90 Days" value={formatCurrency(metrics.aging.overNinety)} color="red" />
            </div>
            <div className="h-8 flex rounded-lg overflow-hidden">
              {[
                { val: metrics.aging.current, color: "bg-emerald-500" },
                { val: metrics.aging.thirtyDays, color: "bg-blue-500" },
                { val: metrics.aging.sixtyDays, color: "bg-purple-500" },
                { val: metrics.aging.ninetyDays, color: "bg-amber-500" },
                { val: metrics.aging.overNinety, color: "bg-red-500" },
              ].map((bucket, i) => {
                const totalAging = Object.values(metrics.aging).reduce((s, v) => s + v, 0) || 1;
                const pct = (bucket.val / totalAging) * 100;
                return pct > 0 ? <div key={i} className={`${bucket.color} transition-all`} style={{ width: `${pct}%` }} /> : null;
              })}
            </div>
            <p className="text-[10px] text-gray-500">Total outstanding: {formatCurrency(Object.values(metrics.aging).reduce((s, v) => s + v, 0))}</p>
          </div>
        );

      case "paye":
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gray-800/40 border border-gray-700/30 space-y-3">
              <h3 className="text-[12px] font-semibold text-gray-200">PAYE Calculator (Zambia)</h3>
              <p className="text-[10px] text-gray-400">Monthly taxable income brackets (2024):</p>
              <table className="w-full text-[10px]">
                <thead><tr className="text-gray-500 border-b border-gray-800/40"><th className="text-left py-1">Bracket</th><th className="text-right py-1">Rate</th></tr></thead>
                <tbody>
                  <tr className="border-b border-gray-800/20"><td className="py-1 text-gray-400">K0 — K5,100</td><td className="py-1 text-right text-gray-300">0%</td></tr>
                  <tr className="border-b border-gray-800/20"><td className="py-1 text-gray-400">K5,101 — K7,100</td><td className="py-1 text-right text-gray-300">20%</td></tr>
                  <tr className="border-b border-gray-800/20"><td className="py-1 text-gray-400">K7,101 — K9,200</td><td className="py-1 text-right text-gray-300">30%</td></tr>
                  <tr><td className="py-1 text-gray-400">Above K9,200</td><td className="py-1 text-right text-gray-300">37%</td></tr>
                </tbody>
              </table>
              <PAYECalculator />
            </div>
          </div>
        );

      case "napsa":
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gray-800/40 border border-gray-700/30 space-y-3">
              <h3 className="text-[12px] font-semibold text-gray-200">NAPSA Calculator (Zambia)</h3>
              <p className="text-[10px] text-gray-400">Employee: 5% of gross (capped K1,221.80/month). Employer: 5% of gross (capped K1,221.80/month). Total: 10%.</p>
              <NAPSACalculator />
            </div>
          </div>
        );

      case "client-revenue":
        return (
          <div className="space-y-4">
            {metrics.clientRevenue.length === 0 && <p className="text-[11px] text-gray-500 py-8 text-center">No client revenue in this period</p>}
            {metrics.clientRevenue.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/20">
                <span className="text-[10px] text-gray-500 w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-gray-200 truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-500">{c.count} invoice{c.count !== 1 ? "s" : ""}</p>
                </div>
                <span className="text-[12px] font-semibold text-primary-400 tabular-nums">{formatCurrency(c.revenue)}</span>
              </div>
            ))}
          </div>
        );

      case "expense-breakdown":
        return (
          <div className="space-y-6">
            <StatCard label="Total Expenses" value={formatCurrency(metrics.totalExpenses)} color="red" />
            <div className="space-y-2">
              {metrics.expenseBreakdown.map((e) => {
                const pct = metrics.totalExpenses > 0 ? (e.amount / metrics.totalExpenses) * 100 : 0;
                return (
                  <div key={e.category} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 capitalize">{e.category.replace(/_/g, " ")}</span>
                      <span className="text-[11px] text-gray-300 tabular-nums">{formatCurrency(e.amount)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden"><div className="h-full rounded-full bg-primary-500/60 transition-all" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Reports & Insights" subtitle="Financial analytics for your business" />

      <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-gray-800/40">
        <Field label="From"><Input type="date" value={dateFrom} onChange={setDateFrom} /></Field>
        <Field label="To"><Input type="date" value={dateTo} onChange={setDateTo} /></Field>
        <Btn variant="ghost" size="xs" onClick={() => { const d = new Date(); setDateFrom(new Date(d.getFullYear(), 0, 1).toISOString().split("T")[0]); setDateTo(d.toISOString().split("T")[0]); }}>YTD</Btn>
        <Btn variant="ghost" size="xs" onClick={() => { const d = new Date(); d.setMonth(d.getMonth() - 1); setDateFrom(d.toISOString().split("T")[0]); setDateTo(new Date().toISOString().split("T")[0]); }}>Last 30d</Btn>
      </div>

      <TabStrip tabs={REPORT_TABS} active={activeReport} onChange={(k) => setActiveReport(k as ReportKey)} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {renderReport()}
      </div>
    </div>
  );
}

function PAYECalculator() {
  const [salary, setSalary] = useState("");
  const gross = Number(salary) || 0;
  const paye = calculatePAYE(gross);
  return (
    <div className="flex items-end gap-3 mt-2">
      <Field label="Monthly Gross (ZMW)"><Input type="number" value={salary} onChange={setSalary} placeholder="e.g. 12000" /></Field>
      <div className="pb-0.5">
        <span className="text-[10px] text-gray-500">PAYE: </span>
        <span className="text-[12px] font-semibold text-primary-400 tabular-nums">{formatCurrency(paye, "ZMW")}</span>
        <span className="text-[10px] text-gray-500 ml-2">Net: {formatCurrency(gross - paye, "ZMW")}</span>
      </div>
    </div>
  );
}

function NAPSACalculator() {
  const [salary, setSalary] = useState("");
  const gross = Number(salary) || 0;
  const { employee, employer, total } = calculateNAPSA(gross);
  return (
    <div className="flex items-end gap-3 mt-2">
      <Field label="Monthly Gross (ZMW)"><Input type="number" value={salary} onChange={setSalary} placeholder="e.g. 12000" /></Field>
      <div className="pb-0.5 space-y-0.5">
        <div><span className="text-[10px] text-gray-500">Employee: </span><span className="text-[11px] text-gray-300 tabular-nums">{formatCurrency(employee, "ZMW")}</span></div>
        <div><span className="text-[10px] text-gray-500">Employer: </span><span className="text-[11px] text-gray-300 tabular-nums">{formatCurrency(employer, "ZMW")}</span></div>
        <div><span className="text-[10px] text-gray-500">Total: </span><span className="text-[11px] font-semibold text-primary-400 tabular-nums">{formatCurrency(total, "ZMW")}</span></div>
      </div>
    </div>
  );
}
