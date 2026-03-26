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
        badge={COVER_DESIGNS.find((d) => d.id === (form.style.coverDesign ?? "none"))?.name}
      >
        <div className="grid grid-cols-2 gap-2">
          {COVER_DESIGNS.map((design) => {
            const selected = (form.style.coverDesign ?? "none") === design.id;
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
                  {design.id === "none" && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="flex flex-col gap-1.5 items-center">
                        {[70, 55, 40].map((w, i) => (
                          <div key={i} style={{ height: "2px", width: `${w}%`, backgroundColor: "#e2e8f0", borderRadius: "1px" }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Classic: White, black text, formal BETWEEN/AND, date bottom */}
                  {design.id === "classic" && (
                    <div style={{ height: "100%", padding: "5px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                      <div style={{ height: "3px", width: "55%", backgroundColor: "#000000", borderRadius: "1px" }} />
                      <div style={{ fontSize: "4px", color: "#000000", fontWeight: 700, lineHeight: 1, marginTop: "2px" }}>BETWEEN</div>
                      <div style={{ width: "40%", height: "1px", borderBottom: "1px solid #000000" }} />
                      <div style={{ fontSize: "4px", color: "#000000", fontWeight: 700, lineHeight: 1 }}>AND</div>
                      <div style={{ width: "40%", height: "1px", borderBottom: "1px solid #000000" }} />
                      <div style={{ flex: 1 }} />
                      <div style={{ height: "2px", width: "45%", backgroundColor: "#000000", borderRadius: "1px", alignSelf: "flex-start" }} />
                    </div>
                  )}
                  {/* Corporate: Charcoal bg, accent logo center, white title */}
                  {design.id === "corporate" && (
                    <div style={{ height: "100%", backgroundColor: "#2d2d2d", position: "relative" }}>
                      <div style={{ position: "absolute", top: "4px", left: "50%", transform: "translateX(-50%)", width: "10px", height: "10px", backgroundColor: accent, borderRadius: "1px" }} />
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -40%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5px" }}>
                        <div style={{ height: "3px", width: "36px", backgroundColor: "#ffffff", borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "28px", backgroundColor: "#cccccc", borderRadius: "1px" }} />
                      </div>
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "5px", backgroundColor: accent }} />
                    </div>
                  )}
                  {/* Dark Executive: Navy bg, accent logo box top-left, accent title, 3 stripes right */}
                  {design.id === "dark-executive" && (
                    <div style={{ backgroundColor: "#1b2a4a", height: "100%", position: "relative", padding: "5px 8px" }}>
                      <div style={{ width: "8px", height: "8px", border: `0.5px solid ${accent}`, marginBottom: "8px" }} />
                      <div style={{ position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)" }}>
                        <div style={{ height: "3px", width: "50px", backgroundColor: accent, borderRadius: "1px", marginBottom: "3px" }} />
                        <div style={{ height: "2px", width: "38px", backgroundColor: accent, borderRadius: "1px", opacity: 0.7 }} />
                        <div style={{ display: "flex", marginTop: "3px", gap: "0" }}>
                          <div style={{ height: "1.5px", width: "8px", backgroundColor: accent }} />
                          <div style={{ height: "0.5px", width: "20px", backgroundColor: "#ffffff25", marginTop: "0.5px" }} />
                        </div>
                      </div>
                      <div style={{ position: "absolute", bottom: "5px", left: "8px", display: "flex", flexDirection: "column", gap: "1px" }}>
                        <div style={{ height: "1.5px", width: "20px", backgroundColor: "#94a3b8", borderRadius: "1px" }} />
                        <div style={{ height: "1.5px", width: "16px", backgroundColor: "#94a3b8", borderRadius: "1px" }} />
                      </div>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ position: "absolute", top: "4px", bottom: "4px", right: `${4 + i * 3}px`, width: "1px", backgroundColor: accent }} />
                      ))}
                    </div>
                  )}
                  {/* Accent Split: White left ~32%, navy right ~68%, highlight bar */}
                  {design.id === "accent-split" && (
                    <div style={{ height: "100%", display: "flex", position: "relative" }}>
                      <div style={{ width: "32%", backgroundColor: "#ffffff", flexShrink: 0 }} />
                      <div style={{ flex: 1, backgroundColor: "#1b2a4a" }}>
                        <div style={{ width: "6px", height: "6px", backgroundColor: "#111827", margin: "4px 0 0 4px" }} />
                      </div>
                      <div style={{ position: "absolute", top: "50%", left: "6px", transform: "translateY(-50%)" }}>
                        <div style={{ height: "2.5px", width: "30px", backgroundColor: "#ffffff", borderRadius: "1px", marginBottom: "2px" }} />
                        <div style={{ display: "inline-block", backgroundColor: accent, padding: "1.5px 4px" }}>
                          <div style={{ height: "2px", width: "22px", backgroundColor: "#ffffff", borderRadius: "1px" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Bold Frame: White bg, thick accent border, accent logo top-right, accent title */}
                  {design.id === "bold-frame" && (
                    <div style={{ height: "100%", position: "relative" }}>
                      <div style={{ position: "absolute", inset: "3px", border: `2px solid ${accent}` }} />
                      <div style={{ position: "absolute", top: "6px", right: "6px", width: "7px", height: "7px", backgroundColor: accent }} />
                      <div style={{ position: "absolute", top: "50%", left: "10px", transform: "translateY(-40%)", display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ height: "3px", width: "40px", backgroundColor: accent, borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "32px", backgroundColor: accent, borderRadius: "1px", opacity: 0.7 }} />
                      </div>
                      <div style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
                        <div style={{ height: "1.5px", width: "20px", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
                      </div>
                    </div>
                  )}
                  {/* Minimal Line: Left dual-tone strip, dark logo top-right, bold dark title, accent rules bottom */}
                  {design.id === "minimal-line" && (
                    <div style={{ height: "100%", position: "relative" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, bottom: "30%", width: "3px", backgroundColor: accent, opacity: 0.75 }} />
                      <div style={{ position: "absolute", top: "70%", left: 0, bottom: 0, width: "3px", backgroundColor: "#1e2d4f" }} />
                      <div style={{ position: "absolute", top: "4px", right: "5px", width: "7px", height: "7px", backgroundColor: "#1e2d4f" }} />
                      <div style={{ position: "absolute", top: "15px", left: "8px", right: "30px", height: "0.5px", backgroundColor: "#333" }} />
                      <div style={{ position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)" }}>
                        <div style={{ height: "3px", width: "50px", backgroundColor: "#1e2d4f", borderRadius: "1px", marginBottom: "2px" }} />
                        <div style={{ height: "2.5px", width: "40px", backgroundColor: "#1e2d4f", borderRadius: "1px" }} />
                      </div>
                      <div style={{ position: "absolute", bottom: "5px", left: "8px", display: "flex", alignItems: "center", gap: "2px" }}>
                        <div style={{ height: "1.5px", width: "18px", backgroundColor: "#6b7280", borderRadius: "1px" }} />
                        <div style={{ height: "1px", width: "10px", backgroundColor: accent }} />
                      </div>
                    </div>
                  )}
                  {/* Modern Centered: White bg, black logo box top, centered lines, accent bar bottom-right */}
                  {design.id === "modern-centered" && (
                    <div style={{ height: "100%", position: "relative", padding: "5px 8px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: "10px", height: "10px", backgroundColor: "#000000", borderRadius: "1px", marginBottom: "4px" }} />
                      <div style={{ height: "3px", width: "50px", backgroundColor: "#1a1a1a", borderRadius: "1px", marginBottom: "2px" }} />
                      <div style={{ height: "2px", width: "36px", backgroundColor: "#888", borderRadius: "1px" }} />
                      <div style={{ flex: 1 }} />
                      <div style={{ position: "absolute", bottom: "3px", right: "6px", width: "18px", height: "3px", backgroundColor: accent, borderRadius: "1px" }} />
                    </div>
                  )}
                  {/* Procurement Circle: Dark navy bg, circle top-left, white+accent title lines, stripes right */}
                  {design.id === "procurement-circle" && (
                    <div style={{ backgroundColor: "#0f1b3d", height: "100%", position: "relative", padding: "5px 8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", border: `1px solid ${accent}`, marginBottom: "6px" }} />
                      <div style={{ position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)" }}>
                        <div style={{ height: "3px", width: "36px", backgroundColor: "#ffffff", borderRadius: "1px", marginBottom: "2px" }} />
                        <div style={{ height: "2px", width: "28px", backgroundColor: accent, borderRadius: "1px" }} />
                      </div>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ position: "absolute", top: "4px", bottom: "4px", right: `${4 + i * 3}px`, width: "1px", backgroundColor: accent, opacity: 0.5 }} />
                      ))}
                    </div>
                  )}
                  {/* Geometric Modern: Angular navy shape, circle logo top-right */}
                  {design.id === "geometric-modern" && (
                    <div style={{ height: "100%", position: "relative", backgroundColor: "#f0f0f0" }}>
                      <svg viewBox="0 0 80 64" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="none">
                        <polygon points="0,16 50,0 50,64 0,64" fill="#1b2a4a" />
                      </svg>
                      <div style={{ position: "absolute", top: "4px", right: "6px", width: "10px", height: "10px", borderRadius: "50%", border: "1px solid #1b2a4a" }} />
                      <div style={{ position: "absolute", bottom: "6px", left: "6px", display: "flex", flexDirection: "column", gap: "1.5px" }}>
                        <div style={{ height: "2.5px", width: "28px", backgroundColor: "#ffffff", borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "20px", backgroundColor: accent, borderRadius: "1px" }} />
                      </div>
                    </div>
                  )}
                  {/* Bordered Formal: Cream bg, thin accent border, centered logo+lines */}
                  {design.id === "bordered-formal" && (
                    <div style={{ height: "100%", backgroundColor: "#faf8f4", position: "relative" }}>
                      <div style={{ position: "absolute", inset: "3px", border: `1px solid ${accent}`, opacity: 0.6 }} />
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                        <div style={{ width: "8px", height: "8px", border: "0.5px solid #333", borderRadius: "1px" }} />
                        <div style={{ height: "2.5px", width: "32px", backgroundColor: "#333", borderRadius: "1px" }} />
                        <div style={{ height: "2px", width: "24px", backgroundColor: "#999", borderRadius: "1px" }} />
                      </div>
                      <div style={{ position: "absolute", bottom: "4px", left: "50%", transform: "translateX(-50%)", width: "20px", height: "0.5px", backgroundColor: accent }} />
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
