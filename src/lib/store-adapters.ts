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
  "contract-template": getContractAdapter,
  "invoice-designer": getInvoiceAdapter,
  "quote-estimate": getInvoiceAdapter,       // Uses same invoice store
  "receipt-designer": getInvoiceAdapter,
  "purchase-order": getInvoiceAdapter,
  "delivery-note": getInvoiceAdapter,
  "credit-note": getInvoiceAdapter,
  "proforma-invoice": getInvoiceAdapter,
  "resume-cv": getResumeAdapter,
  "sales-book": getSalesBookAdapter,
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
