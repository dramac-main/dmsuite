// =============================================================================
// DMSuite — Wizard Step Indicator
// Persistent top navigation showing step progress with click-to-navigate.
// Uses proper SVG icons — no emoji.
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useBusinessCardWizard, type WizardStep } from "@/stores/business-card-wizard";

// ── SVG icon components (inline, themed) ──
function IconUpload({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconUser({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconPen({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
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

function IconSliders({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function IconDownload({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const STEPS: { step: WizardStep; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { step: 1, label: "Logo",     Icon: IconUpload },
  { step: 2, label: "Details",  Icon: IconUser },
  { step: 3, label: "Brief",    Icon: IconPen },
  { step: 4, label: "Generate", Icon: IconSparkles },
  { step: 5, label: "Edit",     Icon: IconSliders },
  { step: 6, label: "Export",   Icon: IconDownload },
];

export default function WizardStepIndicator() {
  const { currentStep, highestCompletedStep, goToStep } = useBusinessCardWizard();

  return (
    <nav className="flex items-center justify-center gap-1 sm:gap-2 py-4 px-2 sm:px-6 overflow-x-auto">
      {STEPS.map(({ step, label, Icon }, i) => {
        const isActive = step === currentStep;
        const isCompleted = step <= highestCompletedStep;
        const isAccessible = isCompleted || step === currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Connector line */}
            {i > 0 && (
              <div
                className={`h-px w-4 sm:w-8 lg:w-10 mx-0.5 sm:mx-1 transition-colors duration-300 ${
                  step <= highestCompletedStep + 1
                    ? "bg-primary-500/50"
                    : "bg-gray-700"
                }`}
              />
            )}

            {/* Step dot/pill */}
            <button
              onClick={() => isAccessible && goToStep(step)}
              disabled={!isAccessible}
              className={`group relative flex items-center gap-1.5 transition-all duration-300 rounded-full ${
                isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-40"
              }`}
              aria-label={`Step ${step}: ${label}`}
              aria-current={isActive ? "step" : undefined}
            >
              <motion.div
                layout
                className={`flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-1.5 text-xs font-medium transition-colors duration-300 ${
                  isActive
                    ? "bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/40"
                    : isCompleted
                    ? "bg-gray-700/60 text-gray-300"
                    : "bg-gray-800/40 text-gray-500"
                }`}
              >
                {/* Icon or checkmark */}
                <motion.span
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  className="leading-none shrink-0"
                >
                  {isCompleted && !isActive ? (
                    <IconCheck className="text-primary-400" />
                  ) : (
                    <Icon />
                  )}
                </motion.span>

                {/* Label — show on active, hide on sm for inactive */}
                <motion.span
                  initial={false}
                  animate={{
                    width: isActive ? "auto" : 0,
                    opacity: isActive ? 1 : 0,
                  }}
                  className="overflow-hidden whitespace-nowrap hidden sm:inline"
                >
                  {label}
                </motion.span>

                {/* Always show label on larger screens */}
                <span className="hidden lg:inline">{!isActive ? label : ""}</span>
              </motion.div>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
