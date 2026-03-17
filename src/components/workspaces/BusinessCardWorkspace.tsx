// =============================================================================
// DMSuite — Business Card Workspace (AI-First Wizard)
// Multi-step wizard flow replacing the legacy panel-heavy interface.
// This is the default export imported by the tool page.
// =============================================================================

"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBusinessCardWizard, type WizardStep } from "@/stores/business-card-wizard";

import WizardStepIndicator from "./business-card/WizardStepIndicator";
import StepLogoUpload from "./business-card/StepLogoUpload";
import StepDetails from "./business-card/StepDetails";
import StepBrief from "./business-card/StepBrief";
import StepGeneration from "./business-card/StepGeneration";
import StepEditor from "./business-card/StepEditor";
import StepExport from "./business-card/StepExport";

// ---------------------------------------------------------------------------
// Animation variants (Section 5 of the blueprint)
// ---------------------------------------------------------------------------

const stepVariants = {
  enter: (direction: "forward" | "backward") => ({
    y: direction === "forward" ? 60 : -60,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: (direction: "forward" | "backward") => ({
    y: direction === "forward" ? -60 : 60,
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// ---------------------------------------------------------------------------
// Step renderer
// ---------------------------------------------------------------------------

function StepContent({ step }: { step: WizardStep }) {
  switch (step) {
    case 1:
      return <StepLogoUpload />;
    case 2:
      return <StepDetails />;
    case 3:
      return <StepBrief />;
    case 4:
      return <StepGeneration />;
    case 5:
      return <StepEditor />;
    case 6:
      return <StepExport />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main Workspace
// ---------------------------------------------------------------------------

export default function BusinessCardWorkspace() {
  const { currentStep, stepDirection, resetWizard } = useBusinessCardWizard();

  const handleStartOver = useCallback(() => {
    if (confirm("Start a new business card design? Your current progress will be cleared.")) {
      resetWizard();
    }
  }, [resetWizard]);

  // Step 5 (editor) gets full-screen treatment — escapes all page chrome
  const isEditorStep = currentStep === 5;

  return (
    <div className={
      isEditorStep
        ? "fixed inset-0 z-50 flex flex-col bg-gray-950 text-white overflow-hidden"
        : "flex flex-col h-full bg-gray-950 text-white overflow-hidden"
    }>
      {/* Top bar with step indicator */}
      {!isEditorStep && (
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 border-b border-gray-800/50 bg-gray-900/40 backdrop-blur-sm relative z-10"
        >
          <div className="flex-1" />
          <WizardStepIndicator />
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleStartOver}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Start Over
            </button>
          </div>
        </motion.header>
      )}

      {/* Step content with AnimatePresence */}
      <div className={isEditorStep ? "flex-1 overflow-hidden relative" : "flex-1 overflow-y-auto relative"}>
        <AnimatePresence mode="wait" custom={stepDirection}>
          <motion.div
            key={currentStep}
            custom={stepDirection}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className={isEditorStep ? "h-full" : "h-full py-6"}
          >
            <StepContent step={currentStep} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
