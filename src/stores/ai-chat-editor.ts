"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { v4 as uuid } from "uuid";

// ---------------------------------------------------------------------------
// Types — Lobe Chat–inspired multi-model, agent/persona, topic-based chat
// ---------------------------------------------------------------------------

export type ChatProvider = "claude" | "openai" | "gemini" | "deepseek";

export type ChatModel =
  | "claude-sonnet-4-20250514"
  | "claude-haiku-4-20250414"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gemini-2.0-flash"
  | "deepseek-chat";

export interface ModelOption {
  id: ChatModel;
  label: string;
  provider: ChatProvider;
  maxTokens: number;
  description: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", provider: "claude", maxTokens: 8192, description: "Best balance of intelligence and speed" },
  { id: "claude-haiku-4-20250414", label: "Claude Haiku 4", provider: "claude", maxTokens: 8192, description: "Fastest, most affordable" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", maxTokens: 4096, description: "OpenAI's flagship multimodal model" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai", maxTokens: 4096, description: "Small, fast, affordable" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "gemini", maxTokens: 8192, description: "Google's fast multimodal model" },
  { id: "deepseek-chat", label: "DeepSeek V3", provider: "deepseek", maxTokens: 4096, description: "Open-source reasoning model" },
];

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // base64 data URL
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  model?: ChatModel;
  provider?: ChatProvider;
  attachments?: FileAttachment[];
  tokenEstimate?: number;
  parentId?: string;           // for fork chains
  bookmarked?: boolean;
  isError?: boolean;
}

export interface AgentPersona {
  id: string;
  name: string;
  avatar: string;              // emoji or icon key
  description: string;
  systemPrompt: string;
  model: ChatModel;
  temperature: number;
  maxTokens: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isBuiltin?: boolean;
}

export interface Topic {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  favorite?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  agentId: string;             // which agent persona
  topicId?: string;            // topic threading
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  archived?: boolean;
  temporary?: boolean;
}

// ---------------------------------------------------------------------------
// Built-in agent personas (Lobe Chat pattern)
// ---------------------------------------------------------------------------

export const BUILTIN_AGENTS: AgentPersona[] = [
  {
    id: "default",
    name: "DMSuite Assistant",
    avatar: "🤖",
    description: "General-purpose AI assistant",
    systemPrompt: "You are a helpful, knowledgeable AI assistant. You provide clear, accurate, and concise answers. Format your responses with Markdown when appropriate. Use code blocks with language specifiers for code.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 4096,
    tags: ["general", "assistant"],
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
  },
  {
    id: "creative-writer",
    name: "Creative Writer",
    avatar: "✍️",
    description: "Expert at creative writing, copywriting, and storytelling",
    systemPrompt: "You are a masterful creative writer. You excel at storytelling, persuasive copy, poetry, screenwriting, and all forms of creative text. Adapt your tone and style to the user's needs. Use vivid language and compelling narrative techniques.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.9,
    maxTokens: 4096,
    tags: ["creative", "writing", "copy"],
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
  },
  {
    id: "code-assistant",
    name: "Code Assistant",
    avatar: "💻",
    description: "Expert programmer across all languages and frameworks",
    systemPrompt: "You are an expert software engineer. You write clean, efficient, well-documented code. Always use proper code blocks with language identifiers. Explain your reasoning. Follow best practices and modern patterns. Consider edge cases and error handling.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.3,
    maxTokens: 8192,
    tags: ["code", "programming", "development"],
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    avatar: "📊",
    description: "Data analysis, statistics, visualization, and insights",
    systemPrompt: "You are a senior data analyst. You excel at statistical analysis, data visualization recommendations, SQL queries, Python/R data processing, and extracting actionable insights from data. Use tables and structured formats when presenting data.",
    model: "gpt-4o",
    temperature: 0.4,
    maxTokens: 4096,
    tags: ["data", "analytics", "statistics"],
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
  },
  {
    id: "business-advisor",
    name: "Business Advisor",
    avatar: "💼",
    description: "Strategic business consulting and planning",
    systemPrompt: "You are a seasoned business consultant with expertise in strategy, marketing, finance, and operations. Provide actionable business advice backed by frameworks and real-world examples. Use structured formats for plans and analyses.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.6,
    maxTokens: 4096,
    tags: ["business", "strategy", "consulting"],
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
  },
  {
    id: "design-consultant",
    name: "Design Consultant",
    avatar: "🎨",
    description: "UI/UX, graphic design, and creative direction",
    systemPrompt: "You are a senior design consultant with deep expertise in UI/UX, graphic design, typography, color theory, and brand identity. Provide specific, actionable design guidance with rationale. Reference design principles and modern trends.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 4096,
    tags: ["design", "ui", "ux", "creative"],
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
  },
];

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------

