"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useChikoStore } from "@/stores/chiko";
import { useChikoActionRegistry } from "@/stores/chiko-actions";
import { useTheme } from "@/components/ThemeProvider";
import { Chiko3DAvatar } from "./Chiko3DAvatar";
import type { ChikoExpression } from "./Chiko3DAvatar";
import {
  IconX,
  IconSend,
  IconSparkles,
  IconArrowRight,
  IconTrash,
} from "@/components/icons";
import {
  searchTools,
  toolCategories,
  getAllToolsFlat,
  type FlatTool,
} from "@/data/tools";

/* ============================================================
   Chiko Assistant Panel — Industry-Quality AI Chat
   ============================================================
   Features:
   - Fully responsive (mobile full-screen, tablet/desktop floating)
   - Streaming AI responses with markdown rendering
   - Slash commands with live autocomplete
   - Tool auto-launcher: navigate, open, search, explain
   - Action chips: one-tap contextual quick-actions
   - Smart greetings based on time + current page
   - Virtual keyboard detection for mobile
   - Safe-area-inset support for iOS notch
   - Touch-friendly 44px tap targets
   - Body scroll lock on mobile when open
   ============================================================ */

/* ── Tool search + action helpers ────────────────────────── */

function findToolByQuery(query: string): FlatTool | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  const all = getAllToolsFlat();
  const exact = all.find((t) => t.id === q);
  if (exact) return exact;
  const nameExact = all.find((t) => t.name.toLowerCase() === q);
  if (nameExact) return nameExact;
  const results = searchTools(q);
  return results[0] ?? null;
}

function getToolPath(tool: FlatTool): string {
  return `/tools/${tool.categoryId}/${tool.id}`;
}

function getCategoryTools(categoryId: string): string {
  const cat = toolCategories.find(
    (c) => c.id === categoryId || c.name.toLowerCase().includes(categoryId.toLowerCase())
  );
  if (!cat) return "Category not found. Try **/tools** to see all categories!";
  const tools = cat.tools
    .map(
      (t) =>
        `- **${t.name}** ${t.status === "ready" ? "✅" : t.status === "beta" ? "🧪" : "🔜"}`
    )
    .join("\n");
  return `## ${cat.name} (${cat.tools.length} tools)\n\n${tools}`;
}

function getToolDetails(tool: FlatTool): string {
  const parts: string[] = [];
  parts.push(`## ${tool.name}\n`);
  parts.push(`${tool.description}\n`);
  parts.push(`- **Category:** ${tool.categoryName}`);
  parts.push(
    `- **Status:** ${tool.status === "ready" ? "✅ Ready" : tool.status === "beta" ? "🧪 Beta" : "🔜 Coming Soon"}`
  );
  if (tool.aiProviders?.length) {
    parts.push(`- **AI Providers:** ${tool.aiProviders.join(", ")}`);
  }
  if (tool.outputs?.length) {
    parts.push(
      `- **Export Formats:** ${tool.outputs.join(", ").toUpperCase()}`
    );
  }
  if (tool.supportsPartEdit) {
    parts.push("- **Part-Edit:** ✅ Edit individual elements");
  }
  if (tool.printReady) {
    parts.push(
      `- **Print-Ready:** ✅${tool.printSizes?.length ? ` (${tool.printSizes.join(", ")})` : ""}`
    );
  }
  parts.push(`\n👉 Type **/navigate ${tool.id}** to go there now!`);
  return parts.join("\n");
}

/* ── Quick suggestion chips based on context ─────────────── */

