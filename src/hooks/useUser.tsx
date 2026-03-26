"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User, RealtimeChannel } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  credits: number;
  plan: "free" | "starter" | "pro" | "agency";
  plan_expires_at: string | null;
  is_admin: boolean;
}

interface UseUserReturn {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** True when all bootstrap attempts failed AND no cached data is available */
  error: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Manually retry the entire auth + profile bootstrap */
  retry: () => void;
}

const DEV_PROFILE: UserProfile = {
  id: "dev-user",
  full_name: "Dev User",
  phone: "",
  avatar_url: null,
  credits: 9999,
  plan: "pro",
  plan_expires_at: null,
  is_admin: true,
};

/* ── Constants ──────────────────────────────────────────────── */

/** Race a promise against a timeout. Rejects with "timeout" on expiry. */
function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

const UserContext = createContext<UseUserReturn | null>(null);

// Singleton supabase client — created once, reused everywhere
const supabase = createClient();

/** Individual network timeout (auth validation, profile query) */
const FETCH_TIMEOUT_MS = 8_000;
/** Absolute hard timeout — `loading` forced to `false` no matter what */
const HARD_TIMEOUT_MS = 10_000;
/** Profile localStorage cache key */
const PROFILE_CACHE_KEY = "dmsuite-profile-cache";
/** Max age before cached profile is considered stale (5 minutes) */
const PROFILE_CACHE_TTL = 5 * 60_000;

/* ── Profile cache helpers ──────────────────────────────────── */

function readCachedProfile(forUserId?: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > PROFILE_CACHE_TTL) return null;
    if (forUserId && parsed.userId !== forUserId) return null;
    return parsed.profile as UserProfile;
  } catch {
    return null;
  }
}

function writeCachedProfile(userId: string, profile: UserProfile): void {
  try {
    localStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({ userId, profile, ts: Date.now() }),
    );
  } catch { /* localStorage full or blocked */ }
}

function clearCachedProfile(): void {
  try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
}

/* ── Provider ───────────────────────────────────────────────── */

