// =============================================================================
// DMSuite — User Data Sync Hook
// Centralised sync between Zustand stores (localStorage) and Supabase.
//
// What it does:
//   1. On mount: fetches all user data from Supabase (single query)
//   2. Merges server data into local stores (server wins for newer data)
//   3. Subscribes to store changes → debounced save to Supabase
//
// Why this pattern:
//   - Stores remain simple (no Supabase awareness)
//   - localStorage provides instant reads (no loading spinner for UI state)
//   - Supabase provides durability (survives cache clears)
//   - Single hook, mounted once in ClientShell.tsx
// =============================================================================

"use client";

import { useEffect, useRef } from "react";
import {
  fetchAllUserData,
  debouncedSaveUserData,
  flushAllPendingSaves,
  type UserDataKey,
} from "@/lib/supabase/user-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Store imports — lazy to avoid circular deps
// ---------------------------------------------------------------------------

import { useAnalyticsStore } from "@/stores/analytics";
import { usePreferencesStore } from "@/stores/preferences";
import { useBusinessMemory } from "@/stores/business-memory";
import { useAdvancedSettingsStore } from "@/stores/advanced-settings";
import { useChikoStore } from "@/stores/chiko";

// ---------------------------------------------------------------------------
// Snapshot extractors — what we save to Supabase per key
// ---------------------------------------------------------------------------

function getAnalyticsSnapshot(): Record<string, unknown> {
  const { toolUsage } = useAnalyticsStore.getState();
  return { toolUsage };
}

function getPreferencesSnapshot(): Record<string, unknown> {
  const s = usePreferencesStore.getState();
  return {
    recentTools: s.recentTools,
    favoriteTools: s.favoriteTools,
    recentSearches: s.recentSearches,
    lastVisitedPerCategory: s.lastVisitedPerCategory,
    hiddenSections: s.hiddenSections,
    showDescriptions: s.showDescriptions,
    expandedCategories: s.expandedCategories,
  };
}

function getBusinessMemorySnapshot(): Record<string, unknown> {
  const { profile, hasProfile } = useBusinessMemory.getState();
  return { profile, hasProfile };
}

function getAdvancedSettingsSnapshot(): Record<string, unknown> {
  const { settings } = useAdvancedSettingsStore.getState();
  return { settings };
}

function getChikoSnapshot(): Record<string, unknown> {
  const s = useChikoStore.getState();
  return {
    messages: s.messages,
    hasGreeted: s.hasGreeted,
    context: s.context,
    lastFileContext: s.lastFileContext,
    lastWebsiteContext: s.lastWebsiteContext,
  };
}

// ---------------------------------------------------------------------------
// Restore functions — merge server data into local stores
// ---------------------------------------------------------------------------

function restoreAnalytics(data: Record<string, unknown>) {
  if (!data.toolUsage) return;
  const serverUsage = data.toolUsage as Record<
    string,
    { opens: number; totalSeconds: number; lastUsed: number }
  >;
  const localUsage = useAnalyticsStore.getState().toolUsage;

  // Merge: take the MAX of each metric per tool (handles partial syncs)
  const merged = { ...localUsage };
  for (const [toolId, serverU] of Object.entries(serverUsage)) {
    const localU = localUsage[toolId];
    if (!localU) {
      merged[toolId] = serverU;
    } else {
      merged[toolId] = {
        opens: Math.max(localU.opens, serverU.opens),
        totalSeconds: Math.max(localU.totalSeconds, serverU.totalSeconds),
        lastUsed: Math.max(localU.lastUsed, serverU.lastUsed),
      };
    }
  }

  useAnalyticsStore.setState({ toolUsage: merged });
}

function restorePreferences(data: Record<string, unknown>) {
  // Server wins for arrays, merge for maps
  const patch: Record<string, unknown> = {};

  if (Array.isArray(data.recentTools)) patch.recentTools = data.recentTools;
  if (Array.isArray(data.favoriteTools)) patch.favoriteTools = data.favoriteTools;
  if (Array.isArray(data.recentSearches)) patch.recentSearches = data.recentSearches;
  if (Array.isArray(data.hiddenSections)) patch.hiddenSections = data.hiddenSections;
  if (Array.isArray(data.expandedCategories))
    patch.expandedCategories = data.expandedCategories;
  if (typeof data.showDescriptions === "boolean")
    patch.showDescriptions = data.showDescriptions;
  if (data.lastVisitedPerCategory && typeof data.lastVisitedPerCategory === "object")
    patch.lastVisitedPerCategory = data.lastVisitedPerCategory;

  if (Object.keys(patch).length > 0) {
    usePreferencesStore.setState(patch);
  }
}

