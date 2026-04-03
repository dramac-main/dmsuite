"use client";

// =============================================================================
// DMSuite — AI Flow Builder Workspace
// Visual AI workflow builder inspired by Langflow. Drag-drop node canvas,
// component palette, node inspector, and playground chat for testing flows.
// =============================================================================

import React, { useState, useCallback, useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useAIFlowBuilderEditor } from "@/stores/ai-flow-builder-editor";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createAIFlowBuilderManifest } from "@/lib/chiko/manifests/ai-flow-builder";
import type { SavedFlow } from "@/types/flow-builder";
import FlowCanvas from "./FlowCanvas";
import NodePalette from "./NodePalette";
import NodeInspector from "./NodeInspector";
import PlaygroundChat from "./PlaygroundChat";

type MobileView = "palette" | "canvas" | "inspector" | "playground";
type RightPanel = "inspector" | "playground";

export default function AIFlowBuilderWorkspace() {
  const [mobileView, setMobileView] = useState<MobileView>("canvas");
  const [rightPanel, setRightPanel] = useState<RightPanel>("inspector");
  const [showPalette, setShowPalette] = useState(true);
  const hasDispatchedRef = useRef(false);

  const flowName = useAIFlowBuilderEditor((s) => s.form.flowName);
  const setFlowName = useAIFlowBuilderEditor((s) => s.setFlowName);
  const nodes = useAIFlowBuilderEditor((s) => s.form.nodes);
  const edges = useAIFlowBuilderEditor((s) => s.form.edges);
  const isExecuting = useAIFlowBuilderEditor((s) => s.form.isExecuting);
  const loadFlow = useAIFlowBuilderEditor((s) => s.loadFlow);
  const saveCurrentFlow = useAIFlowBuilderEditor((s) => s.saveCurrentFlow);
  const clearCanvas = useAIFlowBuilderEditor((s) => s.clearCanvas);
  const clearNodeStatuses = useAIFlowBuilderEditor((s) => s.clearNodeStatuses);

  // ── Chiko Integration ──
  useChikoActions(
    useCallback(() => createAIFlowBuilderManifest(useAIFlowBuilderEditor), [])
  );

  // ── Initial workspace event ──
  useEffect(() => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;
    if (nodes.length > 0) {
      window.dispatchEvent(
        new CustomEvent("workspace:progress", { detail: { milestone: "content" } })
      );
    }
  }, [nodes.length]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Z / Ctrl+Y for undo/redo
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useAIFlowBuilderEditor.temporal.getState().undo();
      }
      if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "z")) {
        e.preventDefault();
        useAIFlowBuilderEditor.temporal.getState().redo();
      }
      // Ctrl+S to save flow
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSaveFlow();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──
  const handleLoadTemplate = useCallback(
    (flow: SavedFlow) => {
      loadFlow(flow);
      clearNodeStatuses();
      window.dispatchEvent(new CustomEvent("workspace:dirty"));
      window.dispatchEvent(
        new CustomEvent("workspace:progress", { detail: { milestone: "input" } })
      );
    },
    [loadFlow, clearNodeStatuses]
  );

  const handleSaveFlow = useCallback(() => {
    saveCurrentFlow();
    window.dispatchEvent(new CustomEvent("workspace:save"));
    window.dispatchEvent(
      new CustomEvent("workspace:progress", { detail: { milestone: "exported" } })
    );
  }, [saveCurrentFlow]);

  const handleExportJSON = useCallback(() => {
    const flow = saveCurrentFlow();
    const json = JSON.stringify(flow, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${flowName.replace(/\s+/g, "-").toLowerCase()}.flow.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.dispatchEvent(new CustomEvent("workspace:save"));
    window.dispatchEvent(
      new CustomEvent("workspace:progress", { detail: { milestone: "exported" } })
    );
  }, [saveCurrentFlow, flowName]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const flow = JSON.parse(text) as SavedFlow;
        if (flow.nodes && flow.edges) {
          loadFlow(flow);
          window.dispatchEvent(new CustomEvent("workspace:dirty"));
        }
      } catch {
        // Invalid JSON
      }
    };
    input.click();
  }, [loadFlow]);

  const handleClear = useCallback(() => {
    clearCanvas();
    clearNodeStatuses();
  }, [clearCanvas, clearNodeStatuses]);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-full w-full overflow-hidden bg-gray-950">
        {/* ── Top Toolbar ── */}
        <div className="shrink-0 flex items-center justify-between h-11 px-3 border-b border-gray-800/40 bg-gray-900/30">
          {/* Left: Flow name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
            <input
              type="text"
              value={flowName}
              onChange={(e) => {
                setFlowName(e.target.value);
                window.dispatchEvent(new CustomEvent("workspace:dirty"));
              }}
              className="text-xs font-semibold text-gray-200 bg-transparent border-b border-transparent hover:border-gray-600 focus:border-primary-500 focus:outline-none transition-colors max-w-48"
            />
            <span className="text-[10px] text-gray-600">
              {nodes.length} nodes · {edges.length} edges
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => useAIFlowBuilderEditor.temporal.getState().undo()}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors text-xs"
              >
                ↩
              </button>
              <button
                onClick={() => useAIFlowBuilderEditor.temporal.getState().redo()}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors text-xs"
              >
                ↪
              </button>
              <div className="w-px h-4 bg-gray-700/50 mx-1" />
              <button
                onClick={handleImportJSON}
                title="Import Flow"
                className="px-2 py-1 rounded-lg text-[10px] font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
              >
                📥 Import
              </button>
              <button
                onClick={handleExportJSON}
                title="Export Flow"
                className="px-2 py-1 rounded-lg text-[10px] font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
              >
                📤 Export
              </button>
              <button
                onClick={handleSaveFlow}
                title="Save Flow (Ctrl+S)"
                className="px-2 py-1 rounded-lg text-[10px] font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
              >
                💾 Save
              </button>
              <button
                onClick={handleClear}
                title="Clear Canvas"
                className="px-2 py-1 rounded-lg text-[10px] font-medium text-gray-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                🗑️ Clear
              </button>
            </div>

            {/* Toggle panels */}
            <div className="hidden lg:flex items-center gap-1 ml-2">
              <button
                onClick={() => setShowPalette(!showPalette)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  showPalette
                    ? "text-primary-400 bg-primary-500/10"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Components
              </button>
              <button
                onClick={() => setRightPanel("inspector")}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  rightPanel === "inspector"
                    ? "text-primary-400 bg-primary-500/10"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Inspector
              </button>
              <button
                onClick={() => setRightPanel("playground")}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  rightPanel === "playground"
                    ? "text-primary-400 bg-primary-500/10"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Playground
                {isExecuting && (
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 flex overflow-hidden">
          {/* ── Left: Node Palette (Desktop) ── */}
          {showPalette && (
            <div
              className={`w-56 xl:w-64 shrink-0 border-r border-gray-800/40 hidden lg:flex flex-col`}
            >
              <NodePalette onLoadTemplate={handleLoadTemplate} />
            </div>
          )}

          {/* ── Left: Node Palette (Mobile) ── */}
          <div
            className={`flex-1 flex flex-col lg:hidden ${
              mobileView !== "palette" ? "hidden" : ""
            }`}
          >
            <NodePalette onLoadTemplate={handleLoadTemplate} />
          </div>

          {/* ── Center: Canvas ── */}
          <div
            className={`flex-1 min-w-0 ${
              mobileView !== "canvas" ? "hidden lg:block" : ""
            }`}
          >
            <FlowCanvas />
          </div>

          {/* ── Right Panel (Desktop) ── */}
          <div className="w-64 xl:w-72 shrink-0 border-l border-gray-800/40 hidden lg:flex flex-col">
            {rightPanel === "inspector" ? (
              <NodeInspector />
            ) : (
              <PlaygroundChat />
            )}
          </div>

          {/* ── Right: Inspector (Mobile) ── */}
          <div
            className={`flex-1 flex flex-col lg:hidden ${
              mobileView !== "inspector" ? "hidden" : ""
            }`}
          >
            <NodeInspector />
          </div>

          {/* ── Right: Playground (Mobile) ── */}
          <div
            className={`flex-1 flex flex-col lg:hidden ${
              mobileView !== "playground" ? "hidden" : ""
            }`}
          >
            <PlaygroundChat />
          </div>
        </div>

        {/* ── Mobile Bottom Nav ── */}
        <div className="shrink-0 flex lg:hidden border-t border-gray-800/40 bg-gray-900/50">
          {(
            [
              { key: "palette", label: "Components", icon: "📦" },
              { key: "canvas", label: "Canvas", icon: "🎨" },
              { key: "inspector", label: "Inspector", icon: "🔧" },
              { key: "playground", label: "Chat", icon: "💬" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setMobileView(item.key)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                mobileView === item.key
                  ? "text-primary-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </ReactFlowProvider>
  );
}
