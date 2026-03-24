// =============================================================================
// DMSuite — Sales Book Layers Panel
// Figma-style layer tree for the sales book preview.
// Hover to highlight on canvas, click to open corresponding editor section.
// Visibility toggles actually control form state.
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
  toggleKey?: string;     // store field key for toggling visibility
  children?: Layer[];
}

// ── Layer tree icons (14px for readability) ──

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

const LayerIcon = ({ d, extra }: { d: string; extra?: React.ReactNode }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
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
    // ── Company Branding ──
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

    // ── Document Type / Title ──
    {
      id: "document-type",
      label: layout.columnLabels?.["doc_title"] || config.title,
      section: "document-type",
      icon: <LayerIcon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" extra={<polyline points="14 2 14 8 20 8" />} />,
      visible: true,
    },

    // ── Serial & Date ──
    {
      id: "print",
      label: "Serial & Date",
      section: "print",
      icon: <LayerIcon d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />,
      visible: form.serialConfig.showSerial || layout.showDate,
      children: [
        { id: "print-serial", label: `Serial (${form.serialConfig.prefix}...)`, section: "print", icon: <LayerIcon d="M4 7h16M4 12h16M4 17h7" />, visible: form.serialConfig.showSerial, toggleKey: "serial:showSerial" },
        { id: "print-date", label: "Date Field", section: "print", icon: <LayerIcon d="M3 4h18v18H3z" extra={<><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>} />, visible: layout.showDate, toggleKey: "layout:showDate" },
      ],
    },

    // ── Layout / Items ──
    {
      id: "layout",
      label: isReceipt ? "Receipt Fields" : "Items Table",
      section: "layout",
      icon: isReceipt
        ? <LayerIcon d="M3 3h18v18H3z" extra={<><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="16" x2="13" y2="16" /></>} />
        : <LayerIcon d="M3 3h18v18H3z" extra={<><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /></>} />,
      visible: true,
      children: isReceipt
        ? [
            { id: "layout-recipient", label: "Received From", section: "layout", icon: <LayerIcon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />, visible: layout.showRecipient, toggleKey: "layout:showRecipient" },
            { id: "layout-amount-words", label: "Amount in Words", section: "layout", icon: <LayerIcon d="M4 7h16M4 12h10" />, visible: layout.showAmountInWords, toggleKey: "layout:showAmountInWords" },
            { id: "layout-payment", label: "Payment Method", section: "layout", icon: <LayerIcon d="M3 3h18v4H3z" extra={<path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />} />, visible: true },
          ]
        : [
            { id: "layout-recipient", label: config.recipientLabel, section: "layout", icon: <LayerIcon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />, visible: layout.showRecipient, toggleKey: "layout:showRecipient" },
            { id: "layout-table", label: `${layout.itemRowCount} Item Rows`, section: "layout", icon: <LayerIcon d="M3 3h18v18H3z" extra={<><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="3" x2="9" y2="21" /></>} />, visible: true },
            { id: "layout-subtotal", label: "Subtotal", section: "layout", icon: <LayerIcon d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />, visible: layout.showSubtotal, toggleKey: "layout:showSubtotal" },
            { id: "layout-discount", label: "Discount", section: "layout", icon: <LayerIcon d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />, visible: layout.showDiscount, toggleKey: "layout:showDiscount" },
            { id: "layout-tax", label: "Tax / VAT", section: "layout", icon: <LayerIcon d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />, visible: layout.showTax, toggleKey: "layout:showTax" },
            { id: "layout-totals", label: "Total", section: "layout", icon: <LayerIcon d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />, visible: layout.showTotal, toggleKey: "layout:showTotal" },
          ],
    },
  ];

  // ── Amount in Words (table forms only, not delivery notes) ──
  if (!isReceipt && docType !== "delivery-note") {
    layers.push({
      id: "layout-amount-words-form",
      label: "Amount in Words",
      section: "layout",
      icon: <LayerIcon d="M4 7h16M4 12h10M4 17h12" />,
      visible: layout.showAmountInWords,
      toggleKey: "layout:showAmountInWords",
    });
  }

  // ── Payment Info ──
  layers.push({
    id: "layout-payment-info",
    label: "Payment Details",
    section: "layout",
    icon: <LayerIcon d="M3 3h18v4H3z" extra={<path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />} />,
    visible: layout.showPaymentInfo,
    toggleKey: "layout:showPaymentInfo",
  });

  // ── Signatures ──
  layers.push({
    id: "layout-signatures",
    label: "Signatures",
    section: "layout",
    icon: <LayerIcon d="M2 17c1.5-2.5 4-4 7-4s5.5 1.5 7 4" extra={<path d="M17 13c1 0 2-.5 3-1.5s2-2 2-3.5c0-2-1-3-3-3s-3 1-3 3c0 1.5 1 2.5 2 3.5s2 1.5 3 1.5" />} />,
    visible: layout.showSignature,
    toggleKey: "layout:showSignature",
  });

  // ── Notes ──
  layers.push({
    id: "layout-notes",
    label: "Notes",
    section: "layout",
    icon: <LayerIcon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" extra={<><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /></>} />,
    visible: layout.showNotes,
    toggleKey: "layout:showNotes",
  });

  // ── Terms & Conditions ──
  layers.push({
    id: "layout-terms",
    label: "Terms & Conditions",
    section: "layout",
    icon: <LayerIcon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" extra={<><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" /></>} />,
    visible: layout.showTerms,
    toggleKey: "layout:showTerms",
  });

  // ── Type-Specific Fields ──
  if (docType === "quotation") {
    layers.push({
      id: "layout-type-validfor",
      label: "Valid For (days)",
      section: "layout",
      icon: <LayerIcon d="M3 4h18v18H3z" extra={<line x1="3" y1="10" x2="21" y2="10" />} />,
      visible: layout.showValidFor !== false,
      toggleKey: "layout:showValidFor",
    });
  }
  if (docType === "proforma-invoice") {
    layers.push({
      id: "layout-type-validuntil",
      label: "Valid Until",
      section: "layout",
      icon: <LayerIcon d="M3 4h18v18H3z" extra={<line x1="3" y1="10" x2="21" y2="10" />} />,
      visible: layout.showValidUntil !== false,
      toggleKey: "layout:showValidUntil",
    });
  }
  if (docType === "credit-note") {
    layers.push({
      id: "layout-type-originalinvoice",
      label: "Original Invoice",
      section: "layout",
      icon: <LayerIcon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />,
      visible: layout.showOriginalInvoice !== false,
      toggleKey: "layout:showOriginalInvoice",
    });
    layers.push({
      id: "layout-type-reasonforcredit",
      label: "Reason for Credit",
      section: "layout",
      icon: <LayerIcon d="M4 7h16M4 12h10" />,
      visible: layout.showReasonForCredit !== false,
      toggleKey: "layout:showReasonForCredit",
    });
  }
  if (docType === "purchase-order") {
    layers.push({
      id: "layout-type-shipto",
      label: "Ship To",
      section: "layout",
      icon: <LayerIcon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />,
      visible: layout.showShipTo !== false,
      toggleKey: "layout:showShipTo",
    });
    layers.push({
      id: "layout-type-deliveryby",
      label: "Delivery Required By",
      section: "layout",
      icon: <LayerIcon d="M3 4h18v18H3z" extra={<line x1="3" y1="10" x2="21" y2="10" />} />,
      visible: layout.showDeliveryBy !== false,
      toggleKey: "layout:showDeliveryBy",
    });
  }
  if (docType === "delivery-note") {
    layers.push({
      id: "layout-type-vehicleno",
      label: "Vehicle No.",
      section: "layout",
      icon: <LayerIcon d="M4 7h16M4 12h10" />,
      visible: layout.showVehicleNo !== false,
      toggleKey: "layout:showVehicleNo",
    });
    layers.push({
      id: "layout-type-drivername",
      label: "Driver Name",
      section: "layout",
      icon: <LayerIcon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />,
      visible: layout.showDriverName !== false,
      toggleKey: "layout:showDriverName",
    });
  }

  // ── Brand Logos ──
  if (form.brandLogos.logos.length > 0) {
    layers.push({
      id: "logos",
      label: `Brand Logos (${form.brandLogos.logos.length})`,
      section: "logos",
      icon: <LayerIcon d="M3 3h18v18H3z" extra={<><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>} />,
      visible: form.brandLogos.enabled,
      toggleKey: "brandLogos:enabled",
    });
  }

  // ── Custom Blocks ──
  if (form.customBlocks && form.customBlocks.length > 0) {
    layers.push({
      id: "blocks",
      label: `Custom Blocks (${form.customBlocks.length})`,
      section: "blocks",
      icon: <LayerIcon d="M10 2h4v4h-4z" extra={<><rect x="2" y="10" width="4" height="4" /><rect x="18" y="10" width="4" height="4" /></>} />,
      visible: true,
    });
  }

  // ── Footer Bar ──
  layers.push({
    id: "style-footer",
    label: "Footer Bar",
    section: "style",
    icon: <LayerIcon d="M3 21h18M3 18h18" />,
    visible: true,
  });

  // ── Form Border ──
  layers.push({
    id: "style-border",
    label: "Form Border",
    section: "style",
    icon: <LayerIcon d="M3 3h18v18H3z" />,
    visible: form.style.borderStyle !== "none",
    toggleKey: "style:borderStyleToggle",
  });

  // ── Style & Template (always present) ──
  layers.push({
    id: "style",
    label: "Style & Template",
    section: "style",
    icon: <LayerIcon d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.36-.12-.68-.37-.93-.24-.26-.37-.58-.37-.93 0-.75.6-1.35 1.35-1.35H16c3.31 0 6-2.69 6-6 0-5.52-4.48-9.8-10-9.8z" />,
    visible: true,
  });

  return layers;
}

