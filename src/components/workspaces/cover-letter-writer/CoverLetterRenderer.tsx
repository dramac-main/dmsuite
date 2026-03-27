"use client";

// =============================================================================
// DMSuite — Cover Letter Renderer
// Paginated HTML/CSS renderer for cover letter preview & print.
// =============================================================================

import React, { useMemo, useEffect, useRef, useState } from "react";
import {
  type CoverLetterFormData,
  type TemplateId,
  type HeaderStyleId,
  FONT_PAIRINGS,
  COVER_LETTER_TEMPLATES,
} from "@/stores/cover-letter-editor";
import {
  getAdvancedSettings,
  scaledFontSize,
} from "@/stores/advanced-helpers";

// ━━━ Page Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PAGE_PX: Record<string, { w: number; h: number }> = {
  a4: { w: 794, h: 1123 },
  letter: { w: 816, h: 1056 },
  a5: { w: 559, h: 794 },
};

const MARGIN_MAP: Record<string, number> = { narrow: 40, standard: 56, wide: 72 };
const LINE_HEIGHT_MAP: Record<string, number> = { tight: 1.45, normal: 1.65, loose: 1.9 };
const FOOTER_H = 32;
export const PAGE_GAP = 16;

// ━━━ Font loading ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getGoogleFontUrl(fontPairingId: string): string {
  const fp = FONT_PAIRINGS.find((f) => f.id === fontPairingId) ?? FONT_PAIRINGS[0];
  const families = new Set([fp.heading, fp.body]);
  const params = [...families]
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function getFonts(pairingId: string): { heading: string; body: string } {
  const fp = FONT_PAIRINGS.find((f) => f.id === pairingId) ?? FONT_PAIRINGS[0];
  return { heading: fp.heading, body: fp.body };
}

// ━━━ Date formatter ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

// ━━━ Sub-components ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/* --- Header Styles --- */

