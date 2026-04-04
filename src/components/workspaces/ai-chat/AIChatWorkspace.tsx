"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import {
  useAIChatEditor,
  MODEL_OPTIONS,
  BUILTIN_AGENTS,
  type ChatMessage,
  type ChatModel,
  type Conversation,
  type AgentPersona,
} from "@/stores/ai-chat-editor";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createAIChatManifest } from "@/lib/chiko/manifests/ai-chat";
import {
  IconSend,
  IconPlus,
  IconTrash,
  IconCopy,
  IconCheck,
  IconSearch,
  IconX,
  IconStar,
  IconFolder,
  IconSettings,
  IconDownload,
  IconMenu,
  IconRefresh,
  IconChevronDown,
} from "@/components/icons";

// ---------------------------------------------------------------------------
// Markdown code block with copy button
// ---------------------------------------------------------------------------

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("hljs language-", "")?.replace("language-", "") || "";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-3 rounded-lg overflow-hidden border border-gray-700/50">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-1.5 text-xs text-gray-400">
        <span>{lang || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-gray-700 transition-colors"
        >
          {copied ? (
            <IconCheck className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <IconCopy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed bg-gray-900/60">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rendered markdown message
// ---------------------------------------------------------------------------

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeHighlight, rehypeKatex]}
      components={{
        code({ className, children, ...props }) {
          const isInline = !className;
          if (isInline) {
            return (
              <code
                className="rounded bg-gray-700/60 px-1.5 py-0.5 text-sm font-mono text-primary-300"
                {...props}
              >
                {children}
              </code>
            );
          }
          return <CodeBlock className={className}>{children}</CodeBlock>;
        },
        table({ children }) {
          return (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th className="border border-gray-600 bg-gray-800 px-3 py-2 text-left text-xs font-semibold text-gray-300">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="border border-gray-700 px-3 py-2 text-gray-300">
              {children}
            </td>
          );
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 underline underline-offset-2"
            >
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote className="my-3 border-l-3 border-primary-500 pl-4 text-gray-400 italic">
              {children}
            </blockquote>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  message,
  agent,
  onCopy,
  onEdit,
  onDelete,
  onBookmark,
  onFork,
  onRegenerate,
}: {
  message: ChatMessage;
  agent: AgentPersona;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBookmark: () => void;
  onFork: () => void;
  onRegenerate: () => void;
}) {
  const isUser = message.role === "user";
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="group relative px-4 py-4 md:px-8"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`mx-auto max-w-3xl flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
            isUser
              ? "bg-primary-500/20 text-primary-400"
              : "bg-secondary-500/20 text-secondary-400"
          }`}
        >
          {isUser ? "You" : agent.avatar}
        </div>

        {/* Content */}
        <div className={`min-w-0 flex-1 ${isUser ? "text-right" : ""}`}>
          <div
            className={`inline-block max-w-full text-left ${
              isUser
                ? "rounded-2xl rounded-tr-sm bg-primary-500/10 px-4 py-3 text-gray-200"
                : "text-gray-200"
            }`}
          >
            {message.isError ? (
              <p className="text-error text-sm">{message.content}</p>
            ) : isUser ? (
              <>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                {message.attachments?.map((a) => (
                  <div key={a.id} className="mt-2">
                    {a.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.dataUrl} alt={a.name} className="max-h-48 rounded-lg" />
                    ) : (
                      <span className="text-xs text-gray-400">📎 {a.name}</span>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="prose-sm prose-invert max-w-none leading-relaxed">
                <MarkdownContent content={message.content} />
              </div>
            )}
          </div>

          {/* Token count */}
          {message.tokenEstimate && (
            <p className={`mt-1 text-xs text-gray-500 ${isUser ? "text-right" : ""}`}>
              ~{message.tokenEstimate} tokens
              {message.model && ` · ${MODEL_OPTIONS.find((m) => m.id === message.model)?.label || message.model}`}
            </p>
          )}
        </div>
      </div>

      {/* Message actions bar */}
      {showActions && (
        <div className={`absolute top-2 ${isUser ? "left-4" : "right-4"} flex items-center gap-1 rounded-lg bg-gray-800 border border-gray-700 px-1 py-0.5 shadow-lg`}>
          <ActionBtn icon={<IconCopy className="h-3.5 w-3.5" />} label="Copy" onClick={onCopy} />
          {isUser && <ActionBtn icon={<EditIcon />} label="Edit" onClick={onEdit} />}
          <ActionBtn
            icon={<IconStar className={`h-3.5 w-3.5 ${message.bookmarked ? "text-yellow-400 fill-yellow-400" : ""}`} />}
            label="Bookmark"
            onClick={onBookmark}
          />
          <ActionBtn icon={<ForkIcon />} label="Fork" onClick={onFork} />
          {!isUser && <ActionBtn icon={<IconRefresh className="h-3.5 w-3.5" />} label="Regenerate" onClick={onRegenerate} />}
          <ActionBtn icon={<IconTrash className="h-3.5 w-3.5 text-red-400" />} label="Delete" onClick={onDelete} />
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="rounded p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
    >
      {icon}
    </button>
  );
}

function EditIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" />
      <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" /><path d="M12 12v3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  { emoji: "✍️", text: "Help me write a professional email" },
  { emoji: "💻", text: "Explain async/await in JavaScript" },
  { emoji: "📊", text: "Create a marketing strategy" },
  { emoji: "🎨", text: "Suggest a color palette for a tech brand" },
  { emoji: "📝", text: "Summarise this article for me" },
  { emoji: "🧮", text: "Help me with a budget spreadsheet" },
];

function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10 text-3xl">
        🤖
      </div>
      <h2 className="mb-2 text-xl font-semibold text-gray-100">How can I help you today?</h2>
      <p className="mb-8 text-sm text-gray-400">Start a conversation or pick a suggestion below</p>
      <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => onSuggestion(s.text)}
            className="flex items-center gap-3 rounded-xl border border-gray-700/50 bg-gray-800/40 px-4 py-3 text-left text-sm text-gray-300 transition-all hover:border-primary-500/30 hover:bg-gray-800/80 hover:text-gray-100"
          >
            <span className="text-lg">{s.emoji}</span>
            <span>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conversation sidebar
// ---------------------------------------------------------------------------

function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onPin,
  searchQuery,
  onSearchChange,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const list = conversations.filter(
      (c) => !c.archived && (c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q)))
    );
    const pinned = list.filter((c) => c.pinned);
    const rest = list.filter((c) => !c.pinned);
    return { pinned, rest };
  }, [conversations, searchQuery]);

  const startEdit = (id: string, title: string) => {
    setEditId(id);
    setEditValue(title);
  };

  const commitEdit = () => {
    if (editId && editValue.trim()) {
      onRename(editId, editValue.trim());
    }
    setEditId(null);
  };

  const renderItem = (conv: Conversation) => (
    <div
      key={conv.id}
      onClick={() => onSelect(conv.id)}
      className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
        conv.id === activeId
          ? "bg-primary-500/15 text-primary-300"
          : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
      }`}
    >
      {conv.temporary && (
        <span className="shrink-0 rounded bg-purple-500/20 px-1 py-0.5 text-[10px] text-purple-400">TMP</span>
      )}
      {editId === conv.id ? (
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditId(null); }}
          autoFocus
          className="flex-1 bg-transparent border-b border-primary-500 text-sm text-gray-200 outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate">{conv.title}</span>
      )}
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); startEdit(conv.id, conv.title); }}
          className="rounded p-1 hover:bg-gray-700"
          title="Rename"
        >
          <EditIcon />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onPin(conv.id); }}
          className={`rounded p-1 hover:bg-gray-700 ${conv.pinned ? "text-yellow-400" : ""}`}
          title="Pin"
        >
          <IconStar className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
          className="rounded p-1 hover:bg-gray-700 text-red-400"
          title="Delete"
        >
          <IconTrash className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {/* New chat button */}
      <div className="p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700/50 bg-gray-800/40 px-3 py-2.5 text-sm text-gray-300 transition-all hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300"
        >
          <IconPlus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg bg-gray-800/60 py-2 pl-9 pr-3 text-xs text-gray-300 placeholder-gray-500 outline-none border border-transparent focus:border-primary-500/40"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {filtered.pinned.length > 0 && (
          <>
            <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Pinned</p>
            {filtered.pinned.map(renderItem)}
          </>
        )}
        {filtered.rest.length > 0 && (
          <>
            {filtered.pinned.length > 0 && (
              <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Recent</p>
            )}
            {filtered.rest.map(renderItem)}
          </>
        )}
        {filtered.pinned.length === 0 && filtered.rest.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-gray-500">
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent selector panel
// ---------------------------------------------------------------------------

function AgentSelector({
  agents,
  activeId,
  onSelect,
  onClose,
}: {
  agents: AgentPersona[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">Switch Agent</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-80 overflow-y-auto">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => { onSelect(a.id); onClose(); }}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                a.id === activeId
                  ? "border-primary-500/50 bg-primary-500/10"
                  : "border-gray-700/50 bg-gray-800/40 hover:border-gray-600"
              }`}
            >
              <span className="text-2xl">{a.avatar}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{a.name}</p>
                <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{a.description}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {a.tags.slice(0, 3).map((t) => (
                    <span key={t} className="rounded bg-gray-700/60 px-1.5 py-0.5 text-[10px] text-gray-400">{t}</span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Model selector dropdown
// ---------------------------------------------------------------------------

function ModelSelector({
  model,
  onChange,
}: {
  model: ChatModel;
  onChange: (m: ChatModel) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = MODEL_OPTIONS.find((m) => m.id === model) || MODEL_OPTIONS[0];

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
        className="flex items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-800/60 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800"
      >
        <span className="font-medium">{selected.label}</span>
        <IconChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-xl border border-gray-700 bg-gray-900 py-1 shadow-xl">
          {MODEL_OPTIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false); }}
              className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-800 ${
                m.id === model ? "bg-primary-500/10" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${m.id === model ? "text-primary-300" : "text-gray-200"}`}>
                  {m.label}
                </p>
                <p className="text-xs text-gray-500">{m.description}</p>
              </div>
              <span className="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">{m.provider}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Input area with file upload
// ---------------------------------------------------------------------------

function ChatInput({
  onSend,
  isStreaming,
  onStop,
}: {
  onSend: (text: string, files: { id: string; name: string; type: string; size: number; dataUrl: string }[]) => void;
  isStreaming: boolean;
  onStop: () => void;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<{ id: string; name: string; type: string; size: number; dataUrl: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  };

  const handleSend = () => {
    if ((!text.trim() && files.length === 0) || isStreaming) return;
    onSend(text.trim(), files);
    setText("");
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    Array.from(list).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        setFiles((prev) => [
          ...prev,
          { id: crypto.randomUUID(), name: f.name, type: f.type, size: f.size, dataUrl: reader.result as string },
        ]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
      {/* File chips */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-2.5 py-1 text-xs text-gray-300">
              {f.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.dataUrl} alt="" className="h-5 w-5 rounded object-cover" />
              ) : (
                <span>📎</span>
              )}
              <span className="max-w-32 truncate">{f.name}</span>
              <button onClick={() => removeFile(f.id)} className="text-gray-500 hover:text-gray-300">
                <IconX className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 rounded-2xl border border-gray-700/50 bg-gray-800/60 px-4 py-2 focus-within:border-primary-500/40 transition-colors">
        {/* Paperclip */}
        <button
          onClick={() => fileRef.current?.click()}
          className="mb-1 rounded-lg p-1.5 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors"
          title="Attach file"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.txt,.csv,.json,.md" onChange={handleFile} className="hidden" />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); adjustHeight(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none leading-relaxed py-1"
        />

        {/* Send / Stop */}
        {isStreaming ? (
          <button
            onClick={onStop}
            className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            title="Stop"
          >
            <div className="h-3 w-3 rounded-sm bg-red-400" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim() && files.length === 0}
            className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white transition-all hover:bg-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Send"
          >
            <IconSend className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mt-2 text-center text-[11px] text-gray-500">
        DMSuite AI can make mistakes. Verify important information.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main workspace
// ---------------------------------------------------------------------------

export default function AIChatWorkspace() {
  const store = useAIChatEditor;
  const {
    form,
    createConversation,
    deleteConversation,
    renameConversation,
    setActiveConversation,
    pinConversation,
    addMessage,
    editMessage,
    deleteMessage,
    bookmarkMessage,
    forkFromMessage,
    regenerateMessage,
    setActiveAgent,
    setSelectedModel,
    exportConversation,
    importConversations,
    getActiveConversation,
    getActiveAgent,
    getAllAgents,
  } = useAIChatEditor();

  // Chiko AI integration
  useChikoActions(useCallback(() => createAIChatManifest(store), [store]));

  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [agentPanel, setAgentPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showExport, setShowExport] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasDispatchedRef = useRef(false);

  const activeConv = getActiveConversation();
  const activeAgent = getActiveAgent();
  const allAgents = getAllAgents();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length]);

  // Dispatch workspace events on mount
  useEffect(() => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;
    if (form.conversations.length > 0) {
      window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "content" } }));
    }
  }, [form.conversations.length]);

  // ── Send message ──
  const handleSend = useCallback(
    async (text: string, files: { id: string; name: string; type: string; size: number; dataUrl: string }[]) => {
      let convId = form.activeConversationId;
      if (!convId || !form.conversations.find((c) => c.id === convId)) {
        convId = createConversation(form.activeAgentId);
      }

      // Add user message
      addMessage(convId, {
        role: "user",
        content: text,
        attachments: files.length > 0 ? files : undefined,
      });

      window.dispatchEvent(new CustomEvent("workspace:dirty"));
      window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "input" } }));

      // Build messages for API
      const conv = useAIChatEditor.getState().form.conversations.find((c) => c.id === convId);
      if (!conv) return;

      const agent = [...BUILTIN_AGENTS, ...useAIChatEditor.getState().form.agents].find(
        (a) => a.id === conv.agentId
      ) || BUILTIN_AGENTS[0];

      const apiMessages = conv.messages.map((m) => {
        if (m.attachments?.some((a) => a.type.startsWith("image/"))) {
          const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
          if (m.content) parts.push({ type: "text", text: m.content });
          for (const att of m.attachments) {
            if (att.type.startsWith("image/")) {
              parts.push({ type: "image_url", image_url: { url: att.dataUrl } });
            }
          }
          return { role: m.role, content: parts };
        }
        return { role: m.role, content: m.content };
      });

      const selectedModel = useAIChatEditor.getState().form.selectedModel;
      const modelOption = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0];

      // Start streaming
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      // Add empty assistant message
      const assistantMsgId = addMessage(convId, {
        role: "assistant",
        content: "",
        model: selectedModel,
        provider: modelOption.provider,
      });

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            model: selectedModel,
            provider: modelOption.provider,
            systemPrompt: agent.systemPrompt,
            temperature: agent.temperature,
            maxTokens: agent.maxTokens,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Unknown error" }));
          editMessage(convId, assistantMsgId, err.error || `Error ${response.status}`);
          // Mark as error
          useAIChatEditor.setState((s) => {
            const c = s.form.conversations.find((c) => c.id === convId);
            if (c) {
              const m = c.messages.find((m) => m.id === assistantMsgId);
              if (m) m.isError = true;
            }
          });
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          editMessage(convId, assistantMsgId, fullText);
        }

        window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "content" } }));
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User stopped — keep partial content
        } else {
          editMessage(convId, assistantMsgId, `Error: ${(err as Error).message}`);
          useAIChatEditor.setState((s) => {
            const c = s.form.conversations.find((c) => c.id === convId);
            if (c) {
              const m = c.messages.find((m) => m.id === assistantMsgId);
              if (m) m.isError = true;
            }
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [form.activeConversationId, form.conversations, form.activeAgentId, form.agents, form.selectedModel, createConversation, addMessage, editMessage]
  );

  const handleStop = () => abortRef.current?.abort();

  const handleNewChat = () => {
    createConversation(form.activeAgentId);
    setMobileSidebar(false);
  };

  // Export
  const handleExport = (format: "json" | "markdown" | "text") => {
    if (!activeConv) return;
    const data = exportConversation(activeConv.id, format);
    const ext = format === "json" ? "json" : format === "markdown" ? "md" : "txt";
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeConv.title.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
    window.dispatchEvent(new CustomEvent("workspace:save"));
    window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "exported" } }));
  };

  // Import
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const count = importConversations(text);
      if (count > 0) {
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
      }
    };
    input.click();
  };

  // Regenerate last assistant message
  const handleRegenerate = (msgId: string) => {
    if (!activeConv || isStreaming) return;
    regenerateMessage(activeConv.id, msgId);
    // Re-send the last user message
    const lastUserMsg = [...activeConv.messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      handleSend(lastUserMsg.content, lastUserMsg.attachments || []);
    }
  };

  return (
    <div className="flex h-full bg-gray-950">
      {/* ── Left sidebar (desktop) ── */}
      {sidebarOpen && (
        <div className="hidden lg:flex w-72 shrink-0 flex-col border-r border-gray-800/60 bg-gray-900/80">
          <ConversationSidebar
            conversations={form.conversations}
            activeId={form.activeConversationId}
            onSelect={setActiveConversation}
            onNew={handleNewChat}
            onDelete={deleteConversation}
            onRename={renameConversation}
            onPin={pinConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      )}

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileSidebar(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 bottom-0 w-80 border-r border-gray-800 bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <ConversationSidebar
              conversations={form.conversations}
              activeId={form.activeConversationId}
              onSelect={(id) => { setActiveConversation(id); setMobileSidebar(false); }}
              onNew={handleNewChat}
              onDelete={deleteConversation}
              onRename={renameConversation}
              onPin={pinConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>
      )}

      {/* ── Main chat area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-gray-800/60 px-4 py-2.5">
          {/* Sidebar toggle (desktop) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
            title="Toggle sidebar"
          >
            <IconMenu className="h-5 w-5" />
          </button>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileSidebar(!mobileSidebar)}
            className="lg:hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-800"
          >
            <IconMenu className="h-5 w-5" />
          </button>

          {/* Model selector */}
          <ModelSelector model={form.selectedModel} onChange={setSelectedModel} />

          {/* Agent selector button */}
          <button
            onClick={() => setAgentPanel(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-800/40 px-3 py-1.5 text-sm text-gray-300 hover:border-gray-600 hover:bg-gray-800 transition-colors"
          >
            <span>{activeAgent.avatar}</span>
            <span className="hidden sm:inline font-medium">{activeAgent.name}</span>
          </button>

          <div className="flex-1" />

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              disabled={!activeConv}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30 transition-colors"
              title="Export"
            >
              <IconDownload className="h-5 w-5" />
            </button>
            {showExport && activeConv && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-700 bg-gray-900 py-1 shadow-xl">
                <button onClick={() => handleExport("markdown")} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800">
                  Export as Markdown
                </button>
                <button onClick={() => handleExport("json")} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800">
                  Export as JSON
                </button>
                <button onClick={() => handleExport("text")} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800">
                  Export as Text
                </button>
                <hr className="my-1 border-gray-700" />
                <button onClick={handleImport} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800">
                  Import JSON
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {!activeConv || activeConv.messages.length === 0 ? (
            <EmptyState onSuggestion={(text) => handleSend(text, [])} />
          ) : (
            <div className="py-4">
              {activeConv.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  agent={activeAgent}
                  onCopy={() => navigator.clipboard.writeText(msg.content)}
                  onEdit={() => {
                    if (editingMsgId === msg.id) {
                      editMessage(activeConv.id, msg.id, editingContent);
                      setEditingMsgId(null);
                    } else {
                      setEditingMsgId(msg.id);
                      setEditingContent(msg.content);
                    }
                  }}
                  onDelete={() => deleteMessage(activeConv.id, msg.id)}
                  onBookmark={() => bookmarkMessage(activeConv.id, msg.id)}
                  onFork={() => forkFromMessage(activeConv.id, msg.id)}
                  onRegenerate={() => handleRegenerate(msg.id)}
                />
              ))}
              {isStreaming && (
                <div className="flex items-center gap-2 px-8 py-3">
                  <div className="mx-auto max-w-3xl flex items-center gap-3 text-sm text-gray-400">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span>Generating…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <ChatInput onSend={handleSend} isStreaming={isStreaming} onStop={handleStop} />
      </div>

      {/* Agent selector overlay */}
      {agentPanel && (
        <AgentSelector
          agents={allAgents}
          activeId={form.activeAgentId}
          onSelect={setActiveAgent}
          onClose={() => setAgentPanel(false)}
        />
      )}
    </div>
  );
}
