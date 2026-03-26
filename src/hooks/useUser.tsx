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
  /** True when bootstrap or profile fetch failed (timeout, network, etc.) */
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

/* ── Context ────────────────────────────────────────────────── */

const UserContext = createContext<UseUserReturn | null>(null);

// Singleton supabase client — created once, reused everywhere
const supabase = createClient();

/** Bootstrap timeout — if auth + profile don't resolve in 10s, give up */
const BOOTSTRAP_TIMEOUT_MS = 10_000;
/** Individual fetch timeout — auth or profile query */
const FETCH_TIMEOUT_MS = 8_000;

/**
 * Single source of truth for user state. Mount once in layout.
 * All consumers share the same auth listener, profile fetch, and
 * Realtime subscription — no duplicate network requests.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(
    configured ? null : DEV_PROFILE
  );
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState(false);

  // Stable refs
  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bump to re-run bootstrap
  const [bootKey, setBootKey] = useState(0);

  /* ── Auth bootstrap + listener ── */
  useEffect(() => {
    if (!configured) return;

    cancelledRef.current = false;
    setLoading(true);
    setError(false);

    // ── helpers scoped to this effect ──

    const fetchProfile = async (userId: string) => {
      const res = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single().then((r) => r),
        FETCH_TIMEOUT_MS,
      );
      if (res.error) console.warn("[useUser] profile fetch error:", res.error.message);
      if (!cancelledRef.current && res.data) setProfile(res.data as UserProfile);
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
                }
              }, 150);
            }
          }
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

    // 1. Bootstrap with hard timeout
    const bootstrap = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await withTimeout(supabase.auth.getUser(), FETCH_TIMEOUT_MS);

        if (cancelledRef.current) return;

        if (currentUser) {
          setUser(currentUser);
          userIdRef.current = currentUser.id;
          await fetchProfile(currentUser.id);
          if (!cancelledRef.current) subscribeRealtime(currentUser.id);
        }
      } catch (err) {
        console.warn("[useUser] bootstrap failed:", (err as Error).message);
        if (!cancelledRef.current) setError(true);
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    };

    // Outer hard timeout — no matter what, stop loading after BOOTSTRAP_TIMEOUT_MS
    const hardTimer = setTimeout(() => {
      if (!cancelledRef.current) {
        console.warn("[useUser] bootstrap hard timeout reached");
        setLoading(false);
        setError(true);
      }
    }, BOOTSTRAP_TIMEOUT_MS);

    bootstrap().finally(() => clearTimeout(hardTimer));

    // 2. Auth state listener — only handles sign-in / sign-out
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelledRef.current) return;

      // Skip events that don't change auth state
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        userIdRef.current = currentUser.id;
        try {
          await fetchProfile(currentUser.id);
        } catch (err) {
          console.warn("[useUser] profile fetch on auth change failed:", (err as Error).message);
        }
        if (!cancelledRef.current) subscribeRealtime(currentUser.id);
      } else {
        userIdRef.current = null;
        setProfile(null);
        unsubscribeRealtime();
      }
    });
    subscriptionRef.current = subscription;

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
      if (res.data) setProfile(res.data as UserProfile);
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
