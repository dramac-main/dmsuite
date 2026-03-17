"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useChikoStore } from "@/stores/chiko";
import { Chiko3DAvatar } from "./Chiko3DAvatar";

/* ── Chiko FAB ───────────────────────────────────────────────
   Floating Action Button — 3D Chiko character always visible.
   Features:
   - 3D animated robot avatar with glow & expressions
   - Spinning conic-gradient ring on hover
   - Notification pulse with badge
   - Breathing ambient glow (cyan/primary)
   - Keyboard shortcut: Ctrl+.
   - Mobile-safe: positioned above MobileBottomNav (h-14)
   - Touch-friendly 64px tap target
   - Tooltip on hover (desktop only)
   - Hides when panel is open
   ──────────────────────────────────────────────────────────── */

export function ChikoFAB() {
  const { isOpen, toggle, hasNotification, isMinimized } = useChikoStore();
  const [hovered, setHovered] = useState(false);

  // ── Keyboard shortcut: Ctrl+. ────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ".") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && isOpen) {
        useChikoStore.getState().close();
      }
    },
    [toggle, isOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.3, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.3, y: 30 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            "fixed z-[89]",
            // Mobile: above MobileBottomNav (h-14 = 3.5rem) + safe-area
            "bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-3",
            // sm+: normal bottom-right positioning (no MobileBottomNav)
            "sm:bottom-6 sm:right-6"
          )}
        >
          {/* Tooltip — desktop only */}
          <div className="pointer-events-none absolute bottom-full right-0 mb-3 hidden sm:block">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.4 }}
              className="whitespace-nowrap rounded-xl bg-gray-800/95 px-3.5 py-2 text-xs text-gray-300 shadow-xl shadow-black/30 backdrop-blur-md"
            >
              <span className="font-semibold text-white">Ask Chiko</span>
              <span className="mx-1.5 text-gray-600">·</span>
              <kbd className="rounded bg-gray-700/60 px-1.5 py-0.5 font-mono text-[10px] text-gray-400">Ctrl+.</kbd>
              <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-gray-800/95" />
            </motion.div>
          </div>

          {/* ── Ambient pulsing glow behind FAB ────────── */}
          <motion.div
            className="absolute inset-[-8px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(138,230,0,0.08) 50%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Main button */}
          <motion.button
            onClick={toggle}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "group relative flex h-16 w-16 items-center justify-center rounded-full",
              "bg-gray-900/95 shadow-2xl shadow-black/40 backdrop-blur-lg",
              "border border-gray-700/30 transition-all duration-300",
              "hover:border-secondary-500/50 hover:shadow-secondary-500/20 hover:shadow-2xl",
              "focus:outline-none focus:ring-2 focus:ring-secondary-500/40 focus:ring-offset-2 focus:ring-offset-gray-950",
              "active:scale-90"
            )}
            aria-label="Open Chiko AI Assistant (Ctrl+.)"
          >
            {/* Spinning conic-gradient ring */}
            <motion.div
              className="absolute inset-[-2px] rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #06b6d4, #8ae600, #06b6d4, #8ae600, #06b6d4)",
                filter: "blur(4px)",
              }}
              animate={{
                rotate: 360,
                opacity: hovered ? 0.9 : 0.3,
              }}
              transition={{
                rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                opacity: { duration: 0.3 },
              }}
            />

            {/* Inner dark mask */}
            <div className="absolute inset-[2px] rounded-full bg-gray-900/98" />

            {/* 3D Chiko Avatar */}
            <div className="relative z-10">
              <Chiko3DAvatar
                size="sm"
                animated
                showGlow={false}
                expression={isMinimized ? "greeting" : hovered ? "happy" : "idle"}
              />
            </div>

            {/* Notification badge */}
            <AnimatePresence>
              {hasNotification && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -right-0.5 -top-0.5 z-20"
                >
                  <span className="relative flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                    <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[8px] font-bold text-gray-950">
                      !
                    </span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
