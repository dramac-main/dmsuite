// =============================================================================
// DMSuite — Business Card Wizard State Store
// Manages the multi-step wizard flow for the AI-first business card designer.
// Persisted in sessionStorage so page refresh doesn't lose work.
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DesignDocumentV2 } from "@/lib/editor/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type LogoType =
  | "auto-detect"
  | "separable"
  | "wordmark"
  | "lockup"
  | "icon-only"
  | "emblem";

export type StyleMood =
  | "minimal-clean"
  | "bold-modern"
  | "classic-elegant"
  | "creative-colorful"
  | "luxury-premium"
  | "tech-digital"
  | "warm-organic"
  | "corporate-professional"
  | null;

export type FontPreference = "modern" | "classic" | "bold" | null;

export type CardSide = "front" | "back";

export type CardSize = "standard" | "eu" | "square";

/** Step 3: Brief — user describes their brand/vibe in free text */
export interface BriefState {
  /** Free-text description of the business, personality, or design vision */
  description: string;
  /** Optional description of what the company does — helps AI understand the niche */
  companyDescription: string;
  /** Whether to generate only the front side (no back card) */
  frontOnly: boolean;
  /** Card size format */
  cardSize: CardSize;
}

export interface UserDetails {
  name: string;
  title: string;
  company: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  linkedin: string;
  twitter: string;
  instagram: string;
}

export interface LogoState {
  /** Data URL of the uploaded logo */
  logoUrl: string | null;
  /** The type of logo composition */
  logoType: LogoType;
  /** Data URL of an icon-only version (optional) */
  iconOnlyUrl: string | null;
  /** Loaded HTMLImageElement for canvas rendering (not serialized) */
  logoElement: HTMLImageElement | null;
  /** Dominant colors extracted from the logo (hex strings, max 6) */
  logoColors: string[];
}

export interface StyleSelection {
  /** Selected mood direction — kept for local fallback compatibility */
  selectedMood: StyleMood;
  /** Specific template IDs the user selected from reference gallery */
  selectedReferenceIds: string[];
  /** Color preset override (name from COLOR_PRESETS) */
  colorOverride: string | null;
  /** Custom brand colors */
  customColors: {
    primary: string | null;
    secondary: string | null;
    text: string | null;
    bg: string | null;
  };
  /** Font family preference */
  fontPreference: FontPreference;
  /** True if user chose "Surprise Me" */
  surpriseMe: boolean;
}

export interface GenerationState {
  /** Whether AI generation is currently running */
  isGenerating: boolean;
  /** Array of generated DesignDocumentV2 designs (front sides) */
  generatedDesigns: DesignDocumentV2[];
  /** Matching back-side designs (same indexes as generatedDesigns, null if no back) */
  generatedBackDesigns: (DesignDocumentV2 | null)[];
  /** Descriptions for each generated design */
  designDescriptions: string[];
  /** Index of the user's selected design (null if not yet selected) */
  selectedDesignIndex: number | null;
  /** Error message from generation */
  generationError: string | null;
  /** AbortController for cancelling in-flight requests */
  abortController: AbortController | null;
}

export interface CardDocuments {
  /** The front-side DesignDocumentV2 */
  frontDoc: DesignDocumentV2 | null;
  /** The back-side DesignDocumentV2 */
  backDoc: DesignDocumentV2 | null;
  /** Currently viewed side */
  currentSide: CardSide;
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

interface BusinessCardWizardState {
  // ---- Navigation ----
  currentStep: WizardStep;
  /** Highest step the user has completed */
  highestCompletedStep: WizardStep;
  /** Direction of step transition (for animations) */
  stepDirection: "forward" | "backward";
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // ---- Step 1: Logo ----
  logo: LogoState;
  setLogoUrl: (url: string | null) => void;
  setLogoType: (type: LogoType) => void;
  setIconOnlyUrl: (url: string | null) => void;
  setLogoElement: (el: HTMLImageElement | null) => void;
  setLogoColors: (colors: string[]) => void;

  // ---- Step 2: Details ----
  details: UserDetails;
  updateDetail: <K extends keyof UserDetails>(key: K, value: UserDetails[K]) => void;
  setDetails: (details: Partial<UserDetails>) => void;

  // ---- Step 3: Brief ----
  brief: BriefState;
  setBriefDescription: (desc: string) => void;
  setCompanyDescription: (desc: string) => void;
  setFrontOnly: (v: boolean) => void;
  setCardSize: (size: CardSize) => void;

