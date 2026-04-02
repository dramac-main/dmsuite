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
import type { ChatMessage, ChatConversation, ChatProvider, SystemPreset } from "@/stores/chat";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createAIChatManifest } from "@/lib/chiko/manifests/ai-chat";
import {
  IconSend,
  IconPlus,
  IconSparkles,
  IconMessageCircle,
  IconCopy,
  IconCheck,
  IconSearch,
  IconDownload,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconStar,
  IconRefresh,
  IconSettings,
} from "@/components/icons";

/* ── Model Options ──────────────────────────────────────────── */
const MODEL_OPTIONS: {
  id: ChatProvider;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "claude",
    label: "Claude",
    icon: "✦",
    description: "Anthropic Claude — nuanced, thorough",
  },
  {
    id: "openai",
    label: "GPT-4o",
    icon: "◆",
    description: "OpenAI GPT-4o — versatile, fast",
  },
];

/* ── Token estimate ─────────────────────────────────────────── */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/* ── Relative time helper ───────────────────────────────────── */
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE BUBBLE — LibreChat style: full-width, left-aligned,
   with avatar, hover actions, bookmark, fork, copy
   ═══════════════════════════════════════════════════════════════ */
function MessageBubble({
  message,
  conversationId,
  isLast,
  onRegenerate,
  onEditAndResend,
}: {
  message: ChatMessage;
  conversationId: string;
  isLast: boolean;
  onRegenerate?: () => void;
  onEditAndResend?: (newContent: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const { bookmarkMessage, forkFromMessage } = useChatStore();
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
    <div className="group relative px-4 sm:px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div
          className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
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
        <div className="flex-1 min-w-0">
          {/* Role label */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {isUser ? "You" : "AI Assistant"}
            </span>
            {message.provider && !isUser && (
              <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                {message.provider === "claude" ? "Claude" : "GPT-4o"}
              </span>
            )}
            {message.bookmarked && (
              <IconStar className="size-3 text-yellow-500 fill-yellow-500" />
            )}
            <span className="text-[0.625rem] text-gray-400 ml-auto">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Body */}
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
                  onClick={() => {
                    setEditing(false);
                    setEditText(message.content);
                  }}
                  className="px-3 py-1 rounded-lg text-gray-400 hover:text-gray-300 text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isUser ? (
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-code:text-primary-400 prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Action bar — visible on hover */}
          {!editing && message.content && (
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Copy"
              >
                {copied ? (
                  <IconCheck className="size-3.5 text-success" />
                ) : (
                  <IconCopy className="size-3.5" />
                )}
              </button>

              <button
                onClick={() =>
                  bookmarkMessage(conversationId, message.id)
                }
                className={`p-1 rounded-md transition-colors ${
                  message.bookmarked
                    ? "text-yellow-500"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={message.bookmarked ? "Remove bookmark" : "Bookmark"}
              >
                <IconStar className="size-3.5" />
              </button>

              <button
                onClick={() =>
                  forkFromMessage(conversationId, message.id)
                }
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Fork from here"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
                </svg>
              </button>

              {isUser && onEditAndResend && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-[0.625rem] font-medium"
                  title="Edit"
                >
                  Edit
                </button>
              )}

              {!isUser && isLast && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Regenerate"
                >
                  <IconRefresh className="size-3.5" />
                  <span className="text-[0.625rem]">Regen</span>
                </button>
              )}

              <span className="text-[0.625rem] text-gray-500 ml-2 tabular-nums">
                ~{message.tokenEstimate ?? estimateTokens(message.content)}{" "}
                tokens
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONVERSATION SIDEBAR — LibreChat style: search, folders,
   pinned section, date-grouped conversations
   ═══════════════════════════════════════════════════════════════ */
function ChatSidebar({
  onClose,
}: {
  onClose?: () => void;
}) {
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
    moveToFolder,
  } = useChatStore();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(folders)
  );

  const filteredConversations = useMemo(() => {
    if (!sidebarSearch.trim()) return conversations;
    const q = sidebarSearch.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, sidebarSearch]);

  const pinned = filteredConversations.filter((c) => c.pinned);
  const unpinned = filteredConversations.filter((c) => !c.pinned);

  // Group unpinned by date
  const grouped = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    const groups: Record<string, ChatConversation[]> = {};
    for (const conv of unpinned) {
      const age = now - conv.updatedAt;
      let label: string;
      if (age < day) label = "Today";
      else if (age < 2 * day) label = "Yesterday";
      else if (age < 7 * day) label = "This Week";
      else if (age < 30 * day) label = "This Month";
      else label = "Older";
      (groups[label] ??= []).push(conv);
    }
    return groups;
  }, [unpinned]);

  const startRename = (conv: ChatConversation) => {
    setRenamingId(conv.id);
    setRenameText(conv.title);
    setContextMenuId(null);
  };

  const submitRename = () => {
    if (renamingId && renameText.trim()) {
      renameConversation(renamingId, renameText.trim());
    }
    setRenamingId(null);
  };

  const toggleFolder = (f: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(f)) { next.delete(f); } else { next.add(f); }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">
            Conversations
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            >
              <IconX className="size-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => createConversation()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 transition-colors"
        >
          <IconPlus className="size-4" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-8 rounded-lg pl-8 pr-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 text-xs text-gray-900 dark:text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/40 transition-all"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {/* Pinned */}
        {pinned.length > 0 && (
          <div className="mb-2">
            <p className="text-[0.625rem] font-medium text-gray-400 uppercase tracking-wider px-2 py-1">
              Pinned
            </p>
            {pinned.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                isRenaming={renamingId === conv.id}
                renameText={renameText}
                showContextMenu={contextMenuId === conv.id}
                onSelect={() => { setActiveConversation(conv.id); onClose?.(); }}
                onDelete={() => deleteConversation(conv.id)}
                onTogglePin={() => unpinConversation(conv.id)}
                onStartRename={() => startRename(conv)}
                onSubmitRename={submitRename}
                onRenameTextChange={setRenameText}
                onToggleContextMenu={() =>
                  setContextMenuId(contextMenuId === conv.id ? null : conv.id)
                }
                onMoveToFolder={(f) => moveToFolder(conv.id, f)}
                folders={folders}
              />
            ))}
          </div>
        )}

        {/* Folders */}
        {folders.map((folder) => {
          const folderConvs = unpinned.filter((c) => c.folder === folder);
          if (folderConvs.length === 0) return null;
          return (
            <div key={folder} className="mb-1">
              <button
                onClick={() => toggleFolder(folder)}
                className="flex items-center gap-1.5 w-full px-2 py-1 text-[0.625rem] font-medium text-gray-400 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300"
              >
                {expandedFolders.has(folder) ? (
                  <IconChevronDown className="size-3" />
                ) : (
                  <IconChevronRight className="size-3" />
                )}
                <IconFolder className="size-3" />
                {folder}
              </button>
              {expandedFolders.has(folder) &&
                folderConvs.map((conv) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    isActive={conv.id === activeConversationId}
                    isRenaming={renamingId === conv.id}
                    renameText={renameText}
                    showContextMenu={contextMenuId === conv.id}
                    onSelect={() => { setActiveConversation(conv.id); onClose?.(); }}
                    onDelete={() => deleteConversation(conv.id)}
                    onTogglePin={() => pinConversation(conv.id)}
                    onStartRename={() => startRename(conv)}
                    onSubmitRename={submitRename}
                    onRenameTextChange={setRenameText}
                    onToggleContextMenu={() =>
                      setContextMenuId(contextMenuId === conv.id ? null : conv.id)
                    }
                    onMoveToFolder={(f) => moveToFolder(conv.id, f)}
                    folders={folders}
                  />
                ))}
            </div>
          );
        })}

        {/* Date-grouped */}
        {Object.entries(grouped).map(([label, convs]) => {
          const noFolder = convs.filter((c) => !c.folder);
          if (noFolder.length === 0) return null;
          return (
            <Fragment key={label}>
              <p className="text-[0.625rem] font-medium text-gray-400 uppercase tracking-wider px-2 py-1 mt-2">
                {label}
              </p>
              {noFolder.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConversationId}
                  isRenaming={renamingId === conv.id}
                  renameText={renameText}
                  showContextMenu={contextMenuId === conv.id}
                  onSelect={() => { setActiveConversation(conv.id); onClose?.(); }}
                  onDelete={() => deleteConversation(conv.id)}
                  onTogglePin={() => pinConversation(conv.id)}
                  onStartRename={() => startRename(conv)}
                  onSubmitRename={submitRename}
                  onRenameTextChange={setRenameText}
                  onToggleContextMenu={() =>
                    setContextMenuId(contextMenuId === conv.id ? null : conv.id)
                  }
                  onMoveToFolder={(f) => moveToFolder(conv.id, f)}
                  folders={folders}
                />
              ))}
            </Fragment>
          );
        })}

        {filteredConversations.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">
            {sidebarSearch ? "No matches found" : "No conversations yet"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Conversation list item ─────────────────────────────────── */
function ConvItem({
  conv,
  isActive,
  isRenaming,
  renameText,
  showContextMenu,
  onSelect,
  onDelete,
  onTogglePin,
  onStartRename,
  onSubmitRename,
  onRenameTextChange,
  onToggleContextMenu,
  onMoveToFolder,
  folders,
}: {
  conv: ChatConversation;
  isActive: boolean;
  isRenaming: boolean;
  renameText: string;
  showContextMenu: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onStartRename: () => void;
  onSubmitRename: () => void;
  onRenameTextChange: (t: string) => void;
  onToggleContextMenu: () => void;
  onMoveToFolder: (f: string | undefined) => void;
  folders: string[];
}) {
  return (
    <div className="relative">
      <button
        onClick={onSelect}
        onContextMenu={(e) => {
          e.preventDefault();
          onToggleContextMenu();
        }}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group/item flex items-center gap-2 ${
          isActive
            ? "bg-primary-500/10 text-primary-500"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        <IconMessageCircle className="size-4 shrink-0" />
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              type="text"
              value={renameText}
              onChange={(e) => onRenameTextChange(e.target.value)}
              onBlur={onSubmitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmitRename();
                if (e.key === "Escape") onSubmitRename();
              }}
              className="w-full bg-transparent border-b border-primary-500 outline-none text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="block truncate">{conv.title}</span>
              <span className="block text-[0.625rem] text-gray-400">
                {conv.messages.length} msgs · {relativeTime(conv.updatedAt)}
              </span>
            </>
          )}
        </div>
        {conv.temporary && (
          <span className="text-[0.5rem] px-1 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            TMP
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleContextMenu();
          }}
          className="opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-gray-300 p-0.5 transition-opacity"
          title="More"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      </button>

      {/* Context menu */}
      {showContextMenu && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1">
          <button
            onClick={() => { onStartRename(); }}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Rename
          </button>
          <button
            onClick={onTogglePin}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {conv.pinned ? "Unpin" : "Pin to top"}
          </button>
          {folders.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
              <p className="px-3 py-1 text-[0.625rem] text-gray-400">
                Move to folder
              </p>
              {folders.map((f) => (
                <button
                  key={f}
                  onClick={() => onMoveToFolder(f)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {f}
                </button>
              ))}
              {conv.folder && (
                <button
                  onClick={() => onMoveToFolder(undefined)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 italic"
                >
                  Remove from folder
                </button>
              )}
            </div>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
            <button
              onClick={onDelete}
              className="w-full text-left px-3 py-1.5 text-xs text-error hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE — LibreChat style: centered logo, suggestions
   ═══════════════════════════════════════════════════════════════ */
function EmptyState() {
  const { setInputDraft } = useChatStore();

  const suggestions = [
    { text: "Write a tagline for a tech startup", icon: "✍️" },
    { text: "Create a product description for sneakers", icon: "👟" },
    { text: "Help me write a cold email for B2B outreach", icon: "📧" },
    { text: "Generate 5 blog post ideas about AI design", icon: "💡" },
    { text: "Explain this code: function debounce(fn, delay)", icon: "🧑‍💻" },
    { text: "Design a color palette for a luxury brand", icon: "🎨" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="size-20 rounded-2xl bg-linear-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 flex items-center justify-center mb-6 shadow-lg shadow-primary-500/5">
        <IconSparkles className="size-9 text-primary-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        AI Chat
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md text-center mb-8">
        Your multi-model AI companion. Chat with Claude or GPT-4o — switch
        providers mid-conversation, fork threads, bookmark messages.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-2xl w-full">
        {suggestions.map((s) => (
          <button
            key={s.text}
            onClick={() => setInputDraft(s.text)}
            className="text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 hover:border-primary-500/50 hover:text-primary-500 transition-all group/sug"
          >
            <span className="text-base mr-2">{s.icon}</span>
            <span className="group-hover/sug:text-primary-500 transition-colors">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SYSTEM PROMPT PANEL — Presets + custom editor
   ═══════════════════════════════════════════════════════════════ */
function SystemPromptPanel() {
  const {
    systemPrompt,
    setSystemPrompt,
    customPresets,
    addCustomPreset,
    deleteCustomPreset,
  } = useChatStore();

  const allPresets: SystemPreset[] = [
    ...BUILTIN_PRESETS,
    ...customPresets,
  ];

  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetLabel, setPresetLabel] = useState("");

  const handleSavePreset = () => {
    if (!presetLabel.trim()) return;
    addCustomPreset({ label: presetLabel.trim(), prompt: systemPrompt });
    setPresetLabel("");
    setShowSavePreset(false);
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">Presets:</span>
          {allPresets.map((p) => (
            <div key={p.id} className="flex items-center">
              <button
                onClick={() => setSystemPrompt(p.prompt)}
                className={`text-[0.625rem] px-2 py-0.5 rounded-md transition-colors ${
                  systemPrompt === p.prompt
                    ? "bg-primary-500/10 text-primary-500"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50"
                }`}
              >
                {p.label}
              </button>
              {!BUILTIN_PRESETS.find((bp) => bp.id === p.id) && (
                <button
                  onClick={() => deleteCustomPreset(p.id)}
                  className="text-gray-400 hover:text-error ml-0.5"
                  title="Delete preset"
                >
                  <IconX className="size-2.5" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setShowSavePreset(!showSavePreset)}
            className="text-[0.625rem] px-2 py-0.5 rounded-md text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
          >
            + Save current
          </button>
        </div>

        {showSavePreset && (
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={presetLabel}
              onChange={(e) => setPresetLabel(e.target.value)}
              placeholder="Preset name..."
              className="flex-1 h-7 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/40"
              onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
            />
            <button
              onClick={handleSavePreset}
              className="px-2 py-1 text-xs rounded-md bg-primary-500 text-gray-950 hover:bg-primary-400"
            >
              Save
            </button>
          </div>
        )}

        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500/40 resize-none"
          placeholder="System prompt..."
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN WORKSPACE — AIChatWorkspace (LibreChat-inspired)
   ═══════════════════════════════════════════════════════════════ */
export default function AIChatWorkspace() {
  const {
    activeConversationId,
    isGenerating,
    inputDraft,
    selectedProvider,
    showSystemPrompt,
    systemPrompt,
    getActiveConversation,
    createConversation,
    addMessage,
    updateLastAssistantMessage,
    setIsGenerating,
    setInputDraft,
    setSelectedProvider,
    setShowSystemPrompt,
    exportConversation,
  } = useChatStore();

  // Chiko integration
  useChikoActions(useCallback(() => createAIChatManifest(), []));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasDispatchedRef = useRef(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);

  const activeConversation = getActiveConversation();
  const messages = useMemo(
    () => activeConversation?.messages ?? [],
    [activeConversation?.messages]
  );

  // Total tokens for current conversation
  const totalTokens = useMemo(
    () => messages.reduce((sum, m) => sum + (m.tokenEstimate ?? estimateTokens(m.content)), 0),
    [messages]
  );

  // Workspace events on mount
  useEffect(() => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;
    window.dispatchEvent(
      new CustomEvent("workspace:progress", { detail: { milestone: "input" } })
    );
  }, []);

  // Scroll to bottom on new messages
  const lastMessageContent = messages[messages.length - 1]?.content;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, lastMessageContent]);

  // Focus input on conversation change
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConversationId]);

  /** Send a message */
  const handleSend = useCallback(
    async (overrideContent?: string) => {
      const content = (overrideContent ?? inputDraft).trim();
      if (!content || isGenerating) return;

      let convId = activeConversationId;
      if (!convId) {
        convId = createConversation();
      }

      addMessage({ role: "user", content });
      setInputDraft("");
      setIsGenerating(true);

      // Workspace dirty event
      window.dispatchEvent(new CustomEvent("workspace:dirty"));

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Use conversation-specific system prompt if set, else global
      const convSystemPrompt =
        activeConversation?.systemPrompt ?? systemPrompt;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content },
            ],
            provider: selectedProvider,
            systemPrompt: convSystemPrompt,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 402) {
            const { handleCreditError } = await import(
              "@/lib/credit-error"
            );
            addMessage({
              role: "assistant",
              content: handleCreditError(),
            });
            return;
          }
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No response body");

        addMessage({
          role: "assistant",
          content: "",
          provider: selectedProvider,
        });

        let fullContent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          updateLastAssistantMessage(fullContent);
        }

        // Mark content milestone
        window.dispatchEvent(
          new CustomEvent("workspace:progress", {
            detail: { milestone: "content" },
          })
        );
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          // User stopped — keep partial response
        } else {
          console.error("Chat error:", error);
          addMessage({
            role: "assistant",
            content:
              "I encountered an error. Please check your API keys and try again.",
          });
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [
      inputDraft,
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

  /** Stop generation */
  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  }, [setIsGenerating]);

  /** Edit a user message — re-send from that point */
  const handleEditAndResend = useCallback(
    (newContent: string) => {
      handleSend(newContent);
    },
    [handleSend]
  );

  /** Regenerate last assistant response */
  const handleRegenerate = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  }, [messages, handleSend]);

  /** Export current conversation */
  const handleExport = useCallback(
    (format: "markdown" | "json" | "text") => {
      if (!activeConversation) return;
      const content = exportConversation(activeConversation.id, format);
      const filename = `chat-${activeConversation.title.replace(/\s+/g, "-").toLowerCase()}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.${format === "json" ? "json" : format === "markdown" ? "md" : "txt"}`;
      a.click();
      URL.revokeObjectURL(url);

      window.dispatchEvent(
        new CustomEvent("workspace:progress", {
          detail: { milestone: "exported" },
        })
      );
      window.dispatchEvent(new CustomEvent("workspace:save"));
    },
    [activeConversation, exportConversation]
  );

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

  const activeModel = MODEL_OPTIONS.find((m) => m.id === selectedProvider)!;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <div className="flex h-[calc(100dvh-12rem)] min-h-96">
        {/* ── Sidebar — desktop always visible, mobile toggle ── */}
        <div className="hidden lg:block">
          <ChatSidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {showSidebar && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowSidebar(false)}
            />
            <div className="relative z-50 h-full">
              <ChatSidebar onClose={() => setShowSidebar(false)} />
            </div>
          </div>
        )}

        {/* ── Main Chat Area ──────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            {/* Sidebar toggle (mobile) */}
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              title="Show conversations"
            >
              <IconMessageCircle className="size-5" />
            </button>

            {/* Conversation title */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {activeConversation?.title ?? "AI Chat"}
              </h3>
            </div>

            {/* Model picker */}
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span>{activeModel.icon}</span>
                <span>{activeModel.label}</span>
                <IconChevronDown className="size-3" />
              </button>

              {showModelPicker && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 py-1">
                  {MODEL_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedProvider(m.id);
                        setShowModelPicker(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedProvider === m.id
                          ? "bg-primary-500/5 text-primary-500"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{m.label}</p>
                        <p className="text-[0.625rem] text-gray-400">
                          {m.description}
                        </p>
                      </div>
                      {selectedProvider === m.id && (
                        <IconCheck className="size-4 ml-auto text-primary-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* System prompt toggle */}
            <button
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className={`p-1.5 rounded-lg transition-colors ${
                showSystemPrompt
                  ? "bg-primary-500/10 text-primary-500"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title="System prompt"
            >
              <IconSettings className="size-4" />
            </button>

            {/* Export dropdown */}
            <div className="relative group">
              <button
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Export"
              >
                <IconDownload className="size-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                {(["markdown", "json", "text"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="block w-full text-left px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 capitalize"
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Token count */}
            <span className="hidden sm:inline text-[0.625rem] text-gray-500 tabular-nums">
              ~{totalTokens.toLocaleString()} tokens
            </span>
          </div>

          {/* System prompt panel */}
          {showSystemPrompt && <SystemPromptPanel />}

          {/* Messages area */}
          {messages.length === 0 && !isGenerating ? (
            <EmptyState />
          ) : (
            <div className="flex-1 overflow-y-auto">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  conversationId={activeConversation?.id ?? ""}
                  isLast={idx === messages.length - 1}
                  onRegenerate={
                    msg.role === "assistant" && idx === messages.length - 1
                      ? handleRegenerate
                      : undefined
                  }
                  onEditAndResend={
                    msg.role === "user" ? handleEditAndResend : undefined
                  }
                />
              ))}

              {/* Typing indicator */}
              {isGenerating &&
                messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="px-4 sm:px-6 py-4">
                    <div className="max-w-3xl mx-auto flex gap-4">
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
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* ── Input Area ─────────────────────────────────── */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputDraft}
                    onChange={(e) => setInputDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeModel.label}...`}
                    rows={1}
                    className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors max-h-40"
                    style={{ height: "auto", minHeight: "48px" }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                    }}
                    disabled={isGenerating}
                  />
                </div>

                {isGenerating ? (
                  <button
                    onClick={handleStop}
                    className="size-11 rounded-xl bg-error text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shrink-0"
                    aria-label="Stop"
                  >
                    <IconX className="size-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputDraft.trim()}
                    className="size-11 rounded-xl bg-primary-500 text-gray-950 flex items-center justify-center hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/20 shrink-0"
                    aria-label="Send"
                  >
                    <IconSend className="size-5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => createConversation()}
                    className="text-gray-400 hover:text-primary-500 text-[0.625rem] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="New chat (Ctrl+N)"
                  >
                    <IconPlus className="size-3" />
                    New
                  </button>
                  <button
                    onClick={() => createConversation({ temporary: true })}
                    className="text-gray-400 hover:text-yellow-500 text-[0.625rem] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Temporary chat (not saved)"
                  >
                    Temp
                  </button>
                </div>
                <p className="text-[0.625rem] text-gray-400">
                  {activeModel.label} · Shift+Enter for new line ·{" "}
                  ~{estimateTokens(inputDraft)} tokens
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
