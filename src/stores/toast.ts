import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

let _counter = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  addToast: (type, message, duration = 3500) => {
    const id = `toast-${++_counter}-${Date.now()}`;
    set((s) => ({
      toasts: [...s.toasts.slice(-4), { id, type, message, duration }],
    }));
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/* ── Convenience helpers — import these anywhere ── */

export const toast = {
  success: (msg: string, duration?: number) =>
    useToastStore.getState().addToast("success", msg, duration),
  error: (msg: string, duration?: number) =>
    useToastStore.getState().addToast("error", msg, duration),
  info: (msg: string, duration?: number) =>
    useToastStore.getState().addToast("info", msg, duration),
  warning: (msg: string, duration?: number) =>
    useToastStore.getState().addToast("warning", msg, duration),
};
