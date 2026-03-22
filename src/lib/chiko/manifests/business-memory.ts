// =============================================================================
// DMSuite — Business Memory Manifest for Chiko
// Global manifest — always registered while Chiko is open.
// Actions: save, saveBanking, saveLogo, read, clear, prefillCurrentTool,
//          addTeamMember, removeTeamMember
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useChikoActionRegistry } from "@/stores/chiko-actions";
import { useBusinessMemory } from "@/stores/business-memory";
import {
  describeProfileForAI,
  getPopulatedFieldCount,
  mapProfileToSalesBookBranding,
  mapProfileToInvoiceBusinessInfo,
  mapProfileToInvoicePaymentInfo,
  mapProfileToResumeBasics,
} from "@/lib/chiko/field-mapper";

/** Build the Business Memory manifest. Registered globally from ChikoAssistant. */
export function createBusinessMemoryManifest(): ChikoActionManifest {
  return {
    toolId: "business-memory",
    toolName: "Business Memory",
    actions: [
      {
        name: "saveProfile",
        description:
          "Save or update the user's business profile fields (companyName, personName, jobTitle, tagline, address, phone, email, website, taxId, and any other canonical fields). Only call this when the user explicitly provides business info or confirms they want to save.",
        parameters: {
          type: "object",
          properties: {
            companyName: { type: "string" },
            personName: { type: "string" },
            jobTitle: { type: "string" },
            tagline: { type: "string" },
            address: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            website: { type: "string" },
            taxId: { type: "string" },
            bankName: { type: "string" },
            bankAccountName: { type: "string" },
            bankAccountNumber: { type: "string" },
            bankBranch: { type: "string" },
            bankBranchCode: { type: "string" },
            bankSwiftBic: { type: "string" },
            bankIban: { type: "string" },
            bankSortCode: { type: "string" },
            bankReference: { type: "string" },
            bankCustomLabel: { type: "string" },
            bankCustomValue: { type: "string" },
            linkedin: { type: "string" },
            twitter: { type: "string" },
            instagram: { type: "string" },
            preferredAccentColor: { type: "string" },
            preferredFontPairing: { type: "string" },
            preferredCurrency: { type: "string" },
            preferredCurrencySymbol: { type: "string" },
            preferredPageSize: { type: "string" },
          },
        },
        category: "Memory",
      },
      {
        name: "saveBanking",
        description:
          "Save or update banking details in the business profile (bankName, bankAccountName, bankAccountNumber, bankBranch, bankBranchCode, bankSwiftBic, bankIban, bankSortCode, bankReference, bankCustomLabel, bankCustomValue)",
        parameters: {
          type: "object",
          properties: {
            bankName: { type: "string" },
            bankAccountName: { type: "string" },
            bankAccountNumber: { type: "string" },
            bankBranch: { type: "string" },
            bankBranchCode: { type: "string" },
            bankSwiftBic: { type: "string" },
            bankIban: { type: "string" },
            bankSortCode: { type: "string" },
            bankReference: { type: "string" },
            bankCustomLabel: { type: "string" },
            bankCustomValue: { type: "string" },
          },
        },
        category: "Memory",
      },
      {
        name: "saveLogo",
        description:
          "Store a logo image in Business Memory. The logoUrl must be a base64 data URI starting with 'data:image/'.",
        parameters: {
          type: "object",
          properties: {
            logoUrl: { type: "string", description: "Logo as data URI (base64)" },
          },
          required: ["logoUrl"],
        },
        category: "Memory",
      },
      {
        name: "readProfile",
        description:
          "Read the full stored business profile. Returns all saved fields. Read-only — no mutations.",
        parameters: { type: "object", properties: {} },
        category: "Memory",
      },
      {
        name: "clearProfile",
        description:
          "Erase the entire stored business profile. This cannot be undone.",
        parameters: { type: "object", properties: {} },
        category: "Memory",
        destructive: true,
      },
      {
        name: "prefillCurrentTool",
        description:
          "Apply the saved business profile to whichever design tool is currently open (Sales Book, Invoice, etc.). Maps fields automatically. Only call after the user confirms they want to pre-fill.",
        parameters: { type: "object", properties: {} },
        category: "Memory",
      },
      {
        name: "addTeamMember",
        description: "Add a team member to the business profile (for signature blocks)",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Team member name" },
            title: { type: "string", description: "Team member title/role" },
          },
          required: ["name"],
        },
        category: "Memory",
      },
      {
        name: "removeTeamMember",
        description: "Remove a team member from the business profile by index (0-based)",
        parameters: {
          type: "object",
          properties: {
            index: { type: "number", description: "Index of the team member to remove" },
          },
          required: ["index"],
        },
        category: "Memory",
        destructive: true,
      },
    ],

    getState: () => {
      const { profile, hasProfile } = useBusinessMemory.getState();
      return {
        hasProfile,
        profileName: profile.profileName,
        populatedFieldCount: getPopulatedFieldCount(profile),
        company: {
          companyName: profile.companyName,
          personName: profile.personName,
          jobTitle: profile.jobTitle,
          address: profile.address,
          phone: profile.phone,
          email: profile.email,
          website: profile.website,
          taxId: profile.taxId ? "****" + profile.taxId.slice(-4) : "",
        },
        hasLogo: !!profile.logoUrl,
        hasBanking: !!(profile.bankName || profile.bankAccountNumber),
        teamMemberCount: profile.teamMembers.length,
        designPreferences: {
          accent: profile.preferredAccentColor,
          font: profile.preferredFontPairing,
          currency: profile.preferredCurrency,
          pageSize: profile.preferredPageSize,
        },
      };
    },

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useBusinessMemory.getState();
      try {
        switch (actionName) {
          case "saveProfile": {
            store.updateProfile(params as Partial<import("@/stores/business-memory").BusinessProfile>);
            const name = (params.companyName as string) || store.profile.companyName || "your business";
            return { success: true, message: `Saved! I'll remember ${name} for future use.` };
          }

          case "saveBanking": {
            store.updateBanking(params as Parameters<typeof store.updateBanking>[0]);
            return { success: true, message: "Banking details saved." };
          }

          case "saveLogo": {
            const logoUrl = params.logoUrl as string;
            if (!logoUrl || !logoUrl.startsWith("data:image/")) {
              return { success: false, message: "Invalid logo — must be a data:image/ URI." };
            }
            store.setLogo(logoUrl);
            return { success: true, message: "Logo saved to your business profile." };
          }

          case "readProfile": {
            const p = store.profile;
            return {
              success: true,
              message: describeProfileForAI(p) || "No business profile saved yet.",
              newState: { profile: p },
            };
          }

          case "clearProfile": {
            store.clearProfile();
            return { success: true, message: "Business profile cleared." };
          }

          case "prefillCurrentTool": {
            if (!store.hasProfile) {
              return { success: false, message: "No business profile saved yet." };
            }

            // Find the current registered tool manifest (not business-memory itself)
            const registry = useChikoActionRegistry.getState();
            let toolManifest: import("@/stores/chiko-actions").ChikoActionManifest | null = null;
            for (const [toolId, manifest] of registry.manifests) {
              if (toolId !== "business-memory") {
                toolManifest = manifest;
                break;
              }
            }

            if (!toolManifest) {
              return { success: false, message: "No tool is open to pre-fill. Navigate to a workspace first." };
            }

            const profile = store.profile;
            let count = 0;

            if (toolManifest.toolId === "sales-book-editor") {
              const mapped = mapProfileToSalesBookBranding(profile);
              if (Object.keys(mapped).length > 0) {
                toolManifest.executeAction("updateBranding", mapped as Record<string, unknown>);
                count = Object.keys(mapped).length;
              }
            } else if (toolManifest.toolId === "invoice-editor") {
              const bizMapped = mapProfileToInvoiceBusinessInfo(profile);
              const payMapped = mapProfileToInvoicePaymentInfo(profile);
              if (Object.keys(bizMapped).length > 0) {
                toolManifest.executeAction("updateBusinessInfo", bizMapped as Record<string, unknown>);
                count += Object.keys(bizMapped).length;
              }
              if (Object.keys(payMapped).length > 0) {
                toolManifest.executeAction("updatePaymentInfo", payMapped as Record<string, unknown>);
                count += Object.keys(payMapped).length;
              }
            } else if (toolManifest.toolId === "resume-editor") {
              const mapped = mapProfileToResumeBasics(profile);
              if (Object.keys(mapped).length > 0) {
                toolManifest.executeAction("updateBasics", mapped as Record<string, unknown>);
                count = Object.keys(mapped).length;
              }
              // Also apply preferred styling if set
              const styleParams: Record<string, unknown> = {};
              if (profile.preferredAccentColor) styleParams.accentColor = profile.preferredAccentColor;
              if (profile.preferredFontPairing) styleParams.fontPairing = profile.preferredFontPairing;
              if (Object.keys(styleParams).length > 0) {
                toolManifest.executeAction("updateStyling", styleParams);
                count += Object.keys(styleParams).length;
              }
            } else {
              return {
                success: false,
                message: `Pre-fill is not yet supported for ${toolManifest.toolName}. Currently works with Sales Book, Invoice, and Resume.`,
              };
            }

            if (count === 0) {
              return { success: false, message: "Business profile has no fields to pre-fill." };
            }
            return { success: true, message: `Pre-filled ${toolManifest.toolName} with ${count} fields from Business Memory.` };
          }

          case "addTeamMember": {
            store.addTeamMember({
              name: (params.name as string) || "",
              title: (params.title as string) || "",
            });
            return { success: true, message: `Added team member: ${params.name}` };
          }

          case "removeTeamMember": {
            const index = params.index as number;
            if (index < 0 || index >= store.profile.teamMembers.length) {
              return { success: false, message: `Invalid team member index: ${index}` };
            }
            const removed = store.profile.teamMembers[index];
            store.removeTeamMember(index);
            return { success: true, message: `Removed team member: ${removed.name}` };
          }

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Action failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };
}
