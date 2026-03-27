// =============================================================================
// DMSuite — Certificate Designer Renderer
// Pure HTML/CSS renderer with 8 high-fidelity templates matching reference SVGs.
// Each template has unique decorative borders, backgrounds, and typography.
// Optimized for print at 300 DPI. Fully editable — all text from form data.
// =============================================================================

"use client";

import { useEffect, useMemo } from "react";
import type {
  CertificateFormData,
  CertificateTemplate,
  SealStyle,
  PageOrientation,
} from "@/stores/certificate-editor";
import { CERTIFICATE_FONT_PAIRINGS } from "@/stores/certificate-editor";
import { scaledFontSize } from "@/stores/advanced-helpers";

// ━━━ Page Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PAGE_PX: Record<string, { w: number; h: number }> = {
  a4: { w: 1123, h: 794 },         // A4 landscape
  letter: { w: 1056, h: 816 },     // Letter landscape
  a5: { w: 794, h: 559 },          // A5 landscape
  "a4-portrait": { w: 794, h: 1123 },
  "letter-portrait": { w: 816, h: 1056 },
  "a5-portrait": { w: 559, h: 794 },
};

export const PAGE_GAP = 16;

// ━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getGoogleFontUrl(fontPairingId: string): string | null {
  const pair = CERTIFICATE_FONT_PAIRINGS[fontPairingId];
  if (!pair) return null;
  return `https://fonts.googleapis.com/css2?family=${pair.google}&display=swap`;
}

function getFontFamily(fontPairingId: string, role: "heading" | "body"): string {
  const pair = CERTIFICATE_FONT_PAIRINGS[fontPairingId];
  if (!pair) return role === "heading" ? "Playfair Display, serif" : "Lato, sans-serif";
  return role === "heading" ? `"${pair.heading}", serif` : `"${pair.body}", sans-serif`;
}

function getPageKey(pageSize: string, orientation: PageOrientation): string {
  if (orientation === "portrait") return `${pageSize}-portrait`;
  return pageSize;
}

/** Darken/lighten hex color */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

// ━━━ Background Patterns ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBgCSS(template: CertificateTemplate, accent: string): React.CSSProperties {
  switch (template) {
    case "classic-blue":
      return {
        background: `repeating-linear-gradient(-45deg, #f5f5f5, #f5f5f5 2px, #eeeeee 2px, #eeeeee 4px)`,
      };
    case "burgundy-ornate":
      return { background: "#ffffff" };
    case "antique-parchment":
      return { background: `linear-gradient(180deg, #d8cdb8 0%, #cec3ab 50%, #d8cdb8 100%)` };
    case "golden-appreciation":
      return {
        background: `radial-gradient(circle at 50% 50%, rgba(184,134,11,0.04) 0%, transparent 70%), #faf6ef`,
      };
    case "silver-weave":
      return {
        background: `repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.02) 8px, rgba(0,0,0,0.02) 9px), #ffffff`,
      };
    case "vintage-warm":
      return {
        background: `repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(93,58,26,0.04) 5px, rgba(93,58,26,0.04) 6px), linear-gradient(180deg, #f5ead0 0%, #efe2c4 100%)`,
      };
    case "teal-regal":
      return { background: "#ffffff" };
    case "botanical-modern":
      return { background: "#ffffff" };
    default:
      return { background: "#ffffff" };
  }
}

