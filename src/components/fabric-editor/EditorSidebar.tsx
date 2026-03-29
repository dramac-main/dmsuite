/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Fabric Editor Sidebar
 *  Tool palette (left rail) + active panel flyout.
 *  ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { type ReactNode } from "react";
import { useFabricEditor } from "./FabricEditor";
import type { ActiveTool } from "@/lib/fabric-editor";

import { ShapeSidebar } from "./sidebars/ShapeSidebar";
import { TextSidebar } from "./sidebars/TextSidebar";
import { ImageSidebar } from "./sidebars/ImageSidebar";
import { DrawSidebar } from "./sidebars/DrawSidebar";
import { FillSidebar } from "./sidebars/FillSidebar";
import { StrokeColorSidebar } from "./sidebars/StrokeColorSidebar";
import { StrokeWidthSidebar } from "./sidebars/StrokeWidthSidebar";
import { OpacitySidebar } from "./sidebars/OpacitySidebar";
import { FontSidebar } from "./sidebars/FontSidebar";
import { FilterSidebar } from "./sidebars/FilterSidebar";
import { AiSidebar } from "./sidebars/AiSidebar";
import { TemplateSidebar } from "./sidebars/TemplateSidebar";
import { SettingsSidebar } from "./sidebars/SettingsSidebar";
import { LayersSidebar } from "./sidebars/LayersSidebar";
import { QuickEditSidebar } from "./sidebars/QuickEditSidebar";

// ── Tool buttons config ─────────────────────────────────────────────────────

interface ToolEntry {
  tool: ActiveTool;
  label: string;
  icon: ReactNode;
}

const TOOL_ENTRIES: ToolEntry[] = [
  {
    tool: "select",
    label: "Select",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      </svg>
    ),
  },
  {
    tool: "shapes",
    label: "Shapes",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  {
    tool: "text",
    label: "Text",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
      </svg>
    ),
  },
  {
    tool: "images",
    label: "Images",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
  },
  {
    tool: "draw",
    label: "Draw",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
  },
  {
    tool: "templates",
    label: "Templates",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    tool: "quick-edit",
    label: "Quick Edit",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    tool: "ai",
    label: "AI",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
        <path d="M10 21v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1" />
      </svg>
    ),
  },
  {
    tool: "layers",
    label: "Layers",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
        <path d="m22 12-8.97 4.08a2 2 0 0 1-1.66 0L2 12" />
        <path d="m22 17-8.97 4.08a2 2 0 0 1-1.66 0L2 17" />
      </svg>
    ),
  },
  {
    tool: "settings",
    label: "Settings",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

// ── Sidebar Panel Map ───────────────────────────────────────────────────────

function ActivePanel({ tool }: { tool: ActiveTool }) {
  switch (tool) {
    case "shapes":
      return <ShapeSidebar />;
    case "text":
      return <TextSidebar />;
    case "images":
      return <ImageSidebar />;
    case "draw":
      return <DrawSidebar />;
    case "fill":
      return <FillSidebar />;
    case "stroke-color":
      return <StrokeColorSidebar />;
    case "stroke-width":
      return <StrokeWidthSidebar />;
    case "opacity":
      return <OpacitySidebar />;
    case "font":
      return <FontSidebar />;
    case "filter":
      return <FilterSidebar />;
    case "ai":
      return <AiSidebar />;
    case "templates":
      return <TemplateSidebar />;
    case "settings":
      return <SettingsSidebar />;
    case "layers":
      return <LayersSidebar />;
    case "quick-edit":
      return <QuickEditSidebar />;
    default:
      return null;
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export function EditorSidebar({ extra }: { extra?: ReactNode }) {
  const { activeTool, setActiveTool, config } = useFabricEditor();

  const showPanel = activeTool !== "select";
  const hasQuickEdit = config.quickEditFields && config.quickEditFields.length > 0;

  return (
    <div className="flex h-full">
      {/* Icon rail */}
      <div className="flex w-16 flex-col items-center gap-1 border-r border-gray-800 bg-gray-950 py-2">
        {TOOL_ENTRIES.filter(({ tool }) =>
          tool !== "quick-edit" || hasQuickEdit
        ).map(({ tool, label, icon }) => (
          <button
            key={tool}
            onClick={() => setActiveTool(activeTool === tool ? "select" : tool)}
            title={label}
            className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
              activeTool === tool
                ? "bg-primary-500/20 text-primary-400"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
          >
            {icon}
          </button>
        ))}
        {extra}
      </div>

      {/* Flyout panel */}
      {showPanel && (
        <div className="w-72 border-r border-gray-800 bg-gray-900 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-200 capitalize">
              {activeTool.replace("-", " ")}
            </h3>
            <button
              onClick={() => setActiveTool("select")}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <ActivePanel tool={activeTool} />
          </div>
        </div>
      )}
    </div>
  );
}
