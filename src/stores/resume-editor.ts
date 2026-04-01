"use client";

import { create } from "zustand";

// =============================================================================
// Resume Editor Store — Stub (workspace not yet built)
// =============================================================================

interface ResumeState {
  resume: Record<string, unknown>;
}

export const useResumeEditor = create<ResumeState>()(() => ({
  resume: {},
}));
