"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { suiteNavGroups } from "@/data/tools";
import { getIcon, IconSearch, IconChevronLeft, IconSparkles } from "@/components/icons";
import { useSidebarStore } from "@/stores/sidebar";
import {
  sidebar as sidebarConfig,
  surfaces,
  borders,
  typography,
  interactive,
  animations,
  gradients,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";

/* ── Shared recipes (inline to avoid circular imports) ───────── */
const LOGO_MARK =
  "size-9 rounded-xl bg-linear-to-br from-primary-500 to-secondary-500 shrink-0 flex items-center justify-center shadow-lg shadow-primary-500/25 ring-1 ring-white/10";

/** Inline pin icon (Bootstrap-style thumbtack) */
const PinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5a.5.5 0 0 1-1 0V10h-4A.5.5 0 0 1 3 9.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z" />
  </svg>
);

/**
 * Sidebar — Hover-to-expand with optional pin.
 *
 * Desktop behaviour:
 *  • Default — collapsed (icons only, w-16). Content has lg:ml-16.
 *  • Hover   — expands to w-64 as an **overlay** with shadow. No layout shift.
 *  • Pinned  — expanded permanently, pushes content (lg:ml-64).
 *
 * Mobile — unchanged: overlay drawer with swipe-to-close.
 *
 * All state lives in `useSidebarStore` (Zustand, persisted).
 * All dimensions/timings come from `design-system.ts`.
 */
export default function Sidebar() {
  const {
    mobileOpen,
    hovered,
    pinned,
    closeMobile,
    setHovered,
    togglePinned,
  } = useSidebarStore();

  const sidebarRef = useRef<HTMLElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  /** Whether the desktop sidebar shows expanded content */
  const isExpanded = pinned || hovered;
  /** Overlay mode = hover-expanded but not pinned (floats over content) */
  const isOverlay = hovered && !pinned;

  // ── Hover handlers (debounced) ────────────────────────────────
  const handleMouseEnter = useCallback(() => {
    if (pinned) return; // already expanded
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHovered(true);
    }, sidebarConfig.hoverExpandDelay);
  }, [pinned, setHovered]);

  const handleMouseLeave = useCallback(() => {
    if (pinned) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHovered(false);
    }, sidebarConfig.hoverCollapseDelay);
  }, [pinned, setHovered]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // ── Close on navigation (mobile) ─────────────────────────────
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname && mobileOpen) {
      closeMobile();
    }
    prevPathname.current = pathname;
  }, [pathname, mobileOpen, closeMobile]);

  // ── Collapse hover on navigation (desktop) ───────────────────
  useEffect(() => {
    // When navigating via a link the hover state can linger; clear it.
    setHovered(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ── Focus trap when mobile sidebar is open ───────────────────
  useEffect(() => {
    if (!mobileOpen) return;
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const focusable = sidebar.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trap);
    return () => window.removeEventListener("keydown", trap);
  }, [mobileOpen]);

  // ── Swipe-to-close handler (mobile) ──────────────────────────
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -80 || info.velocity.x < -300) {
        closeMobile();
      }
    },
    [closeMobile]
  );

  // ── Shared content renderer ──────────────────────────────────
  function renderNavContent(isCollapsed: boolean, isMobile: boolean) {
    return (
      <>
        {/* Logo row */}
        <div className="flex items-center h-14 px-4 shrink-0">
          <div className={LOGO_MARK}>
            <IconSparkles className="size-4 text-gray-950" />
          </div>

          {!isCollapsed && (
            <span className={cn("ml-3", typography.logo)}>
              DM<span className="text-primary-500">Suite</span>
            </span>
          )}

          {/* Pin / close button — only visible when expanded */}
          {!isCollapsed && (
            <button
              onClick={isMobile ? closeMobile : togglePinned}
              className={cn(interactive.iconButtonSm, "ml-auto")}
              aria-label={
                isMobile
                  ? "Close menu"
                  : pinned
                    ? "Unpin sidebar"
                    : "Pin sidebar open"
              }
              title={
                isMobile
                  ? "Close menu"
                  : pinned
                    ? "Unpin sidebar"
                    : "Pin sidebar open"
              }
            >
              {isMobile ? (
                <IconChevronLeft className="size-4" />
              ) : (
                <PinIcon
                  className={cn(
                    "size-3.5 transition-all duration-200",
                    pinned
                      ? "text-primary-500 rotate-0"
                      : "text-gray-400 rotate-45 hover:text-gray-200"
                  )}
                />
              )}
            </button>
          )}
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="px-3 mb-2">
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search tools..."
                className={interactive.searchInput}
              />
            </div>
          </div>
        )}

        {/* Nav groups */}
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 space-y-4 mt-2 scrollbar-thin">
          {suiteNavGroups.map((group) => (
            <div key={group.label}>
              {!isCollapsed && (
                <span className={cn("block px-2 mb-1.5", typography.label)}>
                  {group.label}
                </span>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = getIcon(item.icon);
                  const isActive =
                    item.active ||
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 h-10 rounded-lg",
                          animations.fast,
                          isCollapsed ? "justify-center px-0" : "px-3",
                          isActive ? surfaces.activeItem : interactive.navItem
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                        {!isCollapsed && (
                          <span className="text-sm truncate">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Pro badge at bottom */}
        {!isCollapsed && (
          <div className="p-3 shrink-0">
            <div
              className={cn(
                "rounded-xl p-4",
                gradients.brandSubtle,
                borders.accent
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <IconSparkles className="size-4 text-primary-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Every tool uses advanced AI to deliver jaw-dropping results.
              </p>
            </div>
          </div>
        )}
        {isCollapsed && <div className="h-4 shrink-0" />}
      </>
    );
  }

  return (
    <>
      {/* ── Mobile overlay backdrop ────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={animations.fade}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={closeMobile}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar (hover-to-expand + pin) ────────────── */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "fixed top-0 left-0 z-50 h-dvh flex-col overflow-hidden",
          surfaces.sidebar,
          borders.sidebar,
          sidebarConfig.transition,
          isExpanded ? sidebarConfig.expandedWidth : sidebarConfig.collapsedWidth,
          // Overlay shadow when hover-expanded (not pinned)
          isOverlay && sidebarConfig.overlayShadow,
          "hidden lg:flex"
        )}
      >
        {renderNavContent(!isExpanded, false)}
      </aside>

      {/* ── Mobile sidebar — slide-in with swipe-to-close ──────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            ref={sidebarRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={animations.sidebarSpring}
            drag="x"
            dragConstraints={{ left: -sidebarConfig.expandedPx, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed top-0 left-0 z-50 h-dvh flex flex-col lg:hidden",
              sidebarConfig.expandedWidth,
              surfaces.sidebar,
              borders.sidebar
            )}
            role="dialog"
            aria-label="Navigation menu"
          >
            {renderNavContent(false, true)}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
