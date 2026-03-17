// =============================================================================
// DMSuite — Sales Document Workspace V2 (AI-First Wizard → Editor)
// Multi-step wizard: Doc Type → Business → Client → Line Items → Payment → Design → Editor
// Step 6 transitions to full-screen 3-panel editor.
// Accepts optional initialDocumentType for direct routing from tools.
// =============================================================================

"use client";

import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useInvoiceWizard,
  type InvoiceWizardStep,
} from "@/stores/invoice-wizard";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import type { SalesDocumentType } from "@/lib/invoice/schema";
import InvoiceWizardStepIndicator from "./invoice-designer/InvoiceWizardStepIndicator";
import StepDocumentType from "./invoice-designer/StepDocumentType";
import StepBusiness from "./invoice-designer/StepBusiness";
import StepClient from "./invoice-designer/StepClient";
import StepLineItems from "./invoice-designer/StepLineItems";
import StepPayment from "./invoice-designer/StepPayment";
import StepDesign from "./invoice-designer/StepDesign";
import StepEditor from "./invoice-designer/StepEditor";

// ── Animation variants ──

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

// ── Step renderer ──

function StepContent({ step }: { step: InvoiceWizardStep }) {
  switch (step) {
    case 0:
      return <StepDocumentType />;
    case 1:
      return <StepBusiness />;
    case 2:
      return <StepClient />;
    case 3:
      return <StepLineItems />;
    case 4:
      return <StepPayment />;
    case 5:
      return <StepDesign />;
    case 6:
      return <StepEditor />;
    default:
      return null;
  }
}

// =============================================================================

interface Props {
  initialDocumentType?: SalesDocumentType;
}

export default function InvoiceDesignerWorkspaceV2({ initialDocumentType }: Props) {
  const step = useInvoiceWizard((s) => s.step);
  const stepDirection = useInvoiceWizard((s) => s.direction);
  const reset = useInvoiceWizard((s) => s.reset);
  const goToStep = useInvoiceWizard((s) => s.goToStep);
  const setDocumentType = useInvoiceEditor((s) => s.setDocumentType);

  // If opened from a specific tool (e.g. quote-estimate), pre-select that type and skip step 0
  useEffect(() => {
    if (initialDocumentType) {
      setDocumentType(initialDocumentType);
      // Jump to step 1 (Business) if currently on step 0
      if (step === 0) {
        goToStep(1);
      }
    }
  }, [initialDocumentType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartOver = useCallback(() => {
    if (confirm("Start a new document? Your current progress will be cleared.")) {
      reset();
    }
  }, [reset]);

  const isEditorStep = step === 6;

  return (
    <div
      className={
        isEditorStep
          ? "fixed inset-0 z-50 flex flex-col bg-gray-950 text-white overflow-hidden"
          : "flex flex-col h-full bg-gray-950 text-white overflow-hidden"
      }
    >
      {/* Top bar with step indicator — hidden on editor step */}
      {!isEditorStep && (
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 border-b border-gray-800/50 bg-gray-900/40 backdrop-blur-sm relative z-10"
        >
          <div className="flex-1" />
          <InvoiceWizardStepIndicator />
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
      <div
        className={
          isEditorStep
            ? "flex-1 overflow-hidden relative"
            : "flex-1 overflow-y-auto relative"
        }
      >
        <AnimatePresence mode="wait" custom={stepDirection}>
          <motion.div
            key={step}
            custom={stepDirection}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className={isEditorStep ? "h-full" : "h-full py-6"}
          >
            <StepContent step={step} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
