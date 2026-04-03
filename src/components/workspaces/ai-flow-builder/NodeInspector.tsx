"use client";

// =============================================================================
// DMSuite — AI Flow Builder — Node Inspector Panel
// Configuration panel for the currently selected node.
// =============================================================================

import React, { useCallback } from "react";
import { useAIFlowBuilderEditor } from "@/stores/ai-flow-builder-editor";
import { CATEGORY_LABELS } from "@/types/flow-builder";

export default function NodeInspector() {
  const nodes = useAIFlowBuilderEditor((s) => s.form.nodes);
  const selectedNodeId = useAIFlowBuilderEditor((s) => s.form.selectedNodeId);
  const updateNodeParam = useAIFlowBuilderEditor((s) => s.updateNodeParam);
  const updateNodeLabel = useAIFlowBuilderEditor((s) => s.updateNodeLabel);
  const removeNode = useAIFlowBuilderEditor((s) => s.removeNode);
  const duplicateNode = useAIFlowBuilderEditor((s) => s.duplicateNode);
  const toggleNodeFrozen = useAIFlowBuilderEditor((s) => s.toggleNodeFrozen);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const handleParamChange = useCallback(
    (key: string, value: string | number | boolean) => {
      if (selectedNodeId) {
        updateNodeParam(selectedNodeId, key, value);
      }
    },
    [selectedNodeId, updateNodeParam]
  );

  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="text-2xl mb-2 opacity-40">🔧</div>
        <div className="text-xs text-gray-500">
          Select a node to configure its properties
        </div>
      </div>
    );
  }

  const { data } = selectedNode;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="shrink-0 px-3 py-2.5 border-b border-gray-800/40">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm">{data.icon}</span>
          <input
            type="text"
            value={data.label}
            onChange={(e) =>
              selectedNodeId && updateNodeLabel(selectedNodeId, e.target.value)
            }
            className="flex-1 text-xs font-semibold text-gray-200 bg-transparent border-b border-transparent hover:border-gray-600 focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span>{CATEGORY_LABELS[data.category]}</span>
          <span>·</span>
          <span>{data.definitionType}</span>
        </div>
      </div>

      {/* ── Params ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin">
        {data.params.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-4">
            No configurable parameters
          </div>
        )}

        {data.params.map((param) => (
          <div key={param.key}>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">
              {param.label}
              {param.description && (
                <span className="ml-1 text-[10px] text-gray-600 font-normal">
                  — {param.description}
                </span>
              )}
            </label>

            {param.type === "text" && (
              <input
                type="text"
                value={String(data.paramValues[param.key] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
                placeholder={param.placeholder}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary-500/50 transition-colors"
              />
            )}

            {param.type === "textarea" && (
              <textarea
                value={String(data.paramValues[param.key] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
                placeholder={param.placeholder}
                rows={3}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary-500/50 resize-y transition-colors"
              />
            )}

            {param.type === "number" && (
              <input
                type="number"
                value={Number(data.paramValues[param.key] ?? param.defaultValue)}
                onChange={(e) => handleParamChange(param.key, Number(e.target.value))}
                min={param.min}
                max={param.max}
                step={param.step ?? 1}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/50 transition-colors"
              />
            )}

            {param.type === "select" && (
              <select
                value={String(data.paramValues[param.key] ?? param.defaultValue)}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-300 focus:outline-none focus:border-primary-500/50 transition-colors"
              >
                {param.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {param.type === "boolean" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(data.paramValues[param.key] ?? param.defaultValue)}
                  onChange={(e) => handleParamChange(param.key, e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30"
                />
                <span className="text-xs text-gray-400">
                  {data.paramValues[param.key] ? "Enabled" : "Disabled"}
                </span>
              </label>
            )}

            {param.type === "slider" && (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  value={Number(data.paramValues[param.key] ?? param.defaultValue)}
                  onChange={(e) => handleParamChange(param.key, Number(e.target.value))}
                  min={param.min ?? 0}
                  max={param.max ?? 1}
                  step={param.step ?? 0.1}
                  className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <span className="text-[11px] text-gray-400 w-8 text-right tabular-nums">
                  {Number(data.paramValues[param.key] ?? param.defaultValue).toFixed(1)}
                </span>
              </div>
            )}

            {param.type === "json" && (
              <textarea
                value={String(data.paramValues[param.key] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
                placeholder={param.placeholder}
                rows={4}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary-500/50 resize-y transition-colors"
              />
            )}
          </div>
        ))}

        {/* ── Output preview ── */}
        {data.lastOutput && (
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">
              Last Output
            </label>
            <div className="px-2.5 py-1.5 text-xs bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-400 max-h-32 overflow-y-auto font-mono">
              {data.lastOutput}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {data.hasError && data.errorMessage && (
          <div>
            <label className="block text-[11px] font-medium text-red-400 mb-1">
              Error
            </label>
            <div className="px-2.5 py-1.5 text-xs bg-red-900/20 border border-red-800/30 rounded-lg text-red-300">
              {data.errorMessage}
            </div>
          </div>
        )}

        {/* ── Port info ── */}
        <div>
          <label className="block text-[11px] font-medium text-gray-400 mb-1">
            Ports
          </label>
          <div className="text-[10px] text-gray-500 space-y-0.5">
            {data.inputs.map((p) => (
              <div key={p.id} className="flex items-center gap-1">
                <span className="text-blue-400">←</span>
                <span>{p.name}</span>
                <span className="text-gray-600">({p.dataType})</span>
                {p.required && <span className="text-red-400">*</span>}
              </div>
            ))}
            {data.outputs.map((p) => (
              <div key={p.id} className="flex items-center gap-1">
                <span className="text-green-400">→</span>
                <span>{p.name}</span>
                <span className="text-gray-600">({p.dataType})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="shrink-0 px-3 py-2 border-t border-gray-800/40 flex gap-1.5">
        <button
          onClick={() => selectedNodeId && toggleNodeFrozen(selectedNodeId)}
          title={data.isFrozen ? "Unfreeze" : "Freeze"}
          className="flex-1 py-1.5 text-[10px] font-medium rounded-lg bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 transition-colors"
        >
          {data.isFrozen ? "❄️ Unfreeze" : "🔒 Freeze"}
        </button>
        <button
          onClick={() => selectedNodeId && duplicateNode(selectedNodeId)}
          title="Duplicate"
          className="flex-1 py-1.5 text-[10px] font-medium rounded-lg bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 transition-colors"
        >
          📋 Duplicate
        </button>
        <button
          onClick={() => selectedNodeId && removeNode(selectedNodeId)}
          title="Delete"
          className="flex-1 py-1.5 text-[10px] font-medium rounded-lg bg-red-900/20 text-red-400 hover:text-red-300 hover:bg-red-900/40 transition-colors"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
