// =============================================================================
// DMSuite — Diploma & Accreditation Designer Editor Store
// Zustand + Immer + Zundo (temporal) for undo/redo of diploma config.
// Follows the exact architecture as certificate-editor.ts.
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

export type DiplomaType =
  | "bachelors"
  | "masters"
  | "doctorate"
  | "professional-diploma"
  | "honorary-doctorate"
  | "vocational"
  | "postgraduate"
  | "accreditation";

export const DIPLOMA_TYPES: { id: DiplomaType; label: string; defaultTitle: string }[] = [
  { id: "bachelors", label: "Bachelor's Degree", defaultTitle: "Bachelor of Arts" },
  { id: "masters", label: "Master's Degree", defaultTitle: "Master of Science" },
  { id: "doctorate", label: "Doctorate", defaultTitle: "Doctor of Philosophy" },
  { id: "professional-diploma", label: "Professional Diploma", defaultTitle: "Professional Diploma" },
  { id: "honorary-doctorate", label: "Honorary Doctorate", defaultTitle: "Doctor of Letters (Honorary)" },
  { id: "vocational", label: "Vocational / TVET", defaultTitle: "Vocational Certificate" },
  { id: "postgraduate", label: "Postgraduate Diploma", defaultTitle: "Postgraduate Diploma" },
  { id: "accreditation", label: "Accreditation", defaultTitle: "Certificate of Accreditation" },
];

export type DiplomaTemplate =
  | "university-classic"
  | "institutional-formal"
  | "modern-professional"
  | "ivy-league"
  | "executive"
  | "technical-vocational"
  | "medical-health"
  | "legal-bar"
  | "vintage-academic"
  | "international";

export interface DiplomaTemplateConfig {
  id: DiplomaTemplate;
  name: string;
  accent: string;
  borderStyle: string;
  bgColor: string;
  fontPairing: string;
}

export const DIPLOMA_TEMPLATES: DiplomaTemplateConfig[] = [
  { id: "university-classic", name: "University Classic", accent: "#1e3a5f", borderStyle: "double-frame", bgColor: "#faf6ef", fontPairing: "playfair-lato" },
  { id: "institutional-formal", name: "Institutional Formal", accent: "#166534", borderStyle: "official-border", bgColor: "#ffffff", fontPairing: "crimson-source" },
  { id: "modern-professional", name: "Modern Professional", accent: "#1e40af", borderStyle: "clean-line", bgColor: "#ffffff", fontPairing: "inter-jetbrains" },
  { id: "ivy-league", name: "Ivy League", accent: "#7c2d12", borderStyle: "ornate-classic", bgColor: "#fef9ef", fontPairing: "cormorant-montserrat" },
  { id: "executive", name: "Executive", accent: "#18181b", borderStyle: "thin-elegant", bgColor: "#fdfcf8", fontPairing: "dm-serif-dm-sans" },
  { id: "technical-vocational", name: "Technical / TVET", accent: "#0891b2", borderStyle: "modern-bracket", bgColor: "#f8fafc", fontPairing: "poppins-inter" },
  { id: "medical-health", name: "Medical / Health", accent: "#047857", borderStyle: "clean-line", bgColor: "#f0fdf4", fontPairing: "merriweather-opensans" },
  { id: "legal-bar", name: "Legal / Bar", accent: "#4c1d95", borderStyle: "vintage-frame", bgColor: "#faf5ff", fontPairing: "crimson-source" },
  { id: "vintage-academic", name: "Vintage Academic", accent: "#92400e", borderStyle: "ornate-classic", bgColor: "#faf3e3", fontPairing: "playfair-lato" },
  { id: "international", name: "International", accent: "#1d4ed8", borderStyle: "accent-corner", bgColor: "#ffffff", fontPairing: "inter-jetbrains" },
];

export type DiplomaBorderStyle =
  | "ornate-classic"
  | "clean-line"
  | "double-frame"
  | "thin-elegant"
  | "official-border"
  | "accent-corner"
  | "modern-bracket"
  | "vintage-frame"
  | "none";

export type SealStyle = "gold" | "silver" | "embossed" | "stamp" | "none";

export type PageOrientation = "landscape" | "portrait";