// ━━━ Seal Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CertificateSeal({ text, style, accent, size = 90 }: { text: string; style: SealStyle; accent: string; size?: number }) {
  if (style === "none") return null;

  const sealColors: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
    gold: { bg: "linear-gradient(135deg, #d4a843 0%, #b8860b 50%, #d4a843 100%)", border: "#92710a", text: "#ffffff", shadow: "0 2px 8px rgba(184, 134, 11, 0.3)" },
    silver: { bg: "linear-gradient(135deg, #c0c0c0 0%, #808080 50%, #c0c0c0 100%)", border: "#606060", text: "#ffffff", shadow: "0 2px 8px rgba(128, 128, 128, 0.3)" },
    embossed: { bg: `linear-gradient(135deg, ${hexToRgba(accent, 0.15)} 0%, ${hexToRgba(accent, 0.08)} 100%)`, border: accent, text: accent, shadow: `inset 0 1px 2px ${hexToRgba(accent, 0.2)}` },
    stamp: { bg: "transparent", border: "#c0392b", text: "#c0392b", shadow: "none" },
  };

  const c = sealColors[style] || sealColors.gold;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: c.bg,
        border: `2px solid ${c.border}`,
        boxShadow: c.shadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Outer ring for stamp style */}
      {style === "stamp" && (
        <div
          style={{
            position: "absolute",
            inset: 3,
            borderRadius: "50%",
            border: `1.5px solid ${c.border}`,
          }}
        />
      )}
      {/* Inner ring */}
      <div
        style={{
          position: "absolute",
          inset: style === "stamp" ? 7 : 5,
          borderRadius: "50%",
          border: `1px solid ${style === "stamp" ? c.border : hexToRgba("#ffffff", 0.4)}`,
        }}
      />
      {/* Text */}
      <span
        style={{
          fontSize: Math.max(8, size * 0.12),
          fontWeight: 700,
          color: c.text,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          textAlign: "center",
          lineHeight: 1.2,
          padding: "0 8px",
          zIndex: 1,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ━━━ Decorative Elements ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function OrnamentDivider({ accent, width = 200 }: { accent: string; width?: number }) {
  return (
    <svg width={width} height="12" viewBox={`0 0 ${width} 12`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="6" x2={width * 0.35} y2="6" stroke={accent} strokeWidth="1" opacity="0.4" />
      <circle cx={width * 0.38} cy="6" r="2" fill={accent} opacity="0.5" />
      <path d={`M${width * 0.42},6 L${width * 0.5},2 L${width * 0.58},6 L${width * 0.5},10 Z`} fill={accent} opacity="0.3" />
      <circle cx={width * 0.62} cy="6" r="2" fill={accent} opacity="0.5" />
      <line x1={width * 0.65} y1="6" x2={width} y2="6" stroke={accent} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

function AccentCornerDecoration({ accent, position }: { accent: string; position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const transforms: Record<string, string> = {
    "top-left": "none",
    "top-right": "scaleX(-1)",
    "bottom-left": "scaleY(-1)",
    "bottom-right": "scale(-1)",
  };
  const positions: Record<string, React.CSSProperties> = {
    "top-left": { top: 20, left: 20 },
    "top-right": { top: 20, right: 20 },
    "bottom-left": { bottom: 20, left: 20 },
    "bottom-right": { bottom: 20, right: 20 },
  };

  return (
    <svg
      width="60" height="60" viewBox="0 0 60 60" fill="none"
      style={{ position: "absolute", ...positions[position], transform: transforms[position], pointerEvents: "none" }}
    >
      <path d="M0 0 L60 0 L60 8 L8 8 L8 60 L0 60 Z" fill={accent} opacity="0.7" />
      <path d="M0 0 L40 0 L40 4 L4 4 L4 40 L0 40 Z" fill={accent} opacity="0.3" />
    </svg>
  );
}

function BoldStripeDecoration({ accent, width, position }: { accent: string; width: number; position: "top" | "bottom" }) {
  const posStyle: React.CSSProperties = position === "top"
    ? { position: "absolute", top: 0, left: 0, right: 0 }
    : { position: "absolute", bottom: 0, left: 0, right: 0 };

  return (
    <div style={posStyle}>
      <div style={{ height: 6, background: accent }} />
      <div style={{ height: 3, background: adjustColor(accent, 40), marginTop: 2 }} />
    </div>
  );
}

// ━━━ Signature Block ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SignatureBlock({ name, title, organization, accent, bodyFont }: {
  name: string;
  title: string;
  organization: string;
  accent: string;
  bodyFont: string;
}) {
  return (
    <div style={{ textAlign: "center", minWidth: 160, maxWidth: 220 }}>
      {/* Signature line */}
      <div
        style={{
          width: "100%",
          borderBottom: `1.5px solid ${hexToRgba("#333333", 0.4)}`,
          marginBottom: 6,
          height: 40,
        }}
      />
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", fontFamily: bodyFont, lineHeight: 1.4 }}>
        {name || "_______________"}
      </div>
      {title && (
        <div style={{ fontSize: 10, color: "#666666", fontFamily: bodyFont, lineHeight: 1.4, marginTop: 2 }}>
          {title}
        </div>
      )}
      {organization && (
        <div style={{ fontSize: 9, color: "#888888", fontFamily: bodyFont, lineHeight: 1.4, marginTop: 1 }}>
          {organization}
        </div>
      )}
    </div>
  );
}

// ━━━ Props ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CertificateRendererProps {
  data: CertificateFormData;
  onPageCount?: (count: number) => void;
  pageGap?: number;
}

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CertificateRenderer({ data, onPageCount, pageGap = PAGE_GAP }: CertificateRendererProps) {
  const settings = getAdvancedSettings();

  const pageKey = getPageKey(data.format.pageSize, data.format.orientation);
  const pageDims = PAGE_PX[pageKey] || PAGE_PX.a4;
  const accent = data.style.accentColor;
  const headingFont = getFontFamily(data.style.fontPairing, "heading");
  const bodyFont = getFontFamily(data.style.fontPairing, "body");
  const fontUrl = getGoogleFontUrl(data.style.fontPairing);

  const marginMap = { narrow: 40, standard: 60, wide: 80 };
  const margin = marginMap[data.format.margins] || 60;

  const isLandscape = data.format.orientation === "landscape";
  const contentW = pageDims.w - margin * 2;
  const contentH = pageDims.h - margin * 2;

  // Font scale from advanced settings
  const titleSize = scaledFontSize(isLandscape ? 36 : 32, "heading") * data.style.fontScale;
  const subtitleSize = scaledFontSize(isLandscape ? 14 : 13, "body") * data.style.fontScale;
  const nameSize = scaledFontSize(isLandscape ? 32 : 28, "heading") * data.style.fontScale;
  const descSize = scaledFontSize(isLandscape ? 13 : 12, "body") * data.style.fontScale;
  const orgSize = scaledFontSize(isLandscape ? 16 : 14, "heading") * data.style.fontScale;

  // Certificate is always 1 page
  useEffect(() => {
    onPageCount?.(1);
  }, [onPageCount]);

  const bgStyle = useMemo(() => getBackgroundCSS(data.style.template, accent), [data.style.template, accent]);

  return (
    <>
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}

      <div className="flex flex-col items-center" style={{ gap: pageGap }}>
        <div
          data-cert-page={1}
          className="shadow-2xl shadow-black/20"
          style={{
            width: pageDims.w,
            height: pageDims.h,
            ...bgStyle,
            position: "relative",
            overflow: "hidden",
            fontFamily: bodyFont,
          }}
        >
          {/* ── Border Decoration ── */}
          <div style={getBorderCSS(data.style.borderStyle, accent, pageDims.w, pageDims.h)} />

          {/* ── Accent Corner Decorations (for accent-corner template) ── */}
          {data.style.borderStyle === "accent-corner" && (
            <>
              <AccentCornerDecoration accent={accent} position="top-left" />
              <AccentCornerDecoration accent={accent} position="top-right" />
              <AccentCornerDecoration accent={accent} position="bottom-left" />
              <AccentCornerDecoration accent={accent} position="bottom-right" />
            </>
          )}

          {/* ── Bold Stripe Decorations ── */}
          {data.style.borderStyle === "bold-stripe" && (
            <>
              <BoldStripeDecoration accent={accent} width={pageDims.w} position="top" />
              <BoldStripeDecoration accent={accent} width={pageDims.w} position="bottom" />
            </>
          )}

          {/* ── Content Area ── */}
          <div
            style={{
              position: "absolute",
              top: margin,
              left: margin,
              width: contentW,
              height: contentH,
              display: "flex",
              flexDirection: "column",
              alignItems: data.style.headerStyle === "left-aligned" ? "flex-start" : "center",
              justifyContent: "center",
              textAlign: data.style.headerStyle === "left-aligned" ? "left" : "center",
              gap: isLandscape ? 12 : 10,
            }}
          >
            {/* ── Organization Name ── */}
            {data.organizationName && (
              <div data-cert-section="organization">
                <div
                  style={{
                    fontSize: orgSize,
                    fontWeight: 700,
                    color: accent,
                    fontFamily: headingFont,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    lineHeight: 1.3,
                  }}
                >
                  {data.organizationName}
                </div>
                {data.organizationSubtitle && (
                  <div
                    style={{
                      fontSize: subtitleSize * 0.85,
                      color: "#666666",
                      fontFamily: bodyFont,
                      letterSpacing: "0.04em",
                      marginTop: 2,
                    }}
                  >
                    {data.organizationSubtitle}
                  </div>
                )}
              </div>
            )}

            {/* ── Top Divider ── */}
            <OrnamentDivider accent={accent} width={Math.min(contentW * 0.5, 250)} />

            {/* ── Certificate Title ── */}
            <div data-cert-section="title" style={{ marginTop: 4, marginBottom: 4 }}>
              <h1
                style={{
                  fontSize: titleSize,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  fontFamily: headingFont,
                  letterSpacing: "0.04em",
                  lineHeight: 1.15,
                  margin: 0,
                  textTransform: data.style.template === "sports-athletics" ? "uppercase" : "none",
                }}
              >
                {data.title || "Certificate of Achievement"}
              </h1>
            </div>

            {/* ── Subtitle / Presented to ── */}
            <div data-cert-section="subtitle">
              <p
                style={{
                  fontSize: subtitleSize,
                  color: "#555555",
                  fontFamily: bodyFont,
                  fontStyle: data.style.template === "elegant-script" ? "italic" : "normal",
                  letterSpacing: "0.06em",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {data.subtitle || "This certificate is proudly presented to"}
              </p>
            </div>

            {/* ── Recipient Name ── */}
            <div data-cert-section="recipient" style={{ margin: "4px 0" }}>
              <div
                style={{
                  fontSize: nameSize,
                  fontWeight: 700,
                  color: accent,
                  fontFamily: headingFont,
                  lineHeight: 1.2,
                  borderBottom: `2px solid ${hexToRgba(accent, 0.3)}`,
                  paddingBottom: 6,
                  display: "inline-block",
                  minWidth: Math.min(contentW * 0.5, 300),
                }}
              >
                {data.recipientName || "Recipient Name"}
              </div>
            </div>

            {/* ── Description ── */}
            {data.description && (
              <div data-cert-section="description" style={{ maxWidth: Math.min(contentW * 0.75, 600) }}>
                <p
                  style={{
                    fontSize: descSize,
                    color: "#444444",
                    fontFamily: bodyFont,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {data.description}
                </p>
              </div>
            )}

            {/* ── Event / Course Name ── */}
            {(data.eventName || data.courseName) && (
              <div data-cert-section="event">
                {data.eventName && (
                  <p style={{ fontSize: descSize, fontWeight: 600, color: "#333333", fontFamily: bodyFont, margin: "2px 0", lineHeight: 1.4 }}>
                    {data.eventName}
                  </p>
                )}
                {data.courseName && (
                  <p style={{ fontSize: descSize * 0.9, color: "#555555", fontFamily: bodyFont, margin: "2px 0", lineHeight: 1.4 }}>
                    {data.courseName}
                  </p>
                )}
              </div>
            )}

            {/* ── Additional Text ── */}
            {data.additionalText && (
              <div data-cert-section="additional">
                <p style={{ fontSize: descSize * 0.9, color: "#666666", fontFamily: bodyFont, lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
                  {data.additionalText}
                </p>
              </div>
            )}

            {/* ── Date ── */}
            {data.dateIssued && (
              <div data-cert-section="date" style={{ marginTop: 4 }}>
                <p style={{ fontSize: 11, color: "#666666", fontFamily: bodyFont, margin: 0 }}>
                  Issued on {formatDate(data.dateIssued)}
                  {data.validUntil && ` · Valid until ${formatDate(data.validUntil)}`}
                </p>
              </div>
            )}

            {/* ── Bottom Divider ── */}
            <OrnamentDivider accent={accent} width={Math.min(contentW * 0.4, 200)} />

            {/* ── Signatories & Seal Row ── */}
            <div
              data-cert-section="signatories"
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: isLandscape ? 60 : 40,
                width: "100%",
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {/* Left signatories */}
              {data.signatories.slice(0, Math.ceil(data.signatories.length / 2)).map((sig) => (
                <SignatureBlock
                  key={sig.id}
                  name={sig.name}
                  title={sig.title}
                  organization={sig.organization}
                  accent={accent}
                  bodyFont={bodyFont}
                />
              ))}

              {/* Seal (centered between signatories) */}
              {data.showSeal && (
                <CertificateSeal
                  text={data.sealText || "OFFICIAL"}
                  style={data.sealStyle}
                  accent={accent}
                  size={isLandscape ? 85 : 75}
                />
              )}

              {/* Right signatories */}
              {data.signatories.slice(Math.ceil(data.signatories.length / 2)).map((sig) => (
                <SignatureBlock
                  key={sig.id}
                  name={sig.name}
                  title={sig.title}
                  organization={sig.organization}
                  accent={accent}
                  bodyFont={bodyFont}
                />
              ))}
            </div>

            {/* ── Reference Number ── */}
            {data.referenceNumber && (
              <div
                data-cert-section="reference"
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 0,
                  fontSize: 8,
                  color: "#999999",
                  fontFamily: bodyFont,
                  letterSpacing: "0.05em",
                }}
              >
                Ref: {data.referenceNumber}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
