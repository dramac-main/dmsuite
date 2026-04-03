"use client";

// =============================================================================
// DMSuite — AI Flow Builder — Node Palette Sidebar
// Draggable node type list organized by category.
// =============================================================================

import React, { useState, useCallback } from "react";
import { getNodesByCategory } from "@/lib/ai-flow-builder/node-registry";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/flow-builder";
import type { FlowNodeCategory, FlowNodeDefinition } from "@/types/flow-builder";
import { FLOW_TEMPLATES } from "@/data/ai-flow-builder-templates";
import type { SavedFlow } from "@/types/flow-builder";

interface NodePaletteProps {
  onLoadTemplate: (flow: SavedFlow) => void;
}

const CATEGORIES: FlowNodeCategory[] = [
  "inputs", "outputs", "models", "prompts", "processing", "memory", "agents", "tools",
];

function DraggableNodeItem({ def }: { def: FlowNodeDefinition }) {
  const onDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("application/flow-node-type", def.type);
      e.dataTransfer.effectAllowed = "move";
    },
    [def.type]
  );

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-grab active:cursor-grabbing bg-gray-800/40 hover:bg-gray-700/50 border border-gray-700/30 hover:border-gray-600/50 transition-all group"
    >
      <span className="text-xs shrink-0">{def.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-gray-300 group-hover:text-gray-100 truncate">
          {def.name}
        </div>
      </div>
    </div>
  );
}

export default function NodePalette({ onLoadTemplate }: NodePaletteProps) {
  const [tab, setTab] = useState<"nodes" | "templates">("nodes");
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<FlowNodeCategory>>(
    new Set(["inputs", "models"])
  );

  const nodesByCategory = getNodesByCategory();

  const toggleCategory = useCallback((cat: FlowNodeCategory) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const filteredNodesByCategory = CATEGORIES.reduce((acc, cat) => {
    const nodes = nodesByCategory[cat] ?? [];
    const filtered = search
      ? nodes.filter(
          (n) =>
            n.name.toLowerCase().includes(search.toLowerCase()) ||
            n.description.toLowerCase().includes(search.toLowerCase())
        )
      : nodes;
    if (filtered.length > 0) acc[cat] = filtered;
    return acc;
  }, {} as Record<FlowNodeCategory, FlowNodeDefinition[]>);

  return (
    <div className="flex flex-col h-full bg-gray-900/30">
      {/* ── Tabs ── */}
      <div className="shrink-0 flex border-b border-gray-800/40">
        <button
          onClick={() => setTab("nodes")}
          className={`flex-1 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
            tab === "nodes"
              ? "text-primary-400 border-b-2 border-primary-500"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Components
        </button>
        <button
          onClick={() => setTab("templates")}
          className={`flex-1 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
            tab === "templates"
              ? "text-primary-400 border-b-2 border-primary-500"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Templates
        </button>
      </div>

      {tab === "nodes" && (
        <>
          {/* ── Search ── */}
          <div className="shrink-0 px-3 py-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components..."
              className="w-full px-2.5 py-1.5 text-xs bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>

          {/* ── Category list ── */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
            {Object.entries(filteredNodesByCategory).map(([cat, nodes]) => (
              <div key={cat} className="mb-1">
                <button
                  onClick={() => toggleCategory(cat as FlowNodeCategory)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[cat as FlowNodeCategory] }}
                  />
                  <span className="flex-1 text-left">
                    {CATEGORY_LABELS[cat as FlowNodeCategory]}
                  </span>
                  <span className="text-gray-600 text-[10px]">{nodes.length}</span>
                  <svg
                    className={`w-3 h-3 transition-transform ${
                      expandedCats.has(cat as FlowNodeCategory) ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {(search || expandedCats.has(cat as FlowNodeCategory)) && (
                  <div className="flex flex-col gap-1 pl-1 pb-1">
                    {nodes.map((def) => (
                      <DraggableNodeItem key={def.type} def={def} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {Object.keys(filteredNodesByCategory).length === 0 && (
              <div className="text-center text-gray-500 text-xs py-8">
                No components match &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </>
      )}

      {tab === "templates" && (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin">
          {FLOW_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => onLoadTemplate(template)}
              className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-800/40 border border-gray-700/30 hover:border-primary-500/40 hover:bg-gray-800/60 transition-all group"
            >
              <div className="text-xs font-medium text-gray-200 group-hover:text-primary-300 mb-0.5">
                {template.name}
              </div>
              <div className="text-[10px] text-gray-500 leading-relaxed">
                {template.description}
              </div>
              <div className="text-[10px] text-gray-600 mt-1">
                {template.nodes.length} nodes · {template.edges.length} connections
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
