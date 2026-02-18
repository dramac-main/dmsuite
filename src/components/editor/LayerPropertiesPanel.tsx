"use client";

// =============================================================================
// DMSuite — Layer Properties Panel (vNext — Full Control)
// Comprehensive right-side inspector integrating all sub-editors:
// Transform, Text, Fill/Stroke, Effects, Blend Mode, Constraints, Tags.
// Every property of every layer type is exposed and editable.
// =============================================================================

import React, { useCallback, useMemo, useState } from "react";
import { useEditorStore } from "@/stores/editor";
import type {
  LayerV2, TextLayerV2, ShapeLayerV2, ImageLayerV2, IconLayerV2,
  FrameLayerV2, PathLayerV2,
  LayerId, BlendMode, Paint, StrokeSpec, Effect, RGBA,
} from "@/lib/editor/schema";
import { rgbaToHex, hexToRGBA, solidPaint } from "@/lib/editor/schema";
import { createUpdateCommand } from "@/lib/editor/commands";
import TransformEditor from "./TransformEditor";
import TextStyleEditor from "./TextStyleEditor";
import { FillEditor, StrokeEditor } from "./FillStrokeEditor";
import EffectsEditor from "./EffectsEditor";
import ColorPickerPopover from "./ColorPickerPopover";

// ---------------------------------------------------------------------------
// Blend Mode Options
// ---------------------------------------------------------------------------

const BLEND_MODES: BlendMode[] = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten",
  "color-dodge", "color-burn", "hard-light", "soft-light",
  "difference", "exclusion", "hue", "saturation", "color", "luminosity",
];

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------