  // ---- Style (internal — used by local fallback, not exposed in wizard UI) ----
  style: StyleSelection;
  setSelectedMood: (mood: StyleMood) => void;
  toggleReferenceId: (id: string) => void;
  setColorOverride: (preset: string | null) => void;
  setCustomColor: (key: keyof StyleSelection["customColors"], value: string | null) => void;
  setFontPreference: (font: FontPreference) => void;
  setSurpriseMe: (v: boolean) => void;

  // ---- Step 4: Generation ----
  generation: GenerationState;
  setIsGenerating: (v: boolean) => void;
  setGeneratedDesigns: (designs: DesignDocumentV2[], descriptions?: string[], backDesigns?: (DesignDocumentV2 | null)[]) => void;
  selectDesign: (index: number) => void;
  setGenerationError: (error: string | null) => void;
  setAbortController: (controller: AbortController | null) => void;
  clearGeneration: () => void;

  // ---- Step 5: Documents ----
  documents: CardDocuments;
  setFrontDoc: (doc: DesignDocumentV2 | null) => void;
  setBackDoc: (doc: DesignDocumentV2 | null) => void;
  setCurrentSide: (side: CardSide) => void;

  // ---- Batch ----
  batchMode: boolean;
  setBatchMode: (v: boolean) => void;

