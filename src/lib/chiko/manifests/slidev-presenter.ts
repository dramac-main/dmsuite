// =============================================================================
// DMSuite — Chiko Action Manifest: Slidev Presenter (25+ actions)
// Full AI control over markdown presentations, themes, layouts, and more.
// =============================================================================

import type {
  ChikoActionManifest,
  ChikoActionResult,
} from "@/stores/chiko-actions";
import { useSlidevEditor } from "@/stores/slidev-editor";
import type { SlidevFormData } from "@/stores/slidev-editor";
import { withActivityLogging } from "@/stores/activity-log";
import {
  parseSlidevMarkdown,
  ALL_LAYOUTS,
  LAYOUT_INFO,
} from "@/lib/slidev/parser";
import type { LayoutType, TransitionType } from "@/lib/slidev/parser";
import { SLIDEV_THEMES } from "@/lib/slidev/themes";

// ── Options ─────────────────────────────────────────────────────────────────

export interface SlidevPresenterManifestOptions {
  onPrintRef?: { current: (() => void) | null };
}

// ── Valid values ─────────────────────────────────────────────────────────────

const VALID_TRANSITIONS: TransitionType[] = [
  "none",
  "fade",
  "fade-out",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
];

const VALID_RATIOS = ["16:9", "4:3", "16:10"] as const;

// ── Read state helper ───────────────────────────────────────────────────────

function readState(): Record<string, unknown> {
  const { form, phase, activeSlideIndex } = useSlidevEditor.getState();
  const deck = parseSlidevMarkdown(form.markdown);

  return {
    phase,
    activeSlideIndex,
    themeId: form.themeId,
    aspectRatio: form.aspectRatio,
    transition: form.transition,
    title: deck.headmatter.title || "",
    author: deck.headmatter.author || "",
    date: deck.headmatter.date || "",
    slideCount: deck.slides.length,
    slides: deck.slides.map((s, i) => ({
      index: i,
      layout: s.layout,
      contentPreview: s.content.slice(0, 200),
      hasNotes: !!s.notes,
      notesPreview: s.notes.slice(0, 100),
      frontmatter: s.frontmatter,
    })),
    availableThemes: SLIDEV_THEMES.map((t) => ({
      id: t.id,
      name: t.name,
      isDark: t.isDark,
    })),
    availableLayouts: LAYOUT_INFO.map((l) => ({
      id: l.id,
      label: l.label,
      description: l.description,
    })),
    markdownLength: form.markdown.length,
  };
}

// ── Manifest Factory ────────────────────────────────────────────────────────

