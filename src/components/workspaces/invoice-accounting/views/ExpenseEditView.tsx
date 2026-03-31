
"use client";

import { useMemo } from "react";
import { useInvoiceAccountingEditor, type Expense, type ExpenseCategory, EXPENSE_CATEGORIES } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, BackButton, Field, Input, Textarea, Select, SectionDivider, VendorPicker, TaxRatePicker } from "../shared";

export default function ExpenseEditView({ id }: { id: string | null }) {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const addExpense = useInvoiceAccountingEditor((s) => s.addExpense);
  const updateExpense = useInvoiceAccountingEditor((s) => s.updateExpense);
  const removeExpense = useInvoiceAccountingEditor((s) => s.removeExpense);

  const expense = useMemo(() => {
    if (!id) return null;
    return form.expenses.find((e) => e.id === id) || null;
  }, [form.expenses, id]);

  if (!id) {
    const newId = addExpense({
      vendorId: "", category: "office" as ExpenseCategory, amount: 0,
      date: new Date().toISOString().slice(0, 10), description: "", reference: "",
      taxRateId: "vat-standard", taxRate: 16, isDeductible: true, isBillable: false,
      invoiceId: "", projectId: "", currency: form.business.currency,
    });
    setView("expense-edit", newId);
    return null;
  }

  if (!expense) {
    return <div className="flex flex-col h-full"><PageHeader title="Expense not found" actions={<Btn variant="ghost" size="sm" onClick={() => setView("expenses")}>← Back</Btn>} /></div>;
  }

  const update = (data: Partial<Expense>) => updateExpense(expense.id, data);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={expense.description || "New Expense"} actions={<Btn variant="danger" size="xs" onClick={() => { removeExpense(expense.id); setView("expenses"); }}>Delete</Btn>} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
          <BackButton onClick={() => setView("expenses")} label="All Expenses" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Description" required><Input value={expense.description} onChange={(v) => update({ description: v })} placeholder="What was this expense for?" /></Field>
            <Field label="Amount" required><Input type="number" value={expense.amount} onChange={(v) => update({ amount: parseFloat(v) || 0 })} /></Field>
            <Field label="Date"><Input type="date" value={expense.date} onChange={(v) => update({ date: v })} /></Field>
            <Field label="Category">
              <Select value={expense.category} onChange={(v) => update({ category: v as ExpenseCategory })} options={EXPENSE_CATEGORIES} />
            </Field>
            <Field label="Vendor"><VendorPicker value={expense.vendorId} onChange={(v) => update({ vendorId: v })} /></Field>
            <Field label="Reference"><Input value={expense.reference} onChange={(v) => update({ reference: v })} placeholder="Receipt #, invoice #" /></Field>
            <Field label="Tax Rate"><TaxRatePicker value={expense.taxRateId} onChange={(v) => {
              const tax = form.taxes.find((t) => t.id === v);
              update({ taxRateId: v, taxRate: tax?.rate ?? 0 });
            }} /></Field>
          </div>

          <SectionDivider title="Options" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tax Deductible">
              <Select value={expense.isDeductible ? "yes" : "no"} onChange={(v) => update({ isDeductible: v === "yes" })} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
            </Field>
            <Field label="Billable to Client">
              <Select value={expense.isBillable ? "yes" : "no"} onChange={(v) => update({ isBillable: v === "yes" })} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
