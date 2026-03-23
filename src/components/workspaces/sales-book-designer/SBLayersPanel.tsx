// =============================================================================
// DMSuite — Sales Book Layers Panel
// Figma-style layer tree for the sales book preview.
// Hover to highlight on canvas, click to open corresponding editor section.
// =============================================================================

"use client";

import { useCallback, useState } from "react";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
import { DOCUMENT_TYPE_CONFIGS } from "@/lib/sales-book/schema";
import type { SalesDocumentType } from "@/lib/invoice/schema";

// ── Layer definition ──

interface Layer {
  id: string;
  label: string;
  section: string;       // maps to data-sb-section value & accordion key
  icon: React.ReactNode;
  visible: boolean;       // derived from form state
  children?: Layer[];
}

// ── Tiny icons for the tree ──

const Eye = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-40">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LayerIcon = ({ d, extra }: { d: string; extra?: React.ReactNode }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d={d} />{extra}
  </svg>
);

// ── Build layer tree from form state ──

function useLayers(): Layer[] {
  const form = useSalesBookEditor((s) => s.form);
  const docType = form.documentType as SalesDocumentType;
  const config = DOCUMENT_TYPE_CONFIGS[docType];
  const layout = form.formLayout;
  const isReceipt = config.receiptLayout;

  const layers: Layer[] = [
    {
      id: "branding",
      label: form.companyBranding.name || "Company Branding",
      section: "branding",
      icon: <LayerIcon d="M3 3h18v18H3z" extra={<><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /></>} />,
      visible: true,
      children: [
        { id: "branding-logo", label: "Logo", section: "branding", icon: <LayerIcon d="M3 3h18v18H3z" extra={<circle cx="8.5" cy="8.5" r="1.5" />} />, visible: !!form.companyBranding.logoUrl },
        { id: "branding-name", label: "Company Name", section: "branding", icon: <LayerIcon d="M4 7h16M4 12h10M4 17h12" />, visible: true },
        { id: "branding-contact", label: "Contact Info", section: "branding", icon: <LayerIcon d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07" />, visible: !!(form.companyBranding.phone || form.companyBranding.email) },
      ],
    },
    {
      id: "document-type",
      label: layout.columnLabels?.["doc_title"] || config.title,
      section: "document-type",
      icon: <LayerIcon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" extra={<polyline points="14 2 14 8 20 8" />} />,
      visible: true,
    },
    {
      id: "print",
      label: "Serial & Date",
      section: "print",
      icon: <LayerIcon d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />,
      visible: form.serialConfig.showSerial || layout.showDate,
      children: [
        { id: "print-serial", label: `Serial (${form.serialConfig.prefix}...)`, section: "print", icon: <LayerIcon d="M4 7h16M4 12h16M4 17h7" />, visible: form.serialConfig.showSerial },
        { id: "print-date", label: "Date Field", section: "print", icon: <LayerIcon d="M3 4h18v18H3z" extra={<><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>} />, visible: layout.showDate },
      ],
    },
    {
      id: "layout",
      label: isReceipt ? "Receipt Fields" : "Items Table",
      section: "layout",
      icon: isReceipt
        ? <LayerIcon d="M3 3h18v18H3z" extra={<><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="16" x2="13" y2="16" /></>} />
        : <LayerIcon d="M3 3h18v18H3z" extra={<><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /></>} />,
      visible: true,
      children: [
        ...(isReceipt ? [
          { id: "layout-recipient", label: "Received From", section: "layout", icon: <LayerIcon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />, visible: layout.showRecipient },
          { id: "layout-amount-words", label: "Amount in Words", section: "layout", icon: <LayerIcon d="M4 7h16M4 12h10" />, visible: layout.showAmountInWords },
          { id: "layout-payment", label: "Payment Method", section: "layout", icon: <LayerIcon d="M3 3h18v4H3z" extra={<path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />} />, visible: true },
        ] : [
          { id: "layout-recipient", label: config.recipientLabel, section: "layout", icon: <LayerIcon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />, visible: layout.showRecipient },
          { id: "layout-table", label: `${layout.itemRowCount} Item Rows`, section: "layout", icon: <LayerIcon d="M3 3h18v18H3z" extra={<><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="3" x2="9" y2="21" /></>} />, visible: true },
          { id: "layout-totals", label: "Totals", section: "layout", icon: <LayerIcon d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />, visible: layout.showTotal },
        ]),
      ],
    },
    {
      id: "layout-signatures",
      label: "Signatures",
      section: "layout",
      icon: <LayerIcon d="M2 17c1.5-2.5 4-4 7-4s5.5 1.5 7 4" extra={<path d="M17 13c1 0 2-.5 3-1.5s2-2 2-3.5c0-2-1-3-3-3s-3 1-3 3c0 1.5 1 2.5 2 3.5s2 1.5 3 1.5" />} />,
      visible: layout.showSignature,
    },
  ];

  // Conditional layers
  if (layout.showTerms && layout.termsText) {
    layers.push({
      id: "layout-terms",
      label: "Terms & Conditions",
      section: "layout",
      icon: <LayerIcon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" extra={<><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" /></>} />,
      visible: true,
    });
  }

  if (layout.showPaymentInfo) {
    layers.push({
      id: "layout-payment-info",
      label: "Payment Details",
      section: "branding",
      icon: <LayerIcon d="M3 3h18v4H3z" extra={<path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />} />,
      visible: true,
    });
  }

  if (form.brandLogos.enabled && form.brandLogos.logos.length > 0) {
    layers.push({
      id: "logos",
      label: `Brand Logos (${form.brandLogos.logos.length})`,
      section: "logos",
      icon: <LayerIcon d="M3 3h18v18H3z" extra={<><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>} />,
      visible: true,
    });
  }

  if (form.customBlocks && form.customBlocks.length > 0) {
    layers.push({
      id: "blocks",
      label: `Custom Blocks (${form.customBlocks.length})`,
      section: "blocks",
      icon: <LayerIcon d="M10 2h4v4h-4z" extra={<><rect x="2" y="10" width="4" height="4" /><rect x="18" y="10" width="4" height="4" /></>} />,
      visible: true,
    });
  }

  // Style (always present)
  layers.push({
    id: "style",
    label: "Style & Template",
    section: "style",
    icon: <LayerIcon d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.36-.12-.68-.37-.93-.24-.26-.37-.58-.37-.93 0-.75.6-1.35 1.35-1.35H16c3.31 0 6-2.69 6-6 0-5.52-4.48-9.8-10-9.8z" />,
    visible: true,
  });

  return layers;
}

