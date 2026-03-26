// =============================================================================
// DMSuite — Certificate Designer Layers Panel
// Figma-style layer tree for the certificate document preview.
// Hover to highlight on canvas, click to open corresponding editor tab.
// Follows ContractLayersPanel.tsx architecture exactly.
// =============================================================================

"use client";

import { useCallback, useState } from "react";
import { useCertificateEditor } from "@/stores/certificate-editor";

// ── Layer definition ──

interface Layer {
  id: string;
  label: string;
  section: string; // maps to data-cert-section value & tab key
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

// ── Build layer tree from certificate form state ──

function useLayers(): Layer[] {
  const form = useCertificateEditor((s) => s.form);

  const layers: Layer[] = [
    // Organization header
    {
      id: "organization",
      label: form.organizationName || "Organization",
      section: "organization",
      icon: <LI d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />,
      visible: !!form.organizationName,
    },

    // Certificate title
    {
      id: "title",
      label: form.title || "Certificate Title",
      section: "title",
      icon: <LI d="M4 7h16M4 12h10" />,
      visible: true,
    },

    // Subtitle / presented to
    {
      id: "subtitle",
      label: form.subtitle || "Presented To",
      section: "subtitle",
      icon: <LI d="M4 7h16M4 12h16M4 17h7" />,
      visible: !!form.subtitle,
    },

    // Recipient name
    {
      id: "recipient",
      label: form.recipientName || "Recipient Name",
      section: "recipient",
      icon: <LI d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" extra={<circle cx="12" cy="7" r="4" />} />,
      visible: true,
    },

    // Description
    {
      id: "description",
      label: "Description",
      section: "description",
      icon: <LI d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" extra={<><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" /></>} />,
      visible: !!form.description,
    },

    // Event / Course
    {
      id: "event",
      label: form.eventName || form.courseName || "Event / Course",
      section: "event",
      icon: <LI d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />,
      visible: !!(form.eventName || form.courseName),
    },

    // Additional text
    {
      id: "additional",
      label: "Additional Text",
      section: "additional",
      icon: <LI d="M4 7h16M4 12h16M4 17h16" />,
      visible: !!form.additionalText,
    },

    // Date
    {
      id: "date",
      label: form.dateIssued ? `Issued: ${form.dateIssued}` : "Date",
      section: "date",
      icon: <LI d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />,
      visible: !!form.dateIssued,
    },

    // Signatories
    {
      id: "signatories",
      label: `Signatories (${form.signatories.length})`,
      section: "signatories",
      icon: <LI d="M2 17c1.5-2.5 4-4 7-4s5.5 1.5 7 4" extra={<path d="M17 13c1 0 2-.5 3-1.5s2-2 2-3.5c0-2-1-3-3-3s-3 1-3 3c0 1.5 1 2.5 2 3.5s2 1.5 3 1.5" />} />,
      visible: form.signatories.length > 0,
      children: form.signatories.map((sig, i) => ({
        id: `sig-${sig.id}`,
        label: sig.name || `Signatory ${i + 1}`,
        section: "signatories",
        icon: <LI d="M4 17h16" />,
        visible: true,
      })),
    },

    // Seal
    {
      id: "seal",
      label: `Seal (${form.sealStyle})`,
      section: "seal",
      icon: <LI d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />,
      visible: form.showSeal && form.sealStyle !== "none",
      toggleKey: "showSeal",
    },

    // Reference number
    {
      id: "reference",
      label: form.referenceNumber || "Reference #",
      section: "reference",
      icon: <LI d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />,
      visible: !!form.referenceNumber,
    },
  ];

  return layers;
}

// ── Visibility toggle dispatcher ──

function useToggleVisibility() {
  const updateSeal = useCertificateEditor((s) => s.updateSeal);
  const form = useCertificateEditor((s) => s.form);

  return useCallback(
    (toggleKey: string) => {
      if (toggleKey === "showSeal") {
        updateSeal({ showSeal: !form.showSeal });
      }
    },
    [form.showSeal, updateSeal],
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

interface CertificateLayersPanelProps {
  onOpenSection: (section: string) => void;
  onHoverSection: (section: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function CertificateLayersPanel({ onOpenSection, onHoverSection, collapsed, onToggleCollapse }: CertificateLayersPanelProps) {
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
    0
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
