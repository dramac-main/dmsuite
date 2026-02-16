"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ── Dropdown ────────────────────────────────────────────────
   Composable dropdown menu with keyboard navigation.

   Usage:
     <Dropdown>
       <DropdownTrigger>
         <button>Open Menu</button>
       </DropdownTrigger>
       <DropdownMenu>
         <DropdownItem onClick={() => {}}>Edit</DropdownItem>
         <DropdownSeparator />
         <DropdownItem onClick={() => {}} destructive>Delete</DropdownItem>
       </DropdownMenu>
     </Dropdown>
   ──────────────────────────────────────────────────────────── */

interface DropdownContextType {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const DropdownContext = createContext<DropdownContextType>({
  open: false,
  toggle: () => {},
  close: () => {},
});

/* ── Root ──────────────────────────────────────────────────── */

export function Dropdown({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((p) => !p), []);
  const close = useCallback(() => setOpen(false), []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  return (
    <DropdownContext.Provider value={{ open, toggle, close }}>
      <div ref={containerRef} className={cn("relative inline-flex", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

/* ── Trigger ───────────────────────────────────────────────── */

export function DropdownTrigger({ children }: { children: ReactNode }) {
  const { toggle } = useContext(DropdownContext);
  return <div onClick={toggle}>{children}</div>;
}

/* ── Menu ──────────────────────────────────────────────────── */

export function DropdownMenu({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  const { open } = useContext(DropdownContext);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "absolute top-full mt-1.5 z-500 min-w-44 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl shadow-black/10 dark:shadow-black/30 p-1",
            align === "right" ? "right-0" : "left-0",
            className
          )}
          role="menu"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Item ──────────────────────────────────────────────────── */

export function DropdownItem({
  children,
  onClick,
  icon,
  destructive = false,
  disabled = false,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const { close } = useContext(DropdownContext);

  return (
    <button
      onClick={() => {
        if (disabled) return;
        onClick?.();
        close();
      }}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left",
        destructive
          ? "text-error hover:bg-error/10"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      role="menuitem"
    >
      {icon && <span className="size-4 shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

/* ── Separator ─────────────────────────────────────────────── */

export function DropdownSeparator() {
  return (
    <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" role="separator" />
  );
}

/* ── Label ─────────────────────────────────────────────────── */

export function DropdownLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500",
        className
      )}
    >
      {children}
    </span>
  );
}
