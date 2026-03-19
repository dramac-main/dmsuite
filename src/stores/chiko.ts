import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExtractedFileData } from "@/lib/chiko/extractors";

/* ── Chiko — DMSuite's AI Personal Assistant Store ───────────
   Manages Chiko's state, conversation history, context awareness,
   and user preferences. Persisted in localStorage.
   ──────────────────────────────────────────────────────────── */

/** Attached file state in the Chiko store */
export interface ChikoFileAttachment {
  /** Unique ID for this attachment */
  id: string;
  /** Original filename */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** MIME type */
  mimeType: string;
  /** Upload status */
  status: "pending" | "uploading" | "processing" | "ready" | "error";
  /** Upload progress (0-100) */
  progress: number;
  /** Extracted data (populated when status is "ready") */
  extractedData?: ExtractedFileData;
  /** Error message (populated when status is "error") */
  error?: string;
  /** Thumbnail preview for images (small base64 data URI) */
  thumbnail?: string;
}

export interface ChikoMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  /** Optional quick-action chips attached to assistant messages */
  actions?: ChikoAction[];
  /** Actions executed by Chiko during this message (Layer 1) */
  executedActions?: { action: string; params: Record<string, unknown>; success: boolean }[];
  /** Snapshot of files attached to this user message (captured at send time) */
  files?: { fileName: string; mimeType: string; thumbnail?: string }[];
  /** Quick-reply suggestions shown as clickable buttons below the message */
  suggestedReplies?: string[];
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
  /** Currently attached files (pending upload or ready) */
  attachments: ChikoFileAttachment[];

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
  /** Add a pending attachment and return its ID */
  addAttachment: (file: { fileName: string; fileSize: number; mimeType: string }) => string;
  /** Update an attachment's status, progress, extracted data, etc. */
  updateAttachment: (id: string, patch: Partial<ChikoFileAttachment>) => void;
  /** Remove a single attachment by ID */
  removeAttachment: (id: string) => void;
  /** Remove all attachments */
  clearAttachments: () => void;
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
      attachments: [],

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
          attachments: [],
        }),

      addAttachment: (file) => {
        const id = generateId();
        set((s) => ({
          attachments: [
            ...s.attachments,
            {
              id,
              fileName: file.fileName,
              fileSize: file.fileSize,
              mimeType: file.mimeType,
              status: "pending",
              progress: 0,
            },
          ],
        }));
        return id;
      },

      updateAttachment: (id, patch) =>
        set((s) => ({
          attachments: s.attachments.map((a) =>
            a.id === id ? { ...a, ...patch } : a
          ),
        })),

      removeAttachment: (id) =>
        set((s) => ({
          attachments: s.attachments.filter((a) => a.id !== id),
        })),

      clearAttachments: () => set({ attachments: [] }),
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
