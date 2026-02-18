"use client";

// =============================================================================
// DMSuite — Color Picker Popover
// Compact color picker with hex input, opacity slider, and preset swatches.
// Used by FillStrokeEditor, TextStyleEditor, EffectsEditor, etc.
// =============================================================================

import React, { useState, useCallback, useEffect, useRef } from "react";
import type { RGBA } from "@/lib/editor/schema";
import { rgbaToHex, hexToRGBA } from "@/lib/editor/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColorPickerPopoverProps {
  /** Current color */
  color: RGBA;
  /** Called when color changes */
  onChange: (color: RGBA) => void;
  /** Whether to show opacity slider */
  showOpacity?: boolean;
  /** Label for the trigger button */
  label?: string;
  /** Additional class for the trigger */
  className?: string;
  /** Preset colors to show */
  presets?: string[];
}

// ---------------------------------------------------------------------------
// Default Presets
// ---------------------------------------------------------------------------

const DEFAULT_PRESETS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b",
  "#8ae600", "#1e3a5f", "#d4af37", "#800020", "#2d6a4f", "#6c5ce7",
];

// ---------------------------------------------------------------------------
// HSV Utilities
// ---------------------------------------------------------------------------

function rgbaToHSV(c: RGBA): { h: number; s: number; v: number } {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s, v };
}

function hsvToRGBA(h: number, s: number, v: number, a = 1): RGBA {
  const hi = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (hi) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ColorPickerPopover({
  color,
  onChange,
  showOpacity = true,
  label,
  className = "",
  presets = DEFAULT_PRESETS,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(rgbaToHex(color));
  const popoverRef = useRef<HTMLDivElement>(null);
  const svPadRef = useRef<HTMLDivElement>(null);
  const hueBarRef = useRef<HTMLDivElement>(null);

  const hsv = rgbaToHSV(color);
  const [hue, setHue] = useState(hsv.h);
  const [sat, setSat] = useState(hsv.s);
  const [val, setVal] = useState(hsv.v);

  // Sync from external color changes
  useEffect(() => {
    setHexInput(rgbaToHex(color));
    const newHSV = rgbaToHSV(color);
    // Only update if significantly different (avoid loop)
    if (Math.abs(newHSV.h - hue) > 1 || Math.abs(newHSV.s - sat) > 0.01 || Math.abs(newHSV.v - val) > 0.01) {
      setHue(newHSV.h);
      setSat(newHSV.s);
      setVal(newHSV.v);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color.r, color.g, color.b]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const commitHSV = useCallback((h: number, s: number, v: number) => {
    const newColor = hsvToRGBA(h, s, v, color.a);
    setHue(h);
    setSat(s);
    setVal(v);
    setHexInput(rgbaToHex(newColor));
    onChange(newColor);
  }, [color.a, onChange]);

  // SV pad interaction
  const handleSVPad = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = svPadRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    commitHSV(hue, x, 1 - y);
  }, [hue, commitHSV]);

  const handleSVPadDown = useCallback((e: React.MouseEvent) => {
    handleSVPad(e);
    const onMove = (ev: MouseEvent) => handleSVPad(ev);
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [handleSVPad]);

  // Hue bar interaction
  const handleHueBar = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = hueBarRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    commitHSV(x * 360, sat, val);
  }, [sat, val, commitHSV]);

  const handleHueBarDown = useCallback((e: React.MouseEvent) => {
    handleHueBar(e);
    const onMove = (ev: MouseEvent) => handleHueBar(ev);
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [handleHueBar]);

  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    setHexInput(v);
    if (!v.startsWith("#")) v = "#" + v;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      const newColor = hexToRGBA(v, color.a);
      const newHSV = rgbaToHSV(newColor);
      setHue(newHSV.h);
      setSat(newHSV.s);
      setVal(newHSV.v);
      onChange(newColor);
    }
  }, [color.a, onChange]);

  const handleOpacityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const alpha = parseFloat(e.target.value);
    onChange({ ...color, a: Math.max(0, Math.min(1, alpha)) });
  }, [color, onChange]);

  const handlePresetClick = useCallback((hex: string) => {
    const newColor = hexToRGBA(hex, color.a);
    const newHSV = rgbaToHSV(newColor);
    setHue(newHSV.h);
    setSat(newHSV.s);
    setVal(newHSV.v);
    setHexInput(hex);
    onChange(newColor);
  }, [color.a, onChange]);

  const hueColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Trigger */}
      <button
        type="button"
        className="flex items-center gap-1.5 group"
        onClick={() => setOpen(!open)}
      >
        <span
          className="w-6 h-6 rounded border border-gray-600 shadow-sm flex-shrink-0 transition-shadow group-hover:shadow-md"
          style={{
            backgroundColor: rgbaToHex(color),
            opacity: color.a,
          }}
        />
        {label && <span className="text-xs text-gray-400">{label}</span>}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 space-y-2.5">
          {/* SV Pad */}
          <div
            ref={svPadRef}
            className="relative w-full h-32 rounded cursor-crosshair border border-gray-700 overflow-hidden"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
            }}
            onMouseDown={handleSVPadDown}
          >
            {/* Indicator */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{
                left: `${sat * 100}%`,
                top: `${(1 - val) * 100}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: rgbaToHex(color),
              }}
            />
          </div>

          {/* Hue Bar */}
          <div
            ref={hueBarRef}
            className="relative w-full h-3 rounded-full cursor-pointer"
            style={{
              background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
            }}
            onMouseDown={handleHueBarDown}
          >
            <div
              className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{
                left: `${(hue / 360) * 100}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: hueColor,
              }}
            />
          </div>

          {/* Hex + Opacity Row */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={hexInput}
                onChange={handleHexChange}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 font-mono focus:outline-none focus:border-primary-500"
                maxLength={7}
              />
            </div>
            {showOpacity && (
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={color.a}
                  onChange={handleOpacityChange}
                  className="w-12 h-1 accent-primary-500"
                />
                <span className="text-[10px] text-gray-500 w-7 text-right font-mono">
                  {Math.round(color.a * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* RGBA Values */}
          <div className="flex gap-1">
            {(["r", "g", "b"] as const).map((ch) => (
              <div key={ch} className="flex-1">
                <label className="text-[9px] text-gray-600 uppercase block mb-0.5">{ch}</label>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={color[ch]}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                    const newC = { ...color, [ch]: val };
                    const newHSV = rgbaToHSV(newC);
                    setHue(newHSV.h);
                    setSat(newHSV.s);
                    setVal(newHSV.v);
                    setHexInput(rgbaToHex(newC));
                    onChange(newC);
                  }}
                  className="w-full px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 font-mono text-center focus:outline-none focus:border-primary-500"
                />
              </div>
            ))}
          </div>

          {/* Preset Swatches */}
          <div>
            <p className="text-[9px] text-gray-600 uppercase mb-1">Swatches</p>
            <div className="flex flex-wrap gap-1">
              {presets.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className="w-4.5 h-4.5 rounded-sm border border-gray-700 hover:scale-125 transition-transform"
                  style={{ backgroundColor: hex, width: 18, height: 18 }}
                  onClick={() => handlePresetClick(hex)}
                  title={hex}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Color Swatch (no picker, just shows the color)
// ---------------------------------------------------------------------------

export function ColorSwatch({ color, size = 16 }: { color: RGBA; size?: number }) {
  return (
    <span
      className="inline-block rounded-sm border border-gray-700"
      style={{
        backgroundColor: rgbaToHex(color),
        opacity: color.a,
        width: size,
        height: size,
      }}
    />
  );
}