// ── Layer Row Component ──

function LayerRow({
  layer,
  depth,
  hoveredLayer,
  onHover,
  onLeave,
  onClick,
}: {
  layer: Layer;
  depth: number;
  hoveredLayer: string | null;
  onHover: (id: string, section: string) => void;
  onLeave: () => void;
  onClick: (section: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isHovered = hoveredLayer === layer.id;
  const hasChildren = layer.children && layer.children.length > 0;

  return (
    <>
      <div
        className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer rounded transition-colors group ${
          isHovered ? "bg-primary-500/15 text-primary-300" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onMouseEnter={() => onHover(layer.id, layer.section)}
        onMouseLeave={onLeave}
        onClick={() => onClick(layer.section)}
      >
        {/* Expand/collapse chevron or spacer */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-3.5 h-3.5 flex items-center justify-center shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
              <path d="M2 1l4 3-4 3z" />
            </svg>
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {/* Layer icon */}
        <span className={`shrink-0 ${layer.visible ? "" : "opacity-30"}`}>
          {layer.icon}
        </span>

        {/* Label */}
        <span className={`text-[11px] truncate flex-1 ${layer.visible ? "" : "opacity-40 line-through"}`}>
          {layer.label}
        </span>

        {/* Visibility indicator */}
        <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {layer.visible ? <Eye /> : <EyeOff />}
        </span>
      </div>

      {/* Children */}
      {hasChildren && expanded && layer.children!.map((child) => (
        <LayerRow
          key={child.id}
          layer={child}
          depth={depth + 1}
          hoveredLayer={hoveredLayer}
          onHover={onHover}
          onLeave={onLeave}
          onClick={onClick}
        />
      ))}
    </>
  );
}

// ── Main Layers Panel ──

interface SBLayersPanelProps {
  onOpenSection: (section: string) => void;
  onHoverSection: (section: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function SBLayersPanel({ onOpenSection, onHoverSection, collapsed, onToggleCollapse }: SBLayersPanelProps) {
  const layers = useLayers();
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

  // Collapsed: just show a vertical tab
  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="shrink-0 w-7 flex flex-col items-center justify-center gap-1 border-l border-gray-800/60 bg-gray-900/40 hover:bg-gray-800/40 transition-colors cursor-pointer"
        title="Show Layers"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
          <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
        </svg>
        <span className="text-[8px] text-gray-600 [writing-mode:vertical-lr] tracking-widest uppercase">Layers</span>
      </button>
    );
  }

  return (
    <div className="shrink-0 w-52 flex flex-col border-l border-gray-800/60 bg-gray-900/40">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between h-8 px-2.5 border-b border-gray-800/40">
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Layers</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-0.5 rounded text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          title="Collapse panel"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Layer tree */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {layers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            depth={0}
            hoveredLayer={hoveredLayer}
            onHover={handleHover}
            onLeave={handleLeave}
            onClick={handleClick}
          />
        ))}
      </div>
    </div>
  );
}
