// =============================================================================
// DMSuite — Resume Diff Overlay
// Shows AI revision preview with Accept/Reject before committing.
// Displays additions (green) and removals (red strikethrough).
// =============================================================================

"use client";

import { useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeEditor } from "@/stores/resume-editor";
import { useResumeEditorUI } from "@/stores/resume-editor-ui";
import {
  computeDiffFromOperations,
  buildDiffSummary,
  type DiffChange,
  type DiffSegment,
} from "@/lib/resume/diff-utils";

// ── Inline SVG Icons ──

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconEye({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconAlertTriangle({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Inline Diff Renderer
// ---------------------------------------------------------------------------

function InlineDiffText({ segments }: { segments: DiffSegment[] }) {
  return (
    <span>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "equal":
            return <span key={i} className="text-gray-300">{seg.text}</span>;
          case "added":
            return (
              <span key={i} className="bg-green-500/20 text-green-300 px-0.5 rounded-sm">
                {seg.text}
              </span>
            );
          case "removed":
            return (
              <span key={i} className="bg-red-500/20 text-red-400 line-through px-0.5 rounded-sm opacity-70">
                {seg.text}
              </span>
            );
        }
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Change Item
// ---------------------------------------------------------------------------

function ChangeItem({ change }: { change: DiffChange }) {
  const typeColors: Record<string, string> = {
    added: "text-green-400 bg-green-500/10",
    removed: "text-red-400 bg-red-500/10",
    modified: "text-blue-400 bg-blue-500/10",
    moved: "text-yellow-400 bg-yellow-500/10",
  };

  const typeLabels: Record<string, string> = {
    added: "Added",
    removed: "Removed",
    modified: "Modified",
    moved: "Moved",
  };

  return (
    <div className="rounded-lg border border-gray-800/60 bg-gray-900/60 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${typeColors[change.type]}`}>
          {typeLabels[change.type]}
        </span>
        <span className="text-xs text-gray-400">{change.label}</span>
      </div>

      {/* Inline diff for modifications */}
      {change.segments && change.segments.length > 0 ? (
        <div className="text-xs leading-relaxed">
          <InlineDiffText segments={change.segments} />
        </div>
      ) : (
        <>
          {change.before && (
            <div className="text-xs bg-red-500/5 rounded px-2 py-1 text-red-400/80 line-through">
              {truncate(change.before, 200)}
            </div>
          )}
          {change.after && (
            <div className="text-xs bg-green-500/5 rounded px-2 py-1 text-green-400/80">
              {truncate(change.after, 200)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface DiffOverlayProps {
  originalResume: import("@/lib/resume/schema").ResumeData;
  patches: import("fast-json-patch").Operation[];
  rejectedPatches: Array<{ op: import("fast-json-patch").Operation; reason: string }>;
  warnings: string[];
  summary: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function DiffOverlay({
  originalResume,
  patches,
  rejectedPatches,
  warnings,
  summary,
  onAccept,
  onReject,
}: DiffOverlayProps) {
  const changes = useMemo(
    () => computeDiffFromOperations(originalResume, patches),
    [originalResume, patches]
  );

  const diffSummary = useMemo(() => buildDiffSummary(changes), [changes]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-x-0 top-0 z-30 bg-gray-950/95 border-b border-gray-800/60 backdrop-blur-md"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/40">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-200">
              AI made {diffSummary.totalChanges} change{diffSummary.totalChanges !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-gray-500">{summary}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAccept}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-green-500"
            >
              <IconCheck className="w-3.5 h-3.5" />
              Accept All
            </button>
            <button
              onClick={onReject}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 border border-gray-700 transition-all hover:bg-gray-700"
            >
              <IconX className="w-3.5 h-3.5" />
              Reject All
            </button>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="px-4 py-2 bg-yellow-500/5 border-b border-yellow-500/20">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-yellow-400">
                <IconAlertTriangle />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Rejected ops */}
        {rejectedPatches.length > 0 && (
          <div className="px-4 py-2 bg-red-500/5 border-b border-red-500/20">
            <div className="text-xs text-red-400 font-medium mb-1">
              {rejectedPatches.length} operation{rejectedPatches.length !== 1 ? "s" : ""} rejected:
            </div>
            {rejectedPatches.slice(0, 3).map((rp, i) => (
              <div key={i} className="text-xs text-red-400/70 ml-4">
                {rp.reason}
              </div>
            ))}
            {rejectedPatches.length > 3 && (
              <div className="text-xs text-red-400/50 ml-4">
                ... and {rejectedPatches.length - 3} more
              </div>
            )}
          </div>
        )}

        {/* Changes list */}
        <div className="max-h-64 overflow-y-auto p-4 space-y-2">
          {changes.map((change) => (
            <ChangeItem key={change.id} change={change} />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}
