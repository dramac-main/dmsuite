"use client";

// =============================================================================
// DMSuite — Cover Letter Writer Zustand Store
// Middleware: temporal(persist(immer(...)))
// =============================================================================

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import equal from "fast-deep-equal";

// ━━━ Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type CoverLetterType =
  | "job-application"
  | "internship"
  | "career-change"
  | "speculative"
  | "academic"
  | "executive"
  | "creative"
  | "entry-level"
  | "internal-transfer"
  | "referral"
  | "networking"
  | "freelance-pitch";

export type ToneStyle =
  | "formal-corporate"
  | "warm-conversational"
  | "bold-confident"
  | "creative-expressive"
  | "academic-scholarly"
  | "executive-authoritative";

export type TemplateId =
  | "classic"
  | "modern"
  | "executive"
  | "creative"
  | "minimal"
  | "bold"
  | "elegant"
  | "professional";

export type FontPairingId =
  | "inter-jetbrains"
  | "playfair-source"
  | "merriweather-opensans"
  | "lora-roboto"
  | "raleway-lato"
  | "montserrat-opensans"
  | "cormorant-proza"
  | "libre-source";

export type HeaderStyleId = "standard" | "sidebar" | "banner" | "minimal" | "boxed";

// ━━━ Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SenderInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  website: string;
}

export interface RecipientInfo {
  hiringManagerName: string;
  hiringManagerTitle: string;
  companyName: string;
  companyAddress: string;
  department: string;
}

export interface TargetJob {
  jobTitle: string;
  jobDescription: string;
  keyRequirements: string;
  industry: string;
  companyMission: string;
  whyThisCompany: string;
}

export interface PersonalBackground {
  currentRole: string;
  yearsOfExperience: string;
  keySkills: string[];
  achievements: string[];
  careerHighlights: string;
  educationSummary: string;
  relevantCertifications: string;
}

export interface LetterContent {
  salutation: string;
  openingHook: string;
  bodyQualifications: string;
  bodyCompanyFit: string;
  closingCallToAction: string;
  signOff: string;
  postScript: string;
}

export interface StyleConfig {
  template: TemplateId;
  accentColor: string;
  fontPairing: FontPairingId;
  headerStyle: HeaderStyleId;
  showRecipientAddress: boolean;
  showDate: boolean;
  showSubjectLine: boolean;
  subjectLine: string;
  showPageBorder: boolean;
  showLetterheadBar: boolean;
}

export interface PrintConfig {
  pageSize: "a4" | "letter" | "a5";
  margins: "narrow" | "standard" | "wide";
  lineSpacing: "tight" | "normal" | "loose";
  sectionSpacing: number;
}

export interface CoverLetterFormData {
  letterType: CoverLetterType;
  tone: ToneStyle;
  date: string;
  sender: SenderInfo;
  recipient: RecipientInfo;
  target: TargetJob;
  background: PersonalBackground;
  content: LetterContent;
  style: StyleConfig;
  printConfig: PrintConfig;
  variationNotes: string;
}

// ━━━ Defaults ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const COVER_LETTER_TYPES: { id: CoverLetterType; label: string; description: string }[] = [
  { id: "job-application", label: "Job Application", description: "Standard cover letter for a specific job posting" },
  { id: "internship", label: "Internship", description: "For students and early-career applicants seeking internships" },
  { id: "career-change", label: "Career Change", description: "Transitioning from one industry or role to another" },
  { id: "speculative", label: "Speculative / Cold Outreach", description: "Unsolicited letter to a company not currently hiring" },
  { id: "academic", label: "Academic & Research", description: "For university positions, postdocs, or research roles" },
  { id: "executive", label: "Executive & C-Suite", description: "Senior leadership and board-level positions" },
  { id: "creative", label: "Creative Industry", description: "Design, arts, media, advertising, and creative roles" },
  { id: "entry-level", label: "Graduate & Entry-Level", description: "First-time job seekers and recent graduates" },
  { id: "internal-transfer", label: "Internal Transfer", description: "Applying for a different role within your current company" },
  { id: "referral", label: "Referral", description: "When you have been referred by someone at the company" },
  { id: "networking", label: "Networking / Informational", description: "Requesting an informational interview or advice" },
  { id: "freelance-pitch", label: "Freelance Pitch", description: "Pitching your freelance services to a potential client" },
];

export const TONE_OPTIONS: { id: ToneStyle; label: string; description: string }[] = [
  { id: "formal-corporate", label: "Formal & Corporate", description: "Traditional, professional tone for conservative industries" },
  { id: "warm-conversational", label: "Warm & Conversational", description: "Approachable yet professional — great for startups and SMEs" },
  { id: "bold-confident", label: "Bold & Confident", description: "Assertive, results-driven tone for competitive roles" },
  { id: "creative-expressive", label: "Creative & Expressive", description: "Unique voice for creative and design-oriented roles" },
  { id: "academic-scholarly", label: "Academic & Scholarly", description: "Research-focused, citing publications and methodologies" },
  { id: "executive-authoritative", label: "Executive & Authoritative", description: "Strategic, leadership-oriented for senior positions" },
];

