"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  Fragment,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useChatStore, BUILTIN_PRESETS } from "@/stores/chat";
import type {
  ChatMessage,
  ChatConversation,
  ChatProvider,
  SystemPreset,
  FileAttachment,
} from "@/stores/chat";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createAIChatManifest } from "@/lib/chiko/manifests/ai-chat";
import {
  IconSend,
  IconPlus,
  IconSparkles,
  IconCopy,
  IconCheck,
  IconSearch,
  IconDownload,
  IconX,
  IconChevronDown,
  IconChevronLeft,
  IconFolder,
  IconStar,
  IconRefresh,
  IconSettings,
  IconTrash,
  IconUser,
} from "@/components/icons";

/* ═══════════════════════════════════════════════════════════════
   INLINE SVG ICONS — Chat-specific, not in global icons library
   ═══════════════════════════════════════════════════════════════ */

type SvgProps = React.SVGProps<SVGSVGElement>;

function PaperclipIcon(p: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function StopIcon(p: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

function PencilIcon(p: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function GitForkIcon(p: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" />
      <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /><path d="M12 12v3" />
    </svg>
  );
}

function SidebarIcon(p: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" />
    </svg>
  );
}

function BookmarkIcon(p: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function ArrowUpIcon(p: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
    </svg>
  );
}

function MoreDotsIcon(p: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════ */

const MODEL_OPTIONS: { id: ChatProvider; label: string; icon: string; desc: string }[] = [
  { id: "claude", label: "Claude Sonnet", icon: "✦", desc: "Anthropic — nuanced reasoning" },
  { id: "openai", label: "GPT-4o", icon: "◆", desc: "OpenAI — versatile, fast" },
];

const SUGGESTIONS = [
  "Write a tagline for a tech startup",
  "Create a product description for eco-friendly sneakers",
  "Help me draft a cold email for B2B outreach",
  "Generate 5 blog post ideas about AI in design",
  "Explain the concept of RAG in simple terms",
  "Design a color palette for a luxury brand",
];

function estimateTokens(t: string) {
  return Math.ceil(t.length / 4);
}

function timeLabel(ts: number): string {
  const d = Date.now() - ts;
  const day = 86_400_000;
  if (d < day) return "Today";
  if (d < 2 * day) return "Yesterday";
  if (d < 7 * day) return "This Week";
  if (d < 30 * day) return "This Month";
  return "Older";
}

function groupByDate(convs: ChatConversation[]) {
  const groups: Record<string, ChatConversation[]> = {};
  for (const c of convs) {
    const label = timeLabel(c.updatedAt);
    (groups[label] ??= []).push(c);
  }
  return groups;
}

/* ═══════════════════════════════════════════════════════════════
   CODE BLOCK — Language label + copy button
   ═══════════════════════════════════════════════════════════════ */

function CodeBlock({ language, children }: { language?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code my-3 rounded-xl overflow-hidden border border-gray-700/50">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-950 text-xs text-gray-400">
        <span>{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-gray-200 transition-colors"
        >
          {copied ? <IconCheck className="size-3.5" /> : <IconCopy className="size-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      {/* Code content */}
      <pre className="p-4 bg-gray-900 text-sm overflow-x-auto text-gray-200">
        <code>{children}</code>
      </pre>
    </div>
  );
}

/* Markdown component overrides for LibreChat-style rendering */
function MarkdownComponents() {
  return useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || "");
        const codeString = String(children).replace(/\n$/, "");
        // Multi-line code = code block
        if (codeString.includes("\n") || match) {
          return <CodeBlock language={match?.[1]}>{codeString}</CodeBlock>;
        }
        // Inline code
        return (
          <code className="px-1.5 py-0.5 rounded-md bg-gray-800 text-primary-400 text-[0.8125em] font-mono" {...props}>
            {children}
          </code>
        );
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pre({ children }: any) {
        // The code component handles everything, so pre is a passthrough
        return <>{children}</>;
      },
    }),
    []
  );
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE BUBBLE — LibreChat style
   Full-width, left-aligned, avatar + content, hover actions
   ═══════════════════════════════════════════════════════════════ */

function MessageBubble({
  message,
  conversationId,
  isLast,
  isGenerating,
  onRegenerate,
  onEditAndResend,
}: {
  message: ChatMessage;
  conversationId: string;
  isLast: boolean;
  isGenerating: boolean;
  onRegenerate?: () => void;
  onEditAndResend?: (content: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const { bookmarkMessage, forkFromMessage } = useChatStore();
  const mdComponents = MarkdownComponents();
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && onEditAndResend) {
      onEditAndResend(editText.trim());
    }
    setEditing(false);
  };

  return (
    <div className="group/msg px-4 py-6 hover:bg-gray-800/30 transition-colors">
      <div className="max-w-3xl xl:max-w-4xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className={`size-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
          isUser
            ? "bg-gray-700 text-gray-300"
            : "bg-primary-500/20 text-primary-400"
        }`}>
          {isUser ? (
            <IconUser className="size-3.5" />
          ) : (
            <IconSparkles className="size-3.5" />
          )}
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Name + provider tag */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold text-gray-100">
              {isUser ? "You" : "DMSuite AI"}
            </span>
            {message.provider && !isUser && (
              <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 font-medium">
                {message.provider === "claude" ? "Claude" : "GPT-4o"}
              </span>
            )}
          </div>

          {/* File attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((file) =>
                file.type.startsWith("image/") ? (
                  <img
                    key={file.id}
                    src={file.url}
                    alt={file.name}
                    className="max-w-48 max-h-48 rounded-lg border border-gray-700"
                  />
                ) : (
                  <div key={file.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300">
                    <PaperclipIcon className="size-3.5" />
                    <span className="truncate max-w-40">{file.name}</span>
                    <span className="text-gray-500">{(file.size / 1024).toFixed(0)}KB</span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Message body */}
          {editing ? (
            <div className="space-y-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded-xl border border-gray-600 bg-gray-800 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 resize-none min-h-24"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                  if (e.key === "Escape") {
                    setEditing(false);
                    setEditText(message.content);
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-semibold hover:bg-primary-400 transition-colors"
                >
                  Save & Submit
                </button>
                <button
                  onClick={() => { setEditing(false); setEditText(message.content); }}
                  className="px-4 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 text-xs hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isUser ? (
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-gray-100 prose-a:text-primary-400 prose-strong:text-gray-100 prose-li:text-gray-300 [&>*:first-child]:mt-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={mdComponents}
              >
                {message.content || (isLast && isGenerating ? "..." : "")}
              </ReactMarkdown>
            </div>
          )}

          {/* Action bar — visible on hover */}
          {!editing && message.content && (
            <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
              <ActionButton onClick={handleCopy} title="Copy">
                {copied ? <IconCheck className="size-4 text-primary-400" /> : <IconCopy className="size-4" />}
              </ActionButton>

              {isUser && onEditAndResend && (
                <ActionButton onClick={() => setEditing(true)} title="Edit">
                  <PencilIcon className="size-4" />
                </ActionButton>
              )}

              <ActionButton
                onClick={() => bookmarkMessage(conversationId, message.id)}
                title={message.bookmarked ? "Remove bookmark" : "Bookmark"}
                active={message.bookmarked}
              >
                <BookmarkIcon className={`size-4 ${message.bookmarked ? "fill-primary-400 text-primary-400" : ""}`} />
              </ActionButton>

              <ActionButton onClick={() => forkFromMessage(conversationId, message.id)} title="Fork from here">
                <GitForkIcon className="size-4" />
              </ActionButton>

              {!isUser && isLast && onRegenerate && !isGenerating && (
                <ActionButton onClick={onRegenerate} title="Regenerate">
                  <IconRefresh className="size-4" />
                </ActionButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Tiny action button for message actions */
function ActionButton({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        active
          ? "text-primary-400"
          : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONVERSATION ITEM — Sidebar entry
   ═══════════════════════════════════════════════════════════════ */

function ConvItem({
  conv,
  isActive,
  onSelect,
  onDelete,
  onRename,
  onPin,
}: {
  conv: ChatConversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: () => void;
  onPin: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full group/ci text-left px-3 py-2.5 rounded-lg text-[0.8125rem] transition-colors flex items-center gap-2 ${
        isActive
          ? "bg-gray-800 text-gray-100"
          : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-300"
      }`}
    >
      <span className="flex-1 truncate">{conv.title}</span>

      {/* Action icons — appear on hover */}
      <span className="flex items-center gap-0.5 opacity-0 group-hover/ci:opacity-100 transition-opacity shrink-0">
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onRename(); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onRename(); } }}
          className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
          title="Rename"
        >
          <PencilIcon className="size-3.5" />
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onPin(); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onPin(); } }}
          className={`p-1 rounded hover:bg-gray-700 transition-colors ${conv.pinned ? "text-primary-400" : "text-gray-500 hover:text-gray-300"}`}
          title={conv.pinned ? "Unpin" : "Pin"}
        >
          <IconStar className={`size-3.5 ${conv.pinned ? "fill-primary-400" : ""}`} />
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onDelete(); } }}
          className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <IconTrash className="size-3.5" />
        </span>
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHAT SIDEBAR — LibreChat style: dark bg, new chat, search,
   date-grouped conversations, pinned section
   ═══════════════════════════════════════════════════════════════ */

