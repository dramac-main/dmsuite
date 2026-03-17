// =============================================================================
// DMSuite — Invoice Wizard Step Indicator
// Visual breadcrumb/stepper for the 6-step invoice creation wizard.
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useInvoiceWizard, INVOICE_WIZARD_STEPS } from "@/stores/invoice-wizard";

export default function InvoiceWizardStepIndicator() {
  const currentStep = useInvoiceWizard((s) => s.step);
  const goToStep = useInvoiceWizard((s) => s.goToStep);

  // Only show steps 0-5 in the indicator (step 6 is full-screen editor)
  const visibleSteps = INVOICE_WIZARD_STEPS.filter((s) => s.id < 6);

  return (
    <nav className="flex items-center gap-1 py-2.5">
      {visibleSteps.map((step, i) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const isClickable = step.id < currentStep;

        return (
          <div key={step.id} className="flex items-center gap-1">
            <button
              onClick={() => isClickable && goToStep(step.id as 0 | 1 | 2 | 3 | 4)}
              disabled={!isClickable}
              className={`relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                isActive
                  ? "bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/30"
                  : isCompleted
                  ? "text-gray-400 hover:text-gray-200 cursor-pointer"
                  : "text-gray-600 cursor-default"
              }`}
            >
              {/* Step number / check */}
              <span
                className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
                  isActive
                    ? "bg-primary-500 text-gray-950"
                    : isCompleted
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-800/60 text-gray-600"
                }`}
              >
                {isCompleted ? (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.id + 1
                )}
              </span>

              {/* Label visible on md+ */}
              <span className="hidden md:inline">{step.label}</span>

              {/* Active pulse */}
              {isActive && (
                <motion.div
                  layoutId="invoice-step-active"
                  className="absolute inset-0 rounded-full ring-1 ring-primary-500/40"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>

            {/* Connector */}
            {i < visibleSteps.length - 1 && (
              <div
                className={`w-4 h-px ${
                  step.id < currentStep ? "bg-primary-500/40" : "bg-gray-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