interface AIChatForm {
  conversations: Conversation[];
  activeConversationId: string;
  agents: AgentPersona[];
  activeAgentId: string;
  topics: Topic[];
  selectedModel: ChatModel;
}

const DEFAULT_FORM: AIChatForm = {
  conversations: [],
  activeConversationId: "",
  agents: [],
  activeAgentId: "default",
  topics: [],
  selectedModel: "claude-sonnet-4-20250514",
};

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface AIChatState {
  form: AIChatForm;

  // Form CRUD
  setForm: (form: AIChatForm) => void;
  resetForm: () => void;

  // Conversation CRUD
  createConversation: (agentId?: string, temporary?: boolean) => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  setActiveConversation: (id: string) => void;
  pinConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  duplicateConversation: (id: string) => string;

  // Message CRUD
  addMessage: (convId: string, msg: Omit<ChatMessage, "id" | "createdAt">) => string;
  editMessage: (convId: string, msgId: string, content: string) => void;
  deleteMessage: (convId: string, msgId: string) => void;
  bookmarkMessage: (convId: string, msgId: string) => void;
  forkFromMessage: (convId: string, msgId: string) => string;
  regenerateMessage: (convId: string, msgId: string) => void;

  // Agent CRUD
  createAgent: (agent: Omit<AgentPersona, "id" | "createdAt" | "updatedAt">) => string;
  updateAgent: (id: string, patch: Partial<AgentPersona>) => void;
  deleteAgent: (id: string) => void;
  setActiveAgent: (id: string) => void;

  // Topic CRUD
  createTopic: (title: string) => string;
  renameTopic: (id: string, title: string) => void;
  deleteTopic: (id: string) => void;
  toggleTopicFav: (id: string) => void;
  assignTopic: (convId: string, topicId: string) => void;
  autoNameTopic: (topicId: string, firstMessage: string) => void;

  // Model selection
  setSelectedModel: (model: ChatModel) => void;

  // Export/Import
  exportConversation: (convId: string, format: "json" | "markdown" | "text") => string;
  importConversations: (data: string) => number;

  // Helpers
  getActiveConversation: () => Conversation | undefined;
  getActiveAgent: () => AgentPersona;
  getConversationsByTopic: (topicId: string) => Conversation[];
  getAllAgents: () => AgentPersona[];
}

