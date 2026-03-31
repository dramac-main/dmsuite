// =============================================================================
// DMSuite — Document Signer & Form Filler — Chiko Action Manifest
// Gives Chiko AI full control over document creation, field management,
// signer workflows, signature capture, style, and export.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import {
  useDocumentSignerEditor,
  type DocumentSignerForm,
  type SignerFieldType,
  type SignatureMode,
} from "@/stores/document-signer-editor";
import { withActivityLogging } from "@/stores/activity-log";

// ── Options ──

export interface DocumentSignerManifestOptions {
  onPrintRef?: React.RefObject<(() => void) | null>;
}

// ── Read state ──

function readState(): Record<string, unknown> {
  const { form } = useDocumentSignerEditor.getState();
  return {
    documentName: form.documentName,
    documentType: form.documentType,
    description: form.description,
    status: form.status,
    pages: form.pages.length,
    signers: form.signers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      status: s.status,
      fieldCount: form.fields.filter((f) => f.assignedTo === s.id).length,
    })),
    fields: form.fields.map((f) => ({
      id: f.id,
      type: f.type,
      label: f.label,
      page: f.page,
      assignedTo: f.assignedTo,
      required: f.required,
      filled: !!f.value,
    })),
    style: { ...form.style },
    signatureConfig: {
      mode: form.signatureConfig.mode,
      hasDrawData: !!form.signatureConfig.drawData,
      typeText: form.signatureConfig.typeText,
      hasUploadData: !!form.signatureConfig.uploadData,
    },
    auditTrailCount: form.auditTrail.length,
    completionStats: {
      totalFields: form.fields.length,
      filledFields: form.fields.filter((f) => !!f.value).length,
      requiredFields: form.fields.filter((f) => f.required).length,
      requiredFilled: form.fields.filter((f) => f.required && !!f.value).length,
      signedSigners: form.signers.filter((s) => s.status === "signed").length,
      totalSigners: form.signers.length,
    },
  };
}

// ── Validation ──

interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
}

function validateDocument(): { issues: ValidationIssue[]; ready: boolean } {
  const { form } = useDocumentSignerEditor.getState();
  const issues: ValidationIssue[] = [];

  if (!form.documentName.trim() || form.documentName === "Untitled Document") {
    issues.push({ severity: "warning", field: "documentName", message: "Document name is not set" });
  }
  if (form.fields.length === 0) {
    issues.push({ severity: "warning", field: "fields", message: "No fields added to the document" });
  }
  const requiredUnfilled = form.fields.filter((f) => f.required && !f.value);
  if (requiredUnfilled.length > 0) {
    issues.push({
      severity: "warning",
      field: "fields",
      message: `${requiredUnfilled.length} required field(s) not filled`,
    });
  }
  const signatureFields = form.fields.filter((f) => f.type === "signature" && !f.value);
  if (signatureFields.length > 0) {
    issues.push({
      severity: "warning",
      field: "signatures",
      message: `${signatureFields.length} signature field(s) not signed`,
    });
  }
  form.signers.forEach((s) => {
    if (!s.email.trim()) {
      issues.push({ severity: "warning", field: `signer.${s.id}`, message: `Signer "${s.name}" has no email` });
    }
  });

  return { issues, ready: issues.filter((i) => i.severity === "error").length === 0 };
}

// ── Manifest Factory ──