/**
 * Single source of truth for user state. Mount once in layout.
 *
 * Architecture: cache-first, background-validate.
 *
 * 1. On mount, read cached profile from localStorage → show instantly.
 * 2. Use `onAuthStateChange` INITIAL_SESSION for cached session user (~5-10 ms).
 * 3. Fetch fresh profile in background → update UI seamlessly.
 * 4. Validate JWT via `getUser()` silently in background (security).
 * 5. Realtime Postgres subscription keeps credits/profile live after load.
 *
 * Return visitors see cached data instantly (0 ms loading skeleton).
 * First-time visitors see skeleton for ~200-500 ms (profile fetch only).
 * Error state only shown when ALL attempts fail AND no cache exists.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(
    configured ? null : DEV_PROFILE,
  );
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState(false);

  // Stable refs
  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileFetchedRef = useRef(false);
  // Bump to re-run bootstrap
  const [bootKey, setBootKey] = useState(0);

  /* ── Auth bootstrap + listener ── */
  useEffect(() => {
    if (!configured) return;

    cancelledRef.current = false;
    profileFetchedRef.current = false;
    setError(false);

    // ── Phase 1: Instant cache read (sync, ~0 ms) ──
    const cachedProfile = readCachedProfile();
    if (cachedProfile) {
      setProfile(cachedProfile);
      // Don't set loading=false yet — wait for INITIAL_SESSION to provide user.
      // Components check `loading && !profile` so cached data shows through.
    } else {
      setLoading(true);
    }

    // ── Scoped helpers ──

    const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
      const res = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single().then((r) => r),
        FETCH_TIMEOUT_MS,
      );
      if (res.error) {
        console.warn("[useUser] profile fetch error:", res.error.message);
        return null;
      }
      const p = res.data as UserProfile;
      if (!cancelledRef.current) {
        setProfile(p);
        writeCachedProfile(userId, p);
      }
      return p;
    };

    const subscribeRealtime = (userId: string) => {
      if (realtimeRef.current && userIdRef.current === userId) return;
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
      const channel = supabase
        .channel(`profile:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            if (!cancelledRef.current) {
              const newRow = payload.new as UserProfile;
              // Debounce realtime updates to avoid cascading re-renders
              if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
              realtimeDebounceRef.current = setTimeout(() => {
                if (!cancelledRef.current) {
                  setProfile((prev) => (prev ? { ...prev, ...newRow } : newRow));
                  writeCachedProfile(userId, newRow);
                }
              }, 150);
            }
          },
        )
        .subscribe();
      realtimeRef.current = channel;
    };

    const unsubscribeRealtime = () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    };

    const teardownUser = () => {
      userIdRef.current = null;
      setUser(null);
      setProfile(null);
      clearCachedProfile();
      unsubscribeRealtime();
    };

    // ── Phase 2: Auth state listener ──
    //
    // INITIAL_SESSION fires almost immediately (~5-10 ms) with the session
    // cached in cookies — NO network call.  This replaces the old
    // `bootstrap() → getUser()` waterfall that blocked for 300-800 ms.
    //
    // JWT validation (getUser) runs in the background for security but
    // never blocks the UI.

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelledRef.current) return;

        // Token refreshes are internal Supabase plumbing — skip
        if (event === "TOKEN_REFRESHED") return;

        const sessionUser = session?.user ?? null;

        /* ── INITIAL_SESSION (fast, from cookie/storage) ─────────── */
        if (event === "INITIAL_SESSION") {
          if (sessionUser) {
            setUser(sessionUser);
            userIdRef.current = sessionUser.id;

            // Validate cache is for THIS user
            const validCache = readCachedProfile(sessionUser.id);
            if (cachedProfile && !validCache) {
              // Cache was for a different user — discard it
              setProfile(null);
              clearCachedProfile();
            }

            // If we have a valid cached profile, end loading immediately
            if (validCache) {
              setLoading(false);
            }

            // Fetch fresh profile in background (parallel with JWT validation)
            if (!profileFetchedRef.current) {
              profileFetchedRef.current = true;
              fetchProfile(sessionUser.id)
                .then(() => {
                  if (!cancelledRef.current) setLoading(false);
                })
                .catch(() => {
                  if (!cancelledRef.current) {
                    // Only set error if no cached data to fall back on
                    if (!readCachedProfile(sessionUser.id)) setError(true);
                    setLoading(false);
                  }
                });
            }

            // Start realtime subscription
            subscribeRealtime(sessionUser.id);

            // Background JWT validation (security — never blocks UI)
            withTimeout(supabase.auth.getUser(), FETCH_TIMEOUT_MS)
              .then(({ data: { user: validated } }) => {
                if (cancelledRef.current) return;
                if (validated) {
                  // Update with server-validated user data
                  setUser(validated);
                } else {
                  // Cookie session exists but JWT is invalid → force sign-out
                  console.warn("[useUser] invalid session detected, signing out");
                  supabase.auth.signOut();
                  teardownUser();
                  setLoading(false);
                }
              })
              .catch((err) => {
                // Network/timeout — keep cached data, don't show error
                console.warn("[useUser] bg validation failed:", (err as Error).message);
              });
          } else {
            // No session — middleware should have redirected to login already
            setLoading(false);
          }
          return;
        }

        /* ── SIGNED_OUT ──────────────────────────────────────────── */
        if (event === "SIGNED_OUT") {
          teardownUser();
          setLoading(false);
          return;
        }

        /* ── SIGNED_IN / USER_UPDATED ────────────────────────────── */
        if (sessionUser) {
          setUser(sessionUser);
          userIdRef.current = sessionUser.id;
          try {
            await fetchProfile(sessionUser.id);
          } catch (err) {
            console.warn("[useUser] profile fetch on auth change failed:", (err as Error).message);
          }
          if (!cancelledRef.current) {
            subscribeRealtime(sessionUser.id);
            setLoading(false);
          }
        } else {
          teardownUser();
          setLoading(false);
        }
      },
    );

    // Hard timeout — no matter what, stop loading after HARD_TIMEOUT_MS
    const hardTimer = setTimeout(() => {
      if (!cancelledRef.current) {
        console.warn("[useUser] hard timeout reached");
        setLoading(false);
        // Only set error if we have absolutely no data to show
        if (!userIdRef.current && !readCachedProfile()) setError(true);
      }
    }, HARD_TIMEOUT_MS);

    return () => {
      cancelledRef.current = true;
      clearTimeout(hardTimer);
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
      subscription.unsubscribe();
      unsubscribeRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, bootKey]);

  /* ── retry (bump bootKey to re-run bootstrap) ────────── */
  const retry = useCallback(() => setBootKey((k) => k + 1), []);

  /* ── refreshProfile (stable — no deps on callbacks) ─── */
  const refreshProfile = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      const res = await withTimeout(
        supabase.from("profiles").select("*").eq("id", uid).single().then((r) => r),
        FETCH_TIMEOUT_MS,
      );
      if (res.data) {
        const p = res.data as UserProfile;
        setProfile(p);
        writeCachedProfile(uid, p);
      }
    } catch (err) {
      console.warn("[useUser] refreshProfile failed:", (err as Error).message);
    }
  }, []);

  /* ── signOut ──────────────────────────────────────────── */
  const signOut = useCallback(async () => {
    const storeKeys = [
      "dmsuite-chat",
      "dmsuite-chiko",
      "dmsuite-chiko-workflows",
      "dmsuite-preferences",
      "dmsuite-sales-book",
      "dmsuite-invoice",
      "dmsuite-resume",
      "dmsuite-sidebar",
      "dmsuite-advanced",
      "dmsuite-business-memory",
      "dmsuite-revision-history",
    ];
    storeKeys.forEach((key) => {
      try { localStorage.removeItem(key); } catch { /* SSR safety */ }
    });
    clearCachedProfile();

    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }
    userIdRef.current = null;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setError(false);
  }, []);

  const value: UseUserReturn = { user, profile, loading, error, signOut, refreshProfile, retry };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/* ── Hook (consumers) ──────────────────────────────────────── */

export function useUser(): UseUserReturn {
  const ctx = useContext(UserContext);
  if (!ctx) {
    return {
      user: null,
      profile: isSupabaseConfigured() ? null : DEV_PROFILE,
      loading: false,
      error: false,
      signOut: async () => {},
      refreshProfile: async () => {},
      retry: () => {},
    };
  }
  return ctx;
}
