"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useSidebarStore } from "@/stores/sidebar";
import { sidebar as sidebarConfig, surfaces, layout } from "@/lib/design-system";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────── */

interface AdminUser {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  credits: number;
  plan: string;
  is_admin: boolean;
  created_at: string;
}

interface Payment {
  id: string;
  user_id: string;
  user_name: string;
  flw_ref: string;
  amount: number;
  currency: string;
  credits_purchased: number;
  payment_method: string;
  phone_number: string;
  status: string;
  created_at: string;
}

type Tab = "users" | "payments";

/* ── Admin Page ─────────────────────────────────────────────── */

export default function AdminPage() {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const pinned = useSidebarStore((s) => s.pinned);
  const openMobile = useSidebarStore((s) => s.openMobile);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("users");

  // Check admin access
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }
    if (profile) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isAdmin = (profile as any).is_admin === true;
      if (!isAdmin) {
        router.push("/dashboard");
      } else {
        setAuthorized(true);
      }
    }
  }, [loading, user, profile, router]);

  if (loading || !user || authorized === null) {
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
          pinned ? sidebarConfig.mainMarginExpanded : sidebarConfig.mainMarginCollapsed,
        )}
      >
        <div className={layout.container}>
          <TopBar onMenuClick={openMobile} title="Admin Panel" />

          <div className="mt-6 max-w-5xl mx-auto pb-16">
            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800/50 mb-6 w-fit">
              {(["users", "payments"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize",
                    tab === t
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
                  )}
                >
                  {t === "users" ? "Users & Credits" : "Payments"}
                </button>
              ))}
            </div>

            {tab === "users" && <UsersSection />}
            {tab === "payments" && <PaymentsSection />}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   Users & Credits Section
   ============================================================ */

function UsersSection() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers("");
  }, [fetchUsers]);

  const handleSearch = () => {
    fetchUsers(search);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by name, email, or phone…"
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-gray-950 hover:bg-primary-400 transition-colors disabled:opacity-50"
        >
          {loading ? "…" : "Search"}
        </button>
      </div>

      {/* Users table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">User</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Credits</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Plan</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Joined</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {u.full_name || "—"}
                    {u.is_admin && (
                      <span className="ml-2 text-[0.6rem] font-bold bg-primary-500/10 text-primary-500 px-1.5 py-0.5 rounded-full uppercase">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{u.email ?? "—"}</div>
                  {u.phone && <div className="text-xs text-gray-400">{u.phone}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-900 dark:text-white">{u.credits}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    u.plan === "free"
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      : "bg-primary-500/10 text-primary-500",
                  )}>
                    {u.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Manage Credits
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Credit management modal */}
      {selectedUser && (
        <CreditModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onDone={() => {
            setSelectedUser(null);
            fetchUsers(search);
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   Credit Grant/Revoke Modal
   ============================================================ */

function CreditModal({
  user,
  onClose,
  onDone,
}: {
  user: AdminUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState<"grant" | "revoke">("grant");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async () => {
    if (!amount || !reason.trim()) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: parseInt(amount, 10),
          reason: reason.trim(),
          type,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ type: "error", text: data.error ?? "Failed" });
        setSubmitting(false);
        return;
      }

      setResult({
        type: "success",
        text: `${type === "grant" ? "Granted" : "Revoked"} ${amount} credits. New balance: ${data.newBalance}`,
      });
      setSubmitting(false);
      setTimeout(onDone, 1500);
    } catch {
      setResult({ type: "error", text: "Network error" });
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Manage Credits
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {user.full_name || user.email} — Current balance: <strong className="text-primary-500">{user.credits}</strong>
        </p>

        {result && (
          <div
            className={cn(
              "rounded-lg px-4 py-3 text-sm mb-4 border",
              result.type === "success"
                ? "bg-success/10 border-success/20 text-success"
                : "bg-error/10 border-error/20 text-error",
            )}
          >
            {result.text}
          </div>
        )}

        {/* Grant / Revoke toggle */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setType("grant")}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              type === "grant"
                ? "border-success bg-success/10 text-success"
                : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300",
            )}
          >
            + Grant Credits
          </button>
          <button
            onClick={() => setType("revoke")}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              type === "revoke"
                ? "border-error bg-error/10 text-error"
                : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300",
            )}
          >
            − Revoke Credits
          </button>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount
          </label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {/* Reason (required) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reason <span className="text-error">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Payment refund for failed MTN transaction #abc123"
            rows={2}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || !amount || !reason.trim()}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              type === "grant"
                ? "bg-success text-white hover:bg-success/90"
                : "bg-error text-white hover:bg-error/90",
            )}
          >
            {submitting
              ? "Processing…"
              : type === "grant"
                ? `Grant ${amount || "0"} credits`
                : `Revoke ${amount || "0"} credits`}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Payments Section
   ============================================================ */

function PaymentsSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [refunding, setRefunding] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      if (data.payments) setPayments(data.payments);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRefund = async (paymentId: string) => {
    if (!refundReason.trim()) return;
    setMsg(null);

    try {
      const res = await fetch("/api/admin/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, reason: refundReason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg({ type: "error", text: data.error ?? "Refund failed" });
        return;
      }

      setMsg({ type: "success", text: `Refunded ${data.creditsRefunded} credits. New balance: ${data.newBalance}` });
      setRefunding(null);
      setRefundReason("");
      fetchPayments();
    } catch {
      setMsg({ type: "error", text: "Network error" });
    }
  };

  const statusColors: Record<string, string> = {
    successful: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    failed: "bg-error/10 text-error",
    refunded: "bg-info/10 text-info",
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm border",
            msg.type === "success" ? "bg-success/10 border-success/20 text-success" : "bg-error/10 border-error/20 text-error",
          )}
        >
          {msg.text}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
        {["", "successful", "pending", "failed", "refunded"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize",
              statusFilter === s
                ? "bg-primary-500 text-gray-950"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            )}
          >
            {s || "All"}
          </button>
        ))}
        {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent ml-2" />}
      </div>

      {/* Payments table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">User</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Credits</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Method</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(p.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-900 dark:text-white text-xs">{p.user_name}</div>
                  {p.phone_number && <div className="text-xs text-gray-400">{p.phone_number}</div>}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  K{p.amount}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {p.credits_purchased}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {p.payment_method.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", statusColors[p.status] ?? "")}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {p.status === "successful" && (
                    <>
                      {refunding === p.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <input
                            type="text"
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleRefund(p.id)}
                            placeholder="Reason…"
                            className="w-40 rounded border border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1 text-xs outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRefund(p.id)}
                            disabled={!refundReason.trim()}
                            className="rounded bg-error px-2 py-1 text-xs font-medium text-white hover:bg-error/90 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setRefunding(null); setRefundReason(""); }}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRefunding(p.id)}
                          className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 transition-colors"
                        >
                          Refund
                        </button>
                      )}
                    </>
                  )}
                  {p.status === "refunded" && (
                    <span className="text-xs text-gray-400">Refunded</span>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
