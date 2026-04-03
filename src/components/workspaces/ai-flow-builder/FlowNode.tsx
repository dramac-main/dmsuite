"use client";

// =============================================================================
// DMSuite — AI Flow Builder — Custom Node Component
// Renders a single node on the ReactFlow canvas with typed handles,
// status indicators, and category coloring.
// =============================================================================

import React, { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData, PortDataType } from "@/types/flow-builder";
import { PORT_COLORS } from "@/types/flow-builder";

/** Tailwind-safe port colors for handles (using inline styles for dynamic colors) */
function getPortColor(dataType: PortDataType): string {
  return PORT_COLORS[dataType] ?? PORT_COLORS.any;
}

function FlowNodeComponent({ data, selected }: NodeProps & { data: FlowNodeData }) {
  const nodeData = data as unknown as FlowNodeData;
  const {
    label,
    icon,
    color,
    inputs,
    outputs,
    isRunning,
    isComplete,
    hasError,
    lastOutput,
    isFrozen,
  } = nodeData;

  // Status border
  const statusBorder = isRunning
    ? "ring-2 ring-amber-400 animate-pulse"
    : isComplete
    ? "ring-2 ring-emerald-400"
    : hasError
    ? "ring-2 ring-red-500"
    : selected
    ? "ring-2 ring-primary-500"
    : "ring-1 ring-gray-700/60";

  const frozenClass = isFrozen ? "opacity-50 grayscale" : "";

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className={`relative rounded-xl shadow-lg min-w-52 max-w-72 ${statusBorder} ${frozenClass} bg-gray-900 border border-gray-700/40 overflow-hidden transition-all`}
      onMouseDown={stopPropagation}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white"
        style={{ backgroundColor: color + "CC" }}
      >
        <span className="text-sm">{icon}</span>
        <span className="truncate flex-1">{label}</span>
        {isFrozen && <span className="text-[10px] opacity-70">❄️</span>}
        {isRunning && (
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        )}
        {isComplete && !isRunning && (
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
        )}
        {hasError && (
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
        )}
      </div>

      {/* ── Body: Port labels ── */}
      <div className="px-3 py-2 flex gap-4 justify-between text-[10px]">
        {/* Input ports */}
        <div className="flex flex-col gap-1.5">
          {inputs.map((port) => (
            <div key={port.id} className="flex items-center gap-1 text-gray-400">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: getPortColor(port.dataType) }}
              />
              <span className="truncate">{port.name}</span>
              {port.required && <span className="text-red-400">*</span>}
            </div>
          ))}
        </div>

        {/* Output ports */}
        <div className="flex flex-col gap-1.5 items-end">
          {outputs.map((port) => (
            <div key={port.id} className="flex items-center gap-1 text-gray-400">
              <span className="truncate">{port.name}</span>
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: getPortColor(port.dataType) }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Output preview ── */}
      {lastOutput && (
        <div className="px-3 pb-2">
          <div className="text-[10px] text-gray-500 bg-gray-800/60 rounded px-2 py-1 max-h-12 overflow-hidden">
            {lastOutput.slice(0, 120)}
            {lastOutput.length > 120 && "..."}
          </div>
        </div>
      )}

      {/* ── Error message ── */}
      {hasError && nodeData.errorMessage && (
        <div className="px-3 pb-2">
          <div className="text-[10px] text-red-400 bg-red-900/20 rounded px-2 py-1 max-h-10 overflow-hidden">
            {nodeData.errorMessage.slice(0, 100)}
          </div>
        </div>
      )}

      {/* ── Input Handles (left side) ── */}
      {inputs.map((port, idx) => (
        <Handle
          key={port.id}
          type="target"
          position={Position.Left}
          id={port.id}
          style={{
            top: `${44 + idx * 18}px`,
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: getPortColor(port.dataType),
            border: "2px solid #1f2937",
          }}
        />
      ))}

      {/* ── Output Handles (right side) ── */}
      {outputs.map((port, idx) => (
        <Handle
          key={port.id}
          type="source"
          position={Position.Right}
          id={port.id}
          style={{
            top: `${44 + idx * 18}px`,
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: getPortColor(port.dataType),
            border: "2px solid #1f2937",
          }}
        />
      ))}
    </div>
  );
}

export default memo(FlowNodeComponent);
