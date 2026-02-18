"use client";

// =============================================================================
// DMSuite — Business Card Layer Quick-Edit
// Shows direct per-element color pickers for the semantic layers of a business
// card: Name, Title, Company, Contact, Accent shapes, and Background.
//
// This is the "easy" editing panel — users don't need to navigate the layers
// list to change individual element colors.
// =============================================================================

import React, { useCallback, useMemo } from "react";
import { useEditorStore } from "@/stores/editor";
import type { TextLayerV2, ShapeLayerV2, FrameLayerV2, RGBA, Paint, LayerV2 } from "@/lib/editor/schema";
import { getLayerOrder, rgbaToHex, solidPaint } from "@/lib/editor/schema";
import { createUpdateCommand } from "@/lib/editor/commands";
import ColorPickerPopover from "./ColorPickerPopover";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SemanticEntry {
  tag: string;
  label: string;
  description: string;
}

const SEMANTIC_ELEMENTS: SemanticEntry[] = [
  { tag: "name",         label: "Name",       description: "Your full name text" },
  { tag: "title",        label: "Title",       description: "Job title / position" },
  { tag: "company",      label: "Company",     description: "Company name" },
  { tag: "tagline",      label: "Tagline",     description: "Tagline or subtitle" },
  { tag: "contact-text", label: "Contact",     description: "Contact info (email, phone, etc.)" },
  { tag: "contact-icon", label: "Icons",       description: "Contact line icons" },
  { tag: "accent",       label: "Accent",      description: "Decorative shapes & highlights" },
  { tag: "border",       label: "Border",      description: "Frame borders & outlines" },
  { tag: "corner",       label: "Corners",     description: "Corner accent marks" },
  { tag: "logo",         label: "Logo",        description: "Logo or brand initials" },
  { tag: "qr-code",      label: "QR Code",     description: "QR code element" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BusinessCardLayerQuickEdit() {
  const doc = useEditorStore((s) => s.doc);
  const execute = useEditorStore((s) => s.execute);
  const selectLayers = useEditorStore((s) => s.selectLayers);

  const layers = useMemo(() => getLayerOrder(doc).filter((l) => l.id !== doc.rootFrameId), [doc]);

  // Background is the root frame
  const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2 | undefined;
  const bgColor: RGBA = rootFrame?.fills?.[0]?.kind === "solid"
    ? rootFrame.fills[0].color
    : { r: 255, g: 255, b: 255, a: 1 };

  // Find the first layer matching each semantic tag
  const findLayerByTag = useCallback((tag: string) => {
    return layers.find((l) => l.tags.includes(tag));
  }, [layers]);

  // Get the primary display color from a layer
  const getLayerColor = useCallback((layer: LayerV2): RGBA | null => {
    if (layer.type === "text") {
      const fill = (layer as TextLayerV2).defaultStyle.fill;
      return fill.kind === "solid" ? fill.color : null;
    }
    if (layer.type === "shape") {
      const fill = (layer as ShapeLayerV2).fills?.[0];
      return fill?.kind === "solid" ? fill.color : null;
    }
    if (layer.type === "icon") {
      return (layer as unknown as { color: RGBA }).color ?? null;
    }
    return null;
  }, []);

  // Apply a color change to ALL layers sharing the same tag
  const handleColorChange = useCallback((tag: string, color: RGBA) => {
    const matching = layers.filter((l) => l.tags.includes(tag));
    for (const layer of matching) {
      if (layer.type === "text") {
        const t = layer as TextLayerV2;
        execute(createUpdateCommand(layer.id, {
          defaultStyle: { ...t.defaultStyle, fill: solidPaint(color) },
        } as Partial<LayerV2>, `Color: ${tag}`));
      } else if (layer.type === "shape") {
        const s = layer as ShapeLayerV2;
        execute(createUpdateCommand(layer.id, {
          fills: s.fills.map((f, i) => i === 0 ? solidPaint(color) : f) as Paint[],
        } as Partial<LayerV2>, `Color: ${tag}`));
      } else if (layer.type === "icon") {
        execute(createUpdateCommand(layer.id, {
          color,
        } as Partial<LayerV2>, `Color: ${tag}`));
      }
    }
  }, [layers, execute]);

  // Click on an element label → select all layers with that tag on canvas
  const handleLabelClick = useCallback((tag: string) => {
    const matching = layers.filter((l) => l.tags.includes(tag));
    if (matching.length > 0) {
      selectLayers(matching.map((l) => l.id));
    }
  }, [layers, selectLayers]);

  // Change background color
  const handleBgColorChange = useCallback((color: RGBA) => {
    if (!rootFrame) return;
    execute(createUpdateCommand(doc.rootFrameId, {
      fills: [solidPaint(color)],
    } as Partial<LayerV2>, "Background color"));
  }, [rootFrame, doc.rootFrameId, execute]);

  return (
    <div className="space-y-0.5">
      {/* Semantic elements */}
      {SEMANTIC_ELEMENTS.map(({ tag, label, description }) => {
        const layer = findLayerByTag(tag);
        if (!layer) return null;

        const color = getLayerColor(layer);
        const matchCount = layers.filter((l) => l.tags.includes(tag)).length;

        return (
          <div
            key={tag}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-800/40 group"
          >
            {/* Color picker */}
            <ColorPickerPopover
              color={color ?? { r: 128, g: 128, b: 128, a: 1 }}
              onChange={(c) => handleColorChange(tag, c)}
              label={label}
            />

            {/* Label — click to select on canvas */}
            <button
              type="button"
              onClick={() => handleLabelClick(tag)}
              className="flex-1 text-left min-w-0"
            >
              <div className="text-xs text-gray-300 group-hover:text-gray-100 transition-colors truncate">
                {label}
                {matchCount > 1 && (
                  <span className="ml-1 text-[9px] text-gray-600">×{matchCount}</span>
                )}
              </div>
              <div className="text-[9px] text-gray-600 truncate">{description}</div>
            </button>

            {/* Hex value */}
            {color && (
              <span className="text-[9px] text-gray-600 font-mono shrink-0 hidden group-hover:inline">
                {rgbaToHex(color)}
              </span>
            )}
          </div>
        );
      })}

      {/* Background */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-800/40 group">
        <ColorPickerPopover
          color={bgColor}
          onChange={handleBgColorChange}
          label="Background"
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-300 group-hover:text-gray-100 transition-colors">Background</div>
          <div className="text-[9px] text-gray-600">Card background fill</div>
        </div>
        <span className="text-[9px] text-gray-600 font-mono shrink-0 hidden group-hover:inline">
          {rgbaToHex(bgColor)}
        </span>
      </div>

      {/* Hint */}
      <p className="text-[9px] text-gray-700 px-2 pt-1">
        Click a label to select that layer on canvas · Click the swatch to change its color
      </p>
    </div>
  );
}
