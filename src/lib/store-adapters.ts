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
      nukePersistStorage("dmsuite-contract");
    },
    subscribe: (cb) => useContractEditor.subscribe(cb),
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
    subscribe: (cb) => useInvoiceEditor.subscribe(cb),
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
    subscribe: (cb) => useResumeEditor.subscribe(cb),
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
    subscribe: (cb) => useSalesBookEditor.subscribe(cb),
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
    subscribe: (cb) => useCoverLetterEditor.subscribe(cb),
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
    subscribe: (cb) => useWorksheetEditor.subscribe(cb),
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
    subscribe: (cb) => useBusinessPlanEditor.subscribe(cb),
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
    subscribe: (cb) => useMenuDesignerEditor.subscribe(cb),
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
    subscribe: (cb) => useIDBadgeEditor.subscribe(cb),
  };
}

function getCertificateAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useCertificateEditor } = require("@/stores/certificate-editor");
  return {
    getSnapshot: () => {
      const { meta, selectedTemplateId, documentSnapshot } = useCertificateEditor.getState();
      return { meta, selectedTemplateId, documentSnapshot };
    },
    restoreSnapshot: (data) => {
      if (data.meta) {
        useCertificateEditor.getState().setMeta(data.meta as never);
      }
      if (data.selectedTemplateId) {
        useCertificateEditor.getState().setTemplateId(data.selectedTemplateId as string);
      }
      if (data.documentSnapshot) {
        useCertificateEditor.getState().setDocumentSnapshot(data.documentSnapshot as never);
        // Also push to shared editor store
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { useEditorStore } = require("@/stores/editor");
          useEditorStore.getState().setDoc(data.documentSnapshot as never);
        } catch { /* editor store may not be loaded yet */ }
      }
    },
    resetStore: () => {
      useCertificateEditor.getState().resetToDefaults();
      // Certificate v2 uses sessionStorage
      try {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem("dmsuite-certificate-v2");
        }
      } catch { /* SSR/incognito */ }
      // Also reset shared editor store
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useEditorStore } = require("@/stores/editor");
        useEditorStore.getState().resetDoc();
      } catch { /* editor store may not be loaded yet */ }
    },
    subscribe: (cb) => useCertificateEditor.subscribe(cb),
  };
}

function getDiplomaAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useDiplomaEditor } = require("@/stores/diploma-editor");
  return {
    getSnapshot: () => {
      const { form, accentColorLocked } = useDiplomaEditor.getState();
      return { form, accentColorLocked };
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
    subscribe: (cb) => useDiplomaEditor.subscribe(cb),
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
    subscribe: (cb) => useTicketEditor.subscribe(cb),
  };
}

// ---------------------------------------------------------------------------
// Canvas editor adapter — for tools that use the shared useEditorStore
// (poster, flyer, banner-ad, etc.)
// No persist middleware, so no localStorage key to nuke. But the store is
// global, so a project switch MUST reset it or old canvas data leaks.
// ---------------------------------------------------------------------------

function getCanvasEditorAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEditorStore } = require("@/stores/editor");
  return {
    getSnapshot: () => {
      const { doc } = useEditorStore.getState();
      return { doc };
    },
    restoreSnapshot: (data) => {
      if (data.doc) {
        useEditorStore.getState().setDoc(data.doc as never);
      }
    },
    resetStore: () => {
      useEditorStore.getState().resetDoc();
      // No persist — no localStorage key to nuke
    },
    subscribe: (cb) => useEditorStore.subscribe(cb),
  };
}

function getBusinessCardAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useBusinessCardWizard } = require("@/stores/business-card-wizard");
  return {
    getSnapshot: () => {
      const s = useBusinessCardWizard.getState();
      return {
        currentStep: s.currentStep,
        highestCompletedStep: s.highestCompletedStep,
        logo: {
          logoUrl: s.logo.logoUrl,
          logoType: s.logo.logoType,
          iconOnlyUrl: s.logo.iconOnlyUrl,
          logoColors: s.logo.logoColors,
        },
        details: s.details,
        brief: s.brief,
        style: s.style,
        batchMode: s.batchMode,
        generation: {
          generatedDesigns: s.generation.generatedDesigns,
          generatedBackDesigns: s.generation.generatedBackDesigns,
          designDescriptions: s.generation.designDescriptions,
          selectedDesignIndex: s.generation.selectedDesignIndex,
        },
        documents: {
          frontDoc: s.documents.frontDoc,
          backDoc: s.documents.backDoc,
          currentSide: s.documents.currentSide,
        },
      };
    },
    restoreSnapshot: (data) => {
      const state = useBusinessCardWizard.getState();
      if (data.details) state.setDetails(data.details as never);
      if (data.brief) {
        const b = data.brief as Record<string, unknown>;
        if (b.description !== undefined) state.setBriefDescription(b.description as string);
        if (b.companyDescription !== undefined) state.setCompanyDescription(b.companyDescription as string);
        if (b.frontOnly !== undefined) state.setFrontOnly(b.frontOnly as boolean);
        if (b.cardSize !== undefined) state.setCardSize(b.cardSize as never);
      }
      if (data.logo) {
        const l = data.logo as Record<string, unknown>;
        if (l.logoUrl !== undefined) state.setLogoUrl(l.logoUrl as string | null);
        if (l.logoType !== undefined) state.setLogoType(l.logoType as never);
        if (l.iconOnlyUrl !== undefined) state.setIconOnlyUrl(l.iconOnlyUrl as string | null);
        if (l.logoColors) state.setLogoColors(l.logoColors as string[]);
      }
      if (data.style) {
        const st = data.style as Record<string, unknown>;
        if (st.selectedMood !== undefined) state.setSelectedMood(st.selectedMood as never);
        if (st.fontPreference !== undefined) state.setFontPreference(st.fontPreference as never);
        if (st.colorOverride !== undefined) state.setColorOverride(st.colorOverride as string | null);
        if (st.surpriseMe !== undefined) state.setSurpriseMe(st.surpriseMe as boolean);
      }
      if (data.generation) {
        const g = data.generation as Record<string, unknown>;
        if (Array.isArray(g.generatedDesigns) && g.generatedDesigns.length > 0) {
          state.setGeneratedDesigns(
            g.generatedDesigns as never[],
            g.designDescriptions as string[] | undefined,
            g.generatedBackDesigns as never[] | undefined,
          );
          if (typeof g.selectedDesignIndex === "number") state.selectDesign(g.selectedDesignIndex);
        }
      }
      if (data.documents) {
        const d = data.documents as Record<string, unknown>;
        if (d.frontDoc) state.setFrontDoc(d.frontDoc as never);
        if (d.backDoc) state.setBackDoc(d.backDoc as never);
        if (d.currentSide) state.setCurrentSide(d.currentSide as never);
      }
      if (typeof data.batchMode === "boolean") state.setBatchMode(data.batchMode);
      // Restore step position last so UI renders correctly
      if (typeof data.currentStep === "number") {
        state.goToStep(1 as never); // Reset first to allow forward navigation
        // Set highestCompletedStep so goToStep allows navigation
        useBusinessCardWizard.setState({
          highestCompletedStep: data.highestCompletedStep as never ?? data.currentStep as never,
          currentStep: data.currentStep as never,
        });
      }
    },
    resetStore: () => {
      useBusinessCardWizard.getState().resetWizard();
      // Business card wizard uses sessionStorage
      try {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem("dmsuite-business-card-wizard");
        }
      } catch { /* SSR/incognito */ }
      // Also reset shared editor store (used by StepEditor canvas)
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useEditorStore } = require("@/stores/editor");
        useEditorStore.getState().resetDoc();
      } catch { /* editor store may not be loaded yet */ }
    },
    subscribe: (cb) => useBusinessCardWizard.subscribe(cb),
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
  "business-card": getBusinessCardAdapter,
  "menu-designer": getMenuDesignerAdapter,
  "id-badge": getIDBadgeAdapter,
  "certificate": getCertificateAdapter,
  "diploma-designer": getDiplomaAdapter,
  "ticket-designer": getTicketAdapter,
  "worksheet-designer": getWorksheetAdapter,
  // Canvas editors (shared useEditorStore)
  "poster": getCanvasEditorAdapter,
  "flyer": getCanvasEditorAdapter,
  "banner-ad": getCanvasEditorAdapter,
  "social-media-post": getCanvasEditorAdapter,
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
