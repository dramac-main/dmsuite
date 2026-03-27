"use client";

import { useEffect, useMemo } from "react";
import type {
  IDBadgeFormData,
  BatchPerson,
  BadgeTemplate,
  PhotoShape,
  RoleVariant,
  CardSize,
} from "@/stores/id-badge-editor";
import {
  BADGE_TEMPLATES,
  BADGE_FONT_PAIRINGS,
  ROLE_VARIANTS,
  CARD_SIZES,
} from "@/stores/id-badge-editor";
import { getAdvancedSettings, scaledFontSize } from "@/stores/advanced-helpers";

// ━━━ Card Pixel Dimensions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CR80 = 3.375" × 2.125" at 300 DPI → 1012.5 × 637.5 → use 1013 × 638
// Landscape (default): width > height

export const CARD_PX: Record<string, { w: number; h: number }> = {
  cr80: { w: 1013, h: 638 },
  cr79: { w: 991, h: 615 },
  cr100: { w: 1164, h: 789 },
  custom: { w: 1013, h: 638 },
};

export const PAGE_GAP = 24;

// ━━━ Multi-up Print Sheet Dimensions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const PRINT_SHEET_PX: Record<string, { w: number; h: number }> = {
  a4: { w: 2480, h: 3508 },
  letter: { w: 2550, h: 3300 },
};

// ━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getGoogleFontUrl(pairingId: string): string | null {
  const pair = BADGE_FONT_PAIRINGS[pairingId];
  if (!pair) return null;
  return `https://fonts.googleapis.com/css2?family=${pair.google}&display=swap`;
}

function getFontFamily(pairingId: string, tier: "heading" | "body"): string {
  const pair = BADGE_FONT_PAIRINGS[pairingId];
  if (!pair) return "'Inter', sans-serif";
  return tier === "heading"
    ? `'${pair.heading}', sans-serif`
    : `'${pair.body}', sans-serif`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function getRoleColor(role: RoleVariant): string {
  return ROLE_VARIANTS.find((r) => r.id === role)?.color ?? "#6b7280";
}

function getRoleBorderColor(role: RoleVariant): string {
  return ROLE_VARIANTS.find((r) => r.id === role)?.borderColor ?? "#9ca3af";
}

function getRoleLabel(role: RoleVariant): string {
  return ROLE_VARIANTS.find((r) => r.id === role)?.label ?? "Staff";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function getCardDims(data: IDBadgeFormData): { w: number; h: number } {
  const base = CARD_PX[data.format.cardSize] || CARD_PX.cr80;
  if (data.format.cardSize === "custom") {
    const dpi = data.format.dpi;
    return {
      w: Math.round((data.format.customWidthMm / 25.4) * dpi),
      h: Math.round((data.format.customHeightMm / 25.4) * dpi),
    };
  }
  if (data.format.orientation === "portrait") {
    return { w: base.h, h: base.w };
  }
  return base;
}

// ━━━ Photo Shape CSS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getPhotoRadius(shape: PhotoShape): string {
  switch (shape) {
    case "circle": return "50%";
    case "rounded": return "12px";
    case "rounded-square": return "8px";
    case "square": return "2px";
    default: return "8px";
  }
}

// ━━━ Template-Specific Rendering ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getHeaderCSS(template: BadgeTemplate, accent: string, headerStyle: string, dims: { w: number; h: number }): React.CSSProperties {
  const headerH = Math.round(dims.h * 0.28);
  const base: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: headerH,
  };

  const tmpl = BADGE_TEMPLATES.find((t) => t.id === template);
  if (!tmpl) return { ...base, background: accent };

  switch (headerStyle) {
    case "gradient":
      return { ...base, background: `linear-gradient(135deg, ${accent}, ${adjustColor(accent, 40)})` };
    case "pattern":
      return {
        ...base,
        background: accent,
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${hexToRgba("#ffffff", 0.05)} 10px, ${hexToRgba("#ffffff", 0.05)} 20px)`,
      };
    case "minimal":
      return { ...base, background: "transparent", borderBottom: `3px solid ${accent}` };
    case "solid":
    default:
      return { ...base, background: accent };
  }
}

function getBodyCSS(template: BadgeTemplate): React.CSSProperties {
  const tmpl = BADGE_TEMPLATES.find((t) => t.id === template);
  if (!tmpl) return { background: "#ffffff" };

  if (template === "executive-premium") {
    return { background: `linear-gradient(180deg, ${tmpl.bodyBg}, #1a1a2e)` };
  }
  return { background: tmpl.bodyBg };
}

