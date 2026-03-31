// =============================================================================
// DMSuite — Chiko Action Manifest: Presentation Designer (AI-first)
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { usePresentationEditor } from "@/stores/presentation-editor";
import { withActivityLogging } from "@/stores/activity-log";
import type { PresentationFormData } from "@/stores/presentation-editor";
import type { SlideLayout } from "@/components/workspaces/presentation-designer/types";
import { PRESENTATION_THEMES } from "@/components/workspaces/presentation-designer/themes";

// ── Options ──

export interface PresentationManifestOptions {
  onPrintRef?: React.RefObject<(() => void) | null>;
}

// ── Valid layouts for validation ──

const VALID_LAYOUTS: SlideLayout[] = [
  "title", "section", "content", "bullets", "two-column",
  "quote", "image-text", "big-number", "blank",
];

// ── Read state helper ──

function readState(): Record<string, unknown> {
  const { form, phase, activeSlideIndex } = usePresentationEditor.getState();
  return {
    title: form.title,
    author: form.author,
    company: form.company,
    date: form.date,
    themeId: form.themeId,
    aspectRatio: form.aspectRatio,
    phase,
    activeSlideIndex,
    slideCount: form.slides.length,
    slides: form.slides.map((s, i) => ({
      index: i,
      id: s.id,
      layout: s.layout,
      title: s.title,
      subtitle: s.subtitle,
      body: s.body,
      bullets: s.bullets,
      leftHeading: s.leftHeading,
      leftBody: s.leftBody,
      rightHeading: s.rightHeading,
      rightBody: s.rightBody,
      quoteText: s.quoteText,
      quoteAuthor: s.quoteAuthor,
      bigNumber: s.bigNumber,
      bigNumberLabel: s.bigNumberLabel,
      sectionNumber: s.sectionNumber,
      notes: s.notes,
    })),
    availableThemes: PRESENTATION_THEMES.map((t) => t.id),
  };
}

// ── Manifest Factory ──

