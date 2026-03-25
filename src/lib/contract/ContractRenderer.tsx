// =============================================================================
// DMSuite — Contract Document Renderer
// Renders legal contracts as styled HTML for preview and print.
// Uses the same HTML/CSS approach as BlankFormRenderer for print fidelity.
// Each section has data-ct-section attributes for click-to-edit & layers.
// =============================================================================

"use client";

import React, { useMemo } from "react";
import type { ContractFormData, ContractTemplate } from "@/lib/contract/schema";
import {
  getContractTemplate,
  CONTRACT_TYPE_CONFIGS,
  FONT_PAIRINGS,
} from "@/lib/contract/schema";

// ---------------------------------------------------------------------------
// Page dimensions at 96 CSS PPI
// ---------------------------------------------------------------------------

const PAGE_PX: Record<string, { w: number; h: number }> = {
  a4: { w: 794, h: 1123 },
  letter: { w: 816, h: 1056 },
  legal: { w: 816, h: 1344 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFonts(fontPairingId: string) {
  const fp = FONT_PAIRINGS.find((f) => f.id === fontPairingId) ?? FONT_PAIRINGS[0];
  return { heading: fp.heading, body: fp.body };
}

function getGoogleFontUrl(fontPairingId: string): string {
  const fp = FONT_PAIRINGS.find((f) => f.id === fontPairingId) ?? FONT_PAIRINGS[0];
  const families = new Set([fp.heading, fp.body]);
  const params = [...families].map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800;900`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function luminance(hex: string): number {
  const c = hex.replace("#", "").slice(0, 6);
  if (c.length < 6) return 0;
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const srgb = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastText(bgHex: string): string {
  return luminance(bgHex) > 0.35 ? "#1a1a1a" : "#ffffff";
}

// ---------------------------------------------------------------------------
// Decorative Overlays
// ---------------------------------------------------------------------------

function WatermarkOverlay({ form }: { form: ContractFormData }) {
  if (!form.printConfig.showWatermark || !form.printConfig.watermarkText) return null;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%) rotate(-30deg)",
        fontSize: "72px", fontWeight: 900,
        color: form.style.accentColor, opacity: 0.05,
        whiteSpace: "nowrap", letterSpacing: "8px", textTransform: "uppercase",
      }}>
        {form.printConfig.watermarkText}
      </div>
    </div>
  );
}

function PageBorder({ tpl, accent }: { tpl: ContractTemplate; accent: string }) {
  if (tpl.borderStyle === "none") return null;
  const w = tpl.borderStyle === "thick" ? 3 : 1;
  return (
    <div style={{
      position: "absolute", inset: "6px",
      border: `${w}px solid ${accent}40`,
      pointerEvents: "none", zIndex: 0,
    }} />
  );
}

function DecorativeOverlay({ tpl }: { tpl: ContractTemplate }) {
  if (tpl.decorative === "none") return null;

  if (tpl.decorative === "corner-gradient") {
    const accent2 = tpl.accentSecondary ?? tpl.accent;
    return (
      <div style={{ position: "absolute", bottom: 0, right: 0, width: "120px", height: "120px", overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", bottom: "-20px", right: "-20px", width: "140px", height: "140px", background: `linear-gradient(135deg, ${tpl.accent}30, ${accent2}20)`, borderRadius: "20px", transform: "rotate(15deg)" }} />
      </div>
    );
  }

  if (tpl.decorative === "accent-strip") {
    const accent2 = tpl.accentSecondary ?? tpl.accent;
    return (
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: "6px",
        background: `linear-gradient(180deg, ${tpl.accent}, ${accent2})`,
        pointerEvents: "none", zIndex: 0,
      }} />
    );
  }

  // page-border decorative
  return (
    <div style={{
      position: "absolute", inset: "4px",
      border: `2px solid ${tpl.accent}30`,
      pointerEvents: "none", zIndex: 0,
    }} />
  );
}

// ---------------------------------------------------------------------------
// Header Divider
// ---------------------------------------------------------------------------

function HeaderDivider({ tpl }: { tpl: ContractTemplate }) {
  const accent = tpl.accent;
  switch (tpl.headerDivider) {
    case "thick-line":
      return <div style={{ height: "3px", backgroundColor: accent, marginTop: "12px" }} />;
    case "double-line":
      return <div style={{ borderTop: `3px double ${accent}`, marginTop: "12px" }} />;
    case "accent-bar":
      return <div style={{ height: "4px", background: `linear-gradient(to right, ${accent}, ${accent}40)`, marginTop: "12px", borderRadius: "2px" }} />;
    case "none":
      return null;
    default:
      return <div style={{ height: "1px", backgroundColor: `${accent}40`, marginTop: "12px" }} />;
  }
}

// ---------------------------------------------------------------------------
// Main Renderer
// ---------------------------------------------------------------------------

interface ContractRendererProps {
  form: ContractFormData;
}

export default function ContractRenderer({ form }: ContractRendererProps) {
  const tpl = useMemo(() => getContractTemplate(form.style.template), [form.style.template]);
  const fonts = useMemo(() => getFonts(form.style.fontPairing), [form.style.fontPairing]);
  const fontUrl = useMemo(() => getGoogleFontUrl(form.style.fontPairing), [form.style.fontPairing]);
  const { w: pageW, h: pageH } = PAGE_PX[form.printConfig.pageSize] ?? PAGE_PX.a4;
  const accent = form.style.accentColor;
  const config = CONTRACT_TYPE_CONFIGS[form.contractType];
  const enabledClauses = form.clauses.filter((c) => c.enabled);

  const M = 50; // margin
  const CW = pageW - M * 2; // content width

  return (
    <div data-contract-page style={{ position: "relative" }}>
      {/* Google Fonts */}
      <link rel="stylesheet" href={fontUrl} />

      <div
        style={{
          width: `${pageW}px`,
          minHeight: `${pageH}px`,
          backgroundColor: "#ffffff",
          color: "#1e293b",
          fontFamily: `'${fonts.body}', 'Inter', sans-serif`,
          fontSize: "12px",
          lineHeight: 1.6,
          position: "relative",
        }}
      >
        {/* Decorative layers */}
        <WatermarkOverlay form={form} />
        <PageBorder tpl={tpl} accent={accent} />
        <DecorativeOverlay tpl={tpl} />

        {/* Content container */}
        <div style={{ position: "relative", zIndex: 1, padding: `${M}px` }}>

          {/* ─── CONFIDENTIAL BANNER ─── */}
          {form.documentInfo.showConfidentialBanner && (
            <div
              data-ct-section="confidential"
              style={{
                textAlign: "center",
                padding: "6px 16px",
                backgroundColor: `${accent}10`,
                border: `1px solid ${accent}30`,
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: accent,
                marginBottom: "20px",
              }}
            >
              CONFIDENTIAL
            </div>
          )}

          {/* ─── DOCUMENT HEADER ─── */}
          <div data-ct-section="header">
            {form.style.headerStyle === "banner" && (
              <div style={{
                backgroundColor: accent,
                color: contrastText(accent),
                padding: "20px 24px",
                marginLeft: `-${M}px`,
                marginRight: `-${M}px`,
                marginTop: form.documentInfo.showConfidentialBanner ? "0" : `-${M}px`,
                marginBottom: "24px",
              }}>
                <h1 style={{ fontSize: "24px", fontWeight: 800, fontFamily: `'${fonts.heading}', sans-serif`, letterSpacing: "1px", textTransform: "uppercase", margin: 0 }}>
                  {form.documentInfo.title || config.defaultTitle}
                </h1>
                {form.documentInfo.subtitle && (
                  <p style={{ fontSize: "13px", opacity: 0.85, marginTop: "4px", margin: 0 }}>{form.documentInfo.subtitle}</p>
                )}
                <div style={{ display: "flex", gap: "20px", marginTop: "10px", fontSize: "11px", opacity: 0.75 }}>
                  {form.documentInfo.referenceNumber && <span>Ref: {form.documentInfo.referenceNumber}</span>}
                  {form.documentInfo.effectiveDate && <span>Date: {form.documentInfo.effectiveDate}</span>}
                </div>
              </div>
            )}

            {form.style.headerStyle === "centered" && (
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 800, fontFamily: `'${fonts.heading}', serif`, letterSpacing: "2px", textTransform: "uppercase", color: accent, margin: 0 }}>
                  {form.documentInfo.title || config.defaultTitle}
                </h1>
                {form.documentInfo.subtitle && (
                  <p style={{ fontSize: "13px", color: "#64748b", marginTop: "6px", margin: "6px 0 0 0" }}>{form.documentInfo.subtitle}</p>
                )}
                <HeaderDivider tpl={tpl} />
                <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "10px", fontSize: "11px", color: "#64748b" }}>
                  {form.documentInfo.referenceNumber && <span>Ref: {form.documentInfo.referenceNumber}</span>}
                  {form.documentInfo.effectiveDate && <span>Effective: {form.documentInfo.effectiveDate}</span>}
                  {form.documentInfo.expiryDate && <span>Expires: {form.documentInfo.expiryDate}</span>}
                </div>
              </div>
            )}

            {form.style.headerStyle === "left-aligned" && (
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 700, fontFamily: `'${fonts.heading}', sans-serif`, color: accent, margin: 0 }}>
                  {form.documentInfo.title || config.defaultTitle}
                </h1>
                {form.documentInfo.subtitle && (
                  <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", margin: "4px 0 0 0" }}>{form.documentInfo.subtitle}</p>
                )}
                <HeaderDivider tpl={tpl} />
                <div style={{ display: "flex", gap: "20px", marginTop: "10px", fontSize: "11px", color: "#64748b" }}>
                  {form.documentInfo.referenceNumber && <span>Ref: {form.documentInfo.referenceNumber}</span>}
                  {form.documentInfo.effectiveDate && <span>Effective: {form.documentInfo.effectiveDate}</span>}
                </div>
              </div>
            )}

            {form.style.headerStyle === "minimal" && (
              <div style={{ marginBottom: "20px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 600, fontFamily: `'${fonts.heading}', sans-serif`, color: "#1e293b", margin: 0 }}>
                  {form.documentInfo.title || config.defaultTitle}
                </h1>
                <div style={{ height: "1px", backgroundColor: "#e2e8f0", marginTop: "8px" }} />
                <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "10px", color: "#94a3b8" }}>
                  {form.documentInfo.referenceNumber && <span>Ref: {form.documentInfo.referenceNumber}</span>}
                  {form.documentInfo.effectiveDate && <span>{form.documentInfo.effectiveDate}</span>}
                </div>
              </div>
            )}
          </div>

          {/* ─── PARTIES SECTION ─── */}
          <div data-ct-section="parties" style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {/* Party A */}
              <div style={{ flex: "1 1 45%", minWidth: "200px" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: accent, marginBottom: "6px" }}>
                  {form.partyA.role || config.partyARole}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                  {form.partyA.name || `[${config.partyARole} Name]`}
                </div>
                {form.partyA.address && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{form.partyA.address}</div>}
                {form.partyA.city && <div style={{ fontSize: "11px", color: "#64748b" }}>{form.partyA.city}, {form.partyA.country}</div>}
                {form.partyA.representative && (
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>
                    Rep: {form.partyA.representative}
                    {form.partyA.representativeTitle && <span style={{ color: "#94a3b8" }}> ({form.partyA.representativeTitle})</span>}
                  </div>
                )}
              </div>

              {/* AND separator */}
              <div style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", letterSpacing: "1px" }}>AND</span>
              </div>

              {/* Party B */}
              <div style={{ flex: "1 1 45%", minWidth: "200px" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: accent, marginBottom: "6px" }}>
                  {form.partyB.role || config.partyBRole}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                  {form.partyB.name || `[${config.partyBRole} Name]`}
                </div>
                {form.partyB.address && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{form.partyB.address}</div>}
                {form.partyB.city && <div style={{ fontSize: "11px", color: "#64748b" }}>{form.partyB.city}, {form.partyB.country}</div>}
                {form.partyB.representative && (
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>
                    Rep: {form.partyB.representative}
                    {form.partyB.representativeTitle && <span style={{ color: "#94a3b8" }}> ({form.partyB.representativeTitle})</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider after parties */}
          <div style={{ height: "1px", backgroundColor: `${accent}20`, marginBottom: "16px" }} />

          {/* ─── PREAMBLE ─── */}
          {form.documentInfo.preambleText && (
            <div data-ct-section="preamble" style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: accent, marginBottom: "8px" }}>
                Preamble
              </div>
              <p style={{ fontSize: "12px", lineHeight: 1.7, color: "#475569", textAlign: "justify", margin: 0 }}>
                {form.documentInfo.preambleText}
              </p>
            </div>
          )}

          {/* ─── TABLE OF CONTENTS ─── */}
          {form.documentInfo.showTableOfContents && enabledClauses.length > 0 && (
            <div data-ct-section="toc" style={{ marginBottom: "24px", padding: "12px 16px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: accent, marginBottom: "8px" }}>
                Table of Contents
              </div>
              {enabledClauses.map((clause, i) => (
                <div key={clause.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", fontSize: "11px" }}>
                  <span style={{ color: "#1e293b" }}>
                    <span style={{ fontWeight: 600, color: accent, marginRight: "6px" }}>{i + 1}.</span>
                    {clause.title}
                  </span>
                  <span style={{ flex: 1, borderBottom: "1px dotted #cbd5e1", margin: "0 8px", minWidth: "20px" }} />
                  <span style={{ color: "#94a3b8", fontSize: "10px" }}>{i + 1}</span>
                </div>
              ))}
            </div>
          )}

          {/* ─── CLAUSES ─── */}
          <div data-ct-section="clauses">
            {enabledClauses.map((clause, i) => (
              <div key={clause.id} style={{ marginBottom: "20px" }}>
                <h3 style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  fontFamily: `'${fonts.heading}', sans-serif`,
                  color: "#1e293b",
                  margin: "0 0 8px 0",
                }}>
                  <span style={{ color: accent, marginRight: "8px" }}>{i + 1}.</span>
                  {clause.title}
                </h3>
                <p style={{ fontSize: "12px", lineHeight: 1.7, color: "#475569", textAlign: "justify", margin: 0, paddingLeft: "20px" }}>
                  {clause.content}
                </p>
              </div>
            ))}
          </div>

          {/* ─── SIGNATURES ─── */}
          <div data-ct-section="signatures" style={{ marginTop: "40px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: accent, marginBottom: "12px", textAlign: "center" }}>
              IN WITNESS WHEREOF
            </div>
            <p style={{ fontSize: "11px", color: "#64748b", textAlign: "center", marginBottom: "30px", margin: "0 0 30px 0" }}>
              The parties have executed this Agreement as of the Effective Date first written above.
            </p>

            <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
              {/* Party A Signature */}
              <div style={{ flex: "1 1 45%", minWidth: "200px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#1e293b", marginBottom: "20px" }}>
                  For and on behalf of {form.partyA.name || `[${config.partyARole}]`}:
                </div>
                <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #1e293b" : "1px solid #1e293b", width: "220px", marginBottom: "4px" }} />
                <div style={{ fontSize: "10px", color: "#64748b" }}>Signature</div>
                <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "220px", marginTop: "16px", marginBottom: "4px" }} />
                <div style={{ fontSize: "10px", color: "#64748b" }}>Name & Title</div>
                {form.signatureConfig.showDate && (
                  <>
                    <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "140px", marginTop: "16px", marginBottom: "4px" }} />
                    <div style={{ fontSize: "10px", color: "#64748b" }}>Date</div>
                  </>
                )}
                {form.signatureConfig.showSeal && (
                  <div style={{ width: "80px", height: "80px", border: "2px dashed #cbd5e1", borderRadius: "50%", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "8px", color: "#94a3b8", textTransform: "uppercase" }}>Seal</span>
                  </div>
                )}
              </div>

              {/* Party B Signature */}
              <div style={{ flex: "1 1 45%", minWidth: "200px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#1e293b", marginBottom: "20px" }}>
                  For and on behalf of {form.partyB.name || `[${config.partyBRole}]`}:
                </div>
                <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #1e293b" : "1px solid #1e293b", width: "220px", marginBottom: "4px" }} />
                <div style={{ fontSize: "10px", color: "#64748b" }}>Signature</div>
                <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "220px", marginTop: "16px", marginBottom: "4px" }} />
                <div style={{ fontSize: "10px", color: "#64748b" }}>Name & Title</div>
                {form.signatureConfig.showDate && (
                  <>
                    <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "140px", marginTop: "16px", marginBottom: "4px" }} />
                    <div style={{ fontSize: "10px", color: "#64748b" }}>Date</div>
                  </>
                )}
                {form.signatureConfig.showSeal && (
                  <div style={{ width: "80px", height: "80px", border: "2px dashed #cbd5e1", borderRadius: "50%", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "8px", color: "#94a3b8", textTransform: "uppercase" }}>Seal</span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── WITNESSES ─── */}
            {form.signatureConfig.showWitness && (
              <div data-ct-section="witnesses" style={{ marginTop: "36px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#1e293b", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Witness{form.signatureConfig.witnessCount > 1 ? "es" : ""}
                </div>
                <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
                  {Array.from({ length: form.signatureConfig.witnessCount }, (_, i) => (
                    <div key={i} style={{ flex: "1 1 45%", minWidth: "200px" }}>
                      <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "16px" }}>Witness {i + 1}</div>
                      <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #1e293b" : "1px solid #1e293b", width: "200px", marginBottom: "4px" }} />
                      <div style={{ fontSize: "10px", color: "#64748b" }}>Signature</div>
                      <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "200px", marginTop: "12px", marginBottom: "4px" }} />
                      <div style={{ fontSize: "10px", color: "#64748b" }}>Full Name</div>
                      <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "200px", marginTop: "12px", marginBottom: "4px" }} />
                      <div style={{ fontSize: "10px", color: "#64748b" }}>ID/NRC Number</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── FOOTER ─── */}
          <div data-ct-section="footer" style={{ marginTop: "40px" }}>
            {tpl.footerStyle === "bar" && (
              <div style={{
                backgroundColor: accent,
                color: contrastText(accent),
                padding: "8px 16px",
                marginLeft: `-${M}px`, marginRight: `-${M}px`, marginBottom: `-${M}px`,
                fontSize: "10px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontWeight: 600 }}>{form.documentInfo.title}</span>
                {form.style.pageNumbering && <span style={{ opacity: 0.75 }}>Page 1</span>}
              </div>
            )}

            {tpl.footerStyle === "line" && (
              <div style={{ borderTop: `1px solid ${accent}30`, paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#94a3b8" }}>
                <span>{form.documentInfo.title}</span>
                <span>{form.documentInfo.referenceNumber}</span>
                {form.style.pageNumbering && <span>Page 1</span>}
              </div>
            )}

            {tpl.footerStyle === "none" && form.style.pageNumbering && (
              <div style={{
                textAlign: form.style.pageNumberPosition === "bottom-center" ? "center" : "right",
                fontSize: "9px", color: "#94a3b8", marginTop: "16px",
              }}>
                Page 1
              </div>
            )}

            {/* Legal disclaimer */}
            <div style={{ textAlign: "center", fontSize: "8px", color: "#94a3b8", marginTop: "12px", fontStyle: "italic" }}>
              This document is a template generated by DMSuite. It is not a substitute for professional legal advice.
              Consult a qualified attorney before executing any legal agreement.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
