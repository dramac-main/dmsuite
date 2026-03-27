// =============================================================================
// Cover Letter Style Tab — Template, accent color, font, header style, display
// =============================================================================

"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  useCoverLetterEditor,
  COVER_LETTER_TEMPLATES,
  FONT_PAIRINGS,
  HEADER_STYLES,
  ACCENT_COLORS,
} from "@/stores/cover-letter-editor";
import type { StyleConfig } from "@/stores/cover-letter-editor";
import {
  AccordionSection,
  FormSelect,
  Toggle,
  FormInput,
  ChipGroup,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

const icons = {
  template: <SIcon d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />,
  color: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="13.5" cy="17.5" r="2.5" />
    </svg>
  ),
  font: <SIcon d="M4 7V4h16v3M9 20h6M12 4v16" />,
  header: <SIcon d="M4 5h16M4 9h10M4 13h16M4 17h6" />,
  display: <SIcon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
};

// ── HSV Color Picker ──

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
      <div className="flex flex-wrap gap-1.5">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => { onChange(c); setLocalHex(c); }}
            className={`w-7 h-7 rounded-lg transition-all ${
              value.toLowerCase() === c.toLowerCase()
                ? "ring-2 ring-primary-400 ring-offset-2 ring-offset-gray-900 scale-110"
                : "hover:scale-105"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Template Mini Preview ──

function TemplateMiniPreview({ tpl, selected, onClick }: {
  tpl: (typeof COVER_LETTER_TEMPLATES)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-xl border transition-all text-left ${
        selected
          ? "border-primary-500/50 bg-primary-500/8 ring-1 ring-primary-500/20"
          : "border-gray-700/50 bg-gray-800/30 hover:border-gray-600/60 hover:bg-gray-800/50"
      }`}
    >
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
          <SIcon d="M5 13l4 4L19 7" />
        </div>
      )}
      <div className="w-full h-20 rounded-lg overflow-hidden bg-white mb-2">
        <div style={{ backgroundColor: tpl.accent, height: 6 }} />
        <div className="p-2">
          <div className="w-2/3 h-1.5 rounded-full mb-1" style={{ backgroundColor: tpl.accent, opacity: 0.7 }} />
          <div className="w-full h-1 rounded-full bg-gray-200 mb-0.5" />
          <div className="w-4/5 h-1 rounded-full bg-gray-200 mb-0.5" />
          <div className="w-3/5 h-1 rounded-full bg-gray-200 mb-1.5" />
          <div className="w-full h-1 rounded-full bg-gray-200 mb-0.5" />
          <div className="w-4/5 h-1 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="text-xs font-semibold text-gray-200">{tpl.label}</div>
    </button>
  );
}

// ── Main Tab ──

export default function CoverLetterStyleTab() {
  const store = useCoverLetterEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({
    template: true,
    color: true,
    font: false,
    header: false,
    display: false,
  });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const fontOptions = FONT_PAIRINGS.map((fp) => ({
    value: fp.id,
    label: `${fp.heading} + ${fp.body}`,
  }));

  const headerStyleOptions = HEADER_STYLES.map((hs) => ({
    value: hs.id,
    label: hs.label,
  }));

  return (
    <div className="space-y-2">
      {/* Template */}
      <AccordionSection
        title="Template"
        icon={icons.template}
        badge={COVER_LETTER_TEMPLATES.find((t) => t.id === store.form.style.template)?.label}
        isOpen={open.template}
        onToggle={() => toggle("template")}
      >
        <div className="grid grid-cols-2 gap-2">
          {COVER_LETTER_TEMPLATES.map((tpl) => (
            <TemplateMiniPreview
              key={tpl.id}
              tpl={tpl}
              selected={store.form.style.template === tpl.id}
              onClick={() => store.setTemplate(tpl.id)}
            />
          ))}
        </div>
      </AccordionSection>

      {/* Accent Color */}
      <AccordionSection
        title="Accent Color"
        icon={icons.color}
        isOpen={open.color}
        onToggle={() => toggle("color")}
      >
        <HSVColorPicker
          value={store.form.style.accentColor}
          onChange={(hex) => store.setAccentColor(hex)}
        />
      </AccordionSection>

      {/* Font Pairing */}
      <AccordionSection
        title="Font Pairing"
        icon={icons.font}
        isOpen={open.font}
        onToggle={() => toggle("font")}
      >
        <FormSelect
          label="Font Combination"
          value={store.form.style.fontPairing}
          onChange={(e) => store.updateStyle({ fontPairing: e.target.value as StyleConfig["fontPairing"] })}
        >
          {fontOptions.map((fo) => (
            <option key={fo.value} value={fo.value}>{fo.label}</option>
          ))}
        </FormSelect>
        {(() => {
          const fp = FONT_PAIRINGS.find((f) => f.id === store.form.style.fontPairing) ?? FONT_PAIRINGS[0];
          return (
            <div className="mt-3 p-3 rounded-xl border border-gray-700/50 bg-gray-800/30">
              <div className="text-sm font-bold text-gray-200 mb-1" style={{ fontFamily: `'${fp.heading}', serif` }}>
                {fp.heading} — Heading
              </div>
              <div className="text-xs text-gray-400" style={{ fontFamily: `'${fp.body}', sans-serif` }}>
                {fp.body} — Body text appears in this font for readability and professionalism.
              </div>
            </div>
          );
        })()}
      </AccordionSection>

      {/* Header Style */}
      <AccordionSection
        title="Header Style"
        icon={icons.header}
        badge={store.form.style.headerStyle}
        isOpen={open.header}
        onToggle={() => toggle("header")}
      >
        <ChipGroup
          options={headerStyleOptions}
          value={store.form.style.headerStyle}
          onChange={(v) => store.updateStyle({ headerStyle: v as StyleConfig["headerStyle"] })}
          direction="grid"
          columns={3}
        />
      </AccordionSection>

      {/* Display Options */}
      <AccordionSection
        title="Display Options"
        icon={icons.display}
        isOpen={open.display}
        onToggle={() => toggle("display")}
      >
        <div className="space-y-2">
          <Toggle
            label="Recipient Address"
            description="Show recipient block on letter"
            checked={store.form.style.showRecipientAddress}
            onChange={(v) => store.updateStyle({ showRecipientAddress: v })}
          />
          <Toggle
            label="Date"
            description="Show date line"
            checked={store.form.style.showDate}
            onChange={(v) => store.updateStyle({ showDate: v })}
          />
          <Toggle
            label="Subject Line"
            description="Show Re: subject line"
            checked={store.form.style.showSubjectLine}
            onChange={(v) => store.updateStyle({ showSubjectLine: v })}
          />
          {store.form.style.showSubjectLine && (
            <FormInput
              label="Subject Text"
              value={store.form.style.subjectLine}
              onChange={(e) => store.updateStyle({ subjectLine: e.target.value })}
              placeholder="Application for Senior Product Manager"
            />
          )}
          <Toggle
            label="Page Border"
            description="Subtle border around each page"
            checked={store.form.style.showPageBorder}
            onChange={(v) => store.updateStyle({ showPageBorder: v })}
          />
          <Toggle
            label="Letterhead Bar"
            description="Accent color bar at top of header"
            checked={store.form.style.showLetterheadBar}
            onChange={(v) => store.updateStyle({ showLetterheadBar: v })}
          />
        </div>
      </AccordionSection>
    </div>
  );
}
