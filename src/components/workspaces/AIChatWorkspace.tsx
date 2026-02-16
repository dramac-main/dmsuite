"use client";

import { useRef, useEffect, useState } from "react";
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
} from "@/components/icons";

/* ── Markdown-lite renderer ──────────────────────────────────
   Handles **bold**, *italic*, `code`, ```code blocks```, and newlines.
   For a production app, swap with react-markdown. */
function renderMarkdown(text: string) {
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const code = part.slice(3, -3).replace(/^\w+\n/, ""); // strip language tag
      return (
        <pre
          key={i}
          className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-gray-800 dark:text-gray-200"
        >
          <code>{code}</code>
        </pre>
      );
    }
    // Inline formatting
    const formatted = part
      .split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
      .map((seg, j) => {
        if (seg.startsWith("**") && seg.endsWith("**"))
          return <strong key={j}>{seg.slice(2, -2)}</strong>;
        if (seg.startsWith("*") && seg.endsWith("*"))
          return <em key={j}>{seg.slice(1, -1)}</em>;
        if (seg.startsWith("`") && seg.endsWith("`"))
          return (
            <code
              key={j}
              className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono"
            >
              {seg.slice(1, -1)}
            </code>
          );
        return seg;
      });
    return <span key={i}>{formatted}</span>;
  });
}

/* ── Message Bubble ──────────────────────────────────────── */
function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-primary-500 text-gray-950 rounded-tr-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-md"
          }`}
        >
          {isUser ? message.content : renderMarkdown(message.content)}
        </div>

        {/* Actions */}
        {!isUser && message.content && (
          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
              title="Copy message"
            >
              {copied ? (
                <IconCheck className="size-3.5 text-success" />
              ) : (
                <IconCopy className="size-3.5" />
              )}
            </button>
            <span className="text-[0.625rem] text-gray-400">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
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
  const [showHistory, setShowHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>("claude");

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages ?? [];
  const activeModel = modelOptions.find((m) => m.id === selectedModel)!;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length - 1]?.content]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConversationId]);

  /** Send a message */
  const handleSend = async () => {
    const content = inputDraft.trim();
    if (!content || isGenerating) return;

    // Create conversation if none active
    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    // Add user message
    addMessage({ role: "user", content });
    setInputDraft("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content },
          ],
          provider: activeModel.provider,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      // Add empty assistant message
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
      console.error("Chat error:", error);
      addMessage({
        role: "assistant",
        content:
          "I encountered an error. Please check that your API key is configured in `.env.local` (`ANTHROPIC_API_KEY` for Claude or `OPENAI_API_KEY` for GPT) and restart the dev server.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /** Handle keyboard shortcuts */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
              onClick={() => {
                createConversation();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 transition-colors mb-3"
            >
              <IconPlus className="size-4" />
              New Chat
            </button>

            <div className="flex-1 overflow-y-auto space-y-1">
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  onClick={() => setActiveConversation(conv.id)}
                  onDelete={() => deleteConversation(conv.id)}
                />
              ))}

              {conversations.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">
                  No conversations yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Chat Area ─────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile history toggle */}
          <div className="sm:hidden flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm flex items-center gap-1.5"
            >
              <IconMessageCircle className="size-4" />
              {showHistory ? "Hide History" : "Chat History"}
            </button>
            <div className="flex-1" />
            <button
              onClick={() => createConversation()}
              className="text-primary-500 hover:text-primary-400 text-sm flex items-center gap-1"
            >
              <IconPlus className="size-4" />
              New
            </button>
          </div>

          {/* Messages area */}
          {messages.length === 0 && !isGenerating ? (
            <EmptyState />
          ) : (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
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
                <button key={m.id} onClick={() => setSelectedModel(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedModel === m.id ? "bg-primary-500/10 text-primary-500 ring-1 ring-primary-500/30" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                  <span className="text-sm">{m.icon}</span>{m.label}
                </button>
              ))}
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
                  className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700
                    bg-gray-50 dark:bg-gray-800 px-4 py-3 pr-12 text-sm
                    text-gray-900 dark:text-white placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                    transition-colors max-h-32"
                  style={{
                    height: "auto",
                    minHeight: "44px",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                  }}
                  disabled={isGenerating}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!inputDraft.trim() || isGenerating}
                className="size-11 rounded-xl bg-primary-500 text-gray-950 flex items-center justify-center
                  hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors shadow-lg shadow-primary-500/20 shrink-0"
                title="Send message"
              >
                {isGenerating ? (
                  <IconLoader className="size-5 animate-spin" />
                ) : (
                  <IconSend className="size-5" />
                )}
              </button>
            </div>

            <p className="text-[0.625rem] text-gray-400 mt-2 text-center">
              Powered by {activeModel.label} &middot; Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
