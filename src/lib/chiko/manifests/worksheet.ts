// =============================================================================
// DMSuite — Worksheet & Form Designer Action Manifest for Chiko
// Gives Chiko AI full control over the Worksheet & Form Designer:
// document type, content, sections, elements, educational settings,
// branding, answer key, style, format, and print settings.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useWorksheetEditor } from "@/stores/worksheet-editor";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";
import type {
  WorksheetFormData,
  DocumentType,
  WorksheetStyleConfig,
  WorksheetPrintConfig,
  AnswerKeyConfig,
  WorksheetBranding,
  ElementType,
  FormElement,
  FormSection,
} from "@/lib/worksheet/schema";

// ---------------------------------------------------------------------------
// Manifest Options
// ---------------------------------------------------------------------------

export interface WorksheetManifestOptions {
  onPrintRef?: React.RefObject<(() => void) | null>;
}

// ---------------------------------------------------------------------------
// Read state helpers
// ---------------------------------------------------------------------------

function readState(): Record<string, unknown> {
  const { form } = useWorksheetEditor.getState();
  return {
    documentType: form.documentType,
    title: form.title,
    instructions: form.instructions,
    subject: form.subject,
    gradeLevel: form.gradeLevel,
    studentNameField: form.studentNameField,
    dateField: form.dateField,
    scoreField: form.scoreField,
    branding: { ...form.branding },
    answerKey: { ...form.answerKey },
    style: { ...form.style },
    printConfig: { ...form.printConfig },
    sectionCount: form.sections.length,
    sections: form.sections.map((s) => ({
      id: s.id,
      title: s.title,
      visible: s.visible,
      columns: s.columns,
      elementCount: s.elements.length,
      elements: s.elements.map((e) => ({
        id: e.id,
        type: e.type,
        label: e.label,
        required: e.required,
        points: e.points,
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Pre-print validation
// ---------------------------------------------------------------------------

interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
}

function validate(): { issues: ValidationIssue[]; ready: boolean } {
  const { form } = useWorksheetEditor.getState();
  const issues: ValidationIssue[] = [];

  if (!form.title || form.title.trim().length === 0) {
    issues.push({ severity: "warning", field: "title", message: "Worksheet title is empty" });
  }

  const visibleSections = form.sections.filter((s) => s.visible);
  if (visibleSections.length === 0) {
    issues.push({ severity: "error", field: "sections", message: "No visible sections — the worksheet will be blank" });
  }

  const totalElements = visibleSections.reduce((sum, s) => sum + s.elements.length, 0);
  if (totalElements === 0) {
    issues.push({ severity: "warning", field: "elements", message: "No elements added to any section" });
  }

  if (form.documentType === "educational-worksheet") {
    if (!form.subject) {
      issues.push({ severity: "warning", field: "subject", message: "Educational subject is not set" });
    }
    if (!form.gradeLevel) {
      issues.push({ severity: "warning", field: "gradeLevel", message: "Grade level is not set" });
    }
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  return { issues, ready: errorCount === 0 };
}

// ---------------------------------------------------------------------------
// Manifest Factory
// ---------------------------------------------------------------------------

export function createWorksheetManifest(options?: WorksheetManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "worksheet-designer",
    toolName: "Worksheet & Form Designer",
    actions: [
      // ── Document Type ──
      {
        name: "setDocumentType",
        description:
          "Change the document type. Options: educational-worksheet, quiz, exam, survey, feedback-form, registration-form, application-form, order-form, checklist, evaluation-form, sign-in-sheet, generic-form. Automatically creates appropriate default sections.",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "educational-worksheet", "quiz", "exam", "survey", "feedback-form",
                "registration-form", "application-form", "order-form",
                "checklist", "evaluation-form", "sign-in-sheet", "generic-form",
              ],
              description: "Document type to switch to",
            },
          },
          required: ["type"],
        },
        category: "Content",
      },

      // ── Content / Metadata ──
      {
        name: "updateMeta",
        description:
          "Update document metadata: title, instructions, subject (for educational), gradeLevel, studentNameField (boolean), dateField (boolean), scoreField (boolean).",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Document title" },
            instructions: { type: "string", description: "Instructions for the form/worksheet" },
            subject: { type: "string", description: "Educational subject" },
            gradeLevel: { type: "string", description: "Grade level" },
            studentNameField: { type: "boolean", description: "Show student name field" },
            dateField: { type: "boolean", description: "Show date field" },
            scoreField: { type: "boolean", description: "Show score field" },
          },
        },
        category: "Content",
      },

      // ── Branding ──
      {
        name: "updateBranding",
        description:
          "Update branding: organization, subtitle, formNumber, date (YYYY-MM-DD), confidentiality (none, confidential, internal, public), contactInfo.",
        parameters: {
          type: "object",
          properties: {
            organization: { type: "string", description: "Organization / school name" },
            subtitle: { type: "string", description: "Subtitle or department" },
            formNumber: { type: "string", description: "Form number / reference code" },
            date: { type: "string", description: "Date on the form (YYYY-MM-DD)" },
            confidentiality: { type: "string", enum: ["none", "confidential", "internal", "public"] },
            contactInfo: { type: "string", description: "Contact info for the footer" },
          },
        },
        category: "Content",
      },

      // ── Answer Key ──
      {
        name: "updateAnswerKey",
        description:
          "Configure answer key settings: enabled (boolean), showPoints (boolean), showExplanations (boolean), headerText (string, default 'Answer Key').",
        parameters: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            showPoints: { type: "boolean" },
            showExplanations: { type: "boolean" },
            headerText: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── Prefill from Business Memory ──
      {
        name: "prefillFromMemory",
        description: "Auto-fill branding fields (organization, contact) from stored business profile.",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },

      // ── Sections ──
      {
        name: "addSection",
        description: "Add a new section to the worksheet. Optionally give it a title. Returns the new section ID.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Section title (optional)" },
          },
        },
        category: "Sections",
      },

      {
        name: "removeSection",
        description: "Remove a section by its ID.",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string", description: "Section ID to remove" },
          },
          required: ["sectionId"],
        },
        category: "Sections",
        destructive: true,
      },

      {
        name: "updateSection",
        description: "Update a section's properties: title, columns (1-3), visible (boolean), alternateShading (boolean), showBorder (boolean).",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string", description: "Section ID" },
            title: { type: "string" },
            columns: { type: "number", description: "1-3 column layout" },
            visible: { type: "boolean" },
            alternateShading: { type: "boolean" },
            showBorder: { type: "boolean" },
          },
          required: ["sectionId"],
        },
        category: "Sections",
      },

      {
        name: "reorderSections",
        description: "Move a section from one position to another. Zero-indexed.",
        parameters: {
          type: "object",
          properties: {
            fromIndex: { type: "number", description: "Current position (0-based)" },
            toIndex: { type: "number", description: "Target position (0-based)" },
          },
          required: ["fromIndex", "toIndex"],
        },
        category: "Sections",
      },

      // ── Elements ──
      {
        name: "addElement",
        description:
          "Add an element to a section. Types: short-answer, textarea, lined-writing, checkbox-group, radio-group, dropdown, multiple-choice, true-false, fill-in-blank, matching, word-bank, number-input, date-input, time-input, signature, file-upload, rating-scale, likert-scale, table, math-grid, diagram-label, reading-passage, heading, paragraph, spacer, numbered-list, drawing-box. Returns the new element ID.",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string", description: "Section to add to" },
            type: {
              type: "string",
              enum: [
                "short-answer", "textarea", "lined-writing", "checkbox-group",
                "radio-group", "dropdown", "multiple-choice", "true-false",
                "fill-in-blank", "matching", "word-bank", "number-input",
                "date-input", "time-input", "signature", "file-upload",
                "rating-scale", "likert-scale", "table", "math-grid",
                "diagram-label", "reading-passage", "heading", "paragraph",
                "spacer", "numbered-list", "drawing-box",
              ],
              description: "Element type to add",
            },
          },
          required: ["sectionId", "type"],
        },
        category: "Elements",
      },

      {
        name: "removeElement",
        description: "Remove an element from a section.",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string" },
            elementId: { type: "string" },
          },
          required: ["sectionId", "elementId"],
        },
        category: "Elements",
        destructive: true,
      },

      {
        name: "updateElement",
        description:
          "Update an element's properties. Common fields: label, helperText, required (boolean), points (number), explanation (string). Type-specific: options (array of {label, value, correct?}), lines (number), minValue/maxValue (number), minLabel/maxLabel (string), pairs (array of {left, right}), words (array of strings), columns/rows (number), sentence, answers (array), statement, correctAnswer (boolean), text, level (1-3), height (number), items (array of strings), gridType (addition/subtraction/multiplication/division/mixed), captions (string), labels (array of {x, y, text}), title (string), signatureFields (array of {label, dateLine}), likertLabels (array), likertStatements (array), tableColumns (array), tableRows (number).",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string" },
            elementId: { type: "string" },
            patch: { type: "object", description: "Partial element properties to update" },
          },
          required: ["sectionId", "elementId", "patch"],
        },
        category: "Elements",
      },

      {
        name: "duplicateElement",
        description: "Duplicate an element within its section. Returns the new element ID.",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string" },
            elementId: { type: "string" },
          },
          required: ["sectionId", "elementId"],
        },
        category: "Elements",
      },

      {
        name: "moveElement",
        description: "Move an element from one section to another at a specific index.",
        parameters: {
          type: "object",
          properties: {
            fromSectionId: { type: "string" },
            toSectionId: { type: "string" },
            elementId: { type: "string" },
            toIndex: { type: "number" },
          },
          required: ["fromSectionId", "toSectionId", "elementId", "toIndex"],
        },
        category: "Elements",
      },

      {
        name: "reorderElement",
        description: "Reorder an element within its section. Zero-indexed.",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string" },
            fromIndex: { type: "number" },
            toIndex: { type: "number" },
          },
          required: ["sectionId", "fromIndex", "toIndex"],
        },
        category: "Elements",
      },

      // ── Style ──
      {
        name: "setTemplate",
        description:
          "Apply a visual template. Options: clean-modern, academic-classic, playful-bright, minimal-mono, professional-blue, warm-earth, bold-contrast, pastel-soft. Sets accent, font, and header style.",
        parameters: {
          type: "object",
          properties: {
            template: {
              type: "string",
              enum: [
                "clean-modern", "academic-classic", "playful-bright", "minimal-mono",
                "professional-blue", "warm-earth", "bold-contrast", "pastel-soft",
              ],
            },
          },
          required: ["template"],
        },
        category: "Style",
      },

      {
        name: "updateStyle",
        description:
          "Update style settings: accentColor (hex), fontPairing (playfair-lato, inter-inter, poppins-inter, oswald-roboto, dm-serif-dm-sans, merriweather-opensans, cormorant-montserrat, crimson-source), headerStyle (banner, underline, border, boxed, playful, minimal), numberedElements (boolean), showPointValues (boolean), showRequiredAsterisk (boolean), alternateRowShading (boolean), showSectionDividers (boolean), showInstructions (boolean), showBranding (boolean), showFooter (boolean), showConfidentiality (boolean).",
        parameters: {
          type: "object",
          properties: {
            accentColor: { type: "string", description: "Hex color" },
            fontPairing: { type: "string" },
            headerStyle: { type: "string", enum: ["banner", "underline", "border", "boxed", "playful", "minimal"] },
            numberedElements: { type: "boolean" },
            showPointValues: { type: "boolean" },
            showRequiredAsterisk: { type: "boolean" },
            alternateRowShading: { type: "boolean" },
            showSectionDividers: { type: "boolean" },
            showInstructions: { type: "boolean" },
            showBranding: { type: "boolean" },
            showFooter: { type: "boolean" },
            showConfidentiality: { type: "boolean" },
          },
        },
        category: "Style",
      },

      // ── Format ──
      {
        name: "updateFormat",
        description:
          "Update print/page settings: pageSize (a4, letter, legal, a5), margins (narrow, standard, wide), sectionSpacing (0-4), lineSpacing (tight, normal, loose), fieldSize (compact, standard, large).",
        parameters: {
          type: "object",
          properties: {
            pageSize: { type: "string", enum: ["a4", "letter", "legal", "a5"] },
            margins: { type: "string", enum: ["narrow", "standard", "wide"] },
            sectionSpacing: { type: "number", description: "0-4" },
            lineSpacing: { type: "string", enum: ["tight", "normal", "loose"] },
            fieldSize: { type: "string", enum: ["compact", "standard", "large"] },
          },
        },
        category: "Format",
      },

      // ── Document ──
      {
        name: "resetForm",
        description: "Reset the worksheet/form to defaults. Optionally specify a document type to start with.",
        parameters: {
          type: "object",
          properties: {
            documentType: {
              type: "string",
              enum: [
                "educational-worksheet", "quiz", "exam", "survey", "feedback-form",
                "registration-form", "application-form", "order-form",
                "checklist", "evaluation-form", "sign-in-sheet", "generic-form",
              ],
            },
          },
        },
        category: "Document",
        destructive: true,
      },

      // ── Read ──
      {
        name: "readCurrentState",
        description: "Read the full current state of the worksheet/form being designed.",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },

      // ── Export ──
      {
        name: "validateBeforePrint",
        description: "Check if the worksheet is ready to print. Returns issues list.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      {
        name: "exportPrint",
        description: "Trigger the browser print dialog to export the worksheet as PDF.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
    ],

    // ── State reader ──
    getState: readState,

    // ── Action Executor ──
    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      try {
        const store = useWorksheetEditor.getState();

        switch (actionName) {
          case "setDocumentType":
            store.setDocumentType(params.type as DocumentType);
            return { success: true, message: `Document type changed to ${params.type}` };

          case "updateMeta":
            store.updateMeta(params as Partial<Pick<WorksheetFormData, "title" | "instructions" | "subject" | "gradeLevel" | "studentNameField" | "dateField" | "scoreField">>);
            return { success: true, message: "Document metadata updated" };

          case "updateBranding":
            store.updateBranding(params as Partial<WorksheetBranding>);
            return { success: true, message: "Branding updated" };

          case "updateAnswerKey":
            store.updateAnswerKey(params as Partial<AnswerKeyConfig>);
            return { success: true, message: "Answer key settings updated" };

          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) {
              return { success: false, message: "No business profile saved yet." };
            }
            const profile = memory.profile;
            if (profile.companyName) store.updateBranding({ organization: profile.companyName });
            if (profile.email || profile.phone) store.updateBranding({ contactInfo: [profile.email, profile.phone].filter(Boolean).join(" | ") });
            return { success: true, message: `Branding pre-filled: ${profile.companyName || "business profile"}` };
          }

          case "addSection": {
            const newId = store.addSection(params.title as string | undefined);
            return { success: true, message: `Section added (ID: ${newId})`, newState: { sectionId: newId } };
          }

          case "removeSection":
            store.removeSection(params.sectionId as string);
            return { success: true, message: "Section removed" };

          case "updateSection":
            store.updateSection(
              params.sectionId as string,
              Object.fromEntries(
                Object.entries(params).filter(([k]) => k !== "sectionId"),
              ) as Partial<Omit<FormSection, "id" | "elements">>,
            );
            return { success: true, message: "Section updated" };

          case "reorderSections":
            store.reorderSections(params.fromIndex as number, params.toIndex as number);
            return { success: true, message: "Sections reordered" };

          case "addElement": {
            const elemId = store.addElement(params.sectionId as string, params.type as ElementType);
            return { success: true, message: `${params.type} element added (ID: ${elemId})`, newState: { elementId: elemId } };
          }

          case "removeElement":
            store.removeElement(params.sectionId as string, params.elementId as string);
            return { success: true, message: "Element removed" };

          case "updateElement":
            store.updateElement(
              params.sectionId as string,
              params.elementId as string,
              params.patch as Partial<FormElement>,
            );
            return { success: true, message: "Element updated" };

          case "duplicateElement": {
            const dupId = store.duplicateElement(params.sectionId as string, params.elementId as string);
            return { success: true, message: `Element duplicated (ID: ${dupId})`, newState: { elementId: dupId } };
          }

          case "moveElement":
            store.moveElement(
              params.fromSectionId as string,
              params.toSectionId as string,
              params.elementId as string,
              params.toIndex as number,
            );
            return { success: true, message: "Element moved" };

          case "reorderElement":
            store.reorderElement(params.sectionId as string, params.fromIndex as number, params.toIndex as number);
            return { success: true, message: "Element reordered" };

          case "setTemplate":
            store.setTemplate(params.template as string);
            return { success: true, message: `Template set to ${params.template}` };

          case "updateStyle":
            store.updateStyle(params as Partial<WorksheetStyleConfig>);
            return { success: true, message: "Style updated" };

          case "updateFormat":
            store.updatePrintConfig(params as Partial<WorksheetPrintConfig>);
            return { success: true, message: "Format settings updated" };

          case "resetForm":
            store.resetForm(params.documentType as DocumentType | undefined);
            return { success: true, message: "Worksheet reset to defaults" };

          case "readCurrentState":
            return { success: true, message: "Current worksheet state", newState: readState() };

          case "validateBeforePrint": {
            const { issues, ready } = validate();
            const errorCount = issues.filter((i) => i.severity === "error").length;
            const warningCount = issues.filter((i) => i.severity === "warning").length;
            let msg = "";
            if (ready && warningCount === 0) {
              msg = "Worksheet is ready to print — no issues found.";
            } else if (ready) {
              msg = `Worksheet can be printed but has ${warningCount} warning(s):\n`;
              for (const i of issues) msg += `  ⚠ ${i.message}\n`;
            } else {
              msg = `Worksheet has ${errorCount} error(s) and ${warningCount} warning(s):\n`;
              for (const i of issues) msg += `  ${i.severity === "error" ? "✘" : "⚠"} ${i.message}\n`;
            }
            return { success: true, message: msg.trim(), newState: { issues, ready, errorCount, warningCount } };
          }

          case "exportPrint": {
            const { issues, ready } = validate();
            const errors = issues.filter((i) => i.severity === "error");
            if (!ready) {
              return {
                success: false,
                message: `Cannot print — ${errors.length} error(s):\n${errors.map((i) => `• ${i.message}`).join("\n")}`,
              };
            }
            const handler = options?.onPrintRef?.current;
            if (!handler) return { success: false, message: "Export not ready yet — try again." };
            handler();
            return { success: true, message: "Print dialog opened" };
          }

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Action failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useWorksheetEditor.getState().form,
    (snapshot) => useWorksheetEditor.getState().setForm(snapshot as WorksheetFormData),
  );
}