// ━━━ Single Badge Renderer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface BadgeCardProps {
  data: IDBadgeFormData;
  person?: BatchPerson;
  side: "front" | "back";
  index?: number;
  showBleed?: boolean;
  showSafeZone?: boolean;
  showCutMarks?: boolean;
}

function BadgeFront({ data, person, index = 0 }: { data: IDBadgeFormData; person?: BatchPerson; index?: number }) {
  const dims = getCardDims(data);
  const accent = data.style.accentColor;
  const template = data.style.template;
  const fontScale = data.style.fontScale;
  const tmpl = BADGE_TEMPLATES.find((t) => t.id === template);
  const isDark = template === "executive-premium";
  const textColor = isDark ? "#ffffff" : "#1e293b";
  const subColor = isDark ? "#a0aec0" : "#64748b";
  const headerH = Math.round(dims.h * 0.28);

  // Person data (batch or single)
  const firstName = person?.firstName || data.firstName;
  const lastName = person?.lastName || data.lastName;
  const title = person?.title || data.title;
  const department = person?.department || data.department;
  const employeeId = person?.employeeId || data.employeeId;
  const role = person?.role || data.role;
  const photoUrl = person?.photoUrl || data.photoUrl;
  const email = person?.email || data.email;
  const phone = person?.phone || data.phone;
  const accessLevel = person?.accessLevel || data.accessLevel;

  // Sequential numbering
  const seqNumber = data.security.sequentialNumbering
    ? `${data.security.sequentialPrefix}${String(data.security.sequentialStart + index).padStart(6, "0")}`
    : employeeId;

  const roleColor = getRoleColor(role);
  const roleBorderColor = getRoleBorderColor(role);
  const roleLabel = getRoleLabel(role);

  const nameSize = scaledFontSize(Math.round(dims.h * 0.055), "heading") * fontScale;
  const titleSize = scaledFontSize(Math.round(dims.h * 0.035), "body") * fontScale;
  const detailSize = scaledFontSize(Math.round(dims.h * 0.028), "body") * fontScale;
  const orgSize = scaledFontSize(Math.round(dims.h * 0.035), "heading") * fontScale;
  const smallSize = scaledFontSize(Math.round(dims.h * 0.022), "label") * fontScale;
  const photoSize = Math.round(dims.h * 0.38);

  return (
    <div
      data-badge-section="front"
      style={{
        width: dims.w,
        height: dims.h,
        position: "relative",
        overflow: "hidden",
        fontFamily: getFontFamily(data.style.fontPairing, "body"),
        ...getBodyCSS(template),
      }}
    >
      {/* ── Header ── */}
      <div data-badge-section="header" style={getHeaderCSS(template, accent, data.style.headerStyle, dims)}>
        {/* Organization name */}
        <div style={{
          position: "absolute",
          left: Math.round(dims.w * 0.03),
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}>
          <span style={{
            fontSize: orgSize,
            fontWeight: 700,
            color: data.style.headerStyle === "minimal" ? accent : "#ffffff",
            fontFamily: getFontFamily(data.style.fontPairing, "heading"),
            letterSpacing: "0.5px",
          }}>
            {data.organizationName}
          </span>
          {data.organizationSubtitle && (
            <span style={{
              fontSize: smallSize,
              color: data.style.headerStyle === "minimal" ? subColor : hexToRgba("#ffffff", 0.7),
              fontWeight: 400,
              letterSpacing: "0.3px",
            }}>
              {data.organizationSubtitle}
            </span>
          )}
        </div>

        {/* Badge Type Label */}
        <div style={{
          position: "absolute",
          right: Math.round(dims.w * 0.03),
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: smallSize * 0.85,
          fontWeight: 600,
          color: data.style.headerStyle === "minimal" ? accent : hexToRgba("#ffffff", 0.8),
          textTransform: "uppercase",
          letterSpacing: "1.5px",
        }}>
          {data.badgeType.replace(/-/g, " ")}
        </div>
      </div>

      {/* ── Body Content ── */}
      <div data-badge-section="body" style={{
        position: "absolute",
        top: headerH + Math.round(dims.h * 0.04),
        left: Math.round(dims.w * 0.035),
        right: Math.round(dims.w * 0.035),
        bottom: Math.round(dims.h * 0.08),
        display: "flex",
        gap: Math.round(dims.w * 0.04),
        alignItems: data.style.layoutDensity === "compact" ? "flex-start" : "center",
      }}>
        {/* Photo Area */}
        <div data-badge-section="photo" style={{
          width: photoSize,
          height: photoSize,
          flexShrink: 0,
          borderRadius: getPhotoRadius(data.style.photoShape),
          overflow: "hidden",
          background: isDark ? "#2d2d4a" : "#e5e7eb",
          border: `3px solid ${hexToRgba(accent, 0.3)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
          {photoUrl ? (
            <div style={{
              width: "100%",
              height: "100%",
              background: `url(${photoUrl}) center/cover no-repeat`,
            }} />
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}>
              <svg width={photoSize * 0.25} height={photoSize * 0.25} viewBox="0 0 24 24" fill="none" stroke={isDark ? "#64748b" : "#9ca3af"} strokeWidth="1.5">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span style={{ fontSize: smallSize * 0.8, color: isDark ? "#64748b" : "#9ca3af", fontWeight: 500 }}>
                PHOTO
              </span>
            </div>
          )}
        </div>

        {/* Details Area */}
        <div data-badge-section="details" style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: Math.round(dims.h * 0.015),
          minWidth: 0,
        }}>
          {/* Name */}
          <div data-badge-section="name" style={{
            fontSize: nameSize,
            fontWeight: 700,
            color: textColor,
            fontFamily: getFontFamily(data.style.fontPairing, "heading"),
            lineHeight: 1.1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {firstName} {lastName}
          </div>

          {/* Title */}
          <div data-badge-section="title" style={{
            fontSize: titleSize,
            fontWeight: 600,
            color: accent,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {title}
          </div>

          {/* Department */}
          {department && data.style.showDepartmentBadge && (
            <div data-badge-section="department" style={{
              fontSize: detailSize,
              color: subColor,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: accent,
                flexShrink: 0,
              }} />
              {department}
            </div>
          )}

          {/* Employee ID */}
          <div data-badge-section="employee-id" style={{
            fontSize: detailSize,
            color: subColor,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 500,
          }}>
            {seqNumber}
          </div>

          {/* Access Level */}
          {accessLevel && (
            <div style={{
              fontSize: smallSize,
              color: subColor,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <svg width={smallSize * 1.2} height={smallSize * 1.2} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {accessLevel}
            </div>
          )}

          {/* Role Badge */}
          {data.style.showRoleBadge && (
            <div data-badge-section="role" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: `${Math.round(dims.h * 0.008)}px ${Math.round(dims.w * 0.015)}px`,
              borderRadius: 4,
              background: hexToRgba(roleColor, 0.12),
              border: `1px solid ${hexToRgba(roleBorderColor, 0.3)}`,
              alignSelf: "flex-start",
            }}>
              <span style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: roleColor,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: smallSize,
                fontWeight: 600,
                color: roleColor,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                {roleLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div data-badge-section="footer" style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: Math.round(dims.h * 0.07),
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${Math.round(dims.w * 0.035)}px`,
        background: hexToRgba(accent, isDark ? 0.3 : 0.06),
        borderTop: `1px solid ${hexToRgba(accent, 0.15)}`,
      }}>
        <span style={{ fontSize: smallSize * 0.85, color: subColor }}>
          {data.issueDate && `Issued: ${formatDate(data.issueDate)}`}
        </span>
        <span style={{ fontSize: smallSize * 0.85, color: subColor }}>
          {data.expiryDate && `Expires: ${formatDate(data.expiryDate)}`}
        </span>
      </div>

      {/* ── Watermark ── */}
      {data.security.showWatermark && (
        <div data-badge-section="watermark" style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-30deg)",
          fontSize: Math.round(dims.h * 0.12),
          fontWeight: 900,
          color: hexToRgba(accent, 0.04),
          textTransform: "uppercase",
          letterSpacing: "8px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
        }}>
          {data.security.watermarkText}
        </div>
      )}

      {/* ── Holographic Zone ── */}
      {data.security.showHolographicZone && (
        <div data-badge-section="holographic" style={{
          position: "absolute",
          ...(data.security.holographicPosition === "top-right" ? { top: headerH + 8, right: 8 } :
            data.security.holographicPosition === "bottom-left" ? { bottom: Math.round(dims.h * 0.08) + 8, left: 8 } :
              data.security.holographicPosition === "center" ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" } :
                { top: 0, left: 0, right: 0, bottom: 0 }),
          width: data.security.holographicPosition === "overlay" ? "100%" : Math.round(dims.w * 0.1),
          height: data.security.holographicPosition === "overlay" ? "100%" : Math.round(dims.w * 0.1),
          borderRadius: data.security.holographicPosition === "overlay" ? 0 : "50%",
          background: data.security.holographicPosition === "overlay"
            ? `linear-gradient(135deg, transparent 40%, ${hexToRgba("#c084fc", 0.08)} 45%, ${hexToRgba("#22d3ee", 0.08)} 55%, transparent 60%)`
            : `linear-gradient(135deg, ${hexToRgba("#c084fc", 0.3)}, ${hexToRgba("#22d3ee", 0.3)}, ${hexToRgba("#fbbf24", 0.3)})`,
          pointerEvents: "none",
        }} />
      )}

      {/* ── Microtext Border ── */}
      {data.security.showMicrotextBorder && (
        <div style={{
          position: "absolute",
          top: 2,
          left: 2,
          right: 2,
          bottom: 2,
          border: "none",
          pointerEvents: "none",
          overflow: "hidden",
        }}>
          {/* Top */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, fontSize: 3, color: hexToRgba(accent, 0.2), whiteSpace: "nowrap", overflow: "hidden", lineHeight: "4px", letterSpacing: "0.5px" }}>
            {(data.security.microtextContent + " • ").repeat(20)}
          </div>
          {/* Bottom */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: 3, color: hexToRgba(accent, 0.2), whiteSpace: "nowrap", overflow: "hidden", lineHeight: "4px", letterSpacing: "0.5px" }}>
            {(data.security.microtextContent + " • ").repeat(20)}
          </div>
          {/* Left */}
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, fontSize: 3, color: hexToRgba(accent, 0.2), writingMode: "vertical-rl", lineHeight: "4px", overflow: "hidden", letterSpacing: "0.5px" }}>
            {(data.security.microtextContent + " • ").repeat(20)}
          </div>
          {/* Right */}
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 4, fontSize: 3, color: hexToRgba(accent, 0.2), writingMode: "vertical-rl", lineHeight: "4px", overflow: "hidden", letterSpacing: "0.5px" }}>
            {(data.security.microtextContent + " • ").repeat(20)}
          </div>
        </div>
      )}

      {/* ── Role-colored side stripe ── */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: Math.round(dims.w * 0.012),
        height: "100%",
        background: roleColor,
      }} />
    </div>
  );
}

