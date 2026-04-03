// =============================================================================
// DMSuite - Resume Template Renderer
// Renders a ResumeData object as a paginated, styled A4/Letter preview.
// Supports all 11 templates via style variant hints from TemplateConfig.
// =============================================================================

"use client";

import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import type { ResumeData, SectionKey, PageLayout, TemplateId, LevelType } from "./schema";
import { SECTION_META, createDefaultResumeData } from "./schema";
import { getTemplateConfig, type TemplateConfig } from "./templates";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Render a number as a CSS pt value string (print-correct sizing) */
function pt(n: number): string {
  return `${n}pt`;
}

/**
 * Parse an rgba/rgb color string and return it with a new alpha (0-1).
 * Handles both rgba(r,g,b,a) and rgb(r,g,b) formats plus hex.
 */
function withAlpha(rgba: string, alpha: number): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
  if (rgba.startsWith("#") && rgba.length >= 7) {
    const r = parseInt(rgba.slice(1, 3), 16);
    const g = parseInt(rgba.slice(3, 5), 16);
    const b = parseInt(rgba.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return rgba;
}

/** Muted text color derived from the design text color */
function muted(textColor: string, level: "soft" | "softer" | "softest" = "soft"): string {
  const alphaMap = { soft: 0.7, softer: 0.55, softest: 0.4 };
  return withAlpha(textColor, alphaMap[level]);
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ title, color, style: divStyle, headingSize }: {
  title: string; color: string; style: TemplateConfig["style"]; headingSize: number;
}) {
  const borderMap = {
    line: `2px solid ${color}`,
    thick: `4px solid ${color}`,
    double: `3px double ${color}`,
    dotted: `2px dotted ${color}`,
    none: "none",
  };
  return (
    <div style={{ borderBottom: borderMap[divStyle.sectionDivider], paddingBottom: 6, marginBottom: 10 }}>
      <h3 style={{
        color,
        margin: 0,
        fontSize: pt(headingSize),
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}>
        {title}
      </h3>
    </div>
  );
}

function LevelIndicator({ level, maxLevel = 5, type, color }: {
  level: number; maxLevel?: number; type: LevelType; color: string;
}) {
  if (type === "hidden") return null;
  const items = Array.from({ length: maxLevel }, (_, i) => i);

  if (type === "progress-bar") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: withAlpha(color, 0.15) }}>
          <div style={{ width: `${(level / maxLevel) * 100}%`, height: "100%", borderRadius: 3, backgroundColor: color }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {items.map((i) => {
        const filled = i < level;
        if (type === "circle") {
          return <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", display: "inline-block", backgroundColor: filled ? color : withAlpha(color, 0.15), border: `1px solid ${withAlpha(color, 0.3)}` }} />;
        }
        if (type === "square") {
          return <span key={i} style={{ width: 10, height: 10, borderRadius: 2, display: "inline-block", backgroundColor: filled ? color : withAlpha(color, 0.15), border: `1px solid ${withAlpha(color, 0.3)}` }} />;
        }
        // rectangle
        return <span key={i} style={{ width: 16, height: 8, borderRadius: 2, display: "inline-block", backgroundColor: filled ? color : withAlpha(color, 0.15), border: `1px solid ${withAlpha(color, 0.3)}` }} />;
      })}
    </div>
  );
}

function RichText({ html, bodySize }: { html: string; bodySize?: number }) {
  if (!html.trim()) return null;
  const clean = typeof window !== "undefined" ? DOMPurify.sanitize(html) : html;
  return <div className="resume-rich-text" style={bodySize ? { fontSize: pt(bodySize) } : undefined} dangerouslySetInnerHTML={{ __html: clean }} />;
}

/** Inline SVG contact icons for the resume header — no external dependency */
function ContactIcon({ type, size = 12, color }: { type: string; size?: number; color: string }) {
  const s: React.CSSProperties = { width: size, height: size, flexShrink: 0, display: "inline-block", verticalAlign: "middle" };
  switch (type) {
    case "email":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 6L2 7" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.8.3 1.58.56 2.33a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.75.26 1.53.44 2.33.56A2 2 0 0122 16.92z" />
        </svg>
      );
    case "location":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "website":
    case "globe":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
    case "link":
    default:
      if (!type) return null;
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      );
  }
}

