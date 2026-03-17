// =============================================================================
// DMSuite — Resume Wizard Step Indicator
// 7-step indicator: Personal → Target → Experience → Education → Brief → Generate → Editor
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useResumeCVWizard, type WizardStep } from "@/stores/resume-cv-wizard";

// ── Inline SVG Icons ──

function IconUser({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconTarget({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconBriefcase({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function IconGraduationCap({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
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

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const STEPS: {
  step: WizardStep;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { step: 1, label: "Personal", Icon: IconUser },
  { step: 2, label: "Target", Icon: IconTarget },
  { step: 3, label: "Experience", Icon: IconBriefcase },
  { step: 4, label: "Education", Icon: IconGraduationCap },
  { step: 5, label: "Brief", Icon: IconPen },
  { step: 6, label: "Generate", Icon: IconSparkles },
  { step: 7, label: "Editor", Icon: IconSliders },
];

export default function WizardStepIndicator() {
  const { currentStep, highestCompletedStep, goToStep } = useResumeCVWizard();

  // Don't show the indicator on step 0 (upload choice)
  if (currentStep === 0) return null;

  return (
    <nav className="flex items-center justify-center gap-1 sm:gap-2 py-4 px-2 sm:px-6 overflow-x-auto">
      {STEPS.map(({ step, label, Icon }, i) => {
        const isActive = step === currentStep;
        const isCompleted = step <= highestCompletedStep && step < currentStep;
        const isAccessible =
          step <= highestCompletedStep + 1 || step === currentStep;

        // Don't show step 7 in the indicator (it's the full-screen editor)
        if (step === 7) return null;

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
                isAccessible
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-40"
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

                <span className="hidden lg:inline">
                  {!isActive ? label : ""}
                </span>
              </motion.div>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
