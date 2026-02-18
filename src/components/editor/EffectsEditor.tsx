"use client";

// =============================================================================
// DMSuite — Effects Stack Editor
// Add, remove, reorder, and configure non-destructive effects per layer.
// Supports: drop-shadow, inner-shadow, blur, glow, outline, color-adjust, noise.
// =============================================================================

import React, { useCallback } from "react";
import type {
  Effect, DropShadowEffect, InnerShadowEffect, BlurEffect,
  GlowEffect, OutlineEffect, ColorAdjustEffect, NoiseEffect,
  RGBA,
} from "@/lib/editor/schema";
import ColorPickerPopover from "./ColorPickerPopover";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EffectsEditorProps {
  effects: Effect[];
  onChange: (effects: Effect[]) => void;
}

// ---------------------------------------------------------------------------
// Default effect factories
// ---------------------------------------------------------------------------

const EFFECT_TYPES = [
  { value: "drop-shadow", label: "Drop Shadow" },
  { value: "inner-shadow", label: "Inner Shadow" },
  { value: "blur", label: "Blur" },
  { value: "glow", label: "Glow" },
  { value: "outline", label: "Outline" },
  { value: "color-adjust", label: "Color Adjust" },
  { value: "noise", label: "Noise" },
] as const;

function createDefaultEffect(type: Effect["type"]): Effect {
  switch (type) {
    case "drop-shadow":
      return { type: "drop-shadow", enabled: true, color: { r: 0, g: 0, b: 0, a: 0.3 }, offsetX: 4, offsetY: 4, blur: 8, spread: 0 };
    case "inner-shadow":
      return { type: "inner-shadow", enabled: true, color: { r: 0, g: 0, b: 0, a: 0.2 }, offsetX: 2, offsetY: 2, blur: 4 };
    case "blur":
      return { type: "blur", enabled: true, blurType: "gaussian", radius: 4, angle: 0 };
    case "glow":
      return { type: "glow", enabled: true, color: { r: 138, g: 230, b: 0, a: 0.6 }, radius: 8, intensity: 0.5, inner: false };
    case "outline":
      return { type: "outline", enabled: true, color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 };
    case "color-adjust":
      return { type: "color-adjust", enabled: true, brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, hueRotate: 0 };
    case "noise":
      return { type: "noise", enabled: true, intensity: 0.1, monochrome: true };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EffectsEditor({ effects, onChange }: EffectsEditorProps) {
  const updateEffect = useCallback((idx: number, changes: Partial<Effect>) => {
    const updated = [...effects];
    updated[idx] = { ...updated[idx], ...changes } as Effect;
    onChange(updated);
  }, [effects, onChange]);

  const removeEffect = useCallback((idx: number) => {
    onChange(effects.filter((_, i) => i !== idx));
  }, [effects, onChange]);

  const addEffect = useCallback((type: Effect["type"]) => {
    onChange([...effects, createDefaultEffect(type)]);
  }, [effects, onChange]);

  const moveEffect = useCallback((idx: number, dir: "up" | "down") => {
    const updated = [...effects];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= updated.length) return;
    [updated[idx], updated[swap]] = [updated[swap], updated[idx]];
    onChange(updated);
  }, [effects, onChange]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Effects</h4>
        <div className="relative group">
          <button
            type="button"
            className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
          >
            + Add
          </button>
          <div className="absolute right-0 top-full mt-1 w-36 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50 hidden group-hover:block">
            {EFFECT_TYPES.map((et) => (
              <button
                key={et.value}
                type="button"
                onClick={() => addEffect(et.value)}
                className="w-full text-left px-3 py-1 text-xs text-gray-300 hover:bg-gray-800 hover:text-primary-400 transition-colors"
              >
                {et.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {effects.length === 0 && (
        <p className="text-[10px] text-gray-600 italic">No effects</p>
      )}

      {effects.map((effect, idx) => (
        <div key={idx} className="bg-gray-800/50 rounded p-2 border border-gray-700/50 space-y-1.5">
          {/* Header */}
          <div className="flex items-center gap-1.5">
            {/* Enable toggle */}
            <button
              type="button"
              onClick={() => updateEffect(idx, { enabled: !effect.enabled })}
              className={`w-3.5 h-3.5 rounded-sm border transition-colors ${
                effect.enabled
                  ? "bg-primary-500 border-primary-500"
                  : "bg-gray-700 border-gray-600"
              }`}
              title={effect.enabled ? "Disable" : "Enable"}
            />
            <span className={`flex-1 text-[10px] font-medium ${effect.enabled ? "text-gray-300" : "text-gray-600"}`}>
              {EFFECT_TYPES.find(et => et.value === effect.type)?.label ?? effect.type}
            </span>
            {/* Reorder */}
            <button type="button" onClick={() => moveEffect(idx, "up")} className="text-gray-600 hover:text-gray-300 text-[10px]" title="Move up">↑</button>
            <button type="button" onClick={() => moveEffect(idx, "down")} className="text-gray-600 hover:text-gray-300 text-[10px]" title="Move down">↓</button>
            <button type="button" onClick={() => removeEffect(idx)} className="text-gray-600 hover:text-red-400 text-[10px]" title="Remove">✕</button>
          </div>

          {/* Effect-specific controls */}
          {effect.enabled && (
            <div className="pl-5 space-y-1">
              {effect.type === "drop-shadow" && <DropShadowControls effect={effect} onChange={(c) => updateEffect(idx, c)} />}
              {effect.type === "inner-shadow" && <InnerShadowControls effect={effect} onChange={(c) => updateEffect(idx, c)} />}
              {effect.type === "blur" && <BlurControls effect={effect} onChange={(c) => updateEffect(idx, c)} />}
              {effect.type === "glow" && <GlowControls effect={effect} onChange={(c) => updateEffect(idx, c)} />}
              {effect.type === "outline" && <OutlineControls effect={effect} onChange={(c) => updateEffect(idx, c)} />}
              {effect.type === "color-adjust" && <ColorAdjustControls effect={effect} onChange={(c) => updateEffect(idx, c)} />}
              {effect.type === "noise" && <NoiseControls effect={effect} onChange={(c) => updateEffect(idx, c)} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Effect-specific Controls
// ---------------------------------------------------------------------------

function DropShadowControls({ effect, onChange }: { effect: DropShadowEffect; onChange: (c: Partial<DropShadowEffect>) => void }) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <ColorPickerPopover color={effect.color} onChange={(color) => onChange({ color })} />
        <SliderRow label="Blur" value={effect.blur} min={0} max={50} onChange={(blur) => onChange({ blur })} />
      </div>
      <div className="flex gap-2">
        <SmallNum label="X" value={effect.offsetX} onChange={(offsetX) => onChange({ offsetX })} />
        <SmallNum label="Y" value={effect.offsetY} onChange={(offsetY) => onChange({ offsetY })} />
        <SmallNum label="Spread" value={effect.spread} onChange={(spread) => onChange({ spread })} min={0} />
      </div>
    </>
  );
}

function InnerShadowControls({ effect, onChange }: { effect: InnerShadowEffect; onChange: (c: Partial<InnerShadowEffect>) => void }) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <ColorPickerPopover color={effect.color} onChange={(color) => onChange({ color })} />
        <SliderRow label="Blur" value={effect.blur} min={0} max={50} onChange={(blur) => onChange({ blur })} />
      </div>
      <div className="flex gap-2">
        <SmallNum label="X" value={effect.offsetX} onChange={(offsetX) => onChange({ offsetX })} />
        <SmallNum label="Y" value={effect.offsetY} onChange={(offsetY) => onChange({ offsetY })} />
      </div>
    </>
  );
}

function BlurControls({ effect, onChange }: { effect: BlurEffect; onChange: (c: Partial<BlurEffect>) => void }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={effect.blurType}
          onChange={(e) => onChange({ blurType: e.target.value as BlurEffect["blurType"] })}
          className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 focus:outline-none focus:border-primary-500"
        >
          <option value="gaussian">Gaussian</option>
          <option value="motion">Motion</option>
        </select>
      </div>
      <SliderRow label="Radius" value={effect.radius} min={0} max={100} onChange={(radius) => onChange({ radius })} />
      {effect.blurType === "motion" && (
        <SliderRow label="Angle" value={effect.angle} min={0} max={360} onChange={(angle) => onChange({ angle })} suffix="°" />
      )}
    </>
  );
}

function GlowControls({ effect, onChange }: { effect: GlowEffect; onChange: (c: Partial<GlowEffect>) => void }) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <ColorPickerPopover color={effect.color} onChange={(color) => onChange({ color })} />
        <label className="flex items-center gap-1 text-[10px] text-gray-400">
          <input
            type="checkbox"
            checked={effect.inner}
            onChange={(e) => onChange({ inner: e.target.checked })}
            className="accent-primary-500"
          />
          Inner
        </label>
      </div>
      <SliderRow label="Radius" value={effect.radius} min={0} max={50} onChange={(radius) => onChange({ radius })} />
      <SliderRow label="Intensity" value={effect.intensity} min={0} max={1} step={0.01} onChange={(intensity) => onChange({ intensity })} />
    </>
  );
}

function OutlineControls({ effect, onChange }: { effect: OutlineEffect; onChange: (c: Partial<OutlineEffect>) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <ColorPickerPopover color={effect.color} onChange={(color) => onChange({ color })} />
      <SmallNum label="Width" value={effect.width} onChange={(width) => onChange({ width })} min={0.5} step={0.5} />
    </div>
  );
}

function ColorAdjustControls({ effect, onChange }: { effect: ColorAdjustEffect; onChange: (c: Partial<ColorAdjustEffect>) => void }) {
  return (
    <div className="space-y-1">
      <SliderRow label="Brightness" value={effect.brightness} min={-100} max={100} onChange={(brightness) => onChange({ brightness })} />
      <SliderRow label="Contrast" value={effect.contrast} min={-100} max={100} onChange={(contrast) => onChange({ contrast })} />
      <SliderRow label="Saturation" value={effect.saturation} min={-100} max={100} onChange={(saturation) => onChange({ saturation })} />
      <SliderRow label="Temperature" value={effect.temperature} min={-100} max={100} onChange={(temperature) => onChange({ temperature })} />
      <SliderRow label="Hue Rotate" value={effect.hueRotate} min={0} max={360} onChange={(hueRotate) => onChange({ hueRotate })} suffix="°" />
    </div>
  );
}

function NoiseControls({ effect, onChange }: { effect: NoiseEffect; onChange: (c: Partial<NoiseEffect>) => void }) {
  return (
    <>
      <SliderRow label="Intensity" value={effect.intensity} min={0} max={1} step={0.01} onChange={(intensity) => onChange({ intensity })} />
      <label className="flex items-center gap-1 text-[10px] text-gray-400">
        <input
          type="checkbox"
          checked={effect.monochrome}
          onChange={(e) => onChange({ monochrome: e.target.checked })}
          className="accent-primary-500"
        />
        Monochrome
      </label>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared mini controls
// ---------------------------------------------------------------------------

function SliderRow({ label, value, min, max, step = 1, onChange, suffix }: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-gray-500 w-12 flex-shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-primary-500"
      />
      <span className="text-[9px] text-gray-500 w-8 text-right font-mono">
        {step < 1 ? value.toFixed(2) : Math.round(value)}{suffix ?? ""}
      </span>
    </div>
  );
}

function SmallNum({ label, value, onChange, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div className="flex-1">
      <label className="text-[9px] text-gray-500 block">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 font-mono text-center focus:outline-none focus:border-primary-500"
      />
    </div>
  );
}