function PanelSection({ title, defaultOpen = true, children }: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-800">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-800/50 transition-colors"
      >
        <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{title}</h3>
        <span className="text-gray-600 text-[10px]">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="px-3 pb-2.5">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LayerPropertiesPanel() {
  const doc = useEditorStore((s) => s.doc);
  const execute = useEditorStore((s) => s.execute);
  const selectedIds = doc.selection.ids;

  const selectedLayer = useMemo(() => {
    if (selectedIds.length !== 1) return null;
    return doc.layersById[selectedIds[0]] ?? null;
  }, [selectedIds, doc.layersById]);

  const updateProp = useCallback((layerId: LayerId, partial: Partial<LayerV2>, label: string) => {
    execute(createUpdateCommand(layerId, partial, label));
  }, [execute]);

  const handleLayerChange = useCallback((changes: Partial<LayerV2>) => {
    if (!selectedLayer) return;
    // Derive a label from the first key changed
    const keys = Object.keys(changes);
    const label = keys.length === 1 ? `Update ${keys[0]}` : "Update layer";
    updateProp(selectedLayer.id, changes, label);
  }, [selectedLayer, updateProp]);

  if (selectedIds.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm text-center">
        Select a layer to see its properties
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        <p className="font-medium text-gray-300 mb-2">Multiple Selection</p>
        <p className="text-xs">{selectedIds.length} layers selected</p>
        <p className="text-[10px] text-gray-600 mt-1">Use align/distribute tools in the toolbar</p>
      </div>
    );
  }

  if (!selectedLayer) return null;

  const layer = selectedLayer;
  const layerType = layer.type;

  return (
    <div className="flex flex-col text-sm overflow-y-auto max-h-full">
      {/* ---- Layer Identity ---- */}
      <PanelSection title={`${layerType} Layer`}>
        <div className="space-y-1.5">
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Name</label>
            <input
              type="text"
              value={layer.name}
              onChange={(e) => handleLayerChange({ name: e.target.value } as Partial<LayerV2>)}
              className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={(e) => handleLayerChange({ visible: e.target.checked } as Partial<LayerV2>)}
                className="accent-primary-500"
              />
              Visible
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={layer.locked}
                onChange={(e) => handleLayerChange({ locked: e.target.checked } as Partial<LayerV2>)}
                className="accent-primary-500"
              />
              Locked
            </label>
          </div>
        </div>
      </PanelSection>

      {/* ---- Transform ---- */}
      <PanelSection title="Transform">
        <TransformEditor layer={layer} onChange={handleLayerChange} />
      </PanelSection>

      {/* ---- Text (only for text layers) ---- */}
      {layerType === "text" && (
        <PanelSection title="Text">
          <TextStyleEditor
            layer={layer as TextLayerV2}
            onChange={handleLayerChange}
          />
        </PanelSection>
      )}

      {/* ---- Fill & Stroke (for shapes, frames, paths) ---- */}
      {(layerType === "shape" || layerType === "frame" || layerType === "path") && (
        <PanelSection title="Fill & Stroke">
          <div className="space-y-3">
            {/* Shape type selector */}
            {layerType === "shape" && (
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Shape Type</label>
                <select
                  value={(layer as ShapeLayerV2).shapeType}
                  onChange={(e) => handleLayerChange({ shapeType: e.target.value } as Partial<LayerV2>)}
                  className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
                >
                  {["rectangle", "ellipse", "triangle", "polygon", "star", "line"].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Fills */}
            <FillEditor
              fills={(layer as ShapeLayerV2).fills ?? []}
              onChange={(fills) => handleLayerChange({ fills } as Partial<LayerV2>)}
            />

            {/* Strokes */}
            <StrokeEditor
              strokes={(layer as ShapeLayerV2).strokes ?? []}
              onChange={(strokes) => handleLayerChange({ strokes } as Partial<LayerV2>)}
            />

            {/* Corner Radii (shapes + frames) */}
            {(layerType === "shape" || layerType === "frame") && (
              <CornerRadiiEditor
                radii={
                  layerType === "shape"
                    ? (layer as ShapeLayerV2).cornerRadii
                    : (layer as FrameLayerV2).cornerRadii
                }
                onChange={(cornerRadii) => handleLayerChange({ cornerRadii } as Partial<LayerV2>)}
              />
            )}

            {/* Polygon/Star sides */}
            {layerType === "shape" && ((layer as ShapeLayerV2).shapeType === "polygon" || (layer as ShapeLayerV2).shapeType === "star") && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 block mb-0.5">Sides</label>
                  <input
                    type="number"
                    min={3}
                    max={24}
                    value={(layer as ShapeLayerV2).sides}
                    onChange={(e) => handleLayerChange({ sides: Math.max(3, parseInt(e.target.value) || 3) } as Partial<LayerV2>)}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 font-mono focus:outline-none focus:border-primary-500"
                  />
                </div>
                {(layer as ShapeLayerV2).shapeType === "star" && (
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 block mb-0.5">Inner Ratio</label>
                    <input
                      type="range"
                      min={0.1}
                      max={0.9}
                      step={0.05}
                      value={(layer as ShapeLayerV2).innerRadiusRatio}
                      onChange={(e) => handleLayerChange({ innerRadiusRatio: parseFloat(e.target.value) } as Partial<LayerV2>)}
                      className="w-full h-1 accent-primary-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </PanelSection>
      )}

      {/* ---- Icon (for icon layers) ---- */}
      {layerType === "icon" && (
        <PanelSection title="Icon">
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Icon ID</label>
              <input
                type="text"
                value={(layer as IconLayerV2).iconId}
                onChange={(e) => handleLayerChange({ iconId: e.target.value } as Partial<LayerV2>)}
                className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">Color</span>
              <ColorPickerPopover
                color={(layer as IconLayerV2).color}
                onChange={(color) => handleLayerChange({ color } as Partial<LayerV2>)}
              />
              <span className="text-xs text-gray-400 font-mono">{rgbaToHex((layer as IconLayerV2).color)}</span>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Stroke Width</label>
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.5}
                value={(layer as IconLayerV2).strokeWidth}
                onChange={(e) => handleLayerChange({ strokeWidth: parseFloat(e.target.value) || 2 } as Partial<LayerV2>)}
                className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 font-mono focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </PanelSection>
      )}

      {/* ---- Image (for image layers) ---- */}
      {layerType === "image" && (
        <PanelSection title="Image">
          <ImagePropertiesV2 layer={layer as ImageLayerV2} onChange={handleLayerChange} />
        </PanelSection>
      )}

      {/* ---- Effects ---- */}
      <PanelSection title="Effects" defaultOpen={layer.effects.length > 0}>
        <EffectsEditor
          effects={layer.effects}
          onChange={(effects) => handleLayerChange({ effects } as Partial<LayerV2>)}
        />
      </PanelSection>

      {/* ---- Appearance (Blend Mode) ---- */}
      <PanelSection title="Appearance">
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Blend Mode</label>
            <select
              value={layer.blendMode}
              onChange={(e) => handleLayerChange({ blendMode: e.target.value as BlendMode } as Partial<LayerV2>)}
              className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
            >
              {BLEND_MODES.map(m => (
                <option key={m} value={m}>{m.replace(/-/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">Constraints</label>
            <div className="flex gap-2">
              <select
                value={layer.constraints.horizontal}
                onChange={(e) => handleLayerChange({
                  constraints: { ...layer.constraints, horizontal: e.target.value as LayerV2["constraints"]["horizontal"] },
                } as Partial<LayerV2>)}
                className="flex-1 bg-gray-800 text-gray-200 rounded px-1.5 py-0.5 text-[10px] border border-gray-700 focus:border-primary-500 outline-none"
              >
                {["left", "right", "center", "stretch", "scale"].map(c => (
                  <option key={c} value={c}>H: {c}</option>
                ))}
              </select>
              <select
                value={layer.constraints.vertical}
                onChange={(e) => handleLayerChange({
                  constraints: { ...layer.constraints, vertical: e.target.value as LayerV2["constraints"]["vertical"] },
                } as Partial<LayerV2>)}
                className="flex-1 bg-gray-800 text-gray-200 rounded px-1.5 py-0.5 text-[10px] border border-gray-700 focus:border-primary-500 outline-none"
              >
                {["top", "bottom", "center", "stretch", "scale"].map(c => (
                  <option key={c} value={c}>V: {c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </PanelSection>

      {/* ---- Tags (AI targeting) ---- */}
      <PanelSection title="Tags" defaultOpen={false}>
        <div className="space-y-1.5">
          <p className="text-[9px] text-gray-600">Tags help AI target specific layers for edits</p>
          <input
            type="text"
            value={layer.tags.join(", ")}
            onChange={(e) => {
              const tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
              handleLayerChange({ tags } as Partial<LayerV2>);
            }}
            placeholder="logo, headline, contact-email, decorative..."
            className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
          />
          {layer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {layer.tags.map((tag, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400 text-[9px] border border-primary-500/20">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </PanelSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Corner Radii Editor
// ---------------------------------------------------------------------------

function CornerRadiiEditor({ radii, onChange }: {
  radii: [number, number, number, number];
  onChange: (r: [number, number, number, number]) => void;
}) {
  const [linked, setLinked] = useState(
    radii[0] === radii[1] && radii[1] === radii[2] && radii[2] === radii[3]
  );

  const handleUniform = useCallback((v: number) => {
    onChange([v, v, v, v]);
  }, [onChange]);

  const handleIndividual = useCallback((idx: number, v: number) => {
    const newRadii = [...radii] as [number, number, number, number];
    newRadii[idx] = v;
    onChange(newRadii);
  }, [radii, onChange]);

  const labels = ["TL", "TR", "BR", "BL"];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-gray-500">Corner Radius</label>
        <button
          type="button"
          onClick={() => setLinked(!linked)}
          className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
            linked
              ? "bg-primary-500/10 text-primary-400"
              : "text-gray-600 hover:text-gray-400"
          }`}
        >
          {linked ? "🔗 Linked" : "Unlinked"}
        </button>
      </div>
      {linked ? (
        <input
          type="number"
          min={0}
          max={500}
          value={radii[0]}
          onChange={(e) => handleUniform(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 font-mono focus:outline-none focus:border-primary-500"
        />
      ) : (
        <div className="grid grid-cols-4 gap-1">
          {radii.map((r, i) => (
            <div key={i}>
              <label className="text-[8px] text-gray-600 block mb-0.5">{labels[i]}</label>
              <input
                type="number"
                min={0}
                max={500}
                value={r}
                onChange={(e) => handleIndividual(i, Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-200 font-mono text-center focus:outline-none focus:border-primary-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image Properties (v2 — full control)
// ---------------------------------------------------------------------------

function ImagePropertiesV2({ layer, onChange }: {
  layer: ImageLayerV2;
  onChange: (changes: Partial<LayerV2>) => void;
}) {
  const f = layer.imageFilters;

  return (
    <div className="space-y-2">
      <div>
        <label className="text-[10px] text-gray-500 block mb-0.5">Fit</label>
        <select
          value={layer.fit}
          onChange={(e) => onChange({ fit: e.target.value } as Partial<LayerV2>)}
          className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="stretch">Stretch</option>
          <option value="fill">Fill</option>
        </select>
      </div>

      <div>
        <label className="text-[10px] text-gray-500 block mb-0.5">Corner Radius</label>
        <input
          type="number"
          min={0}
          max={500}
          value={layer.cornerRadius}
          onChange={(e) => onChange({ cornerRadius: Math.max(0, parseInt(e.target.value) || 0) } as Partial<LayerV2>)}
          className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 font-mono focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Focal Point */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 block mb-0.5">Focal X</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={layer.focalPoint.x}
            onChange={(e) => onChange({ focalPoint: { ...layer.focalPoint, x: parseFloat(e.target.value) } } as Partial<LayerV2>)}
            className="w-full h-1 accent-primary-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 block mb-0.5">Focal Y</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={layer.focalPoint.y}
            onChange={(e) => onChange({ focalPoint: { ...layer.focalPoint, y: parseFloat(e.target.value) } } as Partial<LayerV2>)}
            className="w-full h-1 accent-primary-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Filters</label>
        <FilterSlider label="Brightness" value={f.brightness} min={-100} max={100} onChange={(brightness) => onChange({ imageFilters: { ...f, brightness } } as Partial<LayerV2>)} />
        <FilterSlider label="Contrast" value={f.contrast} min={-100} max={100} onChange={(contrast) => onChange({ imageFilters: { ...f, contrast } } as Partial<LayerV2>)} />
        <FilterSlider label="Saturation" value={f.saturation} min={-100} max={100} onChange={(saturation) => onChange({ imageFilters: { ...f, saturation } } as Partial<LayerV2>)} />
        <FilterSlider label="Temperature" value={f.temperature} min={-100} max={100} onChange={(temperature) => onChange({ imageFilters: { ...f, temperature } } as Partial<LayerV2>)} />
        <FilterSlider label="Blur" value={f.blur} min={0} max={20} onChange={(blur) => onChange({ imageFilters: { ...f, blur } } as Partial<LayerV2>)} />
        <div className="flex items-center gap-3 mt-1">
          <label className="flex items-center gap-1 text-[10px] text-gray-400">
            <input
              type="checkbox"
              checked={f.grayscale}
              onChange={(e) => onChange({ imageFilters: { ...f, grayscale: e.target.checked } } as Partial<LayerV2>)}
              className="accent-primary-500"
            />
            Grayscale
          </label>
          <label className="flex items-center gap-1 text-[10px] text-gray-400">
            <input
              type="checkbox"
              checked={f.sepia}
              onChange={(e) => onChange({ imageFilters: { ...f, sepia: e.target.checked } } as Partial<LayerV2>)}
              className="accent-primary-500"
            />
            Sepia
          </label>
        </div>
      </div>

      {/* Image overlays */}
      <FillEditor
        fills={layer.fills}
        onChange={(fills) => onChange({ fills } as Partial<LayerV2>)}
        label="Overlays"
      />
      <StrokeEditor
        strokes={layer.strokes}
        onChange={(strokes) => onChange({ strokes } as Partial<LayerV2>)}
      />
    </div>
  );
}

function FilterSlider({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-gray-500 w-16 flex-shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-1 accent-primary-500"
      />
      <span className="text-[9px] text-gray-500 w-7 text-right font-mono">{value}</span>
    </div>
  );
}
