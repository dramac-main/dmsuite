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

type Tab = "overview" | "users" | "payments" | "settings";

/* ── Admin Page ─────────────────────────────────────────────── */

export default function AdminPage() {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const pinned = useSidebarStore((s) => s.pinned);
  const openMobile = useSidebarStore((s) => s.openMobile);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

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
              {(["overview", "users", "payments", "settings"] as Tab[]).map((t) => {
                const labels: Record<Tab, string> = {
                  overview: "Overview",
                  users: "Users & Credits",
                  payments: "Payments",
                  settings: "Settings",
                };
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      tab === t
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
                    )}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>

            {tab === "overview" && <OverviewSection />}
            {tab === "users" && <UsersSection />}
            {tab === "payments" && <PaymentsSection />}
            {tab === "settings" && <SettingsSection />}
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
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
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
                    <button
                      onClick={() => setRefundTarget(p)}
                      className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 transition-colors"
                    >
                      Refund
                    </button>
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

      {/* Refund confirmation modal */}
      {refundTarget && (
        <RefundModal
          payment={refundTarget}
          onClose={() => setRefundTarget(null)}
          onDone={(resultMsg) => {
            setRefundTarget(null);
            setMsg(resultMsg);
            fetchPayments();
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   Refund Confirmation Modal
   ============================================================ */

function RefundModal({
  payment,
  onClose,
  onDone,
}: {
  payment: Payment;
  onClose: () => void;
  onDone: (msg: { type: "success" | "error"; text: string }) => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAutoRefund = !["mtn_momo", "airtel_money"].includes(payment.payment_method);
  const methodLabel = payment.payment_method.replace(/_/g, " ");

  const handleRefund = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id, reason: reason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Refund failed");
        setSubmitting(false);
        return;
      }

      const parts: string[] = [];
      parts.push(`Refund processed. ${data.creditsDeducted} credits deducted (balance: ${data.newBalance}).`);
      if (data.moneyRefunded) {
        parts.push("Money refund initiated automatically via Flutterwave.");
      } else {
        parts.push(data.refundNote || "Manual money transfer required.");
      }

      onDone({ type: "success", text: parts.join(" ") });
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Confirm Payment Refund
        </h3>

        {/* Payment summary */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">User</span>
            <span className="text-gray-900 dark:text-white font-medium">{payment.user_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Amount</span>
            <span className="text-gray-900 dark:text-white font-medium">K{payment.amount} {payment.currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Credits purchased</span>
            <span className="text-gray-900 dark:text-white font-medium">{payment.credits_purchased}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Method</span>
            <span className="text-gray-900 dark:text-white font-medium capitalize">{methodLabel}</span>
          </div>
          {payment.phone_number && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Phone</span>
              <span className="text-gray-900 dark:text-white font-medium">{payment.phone_number}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Date</span>
            <span className="text-gray-900 dark:text-white font-medium">{new Date(payment.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* What will happen */}
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 mb-4 text-sm space-y-2">
          <p className="font-semibold text-warning">What will happen:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              <strong>{payment.credits_purchased} credits</strong> will be{" "}
              <strong className="text-error">deducted</strong> from the user&apos;s balance
              (capped at their available credits)
            </li>
            <li>Payment status will be marked as <strong>refunded</strong></li>
            {isAutoRefund ? (
              <li>
                <strong className="text-success">Automated refund:</strong>{" "}
                K{payment.amount} will be refunded automatically via Flutterwave
              </li>
            ) : (
              <li>
                <strong className="text-warning">Manual action required:</strong>{" "}
                You must manually transfer K{payment.amount} back to{" "}
                {payment.phone_number || "the user"} via {methodLabel}.
                The system cannot auto-refund {methodLabel} payments.
              </li>
            )}
          </ul>
        </div>

        {error && (
          <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error mb-4">
            {error}
          </div>
        )}

        {/* Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reason for refund <span className="text-error">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer complaint — payment went through but credits didn't appear"
            rows={2}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefund}
            disabled={submitting || !reason.trim()}
            className="flex-1 rounded-lg bg-error px-4 py-2.5 text-sm font-semibold text-white hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Processing Refund…" : `Refund K${payment.amount}`}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Platform Overview Section
   ============================================================ */

interface OverviewStats {
  totalUsers: number;
  totalRevenue: number;
  totalCredits: number;
  recentSignups: number;
  pendingPayments: number;
  successfulPayments: number;
}

function OverviewSection() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Fetch users
        const usersRes = await fetch("/api/admin/users?q=");
        const usersData = await usersRes.json();
        const users: AdminUser[] = usersData.users ?? [];

        // Fetch payments
        const paymentsRes = await fetch("/api/admin/payments");
        const paymentsData = await paymentsRes.json();
        const payments: Payment[] = paymentsData.payments ?? [];

        if (cancelled) return;

        const successPayments = payments.filter((p) => p.status === "successful");
        const pendingPayments = payments.filter((p) => p.status === "pending");

        setStats({
          totalUsers: users.length,
          totalRevenue: successPayments.reduce((sum, p) => sum + p.amount, 0),
          totalCredits: successPayments.reduce((sum, p) => sum + p.credits_purchased, 0),
          recentSignups: users.filter(
            (u) => Date.now() - new Date(u.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
          ).length,
          pendingPayments: pendingPayments.length,
          successfulPayments: successPayments.length,
        });

        // 5 most recent signups
        setRecentUsers(
          [...users]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
        );
      } catch {
        // ignore — API may not exist in dev
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const STAT_CARDS = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, icon: "👥" },
        { label: "Revenue (K)", value: `K${stats.totalRevenue.toLocaleString()}`, icon: "💰" },
        { label: "Credits Distributed", value: stats.totalCredits.toLocaleString(), icon: "⚡" },
        { label: "Signups (7 days)", value: stats.recentSignups, icon: "📈" },
        { label: "Successful Payments", value: stats.successfulPayments, icon: "✅" },
        { label: "Pending Payments", value: stats.pendingPayments, icon: "⏳" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))
          : STAT_CARDS.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{card.icon}</span>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            ))}
      </div>

      {/* Recent Signups */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Signups</h3>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : recentUsers.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No users yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {u.full_name || "Unnamed"}
                    {u.is_admin && (
                      <span className="ml-2 text-xs bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full px-2 py-0.5">
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(u.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400 capitalize">
                    {u.plan}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Settings Section
   ============================================================ */

const SETTINGS_KEY = "dmsuite-admin-settings";

interface AdminSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcement: string;
  announcementEnabled: boolean;
  registrationEnabled: boolean;
  maxCreditsPerGrant: number;
}

const DEFAULT_SETTINGS: AdminSettings = {
  maintenanceMode: false,
  maintenanceMessage: "DMSuite is undergoing scheduled maintenance. Please check back soon.",
  announcement: "",
  announcementEnabled: false,
  registrationEnabled: true,
  maxCreditsPerGrant: 1000,
};

function loadSettings(): AdminSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function SettingsSection() {
  const [settings, setSettings] = useState<AdminSettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  const update = useCallback(<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  return (
    <div className="space-y-6">
      {/* Save indicator */}
      {saved && (
        <div className="text-xs font-medium text-green-600 dark:text-green-400 text-right">
          ✓ Settings saved
        </div>
      )}

      {/* Maintenance Mode */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Maintenance Mode</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          When enabled, users see a maintenance page instead of the dashboard.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Maintenance Mode</p>
            <button
              onClick={() => update("maintenanceMode", !settings.maintenanceMode)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
                settings.maintenanceMode ? "bg-error" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                  settings.maintenanceMode ? "translate-x-5.5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {settings.maintenanceMode && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Maintenance Message
              </label>
              <textarea
                value={settings.maintenanceMessage}
                onChange={(e) => update("maintenanceMessage", e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Platform Announcements */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Announcement Banner</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Show a banner across all pages. Useful for updates, promotions, or alerts.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Announcement</p>
            <button
              onClick={() => update("announcementEnabled", !settings.announcementEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
                settings.announcementEnabled ? "bg-primary-600" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                  settings.announcementEnabled ? "translate-x-5.5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {settings.announcementEnabled && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Announcement Text
              </label>
              <textarea
                value={settings.announcement}
                onChange={(e) => update("announcement", e.target.value)}
                placeholder="e.g. 🎉 New tools available! Check out the AI Photo Editor in Creative Tools."
                rows={2}
                maxLength={300}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Registration & Limits */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Access Controls</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Control user registration and credit limits.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Open Registration</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Allow new users to sign up</p>
            </div>
            <button
              onClick={() => update("registrationEnabled", !settings.registrationEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
                settings.registrationEnabled ? "bg-primary-600" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                  settings.registrationEnabled ? "translate-x-5.5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Max Credits Per Grant
            </label>
            <input
              type="number"
              value={settings.maxCreditsPerGrant}
              onChange={(e) => update("maxCreditsPerGrant", Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={100000}
              className="w-32 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Maximum credits an admin can grant in a single action.
            </p>
          </div>
        </div>
      </div>

      {/* Credit Packs Reference */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Credit Packs</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Current pricing for credit packs available to users.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { credits: 50, price: "K49" },
            { credits: 150, price: "K129" },
            { credits: 500, price: "K399" },
            { credits: 1200, price: "K799" },
          ].map((pack) => (
            <div
              key={pack.credits}
              className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 p-3 text-center"
            >
              <p className="text-lg font-bold text-gray-900 dark:text-white">{pack.credits}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">credits</p>
              <p className="mt-1 text-sm font-semibold text-primary-600 dark:text-primary-400">{pack.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