function restoreBusinessMemory(data: Record<string, unknown>) {
  if (!data.profile) return;
  const localState = useBusinessMemory.getState();
  const serverProfile = data.profile as Record<string, unknown>;
  const localProfile = localState.profile;

  // Server profile wins if it has a newer updatedAt
  const serverUpdated = (serverProfile.updatedAt as number) || 0;
  const localUpdated = localProfile.updatedAt || 0;

  if (serverUpdated > localUpdated || !localState.hasProfile) {
    useBusinessMemory.setState({
      profile: data.profile as typeof localProfile,
      hasProfile: !!data.hasProfile,
    });
  }
}

function restoreAdvancedSettings(data: Record<string, unknown>) {
  if (!data.settings) return;
  // Server wins — these are explicit user tweaks
  useAdvancedSettingsStore.setState({
    settings: data.settings as ReturnType<
      typeof useAdvancedSettingsStore.getState
    >["settings"],
  });
}

function restoreChiko(data: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  if (Array.isArray(data.messages)) patch.messages = data.messages;
  if (typeof data.hasGreeted === "boolean") patch.hasGreeted = data.hasGreeted;
  if (data.context) patch.context = data.context;
  if (data.lastFileContext) patch.lastFileContext = data.lastFileContext;
  if (data.lastWebsiteContext) patch.lastWebsiteContext = data.lastWebsiteContext;

  if (Object.keys(patch).length > 0) {
    useChikoStore.setState(patch);
  }
}

// ---------------------------------------------------------------------------
// Restore map
// ---------------------------------------------------------------------------

const RESTORE_MAP: Record<
  UserDataKey,
  (data: Record<string, unknown>) => void
> = {
  analytics: restoreAnalytics,
  preferences: restorePreferences,
  "business-memory": restoreBusinessMemory,
  "advanced-settings": restoreAdvancedSettings,
  chat: () => {}, // AI Chat rebuilt — old synced data is ignored
  chiko: restoreChiko,
  notifications: () => {}, // Notifications are ephemeral — no server restore
  "export-history": () => {}, // Export history is session-local
  "sketch-library": () => {}, // Sketch library restored directly in SketchBoardWorkspace
};

// ---------------------------------------------------------------------------
// Snapshot + key map for subscriptions
// ---------------------------------------------------------------------------

interface SyncConfig {
  key: UserDataKey;
  getSnapshot: () => Record<string, unknown>;
  subscribe: (cb: () => void) => () => void;
}

const SYNC_CONFIGS: SyncConfig[] = [
  {
    key: "analytics",
    getSnapshot: getAnalyticsSnapshot,
    subscribe: (cb) => useAnalyticsStore.subscribe(cb),
  },
  {
    key: "preferences",
    getSnapshot: getPreferencesSnapshot,
    subscribe: (cb) => usePreferencesStore.subscribe(cb),
  },
  {
    key: "business-memory",
    getSnapshot: getBusinessMemorySnapshot,
    subscribe: (cb) => useBusinessMemory.subscribe(cb),
  },
  {
    key: "advanced-settings",
    getSnapshot: getAdvancedSettingsSnapshot,
    subscribe: (cb) => useAdvancedSettingsStore.subscribe(cb),
  },
  {
    key: "chiko",
    getSnapshot: getChikoSnapshot,
    subscribe: (cb) => useChikoStore.subscribe(cb),
  },
];

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

export function useUserDataSync() {
  const hasSyncedRef = useRef(false);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    // ── 1. Fetch from Supabase and merge ──
    (async () => {
      const serverData = await fetchAllUserData();

      // Restore server data into stores (skip triggering save-back)
      isRestoringRef.current = true;
      try {
        for (const [key, data] of Object.entries(serverData)) {
          const restorer = RESTORE_MAP[key as UserDataKey];
          if (restorer && data && Object.keys(data).length > 0) {
            restorer(data);
          }
        }
      } finally {
        isRestoringRef.current = false;
      }
    })();

    // ── 2. Subscribe to store changes → debounced save to Supabase ──
    const unsubscribers: (() => void)[] = [];

    for (const config of SYNC_CONFIGS) {
      // Snapshot the initial state for dirty detection
      let lastJson = JSON.stringify(config.getSnapshot());

      const unsub = config.subscribe(() => {
        // Don't save back during restore (would be a no-op loop)
        if (isRestoringRef.current) return;

        const currentJson = JSON.stringify(config.getSnapshot());
        if (currentJson === lastJson) return; // No actual change
        lastJson = currentJson;

        debouncedSaveUserData(config.key, config.getSnapshot());
      });

      unsubscribers.push(unsub);
    }

    // ── 3. Flush on page unload ──
    const handleBeforeUnload = () => {
      flushAllPendingSaves();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushAllPendingSaves();
    };
  }, []);
}
