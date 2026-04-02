import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ─── Types ──────────────────────────────────────────────────
export type ChatProvider = "claude" | "openai";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  /** Which AI provider generated this (assistant only) */
  provider?: ChatProvider;
  /** Parent message id for branching / forking */
  parentId?: string;
  /** Whether the user bookmarked this message */
  bookmarked?: boolean;
  /** Token estimate for this message */
  tokenEstimate?: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  /** Pinned to top of sidebar */
  pinned?: boolean;
  /** Provider used for this conversation */
  provider?: ChatProvider;
  /** System prompt override for this conversation */
  systemPrompt?: string;
  /** Folder / label for organization */
  folder?: string;
  /** Whether this is a temporary (unsaved) chat */
  temporary?: boolean;
}

export interface SystemPreset {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isGenerating: boolean;
  inputDraft: string;
  /** Currently selected AI provider */
  selectedProvider: ChatProvider;
  /** Currently active system prompt */
  systemPrompt: string;
  /** Whether system prompt panel is visible */
  showSystemPrompt: boolean;
  /** User-created custom presets */
  customPresets: SystemPreset[];
  /** Search query for conversation sidebar */
  sidebarSearch: string;
  /** Folders for conversation organization */
  folders: string[];

  // ── Getters ──
  getActiveConversation: () => ChatConversation | undefined;

  // ── Conversation CRUD ──
  createConversation: (opts?: { temporary?: boolean }) => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  pinConversation: (id: string) => void;
  unpinConversation: (id: string) => void;
  duplicateConversation: (id: string) => string;
  moveToFolder: (id: string, folder: string | undefined) => void;

