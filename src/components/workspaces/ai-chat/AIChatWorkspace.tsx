"use client";

// =============================================================================
// DMSuite -- AI Chat Workspace (LobeChat-style)
// Uses @lobehub/ui chat components with the exact LobeChat look & feel.
// Connected to /api/chat Vercel AI SDK streaming endpoint.
//
// Key layout fix: ThemeProvider from @lobehub/ui inserts a wrapper div that
// breaks the CSS flex height chain. We solve this by using
// position:relative on the outer div + position:absolute;inset:0 on the
// inner layout div, bypassing whatever ThemeProvider renders.
//
// Dark mode: We read DMSuite's class-based dark mode (.dark on <html>)
// and pass it explicitly to ThemeProvider's appearance prop.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThemeProvider } from "@lobehub/ui";
import { ChatList, ChatInputArea, BackBottom } from "@lobehub/ui/chat";
import type { ChatMessage } from "@lobehub/ui/chat";
import { useAIChatEditor, type Provider } from "@/stores/ai-chat-editor";

// ---------------------------------------------------------------------------
// Theme-aware color tokens
// ---------------------------------------------------------------------------

const DARK = {
  bg: "#0a0a0c",
  bgSidebar: "#09090b",
  bgCard: "#18181b",
  bgHover: "#27272a",
  bgActive: "rgba(139,92,246,0.12)",
  bgInput: "#18181b",
  border: "#27272a",
  borderLight: "#1f1f23",
  text: "#fafafa",
  textSecondary: "#a1a1aa",
  textTertiary: "#71717a",
  textMuted: "#52525b",
  primary: "#8b5cf6",
  primaryText: "#a78bfa",
} as const;

const LIGHT = {
  bg: "#ffffff",
  bgSidebar: "#fafafa",
  bgCard: "#f4f4f5",
  bgHover: "#f4f4f5",
  bgActive: "rgba(139,92,246,0.08)",
  bgInput: "#f4f4f5",
  border: "#e4e4e7",
  borderLight: "#f4f4f5",
  text: "#09090b",
  textSecondary: "#52525b",
  textTertiary: "#71717a",
  textMuted: "#a1a1aa",
  primary: "#8b5cf6",
  primaryText: "#7c3aed",
} as const;

type Colors = { [K in keyof typeof DARK]: string };

// ---------------------------------------------------------------------------
// Model definitions
// ---------------------------------------------------------------------------

interface ModelOption {
  id: string;
  label: string;
  provider: Provider;
  description: string;
}

