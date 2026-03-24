// =============================================================================
// DMSuite — Invoice Step 0: Your Business Information
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useInvoiceWizard } from "@/stores/invoice-wizard";
import { useInvoiceEditor } from "@/stores/invoice-editor";

// ── Inline SVG Icons ──

function IconBuilding({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <line x1="8" y1="6" x2="10" y2="6" /><line x1="14" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="10" y2="14" /><line x1="14" y1="14" x2="16" y2="14" />
    </svg>
  );
}

function IconArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ── Field ──

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const baseClass =
    "w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none transition-all focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20";

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </div>
  );
}

// =============================================================================

export default function StepBusiness() {
  const { nextStep } = useInvoiceWizard();
  const invoice = useInvoiceEditor((s) => s.invoice);
  const updateBusinessInfo = useInvoiceEditor((s) => s.updateBusinessInfo);

  const b = invoice.businessInfo;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center text-center mb-8"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 mb-4">
          <IconBuilding className="text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-100">
          Your Business
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          This information appears on every invoice you send.
        </p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Field
          label="Company / Business Name"
          value={b.name}
          onChange={(v) => updateBusinessInfo({ name: v })}
          placeholder="Acme Corp"
        />
        <Field
          label="Address"
          value={b.address}
          onChange={(v) => updateBusinessInfo({ address: v })}
          placeholder="123 Main St, Suite 100, City, State, ZIP"
          multiline
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Email"
            value={b.email}
            onChange={(v) => updateBusinessInfo({ email: v })}
            placeholder="billing@company.com"
          />
          <Field
            label="Phone"
            value={b.phone}
            onChange={(v) => updateBusinessInfo({ phone: v })}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Website"
            value={b.website}
            onChange={(v) => updateBusinessInfo({ website: v })}
            placeholder="https://company.com"
          />
          <Field
            label="Tax / VAT ID"
            value={b.taxId}
            onChange={(v) => updateBusinessInfo({ taxId: v })}
            placeholder="US-12-3456789"
          />
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end mt-8"
      >
        <button
          onClick={nextStep}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-gray-950 transition-all hover:bg-primary-400 active:scale-[0.98]"
        >
          Continue
          <IconArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
