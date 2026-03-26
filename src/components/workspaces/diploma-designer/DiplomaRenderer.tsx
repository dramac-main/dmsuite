// =============================================================================
// DMSuite — Diploma & Accreditation Renderer
// Pure HTML/CSS renderer for professional diplomas optimized for print.
// Single-page document (diplomas are always one page).
// Follows CertificateRenderer.tsx architecture exactly.
// =============================================================================

"use client";

import type { DiplomaFormData, DiplomaStyleConfig, DiplomaBorderStyle } from "@/stores/diploma-editor";
import { DIPLOMA_FONT_PAIRINGS, DIPLOMA_TEMPLATES, HONORS_LEVELS } from "@/stores/diploma-editor";
import { scaledFontSize } from "@/stores/advanced-helpers";

// ---------------------------------------------------------------------------
// Page Dimensions (px at 96 DPI for screen rendering)
// ---------------------------------------------------------------------------

export const PAGE_PX: Record<string, { w: number; h: number }> = {
  "a4-landscape": { w: 1123, h: 794 },
  "a4-portrait": { w: 794, h: 1123 },
  "letter-landscape": { w: 1056, h: 816 },
  "letter-portrait": { w: 816, h: 1056 },
  "a5-landscape": { w: 794, h: 559 },
  "a5-portrait": { w: 559, h: 794 },
};

export const PAGE_GAP = 16;

// ---------------------------------------------------------------------------
// Google Fonts URL Helper
// ---------------------------------------------------------------------------

export function getGoogleFontUrl(pairingId: string): string {
  const pairing = DIPLOMA_FONT_PAIRINGS[pairingId];
  if (!pairing) return "";
  return `https://fonts.googleapis.com/css2?family=${pairing.google}&display=swap`;
}

// ---------------------------------------------------------------------------
// Color Helpers
// ---------------------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function adjustColor(hex: string, amount: number): string {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Font Family Helper
// ---------------------------------------------------------------------------

function getFontFamily(pairingId: string, type: "heading" | "body"): string {
  const pairing = DIPLOMA_FONT_PAIRINGS[pairingId];
  if (!pairing) return type === "heading" ? "serif" : "sans-serif";
  return `"${type === "heading" ? pairing.heading : pairing.body}", ${type === "heading" ? "serif" : "sans-serif"}`;
}

// ---------------------------------------------------------------------------
// Date Formatter
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Border CSS Generator
// ---------------------------------------------------------------------------

