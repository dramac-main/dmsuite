// =============================================================================
// DMSuite — Revision History Store (Task 2.2.2)
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RevisionHistoryEntry, RevisionRequest, RevisionResult } from "@/lib/ai-revision";
import type { Layer } from "@/lib/canvas-layers";
import { v4 as uuidv4 } from "uuid";

interface LockedLayerProperty {
  layerId: string;
  properties: string[];
}

interface RevisionHistoryState {
  /** All revision entries per document */
  entries: Record<string, RevisionHistoryEntry[]>;
  /** Locked properties per document */
  lockedProperties: Record<string, LockedLayerProperty[]>;

  /** Add a revision entry */
  addEntry: (
    documentId: string,
    request: RevisionRequest,
    result: RevisionResult,
    before: { layers: Layer[]; layerOrder: string[] },
    after: { layers: Layer[]; layerOrder: string[] }
  ) => void;

  /** Get entries for a document */
  getEntries: (documentId: string) => RevisionHistoryEntry[];

  /** Clear entries for a document */
  clearEntries: (documentId: string) => void;

  /** Lock a property on a layer */
  lockProperty: (documentId: string, layerId: string, property: string) => void;

  /** Unlock a property on a layer */
  unlockProperty: (documentId: string, layerId: string, property: string) => void;

  /** Toggle lock on a layer property */
  toggleLock: (documentId: string, layerId: string, property: string) => void;

  /** Check if a property is locked */
  isPropertyLocked: (documentId: string, layerId: string, property: string) => boolean;

  /** Get all locked properties for a document */
  getLockedProperties: (documentId: string) => LockedLayerProperty[];
}

export const useRevisionHistoryStore = create<RevisionHistoryState>()(
  persist(
    (set, get) => ({
      entries: {},
      lockedProperties: {},

      addEntry: (documentId, request, result, before, after) =>
        set((state) => ({
          entries: {
            ...state.entries,
            [documentId]: [
              ...(state.entries[documentId] ?? []),
              {
                id: uuidv4(),
                timestamp: Date.now(),
                request,
                result,
                beforeSnapshot: before,
                afterSnapshot: after,
              },
            ],
          },
        })),

      getEntries: (documentId) => get().entries[documentId] ?? [],

      clearEntries: (documentId) =>
        set((state) => {
          const { [documentId]: _, ...rest } = state.entries;
          return { entries: rest };
        }),

      lockProperty: (documentId, layerId, property) =>
        set((state) => {
          const docLocks = [...(state.lockedProperties[documentId] ?? [])];
          const existing = docLocks.find((lp) => lp.layerId === layerId);
          if (existing) {
            if (!existing.properties.includes(property)) {
              existing.properties.push(property);
            }
          } else {
            docLocks.push({ layerId, properties: [property] });
          }
          return { lockedProperties: { ...state.lockedProperties, [documentId]: docLocks } };
        }),

      unlockProperty: (documentId, layerId, property) =>
        set((state) => {
          const docLocks = (state.lockedProperties[documentId] ?? []).map((lp) =>
            lp.layerId === layerId
              ? { ...lp, properties: lp.properties.filter((p) => p !== property) }
              : lp
          ).filter((lp) => lp.properties.length > 0);
          return { lockedProperties: { ...state.lockedProperties, [documentId]: docLocks } };
        }),

      toggleLock: (documentId, layerId, property) => {
        if (get().isPropertyLocked(documentId, layerId, property)) {
          get().unlockProperty(documentId, layerId, property);
        } else {
          get().lockProperty(documentId, layerId, property);
        }
      },

      isPropertyLocked: (documentId, layerId, property) => {
        const locks = get().lockedProperties[documentId] ?? [];
        const lp = locks.find((l) => l.layerId === layerId);
        return lp?.properties.includes(property) ?? false;
      },

      getLockedProperties: (documentId) =>
        get().lockedProperties[documentId] ?? [],
    }),
    {
      name: "dmsuite-revision-history",
      partialize: (state) => ({
        lockedProperties: state.lockedProperties,
        // Only keep last 20 entries per document to avoid storage bloat
        entries: Object.fromEntries(
          Object.entries(state.entries).map(([k, v]) => [k, v.slice(-20)])
        ),
      }),
    }
  )
);
