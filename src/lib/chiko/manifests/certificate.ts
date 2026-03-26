// =============================================================================
// DMSuite — Certificate Designer Action Manifest for Chiko
// Gives Chiko AI full control over the Certificate Designer:
// content, organization, signatories, seal, style, and format settings.
// Follows the exact same architecture as contract.ts.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useCertificateEditor } from "@/stores/certificate-editor";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";
import type {
  CertificateFormData,
  CertificateType,
  CertificateStyleConfig,
  CertificateFormatConfig,
  SealStyle,
  BorderStyle,
  Signatory,
} from "@/stores/certificate-editor";

// ---------------------------------------------------------------------------
// Manifest Options
// ---------------------------------------------------------------------------

export interface CertificateManifestOptions {
  onPrintRef?: React.RefObject<(() => void) | null>;
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
    signatories: form.signatories.map((s) => ({
      id: s.id,
      name: s.name,
      title: s.title,
      organization: s.organization,
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
    issues.push({ severity: "warning", field: "dateIssued", message: "No date issued set" });
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

export function createCertificateManifest(options?: CertificateManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "certificate",
    toolName: "Certificate Designer",
    actions: [
      // ── Content ──────────────────────────────────────────────────────────
      {
        name: "updateContent",
        description:
          "Update certificate content: title, subtitle, recipientName, description, additionalText.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Certificate title (e.g. 'Certificate of Achievement')" },
            subtitle: { type: "string", description: "Subtitle text (e.g. 'This certificate is proudly presented to')" },
            recipientName: { type: "string", description: "Full name of the recipient" },
            description: { type: "string", description: "Main body text describing the achievement/completion" },
            additionalText: { type: "string", description: "Optional additional text or message" },
          },
        },
        category: "Content",
      },

      // ── Certificate Type ──────────────────────────────────────────────────
      {
        name: "setCertificateType",
        description: "Change the certificate type. Updates the title automatically.",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "achievement", "completion", "appreciation", "participation",
                "training", "recognition", "award", "excellence",
                "honorary", "membership",
              ],
              description: "Certificate type",
            },
          },
          required: ["type"],
        },
        category: "Content",
      },

      // ── Organization ──────────────────────────────────────────────────────
      {
        name: "updateOrganization",
        description: "Update organization details: organizationName, organizationSubtitle.",
        parameters: {
          type: "object",
          properties: {
            organizationName: { type: "string", description: "Name of the issuing organization" },
            organizationSubtitle: { type: "string", description: "Department, division, or tagline" },
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
            eventName: { type: "string", description: "Name of the event or ceremony" },
            courseName: { type: "string", description: "Name of the course or program" },
          },
        },
        category: "Content",
      },

      // ── Dates & Reference ─────────────────────────────────────────────────
      {
        name: "updateDates",
        description: "Update dates and reference: dateIssued, validUntil, referenceNumber.",
        parameters: {
          type: "object",
          properties: {
            dateIssued: { type: "string", description: "Date of issue (YYYY-MM-DD)" },
            validUntil: { type: "string", description: "Expiry or validity date (YYYY-MM-DD)" },
            referenceNumber: { type: "string", description: "Certificate reference or serial number (e.g. CERT-2026-001)" },
          },
        },
        category: "Content",
      },

      // ── Signatories ──────────────────────────────────────────────────────
      {
        name: "addSignatory",
        description: "Add a new signatory to the certificate. Returns the new signatory ID.",
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
            organization: { type: "string", description: "Signatory organization (optional)" },
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
        description: "Configure the certificate seal: showSeal, sealText, sealStyle.",
        parameters: {
          type: "object",
          properties: {
            showSeal: { type: "boolean", description: "Show or hide the seal" },
            sealText: { type: "string", description: "Text inside the seal (e.g. OFFICIAL, CERTIFIED)" },
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
                "classic-gold", "corporate-modern", "academic-formal", "elegant-script",
                "government-official", "creative-achievement", "sports-athletics",
                "professional-training", "vintage-ornate", "minimalist-premium",
              ],
              description: "Visual template preset",
            },
            accentColor: { type: "string", description: "Accent colour as hex (e.g. #b8860b)" },
            borderStyle: {
              type: "string",
              enum: [
                "ornate-gold", "clean-line", "double-frame", "thin-elegant", "official-border",
                "accent-corner", "bold-stripe", "modern-bracket", "vintage-frame", "minimal-rule", "none",
              ],
              description: "Border style",
            },
            fontPairing: {
              type: "string",
              enum: [
                "playfair-lato", "inter-jetbrains", "merriweather-opensans", "cormorant-montserrat",
                "crimson-source", "poppins-inter", "oswald-roboto", "dm-serif-dm-sans",
              ],
              description: "Font pairing ID",
            },
            fontScale: { type: "number", description: "Font scale multiplier (0.85–1.2)" },
            headerStyle: {
              type: "string",
              enum: ["centered", "left-aligned", "accent-bar"],
              description: "Header layout style",
            },
          },
        },
        category: "Style",
      },
      {
        name: "setTemplate",
        description: "Quick-apply a full template preset. Updates accent, border, background, and font pairing at once.",
        parameters: {
          type: "object",
          properties: {
            template: {
              type: "string",
              enum: [
                "classic-gold", "corporate-modern", "academic-formal", "elegant-script",
                "government-official", "creative-achievement", "sports-athletics",
                "professional-training", "vintage-ornate", "minimalist-premium",
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
        description: "Reset the certificate to defaults. WARNING: Erases all current content.",
        parameters: {
          type: "object",
          properties: {
            certificateType: {
              type: "string",
              enum: [
                "achievement", "completion", "appreciation", "participation",
                "training", "recognition", "award", "excellence",
                "honorary", "membership",
              ],
              description: "Certificate type to reset to (optional — defaults to current type)",
            },
          },
        },
        category: "Document",
        destructive: true,
      },
      {
        name: "readCurrentState",
        description: "Read all current certificate settings. No changes made.",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },
      {
        name: "prefillFromMemory",
        description: "Pre-fill organization name from saved business profile.",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },

      // ── Validation ─────────────────────────────────────────────────────────
      {
        name: "validateBeforePrint",
        description:
          "Check the certificate for issues before printing: missing recipient name, empty fields, unsigned signatories. ALWAYS call this before exportPrint.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      // ── Export ─────────────────────────────────────────────────────────────
      {
        name: "exportPrint",
        description: "Open the browser print dialog for the current certificate.",
        parameters: { type: "object", properties: {} },
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

          case "setCertificateType":
            store.setCertificateType(params.type as CertificateType);
            return { success: true, message: `Certificate type changed to ${params.type}` };

          case "updateOrganization":
            store.updateOrganization(params as Parameters<typeof store.updateOrganization>[0]);
            return { success: true, message: "Organization updated" };

          case "updateEvent":
            store.updateEvent(params as Parameters<typeof store.updateEvent>[0]);
            return { success: true, message: "Event details updated" };

          case "updateDates":
            store.updateDates(params as Parameters<typeof store.updateDates>[0]);
            return { success: true, message: "Dates updated" };

          case "addSignatory": {
            const id = store.addSignatory();
            return { success: true, message: `Signatory added (id: ${id})` };
          }

          case "updateSignatory":
            store.updateSignatory(params.id as string, params as Partial<Signatory>);
            return { success: true, message: "Signatory updated" };

          case "removeSignatory":
            store.removeSignatory(params.id as string);
            return { success: true, message: "Signatory removed" };

          case "updateSeal":
            store.updateSeal(params as Parameters<typeof store.updateSeal>[0]);
            return { success: true, message: "Seal updated" };

          case "updateStyle":
            store.updateStyle(params as Partial<CertificateStyleConfig>);
            return { success: true, message: "Style updated" };

          case "setTemplate":
            store.setTemplate(params.template as CertificateStyleConfig["template"]);
            return { success: true, message: `Template set to ${params.template}` };

          case "updateFormat":
            store.updateFormat(params as Partial<CertificateFormatConfig>);
            return { success: true, message: "Format updated" };

          case "resetForm":
            store.resetForm(params.certificateType as CertificateType | undefined);
            return { success: true, message: "Certificate reset to defaults" };

          case "readCurrentState":
            return { success: true, message: "Current certificate state", newState: readCertificateState() };

          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) {
              return { success: false, message: "No business profile saved yet. Ask the user to set up their Business Memory first." };
            }
            const profile = memory.profile;
            if (profile.companyName) {
              store.updateOrganization({ organizationName: profile.companyName });
              return { success: true, message: `Organization pre-filled: ${profile.companyName}` };
            }
            return { success: false, message: "Business profile has no company name to pre-fill." };
          }

          case "validateBeforePrint": {
            const { issues, ready } = validateCertificate();
            const errorCount = issues.filter((i) => i.severity === "error").length;
            const warningCount = issues.filter((i) => i.severity === "warning").length;
            let msg = "";
            if (ready && warningCount === 0) {
              msg = "Certificate is ready to print — no issues found.";
            } else if (ready) {
              msg = `Certificate can be printed but has ${warningCount} warning(s) to review:\n`;
              for (const i of issues) msg += `  ⚠ ${i.message}\n`;
            } else {
              msg = `Certificate has ${errorCount} error(s) and ${warningCount} warning(s):\n`;
              for (const i of issues) msg += `  ${i.severity === "error" ? "✘" : "⚠"} ${i.message}\n`;
            }
            return { success: true, message: msg.trim(), newState: { issues, ready, errorCount, warningCount } };
          }

          case "exportPrint": {
            const { issues, ready } = validateCertificate();
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
            return { success: true, message: `Print dialog opened for ${store.form.title}.` };
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
