"use client";

// =============================================================================
// DMSuite — Layers List Panel
// Displays all layers in order with visibility/lock toggles and drag reorder.
// =============================================================================

import React, { useCallback } from "react";
import { useEditorStore } from "@/stores/editor";
import type { LayerV2, LayerId } from "@/lib/editor/schema";
import { getLayerOrder } from "@/lib/editor/schema";

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

  // Get layers in render order (root frame excluded)
  const layers = getLayerOrder(doc).filter((l) => l.id !== doc.rootFrameId);
  // Reverse so top layer (last rendered) appears first in the list
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
        <span className="text-gray-600">{layers.length}</span>
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
          <div className="px-3 py-4 text-gray-600 text-center">
            No layers yet
          </div>
        )}
      </div>
    </div>
  );
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
  const typeIcon: Record<string, string> = {
    text: "T",
    shape: "□",
    image: "🖼",
    icon: "★",
    path: "✎",
    frame: "▢",
    group: "▣",
    "boolean-group": "⊕",
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer border-l-2 transition-colors ${
        isSelected
          ? "bg-primary-500/10 border-l-primary-500 text-gray-200"
          : "border-l-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
      }`}
    >
      {/* Type icon */}
      <span className="w-4 text-center text-gray-500 text-[10px] shrink-0">
        {typeIcon[layer.type] ?? "?"}
      </span>

      {/* Name */}
      <span className="flex-1 truncate text-xs">
        {layer.name}
        {layer.type === "text" && (
          <span className="ml-1 text-gray-600 truncate">
            — {(layer as { text?: string }).text?.substring(0, 20)}
          </span>
        )}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-0.5 shrink-0">
        <MiniBtn
          title={layer.visible ? "Hide" : "Show"}
          onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}
          active={layer.visible}
        >
          {layer.visible ? "👁" : "👁‍🗨"}
        </MiniBtn>
        <MiniBtn
          title={layer.locked ? "Unlock" : "Lock"}
          onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
          active={layer.locked}
        >
          {layer.locked ? "🔒" : "🔓"}
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
  active,
  children,
}: {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-5 h-5 flex items-center justify-center rounded text-[10px] transition-opacity ${
        active ? "opacity-60 hover:opacity-100" : "opacity-30 hover:opacity-60"
      }`}
    >
      {children}
    </button>
  );
}
