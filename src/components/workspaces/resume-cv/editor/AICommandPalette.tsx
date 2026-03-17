// =============================================================================
// DMSuite — AI Command Palette
// Cmd+K / Ctrl+K overlay for natural language resume revisions.
// Inline command palette with autocomplete suggestions.
// =============================================================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Inline SVG Icons ──

function IconCommand({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function IconSearch({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconSparkles({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}

function IconLayout({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function IconPalette({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="6.5" cy="13.5" r="2.5" />
      <circle cx="17.5" cy="13.5" r="2.5" />
      <circle cx="13.5" cy="20.5" r="2.5" />
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
    </svg>
  );
}

function IconFileText({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Suggestion definitions
// ---------------------------------------------------------------------------

interface Suggestion {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  instruction: string;
  category: "content" | "design" | "structure";
}

const SUGGESTIONS: Suggestion[] = [
  // Content
  { id: "improve-ats", label: "Improve ATS Score", description: "Optimize keywords and formatting", icon: IconSparkles, instruction: "Improve my ATS score by adding relevant keywords", category: "content" },
  { id: "rewrite-summary", label: "Rewrite Summary", description: "Generate a stronger professional summary", icon: IconFileText, instruction: "Rewrite my professional summary to be more impactful", category: "content" },
  { id: "shorten-all", label: "Shorten Everything", description: "Condense to fit on fewer pages", icon: IconFileText, instruction: "Shorten all sections to fit on one page", category: "content" },
  { id: "add-action-verbs", label: "Add Action Verbs", description: "Start bullets with strong action verbs", icon: IconSparkles, instruction: "Rewrite all experience bullets to start with strong action verbs", category: "content" },
  { id: "tailor-role", label: "Tailor for Role", description: "Optimize for your target position", icon: IconSparkles, instruction: "Tailor this resume for the target role", category: "content" },
  { id: "quantify-achievements", label: "Quantify Achievements", description: "Add numbers and metrics to bullets", icon: IconFileText, instruction: "Add specific numbers and quantified achievements to experience bullets", category: "content" },
  // Design
  { id: "modern-template", label: "Modern Template", description: "Switch to the modern layout", icon: IconPalette, instruction: "Change the template to modern", category: "design" },
  { id: "creative-template", label: "Creative Template", description: "Switch to the creative layout", icon: IconPalette, instruction: "Change the template to creative", category: "design" },
  { id: "compact-spacing", label: "Compact Spacing", description: "Reduce whitespace between sections", icon: IconLayout, instruction: "Change spacing to compact", category: "design" },
  // Structure
  { id: "hide-refs", label: "Hide References", description: "Remove references section", icon: IconLayout, instruction: "Hide the references section", category: "structure" },
  { id: "sidebar-skills", label: "Skills to Sidebar", description: "Move skills to the sidebar column", icon: IconLayout, instruction: "Move skills to the sidebar", category: "structure" },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface AICommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (instruction: string) => void;
}

export default function AICommandPalette({
  isOpen,
  onClose,
  onExecute,
}: AICommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions
  const filtered = query.trim()
    ? SUGGESTIONS.filter((s) =>
        s.label.toLowerCase().includes(query.toLowerCase()) ||
        s.description.toLowerCase().includes(query.toLowerCase()) ||
        s.instruction.toLowerCase().includes(query.toLowerCase())
      )
    : SUGGESTIONS;

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      // Small delay for animation
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (query.trim() && filtered.length === 0) {
          // Free-form instruction
          onExecute(query.trim());
          onClose();
        } else if (filtered[selectedIndex]) {
          onExecute(filtered[selectedIndex].instruction);
          onClose();
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  }, [filtered, selectedIndex, query, onExecute, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
          >
            <div className="rounded-xl border border-gray-700/60 bg-gray-900/95 shadow-2xl backdrop-blur-md overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/60">
                <IconSearch className="text-gray-500 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command or ask AI anything..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-700 bg-gray-800/60 px-1.5 py-0.5 text-xs text-gray-500">
                  Esc
                </kbd>
              </div>

              {/* Suggestions */}
              <div className="max-h-72 overflow-y-auto py-2">
                {filtered.length > 0 ? (
                  filtered.map((suggestion, idx) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        onExecute(suggestion.instruction);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                        idx === selectedIndex
                          ? "bg-primary-500/10 text-white"
                          : "text-gray-400 hover:bg-gray-800/60"
                      }`}
                    >
                      <suggestion.icon className={`shrink-0 ${idx === selectedIndex ? "text-primary-400" : "text-gray-600"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {suggestion.label}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.description}
                        </div>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                        suggestion.category === "content"
                          ? "bg-blue-500/10 text-blue-400"
                          : suggestion.category === "design"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-green-500/10 text-green-400"
                      }`}>
                        {suggestion.category}
                      </span>
                    </button>
                  ))
                ) : query.trim() ? (
                  <div className="px-4 py-6 text-center">
                    <IconSparkles className="mx-auto text-gray-700 mb-2" />
                    <p className="text-xs text-gray-500 mb-2">
                      No matching commands
                    </p>
                    <p className="text-xs text-gray-400">
                      Press <kbd className="rounded border border-gray-700 bg-gray-800/60 px-1 py-0.5 text-xs">Enter</kbd> to send as a free-form AI instruction
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-800/40 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-gray-700 bg-gray-800/60 px-1 py-0.5">
                    ↑↓
                  </kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-gray-700 bg-gray-800/60 px-1 py-0.5">
                    ↵
                  </kbd>
                  Execute
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-gray-700 bg-gray-800/60 px-1 py-0.5">
                    Esc
                  </kbd>
                  Close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
