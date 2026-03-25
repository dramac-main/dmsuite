import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ExportEntry {
  id: string;
  toolId: string;
  toolName: string;
  format: string;
  fileName: string;
  timestamp: number;
}

interface ExportHistoryState {
  exports: ExportEntry[];
  addExport: (entry: Omit<ExportEntry, "id" | "timestamp">) => void;
  removeExport: (id: string) => void;
  clearAll: () => void;
}

export const useExportHistoryStore = create<ExportHistoryState>()(
  persist(
    (set) => ({
      exports: [],

      addExport: (entry) =>
        set((s) => ({
          exports: [
            { ...entry, id: crypto.randomUUID(), timestamp: Date.now() },
            ...s.exports,
          ].slice(0, 100),
        })),

      removeExport: (id) =>
        set((s) => ({ exports: s.exports.filter((e) => e.id !== id) })),

      clearAll: () => set({ exports: [] }),
    }),
    { name: "dmsuite-export-history" }
  )
);
