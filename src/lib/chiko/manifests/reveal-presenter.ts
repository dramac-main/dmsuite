// =============================================================================
// DMSuite — Chiko Action Manifest: Reveal.js Presenter
// Cloned from the working Slidev presenter manifest pattern.
//
// Originally based on reveal.js — MIT License
// Copyright (c) 2011-2026 Hakim El Hattab, https://hakim.se
// =============================================================================

import type {
  ChikoActionManifest,
  ChikoActionResult,
} from "@/stores/chiko-actions";
import {
  useRevealPresenterEditor,
  REVEAL_THEMES,
  REVEAL_TRANSITIONS,
  type RevealFormData,
  type RevealThemeId,
  type RevealTransition,
  type RevealTransitionSpeed,
} from "@/stores/reveal-presenter-editor";
import { withActivityLogging } from "@/stores/activity-log";

// -- Valid values -----------------------------------------------------------

const VALID_THEMES = REVEAL_THEMES.map((t) => t.id);
const VALID_TRANSITIONS = REVEAL_TRANSITIONS.map((t) => t.id);
const VALID_SPEEDS: RevealTransitionSpeed[] = ["default", "fast", "slow"];

// -- Helpers ----------------------------------------------------------------

function ok(
  message: string,
  newState?: Record<string, unknown>,
): ChikoActionResult {
  return { success: true, message, newState };
}

function fail(message: string): ChikoActionResult {
  return { success: false, message };
}

function getStore() {
  return useRevealPresenterEditor.getState();
}

// -- Read state helper (reused by getState + readCurrentState action) -------

function readState(): Record<string, unknown> {
  const s = getStore();
  const slides = s.form.slides.map((sl, i) => ({
    index: i,
    contentPreview: sl.content.slice(0, 120),
    hasNotes: !!sl.notes,
    background: sl.background ?? null,
    transition: sl.transition ?? null,
  }));
  return {
    phase: s.phase,
    title: s.form.title,
    author: s.form.author,
    themeId: s.form.themeId,
    transition: s.form.transition,
    transitionSpeed: s.form.transitionSpeed,
    slideCount: s.form.slides.length,
    activeSlideIndex: s.activeSlideIndex,
    controls: s.form.controls,
    progress: s.form.progress,
    slideNumber: s.form.slideNumber,
    loop: s.form.loop,
    autoSlide: s.form.autoSlide,
    slides,
    validThemes: VALID_THEMES,
    validTransitions: VALID_TRANSITIONS,
    validSpeeds: VALID_SPEEDS,
  };
}

// -- Manifest Factory -------------------------------------------------------

