// =============================================================================
// DMSuite — Sales UI Kit — Global Shared Primitives
// Uniform, mobile-first UI components for ALL sales tools.
// Single source of truth — no more duplicate Toggles, inputs, accordions.
// =============================================================================

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────
// SECTION: Accordion
// ─────────────────────────────────────────────────────────────

interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
  highlighted?: boolean;
  /** Optional credit cost indicator (subtle) */
  creditCost?: number;
}

export function AccordionSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  badge,
  highlighted,
  creditCost,
}: AccordionSectionProps) {
  return (
    <div
      className={`border-b border-gray-800/40 transition-shadow duration-700 ${
        highlighted ? "sb-section-glow" : ""
      }`}
    >
      <button
        onClick={onToggle}
        className="flex items-center w-full px-4 py-3.5 text-left hover:bg-white/2 active:bg-white/4 transition-colors group"
      >
        <span className="text-gray-500 group-hover:text-primary-400 transition-colors mr-3 shrink-0">
          {icon}
        </span>
        <span className="text-[13px] font-medium text-gray-200 flex-1 truncate">
          {title}
        </span>
        {badge && (
          <span className="text-[10px] font-medium text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-full px-2 py-0.5 mr-2 max-w-24 truncate">
            {badge}
          </span>
        )}
        {creditCost != null && creditCost > 0 && (
          <span className="text-[9px] text-gray-600 mr-2 font-mono">
            {creditCost}cr
          </span>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-gray-600 group-hover:text-gray-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Toggle Switch
// ─────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  /** Optional description text below label */
  description?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <label
      className={`flex items-start gap-2.5 cursor-pointer group ${
        disabled ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors shrink-0 mt-0.5 ${
          checked ? "bg-primary-500" : "bg-gray-700 group-hover:bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-[13px] text-gray-300 group-hover:text-gray-100 transition-colors leading-tight">
          {label}
        </span>
        {description && (
          <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Form Input
// ─────────────────────────────────────────────────────────────

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Hint text below the input */
  hint?: string;
}

export function FormInput({ label, hint, className, ...props }: FormInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3.5 py-2 text-[13px] text-gray-100 placeholder-gray-600 
          focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-gray-800/80 
          outline-none transition-all ${className ?? ""}`}
      />
      {hint && (
        <p className="text-[10px] text-gray-600 mt-1 leading-snug">{hint}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Form Textarea
// ─────────────────────────────────────────────────────────────

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function FormTextarea({ label, hint, className, ...props }: FormTextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3.5 py-2 text-[13px] text-gray-100 placeholder-gray-600 resize-none
          focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-gray-800/80 
          outline-none transition-all ${className ?? ""}`}
      />
      {hint && (
        <p className="text-[10px] text-gray-600 mt-1 leading-snug">{hint}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Form Select
// ─────────────────────────────────────────────────────────────

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

export function FormSelect({ label, hint, className, children, ...props }: FormSelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3.5 py-2 text-[13px] text-gray-100 
          focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-gray-800/80 
          outline-none transition-all appearance-none ${className ?? ""}`}
      >
        {children}
      </select>
      {hint && (
        <p className="text-[10px] text-gray-600 mt-1 leading-snug">{hint}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Section Label (inline section heading)
// ─────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
      {children}
    </h3>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Advanced / Progressive Disclosure Toggle
// ─────────────────────────────────────────────────────────────

interface AdvancedToggleProps {
  open: boolean;
  onToggle: () => void;
  label?: string;
}

export function AdvancedToggle({
  open,
  onToggle,
  label = "Advanced",
}: AdvancedToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-primary-400 transition-colors mt-2 group"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
      <span className="group-hover:underline underline-offset-2">{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Info Badge (credit cost, counts, etc.)
// ─────────────────────────────────────────────────────────────

interface InfoBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "muted";
}

export function InfoBadge({ children, variant = "default" }: InfoBadgeProps) {
  const cls =
    variant === "primary"
      ? "text-primary-400 bg-primary-500/10 border-primary-500/20"
      : variant === "muted"
        ? "text-gray-500 bg-gray-800/50 border-gray-700/50"
        : "text-gray-400 bg-gray-800/40 border-gray-700/40";

  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium border rounded-full px-2 py-0.5 ${cls}`}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Chip / Pill Selector
// ─────────────────────────────────────────────────────────────

interface ChipOption {
  value: string;
  label: string;
  /** Optional icon or mini preview */
  icon?: React.ReactNode;
}

interface ChipGroupProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  /** Layout direction */
  direction?: "horizontal" | "grid";
  columns?: number;
}

export function ChipGroup({
  options,
  value,
  onChange,
  direction = "horizontal",
  columns = 3,
}: ChipGroupProps) {
  return (
    <div
      className={
        direction === "horizontal"
          ? "flex flex-wrap gap-1.5"
          : `grid gap-1.5`
      }
      style={
        direction === "grid" ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined
      }
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-medium transition-all ${
              isSelected
                ? "border-primary-500/50 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/20"
                : "border-gray-700/60 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:text-gray-300 hover:bg-gray-800/60"
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Section Icon Helper
// ─────────────────────────────────────────────────────────────

export function SIcon({ d, extra }: { d: string; extra?: React.ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
      {extra}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Mobile Tab Bar
// ─────────────────────────────────────────────────────────────

interface TabBarProps {
  tabs: { key: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function MobileTabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="lg:hidden shrink-0 flex border-b border-gray-800/40 bg-gray-950/80 backdrop-blur-sm">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-semibold text-center transition-all ${
            activeTab === tab.key
              ? "text-primary-400 border-b-2 border-primary-500 bg-primary-500/5"
              : "text-gray-500 hover:text-gray-300 active:bg-white/2"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Workspace Header Bar
// ─────────────────────────────────────────────────────────────

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  /** Left-side status indicator */
  statusDot?: boolean;
  children?: React.ReactNode;
}

export function WorkspaceHeader({
  title,
  subtitle,
  statusDot = true,
  children,
}: WorkspaceHeaderProps) {
  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-800/40 bg-gray-900/30 backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0">
        {statusDot && (
          <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
        )}
        <h2 className="text-[13px] font-semibold text-gray-200 truncate">
          {title}
        </h2>
        {subtitle && (
          <span className="text-[10px] font-mono text-gray-600 shrink-0">
            {subtitle}
          </span>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-1 shrink-0">{children}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Icon Button (undo, redo, etc.)
// ─────────────────────────────────────────────────────────────

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  tooltip?: string;
}

export function IconButton({
  icon,
  tooltip,
  disabled,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      title={tooltip}
      className={`p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/6 active:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-all ${className ?? ""}`}
    >
      {icon}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Empty State
// ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-gray-800/50 border border-gray-700/40 flex items-center justify-center mb-3 text-gray-600">
          {icon}
        </div>
      )}
      <h3 className="text-[13px] font-medium text-gray-400">{title}</h3>
      {description && (
        <p className="text-[11px] text-gray-600 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Action Button (primary CTA)
// ─────────────────────────────────────────────────────────────

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

export function ActionButton({
  variant = "primary",
  size = "sm",
  icon,
  children,
  className,
  ...props
}: ActionButtonProps) {
  const base = "inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl transition-all active:scale-[0.97]";
  const sizeMap = {
    sm: "px-3 py-1.5 text-[12px]",
    md: "px-4 py-2 text-[13px]",
  };
  const variantMap = {
    primary:
      "bg-primary-500 text-gray-950 hover:bg-primary-400 shadow-sm shadow-primary-500/20",
    secondary:
      "bg-gray-800 text-gray-200 border border-gray-700/60 hover:bg-gray-700 hover:border-gray-600",
    ghost:
      "text-gray-400 hover:text-gray-200 hover:bg-white/6",
    danger:
      "bg-error/15 text-error border border-error/20 hover:bg-error/25",
  };

  return (
    <button
      {...props}
      className={`${base} ${sizeMap[size]} ${variantMap[variant]} ${className ?? ""}`}
    >
      {icon}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Inline SVG Icons (common)
// ─────────────────────────────────────────────────────────────

export const Icons = {
  undo: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  redo: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
    </svg>
  ),
  print: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  convert: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  ),
  zoomIn: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  zoomOut: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  preview: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  layers: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  image: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
} as const;
