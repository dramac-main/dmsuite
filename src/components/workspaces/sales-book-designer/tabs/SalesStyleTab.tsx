// =============================================================================
// DMSuite — Sales Style Tab
// Template selection, accent color, font pairing, field style, border style,
// watermark — with touch-friendly color picker and responsive template grid.
// =============================================================================

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
import {
  SALES_BOOK_TEMPLATES,
  TEMPLATE_CATEGORIES,
  ACCENT_COLORS,
  FONT_PAIRINGS,
  FIELD_STYLES,
  FIELD_STYLE_LABELS,
  BORDER_STYLES,
} from "@/lib/sales-book/schema";
import type { SalesBookTemplate, TemplateCategory } from "@/lib/sales-book/schema";
import {
  SectionCard,
  SectionLabel,
  ColorSwatchPicker,
} from "../SalesUIKit";

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  professional: "Professional",
  commerce: "Commerce",
  minimal: "Minimal",
  classic: "Classic",
};

// ── HSV color picker with TOUCH SUPPORT ──

function hsvToHex(h: number, s: number, v: number): string {
  const hi = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (hi) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHSV(hex: string): { h: number; s: number; v: number } {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const v = max, s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s, v };
}

function HexColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const init = hexToHSV(value);
  const [hue, setHue] = useState(init.h);
  const [sat, setSat] = useState(init.s);
  const [val, setVal] = useState(init.v);
  const [hexInput, setHexInput] = useState(value);

  useEffect(() => {
    setHexInput(value);
    const n = hexToHSV(value);
    if (Math.abs(n.h - hue) > 1 || Math.abs(n.s - sat) > 0.01 || Math.abs(n.v - val) > 0.01) {
      setHue(n.h); setSat(n.s); setVal(n.v);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const commit = useCallback((h: number, s: number, v: number) => {
    setHue(h); setSat(s); setVal(v);
    const hex = hsvToHex(h, s, v);
    setHexInput(hex);
    onChange(hex);
  }, [onChange]);

  // Unified pointer handler for both mouse and touch
  const getPointerPos = (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    if ("touches" in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const handleSV = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    const rect = svRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX, clientY } = getPointerPos(e);
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    commit(hue, x, 1 - y);
  }, [hue, commit]);

  const handleSVDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    handleSV(e);
    if ("touches" in e) {
      const move = (ev: TouchEvent) => { ev.preventDefault(); handleSV(ev); };
      const up = () => { document.removeEventListener("touchmove", move); document.removeEventListener("touchend", up); };
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("touchend", up);
    } else {
      const move = (ev: MouseEvent) => handleSV(ev);
      const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    }
  }, [handleSV]);

  const handleHue = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX } = getPointerPos(e);
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    commit(x * 360, sat, val);
  }, [sat, val, commit]);

  const handleHueDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    handleHue(e);
    if ("touches" in e) {
      const move = (ev: TouchEvent) => { ev.preventDefault(); handleHue(ev); };
      const up = () => { document.removeEventListener("touchmove", move); document.removeEventListener("touchend", up); };
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("touchend", up);
    } else {
      const move = (ev: MouseEvent) => handleHue(ev);
      const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    }
  }, [handleHue]);

  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    setHexInput(v);
    if (!v.startsWith("#")) v = "#" + v;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      const n = hexToHSV(v);
      setHue(n.h); setSat(n.s); setVal(n.v);
      onChange(v.toLowerCase());
    }
  }, [onChange]);

  const hueColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-gray-700/60 bg-gray-800/40 px-3 py-2 hover:border-gray-600 transition-colors"
      >
        <span className="w-6 h-6 rounded-lg border border-gray-600 shrink-0" style={{ backgroundColor: value }} />
        <span className="text-[12px] font-mono text-gray-300">{value}</span>
        <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5l3 3 3-3" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-2 left-0 w-56 bg-gray-900/95 border border-gray-700/60 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-xl p-3.5 space-y-3">
          {/* SV pad */}
          <div
            ref={svRef}
            className="relative w-full h-32 rounded-xl cursor-crosshair border border-gray-700/60 overflow-hidden touch-none"
            style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})` }}
            onMouseDown={handleSVDown}
            onTouchStart={handleSVDown}
          >
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{ left: `${sat * 100}%`, top: `${(1 - val) * 100}%`, transform: "translate(-50%,-50%)", backgroundColor: value }}
            />
          </div>
          {/* Hue bar */}
          <div
            ref={hueRef}
            className="relative w-full h-3 rounded-full cursor-pointer touch-none"
            style={{ background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)" }}
            onMouseDown={handleHueDown}
            onTouchStart={handleHueDown}
          >
            <div
              className="absolute top-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{ left: `${(hue / 360) * 100}%`, transform: "translate(-50%,-50%)", backgroundColor: hueColor }}
            />
          </div>
          {/* Hex input */}
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700/60 rounded-xl text-[12px] text-gray-200 font-mono focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
            maxLength={7}
            placeholder="#000000"
          />
        </div>
      )}
    </div>
  );
}

// ── Template Thumbnail (kept from original, no changes needed to logic) ──

function TemplateThumbnail({ template }: { template: SalesBookTemplate }) {
  const accent = template.accent;
  const accent2 = template.accentSecondary ?? accent;
  const border =
    template.borderStyle === "double"
      ? `3px double ${accent}`
      : template.borderStyle === "solid"
        ? `1px solid ${accent}`
        : "1px solid #e5e7eb";

  return (
    <div
      className="w-full aspect-3/4 rounded-sm overflow-hidden"
      style={{ border, backgroundColor: "#fff", padding: "3px", position: "relative" }}
    >
      {template.pageBorderWeight !== "none" && (
        <div style={{ position: "absolute", inset: "1px", border: `${template.pageBorderWeight === "thick" ? "2px" : "1px"} solid ${accent}`, pointerEvents: "none", zIndex: 2, borderRadius: "1px" }} />
      )}
      {template.watermark !== "none" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0 }}>
          {template.watermark === "logo" ? (
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: `1.5px solid ${accent}`, opacity: 0.12 }} />
          ) : (
            <div style={{ fontSize: "5px", fontWeight: 900, color: accent, opacity: 0.08, transform: "rotate(-25deg)", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {template.watermark === "text" ? "INVOICE" : "TITLE"}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      {template.headerStyle === "banner" && (
        <>
          <div style={{ height: "8px", backgroundColor: accent, borderRadius: "1px", marginBottom: "2px", marginLeft: "-3px", marginRight: "-3px", marginTop: "-3px", background: template.headerGradient ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : accent }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <div style={{ height: "2px", width: "30%", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
            <div style={{ height: "2px", width: "20%", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
          </div>
        </>
      )}
      {template.headerStyle === "minimal" && (
        <>
          <div style={{ height: "2px", width: "35%", backgroundColor: accent, borderRadius: "1px", marginBottom: "2px" }} />
          <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
            <div style={{ flex: 1, height: "1.5px", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
            <div style={{ flex: 1, height: "1.5px", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
          </div>
          <div style={{ height: "1px", backgroundColor: accent, opacity: 0.3, marginBottom: "2px" }} />
        </>
      )}
      {template.headerStyle === "centered" && (
        <>
          <div style={{ textAlign: "center", marginBottom: "2px" }}>
            <div style={{ height: "2px", width: "40%", backgroundColor: accent, borderRadius: "1px", margin: "0 auto 2px" }} />
            <div style={{ height: "1.5px", width: "25%", backgroundColor: accent, opacity: 0.4, borderRadius: "1px", margin: "0 auto" }} />
          </div>
          <div style={{ height: "1px", borderBottom: `1px solid ${accent}30`, marginBottom: "2px" }} />
        </>
      )}
      {template.headerStyle === "left-heavy" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
            <div>
              <div style={{ height: "3px", width: "24px", backgroundColor: accent, borderRadius: "1px", marginBottom: "1px" }} />
              <div style={{ height: "1.5px", width: "18px", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
            </div>
            <div style={{ height: "3px", width: "16px", backgroundColor: accent, opacity: 0.5, borderRadius: "1px" }} />
          </div>
          <div style={{ height: "1.5px", backgroundColor: accent, marginBottom: "2px" }} />
        </>
      )}
      {template.headerStyle === "split" && (
        <>
          <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
            <div style={{ flex: 1, height: "3px", backgroundColor: accent, opacity: 0.7, borderRadius: "1px" }} />
            <div style={{ width: "1px", backgroundColor: "#d1d5db" }} />
            <div style={{ flex: 1, height: "3px", backgroundColor: accent, opacity: 0.3, borderRadius: "1px" }} />
          </div>
          <div style={{ height: "1px", backgroundColor: "#e5e7eb", marginBottom: "2px" }} />
        </>
      )}
      {template.headerStyle === "boxed" && (
        <div style={{ border: `1px solid ${accent}60`, padding: "1px", marginBottom: "2px", borderRadius: "1px" }}>
          <div style={{ height: "2px", width: "60%", backgroundColor: accent, borderRadius: "1px", marginBottom: "1px" }} />
          <div style={{ height: "1.5px", width: "40%", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
        </div>
      )}

      {/* Fields row */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
        <div style={{ flex: 1, height: "2px", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
        <div style={{ flex: 1, height: "2px", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
      </div>

      {/* Table header */}
      <div
        style={{
          height: "3px",
          backgroundColor: template.tableHeaderFill ? accent : "transparent",
          border: !template.tableHeaderFill ? `0.5px solid ${accent}60` : "none",
          borderRadius: "1px",
          marginBottom: "1px",
          opacity: template.tableHeaderFill ? 0.8 : 1,
        }}
      />

      {/* Table rows */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: "2px",
            backgroundColor: template.tableStyle === "striped" && i % 2 === 0 ? (template.accentSecondary ? `${template.accentSecondary}30` : "#f3f4f6") : "transparent",
            borderBottom: template.tableStyle === "bordered" ? `${template.tableBorderWeight === "heavy" ? "1px" : "0.5px"} solid #d1d5db` : template.tableStyle === "clean" ? "0.5px solid #f3f4f6" : "0.5px solid #e5e7eb",
            marginBottom: "1px",
          }}
        />
      ))}

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
        <div
          style={{
            width: "40%",
            height: "2.5px",
            backgroundColor: template.totalsStyle === "badge" ? accent : `${accent}40`,
            borderRadius: template.totalsStyle === "badge" ? "1px" : "0",
            borderTop: template.totalsBorder ? `1px solid ${accent}` : "none",
            ...(template.totalsStyle === "boxed" ? { border: `0.5px solid ${accent}60` } : {}),
          }}
        />
      </div>

      {/* Footer */}
      {template.footerStyle === "bar" && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", backgroundColor: accent, opacity: 0.7 }} />
      )}
      {template.footerStyle === "contact-bar" && (
        <div style={{ position: "absolute", bottom: "1px", left: "3px", right: "3px", height: "2px", borderTop: `0.5px solid ${accent}30`, display: "flex", gap: "2px", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: "2px", height: "2px", borderRadius: "50%", backgroundColor: accent, opacity: 0.4 }} />
          <div style={{ width: "2px", height: "2px", borderRadius: "50%", backgroundColor: accent, opacity: 0.4 }} />
        </div>
      )}
      {template.footerStyle === "line" && (
        <div style={{ position: "absolute", bottom: "2px", left: "3px", right: "3px", borderTop: `0.5px solid ${accent}20` }} />
      )}
      {template.receiptSidebar && (
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "4px", backgroundColor: template.receiptSidebarColor ?? accent, opacity: 0.6 }} />
      )}
      {template.decorative === "corner-gradient" && (
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", background: `linear-gradient(135deg, ${accent}40, ${accent2}30)`, borderRadius: "3px 0 0 0", pointerEvents: "none", zIndex: 1 }} />
      )}
    </div>
  );
}

