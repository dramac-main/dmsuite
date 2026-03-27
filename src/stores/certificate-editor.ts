// =============================================================================
// DMSuite — Certificate Designer Editor Store
// Zustand + Immer + Zundo (temporal) for undo/redo of certificate config.
// Follows the exact architecture as contract-editor.ts.
// =============================================================================

"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import equal from "fast-deep-equal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CertificateType =
  | "achievement"
  | "completion"
  | "appreciation"
  | "participation"
  | "training"
  | "recognition"
  | "award"
  | "excellence"
  | "honorary"
  | "membership";

export const CERTIFICATE_TYPES: { id: CertificateType; label: string; defaultTitle: string }[] = [
  { id: "achievement", label: "Achievement", defaultTitle: "Certificate of Achievement" },
  { id: "completion", label: "Completion", defaultTitle: "Certificate of Completion" },
  { id: "appreciation", label: "Appreciation", defaultTitle: "Certificate of Appreciation" },
  { id: "participation", label: "Participation", defaultTitle: "Certificate of Participation" },
  { id: "training", label: "Training", defaultTitle: "Certificate of Training" },
  { id: "recognition", label: "Recognition", defaultTitle: "Certificate of Recognition" },
  { id: "award", label: "Award", defaultTitle: "Certificate of Award" },
  { id: "excellence", label: "Excellence", defaultTitle: "Certificate of Excellence" },
  { id: "honorary", label: "Honorary", defaultTitle: "Honorary Certificate" },
  { id: "membership", label: "Membership", defaultTitle: "Certificate of Membership" },
];

export type CertificateTemplate =
  | "classic-blue"
  | "burgundy-ornate"
  | "antique-parchment"
  | "golden-appreciation"
  | "silver-weave"
  | "vintage-warm"
  | "teal-regal"
  | "botanical-modern";

export interface CertificateTemplateConfig {
  id: CertificateTemplate;
  name: string;
  accent: string;
  borderStyle: string;
  bgColor: string;
  fontPairing: string;
}

export const CERTIFICATE_TEMPLATES: CertificateTemplateConfig[] = [
  { id: "classic-blue", name: "Classic Blue", accent: "#35517D", borderStyle: "classic-blue-frame", bgColor: "#f5f5f5", fontPairing: "playfair-lato" },
  { id: "burgundy-ornate", name: "Burgundy Ornate", accent: "#4C0C1E", borderStyle: "burgundy-flourish", bgColor: "#ffffff", fontPairing: "crimson-source" },
  { id: "antique-parchment", name: "Antique Parchment", accent: "#3F3F41", borderStyle: "antique-frame", bgColor: "#d8cdb8", fontPairing: "cormorant-montserrat" },
  { id: "golden-appreciation", name: "Golden Appreciation", accent: "#b8860b", borderStyle: "golden-frame", bgColor: "#faf6ef", fontPairing: "playfair-lato" },
  { id: "silver-weave", name: "Silver Weave", accent: "#4a4a4a", borderStyle: "silver-weave-border", bgColor: "#ffffff", fontPairing: "cormorant-montserrat" },
  { id: "vintage-warm", name: "Vintage Warm", accent: "#5D3A1A", borderStyle: "vintage-warm-frame", bgColor: "#f5ead0", fontPairing: "playfair-lato" },
  { id: "teal-regal", name: "Teal Regal", accent: "#1a7f8f", borderStyle: "teal-scrollwork", bgColor: "#e8f4f6", fontPairing: "poppins-inter" },
  { id: "botanical-modern", name: "Botanical Modern", accent: "#1B2650", borderStyle: "botanical-panel", bgColor: "#ffffff", fontPairing: "cormorant-montserrat" },
];

export type BorderStyle =
  | "classic-blue-frame"
  | "burgundy-flourish"
  | "antique-frame"
  | "golden-frame"
  | "silver-weave-border"
  | "vintage-warm-frame"
  | "teal-scrollwork"
  | "botanical-panel"
  | "none";

export type SealStyle = "gold" | "silver" | "embossed" | "stamp" | "none";

export type PageOrientation = "landscape" | "portrait";

export interface Signatory {
  id: string;
  name: string;
  title: string;
  organization: string;
}

