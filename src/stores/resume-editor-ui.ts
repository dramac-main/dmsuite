// =============================================================================
// DMSuite — Resume Editor UI Store
// Lightweight store for panel states, zoom, active panel, modal states, etc.
// No persistence — pure session state.
// =============================================================================

import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EditorPanel = "sections" | "design" | "ai";
export type PreviewZoom = 50 | 75 | 100 | 125 | 150;

interface ResumeEditorUIState {
  // ---- Panel management ----
  activePanel: EditorPanel;
  setActivePanel: (panel: EditorPanel) => void;

  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;

  // ---- Preview / Artboard ----
  zoom: PreviewZoom;
  setZoom: (zoom: PreviewZoom) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToWidth: boolean;
  setFitToWidth: (fit: boolean) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;

  // ---- Section editing ----
  editingSectionKey: string | null;
  editingItemIndex: number | null;
  setEditingSection: (sectionKey: string | null, itemIndex?: number | null) => void;

  // ---- Template picker modal ----
  isTemplatePickerOpen: boolean;
  setTemplatePickerOpen: (open: boolean) => void;

  // ---- AI chat panel ----
  isChatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // ---- ATS score ----
  atsScore: number | null;
  setAtsScore: (score: number | null) => void;
  isAtsScoring: boolean;
  setIsAtsScoring: (scoring: boolean) => void;

  // ---- Export ----
  isExporting: boolean;
  setIsExporting: (exporting: boolean) => void;
  exportFormat: "pdf" | "docx" | "json" | "png";
  setExportFormat: (format: "pdf" | "docx" | "json" | "png") => void;

  // ---- Dirty state ----
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (dirty: boolean) => void;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Zoom steps
// ---------------------------------------------------------------------------

const ZOOM_STEPS: PreviewZoom[] = [50, 75, 100, 125, 150];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useResumeEditorUI = create<ResumeEditorUIState>()((set, get) => ({
  // ---- Panel ----
  activePanel: "sections",
  setActivePanel: (panel) => set({ activePanel: panel }),

  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  toggleLeftPanel: () => set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),

  // ---- Zoom ----
  zoom: 100,
  setZoom: (zoom) => set({ zoom, fitToWidth: false }),
  zoomIn: () => {
    const { zoom } = get();
    const idx = ZOOM_STEPS.indexOf(zoom);
    if (idx < ZOOM_STEPS.length - 1) {
      set({ zoom: ZOOM_STEPS[idx + 1], fitToWidth: false });
    }
  },
  zoomOut: () => {
    const { zoom } = get();
    const idx = ZOOM_STEPS.indexOf(zoom);
    if (idx > 0) {
      set({ zoom: ZOOM_STEPS[idx - 1], fitToWidth: false });
    }
  },
  fitToWidth: false,
  setFitToWidth: (fit) => set({ fitToWidth: fit }),
  currentPage: 0,
  setCurrentPage: (page) => set({ currentPage: page }),

  // ---- Section editing ----
  editingSectionKey: null,
  editingItemIndex: null,
  setEditingSection: (sectionKey, itemIndex = null) =>
    set({ editingSectionKey: sectionKey, editingItemIndex: itemIndex }),

  // ---- Template picker ----
  isTemplatePickerOpen: false,
  setTemplatePickerOpen: (open) => set({ isTemplatePickerOpen: open }),

  // ---- Chat ----
  isChatOpen: false,
  setChatOpen: (open) => set({ isChatOpen: open }),
  chatMessages: [],
  addChatMessage: (message) =>
    set((s) => ({ chatMessages: [...s.chatMessages, message] })),
  clearChat: () => set({ chatMessages: [] }),

  // ---- ATS ----
  atsScore: null,
  setAtsScore: (score) => set({ atsScore: score }),
  isAtsScoring: false,
  setIsAtsScoring: (scoring) => set({ isAtsScoring: scoring }),

  // ---- Export ----
  isExporting: false,
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  exportFormat: "pdf",
  setExportFormat: (format) => set({ exportFormat: format }),

  // ---- Dirty ----
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (dirty) => set({ hasUnsavedChanges: dirty }),
}));
