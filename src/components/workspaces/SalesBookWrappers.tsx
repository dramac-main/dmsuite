// =============================================================================
// DMSuite — Sales Book Workspace Wrappers
// Thin wrappers that route specific tools to the Sales Book Designer
// with pre-selected document types.
// =============================================================================

"use client";

import SalesBookDesignerWorkspace from "./sales-book-designer/SalesBookDesignerWorkspace";

/** Invoice pad / book */
export function InvoiceBookWorkspace() {
  return <SalesBookDesignerWorkspace initialDocumentType="invoice" />;
}

/** Quotation booklet */
export function QuotationBookWorkspace() {
  return <SalesBookDesignerWorkspace initialDocumentType="quotation" />;
}

/** Receipt book (3-per-page) */
export function ReceiptBookWorkspace() {
  return <SalesBookDesignerWorkspace initialDocumentType="receipt" />;
}

/** Delivery note pad */
export function DeliveryNoteBookWorkspace() {
  return <SalesBookDesignerWorkspace initialDocumentType="delivery-note" />;
}

/** Credit note pad */
export function CreditNoteBookWorkspace() {
  return <SalesBookDesignerWorkspace initialDocumentType="credit-note" />;
}

/** Proforma invoice pad */
export function ProformaBookWorkspace() {
  return <SalesBookDesignerWorkspace initialDocumentType="proforma-invoice" />;
}

/** Purchase order pad */
export function PurchaseOrderBookWorkspace() {
  return <SalesBookDesignerWorkspace initialDocumentType="purchase-order" />;
}

/** Sales Book — A4 format (generic, user picks doc type) */
export function SalesBookA4Workspace() {
  return <SalesBookDesignerWorkspace initialPageSize="a4" />;
}

/** Sales Book — A5 format (generic, user picks doc type) */
export function SalesBookA5Workspace() {
  return <SalesBookDesignerWorkspace initialPageSize="a5" />;
}