function getBorderCSS(borderStyle: DiplomaBorderStyle, accent: string): React.CSSProperties {
  switch (borderStyle) {
    case "ornate-classic":
      return {
        border: `3px solid ${accent}`,
        outline: `2px solid ${adjustColor(accent, 40)}`,
        outlineOffset: "6px",
        boxShadow: `inset 0 0 0 1px ${adjustColor(accent, 60)}, inset 0 0 0 8px transparent, inset 0 0 0 9px ${hexToRgba(accent, 0.2)}`,
      };
    case "clean-line":
      return {
        border: `2px solid ${accent}`,
      };
    case "double-frame":
      return {
        border: `3px double ${accent}`,
        outline: `1px solid ${hexToRgba(accent, 0.3)}`,
        outlineOffset: "4px",
      };
    case "thin-elegant":
      return {
        border: `1px solid ${hexToRgba(accent, 0.4)}`,
        boxShadow: `inset 0 0 0 3px transparent, inset 0 0 0 4px ${hexToRgba(accent, 0.15)}`,
      };
    case "official-border":
      return {
        border: `2px solid ${accent}`,
        outline: `2px solid ${accent}`,
        outlineOffset: "3px",
      };
    case "accent-corner":
      return {
        border: `1px solid ${hexToRgba(accent, 0.2)}`,
      };
    case "modern-bracket":
      return {
        borderTop: `3px solid ${accent}`,
        borderBottom: `3px solid ${accent}`,
        borderLeft: `1px solid ${hexToRgba(accent, 0.2)}`,
        borderRight: `1px solid ${hexToRgba(accent, 0.2)}`,
      };
    case "vintage-frame":
      return {
        border: `2px solid ${accent}`,
        boxShadow: `inset 0 0 0 4px ${hexToRgba(accent, 0.08)}, inset 0 0 0 5px ${hexToRgba(accent, 0.2)}`,
      };
    case "none":
    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Background CSS Generator
// ---------------------------------------------------------------------------

function getBackgroundCSS(templateId: string, bgColor: string, accent: string): React.CSSProperties {
  switch (templateId) {
    case "university-classic":
      return {
        background: `radial-gradient(ellipse at 50% 20%, ${hexToRgba(accent, 0.03)} 0%, transparent 70%), ${bgColor}`,
      };
    case "institutional-formal":
      return { backgroundColor: bgColor };
    case "modern-professional":
      return {
        background: `linear-gradient(180deg, ${bgColor} 0%, ${adjustColor(bgColor, -5)} 100%)`,
      };
    case "ivy-league":
      return {
        background: `radial-gradient(ellipse at 50% 30%, ${hexToRgba(accent, 0.04)} 0%, transparent 60%), ${bgColor}`,
      };
    case "executive":
      return {
        background: `linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -8)} 100%)`,
      };
    case "technical-vocational":
      return {
        background: `linear-gradient(180deg, ${adjustColor(bgColor, -2)} 0%, ${bgColor} 30%, ${bgColor} 100%)`,
      };
    case "medical-health":
      return { backgroundColor: bgColor };
    case "legal-bar":
      return {
        background: `radial-gradient(ellipse at 50% 50%, ${hexToRgba(accent, 0.03)} 0%, transparent 50%), ${bgColor}`,
      };
    case "vintage-academic":
      return {
        background: `radial-gradient(ellipse at 50% 20%, ${hexToRgba(accent, 0.05)} 0%, transparent 60%), ${bgColor}`,
      };
    case "international":
      return { backgroundColor: bgColor };
    default:
      return { backgroundColor: bgColor };
  }
}

// ---------------------------------------------------------------------------
// Seal Component
// ---------------------------------------------------------------------------

function DiplomaSeal({ text, style, accent }: { text: string; style: string; accent: string }) {
  const sealColors: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
    gold: {
      bg: "linear-gradient(135deg, #d4a843 0%, #f0d68a 30%, #c9952a 70%, #e8c95a 100%)",
      border: "#b8860b",
      text: "#5c3a08",
      shadow: "0 2px 8px rgba(184, 134, 11, 0.4)",
    },
    silver: {
      bg: "linear-gradient(135deg, #a8a8a8 0%, #e0e0e0 30%, #909090 70%, #c8c8c8 100%)",
      border: "#808080",
      text: "#404040",
      shadow: "0 2px 8px rgba(128, 128, 128, 0.4)",
    },
    embossed: {
      bg: `radial-gradient(circle at 40% 40%, ${adjustColor(accent, 60)} 0%, ${accent} 70%, ${adjustColor(accent, -30)} 100%)`,
      border: adjustColor(accent, -20),
      text: "#ffffff",
      shadow: `0 2px 12px ${hexToRgba(accent, 0.5)}, inset 0 1px 2px rgba(255,255,255,0.3)`,
    },
    stamp: {
      bg: "transparent",
      border: accent,
      text: accent,
      shadow: "none",
    },
  };

  const c = sealColors[style] ?? sealColors.gold;
  const isStamp = style === "stamp";
  const size = 90;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: c.bg,
        border: `${isStamp ? 3 : 2}px ${isStamp ? "double" : "solid"} ${c.border}`,
        boxShadow: c.shadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        position: "relative",
        opacity: isStamp ? 0.7 : 1,
        transform: isStamp ? "rotate(-12deg)" : undefined,
      }}
    >
      {!isStamp && (
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: "50%",
            border: `1px solid ${hexToRgba(c.border, 0.4)}`,
          }}
        />
      )}
      <span
        style={{
          fontSize: text.length > 10 ? 7 : 9,
          fontWeight: 800,
          color: c.text,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          textAlign: "center",
          lineHeight: 1.3,
          padding: "0 8px",
          fontFamily: "serif",
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ornament Divider
// ---------------------------------------------------------------------------

function OrnamentDivider({ color }: { color: string }) {
  return (
    <svg width="200" height="12" viewBox="0 0 200 12" fill="none" style={{ display: "block", margin: "0 auto" }}>
      <path d="M0 6h70c5 0 8-4 12-4s4 4 8 4h2c4 0 4-4 8-4s7 4 12 4h70" stroke={color} strokeWidth="1" opacity="0.5" />
      <circle cx="100" cy="6" r="2.5" fill={color} opacity="0.6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Accent Corner Decoration
// ---------------------------------------------------------------------------

function AccentCornerDecoration({ accent, position }: { accent: string; position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const transforms: Record<string, string> = {
    "top-left": "",
    "top-right": "scaleX(-1)",
    "bottom-left": "scaleY(-1)",
    "bottom-right": "scale(-1,-1)",
  };
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" style={{ position: "absolute", ...({ "top-left": { top: 12, left: 12 }, "top-right": { top: 12, right: 12 }, "bottom-left": { bottom: 12, left: 12 }, "bottom-right": { bottom: 12, right: 12 } }[position]), transform: transforms[position] }}>
      <path d="M0 0 L30 0 Q25 5 20 5 L5 5 Q5 5 5 20 Q5 25 0 30 Z" fill={accent} opacity="0.15" />
      <path d="M0 0 L25 0 Q20 4 16 4 L4 4 Q4 4 4 16 Q4 20 0 25" stroke={accent} strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Signature Block
// ---------------------------------------------------------------------------

function SignatureBlock({ name, title, role, accent }: { name: string; title: string; role: string; accent: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: 160 }}>
      <div style={{ width: 140, borderBottom: `1.5px solid ${hexToRgba(accent, 0.3)}`, margin: "0 auto 6px", height: 30 }} />
      {name && (
        <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>
          {name}
        </div>
      )}
      {title && (
        <div style={{ fontSize: 9.5, color: "#555", marginBottom: 1 }}>
          {title}
        </div>
      )}
      {role && (
        <div style={{ fontSize: 8.5, color: "#888", fontStyle: "italic" }}>
          {role}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Renderer Component
// ---------------------------------------------------------------------------

interface DiplomaRendererProps {
  form: DiplomaFormData;
}

export default function DiplomaRenderer({ form }: DiplomaRendererProps) {
  const sfs = (base: number, tier: "heading" | "body" = "body") => scaledFontSize(base, tier);

  const tplConfig = DIPLOMA_TEMPLATES.find((t) => t.id === form.style.template);
  const bgColor = tplConfig?.bgColor ?? "#faf6ef";
  const accentColor = form.style.accentColor;
  const fontPairing = form.style.fontPairing;
  const headingFont = getFontFamily(fontPairing, "heading");
  const bodyFont = getFontFamily(fontPairing, "body");
  const fontScale = form.style.fontScale;

  const sizeKey = `${form.format.pageSize}-${form.format.orientation}`;
  const dim = PAGE_PX[sizeKey] ?? PAGE_PX["a4-landscape"];

  const margins: Record<string, number> = { narrow: 30, standard: 50, wide: 70 };
  const margin = margins[form.format.margins] ?? 50;

  const honorsLabel = HONORS_LEVELS.find((h) => h.id === form.honors)?.label ?? "";

  const fontUrl = getGoogleFontUrl(fontPairing);

  return (
    <>
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} />
      )}
      <div
        data-diploma-pages
        style={{
          width: dim.w,
          minHeight: dim.h,
          ...getBackgroundCSS(form.style.template, bgColor, accentColor),
          ...getBorderCSS(form.style.borderStyle, accentColor),
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          fontFamily: bodyFont,
          color: "#1a1a1a",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: margin,
        }}
      >
        {/* Corner decorations for accent-corner border */}
        {form.style.borderStyle === "accent-corner" && (
          <>
            <AccentCornerDecoration accent={accentColor} position="top-left" />
            <AccentCornerDecoration accent={accentColor} position="top-right" />
            <AccentCornerDecoration accent={accentColor} position="bottom-left" />
            <AccentCornerDecoration accent={accentColor} position="bottom-right" />
          </>
        )}

        {/* ── Institution Header ── */}
        {form.institutionName && (
          <div data-cert-section="institution" style={{ textAlign: "center", marginBottom: 4 }}>
            <div
              style={{
                fontSize: sfs(20 * fontScale),
                fontWeight: 700,
                fontFamily: headingFont,
                color: accentColor,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {form.institutionName}
            </div>
            {form.institutionSubtitle && (
              <div style={{ fontSize: sfs(11 * fontScale), color: "#666", marginTop: 2, letterSpacing: "1px" }}>
                {form.institutionSubtitle}
              </div>
            )}
            {form.institutionMotto && (
              <div style={{ fontSize: sfs(10 * fontScale), color: "#888", fontStyle: "italic", marginTop: 3 }}>
                &ldquo;{form.institutionMotto}&rdquo;
              </div>
            )}
          </div>
        )}

        {/* Upper divider */}
        <div style={{ margin: "8px 0" }}>
          <OrnamentDivider color={accentColor} />
        </div>

        {/* ── Program Name / Degree Title ── */}
        <div data-cert-section="program" style={{ textAlign: "center", marginBottom: 6 }}>
          <div
            style={{
              fontSize: sfs(30 * fontScale),
              fontWeight: 800,
              fontFamily: headingFont,
              color: "#1a1a1a",
              letterSpacing: "1px",
              lineHeight: 1.2,
            }}
          >
            {form.programName}
          </div>
          {form.fieldOfStudy && (
            <div style={{ fontSize: sfs(14 * fontScale), color: "#444", marginTop: 4 }}>
              in {form.fieldOfStudy}
            </div>
          )}
          {honorsLabel && (
            <div
              style={{
                fontSize: sfs(12 * fontScale),
                color: accentColor,
                marginTop: 4,
                fontWeight: 600,
                fontStyle: "italic",
                letterSpacing: "0.5px",
              }}
            >
              {honorsLabel}
            </div>
          )}
        </div>

        {/* ── Conferral Text ── */}
        {form.conferralText && (
          <div data-cert-section="conferral" style={{ textAlign: "center", marginBottom: 4 }}>
            <div style={{ fontSize: sfs(11 * fontScale), color: "#555", lineHeight: 1.5, maxWidth: 500 }}>
              {form.conferralText}
            </div>
          </div>
        )}

        {/* ── Recipient Name ── */}
        <div data-cert-section="recipient" style={{ textAlign: "center", marginBottom: 8 }}>
          <div
            style={{
              fontSize: sfs(28 * fontScale),
              fontWeight: 700,
              fontFamily: headingFont,
              color: accentColor,
              borderBottom: `2px solid ${hexToRgba(accentColor, 0.3)}`,
              display: "inline-block",
              padding: "4px 20px",
              minWidth: 250,
              lineHeight: 1.3,
            }}
          >
            {form.recipientName || "Recipient Name"}
          </div>
          {form.recipientId && (
            <div style={{ fontSize: sfs(9 * fontScale), color: "#999", marginTop: 4 }}>
              Student ID: {form.recipientId}
            </div>
          )}
        </div>

        {/* ── Resolution Text ── */}
        {form.resolutionText && (
          <div data-cert-section="resolution" style={{ textAlign: "center", marginBottom: 6 }}>
            <div style={{ fontSize: sfs(10 * fontScale), color: "#666", fontStyle: "italic", maxWidth: 450, lineHeight: 1.4 }}>
              {form.resolutionText}
            </div>
          </div>
        )}

        {/* ── Accreditation ── */}
        {(form.accreditationBody || form.accreditationNumber) && (
          <div data-cert-section="accreditation" style={{ textAlign: "center", marginBottom: 8 }}>
            {form.accreditationBody && (
              <div style={{ fontSize: sfs(9.5 * fontScale), color: "#666" }}>
                Accredited by: {form.accreditationBody}
              </div>
            )}
            {form.accreditationNumber && (
              <div style={{ fontSize: sfs(8.5 * fontScale), color: "#888", marginTop: 1 }}>
                Accreditation No: {form.accreditationNumber}
              </div>
            )}
          </div>
        )}

        {/* ── Date ── */}
        <div data-cert-section="date" style={{ textAlign: "center", marginBottom: 10 }}>
          {form.dateConferred && (
            <div style={{ fontSize: sfs(11 * fontScale), color: "#444" }}>
              Conferred on {formatDate(form.dateConferred)}
            </div>
          )}
          {form.graduationDate && (
            <div style={{ fontSize: sfs(9.5 * fontScale), color: "#777", marginTop: 2 }}>
              Graduation: {formatDate(form.graduationDate)}
            </div>
          )}
        </div>

        {/* Lower divider */}
        <div style={{ margin: "4px 0 12px" }}>
          <OrnamentDivider color={accentColor} />
        </div>

        {/* ── Signatories + Seal Row ── */}
        <div
          data-cert-section="signatories"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 40,
            width: "100%",
            maxWidth: 700,
            flexWrap: "wrap",
          }}
        >
          {/* Left signatories */}
          {form.signatories.slice(0, Math.ceil(form.signatories.length / 2)).map((sig) => (
            <SignatureBlock
              key={sig.id}
              name={sig.name}
              title={sig.title}
              role={sig.role}
              accent={accentColor}
            />
          ))}

          {/* Seal */}
          {form.showSeal && form.sealStyle !== "none" && (
            <div data-cert-section="seal">
              <DiplomaSeal text={form.sealText} style={form.sealStyle} accent={accentColor} />
            </div>
          )}

          {/* Right signatories */}
          {form.signatories.slice(Math.ceil(form.signatories.length / 2)).map((sig) => (
            <SignatureBlock
              key={sig.id}
              name={sig.name}
              title={sig.title}
              role={sig.role}
              accent={accentColor}
            />
          ))}
        </div>

        {/* ── Reference Numbers ── */}
        {(form.registrationNumber || form.serialNumber) && (
          <div data-cert-section="reference" style={{ position: "absolute", bottom: margin + 4, right: margin + 8, textAlign: "right" }}>
            {form.registrationNumber && (
              <div style={{ fontSize: 7.5, color: "#aaa" }}>
                Reg: {form.registrationNumber}
              </div>
            )}
            {form.serialNumber && (
              <div style={{ fontSize: 7.5, color: "#aaa" }}>
                S/N: {form.serialNumber}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