// ── Visibility toggle dispatcher ──

function useToggleVisibility() {
  const updateLayout = useSalesBookEditor((s) => s.updateLayout);
  const updateSerial = useSalesBookEditor((s) => s.updateSerial);
  const updateStyle = useSalesBookEditor((s) => s.updateStyle);
  const updateBrandLogos = useSalesBookEditor((s) => s.updateBrandLogos);
  const form = useSalesBookEditor((s) => s.form);

  return useCallback((toggleKey: string) => {
    const [store, field] = toggleKey.split(":");

    if (store === "layout") {
      const current = (form.formLayout as Record<string, unknown>)[field];
      updateLayout({ [field]: current === false ? true : !current });
    } else if (store === "serial") {
      const current = (form.serialConfig as Record<string, unknown>)[field];
      updateSerial({ [field]: !current });
    } else if (store === "style") {
      if (field === "borderStyleToggle") {
        updateStyle({ borderStyle: form.style.borderStyle === "none" ? "solid" : "none" });
      }
    } else if (store === "brandLogos") {
      if (field === "enabled") {
        updateBrandLogos({ enabled: !form.brandLogos.enabled });
      }
    }
  }, [form, updateLayout, updateSerial, updateStyle, updateBrandLogos]);
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
        {/* Tree indent lines */}
        {depth > 0 && (
          <span
            className="absolute top-0 bottom-0 border-l border-gray-700/30"
            style={{ left: `${10 + (depth - 1) * 16 + 7}px` }}
          />
        )}

        {/* Expand/collapse chevron or spacer */}
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

        {/* Visibility dot */}
        <span className={`shrink-0 size-1.5 rounded-full transition-colors ${
          layer.visible ? "bg-emerald-400/80" : "bg-gray-600/40"
        }`} />

        {/* Layer icon */}
        <span className={`shrink-0 transition-opacity ${layer.visible ? "" : "opacity-25"}`}>
          {layer.icon}
        </span>

        {/* Label */}
        <span className={`text-xs leading-tight truncate flex-1 transition-opacity ${
          layer.visible ? "" : "opacity-35 line-through decoration-gray-600"
        }`}>
          {layer.label}
        </span>

        {/* Visibility toggle button */}
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
          onToggle={onToggle}
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
          <span className="size-1.5 rounded-full bg-emerald-400/80" />
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
