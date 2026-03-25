// =============================================================================
// DMSuite — Contract Style Tab
// Template selection, accent color, font pairing, header style.
// Follows the same visual approach as SalesStyleTab.
// =============================================================================

"use client";

import React, { useState, useRef, useCallback } from "react";
import { useContractEditor } from "@/stores/contract-editor";
import {
  CONTRACT_TEMPLATES,
  COVER_DESIGNS,
  ACCENT_COLORS,
  FONT_PAIRINGS,
  type ContractTemplate,
  type CoverDesignId,
} from "@/lib/contract/schema";
import {
  AccordionSection,
  ChipGroup,
  FormSelect,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

const icons = {
  cover: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  template: <SIcon d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />,
  color: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="13.5" cy="17.5" r="2.5" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  font: <SIcon d="M4 7V4h16v3M9 20h6M12 4v16" />,
  header: <SIcon d="M4 5h16M4 9h10M4 13h16M4 17h6" />,
};

// ─── HSV Color Picker (same approach as Sales Style Tab) ───

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex(h: number, s: number, v: number): string {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r: number, g: number, b: number;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q;
  }
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function HSVColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const hsv = hexToHsv(value);
  const svRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"sv" | "hue" | null>(null);
  const [localHex, setLocalHex] = useState(value);

  const handleSV = useCallback((clientX: number, clientY: number) => {
    const rect = svRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    const hex = hsvToHex(hsv.h, s, v);
    setLocalHex(hex);
    onChange(hex);
  }, [hsv.h, onChange]);

  const handleHue = useCallback((clientX: number, rect: DOMRect) => {
    const h = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const hex = hsvToHex(h, hsv.s, hsv.v);
    setLocalHex(hex);
    onChange(hex);
  }, [hsv.s, hsv.v, onChange]);

  const onPointerDownSV = (e: React.PointerEvent) => {
    setDragging("sv");
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleSV(e.clientX, e.clientY);
  };
  const onPointerMoveSV = (e: React.PointerEvent) => { if (dragging === "sv") handleSV(e.clientX, e.clientY); };
  const onPointerUp = () => setDragging(null);

  const pureHue = hsvToHex(hsv.h, 1, 1);

  return (
    <div className="space-y-2.5">
      {/* SV Area */}
      <div
        ref={svRef}
        onPointerDown={onPointerDownSV}
        onPointerMove={onPointerMoveSV}
        onPointerUp={onPointerUp}
        className="relative w-full h-32 rounded-xl cursor-crosshair touch-none"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${pureHue})` }}
      >
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: value }}
        />
      </div>

      {/* Hue Slider */}
      <div
        className="relative w-full h-4 rounded-full cursor-pointer touch-none"
        style={{ background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)" }}
        onPointerDown={(e) => {
          setDragging("hue");
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          handleHue(e.clientX, e.currentTarget.getBoundingClientRect());
        }}
        onPointerMove={(e) => { if (dragging === "hue") handleHue(e.clientX, e.currentTarget.getBoundingClientRect()); }}
        onPointerUp={onPointerUp}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
          style={{ left: `${hsv.h * 100}%`, backgroundColor: pureHue }}
        />
      </div>

      {/* Hex Input + Preview */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg shrink-0 ring-1 ring-white/10" style={{ backgroundColor: value }} />
        <input
          type="text"
          value={localHex}
          onChange={(e) => {
            setLocalHex(e.target.value);
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) onChange(e.target.value);
          }}
          onBlur={() => setLocalHex(value)}
          className="flex-1 rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-1.5 text-[12px] text-gray-100 font-mono focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
        />
      </div>

      {/* Preset swatches */}
      <div className="flex flex-wrap gap-1.5">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c.hex}
            onClick={() => { onChange(c.hex); setLocalHex(c.hex); }}
            title={c.label}
            className={`w-7 h-7 rounded-lg transition-all ${
              value.toLowerCase() === c.hex.toLowerCase()
                ? "ring-2 ring-primary-400 ring-offset-2 ring-offset-gray-900 scale-110"
                : "hover:scale-105"
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Tab ───

export default function ContractStyleTab() {
  const form = useContractEditor((s) => s.form);
  const updateStyle = useContractEditor((s) => s.updateStyle);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    cover: true,
    template: false,
    color: true,
    font: false,
    header: false,
  });

  const toggle = (key: string) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const TEMPLATE_CATEGORIES = ["professional", "classic", "modern", "premium"] as const;

  return (
    <div>
      {/* Cover Design */}
      <AccordionSection
        title="Cover Design"
        icon={icons.cover}
        isOpen={openSections.cover}
        onToggle={() => toggle("cover")}
        badge={COVER_DESIGNS.find((d) => d.id === (form.style.coverDesign ?? "classic"))?.name}
      >
        <div className="grid grid-cols-2 gap-2">
          {COVER_DESIGNS.map((design) => {
            const selected = (form.style.coverDesign ?? "classic") === design.id;
            const accent = form.style.accentColor || "#1e40af";
            return (
              <button
                key={design.id}
                onClick={() => {
                  if (design.id === "none") {
                    updateStyle({ showCoverPage: false, coverDesign: "none" as CoverDesignId });
                  } else {
                    updateStyle({ showCoverPage: true, coverDesign: design.id as CoverDesignId });
                  }
                }}
                className={`relative rounded-xl border p-2 text-left transition-all active:scale-[0.97] ${
                  selected
                    ? "border-primary-500/50 bg-primary-500/8 ring-1 ring-primary-500/20"
                    : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60 hover:bg-gray-800/50"
                }`}
              >
                {/* Cover mini preview */}
                <div className="w-full h-16 rounded-lg mb-1.5 overflow-hidden relative bg-white">
                  {design.preview === "none" && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="flex flex-col gap-1.5 items-center">
                        {[70, 55, 40].map((w, i) => (
                          <div key={i} style={{ height: "2px", width: `${w}%`, backgroundColor: "#e2e8f0", borderRadius: "1px" }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {design.preview === "classic" && (
                    <>
                      <div className="h-full flex flex-col items-center justify-center gap-1 px-2 py-1">
                        <div style={{ height: "3px", width: "70%", backgroundColor: "#1a1a1a", borderRadius: "1px", marginBottom: "2px" }} />
                        <div style={{ height: "2px", width: "30%", backgroundColor: "#94a3b8", borderRadius: "1px" }} />
                        <div style={{ height: "1px", width: "40%", backgroundColor: "#e5e7eb", marginTop: "2px" }} />
                        <div style={{ height: "2px", width: "30%", backgroundColor: "#94a3b8", borderRadius: "1px" }} />
                      </div>
                    </>
                  )}
                  {design.preview === "corporate" && (
                    <>
                      <div style={{ height: "20%", backgroundColor: accent }} />
                      <div className="px-2 py-1 flex flex-col gap-1">
                        <div style={{ height: "3px", width: "65%", backgroundColor: "#111827", borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "16px", backgroundColor: accent, borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "50%", backgroundColor: "#e2e8f0", borderRadius: "1px", marginTop: "2px" }} />
                        <div style={{ height: "2px", width: "40%", backgroundColor: "#e2e8f0", borderRadius: "1px" }} />
                      </div>
                    </>
                  )}
                  {design.preview === "dark" && (
                    <div style={{ backgroundColor: "#0f172a", height: "100%", padding: "6px 8px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "3px" }}>
                      <div style={{ height: "2px", width: "12px", backgroundColor: accent, borderRadius: "1px" }} />
                      <div style={{ height: "3px", width: "65%", backgroundColor: "#f8fafc", borderRadius: "1px", marginTop: "2px" }} />
                      <div style={{ height: "2px", width: "45%", backgroundColor: "#334155", borderRadius: "1px" }} />
                      <div style={{ height: "2px", width: "55%", backgroundColor: "#1e293b", borderRadius: "1px", marginTop: "4px" }} />
                    </div>
                  )}
                  {design.preview === "split" && (
                    <div style={{ height: "100%", display: "flex" }}>
                      <div style={{ width: "38%", backgroundColor: accent, flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: "5px 6px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px" }}>
                        <div style={{ height: "3px", width: "80%", backgroundColor: "#111827", borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "16px", backgroundColor: accent, borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "60%", backgroundColor: "#e2e8f0", borderRadius: "1px", marginTop: "2px" }} />
                      </div>
                    </div>
                  )}
                  {design.preview === "frame" && (
                    <div style={{ height: "100%", position: "relative" }}>
                      <div style={{ position: "absolute", inset: "4px", border: `1.5px solid ${accent}`, borderRadius: "1px" }} />
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                        <div style={{ height: "3px", width: "60%", backgroundColor: "#111827", borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "40%", backgroundColor: "#94a3b8", borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "30%", backgroundColor: "#94a3b8", borderRadius: "1px" }} />
                      </div>
                    </div>
                  )}
                  {design.preview === "line" && (
                    <div style={{ height: "100%", display: "flex" }}>
                      <div style={{ width: "3px", backgroundColor: accent, flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: "5px 7px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "3px" }}>
                        <div style={{ height: "2px", width: "50%", backgroundColor: "#94a3b8", borderRadius: "1px" }} />
                        <div style={{ height: "3px", width: "80%", backgroundColor: "#111827", borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "16px", backgroundColor: accent, borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "60%", backgroundColor: "#e2e8f0", borderRadius: "1px", marginTop: "2px" }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className={`text-[11px] font-medium ${selected ? "text-primary-300" : "text-gray-300"}`}>{design.name}</div>
                {selected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-950">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </AccordionSection>

      {/* Template Selection */}
      <AccordionSection
        title="Template"
        icon={icons.template}
        isOpen={openSections.template}
        onToggle={() => toggle("template")}
        badge={CONTRACT_TEMPLATES.find((t) => t.id === form.style.template)?.name}
      >
        {TEMPLATE_CATEGORIES.map((cat) => {
          const catTemplates = CONTRACT_TEMPLATES.filter((t) => t.category === cat);
          if (catTemplates.length === 0) return null;
          return (
            <div key={cat} className="mb-3 last:mb-0">
              <SectionLabel>{cat}</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {catTemplates.map((tpl) => {
                  const selected = form.style.template === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => updateStyle({ template: tpl.id, accentColor: tpl.accent, headerStyle: tpl.headerStyle })}
                      className={`relative rounded-xl border p-2.5 text-left transition-all active:scale-[0.97] ${
                        selected
                          ? "border-primary-500/50 bg-primary-500/8 ring-1 ring-primary-500/20"
                          : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60 hover:bg-gray-800/50"
                      }`}
                    >
                      {/* Template mini preview */}
                      <div className="w-full h-16 rounded-lg mb-2 overflow-hidden relative" style={{ backgroundColor: "#fff" }}>
                        {/* Header */}
                        <div style={{ height: tpl.headerStyle === "banner" ? "14px" : "2px", backgroundColor: tpl.accent }} />
                        {/* Title bar */}
                        <div style={{ padding: "3px 6px" }}>
                          <div style={{ height: "3px", width: "60%", backgroundColor: tpl.accent, borderRadius: "1px", marginBottom: "2px" }} />
                          <div style={{ height: "2px", width: "40%", backgroundColor: "#e2e8f0", borderRadius: "1px" }} />
                        </div>
                        {/* Text lines */}
                        <div style={{ padding: "2px 6px" }}>
                          {[80, 70, 60, 50].map((w, i) => (
                            <div key={i} style={{ height: "2px", width: `${w}%`, backgroundColor: "#e2e8f0", borderRadius: "1px", marginBottom: "2px" }} />
                          ))}
                        </div>
                        {/* Accent strip */}
                        {tpl.decorative === "accent-strip" && (
                          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "3px", backgroundColor: tpl.accent }} />
                        )}
                        {/* Border */}
                        {tpl.borderStyle !== "none" && (
                          <div style={{ position: "absolute", inset: "2px", border: `1px solid ${tpl.accent}30`, borderRadius: "2px", pointerEvents: "none" }} />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/10" style={{ backgroundColor: tpl.accent }} />
                        <span className={`text-[11px] font-medium ${selected ? "text-primary-300" : "text-gray-300"}`}>{tpl.name}</span>
                      </div>
                      {selected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-950">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </AccordionSection>

      {/* Accent Color */}
      <AccordionSection
        title="Accent Color"
        icon={icons.color}
        isOpen={openSections.color}
        onToggle={() => toggle("color")}
      >
        <HSVColorPicker
          value={form.style.accentColor}
          onChange={(hex) => updateStyle({ accentColor: hex })}
        />
      </AccordionSection>

      {/* Font Pairing */}
      <AccordionSection
        title="Font Pairing"
        icon={icons.font}
        isOpen={openSections.font}
        onToggle={() => toggle("font")}
      >
        <FormSelect
          value={form.style.fontPairing}
          onChange={(e) => updateStyle({ fontPairing: e.target.value })}
        >
          {FONT_PAIRINGS.map((fp) => (
            <option key={fp.id} value={fp.id}>{fp.label}</option>
          ))}
        </FormSelect>
      </AccordionSection>

      {/* Header Style */}
      <AccordionSection
        title="Header Style"
        icon={icons.header}
        isOpen={openSections.header}
        onToggle={() => toggle("header")}
      >
        <ChipGroup
          options={[
            { value: "banner", label: "Banner" },
            { value: "centered", label: "Centered" },
            { value: "left-aligned", label: "Left" },
            { value: "minimal", label: "Minimal" },
          ]}
          value={form.style.headerStyle}
          onChange={(v) => updateStyle({ headerStyle: v as "banner" | "centered" | "left-aligned" | "minimal" })}
          direction="grid"
          columns={2}
        />
      </AccordionSection>
    </div>
  );
}
