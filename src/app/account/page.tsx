"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useSidebarStore } from "@/stores/sidebar";
import { sidebar as sidebarConfig, surfaces, layout } from "@/lib/design-system";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────── */

interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  type: "purchase" | "usage" | "bonus" | "refund";
  description: string;
  tool_id: string | null;
  created_at: string;
}

/* ── Account Page ───────────────────────────────────────────── */

export default function AccountPage() {
  const { user, profile, loading, signOut } = useUser();
  const router = useRouter();
  const pinned = useSidebarStore((s) => s.pinned);
  const openMobile = useSidebarStore((s) => s.openMobile);

  // Redirect if not authed
  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className={cn("min-h-dvh flex items-center justify-center", surfaces.page)}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-dvh", surfaces.page, "transition-colors")}>
      <Sidebar />
      <main
        className={cn(
          "min-h-dvh",
          sidebarConfig.transition,
          pinned ? sidebarConfig.mainMarginExpanded : sidebarConfig.mainMarginCollapsed
        )}
      >
        <div className={layout.container}>
          <TopBar onMenuClick={openMobile} title="Account Settings" />

          <div className="mt-6 max-w-3xl mx-auto space-y-8 pb-16">
            <ProfileSection user={user} profile={profile} />
            <PasswordSection />
            <CreditHistorySection />
            <DangerZone signOut={signOut} />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   Profile Section
   ============================================================ */

function ProfileSection({
  user,
  profile,
}: {
  user: { email?: string };
  profile: { full_name: string; phone: string; avatar_url: string | null; credits: number; plan: string } | null;
}) {
  const supabase = createClient();
  const profileKey = `${profile?.full_name}:${profile?.phone}`;
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastProfileKey, setLastProfileKey] = useState(profileKey);

  // Sync when profile data changes (replaces useEffect setState)
  if (profileKey !== lastProfileKey) {
    setLastProfileKey(profileKey);
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");

    setSaving(false);
    if (error) {
      setMsg({ type: "error", text: "Failed to update profile. Please try again." });
    } else {
      setMsg({ type: "success", text: "Profile updated successfully." });
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Profile</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Manage your name, email, and contact information.
      </p>

      {/* Plan + credits banner */}
      {profile && (
        <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/10 px-3 py-1 text-sm font-medium text-primary-600 dark:text-primary-400 capitalize">
            {profile.plan} plan
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">{profile.credits}</span> credits remaining
          </span>
        </div>
      )}

      <div className="space-y-4">
        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={user.email ?? ""}
            disabled
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Email cannot be changed from this page.
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            maxLength={100}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-colors"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
            maxLength={20}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-colors"
          />
        </div>

        {/* Feedback + Save */}
        {msg && (
          <p className={cn(
            "text-sm",
            msg.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {msg.text}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   Password Section
   ============================================================ */

function PasswordSection() {
  const supabase = createClient();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChange = async () => {
    setMsg(null);

    if (newPassword.length < 8) {
      setMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      setMsg({ type: "error", text: error.message });
    } else {
      setMsg({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Password</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Change your password. You&apos;ll stay logged in after updating.
      </p>

      <div className="space-y-4 max-w-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            minLength={8}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-colors"
          />
        </div>

        {msg && (
          <p className={cn(
            "text-sm",
            msg.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {msg.text}
          </p>
        )}

        <button
          onClick={handleChange}
          disabled={saving || !newPassword}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Updating…
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   Credit History Section
   ============================================================ */

function CreditHistorySection() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [fetched, setFetched] = useState(false);

  // Fetch once on mount using ref-guarded pattern
  if (!fetched) {
    setFetched(true);
    supabase
      .from("credit_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setTransactions(data as CreditTransaction[]);
        setLoadingTx(false);
      });
  }

  const typeConfig: Record<string, { label: string; color: string; sign: string }> = {
    purchase: { label: "Purchase", color: "text-green-600 dark:text-green-400", sign: "+" },
    bonus: { label: "Bonus", color: "text-blue-600 dark:text-blue-400", sign: "+" },
    refund: { label: "Refund", color: "text-amber-600 dark:text-amber-400", sign: "+" },
    usage: { label: "Usage", color: "text-red-600 dark:text-red-400", sign: "" },
  };

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Credit History</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Your recent credit transactions and usage.
      </p>

      {loadingTx ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          No transactions yet.
        </p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {transactions.map((tx) => {
            const cfg = typeConfig[tx.type] ?? typeConfig.usage;
            return (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {tx.description || cfg.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {tx.tool_id && (
                      <span className="ml-2 text-gray-400">· {tx.tool_id}</span>
                    )}
                  </p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className={cn("text-sm font-semibold", cfg.color)}>
                    {cfg.sign}{tx.amount}
                  </p>
                  <p className="text-xs text-gray-400">{tx.balance_after} left</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   Danger Zone — Account Deletion
   ============================================================ */

function DangerZone({ signOut }: { signOut: () => Promise<void> }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete account");
      }
      await signOut();
      router.push("/auth/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
    }
  };

  return (
    <section className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-900 p-6">
      <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">Danger Zone</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 transition-colors"
        >
          Delete Account
        </button>
      ) : (
        <div className="space-y-4 max-w-sm">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            Type <span className="font-mono font-bold">DELETE</span> to confirm:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="w-full rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-colors"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={confirmText !== "DELETE" || deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2.5 text-sm font-medium text-white transition-colors"
            >
              {deleting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting…
                </>
              ) : (
                "Permanently Delete"
              )}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setConfirmText(""); setError(""); }}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