function getContextSuggestions(
  pageType: string,
  toolId?: string,
  categoryId?: string
): { label: string; message: string; emoji?: string }[] {
  if (pageType === "tool" && toolId) {
    const toolName = toolId.replace(/-/g, " ");
    return [
      { label: "How to use this?", message: `How do I use the ${toolName} tool?`, emoji: "❓" },
      { label: "Pro tips", message: `What are some pro tips for ${toolName}?`, emoji: "💡" },
      { label: "Similar tools", message: `What tools are similar to ${toolName}?`, emoji: "🔄" },
      { label: "Export options", message: `What export formats does ${toolName} support?`, emoji: "📤" },
    ];
  }
  if (categoryId) {
    return [
      { label: "Show all tools", message: `/category ${categoryId}`, emoji: "📋" },
      { label: "Recommend a tool", message: `What's the best tool in ${categoryId} for a beginner?`, emoji: "⭐" },
      { label: "Create something", message: "Help me create something amazing", emoji: "✨" },
      { label: "All categories", message: "/tools", emoji: "🗂️" },
    ];
  }
  if (pageType === "dashboard") {
    return [
      { label: "Create a logo", message: "I want to create a professional logo", emoji: "🎨" },
      { label: "Build a resume", message: "Help me build an amazing resume", emoji: "📄" },
      { label: "Browse tools", message: "/tools", emoji: "🔍" },
      { label: "Get inspired", message: "Give me creative project ideas", emoji: "💡" },
    ];
  }
  return [
    { label: "What can you do?", message: "What can you help me with?", emoji: "🤔" },
    { label: "Browse tools", message: "/tools", emoji: "🔍" },
    { label: "Quick help", message: "/help", emoji: "🙋" },
    { label: "Navigate me", message: "Take me to the most popular tools", emoji: "🧭" },
  ];
}

/* ── Simple markdown renderer ────────────────────────────── */

function renderMessageContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let listType: "ul" | "ol" = "ul";

  const processInline = (text: string, key: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let partKey = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

      type MatchInfo = { index: number; length: number; node: React.ReactNode };
      const candidates: MatchInfo[] = [];

      if (boldMatch && boldMatch.index !== undefined) {
        candidates.push({
          index: boldMatch.index,
          length: boldMatch[0].length,
          node: (
            <strong key={`${key}-b${partKey}`} className="font-semibold text-white">
              {boldMatch[1]}
            </strong>
          ),
        });
      }
      if (codeMatch && codeMatch.index !== undefined) {
        candidates.push({
          index: codeMatch.index,
          length: codeMatch[0].length,
          node: (
            <code
              key={`${key}-c${partKey}`}
              className="rounded bg-gray-700/50 px-1.5 py-0.5 font-mono text-xs text-primary-400"
            >
              {codeMatch[1]}
            </code>
          ),
        });
      }
      if (linkMatch && linkMatch.index !== undefined) {
        candidates.push({
          index: linkMatch.index,
          length: linkMatch[0].length,
          node: (
            <a
              key={`${key}-a${partKey}`}
              href={/^(https?:\/\/|\/)/i.test(linkMatch[2]) ? linkMatch[2] : '#'}
              rel="noopener noreferrer"
              className="text-primary-400 underline decoration-primary-500/30 hover:decoration-primary-400"
            >
              {linkMatch[1]}
            </a>
          ),
        });
      }

      candidates.sort((a, b) => a.index - b.index);
      const firstMatch = candidates[0] ?? null;

      if (firstMatch) {
        if (firstMatch.index > 0) parts.push(remaining.slice(0, firstMatch.index));
        parts.push(firstMatch.node);
        remaining = remaining.slice(firstMatch.index + firstMatch.length);
        partKey++;
      } else {
        parts.push(remaining);
        remaining = "";
      }
    }
    return <>{parts}</>;
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const Tag = listType;
      elements.push(
        <Tag
          key={`list-${elements.length}`}
          className={cn(
            "my-1.5 space-y-0.5",
            Tag === "ol" ? "ml-5 list-decimal" : "ml-4 list-disc"
          )}
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-[13px] leading-relaxed text-gray-300 sm:text-sm">
              {processInline(item, `li-${elements.length}-${i}`)}
            </li>
          ))}
        </Tag>
      );
      listItems = [];
    }
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) { flushList(); listType = "ol"; }
      inList = true;
      listItems.push(trimmed.replace(/^\d+\.\s/, ""));
      continue;
    }
    if (/^[-*•]\s/.test(trimmed)) {
      if (!inList) { listType = "ul"; }
      inList = true;
      listItems.push(trimmed.replace(/^[-*•]\s/, ""));
      continue;
    }
    if (inList) flushList();

    if (!trimmed) {
      elements.push(<div key={`br-${i}`} className="h-1.5" />);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h-${i}`} className="mt-2 mb-1 text-[13px] font-bold text-primary-400 sm:text-sm">
          {trimmed.slice(3)}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("👉")) {
      elements.push(
        <p key={`cta-${i}`} className="mt-1.5 text-[13px] font-medium text-primary-300 sm:text-sm">
          {processInline(trimmed, `cta-${i}`)}
        </p>
      );
      continue;
    }
    elements.push(
      <p key={`p-${i}`} className="text-[13px] leading-relaxed text-gray-200 sm:text-sm">
        {processInline(trimmed, `p-${i}`)}
      </p>
    );
  }
  if (inList) flushList();
  return <div className="space-y-0.5">{elements}</div>;
}

/* ── Main Component ──────────────────────────────────────── */

export function ChikoAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    isOpen,
    isGenerating,
    messages,
    inputDraft,
    context,
    hasGreeted,
    close,
    minimize,
    setIsGenerating,
    setInputDraft,
    setContext,
    addMessage,
    updateLastAssistantMessage,
    appendToLastAssistantMessage,
    setHasGreeted,
    clearMessages,
  } = useChikoStore();

  const [slashResults, setSlashResults] = useState<{ label: string; path: string }[]>([]);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [chikoExpression, setChikoExpression] = useState<ChikoExpression>("idle");
  const [pendingAction, setPendingAction] = useState<{ action: string; params: Record<string, unknown> } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Abort in-flight stream when panel closes ─────────────
  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [isOpen]);

  // ── Detect virtual keyboard (mobile) ─────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const check = () => setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    vv.addEventListener("resize", check);
    return () => vv.removeEventListener("resize", check);
  }, []);

  // ── Update context on route change ───────────────────────
  useEffect(() => {
    const pathParts = pathname.split("/").filter(Boolean);
    let pageType: "dashboard" | "tool" | "other" = "other";
    let currentToolId: string | undefined;
    let currentCategoryId: string | undefined;

    if (pathname === "/dashboard" || pathname === "/") {
      pageType = "dashboard";
    } else if (pathParts[0] === "tools" && pathParts.length >= 3) {
      pageType = "tool";
      currentCategoryId = pathParts[1];
      currentToolId = pathParts[2];
    }

    setContext({ currentPath: pathname, pageType, currentToolId, currentCategoryId });
  }, [pathname, setContext]);

  // ── Auto-greet on first open ─────────────────────────────
  useEffect(() => {
    if (isOpen && !hasGreeted && messages.length === 0) {
      addMessage({ role: "assistant", content: getGreeting(context) });
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted, messages.length, context, addMessage, setHasGreeted]);

  // ── Scroll to bottom ────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Focus input when opened ──────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // ── Lock body scroll on mobile when open ─────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 640) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Track Chiko's expression based on state ──────────────
  useEffect(() => {
    if (isGenerating) {
      setChikoExpression("thinking");
    } else if (messages.length === 0) {
      setChikoExpression("greeting");
    } else {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant" && lastMsg.content) {
        // Brief happy expression after responding
        setChikoExpression("happy");
        const timer = setTimeout(() => setChikoExpression("idle"), 2000);
        return () => clearTimeout(timer);
      }
      setChikoExpression("listening");
    }
  }, [isGenerating, messages]);

  // ── Slash command autocomplete ───────────────────────────
  useEffect(() => {
    const draft = inputDraft.toLowerCase();
    if (/^\/(navigate|go|open)\s/.test(draft)) {
      const q = inputDraft.replace(/^\/(navigate|go|open)\s+/i, "").trim();
      if (q.length > 1) {
        setSlashResults(
          searchTools(q).slice(0, 5).map((t) => ({
            label: t.name,
            path: `/tools/${t.categoryId}/${t.id}`,
          }))
        );
      } else {
        setSlashResults([]);
      }
    } else {
      setSlashResults([]);
    }
  }, [inputDraft]);

  /* ── Handle local slash commands & tool actions ─────────── */
  const handleLocalCommand = useCallback(
    (text: string): boolean => {
      const lower = text.toLowerCase().trim();

      // /navigate, /go, /open — smart navigation
      if (/^\/(navigate|go|open)\s/.test(lower)) {
        const q = text.replace(/^\/(navigate|go|open)\s+/i, "").trim();
        const tool = findToolByQuery(q);
        if (tool) {
          addMessage({ role: "user", content: text });
          addMessage({ role: "assistant", content: `Taking you to **${tool.name}**! 🚀` });
          setTimeout(() => router.push(getToolPath(tool)), 500);
          return true;
        }
        const cat = toolCategories.find(
          (c) => c.id === q.toLowerCase() || c.name.toLowerCase().includes(q.toLowerCase())
        );
        if (cat) {
          addMessage({ role: "user", content: text });
          addMessage({ role: "assistant", content: `Here's **${cat.name}**:\n\n${getCategoryTools(cat.id)}` });
          return true;
        }
        addMessage({ role: "user", content: text });
        addMessage({ role: "assistant", content: `Hmm, I couldn't find "${q}" 🤔 Try a different name, or type **/tools** to see everything!` });
        return true;
      }

      // /tools — show all categories overview
      if (lower === "/tools" || lower === "/browse") {
        addMessage({ role: "user", content: text });
        const overview = toolCategories
          .map((c) => `**${c.name}** (${c.tools.length} tools) — ${c.description.slice(0, 80)}...`)
          .join("\n");
        const total = toolCategories.reduce((a, c) => a + c.tools.length, 0);
        addMessage({
          role: "assistant",
          content: `Here are all **${total} tools** across **${toolCategories.length} categories**! 📦\n\n${overview}\n\n💡 Type **/navigate [tool name]** to jump to any tool, or ask me what tool is best for your project!`,
        });
        return true;
      }

      // /category [id]
      if (lower.startsWith("/category ")) {
        const catId = text.slice(10).trim();
        addMessage({ role: "user", content: text });
        addMessage({ role: "assistant", content: getCategoryTools(catId) });
        return true;
      }

      // /details [tool] or /info [tool]
      if (/^\/(details|info)\s/.test(lower)) {
        const q = text.replace(/^\/(details|info)\s+/i, "").trim();
        const tool = findToolByQuery(q);
        addMessage({ role: "user", content: text });
        if (tool) {
          addMessage({ role: "assistant", content: getToolDetails(tool) });
        } else {
          addMessage({ role: "assistant", content: `I couldn't find a tool called "${q}". Try **/tools** to browse!` });
        }
        return true;
      }

      // /search [query] or /find [query]
      if (/^\/(search|find)\s/.test(lower)) {
        const q = text.replace(/^\/(search|find)\s+/i, "").trim();
        const results = searchTools(q).slice(0, 8);
        addMessage({ role: "user", content: text });
        if (results.length > 0) {
          const list = results
            .map((t) => `- **${t.name}** ${t.status === "ready" ? "✅" : t.status === "beta" ? "🧪" : "🔜"} — ${t.description.slice(0, 60)}...`)
            .join("\n");
          addMessage({
            role: "assistant",
            content: `Found **${results.length} tool${results.length > 1 ? "s" : ""}** matching "${q}" 🔍\n\n${list}\n\n👉 Type **/navigate [name]** to go to any of these!`,
          });
        } else {
          addMessage({ role: "assistant", content: `No tools found for "${q}" 😕 Try different keywords, or type **/tools** to browse categories!` });
        }
        return true;
      }

      // /create [type] — smart tool launcher
      if (lower.startsWith("/create ")) {
        const what = text.replace(/^\/create\s+/i, "").trim();
        const matchMap: Record<string, string> = {
          logo: "logo-generator",
          resume: "resume-cv",
          cv: "resume-cv",
          card: "business-card",
          "business card": "business-card",
          post: "social-media-post",
          video: "video-editor",
          presentation: "presentation",
          invoice: "invoice-designer",
          flyer: "flyer",
          poster: "poster",
          brochure: "brochure",
          infographic: "infographic",
          certificate: "certificate",
        };
        const toolId = matchMap[what.toLowerCase()];
        if (toolId) {
          const tool = getAllToolsFlat().find((t) => t.id === toolId);
          if (tool) {
            addMessage({ role: "user", content: text });
            addMessage({ role: "assistant", content: `Let's create a ${what}! 🎨 Taking you to **${tool.name}**...` });
            setTimeout(() => router.push(getToolPath(tool)), 500);
            return true;
          }
        }
        const found = findToolByQuery(what);
        if (found) {
          addMessage({ role: "user", content: text });
          addMessage({ role: "assistant", content: `I think **${found.name}** is perfect for that! 🚀 Let me take you there...` });
          setTimeout(() => router.push(getToolPath(found)), 500);
          return true;
        }
        return false; // Let AI handle it
      }

      // /theme
      if (lower === "/theme" || lower === "/dark" || lower === "/light") {
        addMessage({ role: "user", content: text });
        toggleTheme();
        addMessage({ role: "assistant", content: "Toggled your theme! 🌓 Looking good!" });
        return true;
      }

      // /shortcuts
      if (lower === "/shortcuts" || lower === "/keys") {
        addMessage({ role: "user", content: text });
        addMessage({
          role: "assistant",
          content: "## Keyboard Shortcuts ⌨️\n\n- **Ctrl+K** — Command Palette (search everything)\n- **Ctrl+.** — Summon/dismiss Chiko\n- **Ctrl+/** — Toggle dark/light mode\n- **Ctrl+B** — Toggle sidebar\n- **Ctrl+H** — Go to Dashboard\n- **?** — Show shortcuts help overlay\n- **Esc** — Close any overlay\n\n💡 On mobile, I'm always one tap away in the corner!",
        });
        return true;
      }

      // /help
      if (lower === "/help") {
        addMessage({ role: "user", content: text });
        addMessage({
          role: "assistant",
          content: "## How I Can Help 🙋‍♂️\n\n- **/tools** — Browse all tools across 8 categories\n- **/navigate [tool]** — Jump to any tool instantly\n- **/search [query]** — Search tools by keyword\n- **/details [tool]** — Get full details about a tool\n- **/category [name]** — List all tools in a category\n- **/create [type]** — Quick-launch a creative tool\n- **/shortcuts** — Keyboard shortcuts\n- **/theme** — Toggle dark/light mode\n\n**Or just ask me naturally!** Tell me what you want to create and I'll find the perfect tool. I can also brainstorm ideas, explain features, suggest workflows, and write copy. Try it! ✨",
        });
        return true;
      }

      // /dashboard or /home
      if (lower === "/dashboard" || lower === "/home") {
        addMessage({ role: "user", content: text });
        addMessage({ role: "assistant", content: "Taking you home! 🏠" });
        setTimeout(() => router.push("/dashboard"), 400);
        return true;
      }

      return false;
    },
    [addMessage, router, toggleTheme]
  );

  /* ── Execute a Chiko action from the stream ───────────── */
  const executeChikoAction = useCallback(
    (actionStr: string, params: Record<string, unknown>) => {
      // actionStr format: "tool_id__actionName"
      const sep = actionStr.indexOf("__");
      if (sep === -1) return { success: false, message: `Invalid action format: ${actionStr}` };
      const toolIdRaw = actionStr.slice(0, sep);
      const actionName = actionStr.slice(sep + 2);
      // Convert underscored tool ID back to kebab-case
      const toolId = toolIdRaw.replace(/_/g, "-");
      const registry = useChikoActionRegistry.getState();
      return registry.execute(toolId, actionName, params);
    },
    []
  );

  /* ── Send message ──────────────────────────────────────── */
  const sendMessage = useCallback(
    async (content?: string) => {
      const text = (content || inputDraft).trim();
      if (!text || isGenerating) return;

      setInputDraft("");
      setSlashResults([]);
      if (inputRef.current) inputRef.current.style.height = "auto";

      // Try local command first
      if (text.startsWith("/")) {
        if (handleLocalCommand(text)) return;
      }

      // Smart detection: "take me to X" / "go to X" / "open X"
      const navMatch = text.match(
        /^(?:take me to|go to|open|launch|start|navigate to|show me)\s+(.+)/i
      );
      if (navMatch) {
        const q = navMatch[1].trim();
        const tool = findToolByQuery(q);
        if (tool) {
          addMessage({ role: "user", content: text });
          addMessage({ role: "assistant", content: `On it! Taking you to **${tool.name}**! 🚀` });
          setTimeout(() => router.push(getToolPath(tool)), 500);
          return;
        }
      }

      // Regular message — send to API
      addMessage({ role: "user", content: text });
      addMessage({ role: "assistant", content: "" });
      setIsGenerating(true);

      // Abort any existing stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Limit to last 20 messages for API to reduce payload/token usage
        const recentMessages = messages
          .filter((m) => m.role !== "system")
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content }));

        const apiMessages = [
          ...recentMessages,
          { role: "user", content: text },
        ];

        // Get action descriptors and tool state from the registry
        const registry = useChikoActionRegistry.getState();
        const actionDescriptors = registry.getActionDescriptorsForAI();
        const hasTools = actionDescriptors.length > 0;

        // Build tool state from all registered manifests
        let toolState: Record<string, unknown> | undefined;
        if (hasTools) {
          const state: Record<string, unknown> = {};
          for (const [toolId] of registry.manifests) {
            const ts = registry.readState(toolId);
            if (ts) state[toolId] = ts;
          }
          toolState = state;
        }

        const response = await fetch("/api/chiko", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            context,
            ...(hasTools ? { actions: actionDescriptors, toolState } : {}),
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await response.json();
          if (data.fallback) {
            updateLastAssistantMessage(data.content);
            setIsGenerating(false);
            return;
          }
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        const executedActions: { action: string; params: Record<string, unknown>; success: boolean }[] = [];
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          // Process buffer for action events vs text
          const parts = textBuffer.split("__CHIKO_ACTION__:");
          // First part is always text
          if (parts[0]) {
            appendToLastAssistantMessage(parts[0]);
          }

          // Process any action events (all parts after the first are action JSON + trailing text)
          for (let i = 1; i < parts.length; i++) {
            const newlineIdx = parts[i].indexOf("\n");
            if (newlineIdx === -1) {
              // Incomplete action event — reconstruct remaining buffer including any subsequent parts
              const remaining = parts.slice(i).join("__CHIKO_ACTION__:");
              textBuffer = "__CHIKO_ACTION__:" + remaining;
              break;
            }
            const jsonStr = parts[i].slice(0, newlineIdx);
            const trailing = parts[i].slice(newlineIdx + 1);

            try {
              const actionEvent = JSON.parse(jsonStr) as {
                __chiko_action__: boolean;
                action: string;
                params: Record<string, unknown>;
              };

              // Check if action is destructive before executing
              const sep = actionEvent.action.indexOf("__");
              if (sep !== -1) {
                const toolIdRaw = actionEvent.action.slice(0, sep);
                const actionName = actionEvent.action.slice(sep + 2);
                const toolId = toolIdRaw.replace(/_/g, "-");
                const manifest = registry.manifests.get(toolId);
                const descriptor = manifest?.actions.find((a) => a.name === actionName);

                if (descriptor?.destructive) {
                  // Queue destructive action for confirmation
                  setPendingAction({ action: actionEvent.action, params: actionEvent.params });
                  appendToLastAssistantMessage(
                    `\n\n⚠️ **This action is destructive** (${descriptor.description}). Please confirm or cancel below.`
                  );
                } else {
                  // Execute immediately
                  const result = executeChikoAction(actionEvent.action, actionEvent.params);
                  executedActions.push({
                    action: actionEvent.action,
                    params: actionEvent.params,
                    success: result.success,
                  });
                  if (result.success) {
                    appendToLastAssistantMessage(`\n✅ ${result.message}`);
                  } else {
                    appendToLastAssistantMessage(`\n❌ ${result.message}`);
                  }
                }
              } else {
                console.warn("[Chiko] Invalid action format (missing __):", actionEvent.action);
              }
            } catch (parseErr) {
              console.warn("[Chiko] Failed to parse action JSON:", jsonStr, parseErr);
            }

            // Append any trailing text after the action event
            if (trailing) {
              appendToLastAssistantMessage(trailing);
            }

            // Clear buffer since we've processed this part
            if (i === parts.length - 1) {
              textBuffer = "";
            }
          }

          // If only one part (no action events), clear the buffer
          if (parts.length === 1) {
            textBuffer = "";
          }
        }

        // Store executed actions on the message
        if (executedActions.length > 0) {
          const store = useChikoStore.getState();
          const msgs = store.messages;
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.role === "assistant") {
            // Update the last assistant message with executedActions
            useChikoStore.setState({
              messages: msgs.map((m, idx) =>
                idx === msgs.length - 1
                  ? { ...m, executedActions }
                  : m
              ),
            });
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Intentional abort — no error message needed
          return;
        }
        console.error("Chiko message error:", error);
        updateLastAssistantMessage(
          "Oops, something went sideways! 😅 Give me another try?"
        );
      } finally {
        abortRef.current = null;
        setIsGenerating(false);
      }
    },
    [
      inputDraft,
      isGenerating,
      messages,
      context,
      router,
      handleLocalCommand,
      setInputDraft,
      addMessage,
      updateLastAssistantMessage,
      appendToLastAssistantMessage,
      setIsGenerating,
      executeChikoAction,
    ]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const suggestions = useMemo(
    () => getContextSuggestions(context.pageType, context.currentToolId, context.currentCategoryId),
    [context]
  );

  const handleNavigate = useCallback(
    (path: string, label: string) => {
      setInputDraft("");
      setSlashResults([]);
      addMessage({ role: "user", content: `/navigate ${label}` });
      addMessage({ role: "assistant", content: `Taking you to **${label}**! 🚀` });
      setTimeout(() => router.push(path), 500);
    },
    [router, setInputDraft, addMessage]
  );

  /* ── Render ────────────────────────────────────────────── */

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Mobile backdrop overlay ─────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-89 bg-black/50 backdrop-blur-sm sm:hidden"
            onClick={close}
          />

          {/* ── Panel ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "fixed z-90 flex flex-col",
              "border border-gray-700/60 bg-gray-900/98 shadow-2xl shadow-black/50",
              "backdrop-blur-xl",
              // ── Mobile: full-screen ──
              "inset-0 rounded-none",
              // ── sm+: floating panel bottom-right ──
              "sm:inset-auto sm:bottom-6 sm:right-6 sm:rounded-2xl",
              "sm:h-[min(640px,85vh)] sm:w-105",
              // ── lg+: slightly bigger ──
              "lg:h-[min(700px,85vh)] lg:w-110"
            )}
            style={{
              paddingBottom: keyboardOpen ? "0px" : "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* ── Header ──────────────────────────────── */}
            <div className="flex shrink-0 items-center gap-3 border-b border-gray-700/50 px-4 py-3">
              <Chiko3DAvatar size="sm" animated expression={chikoExpression} showGlow={false} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">Chiko</h2>
                  <span className="hidden rounded-full bg-secondary-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-400 sm:inline-flex">
                    AI Assistant
                  </span>
                  {isGenerating && (
                    <motion.div
                      className="h-1.5 w-1.5 rounded-full bg-secondary-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
                <p className="truncate text-xs text-gray-400">
                  {isGenerating ? "Thinking..." : "Your personal creative companion"}
                </p>
              </div>

              {/* Action buttons — 44px touch targets on mobile */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={clearMessages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300 active:bg-gray-700"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
                <button
                  onClick={minimize}
                  className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300 sm:flex"
                  title="Minimize"
                  aria-label="Minimize Chiko"
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="12" x2="12" y2="12" />
                  </svg>
                </button>
                <button
                  onClick={close}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-800 hover:text-red-400 active:bg-gray-700"
                  title="Close"
                  aria-label="Close Chiko"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Messages ────────────────────────────── */}
            <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth px-3 py-3 sm:px-4 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar]:w-1.5" role="log" aria-live="polite" aria-label="Chat messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "mb-3 flex gap-2",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="mt-0.5 shrink-0">
                      <Chiko3DAvatar size="xs" animated={false} showGlow={false} />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3.5 py-2.5 sm:max-w-[85%] sm:px-4",
                      msg.role === "user"
                        ? "rounded-br-md bg-primary-600/20 text-[13px] text-primary-100 sm:text-sm"
                        : "rounded-bl-md bg-gray-800/60 text-[13px] text-gray-200 sm:text-sm"
                    )}
                  >
                    {msg.role === "assistant" && msg.content ? (
                      renderMessageContent(msg.content)
                    ) : msg.role === "user" ? (
                      <p className="text-[13px] leading-relaxed sm:text-sm">{msg.content}</p>
                    ) : null}

                    {msg.role === "assistant" && !msg.content && isGenerating && (
                      <div className="flex items-center gap-1.5 py-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-primary-500"
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Quick Suggestions ──────────────────── */}
            {messages.length <= 1 && !isGenerating && (
              <div className="shrink-0 border-t border-gray-700/30 px-3 py-2.5 sm:px-4">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                  Quick Actions
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.message)}
                      className={cn(
                        "group flex items-center gap-1.5 rounded-xl border border-gray-700/40 bg-gray-800/30 px-3 py-2.5 text-left transition-all",
                        "text-xs text-gray-300",
                        "hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300",
                        "active:scale-[0.97] active:bg-primary-500/15",
                        // Mobile: taller tap targets
                        "min-h-11 sm:min-h-0 sm:rounded-full sm:py-1.5"
                      )}
                    >
                      {s.emoji && <span className="text-sm sm:text-xs">{s.emoji}</span>}
                      <span className="flex-1 truncate">{s.label}</span>
                      <IconArrowRight className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Slash autocomplete results ──────────── */}
            <AnimatePresence>
              {slashResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="shrink-0 border-t border-gray-700/30 px-3 py-2"
                >
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                    Navigate to...
                  </p>
                  {slashResults.map((r) => (
                    <button
                      key={r.path}
                      onClick={() => handleNavigate(r.path, r.label)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] text-gray-300 transition-colors hover:bg-gray-800 hover:text-white active:bg-gray-700 sm:py-2 sm:text-sm"
                    >
                      <IconArrowRight className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                      <span className="flex-1 truncate">{r.label}</span>
                      <span className="hidden text-xs text-gray-600 sm:inline">{r.path}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Destructive Action Confirmation ────── */}
            {pendingAction && (
              <div className="shrink-0 border-t border-warning-500/30 bg-warning-500/10 px-3 py-2.5 sm:px-4">
                <p className="mb-2 text-xs font-medium text-warning-400">
                  Confirm destructive action?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const result = executeChikoAction(pendingAction.action, pendingAction.params);
                      appendToLastAssistantMessage(
                        result.success
                          ? `\n✅ ${result.message}`
                          : `\n❌ ${result.message}`
                      );
                      setPendingAction(null);
                    }}
                    className="rounded-lg bg-error-500/20 px-3 py-1.5 text-xs font-medium text-error-400 transition-colors hover:bg-error-500/30"
                  >
                    Yes, do it
                  </button>
                  <button
                    onClick={() => {
                      appendToLastAssistantMessage("\n🚫 Action cancelled.");
                      setPendingAction(null);
                    }}
                    className="rounded-lg bg-gray-700/40 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700/60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Input ───────────────────────────────── */}
            <div
              className="shrink-0 border-t border-gray-700/50 p-3"
              style={{ paddingBottom: keyboardOpen ? "8px" : undefined }}
            >
              <div className="flex items-end gap-2 rounded-xl border border-gray-700/50 bg-gray-800/40 px-3 py-2 transition-colors focus-within:border-primary-500/40 focus-within:ring-1 focus-within:ring-primary-500/20">
                <IconSparkles className="mb-0.5 h-4 w-4 shrink-0 text-primary-500/60" />
                <textarea
                  ref={inputRef}
                  value={inputDraft}
                  onChange={(e) => {
                    setInputDraft(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything... (/help for commands)"
                  disabled={isGenerating}
                  rows={1}
                  className="max-h-25 flex-1 resize-none bg-transparent text-sm text-white placeholder-gray-500 outline-none disabled:opacity-50"
                  aria-label="Message Chiko"
                  style={{ fontSize: "16px" }}
                  enterKeyHint="send"
                  autoComplete="off"
                  autoCorrect="off"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputDraft.trim() || isGenerating}
                  className={cn(
                    "mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                    "bg-primary-500 text-gray-950",
                    "hover:bg-primary-400 active:scale-90",
                    "disabled:opacity-30 disabled:hover:bg-primary-500"
                  )}
                  aria-label="Send message"
                >
                  <IconSend className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-between px-1">
                <span className="text-[10px] text-gray-600">
                  <span className="hidden sm:inline">Ctrl+. to toggle · </span>
                  Shift+Enter for newline
                </span>
                <span className="text-[10px] text-gray-600">
                  Powered by AI ✨
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Context-aware greeting ──────────────────────────────── */

function getGreeting(context: {
  pageType: string;
  currentToolId?: string;
  currentCategoryId?: string;
}): string {
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (context.pageType === "tool" && context.currentToolId) {
    const toolName = context.currentToolId
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return `${timeGreeting}! 👋 I see you're working with **${toolName}** — great choice!\n\nI can help you:\n- Get started with a walkthrough\n- Share pro tips and best practices\n- Find similar or complementary tools\n- Troubleshoot any issues\n\nWhat would you like to do?`;
  }

  if (context.pageType === "dashboard") {
    const total = toolCategories.reduce((a, c) => a + c.tools.length, 0);
    return `${timeGreeting}! 👋 I'm **Chiko**, your personal creative assistant!\n\nI know every single one of DMSuite's **${total} tools** across ${toolCategories.length} categories. I can:\n- 🧭 Navigate you to any tool instantly\n- 💡 Brainstorm creative ideas\n- ✍️ Help write copy and content\n- 🎓 Explain any feature in detail\n\nWhat are we building today? 🚀`;
  }

  return `Hey there! 👋 I'm **Chiko**, your DMSuite assistant!\n\nTell me what you want to create, or try:\n- **/tools** — Browse all tools\n- **/navigate [tool]** — Jump to any tool\n- **/create [type]** — Start creating!\n- **/help** — See all my commands`;
}
