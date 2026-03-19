// =============================================================================
// DMSuite — Universal Invoice Template Renderer
// Renders ALL 10 invoice templates as pure HTML/CSS React components.
// CSS injected from src/data/invoice-template-css.ts via scoped <style> tags.
// Mirrors the Resume UniversalTemplate.tsx pattern exactly.
// =============================================================================

"use client";

import React, { useMemo } from "react";
import type { InvoiceData } from "@/lib/invoice/schema";
import {
  calcLineItemTotal,
  calcLineItemDiscount,
  calcLineItemTax,
  calcInvoiceTotals,
  formatMoney,
  formatDate,
  computeCSSVariables,
  getDocumentTypeConfig,
} from "@/lib/invoice/schema";
import { INVOICE_TEMPLATE_CSS } from "@/data/invoice-template-css";
import { getInvoiceTemplate } from "./template-defs";
import { CustomBlocksRegion } from "@/lib/sales-book/CustomBlockRenderer";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InvoiceTemplateProps {
  invoice: InvoiceData;
}

// ---------------------------------------------------------------------------
// Shared Helpers
// ---------------------------------------------------------------------------

function statusLabel(s: string): string {
  return { draft: "Draft", sent: "Sent", paid: "Paid", overdue: "Overdue", cancelled: "Cancelled" }[s] ?? s;
}

function nl(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < text.split("\n").length - 1 && <br />}
    </React.Fragment>
  ));
}

/** Get the document type title (e.g. "Invoice", "Quotation", "Receipt") */
function docTitle(invoice: InvoiceData): string {
  return getDocumentTypeConfig(invoice.documentType ?? "invoice").title;
}

// ---------------------------------------------------------------------------
// Shared Table Component (used by all templates)
// ---------------------------------------------------------------------------

