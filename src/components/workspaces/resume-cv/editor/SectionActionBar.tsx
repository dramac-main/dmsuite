// =============================================================================
// DMSuite — Section Action Bar
// Floating per-section action bar that appears on hover.
// AI Rewrite, Shorten, Expand, Regenerate, Hide, Drag actions.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Inline SVG Icons ──

function IconRefresh({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconScissors({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

function IconMaximize({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function IconSparkles({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}

function IconEyeOff({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconGripVertical({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Action definitions
// ---------------------------------------------------------------------------

export type SectionAction =
  | "rewrite"
  | "shorten"
  | "expand"
  | "regenerate"
  | "hide"
  | "drag";

interface ActionDef {
  id: SectionAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}

const ACTIONS: ActionDef[] = [
  { id: "rewrite", label: "Rewrite", icon: IconSparkles, className: "hover:text-primary-400 hover:bg-primary-500/10" },
  { id: "shorten", label: "Shorten", icon: IconScissors, className: "hover:text-blue-400 hover:bg-blue-500/10" },
  { id: "expand", label: "Expand", icon: IconMaximize, className: "hover:text-green-400 hover:bg-green-500/10" },
  { id: "regenerate", label: "Regenerate", icon: IconRefresh, className: "hover:text-yellow-400 hover:bg-yellow-500/10" },
  { id: "hide", label: "Hide", icon: IconEyeOff, className: "hover:text-red-400 hover:bg-red-500/10" },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface SectionActionBarProps {
  sectionKey: string;
  sectionTitle: string;
  isVisible?: boolean;
  onAction: (sectionKey: string, action: SectionAction) => void;
  /** Optional drag handle attributes from @dnd-kit */
  dragHandleProps?: Record<string, unknown>;
}

export default function SectionActionBar({
  sectionKey,
  sectionTitle,
  isVisible = false,
  onAction,
  dragHandleProps,
}: SectionActionBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 rounded-lg bg-gray-900/95 border border-gray-700/60 shadow-xl px-1.5 py-1 backdrop-blur-md"
        >
          {/* Drag handle */}
          {dragHandleProps && (
            <button
              {...dragHandleProps}
              className="rounded p-1 text-gray-500 cursor-grab active:cursor-grabbing hover:text-gray-300 transition-colors"
              title="Drag to reorder"
            >
              <IconGripVertical />
            </button>
          )}

          {/* Action buttons */}
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(sectionKey, action.id)}
              className={`rounded p-1 text-gray-500 transition-all ${action.className}`}
              title={`${action.label} ${sectionTitle}`}
            >
              <action.icon />
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Hook: Section hover tracking
// ---------------------------------------------------------------------------

/**
 * Hook for tracking which section is hovered in the preview.
 * Returns the active section key and mouse event handlers.
 */
export function useSectionHover() {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const onSectionMouseEnter = useCallback((sectionKey: string) => {
    setHoveredSection(sectionKey);
  }, []);

  const onSectionMouseLeave = useCallback(() => {
    setHoveredSection(null);
  }, []);

  return { hoveredSection, onSectionMouseEnter, onSectionMouseLeave };
}
