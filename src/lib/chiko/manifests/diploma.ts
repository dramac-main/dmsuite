// =============================================================================
// DMSuite — Diploma & Accreditation Designer Action Manifest for Chiko
// Gives Chiko AI full control over the Diploma Designer:
// institution, program, recipient, signatories, style, templates, format, export.
// Uses diploma-editor store (Pattern A — HTML/CSS renderer).
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import {
  useDiplomaEditor,
  DIPLOMA_TEMPLATES,
  DIPLOMA_TYPES,
  HONORS_LEVELS,
  type DiplomaFormData,
  type DiplomaType,
  type DiplomaTemplate,
  type HonorsLevel,
} from "@/stores/diploma-editor";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";

// ---------------------------------------------------------------------------
// Manifest Options
// ---------------------------------------------------------------------------

export interface DiplomaManifestOptions {
  onPrintRef?: React.MutableRefObject<(() => void) | null>;
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
    signatories: form.signatories.map((s, i) => ({
      index: i,
      id: s.id,
      name: s.name,
      title: s.title,
      role: s.role,
    })),
    signatoryCount: form.signatories.length,
    showSeal: form.showSeal,
    sealText: form.sealText,
    sealStyle: form.sealStyle,
    template: form.style.template,
    accentColor: form.style.accentColor,
    fontPairing: form.style.fontPairing,
    fontScale: form.style.fontScale,
    headerStyle: form.style.headerStyle,
    pageSize: form.format.pageSize,
    orientation: form.format.orientation,
    margins: form.format.margins,
    availableTypes: DIPLOMA_TYPES.map((t) => t.id),
    availableTemplates: DIPLOMA_TEMPLATES.map((t) => ({ id: t.id, name: t.name })),
    availableHonors: HONORS_LEVELS.map((h) => ({ id: h.id, label: h.label })),
  };
}

// ---------------------------------------------------------------------------
// Pre-export Validation
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
    issues.push({ severity: "warning", field: "programName", message: "Program name is empty" });
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
// Constants
// ---------------------------------------------------------------------------

const VALID_TYPES: DiplomaType[] = ["bachelors", "masters", "doctorate", "professional-diploma", "honorary-doctorate", "vocational", "postgraduate", "accreditation"];
const VALID_TEMPLATES: DiplomaTemplate[] = ["university-classic", "institutional-formal", "modern-professional", "ivy-league", "executive", "technical-vocational", "medical-health", "legal-bar", "vintage-academic", "international"];
const VALID_HONORS: HonorsLevel[] = ["", "cum-laude", "magna-cum-laude", "summa-cum-laude", "distinction", "high-distinction", "first-class", "merit"];

// ---------------------------------------------------------------------------
// Manifest Factory
// ---------------------------------------------------------------------------

