"use client";

// =============================================================================
// Invoice & Accounting Hub — Print-Ready Invoice Renderer
// Generates a full HTML document for printing via printHTML()
// Supports 5 templates: professional, modern, classic, minimal, bold
// Includes ZRA VAT compliance fields, bank details, mobile money
// =============================================================================

import {
  type Invoice,
  type Quote,
  type CreditNote,
  type PurchaseOrder,
  type InvoiceAccountingForm,
  type InvoiceTemplate,
  type LineItem,
  calculateLineItemAmount,
  calculateInvoiceTotals,
  formatCurrency,
  CURRENCY_CONFIG,
} from "@/stores/invoice-accounting-editor";

// ── Helpers ─────────────────────────────────────────────────────────────────

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(d: string): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-ZM", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
}

function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.45 ? "#1a1a1a" : "#ffffff";
}

function lightenColor(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ── Build Complete Invoice HTML ─────────────────────────────────────────────

export function buildInvoicePrintHTML(form: InvoiceAccountingForm, invoiceId: string): string {
  const inv = form.invoices.find((i) => i.id === invoiceId);
  if (!inv) return "<html><body><p>Invoice not found</p></body></html>";

  const client = form.clients.find((c) => c.id === inv.clientId);
  const totals = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
  const paidAmount = form.payments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0);
  const balance = totals.total - paidAmount;

  return buildDocumentHTML({
    form,
    docType: "INVOICE",
    number: inv.number,
    date: inv.date,
    dueDate: inv.dueDate,
    clientName: client?.name || "",
    clientAddress: buildClientAddress(client),
    clientTaxId: client?.taxId || "",
    lineItems: inv.lineItems,
    taxMode: inv.taxMode,
    discount: inv.discount,
    totals,
    paidAmount,
    balance,
    notes: inv.notes,
    terms: inv.terms,
    footer: inv.footer,
    currency: inv.currency,
    status: inv.status,
    poNumber: inv.poNumber,
  });
}

export function buildQuotePrintHTML(form: InvoiceAccountingForm, quoteId: string): string {
  const q = form.quotes.find((q) => q.id === quoteId);
  if (!q) return "<html><body><p>Quote not found</p></body></html>";

  const client = form.clients.find((c) => c.id === q.clientId);
  const totals = calculateInvoiceTotals(q.lineItems, q.taxMode, q.discount);

  return buildDocumentHTML({
    form,
    docType: "QUOTATION",
    number: q.number,
    date: q.date,
    dueDate: q.validUntil,
    dueDateLabel: "Valid Until",
    clientName: client?.name || "",
    clientAddress: buildClientAddress(client),
    clientTaxId: client?.taxId || "",
    lineItems: q.lineItems,
    taxMode: q.taxMode,
    discount: q.discount,
    totals,
    paidAmount: 0,
    balance: totals.total,
    notes: q.notes,
    terms: q.terms,
    footer: q.footer,
    currency: q.currency,
    status: q.status,
  });
}

export function buildCreditNotePrintHTML(form: InvoiceAccountingForm, cnId: string): string {
  const cn = form.creditNotes.find((c) => c.id === cnId);
  if (!cn) return "<html><body><p>Credit note not found</p></body></html>";

  const client = form.clients.find((c) => c.id === cn.clientId);
  const totals = calculateInvoiceTotals(cn.lineItems, form.business.taxMode, { type: "fixed", value: 0 });

  return buildDocumentHTML({
    form,
    docType: "CREDIT NOTE",
    number: cn.number,
    date: cn.date,
    clientName: client?.name || "",
    clientAddress: buildClientAddress(client),
    clientTaxId: client?.taxId || "",
    lineItems: cn.lineItems,
    taxMode: form.business.taxMode,
    discount: { type: "fixed", value: 0 },
    totals,
    paidAmount: 0,
    balance: totals.total,
    notes: cn.reason,
    terms: "",
    footer: "",
    currency: form.business.currency,
    status: cn.status,
  });
}

