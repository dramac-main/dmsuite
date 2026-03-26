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
import { useBusinessMemory } from "@/stores/business-memory";
import { useChikoWorkflows } from "@/stores/chiko-workflows";
import { describeProfileForAI } from "@/lib/chiko/field-mapper";
import { extractDominantColors } from "@/lib/color-extractor";
import { createBusinessMemoryManifest, createWorkflowManifest } from "@/lib/chiko/manifests";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
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
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { MicButton, VoiceRecordingOverlay } from "./VoiceInput";
import type { ChikoFileAttachment } from "@/stores/chiko";
import type { ExtractedFileData } from "@/lib/chiko/extractors";
import {
  searchTools,
  toolCategories,
  getAllToolsFlat,
  type FlatTool,
} from "@/data/tools";

/* ── File upload constants ─────────────────────────────── */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
];
const ACCEPT_STRING = ALLOWED_TYPES.join(",");

/* ── Website scan helpers ──────────────────────────────── */
/** Detect if user message implies Chiko should fetch info from a URL */
const WEBSITE_SCAN_INTENT = /\b(?:scan|check|get|scrape|fetch|read|pull|extract|look\s*(?:at|up)|visit|analyze|use|grab)\b.*\b(?:website|site|web\s*page|url|link|page|details?|info(?:rmation)?|data|content)\b|\b(?:website|site|web\s*page|url|link|page|details?|info(?:rmation)?)\b.*\b(?:scan|check|get|scrape|fetch|read|pull|extract|look|visit|analyze|use|grab|from)\b|(?:from|off|on|at)\s+(?:my|our|the|this|their)?\s*(?:website|site|page)?\s*(?:https?:\/\/|[a-z0-9-]+\.(?:com|org|net|io|co|app|dev|zm|za))|(?:get|grab|pull|use|fetch)\s+(?:the\s+)?(?:details?|info(?:rmation)?|data|content)\s+(?:from|off|on|at)|(?:details?|info(?:rmation)?)\s+from/i;

