// =============================================================================
// DMSuite — Sales Book Wizard Store
// Step navigation for the blank form designer wizard.
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------
// 0 = Document Type
// 1 = Company Branding
// 2 = Form Layout
// 3 = Print & Serial
// 4 = Style & Template
// 5 = Preview & Export (full-screen)

export type SalesBookWizardStep = 0 | 1 | 2 | 3 | 4 | 5;

const MAX_STEP: SalesBookWizardStep = 5;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface SalesBookWizardState {
  step: SalesBookWizardStep;
  direction: "forward" | "backward";

  goToStep: (step: SalesBookWizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useSalesBookWizard = create<SalesBookWizardState>()(
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
        const cur = get().step;
        if (cur < MAX_STEP) {
          set({ step: (cur + 1) as SalesBookWizardStep, direction: "forward" });
        }
      },

      prevStep: () => {
        const cur = get().step;
        if (cur > 0) {
          set({ step: (cur - 1) as SalesBookWizardStep, direction: "backward" });
        }
      },

      reset: () => set({ step: 0, direction: "forward" }),
    }),
    {
      name: "sales-book-wizard",
      storage: {
        getItem: (name) => {
          const raw = sessionStorage.getItem(name);
          return raw ? JSON.parse(raw) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    },
  ),
);
