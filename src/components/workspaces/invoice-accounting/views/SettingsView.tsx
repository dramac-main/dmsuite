// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useState } from "react";
import { useInvoiceAccountingEditor, CURRENCY_CONFIG, type TaxRate, type CurrencyCode } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, DeleteBtn, Field, Input, Textarea, Select, SectionDivider, TabStrip } from "../shared";

const SETTING_TABS = [
  { key: "business", label: "Business" },
  { key: "tax", label: "Tax Rates" },
  { key: "invoicing", label: "Invoicing" },
  { key: "banking", label: "Banking" },
];

export default function SettingsView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const updateBusinessSettings = useInvoiceAccountingEditor((s) => s.updateBusinessSettings);
  const updateInvoiceStyle = useInvoiceAccountingEditor((s) => s.updateInvoiceStyle);
  const setForm = useInvoiceAccountingEditor((s) => s.setForm);
  const [tab, setTab] = useState("business");
  const [newTax, setNewTax] = useState({ name: "", rate: "", type: "exclusive" as "exclusive" | "inclusive" });

  const biz = form.businessSettings;
  const style = form.invoiceStyle;

  const updateBiz = (key: string, val: unknown) => updateBusinessSettings({ [key]: val });

  const addTaxRate = () => {
    if (!newTax.name || !newTax.rate) return;
    const rate: TaxRate = {
      id: crypto.randomUUID(),
      name: newTax.name,
      rate: Number(newTax.rate),
      type: newTax.type,
      isDefault: false,
    };
    setForm({ taxRates: [...form.taxRates, rate] });
    setNewTax({ name: "", rate: "", type: "exclusive" });
  };

  const removeTaxRate = (id: string) => {
    setForm({ taxRates: form.taxRates.filter((t) => t.id !== id) });
  };

  const currencyOptions = Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => ({
    value: code,
    label: `${cfg.symbol} ${code} — ${cfg.name}`,
  }));

  const templateOptions = [
    { value: "professional", label: "Professional" },
    { value: "modern", label: "Modern" },
    { value: "classic", label: "Classic" },
    { value: "minimal", label: "Minimal" },
    { value: "bold", label: "Bold" },
  ];

  const paymentTermOptions = [
    { value: "due_on_receipt", label: "Due on Receipt" },
    { value: "net_7", label: "Net 7" },
    { value: "net_15", label: "Net 15" },
    { value: "net_30", label: "Net 30" },
    { value: "net_60", label: "Net 60" },
    { value: "net_90", label: "Net 90" },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Settings" subtitle="Configure your invoicing & accounting" />
      <TabStrip tabs={SETTING_TABS} activeKey={tab} onChange={setTab} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {tab === "business" && (
          <>
            <SectionDivider label="Business Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Business Name"><Input value={biz.businessName} onChange={(v) => updateBiz("businessName", v)} placeholder="Your Business Name" /></Field>
              <Field label="Email"><Input value={biz.email} onChange={(v) => updateBiz("email", v)} placeholder="billing@company.com" /></Field>
              <Field label="Phone"><Input value={biz.phone} onChange={(v) => updateBiz("phone", v)} placeholder="+260 97..." /></Field>
              <Field label="Website"><Input value={biz.website || ""} onChange={(v) => updateBiz("website", v)} placeholder="www.company.com" /></Field>
            </div>
            <Field label="Address"><Textarea value={biz.address} onChange={(v) => updateBiz("address", v)} placeholder="Street address, City, Country" rows={3} /></Field>

            <SectionDivider label="Tax Registration" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ZRA TPIN"><Input value={biz.taxNumber} onChange={(v) => updateBiz("taxNumber", v)} placeholder="1234567890" /></Field>
              <Field label="NAPSA Number"><Input value={biz.napsaNumber || ""} onChange={(v) => updateBiz("napsaNumber", v)} placeholder="NAPSA Employer Number" /></Field>
            </div>

            <SectionDivider label="Currency & Defaults" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Default Currency">
                <Select value={biz.defaultCurrency} onChange={(v) => updateBiz("defaultCurrency", v as CurrencyCode)} options={currencyOptions} />
              </Field>
              <Field label="Default Payment Terms">
                <Select value={biz.defaultPaymentTerms} onChange={(v) => updateBiz("defaultPaymentTerms", v)} options={paymentTermOptions} />
              </Field>
            </div>

            <Field label="Invoice Footer / Terms">
              <Textarea value={biz.invoiceFooter || ""} onChange={(v) => updateBiz("invoiceFooter", v)} placeholder="Payment terms, bank details, thank you note..." rows={4} />
            </Field>
          </>
        )}

        {tab === "tax" && (
          <>
            <SectionDivider label="Tax Rates" />
            <div className="space-y-2">
              {form.taxRates.map((tr) => (
                <div key={tr.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-800/30 border border-gray-700/20">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-gray-200">{tr.name}</span>
                    <span className="text-[10px] text-gray-500 ml-2">{tr.rate}% ({tr.type})</span>
                  </div>
                  {tr.isDefault && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-400">Default</span>}
                  <DeleteBtn onClick={() => removeTaxRate(tr.id)} />
                </div>
              ))}
            </div>

            <SectionDivider label="Add New Tax Rate" />
            <div className="flex items-end gap-3">
              <Field label="Name"><Input value={newTax.name} onChange={(v) => setNewTax((n) => ({ ...n, name: v }))} placeholder="e.g. WHT 15%" /></Field>
              <Field label="Rate %"><Input type="number" value={newTax.rate} onChange={(v) => setNewTax((n) => ({ ...n, rate: v }))} placeholder="16" /></Field>
              <Field label="Type">
                <Select value={newTax.type} onChange={(v) => setNewTax((n) => ({ ...n, type: v as "exclusive" | "inclusive" }))} options={[{ value: "exclusive", label: "Exclusive" }, { value: "inclusive", label: "Inclusive" }]} />
              </Field>
              <Btn variant="primary" size="sm" onClick={addTaxRate} disabled={!newTax.name || !newTax.rate}>Add</Btn>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 mt-4">
              <p className="text-[10px] text-amber-400 font-medium">Zambian Tax Rates (ZRA)</p>
              <ul className="text-[9px] text-amber-400/70 mt-1 space-y-0.5">
                <li>Standard VAT: 16% (most goods & services)</li>
                <li>Zero-rated: Exports, basic foodstuffs</li>
                <li>WHT on rent: 10%</li>
                <li>WHT on services: 15%</li>
                <li>Turnover Tax: 4% (annual revenue &lt; K800,000)</li>
              </ul>
            </div>
          </>
        )}

        {tab === "invoicing" && (
          <>
            <SectionDivider label="Invoice Template" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Template Style">
                <Select value={style.template} onChange={(v) => updateInvoiceStyle({ template: v as any })} options={templateOptions} />
              </Field>
              <Field label="Accent Color">
                <div className="flex items-center gap-2">
                  <input type="color" value={style.accentColor} onChange={(e) => updateInvoiceStyle({ accentColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-gray-700" />
                  <Input value={style.accentColor} onChange={(v) => updateInvoiceStyle({ accentColor: v })} />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Font Family">
                <Select value={style.fontFamily} onChange={(v) => updateInvoiceStyle({ fontFamily: v })} options={[
                  { value: "Inter", label: "Inter (Default)" },
                  { value: "Arial", label: "Arial" },
                  { value: "Helvetica", label: "Helvetica" },
                  { value: "Times New Roman", label: "Times New Roman" },
                  { value: "Georgia", label: "Georgia" },
                ]} />
              </Field>
              <Field label="Show Logo">
                <Select value={style.showLogo ? "yes" : "no"} onChange={(v) => updateInvoiceStyle({ showLogo: v === "yes" })} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
              </Field>
            </div>

            <SectionDivider label="Numbering" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Invoice Prefix"><Input value={biz.invoicePrefix || "INV-"} onChange={(v) => updateBiz("invoicePrefix", v)} /></Field>
              <Field label="Next Invoice #"><Input type="number" value={String(biz.nextInvoiceNumber || 1)} onChange={(v) => updateBiz("nextInvoiceNumber", Number(v))} /></Field>
            </div>
          </>
        )}

        {tab === "banking" && (
          <>
            <SectionDivider label="Bank Details" />
            <p className="text-[10px] text-gray-500 -mt-3">Displayed on invoices for bank transfer payments</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bank Name"><Input value={biz.bankName || ""} onChange={(v) => updateBiz("bankName", v)} placeholder="Zambia National Commercial Bank" /></Field>
              <Field label="Account Name"><Input value={biz.bankAccountName || ""} onChange={(v) => updateBiz("bankAccountName", v)} placeholder="Your Company Ltd" /></Field>
              <Field label="Account Number"><Input value={biz.bankAccountNumber || ""} onChange={(v) => updateBiz("bankAccountNumber", v)} placeholder="0123456789" /></Field>
              <Field label="Branch / Sort Code"><Input value={biz.bankBranch || ""} onChange={(v) => updateBiz("bankBranch", v)} placeholder="Cairo Road Branch" /></Field>
              <Field label="Swift Code"><Input value={biz.bankSwift || ""} onChange={(v) => updateBiz("bankSwift", v)} placeholder="ABORZMLU" /></Field>
            </div>

            <SectionDivider label="Mobile Money" />
            <p className="text-[10px] text-gray-500 -mt-3">Accept payments via mobile money (displayed on invoices)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="MTN MoMo"><Input value={biz.mtnMomo || ""} onChange={(v) => updateBiz("mtnMomo", v)} placeholder="+260 96..." /></Field>
              <Field label="Airtel Money"><Input value={biz.airtelMoney || ""} onChange={(v) => updateBiz("airtelMoney", v)} placeholder="+260 97..." /></Field>
              <Field label="Zamtel Kwacha"><Input value={biz.zamtelKwacha || ""} onChange={(v) => updateBiz("zamtelKwacha", v)} placeholder="+260 95..." /></Field>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
