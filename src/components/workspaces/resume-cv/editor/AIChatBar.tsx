// =============================================================================
// DMSuite — ChatGPT-Style AI Chat Bar
// Floating input bar at the bottom center of the editor for AI revisions.
// Familiar UX pattern: compact input + expandable chat history above.
// =============================================================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeEditorUI } from "@/stores/resume-editor-ui";
import { useResumeEditor } from "@/stores/resume-editor";

// ── Inline SVG Icons ──

function IconArrowUp({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function IconSparkles({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconMessageSquare({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Quick suggestion chips — common AI revision prompts
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "Make it more professional",
  "Add metrics & numbers",
  "Tailor for the job description",
  "Shorten to one page",
  "Improve action verbs",
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface AIChatBarProps {
  /** Execute an AI revision instruction */
  onExecute: (instruction: string) => Promise<void>;
}

export default function AIChatBar({ onExecute }: AIChatBarProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMessages = useResumeEditorUI((s) => s.chatMessages);
  const addChatMessage = useResumeEditorUI((s) => s.addChatMessage);
  const isRevisionPending = useResumeEditor((s) => s.isRevisionPending);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isExpanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isExpanded]);

  // ── Send handler ──
  const handleSend = useCallback(async (text?: string) => {
    const instruction = (text ?? input).trim();
    if (!instruction || isProcessing || isRevisionPending) return;

    // Add user message
    addChatMessage({
      id: `user-${Date.now().toString(36)}`,
      role: "user",
      content: instruction,
      timestamp: Date.now(),
    });
    setInput("");
    setIsExpanded(true);
    setIsProcessing(true);

    try {
      await onExecute(instruction);

      // Add success message
      addChatMessage({
        id: `ai-${Date.now().toString(36)}`,
        role: "assistant",
        content: "Revision applied — review the changes in the preview panel. Accept or reject to continue.",
        timestamp: Date.now(),
      });
    } catch (err) {
      addChatMessage({
        id: `err-${Date.now().toString(36)}`,
        role: "system",
        content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`,
        timestamp: Date.now(),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [input, isProcessing, isRevisionPending, onExecute, addChatMessage]);

  // ── Keyboard handling ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setIsExpanded(false);
    }
  }, [handleSend]);

  const hasMessages = chatMessages.length > 0;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4">
      {/* ── Expandable chat history ── */}
      <AnimatePresence>
        {isExpanded && hasMessages && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-2 overflow-hidden"
          >
            <div className="rounded-2xl bg-gray-900/95 border border-gray-700/60 backdrop-blur-xl shadow-2xl max-h-64 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <IconSparkles className="w-3 h-3 text-primary-400" />
                  <span className="font-medium">AI Revisions</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="rounded p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <IconChevronDown />
                </button>
              </div>

              {/* Messages */}
              <div className="p-3 space-y-2.5">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary-500/10 text-primary-200 ml-6"
                        : msg.role === "assistant"
                        ? "bg-gray-800/60 text-gray-300 mr-6"
                        : "bg-red-500/5 text-red-400/80 text-center italic"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}

                {isRevisionPending && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400/90">
                    ✨ Revision pending — accept or reject in the preview.
                  </div>
                )}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span>Generating revision…</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick suggestions (only when no messages yet) ── */}
      <AnimatePresence>
        {!hasMessages && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-2 flex flex-wrap justify-center gap-1.5"
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                disabled={isProcessing || isRevisionPending}
                className="rounded-full border border-gray-700/50 bg-gray-900/70 backdrop-blur-sm px-3 py-1 text-[11px] text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-all disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main input bar ── */}
      <div className="flex items-center gap-2 rounded-2xl bg-gray-900/90 border border-gray-700/60 backdrop-blur-xl shadow-2xl shadow-black/20 px-3 py-2">
        {/* Chat history toggle */}
        {hasMessages && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`relative flex-shrink-0 rounded-full p-1.5 transition-colors ${
              isExpanded
                ? "text-primary-400 bg-primary-500/10"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/60"
            }`}
            title="Toggle chat history"
          >
            <IconMessageSquare />
            {/* Unread indicator */}
            {!isExpanded && chatMessages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary-500 border border-gray-900" />
            )}
          </button>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          data-chat-input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => hasMessages && setIsExpanded(true)}
          placeholder={
            isRevisionPending
              ? "Accept/reject pending changes first…"
              : isProcessing
              ? "AI is working…"
              : "Ask AI to revise your resume…"
          }
          disabled={isProcessing || isRevisionPending}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none disabled:opacity-50"
        />

        {/* Send button */}
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isProcessing || isRevisionPending}
          className={`flex-shrink-0 rounded-full p-2 transition-all ${
            input.trim() && !isProcessing && !isRevisionPending
              ? "bg-primary-500 text-gray-950 hover:bg-primary-400 shadow-lg shadow-primary-500/20"
              : "bg-gray-800/60 text-gray-600 cursor-not-allowed"
          }`}
          title="Send (Enter)"
        >
          <IconArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="mt-1.5 text-center">
        <span className="text-[10px] text-gray-400">
          Press <kbd className="px-1.5 py-0.5 rounded bg-gray-700/60 border border-gray-600/50 text-gray-300 text-[9px] font-medium">Enter</kbd> to send
          {" · "}
          <kbd className="px-1.5 py-0.5 rounded bg-gray-700/60 border border-gray-600/50 text-gray-300 text-[9px] font-medium">Ctrl+K</kbd> for quick access
        </span>
      </div>
    </div>
  );
}
