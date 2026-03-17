// =============================================================================
// DMSuite — Generation Loading Animation
// Hardcoded status ticker with setInterval. Each step slides up with shimmer.
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Status messages — cycle through on a fixed interval
// ---------------------------------------------------------------------------
const STATUS_STEPS = [
  { text: "Reading your brand details",      detail: "Analyzing name, title, and company" },
  { text: "Studying your logo",              detail: "Extracting colors and brand identity" },
  { text: "Understanding your industry",     detail: "Matching design tone to your field" },
  { text: "Selecting the color palette",     detail: "Choosing colors that represent your brand" },
  { text: "Choosing typography",             detail: "Pairing fonts for impact and readability" },
  { text: "Composing the layout",            detail: "Positioning name, title, and contact info" },
  { text: "Placing contact details",         detail: "Arranging phone, email, and social links" },
  { text: "Designing the back side",         detail: "Building the brand showcase" },
  { text: "Adding finishing touches",        detail: "Fine-tuning spacing and alignment" },
  { text: "Polishing for print",             detail: "Ensuring everything is pixel-perfect" },
  { text: "Almost there",                    detail: "Packaging your completed design" },
];

const STEP_INTERVAL_MS = 2200;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GenerationLoadingAnimation({
  className = "",
}: {
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Simple interval — tick forward every STEP_INTERVAL_MS, clamp at last step
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) =>
        prev < STATUS_STEPS.length - 1 ? prev + 1 : prev
      );
    }, STEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const renderStep = useCallback((idx: number, isActive: boolean) => {
    const step = STATUS_STEPS[idx];
    if (!step) return null;

    if (isActive) {
      return (
        <motion.div
          key={`active-${idx}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start gap-3 py-2"
        >
          <div className="mt-0.5 shrink-0">
            <motion.div
              className="w-5 h-5 rounded-full bg-primary-500/15 border border-primary-500/30 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
            </motion.div>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 relative overflow-hidden">
            <div className="relative">
              <span className="text-sm font-medium text-white">{step.text}</span>
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(163,230,53,0.08) 40%, rgba(255,255,255,0.12) 50%, rgba(163,230,53,0.08) 60%, transparent 100%)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" }}
              />
            </div>
            <span className="text-xs text-gray-500">{step.detail}</span>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={`done-${idx}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 py-1"
      >
        <div className="w-5 h-5 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500/60">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span className="text-sm text-gray-600">{step.text}</span>
      </motion.div>
    );
  }, []);

  const progress = Math.min(((activeIndex + 0.5) / STATUS_STEPS.length) * 100, 96);

  return (
    <div className={`flex flex-col items-center justify-center gap-6 w-full max-w-lg px-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <motion.div
          className="w-2.5 h-2.5 rounded-full bg-primary-400"
          animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="text-sm font-medium text-gray-300 tracking-wide">
          AI Designer is working
        </span>
        <div className="flex gap-0.5 ml-1">
          {[0, 1, 2].map((d) => (
            <motion.span
              key={d}
              className="w-1 h-1 rounded-full bg-gray-500"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Status ticker */}
      <div className="w-full max-h-72 overflow-hidden">
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: activeIndex }, (_, i) => renderStep(i, false))}
          {renderStep(activeIndex, true)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="w-full h-1 rounded-full bg-gray-800/80 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-primary-600 via-primary-400 to-primary-500 relative"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          <span className="text-[11px] text-gray-500 tabular-nums">
            {Math.floor(progress)}%
          </span>
          <span className="text-[11px] text-gray-600">
            Step {Math.min(activeIndex + 1, STATUS_STEPS.length)} of{" "}
            {STATUS_STEPS.length}
          </span>
        </div>
      </div>
    </div>
  );
}