export function createPresentationManifest(
  options?: PresentationManifestOptions,
): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "presentation",
    toolName: "Presentation Designer",
    actions: [
      {
        name: "readCurrentState",
        description:
          "Read the full current state of the presentation including all slides, theme, and metadata.",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },
      {
        name: "updatePresentationDetails",
        description:
          "Update presentation metadata: title, author, company, date.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Presentation title" },
            author: { type: "string", description: "Presenter name" },
            company: { type: "string", description: "Company / org name" },
            date: { type: "string", description: "Date string" },
          },
        },
        category: "Content",
      },
      {
        name: "setTheme",
        description:
          "Change the presentation theme. Available themes: midnight, corporate, sunset, forest, ocean, minimal, neon, earth.",
        parameters: {
          type: "object",
          properties: {
            themeId: { type: "string", description: "Theme identifier" },
          },
          required: ["themeId"],
        },
        category: "Style",
      },
      {
        name: "setAspectRatio",
        description: "Set the slide aspect ratio: 16:9 or 4:3.",
        parameters: {
          type: "object",
          properties: {
            aspectRatio: { type: "string", description: "'16:9' or '4:3'" },
          },
          required: ["aspectRatio"],
        },
        category: "Style",
      },
      {
        name: "updateSlide",
        description:
          "Update a slide's content by index. Pass only the fields you want to change. Fields depend on layout — title, subtitle, body, bullets (array), leftHeading, leftBody, rightHeading, rightBody, quoteText, quoteAuthor, bigNumber, bigNumberLabel, sectionNumber, imageUrl, notes, layout.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: { type: "number", description: "0-based slide index" },
            layout: { type: "string", description: "Change slide layout" },
            title: { type: "string" },
            subtitle: { type: "string" },
            body: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
            leftHeading: { type: "string" },
            leftBody: { type: "string" },
            rightHeading: { type: "string" },
            rightBody: { type: "string" },
            quoteText: { type: "string" },
            quoteAuthor: { type: "string" },
            bigNumber: { type: "string" },
            bigNumberLabel: { type: "string" },
            sectionNumber: { type: "string" },
            imageUrl: { type: "string" },
            notes: { type: "string" },
          },
          required: ["slideIndex"],
        },
        category: "Content",
      },
      {
        name: "addSlide",
        description:
          "Add a new slide. Optionally specify layout (title, section, content, bullets, two-column, quote, image-text, big-number, blank) and insertion index.",
        parameters: {
          type: "object",
          properties: {
            layout: { type: "string", description: "Slide layout type" },
            afterIndex: { type: "number", description: "Insert after this slide index" },
          },
        },
        category: "Content",
      },
      {
        name: "deleteSlide",
        description: "Delete a slide by index. Cannot delete the last remaining slide.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: { type: "number", description: "0-based slide index" },
          },
          required: ["slideIndex"],
        },
        category: "Content",
        destructive: true,
      },
      {
        name: "duplicateSlide",
        description: "Duplicate a slide by index.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: { type: "number", description: "0-based slide index" },
          },
          required: ["slideIndex"],
        },
        category: "Content",
      },
      {
        name: "moveSlide",
        description: "Move a slide from one position to another.",
        parameters: {
          type: "object",
          properties: {
            from: { type: "number", description: "Current 0-based index" },
            to: { type: "number", description: "Target 0-based index" },
          },
          required: ["from", "to"],
        },
        category: "Content",
      },
      {
        name: "generateDeck",
        description:
          "Generate a full 10-slide presentation from a topic. Replaces all existing slides.",
        parameters: {
          type: "object",
          properties: {
            topic: { type: "string", description: "Presentation topic" },
          },
          required: ["topic"],
        },
        category: "Content",
        destructive: true,
      },
      {
        name: "exportPrint",
        description: "Export the presentation as PDF (triggers browser print).",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
      {
        name: "resetForm",
        description: "Reset the presentation to defaults and return to the prompt phase.",
        parameters: { type: "object", properties: {} },
        category: "Content",
        destructive: true,
      },
    ],

    getState: readState,

    executeAction: (
      actionName: string,
      params: Record<string, unknown>,
    ): ChikoActionResult => {
      try {
        const store = usePresentationEditor.getState();

        switch (actionName) {
          case "readCurrentState":
            return {
              success: true,
              message: "Current state read successfully",
              newState: readState(),
            };

          case "updatePresentationDetails": {
            if (typeof params.title === "string") store.setTitle(params.title);
            if (typeof params.author === "string") store.setAuthor(params.author);
            if (typeof params.company === "string") store.setCompany(params.company);
            if (typeof params.date === "string") store.setDate(params.date);
            return { success: true, message: "Updated presentation details" };
          }

          case "setTheme": {
            const id = params.themeId as string;
            if (!PRESENTATION_THEMES.some((t) => t.id === id)) {
              return {
                success: false,
                message: `Unknown theme "${id}". Available: ${PRESENTATION_THEMES.map((t) => t.id).join(", ")}`,
              };
            }
            store.setThemeId(id);
            return { success: true, message: `Theme set to ${id}` };
          }

          case "setAspectRatio": {
            const ar = params.aspectRatio as string;
            if (ar !== "16:9" && ar !== "4:3") {
              return { success: false, message: "Aspect ratio must be '16:9' or '4:3'" };
            }
            store.setAspectRatio(ar);
            return { success: true, message: `Aspect ratio set to ${ar}` };
          }

          case "updateSlide": {
            const idx = params.slideIndex as number;
            const slides = store.form.slides;
            if (idx < 0 || idx >= slides.length) {
              return { success: false, message: `Invalid slide index ${idx}. Deck has ${slides.length} slides (0-${slides.length - 1}).` };
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { slideIndex: _si, ...patch } = params;

            // Validate layout if changing
            if (typeof patch.layout === "string" && !VALID_LAYOUTS.includes(patch.layout as SlideLayout)) {
              return { success: false, message: `Invalid layout "${patch.layout}". Valid: ${VALID_LAYOUTS.join(", ")}` };
            }

            // Handle bullets separately
            if (Array.isArray(patch.bullets)) {
              store.updateSlideBullets(idx, patch.bullets as string[]);
              delete patch.bullets;
            }

            if (Object.keys(patch).length > 0) {
              store.updateSlide(idx, patch as Record<string, unknown>);
            }
            store.setActiveSlideIndex(idx);
            return { success: true, message: `Updated slide ${idx + 1}` };
          }

          case "addSlide": {
            const layout = (params.layout as SlideLayout) || "blank";
            if (!VALID_LAYOUTS.includes(layout)) {
              return { success: false, message: `Invalid layout "${layout}". Valid: ${VALID_LAYOUTS.join(", ")}` };
            }
            const after = params.afterIndex as number | undefined;
            store.addSlide(layout, after);
            return { success: true, message: `Added ${layout} slide` };
          }

          case "deleteSlide": {
            const idx = params.slideIndex as number;
            if (store.form.slides.length <= 1) {
              return { success: false, message: "Cannot delete the last remaining slide" };
            }
            if (idx < 0 || idx >= store.form.slides.length) {
              return { success: false, message: `Invalid slide index ${idx}` };
            }
            store.deleteSlide(idx);
            return { success: true, message: `Deleted slide ${idx + 1}` };
          }

          case "duplicateSlide": {
            const idx = params.slideIndex as number;
            if (idx < 0 || idx >= store.form.slides.length) {
              return { success: false, message: `Invalid slide index ${idx}` };
            }
            store.duplicateSlide(idx);
            return { success: true, message: `Duplicated slide ${idx + 1}` };
          }

          case "moveSlide": {
            const from = params.from as number;
            const to = params.to as number;
            const len = store.form.slides.length;
            if (from < 0 || from >= len || to < 0 || to >= len) {
              return { success: false, message: `Invalid indices. Deck has ${len} slides (0-${len - 1}).` };
            }
            store.moveSlide(from, to);
            return { success: true, message: `Moved slide from position ${from + 1} to ${to + 1}` };
          }

          case "generateDeck": {
            const topic = params.topic as string;
            if (!topic?.trim()) {
              return { success: false, message: "Topic is required" };
            }
            store.generateFromTopic(topic.trim());
            return { success: true, message: `Generated 10-slide deck for "${topic}"` };
          }

          case "exportPrint":
            options?.onPrintRef?.current?.();
            return { success: true, message: "Export triggered" };

          case "resetForm":
            store.resetForm();
            return { success: true, message: "Presentation reset to defaults" };

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return {
          success: false,
          message: `Error: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => usePresentationEditor.getState().form,
    (snapshot) =>
      usePresentationEditor.getState().setForm(snapshot as PresentationFormData),
  );
}