export function buildPurchaseOrderPrintHTML(form: InvoiceAccountingForm, poId: string): string {
  const po = form.purchaseOrders.find((p) => p.id === poId);
  if (!po) return "<html><body><p>Purchase order not found</p></body></html>";

  const vendor = form.vendors.find((v) => v.id === po.vendorId);
  const totals = calculateInvoiceTotals(po.lineItems, po.taxMode, po.discount);

  return buildDocumentHTML({
    form,
    docType: "PURCHASE ORDER",
    number: po.number,
    date: po.date,
    dueDate: po.expectedDate,
    dueDateLabel: "Expected Delivery",
    clientName: vendor?.name || "",
    clientAddress: [vendor?.address, vendor?.city, vendor?.country].filter(Boolean).join(", "),
    clientTaxId: vendor?.taxId || "",
    clientLabel: "Vendor",
    lineItems: po.lineItems,
    taxMode: po.taxMode,
    discount: po.discount,
    totals,
    paidAmount: 0,
    balance: totals.total,
    notes: po.notes,
    terms: po.terms,
    footer: "",
    currency: po.currency,
    status: po.status,
  });
}

// ── Build Client Address ────────────────────────────────────────────────────

function buildClientAddress(client: any): string {
  if (!client) return "";
  return [client.address, client.city, client.province, client.country].filter(Boolean).join(", ");
}

// ── Master Document Builder ─────────────────────────────────────────────────

interface DocConfig {
  form: InvoiceAccountingForm;
  docType: string;
  number: string;
  date: string;
  dueDate?: string;
  dueDateLabel?: string;
  clientName: string;
  clientAddress: string;
  clientTaxId: string;
  clientLabel?: string;
  lineItems: LineItem[];
  taxMode: "inclusive" | "exclusive";
  discount: { type: "percent" | "fixed"; value: number };
  totals: ReturnType<typeof calculateInvoiceTotals>;
  paidAmount: number;
  balance: number;
  notes: string;
  terms: string;
  footer: string;
  currency: string;
  status: string;
  poNumber?: string;
}

