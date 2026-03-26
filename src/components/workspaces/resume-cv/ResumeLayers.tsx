// =============================================================================
// DMSuite — Resume Layers Panel
// Figma-style layer tree for the resume document preview.
// Hover to highlight on canvas, click to open corresponding editor section.
// Follows ContractLayersPanel.tsx architecture exactly.
// =============================================================================

"use client";

import { useCallback, useState } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import { BUILT_IN_SECTIONS } from "@/lib/resume/schema";

// ── Layer definition ──

interface Layer {
  id: string;
  label: string;
  section: string; // maps to data-resume-section value & accordion key
  icon: React.ReactNode;
  visible: boolean;
  toggleKey?: string; // section key for visibility toggle
  children?: Layer[];
}

// ── Icons ──

const Eye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LI = ({ d, extra }: { d: string; extra?: React.ReactNode }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d={d} />{extra}
  </svg>
);

// ── Section icon mapping ──

const SECTION_ICONS: Record<string, React.ReactNode> = {
  basics: <LI d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" extra={<circle cx="12" cy="7" r="4" />} />,
  summary: <LI d="M4 7h16M4 12h16M4 17h12" />,
  experience: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M20 7h-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" /><path d="M10 5h4v2h-4z" />
    </svg>
  ),
  education: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  skills: <LI d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84z" extra={<><circle cx="17.5" cy="17.5" r="4.5" /><rect x="3" y="13.5" width="8" height="8" /></>} />,
  certifications: <LI d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  languages: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  volunteer: <LI d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
  projects: <LI d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" extra={<path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />} />,
  awards: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  references: <LI d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" extra={<><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>} />,
};

// ── Section display labels ──

const SECTION_LABELS: Record<string, string> = {
  basics: "Contact Information",
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
  volunteer: "Volunteer",
  projects: "Projects",
  awards: "Awards",
  references: "References",
};

// ── Build layer tree from resume store state ──

