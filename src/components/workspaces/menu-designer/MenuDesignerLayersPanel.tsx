// =============================================================================
// DMSuite — Menu Designer Layers Panel
// Figma-style layer tree for the menu document preview.
// Hover to highlight on canvas, click to open corresponding editor tab.
// Follows CertificateLayersPanel.tsx architecture exactly.
// =============================================================================

"use client";

import { useCallback, useState } from "react";
import { useMenuDesignerEditor, DIETARY_TAGS } from "@/stores/menu-designer-editor";

// ── Layer definition ──

interface Layer {
  id: string;
  label: string;
  section: string;
  icon: React.ReactNode;
  visible: boolean;
  toggleKey?: string;
  children?: Layer[];
}

// ── Icons ──

const Eye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LI = ({ d, extra }: { d: string; extra?: React.ReactNode }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d={d} />{extra}
  </svg>
);

// ── Build layer tree from menu form state ──

function useLayers(): Layer[] {
  const form = useMenuDesignerEditor((s) => s.form);

  const layers: Layer[] = [];

  // Restaurant header
  layers.push({
    id: "header",
    label: form.restaurantName || "Restaurant Name",
    section: "header",
    icon: <LI d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />,
    visible: !!form.restaurantName,
  });

  // Tagline
  if (form.tagline) {
    layers.push({
      id: "tagline",
      label: form.tagline,
      section: "header",
      icon: <LI d="M4 7h16M4 12h10" />,
      visible: true,
    });
  }

  // Header note
  if (form.headerNote) {
    layers.push({
      id: "header-note",
      label: "Header Note",
      section: "header",
      icon: <LI d="M4 7h16M4 12h16M4 17h7" />,
      visible: true,
    });
  }

  // Menu sections with items as children
  for (const section of form.sections) {
    layers.push({
      id: `section-${section.id}`,
      label: section.title || "Untitled Section",
      section: `section-${section.id}`,
      icon: <LI d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
      visible: section.visible,
      toggleKey: `section:${section.id}`,
      children: section.items.map((item, i) => ({
        id: `item-${item.id}`,
        label: item.name || `Item ${i + 1}`,
        section: `section-${section.id}`,
        icon: item.featured
          ? <LI d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          : <LI d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />,
        visible: true,
      })),
    });
  }

  // Footer note
  if (form.footerNote) {
    layers.push({
      id: "footer-note",
      label: "Footer Note",
      section: "footer",
      icon: <LI d="M4 7h16M4 12h16M4 17h16" />,
      visible: true,
    });
  }

  // Dietary legend
  if (form.style.showDietaryLegend) {
    const usedTags = new Set(form.sections.flatMap((s) => s.items.flatMap((item) => item.dietary)));
    layers.push({
      id: "dietary-legend",
      label: `Dietary Legend (${usedTags.size} tags)`,
      section: "legend",
      icon: <LI d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" extra={<path d="M12 8v4M12 16h.01" />} />,
      visible: true,
      toggleKey: "showDietaryLegend",
    });
  }

  return layers;
}

// ── Visibility toggle dispatcher ──

function useToggleVisibility() {
  const updateSection = useMenuDesignerEditor((s) => s.updateSection);
  const updateStyle = useMenuDesignerEditor((s) => s.updateStyle);
  const form = useMenuDesignerEditor((s) => s.form);

  return useCallback(
    (toggleKey: string) => {
      if (toggleKey === "showDietaryLegend") {
        updateStyle({ showDietaryLegend: !form.style.showDietaryLegend });
      } else if (toggleKey.startsWith("section:")) {
        const sectionId = toggleKey.replace("section:", "");
        const sec = form.sections.find((s) => s.id === sectionId);
        if (sec) updateSection(sectionId, { visible: !sec.visible });
      }
    },
    [form.style.showDietaryLegend, form.sections, updateStyle, updateSection],
  );
}

// ── Layer Row Component ──

