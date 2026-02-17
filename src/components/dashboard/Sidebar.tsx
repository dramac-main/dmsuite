"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { suiteNavGroups } from "@/data/tools";
import { iconMap, IconSearch, IconChevronLeft, IconSparkles } from "@/components/icons";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Close on navigation (mobile)
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname && mobileOpen) {
      onMobileClose();
    }
    prevPathname.current = pathname;
  }, [pathname, mobileOpen, onMobileClose]);

  // Focus trap when mobile sidebar is open
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

  // Swipe-to-close handler
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Close if swiped left > 80px or velocity > 300
      if (info.offset.x < -80 || info.velocity.x < -300) {
        onMobileClose();
      }
    },
    [onMobileClose]
  );

  return (
    <>
      {/* Mobile overlay with backdrop blur */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — Desktop: static, Mobile: slide-in with swipe-to-close */}
      {/* Desktop sidebar (always rendered) */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 z-50 h-dvh flex-col
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-700
          transition-all duration-200 ease-in-out
          ${collapsed ? "w-18" : "w-60"}
          hidden lg:flex
        `}
      >
        {/* Logo row */}
        <div className="flex items-center h-14 px-4 shrink-0">
          {/* Animated logo */}
          <div className="size-8 rounded-lg bg-linear-to-br from-primary-500 to-secondary-500 shrink-0 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <IconSparkles className="size-4 text-gray-950" />
          </div>

          {!collapsed && (
            <span className="ml-3 text-base font-bold text-gray-900 dark:text-white tracking-tight">
              DM<span className="text-primary-500">Suite</span>
            </span>
          )}

          <button
            onClick={() => {
              setCollapsed(!collapsed);
              onMobileClose();
            }}
            className="ml-auto flex items-center justify-center size-7 rounded-md
              text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <IconChevronLeft
              className={`size-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 mb-2">
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search tools..."
                className="w-full h-9 rounded-lg pl-9 pr-3
                  bg-gray-100 dark:bg-gray-800/50
                  border border-gray-200 dark:border-gray-700/50
                  text-sm text-gray-900 dark:text-gray-200
                  placeholder:text-gray-500
                  focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50
                  transition-all"
              />
            </div>
          </div>
        )}

        {/* Nav groups */}
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 space-y-4 mt-2 scrollbar-thin">
          {suiteNavGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <span className="block px-2 mb-1.5 text-[0.625rem] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {group.label}
                </span>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className={`
                          flex items-center gap-3 h-10 rounded-lg transition-all duration-150
                          ${collapsed ? "justify-center px-0" : "px-3"}
                          ${
                            item.active
                              ? "bg-primary-500 text-gray-950 font-semibold shadow-sm shadow-primary-500/20"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-200"
                          }
                        `}
                      >
                        {Icon && <Icon className="size-5 shrink-0" />}
                        {!collapsed && (
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
        {!collapsed && (
          <div className="p-3 shrink-0">
            <div className="rounded-xl bg-linear-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconSparkles className="size-4 text-primary-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">AI Powered</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Every tool uses advanced AI to deliver jaw-dropping results.
              </p>
            </div>
          </div>
        )}
        {collapsed && <div className="h-4 shrink-0" />}
      </aside>

      {/* Mobile sidebar — slide-in with swipe-to-close */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            ref={sidebarRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: -260, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="fixed top-0 left-0 z-50 h-dvh w-60 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 lg:hidden"
            role="dialog"
            aria-label="Navigation menu"
          >
            {/* Logo row */}
            <div className="flex items-center h-14 px-4 shrink-0">
              <div className="size-8 rounded-lg bg-linear-to-br from-primary-500 to-secondary-500 shrink-0 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <IconSparkles className="size-4 text-gray-950" />
              </div>
              <span className="ml-3 text-base font-bold text-gray-900 dark:text-white tracking-tight">
                DM<span className="text-primary-500">Suite</span>
              </span>
              <button
                onClick={onMobileClose}
                className="ml-auto flex items-center justify-center size-7 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close navigation"
              >
                <IconChevronLeft className="size-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 mb-2">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  className="w-full h-9 rounded-lg pl-9 pr-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all"
                />
              </div>
            </div>

            {/* Nav groups */}
            <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 space-y-4 mt-2 scrollbar-thin">
              {suiteNavGroups.map((group) => (
                <div key={group.label}>
                  <span className="block px-2 mb-1.5 text-[0.625rem] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {group.label}
                  </span>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = iconMap[item.icon];
                      return (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 h-10 rounded-lg px-3 transition-all duration-150 ${
                              item.active
                                ? "bg-primary-500 text-gray-950 font-semibold shadow-sm shadow-primary-500/20"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                          >
                            {Icon && <Icon className="size-5 shrink-0" />}
                            <span className="text-sm truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Pro badge */}
            <div className="p-3 shrink-0">
              <div className="rounded-xl bg-linear-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconSparkles className="size-4 text-primary-500" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">AI Powered</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Every tool uses advanced AI to deliver jaw-dropping results.
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