export type HonorsLevel = "" | "cum-laude" | "magna-cum-laude" | "summa-cum-laude" | "distinction" | "high-distinction" | "first-class" | "merit";

export const HONORS_LEVELS: { id: HonorsLevel; label: string }[] = [
  { id: "", label: "No Honors" },
  { id: "cum-laude", label: "Cum Laude" },
  { id: "magna-cum-laude", label: "Magna Cum Laude" },
  { id: "summa-cum-laude", label: "Summa Cum Laude" },
  { id: "distinction", label: "With Distinction" },
  { id: "high-distinction", label: "With High Distinction" },
  { id: "first-class", label: "First Class Honours" },
  { id: "merit", label: "With Merit" },
];

export interface DiplomaSignatory {
  id: string;
  name: string;
  title: string;
  role: string; // Chancellor, Dean, Registrar, etc.
}

export interface DiplomaStyleConfig {
  template: DiplomaTemplate;
  accentColor: string;
  borderStyle: DiplomaBorderStyle;
  fontPairing: string;
  fontScale: number;
  headerStyle: "centered" | "left-aligned" | "crest-centered";
}

export interface DiplomaFormatConfig {
  pageSize: "a4" | "letter" | "a5";
  orientation: PageOrientation;
  margins: "narrow" | "standard" | "wide";
}

export interface DiplomaFormData {
  diplomaType: DiplomaType;

  // Institution
  institutionName: string;
  institutionSubtitle: string;
  institutionMotto: string;

  // Recipient
  recipientName: string;
  recipientId: string;

  // Program
  programName: string;
  fieldOfStudy: string;
  honors: HonorsLevel;

  // Conferral
  conferralText: string;
  resolutionText: string;

  // Accreditation
  accreditationBody: string;
  accreditationNumber: string;

  // Dates
  dateConferred: string;
  graduationDate: string;

  // Reference
  registrationNumber: string;
  serialNumber: string;

  // Signatories
  signatories: DiplomaSignatory[];

  // Seal
  showSeal: boolean;
  sealText: string;
  sealStyle: SealStyle;

  // Style
  style: DiplomaStyleConfig;

  // Format
  format: DiplomaFormatConfig;
}

// ---------------------------------------------------------------------------
// Font Pairings (shared with certificate, same keys)
// ---------------------------------------------------------------------------

