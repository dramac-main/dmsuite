import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "info" | "success" | "warning" | "credit" | "update" | "tool";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  /** Optional link to navigate to */
  href?: string;
  /** Optional tool icon key */
  icon?: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "read" | "timestamp">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;
}

let _nCounter = 0;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (n) => {
        const id = `notif-${++_nCounter}-${Date.now()}`;
        set((s) => ({
          notifications: [
            { ...n, id, read: false, timestamp: Date.now() },
            ...s.notifications.slice(0, 49), // keep max 50
          ],
        }));
      },

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      removeNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),

      clearAll: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: "dmsuite-notifications" }
  )
);

/* ── Notification Mute Preferences ── */
const MUTE_KEY = "dmsuite-notification-mutes";

export function getNotificationMutes(): NotificationType[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MUTE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function setNotificationMutes(mutes: NotificationType[]) {
  localStorage.setItem(MUTE_KEY, JSON.stringify(mutes));
}

function isMuted(type: NotificationType): boolean {
  return getNotificationMutes().includes(type);
}

/* ── Convenience helper — call from anywhere ── */
export const notify = {
  info: (title: string, message: string, href?: string) => {
    if (isMuted("info")) return;
    useNotificationStore.getState().addNotification({ type: "info", title, message, href });
  },
  success: (title: string, message: string, href?: string) => {
    if (isMuted("success")) return;
    useNotificationStore.getState().addNotification({ type: "success", title, message, href });
  },
  warning: (title: string, message: string, href?: string) => {
    if (isMuted("warning")) return;
    useNotificationStore.getState().addNotification({ type: "warning", title, message, href });
  },
  credit: (title: string, message: string, href?: string) => {
    if (isMuted("credit")) return;
    useNotificationStore.getState().addNotification({ type: "credit", title, message, href });
  },
  update: (title: string, message: string, href?: string) => {
    if (isMuted("update")) return;
    useNotificationStore.getState().addNotification({ type: "update", title, message, href });
  },
  tool: (title: string, message: string, href?: string, icon?: string) => {
    if (isMuted("tool")) return;
    useNotificationStore.getState().addNotification({ type: "tool", title, message, href, icon });
  },
};