function useLayers(): Layer[] {
  const resume = useResumeEditor((s) => s.resume);
  const sections = resume.sections as unknown as Record<string, {
    title?: string;
    hidden?: boolean;
    content?: string;
    items?: Array<{ hidden?: boolean; name?: string; position?: string; company?: string; institution?: string; degree?: string; title?: string; organization?: string }>;
  }>;

  const layers: Layer[] = [];

  // Header (contact info) — always present
  layers.push({
    id: "basics",
    label: resume.basics.name || "Contact Information",
    section: "basics",
    icon: SECTION_ICONS.basics,
    visible: true,
    children: [
      { id: "basics-name", label: resume.basics.name || "[Name]", section: "basics", icon: <LI d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />, visible: !!resume.basics.name },
      { id: "basics-headline", label: resume.basics.headline || "[Headline]", section: "basics", icon: <LI d="M4 7h16M4 12h10" />, visible: !!resume.basics.headline },
      { id: "basics-email", label: resume.basics.email || "[Email]", section: "basics", icon: <LI d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" extra={<polyline points="22,6 12,13 2,6" />} />, visible: !!resume.basics.email },
      { id: "basics-phone", label: resume.basics.phone || "[Phone]", section: "basics", icon: <LI d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />, visible: !!resume.basics.phone },
    ],
  });

  // Summary
  layers.push({
    id: "summary",
    label: sections.summary?.title || "Professional Summary",
    section: "summary",
    icon: SECTION_ICONS.summary,
    visible: !sections.summary?.hidden && !!sections.summary?.content,
    toggleKey: "summary",
  });

  // List-based sections
  for (const key of BUILT_IN_SECTIONS) {
    if (key === "summary") continue;
    const sec = sections[key];
    if (!sec) continue;
    const items = sec.items ?? [];
    const visibleItems = items.filter((it) => !it.hidden);

    const children: Layer[] = visibleItems.map((item, i) => {
      let label = `#${i + 1}`;
      if (key === "experience") label = item.position || item.company || label;
      else if (key === "education") label = item.degree || item.institution || label;
      else if (key === "skills") label = item.name || label;
      else if (key === "certifications") label = item.name || label;
      else if (key === "languages") label = item.name || label;
      else if (key === "volunteer") label = item.organization || item.title || label;
      else if (key === "projects") label = item.name || label;
      else if (key === "awards") label = item.title || label;
      else if (key === "references") label = item.name || label;

      return {
        id: `${key}-${i}`,
        label,
        section: key,
        icon: SECTION_ICONS[key] || <LI d="M4 7h16M4 12h16M4 17h7" />,
        visible: true,
      };
    });

    layers.push({
      id: key,
      label: `${SECTION_LABELS[key] || sec.title || key} (${visibleItems.length})`,
      section: key,
      icon: SECTION_ICONS[key] || <LI d="M4 7h16M4 12h16M4 17h7" />,
      visible: !sec.hidden && visibleItems.length > 0,
      toggleKey: key,
      children: children.length > 0 ? children : undefined,
    });
  }

  // Custom sections
  for (const custom of resume.customSections ?? []) {
    layers.push({
      id: custom.id,
      label: custom.title || "Custom Section",
      section: custom.id,
      icon: <LI d="M12 5v14M5 12h14" />,
      visible: !custom.hidden,
    });
  }

  return layers;
}

// ── Layer Row Component ──

function LayerRow({
  layer,
  depth,
  hoveredLayer,
  onHover,
  onLeave,
  onClick,
  onToggle,
}: {
  layer: Layer;
  depth: number;
  hoveredLayer: string | null;
  onHover: (id: string, section: string) => void;
  onLeave: () => void;
  onClick: (section: string) => void;
  onToggle: (toggleKey: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isHovered = hoveredLayer === layer.id;
  const hasChildren = layer.children && layer.children.length > 0;

  return (
    <>
      <div
        className={`relative flex items-center gap-2 py-1.5 pr-2 cursor-pointer rounded-lg mx-1 transition-all group ${
          isHovered
            ? "bg-primary-500/12 text-primary-200 shadow-sm shadow-primary-500/5"
            : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
        }`}
        style={{ paddingLeft: `${10 + depth * 16}px` }}
        onMouseEnter={() => onHover(layer.id, layer.section)}
        onMouseLeave={onLeave}
        onClick={() => onClick(layer.section)}
      >
        {depth > 0 && (
          <span
            className="absolute top-0 bottom-0 border-l border-gray-700/30"
            style={{ left: `${10 + (depth - 1) * 16 + 7}px` }}
          />
        )}

        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-4 h-4 flex items-center justify-center shrink-0 rounded text-gray-600 hover:text-gray-300 hover:bg-gray-700/40 transition-colors"
          >
            <svg width="9" height="9" viewBox="0 0 8 8" fill="currentColor" className={`transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}>
              <path d="M2 1l4 3-4 3z" />
            </svg>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <span className={`shrink-0 size-1.5 rounded-full transition-colors ${
          layer.visible ? "bg-primary-400/80" : "bg-gray-600/40"
        }`} />

        <span className={`shrink-0 transition-opacity ${layer.visible ? "" : "opacity-25"}`}>
          {layer.icon}
        </span>

        <span className={`text-xs leading-tight truncate flex-1 transition-opacity ${
          layer.visible ? "" : "opacity-35 line-through decoration-gray-600"
        }`}>
          {layer.label}
        </span>

        {layer.toggleKey ? (
          <button
            className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-700/50 transition-all"
            onClick={(e) => { e.stopPropagation(); onToggle(layer.toggleKey!); }}
            title={layer.visible ? "Hide" : "Show"}
          >
            {layer.visible ? <Eye /> : <EyeOff />}
          </button>
        ) : (
          <span className="shrink-0 w-6" />
        )}
      </div>

      {hasChildren && expanded && layer.children!.map((child) => (
        <LayerRow
          key={child.id}
          layer={child}
          depth={depth + 1}
          hoveredLayer={hoveredLayer}
          onHover={onHover}
          onLeave={onLeave}
          onClick={onClick}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

// ── Main Layers Panel ──

interface ResumeLayersPanelProps {
  onOpenSection: (section: string) => void;
  onHoverSection: (section: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ResumeLayers({ onOpenSection, onHoverSection, collapsed, onToggleCollapse }: ResumeLayersPanelProps) {
  const layers = useLayers();
  const toggleSectionVisibility = useResumeEditor((s) => s.toggleSectionVisibility);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const handleHover = useCallback((id: string, section: string) => {
    setHoveredLayer(id);
    onHoverSection(section);
  }, [onHoverSection]);

  const handleLeave = useCallback(() => {
    setHoveredLayer(null);
    onHoverSection(null);
  }, [onHoverSection]);

  const handleClick = useCallback((section: string) => {
    onOpenSection(section);
  }, [onOpenSection]);

  const handleToggle = useCallback((toggleKey: string) => {
    toggleSectionVisibility(toggleKey);
  }, [toggleSectionVisibility]);

  // Collapsed: slim vertical tab
  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="shrink-0 w-8 flex flex-col items-center justify-center gap-2 border-l border-gray-800/50 bg-gray-900/30 hover:bg-gray-800/40 transition-colors cursor-pointer group"
        title="Show Layers"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-gray-300 transition-colors">
          <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
        </svg>
        <span className="text-[9px] text-gray-600 group-hover:text-gray-400 [writing-mode:vertical-lr] tracking-widest uppercase font-medium transition-colors">Layers</span>
      </button>
    );
  }

  const visibleCount = layers.reduce(
    (n, l) => n + (l.visible ? 1 : 0) + (l.children?.filter((c) => c.visible).length ?? 0),
    0
  );
  const totalCount = layers.reduce((n, l) => n + 1 + (l.children?.length ?? 0), 0);

  return (
    <div className="shrink-0 w-56 flex flex-col border-l border-gray-800/50 bg-gray-900/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800/40">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="text-xs font-semibold text-gray-300 tracking-wide">Layers</span>
          <span className="text-[10px] text-gray-600 font-mono">{visibleCount}/{totalCount}</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-all"
          title="Collapse layers"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
          </svg>
        </button>
      </div>

      {/* Layer tree */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {layers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            depth={0}
            hoveredLayer={hoveredLayer}
            onHover={handleHover}
            onLeave={handleLeave}
            onClick={handleClick}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}
