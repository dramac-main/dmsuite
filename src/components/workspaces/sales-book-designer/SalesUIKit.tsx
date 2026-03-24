// =============================================================================
// DMSuite — Sales UI Kit — Global Shared Primitives
// Mobile-first, app-like UI components for ALL sales tools.
// Single source of truth for every toggle, input, tab, card in the sales suite.
// =============================================================================

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
    <div className="shrink-0 flex items-center justify-between px-4 h-11 border-b border-gray-800/40 bg-gray-900/30">
      <div className="flex items-center gap-2 min-w-0">
        {statusDot && (
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
        )}
        <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wide truncate">
          {title}
        </h2>
        {subtitle && (
          <span className="text-[10px] font-mono text-gray-600 shrink-0">
            {subtitle}
          </span>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-0.5 shrink-0">{children}</div>
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

// ─────────────────────────────────────────────────────────────
// SECTION: Editor Tab Navigation (horizontal scrollable)
// ─────────────────────────────────────────────────────────────

export interface EditorTab {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface EditorTabNavProps {
  tabs: EditorTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function EditorTabNav({ tabs, activeTab, onTabChange }: EditorTabNavProps) {
  return (
    <div className="shrink-0 relative">
      <div className="flex overflow-x-auto scrollbar-none border-b border-gray-800/50">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap transition-all relative shrink-0 ${
                active
                  ? "text-primary-400"
                  : "text-gray-500 hover:text-gray-300 active:bg-white/3"
              }`}
            >
              <span className={`shrink-0 transition-colors ${active ? "text-primary-400" : "text-gray-600"}`}>
                {tab.icon}
              </span>
              {tab.label}
              {active && (
                <motion.div
                  layoutId="editor-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-500 rounded-full"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Bottom Action Bar (mobile fixed bar)
// ─────────────────────────────────────────────────────────────

interface BottomBarAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}

interface BottomBarProps {
  actions: BottomBarAction[];
  activeKey?: string;
  onAction: (key: string) => void;
}

export function BottomBar({ actions, activeKey, onAction }: BottomBarProps) {
  return (
    <div className="lg:hidden shrink-0 flex items-center justify-around border-t border-gray-800/50 bg-gray-950/95 backdrop-blur-xl px-2 py-1.5 safe-area-bottom">
      {actions.map((action) => {
        const active = activeKey === action.key;
        return (
          <button
            key={action.key}
            onClick={() => onAction(action.key)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all min-w-14 ${
              action.primary
                ? "bg-primary-500 text-gray-950 shadow-lg shadow-primary-500/20 -mt-3 px-5 py-2 rounded-2xl"
                : active
                  ? "text-primary-400"
                  : "text-gray-500 active:text-gray-300 active:bg-white/5"
            }`}
          >
            {action.icon}
            <span className={`text-[9px] font-semibold uppercase tracking-wide ${action.primary ? "text-gray-950" : ""}`}>
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Section Card (visual container for grouped content)
// ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, description, children, className }: SectionCardProps) {
  return (
    <div className={`rounded-2xl bg-gray-800/30 border border-gray-700/30 p-4 ${className ?? ""}`}>
      {title && (
        <div className="mb-3">
          <h3 className="text-[13px] font-semibold text-gray-200">{title}</h3>
          {description && (
            <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Selection Card (for template / doc type pickers)
// ─────────────────────────────────────────────────────────────

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  colorAccent?: string; // Tailwind border/bg classes for colored cards
  className?: string;
}

export function SelectionCard({ selected, onClick, children, colorAccent, className }: SelectionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-2xl border p-3 text-left transition-all active:scale-[0.97] ${
        selected
          ? colorAccent
            ? `${colorAccent} ring-1`
            : "border-primary-500/50 bg-primary-500/8 ring-1 ring-primary-500/20"
          : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60 hover:bg-gray-800/50"
      } ${className ?? ""}`}
    >
      {children}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-950">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Inline Range Slider
// ─────────────────────────────────────────────────────────────

interface RangeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}

export function RangeSlider({ label, value, onChange, min, max, step = 1, suffix }: RangeSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-gray-400">{label}</span>
        <span className="text-[12px] font-mono text-primary-400 tabular-nums">
          {value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-700/60 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
          [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-primary-500/30
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:active:scale-125"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Color Swatch Picker (with touch-friendly targets)
// ─────────────────────────────────────────────────────────────

interface ColorSwatchPickerProps {
  colors: readonly { hex: string; label: string }[];
  value: string;
  onChange: (hex: string) => void;
}

export function ColorSwatchPicker({ colors, value, onChange }: ColorSwatchPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => {
        const active = value.toLowerCase() === c.hex.toLowerCase();
        return (
          <button
            key={c.hex}
            onClick={() => onChange(c.hex)}
            title={c.label}
            className={`w-8 h-8 rounded-xl transition-all ${
              active ? "ring-2 ring-primary-400 ring-offset-2 ring-offset-gray-900 scale-110" : "hover:scale-105"
            }`}
            style={{ backgroundColor: c.hex }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Confirm Dialog (replaces native confirm/alert)
// ─────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-gray-700/60 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
          >
            <h3 className="text-[15px] font-semibold text-gray-100">{title}</h3>
            {description && (
              <p className="text-[13px] text-gray-400 mt-1.5">{description}</p>
            )}
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-medium text-gray-400 bg-gray-800 border border-gray-700/60 hover:bg-gray-700 transition-all active:scale-[0.97]"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-medium transition-all active:scale-[0.97] ${
                  variant === "danger"
                    ? "bg-error text-white hover:bg-error/90"
                    : "bg-primary-500 text-gray-950 hover:bg-primary-400"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION: Tab Icons for Editor Sections
// ─────────────────────────────────────────────────────────────

export const TabIcons = {
  form: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  ),
  brand: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <line x1="8" y1="6" x2="10" y2="6" /><line x1="14" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="16" y2="10" />
    </svg>
  ),
  style: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="13.5" cy="17.5" r="2.5" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  print: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  more: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  ),
} as const;
