// =============================================================================
// DMSuite — Contract Designer Action Manifest for Chiko
// Gives Chiko AI full control over every aspect of the Contract Designer:
// document info, parties, clauses, signatures, style, and print settings.
// Follows the exact same architecture as sales-book.ts.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useContractEditor } from "@/stores/contract-editor";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";
import type {
  ContractFormData,
  ContractType,
  ClauseCategory,
  DocumentInfo,
  PartyInfo,
  SignatureConfig,
  StyleConfig,
  PrintConfig,
} from "@/lib/contract/schema";

// ---------------------------------------------------------------------------
// Manifest Options
// ---------------------------------------------------------------------------

export interface ContractManifestOptions {
  /** Ref to the print handler — called by exportPrint action */
  onPrintRef?: React.RefObject<(() => void) | null>;
}

// ---------------------------------------------------------------------------
// Internal getState helper
// ---------------------------------------------------------------------------

function readContractState(): Record<string, unknown> {
  const { form } = useContractEditor.getState();
  return {
    contractType: form.contractType,
    documentInfo: { ...form.documentInfo },
    partyA: { ...form.partyA },
    partyB: { ...form.partyB },
    clauses: form.clauses.map((c) => ({
      id: c.id,
      title: c.title,
      enabled: c.enabled,
      category: c.category,
      contentLength: c.content.length,
    })),
    clauseCount: form.clauses.length,
    enabledClauseCount: form.clauses.filter((c) => c.enabled).length,
    signatureConfig: { ...form.signatureConfig },
    style: { ...form.style },
    printConfig: { ...form.printConfig },
  };
}

// ---------------------------------------------------------------------------
// Manifest Factory
// ---------------------------------------------------------------------------

