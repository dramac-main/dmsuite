
"use client";

import { useMemo } from "react";
import { useInvoiceAccountingEditor, type Vendor } from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, BackButton, Field, Input, Textarea, SectionDivider } from "../shared";

export default function VendorEditView({ id }: { id: string | null }) {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const addVendor = useInvoiceAccountingEditor((s) => s.addVendor);
  const updateVendor = useInvoiceAccountingEditor((s) => s.updateVendor);
  const removeVendor = useInvoiceAccountingEditor((s) => s.removeVendor);

  const vendor = useMemo(() => {
    if (!id) return null;
    return form.vendors.find((v) => v.id === id) || null;
  }, [form.vendors, id]);

  if (!id) {
    const newId = addVendor({ name: "", contactPerson: "", email: "", phone: "", address: "", city: "Lusaka", country: "Zambia", taxId: "", notes: "" });
    setView("vendor-edit", newId);
    return null;
  }

  if (!vendor) return <div className="flex flex-col h-full"><PageHeader title="Vendor not found" actions={<Btn variant="ghost" size="sm" onClick={() => setView("vendors")}>← Back</Btn>} /></div>;

  const update = (data: Partial<Vendor>) => updateVendor(vendor.id, data);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={vendor.name || "New Vendor"} actions={<Btn variant="danger" size="xs" onClick={() => { removeVendor(vendor.id); setView("vendors"); }}>Delete</Btn>} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
          <BackButton onClick={() => setView("vendors")} label="All Vendors" />
          <SectionDivider title="Vendor Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vendor Name" required><Input value={vendor.name} onChange={(v) => update({ name: v })} placeholder="Company name" /></Field>
            <Field label="Contact Person"><Input value={vendor.contactPerson} onChange={(v) => update({ contactPerson: v })} /></Field>
            <Field label="Email"><Input type="email" value={vendor.email} onChange={(v) => update({ email: v })} /></Field>
            <Field label="Phone"><Input value={vendor.phone} onChange={(v) => update({ phone: v })} placeholder="+260 97..." /></Field>
            <Field label="Address"><Input value={vendor.address} onChange={(v) => update({ address: v })} /></Field>
            <Field label="City"><Input value={vendor.city} onChange={(v) => update({ city: v })} /></Field>
            <Field label="Country"><Input value={vendor.country} onChange={(v) => update({ country: v })} /></Field>
            <Field label="TPIN"><Input value={vendor.taxId} onChange={(v) => update({ taxId: v })} placeholder="Vendor TPIN" /></Field>
          </div>
          <Field label="Notes"><Textarea value={vendor.notes} onChange={(v) => update({ notes: v })} /></Field>
        </div>
      </div>
    </div>
  );
}