function BadgeBack({ data, person, index = 0 }: { data: IDBadgeFormData; person?: BatchPerson; index?: number }) {
  const dims = getCardDims(data);
  const accent = data.style.accentColor;
  const template = data.style.template;
  const tmpl = BADGE_TEMPLATES.find((t) => t.id === template);
  const isDark = template === "executive-premium";
  const bgColor = tmpl?.bodyBg || "#ffffff";
  const textColor = isDark ? "#e2e8f0" : "#475569";
  const subColor = isDark ? "#94a3b8" : "#94a3b8";
  const fontScale = data.style.fontScale;

  const orgSize = scaledFontSize(Math.round(dims.h * 0.032), "heading") * fontScale;
  const bodySize = scaledFontSize(Math.round(dims.h * 0.025), "body") * fontScale;
  const tinySize = scaledFontSize(Math.round(dims.h * 0.02), "label") * fontScale;
  const employeeId = person?.employeeId || data.employeeId;
  const email = person?.email || data.email;
  const phone = person?.phone || data.phone;

  const qrSize = Math.round(dims.h * 0.3);
  const barcodeW = Math.round(dims.w * 0.35);
  const barcodeH = Math.round(dims.h * 0.1);

  return (
    <div
      data-badge-section="back"
      style={{
        width: dims.w,
        height: dims.h,
        position: "relative",
        overflow: "hidden",
        fontFamily: getFontFamily(data.style.fontPairing, "body"),
        background: isDark ? tmpl?.bodyBg : "#f8fafc",
      }}
    >
      {/* Header stripe */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: Math.round(dims.h * 0.12),
        background: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{
          fontSize: orgSize,
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: getFontFamily(data.style.fontPairing, "heading"),
          letterSpacing: "1px",
        }}>
          {data.organizationName}
        </span>
      </div>

      {/* Magnetic stripe */}
      {data.backSide.showMagneticStripe && (
        <div data-badge-section="magnetic-stripe" style={{
          position: "absolute",
          top: Math.round(dims.h * 0.18),
          left: 0,
          right: 0,
          height: Math.round(dims.h * 0.1),
          background: "#374151",
        }} />
      )}

      {/* Content area */}
      <div style={{
        position: "absolute",
        top: data.backSide.showMagneticStripe ? Math.round(dims.h * 0.32) : Math.round(dims.h * 0.18),
        left: Math.round(dims.w * 0.05),
        right: Math.round(dims.w * 0.05),
        bottom: Math.round(dims.h * 0.12),
        display: "flex",
        gap: Math.round(dims.w * 0.04),
        alignItems: "flex-start",
      }}>
        {/* Left column: QR + barcode */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: Math.round(dims.h * 0.03),
          flexShrink: 0,
        }}>
          {/* QR Code placeholder */}
          {data.backSide.showQrCode && (
            <div data-badge-section="qr-code" style={{
              width: qrSize,
              height: qrSize,
              background: "#ffffff",
              border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}>
              {/* QR grid pattern */}
              <svg width={qrSize * 0.6} height={qrSize * 0.6} viewBox="0 0 100 100">
                <rect x="0" y="0" width="30" height="30" fill="#1e293b" />
                <rect x="5" y="5" width="20" height="20" fill="#ffffff" />
                <rect x="10" y="10" width="10" height="10" fill="#1e293b" />
                <rect x="70" y="0" width="30" height="30" fill="#1e293b" />
                <rect x="75" y="5" width="20" height="20" fill="#ffffff" />
                <rect x="80" y="10" width="10" height="10" fill="#1e293b" />
                <rect x="0" y="70" width="30" height="30" fill="#1e293b" />
                <rect x="5" y="75" width="20" height="20" fill="#ffffff" />
                <rect x="10" y="80" width="10" height="10" fill="#1e293b" />
                {/* Pattern fill */}
                <rect x="40" y="10" width="8" height="8" fill="#1e293b" />
                <rect x="55" y="10" width="8" height="8" fill="#1e293b" />
                <rect x="40" y="25" width="8" height="8" fill="#1e293b" />
                <rect x="50" y="40" width="8" height="8" fill="#1e293b" />
                <rect x="35" y="50" width="8" height="8" fill="#1e293b" />
                <rect x="50" y="55" width="8" height="8" fill="#1e293b" />
                <rect x="65" y="40" width="8" height="8" fill="#1e293b" />
                <rect x="80" y="45" width="8" height="8" fill="#1e293b" />
                <rect x="40" y="70" width="8" height="8" fill="#1e293b" />
                <rect x="55" y="75" width="8" height="8" fill="#1e293b" />
                <rect x="70" y="55" width="8" height="8" fill="#1e293b" />
                <rect x="85" y="70" width="8" height="8" fill="#1e293b" />
                <rect x="75" y="85" width="8" height="8" fill="#1e293b" />
                <rect x="50" y="85" width="8" height="8" fill="#1e293b" />
              </svg>
              <span style={{ fontSize: tinySize * 0.8, color: "#94a3b8" }}>SCAN TO VERIFY</span>
            </div>
          )}

          {/* Barcode */}
          {data.backSide.showBarcode && data.backSide.barcodeType !== "none" && (
            <div data-badge-section="barcode" style={{
              width: barcodeW,
              height: barcodeH + 16,
              background: "#ffffff",
              border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
              borderRadius: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px 8px",
              gap: 2,
            }}>
              {/* Simulated barcode lines */}
              <div style={{ display: "flex", gap: 1, height: barcodeH * 0.6, alignItems: "flex-end" }}>
                {Array.from({ length: 35 }, (_, i) => (
                  <div key={i} style={{
                    width: i % 3 === 0 ? 3 : 2,
                    height: `${60 + Math.sin(i * 0.7) * 30}%`,
                    background: "#1e293b",
                  }} />
                ))}
              </div>
              <span style={{ fontSize: tinySize * 0.85, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
                {employeeId}
              </span>
            </div>
          )}
        </div>

        {/* Right column: Contact info + text */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: Math.round(dims.h * 0.025),
          minWidth: 0,
        }}>
          {/* Contact Info */}
          {data.backSide.showContactInfo && (
            <div data-badge-section="contact-info" style={{
              display: "flex",
              flexDirection: "column",
              gap: Math.round(dims.h * 0.012),
            }}>
              {email && (
                <div style={{ fontSize: bodySize, color: textColor, display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width={bodySize * 1.1} height={bodySize * 1.1} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
                </div>
              )}
              {phone && (
                <div style={{ fontSize: bodySize, color: textColor, display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width={bodySize * 1.1} height={bodySize * 1.1} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2">
                    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {phone}
                </div>
              )}
            </div>
          )}

          {/* Emergency contact */}
          {data.backSide.showEmergencyContact && data.backSide.emergencyPhone && (
            <div style={{ fontSize: tinySize, color: textColor }}>
              <span style={{ fontWeight: 600, color: "#dc2626" }}>Emergency: </span>
              {data.backSide.emergencyPhone}
            </div>
          )}

          {/* NFC zone indicator */}
          {data.backSide.showNfcZone && (
            <div data-badge-section="nfc-zone" style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: `${Math.round(dims.h * 0.01)}px ${Math.round(dims.w * 0.015)}px`,
              borderRadius: 4,
              border: `1px dashed ${hexToRgba(accent, 0.3)}`,
              background: hexToRgba(accent, 0.05),
            }}>
              <svg width={bodySize * 1.3} height={bodySize * 1.3} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5">
                <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01M5.111 11.404a10 10 0 0113.778 0" />
              </svg>
              <span style={{ fontSize: tinySize, color: textColor }}>NFC / RFID ENABLED</span>
            </div>
          )}
        </div>
      </div>

      {/* Terms text */}
      {data.backSide.showTermsText && (
        <div data-badge-section="terms" style={{
          position: "absolute",
          left: Math.round(dims.w * 0.05),
          right: Math.round(dims.w * 0.05),
          bottom: Math.round(dims.h * 0.03),
          fontSize: tinySize * 0.85,
          color: subColor,
          textAlign: "center",
          lineHeight: 1.3,
        }}>
          {data.backSide.termsText}
        </div>
      )}

      {/* Return address */}
      {data.backSide.showReturnAddress && data.backSide.returnAddress && (
        <div style={{
          position: "absolute",
          left: Math.round(dims.w * 0.05),
          right: Math.round(dims.w * 0.05),
          bottom: Math.round(dims.h * 0.12),
          fontSize: tinySize,
          color: textColor,
          textAlign: "center",
        }}>
          {data.backSide.returnAddress}
        </div>
      )}

      {/* Bottom accent bar */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: Math.round(dims.h * 0.015),
        background: accent,
      }} />
    </div>
  );
}

// ━━━ Main Badge Card (Front + Back wrapper) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function BadgeCard({ data, person, side, index = 0, showBleed, showSafeZone, showCutMarks }: BadgeCardProps) {
  const dims = getCardDims(data);
  const bleedPx = showBleed ? Math.round((data.format.bleedMm / 25.4) * data.format.dpi) : 0;
  const safePx = showSafeZone ? Math.round((data.format.safeZoneMm / 25.4) * data.format.dpi) : 0;

  return (
    <div style={{
      position: "relative",
      width: dims.w + bleedPx * 2,
      height: dims.h + bleedPx * 2,
    }}>
      {/* Cut marks */}
      {showCutMarks && (
        <>
          {/* Top-left */}
          <div style={{ position: "absolute", top: bleedPx - 12, left: bleedPx, width: 1, height: 12, background: "#000" }} />
          <div style={{ position: "absolute", top: bleedPx, left: bleedPx - 12, width: 12, height: 1, background: "#000" }} />
          {/* Top-right */}
          <div style={{ position: "absolute", top: bleedPx - 12, right: bleedPx, width: 1, height: 12, background: "#000" }} />
          <div style={{ position: "absolute", top: bleedPx, right: bleedPx - 12, width: 12, height: 1, background: "#000" }} />
          {/* Bottom-left */}
          <div style={{ position: "absolute", bottom: bleedPx - 12, left: bleedPx, width: 1, height: 12, background: "#000" }} />
          <div style={{ position: "absolute", bottom: bleedPx, left: bleedPx - 12, width: 12, height: 1, background: "#000" }} />
          {/* Bottom-right */}
          <div style={{ position: "absolute", bottom: bleedPx - 12, right: bleedPx, width: 1, height: 12, background: "#000" }} />
          <div style={{ position: "absolute", bottom: bleedPx, right: bleedPx - 12, width: 12, height: 1, background: "#000" }} />
        </>
      )}

      {/* Bleed area background */}
      {showBleed && bleedPx > 0 && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: `${bleedPx}px solid rgba(255,0,0,0.08)`,
          pointerEvents: "none",
          zIndex: 2,
        }} />
      )}

      {/* Safe zone indicator */}
      {showSafeZone && safePx > 0 && (
        <div style={{
          position: "absolute",
          top: bleedPx + safePx,
          left: bleedPx + safePx,
          right: bleedPx + safePx,
          bottom: bleedPx + safePx,
          border: "1px dashed rgba(0,128,255,0.3)",
          pointerEvents: "none",
          zIndex: 3,
        }} />
      )}

      {/* Card content */}
      <div style={{
        position: "absolute",
        top: bleedPx,
        left: bleedPx,
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}>
        {side === "front" ? (
          <BadgeFront data={data} person={person} index={index} />
        ) : (
          <BadgeBack data={data} person={person} index={index} />
        )}
      </div>
    </div>
  );
}

