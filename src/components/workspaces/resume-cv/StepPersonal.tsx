// =============================================================================
// DMSuite — Resume Step 1: Personal Information
// Collects name, email, phone, location, linkedin, website.
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useResumeCVWizard } from "@/stores/resume-cv-wizard";

// ── Inline SVG Icons ──

function IconUser({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMail({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconPhone({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconMapPin({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconLinkedin({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function IconGlobe({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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

// ---------------------------------------------------------------------------
// Field component
// ---------------------------------------------------------------------------

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <span className="text-gray-500">{icon}</span>
        {label}
        {required && <span className="text-red-400 text-xs">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Component
// ---------------------------------------------------------------------------

export default function StepPersonal() {
  const { personal, updatePersonal, nextStep } = useResumeCVWizard();

  const canContinue =
    personal.name.trim().length > 0 && personal.email.trim().length > 0;

  return (
    <div className="mx-auto max-w-lg px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 mb-4">
          <IconUser />
        </div>
        <h2 className="text-xl font-semibold text-white">Personal Information</h2>
        <p className="text-sm text-gray-400 mt-1">
          Tell us about yourself. This will appear at the top of your resume.
        </p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Field
          label="Full Name"
          icon={<IconUser className="w-4 h-4" />}
          value={personal.name}
          onChange={(v) => updatePersonal("name", v)}
          placeholder="Jane Smith"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Email"
            icon={<IconMail />}
            value={personal.email}
            onChange={(v) => updatePersonal("email", v)}
            placeholder="jane@example.com"
            type="email"
            required
          />
          <Field
            label="Phone"
            icon={<IconPhone />}
            value={personal.phone}
            onChange={(v) => updatePersonal("phone", v)}
            placeholder="+1 (555) 123-4567"
            type="tel"
          />
        </div>

        <Field
          label="Location"
          icon={<IconMapPin />}
          value={personal.location}
          onChange={(v) => updatePersonal("location", v)}
          placeholder="San Francisco, CA"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="LinkedIn"
            icon={<IconLinkedin />}
            value={personal.linkedin}
            onChange={(v) => updatePersonal("linkedin", v)}
            placeholder="linkedin.com/in/janesmith"
          />
          <Field
            label="Website"
            icon={<IconGlobe />}
            value={personal.website}
            onChange={(v) => updatePersonal("website", v)}
            placeholder="janesmith.com"
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
          disabled={!canContinue}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-gray-950 transition-all hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <IconArrowRight />
        </button>
      </motion.div>
    </div>
  );
}
