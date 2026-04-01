// =============================================================================
// DMSuite — Resume Template Renderer
// Renders a ResumeData object as a paginated, styled A4/Letter preview.
// Supports all 11 templates via style variant hints from TemplateConfig.
// =============================================================================

"use client";

import React, { useMemo } from "react";
import type { ResumeData, SectionKey, PageLayout, TemplateId, LevelType } from "./schema";
import { SECTION_META, PAGE_DIMENSIONS, mmToPx } from "./schema";
import { getTemplateConfig, type TemplateConfig } from "./templates";

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ title, color, style: divStyle }: {
  title: string; color: string; style: TemplateConfig["style"];
}) {
  const borderMap = {
    line: `2px solid ${color}`,
    thick: `4px solid ${color}`,
    double: `3px double ${color}`,
    dotted: `2px dotted ${color}`,
    none: "none",
  };
  return (
    <div className="mb-1" style={{ borderBottom: borderMap[divStyle.sectionDivider], paddingBottom: 4 }}>
      <h3 style={{ color, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
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
        <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: `${color}20` }}>
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
          return <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", display: "inline-block", backgroundColor: filled ? color : `${color}20`, border: `1px solid ${color}40` }} />;
        }
        if (type === "square") {
          return <span key={i} style={{ width: 10, height: 10, borderRadius: 2, display: "inline-block", backgroundColor: filled ? color : `${color}20`, border: `1px solid ${color}40` }} />;
        }
        // rectangle
        return <span key={i} style={{ width: 16, height: 8, borderRadius: 2, display: "inline-block", backgroundColor: filled ? color : `${color}20`, border: `1px solid ${color}40` }} />;
      })}
    </div>
  );
}

