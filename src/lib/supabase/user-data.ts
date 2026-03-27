// =============================================================================
// DMSuite — Supabase User Data Service
// Generic key-value persistence for user-level data that must survive
// browser cache clears: analytics, preferences, settings, business memory, etc.
//
// Architecture: Write-through cache
//   - localStorage provides immediate reads (Zustand persist)
//   - Supabase provides durability (survives cache clear)
//   - On load: merge server data into local store (server wins on conflict)
//   - On save: debounced write to Supabase (3s batching)
// =============================================================================

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!_client) _client = createClient();
  return _client;
}

// ---------------------------------------------------------------------------
// Auth helper (shared cache with projects.ts pattern)
// ---------------------------------------------------------------------------

let _cachedUserId: string | null = null;
let _cacheExpiry = 0;
const AUTH_CACHE_TTL = 60_000; // 60s

async function getAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  if (_cachedUserId && Date.now() < _cacheExpiry) return _cachedUserId;
  try {
    const { data } = await getClient().auth.getSession();
    const userId = data.session?.user?.id ?? null;
    if (userId) {
      _cachedUserId = userId;
      _cacheExpiry = Date.now() + AUTH_CACHE_TTL;
    }
    return userId;
  } catch {
    return null;
  }
}

/** Clear auth cache on sign-out */
export function clearUserDataAuthCache() {
  _cachedUserId = null;
  _cacheExpiry = 0;
}

// ---------------------------------------------------------------------------
// Data keys — the types of user data we persist
// ---------------------------------------------------------------------------

export type UserDataKey =
  | "analytics"
  | "preferences"
  | "advanced-settings"
  | "business-memory"
  | "chiko"
  | "chat"
  | "notifications"
  | "export-history";

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch a single data document for the authenticated user */
export async function fetchUserData(
  key: UserDataKey
): Promise<Record<string, unknown> | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  try {
    const { data, error } = await getClient()
      .from("user_data")
      .select("data")
      .eq("user_id", userId)
      .eq("data_key", key)
      .maybeSingle();

    if (error) {
      console.warn(`[UserData] fetch "${key}" error:`, error.message);
      return null;
    }
    return (data?.data as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}

/** Fetch ALL data documents for the authenticated user (bulk load on startup) */
export async function fetchAllUserData(): Promise<
  Record<UserDataKey, Record<string, unknown>>
> {
  const result = {} as Record<UserDataKey, Record<string, unknown>>;
  const userId = await getAuthUserId();
  if (!userId) return result;

  try {
    const { data, error } = await getClient()
      .from("user_data")
      .select("data_key, data")
      .eq("user_id", userId);

    if (error) {
      console.warn("[UserData] fetchAll error:", error.message);
      return result;
    }
    for (const row of data ?? []) {
      result[row.data_key as UserDataKey] = row.data as Record<string, unknown>;
    }
  } catch {
    // Offline — fall back to localStorage
  }
  return result;
}

/** Upsert a data document (insert or update) */
export async function saveUserData(
  key: UserDataKey,
  data: Record<string, unknown>
): Promise<boolean> {
  const userId = await getAuthUserId();
  if (!userId) return false;

  try {
    const { error } = await getClient()
      .from("user_data")
      .upsert(
        {
          user_id: userId,
          data_key: key,
          data,
        },
        { onConflict: "user_id,data_key" }
      );

    if (error) {
      console.warn(`[UserData] save "${key}" error:`, error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Delete a data document */
export async function deleteUserData(key: UserDataKey): Promise<boolean> {
  const userId = await getAuthUserId();
  if (!userId) return false;

  try {
    const { error } = await getClient()
      .from("user_data")
      .delete()
      .eq("user_id", userId)
      .eq("data_key", key);

    if (error) {
      console.warn(`[UserData] delete "${key}" error:`, error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Debounced save manager — batches rapid writes per key
// ---------------------------------------------------------------------------

const _saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const _pendingSaves: Record<string, Record<string, unknown>> = {};
const SAVE_DEBOUNCE_MS = 3_000;

/** Debounced save — batches rapid writes, retries on failure */
export function debouncedSaveUserData(
  key: UserDataKey,
  data: Record<string, unknown>
) {
  _pendingSaves[key] = data;

  if (_saveTimers[key]) clearTimeout(_saveTimers[key]);
  _saveTimers[key] = setTimeout(async () => {
    const payload = _pendingSaves[key];
    if (!payload) return;
    delete _pendingSaves[key];

    const ok = await saveUserData(key, payload);
    if (!ok) {
      // Re-queue for next attempt
      _pendingSaves[key] = payload;
    }
  }, SAVE_DEBOUNCE_MS);
}

/** Flush all pending saves immediately (call before sign-out or page unload) */
export async function flushAllPendingSaves(): Promise<void> {
  // Clear all timers
  for (const key of Object.keys(_saveTimers)) {
    clearTimeout(_saveTimers[key]);
    delete _saveTimers[key];
  }
  // Save all pending
  const saves = Object.entries(_pendingSaves).map(([key, data]) => {
    delete _pendingSaves[key];
    return saveUserData(key as UserDataKey, data);
  });
  await Promise.allSettled(saves);
}
