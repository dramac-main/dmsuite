// =============================================================================
// DMSuite — Sales Book Wizard Step Indicator
// Visual progress indicator for the 6-step blank form designer wizard.
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useSalesBookWizard, type SalesBookWizardStep } from "@/stores/sales-book-wizard";

const STEP_LABELS: Record<SalesBookWizardStep, string> = {
  0: "Type",
  1: "Branding",
  2: "Layout",
  3: "Print",
  4: "Style",
  5: "Preview",
};

export default function SBWizardStepIndicator() {
  const step = useSalesBookWizard((s) => s.step);
  const goToStep = useSalesBookWizard((s) => s.goToStep);

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      {([0, 1, 2, 3, 4, 5] as SalesBookWizardStep[]).map((s) => {
        const isActive = s === step;
        const isPast = s < step;
        return (
          <button
            key={s}
            onClick={() => goToStep(s)}
            className="flex items-center gap-1 group"
            title={STEP_LABELS[s]}
          >
            <motion.div
              className={`flex items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                isActive
                  ? "w-6 h-6 bg-primary-500 text-gray-950"
                  : isPast
                    ? "w-5 h-5 bg-primary-500/20 text-primary-400 group-hover:bg-primary-500/30"
                    : "w-5 h-5 bg-gray-800 text-gray-600 group-hover:bg-gray-700"
              }`}
              layout
            >
              {isPast ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                s + 1
              )}
            </motion.div>
            {isActive && (
              <motion.span
                layoutId="sb-step-label"
                className="text-[10px] text-primary-400 font-medium"
              >
                {STEP_LABELS[s]}
              </motion.span>
            )}
            {s < 5 && <div className={`w-4 h-px mx-0.5 ${isPast ? "bg-primary-500/30" : "bg-gray-800"}`} />}
          </button>
        );
      })}
    </div>
  );
}
