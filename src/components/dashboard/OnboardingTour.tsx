"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

/* ── Tour step definition ── */
interface TourStep {
  /** querySelector for the target element to highlight */
  target: string;
  /** Title shown in the tooltip */
  title: string;
  /** Description text */
  body: string;
  /** Tooltip placement relative to target */
  placement: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="search"]',
    title: "Powerful Search",
    body: "Find any of 250+ AI tools instantly. Try typing a keyword or press Ctrl+K from anywhere.",
    placement: "bottom",
  },
  {
    target: '[data-tour="favorites"]',
    title: "Star Your Favorites",
    body: "Hover over any tool card and tap the star to pin it here for one-click access.",
    placement: "bottom",
  },
  {
    target: '[data-tour="categories"]',
    title: "Browse by Category",
    body: "Tools are organized into 8 categories — expand any section to explore.",
    placement: "top",
  },
  {
    target: '[data-tour="notifications"]',
    title: "Stay Updated",
    body: "Credit changes, new features, and activity — all in your notification center.",
    placement: "bottom",
  },
  {
    target: '[data-tour="sidebar"]',
    title: "Quick Navigation",
    body: "Pin the sidebar open or let it auto-collapse. Jump between categories and settings.",
    placement: "right",
  },
];

const STORAGE_KEY = "dmsuite-onboarding-complete";

/* ── Tooltip position calculator ── */
function getTooltipStyle(
  rect: DOMRect,
  placement: TourStep["placement"]
): React.CSSProperties {
  const gap = 12;
  switch (placement) {
    case "bottom":
      return {
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      };
    case "top":
      return {
        top: rect.top - gap,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
      };
    case "right":
      return {
        top: rect.top + rect.height / 2,
        left: rect.right + gap,
        transform: "translateY(-50%)",
      };
    case "left":
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - gap,
        transform: "translate(-100%, -50%)",
      };
  }
}

export default function OnboardingTour() {
  const [step, setStep] = useState(-1); // -1 = not started / finished
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

  /* Only show once per browser */
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    // Small delay so dashboard elements render first
    const t = setTimeout(() => setStep(0), 1200);
    return () => clearTimeout(t);
  }, []);

  /* Update tooltip + spotlight when step changes */
  const updatePosition = useCallback(() => {
    if (step < 0 || step >= TOUR_STEPS.length) return;
    const el = document.querySelector(TOUR_STEPS[step].target);
    if (!el) {
      // If target missing, skip step
      setStep((s) => (s + 1 < TOUR_STEPS.length ? s + 1 : -1));
      return;
    }
    const rect = el.getBoundingClientRect();
    setSpotlightRect(rect);
    setTooltipStyle(getTooltipStyle(rect, TOUR_STEPS[step].placement));
  }, [step]);

  useEffect(() => {
    updatePosition();
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePosition);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updatePosition]);

  const finish = useCallback(() => {
    setStep(-1);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
  }, []);

  const next = useCallback(() => {
    if (step + 1 >= TOUR_STEPS.length) {
      finish();
    } else {
      setStep(step + 1);
    }
  }, [step, finish]);

  if (step < 0 || step >= TOUR_STEPS.length) return null;

  const current = TOUR_STEPS[step];
  const pad = 6;

  return createPortal(
    <div className="fixed inset-0 z-[9999]" aria-modal="true" role="dialog">
      {/* Overlay with spotlight cutout via clip-path */}
      <div
        className="absolute inset-0 bg-black/60 transition-all duration-300"
        onClick={finish}
        style={
          spotlightRect
            ? {
                clipPath: `polygon(
                  0% 0%, 0% 100%, 
                  ${spotlightRect.left - pad}px 100%, 
                  ${spotlightRect.left - pad}px ${spotlightRect.top - pad}px, 
                  ${spotlightRect.right + pad}px ${spotlightRect.top - pad}px, 
                  ${spotlightRect.right + pad}px ${spotlightRect.bottom + pad}px, 
                  ${spotlightRect.left - pad}px ${spotlightRect.bottom + pad}px, 
                  ${spotlightRect.left - pad}px 100%, 
                  100% 100%, 100% 0%
                )`,
              }
            : undefined
        }
      />

      {/* Spotlight ring */}
      {spotlightRect && (
        <div
          className="absolute rounded-xl border-2 border-primary-400 shadow-[0_0_0_4px_rgba(139,92,246,0.2)] pointer-events-none transition-all duration-300"
          style={{
            top: spotlightRect.top - pad,
            left: spotlightRect.left - pad,
            width: spotlightRect.width + pad * 2,
            height: spotlightRect.height + pad * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute w-72 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl p-4 shadow-2xl transition-all duration-300"
        style={tooltipStyle}
      >
        {/* Step counter */}
        <div className="flex items-center gap-1.5 mb-2">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step
                  ? "w-5 bg-primary-400"
                  : i < step
                    ? "w-2 bg-primary-400/50"
                    : "w-2 bg-gray-600"
              }`}
            />
          ))}
          <span className="ml-auto text-[0.625rem] text-gray-500">
            {step + 1}/{TOUR_STEPS.length}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-white mb-1">
          {current.title}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-3">
          {current.body}
        </p>

        <div className="flex items-center justify-between">
          <button
            onClick={finish}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={next}
            className="text-xs font-semibold text-gray-950 bg-primary-400 hover:bg-primary-300 px-3.5 py-1.5 rounded-lg transition-colors"
          >
            {step + 1 === TOUR_STEPS.length ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
