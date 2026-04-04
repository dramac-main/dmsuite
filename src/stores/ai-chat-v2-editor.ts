"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { v4 as uuid } from "uuid";

// ---------------------------------------------------------------------------
// Types — Lobe Chat–faithful: sessions, session groups, topics, agents,
//         multi-model, rich message actions
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
  icon: string; // emoji
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", provider: "claude", maxTokens: 8192, description: "Best balance of intelligence and speed", icon: "🟣" },
  { id: "claude-haiku-4-20250414", label: "Claude Haiku 4", provider: "claude", maxTokens: 8192, description: "Fastest, most affordable", icon: "🟣" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", maxTokens: 4096, description: "OpenAI's flagship multimodal model", icon: "🟢" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai", maxTokens: 4096, description: "Small, fast, affordable", icon: "🟢" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "gemini", maxTokens: 8192, description: "Google's fast multimodal model", icon: "🔵" },
  { id: "deepseek-chat", label: "DeepSeek V3", provider: "deepseek", maxTokens: 4096, description: "Open-source reasoning model", icon: "🟠" },
];

export const PROVIDER_META: Record<ChatProvider, { label: string; color: string }> = {
  claude: { label: "Anthropic", color: "text-purple-400" },
  openai: { label: "OpenAI", color: "text-green-400" },
  gemini: { label: "Google", color: "text-blue-400" },
  deepseek: { label: "DeepSeek", color: "text-orange-400" },
};

// ---------------------------------------------------------------------------
// File attachment
// ---------------------------------------------------------------------------

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  model?: ChatModel;
  provider?: ChatProvider;
  attachments?: FileAttachment[];
  tokenEstimate?: number;
  parentId?: string;
  bookmarked?: boolean;
  isError?: boolean;
  // Lobe Chat extra fields
  translated?: string;          // translated text cache
  ttsPlaying?: boolean;
}

// ---------------------------------------------------------------------------
// Agent Persona (Lobe Chat: Agent)
// ---------------------------------------------------------------------------

export interface AgentPersona {
  id: string;
  name: string;
  avatar: string;
  description: string;
  systemPrompt: string;
  model: ChatModel;
  temperature: number;
  maxTokens: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isBuiltin?: boolean;
  // Lobe Chat extras
  category?: string;
  homepage?: string;
  usageCount?: number;
}

// ---------------------------------------------------------------------------
// Topic (Lobe Chat: conversation topic within a session)
// ---------------------------------------------------------------------------

export interface Topic {
  id: string;
  sessionId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  favorite?: boolean;
}

// ---------------------------------------------------------------------------
// Session Group (Lobe Chat: pinned, custom groups)
// ---------------------------------------------------------------------------

export interface SessionGroup {
  id: string;
  name: string;
  sort: number;
}

// ---------------------------------------------------------------------------
// Session (Lobe Chat: each "conversation" is a session with an agent)
// ---------------------------------------------------------------------------

export interface Session {
  id: string;
  title: string;
  agentId: string;
  groupId?: string;           // session group
  activeTopicId?: string;     // current topic in this session
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  archived?: boolean;
  // Per-session model overrides (Lobe Chat pattern)
  model?: ChatModel;
  temperature?: number;
  maxTokens?: number;
  systemPromptOverride?: string;
}

// ---------------------------------------------------------------------------
// Built-in agents (Lobe Chat: Assistant Store)
// ---------------------------------------------------------------------------