export function createDocumentSignerManifest(
  options?: DocumentSignerManifestOptions
): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "document-signer",
    toolName: "Document Signer & Form Filler",
    actions: [
      // ── Info ──
      {
        name: "readCurrentState",
        description:
          "Read the full current state of the document signer including document info, signers, fields, style, and completion stats.",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },

      // ── Document ──
      {
        name: "setDocumentName",
        description: "Set the document name/title.",
        parameters: {
          type: "object",
          properties: { name: { type: "string" } },
          required: ["name"],
        },
        category: "Content",
      },
      {
        name: "setDescription",
        description: "Set the document description.",
        parameters: {
          type: "object",
          properties: { description: { type: "string" } },
          required: ["description"],
        },
        category: "Content",
      },
      {
        name: "applyTemplate",
        description:
          "Apply a document template: blank, nda, employment-contract, rental-agreement, service-agreement, sales-contract, freelancer-agreement, partnership-agreement, custom-upload.",
        parameters: {
          type: "object",
          properties: { templateId: { type: "string" } },
          required: ["templateId"],
        },
        category: "Content",
        destructive: true,
      },
      {
        name: "addPage",
        description: "Add a new blank page to the document.",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },
      {
        name: "removePage",
        description: "Remove a page by its page number.",
        parameters: {
          type: "object",
          properties: { pageNumber: { type: "number" } },
          required: ["pageNumber"],
        },
        category: "Content",
        destructive: true,
      },

      // ── Signers ──
      {
        name: "addSigner",
        description: "Add a new signer/recipient to the document.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
          },
          required: ["name"],
        },
        category: "Content",
      },
      {
        name: "updateSigner",
        description:
          "Update a signer's details: name, email, phone, color.",
        parameters: {
          type: "object",
          properties: {
            signerId: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            color: { type: "string" },
          },
          required: ["signerId"],
        },
        category: "Content",
      },
      {
        name: "removeSigner",
        description: "Remove a signer by ID. Their fields will be reassigned to the first signer.",
        parameters: {
          type: "object",
          properties: { signerId: { type: "string" } },
          required: ["signerId"],
        },
        category: "Content",
        destructive: true,
      },

      // ── Fields ──
      {
        name: "addField",
        description:
          "Add a signing field to a page. Types: signature, initials, date, text, number, email, phone, checkbox, radio, select, textarea, file, stamp, image. Position x/y are percentages (0-100).",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string" },
            page: { type: "number" },
            x: { type: "number" },
            y: { type: "number" },
            label: { type: "string" },
            required: { type: "boolean" },
            assignedTo: { type: "string" },
          },
          required: ["type", "page", "x", "y"],
        },
        category: "Content",
      },
      {
        name: "updateField",
        description:
          "Update a field's properties: label, placeholder, required, x, y, width, height, fontSize, fontColor, assignedTo.",
        parameters: {
          type: "object",
          properties: {
            fieldId: { type: "string" },
            label: { type: "string" },
            placeholder: { type: "string" },
            required: { type: "boolean" },
            x: { type: "number" },
            y: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
            fontSize: { type: "number" },
            fontColor: { type: "string" },
            assignedTo: { type: "string" },
          },
          required: ["fieldId"],
        },
        category: "Content",
      },
      {
        name: "setFieldValue",
        description: "Set the value of a field (fill in form data).",
        parameters: {
          type: "object",
          properties: {
            fieldId: { type: "string" },
            value: { type: "string" },
          },
          required: ["fieldId", "value"],
        },
        category: "Content",
      },
      {
        name: "removeField",
        description: "Remove a field by ID.",
        parameters: {
          type: "object",
          properties: { fieldId: { type: "string" } },
          required: ["fieldId"],
        },
        category: "Content",
        destructive: true,
      },
      {
        name: "duplicateField",
        description: "Duplicate a field by ID.",
        parameters: {
          type: "object",
          properties: { fieldId: { type: "string" } },
          required: ["fieldId"],
        },
        category: "Content",
      },
      {
        name: "clearAllFields",
        description: "Remove all fields from all pages.",
        parameters: { type: "object", properties: {} },
        category: "Content",
        destructive: true,
      },
      {
        name: "assignAllFieldsToSigner",
        description: "Assign all fields to a specific signer.",
        parameters: {
          type: "object",
          properties: { signerId: { type: "string" } },
          required: ["signerId"],
        },
        category: "Content",
      },

      // ── Signature ──
      {
        name: "setSignatureMode",
        description: "Set signature capture mode: draw, type, or upload.",
        parameters: {
          type: "object",
          properties: { mode: { type: "string" } },
          required: ["mode"],
        },
        category: "Content",
      },
      {
        name: "setTypedSignature",
        description: "Set a typed signature with text and optional font.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string" },
            font: { type: "string" },
          },
          required: ["text"],
        },
        category: "Content",
      },
      {
        name: "applySignature",
        description: "Apply the current signature to a signature field for a signer.",
        parameters: {
          type: "object",
          properties: {
            signerId: { type: "string" },
            fieldId: { type: "string" },
          },
          required: ["signerId", "fieldId"],
        },
        category: "Content",
      },

      // ── Style ──
      {
        name: "updateStyle",
        description:
          "Update document style: accentColor (hex), fontFamily, fontSize, fieldBorderStyle (solid/dashed/dotted/none), fieldBackgroundOpacity (0-1), showFieldLabels (bool), showRequiredIndicator (bool), companyName, brandColor (hex).",
        parameters: {
          type: "object",
          properties: {
            accentColor: { type: "string" },
            fontFamily: { type: "string" },
            fontSize: { type: "number" },
            fieldBorderStyle: { type: "string" },
            fieldBackgroundOpacity: { type: "number" },
            showFieldLabels: { type: "boolean" },
            showRequiredIndicator: { type: "boolean" },
            companyName: { type: "string" },
            brandColor: { type: "string" },
          },
        },
        category: "Style",
      },

      // ── Email ──
      {
        name: "updateEmailSettings",
        description:
          "Update email notification settings: subject, message, sendReminders (bool), reminderDays (number), replyTo, completionMessage.",
        parameters: {
          type: "object",
          properties: {
            subject: { type: "string" },
            message: { type: "string" },
            sendReminders: { type: "boolean" },
            reminderDays: { type: "number" },
            replyTo: { type: "string" },
            completionMessage: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── Status ──
      {
        name: "setStatus",
        description: "Set document status: draft, sent, in-progress, completed, cancelled.",
        parameters: {
          type: "object",
          properties: { status: { type: "string" } },
          required: ["status"],
        },
        category: "Content",
      },

      // ── Export ──
      {
        name: "exportPrint",
        description: "Export the signed document as a PDF (triggers browser print dialog).",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
      {
        name: "validateBeforeExport",
        description: "Validate the document for completeness before exporting.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      // ── Reset ──
      {
        name: "resetForm",
        description: "Reset the document to defaults.",
        parameters: { type: "object", properties: {} },
        category: "Content",
        destructive: true,
      },
    ],

    getState: readState,

    executeAction: (
      actionName: string,
      params: Record<string, unknown>
    ): ChikoActionResult => {
      try {
        const store = useDocumentSignerEditor.getState();

        switch (actionName) {
          case "readCurrentState":
            return {
              success: true,
              message: "Current state read successfully",
              newState: readState(),
            };

          // ── Document ──
          case "setDocumentName":
            store.setDocumentName(params.name as string);
            return { success: true, message: `Document name set to "${params.name}"` };

          case "setDescription":
            store.setDescription(params.description as string);
            return { success: true, message: "Description updated" };

          case "applyTemplate":
            store.applyTemplate(params.templateId as string);
            return { success: true, message: `Template "${params.templateId}" applied` };

          case "addPage":
            store.addPage();
            return { success: true, message: "Page added" };

          case "removePage":
            store.removePage(params.pageNumber as number);
            return { success: true, message: `Page ${params.pageNumber} removed` };

          // ── Signers ──
          case "addSigner":
            store.addSigner(
              params.name as string,
              (params.email as string) || ""
            );
            return { success: true, message: `Signer "${params.name}" added` };

          case "updateSigner": {
            const patch: Record<string, unknown> = {};
            for (const key of ["name", "email", "phone", "color"]) {
              if (params[key] !== undefined) patch[key] = params[key];
            }
            store.updateSigner(params.signerId as string, patch);
            return { success: true, message: "Signer updated" };
          }

          case "removeSigner":
            store.removeSigner(params.signerId as string);
            return { success: true, message: "Signer removed" };

          // ── Fields ──
          case "addField": {
            const fieldId = store.addField(
              params.type as SignerFieldType,
              params.page as number,
              params.x as number,
              params.y as number
            );
            // Apply optional properties
            if (params.label || params.required !== undefined || params.assignedTo) {
              const patch: Record<string, unknown> = {};
              if (params.label) patch.label = params.label;
              if (params.required !== undefined) patch.required = params.required;
              if (params.assignedTo) patch.assignedTo = params.assignedTo;
              store.updateField(fieldId, patch);
            }
            return { success: true, message: `${params.type} field added (id: ${fieldId})` };
          }

          case "updateField": {
            const patch: Record<string, unknown> = {};
            for (const key of [
              "label", "placeholder", "required", "x", "y",
              "width", "height", "fontSize", "fontColor", "assignedTo",
            ]) {
              if (params[key] !== undefined) patch[key] = params[key];
            }
            store.updateField(params.fieldId as string, patch);
            return { success: true, message: "Field updated" };
          }

          case "setFieldValue":
            store.setFieldValue(params.fieldId as string, params.value as string);
            return { success: true, message: "Field value set" };

          case "removeField":
            store.removeField(params.fieldId as string);
            return { success: true, message: "Field removed" };

          case "duplicateField":
            store.duplicateField(params.fieldId as string);
            return { success: true, message: "Field duplicated" };

          case "clearAllFields":
            store.clearAllFields();
            return { success: true, message: "All fields cleared" };

          case "assignAllFieldsToSigner":
            store.assignAllFieldsToSigner(params.signerId as string);
            return { success: true, message: "All fields reassigned" };

          // ── Signature ──
          case "setSignatureMode":
            store.updateSignatureConfig({ mode: params.mode as SignatureMode });
            return { success: true, message: `Signature mode set to ${params.mode}` };

          case "setTypedSignature":
            store.updateSignatureConfig({
              mode: "type",
              typeText: params.text as string,
              ...(params.font ? { typeFont: params.font as string } : {}),
            });
            return { success: true, message: "Typed signature set" };

          case "applySignature":
            store.applySignature(
              params.signerId as string,
              params.fieldId as string
            );
            return { success: true, message: "Signature applied" };

          // ── Style ──
          case "updateStyle": {
            const stylePatch: Record<string, unknown> = {};
            for (const key of [
              "accentColor", "fontFamily", "fontSize", "fieldBorderStyle",
              "fieldBackgroundOpacity", "showFieldLabels", "showRequiredIndicator",
              "companyName", "brandColor",
            ]) {
              if (params[key] !== undefined) stylePatch[key] = params[key];
            }
            if (Object.keys(stylePatch).length > 0) {
              store.updateStyle(stylePatch);
            }
            return { success: true, message: "Style updated" };
          }

          // ── Email ──
          case "updateEmailSettings": {
            const emailPatch: Record<string, unknown> = {};
            for (const key of [
              "subject", "message", "sendReminders", "reminderDays",
              "replyTo", "completionMessage",
            ]) {
              if (params[key] !== undefined) emailPatch[key] = params[key];
            }
            store.updateEmailSettings(emailPatch);
            return { success: true, message: "Email settings updated" };
          }

          // ── Status ──
          case "setStatus":
            store.setStatus(params.status as DocumentSignerForm["status"]);
            return { success: true, message: `Status set to ${params.status}` };

          // ── Export ──
          case "exportPrint":
            options?.onPrintRef?.current?.();
            return { success: true, message: "Export triggered" };

          case "validateBeforeExport": {
            const result = validateDocument();
            return {
              success: true,
              message: result.ready
                ? `Document is ready to export (${result.issues.length} minor warnings)`
                : `Document has ${result.issues.length} issue(s)`,
              newState: result as unknown as Record<string, unknown>,
            };
          }

          // ── Reset ──
          case "resetForm":
            store.resetForm();
            return { success: true, message: "Document reset to defaults" };

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return {
          success: false,
          message: `Error: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useDocumentSignerEditor.getState().form,
    (snapshot) =>
      useDocumentSignerEditor
        .getState()
        .setForm(snapshot as DocumentSignerForm),
  );
}
