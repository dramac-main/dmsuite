"use client";

// =============================================================================
// DMSuite — Transform Editor
// Precise position, size, rotation, and flip controls for selected layers.
// =============================================================================

import React, { useCallback, useState } from "react";
import type { LayerV2, Transform } from "@/lib/editor/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TransformEditorProps {
  layer: LayerV2;
  onChange: (changes: Partial<LayerV2>) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TransformEditor({ layer, onChange }: TransformEditorProps) {
  const t = layer.transform;
  const [lockAspect, setLockAspect] = useState(false);
  const aspectRatio = t.size.x / (t.size.y || 1);

  const updateTransform = useCallback((changes: Partial<Transform>) => {
    onChange({ transform: { ...t, ...changes } });
  }, [t, onChange]);

  const handleWidthChange = useCallback((w: number) => {
    if (lockAspect) {
      const h = Math.round(w / aspectRatio);
      updateTransform({ size: { x: w, y: h } });
    } else {
      updateTransform({ size: { ...t.size, x: w } });
    }
  }, [lockAspect, aspectRatio, t.size, updateTransform]);

  const handleHeightChange = useCallback((h: number) => {
    if (lockAspect) {
      const w = Math.round(h * aspectRatio);
      updateTransform({ size: { x: w, y: h } });
    } else {
      updateTransform({ size: { ...t.size, y: h } });
    }
  }, [lockAspect, aspectRatio, t.size, updateTransform]);

  return (
    <div className="space-y-2">
      {/* Position Row */}
      <div className="flex gap-2">
        <NumField
          label="X"
          value={Math.round(t.position.x)}
          onChange={(v) => updateTransform({ position: { ...t.position, x: v } })}
          step={1}
        />
        <NumField
          label="Y"
          value={Math.round(t.position.y)}
          onChange={(v) => updateTransform({ position: { ...t.position, y: v } })}
          step={1}
        />
      </div>

      {/* Size Row */}
      <div className="flex gap-2 items-end">
        <NumField
          label="W"
          value={Math.round(t.size.x)}
          onChange={(v) => handleWidthChange(Math.max(1, v))}
          min={1}
          step={1}
        />
        {/* Lock aspect ratio */}
        <button
          type="button"
          onClick={() => setLockAspect(!lockAspect)}
          className={`
            mb-0.5 p-1 rounded text-xs transition-colors
            ${lockAspect
              ? "text-primary-400 bg-primary-500/10"
              : "text-gray-500 hover:text-gray-300"
            }
          `}
          title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
        >
          {lockAspect ? "🔗" : "⛓️‍💥"}
        </button>
        <NumField
          label="H"
          value={Math.round(t.size.y)}
          onChange={(v) => handleHeightChange(Math.max(1, v))}
          min={1}
          step={1}
        />
      </div>

      {/* Rotation Row */}
      <div className="flex gap-2 items-end">
        <NumField
          label="Rotation"
          value={Math.round(t.rotation * 10) / 10}
          onChange={(v) => updateTransform({ rotation: v % 360 })}
          step={1}
          suffix="°"
        />
        {/* Quick rotation buttons */}
        <div className="flex items-center gap-0.5 mb-0.5">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => updateTransform({ rotation: deg })}
              className={`
                px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors
                ${Math.abs(t.rotation - deg) < 0.5
                  ? "bg-primary-500/20 text-primary-400"
                  : "bg-gray-800 text-gray-500 hover:text-gray-300"
                }
              `}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* Skew Row */}
      <div className="flex gap-2">
        <NumField
          label="Skew X"
          value={Math.round(t.skewX * 10) / 10}
          onChange={(v) => updateTransform({ skewX: v })}
          step={0.5}
          suffix="°"
        />
        <NumField
          label="Skew Y"
          value={Math.round(t.skewY * 10) / 10}
          onChange={(v) => updateTransform({ skewY: v })}
          step={0.5}
          suffix="°"
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-1">Opacity</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={layer.opacity}
            onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
            className="flex-1 h-1 accent-primary-500"
          />
          <span className="text-[10px] text-gray-400 font-mono w-8 text-right">
            {Math.round(layer.opacity * 100)}%
          </span>
        </div>
      </div>

      {/* Flip + Reset */}
      <div className="flex items-center gap-1 pt-1">
        <button
          type="button"
          onClick={() => updateTransform({
            position: { x: t.position.x + t.size.x, y: t.position.y },
            size: t.size,
          })}
          className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] border border-gray-700 hover:text-gray-200 hover:border-gray-600 transition-colors"
          title="Flip horizontal"
        >
          ↔ Flip H
        </button>
        <button
          type="button"
          onClick={() => updateTransform({
            position: { x: t.position.x, y: t.position.y + t.size.y },
            size: t.size,
          })}
          className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] border border-gray-700 hover:text-gray-200 hover:border-gray-600 transition-colors"
          title="Flip vertical"
        >
          ↕ Flip V
        </button>
        <button
          type="button"
          onClick={() => updateTransform({ rotation: 0, skewX: 0, skewY: 0 })}
          className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] border border-gray-700 hover:text-gray-200 hover:border-gray-600 transition-colors"
          title="Reset rotation/skew"
        >
          ⟲ Reset
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Numeric Field (reusable)
// ---------------------------------------------------------------------------

function NumField({ label, value, onChange, min, max, step = 1, suffix }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex-1">
      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block mb-0.5">
        {label}
      </label>
      <div className="flex items-center gap-0.5">
        <input
          type="number"
          value={value}
          onChange={(e) => {
            let v = parseFloat(e.target.value);
            if (isNaN(v)) v = 0;
            if (min !== undefined) v = Math.max(min, v);
            if (max !== undefined) v = Math.min(max, v);
            onChange(v);
          }}
          min={min}
          max={max}
          step={step}
          className="w-full px-1.5 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 font-mono focus:outline-none focus:border-primary-500"
        />
        {suffix && <span className="text-[9px] text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
}

export { NumField };
