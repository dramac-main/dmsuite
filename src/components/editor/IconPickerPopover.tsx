"use client";

// =============================================================================
// DMSuite — Icon Picker Popover
// Floating popover with search, category tabs, and grid of canvas-drawn icons.
// Used by: LayerPropertiesPanel (icon layer editing), EditorToolbar (Add Icon).
// =============================================================================

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ICON_CATEGORIES, searchIcons, getIconsByCategory, drawIcon,
  type IconMeta,
} from "@/lib/icon-library";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IconPickerPopoverProps {
  /** Currently selected icon ID (if any) */
  currentIconId?: string;
  /** Called when user picks an icon */
  onSelect: (iconId: string) => void;
  /** Optional trigger — if omitted, a default button is rendered */
  trigger?: React.ReactNode;
  /** Additional className for the trigger wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Icon Cell — renders one icon onto a small canvas
// ---------------------------------------------------------------------------

function IconCell({
  icon,
  isSelected,
  onClick,
}: {
  icon: IconMeta;
  isSelected: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 44 * dpr;
    canvas.height = 44 * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 44, 44);
    drawIcon(ctx, icon.id, 22, 22, 20, isSelected ? "#a3e635" : "#d1d5db");
  }, [icon.id, isSelected]);

  return (
    <button
      type="button"
      onClick={onClick}
      title={icon.label}
      className={`w-11 h-11 rounded-md flex items-center justify-center transition-all ${
        isSelected
          ? "ring-2 ring-primary-500 bg-primary-500/10"
          : "hover:bg-gray-700/50"
      }`}
    >
      <canvas
        ref={canvasRef}
        width={44}
        height={44}
        className="w-11 h-11 pointer-events-none"
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IconPickerPopover({
  currentIconId,
  onSelect,
  trigger,
  className = "",
}: IconPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Filtered icons
  const icons = useMemo(() => {
    if (search.trim()) {
      return searchIcons(search);
    }
    if (activeCategory) {
      return getIconsByCategory(activeCategory);
    }
    return searchIcons(""); // all icons
  }, [search, activeCategory]);

  const handleSelect = useCallback((iconId: string) => {
    onSelect(iconId);
    setOpen(false);
    setSearch("");
  }, [onSelect]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger ?? (
          <button
            type="button"
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-200 hover:border-primary-500 transition-colors"
          >
            {currentIconId ? (
              <IconPreview iconId={currentIconId} size={16} />
            ) : (
              <span className="w-4 h-4 rounded bg-gray-700 flex items-center justify-center text-[8px] text-gray-500">?</span>
            )}
            <span className="flex-1 text-left truncate">
              {currentIconId ?? "Choose icon…"}
            </span>
            <svg viewBox="0 0 24 24" className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-800">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveCategory(null); }}
              placeholder="Search icons…"
              autoFocus
              className="w-full px-2.5 py-1.5 rounded bg-gray-800 border border-gray-700 text-xs text-gray-200 placeholder:text-gray-600 outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Category tabs */}
          {!search.trim() && (
            <div className="flex gap-1 px-2 py-1.5 overflow-x-auto border-b border-gray-800 scrollbar-none">
              <CategoryPill
                label="All"
                active={activeCategory === null}
                onClick={() => setActiveCategory(null)}
              />
              {ICON_CATEGORIES.map((cat) => (
                <CategoryPill
                  key={cat.id}
                  label={cat.label.split(" ")[0]}
                  active={activeCategory === cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                />
              ))}
            </div>
          )}

          {/* Icon grid */}
          <div className="grid grid-cols-6 gap-0.5 p-2 max-h-72 overflow-y-auto">
            {icons.map((icon) => (
              <IconCell
                key={icon.id}
                icon={icon}
                isSelected={icon.id === currentIconId}
                onClick={() => handleSelect(icon.id)}
              />
            ))}
            {icons.length === 0 && (
              <div className="col-span-6 py-8 text-center text-gray-600 text-xs">
                No icons found
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-2 py-1.5 border-t border-gray-800 text-[9px] text-gray-600 text-right">
            {icons.length} icons
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small icon preview using canvas
// ---------------------------------------------------------------------------

function IconPreview({ iconId, size = 16 }: { iconId: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    drawIcon(ctx, iconId, size / 2, size / 2, size * 0.8, "#d1d5db");
  }, [iconId, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="pointer-events-none shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

// ---------------------------------------------------------------------------
// Category pill button
// ---------------------------------------------------------------------------

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap transition-colors shrink-0 ${
        active
          ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
          : "text-gray-500 hover:text-gray-300 hover:bg-gray-800 border border-transparent"
      }`}
    >
      {label}
    </button>
  );
}