/** Builds contact entries with icon type from basics data */
function buildContactEntries(basics: ResumeData["basics"]): Array<{ type: string; text: string; url?: string }> {
  const entries: Array<{ type: string; text: string; url?: string }> = [];
  if (basics.email) entries.push({ type: "email", text: basics.email, url: `mailto:${basics.email}` });
  if (basics.phone) entries.push({ type: "phone", text: basics.phone, url: `tel:${basics.phone}` });
  if (basics.location) entries.push({ type: "location", text: basics.location });
  if (basics.website?.url) entries.push({ type: "website", text: basics.website.label || basics.website.url, url: basics.website.url });
  basics.customFields?.forEach((f) => {
    if (f.text) entries.push({ type: f.icon || "link", text: f.text, url: f.link || undefined });
  });
  return entries;
}

/** Renders the contact items row with optional icons */
function ContactItems({ entries, size, color, iconColor, hideIcons, centered }: {
  entries: Array<{ type: string; text: string; url?: string }>;
  size: string; color: string; iconColor: string; hideIcons: boolean; centered?: boolean;
}) {
  if (entries.length === 0) return null;
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "center",
      fontSize: size, color, marginTop: 6,
      ...(centered ? { justifyContent: "center" } : {}),
    }}>
      {entries.map((entry, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {!hideIcons && <ContactIcon type={entry.type} size={11} color={iconColor} />}
          {entry.url ? (
            <a href={entry.url} style={{ color: "inherit", textDecoration: "none" }}>{entry.text}</a>
          ) : (
            <span>{entry.text}</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderExperienceSection(data: ResumeData, color: string, textColor: string, cfg: TemplateConfig, typo: ResumeData["metadata"]["typography"]) {
  const section = data.sections?.experience;
  if (!section || section.hidden || section.items.length === 0) return null;
  return (
    <div className="resume-section">
      <SectionTitle title={section.title || "Experience"} color={color} style={cfg.style} headingSize={typo.heading.fontSize} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.6em" }}>
        {section.items.filter((i) => !i.hidden).map((item, idx) => (
          <div key={item.id ?? idx} style={{ marginBottom: "0.5em" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4 }}>
              <strong style={{ fontSize: pt(typo.heading.fontSize * 0.9) }}>{item.position}</strong>
              {cfg.style.dateStyle === "right" && <span style={{ fontSize: pt(typo.body.fontSize * 0.88), color: muted(textColor, "softer") }}>{item.period}</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: muted(textColor, "soft"), fontSize: pt(typo.body.fontSize * 0.92) }}>
              <span>{item.company}{item.location ? `, ${item.location}` : ""}</span>
              {cfg.style.dateStyle === "inline" && <span style={{ marginLeft: 8 }}>{item.period}</span>}
            </div>
            {cfg.style.dateStyle === "below" && <div style={{ fontSize: pt(typo.body.fontSize * 0.88), color: muted(textColor, "softer") }}>{item.period}</div>}
            {item.description && <RichText html={item.description} bodySize={typo.body.fontSize} />}
            {item.roles?.length > 0 && (
              <div style={{ paddingLeft: "0.8em", marginTop: "0.4em", borderLeft: `2px solid ${withAlpha(color, 0.25)}` }}>
                {item.roles.map((r, ri) => (
                  <div key={r.id ?? ri} style={{ marginBottom: "0.3em" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: pt(typo.body.fontSize * 0.92) }}>{r.position}</strong>
                      <span style={{ fontSize: pt(typo.body.fontSize * 0.85), color: muted(textColor, "softer") }}>{r.period}</span>
                    </div>
                    {r.description && <RichText html={r.description} bodySize={typo.body.fontSize * 0.95} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderEducationSection(data: ResumeData, color: string, textColor: string, cfg: TemplateConfig, typo: ResumeData["metadata"]["typography"]) {
  const section = data.sections?.education;
  if (!section || section.hidden || section.items.length === 0) return null;
  return (
    <div className="resume-section">
      <SectionTitle title={section.title || "Education"} color={color} style={cfg.style} headingSize={typo.heading.fontSize} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.5em" }}>
        {section.items.filter((i) => !i.hidden).map((item, idx) => (
          <div key={item.id ?? idx} style={{ marginBottom: "0.4em" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4 }}>
              <strong style={{ fontSize: pt(typo.heading.fontSize * 0.9) }}>{item.degree}{item.area ? ` in ${item.area}` : ""}</strong>
              <span style={{ fontSize: pt(typo.body.fontSize * 0.88), color: muted(textColor, "softer") }}>{item.period}</span>
            </div>
            <div style={{ color: muted(textColor, "soft"), fontSize: pt(typo.body.fontSize * 0.92) }}>
              {item.school}{item.location ? `, ${item.location}` : ""}
              {item.grade && <span> — GPA: {item.grade}</span>}
            </div>
            {item.description && <RichText html={item.description} bodySize={typo.body.fontSize} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderSkillsSection(data: ResumeData, color: string, textColor: string, cfg: TemplateConfig, typo: ResumeData["metadata"]["typography"], levelType: LevelType) {
  const section = data.sections?.skills;
  if (!section || section.hidden || section.items.length === 0) return null;

  const skillStyle = cfg.style.skillStyle;

  return (
    <div className="resume-section">
      <SectionTitle title={section.title || "Skills"} color={color} style={cfg.style} headingSize={typo.heading.fontSize} />
      {skillStyle === "chips" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {section.items.filter((i) => !i.hidden).map((item, idx) => (
            <span key={item.id ?? idx} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 10px", borderRadius: 12,
              fontSize: pt(typo.body.fontSize * 0.88),
              backgroundColor: withAlpha(color, 0.1),
              border: `1px solid ${withAlpha(color, 0.25)}`,
              color,
            }}>
              {item.name}
              {item.level > 0 && <LevelIndicator level={item.level} type={levelType} color={color} />}
            </span>
          ))}
        </div>
      ) : skillStyle === "grouped" ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.5em" }}>
          {section.items.filter((i) => !i.hidden).map((item, idx) => (
            <div key={item.id ?? idx}>
              <strong style={{ fontSize: pt(typo.body.fontSize * 0.92) }}>{item.name}</strong>
              {item.keywords.length > 0 && <div style={{ fontSize: pt(typo.body.fontSize * 0.85), color: muted(textColor, "softer") }}>{item.keywords.join(", ")}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.4em 1em" }}>
          {section.items.filter((i) => !i.hidden).map((item, idx) => (
            <div key={item.id ?? idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: pt(typo.body.fontSize * 0.92) }}>{item.name}</span>
              {item.level > 0 && <LevelIndicator level={item.level} type={levelType} color={color} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderLanguagesSection(data: ResumeData, color: string, textColor: string, cfg: TemplateConfig, typo: ResumeData["metadata"]["typography"], levelType: LevelType) {
  const section = data.sections?.languages;
  if (!section || section.hidden || section.items.length === 0) return null;
  return (
    <div className="resume-section">
      <SectionTitle title={section.title || "Languages"} color={color} style={cfg.style} headingSize={typo.heading.fontSize} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.4em 1em" }}>
        {section.items.filter((i) => !i.hidden).map((item, idx) => (
          <div key={item.id ?? idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: pt(typo.body.fontSize * 0.92) }}>{item.language}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {item.fluency && <span style={{ fontSize: pt(typo.body.fontSize * 0.85), color: muted(textColor, "softer") }}>{item.fluency}</span>}
              {item.level > 0 && <LevelIndicator level={item.level} type={levelType} color={color} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderProfilesSection(data: ResumeData, color: string, textColor: string, cfg: TemplateConfig, typo: ResumeData["metadata"]["typography"]) {
  const section = data.sections?.profiles;
  if (!section || section.hidden || section.items.length === 0) return null;
  return (
    <div className="resume-section">
      <SectionTitle title={section.title || "Profiles"} color={color} style={cfg.style} headingSize={typo.heading.fontSize} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.4em" }}>
        {section.items.filter((i) => !i.hidden).map((item, idx) => (
          <div key={item.id ?? idx} style={{ fontSize: pt(typo.body.fontSize * 0.92) }}>
            <strong>{item.network}</strong>{item.username ? `: ${item.username}` : ""}
            {item.website?.url && (
              <span style={{ marginLeft: 4, color, fontSize: pt(typo.body.fontSize * 0.85) }}>
                ({item.website.url})
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Generic list-section renderer (projects, awards, certs, publications, volunteer, references, interests)
function renderGenericSection(
  sectionKey: SectionKey,
  data: ResumeData,
  color: string,
  textColor: string,
  cfg: TemplateConfig,
  typo: ResumeData["metadata"]["typography"],
) {
  const section = data.sections?.[sectionKey];
  if (!section || section.hidden || section.items.length === 0) return null;

  const sectionMeta = SECTION_META[sectionKey];

  return (
    <div className="resume-section">
      <SectionTitle title={section.title || sectionMeta.label} color={color} style={cfg.style} headingSize={typo.heading.fontSize} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.5em" }}>
        {section.items.filter((i) => !i.hidden).map((item: Record<string, unknown>, idx: number) => {
          const title = (item.title ?? item.name ?? item.organization ?? item.language ?? "") as string;
          const subtitle = (item.issuer ?? item.publisher ?? item.awarder ?? item.position ?? item.network ?? "") as string;
          const period = (item.period ?? item.date ?? "") as string;
          const description = (item.description ?? "") as string;
          const keywords = (item.keywords ?? []) as string[];

          return (
            <div key={(item.id as string) ?? idx} style={{ marginBottom: "0.4em" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4 }}>
                <strong style={{ fontSize: pt(typo.heading.fontSize * 0.88) }}>{title}</strong>
                {period && <span style={{ fontSize: pt(typo.body.fontSize * 0.85), color: muted(textColor, "softer") }}>{period}</span>}
              </div>
              {subtitle && <div style={{ fontSize: pt(typo.body.fontSize * 0.92), color: muted(textColor, "soft") }}>{subtitle}</div>}
              {description && <RichText html={description} bodySize={typo.body.fontSize} />}
              {keywords.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {keywords.map((kw, ki) => (
                    <span key={ki} style={{
                      fontSize: pt(typo.body.fontSize * 0.8),
                      padding: "1px 8px",
                      borderRadius: 8,
                      backgroundColor: withAlpha(color, 0.08),
                      color: muted(textColor, "soft"),
                    }}>
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section renderer dispatch
// ---------------------------------------------------------------------------

function renderSection(
  sectionId: string,
  data: ResumeData,
  color: string,
  textColor: string,
  cfg: TemplateConfig,
  typo: ResumeData["metadata"]["typography"],
  levelType: LevelType,
): React.ReactNode {
  switch (sectionId) {
    case "summary":
      if (!data.summary || data.summary.hidden || !data.summary.content) return null;
      return (
        <div className="resume-section">
          <SectionTitle title={data.summary.title || "Summary"} color={color} style={cfg.style} headingSize={typo.heading.fontSize} />
          <RichText html={data.summary.content} bodySize={typo.body.fontSize} />
        </div>
      );
    case "experience": return renderExperienceSection(data, color, textColor, cfg, typo);
    case "education": return renderEducationSection(data, color, textColor, cfg, typo);
    case "skills": return renderSkillsSection(data, color, textColor, cfg, typo, levelType);
    case "languages": return renderLanguagesSection(data, color, textColor, cfg, typo, levelType);
    case "profiles": return renderProfilesSection(data, color, textColor, cfg, typo);
    case "projects":
    case "awards":
    case "certifications":
    case "publications":
    case "volunteer":
    case "references":
    case "interests":
      return renderGenericSection(sectionId as SectionKey, data, color, textColor, cfg, typo);
    default: {
      // Custom section
      const cs = data.customSections?.find((c) => c.id === sectionId);
      if (!cs || cs.hidden || cs.items.length === 0) return null;
      return (
        <div className="resume-section">
          <SectionTitle title={cs.title} color={color} style={cfg.style} headingSize={typo.heading.fontSize} />
          <div>
            {cs.items.filter((i) => !(i as { hidden?: boolean }).hidden).map((item, idx) => {
              const content = (item as { content?: string }).content;
              return content ? <RichText key={idx} html={content} bodySize={typo.body.fontSize} /> : null;
            })}
          </div>
        </div>
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Header renderer
// ---------------------------------------------------------------------------

function ResumeHeader({
  data, color, textColor, cfg, typo, hideIcons,
}: { data: ResumeData; color: string; textColor: string; cfg: TemplateConfig; typo: ResumeData["metadata"]["typography"]; hideIcons: boolean }) {
  const basics = data.basics ?? { name: "", headline: "", email: "", phone: "", location: "", website: { url: "", label: "" }, customFields: [] };
  const picture = data.picture ?? { hidden: true, url: "", size: 80, aspectRatio: 1, borderRadius: 0, borderColor: "rgba(0,0,0,0.5)", borderWidth: 0 };
  const headerStyle = cfg.style.headerStyle;
  const hasPicture = !picture.hidden && picture.url;

  const nameSize = pt(typo.heading.fontSize * 1.7);
  const headlineSize = pt(typo.body.fontSize * 1.15);
  const contactSize = pt(typo.body.fontSize * 0.88);
  const iconColor = color;

  const pictureEl = hasPicture ? (
    <div style={{
      width: picture.size,
      height: picture.size * picture.aspectRatio,
      borderRadius: `${picture.borderRadius}%`,
      border: picture.borderWidth > 0 ? `${picture.borderWidth}px solid ${picture.borderColor}` : "none",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={picture.url} alt={basics.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  ) : null;

  const contactEntries = buildContactEntries(basics);

  if (headerStyle === "banner" || headerStyle === "sidebar-header") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "16px 0", marginBottom: 18,
        borderBottom: `3px solid ${color}`,
      }}>
        {pictureEl}
        <div>
          <h1 style={{ margin: 0, fontSize: nameSize, fontFamily: typo.heading.fontFamily, fontWeight: Number(typo.heading.fontWeight), color }}>{basics.name}</h1>
          {basics.headline && <div style={{ fontSize: headlineSize, color: muted(textColor, "soft"), marginTop: 3 }}>{basics.headline}</div>}
          <ContactItems entries={contactEntries} size={contactSize} color={muted(textColor, "softer")} iconColor={iconColor} hideIcons={hideIcons} />
        </div>
      </div>
    );
  }

  if (headerStyle === "centered") {
    return (
      <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 14, borderBottom: `3px solid ${color}` }}>
        {pictureEl && <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>{pictureEl}</div>}
        <h1 style={{ margin: 0, fontSize: nameSize, fontFamily: typo.heading.fontFamily, fontWeight: Number(typo.heading.fontWeight), color }}>{basics.name}</h1>
        {basics.headline && <div style={{ fontSize: headlineSize, color: muted(textColor, "soft"), marginTop: 3 }}>{basics.headline}</div>}
        <ContactItems entries={contactEntries} size={contactSize} color={muted(textColor, "softer")} iconColor={iconColor} hideIcons={hideIcons} centered />
      </div>
    );
  }

  if (headerStyle === "split") {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 14, borderBottom: `3px solid ${color}` }}>
        <div>
          <h1 style={{ margin: 0, fontSize: nameSize, fontFamily: typo.heading.fontFamily, fontWeight: Number(typo.heading.fontWeight), color }}>{basics.name}</h1>
          {basics.headline && <div style={{ fontSize: headlineSize, color: muted(textColor, "soft"), marginTop: 3 }}>{basics.headline}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          {pictureEl}
          <ContactItems entries={contactEntries} size={contactSize} color={muted(textColor, "softer")} iconColor={iconColor} hideIcons={hideIcons} />
        </div>
      </div>
    );
  }

  if (headerStyle === "minimal") {
    return (
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {pictureEl}
          <div>
            <h1 style={{ margin: 0, fontSize: pt(typo.heading.fontSize * 1.5), fontFamily: typo.heading.fontFamily, fontWeight: Number(typo.heading.fontWeight) }}>{basics.name}</h1>
            {basics.headline && <div style={{ fontSize: pt(typo.body.fontSize * 1.05), color: muted(textColor, "soft") }}>{basics.headline}</div>}
          </div>
        </div>
        <ContactItems entries={contactEntries} size={contactSize} color={muted(textColor, "softer")} iconColor={iconColor} hideIcons={hideIcons} />
      </div>
    );
  }

  // classic (default)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
      {pictureEl}
      <div style={{ flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: pt(typo.heading.fontSize * 1.6), fontFamily: typo.heading.fontFamily, fontWeight: Number(typo.heading.fontWeight), color }}>{basics.name}</h1>
        {basics.headline && <div style={{ fontSize: pt(typo.body.fontSize * 1.1), color: muted(textColor, "soft"), marginTop: 3 }}>{basics.headline}</div>}
        <ContactItems entries={contactEntries} size={contactSize} color={muted(textColor, "softer")} iconColor={iconColor} hideIcons={hideIcons} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function ResumePage({
  pageIndex, pageLayout, data, color, textColor, cfg, typo, designColors, pageCfg, sidebarWidth, levelType,
}: {
  pageIndex: number;
  pageLayout: PageLayout;
  data: ResumeData;
  color: string;
  textColor: string;
  cfg: TemplateConfig;
  typo: ResumeData["metadata"]["typography"];
  designColors: ResumeData["metadata"]["design"]["colors"];
  pageCfg: ResumeData["metadata"]["page"];
  sidebarWidth: number;
  levelType: LevelType;
}) {
  const sidebarPct = sidebarWidth;
  const hasSidebar = sidebarPct > 0 && pageLayout.sidebar.length > 0;

  const mainSections = pageLayout.main.map((sid) => (
    <React.Fragment key={sid}>{renderSection(sid, data, color, textColor, cfg, typo, levelType)}</React.Fragment>
  ));

  const sidebarSections = hasSidebar ? pageLayout.sidebar.map((sid) => (
    <React.Fragment key={sid}>{renderSection(sid, data, color, textColor, cfg, typo, levelType)}</React.Fragment>
  )) : null;

  const sidebarBg = cfg.style.hasSidebarBg ? withAlpha(color, 0.06) : "transparent";
  const hasSidebarBg = sidebarBg !== "transparent";
  const gapX = `${pageCfg.gapX}pt`;
  const marginX = `${pageCfg.marginX}pt`;
  const marginY = `${pageCfg.marginY}pt`;
  const gapY = `${pageCfg.gapY}pt`;

  return (
    <div
      className="resume-page"
      style={{
        width: `${pageCfg.format === "letter" ? 216 : 210}mm`,
        minHeight: `${pageCfg.format === "letter" ? 279 : 297}mm`,
        backgroundColor: designColors.background,
        color: designColors.text,
        fontFamily: `'${typo.body.fontFamily}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        fontSize: `calc(${typo.body.fontSize} * 1pt)`,
        lineHeight: typo.body.lineHeight,
        padding: `${marginY} ${marginX}`,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}
    >
      {/* Header only on first page */}
      {pageIndex === 0 && (
        <ResumeHeader data={data} color={color} textColor={designColors.text} cfg={cfg} typo={typo} hideIcons={!!pageCfg.hideIcons} />
      )}

      {hasSidebar ? (
        <div style={{ display: "flex", gap: gapX }}>
          {cfg.sidebarLeft && (
            <div style={{
              width: `${sidebarPct}%`,
              backgroundColor: sidebarBg,
              padding: hasSidebarBg ? 16 : 0,
              borderRadius: hasSidebarBg ? 6 : 0,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: gapY }}>{sidebarSections}</div>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: gapY }}>{mainSections}</div>
          </div>
          {!cfg.sidebarLeft && (
            <div style={{
              width: `${sidebarPct}%`,
              backgroundColor: sidebarBg,
              padding: hasSidebarBg ? 16 : 0,
              borderRadius: hasSidebarBg ? 6 : 0,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: gapY }}>{sidebarSections}</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: gapY }}>{mainSections}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TemplateRenderer component
// ---------------------------------------------------------------------------

interface TemplateRendererProps {
  data: ResumeData;
  zoom?: number;
  className?: string;
  printMode?: boolean;
}

export default function TemplateRenderer({ data, zoom = 1, className, printMode }: TemplateRendererProps) {
  // Provide fallback metadata so the preview always renders even with partial data
  const _defaults = useMemo(() => createDefaultResumeData().metadata, []);
  const meta = data?.metadata ?? _defaults;
  const typoHeading = meta.typography?.heading ?? _defaults.typography.heading;
  const typoBody = meta.typography?.body ?? _defaults.typography.body;
  const designColors = meta.design?.colors ?? _defaults.design.colors;
  const designLevel = meta.design?.level ?? _defaults.design.level;
  const pageCfg = meta.page ?? _defaults.page;
  const layoutCfg = meta.layout ?? _defaults.layout;
  const cssCfg = meta.css ?? _defaults.css;

  const templateId = (meta.template || "onyx") as TemplateId;
  const cfg = getTemplateConfig(templateId);
  const color = designColors.primary;
  const textColor = designColors.text;
  const typo = { heading: typoHeading, body: typoBody };
  const levelType = designLevel.type;

  const pages = useMemo(() => {
    if (!layoutCfg.pages || layoutCfg.pages.length === 0) {
      return [{ fullWidth: false, main: ["summary", "experience", "education", "projects"], sidebar: ["skills", "languages"] }];
    }
    return layoutCfg.pages;
  }, [layoutCfg.pages]);

  // Custom CSS injection (scoped & sanitized)
  const customCSSStyle = cssCfg.enabled && cssCfg.value ? (
    <style dangerouslySetInnerHTML={{ __html: cssCfg.value.replace(/<\/?[^>]+(>|$)/g, "") }} />
  ) : null;

  // Global page styles — mirrors Reactive Resume's preview.module.css approach
  const pageStyles = `
    .resume-page h1, .resume-page h2, .resume-page h3, .resume-page h4, .resume-page h5, .resume-page h6 {
      font-family: '${typo.heading.fontFamily}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-weight: ${typo.heading.fontWeight};
      line-height: ${typo.heading.lineHeight};
    }
    .resume-page h1 { font-size: calc(${typo.heading.fontSize} * 1.5pt); }
    .resume-page h2 { font-size: calc(${typo.heading.fontSize} * 1.25pt); }
    .resume-page h3 { font-size: calc(${typo.heading.fontSize} * 1.125pt); }
    .resume-page h4 { font-size: calc(${typo.heading.fontSize} * 1pt); }
    .resume-page small { font-size: calc(${typo.body.fontSize} * 0.9pt); }
    .resume-page .resume-section { margin-bottom: ${pageCfg.gapY}pt; }
    .resume-page .resume-rich-text { line-height: ${typo.body.lineHeight}; }
    .resume-page .resume-rich-text p { margin: 0.25em 0; }
    .resume-page .resume-rich-text ul { margin: 0.25em 0; padding-left: 1.4em; }
    .resume-page .resume-rich-text ol { margin: 0.25em 0; padding-left: 1.4em; }
    .resume-page .resume-rich-text li { margin: 0.15em 0; }
    .resume-page .resume-rich-text a { color: ${color}; text-decoration: underline; text-underline-offset: 0.15rem; }
    .resume-page strong { font-weight: 600; }
    .resume-page hr { margin: 1rem 0; border-color: ${textColor}; }
  `;

  return (
    <div className={className} style={printMode ? undefined : { transform: `scale(${zoom})`, transformOrigin: "top center" }}>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      {customCSSStyle}
      {pages.map((page, i) => (
        <ResumePage
          key={i}
          pageIndex={i}
          pageLayout={page}
          data={data}
          color={color}
          textColor={textColor}
          cfg={cfg}
          typo={typo}
          designColors={designColors}
          pageCfg={pageCfg}
          sidebarWidth={layoutCfg.sidebarWidth}
          levelType={levelType}
        />
      ))}
    </div>
  );
}
