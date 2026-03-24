// =============================================================================
// DMSuite — Sales Book Section: Custom Blocks
// Add, configure, reorder, toggle, and remove custom blocks (QR codes, text,
// dividers, spacers, images, signature boxes).
// Uses @dnd-kit/sortable for drag-and-drop reordering.
// =============================================================================

"use client";

import { useCallback, useRef, useState } from "react";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BLOCK_TYPES,
  BLOCK_POSITIONS,
  type CustomBlock,
  type CustomBlockType,
  type BlockPosition,
} from "@/lib/sales-book/custom-blocks";

// ---------------------------------------------------------------------------
// Block type icons (small inline SVGs)
// ---------------------------------------------------------------------------

const BLOCK_ICONS: Record<CustomBlockType, React.ReactNode> = {
  "qr-code": (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="8" height="8" rx="1" />
      <rect x="14" y="2" width="8" height="8" rx="1" />
      <rect x="2" y="14" width="8" height="8" rx="1" />
      <rect x="14" y="14" width="4" height="4" />
      <rect x="20" y="14" width="2" height="2" />
      <rect x="14" y="20" width="2" height="2" />
      <rect x="20" y="20" width="2" height="2" />
    </svg>
  ),
  text: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 7V4h16v3" /><path d="M12 4v16" /><path d="M8 20h8" />
    </svg>
  ),
  divider: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  spacer: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 8h18" /><path d="M3 16h18" /><path d="M12 8v8" />
    </svg>
  ),
  image: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  "signature-box": (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 17h18" /><path d="M5 13c2-3 4-5 6-2s4-3 6-1" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Block summary text
// ---------------------------------------------------------------------------

function getBlockSummary(block: CustomBlock): string {
  switch (block.type) {
    case "qr-code":
      return block.data.url || "No URL";
    case "text":
      return block.data.content?.slice(0, 30) || "Empty";
    case "divider":
      return block.data.style;
    case "spacer":
      return `${block.data.height}px`;
    case "image":
      return block.data.src ? "Image set" : "No image";
    case "signature-box":
      return block.data.label || "Signature";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Sortable Block Card
// ---------------------------------------------------------------------------

function SortableBlockCard({
  block,
  isExpanded,
  onToggleExpand,
}: {
  block: CustomBlock;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const updateCustomBlock = useSalesBookEditor((s) => s.updateCustomBlock);
  const removeCustomBlock = useSalesBookEditor((s) => s.removeCustomBlock);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeMeta = BLOCK_TYPES.find((t) => t.type === block.type);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be under 2 MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          updateCustomBlock(block.id, { data: { ...block.data, src: reader.result } as Record<string, unknown> } as Partial<CustomBlock>);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [block.id, block.data, updateCustomBlock],
  );

  const updateData = useCallback(
    (patch: Record<string, unknown>) => {
      updateCustomBlock(block.id, { data: { ...block.data, ...patch } as Record<string, unknown> } as Partial<CustomBlock>);
    },
    [block.id, block.data, updateCustomBlock],
  );

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-gray-700/40 bg-gray-800/40 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-0.5 text-gray-600 hover:text-gray-400 touch-none"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="4" r="2" /><circle cx="16" cy="4" r="2" />
            <circle cx="8" cy="12" r="2" /><circle cx="16" cy="12" r="2" />
            <circle cx="8" cy="20" r="2" /><circle cx="16" cy="20" r="2" />
          </svg>
        </button>

        {/* Type icon */}
        <span className="text-gray-500 shrink-0">{BLOCK_ICONS[block.type]}</span>

        {/* Summary — click to expand */}
        <button
          onClick={onToggleExpand}
          className="flex-1 text-left text-xs text-gray-300 truncate hover:text-gray-100 transition-colors"
        >
          <span className="font-medium">{typeMeta?.label ?? block.type}</span>
          <span className="text-gray-500 ml-1.5">— {getBlockSummary(block)}</span>
        </button>

        {/* Enable/Disable toggle */}
        <button
          onClick={() => updateCustomBlock(block.id, { enabled: !block.enabled })}
          title={block.enabled ? "Disable" : "Enable"}
          className={`p-0.5 rounded transition-colors ${block.enabled ? "text-primary-400 hover:text-primary-300" : "text-gray-600 hover:text-gray-400"}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {block.enabled ? (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            )}
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={() => removeCustomBlock(block.id)}
          className="p-0.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" />
          </svg>
        </button>
      </div>

      {/* Expanded config */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 pt-1 space-y-2.5 border-t border-gray-700/50">
          {/* Position selector */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Position</label>
            <select
              value={block.position}
              onChange={(e) => updateCustomBlock(block.id, { position: e.target.value as BlockPosition })}
              className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-1.5 text-[12px] text-gray-300 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            >
              {BLOCK_POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Alignment</label>
            <div className="flex gap-1.5">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => updateCustomBlock(block.id, { alignment: a })}
                  className={`rounded-xl border px-2.5 py-1.5 text-[12px] font-medium capitalize transition-all ${
                    block.alignment === a
                      ? "border-primary-500/50 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/20"
                      : "border-gray-700/60 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:bg-gray-800/60"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Margins */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Top Margin</label>
              <input
                type="range"
                min={0}
                max={32}
                value={block.marginTop}
                onChange={(e) => updateCustomBlock(block.id, { marginTop: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
              <span className="text-[10px] text-gray-500">{block.marginTop}px</span>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Bottom Margin</label>
              <input
                type="range"
                min={0}
                max={32}
                value={block.marginBottom}
                onChange={(e) => updateCustomBlock(block.id, { marginBottom: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
              <span className="text-[10px] text-gray-500">{block.marginBottom}px</span>
            </div>
          </div>

          {/* Type-specific config */}
          {block.type === "qr-code" && (
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">URL</label>
                <input
                  type="text"
                  value={block.data.url}
                  onChange={(e) => updateData({ url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-1.5 text-[12px] text-gray-300 placeholder:text-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Size ({block.data.size}px)</label>
                <input type="range" min={40} max={200} value={block.data.size} onChange={(e) => updateData({ size: Number(e.target.value) })} className="w-full accent-primary-500" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Caption</label>
                <input
                  type="text"
                  value={block.data.caption}
                  onChange={(e) => updateData({ caption: e.target.value })}
                  placeholder="Scan to visit"
                  className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-1.5 text-[12px] text-gray-300 placeholder:text-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">FG Color</label>
                  <input type="color" value={block.data.fgColor} onChange={(e) => updateData({ fgColor: e.target.value })} className="h-7 w-full rounded border border-gray-700 bg-gray-800 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">BG Color</label>
                  <input type="color" value={block.data.bgColor} onChange={(e) => updateData({ bgColor: e.target.value })} className="h-7 w-full rounded border border-gray-700 bg-gray-800 cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {block.type === "text" && (
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Content</label>
                <textarea
                  value={block.data.content}
                  onChange={(e) => updateData({ content: e.target.value })}
                  placeholder="Enter text..."
                  rows={3}
                  className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-1.5 text-[12px] text-gray-300 placeholder:text-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Font Size ({block.data.fontSize}px)</label>
                <input type="range" min={8} max={24} value={block.data.fontSize} onChange={(e) => updateData({ fontSize: Number(e.target.value) })} className="w-full accent-primary-500" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(["normal", "bold", "800"] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => updateData({ fontWeight: w })}
                    className={`rounded-xl border px-2.5 py-1.5 text-[12px] font-medium capitalize transition-all ${
                      block.data.fontWeight === w
                        ? "border-primary-500/50 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/20"
                        : "border-gray-700/60 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:bg-gray-800/60"
                    }`}
                  >
                    {w === "800" ? "Extra Bold" : w}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Color</label>
                <input type="color" value={block.data.color === "accent" ? "#8b5cf6" : block.data.color} onChange={(e) => updateData({ color: e.target.value })} className="h-7 w-full rounded border border-gray-700 bg-gray-800 cursor-pointer" />
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={block.data.italic} onChange={(e) => updateData({ italic: e.target.checked })} className="accent-primary-500" />
                  <span className="text-xs text-gray-400">Italic</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={block.data.uppercase} onChange={(e) => updateData({ uppercase: e.target.checked })} className="accent-primary-500" />
                  <span className="text-xs text-gray-400">Uppercase</span>
                </label>
              </div>
            </div>
          )}

          {block.type === "divider" && (
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Style</label>
                <div className="flex gap-1.5 flex-wrap">
                  {(["solid", "dashed", "dotted", "double"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateData({ style: s })}
                      className={`rounded-xl border px-2.5 py-1.5 text-[12px] font-medium capitalize transition-all ${
                        block.data.style === s
                          ? "border-primary-500/50 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/20"
                          : "border-gray-700/60 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:bg-gray-800/60"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Thickness ({block.data.thickness}px)</label>
                <input type="range" min={1} max={5} value={block.data.thickness} onChange={(e) => updateData({ thickness: Number(e.target.value) })} className="w-full accent-primary-500" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Width ({block.data.widthPercent}%)</label>
                <input type="range" min={10} max={100} value={block.data.widthPercent} onChange={(e) => updateData({ widthPercent: Number(e.target.value) })} className="w-full accent-primary-500" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Color</label>
                <input type="color" value={block.data.color === "accent" ? "#8b5cf6" : block.data.color} onChange={(e) => updateData({ color: e.target.value })} className="h-7 w-full rounded border border-gray-700 bg-gray-800 cursor-pointer" />
              </div>
            </div>
          )}

          {block.type === "spacer" && (
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Height ({block.data.height}px)</label>
              <input type="range" min={4} max={64} value={block.data.height} onChange={(e) => updateData({ height: Number(e.target.value) })} className="w-full accent-primary-500" />
            </div>
          )}

          {block.type === "image" && (
            <div className="space-y-2">
              {block.data.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={block.data.src} alt="" className="h-16 w-auto rounded object-contain bg-white/5 p-1" />
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 w-full rounded-xl border border-dashed border-gray-700/60 bg-gray-800/30 px-3.5 py-2.5 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors active:scale-[0.97]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {block.data.src ? "Change Image" : "Choose Image"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Width ({block.data.width}px)</label>
                <input type="range" min={40} max={300} value={block.data.width} onChange={(e) => updateData({ width: Number(e.target.value) })} className="w-full accent-primary-500" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Height (0 = auto)</label>
                <input
                  type="number"
                  min={0}
                  max={400}
                  value={block.data.height}
                  onChange={(e) => updateData({ height: Number(e.target.value) })}
                  className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-1.5 text-[12px] text-gray-300 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Opacity</label>
                <input type="range" min={0.1} max={1} step={0.05} value={block.data.opacity} onChange={(e) => updateData({ opacity: Number(e.target.value) })} className="w-full accent-primary-500" />
                <span className="text-[10px] text-gray-500">{Math.round(block.data.opacity * 100)}%</span>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Fit</label>
                <div className="flex gap-1.5">
                  {(["contain", "cover"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => updateData({ objectFit: f })}
                      className={`rounded-xl border px-2.5 py-1.5 text-[12px] font-medium capitalize transition-all ${
                        block.data.objectFit === f
                          ? "border-primary-500/50 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/20"
                          : "border-gray-700/60 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:bg-gray-800/60"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {block.data.caption !== undefined && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Caption</label>
                  <input
                    type="text"
                    value={block.data.caption}
                    onChange={(e) => updateData({ caption: e.target.value })}
                    className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-1.5 text-[12px] text-gray-300 placeholder:text-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>
              )}
            </div>
          )}

          {block.type === "signature-box" && (
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Label</label>
                <input
                  type="text"
                  value={block.data.label}
                  onChange={(e) => updateData({ label: e.target.value })}
                  placeholder="Authorized Signature"
                  className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-1.5 text-[12px] text-gray-300 placeholder:text-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Line Width ({block.data.lineWidth}px)</label>
                <input type="range" min={80} max={300} value={block.data.lineWidth} onChange={(e) => updateData({ lineWidth: Number(e.target.value) })} className="w-full accent-primary-500" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Line Style</label>
                <div className="flex gap-1.5">
                  {(["solid", "dashed", "dotted"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateData({ lineStyle: s })}
                      className={`rounded-xl border px-2.5 py-1.5 text-[12px] font-medium capitalize transition-all ${
                        block.data.lineStyle === s
                          ? "border-primary-500/50 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/20"
                          : "border-gray-700/60 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:bg-gray-800/60"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Section Component
// ---------------------------------------------------------------------------

export default function SBSectionCustomBlocks() {
  const customBlocks = useSalesBookEditor((s) => s.form.customBlocks);
  const addCustomBlock = useSalesBookEditor((s) => s.addCustomBlock);
  const reorderCustomBlocks = useSalesBookEditor((s) => s.reorderCustomBlocks);

  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIndex = customBlocks.findIndex((b) => b.id === active.id);
      const toIndex = customBlocks.findIndex((b) => b.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderCustomBlocks(fromIndex, toIndex);
      }
    },
    [customBlocks, reorderCustomBlocks],
  );

  const handleAddBlock = useCallback(
    (type: CustomBlockType) => {
      const id = addCustomBlock(type);
      setShowTypeSelector(false);
      setExpandedBlockId(id);
    },
    [addCustomBlock],
  );

  return (
    <div className="space-y-3">
      {/* Add Block button + type selector */}
      <div>
        <button
          onClick={() => setShowTypeSelector(!showTypeSelector)}
          className="flex items-center gap-2 w-full rounded-xl border border-dashed border-gray-700/60 bg-gray-800/30 px-3.5 py-2.5 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors active:scale-[0.97]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Block
        </button>

        {showTypeSelector && (
          <div className="grid grid-cols-3 gap-2 mt-2.5">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                onClick={() => handleAddBlock(bt.type)}
                className="flex flex-col items-center gap-1 rounded-xl border border-gray-700/60 bg-gray-800/40 px-2 py-2.5 text-gray-400 hover:border-primary-500/50 hover:text-primary-300 hover:bg-primary-500/5 transition-all active:scale-[0.97]"
              >
                {BLOCK_ICONS[bt.type]}
                <span className="text-[10px]">{bt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {customBlocks.length === 0 && !showTypeSelector && (
        <p className="text-[11px] text-gray-600 text-center py-2">
          Add QR codes, text, dividers, and more to your form
        </p>
      )}

      {/* Block list with DnD */}
      {customBlocks.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={customBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {customBlocks.map((block) => (
                <SortableBlockCard
                  key={block.id}
                  block={block}
                  isExpanded={expandedBlockId === block.id}
                  onToggleExpand={() => setExpandedBlockId(expandedBlockId === block.id ? null : block.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
