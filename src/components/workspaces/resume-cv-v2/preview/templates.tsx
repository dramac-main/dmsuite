"use client";
/**
 * Resume V2 Templates — 13 templates adapted from Reactive Resume v5
 * Each template renders a single page's layout (main + sidebar columns)
 */
import React from "react";
import { useResumeV2Editor } from "@/stores/resume-v2-editor";
import type { PageLayout } from "@/lib/resume-v2/schema";
import {
  PagePicture,
  PageSummary,
  PageLink,
  PageIcon,
  TiptapContent,
  LinkedTitle,
  getSectionComponent,
} from "./shared";

/* ═══════════════════════════════════════════════════════
   Template Props
   ═══════════════════════════════════════════════════════ */
export interface TemplateProps {
  pageIndex: number;
  pageLayout: PageLayout;
}

/* ─── Helper: Render a column of sections ─────────── */
function RenderColumn({ sections }: { sections: string[] }) {
  return (
    <>
      {sections.map((key) => {
        const Component = getSectionComponent(key);
        if (!Component) return null;
        return <Component key={key} />;
      })}
    </>
  );
}

/* ─── Helper: Header Block (basics) ────────────────── */
function BasicHeader({ showPicture = true }: { showPicture?: boolean }) {
  const basics = useResumeV2Editor((s) => s.resume.basics);

  return (
    <div className="rv2-header">
      <div className="flex items-start gap-4">
        {showPicture && <PagePicture />}
        <div className="flex-1">
          {basics.name && (
            <h1
              className="rv2-name text-[length:calc(var(--page-heading-font-size)*1.5)] font-[var(--page-heading-font-weight-bold)] leading-tight"
              style={{ fontFamily: "var(--page-heading-font-family)" }}
            >
              {basics.name}
            </h1>
          )}
          {basics.headline && (
            <div className="mt-0.5 text-[color:var(--page-primary-color)]">
              {basics.headline}
            </div>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.85em] opacity-80">
            {basics.email && (
              <span className="flex items-center gap-1">
                <PageIcon iconName="envelope-simple" size={12} />
                <a href={`mailto:${basics.email}`}>{basics.email}</a>
              </span>
            )}
            {basics.phone && (
              <span className="flex items-center gap-1">
                <PageIcon iconName="phone" size={12} />
                {basics.phone}
              </span>
            )}
            {basics.location && (
              <span className="flex items-center gap-1">
                <PageIcon iconName="map-pin" size={12} />
                {basics.location}
              </span>
            )}
            {basics.website?.url && (
              <span className="flex items-center gap-1">
                <PageIcon iconName="globe" size={12} />
                <PageLink url={basics.website.url} label={basics.website.label || basics.website.url} />
              </span>
            )}
            {basics.customFields
              ?.filter((f: { id: string; icon: string; text: string; link: string }) => f.text)
              .map((f: { id: string; icon: string; text: string; link: string }) => (
                <span key={f.id} className="flex items-center gap-1">
                  <PageIcon iconName={f.icon} size={12} />
                  {f.link ? <PageLink url={f.link} label={f.text} /> : <span>{f.text}</span>}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ONYX — Classic single-column with optional sidebar
   ═══════════════════════════════════════════════════════ */
export function Onyx({ pageIndex, pageLayout }: TemplateProps) {
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content">
      {pageIndex === 0 && <BasicHeader />}
      <div className={hasSidebar ? "flex gap-[var(--page-gap-x)]" : ""}>
        <div className={hasSidebar ? "flex-1" : ""}>
          <div className="space-y-[var(--page-gap-y)]">
            {pageIndex === 0 && (
              <PageSummary />
            )}
            <RenderColumn sections={pageLayout.main} />
          </div>
        </div>
        {hasSidebar && (
          <div style={{ width: "var(--page-sidebar-width)" }} className="shrink-0">
            <div className="space-y-[var(--page-gap-y)]">
              <RenderColumn sections={pageLayout.sidebar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PIKACHU — Colored header bar with sidebar
   ═══════════════════════════════════════════════════════ */
export function Pikachu({ pageIndex, pageLayout }: TemplateProps) {
  const basics = useResumeV2Editor((s) => s.resume.basics);
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content">
      {pageIndex === 0 && (
        <div
          className="-mx-[var(--page-margin-x)] -mt-[var(--page-margin-y)] mb-4 px-[var(--page-margin-x)] py-6"
          style={{ backgroundColor: "var(--page-primary-color)", color: "var(--page-background-color)" }}
        >
          <div className="flex items-center gap-4">
            <PagePicture />
            <div>
              {basics.name && (
                <h1
                  className="text-[length:calc(var(--page-heading-font-size)*1.8)] font-[var(--page-heading-font-weight-bold)] leading-tight"
                  style={{ fontFamily: "var(--page-heading-font-family)" }}
                >
                  {basics.name}
                </h1>
              )}
              {basics.headline && <div className="mt-1 opacity-90">{basics.headline}</div>}
            </div>
          </div>
          <ContactBar />
        </div>
      )}
      <div className={hasSidebar ? "flex gap-[var(--page-gap-x)]" : ""}>
        <div className={hasSidebar ? "flex-1" : ""}>
          <div className="space-y-[var(--page-gap-y)]">
            {pageIndex === 0 && <PageSummary />}
            <RenderColumn sections={pageLayout.main} />
          </div>
        </div>
        {hasSidebar && (
          <div style={{ width: "var(--page-sidebar-width)" }} className="shrink-0">
            <div className="space-y-[var(--page-gap-y)]">
              <RenderColumn sections={pageLayout.sidebar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shared ContactBar ─────────────────────────────── */
function ContactBar() {
  const basics = useResumeV2Editor((s) => s.resume.basics);
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.8em] opacity-90">
      {basics.email && <span>{basics.email}</span>}
      {basics.phone && <span>{basics.phone}</span>}
      {basics.location && <span>{basics.location}</span>}
      {basics.website?.url && <PageLink url={basics.website.url} label={basics.website.label || basics.website.url} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   GENGAR — Sidebar on left with dark background
   ═══════════════════════════════════════════════════════ */
export function Gengar({ pageIndex, pageLayout }: TemplateProps) {
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content flex">
      {hasSidebar && (
        <div
          className="-ml-[var(--page-margin-x)] -my-[var(--page-margin-y)] shrink-0 px-4 py-[var(--page-margin-y)]"
          style={{
            width: `calc(var(--page-sidebar-width) + var(--page-margin-x))`,
            backgroundColor: "var(--page-primary-color)",
            color: "var(--page-background-color)",
          }}
        >
          {pageIndex === 0 && (
            <div className="mb-4">
              <PagePicture className="mx-auto" />
            </div>
          )}
          <div className="space-y-[var(--page-gap-y)]">
            <RenderColumn sections={pageLayout.sidebar} />
          </div>
        </div>
      )}
      <div className="flex-1">
        {pageIndex === 0 && <BasicHeader showPicture={!hasSidebar} />}
        <div className="space-y-[var(--page-gap-y)]">
          {pageIndex === 0 && <PageSummary />}
          <RenderColumn sections={pageLayout.main} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   GLALIE — Heading underlines, clean lines
   ═══════════════════════════════════════════════════════ */
export function Glalie({ pageIndex, pageLayout }: TemplateProps) {
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content rv2-template-glalie">
      {pageIndex === 0 && <BasicHeader />}
      <div className={hasSidebar ? "flex gap-[var(--page-gap-x)]" : ""}>
        <div className={hasSidebar ? "flex-1" : ""}>
          <div className="space-y-[var(--page-gap-y)]">
            {pageIndex === 0 && <PageSummary />}
            <RenderColumn sections={pageLayout.main} />
          </div>
        </div>
        {hasSidebar && (
          <div style={{ width: "var(--page-sidebar-width)" }} className="shrink-0">
            <div className="space-y-[var(--page-gap-y)]">
              <RenderColumn sections={pageLayout.sidebar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AZURILL — Centered name, two-column below
   ═══════════════════════════════════════════════════════ */
export function Azurill({ pageIndex, pageLayout }: TemplateProps) {
  const basics = useResumeV2Editor((s) => s.resume.basics);
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content">
      {pageIndex === 0 && (
        <div className="mb-4 text-center">
          <PagePicture className="mx-auto mb-2" />
          {basics.name && (
            <h1
              className="text-[length:calc(var(--page-heading-font-size)*1.6)] font-[var(--page-heading-font-weight-bold)] leading-tight"
              style={{ fontFamily: "var(--page-heading-font-family)" }}
            >
              {basics.name}
            </h1>
          )}
          {basics.headline && (
            <div className="mt-0.5 text-[color:var(--page-primary-color)]">{basics.headline}</div>
          )}
          <div className="mt-1.5 flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[0.85em] opacity-80">
            {basics.email && <span>{basics.email}</span>}
            {basics.phone && <span>{basics.phone}</span>}
            {basics.location && <span>{basics.location}</span>}
            {basics.website?.url && <PageLink url={basics.website.url} label={basics.website.label || basics.website.url} />}
          </div>
        </div>
      )}
      <div className={hasSidebar ? "flex gap-[var(--page-gap-x)]" : ""}>
        <div className={hasSidebar ? "flex-1" : ""}>
          <div className="space-y-[var(--page-gap-y)]">
            {pageIndex === 0 && <PageSummary />}
            <RenderColumn sections={pageLayout.main} />
          </div>
        </div>
        {hasSidebar && (
          <div style={{ width: "var(--page-sidebar-width)" }} className="shrink-0">
            <div className="space-y-[var(--page-gap-y)]">
              <RenderColumn sections={pageLayout.sidebar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BRONZOR — Top accent line, compact header
   ═══════════════════════════════════════════════════════ */
export function Bronzor({ pageIndex, pageLayout }: TemplateProps) {
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content">
      {pageIndex === 0 && (
        <>
          <div
            className="-mx-[var(--page-margin-x)] -mt-[var(--page-margin-y)] mb-4 h-2"
            style={{ backgroundColor: "var(--page-primary-color)" }}
          />
          <BasicHeader />
        </>
      )}
      <div className={hasSidebar ? "flex gap-[var(--page-gap-x)]" : ""}>
        <div className={hasSidebar ? "flex-1" : ""}>
          <div className="space-y-[var(--page-gap-y)]">
            {pageIndex === 0 && <PageSummary />}
            <RenderColumn sections={pageLayout.main} />
          </div>
        </div>
        {hasSidebar && (
          <div style={{ width: "var(--page-sidebar-width)" }} className="shrink-0">
            <div className="space-y-[var(--page-gap-y)]">
              <RenderColumn sections={pageLayout.sidebar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CHIKORITA — Left accent bar, playful
   ═══════════════════════════════════════════════════════ */
export function Chikorita({ pageIndex, pageLayout }: TemplateProps) {
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content flex">
      <div
        className="-ml-[var(--page-margin-x)] -my-[var(--page-margin-y)] mr-4 w-2 shrink-0"
        style={{ backgroundColor: "var(--page-primary-color)" }}
      />
      <div className="flex-1">
        {pageIndex === 0 && <BasicHeader />}
        <div className={hasSidebar ? "flex gap-[var(--page-gap-x)]" : ""}>
          <div className={hasSidebar ? "flex-1" : ""}>
            <div className="space-y-[var(--page-gap-y)]">
              {pageIndex === 0 && <PageSummary />}
              <RenderColumn sections={pageLayout.main} />
            </div>
          </div>
          {hasSidebar && (
            <div style={{ width: "var(--page-sidebar-width)" }} className="shrink-0">
              <div className="space-y-[var(--page-gap-y)]">
                <RenderColumn sections={pageLayout.sidebar} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DITGAR — Full-width header bar, grid-based
   ═══════════════════════════════════════════════════════ */
export function Ditgar({ pageIndex, pageLayout }: TemplateProps) {
  const basics = useResumeV2Editor((s) => s.resume.basics);
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content">
      {pageIndex === 0 && (
        <div
          className="-mx-[var(--page-margin-x)] -mt-[var(--page-margin-y)] mb-4 px-[var(--page-margin-x)] py-5"
          style={{ backgroundColor: "var(--page-primary-color)", color: "var(--page-background-color)" }}
        >
          <div className="flex items-center gap-4">
            <PagePicture />
            <div className="flex-1">
              {basics.name && (
                <h1
                  className="text-[length:calc(var(--page-heading-font-size)*1.6)] font-[var(--page-heading-font-weight-bold)] leading-tight"
                  style={{ fontFamily: "var(--page-heading-font-family)" }}
                >
                  {basics.name}
                </h1>
              )}
              {basics.headline && <div className="mt-0.5 opacity-90">{basics.headline}</div>}
            </div>
          </div>
          <ContactBar />
        </div>
      )}
      <div className={hasSidebar ? "flex gap-[var(--page-gap-x)]" : ""}>
        <div className={hasSidebar ? "flex-1" : ""}>
          <div className="space-y-[var(--page-gap-y)]">
            {pageIndex === 0 && <PageSummary />}
            <RenderColumn sections={pageLayout.main} />
          </div>
        </div>
        {hasSidebar && (
          <div style={{ width: "var(--page-sidebar-width)" }} className="shrink-0">
            <div className="space-y-[var(--page-gap-y)]">
              <RenderColumn sections={pageLayout.sidebar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DITTO — Minimal, no decorations, typography-focused
   ═══════════════════════════════════════════════════════ */
export function Ditto({ pageIndex, pageLayout }: TemplateProps) {
  const basics = useResumeV2Editor((s) => s.resume.basics);
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content">
      {pageIndex === 0 && (
        <div className="mb-4">
          {basics.name && (
            <h1
              className="text-[length:calc(var(--page-heading-font-size)*1.8)] font-[var(--page-heading-font-weight-bold)] leading-tight"
              style={{ fontFamily: "var(--page-heading-font-family)" }}
            >
              {basics.name}
            </h1>
          )}
          {basics.headline && <div className="mt-0.5 text-[color:var(--page-primary-color)]">{basics.headline}</div>}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.85em] opacity-80">
            {basics.email && <span>{basics.email}</span>}
            {basics.phone && <span>{basics.phone}</span>}
            {basics.location && <span>{basics.location}</span>}
          </div>
        </div>
      )}
      <div className={hasSidebar ? "flex gap-[var(--page-gap-x)]" : ""}>
        <div className={hasSidebar ? "flex-1" : ""}>
          <div className="space-y-[var(--page-gap-y)]">
            {pageIndex === 0 && <PageSummary />}
            <RenderColumn sections={pageLayout.main} />
          </div>
        </div>
        {hasSidebar && (
          <div style={{ width: "var(--page-sidebar-width)" }} className="shrink-0">
            <div className="space-y-[var(--page-gap-y)]">
              <RenderColumn sections={pageLayout.sidebar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   KAKUNA — Boxed sections, subtle borders
   ═══════════════════════════════════════════════════════ */
export function Kakuna({ pageIndex, pageLayout }: TemplateProps) {
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content rv2-template-kakuna">
      {pageIndex === 0 && <BasicHeader />}
      <div className={hasSidebar ? "flex gap-[var(--page-gap-x)]" : ""}>
        <div className={hasSidebar ? "flex-1" : ""}>
          <div className="space-y-[var(--page-gap-y)]">
            {pageIndex === 0 && <PageSummary />}
            <RenderColumn sections={pageLayout.main} />
          </div>
        </div>
        {hasSidebar && (
          <div style={{ width: "var(--page-sidebar-width)" }} className="shrink-0">
            <div className="space-y-[var(--page-gap-y)]">
              <RenderColumn sections={pageLayout.sidebar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LAPRAS — Two-tone split: sidebar bg + main white
   ═══════════════════════════════════════════════════════ */
export function Lapras({ pageIndex, pageLayout }: TemplateProps) {
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content flex">
      {hasSidebar && (
        <div
          className="-ml-[var(--page-margin-x)] -my-[var(--page-margin-y)] shrink-0 px-4 py-[var(--page-margin-y)]"
          style={{
            width: `calc(var(--page-sidebar-width) + var(--page-margin-x))`,
            backgroundColor: "color-mix(in srgb, var(--page-primary-color) 10%, var(--page-background-color))",
          }}
        >
          {pageIndex === 0 && (
            <div className="mb-4">
              <PagePicture className="mx-auto" />
            </div>
          )}
          <div className="space-y-[var(--page-gap-y)]">
            <RenderColumn sections={pageLayout.sidebar} />
          </div>
        </div>
      )}
      <div className="flex-1">
        {pageIndex === 0 && <BasicHeader showPicture={!hasSidebar} />}
        <div className="space-y-[var(--page-gap-y)]">
          {pageIndex === 0 && <PageSummary />}
          <RenderColumn sections={pageLayout.main} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LEAFISH — Nature-inspired, rounded elements
   ═══════════════════════════════════════════════════════ */
export function Leafish({ pageIndex, pageLayout }: TemplateProps) {
  const basics = useResumeV2Editor((s) => s.resume.basics);
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content rv2-template-leafish">
      {pageIndex === 0 && (
        <div className="mb-4 flex items-center gap-4">
          <PagePicture className="rounded-full" />
          <div>
            {basics.name && (
              <h1
                className="text-[length:calc(var(--page-heading-font-size)*1.5)] font-[var(--page-heading-font-weight-bold)] leading-tight"
                style={{ fontFamily: "var(--page-heading-font-family)" }}
              >
                {basics.name}
              </h1>
            )}
            {basics.headline && (
              <div className="mt-0.5 rounded-full px-3 py-0.5 text-[0.85em]" style={{ backgroundColor: "color-mix(in srgb, var(--page-primary-color) 15%, transparent)" }}>
                {basics.headline}
              </div>
            )}
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.85em] opacity-80">
              {basics.email && <span>{basics.email}</span>}
              {basics.phone && <span>{basics.phone}</span>}
              {basics.location && <span>{basics.location}</span>}
            </div>
          </div>
        </div>
      )}
      <div className={hasSidebar ? "flex gap-[var(--page-gap-x)]" : ""}>
        <div className={hasSidebar ? "flex-1" : ""}>
          <div className="space-y-[var(--page-gap-y)]">
            {pageIndex === 0 && <PageSummary />}
            <RenderColumn sections={pageLayout.main} />
          </div>
        </div>
        {hasSidebar && (
          <div style={{ width: "var(--page-sidebar-width)" }} className="shrink-0">
            <div className="space-y-[var(--page-gap-y)]">
              <RenderColumn sections={pageLayout.sidebar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RHYHORN — Bold, geometric, big headings
   ═══════════════════════════════════════════════════════ */
export function Rhyhorn({ pageIndex, pageLayout }: TemplateProps) {
  const basics = useResumeV2Editor((s) => s.resume.basics);
  const hasSidebar = pageLayout.sidebar.length > 0;

  return (
    <div className="rv2-page-content rv2-template-rhyhorn">
      {pageIndex === 0 && (
        <div className="mb-4">
          <div className="flex items-end gap-4">
            <PagePicture />
            <div>
              {basics.name && (
                <h1
                  className="text-[length:calc(var(--page-heading-font-size)*2)] font-[var(--page-heading-font-weight-bold)] uppercase leading-none tracking-tight"
                  style={{ fontFamily: "var(--page-heading-font-family)" }}
                >
                  {basics.name}
                </h1>
              )}
              {basics.headline && (
                <div className="mt-1 text-[length:calc(var(--page-body-font-size)*1.1)] uppercase tracking-widest text-[color:var(--page-primary-color)]">
                  {basics.headline}
                </div>
              )}
            </div>
          </div>
          <div
            className="mt-3 h-px w-full"
            style={{ backgroundColor: "var(--page-primary-color)" }}
          />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[0.8em] opacity-80">
            {basics.email && <span>{basics.email}</span>}
            {basics.phone && <span>{basics.phone}</span>}
            {basics.location && <span>{basics.location}</span>}
            {basics.website?.url && <PageLink url={basics.website.url} label={basics.website.label || basics.website.url} />}
          </div>
        </div>
      )}
      <div className={hasSidebar ? "flex gap-[var(--page-gap-x)]" : ""}>
        <div className={hasSidebar ? "flex-1" : ""}>
          <div className="space-y-[var(--page-gap-y)]">
            {pageIndex === 0 && <PageSummary />}
            <RenderColumn sections={pageLayout.main} />
          </div>
        </div>
        {hasSidebar && (
          <div style={{ width: "var(--page-sidebar-width)" }} className="shrink-0">
            <div className="space-y-[var(--page-gap-y)]">
              <RenderColumn sections={pageLayout.sidebar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Template Registry
   ═══════════════════════════════════════════════════════ */
import type { Template } from "@/lib/resume-v2/schema";

const TEMPLATE_MAP: Record<Template, React.ComponentType<TemplateProps>> = {
  onyx: Onyx,
  azurill: Azurill,
  bronzor: Bronzor,
  chikorita: Chikorita,
  ditgar: Ditgar,
  ditto: Ditto,
  gengar: Gengar,
  glalie: Glalie,
  kakuna: Kakuna,
  lapras: Lapras,
  leafish: Leafish,
  pikachu: Pikachu,
  rhyhorn: Rhyhorn,
};

export function getTemplateComponent(template: Template): React.ComponentType<TemplateProps> {
  return TEMPLATE_MAP[template] ?? Onyx;
}