// ━━━ Lanyard Preview Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LanyardPreview({ data }: { data: IDBadgeFormData }) {
  const dims = getCardDims(data);
  const lc = data.lanyard;
  const strapW = lc.lanyardWidth === "narrow" ? 20 : lc.lanyardWidth === "wide" ? 40 : 30;
  const totalH = dims.h + 200;

  return (
    <div data-badge-section="lanyard" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0,
    }}>
      {/* Lanyard strap */}
      <div style={{
        width: strapW,
        height: 120,
        background: lc.lanyardColor,
        borderRadius: "0 0 4px 4px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Branding text on strap */}
        {lc.brandingText && lc.brandingRepeat && (
          <div style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%) rotate(90deg)",
            transformOrigin: "top center",
            whiteSpace: "nowrap",
            fontSize: 8,
            color: hexToRgba("#ffffff", 0.5),
            fontWeight: 600,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}>
            {(lc.brandingText + "  •  ").repeat(5)}
          </div>
        )}
      </div>

      {/* Breakaway clip */}
      {lc.showBreakawayClip && (
        <div style={{
          width: strapW + 10,
          height: 12,
          background: "#94a3b8",
          borderRadius: 3,
          border: "1px solid #64748b",
        }} />
      )}

      {/* Clip connector */}
      <div style={{
        width: 4,
        height: 20,
        background: "#94a3b8",
      }} />

      {/* Badge holder */}
      {lc.showBadgeHolder && (
        <div style={{
          padding: 6,
          borderRadius: 8,
          background:
            lc.holderType === "clear" ? "rgba(255,255,255,0.1)" :
              lc.holderType === "frosted" ? "rgba(255,255,255,0.2)" :
                hexToRgba(lc.lanyardColor, 0.15),
          border: `1px solid ${hexToRgba(lc.lanyardColor, 0.3)}`,
        }}>
          {/* Badge card inside holder */}
          <div style={{
            width: dims.w * 0.35,
            height: dims.h * 0.35,
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transform: "scale(0.35)",
            transformOrigin: "top left",
          }}>
            <BadgeFront data={data} />
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━ Renderer Props ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface IDBadgeRendererProps {
  data: IDBadgeFormData;
  previewPersonIndex?: number;
  onPageCount?: (count: number) => void;
  pageGap?: number;
}

// ━━━ Main Renderer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function IDBadgeRenderer({ data, previewPersonIndex = 0, onPageCount, pageGap = PAGE_GAP }: IDBadgeRendererProps) {
  const fontUrl = getGoogleFontUrl(data.style.fontPairing);
  const dims = getCardDims(data);

  // Determine what person to show
  const currentPerson = data.batchMode && data.batchPeople.length > 0
    ? data.batchPeople[Math.min(previewPersonIndex, data.batchPeople.length - 1)]
    : undefined;

  const showBleed = data.format.showBleedArea;
  const showSafe = data.format.showSafeZone;
  const showCutMarks = data.format.showCutMarks;

  // Page count: front + back (if enabled) + lanyard (if enabled)
  const pageCount = useMemo(() => {
    let count = 1; // Front
    if (data.backSide.enabled) count++;
    if (data.lanyard.showLanyard) count++;
    return count;
  }, [data.backSide.enabled, data.lanyard.showLanyard]);

  useEffect(() => {
    onPageCount?.(pageCount);
  }, [pageCount, onPageCount]);

  return (
    <>
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" />

      <div className="flex flex-col items-center" style={{ gap: pageGap }}>
        {/* Front of badge */}
        <div>
          <div style={{
            marginBottom: 8,
            fontSize: 10,
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            textAlign: "center",
          }}>
            Front
          </div>
          <BadgeCard
            data={data}
            person={currentPerson}
            side="front"
            index={previewPersonIndex}
            showBleed={showBleed}
            showSafeZone={showSafe}
            showCutMarks={showCutMarks}
          />
        </div>

        {/* Back of badge */}
        {data.backSide.enabled && (
          <div>
            <div style={{
              marginBottom: 8,
              fontSize: 10,
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              textAlign: "center",
            }}>
              Back
            </div>
            <BadgeCard
              data={data}
              person={currentPerson}
              side="back"
              index={previewPersonIndex}
              showBleed={showBleed}
              showSafeZone={showSafe}
              showCutMarks={showCutMarks}
            />
          </div>
        )}

        {/* Lanyard Preview */}
        {data.lanyard.showLanyard && (
          <div>
            <div style={{
              marginBottom: 8,
              fontSize: 10,
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              textAlign: "center",
            }}>
              Lanyard Preview
            </div>
            <LanyardPreview data={data} />
          </div>
        )}
      </div>
    </>
  );
}
