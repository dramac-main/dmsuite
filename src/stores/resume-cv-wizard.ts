// =============================================================================
// DMSuite — Resume & CV Builder Wizard Store
// Manages wizard navigation and user-input data (Steps 1-6).
// Uses persist middleware with sessionStorage.
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ResumeStyle, PageCountPreference, ContentFidelityMode, ExperienceLevel,
} from "@/lib/resume/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
}

export interface TargetRole {
  jobTitle: string;
  experienceLevel: ExperienceLevel;
  industry: string;
  additionalContext: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
}

export interface OptionalSections {
  certifications: Array<{ id: string; name: string; issuer: string; year: string }>;
  languages: Array<{ id: string; name: string; proficiency: "native" | "fluent" | "intermediate" | "basic" }>;
  volunteer: Array<{ id: string; organization: string; role: string; description: string }>;
  projects: Array<{ id: string; name: string; description: string; url: string }>;
}

export interface BriefPreferences {
  description: string;
  style: ResumeStyle;
  pageCount: PageCountPreference;
  accentColor: string;
  contentFidelityMode: ContentFidelityMode;
  jobDescription: string;
}

export interface GenerationState {
  isGenerating: boolean;
  generationError: string | null;
  abortController: AbortController | null;
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

/** Parsed resume data from file upload */
export interface UploadedResumeData {
  personal: Partial<PersonalInfo>;
  targetRole: Partial<TargetRole>;
  experiences: Array<Omit<ExperienceEntry, "id">>;
  education: Array<Omit<EducationEntry, "id">>;
  skills: string[];
  certifications?: Array<{ name: string; issuer: string; year: string }>;
  languages?: Array<{ name: string; proficiency: "native" | "fluent" | "intermediate" | "basic" }>;
  projects?: Array<{ name: string; description: string; url: string }>;
  volunteer?: Array<{ organization: string; role: string; description: string }>;
  summary?: string;
}

interface ResumeCVWizardState {
  // Navigation
  currentStep: WizardStep;
  highestCompletedStep: WizardStep;
  stepDirection: "forward" | "backward";
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Upload mode — pre-fill from existing CV
  uploadMode: boolean;
  uploadFileName: string;
  setUploadMode: (v: boolean) => void;
  /** Pre-fill all wizard fields from parsed upload data and jump to Brief step */
  prefillFromUpload: (data: UploadedResumeData, fileName: string) => void;

  // Step 1: Personal Info
  personal: PersonalInfo;
  updatePersonal: <K extends keyof PersonalInfo>(key: K, value: PersonalInfo[K]) => void;

  // Step 2: Target Role
  targetRole: TargetRole;
  updateTargetRole: <K extends keyof TargetRole>(key: K, value: TargetRole[K]) => void;

  // Step 3: Experience
  experiences: ExperienceEntry[];
  addExperience: () => void;
  updateExperience: (id: string, data: Partial<ExperienceEntry>) => void;
  removeExperience: (id: string) => void;
  reorderExperiences: (ids: string[]) => void;

  // Step 4: Education & Skills
  education: EducationEntry[];
  addEducation: () => void;
  updateEducation: (id: string, data: Partial<EducationEntry>) => void;
  removeEducation: (id: string) => void;
  skills: string[];
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  setSkills: (skills: string[]) => void;
  optionalSections: OptionalSections;
  updateOptionalSections: (sections: Partial<OptionalSections>) => void;

  // Step 5: Brief
  brief: BriefPreferences;
  updateBrief: <K extends keyof BriefPreferences>(key: K, value: BriefPreferences[K]) => void;

  // Step 6: Generation
  generation: GenerationState;
  setIsGenerating: (v: boolean) => void;
  setGenerationError: (err: string | null) => void;
  setAbortController: (ctrl: AbortController | null) => void;