// =============================================================================

export default function SalesStyleTab() {
  const style = useSalesBookEditor((s) => s.form.style);
  const updateStyle = useSalesBookEditor((s) => s.updateStyle);

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateStyle({ watermarkImage: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5 p-4">
      {/* ── Template ── */}
      <SectionCard title="Template" description="Choose a layout style for your forms">
        <div className="max-h-96 overflow-y-auto pr-1 space-y-4">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const catTemplates = SALES_BOOK_TEMPLATES.filter((t) => t.category === cat);
            if (catTemplates.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{CATEGORY_LABELS[cat]}</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {catTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => updateStyle({ template: tpl.id, accentColor: tpl.accent, borderStyle: tpl.borderStyle })}
                      title={tpl.description}
                      className={`rounded-xl border p-2 text-center transition-all active:scale-[0.97] ${
                        style.template === tpl.id
                          ? "border-primary-500/50 bg-primary-500/10 ring-1 ring-primary-500/30"
                          : "border-gray-700/60 bg-gray-800/40 hover:border-gray-600"
                      }`}
                    >
                      <TemplateThumbnail template={tpl} />
                      <span className="text-[9px] font-medium text-gray-300 mt-1.5 block truncate">{tpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Accent Color ── */}
      <SectionCard title="Accent Color" description="Primary color for headers, accents and highlights">
        <ColorSwatchPicker
          colors={ACCENT_COLORS.map((c) => ({ hex: c.hex, label: c.label }))}
          value={style.accentColor}
          onChange={(hex) => updateStyle({ accentColor: hex })}
        />
        <div className="mt-3">
          <HexColorPicker value={style.accentColor} onChange={(hex) => updateStyle({ accentColor: hex })} />
        </div>
      </SectionCard>

      {/* ── Font Pairing ── */}
      <SectionCard title="Font Pairing">
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
          {FONT_PAIRINGS.map((fp) => (
            <button
              key={fp.id}
              onClick={() => updateStyle({ fontPairing: fp.id })}
              className={`rounded-xl border p-3 text-left transition-all active:scale-[0.97] ${
                style.fontPairing === fp.id
                  ? "border-primary-500/50 bg-primary-500/10 ring-1 ring-primary-500/20"
                  : "border-gray-700/60 bg-gray-800/40 hover:border-gray-600"
              }`}
            >
              <span className="text-[12px] text-gray-200 font-medium">{fp.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* ── Field Style ── */}
      <SectionCard title="Blank Field Style" description="How empty fields appear on printed forms">
        <div className="grid grid-cols-3 gap-2">
          {FIELD_STYLES.map((fs) => (
            <button
              key={fs}
              onClick={() => updateStyle({ fieldStyle: fs })}
              className={`rounded-xl border p-3 text-center transition-all active:scale-[0.97] ${
                style.fieldStyle === fs
                  ? "border-primary-500/50 bg-primary-500/10 ring-1 ring-primary-500/30"
                  : "border-gray-700/60 bg-gray-800/40 hover:border-gray-600"
              }`}
            >
              <div className="flex items-end justify-center h-5 mb-1.5">
                <div
                  className="w-12"
                  style={{
                    borderBottom: fs === "underline" ? "2px solid #9ca3af" : fs === "dotted" ? "2px dotted #9ca3af" : "none",
                    border: fs === "box" ? "1px solid #9ca3af" : undefined,
                    height: fs === "box" ? "14px" : "auto",
                    borderRadius: fs === "box" ? "2px" : 0,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-300">{FIELD_STYLE_LABELS[fs]}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* ── Border Style ── */}
      <SectionCard title="Form Border">
        <div className="grid grid-cols-3 gap-2">
          {BORDER_STYLES.map((bs) => (
            <button
              key={bs}
              onClick={() => updateStyle({ borderStyle: bs })}
              className={`rounded-xl border p-3 text-center transition-all active:scale-[0.97] ${
                style.borderStyle === bs
                  ? "border-primary-500/50 bg-primary-500/10 ring-1 ring-primary-500/30"
                  : "border-gray-700/60 bg-gray-800/40 hover:border-gray-600"
              }`}
            >
              <div className="h-5 w-12 mx-auto mb-1.5" style={{
                border: bs === "solid" ? "2px solid #9ca3af" : bs === "double" ? "4px double #9ca3af" : "none",
                borderRadius: "2px",
              }} />
              <span className="text-[10px] text-gray-300 capitalize">{bs}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* ── Watermark ── */}
      <SectionCard title="Watermark">
        <div className="flex items-center gap-3">
          {style.watermarkImage ? (
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={style.watermarkImage} alt="Watermark" className="h-12 w-auto rounded-lg border border-gray-700/60 object-contain bg-white/5 p-1" />
              <button
                onClick={() => updateStyle({ watermarkImage: undefined })}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 rounded-xl border border-dashed border-gray-700/60 bg-gray-800/30 px-4 py-3 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors cursor-pointer active:scale-[0.97]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Upload Watermark
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleWatermarkUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-[10px] text-gray-600 mt-2">Faint background image on every form. PNG recommended.</p>
      </SectionCard>
    </div>
  );
}
