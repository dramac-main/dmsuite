// =============================================================================
// DMSuite — Ticket & Pass Designer Renderer
// Pure HTML/CSS renderer for professional tickets and passes.
// Supports 12 ticket types, 10 templates, QR/barcode SVGs, stub sections,
// perforation lines, serial numbering, and full print optimization.
// =============================================================================

"use client";

import { useMemo } from "react";
import type {
  TicketFormData,
  TicketTemplate,
  BarcodeType,
  TicketSize,
} from "@/stores/ticket-editor";
import { TICKET_FONT_PAIRINGS, TICKET_SIZES, getTicketSize } from "@/stores/ticket-editor";
import { getAdvancedSettings, scaledFontSize } from "@/stores/advanced-helpers";

// ━━━ Page Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PAGE_PX: Record<string, { w: number; h: number }> = {
  standard: { w: 816, h: 336 },
  small: { w: 528, h: 192 },
  large: { w: 816, h: 384 },
  boarding: { w: 768, h: 324 },
  wristband: { w: 960, h: 96 },
  "a4-sheet": { w: 794, h: 1123 },
  custom: { w: 816, h: 336 },
};

export const PAGE_GAP = 16;

// ━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getGoogleFontUrl(fontPairingId: string): string | null {
  const pair = TICKET_FONT_PAIRINGS[fontPairingId];
  if (!pair) return null;
  return `https://fonts.googleapis.com/css2?family=${pair.google}&display=swap`;
}

