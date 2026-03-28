// =============================================================================
// DMSuite  Diploma Canvas Designer Action Manifest for Chiko
// Gives Chiko AI full control over the canvas-based Diploma Designer:
// institution, program, recipient, signatories, style, presets, export.
// Bridges between Chiko action system and the new vNext canvas editor.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useDiplomaCanvas } from "@/stores/diploma-canvas";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";
import {
  type DiplomaConfig,
  type DiplomaType,
  type DiplomaSize,
  type DiplomaStyle,
  type HonorsLevel,
  DIPLOMA_COLOR_SCHEMES,
  DIPLOMA_TEMPLATE_PRESETS,
  DIPLOMA_SIZES,
  HONORS_LEVELS,
} from "@/lib/editor/diploma-composer";

// ---------------------------------------------------------------------------
// Manifest Options
// ---------------------------------------------------------------------------

export interface DiplomaManifestOptions {
  onExportPng?: React.RefObject<(() => void) | null>;
  onExportPdf?: React.RefObject<(() => void) | null>;
  onCopy?: React.RefObject<(() => void) | null>;
}

// ---------------------------------------------------------------------------
// Internal getState helper
// ---------------------------------------------------------------------------

function readDiplomaState(): Record<string, unknown> {
  const { config, activePresetId } = useDiplomaCanvas.getState();
  return {
    type: config.type,
    size: config.size,
    style: config.style,
    colorSchemeId: config.colorSchemeId,
    institutionName: config.institutionName,
    institutionSubtitle: config.institutionSubtitle,
    institutionMotto: config.institutionMotto,
    recipientName: config.recipientName,
    recipientId: config.recipientId,
    degreeName: config.degreeName,
    fieldOfStudy: config.fieldOfStudy,
    honors: config.honors,
    conferralText: config.conferralText,
    resolutionText: config.resolutionText,
    accreditationBody: config.accreditationBody,
    accreditationNumber: config.accreditationNumber,
    dateConferred: config.dateConferred,
    graduationDate: config.graduationDate,
    registrationNumber: config.registrationNumber,
    serialNumber: config.serialNumber,
    signatories: config.signatories.map((s, i) => ({
      index: i,
      name: s.name,
      title: s.title,
      role: s.role,
    })),
    signatoryCount: config.signatories.length,
    showSeal: config.showSeal,
    showCorners: config.showCorners,
    showBorder: config.showBorder,
    showMotto: config.showMotto,
    activePresetId,
    availableColorSchemes: DIPLOMA_COLOR_SCHEMES.map((c) => c.id),
    availablePresets: DIPLOMA_TEMPLATE_PRESETS.map((p) => ({ id: p.id, label: p.label, type: p.type })),
    availableSizes: DIPLOMA_SIZES.map((s) => ({ id: s.id, label: s.label })),
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
  const { config } = useDiplomaCanvas.getState();
  const issues: ValidationIssue[] = [];

  if (!config.recipientName || config.recipientName.trim().length === 0) {
    issues.push({ severity: "error", field: "recipientName", message: "Recipient name is empty" });
  }
  if (!config.degreeName || config.degreeName.trim().length === 0) {
    issues.push({ severity: "warning", field: "degreeName", message: "Degree / program name is empty" });
  }
  if (!config.institutionName || config.institutionName.trim().length === 0) {
    issues.push({ severity: "warning", field: "institutionName", message: "Institution name is not set" });
  }
  if (!config.dateConferred) {
    issues.push({ severity: "warning", field: "dateConferred", message: "No conferral date set" });
  }
  const namedSignatories = config.signatories.filter((s) => s.name.trim().length > 0);
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
const VALID_STYLES: DiplomaStyle[] = ["academic", "modern", "classic", "ivy-league", "executive", "minimal"];
const VALID_SIZES: DiplomaSize[] = ["a4-landscape", "a4-portrait", "letter-landscape", "letter-portrait"];
const VALID_HONORS: HonorsLevel[] = ["", "cum-laude", "magna-cum-laude", "summa-cum-laude", "distinction", "high-distinction", "first-class", "merit"];

// ---------------------------------------------------------------------------
// Manifest Factory
// ---------------------------------------------------------------------------

export function createDiplomaManifest(options?: DiplomaManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "diploma-designer",
    toolName: "Diploma & Accreditation Designer (Canvas)",
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
        description: "Update program details: degreeName, fieldOfStudy, honors.",
        parameters: {
          type: "object",
          properties: {
            degreeName: { type: "string", description: "Degree or program name" },
            fieldOfStudy: { type: "string", description: "Major or field of study" },
            honors: { type: "string", enum: ["", "cum-laude", "magna-cum-laude", "summa-cum-laude", "distinction", "high-distinction", "first-class", "merit"], description: "Honors level" },
          },
        },
        category: "Content",
      },

      // -- Conferral
      {
        name: "updateConferral",
        description: "Update conferral text, resolution text, accreditation body and number.",
        parameters: {
          type: "object",
          properties: {
            conferralText: { type: "string", description: "Conferral statement" },
            resolutionText: { type: "string", description: "Resolution / authority text" },
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

      // -- Diploma Type
      {
        name: "setDiplomaType",
        description: "Change the diploma type.",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["bachelors", "masters", "doctorate", "professional-diploma", "honorary-doctorate", "vocational", "postgraduate", "accreditation"], description: "Diploma type" },
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
            role: { type: "string", description: "Signatory role" },
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

      // -- Style
      {
        name: "setStyle",
        description: "Change the visual style.",
        parameters: {
          type: "object",
          properties: {
            style: { type: "string", enum: ["academic", "modern", "classic", "ivy-league", "executive", "minimal"], description: "Visual style" },
          },
          required: ["style"],
        },
        category: "Style",
      },

      // -- Color Scheme
      {
        name: "setColorScheme",
        description: "Change the color scheme. Available: university-navy, ivy-crimson, academic-green, royal-purple, executive-black, medical-teal, classic-gold, vintage-sepia.",
        parameters: {
          type: "object",
          properties: {
            schemeId: { type: "string", enum: ["university-navy", "ivy-crimson", "academic-green", "royal-purple", "executive-black", "medical-teal", "classic-gold", "vintage-sepia"], description: "Color scheme ID" },
          },
          required: ["schemeId"],
        },
        category: "Style",
      },

      // -- Size
      {
        name: "setSize",
        description: "Change page size/orientation.",
        parameters: {
          type: "object",
          properties: {
            size: { type: "string", enum: ["a4-landscape", "a4-portrait", "letter-landscape", "letter-portrait"], description: "Page size" },
          },
          required: ["size"],
        },
        category: "Format",
      },

      // -- Feature Toggles
      {
        name: "toggleFeatures",
        description: "Toggle decorative elements: seal, corners, border, motto.",
        parameters: {
          type: "object",
          properties: {
            showSeal: { type: "boolean", description: "Show/hide seal" },
            showCorners: { type: "boolean", description: "Show/hide corners" },
            showBorder: { type: "boolean", description: "Show/hide border" },
            showMotto: { type: "boolean", description: "Show/hide motto" },
          },
        },
        category: "Style",
      },

      // -- Preset
      {
        name: "applyPreset",
        description: "Apply a template preset. Available: university-classic, ivy-league, graduate-modern, doctorate-formal, executive-diploma, medical-credential, tvet-vocational, accreditation-cert.",
        parameters: {
          type: "object",
          properties: {
            presetId: { type: "string", enum: ["university-classic", "ivy-league", "graduate-modern", "doctorate-formal", "executive-diploma", "medical-credential", "tvet-vocational", "accreditation-cert"], description: "Preset ID" },
          },
          required: ["presetId"],
        },
        category: "Style",
      },

      // -- Honors
      {
        name: "setHonors",
        description: "Set the honors level.",
        parameters: {
          type: "object",
          properties: {
            honors: { type: "string", enum: ["", "cum-laude", "magna-cum-laude", "summa-cum-laude", "distinction", "high-distinction", "first-class", "merit"], description: "Honors level" },
          },
          required: ["honors"],
        },
        category: "Content",
      },

      // -- Serial
      { name: "regenerateSerial", description: "Generate a new random serial number.", parameters: { type: "object", properties: {} }, category: "Content" },

      // -- Reset
      {
        name: "resetDiploma",
        description: "Reset diploma to defaults. WARNING: Erases content.",
        parameters: {
          type: "object",
          properties: {
            diplomaType: { type: "string", enum: ["bachelors", "masters", "doctorate", "professional-diploma", "honorary-doctorate", "vocational", "postgraduate", "accreditation"], description: "Type to reset to" },
          },
        },
        category: "Document",
        destructive: true,
      },

      // -- Read
      { name: "readCurrentState", description: "Read all current diploma settings.", parameters: { type: "object", properties: {} }, category: "Read" },
      { name: "prefillFromMemory", description: "Pre-fill institution from business profile.", parameters: { type: "object", properties: {} }, category: "Content" },
      { name: "validateBeforeExport", description: "Check diploma for issues before export.", parameters: { type: "object", properties: {} }, category: "Export" },
      { name: "exportPng", description: "Export as high-resolution PNG.", parameters: { type: "object", properties: {} }, category: "Export" },
      { name: "exportPdf", description: "Export as vector PDF.", parameters: { type: "object", properties: {} }, category: "Export" },
      { name: "copyToClipboard", description: "Copy as image to clipboard.", parameters: { type: "object", properties: {} }, category: "Export" },
    ],

    getState: readDiplomaState,

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useDiplomaCanvas.getState();
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

          case "updateDates":
            store.updateDates(params as Parameters<typeof store.updateDates>[0]);
            return { success: true, message: "Dates updated" };

          case "setDiplomaType": {
            const t = params.type as DiplomaType;
            if (!VALID_TYPES.includes(t)) return { success: false, message: `Invalid type: ${t}` };
            store.setType(t);
            return { success: true, message: `Diploma type set to ${t}` };
          }

          case "addSignatory":
            store.addSignatory({ name: (params.name as string) || "", title: (params.title as string) || "", role: (params.role as string) || "" });
            return { success: true, message: "Signatory added" };

          case "updateSignatory": {
            const idx = params.index as number;
            if (idx < 0 || idx >= store.config.signatories.length) return { success: false, message: `Invalid index: ${idx}` };
            const patch: Record<string, string> = {};
            if (params.name !== undefined) patch.name = params.name as string;
            if (params.title !== undefined) patch.title = params.title as string;
            if (params.role !== undefined) patch.role = params.role as string;
            store.updateSignatory(idx, patch);
            return { success: true, message: "Signatory updated" };
          }

          case "removeSignatory": {
            const idx = params.index as number;
            if (idx < 0 || idx >= store.config.signatories.length) return { success: false, message: `Invalid index: ${idx}` };
            store.removeSignatory(idx);
            return { success: true, message: "Signatory removed" };
          }

          case "setStyle": {
            const s = params.style as DiplomaStyle;
            if (!VALID_STYLES.includes(s)) return { success: false, message: `Invalid style: ${s}` };
            store.setStyle(s);
            return { success: true, message: `Style set to ${s}` };
          }

          case "setColorScheme": {
            const id = params.schemeId as string;
            if (!DIPLOMA_COLOR_SCHEMES.some((c) => c.id === id)) return { success: false, message: `Invalid scheme: ${id}` };
            store.setColorScheme(id);
            return { success: true, message: `Color scheme set to ${id}` };
          }

          case "setSize": {
            const sz = params.size as DiplomaSize;
            if (!VALID_SIZES.includes(sz)) return { success: false, message: `Invalid size: ${sz}` };
            store.setSize(sz);
            return { success: true, message: `Size set to ${sz}` };
          }

          case "toggleFeatures": {
            const features = ["showSeal", "showCorners", "showBorder", "showMotto"] as const;
            for (const f of features) {
              if (typeof params[f] === "boolean") store.toggleFeature(f, params[f] as boolean);
            }
            return { success: true, message: "Feature toggles updated" };
          }

          case "applyPreset": {
            const pid = params.presetId as string;
            if (!DIPLOMA_TEMPLATE_PRESETS.some((p) => p.id === pid)) return { success: false, message: `Invalid preset: ${pid}` };
            store.applyPreset(pid);
            return { success: true, message: `Preset "${pid}" applied` };
          }

          case "setHonors": {
            const h = params.honors as HonorsLevel;
            if (!VALID_HONORS.includes(h)) return { success: false, message: `Invalid honors: ${h}` };
            store.setHonors(h);
            return { success: true, message: `Honors set to ${h || "(none)"}` };
          }

          case "regenerateSerial":
            store.regenerateSerial();
            return { success: true, message: `Serial regenerated: ${useDiplomaCanvas.getState().config.serialNumber}` };

          case "resetDiploma":
            store.resetConfig(params.diplomaType as DiplomaType | undefined);
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
            else if (ready) { msg = `Can export with ${wc} warning(s):\n`; for (const i of issues) msg += `  Warning: ${i.message}\n`; }
            else { msg = `${ec} error(s), ${wc} warning(s):\n`; for (const i of issues) msg += `  ${i.severity === "error" ? "Error" : "Warning"}: ${i.message}\n`; }
            return { success: true, message: msg.trim(), newState: { issues, ready, errorCount: ec, warningCount: wc } };
          }

          case "exportPng": {
            const { ready, issues } = validateDiploma();
            if (!ready) return { success: false, message: `Cannot export: ${issues.filter((i) => i.severity === "error").map((i) => i.message).join(", ")}` };
            const handler = options?.onExportPng?.current;
            if (!handler) return { success: false, message: "Export not ready yet." };
            handler();
            return { success: true, message: "PNG export started." };
          }

          case "exportPdf": {
            const { ready, issues } = validateDiploma();
            if (!ready) return { success: false, message: `Cannot export: ${issues.filter((i) => i.severity === "error").map((i) => i.message).join(", ")}` };
            const handler = options?.onExportPdf?.current;
            if (!handler) return { success: false, message: "PDF export not ready yet." };
            handler();
            return { success: true, message: "Vector PDF export started." };
          }

          case "copyToClipboard": {
            const handler = options?.onCopy?.current;
            if (!handler) return { success: false, message: "Copy not ready yet." };
            handler();
            return { success: true, message: "Diploma copied to clipboard." };
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
    () => useDiplomaCanvas.getState().config,
    (snapshot) => useDiplomaCanvas.getState().setConfig(snapshot as DiplomaConfig),
  );
}