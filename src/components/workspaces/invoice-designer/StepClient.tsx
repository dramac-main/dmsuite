// =============================================================================
// DMSuite — Invoice Step 1: Client Information
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useInvoiceWizard } from "@/stores/invoice-wizard";
import { useInvoiceEditor } from "@/stores/invoice-editor";

// ── Inline SVG Icons ──

function IconUser({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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

function IconArrowLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
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
    "w-full rounded-lg bg-gray-800/50 border border-gray-700/50 px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none transition-all focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20";

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

export default function StepClient() {
  const { nextStep, prevStep } = useInvoiceWizard();
  const invoice = useInvoiceEditor((s) => s.invoice);
  const updateClientInfo = useInvoiceEditor((s) => s.updateClientInfo);

  const c = invoice.clientInfo;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center text-center mb-8"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary-500/10 border border-secondary-500/20 mb-4">
          <IconUser className="text-secondary-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-100">Client Details</h2>
        <p className="text-sm text-gray-500 mt-1">
          Who is this invoice for?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Client Name"
            value={c.name}
            onChange={(v) => updateClientInfo({ name: v })}
            placeholder="Jane Smith"
          />
          <Field
            label="Company"
            value={c.company}
            onChange={(v) => updateClientInfo({ company: v })}
            placeholder="Client Corp"
          />
        </div>
        <Field
          label="Address"
          value={c.address}
          onChange={(v) => updateClientInfo({ address: v })}
          placeholder="456 Oak Ave, City, State, ZIP"
          multiline
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Email"
            value={c.email}
            onChange={(v) => updateClientInfo({ email: v })}
            placeholder="client@example.com"
          />
          <Field
            label="Phone"
            value={c.phone}
            onChange={(v) => updateClientInfo({ phone: v })}
            placeholder="+1 (555) 987-6543"
          />
        </div>
        <Field
          label="Tax / VAT ID"
          value={c.taxId}
          onChange={(v) => updateClientInfo({ taxId: v })}
          placeholder="Optional"
        />
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-between mt-8"
      >
        <button
          onClick={prevStep}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={nextStep}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-gray-950 transition-all hover:bg-primary-400 active:scale-[0.98]"
        >
          Continue
          <IconArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
