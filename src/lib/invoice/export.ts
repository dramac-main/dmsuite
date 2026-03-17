// =============================================================================
// DMSuite — Invoice Export Utilities
// PDF (jsPDF + html2canvas), CSV, Plain Text, JSON, Clipboard, Print.
// All exports client-side — no server round-trip.
// =============================================================================

import type { InvoiceData } from "./schema";
import {
  PAGE_DIMENSIONS,
  calcLineItemTotal,
  calcLineItemDiscount,
  calcLineItemTax,
  calcInvoiceTotals,
  formatMoney,
  formatDate,
} from "./schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InvoiceExportFormat = "pdf" | "csv" | "txt" | "json" | "clipboard" | "print";

export interface InvoiceExportOptions {
  invoice: InvoiceData;
  fileName?: string;
  onProgress?: (progress: number) => void;
}

export interface InvoiceExportResult {
  success: boolean;
  format: InvoiceExportFormat;
  error?: string;
}

// ---------------------------------------------------------------------------
// Master dispatcher
// ---------------------------------------------------------------------------

export async function exportInvoice(
  format: InvoiceExportFormat,
  options: InvoiceExportOptions,
): Promise<InvoiceExportResult> {
  const fileName =
    options.fileName ??
    sanitizeFileName(
      `invoice-${options.invoice.invoiceNumber || "draft"}`
    );

  try {
    switch (format) {
      case "pdf":
        await exportPDF(options, fileName);
        break;
      case "csv":
        exportCSV(options, fileName);
        break;
      case "txt":
        exportPlainText(options, fileName);
        break;
      case "json":
        exportJSON(options, fileName);
        break;
      case "clipboard":
        await exportClipboard(options);
        break;
      case "print":
        exportPrint();
        break;
      default:
        return { success: false, format, error: `Unknown format: ${format}` };
    }
    return { success: true, format };
  } catch (err) {
    return {
      success: false,
      format,
      error: err instanceof Error ? err.message : "Export failed",
    };
  }
}

// ---------------------------------------------------------------------------
// PDF Export — jsPDF + html2canvas (per-page capture)
// ---------------------------------------------------------------------------

async function exportPDF(
  options: InvoiceExportOptions,
  fileName: string,
): Promise<void> {
  options.onProgress?.(0.1);

  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);

  options.onProgress?.(0.2);

  const format = options.invoice.metadata.pageFormat;
  const dims = PAGE_DIMENSIONS[format];

  const original = document.getElementById("invoice-preview");
  if (!original) {
    throw new Error("Invoice preview element not found. Ensure the preview is visible.");
  }

  // Off-screen clone for clean capture
  const exportContainer = document.createElement("div");
  exportContainer.style.cssText =
    "position:fixed;left:-9999px;top:0;z-index:-9999;pointer-events:none;";
  document.body.appendChild(exportContainer);

  const clone = original.cloneNode(true) as HTMLElement;
  // Remove measurement container
  const measure = clone.querySelector("[data-measure-container]");
  if (measure) measure.remove();
  // Clean up page wrappers
  clone.querySelectorAll("[data-invoice-page]").forEach((page) => {
    const wrapper = page.parentElement;
    if (wrapper) {
      Array.from(wrapper.children).forEach((child) => {
        if (child !== page && child.tagName === "DIV") child.remove();
      });
    }
  });
  exportContainer.appendChild(clone);

  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => setTimeout(r, 100));

  options.onProgress?.(0.4);

  const pageElements = clone.querySelectorAll("[data-invoice-page]");
  if (pageElements.length === 0) {
    document.body.removeChild(exportContainer);
    throw new Error("No invoice pages found for export.");
  }

  pageElements.forEach((pageEl) => {
    const el = pageEl as HTMLElement;
    el.style.width = `${dims.w}px`;
    el.style.height = `${dims.h}px`;
    el.style.maxHeight = `${dims.h}px`;
    el.style.overflow = "hidden";
    el.style.boxShadow = "none";
    el.style.borderRadius = "0";
    el.className = el.className.replace(/ring-\S+/g, "").replace(/shadow-\S+/g, "");
    const wrapper = el.parentElement;
    if (wrapper) wrapper.style.margin = "0";
  });

  const isLandscape = dims.w > dims.h;
  const orientation = isLandscape ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [dims.w, dims.h],
    hotfixes: ["px_scaling"],
  });

  for (let i = 0; i < pageElements.length; i++) {
    if (i > 0) pdf.addPage([dims.w, dims.h], orientation);

    const pageEl = pageElements[i] as HTMLElement;
    const computedBg = window.getComputedStyle(pageEl).backgroundColor;
    const exportBgColor =
      computedBg && computedBg !== "rgba(0, 0, 0, 0)" && computedBg !== "transparent"
        ? computedBg
        : "#ffffff";

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: exportBgColor,
      width: dims.w,
      height: dims.h,
      onclone: (_doc, clonedEl) => {
        clonedEl.querySelectorAll("*").forEach((el) => {
          const htmlEl = el as HTMLElement;
          const cs = window.getComputedStyle(htmlEl);
          if (cs.fontFamily) htmlEl.style.fontFamily = cs.fontFamily;
          if (cs.fontSize) htmlEl.style.fontSize = cs.fontSize;
          if (cs.lineHeight) htmlEl.style.lineHeight = cs.lineHeight;
          if (cs.letterSpacing && cs.letterSpacing !== "normal") {
            htmlEl.style.letterSpacing = cs.letterSpacing;
          }
        });
      },
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", 0, 0, dims.w, dims.h);
    options.onProgress?.(0.4 + 0.5 * ((i + 1) / pageElements.length));
  }

  document.body.removeChild(exportContainer);

  const inv = options.invoice;
  pdf.setProperties({
    title: `Invoice ${inv.invoiceNumber} — ${inv.clientInfo.name || inv.clientInfo.company || "Client"}`,
    creator: "DMSuite Invoice Designer",
    subject: "Invoice",
  });

  pdf.save(`${fileName}.pdf`);
  options.onProgress?.(1.0);
}

