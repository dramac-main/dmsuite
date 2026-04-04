// =============================================================================
// DMSuite — AI Chat Store (LobeChat-style)
// Zustand store powering the @lobehub/ui–based AI Chat workspace.
// Persist key: "dmsuite-ai-chat"
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Provider = "claude" | "openai" | "gemini" | "deepseek";

export interface ChatMsg {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createAt: number;
  updateAt: number;
  meta: { avatar?: string; title?: string; backgroundColor?: string };
  parentId?: string;
  error?: { message: string; type: string; body?: unknown };
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMsg[];
  model: string;
  provider: Provider;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface AIChatState {
  // -- Data ---------------------------------------------------------------
  conversations: Conversation[];
  activeConversationId: string | null;
  inputValue: string;
  isStreaming: boolean;

  // -- Model settings -----------------------------------------------------
  model: string;
  provider: Provider;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;

  // -- UI -----------------------------------------------------------------
  sidebarOpen: boolean;
  sidebarWidth: number;

  // -- Actions ------------------------------------------------------------
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  setInputValue: (v: string) => void;
  setModel: (model: string, provider: Provider) => void;
  setSystemPrompt: (prompt: string) => void;
  setTemperature: (t: number) => void;
  setMaxTokens: (t: number) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  renameConversation: (id: string, title: string) => void;
  togglePinConversation: (id: string) => void;
  clearConversation: (id: string) => void;

  // -- Messaging ----------------------------------------------------------
  sendMessage: () => Promise<void>;
  stopStreaming: () => void;
  deleteMessage: (convId: string, msgId: string) => void;
  editMessage: (convId: string, msgId: string, content: string) => void;

  // -- Bulk ---------------------------------------------------------------
  resetStore: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const now = () => Date.now();

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_PROVIDER: Provider = "claude";
const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant. Be concise, clear, and accurate.";

function makeConversation(model: string, provider: Provider, systemPrompt: string): Conversation {
  const t = now();
  return {
    id: uid(),
    title: "New Chat",
    messages: [],
    model,
    provider,
    systemPrompt,
    createdAt: t,
    updatedAt: t,
  };
}

// ---------------------------------------------------------------------------
// Abort controller for streaming
// ---------------------------------------------------------------------------

let abortCtrl: AbortController | null = null;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAIChatEditor = create<AIChatState>()(
  persist(
    (set, get) => ({
      // -- Defaults -----------------------------------------------------------
      conversations: [],
      activeConversationId: null,
      inputValue: "",
      isStreaming: false,
      model: DEFAULT_MODEL,
      provider: DEFAULT_PROVIDER,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 4096,
      sidebarOpen: true,
      sidebarWidth: 280,

      // -- Actions ------------------------------------------------------------

      createConversation: () => {
        const { model, provider, systemPrompt } = get();
        const conv = makeConversation(model, provider, systemPrompt);
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeConversationId: conv.id,
          inputValue: "",
        }));
        return conv.id;
      },

      deleteConversation: (id) =>
        set((s) => {
          const remaining = s.conversations.filter((c) => c.id !== id);
          return {
            conversations: remaining,
            activeConversationId:
              s.activeConversationId === id
                ? remaining[0]?.id ?? null
                : s.activeConversationId,
          };
        }),

      setActiveConversation: (id) => set({ activeConversationId: id, inputValue: "" }),

      setInputValue: (v) => set({ inputValue: v }),

      setModel: (model, provider) => set({ model, provider }),

      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setTemperature: (t) => set({ temperature: t }),
      setMaxTokens: (t) => set({ maxTokens: t }),

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarWidth: (w) => set({ sidebarWidth: w }),

      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: now() } : c,
          ),
        })),

      togglePinConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned, updatedAt: now() } : c,
          ),
        })),

      clearConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, messages: [], updatedAt: now() } : c,
          ),
        })),

      // -- Messaging ----------------------------------------------------------

      sendMessage: async () => {
        const { activeConversationId, conversations, inputValue, isStreaming } = get();
        if (!activeConversationId || !inputValue.trim() || isStreaming) return;

        const conv = conversations.find((c) => c.id === activeConversationId);
        if (!conv) return;

        const userMsg: ChatMsg = {
          id: uid(),
          role: "user",
          content: inputValue.trim(),
          createAt: now(),
          updateAt: now(),
          meta: { avatar: "👤", title: "You" },
        };

        const assistantMsg: ChatMsg = {
          id: uid(),
          role: "assistant",
          content: "",
          createAt: now(),
          updateAt: now(),
          meta: { avatar: "🤖", title: conv.model },
        };

        // Add both messages & clear input
        set((s) => ({
          inputValue: "",
          isStreaming: true,
          conversations: s.conversations.map((c) =>
            c.id === activeConversationId
              ? { ...c, messages: [...c.messages, userMsg, assistantMsg], updatedAt: now() }
              : c,
          ),
        }));

        // Build message history
        const apiMessages = [...conv.messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        abortCtrl = new AbortController();

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: apiMessages,
              model: conv.model,
              provider: conv.provider,
              systemPrompt: conv.systemPrompt,
              temperature: get().temperature,
              maxTokens: get().maxTokens,
            }),
            signal: abortCtrl.signal,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Request failed" }));
            set((s) => ({
              isStreaming: false,
              conversations: s.conversations.map((c) =>
                c.id === activeConversationId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsg.id
                          ? { ...m, content: "", error: { message: err.error || "Error", type: "api" } }
                          : m,
                      ),
                    }
                  : c,
              ),
            }));
            return;
          }

          // Stream the response
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let accumulated = "";

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              accumulated += decoder.decode(value, { stream: true });

              // Update assistant message content
              set((s) => ({
                conversations: s.conversations.map((c) =>
                  c.id === activeConversationId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantMsg.id
                            ? { ...m, content: accumulated, updateAt: now() }
                            : m,
                        ),
                      }
                    : c,
                ),
              }));
            }
          }

          // Auto-title from first user message
          if (conv.messages.length === 0) {
            const title = userMsg.content.slice(0, 50) + (userMsg.content.length > 50 ? "…" : "");
            set((s) => ({
              conversations: s.conversations.map((c) =>
                c.id === activeConversationId ? { ...c, title, updatedAt: now() } : c,
              ),
            }));
          }
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            set((s) => ({
              conversations: s.conversations.map((c) =>
                c.id === activeConversationId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsg.id
                          ? { ...m, error: { message: (err as Error).message, type: "network" } }
                          : m,
                      ),
                    }
                  : c,
              ),
            }));
          }
        } finally {
          abortCtrl = null;
          set({ isStreaming: false });
        }
      },

      stopStreaming: () => {
        abortCtrl?.abort();
        abortCtrl = null;
        set({ isStreaming: false });
      },

      deleteMessage: (convId, msgId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: c.messages.filter((m) => m.id !== msgId), updatedAt: now() }
              : c,
          ),
        })),

      editMessage: (convId, msgId, content) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === msgId ? { ...m, content, updateAt: now() } : m,
                  ),
                  updatedAt: now(),
                }
              : c,
          ),
        })),

      // -- Bulk ---------------------------------------------------------------

      resetStore: () =>
        set({
          conversations: [],
          activeConversationId: null,
          inputValue: "",
          isStreaming: false,
          model: DEFAULT_MODEL,
          provider: DEFAULT_PROVIDER,
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
          temperature: 0.7,
          maxTokens: 4096,
          sidebarOpen: true,
          sidebarWidth: 280,
        }),
    }),
    {
      name: "dmsuite-ai-chat",
      partialize: (s) => ({
        conversations: s.conversations,
        activeConversationId: s.activeConversationId,
        model: s.model,
        provider: s.provider,
        systemPrompt: s.systemPrompt,
        temperature: s.temperature,
        maxTokens: s.maxTokens,
        sidebarOpen: s.sidebarOpen,
        sidebarWidth: s.sidebarWidth,
      }),
    },
  ),
);
