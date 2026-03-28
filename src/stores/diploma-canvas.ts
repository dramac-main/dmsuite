// =============================================================================
// DMSuite — Diploma Canvas Editor Store
// Zustand + Immer + Zundo for the canvas-based diploma designer.
// Holds DiplomaConfig (from diploma-composer) and drives recomposition.
// =============================================================================

"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import equal from "fast-deep-equal";

import {
  type DiplomaConfig,
  type DiplomaType,
  type DiplomaSize,
  type DiplomaStyle,
  type DiplomaSignatory,
  type HonorsLevel,
  DIPLOMA_TEMPLATE_PRESETS,
  DIPLOMA_COLOR_SCHEMES,
  configFromPreset,
} from "@/lib/editor/diploma-composer";

// ---------------------------------------------------------------------------
// Serial Generator
// ---------------------------------------------------------------------------

function generateSerial(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "DIP-";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function createDefaultConfig(): DiplomaConfig {
  return configFromPreset(DIPLOMA_TEMPLATE_PRESETS[0], {
    institutionName: "University of Zambia",
    institutionSubtitle: "School of Engineering",
    institutionMotto: "Service and Excellence",
    recipientName: "John Mwanza",
    recipientId: "STU-2024-0001",
    degreeName: "Bachelor of Engineering",
    fieldOfStudy: "Computer Engineering",
    honors: "",
    conferralText: "The Board of Trustees, on recommendation of the Faculty, has conferred upon",
    resolutionText: "By resolution of the Academic Senate",
    dateConferred: new Date().toISOString().split("T")[0],
    signatories: [
      { name: "Prof. Luke Mumba", title: "Vice-Chancellor", role: "chancellor" },
      { name: "Dr. Grace Banda", title: "Registrar", role: "registrar" },
    ],
    serialNumber: generateSerial(),
  });
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

export interface DiplomaCanvasState {
  config: DiplomaConfig;
  activePresetId: string;

  // Setters
  setConfig: (config: DiplomaConfig) => void;
  updateConfig: (patch: Partial<DiplomaConfig>) => void;
  resetConfig: (diplomaType?: DiplomaType) => void;

  // Preset
  applyPreset: (presetId: string) => void;

  // Institution helpers
  updateInstitution: (patch: Partial<Pick<DiplomaConfig, "institutionName" | "institutionSubtitle" | "institutionMotto">>) => void;

  // Recipient helpers
  updateRecipient: (patch: Partial<Pick<DiplomaConfig, "recipientName" | "recipientId">>) => void;

  // Program helpers
  updateProgram: (patch: Partial<Pick<DiplomaConfig, "degreeName" | "fieldOfStudy" | "honors">>) => void;

  // Conferral & accreditation helpers
  updateConferral: (patch: Partial<Pick<DiplomaConfig, "conferralText" | "resolutionText" | "accreditationBody" | "accreditationNumber">>) => void;

  // Date helpers
  updateDates: (patch: Partial<Pick<DiplomaConfig, "dateConferred" | "graduationDate">>) => void;

  // Signatory helpers
  addSignatory: (sig: DiplomaSignatory) => void;
  removeSignatory: (index: number) => void;
  updateSignatory: (index: number, patch: Partial<DiplomaSignatory>) => void;

  // Style helpers
  setStyle: (style: DiplomaStyle) => void;
  setColorScheme: (schemeId: string) => void;
  setSize: (size: DiplomaSize) => void;
  setType: (type: DiplomaType) => void;
  setHonors: (honors: HonorsLevel) => void;
  toggleFeature: (feature: "showSeal" | "showCorners" | "showBorder" | "showMotto", value: boolean) => void;

  // Serial
  regenerateSerial: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDiplomaCanvas = create<DiplomaCanvasState>()(
  temporal(
    persist(
      immer<DiplomaCanvasState>((set) => ({
        config: createDefaultConfig(),
        activePresetId: DIPLOMA_TEMPLATE_PRESETS[0].id,

        setConfig: (config) => set((s) => { s.config = config; }),

        updateConfig: (patch) => set((s) => {
          Object.assign(s.config, patch);
        }),

        resetConfig: (diplomaType) => set((s) => {
          s.config = configFromPreset(
            DIPLOMA_TEMPLATE_PRESETS.find((p) => diplomaType && p.type === diplomaType) ?? DIPLOMA_TEMPLATE_PRESETS[0],
            { serialNumber: generateSerial() },
          );
          s.activePresetId = s.config.type === diplomaType
            ? DIPLOMA_TEMPLATE_PRESETS.find((p) => p.type === diplomaType)?.id ?? DIPLOMA_TEMPLATE_PRESETS[0].id
            : DIPLOMA_TEMPLATE_PRESETS[0].id;
        }),

        applyPreset: (presetId) => set((s) => {
          const preset = DIPLOMA_TEMPLATE_PRESETS.find((p) => p.id === presetId);
          if (!preset) return;
          s.activePresetId = presetId;
          s.config.style = preset.style;
          s.config.colorSchemeId = preset.colorSchemeId;
          s.config.type = preset.type;
          s.config.showSeal = preset.showSeal;
          s.config.showCorners = preset.showCorners;
          s.config.showBorder = preset.showBorder;
          s.config.showMotto = preset.showMotto;
        }),

        // Institution
        updateInstitution: (patch) => set((s) => { Object.assign(s.config, patch); }),

        // Recipient
        updateRecipient: (patch) => set((s) => { Object.assign(s.config, patch); }),

        // Program
        updateProgram: (patch) => set((s) => { Object.assign(s.config, patch); }),

        // Conferral & accreditation
        updateConferral: (patch) => set((s) => { Object.assign(s.config, patch); }),

        // Dates
        updateDates: (patch) => set((s) => { Object.assign(s.config, patch); }),

        // Signatories
        addSignatory: (sig) => set((s) => {
          s.config.signatories.push(sig);
        }),

        removeSignatory: (index) => set((s) => {
          if (index >= 0 && index < s.config.signatories.length) {
            s.config.signatories.splice(index, 1);
          }
        }),

        updateSignatory: (index, patch) => set((s) => {
          if (index >= 0 && index < s.config.signatories.length) {
            Object.assign(s.config.signatories[index], patch);
          }
        }),

        // Style
        setStyle: (style) => set((s) => { s.config.style = style; }),

        setColorScheme: (schemeId) => set((s) => {
          if (DIPLOMA_COLOR_SCHEMES.some((c) => c.id === schemeId)) {
            s.config.colorSchemeId = schemeId;
          }
        }),

        setSize: (size) => set((s) => { s.config.size = size; }),

        setType: (type) => set((s) => { s.config.type = type; }),

        setHonors: (honors) => set((s) => { s.config.honors = honors; }),

        toggleFeature: (feature, value) => set((s) => { s.config[feature] = value; }),

        regenerateSerial: () => set((s) => { s.config.serialNumber = generateSerial(); }),
      })),
      {
        name: "dmsuite-diploma-canvas",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ config: state.config, activePresetId: state.activePresetId }),
      },
    ),
    { limit: 50, equality: (a, b) => equal(a, b) },
  ),
);
