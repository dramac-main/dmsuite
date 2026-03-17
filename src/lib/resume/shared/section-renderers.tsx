// =============================================================================
// DMSuite — Resume Shared Section Renderers
// Reusable components consumed by ALL templates. Templates only define layout;
// these components handle content rendering with CSS custom properties.
// =============================================================================

"use client";

import React from "react";
import type {
  ResumeData,
  Basics,
  Summary,
  ExperienceItem,
  EducationItem,
  SkillItem,
  CertificationItem,
  LanguageItem,
  VolunteerItem,
  ProjectItem,
  AwardItem,
  ReferenceItem,
  CustomSection,
  CustomSectionItem,
  Sections,
} from "@/lib/resume/schema";
import { isBuiltInSection, type BuiltInSectionId } from "@/lib/resume/schema";

// ---------------------------------------------------------------------------
// PageHeader — rendered on first page only
// ---------------------------------------------------------------------------

interface PageHeaderProps {
  basics: Basics;
  /** Template-specific header variant */
  variant?: "centered" | "left" | "split";
}

export function PageHeader({ basics, variant = "left" }: PageHeaderProps) {
  const alignClass = variant === "centered"
    ? "text-center"
    : variant === "split"
    ? "flex flex-wrap items-start justify-between gap-2"
    : "text-left";

  return (
    <header className={`mb-[var(--page-gap-y)] ${alignClass}`}>
      <div className={variant === "split" ? "flex-1" : ""}>
        <h1
          className="font-[var(--page-heading-font-family)] text-[calc(var(--page-heading-font-size)*2)] font-[var(--page-heading-font-weight)] leading-tight text-[var(--page-text-color)]"
          style={{
            fontFamily: "var(--page-heading-font-family)",
            fontSize: "calc(var(--page-heading-font-size) * 2)",
            fontWeight: "var(--page-heading-font-weight)" as unknown as number,
            color: "var(--page-text-color)",
          }}
        >
          {basics.name}
        </h1>
        {basics.headline && (
          <p
            className="mt-0.5"
            style={{
              fontFamily: "var(--page-body-font-family)",
              fontSize: "calc(var(--page-heading-font-size) * 0.85)",
              color: "var(--page-primary-color)",
            }}
          >
            {basics.headline}
          </p>
        )}
      </div>

      <div
        className={`mt-1 flex flex-wrap gap-x-3 gap-y-0.5 ${variant === "centered" ? "justify-center" : ""}`}
        style={{
          fontFamily: "var(--page-body-font-family)",
          fontSize: "var(--page-body-font-size)",
          color: "var(--page-text-color)",
          opacity: 0.75,
        }}
      >
        {basics.email && <ContactItem text={basics.email} />}
        {basics.phone && <ContactItem text={basics.phone} />}
        {basics.location && <ContactItem text={basics.location} />}
        {basics.linkedin && <ContactItem text={basics.linkedin} />}
        {basics.website?.url && (
          <ContactItem text={basics.website.label || basics.website.url} />
        )}
      </div>
    </header>
  );
}

function ContactItem({ text }: { text: string }) {
  return (
    <span className="whitespace-nowrap">
      {text}
    </span>
  );
}

// ---------------------------------------------------------------------------
// SectionHeading — styled heading for each section
// ---------------------------------------------------------------------------

interface SectionHeadingProps {
  title: string;
  /** Decoration style, varies per template */
  decoration?: "underline" | "bar" | "none";
}