function InvoiceTable({ invoice }: { invoice: InvoiceData }) {
  const cur = invoice.currency;
  const items = invoice.lineItems;
  const hasDiscount = items.some((i) => i.discountValue > 0);
  const hasItemTax = items.some((i) => i.taxRate > 0);
  const tableStyle = invoice.metadata.tableStyle || "striped";

  return (
    <table className="inv-table" data-table-style={tableStyle}>
      <thead>
        <tr>
          <th style={{ width: "5%" }}>#</th>
          <th>Description</th>
          <th className="text-center" style={{ width: "8%" }}>Qty</th>
          <th className="text-right" style={{ width: "14%" }}>Unit Price</th>
          {hasDiscount && <th className="text-right" style={{ width: "12%" }}>Discount</th>}
          {hasItemTax && <th className="text-right" style={{ width: "10%" }}>Tax</th>}
          <th className="text-right" style={{ width: "15%" }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => {
          const lineTotal = calcLineItemTotal(item);
          const lineDiscount = calcLineItemDiscount(item);
          const lineTax = calcLineItemTax(item);
          return (
            <tr key={item.id}>
              <td>{idx + 1}</td>
              <td className="item-desc">{item.description || "—"}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">{formatMoney(item.unitPrice, cur)}</td>
              {hasDiscount && (
                <td className="text-right">
                  {lineDiscount > 0
                    ? item.discountType === "percent"
                      ? `${item.discountValue}%`
                      : formatMoney(lineDiscount, cur)
                    : "—"}
                </td>
              )}
              {hasItemTax && (
                <td className="text-right">
                  {item.taxRate > 0 ? `${item.taxRate}%` : "—"}
                </td>
              )}
              <td className="text-right">{formatMoney(lineTotal + lineTax, cur)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Shared Totals Component
// ---------------------------------------------------------------------------

function InvoiceTotals({ invoice }: { invoice: InvoiceData }) {
  const cur = invoice.currency;
  const { subtotal, totalDiscount, totalTax, additionalChargesTotal, grandTotal } =
    calcInvoiceTotals(invoice);
  const meta = invoice.metadata;
  const dtConfig = getDocumentTypeConfig(invoice.documentType ?? "invoice");

  return (
    <div className="inv-totals">
      <div className="inv-totals-row">
        <span>Subtotal</span>
        <span className="amount">{formatMoney(subtotal, cur)}</span>
      </div>
      {totalDiscount > 0 && (
        <div className="inv-totals-row">
          <span>Discount</span>
          <span className="amount">−{formatMoney(totalDiscount, cur)}</span>
        </div>
      )}
      {meta.showTaxBreakdown && totalTax > 0 && (
        <div className="inv-totals-row">
          <span>
            {invoice.tax.label || "Tax"}
            {invoice.tax.rate > 0 && ` (${invoice.tax.rate}%)`}
            {invoice.tax.isInclusive && " (incl.)"}
          </span>
          <span className="amount">{formatMoney(totalTax, cur)}</span>
        </div>
      )}
      {invoice.tax.secondaryRate > 0 && invoice.tax.secondaryLabel && (
        <div className="inv-totals-row">
          <span>{invoice.tax.secondaryLabel} ({invoice.tax.secondaryRate}%)</span>
          <span className="amount">
            {formatMoney(subtotal * (invoice.tax.secondaryRate / 100), cur)}
          </span>
        </div>
      )}
      {invoice.additionalCharges.map((c) => {
        const amt = c.type === "percent" ? subtotal * (c.amount / 100) : c.amount;
        return (
          <div className="inv-totals-row" key={c.id}>
            <span>{c.label || "Charge"}{c.type === "percent" && ` (${c.amount}%)`}</span>
            <span className="amount">{formatMoney(amt, cur)}</span>
          </div>
        );
      })}
      <div className="inv-totals-row grand-total">
        <span>{dtConfig.amountLabel}</span>
        <span className="amount">{formatMoney(grandTotal, cur)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared Footer
// ---------------------------------------------------------------------------

function InvoiceFooter({ invoice }: { invoice: InvoiceData }) {
  const meta = invoice.metadata;
  const hasPayment = meta.showPaymentInfo && (
    invoice.paymentInfo.bankName ||
    invoice.paymentInfo.accountNumber ||
    invoice.paymentInfo.paypalEmail
  );
  const hasNotes = meta.showNotes && invoice.notes;
  const hasTerms = invoice.terms;

  if (!hasPayment && !hasNotes && !hasTerms) return null;

  return (
    <div className="inv-footer-sections">
      {hasPayment && (
        <div className="inv-footer-section">
          <div className="inv-footer-title">Payment Information</div>
          <div className="inv-footer-text">
            {invoice.paymentInfo.bankName && (
              <>Bank: {invoice.paymentInfo.bankName}<br /></>
            )}
            {invoice.paymentInfo.accountName && (
              <>Account: {invoice.paymentInfo.accountName}<br /></>
            )}
            {invoice.paymentInfo.accountNumber && (
              <>Account #: {invoice.paymentInfo.accountNumber}<br /></>
            )}
            {invoice.paymentInfo.routingNumber && (
              <>Routing #: {invoice.paymentInfo.routingNumber}<br /></>
            )}
            {invoice.paymentInfo.swiftCode && (
              <>SWIFT: {invoice.paymentInfo.swiftCode}<br /></>
            )}
            {invoice.paymentInfo.paypalEmail && (
              <>PayPal: {invoice.paymentInfo.paypalEmail}<br /></>
            )}
          </div>
        </div>
      )}
      <div className="inv-footer-section">
        {hasNotes && (
          <>
            <div className="inv-footer-title">Notes</div>
            <div className="inv-footer-text">{nl(invoice.notes)}</div>
          </>
        )}
        {hasTerms && (
          <>
            <div className="inv-footer-title" style={hasNotes ? { marginTop: 12 } : undefined}>
              Terms & Conditions
            </div>
            <div className="inv-footer-text">{nl(invoice.terms)}</div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared Signature
// ---------------------------------------------------------------------------

function InvoiceSignature({ invoice }: { invoice: InvoiceData }) {
  if (!invoice.metadata.showSignature) return null;
  return (
    <div className="inv-signature-area">
      <div className="inv-signature-block">
        <div className="inv-signature-line" />
        {invoice.signature.name && (
          <div className="inv-signature-name">{invoice.signature.name}</div>
        )}
        {invoice.signature.title && (
          <div className="inv-signature-title">{invoice.signature.title}</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header Variants — each template picks one
// ---------------------------------------------------------------------------

/** Banner header — gradient/solid background with white text (modern-clean, bold-corporate, tech-startup) */
function HeaderBanner({ invoice }: { invoice: InvoiceData }) {
  const b = invoice.businessInfo;
  return (
    <div className="inv-header">
      <div className="inv-header-left">
        <div className="inv-company-name">{b.name || "Your Company"}</div>
        <div className="inv-company-details">
          {b.address && <>{nl(b.address)}</>}
          {b.email && <><br />{b.email}</>}
          {b.phone && <> · {b.phone}</>}
          {b.website && <><br />{b.website}</>}
          {b.taxId && <><br />Tax ID: {b.taxId}</>}
        </div>
      </div>
      <div className="inv-header-right">
        <div className="inv-invoice-title">{docTitle(invoice)}</div>
        <div className="inv-invoice-number">{invoice.invoiceNumber}</div>
        <div className="inv-status-badge">{statusLabel(invoice.status)}</div>
      </div>
    </div>
  );
}

/** Split header — left company / right invoice (classic-professional, elegant-line, international) */
function HeaderSplit({ invoice }: { invoice: InvoiceData }) {
  const b = invoice.businessInfo;
  return (
    <div className="inv-header">
      <div className="inv-header-left">
        <div className="inv-company-name">{b.name || "Your Company"}</div>
        <div className="inv-company-details">
          {b.address && <>{nl(b.address)}</>}
          {b.email && <><br />{b.email}</>}
          {b.phone && <> · {b.phone}</>}
          {b.website && <><br />{b.website}</>}
          {b.taxId && <><br />Tax ID: {b.taxId}</>}
        </div>
      </div>
      <div className="inv-header-right">
        <div className="inv-invoice-title">{docTitle(invoice)}</div>
        <div className="inv-invoice-number">{invoice.invoiceNumber}</div>
        <div className="inv-status-badge">{statusLabel(invoice.status)}</div>
      </div>
    </div>
  );
}

/** Minimal header — ultra-clean, understated (minimal-white, freelancer-simple) */
function HeaderMinimal({ invoice }: { invoice: InvoiceData }) {
  const b = invoice.businessInfo;
  return (
    <div className="inv-header">
      <div className="inv-header-left">
        <div className="inv-company-name">{b.name || "Your Company"}</div>
        <div className="inv-company-details">
          {b.email}{b.phone && ` · ${b.phone}`}
          {b.website && <><br />{b.website}</>}
        </div>
      </div>
      <div className="inv-header-right">
        <div className="inv-invoice-title">{docTitle(invoice)}</div>
        <div className="inv-invoice-number">{invoice.invoiceNumber}</div>
        <div className="inv-status-badge">{statusLabel(invoice.status)}</div>
      </div>
    </div>
  );
}

/** Centered header — formal centered layout (executive-premium) */
function HeaderCentered({ invoice }: { invoice: InvoiceData }) {
  const b = invoice.businessInfo;
  return (
    <div className="inv-header">
      <div className="inv-header-border">
        <div className="inv-company-name">{b.name || "Your Company"}</div>
      </div>
      <div className="inv-company-details">
        {b.address && <>{b.address}</>}
        {b.email && <> · {b.email}</>}
        {b.phone && <> · {b.phone}</>}
        {b.website && <><br />{b.website}</>}
        {b.taxId && <> · Tax ID: {b.taxId}</>}
      </div>
      <div className="inv-invoice-title-row">
        <div className="inv-title-ornament" />
        <div className="inv-invoice-title">{docTitle(invoice)}</div>
        <div className="inv-title-ornament" />
      </div>
      <div className="inv-invoice-number">{invoice.invoiceNumber}</div>
      <div className="inv-status-badge">{statusLabel(invoice.status)}</div>
    </div>
  );
}

/** Sidebar header — Creative Studio with gradient sidebar bar */
function HeaderSidebar({ invoice }: { invoice: InvoiceData }) {
  const b = invoice.businessInfo;
  return (
    <div className="inv-header">
      <div className="inv-header-sidebar" />
      <div className="inv-header-content">
        <div className="inv-header-left">
          <div className="inv-company-name">{b.name || "Your Company"}</div>
          <div className="inv-company-details">
            {b.address && <>{nl(b.address)}</>}
            {b.email && <><br />{b.email}</>}
            {b.phone && <> · {b.phone}</>}
          </div>
        </div>
        <div className="inv-header-right">
          <div className="inv-invoice-title">{docTitle(invoice)}</div>
          <div className="inv-invoice-number">{invoice.invoiceNumber}</div>
          <div className="inv-status-badge">{statusLabel(invoice.status)}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared Body (meta + details + table + totals + footer + signature)
// ---------------------------------------------------------------------------

function InvoiceBody({ invoice }: { invoice: InvoiceData }) {
  const b = invoice.businessInfo;
  const c = invoice.clientInfo;
  const cur = invoice.currency;
  const { grandTotal } = calcInvoiceTotals(invoice);
  const dtConfig = getDocumentTypeConfig(invoice.documentType ?? "invoice");
  const accent = invoice.metadata.accentColor;
  const blocks = invoice.customBlocks ?? [];

  return (
    <div className="inv-body">
      {/* Recipient / Sender */}
      <div className="inv-meta-grid">
        <div className="inv-meta-block">
          <div className="inv-meta-label">{dtConfig.recipientLabel}</div>
          <div className="inv-meta-value">
            {c.name && <strong>{c.name}</strong>}
            {c.company && <>{c.company}<br /></>}
            {c.address && <>{nl(c.address)}</>}
            {c.email && <><br />{c.email}</>}
            {c.phone && <><br />{c.phone}</>}
            {c.taxId && <><br />Tax ID: {c.taxId}</>}
          </div>
        </div>
        <div className="inv-meta-block">
          <div className="inv-meta-label">{dtConfig.senderLabel}</div>
          <div className="inv-meta-value">
            <strong>{b.name || "Your Company"}</strong>
            {b.address && <>{nl(b.address)}</>}
            {b.email && <><br />{b.email}</>}
            {b.phone && <><br />{b.phone}</>}
          </div>
        </div>
      </div>

      {/* Document details bar */}
      <div className="inv-detail-row">
        <div className="inv-detail-item">
          <div className="inv-detail-label">Issue Date</div>
          <div className="inv-detail-value">
            {formatDate(invoice.issueDate) || "—"}
          </div>
        </div>
        {dtConfig.hasDueDate && (
          <div className="inv-detail-item">
            <div className="inv-detail-label">Due Date</div>
            <div className="inv-detail-value">
              {formatDate(invoice.dueDate) || "—"}
            </div>
          </div>
        )}
        {invoice.poNumber && (
          <div className="inv-detail-item">
            <div className="inv-detail-label">P.O. Number</div>
            <div className="inv-detail-value">{invoice.poNumber}</div>
          </div>
        )}
        <div className="inv-detail-item">
          <div className="inv-detail-label">{dtConfig.amountLabel}</div>
          <div className="inv-detail-value">{formatMoney(grandTotal, cur)}</div>
        </div>
      </div>

      {/* Custom blocks — after header */}
      <CustomBlocksRegion blocks={blocks} position="after-header" accentColor={accent} density={1} />

      {/* Line items table */}
      <InvoiceTable invoice={invoice} />

      {/* Totals */}
      <InvoiceTotals invoice={invoice} />

      {/* Custom blocks — after items */}
      <CustomBlocksRegion blocks={blocks} position="after-items" accentColor={accent} density={1} />

      {/* Footer sections */}
      <InvoiceFooter invoice={invoice} />

      {/* Custom blocks — before signature */}
      <CustomBlocksRegion blocks={blocks} position="before-signature" accentColor={accent} density={1} />

      {/* Signature */}
      <InvoiceSignature invoice={invoice} />

      {/* Custom blocks — after footer */}
      <CustomBlocksRegion blocks={blocks} position="after-footer" accentColor={accent} density={1} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 10 Template Render Functions
// ---------------------------------------------------------------------------

function renderModernClean(invoice: InvoiceData): React.ReactNode {
  return (
    <>
      <HeaderBanner invoice={invoice} />
      <InvoiceBody invoice={invoice} />
      {invoice.metadata.watermark && (
        <div className="inv-watermark">{invoice.metadata.watermark}</div>
      )}
      {invoice.metadata.footerText && (
        <div className="inv-page-footer">{invoice.metadata.footerText}</div>
      )}
    </>
  );
}

function renderClassicProfessional(invoice: InvoiceData): React.ReactNode {
  return (
    <>
      <HeaderSplit invoice={invoice} />
      <InvoiceBody invoice={invoice} />
      {invoice.metadata.watermark && (
        <div className="inv-watermark">{invoice.metadata.watermark}</div>
      )}
      {invoice.metadata.footerText && (
        <div className="inv-page-footer">{invoice.metadata.footerText}</div>
      )}
    </>
  );
}

function renderMinimalWhite(invoice: InvoiceData): React.ReactNode {
  return (
    <>
      <HeaderMinimal invoice={invoice} />
      <InvoiceBody invoice={invoice} />
      {invoice.metadata.watermark && (
        <div className="inv-watermark">{invoice.metadata.watermark}</div>
      )}
      {invoice.metadata.footerText && (
        <div className="inv-page-footer">{invoice.metadata.footerText}</div>
      )}
    </>
  );
}

function renderBoldCorporate(invoice: InvoiceData): React.ReactNode {
  return (
    <>
      <HeaderBanner invoice={invoice} />
      <InvoiceBody invoice={invoice} />
      {invoice.metadata.watermark && (
        <div className="inv-watermark">{invoice.metadata.watermark}</div>
      )}
      {invoice.metadata.footerText && (
        <div className="inv-page-footer">{invoice.metadata.footerText}</div>
      )}
    </>
  );
}

function renderElegantLine(invoice: InvoiceData): React.ReactNode {
  return (
    <>
      <HeaderSplit invoice={invoice} />
      <InvoiceBody invoice={invoice} />
      {invoice.metadata.watermark && (
        <div className="inv-watermark">{invoice.metadata.watermark}</div>
      )}
      {invoice.metadata.footerText && (
        <div className="inv-page-footer">{invoice.metadata.footerText}</div>
      )}
    </>
  );
}

function renderTechStartup(invoice: InvoiceData): React.ReactNode {
  return (
    <>
      <HeaderBanner invoice={invoice} />
      <InvoiceBody invoice={invoice} />
      {invoice.metadata.watermark && (
        <div className="inv-watermark">{invoice.metadata.watermark}</div>
      )}
      {invoice.metadata.footerText && (
        <div className="inv-page-footer">{invoice.metadata.footerText}</div>
      )}
    </>
  );
}

function renderCreativeStudio(invoice: InvoiceData): React.ReactNode {
  return (
    <>
      <HeaderSidebar invoice={invoice} />
      <InvoiceBody invoice={invoice} />
      {invoice.metadata.watermark && (
        <div className="inv-watermark">{invoice.metadata.watermark}</div>
      )}
      {invoice.metadata.footerText && (
        <div className="inv-page-footer">{invoice.metadata.footerText}</div>
      )}
    </>
  );
}

function renderExecutivePremium(invoice: InvoiceData): React.ReactNode {
  return (
    <>
      <HeaderCentered invoice={invoice} />
      <InvoiceBody invoice={invoice} />
      {invoice.metadata.watermark && (
        <div className="inv-watermark">{invoice.metadata.watermark}</div>
      )}
      {invoice.metadata.footerText && (
        <div className="inv-page-footer">{invoice.metadata.footerText}</div>
      )}
    </>
  );
}

function renderFreelancerSimple(invoice: InvoiceData): React.ReactNode {
  return (
    <>
      <HeaderMinimal invoice={invoice} />
      <InvoiceBody invoice={invoice} />
      {invoice.metadata.watermark && (
        <div className="inv-watermark">{invoice.metadata.watermark}</div>
      )}
      {invoice.metadata.footerText && (
        <div className="inv-page-footer">{invoice.metadata.footerText}</div>
      )}
    </>
  );
}

function renderInternational(invoice: InvoiceData): React.ReactNode {
  return (
    <>
      <HeaderSplit invoice={invoice} />
      <InvoiceBody invoice={invoice} />
      {invoice.metadata.watermark && (
        <div className="inv-watermark">{invoice.metadata.watermark}</div>
      )}
      {invoice.metadata.footerText && (
        <div className="inv-page-footer">{invoice.metadata.footerText}</div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Renderer Registry
// ---------------------------------------------------------------------------

const TEMPLATE_RENDERERS: Record<string, (invoice: InvoiceData) => React.ReactNode> = {
  "modern-clean":          renderModernClean,
  "classic-professional":  renderClassicProfessional,
  "minimal-white":         renderMinimalWhite,
  "bold-corporate":        renderBoldCorporate,
  "elegant-line":          renderElegantLine,
  "tech-startup":          renderTechStartup,
  "creative-studio":       renderCreativeStudio,
  "executive-premium":     renderExecutivePremium,
  "freelancer-simple":     renderFreelancerSimple,
  "international":         renderInternational,
};

// ---------------------------------------------------------------------------
// Public API — Factory (mirrors resume createProTemplateComponent)
// ---------------------------------------------------------------------------

/** Shared CSS overrides for table-style and header-style data attributes */
const SHARED_STYLE_OVERRIDES = `
/* ── Table style overrides via data-table-style ── */
[data-table-style="bordered"] .inv-table { border: 1px solid var(--inv-border, #e5e7eb); }
[data-table-style="bordered"] .inv-table thead th { border: 1px solid var(--inv-border, #e5e7eb); }
[data-table-style="bordered"] .inv-table tbody td { border: 1px solid var(--inv-border, #e5e7eb); }
[data-table-style="bordered"] .inv-table tbody tr:nth-child(even) { background: transparent; }

[data-table-style="clean"] .inv-table tbody tr:nth-child(even) { background: transparent; }
[data-table-style="clean"] .inv-table tbody td { border-bottom: none; }
[data-table-style="clean"] .inv-table thead th { border-bottom: 2px solid var(--inv-accent); background: transparent; color: var(--inv-text-dark, #111827); }

[data-table-style="minimal"] .inv-table tbody tr:nth-child(even) { background: transparent; }
[data-table-style="minimal"] .inv-table tbody td { border-bottom: none; padding-top: 6px; padding-bottom: 6px; }
[data-table-style="minimal"] .inv-table thead th { background: transparent; color: var(--inv-text-light, #9ca3af); border-bottom: 1px solid var(--inv-border, #e5e7eb); font-weight: 500; }

/* ── Header style overrides via data-header-style ── */
[data-header-style="compact"] .inv-header { padding: 20px 44px 16px; }
[data-header-style="compact"] .inv-company-name { font-size: 18px; }
[data-header-style="compact"] .inv-invoice-title { font-size: 22px; }

[data-header-style="minimal"] .inv-header { background: transparent !important; color: var(--inv-text-dark, #111827) !important; padding: 24px 44px 16px; border-bottom: 2px solid var(--inv-accent); }
[data-header-style="minimal"] .inv-header .inv-company-name { color: var(--inv-text-dark, #111827); }
[data-header-style="minimal"] .inv-header .inv-company-details { color: var(--inv-text-medium, #4b5563); opacity: 1; }
[data-header-style="minimal"] .inv-header .inv-invoice-title { color: var(--inv-accent); font-size: 24px; }
[data-header-style="minimal"] .inv-header .inv-invoice-number { color: var(--inv-text-medium, #4b5563); opacity: 1; }
[data-header-style="minimal"] .inv-header .inv-status-badge { background: var(--inv-accent-light); color: var(--inv-accent); }
`;

export function createInvoiceTemplateComponent(
  templateId: string,
): React.FC<InvoiceTemplateProps> {
  const Component: React.FC<InvoiceTemplateProps> = ({ invoice }) => {
    const tplDef = getInvoiceTemplate(templateId);
    const cssVars = useMemo(() => computeCSSVariables(invoice.metadata), [invoice.metadata]);
    const css = INVOICE_TEMPLATE_CSS[templateId] ?? "";
    const renderFn = TEMPLATE_RENDERERS[templateId] ?? renderModernClean;

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css + SHARED_STYLE_OVERRIDES }} />
        {tplDef?.googleFontUrl && (
          <link rel="stylesheet" href={tplDef.googleFontUrl} />
        )}
        <div
          data-invoice-template={templateId}
          data-header-style={invoice.metadata.headerStyle || "full"}
          data-table-style={invoice.metadata.tableStyle || "striped"}
          style={{
            ...cssVars,
            position: "relative",
            minHeight: "100%",
            width: "100%",
          } as React.CSSProperties}
        >
          {renderFn(invoice)}
        </div>
      </>
    );
  };
  Component.displayName = `InvoiceTemplate_${templateId}`;
  return Component;
}
