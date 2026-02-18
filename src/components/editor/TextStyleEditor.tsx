"use client";

// =============================================================================
// DMSuite — Text Style Editor
// Comprehensive text styling panel: font family, size, weight, spacing,
// alignment, case, and per-run style overrides.
// =============================================================================

import React, { useCallback } from "react";
import type { TextLayerV2, TextStyle, ParagraphStyle, RGBA, Paint } from "@/lib/editor/schema";
import { solidPaint, hexToRGBA, rgbaToHex } from "@/lib/editor/schema";
import ColorPickerPopover from "./ColorPickerPopover";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TextStyleEditorProps {
  layer: TextLayerV2;
  onChange: (changes: Partial<TextLayerV2>) => void;
}

// ---------------------------------------------------------------------------
// Font Data
// ---------------------------------------------------------------------------

const FONT_FAMILIES = [
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Helvetica Neue', Helvetica, Arial, sans-serif", label: "Helvetica Neue" },
  { value: "'SF Pro Display', 'Segoe UI', sans-serif", label: "SF Pro" },
  { value: "'Georgia', 'Garamond', serif", label: "Georgia" },
  { value: "'Playfair Display', 'Didot', serif", label: "Playfair Display" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { value: "'Arial Black', 'Impact', sans-serif", label: "Arial Black" },
  { value: "'JetBrains Mono', 'Fira Code', monospace", label: "JetBrains Mono" },
  { value: "'Courier New', Courier, monospace", label: "Courier New" },
  { value: "'Bodoni MT', Didot, serif", label: "Bodoni" },
  { value: "'Futura', 'Century Gothic', sans-serif", label: "Futura" },
];

const FONT_WEIGHTS = [
  { value: 100, label: "Thin" },
  { value: 200, label: "Extra Light" },
  { value: 300, label: "Light" },
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semi Bold" },
  { value: 700, label: "Bold" },
  { value: 800, label: "Extra Bold" },
  { value: 900, label: "Black" },
];

const ALIGN_OPTIONS = [
  { value: "left", icon: "≡", label: "Left" },
  { value: "center", icon: "☰", label: "Center" },
  { value: "right", icon: "≡", label: "Right" },
  { value: "justify", icon: "☰", label: "Justify" },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TextStyleEditor({ layer, onChange }: TextStyleEditorProps) {
  const style = layer.defaultStyle;
  const para = layer.paragraphs[0] ?? { align: "left", indent: 0, spaceBefore: 0, spaceAfter: 0 };

  const updateStyle = useCallback((changes: Partial<TextStyle>) => {
    onChange({ defaultStyle: { ...style, ...changes } });
  }, [style, onChange]);

  const updateParagraph = useCallback((changes: Partial<ParagraphStyle>) => {
    const updated = { ...para, ...changes };
    onChange({ paragraphs: [updated] });
  }, [para, onChange]);

  const fillColor: RGBA = style.fill.kind === "solid"
    ? style.fill.color
    : { r: 0, g: 0, b: 0, a: 1 };

  return (
    <div className="space-y-3">
      {/* Text Content */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Content</label>
        <textarea
          value={layer.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={3}
          className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 resize-none focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Font Family */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Font Family</label>
        <select
          value={style.fontFamily}
          onChange={(e) => updateStyle({ fontFamily: e.target.value })}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-primary-500"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
          {/* Show current if not in list */}
          {!FONT_FAMILIES.some(f => f.value === style.fontFamily) && (
            <option value={style.fontFamily}>{style.fontFamily}</option>
          )}
        </select>
      </div>

      {/* Font Size + Weight Row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Size</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={999}
              step={1}
              value={style.fontSize}
              onChange={(e) => updateStyle({ fontSize: Math.max(1, parseInt(e.target.value) || 12) })}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 font-mono focus:outline-none focus:border-primary-500"
            />
            <span className="text-[9px] text-gray-500">px</span>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Weight</label>
          <select
            value={style.fontWeight}
            onChange={(e) => updateStyle({ fontWeight: parseInt(e.target.value) })}
            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-primary-500"
          >
            {FONT_WEIGHTS.map((w) => (
              <option key={w.value} value={w.value}>{w.label} ({w.value})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Text Color */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Color</label>
        <div className="flex items-center gap-2">
          <ColorPickerPopover
            color={fillColor}
            onChange={(color) => updateStyle({ fill: solidPaint(color) })}
          />
          <span className="text-xs text-gray-400 font-mono">{rgbaToHex(fillColor)}</span>
        </div>
      </div>

      {/* Style Toggles */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Style</label>
        <div className="flex items-center gap-1">
          <ToggleBtn
            active={style.italic}
            onClick={() => updateStyle({ italic: !style.italic })}
            title="Italic"
          >
            <em>I</em>
          </ToggleBtn>
          <ToggleBtn
            active={style.underline}
            onClick={() => updateStyle({ underline: !style.underline })}
            title="Underline"
          >
            <u>U</u>
          </ToggleBtn>
          <ToggleBtn
            active={style.strikethrough}
            onClick={() => updateStyle({ strikethrough: !style.strikethrough })}
            title="Strikethrough"
          >
            <s>S</s>
          </ToggleBtn>
          <ToggleBtn
            active={style.uppercase}
            onClick={() => updateStyle({ uppercase: !style.uppercase })}
            title="Uppercase"
          >
            AA
          </ToggleBtn>
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Alignment</label>
        <div className="flex items-center gap-1">
          {ALIGN_OPTIONS.map((opt) => (
            <ToggleBtn
              key={opt.value}
              active={para.align === opt.value}
              onClick={() => updateParagraph({ align: opt.value })}
              title={opt.label}
            >
              {opt.value === "left" && "☰"}
              {opt.value === "center" && "☰"}
              {opt.value === "right" && "☰"}
              {opt.value === "justify" && "☰"}
            </ToggleBtn>
          ))}
        </div>
      </div>

      {/* Vertical Align */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Vertical Align</label>
        <div className="flex items-center gap-1">
          {(["top", "middle", "bottom"] as const).map((va) => (
            <ToggleBtn
              key={va}
              active={layer.verticalAlign === va}
              onClick={() => onChange({ verticalAlign: va })}
              title={va}
            >
              {va.charAt(0).toUpperCase() + va.slice(1)}
            </ToggleBtn>
          ))}
        </div>
      </div>

      {/* Spacing */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Spacing</label>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-500 w-16">Letter</span>
          <input
            type="range"
            min={-5}
            max={20}
            step={0.1}
            value={style.letterSpacing}
            onChange={(e) => updateStyle({ letterSpacing: parseFloat(e.target.value) })}
            className="flex-1 h-1 accent-primary-500"
          />
          <span className="text-[9px] text-gray-500 w-8 text-right font-mono">
            {style.letterSpacing.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-500 w-16">Line Height</span>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={style.lineHeight}
            onChange={(e) => updateStyle({ lineHeight: parseFloat(e.target.value) })}
            className="flex-1 h-1 accent-primary-500"
          />
          <span className="text-[9px] text-gray-500 w-8 text-right font-mono">
            {style.lineHeight.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Overflow */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Overflow</label>
        <select
          value={layer.overflow}
          onChange={(e) => onChange({ overflow: e.target.value as TextLayerV2["overflow"] })}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-primary-500"
        >
          <option value="clip">Clip</option>
          <option value="ellipsis">Ellipsis</option>
          <option value="expand">Expand</option>
        </select>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle Button (reusable)
// ---------------------------------------------------------------------------

function ToggleBtn({ active, onClick, title, children }: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        px-2 py-1 rounded text-xs font-medium transition-all
        ${active
          ? "bg-primary-500/20 text-primary-400 border border-primary-500/40"
          : "bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200 hover:border-gray-600"
        }
      `}
    >
      {children}
    </button>
  );
}
