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

function getResumeV2Adapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useResumeV2Editor } = require("@/stores/resume-v2-editor");
  return {
    getSnapshot: () => {
      const { data } = useResumeV2Editor.getState();
      return { data };
    },
    restoreSnapshot: (snap) => {
      if (snap.data) {
        useResumeV2Editor.getState().initialize(snap.data as never);
      }
    },
    resetStore: () => {
      useResumeV2Editor.getState().resetResume();
      nukePersistStorage("dmsuite-resume-v2");
    },
    subscribe: (cb) => useResumeV2Editor.subscribe(cb),
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
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return {
        fabricJson: s.fabricJson,
        canvasWidth: s.canvasWidth,
        canvasHeight: s.canvasHeight,
      };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || 794,
          (data.canvasHeight as number) || 1123,
        );
      }
    },
    resetStore: () => {
      useFabricProjectStore.getState().reset();
    },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

function getIDBadgeAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return {
        fabricJson: s.fabricJson,
        canvasWidth: s.canvasWidth,
        canvasHeight: s.canvasHeight,
      };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || 1013,
          (data.canvasHeight as number) || 638,
        );
      }
    },
    resetStore: () => {
      useFabricProjectStore.getState().reset();
    },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

function getCertificateAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return {
        fabricJson: s.fabricJson,
        canvasWidth: s.canvasWidth,
        canvasHeight: s.canvasHeight,
      };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || 3508,
          (data.canvasHeight as number) || 2480,
        );
      }
    },
    resetStore: () => {
      useFabricProjectStore.getState().reset();
    },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

function getDiplomaAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return {
        fabricJson: s.fabricJson,
        canvasWidth: s.canvasWidth,
        canvasHeight: s.canvasHeight,
      };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || 1123,
          (data.canvasHeight as number) || 794,
        );
      }
    },
    resetStore: () => {
      useFabricProjectStore.getState().reset();
    },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

function getTicketAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return {
        fabricJson: s.fabricJson,
        canvasWidth: s.canvasWidth,
        canvasHeight: s.canvasHeight,
      };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || 816,
          (data.canvasHeight as number) || 336,
        );
      }
    },
    resetStore: () => {
      useFabricProjectStore.getState().reset();
    },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

// ---------------------------------------------------------------------------
// Fabric.js adapters for Phase 5 visual design tools
// ---------------------------------------------------------------------------

function getPosterAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return { fabricJson: s.fabricJson, canvasWidth: s.canvasWidth, canvasHeight: s.canvasHeight };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || 794,
          (data.canvasHeight as number) || 1123,
        );
      }
    },
    resetStore: () => { useFabricProjectStore.getState().reset(); },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

function getSocialMediaAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return { fabricJson: s.fabricJson, canvasWidth: s.canvasWidth, canvasHeight: s.canvasHeight };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || 1080,
          (data.canvasHeight as number) || 1080,
        );
      }
    },
    resetStore: () => { useFabricProjectStore.getState().reset(); },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

function getInvitationAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return { fabricJson: s.fabricJson, canvasWidth: s.canvasWidth, canvasHeight: s.canvasHeight };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || 420,
          (data.canvasHeight as number) || 595,
        );
      }
    },
    resetStore: () => { useFabricProjectStore.getState().reset(); },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

function getGreetingCardAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return { fabricJson: s.fabricJson, canvasWidth: s.canvasWidth, canvasHeight: s.canvasHeight };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || 420,
          (data.canvasHeight as number) || 595,
        );
      }
    },
    resetStore: () => { useFabricProjectStore.getState().reset(); },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

function getLetterheadAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return { fabricJson: s.fabricJson, canvasWidth: s.canvasWidth, canvasHeight: s.canvasHeight };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || 595,
          (data.canvasHeight as number) || 842,
        );
      }
    },
    resetStore: () => { useFabricProjectStore.getState().reset(); },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

function getBusinessCardAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return {
        fabricJson: s.fabricJson,
        canvasWidth: s.canvasWidth,
        canvasHeight: s.canvasHeight,
      };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || 1050,
          (data.canvasHeight as number) || 600,
        );
      }
    },
    resetStore: () => {
      useFabricProjectStore.getState().reset();
    },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

// ---------------------------------------------------------------------------
// Fabric.js adapters for Phase 5 Batch 2 visual design tools
// ---------------------------------------------------------------------------