function HeaderStandard({ form, accent, fonts, margin }: {
  form: CoverLetterFormData; accent: string; fonts: { heading: string; body: string }; margin: number;
}) {
  const { sender } = form;
  const contactParts = [sender.email, sender.phone, sender.location, sender.linkedIn, sender.website].filter(Boolean);

  return (
    <div data-cl-section="header" style={{ padding: `${margin}px ${margin}px 0 ${margin}px` }}>
      {form.style.showLetterheadBar && (
        <div style={{ height: 4, background: accent, marginBottom: 20, borderRadius: 2 }} />
      )}
      <div style={{ fontFamily: fonts.heading, fontSize: scaledFontSize(22, "heading"), fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        {sender.fullName || "Your Name"}
      </div>
      {sender.jobTitle && (
        <div style={{ fontFamily: fonts.body, fontSize: scaledFontSize(12, "body"), color: accent, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.2 }}>
          {sender.jobTitle}
        </div>
      )}
      {contactParts.length > 0 && (
        <div style={{ fontFamily: fonts.body, fontSize: scaledFontSize(10, "label"), color: "#6b7280", marginBottom: 4 }}>
          {contactParts.join("  ·  ")}
        </div>
      )}
      <div style={{ height: 1, background: "#e5e7eb", marginTop: 12, marginBottom: 20 }} />
    </div>
  );
}

function HeaderBanner({ form, accent, fonts, margin }: {
  form: CoverLetterFormData; accent: string; fonts: { heading: string; body: string }; margin: number;
}) {
  const { sender } = form;
  const contactParts = [sender.email, sender.phone, sender.location].filter(Boolean);

  return (
    <div data-cl-section="header">
      <div style={{ background: accent, padding: `24px ${margin}px`, marginBottom: 20 }}>
        <div style={{ fontFamily: fonts.heading, fontSize: scaledFontSize(24, "heading"), fontWeight: 700, color: "#ffffff" }}>
          {sender.fullName || "Your Name"}
        </div>
        {sender.jobTitle && (
          <div style={{ fontFamily: fonts.body, fontSize: scaledFontSize(12, "body"), color: "rgba(255,255,255,0.85)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>
            {sender.jobTitle}
          </div>
        )}
        {contactParts.length > 0 && (
          <div style={{ fontFamily: fonts.body, fontSize: scaledFontSize(10, "label"), color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
            {contactParts.join("  ·  ")}
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderSidebar({ form, accent, fonts, margin, pageDim }: {
  form: CoverLetterFormData; accent: string; fonts: { heading: string; body: string }; margin: number; pageDim: { w: number; h: number };
}) {
  const { sender } = form;
  const sidebarW = 200;
  const contactItems = [
    { label: "Email", value: sender.email },
    { label: "Phone", value: sender.phone },
    { label: "Location", value: sender.location },
    { label: "LinkedIn", value: sender.linkedIn },
    { label: "Website", value: sender.website },
  ].filter((c) => c.value);

  return (
    <div data-cl-section="header" style={{ display: "flex", minHeight: 160 }}>
      <div style={{ width: sidebarW, background: accent, padding: `${margin}px 20px`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontFamily: fonts.heading, fontSize: scaledFontSize(18, "heading"), fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
          {sender.fullName || "Your Name"}
        </div>
        {sender.jobTitle && (
          <div style={{ fontFamily: fonts.body, fontSize: scaledFontSize(10, "body"), color: "rgba(255,255,255,0.85)", marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            {sender.jobTitle}
          </div>
        )}
        {contactItems.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {contactItems.map((c, i) => (
              <div key={i} style={{ fontFamily: fonts.body, fontSize: scaledFontSize(9, "label"), color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>
                {c.value}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1, width: pageDim.w - sidebarW }} />
    </div>
  );
}

function HeaderMinimal({ form, accent, fonts, margin }: {
  form: CoverLetterFormData; accent: string; fonts: { heading: string; body: string }; margin: number;
}) {
  const { sender } = form;
  const contactParts = [sender.email, sender.phone, sender.location].filter(Boolean);

  return (
    <div data-cl-section="header" style={{ padding: `${margin}px ${margin}px 0 ${margin}px` }}>
      <div style={{ fontFamily: fonts.heading, fontSize: scaledFontSize(18, "heading"), fontWeight: 600, color: "#111827", marginBottom: 4 }}>
        {sender.fullName || "Your Name"}
      </div>
      {contactParts.length > 0 && (
        <div style={{ fontFamily: fonts.body, fontSize: scaledFontSize(10, "label"), color: "#9ca3af", marginBottom: 16 }}>
          {contactParts.join("  |  ")}
        </div>
      )}
    </div>
  );
}

function HeaderBoxed({ form, accent, fonts, margin }: {
  form: CoverLetterFormData; accent: string; fonts: { heading: string; body: string }; margin: number;
}) {
  const { sender } = form;
  const contactParts = [sender.email, sender.phone, sender.location, sender.linkedIn].filter(Boolean);

  return (
    <div data-cl-section="header" style={{ padding: `${margin}px ${margin}px 0 ${margin}px` }}>
      <div style={{ border: `2px solid ${accent}`, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ fontFamily: fonts.heading, fontSize: scaledFontSize(20, "heading"), fontWeight: 700, color: accent, marginBottom: 4 }}>
          {sender.fullName || "Your Name"}
        </div>
        {sender.jobTitle && (
          <div style={{ fontFamily: fonts.body, fontSize: scaledFontSize(11, "body"), color: "#374151", marginBottom: 6 }}>
            {sender.jobTitle}
          </div>
        )}
        {contactParts.length > 0 && (
          <div style={{ fontFamily: fonts.body, fontSize: scaledFontSize(10, "label"), color: "#6b7280" }}>
            {contactParts.join("  ·  ")}
          </div>
        )}
      </div>
    </div>
  );
}

const HEADER_MAP: Record<HeaderStyleId, React.FC<{
  form: CoverLetterFormData; accent: string; fonts: { heading: string; body: string }; margin: number; pageDim: { w: number; h: number };
}>> = {
  standard: HeaderStandard,
  banner: HeaderBanner,
  sidebar: HeaderSidebar,
  minimal: HeaderMinimal,
  boxed: HeaderBoxed,
};

// ━━━ Renderer Props ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CoverLetterRendererProps {
  form: CoverLetterFormData;
  onPageCount?: (count: number) => void;
  pageGap?: number;
}

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CoverLetterRenderer({ form, onPageCount, pageGap = PAGE_GAP }: CoverLetterRendererProps) {
  const pageDim = PAGE_PX[form.printConfig.pageSize] || PAGE_PX.a4;
  const margin = MARGIN_MAP[form.printConfig.margins] || MARGIN_MAP.standard;
  const lineHeight = LINE_HEIGHT_MAP[form.printConfig.lineSpacing] || LINE_HEIGHT_MAP.normal;
  const accent = form.style.accentColor;
  const fonts = getFonts(form.style.fontPairing);
  const fontUrl = getGoogleFontUrl(form.style.fontPairing);
  const settings = getAdvancedSettings();

  const bodySize = scaledFontSize(12, "body");
  const sectionGap = form.printConfig.sectionSpacing;

  // Overflow-based pagination
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const lastReportedCount = useRef(0);
  const onPageCountRef = useRef(onPageCount);
  onPageCountRef.current = onPageCount;

  const contentH = pageDim.h - FOOTER_H;

  // Whether header style takes full-width (no padding around it)
  const isFullWidthHeader = form.style.headerStyle === "banner" || form.style.headerStyle === "sidebar";

  // Recalculate pages
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const totalH = el.scrollHeight;
    const count = Math.max(1, Math.ceil(totalH / contentH));
    setPageCount(count);
    if (count !== lastReportedCount.current) {
      lastReportedCount.current = count;
      onPageCountRef.current?.(count);
    }
  });

  // Build recipient block
  const recipientBlock = useMemo(() => {
    const { recipient } = form;
    if (!form.style.showRecipientAddress) return null;
    const lines = [
      recipient.hiringManagerName,
      recipient.hiringManagerTitle,
      recipient.department && recipient.companyName ? `${recipient.department}, ${recipient.companyName}` : recipient.companyName || recipient.department,
      recipient.companyAddress,
    ].filter(Boolean);
    if (lines.length === 0) return null;

    return (
      <div data-cl-section="recipient" style={{ marginBottom: sectionGap, fontFamily: fonts.body, fontSize: scaledFontSize(11, "body"), color: "#374151", lineHeight: 1.6 }}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    );
  }, [form, fonts, sectionGap]);

  // Date block
  const dateBlock = form.style.showDate && form.date ? (
    <div data-cl-section="date" style={{ marginBottom: sectionGap, fontFamily: fonts.body, fontSize: scaledFontSize(11, "body"), color: "#6b7280" }}>
      {formatDate(form.date)}
    </div>
  ) : null;

  // Subject line
  const subjectBlock = form.style.showSubjectLine && form.style.subjectLine ? (
    <div data-cl-section="subject" style={{ marginBottom: sectionGap, fontFamily: fonts.heading, fontSize: scaledFontSize(12, "body"), fontWeight: 600, color: "#111827" }}>
      Re: {form.style.subjectLine}
    </div>
  ) : null;

  // Salutation
  const salutationBlock = (
    <div data-cl-section="salutation" style={{ marginBottom: sectionGap - 4, fontFamily: fonts.body, fontSize: bodySize, fontWeight: 500, color: "#111827" }}>
      {form.content.salutation || "Dear Hiring Manager,"}
    </div>
  );

  // Body paragraphs
  const bodyParagraphStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: bodySize,
    color: "#374151",
    lineHeight,
    marginBottom: sectionGap,
    textAlign: "justify" as const,
  };

  const openingBlock = form.content.openingHook ? (
    <div data-cl-section="opening" style={bodyParagraphStyle}>
      {form.content.openingHook}
    </div>
  ) : (
    <div data-cl-section="opening" style={{ ...bodyParagraphStyle, color: "#9ca3af", fontStyle: "italic" }}>
      [Opening paragraph — introduce yourself and state the position you are applying for. Lead with a strong hook: a key achievement, a compelling reason for your interest, or a mutual connection.]
    </div>
  );

  const qualificationsBlock = form.content.bodyQualifications ? (
    <div data-cl-section="qualifications" style={bodyParagraphStyle}>
      {form.content.bodyQualifications}
    </div>
  ) : (
    <div data-cl-section="qualifications" style={{ ...bodyParagraphStyle, color: "#9ca3af", fontStyle: "italic" }}>
      [Qualifications paragraph — connect your skills and experience to the job requirements. Use specific examples and quantified achievements to demonstrate your fit.]
    </div>
  );

  const companyFitBlock = form.content.bodyCompanyFit ? (
    <div data-cl-section="company-fit" style={bodyParagraphStyle}>
      {form.content.bodyCompanyFit}
    </div>
  ) : (
    <div data-cl-section="company-fit" style={{ ...bodyParagraphStyle, color: "#9ca3af", fontStyle: "italic" }}>
      [Company fit paragraph — demonstrate your knowledge of the company and explain why you are passionate about this specific organization and role.]
    </div>
  );

  const closingBlock = form.content.closingCallToAction ? (
    <div data-cl-section="closing" style={bodyParagraphStyle}>
      {form.content.closingCallToAction}
    </div>
  ) : (
    <div data-cl-section="closing" style={{ ...bodyParagraphStyle, color: "#9ca3af", fontStyle: "italic" }}>
      [Closing paragraph — thank the reader, express enthusiasm, and include a clear call to action such as requesting an interview or follow-up conversation.]
    </div>
  );

  // Sign off
  const signOffBlock = (
    <div data-cl-section="signoff" style={{ marginTop: sectionGap + 4 }}>
      <div style={{ fontFamily: fonts.body, fontSize: bodySize, color: "#374151", marginBottom: 28 }}>
        {form.content.signOff || "Sincerely,"}
      </div>
      <div style={{ fontFamily: fonts.heading, fontSize: scaledFontSize(13, "body"), fontWeight: 600, color: "#111827" }}>
        {form.sender.fullName || "Your Name"}
      </div>
    </div>
  );

  // PS block
  const psBlock = form.content.postScript ? (
    <div data-cl-section="ps" style={{ marginTop: sectionGap, fontFamily: fonts.body, fontSize: scaledFontSize(10, "label"), color: "#6b7280", fontStyle: "italic" }}>
      P.S. {form.content.postScript}
    </div>
  ) : null;

  const HeaderComponent = HEADER_MAP[form.style.headerStyle] || HEADER_MAP.standard;

  // Border style for page
  const pageBorder = form.style.showPageBorder ? `1px solid ${accent}20` : "none";

  // Render pages
  return (
    <>
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: pageGap }}>
        {Array.from({ length: pageCount }, (_, pageIdx) => (
          <div
            key={`page-${pageIdx}`}
            data-cl-page={pageIdx + 1}
            className="bg-white shadow-2xl shadow-black/20"
            style={{
              width: pageDim.w,
              height: pageDim.h,
              overflow: "hidden",
              position: "relative",
              border: pageBorder,
            }}
          >
            {/* Content container with overflow clipping */}
            <div
              style={{ width: pageDim.w, height: contentH, overflow: "hidden" }}
            >
              <div
                ref={pageIdx === 0 ? contentRef : undefined}
                style={{ marginTop: pageIdx === 0 ? 0 : -(pageIdx * contentH) }}
              >
                {/* Header */}
                <HeaderComponent
                  form={form}
                  accent={accent}
                  fonts={fonts}
                  margin={margin}
                  pageDim={pageDim}
                />

                {/* Content area */}
                <div style={{
                  padding: isFullWidthHeader ? `0 ${margin}px` : `0 ${margin}px`,
                }}>
                  {recipientBlock}
                  {dateBlock}
                  {subjectBlock}
                  {salutationBlock}
                  {openingBlock}
                  {qualificationsBlock}
                  {companyFitBlock}
                  {closingBlock}
                  {signOffBlock}
                  {psBlock}
                </div>
              </div>
            </div>

            {/* Footer */}
            {pageCount > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: FOOTER_H,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTop: "1px solid #f3f4f6",
                  fontFamily: fonts.body,
                  fontSize: 9,
                  color: "#9ca3af",
                }}
              >
                Page {pageIdx + 1} of {pageCount}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ━━━ Print HTML builder ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function buildPrintHTML(form: CoverLetterFormData): string {
  const pageDim = PAGE_PX[form.printConfig.pageSize] || PAGE_PX.a4;
  const pageSizeName = form.printConfig.pageSize === "letter" ? "letter" : form.printConfig.pageSize === "a5" ? "A5" : "A4";
  const margin = MARGIN_MAP[form.printConfig.margins] || MARGIN_MAP.standard;
  const lineHeight = LINE_HEIGHT_MAP[form.printConfig.lineSpacing] || LINE_HEIGHT_MAP.normal;
  const accent = form.style.accentColor;
  const fonts = getFonts(form.style.fontPairing);
  const fontUrl = getGoogleFontUrl(form.style.fontPairing);
  const bodySize = 12;
  const sectionGap = form.printConfig.sectionSpacing;

  const { sender, recipient, content } = form;
  const contactParts = [sender.email, sender.phone, sender.location, sender.linkedIn, sender.website].filter(Boolean);
  const recipientLines = [
    recipient.hiringManagerName,
    recipient.hiringManagerTitle,
    recipient.department && recipient.companyName ? `${recipient.department}, ${recipient.companyName}` : recipient.companyName || recipient.department,
    recipient.companyAddress,
  ].filter(Boolean);

  // Build header based on style
  let headerHTML = "";
  const hs = form.style.headerStyle;

  if (hs === "banner") {
    headerHTML = `
      <div style="background: ${accent}; padding: 24px ${margin}px; margin-bottom: 20px;">
        <div style="font-family: '${fonts.heading}', serif; font-size: 24px; font-weight: 700; color: #fff;">${sender.fullName || "Your Name"}</div>
        ${sender.jobTitle ? `<div style="font-family: '${fonts.body}', sans-serif; font-size: 12px; color: rgba(255,255,255,0.85); margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">${sender.jobTitle}</div>` : ""}
        ${contactParts.length > 0 ? `<div style="font-family: '${fonts.body}', sans-serif; font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 6px;">${contactParts.join("  ·  ")}</div>` : ""}
      </div>`;
  } else if (hs === "boxed") {
    headerHTML = `
      <div style="padding: ${margin}px ${margin}px 0 ${margin}px;">
        <div style="border: 2px solid ${accent}; padding: 16px 20px; margin-bottom: 20px;">
          <div style="font-family: '${fonts.heading}', serif; font-size: 20px; font-weight: 700; color: ${accent};">${sender.fullName || "Your Name"}</div>
          ${sender.jobTitle ? `<div style="font-family: '${fonts.body}', sans-serif; font-size: 11px; color: #374151; margin-bottom: 6px;">${sender.jobTitle}</div>` : ""}
          ${contactParts.length > 0 ? `<div style="font-family: '${fonts.body}', sans-serif; font-size: 10px; color: #6b7280;">${contactParts.join("  ·  ")}</div>` : ""}
        </div>
      </div>`;
  } else if (hs === "minimal") {
    headerHTML = `
      <div style="padding: ${margin}px ${margin}px 0 ${margin}px;">
        <div style="font-family: '${fonts.heading}', serif; font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 4px;">${sender.fullName || "Your Name"}</div>
        ${contactParts.length > 0 ? `<div style="font-family: '${fonts.body}', sans-serif; font-size: 10px; color: #9ca3af; margin-bottom: 16px;">${contactParts.join("  |  ")}</div>` : ""}
      </div>`;
  } else {
    // standard
    headerHTML = `
      <div style="padding: ${margin}px ${margin}px 0 ${margin}px;">
        ${form.style.showLetterheadBar ? `<div style="height: 4px; background: ${accent}; margin-bottom: 20px; border-radius: 2px;"></div>` : ""}
        <div style="font-family: '${fonts.heading}', serif; font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 4px;">${sender.fullName || "Your Name"}</div>
        ${sender.jobTitle ? `<div style="font-family: '${fonts.body}', sans-serif; font-size: 12px; color: ${accent}; font-weight: 500; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1.2px;">${sender.jobTitle}</div>` : ""}
        ${contactParts.length > 0 ? `<div style="font-family: '${fonts.body}', sans-serif; font-size: 10px; color: #6b7280; margin-bottom: 4px;">${contactParts.join("  ·  ")}</div>` : ""}
        <div style="height: 1px; background: #e5e7eb; margin-top: 12px; margin-bottom: 20px;"></div>
      </div>`;
  }

  // Recipient
  let recipientHTML = "";
  if (form.style.showRecipientAddress && recipientLines.length > 0) {
    recipientHTML = `
      <div style="margin-bottom: ${sectionGap}px; font-family: '${fonts.body}', sans-serif; font-size: 11px; color: #374151; line-height: 1.6;">
        ${recipientLines.map((l) => `<div>${l}</div>`).join("")}
      </div>`;
  }

  // Date
  const dateHTML = form.style.showDate && form.date ?
    `<div style="margin-bottom: ${sectionGap}px; font-family: '${fonts.body}', sans-serif; font-size: 11px; color: #6b7280;">${formatDate(form.date)}</div>` : "";

  // Subject
  const subjectHTML = form.style.showSubjectLine && form.style.subjectLine ?
    `<div style="margin-bottom: ${sectionGap}px; font-family: '${fonts.heading}', serif; font-size: 12px; font-weight: 600; color: #111827;">Re: ${form.style.subjectLine}</div>` : "";

  // Body paragraphs
  const paraStyle = `font-family: '${fonts.body}', sans-serif; font-size: ${bodySize}px; color: #374151; line-height: ${lineHeight}; margin-bottom: ${sectionGap}px; text-align: justify;`;

  const paragraphs = [
    content.openingHook,
    content.bodyQualifications,
    content.bodyCompanyFit,
    content.closingCallToAction,
  ].filter(Boolean);

  const bodyHTML = paragraphs.map((p) => `<div style="${paraStyle}">${p}</div>`).join("");

  // Sign off
  const signOffHTML = `
    <div style="margin-top: ${sectionGap + 4}px;">
      <div style="font-family: '${fonts.body}', sans-serif; font-size: ${bodySize}px; color: #374151; margin-bottom: 28px;">${content.signOff || "Sincerely,"}</div>
      <div style="font-family: '${fonts.heading}', serif; font-size: 13px; font-weight: 600; color: #111827;">${sender.fullName || "Your Name"}</div>
    </div>`;

  // PS
  const psHTML = content.postScript ?
    `<div style="margin-top: ${sectionGap}px; font-family: '${fonts.body}', sans-serif; font-size: 10px; color: #6b7280; font-style: italic;">P.S. ${content.postScript}</div>` : "";

  const borderStyle = form.style.showPageBorder ? `border: 1px solid ${accent}20;` : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${sender.fullName || "Cover Letter"} — Cover Letter</title>
  <link rel="stylesheet" href="${fontUrl}" />
  <style>
    @page { size: ${pageSizeName}; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${pageDim.w}px; }
    body { background: #fff; }
    .page { width: ${pageDim.w}px; min-height: ${pageDim.h}px; ${borderStyle} }
    @media print {
      .page { page-break-after: always; }
      [data-cl-section] { outline: none !important; box-shadow: none !important; cursor: default !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    ${headerHTML}
    <div style="padding: 0 ${margin}px ${margin}px ${margin}px;">
      ${recipientHTML}
      ${dateHTML}
      ${subjectHTML}
      <div style="margin-bottom: ${sectionGap - 4}px; font-family: '${fonts.body}', sans-serif; font-size: ${bodySize}px; font-weight: 500; color: #111827;">${content.salutation || "Dear Hiring Manager,"}</div>
      ${bodyHTML}
      ${signOffHTML}
      ${psHTML}
    </div>
  </div>
</body>
</html>`;
}
