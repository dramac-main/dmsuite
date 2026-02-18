"use client";

// =============================================================================
// DMSuite — Align & Distribute Toolbar Bar
// Horizontal bar with alignment, distribution, and spacing actions.
// Works with the current editor selection.
// =============================================================================

import React, { useCallback } from "react";
import { useEditorStore } from "@/stores/editor";
import { createAlignCommand, createDistributeCommand, createSpaceEvenlyCommand } from "@/lib/editor/align-distribute";
import type { AlignAxis, DistributeAxis } from "@/lib/editor/align-distribute";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AlignDistributeBar() {
  const doc = useEditorStore((s) => s.doc);
  const execute = useEditorStore((s) => s.execute);
  const selectedIds = doc.selection.ids;

  const handleAlign = useCallback((axis: AlignAxis) => {
    const cmd = createAlignCommand(doc, selectedIds, axis);
    if (cmd) execute(cmd);
  }, [doc, selectedIds, execute]);

  const handleDistribute = useCallback((axis: DistributeAxis) => {
    const cmd = createDistributeCommand(doc, selectedIds, axis);
    if (cmd) execute(cmd);
  }, [doc, selectedIds, execute]);

  const handleSpaceEvenly = useCallback((axis: DistributeAxis) => {
    const cmd = createSpaceEvenlyCommand(doc, selectedIds, axis);
    if (cmd) execute(cmd);
  }, [doc, selectedIds, execute]);

  if (selectedIds.length === 0) return null;

  const canDistribute = selectedIds.length >= 3;

  return (
    <div className="flex items-center gap-0.5">
      {/* Divider */}
      <div className="h-5 w-px bg-gray-700 mx-1" />

      {/* Align */}
      <AlignBtn onClick={() => handleAlign("left")} title="Align left" disabled={false}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="2" width="1.5" height="10" rx="0.5" /><rect x="4" y="3" width="8" height="3" rx="0.5" /><rect x="4" y="8" width="5" height="3" rx="0.5" /></svg>
      </AlignBtn>
      <AlignBtn onClick={() => handleAlign("center-h")} title="Align center horizontally" disabled={false}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="6.25" y="1" width="1.5" height="12" rx="0.5" /><rect x="2" y="3" width="10" height="3" rx="0.5" /><rect x="3.5" y="8" width="7" height="3" rx="0.5" /></svg>
      </AlignBtn>
      <AlignBtn onClick={() => handleAlign("right")} title="Align right" disabled={false}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="11.5" y="2" width="1.5" height="10" rx="0.5" /><rect x="2" y="3" width="8" height="3" rx="0.5" /><rect x="5" y="8" width="5" height="3" rx="0.5" /></svg>
      </AlignBtn>

      <div className="h-4 w-px bg-gray-800 mx-0.5" />

      <AlignBtn onClick={() => handleAlign("top")} title="Align top" disabled={false}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="10" height="1.5" rx="0.5" /><rect x="3" y="4" width="3" height="8" rx="0.5" /><rect x="8" y="4" width="3" height="5" rx="0.5" /></svg>
      </AlignBtn>
      <AlignBtn onClick={() => handleAlign("center-v")} title="Align center vertically" disabled={false}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="6.25" width="12" height="1.5" rx="0.5" /><rect x="3" y="2" width="3" height="10" rx="0.5" /><rect x="8" y="3.5" width="3" height="7" rx="0.5" /></svg>
      </AlignBtn>
      <AlignBtn onClick={() => handleAlign("bottom")} title="Align bottom" disabled={false}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="11.5" width="10" height="1.5" rx="0.5" /><rect x="3" y="2" width="3" height="8" rx="0.5" /><rect x="8" y="5" width="3" height="5" rx="0.5" /></svg>
      </AlignBtn>

      {/* Distribute — only for 3+ layers */}
      {canDistribute && (
        <>
          <div className="h-4 w-px bg-gray-800 mx-0.5" />
          <AlignBtn onClick={() => handleDistribute("horizontal")} title="Distribute horizontally" disabled={false}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="3" width="2" height="8" rx="0.5" /><rect x="6" y="3" width="2" height="8" rx="0.5" /><rect x="11" y="3" width="2" height="8" rx="0.5" /></svg>
          </AlignBtn>
          <AlignBtn onClick={() => handleDistribute("vertical")} title="Distribute vertically" disabled={false}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="3" y="1" width="8" height="2" rx="0.5" /><rect x="3" y="6" width="8" height="2" rx="0.5" /><rect x="3" y="11" width="8" height="2" rx="0.5" /></svg>
          </AlignBtn>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

function AlignBtn({ onClick, title, disabled, children }: {
  onClick: () => void;
  title: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-1 rounded text-gray-400 hover:text-primary-400 hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