function LayerRow({
  layer,
  depth,
  hoveredLayer,
  onHover,
  onLeave,
  onClick,
  onToggle,
}: {
  layer: Layer;
  depth: number;
  hoveredLayer: string | null;
  onHover: (id: string, section: string) => void;
  onLeave: () => void;
  onClick: (section: string) => void;
  onToggle: (toggleKey: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isHovered = hoveredLayer === layer.id;
  const hasChildren = layer.children && layer.children.length > 0;

  return (
    <>
      <div
        className={`relative flex items-center gap-2 py-1.5 pr-2 cursor-pointer rounded-lg mx-1 transition-all group ${
          isHovered
            ? "bg-primary-500/12 text-primary-200 shadow-sm shadow-primary-500/5"
            : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
        }`}
        style={{ paddingLeft: `${10 + depth * 16}px` }}
        onMouseEnter={() => onHover(layer.id, layer.section)}
        onMouseLeave={onLeave}
        onClick={() => onClick(layer.section)}
      >
        {depth > 0 && (
          <span
            className="absolute top-0 bottom-0 border-l border-gray-700/30"
            style={{ left: `${10 + (depth - 1) * 16 + 7}px` }}
          />
        )}

        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-4 h-4 flex items-center justify-center shrink-0 rounded text-gray-600 hover:text-gray-300 hover:bg-gray-700/40 transition-colors"
          >
            <svg width="9" height="9" viewBox="0 0 8 8" fill="currentColor" className={`transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}>
              <path d="M2 1l4 3-4 3z" />
            </svg>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <span className={`shrink-0 size-1.5 rounded-full transition-colors ${
          layer.visible ? "bg-primary-400/80" : "bg-gray-600/40"
        }`} />

        <span className={`shrink-0 transition-opacity ${layer.visible ? "" : "opacity-25"}`}>
          {layer.icon}
        </span>

        <span className={`text-xs leading-tight truncate flex-1 transition-opacity ${
          layer.visible ? "" : "opacity-35 line-through decoration-gray-600"
        }`}>
          {layer.label}
        </span>

        {layer.toggleKey ? (
          <button
            className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-700/50 transition-all"
            onClick={(e) => { e.stopPropagation(); onToggle(layer.toggleKey!); }}
            title={layer.visible ? "Hide" : "Show"}
          >
            {layer.visible ? <Eye /> : <EyeOff />}
          </button>
        ) : (
          <span className="shrink-0 w-6" />
        )}
      </div>

      {hasChildren && expanded && layer.children!.map((child) => (
        <LayerRow
          key={child.id}
          layer={child}
          depth={depth + 1}
          hoveredLayer={hoveredLayer}
          onHover={onHover}
          onLeave={onLeave}
          onClick={onClick}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

// ── Main Layers Panel ──

interface MenuDesignerLayersPanelProps {
  onOpenSection: (section: string) => void;
  onHoverSection: (section: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function MenuDesignerLayersPanel({ onOpenSection, onHoverSection, collapsed, onToggleCollapse }: MenuDesignerLayersPanelProps) {
  const layers = useLayers();
  const toggleVisibility = useToggleVisibility();
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const handleHover = useCallback((id: string, section: string) => {
    setHoveredLayer(id);
    onHoverSection(section);
  }, [onHoverSection]);

  const handleLeave = useCallback(() => {
    setHoveredLayer(null);
    onHoverSection(null);
  }, [onHoverSection]);

  const handleClick = useCallback((section: string) => {
    onOpenSection(section);
  }, [onOpenSection]);

  // Collapsed: slim vertical tab
  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="shrink-0 w-8 flex flex-col items-center justify-center gap-2 border-l border-gray-800/50 bg-gray-900/30 hover:bg-gray-800/40 transition-colors cursor-pointer group"
        title="Show Layers"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-gray-300 transition-colors">
          <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
        </svg>
        <span className="text-[9px] text-gray-600 group-hover:text-gray-400 [writing-mode:vertical-lr] tracking-widest uppercase font-medium transition-colors">Layers</span>
      </button>
    );
  }

  const visibleCount = layers.reduce(
    (n, l) => n + (l.visible ? 1 : 0) + (l.children?.filter((c) => c.visible).length ?? 0),
    0,
  );
  const totalCount = layers.reduce((n, l) => n + 1 + (l.children?.length ?? 0), 0);

  return (
    <div className="shrink-0 w-56 flex flex-col border-l border-gray-800/50 bg-gray-900/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800/40">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="text-xs font-semibold text-gray-300 tracking-wide">Layers</span>
          <span className="text-[10px] text-gray-600 font-mono">{visibleCount}/{totalCount}</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-gray-600 hover:text-gray-300 hover:bg-gray-800/60 transition-colors"
          title="Collapse panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Layer tree */}
      <div className="flex-1 overflow-y-auto py-1.5 scrollbar-thin">
        {layers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            depth={0}
            hoveredLayer={hoveredLayer}
            onHover={handleHover}
            onLeave={handleLeave}
            onClick={handleClick}
            onToggle={toggleVisibility}
          />
        ))}
      </div>

      {/* Footer with legend */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-t border-gray-800/40">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary-400/80" />
          <span className="text-[10px] text-gray-600">Visible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-gray-600/40" />
          <span className="text-[10px] text-gray-600">Hidden</span>
        </div>
      </div>
    </div>
  );
}
