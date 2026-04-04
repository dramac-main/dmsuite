"use client";
/**
 * Shared Page Components — Resume V2 Template Rendering
 * Field names match schema.ts exactly (website, period, school, etc.)
 */
import React from "react";
import DOMPurify from "dompurify";
import { useResumeV2Editor } from "@/stores/resume-v2-editor";
import type {
  SectionType,
  ExperienceItem as TExp,
  EducationItem as TEdu,
  SkillItem as TSkill,
  LanguageItem as TLang,
  ProfileItem as TProfile,
  ProjectItem as TProject,
  AwardItem as TAward,
  CertificationItem as TCert,
  PublicationItem as TPub,
  VolunteerItem as TVol,
  ReferenceItem as TRef,
  InterestItem as TInt,
  CustomFieldItem,
} from "@/lib/resume-v2/schema";
import { getSectionTitle } from "@/lib/resume-v2/schema";

/* ─── TiptapContent ─────────────────────────────────── */
export function TiptapContent({ content, className = "" }: { content: string; className?: string }) {
  if (!content || content === "<p></p>") return null;
  const clean = DOMPurify.sanitize(content);
  return <div className={`rv2-tiptap ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}

/* ─── PageLink ──────────────────────────────────────── */
export function PageLink({ url, label, className = "" }: { url: string; label?: string; className?: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow" className={`rv2-link ${className}`}>
      {label || url}
    </a>
  );
}

/* ─── PageIcon ──────────────────────────────────────── */
export function PageIcon({ iconName, size = 14, className = "" }: { iconName?: string; size?: number; className?: string }) {
  if (!iconName) return null;
  const hideIcons = useResumeV2Editor((s) => s.resume.metadata.page.hideIcons);
  if (hideIcons) return null;
  return <i className={`ph ph-${iconName} ${className}`} style={{ fontSize: `${size}px`, lineHeight: 1 }} />;
}

/* ─── PagePicture ───────────────────────────────────── */
export function PagePicture({ className = "" }: { className?: string }) {
  const picture = useResumeV2Editor((s) => s.resume.picture);
  if (picture.hidden || !picture.url) return null;
  return (
    <img
      src={picture.url}
      alt="Profile"
      className={className}
      style={{
        width: `${picture.size}pt`,
        height: `${picture.size / (picture.aspectRatio || 1)}pt`,
        objectFit: "cover",
        borderRadius: `${picture.borderRadius}pt`,
        borderWidth: `${picture.borderWidth}pt`,
        borderStyle: picture.borderWidth > 0 ? "solid" : "none",
        borderColor: picture.borderColor,
        boxShadow: picture.shadowWidth > 0 ? `0 0 ${picture.shadowWidth}pt ${picture.shadowColor}` : "none",
        transform: `rotate(${picture.rotation}deg)`,
      }}
    />
  );
}

/* ─── PageLevel ─────────────────────────────────────── */
export function PageLevel({ level, maxLevel = 5 }: { level: number; maxLevel?: number }) {
  const levelDesign = useResumeV2Editor((s) => s.resume.metadata.design.level);
  const filled = Math.min(level, maxLevel);
  const design = levelDesign.type;

  if (design === "hidden") return null;

  if (design === "progress-bar") {
    const pct = (filled / maxLevel) * 100;
    return (
      <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: "var(--page-text-color)", opacity: 0.2 }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--page-primary-color)" }} />
      </div>
    );
  }

  const shape = design === "circle" ? "rounded-full" : design === "square" ? "" : "rounded-sm";
  const sizeClass = design === "rectangle" || design === "rectangle-full" ? "h-1.5 w-4" : "size-2";

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxLevel }).map((_, i) => (
        <span
          key={i}
          className={`inline-block ${sizeClass} ${shape}`}
          style={{
            backgroundColor: i < filled ? "var(--page-primary-color)" : "var(--page-text-color)",
            opacity: i < filled ? 1 : 0.2,
          }}
        />
      ))}
    </div>
  );
}

/* ─── LinkedTitle ────────────────────────────────────── */
export function LinkedTitle({ title, url, className = "" }: { title: string; url?: string; className?: string }) {
  if (!title) return null;
  if (url) {
    return <a href={url} target="_blank" rel="noopener noreferrer nofollow" className={`rv2-link ${className}`}>{title}</a>;
  }
  return <span className={className}>{title}</span>;
}

/* ─── PageSummary ───────────────────────────────────── */
export function PageSummary() {
  const summary = useResumeV2Editor((s) => s.resume.summary);
  if (summary.hidden || !summary.content) return null;
  return (
    <section>
      <h3 className="rv2-heading mb-1">{summary.title || "Summary"}</h3>
      <TiptapContent content={summary.content} />
    </section>
  );
}

/* ─── PageSection (generic) ────────────────────────── */
export function PageSection<T extends { id: string; hidden?: boolean }>({
  sectionKey,
  children,
  columns,
  className = "",
}: {
  sectionKey: string;
  children: (item: T, index: number) => React.ReactNode;
  columns?: number;
  className?: string;
}) {
  const section = useResumeV2Editor((s) => {
    const std = (s.resume.sections as Record<string, unknown>)[sectionKey] as
      | { title: string; hidden: boolean; columns: number; items: T[] }
      | undefined;
    return std ?? null;
  });

  if (!section || section.hidden) return null;
  const visibleItems = section.items.filter((item) => !item.hidden);
  if (visibleItems.length === 0) return null;
  const cols = columns ?? section.columns ?? 1;

  return (
    <section className={className}>
      <h3 className="rv2-heading mb-1">{section.title || getSectionTitle(sectionKey as SectionType)}</h3>
      <div
        style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "var(--page-gap-y) var(--page-gap-x)" }}
      >
        {visibleItems.map((item, index) => (
          <div key={item.id}>{children(item, index)}</div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION ITEM RENDERERS — field names match schema.ts
   ═══════════════════════════════════════════════════════ */

export function ExperienceItemRenderer({ item }: { item: TExp }) {
  return (
    <div className="rv2-item">
      <div className="flex items-start justify-between">
        <div>
          <LinkedTitle title={item.company} url={item.website?.url} className="font-[var(--page-body-font-weight-bold)]" />
          {item.location && <span className="ml-1 opacity-70">, {item.location}</span>}
        </div>
        {item.period && <span className="shrink-0 text-right opacity-70">{item.period}</span>}
      </div>
      {item.position && (
        <div className="font-[var(--page-body-font-weight-bold)] text-[color:var(--page-primary-color)]">{item.position}</div>
      )}
      {item.roles && item.roles.length > 0 && (
        <div className="mt-1 space-y-1.5">
          {item.roles.map((role) => (
            <div key={role.id}>
              <div className="flex items-start justify-between">
                <span className="font-[var(--page-body-font-weight-bold)]">{role.position}</span>
                {role.period && <span className="shrink-0 opacity-70">{role.period}</span>}
              </div>
              {role.description && <TiptapContent content={role.description} />}
            </div>
          ))}
        </div>
      )}
      {item.description && <TiptapContent content={item.description} className="mt-0.5" />}
    </div>
  );
}

export function EducationItemRenderer({ item }: { item: TEdu }) {
  return (
    <div className="rv2-item">
      <div className="flex items-start justify-between">
        <div>
          <LinkedTitle title={item.school} url={item.website?.url} className="font-[var(--page-body-font-weight-bold)]" />
          {item.location && <span className="ml-1 opacity-70">, {item.location}</span>}
        </div>
        {item.period && <span className="shrink-0 text-right opacity-70">{item.period}</span>}
      </div>
      <div className="flex gap-2">
        {item.degree && <span>{item.degree}</span>}
        {item.area && <span>{item.degree ? `in ${item.area}` : item.area}</span>}
        {item.grade && <span className="opacity-70">— {item.grade}</span>}
      </div>
      {item.description && <TiptapContent content={item.description} className="mt-0.5" />}
    </div>
  );
}

export function SkillItemRenderer({ item }: { item: TSkill }) {
  return (
    <div className="rv2-item">
      <div className="flex items-center gap-2">
        <PageIcon iconName={item.icon} />
        <span className="font-[var(--page-body-font-weight-bold)]">{item.name}</span>
        {item.level > 0 && <PageLevel level={item.level} />}
      </div>
      {item.proficiency && <div className="mt-0.5 opacity-70">{item.proficiency}</div>}
      {item.keywords.length > 0 && <div className="mt-0.5 opacity-80">{item.keywords.join(", ")}</div>}
    </div>
  );
}

export function LanguageItemRenderer({ item }: { item: TLang }) {
  return (
    <div className="rv2-item flex items-center gap-2">
      <span className="font-[var(--page-body-font-weight-bold)]">{item.language}</span>
      {item.fluency && <span className="opacity-70">{item.fluency}</span>}
      {item.level > 0 && <PageLevel level={item.level} />}
    </div>
  );
}

export function ProfileItemRenderer({ item }: { item: TProfile }) {
  return (
    <div className="rv2-item flex items-center gap-2">
      <PageIcon iconName={item.icon} />
      <LinkedTitle title={item.username || item.network} url={item.website?.url} />
      {item.username && item.network && <span className="opacity-60">({item.network})</span>}
    </div>
  );
}

export function ProjectItemRenderer({ item }: { item: TProject }) {
  return (
    <div className="rv2-item">
      <div className="flex items-start justify-between">
        <LinkedTitle title={item.name} url={item.website?.url} className="font-[var(--page-body-font-weight-bold)]" />
        {item.period && <span className="shrink-0 opacity-70">{item.period}</span>}
      </div>
      {item.description && <TiptapContent content={item.description} className="mt-0.5" />}
    </div>
  );
}

export function AwardItemRenderer({ item }: { item: TAward }) {
  return (
    <div className="rv2-item">
      <div className="flex items-start justify-between">
        <LinkedTitle title={item.title} url={item.website?.url} className="font-[var(--page-body-font-weight-bold)]" />
        {item.date && <span className="shrink-0 opacity-70">{item.date}</span>}
      </div>
      {item.awarder && <div className="opacity-70">{item.awarder}</div>}
      {item.description && <TiptapContent content={item.description} className="mt-0.5" />}
    </div>
  );
}

export function CertificationItemRenderer({ item }: { item: TCert }) {
  return (
    <div className="rv2-item">
      <div className="flex items-start justify-between">
        <LinkedTitle title={item.title} url={item.website?.url} className="font-[var(--page-body-font-weight-bold)]" />
        {item.date && <span className="shrink-0 opacity-70">{item.date}</span>}
      </div>
      {item.issuer && <div className="opacity-70">{item.issuer}</div>}
      {item.description && <TiptapContent content={item.description} className="mt-0.5" />}
    </div>
  );
}

export function PublicationItemRenderer({ item }: { item: TPub }) {
  return (
    <div className="rv2-item">
      <div className="flex items-start justify-between">
        <LinkedTitle title={item.title} url={item.website?.url} className="font-[var(--page-body-font-weight-bold)]" />
        {item.date && <span className="shrink-0 opacity-70">{item.date}</span>}
      </div>
      {item.publisher && <div className="opacity-70">{item.publisher}</div>}
      {item.description && <TiptapContent content={item.description} className="mt-0.5" />}
    </div>
  );
}

export function VolunteerItemRenderer({ item }: { item: TVol }) {
  return (
    <div className="rv2-item">
      <div className="flex items-start justify-between">
        <div>
          <LinkedTitle title={item.organization} url={item.website?.url} className="font-[var(--page-body-font-weight-bold)]" />
          {item.location && <span className="ml-1 opacity-70">, {item.location}</span>}
        </div>
        {item.period && <span className="shrink-0 text-right opacity-70">{item.period}</span>}
      </div>
      {item.description && <TiptapContent content={item.description} className="mt-0.5" />}
    </div>
  );
}

export function ReferenceItemRenderer({ item }: { item: TRef }) {
  return (
    <div className="rv2-item">
      <div className="font-[var(--page-body-font-weight-bold)]">{item.name}</div>
      {item.position && <div className="opacity-70">{item.position}</div>}
      {item.phone && <div className="opacity-70"><PageIcon iconName="phone" size={12} /> {item.phone}</div>}
      {item.description && <TiptapContent content={item.description} className="mt-0.5" />}
    </div>
  );
}

export function InterestItemRenderer({ item }: { item: TInt }) {
  return (
    <div className="rv2-item">
      <div className="flex items-center gap-1">
        <PageIcon iconName={item.icon} />
        <span className="font-[var(--page-body-font-weight-bold)]">{item.name}</span>
      </div>
      {item.keywords.length > 0 && <div className="mt-0.5 opacity-80">{item.keywords.join(", ")}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Section Component Dispatcher
   ═══════════════════════════════════════════════════════ */
export function getSectionComponent(sectionKey: string): React.FC | null {
  switch (sectionKey) {
    case "summary": return PageSummary;
    case "experience": return () => <PageSection<TExp> sectionKey="experience">{(item) => <ExperienceItemRenderer item={item} />}</PageSection>;
    case "education": return () => <PageSection<TEdu> sectionKey="education">{(item) => <EducationItemRenderer item={item} />}</PageSection>;
    case "skills": return () => <PageSection<TSkill> sectionKey="skills">{(item) => <SkillItemRenderer item={item} />}</PageSection>;
    case "languages": return () => <PageSection<TLang> sectionKey="languages">{(item) => <LanguageItemRenderer item={item} />}</PageSection>;
    case "profiles": return () => <PageSection<TProfile> sectionKey="profiles">{(item) => <ProfileItemRenderer item={item} />}</PageSection>;
    case "projects": return () => <PageSection<TProject> sectionKey="projects">{(item) => <ProjectItemRenderer item={item} />}</PageSection>;
    case "awards": return () => <PageSection<TAward> sectionKey="awards">{(item) => <AwardItemRenderer item={item} />}</PageSection>;
    case "certifications": return () => <PageSection<TCert> sectionKey="certifications">{(item) => <CertificationItemRenderer item={item} />}</PageSection>;
    case "publications": return () => <PageSection<TPub> sectionKey="publications">{(item) => <PublicationItemRenderer item={item} />}</PageSection>;
    case "volunteer": return () => <PageSection<TVol> sectionKey="volunteer">{(item) => <VolunteerItemRenderer item={item} />}</PageSection>;
    case "references": return () => <PageSection<TRef> sectionKey="references">{(item) => <ReferenceItemRenderer item={item} />}</PageSection>;
    case "interests": return () => <PageSection<TInt> sectionKey="interests">{(item) => <InterestItemRenderer item={item} />}</PageSection>;
    default: return null;
  }
}
