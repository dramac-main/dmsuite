"use client";

import { type ReactNode, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

/* ── Tooltip ─────────────────────────────────────────────────
   Hover/focus tooltip with configurable position.
   Usage:
     <Tooltip content="Hello world">
       <button>Hover me</button>
     </Tooltip>
   ──────────────────────────────────────────────────────────── */

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          className={cn(
            "absolute z-600 px-2.5 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150",
            positionClasses[position],
            className
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}
