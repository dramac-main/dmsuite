"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// =============================================================================
// DMSuite — Global Accordion Component
// Single-open accordion: when one section opens, all others close.
// Used across ALL workspace tool panels for consistent UX.
// =============================================================================

/* ── Context ──────────────────────────────────────────────── */

interface AccordionContextValue {
  openId: string | null;
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue>({
  openId: null,
  toggle: () => {},
});

/* ── Accordion Root ───────────────────────────────────────── */

interface AccordionProps {
  /** Which section ID starts open (optional) */
  defaultOpen?: string;
  children: ReactNode;
  className?: string;
}

export function Accordion({ defaultOpen, children, className = "" }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen ?? null);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <AccordionContext.Provider value={{ openId, toggle }}>
      <div className={`space-y-2 ${className}`}>{children}</div>
    </AccordionContext.Provider>
  );
}

/* ── Accordion Section ────────────────────────────────────── */

interface AccordionSectionProps {
  id: string;
  icon?: ReactNode;
  label: string;
  badge?: string | number;
  children: ReactNode;
  className?: string;
}

export function AccordionSection({
  id,
  icon,
  label,
  badge,
  children,
  className = "",
}: AccordionSectionProps) {
  const { openId, toggle } = useContext(AccordionContext);
  const isOpen = openId === id;

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isOpen
          ? "border-primary-500/30 bg-white dark:bg-gray-900/80"
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60"
      } ${className}`}
    >
      <button
        onClick={() => toggle(id)}
        className="flex items-center gap-1.5 w-full p-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${id}`}
      >
        {icon}
        <span className="truncate">{label}</span>
        {badge !== undefined && (
          <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary-500/15 text-primary-500">
            {badge}
          </span>
        )}
        <svg
          className={`size-3 ml-auto shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        id={`accordion-content-${id}`}
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
        role="region"
        aria-labelledby={`accordion-trigger-${id}`}
      >
        <div className="px-3 pb-3">{children}</div>
      </div>
    </div>
  );
}

/* ── Hook for external control ────────────────────────────── */

export function useAccordion(defaultOpen?: string) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen ?? null);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  const open = useCallback((id: string) => {
    setOpenId(id);
  }, []);

  const close = useCallback(() => {
    setOpenId(null);
  }, []);

  return { openId, toggle, open, close, isOpen: (id: string) => openId === id };
}
