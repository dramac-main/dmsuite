"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface HelpTooltipProps {
  text: string;
  /** Preferred position — auto-flips if tooltip would go off-screen */
  position?: "top" | "bottom" | "left" | "right";
}

export default function HelpTooltip({ text, position = "bottom" }: HelpTooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [resolvedPosition, setResolvedPosition] = useState(position);
  const ref = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const updatePos = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const gap = 8;
    const tooltipH = 60; // estimate
    const tooltipW = 224; // max-w-56 = 224px

    // Smart positioning: check if preferred position would clip viewport
    let finalPos = position;
    if (position === "top" && r.top - tooltipH - gap < 0) finalPos = "bottom";
    if (position === "bottom" && r.bottom + tooltipH + gap > window.innerHeight) finalPos = "top";
    if (position === "left" && r.left - tooltipW - gap < 0) finalPos = "right";
    if (position === "right" && r.right + tooltipW + gap > window.innerWidth) finalPos = "left";

    setResolvedPosition(finalPos);

    let top = 0, left = 0;
    switch (finalPos) {
      case "top":
        top = r.top - gap;
        left = r.left + r.width / 2;
        break;
      case "bottom":
        top = r.bottom + gap;
        left = r.left + r.width / 2;
        break;
      case "left":
        top = r.top + r.height / 2;
        left = r.left - gap;
        break;
      case "right":
        top = r.top + r.height / 2;
        left = r.right + gap;
        break;
    }

    // Clamp horizontal so tooltip doesn't go off-screen
    if (finalPos === "top" || finalPos === "bottom") {
      const halfW = tooltipW / 2;
      if (left - halfW < 8) left = halfW + 8;
      if (left + halfW > window.innerWidth - 8) left = window.innerWidth - halfW - 8;
    }

    setPos({ top, left });
  };

  const handleEnter = () => { updatePos(); setShow(true); };

  const transform = {
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0)",
    left: "translate(-100%, -50%)",
    right: "translate(0, -50%)",
  }[resolvedPosition];

  return (
    <>
      <button
        ref={ref}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        onFocus={handleEnter}
        onBlur={() => setShow(false)}
        className="inline-flex items-center justify-center size-4 rounded-full text-[9px] font-bold text-gray-400 dark:text-gray-500 border border-gray-300/50 dark:border-gray-600/50 hover:text-primary-500 hover:border-primary-500/30 transition-colors cursor-help"
        aria-label={text}
        type="button"
      >
        ?
      </button>
      {mounted && show && createPortal(
        <div
          className="fixed z-[350] pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform }}
        >
          <div className="max-w-56 px-3 py-2 rounded-lg bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-xl text-xs text-gray-200 leading-relaxed">
            {text}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
