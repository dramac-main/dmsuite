"use client";

// =============================================================================
// Invoice & Accounting Hub — Shared UI Components
// Reusable components across all views in the accounting workspace
// =============================================================================

import { type ReactNode, useState, useRef, useEffect } from "react";
import {
  useInvoiceAccountingEditor,
  formatCurrency,
  type CurrencyCode,
  type InvoiceStatus,
  type QuoteStatus,
  type PaymentMethod,
  type ExpenseCategory,
  PAYMENT_METHODS,
  EXPENSE_CATEGORIES,
} from "@/stores/invoice-accounting-editor";

// ── Status Badge ──

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-gray-700/30", text: "text-gray-400", dot: "bg-gray-500" },
  sent: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
  viewed: { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-500" },
  partial: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
  paid: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  overdue: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  cancelled: { bg: "bg-gray-700/20", text: "text-gray-500", dot: "bg-gray-600" },
  approved: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  declined: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  expired: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-500" },
  converted: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-500" },
  applied: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  void: { bg: "bg-gray-700/20", text: "text-gray-500", dot: "bg-gray-600" },
  accepted: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  received: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  completed: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
  "on-hold": { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${color.bg} ${color.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
      {status}
    </span>
  );
}

// ── Page Header ──

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 h-12 border-b border-gray-800/40">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-gray-100">{title}</h1>
        {subtitle && <span className="text-[10px] text-gray-500">{subtitle}</span>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── Action Button (primary / secondary / danger) ──

export function Btn({
  children,
  onClick,
  variant = "secondary",
  size = "sm",
  icon,
  disabled,
  className = "",
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "xs" | "sm" | "md";
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all disabled:opacity-40 disabled:pointer-events-none";
  const sizes = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-4 py-2 text-xs",
  };
  const variants = {
    primary: "bg-primary-500 text-gray-950 hover:bg-primary-400 shadow-sm shadow-primary-500/20",
    secondary: "bg-gray-800/60 text-gray-300 hover:bg-gray-700/60 border border-gray-700/40",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    ghost: "text-gray-400 hover:text-gray-200 hover:bg-white/5",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

// ── Stat Card ──

export function StatCard({
  label,
  value,
  subValue,
  icon,
  color = "gray",
  onClick,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  color?: "gray" | "green" | "blue" | "amber" | "red" | "purple";
  onClick?: () => void;
}) {
  const colors = {
    gray: "border-gray-800/40 bg-gray-900/50",
    green: "border-emerald-500/20 bg-emerald-500/5",
    blue: "border-blue-500/20 bg-blue-500/5",
    amber: "border-amber-500/20 bg-amber-500/5",
    red: "border-red-500/20 bg-red-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
  };
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={`rounded-xl border p-3 sm:p-4 text-left transition-all ${colors[color]} ${
        onClick ? "cursor-pointer hover:border-gray-700/60" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        {icon && <span className="text-gray-600">{icon}</span>}
      </div>
      <div className="text-lg sm:text-xl font-bold text-gray-100 tabular-nums">{value}</div>
      {subValue && <div className="text-[10px] text-gray-500 mt-0.5">{subValue}</div>}
    </Component>
  );
}

// ── Empty State ──

export function EmptyView({
  icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-xs">
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-gray-800/40 border border-gray-700/30 flex items-center justify-center text-gray-500">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-300 mb-1">{title}</h3>
        <p className="text-[11px] text-gray-500 mb-4">{description}</p>
        {action && onAction && (
          <Btn variant="primary" size="sm" onClick={onAction}>
            {action}
          </Btn>
        )}
      </div>
    </div>
  );
}

// ── Data Table ──

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  render: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  selectedIds,
  onSelectionChange,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const allSelected = data.length > 0 && selectedIds?.length === data.length;

  if (data.length === 0 && emptyTitle) {
    return (
      <EmptyView
        icon={emptyIcon || <InvIconSmall />}
        title={emptyTitle}
        description={emptyDescription || "No records found"}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-gray-800/40">
            {onSelectionChange && (
              <th className="w-8 px-2 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => {
                    if (allSelected) onSelectionChange([]);
                    else onSelectionChange(data.map((r) => r.id));
                  }}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-0"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 ${
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                }`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const isSelected = selectedIds?.includes(row.id);
            return (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-gray-800/20 transition-colors ${
                  onRowClick ? "cursor-pointer hover:bg-white/[0.02]" : ""
                } ${isSelected ? "bg-primary-500/5" : ""}`}
              >
                {onSelectionChange && (
                  <td className="w-8 px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) onSelectionChange(selectedIds!.filter((id) => id !== row.id));
                        else onSelectionChange([...(selectedIds || []), row.id]);
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-0"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 text-[11px] ${
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                    }`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Form Field ──

export function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[9px] text-gray-600 mt-0.5">{hint}</p>}
    </div>
  );
}

// ── Input ──

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  className = "",
}: {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-gray-900/60 border border-gray-700/40 rounded-lg px-3 py-1.5 text-[11px] text-gray-200 placeholder:text-gray-600 focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 outline-none transition-all disabled:opacity-50 ${className}`}
    />
  );
}

// ── Textarea ──

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-gray-900/60 border border-gray-700/40 rounded-lg px-3 py-1.5 text-[11px] text-gray-200 placeholder:text-gray-600 focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 outline-none transition-all resize-none"
    />
  );
}

// ── Select ──

export function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-900/60 border border-gray-700/40 rounded-lg px-3 py-1.5 text-[11px] text-gray-200 focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 outline-none transition-all appearance-none"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// ── Search Bar ──

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg viewBox="0 0 16 16" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-1.5 bg-gray-900/60 border border-gray-700/40 rounded-lg text-[11px] text-gray-200 placeholder:text-gray-600 focus:border-primary-500/40 outline-none transition-all"
      />
    </div>
  );
}

// ── Tab Strip ──

export function TabStrip({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 px-4 sm:px-6 border-b border-gray-800/40 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-all whitespace-nowrap ${
            active === tab.key
              ? "border-primary-500 text-primary-300"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-gray-800/60 text-gray-500">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Small icons for reuse ──

function InvIconSmall() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-5 h-5">
      <path d="M3 1.5h10a1.5 1.5 0 011.5 1.5v10a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 13V3A1.5 1.5 0 013 1.5z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 5h6M5 7.5h4M5 10h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

// ── Back Button ──

export function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-300 transition-colors"
    >
      <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
        <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  );
}

// ── Delete Icon Button ──

export function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="p-1 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
      title="Delete"
    >
      <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ── Client Picker Dropdown ──

export function ClientPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (clientId: string) => void;
}) {
  const clients = useInvoiceAccountingEditor((s) => s.form.clients);
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder="Select client..."
      options={clients.map((c) => ({ value: c.id, label: c.name || "(Unnamed)" }))}
    />
  );
}

// ── Vendor Picker Dropdown ──

export function VendorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (vendorId: string) => void;
}) {
  const vendors = useInvoiceAccountingEditor((s) => s.form.vendors);
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder="Select vendor..."
      options={vendors.map((v) => ({ value: v.id, label: v.name || "(Unnamed)" }))}
    />
  );
}

// ── Tax Rate Picker ──

export function TaxRatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (taxRateId: string) => void;
}) {
  const taxes = useInvoiceAccountingEditor((s) => s.form.taxes);
  return (
    <Select
      value={value}
      onChange={onChange}
      options={taxes.map((t) => ({ value: t.id, label: `${t.name} (${t.rate}%)` }))}
    />
  );
}

// ── Product Picker ──

export function ProductPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (productId: string) => void;
}) {
  const products = useInvoiceAccountingEditor((s) => s.form.products);
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder="Select product..."
      options={products.map((p) => ({ value: p.id, label: `${p.name} — ${formatCurrency(p.unitPrice)}` }))}
    />
  );
}

// ── Formatted date helper ──

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

// ── Section Divider ──

export function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{title}</span>
      <div className="flex-1 border-t border-gray-800/40" />
    </div>
  );
}
