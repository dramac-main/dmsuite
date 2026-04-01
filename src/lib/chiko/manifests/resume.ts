// =============================================================================
// DMSuite — Chiko Action Manifest — Resume & CV Builder (V2)
// Gives Chiko full control over resume content, design, layout, sections, AI,
// ATS scoring, export, and revision management.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useResumeEditor } from "@/stores/resume-editor";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";
import { exportResume } from "@/components/workspaces/resume-cv/ExportDropdown";
import type {
  ResumeData,
  SectionKey,
  TemplateId,
  LevelType,
  Basics,
  Picture,
  TypographyItem,
} from "@/lib/resume/schema";
import { TEMPLATE_IDS, SECTION_META, FONT_PAIRINGS } from "@/lib/resume/schema";

// ── Options ──

export interface ResumeManifestOptions {
  onPrintRef?: React.RefObject<(() => void) | null>;
}

// ── Read state helper ──

function readState(): Record<string, unknown> {
  const { resume, pendingRevision, isRevisionPending } = useResumeEditor.getState();
  const sectionSummary: Record<string, { title: string; itemCount: number; hidden: boolean }> = {};
  for (const [key, sec] of Object.entries(resume.sections)) {
    sectionSummary[key] = { title: sec.title, itemCount: sec.items.length, hidden: sec.hidden };
  }
  return {
    template: resume.metadata.template,
    basics: { ...resume.basics },
    summary: { title: resume.summary.title, content: resume.summary.content, hidden: resume.summary.hidden },
    sections: sectionSummary,
    customSections: resume.customSections.map((cs) => ({
      id: cs.id,
      title: cs.title,
      itemCount: cs.items.length,
      hidden: cs.hidden,
    })),
    metadata: {
      primaryColor: resume.metadata.design.colors.primary,
      textColor: resume.metadata.design.colors.text,
      backgroundColor: resume.metadata.design.colors.background,
      template: resume.metadata.template,
      page: resume.metadata.page,
      typography: resume.metadata.typography,
      hideIcons: resume.metadata.page.hideIcons,
      css: resume.metadata.css,
    },
    layout: resume.metadata.layout,
    notes: resume.metadata.notes,
    hasPendingRevision: isRevisionPending,
    pendingRevisionDescription: pendingRevision?.description ?? null,
    availableTemplates: TEMPLATE_IDS,
    availableSections: Object.keys(SECTION_META),
    availableFontPairings: Object.entries(FONT_PAIRINGS).map(([key]) => key),
  };
}

// ── Validation helper ──

interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
}

function validateResume(): { issues: ValidationIssue[]; ready: boolean } {
  const { resume } = useResumeEditor.getState();
  const issues: ValidationIssue[] = [];

  if (!resume.basics.name.trim()) issues.push({ severity: "warning", field: "basics.name", message: "Name is empty" });
  if (!resume.basics.email.trim()) issues.push({ severity: "warning", field: "basics.email", message: "Email is empty" });
  if (!resume.summary.content.trim()) issues.push({ severity: "warning", field: "summary", message: "Summary is empty" });

  const experience = resume.sections.experience;
  if (experience && experience.items.length === 0) {
    issues.push({ severity: "warning", field: "sections.experience", message: "No work experience entries" });
  }
  const education = resume.sections.education;
  if (education && education.items.length === 0) {
    issues.push({ severity: "warning", field: "sections.education", message: "No education entries" });
  }

  return { issues, ready: issues.filter((i) => i.severity === "error").length === 0 };
}

// ── Manifest factory ──

