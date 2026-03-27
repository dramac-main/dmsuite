// =============================================================================
// Worksheet Designer Layers Panel — Figma-style collapsible layer tree
// Shows document structure: header, sections, elements, footer
// =============================================================================

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useWorksheetEditor } from "@/stores/worksheet-editor";
import { ELEMENT_TYPE_CONFIGS } from "@/lib/worksheet/schema";
import { SIcon } from "@/components/workspaces/shared/WorkspaceUIKit";

// ---------------------------------------------------------------------------
// Layer interface
// ---------------------------------------------------------------------------

interface Layer {
  id: string;
  label: string;
  section: string; // data-ws-section value for canvas highlighting
  icon: string;
  visible: boolean;
  toggleKey?: string;
  children?: Layer[];
}

// ---------------------------------------------------------------------------
// Build layers from the store
// ---------------------------------------------------------------------------

function useLayers(): Layer[] {
  const form = useWorksheetEditor((s) => s.form);

  return useMemo(() => {
    const layers: Layer[] = [];

    // Header
    layers.push({
      id: "header",
      label: "Document Header",
      section: "header",
      icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z",
      visible: true,
    });

    // Instructions
    if (form.style.showInstructions && form.instructions) {
      layers.push({
        id: "instructions",
        label: "Instructions",
        section: "instructions",
        icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        visible: true,
        toggleKey: "style:showInstructions",
      });
    }

    // Sections with element children
    form.sections.forEach((s, sIdx) => {
      const children: Layer[] = s.elements.map((el) => ({
        id: `element-${s.id}-${el.id}`,
        label: el.label || ELEMENT_TYPE_CONFIGS[el.type].label,
        section: `element-${s.id}-${el.id}`,
        icon: ELEMENT_TYPE_CONFIGS[el.type].icon,
        visible: s.visible,
      }));

      layers.push({
        id: s.id,
        label: s.title || `Section ${sIdx + 1}`,
        section: `section-${sIdx}`,
        icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
        visible: s.visible,
        toggleKey: `section:${s.id}`,
        children: children.length > 0 ? children : undefined,
      });
    });

    // Footer (page numbers)
    layers.push({
      id: "footer",
      label: "Page Numbers",
      section: "footer",
      icon: "M7 20l4-16m2 16l4-16M6 9h14M4 15h14",
      visible: form.style.showPageNumbers,
      toggleKey: "style:showPageNumbers",
    });

    return layers;
  }, [form]);
}

// ---------------------------------------------------------------------------
// Toggle visibility dispatcher
// ---------------------------------------------------------------------------

function useToggleVisibility() {
  const toggleSectionVisibility = useWorksheetEditor((s) => s.toggleSectionVisibility);
  const updateStyle = useWorksheetEditor((s) => s.updateStyle);
  const form = useWorksheetEditor((s) => s.form);

  return useCallback(
    (toggleKey: string) => {
      if (toggleKey.startsWith("section:")) {
        const id = toggleKey.replace("section:", "");
        toggleSectionVisibility(id);
      } else if (toggleKey.startsWith("style:")) {
        const key = toggleKey.replace("style:", "") as keyof typeof form.style;
        const current = form.style[key];
        if (typeof current === "boolean") {
          updateStyle({ [key]: !current });
        }
      }
    },
    [toggleSectionVisibility, updateStyle, form],
  );
}

// ---------------------------------------------------------------------------
// Layer Row Component
// ---------------------------------------------------------------------------

function LayerRow({
  layer,
  depth = 0,
  onHover,
  onClick,
  expanded,
  onToggleExpand,
  onToggleVisibility,
}: {
  layer: Layer;
  depth?: number;
  onHover: (section: string | null) => void;
  onClick: (section: string) => void;
  expanded: boolean;
  onToggleExpand?: () => void;
  onToggleVisibility: (toggleKey: string) => void;
}) {
  const hasChildren = layer.children && layer.children.length > 0;

  return (
    <>
      <div
        className="group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-primary-500/12 transition-colors"
        style={{ paddingLeft: 8 + depth * 14 }}
        onMouseEnter={() => onHover(layer.section)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick(layer.section)}
      >
        {/* Expand / Collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
            className="w-3.5 h-3.5 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
          >
            <SIcon d={expanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        {/* Icon */}
        <span className="w-3.5 h-3.5 text-gray-500 shrink-0"><SIcon d={layer.icon} /></span>

        {/* Label */}
        <span className={`text-[11px] truncate flex-1 ${layer.visible ? "text-gray-300" : "text-gray-600 line-through"}`}>
          {layer.label}
        </span>

        {/* Visibility Dot */}
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${layer.visible ? "bg-primary-400/80" : "bg-gray-600/40"}`} />

        {/* Eye Toggle (on hover) */}
        {layer.toggleKey && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.toggleKey!); }}
            className="hidden group-hover:flex w-4 h-4 items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
            title={layer.visible ? "Hide" : "Show"}
          >
            <SIcon
              d={layer.visible
                ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              }
            />
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && layer.children!.map((child) => (
        <LayerRow
          key={child.id}
          layer={child}
          depth={depth + 1}
          onHover={onHover}
          onClick={onClick}
          expanded={false}
          onToggleVisibility={onToggleVisibility}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Panel Component
// ---------------------------------------------------------------------------

interface WorksheetLayersPanelProps {
  onOpenSection: (section: string) => void;
  onHoverSection: (section: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function WorksheetLayersPanel({
  onOpenSection,
  onHoverSection,
  collapsed,
  onToggleCollapse,
}: WorksheetLayersPanelProps) {
  const layers = useLayers();
  const toggleVisibility = useToggleVisibility();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const visibleCount = layers.filter((l) => l.visible).length;
  const totalCount = layers.length;

  if (collapsed) {
    return (
      <div className="w-8 flex flex-col items-center py-4 border-l border-gray-800/50 bg-gray-900/50">
        <button
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          title="Expand layers"
        >
          <SIcon d="M15 19l-7-7 7-7" />
        </button>
        <span
          className="text-[10px] text-gray-600 font-medium mt-4"
          style={{ writingMode: "vertical-lr" }}
        >
          Layers
        </span>
      </div>
    );
  }

  return (
    <div className="w-56 flex flex-col border-l border-gray-800/50 bg-gray-900/50">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <SIcon d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          <span className="text-xs font-semibold text-gray-300">Layers</span>
          <span className="text-[10px] text-gray-600">{visibleCount}/{totalCount}</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          title="Collapse"
        >
          <SIcon d="M9 5l7 7-7 7" />
        </button>
      </div>

      {/* Layer Tree */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {layers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            onHover={onHoverSection}
            onClick={onOpenSection}
            expanded={expanded[layer.id] ?? false}
            onToggleExpand={() => toggleExpand(layer.id)}
            onToggleVisibility={toggleVisibility}
          />
        ))}
      </div>

      {/* Footer legend */}
      <div className="px-3 py-2 border-t border-gray-800/50 flex items-center gap-3 text-[10px] text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-400/80" />
          Visible
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-600/40" />
          Hidden
        </span>
      </div>
    </div>
  );
}