/** Extract the first plausible URL from a message */
function extractUrlFromMessage(text: string): string | null {
  // Match explicit URLs (with protocol)
  const explicitUrl = text.match(/https?:\/\/[^\s<>"'`,;)}\]]+/i);
  if (explicitUrl) return explicitUrl[0];

  // Match domain patterns like example.com, my-site.co.zm, dramacagency.com
  const domainPattern = text.match(/\b([a-zA-Z0-9][-a-zA-Z0-9]*\.(?:com|org|net|io|co|co\.\w{2,3}|app|dev|me|info|biz|store|shop|online|site|tech|agency|studio|design|zm|za|ke|ug|tz|ng|uk|us|ca|au|in|de|fr)(?:\/[^\s<>"'`,;)}\]]*)?)\b/i);
  if (domainPattern) return domainPattern[1];

  return null;
}

/** Check if a user message is a website scan request */
function isWebsiteScanRequest(text: string): boolean {
  const url = extractUrlFromMessage(text);
  if (!url) return false;
  // If an explicit intent phrase is present, always scan
  if (WEBSITE_SCAN_INTENT.test(text)) return true;
  // If a bare domain/URL appears alongside action verbs like "create", "make", "build",
  // "design", "prepare", or "check/scan/look at" — the user wants Chiko to use the site
  if (/\b(?:create|make|build|design|prepare|generate|draft|write|fill|populate|use|check|scan|look|visit|analyze)\b/i.test(text)) return true;
  return false;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("wordprocessingml") || mimeType.includes("msword")) return "📝";
  if (mimeType.includes("spreadsheetml") || mimeType.includes("ms-excel")) return "📊";
  return "📎";
}

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

/** Supported media types for Claude vision API */
const VISION_SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

/** Check if user message is about logo colors / brand colors */
function isLogoColorQuery(text: string): boolean {
  return /\b(match|logo|brand)\b.*\b(color|colour|accent|theme|palette)\b|\b(color|colour|accent|theme|palette)\b.*\b(match|logo|brand)\b|match.*logo|logo.*color|brand.*color|color.*logo|color.*brand/i.test(text);
}

/**
 * Get the logo data URI from the active tool's store.
 * We read the store directly because manifests strip logoUrl from state.
 */
function getActiveToolLogoUri(currentToolId?: string): string | undefined {
  try {
    if (currentToolId === "invoice-designer") {
      const { invoice } = useInvoiceEditor.getState();
      return invoice.businessInfo.logoUrl || undefined;
    }
    if (currentToolId === "invoice-designer" || currentToolId === "quote-estimate" || currentToolId === "receipt-designer" || currentToolId === "purchase-order" || currentToolId === "delivery-note" || currentToolId === "credit-note" || currentToolId === "proforma-invoice") {
      const { form } = useSalesBookEditor.getState();
      return form.companyBranding.logoUrl || undefined;
    }
  } catch {
    // Store not available
  }
  return undefined;
}

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
    attachments,
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
    addAttachment,
    updateAttachment,
    removeAttachment,
    clearAttachments,
    lastFileContext,
    setLastFileContext,
    lastWebsiteContext,
    setLastWebsiteContext,
  } = useChikoStore();

  const [slashResults, setSlashResults] = useState<{ label: string; path: string }[]>([]);
  const [websiteScanning, setWebsiteScanning] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [chikoExpression, setChikoExpression] = useState<ChikoExpression>("idle");
  const [pendingAction, setPendingAction] = useState<{ action: string; params: Record<string, unknown> } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [autoContinueCount, setAutoContinueCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Voice Input ──────────────────────────────────────────
  const voice = useVoiceInput({
    onTranscript: (text) => {
      setInputDraft(text);
      // Auto-resize textarea to fit transcript
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.height = "auto";
          inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 100)}px`;
        }
      }, 0);
    },
    onInterim: (text) => {
      // Show real-time transcript in input as preview
      setInputDraft(text);
    },
  });
  const isVoiceActive = voice.state === "listening" || voice.state === "polishing";
  const routerRef = useRef(router);
  routerRef.current = router;

  /** Stashed intent after navigateToTool — triggers follow-up when target manifest registers */
  const pendingNavigationRef = useRef<{ targetToolId: string; userIntent: string } | null>(null);

  /** Tracks which workflow step was last prompted to prevent infinite re-prompting */
  const lastPromptedStepRef = useRef<string | null>(null);

  // ── Abort in-flight stream when panel closes ─────────────
  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [isOpen]);

  // ── Register Business Memory manifest globally (always available) ──
  useEffect(() => {
    const registry = useChikoActionRegistry.getState();
    registry.register(createBusinessMemoryManifest());
    registry.register(createWorkflowManifest(routerRef));
    // intentionally no cleanup — these global manifests are always available
  }, []);

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

  // ── Workflow auto-continue logic ──────────────────────────
  const MAX_AUTO_CONTINUE = 20;
  const workflowActive = useChikoWorkflows((s) => s.activeWorkflow);

  // Stable primitive: total executed action count (avoids unstable array reference in deps)
  const wfExecutedCount = useChikoWorkflows((s) => {
    const wf = s.activeWorkflow;
    if (!wf) return 0;
    return wf.steps.reduce((sum, step) => sum + step.actions.filter((a) => a.executed).length, 0);
  });

  useEffect(() => {
    // Always read FRESH state inside the effect to avoid stale closures
    const wf = useChikoWorkflows.getState().activeWorkflow;
    if (!wf || wf.status !== "running") return;
    if (isGenerating) return;
    if (autoContinueCount >= MAX_AUTO_CONTINUE) {
      addMessage({
        role: "assistant",
        content: "\u26a0\ufe0f Hit the auto-continue limit (20 cycles). Pausing workflow \u2014 type **/workflow resume** to continue.",
      });
      useChikoWorkflows.getState().pauseWorkflow();
      return;
    }

    const currentStep = wf.steps[wf.currentStepIndex];
    if (!currentStep) return;

    // If current step target tool is different from the current page, wait for navigation
    if (currentStep.toolId) {
      const registry = useChikoActionRegistry.getState();
      const manifest = registry.manifests.get(currentStep.toolId);
      if (!manifest) {
        // Manifest not registered yet — waiting for navigation to complete
        return;
      }
    }

    // All tracked actions on current step executed → advance to next step
    const allActionsExecuted =
      currentStep.actions.length > 0 && currentStep.actions.every((a) => a.executed);
    if (allActionsExecuted) {
      // Advance via fresh store call (not stale closure)
      const result = useChikoWorkflows.getState().advanceStep();
      lastPromptedStepRef.current = null; // Reset so next step can be prompted
      setAutoContinueCount((c) => c + 1);

      if (!result.done && result.nextStep) {
        // Read fresh state for correct step index
        const freshWf = useChikoWorkflows.getState().activeWorkflow;
        const nextIndex = freshWf ? freshWf.currentStepIndex : -1;
        const nextLabel = result.nextStep.label;
        const nextToolId = result.nextStep.toolId;
        setTimeout(() => {
          sendMessage(
            `[Auto-continue] Execute workflow step ${nextIndex + 1}: ${nextLabel}${nextToolId ? ` (on ${nextToolId})` : ""}`
          );
        }, 800);
      }
      return;
    }

    // Prompt step execution — but ONLY ONCE per step to prevent infinite re-prompting
    const stepKey = `${wf.id}-${wf.currentStepIndex}`;
    if (lastPromptedStepRef.current === stepKey) return;

    if (currentStep.status === "pending" || currentStep.status === "navigating") {
      lastPromptedStepRef.current = stepKey;
      setAutoContinueCount((c) => c + 1);
      sendMessage(
        `[Auto-continue] Execute workflow step ${wf.currentStepIndex + 1}: ${currentStep.label}${currentStep.toolId ? ` (on ${currentStep.toolId})` : ""}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    workflowActive?.status,
    workflowActive?.currentStepIndex,
    wfExecutedCount,
    isGenerating,
    autoContinueCount,
  ]);

  // ── Post-navigation continuation ─────────────────────────
  // After navigateToTool, wait for the target tool's manifest to register,
  // then auto-send a follow-up so Chiko continues working on the user's intent.
  const registeredManifests = useChikoActionRegistry((s) => s.manifests);

  useEffect(() => {
    const pending = pendingNavigationRef.current;
    if (!pending || isGenerating) return;

    const manifest = registeredManifests.get(pending.targetToolId);
    if (!manifest) return; // Not registered yet — keep waiting

    // Manifest just registered — clear the pending ref and send follow-up
    const { userIntent, targetToolId } = pending;
    pendingNavigationRef.current = null;

    const toolName = manifest.toolName || targetToolId;
    setTimeout(() => {
      sendMessage(
        `[Continue after navigation to ${toolName}] The user originally asked: "${userIntent}". I'm now on the ${toolName} workspace. Please proceed with the user's request using the available tool actions.`
      );
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registeredManifests, isGenerating]);

  // ── Track Chiko's expression based on state ──────────────
  useEffect(() => {
    if (isGenerating || websiteScanning) {
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
  }, [isGenerating, websiteScanning, messages]);

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
            pendingNavigationRef.current = { targetToolId: tool.id, userIntent: text };
            setTimeout(() => router.push(getToolPath(tool)), 500);
            return true;
          }
        }
        const found = findToolByQuery(what);
        if (found) {
          addMessage({ role: "user", content: text });
          addMessage({ role: "assistant", content: `I think **${found.name}** is perfect for that! 🚀 Let me take you there...` });
          pendingNavigationRef.current = { targetToolId: found.id, userIntent: text };
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

      // /workflow or /wf — workflow management commands
      if (/^\/(workflow|wf)\b/.test(lower)) {
        const sub = lower.replace(/^\/(workflow|wf)\s*/, "").trim();
        const wfStore = useChikoWorkflows.getState();
        addMessage({ role: "user", content: text });

        if (sub === "status" || sub === "") {
          const wf = wfStore.activeWorkflow;
          if (!wf) {
            addMessage({ role: "assistant", content: "No workflow is currently active." });
          } else {
            const completed = wf.steps.filter((s) => s.status === "completed").length;
            const lines = wf.steps.map(
              (s, i) => `${i + 1}. ${s.status === "completed" ? "✅" : s.status === "skipped" ? "⏭️" : s.status === "failed" ? "❌" : s.status === "in-progress" || s.status === "navigating" ? "🔄" : "⬜"} ${s.label} (${s.toolId})`
            );
            addMessage({
              role: "assistant",
              content: `**${wf.name}** — ${wf.status}\nStep ${wf.currentStepIndex + 1} of ${wf.steps.length} (${completed} completed)\n\n${lines.join("\n")}`,
            });
          }
          return true;
        }

        if (sub === "pause") {
          const msg = wfStore.pauseWorkflow();
          addMessage({ role: "assistant", content: msg });
          return true;
        }

        if (sub === "resume") {
          const result = wfStore.resumeWorkflow();
          addMessage({ role: "assistant", content: result.message });
          if (result.success) setAutoContinueCount(0);
          return true;
        }

        if (sub === "cancel") {
          const wf = wfStore.activeWorkflow;
          if (!wf) {
            addMessage({ role: "assistant", content: "No active workflow to cancel." });
          } else {
            const msg = wfStore.cancelWorkflow();
            addMessage({ role: "assistant", content: msg });
          }
          return true;
        }

        if (sub === "history") {
          const history = wfStore.workflowHistory;
          if (history.length === 0) {
            addMessage({ role: "assistant", content: "No workflow history yet." });
          } else {
            const lines = history.map(
              (h, i) => `${i + 1}. **${h.name}** — ${h.status} (${h.completedSteps}/${h.stepCount} steps, ${h.skippedSteps} skipped, ${h.failedSteps} failed)`
            );
            addMessage({ role: "assistant", content: `## Workflow History\n\n${lines.join("\n")}` });
          }
          return true;
        }

        addMessage({
          role: "assistant",
          content: "**Workflow commands:**\n- **/workflow status** — Current status\n- **/workflow pause** — Pause workflow\n- **/workflow resume** — Resume workflow\n- **/workflow cancel** — Cancel workflow\n- **/workflow history** — Past workflows\n\n*Tip:* Use **/wf** as a shortcut!",
        });
        return true;
      }

      return false;
    },
    [addMessage, router, toggleTheme, setAutoContinueCount]
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

      // Intercept __ATTACHED_IMAGE_N__ placeholders in params
      const readyAttachments = useChikoStore.getState().attachments.filter(
        (a) => a.status === "ready" && a.extractedData?.images?.length
      );
      const resolvedParams = { ...params };
      for (const [key, value] of Object.entries(resolvedParams)) {
        if (typeof value === "string" && /^__ATTACHED_IMAGE_\d+__$/.test(value)) {
          const idx = parseInt(value.replace(/__ATTACHED_IMAGE_(\d+)__/, "$1"), 10);
          const attachment = readyAttachments[idx];
          if (attachment?.extractedData?.images?.[0]?.dataUri) {
            resolvedParams[key] = attachment.extractedData.images[0].dataUri;
          }
        }
      }

      const registry = useChikoActionRegistry.getState();
      return registry.execute(toolId, actionName, resolvedParams);
    },
    []
  );

  /* ── File upload handler ───────────────────────────────── */
  const handleFileUpload = useCallback(
    async (file: File) => {
      // Client-side validation
      if (file.size > MAX_FILE_SIZE) {
        addMessage({
          role: "assistant",
          content: `❌ File too large (${formatFileSize(file.size)}). Maximum is 10 MB.`,
        });
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        addMessage({
          role: "assistant",
          content: `❌ Unsupported file type: ${file.type}. I accept PDF, DOCX, XLSX, PNG, JPEG, SVG, and WebP files.`,
        });
        return;
      }

      // Create pending attachment
      const id = addAttachment({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
      updateAttachment(id, { status: "uploading", progress: 30 });

      try {
        const formData = new FormData();
        formData.append("file", file);

        updateAttachment(id, { status: "uploading", progress: 60 });

        const response = await fetch("/api/chiko/upload", {
          method: "POST",
          body: formData,
        });

        // Handle auth/credit errors on upload
        if (response.status === 401) {
          updateAttachment(id, { status: "error", error: "Sign in required", progress: 0 });
          addMessage({ role: "assistant", content: "You need to be signed in to upload files. Please log in and try again." });
          return;
        }
        if (response.status === 402) {
          const { handleCreditError } = await import("@/lib/credit-error");
          updateAttachment(id, { status: "error", error: "Insufficient credits", progress: 0 });
          addMessage({ role: "assistant", content: handleCreditError() });
          return;
        }

        updateAttachment(id, { status: "processing", progress: 85 });

        const result = await response.json() as { success: boolean; data?: ExtractedFileData; error?: string };

        if (!result.success || !result.data) {
          updateAttachment(id, {
            status: "error",
            error: result.error || "Upload failed",
            progress: 0,
          });
          addMessage({
            role: "assistant",
            content: `❌ Failed to process **${file.name}**: ${result.error || "Unknown error"}`,
          });
          return;
        }

        updateAttachment(id, {
          status: "ready",
          progress: 100,
          extractedData: result.data,
          thumbnail: result.data.thumbnail,
        });
      } catch (error) {
        updateAttachment(id, {
          status: "error",
          error: "Network error — upload failed",
          progress: 0,
        });
        addMessage({
          role: "assistant",
          content: `❌ Failed to upload **${file.name}** — network error. Please try again.`,
        });
      }
    },
    [addAttachment, updateAttachment, addMessage]
  );

  /* ── Drag and drop handlers ────────────────────────────── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
      // Reset the input so the same file can be selected again
      e.target.value = "";
    },
    [handleFileUpload]
  );

  /* ── Send message ──────────────────────────────────────── */
  const sendMessage = useCallback(
    async (content?: string) => {
      const hasReadyAttachments = attachments.some((a) => a.status === "ready");
      const text = (content || inputDraft).trim() || (hasReadyAttachments ? `I've uploaded a file: ${attachments.find((a) => a.status === "ready")?.fileName}` : "");
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
          // Stash the user's intent so Chiko continues after landing on the tool
          pendingNavigationRef.current = {
            targetToolId: tool.id,
            userIntent: text,
          };
          setTimeout(() => router.push(getToolPath(tool)), 500);
          return;
        }
      }

      // Regular message — send to API
      const fileSnap = attachments
        .filter((a) => a.status === "ready")
        .map((a) => ({ fileName: a.fileName, mimeType: a.mimeType, thumbnail: a.thumbnail }));

      addMessage({ role: "user", content: text, ...(fileSnap.length > 0 ? { files: fileSnap } : {}) });

      // ── Website scan detection ──
      // If the user mentions a URL and asks to get details/scan, fetch the website first
      let freshWebsiteContext: Record<string, unknown> | undefined;
      if (isWebsiteScanRequest(text)) {
        const detectedUrl = extractUrlFromMessage(text);
        if (detectedUrl) {
          addMessage({ role: "assistant", content: "🌐 Scanning website… Hold tight, I'm reading the site now." });
          setWebsiteScanning(true);
          try {
            const fullUrl = detectedUrl.startsWith("http") ? detectedUrl : `https://${detectedUrl}`;
            const scanRes = await fetch("/api/chiko/scan-website", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: fullUrl }),
            });
            if (scanRes.status === 401) {
              updateLastAssistantMessage("You need to be signed in for me to scan websites. Please log in and try again.");
              setWebsiteScanning(false);
              return;
            }
            if (scanRes.status === 402) {
              const { handleCreditError } = await import("@/lib/credit-error");
              updateLastAssistantMessage(handleCreditError());
              setWebsiteScanning(false);
              return;
            }
            if (!scanRes.ok) {
              const errData = await scanRes.json().catch(() => ({}));
              updateLastAssistantMessage(`⚠️ I couldn't scan that website: ${(errData as Record<string, string>).error || "unknown error"}. You can paste the info manually and I'll still help!`);
              setWebsiteScanning(false);
              return;
            }
            const scanData = await scanRes.json();
            if (scanData.success && scanData.data) {
              freshWebsiteContext = scanData.data as Record<string, unknown>;
              setLastWebsiteContext(freshWebsiteContext);
              // Replace the "Scanning…" message with a summary
              const d = scanData.data;
              const summaryParts: string[] = [`✅ **Website scanned successfully!**`];
              if (d.title) summaryParts.push(`**${d.title}**`);
              if (d.description) summaryParts.push(d.description);
              if (d.contact?.emails?.length) summaryParts.push(`📧 ${d.contact.emails.join(", ")}`);
              if (d.contact?.phones?.length) summaryParts.push(`📞 ${d.contact.phones.join(", ")}`);
              if (d.socialLinks && Object.keys(d.socialLinks).length > 0)
                summaryParts.push(`🔗 Social: ${Object.keys(d.socialLinks).join(", ")}`);
              summaryParts.push("\nNow let me use this info to help you…");
              updateLastAssistantMessage(summaryParts.join("\n"));
            } else {
              updateLastAssistantMessage("⚠️ The scan returned no usable data. Try pasting the details manually.");
              setWebsiteScanning(false);
              return;
            }
          } catch (err) {
            updateLastAssistantMessage("⚠️ Something went wrong while scanning the website. Please try again.");
            setWebsiteScanning(false);
            return;
          } finally {
            setWebsiteScanning(false);
          }
        }
      }

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
          .slice(-10)
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

        // Build fileContext from ready attachments, or use persisted context
        const readyAttachments = attachments.filter((a) => a.status === "ready" && a.extractedData);
        let fileContext: Record<string, unknown> | undefined;
        if (readyAttachments.length > 0) {
          const att = readyAttachments[0]; // First ready attachment
          const ed = att.extractedData!;
          // Include the full document text (capped at 4000 chars for token limits)
          // This is CRITICAL — without it, the AI only sees summary + detectedFields
          // and cannot understand the brand, services, or document content
          const documentText = ed.text ? ed.text.slice(0, 4000) : undefined;
          fileContext = {
            fileName: att.fileName,
            extractionType: ed.extractionType,
            summary: ed.summary,
            ...(documentText ? { text: documentText } : {}),
            ...(ed.detectedFields ? { detectedFields: ed.detectedFields } : {}),
            ...(ed.tables && ed.tables.length > 0 ? { tables: ed.tables } : {}),
            ...(ed.images && ed.images.length > 0
              ? { images: ed.images.map((img) => ({ name: img.name, mimeType: img.mimeType })) }
              : {}),
            ...(ed.documentFonts && ed.documentFonts.length > 0 ? { documentFonts: ed.documentFonts } : {}),
            ...(ed.documentColors && ed.documentColors.length > 0 ? { documentColors: ed.documentColors } : {}),
          };
          // Persist so Chiko remembers the file across follow-up messages
          setLastFileContext(fileContext);
        } else if (lastFileContext) {
          // No fresh attachment — use persisted file context from previous upload
          fileContext = lastFileContext as Record<string, unknown>;
        }

        // Build websiteContext from fresh scan or persisted context
        const websiteContext = freshWebsiteContext || (lastWebsiteContext as Record<string, unknown> | null) || undefined;

        // Build business profile summary for system prompt injection
        const memoryState = useBusinessMemory.getState();
        const profileSummary = memoryState.hasProfile
          ? describeProfileForAI(memoryState.profile)
          : "";

        // Build workflow context for system prompt injection
        const workflowSummary = useChikoWorkflows.getState().getProgressSummary();
        const workflowContext = workflowSummary !== "No workflow is currently active." ? workflowSummary : "";

        // ── Extract logo for vision + color analysis (only for color/logo queries) ──
        let logoImage: { data: string; mediaType: string } | undefined;
        let logoColors: string[] | undefined;
        if (isLogoColorQuery(text)) {
          try {
            const logoUri = getActiveToolLogoUri(context.currentToolId);
            if (logoUri) {
              // Extract dominant colors client-side for reliable hex values
              const colors = await extractDominantColors(logoUri, 5);
              if (colors.length > 0) logoColors = colors;
              // Prepare logo for Claude vision — only if supported format and < 4MB
              const match = logoUri.match(/^data:(image\/[^;]+);base64,(.+)$/);
              if (match && VISION_SUPPORTED_TYPES.has(match[1]) && match[2].length < 4_000_000) {
                logoImage = { data: match[2], mediaType: match[1] };
              }
            }
          } catch {
            // Logo extraction failed — continue without it, colors will be sent if available
          }
        }

        const response = await fetch("/api/chiko", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            context,
            ...(hasTools ? { actions: actionDescriptors, toolState } : {}),
            ...(fileContext ? { fileContext } : {}),
            ...(websiteContext ? { websiteContext } : {}),
            ...(profileSummary ? { businessProfile: profileSummary } : {}),
            ...(workflowContext ? { workflowContext } : {}),
            ...(logoImage ? { logoImage } : {}),
            ...(logoColors ? { logoColors } : {}),
          }),
          signal: controller.signal,
        });

        // Handle auth and credit errors with user-friendly messages
        if (response.status === 401) {
          updateLastAssistantMessage(
            "You need to be signed in to use me. Please log in and try again."
          );
          setIsGenerating(false);
          return;
        }
        if (response.status === 402) {
          const { handleCreditError } = await import("@/lib/credit-error");
          updateLastAssistantMessage(handleCreditError());
          setIsGenerating(false);
          return;
        }
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

        // ── Shared type for action tracking ──
        type ActionRecord = {
          action: string;
          params: Record<string, unknown>;
          success: boolean;
          message: string;
          newState?: Record<string, unknown>;
          toolUseId?: string;
        };

        // ── Helper: process a Chiko streaming response ──
        // Returns executed actions, raw assistant text, stop_reason, and suggested replies
        const processChikoStream = async (
          streamReader: ReadableStreamDefaultReader<Uint8Array>,
        ): Promise<{
          executedActions: ActionRecord[];
          rawAssistantText: string;
          stopReason: string;
          suggestedReplies: string[];
        }> => {
          const dec = new TextDecoder();
          const actions: ActionRecord[] = [];
          let buf = "";
          let rawText = "";
          let stop = "";
          let replies: string[] = [];

          while (true) {
            const { done, value } = await streamReader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });

            // ── Strip __CHIKO_STOP__ markers before any other parsing ──
            const stopMarker = "__CHIKO_STOP__:";
            const stopIdx = buf.indexOf(stopMarker);
            if (stopIdx !== -1) {
              const afterMarker = buf.slice(stopIdx + stopMarker.length);
              const nlIdx = afterMarker.indexOf("\n");
              if (nlIdx !== -1) {
                try {
                  const stopData = JSON.parse(afterMarker.slice(0, nlIdx));
                  stop = stopData.stop_reason || "";
                } catch { /* ignore parse error */ }
                // Remove the stop marker + its line from the buffer
                buf = buf.slice(0, stopIdx) + afterMarker.slice(nlIdx + 1);
              } else {
                // Incomplete stop marker — trim buffer before it and wait for more data
                const textBefore = buf.slice(0, stopIdx);
                if (textBefore) {
                  // Process what we have before the marker
                  buf = textBefore;
                  // Fall through to normal processing below, then restore the incomplete marker
                  // Actually, just process textBefore and keep the incomplete part
                  appendToLastAssistantMessage(textBefore);
                  rawText += textBefore;
                  buf = buf.slice(stopIdx); // keep from stopIdx onwards
                }
                continue;
              }
            }

            // ── Process buffer for action events vs text ──
            const parts = buf.split("__CHIKO_ACTION__:");

            // First part is always text
            if (parts[0]) {
              appendToLastAssistantMessage(parts[0]);
              rawText += parts[0];
            }

            // Process any action events
            for (let i = 1; i < parts.length; i++) {
              const newlineIdx = parts[i].indexOf("\n");
              if (newlineIdx === -1) {
                // Incomplete action event — keep in buffer
                const remaining = parts.slice(i).join("__CHIKO_ACTION__:");
                buf = "__CHIKO_ACTION__:" + remaining;
                break;
              }
              const jsonStr = parts[i].slice(0, newlineIdx);
              const trailing = parts[i].slice(newlineIdx + 1);

              try {
                const actionEvent = JSON.parse(jsonStr) as {
                  __chiko_action__: boolean;
                  action: string;
                  params: Record<string, unknown>;
                  toolUseId?: string;
                };

                const sep = actionEvent.action.indexOf("__");
                if (sep !== -1) {
                  const toolIdRaw = actionEvent.action.slice(0, sep);
                  const actionName = actionEvent.action.slice(sep + 2);
                  const toolId = toolIdRaw.replace(/_/g, "-");
                  const currentRegistry = useChikoActionRegistry.getState();
                  const manifest = currentRegistry.manifests.get(toolId);
                  const descriptor = manifest?.actions.find((a) => a.name === actionName);

                  if (descriptor?.destructive) {
                    setPendingAction({ action: actionEvent.action, params: actionEvent.params });
                    appendToLastAssistantMessage(
                      `\n\n⚠️ **This action is destructive** (${descriptor.description}). Please confirm or cancel below.`
                    );
                  } else {
                    const result = executeChikoAction(actionEvent.action, actionEvent.params);
                    actions.push({
                      action: actionEvent.action,
                      params: actionEvent.params,
                      success: result.success,
                      message: result.message,
                      newState: result.newState,
                      toolUseId: actionEvent.toolUseId,
                    });

                    // Sync executed action to workflow store so auto-continue can detect step completion
                    if (result.success) {
                      const wfState = useChikoWorkflows.getState();
                      const wf = wfState.activeWorkflow;
                      if (wf && wf.status === "running") {
                        const step = wf.steps[wf.currentStepIndex];
                        if (step) {
                          const aIdx = step.actions.findIndex((a) => !a.executed && a.actionName === actionName);
                          if (aIdx !== -1) {
                            wfState.markActionExecuted(wf.currentStepIndex, aIdx, result.message || "done");
                          }
                        }
                      }
                    }

                    if (actionName === "navigateToTool" && result.success && actionEvent.params.toolId) {
                      const userMsg = messages[messages.length - 1]?.content || "";
                      pendingNavigationRef.current = {
                        targetToolId: actionEvent.params.toolId as string,
                        userIntent: userMsg,
                      };
                    }
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

              if (trailing) {
                appendToLastAssistantMessage(trailing);
                rawText += trailing;
              }
              if (i === parts.length - 1) {
                buf = "";
              }
            }

            if (parts.length === 1) {
              buf = "";
            }
          }

          // ── Post-stream: extract __QUICK_REPLIES__ from the accumulated text ──
          const qrMarker = "__QUICK_REPLIES__:";
          const qrIdx = rawText.lastIndexOf(qrMarker);
          if (qrIdx !== -1) {
            const qrPayload = rawText.slice(qrIdx + qrMarker.length).trim();
            try {
              const parsed = JSON.parse(qrPayload);
              if (Array.isArray(parsed)) {
                replies = parsed.filter((r): r is string => typeof r === "string").slice(0, 4);
              }
            } catch { /* ignore parse error */ }
            // Strip the marker from the displayed message
            const textBefore = rawText.slice(0, qrIdx).trimEnd();
            rawText = textBefore;
            // Also strip from the visible message in the store
            const store = useChikoStore.getState();
            const msgs = store.messages;
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg?.role === "assistant") {
              const visibleContent = lastMsg.content;
              const visibleQrIdx = visibleContent.lastIndexOf(qrMarker);
              if (visibleQrIdx !== -1) {
                useChikoStore.setState({
                  messages: msgs.map((m, idx) =>
                    idx === msgs.length - 1
                      ? { ...m, content: visibleContent.slice(0, visibleQrIdx).trimEnd() }
                      : m
                  ),
                });
              }
            }
          }

          return { executedActions: actions, rawAssistantText: rawText, stopReason: stop, suggestedReplies: replies };
        };

        // ── Process the initial stream ──
        let { executedActions, rawAssistantText, stopReason, suggestedReplies } = await processChikoStream(reader);

        // ── Auto-continuation loop ──
        // When Claude's stop_reason is "tool_use", it expects tool results back.
        // Send a follow-up request with the results so it can continue.
        const MAX_CONTINUATIONS = 3;
        let continuationCount = 0;
        let currentApiMessages = apiMessages;

        while (
          stopReason === "tool_use" &&
          executedActions.length > 0 &&
          continuationCount < MAX_CONTINUATIONS
        ) {
          continuationCount++;

          // Build tool results summary for Claude
          const toolResultsStr = executedActions
            .map((a) => {
              const statusIcon = a.success ? "✅" : "❌";
              const dataStr = a.newState
                ? `\nReturned data:\n${JSON.stringify(a.newState, null, 2)}`
                : "";
              return `${a.action}: ${statusIcon} ${a.message}${dataStr}`;
            })
            .join("\n\n");

          // Build continuation messages: original conversation + assistant's text + tool results
          currentApiMessages = [
            ...currentApiMessages,
            { role: "assistant", content: rawAssistantText.trim() || "I'll check the current state." },
            {
              role: "user",
              content: `[Tool execution results]\n${toolResultsStr}\n[/Tool execution results]\n\nPlease continue with the changes based on these results. Do NOT call readCurrentState again — you already have the data above.`,
            },
          ];

          // Re-read fresh tool state (mutations may have changed it)
          const freshRegistry = useChikoActionRegistry.getState();
          const freshDescriptors = freshRegistry.getActionDescriptorsForAI();
          const freshHasTools = freshDescriptors.length > 0;
          let freshToolState: Record<string, unknown> | undefined;
          if (freshHasTools) {
            const st: Record<string, unknown> = {};
            for (const [tid] of freshRegistry.manifests) {
              const ts = freshRegistry.readState(tid);
              if (ts) st[tid] = ts;
            }
            freshToolState = st;
          }

          // Make continuation request
          const contResponse = await fetch("/api/chiko", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: currentApiMessages,
              context,
              ...(freshHasTools ? { actions: freshDescriptors, toolState: freshToolState } : {}),
              ...(fileContext ? { fileContext } : {}),
              ...(websiteContext ? { websiteContext } : {}),
              ...(profileSummary ? { businessProfile: profileSummary } : {}),
              ...(workflowContext ? { workflowContext } : {}),
            }),
            signal: controller.signal,
          });

          if (!contResponse.ok) {
            appendToLastAssistantMessage("\n\n⚠️ I had trouble continuing — please try again.");
            break;
          }

          const contContentType = contResponse.headers.get("content-type") || "";
          if (contContentType.includes("application/json")) {
            const contData = await contResponse.json();
            if (contData.fallback) {
              appendToLastAssistantMessage(`\n\n${contData.content}`);
              break;
            }
          }

          const contReader = contResponse.body?.getReader();
          if (!contReader) break;

          // Small visual separator before continuation
          appendToLastAssistantMessage("\n\n");

          // Process the continuation stream (appends to the same assistant message)
          const contResult = await processChikoStream(contReader);
          executedActions = [...executedActions, ...contResult.executedActions];
          rawAssistantText = contResult.rawAssistantText;
          stopReason = contResult.stopReason;
          // Use the latest quick replies (continuation overrides initial)
          if (contResult.suggestedReplies.length > 0) {
            suggestedReplies = contResult.suggestedReplies;
          }
        }

        // Store executed actions + suggested replies on the message
        if (executedActions.length > 0 || suggestedReplies.length > 0) {
          const store = useChikoStore.getState();
          const msgs = store.messages;
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.role === "assistant") {
            useChikoStore.setState({
              messages: msgs.map((m, idx) =>
                idx === msgs.length - 1
                  ? {
                      ...m,
                      ...(executedActions.length > 0 ? { executedActions } : {}),
                      ...(suggestedReplies.length > 0 ? { suggestedReplies } : {}),
                    }
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
        // Clear attachments after send
        if (attachments.some((a) => a.status === "ready")) {
          clearAttachments();
        }
      }
    },
    [
      inputDraft,
      isGenerating,
      messages,
      context,
      attachments,
      lastFileContext,
      router,
      handleLocalCommand,
      setInputDraft,
      addMessage,
      updateLastAssistantMessage,
      appendToLastAssistantMessage,
      setIsGenerating,
      executeChikoAction,
      clearAttachments,
      setLastFileContext,
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
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
            {/* ── Drag-over overlay ────────────────────── */}
            <AnimatePresence>
              {isDragOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary-500/60 bg-primary-500/10 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center gap-2 text-primary-400">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 16V4m0 0L8 8m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm font-medium">Drop file here</span>
                    <span className="text-xs text-primary-500/60">PDF, DOCX, XLSX, PNG, JPEG, SVG, WebP</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* ── Header ──────────────────────────────── */}
            <div className="flex shrink-0 items-center gap-3 border-b border-gray-700/50 px-4 py-3">
              <Chiko3DAvatar size="sm" animated expression={chikoExpression} showGlow={false} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">Chiko</h2>
                  <span className="hidden rounded-full bg-secondary-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-400 sm:inline-flex">
                    AI Assistant
                  </span>
                  {(isGenerating || websiteScanning) && (
                    <motion.div
                      className="h-1.5 w-1.5 rounded-full bg-primary-400"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                </div>
                <p className="truncate text-xs text-gray-400">
                  {websiteScanning
                    ? "Scanning website…"
                    : isGenerating
                      ? attachments.some((a) => a.status === "ready")
                        ? "Analyzing your file…"
                        : "Thinking…"
                      : "Your personal creative companion"}
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

            {/* ── Workflow Progress Banner ─────────────── */}
            {workflowActive && (
              <div className="shrink-0 border-b border-primary-500/20 bg-primary-500/5 px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-bold text-primary-400">
                        {workflowActive.name}
                      </span>
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        workflowActive.status === "running" && "bg-primary-500/20 text-primary-400",
                        workflowActive.status === "paused" && "bg-amber-500/20 text-amber-400",
                        (workflowActive.status === "awaiting-navigation" || workflowActive.status === "awaiting-confirmation") && "bg-secondary-500/20 text-secondary-400",
                      )}>
                        {workflowActive.status === "awaiting-navigation" ? "Navigating..." : workflowActive.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-gray-400">
                      Step {workflowActive.currentStepIndex + 1}/{workflowActive.steps.length}: {workflowActive.steps[workflowActive.currentStepIndex]?.label ?? "Done"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {workflowActive.status === "running" ? (
                      <button
                        onClick={() => {
                          useChikoWorkflows.getState().pauseWorkflow();
                          addMessage({ role: "assistant", content: "⏸️ Workflow paused. Type **/workflow resume** to continue." });
                        }}
                        className="rounded-md px-2 py-1 text-[11px] font-medium text-amber-400 transition-colors hover:bg-amber-500/10"
                      >
                        Pause
                      </button>
                    ) : workflowActive.status === "paused" ? (
                      <button
                        onClick={() => {
                          useChikoWorkflows.getState().resumeWorkflow();
                          setAutoContinueCount(0);
                          addMessage({ role: "assistant", content: "▶️ Workflow resumed!" });
                        }}
                        className="rounded-md px-2 py-1 text-[11px] font-medium text-primary-400 transition-colors hover:bg-primary-500/10"
                      >
                        Resume
                      </button>
                    ) : null}
                    <button
                      onClick={() => {
                        if (confirm("Cancel the active workflow? Changes to tools are preserved.")) {
                          const msg = useChikoWorkflows.getState().cancelWorkflow();
                          addMessage({ role: "assistant", content: msg });
                        }
                      }}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 flex gap-0.5">
                  {workflowActive.steps.map((step, i) => (
                    <div
                      key={step.id}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        step.status === "completed" && "bg-primary-500",
                        step.status === "skipped" && "bg-gray-500",
                        step.status === "failed" && "bg-red-500",
                        (step.status === "in-progress" || step.status === "navigating") && "animate-pulse bg-primary-400",
                        step.status === "pending" && "bg-gray-700",
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

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
                      <>
                        {/* Inline file chips for attachments sent with this message */}
                        {msg.files && msg.files.length > 0 && (
                          <div className="mb-1.5 flex flex-wrap gap-1.5">
                            {msg.files.map((f, fi) => (
                              <div key={fi} className="flex items-center gap-1.5 rounded-lg border border-primary-500/30 bg-primary-500/10 px-2 py-1 text-[11px]">
                                {f.thumbnail ? (
                                  <img src={f.thumbnail} alt="" className="h-5 w-5 rounded object-cover" />
                                ) : (
                                  <span className="text-[11px]">{getFileIcon(f.mimeType)}</span>
                                )}
                                <span className="max-w-28 truncate text-primary-200">{f.fileName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[13px] leading-relaxed sm:text-sm">{msg.content}</p>
                      </>
                    ) : null}

                    {msg.role === "assistant" && !msg.content && isGenerating && (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex items-center gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-primary-500"
                              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-500">Chiko is thinking…</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* ── Quick-Reply Buttons from Chiko ───── */}
              <AnimatePresence>
                {!isGenerating &&
                  messages.length > 0 &&
                  messages[messages.length - 1].role === "assistant" &&
                  (messages[messages.length - 1].suggestedReplies?.length ?? 0) > 0 && (
                    <motion.div
                      key="quick-replies"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="mb-2 ml-8 flex flex-wrap gap-1.5"
                    >
                      {messages[messages.length - 1].suggestedReplies!.map(
                        (reply, i) => (
                          <motion.button
                            key={reply}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05, duration: 0.15 }}
                            onClick={() => sendMessage(reply)}
                            disabled={isGenerating}
                            className={cn(
                              "rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1.5",
                              "text-xs text-primary-300 transition-all",
                              "hover:border-primary-500/50 hover:bg-primary-500/20 hover:text-primary-200",
                              "active:scale-95 active:bg-primary-500/25",
                              "disabled:pointer-events-none disabled:opacity-40"
                            )}
                          >
                            {reply}
                          </motion.button>
                        )
                      )}
                    </motion.div>
                  )}
              </AnimatePresence>

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
              {/* ── File Attachment Chips ─────────────── */}
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs",
                        att.status === "error"
                          ? "border-error-500/40 bg-error-500/10 text-error-400"
                          : att.status === "ready"
                            ? "border-primary-500/40 bg-primary-500/10 text-primary-300"
                            : "border-gray-700/40 bg-gray-800/40 text-gray-400"
                      )}
                    >
                      {att.thumbnail ? (
                        <img
                          src={att.thumbnail}
                          alt=""
                          className="h-5 w-5 rounded object-cover"
                        />
                      ) : (
                        <span className="text-[11px]">{getFileIcon(att.mimeType)}</span>
                      )}
                      <span className="max-w-24 truncate">{att.fileName}</span>
                      {(att.status === "uploading" || att.status === "processing") && (
                        <div className="h-1 w-10 overflow-hidden rounded-full bg-gray-700">
                          <motion.div
                            className="h-full rounded-full bg-primary-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${att.progress}%` }}
                          />
                        </div>
                      )}
                      {att.status === "ready" && (
                        <span className="text-[10px] text-primary-500">✓</span>
                      )}
                      {att.status === "error" && (
                        <span className="text-[10px]" title={att.error}>✗</span>
                      )}
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="ml-0.5 text-gray-500 transition-colors hover:text-gray-300"
                        aria-label={`Remove ${att.fileName}`}
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* ── Voice Recording Overlay ── */}
              <div className="relative">
                <VoiceRecordingOverlay
                  state={voice.state}
                  interimText={voice.interimText}
                  volumeLevel={voice.volumeLevel}
                  errorMessage={voice.errorMessage}
                  onStop={voice.stopListening}
                  onCancel={voice.cancel}
                />
              </div>
              <div className={cn(
                "flex items-end gap-2 rounded-xl border px-3 py-2 transition-colors",
                isVoiceActive
                  ? "border-primary-500/40 bg-primary-500/5 ring-1 ring-primary-500/20"
                  : "border-gray-700/50 bg-gray-800/40 focus-within:border-primary-500/40 focus-within:ring-1 focus-within:ring-primary-500/20"
              )}>
                {/* ── Hidden file input ──────────────── */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_STRING}
                  onChange={handleFileInputChange}
                  className="hidden"
                  aria-hidden="true"
                />
                {/* ── Attachment button ──────────────── */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating || isVoiceActive}
                  className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-500 transition-colors hover:text-primary-400 disabled:opacity-30"
                  aria-label="Attach file"
                  title="Attach a file (PDF, DOCX, XLSX, Image)"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
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
                  placeholder={isVoiceActive ? "Speak now..." : "Ask anything... (/help for commands)"}
                  disabled={isGenerating || isVoiceActive}
                  rows={1}
                  className={cn(
                    "max-h-25 flex-1 resize-none bg-transparent text-sm placeholder-gray-500 outline-none disabled:opacity-50",
                    isVoiceActive ? "text-primary-300" : "text-white"
                  )}
                  aria-label="Message Chiko"
                  style={{ fontSize: "16px" }}
                  enterKeyHint="send"
                  autoComplete="off"
                  autoCorrect="off"
                />
                {/* ── Mic button ───────────────────────── */}
                <MicButton
                  isSupported={voice.isSupported}
                  isListening={voice.state === "listening"}
                  isDisabled={isGenerating || websiteScanning}
                  onClick={() => {
                    if (voice.state === "listening") {
                      voice.stopListening();
                    } else {
                      voice.startListening();
                    }
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={(!inputDraft.trim() && !attachments.some((a) => a.status === "ready")) || isGenerating || websiteScanning || isVoiceActive}
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
                  {voice.isSupported ? "Mic or type" : "Shift+Enter for newline"}
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
