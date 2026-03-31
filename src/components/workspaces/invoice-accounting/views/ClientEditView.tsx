// @ts-nocheck � Scaffold: store API in progress
"use client";

import { useMemo } from "react";
import { useInvoiceAccountingEditor, type Client, type CurrencyCode, CURRENCY_CONFIG } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, BackButton, Field, Input, Textarea, Select, SectionDivider } from "../shared";

export default function ClientEditView({ id }: { id: string | null }) {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const addClient = useInvoiceAccountingEditor((s) => s.addClient);
  const updateClient = useInvoiceAccountingEditor((s) => s.updateClient);
  const removeClient = useInvoiceAccountingEditor((s) => s.removeClient);

  const client = useMemo(() => {
    if (!id) return null;
    return form.clients.find((c) => c.id === id) || null;
  }, [form.clients, id]);

  // Create new client if id is null
  const handleCreate = () => {
    const newId = addClient({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "Lusaka",
      province: "Lusaka",
      country: "Zambia",
      taxId: "",
      currency: form.business.currency,
      paymentTerms: form.business.defaultPaymentTerms,
      notes: "",
    });
    setView("client-edit", newId);
  };

  if (!id) {
    handleCreate();
    return null;
  }

  if (!client) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Client not found" actions={<Btn variant="ghost" size="sm" onClick={() => setView("clients")}>← Back</Btn>} />
      </div>
    );
  }

  const update = (data: Partial<Client>) => updateClient(client.id, data);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={client.name || "New Client"}
        actions={
          <div className="flex items-center gap-2">
            <Btn variant="danger" size="xs" onClick={() => { removeClient(client.id); setView("clients"); }}>Delete</Btn>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
          <BackButton onClick={() => setView("clients")} label="All Clients" />

          <SectionDivider title="Contact Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company / Client Name" required><Input value={client.name} onChange={(v) => update({ name: v })} placeholder="e.g. Zambia Copper Mines Ltd" /></Field>
            <Field label="Contact Person"><Input value={client.contactPerson} onChange={(v) => update({ contactPerson: v })} placeholder="Full name" /></Field>
            <Field label="Email"><Input type="email" value={client.email} onChange={(v) => update({ email: v })} placeholder="email@example.com" /></Field>
            <Field label="Phone"><Input value={client.phone} onChange={(v) => update({ phone: v })} placeholder="+260 97..." /></Field>
          </div>

          <SectionDivider title="Address" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Field label="Address"><Input value={client.address} onChange={(v) => update({ address: v })} placeholder="Street address" /></Field></div>
            <Field label="City"><Input value={client.city} onChange={(v) => update({ city: v })} /></Field>
            <Field label="Province"><Input value={client.province} onChange={(v) => update({ province: v })} /></Field>
            <Field label="Country"><Input value={client.country} onChange={(v) => update({ country: v })} /></Field>
          </div>

          <SectionDivider title="Billing" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="TPIN (Tax ID)" hint="Taxpayer Identification Number for ZRA compliance">
              <Input value={client.taxId} onChange={(v) => update({ taxId: v })} placeholder="e.g. 1234567890" />
            </Field>
            <Field label="Currency">
              <Select
                value={client.currency}
                onChange={(v) => update({ currency: v as CurrencyCode })}
                options={Object.entries(CURRENCY_CONFIG).map(([k, v]) => ({ value: k, label: `${v.symbol} ${v.name}` }))}
              />
            </Field>
            <Field label="Payment Terms (days)">
              <Input type="number" value={client.paymentTerms} onChange={(v) => update({ paymentTerms: parseInt(v) || 30 })} />
            </Field>
          </div>

          <SectionDivider title="Notes" />
          <Field label="Internal Notes"><Textarea value={client.notes} onChange={(v) => update({ notes: v })} placeholder="Notes about this client (not shown on invoices)" /></Field>
        </div>
      </div>
    </div>
  );
}
