// =============================================================================
// DMSuite — Store Adapters
// Centralized registry of get/set snapshot functions for each tool's store.
// Used by the project data system to snapshot and restore workspace state.
//
// CRITICAL: resetStore() must BOTH reset in-memory state AND nuke the Zustand
// persist localStorage key. This prevents stale data from a previous project
// from bleeding into a new project via the persist middleware's rehydration.
// =============================================================================

import type { StoreAdapter } from "@/hooks/useProjectData";

// ---------------------------------------------------------------------------
// Persist storage helper — removes the localStorage key that Zustand persist
// middleware uses, so that a clean reset isn't overwritten on next page load.
// ---------------------------------------------------------------------------

function nukePersistStorage(storageKey: string) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  } catch {
    // localStorage may be unavailable in SSR or incognito
  }
}

// ---------------------------------------------------------------------------
// Lazy store imports — only loaded when adapter is first used
// ---------------------------------------------------------------------------

function getContractAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useContractEditor } = require("@/stores/contract-editor");
  return {
    getSnapshot: () => {
      const { form } = useContractEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useContractEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useContractEditor.getState().resetForm();
      // Nuke localStorage so persist doesn't rehydrate old data
      nukePersistStorage("dmsuite-contract");
    },
  };
}

function getInvoiceAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useInvoiceEditor } = require("@/stores/invoice-editor");
  return {
    getSnapshot: () => {
      const { invoice } = useInvoiceEditor.getState();
      return { invoice };
    },
    restoreSnapshot: (data) => {
      if (data.invoice) {
        useInvoiceEditor.getState().setInvoice(data.invoice as never);
      }
    },
    resetStore: () => {
      useInvoiceEditor.getState().resetInvoice();
      nukePersistStorage("dmsuite-invoice");
    },
  };
}

function getResumeAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useResumeEditor } = require("@/stores/resume-editor");
  return {
    getSnapshot: () => {
      const { resume } = useResumeEditor.getState();
      return { resume };
    },
    restoreSnapshot: (data) => {
      if (data.resume) {
        useResumeEditor.getState().setResume(data.resume as never);
      }
    },
    resetStore: () => {
      useResumeEditor.getState().resetResume();
      nukePersistStorage("dmsuite-resume");
    },
  };
}

function getSalesBookAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useSalesBookEditor } = require("@/stores/sales-book-editor");
  return {
    getSnapshot: () => {
      const { form } = useSalesBookEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useSalesBookEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useSalesBookEditor.getState().resetForm();
      nukePersistStorage("dmsuite-sales-book");
    },
  };
}

function getCoverLetterAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useCoverLetterEditor } = require("@/stores/cover-letter-editor");
  return {
    getSnapshot: () => {
      const { form } = useCoverLetterEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useCoverLetterEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useCoverLetterEditor.getState().resetForm();
      nukePersistStorage("dmsuite-cover-letter");
    },
  };
}

function getWorksheetAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorksheetEditor } = require("@/stores/worksheet-editor");
  return {
    getSnapshot: () => {
      const { form } = useWorksheetEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useWorksheetEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useWorksheetEditor.getState().resetForm();
      nukePersistStorage("dmsuite-worksheet-designer");
    },
  };
}

function getBusinessPlanAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useBusinessPlanEditor } = require("@/stores/business-plan-editor");
  return {
    getSnapshot: () => {
      const { form } = useBusinessPlanEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useBusinessPlanEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useBusinessPlanEditor.getState().resetForm();
      nukePersistStorage("dmsuite-business-plan");
    },
  };
}

function getMenuDesignerAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useMenuDesignerEditor } = require("@/stores/menu-designer-editor");
  return {
    getSnapshot: () => {
      const { form } = useMenuDesignerEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useMenuDesignerEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useMenuDesignerEditor.getState().resetForm();
      nukePersistStorage("dmsuite-menu-designer");
    },
  };
}

function getIDBadgeAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useIDBadgeEditor } = require("@/stores/id-badge-editor");
  return {
    getSnapshot: () => {
      const { form } = useIDBadgeEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useIDBadgeEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useIDBadgeEditor.getState().resetForm();
      nukePersistStorage("dmsuite-id-badge");
    },
  };
}

function getCertificateAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useCertificateEditor } = require("@/stores/certificate-editor");
  return {
    getSnapshot: () => {
      const { form } = useCertificateEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useCertificateEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useCertificateEditor.getState().resetForm();
      nukePersistStorage("dmsuite-certificate");
    },
  };
}

function getDiplomaAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useDiplomaEditor } = require("@/stores/diploma-editor");
  return {
    getSnapshot: () => {
      const { form } = useDiplomaEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useDiplomaEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useDiplomaEditor.getState().resetForm();
      nukePersistStorage("dmsuite-diploma-editor");
    },
  };
}

function getTicketAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useTicketEditor } = require("@/stores/ticket-editor");
  return {
    getSnapshot: () => {
      const { form } = useTicketEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useTicketEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useTicketEditor.getState().resetForm();
      nukePersistStorage("dmsuite-ticket-designer");
    },
  };
}

// ---------------------------------------------------------------------------
// Generic adapter for tools that don't have dedicated stores
// ---------------------------------------------------------------------------

function getGenericAdapter(): StoreAdapter {
  return {
    getSnapshot: () => ({}),
    restoreSnapshot: () => {},
    resetStore: () => {},
  };
}

// ---------------------------------------------------------------------------
// Adapter registry
// ---------------------------------------------------------------------------

const _adapterCache: Record<string, StoreAdapter> = {};

/** Master mapping: toolId → adapter factory */
const ADAPTER_FACTORIES: Record<string, () => StoreAdapter> = {
  // Document editors (invoice family shares one store)
  "contract-template": getContractAdapter,
  "invoice-designer": getInvoiceAdapter,
  "quote-estimate": getInvoiceAdapter,
  "receipt-designer": getInvoiceAdapter,
  "purchase-order": getInvoiceAdapter,
  "delivery-note": getInvoiceAdapter,
  "credit-note": getInvoiceAdapter,
  "proforma-invoice": getInvoiceAdapter,
  "resume-cv": getResumeAdapter,
  "cover-letter": getCoverLetterAdapter,
  "sales-book": getSalesBookAdapter,
  "business-plan": getBusinessPlanAdapter,
  // Design editors
  "menu-designer": getMenuDesignerAdapter,
  "id-badge": getIDBadgeAdapter,
  "certificate": getCertificateAdapter,
  "diploma-designer": getDiplomaAdapter,
  "ticket-designer": getTicketAdapter,
  "worksheet-designer": getWorksheetAdapter,
};

/**
 * Get or create the store adapter for a tool.
 * Returns a generic no-op adapter for tools without dedicated stores.
 * Adapters are cached after first creation.
 */
export function getOrCreateAdapter(toolId: string): StoreAdapter {
  if (_adapterCache[toolId]) return _adapterCache[toolId];

  const factory = ADAPTER_FACTORIES[toolId];
  const adapter = factory ? factory() : getGenericAdapter();
  _adapterCache[toolId] = adapter;
  return adapter;
}

/** Get all tool IDs that have dedicated store adapters */
export function getAdapterToolIds(): string[] {
  return Object.keys(ADAPTER_FACTORIES);
}
