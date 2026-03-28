// =============================================================================
// DMSuite — Certificate Designer Action Manifest for Chiko
// Gives Chiko AI full control over the Certificate Designer:
// content, style, templates, format, signatories, seal, export.
// Uses certificate-editor store (Pattern A — HTML/CSS renderer).
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import {
  useCertificateEditor,
  CERTIFICATE_TEMPLATES,
  CERTIFICATE_TYPES,
  type CertificateFormData,
  type CertificateType,
  type CertificateTemplate,
} from "@/stores/certificate-editor";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";

// ---------------------------------------------------------------------------
// Manifest Options
// ---------------------------------------------------------------------------

export interface CertificateManifestOptions {
  onPrintRef?: React.MutableRefObject<(() => void) | null>;
}

// ---------------------------------------------------------------------------
// Internal getState helper
// ---------------------------------------------------------------------------

function readCertificateState(): Record<string, unknown> {
  const { form } = useCertificateEditor.getState();
  return {
    certificateType: form.certificateType,
    title: form.title,
    subtitle: form.subtitle,
    recipientName: form.recipientName,
    description: form.description,
    additionalText: form.additionalText,
    organizationName: form.organizationName,
    organizationSubtitle: form.organizationSubtitle,
    eventName: form.eventName,
    courseName: form.courseName,
    dateIssued: form.dateIssued,
    validUntil: form.validUntil,
    referenceNumber: form.referenceNumber,
    signatories: form.signatories.map((s, i) => ({
      index: i,
      id: s.id,
      name: s.name,
      title: s.title,
      organization: s.organization,
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
    availableTypes: CERTIFICATE_TYPES.map((t) => t.id),
    availableTemplates: CERTIFICATE_TEMPLATES.map((t) => ({ id: t.id, name: t.name })),
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

function validateCertificate(): { issues: ValidationIssue[]; ready: boolean } {
  const { form } = useCertificateEditor.getState();
  const issues: ValidationIssue[] = [];

  if (!form.recipientName || form.recipientName.trim().length === 0) {
    issues.push({ severity: "error", field: "recipientName", message: "Recipient name is empty" });
  }
  if (!form.title || form.title.trim().length === 0) {
    issues.push({ severity: "warning", field: "title", message: "Certificate title is empty" });
  }
  if (!form.organizationName || form.organizationName.trim().length === 0) {
    issues.push({ severity: "warning", field: "organizationName", message: "Organization name is not set" });
  }
  if (!form.dateIssued) {
    issues.push({ severity: "warning", field: "dateIssued", message: "No date set" });
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  return { issues, ready: errorCount === 0 };
}

// ---------------------------------------------------------------------------
// Manifest Factory
// ---------------------------------------------------------------------------

const VALID_TYPES: CertificateType[] = ["achievement", "completion", "appreciation", "participation", "training", "recognition", "award", "excellence", "honorary", "membership"];
const VALID_TEMPLATES: CertificateTemplate[] = ["classic-blue", "burgundy-ornate", "antique-parchment", "golden-appreciation", "silver-weave", "vintage-warm", "teal-regal", "botanical-modern"];

export function createCertificateManifest(options?: CertificateManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "certificate",
    toolName: "Certificate Designer",
    actions: [
      // ── Content ──────────────────────────────────────────────────────────
      {
        name: "updateContent",
        description: "Update certificate content fields: title, subtitle, recipientName, description, additionalText.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Certificate title (e.g. 'Certificate of Achievement')" },
            subtitle: { type: "string", description: "Subtitle text (e.g. 'This is proudly presented to')" },
            recipientName: { type: "string", description: "Full name of the recipient" },
            description: { type: "string", description: "Main body text" },
            additionalText: { type: "string", description: "Extra text below description" },
          },
        },
        category: "Content",
      },

      // ── Organization ─────────────────────────────────────────────────────
      {
        name: "updateOrganization",
        description: "Update organization details: organizationName, organizationSubtitle.",
        parameters: {
          type: "object",
          properties: {
            organizationName: { type: "string", description: "Name of the issuing organization" },
            organizationSubtitle: { type: "string", description: "Subtitle or department" },
          },
        },
        category: "Content",
      },

      // ── Event / Program ──────────────────────────────────────────────────
      {
        name: "updateEvent",
        description: "Update event or program details: eventName, courseName.",
        parameters: {
          type: "object",
          properties: {
            eventName: { type: "string", description: "Event name" },
            courseName: { type: "string", description: "Course or program name" },
          },
        },
        category: "Content",
      },

      // ── Dates & Reference ────────────────────────────────────────────────
      {
        name: "updateDates",
        description: "Update dates and reference: dateIssued, validUntil, referenceNumber.",
        parameters: {
          type: "object",
          properties: {
            dateIssued: { type: "string", description: "Date issued (YYYY-MM-DD)" },
            validUntil: { type: "string", description: "Valid until date (YYYY-MM-DD)" },
            referenceNumber: { type: "string", description: "Certificate reference/serial number" },
          },
        },
        category: "Content",
      },

      // ── Certificate Type ─────────────────────────────────────────────────
      {
        name: "setCertificateType",
        description: "Change the certificate type.",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: VALID_TYPES, description: "Certificate type" },
          },
          required: ["type"],
        },
        category: "Content",
      },

      // ── Signatories ──────────────────────────────────────────────────────
      {
        name: "addSignatory",
        description: "Add a new signatory to the certificate (max 4).",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Signatory full name" },
            title: { type: "string", description: "Signatory title/position" },
            organization: { type: "string", description: "Signatory organization" },
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
            organization: { type: "string", description: "Signatory organization" },
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

      // ── Seal ─────────────────────────────────────────────────────────────
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

      // ── Style ────────────────────────────────────────────────────────────
      {
        name: "updateStyle",
        description: "Change visual styling: template, accentColor, fontPairing, fontScale, headerStyle.",
        parameters: {
          type: "object",
          properties: {
            template: { type: "string", enum: VALID_TEMPLATES, description: "Visual template" },
            accentColor: { type: "string", description: "Hex color like #35517D" },
            fontPairing: { type: "string", enum: ["playfair-lato", "inter-jetbrains", "merriweather-opensans", "cormorant-montserrat", "crimson-source", "poppins-inter", "oswald-roboto", "dm-serif-dm-sans"], description: "Font pairing" },
            fontScale: { type: "number", description: "Font scale multiplier (0.85 to 1.2)" },
            headerStyle: { type: "string", enum: ["centered", "left-aligned", "accent-bar"], description: "Header layout style" },
          },
        },
        category: "Style",
      },

      // ── Format ───────────────────────────────────────────────────────────
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

      // ── Reset ─────────────────────────────────────────────────────────────
      {
        name: "resetForm",
        description: "Reset the certificate to defaults. WARNING: Erases all current content.",
        parameters: {
          type: "object",
          properties: {
            certificateType: { type: "string", enum: VALID_TYPES, description: "Certificate type to reset to" },
          },
        },
        category: "Reset",
        destructive: true,
      },

      // ── Read State ────────────────────────────────────────────────────────
      {
        name: "readCurrentState",
        description: "Read all current certificate settings. No changes made.",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },

      // ── Prefill from Business Memory ──────────────────────────────────────
      {
        name: "prefillFromMemory",
        description: "Pre-fill organization name from saved business profile.",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },

      // ── Validation ─────────────────────────────────────────────────────────
      {
        name: "validateBeforeExport",
        description: "Check the certificate for issues before exporting.",
        parameters: { type: "object", properties: {} },
        category: "Validate",
      },

      // ── Export ─────────────────────────────────────────────────────────────
      {
        name: "exportDocument",
        description: "Export or print the certificate via browser print dialog (PDF/Print).",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["print"], description: "Export format" },
          },
        },
        category: "Export",
      },
    ],

    // ── getState ─────────────────────────────────────────────────────────────
    getState: readCertificateState,

    // ── executeAction ─────────────────────────────────────────────────────────
    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useCertificateEditor.getState();
      try {
        switch (actionName) {
          case "updateContent":
            store.updateContent(params as Parameters<typeof store.updateContent>[0]);
            return { success: true, message: "Content updated" };

          case "updateOrganization":
            store.updateOrganization(params as Parameters<typeof store.updateOrganization>[0]);
            return { success: true, message: "Organization updated" };

          case "updateEvent":
            store.updateEvent(params as Parameters<typeof store.updateEvent>[0]);
            return { success: true, message: "Event details updated" };

          case "updateDates":
            store.updateDates(params as Parameters<typeof store.updateDates>[0]);
            return { success: true, message: "Dates updated" };

          case "setCertificateType": {
            const t = params.type as CertificateType;
            if (!VALID_TYPES.includes(t)) {
              return { success: false, message: `Invalid type: ${t}. Valid: ${VALID_TYPES.join(", ")}` };
            }
            store.setCertificateType(t);
            return { success: true, message: `Certificate type set to ${t}` };
          }

          case "addSignatory": {
            if (store.form.signatories.length >= 4) {
              return { success: false, message: "Maximum 4 signatories allowed" };
            }
            const newId = store.addSignatory();
            if (params.name || params.title || params.organization) {
              store.updateSignatory(newId, {
                name: (params.name as string) || "",
                title: (params.title as string) || "",
                organization: (params.organization as string) || "",
              });
            }
            return { success: true, message: "Signatory added" };
          }

          case "updateSignatory": {
            const idx = params.index as number;
            const sig = store.form.signatories[idx];
            if (!sig) return { success: false, message: `Invalid signatory index: ${idx}` };
            const patch: Record<string, string> = {};
            if (params.name !== undefined) patch.name = params.name as string;
            if (params.title !== undefined) patch.title = params.title as string;
            if (params.organization !== undefined) patch.organization = params.organization as string;
            store.updateSignatory(sig.id, patch);
            return { success: true, message: "Signatory updated" };
          }

          case "removeSignatory": {
            const idx = params.index as number;
            const sig = store.form.signatories[idx];
            if (!sig) return { success: false, message: `Invalid signatory index: ${idx}` };
            store.removeSignatory(sig.id);
            return { success: true, message: "Signatory removed" };
          }

          case "updateSeal":
            store.updateSeal(params as Parameters<typeof store.updateSeal>[0]);
            return { success: true, message: "Seal settings updated" };

          case "updateStyle": {
            if (params.template) {
              store.setTemplate(params.template as CertificateTemplate);
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
            store.resetForm(params.certificateType as CertificateType | undefined);
            return { success: true, message: "Certificate reset to defaults" };

          case "readCurrentState":
            return { success: true, message: "Current certificate state", newState: readCertificateState() };

          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) {
              return { success: false, message: "No business profile saved yet." };
            }
            const profile = memory.profile;
            if (profile.companyName) {
              store.updateOrganization({ organizationName: profile.companyName });
              return { success: true, message: `Organization pre-filled: ${profile.companyName}` };
            }
            return { success: false, message: "No company name in business profile." };
          }

          case "validateBeforeExport": {
            const { issues, ready } = validateCertificate();
            const errorCount = issues.filter((i) => i.severity === "error").length;
            const warningCount = issues.filter((i) => i.severity === "warning").length;
            let msg = "";
            if (ready && warningCount === 0) {
              msg = "Certificate is ready to export — no issues found.";
            } else if (ready) {
              msg = `Certificate can be exported but has ${warningCount} warning(s):\n`;
              for (const i of issues) msg += `  ⚠ ${i.message}\n`;
            } else {
              msg = `Certificate has ${errorCount} error(s) and ${warningCount} warning(s):\n`;
              for (const i of issues) msg += `  ${i.severity === "error" ? "✘" : "⚠"} ${i.message}\n`;
            }
            return { success: true, message: msg.trim(), newState: { issues, ready, errorCount, warningCount } };
          }

          case "exportDocument": {
            const { ready, issues } = validateCertificate();
            const errors = issues.filter((i) => i.severity === "error");
            if (!ready) {
              return { success: false, message: `Cannot export — ${errors.length} error(s):\n${errors.map((i) => `• ${i.message}`).join("\n")}` };
            }
            const handler = options?.onPrintRef?.current;
            if (!handler) return { success: false, message: "Export not ready yet — please wait and try again." };
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
    () => useCertificateEditor.getState().form,
    (snapshot) => useCertificateEditor.getState().setForm(snapshot as CertificateFormData),
  );
}
