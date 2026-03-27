/*  ═══════════════════════════════════════════════════════════════════════════
 *  Chiko AI Manifest — ID Badge & Lanyard Designer
 *  Registers all actions the Chiko assistant can take in this workspace.
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useIDBadgeEditor, type IDBadgeFormData, type BadgeType, type BadgeTemplate, BADGE_TYPES, BADGE_TEMPLATES, ROLE_VARIANTS, BADGE_ACCENT_COLORS, CARD_SIZES } from "@/stores/id-badge-editor";
import { withActivityLogging } from "@/stores/activity-log";

// ── Types ───────────────────────────────────────────────────────────────────

interface ManifestOptions {
  store: typeof useIDBadgeEditor;
  printRef: React.MutableRefObject<(() => void) | null>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function readState(): Record<string, unknown> {
  const f = useIDBadgeEditor.getState().form;
  return {
    badgeType: f.badgeType,
    template: f.style.template,
    firstName: f.firstName,
    lastName: f.lastName,
    title: f.title,
    department: f.department,
    employeeId: f.employeeId,
    role: f.role,
    email: f.email,
    phone: f.phone,
    accessLevel: f.accessLevel,
    photoUrl: f.photoUrl,
    organizationName: f.organizationName,
    organizationSubtitle: f.organizationSubtitle,
    organizationLogo: f.organizationLogo,
    issueDate: f.issueDate,
    expiryDate: f.expiryDate,
    customField1Label: f.customField1Label,
    customField1Value: f.customField1Value,
    customField2Label: f.customField2Label,
    customField2Value: f.customField2Value,
    signatoryName: f.signatory.name,
    signatoryTitle: f.signatory.title,
    batchMode: f.batchMode,
    batchCount: f.batchPeople.length,
    backSideEnabled: f.backSide.enabled,
    showQrCode: f.backSide.showQrCode,
    showBarcode: f.backSide.showBarcode,
    accentColor: f.style.accentColor,
    fontPairing: f.style.fontPairing,
    photoShape: f.style.photoShape,
    layoutDensity: f.style.layoutDensity,
    cardSize: f.format.cardSize,
    orientation: f.format.orientation,
    printLayout: f.format.printLayout,
    showHolographicZone: f.security.showHolographicZone,
    showWatermark: f.security.showWatermark,
    showMicrotextBorder: f.security.showMicrotextBorder,
    sequentialNumbering: f.security.sequentialNumbering,
    lanyardEnabled: f.lanyard.showLanyard,
  };
}

function validateBadge(): { issues: string[]; ready: boolean } {
  const f = useIDBadgeEditor.getState().form;
  const issues: string[] = [];
  if (!f.firstName && !f.lastName) issues.push("Name is required");
  if (!f.organizationName) issues.push("Organization name is required");
  if (!f.title) issues.push("Job title is recommended");
  if (!f.employeeId) issues.push("Employee ID is recommended");
  return { issues, ready: issues.length === 0 };
}

// ── Manifest Factory ────────────────────────────────────────────────────────

export function createIDBadgeManifest(options: ManifestOptions): ChikoActionManifest {
  const { store, printRef } = options;

  const baseManifest: ChikoActionManifest = {
    toolId: "id-badge",
    toolName: "ID Badge & Lanyard Designer",
    actions: [
      // ─ Content ─
      {
        name: "setPersonInfo",
        description: "Set the badge holder's personal information",
        parameters: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            title: { type: "string" },
            department: { type: "string" },
            employeeId: { type: "string" },
            role: { type: "string", enum: ROLE_VARIANTS.map((r) => r.id) },
            email: { type: "string" },
            phone: { type: "string" },
            accessLevel: { type: "string" },
            photoUrl: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "setOrganization",
        description: "Set the organization details (name, subtitle, logo)",
        parameters: {
          type: "object",
          properties: {
            organizationName: { type: "string" },
            organizationSubtitle: { type: "string" },
            organizationLogo: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "setDates",
        description: "Set badge issue and expiry dates",
        parameters: {
          type: "object",
          properties: {
            issueDate: { type: "string", description: "YYYY-MM-DD" },
            expiryDate: { type: "string", description: "YYYY-MM-DD" },
          },
        },
        category: "Content",
      },
      {
        name: "setBadgeType",
        description: "Change the badge type",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: BADGE_TYPES.map((b) => b.id) },
          },
          required: ["type"],
        },
        category: "Content",
      },
      {
        name: "setCustomFields",
        description: "Set custom label/value pairs displayed on the badge",
        parameters: {
          type: "object",
          properties: {
            field1Label: { type: "string" },
            field1Value: { type: "string" },
            field2Label: { type: "string" },
            field2Value: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "setSignatory",
        description: "Set the authorized signatory name and title",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
          },
        },
        category: "Content",
      },
      // ─ Batch ─
      {
        name: "addBatchPerson",
        description: "Add a person to the batch list",
        parameters: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            title: { type: "string" },
            department: { type: "string" },
            employeeId: { type: "string" },
            role: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
          },
        },
        category: "Batch",
      },
      {
        name: "clearBatch",
        description: "Remove all people from the batch list",
        parameters: { type: "object", properties: {} },
        category: "Batch",
        destructive: true,
      },
      {
        name: "toggleBatchMode",
        description: "Enable or disable batch mode",
        parameters: {
          type: "object",
          properties: { enabled: { type: "boolean" } },
          required: ["enabled"],
        },
        category: "Batch",
      },
      // ─ Back Side ─
      {
        name: "configureBackSide",
        description: "Configure back side features (QR, barcode, mag stripe, NFC, terms)",
        parameters: {
          type: "object",
          properties: {
            enabled: { type: "boolean" },
            showQrCode: { type: "boolean" },
            qrContent: { type: "string", enum: ["employee-id", "vcard", "url", "custom"] },
            qrCustomValue: { type: "string" },
            showBarcode: { type: "boolean" },
            barcodeType: { type: "string" },
            showMagneticStripe: { type: "boolean" },
            showNfcZone: { type: "boolean" },
            showContactInfo: { type: "boolean" },
            showEmergencyContact: { type: "boolean" },
            emergencyPhone: { type: "string" },
            showReturnAddress: { type: "boolean" },
            returnAddress: { type: "string" },
            showTermsText: { type: "boolean" },
            termsText: { type: "string" },
          },
        },
        category: "Content",
      },
      // ─ Style ─
      {
        name: "setTemplate",
        description: "Change the badge template",
        parameters: {
          type: "object",
          properties: {
            template: { type: "string", enum: BADGE_TEMPLATES.map((t) => t.id) },
          },
          required: ["template"],
        },
        category: "Style",
      },
      {
        name: "setAccentColor",
        description: "Set the badge accent color",
        parameters: {
          type: "object",
          properties: {
            color: { type: "string", enum: BADGE_ACCENT_COLORS },
          },
          required: ["color"],
        },
        category: "Style",
      },
      {
        name: "setStyle",
        description: "Update style settings (font, photo shape, density, headers, role badge)",
        parameters: {
          type: "object",
          properties: {
            fontPairing: { type: "string" },
            fontScale: { type: "number" },
            photoShape: { type: "string", enum: ["circle", "rounded", "rounded-square", "square"] },
            layoutDensity: { type: "string", enum: ["compact", "standard", "spacious"] },
            showRoleBadge: { type: "boolean" },
            showDepartmentBadge: { type: "boolean" },
            headerStyle: { type: "string", enum: ["solid", "gradient", "pattern", "minimal"] },
          },
        },
        category: "Style",
      },
      // ─ Format ─
      {
        name: "setFormat",
        description: "Set card size, orientation, print layout, bleed, guides, DPI",
        parameters: {
          type: "object",
          properties: {
            cardSize: { type: "string", enum: CARD_SIZES.map((s) => s.id) },
            orientation: { type: "string", enum: ["landscape", "portrait"] },
            printLayout: { type: "string", enum: ["single", "2-up", "4-up", "8-up", "10-up"] },
            printPageSize: { type: "string", enum: ["a4", "letter"] },
            showBleedArea: { type: "boolean" },
            showSafeZone: { type: "boolean" },
            showCutMarks: { type: "boolean" },
            dpi: { type: "number" },
            colorProfile: { type: "string", enum: ["rgb", "cmyk-sim"] },
          },
        },
        category: "Format",
      },
      {
        name: "setSecurity",
        description: "Configure security features (holographic, watermark, microtext, numbering, UV)",
        parameters: {
          type: "object",
          properties: {
            showHolographicZone: { type: "boolean" },
            showWatermark: { type: "boolean" },
            watermarkText: { type: "string" },
            showMicrotextBorder: { type: "boolean" },
            microtextContent: { type: "string" },
            sequentialNumbering: { type: "boolean" },
            sequentialStart: { type: "number" },
          },
        },
        category: "Format",
      },
      // ─ Read ─
      {
        name: "getState",
        description: "Read the current badge state and all field values",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },
      {
        name: "validate",
        description: "Validate the badge — checks required fields",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },
      // ─ Document ─
      {
        name: "print",
        description: "Print the current badge design",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
      {
        name: "startOver",
        description: "Reset the badge to default state",
        parameters: { type: "object", properties: {} },
        category: "Document",
        destructive: true,
      },
    ],

    getState: readState,

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const s = store.getState();

      switch (actionName) {
        case "setPersonInfo": {
          s.updateContent(params as Partial<IDBadgeFormData>);
          return { success: true, message: "Updated person information." };
        }
        case "setOrganization": {
          s.updateOrganization(params as Partial<IDBadgeFormData>);
          return { success: true, message: "Updated organization details." };
        }
        case "setDates": {
          s.updateDates(params as Partial<IDBadgeFormData>);
          return { success: true, message: "Updated dates." };
        }
        case "setBadgeType": {
          s.setBadgeType(params.type as BadgeType);
          return { success: true, message: `Badge type set to "${params.type}".` };
        }
        case "setCustomFields": {
          s.updateCustomFields({
            customField1Label: params.field1Label as string,
            customField1Value: params.field1Value as string,
            customField2Label: params.field2Label as string,
            customField2Value: params.field2Value as string,
          });
          return { success: true, message: "Custom fields updated." };
        }
        case "setSignatory": {
          s.updateSignatory(params as { name?: string; title?: string });
          return { success: true, message: "Signatory updated." };
        }
        case "addBatchPerson": {
          const newId = s.addBatchPerson();
          if (Object.keys(params).length > 0) {
            s.updateBatchPerson(newId, params as Partial<import("@/stores/id-badge-editor").BatchPerson>);
          }
          s.setBatchMode(true);
          return { success: true, message: `Added person to batch (now ${store.getState().form.batchPeople.length} total).` };
        }
        case "clearBatch": {
          s.clearBatch();
          return { success: true, message: "Batch list cleared." };
        }
        case "toggleBatchMode": {
          s.setBatchMode(params.enabled as boolean);
          return { success: true, message: `Batch mode ${params.enabled ? "enabled" : "disabled"}.` };
        }
        case "configureBackSide": {
          s.updateBackSide(params as Record<string, unknown>);
          return { success: true, message: "Back side configuration updated." };
        }
        case "setTemplate": {
          s.setTemplate(params.template as BadgeTemplate);
          return { success: true, message: `Template set to "${params.template}".` };
        }
        case "setAccentColor": {
          s.setAccentColor(params.color as string);
          return { success: true, message: `Accent color updated.` };
        }
        case "setStyle": {
          s.updateStyle(params as Record<string, unknown>);
          return { success: true, message: "Style settings updated." };
        }
        case "setFormat": {
          s.updateFormat(params as Record<string, unknown>);
          return { success: true, message: "Format settings updated." };
        }
        case "setSecurity": {
          s.updateSecurity(params as Record<string, unknown>);
          return { success: true, message: "Security features updated." };
        }
        case "getState": {
          return { success: true, message: "Current state retrieved.", newState: readState() };
        }
        case "validate": {
          const v = validateBadge();
          return {
            success: true,
            message: v.ready
              ? "Badge is ready to print — all required fields are filled."
              : `Badge has ${v.issues.length} issue(s): ${v.issues.join("; ")}`,
          };
        }
        case "print": {
          printRef.current?.();
          return { success: true, message: "Print dialog opened." };
        }
        case "startOver": {
          s.resetForm();
          return { success: true, message: "Badge reset to defaults." };
        }
        default:
          return { success: false, message: `Unknown action: ${actionName}` };
      }
    },
  };

  const getForm = () => store.getState().form;
  const setForm = (f: unknown) => store.getState().setForm(f as IDBadgeFormData);

  return withActivityLogging(baseManifest, getForm, setForm);
}
