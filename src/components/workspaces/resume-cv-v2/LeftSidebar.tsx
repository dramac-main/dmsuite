"use client";
/**
 * Resume V2 — Left Sidebar Section Editors
 * All form sections for editing resume data (basics, summary, experience, etc.)
 * Field names match schema.ts exactly.
 */
import React, { useState } from "react";
import { useResumeV2Editor } from "@/stores/resume-v2-editor";
import { createId } from "@/lib/resume-v2/hooks";
import {
  LEFT_SIDEBAR_SECTIONS,
  getSectionTitle,
  type SectionType,
  type ExperienceItem,
  type EducationItem,
  type SkillItem,
  type LanguageItem,
  type ProfileItem,
  type ProjectItem,
  type AwardItem,
  type CertificationItem,
  type PublicationItem,
  type VolunteerItem,
  type ReferenceItem,
  type InterestItem,
} from "@/lib/resume-v2/schema";

/* ═══════════════════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════════════════ */

function SectionHeader({
  title,
  sectionKey,
  onAdd,
}: {
  title: string;
  sectionKey?: string;
  onAdd?: () => void;
}) {
  const toggleVisibility = useResumeV2Editor((s) => s.toggleSectionVisibility);

  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      <div className="flex items-center gap-1">
        {sectionKey && (
          <button
            onClick={() => toggleVisibility(sectionKey as SectionType)}
            className="rounded p-1 text-xs text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            title="Toggle visibility"
          >
            <i className="ph ph-eye text-sm" />
          </button>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            className="rounded p-1 text-xs text-primary-400 hover:bg-gray-700 hover:text-primary-300"
            title="Add item"
          >
            <i className="ph ph-plus text-sm" />
          </button>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs text-gray-400">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder = "",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-primary-500 focus:outline-none ${className}`}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder = "",
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-primary-500 focus:outline-none"
    />
  );
}

/* ─── Item Card for list sections ───────────────────── */
function ItemCard({
  children,
  title,
  onRemove,
  onToggle,
  hidden,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  title: string;
  onRemove: () => void;
  onToggle?: () => void;
  hidden?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-lg border border-gray-700 ${hidden ? "opacity-50" : ""}`}>
      <div
        className="flex cursor-pointer items-center justify-between px-3 py-2"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-gray-200 truncate">{title || "Untitled"}</span>
        <div className="flex items-center gap-1">
          {onToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="rounded p-0.5 text-gray-400 hover:text-gray-200"
              title={hidden ? "Show" : "Hide"}
            >
              <i className={`ph ph-${hidden ? "eye-slash" : "eye"} text-xs`} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="rounded p-0.5 text-red-400 hover:text-red-300"
            title="Remove"
          >
            <i className="ph ph-trash text-xs" />
          </button>
          <i className={`ph ph-caret-${open ? "up" : "down"} text-xs text-gray-400`} />
        </div>
      </div>
      {open && <div className="space-y-2 border-t border-gray-700 px-3 py-2">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Helpers: nested value read/write for dot-notation keys
   ═══════════════════════════════════════════════════════ */
function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function buildNestedUpdate(
  obj: Record<string, unknown>,
  key: string,
  value: unknown,
): Record<string, unknown> {
  const parts = key.split(".");
  if (parts.length === 1) return { [key]: value };
  // Support one-level nesting: "website.url" → { website: { ...existing, url: value } }
  const [parent, child] = parts;
  const existing = (obj[parent] ?? {}) as Record<string, unknown>;
  return { [parent]: { ...existing, [child]: value } };
}

/* ═══════════════════════════════════════════════════════
   PICTURE EDITOR
   ═══════════════════════════════════════════════════════ */
function PictureEditor() {
  const picture = useResumeV2Editor((s) => s.resume.picture);
  const updatePicture = useResumeV2Editor((s) => s.updatePicture);

  return (
    <div className="space-y-3">
      <SectionHeader title="Picture" />
      <FormField label="Image URL">
        <TextInput
          value={picture.url}
          onChange={(v) => updatePicture("url", v)}
          placeholder="https://example.com/photo.jpg"
        />
      </FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Size (pt)">
          <TextInput
            value={String(picture.size)}
            onChange={(v) => updatePicture("size", Number(v) || 64)}
          />
        </FormField>
        <FormField label="Border Radius (pt)">
          <TextInput
            value={String(picture.borderRadius)}
            onChange={(v) => updatePicture("borderRadius", Number(v) || 0)}
          />
        </FormField>
        <FormField label="Border Width">
          <TextInput
            value={String(picture.borderWidth)}
            onChange={(v) => updatePicture("borderWidth", Number(v) || 0)}
          />
        </FormField>
        <FormField label="Border Color">
          <input
            type="color"
            value={picture.borderColor}
            onChange={(e) => updatePicture("borderColor", e.target.value)}
            className="h-8 w-full cursor-pointer rounded border border-gray-600 bg-gray-800"
          />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={picture.hidden}
          onChange={(e) => updatePicture("hidden", e.target.checked)}
          className="rounded"
        />
        Hide picture
      </label>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BASICS EDITOR
   ═══════════════════════════════════════════════════════ */
function BasicsEditor() {
  const basics = useResumeV2Editor((s) => s.resume.basics);
  const updateBasics = useResumeV2Editor((s) => s.updateBasics);

  return (
    <div className="space-y-3">
      <SectionHeader title="Basics" />
      <FormField label="Full Name">
        <TextInput
          value={basics.name}
          onChange={(v) => updateBasics("name", v)}
          placeholder="John Doe"
        />
      </FormField>
      <FormField label="Headline">
        <TextInput
          value={basics.headline}
          onChange={(v) => updateBasics("headline", v)}
          placeholder="Full Stack Developer"
        />
      </FormField>
      <div className="grid grid-cols-2 gap-2">
        <FormField label="Email">
          <TextInput
            value={basics.email}
            onChange={(v) => updateBasics("email", v)}
            placeholder="john@example.com"
          />
        </FormField>
        <FormField label="Phone">
          <TextInput
            value={basics.phone}
            onChange={(v) => updateBasics("phone", v)}
            placeholder="+1 234 567 890"
          />
        </FormField>
      </div>
      <FormField label="Location">
        <TextInput
          value={basics.location}
          onChange={(v) => updateBasics("location", v)}
          placeholder="San Francisco, CA"
        />
      </FormField>
      <FormField label="Website URL">
        <TextInput
          value={basics.website?.url || ""}
          onChange={(v) => updateBasics("website.url", v)}
          placeholder="https://yoursite.com"
        />
      </FormField>
      <FormField label="Website Label">
        <TextInput
          value={basics.website?.label || ""}
          onChange={(v) => updateBasics("website.label", v)}
          placeholder="My Portfolio"
        />
      </FormField>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUMMARY EDITOR
   ═══════════════════════════════════════════════════════ */
function SummaryEditor() {
  const summary = useResumeV2Editor((s) => s.resume.summary);
  const updateSummary = useResumeV2Editor((s) => s.updateSummary);

  return (
    <div className="space-y-3">
      <SectionHeader title="Summary" sectionKey="summary" />
      <FormField label="Content (HTML supported)">
        <TextArea
          value={summary.content}
          onChange={(v) => updateSummary("content", v)}
          placeholder="A brief professional summary..."
          rows={4}
        />
      </FormField>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   GENERIC LIST EDITOR (for all list sections)
   ═══════════════════════════════════════════════════════ */
type FieldDef = {
  key: string; // supports dot notation e.g. "website.url"
  label: string;
  type?: "text" | "textarea" | "keywords";
  placeholder?: string;
};

function ListSectionEditor<T extends { id: string; hidden?: boolean }>({
  sectionKey,
  title,
  fields,
  makeItem,
  getTitle,
}: {
  sectionKey: SectionType;
  title: string;
  fields: FieldDef[];
  makeItem: () => T;
  getTitle: (item: T) => string;
}) {
  const section = useResumeV2Editor((s) => {
    const sec = (s.resume.sections as Record<string, unknown>)[sectionKey] as
      | { items: T[] }
      | undefined;
    return sec;
  });
  const addItem = useResumeV2Editor((s) => s.addSectionItem);
  const updateItem = useResumeV2Editor((s) => s.updateSectionItem);
  const removeItem = useResumeV2Editor((s) => s.removeSectionItem);

  const items = (section?.items ?? []) as T[];

  return (
    <div className="space-y-3">
      <SectionHeader
        title={title}
        sectionKey={sectionKey}
        onAdd={() => addItem(sectionKey, makeItem() as never)}
      />
      <div className="space-y-2">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            title={getTitle(item)}
            hidden={item.hidden}
            onRemove={() => removeItem(sectionKey, item.id)}
            onToggle={() =>
              updateItem(sectionKey, item.id, { hidden: !item.hidden } as Partial<T>)
            }
          >
            {fields.map((field) => {
              const raw = getNestedValue(item as unknown as Record<string, unknown>, field.key);
              return (
                <FormField key={field.key} label={field.label}>
                  {field.type === "textarea" ? (
                    <TextArea
                      value={String(raw ?? "")}
                      onChange={(v) =>
                        updateItem(
                          sectionKey,
                          item.id,
                          buildNestedUpdate(
                            item as unknown as Record<string, unknown>,
                            field.key,
                            v,
                          ) as Partial<T>,
                        )
                      }
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "keywords" ? (
                    <TextInput
                      value={Array.isArray(raw) ? (raw as string[]).join(", ") : ""}
                      onChange={(v) =>
                        updateItem(
                          sectionKey,
                          item.id,
                          buildNestedUpdate(
                            item as unknown as Record<string, unknown>,
                            field.key,
                            v.split(",").map((s) => s.trim()).filter(Boolean),
                          ) as Partial<T>,
                        )
                      }
                      placeholder={field.placeholder || "Comma separated"}
                    />
                  ) : (
                    <TextInput
                      value={String(raw ?? "")}
                      onChange={(v) =>
                        updateItem(
                          sectionKey,
                          item.id,
                          buildNestedUpdate(
                            item as unknown as Record<string, unknown>,
                            field.key,
                            v,
                          ) as Partial<T>,
                        )
                      }
                      placeholder={field.placeholder}
                    />
                  )}
                </FormField>
              );
            })}
          </ItemCard>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Concrete Section Editors — field names match schema.ts
   ═══════════════════════════════════════════════════════ */

function ExperienceEditor() {
  return (
    <ListSectionEditor<ExperienceItem>
      sectionKey="experience"
      title="Experience"
      fields={[
        { key: "company", label: "Company", placeholder: "Acme Corp" },
        { key: "position", label: "Position", placeholder: "Senior Developer" },
        { key: "location", label: "Location", placeholder: "New York, NY" },
        { key: "period", label: "Date Range", placeholder: "Jan 2020 - Present" },
        { key: "website.url", label: "Website URL", placeholder: "https://acme.com" },
        { key: "description", label: "Description", type: "textarea", placeholder: "Key responsibilities..." },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        company: "",
        position: "",
        location: "",
        period: "",
        website: { url: "", label: "" },
        description: "",
        roles: [],
      })}
      getTitle={(item) => item.company || item.position || "Untitled"}
    />
  );
}

function EducationEditor() {
  return (
    <ListSectionEditor<EducationItem>
      sectionKey="education"
      title="Education"
      fields={[
        { key: "school", label: "School", placeholder: "MIT" },
        { key: "degree", label: "Degree", placeholder: "Bachelor of Science" },
        { key: "area", label: "Area of Study", placeholder: "Computer Science" },
        { key: "grade", label: "Grade / GPA", placeholder: "3.8/4.0" },
        { key: "location", label: "Location", placeholder: "Cambridge, MA" },
        { key: "period", label: "Date Range", placeholder: "2016 - 2020" },
        { key: "website.url", label: "Website URL", placeholder: "https://mit.edu" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        school: "",
        degree: "",
        area: "",
        grade: "",
        location: "",
        period: "",
        website: { url: "", label: "" },
        description: "",
      })}
      getTitle={(item) => item.school || item.area || "Untitled"}
    />
  );
}

function SkillsEditor() {
  return (
    <ListSectionEditor<SkillItem>
      sectionKey="skills"
      title="Skills"
      fields={[
        { key: "name", label: "Name", placeholder: "JavaScript" },
        { key: "proficiency", label: "Proficiency", placeholder: "Expert" },
        { key: "icon", label: "Icon (Phosphor)", placeholder: "code" },
        { key: "keywords", label: "Keywords", type: "keywords", placeholder: "React, Vue, Node" },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        name: "",
        proficiency: "",
        level: 0,
        keywords: [],
        icon: "",
      })}
      getTitle={(item) => item.name || "Untitled"}
    />
  );
}

function LanguagesEditor() {
  return (
    <ListSectionEditor<LanguageItem>
      sectionKey="languages"
      title="Languages"
      fields={[
        { key: "language", label: "Language", placeholder: "English" },
        { key: "fluency", label: "Fluency", placeholder: "Native" },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        language: "",
        fluency: "",
        level: 0,
      })}
      getTitle={(item) => item.language || "Untitled"}
    />
  );
}

function ProfilesEditor() {
  return (
    <ListSectionEditor<ProfileItem>
      sectionKey="profiles"
      title="Profiles"
      fields={[
        { key: "network", label: "Network", placeholder: "LinkedIn" },
        { key: "username", label: "Username", placeholder: "johndoe" },
        { key: "website.url", label: "URL", placeholder: "https://linkedin.com/in/johndoe" },
        { key: "icon", label: "Icon (Phosphor)", placeholder: "linkedin-logo" },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        network: "",
        username: "",
        website: { url: "", label: "" },
        icon: "",
      })}
      getTitle={(item) => item.network || item.username || "Untitled"}
    />
  );
}

function ProjectsEditor() {
  return (
    <ListSectionEditor<ProjectItem>
      sectionKey="projects"
      title="Projects"
      fields={[
        { key: "name", label: "Name", placeholder: "My Project" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "period", label: "Date", placeholder: "2023" },
        { key: "website.url", label: "URL", placeholder: "https://github.com/..." },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        name: "",
        description: "",
        period: "",
        website: { url: "", label: "" },
      })}
      getTitle={(item) => item.name || "Untitled"}
    />
  );
}

function AwardsEditor() {
  return (
    <ListSectionEditor<AwardItem>
      sectionKey="awards"
      title="Awards"
      fields={[
        { key: "title", label: "Title", placeholder: "Best Paper Award" },
        { key: "awarder", label: "Awarder", placeholder: "IEEE" },
        { key: "date", label: "Date", placeholder: "2023" },
        { key: "website.url", label: "URL" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        title: "",
        awarder: "",
        date: "",
        website: { url: "", label: "" },
        description: "",
      })}
      getTitle={(item) => item.title || "Untitled"}
    />
  );
}

function CertificationsEditor() {
  return (
    <ListSectionEditor<CertificationItem>
      sectionKey="certifications"
      title="Certifications"
      fields={[
        { key: "title", label: "Name", placeholder: "AWS Certified" },
        { key: "issuer", label: "Issuer", placeholder: "Amazon" },
        { key: "date", label: "Date", placeholder: "2023" },
        { key: "website.url", label: "URL" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        title: "",
        issuer: "",
        date: "",
        website: { url: "", label: "" },
        description: "",
      })}
      getTitle={(item) => item.title || "Untitled"}
    />
  );
}

function PublicationsEditor() {
  return (
    <ListSectionEditor<PublicationItem>
      sectionKey="publications"
      title="Publications"
      fields={[
        { key: "title", label: "Title", placeholder: "My Research Paper" },
        { key: "publisher", label: "Publisher", placeholder: "ACM" },
        { key: "date", label: "Date", placeholder: "2023" },
        { key: "website.url", label: "URL" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        title: "",
        publisher: "",
        date: "",
        website: { url: "", label: "" },
        description: "",
      })}
      getTitle={(item) => item.title || "Untitled"}
    />
  );
}

function VolunteerEditor() {
  return (
    <ListSectionEditor<VolunteerItem>
      sectionKey="volunteer"
      title="Volunteer"
      fields={[
        { key: "organization", label: "Organization", placeholder: "Red Cross" },
        { key: "location", label: "Location" },
        { key: "period", label: "Date Range", placeholder: "2020 - Present" },
        { key: "website.url", label: "URL" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        organization: "",
        location: "",
        period: "",
        website: { url: "", label: "" },
        description: "",
      })}
      getTitle={(item) => item.organization || "Untitled"}
    />
  );
}

function ReferencesEditor() {
  return (
    <ListSectionEditor<ReferenceItem>
      sectionKey="references"
      title="References"
      fields={[
        { key: "name", label: "Name", placeholder: "Jane Smith" },
        { key: "position", label: "Position", placeholder: "CTO at Acme" },
        { key: "phone", label: "Phone" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        name: "",
        position: "",
        website: { url: "", label: "" },
        phone: "",
        description: "",
      })}
      getTitle={(item) => item.name || "Untitled"}
    />
  );
}

function InterestsEditor() {
  return (
    <ListSectionEditor<InterestItem>
      sectionKey="interests"
      title="Interests"
      fields={[
        { key: "name", label: "Name", placeholder: "Open Source" },
        { key: "keywords", label: "Keywords", type: "keywords", placeholder: "Linux, Git, Community" },
      ]}
      makeItem={() => ({
        id: createId(),
        hidden: false,
        name: "",
        keywords: [],
        icon: "",
      })}
      getTitle={(item) => item.name || "Untitled"}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION MAP & LEFT SIDEBAR
   ═══════════════════════════════════════════════════════ */

const SECTION_EDITORS: Record<string, React.FC> = {
  picture: PictureEditor,
  basics: BasicsEditor,
  summary: SummaryEditor,
  experience: ExperienceEditor,
  education: EducationEditor,
  profiles: ProfilesEditor,
  projects: ProjectsEditor,
  skills: SkillsEditor,
  languages: LanguagesEditor,
  interests: InterestsEditor,
  awards: AwardsEditor,
  certifications: CertificationsEditor,
  publications: PublicationsEditor,
  volunteer: VolunteerEditor,
  references: ReferencesEditor,
};

const SECTION_ICONS: Record<string, string> = {
  picture: "image",
  basics: "user",
  summary: "article",
  experience: "briefcase",
  education: "graduation-cap",
  profiles: "share-network",
  projects: "rocket-launch",
  skills: "wrench",
  languages: "translate",
  interests: "heart",
  awards: "trophy",
  certifications: "certificate",
  publications: "book-open",
  volunteer: "hand-heart",
  references: "users",
};

export default function LeftSidebar() {
  const [activeSection, setActiveSection] = useState<string>("basics");

  const sectionOrder = [
    "picture",
    "basics",
    "summary",
    ...LEFT_SIDEBAR_SECTIONS,
  ];

  const ActiveEditor = SECTION_EDITORS[activeSection];

  return (
    <div className="flex h-full">
      {/* Icon edge strip */}
      <div className="flex w-10 shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-r border-gray-700 bg-gray-900 py-2">
        {sectionOrder.map((key) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex size-8 items-center justify-center rounded-md transition-colors ${
              activeSection === key
                ? "bg-primary-500/20 text-primary-400"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
            title={getSectionTitle(key as SectionType)}
          >
            <i className={`ph ph-${SECTION_ICONS[key] || "list"} text-base`} />
          </button>
        ))}
      </div>

      {/* Section editor panel */}
      <div className="flex-1 overflow-y-auto p-4">
        {ActiveEditor ? <ActiveEditor /> : <div className="text-sm text-gray-500">Select a section</div>}
      </div>
    </div>
  );
}