export const BUILTIN_AGENTS: AgentPersona[] = [
  {
    id: "default",
    name: "LobeChat Assistant",
    avatar: "🤖",
    description: "A versatile AI assistant that can help with a wide range of tasks",
    systemPrompt: "You are a helpful, harmless, and honest AI assistant. You provide clear, accurate, and well-structured responses. Use Markdown formatting when appropriate. Use code blocks with language identifiers for code.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.6,
    maxTokens: 4096,
    tags: ["general", "assistant"],
    category: "general",
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
    usageCount: 0,
  },
  {
    id: "creative-writer",
    name: "Creative Muse",
    avatar: "✨",
    description: "Expert at creative writing, storytelling, copywriting, and content creation",
    systemPrompt: "You are a masterful creative writer. You excel at storytelling, persuasive copy, poetry, screenwriting, and all forms of creative text. Adapt your tone and style to the user's needs. Use vivid language and compelling narrative techniques.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.9,
    maxTokens: 4096,
    tags: ["creative", "writing", "content"],
    category: "creative",
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
    usageCount: 0,
  },
  {
    id: "code-pilot",
    name: "Code Pilot",
    avatar: "👨‍💻",
    description: "Senior full-stack developer — writes clean, tested, production-ready code",
    systemPrompt: "You are an expert software engineer with deep knowledge of TypeScript, React, Node.js, Python, and system design. Write clean, efficient, well-documented code. Always use proper code blocks with language identifiers. Follow best practices, SOLID principles, and modern patterns. Consider edge cases and error handling.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.3,
    maxTokens: 8192,
    tags: ["code", "full-stack", "typescript", "react"],
    category: "programming",
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
    usageCount: 0,
  },
  {
    id: "data-scientist",
    name: "Data Scientist",
    avatar: "📊",
    description: "Data analysis, ML, statistics, and visualization expert",
    systemPrompt: "You are a senior data scientist. You excel at statistical analysis, machine learning, data visualization, SQL, Python/R data processing, and extracting actionable insights. Use tables, charts descriptions, and structured formats when presenting data.",
    model: "gpt-4o",
    temperature: 0.4,
    maxTokens: 4096,
    tags: ["data", "ML", "analytics", "python"],
    category: "data",
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
    usageCount: 0,
  },
  {
    id: "strategy-advisor",
    name: "Strategy Advisor",
    avatar: "🎯",
    description: "Business strategy, market analysis, and growth consulting",
    systemPrompt: "You are a seasoned business strategist with expertise in market analysis, competitive strategy, growth hacking, financial modeling, and operations. Provide actionable advice backed by frameworks (Porter's Five Forces, SWOT, Blue Ocean) and real-world examples.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.6,
    maxTokens: 4096,
    tags: ["business", "strategy", "marketing"],
    category: "business",
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
    usageCount: 0,
  },
  {
    id: "ux-designer",
    name: "UX Architect",
    avatar: "🎨",
    description: "UI/UX design, user research, design systems, and accessibility",
    systemPrompt: "You are a senior UX architect with deep expertise in user interface design, user experience research, design systems, accessibility (WCAG), typography, color theory, and interaction design. Provide specific, actionable design guidance with rationale.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 4096,
    tags: ["UX", "UI", "design", "accessibility"],
    category: "design",
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
    usageCount: 0,
  },
  {
    id: "copywriter",
    name: "Copy Chief",
    avatar: "📝",
    description: "Marketing copy, ads, emails, landing pages, and SEO content",
    systemPrompt: "You are a conversion-focused copywriter. Write compelling headlines, persuasive CTAs, engaging email sequences, high-converting landing page copy, and SEO-optimized content. Use proven frameworks (AIDA, PAS, BAB). A/B test suggestions when relevant.",
    model: "gpt-4o",
    temperature: 0.8,
    maxTokens: 4096,
    tags: ["copywriting", "marketing", "SEO"],
    category: "marketing",
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
    usageCount: 0,
  },
  {
    id: "devops-engineer",
    name: "DevOps Engineer",
    avatar: "🔧",
    description: "CI/CD, Docker, Kubernetes, cloud infrastructure, and monitoring",
    systemPrompt: "You are a senior DevOps/SRE engineer. You excel at CI/CD pipelines, containerization (Docker, K8s), cloud infrastructure (AWS, GCP, Azure), IaC (Terraform, Pulumi), monitoring, and incident response. Provide production-ready configurations and best practices.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.3,
    maxTokens: 4096,
    tags: ["DevOps", "Docker", "K8s", "cloud"],
    category: "programming",
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
    usageCount: 0,
  },
  {
    id: "language-tutor",
    name: "Language Tutor",
    avatar: "🌍",
    description: "Language learning, translation, grammar, and cultural context",
    systemPrompt: "You are a patient, encouraging language teacher fluent in many languages. Help users learn vocabulary, grammar, pronunciation tips, and cultural context. Provide example sentences, conversational practice, and corrections with explanations. Adapt difficulty to the learner's level.",
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 4096,
    tags: ["languages", "translation", "learning"],
    category: "education",
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
    usageCount: 0,
  },
  {
    id: "research-assistant",
    name: "Research Analyst",
    avatar: "🔬",
    description: "Academic research, literature review, paper writing, and citation",
    systemPrompt: "You are a meticulous research analyst. Help with literature reviews, research methodology, data interpretation, paper structuring, and academic writing. Cite sources in proper academic format. Distinguish between correlation and causation. Present findings objectively.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.4,
    maxTokens: 8192,
    tags: ["research", "academic", "analysis"],
    category: "education",
    createdAt: 0,
    updatedAt: 0,
    isBuiltin: true,
    usageCount: 0,
  },
];

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------

