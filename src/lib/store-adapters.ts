// =============================================================================
// DMSuite — Store Adapters
// Centralized registry of get/set snapshot functions for each tool's store.
// Used by the project data system to snapshot and restore workspace state.
// =============================================================================

import type { StoreAdapter } from "@/hooks/useProjectData";

// ---------------------------------------------------------------------------
// Lazy store imports — only loaded when adapter is first used
// ---------------------------------------------------------------------------

function getContractAdapter(): StoreAdapter {
  const { useContractEditor } = require("@/stores/contract-editor");
  const { createDefaultContractForm } = require("@/lib/contract/schema");
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
    },
  };
}

function getInvoiceAdapter(): StoreAdapter {
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
    },
  };
}

function getResumeAdapter(): StoreAdapter {
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
    },
  };
}

function getSalesBookAdapter(): StoreAdapter {
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
    },
  };
}

// ---------------------------------------------------------------------------
// Generic adapter for tools that don't have dedicated stores
// Uses a simple key-value store in the project data
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
