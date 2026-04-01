"use client";

import { useState, useCallback } from "react";
import {
  useInvoiceAccountingEditor,
  formatCurrency,
  calculateInvoiceTotals,
  type Invoice,
} from "@/stores/invoice-accounting-editor";
import { PageHeader, Btn, StatCard, Field, Input, SectionDivider, TabStrip, StatusBadge, EmptyView, formatDate } from "../shared";

// ── ZRA Status Colors ──

function zraStatusColor(status: Invoice["zraStatus"]): string {
  switch (status) {
    case "submitted": return "bg-success-500/15 text-success-400 border-success-500/30";
    case "verified": return "bg-primary-500/15 text-primary-300 border-primary-500/30";
    case "pending": return "bg-warning-500/15 text-warning-400 border-warning-500/30";
    case "error": return "bg-error-500/15 text-error-400 border-error-500/30";
    default: return "bg-gray-800 text-gray-500 border-gray-700/50";
  }
}

function ZRAStatusBadge({ status }: { status: Invoice["zraStatus"] }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${zraStatusColor(status)}`}>
      {status === "not-submitted" ? "Not Submitted" : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Tab config ──

const ZRA_TABS = [
  { key: "overview", label: "Overview" },
  { key: "invoices", label: "Invoice Status" },
  { key: "settings", label: "VSDC Settings" },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function ZRASmartInvoiceView() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const updateBusiness = useInvoiceAccountingEditor((s) => s.updateBusiness);
  const submitInvoiceToZRA = useInvoiceAccountingEditor((s) => s.submitInvoiceToZRA);

  const [tab, setTab] = useState("overview");
  const [submitting, setSubmitting] = useState<string | null>(null);

  const biz = form.business;
  const invoices = form.invoices;

  // Stats
  const submitted = invoices.filter((i) => i.zraStatus === "submitted" || i.zraStatus === "verified").length;
  const pending = invoices.filter((i) => i.zraStatus === "pending").length;
  const errors = invoices.filter((i) => i.zraStatus === "error").length;
  const notSubmitted = invoices.filter((i) => i.zraStatus === "not-submitted").length;
  const totalVAT = invoices.reduce((sum, inv) => {
    const totals = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
    return sum + totals.taxTotal;
  }, 0);

  const handleSubmit = useCallback(async (invoiceId: string) => {
    setSubmitting(invoiceId);
    try {
      await submitInvoiceToZRA(invoiceId);
    } finally {
      setSubmitting(null);
    }
  }, [submitInvoiceToZRA]);

  const handleBulkSubmit = useCallback(async () => {
    const pending = invoices.filter(
      (i) => i.zraStatus === "not-submitted" && (i.status === "draft" || i.status === "paid")
    );
    for (const inv of pending) {
      setSubmitting(inv.id);
      try {
        await submitInvoiceToZRA(inv.id);
      } catch {
        // continue with next
      }
      setSubmitting(null);
    }
  }, [invoices, submitInvoiceToZRA]);

  // biz ZRA config
  const zraEnabled = biz.zraEnabled ?? false;
  const zraVsdcUrl = biz.zraVsdcUrl ?? "http://localhost:8080";
  const zraBranchId = biz.zraBranchId ?? "000";
  const zraDeviceSerial = biz.zraDeviceSerialNo ?? "";
  const zraAutoSubmit = biz.zraAutoSubmit ?? false;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="ZRA Smart Invoice"
        subtitle="Zambia Revenue Authority — VSDC fiscal device integration"
        actions={
          zraEnabled ? (
            <Btn size="sm" onClick={handleBulkSubmit}>
              Submit All Pending
            </Btn>
          ) : undefined
        }
      />

      <TabStrip tabs={ZRA_TABS} active={tab} onChange={setTab} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* ── Overview Tab ── */}
        {tab === "overview" && (
          <>
            {/* Status banner */}
            {!zraEnabled && (
              <div className="rounded-xl border border-warning-500/30 bg-warning-500/5 px-4 py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-warning-400">
                    <path d="M8 1.5l6.5 12H1.5L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M8 6.5v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <span className="text-xs font-semibold text-warning-400">ZRA Smart Invoice Not Configured</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  All VAT-registered taxpayers in Zambia must use Smart Invoice from October 2024.
                  Go to the Settings tab to configure your VSDC device connection.
                </p>
                <Btn size="sm" variant="secondary" onClick={() => setTab("settings")}>
                  Configure Now
                </Btn>
              </div>
            )}

            {zraEnabled && (
              <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-primary-400">
                    <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-semibold text-primary-300">ZRA Smart Invoice Active</span>
                  <span className="text-[10px] text-gray-500 ml-auto">VSDC: {zraVsdcUrl}</span>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Submitted" value={submitted} color="green" />
              <StatCard label="Pending" value={pending} color="amber" />
              <StatCard label="Errors" value={errors} color="red" />
              <StatCard label="Not Submitted" value={notSubmitted} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatCard label="Total Invoices" value={invoices.length} />
              <StatCard label="Total VAT Collected" value={formatCurrency(totalVAT, biz.currency)} color="green" />
            </div>

            {/* Recent submissions */}
            <SectionDivider title="Recent Submissions" />
            {invoices
              .filter((i) => i.zraSubmittedAt)
              .sort((a, b) => (b.zraSubmittedAt || "").localeCompare(a.zraSubmittedAt || ""))
              .slice(0, 10)
              .map((inv) => {
                const totals = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-800/40 hover:border-gray-700/60 transition-colors cursor-pointer"
                    onClick={() => setView("invoice-edit", inv.id)}
                  >
                    <div className="flex items-center gap-3">
                      <ZRAStatusBadge status={inv.zraStatus} />
                      <span className="text-xs font-medium text-gray-200">{inv.number}</span>
                      <span className="text-[10px] text-gray-500">{form.clients.find((c) => c.id === inv.clientId)?.name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{formatCurrency(totals.total, biz.currency)}</span>
                      {inv.zraReceiptNo && (
                        <span className="text-[10px] text-gray-600 font-mono">#{inv.zraReceiptNo}</span>
                      )}
                      <span className="text-[10px] text-gray-600">{inv.zraSubmittedAt ? formatDate(inv.zraSubmittedAt) : ""}</span>
                    </div>
                  </div>
                );
              })}
            {!invoices.some((i) => i.zraSubmittedAt) && (
              <EmptyView
                icon={<svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gray-600"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>}
                title="No submissions yet"
                description="Submit invoices to ZRA using the Invoice Status tab."
              />
            )}

            {/* About ZRA Smart Invoice */}
            <SectionDivider title="About ZRA Smart Invoice" />
            <div className="text-[11px] text-gray-500 space-y-2 leading-relaxed">
              <p>
                The Zambia Revenue Authority (ZRA) requires all VAT-registered taxpayers to use
                the Smart Invoice system for real-time fiscal device reporting. Invoices must be
                transmitted to ZRA&apos;s Virtual Sales Data Controller (VSDC) device.
              </p>
              <p>
                <strong className="text-gray-400">How it works:</strong> When you submit an invoice,
                DMSuite sends the transaction data to your local VSDC device. The device validates
                the data, assigns a fiscal receipt number, and reports to ZRA&apos;s central system.
              </p>
              <p>
                <strong className="text-gray-400">Requirements:</strong> A VSDC device must be installed
                and running on your local network. Contact ZRA to obtain your VSDC device and
                authentication credentials.
              </p>
            </div>
          </>
        )}

        {/* ── Invoice Status Tab ── */}
        {tab === "invoices" && (
          <>
            {invoices.length === 0 ? (
              <EmptyView
                icon={<svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gray-600"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>}
                title="No invoices"
                description="Create an invoice first to submit it to ZRA."
              action="Go to Invoices"
                onAction={() => setView("invoices")}
              />
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => {
                  const totals = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
                  const canSubmit = zraEnabled && inv.zraStatus !== "submitted" && inv.zraStatus !== "verified" && inv.zraStatus !== "pending";
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-800/40 hover:border-gray-700/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ZRAStatusBadge status={inv.zraStatus} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-200">{inv.number}</span>
                            <StatusBadge status={inv.status} />
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {form.clients.find((c) => c.id === inv.clientId)?.name || "Walk-in"} · {formatDate(inv.date)} · {formatCurrency(totals.total, biz.currency)}
                          </div>
                          {inv.zraErrorMessage && (
                            <div className="text-[10px] text-error-400 mt-0.5">{inv.zraErrorMessage}</div>
                          )}
                          {inv.zraReceiptNo && (
                            <div className="text-[10px] text-gray-600 font-mono mt-0.5">Receipt: {inv.zraReceiptNo}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => setView("invoice-edit", inv.id)}
                        >
                          View
                        </Btn>
                        {canSubmit && (
                          <Btn
                            size="sm"
                            onClick={() => handleSubmit(inv.id)}
                            disabled={submitting === inv.id}
                          >
                            {submitting === inv.id ? "Sending…" : inv.zraStatus === "error" ? "Retry" : "Submit"}
                          </Btn>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Settings Tab ── */}
        {tab === "settings" && (
          <>
            <SectionDivider title="VSDC Device Connection" />
            <div className="rounded-xl border border-gray-800/40 bg-gray-900/30 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zraEnabled}
                    onChange={(e) => updateBusiness({ zraEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30"
                  />
                  <span className="text-xs font-medium text-gray-200">Enable ZRA Smart Invoice</span>
                </label>
              </div>

              {zraEnabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="VSDC Device URL">
                      <Input
                        value={zraVsdcUrl}
                        onChange={(v) => updateBusiness({ zraVsdcUrl: v })}
                        placeholder="http://localhost:8080"
                      />
                    </Field>
                    <Field label="TPIN (Tax Payer ID)">
                      <Input
                        value={biz.taxId || ""}
                        onChange={(v) => updateBusiness({ taxId: v })}
                        placeholder="1234567890"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Branch ID (bhfId)">
                      <Input
                        value={zraBranchId}
                        onChange={(v) => updateBusiness({ zraBranchId: v })}
                        placeholder="000"
                      />
                    </Field>
                    <Field label="Device Serial Number">
                      <Input
                        value={zraDeviceSerial}
                        onChange={(v) => updateBusiness({ zraDeviceSerialNo: v })}
                        placeholder="VSDC device serial"
                      />
                    </Field>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zraAutoSubmit}
                        onChange={(e) => updateBusiness({ zraAutoSubmit: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30"
                      />
                      <span className="text-xs text-gray-300">Auto-submit invoices when marked as Sent</span>
                    </label>
                  </div>

                  <div className="text-[10px] text-gray-600 space-y-1">
                    <p>The VSDC device must be running on your local network for submissions to work.</p>
                    <p>Contact ZRA at <strong className="text-gray-500">zra.org.zm</strong> to obtain your VSDC device.</p>
                  </div>
                </div>
              )}
            </div>

            <SectionDivider title="Tax Configuration" />
            <div className="text-[11px] text-gray-500 space-y-1">
              <p>Zambian VAT is charged at <strong className="text-gray-400">16%</strong> (Tax Type A).</p>
              <p>Configure additional tax rates in <button onClick={() => setView("settings")} className="text-primary-400 hover:text-primary-300 underline">General Settings → Tax Rates</button>.</p>
            </div>

            <SectionDivider title="VSDC API Endpoints" />
            <div className="rounded-xl border border-gray-800/40 bg-gray-900/20 p-3 space-y-1.5">
              {[
                { name: "Initialize Device", endpoint: "/api/selectInitInfo" },
                { name: "Save Sales", endpoint: "/api/selectClssList" },
                { name: "Customer Search", endpoint: "/api/selectCustomer" },
                { name: "Item Classification", endpoint: "/api/selectItemClsList" },
                { name: "Save Purchase", endpoint: "/api/savePurchase" },
                { name: "Stock Management", endpoint: "/api/selectStockMoveList" },
                { name: "Import Items", endpoint: "/api/selectImportItemList" },
              ].map((ep) => (
                <div key={ep.name} className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400">{ep.name}</span>
                  <span className="text-gray-600 font-mono">{ep.endpoint}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
