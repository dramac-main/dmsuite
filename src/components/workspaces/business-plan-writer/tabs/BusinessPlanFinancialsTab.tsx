// =============================================================================
// Business Plan Financials Tab — Projections, revenue model, funding
// =============================================================================

"use client";

import { useState } from "react";
import { useBusinessPlanEditor } from "@/stores/business-plan-editor";
import {
  AccordionSection,
  FormInput,
  FormTextarea,
  FormSelect,
  SIcon,
  IconButton,
} from "@/components/workspaces/shared/WorkspaceUIKit";

const CURRENCIES = [
  { value: "ZMW", label: "ZMW (K) — Zambian Kwacha" },
  { value: "USD", label: "USD ($) — US Dollar" },
  { value: "EUR", label: "EUR (€) — Euro" },
  { value: "GBP", label: "GBP (£) — British Pound" },
  { value: "ZAR", label: "ZAR (R) — South African Rand" },
  { value: "NGN", label: "NGN (₦) — Nigerian Naira" },
  { value: "KES", label: "KES (KSh) — Kenyan Shilling" },
];

export default function BusinessPlanFinancialsTab() {
  const store = useBusinessPlanEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({
    projections: true,
    revenue: false,
    funding: false,
    useOfFunds: false,
    exit: false,
  });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const icons = {
    projections: <SIcon d="M9 7h6m0 10v-3m-3 3v-6m-3 6v-1m6-9a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2" />,
    revenue: <SIcon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    funding: <SIcon d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
    useOfFunds: <SIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
    exit: <SIcon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
  };

  return (
    <div className="space-y-2">
      {/* Currency Selector */}
      <div className="px-1 py-1">
        <FormSelect
          label="Currency"
          value={store.form.currency}
          onChange={(e) => store.setCurrency(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </FormSelect>
      </div>

      {/* Financial Projections */}
      <AccordionSection
        title="Financial Projections"
        icon={icons.projections}
        badge={`${store.form.financialProjections.length} years`}
        isOpen={open.projections}
        onToggle={() => toggle("projections")}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-300">Yearly Projections</span>
            <IconButton
              icon={<SIcon d="M12 4v16m8-8H4" />}
              onClick={store.addFinancialYear}
              title="Add year"
            />
          </div>
          {store.form.financialProjections.map((row) => (
            <div key={row.id} className="relative p-2 rounded-lg border border-gray-700/50 bg-gray-800/30 space-y-1.5">
              {store.form.financialProjections.length > 1 && (
                <button
                  onClick={() => store.removeFinancialYear(row.id)}
                  className="absolute top-1.5 right-1.5 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <span className="w-3.5 h-3.5 block"><SIcon d="M6 18L18 6M6 6l12 12" /></span>
                </button>
              )}
              <FormInput
                label="Year"
                value={row.year}
                onChange={(e) => store.updateFinancialYear(row.id, { year: e.target.value })}
                placeholder="2025"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <FormInput
                  label="Revenue"
                  value={row.revenue}
                  onChange={(e) => store.updateFinancialYear(row.id, { revenue: e.target.value })}
                  placeholder="500,000"
                />
                <FormInput
                  label="COGS"
                  value={row.cogs}
                  onChange={(e) => store.updateFinancialYear(row.id, { cogs: e.target.value })}
                  placeholder="200,000"
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <FormInput
                  label="Operating Expenses"
                  value={row.operatingExpenses}
                  onChange={(e) => store.updateFinancialYear(row.id, { operatingExpenses: e.target.value })}
                  placeholder="150,000"
                />
                <FormInput
                  label="Net Income"
                  value={row.netIncome}
                  onChange={(e) => store.updateFinancialYear(row.id, { netIncome: e.target.value })}
                  placeholder="150,000"
                />
              </div>
            </div>
          ))}

          <FormTextarea
            label="Break-Even Analysis"
            value={store.form.breakEvenAnalysis}
            onChange={(e) => store.setBreakEvenAnalysis(e.target.value)}
            placeholder="When do you expect to break even?"
            rows={3}
          />
          <FormTextarea
            label="Key Assumptions"
            value={store.form.keyAssumptions}
            onChange={(e) => store.setKeyAssumptions(e.target.value)}
            placeholder="Key assumptions underpinning your projections..."
            rows={3}
          />
        </div>
      </AccordionSection>

      {/* Revenue Model */}
      <AccordionSection
        title="Revenue Model"
        icon={icons.revenue}
        isOpen={open.revenue}
        onToggle={() => toggle("revenue")}
      >
        <FormTextarea
          label="Revenue Streams"
          value={store.form.revenueModel}
          onChange={(e) => store.setRevenueModel(e.target.value)}
          placeholder="Describe your revenue streams, pricing tiers, and unit economics..."
          rows={6}
        />
      </AccordionSection>

      {/* Funding Requirements */}
      <AccordionSection
        title="Funding Requirements"
        icon={icons.funding}
        isOpen={open.funding}
        onToggle={() => toggle("funding")}
      >
        <div className="space-y-2">
          <FormInput
            label="Total Funding Needed"
            value={store.form.totalFundingNeeded}
            onChange={(e) => store.setTotalFundingNeeded(e.target.value)}
            placeholder="1,000,000"
          />

          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-300">Funding Sources</span>
            <IconButton
              icon={<SIcon d="M12 4v16m8-8H4" />}
              onClick={store.addFundingSource}
              title="Add source"
            />
          </div>
          {store.form.fundingSources.map((src) => (
            <div key={src.id} className="relative p-2 rounded-lg border border-gray-700/50 bg-gray-800/30 space-y-1.5">
              {store.form.fundingSources.length > 1 && (
                <button
                  onClick={() => store.removeFundingSource(src.id)}
                  className="absolute top-1.5 right-1.5 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <span className="w-3.5 h-3.5 block"><SIcon d="M6 18L18 6M6 6l12 12" /></span>
                </button>
              )}
              <FormInput
                label="Source"
                value={src.source}
                onChange={(e) => store.updateFundingSource(src.id, { source: e.target.value })}
                placeholder="Angel investors, VC, Bank loan..."
              />
              <div className="grid grid-cols-2 gap-1.5">
                <FormInput
                  label="Amount"
                  value={src.amount}
                  onChange={(e) => store.updateFundingSource(src.id, { amount: e.target.value })}
                  placeholder="500,000"
                />
                <FormInput
                  label="Terms"
                  value={src.terms}
                  onChange={(e) => store.updateFundingSource(src.id, { terms: e.target.value })}
                  placeholder="10% equity"
                />
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* Use of Funds */}
      <AccordionSection
        title="Use of Funds"
        icon={icons.useOfFunds}
        badge={`${store.form.useOfFunds.filter((u) => u.category).length} items`}
        isOpen={open.useOfFunds}
        onToggle={() => toggle("useOfFunds")}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-300">Allocation</span>
            <IconButton
              icon={<SIcon d="M12 4v16m8-8H4" />}
              onClick={store.addUseOfFunds}
              title="Add allocation"
            />
          </div>
          {store.form.useOfFunds.map((item) => (
            <div key={item.id} className="relative p-2 rounded-lg border border-gray-700/50 bg-gray-800/30 space-y-1.5">
              {store.form.useOfFunds.length > 1 && (
                <button
                  onClick={() => store.removeUseOfFunds(item.id)}
                  className="absolute top-1.5 right-1.5 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <span className="w-3.5 h-3.5 block"><SIcon d="M6 18L18 6M6 6l12 12" /></span>
                </button>
              )}
              <FormInput
                label="Category"
                value={item.category}
                onChange={(e) => store.updateUseOfFunds(item.id, { category: e.target.value })}
                placeholder="Product Development, Marketing..."
              />
              <div className="grid grid-cols-2 gap-1.5">
                <FormInput
                  label="Amount"
                  value={item.amount}
                  onChange={(e) => store.updateUseOfFunds(item.id, { amount: e.target.value })}
                  placeholder="200,000"
                />
                <FormInput
                  label="Percentage"
                  value={item.percentage}
                  onChange={(e) => store.updateUseOfFunds(item.id, { percentage: e.target.value })}
                  placeholder="20%"
                />
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* Exit Strategy */}
      <AccordionSection
        title="Exit Strategy"
        icon={icons.exit}
        isOpen={open.exit}
        onToggle={() => toggle("exit")}
      >
        <div className="space-y-2">
          <FormTextarea
            label="Exit Strategy"
            value={store.form.exitStrategy}
            onChange={(e) => store.setExitStrategy(e.target.value)}
            placeholder="Describe potential exit strategies (IPO, acquisition, etc.)..."
            rows={4}
          />
          <FormTextarea
            label="Projected Investor Returns"
            value={store.form.investorReturns}
            onChange={(e) => store.setInvestorReturns(e.target.value)}
            placeholder="Expected ROI and timeline for investors..."
            rows={3}
          />
          <FormTextarea
            label="Appendix Notes"
            value={store.form.appendixNotes}
            onChange={(e) => store.setAppendixNotes(e.target.value)}
            placeholder="Additional supporting information and references..."
            rows={3}
          />
        </div>
      </AccordionSection>
    </div>
  );
}