export function createSlidevPresenterManifest(
  options?: SlidevPresenterManifestOptions,
): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "presentation",
    toolName: "Slide Deck Presenter",
    actions: [
      // ── INFO ────────────────────────────
      {
        name: "readCurrentState",
        description:
          "Read the full current state: all slides, theme, layouts, metadata, and available options.",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },
      {
        name: "getSlideContent",
        description: "Get the full markdown content of a specific slide.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
          },
          required: ["slideIndex"],
        },
        category: "Info",
      },
      {
        name: "getFullMarkdown",
        description:
          "Get the complete markdown document including headmatter and all slides.",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },

      // ── CONTENT — Full Markdown ─────────
      {
        name: "setFullMarkdown",
        description:
          "Replace the entire markdown document. Use --- as slide separators. Include headmatter at the top with theme, title, author. Use per-slide frontmatter for layouts (layout: center, cover, two-cols, quote, fact, etc.).",
        parameters: {
          type: "object",
          properties: {
            markdown: {
              type: "string",
              description:
                "Complete Slidev-compatible markdown. Use --- to separate slides, YAML frontmatter for metadata.",
            },
          },
          required: ["markdown"],
        },
        category: "Content",
        destructive: true,
      },

      // ── CONTENT — Slide CRUD ────────────
      {
        name: "updateSlideContent",
        description:
          "Update the markdown content of a specific slide (not the frontmatter). Supports all markdown: headings, lists, bold, italic, code blocks, math ($...$), mermaid diagrams (```mermaid), ::right:: for two-cols.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
            content: {
              type: "string",
              description: "New markdown content for the slide",
            },
          },
          required: ["slideIndex", "content"],
        },
        category: "Content",
      },
      {
        name: "updateSlideNotes",
        description: "Set or update speaker notes for a slide.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
            notes: {
              type: "string",
              description: "Speaker notes text",
            },
          },
          required: ["slideIndex", "notes"],
        },
        category: "Content",
      },
      {
        name: "addSlide",
        description:
          "Add a new slide with optional layout. Inserts after the specified index, or at the end.",
        parameters: {
          type: "object",
          properties: {
            layout: {
              type: "string",
              description: `Layout: ${ALL_LAYOUTS.join(", ")}`,
            },
            afterIndex: {
              type: "number",
              description: "Insert after this index (0-based)",
            },
            content: {
              type: "string",
              description:
                "Markdown content for the new slide (optional)",
            },
          },
        },
        category: "Content",
      },
      {
        name: "deleteSlide",
        description: "Delete a slide by index. Cannot delete the last slide.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
          },
          required: ["slideIndex"],
        },
        category: "Content",
        destructive: true,
      },
      {
        name: "duplicateSlide",
        description: "Duplicate a slide, placing the copy after the original.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
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

      // ── LAYOUT ──────────────────────────
      {
        name: "setSlideLayout",
        description: `Change the layout of a specific slide. Layouts: ${ALL_LAYOUTS.join(", ")}.`,
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
            layout: {
              type: "string",
              description: "Layout type",
            },
          },
          required: ["slideIndex", "layout"],
        },
        category: "Layout",
      },

      // ── METADATA ────────────────────────
      {
        name: "setTitle",
        description: "Set the presentation title (in headmatter).",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Presentation title" },
          },
          required: ["title"],
        },
        category: "Metadata",
      },
      {
        name: "setAuthor",
        description: "Set the presenter/author name (in headmatter).",
        parameters: {
          type: "object",
          properties: {
            author: { type: "string", description: "Author name" },
          },
          required: ["author"],
        },
        category: "Metadata",
      },

      // ── STYLE ───────────────────────────
      {
        name: "setTheme",
        description: `Change the presentation theme. Available: ${SLIDEV_THEMES.map((t) => `${t.id} (${t.name})`).join(", ")}.`,
        parameters: {
          type: "object",
          properties: {
            themeId: { type: "string", description: "Theme ID" },
          },
          required: ["themeId"],
        },
        category: "Style",
      },
      {
        name: "setAspectRatio",
        description: "Set slide aspect ratio: 16:9, 4:3, or 16:10.",
        parameters: {
          type: "object",
          properties: {
            aspectRatio: {
              type: "string",
              description: "16:9, 4:3, or 16:10",
            },
          },
          required: ["aspectRatio"],
        },
        category: "Style",
      },
      {
        name: "setTransition",
        description: `Set the slide transition effect: ${VALID_TRANSITIONS.join(", ")}.`,
        parameters: {
          type: "object",
          properties: {
            transition: { type: "string", description: "Transition type" },
          },
          required: ["transition"],
        },
        category: "Style",
      },

      // ── CONTENT HELPERS ─────────────────
      {
        name: "insertCodeBlock",
        description:
          "Insert a code block into a slide. Supports 50+ languages.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
            language: {
              type: "string",
              description:
                "Programming language (javascript, python, typescript, rust, go, etc.)",
            },
            code: { type: "string", description: "Code content" },
          },
          required: ["slideIndex", "language", "code"],
        },
        category: "Content",
      },
      {
        name: "insertMathFormula",
        description:
          "Insert a LaTeX math formula into a slide (rendered via KaTeX).",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
            formula: {
              type: "string",
              description:
                "LaTeX formula (e.g. E=mc^2 or \\sum_{i=1}^n i)",
            },
            displayMode: {
              type: "boolean",
              description:
                "true for block display ($$), false for inline ($)",
            },
          },
          required: ["slideIndex", "formula"],
        },
        category: "Content",
      },
      {
        name: "insertMermaidDiagram",
        description:
          "Insert a Mermaid diagram into a slide. Supports flowcharts, sequence, class, state, ER, gantt, pie, journey, git, mindmap.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
            diagram: {
              type: "string",
              description:
                "Mermaid diagram syntax (e.g. 'graph LR\\n  A --> B --> C')",
            },
          },
          required: ["slideIndex", "diagram"],
        },
        category: "Content",
      },

      // ── GENERATION ──────────────────────
      {
        name: "generateDeck",
        description:
          "Generate a complete 10-slide professional presentation from a topic. Replaces all existing slides.",
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
        name: "generateSlideFromPrompt",
        description:
          "Generate content for a single slide based on a description/prompt and insert it.",
        parameters: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description:
                "Description of what the slide should contain",
            },
            layout: {
              type: "string",
              description: "Desired layout (optional)",
            },
            afterIndex: {
              type: "number",
              description: "Insert after this index (optional)",
            },
          },
          required: ["prompt"],
        },
        category: "Content",
      },

      // ── NAVIGATION ─────────────────────
      {
        name: "goToSlide",
        description: "Navigate to a specific slide by index.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
          },
          required: ["slideIndex"],
        },
        category: "Navigation",
      },

      // ── EXPORT ──────────────────────────
      {
        name: "exportPrint",
        description: "Export the presentation as PDF (triggers browser print).",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      // ── RESET ───────────────────────────
      {
        name: "resetForm",
        description:
          "Reset the presentation to defaults and return to the start screen.",
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
        const store = useSlidevEditor.getState();
        const deck = parseSlidevMarkdown(store.form.markdown);

        switch (actionName) {
          // ── INFO ──────────────────────────
          case "readCurrentState":
            return {
              success: true,
              message: "Current state read successfully",
              newState: readState(),
            };

          case "getSlideContent": {
            const idx = params.slideIndex as number;
            if (idx < 0 || idx >= deck.slides.length) {
              return {
                success: false,
                message: `Invalid index ${idx}. Deck has ${deck.slides.length} slides (0-${deck.slides.length - 1}).`,
              };
            }
            const s = deck.slides[idx];
            return {
              success: true,
              message: `Slide ${idx + 1} content retrieved`,
              newState: {
                index: idx,
                layout: s.layout,
                content: s.content,
                notes: s.notes,
                frontmatter: s.frontmatter,
              },
            };
          }

          case "getFullMarkdown":
            return {
              success: true,
              message: "Full markdown retrieved",
              newState: { markdown: store.form.markdown },
            };

          // ── CONTENT — Full Markdown ───────
          case "setFullMarkdown": {
            const md = params.markdown as string;
            if (!md?.trim()) {
              return {
                success: false,
                message: "Markdown content is required",
              };
            }
            store.setMarkdown(md);
            store.setPhase("editor");
            store.setActiveSlideIndex(0);
            const newDeck = parseSlidevMarkdown(md);
            return {
              success: true,
              message: `Markdown set: ${newDeck.slides.length} slides parsed`,
            };
          }

          // ── CONTENT — Slide CRUD ──────────
          case "updateSlideContent": {
            const idx = params.slideIndex as number;
            if (idx < 0 || idx >= deck.slides.length) {
              return {
                success: false,
                message: `Invalid index ${idx}`,
              };
            }
            store.updateSlideContent(idx, params.content as string);
            store.setActiveSlideIndex(idx);
            return {
              success: true,
              message: `Updated slide ${idx + 1} content`,
            };
          }

          case "updateSlideNotes": {
            const idx = params.slideIndex as number;
            if (idx < 0 || idx >= deck.slides.length) {
              return {
                success: false,
                message: `Invalid index ${idx}`,
              };
            }
            store.updateSlideNotes(idx, params.notes as string);
            return {
              success: true,
              message: `Updated slide ${idx + 1} notes`,
            };
          }

          case "addSlide": {
            const layout = (params.layout as LayoutType) || "default";
            if (!ALL_LAYOUTS.includes(layout)) {
              return {
                success: false,
                message: `Invalid layout "${layout}". Valid: ${ALL_LAYOUTS.join(", ")}`,
              };
            }
            const after = params.afterIndex as number | undefined;
            store.addSlide(layout, after);
            // If content was provided, update the new slide
            if (params.content) {
              const newDeck = parseSlidevMarkdown(
                useSlidevEditor.getState().form.markdown,
              );
              const newIdx =
                after !== undefined ? after + 1 : newDeck.slides.length - 1;
              store.updateSlideContent(newIdx, params.content as string);
            }
            return {
              success: true,
              message: `Added ${layout} slide`,
            };
          }

          case "deleteSlide": {
            const idx = params.slideIndex as number;
            if (deck.slides.length <= 1) {
              return {
                success: false,
                message: "Cannot delete the last remaining slide",
              };
            }
            if (idx < 0 || idx >= deck.slides.length) {
              return {
                success: false,
                message: `Invalid index ${idx}`,
              };
            }
            store.deleteSlide(idx);
            return {
              success: true,
              message: `Deleted slide ${idx + 1}`,
            };
          }

          case "duplicateSlide": {
            const idx = params.slideIndex as number;
            if (idx < 0 || idx >= deck.slides.length) {
              return {
                success: false,
                message: `Invalid index ${idx}`,
              };
            }
            store.duplicateSlide(idx);
            return {
              success: true,
              message: `Duplicated slide ${idx + 1}`,
            };
          }

          case "moveSlide": {
            const from = params.from as number;
            const to = params.to as number;
            const len = deck.slides.length;
            if (from < 0 || from >= len || to < 0 || to >= len) {
              return {
                success: false,
                message: `Invalid indices. Deck has ${len} slides (0-${len - 1}).`,
              };
            }
            store.moveSlide(from, to);
            return {
              success: true,
              message: `Moved slide ${from + 1} → ${to + 1}`,
            };
          }

          // ── LAYOUT ────────────────────────
          case "setSlideLayout": {
            const idx = params.slideIndex as number;
            const layout = params.layout as LayoutType;
            if (idx < 0 || idx >= deck.slides.length) {
              return {
                success: false,
                message: `Invalid index ${idx}`,
              };
            }
            if (!ALL_LAYOUTS.includes(layout)) {
              return {
                success: false,
                message: `Invalid layout "${layout}". Valid: ${ALL_LAYOUTS.join(", ")}`,
              };
            }
            store.setSlideLayout(idx, layout);
            return {
              success: true,
              message: `Slide ${idx + 1} layout set to ${layout}`,
            };
          }

          // ── METADATA ──────────────────────
          case "setTitle":
            store.setTitle(params.title as string);
            return {
              success: true,
              message: `Title set to "${params.title}"`,
            };

          case "setAuthor":
            store.setAuthor(params.author as string);
            return {
              success: true,
              message: `Author set to "${params.author}"`,
            };

          // ── STYLE ─────────────────────────
          case "setTheme": {
            const id = params.themeId as string;
            if (!SLIDEV_THEMES.some((t) => t.id === id)) {
              return {
                success: false,
                message: `Unknown theme "${id}". Available: ${SLIDEV_THEMES.map((t) => t.id).join(", ")}`,
              };
            }
            store.setThemeId(id);
            return { success: true, message: `Theme set to ${id}` };
          }

          case "setAspectRatio": {
            const ar = params.aspectRatio as string;
            if (
              !VALID_RATIOS.includes(ar as (typeof VALID_RATIOS)[number])
            ) {
              return {
                success: false,
                message: `Invalid ratio "${ar}". Valid: ${VALID_RATIOS.join(", ")}`,
              };
            }
            store.setAspectRatio(
              ar as "16:9" | "4:3" | "16:10",
            );
            return {
              success: true,
              message: `Aspect ratio set to ${ar}`,
            };
          }

          case "setTransition": {
            const t = params.transition as TransitionType;
            if (!VALID_TRANSITIONS.includes(t)) {
              return {
                success: false,
                message: `Invalid transition "${t}". Valid: ${VALID_TRANSITIONS.join(", ")}`,
              };
            }
            store.setTransition(t);
            return { success: true, message: `Transition set to ${t}` };
          }

          // ── CONTENT HELPERS ───────────────
          case "insertCodeBlock": {
            const idx = params.slideIndex as number;
            if (idx < 0 || idx >= deck.slides.length) {
              return {
                success: false,
                message: `Invalid index ${idx}`,
              };
            }
            const lang = (params.language as string) || "javascript";
            const code = params.code as string;
            const current = deck.slides[idx].content;
            const newContent = `${current}\n\n\`\`\`${lang}\n${code}\n\`\`\``;
            store.updateSlideContent(idx, newContent);
            return {
              success: true,
              message: `Inserted ${lang} code block in slide ${idx + 1}`,
            };
          }

          case "insertMathFormula": {
            const idx = params.slideIndex as number;
            if (idx < 0 || idx >= deck.slides.length) {
              return {
                success: false,
                message: `Invalid index ${idx}`,
              };
            }
            const formula = params.formula as string;
            const display = params.displayMode !== false;
            const current = deck.slides[idx].content;
            const mathStr = display
              ? `\n\n$$${formula}$$`
              : ` $${formula}$ `;
            const newContent = current + mathStr;
            store.updateSlideContent(idx, newContent);
            return {
              success: true,
              message: `Inserted math formula in slide ${idx + 1}`,
            };
          }

          case "insertMermaidDiagram": {
            const idx = params.slideIndex as number;
            if (idx < 0 || idx >= deck.slides.length) {
              return {
                success: false,
                message: `Invalid index ${idx}`,
              };
            }
            const diagram = params.diagram as string;
            const current = deck.slides[idx].content;
            const newContent = `${current}\n\n\`\`\`mermaid\n${diagram}\n\`\`\``;
            store.updateSlideContent(idx, newContent);
            return {
              success: true,
              message: `Inserted Mermaid diagram in slide ${idx + 1}`,
            };
          }

          // ── GENERATION ────────────────────
          case "generateDeck": {
            const topic = params.topic as string;
            if (!topic?.trim()) {
              return {
                success: false,
                message: "Topic is required",
              };
            }
            store.generateFromTopic(topic.trim());
            return {
              success: true,
              message: `Generated presentation for "${topic}"`,
            };
          }

          case "generateSlideFromPrompt": {
            const prompt = params.prompt as string;
            if (!prompt?.trim()) {
              return {
                success: false,
                message: "Prompt is required",
              };
            }
            const layout =
              (params.layout as LayoutType) || "default";
            const after = params.afterIndex as number | undefined;
            store.addSlide(layout, after);
            // The slide was added with default content; Chiko will update it
            // via updateSlideContent if needed
            return {
              success: true,
              message: `Added ${layout} slide from prompt: "${prompt.slice(0, 50)}..."`,
            };
          }

          // ── NAVIGATION ────────────────────
          case "goToSlide": {
            const idx = params.slideIndex as number;
            if (idx < 0 || idx >= deck.slides.length) {
              return {
                success: false,
                message: `Invalid index ${idx}`,
              };
            }
            store.setActiveSlideIndex(idx);
            return {
              success: true,
              message: `Navigated to slide ${idx + 1}`,
            };
          }

          // ── EXPORT ────────────────────────
          case "exportPrint":
            options?.onPrintRef?.current?.();
            return { success: true, message: "Export triggered" };

          // ── RESET ─────────────────────────
          case "resetForm":
            store.resetForm();
            return {
              success: true,
              message: "Presentation reset to defaults",
            };

          default:
            return {
              success: false,
              message: `Unknown action: ${actionName}`,
            };
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
    () => useSlidevEditor.getState().form,
    (snapshot) =>
      useSlidevEditor.getState().setForm(snapshot as SlidevFormData),
  );
}