export const DIPLOMA_FONT_PAIRINGS: Record<string, { heading: string; body: string; google: string }> = {
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

export function createDefaultDiplomaForm(type?: DiplomaType): DiplomaFormData {
  const diplomaType = type ?? "bachelors";
  const typeConfig = DIPLOMA_TYPES.find((t) => t.id === diplomaType) ?? DIPLOMA_TYPES[0];

  return {
    diplomaType,
    institutionName: "",
    institutionSubtitle: "",
    institutionMotto: "",

    recipientName: "",
    recipientId: "",

    programName: typeConfig.defaultTitle,
    fieldOfStudy: "",
    honors: "",

    conferralText: "The Board of Trustees, on recommendation of the Faculty, has conferred upon",
    resolutionText: "By resolution of the Academic Senate",

    accreditationBody: "",
    accreditationNumber: "",

    dateConferred: new Date().toISOString().split("T")[0],
    graduationDate: "",

    registrationNumber: "",
    serialNumber: "",

    signatories: [
      { id: uid(), name: "", title: "Chancellor", role: "chancellor" },
      { id: uid(), name: "", title: "Registrar", role: "registrar" },
    ],

    showSeal: true,
    sealText: "UNIVERSITY SEAL",
    sealStyle: "embossed",

    style: {
      template: "university-classic",
      accentColor: "#1e3a5f",
      borderStyle: "double-frame",
      fontPairing: "playfair-lato",
      fontScale: 1,
      headerStyle: "crest-centered",
    },

    format: {
      pageSize: "a4",
      orientation: "landscape",
      margins: "standard",
    },
  };
}

export function getDiplomaTemplate(id: string): DiplomaTemplateConfig {
  return DIPLOMA_TEMPLATES.find((t) => t.id === id) ?? DIPLOMA_TEMPLATES[0];
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

export interface DiplomaEditorState {
  form: DiplomaFormData;
  accentColorLocked: boolean;

  setForm: (form: DiplomaFormData) => void;
  resetForm: (diplomaType?: DiplomaType) => void;
  setDiplomaType: (type: DiplomaType) => void;

  setAccentColorLocked: (locked: boolean) => void;

  // Institution
  updateInstitution: (patch: Partial<Pick<DiplomaFormData, "institutionName" | "institutionSubtitle" | "institutionMotto">>) => void;

  // Recipient
  updateRecipient: (patch: Partial<Pick<DiplomaFormData, "recipientName" | "recipientId">>) => void;

  // Program
  updateProgram: (patch: Partial<Pick<DiplomaFormData, "programName" | "fieldOfStudy" | "honors">>) => void;

  // Conferral
  updateConferral: (patch: Partial<Pick<DiplomaFormData, "conferralText" | "resolutionText">>) => void;

  // Accreditation
  updateAccreditation: (patch: Partial<Pick<DiplomaFormData, "accreditationBody" | "accreditationNumber">>) => void;

  // Dates
  updateDates: (patch: Partial<Pick<DiplomaFormData, "dateConferred" | "graduationDate">>) => void;

  // Reference
  updateReference: (patch: Partial<Pick<DiplomaFormData, "registrationNumber" | "serialNumber">>) => void;

  // Signatories
  addSignatory: () => string;
  removeSignatory: (id: string) => void;
  updateSignatory: (id: string, patch: Partial<DiplomaSignatory>) => void;

  // Seal
  updateSeal: (patch: Partial<Pick<DiplomaFormData, "showSeal" | "sealText" | "sealStyle">>) => void;

  // Style
  updateStyle: (patch: Partial<DiplomaStyleConfig>) => void;
  setTemplate: (template: DiplomaTemplate) => void;
  setAccentColor: (color: string) => void;

  // Format
  updateFormat: (patch: Partial<DiplomaFormatConfig>) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDiplomaEditor = create<DiplomaEditorState>()(
  temporal(
    persist(
      immer<DiplomaEditorState>((set) => ({
        form: createDefaultDiplomaForm(),
        accentColorLocked: false,

        setAccentColorLocked: (locked) =>
          set((s) => {
            s.accentColorLocked = locked;
          }),

        setDiplomaType: (type) =>
          set((s) => {
            const typeConfig = DIPLOMA_TYPES.find((t) => t.id === type);
            s.form.diplomaType = type;
            if (typeConfig) {
              s.form.programName = typeConfig.defaultTitle;
            }
          }),

        setForm: (form) =>
          set((s) => {
            s.form = form;
          }),

        resetForm: (diplomaType) =>
          set((s) => {
            s.form = createDefaultDiplomaForm(diplomaType ?? s.form.diplomaType);
            s.accentColorLocked = false;
          }),

        updateInstitution: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        updateRecipient: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        updateProgram: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        updateConferral: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        updateAccreditation: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        updateDates: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        updateReference: (patch) =>
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
              role: "",
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
            Object.assign(s.form.style, patch);
          }),

        setTemplate: (template) =>
          set((s) => {
            const tpl = getDiplomaTemplate(template);
            s.form.style.template = tpl.id;
            s.form.style.borderStyle = tpl.borderStyle as DiplomaBorderStyle;
            s.form.style.fontPairing = tpl.fontPairing;
            if (!s.accentColorLocked) {
              s.form.style.accentColor = tpl.accent;
            }
          }),

        setAccentColor: (color) =>
          set((s) => {
            s.form.style.accentColor = color;
          }),

        updateFormat: (patch) =>
          set((s) => {
            Object.assign(s.form.format, patch);
          }),
      })),
      {
        name: "dmsuite-diploma-editor",
        storage: createJSONStorage(() => localStorage),
        version: 1,
      },
    ),
    {
      limit: 50,
      equality: (a, b) => equal(a, b),
    },
  ),
);

// ---------------------------------------------------------------------------
// Undo/Redo hook
// ---------------------------------------------------------------------------

export function useDiplomaUndo() {
  const store = useDiplomaEditor.temporal.getState();
  return {
    undo: store.undo,
    redo: store.redo,
    canUndo: store.pastStates.length > 0,
    canRedo: store.futureStates.length > 0,
  };
}