interface AIChatV2Form {
  sessions: Session[];
  activeSessionId: string;
  sessionGroups: SessionGroup[];
  agents: AgentPersona[];       // custom agents (builtin separate)
  topics: Topic[];
  globalModel: ChatModel;
  // UI state persisted
  showTopicPanel: boolean;
  showSettingsPanel: boolean;
}

const DEFAULT_FORM: AIChatV2Form = {
  sessions: [],
  activeSessionId: "",
  sessionGroups: [],
  agents: [],
  topics: [],
  globalModel: "claude-sonnet-4-20250514",
  showTopicPanel: false,
  showSettingsPanel: false,
};

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface AIChatV2State {
  form: AIChatV2Form;

  // Form-level
  setForm: (form: AIChatV2Form) => void;
  resetForm: () => void;

  // ── Session slice ──
  createSession: (agentId?: string) => string;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  setActiveSession: (id: string) => void;
  pinSession: (id: string) => void;
  archiveSession: (id: string) => void;
  duplicateSession: (id: string) => string;
  moveSessionToGroup: (sessionId: string, groupId: string | undefined) => void;
  updateSessionSettings: (id: string, patch: Pick<Session, "model" | "temperature" | "maxTokens" | "systemPromptOverride">) => void;

  // ── Session Group slice ──
  createSessionGroup: (name: string) => string;
  renameSessionGroup: (id: string, name: string) => void;
  deleteSessionGroup: (id: string) => void;
  reorderSessionGroups: (ids: string[]) => void;

  // ── Message slice ──
  addMessage: (sessionId: string, msg: Omit<ChatMessage, "id" | "createdAt">) => string;
  editMessage: (sessionId: string, msgId: string, content: string) => void;
  deleteMessage: (sessionId: string, msgId: string) => void;
  bookmarkMessage: (sessionId: string, msgId: string) => void;
  forkFromMessage: (sessionId: string, msgId: string) => string;
  regenerateMessage: (sessionId: string, msgId: string) => void;
  setMessageTranslation: (sessionId: string, msgId: string, translation: string) => void;
  clearMessages: (sessionId: string) => void;

  // ── Topic slice ──
  createTopic: (sessionId: string, title?: string) => string;
  renameTopic: (topicId: string, title: string) => void;
  deleteTopic: (topicId: string) => void;
  toggleTopicFav: (topicId: string) => void;
  setActiveTopic: (sessionId: string, topicId: string | undefined) => void;
  autoNameTopic: (topicId: string, firstMessage: string) => void;

  // ── Agent slice ──
  createAgent: (agent: Omit<AgentPersona, "id" | "createdAt" | "updatedAt">) => string;
  updateAgent: (id: string, patch: Partial<AgentPersona>) => void;
  deleteAgent: (id: string) => void;
  cloneAgent: (id: string) => string;
  incrementAgentUsage: (id: string) => void;

  // ── Global ──
  setGlobalModel: (model: ChatModel) => void;
  toggleTopicPanel: () => void;
  toggleSettingsPanel: () => void;

  // ── Export / Import ──
  exportSession: (sessionId: string, format: "json" | "markdown" | "text") => string;
  importSessions: (data: string) => number;

  // ── Selectors (non-mutating) ──
  getActiveSession: () => Session | undefined;
  getSessionAgent: (session?: Session) => AgentPersona;
  getSessionModel: (session?: Session) => ModelOption;
  getSessionTopics: (sessionId: string) => Topic[];
  getSessionsByGroup: (groupId: string | undefined) => Session[];
  getPinnedSessions: () => Session[];
  getAllAgents: () => AgentPersona[];
  getAgentsByCategory: (cat: string) => AgentPersona[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAIChatV2Editor = create<AIChatV2State>()(
  persist(
    immer((set, get) => ({
      form: DEFAULT_FORM,

      setForm: (form) => set({ form }),
      resetForm: () => set({ form: { ...DEFAULT_FORM, sessions: [], agents: [], topics: [], sessionGroups: [] } }),

      // ══════════════════════════════════════════════════════════════════
      // Session Slice
      // ══════════════════════════════════════════════════════════════════

      createSession: (agentId) => {
        const id = uuid();
        const agent = agentId || "default";
        set((s) => {
          s.form.sessions.unshift({
            id,
            title: "New Session",
            agentId: agent,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          s.form.activeSessionId = id;
        });
        return id;
      },

      deleteSession: (id) => set((s) => {
        s.form.sessions = s.form.sessions.filter((ss) => ss.id !== id);
        s.form.topics = s.form.topics.filter((t) => t.sessionId !== id);
        if (s.form.activeSessionId === id) {
          s.form.activeSessionId = s.form.sessions[0]?.id || "";
        }
      }),

      renameSession: (id, title) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === id);
        if (ss) { ss.title = title; ss.updatedAt = Date.now(); }
      }),

      setActiveSession: (id) => set((s) => { s.form.activeSessionId = id; }),

      pinSession: (id) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === id);
        if (ss) ss.pinned = !ss.pinned;
      }),

      archiveSession: (id) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === id);
        if (ss) ss.archived = !ss.archived;
      }),

      duplicateSession: (id) => {
        const newId = uuid();
        set((s) => {
          const src = s.form.sessions.find((x) => x.id === id);
          if (!src) return;
          s.form.sessions.unshift({
            ...JSON.parse(JSON.stringify(src)),
            id: newId,
            title: `${src.title} (copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            pinned: false,
          });
          s.form.activeSessionId = newId;
        });
        return newId;
      },

      moveSessionToGroup: (sessionId, groupId) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === sessionId);
        if (ss) ss.groupId = groupId;
      }),

      updateSessionSettings: (id, patch) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === id);
        if (ss) {
          if (patch.model !== undefined) ss.model = patch.model;
          if (patch.temperature !== undefined) ss.temperature = patch.temperature;
          if (patch.maxTokens !== undefined) ss.maxTokens = patch.maxTokens;
          if (patch.systemPromptOverride !== undefined) ss.systemPromptOverride = patch.systemPromptOverride;
          ss.updatedAt = Date.now();
        }
      }),

      // ══════════════════════════════════════════════════════════════════
      // Session Group Slice
      // ══════════════════════════════════════════════════════════════════

      createSessionGroup: (name) => {
        const id = uuid();
        set((s) => {
          s.form.sessionGroups.push({ id, name, sort: s.form.sessionGroups.length });
        });
        return id;
      },

      renameSessionGroup: (id, name) => set((s) => {
        const g = s.form.sessionGroups.find((x) => x.id === id);
        if (g) g.name = name;
      }),

      deleteSessionGroup: (id) => set((s) => {
        s.form.sessionGroups = s.form.sessionGroups.filter((x) => x.id !== id);
        // Un-assign sessions from this group
        for (const ss of s.form.sessions) {
          if (ss.groupId === id) ss.groupId = undefined;
        }
      }),

      reorderSessionGroups: (ids) => set((s) => {
        s.form.sessionGroups = ids
          .map((id, i) => {
            const g = s.form.sessionGroups.find((x) => x.id === id);
            return g ? { ...g, sort: i } : null;
          })
          .filter(Boolean) as SessionGroup[];
      }),

      // ══════════════════════════════════════════════════════════════════
      // Message Slice
      // ══════════════════════════════════════════════════════════════════

      addMessage: (sessionId, msg) => {
        const msgId = uuid();
        set((s) => {
          const ss = s.form.sessions.find((x) => x.id === sessionId);
          if (!ss) return;
          ss.messages.push({
            ...msg,
            id: msgId,
            createdAt: Date.now(),
            tokenEstimate: estimateTokens(msg.content),
          });
          ss.updatedAt = Date.now();
          // Auto-rename on first user message
          if (ss.messages.length === 1 && msg.role === "user") {
            ss.title = msg.content.slice(0, 50) + (msg.content.length > 50 ? "…" : "");
          }
        });
        return msgId;
      },

      editMessage: (sessionId, msgId, content) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === sessionId);
        if (!ss) return;
        const msg = ss.messages.find((m) => m.id === msgId);
        if (msg) {
          msg.content = content;
          msg.tokenEstimate = estimateTokens(content);
          ss.updatedAt = Date.now();
        }
      }),

      deleteMessage: (sessionId, msgId) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === sessionId);
        if (ss) {
          ss.messages = ss.messages.filter((m) => m.id !== msgId);
          ss.updatedAt = Date.now();
        }
      }),

      bookmarkMessage: (sessionId, msgId) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === sessionId);
        if (!ss) return;
        const msg = ss.messages.find((m) => m.id === msgId);
        if (msg) msg.bookmarked = !msg.bookmarked;
      }),

      forkFromMessage: (sessionId, msgId) => {
        const newId = uuid();
        set((s) => {
          const ss = s.form.sessions.find((x) => x.id === sessionId);
          if (!ss) return;
          const idx = ss.messages.findIndex((m) => m.id === msgId);
          if (idx < 0) return;
          const forkedMessages = JSON.parse(JSON.stringify(ss.messages.slice(0, idx + 1)));
          s.form.sessions.unshift({
            id: newId,
            title: `Fork: ${ss.title}`,
            agentId: ss.agentId,
            messages: forkedMessages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          s.form.activeSessionId = newId;
        });
        return newId;
      },

      regenerateMessage: (sessionId, msgId) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === sessionId);
        if (!ss) return;
        const idx = ss.messages.findIndex((m) => m.id === msgId);
        if (idx < 0) return;
        if (ss.messages[idx]?.role === "assistant") {
          ss.messages = ss.messages.slice(0, idx);
          ss.updatedAt = Date.now();
        }
      }),

      setMessageTranslation: (sessionId, msgId, translation) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === sessionId);
        if (!ss) return;
        const msg = ss.messages.find((m) => m.id === msgId);
        if (msg) msg.translated = translation;
      }),

      clearMessages: (sessionId) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === sessionId);
        if (ss) {
          ss.messages = [];
          ss.updatedAt = Date.now();
        }
      }),

      // ══════════════════════════════════════════════════════════════════
      // Topic Slice
      // ══════════════════════════════════════════════════════════════════

      createTopic: (sessionId, title) => {
        const id = uuid();
        set((s) => {
          s.form.topics.push({
            id,
            sessionId,
            title: title || "New Topic",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          const ss = s.form.sessions.find((x) => x.id === sessionId);
          if (ss) ss.activeTopicId = id;
        });
        return id;
      },

      renameTopic: (topicId, title) => set((s) => {
        const t = s.form.topics.find((x) => x.id === topicId);
        if (t) { t.title = title; t.updatedAt = Date.now(); }
      }),

      deleteTopic: (topicId) => set((s) => {
        s.form.topics = s.form.topics.filter((x) => x.id !== topicId);
        for (const ss of s.form.sessions) {
          if (ss.activeTopicId === topicId) ss.activeTopicId = undefined;
        }
      }),

      toggleTopicFav: (topicId) => set((s) => {
        const t = s.form.topics.find((x) => x.id === topicId);
        if (t) t.favorite = !t.favorite;
      }),

      setActiveTopic: (sessionId, topicId) => set((s) => {
        const ss = s.form.sessions.find((x) => x.id === sessionId);
        if (ss) ss.activeTopicId = topicId;
      }),

      autoNameTopic: (topicId, firstMessage) => set((s) => {
        const t = s.form.topics.find((x) => x.id === topicId);
        if (t && t.title === "New Topic") {
          t.title = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "…" : "");
        }
      }),

      // ══════════════════════════════════════════════════════════════════
      // Agent Slice
      // ══════════════════════════════════════════════════════════════════

      createAgent: (agent) => {
        const id = uuid();
        set((s) => {
          s.form.agents.push({ ...agent, id, createdAt: Date.now(), updatedAt: Date.now() });
        });
        return id;
      },

      updateAgent: (id, patch) => set((s) => {
        const a = s.form.agents.find((x) => x.id === id);
        if (a) Object.assign(a, patch, { updatedAt: Date.now() });
      }),

      deleteAgent: (id) => set((s) => {
        s.form.agents = s.form.agents.filter((x) => x.id !== id);
      }),

      cloneAgent: (id) => {
        const newId = uuid();
        set((s) => {
          const all = [...BUILTIN_AGENTS, ...s.form.agents];
          const src = all.find((x) => x.id === id);
          if (!src) return;
          s.form.agents.push({
            ...JSON.parse(JSON.stringify(src)),
            id: newId,
            name: `${src.name} (clone)`,
            isBuiltin: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        });
        return newId;
      },

      incrementAgentUsage: (id) => set((s) => {
        const all = [...BUILTIN_AGENTS, ...s.form.agents];
        const a = all.find((x) => x.id === id);
        if (a) a.usageCount = (a.usageCount || 0) + 1;
      }),

      // ══════════════════════════════════════════════════════════════════
      // Global
      // ══════════════════════════════════════════════════════════════════

      setGlobalModel: (model) => set((s) => { s.form.globalModel = model; }),
      toggleTopicPanel: () => set((s) => { s.form.showTopicPanel = !s.form.showTopicPanel; }),
      toggleSettingsPanel: () => set((s) => { s.form.showSettingsPanel = !s.form.showSettingsPanel; }),

      // ══════════════════════════════════════════════════════════════════
      // Export / Import
      // ══════════════════════════════════════════════════════════════════

      exportSession: (sessionId, format) => {
        const ss = get().form.sessions.find((x) => x.id === sessionId);
        if (!ss) return "";
        if (format === "json") return JSON.stringify(ss, null, 2);
        if (format === "markdown") {
          let md = `# ${ss.title}\n\n`;
          for (const msg of ss.messages) {
            const role = msg.role === "user" ? "**You**" : msg.role === "assistant" ? "**AI**" : "**System**";
            md += `### ${role}\n${msg.content}\n\n---\n\n`;
          }
          return md;
        }
        return ss.messages.map((m) => `[${m.role}]: ${m.content}`).join("\n\n");
      },

      importSessions: (data) => {
        try {
          const parsed = JSON.parse(data);
          const items = Array.isArray(parsed) ? parsed : [parsed];
          let imported = 0;
          set((s) => {
            for (const item of items) {
              if (item.id && Array.isArray(item.messages)) {
                s.form.sessions.unshift({
                  ...item,
                  id: uuid(),
                  createdAt: item.createdAt || Date.now(),
                  updatedAt: Date.now(),
                });
                imported++;
              }
            }
          });
          return imported;
        } catch { return 0; }
      },

      // ══════════════════════════════════════════════════════════════════
      // Selectors
      // ══════════════════════════════════════════════════════════════════

      getActiveSession: () => {
        const s = get().form;
        return s.sessions.find((x) => x.id === s.activeSessionId);
      },

      getSessionAgent: (session) => {
        const ss = session || get().getActiveSession();
        if (!ss) return BUILTIN_AGENTS[0];
        const all = [...BUILTIN_AGENTS, ...get().form.agents];
        return all.find((a) => a.id === ss.agentId) || BUILTIN_AGENTS[0];
      },

      getSessionModel: (session) => {
        const ss = session || get().getActiveSession();
        const modelId = ss?.model || get().form.globalModel;
        return MODEL_OPTIONS.find((m) => m.id === modelId) || MODEL_OPTIONS[0];
      },

      getSessionTopics: (sessionId) => {
        return get().form.topics
          .filter((t) => t.sessionId === sessionId)
          .sort((a, b) => b.updatedAt - a.updatedAt);
      },

      getSessionsByGroup: (groupId) => {
        return get().form.sessions.filter((s) => !s.archived && s.groupId === groupId);
      },

      getPinnedSessions: () => {
        return get().form.sessions.filter((s) => s.pinned && !s.archived);
      },

      getAllAgents: () => {
        return [...BUILTIN_AGENTS, ...get().form.agents];
      },

      getAgentsByCategory: (cat) => {
        const all = [...BUILTIN_AGENTS, ...get().form.agents];
        return cat === "all" ? all : all.filter((a) => a.category === cat);
      },
    })),
    { name: "dmsuite-ai-chat-v2" }
  )
);
