"use client";

import { type ReactNode, useRef, useState } from "react";
import { IconZoomIn, IconZoomOut, IconDownload } from "@/components/icons";

// =============================================================================
// DMSuite — Sticky Canvas Layout
// Shared layout component for all canvas-based workspaces.
// Provides the professional sticky-canvas-center, scrollable-sidebars pattern.
// Canvas stays fixed in the center while tool panels scroll independently.
// =============================================================================

interface StickyCanvasLayoutProps {
  /** Left panel content (settings, tools, AI controls) */
  leftPanel: ReactNode;
  /** Right panel content (optional — layers, export, properties) */
  rightPanel?: ReactNode;
  /** Canvas ref (used when rendering a raw <canvas>) */
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  /** Custom canvas content (e.g., CanvasEditor) — replaces raw <canvas> */
  canvasSlot?: ReactNode;
  /** Canvas display width (scaled) — only used for raw canvas mode */
  displayWidth?: number;
  /** Canvas display height (scaled) — only used for raw canvas mode */
  displayHeight?: number;
  /** Canvas label (e.g., "Business Card — 1050×600") */
  label?: string;
  /** Toolbar content above canvas */
  toolbar?: ReactNode;
  /** Mobile tab labels — default: ["Canvas", "Settings"] */
  mobileTabs?: string[];
  /** Canvas mouse/touch handlers (raw canvas mode only) */
  canvasHandlers?: {
    onMouseDown?: React.MouseEventHandler;
    onMouseMove?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
  };
  /** Additional actions bar below canvas */
  actionsBar?: ReactNode;
  /** Zoom state (raw canvas mode only — CanvasEditor manages zoom internally) */
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  children?: ReactNode;
}

export default function StickyCanvasLayout({
  leftPanel,
  rightPanel,
  canvasRef,
  canvasSlot,
  displayWidth = 800,
  displayHeight = 600,
  label,
  toolbar,
  mobileTabs = ["Canvas", "Settings"],
  canvasHandlers,
  actionsBar,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  children,
}: StickyCanvasLayoutProps) {
  const [mobileTab, setMobileTab] = useState(0);
  const allTabs = rightPanel
    ? [...mobileTabs, "Details"]
    : mobileTabs;

  return (
    <div>
      {/* ── Mobile Tabs ──────────────────────────── */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {allTabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setMobileTab(i)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
              mobileTab === i
                ? "text-primary-500 border-b-2 border-primary-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: "calc(100vh - 260px)" }}>
        {/* ── Left Panel (Scrollable Settings) ──────── */}
        <div
          className={`w-full lg:w-80 shrink-0 space-y-4 order-2 lg:order-1 lg:overflow-y-auto ${
            mobileTab !== 1 ? "hidden md:block" : ""
          }`}
          style={{ maxHeight: "calc(100vh - 260px)" }}
        >
          {leftPanel}
        </div>

        {/* ── Center Canvas (Sticky) ───────────────── */}
        <div className={`flex-1 min-w-0 order-1 lg:order-2 ${mobileTab !== 0 ? "hidden md:block" : ""}`}>
          <div className="lg:sticky lg:top-4">
            {/* Toolbar row: tools + zoom controls */}
            <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {toolbar}
              </div>
              {/* Zoom controls (only in raw canvas mode — CanvasEditor manages zoom internally) */}
              {!canvasSlot && (
                <div className="flex items-center gap-1">
                  {onZoomOut && (
                    <button
                      onClick={onZoomOut}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                      aria-label="Zoom out"
                    >
                      <IconZoomOut className="size-4" />
                    </button>
                  )}
                  {onZoomFit && (
                    <button
                      onClick={onZoomFit}
                      className="px-2 py-1 rounded-lg text-xs font-mono text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors min-w-12 text-center"
                      title="Fit to view"
                    >
                      {Math.round(zoom * 100)}%
                    </button>
                  )}
                  {onZoomIn && (
                    <button
                      onClick={onZoomIn}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                      aria-label="Zoom in"
                    >
                      <IconZoomIn className="size-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Canvas area */}
            {canvasSlot ? (
              <div
                className="bg-gray-100 dark:bg-gray-800/50 rounded-2xl overflow-hidden flex flex-col"
                style={{ height: "calc(100vh - 330px)" }}
              >
                {canvasSlot}
              </div>
            ) : (
              <div
                className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 overflow-auto"
                style={{ maxHeight: "calc(100vh - 330px)" }}
              >
                <canvas
                  ref={canvasRef}
                  style={{ width: displayWidth * zoom, height: displayHeight * zoom }}
                  className="rounded-lg shadow-lg cursor-crosshair bg-white"
                  role="img"
                  aria-label="Design canvas"
                  {...canvasHandlers}
                />
              </div>
            )}

            {/* Label */}
            {label && (
              <p className="text-xs text-gray-400 text-center mt-2">{label}</p>
            )}

            {/* Actions bar */}
            {actionsBar && (
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                {actionsBar}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel (Scrollable) ─────────────── */}
        {rightPanel && (
          <div
            className={`w-full lg:w-72 shrink-0 order-3 lg:overflow-y-auto ${
              mobileTab !== 2 ? "hidden md:block" : ""
            }`}
            style={{ maxHeight: "calc(100vh - 260px)" }}
          >
            {rightPanel}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
