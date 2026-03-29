/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Fabric Project Store
 *
 *  Minimal Zustand store that holds the current Fabric.js canvas JSON.
 *  Used by ALL Fabric-based workspaces for project save/load integration.
 *
 *  Since only one workspace is active at a time, a single store suffices.
 *  The store adapter (in store-adapters.ts) reads from this to snapshot
 *  project data, and writes to it when restoring a saved project.
 *  ═══════════════════════════════════════════════════════════════════════════ */

import { create } from "zustand";

interface FabricProjectState {
  /** Serialized Fabric.js canvas JSON (full state) */
  fabricJson: string | null;
  /** Canvas width in pixels */
  canvasWidth: number;
  /** Canvas height in pixels */
  canvasHeight: number;

  /** Called by FabricEditor's onSave callback */
  setFabricState: (json: string, width: number, height: number) => void;
  /** Reset to clean slate */
  reset: () => void;
}

export const useFabricProjectStore = create<FabricProjectState>((set) => ({
  fabricJson: null,
  canvasWidth: 1050,
  canvasHeight: 600,

  setFabricState: (json, width, height) =>
    set({ fabricJson: json, canvasWidth: width, canvasHeight: height }),

  reset: () =>
    set({ fabricJson: null, canvasWidth: 1050, canvasHeight: 600 }),
}));