  // ---- Reset ----
  resetWizard: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_DETAILS: UserDetails = {
  name: "",
  title: "",
  company: "",
  tagline: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  linkedin: "",
  twitter: "",
  instagram: "",
};

const DEFAULT_LOGO: LogoState = {
  logoUrl: null,
  logoType: "auto-detect",
  iconOnlyUrl: null,
  logoElement: null,
  logoColors: [],
};

const DEFAULT_STYLE: StyleSelection = {
  selectedMood: null,
  selectedReferenceIds: [],
  colorOverride: null,
  customColors: { primary: null, secondary: null, text: null, bg: null },
  fontPreference: null,
  surpriseMe: false,
};

const DEFAULT_BRIEF: BriefState = {
  description: "",
  companyDescription: "",
  frontOnly: false,
  cardSize: "standard",
};

const DEFAULT_GENERATION: GenerationState = {
  isGenerating: false,
  generatedDesigns: [],
  generatedBackDesigns: [],
  designDescriptions: [],
  selectedDesignIndex: null,
  generationError: null,
  abortController: null,
};

const DEFAULT_DOCUMENTS: CardDocuments = {
  frontDoc: null,
  backDoc: null,
  currentSide: "front",
};

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

export const useBusinessCardWizard = create<BusinessCardWizardState>()(
  persist(
    (set, get) => ({
      // ---- Navigation ----
      currentStep: 1 as WizardStep,
      highestCompletedStep: 0 as WizardStep,
      stepDirection: "forward" as const,

      goToStep: (step) => {
        const current = get().currentStep;
        const highest = get().highestCompletedStep;
        // Can only jump to steps ≤ highestCompletedStep + 1
        if (step > highest + 1) return;
        set({
          currentStep: step,
          stepDirection: step > current ? "forward" : "backward",
        });
      },

      nextStep: () => {
        const current = get().currentStep;
        if (current < 6) {
          const next = (current + 1) as WizardStep;
          set({
            currentStep: next,
            stepDirection: "forward",
            highestCompletedStep: Math.max(get().highestCompletedStep, current) as WizardStep,
          });
        }
      },

      prevStep: () => {
        const current = get().currentStep;
        if (current > 1) {
          set({
            currentStep: (current - 1) as WizardStep,
            stepDirection: "backward",
          });
        }
      },

      // ---- Step 1: Logo ----
      logo: DEFAULT_LOGO,
      setLogoUrl: (url) => set((s) => ({ logo: { ...s.logo, logoUrl: url } })),
      setLogoType: (type) => set((s) => ({ logo: { ...s.logo, logoType: type } })),
      setIconOnlyUrl: (url) => set((s) => ({ logo: { ...s.logo, iconOnlyUrl: url } })),
      setLogoElement: (el) => set((s) => ({ logo: { ...s.logo, logoElement: el } })),
      setLogoColors: (colors) => set((s) => ({ logo: { ...s.logo, logoColors: colors } })),

      // ---- Step 2: Details ----
      details: DEFAULT_DETAILS,
      updateDetail: (key, value) =>
        set((s) => ({ details: { ...s.details, [key]: value } })),
      setDetails: (partial) =>
        set((s) => ({ details: { ...s.details, ...partial } })),

      // ---- Step 3: Brief ----
      brief: DEFAULT_BRIEF,
      setBriefDescription: (desc) =>
        set((s) => ({ brief: { ...s.brief, description: desc } })),
      setCompanyDescription: (desc) =>
        set((s) => ({ brief: { ...s.brief, companyDescription: desc } })),
      setFrontOnly: (v) =>
        set((s) => ({ brief: { ...s.brief, frontOnly: v } })),
      setCardSize: (size) =>
        set((s) => ({ brief: { ...s.brief, cardSize: size } })),

      // ---- Style (internal — kept for local fallback) ----
      style: DEFAULT_STYLE,
      setSelectedMood: (mood) =>
        set((s) => ({ style: { ...s.style, selectedMood: mood, surpriseMe: false } })),
      toggleReferenceId: (id) =>
        set((s) => {
          const ids = s.style.selectedReferenceIds.includes(id)
            ? s.style.selectedReferenceIds.filter((r) => r !== id)
            : [...s.style.selectedReferenceIds, id];
          return { style: { ...s.style, selectedReferenceIds: ids, surpriseMe: false } };
        }),
      setColorOverride: (preset) =>
        set((s) => ({ style: { ...s.style, colorOverride: preset } })),
      setCustomColor: (key, value) =>
        set((s) => ({
          style: {
            ...s.style,
            customColors: { ...s.style.customColors, [key]: value },
          },
        })),
      setFontPreference: (font) =>
        set((s) => ({ style: { ...s.style, fontPreference: font } })),
      setSurpriseMe: (v) =>
        set((s) => ({
          style: {
            ...s.style,
            surpriseMe: v,
            selectedMood: v ? null : s.style.selectedMood,
            selectedReferenceIds: v ? [] : s.style.selectedReferenceIds,
          },
        })),

      // ---- Step 4: Generation ----
      generation: DEFAULT_GENERATION,
      setIsGenerating: (v) =>
        set((s) => ({ generation: { ...s.generation, isGenerating: v } })),
      setGeneratedDesigns: (designs, descriptions, backDesigns) =>
        set((s) => ({
          generation: {
            ...s.generation,
            generatedDesigns: designs,
            generatedBackDesigns: backDesigns ?? designs.map(() => null),
            designDescriptions: descriptions ?? designs.map((_, i) => `Design ${i + 1}`),
            selectedDesignIndex: null,
            generationError: null,
          },
        })),
      selectDesign: (index) =>
        set((s) => ({
          generation: { ...s.generation, selectedDesignIndex: index },
        })),
      setGenerationError: (error) =>
        set((s) => ({
          generation: { ...s.generation, generationError: error, isGenerating: false },
        })),
      setAbortController: (controller) =>
        set((s) => ({
          generation: { ...s.generation, abortController: controller },
        })),
      clearGeneration: () =>
        set({ generation: DEFAULT_GENERATION }),

      // ---- Step 5: Documents ----
      documents: DEFAULT_DOCUMENTS,
      setFrontDoc: (doc) =>
        set((s) => ({ documents: { ...s.documents, frontDoc: doc } })),
      setBackDoc: (doc) =>
        set((s) => ({ documents: { ...s.documents, backDoc: doc } })),
      setCurrentSide: (side) =>
        set((s) => ({ documents: { ...s.documents, currentSide: side } })),

      // ---- Batch ----
      batchMode: false,
      setBatchMode: (v) => set({ batchMode: v }),

      // ---- Reset ----
      resetWizard: () =>
        set({
          currentStep: 1 as WizardStep,
          highestCompletedStep: 0 as WizardStep,
          stepDirection: "forward",
          logo: DEFAULT_LOGO,
          details: DEFAULT_DETAILS,
          brief: DEFAULT_BRIEF,
          style: DEFAULT_STYLE,
          generation: DEFAULT_GENERATION,
          documents: DEFAULT_DOCUMENTS,
          batchMode: false,
        }),
    }),
    {
      name: "dmsuite-business-card-wizard",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      // Don't persist transient state
      partialize: (state) => ({
        currentStep: state.currentStep,
        highestCompletedStep: state.highestCompletedStep,
        logo: {
          logoUrl: state.logo.logoUrl,
          logoType: state.logo.logoType,
          iconOnlyUrl: state.logo.iconOnlyUrl,
          logoColors: state.logo.logoColors,
          // logoElement is not serializable
        },
        details: state.details,
        brief: state.brief,
        style: state.style,
        batchMode: state.batchMode,
        // Don't persist: generation state, documents, abortController
      }),
      // On hydration, clamp currentStep since generation/documents aren't persisted
      onRehydrateStorage: () => (state) => {
        if (state && state.currentStep > 4) {
          // Steps 5+ require generated docs which aren't persisted — reset to generate step
          state.currentStep = 4 as WizardStep;
          state.highestCompletedStep = Math.min(state.highestCompletedStep, 3) as WizardStep;
        }
      },
    }
  )
);
