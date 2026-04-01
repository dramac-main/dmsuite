"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  useInvoiceAccountingEditor,
  formatCurrency,
  calculateInvoiceTotals,
  getInvoiceBalance,
  type ViewType,
  type InvoiceAccountingForm,
} from "@/stores/invoice-accounting-editor";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createInvoiceAccountingManifest } from "@/lib/chiko/manifests/invoice-accounting";
import { printHTML } from "@/lib/print";
import {
  buildInvoicePrintHTML,
  buildQuotePrintHTML,
  buildCreditNotePrintHTML,
  buildPurchaseOrderPrintHTML,
} from "./InvoiceAccountingRenderer";
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import WorkspaceErrorBoundary from "@/components/workspaces/shared/WorkspaceErrorBoundary";
import { ConfirmDialog, Icons } from "@/components/workspaces/shared/WorkspaceUIKit";

// ── Lazy-loaded views ──
import DashboardView from "./views/DashboardView";
import InvoiceListView from "./views/InvoiceListView";
import InvoiceEditView from "./views/InvoiceEditView";
import QuoteListView from "./views/QuoteListView";
import QuoteEditView from "./views/QuoteEditView";
import ClientListView from "./views/ClientListView";
import ClientEditView from "./views/ClientEditView";
import ProductListView from "./views/ProductListView";
import ProductEditView from "./views/ProductEditView";
import PaymentListView from "./views/PaymentListView";
import ExpenseListView from "./views/ExpenseListView";
import ExpenseEditView from "./views/ExpenseEditView";
import VendorListView from "./views/VendorListView";
import VendorEditView from "./views/VendorEditView";
import ProjectListView from "./views/ProjectListView";
import ProjectEditView from "./views/ProjectEditView";
import TimeTrackingView from "./views/TimeTrackingView";
import CreditNoteListView from "./views/CreditNoteListView";
import CreditNoteEditView from "./views/CreditNoteEditView";
import PurchaseOrderListView from "./views/PurchaseOrderListView";
import PurchaseOrderEditView from "./views/PurchaseOrderEditView";
import ReportsView from "./views/ReportsView";
import SettingsView from "./views/SettingsView";
import ZRASmartInvoiceView from "./views/ZRASmartInvoiceView";
import NAPSAEmployeesView from "./views/NAPSAEmployeesView";
import NAPSAReturnsView from "./views/NAPSAReturnsView";

// ━━━ Navigation Config ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface NavItem {
  key: ViewType;
  label: string;
  icon: React.ReactNode;
  badge?: (form: InvoiceAccountingForm) => number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const DashIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7" /><rect x="9" y="1" width="6" height="3.5" rx="1" fill="currentColor" opacity="0.5" /><rect x="9" y="6.5" width="6" height="8.5" rx="1" fill="currentColor" opacity="0.3" /><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5" /></svg>
);
const InvIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M3 1.5h10a1.5 1.5 0 011.5 1.5v10a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 13V3A1.5 1.5 0 013 1.5z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 5h6M5 7.5h4M5 10h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
);
const QuoteIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M2 3.5h12v10H2z" stroke="currentColor" strokeWidth="1.2" rx="1"/><path d="M5 2v2M11 2v2M5 7h6M5 9.5h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
);
const ClientIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.2"/></svg>
);
const ProductIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M2 4l6-2.5L14 4v8l-6 2.5L2 12V4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8 6.5V14M2 4l6 2.5L14 4" stroke="currentColor" strokeWidth="1" opacity="0.5"/></svg>
);
const PayIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1"/><rect x="3" y="9" width="4" height="1.5" rx="0.5" fill="currentColor" opacity="0.4"/></svg>
);
const ExpIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 4.5v7M5.5 6.5h5a1 1 0 010 2h-4a1 1 0 000 2h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
);
const VendorIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="2" y="4" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 4V2.5h6V4" stroke="currentColor" strokeWidth="1.2"/><path d="M2 7.5h12" stroke="currentColor" strokeWidth="1" opacity="0.5"/></svg>
);
const ProjectIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M2 3h5l1.5 1.5H14v9.5H2V3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
);
const TimeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 4.5V8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const CreditIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M3 2h10a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 12.5v-9A1.5 1.5 0 013 2z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 7h6M5 9.5h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><path d="M10 4l-4 8" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/></svg>
);
const POIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M4 1.5h8l2.5 3v10H1.5V4.5L4 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
);
const ReportIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 10V7M8 10V5M11 10V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
);
const ZRAIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 6h6M5 8.5h4M5 11h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><path d="M11 8.5l1.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/></svg>
);
const NAPSAIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 13.5c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.2"/><path d="M6 12l2 2 4-4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/></svg>
);