export function createRevealPresenterManifest(): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "reveal-presenter",
    toolName: "Reveal.js Presentation Designer",
    actions: [
      // -- INFO ---------------------------------------------------------
      {
        name: "readCurrentState",
        description:
          "Read the full current state: title, author, theme, transition, all slides summary, active index, and valid options.",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },
      {
        name: "getSlideContent",
        description:
          "Get the full HTML content and speaker notes for a specific slide.",
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
        name: "getAllSlides",
        description:
          "Get an array of all slides with their full content, notes, and backgrounds.",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },

      // -- CONTENT: Full Deck Generation --------------------------------
      {
        name: "generateFullDeck",
        description:
          "Replace ALL slides with a brand-new set. Provide title and an array of slide objects. Each slide must have 'content' (HTML string). Optionally include 'notes' and 'background'. This is the PRIMARY way to build a presentation from scratch.",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Presentation title",
            },
            author: {
              type: "string",
              description: "Author/presenter name (optional)",
            },
            themeId: {
              type: "string",
              description: `Theme ID. Valid: ${VALID_THEMES.join(", ")}`,
            },
            transition: {
              type: "string",
              description: `Transition. Valid: ${VALID_TRANSITIONS.join(", ")}`,
            },
            slides: {
              type: "array",
              description:
                "Array of slide objects. Each must have 'content' (HTML).",
              items: {
                type: "object",
                properties: {
                  content: {
                    type: "string",
                    description:
                      "HTML content for the slide (use <h1>, <h2>, <p>, <ul>, <li>, <code>, <blockquote>, <img>, etc.)",
                  },
                  notes: {
                    type: "string",
                    description: "Speaker notes (optional)",
                  },
                  background: {
                    type: "string",
                    description:
                      "Background CSS color or image URL (optional)",
                  },
                },
                required: ["content"],
              },
            },
          },
          required: ["title", "slides"],
        },
        category: "Content",
        destructive: true,
      },

      // -- CONTENT: Slide CRUD ------------------------------------------
      {
        name: "updateSlideContent",
        description:
          "Update the HTML content of a specific slide. Use valid HTML: <h1>, <h2>, <p>, <ul>, <li>, <code>, <blockquote>, <img>, etc.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
            content: {
              type: "string",
              description: "New HTML content for the slide",
            },
          },
          required: ["slideIndex", "content"],
        },
        category: "Content",
      },
      {
        name: "updateSlideNotes",
        description: "Set or update speaker notes for a specific slide.",
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
          "Add a new slide. Optionally specify HTML content, notes, and insertion point.",
        parameters: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description:
                "HTML content for the new slide (optional, defaults to placeholder)",
            },
            notes: {
              type: "string",
              description: "Speaker notes (optional)",
            },
            afterIndex: {
              type: "number",
              description:
                "Insert after this 0-based index. Omit to append at end.",
            },
          },
        },
        category: "Content",
      },
      {
        name: "deleteSlide",
        description:
          "Delete a slide by index. Cannot delete the last remaining slide.",
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
        description:
          "Duplicate a slide, placing the copy after the original.",
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
            fromIndex: {
              type: "number",
              description: "Current 0-based index",
            },
            toIndex: {
              type: "number",
              description: "Target 0-based index",
            },
          },
          required: ["fromIndex", "toIndex"],
        },
        category: "Content",
      },
      {
        name: "setSlideBackground",
        description:
          "Set the background color or image URL for a specific slide.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
            background: {
              type: "string",
              description: "CSS color (#hex, rgb, named) or image URL",
            },
          },
          required: ["slideIndex", "background"],
        },
        category: "Content",
      },

      // -- METADATA -----------------------------------------------------
      {
        name: "setTitle",
        description: "Set the presentation title.",
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
        description: "Set the author/presenter name.",
        parameters: {
          type: "object",
          properties: {
            author: { type: "string", description: "Author name" },
          },
          required: ["author"],
        },
        category: "Metadata",
      },

      // -- STYLE --------------------------------------------------------
      {
        name: "setTheme",
        description: `Set the reveal.js theme. Available: ${REVEAL_THEMES.map((t) => `${t.id} (${t.name})`).join(", ")}.`,
        parameters: {
          type: "object",
          properties: {
            themeId: {
              type: "string",
              description: "Theme ID",
            },
          },
          required: ["themeId"],
        },
        category: "Style",
      },
      {
        name: "setTransition",
        description: `Set the global slide transition: ${VALID_TRANSITIONS.join(", ")}.`,
        parameters: {
          type: "object",
          properties: {
            transition: {
              type: "string",
              description: "Transition type",
            },
          },
          required: ["transition"],
        },
        category: "Style",
      },
      {
        name: "setTransitionSpeed",
        description: `Set transition speed: ${VALID_SPEEDS.join(", ")}.`,
        parameters: {
          type: "object",
          properties: {
            speed: {
              type: "string",
              description: "Transition speed",
            },
          },
          required: ["speed"],
        },
        category: "Style",
      },
      {
        name: "setSlideTransition",
        description:
          "Override the transition for a specific slide only.",
        parameters: {
          type: "object",
          properties: {
            slideIndex: {
              type: "number",
              description: "0-based slide index",
            },
            transition: {
              type: "string",
              description: "Transition type",
            },
          },
          required: ["slideIndex", "transition"],
        },
        category: "Style",
      },

      // -- OPTIONS ------------------------------------------------------
      {
        name: "setControls",
        description: "Show or hide navigation arrow controls.",
        parameters: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              description: "true to show, false to hide",
            },
          },
          required: ["enabled"],
        },
        category: "Options",
      },
      {
        name: "setProgress",
        description: "Show or hide the progress bar.",
        parameters: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              description: "true to show, false to hide",
            },
          },
          required: ["enabled"],
        },
        category: "Options",
      },
      {
        name: "setSlideNumber",
        description: "Show or hide slide numbers.",
        parameters: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              description: "true to show, false to hide",
            },
          },
          required: ["enabled"],
        },
        category: "Options",
      },
      {
        name: "setLoop",
        description: "Enable or disable looping through slides.",
        parameters: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              description: "true to enable, false to disable",
            },
          },
          required: ["enabled"],
        },
        category: "Options",
      },
      {
        name: "setAutoSlide",
        description:
          "Set auto-slide interval in milliseconds (0 to disable).",
        parameters: {
          type: "object",
          properties: {
            ms: {
              type: "number",
              description: "Milliseconds between slides. 0 = disabled.",
            },
          },
          required: ["ms"],
        },
        category: "Options",
      },

      // -- NAVIGATION ---------------------------------------------------
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

      // -- EXPORT -------------------------------------------------------
      {
        name: "exportHtml",
        description:
          "Generate the full standalone HTML file for this presentation and return it.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      // -- RESET --------------------------------------------------------
      {
        name: "resetPresentation",
        description: "Reset the entire presentation to defaults.",
        parameters: { type: "object", properties: {} },
        category: "Reset",
        destructive: true,
      },
    ],

    // -- getState -------------------------------------------------------
    getState: readState,

    // -- executeAction --------------------------------------------------
    executeAction: (
      actionName: string,
      params: Record<string, unknown>,
    ): ChikoActionResult => {
      const store = getStore();

      switch (actionName) {
        // -- Info -------------------------------------------------------
        case "readCurrentState": {
          return ok(JSON.stringify(readState(), null, 2));
        }

        case "getSlideContent": {
          const idx = params.slideIndex as number;
          const slide = store.form.slides[idx];
          if (!slide) return fail(`No slide at index ${idx}`);
          return ok(
            JSON.stringify({
              content: slide.content,
              notes: slide.notes,
              background: slide.background,
            }),
          );
        }

        case "getAllSlides": {
          const all = store.form.slides.map((sl, i) => ({
            index: i,
            content: sl.content,
            notes: sl.notes,
            background: sl.background,
          }));
          return ok(JSON.stringify(all, null, 2));
        }

        // -- Content: Full Deck Generation ------------------------------
        case "generateFullDeck": {
          const title = params.title as string | undefined;
          const author = params.author as string | undefined;
          const themeId = params.themeId as string | undefined;
          const transition = params.transition as string | undefined;
          const slidesData = params.slides as
            | Array<{
                content: string;
                notes?: string;
                background?: string;
              }>
            | undefined;

          if (!Array.isArray(slidesData) || slidesData.length === 0) {
            return fail(
              "Must provide a 'slides' array with at least one slide object containing 'content'.",
            );
          }

          // Set metadata
          if (title) store.setTitle(title);
          if (author) store.setAuthor(author);
          if (
            themeId &&
            VALID_THEMES.includes(themeId as RevealThemeId)
          ) {
            store.setTheme(themeId as RevealThemeId);
          }
          if (
            transition &&
            VALID_TRANSITIONS.includes(transition as RevealTransition)
          ) {
            store.setTransition(transition as RevealTransition);
          }

          // Build slides
          const newSlides = slidesData.map((sl) => ({
            id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            content: sl.content || "<h2>Slide</h2>",
            notes: sl.notes ?? "",
            background: sl.background,
          }));

          store.setSlides(newSlides);
          store.setActiveSlide(0);
          store.setPhase("editor");

          return ok(
            `Generated presentation "${title}" with ${newSlides.length} slides (theme: ${themeId ?? store.form.themeId}, transition: ${transition ?? store.form.transition})`,
          );
        }

        // -- Content: Slide CRUD ----------------------------------------
        case "updateSlideContent": {
          const idx = params.slideIndex as number;
          const content = params.content as string;
          if (idx < 0 || idx >= store.form.slides.length)
            return fail(`Invalid slide index ${idx}`);
          if (!content) return fail("Content is required");
          store.updateSlideContent(idx, content);
          return ok(`Updated slide ${idx + 1} content`);
        }

        case "updateSlideNotes": {
          const idx = params.slideIndex as number;
          const notes = params.notes as string;
          if (idx < 0 || idx >= store.form.slides.length)
            return fail(`Invalid slide index ${idx}`);
          store.updateSlideNotes(idx, notes ?? "");
          return ok(`Updated slide ${idx + 1} notes`);
        }

        case "addSlide": {
          const content = params.content as string | undefined;
          const notes = params.notes as string | undefined;
          const afterIndex = params.afterIndex as number | undefined;
          store.addSlide(content, notes, afterIndex);
          return ok("Added new slide");
        }

        case "deleteSlide": {
          const idx = params.slideIndex as number;
          if (store.form.slides.length <= 1)
            return fail("Cannot delete the last remaining slide");
          if (idx < 0 || idx >= store.form.slides.length)
            return fail(`Invalid slide index ${idx}`);
          store.deleteSlide(idx);
          return ok(`Deleted slide ${idx + 1}`);
        }

        case "duplicateSlide": {
          const idx = params.slideIndex as number;
          if (idx < 0 || idx >= store.form.slides.length)
            return fail(`Invalid slide index ${idx}`);
          store.duplicateSlide(idx);
          return ok(`Duplicated slide ${idx + 1}`);
        }

        case "moveSlide": {
          const from = params.fromIndex as number;
          const to = params.toIndex as number;
          store.moveSlide(from, to);
          return ok(`Moved slide from position ${from + 1} to ${to + 1}`);
        }

        case "setSlideBackground": {
          const idx = params.slideIndex as number;
          const bg = params.background as string;
          if (idx < 0 || idx >= store.form.slides.length)
            return fail(`Invalid slide index ${idx}`);
          store.updateSlideBackground(idx, bg);
          return ok(`Set slide ${idx + 1} background to "${bg}"`);
        }

        // -- Metadata ---------------------------------------------------
        case "setTitle": {
          const title = params.title as string;
          if (!title) return fail("Title is required");
          store.setTitle(title);
          return ok(`Title set to "${title}"`);
        }

        case "setAuthor": {
          const author = params.author as string;
          store.setAuthor(author ?? "");
          return ok(`Author set to "${author}"`);
        }

        // -- Style ------------------------------------------------------
        case "setTheme": {
          const themeId = params.themeId as string;
          if (!VALID_THEMES.includes(themeId as RevealThemeId)) {
            return fail(
              `Invalid theme "${themeId}". Valid: ${VALID_THEMES.join(", ")}`,
            );
          }
          store.setTheme(themeId as RevealThemeId);
          return ok(`Theme set to "${themeId}"`);
        }

        case "setTransition": {
          const transition = params.transition as string;
          if (
            !VALID_TRANSITIONS.includes(transition as RevealTransition)
          ) {
            return fail(
              `Invalid transition "${transition}". Valid: ${VALID_TRANSITIONS.join(", ")}`,
            );
          }
          store.setTransition(transition as RevealTransition);
          return ok(`Transition set to "${transition}"`);
        }

        case "setTransitionSpeed": {
          const speed = params.speed as string;
          if (!VALID_SPEEDS.includes(speed as RevealTransitionSpeed)) {
            return fail(
              `Invalid speed "${speed}". Valid: ${VALID_SPEEDS.join(", ")}`,
            );
          }
          store.setTransitionSpeed(speed as RevealTransitionSpeed);
          return ok(`Transition speed set to "${speed}"`);
        }

        case "setSlideTransition": {
          const idx = params.slideIndex as number;
          const transition = params.transition as string;
          if (
            !VALID_TRANSITIONS.includes(transition as RevealTransition)
          ) {
            return fail(
              `Invalid transition "${transition}". Valid: ${VALID_TRANSITIONS.join(", ")}`,
            );
          }
          store.updateSlideTransition(
            idx,
            transition as RevealTransition,
          );
          return ok(
            `Slide ${idx + 1} transition set to "${transition}"`,
          );
        }

        // -- Options ----------------------------------------------------
        case "setControls": {
          store.setControls(!!params.enabled);
          return ok(
            `Controls ${params.enabled ? "enabled" : "disabled"}`,
          );
        }

        case "setProgress": {
          store.setProgress(!!params.enabled);
          return ok(
            `Progress bar ${params.enabled ? "enabled" : "disabled"}`,
          );
        }

        case "setSlideNumber": {
          store.setSlideNumber(!!params.enabled);
          return ok(
            `Slide numbers ${params.enabled ? "enabled" : "disabled"}`,
          );
        }

        case "setLoop": {
          store.setLoop(!!params.enabled);
          return ok(`Loop ${params.enabled ? "enabled" : "disabled"}`);
        }

        case "setAutoSlide": {
          const ms = params.ms as number;
          store.setAutoSlide(ms);
          return ok(
            ms > 0
              ? `Auto-slide set to ${ms}ms`
              : "Auto-slide disabled",
          );
        }

        // -- Navigation -------------------------------------------------
        case "goToSlide": {
          const idx = params.slideIndex as number;
          store.setActiveSlide(idx);
          return ok(`Navigated to slide ${idx + 1}`);
        }

        // -- Export -----------------------------------------------------
        case "exportHtml": {
          const html = store.generateHTML();
          return ok(html);
        }

        // -- Reset ------------------------------------------------------
        case "resetPresentation": {
          store.resetForm();
          return ok("Presentation reset to defaults");
        }

        default:
          return fail(`Unknown action: "${actionName}"`);
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useRevealPresenterEditor.getState().form,
    (snapshot) =>
      useRevealPresenterEditor.getState().setForm(snapshot as RevealFormData),
  );
}
