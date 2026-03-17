// =============================================================================
// DMSuite — Sales Book Section: Document Type
// Compact card grid for selecting document type inside the accordion panel.
// =============================================================================

"use client";

import { useSalesBookEditor } from "@/stores/sales-book-editor";
import {
  SALES_DOCUMENT_TYPES,
  DOCUMENT_TYPE_CONFIGS,
} from "@/lib/sales-book/schema";
import type { SalesDocumentType } from "@/lib/invoice/schema";

const TYPE_COLORS: Record<SalesDocumentType, string> = {
  "invoice":          "border-blue-500/30 hover:border-blue-400/50 bg-blue-500/5",
  "quotation":        "border-emerald-500/30 hover:border-emerald-400/50 bg-emerald-500/5",
  "receipt":          "border-amber-500/30 hover:border-amber-400/50 bg-amber-500/5",
  "delivery-note":    "border-violet-500/30 hover:border-violet-400/50 bg-violet-500/5",
  "credit-note":      "border-rose-500/30 hover:border-rose-400/50 bg-rose-500/5",
  "proforma-invoice": "border-cyan-500/30 hover:border-cyan-400/50 bg-cyan-500/5",
  "purchase-order":   "border-orange-500/30 hover:border-orange-400/50 bg-orange-500/5",
};

export default function SBSectionDocumentType() {
  const documentType = useSalesBookEditor((s) => s.form.documentType);
  const convertToType = useSalesBookEditor((s) => s.convertToType);

  return (
    <div className="grid grid-cols-2 gap-2">
      {SALES_DOCUMENT_TYPES.map((type) => {
        const config = DOCUMENT_TYPE_CONFIGS[type];
        const isSelected = documentType === type;

        return (
          <button
            key={type}
            onClick={() => convertToType(type)}
            className={`relative rounded-lg border p-2.5 text-left transition-all ${TYPE_COLORS[type]} ${
              isSelected ? "ring-2 ring-primary-500/50 scale-[1.02]" : "hover:scale-[1.01]"
            }`}
          >
            <h3 className="text-xs font-semibold text-gray-200">{config.label}</h3>
            <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{config.description}</p>
            {isSelected && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
