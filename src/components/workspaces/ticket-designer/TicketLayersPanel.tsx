"use client";

import { useCallback, useState } from "react";
import { useTicketEditor } from "@/stores/ticket-editor";

// ━━━ Layer types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Layer {
  id: string;
  label: string;
  section: string;
  icon: React.ReactNode;
  visible: boolean;
  toggleKey?: string;
  children?: Layer[];
}

// ━━━ Inline icons ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Ico({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ━━━ Layer tree builder ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function useLayers(): Layer[] {
  const form = useTicketEditor((s) => s.form);

  const isBoardingPass = form.ticketType === "boarding-pass";

  const layers: Layer[] = [
    {
      id: "header",
      label: form.event.eventName || "Event Name",
      section: "header",
      icon: <Ico d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />,
      visible: true,
    },
    {
      id: "details",
      label: "Event Details",
      section: "details",
      icon: <Ico d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
      visible: !!(form.event.venueName || form.event.date),
    },
    {
      id: "attendee",
      label: form.attendee.attendeeName || "Attendee",
      section: "attendee",
      icon: <Ico d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      visible: !!form.attendee.attendeeName,
    },
    {
      id: "seating",
      label: "Seating",
      section: "seating",
      icon: <Ico d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7" />,
      visible: !!(form.seat.section || form.seat.seat || (isBoardingPass && form.boarding.seatNumber)),
      children: isBoardingPass
        ? [
            { id: "seat-num", label: form.boarding.seatNumber || "Seat", section: "seating", icon: <Ico d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />, visible: !!form.boarding.seatNumber },
            { id: "class", label: form.boarding.travelClass || "Class", section: "seating", icon: <Ico d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />, visible: !!form.boarding.travelClass },
          ]
        : [
            ...(form.seat.section ? [{ id: "section", label: `Section ${form.seat.section}`, section: "seating", icon: <Ico d="M4 6h16M4 10h16M4 14h16M4 18h16" />, visible: true }] : []),
            ...(form.seat.row ? [{ id: "row", label: `Row ${form.seat.row}`, section: "seating", icon: <Ico d="M4 6h16M4 10h16M4 14h16M4 18h16" />, visible: true }] : []),
            ...(form.seat.seat ? [{ id: "seat", label: `Seat ${form.seat.seat}`, section: "seating", icon: <Ico d="M4 6h16M4 10h16M4 14h16M4 18h16" />, visible: true }] : []),
          ],
    },
    {
      id: "barcode",
      label: form.barcode.type === "qr" ? "QR Code" : form.barcode.type === "code128" ? "Barcode" : "No Barcode",
      section: "barcode",
      icon: <Ico d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 3h3v4h-3v-4zm3-3h4v3h-4v-3zm-3 0h3v3h-3v-3zm3 3h4v4h-4v-4z" />,
      visible: form.barcode.type !== "none",
    },
    {
      id: "stub",
      label: "Tear-off Stub",
      section: "stub",
      icon: <Ico d="M6 3v1m0 10v1m0-5H3m3 0h4m-4 0l3-3m-3 3l3 3" />,
      visible: form.stub.enabled,
      toggleKey: "stub",
    },
    {
      id: "footer",
      label: "Footer / Terms",
      section: "footer",
      icon: <Ico d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      visible: !!(form.organizerName || form.terms),
    },
  ];

  return layers;
}

// ━━━ Toggle visibility ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function useToggleVisibility() {
  const form = useTicketEditor((s) => s.form);
  const updateStub = useTicketEditor((s) => s.updateStub);

  return useCallback(
    (toggleKey: string) => {
      if (toggleKey === "stub") {
        updateStub({ enabled: !form.stub.enabled });
      }
    },
    [form.stub.enabled, updateStub]
  );
}

