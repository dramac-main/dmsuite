"use client";

import { useEffect, useState } from "react";
import { useToastStore, type Toast as ToastItem } from "@/stores/toast";

const iconMap: Record<string, React.ReactNode> = {
  success: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  warning: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const colorMap: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  error: "bg-red-500/15 text-red-500 border-red-500/20",
  warning: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  info: "bg-blue-500/15 text-blue-500 border-blue-500/20",
};



function SingleToast({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const t = setTimeout(() => setExiting(true), toast.duration - 300);
    return () => clearTimeout(t);
  }, [toast.duration]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl
        bg-gray-900/90 dark:bg-gray-900/95 shadow-2xl shadow-black/20
        transition-all duration-300 max-w-sm w-full
        ${exiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
      `}
      role="alert"
    >
      <div className={`shrink-0 size-7 rounded-lg flex items-center justify-center ${colorMap[toast.type]}`}>
        {iconMap[toast.type]}
      </div>
      <p className="text-sm font-medium text-gray-100 flex-1 min-w-0">
        {toast.message}
      </p>
      <button
        onClick={onRemove}
        className="shrink-0 size-6 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Global toast container — mount once in root layout.
 * Renders up to 5 toasts at bottom-center of the viewport.
 */
export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-100
        flex flex-col-reverse items-center gap-2 pointer-events-none"
      aria-live="polite"
      style={{ zIndex: 100 }}
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <SingleToast toast={t} onRemove={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
}