function buildDocumentHTML(cfg: DocConfig): string {
  const { form, docType, number } = cfg;
  const biz = form.business;
  const style = form.style;
  const accent = style.accentColor;
  const contrastOnAccent = contrastText(accent);
  const font = style.fontFamily || "Inter";
  const template = style.template;

  const lineRows = cfg.lineItems.map((li) => {
    const calc = calculateLineItemAmount(li, cfg.taxMode);
    return {
      description: li.description,
      qty: li.quantity,
      price: formatCurrency(li.unitPrice, cfg.currency as any),
      taxName: li.taxName || "",
      taxRate: li.taxRate,
      discount: li.discount,
      subtotal: formatCurrency(calc.subtotal, cfg.currency as any),
      total: formatCurrency(calc.total, cfg.currency as any),
    };
  });

  const lineItemsHTML = lineRows.map((r, i) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 12px;text-align:left;font-size:12px;color:#374151;">${esc(r.description)}</td>
      <td style="padding:10px 12px;text-align:center;font-size:12px;color:#374151;">${r.qty}</td>
      <td style="padding:10px 12px;text-align:right;font-size:12px;color:#374151;">${r.price}</td>
      ${r.discount > 0 ? `<td style="padding:10px 12px;text-align:center;font-size:12px;color:#374151;">${r.discount}%</td>` : `<td style="padding:10px 12px;text-align:center;font-size:12px;color:#9ca3af;">—</td>`}
      <td style="padding:10px 12px;text-align:center;font-size:11px;color:#6b7280;">${r.taxName}${r.taxRate ? ` (${r.taxRate}%)` : ""}</td>
      <td style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#111827;">${r.total}</td>
    </tr>
  `).join("");

  const fc = (n: number) => formatCurrency(n, cfg.currency as any);

  // Payment info section
  const paymentInfoHTML = style.showPaymentInfo ? `
    <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;margin-bottom:10px;">Payment Information</div>
      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        ${biz.bankName ? `
          <div style="flex:1;min-width:200px;">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:2px;">Bank Transfer</div>
            <div style="font-size:11px;color:#374151;line-height:1.5;">
              <strong>${esc(biz.bankName)}</strong><br>
              ${biz.bankAccountName ? `Account: ${esc(biz.bankAccountName)}<br>` : ""}
              ${biz.bankAccountNumber ? `No: ${esc(biz.bankAccountNumber)}<br>` : ""}
              ${biz.bankBranch ? `Branch: ${esc(biz.bankBranch)}<br>` : ""}
              ${biz.bankSwiftCode ? `SWIFT: ${esc(biz.bankSwiftCode)}` : ""}
            </div>
          </div>
        ` : ""}
        ${biz.mobileMoneyNumber ? `
          <div style="flex:1;min-width:200px;">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:2px;">Mobile Money</div>
            <div style="font-size:11px;color:#374151;line-height:1.5;">
              <strong>${esc(biz.mobileMoneyProvider || "Mobile Money")}</strong><br>
              ${esc(biz.mobileMoneyName || biz.name)}<br>
              ${esc(biz.mobileMoneyNumber)}
            </div>
          </div>
        ` : ""}
      </div>
    </div>
  ` : "";

  // Signature line
  const signatureHTML = style.showSignatureLine ? `
    <div style="margin-top:48px;display:flex;justify-content:space-between;gap:48px;">
      <div style="flex:1;">
        <div style="border-top:1px solid #d1d5db;padding-top:8px;margin-top:40px;">
          <div style="font-size:10px;color:#9ca3af;">Authorized Signature</div>
        </div>
      </div>
      <div style="flex:1;">
        <div style="border-top:1px solid #d1d5db;padding-top:8px;margin-top:40px;">
          <div style="font-size:10px;color:#9ca3af;">Date</div>
        </div>
      </div>
    </div>
  ` : "";

  // Watermark
  const watermarkHTML = style.showWatermark && style.watermarkText && cfg.status === "draft" ? `
    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:100px;font-weight:900;color:rgba(0,0,0,0.04);pointer-events:none;z-index:0;white-space:nowrap;">
      ${esc(style.watermarkText)}
    </div>
  ` : "";

  // Template-specific header/footer styles
  const templates: Record<InvoiceTemplate, { headerStyle: string; tableHeaderStyle: string; bodyStyle: string }> = {
    professional: {
      headerStyle: `background:${accent};color:${contrastOnAccent};padding:32px;border-radius:0;`,
      tableHeaderStyle: `background:${accent};color:${contrastOnAccent};`,
      bodyStyle: "background:#fff;",
    },
    modern: {
      headerStyle: `background:#fff;color:#111827;padding:32px;border-bottom:4px solid ${accent};`,
      tableHeaderStyle: `background:#f3f4f6;color:#374151;`,
      bodyStyle: "background:#fff;",
    },
    classic: {
      headerStyle: `background:#fff;color:#1a1a1a;padding:32px;border-bottom:2px solid #1a1a1a;`,
      tableHeaderStyle: `background:#f9fafb;color:#111827;border-bottom:2px solid #111827;`,
      bodyStyle: "background:#fff;",
    },
    minimal: {
      headerStyle: `background:#fff;color:#374151;padding:32px 32px 16px;`,
      tableHeaderStyle: `color:#9ca3af;border-bottom:1px solid #e5e7eb;`,
      bodyStyle: "background:#fff;",
    },
    bold: {
      headerStyle: `background:${accent};color:${contrastOnAccent};padding:40px;`,
      tableHeaderStyle: `background:#111827;color:#fff;`,
      bodyStyle: `background:#fff;`,
    },
  };

  const tpl = templates[template] || templates.professional;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(docType)} ${esc(number)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'${font}',system-ui,sans-serif; color:#374151; line-height:1.5; ${tpl.bodyStyle} }
  @page { size:A4; margin:0; }
  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
  table { border-collapse:collapse; width:100%; }
</style>
</head>
<body>
${watermarkHTML}
<div style="max-width:794px;margin:0 auto;position:relative;">

  <!-- HEADER -->
  <div style="${tpl.headerStyle}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:${template === "bold" ? "28px" : "22px"};font-weight:800;letter-spacing:-0.02em;">${esc(biz.name || "Your Business")}</div>
        <div style="font-size:11px;opacity:0.8;margin-top:4px;line-height:1.6;">
          ${biz.address ? esc(biz.address) + "<br>" : ""}
          ${[biz.city, biz.province, biz.country].filter(Boolean).map(esc).join(", ")}
          ${biz.phone ? "<br>" + esc(biz.phone) : ""}
          ${biz.email ? "<br>" + esc(biz.email) : ""}
          ${biz.website ? "<br>" + esc(biz.website) : ""}
        </div>
        ${biz.taxId ? `<div style="font-size:10px;margin-top:6px;opacity:0.7;">TPIN: ${esc(biz.taxId)}</div>` : ""}
        ${biz.napsaNumber ? `<div style="font-size:10px;opacity:0.7;">NAPSA: ${esc(biz.napsaNumber)}</div>` : ""}
      </div>
      <div style="text-align:right;">
        <div style="font-size:${template === "bold" ? "32px" : "24px"};font-weight:900;letter-spacing:0.05em;opacity:0.9;">${esc(docType)}</div>
        <div style="font-size:14px;font-weight:600;margin-top:4px;">${esc(number)}</div>
      </div>
    </div>
  </div>

  <!-- DETAILS -->
  <div style="padding:24px 32px;display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;">
    <div style="flex:1;min-width:200px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin-bottom:6px;">${esc(cfg.clientLabel || "Bill To")}</div>
      <div style="font-size:13px;font-weight:700;color:#111827;">${esc(cfg.clientName)}</div>
      ${cfg.clientAddress ? `<div style="font-size:11px;color:#6b7280;margin-top:2px;">${esc(cfg.clientAddress)}</div>` : ""}
      ${cfg.clientTaxId ? `<div style="font-size:10px;color:#9ca3af;margin-top:4px;">TPIN: ${esc(cfg.clientTaxId)}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#6b7280;">
        <strong>Date:</strong> ${fmtDate(cfg.date)}<br>
        ${cfg.dueDate ? `<strong>${esc(cfg.dueDateLabel || "Due Date")}:</strong> ${fmtDate(cfg.dueDate)}<br>` : ""}
        ${cfg.poNumber ? `<strong>PO #:</strong> ${esc(cfg.poNumber)}<br>` : ""}
      </div>
      ${cfg.status === "paid" ? `<div style="margin-top:8px;display:inline-block;padding:4px 12px;background:#10b981;color:#fff;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;">PAID</div>` : ""}
      ${cfg.status === "overdue" ? `<div style="margin-top:8px;display:inline-block;padding:4px 12px;background:#ef4444;color:#fff;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;">OVERDUE</div>` : ""}
    </div>
  </div>

  <!-- LINE ITEMS TABLE -->
  <div style="padding:0 32px;">
    <table>
      <thead>
        <tr style="${tpl.tableHeaderStyle}">
          <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Description</th>
          <th style="padding:10px 12px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;width:60px;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;width:90px;">Unit Price</th>
          <th style="padding:10px 12px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;width:60px;">Disc.</th>
          <th style="padding:10px 12px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;width:100px;">Tax</th>
          <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;width:100px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHTML}
      </tbody>
    </table>
  </div>

  <!-- TOTALS -->
  <div style="padding:16px 32px;display:flex;justify-content:flex-end;">
    <div style="width:280px;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;">
        <span style="color:#6b7280;">Subtotal</span>
        <span style="color:#374151;">${fc(cfg.totals.subtotal)}</span>
      </div>
      ${cfg.totals.discountAmount > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;">
          <span style="color:#6b7280;">Discount</span>
          <span style="color:#ef4444;">-${fc(cfg.totals.discountAmount)}</span>
        </div>
      ` : ""}
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;">
        <span style="color:#6b7280;">Tax (${cfg.taxMode === "inclusive" ? "incl." : "excl."})</span>
        <span style="color:#374151;">${fc(cfg.totals.taxTotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:16px;font-weight:800;border-top:2px solid ${accent};margin-top:4px;">
        <span style="color:#111827;">Total</span>
        <span style="color:${accent};">${fc(cfg.totals.total)}</span>
      </div>
      ${cfg.paidAmount > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;">
          <span style="color:#6b7280;">Amount Paid</span>
          <span style="color:#10b981;">-${fc(cfg.paidAmount)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:700;border-top:1px solid #e5e7eb;">
          <span style="color:#111827;">Balance Due</span>
          <span style="color:${cfg.balance > 0 ? "#ef4444" : "#10b981"};">${fc(cfg.balance)}</span>
        </div>
      ` : ""}
    </div>
  </div>

  <!-- NOTES & TERMS -->
  ${cfg.notes ? `
    <div style="padding:0 32px;margin-top:16px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin-bottom:4px;">Notes</div>
      <div style="font-size:11px;color:#6b7280;white-space:pre-wrap;">${esc(cfg.notes)}</div>
    </div>
  ` : ""}
  ${cfg.terms ? `
    <div style="padding:0 32px;margin-top:12px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin-bottom:4px;">Terms & Conditions</div>
      <div style="font-size:10px;color:#9ca3af;white-space:pre-wrap;">${esc(cfg.terms)}</div>
    </div>
  ` : ""}

  <!-- PAYMENT INFO -->
  <div style="padding:0 32px;">${paymentInfoHTML}</div>

  <!-- SIGNATURE -->
  <div style="padding:0 32px;">${signatureHTML}</div>

  <!-- FOOTER -->
  ${cfg.footer || form.business.defaultFooter ? `
    <div style="padding:24px 32px;margin-top:32px;border-top:1px solid #e5e7eb;text-align:center;">
      <div style="font-size:10px;color:#9ca3af;">${esc(cfg.footer || form.business.defaultFooter)}</div>
    </div>
  ` : ""}

</div>
</body>
</html>`;
}
