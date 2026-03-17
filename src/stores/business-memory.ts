// =============================================================================
// DMSuite — Business Memory Store
// Persistent localStorage-backed profile store that remembers the user's
// business details across sessions and tools. Layer 4 of Chiko Agent.
// Pattern: create<State>()(persist(...)) — same as chiko.ts, preferences.ts
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BusinessProfile {
  // ── Metadata ──
  profileId: string;
  profileName: string;
  createdAt: number;
  updatedAt: number;

  // ── Company ──
  companyName: string;
  personName: string;
  jobTitle: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  logoUrl: string;

  // ── Banking ──
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  bankBranchCode: string;
  bankSwiftBic: string;
  bankIban: string;
  bankSortCode: string;
  bankReference: string;
  bankCustomLabel: string;
  bankCustomValue: string;

  // ── Social ──
  linkedin: string;
  twitter: string;
  instagram: string;

  // ── Design preferences ──
  preferredAccentColor: string;
  preferredFontPairing: string;
  preferredCurrency: string;
  preferredCurrencySymbol: string;
  preferredPageSize: string;

  // ── Team ──
  teamMembers: { name: string; title: string }[];
}

type BankingKeys =
  | "bankName"
  | "bankAccountName"
  | "bankAccountNumber"
  | "bankBranch"
  | "bankBranchCode"
  | "bankSwiftBic"
  | "bankIban"
  | "bankSortCode"
  | "bankReference"
  | "bankCustomLabel"
  | "bankCustomValue";

type SocialKeys = "linkedin" | "twitter" | "instagram";

type DesignKeys =
  | "preferredAccentColor"
  | "preferredFontPairing"
  | "preferredCurrency"
  | "preferredCurrencySymbol"
  | "preferredPageSize";

export interface BusinessMemoryState {
  profile: BusinessProfile;
  hasProfile: boolean;

  // ── Mutations ──
  updateProfile: (patch: Partial<BusinessProfile>) => void;
  updateBanking: (patch: Partial<Pick<BusinessProfile, BankingKeys>>) => void;
  updateSocial: (patch: Partial<Pick<BusinessProfile, SocialKeys>>) => void;
  updateDesignPreferences: (patch: Partial<Pick<BusinessProfile, DesignKeys>>) => void;
  setLogo: (dataUri: string) => void;
  clearLogo: () => void;

  // ── Team ──
  addTeamMember: (member: { name: string; title: string }) => void;
  removeTeamMember: (index: number) => void;
  updateTeamMember: (index: number, patch: Partial<{ name: string; title: string }>) => void;

  // ── Lifecycle ──
  clearProfile: () => void;
  importFromFields: (fields: Record<string, string | undefined>) => void;

