"use client";

// =============================================================================
// DMSuite — Layers List Panel (Rebuilt — Phase C.3)
// Displays all layers with SVG type icons, color swatches, visibility/lock
// toggles, reorder arrows, and delete button on hover.
// =============================================================================

import React, { useCallback, useState } from "react";
import { useEditorStore } from "@/stores/editor";
import type { LayerV2, LayerId, TextLayerV2, ShapeLayerV2, IconLayerV2 } from "@/lib/editor/schema";
import { getLayerOrder, rgbaToHex } from "@/lib/editor/schema";
import {
  IconEye, IconEyeOff, IconLock, IconLockOpen,
  IconTrash, IconChevronUp, IconChevronDown,
  IconType, IconImage, IconStar, IconPenTool, IconFolder, IconLayers,
} from "@/components/icons";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LayersListPanel() {
  const doc = useEditorStore((s) => s.doc);
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const updateLayerInDoc = useEditorStore((s) => s.updateLayerInDoc);
  const reorderLayerInDoc = useEditorStore((s) => s.reorderLayerInDoc);
  const removeLayersFromDoc = useEditorStore((s) => s.removeLayersFromDoc);
  const selectedIds = doc.selection.ids;

  // Get layers in render order: [0]=behind, [last]=on top (root frame excluded)
  const layers = getLayerOrder(doc).filter((l) => l.id !== doc.rootFrameId);
  // Reverse so topmost layer (last rendered = visually on top) appears first in the panel
  const reversedLayers = [...layers].reverse();

  const handleSelect = useCallback(
    (id: LayerId, e: React.MouseEvent) => {
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        const newIds = selectedIds.includes(id)
          ? selectedIds.filter((sid) => sid !== id)
          : [...selectedIds, id];
        selectLayers(newIds);
      } else {
        selectLayers([id]);
      }
    },
    [selectedIds, selectLayers]
  );

  return (
    <div className="flex flex-col text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
          Layers
        </h3>
        <span className="text-[10px] text-gray-600 font-mono">{layers.length}</span>
      </div>
      <div className="flex flex-col overflow-y-auto max-h-64">
        {reversedLayers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            isSelected={selectedIds.includes(layer.id)}
            onClick={(e) => handleSelect(layer.id, e)}
            onToggleVisible={() =>
              updateLayerInDoc(layer.id, { visible: !layer.visible })
            }
            onToggleLock={() =>
              updateLayerInDoc(layer.id, { locked: !layer.locked })
            }
            onMoveUp={() => reorderLayerInDoc(layer.id, "up")}
            onMoveDown={() => reorderLayerInDoc(layer.id, "down")}
            onDelete={() => removeLayersFromDoc([layer.id])}
          />
        ))}
        {layers.length === 0 && (
          <div className="px-3 py-6 text-gray-600 text-center text-xs">
            No layers yet
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers: extract the "primary" display color from a layer
// ---------------------------------------------------------------------------

function getLayerSwatchColor(layer: LayerV2): string | null {
  if (layer.type === "text") {
    const fill = (layer as TextLayerV2).defaultStyle.fill;
    if (fill.kind === "solid") return rgbaToHex(fill.color);
  }
  if (layer.type === "shape") {
    const fill = (layer as ShapeLayerV2).fills?.[0];
    if (fill?.kind === "solid") return rgbaToHex(fill.color);
  }
  if (layer.type === "icon") {
    return rgbaToHex((layer as IconLayerV2).color);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Layer Type Icon — SVG (not emoji)
// ---------------------------------------------------------------------------

function LayerTypeIcon({ type }: { type: string }) {
  const cls = "w-3.5 h-3.5 text-gray-500";
  switch (type) {
    case "text":
      return <IconType className={cls} />;
    case "shape":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
        </svg>
      );
    case "image":
      return <IconImage className={cls} />;
    case "icon":
      return <IconStar className={cls} />;
    case "path":
      return <IconPenTool className={cls} />;
    case "frame":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      );
    case "group":
      return <IconFolder className={cls} />;
    case "boolean-group":
      return <IconLayers className={cls} />;
    default:
      return <span className="w-3.5 h-3.5 text-gray-600 text-[10px] flex items-center justify-center">?</span>;
  }
}

// ---------------------------------------------------------------------------
// Layer Row
// ---------------------------------------------------------------------------

function LayerRow({
  layer,
  isSelected,
  onClick,
  onToggleVisible,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  layer: LayerV2;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onToggleVisible: () => void;
  onToggleLock: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const swatchColor = getLayerSwatchColor(layer);

  const dimClass = !layer.visible ? "opacity-40" : layer.locked ? "opacity-60" : "";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer border-l-2 transition-colors ${dimClass} ${
        isSelected
          ? "bg-primary-500/10 border-l-primary-500 text-gray-200"
          : "border-l-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
      }`}
    >
      {/* Drag handle */}
      <span className="w-3 flex-shrink-0 flex items-center justify-center text-gray-600 cursor-grab">
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
          <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
        </svg>
      </span>

      {/* Reorder arrows (visible on hover) */}
      {hovered && (
        <div className="flex flex-col gap-0 flex-shrink-0">
          <button
            title="Move Up"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            className="w-3 h-3 flex items-center justify-center text-gray-500 hover:text-gray-200 transition-colors"
          >
            <IconChevronUp className="w-3 h-3" />
          </button>
          <button
            title="Move Down"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            className="w-3 h-3 flex items-center justify-center text-gray-500 hover:text-gray-200 transition-colors"
          >
            <IconChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Type icon */}
      <span className="flex-shrink-0">
        <LayerTypeIcon type={layer.type} />
      </span>

      {/* Color swatch */}
      {swatchColor ? (
        <span
          className="w-3 h-3 rounded-sm shrink-0 border border-gray-700/50"
          style={{ backgroundColor: swatchColor }}
          title={swatchColor}
        />
      ) : (
        <span className="w-3 h-3 shrink-0" />
      )}

      {/* Name + text preview */}
      <span className={`flex-1 truncate text-xs ${!layer.visible ? "line-through" : ""}`}>
        {layer.name}
        {layer.type === "text" && (layer as TextLayerV2).text && (
          <span className="ml-1 text-gray-600 truncate">
            — {(layer as TextLayerV2).text.substring(0, 18)}
          </span>
        )}
      </span>

      {/* Controls — always show visibility/lock, delete on hover */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Delete button (hover only) */}
        {hovered && (
          <MiniBtn
            title="Delete layer"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <IconTrash className="w-3 h-3 text-red-400/70 hover:text-red-400" />
          </MiniBtn>
        )}

        {/* Visibility toggle */}
        <MiniBtn
          title={layer.visible ? "Hide" : "Show"}
          onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}
        >
          {layer.visible
            ? <IconEye className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
            : <IconEyeOff className="w-3.5 h-3.5 opacity-30 hover:opacity-60" />
          }
        </MiniBtn>

        {/* Lock toggle */}
        <MiniBtn
          title={layer.locked ? "Unlock" : "Lock"}
          onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
        >
          {layer.locked
            ? <IconLock className="w-3.5 h-3.5 opacity-60 hover:opacity-100 text-yellow-500/70" />
            : <IconLockOpen className="w-3.5 h-3.5 opacity-30 hover:opacity-60" />
          }
        </MiniBtn>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini button
// ---------------------------------------------------------------------------

function MiniBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-gray-700/50"
    >
      {children}
    </button>
  );
}
