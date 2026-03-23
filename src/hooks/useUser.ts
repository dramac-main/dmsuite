"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

export function useUser(): UseUserReturn {
  const configured = isSupabaseConfigured();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(
    configured ? null : DEV_PROFILE
  );
  const [loading, setLoading] = useState(configured);
  const realtimeRef = useRef<RealtimeChannel | null>(null);

  const supabase = createClient();

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
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // ── Realtime subscription for credit balance updates ──
  useEffect(() => {
    if (!configured || !user) {
      // Clean up any existing channel when user logs out
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
      return;
    }

    // Subscribe to changes on this user's profile row
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as UserProfile;
          setProfile((prev) =>
            prev ? { ...prev, ...newRow } : newRow
          );
        }
      )
      .subscribe();

    realtimeRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      realtimeRef.current = null;
    };
  }, [configured, user, supabase]);

  useEffect(() => {
    if (!configured) return;

    const getUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);
      if (currentUser) await fetchProfile(currentUser.id);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, configured]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  return { user, profile, loading, signOut, refreshProfile };
}