const NAV_GROUPS: NavGroup[] = [
  {
    group: "",
    items: [
      { key: "dashboard", label: "Dashboard", icon: <DashIcon /> },
    ],
  },
  {
    group: "Sales",
    items: [
      {
        key: "invoices",
        label: "Invoices",
        icon: <InvIcon />,
        badge: (f) => f.invoices.filter((i) => i.status === "draft" || i.status === "overdue").length,
      },
      {
        key: "quotes",
        label: "Quotes",
        icon: <QuoteIcon />,
        badge: (f) => f.quotes.filter((q) => q.status === "draft" || q.status === "sent").length,
      },
      { key: "payments", label: "Payments", icon: <PayIcon /> },
      { key: "credit-notes", label: "Credit Notes", icon: <CreditIcon /> },
    ],
  },
  {
    group: "Contacts",
    items: [
      { key: "clients", label: "Clients", icon: <ClientIcon />, badge: (f) => f.clients.length },
      { key: "vendors", label: "Vendors", icon: <VendorIcon /> },
    ],
  },
  {
    group: "Catalog",
    items: [
      { key: "products", label: "Products", icon: <ProductIcon /> },
    ],
  },
  {
    group: "Expenses",
    items: [
      { key: "expenses", label: "Expenses", icon: <ExpIcon /> },
      { key: "purchase-orders", label: "Purchase Orders", icon: <POIcon /> },
    ],
  },
  {
    group: "Projects",
    items: [
      { key: "projects", label: "Projects", icon: <ProjectIcon /> },
      { key: "time-tracking", label: "Time Tracking", icon: <TimeIcon /> },
    ],
  },
  {
    group: "Compliance",
    items: [
      { key: "zra-smart-invoice", label: "ZRA Smart Invoice", icon: <ZRAIcon /> },
      {
        key: "napsa-employees",
        label: "NAPSA Employees",
        icon: <NAPSAIcon />,
        badge: (f) => f.napsaEmployees.filter((e) => e.isActive).length,
      },
      { key: "napsa-returns", label: "NAPSA Returns", icon: <NAPSAIcon /> },
    ],
  },
  {
    group: "Insights",
    items: [
      { key: "reports", label: "Reports", icon: <ReportIcon /> },
      { key: "settings", label: "Settings", icon: <SettingsIcon /> },
    ],
  },
];

// ━━━ View Router ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ViewRouter({ view, recordId }: { view: ViewType; recordId: string | null }) {
  switch (view) {
    case "dashboard": return <DashboardView />;
    case "invoices": return <InvoiceListView />;
    case "invoice-edit": return <InvoiceEditView id={recordId} />;
    case "quotes": return <QuoteListView />;
    case "quote-edit": return <QuoteEditView id={recordId} />;
    case "clients": return <ClientListView />;
    case "client-edit": return <ClientEditView id={recordId} />;
    case "products": return <ProductListView />;
    case "product-edit": return <ProductEditView id={recordId} />;
    case "payments": return <PaymentListView />;
    case "expenses": return <ExpenseListView />;
    case "expense-edit": return <ExpenseEditView id={recordId} />;
    case "vendors": return <VendorListView />;
    case "vendor-edit": return <VendorEditView id={recordId} />;
    case "projects": return <ProjectListView />;
    case "project-edit": return <ProjectEditView id={recordId} />;
    case "time-tracking": return <TimeTrackingView />;
    case "credit-notes": return <CreditNoteListView />;
    case "credit-note-edit": return <CreditNoteEditView id={recordId} />;
    case "purchase-orders": return <PurchaseOrderListView />;
    case "purchase-order-edit": return <PurchaseOrderEditView id={recordId} />;
    case "reports": return <ReportsView />;
    case "settings": return <SettingsView />;
    case "zra-smart-invoice": return <ZRASmartInvoiceView />;
    case "napsa-employees": return <NAPSAEmployeesView />;
    case "napsa-returns": return <NAPSAReturnsView />;
    default: return <DashboardView />;
  }
}