// ---------------------------------------------------------------------------
// Helper: estimate tokens (~4 chars per token)
// ---------------------------------------------------------------------------
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAIChatEditor = create<AIChatState>()(
  persist(
    immer((set, get) => ({
      form: DEFAULT_FORM,

      setForm: (form) => set({ form }),
      resetForm: () => set({ form: { ...DEFAULT_FORM, conversations: [], agents: [], topics: [] } }),

      // ── Conversations ──
      createConversation: (agentId, temporary) => {
        const id = uuid();
        const agent = agentId || get().form.activeAgentId;
        set((s) => {
          s.form.conversations.unshift({
            id,
            title: "New Conversation",
            agentId: agent,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            temporary: temporary || false,
          });
          s.form.activeConversationId = id;
        });
        return id;
      },

      deleteConversation: (id) => set((s) => {
        s.form.conversations = s.form.conversations.filter((c) => c.id !== id);
        if (s.form.activeConversationId === id) {
          s.form.activeConversationId = s.form.conversations[0]?.id || "";
        }
      }),

      renameConversation: (id, title) => set((s) => {
        const conv = s.form.conversations.find((c) => c.id === id);
        if (conv) { conv.title = title; conv.updatedAt = Date.now(); }
      }),

      setActiveConversation: (id) => set((s) => { s.form.activeConversationId = id; }),

      pinConversation: (id) => set((s) => {
        const conv = s.form.conversations.find((c) => c.id === id);
        if (conv) conv.pinned = !conv.pinned;
      }),

      archiveConversation: (id) => set((s) => {
        const conv = s.form.conversations.find((c) => c.id === id);
        if (conv) conv.archived = !conv.archived;
      }),

      duplicateConversation: (id) => {
        const newId = uuid();
        set((s) => {
          const src = s.form.conversations.find((c) => c.id === id);
          if (!src) return;
          s.form.conversations.unshift({
            ...JSON.parse(JSON.stringify(src)),
            id: newId,
            title: `${src.title} (copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            pinned: false,
          });
          s.form.activeConversationId = newId;
        });
        return newId;
      },

      // ── Messages ──
      addMessage: (convId, msg) => {
        const msgId = uuid();
        set((s) => {
          const conv = s.form.conversations.find((c) => c.id === convId);
          if (!conv) return;
          conv.messages.push({
            ...msg,
            id: msgId,
            createdAt: Date.now(),
            tokenEstimate: estimateTokens(msg.content),
          });
          conv.updatedAt = Date.now();
          // Auto-rename on first user message
          if (conv.messages.length === 1 && msg.role === "user") {
            conv.title = msg.content.slice(0, 50) + (msg.content.length > 50 ? "…" : "");
          }
        });
        return msgId;
      },

      editMessage: (convId, msgId, content) => set((s) => {
        const conv = s.form.conversations.find((c) => c.id === convId);
        if (!conv) return;
        const msg = conv.messages.find((m) => m.id === msgId);
        if (msg) {
          msg.content = content;
          msg.tokenEstimate = estimateTokens(content);
          conv.updatedAt = Date.now();
        }
      }),

      deleteMessage: (convId, msgId) => set((s) => {
        const conv = s.form.conversations.find((c) => c.id === convId);
        if (conv) {
          conv.messages = conv.messages.filter((m) => m.id !== msgId);
          conv.updatedAt = Date.now();
        }
      }),

      bookmarkMessage: (convId, msgId) => set((s) => {
        const conv = s.form.conversations.find((c) => c.id === convId);
        if (!conv) return;
        const msg = conv.messages.find((m) => m.id === msgId);
        if (msg) msg.bookmarked = !msg.bookmarked;
      }),

      forkFromMessage: (convId, msgId) => {
        const newId = uuid();
        set((s) => {
          const conv = s.form.conversations.find((c) => c.id === convId);
          if (!conv) return;
          const idx = conv.messages.findIndex((m) => m.id === msgId);
          if (idx < 0) return;
          const forkedMessages = JSON.parse(JSON.stringify(conv.messages.slice(0, idx + 1)));
          s.form.conversations.unshift({
            id: newId,
            title: `Fork: ${conv.title}`,
            agentId: conv.agentId,
            messages: forkedMessages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          s.form.activeConversationId = newId;
        });
        return newId;
      },

      regenerateMessage: (convId, msgId) => set((s) => {
        const conv = s.form.conversations.find((c) => c.id === convId);
        if (!conv) return;
        const idx = conv.messages.findIndex((m) => m.id === msgId);
        if (idx < 0) return;
        // Remove from this message onward if it's an assistant message
        if (conv.messages[idx]?.role === "assistant") {
          conv.messages = conv.messages.slice(0, idx);
          conv.updatedAt = Date.now();
        }
      }),

      // ── Agents ──
      createAgent: (agent) => {
        const id = uuid();
        set((s) => {
          s.form.agents.push({
            ...agent,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        });
        return id;
      },

      updateAgent: (id, patch) => set((s) => {
        const agent = s.form.agents.find((a) => a.id === id);
        if (agent) Object.assign(agent, patch, { updatedAt: Date.now() });
      }),

      deleteAgent: (id) => set((s) => {
        s.form.agents = s.form.agents.filter((a) => a.id !== id);
        if (s.form.activeAgentId === id) s.form.activeAgentId = "default";
      }),

      setActiveAgent: (id) => set((s) => { s.form.activeAgentId = id; }),

      // ── Topics ──
      createTopic: (title) => {
        const id = uuid();
        set((s) => {
          s.form.topics.push({ id, title, createdAt: Date.now(), updatedAt: Date.now(), messageCount: 0 });
        });
        return id;
      },

      renameTopic: (id, title) => set((s) => {
        const topic = s.form.topics.find((t) => t.id === id);
        if (topic) { topic.title = title; topic.updatedAt = Date.now(); }
      }),

      deleteTopic: (id) => set((s) => {
        s.form.topics = s.form.topics.filter((t) => t.id !== id);
        // Unassign conversations
        for (const conv of s.form.conversations) {
          if (conv.topicId === id) conv.topicId = undefined;
        }
      }),

      toggleTopicFav: (id) => set((s) => {
        const topic = s.form.topics.find((t) => t.id === id);
        if (topic) topic.favorite = !topic.favorite;
      }),

      assignTopic: (convId, topicId) => set((s) => {
        const conv = s.form.conversations.find((c) => c.id === convId);
        if (conv) conv.topicId = topicId;
        const topic = s.form.topics.find((t) => t.id === topicId);
        if (topic) {
          topic.messageCount = s.form.conversations.filter((c) => c.topicId === topicId).reduce((n, c) => n + c.messages.length, 0);
        }
      }),

      autoNameTopic: (topicId, firstMessage) => set((s) => {
        const topic = s.form.topics.find((t) => t.id === topicId);
        if (topic && topic.title === "New Topic") {
          topic.title = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "…" : "");
        }
      }),

      // ── Model ──
      setSelectedModel: (model) => set((s) => { s.form.selectedModel = model; }),

      // ── Export / Import ──
      exportConversation: (convId, format) => {
        const conv = get().form.conversations.find((c) => c.id === convId);
        if (!conv) return "";
        if (format === "json") return JSON.stringify(conv, null, 2);
        if (format === "markdown") {
          let md = `# ${conv.title}\n\n`;
          for (const msg of conv.messages) {
            const role = msg.role === "user" ? "**You**" : msg.role === "assistant" ? "**AI**" : "**System**";
            md += `### ${role}\n${msg.content}\n\n---\n\n`;
          }
          return md;
        }
        // text
        return conv.messages.map((m) => `[${m.role}]: ${m.content}`).join("\n\n");
      },

      importConversations: (data) => {
        try {
          const parsed = JSON.parse(data);
          const convs = Array.isArray(parsed) ? parsed : [parsed];
          let imported = 0;
          set((s) => {
            for (const conv of convs) {
              if (conv.id && Array.isArray(conv.messages)) {
                s.form.conversations.unshift({
                  ...conv,
                  id: uuid(), // new ID to avoid collision
                  createdAt: conv.createdAt || Date.now(),
                  updatedAt: Date.now(),
                });
                imported++;
              }
            }
          });
          return imported;
        } catch { return 0; }
      },

      // ── Helpers (non-mutating) ──
      getActiveConversation: () => {
        const s = get().form;
        return s.conversations.find((c) => c.id === s.activeConversationId);
      },

      getActiveAgent: () => {
        const s = get().form;
        return (
          [...BUILTIN_AGENTS, ...s.agents].find((a) => a.id === s.activeAgentId) ||
          BUILTIN_AGENTS[0]
        );
      },

      getConversationsByTopic: (topicId) => {
        return get().form.conversations.filter((c) => c.topicId === topicId);
      },

      getAllAgents: () => {
        return [...BUILTIN_AGENTS, ...get().form.agents];
      },
    })),
    { name: "dmsuite-ai-chat" }
  )
);
