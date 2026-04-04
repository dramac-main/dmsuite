// =============================================================================
// DMSuite — Chiko Action Manifest: Reveal.js Presenter (25+ actions)
// Full AI control over HTML presentations, themes, transitions, and more.
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

// ── Valid values ────────────────────────────────────────────────────────────

const VALID_THEMES = REVEAL_THEMES.map((t) => t.id);
const VALID_TRANSITIONS = REVEAL_TRANSITIONS.map((t) => t.id);
const VALID_SPEEDS: RevealTransitionSpeed[] = ["default", "fast", "slow"];

// ── Helpers ─────────────────────────────────────────────────────────────────

function ok(message: string, newState?: Record<string, unknown>): ChikoActionResult {
  return { success: true, message, newState };
}

function fail(message: string): ChikoActionResult {
  return { success: false, message };
}

function getStore() {
  return useRevealPresenterEditor.getState();
}

// ── Manifest Factory ────────────────────────────────────────────────────────

export function createRevealPresenterManifest(): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "reveal-presenter",
    toolName: "Reveal.js Presentation Designer",
    actions: [
      // ── Info ──
      {
        name: "read_state",
        description: "Get a summary of the current presentation state: title, author, theme, transition, slide count, active slide index.",
        parameters: {},
        category: "info",
      },
      {
        name: "get_slide_content",
        description: "Get the HTML content and speaker notes for a specific slide by index (0-based).",
        parameters: { slideIndex: { type: "number", description: "0-based slide index" } },
        category: "info",
      },
      {
        name: "get_all_slides",
        description: "Get an array of all slides with their content and notes.",
        parameters: {},
        category: "info",
      },

      // ── Content ──
      {
        name: "update_slide_content",
        description: "Update the HTML content of a specific slide. Use valid HTML: <h1>, <h2>, <p>, <ul>, <li>, <code>, <blockquote>, <img>, etc.",
        parameters: {
          slideIndex: { type: "number", description: "0-based slide index" },
          content: { type: "string", description: "New HTML content for the slide" },
        },
        category: "content",
      },
      {
        name: "update_slide_notes",
        description: "Update the speaker notes for a specific slide.",
        parameters: {
          slideIndex: { type: "number", description: "0-based slide index" },
          notes: { type: "string", description: "Speaker notes text" },
        },
        category: "content",
      },
      {
        name: "add_slide",
        description: "Add a new slide after the specified index. Provide HTML content and optional speaker notes.",
        parameters: {
          content: { type: "string", description: "HTML content for the new slide" },
          notes: { type: "string", description: "Optional speaker notes" },
          afterIndex: { type: "number", description: "Insert after this index. Omit to append at end." },
        },
        category: "content",
      },
      {
        name: "delete_slide",
        description: "Delete a slide at the specified index. Cannot delete if only 1 slide remains.",
        parameters: { slideIndex: { type: "number", description: "0-based slide index" } },
        category: "content",
        destructive: true,
      },
      {
        name: "duplicate_slide",
        description: "Duplicate a slide at the specified index.",
        parameters: { slideIndex: { type: "number", description: "0-based slide index" } },
        category: "content",
      },
      {
        name: "move_slide",
        description: "Move a slide from one position to another.",
        parameters: {
          fromIndex: { type: "number", description: "Current 0-based index" },
          toIndex: { type: "number", description: "Target 0-based index" },
        },
        category: "content",
      },
      {
        name: "set_slide_background",
        description: "Set the background color or image URL for a specific slide.",
        parameters: {
          slideIndex: { type: "number", description: "0-based slide index" },
          background: { type: "string", description: "CSS color (#hex, rgb, named) or image URL" },
        },
        category: "content",
      },

      // ── Metadata ──
      {
        name: "set_title",
        description: "Set the presentation title.",
        parameters: { title: { type: "string", description: "New title" } },
        category: "metadata",
      },
      {
        name: "set_author",
        description: "Set the author name.",
        parameters: { author: { type: "string", description: "Author name" } },
        category: "metadata",
      },

      // ── Theme & Style ──
      {
        name: "set_theme",
        description: `Set the reveal.js theme. Valid themes: ${VALID_THEMES.join(", ")}`,
        parameters: { themeId: { type: "string", description: "Theme ID", enum: VALID_THEMES } },
        category: "style",
      },
      {
        name: "set_transition",
        description: `Set the global slide transition. Valid: ${VALID_TRANSITIONS.join(", ")}`,
        parameters: { transition: { type: "string", description: "Transition type", enum: VALID_TRANSITIONS } },
        category: "style",
      },
      {
        name: "set_transition_speed",
        description: `Set transition speed. Valid: ${VALID_SPEEDS.join(", ")}`,
        parameters: { speed: { type: "string", description: "Transition speed", enum: VALID_SPEEDS } },
        category: "style",
      },
      {
        name: "set_slide_transition",
        description: "Override the transition for a specific slide.",
        parameters: {
          slideIndex: { type: "number", description: "0-based slide index" },
          transition: { type: "string", description: "Transition type", enum: VALID_TRANSITIONS },
        },
        category: "style",
      },

      // ── Options ──
      {
        name: "set_controls",
        description: "Show or hide navigation controls.",
        parameters: { enabled: { type: "boolean" } },
        category: "options",
      },
      {
        name: "set_progress",
        description: "Show or hide the progress bar.",
        parameters: { enabled: { type: "boolean" } },
        category: "options",
      },
      {
        name: "set_slide_number",
        description: "Show or hide slide numbers.",
        parameters: { enabled: { type: "boolean" } },
        category: "options",
      },
      {
        name: "set_loop",
        description: "Enable or disable looping through slides.",
        parameters: { enabled: { type: "boolean" } },
        category: "options",
      },
      {
        name: "set_auto_slide",
        description: "Set auto-slide interval in milliseconds (0 to disable).",
        parameters: { ms: { type: "number", description: "Milliseconds between slides. 0 = disabled." } },
        category: "options",
      },

      // ── Generation ──
      {
        name: "generate_full_deck",
        description: "Replace all slides with a new set. Provide an array of slides, each with 'content' (HTML) and optionally 'notes' and 'background'.",
        parameters: {
          title: { type: "string", description: "Presentation title" },
          slides: {
            type: "array",
            description: "Array of slide objects",
            items: {
              type: "object",
              properties: {
                content: { type: "string", description: "HTML content" },
                notes: { type: "string", description: "Speaker notes" },
                background: { type: "string", description: "Background color" },
              },
            },
          },
        },
        category: "generation",
      },

      // ── Navigation ──
      {
        name: "go_to_slide",
        description: "Navigate to a specific slide by index.",
        parameters: { slideIndex: { type: "number" } },
        category: "navigation",
      },

      // ── Export ──
      {
        name: "export_html",
        description: "Generate the full standalone HTML file for this presentation. Returns the HTML string.",
        parameters: {},
        category: "export",
      },

      // ── Reset ──
      {
        name: "reset",
        description: "Reset the entire presentation to defaults.",
        parameters: {},
        category: "reset",
        destructive: true,
      },
    ],

    // ── getState ──
    getState: () => {
      const s = getStore();
      const slides = s.form.slides.map((sl, i) => ({
        index: i,
        contentPreview: sl.content.slice(0, 100),
        hasNotes: !!sl.notes,
        background: sl.background ?? null,
        transition: sl.transition ?? null,
      }));
      return {
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
      };
    },

    // ── executeAction ──
    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = getStore();

      switch (actionName) {
        // ── Info ──
        case "read_state": {
          const state = createRevealPresenterManifest().getState();
          return ok(JSON.stringify(state, null, 2));
        }
        case "get_slide_content": {
          const idx = params.slideIndex as number;
          const slide = store.form.slides[idx];
          if (!slide) return fail(`No slide at index ${idx}`);
          return ok(JSON.stringify({ content: slide.content, notes: slide.notes, background: slide.background }));
        }
        case "get_all_slides": {
          const all = store.form.slides.map((sl, i) => ({
            index: i,
            content: sl.content,
            notes: sl.notes,
            background: sl.background,
          }));
          return ok(JSON.stringify(all, null, 2));
        }

        // ── Content ──
        case "update_slide_content": {
          const idx = params.slideIndex as number;
          const content = params.content as string;
          if (idx < 0 || idx >= store.form.slides.length) return fail(`Invalid index ${idx}`);
          store.updateSlideContent(idx, content);
          return ok(`Updated slide ${idx + 1} content`);
        }

        case "update_slide_notes": {
          const idx = params.slideIndex as number;
          const notes = params.notes as string;
          if (idx < 0 || idx >= store.form.slides.length) return fail(`Invalid index ${idx}`);
          store.updateSlideNotes(idx, notes);
          return ok(`Updated slide ${idx + 1} notes`);
        }

        case "add_slide": {
          const content = params.content as string | undefined;
          const notes = params.notes as string | undefined;
          const afterIndex = params.afterIndex as number | undefined;
          store.addSlide(content, notes, afterIndex);
          return ok(`Added new slide`);
        }

        case "delete_slide": {
          const idx = params.slideIndex as number;
          if (store.form.slides.length <= 1) return fail("Cannot delete the last slide");
          if (idx < 0 || idx >= store.form.slides.length) return fail(`Invalid index ${idx}`);
          store.deleteSlide(idx);
          return ok(`Deleted slide ${idx + 1}`);
        }

        case "duplicate_slide": {
          const idx = params.slideIndex as number;
          if (idx < 0 || idx >= store.form.slides.length) return fail(`Invalid index ${idx}`);
          store.duplicateSlide(idx);
          return ok(`Duplicated slide ${idx + 1}`);
        }

        case "move_slide": {
          const from = params.fromIndex as number;
          const to = params.toIndex as number;
          store.moveSlide(from, to);
          return ok(`Moved slide from ${from + 1} to ${to + 1}`);
        }

        case "set_slide_background": {
          const idx = params.slideIndex as number;
          const bg = params.background as string;
          if (idx < 0 || idx >= store.form.slides.length) return fail(`Invalid index ${idx}`);
          store.updateSlideBackground(idx, bg);
          return ok(`Set slide ${idx + 1} background to "${bg}"`);
        }

        // ── Metadata ──
        case "set_title": {
          store.setTitle(params.title as string);
          return ok(`Title set to "${params.title}"`);
        }

        case "set_author": {
          store.setAuthor(params.author as string);
          return ok(`Author set to "${params.author}"`);
        }

        // ── Style ──
        case "set_theme": {
          const themeId = params.themeId as string;
          if (!VALID_THEMES.includes(themeId as RevealThemeId)) {
            return fail(`Invalid theme "${themeId}". Valid: ${VALID_THEMES.join(", ")}`);
          }
          store.setTheme(themeId as RevealThemeId);
          return ok(`Theme set to "${themeId}"`);
        }

        case "set_transition": {
          const transition = params.transition as string;
          if (!VALID_TRANSITIONS.includes(transition as RevealTransition)) {
            return fail(`Invalid transition "${transition}". Valid: ${VALID_TRANSITIONS.join(", ")}`);
          }
          store.setTransition(transition as RevealTransition);
          return ok(`Transition set to "${transition}"`);
        }

        case "set_transition_speed": {
          const speed = params.speed as string;
          if (!VALID_SPEEDS.includes(speed as RevealTransitionSpeed)) {
            return fail(`Invalid speed "${speed}". Valid: ${VALID_SPEEDS.join(", ")}`);
          }
          store.setTransitionSpeed(speed as RevealTransitionSpeed);
          return ok(`Transition speed set to "${speed}"`);
        }

        case "set_slide_transition": {
          const idx = params.slideIndex as number;
          const transition = params.transition as string;
          if (!VALID_TRANSITIONS.includes(transition as RevealTransition)) {
            return fail(`Invalid transition "${transition}"`);
          }
          store.updateSlideTransition(idx, transition as RevealTransition);
          return ok(`Slide ${idx + 1} transition set to "${transition}"`);
        }

        // ── Options ──
        case "set_controls": {
          store.setControls(!!params.enabled);
          return ok(`Controls ${params.enabled ? "enabled" : "disabled"}`);
        }

        case "set_progress": {
          store.setProgress(!!params.enabled);
          return ok(`Progress bar ${params.enabled ? "enabled" : "disabled"}`);
        }

        case "set_slide_number": {
          store.setSlideNumber(!!params.enabled);
          return ok(`Slide numbers ${params.enabled ? "enabled" : "disabled"}`);
        }

        case "set_loop": {
          store.setLoop(!!params.enabled);
          return ok(`Loop ${params.enabled ? "enabled" : "disabled"}`);
        }

        case "set_auto_slide": {
          const ms = params.ms as number;
          store.setAutoSlide(ms);
          return ok(ms > 0 ? `Auto-slide set to ${ms}ms` : "Auto-slide disabled");
        }

        // ── Generation ──
        case "generate_full_deck": {
          const title = params.title as string | undefined;
          const slidesData = params.slides as Array<{
            content: string;
            notes?: string;
            background?: string;
          }>;
          if (!Array.isArray(slidesData) || slidesData.length === 0) {
            return fail("Must provide at least one slide");
          }
          if (title) store.setTitle(title);
          const newSlides = slidesData.map((sl) => ({
            id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            content: sl.content,
            notes: sl.notes ?? "",
            background: sl.background,
          }));
          store.setSlides(newSlides);
          store.setActiveSlide(0);
          return ok(`Generated deck with ${newSlides.length} slides`);
        }

        // ── Navigation ──
        case "go_to_slide": {
          const idx = params.slideIndex as number;
          store.setActiveSlide(idx);
          return ok(`Navigated to slide ${idx + 1}`);
        }

        // ── Export ──
        case "export_html": {
          const html = store.generateHTML();
          return ok(html);
        }

        // ── Reset ──
        case "reset": {
          store.resetForm();
          return ok("Presentation reset to defaults");
        }

        default:
          return fail(`Unknown action: ${actionName}`);
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
