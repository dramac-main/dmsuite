// =============================================================================
// DMSuite — Certificate Canvas Editor Store
// Zustand + Immer + Zundo for the canvas-based certificate designer.
// Holds CertificateConfig (from certificate-composer) and drives recomposition.
// =============================================================================

"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import equal from "fast-deep-equal";

import {
  type CertificateConfig,
  type CertificateType,
  type CertificateSize,
  type CertStyle,
  CERT_TEMPLATE_PRESETS,
  CERT_COLOR_SCHEMES,
  configFromPreset,
} from "@/lib/editor/certificate-composer";

// ---------------------------------------------------------------------------
// Serial Generator
// ---------------------------------------------------------------------------

function generateSerial(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "CERT-";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function createDefaultConfig(): CertificateConfig {
  return configFromPreset(CERT_TEMPLATE_PRESETS[0], {
    recipientName: "John Mwanza",
    description: "For outstanding performance and dedication in the completion of the Advanced Leadership Programme.",
    issuerName: "Dr. Chanda Mulenga",
    issuerTitle: "Director, DMSuite Academy",
    organizationName: "DMSuite Academy — Lusaka, Zambia",
    serialNumber: generateSerial(),
  });
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

export interface CertificateCanvasState {
  config: CertificateConfig;
  activePresetId: string;

  // Setters
  setConfig: (config: CertificateConfig) => void;
  updateConfig: (patch: Partial<CertificateConfig>) => void;
  resetConfig: (certType?: CertificateType) => void;

  // Preset
  applyPreset: (presetId: string) => void;

  // Content helpers
  updateContent: (patch: Partial<Pick<CertificateConfig, "title" | "subtitle" | "recipientName" | "description">>) => void;
  updateIssuer: (patch: Partial<Pick<CertificateConfig, "issuerName" | "issuerTitle" | "organizationName">>) => void;
  updateMeta: (patch: Partial<Pick<CertificateConfig, "date" | "serialNumber">>) => void;

  // Style helpers
  setStyle: (style: CertStyle) => void;
  setColorScheme: (schemeId: string) => void;
  setSize: (size: CertificateSize) => void;
  setType: (type: CertificateType) => void;
  toggleFeature: (feature: "showSeal" | "showCorners" | "showRibbon" | "showDivider", value: boolean) => void;

  // Serial
  regenerateSerial: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCertificateCanvas = create<CertificateCanvasState>()(
  temporal(
    persist(
      immer<CertificateCanvasState>((set) => ({
        config: createDefaultConfig(),
        activePresetId: CERT_TEMPLATE_PRESETS[0].id,

        setConfig: (config) => set((s) => { s.config = config; }),

        updateConfig: (patch) => set((s) => {
          Object.assign(s.config, patch);
        }),

        resetConfig: (certType) => set((s) => {
          s.config = configFromPreset(
            CERT_TEMPLATE_PRESETS.find((p) => certType && p.certType === certType) ?? CERT_TEMPLATE_PRESETS[0],
            { serialNumber: generateSerial() },
          );
          s.activePresetId = s.config.type === certType
            ? CERT_TEMPLATE_PRESETS.find((p) => p.certType === certType)?.id ?? CERT_TEMPLATE_PRESETS[0].id
            : CERT_TEMPLATE_PRESETS[0].id;
        }),

        applyPreset: (presetId) => set((s) => {
          const preset = CERT_TEMPLATE_PRESETS.find((p) => p.id === presetId);
          if (!preset) return;
          s.activePresetId = presetId;
          s.config.style = preset.style;
          s.config.colorSchemeId = preset.colorSchemeId;
          s.config.type = preset.certType;
          s.config.showSeal = preset.showSeal;
          s.config.showCorners = preset.showCorners;
          s.config.showRibbon = preset.showRibbon;
          s.config.showDivider = preset.showDivider;
        }),

        updateContent: (patch) => set((s) => { Object.assign(s.config, patch); }),
        updateIssuer: (patch) => set((s) => { Object.assign(s.config, patch); }),
        updateMeta: (patch) => set((s) => { Object.assign(s.config, patch); }),

        setStyle: (style) => set((s) => { s.config.style = style; }),
        setColorScheme: (schemeId) => set((s) => {
          if (CERT_COLOR_SCHEMES.some((c) => c.id === schemeId)) {
            s.config.colorSchemeId = schemeId;
          }
        }),
        setSize: (size) => set((s) => { s.config.size = size; }),
        setType: (type) => set((s) => { s.config.type = type; }),

        toggleFeature: (feature, value) => set((s) => { s.config[feature] = value; }),

        regenerateSerial: () => set((s) => { s.config.serialNumber = generateSerial(); }),
      })),
      {
        name: "dmsuite-certificate-canvas",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ config: state.config, activePresetId: state.activePresetId }),
      },
    ),
    { limit: 50, equality: (a, b) => equal(a, b) },
  ),
);
