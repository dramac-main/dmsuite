"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useChatStore } from "@/stores";
import type { ChatMessage, ChatConversation } from "@/stores";
import {
  IconSend,
  IconPlus,
  IconTrash,
  IconSparkles,
  IconMessageCircle,
  IconLoader,
  IconCopy,
  IconCheck,
  IconSearch,
  IconDownload,
  IconX,
} from "@/components/icons";

/* ── System Prompt Presets ───────────────────────────────── */
const systemPromptPresets: { id: string; label: string; prompt: string }[] = [
  { id: "default", label: "Default", prompt: "You are a helpful AI assistant for DMSuite, a design & business creative suite." },
  { id: "creative", label: "Creative Writer", prompt: "You are a creative writing assistant. Help with taglines, copy, stories, and creative content. Be imaginative and vivid." },
  { id: "code", label: "Code Assistant", prompt: "You are an expert coding assistant. Write clean, well-documented code. Explain your reasoning." },
  { id: "business", label: "Business Advisor", prompt: "You are a business strategy advisor. Help with planning, marketing, analytics, and growth strategies." },
  { id: "design", label: "Design Consultant", prompt: "You are a design consultant. Help with color theory, typography, layout, branding, and visual design decisions." },
];

/* ── Estimate token count ────────────────────────────────── */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/* ── Message Bubble ──────────────────────────────────────── */
function MessageBubble({
  message,
  onEdit,
  onRegenerate,
}: {
  message: ChatMessage;
  onEdit?: (newContent: string) => void;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(editText.trim());
    }
    setEditing(false);
  };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-primary-500/15 text-primary-500"
            : "bg-secondary-500/15 text-secondary-500"
        }`}
      >
        {isUser ? (
          <span className="text-xs font-bold">U</span>
        ) : (
          <IconSparkles className="size-4" />
        )}
      </div>

      {/* Content */}
      <div className={`group max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-xl border border-primary-500/50 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none min-h-20"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 rounded-lg bg-primary-500 text-gray-950 text-xs font-medium hover:bg-primary-400 transition-colors"
              >
                Save &amp; Resend
              </button>
              <button
                onClick={() => { setEditing(false); setEditText(message.content); }}
                className="px-3 py-1 rounded-lg text-gray-400 hover:text-gray-300 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? "bg-primary-500 text-gray-950 rounded-tr-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-md"
            }`}
          >
            {isUser ? (
              message.content
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-code:text-primary-400 prose-headings:text-gray-900 dark:prose-headings:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {!editing && message.content && (
          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
              aria-label="Copy message"
            >
              {copied ? (
                <IconCheck className="size-3.5 text-success" />
              ) : (
                <IconCopy className="size-3.5" />
              )}
            </button>
            {isUser && onEdit && (
              <button
                onClick={() => setEditing(true)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 text-[0.625rem]"
                aria-label="Edit message"
              >
                Edit
              </button>
            )}
            {!isUser && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 text-[0.625rem]"
                aria-label="Regenerate response"
              >
                Regenerate
              </button>
            )}
            <span className="text-[0.625rem] text-gray-400">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="text-[0.625rem] text-gray-500">
              ~{estimateTokens(message.content)} tokens
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Conversation Sidebar Item ───────────────────────────── */
function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
}: {
  conversation: ChatConversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group flex items-center gap-2 ${
        isActive
          ? "bg-primary-500/10 text-primary-500"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <IconMessageCircle className="size-4 shrink-0" />
      <span className="flex-1 truncate">{conversation.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-error transition-all p-0.5"
        title="Delete conversation"
      >
        <IconTrash className="size-3.5" />
      </button>
    </button>
  );
}

/* ── Empty State ─────────────────────────────────────────── */
function EmptyState() {
  const suggestions = [
    "Write a tagline for a tech startup",
    "Create a product description for sneakers",
    "Help me write a cold email for B2B outreach",
    "Generate 5 blog post ideas about AI design",
  ];

  const { setInputDraft } = useChatStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="size-16 rounded-2xl bg-linear-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
        <IconSparkles className="size-7 text-primary-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        AI Chat Assistant
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md text-center mb-8">
        Your creative AI companion. Ask anything — from copywriting and brainstorming
        to code generation and strategy.
      </p>

      {/* Suggestion pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInputDraft(suggestion)}
            className="text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 hover:border-primary-500/50 hover:text-primary-500 transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Model Options ───────────────────────────────────────── */
const modelOptions = [
  { id: "claude", label: "Claude", provider: "anthropic", icon: "✦" },
  { id: "gpt", label: "GPT-4o", provider: "openai", icon: "◆" },
] as const;
type ModelId = (typeof modelOptions)[number]["id"];

/* ── Main Chat Workspace ─────────────────────────────────── */
export default function AIChatWorkspace() {
  const {
    conversations,
    activeConversationId,
    isGenerating,
    inputDraft,
    getActiveConversation,
    createConversation,
    setActiveConversation,
    deleteConversation,
    addMessage,
    updateLastAssistantMessage,
    setIsGenerating,
    setInputDraft,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>("claude");
  const [systemPrompt, setSystemPrompt] = useState(systemPromptPresets[0].prompt);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages ?? [];
  const activeModel = modelOptions.find((m) => m.id === selectedModel)!;

  // Token counts
  const totalTokens = useMemo(
    () => messages.reduce((sum, m) => sum + estimateTokens(m.content), 0),
    [messages]
  );

  // Filtered conversations for search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length - 1]?.content]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConversationId]);

  /** Send a message */
  const handleSend = useCallback(async (overrideContent?: string) => {
    const content = (overrideContent ?? inputDraft).trim();
    if (!content || isGenerating) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    addMessage({ role: "user", content });
    setInputDraft("");
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content },
          ],
          provider: activeModel.provider,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      addMessage({ role: "assistant", content: "" });

      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        updateLastAssistantMessage(fullContent);
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // User stopped — keep partial response
      } else {
        console.error("Chat error:", error);
        addMessage({
          role: "assistant",
          content: "I encountered an error. Please check your API key in `.env.local` and restart the dev server.",
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [inputDraft, isGenerating, activeConversationId, createConversation, addMessage, setInputDraft, setIsGenerating, messages, activeModel.provider, updateLastAssistantMessage, systemPrompt]);

  /** Stop generation */
  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  }, [setIsGenerating]);

  /** Edit a user message — re-send from that point */
  const handleEditMessage = useCallback((newContent: string) => {
    handleSend(newContent);
  }, [handleSend]);

  /** Regenerate last assistant response */
  const handleRegenerate = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  }, [messages, handleSend]);

  /** Export conversation */
  const handleExport = useCallback((format: "markdown" | "json" | "text") => {
    if (!activeConversation) return;

    let content = "";
    const filename = `chat-${activeConversation.title.replace(/\s+/g, "-").toLowerCase()}`;

    switch (format) {
      case "markdown":
        content = messages.map((m) =>
          `## ${m.role === "user" ? "You" : "Assistant"}\n\n${m.content}\n`
        ).join("\n---\n\n");
        break;
      case "json":
        content = JSON.stringify({ title: activeConversation.title, messages }, null, 2);
        break;
      case "text":
        content = messages.map((m) =>
          `[${m.role.toUpperCase()}]\n${m.content}`
        ).join("\n\n---\n\n");
        break;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${format === "json" ? "json" : format === "markdown" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeConversation, messages]);

  /** Keyboard shortcuts */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "n" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      createConversation();
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex h-[calc(100dvh-22rem)] min-h-96">
        {/* ── Chat History Sidebar ───────────────────────── */}
        <div
          className={`
            ${showHistory ? "w-64 border-r border-gray-200 dark:border-gray-800" : "w-0"}
            transition-all duration-200 overflow-hidden shrink-0
            sm:w-64 sm:border-r sm:border-gray-200 dark:sm:border-gray-800
          `}
        >
          <div className="p-3 h-full flex flex-col w-64">
            <button
              onClick={() => createConversation()}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 transition-colors mb-2"
            >
              <IconPlus className="size-4" />
              New Chat
            </button>

            {/* Conversation search */}
            <div className="relative mb-2">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full h-8 rounded-lg pl-8 pr-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 text-xs text-gray-900 dark:text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/40 transition-all"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  onClick={() => setActiveConversation(conv.id)}
                  onDelete={() => deleteConversation(conv.id)}
                />
              ))}
              {filteredConversations.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">
                  {searchQuery ? "No matches found" : "No conversations yet"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Chat Area ─────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="sm:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm flex items-center gap-1.5"
            >
              <IconMessageCircle className="size-4" />
              {showHistory ? "Hide" : "History"}
            </button>
            <div className="flex-1" />

            {/* System prompt toggle */}
            <button
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className={`text-xs px-2 py-1 rounded-md transition-colors ${
                showSystemPrompt ? "bg-primary-500/10 text-primary-500" : "text-gray-400 hover:text-gray-300"
              }`}
            >
              System
            </button>

            {/* Export */}
            <div className="relative group">
              <button className="text-gray-400 hover:text-gray-300 p-1 transition-colors" aria-label="Export conversation">
                <IconDownload className="size-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-32 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {(["markdown", "json", "text"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg capitalize"
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Token count */}
            <span className="text-[0.625rem] text-gray-500 tabular-nums">
              ~{totalTokens.toLocaleString()} tokens
            </span>

            <button
              onClick={() => createConversation()}
              className="sm:hidden text-primary-500 hover:text-primary-400 text-sm flex items-center gap-1"
            >
              <IconPlus className="size-4" />
            </button>
          </div>

          {/* System prompt panel */}
          {showSystemPrompt && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500">Preset:</span>
                {systemPromptPresets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSystemPrompt(p.prompt)}
                    className={`text-[0.625rem] px-2 py-0.5 rounded-md transition-colors ${
                      systemPrompt === p.prompt
                        ? "bg-primary-500/10 text-primary-500"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500/40 resize-none"
                placeholder="System prompt..."
              />
            </div>
          )}

          {/* Messages area */}
          {messages.length === 0 && !isGenerating ? (
            <EmptyState />
          ) : (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onEdit={msg.role === "user" ? handleEditMessage : undefined}
                  onRegenerate={msg.role === "assistant" && idx === messages.length - 1 ? handleRegenerate : undefined}
                />
              ))}

              {/* Typing indicator */}
              {isGenerating &&
                messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-3">
                    <div className="size-8 rounded-full bg-secondary-500/15 text-secondary-500 flex items-center justify-center">
                      <IconSparkles className="size-4" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                        <div className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                        <div className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* ── Input Area ──────────────────────────────── */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            {/* Model selector */}
            <div className="flex items-center gap-1.5 mb-2.5">
              {modelOptions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedModel === m.id
                      ? "bg-primary-500/10 text-primary-500 ring-1 ring-primary-500/30"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-sm">{m.icon}</span>
                  {m.label}
                </button>
              ))}
              <span className="text-[0.625rem] text-gray-500 ml-auto">
                ~{estimateTokens(inputDraft)} tokens
              </span>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputDraft}
                  onChange={(e) => setInputDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  rows={1}
                  className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors max-h-32"
                  style={{ height: "auto", minHeight: "44px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                  }}
                  disabled={isGenerating}
                />
              </div>

              {isGenerating ? (
                <button
                  onClick={handleStop}
                  className="size-11 rounded-xl bg-error text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shrink-0"
                  aria-label="Stop generation"
                >
                  <IconX className="size-5" />
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!inputDraft.trim()}
                  className="size-11 rounded-xl bg-primary-500 text-gray-950 flex items-center justify-center hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/20 shrink-0"
                  aria-label="Send message"
                >
                  <IconSend className="size-5" />
                </button>
              )}
            </div>

            <p className="text-[0.625rem] text-gray-400 mt-2 text-center">
              Powered by {activeModel.label} &middot; Shift+Enter for new line &middot; Ctrl+N new chat
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
