"use client";

import { useMemo, useState, useCallback } from "react";
import { useIDBadgeEditor } from "@/stores/id-badge-editor";

// ── Types ───────────────────────────────────────────────────────────────────

interface Layer {
  id: string;
  label: string;
  section: string;          // maps to data-badge-section for hover highlight
  icon: React.ReactNode;
  visible: boolean;
  toggleKey?: string;       // store key for toggling visibility
  children?: Layer[];
}

// ── Inline SVG helpers ──────────────────────────────────────────────────────

function Eye() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function LI({ d }: { d: string }) {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ── Layer Tree Builder ──────────────────────────────────────────────────────

function useLayers(): Layer[] {
  const form = useIDBadgeEditor((s) => s.form);

  return useMemo(() => {
    const front: Layer[] = [
      {
        id: "header",
        label: "Header / Logo",
        section: "badge-header",
        icon: <LI d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
        visible: !!(form.organizationName || form.organizationLogo),
      },
      {
        id: "photo",
        label: "Photo",
        section: "badge-photo",
        icon: <LI d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
        visible: !!form.photoUrl,
      },
      {
        id: "name",
        label: "Name",
        section: "badge-name",
        icon: <LI d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
        visible: !!(form.firstName || form.lastName),
      },
      {
        id: "title",
        label: "Job Title",
        section: "badge-title",
        icon: <LI d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
        visible: !!form.title,
      },
      {
        id: "department",
        label: "Department",
        section: "badge-department",
        icon: <LI d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
        visible: !!form.department,
      },
      {
        id: "employee-id",
        label: "Employee ID",
        section: "badge-employee-id",
        icon: <LI d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />,
        visible: !!form.employeeId,
      },
      {
        id: "role",
        label: "Role Badge",
        section: "badge-role",
        icon: <LI d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
        visible: form.style.showRoleBadge && !!form.role,
        toggleKey: "showRoleBadge",
      },
      {
        id: "dates",
        label: "Valid Dates",
        section: "badge-dates",
        icon: <LI d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
        visible: !!(form.issueDate || form.expiryDate),
      },
      {
        id: "custom-fields",
        label: "Custom Fields",
        section: "badge-custom",
        icon: <LI d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
        visible: !!(form.customField1Label || form.customField2Label),
      },
    ];

    const securityLayers: Layer[] = [];
    if (form.security.showHolographicZone) {
      securityLayers.push({
        id: "holographic",
        label: "Holographic",
        section: "badge-holographic",
        icon: <LI d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
        visible: true,
        toggleKey: "showHolographicZone",
      });
    }
    if (form.security.showWatermark) {
      securityLayers.push({
        id: "watermark",
        label: "Watermark",
        section: "badge-watermark",
        icon: <LI d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
        visible: true,
        toggleKey: "showWatermark",
      });
    }
    if (form.security.showMicrotextBorder) {
      securityLayers.push({
        id: "microtext",
        label: "Microtext",
        section: "badge-microtext",
        icon: <LI d="M4 6h16M4 12h16m-7 6h7" />,
        visible: true,
        toggleKey: "showMicrotextBorder",
      });
    }

    const backLayers: Layer[] = [];
    if (form.backSide.enabled) {
      if (form.backSide.showQrCode) {
        backLayers.push({
          id: "qr-code",
          label: "QR Code",
          section: "badge-qr",
          icon: <LI d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />,
          visible: true,
        });
      }
      if (form.backSide.showBarcode) {
        backLayers.push({
          id: "barcode",
          label: "Barcode",
          section: "badge-barcode",
          icon: <LI d="M2 5h2v14H2zm4 0h1v14H6zm3 0h2v14H9zm4 0h1v14h-1zm3 0h2v14h-2zm4 0h1v14h-1z" />,
          visible: true,
        });
      }
      if (form.backSide.showMagneticStripe) {
        backLayers.push({
          id: "mag-stripe",
          label: "Magnetic Stripe",
          section: "badge-magstripe",
          icon: <LI d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
          visible: true,
        });
      }
      if (form.backSide.showNfcZone) {
        backLayers.push({
          id: "nfc",
          label: "NFC Zone",
          section: "badge-nfc",
          icon: <LI d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />,
          visible: true,
        });
      }
    }

    const tree: Layer[] = [
      {
        id: "front-side",
        label: "Front Side",
        section: "badge-front",
        icon: <LI d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
        visible: true,
        children: front,
      },
    ];

    if (securityLayers.length > 0) {
      tree.push({
        id: "security",
        label: "Security",
        section: "badge-security",
        icon: <LI d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
        visible: true,
        children: securityLayers,
      });
    }

    if (form.backSide.enabled) {
      tree.push({
        id: "back-side",
        label: "Back Side",
        section: "badge-back",
        icon: <LI d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
        visible: true,
        children: backLayers,
      });
    }

    if (form.lanyard.showLanyard) {
      tree.push({
        id: "lanyard",
        label: "Lanyard",
        section: "badge-lanyard",
        icon: <LI d="M12 2v8m0 0l3-3m-3 3l-3-3m-4 8a4 4 0 108 0 4 4 0 00-8 0z" />,
        visible: true,
      });
    }

    return tree;
  }, [form]);
}

// ── Toggle dispatch ─────────────────────────────────────────────────────────

function useToggleVisibility() {
  const updateStyle = useIDBadgeEditor((s) => s.updateStyle);
  const updateSecurity = useIDBadgeEditor((s) => s.updateSecurity);

  return useCallback(
    (key: string) => {
      const styleKeys = ["showRoleBadge", "showDepartmentBadge"] as const;
      const securityKeys = ["showHolographicZone", "showWatermark", "showMicrotextBorder", "sequentialNumbering"] as const;

      if ((styleKeys as readonly string[]).includes(key)) {
        const k = key as (typeof styleKeys)[number];
        const cur = useIDBadgeEditor.getState().form.style;
        updateStyle({ [k]: !cur[k] });
      } else if ((securityKeys as readonly string[]).includes(key)) {
        const k = key as (typeof securityKeys)[number];
        const cur = useIDBadgeEditor.getState().form.security;
        updateSecurity({ [k]: !cur[k] });
      }
    },
    [updateStyle, updateSecurity],
  );
}

// ── LayerRow ────────────────────────────────────────────────────────────────

function LayerRow({
  layer,
  depth,
  onHover,
  onClick,
  onToggle,
}: {
  layer: Layer;
  depth: number;
  onHover: (section: string | null) => void;
  onClick: (section: string) => void;
  onToggle: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = layer.children && layer.children.length > 0;

  return (
    <>
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-800/50 cursor-pointer group transition-colors"
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onMouseEnter={() => onHover(layer.section)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick(layer.section)}
      >
        {/* Expand chevron */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-3.5 h-3.5 flex items-center justify-center text-gray-600 hover:text-gray-400"
          >
            <svg className={`w-2.5 h-2.5 transition-transform ${expanded ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5l8 7-8 7z" />
            </svg>
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        {/* Icon */}
        {layer.icon}

        {/* Label */}
        <span className="flex-1 text-[10px] text-gray-400 truncate group-hover:text-gray-200">
          {layer.label}
        </span>

        {/* Visibility dot */}
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${layer.visible ? "bg-primary-400" : "bg-gray-700"}`} />

        {/* Toggle button */}
        {layer.toggleKey && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(layer.toggleKey!); }}
            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 transition-opacity"
          >
            {layer.visible ? <Eye /> : <EyeOff />}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded &&
        layer.children!.map((child) => (
          <LayerRow
            key={child.id}
            layer={child}
            depth={depth + 1}
            onHover={onHover}
            onClick={onClick}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

// ━━━ Main Panel ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Props {
  onOpenSection: (section: string) => void;
  onHoverSection: (section: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function IDBadgeLayersPanel({ onOpenSection, onHoverSection, collapsed, onToggleCollapse }: Props) {
  const layers = useLayers();
  const toggleVisibility = useToggleVisibility();

  const totalCount = layers.reduce(
    (acc, l) => acc + 1 + (l.children?.length || 0),
    0,
  );

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="flex flex-col items-center gap-2 py-4 px-1.5 bg-gray-900/40 border-l border-gray-800/40 hover:bg-gray-800/40 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="text-[9px] text-gray-600 [writing-mode:vertical-lr] rotate-180">Layers</span>
      </button>
    );
  }

  return (
    <div className="w-48 flex flex-col border-l border-gray-800/40 bg-gray-900/40">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/30">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] text-gray-400 font-medium">Layers</span>
          <span className="text-[9px] text-gray-600">({totalCount})</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-gray-600 hover:text-gray-400 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Layer tree */}
      <div className="flex-1 overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-gray-700">
        {layers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            depth={0}
            onHover={onHoverSection}
            onClick={onOpenSection}
            onToggle={toggleVisibility}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-gray-800/30 flex items-center gap-3 text-[8px] text-gray-700">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary-400" /> Active</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-700" /> Empty</span>
      </div>
    </div>
  );
}
