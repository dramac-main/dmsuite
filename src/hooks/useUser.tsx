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
}

interface UseUserReturn {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEV_PROFILE: UserProfile = {
  id: "dev-user",
  full_name: "Dev User",
  phone: "",
  avatar_url: null,
  credits: 9999,
  plan: "pro",
  plan_expires_at: null,
};

/* ── Context ────────────────────────────────────────────────── */

const UserContext = createContext<UseUserReturn | null>(null);

// Singleton supabase client — created once, reused everywhere
const supabase = createClient();

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

  // Stable refs
  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);

  /* ── Auth bootstrap + listener (runs once, zero deps) ── */
  useEffect(() => {
    if (!configured) return;

    let cancelled = false;

    // ── helpers scoped to this effect (no useCallback — no stale deps) ──

    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (!cancelled && data) setProfile(data as UserProfile);
      } catch {
        // Profile fetch failed — non-fatal, user can still use the app
      }
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
            if (!cancelled) {
              const newRow = payload.new as UserProfile;
              setProfile((prev) => (prev ? { ...prev, ...newRow } : newRow));
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

    // 1. Bootstrap — always sets loading=false via finally
    const bootstrap = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (currentUser) {
          setUser(currentUser);
          userIdRef.current = currentUser.id;
          await fetchProfile(currentUser.id);
          if (!cancelled) subscribeRealtime(currentUser.id);
        }
      } catch {
        // Auth check failed — user stays null, non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();

    // 2. Auth state listener — only handles sign-in / sign-out
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      // Skip events that don't change auth state
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        userIdRef.current = currentUser.id;
        await fetchProfile(currentUser.id);
        if (!cancelled) subscribeRealtime(currentUser.id);
      } else {
        userIdRef.current = null;
        setProfile(null);
        unsubscribeRealtime();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      unsubscribeRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  /* ── refreshProfile (stable — no deps on callbacks) ─── */
  const refreshProfile = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();
      if (data) setProfile(data as UserProfile);
    } catch {
      // Non-fatal
    }
  }, []);

  /* ── signOut ──────────────────────────────────────────── */
  const signOut = useCallback(async () => {
    // Clear all persisted localStorage stores (privacy)
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
      try {
        localStorage.removeItem(key);
      } catch {
        /* SSR safety */
      }
    });

    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }
    userIdRef.current = null;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value: UseUserReturn = { user, profile, loading, signOut, refreshProfile };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/* ── Hook (consumers) ──────────────────────────────────────── */

export function useUser(): UseUserReturn {
  const ctx = useContext(UserContext);
  if (!ctx) {
    // Fallback for components rendered outside the provider (e.g. dev mode)
    return {
      user: null,
      profile: isSupabaseConfigured() ? null : DEV_PROFILE,
      loading: false,
      signOut: async () => {},
      refreshProfile: async () => {},
    };
  }
  return ctx;
}
