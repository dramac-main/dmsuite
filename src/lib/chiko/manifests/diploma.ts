// =============================================================================
// DMSuite — Diploma Designer Action Manifest for Chiko
// Gives Chiko AI full control over the Diploma & Accreditation Designer:
// institution, program, recipient, signatories, seal, style, and format.
// Follows the exact same architecture as certificate.ts.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useDiplomaEditor } from "@/stores/diploma-editor";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";
import type {
  DiplomaFormData,
  DiplomaType,
  DiplomaStyleConfig,
  DiplomaFormatConfig,
  SealStyle,
  DiplomaBorderStyle,
  DiplomaSignatory,
  HonorsLevel,
} from "@/stores/diploma-editor";

// ---------------------------------------------------------------------------
// Manifest Options
// ---------------------------------------------------------------------------

export interface DiplomaManifestOptions {
  onPrintRef?: React.RefObject<(() => void) | null>;
}

// ---------------------------------------------------------------------------
// Internal getState helper
// ---------------------------------------------------------------------------

function readDiplomaState(): Record<string, unknown> {
  const { form } = useDiplomaEditor.getState();
  return {
    diplomaType: form.diplomaType,
    institutionName: form.institutionName,
    institutionSubtitle: form.institutionSubtitle,
    institutionMotto: form.institutionMotto,
    recipientName: form.recipientName,
    recipientId: form.recipientId,
    programName: form.programName,
    fieldOfStudy: form.fieldOfStudy,
    honors: form.honors,
    conferralText: form.conferralText,
    resolutionText: form.resolutionText,
    accreditationBody: form.accreditationBody,
    accreditationNumber: form.accreditationNumber,
    dateConferred: form.dateConferred,
    graduationDate: form.graduationDate,
    registrationNumber: form.registrationNumber,
    serialNumber: form.serialNumber,
    signatories: form.signatories.map((s) => ({
      id: s.id,
      name: s.name,
      title: s.title,
      role: s.role,
    })),
    signatoryCount: form.signatories.length,
    showSeal: form.showSeal,
    sealText: form.sealText,
    sealStyle: form.sealStyle,
    style: { ...form.style },
    format: { ...form.format },
  };
}

// ---------------------------------------------------------------------------
// Pre-print Validation
// ---------------------------------------------------------------------------

interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
}

