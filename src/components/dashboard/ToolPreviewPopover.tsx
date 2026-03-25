"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { type Tool } from "@/data/tools";
import { getIcon } from "@/components/icons";
import { getToolCreditCost } from "@/data/credit-costs";

interface ToolPreviewPopoverProps {
  tool: Tool;
  categoryId: string;
  categoryName: string;
  children: ReactNode;
}

/**
 * Wraps tool links with a delayed hover popover showing extended tool info.
 * 400ms delay before show, hides immediately on mouse leave.
 */
export default function ToolPreviewPopover({ tool, categoryId, categoryName, children }: ToolPreviewPopoverProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleEnter = () => {
    timerRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 280;
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      // Keep within viewport
      if (left < 8) left = 8;
      if (left + popoverWidth > window.innerWidth - 8) left = window.innerWidth - 8 - popoverWidth;
      const top = rect.top - 8; // above the element
      setPos({ top, left });
      setShow(true);
    }, 400);
  };

  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  };

  const Icon = getIcon(tool.icon);
  const creditCost = getToolCreditCost(tool.id);
  const isReady = tool.status === "ready";

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="contents"
    >
      {children}
      {mounted && show && createPortal(
        <div
          className="fixed z-[300] pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-150"
          style={{ top: pos.top, left: pos.left, transform: "translateY(-100%)" }}
        >
          <div className="w-[280px] rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                <Icon className="size-5 text-primary-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{tool.name}</p>
                <p className="text-[10px] text-gray-400">{categoryName}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">{tool.description}</p>
            <div className="flex items-center gap-2 text-[10px]">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                isReady ? "bg-success/15 text-success" : tool.status === "beta" ? "bg-warning/15 text-warning" : "bg-info/15 text-info"
              }`}>
                {isReady ? "Ready" : tool.status === "beta" ? "Beta" : "Coming Soon"}
              </span>
              {creditCost > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-secondary-500/10 text-secondary-400">
                  {creditCost} credits
                </span>
              )}
              <span className="ml-auto text-gray-500">Hover to preview</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