function getFontFamily(fontPairingId: string, role: "heading" | "body"): string {
  const pair = TICKET_FONT_PAIRINGS[fontPairingId];
  if (!pair) return role === "heading" ? "Inter, sans-serif" : "Inter, sans-serif";
  return role === "heading" ? `"${pair.heading}", sans-serif` : `"${pair.body}", sans-serif`;
}

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustColor(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatDateCompact(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const meridian = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${m} ${meridian}`;
}

function getSerialNumber(prefix: string, num: number, padLen: number): string {
  return `${prefix}${String(num).padStart(padLen, "0")}`;
}

// ━━━ QR Code SVG (Deterministic Pattern) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Generates a visual QR-code-like SVG pattern from a string value.
// Not a real QR encoder — produces a visually authentic representation.

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

function QRCodeSVG({ value, size = 80, color = "#000000" }: { value: string; size?: number; color?: string }) {
  const modules = 21;
  const cellSize = size / modules;
  const h = hashString(value);

  // Generate deterministic pattern
  const cells: boolean[][] = Array.from({ length: modules }, () => Array(modules).fill(false) as boolean[]);

  // Finder patterns (3 corners)
  const drawFinder = (ox: number, oy: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[oy + r][ox + c] = isOuter || isInner;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(modules - 7, 0);
  drawFinder(0, modules - 7);

  // Timing patterns
  for (let i = 8; i < modules - 8; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  // Data area from hash
  let seed = h;
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (cells[r][c]) continue;
      // Skip finder areas
      if ((r < 9 && c < 9) || (r < 9 && c > modules - 9) || (r > modules - 9 && c < 9)) continue;
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      cells[r][c] = (seed % 3) === 0;
    }
  }

  const rects: React.ReactElement[] = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (cells[r][c]) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize + 0.5}
            height={cellSize + 0.5}
            fill={color}
          />
        );
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" rx="2" />
      {rects}
    </svg>
  );
}

// ━━━ Barcode SVG (Code128-style visual) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function BarcodeSVG({ value, width = 180, height = 50, color = "#000000" }: { value: string; width?: number; height?: number; color?: string }) {
  const h = hashString(value);
  const bars: { x: number; w: number }[] = [];
  let x = 4;
  const minBar = 1;
  const maxBar = 3;
  let seed = h;

  // Start pattern
  bars.push({ x, w: 2 });
  x += 3;
  bars.push({ x, w: 1 });
  x += 2;
  bars.push({ x, w: 2 });
  x += 4;

  // Data bars
  while (x < width - 16) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const barW = minBar + (seed % (maxBar - minBar + 1));
    bars.push({ x, w: barW });
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const gap = minBar + (seed % 3);
    x += barW + gap;
  }

  // End pattern
  bars.push({ x, w: 2 });
  x += 3;
  bars.push({ x, w: 1 });
  x += 2;
  bars.push({ x, w: 2 });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      <rect width={width} height={height} fill="white" rx="1" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={2} width={b.w} height={height - 4} fill={color} />
      ))}
    </svg>
  );
}

// ━━━ Perforation Line ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function PerforationLine({ orientation, length, style: perfStyle, color }: { orientation: "vertical" | "horizontal"; length: number; style: "dashed" | "dotted" | "none"; color: string }) {
  if (perfStyle === "none") return null;
  const isVertical = orientation === "vertical";
  return (
    <div
      style={{
        position: "absolute",
        ...(isVertical
          ? { top: 0, height: length, width: 0, borderLeft: `2px ${perfStyle} ${color}` }
          : { left: 0, width: length, height: 0, borderTop: `2px ${perfStyle} ${color}` }),
      }}
    />
  );
}

// ━━━ Template-Specific Background ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getTemplateBackground(template: TicketTemplate, accent: string, bgColor: string, gradientDir: string): React.CSSProperties {
  const styles: Record<TicketTemplate, React.CSSProperties> = {
    "classic-elegant": {
      background: bgColor,
      borderLeft: `6px solid ${accent}`,
    },
    "modern-minimal": {
      background: bgColor,
    },
    "bold-vibrant": {
      background: `linear-gradient(${gradientDir === "to-right" ? "to right" : gradientDir === "to-bottom" ? "to bottom" : gradientDir === "to-br" ? "135deg" : "225deg"}, ${hexToRgba(accent, 0.08)}, ${bgColor})`,
    },
    "dark-premium": {
      background: `linear-gradient(135deg, ${bgColor}, ${adjustColor(bgColor, 20)})`,
    },
    "retro-vintage": {
      background: bgColor,
      border: `3px double ${accent}`,
    },
    "corporate-clean": {
      background: bgColor,
      borderTop: `4px solid ${accent}`,
    },
    "festival-neon": {
      background: `linear-gradient(135deg, ${bgColor}, ${adjustColor(bgColor, 15)})`,
      border: `2px solid ${hexToRgba(accent, 0.4)}`,
      boxShadow: `inset 0 0 30px ${hexToRgba(accent, 0.05)}`,
    },
    "sports-dynamic": {
      background: `linear-gradient(135deg, ${bgColor}, ${hexToRgba(accent, 0.05)})`,
      borderBottom: `5px solid ${accent}`,
    },
    "airline-standard": {
      background: bgColor,
      borderBottom: `3px solid ${accent}`,
    },
    "cinema-classic": {
      background: `linear-gradient(180deg, ${adjustColor(bgColor, 15)}, ${bgColor})`,
    },
  };

  return styles[template] || { background: bgColor };
}

// ━━━ Sub-Renderers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TicketHeader({ data, headingFont, bodyFont, headingSize, subSize, accent, textColor }: {
  data: TicketFormData; headingFont: string; bodyFont: string; headingSize: number; subSize: number; accent: string; textColor: string;
}) {
  const align = data.style.headerStyle === "centered" ? "center" : "left";
  const isSplit = data.style.headerStyle === "split";

  if (isSplit) {
    return (
      <div data-tk-section="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {data.style.showLogo && data.style.logoText && (
            <div style={{ fontSize: subSize * 0.85, fontFamily: bodyFont, color: accent, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 2 }}>
              {data.style.logoText}
            </div>
          )}
          <div style={{ fontSize: headingSize, fontFamily: headingFont, fontWeight: 700, color: textColor, lineHeight: 1.15, maxWidth: 400 }}>
            {data.event.eventName || "Event Name"}
          </div>
          {data.event.eventSubtitle && (
            <div style={{ fontSize: subSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.7), marginTop: 2 }}>
              {data.event.eventSubtitle}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          {data.event.date && (
            <div style={{ fontSize: subSize * 1.1, fontFamily: bodyFont, fontWeight: 600, color: accent }}>
              {formatDateCompact(data.event.date)}
            </div>
          )}
          {data.event.time && (
            <div style={{ fontSize: subSize, fontFamily: bodyFont, color: textColor, marginTop: 2 }}>
              {formatTime(data.event.time)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-tk-section="header" style={{ textAlign: align }}>
      {data.style.showLogo && data.style.logoText && (
        <div style={{ fontSize: subSize * 0.85, fontFamily: bodyFont, color: accent, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 2 }}>
          {data.style.logoText}
        </div>
      )}
      <div style={{ fontSize: headingSize, fontFamily: headingFont, fontWeight: 700, color: textColor, lineHeight: 1.15 }}>
        {data.event.eventName || "Event Name"}
      </div>
      {data.event.eventSubtitle && (
        <div style={{ fontSize: subSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.7), marginTop: 2 }}>
          {data.event.eventSubtitle}
        </div>
      )}
    </div>
  );
}

function TicketDetails({ data, bodyFont, bodySize, labelSize, accent, textColor }: {
  data: TicketFormData; bodyFont: string; bodySize: number; labelSize: number; accent: string; textColor: string;
}) {
  const items: { label: string; value: string }[] = [];

  if (data.event.venueName) items.push({ label: "VENUE", value: data.event.venueName });
  if (data.event.venueAddress) items.push({ label: "LOCATION", value: data.event.venueAddress });
  if (data.event.date) items.push({ label: "DATE", value: formatDate(data.event.date) });
  if (data.event.time) items.push({ label: "TIME", value: formatTime(data.event.time) });
  if (data.event.doors) items.push({ label: "DOORS", value: formatTime(data.event.doors) });
  if (data.attendee.ticketClass) items.push({ label: "CLASS", value: data.attendee.ticketClass });
  if (data.price) items.push({ label: "PRICE", value: `${data.currency} ${data.price}` });

  if (items.length === 0) return null;

  return (
    <div data-tk-section="details" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "6px 16px", marginTop: 8 }}>
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ fontSize: labelSize, fontFamily: bodyFont, fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {item.label}
          </div>
          <div style={{ fontSize: bodySize, fontFamily: bodyFont, color: textColor, marginTop: 1 }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function TicketSeatBlock({ data, bodyFont, bodySize, labelSize, accent, textColor }: {
  data: TicketFormData; bodyFont: string; bodySize: number; labelSize: number; accent: string; textColor: string;
}) {
  const fields = [
    { label: "SECTION", value: data.seat.section },
    { label: "ROW", value: data.seat.row },
    { label: "SEAT", value: data.seat.seat },
    { label: "GATE", value: data.seat.gate },
    { label: "ZONE", value: data.seat.zone },
    { label: "FLOOR", value: data.seat.floor },
  ].filter((f) => !!f.value);

  if (fields.length === 0) return null;

  return (
    <div data-tk-section="seating" style={{ display: "flex", gap: 16, marginTop: 8 }}>
      {fields.map((f, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div style={{ fontSize: labelSize, fontFamily: bodyFont, fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {f.label}
          </div>
          <div style={{ fontSize: bodySize * 1.4, fontFamily: bodyFont, fontWeight: 700, color: textColor, marginTop: 1 }}>
            {f.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function TicketAttendeeBlock({ data, bodyFont, bodySize, labelSize, textColor }: {
  data: TicketFormData; bodyFont: string; bodySize: number; labelSize: number; textColor: string;
}) {
  if (!data.attendee.attendeeName) return null;

  return (
    <div data-tk-section="attendee" style={{ marginTop: 6 }}>
      <div style={{ fontSize: bodySize, fontFamily: bodyFont, fontWeight: 600, color: textColor }}>
        {data.attendee.attendeeName}
      </div>
      {data.attendee.ageGroup && data.attendee.ageGroup !== "Adult" && (
        <div style={{ fontSize: labelSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.6), marginTop: 1 }}>
          {data.attendee.ageGroup}
        </div>
      )}
    </div>
  );
}

function TicketBarcodeBlock({ data, accent, textColor }: {
  data: TicketFormData; accent: string; textColor: string;
}) {
  if (data.barcode.type === "none") return null;

  const isDark = isColorDark(data.style.bgColor);
  const barcodeColor = isDark ? "#ffffff" : "#000000";

  return (
    <div data-tk-section="barcode" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {data.barcode.type === "qr" ? (
        <QRCodeSVG value={data.barcode.value || "TICKET"} size={70} color={barcodeColor} />
      ) : (
        <BarcodeSVG value={data.barcode.value || "TICKET"} width={140} height={45} color={barcodeColor} />
      )}
      {data.barcode.showValue && (
        <div style={{ fontSize: 8, fontFamily: "monospace", color: hexToRgba(textColor, 0.5), letterSpacing: "0.1em" }}>
          {data.barcode.value}
        </div>
      )}
    </div>
  );
}

function isColorDark(hex: string): boolean {
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

// ━━━ Stub Section ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TicketStub({ data, stubWidth, ticketHeight, bodyFont, labelSize, bodySize, accent, textColor }: {
  data: TicketFormData; stubWidth: number; ticketHeight: number; bodyFont: string; labelSize: number; bodySize: number; accent: string; textColor: string;
}) {
  if (!data.stub.enabled) return null;

  return (
    <div
      data-tk-section="stub"
      style={{
        width: stubWidth,
        height: ticketHeight,
        padding: "12px 10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      {/* Top info */}
      <div>
        <div style={{ fontSize: labelSize, fontFamily: bodyFont, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {data.attendee.ticketClass || "ADMIT ONE"}
        </div>
        <div style={{ fontSize: bodySize * 0.9, fontFamily: bodyFont, fontWeight: 600, color: textColor, marginTop: 4, lineHeight: 1.2 }}>
          {data.event.eventName || "Event"}
        </div>
        {data.event.date && (
          <div style={{ fontSize: labelSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.6), marginTop: 4 }}>
            {formatDateCompact(data.event.date)}
          </div>
        )}
      </div>

      {/* Serial / seat info */}
      <div>
        {data.seat.seat && (
          <div style={{ fontSize: labelSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.6) }}>
            SEAT {data.seat.seat}
          </div>
        )}
        {data.serial.enabled && (
          <div style={{ fontSize: labelSize * 1.1, fontFamily: "monospace", fontWeight: 700, color: accent, letterSpacing: "0.08em", marginTop: 4 }}>
            {getSerialNumber(data.serial.prefix, data.serial.startNumber, data.serial.padLength)}
          </div>
        )}
      </div>
    </div>
  );
}

// ━━━ Boarding Pass Renderer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function BoardingPassRenderer({ data, dims, headingFont, bodyFont, accent, textColor, bgColor }: {
  data: TicketFormData; dims: { w: number; h: number }; headingFont: string; bodyFont: string; accent: string; textColor: string; bgColor: string;
}) {
  const settings = getAdvancedSettings();
  const labelSize = scaledFontSize(8, "label");
  const bodySize = scaledFontSize(11, "body");
  const headingSize = scaledFontSize(18, "heading");
  const largeSize = scaledFontSize(32, "heading");

  const mainWidth = dims.w * 0.68;
  const rightWidth = dims.w * 0.32;

  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        display: "flex",
        fontFamily: getFontFamily(data.style.fontPairing, "body"),
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Main section */}
      <div style={{ width: mainWidth, height: dims.h, padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Top: airline + flight */}
        <div data-tk-section="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: headingSize, fontFamily: headingFont, fontWeight: 700, color: accent }}>
              {data.boarding.airline || "AIRLINE"}
            </div>
            <div style={{ fontSize: labelSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.6), marginTop: 2 }}>
              BOARDING PASS
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: labelSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.6) }}>FLIGHT</div>
            <div style={{ fontSize: bodySize * 1.3, fontFamily: bodyFont, fontWeight: 700, color: textColor }}>
              {data.boarding.flightNumber || "XX 000"}
            </div>
          </div>
        </div>

        {/* Middle: route */}
        <div data-tk-section="details" style={{ display: "flex", alignItems: "center", gap: 16, margin: "8px 0" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: largeSize, fontFamily: headingFont, fontWeight: 700, color: textColor, lineHeight: 1 }}>
              {data.boarding.departureCode || "DEP"}
            </div>
            <div style={{ fontSize: labelSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.6), marginTop: 2 }}>
              {data.boarding.departureCity || "Departure"}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ height: 1, flex: 1, background: hexToRgba(textColor, 0.2) }} />
            <svg width="20" height="20" viewBox="0 0 24 24" fill={accent} style={{ transform: "rotate(90deg)" }}>
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
            <div style={{ height: 1, flex: 1, background: hexToRgba(textColor, 0.2) }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: largeSize, fontFamily: headingFont, fontWeight: 700, color: textColor, lineHeight: 1 }}>
              {data.boarding.arrivalCode || "ARR"}
            </div>
            <div style={{ fontSize: labelSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.6), marginTop: 2 }}>
              {data.boarding.arrivalCity || "Arrival"}
            </div>
          </div>
        </div>

        {/* Bottom: passenger details grid */}
        <div data-tk-section="seating" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px 8px" }}>
          {[
            { label: "PASSENGER", value: data.boarding.passengerName || data.attendee.attendeeName || "—" },
            { label: "DATE", value: formatDateCompact(data.event.date) || "—" },
            { label: "BOARDING", value: data.boarding.boardingTime || "—" },
            { label: "SEAT", value: data.boarding.seatNumber || "—" },
            { label: "CLASS", value: data.boarding.travelClass || "Economy" },
          ].map((f, i) => (
            <div key={i}>
              <div style={{ fontSize: labelSize * 0.85, fontFamily: bodyFont, fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {f.label}
              </div>
              <div style={{ fontSize: bodySize * 0.95, fontFamily: bodyFont, fontWeight: i === 3 ? 700 : 500, color: textColor, marginTop: 1 }}>
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Perforation line */}
      {data.stub.enabled && data.stub.perforation !== "none" && (
        <div style={{ position: "relative", width: 0, zIndex: 1 }}>
          <PerforationLine orientation="vertical" length={dims.h} style={data.stub.perforation} color={hexToRgba(textColor, 0.2)} />
        </div>
      )}

      {/* Right stub section */}
      <div
        data-tk-section="stub"
        style={{
          width: rightWidth,
          height: dims.h,
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          background: hexToRgba(accent, 0.03),
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: labelSize, fontFamily: bodyFont, fontWeight: 600, color: accent }}>
            {data.boarding.airline || "AIRLINE"}
          </div>
          <div style={{ fontSize: headingSize * 0.7, fontFamily: headingFont, fontWeight: 700, color: textColor, marginTop: 4 }}>
            {data.boarding.departureCode || "DEP"} → {data.boarding.arrivalCode || "ARR"}
          </div>
          <div style={{ fontSize: labelSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.6), marginTop: 2 }}>
            {data.boarding.flightNumber || "XX 000"}
          </div>
        </div>

        {/* QR Code */}
        <TicketBarcodeBlock data={data} accent={accent} textColor={textColor} />

        <div style={{ textAlign: "center" }}>
          {data.boarding.seatNumber && (
            <div style={{ fontSize: bodySize * 1.3, fontFamily: bodyFont, fontWeight: 700, color: textColor }}>
              SEAT {data.boarding.seatNumber}
            </div>
          )}
          {data.boarding.boardingGroup && (
            <div style={{ fontSize: labelSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.6), marginTop: 2 }}>
              GROUP {data.boarding.boardingGroup}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ━━━ Wristband Renderer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function WristbandRenderer({ data, dims, headingFont, bodyFont, accent, textColor }: {
  data: TicketFormData; dims: { w: number; h: number }; headingFont: string; bodyFont: string; accent: string; textColor: string;
}) {
  const labelSize = scaledFontSize(7, "label");
  const bodySize = scaledFontSize(9, "body");
  const headingSize = scaledFontSize(14, "heading");

  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 16px",
        fontFamily: getFontFamily(data.style.fontPairing, "body"),
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div data-tk-section="header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: headingSize, fontFamily: headingFont, fontWeight: 700, color: textColor, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
          {data.event.eventName || "FESTIVAL"}
        </div>
        <div style={{ fontSize: bodySize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.7) }}>
          {formatDateCompact(data.event.date)}
        </div>
      </div>
      <div data-tk-section="details" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {data.attendee.ticketClass && (
          <div style={{ fontSize: labelSize, fontFamily: bodyFont, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.15em", padding: "2px 8px", border: `1px solid ${hexToRgba(accent, 0.4)}`, borderRadius: 2 }}>
            {data.attendee.ticketClass}
          </div>
        )}
        {data.serial.enabled && (
          <div style={{ fontSize: labelSize, fontFamily: "monospace", color: hexToRgba(textColor, 0.5) }}>
            {getSerialNumber(data.serial.prefix, data.serial.startNumber, data.serial.padLength)}
          </div>
        )}
      </div>
    </div>
  );
}

// ━━━ Standard Ticket Renderer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StandardTicketRenderer({ data, dims, headingFont, bodyFont, accent, textColor }: {
  data: TicketFormData; dims: { w: number; h: number }; headingFont: string; bodyFont: string; accent: string; textColor: string;
}) {
  const settings = getAdvancedSettings();
  const labelSize = scaledFontSize(8, "label");
  const bodySize = scaledFontSize(11, "body");
  const headingSize = scaledFontSize(data.format.ticketSize === "small" ? 14 : 18, "heading");
  const subSize = scaledFontSize(10, "body");

  const stubWidth = data.stub.enabled ? Math.min(dims.w * 0.22, 170) : 0;
  const mainWidth = dims.w - stubWidth;
  const hasPerforation = data.stub.enabled && data.stub.perforation !== "none";

  const mainPadding = data.format.margins === "none" ? "8px 12px" : data.format.margins === "narrow" ? "12px 16px" : "16px 20px";

  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        display: "flex",
        fontFamily: getFontFamily(data.style.fontPairing, "body"),
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Main ticket area */}
      <div
        style={{
          width: mainWidth,
          height: dims.h,
          padding: mainPadding,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        {/* Header */}
        <TicketHeader
          data={data}
          headingFont={headingFont}
          bodyFont={bodyFont}
          headingSize={headingSize}
          subSize={subSize}
          accent={accent}
          textColor={textColor}
        />

        {/* Attendee */}
        <TicketAttendeeBlock
          data={data}
          bodyFont={bodyFont}
          bodySize={bodySize}
          labelSize={labelSize}
          textColor={textColor}
        />

        {/* Details grid */}
        <TicketDetails
          data={data}
          bodyFont={bodyFont}
          bodySize={bodySize}
          labelSize={labelSize}
          accent={accent}
          textColor={textColor}
        />

        {/* Seating */}
        <TicketSeatBlock
          data={data}
          bodyFont={bodyFont}
          bodySize={bodySize}
          labelSize={labelSize}
          accent={accent}
          textColor={textColor}
        />

        {/* Footer */}
        <div data-tk-section="footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6 }}>
          <div>
            {data.organizerName && (
              <div style={{ fontSize: labelSize, fontFamily: bodyFont, color: hexToRgba(textColor, 0.5) }}>
                {data.organizerName}
              </div>
            )}
            {data.terms && (
              <div style={{ fontSize: labelSize * 0.85, fontFamily: bodyFont, color: hexToRgba(textColor, 0.35), marginTop: 2, maxWidth: 300 }}>
                {data.terms}
              </div>
            )}
            {data.serial.enabled && (
              <div style={{ fontSize: labelSize, fontFamily: "monospace", fontWeight: 700, color: accent, letterSpacing: "0.08em", marginTop: 2 }}>
                {getSerialNumber(data.serial.prefix, data.serial.startNumber, data.serial.padLength)}
              </div>
            )}
          </div>
          {!data.stub.enabled && (
            <TicketBarcodeBlock data={data} accent={accent} textColor={textColor} />
          )}
        </div>
      </div>

      {/* Perforation line */}
      {hasPerforation && (
        <div style={{ position: "relative", width: 0, zIndex: 1 }}>
          <PerforationLine orientation="vertical" length={dims.h} style={data.stub.perforation} color={hexToRgba(textColor, 0.2)} />
        </div>
      )}

      {/* Stub */}
      {data.stub.enabled && (
        <div style={{ position: "relative", background: hexToRgba(accent, 0.03) }}>
          <TicketStub
            data={data}
            stubWidth={stubWidth}
            ticketHeight={dims.h}
            bodyFont={bodyFont}
            labelSize={labelSize}
            bodySize={bodySize}
            accent={accent}
            textColor={textColor}
          />
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)" }}>
            <TicketBarcodeBlock data={data} accent={accent} textColor={textColor} />
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━ Main Renderer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TicketRendererProps {
  data: TicketFormData;
  pageGap?: number;
}

export default function TicketRenderer({ data, pageGap = PAGE_GAP }: TicketRendererProps) {
  const fontUrl = getGoogleFontUrl(data.style.fontPairing);

  // Compute dimensions
  const dims = useMemo(() => {
    if (data.format.ticketSize === "custom") {
      return { w: data.format.customWidth, h: data.format.customHeight };
    }
    return getTicketSize(data.format.ticketSize);
  }, [data.format.ticketSize, data.format.customWidth, data.format.customHeight]);

  const accent = data.style.accentColor;
  const bgColor = data.style.bgColor;
  const textColor = data.style.textColor;
  const headingFont = getFontFamily(data.style.fontPairing, "heading");
  const bodyFont = getFontFamily(data.style.fontPairing, "body");

  const templateBg = getTemplateBackground(data.style.template, accent, bgColor, data.style.gradientDirection);

  const isBoardingPass = data.ticketType === "boarding-pass";
  const isWristband = data.format.ticketSize === "wristband";
  const isA4Sheet = data.format.ticketSize === "a4-sheet";

  // A4 sheet: render multiple tickets on one page
  if (isA4Sheet) {
    const ticketsPerPage = data.format.ticketsPerPage || 3;
    const singleDims = { w: 750, h: Math.floor(1070 / ticketsPerPage) };

    return (
      <>
        {fontUrl && (
          <link rel="stylesheet" href={fontUrl} />
        )}
        <div className="flex flex-col items-center" style={{ gap: pageGap }}>
          <div
            data-tk-page={1}
            className="bg-white shadow-2xl shadow-black/20"
            style={{
              width: 794,
              height: 1123,
              padding: "26px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {Array.from({ length: ticketsPerPage }, (_, i) => (
              <div
                key={i}
                className="tk-canvas-root"
                style={{
                  ...templateBg,
                  borderRadius: 4,
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <StandardTicketRenderer
                  data={{
                    ...data,
                    serial: {
                      ...data.serial,
                      startNumber: data.serial.startNumber + i,
                    },
                  }}
                  dims={singleDims}
                  headingFont={headingFont}
                  bodyFont={bodyFont}
                  accent={accent}
                  textColor={textColor}
                />
              </div>
            ))}

            {/* Crop marks */}
            {data.format.cropMarks && (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {Array.from({ length: ticketsPerPage + 1 }, (_, i) => {
                  const y = 26 + i * (Math.floor(1070 / ticketsPerPage) + 8);
                  return (
                    <div key={i}>
                      <div style={{ position: "absolute", left: 4, top: y, width: 12, height: 0, borderTop: "0.5px solid #666" }} />
                      <div style={{ position: "absolute", right: 4, top: y, width: 12, height: 0, borderTop: "0.5px solid #666" }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} />
      )}
      <div className="flex flex-col items-center" style={{ gap: pageGap }}>
        <div
          data-tk-page={1}
          className="shadow-2xl shadow-black/20"
          style={{
            width: dims.w,
            height: dims.h,
            ...templateBg,
            borderRadius: isWristband ? 40 : 6,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {isBoardingPass ? (
            <BoardingPassRenderer
              data={data}
              dims={dims}
              headingFont={headingFont}
              bodyFont={bodyFont}
              accent={accent}
              textColor={textColor}
              bgColor={bgColor}
            />
          ) : isWristband ? (
            <WristbandRenderer
              data={data}
              dims={dims}
              headingFont={headingFont}
              bodyFont={bodyFont}
              accent={accent}
              textColor={textColor}
            />
          ) : (
            <StandardTicketRenderer
              data={data}
              dims={dims}
              headingFont={headingFont}
              bodyFont={bodyFont}
              accent={accent}
              textColor={textColor}
            />
          )}

          {/* Bleed indicators (design-time only) */}
          {data.format.bleed && (
            <div style={{
              position: "absolute",
              inset: -3,
              border: "1px dashed rgba(255,0,0,0.3)",
              borderRadius: isWristband ? 42 : 8,
              pointerEvents: "none",
            }} />
          )}
        </div>
      </div>
    </>
  );
}