  // ── Read helpers ──
  getCompanyFields: () => Record<string, string>;
  getBankingFields: () => Record<string, string>;
  getProfileSummary: () => string;
  isFieldPopulated: (field: keyof BusinessProfile) => boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_PROFILE: BusinessProfile = {
  profileId: "",
  profileName: "",
  createdAt: 0,
  updatedAt: 0,
  companyName: "",
  personName: "",
  jobTitle: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  taxId: "",
  logoUrl: "",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankBranch: "",
  bankBranchCode: "",
  bankSwiftBic: "",
  bankIban: "",
  bankSortCode: "",
  bankReference: "",
  bankCustomLabel: "",
  bankCustomValue: "",
  linkedin: "",
  twitter: "",
  instagram: "",
  preferredAccentColor: "",
  preferredFontPairing: "",
  preferredCurrency: "",
  preferredCurrencySymbol: "",
  preferredPageSize: "",
  teamMembers: [],
};

/** Metadata keys excluded from "populated" counts */
const METADATA_KEYS = new Set<string>(["profileId", "profileName", "createdAt", "updatedAt"]);

/** Mapping from detected field names (Layer 2) to canonical profile keys */
const DETECTED_FIELD_MAP: Record<string, keyof BusinessProfile> = {
  companyName: "companyName",
  phone: "phone",
  email: "email",
  address: "address",
  website: "website",
  taxId: "taxId",
  bankName: "bankName",
  bankAccount: "bankAccountNumber",
  bankBranch: "bankBranch",
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBusinessMemory = create<BusinessMemoryState>()(
  persist(
    (set, get) => ({
      profile: { ...DEFAULT_PROFILE },
      hasProfile: false,

      updateProfile: (patch) =>
        set((state) => {
          const now = Date.now();
          const next = { ...state.profile, ...patch, updatedAt: now };

          // On first meaningful save, generate profileId and set createdAt
          if (!state.hasProfile) {
            const hasData = Object.entries(patch).some(
              ([k, v]) =>
                !METADATA_KEYS.has(k) &&
                v !== undefined &&
                v !== "" &&
                !(Array.isArray(v) && v.length === 0),
            );
            if (hasData) {
              if (!next.profileId) next.profileId = crypto.randomUUID();
              if (!next.createdAt) next.createdAt = now;
              // Default profileName to companyName if not set
              if (!next.profileName && next.companyName) {
                next.profileName = next.companyName;
              }
              return { profile: next, hasProfile: true };
            }
          }

          // Update profileName to match companyName if it was tracking
          if (
            patch.companyName &&
            (state.profile.profileName === "" ||
              state.profile.profileName === state.profile.companyName)
          ) {
            next.profileName = patch.companyName;
          }

          return { profile: next };
        }),

      updateBanking: (patch) => get().updateProfile(patch),
      updateSocial: (patch) => get().updateProfile(patch),
      updateDesignPreferences: (patch) => get().updateProfile(patch),

      setLogo: (dataUri) => {
        if (!dataUri.startsWith("data:image/")) return;
        get().updateProfile({ logoUrl: dataUri });
      },

      clearLogo: () => get().updateProfile({ logoUrl: "" }),

      addTeamMember: (member) =>
        set((state) => {
          const next = {
            ...state.profile,
            teamMembers: [...state.profile.teamMembers, member],
            updatedAt: Date.now(),
          };
          return {
            profile: next,
            hasProfile: state.hasProfile || true,
          };
        }),

      removeTeamMember: (index) =>
        set((state) => {
          if (index < 0 || index >= state.profile.teamMembers.length) return state;
          const teamMembers = state.profile.teamMembers.filter((_, i) => i !== index);
          return {
            profile: { ...state.profile, teamMembers, updatedAt: Date.now() },
          };
        }),

      updateTeamMember: (index, patch) =>
        set((state) => {
          if (index < 0 || index >= state.profile.teamMembers.length) return state;
          const teamMembers = state.profile.teamMembers.map((m, i) =>
            i === index ? { ...m, ...patch } : m,
          );
          return {
            profile: { ...state.profile, teamMembers, updatedAt: Date.now() },
          };
        }),

      clearProfile: () =>
        set((state) => ({
          profile: { ...DEFAULT_PROFILE, profileId: state.profile.profileId },
          hasProfile: false,
        })),

      importFromFields: (fields) => {
        const patch: Partial<BusinessProfile> = {};
        for (const [detected, value] of Object.entries(fields)) {
          if (!value || value.trim() === "") continue;
          const canonical = DETECTED_FIELD_MAP[detected];
          if (canonical) {
            (patch as Record<string, string>)[canonical] = value.trim();
          }
        }
        if (Object.keys(patch).length > 0) {
          get().updateProfile(patch);
        }
      },

      getCompanyFields: () => {
        const p = get().profile;
        const fields: Record<string, string> = {};
        const keys: (keyof BusinessProfile)[] = [
          "companyName", "personName", "jobTitle", "tagline",
          "address", "phone", "email", "website", "taxId",
        ];
        for (const k of keys) {
          const v = p[k];
          if (typeof v === "string" && v !== "") fields[k] = v;
        }
        return fields;
      },

      getBankingFields: () => {
        const p = get().profile;
        const fields: Record<string, string> = {};
        const keys: BankingKeys[] = [
          "bankName", "bankAccountName", "bankAccountNumber", "bankBranch",
          "bankBranchCode", "bankSwiftBic", "bankIban", "bankSortCode",
          "bankReference", "bankCustomLabel", "bankCustomValue",
        ];
        for (const k of keys) {
          if (p[k] !== "") fields[k] = p[k];
        }
        return fields;
      },

      getProfileSummary: () => {
        const { hasProfile, profile: p } = get();
        if (!hasProfile) return "";
        const parts: string[] = [];
        if (p.companyName) parts.push(p.companyName);
        if (p.email) parts.push(p.email);
        if (p.phone) parts.push(p.phone);
        return parts.join(" — ");
      },

      isFieldPopulated: (field) => {
        const v = get().profile[field];
        if (Array.isArray(v)) return v.length > 0;
        return typeof v === "string" ? v !== "" : v !== 0;
      },
    }),
    {
      name: "dmsuite-business-memory",
      partialize: (state) => ({
        profile: state.profile,
        hasProfile: state.hasProfile,
      }),
    },
  ),
);

/** Synchronous snapshot reader for use outside React */
export function getBusinessProfile(): BusinessProfile {
  return useBusinessMemory.getState().profile;
}