export const COVER_LETTER_TEMPLATES: { id: TemplateId; label: string; accent: string; preview: string }[] = [
  { id: "classic", label: "Classic", accent: "#1a365d", preview: "#1a365d" },
  { id: "modern", label: "Modern", accent: "#6366f1", preview: "#6366f1" },
  { id: "executive", label: "Executive", accent: "#1e3a5f", preview: "#1e3a5f" },
  { id: "creative", label: "Creative", accent: "#8b5cf6", preview: "#8b5cf6" },
  { id: "minimal", label: "Minimal", accent: "#374151", preview: "#374151" },
  { id: "bold", label: "Bold", accent: "#dc2626", preview: "#dc2626" },
  { id: "elegant", label: "Elegant", accent: "#7c3aed", preview: "#7c3aed" },
  { id: "professional", label: "Professional", accent: "#0369a1", preview: "#0369a1" },
];

export const FONT_PAIRINGS: { id: FontPairingId; label: string; heading: string; body: string }[] = [
  { id: "inter-jetbrains", label: "Inter / JetBrains Mono", heading: "Inter", body: "Inter" },
  { id: "playfair-source", label: "Playfair / Source Sans", heading: "Playfair Display", body: "Source Sans 3" },
  { id: "merriweather-opensans", label: "Merriweather / Open Sans", heading: "Merriweather", body: "Open Sans" },
  { id: "lora-roboto", label: "Lora / Roboto", heading: "Lora", body: "Roboto" },
  { id: "raleway-lato", label: "Raleway / Lato", heading: "Raleway", body: "Lato" },
  { id: "montserrat-opensans", label: "Montserrat / Open Sans", heading: "Montserrat", body: "Open Sans" },
  { id: "cormorant-proza", label: "Cormorant / Proza Libre", heading: "Cormorant Garamond", body: "Proza Libre" },
  { id: "libre-source", label: "Libre Baskerville / Source", heading: "Libre Baskerville", body: "Source Sans 3" },
];

export const HEADER_STYLES: { id: HeaderStyleId; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "sidebar", label: "Sidebar" },
  { id: "banner", label: "Banner" },
  { id: "minimal", label: "Minimal" },
  { id: "boxed", label: "Boxed" },
];

export const ACCENT_COLORS = [
  "#1a365d", "#1e3a5f", "#0369a1", "#0891b2",
  "#6366f1", "#7c3aed", "#8b5cf6", "#a855f7",
  "#dc2626", "#ea580c", "#d97706", "#059669",
  "#374151", "#1f2937", "#0f172a", "#334155",
];

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function createDefaultCoverLetterForm(): CoverLetterFormData {
  return {
    letterType: "job-application",
    tone: "formal-corporate",
    date: todayDate(),
    sender: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      location: "",
      linkedIn: "",
      website: "",
    },
    recipient: {
      hiringManagerName: "",
      hiringManagerTitle: "Hiring Manager",
      companyName: "",
      companyAddress: "",
      department: "",
    },
    target: {
      jobTitle: "",
      jobDescription: "",
      keyRequirements: "",
      industry: "",
      companyMission: "",
      whyThisCompany: "",
    },
    background: {
      currentRole: "",
      yearsOfExperience: "",
      keySkills: [],
      achievements: [],
      careerHighlights: "",
      educationSummary: "",
      relevantCertifications: "",
    },
    content: {
      salutation: "Dear Hiring Manager,",
      openingHook: "",
      bodyQualifications: "",
      bodyCompanyFit: "",
      closingCallToAction: "",
      signOff: "Sincerely,",
      postScript: "",
    },
    style: {
      template: "classic",
      accentColor: "#1a365d",
      fontPairing: "inter-jetbrains",
      headerStyle: "standard",
      showRecipientAddress: true,
      showDate: true,
      showSubjectLine: false,
      subjectLine: "",
      showPageBorder: false,
      showLetterheadBar: true,
    },
    printConfig: {
      pageSize: "a4",
      margins: "standard",
      lineSpacing: "normal",
      sectionSpacing: 16,
    },
    variationNotes: "",
  };
}

