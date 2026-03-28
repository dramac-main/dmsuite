// =============================================================================
// DMSuite — Certificate Template Picker
// Responsive gallery grid for selecting a certificate template.
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { CERTIFICATE_TEMPLATES, type CertificateTemplate, type TemplateCategory } from "@/data/certificate-templates";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CertificateTemplatePickerProps {
  onSelect: (template: CertificateTemplate) => void;
  onAskChiko?: () => void;
  onStartBlank?: () => void;
}

// ---------------------------------------------------------------------------
// Category Badges
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  formal: "bg-amber-500/20 text-amber-400",
  modern: "bg-cyan-500/20 text-cyan-400",
  artistic: "bg-purple-500/20 text-purple-400",
  minimal: "bg-gray-500/20 text-gray-400",
};

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  formal: "Formal",
  modern: "Modern",
  artistic: "Artistic",
  minimal: "Minimal",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CertificateTemplatePicker({
  onSelect,
  onAskChiko,
  onStartBlank,
}: CertificateTemplatePickerProps) {
  const [filter, setFilter] = useState<TemplateCategory | "all">("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return CERTIFICATE_TEMPLATES;
    return CERTIFICATE_TEMPLATES.filter((t) => t.category === filter);
  }, [filter]);

  const categories: (TemplateCategory | "all")[] = ["all", "formal", "modern", "artistic", "minimal"];

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100">Choose a Template</h2>
        <p className="mt-1 text-sm text-gray-400">
          Select a certificate template to get started, or ask Chiko to design one for you.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        {onAskChiko && (
          <button
            onClick={onAskChiko}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-gray-950 hover:bg-primary-400 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Ask Chiko
          </button>
        )}
        {onStartBlank && (
          <button
            onClick={onStartBlank}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Start Blank
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === cat
                ? "bg-primary-500 text-gray-950"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            }`}
          >
            {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`group relative overflow-hidden rounded-xl border transition-all duration-200 text-left ${
              hoveredId === template.id
                ? "border-primary-500 ring-2 ring-primary-500/30 scale-[1.02]"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            {/* Thumbnail */}
            <div className="relative aspect-[600/424] w-full bg-gray-900">
              <Image
                src={template.thumbnail}
                alt={template.name}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-linear-to-t from-gray-950/80 via-transparent to-transparent" />
            </div>

            {/* Info bar */}
            <div className="p-3 bg-gray-900">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-100 truncate">{template.name}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[template.category]}`}>
                  {CATEGORY_LABELS[template.category]}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400 line-clamp-2">{template.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
