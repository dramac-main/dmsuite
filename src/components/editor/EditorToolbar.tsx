"use client";

// =============================================================================
// DMSuite — Editor Toolbar
// Top-of-canvas toolbar with mode selection, undo/redo, zoom, alignment,
// and viewport toggles.
// =============================================================================

import React from "react";
import { useEditorStore, type InteractionMode } from "@/stores/editor";
import AlignDistributeBar from "./AlignDistributeBar";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditorToolbar() {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const canUndoVal = useEditorStore((s) => s.canUndo());
  const canRedoVal = useEditorStore((s) => s.canRedo());
  const undoCmd = useEditorStore((s) => s.undoCmd);
  const redoCmd = useEditorStore((s) => s.redoCmd);
  const zoom = useEditorStore((s) => s.viewport.zoom);
  const zoomIn = useEditorStore((s) => s.zoomIn);
  const zoomOut = useEditorStore((s) => s.zoomOut);
  const zoomTo = useEditorStore((s) => s.zoomTo);
  const showGrid = useEditorStore((s) => s.viewport.showGrid);
  const showGuides = useEditorStore((s) => s.viewport.showGuides);
  const snapEnabled = useEditorStore((s) => s.viewport.snapEnabled);
  const setViewport = useEditorStore((s) => s.setViewport);
  const selCount = useEditorStore((s) => s.doc.selection.ids.length);

  const tools: Array<{ mode: InteractionMode; icon: string; label: string; shortcut: string }> = [
    { mode: "select", icon: "↖", label: "Select", shortcut: "V" },
    { mode: "hand", icon: "✋", label: "Pan", shortcut: "H" },
    { mode: "text", icon: "T", label: "Text", shortcut: "T" },
    { mode: "shape", icon: "□", label: "Shape", shortcut: "R" },
    { mode: "draw", icon: "✎", label: "Draw", shortcut: "P" },
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-900 border-b border-gray-800 select-none">
      {/* Mode tools */}
      <div className="flex items-center gap-0.5 mr-2">
        {tools.map((t) => (
          <ToolBtn
            key={t.mode}
            active={mode === t.mode}
            onClick={() => setMode(t.mode)}
            title={`${t.label} (${t.shortcut})`}
          >
            {t.icon}
          </ToolBtn>
        ))}
      </div>

      <Separator />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 mr-2">
        <ToolBtn
          onClick={undoCmd}
          disabled={!canUndoVal}
          title="Undo (Ctrl+Z)"
        >
          ↩
        </ToolBtn>
        <ToolBtn
          onClick={redoCmd}
          disabled={!canRedoVal}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↪
        </ToolBtn>
      </div>

      <Separator />

      {/* Zoom */}
      <div className="flex items-center gap-1 mr-2">
        <ToolBtn onClick={zoomOut} title="Zoom Out">−</ToolBtn>
        <button
          onClick={() => zoomTo(1)}
          className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 hover:text-gray-200 rounded hover:bg-gray-800 transition-colors min-w-10 text-center"
          title="Reset to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <ToolBtn onClick={zoomIn} title="Zoom In">+</ToolBtn>
      </div>

      <Separator />

      {/* Align / Distribute (contextual — visible when selection exists) */}
      {selCount >= 1 && (
        <>
          <AlignDistributeBar />
          <Separator />
        </>
      )}

      {/* View toggles */}
      <div className="flex items-center gap-0.5">
        <ToggleBtn
          active={showGrid}
          onClick={() => setViewport({ showGrid: !showGrid })}
          title="Toggle Grid"
        >
          #
        </ToggleBtn>
        <ToggleBtn
          active={showGuides}
          onClick={() => setViewport({ showGuides: !showGuides })}
          title="Toggle Guides"
        >
          ⊞
        </ToggleBtn>
        <ToggleBtn
          active={snapEnabled}
          onClick={() => setViewport({ snapEnabled: !snapEnabled })}
          title="Toggle Snap"
        >
          ⊡
        </ToggleBtn>
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable buttons
// ---------------------------------------------------------------------------

function ToolBtn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors
        ${active ? "bg-primary-500/20 text-primary-400" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

function ToggleBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors ${
        active
          ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
          : "text-gray-500 hover:text-gray-300 hover:bg-gray-800 border border-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-gray-800 mx-1" />;
}
