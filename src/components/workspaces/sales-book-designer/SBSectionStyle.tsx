// =============================================================================
// DMSuite — Sales Book Section: Style & Template
// Template selection with visual previews, accent colors, fonts, field & border styles.
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
import { SectionLabel } from "./SalesUIKit";

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  professional: "Professional",
  commerce: "Commerce",
  minimal: "Minimal",
  classic: "Classic",
};

// ── HSV color picker for custom accent colors ──

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

  // Sync from external color changes
  useEffect(() => {
    setHexInput(value);
    const n = hexToHSV(value);
    if (Math.abs(n.h - hue) > 1 || Math.abs(n.s - sat) > 0.01 || Math.abs(n.v - val) > 0.01) {
      setHue(n.h); setSat(n.s); setVal(n.v);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close on outside click
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

  const handleSV = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = svRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    commit(hue, x, 1 - y);
  }, [hue, commit]);

  const handleSVDown = useCallback((e: React.MouseEvent) => {
    handleSV(e);
    const move = (ev: MouseEvent) => handleSV(ev);
    const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }, [handleSV]);

  const handleHue = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    commit(x * 360, sat, val);
  }, [sat, val, commit]);

  const handleHueDown = useCallback((e: React.MouseEvent) => {
    handleHue(e);
    const move = (ev: MouseEvent) => handleHue(ev);
    const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
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
        className="flex items-center gap-1.5 rounded-xl border border-gray-700/60 bg-gray-800/40 px-2.5 py-1.5 hover:border-gray-600 transition-colors"
      >
        <span className="w-5 h-5 rounded border border-gray-600 shrink-0" style={{ backgroundColor: value }} />
        <span className="text-[11px] font-mono text-gray-300">{value}</span>
        <svg className="w-3 h-3 text-gray-500" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5l3 3 3-3" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-52 bg-gray-900/95 border border-gray-700/60 rounded-xl shadow-2xl shadow-black/40 backdrop-blur-xl p-3 space-y-2">
          {/* SV pad */}
          <div
            ref={svRef}
            className="relative w-full h-28 rounded cursor-crosshair border border-gray-700/60 overflow-hidden"
            style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})` }}
            onMouseDown={handleSVDown}
          >
            <div
              className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{ left: `${sat * 100}%`, top: `${(1 - val) * 100}%`, transform: "translate(-50%,-50%)", backgroundColor: value }}
            />
          </div>
          {/* Hue bar */}
          <div
            ref={hueRef}
            className="relative w-full h-2.5 rounded-full cursor-pointer"
            style={{ background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)" }}
            onMouseDown={handleHueDown}
          >
            <div
              className="absolute top-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{ left: `${(hue / 360) * 100}%`, transform: "translate(-50%,-50%)", backgroundColor: hueColor }}
            />
          </div>
          {/* Hex input */}
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            className="w-full px-2 py-1 bg-gray-800/60 border border-gray-700/60 rounded-xl text-[11px] text-gray-200 font-mono focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
            maxLength={7}
            placeholder="#000000"
          />
        </div>
      )}
    </div>
  );
}

// ── Distinct mini template visual preview per template ──

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
      {/* Page border overlay */}
      {template.pageBorderWeight !== "none" && (
        <div style={{ position: "absolute", inset: "1px", border: `${template.pageBorderWeight === "thick" ? "2px" : "1px"} solid ${accent}`, pointerEvents: "none", zIndex: 2, borderRadius: "1px" }} />
      )}

      {/* Watermark hint */}
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

      {/* Decorative overlay hints */}
      {template.decorative === "corner-gradient" && (
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", background: `linear-gradient(135deg, ${accent}40, ${accent2}30)`, borderRadius: "3px 0 0 0", pointerEvents: "none", zIndex: 1 }} />
      )}
      {template.decorative === "top-circles" && (
        <>
          <div style={{ position: "absolute", top: "-4px", left: "2px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: accent2, opacity: 0.15, pointerEvents: "none", zIndex: 1 }} />
          <div style={{ position: "absolute", top: "-3px", left: "6px", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: accent, opacity: 0.1, pointerEvents: "none", zIndex: 1 }} />
        </>
      )}

      {/* Header treatment varies by headerStyle */}
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
              {template.contactIcons && (
                <div style={{ display: "flex", gap: "1px", marginTop: "1px" }}>
                  <div style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: accent, opacity: 0.5 }} />
                  <div style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: accent, opacity: 0.5 }} />
                </div>
              )}
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
        <>
          <div style={{ border: `1px solid ${accent}60`, padding: "1px", marginBottom: "2px", borderRadius: "1px" }}>
            <div style={{ height: "2px", width: "60%", backgroundColor: accent, borderRadius: "1px", marginBottom: "1px" }} />
            <div style={{ height: "1.5px", width: "40%", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
          </div>
        </>
      )}

      {/* Fields row */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
        <div style={{ flex: 1, height: "2px", backgroundColor: "#d1d5db", borderRadius: "1px", borderRight: template.fieldSeparators ? "0.5px solid #d1d5db" : "none" }} />
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

      {/* Footer bar hint */}
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

      {/* Receipt sidebar hint */}
      {template.receiptSidebar && (
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "4px", backgroundColor: template.receiptSidebarColor ?? accent, opacity: 0.6 }} />
      )}
    </div>
  );
}

export default function SBSectionStyle() {
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
    <div className="space-y-4">
      {/* Template */}
      <div>
        <SectionLabel>Template</SectionLabel>
        <div className="max-h-80 overflow-y-auto pr-1 space-y-3">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const catTemplates = SALES_BOOK_TEMPLATES.filter((t) => t.category === cat);
            if (catTemplates.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{CATEGORY_LABELS[cat]}</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {catTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => updateStyle({ template: tpl.id, accentColor: tpl.accent, borderStyle: tpl.borderStyle })}
                      title={tpl.description}
                      className={`rounded-xl border p-2 text-center transition-all ${
                        style.template === tpl.id
                          ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                          : "border-gray-700 bg-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <TemplateThumbnail template={tpl} />
                      <span className="text-[9px] font-medium text-gray-300 mt-1 block truncate">{tpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <SectionLabel>Accent Color</SectionLabel>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => updateStyle({ accentColor: color.hex })}
              title={color.label}
              className={`w-7 h-7 rounded-lg transition-all ${
                style.accentColor === color.hex ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-900 scale-110" : "hover:scale-105"
              }`}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
        <HexColorPicker value={style.accentColor} onChange={(hex) => updateStyle({ accentColor: hex })} />
      </div>

      {/* Font Pairing */}
      <div>
        <SectionLabel>Font Pairing</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {FONT_PAIRINGS.map((fp) => (
            <button
              key={fp.id}
              onClick={() => updateStyle({ fontPairing: fp.id })}
              className={`rounded-xl border p-2.5 text-left transition-all ${
                style.fontPairing === fp.id
                  ? "border-primary-500 bg-primary-500/10"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <span className="text-[11px] text-gray-200">{fp.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Field Style */}
      <div>
        <SectionLabel>Blank Field Style</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {FIELD_STYLES.map((fs) => (
            <button
              key={fs}
              onClick={() => updateStyle({ fieldStyle: fs })}
              className={`rounded-xl border p-2.5 text-center transition-all ${
                style.fieldStyle === fs
                  ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <div className="flex items-end justify-center h-5 mb-1">
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
      </div>

      {/* Border Style */}
      <div>
        <SectionLabel>Form Border</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {BORDER_STYLES.map((bs) => (
            <button
              key={bs}
              onClick={() => updateStyle({ borderStyle: bs })}
              className={`rounded-xl border p-2.5 text-center transition-all ${
                style.borderStyle === bs
                  ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center justify-center h-5 mb-1">
                <div
                  className="w-8 h-5"
                  style={{
                    border:
                      bs === "solid" ? "2px solid #9ca3af" : bs === "double" ? "4px double #9ca3af" : "1px dashed #4b5563",
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-300 capitalize">{bs}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Watermark Image */}
      <div>
        <SectionLabel>Background Watermark</SectionLabel>
        {style.watermarkImage ? (
          <div className="space-y-2">
            <div className="relative rounded-xl border border-gray-700/60 bg-gray-800/40 p-2.5 flex items-center gap-2">
              <img src={style.watermarkImage} alt="Watermark" className="h-8 w-8 object-contain rounded opacity-60" />
              <span className="text-xs text-gray-300 flex-1 truncate">Watermark set</span>
              <button
                onClick={() => updateStyle({ watermarkImage: undefined })}
                className="text-[10px] text-error-400 hover:text-error-300 transition-colors"
              >
                Remove
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-500 shrink-0">Opacity</label>
              <input
                type="range"
                min={0.02}
                max={0.2}
                step={0.01}
                value={style.watermarkOpacity ?? 0.06}
                onChange={(e) => updateStyle({ watermarkOpacity: parseFloat(e.target.value) })}
                className="flex-1 h-1 accent-primary-500"
              />
              <span className="text-[10px] text-gray-400 w-8 text-right">{Math.round((style.watermarkOpacity ?? 0.06) * 100)}%</span>
            </div>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700/60 bg-gray-800/30 p-3.5 text-xs text-gray-400 cursor-pointer transition-colors hover:border-gray-600 hover:text-gray-300">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            Upload logo watermark
            <input type="file" accept="image/*" className="hidden" onChange={handleWatermarkUpload} />
          </label>
        )}
      </div>
    </div>
  );
}
