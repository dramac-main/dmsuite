// =============================================================================
// DMSuite — Step 2: Your Details
// Clean form with Identity, Contact, and Social groups.
// =============================================================================

"use client";

import { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBusinessCardWizard, type UserDetails } from "@/stores/business-card-wizard";
import { useState } from "react";

interface FieldConfig {
  key: keyof UserDetails;
  label: string;
  placeholder: string;
  icon?: string;
  required?: boolean;
  validate?: (v: string) => string | null;
}

const IDENTITY_FIELDS: FieldConfig[] = [
  { key: "name", label: "Full Name", placeholder: "Jane Smith", required: true },
  { key: "title", label: "Title / Position", placeholder: "Creative Director" },
  { key: "company", label: "Company Name", placeholder: "Design Studio Inc." },
  { key: "tagline", label: "Tagline", placeholder: "Design that speaks volumes" },
];

const CONTACT_FIELDS: FieldConfig[] = [
  {
    key: "email",
    label: "Email",
    placeholder: "jane@company.com",
    icon: "✉️",
    validate: (v) =>
      v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Invalid email format" : null,
  },
  { key: "phone", label: "Phone", placeholder: "+1 (555) 123-4567", icon: "📱" },
  {
    key: "website",
    label: "Website",
    placeholder: "www.company.com",
    icon: "🌐",
    validate: (v) =>
      v && !/^(https?:\/\/)?[\w.-]+\.\w{2,}/.test(v) ? "Invalid URL format" : null,
  },
  { key: "address", label: "Address", placeholder: "123 Design St, Creative City", icon: "📍" },
];

const SOCIAL_FIELDS: FieldConfig[] = [
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/janesmith" },
  { key: "twitter", label: "Twitter / X", placeholder: "@janesmith" },
  { key: "instagram", label: "Instagram", placeholder: "@janesmithdesign" },
];

function FormField({
  field,
  value,
  onChange,
  error,
}: {
  field: FieldConfig;
  value: string;
  onChange: (v: string) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
        {field.icon && <span className="text-sm">{field.icon}</span>}
        {field.label}
        {field.required && <span className="text-primary-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={`w-full px-3 py-2.5 rounded-lg bg-gray-800 border text-sm text-white placeholder:text-gray-600 outline-none transition-all duration-200 ${
          error
            ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
            : "border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
        }`}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export default function StepDetails() {
  const { details, updateDetail, nextStep, prevStep } = useBusinessCardWizard();
  const [showSocial, setShowSocial] = useState(
    !!(details.linkedin || details.twitter || details.instagram)
  );
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const handleChange = useCallback(
    (key: keyof UserDetails, value: string) => {
      updateDetail(key, value);
      setTouched((prev) => new Set(prev).add(key));
    },
    [updateDetail]
  );

  // Validation
  const errors = useMemo(() => {
    const errs: Partial<Record<keyof UserDetails, string>> = {};
    if (touched.has("name") && !details.name.trim()) {
      errs.name = "Name is required";
    }
    for (const field of [...CONTACT_FIELDS, ...SOCIAL_FIELDS]) {
      if (field.validate && touched.has(field.key)) {
        const err = field.validate(details[field.key]);
        if (err) errs[field.key] = err;
      }
    }
    return errs;
  }, [details, touched]);

  const canContinue = details.name.trim().length > 0 && Object.keys(errors).length === 0;

  return (
    <div className="flex flex-col items-center min-h-[60vh] gap-6 px-4 py-2 max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-semibold text-white mb-2">Your Details</h2>
        <p className="text-gray-400 text-sm">
          Enter the information you'd like on your business card.
        </p>
      </motion.div>

      {/* Identity Group */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full bg-gray-800/30 rounded-xl p-5 border border-gray-700/40 space-y-4"
      >
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
          Identity
        </p>
        <div className="space-y-3">
          {IDENTITY_FIELDS.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={details[field.key]}
              onChange={(v) => handleChange(field.key, v)}
              error={errors[field.key] ?? null}
            />
          ))}
        </div>
      </motion.div>

      {/* Contact Group */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full bg-gray-800/30 rounded-xl p-5 border border-gray-700/40 space-y-4"
      >
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
          Contact
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONTACT_FIELDS.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={details[field.key]}
              onChange={(v) => handleChange(field.key, v)}
              error={errors[field.key] ?? null}
            />
          ))}
        </div>
      </motion.div>

      {/* Social Group (collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        <button
          onClick={() => setShowSocial(!showSocial)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors mb-3"
        >
          <motion.span
            animate={{ rotate: showSocial ? 90 : 0 }}
            className="text-xs"
          >
            ▶
          </motion.span>
          {showSocial ? "Hide Social Links" : "Add Social Links"}
        </button>

        <AnimatePresence>
          {showSocial && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-700/40 space-y-3">
                {SOCIAL_FIELDS.map((field) => (
                  <FormField
                    key={field.key}
                    field={field}
                    value={details[field.key]}
                    onChange={(v) => handleChange(field.key, v)}
                    error={errors[field.key] ?? null}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 pt-2"
      >
        <button
          onClick={prevStep}
          className="px-5 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>
        <motion.button
          whileHover={{ scale: canContinue ? 1.02 : 1 }}
          whileTap={{ scale: canContinue ? 0.98 : 1 }}
          onClick={nextStep}
          disabled={!canContinue}
          className={`px-8 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all ${
            canContinue
              ? "bg-primary-500 text-gray-950 shadow-primary-500/20 hover:bg-primary-400"
              : "bg-gray-700 text-gray-500 cursor-not-allowed shadow-none"
          }`}
        >
          Continue →
        </motion.button>
      </motion.div>
    </div>
  );
}