// ━━━ Layer row ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
  onHover: (id: string) => void;
  onLeave: () => void;
  onClick: (section: string) => void;
  onToggle: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isHovered = hoveredLayer === layer.id;
  const hasChildren = layer.children && layer.children.length > 0;

  return (
    <>
      <div
        className={`flex items-center gap-1.5 h-7 cursor-pointer select-none text-[11px] transition-colors group relative ${
          isHovered ? "bg-primary-500/10" : "hover:bg-gray-800/40"
        }`}
        style={{ paddingLeft: `${10 + depth * 16}px` }}
        onMouseEnter={() => onHover(layer.id)}
        onMouseLeave={onLeave}
        onClick={() => onClick(layer.section)}
      >
        {/* Expand arrow */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-gray-600 hover:text-gray-400 w-3.5 text-center text-[9px]"
          >
            {expanded ? "▼" : "▶"}
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        {/* Vertical nesting line */}
        {depth > 0 && (
          <span
            className="absolute border-l border-gray-700/30"
            style={{ left: `${6 + (depth - 1) * 16}px`, top: 0, height: "100%" }}
          />
        )}

        {/* Visibility dot */}
        <span className={`size-1.5 rounded-full shrink-0 ${layer.visible ? "bg-primary-400/80" : "bg-gray-600/40"}`} />

        {/* Icon */}
        <span className={`shrink-0 ${layer.visible ? "text-gray-400" : "text-gray-600 opacity-25"}`}>
          {layer.icon}
        </span>

        {/* Label */}
        <span className={`truncate flex-1 ${layer.visible ? "text-gray-300" : "text-gray-500 opacity-35 line-through"}`}>
          {layer.label}
        </span>

        {/* Toggle eye */}
        {layer.toggleKey ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(layer.toggleKey!);
            }}
            className={`opacity-0 group-hover:opacity-100 transition-opacity px-1 ${
              layer.visible ? "text-gray-500 hover:text-gray-300" : "text-gray-600 hover:text-gray-400"
            }`}
          >
            {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        ) : (
          <span className="w-6" />
        )}
      </div>

      {/* Children */}
      {hasChildren &&
        expanded &&
        layer.children!.map((child) => (
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

// ━━━ Main Panel ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TicketLayersPanelProps {
  onOpenSection: (section: string) => void;
  onHoverSection: (section: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function TicketLayersPanel({
  onOpenSection,
  onHoverSection,
  collapsed,
  onToggleCollapse,
}: TicketLayersPanelProps) {
  const layers = useLayers();
  const toggleVisibility = useToggleVisibility();
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const visibleCount = layers.filter((l) => l.visible).length;

  // Collapsed "slim" mode
  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex w-8 flex-col items-center justify-center py-4 gap-2 border-l border-gray-800/60 bg-gray-900/40 hover:bg-gray-800/40 transition-colors cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="size-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-[9px] text-gray-500 [writing-mode:vertical-lr]">Layers</span>
      </button>
    );
  }

  return (
    <div className="hidden lg:flex shrink-0 w-56 flex-col border-l border-gray-800/60 bg-gray-900/40">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/40">
        <span className="text-[11px] font-semibold text-gray-400 tracking-wide">
          LAYERS
          <span className="ml-1 text-[10px] text-gray-600">{visibleCount}/{layers.length}</span>
        </span>
        <button
          onClick={onToggleCollapse}
          className="text-gray-600 hover:text-gray-400 transition-colors"
          title="Collapse panel"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Layer tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {layers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            depth={0}
            hoveredLayer={hoveredLayer}
            onHover={(id) => {
              setHoveredLayer(id);
              const l = layers.find((x) => x.id === id);
              onHoverSection(l?.section ?? null);
            }}
            onLeave={() => {
              setHoveredLayer(null);
              onHoverSection(null);
            }}
            onClick={onOpenSection}
            onToggle={toggleVisibility}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-gray-800/40 text-[9px] text-gray-600 flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-primary-400/80" />
          Visible
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-gray-600/40" />
          Empty
        </span>
      </div>
    </div>
  );
}
