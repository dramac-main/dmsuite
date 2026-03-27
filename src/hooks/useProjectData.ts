// =============================================================================
// DMSuite — useProjectData Hook
// Bridges the project store with persistent storage.
//
// Storage strategy (write-through cache):
//   WRITE: workspace → IndexedDB (fast local cache) + Supabase (durable server)
//   READ:  IndexedDB first (cache hit) → fall back to Supabase → fresh project
//
// This ensures:
//   1. Fast loads (IndexedDB is synchronous-ish, no network)
//   2. Cross-device sync (Supabase is the authoritative source)
//   3. Offline resilience (IndexedDB works without network)
//   4. Data survives "Clear site data" (Supabase has the copy)
// =============================================================================

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useProjectStore } from "@/stores/projects";
import {
  saveProjectData,
  loadProjectData,
  migrateLegacyData,
} from "@/lib/project-data";
import {
  saveProjectDataRemote,
  loadProjectDataRemote,
} from "@/lib/supabase/projects";
import { getOrCreateAdapter } from "@/lib/store-adapters";

// ---------------------------------------------------------------------------
// Store snapshot extractors & restorers — per-tool mapping
// ---------------------------------------------------------------------------

/**
 * Registry of get/set functions for each workspace tool's Zustand store.
 * This allows the project system to snapshot + restore any tool's state
 * without tight coupling.
 */
export interface StoreAdapter {
  getSnapshot: () => Record<string, unknown>;
  restoreSnapshot: (data: Record<string, unknown>) => void;
  resetStore: () => void;
  /** Optional: subscribe to store changes for automatic save detection */
  subscribe?: (cb: () => void) => () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseProjectDataOptions {
  toolId: string;
  projectId: string | null;
}

interface UseProjectDataReturn {
  /** Whether project data is currently loading */
  isLoading: boolean;
  /** Whether data has been loaded at least once */
  isLoaded: boolean;
  /** Whether the current project's data is loaded and ready to render */
  isReady: boolean;
  /** Current project ID */
  projectId: string | null;
  /** Save current workspace state to storage (IndexedDB + Supabase) */
  saveToProject: () => Promise<void>;
  /** Load project data from storage into the workspace store */
  loadFromProject: () => Promise<boolean>;
}

export function useProjectData({
  toolId,
  projectId,
}: UseProjectDataOptions): UseProjectDataReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const loadedProjectRef = useRef<string | null>(null);
  /** Guard: suppresses workspace:save events during project transitions */
  const isTransitioningRef = useRef(false);
  /** Generation counter — prevents stale async loads from corrupting state */
  const loadGenRef = useRef(0);
  /** Tracks which project ID has been fully loaded — drives isReady */
  const [readyProjectId, setReadyProjectId] = useState<string | null>(null);
  const updateProject = useProjectStore((s) => s.updateProject);

  // ── Debounced Supabase save (3s) — IndexedDB is immediate ──
  const supabaseSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Track last failed Supabase save for retry on next attempt */
  const pendingSupabaseSaveRef = useRef<{
    projectId: string;
    toolId: string;
    snapshot: Record<string, unknown>;
  } | null>(null);

