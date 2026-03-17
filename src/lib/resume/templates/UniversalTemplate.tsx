// =============================================================================
// DMSuite — Universal Template Renderer v3
// Renders ALL 20 pro templates using their original HTML structure and CSS.
// CSS is injected from src/data/template-css.ts via scoped <style> tags.
// Each template has a dedicated render function preserving original class names.
// =============================================================================

"use client";

import React, { useMemo } from "react";
import type { ResumeData, PageLayout, TemplateId } from "@/lib/resume/schema";
import { TEMPLATE_CSS } from "@/data/template-css";
import { getProTemplate } from "./template-defs";

// ---------------------------------------------------------------------------
// Template Props
// ---------------------------------------------------------------------------

interface TemplateProps {
  resume: ResumeData;
  pageIndex: number;
  pageLayout: PageLayout;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/** Filter out hidden items */
function vis<T extends { hidden?: boolean }>(items: T[] | undefined): T[] {
  return (items ?? []).filter((item) => !item.hidden);
}

/** Format date range */
function fmtDate(start: string, end: string, isCurrent?: boolean): string {
  if (!start && !end) return "";
  const endStr = isCurrent ? "Present" : end || "";
  return start && endStr ? `${start} — ${endStr}` : start || endStr;
}

/** Split description into bullet points */
function bullets(desc: string): string[] {
  if (!desc) return [];
  return desc
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

/** Check if a section should be shown on this page */
function shouldShow(sectionId: string, pageLayout: PageLayout): boolean {
  return (
    pageLayout.main.includes(sectionId) ||
    pageLayout.sidebar.includes(sectionId)
  );
}

/** Get language level as percentage (for progress bars) */
function langLevel(level: string): number {
  const l = level.toLowerCase();
  if (l.includes("native") || l.includes("fluent") || l === "c2" || l === "c1") return 100;
  if (l.includes("advanced") || l === "b2") return 80;
  if (l.includes("intermediate") || l === "b1") return 60;
  if (l.includes("basic") || l.includes("elementary") || l === "a2" || l === "a1") return 40;
  return 50;
}

/** Get skill level as percentage */
function skillLevel(level: string | number | undefined): number {
  if (typeof level === "number") return Math.min(100, Math.max(0, level));
  if (!level) return 70;
  const l = String(level).toLowerCase();
  if (l.includes("expert") || l.includes("master")) return 100;
  if (l.includes("advanced")) return 85;
  if (l.includes("intermediate") || l.includes("proficient")) return 70;
  if (l.includes("basic") || l.includes("beginner")) return 50;
  return 70;
}

/** Get initials from name */
function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// SVG Icons (commonly used across templates)
// ---------------------------------------------------------------------------

const Icons = {
  email: (
    <svg viewBox="0 0 24 24">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  ),
  website: (
    <svg viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24">
      <path d="M20 7h-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5z" />
    </svg>
  ),
  education: (
    <svg viewBox="0 0 24 24">
      <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
    </svg>
  ),
  skills: (
    <svg viewBox="0 0 24 24">
      <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" />
    </svg>
  ),
  cert: (
    <svg viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
    </svg>
  ),
  language: (
    <svg viewBox="0 0 24 24">
      <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Template 01 — Modern Minimalist
// ---------------------------------------------------------------------------

function renderTemplate01(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <>
          <div className="header">
            <div className="header-left">
              <div className="name">{basics.name}</div>
              <div className="title">{basics.headline}</div>
            </div>
            <div className="header-right">
              {basics.email && (
                <div className="contact-line">
                  <span>{basics.email}</span>
                  {Icons.email}
                </div>
              )}
              {basics.phone && (
                <div className="contact-line">
                  <span>{basics.phone}</span>
                  {Icons.phone}
                </div>
              )}
              {basics.location && (
                <div className="contact-line">
                  <span>{basics.location}</span>
                  {Icons.location}
                </div>
              )}
              {basics.linkedin && (
                <div className="contact-line">
                  <span>{basics.linkedin}</span>
                  {Icons.linkedin}
                </div>
              )}
            </div>
          </div>
          <div className="header-divider" />
        </>
      )}

      {/* Content */}
      <div className="content">
        {/* Main Column */}
        <div className="main-col">
          {/* Summary */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">Summary</div>
              <div className="summary">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Experience</div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-header">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">
                      {exp.company}
                      {exp.location && ` — ${exp.location}`}
                    </div>
                    {desc.length > 1 ? (
                      <ul className="exp-desc">
                        {desc.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    ) : desc.length === 1 ? (
                      <div className="exp-desc">{desc[0]}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* Projects */}
          {shouldShow("projects", pageLayout) && vis(sections.projects?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Projects</div>
              {vis(sections.projects?.items).map((proj, i) => {
                const desc = bullets(proj.description);
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-header">
                      <div className="exp-role">{proj.name}</div>
                    </div>
                    {proj.url && <div className="exp-company">{proj.url}</div>}
                    {desc.length > 1 ? (
                      <ul className="exp-desc">
                        {desc.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    ) : desc.length === 1 ? (
                      <div className="exp-desc">{desc[0]}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* Education (main column variant) */}
          {shouldShow("education", pageLayout) && pageLayout.main.includes("education") && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Education</div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-item">
                  <div className="edu-degree">
                    {edu.degree}
                    {edu.field && ` in ${edu.field}`}
                  </div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="side-col">
          {/* Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="sidebar-section">
              <div className="section-title">Skills</div>
              {vis(sections.skills?.items).map((skill, i) => (
                <span key={i} className="skill-tag">
                  {skill.name}
                </span>
              ))}
            </div>
          )}

          {/* Education (sidebar variant) */}
          {shouldShow("education", pageLayout) && pageLayout.sidebar.includes("education") && vis(sections.education?.items).length > 0 && (
            <div className="sidebar-section">
              <div className="section-title">Education</div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-item">
                  <div className="edu-degree">
                    {edu.degree}
                    {edu.field && ` in ${edu.field}`}
                  </div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="sidebar-section">
              <div className="section-title">Languages</div>
              {vis(sections.languages?.items).map((lang, i) => (
                <div key={i} className="lang-item">
                  <div>
                    <div className="lang-name">{lang.name}</div>
                    <div className="lang-bar">
                      <div className="lang-fill" style={{ width: `${langLevel(lang.proficiency)}%` }} />
                    </div>
                  </div>
                  <div className="lang-level">{lang.proficiency}</div>
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
            <div className="sidebar-section">
              <div className="section-title">Certifications</div>
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="cert-item">
                  <div className="cert-name">{cert.name}</div>
                  <div className="cert-org">
                    {cert.issuer}
                    {cert.year && ` — ${cert.year}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 02 — Corporate Executive
// ---------------------------------------------------------------------------

function renderTemplate02(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      {/* Banner Header — only on page 0 */}
      {pageIndex === 0 && (
        <div className="banner">
          <div className="banner-content">
            <div className="banner-left">
              <div className="banner-name">{basics.name}</div>
              <div className="banner-title">{basics.headline}</div>
            </div>
            <div className="banner-right">
              {basics.email && (
                <div className="banner-contact">
                  <strong>Email:</strong> {basics.email}
                </div>
              )}
              {basics.phone && (
                <div className="banner-contact">
                  <strong>Phone:</strong> {basics.phone}
                </div>
              )}
              {basics.location && (
                <div className="banner-contact">
                  <strong>Location:</strong> {basics.location}
                </div>
              )}
              {basics.linkedin && (
                <div className="banner-contact">
                  <strong>LinkedIn:</strong> {basics.linkedin}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Body Content */}
      <div className="body-content">
        {/* Executive Summary */}
        {shouldShow("summary", pageLayout) && sections.summary?.content && (
          <div className="exec-summary">
            <p>{sections.summary.content}</p>
          </div>
        )}

        {/* Experience */}
        {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
          <div className="section">
            <div className="section-header">
              <div className="section-icon">{Icons.briefcase}</div>
              <div className="section-title">Professional Experience</div>
              <div className="section-line" />
            </div>
            {vis(sections.experience?.items).map((exp, i) => {
              const desc = bullets(exp.description);
              return (
                <div key={i} className="exp-item">
                  <div className="exp-date-col">
                    <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    {exp.location && <div className="exp-location">{exp.location}</div>}
                  </div>
                  <div className="exp-main">
                    <div className="exp-role">{exp.position}</div>
                    <div className="exp-company">{exp.company}</div>
                    {desc.length > 0 && (
                      <ul className="exp-desc">
                        {desc.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Projects */}
        {shouldShow("projects", pageLayout) && vis(sections.projects?.items).length > 0 && (
          <div className="section">
            <div className="section-header">
              <div className="section-icon">{Icons.briefcase}</div>
              <div className="section-title">Key Projects</div>
              <div className="section-line" />
            </div>
            {vis(sections.projects?.items).map((proj, i) => {
              const desc = bullets(proj.description);
              return (
                <div key={i} className="exp-item">
                  <div className="exp-date-col" />
                  <div className="exp-main">
                    <div className="exp-role">{proj.name}</div>
                    {proj.url && <div className="exp-company">{proj.url}</div>}
                    {desc.length > 0 && (
                      <ul className="exp-desc">
                        {desc.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Two Column Bottom: Education + Skills */}
        <div className="two-col">
          <div>
            {/* Education */}
            {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
              <div className="section">
                <div className="section-header">
                  <div className="section-icon">{Icons.education}</div>
                  <div className="section-title">Education</div>
                  <div className="section-line" />
                </div>
                {vis(sections.education?.items).map((edu, i) => (
                  <div key={i} className="edu-item">
                    <div className="edu-degree">
                      {edu.degree}
                      {edu.field && `, ${edu.field}`}
                    </div>
                    <div className="edu-school">{edu.institution}</div>
                    <div className="edu-year">{edu.graduationYear}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Awards / Achievements */}
            {shouldShow("awards", pageLayout) && vis(sections.awards?.items).length > 0 && (
              <div className="section">
                <div className="section-header">
                  <div className="section-icon">{Icons.cert}</div>
                  <div className="section-title">Achievements</div>
                  <div className="section-line" />
                </div>
                {vis(sections.awards?.items).map((award, i) => (
                  <div key={i} className="achievement-item">
                    <span className="achievement-icon">★</span>
                    <span className="achievement-text">{award.title}{award.issuer && ` — ${award.issuer}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {/* Skills (Key Competencies) */}
            {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
              <div className="section">
                <div className="section-header">
                  <div className="section-icon">{Icons.skills}</div>
                  <div className="section-title">Key Competencies</div>
                  <div className="section-line" />
                </div>
                <div className="competency-grid">
                  {vis(sections.skills?.items).map((skill, i) => (
                    <div key={i} className="comp-item">
                      {skill.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Certifications */}
        {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
          <div className="section">
            <div className="section-header">
              <div className="section-icon">{Icons.cert}</div>
              <div className="section-title">Certifications</div>
              <div className="section-line" />
            </div>
            <div className="certs-row">
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="cert-badge">
                  <div className="cert-name">{cert.name}</div>
                  <div className="cert-org">
                    {cert.issuer}
                    {cert.year && ` • ${cert.year}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
          <div className="section">
            <div className="section-header">
              <div className="section-icon">{Icons.language}</div>
              <div className="section-title">Languages</div>
              <div className="section-line" />
            </div>
            <div className="lang-row">
              {vis(sections.languages?.items).map((lang, i) => (
                <div key={i} className="lang-badge">
                  <span className="lang-name">{lang.name}</span>
                  <span className="lang-level">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 03 — Creative Bold
// ---------------------------------------------------------------------------

function renderTemplate03(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;
  const nameParts = basics.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <>
      {/* Hero Header — only on page 0 */}
      {pageIndex === 0 && (
        <>
          <div className="hero">
            <div className="hero-grid">
              <div>
                <div className="hero-name">
                  {firstName}
                  <br />
                  <span>{lastName}</span>
                </div>
                <div className="hero-title">{basics.headline}</div>
              </div>
              <div className="hero-contact">
                {basics.email && (
                  <div className="hero-contact-item">
                    <strong>✉</strong> {basics.email}
                  </div>
                )}
                {basics.phone && (
                  <div className="hero-contact-item">
                    <strong>☎</strong> {basics.phone}
                  </div>
                )}
                {basics.location && (
                  <div className="hero-contact-item">
                    <strong>◉</strong> {basics.location}
                  </div>
                )}
                {basics.linkedin && (
                  <div className="hero-contact-item">
                    <strong>◈</strong> {basics.linkedin}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="color-strip">
            <div className="strip-1" />
            <div className="strip-2" />
            <div className="strip-3" />
            <div className="strip-4" />
          </div>
        </>
      )}

      {/* Content */}
      <div className="content">
        {/* Main Column */}
        <div className="main-col">
          {/* Summary / About Me */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">
                <div className="dot" />
                ABOUT ME
              </div>
              <div className="about-text">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="dot" />
                EXPERIENCE
              </div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-header">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">{exp.company}</div>
                    {desc.length > 0 && (
                      <ul className="exp-desc">
                        {desc.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Education (main area) */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="dot" />
                EDUCATION
              </div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-card">
                  <div className="edu-degree">
                    {edu.degree}
                    {edu.field && ` ${edu.field}`}
                  </div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="side-col">
          {/* Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="dot" />
                SKILLS
              </div>
              {vis(sections.skills?.items).slice(0, 5).map((skill, i) => {
                const pct = skillLevel(skill.proficiency);
                return (
                  <div key={i} className="skill-bar-group">
                    <div className="skill-label">
                      <span>{skill.name}</span>
                      <span className="skill-pct">{pct}%</span>
                    </div>
                    <div className="skill-track">
                      <div className="skill-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tools (additional skills) */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 5 && (
            <div className="section">
              <div className="section-title">
                <div className="dot" />
                TOOLS
              </div>
              {vis(sections.skills?.items).slice(5).map((skill, i) => (
                <span key={i} className="tool-tag">{skill.name}</span>
              ))}
            </div>
          )}

          {/* Awards */}
          {shouldShow("awards", pageLayout) && vis(sections.awards?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="dot" />
                AWARDS
              </div>
              {vis(sections.awards?.items).map((award, i) => (
                <div key={i} className="award-item">
                  <div className="award-badge">🏆</div>
                  <div className="award-text">
                    <strong>{award.title}</strong>
                    {award.date && ` ${award.date}`}
                    {award.issuer && ` — ${award.issuer}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="dot" />
                CERTIFICATIONS
              </div>
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="social-item">
                  <strong>{cert.name}</strong>
                  {cert.issuer}
                  {cert.year && ` — ${cert.year}`}
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="dot" />
                LANGUAGES
              </div>
              {vis(sections.languages?.items).map((lang, i) => (
                <div key={i} className="social-item">
                  <strong>{lang.name}</strong>
                  {lang.proficiency}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 04 — Elegant Sidebar
// ---------------------------------------------------------------------------

function renderTemplate04(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  // Template 04 - Elegant Sidebar
  // Exact HTML structure: .sidebar > .sidebar-inner > [.avatar-area, .sidebar-content]
  // Main: .main > .section*

  return (
    <>
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-inner">
          {pageIndex === 0 && (
            <div className="avatar-area">
              <div className="avatar-ring">
                <div className="avatar-initials">{initials(basics.name)}</div>
              </div>
              <div className="sidebar-name">{basics.name}</div>
              <div className="sidebar-role">{basics.headline}</div>
            </div>
          )}

          <div className="sidebar-content">
            {/* Contact */}
            {pageIndex === 0 && (
              <div className="sb-section">
                <div className="sb-title">Contact</div>
                {basics.email && (
                  <div className="sb-contact-item">
                    <div className="sb-icon">{Icons.email}</div>
                    <div className="sb-contact-text">{basics.email}</div>
                  </div>
                )}
                {basics.phone && (
                  <div className="sb-contact-item">
                    <div className="sb-icon">{Icons.phone}</div>
                    <div className="sb-contact-text">{basics.phone}</div>
                  </div>
                )}
                {basics.location && (
                  <div className="sb-contact-item">
                    <div className="sb-icon">{Icons.location}</div>
                    <div className="sb-contact-text">{basics.location}</div>
                  </div>
                )}
                {basics.linkedin && (
                  <div className="sb-contact-item">
                    <div className="sb-icon">{Icons.linkedin}</div>
                    <div className="sb-contact-text">{basics.linkedin}</div>
                  </div>
                )}
              </div>
            )}

            {/* Skills (Expertise) */}
            {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
              <div className="sb-section">
                <div className="sb-title">Expertise</div>
                {vis(sections.skills?.items).map((skill, i) => {
                  const level = skillLevel(skill.proficiency);
                  const dots = Math.round(level / 20); // 0-5 dots
                  return (
                    <div key={i} className="sb-skill">
                      <span className="sb-skill-name">{skill.name}</span>
                      <div className="sb-dots">
                        {[1, 2, 3, 4, 5].map((d) => (
                          <div key={d} className={`sb-dot${d <= dots ? " filled" : ""}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Languages */}
            {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
              <div className="sb-section">
                <div className="sb-title">Languages</div>
                {vis(sections.languages?.items).map((lang, i) => (
                  <div key={i} className="sb-lang">
                    <div className="sb-lang-header">
                      <span className="sb-lang-name">{lang.name}</span>
                      <span className="sb-lang-level">{lang.proficiency}</span>
                    </div>
                    <div className="sb-lang-bar">
                      <div className="sb-lang-fill" style={{ width: `${langLevel(lang.proficiency)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main">
        {/* About Me / Summary */}
        {shouldShow("summary", pageLayout) && sections.summary?.content && (
          <div className="section">
            <div className="section-title">About Me</div>
            <div className="section-divider" />
            <div className="summary">{sections.summary.content}</div>
          </div>
        )}

        {/* Experience */}
        {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
          <div className="section">
            <div className="section-title">Experience</div>
            <div className="section-divider" />
            <div className="exp-timeline">
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-top">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    {desc.length > 0 && (
                      <ul className="exp-desc">
                        {desc.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Education (Main area - grid layout) */}
        {shouldShow("education", pageLayout) && !pageLayout.sidebar.includes("education") && vis(sections.education?.items).length > 0 && (
          <div className="section">
            <div className="section-title">Education</div>
            <div className="section-divider" />
            <div className="edu-grid">
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-card">
                  <div className="edu-degree">
                    {edu.degree}
                    {edu.field && ` in ${edu.field}`}
                  </div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {shouldShow("projects", pageLayout) && vis(sections.projects?.items).length > 0 && (
          <div className="section">
            <div className="section-title">Projects</div>
            <div className="section-divider" />
            <div className="exp-timeline">
              {vis(sections.projects?.items).map((proj, i) => {
                const desc = bullets(proj.description);
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-top">
                      <div className="exp-role">{proj.name}</div>
                    </div>
                    {proj.url && <div className="exp-company">{proj.url}</div>}
                    {desc.length > 0 && (
                      <ul className="exp-desc">
                        {desc.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Certifications */}
        {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
          <div className="section">
            <div className="section-title">Certifications</div>
            <div className="section-divider" />
            {vis(sections.certifications?.items).map((cert, i) => (
              <div key={i} className="edu-card">
                <div className="edu-degree">{cert.name}</div>
                <div className="edu-school">{cert.issuer}</div>
                {cert.year && <div className="edu-year">{cert.year}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 05 — Infographic
// ---------------------------------------------------------------------------

function renderTemplate05(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  // Template 05 - Infographic Style
  // Structure: .left-panel (.profile-area + .left-content) + .right-panel (.section*)
  // Colors: teal, orange, purple, pink, blue
  const skillColors = ["var(--teal-light)", "var(--orange)", "var(--purple)", "var(--pink)"];

  return (
    <>
      {/* LEFT PANEL */}
      <div className="left-panel">
        {pageIndex === 0 && (
          <div className="profile-area">
            <div className="profile-avatar">{initials(basics.name)}</div>
            <div className="profile-name">{basics.name}</div>
            <div className="profile-role">{basics.headline}</div>
          </div>
        )}

        <div className="left-content">
          {/* Contact */}
          {pageIndex === 0 && (
            <div className="lp-section">
              <div className="lp-title">Contact</div>
              {basics.email && (
                <div className="lp-contact">
                  <div className="lp-contact-icon">{Icons.email}</div>
                  <div className="lp-contact-text">{basics.email}</div>
                </div>
              )}
              {basics.phone && (
                <div className="lp-contact">
                  <div className="lp-contact-icon">{Icons.phone}</div>
                  <div className="lp-contact-text">{basics.phone}</div>
                </div>
              )}
              {basics.location && (
                <div className="lp-contact">
                  <div className="lp-contact-icon">{Icons.location}</div>
                  <div className="lp-contact-text">{basics.location}</div>
                </div>
              )}
              {basics.linkedin && (
                <div className="lp-contact">
                  <div className="lp-contact-icon">{Icons.linkedin}</div>
                  <div className="lp-contact-text">{basics.linkedin}</div>
                </div>
              )}
            </div>
          )}

          {/* Skills — Circular Progress (first 4) */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="lp-section">
              <div className="lp-title">Core Skills</div>
              <div className="skill-circles">
                {vis(sections.skills?.items)
                  .slice(0, 4)
                  .map((skill, i) => {
                    const pct = skillLevel(skill.proficiency);
                    const radius = 22;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (pct / 100) * circumference;
                    const color = skillColors[i % skillColors.length];
                    return (
                      <div key={i} className="skill-circle">
                        <div className="circle-wrap">
                          <svg className="circle-svg" width="52" height="52" viewBox="0 0 52 52">
                            <circle className="circle-bg" cx="26" cy="26" r={radius} />
                            <circle
                              className="circle-fill"
                              cx="26"
                              cy="26"
                              r={radius}
                              stroke={color}
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                            />
                          </svg>
                          <span className="circle-pct">{pct}%</span>
                        </div>
                        <div className="skill-circle-label">{skill.name}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Additional skills as bars (Tools) */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 4 && (
            <div className="lp-section">
              <div className="lp-title">Tools</div>
              {vis(sections.skills?.items)
                .slice(4, 8)
                .map((skill, i) => {
                  const pct = skillLevel(skill.proficiency);
                  const color = skillColors[i % skillColors.length];
                  return (
                    <div key={i} className="sw-item">
                      <div className="sw-header">
                        <span>{skill.name}</span>
                        <span>{skill.proficiency || "Proficient"}</span>
                      </div>
                      <div className="sw-bar">
                        <div className="sw-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="lp-section">
              <div className="lp-title">Languages</div>
              {vis(sections.languages?.items).map((lang, i) => {
                const level = langLevel(lang.proficiency);
                const dots = Math.round(level / 20);
                return (
                  <div key={i} className="lang-row">
                    <span className="lang-label">{lang.name}</span>
                    <div className="lang-dots">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div key={d} className={`lang-dot${d <= dots ? " filled" : ""}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        {/* About / Summary */}
        {shouldShow("summary", pageLayout) && sections.summary?.content && (
          <div className="section">
            <div className="section-header">
              <div className="section-badge" style={{ background: "var(--teal)" }}>
                {Icons.briefcase}
              </div>
              <div className="section-name">About</div>
              <div className="section-line" />
            </div>
            <div className="summary-text">{sections.summary.content}</div>
          </div>
        )}

        {/* Experience */}
        {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
          <div className="section">
            <div className="section-header">
              <div className="section-badge" style={{ background: "var(--purple)" }}>
                {Icons.briefcase}
              </div>
              <div className="section-name">Experience</div>
              <div className="section-line" />
            </div>
            {vis(sections.experience?.items).map((exp, i) => {
              const desc = bullets(exp.description);
              const color = skillColors[i % skillColors.length];
              return (
                <div key={i} className="exp-item">
                  <div className="exp-time">
                    <div className="exp-year">{exp.startDate}</div>
                    <div className="exp-duration">— {exp.isCurrent ? "Present" : exp.endDate}</div>
                  </div>
                  <div className="exp-card" style={{ borderColor: color }}>
                    <div className="exp-role">{exp.position}</div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    {desc.length > 0 && (
                      <ul className="exp-desc">
                        {desc.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Education (main area) */}
        {shouldShow("education", pageLayout) && !pageLayout.sidebar.includes("education") && vis(sections.education?.items).length > 0 && (
          <div className="section">
            <div className="section-header">
              <div className="section-badge" style={{ background: "var(--orange)" }}>
                {Icons.education}
              </div>
              <div className="section-name">Education</div>
              <div className="section-line" />
            </div>
            {vis(sections.education?.items).map((edu, i) => (
              <div key={i} className="edu-row">
                <div className="edu-icon">🎓</div>
                <div>
                  <div className="edu-degree">
                    {edu.degree}
                    {edu.field && ` (${edu.field})`}
                  </div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
          <div className="section">
            <div className="section-header">
              <div className="section-badge" style={{ background: "var(--pink)" }}>
                {Icons.cert}
              </div>
              <div className="section-name">Certifications</div>
              <div className="section-line" />
            </div>
            {vis(sections.certifications?.items).map((cert, i) => (
              <div key={i} className="edu-row">
                <div className="edu-icon">📜</div>
                <div>
                  <div className="edu-degree">{cert.name}</div>
                  <div className="edu-school">{cert.issuer}</div>
                  {cert.year && <div className="edu-year">{cert.year}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 06 — Dark Professional
// ---------------------------------------------------------------------------

function renderTemplate06(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;
  const neonColors = ["var(--neon-cyan)", "var(--neon-purple)", "var(--neon-blue)"];

  return (
    <>
      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <div className="header">
          <div>
            <div className="name">
              {basics.name.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="name-highlight">{basics.name.split(" ").slice(-1)}</span>
            </div>
            <div className="role">{basics.headline}</div>
          </div>
          <div className="contact-grid">
            {basics.email && (
              <div className="contact-chip">
                {Icons.email}
                <span>{basics.email}</span>
              </div>
            )}
            {basics.phone && (
              <div className="contact-chip">
                {Icons.phone}
                <span>{basics.phone}</span>
              </div>
            )}
            {basics.location && (
              <div className="contact-chip">
                {Icons.location}
                <span>{basics.location}</span>
              </div>
            )}
            {basics.linkedin && (
              <div className="contact-chip">
                {Icons.website}
                <span>{basics.linkedin}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="content">
        {/* Main Column */}
        <div className="main-col">
          {/* Summary */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">About</div>
              <div className="summary">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Experience</div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-card">
                    <div className="exp-top">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    {desc.length > 0 && (
                      <ul className="exp-desc">
                        {desc.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Education</div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-item">
                  <div className="edu-degree">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Skills</div>
              {vis(sections.skills?.items).map((skill, i) => {
                const pct = skillLevel(skill.proficiency);
                return (
                  <div key={i} className="skill-item">
                    <div className="skill-top">
                      <span>{skill.name}</span>
                      <span className="skill-pct">{pct}%</span>
                    </div>
                    <div className="skill-bar">
                      <div className="skill-fill" style={{ width: `${pct}%`, background: `linear-gradient(to right, ${neonColors[i % 3]}, ${neonColors[(i + 1) % 3]})` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Projects */}
          {shouldShow("projects", pageLayout) && vis(sections.projects?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Projects</div>
              {vis(sections.projects?.items).map((proj, i) => (
                <div key={i} className="project-item">
                  <div className="project-name">⚡ {proj.name}</div>
                  <div className="project-desc">{proj.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Certifications</div>
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="cert-card">
                  <div className="cert-name">{cert.name}</div>
                  <div className="cert-org">{cert.issuer}{cert.year && ` — ${cert.year}`}</div>
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Languages</div>
              {vis(sections.languages?.items).map((lang, i) => {
                const bgColor = neonColors[i % neonColors.length];
                return (
                  <div key={i} className="lang-item">
                    <span className="lang-name">{lang.name}</span>
                    <span className="lang-badge" style={{ background: `${bgColor}22`, color: bgColor }}>{lang.proficiency}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 07 — Gradient Creative
// ---------------------------------------------------------------------------

function renderTemplate07(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;
  const gradients = ["var(--gradient-1)", "var(--gradient-2)", "var(--gradient-3)"];

  return (
    <>
      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <>
          <div className="grad-header">
            <div className="header-content">
              <div className="header-left">
                <div className="header-tag">Available for Hire</div>
                <div className="header-name">{basics.name.split(" ").join("\n")}</div>
                <div className="header-subtitle">{basics.headline}</div>
              </div>
              <div className="header-contact">
                {basics.email && (
                  <div className="hc-item">
                    {basics.email}
                    {Icons.email}
                  </div>
                )}
                {basics.phone && (
                  <div className="hc-item">
                    {basics.phone}
                    {Icons.phone}
                  </div>
                )}
                {basics.location && (
                  <div className="hc-item">
                    {basics.location}
                    {Icons.location}
                  </div>
                )}
                {basics.linkedin && (
                  <div className="hc-item">
                    {basics.linkedin}
                    {Icons.website}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="wave" />
        </>
      )}

      {/* Body */}
      <div className="body">
        {/* Main Column */}
        <div className="main-col">
          {/* Summary */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">
                <div className="section-icon" style={{ background: "var(--gradient-1)" }}>
                  {Icons.briefcase}
                </div>
                Summary
              </div>
              <div className="summary">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="section-icon" style={{ background: "var(--gradient-2)" }}>
                  {Icons.briefcase}
                </div>
                Experience
              </div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                const gradient = gradients[i % gradients.length];
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-top">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date" style={{ background: gradient }}>{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    {desc.length > 0 && (
                      <ul className="exp-desc">
                        {desc.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="section-icon" style={{ background: "var(--gradient-3)" }}>
                  {Icons.education}
                </div>
                Education
              </div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-card">
                  <div className="edu-degree">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="side-col">
          {/* Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="section-icon" style={{ background: "var(--gradient-1)" }}>
                  {Icons.skills}
                </div>
                Skills
              </div>
              {vis(sections.skills?.items).map((skill, i) => (
                <span key={i} className="skill-pill" style={{ background: gradients[i % gradients.length] }}>{skill.name}</span>
              ))}
            </div>
          )}

          {/* Certifications */}
          {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="section-icon" style={{ background: "var(--gradient-2)" }}>
                  {Icons.cert}
                </div>
                Certifications
              </div>
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="cert-badge">
                  <div className="cert-dot" style={{ background: gradients[i % gradients.length] }} />
                  <div className="cert-info">
                    <div className="cert-name">{cert.name}</div>
                    <div className="cert-org">{cert.issuer}{cert.year && ` — ${cert.year}`}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="section-icon" style={{ background: "var(--gradient-3)" }}>
                  {Icons.language}
                </div>
                Languages
              </div>
              {vis(sections.languages?.items).map((lang, i) => (
                <div key={i} className="ref-card">
                  <div className="ref-name">{lang.name}</div>
                  <div className="ref-title">{lang.proficiency}</div>
                </div>
              ))}
            </div>
          )}

          {/* Volunteer */}
          {shouldShow("volunteer", pageLayout) && vis(sections.volunteer?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="section-icon" style={{ background: "var(--gradient-1)" }}>
                  {Icons.skills}
                </div>
                Volunteer
              </div>
              {vis(sections.volunteer?.items).map((vol, i) => (
                <div key={i} className="interest-card">
                  <span className="interest-emoji">📚</span>
                  <span className="interest-text">{vol.organization}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 08 — Classic Corporate
// ---------------------------------------------------------------------------

function renderTemplate08(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <div className="header">
          <div className="header-top">
            <div className="name-block">
              <div className="full-name">{basics.name}</div>
              <div className="job-title">{basics.headline}</div>
            </div>
            <div className="contact-block">
              <div className="cb-col">
                {basics.email && (
                  <div className="cb-item">
                    {Icons.email}
                    {basics.email}
                  </div>
                )}
                {basics.phone && (
                  <div className="cb-item">
                    {Icons.phone}
                    {basics.phone}
                  </div>
                )}
              </div>
              <div className="cb-col">
                {basics.location && (
                  <div className="cb-item">
                    {Icons.location}
                    {basics.location}
                  </div>
                )}
                {basics.linkedin && (
                  <div className="cb-item">
                    {Icons.linkedin}
                    {basics.linkedin}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Body Content */}
      <div className="body-content">
        {/* Main Column */}
        <div className="main-column">
          {/* Profile */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">Professional Profile</div>
              <div className="profile-text">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Professional Experience</div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-period">
                      <div className="exp-dates">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                      {exp.location && <div className="exp-loc">{exp.location}</div>}
                    </div>
                    <div className="exp-detail">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-company">{exp.company}</div>
                      {desc.length > 0 && (
                        <ul className="exp-bullets">
                          {desc.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Education</div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-item">
                  <div className="edu-year">{edu.graduationYear}</div>
                  <div>
                    <div className="edu-degree">{edu.degree}{edu.field && `, ${edu.field}`}</div>
                    <div className="edu-school">{edu.institution}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="right-column">
          {/* Core Competencies / Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="rc-section">
              <div className="rc-title">Core Competencies</div>
              {vis(sections.skills?.items).map((skill, i) => (
                <div key={i} className="competency">
                  <div className="comp-bullet" />
                  {skill.name}
                </div>
              ))}
            </div>
          )}

          {/* Software */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="rc-section">
              <div className="rc-title">Software</div>
              {vis(sections.skills?.items).slice(0, 5).map((skill, i) => {
                const pct = skillLevel(skill.proficiency);
                return (
                  <div key={i} className="sw-item">
                    <div className="sw-name">{skill.name}</div>
                    <div className="sw-bar">
                      <div className="sw-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="rc-section">
              <div className="rc-title">Languages</div>
              {vis(sections.languages?.items).map((lang, i) => (
                <div key={i} className="lang-row">
                  <span className="lang-name">{lang.name}</span>
                  <span className="lang-level">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          )}

          {/* Affiliations / Certifications */}
          {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
            <div className="rc-section">
              <div className="rc-title">Affiliations</div>
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="affiliation">
                  <strong>{cert.name}</strong>
                  {cert.issuer}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 09 — Artistic Portfolio
// ---------------------------------------------------------------------------

function renderTemplate09(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;
  const colors = ["var(--coral)", "var(--mint)", "var(--lavender)", "var(--amber)", "var(--sky)"];

  return (
    <>
      {/* Decorative shapes */}
      <div className="deco-circle deco-1" />
      <div className="deco-circle deco-2" />
      <div className="deco-circle deco-3" />

      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <>
          <div className="header">
            <div className="avatar-box">
              <div className="avatar-initials">{initials(basics.name)}</div>
            </div>
            <div className="header-text">
              <div className="name">{basics.name}</div>
              <div className="role">{basics.headline}</div>
              <div className="contact-row">
                {basics.email && (
                  <div className="contact-pill">
                    {Icons.email}
                    {basics.email}
                  </div>
                )}
                {basics.phone && (
                  <div className="contact-pill">
                    {Icons.phone}
                    {basics.phone}
                  </div>
                )}
                {basics.location && (
                  <div className="contact-pill">
                    {Icons.location}
                    {basics.location}
                  </div>
                )}
                {basics.linkedin && (
                  <div className="contact-pill">
                    {Icons.website}
                    {basics.linkedin}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="color-bar">
            {colors.map((c, i) => (
              <div key={i} className="cb-seg" style={{ background: c }} />
            ))}
          </div>
        </>
      )}

      {/* Body */}
      <div className="body">
        {/* Main Column */}
        <div className="main-col">
          {/* About */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">
                <div className="st-shape" style={{ background: colors[0] }}>★</div>
                About
              </div>
              <div className="about">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="st-shape" style={{ background: colors[1] }}>●</div>
                Experience
              </div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                const color = colors[i % colors.length];
                return (
                  <div key={i} className="exp-card">
                    <div className="exp-accent" style={{ background: color }} />
                    <div className="exp-top">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    {desc.length > 0 && (
                      <ul className="exp-desc">
                        {desc.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Projects */}
          {shouldShow("projects", pageLayout) && vis(sections.projects?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="st-shape" style={{ background: colors[2] }}>◆</div>
                Projects
              </div>
              <div className="project-grid">
                {vis(sections.projects?.items).map((proj, i) => (
                  <div key={i} className="project-card" style={{ background: colors[i % colors.length] }}>
                    <div className="project-name">{proj.name}</div>
                    <div className="project-type">{proj.keywords?.[0] || "Project"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="side-col">
          {/* Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="st-shape" style={{ background: colors[3] }}>▲</div>
                Skills
              </div>
              {vis(sections.skills?.items).map((skill, i) => (
                <div key={i} className="skill-row">
                  <div className="skill-dot" style={{ background: colors[i % colors.length] }} />
                  <div className="skill-name">{skill.name}</div>
                </div>
              ))}
            </div>
          )}

          {/* Awards */}
          {shouldShow("awards", pageLayout) && vis(sections.awards?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="st-shape" style={{ background: colors[4] }}>★</div>
                Awards
              </div>
              {vis(sections.awards?.items).map((award, i) => (
                <div key={i} className="award-card">
                  <div className="award-year">{award.date}</div>
                  <div className="award-name">{award.title}</div>
                  <div className="award-org">{award.issuer}</div>
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="st-shape" style={{ background: colors[0] }}>◆</div>
                Education
              </div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-mini">
                  <div className="edu-degree">{edu.degree}</div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}

          {/* Volunteer */}
          {shouldShow("volunteer", pageLayout) && vis(sections.volunteer?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                <div className="st-shape" style={{ background: colors[1] }}>♥</div>
                Volunteer
              </div>
              {vis(sections.volunteer?.items).map((vol, i) => (
                <span key={i} className="hobby-bubble" style={{ borderColor: colors[i % colors.length], color: colors[i % colors.length] }}>
                  {vol.organization}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 10 — Tech Modern (Terminal-style)
// ---------------------------------------------------------------------------

function renderTemplate10(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;
  const stackColors = [
    { bg: "var(--green-dim)", color: "var(--green)" },
    { bg: "rgba(6, 182, 212, 0.1)", color: "var(--cyan)" },
    { bg: "rgba(245, 158, 11, 0.1)", color: "var(--amber)" },
    { bg: "rgba(167, 139, 250, 0.1)", color: "var(--purple)" },
  ];

  return (
    <>
      {/* Terminal Bar */}
      {pageIndex === 0 && (
        <>
          <div className="terminal-bar">
            <div className="term-dot term-red" />
            <div className="term-dot term-yellow" />
            <div className="term-dot term-green" />
            <span className="term-title">~/curriculum-vitae — bash</span>
          </div>

          {/* Header */}
          <div className="header">
            <div className="header-grid">
              <div>
                <div className="comment">{/* headline */} {basics.headline}</div>
                <div className="name-line">
                  <span className="keyword">const</span> <span className="func">engineer</span> <span className="paren">=</span> <span className="keyword">new</span> <span className="func">Person</span><span className="paren">(</span><span className="string">&quot;{basics.name}&quot;</span><span className="paren">);</span>
                </div>
                <div className="big-name">
                  <span className="first">{basics.name.split(" ").slice(0, -1).join(" ")} </span>
                  <span className="last">{basics.name.split(" ").slice(-1)}</span>
                </div>
                <div className="big-role">$ {basics.headline}</div>
              </div>
              <div className="status-badges">
                <div className="status-badge">
                  <div className="status-dot" style={{ background: "var(--green)" }} />
                  Open to work
                </div>
                <div className="status-badge">
                  <div className="status-dot" style={{ background: "var(--amber)" }} />
                  {vis(sections.experience?.items).length}+ years exp
                </div>
                <div className="status-badge">
                  <div className="status-dot" style={{ background: "var(--cyan)" }} />
                  {basics.location || "Remote OK"}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Content */}
      <div className="content">
        {/* Main Column */}
        <div className="main-col">
          {/* Config Block (Summary) */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title"><span className="bracket">[</span> about.config <span className="bracket">]</span></div>
              <div className="config-block">
                <span className="config-key">&quot;summary&quot;</span>: <span className="config-val">&quot;{sections.summary.content}&quot;</span>
              </div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title"><span className="bracket">[</span> experience <span className="bracket">]</span></div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-card">
                    <div className="exp-head">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">@{exp.company}</div>
                    {desc.length > 0 && (
                      <ul className="exp-bullets">
                        {desc.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title"><span className="bracket">[</span> education <span className="bracket">]</span></div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-card">
                  <div className="edu-degree">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Tech Stack */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="section">
              <div className="section-title"><span className="bracket">[</span> tech_stack <span className="bracket">]</span></div>
              <div className="tech-category">
                <div className="tech-label">Languages</div>
                <div className="tech-items">
                  {vis(sections.skills?.items).slice(0, 4).map((s, i) => (
                    <span key={i} className="tech-item">{s.name}</span>
                  ))}
                </div>
              </div>
              <div className="tech-category">
                <div className="tech-label">Tools</div>
                <div className="tech-items">
                  {vis(sections.skills?.items).slice(4, 8).map((s, i) => (
                    <span key={i} className="tech-item">{s.name}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GitHub Stats (Projects) */}
          {shouldShow("projects", pageLayout) && vis(sections.projects?.items).length > 0 && (
            <div className="section">
              <div className="section-title"><span className="bracket">[</span> projects <span className="bracket">]</span></div>
              <div className="gh-card">
                {vis(sections.projects?.items).slice(0, 3).map((proj, i) => (
                  <div key={i} className="gh-stat">
                    <span className="gh-label">{proj.name}</span>
                    <span className="gh-value" style={{ color: stackColors[i % 4].color }}>{proj.keywords?.[0] || "Active"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
            <div className="section">
              <div className="section-title"><span className="bracket">[</span> certs <span className="bracket">]</span></div>
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="cert-row">
                  <div className="cert-icon" style={{ background: stackColors[i % 4].bg, color: stackColors[i % 4].color }}>✓</div>
                  <div className="cert-text">
                    <strong>{cert.name}</strong>
                    {cert.issuer}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contact */}
          {pageIndex === 0 && (
            <div className="section">
              <div className="section-title"><span className="bracket">[</span> contact <span className="bracket">]</span></div>
              <div className="contact-code">
                {basics.email && <><span className="cc-key">email</span>: <span className="cc-val">&quot;{basics.email}&quot;</span><br /></>}
                {basics.phone && <><span className="cc-key">phone</span>: <span className="cc-val">&quot;{basics.phone}&quot;</span><br /></>}
                {basics.location && <><span className="cc-key">location</span>: <span className="cc-val">&quot;{basics.location}&quot;</span></>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 11 — Swiss Typographic
// ---------------------------------------------------------------------------

function renderTemplate11(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      {/* Top Red Rule */}
      <div className="top-rule" />

      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <div className="header">
          <div className="name">{basics.name}</div>
          <div className="role">{basics.headline}</div>
          <div className="contact-row">
            {basics.email && (
              <div className="contact-item">
                {Icons.email}
                {basics.email}
              </div>
            )}
            {basics.phone && (
              <div className="contact-item">
                {Icons.phone}
                {basics.phone}
              </div>
            )}
            {basics.location && (
              <div className="contact-item">
                {Icons.location}
                {basics.location}
              </div>
            )}
            {basics.linkedin && (
              <div className="contact-item">
                {Icons.linkedin}
                {basics.linkedin}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="content">
        {/* Main */}
        <div className="main">
          {/* Summary */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">Profile</div>
              <div className="summary">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Experience</div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-top">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    {desc.length > 0 && (
                      <div className="exp-desc">
                        <ul>
                          {desc.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Education</div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-item">
                  <div className="edu-degree">{edu.degree}{edu.field && `, ${edu.field}`}</div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Skills</div>
              {vis(sections.skills?.items).map((skill, i) => (
                <div key={i} className="skill-item">{skill.name}</div>
              ))}
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Languages</div>
              {vis(sections.languages?.items).map((lang, i) => (
                <div key={i} className="lang-item">
                  <span className="lang-name">{lang.name}</span>
                  <span className="lang-level">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Certifications</div>
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="cert-item">
                  <div className="cert-name">{cert.name}</div>
                  <div className="cert-org">{cert.issuer}{cert.year && `, ${cert.year}`}</div>
                </div>
              ))}
            </div>
          )}

          {/* Volunteer */}
          {shouldShow("volunteer", pageLayout) && vis(sections.volunteer?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Volunteer</div>
              <div className="interest-list">
                {vis(sections.volunteer?.items).map((vol, i) => (
                  <span key={i}>{vol.organization}{i < vis(sections.volunteer?.items).length - 1 ? ", " : ""}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 12 — Newspaper Editorial
// ---------------------------------------------------------------------------

function renderTemplate12(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      {/* Masthead — only on page 0 */}
      {pageIndex === 0 && (
        <div className="masthead">
          <div className="dateline">Curriculum Vitae — Updated {new Date().getFullYear()}</div>
          <div className="name">{basics.name}</div>
          <div className="tagline">&quot;{basics.headline}&quot;</div>
          <div className="contact-bar">
            {basics.email && <span className="contact-item">✉ {basics.email}</span>}
            {basics.phone && <span className="contact-item">☎ {basics.phone}</span>}
            {basics.location && <span className="contact-item">⌂ {basics.location}</span>}
            {basics.linkedin && <span className="contact-item">⟡ {basics.linkedin}</span>}
          </div>
        </div>
      )}

      {/* Columns */}
      <div className="columns">
        {/* Left Column */}
        <div className="col-left">
          {/* Lede / Summary */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">Profile</div>
              <div className="lede">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Experience</div>
              {vis(sections.experience?.items).map((exp, i) => (
                <div key={i} className="exp-item">
                  <div className="exp-headline">{exp.position}</div>
                  <div className="exp-byline">{exp.company}{exp.location && ` — ${exp.location}`}, {fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                  <div className="exp-body">{exp.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-right">
          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Education</div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-item">
                  <div className="edu-degree">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                  <div className="edu-detail">{edu.institution} — {edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Skills</div>
              <div className="skills-grid">
                {vis(sections.skills?.items).map((skill, i) => (
                  <div key={i} className="skill-item">{skill.name}</div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {shouldShow("awards", pageLayout) && vis(sections.awards?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Awards</div>
              {vis(sections.awards?.items).map((award, i) => (
                <div key={i} className="award-item">
                  <div className="award-name">{award.title}</div>
                  <div className="award-detail">{award.issuer}, {award.date}</div>
                </div>
              ))}
            </div>
          )}

          {/* Publications / Projects */}
          {shouldShow("projects", pageLayout) && vis(sections.projects?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Publications</div>
              {vis(sections.projects?.items).map((proj, i) => (
                <div key={i} className="pub-item">
                  <em>&quot;{proj.name}&quot;</em> — {proj.description}
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Languages</div>
              {vis(sections.languages?.items).map((lang, i) => (
                <div key={i} className="skill-item">{lang.name} — {lang.proficiency}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="footer">References and full portfolio available upon request</div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 13 — Brutalist Mono
// ---------------------------------------------------------------------------

function renderTemplate13(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <>
          <div className="header">
            <div className="header-grid">
              <div>
                <div className="name">{basics.name.split(" ").join("\n")}</div>
                <div className="role">{basics.headline}</div>
              </div>
              <div className="header-contact">
                {basics.email && <div className="hc-line"><span>@</span> {basics.email}</div>}
                {basics.phone && <div className="hc-line"><span>#</span> {basics.phone}</div>}
                {basics.location && <div className="hc-line"><span>⌘</span> {basics.location}</div>}
                {basics.linkedin && <div className="hc-line"><span>↗</span> {basics.linkedin}</div>}
              </div>
            </div>
          </div>
          <div className="stripe-bar" />
        </>
      )}

      {/* Body */}
      <div className="body">
        {/* Profile */}
        {shouldShow("summary", pageLayout) && sections.summary?.content && (
          <div className="section">
            <div className="section-header">
              <div className="section-number">01</div>
              <div className="section-title">Profile</div>
            </div>
            <div className="summary">{sections.summary.content}</div>
          </div>
        )}

        {/* Experience */}
        {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
          <div className="section">
            <div className="section-header">
              <div className="section-number">02</div>
              <div className="section-title">Experience</div>
            </div>
            <div className="exp-grid">
              {vis(sections.experience?.items).map((exp, i) => (
                <div key={i} className="exp-item">
                  <div className="exp-date-col">
                    <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent).split(" — ").join("\n")}</div>
                  </div>
                  <div className="exp-content">
                    <div className="exp-role">{exp.position}</div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    <div className="exp-desc">{exp.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Grid */}
        <div className="bottom-grid">
          <div>
            {/* Education */}
            {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
              <div className="section">
                <div className="section-header">
                  <div className="section-number">03</div>
                  <div className="section-title">Education</div>
                </div>
                {vis(sections.education?.items).map((edu, i) => (
                  <div key={i} className="edu-item">
                    <div className="edu-degree">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                    <div className="edu-school">{edu.institution}</div>
                    <div className="edu-year">{edu.graduationYear}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
              <div className="section">
                <div className="section-header">
                  <div className="section-number">04</div>
                  <div className="section-title">Certifications</div>
                </div>
                {vis(sections.certifications?.items).map((cert, i) => (
                  <div key={i} className="cert-item">
                    <div className="cert-name">{cert.name}</div>
                    <div className="cert-org">{cert.issuer}{cert.year && `, ${cert.year}`}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Languages */}
            {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
              <div className="section">
                <div className="section-header">
                  <div className="section-number">05</div>
                  <div className="section-title">Languages</div>
                </div>
                {vis(sections.languages?.items).map((lang, i) => (
                  <div key={i} className="lang-row">
                    <span className="lang-name">{lang.name}</span>
                    <span className="lang-level">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {/* Skills */}
            {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
              <div className="section">
                <div className="section-header">
                  <div className="section-number">06</div>
                  <div className="section-title">Skills</div>
                </div>
                <div className="skill-grid">
                  {vis(sections.skills?.items).map((skill, i) => (
                    <div key={i} className="skill-tag">{skill.name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 14 — Pastel Soft
// ---------------------------------------------------------------------------

function renderTemplate14(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;
  const colors = ["var(--pink)", "var(--lavender)", "var(--mint)", "var(--peach)", "var(--sky)"];

  return (
    <>
      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <div className="header">
          <div className="header-flex">
            <div>
              <div className="name">{basics.name}</div>
              <div className="role">{basics.headline}</div>
            </div>
            <div className="contact-col">
              {basics.email && (
                <div className="contact-item">
                  <span>{basics.email}</span>
                  <div className="contact-dot" style={{ background: colors[0] }} />
                </div>
              )}
              {basics.phone && (
                <div className="contact-item">
                  <span>{basics.phone}</span>
                  <div className="contact-dot" style={{ background: colors[1] }} />
                </div>
              )}
              {basics.location && (
                <div className="contact-item">
                  <span>{basics.location}</span>
                  <div className="contact-dot" style={{ background: colors[2] }} />
                </div>
              )}
              {basics.linkedin && (
                <div className="contact-item">
                  <span>{basics.linkedin}</span>
                  <div className="contact-dot" style={{ background: colors[4] }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="body">
        {/* Main */}
        <div className="main">
          {/* Profile */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title pink">Profile</div>
              <div className="summary">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title lavender">Experience</div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-top">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    {desc.length > 0 && <div className="exp-desc">{desc.join(". ")}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title mint">Education</div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-item">
                  <div className="edu-degree">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title pink">Skills</div>
              <div className="skill-pills">
                {vis(sections.skills?.items).map((skill, i) => (
                  <span key={i} className="skill-pill">{skill.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title lavender">Languages</div>
              {vis(sections.languages?.items).map((lang, i) => {
                const level = langLevel(lang.proficiency);
                const dots = Math.round(level / 20);
                return (
                  <div key={i} className="lang-item">
                    <span className="lang-name">{lang.name}</span>
                    <div className="lang-dots">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div key={d} className={`lang-dot${d <= dots ? " filled" : ""}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Certifications */}
          {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title mint">Certifications</div>
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="cert-item">
                  <div className="cert-name">{cert.name}</div>
                  <div className="cert-org">{cert.issuer}{cert.year && `, ${cert.year}`}</div>
                </div>
              ))}
            </div>
          )}

          {/* Volunteer */}
          {shouldShow("volunteer", pageLayout) && vis(sections.volunteer?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title peach">Volunteer</div>
              {vis(sections.volunteer?.items).map((vol, i) => (
                <div key={i} className="interest-item">{vol.organization}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 15 — Split Duotone
// ---------------------------------------------------------------------------

function renderTemplate15(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      {/* Left Panel */}
      <div className="left">
        {pageIndex === 0 && (
          <>
            <div className="avatar-ring">
              <div className="avatar-initials">{initials(basics.name)}</div>
            </div>
            <div className="left-name">{basics.name.split(" ").join("\n")}</div>
            <div className="left-role">{basics.headline}</div>

            {/* Contact */}
            <div className="left-section">
              <div className="left-title">Contact</div>
              {basics.email && (
                <div className="lc-item">
                  {Icons.email}
                  {basics.email}
                </div>
              )}
              {basics.phone && (
                <div className="lc-item">
                  {Icons.phone}
                  {basics.phone}
                </div>
              )}
              {basics.location && (
                <div className="lc-item">
                  {Icons.location}
                  {basics.location}
                </div>
              )}
              {basics.linkedin && (
                <div className="lc-item">
                  {Icons.linkedin}
                  {basics.linkedin}
                </div>
              )}
            </div>
          </>
        )}

        {/* Skills */}
        {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
          <div className="left-section">
            <div className="left-title">Skills</div>
            {vis(sections.skills?.items).map((skill, i) => {
              const pct = skillLevel(skill.proficiency);
              return (
                <div key={i} className="skill-row">
                  <div className="skill-name">{skill.name}</div>
                  <div className="skill-bar">
                    <div className="skill-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Languages */}
        {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
          <div className="left-section">
            <div className="left-title">Languages</div>
            {vis(sections.languages?.items).map((lang, i) => (
              <div key={i} className="lang-row">
                <span className="lang-name">{lang.name}</span>
                <span className="lang-level">{lang.proficiency}</span>
              </div>
            ))}
          </div>
        )}

        {/* Volunteer */}
        {shouldShow("volunteer", pageLayout) && vis(sections.volunteer?.items).length > 0 && (
          <div className="left-section">
            <div className="left-title">Volunteer</div>
            {vis(sections.volunteer?.items).map((vol, i) => (
              <div key={i} className="interest">{vol.organization}</div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="right">
        {/* Profile */}
        {shouldShow("summary", pageLayout) && sections.summary?.content && (
          <div className="section">
            <div className="section-title">Profile</div>
            <div className="summary">{sections.summary.content}</div>
          </div>
        )}

        {/* Experience */}
        {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
          <div className="section">
            <div className="section-title">Experience</div>
            {vis(sections.experience?.items).map((exp, i) => {
              const desc = bullets(exp.description);
              return (
                <div key={i} className="exp-item">
                  <div className="exp-header">
                    <div className="exp-role">{exp.position}</div>
                    <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                  </div>
                  <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                  {desc.length > 0 && <div className="exp-desc">{desc.join(". ")}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* Education */}
        {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
          <div className="section">
            <div className="section-title">Education</div>
            <div className="edu-row">
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-card">
                  <div className="edu-degree">{edu.degree}{edu.field && ` (${edu.field})`}</div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
          <div className="section">
            <div className="section-title">Certifications</div>
            <div className="cert-row">
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="cert-tag">{cert.name}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 16 — Architecture Blueprint
// ---------------------------------------------------------------------------

function renderTemplate16(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <div className="header">
          <div>
            <div className="name">{basics.name.split(" ").slice(0, -1).join(" ")} <span>{basics.name.split(" ").slice(-1)}</span></div>
            <div className="role">{basics.headline}</div>
          </div>
          <div className="contact-grid">
            {basics.email && (
              <div className="contact-item">
                {Icons.email}
                {basics.email}
              </div>
            )}
            {basics.phone && (
              <div className="contact-item">
                {Icons.phone}
                {basics.phone}
              </div>
            )}
            {basics.location && (
              <div className="contact-item">
                {Icons.location}
                {basics.location}
              </div>
            )}
            {basics.linkedin && (
              <div className="contact-item">
                {Icons.website}
                {basics.linkedin}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Frame */}
      <div className="frame">
        <div className="frame-label">SHEET CV-01 — REV. 03</div>

        {/* Summary */}
        {shouldShow("summary", pageLayout) && sections.summary?.content && (
          <div className="section">
            <div className="section-title">Professional Summary</div>
            <div className="summary">{sections.summary.content}</div>
          </div>
        )}

        {/* Experience */}
        {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
          <div className="section">
            <div className="section-title">Professional Experience</div>
            <div className="exp-grid">
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-year">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent).split(" — ").join("\n")}</div>
                    <div className="exp-body">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                      {desc.length > 0 && <div className="exp-desc">{desc.join(". ")}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Two Column */}
        <div className="two-col">
          <div>
            {/* Education */}
            {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
              <div className="section">
                <div className="section-title">Education</div>
                {vis(sections.education?.items).map((edu, i) => (
                  <div key={i} className="edu-item">
                    <div className="edu-degree">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                    <div className="edu-school">{edu.institution}</div>
                    <div className="edu-year">{edu.graduationYear}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Software / Skills as bars */}
            {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
              <div className="section">
                <div className="section-title">Software</div>
                {vis(sections.skills?.items).slice(0, 6).map((skill, i) => {
                  const pct = skillLevel(skill.proficiency);
                  return (
                    <div key={i} className="sw-row">
                      <span className="sw-name">{skill.name}</span>
                      <div className="sw-bar">
                        <div className="sw-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            {/* Expertise */}
            {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
              <div className="section">
                <div className="section-title">Expertise</div>
                <div className="skill-cat">
                  <div className="skill-cat-title">Technical</div>
                  <div className="skill-items">{vis(sections.skills?.items).slice(0, 5).map(s => s.name).join(", ")}</div>
                </div>
              </div>
            )}

            {/* Certifications */}
            {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
              <div className="section">
                <div className="section-title">Certifications</div>
                {vis(sections.certifications?.items).map((cert, i) => (
                  <div key={i} className="cert-item">
                    <div className="cert-name">{cert.name}</div>
                    <div className="cert-org">{cert.issuer}{cert.year && `, ${cert.year}`}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Title Block */}
        <div className="title-block">
          <div className="tb-cell">
            <div className="tb-label">Drawn by</div>
            <div className="tb-value">{basics.name.split(" ").map(n => n[0]).join(". ")}.</div>
          </div>
          <div className="tb-cell">
            <div className="tb-label">Scale</div>
            <div className="tb-value">A4 · 1:1</div>
          </div>
          <div className="tb-cell">
            <div className="tb-label">Date</div>
            <div className="tb-value">{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 17 — Retro Vintage
// ---------------------------------------------------------------------------

function renderTemplate17(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      <div className="inner-border" />

      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <div className="header">
          <div className="ornament">✦ ✦ ✦</div>
          <div className="name">{basics.name}</div>
          <div className="role">{basics.headline}</div>
          <div className="contact-row">
            {basics.email && <div className="contact-item"><span>✉</span> {basics.email}</div>}
            {basics.phone && <div className="contact-item"><span>☎</span> {basics.phone}</div>}
            {basics.location && <div className="contact-item"><span>⌂</span> {basics.location}</div>}
            {basics.linkedin && <div className="contact-item"><span>↗</span> {basics.linkedin}</div>}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="body">
        {/* Main */}
        <div className="main">
          {/* Profile */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">Profile</div>
              <div className="summary">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Experience</div>
              {vis(sections.experience?.items).map((exp, i, arr) => (
                <React.Fragment key={i}>
                  <div className="exp-item">
                    <div className="exp-role">{exp.position}</div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    <div className="exp-desc">{exp.description}</div>
                  </div>
                  {i < arr.length - 1 && <div className="exp-divider">❦</div>}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Education</div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-item">
                  <div className="edu-degree">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Expertise / Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Expertise</div>
              {vis(sections.skills?.items).map((skill, i) => (
                <div key={i} className="skill-item">{skill.name}</div>
              ))}
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Languages</div>
              {vis(sections.languages?.items).map((lang, i) => (
                <div key={i} className="lang-item">
                  <span className="lang-name">{lang.name}</span>
                  <span className="lang-level">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Certifications</div>
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="cert-item">
                  <div className="cert-name">{cert.name}</div>
                  <div className="cert-org">{cert.issuer}{cert.year && `, ${cert.year}`}</div>
                </div>
              ))}
            </div>
          )}

          {/* Volunteer */}
          {shouldShow("volunteer", pageLayout) && vis(sections.volunteer?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Volunteer</div>
              {vis(sections.volunteer?.items).map((vol, i) => (
                <div key={i} className="interest-item">{vol.organization}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footer-ornament">✦ ✦ ✦ ✦ ✦</div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 18 — Medical Clean
// ---------------------------------------------------------------------------

function renderTemplate18(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <div className="header">
          <div>
            <div className="name">{basics.name}</div>
            <div className="credentials">{basics.headline}</div>
            <div className="role">{basics.headline}</div>
          </div>
          <div className="contact-card">
            {basics.email && (
              <div className="cc-item">
                {Icons.email}
                {basics.email}
              </div>
            )}
            {basics.phone && (
              <div className="cc-item">
                {Icons.phone}
                {basics.phone}
              </div>
            )}
            {basics.location && (
              <div className="cc-item">
                {Icons.location}
                {basics.location}
              </div>
            )}
            {basics.linkedin && (
              <div className="cc-item">
                {Icons.linkedin}
                {basics.linkedin}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="body">
        {/* Main */}
        <div className="main">
          {/* Profile */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">
                {Icons.cert}
                Profile
              </div>
              <div className="summary">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                {Icons.briefcase}
                Clinical Experience
              </div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-top">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    {desc.length > 0 && (
                      <div className="exp-desc">
                        <ul>
                          {desc.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                {Icons.education}
                Education
              </div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-item">
                  <div className="edu-degree">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}

          {/* Publications / Projects */}
          {shouldShow("projects", pageLayout) && vis(sections.projects?.items).length > 0 && (
            <div className="section">
              <div className="section-title">
                {Icons.briefcase}
                Key Publications
              </div>
              {vis(sections.projects?.items).map((proj, i) => (
                <div key={i} className="pub-item">
                  <strong>{proj.name}</strong> — {proj.description}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Clinical Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Clinical Skills</div>
              {vis(sections.skills?.items).map((skill, i) => (
                <div key={i} className="skill-item">{skill.name}</div>
              ))}
            </div>
          )}

          {/* Licenses / Certifications */}
          {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Licenses</div>
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="license-item">
                  <div className="license-name">{cert.name}</div>
                  <div className="license-detail">{cert.issuer}{cert.year && `, ${cert.year}`}</div>
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Languages</div>
              {vis(sections.languages?.items).map((lang, i) => (
                <div key={i} className="lang-row">
                  <span className="lang-name">{lang.name}</span>
                  <span className="lang-level">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          )}

          {/* Affiliations / Awards */}
          {shouldShow("awards", pageLayout) && vis(sections.awards?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Affiliations</div>
              {vis(sections.awards?.items).map((award, i) => (
                <div key={i} className="affil-item">{award.title}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 19 — Neon Glass
// ---------------------------------------------------------------------------

function renderTemplate19(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <div className="header">
          <div className="header-flex">
            <div>
              <div className="name">{basics.name}</div>
              <div className="role">{basics.headline}</div>
            </div>
            <div className="contact-list">
              {basics.email && <div className="contact-item"><span>→</span> {basics.email}</div>}
              {basics.phone && <div className="contact-item"><span>→</span> {basics.phone}</div>}
              {basics.location && <div className="contact-item"><span>→</span> {basics.location}</div>}
              {basics.linkedin && <div className="contact-item"><span>→</span> {basics.linkedin}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="body">
        {/* Main */}
        <div className="main">
          {/* Profile */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">Profile</div>
              <div className="summary">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Experience</div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-card glass">
                    <div className="exp-top">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    {desc.length > 0 && <div className="exp-desc">{desc.join(". ")}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Education</div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-card glass">
                  <div className="edu-degree">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="glass">
          <div className="sidebar-inner">
            {/* Skills */}
            {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
              <div className="sb-section">
                <div className="sb-title">Skills</div>
                <div className="skill-pills">
                  {vis(sections.skills?.items).map((skill, i) => (
                    <span key={i} className="skill-pill">{skill.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
              <div className="sb-section">
                <div className="sb-title">Languages</div>
                {vis(sections.languages?.items).map((lang, i) => (
                  <div key={i} className="lang-item">
                    <span className="lang-name">{lang.name}</span>
                    <span className="lang-level">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
              <div className="sb-section">
                <div className="sb-title">Certifications</div>
                {vis(sections.certifications?.items).map((cert, i) => (
                  <div key={i} className="cert-item">
                    <div className="cert-name">{cert.name}</div>
                    <div className="cert-org">{cert.issuer}{cert.year && `, ${cert.year}`}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Volunteer */}
            {shouldShow("volunteer", pageLayout) && vis(sections.volunteer?.items).length > 0 && (
              <div className="sb-section">
                <div className="sb-title">Volunteer</div>
                {vis(sections.volunteer?.items).map((vol, i) => (
                  <div key={i} className="cert-item">
                    <div className="cert-name">{vol.role}</div>
                    <div className="cert-org">{vol.organization}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template 20 — Corporate Stripe
// ---------------------------------------------------------------------------

function renderTemplate20(
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
): React.ReactNode {
  const { basics, sections } = resume;

  return (
    <>
      {/* Left Stripe */}
      <div className="left-stripe" />

      {/* Header — only on page 0 */}
      {pageIndex === 0 && (
        <div className="header">
          <div>
            <div className="name">{basics.name}</div>
            <div className="role">{basics.headline}</div>
          </div>
          <div className="contact-col">
            {basics.email && (
              <div className="contact-item">
                {Icons.email}
                {basics.email}
              </div>
            )}
            {basics.phone && (
              <div className="contact-item">
                {Icons.phone}
                {basics.phone}
              </div>
            )}
            {basics.location && (
              <div className="contact-item">
                {Icons.location}
                {basics.location}
              </div>
            )}
            {basics.linkedin && (
              <div className="contact-item">
                {Icons.linkedin}
                {basics.linkedin}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="body">
        {/* Main */}
        <div className="main">
          {/* Summary */}
          {shouldShow("summary", pageLayout) && sections.summary?.content && (
            <div className="section">
              <div className="section-title">Executive Summary</div>
              <div className="summary">{sections.summary.content}</div>
            </div>
          )}

          {/* Experience */}
          {shouldShow("experience", pageLayout) && vis(sections.experience?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Professional Experience</div>
              {vis(sections.experience?.items).map((exp, i) => {
                const desc = bullets(exp.description);
                return (
                  <div key={i} className="exp-item">
                    <div className="exp-header">
                      <div className="exp-role">{exp.position}</div>
                      <div className="exp-date">{fmtDate(exp.startDate, exp.endDate, exp.isCurrent)}</div>
                    </div>
                    <div className="exp-company">{exp.company}{exp.location && ` — ${exp.location}`}</div>
                    {desc.length > 0 && (
                      <div className="exp-desc">
                        <ul>
                          {desc.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Education */}
          {shouldShow("education", pageLayout) && vis(sections.education?.items).length > 0 && (
            <div className="section">
              <div className="section-title">Education</div>
              {vis(sections.education?.items).map((edu, i) => (
                <div key={i} className="edu-item">
                  <div className="edu-degree">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                  <div className="edu-school">{edu.institution}</div>
                  <div className="edu-year">{edu.graduationYear}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Core Expertise / Skills */}
          {shouldShow("skills", pageLayout) && vis(sections.skills?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Core Expertise</div>
              {vis(sections.skills?.items).map((skill, i) => {
                const pct = skillLevel(skill.proficiency);
                const dots = Math.round(pct / 20);
                return (
                  <div key={i} className="skill-item">
                    <span>{skill.name}</span>
                    <div className="skill-dots">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div key={d} className={`skill-dot${d <= dots ? " active" : ""}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Languages */}
          {shouldShow("languages", pageLayout) && vis(sections.languages?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Languages</div>
              {vis(sections.languages?.items).map((lang, i) => (
                <div key={i} className="lang-item">
                  <span className="lang-name">{lang.name}</span>
                  <span className="lang-level">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bar Admissions / Certifications */}
          {shouldShow("certifications", pageLayout) && vis(sections.certifications?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Certifications</div>
              {vis(sections.certifications?.items).map((cert, i) => (
                <div key={i} className="cert-item">
                  <div className="cert-name">{cert.name}</div>
                  <div className="cert-org">{cert.issuer}{cert.year && `, ${cert.year}`}</div>
                </div>
              ))}
            </div>
          )}

          {/* Affiliations / Awards */}
          {shouldShow("awards", pageLayout) && vis(sections.awards?.items).length > 0 && (
            <div className="sb-section">
              <div className="sb-title">Affiliations</div>
              {vis(sections.awards?.items).map((award, i) => (
                <div key={i} className="affil-item">{award.title}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Template Render Function Registry
// ---------------------------------------------------------------------------

type TemplateRenderer = (
  resume: ResumeData,
  pageIndex: number,
  pageLayout: PageLayout
) => React.ReactNode;

// ---------------------------------------------------------------------------
// Extra Sections — comprehensive fallback renderer for ALL sections that
// a template's native JSX doesn't include. This ensures every single piece
// of user data always appears in the output, no matter which template is used.
// ---------------------------------------------------------------------------

// Templates that already render each section natively in their render function.
// If a template is NOT in a set, ExtraSections will render that section.

const TEMPLATES_WITH_PROJECTS = new Set<string>([
  "modern-minimalist", "corporate-executive", "elegant-sidebar",
  "dark-professional", "artistic-portfolio", "tech-modern",
  "newspaper-editorial", "medical-clean",
]);

const TEMPLATES_WITH_CERTIFICATIONS = new Set<string>([
  "modern-minimalist", "corporate-executive", "creative-bold",
  "elegant-sidebar", "infographic", "dark-professional",
  "gradient-creative", "classic-corporate", "tech-modern",
  "swiss-typographic", "brutalist-mono", "pastel-soft",
  "split-duotone", "architecture-blueprint", "retro-vintage",
  "medical-clean", "neon-glass", "corporate-stripe",
]);

const TEMPLATES_WITH_LANGUAGES = new Set<string>([
  "modern-minimalist", "corporate-executive", "creative-bold",
  "elegant-sidebar", "infographic", "dark-professional",
  "gradient-creative", "classic-corporate",
  "swiss-typographic", "newspaper-editorial", "brutalist-mono",
  "pastel-soft", "split-duotone", "retro-vintage",
  "medical-clean", "neon-glass", "corporate-stripe",
]);

const TEMPLATES_WITH_VOLUNTEER = new Set<string>([
  "gradient-creative", "artistic-portfolio", "swiss-typographic",
  "pastel-soft", "split-duotone", "retro-vintage", "neon-glass",
]);

const TEMPLATES_WITH_AWARDS = new Set<string>([
  "corporate-executive", "creative-bold", "artistic-portfolio",
  "newspaper-editorial", "medical-clean", "corporate-stripe",
]);

// No template natively renders references — always falls through to ExtraSections

function ExtraSections({
  resume,
  pageLayout,
  templateId,
}: {
  resume: ResumeData;
  pageLayout: PageLayout;
  templateId: string;
}): React.ReactNode {
  const { sections } = resume;
  const customSections = resume.customSections ?? [];

  // Determine which sections need fallback rendering
  const showProjects =
    !TEMPLATES_WITH_PROJECTS.has(templateId) &&
    shouldShow("projects", pageLayout) &&
    vis(sections.projects?.items).length > 0;

  const showCertifications =
    !TEMPLATES_WITH_CERTIFICATIONS.has(templateId) &&
    shouldShow("certifications", pageLayout) &&
    vis(sections.certifications?.items).length > 0;

  const showLanguages =
    !TEMPLATES_WITH_LANGUAGES.has(templateId) &&
    shouldShow("languages", pageLayout) &&
    vis(sections.languages?.items).length > 0;

  const showVolunteer =
    !TEMPLATES_WITH_VOLUNTEER.has(templateId) &&
    shouldShow("volunteer", pageLayout) &&
    vis(sections.volunteer?.items).length > 0;

  const showAwards =
    !TEMPLATES_WITH_AWARDS.has(templateId) &&
    shouldShow("awards", pageLayout) &&
    vis(sections.awards?.items).length > 0;

  const showReferences =
    shouldShow("references", pageLayout) &&
    vis(sections.references?.items).length > 0;

  // Custom sections: always render (no template natively handles them)
  const visibleCustom = customSections.filter(
    (cs) => !cs.hidden && cs.items?.length > 0 && shouldShow(cs.id, pageLayout)
  );

  const hasAnything =
    showProjects || showCertifications || showLanguages ||
    showVolunteer || showAwards || showReferences ||
    visibleCustom.length > 0;

  if (!hasAnything) return null;

  return (
    <div style={{ padding: "0 30px 24px" }}>
      {/* Projects */}
      {showProjects && (
        <div className="section">
          <div className="section-title">
            {sections.projects.title || "Projects"}
          </div>
          {vis(sections.projects.items).map((p, i) => (
            <div key={i} className="exp-item project-item">
              <div className="exp-header">
                <div className="exp-role">{p.name}</div>
              </div>
              {p.description && (
                <div className="exp-desc">
                  {bullets(p.description).map((b, j) => (
                    <div key={j} style={{ paddingLeft: 12, textIndent: -12 }}>• {b}</div>
                  ))}
                </div>
              )}
              {p.url && (
                <div className="exp-desc" style={{ opacity: 0.7, fontSize: "0.85em" }}>
                  {p.url}
                </div>
              )}
              {p.keywords && p.keywords.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {p.keywords.map((kw, j) => (
                    <span key={j} style={{
                      fontSize: "0.75em",
                      padding: "2px 8px",
                      borderRadius: 3,
                      backgroundColor: "rgba(0,0,0,0.06)",
                    }}>{kw}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {showCertifications && (
        <div className="section">
          <div className="section-title">
            {sections.certifications.title || "Certifications"}
          </div>
          {vis(sections.certifications.items).map((c, i) => (
            <div key={i} className="exp-item cert-item">
              <div className="exp-header">
                <div className="exp-role">{c.name}</div>
                {c.year && <div className="exp-date">{c.year}</div>}
              </div>
              {c.issuer && <div className="exp-company">{c.issuer}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {showLanguages && (
        <div className="section">
          <div className="section-title">
            {sections.languages.title || "Languages"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
            {vis(sections.languages.items).map((l, i) => (
              <div key={i} className="lang-item" style={{ minWidth: 120 }}>
                <span style={{ fontWeight: 600 }}>{l.name}</span>
                {l.proficiency && (
                  <span style={{ opacity: 0.7, marginLeft: 6, fontSize: "0.9em" }}>
                    — {l.proficiency}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volunteer */}
      {showVolunteer && (
        <div className="section">
          <div className="section-title">
            {sections.volunteer.title || "Volunteer Experience"}
          </div>
          {vis(sections.volunteer.items).map((v, i) => (
            <div key={i} className="exp-item volunteer-item">
              <div className="exp-header">
                <div className="exp-role">{v.role}</div>
                <div className="exp-date">
                  {fmtDate(v.startDate, v.endDate)}
                </div>
              </div>
              <div className="exp-company">{v.organization}</div>
              {v.description && (
                <div className="exp-desc">{v.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Awards */}
      {showAwards && (
        <div className="section">
          <div className="section-title">
            {sections.awards.title || "Awards"}
          </div>
          {vis(sections.awards.items).map((a, i) => (
            <div key={i} className="exp-item award-item">
              <div className="exp-header">
                <div className="exp-role">{a.title}</div>
                <div className="exp-date">{a.date}</div>
              </div>
              {a.issuer && (
                <div className="exp-company">{a.issuer}</div>
              )}
              {a.description && (
                <div className="exp-desc">{a.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* References */}
      {showReferences && (
        <div className="section">
          <div className="section-title">
            {sections.references.title || "References"}
          </div>
          {vis(sections.references.items).map((r, i) => (
            <div key={i} className="exp-item reference-item" style={{ marginBottom: 8 }}>
              <div className="exp-header">
                <div className="exp-role">{r.name}</div>
              </div>
              {r.relationship && (
                <div className="exp-company">{r.relationship}</div>
              )}
              {r.description && (
                <div className="exp-desc">{r.description}</div>
              )}
              {(r.email || r.phone) && (
                <div
                  className="exp-desc"
                  style={{ opacity: 0.8, fontSize: "0.9em" }}
                >
                  {r.email}
                  {r.email && r.phone ? " · " : ""}
                  {r.phone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom Sections */}
      {visibleCustom.map((cs) => (
        <div key={cs.id} className="section">
          <div className="section-title">{cs.title}</div>
          {cs.items.filter((it) => !it.hidden).map((item, i) => (
            <div key={i} className="exp-item custom-item">
              <div className="exp-header">
                {item.title && <div className="exp-role">{item.title}</div>}
                {item.date && <div className="exp-date">{item.date}</div>}
              </div>
              {item.subtitle && <div className="exp-company">{item.subtitle}</div>}
              {item.description && (
                <div className="exp-desc">{item.description}</div>
              )}
              {item.url && (
                <div className="exp-desc" style={{ opacity: 0.7, fontSize: "0.85em" }}>
                  {item.url}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template Renderers Registry
// ---------------------------------------------------------------------------

const TEMPLATE_RENDERERS: Record<TemplateId, TemplateRenderer> = {
  // Pro templates
  "modern-minimalist": renderTemplate01,
  "corporate-executive": renderTemplate02,
  "creative-bold": renderTemplate03,
  "elegant-sidebar": renderTemplate04,
  infographic: renderTemplate05,
  "dark-professional": renderTemplate06,
  "gradient-creative": renderTemplate07,
  "classic-corporate": renderTemplate08,
  "artistic-portfolio": renderTemplate09,
  "tech-modern": renderTemplate10,
  "swiss-typographic": renderTemplate11,
  "newspaper-editorial": renderTemplate12,
  "brutalist-mono": renderTemplate13,
  "pastel-soft": renderTemplate14,
  "split-duotone": renderTemplate15,
  "architecture-blueprint": renderTemplate16,
  "retro-vintage": renderTemplate17,
  "medical-clean": renderTemplate18,
  "neon-glass": renderTemplate19,
  "corporate-stripe": renderTemplate20,
};

// ---------------------------------------------------------------------------
// Universal Template Component
// ---------------------------------------------------------------------------

export default function UniversalTemplate({
  resume,
  pageIndex,
  pageLayout,
}: TemplateProps): React.ReactElement {
  const templateId = resume.metadata.template;
  const def = getProTemplate(templateId);
  const css = TEMPLATE_CSS[templateId] ?? "";

  // Get the renderer for this template
  const renderer = TEMPLATE_RENDERERS[templateId] ?? renderTemplate01;

  // Memoize the rendered content
  const content = useMemo(
    () => renderer(resume, pageIndex, pageLayout),
    [resume, pageIndex, pageLayout, renderer]
  );

  return (
    <div
      data-template={templateId}
      style={{
        fontFamily: def?.bodyFont ?? "inherit",
        width: "100%",
        minHeight: "100%",
      }}
    >
      {/* Inject scoped CSS */}
      <style>{css}</style>
      {content}
      {/* Render volunteer/awards/references for templates that don't handle them */}
      <ExtraSections
        resume={resume}
        pageLayout={pageLayout}
        templateId={templateId}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Factory Function — creates a component for a specific template
// ---------------------------------------------------------------------------

export function createProTemplateComponent(
  templateId: TemplateId
): React.ComponentType<TemplateProps> {
  const TemplateComponent = (props: TemplateProps) => {
    return <UniversalTemplate {...props} />;
  };
  TemplateComponent.displayName = `ProTemplate_${templateId}`;
  return TemplateComponent;
}
