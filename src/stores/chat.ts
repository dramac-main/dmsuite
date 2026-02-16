import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  /** All conversations */
  conversations: ChatConversation[];
  /** Currently active conversation ID */
  activeConversationId: string | null;
  /** Whether AI is currently generating a response */
  isGenerating: boolean;
  /** Input draft text */
  inputDraft: string;

  /** Get active conversation */
  getActiveConversation: () => ChatConversation | undefined;
  /** Create a new conversation */
  createConversation: () => string;
  /** Set active conversation */
  setActiveConversation: (id: string) => void;
  /** Delete a conversation */
  deleteConversation: (id: string) => void;
  /** Add a message to the active conversation */
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  /** Update the last assistant message (for streaming) */
  updateLastAssistantMessage: (content: string) => void;
  /** Set generating state */
  setIsGenerating: (generating: boolean) => void;
  /** Set input draft */
  setInputDraft: (draft: string) => void;
  /** Clear all conversations */
  clearAll: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isGenerating: false,
      inputDraft: "",

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId);
      },

      createConversation: () => {
        const id = generateId();
        const conversation: ChatConversation = {
          id,
          title: "New Chat",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          conversations: [conversation, ...s.conversations],
          activeConversationId: id,
          inputDraft: "",
        }));
        return id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id, inputDraft: "" }),

      deleteConversation: (id) =>
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== id);
          const activeConversationId =
            s.activeConversationId === id
              ? conversations[0]?.id ?? null
              : s.activeConversationId;
          return { conversations, activeConversationId };
        }),

      addMessage: (message) =>
        set((s) => {
          const msg: ChatMessage = {
            ...message,
            id: generateId(),
            timestamp: Date.now(),
          };
          return {
            conversations: s.conversations.map((c) =>
              c.id === s.activeConversationId
                ? {
                    ...c,
                    messages: [...c.messages, msg],
                    updatedAt: Date.now(),
                    // Auto-title from first user message
                    title:
                      c.title === "New Chat" && message.role === "user"
                        ? message.content.slice(0, 50) + (message.content.length > 50 ? "…" : "")
                        : c.title,
                  }
                : c
            ),
          };
        }),

      updateLastAssistantMessage: (content) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === s.activeConversationId
              ? {
                  ...c,
                  messages: c.messages.map((m, i) =>
                    i === c.messages.length - 1 && m.role === "assistant"
                      ? { ...m, content }
                      : m
                  ),
                  updatedAt: Date.now(),
                }
              : c
          ),
        })),

      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setInputDraft: (draft) => set({ inputDraft: draft }),

      clearAll: () =>
        set({ conversations: [], activeConversationId: null, inputDraft: "" }),
    }),
    {
      name: "dmsuite-chat",
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
