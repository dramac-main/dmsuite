"use client";

// =============================================================================
// DMSuite — Layer Properties Panel
// Right-side inspector panel showing properties of the selected layer(s).
// Provides direct editing controls for transform, fills, strokes, effects, text.
// =============================================================================

import React, { useCallback, useMemo } from "react";
import { useEditorStore } from "@/stores/editor";
import type {
  LayerV2, TextLayerV2, ShapeLayerV2, ImageLayerV2, IconLayerV2,
  LayerId,
} from "@/lib/editor/schema";
import { rgbaToHex, hexToRGBA, solidPaint } from "@/lib/editor/schema";
import { createUpdateCommand } from "@/lib/editor/commands";

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
        <p>{selectedIds.length} layers selected</p>
      </div>
    );
  }

  if (!selectedLayer) return null;

  return (
    <div className="flex flex-col gap-0.5 text-sm overflow-y-auto max-h-full">
      {/* Layer Name & Type */}
      <Section title={`${selectedLayer.type.toUpperCase()} — ${selectedLayer.name}`}>
        <Field label="Name">
          <input
            type="text"
            value={selectedLayer.name}
            onChange={(e) => updateProp(selectedLayer.id, { name: e.target.value } as Partial<LayerV2>, "Rename")}
            className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
          />
        </Field>
        <Field label="Visible">
          <input
            type="checkbox"
            checked={selectedLayer.visible}
            onChange={(e) => updateProp(selectedLayer.id, { visible: e.target.checked } as Partial<LayerV2>, "Toggle Visibility")}
            className="accent-primary-500"
          />
        </Field>
        <Field label="Locked">
          <input
            type="checkbox"
            checked={selectedLayer.locked}
            onChange={(e) => updateProp(selectedLayer.id, { locked: e.target.checked } as Partial<LayerV2>, "Toggle Lock")}
            className="accent-primary-500"
          />
        </Field>
      </Section>

      {/* Transform */}
      <Section title="Transform">
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="X" value={Math.round(selectedLayer.transform.position.x)}
            onChange={(v) => updateProp(selectedLayer.id, {
              transform: { ...selectedLayer.transform, position: { ...selectedLayer.transform.position, x: v } },
            } as Partial<LayerV2>, "Move X")}
          />
          <NumberField
            label="Y" value={Math.round(selectedLayer.transform.position.y)}
            onChange={(v) => updateProp(selectedLayer.id, {
              transform: { ...selectedLayer.transform, position: { ...selectedLayer.transform.position, y: v } },
            } as Partial<LayerV2>, "Move Y")}
          />
          <NumberField
            label="W" value={Math.round(selectedLayer.transform.size.x)}
            onChange={(v) => updateProp(selectedLayer.id, {
              transform: { ...selectedLayer.transform, size: { ...selectedLayer.transform.size, x: Math.max(1, v) } },
            } as Partial<LayerV2>, "Resize W")}
          />
          <NumberField
            label="H" value={Math.round(selectedLayer.transform.size.y)}
            onChange={(v) => updateProp(selectedLayer.id, {
              transform: { ...selectedLayer.transform, size: { ...selectedLayer.transform.size, y: Math.max(1, v) } },
            } as Partial<LayerV2>, "Resize H")}
          />
          <NumberField
            label="Rotation" value={Math.round(selectedLayer.transform.rotation)}
            onChange={(v) => updateProp(selectedLayer.id, {
              transform: { ...selectedLayer.transform, rotation: v },
            } as Partial<LayerV2>, "Rotate")}
            suffix="°"
          />
          <NumberField
            label="Opacity" value={Math.round(selectedLayer.opacity * 100)}
            onChange={(v) => updateProp(selectedLayer.id, {
              opacity: Math.max(0, Math.min(100, v)) / 100,
            } as Partial<LayerV2>, "Opacity")}
            suffix="%"
            min={0} max={100}
          />
        </div>
      </Section>

      {/* Text-specific */}
      {selectedLayer.type === "text" && (
        <TextProperties layer={selectedLayer as TextLayerV2} updateProp={updateProp} />
      )}

      {/* Shape-specific */}
      {selectedLayer.type === "shape" && (
        <ShapeProperties layer={selectedLayer as ShapeLayerV2} updateProp={updateProp} />
      )}

      {/* Icon-specific */}
      {selectedLayer.type === "icon" && (
        <IconProperties layer={selectedLayer as IconLayerV2} updateProp={updateProp} />
      )}

      {/* Image-specific */}
      {selectedLayer.type === "image" && (
        <ImageProperties layer={selectedLayer as ImageLayerV2} updateProp={updateProp} />
      )}

      {/* Blend Mode */}
      <Section title="Blending">
        <Field label="Blend Mode">
          <select
            value={selectedLayer.blendMode}
            onChange={(e) => updateProp(selectedLayer.id, { blendMode: e.target.value } as unknown as Partial<LayerV2>, "Blend Mode")}
            className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
          >
            {["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
      </Section>

      {/* Tags */}
      <Section title="Tags">
        <Field label="Tags">
          <input
            type="text"
            value={selectedLayer.tags.join(", ")}
            onChange={(e) => {
              const tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
              updateProp(selectedLayer.id, { tags } as Partial<LayerV2>, "Update Tags");
            }}
            placeholder="logo, heading, decorative..."
            className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
          />
        </Field>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text Properties
// ---------------------------------------------------------------------------

function TextProperties({
  layer,
  updateProp,
}: {
  layer: TextLayerV2;
  updateProp: (id: LayerId, partial: Partial<LayerV2>, label: string) => void;
}) {
  const fillColor = layer.defaultStyle.fill.kind === "solid"
    ? rgbaToHex(layer.defaultStyle.fill.color)
    : "#000000";

  return (
    <Section title="Text">
      <Field label="Content">
        <textarea
          value={layer.text}
          onChange={(e) => updateProp(layer.id, { text: e.target.value } as Partial<LayerV2>, "Edit Text")}
          rows={2}
          className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none resize-none"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Font Family">
          <input
            type="text"
            value={layer.defaultStyle.fontFamily}
            onChange={(e) => updateProp(layer.id, {
              defaultStyle: { ...layer.defaultStyle, fontFamily: e.target.value },
            } as Partial<LayerV2>, "Font Family")}
            className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
          />
        </Field>
        <NumberField
          label="Size"
          value={layer.defaultStyle.fontSize}
          onChange={(v) => updateProp(layer.id, {
            defaultStyle: { ...layer.defaultStyle, fontSize: Math.max(4, v) },
          } as Partial<LayerV2>, "Font Size")}
          suffix="px"
        />
        <NumberField
          label="Weight"
          value={layer.defaultStyle.fontWeight}
          onChange={(v) => updateProp(layer.id, {
            defaultStyle: { ...layer.defaultStyle, fontWeight: Math.max(100, Math.min(900, v)) },
          } as Partial<LayerV2>, "Font Weight")}
          step={100}
        />
        <Field label="Color">
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={fillColor}
              onChange={(e) => updateProp(layer.id, {
                defaultStyle: { ...layer.defaultStyle, fill: solidPaint(hexToRGBA(e.target.value)) },
              } as Partial<LayerV2>, "Text Color")}
              className="w-6 h-6 rounded border-0 cursor-pointer"
            />
            <span className="text-gray-400 text-xs font-mono">{fillColor}</span>
          </div>
        </Field>
      </div>
      <div className="flex gap-2 mt-1">
        <ToggleButton
          active={layer.defaultStyle.italic}
          onClick={() => updateProp(layer.id, {
            defaultStyle: { ...layer.defaultStyle, italic: !layer.defaultStyle.italic },
          } as Partial<LayerV2>, "Toggle Italic")}
        >
          I
        </ToggleButton>
        <ToggleButton
          active={layer.defaultStyle.underline}
          onClick={() => updateProp(layer.id, {
            defaultStyle: { ...layer.defaultStyle, underline: !layer.defaultStyle.underline },
          } as Partial<LayerV2>, "Toggle Underline")}
        >
          U
        </ToggleButton>
        <ToggleButton
          active={layer.defaultStyle.uppercase}
          onClick={() => updateProp(layer.id, {
            defaultStyle: { ...layer.defaultStyle, uppercase: !layer.defaultStyle.uppercase },
          } as Partial<LayerV2>, "Toggle Uppercase")}
        >
          AA
        </ToggleButton>
      </div>
      <Field label="Align">
        <div className="flex gap-1">
          {(["left", "center", "right", "justify"] as const).map(align => (
            <ToggleButton
              key={align}
              active={layer.paragraphs[0]?.align === align}
              onClick={() => updateProp(layer.id, {
                paragraphs: [{ ...layer.paragraphs[0], align }],
              } as Partial<LayerV2>, `Align ${align}`)}
            >
              {align.charAt(0).toUpperCase()}
            </ToggleButton>
          ))}
        </div>
      </Field>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Shape Properties
// ---------------------------------------------------------------------------

function ShapeProperties({
  layer,
  updateProp,
}: {
  layer: ShapeLayerV2;
  updateProp: (id: LayerId, partial: Partial<LayerV2>, label: string) => void;
}) {
  const fillColor = layer.fills[0]?.kind === "solid"
    ? rgbaToHex(layer.fills[0].color)
    : "#000000";
  const strokeColor = layer.strokes[0]?.paint?.kind === "solid"
    ? rgbaToHex(layer.strokes[0].paint.color)
    : "#000000";

  return (
    <Section title="Shape">
      <Field label="Type">
        <select
          value={layer.shapeType}
          onChange={(e) => updateProp(layer.id, { shapeType: e.target.value } as Partial<LayerV2>, "Shape Type")}
          className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
        >
          {["rect", "ellipse", "triangle", "polygon", "star", "line"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Fill">
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={fillColor}
            onChange={(e) => updateProp(layer.id, {
              fills: [solidPaint(hexToRGBA(e.target.value))],
            } as Partial<LayerV2>, "Shape Fill")}
            className="w-6 h-6 rounded border-0 cursor-pointer"
          />
          <span className="text-gray-400 text-xs font-mono">{fillColor}</span>
        </div>
      </Field>
      {layer.strokes.length > 0 && (
        <>
          <Field label="Stroke">
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => updateProp(layer.id, {
                  strokes: [{ ...layer.strokes[0], paint: solidPaint(hexToRGBA(e.target.value)) }],
                } as Partial<LayerV2>, "Stroke Color")}
                className="w-6 h-6 rounded border-0 cursor-pointer"
              />
              <NumberField
                label=""
                value={layer.strokes[0]?.width ?? 1}
                onChange={(v) => updateProp(layer.id, {
                  strokes: [{ ...layer.strokes[0], width: Math.max(0, v) }],
                } as Partial<LayerV2>, "Stroke Width")}
                suffix="px"
              />
            </div>
          </Field>
        </>
      )}
      {layer.shapeType === "rectangle" && (
        <NumberField
          label="Corner Radius"
          value={layer.cornerRadii[0]}
          onChange={(v) => updateProp(layer.id, {
            cornerRadii: [v, v, v, v],
          } as Partial<LayerV2>, "Corner Radius")}
          suffix="px"
        />
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Icon Properties
// ---------------------------------------------------------------------------

function IconProperties({
  layer,
  updateProp,
}: {
  layer: IconLayerV2;
  updateProp: (id: LayerId, partial: Partial<LayerV2>, label: string) => void;
}) {
  const color = rgbaToHex(layer.color);
  return (
    <Section title="Icon">
      <Field label="Icon ID">
        <input
          type="text"
          value={layer.iconId}
          onChange={(e) => updateProp(layer.id, { iconId: e.target.value } as Partial<LayerV2>, "Icon ID")}
          className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
        />
      </Field>
      <Field label="Color">
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={color}
            onChange={(e) => updateProp(layer.id, {
              color: hexToRGBA(e.target.value),
            } as Partial<LayerV2>, "Icon Color")}
            className="w-6 h-6 rounded border-0 cursor-pointer"
          />
          <span className="text-gray-400 text-xs font-mono">{color}</span>
        </div>
      </Field>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Image Properties
// ---------------------------------------------------------------------------

function ImageProperties({
  layer,
  updateProp,
}: {
  layer: ImageLayerV2;
  updateProp: (id: LayerId, partial: Partial<LayerV2>, label: string) => void;
}) {
  return (
    <Section title="Image">
      <Field label="Fit">
        <select
          value={layer.fit}
          onChange={(e) => updateProp(layer.id, { fit: e.target.value } as Partial<LayerV2>, "Image Fit")}
          className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
          <option value="none">None</option>
        </select>
      </Field>
      {layer.imageFilters && (
        <>
          <NumberField
            label="Brightness"
            value={Math.round((layer.imageFilters.brightness ?? 100))}
            onChange={(v) => updateProp(layer.id, {
              imageFilters: { ...layer.imageFilters, brightness: v },
            } as Partial<LayerV2>, "Brightness")}
            suffix="%" min={0} max={200}
          />
          <NumberField
            label="Contrast"
            value={Math.round((layer.imageFilters.contrast ?? 100))}
            onChange={(v) => updateProp(layer.id, {
              imageFilters: { ...layer.imageFilters, contrast: v },
            } as Partial<LayerV2>, "Contrast")}
            suffix="%" min={0} max={200}
          />
          <NumberField
            label="Saturation"
            value={Math.round((layer.imageFilters.saturation ?? 100))}
            onChange={(v) => updateProp(layer.id, {
              imageFilters: { ...layer.imageFilters, saturation: v },
            } as Partial<LayerV2>, "Saturation")}
            suffix="%" min={0} max={200}
          />
        </>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Reusable UI pieces
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-800 pb-2 mb-1">
      <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-3 py-1.5">{title}</h3>
      <div className="px-3 flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      {label && <span className="text-gray-400 text-xs min-w-16 shrink-0">{label}</span>}
      <div className="flex-1">{children}</div>
    </div>
  );
}

function NumberField({
  label, value, onChange, suffix, min, max, step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step ?? 1}
          className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700 focus:border-primary-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-gray-500 text-xs">{suffix}</span>}
      </div>
    </Field>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
        active
          ? "bg-primary-500/20 text-primary-400 border-primary-500/40"
          : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600"
      }`}
    >
      {children}
    </button>
  );
}
