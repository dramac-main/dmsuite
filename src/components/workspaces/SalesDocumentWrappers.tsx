// =============================================================================
// DMSuite — Sales Document Workspace Wrappers
// Thin wrappers that route specific tools to the unified V2 workspace
// with pre-selected document types.
// =============================================================================

"use client";

import InvoiceDesignerWorkspaceV2 from "./InvoiceDesignerWorkspaceV2";

export function QuotationWorkspaceV2() {
  return <InvoiceDesignerWorkspaceV2 initialDocumentType="quotation" />;
}

export function ReceiptWorkspaceV2() {
  return <InvoiceDesignerWorkspaceV2 initialDocumentType="receipt" />;
}

export function DeliveryNoteWorkspaceV2() {
  return <InvoiceDesignerWorkspaceV2 initialDocumentType="delivery-note" />;
}

export function CreditNoteWorkspaceV2() {
  return <InvoiceDesignerWorkspaceV2 initialDocumentType="credit-note" />;
}

export function ProformaInvoiceWorkspaceV2() {
  return <InvoiceDesignerWorkspaceV2 initialDocumentType="proforma-invoice" />;
}

export function PurchaseOrderWorkspaceV2() {
  return <InvoiceDesignerWorkspaceV2 initialDocumentType="purchase-order" />;
}