function RichText({ html }: { html: string }) {
  if (!html.trim()) return null;
  return <div className="resume-rich-text" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderExperienceSection(data: ResumeData, color: string, cfg: TemplateConfig, typo: ResumeData["metadata"]["typography"]) {
  const section = data.sections.experience;
  if (section.hidden || section.items.length === 0) return null;
  return (
    <div className="resume-section">
      <SectionTitle title={section.title || "Experience"} color={color} style={cfg.style} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.5em" }}>
        {section.items.filter((i) => !i.hidden).map((item, idx) => (
          <div key={item.id ?? idx} style={{ marginBottom: "0.6em" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
              <strong style={{ fontSize: typo.heading.fontSize * 0.9 }}>{item.position}</strong>
              {cfg.style.dateStyle === "right" && <span style={{ fontSize: typo.body.fontSize * 0.85, color: "#666" }}>{item.period}</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#555", fontSize: typo.body.fontSize * 0.9 }}>
              <span>{item.company}{item.location ? `, ${item.location}` : ""}</span>
              {cfg.style.dateStyle === "inline" && <span style={{ marginLeft: 8 }}>{item.period}</span>}
            </div>
            {cfg.style.dateStyle === "below" && <div style={{ fontSize: typo.body.fontSize * 0.85, color: "#888" }}>{item.period}</div>}
            {item.description && <RichText html={item.description} />}
            {item.roles?.length > 0 && (
              <div style={{ paddingLeft: "0.8em", marginTop: "0.3em", borderLeft: `2px solid ${color}30` }}>
                {item.roles.map((r, ri) => (
                  <div key={r.id ?? ri} style={{ marginBottom: "0.3em" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: typo.body.fontSize * 0.9 }}>{r.position}</strong>
                      <span style={{ fontSize: typo.body.fontSize * 0.8, color: "#888" }}>{r.period}</span>
                    </div>
                    {r.description && <RichText html={r.description} />}
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

function renderEducationSection(data: ResumeData, color: string, cfg: TemplateConfig, typo: ResumeData["metadata"]["typography"]) {
  const section = data.sections.education;
  if (section.hidden || section.items.length === 0) return null;
  return (
    <div className="resume-section">
      <SectionTitle title={section.title || "Education"} color={color} style={cfg.style} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.5em" }}>
        {section.items.filter((i) => !i.hidden).map((item, idx) => (
          <div key={item.id ?? idx} style={{ marginBottom: "0.5em" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
              <strong style={{ fontSize: typo.heading.fontSize * 0.9 }}>{item.degree}{item.area ? ` in ${item.area}` : ""}</strong>
              <span style={{ fontSize: typo.body.fontSize * 0.85, color: "#666" }}>{item.period}</span>
            </div>
            <div style={{ color: "#555", fontSize: typo.body.fontSize * 0.9 }}>
              {item.school}{item.location ? `, ${item.location}` : ""}
              {item.grade && <span> — GPA: {item.grade}</span>}
            </div>
            {item.description && <RichText html={item.description} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderSkillsSection(data: ResumeData, color: string, cfg: TemplateConfig, typo: ResumeData["metadata"]["typography"], levelType: LevelType) {
  const section = data.sections.skills;
  if (section.hidden || section.items.length === 0) return null;

  const skillStyle = cfg.style.skillStyle;

  return (
    <div className="resume-section">
      <SectionTitle title={section.title || "Skills"} color={color} style={cfg.style} />
      {skillStyle === "chips" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {section.items.filter((i) => !i.hidden).map((item, idx) => (
            <span key={item.id ?? idx} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 12, fontSize: typo.body.fontSize * 0.85, backgroundColor: `${color}15`, border: `1px solid ${color}30`, color: color }}>
              {item.name}
              {item.level > 0 && <LevelIndicator level={item.level} type={levelType} color={color} />}
            </span>
          ))}
        </div>
      ) : skillStyle === "grouped" ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.4em" }}>
          {section.items.filter((i) => !i.hidden).map((item, idx) => (
            <div key={item.id ?? idx}>
              <strong style={{ fontSize: typo.body.fontSize * 0.9 }}>{item.name}</strong>
              {item.keywords.length > 0 && <div style={{ fontSize: typo.body.fontSize * 0.8, color: "#666" }}>{item.keywords.join(", ")}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.3em 1em" }}>
          {section.items.filter((i) => !i.hidden).map((item, idx) => (
            <div key={item.id ?? idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: typo.body.fontSize * 0.9 }}>{item.name}</span>
              {item.level > 0 && <LevelIndicator level={item.level} type={levelType} color={color} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderLanguagesSection(data: ResumeData, color: string, cfg: TemplateConfig, typo: ResumeData["metadata"]["typography"], levelType: LevelType) {
  const section = data.sections.languages;
  if (section.hidden || section.items.length === 0) return null;
  return (
    <div className="resume-section">
      <SectionTitle title={section.title || "Languages"} color={color} style={cfg.style} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.3em 1em" }}>
        {section.items.filter((i) => !i.hidden).map((item, idx) => (
          <div key={item.id ?? idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: typo.body.fontSize * 0.9 }}>{item.language}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {item.fluency && <span style={{ fontSize: typo.body.fontSize * 0.8, color: "#888" }}>{item.fluency}</span>}
              {item.level > 0 && <LevelIndicator level={item.level} type={levelType} color={color} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderProfilesSection(data: ResumeData, color: string, cfg: TemplateConfig, typo: ResumeData["metadata"]["typography"]) {
  const section = data.sections.profiles;
  if (section.hidden || section.items.length === 0) return null;
  return (
    <div className="resume-section">
      <SectionTitle title={section.title || "Profiles"} color={color} style={cfg.style} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.3em" }}>
        {section.items.filter((i) => !i.hidden).map((item, idx) => (
          <div key={item.id ?? idx} style={{ fontSize: typo.body.fontSize * 0.9 }}>
            <strong>{item.network}</strong>{item.username ? `: ${item.username}` : ""}
            {item.website?.url && (
              <span style={{ marginLeft: 4, color, fontSize: typo.body.fontSize * 0.8 }}>
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
  cfg: TemplateConfig,
  typo: ResumeData["metadata"]["typography"],
) {
  const section = data.sections[sectionKey];
  if (section.hidden || section.items.length === 0) return null;

  const meta = SECTION_META[sectionKey];

  return (
    <div className="resume-section">
      <SectionTitle title={section.title || meta.label} color={color} style={cfg.style} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: "0.4em" }}>
        {section.items.filter((i) => !i.hidden).map((item: Record<string, unknown>, idx: number) => {
          const title = (item.title ?? item.name ?? item.organization ?? item.language ?? "") as string;
          const subtitle = (item.issuer ?? item.publisher ?? item.awarder ?? item.position ?? item.network ?? "") as string;
          const period = (item.period ?? item.date ?? "") as string;
          const description = (item.description ?? "") as string;
          const keywords = (item.keywords ?? []) as string[];

          return (
            <div key={(item.id as string) ?? idx} style={{ marginBottom: "0.4em" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                <strong style={{ fontSize: typo.heading.fontSize * 0.85 }}>{title}</strong>
                {period && <span style={{ fontSize: typo.body.fontSize * 0.8, color: "#666" }}>{period}</span>}
              </div>
              {subtitle && <div style={{ fontSize: typo.body.fontSize * 0.9, color: "#555" }}>{subtitle}</div>}
              {description && <RichText html={description} />}
              {keywords.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 3 }}>
                  {keywords.map((kw, ki) => (
                    <span key={ki} style={{ fontSize: typo.body.fontSize * 0.75, padding: "1px 6px", borderRadius: 8, backgroundColor: `${color}10`, color: "#666" }}>{kw}</span>
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
  cfg: TemplateConfig,
  typo: ResumeData["metadata"]["typography"],
  levelType: LevelType,
): React.ReactNode {
  switch (sectionId) {
    case "summary":
      if (data.summary.hidden || !data.summary.content) return null;
      return (
        <div className="resume-section">
          <SectionTitle title={data.summary.title || "Summary"} color={color} style={cfg.style} />
          <RichText html={data.summary.content} />
        </div>
      );
    case "experience": return renderExperienceSection(data, color, cfg, typo);
    case "education": return renderEducationSection(data, color, cfg, typo);
    case "skills": return renderSkillsSection(data, color, cfg, typo, levelType);
    case "languages": return renderLanguagesSection(data, color, cfg, typo, levelType);
    case "profiles": return renderProfilesSection(data, color, cfg, typo);
    case "projects":
    case "awards":
    case "certifications":
    case "publications":
    case "volunteer":
    case "references":
    case "interests":
      return renderGenericSection(sectionId as SectionKey, data, color, cfg, typo);
    default: {
      // Custom section
      const cs = data.customSections.find((c) => c.id === sectionId);
      if (!cs || cs.hidden || cs.items.length === 0) return null;
      return (
        <div className="resume-section">
          <SectionTitle title={cs.title} color={color} style={cfg.style} />
          <div>
            {cs.items.filter((i) => !(i as { hidden?: boolean }).hidden).map((item, idx) => {
              const content = (item as { content?: string }).content;
              return content ? <RichText key={idx} html={content} /> : null;
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
  data, color, cfg, typo,
}: { data: ResumeData; color: string; cfg: TemplateConfig; typo: ResumeData["metadata"]["typography"] }) {
  const { basics, picture } = data;
  const headerStyle = cfg.style.headerStyle;
  const hasPicture = !picture.hidden && picture.url;

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

  const contactLine = [basics.email, basics.phone, basics.location, basics.website?.url].filter(Boolean).join(" • ");

  if (headerStyle === "banner" || headerStyle === "sidebar-header") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "14px 0", marginBottom: 10,
        borderBottom: `3px solid ${color}`,
      }}>
        {pictureEl}
        <div>
          <h1 style={{ margin: 0, fontSize: typo.heading.fontSize * 1.6, fontFamily: typo.heading.fontFamily, fontWeight: Number(typo.heading.fontWeight), color }}>{basics.name}</h1>
          {basics.headline && <div style={{ fontSize: typo.body.fontSize * 1.1, color: "#555", marginTop: 2 }}>{basics.headline}</div>}
          {contactLine && <div style={{ fontSize: typo.body.fontSize * 0.85, color: "#777", marginTop: 4 }}>{contactLine}</div>}
        </div>
      </div>
    );
  }

  if (headerStyle === "centered") {
    return (
      <div style={{ textAlign: "center", marginBottom: 12, paddingBottom: 10, borderBottom: `3px solid ${color}` }}>
        {pictureEl && <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{pictureEl}</div>}
        <h1 style={{ margin: 0, fontSize: typo.heading.fontSize * 1.6, fontFamily: typo.heading.fontFamily, fontWeight: Number(typo.heading.fontWeight), color }}>{basics.name}</h1>
        {basics.headline && <div style={{ fontSize: typo.body.fontSize * 1.1, color: "#555", marginTop: 2 }}>{basics.headline}</div>}
        {contactLine && <div style={{ fontSize: typo.body.fontSize * 0.85, color: "#777", marginTop: 4 }}>{contactLine}</div>}
      </div>
    );
  }

  if (headerStyle === "split") {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: `3px solid ${color}` }}>
        <div>
          <h1 style={{ margin: 0, fontSize: typo.heading.fontSize * 1.6, fontFamily: typo.heading.fontFamily, fontWeight: Number(typo.heading.fontWeight), color }}>{basics.name}</h1>
          {basics.headline && <div style={{ fontSize: typo.body.fontSize * 1.1, color: "#555", marginTop: 2 }}>{basics.headline}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          {pictureEl}
          {contactLine && <div style={{ fontSize: typo.body.fontSize * 0.85, color: "#777", marginTop: 4 }}>{contactLine}</div>}
        </div>
      </div>
    );
  }

  if (headerStyle === "minimal") {
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {pictureEl}
          <div>
            <h1 style={{ margin: 0, fontSize: typo.heading.fontSize * 1.4, fontFamily: typo.heading.fontFamily, fontWeight: Number(typo.heading.fontWeight) }}>{basics.name}</h1>
            {basics.headline && <div style={{ fontSize: typo.body.fontSize, color: "#555" }}>{basics.headline}</div>}
          </div>
        </div>
        {contactLine && <div style={{ fontSize: typo.body.fontSize * 0.8, color: "#888", marginTop: 6 }}>{contactLine}</div>}
      </div>
    );
  }

  // classic
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
      {pictureEl}
      <div style={{ flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: typo.heading.fontSize * 1.5, fontFamily: typo.heading.fontFamily, fontWeight: Number(typo.heading.fontWeight), color }}>{basics.name}</h1>
        {basics.headline && <div style={{ fontSize: typo.body.fontSize * 1.05, color: "#555", marginTop: 2 }}>{basics.headline}</div>}
        {contactLine && <div style={{ fontSize: typo.body.fontSize * 0.85, color: "#777", marginTop: 4 }}>{contactLine}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function ResumePage({
  pageIndex, pageLayout, data, color, cfg, typo, meta, levelType, pageWidthPx, pageHeightPx,
}: {
  pageIndex: number;
  pageLayout: PageLayout;
  data: ResumeData;
  color: string;
  cfg: TemplateConfig;
  typo: ResumeData["metadata"]["typography"];
  meta: ResumeData["metadata"];
  levelType: LevelType;
  pageWidthPx: number;
  pageHeightPx: number;
}) {
  const sidebarPct = meta.layout.sidebarWidth;
  const hasSidebar = sidebarPct > 0 && pageLayout.sidebar.length > 0;

  const mainSections = pageLayout.main.map((sid) => (
    <React.Fragment key={sid}>{renderSection(sid, data, color, cfg, typo, levelType)}</React.Fragment>
  ));

  const sidebarSections = hasSidebar ? pageLayout.sidebar.map((sid) => (
    <React.Fragment key={sid}>{renderSection(sid, data, color, cfg, typo, levelType)}</React.Fragment>
  )) : null;

  const sidebarBg = cfg.style.hasSidebarBg ? `${color}08` : "transparent";
  const gapX = mmToPx(meta.page.gapX);
  const marginX = mmToPx(meta.page.marginX);
  const marginY = mmToPx(meta.page.marginY);
  const gapY = mmToPx(meta.page.gapY);

  return (
    <div
      className="resume-page"
      style={{
        width: pageWidthPx,
        minHeight: pageHeightPx,
        backgroundColor: meta.design.colors.background,
        color: meta.design.colors.text,
        fontFamily: typo.body.fontFamily,
        fontSize: typo.body.fontSize,
        lineHeight: typo.body.lineHeight,
        padding: `${marginY}px ${marginX}px`,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}
    >
      {/* Header only on first page */}
      {pageIndex === 0 && (
        <ResumeHeader data={data} color={color} cfg={cfg} typo={typo} />
      )}

      {hasSidebar ? (
        <div style={{ display: "flex", gap: gapX }}>
          {cfg.sidebarLeft && (
            <div style={{ width: `${sidebarPct}%`, backgroundColor: sidebarBg, padding: sidebarBg !== "transparent" ? 8 : 0, borderRadius: sidebarBg !== "transparent" ? 4 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: gapY }}>{sidebarSections}</div>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: gapY }}>{mainSections}</div>
          </div>
          {!cfg.sidebarLeft && (
            <div style={{ width: `${sidebarPct}%`, backgroundColor: sidebarBg, padding: sidebarBg !== "transparent" ? 8 : 0, borderRadius: sidebarBg !== "transparent" ? 4 : 0 }}>
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
  const meta = data.metadata;
  if (!meta?.typography?.heading || !meta?.typography?.body || !meta?.design?.colors || !meta?.layout?.pages) {
    return <div className="p-8 text-center text-gray-400">Loading resume…</div>;
  }
  const templateId = (meta.template || "onyx") as TemplateId;
  const cfg = getTemplateConfig(templateId);
  const color = meta.design.colors.primary;
  const typo = meta.typography;
  const levelType = meta.design.level.type;

  const pageDims = PAGE_DIMENSIONS[meta.page.format] ?? PAGE_DIMENSIONS.a4;
  const pageWidthPx = mmToPx(pageDims.width);
  const pageHeightPx = mmToPx(pageDims.height);

  const pages = useMemo(() => {
    if (meta.layout.pages.length === 0) {
      return [{ fullWidth: false, main: ["summary", "experience", "education", "projects"], sidebar: ["skills", "languages"] }];
    }
    return meta.layout.pages;
  }, [meta.layout.pages]);

  // Custom CSS injection
  const customCSSStyle = meta.css.enabled && meta.css.value ? (
    <style dangerouslySetInnerHTML={{ __html: meta.css.value }} />
  ) : null;

  // Heading font style
  const headingFontStyle = `
    .resume-page h1, .resume-page h2, .resume-page h3 {
      font-family: ${typo.heading.fontFamily}, serif;
      font-weight: ${typo.heading.fontWeight};
      line-height: ${typo.heading.lineHeight};
    }
    .resume-page .resume-section { margin-bottom: ${mmToPx(meta.page.gapY)}px; }
    .resume-page .resume-rich-text p { margin: 0.2em 0; }
    .resume-page .resume-rich-text ul { margin: 0.2em 0; padding-left: 1.2em; }
    .resume-page .resume-rich-text li { margin: 0.1em 0; }
  `;

  return (
    <div className={className} style={printMode ? undefined : { transform: `scale(${zoom})`, transformOrigin: "top center" }}>
      <style dangerouslySetInnerHTML={{ __html: headingFontStyle }} />
      {customCSSStyle}
      {pages.map((page, i) => (
        <ResumePage
          key={i}
          pageIndex={i}
          pageLayout={page}
          data={data}
          color={color}
          cfg={cfg}
          typo={typo}
          meta={meta}
          levelType={levelType}
          pageWidthPx={pageWidthPx}
          pageHeightPx={pageHeightPx}
        />
      ))}
    </div>
  );
}
