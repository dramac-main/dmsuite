import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ToolUsage {
  /** Number of times opened */
  opens: number;
  /** Total seconds spent (approximate, measured per session) */
  totalSeconds: number;
  /** Last opened timestamp */
  lastUsed: number;
}

interface AnalyticsState {
  /** Map of toolId → usage data */
  toolUsage: Record<string, ToolUsage>;
  /** Record a tool open */
  trackOpen: (toolId: string) => void;
  /** Add elapsed seconds for a tool session */
  trackTime: (toolId: string, seconds: number) => void;
  /** Top N most-used tools by open count */
  getTopTools: (n?: number) => { toolId: string; opens: number; totalSeconds: number }[];
  /** Total opens across all tools */
  getTotalOpens: () => number;
  /** Total hours across all tools */
  getTotalHours: () => number;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      toolUsage: {},
      trackOpen: (toolId) =>
        set((s) => {
          const prev = s.toolUsage[toolId] ?? { opens: 0, totalSeconds: 0, lastUsed: 0 };
          return {
            toolUsage: {
              ...s.toolUsage,
              [toolId]: { ...prev, opens: prev.opens + 1, lastUsed: Date.now() },
            },
          };
        }),
      trackTime: (toolId, seconds) =>
        set((s) => {
          const prev = s.toolUsage[toolId] ?? { opens: 0, totalSeconds: 0, lastUsed: 0 };
          return {
            toolUsage: {
              ...s.toolUsage,
              [toolId]: { ...prev, totalSeconds: prev.totalSeconds + seconds },
            },
          };
        }),
      getTopTools: (n = 5) => {
        const entries = Object.entries(get().toolUsage);
        return entries
          .map(([toolId, u]) => ({ toolId, opens: u.opens, totalSeconds: u.totalSeconds }))
          .sort((a, b) => b.opens - a.opens)
          .slice(0, n);
      },
      getTotalOpens: () => {
        return Object.values(get().toolUsage).reduce((sum, u) => sum + u.opens, 0);
      },
      getTotalHours: () => {
        const totalSec = Object.values(get().toolUsage).reduce((sum, u) => sum + u.totalSeconds, 0);
        return Math.round((totalSec / 3600) * 10) / 10;
      },
    }),
    { name: "dmsuite-analytics" }
  )
);