const MODELS: ModelOption[] = [
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", provider: "claude", description: "Balanced -- fast & smart" },
  { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", provider: "claude", description: "Lightning fast" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", description: "OpenAI flagship" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai", description: "Fast & affordable" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "gemini", description: "Google latest" },
  { id: "deepseek-chat", label: "DeepSeek Chat", provider: "deepseek", description: "Open source" },
];

// ---------------------------------------------------------------------------
// useDMSuiteDark -- sync with DMSuite class-based dark mode
// ---------------------------------------------------------------------------

function useDMSuiteDark() {
  const [isDark, setIsDark] = useState(true); // default dark (DMSuite default)
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

// ---------------------------------------------------------------------------
// Conversation Sidebar
// ---------------------------------------------------------------------------

function ConversationSidebar({ c }: { c: Colors }) {
  const conversations = useAIChatEditor((s) => s.conversations);
  const activeId = useAIChatEditor((s) => s.activeConversationId);
  const createConversation = useAIChatEditor((s) => s.createConversation);
  const setActive = useAIChatEditor((s) => s.setActiveConversation);
  const deleteConversation = useAIChatEditor((s) => s.deleteConversation);
  const [search, setSearch] = useState("");

  const pinned = conversations.filter((cv) => cv.pinned);
  const unpinned = conversations.filter((cv) => !cv.pinned);
  const filtered = (list: typeof conversations) =>
    search
      ? list.filter((cv) => cv.title.toLowerCase().includes(search.toLowerCase()))
      : list;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: c.bgSidebar }}>
      {/* New chat button */}
      <div style={{ padding: "12px 12px 8px" }}>
        <button
          onClick={() => createConversation()}
          style={{
            display: "flex", width: "100%", alignItems: "center", justifyContent: "center",
            gap: 8, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 600,
            background: c.primary, color: "#fff", border: "none", cursor: "pointer",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Chat
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "0 12px 8px" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          style={{
            width: "100%", borderRadius: 8, border: "none", padding: "6px 10px",
            fontSize: 13, outline: "none", background: c.bgCard, color: c.text,
          }}
        />
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {pinned.length > 0 && (
          <>
            <div style={{ padding: "6px 8px 2px", fontSize: 11, fontWeight: 600, color: c.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Pinned
            </div>
            {filtered(pinned).map((cv) => (
              <ConversationItem key={cv.id} conv={cv} active={cv.id === activeId} onClick={() => setActive(cv.id)} onDelete={() => deleteConversation(cv.id)} c={c} />
            ))}
          </>
        )}
        {unpinned.length > 0 && (
          <>
            {pinned.length > 0 && (
              <div style={{ padding: "8px 8px 2px", fontSize: 11, fontWeight: 600, color: c.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Conversations
              </div>
            )}
            {filtered(unpinned).map((cv) => (
              <ConversationItem key={cv.id} conv={cv} active={cv.id === activeId} onClick={() => setActive(cv.id)} onDelete={() => deleteConversation(cv.id)} c={c} />
            ))}
          </>
        )}
        {conversations.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", textAlign: "center", color: c.textMuted, fontSize: 13 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.4 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            No conversations yet
            <span style={{ fontSize: 12, marginTop: 4, color: c.textMuted }}>
              Click &quot;New Chat&quot; to start
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conv, active, onClick, onDelete, c,
}: {
  conv: { id: string; title: string; messages: { content: string }[]; updatedAt: number; pinned?: boolean };
  active: boolean; onClick: () => void; onDelete: () => void; c: Colors;
}) {
  const lastMsg = conv.messages[conv.messages.length - 1];
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", borderRadius: 8,
        padding: "8px 10px", marginBottom: 2, cursor: "pointer",
        background: active ? c.bgActive : hovered ? c.bgHover : "transparent",
        transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: active ? c.primaryText : c.text, flex: 1, minWidth: 0,
        }}>
          {conv.title}
        </span>
        {hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ marginLeft: 4, padding: 2, background: "none", border: "none", cursor: "pointer", color: c.textTertiary, borderRadius: 4, display: "flex" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
      {lastMsg && (
        <span style={{ marginTop: 2, fontSize: 11, color: c.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {lastMsg.content.slice(0, 60)}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Model Selector
// ---------------------------------------------------------------------------

function ModelSelector({ c }: { c: Colors }) {
  const model = useAIChatEditor((s) => s.model);
  const setModel = useAIChatEditor((s) => s.setModel);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = MODELS.find((m) => m.id === model) ?? MODELS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6, borderRadius: 8,
          padding: "4px 10px", fontSize: 13, fontWeight: 500, border: "none",
          cursor: "pointer", background: c.bgCard, color: c.textSecondary,
        }}
      >
        {current.label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", left: 0, top: "100%", zIndex: 50,
          marginTop: 4, minWidth: 220, borderRadius: 12, overflow: "hidden",
          border: `1px solid ${c.border}`, background: c.bgSidebar,
          boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
        }}>
          {MODELS.map((m) => (
            <div
              key={m.id}
              onClick={() => { setModel(m.id, m.provider); setOpen(false); }}
              style={{
                display: "flex", flexDirection: "column", padding: "8px 14px",
                cursor: "pointer", transition: "background 0.1s",
                background: m.id === model ? c.bgActive : "transparent",
              }}
              onMouseEnter={(e) => { if (m.id !== model) (e.currentTarget.style.background = c.bgHover); }}
              onMouseLeave={(e) => { e.currentTarget.style.background = m.id === model ? c.bgActive : "transparent"; }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{m.label}</span>
              <span style={{ fontSize: 11, color: c.textTertiary }}>{m.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Empty Prompt (inside an active conversation with 0 messages)
// ---------------------------------------------------------------------------

function ChatEmptyPrompt({ c }: { c: Colors }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", padding: 32, textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, display: "flex",
        alignItems: "center", justifyContent: "center", marginBottom: 16,
        background: c.bgCard,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: c.text, margin: 0, marginBottom: 8 }}>
        What can I help you with?
      </h3>
      <p style={{ fontSize: 13, color: c.textTertiary, margin: 0, maxWidth: 360, lineHeight: 1.5 }}>
        Ask me anything -- I can help with coding, writing, analysis, brainstorming, and more.
        Type a message below to get started.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// No-Conversation Empty state
// ---------------------------------------------------------------------------

function EmptyState({ c }: { c: Colors }) {
  const createConversation = useAIChatEditor((s) => s.createConversation);
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", padding: 24,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20, display: "flex",
        alignItems: "center", justifyContent: "center", marginBottom: 20,
        background: c.bgCard,
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: c.text, margin: "0 0 8px" }}>
        Start a New Conversation
      </h2>
      <p style={{ fontSize: 14, color: c.textSecondary, margin: "0 0 20px", maxWidth: 380, textAlign: "center", lineHeight: 1.5 }}>
        Chat with multiple AI models -- Claude, GPT-4o, Gemini &amp; DeepSeek.
        Select a conversation or create a new one to begin.
      </p>
      <button
        onClick={() => createConversation()}
        style={{
          borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600,
          color: "#fff", background: c.primary, border: "none", cursor: "pointer",
        }}
      >
        New Chat
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Panel
// ---------------------------------------------------------------------------

function SettingsPanel({ open, onClose, c }: { open: boolean; onClose: () => void; c: Colors }) {
  const systemPrompt = useAIChatEditor((s) => s.systemPrompt);
  const setSystemPrompt = useAIChatEditor((s) => s.setSystemPrompt);
  const temperature = useAIChatEditor((s) => s.temperature);
  const setTemperature = useAIChatEditor((s) => s.setTemperature);
  const maxTokens = useAIChatEditor((s) => s.maxTokens);
  const setMaxTokens = useAIChatEditor((s) => s.setMaxTokens);

  if (!open) return null;

  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: 320, zIndex: 40,
      display: "flex", flexDirection: "column",
      borderLeft: `1px solid ${c.border}`, background: c.bgSidebar,
      boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: `1px solid ${c.border}`,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Chat Settings</span>
        <button onClick={onClose} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: c.textTertiary, display: "flex" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {/* System Prompt */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: c.textSecondary, marginBottom: 6 }}>System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            style={{
              width: "100%", resize: "none", borderRadius: 8, padding: "8px 10px",
              fontSize: 13, outline: "none", border: `1px solid ${c.border}`,
              background: c.bgCard, color: c.text, fontFamily: "inherit",
            }}
          />
        </div>
        {/* Temperature */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontWeight: 500, color: c.textSecondary, marginBottom: 6 }}>
            <span>Temperature</span>
            <span style={{ color: c.textTertiary, fontFamily: "monospace" }}>{temperature.toFixed(1)}</span>
          </label>
          <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} style={{ width: "100%", accentColor: c.primary }} />
        </div>
        {/* Max Tokens */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontWeight: 500, color: c.textSecondary, marginBottom: 6 }}>
            <span>Max Tokens</span>
            <span style={{ color: c.textTertiary, fontFamily: "monospace" }}>{maxTokens}</span>
          </label>
          <input type="range" min="256" max="8192" step="256" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} style={{ width: "100%", accentColor: c.primary }} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Workspace
// ---------------------------------------------------------------------------

export default function AIChatWorkspace() {
  const conversations = useAIChatEditor((s) => s.conversations);
  const activeId = useAIChatEditor((s) => s.activeConversationId);
  const inputValue = useAIChatEditor((s) => s.inputValue);
  const setInputValue = useAIChatEditor((s) => s.setInputValue);
  const isStreaming = useAIChatEditor((s) => s.isStreaming);
  const sendMessage = useAIChatEditor((s) => s.sendMessage);
  const stopStreaming = useAIChatEditor((s) => s.stopStreaming);
  const sidebarOpen = useAIChatEditor((s) => s.sidebarOpen);
  const toggleSidebar = useAIChatEditor((s) => s.toggleSidebar);
  const deleteMessage = useAIChatEditor((s) => s.deleteMessage);
  const editMessage = useAIChatEditor((s) => s.editMessage);
  const createConversation = useAIChatEditor((s) => s.createConversation);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);
  const isDark = useDMSuiteDark();
  const c: Colors = isDark ? DARK : LIGHT;

  const activeConv = useMemo(
    () => conversations.find((cv) => cv.id === activeId),
    [conversations, activeId],
  );

  // Auto-create conversation if none exists when trying to send
  const handleSend = useCallback(() => {
    if (!activeId) {
      createConversation();
      setTimeout(() => { useAIChatEditor.getState().sendMessage(); }, 0);
      return;
    }
    sendMessage();
  }, [activeId, createConversation, sendMessage]);

  // Transform store messages to @lobehub/ui ChatMessage format
  const chatMessages: ChatMessage[] = useMemo(() => {
    if (!activeConv) return [];
    return activeConv.messages.map((m) => ({
      id: m.id,
      content: m.content,
      role: m.role as "user" | "assistant" | "system",
      createAt: m.createAt,
      updateAt: m.updateAt,
      meta: m.meta,
      error: m.error ? { message: m.error.message, type: m.error.type as never } : undefined,
    }));
  }, [activeConv]);

  // Loading ID for streaming indicator
  const loadingId = useMemo(() => {
    if (!isStreaming || !activeConv) return undefined;
    const msgs = activeConv.messages;
    const last = msgs[msgs.length - 1];
    return last?.role === "assistant" ? last.id : undefined;
  }, [isStreaming, activeConv]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!chatListRef.current) return;
    const el = chatListRef.current;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (dist < 300) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages.length, chatMessages.at(-1)?.content]);

  const handleMessageChange = useCallback(
    (id: string, content: string) => { if (activeId) editMessage(activeId, id, content); },
    [activeId, editMessage],
  );

  const handleActionsClick = useCallback(
    (action: { key: string }, message: ChatMessage) => {
      if (action.key === "del" && activeId) deleteMessage(activeId, message.id);
      if (action.key === "copy") navigator.clipboard.writeText(message.content);
    },
    [activeId, deleteMessage],
  );

  return (
    // Outer container fills the flex-1 parent from page.tsx
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <ThemeProvider appearance={isDark ? "dark" : "light"}>
        {/* Absolute-positioned inner layout bypasses ThemeProvider wrapper height */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", overflow: "hidden",
          background: c.bg, color: c.text,
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}>
          {/* ── Sidebar ── */}
          {sidebarOpen && (
            <div style={{
              width: 280, flexShrink: 0, display: "flex", flexDirection: "column",
              borderRight: `1px solid ${c.border}`, overflow: "hidden",
            }}>
              <ConversationSidebar c={c} />
            </div>
          )}

          {/* ── Main chat area ── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
            {/* Header */}
            <div style={{
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 16px", height: 52, borderBottom: `1px solid ${c.border}`,
            }}>
              {/* Left: toggle + title + model */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                {!sidebarOpen && (
                  <button
                    onClick={toggleSidebar}
                    style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: c.textSecondary, display: "flex", borderRadius: 8 }}
                    title="Open sidebar"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                  </button>
                )}
                {sidebarOpen && (
                  <button
                    onClick={toggleSidebar}
                    style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: c.textTertiary, display: "flex", borderRadius: 8 }}
                    title="Close sidebar"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                  </button>
                )}
                <span style={{
                  fontSize: 15, fontWeight: 600, color: c.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {activeConv?.title ?? "AI Chat"}
                </span>
                <ModelSelector c={c} />
              </div>

              {/* Right: settings */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: c.textSecondary, display: "flex", borderRadius: 8 }}
                  title="Settings"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.73 12.73 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat body -- uses minHeight:0 to prevent flex overflow */}
            {!activeConv ? (
              <div style={{ flex: 1, minHeight: 0 }}>
                <EmptyState c={c} />
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
                {/* Messages area -- scrollable */}
                <div ref={chatListRef} style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                  {chatMessages.length === 0 ? (
                    <ChatEmptyPrompt c={c} />
                  ) : (
                    <ChatList
                      data={chatMessages}
                      loadingId={loadingId}
                      onMessageChange={handleMessageChange}
                      onActionsClick={handleActionsClick}
                      showTitle
                      variant="bubble"
                      renderActions={{
                        default: (props) => (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button
                              onClick={() => navigator.clipboard.writeText(props.content)}
                              style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: c.textMuted, display: "flex", borderRadius: 4 }}
                              title="Copy"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </button>
                            {props.role === "user" && activeId && (
                              <button
                                onClick={() => deleteMessage(activeId, props.id)}
                                style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: c.textMuted, display: "flex", borderRadius: 4 }}
                                title="Delete"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ),
                      }}
                      style={{ padding: "16px 0" }}
                    />
                  )}
                </div>

                {/* Back to bottom */}
                <BackBottom
                  target={chatListRef}
                  onClick={() => { chatListRef.current?.scrollTo({ top: chatListRef.current.scrollHeight, behavior: "smooth" }); }}
                  visibilityHeight={200}
                />

                {/* Input area -- anchored at bottom */}
                <div style={{ flexShrink: 0, borderTop: `1px solid ${c.border}` }}>
                  <ChatInputArea
                    value={inputValue}
                    onInput={(v) => setInputValue(v)}
                    loading={isStreaming}
                    onSend={isStreaming ? stopStreaming : handleSend}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    heights={{ inputHeight: 120, minHeight: 80, maxHeight: 240 }}
                  />
                </div>
              </div>
            )}

            {/* Settings panel overlay */}
            <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} c={c} />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