function makeFabricAdapter(defaultW: number, defaultH: number): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useFabricProjectStore } = require("@/stores/fabric-project");
  return {
    getSnapshot: () => {
      const s = useFabricProjectStore.getState();
      if (!s.fabricJson) return {};
      return { fabricJson: s.fabricJson, canvasWidth: s.canvasWidth, canvasHeight: s.canvasHeight };
    },
    restoreSnapshot: (data) => {
      if (typeof data.fabricJson === "string") {
        useFabricProjectStore.getState().setFabricState(
          data.fabricJson as string,
          (data.canvasWidth as number) || defaultW,
          (data.canvasHeight as number) || defaultH,
        );
      }
    },
    resetStore: () => { useFabricProjectStore.getState().reset(); },
    subscribe: (cb) => useFabricProjectStore.subscribe(cb),
  };
}

function getBrochureAdapter(): StoreAdapter { return makeFabricAdapter(842, 595); }
function getStickerAdapter(): StoreAdapter { return makeFabricAdapter(300, 300); }
function getCouponAdapter(): StoreAdapter { return makeFabricAdapter(900, 400); }
function getEnvelopeAdapter(): StoreAdapter { return makeFabricAdapter(624, 312); }
function getSignageAdapter(): StoreAdapter { return makeFabricAdapter(425, 1000); }
function getInfographicAdapter(): StoreAdapter { return makeFabricAdapter(800, 1200); }
function getCalendarAdapter(): StoreAdapter { return makeFabricAdapter(1200, 900); }
function getApparelAdapter(): StoreAdapter { return makeFabricAdapter(500, 600); }
function getPackagingAdapter(): StoreAdapter { return makeFabricAdapter(900, 700); }

// ---------------------------------------------------------------------------
// Presentation adapter (Slidev Presenter, Zustand store)
// ---------------------------------------------------------------------------

function getPresentationAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useSlidevEditor } = require("@/stores/slidev-editor");
  return {
    getSnapshot: () => {
      const { form } = useSlidevEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useSlidevEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useSlidevEditor.getState().resetForm();
      nukePersistStorage("dmsuite-slidev");
    },
    subscribe: (cb) => useSlidevEditor.subscribe(cb),
  };
}

// ---------------------------------------------------------------------------
// VoiceFlow dictation adapter
// ---------------------------------------------------------------------------

function getVoiceFlowAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useVoiceFlowEditor } = require("@/stores/voice-flow-editor");
  return {
    getSnapshot: () => {
      const { form } = useVoiceFlowEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useVoiceFlowEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useVoiceFlowEditor.getState().resetForm();
      nukePersistStorage("dmsuite-voice-flow");
    },
    subscribe: (cb) => useVoiceFlowEditor.subscribe(cb),
  };
}

function getAudioTranscriptionAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAudioTranscriptionEditor } = require("@/stores/audio-transcription-editor");
  return {
    getSnapshot: () => {
      const { form } = useAudioTranscriptionEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useAudioTranscriptionEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useAudioTranscriptionEditor.getState().resetForm();
      nukePersistStorage("dmsuite-audio-transcription");
    },
    subscribe: (cb) => useAudioTranscriptionEditor.subscribe(cb),
  };
}

function getDocumentSignerAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useDocumentSignerEditor } = require("@/stores/document-signer-editor");
  return {
    getSnapshot: () => {
      const { form } = useDocumentSignerEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useDocumentSignerEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useDocumentSignerEditor.getState().resetForm();
      nukePersistStorage("dmsuite-document-signer");
    },
    subscribe: (cb) => useDocumentSignerEditor.subscribe(cb),
  };
}

// ---------------------------------------------------------------------------
// Invoice & Accounting Hub adapter
// ---------------------------------------------------------------------------

function getInvoiceAccountingAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useInvoiceAccountingEditor } = require("@/stores/invoice-accounting-editor");
  return {
    getSnapshot: () => {
      const { form } = useInvoiceAccountingEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useInvoiceAccountingEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useInvoiceAccountingEditor.getState().resetForm();
      nukePersistStorage("dmsuite-invoice-tracker");
    },
    subscribe: (cb) => useInvoiceAccountingEditor.subscribe(cb),
  };
}



