import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ── Chiko — DMSuite's AI Personal Assistant Store ───────────
   Manages Chiko's state, conversation history, context awareness,
   and user preferences. Persisted in localStorage.
   ──────────────────────────────────────────────────────────── */

export interface ChikoMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  /** Optional quick-action chips attached to assistant messages */
  actions?: ChikoAction[];
  /** Actions executed by Chiko during this message (Layer 1) */
  executedActions?: { action: string; params: Record<string, unknown>; success: boolean }[];
}

export interface ChikoAction {
  label: string;
  type: "navigate" | "tool" | "explain" | "create" | "action";
  payload: string; // URL, tool ID, or action key
  icon?: string;
}

export interface ChikoContext {
  /** Current page path */
  currentPath: string;
  /** Current tool ID if on a tool page */
  currentToolId?: string;
  /** Current category ID if on a tool/category page */
  currentCategoryId?: string;
  /** Page type for context-aware suggestions */
  pageType: "dashboard" | "tool" | "other";
}

interface ChikoState {
  /** Whether Chiko panel is open */
  isOpen: boolean;
  /** Whether Chiko is currently generating a response */
  isGenerating: boolean;
  /** Conversation messages */
  messages: ChikoMessage[];
  /** Current input draft */
  inputDraft: string;
  /** Current page context */
  context: ChikoContext;
  /** Whether Chiko has been greeted this session */
  hasGreeted: boolean;
  /** Notification dot — new suggestion available */
  hasNotification: boolean;
  /** Minimize vs full close (minimized = FAB stays animated) */
  isMinimized: boolean;

  /* ── Actions ──────────────────────────────────────────── */
  open: () => void;
  close: () => void;
  toggle: () => void;
  minimize: () => void;
  setIsGenerating: (v: boolean) => void;
  setInputDraft: (draft: string) => void;
  setContext: (ctx: Partial<ChikoContext>) => void;
  addMessage: (msg: Omit<ChikoMessage, "id" | "timestamp">) => void;
  updateLastAssistantMessage: (content: string) => void;
  appendToLastAssistantMessage: (chunk: string) => void;
  setHasGreeted: (v: boolean) => void;
  setHasNotification: (v: boolean) => void;
  clearMessages: () => void;
  clearAll: () => void;
}

function generateId(): string {
  return `chiko-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useChikoStore = create<ChikoState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isGenerating: false,
      messages: [],
      inputDraft: "",
      context: { currentPath: "/dashboard", pageType: "dashboard" },
      hasGreeted: false,
      hasNotification: false,
      isMinimized: false,

      open: () => set({ isOpen: true, isMinimized: false, hasNotification: false }),
      close: () => set({ isOpen: false, isMinimized: false }),
      toggle: () => {
        const { isOpen } = get();
        if (isOpen) {
          set({ isOpen: false, isMinimized: false });
        } else {
          set({ isOpen: true, isMinimized: false, hasNotification: false });
        }
      },
      minimize: () => set({ isOpen: false, isMinimized: true }),

      setIsGenerating: (v) => set({ isGenerating: v }),
      setInputDraft: (draft) => set({ inputDraft: draft }),
      setContext: (ctx) =>
        set((s) => ({ context: { ...s.context, ...ctx } })),

      addMessage: (msg) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { ...msg, id: generateId(), timestamp: Date.now() },
          ],
        })),

      updateLastAssistantMessage: (content) =>
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last?.role === "assistant") {
            msgs[msgs.length - 1] = { ...last, content };
          }
          return { messages: msgs };
        }),

      appendToLastAssistantMessage: (chunk) =>
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last?.role === "assistant") {
            msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
          }
          return { messages: msgs };
        }),

      setHasGreeted: (v) => set({ hasGreeted: v }),
      setHasNotification: (v) => set({ hasNotification: v }),

      clearMessages: () => set({ messages: [], hasGreeted: false }),
      clearAll: () =>
        set({
          isOpen: false,
          isGenerating: false,
          messages: [],
          inputDraft: "",
          hasGreeted: false,
          hasNotification: false,
          isMinimized: false,
        }),
    }),
    {
      name: "dmsuite-chiko",
      partialize: (state) => ({
        messages: state.messages.slice(-50), // Keep last 50 messages
        hasGreeted: state.hasGreeted,
        context: state.context,
      }),
    }
  )
);