// ━━━ State Interface ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CoverLetterEditorState {
  form: CoverLetterFormData;
  accentColorLocked: boolean;

  // ── Top-level ──
  setForm: (form: CoverLetterFormData) => void;
  resetForm: () => void;

  // ── Letter type & tone ──
  setLetterType: (type: CoverLetterType) => void;
  setTone: (tone: ToneStyle) => void;
  setDate: (date: string) => void;

  // ── Sender ──
  updateSender: (patch: Partial<SenderInfo>) => void;

  // ── Recipient ──
  updateRecipient: (patch: Partial<RecipientInfo>) => void;

  // ── Target job ──
  updateTarget: (patch: Partial<TargetJob>) => void;

  // ── Background ──
  updateBackground: (patch: Partial<PersonalBackground>) => void;
  addSkill: (skill: string) => void;
  removeSkill: (index: number) => void;
  addAchievement: (achievement: string) => void;
  removeAchievement: (index: number) => void;

  // ── Content ──
  updateContent: (patch: Partial<LetterContent>) => void;

  // ── Style ──
  updateStyle: (patch: Partial<StyleConfig>) => void;
  setTemplate: (template: TemplateId) => void;
  setAccentColor: (color: string) => void;

  // ── Print ──
  updatePrint: (patch: Partial<PrintConfig>) => void;

  // ── Variation ──
  setVariationNotes: (notes: string) => void;
}

// ━━━ Template defaults ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TEMPLATE_DEFAULTS: Record<TemplateId, { accent: string }> = {
  classic: { accent: "#1a365d" },
  modern: { accent: "#6366f1" },
  executive: { accent: "#1e3a5f" },
  creative: { accent: "#8b5cf6" },
  minimal: { accent: "#374151" },
  bold: { accent: "#dc2626" },
  elegant: { accent: "#7c3aed" },
  professional: { accent: "#0369a1" },
};

// ━━━ Store ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const useCoverLetterEditor = create<CoverLetterEditorState>()(
  temporal(
    persist(
      immer<CoverLetterEditorState>((set) => ({
        form: createDefaultCoverLetterForm(),
        accentColorLocked: false,

        setForm: (form) =>
          set((state) => {
            state.form = form;
          }),

        resetForm: () =>
          set((state) => {
            state.form = createDefaultCoverLetterForm();
            state.accentColorLocked = false;
          }),

        setLetterType: (type) =>
          set((state) => {
            state.form.letterType = type;
          }),

        setTone: (tone) =>
          set((state) => {
            state.form.tone = tone;
          }),

        setDate: (date) =>
          set((state) => {
            state.form.date = date;
          }),

        updateSender: (patch) =>
          set((state) => {
            Object.assign(state.form.sender, patch);
          }),

        updateRecipient: (patch) =>
          set((state) => {
            Object.assign(state.form.recipient, patch);
          }),

        updateTarget: (patch) =>
          set((state) => {
            Object.assign(state.form.target, patch);
          }),

        updateBackground: (patch) =>
          set((state) => {
            Object.assign(state.form.background, patch);
          }),

        addSkill: (skill) =>
          set((state) => {
            if (skill.trim() && !state.form.background.keySkills.includes(skill.trim())) {
              state.form.background.keySkills.push(skill.trim());
            }
          }),

        removeSkill: (index) =>
          set((state) => {
            state.form.background.keySkills.splice(index, 1);
          }),

        addAchievement: (achievement) =>
          set((state) => {
            if (achievement.trim()) {
              state.form.background.achievements.push(achievement.trim());
            }
          }),

        removeAchievement: (index) =>
          set((state) => {
            state.form.background.achievements.splice(index, 1);
          }),

        updateContent: (patch) =>
          set((state) => {
            Object.assign(state.form.content, patch);
          }),

        updateStyle: (patch) =>
          set((state) => {
            Object.assign(state.form.style, patch);
            if (patch.accentColor) {
              state.accentColorLocked = true;
            }
          }),

        setTemplate: (template) =>
          set((state) => {
            state.form.style.template = template;
            if (!state.accentColorLocked) {
              state.form.style.accentColor = TEMPLATE_DEFAULTS[template]?.accent ?? "#1a365d";
            }
          }),

        setAccentColor: (color) =>
          set((state) => {
            state.form.style.accentColor = color;
            state.accentColorLocked = true;
          }),

        updatePrint: (patch) =>
          set((state) => {
            Object.assign(state.form.printConfig, patch);
          }),

        setVariationNotes: (notes) =>
          set((state) => {
            state.form.variationNotes = notes;
          }),
      })),
      {
        name: "dmsuite-cover-letter",
        version: 1,
        partialize: (s) => ({ form: s.form, accentColorLocked: s.accentColorLocked }),
      }
    ),
    {
      partialize: (s) => ({ form: s.form }),
      equality: (a, b) => equal(a, b),
      limit: 50,
    }
  )
);

// ━━━ Undo helper ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useCoverLetterUndo() {
  const { undo, redo, pastStates, futureStates } =
    useCoverLetterEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