// ---------------------------------------------------------------------------
// AI Flow Builder (visual workflow canvas)
// ---------------------------------------------------------------------------

function getAIFlowBuilderAdapter(): StoreAdapter {
  const { useAIFlowBuilderEditor } = require("@/stores/ai-flow-builder-editor");
  return {
    getSnapshot: () => {
      const { form } = useAIFlowBuilderEditor.getState();
      return { form };
    },
    restoreSnapshot: (data: Record<string, unknown>) => {
      if (data.form) {
        useAIFlowBuilderEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useAIFlowBuilderEditor.getState().resetForm();
      nukePersistStorage("dmsuite-ai-flow-builder");
    },
    subscribe: (cb: () => void) => useAIFlowBuilderEditor.subscribe(cb),
  };
}

// ---------------------------------------------------------------------------
// Generic adapter for tools that don't have dedicated stores
// ---------------------------------------------------------------------------

function getRevealPresenterAdapter(): StoreAdapter {
  const { useRevealPresenterEditor } = require("@/stores/reveal-presenter-editor");
  return {
    getSnapshot: () => ({ form: useRevealPresenterEditor.getState().form }),
    restoreSnapshot: (data: Record<string, unknown>) => {
      if (data.form) {
        useRevealPresenterEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useRevealPresenterEditor.getState().resetForm();
      nukePersistStorage("dmsuite-reveal-presenter");
    },
    subscribe: (cb: () => void) => useRevealPresenterEditor.subscribe(cb),
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
    subscribe: () => () => {},
  };
}

function getAIChatAdapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAIChatEditor } = require("@/stores/ai-chat-editor");
  return {
    getSnapshot: () => {
      const { conversations, activeConversationId, model, provider, systemPrompt } = useAIChatEditor.getState();
      return { conversations, activeConversationId, model, provider, systemPrompt };
    },
    restoreSnapshot: (data) => {
      const state = useAIChatEditor.getState();
      if (data.conversations) state.resetStore();
      useAIChatEditor.setState({
        ...(data.conversations ? { conversations: data.conversations as never } : {}),
        ...(data.activeConversationId ? { activeConversationId: data.activeConversationId as string } : {}),
        ...(data.model ? { model: data.model as string } : {}),
        ...(data.provider ? { provider: data.provider as never } : {}),
        ...(data.systemPrompt ? { systemPrompt: data.systemPrompt as string } : {}),
      });
    },
    resetStore: () => {
      useAIChatEditor.getState().resetStore();
      nukePersistStorage("dmsuite-ai-chat");
    },
    subscribe: (cb) => useAIChatEditor.subscribe(cb),
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
  "resume-cv-v2": getResumeV2Adapter,
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
  // Fabric.js visual design editors (Phase 5)
  "poster": getPosterAdapter,
  "flyer": getPosterAdapter,
  "social-media-post": getSocialMediaAdapter,
  "invitation-designer": getInvitationAdapter,
  "greeting-card": getGreetingCardAdapter,
  "letterhead": getLetterheadAdapter,
  // Fabric.js visual design editors (Phase 5 — Batch 2)
  "brochure": getBrochureAdapter,
  "sticker-designer": getStickerAdapter,
  "gift-voucher": getCouponAdapter,
  "envelope": getEnvelopeAdapter,
  "signage": getSignageAdapter,
  "infographic": getInfographicAdapter,
  "calendar-designer": getCalendarAdapter,
  "tshirt-merch": getApparelAdapter,
  "packaging-design": getPackagingAdapter,
  "banner-ad": () => makeFabricAdapter(300, 250),
  // Presentation
  "presentation": getPresentationAdapter,
  // Audio & Voice
  "voice-flow": getVoiceFlowAdapter,
  "audio-transcription": getAudioTranscriptionAdapter,
  // Document Signing
  "document-signer": getDocumentSignerAdapter,
  // Invoice & Accounting
  "invoice-tracker": getInvoiceAccountingAdapter,
  // Sketch Board (Excalidraw) — handles its own persistence via localStorage
  "sketch-board": getGenericAdapter,
  // AI Flow Builder
  "ai-flow-builder": getAIFlowBuilderAdapter,
  // Reveal.js Presenter
  "reveal-presenter": getRevealPresenterAdapter,
  // AI Chat (LobeChat-style)
  "ai-chat": getAIChatAdapter,
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