  // ── Messages ──
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateLastAssistantMessage: (content: string) => void;
  editMessage: (conversationId: string, messageId: string, newContent: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  bookmarkMessage: (conversationId: string, messageId: string) => void;
  forkFromMessage: (conversationId: string, messageId: string) => string;

  // ── UI state ──
  setIsGenerating: (generating: boolean) => void;
  setInputDraft: (draft: string) => void;
  setSelectedProvider: (provider: ChatProvider) => void;
  setSystemPrompt: (prompt: string) => void;
  setShowSystemPrompt: (show: boolean) => void;
  setSidebarSearch: (query: string) => void;

  // ── Presets ──
  addCustomPreset: (preset: Omit<SystemPreset, "id">) => void;
  deleteCustomPreset: (id: string) => void;

  // ── Folders ──
  addFolder: (name: string) => void;
  deleteFolder: (name: string) => void;

  // ── Bulk ──
  clearAll: () => void;
  setForm: (form: Partial<ChatState>) => void;
  resetForm: () => void;

  // ── Export ──
  exportConversation: (id: string, format: "markdown" | "json" | "text") => string;
}

// ─── Helpers ────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const DEFAULT_SYSTEM_PROMPT =
  "You are DMSuite AI — a professional creative assistant built into an AI-powered design & business suite. Be concise but thorough. Use markdown formatting.";

const BUILTIN_PRESETS: SystemPreset[] = [
  { id: "default", label: "Default", prompt: DEFAULT_SYSTEM_PROMPT, icon: "sparkles" },
  { id: "creative", label: "Creative Writer", prompt: "You are a creative writing assistant. Help with taglines, copy, stories, and creative content. Be imaginative and vivid. Use markdown.", icon: "edit" },
  { id: "code", label: "Code Assistant", prompt: "You are an expert coding assistant. Write clean, well-documented code. Explain your reasoning. Use markdown code blocks.", icon: "code" },
  { id: "business", label: "Business Advisor", prompt: "You are a business strategy advisor. Help with planning, marketing, analytics, and growth strategies. Be data-driven and actionable.", icon: "briefcase" },
  { id: "design", label: "Design Consultant", prompt: "You are a design consultant. Help with color theory, typography, layout, branding, and visual design decisions. Reference specific techniques.", icon: "palette" },
  { id: "analyst", label: "Data Analyst", prompt: "You are a data analyst. Help interpret data, create analysis frameworks, suggest visualizations, and explain statistical concepts clearly.", icon: "chart" },
];

export { BUILTIN_PRESETS, DEFAULT_SYSTEM_PROMPT };

// ─── Store ──────────────────────────────────────────────────

export const useChatStore = create<ChatState>()(
  persist(
    immer((set, get) => ({
      conversations: [],
      activeConversationId: null,
      isGenerating: false,
      inputDraft: "",
      selectedProvider: "claude" as ChatProvider,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      showSystemPrompt: false,
      customPresets: [],
      sidebarSearch: "",
      folders: [],

      // ── Getters ──
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId);
      },

      // ── Conversation CRUD ──
      createConversation: (opts) => {
        const id = generateId();
        set((s) => {
          s.conversations.unshift({
            id,
            title: "New Chat",
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            provider: s.selectedProvider,
            systemPrompt: s.systemPrompt,
            temporary: opts?.temporary,
          });
          s.activeConversationId = id;
          s.inputDraft = "";
        });
        return id;
      },

      setActiveConversation: (id) =>
        set((s) => {
          s.activeConversationId = id;
          s.inputDraft = "";
        }),

      deleteConversation: (id) =>
        set((s) => {
          const idx = s.conversations.findIndex((c) => c.id === id);
          if (idx !== -1) s.conversations.splice(idx, 1);
          if (s.activeConversationId === id) {
            s.activeConversationId = s.conversations[0]?.id ?? null;
          }
        }),

      renameConversation: (id, title) =>
        set((s) => {
          const conv = s.conversations.find((c) => c.id === id);
          if (conv) conv.title = title;
        }),

      pinConversation: (id) =>
        set((s) => {
          const conv = s.conversations.find((c) => c.id === id);
          if (conv) conv.pinned = true;
        }),

      unpinConversation: (id) =>
        set((s) => {
          const conv = s.conversations.find((c) => c.id === id);
          if (conv) conv.pinned = false;
        }),

      duplicateConversation: (id) => {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv) return id;
        const newId = generateId();
        set((s) => {
          s.conversations.unshift({
            ...JSON.parse(JSON.stringify(conv)),
            id: newId,
            title: `${conv.title} (copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            pinned: false,
          });
          s.activeConversationId = newId;
        });
        return newId;
      },

      moveToFolder: (id, folder) =>
        set((s) => {
          const conv = s.conversations.find((c) => c.id === id);
          if (conv) conv.folder = folder;
        }),

      // ── Messages ──
      addMessage: (message) =>
        set((s) => {
          const conv = s.conversations.find(
            (c) => c.id === s.activeConversationId
          );
          if (!conv) return;
          const msg: ChatMessage = {
            ...message,
            id: generateId(),
            timestamp: Date.now(),
            tokenEstimate: estimateTokens(message.content),
          };
          conv.messages.push(msg);
          conv.updatedAt = Date.now();
          // Auto-title from first user message
          if (conv.title === "New Chat" && message.role === "user") {
            conv.title =
              message.content.slice(0, 50) +
              (message.content.length > 50 ? "…" : "");
          }
        }),

      updateLastAssistantMessage: (content) =>
        set((s) => {
          const conv = s.conversations.find(
            (c) => c.id === s.activeConversationId
          );
          if (!conv) return;
          const lastMsg = conv.messages[conv.messages.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content = content;
            lastMsg.tokenEstimate = estimateTokens(content);
          }
          conv.updatedAt = Date.now();
        }),

      editMessage: (conversationId, messageId, newContent) =>
        set((s) => {
          const conv = s.conversations.find((c) => c.id === conversationId);
          if (!conv) return;
          const msg = conv.messages.find((m) => m.id === messageId);
          if (msg) {
            msg.content = newContent;
            msg.tokenEstimate = estimateTokens(newContent);
          }
          conv.updatedAt = Date.now();
        }),

      deleteMessage: (conversationId, messageId) =>
        set((s) => {
          const conv = s.conversations.find((c) => c.id === conversationId);
          if (!conv) return;
          const idx = conv.messages.findIndex((m) => m.id === messageId);
          if (idx !== -1) conv.messages.splice(idx, 1);
          conv.updatedAt = Date.now();
        }),

      bookmarkMessage: (conversationId, messageId) =>
        set((s) => {
          const conv = s.conversations.find((c) => c.id === conversationId);
          if (!conv) return;
          const msg = conv.messages.find((m) => m.id === messageId);
          if (msg) msg.bookmarked = !msg.bookmarked;
        }),

      forkFromMessage: (conversationId, messageId) => {
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (!conv) return conversationId;
        const msgIdx = conv.messages.findIndex((m) => m.id === messageId);
        if (msgIdx === -1) return conversationId;

        const newId = generateId();
        const forkedMessages = conv.messages
          .slice(0, msgIdx + 1)
          .map((m) => ({ ...m, id: generateId(), timestamp: m.timestamp }));

        set((s) => {
          s.conversations.unshift({
            id: newId,
            title: `Fork: ${conv.title}`,
            messages: forkedMessages as ChatMessage[],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            provider: conv.provider,
            systemPrompt: conv.systemPrompt,
          });
          s.activeConversationId = newId;
        });
        return newId;
      },

      // ── UI state ──
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setInputDraft: (draft) => set({ inputDraft: draft }),
      setSelectedProvider: (provider) =>
        set({ selectedProvider: provider }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setShowSystemPrompt: (show) => set({ showSystemPrompt: show }),
      setSidebarSearch: (query) => set({ sidebarSearch: query }),

      // ── Presets ──
      addCustomPreset: (preset) =>
        set((s) => {
          s.customPresets.push({ ...preset, id: generateId() });
        }),

      deleteCustomPreset: (id) =>
        set((s) => {
          const idx = s.customPresets.findIndex((p) => p.id === id);
          if (idx !== -1) s.customPresets.splice(idx, 1);
        }),

      // ── Folders ──
      addFolder: (name) =>
        set((s) => {
          if (!s.folders.includes(name)) s.folders.push(name);
        }),

      deleteFolder: (name) =>
        set((s) => {
          s.folders = s.folders.filter((f) => f !== name);
          for (const conv of s.conversations) {
            if (conv.folder === name) conv.folder = undefined;
          }
        }),

      // ── Bulk ──
      clearAll: () =>
        set({
          conversations: [],
          activeConversationId: null,
          inputDraft: "",
        }),

      setForm: (form) => set(form),

      resetForm: () =>
        set({
          conversations: [],
          activeConversationId: null,
          isGenerating: false,
          inputDraft: "",
          selectedProvider: "claude",
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
          showSystemPrompt: false,
          customPresets: [],
          sidebarSearch: "",
          folders: [],
        }),

      // ── Export ──
      exportConversation: (id, format) => {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv) return "";
        const msgs = conv.messages;
        switch (format) {
          case "markdown":
            return msgs
              .map(
                (m) =>
                  `## ${m.role === "user" ? "You" : "Assistant"}\n\n${m.content}\n`
              )
              .join("\n---\n\n");
          case "json":
            return JSON.stringify(
              { title: conv.title, messages: msgs, provider: conv.provider },
              null,
              2
            );
          case "text":
            return msgs
              .map((m) => `[${m.role.toUpperCase()}]\n${m.content}`)
              .join("\n\n---\n\n");
          default:
            return "";
        }
      },
    })),
    {
      name: "dmsuite-chat",
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        selectedProvider: state.selectedProvider,
        systemPrompt: state.systemPrompt,
        customPresets: state.customPresets,
        folders: state.folders,
      }),
    }
  )
);