  // Flush pending Supabase save (used before project switch or unmount)
  const flushSupabaseSave = useCallback(() => {
    if (supabaseSaveTimerRef.current) {
      clearTimeout(supabaseSaveTimerRef.current!);
      supabaseSaveTimerRef.current = null;
    }
    const pending = pendingSupabaseSaveRef.current;
    if (pending) {
      pendingSupabaseSaveRef.current = null;
      saveProjectDataRemote(pending.projectId, pending.toolId, pending.snapshot).catch(() => {});
    }
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      // Flush any pending Supabase save on unmount
      if (supabaseSaveTimerRef.current) clearTimeout(supabaseSaveTimerRef.current);
      const pending = pendingSupabaseSaveRef.current;
      if (pending) {
        saveProjectDataRemote(pending.projectId, pending.toolId, pending.snapshot).catch(() => {});
        pendingSupabaseSaveRef.current = null;
      }
    };
  }, []);

  // ── Save: write-through to IndexedDB (immediate) + Supabase (debounced) ──
  const saveToProject = useCallback(async () => {
    if (!projectId) return;
    // Don't save during project transitions — the store may still hold
    // old project data while the new project is being loaded/reset.
    if (isTransitioningRef.current) return;
    const adapter = getOrCreateAdapter(toolId);

    try {
      const snapshot = adapter.getSnapshot();
      if (Object.keys(snapshot).length === 0) return;

      // 1. Save to IndexedDB (fast local cache — immediate)
      await saveProjectData(projectId, toolId, snapshot);

      // 2. Save to Supabase (debounced 3s — batches rapid edits into one network write)
      if (supabaseSaveTimerRef.current) clearTimeout(supabaseSaveTimerRef.current);
      pendingSupabaseSaveRef.current = { projectId, toolId, snapshot };
      supabaseSaveTimerRef.current = setTimeout(() => {
        const pending = pendingSupabaseSaveRef.current;
        if (!pending) return;
        pendingSupabaseSaveRef.current = null;
        saveProjectDataRemote(pending.projectId, pending.toolId, pending.snapshot).catch((err) => {
          console.warn("[ProjectData] Supabase save failed (will retry next save):", err);
          // Re-queue for retry on next save attempt
          pendingSupabaseSaveRef.current = pending;
        });
      }, 3000);

      updateProject(projectId, { hasData: true });
    } catch (err) {
      console.warn("[ProjectData] Save failed:", err);
    }
  }, [projectId, toolId, updateProject]);

  // ── Load: try IndexedDB cache first, then Supabase, then fresh ──
  const loadFromProject = useCallback(async (): Promise<boolean> => {
    if (!projectId) return false;
    const adapter = getOrCreateAdapter(toolId);
    // Increment generation so older in-flight loads become no-ops
    const gen = ++loadGenRef.current;

    try {
      isTransitioningRef.current = true;
      setIsLoading(true);

      // ── Step 1: Try IndexedDB (fast local cache) ──
      let snapshot = await loadProjectData(projectId);

      // ── Step 2: If no local cache, try Supabase (server) ──
      if (!snapshot) {
        const serverData = await loadProjectDataRemote(projectId);
        if (serverData?.data && Object.keys(serverData.data).length > 0) {
          // Cache to IndexedDB for next time
          await saveProjectData(projectId, toolId, serverData.data as Record<string, unknown>).catch(() => {});
          snapshot = {
            projectId,
            toolId,
            data: serverData.data as Record<string, unknown>,
            savedAt: serverData.saved_at,
            sizeBytes: serverData.size_bytes,
          };
        }
      }

      // ── Step 3: If still nothing, try legacy migration (one-time) ──
      if (!snapshot) {
        const migrated = await migrateLegacyData(projectId, toolId);
        if (migrated) {
          snapshot = await loadProjectData(projectId);
          // Push migrated data to Supabase
          if (snapshot?.data) {
            saveProjectDataRemote(projectId, toolId, snapshot.data).catch(() => {});
          }
        }
      }

      // Bail out if a newer load has started while we were awaiting
      if (gen !== loadGenRef.current) return false;

      if (snapshot?.data && Object.keys(snapshot.data).length > 0) {
        adapter.restoreSnapshot(snapshot.data);
        loadedProjectRef.current = projectId;
        updateProject(projectId, { hasData: true });
        setIsLoaded(true);
        setReadyProjectId(projectId);
        return true;
      }

      // ── No data anywhere — reset store for a completely fresh project ──
      adapter.resetStore();
      loadedProjectRef.current = projectId;
      setIsLoaded(true);
      setReadyProjectId(projectId);
      return false;
    } catch (err) {
      // Bail out if a newer load has started
      if (gen !== loadGenRef.current) return false;
      console.warn("[ProjectData] Load failed:", err);
      // Reset store on error to prevent stale data
      adapter.resetStore();
      loadedProjectRef.current = projectId;
      setIsLoaded(true);
      setReadyProjectId(projectId);
      return false;
    } finally {
      // Only clear transition guard if this is still the latest load.
      if (gen === loadGenRef.current) {
        setIsLoading(false);
        isTransitioningRef.current = false;
      }
    }
  }, [projectId, toolId, updateProject]);

  // Auto-load when project ID changes
  useEffect(() => {
    if (!projectId || projectId === loadedProjectRef.current) return;
    // Flush any pending Supabase save from the previous project
    flushSupabaseSave();
    loadFromProject();
  }, [projectId, loadFromProject, flushSupabaseSave]);

  // Listen for workspace:save events → persist to storage
  useEffect(() => {
    if (!projectId) return;

    const handleSave = () => {
      saveToProject();
    };

    window.addEventListener("workspace:save", handleSave);
    return () => window.removeEventListener("workspace:save", handleSave);
  }, [projectId, saveToProject]);

  // ── Direct store subscription for auto-save ──
  // Subscribes to the Zustand store changes so ALL tools with adapters
  // get automatic persistence — no need for each workspace to dispatch
  // workspace:dirty/workspace:save events.
  useEffect(() => {
    if (!projectId) return;
    const adapter = getOrCreateAdapter(toolId);
    if (!adapter.subscribe) return; // Generic adapter — no subscription

    let lastJson = JSON.stringify(adapter.getSnapshot());
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const unsub = adapter.subscribe(() => {
      // Don't save during project transitions
      if (isTransitioningRef.current) return;

      const currentJson = JSON.stringify(adapter.getSnapshot());
      if (currentJson === lastJson) return;
      lastJson = currentJson;

      // Debounce: save 1.5s after last store change
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        saveToProject();
      }, 1500);
    });

    return () => {
      unsub();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [projectId, toolId, saveToProject]);

  return {
    isLoading,
    isLoaded,
    isReady: readyProjectId === projectId && !isLoading,
    projectId,
    saveToProject,
    loadFromProject,
  };
}
