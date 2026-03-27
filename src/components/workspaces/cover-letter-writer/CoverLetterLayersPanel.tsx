// =============================================================================
// Cover Letter Layers Panel — Figma-style collapsible layer tree
// =============================================================================

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useCoverLetterEditor } from "@/stores/cover-letter-editor";
import { SIcon } from "@/components/workspaces/shared/WorkspaceUIKit";

// ── Layer interface ──

interface Layer {
  id: string;
  label: string;
  section: string;
  icon: string;
  visible: boolean;
  toggleKey?: string;
  children?: Layer[];
}

// ── Build layers from store ──

function useLayers(): Layer[] {
  const form = useCoverLetterEditor((s) => s.form);

  return useMemo(() => {
    const layers: Layer[] = [];

    // Header
    layers.push({
      id: "header",
      label: "Header",
      section: "header",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      visible: true,
      children: [
        { id: "header-name", label: form.sender.fullName || "Your Name", section: "header", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0z", visible: true },
        ...(form.sender.jobTitle ? [{ id: "header-title", label: form.sender.jobTitle, section: "header", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2", visible: true }] : []),
        { id: "header-contact", label: "Contact Info", section: "header", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", visible: true },
      ],
    });

    // Recipient
    layers.push({
      id: "recipient",
      label: "Recipient",
      section: "recipient",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5",
      visible: form.style.showRecipientAddress,
      toggleKey: "style:showRecipientAddress",
    });

    // Date
    layers.push({
      id: "date",
      label: "Date",
      section: "date",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      visible: form.style.showDate,
      toggleKey: "style:showDate",
    });

    // Subject line
    if (form.style.showSubjectLine) {
      layers.push({
        id: "subject",
        label: "Subject Line",
        section: "subject",
        icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
        visible: true,
        toggleKey: "style:showSubjectLine",
      });
    }

    // Salutation
    layers.push({
      id: "salutation",
      label: "Salutation",
      section: "salutation",
      icon: "M7 8h10M7 12h4",
      visible: true,
    });

    // Opening Hook
    layers.push({
      id: "opening",
      label: "Opening Paragraph",
      section: "opening",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      visible: true,
    });

    // Qualifications
    layers.push({
      id: "qualifications",
      label: "Qualifications",
      section: "qualifications",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      visible: true,
    });

    // Company Fit
    layers.push({
      id: "company-fit",
      label: "Company Fit",
      section: "company-fit",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1",
      visible: true,
    });

    // Closing
    layers.push({
      id: "closing",
      label: "Closing",
      section: "closing",
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8",
      visible: true,
    });

    // Sign off
    layers.push({
      id: "signoff",
      label: "Signature",
      section: "signoff",
      icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
      visible: true,
    });

    // PS
    if (form.content.postScript) {
      layers.push({
        id: "ps",
        label: "P.S.",
        section: "ps",
        icon: "M7 8h10M7 12h4",
        visible: true,
      });
    }

    return layers;
  }, [form]);
}

// ── Toggle visibility dispatcher ──

function useToggleVisibility() {
  const updateStyle = useCoverLetterEditor((s) => s.updateStyle);
  const form = useCoverLetterEditor((s) => s.form);

  return useCallback(
    (toggleKey: string) => {
      if (toggleKey.startsWith("style:")) {
        const key = toggleKey.replace("style:", "") as keyof typeof form.style;
        const current = form.style[key];
        if (typeof current === "boolean") {
          updateStyle({ [key]: !current });
        }
      }
    },
    [updateStyle, form],
  );
}

// ── Layer Row ──

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

        <span className="w-3.5 h-3.5 text-gray-500 shrink-0"><SIcon d={layer.icon} /></span>

        <span className={`text-[11px] truncate flex-1 ${layer.visible ? "text-gray-300" : "text-gray-600 line-through"}`}>
          {layer.label}
        </span>

        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${layer.visible ? "bg-primary-400/80" : "bg-gray-600/40"}`} />

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

// ── Main Panel ──

interface CoverLetterLayersPanelProps {
  onOpenSection: (section: string) => void;
  onHoverSection: (section: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function CoverLetterLayersPanel({
  onOpenSection,
  onHoverSection,
  collapsed,
  onToggleCollapse,
}: CoverLetterLayersPanelProps) {
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
