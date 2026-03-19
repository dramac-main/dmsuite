// =============================================================================
// DMSuite — Receipt Book Renderer
// Traditional receipt book layout: 3 receipt slips per A4 portrait page.
// Each receipt is in landscape orientation (~99mm × 210mm).
// Designed for printing as physical sales books.
// =============================================================================

"use client";

import React, { useMemo } from "react";
import type { InvoiceData } from "@/lib/invoice/schema";
import {
  calcInvoiceTotals,
  formatMoney,
  formatDate,
  computeCSSVariables,
  getDocumentTypeConfig,
} from "@/lib/invoice/schema";
import { getInvoiceTemplate } from "./template-defs";

// ---------------------------------------------------------------------------
// Constants — A4 portrait page with 3 landscape receipt slips
// ---------------------------------------------------------------------------

/** A4 in px at 96 DPI (portrait) */
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

/** Each receipt slip: A4 height / 3 ≈ 374px (~99mm), width = A4 width */
const SLIP_HEIGHT = Math.floor(A4_HEIGHT / 3);  // ~374px
const SLIP_WIDTH = A4_WIDTH;

// ---------------------------------------------------------------------------
// Receipt Slip Component
// ---------------------------------------------------------------------------

interface ReceiptSlipProps {
  invoice: InvoiceData;
  slipIndex: number;
  isBlank?: boolean;
}

function ReceiptSlip({ invoice, slipIndex, isBlank = false }: ReceiptSlipProps) {
  const config = getDocumentTypeConfig(invoice.documentType ?? "receipt");
  const cur = invoice.currency;
  const { grandTotal } = calcInvoiceTotals(invoice);

  // For blank/printable receipts, show empty underlines
  const blank = (value: string, width = "120px") =>
    isBlank
      ? <span style={{ display: "inline-block", minWidth: width, borderBottom: "1px solid #999" }}>&nbsp;</span>
      : <span style={{ fontWeight: 600 }}>{value || "—"}</span>;

  return (
    <div
      className="receipt-slip"
      style={{
        width: `${SLIP_WIDTH}px`,
        height: `${SLIP_HEIGHT}px`,
        boxSizing: "border-box",
        padding: "18px 24px 14px",
        borderBottom: "2px dashed #ccc",
        position: "relative",
        fontFamily: "var(--inv-body-font, 'Inter', sans-serif)",
        fontSize: "11px",
        lineHeight: 1.4,
        color: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Receipt Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--inv-accent)", fontFamily: "var(--inv-heading-font, 'Inter', sans-serif)" }}>
            {invoice.businessInfo.name || "Company Name"}
          </div>
          <div style={{ fontSize: "9px", color: "#666", marginTop: "2px" }}>
            {invoice.businessInfo.address?.split("\n")[0]}
            {invoice.businessInfo.phone && ` · ${invoice.businessInfo.phone}`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--inv-accent)" }}>
            {config.title}
          </div>
          <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>
            No: {blank(invoice.invoiceNumber, "80px")}
          </div>
        </div>
      </div>

      {/* Receipt Body — 2-column field layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", flex: 1 }}>
        <div className="receipt-field">
          <span style={{ color: "#666", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</span>
          <div style={{ marginTop: "2px" }}>{blank(formatDate(invoice.issueDate), "100px")}</div>
        </div>
        <div className="receipt-field">
          <span style={{ color: "#666", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Received From</span>
          <div style={{ marginTop: "2px" }}>{blank(invoice.clientInfo.name || invoice.clientInfo.company, "140px")}</div>
        </div>

        <div className="receipt-field" style={{ gridColumn: "1 / -1" }}>
          <span style={{ color: "#666", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount</span>
          <div style={{ marginTop: "2px", fontSize: "16px", fontWeight: 700 }}>
            {isBlank
              ? <span style={{ display: "inline-block", minWidth: "180px", borderBottom: "1px solid #999" }}>&nbsp;</span>
              : formatMoney(grandTotal, cur)
            }
          </div>
        </div>

        <div className="receipt-field" style={{ gridColumn: "1 / -1" }}>
          <span style={{ color: "#666", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Being payment for</span>
          <div style={{ marginTop: "2px" }}>
            {isBlank
              ? <>
                  <div style={{ borderBottom: "1px solid #ccc", height: "18px", marginBottom: "4px" }}>&nbsp;</div>
                  <div style={{ borderBottom: "1px solid #ccc", height: "18px" }}>&nbsp;</div>
                </>
              : invoice.lineItems.map((li) => li.description).filter(Boolean).join(", ") || "—"
            }
          </div>
        </div>
      </div>

      {/* Receipt Footer — Signature & serial */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid #eee" }}>
        <div>
          <div style={{ color: "#666", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Received by</div>
          {isBlank
            ? <div style={{ borderBottom: "1px solid #999", width: "140px", height: "16px" }}>&nbsp;</div>
            : <div style={{ fontWeight: 600 }}>{invoice.signature.name || "—"}</div>
          }
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#666", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Signature</div>
          <div style={{ borderBottom: "1px solid #999", width: "120px", height: "16px" }}>&nbsp;</div>
        </div>
      </div>

      {/* Cut line indicator */}
      {slipIndex < 2 && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: "16px",
          right: "16px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
          <div style={{ flex: 1, borderTop: "2px dashed #ccc" }} />
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Receipt Book Page — A4 with 3 receipt slips
// ---------------------------------------------------------------------------

interface ReceiptBookPageProps {
  invoice: InvoiceData;
  pageIndex: number;
  totalPages: number;
  isBlank?: boolean;
}

function ReceiptBookPage({ invoice, pageIndex, totalPages, isBlank }: ReceiptBookPageProps) {
  return (
    <div className="relative mb-8">
      <div
        style={{
          width: `${A4_WIDTH}px`,
          height: `${A4_HEIGHT}px`,
          backgroundColor: "#ffffff",
          position: "relative",
          overflow: "hidden",
        }}
        className="shadow-lg"
      >
        {Array.from({ length: 3 }, (_, slipIdx) => (
          <ReceiptSlip
            key={slipIdx}
            invoice={invoice}
            slipIndex={slipIdx}
            isBlank={isBlank}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">
          Page {pageIndex + 1} of {totalPages}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export — Receipt Book Renderer
// ---------------------------------------------------------------------------

interface ReceiptBookRendererProps {
  invoice: InvoiceData;
  pageCount?: number;
  isBlank?: boolean;
  className?: string;
  id?: string;
}

export default function ReceiptBookRenderer({
  invoice,
  pageCount = 1,
  isBlank = false,
  className,
  id,
}: ReceiptBookRendererProps) {
  const cssVars = useMemo(() => computeCSSVariables(invoice.metadata), [invoice.metadata]);
  const tplDef = useMemo(() => getInvoiceTemplate(invoice.metadata.template), [invoice.metadata.template]);
  const fontUrl = tplDef?.googleFontUrl ?? null;

  return (
    <div id={id} className={className} style={cssVars as React.CSSProperties}>
      {fontUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontUrl} />
      )}
      {Array.from({ length: pageCount }, (_, i) => (
        <ReceiptBookPage
          key={i}
          invoice={invoice}
          pageIndex={i}
          totalPages={pageCount}
          isBlank={isBlank}
        />
      ))}
    </div>
  );
}