// ━━━ Main Workspace ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function InvoiceAccountingWorkspace() {
  const form = useInvoiceAccountingEditor((s) => s.form);
  const setView = useInvoiceAccountingEditor((s) => s.setView);
  const resetForm = useInvoiceAccountingEditor((s) => s.resetForm);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // ── Chiko integration
  const chikoOnPrintRef = useRef<((type?: string, id?: string) => void) | null>(null);

  const handlePrint = useCallback((type?: string, id?: string) => {
    const currentForm = useInvoiceAccountingEditor.getState().form;
    let html = "";
    switch (type) {
      case "quote":
        if (id) html = buildQuotePrintHTML(currentForm, id);
        break;
      case "credit-note":
        if (id) html = buildCreditNotePrintHTML(currentForm, id);
        break;
      case "purchase-order":
        if (id) html = buildPurchaseOrderPrintHTML(currentForm, id);
        break;
      default: {
        const invoiceId = id || currentForm.activeRecordId;
        if (invoiceId) html = buildInvoicePrintHTML(currentForm, invoiceId);
        break;
      }
    }
    if (html) {
      printHTML(html);
      dispatchProgress("exported");
    }
  }, []);

  useEffect(() => {
    chikoOnPrintRef.current = handlePrint;
  }, [handlePrint]);

  useChikoActions(() => createInvoiceAccountingManifest({ onPrintRef: chikoOnPrintRef }));

  // ── Dispatch dirty on form changes
  const formRef = useRef(form);
  useEffect(() => {
    if (formRef.current === form) return;
    formRef.current = form;
    dispatchDirty();
  }, [form]);

  // ── Progress milestones
  const prevMilestones = useRef("");
  useEffect(() => {
    const m: string[] = [];
    if (form.business.name.trim()) m.push("input");
    if (form.invoices.length > 0 || form.clients.length > 0) m.push("content");
    const key = m.join(",");
    if (key !== prevMilestones.current) {
      prevMilestones.current = key;
      m.forEach((x) => dispatchProgress(x as "input" | "content"));
    }
  }, [form.business.name, form.invoices.length, form.clients.length]);

  // ── Quick stats for sidebar badges
  const overdueCount = useMemo(
    () => form.invoices.filter((i) => i.status === "overdue").length,
    [form.invoices]
  );

  const handleNavClick = useCallback((key: ViewType) => {
    setView(key);
    setSidebarOpen(false);
  }, [setView]);

  const handleReset = useCallback(() => {
    resetForm();
    setShowResetDialog(false);
  }, [resetForm]);

  // ── Active nav key (strip -edit suffix for highlighting)
  const activeNavKey = form.activeView.replace("-edit", "") as ViewType;

  return (
    <div className="flex h-full bg-gray-950 text-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative z-50 lg:z-0 w-56 h-full shrink-0 flex flex-col bg-gray-950 border-r border-gray-800/40 transition-transform duration-200`}
      >
        {/* Sidebar header */}
        <div className="shrink-0 flex items-center gap-2 px-4 h-11 border-b border-gray-800/40">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-primary-400">
            <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 5h6M5 8h4M5 11h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span className="text-[11px] font-semibold text-gray-200 tracking-wide">Accounts Hub</span>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-3" : ""}>
              {group.group && (
                <div className="px-2 mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-600">
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = activeNavKey === item.key;
                const badgeCount = item.badge ? item.badge(form) : 0;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item.key)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      isActive
                        ? "bg-primary-500/10 text-primary-300 border border-primary-500/20"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    <span className={isActive ? "text-primary-400" : "text-gray-500"}>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? "bg-primary-500/20 text-primary-300" : "bg-gray-800 text-gray-500"
                      }`}>
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: overdue alert + reset */}
        <div className="shrink-0 border-t border-gray-800/40 p-2 space-y-1.5">
          {overdueCount > 0 && (
            <button
              onClick={() => setView("invoices")}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-error-500/10 border border-error-500/20 text-[10px] font-medium text-error-400 hover:bg-error-500/15 transition-all"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M8 1.5l6.5 12H1.5L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M8 6.5v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {overdueCount} overdue invoice{overdueCount > 1 ? "s" : ""}
            </button>
          )}
          <button
            onClick={() => setShowResetDialog(true)}
            className="w-full py-1.5 text-[10px] font-medium text-gray-600 hover:text-gray-400 border border-gray-800/50 hover:border-gray-700/60 rounded-lg transition-all"
          >
            Reset All Data
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden shrink-0 flex items-center gap-2 px-3 h-10 border-b border-gray-800/40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded-md hover:bg-white/5 text-gray-400"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-[11px] font-semibold text-gray-300 capitalize">
            {form.activeView.replace(/-/g, " ")}
          </span>
        </div>

        {/* View content */}
        <div className="flex-1 overflow-hidden">
          <WorkspaceErrorBoundary>
            <ViewRouter view={form.activeView} recordId={form.activeRecordId} />
          </WorkspaceErrorBoundary>
        </div>
      </div>

      {/* Reset confirmation */}
      <ConfirmDialog
        open={showResetDialog}
        title="Reset All Data?"
        description="This will permanently delete all invoices, clients, products, and settings. This cannot be undone."
        confirmLabel="Delete Everything"
        onConfirm={handleReset}
        onCancel={() => setShowResetDialog(false)}
        variant="danger"
      />
    </div>
  );
}
