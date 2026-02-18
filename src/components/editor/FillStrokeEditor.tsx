"use client";

// =============================================================================
// DMSuite — Fill & Stroke Editor
// Multi-fill and multi-stroke editor panel. Supports solid, gradient, and
// pattern paint types. Each fill/stroke can be added, removed, and reordered.
// =============================================================================

import React, { useCallback } from "react";
import type {
  Paint, SolidPaint, GradientPaint, PatternPaint, ImagePaint,
  StrokeSpec, RGBA, GradientStop, Matrix2D,
} from "@/lib/editor/schema";
import { solidPaint, hexToRGBA, rgbaToHex } from "@/lib/editor/schema";
import ColorPickerPopover from "./ColorPickerPopover";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FillEditorProps {
  fills: Paint[];
  onChange: (fills: Paint[]) => void;
  label?: string;
}

export interface StrokeEditorProps {
  strokes: StrokeSpec[];
  onChange: (strokes: StrokeSpec[]) => void;
  label?: string;
}

// ---------------------------------------------------------------------------
// Paint Helpers
// ---------------------------------------------------------------------------

function getPaintDisplayColor(paint: Paint): RGBA {
  switch (paint.kind) {
    case "solid": return paint.color;
    case "gradient": return paint.stops[0]?.color ?? { r: 0, g: 0, b: 0, a: 1 };
    case "pattern": return paint.color;
    case "image": return { r: 128, g: 128, b: 128, a: 1 };
    default: return { r: 0, g: 0, b: 0, a: 1 };
  }
}

function getDefaultPaint(): SolidPaint {
  return solidPaint({ r: 128, g: 128, b: 128, a: 1 });
}

function getDefaultGradient(): GradientPaint {
  return {
    kind: "gradient",
    gradientType: "linear",
    stops: [
      { offset: 0, color: { r: 0, g: 0, b: 0, a: 1 } },
      { offset: 1, color: { r: 255, g: 255, b: 255, a: 1 } },
    ],
    transform: [1, 0, 0, 1, 0, 0] as Matrix2D,
    spread: "pad",
  };
}

function getDefaultPattern(): PatternPaint {
  return {
    kind: "pattern",
    patternType: "dots",
    color: { r: 100, g: 100, b: 100, a: 0.3 },
    scale: 1,
    rotation: 0,
    opacity: 0.3,
    spacing: 20,
  };
}

function getDefaultStroke(): StrokeSpec {
  return {
    paint: solidPaint({ r: 0, g: 0, b: 0, a: 1 }),
    width: 1,
    align: "center",
    dash: [],
    cap: "butt",
    join: "miter",
    miterLimit: 10,
  };
}

const PAINT_TYPES = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  { value: "pattern", label: "Pattern" },
] as const;

const GRADIENT_TYPES = ["linear", "radial", "angular", "diamond"] as const;

const PATTERN_TYPES = [
  "dots", "lines", "diagonal-lines", "crosshatch", "waves",
  "triangles", "hexagons", "circles", "chevrons", "diamond", "noise", "grid",
] as const;

const STROKE_ALIGN = ["center", "inside", "outside"] as const;
const STROKE_CAP = ["butt", "round", "square"] as const;
const STROKE_JOIN = ["miter", "round", "bevel"] as const;

// ---------------------------------------------------------------------------
// Paint Row (single fill item)
// ---------------------------------------------------------------------------