export interface CertificateStyleConfig {
  template: CertificateTemplate;
  accentColor: string;
  borderStyle: BorderStyle;
  fontPairing: string;
  fontScale: number;
  headerStyle: "centered" | "left-aligned" | "accent-bar";
}

export interface CertificateFormatConfig {
  pageSize: "a4" | "letter" | "a5";
  orientation: PageOrientation;
  margins: "narrow" | "standard" | "wide";
}

export interface CertificateFormData {
  certificateType: CertificateType;

  // Content
  title: string;
  subtitle: string;
  recipientName: string;
  description: string;
  additionalText: string;

  // Organization
  organizationName: string;
  organizationSubtitle: string;

  // Event / Program
  eventName: string;
  courseName: string;

  // Date & Reference
  dateIssued: string;
  validUntil: string;
  referenceNumber: string;

  // Signatories
  signatories: Signatory[];

  // Seal
  showSeal: boolean;
  sealText: string;
  sealStyle: SealStyle;

  // Style
  style: CertificateStyleConfig;

  // Format
  format: CertificateFormatConfig;
}

// ---------------------------------------------------------------------------
// Font Pairings
// ---------------------------------------------------------------------------

export const CERTIFICATE_FONT_PAIRINGS: Record<string, { heading: string; body: string; google: string }> = {
  "playfair-lato": {
    heading: "Playfair Display",
    body: "Lato",
    google: "Playfair+Display:wght@400;600;700;900&family=Lato:wght@300;400;700",
  },
  "inter-jetbrains": {
    heading: "Inter",
    body: "Inter",
    google: "Inter:wght@300;400;500;600;700;800",
  },
  "merriweather-opensans": {
    heading: "Merriweather",
    body: "Open Sans",
    google: "Merriweather:wght@400;700;900&family=Open+Sans:wght@300;400;600;700",
  },
  "cormorant-montserrat": {
    heading: "Cormorant Garamond",
    body: "Montserrat",
    google: "Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600",
  },
  "crimson-source": {
    heading: "Crimson Text",
    body: "Source Sans 3",
    google: "Crimson+Text:wght@400;600;700&family=Source+Sans+3:wght@300;400;600;700",
  },
  "poppins-inter": {
    heading: "Poppins",
    body: "Inter",
    google: "Poppins:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600",
  },
  "oswald-roboto": {
    heading: "Oswald",
    body: "Roboto",
    google: "Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700",
  },
  "dm-serif-dm-sans": {
    heading: "DM Serif Display",
    body: "DM Sans",
    google: "DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700",
  },
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createDefaultCertificateForm(type?: CertificateType): CertificateFormData {
  const certType = type ?? "achievement";
  const typeConfig = CERTIFICATE_TYPES.find((t) => t.id === certType) ?? CERTIFICATE_TYPES[0];

  return {
    certificateType: certType,
    title: typeConfig.defaultTitle,
    subtitle: "This certificate is proudly presented to",
    recipientName: "",
    description: "In recognition of outstanding performance and dedication",
    additionalText: "",

    organizationName: "",
    organizationSubtitle: "",

    eventName: "",
    courseName: "",

    dateIssued: new Date().toISOString().split("T")[0],
    validUntil: "",
    referenceNumber: "",

    signatories: [
      { id: uid(), name: "", title: "Director", organization: "" },
    ],

    showSeal: true,
    sealText: "OFFICIAL",
    sealStyle: "gold",

    style: {
      template: "classic-blue",
      accentColor: "#35517D",
      borderStyle: "classic-blue-frame",
      fontPairing: "playfair-lato",
      fontScale: 1,
      headerStyle: "centered",
    },

    format: {
      pageSize: "a4",
      orientation: "landscape",
      margins: "standard",
    },
  };
}

export function getCertificateTemplate(id: string): CertificateTemplateConfig {
  return CERTIFICATE_TEMPLATES.find((t) => t.id === id) ?? CERTIFICATE_TEMPLATES[0];
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

export interface CertificateEditorState {
  form: CertificateFormData;
  accentColorLocked: boolean;

  // Top-level
  setForm: (form: CertificateFormData) => void;
  resetForm: (certType?: CertificateType) => void;
  setCertificateType: (type: CertificateType) => void;

  // Accent color lock
  setAccentColorLocked: (locked: boolean) => void;

  // Content
  updateContent: (patch: Partial<Pick<CertificateFormData, "title" | "subtitle" | "recipientName" | "description" | "additionalText">>) => void;

  // Organization
  updateOrganization: (patch: Partial<Pick<CertificateFormData, "organizationName" | "organizationSubtitle">>) => void;

  // Event / Program
  updateEvent: (patch: Partial<Pick<CertificateFormData, "eventName" | "courseName">>) => void;

  // Dates & Reference
  updateDates: (patch: Partial<Pick<CertificateFormData, "dateIssued" | "validUntil" | "referenceNumber">>) => void;

  // Signatories
  addSignatory: () => string;
  removeSignatory: (id: string) => void;
  updateSignatory: (id: string, patch: Partial<Signatory>) => void;

  // Seal
  updateSeal: (patch: Partial<Pick<CertificateFormData, "showSeal" | "sealText" | "sealStyle">>) => void;

  // Style
  updateStyle: (patch: Partial<CertificateStyleConfig>) => void;
  setTemplate: (template: CertificateTemplate) => void;
  setAccentColor: (color: string) => void;

  // Format
  updateFormat: (patch: Partial<CertificateFormatConfig>) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCertificateEditor = create<CertificateEditorState>()(
  temporal(
    persist(
      immer<CertificateEditorState>((set) => ({
        form: createDefaultCertificateForm(),
        accentColorLocked: false,

        setAccentColorLocked: (locked) =>
          set((s) => {
            s.accentColorLocked = locked;
          }),

        setCertificateType: (type) =>
          set((s) => {
            const typeConfig = CERTIFICATE_TYPES.find((t) => t.id === type);
            s.form.certificateType = type;
            if (typeConfig) {
              s.form.title = typeConfig.defaultTitle;
            }
          }),

        setForm: (form) =>
          set((s) => {
            s.form = form;
          }),

        resetForm: (certType) =>
          set((s) => {
            s.form = createDefaultCertificateForm(certType ?? s.form.certificateType);
            s.accentColorLocked = false;
          }),

        updateContent: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        updateOrganization: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        updateEvent: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        updateDates: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        addSignatory: () => {
          const newId = uid();
          set((s) => {
            s.form.signatories.push({
              id: newId,
              name: "",
              title: "",
              organization: "",
            });
          });
          return newId;
        },

        removeSignatory: (id) =>
          set((s) => {
            s.form.signatories = s.form.signatories.filter((sig) => sig.id !== id);
          }),

        updateSignatory: (id, patch) =>
          set((s) => {
            const sig = s.form.signatories.find((sig) => sig.id === id);
            if (sig) Object.assign(sig, patch);
          }),

        updateSeal: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        updateStyle: (patch) =>
          set((s) => {
            if (patch.accentColor) s.accentColorLocked = true;
            if (patch.template && !s.accentColorLocked) {
              const tpl = getCertificateTemplate(patch.template);
              patch.accentColor = tpl.accent;
              patch.borderStyle = tpl.borderStyle as BorderStyle;
            }
            Object.assign(s.form.style, patch);
          }),

        setTemplate: (template) =>
          set((s) => {
            s.form.style.template = template;
            if (!s.accentColorLocked) {
              const tpl = getCertificateTemplate(template);
              s.form.style.accentColor = tpl.accent;
              s.form.style.borderStyle = tpl.borderStyle as BorderStyle;
              s.form.style.fontPairing = tpl.fontPairing;
            }
          }),

        setAccentColor: (color) =>
          set((s) => {
            s.form.style.accentColor = color;
            s.accentColorLocked = true;
          }),

        updateFormat: (patch) =>
          set((s) => {
            Object.assign(s.form.format, patch);
          }),
      })),
      {
        name: "dmsuite-certificate",
        version: 1,
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ form: s.form, accentColorLocked: s.accentColorLocked }),
      },
    ),
    {
      partialize: (state) => ({ form: state.form }),
      equality: (a, b) => equal(a, b),
      limit: 50,
    },
  ),
);

// ---------------------------------------------------------------------------
// Undo hook
// ---------------------------------------------------------------------------

export function useCertificateUndo() {
  const { undo, redo, pastStates, futureStates } =
    useCertificateEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
