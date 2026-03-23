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
import type { User, SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

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

  // Stable refs — never re-created across renders
  const supabaseRef = useRef<SupabaseClient>(createClient());
  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);

  const supabase = supabaseRef.current;

  /* ── fetchProfile ─────────────────────────────────────── */
  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (data) setProfile(data as UserProfile);
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (userIdRef.current) await fetchProfile(userIdRef.current);
  }, [fetchProfile]);

  /* ── Realtime subscription for credit balance updates ── */
  const subscribeRealtime = useCallback(
    (userId: string) => {
      // Already subscribed to this user
      if (realtimeRef.current && userIdRef.current === userId) return;

      // Clean up previous
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
            const newRow = payload.new as UserProfile;
            setProfile((prev) => (prev ? { ...prev, ...newRow } : newRow));
          }
        )
        .subscribe();

      realtimeRef.current = channel;
    },
    [supabase]
  );

  const unsubscribeRealtime = useCallback(() => {
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }
  }, [supabase]);

  /* ── Auth bootstrap + listener (runs once) ─────────── */
  useEffect(() => {
    if (!configured) return;

    let cancelled = false;

    // 1. Initial fetch — fast path
    const bootstrap = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (currentUser) {
        setUser(currentUser);
        userIdRef.current = currentUser.id;
        await fetchProfile(currentUser.id);
        subscribeRealtime(currentUser.id);
      }
      setLoading(false);
    };

    bootstrap();

    // 2. Auth state listener — handles sign-in, sign-out, token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      const currentUser = session?.user ?? null;

      if (event === "INITIAL_SESSION") {
        // Already handled by bootstrap above — skip to avoid double fetch
        return;
      }

      setUser(currentUser);

      if (currentUser) {
        userIdRef.current = currentUser.id;
        await fetchProfile(currentUser.id);
        subscribeRealtime(currentUser.id);
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
  }, [configured, supabase, fetchProfile, subscribeRealtime, unsubscribeRealtime]);

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

    unsubscribeRealtime();
    userIdRef.current = null;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase, unsubscribeRealtime]);

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