/** Build the contract action manifest. Call from the workspace component. */
export function createContractManifest(options?: ContractManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "contract-template",
    toolName: "Contract Designer",
    actions: [
      // ── Document Info ────────────────────────────────────────────────────
      {
        name: "updateDocumentInfo",
        description:
          "Update document info: title, subtitle, referenceNumber, effectiveDate, expiryDate, jurisdiction, governingLaw, preambleText, showConfidentialBanner, showTableOfContents.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Document title (e.g. 'Motor Vehicle Sale Agreement')" },
            subtitle: { type: "string", description: "Subtitle or brief description" },
            referenceNumber: { type: "string", description: "Agreement reference number (e.g. REF-2025-001)" },
            effectiveDate: { type: "string", description: "Date the agreement becomes effective (YYYY-MM-DD or formatted)" },
            expiryDate: { type: "string", description: "Expiry or renewal date, if applicable" },
            jurisdiction: { type: "string", description: "Jurisdiction (e.g. 'Republic of Zambia')" },
            governingLaw: { type: "string", description: "Governing law statement (e.g. 'Laws of the Republic of Zambia')" },
            preambleText: { type: "string", description: "Introductory preamble paragraph for the agreement" },
            showConfidentialBanner: { type: "boolean", description: "Show a CONFIDENTIAL banner at the top" },
            showTableOfContents: { type: "boolean", description: "Show a numbered table of contents" },
          },
        },
        category: "Document",
      },

      // ── Party A ──────────────────────────────────────────────────────────
      {
        name: "updatePartyA",
        description:
          "Update Party A (first party — e.g. Service Provider, Employer, Seller, Landlord). Use role to set their title label.",
        parameters: {
          type: "object",
          properties: {
            role: { type: "string", description: "Party label/role (e.g. 'Service Provider', 'Seller', 'Employer')" },
            name: { type: "string", description: "Full legal name of the party or company" },
            address: { type: "string", description: "Street address" },
            city: { type: "string", description: "City" },
            country: { type: "string", description: "Country (default: Zambia)" },
            representative: { type: "string", description: "Name of authorised representative/signatory" },
            representativeTitle: { type: "string", description: "Title of the representative (e.g. Managing Director)" },
            phone: { type: "string", description: "Phone number" },
            email: { type: "string", description: "Email address" },
            taxId: { type: "string", description: "TPIN / Tax ID" },
            registrationNumber: { type: "string", description: "Company registration number" },
          },
        },
        category: "Parties",
      },

      // ── Party B ──────────────────────────────────────────────────────────
      {
        name: "updatePartyB",
        description:
          "Update Party B (second party — e.g. Client, Employee, Buyer, Tenant). Use role to set their title label.",
        parameters: {
          type: "object",
          properties: {
            role: { type: "string", description: "Party label/role (e.g. 'Client', 'Buyer', 'Employee')" },
            name: { type: "string", description: "Full legal name of the party or company" },
            address: { type: "string", description: "Street address" },
            city: { type: "string", description: "City" },
            country: { type: "string", description: "Country (default: Zambia)" },
            representative: { type: "string", description: "Name of authorised representative/signatory" },
            representativeTitle: { type: "string", description: "Title of the representative" },
            phone: { type: "string", description: "Phone number" },
            email: { type: "string", description: "Email address" },
            taxId: { type: "string", description: "TPIN / Tax ID" },
            registrationNumber: { type: "string", description: "Company registration number" },
          },
        },
        category: "Parties",
      },

      // ── Clauses ──────────────────────────────────────────────────────────
      {
        name: "addClause",
        description: "Add a new clause to the contract. Returns the new clause ID.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Clause title (e.g. 'Payment Terms', 'Governing Law')" },
            content: { type: "string", description: "Full clause text — write actual legal language" },
            category: {
              type: "string",
              enum: [
                "definitions", "confidentiality", "non-compete", "payment", "liability",
                "intellectual-property", "termination", "dispute-resolution", "general",
                "indemnification", "force-majeure", "amendments", "scope",
              ],
              description: "Clause category",
            },
          },
          required: ["title", "content", "category"],
        },
        category: "Clauses",
      },
      {
        name: "updateClause",
        description: "Update an existing clause by its ID. You can change the title, content, category, or toggle it on/off.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Clause ID (obtain from readCurrentState)" },
            title: { type: "string", description: "New title" },
            content: { type: "string", description: "New full clause text" },
            category: {
              type: "string",
              enum: [
                "definitions", "confidentiality", "non-compete", "payment", "liability",
                "intellectual-property", "termination", "dispute-resolution", "general",
                "indemnification", "force-majeure", "amendments", "scope",
              ],
            },
            enabled: { type: "boolean", description: "Whether the clause is shown" },
          },
          required: ["id"],
        },
        category: "Clauses",
      },
      {
        name: "toggleClause",
        description: "Toggle a clause on or off by its ID (show/hide from the document).",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Clause ID" },
          },
          required: ["id"],
        },
        category: "Clauses",
      },
      {
        name: "removeClause",
        description: "Permanently remove a clause from the contract by its ID.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Clause ID to remove" },
          },
          required: ["id"],
        },
        category: "Clauses",
        destructive: true,
      },
      {
        name: "reorderClauses",
        description: "Move a clause from one position to another.",
        parameters: {
          type: "object",
          properties: {
            fromIndex: { type: "number", description: "Current 0-based index of the clause" },
            toIndex: { type: "number", description: "New 0-based index for the clause" },
          },
          required: ["fromIndex", "toIndex"],
        },
        category: "Clauses",
      },
      {
        name: "resetClauses",
        description: "Reset all clauses to the defaults for the current contract type. WARNING: Removes any custom clauses.",
        parameters: { type: "object", properties: {} },
        category: "Clauses",
        destructive: true,
      },

      // ── Signature Config ──────────────────────────────────────────────────
      {
        name: "updateSignatureConfig",
        description: "Configure the signature section: show date line, show witness, witness count (1–3), seal placeholder, line style.",
        parameters: {
          type: "object",
          properties: {
            showDate: { type: "boolean", description: "Show a date line under each signature" },
            showWitness: { type: "boolean", description: "Include a witness signature section" },
            witnessCount: { type: "number", description: "Number of witnesses (1, 2, or 3)" },
            showSeal: { type: "boolean", description: "Show a company seal placeholder circle" },
            lineStyle: { type: "string", enum: ["solid", "dotted"], description: "Style of signature lines" },
          },
        },
        category: "Signatures",
      },

      // ── Style ─────────────────────────────────────────────────────────────
      {
        name: "updateStyle",
        description:
          "Change visual design: template preset, accentColor (any hex), fontPairing, headerStyle, pageNumbering, pageNumberPosition.",
        parameters: {
          type: "object",
          properties: {
            template: {
              type: "string",
              enum: [
                "standard-legal", "legal-classic", "government-formal",
                "corporate-blue", "modern-minimal", "corporate-green",
                "elegant-gray", "forest-law", "warm-parchment",
              ],
              description: "Visual template preset",
            },
            accentColor: { type: "string", description: "Accent colour as hex (e.g. #1e40af, #059669). Overrides template colour." },
            fontPairing: {
              type: "string",
              enum: [
                "inter-inter", "playfair-source", "spacegrotesk-inter", "cormorant-proza",
                "montserrat-opensans", "poppins-inter", "raleway-lato", "crimsonpro-worksans",
                "dmserif-dmsans", "ibmplex-ibmplex", "bitter-inter", "jetbrains-inter",
              ],
              description: "Font pairing ID",
            },
            headerStyle: {
              type: "string",
              enum: ["banner", "centered", "left-aligned", "minimal"],
              description: "Header layout style",
            },
            pageNumbering: { type: "boolean", description: "Show page numbers" },
            pageNumberPosition: {
              type: "string",
              enum: ["bottom-center", "bottom-right"],
              description: "Position of page numbers",
            },
            showCoverPage: {
              type: "boolean",
              description: "Show a formal cover page (title, parties, date) as the first page — standard Zambian legal format",
            },
          },
        },
        category: "Style",
      },

      // ── Print Config ──────────────────────────────────────────────────────
      {
        name: "updatePrint",
        description: "Change print settings: page size, page border, watermark.",
        parameters: {
          type: "object",
          properties: {
            pageSize: { type: "string", enum: ["a4", "letter", "legal"], description: "Page paper size" },
            showPageBorder: { type: "boolean", description: "Show a thin border around each page" },
            showWatermark: { type: "boolean", description: "Show a DRAFT watermark across the page" },
            watermarkText: { type: "string", description: "Watermark text (default: DRAFT)" },
          },
        },
        category: "Print",
      },

      // ── Document Type Conversion ──────────────────────────────────────────
      {
        name: "convertToType",
        description:
          "Switch to a different contract type. Replaces clauses with appropriate defaults for the new type.",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "service-agreement",
                "nda",
                "employment-contract",
                "freelance-agreement",
                "partnership-agreement",
                "lease-agreement",
                "tenancy-agreement",
                "sales-agreement",
                "consulting-agreement",
                "motor-vehicle-sale",
                "property-sale-agreement",
                "loan-agreement",
                "shareholders-agreement",
                "supply-agreement",
                "mou",
                "construction-contract",
              ],
              description: "Target contract type",
            },
          },
          required: ["type"],
        },
        category: "Document",
      },

      // ── Reset / Read / Prefill ────────────────────────────────────────────
      {
        name: "resetForm",
        description: "Reset the contract to defaults for the current (or specified) type. WARNING: Erases all current content.",
        parameters: {
          type: "object",
          properties: {
            contractType: {
              type: "string",
              enum: [
                "service-agreement", "nda", "employment-contract", "freelance-agreement",
                "partnership-agreement", "lease-agreement", "tenancy-agreement", "sales-agreement", "consulting-agreement",
                "motor-vehicle-sale", "property-sale-agreement", "loan-agreement",
                "shareholders-agreement", "supply-agreement", "mou", "construction-contract",
              ],
              description: "Contract type to reset to (optional — defaults to current type)",
            },
          },
        },
        category: "Document",
        destructive: true,
      },
      {
        name: "readCurrentState",
        description: "Read all current contract settings — document info, parties, clause list, style, print config. No changes made.",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },
      {
        name: "prefillFromMemory",
        description: "Pre-fill Party A (or both parties) from saved business profile. Confirm with user first.",
        parameters: {
          type: "object",
          properties: {
            applyToParty: {
              type: "string",
              enum: ["partyA", "partyB", "both"],
              description: "Which party to pre-fill (default: partyA)",
            },
          },
        },
        category: "Parties",
      },

      // ── Export ─────────────────────────────────────────────────────────────
      {
        name: "exportPrint",
        description: "Open the browser print dialog for the current contract document.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
    ],

    // ── getState ─────────────────────────────────────────────────────────────
    getState: readContractState,

    // ── executeAction ─────────────────────────────────────────────────────────
    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useContractEditor.getState();
      try {
        switch (actionName) {

          case "updateDocumentInfo":
            store.updateDocumentInfo(params as Partial<DocumentInfo>);
            return { success: true, message: "Document info updated" };

          case "updatePartyA":
            store.updatePartyA(params as Partial<PartyInfo>);
            return { success: true, message: "Party A updated" };

          case "updatePartyB":
            store.updatePartyB(params as Partial<PartyInfo>);
            return { success: true, message: "Party B updated" };

          case "addClause": {
            const id = store.addClause(
              params.title as string,
              params.content as string,
              params.category as ClauseCategory,
            );
            return { success: true, message: `Clause added (id: ${id})` };
          }

          case "updateClause":
            store.updateClause(params.id as string, params as Parameters<typeof store.updateClause>[1]);
            return { success: true, message: `Clause updated` };

          case "toggleClause":
            store.toggleClause(params.id as string);
            return { success: true, message: `Clause toggled` };

          case "removeClause":
            store.removeClause(params.id as string);
            return { success: true, message: `Clause removed` };

          case "reorderClauses":
            store.reorderClauses(params.fromIndex as number, params.toIndex as number);
            return { success: true, message: `Clause moved from ${params.fromIndex} to ${params.toIndex}` };

          case "resetClauses":
            store.resetClauses();
            return { success: true, message: "Clauses reset to defaults" };

          case "updateSignatureConfig":
            store.updateSignatureConfig(params as Partial<SignatureConfig>);
            return { success: true, message: "Signature config updated" };

          case "updateStyle":
            store.updateStyle(params as Partial<StyleConfig>);
            return { success: true, message: "Style updated" };

          case "updatePrint":
            store.updatePrint(params as Partial<PrintConfig>);
            return { success: true, message: "Print settings updated" };

          case "convertToType":
            store.convertToType(params.type as ContractType);
            return { success: true, message: `Converted to ${params.type}` };

          case "resetForm":
            store.resetForm(params.contractType as ContractType | undefined);
            return { success: true, message: `Form reset to defaults` };

          case "readCurrentState":
            return {
              success: true,
              message: "Current contract state",
              newState: readContractState(),
            };

          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) {
              return { success: false, message: "No business profile saved yet. Ask the user to set up their Business Memory first." };
            }
            const profile = memory.profile;
            const partyPatch: Partial<PartyInfo> = {};
            if (profile.companyName) partyPatch.name = profile.companyName;
            if (profile.address) partyPatch.address = profile.address;
            if (profile.phone) partyPatch.phone = profile.phone;
            if (profile.email) partyPatch.email = profile.email;

            const applyTo = (params.applyToParty as string) ?? "partyA";
            let count = 0;
            if (Object.keys(partyPatch).length > 0) {
              if (applyTo === "partyA" || applyTo === "both") {
                store.updatePartyA(partyPatch);
                count++;
              }
              if (applyTo === "partyB" || applyTo === "both") {
                store.updatePartyB(partyPatch);
                count++;
              }
            }
            if (count === 0) {
              return { success: false, message: "Business profile has no matching fields to pre-fill." };
            }
            return { success: true, message: `Pre-filled ${applyTo} from Business Memory (${Object.keys(partyPatch).length} fields).` };
          }

          case "exportPrint": {
            const handler = options?.onPrintRef?.current;
            if (!handler) {
              return { success: false, message: "Export not ready yet — please wait a moment and try again." };
            }
            handler();
            const { form: f } = useContractEditor.getState();
            return { success: true, message: `Print dialog opened for ${f.documentInfo.title}.` };
          }

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return {
          success: false,
          message: `Action failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useContractEditor.getState().form,
    (snapshot) => useContractEditor.getState().setForm(snapshot as ContractFormData),
  );
}
