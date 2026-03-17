// =============================================================================
// DMSuite — Sales Book Step 4: Style & Template
// Template selection, accent colors, fonts, field style, and border style.
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useSalesBookWizard } from "@/stores/sales-book-wizard";
import { useSalesBookEditor } from "@/stores/sales-book-editor";
import {
  SALES_BOOK_TEMPLATES,
  ACCENT_COLORS,
  FONT_PAIRINGS,
  FIELD_STYLES,
  FIELD_STYLE_LABELS,
  BORDER_STYLES,
} from "@/lib/sales-book/schema";

// =============================================================================

export default function SBStepStyle() {
  const { nextStep, prevStep } = useSalesBookWizard();
  const style = useSalesBookEditor((s) => s.form.style);
  const updateStyle = useSalesBookEditor((s) => s.updateStyle);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center mb-8"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="2.5" />
            <circle cx="8.5" cy="7.5" r="2.5" /><circle cx="6.5" cy="12.5" r="2.5" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.36-.12-.68-.37-.93-.24-.26-.37-.58-.37-.93 0-.75.6-1.35 1.35-1.35H16c3.31 0 6-2.69 6-6 0-5.52-4.48-9.8-10-9.8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-100">Style & Template</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose the visual style for your blank form
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* Template */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Template</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SALES_BOOK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => updateStyle({ template: tpl.id, accentColor: tpl.accent, fontPairing: tpl.font })}
                className={`rounded-lg border p-3 text-left transition-all ${
                  style.template === tpl.id
                    ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tpl.accent }} />
                  <span className="text-xs font-medium text-gray-200 truncate">{tpl.name}</span>
                </div>
                <p className="text-[10px] text-gray-500 line-clamp-1">{tpl.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Accent Color</h3>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => updateStyle({ accentColor: color.hex })}
                title={color.label}
                className={`w-8 h-8 rounded-lg transition-all ${
                  style.accentColor === color.hex ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-900 scale-110" : "hover:scale-105"
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>

        {/* Font */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Font Pairing</h3>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {FONT_PAIRINGS.map((fp) => (
              <button
                key={fp.id}
                onClick={() => updateStyle({ fontPairing: fp.id })}
                className={`rounded-lg border p-2.5 text-left transition-all ${
                  style.fontPairing === fp.id
                    ? "border-primary-500 bg-primary-500/10"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                <span className="text-xs text-gray-200">{fp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Field Style */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Blank Field Style</h3>
          <div className="grid grid-cols-3 gap-2">
            {FIELD_STYLES.map((fs) => (
              <button
                key={fs}
                onClick={() => updateStyle({ fieldStyle: fs })}
                className={`rounded-lg border p-3 text-center transition-all ${
                  style.fieldStyle === fs
                    ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                {/* Visual preview */}
                <div className="flex items-end justify-center h-6 mb-2">
                  <div
                    className="w-16"
                    style={{
                      borderBottom:
                        fs === "underline" ? "2px solid #9ca3af"
                          : fs === "dotted" ? "2px dotted #9ca3af"
                            : "none",
                      border: fs === "box" ? "1px solid #9ca3af" : undefined,
                      height: fs === "box" ? "18px" : "auto",
                      borderRadius: fs === "box" ? "2px" : 0,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-300">{FIELD_STYLE_LABELS[fs]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Border Style */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Form Border</h3>
          <div className="grid grid-cols-3 gap-2">
            {BORDER_STYLES.map((bs) => (
              <button
                key={bs}
                onClick={() => updateStyle({ borderStyle: bs })}
                className={`rounded-lg border p-3 text-center transition-all ${
                  style.borderStyle === bs
                    ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-center h-6 mb-2">
                  <div
                    className="w-10 h-6"
                    style={{
                      border:
                        bs === "solid" ? "2px solid #9ca3af"
                          : bs === "double" ? "4px double #9ca3af"
                            : "1px dashed #4b5563",
                    }}
                  />
                </div>
                <span className="text-xs text-gray-300 capitalize">{bs}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className="rounded-lg bg-gray-800 border border-gray-700 px-5 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          className="rounded-lg bg-primary-500 px-5 py-2 text-sm font-semibold text-gray-950 hover:bg-primary-400 transition-colors"
        >
          Preview
        </button>
      </div>
    </div>
  );
}
