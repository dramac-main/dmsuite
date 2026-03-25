"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotificationStore, type Notification } from "@/stores/notifications";
import { IconBell } from "@/components/icons";
import { cn } from "@/lib/utils";
import { interactive, recipes } from "@/lib/design-system";

const typeIcons: Record<string, React.ReactNode> = {
  info: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  success: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  warning: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  credit: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  update: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  tool: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
};

const typeColors: Record<string, string> = {
  info: "bg-blue-500/15 text-blue-500",
  success: "bg-emerald-500/15 text-emerald-500",
  warning: "bg-amber-500/15 text-amber-500",
  credit: "bg-primary-500/15 text-primary-500",
  update: "bg-secondary-500/15 text-secondary-500",
  tool: "bg-primary-500/15 text-primary-500",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Notification bell button + dropdown panel.
 * Drop-in replacement for the static bell in TopBar.
 */
export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.href) {
      setOpen(false);
      router.push(n.href);
    }
  };

  return (
    <div className="relative" ref={panelRef} data-tour="notifications">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(interactive.iconButton, "relative")}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <IconBell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[28rem] rounded-2xl border border-white/10 dark:border-white/[0.06] bg-white dark:bg-gray-900 shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800/60">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-medium text-primary-500 hover:text-primary-400 transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[11px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[22rem]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <IconBell className="size-8 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  We&apos;ll notify you about important updates
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/30 transition-colors",
                    n.href ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40" : "",
                    !n.read && "bg-primary-500/[0.03] dark:bg-primary-500/[0.04]"
                  )}
                  onClick={() => handleClick(n)}
                >
                  {/* Icon */}
                  <div className={cn("shrink-0 size-8 rounded-lg flex items-center justify-center mt-0.5", typeColors[n.type] || typeColors.info)}>
                    {typeIcons[n.type] || typeIcons.info}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-xs font-semibold", n.read ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white")}>
                        {n.title}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(n.id);
                        }}
                        className="shrink-0 size-5 rounded flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                        aria-label="Dismiss"
                      >
                        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      {timeAgo(n.timestamp)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <span className="shrink-0 size-2 rounded-full bg-primary-500 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
