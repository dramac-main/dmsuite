// =============================================================================
// DMSuite — Sales Document Wizard Store
// Manages wizard navigation (Steps 0-6).
// Step 0: Document Type, 1: Business, 2: Client, 3: Line Items,
// 4: Payment, 5: Design, 6: Editor
// Uses sessionStorage persist (resets on tab close).
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InvoiceWizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const INVOICE_WIZARD_STEPS: { id: InvoiceWizardStep; label: string; description: string }[] = [
  { id: 0, label: "Document Type", description: "Choose your sales document type" },
  { id: 1, label: "Your Business", description: "Business name, address & branding" },
  { id: 2, label: "Client Info",   description: "Who are you billing?" },
  { id: 3, label: "Line Items",    description: "Products, services & pricing" },
  { id: 4, label: "Payment",       description: "Payment details & terms" },
  { id: 5, label: "Design",        description: "Template, colors & fonts" },
  { id: 6, label: "Editor",        description: "Preview, refine & export" },
];

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

interface InvoiceWizardState {
  step: InvoiceWizardStep;
  direction: "forward" | "backward";

  // Navigation
  goToStep: (step: InvoiceWizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useInvoiceWizard = create<InvoiceWizardState>()(
  persist(
    (set, get) => ({
      step: 0,
      direction: "forward",

      goToStep: (step) =>
        set({
          step,
          direction: step > get().step ? "forward" : "backward",
        }),

      nextStep: () => {
        const current = get().step;
        if (current < 6) {
          set({ step: (current + 1) as InvoiceWizardStep, direction: "forward" });
        }
      },

      prevStep: () => {
        const current = get().step;
        if (current > 0) {
          set({ step: (current - 1) as InvoiceWizardStep, direction: "backward" });
        }
      },

      reset: () => set({ step: 0, direction: "forward" }),
    }),
    {
      name: "dmsuite-invoice-wizard",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
