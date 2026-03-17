// =============================================================================
// DMSuite — Sales Document Step 0: Choose Document Type
// Beautiful card grid for selecting invoice, quotation, receipt, etc.
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useInvoiceWizard } from "@/stores/invoice-wizard";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import {
  SALES_DOCUMENT_TYPES,
  DOCUMENT_TYPE_CONFIGS,
  type SalesDocumentType,
} from "@/lib/invoice/schema";

// ── Inline SVG icons for each document type ──

function IconInvoice({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

function IconQuotation({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <circle cx="16" cy="6" r="0" /><path d="M9 9l2 2 4-4" />
    </svg>
  );
}

function IconReceipt({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

function IconDelivery({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconCreditNote({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M15 13H9" />
    </svg>
  );
}

function IconProforma({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="12" cy="15" r="3" />
      <line x1="12" y1="12" x2="12" y2="15" />
      <line x1="12" y1="15" x2="14" y2="14" />
    </svg>
  );
}

function IconPurchaseOrder({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  "file-invoice":  IconInvoice,
  "file-check":    IconQuotation,
  "receipt":       IconReceipt,
  "truck":         IconDelivery,
  "file-minus":    IconCreditNote,
  "file-clock":    IconProforma,
  "shopping-bag":  IconPurchaseOrder,
};

// Accent colors per type for visual differentiation
const typeAccents: Record<SalesDocumentType, string> = {
  "invoice":          "from-blue-500/20 to-blue-600/5 border-blue-500/30 hover:border-blue-400/50",
  "quotation":        "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 hover:border-emerald-400/50",
  "receipt":          "from-amber-500/20 to-amber-600/5 border-amber-500/30 hover:border-amber-400/50",
  "delivery-note":    "from-violet-500/20 to-violet-600/5 border-violet-500/30 hover:border-violet-400/50",
  "credit-note":      "from-rose-500/20 to-rose-600/5 border-rose-500/30 hover:border-rose-400/50",
  "proforma-invoice": "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 hover:border-cyan-400/50",
  "purchase-order":   "from-orange-500/20 to-orange-600/5 border-orange-500/30 hover:border-orange-400/50",
};

const typeIconColors: Record<SalesDocumentType, string> = {
  "invoice":          "text-blue-400",
  "quotation":        "text-emerald-400",
  "receipt":          "text-amber-400",
  "delivery-note":    "text-violet-400",
  "credit-note":      "text-rose-400",
  "proforma-invoice": "text-cyan-400",
  "purchase-order":   "text-orange-400",
};

// =============================================================================

export default function StepDocumentType() {
  const { nextStep } = useInvoiceWizard();
  const documentType = useInvoiceEditor((s) => s.invoice.documentType);
  const setDocumentType = useInvoiceEditor((s) => s.setDocumentType);

  const handleSelect = (type: SalesDocumentType) => {
    setDocumentType(type);
    nextStep();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center text-center mb-10"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 mb-4">
          <IconInvoice className="text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-100">
          What are you creating?
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose a sales document type to get started
        </p>
      </motion.div>

      {/* Document type grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SALES_DOCUMENT_TYPES.map((type, i) => {
          const config = DOCUMENT_TYPE_CONFIGS[type];
          const Icon = iconMap[config.icon] ?? IconInvoice;
          const isSelected = documentType === type;

          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              onClick={() => handleSelect(type)}
              className={`group relative flex flex-col items-start gap-3 rounded-xl border bg-linear-to-br p-4 text-left transition-all ${typeAccents[type]} ${
                isSelected
                  ? "ring-2 ring-primary-500/50 scale-[1.02]"
                  : "hover:scale-[1.01]"
              }`}
            >
              {/* Icon */}
              <div className={`${typeIconColors[type]} transition-transform group-hover:scale-110`}>
                <Icon />
              </div>

              {/* Title */}
              <div>
                <h3 className="text-sm font-semibold text-gray-100">
                  {config.label}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {config.description}
                </p>
              </div>

              {/* Number prefix badge */}
              <span className="text-[10px] font-mono text-gray-600 bg-gray-800/50 rounded px-1.5 py-0.5">
                {config.numberPrefix}XXXX
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  layoutId="doc-type-selected"
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Receipt format hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-xs text-gray-600 mt-6"
      >
        Receipts use a traditional 3-per-page A4 layout for physical sales books
      </motion.p>
    </div>
  );
}