export function SectionHeading({ title, decoration = "underline" }: SectionHeadingProps) {
  return (
    <div className="mb-[calc(var(--page-gap-y)*0.5)]">
      <h2
        style={{
          fontFamily: "var(--page-heading-font-family)",
          fontSize: "var(--page-heading-font-size)",
          fontWeight: "var(--page-heading-font-weight)" as unknown as number,
          color: "var(--page-text-color)",
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h2>
      {decoration === "underline" && (
        <div
          className="mt-0.5"
          style={{
            height: "var(--section-border-width)",
            backgroundColor: "var(--section-border-color)",
            opacity: 0.4,
          }}
        />
      )}
      {decoration === "bar" && (
        <div
          className="mt-0.5"
          style={{
            height: "3px",
            width: "40px",
            backgroundColor: "var(--page-primary-color)",
            borderRadius: "2px",
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionRenderer — dispatches to the correct content renderer
// ---------------------------------------------------------------------------

interface SectionRendererProps {
  sectionId: string;
  resume: ResumeData;
  decoration?: "underline" | "bar" | "none";
}

export function SectionRenderer({ sectionId, resume, decoration }: SectionRendererProps) {
  if (isBuiltInSection(sectionId)) {
    return (
      <BuiltInSectionContent
        sectionId={sectionId}
        sections={resume.sections}
        decoration={decoration}
      />
    );
  }

  // Custom section
  const custom = resume.customSections.find((cs) => cs.id === sectionId);
  if (!custom || custom.hidden) return null;

  return (
    <div className="mb-[var(--page-gap-y)]">
      <SectionHeading title={custom.title} decoration={decoration} />
      {custom.items.filter((i) => !i.hidden).map((item) => (
        <CustomSectionItemContent key={item.id} item={item} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Built-in section content
// ---------------------------------------------------------------------------

function BuiltInSectionContent({
  sectionId,
  sections,
  decoration,
}: {
  sectionId: BuiltInSectionId;
  sections: Sections;
  decoration?: "underline" | "bar" | "none";
}) {
  const section = sections[sectionId];
  if (!section || section.hidden) return null;

  switch (sectionId) {
    case "summary":
      return <SummaryContent summary={section as Summary} decoration={decoration} />;
    case "experience":
      return <ExperienceContent section={section as Sections["experience"]} decoration={decoration} />;
    case "education":
      return <EducationContent section={section as Sections["education"]} decoration={decoration} />;
    case "skills":
      return <SkillsContent section={section as Sections["skills"]} decoration={decoration} />;
    case "certifications":
      return <CertificationsContent section={section as Sections["certifications"]} decoration={decoration} />;
    case "languages":
      return <LanguagesContent section={section as Sections["languages"]} decoration={decoration} />;
    case "volunteer":
      return <VolunteerContent section={section as Sections["volunteer"]} decoration={decoration} />;
    case "projects":
      return <ProjectsContent section={section as Sections["projects"]} decoration={decoration} />;
    case "awards":
      return <AwardsContent section={section as Sections["awards"]} decoration={decoration} />;
    case "references":
      return <ReferencesContent section={section as Sections["references"]} decoration={decoration} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function SummaryContent({ summary, decoration }: { summary: Summary; decoration?: "underline" | "bar" | "none" }) {
  if (!summary.content) return null;
  return (
    <div className="mb-[var(--page-gap-y)]">
      <SectionHeading title={summary.title || "Professional Summary"} decoration={decoration} />
      <p
        style={{
          fontFamily: "var(--page-body-font-family)",
          fontSize: "var(--page-body-font-size)",
          lineHeight: "var(--page-body-line-height)",
          color: "var(--page-text-color)",
        }}
      >
        {summary.content}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------

function ExperienceContent({ section, decoration }: { section: Sections["experience"]; decoration?: "underline" | "bar" | "none" }) {
  const visible = section.items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <div className="mb-[var(--page-gap-y)]">
      <SectionHeading title={section.title || "Work Experience"} decoration={decoration} />
      <div className="flex flex-col" style={{ gap: "calc(var(--page-gap-y) * 0.75)" }}>
        {visible.map((item) => (
          <ExperienceItemContent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ExperienceItemContent({ item }: { item: ExperienceItem }) {
  const dateRange = [item.startDate, item.isCurrent ? "Present" : item.endDate]
    .filter(Boolean)
    .join(" - ");

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <strong
            style={{
              fontFamily: "var(--page-body-font-family)",
              fontSize: "calc(var(--page-body-font-size) * 1.05)",
              fontWeight: 600,
              color: "var(--page-text-color)",
            }}
          >
            {item.position}
          </strong>
          {item.company && (
            <span
              style={{
                fontFamily: "var(--page-body-font-family)",
                fontSize: "var(--page-body-font-size)",
                color: "var(--page-primary-color)",
              }}
            >
              {" "}at {item.company}
            </span>
          )}
        </div>
        {dateRange && (
          <span
            className="shrink-0"
            style={{
              fontFamily: "var(--page-body-font-family)",
              fontSize: "calc(var(--page-body-font-size) * 0.9)",
              color: "var(--page-text-color)",
              opacity: 0.6,
            }}
          >
            {dateRange}
          </span>
        )}
      </div>

      {item.location && (
        <p
          style={{
            fontFamily: "var(--page-body-font-family)",
            fontSize: "calc(var(--page-body-font-size) * 0.9)",
            color: "var(--page-text-color)",
            opacity: 0.5,
          }}
        >
          {item.location}
        </p>
      )}

      {item.description && (
        <DescriptionBlock text={item.description} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

function EducationContent({ section, decoration }: { section: Sections["education"]; decoration?: "underline" | "bar" | "none" }) {
  const visible = section.items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <div className="mb-[var(--page-gap-y)]">
      <SectionHeading title={section.title || "Education"} decoration={decoration} />
      <div className="flex flex-col" style={{ gap: "calc(var(--page-gap-y) * 0.5)" }}>
        {visible.map((item) => (
          <EducationItemContent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function EducationItemContent({ item }: { item: EducationItem }) {
  const degreeLine = [item.degree, item.field].filter(Boolean).join(" in ");

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <strong
          style={{
            fontFamily: "var(--page-body-font-family)",
            fontSize: "calc(var(--page-body-font-size) * 1.05)",
            fontWeight: 600,
            color: "var(--page-text-color)",
          }}
        >
          {degreeLine || item.institution}
        </strong>
        {item.graduationYear && (
          <span
            className="shrink-0"
            style={{
              fontFamily: "var(--page-body-font-family)",
              fontSize: "calc(var(--page-body-font-size) * 0.9)",
              color: "var(--page-text-color)",
              opacity: 0.6,
            }}
          >
            {item.graduationYear}
          </span>
        )}
      </div>
      {degreeLine && item.institution && (
        <p
          style={{
            fontFamily: "var(--page-body-font-family)",
            fontSize: "var(--page-body-font-size)",
            color: "var(--page-text-color)",
            opacity: 0.7,
          }}
        >
          {item.institution}
        </p>
      )}
      {item.description && <DescriptionBlock text={item.description} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

function SkillsContent({ section, decoration }: { section: Sections["skills"]; decoration?: "underline" | "bar" | "none" }) {
  const visible = section.items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <div className="mb-[var(--page-gap-y)]">
      <SectionHeading title={section.title || "Skills"} decoration={decoration} />
      <div className="flex flex-col" style={{ gap: "calc(var(--page-gap-y) * 0.3)" }}>
        {visible.map((item) => (
          <SkillItemContent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function SkillItemContent({ item }: { item: SkillItem }) {
  return (
    <div>
      {item.name && item.keywords.length > 0 && (
        <div>
          <strong
            style={{
              fontFamily: "var(--page-body-font-family)",
              fontSize: "var(--page-body-font-size)",
              fontWeight: 600,
              color: "var(--page-text-color)",
            }}
          >
            {item.name}:
          </strong>{" "}
          <span
            style={{
              fontFamily: "var(--page-body-font-family)",
              fontSize: "var(--page-body-font-size)",
              color: "var(--page-text-color)",
              opacity: 0.8,
            }}
          >
            {item.keywords.join(", ")}
          </span>
        </div>
      )}
      {!item.name && item.keywords.length > 0 && (
        <span
          style={{
            fontFamily: "var(--page-body-font-family)",
            fontSize: "var(--page-body-font-size)",
            color: "var(--page-text-color)",
            opacity: 0.8,
          }}
        >
          {item.keywords.join(", ")}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

function CertificationsContent({ section, decoration }: { section: Sections["certifications"]; decoration?: "underline" | "bar" | "none" }) {
  const visible = section.items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <div className="mb-[var(--page-gap-y)]">
      <SectionHeading title={section.title || "Certifications"} decoration={decoration} />
      <div className="flex flex-col" style={{ gap: "calc(var(--page-gap-y) * 0.3)" }}>
        {visible.map((item) => (
          <CertificationItemContent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function CertificationItemContent({ item }: { item: CertificationItem }) {
  return (
    <div
      style={{
        fontFamily: "var(--page-body-font-family)",
        fontSize: "var(--page-body-font-size)",
        color: "var(--page-text-color)",
      }}
    >
      <strong style={{ fontWeight: 600 }}>{item.name}</strong>
      {item.issuer && <span style={{ opacity: 0.7 }}> — {item.issuer}</span>}
      {item.year && <span style={{ opacity: 0.5 }}> ({item.year})</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------

function LanguagesContent({ section, decoration }: { section: Sections["languages"]; decoration?: "underline" | "bar" | "none" }) {
  const visible = section.items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <div className="mb-[var(--page-gap-y)]">
      <SectionHeading title={section.title || "Languages"} decoration={decoration} />
      <div className="flex flex-col" style={{ gap: "calc(var(--page-gap-y) * 0.2)" }}>
        {visible.map((item) => (
          <LanguageItemContent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function LanguageItemContent({ item }: { item: LanguageItem }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        fontFamily: "var(--page-body-font-family)",
        fontSize: "var(--page-body-font-size)",
        color: "var(--page-text-color)",
      }}
    >
      <span>{item.name}</span>
      <span style={{ opacity: 0.6, textTransform: "capitalize" as const }}>
        {item.proficiency}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Volunteer
// ---------------------------------------------------------------------------

function VolunteerContent({ section, decoration }: { section: Sections["volunteer"]; decoration?: "underline" | "bar" | "none" }) {
  const visible = section.items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <div className="mb-[var(--page-gap-y)]">
      <SectionHeading title={section.title || "Volunteer Experience"} decoration={decoration} />
      <div className="flex flex-col" style={{ gap: "calc(var(--page-gap-y) * 0.5)" }}>
        {visible.map((item) => (
          <VolunteerItemContent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function VolunteerItemContent({ item }: { item: VolunteerItem }) {
  const dateRange = [item.startDate, item.endDate].filter(Boolean).join(" - ");
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <strong
            style={{
              fontFamily: "var(--page-body-font-family)",
              fontSize: "calc(var(--page-body-font-size) * 1.05)",
              fontWeight: 600,
              color: "var(--page-text-color)",
            }}
          >
            {item.role}
          </strong>
          {item.organization && (
            <span
              style={{
                fontFamily: "var(--page-body-font-family)",
                fontSize: "var(--page-body-font-size)",
                color: "var(--page-primary-color)",
              }}
            >
              {" "}at {item.organization}
            </span>
          )}
        </div>
        {dateRange && (
          <span
            className="shrink-0"
            style={{
              fontSize: "calc(var(--page-body-font-size) * 0.9)",
              color: "var(--page-text-color)",
              opacity: 0.6,
            }}
          >
            {dateRange}
          </span>
        )}
      </div>
      {item.description && <DescriptionBlock text={item.description} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

function ProjectsContent({ section, decoration }: { section: Sections["projects"]; decoration?: "underline" | "bar" | "none" }) {
  const visible = section.items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <div className="mb-[var(--page-gap-y)]">
      <SectionHeading title={section.title || "Projects"} decoration={decoration} />
      <div className="flex flex-col" style={{ gap: "calc(var(--page-gap-y) * 0.5)" }}>
        {visible.map((item) => (
          <ProjectItemContent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ProjectItemContent({ item }: { item: ProjectItem }) {
  return (
    <div>
      <strong
        style={{
          fontFamily: "var(--page-body-font-family)",
          fontSize: "calc(var(--page-body-font-size) * 1.05)",
          fontWeight: 600,
          color: "var(--page-text-color)",
        }}
      >
        {item.name}
      </strong>
      {item.description && <DescriptionBlock text={item.description} />}
      {item.keywords.length > 0 && (
        <p
          style={{
            fontFamily: "var(--page-body-font-family)",
            fontSize: "calc(var(--page-body-font-size) * 0.85)",
            color: "var(--page-text-color)",
            opacity: 0.6,
            marginTop: "2px",
          }}
        >
          {item.keywords.join(" / ")}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Awards
// ---------------------------------------------------------------------------

function AwardsContent({ section, decoration }: { section: Sections["awards"]; decoration?: "underline" | "bar" | "none" }) {
  const visible = section.items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <div className="mb-[var(--page-gap-y)]">
      <SectionHeading title={section.title || "Awards"} decoration={decoration} />
      <div className="flex flex-col" style={{ gap: "calc(var(--page-gap-y) * 0.3)" }}>
        {visible.map((item) => (
          <AwardItemContent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function AwardItemContent({ item }: { item: AwardItem }) {
  return (
    <div
      style={{
        fontFamily: "var(--page-body-font-family)",
        fontSize: "var(--page-body-font-size)",
        color: "var(--page-text-color)",
      }}
    >
      <strong style={{ fontWeight: 600 }}>{item.title}</strong>
      {item.issuer && <span style={{ opacity: 0.7 }}> — {item.issuer}</span>}
      {item.date && <span style={{ opacity: 0.5 }}> ({item.date})</span>}
      {item.description && <DescriptionBlock text={item.description} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// References
// ---------------------------------------------------------------------------

function ReferencesContent({ section, decoration }: { section: Sections["references"]; decoration?: "underline" | "bar" | "none" }) {
  const visible = section.items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <div className="mb-[var(--page-gap-y)]">
      <SectionHeading title={section.title || "References"} decoration={decoration} />
      <div className="flex flex-col" style={{ gap: "calc(var(--page-gap-y) * 0.3)" }}>
        {visible.map((item) => (
          <ReferenceItemContent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ReferenceItemContent({ item }: { item: ReferenceItem }) {
  return (
    <div
      style={{
        fontFamily: "var(--page-body-font-family)",
        fontSize: "var(--page-body-font-size)",
        color: "var(--page-text-color)",
      }}
    >
      <strong style={{ fontWeight: 600 }}>{item.name}</strong>
      {item.relationship && <span style={{ opacity: 0.7 }}> — {item.relationship}</span>}
      {item.description && (
        <p style={{ opacity: 0.7, marginTop: "2px" }}>{item.description}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Section Item
// ---------------------------------------------------------------------------

function CustomSectionItemContent({ item }: { item: CustomSectionItem }) {
  return (
    <div className="mb-1">
      <div className="flex items-baseline justify-between gap-2">
        <strong
          style={{
            fontFamily: "var(--page-body-font-family)",
            fontSize: "calc(var(--page-body-font-size) * 1.05)",
            fontWeight: 600,
            color: "var(--page-text-color)",
          }}
        >
          {item.title}
        </strong>
        {item.date && (
          <span
            className="shrink-0"
            style={{
              fontSize: "calc(var(--page-body-font-size) * 0.9)",
              color: "var(--page-text-color)",
              opacity: 0.6,
            }}
          >
            {item.date}
          </span>
        )}
      </div>
      {item.subtitle && (
        <p
          style={{
            fontFamily: "var(--page-body-font-family)",
            fontSize: "var(--page-body-font-size)",
            color: "var(--page-primary-color)",
          }}
        >
          {item.subtitle}
        </p>
      )}
      {item.description && <DescriptionBlock text={item.description} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: DescriptionBlock — renders bullet points or paragraphs
// ---------------------------------------------------------------------------

function DescriptionBlock({ text }: { text: string }) {
  // Split by newlines and detect bullet points
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const hasBullets = lines.some((l) => /^\s*[-•*]\s/.test(l));

  if (hasBullets) {
    return (
      <ul
        className="mt-0.5 list-disc pl-4"
        style={{
          fontFamily: "var(--page-body-font-family)",
          fontSize: "var(--page-body-font-size)",
          lineHeight: "var(--page-body-line-height)",
          color: "var(--page-text-color)",
        }}
      >
        {lines.map((line, i) => (
          <li key={i}>{line.replace(/^\s*[-•*]\s*/, "")}</li>
        ))}
      </ul>
    );
  }

  return (
    <p
      className="mt-0.5"
      style={{
        fontFamily: "var(--page-body-font-family)",
        fontSize: "var(--page-body-font-size)",
        lineHeight: "var(--page-body-line-height)",
        color: "var(--page-text-color)",
      }}
    >
      {text}
    </p>
  );
}
