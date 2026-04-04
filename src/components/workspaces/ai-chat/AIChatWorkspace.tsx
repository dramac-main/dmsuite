"use client";

// =============================================================================
// DMSuite — AI Chat Workspace (LobeChat-style)
// Uses @lobehub/ui chat components with the exact LobeChat look & feel.
// Connected to /api/chat Vercel AI SDK streaming endpoint.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThemeProvider } from "@lobehub/ui";
import {
  ChatList,
  ChatInputArea,
  ChatHeader,
  ChatHeaderTitle,
  BackBottom,
} from "@lobehub/ui/chat";
import type { ChatMessage } from "@lobehub/ui/chat";
import { DraggablePanel } from "@lobehub/ui";
import { useAIChatEditor, type Provider } from "@/stores/ai-chat-editor";

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
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", provider: "claude", description: "Balanced — fast & smart" },
  { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", provider: "claude", description: "Lightning fast" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", description: "OpenAI flagship" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai", description: "Fast & affordable" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "gemini", description: "Google latest" },
  { id: "deepseek-chat", label: "DeepSeek Chat", provider: "deepseek", description: "Open source" },
];

// ---------------------------------------------------------------------------
// Conversation Sidebar
// ---------------------------------------------------------------------------

function ConversationSidebar() {
  const conversations = useAIChatEditor((s) => s.conversations);
  const activeId = useAIChatEditor((s) => s.activeConversationId);
  const createConversation = useAIChatEditor((s) => s.createConversation);
  const setActive = useAIChatEditor((s) => s.setActiveConversation);
  const deleteConversation = useAIChatEditor((s) => s.deleteConversation);
  const [search, setSearch] = useState("");

  const pinned = conversations.filter((c) => c.pinned);
  const unpinned = conversations.filter((c) => !c.pinned);
  const filtered = (list: typeof conversations) =>
    search
      ? list.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
      : list;

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--lobe-color-bg-layout)" }}>
      {/* New chat button */}
      <div className="flex items-center gap-2 p-3 pb-2">
        <button
          onClick={() => createConversation()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          style={{
            background: "var(--lobe-color-primary, #1677ff)",
            color: "#fff",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations…"
          className="w-full rounded-lg border-0 px-3 py-1.5 text-sm outline-none"
          style={{
            background: "var(--lobe-color-fill-tertiary, rgba(0,0,0,0.04))",
            color: "var(--lobe-color-text, inherit)",
          }}
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2">
        {pinned.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium" style={{ color: "var(--lobe-color-text-tertiary, #999)" }}>
              Pinned
            </div>
            {filtered(pinned).map((c) => (
              <ConversationItem
                key={c.id}
                conv={c}
                active={c.id === activeId}
                onClick={() => setActive(c.id)}
                onDelete={() => deleteConversation(c.id)}
              />
            ))}
          </>
        )}
        {unpinned.length > 0 && (
          <>
            {pinned.length > 0 && (
              <div className="px-2 py-1 text-xs font-medium" style={{ color: "var(--lobe-color-text-tertiary, #999)" }}>
                Conversations
              </div>
            )}
            {filtered(unpinned).map((c) => (
              <ConversationItem
                key={c.id}
                conv={c}
                active={c.id === activeId}
                onClick={() => setActive(c.id)}
                onDelete={() => deleteConversation(c.id)}
              />
            ))}
          </>
        )}
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-sm" style={{ color: "var(--lobe-color-text-quaternary, #bbb)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            No conversations yet
            <br />
            Click &quot;New Chat&quot; to start
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conv,
  active,
  onClick,
  onDelete,
}: {
  conv: { id: string; title: string; messages: { content: string }[]; updatedAt: number; pinned?: boolean };
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const lastMsg = conv.messages[conv.messages.length - 1];
  return (
    <div
      onClick={onClick}
      className="group relative mb-0.5 flex cursor-pointer flex-col rounded-lg px-3 py-2.5 transition-colors"
      style={{
        background: active ? "var(--lobe-color-fill-secondary, rgba(0,0,0,0.06))" : "transparent",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="truncate text-sm font-medium"
          style={{ color: active ? "var(--lobe-color-text, inherit)" : "var(--lobe-color-text-secondary, #666)" }}
        >
          {conv.title}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-1 hidden rounded p-0.5 text-xs opacity-60 transition-opacity hover:opacity-100 group-hover:block"
          style={{ color: "var(--lobe-color-text-tertiary, #999)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
      {lastMsg && (
        <span className="mt-0.5 truncate text-xs" style={{ color: "var(--lobe-color-text-quaternary, #bbb)" }}>
          {lastMsg.content.slice(0, 60)}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Model Selector
// ---------------------------------------------------------------------------

function ModelSelector() {
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        style={{
          background: "var(--lobe-color-fill-tertiary, rgba(0,0,0,0.04))",
          color: "var(--lobe-color-text, inherit)",
        }}
      >
        {current.label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-56 overflow-hidden rounded-xl border shadow-xl"
          style={{
            background: "var(--lobe-color-bg-elevated, #fff)",
            borderColor: "var(--lobe-color-border, #f0f0f0)",
          }}
        >
          {MODELS.map((m) => (
            <div
              key={m.id}
              onClick={() => { setModel(m.id, m.provider); setOpen(false); }}
              className="flex cursor-pointer flex-col px-4 py-2.5 transition-colors"
              style={{
                background: m.id === model ? "var(--lobe-color-fill-secondary, rgba(0,0,0,0.06))" : "transparent",
              }}
            >
              <span className="text-sm font-medium" style={{ color: "var(--lobe-color-text, inherit)" }}>{m.label}</span>
              <span className="text-xs" style={{ color: "var(--lobe-color-text-tertiary, #999)" }}>{m.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  const createConversation = useAIChatEditor((s) => s.createConversation);
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="mb-4 rounded-2xl p-4" style={{ background: "var(--lobe-color-fill-tertiary, rgba(0,0,0,0.04))" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--lobe-color-primary, #1677ff)" }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h2 className="mb-2 text-xl font-semibold" style={{ color: "var(--lobe-color-text, inherit)" }}>
        Start a New Conversation
      </h2>
      <p className="mb-6 max-w-sm text-center text-sm" style={{ color: "var(--lobe-color-text-secondary, #666)" }}>
        Chat with multiple AI models — Claude, GPT-4o, Gemini &amp; DeepSeek.
        Select a conversation or create a new one to begin.
      </p>
      <button
        onClick={() => createConversation()}
        className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
        style={{ background: "var(--lobe-color-primary, #1677ff)" }}
      >
        New Chat
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Panel
// ---------------------------------------------------------------------------

function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const systemPrompt = useAIChatEditor((s) => s.systemPrompt);
  const setSystemPrompt = useAIChatEditor((s) => s.setSystemPrompt);
  const temperature = useAIChatEditor((s) => s.temperature);
  const setTemperature = useAIChatEditor((s) => s.setTemperature);
  const maxTokens = useAIChatEditor((s) => s.maxTokens);
  const setMaxTokens = useAIChatEditor((s) => s.setMaxTokens);

  if (!open) return null;

  return (
    <div
      className="absolute inset-y-0 right-0 z-40 flex w-80 flex-col border-l shadow-lg"
      style={{
        background: "var(--lobe-color-bg-elevated, #fff)",
        borderColor: "var(--lobe-color-border, #f0f0f0)",
      }}
    >
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--lobe-color-border, #f0f0f0)" }}>
        <span className="text-sm font-semibold" style={{ color: "var(--lobe-color-text, inherit)" }}>Chat Settings</span>
        <button onClick={onClose} className="rounded p-1 transition-colors" style={{ color: "var(--lobe-color-text-tertiary, #999)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* System Prompt */}
        <div>
          <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--lobe-color-text-secondary, #666)" }}>System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none"
            style={{
              background: "var(--lobe-color-fill-tertiary, rgba(0,0,0,0.04))",
              borderColor: "var(--lobe-color-border, #f0f0f0)",
              color: "var(--lobe-color-text, inherit)",
            }}
          />
        </div>
        {/* Temperature */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium" style={{ color: "var(--lobe-color-text-secondary, #666)" }}>
            <span>Temperature</span>
            <span style={{ color: "var(--lobe-color-text-tertiary, #999)" }}>{temperature.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full"
          />
        </div>
        {/* Max Tokens */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-medium" style={{ color: "var(--lobe-color-text-secondary, #666)" }}>
            <span>Max Tokens</span>
            <span style={{ color: "var(--lobe-color-text-tertiary, #999)" }}>{maxTokens}</span>
          </label>
          <input
            type="range"
            min="256"
            max="8192"
            step="256"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            className="w-full"
          />
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
  const sidebarWidth = useAIChatEditor((s) => s.sidebarWidth);
  const setSidebarWidth = useAIChatEditor((s) => s.setSidebarWidth);
  const toggleSidebar = useAIChatEditor((s) => s.toggleSidebar);
  const deleteMessage = useAIChatEditor((s) => s.deleteMessage);
  const editMessage = useAIChatEditor((s) => s.editMessage);
  const createConversation = useAIChatEditor((s) => s.createConversation);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId],
  );

  // Auto-create conversation if none exists when trying to send
  const handleSend = useCallback(() => {
    if (!activeId) {
      const newId = createConversation();
      // Delay send to next tick so store is updated
      setTimeout(() => {
        useAIChatEditor.getState().sendMessage();
      }, 0);
      return;
    }
    sendMessage();
  }, [activeId, createConversation, sendMessage]);

  // Transform store messages → @lobehub/ui ChatMessage format
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

  // Loading state for the last assistant message during streaming
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
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 300) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [chatMessages.length, chatMessages[chatMessages.length - 1]?.content]);

  // Message change handler for ChatList
  const handleMessageChange = useCallback(
    (id: string, content: string) => {
      if (activeId) editMessage(activeId, id, content);
    },
    [activeId, editMessage],
  );

  // Actions handler for ChatList
  const handleActionsClick = useCallback(
    (action: { key: string }, message: ChatMessage) => {
      if (action.key === "del" && activeId) {
        deleteMessage(activeId, message.id);
      }
      if (action.key === "copy") {
        navigator.clipboard.writeText(message.content);
      }
    },
    [activeId, deleteMessage],
  );

  return (
    <ThemeProvider
      appearance="auto"
      className="lobechat-workspace"
    >
      <div className="relative flex h-full w-full overflow-hidden" style={{ background: "var(--lobe-color-bg-container, #fff)" }}>
        {/* Sidebar */}
        <DraggablePanel
          placement="left"
          defaultSize={{ width: sidebarWidth }}
          minWidth={220}
          maxWidth={400}
          expand={sidebarOpen}
          onExpandChange={(expand) => {
            if (!expand) toggleSidebar();
          }}
          onSizeChange={(_, size) => {
            if (size?.width) setSidebarWidth(size.width as number);
          }}
          showHandleWideArea
        >
          <ConversationSidebar />
        </DraggablePanel>

        {/* Main chat area */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <ChatHeader
            left={
              <div className="flex items-center gap-2">
                {!sidebarOpen && (
                  <button
                    onClick={toggleSidebar}
                    className="rounded-lg p-1.5 transition-colors"
                    style={{ color: "var(--lobe-color-text-secondary, #666)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                  </button>
                )}
                <ChatHeaderTitle
                  title={activeConv?.title ?? "AI Chat"}
                  tag={<ModelSelector />}
                />
              </div>
            }
            right={
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className="rounded-lg p-2 transition-colors"
                  style={{ color: "var(--lobe-color-text-secondary, #666)" }}
                  title="Settings"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.73 12.73 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </button>
              </div>
            }
            style={{
              borderBottom: "1px solid var(--lobe-color-border, #f0f0f0)",
              flexShrink: 0,
            }}
          />

          {/* Chat body */}
          {!activeConv ? (
            <EmptyState />
          ) : (
            <div className="relative flex min-h-0 flex-1 flex-col">
              {/* Messages */}
              <div ref={chatListRef} className="flex-1 overflow-y-auto">
                <ChatList
                  data={chatMessages}
                  loadingId={loadingId}
                  onMessageChange={handleMessageChange}
                  onActionsClick={handleActionsClick}
                  showTitle
                  variant="bubble"
                  renderActions={{
                    default: (props) => (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigator.clipboard.writeText(props.content)}
                          className="rounded p-1 transition-colors"
                          style={{ color: "var(--lobe-color-text-quaternary, #bbb)" }}
                          title="Copy"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                        {props.role === "user" && activeId && (
                          <button
                            onClick={() => deleteMessage(activeId, props.id)}
                            className="rounded p-1 transition-colors"
                            style={{ color: "var(--lobe-color-text-quaternary, #bbb)" }}
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
              </div>

              {/* Back to bottom */}
              <BackBottom
                target={chatListRef}
                onClick={() => {
                  chatListRef.current?.scrollTo({
                    top: chatListRef.current.scrollHeight,
                    behavior: "smooth",
                  });
                }}
                visibilityHeight={200}
              />

              {/* Input area */}
              <ChatInputArea
                value={inputValue}
                onInput={(v) => setInputValue(v)}
                loading={isStreaming}
                onSend={isStreaming ? stopStreaming : handleSend}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                topAddons={
                  <div className="flex items-center gap-2 px-4 py-1" style={{ borderTop: "1px solid var(--lobe-color-border, #f0f0f0)" }}>
                    <span className="text-xs" style={{ color: "var(--lobe-color-text-quaternary, #bbb)" }}>
                      {activeConv.messages.length} messages
                    </span>
                  </div>
                }
                heights={{
                  inputHeight: 150,
                  minHeight: 100,
                  maxHeight: 300,
                }}
              />
            </div>
          )}

          {/* Settings panel overlay */}
          <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
      </div>
    </ThemeProvider>
  );
}
