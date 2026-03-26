// =============================================================================
// DMSuite — useProjectData Hook
// Bridges the project store with IndexedDB data storage.
// Handles loading project data into workspace stores and saving back.
// =============================================================================

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useProjectStore } from "@/stores/projects";
import {
  saveProjectData,
  loadProjectData,
  migrateLegacyData,
} from "@/lib/project-data";
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
  /** Current project ID */
  projectId: string | null;
  /** Save current workspace state to the project's IndexedDB slot */
  saveToProject: () => Promise<void>;
  /** Load project data from IndexedDB into the workspace store */
  loadFromProject: () => Promise<boolean>;
}

export function useProjectData({
  toolId,
  projectId,
}: UseProjectDataOptions): UseProjectDataReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const loadedProjectRef = useRef<string | null>(null);
  const updateProject = useProjectStore((s) => s.updateProject);

  // Save current workspace data to IndexedDB
  const saveToProject = useCallback(async () => {
    if (!projectId) return;
    const adapter = getOrCreateAdapter(toolId);

    try {
      const snapshot = adapter.getSnapshot();
      // Only save if there's actual data
      if (Object.keys(snapshot).length > 0) {
        await saveProjectData(projectId, toolId, snapshot);
        updateProject(projectId, { hasData: true });
      }
    } catch (err) {
      console.warn("[ProjectData] Save failed:", err);
    }
  }, [projectId, toolId, updateProject]);

  // Load project data from IndexedDB and restore into workspace store
  const loadFromProject = useCallback(async (): Promise<boolean> => {
    if (!projectId) return false;
    const adapter = getOrCreateAdapter(toolId);

    try {
      setIsLoading(true);

      // Try loading from IndexedDB first
      let snapshot = await loadProjectData(projectId);

      // If no data, attempt legacy migration
      if (!snapshot) {
        const migrated = await migrateLegacyData(projectId, toolId);
        if (migrated) {
          snapshot = await loadProjectData(projectId);
        }
      }

      if (snapshot?.data && Object.keys(snapshot.data).length > 0) {
        adapter.restoreSnapshot(snapshot.data);
        loadedProjectRef.current = projectId;
        updateProject(projectId, { hasData: true });
        setIsLoaded(true);
        return true;
      }

      // No existing data — ensure store is reset for fresh project
      adapter.resetStore();
      setIsLoaded(true);
      return false;
    } catch (err) {
      console.warn("[ProjectData] Load failed:", err);
      setIsLoaded(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [projectId, toolId, updateProject]);

  // Auto-load when project ID changes
  useEffect(() => {
    if (!projectId || projectId === loadedProjectRef.current) return;
    loadFromProject();
  }, [projectId, loadFromProject]);

  // Listen for workspace:save events → persist to IndexedDB
  useEffect(() => {
    if (!projectId) return;

    const handleSave = () => {
      saveToProject();
    };

    window.addEventListener("workspace:save", handleSave);
    return () => window.removeEventListener("workspace:save", handleSave);
  }, [projectId, saveToProject]);

  return {
    isLoading,
    isLoaded,
    projectId,
    saveToProject,
    loadFromProject,
  };
}
