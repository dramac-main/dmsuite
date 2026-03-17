// =============================================================================
// DMSuite — AI Revision Panel
// Left-side or tab panel for AI-powered resume revisions.
// Chat interface + quick action chips + revision history.
// AI revisions NEVER auto-applied — always diff preview → Accept/Reject.
// =============================================================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeEditor } from "@/stores/resume-editor";
import { useResumeEditorUI, type ChatMessage } from "@/stores/resume-editor-ui";
import { useResumeCVWizard } from "@/stores/resume-cv-wizard";
import {
  performAIRevision,
  type RevisionContext,
  type RevisionResult,
  type WizardDataSnapshot,
} from "@/lib/resume/ai-revision-engine";

// ── Inline SVG Icons ──

function IconSparkles({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}

function IconSend({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconLoader({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function IconZap({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconClipboard({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Quick action chips
// ---------------------------------------------------------------------------

interface QuickAction {
  label: string;
  instruction: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Improve ATS", instruction: "Improve my ATS score by adding relevant keywords and optimizing formatting", icon: IconZap },
  { label: "Shorten to 1 page", instruction: "Shorten all sections to fit on a single page while keeping key achievements", icon: IconClipboard },
  { label: "More action verbs", instruction: "Rewrite experience bullet points to start with strong, quantified action verbs", icon: IconSparkles },
  { label: "Tailor for role", instruction: "Tailor this resume for the target role, emphasizing relevant experience", icon: IconZap },
  { label: "Expand summary", instruction: "Expand the professional summary with more detail about qualifications", icon: IconSparkles },
  { label: "Add keywords", instruction: "Add industry-relevant keywords throughout the resume for better ATS compatibility", icon: IconClipboard },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWizardSnapshot(wizard: ReturnType<typeof useResumeCVWizard.getState>): WizardDataSnapshot {
  return {
    personal: {
      name: wizard.personal.name,
      email: wizard.personal.email,
      phone: wizard.personal.phone,
      location: wizard.personal.location,
      linkedin: wizard.personal.linkedin,
      website: wizard.personal.website,
    },
    experiences: wizard.experiences.map((exp) => ({
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate,
      isCurrent: exp.isCurrent,
      description: exp.description,
    })),
    education: wizard.education.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      graduationYear: edu.graduationYear,
    })),
    skills: wizard.skills,
    brief: {
      description: wizard.brief.description,
      style: wizard.brief.style,
      contentFidelityMode: wizard.brief.contentFidelityMode,
      jobDescription: wizard.brief.jobDescription,
    },
  };
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface AIRevisionPanelProps {
  onRevisionResult?: (result: RevisionResult) => void;
}

export default function AIRevisionPanel({ onRevisionResult }: AIRevisionPanelProps) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stores
  const resume = useResumeEditor((s) => s.resume);
  const isRevisionPending = useResumeEditor((s) => s.isRevisionPending);
  const chatMessages = useResumeEditorUI((s) => s.chatMessages);
  const addChatMessage = useResumeEditorUI((s) => s.addChatMessage);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  // ---- Send revision ----
  const handleSend = useCallback(async (instruction?: string) => {
    const text = instruction ?? input.trim();
    if (!text || isProcessing) return;

    // Add user message
    addChatMessage({
      id: `user-${Date.now().toString(36)}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    });
    setInput("");
    setIsProcessing(true);

    try {
      // Build context from wizard + current state
      const wizardState = useResumeCVWizard.getState();
      const context: RevisionContext = {
        scope: "full",
        contentFidelityMode: wizardState.brief.contentFidelityMode,
        wizardData: buildWizardSnapshot(wizardState),
        targetRole: wizardState.targetRole.jobTitle,
        jobDescription: wizardState.brief.jobDescription || undefined,
      };

      const result = await performAIRevision(text, resume, context);

      // Add assistant response
      addChatMessage({
        id: `ai-${Date.now().toString(36)}`,
        role: "assistant",
        content: result.success
          ? `${result.summary} (${result.patches.length} changes proposed)`
          : `Could not complete revision: ${result.summary}`,
        timestamp: Date.now(),
      });

      // Notify parent for diff overlay
      if (result.success && onRevisionResult) {
        onRevisionResult(result);
      }
    } catch (err) {
      addChatMessage({
        id: `err-${Date.now().toString(36)}`,
        role: "system",
        content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        timestamp: Date.now(),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [input, isProcessing, resume, addChatMessage, onRevisionResult]);

  // ---- Quick action handler ----
  const handleQuickAction = useCallback((action: QuickAction) => {
    handleSend(action.instruction);
  }, [handleSend]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800/50">
        <IconSparkles className="w-4 h-4 text-primary-400" />
        <span className="text-xs font-medium text-gray-300">AI Assistant</span>
        {isProcessing && (
          <IconLoader className="w-3.5 h-3.5 text-primary-400 animate-spin ml-auto" />
        )}
      </div>

      {/* Quick actions */}
      <div className="px-3 py-2 border-b border-gray-800/40">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action)}
              disabled={isProcessing || isRevisionPending}
              className="inline-flex items-center gap-1 rounded-full bg-gray-800/60 border border-gray-700/50 px-2.5 py-1 text-xs text-gray-400 transition-all hover:border-primary-500/40 hover:text-primary-300 hover:bg-primary-500/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <action.icon className="w-3 h-3" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center py-8">
            <IconSparkles className="mx-auto text-gray-700 mb-2 w-6 h-6" />
            <p className="text-xs text-gray-500 max-w-48 mx-auto leading-relaxed">
              Ask the AI to revise your resume. All changes will be shown as a diff for you to review before applying.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <IconLoader className="w-3.5 h-3.5 animate-spin" />
            <span>Generating revision...</span>
          </div>
        )}

        {isRevisionPending && !isProcessing && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-400">
            Revision pending — review the diff in the preview panel to accept or reject.
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800/50 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isRevisionPending ? "Accept/reject pending changes first..." : "Describe what to change..."}
            disabled={isProcessing || isRevisionPending}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-colors focus:border-primary-500/60 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing || isRevisionPending}
            className="rounded-lg bg-primary-500 px-3 py-2 text-gray-950 transition-all hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconSend className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Bubble
// ---------------------------------------------------------------------------

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
        message.role === "user"
          ? "bg-primary-500/10 text-primary-200 ml-6"
          : message.role === "assistant"
          ? "bg-gray-800/60 text-gray-300 mr-6"
          : "bg-gray-800/30 text-gray-500 text-center italic"
      }`}
    >
      {message.content}
    </motion.div>
  );
}