  // Reset
  resetWizard: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_PERSONAL: PersonalInfo = {
  name: "", email: "", phone: "", location: "", linkedin: "", website: "",
};

const DEFAULT_TARGET_ROLE: TargetRole = {
  jobTitle: "", experienceLevel: "mid", industry: "", additionalContext: "",
};

const DEFAULT_BRIEF: BriefPreferences = {
  description: "",
  style: "professional",
  pageCount: "one",
  accentColor: "rgba(37, 99, 235, 1)",
  contentFidelityMode: "ai-enhanced",
  jobDescription: "",
};

const DEFAULT_OPTIONAL: OptionalSections = {
  certifications: [],
  languages: [],
  volunteer: [],
  projects: [],
};

const DEFAULT_GENERATION: GenerationState = {
  isGenerating: false,
  generationError: null,
  abortController: null,
};

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useResumeCVWizard = create<ResumeCVWizardState>()(
  persist(
    (set, get) => ({
      // ---- Upload mode ----
      uploadMode: false,
      uploadFileName: "",
      setUploadMode: (v) => set({ uploadMode: v }),
      prefillFromUpload: (data, fileName) => {
        const cid = createId;
        const personal = data.personal || {};
        const target = data.targetRole || {};
        const experiences = Array.isArray(data.experiences) ? data.experiences : [];
        const education = Array.isArray(data.education) ? data.education : [];
        const skills = Array.isArray(data.skills) ? data.skills : [];
        const certs = Array.isArray(data.certifications) ? data.certifications : [];
        const langs = Array.isArray(data.languages) ? data.languages : [];
        const volunteer = Array.isArray(data.volunteer) ? data.volunteer : [];
        const projects = Array.isArray(data.projects) ? data.projects : [];

        set({
          uploadMode: true,
          uploadFileName: fileName,
          personal: {
            name: personal.name || "",
            email: personal.email || "",
            phone: personal.phone || "",
            location: personal.location || "",
            linkedin: personal.linkedin || "",
            website: personal.website || "",
          },
          targetRole: {
            jobTitle: target.jobTitle || "",
            experienceLevel: target.experienceLevel || "mid",
            industry: target.industry || "",
            additionalContext: target.additionalContext || "",
          },
          experiences: experiences.map((e) => ({
            id: cid(),
            company: e.company || "",
            position: e.position || "",
            startDate: e.startDate || "",
            endDate: e.endDate || "",
            isCurrent: e.isCurrent || false,
            description: e.description || "",
          })),
          education: education.map((e) => ({
            id: cid(),
            institution: e.institution || "",
            degree: e.degree || "",
            field: e.field || "",
            graduationYear: e.graduationYear || "",
          })),
          skills,
          optionalSections: {
            certifications: certs.map((c) => ({ id: cid(), name: c.name || "", issuer: c.issuer || "", year: c.year || "" })),
            languages: langs.map((l) => ({ id: cid(), name: l.name || "", proficiency: l.proficiency || "intermediate" })),
            volunteer: volunteer.map((v) => ({ id: cid(), organization: v.organization || "", role: v.role || "", description: v.description || "" })),
            projects: projects.map((p) => ({ id: cid(), name: p.name || "", description: p.description || "", url: p.url || "" })),
          },
          brief: {
            ...DEFAULT_BRIEF,
            contentFidelityMode: "keep-exact" as const,
            description: data.summary || "",
          },
          // Jump to Brief step (step 5) — user can review/tweak preferences, then generate
          currentStep: 5 as WizardStep,
          highestCompletedStep: 5 as WizardStep,
          stepDirection: "forward" as const,
        });
      },

      // ---- Navigation ----
      currentStep: 0 as WizardStep,
      highestCompletedStep: 0 as WizardStep,
      stepDirection: "forward" as const,

      goToStep: (step) => {
        const { currentStep, highestCompletedStep } = get();
        if (step > highestCompletedStep + 1) return;
        set({
          currentStep: step,
          stepDirection: step > currentStep ? "forward" : "backward",
        });
      },

      nextStep: () => {
        const { currentStep, highestCompletedStep } = get();
        if (currentStep >= 7) return;
        const next = Math.min(currentStep + 1, 7) as WizardStep;
        set({
          currentStep: next,
          highestCompletedStep: Math.max(highestCompletedStep, next) as WizardStep,
          stepDirection: "forward",
        });
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep <= 0) return;
        set({
          currentStep: (currentStep - 1) as WizardStep,
          stepDirection: "backward",
        });
      },

      // ---- Step 1 ----
      personal: { ...DEFAULT_PERSONAL },
      updatePersonal: (key, value) =>
        set((s) => ({ personal: { ...s.personal, [key]: value } })),

      // ---- Step 2 ----
      targetRole: { ...DEFAULT_TARGET_ROLE },
      updateTargetRole: (key, value) =>
        set((s) => ({ targetRole: { ...s.targetRole, [key]: value } })),

      // ---- Step 3 ----
      experiences: [],
      addExperience: () =>
        set((s) => ({
          experiences: [
            ...s.experiences,
            { id: createId(), company: "", position: "", startDate: "", endDate: "", isCurrent: false, description: "" },
          ],
        })),
      updateExperience: (id, data) =>
        set((s) => ({
          experiences: s.experiences.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      removeExperience: (id) =>
        set((s) => ({ experiences: s.experiences.filter((e) => e.id !== id) })),
      reorderExperiences: (ids) =>
        set((s) => {
          const map = new Map(s.experiences.map((e) => [e.id, e]));
          return { experiences: ids.map((id) => map.get(id)!).filter(Boolean) };
        }),

      // ---- Step 4 ----
      education: [],
      addEducation: () =>
        set((s) => ({
          education: [
            ...s.education,
            { id: createId(), institution: "", degree: "", field: "", graduationYear: "" },
          ],
        })),
      updateEducation: (id, data) =>
        set((s) => ({
          education: s.education.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      removeEducation: (id) =>
        set((s) => ({ education: s.education.filter((e) => e.id !== id) })),
      skills: [],
      addSkill: (skill) =>
        set((s) => {
          if (s.skills.includes(skill) || s.skills.length >= 25) return s;
          return { skills: [...s.skills, skill] };
        }),
      removeSkill: (skill) =>
        set((s) => ({ skills: s.skills.filter((sk) => sk !== skill) })),
      setSkills: (skills) => set({ skills }),
      optionalSections: { ...DEFAULT_OPTIONAL },
      updateOptionalSections: (sections) =>
        set((s) => ({ optionalSections: { ...s.optionalSections, ...sections } })),

      // ---- Step 5 ----
      brief: { ...DEFAULT_BRIEF },
      updateBrief: (key, value) =>
        set((s) => ({ brief: { ...s.brief, [key]: value } })),

      // ---- Step 6 ----
      generation: { ...DEFAULT_GENERATION },
      setIsGenerating: (v) =>
        set((s) => ({ generation: { ...s.generation, isGenerating: v } })),
      setGenerationError: (err) =>
        set((s) => ({ generation: { ...s.generation, generationError: err } })),
      setAbortController: (ctrl) =>
        set((s) => ({ generation: { ...s.generation, abortController: ctrl } })),

      // ---- Reset ----
      resetWizard: () =>
        set({
          currentStep: 0 as WizardStep,
          highestCompletedStep: 0 as WizardStep,
          stepDirection: "forward" as const,
          uploadMode: false,
          uploadFileName: "",
          personal: { ...DEFAULT_PERSONAL },
          targetRole: { ...DEFAULT_TARGET_ROLE },
          experiences: [],
          education: [],
          skills: [],
          optionalSections: { ...DEFAULT_OPTIONAL },
          brief: { ...DEFAULT_BRIEF },
          generation: { ...DEFAULT_GENERATION },
        }),
    }),
    {
      name: "dmsuite-resume-wizard",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        highestCompletedStep: state.highestCompletedStep,
        stepDirection: state.stepDirection,
        uploadMode: state.uploadMode,
        uploadFileName: state.uploadFileName,
        personal: state.personal,
        targetRole: state.targetRole,
        experiences: state.experiences,
        education: state.education,
        skills: state.skills,
        optionalSections: state.optionalSections,
        brief: state.brief,
        // Do NOT persist generation state
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Clamp step back to 6 if it was on 7 (editor step is not persistable)
        if (state.currentStep === 7) {
          state.currentStep = 6 as WizardStep;
        }
        // Ensure highestCompletedStep is valid
        if (state.highestCompletedStep > 7) {
          state.highestCompletedStep = 7 as WizardStep;
        }
      },
    }
  )
);
