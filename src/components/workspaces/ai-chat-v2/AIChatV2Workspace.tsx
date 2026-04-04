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
  useAIChatV2Editor,
  MODEL_OPTIONS,
  BUILTIN_AGENTS,
  PROVIDER_META,
  type ChatMessage,
  type ChatModel,
  type ChatProvider,
  type Session,
  type AgentPersona,
  type Topic,
  type SessionGroup,
  type ModelOption,
  type FileAttachment,
} from "@/stores/ai-chat-v2-editor";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createAIChatV2Manifest } from "@/lib/chiko/manifests/ai-chat-v2";
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
  IconChevronRight,
} from "@/components/icons";

// ═══════════════════════════════════════════════════════════════════════════
// SHARED INLINE ICONS (small SVGs not in global iconMap)
// ═══════════════════════════════════════════════════════════════════════════

function EditIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ForkIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" />
      <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" /><path d="M12 12v3" />
    </svg>
  );
}

function HashIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function PanelRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function UserIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BrainIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0-.5 2A4 4 0 0 0 4 12a4 4 0 0 0 3 3.87V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4.13A4 4 0 0 0 20 12a4 4 0 0 0-3.5-3.97A4 4 0 0 0 16 6a4 4 0 0 0-4-4z" />
    </svg>
  );
}

function TranslateIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" />
    </svg>
  );
}

function SpeakerIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function ClearIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKDOWN CODE BLOCK
// ═══════════════════════════════════════════════════════════════════════════

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("hljs language-", "")?.replace("language-", "") || "";
  const code = String(children).replace(/\n$/, "");
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="group relative my-3 rounded-lg overflow-hidden border border-gray-700/50">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-1.5 text-xs text-gray-400">
        <span>{lang || "code"}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-gray-700 transition-colors">
          {copied ? <IconCheck className="h-3.5 w-3.5 text-green-400" /> : <IconCopy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed bg-gray-900/60">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDERED MARKDOWN
// ═══════════════════════════════════════════════════════════════════════════

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeHighlight, rehypeKatex]}
      components={{
        code({ className, children, ...props }) {
          const isInline = !className;
          if (isInline) {
            return <code className="rounded bg-gray-700/60 px-1.5 py-0.5 text-sm font-mono text-primary-300" {...props}>{children}</code>;
          }
          return <CodeBlock className={className}>{children}</CodeBlock>;
        },
        table({ children }) { return <div className="my-3 overflow-x-auto"><table className="min-w-full border-collapse text-sm">{children}</table></div>; },
        th({ children }) { return <th className="border border-gray-600 bg-gray-800 px-3 py-2 text-left text-xs font-semibold text-gray-300">{children}</th>; },
        td({ children }) { return <td className="border border-gray-700 px-3 py-2 text-gray-300">{children}</td>; },
        a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">{children}</a>; },
        blockquote({ children }) { return <blockquote className="my-3 border-l-3 border-primary-500 pl-4 text-gray-400 italic">{children}</blockquote>; },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════

function ActionBtn({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`rounded p-1.5 transition-colors ${active ? "text-primary-400 bg-primary-500/10" : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"}`}
    >
      {icon}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE (Lobe Chat style — full-width, avatar left aligned)
// ═══════════════════════════════════════════════════════════════════════════

function MessageBubble({
  message,
  agent,
  onCopy,
  onEdit,
  onDelete,
  onBookmark,
  onFork,
  onRegenerate,
  onTranslate,
  onTTS,
}: {
  message: ChatMessage;
  agent: AgentPersona;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBookmark: () => void;
  onFork: () => void;
  onRegenerate: () => void;
  onTranslate: () => void;
  onTTS: () => void;
}) {
  const isUser = message.role === "user";
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`group relative px-4 py-3 transition-colors hover:bg-gray-800/20 ${isUser ? "bg-transparent" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="mx-auto max-w-3xl flex gap-3">
        {/* Avatar — Lobe Chat style: always on left */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
          isUser ? "bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30" : "bg-secondary-500/20 text-secondary-400 ring-1 ring-secondary-500/30"
        }`}>
          {isUser ? <UserIcon className="h-4 w-4" /> : <span className="text-base">{agent.avatar}</span>}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Role label + model tag */}
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`text-xs font-semibold ${isUser ? "text-primary-400" : "text-secondary-400"}`}>
              {isUser ? "You" : agent.name}
            </span>
            {message.model && (
              <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">
                {MODEL_OPTIONS.find((m) => m.id === message.model)?.label || message.model}
              </span>
            )}
            <span className="text-[10px] text-gray-600">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {message.bookmarked && <IconStar className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
          </div>

          {/* Message body */}
          <div className="text-gray-200">
            {message.isError ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
                <p className="text-sm text-red-400">{message.content}</p>
              </div>
            ) : isUser ? (
              <>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                {message.attachments?.map((a) => (
                  <div key={a.id} className="mt-2">
                    {a.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.dataUrl} alt={a.name} className="max-h-48 rounded-lg border border-gray-700" />
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400">📎 {a.name}</span>
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

          {/* Translation */}
          {message.translated && (
            <div className="mt-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
              <p className="mb-1 text-[10px] font-medium text-blue-400 uppercase tracking-wider">Translation</p>
              <p className="text-sm text-gray-300">{message.translated}</p>
            </div>
          )}

          {/* Token count */}
          {message.tokenEstimate && (
            <p className="mt-1 text-[10px] text-gray-600">~{message.tokenEstimate} tokens</p>
          )}
        </div>
      </div>

      {/* Floating actions bar (Lobe Chat style) */}
      {showActions && (
        <div className="absolute right-4 top-2 flex items-center gap-0.5 rounded-lg bg-gray-800/95 border border-gray-700/80 px-1 py-0.5 shadow-lg backdrop-blur-sm">
          <ActionBtn icon={<IconCopy className="h-3.5 w-3.5" />} label="Copy" onClick={onCopy} />
          {isUser && <ActionBtn icon={<EditIcon />} label="Edit" onClick={onEdit} />}
          <ActionBtn icon={<IconStar className={`h-3.5 w-3.5 ${message.bookmarked ? "text-yellow-400 fill-yellow-400" : ""}`} />} label="Bookmark" onClick={onBookmark} active={message.bookmarked} />
          <ActionBtn icon={<ForkIcon />} label="Fork" onClick={onFork} />
          {!isUser && (
            <>
              <ActionBtn icon={<IconRefresh className="h-3.5 w-3.5" />} label="Regenerate" onClick={onRegenerate} />
              <ActionBtn icon={<TranslateIcon />} label="Translate" onClick={onTranslate} />
              <ActionBtn icon={<SpeakerIcon />} label="Read aloud" onClick={onTTS} />
            </>
          )}
          <ActionBtn icon={<IconTrash className="h-3.5 w-3.5 text-red-400" />} label="Delete" onClick={onDelete} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATE (Lobe Chat style — agent greeting + featured agents)
// ═══════════════════════════════════════════════════════════════════════════

const QUICK_AGENTS = BUILTIN_AGENTS.slice(0, 6);

function EmptyState({ onSuggestion, onPickAgent }: { onSuggestion: (text: string) => void; onPickAgent: (agentId: string) => void }) {
  const suggestions = [
    { emoji: "💡", text: "Explain quantum computing in simple terms" },
    { emoji: "✍️", text: "Write a professional email to a client" },
    { emoji: "💻", text: "Create a React hook for dark mode" },
    { emoji: "📊", text: "Analyze pros and cons of remote work" },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      {/* Logo / greeting */}
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 ring-1 ring-primary-500/20">
        <BrainIcon className="h-10 w-10 text-primary-400" />
      </div>
      <h2 className="mb-1 text-2xl font-bold text-gray-100">Welcome to LobeChat</h2>
      <p className="mb-2 text-sm text-gray-400">Your AI-powered creative assistant at DMSuite</p>
      <p className="mb-8 max-w-md text-center text-xs text-gray-500">
        Start a conversation below or pick an agent to get specialized help
      </p>

      {/* Agent grid (Lobe Chat: featured assistants) */}
      <div className="mb-8 w-full max-w-2xl">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Featured Agents</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {QUICK_AGENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => onPickAgent(a.id)}
              className="flex items-center gap-2.5 rounded-xl border border-gray-700/40 bg-gray-800/30 px-3 py-2.5 text-left transition-all hover:border-primary-500/30 hover:bg-gray-800/60"
            >
              <span className="text-xl">{a.avatar}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-200 truncate">{a.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{a.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s.text}
            onClick={() => onSuggestion(s.text)}
            className="flex items-center gap-3 rounded-xl border border-gray-700/40 bg-gray-800/30 px-4 py-3 text-left text-sm text-gray-300 transition-all hover:border-primary-500/30 hover:bg-gray-800/60 hover:text-gray-100"
          >
            <span className="text-lg">{s.emoji}</span>
            <span>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION SIDEBAR (Lobe Chat: left panel — sessions, groups, search)
// ═══════════════════════════════════════════════════════════════════════════

function SessionSidebar({
  sessions,
  sessionGroups,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onPin,
  searchQuery,
  onSearchChange,
  onCreateGroup,
  onMoveToGroup,
}: {
  sessions: Session[];
  sessionGroups: SessionGroup[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCreateGroup: () => void;
  onMoveToGroup: (sessionId: string, groupId: string | undefined) => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (gid: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid); else next.add(gid);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) => !s.archived && (s.title.toLowerCase().includes(q) || s.messages.some((m) => m.content.toLowerCase().includes(q)))
    );
  }, [sessions, searchQuery]);

  const pinned = filtered.filter((s) => s.pinned);
  const ungrouped = filtered.filter((s) => !s.pinned && !s.groupId);
  const groupedMap = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const g of sessionGroups) map[g.id] = [];
    for (const s of filtered) {
      if (!s.pinned && s.groupId && map[s.groupId]) map[s.groupId].push(s);
    }
    return map;
  }, [filtered, sessionGroups]);

  const startEdit = (id: string, title: string) => { setEditId(id); setEditValue(title); };
  const commitEdit = () => { if (editId && editValue.trim()) onRename(editId, editValue.trim()); setEditId(null); };

  const getAgent = (agentId: string) => [...BUILTIN_AGENTS].find((a) => a.id === agentId);

  const renderItem = (s: Session) => (
    <div
      key={s.id}
      onClick={() => onSelect(s.id)}
      className={`group/item flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all ${
        s.id === activeId
          ? "bg-primary-500/15 text-primary-300 shadow-sm shadow-primary-500/5"
          : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
      }`}
    >
      {/* Agent avatar */}
      <span className="shrink-0 text-base">{getAgent(s.agentId)?.avatar || "🤖"}</span>

      {editId === s.id ? (
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
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm">{s.title}</p>
          <p className="truncate text-[10px] text-gray-600">
            {s.messages.length} msg{s.messages.length !== 1 && "s"} · {new Date(s.updatedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Hover actions */}
      <div className="hidden group-hover/item:flex items-center gap-0.5 shrink-0">
        <button onClick={(e) => { e.stopPropagation(); startEdit(s.id, s.title); }} className="rounded p-1 hover:bg-gray-700" title="Rename">
          <EditIcon className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onPin(s.id); }} className={`rounded p-1 hover:bg-gray-700 ${s.pinned ? "text-yellow-400" : ""}`} title="Pin">
          <IconStar className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} className="rounded p-1 hover:bg-gray-700 text-red-400" title="Delete">
          <IconTrash className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  const renderSection = (title: string, items: Session[], collapsible?: string) => {
    if (items.length === 0) return null;
    const isCollapsed = collapsible ? collapsedGroups.has(collapsible) : false;
    return (
      <div key={title}>
        <button
          onClick={() => collapsible && toggleGroup(collapsible)}
          className="flex w-full items-center gap-1 px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-400"
        >
          {collapsible && (
            <IconChevronRight className={`h-3 w-3 transition-transform ${isCollapsed ? "" : "rotate-90"}`} />
          )}
          <span>{title}</span>
          <span className="ml-auto text-gray-600">{items.length}</span>
        </button>
        {!isCollapsed && <div className="space-y-0.5">{items.map(renderItem)}</div>}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-gray-900/50">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-800/60 px-3 py-3">
        <BrainIcon className="h-5 w-5 text-primary-400" />
        <span className="text-sm font-semibold text-gray-200">LobeChat</span>
        <span className="rounded bg-primary-500/10 px-1.5 py-0.5 text-[9px] font-bold text-primary-400">V2</span>
        <div className="flex-1" />
        <button onClick={onCreateGroup} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors" title="New group">
          <IconFolder className="h-4 w-4" />
        </button>
      </div>

      {/* New session + search */}
      <div className="px-3 pt-3 space-y-2">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700/60 bg-gray-800/30 px-3 py-2.5 text-sm text-gray-400 transition-all hover:border-primary-500/40 hover:bg-primary-500/5 hover:text-primary-300"
        >
          <IconPlus className="h-4 w-4" />
          New Session
        </button>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search sessions…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg bg-gray-800/40 py-2 pl-9 pr-3 text-xs text-gray-300 placeholder-gray-600 outline-none border border-transparent focus:border-primary-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 mt-1">
        {renderSection("📌 Pinned", pinned)}
        {sessionGroups.sort((a, b) => a.sort - b.sort).map((g) =>
          renderSection(g.name, groupedMap[g.id] || [], g.id)
        )}
        {renderSection("Recent", ungrouped)}
        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-gray-600">
            {searchQuery ? "No sessions found" : "No sessions yet. Create one to start."}
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOPIC PANEL (Lobe Chat: topics within a session)
// ═══════════════════════════════════════════════════════════════════════════

function TopicPanel({
  topics,
  activeTopicId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onToggleFav,
  onClose,
}: {
  topics: Topic[];
  activeTopicId: string | undefined;
  onSelect: (id: string | undefined) => void;
  onCreate: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onToggleFav: (id: string) => void;
  onClose: () => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const favTopics = topics.filter((t) => t.favorite);
  const regularTopics = topics.filter((t) => !t.favorite);

  return (
    <div className="flex h-full w-60 flex-col border-l border-gray-800/60 bg-gray-900/40">
      <div className="flex items-center justify-between border-b border-gray-800/60 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <HashIcon className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-300">Topics</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onCreate} className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300" title="New topic">
            <IconPlus className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300" title="Close">
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* All messages (no topic) */}
      <button
        onClick={() => onSelect(undefined)}
        className={`mx-2 mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
          !activeTopicId ? "bg-primary-500/10 text-primary-300" : "text-gray-400 hover:bg-gray-800/60"
        }`}
      >
        <span className="text-sm">💬</span>
        <span>All Messages</span>
      </button>

      <div className="flex-1 overflow-y-auto px-2 pb-4 mt-1 space-y-0.5">
        {favTopics.length > 0 && (
          <p className="px-2 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-wider text-gray-600">⭐ Favorites</p>
        )}
        {favTopics.map((t) => renderTopicItem(t))}
        {regularTopics.map((t) => renderTopicItem(t))}
      </div>
    </div>
  );

  function renderTopicItem(t: Topic) {
    return (
      <div
        key={t.id}
        onClick={() => onSelect(t.id)}
        className={`group/topic flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs cursor-pointer transition-colors ${
          t.id === activeTopicId
            ? "bg-primary-500/10 text-primary-300"
            : "text-gray-400 hover:bg-gray-800/60"
        }`}
      >
        <HashIcon className="h-3 w-3 shrink-0 text-gray-600" />
        {editId === t.id ? (
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => { if (editValue.trim()) onRename(t.id, editValue.trim()); setEditId(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { if (editValue.trim()) onRename(t.id, editValue.trim()); setEditId(null); } }}
            autoFocus
            className="flex-1 bg-transparent text-xs text-gray-200 outline-none border-b border-primary-500"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate">{t.title}</span>
        )}
        <div className="hidden group-hover/topic:flex items-center gap-0.5 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onToggleFav(t.id); }} className={`rounded p-0.5 ${t.favorite ? "text-yellow-400" : "hover:text-yellow-400"}`}>
            <IconStar className="h-2.5 w-2.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setEditId(t.id); setEditValue(t.title); }} className="rounded p-0.5 hover:text-gray-200">
            <EditIcon className="h-2.5 w-2.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} className="rounded p-0.5 text-red-400">
            <IconTrash className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS PANEL (Lobe Chat: right portal — agent info, model, temp)
// ═══════════════════════════════════════════════════════════════════════════

function SettingsPanel({
  session,
  agent,
  allAgents,
  globalModel,
  onUpdateSettings,
  onSwitchAgent,
  onClose,
}: {
  session: Session;
  agent: AgentPersona;
  allAgents: AgentPersona[];
  globalModel: ChatModel;
  onUpdateSettings: (patch: { model?: ChatModel; temperature?: number; maxTokens?: number; systemPromptOverride?: string }) => void;
  onSwitchAgent: (agentId: string) => void;
  onClose: () => void;
}) {
  const effectiveModel = session.model || globalModel;
  const effectiveTemp = session.temperature ?? agent.temperature;
  const effectiveMaxTokens = session.maxTokens ?? agent.maxTokens;
  const effectivePrompt = session.systemPromptOverride ?? agent.systemPrompt;
  const [tab, setTab] = useState<"settings" | "agents">("settings");

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-800/60 bg-gray-900/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("settings")}
            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${tab === "settings" ? "bg-primary-500/10 text-primary-300" : "text-gray-500 hover:text-gray-300"}`}
          >
            Settings
          </button>
          <button
            onClick={() => setTab("agents")}
            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${tab === "agents" ? "bg-primary-500/10 text-primary-300" : "text-gray-500 hover:text-gray-300"}`}
          >
            Agents
          </button>
        </div>
        <button onClick={onClose} className="rounded p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300">
          <IconX className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "settings" ? (
          <div className="space-y-5 px-4 py-4">
            {/* Agent info */}
            <div className="flex items-center gap-3 rounded-xl bg-gray-800/40 p-3">
              <span className="text-3xl">{agent.avatar}</span>
              <div>
                <p className="text-sm font-medium text-gray-200">{agent.name}</p>
                <p className="text-xs text-gray-500">{agent.description}</p>
              </div>
            </div>

            {/* Model selector */}
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Model</label>
              <select
                value={effectiveModel}
                onChange={(e) => onUpdateSettings({ model: e.target.value as ChatModel })}
                className="w-full rounded-lg bg-gray-800/60 border border-gray-700/50 px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary-500/40"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>{m.icon} {m.label} — {m.description}</option>
                ))}
              </select>
            </div>

            {/* Temperature */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Temperature</label>
                <span className="text-xs text-gray-400">{effectiveTemp.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={effectiveTemp}
                onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-[9px] text-gray-600">
                <span>Precise</span><span>Balanced</span><span>Creative</span>
              </div>
            </div>

            {/* Max tokens */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Max Tokens</label>
                <span className="text-xs text-gray-400">{effectiveMaxTokens}</span>
              </div>
              <input
                type="range"
                min={256}
                max={8192}
                step={256}
                value={effectiveMaxTokens}
                onChange={(e) => onUpdateSettings({ maxTokens: parseInt(e.target.value) })}
                className="w-full accent-primary-500"
              />
            </div>

            {/* System prompt */}
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">System Prompt</label>
              <textarea
                value={effectivePrompt}
                onChange={(e) => onUpdateSettings({ systemPromptOverride: e.target.value })}
                rows={6}
                className="w-full rounded-lg bg-gray-800/40 border border-gray-700/50 px-3 py-2 text-xs text-gray-300 outline-none resize-none focus:border-primary-500/40 leading-relaxed"
              />
            </div>
          </div>
        ) : (
          /* Agent market tab */
          <div className="px-3 py-3 space-y-2">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Select Agent</p>
            {allAgents.map((a) => (
              <button
                key={a.id}
                onClick={() => onSwitchAgent(a.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                  a.id === session.agentId
                    ? "border-primary-500/40 bg-primary-500/10"
                    : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600"
                }`}
              >
                <span className="text-2xl">{a.avatar}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-200 truncate">{a.name}</p>
                  <p className="mt-0.5 text-[10px] text-gray-500 line-clamp-2">{a.description}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {a.tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded bg-gray-700/50 px-1.5 py-0.5 text-[9px] text-gray-500">{t}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODEL SELECTOR (Lobe Chat: detailed model picker with provider groups)
// ═══════════════════════════════════════════════════════════════════════════

function ModelSelectorDropdown({ model, onChange }: { model: ChatModel; onChange: (m: ChatModel) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = MODEL_OPTIONS.find((m) => m.id === model) || MODEL_OPTIONS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Group by provider
  const providers = useMemo(() => {
    const map: Record<string, ModelOption[]> = {};
    for (const m of MODEL_OPTIONS) {
      if (!map[m.provider]) map[m.provider] = [];
      map[m.provider].push(m);
    }
    return Object.entries(map) as [ChatProvider, ModelOption[]][];
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 py-1.5 text-sm text-gray-300 transition-all hover:border-gray-600 hover:bg-gray-800"
      >
        <span>{selected.icon}</span>
        <span className="font-medium">{selected.label}</span>
        <IconChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-80 rounded-xl border border-gray-700 bg-gray-900 py-2 shadow-2xl">
          {providers.map(([provider, models]) => (
            <div key={provider}>
              <p className={`px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider ${PROVIDER_META[provider].color}`}>
                {PROVIDER_META[provider].label}
              </p>
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onChange(m.id); setOpen(false); }}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-800/80 ${
                    m.id === model ? "bg-primary-500/10" : ""
                  }`}
                >
                  <span className="text-sm">{m.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${m.id === model ? "text-primary-300" : "text-gray-200"}`}>{m.label}</p>
                    <p className="text-[10px] text-gray-500">{m.description}</p>
                  </div>
                  {m.id === model && <IconCheck className="h-4 w-4 text-primary-400 shrink-0" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAT INPUT (Lobe Chat: rich input bar with actions)
// ═══════════════════════════════════════════════════════════════════════════

function ChatInputBar({
  onSend,
  isStreaming,
  onStop,
  onClearMessages,
  hasMessages,
}: {
  onSend: (text: string, files: FileAttachment[]) => void;
  isStreaming: boolean;
  onStop: () => void;
  onClearMessages: () => void;
  hasMessages: boolean;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 200) + "px"; }
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
        setFiles((prev) => [...prev, { id: crypto.randomUUID(), name: f.name, type: f.type, size: f.size, dataUrl: reader.result as string }]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="border-t border-gray-800/60 bg-gray-900/30">
      <div className="mx-auto max-w-3xl px-4 py-3">
        {/* File chips */}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-2.5 py-1 text-xs text-gray-300 border border-gray-700/50">
                {f.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.dataUrl} alt="" className="h-5 w-5 rounded object-cover" />
                ) : <span>📎</span>}
                <span className="max-w-32 truncate">{f.name}</span>
                <button onClick={() => removeFile(f.id)} className="text-gray-500 hover:text-gray-300"><IconX className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Input container */}
        <div className="flex items-end gap-2 rounded-2xl border border-gray-700/40 bg-gray-800/40 px-3 py-2 focus-within:border-primary-500/30 transition-colors">
          {/* Left actions */}
          <div className="flex items-center gap-0.5 mb-1">
            <button onClick={() => fileRef.current?.click()} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-700/50 hover:text-gray-300 transition-colors" title="Attach file">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            {hasMessages && (
              <button onClick={onClearMessages} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-700/50 hover:text-gray-300 transition-colors" title="Clear messages">
                <ClearIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.txt,.csv,.json,.md" onChange={handleFile} className="hidden" />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); adjustHeight(); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message… (Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none leading-relaxed py-1"
          />

          {/* Send / Stop */}
          {isStreaming ? (
            <button onClick={onStop} className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Stop">
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

        <p className="mt-1.5 text-center text-[10px] text-gray-600">
          DMSuite AI Chat V2 · Powered by Lobe Chat patterns · AI can make mistakes
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN WORKSPACE — 3-PANEL LAYOUT (Lobe Chat faithful)
// ═══════════════════════════════════════════════════════════════════════════

export default function AIChatV2Workspace() {
  const store = useAIChatV2Editor;
  const {
    form,
    createSession,
    deleteSession,
    renameSession,
    setActiveSession,
    pinSession,
    moveSessionToGroup,
    updateSessionSettings,
    createSessionGroup,
    addMessage,
    editMessage,
    deleteMessage,
    bookmarkMessage,
    forkFromMessage,
    regenerateMessage,
    setMessageTranslation,
    clearMessages,
    createTopic,
    renameTopic,
    deleteTopic,
    toggleTopicFav,
    setActiveTopic,
    setGlobalModel,
    toggleTopicPanel,
    toggleSettingsPanel,
    exportSession,
    importSessions,
    getActiveSession,
    getSessionAgent,
    getSessionModel,
    getSessionTopics,
    getAllAgents,
  } = useAIChatV2Editor();

  // Chiko integration
  useChikoActions(useCallback(() => createAIChatV2Manifest(store), [store]));

  // Local state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasDispatchedRef = useRef(false);

  const activeSession = getActiveSession();
  const activeAgent = getSessionAgent(activeSession);
  const activeModel = getSessionModel(activeSession);
  const allAgents = getAllAgents();
  const topics = activeSession ? getSessionTopics(activeSession.id) : [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages.length]);

  // Workspace events
  useEffect(() => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;
    if (form.sessions.length > 0) {
      window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "content" } }));
    }
  }, [form.sessions.length]);

  // ── Send message ──
  const handleSend = useCallback(
    async (text: string, files: FileAttachment[]) => {
      let sessionId = form.activeSessionId;
      if (!sessionId || !form.sessions.find((s) => s.id === sessionId)) {
        sessionId = createSession();
      }

      addMessage(sessionId, {
        role: "user",
        content: text,
        attachments: files.length > 0 ? files : undefined,
      });

      window.dispatchEvent(new CustomEvent("workspace:dirty"));
      window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "input" } }));

      const session = useAIChatV2Editor.getState().form.sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const agent = [...BUILTIN_AGENTS, ...useAIChatV2Editor.getState().form.agents].find(
        (a) => a.id === session.agentId
      ) || BUILTIN_AGENTS[0];

      const apiMessages = session.messages.map((m) => {
        if (m.attachments?.some((a) => a.type.startsWith("image/"))) {
          const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
          if (m.content) parts.push({ type: "text", text: m.content });
          for (const att of m.attachments) {
            if (att.type.startsWith("image/")) parts.push({ type: "image_url", image_url: { url: att.dataUrl } });
          }
          return { role: m.role, content: parts };
        }
        return { role: m.role, content: m.content };
      });

      const selectedModel = session.model || useAIChatV2Editor.getState().form.globalModel;
      const modelOption = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0];
      const systemPrompt = session.systemPromptOverride || agent.systemPrompt;
      const temperature = session.temperature ?? agent.temperature;
      const maxTokens = session.maxTokens ?? agent.maxTokens;

      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const assistantMsgId = addMessage(sessionId, {
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
            systemPrompt,
            temperature,
            maxTokens,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Unknown error" }));
          editMessage(sessionId, assistantMsgId, err.error || `Error ${response.status}`);
          useAIChatV2Editor.setState((s) => {
            const ss = s.form.sessions.find((x) => x.id === sessionId);
            if (ss) { const m = ss.messages.find((m) => m.id === assistantMsgId); if (m) m.isError = true; }
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
          fullText += decoder.decode(value, { stream: true });
          editMessage(sessionId, assistantMsgId, fullText);
        }

        window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "content" } }));
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          editMessage(sessionId, assistantMsgId, `Error: ${(err as Error).message}`);
          useAIChatV2Editor.setState((s) => {
            const ss = s.form.sessions.find((x) => x.id === sessionId);
            if (ss) { const m = ss.messages.find((m) => m.id === assistantMsgId); if (m) m.isError = true; }
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [form.activeSessionId, form.sessions, createSession, addMessage, editMessage]
  );

  const handleStop = () => abortRef.current?.abort();

  const handleNewSession = () => { createSession(); setMobileSidebar(false); };

  const handleNewSessionWithAgent = (agentId: string) => {
    createSession(agentId);
  };

  const handleCreateGroup = () => {
    const name = prompt("Group name:");
    if (name?.trim()) createSessionGroup(name.trim());
  };

  const handleRegenerate = (msgId: string) => {
    if (!activeSession || isStreaming) return;
    regenerateMessage(activeSession.id, msgId);
    const lastUserMsg = [...activeSession.messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) handleSend(lastUserMsg.content, lastUserMsg.attachments || []);
  };

  const handleExport = (format: "json" | "markdown" | "text") => {
    if (!activeSession) return;
    const data = exportSession(activeSession.id, format);
    const ext = format === "json" ? "json" : format === "markdown" ? "md" : "txt";
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSession.title.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
    window.dispatchEvent(new CustomEvent("workspace:save"));
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const count = importSessions(text);
      if (count > 0) window.dispatchEvent(new CustomEvent("workspace:dirty"));
    };
    input.click();
  };

  const handleSwitchAgent = (agentId: string) => {
    if (!activeSession) return;
    useAIChatV2Editor.setState((s) => {
      const ss = s.form.sessions.find((x) => x.id === activeSession.id);
      if (ss) { ss.agentId = agentId; ss.updatedAt = Date.now(); }
    });
  };

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════

  return (
    <div className="flex h-full bg-gray-950">
      {/* ── LEFT: Session sidebar (desktop) ── */}
      {sidebarOpen && (
        <div className="hidden lg:flex w-72 shrink-0 flex-col border-r border-gray-800/60">
          <SessionSidebar
            sessions={form.sessions}
            sessionGroups={form.sessionGroups}
            activeId={form.activeSessionId}
            onSelect={setActiveSession}
            onNew={handleNewSession}
            onDelete={deleteSession}
            onRename={renameSession}
            onPin={pinSession}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateGroup={handleCreateGroup}
            onMoveToGroup={moveSessionToGroup}
          />
        </div>
      )}

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileSidebar(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-80 border-r border-gray-800 bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <SessionSidebar
              sessions={form.sessions}
              sessionGroups={form.sessionGroups}
              activeId={form.activeSessionId}
              onSelect={(id) => { setActiveSession(id); setMobileSidebar(false); }}
              onNew={handleNewSession}
              onDelete={deleteSession}
              onRename={renameSession}
              onPin={pinSession}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onCreateGroup={handleCreateGroup}
              onMoveToGroup={moveSessionToGroup}
            />
          </div>
        </div>
      )}

      {/* ── CENTER: Chat area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 border-b border-gray-800/60 px-3 py-2">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            title="Toggle sidebar"
          >
            <IconMenu className="h-4.5 w-4.5" />
          </button>
          <button onClick={() => setMobileSidebar(!mobileSidebar)} className="lg:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-800">
            <IconMenu className="h-4.5 w-4.5" />
          </button>

          {/* Model selector */}
          <ModelSelectorDropdown model={activeSession?.model || form.globalModel} onChange={(m) => {
            if (activeSession) updateSessionSettings(activeSession.id, { model: m });
            else setGlobalModel(m);
          }} />

          {/* Agent badge */}
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-800/40 px-2.5 py-1.5 text-xs text-gray-400">
            <span className="text-sm">{activeAgent.avatar}</span>
            <span className="hidden sm:inline font-medium text-gray-300">{activeAgent.name}</span>
          </div>

          <div className="flex-1" />

          {/* Topic panel toggle */}
          <button
            onClick={toggleTopicPanel}
            className={`rounded-lg p-1.5 transition-colors ${form.showTopicPanel ? "bg-primary-500/10 text-primary-400" : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"}`}
            title="Topics"
          >
            <HashIcon className="h-4 w-4" />
          </button>

          {/* Settings panel toggle */}
          <button
            onClick={toggleSettingsPanel}
            className={`rounded-lg p-1.5 transition-colors ${form.showSettingsPanel ? "bg-primary-500/10 text-primary-400" : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"}`}
            title="Settings"
          >
            <PanelRightIcon />
          </button>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              disabled={!activeSession}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 disabled:opacity-30 transition-colors"
              title="Export"
            >
              <IconDownload className="h-4 w-4" />
            </button>
            {showExport && activeSession && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-700 bg-gray-900 py-1 shadow-xl">
                <button onClick={() => handleExport("markdown")} className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-gray-800">Export as Markdown</button>
                <button onClick={() => handleExport("json")} className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-gray-800">Export as JSON</button>
                <button onClick={() => handleExport("text")} className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-gray-800">Export as Text</button>
                <hr className="my-1 border-gray-700/50" />
                <button onClick={handleImport} className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-gray-800">Import JSON</button>
              </div>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {!activeSession || activeSession.messages.length === 0 ? (
            <EmptyState onSuggestion={(text) => handleSend(text, [])} onPickAgent={handleNewSessionWithAgent} />
          ) : (
            <div className="py-2">
              {activeSession.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  agent={activeAgent}
                  onCopy={() => navigator.clipboard.writeText(msg.content)}
                  onEdit={() => {
                    const newContent = prompt("Edit message:", msg.content);
                    if (newContent !== null) editMessage(activeSession.id, msg.id, newContent);
                  }}
                  onDelete={() => deleteMessage(activeSession.id, msg.id)}
                  onBookmark={() => bookmarkMessage(activeSession.id, msg.id)}
                  onFork={() => forkFromMessage(activeSession.id, msg.id)}
                  onRegenerate={() => handleRegenerate(msg.id)}
                  onTranslate={() => {
                    // Simple translate toggle - in real Lobe Chat this calls a translation API
                    if (msg.translated) {
                      setMessageTranslation(activeSession.id, msg.id, "");
                    } else {
                      setMessageTranslation(activeSession.id, msg.id, "[Translation would appear here — connect a translation API]");
                    }
                  }}
                  onTTS={() => {
                    // Simple TTS using Web Speech API
                    if ("speechSynthesis" in window) {
                      const utter = new SpeechSynthesisUtterance(msg.content.slice(0, 500));
                      utter.rate = 1;
                      window.speechSynthesis.speak(utter);
                    }
                  }}
                />
              ))}
              {isStreaming && (
                <div className="flex items-center gap-2 px-8 py-3">
                  <div className="mx-auto max-w-3xl flex items-center gap-3 text-sm text-gray-500">
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
        <ChatInputBar
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={handleStop}
          onClearMessages={() => activeSession && clearMessages(activeSession.id)}
          hasMessages={(activeSession?.messages.length || 0) > 0}
        />
      </div>

      {/* ── RIGHT: Topic panel ── */}
      {form.showTopicPanel && activeSession && (
        <TopicPanel
          topics={topics}
          activeTopicId={activeSession.activeTopicId}
          onSelect={(id) => setActiveTopic(activeSession.id, id)}
          onCreate={() => createTopic(activeSession.id)}
          onRename={renameTopic}
          onDelete={deleteTopic}
          onToggleFav={toggleTopicFav}
          onClose={toggleTopicPanel}
        />
      )}

      {/* ── RIGHT: Settings panel ── */}
      {form.showSettingsPanel && activeSession && (
        <SettingsPanel
          session={activeSession}
          agent={activeAgent}
          allAgents={allAgents}
          globalModel={form.globalModel}
          onUpdateSettings={(patch) => updateSessionSettings(activeSession.id, patch)}
          onSwitchAgent={handleSwitchAgent}
          onClose={toggleSettingsPanel}
        />
      )}
    </div>
  );
}
