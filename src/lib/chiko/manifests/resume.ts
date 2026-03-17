// =============================================================================
// DMSuite — Resume Editor Action Manifest for Chiko
// Describes all actions available on the Resume & CV Builder for AI control.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useResumeEditor } from "@/stores/resume-editor";
import type { TemplateId } from "@/lib/resume/schema";

/** Build the resume action manifest. Call from the workspace component. */
export function createResumeManifest(): ChikoActionManifest {
  return {
    toolId: "resume-editor",
    toolName: "Resume & CV Builder",
    actions: [
      {
        name: "changeTemplate",
        description:
          "Switch to a different resume template. Available: modern-minimalist, corporate-executive, creative-bold, elegant-sidebar, infographic, dark-professional, gradient-creative, classic-corporate, artistic-portfolio, tech-modern, swiss-typographic, newspaper-editorial, brutalist-mono, pastel-soft, split-duotone, architecture-blueprint, retro-vintage, medical-clean, neon-glass, corporate-stripe",
        parameters: {
          type: "object",
          properties: {
            templateId: {
              type: "string",
              enum: [
                "modern-minimalist", "corporate-executive", "creative-bold",
                "elegant-sidebar", "infographic", "dark-professional",
                "gradient-creative", "classic-corporate", "artistic-portfolio",
                "tech-modern", "swiss-typographic", "newspaper-editorial",
                "brutalist-mono", "pastel-soft", "split-duotone",
                "architecture-blueprint", "retro-vintage", "medical-clean",
                "neon-glass", "corporate-stripe",
              ],
              description: "Template ID to switch to",
            },
          },
          required: ["templateId"],
        },
        category: "Design",
      },
      {
        name: "setAccentColor",
        description: "Change the accent/primary color of the resume",
        parameters: {
          type: "object",
          properties: {
            color: { type: "string", description: "Hex color (e.g. #2563eb)" },
          },
          required: ["color"],
        },
        category: "Design",
      },
      {
        name: "setFontPairing",
        description: "Change the font combination used in the resume",
        parameters: {
          type: "object",
          properties: {
            pairingId: { type: "string", description: "Font pairing ID" },
          },
          required: ["pairingId"],
        },
        category: "Design",
      },
      {
        name: "setFontScale",
        description: "Change the font size scale",
        parameters: {
          type: "object",
          properties: {
            scale: {
              type: "string",
              enum: ["compact", "standard", "spacious"],
              description: "Font size scale",
            },
          },
          required: ["scale"],
        },
        category: "Design",
      },
      {
        name: "addSectionItem",
        description:
          "Add a new item to a resume section. sectionKey can be: experience, education, skills, certifications, languages, volunteer, projects, awards, references",
        parameters: {
          type: "object",
          properties: {
            sectionKey: {
              type: "string",
              description: "Section key (e.g. experience, education, skills)",
            },
            item: {
              type: "object",
              description: "Item data — fields depend on section type. For experience: { company, position, location, startDate, endDate, description }. For education: { institution, degree, field, graduationYear }. For skills: { name, keywords: [], proficiency }.",
            },
          },
          required: ["sectionKey", "item"],
        },
        category: "Content",
      },
      {
        name: "updateSectionItem",
        description: "Update an existing section item by index",
        parameters: {
          type: "object",
          properties: {
            sectionKey: { type: "string", description: "Section key" },
            itemIndex: { type: "number", description: "Zero-based index of the item" },
            data: { type: "object", description: "Partial data to merge into the item" },
          },
          required: ["sectionKey", "itemIndex", "data"],
        },
        category: "Content",
      },
      {
        name: "removeSectionItem",
        description: "Remove a section item by index",
        parameters: {
          type: "object",
          properties: {
            sectionKey: { type: "string", description: "Section key" },
            itemIndex: { type: "number", description: "Zero-based index to remove" },
          },
          required: ["sectionKey", "itemIndex"],
        },
        category: "Content",
        destructive: true,
      },
      {
        name: "reorderSectionItems",
        description: "Move a section item from one position to another",
        parameters: {
          type: "object",
          properties: {
            sectionKey: { type: "string" },
            fromIndex: { type: "number", description: "Current index" },
            toIndex: { type: "number", description: "Target index" },
          },
          required: ["sectionKey", "fromIndex", "toIndex"],
        },
        category: "Content",
      },
      {
        name: "toggleSectionVisibility",
        description: "Show or hide a resume section",
        parameters: {
          type: "object",
          properties: {
            sectionKey: { type: "string", description: "Section key to toggle" },
          },
          required: ["sectionKey"],
        },
        category: "Layout",
      },
      {
        name: "addCustomSection",
        description: "Add a new custom section to the resume",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Section title" },
          },
          required: ["title"],
        },
        category: "Content",
      },
      {
        name: "removeCustomSection",
        description: "Remove a custom section from the resume",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string", description: "Custom section ID to remove" },
          },
          required: ["sectionId"],
        },
        category: "Content",
        destructive: true,
      },
      {
        name: "resetResume",
        description: "Reset the resume to a blank default state. WARNING: This erases all content.",
        parameters: { type: "object", properties: {} },
        category: "Document",
        destructive: true,
      },
      {
        name: "readCurrentState",
        description: "Get the current resume data (read-only, no changes made)",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },
    ],

    getState: () => {
      const { resume } = useResumeEditor.getState();
      return {
        basics: { ...resume.basics },
        sectionKeys: Object.keys(resume.sections),
        sections: Object.fromEntries(
          Object.entries(resume.sections).map(([key, section]) => {
            const s = section as { title?: string; hidden?: boolean; items?: unknown[]; content?: string };
            return [key, {
              title: s.title,
              hidden: s.hidden,
              itemCount: s.items?.length ?? 0,
              content: s.content,
            }];
          })
        ),
        customSections: resume.customSections.map((cs) => ({
          id: cs.id,
          title: cs.title,
          itemCount: cs.items.length,
        })),
        template: resume.metadata.template,
        primaryColor: resume.metadata.design.primaryColor,
        fontPairing: resume.metadata.typography.fontPairing,
        fontScale: resume.metadata.typography.fontScale,
      };
    },

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useResumeEditor.getState();
      try {
        switch (actionName) {
          case "changeTemplate":
            store.changeTemplate(params.templateId as TemplateId);
            return { success: true, message: `Template changed to ${params.templateId}` };

          case "setAccentColor":
            store.setAccentColor(params.color as string);
            return { success: true, message: `Accent color set to ${params.color}` };

          case "setFontPairing":
            store.setFontPairing(params.pairingId as string);
            return { success: true, message: "Font pairing changed" };

          case "setFontScale":
            store.setFontScale(params.scale as "compact" | "standard" | "spacious");
            return { success: true, message: `Font scale set to ${params.scale}` };

          case "addSectionItem":
            store.addSectionItem(
              params.sectionKey as string,
              params.item as Record<string, unknown>
            );
            return { success: true, message: `Item added to ${params.sectionKey}` };

          case "updateSectionItem":
            store.updateSectionItem(
              params.sectionKey as string,
              params.itemIndex as number,
              params.data as Record<string, unknown>
            );
            return { success: true, message: `Section item updated` };

          case "removeSectionItem":
            store.removeSectionItem(
              params.sectionKey as string,
              params.itemIndex as number
            );
            return { success: true, message: `Item removed from ${params.sectionKey}` };

          case "reorderSectionItems":
            store.reorderSectionItems(
              params.sectionKey as string,
              params.fromIndex as number,
              params.toIndex as number
            );
            return { success: true, message: "Section items reordered" };

          case "toggleSectionVisibility":
            store.toggleSectionVisibility(params.sectionKey as string);
            return { success: true, message: `Section "${params.sectionKey}" visibility toggled` };

          case "addCustomSection":
            store.addCustomSection(params.title as string);
            return { success: true, message: `Custom section "${params.title}" added` };

          case "removeCustomSection":
            store.removeCustomSection(params.sectionId as string);
            return { success: true, message: "Custom section removed" };

          case "resetResume":
            store.resetResume();
            return { success: true, message: "Resume reset to defaults" };

          case "readCurrentState": {
            const { resume } = useResumeEditor.getState();
            return {
              success: true,
              message: "Current state read",
              newState: {
                template: resume.metadata.template,
                name: resume.basics.name,
                headline: resume.basics.headline,
                primaryColor: resume.metadata.design.primaryColor,
              },
            };
          }

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Action failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };
}
