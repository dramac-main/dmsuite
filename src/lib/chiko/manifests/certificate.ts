// =============================================================================
// DMSuite — Certificate Designer Canvas Action Manifest for Chiko
// Gives Chiko AI full control over the canvas-based Certificate Designer:
// content, style, color scheme, features, presets, export.
// Bridges between Chiko action system and the new vNext canvas editor.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useCertificateCanvas } from "@/stores/certificate-canvas";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";
import {
  type CertificateConfig,
  type CertificateType,
  type CertificateSize,
  type CertStyle,
  CERT_COLOR_SCHEMES,
  CERT_TEMPLATE_PRESETS,
  CERT_SIZES,
} from "@/lib/editor/certificate-composer";

// ---------------------------------------------------------------------------
// Manifest Options
// ---------------------------------------------------------------------------

export interface CertificateManifestOptions {
  onExportPng?: React.RefObject<(() => void) | null>;
  onExportPdf?: React.RefObject<(() => void) | null>;
  onCopy?: React.RefObject<(() => void) | null>;
}

// ---------------------------------------------------------------------------
// Internal getState helper
// ---------------------------------------------------------------------------

function readCertificateState(): Record<string, unknown> {
  const { config, activePresetId } = useCertificateCanvas.getState();
  return {
    type: config.type,
    title: config.title,
    subtitle: config.subtitle,
    recipientName: config.recipientName,
    description: config.description,
    issuerName: config.issuerName,
    issuerTitle: config.issuerTitle,
    organizationName: config.organizationName,
    date: config.date,
    serialNumber: config.serialNumber,
    size: config.size,
    style: config.style,
    colorSchemeId: config.colorSchemeId,
    showSeal: config.showSeal,
    showCorners: config.showCorners,
    showRibbon: config.showRibbon,
    showDivider: config.showDivider,
    activePresetId,
    availableColorSchemes: CERT_COLOR_SCHEMES.map((c) => c.id),
    availablePresets: CERT_TEMPLATE_PRESETS.map((p) => ({ id: p.id, label: p.label, type: p.certType })),
    availableSizes: CERT_SIZES.map((s) => ({ id: s.id, label: s.label })),
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
  const { config } = useCertificateCanvas.getState();
  const issues: ValidationIssue[] = [];

  if (!config.recipientName || config.recipientName.trim().length === 0) {
    issues.push({ severity: "error", field: "recipientName", message: "Recipient name is empty" });
  }
  if (!config.title || config.title.trim().length === 0) {
    issues.push({ severity: "warning", field: "title", message: "Certificate title is empty" });
  }
  if (!config.organizationName || config.organizationName.trim().length === 0) {
    issues.push({ severity: "warning", field: "organizationName", message: "Organization name is not set" });
  }
  if (!config.date) {
    issues.push({ severity: "warning", field: "date", message: "No date set" });
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  return { issues, ready: errorCount === 0 };
}

// ---------------------------------------------------------------------------
// Manifest Factory
// ---------------------------------------------------------------------------

const VALID_TYPES: CertificateType[] = ["achievement", "completion", "award", "recognition", "participation", "training", "diploma", "accreditation"];
const VALID_STYLES: CertStyle[] = ["classic", "modern", "elegant", "bold", "vintage", "minimal"];
const VALID_SIZES: CertificateSize[] = ["a4-landscape", "a4-portrait", "letter-landscape", "letter-portrait"];

export function createCertificateManifest(options?: CertificateManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "certificate",
    toolName: "Certificate Designer (Canvas)",
    actions: [
      // ── Content ──────────────────────────────────────────────────────────
      {
        name: "updateContent",
        description:
          "Update certificate content fields: title, subtitle, recipientName, description.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Certificate title (e.g. 'Certificate of Achievement')" },
            subtitle: { type: "string", description: "Subtitle text (e.g. 'This is proudly presented to')" },
            recipientName: { type: "string", description: "Full name of the recipient" },
            description: { type: "string", description: "Main body text describing the achievement/completion" },
          },
        },
        category: "Content",
      },

      // ── Issuer ───────────────────────────────────────────────────────────
      {
        name: "updateIssuer",
        description: "Update issuer and organization details: issuerName, issuerTitle, organizationName.",
        parameters: {
          type: "object",
          properties: {
            issuerName: { type: "string", description: "Issuer's full name" },
            issuerTitle: { type: "string", description: "Issuer's title/position" },
            organizationName: { type: "string", description: "Name of the issuing organization" },
          },
        },
        category: "Content",
      },

      // ── Meta (Date & Serial) ─────────────────────────────────────────────
      {
        name: "updateMeta",
        description: "Update date and serial number.",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date string (e.g. '15 January 2026')" },
            serialNumber: { type: "string", description: "Certificate serial (e.g. CERT-ABC12345)" },
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
            type: {
              type: "string",
              enum: VALID_TYPES,
              description: "Certificate type",
            },
          },
          required: ["type"],
        },
        category: "Content",
      },

      // ── Style ────────────────────────────────────────────────────────────
      {
        name: "setStyle",
        description: "Change the visual style. Each style selects different decorative assets (frames, borders, seals, ornaments).",
        parameters: {
          type: "object",
          properties: {
            style: {
              type: "string",
              enum: VALID_STYLES,
              description: "Visual style preset",
            },
          },
          required: ["style"],
        },
        category: "Style",
      },

      // ── Color Scheme ─────────────────────────────────────────────────────
      {
        name: "setColorScheme",
        description: "Change the color scheme. Available schemes: " + CERT_COLOR_SCHEMES.map((c) => `${c.id} (${c.label})`).join(", "),
        parameters: {
          type: "object",
          properties: {
            schemeId: {
              type: "string",
              enum: CERT_COLOR_SCHEMES.map((c) => c.id),
              description: "Color scheme ID",
            },
          },
          required: ["schemeId"],
        },
        category: "Style",
      },

      // ── Size ──────────────────────────────────────────────────────────────
      {
        name: "setSize",
        description: "Change the document size/orientation.",
        parameters: {
          type: "object",
          properties: {
            size: {
              type: "string",
              enum: VALID_SIZES,
              description: "Page size and orientation",
            },
          },
          required: ["size"],
        },
        category: "Format",
      },

      // ── Feature Toggles ──────────────────────────────────────────────────
      {
        name: "toggleFeatures",
        description: "Toggle decorative elements: seal, corner ornaments, ribbon banner, divider line.",
        parameters: {
          type: "object",
          properties: {
            showSeal: { type: "boolean", description: "Show/hide the seal emblem" },
            showCorners: { type: "boolean", description: "Show/hide corner decorations" },
            showRibbon: { type: "boolean", description: "Show/hide the ribbon banner" },
            showDivider: { type: "boolean", description: "Show/hide the divider rule" },
          },
        },
        category: "Style",
      },

      // ── Template Preset ───────────────────────────────────────────────────
      {
        name: "applyPreset",
        description: "Apply a full template preset. Changes style, colors, type, and feature toggles at once. Available presets: " +
          CERT_TEMPLATE_PRESETS.map((p) => `${p.id} (${p.label})`).join(", "),
        parameters: {
          type: "object",
          properties: {
            presetId: {
              type: "string",
              enum: CERT_TEMPLATE_PRESETS.map((p) => p.id),
              description: "Template preset ID",
            },
          },
          required: ["presetId"],
        },
        category: "Style",
      },

      // ── Serial ────────────────────────────────────────────────────────────
      {
        name: "regenerateSerial",
        description: "Generate a new random serial number for the certificate.",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },

      // ── Reset ─────────────────────────────────────────────────────────────
      {
        name: "resetCertificate",
        description: "Reset the certificate to defaults. WARNING: Erases all current content.",
        parameters: {
          type: "object",
          properties: {
            certificateType: {
              type: "string",
              enum: VALID_TYPES,
              description: "Certificate type to reset to (optional — defaults to achievement)",
            },
          },
        },
        category: "Document",
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
        description:
          "Check the certificate for issues before exporting: missing recipient name, empty fields. ALWAYS call this before exportPng/exportPdf.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      // ── Export ─────────────────────────────────────────────────────────────
      {
        name: "exportPng",
        description: "Export the certificate as a high-resolution PNG image.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
      {
        name: "exportPdf",
        description: "Export the certificate as a PDF document.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
      {
        name: "copyToClipboard",
        description: "Copy the certificate as an image to the clipboard.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
    ],

    // ── getState ─────────────────────────────────────────────────────────────
    getState: readCertificateState,

    // ── executeAction ─────────────────────────────────────────────────────────
    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useCertificateCanvas.getState();
      try {
        switch (actionName) {
          case "updateContent":
            store.updateContent(params as Parameters<typeof store.updateContent>[0]);
            return { success: true, message: "Content updated" };

          case "updateIssuer":
            store.updateIssuer(params as Parameters<typeof store.updateIssuer>[0]);
            return { success: true, message: "Issuer details updated" };

          case "updateMeta":
            store.updateMeta(params as Parameters<typeof store.updateMeta>[0]);
            return { success: true, message: "Date/serial updated" };

          case "setCertificateType": {
            const t = params.type as CertificateType;
            if (!VALID_TYPES.includes(t)) {
              return { success: false, message: `Invalid type: ${t}. Valid: ${VALID_TYPES.join(", ")}` };
            }
            store.setType(t);
            return { success: true, message: `Certificate type set to ${t}` };
          }

          case "setStyle": {
            const s = params.style as CertStyle;
            if (!VALID_STYLES.includes(s)) {
              return { success: false, message: `Invalid style: ${s}. Valid: ${VALID_STYLES.join(", ")}` };
            }
            store.setStyle(s);
            return { success: true, message: `Style set to ${s}` };
          }

          case "setColorScheme": {
            const id = params.schemeId as string;
            if (!CERT_COLOR_SCHEMES.some((c) => c.id === id)) {
              return { success: false, message: `Invalid color scheme: ${id}. Valid: ${CERT_COLOR_SCHEMES.map((c) => c.id).join(", ")}` };
            }
            store.setColorScheme(id);
            return { success: true, message: `Color scheme set to ${id}` };
          }

          case "setSize": {
            const sz = params.size as CertificateSize;
            if (!VALID_SIZES.includes(sz)) {
              return { success: false, message: `Invalid size: ${sz}. Valid: ${VALID_SIZES.join(", ")}` };
            }
            store.setSize(sz);
            return { success: true, message: `Size set to ${sz}` };
          }

          case "toggleFeatures": {
            const features = ["showSeal", "showCorners", "showRibbon", "showDivider"] as const;
            for (const f of features) {
              if (typeof params[f] === "boolean") {
                store.toggleFeature(f, params[f] as boolean);
              }
            }
            return { success: true, message: "Feature toggles updated" };
          }

          case "applyPreset": {
            const pid = params.presetId as string;
            if (!CERT_TEMPLATE_PRESETS.some((p) => p.id === pid)) {
              return { success: false, message: `Invalid preset: ${pid}` };
            }
            store.applyPreset(pid);
            return { success: true, message: `Preset "${pid}" applied` };
          }

          case "regenerateSerial":
            store.regenerateSerial();
            return { success: true, message: `Serial regenerated: ${useCertificateCanvas.getState().config.serialNumber}` };

          case "resetCertificate":
            store.resetConfig(params.certificateType as CertificateType | undefined);
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
              store.updateIssuer({ organizationName: profile.companyName });
              return { success: true, message: `Organization pre-filled: ${profile.companyName}` };
            }
            return { success: false, message: "Business profile has no company name to pre-fill." };
          }

          case "validateBeforeExport": {
            const { issues, ready } = validateCertificate();
            const errorCount = issues.filter((i) => i.severity === "error").length;
            const warningCount = issues.filter((i) => i.severity === "warning").length;
            let msg = "";
            if (ready && warningCount === 0) {
              msg = "Certificate is ready to export — no issues found.";
            } else if (ready) {
              msg = `Certificate can be exported but has ${warningCount} warning(s) to review:\n`;
              for (const i of issues) msg += `  ⚠ ${i.message}\n`;
            } else {
              msg = `Certificate has ${errorCount} error(s) and ${warningCount} warning(s):\n`;
              for (const i of issues) msg += `  ${i.severity === "error" ? "✘" : "⚠"} ${i.message}\n`;
            }
            return { success: true, message: msg.trim(), newState: { issues, ready, errorCount, warningCount } };
          }

          case "exportPng": {
            const { ready, issues } = validateCertificate();
            const errors = issues.filter((i) => i.severity === "error");
            if (!ready) {
              return { success: false, message: `Cannot export — ${errors.length} error(s):\n${errors.map((i) => `• ${i.message}`).join("\n")}` };
            }
            const handler = options?.onExportPng?.current;
            if (!handler) return { success: false, message: "Export not ready yet — please wait and try again." };
            handler();
            return { success: true, message: "PNG export started." };
          }

          case "exportPdf": {
            const { ready, issues } = validateCertificate();
            const errors = issues.filter((i) => i.severity === "error");
            if (!ready) {
              return { success: false, message: `Cannot export — ${errors.length} error(s):\n${errors.map((i) => `• ${i.message}`).join("\n")}` };
            }
            const handler = options?.onExportPdf?.current;
            if (!handler) return { success: false, message: "PDF export not ready yet — please wait and try again." };
            handler();
            return { success: true, message: "PDF export started." };
          }

          case "copyToClipboard": {
            const handler = options?.onCopy?.current;
            if (!handler) return { success: false, message: "Copy not ready yet — please wait and try again." };
            handler();
            return { success: true, message: "Certificate copied to clipboard." };
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
    () => useCertificateCanvas.getState().config,
    (snapshot) => useCertificateCanvas.getState().setConfig(snapshot as CertificateConfig),
  );
}