function PaintRow({ paint, onChange, onRemove }: {
  paint: Paint;
  onChange: (p: Paint) => void;
  onRemove: () => void;
}) {
  const changePaintType = useCallback((kind: string) => {
    switch (kind) {
      case "solid":
        onChange(solidPaint(getPaintDisplayColor(paint)));
        break;
      case "gradient":
        onChange(getDefaultGradient());
        break;
      case "pattern":
        onChange(getDefaultPattern());
        break;
    }
  }, [paint, onChange]);

  return (
    <div className="space-y-1.5 bg-gray-800/50 rounded p-2 border border-gray-700/50">
      <div className="flex items-center gap-1.5">
        {/* Paint type selector */}
        <select
          value={paint.kind}
          onChange={(e) => changePaintType(e.target.value)}
          className="flex-1 px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 focus:outline-none focus:border-primary-500"
        >
          {PAINT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Color preview + picker */}
        <ColorPickerPopover
          color={getPaintDisplayColor(paint)}
          onChange={(color) => {
            if (paint.kind === "solid") {
              onChange({ kind: "solid", color });
            } else if (paint.kind === "gradient") {
              // Update first stop
              const stops = [...paint.stops];
              if (stops.length > 0) {
                stops[0] = { ...stops[0], color };
              }
              onChange({ ...paint, stops });
            } else if (paint.kind === "pattern") {
              onChange({ ...paint, color });
            }
          }}
        />

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-500 hover:text-red-400 text-xs transition-colors"
          title="Remove fill"
        >
          ✕
        </button>
      </div>

      {/* Gradient-specific controls */}
      {paint.kind === "gradient" && (
        <GradientControls gradient={paint} onChange={(g) => onChange(g)} />
      )}

      {/* Pattern-specific controls */}
      {paint.kind === "pattern" && (
        <PatternControls pattern={paint} onChange={(p) => onChange(p)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gradient Controls
// ---------------------------------------------------------------------------

function GradientControls({ gradient, onChange }: {
  gradient: GradientPaint;
  onChange: (g: GradientPaint) => void;
}) {
  const updateStop = useCallback((idx: number, changes: Partial<GradientStop>) => {
    const stops = [...gradient.stops];
    stops[idx] = { ...stops[idx], ...changes };
    onChange({ ...gradient, stops });
  }, [gradient, onChange]);

  const addStop = useCallback(() => {
    const midColor: RGBA = gradient.stops.length >= 2
      ? {
          r: Math.round((gradient.stops[0].color.r + gradient.stops[gradient.stops.length - 1].color.r) / 2),
          g: Math.round((gradient.stops[0].color.g + gradient.stops[gradient.stops.length - 1].color.g) / 2),
          b: Math.round((gradient.stops[0].color.b + gradient.stops[gradient.stops.length - 1].color.b) / 2),
          a: 1,
        }
      : { r: 128, g: 128, b: 128, a: 1 };
    onChange({ ...gradient, stops: [...gradient.stops, { offset: 0.5, color: midColor }] });
  }, [gradient, onChange]);

  const removeStop = useCallback((idx: number) => {
    if (gradient.stops.length <= 2) return;
    const stops = gradient.stops.filter((_, i) => i !== idx);
    onChange({ ...gradient, stops });
  }, [gradient, onChange]);

  // Compute angle from transform matrix
  const angle = Math.round(Math.atan2(gradient.transform[1], gradient.transform[0]) * (180 / Math.PI));

  return (
    <div className="space-y-1.5 pl-1">
      {/* Type + Angle */}
      <div className="flex items-center gap-1.5">
        <select
          value={gradient.gradientType}
          onChange={(e) => onChange({ ...gradient, gradientType: e.target.value as GradientPaint["gradientType"] })}
          className="flex-1 px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 focus:outline-none focus:border-primary-500"
        >
          {GRADIENT_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        {gradient.gradientType === "linear" && (
          <div className="flex items-center gap-0.5">
            <span className="text-[9px] text-gray-500">∠</span>
            <input
              type="number"
              value={angle}
              onChange={(e) => {
                const rad = (parseInt(e.target.value) || 0) * Math.PI / 180;
                const transform: Matrix2D = [Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0];
                onChange({ ...gradient, transform });
              }}
              className="w-10 px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 font-mono text-center focus:outline-none focus:border-primary-500"
            />
            <span className="text-[9px] text-gray-500">°</span>
          </div>
        )}
      </div>

      {/* Stops */}
      <div className="space-y-1">
        {gradient.stops.map((stop, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <ColorPickerPopover
              color={stop.color}
              onChange={(color) => updateStop(idx, { color })}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={stop.offset}
              onChange={(e) => updateStop(idx, { offset: parseFloat(e.target.value) })}
              className="flex-1 h-1 accent-primary-500"
            />
            <span className="text-[9px] text-gray-500 w-6 text-right font-mono">
              {Math.round(stop.offset * 100)}%
            </span>
            {gradient.stops.length > 2 && (
              <button
                type="button"
                onClick={() => removeStop(idx)}
                className="text-gray-600 hover:text-red-400 text-[10px] transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addStop}
        className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
      >
        + Add stop
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pattern Controls
// ---------------------------------------------------------------------------

function PatternControls({ pattern, onChange }: {
  pattern: PatternPaint;
  onChange: (p: PatternPaint) => void;
}) {
  return (
    <div className="space-y-1 pl-1">
      <div className="flex items-center gap-1.5">
        <select
          value={pattern.patternType}
          onChange={(e) => onChange({ ...pattern, patternType: e.target.value as PatternPaint["patternType"] })}
          className="flex-1 px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 focus:outline-none focus:border-primary-500"
        >
          {PATTERN_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/-/g, " ")}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[9px] text-gray-500 w-10">Opacity</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={pattern.opacity}
          onChange={(e) => onChange({ ...pattern, opacity: parseFloat(e.target.value) })}
          className="flex-1 h-1 accent-primary-500"
        />
        <span className="text-[9px] text-gray-500 w-6 text-right font-mono">
          {Math.round(pattern.opacity * 100)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[9px] text-gray-500 w-10">Scale</label>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={pattern.scale}
          onChange={(e) => onChange({ ...pattern, scale: parseFloat(e.target.value) })}
          className="flex-1 h-1 accent-primary-500"
        />
        <span className="text-[9px] text-gray-500 w-6 text-right font-mono">
          {pattern.scale.toFixed(1)}×
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[9px] text-gray-500 w-10">Spacing</label>
        <input
          type="number"
          min={4}
          max={100}
          value={pattern.spacing}
          onChange={(e) => onChange({ ...pattern, spacing: parseInt(e.target.value) || 20 })}
          className="w-12 px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 font-mono text-center focus:outline-none focus:border-primary-500"
        />
        <span className="text-[9px] text-gray-500">px</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fill Editor (exported)
// ---------------------------------------------------------------------------

export function FillEditor({ fills, onChange, label = "Fills" }: FillEditorProps) {
  const updateFill = useCallback((idx: number, paint: Paint) => {
    const newFills = [...fills];
    newFills[idx] = paint;
    onChange(newFills);
  }, [fills, onChange]);

  const removeFill = useCallback((idx: number) => {
    onChange(fills.filter((_, i) => i !== idx));
  }, [fills, onChange]);

  const addFill = useCallback(() => {
    onChange([...fills, getDefaultPaint()]);
  }, [fills, onChange]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</h4>
        <button
          type="button"
          onClick={addFill}
          className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
        >
          + Add
        </button>
      </div>
      {fills.length === 0 && (
        <p className="text-[10px] text-gray-600 italic">No fills</p>
      )}
      {fills.map((fill, idx) => (
        <PaintRow
          key={idx}
          paint={fill}
          onChange={(p) => updateFill(idx, p)}
          onRemove={() => removeFill(idx)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stroke Editor (exported)
// ---------------------------------------------------------------------------

export function StrokeEditor({ strokes, onChange, label = "Strokes" }: StrokeEditorProps) {
  const updateStroke = useCallback((idx: number, changes: Partial<StrokeSpec>) => {
    const newStrokes = [...strokes];
    newStrokes[idx] = { ...newStrokes[idx], ...changes };
    onChange(newStrokes);
  }, [strokes, onChange]);

  const removeStroke = useCallback((idx: number) => {
    onChange(strokes.filter((_, i) => i !== idx));
  }, [strokes, onChange]);

  const addStroke = useCallback(() => {
    onChange([...strokes, getDefaultStroke()]);
  }, [strokes, onChange]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</h4>
        <button
          type="button"
          onClick={addStroke}
          className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
        >
          + Add
        </button>
      </div>
      {strokes.length === 0 && (
        <p className="text-[10px] text-gray-600 italic">No strokes</p>
      )}
      {strokes.map((s, idx) => (
        <div key={idx} className="space-y-1.5 bg-gray-800/50 rounded p-2 border border-gray-700/50">
          <div className="flex items-center gap-1.5">
            <ColorPickerPopover
              color={s.paint.kind === "solid" ? s.paint.color : { r: 0, g: 0, b: 0, a: 1 }}
              onChange={(color) => updateStroke(idx, { paint: solidPaint(color) })}
            />
            <div className="flex items-center gap-0.5 flex-1">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={s.width}
                onChange={(e) => updateStroke(idx, { width: parseFloat(e.target.value) || 0 })}
                className="w-10 px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 font-mono text-center focus:outline-none focus:border-primary-500"
              />
              <span className="text-[9px] text-gray-500">px</span>
            </div>
            <select
              value={s.align}
              onChange={(e) => updateStroke(idx, { align: e.target.value as StrokeSpec["align"] })}
              className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 focus:outline-none focus:border-primary-500"
            >
              {STROKE_ALIGN.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeStroke(idx)}
              className="text-gray-500 hover:text-red-400 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
          {/* Advanced stroke options */}
          <div className="flex items-center gap-2">
            <select
              value={s.cap}
              onChange={(e) => updateStroke(idx, { cap: e.target.value as StrokeSpec["cap"] })}
              className="flex-1 px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 focus:outline-none focus:border-primary-500"
            >
              {STROKE_CAP.map((c) => (
                <option key={c} value={c}>Cap: {c}</option>
              ))}
            </select>
            <select
              value={s.join}
              onChange={(e) => updateStroke(idx, { join: e.target.value as StrokeSpec["join"] })}
              className="flex-1 px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 focus:outline-none focus:border-primary-500"
            >
              {STROKE_JOIN.map((j) => (
                <option key={j} value={j}>Join: {j}</option>
              ))}
            </select>
          </div>
          {/* Dash pattern */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-500 w-8">Dash</span>
            <input
              type="text"
              value={s.dash.join(", ")}
              onChange={(e) => {
                const dash = e.target.value
                  .split(",")
                  .map((v) => parseFloat(v.trim()))
                  .filter((v) => !isNaN(v) && v >= 0);
                updateStroke(idx, { dash });
              }}
              placeholder="e.g., 5, 3"
              className="flex-1 px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 font-mono focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
