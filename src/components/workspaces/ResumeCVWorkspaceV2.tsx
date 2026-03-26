// =============================================================================
// DMSuite — Resume & CV Workspace (AI-First Wizard → Editor)
// Multi-step wizard flow mirroring BusinessCardWorkspace pattern.
// Step 7 transitions to full-screen editor with 3-panel layout.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeCVWizard, type WizardStep } from "@/stores/resume-cv-wizard";
import WizardStepIndicator from "./resume-cv/WizardStepIndicator";
import StepPersonal from "./resume-cv/StepPersonal";
import StepTargetRole from "./resume-cv/StepTargetRole";
import StepExperience from "./resume-cv/StepExperience";
import StepEducationSkills from "./resume-cv/StepEducationSkills";
import StepBrief from "./resume-cv/StepBrief";
import StepGeneration from "./resume-cv/StepGeneration";
import StepEditor from "./resume-cv/StepEditor";
import StepUpload from "./resume-cv/StepUpload";

// ---------------------------------------------------------------------------
// Animation variants — same easing as BusinessCardWorkspace
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
    case 0:
      return <StepUpload />;
    case 1:
      return <StepPersonal />;
    case 2:
      return <StepTargetRole />;
    case 3:
      return <StepExperience />;
    case 4:
      return <StepEducationSkills />;
    case 5:
      return <StepBrief />;
    case 6:
      return <StepGeneration />;
    case 7:
      return <StepEditor />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main Workspace
// ---------------------------------------------------------------------------

export default function ResumeCVWorkspace() {
  const { currentStep, stepDirection, resetWizard } = useResumeCVWizard();

  // Dispatch step-based progress: steps 0-6 = wizard (0→80%), step 7 = editor (80%)
  const prevStepRef = useRef<number>(-1);
  useEffect(() => {
    if (currentStep === prevStepRef.current) return;
    prevStepRef.current = currentStep;
    // Steps 0-6 are wizard steps, step 7 is the editor
    // Wizard progress: (step / 7) * 80, capped at 80% (editor adds remaining via milestones)
    const wizardProgress = Math.round((Math.min(currentStep, 6) / 7) * 80);
    const progress = currentStep >= 7 ? 80 : wizardProgress;
    window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { progress } }));
    // Input milestone once past step 1 (personal info)
    if (currentStep >= 2) {
      window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "input" } }));
    }
    // Content milestone when generation is reached or editor is open
    if (currentStep >= 7) {
      window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "content" } }));
    }
  }, [currentStep]);

  const handleStartOver = useCallback(() => {
    if (
      confirm(
        "Start a new resume? Your current progress will be cleared."
      )
    ) {
      resetWizard();
    }
  }, [resetWizard]);

  // Step 7 (editor) gets full-screen treatment
  const isEditorStep = currentStep === 7;
  const isUploadStep = currentStep === 0;

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white overflow-hidden">
      {/* Top bar with step indicator — hidden on step 0 (upload) and step 7 (editor) */}
      {!isEditorStep && !isUploadStep && (
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