export function createDiplomaManifest(options?: DiplomaManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "diploma-designer",
    toolName: "Diploma & Accreditation Designer",
    actions: [
      // -- Institution
      {
        name: "updateInstitution",
        description: "Update institution details: institutionName, institutionSubtitle, institutionMotto.",
        parameters: {
          type: "object",
          properties: {
            institutionName: { type: "string", description: "Name of the university or institution" },
            institutionSubtitle: { type: "string", description: "Department, school, or faculty" },
            institutionMotto: { type: "string", description: "Institutional motto" },
          },
        },
        category: "Content",
      },

      // -- Recipient
      {
        name: "updateRecipient",
        description: "Update recipient details: recipientName, recipientId.",
        parameters: {
          type: "object",
          properties: {
            recipientName: { type: "string", description: "Full name of the graduate" },
            recipientId: { type: "string", description: "Student ID or registration number" },
          },
        },
        category: "Content",
      },

      // -- Program / Degree
      {
        name: "updateProgram",
        description: "Update program details: programName, fieldOfStudy, honors.",
        parameters: {
          type: "object",
          properties: {
            programName: { type: "string", description: "Degree or program name" },
            fieldOfStudy: { type: "string", description: "Major or field of study" },
            honors: { type: "string", enum: VALID_HONORS, description: "Honors level" },
          },
        },
        category: "Content",
      },

      // -- Conferral
      {
        name: "updateConferral",
        description: "Update conferral text and resolution text.",
        parameters: {
          type: "object",
          properties: {
            conferralText: { type: "string", description: "Conferral statement" },
            resolutionText: { type: "string", description: "Resolution / authority text" },
          },
        },
        category: "Content",
      },

      // -- Accreditation
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

      // -- Dates
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

      // -- Reference
      {
        name: "updateReference",
        description: "Update registration number and serial number.",
        parameters: {
          type: "object",
          properties: {
            registrationNumber: { type: "string", description: "Registration number" },
            serialNumber: { type: "string", description: "Serial number" },
          },
        },
        category: "Content",
      },

      // -- Diploma Type
      {
        name: "setDiplomaType",
        description: "Change the diploma type.",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: VALID_TYPES, description: "Diploma type" },
          },
          required: ["type"],
        },
        category: "Content",
      },

      // -- Signatories
      {
        name: "addSignatory",
        description: "Add a new signatory to the diploma.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Signatory full name" },
            title: { type: "string", description: "Signatory title/position" },
            role: { type: "string", description: "Signatory role (e.g. Chancellor, Dean)" },
          },
        },
        category: "Details",
      },
      {
        name: "updateSignatory",
        description: "Update a signatory by index (0-based).",
        parameters: {
          type: "object",
          properties: {
            index: { type: "number", description: "Signatory index (0-based)" },
            name: { type: "string", description: "Signatory full name" },
            title: { type: "string", description: "Signatory title/position" },
            role: { type: "string", description: "Signatory role" },
          },
          required: ["index"],
        },
        category: "Details",
      },
      {
        name: "removeSignatory",
        description: "Remove a signatory by index (0-based).",
        parameters: {
          type: "object",
          properties: {
            index: { type: "number", description: "Signatory index (0-based)" },
          },
          required: ["index"],
        },
        category: "Details",
        destructive: true,
      },

      // -- Seal
      {
        name: "updateSeal",
        description: "Update seal settings: showSeal, sealText, sealStyle.",
        parameters: {
          type: "object",
          properties: {
            showSeal: { type: "boolean", description: "Show/hide the seal" },
            sealText: { type: "string", description: "Text inside the seal" },
            sealStyle: { type: "string", enum: ["gold", "silver", "embossed", "stamp", "none"], description: "Seal visual style" },
          },
        },
        category: "Details",
      },

      // -- Style
      {
        name: "updateStyle",
        description: "Change visual styling: template, accentColor, fontPairing, fontScale, headerStyle.",
        parameters: {
          type: "object",
          properties: {
            template: { type: "string", enum: VALID_TEMPLATES, description: "Visual template" },
            accentColor: { type: "string", description: "Hex color" },
            fontPairing: { type: "string", enum: ["playfair-lato", "inter-jetbrains", "merriweather-opensans", "cormorant-montserrat", "crimson-source", "poppins-inter", "dm-serif-dm-sans"], description: "Font pairing" },
            fontScale: { type: "number", description: "Font scale multiplier (0.85 to 1.2)" },
            headerStyle: { type: "string", enum: ["centered", "left-aligned", "crest-centered"], description: "Header layout style" },
          },
        },
        category: "Style",
      },

      // -- Format
      {
        name: "updateFormat",
        description: "Change page size, orientation, margins.",
        parameters: {
          type: "object",
          properties: {
            pageSize: { type: "string", enum: ["a4", "letter", "a5"], description: "Page size" },
            orientation: { type: "string", enum: ["landscape", "portrait"], description: "Page orientation" },
            margins: { type: "string", enum: ["narrow", "standard", "wide"], description: "Margin preset" },
          },
        },
        category: "Format",
      },

      // -- Reset
      {
        name: "resetForm",
        description: "Reset diploma to defaults. WARNING: Erases content.",
        parameters: {
          type: "object",
          properties: {
            diplomaType: { type: "string", enum: VALID_TYPES, description: "Type to reset to" },
          },
        },
        category: "Reset",
        destructive: true,
      },

      // -- Read
      { name: "readCurrentState", description: "Read all current diploma settings.", parameters: { type: "object", properties: {} }, category: "Read" },
      { name: "prefillFromMemory", description: "Pre-fill institution from business profile.", parameters: { type: "object", properties: {} }, category: "Content" },
      { name: "validateBeforeExport", description: "Check diploma for issues before export.", parameters: { type: "object", properties: {} }, category: "Validate" },
      {
        name: "exportDocument",
        description: "Export or print the diploma via browser print dialog.",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["print"], description: "Export format" },
          },
        },
        category: "Export",
      },
    ],

    getState: readDiplomaState,

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useDiplomaEditor.getState();
      try {
        switch (actionName) {
          case "updateInstitution":
            store.updateInstitution(params as Parameters<typeof store.updateInstitution>[0]);
            return { success: true, message: "Institution updated" };

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
            return { success: true, message: "Accreditation details updated" };

          case "updateDates":
            store.updateDates(params as Parameters<typeof store.updateDates>[0]);
            return { success: true, message: "Dates updated" };

          case "updateReference":
            store.updateReference(params as Parameters<typeof store.updateReference>[0]);
            return { success: true, message: "Reference details updated" };

          case "setDiplomaType": {
            const t = params.type as DiplomaType;
            if (!VALID_TYPES.includes(t)) return { success: false, message: `Invalid type: ${t}` };
            store.setDiplomaType(t);
            return { success: true, message: `Diploma type set to ${t}` };
          }

          case "addSignatory": {
            const newId = store.addSignatory();
            if (params.name || params.title || params.role) {
              store.updateSignatory(newId, {
                name: (params.name as string) || "",
                title: (params.title as string) || "",
                role: (params.role as string) || "",
              });
            }
            return { success: true, message: "Signatory added" };
          }

          case "updateSignatory": {
            const idx = params.index as number;
            const sig = store.form.signatories[idx];
            if (!sig) return { success: false, message: `Invalid index: ${idx}` };
            const patch: Record<string, string> = {};
            if (params.name !== undefined) patch.name = params.name as string;
            if (params.title !== undefined) patch.title = params.title as string;
            if (params.role !== undefined) patch.role = params.role as string;
            store.updateSignatory(sig.id, patch);
            return { success: true, message: "Signatory updated" };
          }

          case "removeSignatory": {
            const idx = params.index as number;
            const sig = store.form.signatories[idx];
            if (!sig) return { success: false, message: `Invalid index: ${idx}` };
            store.removeSignatory(sig.id);
            return { success: true, message: "Signatory removed" };
          }

          case "updateSeal":
            store.updateSeal(params as Parameters<typeof store.updateSeal>[0]);
            return { success: true, message: "Seal settings updated" };

          case "updateStyle": {
            if (params.template) {
              store.setTemplate(params.template as DiplomaTemplate);
            }
            if (params.accentColor) {
              store.setAccentColor(params.accentColor as string);
            }
            const stylePatch: Record<string, unknown> = {};
            if (params.fontPairing) stylePatch.fontPairing = params.fontPairing;
            if (params.fontScale) stylePatch.fontScale = params.fontScale;
            if (params.headerStyle) stylePatch.headerStyle = params.headerStyle;
            if (Object.keys(stylePatch).length > 0) {
              store.updateStyle(stylePatch as Parameters<typeof store.updateStyle>[0]);
            }
            return { success: true, message: "Style updated" };
          }

          case "updateFormat":
            store.updateFormat(params as Parameters<typeof store.updateFormat>[0]);
            return { success: true, message: "Format updated" };

          case "resetForm":
            store.resetForm(params.diplomaType as DiplomaType | undefined);
            return { success: true, message: "Diploma reset to defaults" };

          case "readCurrentState":
            return { success: true, message: "Current diploma state", newState: readDiplomaState() };

          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) return { success: false, message: "No business profile saved." };
            if (memory.profile.companyName) {
              store.updateInstitution({ institutionName: memory.profile.companyName });
              return { success: true, message: `Institution pre-filled: ${memory.profile.companyName}` };
            }
            return { success: false, message: "No company name in profile." };
          }

          case "validateBeforeExport": {
            const { issues, ready } = validateDiploma();
            const ec = issues.filter((i) => i.severity === "error").length;
            const wc = issues.filter((i) => i.severity === "warning").length;
            let msg = "";
            if (ready && wc === 0) msg = "Diploma is ready to export.";
            else if (ready) { msg = `Can export with ${wc} warning(s):\n`; for (const i of issues) msg += `  ⚠ ${i.message}\n`; }
            else { msg = `${ec} error(s), ${wc} warning(s):\n`; for (const i of issues) msg += `  ${i.severity === "error" ? "✘" : "⚠"} ${i.message}\n`; }
            return { success: true, message: msg.trim(), newState: { issues, ready, errorCount: ec, warningCount: wc } };
          }

          case "exportDocument": {
            const { ready, issues } = validateDiploma();
            if (!ready) return { success: false, message: `Cannot export: ${issues.filter((i) => i.severity === "error").map((i) => i.message).join(", ")}` };
            const handler = options?.onPrintRef?.current;
            if (!handler) return { success: false, message: "Export not ready yet." };
            handler();
            return { success: true, message: "Export triggered." };
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