// ---------------------------------------------------------------------------
// CSV Export — line items as spreadsheet
// ---------------------------------------------------------------------------

function exportCSV(options: InvoiceExportOptions, fileName: string): void {
  const inv = options.invoice;
  const cur = inv.currency;
  const totals = calcInvoiceTotals(inv);

  const rows: string[][] = [];

  // Header row
  rows.push([
    "#",
    "Description",
    "Quantity",
    "Unit Price",
    "Discount",
    "Tax",
    "Amount",
  ]);

  // Line items
  inv.lineItems.forEach((item, idx) => {
    const lineTotal = calcLineItemTotal(item);
    const lineDsc = calcLineItemDiscount(item);
    const lineTax = calcLineItemTax(item);
    rows.push([
      String(idx + 1),
      item.description,
      String(item.quantity),
      formatMoney(item.unitPrice, cur),
      lineDsc > 0
        ? item.discountType === "percent"
          ? `${item.discountValue}%`
          : formatMoney(lineDsc, cur)
        : "",
      item.taxRate > 0 ? `${item.taxRate}%` : "",
      formatMoney(lineTotal + lineTax, cur),
    ]);
  });

  // Empty separator
  rows.push([]);

  // Totals
  rows.push(["", "", "", "", "", "Subtotal", formatMoney(totals.subtotal, cur)]);
  if (totals.totalDiscount > 0) {
    rows.push(["", "", "", "", "", "Discount", `-${formatMoney(totals.totalDiscount, cur)}`]);
  }
  if (totals.totalTax > 0) {
    rows.push(["", "", "", "", "", `Tax`, formatMoney(totals.totalTax, cur)]);
  }
  rows.push(["", "", "", "", "", "TOTAL", formatMoney(totals.grandTotal, cur)]);

  // Metadata
  rows.push([]);
  rows.push(["Invoice #", inv.invoiceNumber]);
  rows.push(["Issue Date", formatDate(inv.issueDate)]);
  rows.push(["Due Date", formatDate(inv.dueDate)]);
  rows.push(["Client", inv.clientInfo.name || inv.clientInfo.company || ""]);
  rows.push(["Status", inv.status]);

  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `${fileName}.csv`);
  options.onProgress?.(1.0);
}

// ---------------------------------------------------------------------------
// Plain Text Export
// ---------------------------------------------------------------------------