function validateDiploma(): { issues: ValidationIssue[]; ready: boolean } {
  const { form } = useDiplomaEditor.getState();
  const issues: ValidationIssue[] = [];

  if (!form.recipientName || form.recipientName.trim().length === 0) {
    issues.push({ severity: "error", field: "recipientName", message: "Recipient name is empty" });
  }
  if (!form.programName || form.programName.trim().length === 0) {
    issues.push({ severity: "warning", field: "programName", message: "Program / degree name is empty" });
  }
  if (!form.institutionName || form.institutionName.trim().length === 0) {
    issues.push({ severity: "warning", field: "institutionName", message: "Institution name is not set" });
  }
  if (!form.dateConferred) {
    issues.push({ severity: "warning", field: "dateConferred", message: "No conferral date set" });
  }

  const namedSignatories = form.signatories.filter((s) => s.name.trim().length > 0);
  if (namedSignatories.length === 0) {
    issues.push({ severity: "warning", field: "signatories", message: "No signatories have names filled in" });
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  return { issues, ready: errorCount === 0 };
}

// ---------------------------------------------------------------------------
// Manifest Factory
// ---------------------------------------------------------------------------

export function createDiplomaManifest(options?: DiplomaManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "diploma-designer",
    toolName: "Diploma & Accreditation Designer",
    actions: [
      // ── Institution ──────────────────────────────────────────────────────
      {
        name: "updateInstitution",
        description:
          "Update institution details: institutionName, institutionSubtitle, institutionMotto.",
        parameters: {
          type: "object",
          properties: {
            institutionName: { type: "string", description: "Name of the university or institution" },
            institutionSubtitle: { type: "string", description: "Department, school, or faculty" },
            institutionMotto: { type: "string", description: "Institutional motto (e.g. 'Knowledge is Power')" },
          },
        },
        category: "Content",
      },

      // ── Diploma Type ──────────────────────────────────────────────────────
      {
        name: "setDiplomaType",
        description: "Change the diploma type. Updates the program name automatically.",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "bachelors", "masters", "doctorate", "professional-diploma",
                "honorary-doctorate", "vocational", "postgraduate", "accreditation",
              ],
              description: "Diploma type",
            },
          },
          required: ["type"],
        },
        category: "Content",
      },

      // ── Recipient ─────────────────────────────────────────────────────────
      {
        name: "updateRecipient",
        description: "Update recipient details: recipientName, recipientId (student number).",
        parameters: {
          type: "object",
          properties: {
            recipientName: { type: "string", description: "Full name of the graduate" },
            recipientId: { type: "string", description: "Student ID or registration number" },
          },
        },
        category: "Content",
      },

      // ── Program / Degree ──────────────────────────────────────────────────
      {
        name: "updateProgram",
        description: "Update program details: programName, fieldOfStudy, honors.",
        parameters: {
          type: "object",
          properties: {
            programName: { type: "string", description: "Degree or program name (e.g. 'Bachelor of Science')" },
            fieldOfStudy: { type: "string", description: "Major or field of study (e.g. 'Computer Science')" },
            honors: {
              type: "string",
              enum: ["", "cum-laude", "magna-cum-laude", "summa-cum-laude", "distinction", "high-distinction", "first-class", "merit"],
              description: "Honors level (empty string = no honors)",
            },
          },
        },
        category: "Content",
      },

      // ── Conferral ──────────────────────────────────────────────────────────
      {
        name: "updateConferral",
        description: "Update conferral and resolution text.",
        parameters: {
          type: "object",
          properties: {
            conferralText: { type: "string", description: "Conferral statement text" },
            resolutionText: { type: "string", description: "Resolution / authority text" },
          },
        },
        category: "Content",
      },

      // ── Accreditation ──────────────────────────────────────────────────────
      {
        name: "updateAccreditation",
        description: "Update accreditation body and number.",
        parameters: {
          type: "object",
          properties: {
            accreditationBody: { type: "string", description: "Accrediting body name" },
            accreditationNumber: { type: "string", description: "Accreditation reference number" },
          },
        },
        category: "Content",
      },

      // ── Dates ──────────────────────────────────────────────────────────────
      {
        name: "updateDates",
        description: "Update date of conferral and graduation date.",
        parameters: {
          type: "object",
          properties: {
            dateConferred: { type: "string", description: "Date conferred (YYYY-MM-DD)" },
            graduationDate: { type: "string", description: "Graduation ceremony date (YYYY-MM-DD)" },
          },
        },
        category: "Content",
      },

      // ── Reference ──────────────────────────────────────────────────────────
      {
        name: "updateReference",
        description: "Update registration number and serial number.",
        parameters: {
          type: "object",
          properties: {
            registrationNumber: { type: "string", description: "Academic registration number" },
            serialNumber: { type: "string", description: "Diploma serial number (e.g. DIP-2026-001)" },
          },
        },
        category: "Content",
      },

      // ── Signatories ──────────────────────────────────────────────────────
      {
        name: "addSignatory",
        description: "Add a new signatory to the diploma. Returns the new signatory ID.",
        parameters: { type: "object", properties: {} },
        category: "Details",
      },
      {
        name: "updateSignatory",
        description: "Update a signatory by their ID.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Signatory ID (obtain from readCurrentState)" },
            name: { type: "string", description: "Signatory full name" },
            title: { type: "string", description: "Signatory title/position" },
            role: {
              type: "string",
              enum: [
                "chancellor", "vice-chancellor", "dean", "registrar", "director",
                "head-of-department", "secretary", "president", "provost", "board-chair",
              ],
              description: "Signatory role",
            },
          },
          required: ["id"],
        },
        category: "Details",
      },
      {
        name: "removeSignatory",
        description: "Remove a signatory by their ID.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Signatory ID" },
          },
          required: ["id"],
        },
        category: "Details",
        destructive: true,
      },

      // ── Seal ───────────────────────────────────────────────────────────────
      {
        name: "updateSeal",
        description: "Configure the institutional seal: showSeal, sealText, sealStyle.",
        parameters: {
          type: "object",
          properties: {
            showSeal: { type: "boolean", description: "Show or hide the seal" },
            sealText: { type: "string", description: "Text inside the seal (e.g. UNIVERSITY SEAL)" },
            sealStyle: {
              type: "string",
              enum: ["gold", "silver", "embossed", "stamp", "none"],
              description: "Seal visual style",
            },
          },
        },
        category: "Details",
      },

      // ── Style ─────────────────────────────────────────────────────────────
      {
        name: "updateStyle",
        description:
          "Change visual style: template, accentColor, borderStyle, fontPairing, fontScale, headerStyle.",
        parameters: {
          type: "object",
          properties: {
            template: {
              type: "string",
              enum: [
                "university-classic", "institutional-formal", "modern-professional", "ivy-league",
                "executive", "technical-vocational", "medical-health", "legal-bar",
                "vintage-academic", "international",
              ],
              description: "Visual template preset",
            },
            accentColor: { type: "string", description: "Accent colour as hex (e.g. #1e3a5f)" },
            borderStyle: {
              type: "string",
              enum: [
                "ornate-classic", "clean-line", "double-frame", "thin-elegant",
                "official-border", "accent-corner", "modern-bracket", "vintage-frame", "none",
              ],
              description: "Border style",
            },
            fontPairing: {
              type: "string",
              enum: [
                "playfair-lato", "inter-jetbrains", "merriweather-opensans",
                "cormorant-montserrat", "crimson-source", "poppins-inter", "dm-serif-dm-sans",
              ],
              description: "Font pairing ID",
            },
            fontScale: { type: "number", description: "Font scale multiplier (0.85–1.2)" },
            headerStyle: {
              type: "string",
              enum: ["centered", "left-aligned", "crest-centered"],
              description: "Header layout style",
            },
          },
        },
        category: "Style",
      },
      {
        name: "setTemplate",
        description:
          "Quick-apply a full template preset. Updates accent, border, background, and font pairing at once.",
        parameters: {
          type: "object",
          properties: {
            template: {
              type: "string",
              enum: [
                "university-classic", "institutional-formal", "modern-professional", "ivy-league",
                "executive", "technical-vocational", "medical-health", "legal-bar",
                "vintage-academic", "international",
              ],
              description: "Template preset ID",
            },
          },
          required: ["template"],
        },
        category: "Style",
      },

      // ── Format ────────────────────────────────────────────────────────────
      {
        name: "updateFormat",
        description: "Change format settings: pageSize, orientation, margins.",
        parameters: {
          type: "object",
          properties: {
            pageSize: { type: "string", enum: ["a4", "letter", "a5"], description: "Paper size" },
            orientation: { type: "string", enum: ["landscape", "portrait"], description: "Page orientation" },
            margins: { type: "string", enum: ["narrow", "standard", "wide"], description: "Margin size" },
          },
        },
        category: "Format",
      },

      // ── Reset / Read ──────────────────────────────────────────────────────
      {
        name: "resetForm",
        description: "Reset the diploma to defaults. WARNING: Erases all current content.",
        parameters: {
          type: "object",
          properties: {
            diplomaType: {
              type: "string",
              enum: [
                "bachelors", "masters", "doctorate", "professional-diploma",
                "honorary-doctorate", "vocational", "postgraduate", "accreditation",
              ],
              description: "Diploma type to reset to (optional — defaults to current type)",
            },
          },
        },
        category: "Document",
        destructive: true,
      },
      {
        name: "readCurrentState",
        description: "Read all current diploma settings. No changes made.",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },
      {
        name: "prefillFromMemory",
        description: "Pre-fill institution name from saved business profile.",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },

      // ── Validation ─────────────────────────────────────────────────────────
      {
        name: "validateBeforePrint",
        description:
          "Check the diploma for issues before printing: missing recipient name, empty fields, unsigned signatories. ALWAYS call this before exportPrint.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      // ── Export ─────────────────────────────────────────────────────────────
      {
        name: "exportPrint",
        description: "Open the browser print dialog for the current diploma.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
    ],

    // ── getState ─────────────────────────────────────────────────────────────
    getState: readDiplomaState,

    // ── executeAction ─────────────────────────────────────────────────────────
    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useDiplomaEditor.getState();
      try {
        switch (actionName) {
          case "updateInstitution":
            store.updateInstitution(params as Parameters<typeof store.updateInstitution>[0]);
            return { success: true, message: "Institution updated" };

          case "setDiplomaType":
            store.setDiplomaType(params.type as DiplomaType);
            return { success: true, message: `Diploma type changed to ${params.type}` };

          case "updateRecipient":
            store.updateRecipient(params as Parameters<typeof store.updateRecipient>[0]);
            return { success: true, message: "Recipient updated" };

          case "updateProgram":
            store.updateProgram(params as Parameters<typeof store.updateProgram>[0]);
            return { success: true, message: "Program details updated" };

          case "updateConferral":
            store.updateConferral(params as Parameters<typeof store.updateConferral>[0]);
            return { success: true, message: "Conferral text updated" };

          case "updateAccreditation":
            store.updateAccreditation(params as Parameters<typeof store.updateAccreditation>[0]);
            return { success: true, message: "Accreditation updated" };

          case "updateDates":
            store.updateDates(params as Parameters<typeof store.updateDates>[0]);
            return { success: true, message: "Dates updated" };

          case "updateReference":
            store.updateReference(params as Parameters<typeof store.updateReference>[0]);
            return { success: true, message: "Reference updated" };

          case "addSignatory": {
            const id = store.addSignatory();
            return { success: true, message: `Signatory added (id: ${id})` };
          }

          case "updateSignatory":
            store.updateSignatory(params.id as string, params as Partial<DiplomaSignatory>);
            return { success: true, message: "Signatory updated" };

          case "removeSignatory":
            store.removeSignatory(params.id as string);
            return { success: true, message: "Signatory removed" };

          case "updateSeal":
            store.updateSeal(params as Parameters<typeof store.updateSeal>[0]);
            return { success: true, message: "Seal updated" };

          case "updateStyle":
            store.updateStyle(params as Partial<DiplomaStyleConfig>);
            return { success: true, message: "Style updated" };

          case "setTemplate":
            store.setTemplate(params.template as DiplomaStyleConfig["template"]);
            return { success: true, message: `Template set to ${params.template}` };

          case "updateFormat":
            store.updateFormat(params as Partial<DiplomaFormatConfig>);
            return { success: true, message: "Format updated" };

          case "resetForm":
            store.resetForm(params.diplomaType as DiplomaType | undefined);
            return { success: true, message: "Diploma reset to defaults" };

          case "readCurrentState":
            return { success: true, message: "Current diploma state", newState: readDiplomaState() };

          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) {
              return { success: false, message: "No business profile saved yet. Ask the user to set up their Business Memory first." };
            }
            const profile = memory.profile;
            if (profile.companyName) {
              store.updateInstitution({ institutionName: profile.companyName });
              return { success: true, message: `Institution pre-filled: ${profile.companyName}` };
            }
            return { success: false, message: "Business profile has no company name to pre-fill." };
          }

          case "validateBeforePrint": {
            const { issues, ready } = validateDiploma();
            const errorCount = issues.filter((i) => i.severity === "error").length;
            const warningCount = issues.filter((i) => i.severity === "warning").length;
            let msg = "";
            if (ready && warningCount === 0) {
              msg = "Diploma is ready to print — no issues found.";
            } else if (ready) {
              msg = `Diploma can be printed but has ${warningCount} warning(s) to review:\n`;
              for (const i of issues) msg += `  ⚠ ${i.message}\n`;
            } else {
              msg = `Diploma has ${errorCount} error(s) and ${warningCount} warning(s):\n`;
              for (const i of issues) msg += `  ${i.severity === "error" ? "✘" : "⚠"} ${i.message}\n`;
            }
            return { success: true, message: msg.trim(), newState: { issues, ready, errorCount, warningCount } };
          }

          case "exportPrint": {
            const { issues, ready } = validateDiploma();
            const errors = issues.filter((i) => i.severity === "error");
            if (!ready) {
              return {
                success: false,
                message: `Cannot print — ${errors.length} error(s) found:\n${errors.map((i) => `• ${i.message}`).join("\n")}`,
              };
            }
            const handler = options?.onPrintRef?.current;
            if (!handler) {
              return { success: false, message: "Export not ready yet — please wait and try again." };
            }
            handler();
            return { success: true, message: `Print dialog opened for ${store.form.programName}.` };
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
    () => useDiplomaEditor.getState().form,
    (snapshot) => useDiplomaEditor.getState().setForm(snapshot as DiplomaFormData),
  );
}
