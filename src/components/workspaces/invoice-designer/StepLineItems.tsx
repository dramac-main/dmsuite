// =============================================================================
// DMSuite — Invoice Step 2: Line Items
// Dynamic line items: add, remove, edit, reorder with drag-and-drop.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvoiceWizard } from "@/stores/invoice-wizard";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import {
  createDefaultLineItem,
  calcLineItemTotal,
  calcLineItemTax,
  formatMoney,
  CURRENCIES,
  type CurrencyCode,
} from "@/lib/invoice/schema";

// ── Icons ──

function IconList({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconCopy({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconArrowLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ---------------------------------------------------------------------------

export default function StepLineItems() {
  const { nextStep, prevStep } = useInvoiceWizard();
  const invoice = useInvoiceEditor((s) => s.invoice);
  const addLineItem = useInvoiceEditor((s) => s.addLineItem);
  const updateLineItem = useInvoiceEditor((s) => s.updateLineItem);
  const removeLineItem = useInvoiceEditor((s) => s.removeLineItem);
  const duplicateLineItem = useInvoiceEditor((s) => s.duplicateLineItem);
  const setCurrency = useInvoiceEditor((s) => s.setCurrency);

  const items = invoice.lineItems;
  const cur = invoice.currency;

  const [expandedId, setExpandedId] = useState<string | null>(
    items.length > 0 ? items[0].id : null
  );

  const handleAdd = useCallback(() => {
    addLineItem();
  }, [addLineItem]);

  const handleRemove = useCallback(
    (id: string) => {
      removeLineItem(id);
      if (expandedId === id) setExpandedId(null);
    },
    [removeLineItem, expandedId]
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center text-center mb-8"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 mb-4">
          <IconList className="text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-100">Line Items</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add the products or services you&apos;re billing for.
        </p>
      </motion.div>

      {/* Currency selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 mb-4"
      >
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</label>
        <select
          value={cur.code}
          onChange={(e) => {
            const found = CURRENCIES.find((c) => c.code === e.target.value);
            if (found) setCurrency({ code: found.code, symbol: found.symbol, locale: found.locale });
          }}
          className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-2.5 py-1.5 text-sm text-gray-200 outline-none focus:border-primary-500/50"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code} — {c.name}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Line items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => {
            const isOpen = expandedId === item.id;
            const total = calcLineItemTotal(item) + calcLineItemTax(item);

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="rounded-xl border border-gray-700/50 bg-gray-800/30 overflow-hidden"
              >
                {/* Collapsed row */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : item.id)}
                  className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700/60 text-[10px] font-bold text-gray-400">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-200 truncate">
                      {item.description || "Untitled item"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-300 tabular-nums">
                      {formatMoney(total, cur)}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IconChevronDown className="text-gray-500" />
                    </motion.div>
                  </div>
                </button>

                {/* Expanded form */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-700/30">
                        {/* Description */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(item.id, { description: e.target.value })
                            }
                            placeholder="Website Design & Development"
                            className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-primary-500/50"
                          />
                        </div>

                        {/* Qty + Unit Price */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Quantity</label>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(item.id, {
                                  quantity: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary-500/50 tabular-nums"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Unit Price</label>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateLineItem(item.id, {
                                  unitPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary-500/50 tabular-nums"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Tax Rate %</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step="any"
                              value={item.taxRate}
                              onChange={(e) =>
                                updateLineItem(item.id, {
                                  taxRate: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary-500/50 tabular-nums"
                            />
                          </div>
                        </div>

                        {/* Discount */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">Discount Type</label>
                            <select
                              value={item.discountType}
                              onChange={(e) =>
                                updateLineItem(item.id, {
                                  discountType: e.target.value as "percent" | "fixed",
                                })
                              }
                              className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary-500/50"
                            >
                              <option value="percent">Percentage (%)</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">
                              {item.discountType === "percent"
                                ? "Discount %"
                                : "Discount Amount"}
                            </label>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.discountValue}
                              onChange={(e) =>
                                updateLineItem(item.id, {
                                  discountValue: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary-500/50 tabular-nums"
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => duplicateLineItem(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-colors"
                          >
                            <IconCopy /> Duplicate
                          </button>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <IconTrash /> Remove
                          </button>
                          <div className="flex-1" />
                          <span className="text-sm font-medium text-gray-300 tabular-nums">
                            {formatMoney(total, cur)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Add item button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4"
      >
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-700/50 py-3 text-sm text-gray-400 hover:text-primary-400 hover:border-primary-500/30 transition-colors"
        >
          <IconPlus /> Add Line Item
        </button>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex justify-between mt-8"
      >
        <button
          onClick={prevStep}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={items.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-gray-950 transition-all hover:bg-primary-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <IconArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