function exportPlainText(options: InvoiceExportOptions, fileName: string): void {
  const text = buildPlainText(options.invoice);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${fileName}.txt`);
  options.onProgress?.(1.0);
}

export function buildPlainText(invoice: InvoiceData): string {
  const lines: string[] = [];
  const cur = invoice.currency;
  const totals = calcInvoiceTotals(invoice);

  lines.push("INVOICE");
  lines.push(sep());
  lines.push("");

  // Business info
  if (invoice.businessInfo.name) {
    lines.push(`From: ${invoice.businessInfo.name}`);
    if (invoice.businessInfo.address) lines.push(invoice.businessInfo.address);
    if (invoice.businessInfo.email) lines.push(invoice.businessInfo.email);
    if (invoice.businessInfo.phone) lines.push(invoice.businessInfo.phone);
    lines.push("");
  }

  // Client info
  if (invoice.clientInfo.name || invoice.clientInfo.company) {
    lines.push(`Bill To: ${invoice.clientInfo.name || invoice.clientInfo.company}`);
    if (invoice.clientInfo.company && invoice.clientInfo.name) {
      lines.push(invoice.clientInfo.company);
    }
    if (invoice.clientInfo.address) lines.push(invoice.clientInfo.address);
    if (invoice.clientInfo.email) lines.push(invoice.clientInfo.email);
    lines.push("");
  }

  // Invoice details
  lines.push(`Invoice #:   ${invoice.invoiceNumber}`);
  lines.push(`Issue Date:  ${formatDate(invoice.issueDate)}`);
  lines.push(`Due Date:    ${formatDate(invoice.dueDate)}`);
  if (invoice.poNumber) lines.push(`P.O. #:      ${invoice.poNumber}`);
  lines.push(`Status:      ${invoice.status.toUpperCase()}`);
  lines.push("");

  // Line items
  lines.push(sep());
  lines.push(
    padR("#", 4) +
    padR("Description", 30) +
    padR("Qty", 6) +
    padR("Price", 12) +
    padR("Amount", 14)
  );
  lines.push(sep());

  invoice.lineItems.forEach((item, idx) => {
    const total = calcLineItemTotal(item) + calcLineItemTax(item);
    lines.push(
      padR(String(idx + 1), 4) +
      padR(item.description.slice(0, 28), 30) +
      padR(String(item.quantity), 6) +
      padR(formatMoney(item.unitPrice, cur), 12) +
      padR(formatMoney(total, cur), 14)
    );
  });

  lines.push(sep());
  lines.push(`${"".padEnd(40)}Subtotal: ${formatMoney(totals.subtotal, cur)}`);
  if (totals.totalDiscount > 0) {
    lines.push(`${"".padEnd(40)}Discount: -${formatMoney(totals.totalDiscount, cur)}`);
  }
  if (totals.totalTax > 0) {
    lines.push(`${"".padEnd(40)}Tax:      ${formatMoney(totals.totalTax, cur)}`);
  }
  lines.push(`${"".padEnd(40)}TOTAL:    ${formatMoney(totals.grandTotal, cur)}`);
  lines.push("");

  // Notes & Terms
  if (invoice.notes) {
    lines.push("NOTES");
    lines.push(sep());
    lines.push(invoice.notes);
    lines.push("");
  }

  if (invoice.terms) {
    lines.push("TERMS & CONDITIONS");
    lines.push(sep());
    lines.push(invoice.terms);
    lines.push("");
  }

  // Payment info
  if (
    invoice.paymentInfo.bankName ||
    invoice.paymentInfo.accountNumber ||
    invoice.paymentInfo.paypalEmail
  ) {
    lines.push("PAYMENT INFORMATION");
    lines.push(sep());
    if (invoice.paymentInfo.bankName) lines.push(`Bank: ${invoice.paymentInfo.bankName}`);
    if (invoice.paymentInfo.accountName) lines.push(`Account: ${invoice.paymentInfo.accountName}`);
    if (invoice.paymentInfo.accountNumber) lines.push(`Account #: ${invoice.paymentInfo.accountNumber}`);
    if (invoice.paymentInfo.routingNumber) lines.push(`Routing #: ${invoice.paymentInfo.routingNumber}`);
    if (invoice.paymentInfo.swiftCode) lines.push(`SWIFT: ${invoice.paymentInfo.swiftCode}`);
    if (invoice.paymentInfo.paypalEmail) lines.push(`PayPal: ${invoice.paymentInfo.paypalEmail}`);
  }

  return lines.join("\n").trim();
}

// ---------------------------------------------------------------------------
// JSON Export
// ---------------------------------------------------------------------------

function exportJSON(options: InvoiceExportOptions, fileName: string): void {
  const json = JSON.stringify(options.invoice, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `${fileName}.json`);
  options.onProgress?.(1.0);
}

// ---------------------------------------------------------------------------
// Clipboard Export
// ---------------------------------------------------------------------------

async function exportClipboard(options: InvoiceExportOptions): Promise<void> {
  const text = buildPlainText(options.invoice);

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  options.onProgress?.(1.0);
}

// ---------------------------------------------------------------------------
// Print
// ---------------------------------------------------------------------------

function exportPrint(): void {
  window.print();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60) || "invoice";
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function sep(): string {
  return "─".repeat(66);
}

function padR(s: string, len: number): string {
  return s.padEnd(len);
}