export function createResumeManifest(options?: ResumeManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "resume-cv",
    toolName: "Resume & CV Builder",

    actions: [
      // ── Info ──
      {
        name: "readCurrentState",
        description: "Read the full current state of the resume including all sections, metadata, layout, and template for analysis or suggestions.",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },
      {
        name: "readSectionItems",
        description: "Read all items of a specific section by key. Keys: experience, education, skills, languages, profiles, certifications, awards, projects, publications, volunteer, references, interests.",
        parameters: {
          type: "object",
          properties: { sectionKey: { type: "string" } },
          required: ["sectionKey"],
        },
        category: "Info",
      },

      // ── Basics ──
      {
        name: "updateBasics",
        description: "Update resume basics: name, headline, email, phone, location, url (website URL), urlLabel (website label).",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            headline: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            location: { type: "string" },
            url: { type: "string" },
            urlLabel: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "updatePicture",
        description: "Update profile picture settings: url (base64 or URL), size (px), borderRadius (px), border (boolean), borderColor (hex).",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string" },
            size: { type: "number" },
            borderRadius: { type: "number" },
            border: { type: "boolean" },
            borderColor: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "updateSummary",
        description: "Update the professional summary content. Supports HTML for formatting.",
        parameters: {
          type: "object",
          properties: {
            content: { type: "string" },
            title: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── Section Items ──
      {
        name: "addSectionItem",
        description: "Add a new item to a section. Provide sectionKey and optional item data (fields depend on section type).",
        parameters: {
          type: "object",
          properties: {
            sectionKey: { type: "string" },
            item: { type: "object" },
          },
          required: ["sectionKey"],
        },
        category: "Content",
      },
      {
        name: "updateSectionItem",
        description: "Update a specific item by index in a section. Provide sectionKey, itemIndex (0-based), and fields to update.",
        parameters: {
          type: "object",
          properties: {
            sectionKey: { type: "string" },
            itemIndex: { type: "number" },
            data: { type: "object" },
          },
          required: ["sectionKey", "itemIndex", "data"],
        },
        category: "Content",
      },
      {
        name: "removeSectionItem",
        description: "Remove an item by index from a section.",
        parameters: {
          type: "object",
          properties: {
            sectionKey: { type: "string" },
            itemIndex: { type: "number" },
          },
          required: ["sectionKey", "itemIndex"],
        },
        category: "Content",
        destructive: true,
      },
      {
        name: "reorderSectionItems",
        description: "Reorder items in a section by moving an item from fromIndex to toIndex.",
        parameters: {
          type: "object",
          properties: {
            sectionKey: { type: "string" },
            fromIndex: { type: "number" },
            toIndex: { type: "number" },
          },
          required: ["sectionKey", "fromIndex", "toIndex"],
        },
        category: "Content",
      },
      {
        name: "toggleSectionVisibility",
        description: "Toggle visibility (show/hide) of a section.",
        parameters: {
          type: "object",
          properties: { sectionKey: { type: "string" } },
          required: ["sectionKey"],
        },
        category: "Content",
      },
      {
        name: "renameSectionTitle",
        description: "Rename the display title of a section.",
        parameters: {
          type: "object",
          properties: {
            sectionKey: { type: "string" },
            title: { type: "string" },
          },
          required: ["sectionKey", "title"],
        },
        category: "Content",
      },
      {
        name: "setSectionColumns",
        description: "Set the number of columns for a section (1–4).",
        parameters: {
          type: "object",
          properties: {
            sectionKey: { type: "string" },
            columns: { type: "number" },
          },
          required: ["sectionKey", "columns"],
        },
        category: "Content",
      },

      // ── Custom Sections ──
      {
        name: "addCustomSection",
        description: "Add a new custom section with a given title.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            type: { type: "string" },
          },
          required: ["title"],
        },
        category: "Content",
      },
      {
        name: "removeCustomSection",
        description: "Remove a custom section by its id.",
        parameters: {
          type: "object",
          properties: { sectionId: { type: "string" } },
          required: ["sectionId"],
        },
        category: "Content",
        destructive: true,
      },
      {
        name: "addCustomSectionItem",
        description: "Add a new item to a custom section.",
        parameters: {
          type: "object",
          properties: { sectionId: { type: "string" } },
          required: ["sectionId"],
        },
        category: "Content",
      },
      {
        name: "updateCustomSectionItem",
        description: "Update a custom section item by index. Fields: title, subtitle, date, description, url.",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string" },
            itemIndex: { type: "number" },
            data: { type: "object" },
          },
          required: ["sectionId", "itemIndex", "data"],
        },
        category: "Content",
      },
      {
        name: "removeCustomSectionItem",
        description: "Remove an item from a custom section by index.",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string" },
            itemIndex: { type: "number" },
          },
          required: ["sectionId", "itemIndex"],
        },
        category: "Content",
        destructive: true,
      },

      // ── Template & Design ──
      {
        name: "changeTemplate",
        description: "Change the resume template. Options: azurill, bronzor, chikorita, ditto, gengar, glalie, kakuna, leafish, onyx, pikachu, rhyhorn.",
        parameters: {
          type: "object",
          properties: { templateId: { type: "string" } },
          required: ["templateId"],
        },
        category: "Style",
      },
      {
        name: "setPrimaryColor",
        description: "Set the accent/primary color (hex, e.g. '#8b5cf6').",
        parameters: {
          type: "object",
          properties: { color: { type: "string" } },
          required: ["color"],
        },
        category: "Style",
      },
      {
        name: "setTextColor",
        description: "Set the text color (hex).",
        parameters: {
          type: "object",
          properties: { color: { type: "string" } },
          required: ["color"],
        },
        category: "Style",
      },
      {
        name: "setBackgroundColor",
        description: "Set the resume background color (hex).",
        parameters: {
          type: "object",
          properties: { color: { type: "string" } },
          required: ["color"],
        },
        category: "Style",
      },

      // ── Typography ──
      {
        name: "setTypography",
        description: "Update resume typography. Set heading and/or body font settings: family, size, weight, lineHeight.",
        parameters: {
          type: "object",
          properties: {
            heading: {
              type: "object",
              properties: { family: { type: "string" }, size: { type: "number" }, weight: { type: "number" }, lineHeight: { type: "number" } },
            },
            body: {
              type: "object",
              properties: { family: { type: "string" }, size: { type: "number" }, weight: { type: "number" }, lineHeight: { type: "number" } },
            },
            fontPairing: { type: "string", description: "Shortcut: a label from the font pairings list" },
          },
        },
        category: "Style",
      },
      {
        name: "setLevelDesign",
        description: "Set skill/language level indicator style: circle, square, rectangle, progress-bar.",
        parameters: {
          type: "object",
          properties: { type: { type: "string" } },
          required: ["type"],
        },
        category: "Style",
      },
      {
        name: "setHideIcons",
        description: "Toggle visibility of section icons.",
        parameters: {
          type: "object",
          properties: { hide: { type: "boolean" } },
          required: ["hide"],
        },
        category: "Style",
      },
      {
        name: "setCustomCSS",
        description: "Enable/disable custom CSS and optionally set the CSS value.",
        parameters: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            value: { type: "string" },
          },
          required: ["enabled"],
        },
        category: "Style",
      },

      // ── Layout ──
      {
        name: "setSidebarWidth",
        description: "Set sidebar width as percentage of page (20–50).",
        parameters: {
          type: "object",
          properties: { width: { type: "number" } },
          required: ["width"],
        },
        category: "Layout",
      },
      {
        name: "setPageFormat",
        description: "Set page format: a4 or letter.",
        parameters: {
          type: "object",
          properties: { format: { type: "string" } },
          required: ["format"],
        },
        category: "Layout",
      },
      {
        name: "setPageMargins",
        description: "Set page margins in mm (marginX for horizontal, marginY for vertical).",
        parameters: {
          type: "object",
          properties: {
            marginX: { type: "number" },
            marginY: { type: "number" },
          },
          required: ["marginX", "marginY"],
        },
        category: "Layout",
      },
      {
        name: "moveSectionToColumn",
        description: "Move a section between main and sidebar columns on a specific page.",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string" },
            column: { type: "string" },
            pageIndex: { type: "number" },
          },
          required: ["sectionId", "column", "pageIndex"],
        },
        category: "Layout",
      },
      {
        name: "addPage",
        description: "Add a new page to the resume layout.",
        parameters: { type: "object", properties: {} },
        category: "Layout",
      },
      {
        name: "removePage",
        description: "Remove a page by index from the layout.",
        parameters: {
          type: "object",
          properties: { pageIndex: { type: "number" } },
          required: ["pageIndex"],
        },
        category: "Layout",
        destructive: true,
      },

      // ── AI ──
      {
        name: "generateResume",
        description: "Generate a full resume using AI. Provide a prompt describing the person's background, target role, etc. The AI will populate the entire resume.",
        parameters: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            targetRole: { type: "string" },
            industry: { type: "string" },
          },
          required: ["prompt"],
        },
        category: "AI",
      },
      {
        name: "reviseResume",
        description: "Revise the current resume via AI. Provide an instruction like 'make it more concise' or 'tailor for a senior engineer role'. Creates a pending revision the user can accept or reject.",
        parameters: {
          type: "object",
          properties: {
            instruction: { type: "string" },
          },
          required: ["instruction"],
        },
        category: "AI",
      },
      {
        name: "scoreATS",
        description: "Score the resume against ATS (Applicant Tracking System) criteria. Optionally provide a job description to score against.",
        parameters: {
          type: "object",
          properties: {
            jobDescription: { type: "string" },
          },
        },
        category: "AI",
      },
      {
        name: "acceptRevision",
        description: "Accept the pending AI revision and apply it to the resume.",
        parameters: { type: "object", properties: {} },
        category: "AI",
      },
      {
        name: "rejectRevision",
        description: "Reject the pending AI revision and discard it.",
        parameters: { type: "object", properties: {} },
        category: "AI",
      },

      // ── Export ──
      {
        name: "exportResume",
        description: "Export the resume. Format: pdf, docx, txt, json, clipboard.",
        parameters: {
          type: "object",
          properties: { format: { type: "string" } },
          required: ["format"],
        },
        category: "Export",
      },
      {
        name: "validateBeforeExport",
        description: "Validate the resume for completeness before exporting.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      // ── Misc ──
      {
        name: "prefillFromMemory",
        description: "Pre-fill basics (name, email, phone, location) from Business Memory.",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },
      {
        name: "importJSON",
        description: "Import a full resume from JSON data (ResumeData format).",
        parameters: {
          type: "object",
          properties: { data: { type: "object" } },
          required: ["data"],
        },
        category: "Content",
      },
      {
        name: "setNotes",
        description: "Set personal notes/metadata on the resume (not rendered).",
        parameters: {
          type: "object",
          properties: { notes: { type: "string" } },
          required: ["notes"],
        },
        category: "Content",
      },
      {
        name: "resetResume",
        description: "Reset the entire resume to defaults. All content will be lost.",
        parameters: { type: "object", properties: {} },
        category: "Content",
        destructive: true,
      },
    ],

    getState: readState,

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      try {
        const store = useResumeEditor.getState();

        switch (actionName) {
          case "readCurrentState":
            return { success: true, message: "Current resume state", newState: readState() };

          case "readSectionItems": {
            const key = params.sectionKey as SectionKey;
            const section = store.resume.sections[key];
            if (!section) return { success: false, message: `Unknown section: ${key}` };
            return {
              success: true,
              message: `${section.title}: ${section.items.length} items`,
              newState: { sectionKey: key, title: section.title, items: section.items },
            };
          }

          // ── Basics ──
          case "updateBasics":
            store.updateBasics(params as Partial<Basics>);
            return { success: true, message: "Updated resume basics" };

          case "updatePicture":
            store.updatePicture(params as Partial<Picture>);
            return { success: true, message: "Updated profile picture" };

          case "updateSummary":
            store.updateSummary(params as Partial<{ title: string; content: string }>);
            return { success: true, message: "Updated professional summary" };

          // ── Section Items ──
          case "addSectionItem": {
            const sKey = params.sectionKey as SectionKey;
            store.addSectionItem(sKey, params.item as Record<string, unknown> | undefined);
            const count = store.resume.sections[sKey]?.items.length ?? 0;
            return { success: true, message: `Added item to ${sKey} (${count} total)` };
          }

          case "updateSectionItem":
            store.updateSectionItem(
              params.sectionKey as SectionKey,
              params.itemIndex as number,
              params.data as Record<string, unknown>,
            );
            return { success: true, message: `Updated ${params.sectionKey} item #${params.itemIndex}` };

          case "removeSectionItem":
            store.removeSectionItem(params.sectionKey as SectionKey, params.itemIndex as number);
            return { success: true, message: `Removed ${params.sectionKey} item #${params.itemIndex}` };

          case "reorderSectionItems":
            store.reorderSectionItems(
              params.sectionKey as SectionKey,
              params.fromIndex as number,
              params.toIndex as number,
            );
            return { success: true, message: `Reordered ${params.sectionKey} items` };

          case "toggleSectionVisibility":
            store.toggleSectionVisibility(params.sectionKey as SectionKey);
            return { success: true, message: `Toggled ${params.sectionKey} visibility` };

          case "renameSectionTitle":
            store.renameSectionTitle(params.sectionKey as SectionKey, params.title as string);
            return { success: true, message: `Renamed ${params.sectionKey} to "${params.title}"` };

          case "setSectionColumns":
            store.setSectionColumns(params.sectionKey as SectionKey, params.columns as number);
            return { success: true, message: `Set ${params.sectionKey} columns to ${params.columns}` };

          // ── Custom Sections ──
          case "addCustomSection":
            store.addCustomSection(params.title as string, params.type as string | undefined);
            return { success: true, message: `Added custom section "${params.title}"` };

          case "removeCustomSection":
            store.removeCustomSection(params.sectionId as string);
            return { success: true, message: "Removed custom section" };

          case "addCustomSectionItem":
            store.addCustomSectionItem(params.sectionId as string);
            return { success: true, message: "Added item to custom section" };

          case "updateCustomSectionItem":
            store.updateCustomSectionItem(
              params.sectionId as string,
              params.itemIndex as number,
              params.data as Record<string, unknown>,
            );
            return { success: true, message: "Updated custom section item" };

          case "removeCustomSectionItem":
            store.removeCustomSectionItem(params.sectionId as string, params.itemIndex as number);
            return { success: true, message: "Removed custom section item" };

          // ── Template & Design ──
          case "changeTemplate":
            store.changeTemplate(params.templateId as TemplateId);
            return { success: true, message: `Template changed to ${params.templateId}` };

          case "setPrimaryColor":
            store.setPrimaryColor(params.color as string);
            return { success: true, message: `Primary color set to ${params.color}` };

          case "setTextColor":
            store.setTextColor(params.color as string);
            return { success: true, message: `Text color set to ${params.color}` };

          case "setBackgroundColor":
            store.setBackgroundColor(params.color as string);
            return { success: true, message: `Background color set to ${params.color}` };

          // ── Typography ──
          case "setTypography": {
            if (params.fontPairing) {
              const pairingKey = params.fontPairing as string;
              const pairing = FONT_PAIRINGS[pairingKey];
              if (pairing) {
                store.setHeadingTypography({ fontFamily: pairing.heading });
                store.setBodyTypography({ fontFamily: pairing.body });
              }
            }
            if (params.heading) store.setHeadingTypography(params.heading as Partial<TypographyItem>);
            if (params.body) store.setBodyTypography(params.body as Partial<TypographyItem>);
            return { success: true, message: "Typography updated" };
          }

          case "setLevelDesign":
            store.setLevelDesign(params.type as LevelType);
            return { success: true, message: `Level design set to ${params.type}` };

          case "setHideIcons":
            store.setHideIcons(params.hide as boolean);
            return { success: true, message: params.hide ? "Icons hidden" : "Icons shown" };

          case "setCustomCSS":
            store.setCustomCSS(params.enabled as boolean, params.value as string | undefined);
            return { success: true, message: params.enabled ? "Custom CSS enabled" : "Custom CSS disabled" };

          // ── Layout ──
          case "setSidebarWidth":
            store.setSidebarWidth(params.width as number);
            return { success: true, message: `Sidebar width set to ${params.width}%` };

          case "setPageFormat":
            store.setPageFormat(params.format as "a4" | "letter");
            return { success: true, message: `Page format set to ${params.format}` };

          case "setPageMargins":
            store.setPageMargins(params.marginX as number, params.marginY as number);
            return { success: true, message: `Margins set to ${params.marginX}mm × ${params.marginY}mm` };

          case "moveSectionToColumn":
            store.moveSectionToColumn(
              params.sectionId as string,
              params.column as "main" | "sidebar",
              params.pageIndex as number,
            );
            return { success: true, message: `Moved ${params.sectionId} to ${params.column} on page ${params.pageIndex}` };

          case "addPage":
            store.addPage();
            return { success: true, message: "Added new page" };

          case "removePage":
            store.removePage(params.pageIndex as number);
            return { success: true, message: `Removed page ${params.pageIndex}` };

          // ── AI ──
          case "generateResume": {
            // AI generation is async — fire the API call
            const prompt = params.prompt as string;
            fetch("/api/chat/resume/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt,
                targetRole: params.targetRole,
                industry: params.industry,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.resume) {
                  useResumeEditor.getState().setResume(data.resume);
                }
              })
              .catch(() => {});
            return { success: true, message: "AI resume generation started. The resume will update when ready." };
          }

          case "reviseResume": {
            const instruction = params.instruction as string;
            const currentResume = store.resume;
            fetch("/api/chat/resume/revise", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resume: currentResume, instruction }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.resume) {
                  const s = useResumeEditor.getState();
                  s.setPendingRevision({
                    id: Date.now().toString(36),
                    description: instruction,
                    hunks: [],
                    timestamp: Date.now(),
                  });
                  // Store revised data temporarily — will apply on accept
                  (window as unknown as Record<string, unknown>).__pendingResumeRevision = data.resume;
                }
              })
              .catch(() => {});
            return { success: true, message: "AI revision started. A pending revision will appear when ready." };
          }

          case "scoreATS": {
            fetch("/api/chat/resume/parse", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                resume: store.resume,
                jobDescription: params.jobDescription,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                // ATS results returned
                return data;
              })
              .catch(() => {});
            return { success: true, message: "ATS scoring started. Results will be available shortly." };
          }

          case "acceptRevision": {
            const pending = (window as unknown as Record<string, unknown>).__pendingResumeRevision as ResumeData | undefined;
            if (pending) {
              store.setResume(pending);
              delete (window as unknown as Record<string, unknown>).__pendingResumeRevision;
            }
            store.acceptRevision();
            return { success: true, message: "Revision accepted and applied" };
          }

          case "rejectRevision":
            store.rejectRevision();
            delete (window as unknown as Record<string, unknown>).__pendingResumeRevision;
            return { success: true, message: "Revision rejected" };

          // ── Export ──
          case "exportResume": {
            const format = params.format as string;
            exportResume(store.resume, format as "pdf" | "docx" | "txt" | "json" | "clipboard");
            return { success: true, message: `Exported resume as ${format}` };
          }

          case "validateBeforeExport": {
            const result = validateResume();
            return {
              success: true,
              message: result.ready
                ? `Resume is ready to export (${result.issues.length} warnings)`
                : `Resume has issues: ${result.issues.map((i) => i.message).join("; ")}`,
              newState: result as unknown as Record<string, unknown>,
            };
          }

          // ── Misc ──
          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) {
              return { success: false, message: "No business profile saved. Ask the user to set up Business Memory first." };
            }
            const p = memory.profile;
            const patch: Partial<Basics> = {};
            if (p.companyName) patch.name = p.companyName;
            if (p.email) patch.email = p.email;
            if (p.phone) patch.phone = p.phone;
            if (p.website) patch.website = { url: p.website, label: "Website" };
            if (Object.keys(patch).length > 0) store.updateBasics(patch);
            return { success: true, message: "Pre-filled basics from Business Memory" };
          }

          case "importJSON":
            store.setResume(params.data as ResumeData);
            return { success: true, message: "Resume imported from JSON" };

          case "setNotes":
            store.setNotes(params.notes as string);
            return { success: true, message: "Notes updated" };

          case "resetResume":
            store.resetResume();
            return { success: true, message: "Resume reset to defaults" };

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Error: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useResumeEditor.getState().resume,
    (snapshot) => useResumeEditor.getState().setResume(snapshot as ResumeData),
  );
}
