/**
 * DMSuite — Document Signer & Form Filler — Zustand Store
 * =========================================================
 * DocuSeal-inspired document filling & signing platform.
 * Supports 14 field types, multiple signers, signature capture,
 * automated workflows, and PDF export.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";

// ── Field Types (DocuSeal-inspired, 14 types) ──────────────────────────────
export type SignerFieldType =
  | "signature"
  | "initials"
  | "date"
  | "text"
  | "number"
  | "email"
  | "phone"
  | "checkbox"
  | "radio"
  | "select"
  | "textarea"
  | "file"
  | "stamp"
  | "image";

export interface FieldOption {
  label: string;
  value: string;
}

export interface DocumentField {
  id: string;
  type: SignerFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  assignedTo: string; // signerRole id
  page: number;
  x: number; // % of page width (0-100)
  y: number; // % of page height (0-100)
  width: number; // % of page width
  height: number; // % of page height
  value: string;
  options?: FieldOption[]; // for select/radio
  validation?: string; // regex pattern
  fontSize?: number;
  fontColor?: string;
  description?: string;
}

// ── Signer Roles ────────────────────────────────────────────────────────────
export interface SignerRole {
  id: string;
  name: string;
  email: string;
  phone?: string;
  color: string; // hex color for field highlighting
  order: number;
  status: "pending" | "viewed" | "signed" | "declined";
  signedAt?: string;
  signatureData?: string; // base64 data URI
  initialsData?: string; // base64 data URI
}

// ── Document Template ───────────────────────────────────────────────────────
export type DocumentTemplateType =
  | "blank"
  | "nda"
  | "employment-contract"
  | "rental-agreement"
  | "service-agreement"
  | "sales-contract"
  | "freelancer-agreement"
  | "partnership-agreement"
  | "custom-upload";

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentTemplateType;
  description: string;
  pages: number;
  thumbnailColor: string;
}

// ── Signature Modes ─────────────────────────────────────────────────────────
export type SignatureMode = "draw" | "type" | "upload";

export interface SignatureConfig {
  mode: SignatureMode;
  drawData: string; // base64 canvas data
  typeText: string;
  typeFont: string;
  uploadData: string; // base64 image
  color: string;
  penWidth: number;
}

// ── Email/Notification Settings ─────────────────────────────────────────────
export interface EmailSettings {
  subject: string;
  message: string;
  sendReminders: boolean;
  reminderDays: number;
  ccEmails: string[];
  replyTo: string;
  completionMessage: string;
}

// ── Style Settings ──────────────────────────────────────────────────────────
export interface DocumentStyle {
  accentColor: string;
  fontFamily: string;
  fontSize: number;
  fieldBorderStyle: "solid" | "dashed" | "dotted" | "none";
  fieldBackgroundOpacity: number;
  showFieldLabels: boolean;
  showRequiredIndicator: boolean;
  companyLogo?: string;
  companyName: string;
  brandColor: string;
}

// ── Audit Trail ─────────────────────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  ipAddress?: string;
}

// ── Main Document State ─────────────────────────────────────────────────────
export interface DocumentSignerForm {
  // Document info
  documentName: string;
  documentType: DocumentTemplateType;
  description: string;
  createdAt: string;
  updatedAt: string;

  // Pages (for generated documents)
  pages: DocumentPage[];

  // Signers
  signers: SignerRole[];

  // Fields
  fields: DocumentField[];

  // Signature config (for active signer / preview)
  signatureConfig: SignatureConfig;

  // Email settings
  emailSettings: EmailSettings;

  // Style
  style: DocumentStyle;

  // Status
  status: "draft" | "sent" | "in-progress" | "completed" | "cancelled";

  // Audit trail
  auditTrail: AuditEntry[];

  // Active signer (who is currently filling)
  activeSignerId: string | null;

  // Active page
  activePage: number;

  // Selected field
  selectedFieldId: string | null;

  // Uploaded PDF data (base64)
  uploadedPdfData: string | null;
  uploadedPdfName: string | null;
}

export interface DocumentPage {
  id: string;
  number: number;
  content: string; // HTML content for generated docs, or empty for uploaded PDFs
  width: number;
  height: number;
}

// ── Signer Colors (for field assignment highlighting) ───────────────────────
const SIGNER_COLORS = [
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#ef4444", // red
  "#22c55e", // green
  "#ec4899", // pink
  "#f97316", // orange
  "#6366f1", // indigo
];

// ── Templates ───────────────────────────────────────────────────────────────
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "blank",
    name: "Blank Document",
    type: "blank",
    description: "Start with a blank document and add your own fields",
    pages: 1,
    thumbnailColor: "#6b7280",
  },
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    type: "nda",
    description:
      "Mutual NDA to protect confidential information between parties",
    pages: 2,
    thumbnailColor: "#8b5cf6",
  },
  {
    id: "employment-contract",
    name: "Employment Contract",
    type: "employment-contract",
    description:
      "Standard employment agreement with terms, compensation, and responsibilities",
    pages: 3,
    thumbnailColor: "#06b6d4",
  },
  {
    id: "rental-agreement",
    name: "Rental/Lease Agreement",
    type: "rental-agreement",
    description:
      "Property rental agreement with term, rent, deposit, and conditions",
    pages: 3,
    thumbnailColor: "#22c55e",
  },
  {
    id: "service-agreement",
    name: "Service Agreement",
    type: "service-agreement",
    description:
      "Professional service agreement with scope, deliverables, and payment terms",
    pages: 2,
    thumbnailColor: "#f59e0b",
  },
  {
    id: "sales-contract",
    name: "Sales Contract",
    type: "sales-contract",
    description:
      "Contract for the sale of goods or services with terms and conditions",
    pages: 2,
    thumbnailColor: "#ef4444",
  },
  {
    id: "freelancer-agreement",
    name: "Freelancer Agreement",
    type: "freelancer-agreement",
    description:
      "Independent contractor agreement with project scope and payment terms",
    pages: 2,
    thumbnailColor: "#ec4899",
  },
  {
    id: "partnership-agreement",
    name: "Partnership Agreement",
    type: "partnership-agreement",
    description:
      "Business partnership agreement with roles, profit sharing, and governance",
    pages: 3,
    thumbnailColor: "#6366f1",
  },
  {
    id: "custom-upload",
    name: "Upload Your Document",
    type: "custom-upload",
    description: "Upload a PDF document and add signing fields to it",
    pages: 0,
    thumbnailColor: "#a855f7",
  },
];

// ── Default State ───────────────────────────────────────────────────────────
function createDefaultForm(): DocumentSignerForm {
  return {
    documentName: "Untitled Document",
    documentType: "blank",
    description: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [
      {
        id: "page-1",
        number: 1,
        content: "",
        width: 595, // A4 width in points
        height: 842, // A4 height in points
      },
    ],
    signers: [
      {
        id: "signer-1",
        name: "First Party",
        email: "",
        color: SIGNER_COLORS[0],
        order: 1,
        status: "pending",
      },
    ],
    fields: [],
    signatureConfig: {
      mode: "draw",
      drawData: "",
      typeText: "",
      typeFont: "Dancing Script",
      uploadData: "",
      color: "#1a1a2e",
      penWidth: 2.5,
    },
    emailSettings: {
      subject: "Please sign: {{documentName}}",
      message:
        "You have been requested to sign the following document. Please review and sign at your earliest convenience.",
      sendReminders: true,
      reminderDays: 3,
      ccEmails: [],
      replyTo: "",
      completionMessage:
        "All parties have signed the document. A copy has been sent to all participants.",
    },
    style: {
      accentColor: "#8b5cf6",
      fontFamily: "Inter",
      fontSize: 14,
      fieldBorderStyle: "dashed",
      fieldBackgroundOpacity: 0.1,
      showFieldLabels: true,
      showRequiredIndicator: true,
      companyName: "",
      brandColor: "#8b5cf6",
    },
    status: "draft",
    auditTrail: [],
    activeSignerId: null,
    activePage: 1,
    selectedFieldId: null,
    uploadedPdfData: null,
    uploadedPdfName: null,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
let _fieldCounter = 0;
function generateFieldId(): string {
  _fieldCounter++;
  return `field-${Date.now()}-${_fieldCounter}`;
}

function generateAuditId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Store Interface ─────────────────────────────────────────────────────────
interface DocumentSignerState {
  form: DocumentSignerForm;

  // Full form
  setForm: (form: DocumentSignerForm) => void;
  resetForm: () => void;

  // Document
  setDocumentName: (name: string) => void;
  setDocumentType: (type: DocumentTemplateType) => void;
  setDescription: (desc: string) => void;
  setStatus: (status: DocumentSignerForm["status"]) => void;

  // Pages
  addPage: () => void;
  removePage: (pageNumber: number) => void;
  setActivePage: (page: number) => void;

  // Signers
  addSigner: (name: string, email: string) => void;
  updateSigner: (id: string, patch: Partial<SignerRole>) => void;
  removeSigner: (id: string) => void;
  setActiveSignerId: (id: string | null) => void;
  reorderSigners: (orderedIds: string[]) => void;

  // Fields
  addField: (
    type: SignerFieldType,
    page: number,
    x: number,
    y: number
  ) => string;
  updateField: (id: string, patch: Partial<DocumentField>) => void;
  removeField: (id: string) => void;
  setSelectedFieldId: (id: string | null) => void;
  setFieldValue: (id: string, value: string) => void;
  duplicateField: (id: string) => void;

  // Signature
  updateSignatureConfig: (patch: Partial<SignatureConfig>) => void;
  applySignature: (signerId: string, fieldId: string) => void;
  clearSignature: (fieldId: string) => void;

  // Email settings
  updateEmailSettings: (patch: Partial<EmailSettings>) => void;

  // Style
  updateStyle: (patch: Partial<DocumentStyle>) => void;

  // Audit
  addAuditEntry: (action: string, actor: string, details: string) => void;

  // PDF upload
  setUploadedPdf: (data: string, name: string) => void;
  clearUploadedPdf: () => void;

  // Bulk field operations
  clearAllFields: () => void;
  assignAllFieldsToSigner: (signerId: string) => void;

  // Template
  applyTemplate: (templateId: string) => void;
}

// ── Store ───────────────────────────────────────────────────────────────────
export const useDocumentSignerEditor = create<DocumentSignerState>()(
  temporal(
    persist(
      immer((set) => ({
        form: createDefaultForm(),

        setForm: (form) =>
          set((s) => {
            s.form = form;
          }),

        resetForm: () =>
          set((s) => {
            s.form = createDefaultForm();
          }),

        // ── Document ──
        setDocumentName: (name) =>
          set((s) => {
            s.form.documentName = name;
            s.form.updatedAt = new Date().toISOString();
          }),

        setDocumentType: (type) =>
          set((s) => {
            s.form.documentType = type;
            s.form.updatedAt = new Date().toISOString();
          }),

        setDescription: (desc) =>
          set((s) => {
            s.form.description = desc;
            s.form.updatedAt = new Date().toISOString();
          }),

        setStatus: (status) =>
          set((s) => {
            s.form.status = status;
            s.form.updatedAt = new Date().toISOString();
          }),

        // ── Pages ──
        addPage: () =>
          set((s) => {
            const num = s.form.pages.length + 1;
            s.form.pages.push({
              id: `page-${num}`,
              number: num,
              content: "",
              width: 595,
              height: 842,
            });
          }),

        removePage: (pageNumber) =>
          set((s) => {
            if (s.form.pages.length <= 1) return;
            s.form.pages = s.form.pages.filter(
              (p) => p.number !== pageNumber
            );
            // Renumber pages
            s.form.pages.forEach((p, i) => {
              p.number = i + 1;
              p.id = `page-${i + 1}`;
            });
            // Remove fields on deleted page
            s.form.fields = s.form.fields.filter(
              (f) => f.page !== pageNumber
            );
            // Adjust field page numbers
            s.form.fields.forEach((f) => {
              if (f.page > pageNumber) f.page--;
            });
            if (s.form.activePage > s.form.pages.length) {
              s.form.activePage = s.form.pages.length;
            }
          }),

        setActivePage: (page) =>
          set((s) => {
            s.form.activePage = page;
          }),

        // ── Signers ──
        addSigner: (name, email) =>
          set((s) => {
            const order = s.form.signers.length + 1;
            const colorIdx =
              (s.form.signers.length) % SIGNER_COLORS.length;
            s.form.signers.push({
              id: `signer-${Date.now()}`,
              name: name || `Signer ${order}`,
              email: email || "",
              color: SIGNER_COLORS[colorIdx],
              order,
              status: "pending",
            });
          }),

        updateSigner: (id, patch) =>
          set((s) => {
            const signer = s.form.signers.find((sg) => sg.id === id);
            if (signer) Object.assign(signer, patch);
          }),

        removeSigner: (id) =>
          set((s) => {
            if (s.form.signers.length <= 1) return;
            s.form.signers = s.form.signers.filter((sg) => sg.id !== id);
            // Reassign orphaned fields to first signer
            const firstId = s.form.signers[0]?.id;
            if (firstId) {
              s.form.fields.forEach((f) => {
                if (f.assignedTo === id) f.assignedTo = firstId;
              });
            }
          }),

        setActiveSignerId: (id) =>
          set((s) => {
            s.form.activeSignerId = id;
          }),

        reorderSigners: (orderedIds) =>
          set((s) => {
            const map = new Map(
              s.form.signers.map((sg) => [sg.id, sg])
            );
            s.form.signers = orderedIds
              .map((id) => map.get(id))
              .filter(Boolean) as SignerRole[];
            s.form.signers.forEach((sg, i) => {
              sg.order = i + 1;
            });
          }),

        // ── Fields ──
        addField: (type, page, x, y) => {
          const fieldId = generateFieldId();
          set((s) => {
            const defaultWidth =
              type === "signature" || type === "stamp"
                ? 25
                : type === "initials"
                  ? 12
                  : type === "checkbox" || type === "radio"
                    ? 4
                    : type === "textarea"
                      ? 30
                      : type === "image" || type === "file"
                        ? 20
                        : 20;
            const defaultHeight =
              type === "signature" || type === "stamp"
                ? 8
                : type === "initials"
                  ? 5
                  : type === "checkbox" || type === "radio"
                    ? 4
                    : type === "textarea"
                      ? 12
                      : type === "image" || type === "file"
                        ? 12
                        : 4;

            const firstSigner = s.form.signers[0]?.id || "signer-1";
            s.form.fields.push({
              id: fieldId,
              type,
              label: getDefaultLabel(type),
              required: type === "signature" || type === "date",
              assignedTo:
                s.form.activeSignerId || firstSigner,
              page,
              x: Math.min(Math.max(x, 0), 100 - defaultWidth),
              y: Math.min(Math.max(y, 0), 100 - defaultHeight),
              width: defaultWidth,
              height: defaultHeight,
              value: "",
              fontSize: 14,
              fontColor: "#1a1a2e",
            });
          });
          return fieldId;
        },

        updateField: (id, patch) =>
          set((s) => {
            const field = s.form.fields.find((f) => f.id === id);
            if (field) Object.assign(field, patch);
          }),

        removeField: (id) =>
          set((s) => {
            s.form.fields = s.form.fields.filter((f) => f.id !== id);
            if (s.form.selectedFieldId === id) {
              s.form.selectedFieldId = null;
            }
          }),

        setSelectedFieldId: (id) =>
          set((s) => {
            s.form.selectedFieldId = id;
          }),

        setFieldValue: (id, value) =>
          set((s) => {
            const field = s.form.fields.find((f) => f.id === id);
            if (field) field.value = value;
          }),

        duplicateField: (id) =>
          set((s) => {
            const orig = s.form.fields.find((f) => f.id === id);
            if (!orig) return;
            const newField = {
              ...JSON.parse(JSON.stringify(orig)),
              id: generateFieldId(),
              x: Math.min(orig.x + 3, 75),
              y: Math.min(orig.y + 3, 90),
              value: "",
            };
            s.form.fields.push(newField);
          }),

        // ── Signature ──
        updateSignatureConfig: (patch) =>
          set((s) => {
            Object.assign(s.form.signatureConfig, patch);
          }),

        applySignature: (signerId, fieldId) =>
          set((s) => {
            const field = s.form.fields.find((f) => f.id === fieldId);
            const signer = s.form.signers.find((sg) => sg.id === signerId);
            if (!field || !signer) return;

            const config = s.form.signatureConfig;
            let sigData = "";
            if (config.mode === "draw") sigData = config.drawData;
            else if (config.mode === "type") sigData = config.typeText;
            else if (config.mode === "upload") sigData = config.uploadData;

            if (field.type === "signature") {
              field.value = sigData;
              signer.signatureData = sigData;
              signer.status = "signed";
              signer.signedAt = new Date().toISOString();
            } else if (field.type === "initials") {
              field.value = sigData;
              signer.initialsData = sigData;
            }
          }),

        clearSignature: (fieldId) =>
          set((s) => {
            const field = s.form.fields.find((f) => f.id === fieldId);
            if (field) {
              field.value = "";
            }
          }),

        // ── Email ──
        updateEmailSettings: (patch) =>
          set((s) => {
            Object.assign(s.form.emailSettings, patch);
          }),

        // ── Style ──
        updateStyle: (patch) =>
          set((s) => {
            Object.assign(s.form.style, patch);
          }),

        // ── Audit ──
        addAuditEntry: (action, actor, details) =>
          set((s) => {
            s.form.auditTrail.push({
              id: generateAuditId(),
              timestamp: new Date().toISOString(),
              action,
              actor,
              details,
            });
          }),

        // ── PDF Upload ──
        setUploadedPdf: (data, name) =>
          set((s) => {
            s.form.uploadedPdfData = data;
            s.form.uploadedPdfName = name;
            s.form.documentType = "custom-upload";
          }),

        clearUploadedPdf: () =>
          set((s) => {
            s.form.uploadedPdfData = null;
            s.form.uploadedPdfName = null;
          }),

        // ── Bulk Fields ──
        clearAllFields: () =>
          set((s) => {
            s.form.fields = [];
            s.form.selectedFieldId = null;
          }),

        assignAllFieldsToSigner: (signerId) =>
          set((s) => {
            s.form.fields.forEach((f) => {
              f.assignedTo = signerId;
            });
          }),

        // ── Template ──
        applyTemplate: (templateId) =>
          set((s) => {
            const tpl = DOCUMENT_TEMPLATES.find((t) => t.id === templateId);
            if (!tpl) return;
            // Reset fields
            s.form.fields = [];
            s.form.selectedFieldId = null;
            s.form.documentType = tpl.type;
            s.form.documentName = tpl.name;
            s.form.description = tpl.description;
            // Set pages
            const pageCount = Math.max(tpl.pages, 1);
            s.form.pages = Array.from({ length: pageCount }, (_, i) => ({
              id: `page-${i + 1}`,
              number: i + 1,
              content: "",
              width: 595,
              height: 842,
            }));
            s.form.activePage = 1;
            s.form.status = "draft";
            // Add default signature fields based on template
            if (tpl.type !== "blank" && tpl.type !== "custom-upload") {
              addTemplateFields(s.form, tpl.type);
            }
          }),
      })),
      {
        name: "dmsuite-document-signer",
        version: 1,
        partialize: (state) => ({ form: state.form }),
      }
    ),
    { limit: 50 }
  )
);

// ── Helper: generate default field label ────────────────────────────────────
function getDefaultLabel(type: SignerFieldType): string {
  const labels: Record<SignerFieldType, string> = {
    signature: "Signature",
    initials: "Initials",
    date: "Date",
    text: "Text Field",
    number: "Number",
    email: "Email Address",
    phone: "Phone Number",
    checkbox: "Checkbox",
    radio: "Option",
    select: "Dropdown",
    textarea: "Text Area",
    file: "File Attachment",
    stamp: "Company Stamp",
    image: "Image",
  };
  return labels[type] || "Field";
}

// ── Helper: add template-specific fields ────────────────────────────────────
function addTemplateFields(
  form: DocumentSignerForm,
  type: DocumentTemplateType
): void {
  const signer1 = form.signers[0]?.id || "signer-1";

  // Common fields for all document types
  const commonFields: Partial<DocumentField>[] = [
    {
      type: "date",
      label: "Date",
      page: 1,
      x: 60,
      y: 10,
      width: 20,
      height: 4,
      required: true,
    },
  ];

  // Type-specific signature placement
  const lastPage = form.pages.length;
  const signatureFields: Partial<DocumentField>[] = [
    {
      type: "signature",
      label: "First Party Signature",
      page: lastPage,
      x: 10,
      y: 80,
      width: 25,
      height: 8,
      required: true,
    },
    {
      type: "text",
      label: "Full Name (Print)",
      page: lastPage,
      x: 10,
      y: 89,
      width: 25,
      height: 4,
      required: true,
    },
    {
      type: "date",
      label: "Signed Date",
      page: lastPage,
      x: 10,
      y: 94,
      width: 15,
      height: 4,
      required: true,
    },
  ];

  // Type-specific additional fields
  let extraFields: Partial<DocumentField>[] = [];
  switch (type) {
    case "nda":
      extraFields = [
        {
          type: "text",
          label: "Disclosing Party Name",
          page: 1,
          x: 10,
          y: 18,
          width: 35,
          height: 4,
          required: true,
        },
        {
          type: "text",
          label: "Receiving Party Name",
          page: 1,
          x: 55,
          y: 18,
          width: 35,
          height: 4,
          required: true,
        },
        {
          type: "text",
          label: "Confidential Information Description",
          page: 1,
          x: 10,
          y: 35,
          width: 80,
          height: 4,
        },
        {
          type: "number",
          label: "Agreement Duration (Years)",
          page: 1,
          x: 10,
          y: 50,
          width: 15,
          height: 4,
        },
      ];
      break;
    case "employment-contract":
      extraFields = [
        {
          type: "text",
          label: "Employee Name",
          page: 1,
          x: 10,
          y: 18,
          width: 35,
          height: 4,
          required: true,
        },
        {
          type: "text",
          label: "Position/Title",
          page: 1,
          x: 55,
          y: 18,
          width: 35,
          height: 4,
          required: true,
        },
        {
          type: "date",
          label: "Start Date",
          page: 1,
          x: 10,
          y: 30,
          width: 20,
          height: 4,
          required: true,
        },
        {
          type: "text",
          label: "Salary/Compensation",
          page: 1,
          x: 40,
          y: 30,
          width: 25,
          height: 4,
          required: true,
        },
        {
          type: "text",
          label: "Department",
          page: 1,
          x: 10,
          y: 42,
          width: 25,
          height: 4,
        },
        {
          type: "checkbox",
          label: "Agree to Terms",
          page: 2,
          x: 10,
          y: 70,
          width: 4,
          height: 4,
          required: true,
        },
      ];
      break;
    case "rental-agreement":
      extraFields = [
        {
          type: "text",
          label: "Landlord Name",
          page: 1,
          x: 10,
          y: 18,
          width: 35,
          height: 4,
          required: true,
        },
        {
          type: "text",
          label: "Tenant Name",
          page: 1,
          x: 55,
          y: 18,
          width: 35,
          height: 4,
          required: true,
        },
        {
          type: "textarea",
          label: "Property Address",
          page: 1,
          x: 10,
          y: 30,
          width: 80,
          height: 8,
          required: true,
        },
        {
          type: "text",
          label: "Monthly Rent",
          page: 1,
          x: 10,
          y: 45,
          width: 20,
          height: 4,
          required: true,
        },
        {
          type: "date",
          label: "Lease Start Date",
          page: 1,
          x: 40,
          y: 45,
          width: 20,
          height: 4,
          required: true,
        },
        {
          type: "date",
          label: "Lease End Date",
          page: 1,
          x: 70,
          y: 45,
          width: 20,
          height: 4,
          required: true,
        },
      ];
      break;
    default:
      extraFields = [
        {
          type: "text",
          label: "Party 1 Name",
          page: 1,
          x: 10,
          y: 18,
          width: 35,
          height: 4,
          required: true,
        },
        {
          type: "text",
          label: "Party 2 Name",
          page: 1,
          x: 55,
          y: 18,
          width: 35,
          height: 4,
          required: true,
        },
      ];
  }

  // Combine and add all fields
  [...commonFields, ...extraFields, ...signatureFields].forEach((partial) => {
    _fieldCounter++;
    form.fields.push({
      id: `field-${Date.now()}-${_fieldCounter}`,
      type: partial.type || "text",
      label: partial.label || "Field",
      placeholder: partial.placeholder,
      required: partial.required || false,
      assignedTo: signer1,
      page: partial.page || 1,
      x: partial.x || 10,
      y: partial.y || 50,
      width: partial.width || 20,
      height: partial.height || 4,
      value: "",
      options: partial.options,
      fontSize: 14,
      fontColor: "#1a1a2e",
    });
  });
}

// ── Undo Hook ───────────────────────────────────────────────────────────────
export function useDocumentSignerUndo() {
  const { undo, redo, pastStates, futureStates } =
    useDocumentSignerEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