function ChatSidebar({ onClose }: { onClose?: () => void }) {
  const {
    conversations,
    activeConversationId,
    sidebarSearch,
    folders,
    setSidebarSearch,
    setActiveConversation,
    deleteConversation,
    createConversation,
    renameConversation,
    pinConversation,
    unpinConversation,
  } = useChatStore();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  // Filter: exclude temporary, apply search
  const filtered = useMemo(() => {
    let list = conversations.filter((c) => !c.temporary);
    if (sidebarSearch.trim()) {
      const q = sidebarSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    }
    return list;
  }, [conversations, sidebarSearch]);

  const pinned = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned && !c.folder);
  const grouped = useMemo(() => groupByDate(unpinned), [unpinned]);

  // Folder-grouped
  const folderConvs = useMemo(() => {
    const map: Record<string, ChatConversation[]> = {};
    for (const f of folders) {
      const items = filtered.filter((c) => c.folder === f && !c.pinned);
      if (items.length > 0) map[f] = items;
    }
    return map;
  }, [filtered, folders]);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(folders));

  const startRename = (conv: ChatConversation) => {
    setRenamingId(conv.id);
    setRenameText(conv.title);
  };

  const submitRename = () => {
    if (renamingId && renameText.trim()) {
      renameConversation(renamingId, renameText.trim());
    }
    setRenamingId(null);
  };

  const handleNewChat = () => {
    createConversation();
    onClose?.();
  };

  const selectConv = (id: string) => {
    setActiveConversation(id);
    onClose?.();
  };

  const renderConv = (conv: ChatConversation) => {
    if (renamingId === conv.id) {
      return (
        <div key={conv.id} className="px-3 py-2">
          <input
            type="text"
            value={renameText}
            onChange={(e) => setRenameText(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") setRenamingId(null);
            }}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500/40"
            autoFocus
          />
        </div>
      );
    }
    return (
      <ConvItem
        key={conv.id}
        conv={conv}
        isActive={conv.id === activeConversationId}
        onSelect={() => selectConv(conv.id)}
        onDelete={() => deleteConversation(conv.id)}
        onRename={() => startRename(conv)}
        onPin={() => conv.pinned ? unpinConversation(conv.id) : pinConversation(conv.id)}
      />
    );
  };

  return (
    <div className="flex flex-col h-full w-64 bg-gray-950 border-r border-gray-800/60">
      {/* New Chat button */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <IconPlus className="size-4" />
            New Chat
          </button>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
              <IconX className="size-4" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-600" />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-8 rounded-lg pl-8 pr-3 bg-gray-900 border border-gray-800 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {/* Pinned */}
        {pinned.length > 0 && (
          <div className="mb-2">
            <p className="text-[0.625rem] font-medium text-gray-600 uppercase tracking-wider px-3 py-1.5">
              Pinned
            </p>
            {pinned.map(renderConv)}
          </div>
        )}

        {/* Folders */}
        {Object.entries(folderConvs).map(([folder, convs]) => (
          <div key={folder} className="mb-1">
            <button
              onClick={() => {
                setExpandedFolders((prev) => {
                  const next = new Set(prev);
                  next.has(folder) ? next.delete(folder) : next.add(folder);
                  return next;
                });
              }}
              className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[0.625rem] font-medium text-gray-600 uppercase tracking-wider hover:text-gray-400 transition-colors"
            >
              <IconChevronDown className={`size-3 transition-transform ${expandedFolders.has(folder) ? "" : "-rotate-90"}`} />
              <IconFolder className="size-3" />
              {folder}
            </button>
            {expandedFolders.has(folder) && convs.map(renderConv)}
          </div>
        ))}

        {/* Date-grouped */}
        {Object.entries(grouped).map(([label, convs]) => (
          <Fragment key={label}>
            <p className="text-[0.625rem] font-medium text-gray-600 uppercase tracking-wider px-3 py-1.5 mt-3 first:mt-0">
              {label}
            </p>
            {convs.map(renderConv)}
          </Fragment>
        ))}

        {filtered.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-12">
            {sidebarSearch ? "No matches" : "No conversations yet"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE / LANDING — LibreChat style
   Centered greeting + suggestion grid
   ═══════════════════════════════════════════════════════════════ */

function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
      {/* Logo */}
      <div className="size-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
        <IconSparkles className="size-8 text-primary-500" />
      </div>

      <h1 className="text-2xl font-semibold text-gray-100 mb-2">
        How can I help you today?
      </h1>
      <p className="text-sm text-gray-500 mb-10 max-w-md text-center">
        Chat with Claude or GPT-4o. Upload files, fork threads, bookmark messages.
      </p>

      {/* Suggestion grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl w-full">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="text-left px-4 py-3.5 rounded-xl border border-gray-800 text-sm text-gray-400 hover:border-gray-600 hover:text-gray-200 hover:bg-gray-800/40 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEMPORARY CHAT BANNER
   ═══════════════════════════════════════════════════════════════ */

function TempChatBanner() {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-violet-950/30 border-b border-violet-800/30 text-violet-300 text-xs">
      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
      <span>Temporary chat — won&apos;t appear in your history and will be auto-deleted</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SYSTEM PROMPT / PRESETS PANEL
   ═══════════════════════════════════════════════════════════════ */

function PresetsPanel({ onClose }: { onClose: () => void }) {
  const {
    systemPrompt,
    setSystemPrompt,
    customPresets,
    addCustomPreset,
    deleteCustomPreset,
  } = useChatStore();

  const allPresets: SystemPreset[] = [...BUILTIN_PRESETS, ...customPresets];
  const [showSave, setShowSave] = useState(false);
  const [presetLabel, setPresetLabel] = useState("");

  const handleSave = () => {
    if (!presetLabel.trim()) return;
    addCustomPreset({ label: presetLabel.trim(), prompt: systemPrompt });
    setPresetLabel("");
    setShowSave(false);
  };

  return (
    <div className="w-72 h-full border-l border-gray-800/60 bg-gray-950 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
        <h3 className="text-sm font-semibold text-gray-200">Presets & Prompts</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-gray-800">
          <IconX className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Preset chips */}
        <div className="flex flex-wrap gap-1.5">
          {allPresets.map((p) => (
            <div key={p.id} className="flex items-center">
              <button
                onClick={() => setSystemPrompt(p.prompt)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  systemPrompt === p.prompt
                    ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
                    : "text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-600"
                }`}
              >
                {p.label}
              </button>
              {!BUILTIN_PRESETS.find((bp) => bp.id === p.id) && (
                <button
                  onClick={() => deleteCustomPreset(p.id)}
                  className="ml-0.5 text-gray-600 hover:text-red-400 p-0.5"
                >
                  <IconX className="size-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Save current */}
        <button
          onClick={() => setShowSave(!showSave)}
          className="text-xs text-gray-500 hover:text-primary-400 transition-colors"
        >
          + Save current as preset
        </button>
        {showSave && (
          <div className="flex gap-2">
            <input
              type="text"
              value={presetLabel}
              onChange={(e) => setPresetLabel(e.target.value)}
              placeholder="Preset name..."
              className="flex-1 h-7 rounded-lg border border-gray-700 bg-gray-900 px-2 text-xs text-gray-200 focus:outline-none focus:border-gray-500"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <button onClick={handleSave} className="px-2 py-1 text-xs rounded-lg bg-primary-500 text-gray-950 hover:bg-primary-400">
              Save
            </button>
          </div>
        )}

        {/* System prompt editor */}
        <div className="mt-3">
          <label className="text-[0.625rem] font-medium text-gray-500 uppercase tracking-wider">
            System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            className="mt-1.5 w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-gray-600 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BOOKMARKS PANEL
   ═══════════════════════════════════════════════════════════════ */

function BookmarksPanel({
  onClose,
  onJumpToMessage,
}: {
  onClose: () => void;
  onJumpToMessage: (convId: string, msgId: string) => void;
}) {
  const { conversations } = useChatStore();

  const bookmarks = useMemo(() => {
    const results: { conv: ChatConversation; msg: ChatMessage }[] = [];
    for (const conv of conversations) {
      for (const msg of conv.messages) {
        if (msg.bookmarked) results.push({ conv, msg });
      }
    }
    return results.sort((a, b) => b.msg.timestamp - a.msg.timestamp);
  }, [conversations]);

  return (
    <div className="w-72 h-full border-l border-gray-800/60 bg-gray-950 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
        <h3 className="text-sm font-semibold text-gray-200">Bookmarks</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-gray-800">
          <IconX className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {bookmarks.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-8">
            No bookmarked messages yet
          </p>
        ) : (
          bookmarks.map(({ conv, msg }) => (
            <button
              key={msg.id}
              onClick={() => onJumpToMessage(conv.id, msg.id)}
              className="w-full text-left p-3 rounded-lg border border-gray-800 hover:border-gray-600 hover:bg-gray-800/40 transition-all"
            >
              <p className="text-[0.625rem] text-gray-500 mb-1 truncate">
                {conv.title}
              </p>
              <p className="text-xs text-gray-300 line-clamp-3">
                {msg.content.slice(0, 150)}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN WORKSPACE — AIChatWorkspace
   Full-bleed layout, no card wrapper, LibreChat design
   ═══════════════════════════════════════════════════════════════ */

export default function AIChatWorkspace() {
  const {
    conversations,
    activeConversationId,
    isGenerating,
    inputDraft,
    selectedProvider,
    systemPrompt,
    getActiveConversation,
    createConversation,
    addMessage,
    updateLastAssistantMessage,
    setIsGenerating,
    setInputDraft,
    setSelectedProvider,
    exportConversation,
  } = useChatStore();

  // Chiko integration
  useChikoActions(useCallback(() => createAIChatManifest(), []));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasDispatchedRef = useRef(false);

  // UI state
  const [showSidebar, setShowSidebar] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [rightPanel, setRightPanel] = useState<"closed" | "bookmarks" | "presets">("closed");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);

  const activeConversation = getActiveConversation();
  const isTemporary = activeConversation?.temporary ?? false;
  const messages = useMemo(
    () => activeConversation?.messages ?? [],
    [activeConversation?.messages]
  );

  const activeModel = MODEL_OPTIONS.find((m) => m.id === selectedProvider) ?? MODEL_OPTIONS[0];

  // Workspace events on mount
  useEffect(() => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;
    window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "input" } }));
  }, []);

  // Scroll to bottom
  const lastMsgContent = messages[messages.length - 1]?.content;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, lastMsgContent]);

  // Focus input on conversation switch
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConversationId]);

  /* ── File Upload Handler ── */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: FileAttachment = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: reader.result as string,
        };
        setPendingFiles((prev) => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = "";
  }, []);

  const removePendingFile = useCallback((id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /* ── Send Message ── */
  const handleSend = useCallback(
    async (overrideContent?: string) => {
      const content = (overrideContent ?? inputDraft).trim();
      if (!content && pendingFiles.length === 0) return;
      if (isGenerating) return;

      let convId = activeConversationId;
      if (!convId) {
        convId = createConversation();
      }

      // Add user message with any pending files
      addMessage({
        role: "user",
        content: content || "(attached files)",
        attachments: pendingFiles.length > 0 ? [...pendingFiles] : undefined,
      });
      setInputDraft("");
      setPendingFiles([]);
      setIsGenerating(true);

      window.dispatchEvent(new CustomEvent("workspace:dirty"));

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const convSystemPrompt = activeConversation?.systemPrompt ?? systemPrompt;

      // Build messages array with potential multimodal content
      const apiMessages = [
        ...messages.map((m) => {
          if (m.attachments && m.attachments.length > 0 && m.role === "user") {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const parts: any[] = [];
            for (const att of m.attachments) {
              if (att.type.startsWith("image/")) {
                parts.push({ type: "image_url", image_url: { url: att.url } });
              }
            }
            parts.push({ type: "text", text: m.content });
            return { role: m.role, content: parts };
          }
          return { role: m.role, content: m.content };
        }),
        // Current message
        (() => {
          if (pendingFiles.length > 0) {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const parts: any[] = [];
            for (const att of pendingFiles) {
              if (att.type.startsWith("image/")) {
                parts.push({ type: "image_url", image_url: { url: att.url } });
              }
            }
            parts.push({ type: "text", text: content });
            return { role: "user", content: parts };
          }
          return { role: "user", content };
        })(),
      ];

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            provider: selectedProvider,
            systemPrompt: convSystemPrompt,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 402) {
            const { handleCreditError } = await import("@/lib/credit-error");
            addMessage({ role: "assistant", content: handleCreditError() });
            return;
          }
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No response body");

        addMessage({ role: "assistant", content: "", provider: selectedProvider });

        let fullContent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullContent += decoder.decode(value, { stream: true });
          updateLastAssistantMessage(fullContent);
        }

        window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "content" } }));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Chat error:", error);
          addMessage({
            role: "assistant",
            content: "Something went wrong. Please check your API keys and try again.",
          });
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [
      inputDraft,
      pendingFiles,
      isGenerating,
      activeConversationId,
      createConversation,
      addMessage,
      setInputDraft,
      setIsGenerating,
      messages,
      selectedProvider,
      updateLastAssistantMessage,
      systemPrompt,
      activeConversation,
    ]
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  }, [setIsGenerating]);

  const handleEditAndResend = useCallback(
    (newContent: string) => handleSend(newContent),
    [handleSend]
  );

  const handleRegenerate = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) handleSend(lastUserMsg.content);
  }, [messages, handleSend]);

  const handleExport = useCallback(
    (format: "markdown" | "json" | "text") => {
      if (!activeConversation) return;
      const content = exportConversation(activeConversation.id, format);
      const name = `chat-${activeConversation.title.replace(/\s+/g, "-").toLowerCase()}`;
      const ext = format === "json" ? "json" : format === "markdown" ? "md" : "txt";
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
      window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "exported" } }));
      window.dispatchEvent(new CustomEvent("workspace:save"));
    },
    [activeConversation, exportConversation]
  );

  const handleJumpToMessage = useCallback(
    (convId: string, _msgId: string) => {
      useChatStore.getState().setActiveConversation(convId);
      setRightPanel("closed");
    },
    []
  );

  /* Keyboard shortcuts on input */
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* Global keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        createConversation();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [createConversation]);

  const isLanding = messages.length === 0 && !isGenerating;

  return (
    <div className="h-full flex bg-gray-900">
      {/* ═══ Left Sidebar — desktop ═══ */}
      <div className="hidden lg:block shrink-0">
        <ChatSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSidebar(false)} />
          <div className="relative z-10 h-full w-64">
            <ChatSidebar onClose={() => setShowSidebar(false)} />
          </div>
        </div>
      )}

      {/* ═══ Main Chat Area ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Header bar ── */}
        <header className="flex items-center gap-2 h-11 px-3 border-b border-gray-800/60 bg-gray-900 shrink-0">
          {/* Sidebar toggle (mobile) */}
          <button
            onClick={() => setShowSidebar(true)}
            className="lg:hidden text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <SidebarIcon className="size-4" />
          </button>

          {/* New chat (desktop) */}
          <button
            onClick={() => createConversation()}
            className="hidden lg:flex text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            title="New Chat (Ctrl+N)"
          >
            <PencilIcon className="size-4" />
          </button>

          {/* Model selector — prominent, LEFT side like LibreChat */}
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <span className="text-base leading-none">{activeModel.icon}</span>
              <span>{activeModel.label}</span>
              <IconChevronDown className="size-3 text-gray-500" />
            </button>

            {showModelPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowModelPicker(false)} />
                <div className="absolute left-0 top-full mt-1 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-20 py-1">
                  {MODEL_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedProvider(m.id); setShowModelPicker(false); }}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-gray-700 transition-colors ${
                        selectedProvider === m.id ? "text-primary-400" : "text-gray-300"
                      }`}
                    >
                      <span className="text-lg leading-none">{m.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.label}</p>
                        <p className="text-[0.625rem] text-gray-500">{m.desc}</p>
                      </div>
                      {selectedProvider === m.id && <IconCheck className="size-4 text-primary-400" />}
                    </button>
                  ))}

                  {/* Temporary chat toggle */}
                  <div className="border-t border-gray-700 mt-1 pt-1">
                    <button
                      onClick={() => {
                        const conv = getActiveConversation();
                        if (conv) {
                          // Toggle temporary on current conversation
                          useChatStore.setState((s) => {
                            const c = s.conversations.find((x) => x.id === conv.id);
                            if (c) c.temporary = !c.temporary;
                          });
                        } else {
                          createConversation({ temporary: true });
                        }
                        setShowModelPicker(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-gray-700 transition-colors ${
                        isTemporary ? "text-violet-400" : "text-gray-400"
                      }`}
                    >
                      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Temporary Chat</p>
                        <p className="text-[0.625rem] text-gray-500">Won&apos;t save to history</p>
                      </div>
                      {isTemporary && <IconCheck className="size-4 text-violet-400" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right-side actions */}
          <button
            onClick={() => setRightPanel(rightPanel === "presets" ? "closed" : "presets")}
            className={`p-1.5 rounded-lg transition-colors ${
              rightPanel === "presets"
                ? "bg-gray-800 text-primary-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
            }`}
            title="Presets & Prompts"
          >
            <IconSettings className="size-4" />
          </button>

          <button
            onClick={() => setRightPanel(rightPanel === "bookmarks" ? "closed" : "bookmarks")}
            className={`p-1.5 rounded-lg transition-colors ${
              rightPanel === "bookmarks"
                ? "bg-gray-800 text-primary-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
            }`}
            title="Bookmarks"
          >
            <BookmarkIcon className="size-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              title="Export"
            >
              <IconDownload className="size-4" />
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-36 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-20 py-1">
                  {(["markdown", "json", "text"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 capitalize transition-colors"
                    >
                      Export as {fmt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        {/* ── Temporary chat banner ── */}
        {isTemporary && <TempChatBanner />}

        {/* ── Messages / Landing ── */}
        {isLanding ? (
          <EmptyState onSuggestion={(text) => { setInputDraft(text); inputRef.current?.focus(); }} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                conversationId={activeConversation?.id ?? ""}
                isLast={idx === messages.length - 1}
                isGenerating={isGenerating}
                onRegenerate={
                  msg.role === "assistant" && idx === messages.length - 1
                    ? handleRegenerate
                    : undefined
                }
                onEditAndResend={msg.role === "user" ? handleEditAndResend : undefined}
              />
            ))}

            {/* Typing indicator */}
            {isGenerating && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="px-4 py-6">
                <div className="max-w-3xl xl:max-w-4xl mx-auto flex gap-4">
                  <div className="size-7 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center">
                    <IconSparkles className="size-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    <div className="size-2 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
                    <div className="size-2 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
                    <div className="size-2 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ═══ Input Area — LibreChat style ═══ */}
        <div className={`px-4 pb-4 ${isLanding ? "" : "pt-2"}`}>
          <div className="max-w-3xl xl:max-w-4xl mx-auto">
            {/* Pending file previews */}
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {pendingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="relative group/file flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300"
                  >
                    {file.type.startsWith("image/") ? (
                      <img src={file.url} alt={file.name} className="size-8 rounded object-cover" />
                    ) : (
                      <PaperclipIcon className="size-4 text-gray-500" />
                    )}
                    <span className="truncate max-w-32">{file.name}</span>
                    <button
                      onClick={() => removePendingFile(file.id)}
                      className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-gray-700 text-gray-300 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-all"
                    >
                      <IconX className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input container — pill shape like LibreChat */}
            <div
              className={`relative flex flex-col rounded-3xl border transition-colors ${
                isTemporary
                  ? "border-violet-700/50 bg-gray-800/80"
                  : "border-gray-700 bg-gray-800 focus-within:border-gray-600"
              }`}
            >
              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={inputDraft}
                onChange={(e) => setInputDraft(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={`Message ${activeModel.label}...`}
                rows={1}
                className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none max-h-44"
                style={{ minHeight: "44px" }}
                onInput={(e) => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 176)}px`;
                }}
                disabled={isGenerating}
              />

              {/* Bottom action row inside the pill */}
              <div className="flex items-center justify-between px-3 pb-2.5">
                {/* Left: Upload */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
                    title="Attach file"
                    disabled={isGenerating}
                  >
                    <PaperclipIcon className="size-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.csv,.md"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Right: Send / Stop */}
                {isGenerating ? (
                  <button
                    onClick={handleStop}
                    className="size-8 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-500 transition-colors"
                    aria-label="Stop"
                  >
                    <StopIcon className="size-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputDraft.trim() && pendingFiles.length === 0}
                    className="size-8 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send"
                  >
                    <ArrowUpIcon className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[0.625rem] text-gray-600 text-center mt-2">
              DMSuite AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Right Panel ═══ */}
      {rightPanel === "presets" && (
        <div className="hidden md:block shrink-0">
          <PresetsPanel onClose={() => setRightPanel("closed")} />
        </div>
      )}
      {rightPanel === "bookmarks" && (
        <div className="hidden md:block shrink-0">
          <BookmarksPanel onClose={() => setRightPanel("closed")} onJumpToMessage={handleJumpToMessage} />
        </div>
      )}
    </div>
  );
}
