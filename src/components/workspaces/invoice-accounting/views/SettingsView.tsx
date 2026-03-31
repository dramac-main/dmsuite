"use client";

import { useState } from "react";
import {
  useInvoiceAccountingEditor,
  CURRENCY_CONFIG,
  type CurrencyCode,
  type TaxRate,
} from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, DeleteBtn, Field, Input, Textarea, Select, SectionDivider, TabStrip } from "../shared";

const SETTING_TABS = [
  { key: "business", label: "Business" },
  { key: "tax", label: "Tax Rates" },
  { key: "invoicing", label: "Invoicing" },
  { key: "banking", label: "Banking" },
];

export default function SettingsView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const updateBusiness = useInvoiceAccountingEditor((s) => s.updateBusiness);
  const updateStyle = useInvoiceAccountingEditor((s) => s.updateStyle);
  const addTaxRate = useInvoiceAccountingEditor((s) => s.addTaxRate);
  const removeTaxRate = useInvoiceAccountingEditor((s) => s.removeTaxRate);
  const [tab, setTab] = useState("business");
  const [newTax, setNewTax] = useState({ name: "", rate: "", isDefault: false });

  const biz = form.business;
  const style = form.style;

  const updateBiz = (key: string, val: unknown) => updateBusiness({ [key]: val });

  const handleAddTax = () => {
    if (!newTax.name || !newTax.rate) return;
    addTaxRate({
      name: newTax.name,
      rate: Number(newTax.rate),
      isDefault: newTax.isDefault,
      isCompound: false,
      description: "",
    });
    setNewTax({ name: "", rate: "", isDefault: false });
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
    { value: "0", label: "Due on Receipt" },
    { value: "7", label: "Net 7" },
    { value: "15", label: "Net 15" },
    { value: "30", label: "Net 30" },
    { value: "60", label: "Net 60" },
    { value: "90", label: "Net 90" },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Settings" subtitle="Configure your invoicing & accounting" />
      <TabStrip tabs={SETTING_TABS} active={tab} onChange={setTab} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {tab === "business" && (
          <>
            <SectionDivider title="Business Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Business Name"><Input value={biz.name} onChange={(v) => updateBiz("name", v)} placeholder="Your Business Name" /></Field>
              <Field label="Email"><Input value={biz.email} onChange={(v) => updateBiz("email", v)} placeholder="billing@company.com" /></Field>
              <Field label="Phone"><Input value={biz.phone} onChange={(v) => updateBiz("phone", v)} placeholder="+260 97..." /></Field>
              <Field label="Website"><Input value={biz.website || ""} onChange={(v) => updateBiz("website", v)} placeholder="www.company.com" /></Field>
            </div>
            <Field label="Address"><Textarea value={biz.address} onChange={(v) => updateBiz("address", v)} placeholder="Street address, City, Country" rows={3} /></Field>

            <SectionDivider title="Tax Registration" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ZRA TPIN"><Input value={biz.taxId} onChange={(v) => updateBiz("taxId", v)} placeholder="1234567890" /></Field>
              <Field label="NAPSA Number"><Input value={biz.napsaNumber || ""} onChange={(v) => updateBiz("napsaNumber", v)} placeholder="NAPSA Employer Number" /></Field>
            </div>

            <SectionDivider title="Currency & Defaults" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Default Currency">
                <Select value={biz.currency} onChange={(v) => updateBiz("currency", v as CurrencyCode)} options={currencyOptions} />
              </Field>
              <Field label="Default Payment Terms (Days)">
                <Select value={String(biz.defaultPaymentTerms)} onChange={(v) => updateBiz("defaultPaymentTerms", Number(v))} options={paymentTermOptions} />
              </Field>
            </div>

            <Field label="Invoice Footer / Terms">
              <Textarea value={biz.defaultFooter || ""} onChange={(v) => updateBiz("defaultFooter", v)} placeholder="Payment terms, bank details, thank you note..." rows={4} />
            </Field>
          </>
        )}

        {tab === "tax" && (
          <>
            <SectionDivider title="Tax Rates" />
            <div className="space-y-2">
              {form.taxes.map((tr: TaxRate) => (
                <div key={tr.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-800/30 border border-gray-700/20">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-gray-200">{tr.name}</span>
                    <span className="text-[10px] text-gray-500 ml-2">{tr.rate}%</span>
                  </div>
                  {tr.isDefault && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-400">Default</span>}
                  <DeleteBtn onClick={() => removeTaxRate(tr.id)} />
                </div>
              ))}
            </div>

            <SectionDivider title="Add New Tax Rate" />
            <div className="flex items-end gap-3">
              <Field label="Name"><Input value={newTax.name} onChange={(v) => setNewTax((n) => ({ ...n, name: v }))} placeholder="e.g. WHT 15%" /></Field>
              <Field label="Rate %"><Input type="number" value={newTax.rate} onChange={(v) => setNewTax((n) => ({ ...n, rate: v }))} placeholder="16" /></Field>
              <Btn variant="primary" size="sm" onClick={handleAddTax} disabled={!newTax.name || !newTax.rate}>Add</Btn>
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
            <SectionDivider title="Invoice Template" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Template Style">
                <Select value={style.template} onChange={(v) => updateStyle({ template: v as "professional" | "modern" | "classic" | "minimal" | "bold" })} options={templateOptions} />
              </Field>
              <Field label="Accent Color">
                <div className="flex items-center gap-2">
                  <input type="color" value={style.accentColor} onChange={(e) => updateStyle({ accentColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-gray-700" />
                  <Input value={style.accentColor} onChange={(v) => updateStyle({ accentColor: v })} />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Font Family">
                <Select value={style.fontFamily} onChange={(v) => updateStyle({ fontFamily: v })} options={[
                  { value: "Inter", label: "Inter (Default)" },
                  { value: "Arial", label: "Arial" },
                  { value: "Helvetica", label: "Helvetica" },
                  { value: "Times New Roman", label: "Times New Roman" },
                  { value: "Georgia", label: "Georgia" },
                ]} />
              </Field>
              <Field label="Show Logo">
                <Select value={style.showLogo ? "yes" : "no"} onChange={(v) => updateStyle({ showLogo: v === "yes" })} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
              </Field>
            </div>

            <SectionDivider title="Numbering" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Invoice Prefix"><Input value={biz.invoicePrefix || "INV-"} onChange={(v) => updateBiz("invoicePrefix", v)} /></Field>
              <Field label="Next Invoice #"><Input type="number" value={String(biz.nextInvoiceNumber || 1)} onChange={(v) => updateBiz("nextInvoiceNumber", Number(v))} /></Field>
            </div>
          </>
        )}

        {tab === "banking" && (
          <>
            <SectionDivider title="Bank Details" />
            <p className="text-[10px] text-gray-500 -mt-3">Displayed on invoices for bank transfer payments</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bank Name"><Input value={biz.bankName || ""} onChange={(v) => updateBiz("bankName", v)} placeholder="Zambia National Commercial Bank" /></Field>
              <Field label="Account Name"><Input value={biz.bankAccountName || ""} onChange={(v) => updateBiz("bankAccountName", v)} placeholder="Your Company Ltd" /></Field>
              <Field label="Account Number"><Input value={biz.bankAccountNumber || ""} onChange={(v) => updateBiz("bankAccountNumber", v)} placeholder="0123456789" /></Field>
              <Field label="Branch / Sort Code"><Input value={biz.bankBranch || ""} onChange={(v) => updateBiz("bankBranch", v)} placeholder="Cairo Road Branch" /></Field>
              <Field label="Swift Code"><Input value={biz.bankSwiftCode || ""} onChange={(v) => updateBiz("bankSwiftCode", v)} placeholder="ABORZMLU" /></Field>
            </div>

            <SectionDivider title="Mobile Money" />
            <p className="text-[10px] text-gray-500 -mt-3">Accept payments via mobile money (displayed on invoices)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Provider"><Input value={biz.mobileMoneyProvider || ""} onChange={(v) => updateBiz("mobileMoneyProvider", v)} placeholder="e.g. MTN MoMo, Airtel Money" /></Field>
              <Field label="Account Name"><Input value={biz.mobileMoneyName || ""} onChange={(v) => updateBiz("mobileMoneyName", v)} placeholder="Account holder name" /></Field>
              <Field label="Mobile Money Number"><Input value={biz.mobileMoneyNumber || ""} onChange={(v) => updateBiz("mobileMoneyNumber", v)} placeholder="+260 96..." /></Field>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
