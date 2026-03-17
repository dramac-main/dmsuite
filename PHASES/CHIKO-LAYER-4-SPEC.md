# Chiko Layer 4 — Business Memory System

## Build Specification

> **Layer:** 4 of 5
> **Depends on:** Layer 1 (Action System) ✅, Layer 2 (File Processing) ✅, Layer 3 (Custom Blocks) ✅
> **Architecture reference:** `PHASES/CHIKO-AGENT-ARCHITECTURE.md` — Section 6
> **Scope:** Persistent local-first business profile store, Chiko integration, auto-fill across tools, field mapping

---

## 1. What This Layer Does

Layer 4 gives Chiko and the platform a **persistent memory** — a localStorage-backed profile store that remembers the user's business details across sessions and tools. Today, every time a user opens a Sales Book, Invoice, Resume, or Business Card workspace, they must re-enter their company name, address, phone, email, banking details, logo, and so on from scratch. Layer 4 eliminates this.

**After Layer 4, the user experience becomes:**

1. User opens Sales Book workspace and enters their company info.
2. Chiko says: "Want me to remember Dramac Solutions for next time?"
3. User confirms → details stored in Business Memory.
4. Next time the user opens an Invoice or Business Card workspace, Chiko says: "I remember Dramac Solutions — want me to pre-fill your company details?"
5. User confirms → fields populated instantly via Layer 1 actions.
6. If the user uploads a document (Layer 2) with business info detected, Chiko offers to save/update the profile.
7. User can edit, view, and clear their stored profile at any time through Chiko or a dedicated UI panel.

---

## 2. Canonical Business Profile Schema

The Business Memory must be a **superset** of all business-related fields across every tool. Each tool uses a subset and maps canonical field names to its own schema.

### 2.1 Company Information

| Canonical Field | Type | Description | Used By |
|---|---|---|---|
| `companyName` | `string` | Business / company name | Sales Book (`name`), Invoice (`businessInfo.name`), Business Card (`company`) |
| `personName` | `string` | Owner / contact person name | Resume (`basics.name`), Business Card (`name`) |
| `jobTitle` | `string` | Person's title / role | Business Card (`title`), Resume (`basics.headline`) |
| `tagline` | `string` | Company slogan | Sales Book (`tagline`), Business Card (`tagline`) |
| `address` | `string` | Physical address | Sales Book, Invoice, Business Card, Resume (`location`) |
| `phone` | `string` | Phone number | All tools |
| `email` | `string` | Email address | All tools |
| `website` | `string` | Website URL | Sales Book, Invoice, Business Card, Resume (`basics.website.url`) |
| `taxId` | `string` | TPIN / Tax ID / VAT number | Sales Book, Invoice |
| `logoUrl` | `string` | Company logo (base64 data URI) | Sales Book, Invoice, Business Card (via wizard) |

### 2.2 Banking Details

| Canonical Field | Type | Description | Sales Book Field | Invoice Field |
|---|---|---|---|---|
| `bankName` | `string` | Bank name | `bankName` | `paymentInfo.bankName` |
| `bankAccountName` | `string` | Account holder name | `bankAccountName` | `paymentInfo.accountName` |
| `bankAccountNumber` | `string` | Account number | `bankAccount` | `paymentInfo.accountNumber` |
| `bankBranch` | `string` | Branch name | `bankBranch` | — |
| `bankBranchCode` | `string` | Branch code | `bankBranchCode` | — |
| `bankSwiftBic` | `string` | SWIFT/BIC code | `bankSwiftBic` | `paymentInfo.swiftCode` |
| `bankIban` | `string` | IBAN | `bankIban` | — |
| `bankSortCode` | `string` | Sort / routing code | `bankSortCode` | `paymentInfo.routingNumber` |
| `bankReference` | `string` | Default payment reference | `bankReference` | — |
| `bankCustomLabel` | `string` | Custom banking field label | `bankCustomLabel` | — |
| `bankCustomValue` | `string` | Custom banking field value | `bankCustomValue` | — |

### 2.3 Social & Online Presence (optional)

| Canonical Field | Type | Description | Used By |
|---|---|---|---|
| `linkedin` | `string` | LinkedIn URL | Business Card, Resume |
| `twitter` | `string` | X / Twitter handle | Business Card |
| `instagram` | `string` | Instagram handle | Business Card |

### 2.4 Design Preferences (optional)

| Canonical Field | Type | Description |
|---|---|---|
| `preferredAccentColor` | `string` | Hex color (e.g., "#2563eb") |
| `preferredFontPairing` | `string` | Font pairing ID |
| `preferredCurrency` | `string` | Currency code (e.g., "ZMW") |
| `preferredCurrencySymbol` | `string` | Currency symbol (e.g., "K") |
| `preferredPageSize` | `string` | Default page size (e.g., "a4") |

### 2.5 Team Members (optional, for multi-signatory documents)

| Field | Type | Description |
|---|---|---|
| `teamMembers` | `Array<{ name: string; title: string }>` | Named signatories for signature blocks |

### 2.6 Metadata

| Field | Type | Description |
|---|---|---|
| `profileId` | `string` | UUID, generated once on first save |
| `profileName` | `string` | User-chosen label (e.g., "Dramac Solutions", "My Freelance") |
| `createdAt` | `number` | Unix timestamp of first creation |
| `updatedAt` | `number` | Unix timestamp of last modification |

**Total: 30 canonical fields** (10 company + 11 banking + 3 social + 5 design + 1 team array).

---

## 3. TypeScript Contract

The store interface uses a flat structure with grouped field helpers. No Zod validation is needed — this is simple key-value persistence.

### 3.1 BusinessProfile Interface

```
interface BusinessProfile {
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
```

### 3.2 Store Interface

```
interface BusinessMemoryState {
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
```

---

## 4. File Map

### 4.1 New Files (3)

| # | File | Purpose | Approx Size |
|---|---|---|---|
| 1 | `src/stores/business-memory.ts` | Zustand persist store — the canonical profile | ~200 lines |
| 2 | `src/lib/chiko/field-mapper.ts` | Maps canonical fields to/from each tool's schema | ~180 lines |
| 3 | `src/lib/chiko/manifests/business-memory.ts` | Chiko manifest — 8+ actions for reading/writing the profile | ~250 lines |

### 4.2 Modified Files (5)

| # | File | What Changes |
|---|---|---|
| 4 | `src/app/api/chiko/route.ts` | Inject Business Memory profile into system prompt as a new section |
| 5 | `src/components/Chiko/ChikoAssistant.tsx` | Send `businessProfile` in API request body; register business-memory manifest globally |
| 6 | `src/lib/chiko/manifests/index.ts` | Export the new business-memory manifest |
| 7 | `src/lib/chiko/manifests/sales-book.ts` | Add `prefillFromMemory` action |
| 8 | `src/lib/chiko/manifests/invoice.ts` | Add `prefillFromMemory` action |

---

## 5. Detailed File Specifications

### 5.1 `src/stores/business-memory.ts` — The Profile Store

**Pattern:** `create<State>()(persist((set, get) => ({...}), { name: "dmsuite-business-memory" }))`

This follows the identical pattern used by `preferences.ts`, `chiko.ts`, and all other persisted stores in the codebase. No immer, no temporal — this is simple key-value data.

**localStorage key:** `dmsuite-business-memory`

**Default profile:** All strings default to `""`, `teamMembers` defaults to `[]`, `hasProfile` defaults to `false`, `profileId` is generated via `crypto.randomUUID()` on first save.

**Key behaviors:**

- `updateProfile(patch)` — Merges partial fields into `profile`, sets `updatedAt` to `Date.now()`. If `hasProfile` was `false` and any non-empty field is being set, flip `hasProfile` to `true` and set `createdAt`.
- `updateBanking(patch)` — Convenience wrapper that calls `updateProfile` with only banking-prefixed keys.
- `updateSocial(patch)` — Convenience wrapper for `linkedin`, `twitter`, `instagram`.
- `updateDesignPreferences(patch)` — Convenience wrapper for preferred color, font, currency, page size.
- `setLogo(dataUri)` — Sets `logoUrl` field. Must validate that the string starts with `data:image/` before storing.
- `clearLogo()` — Sets `logoUrl` to `""`.
- `clearProfile()` — Resets entire profile to defaults, `hasProfile` to `false`. Keeps the same `profileId`.
- `importFromFields(fields)` — Takes a `Record<string, string | undefined>` (shaped like `DetectedBusinessFields` from Layer 2) and maps detected field names to canonical field names. E.g., `fields.companyName` → `profile.companyName`, `fields.bankAccount` → `profile.bankAccountNumber`, `fields.taxId` → `profile.taxId`. Only sets fields that have a non-empty value in the input.
- `getCompanyFields()` — Returns an object with only the populated company/contact fields (filters out empty strings).
- `getBankingFields()` — Returns only populated banking fields.
- `getProfileSummary()` — Returns a one-line string like `"Dramac Solutions — dramac@email.com — +260 977 123 456"` for Chiko's context display. Returns empty string if `hasProfile` is `false`.
- `isFieldPopulated(field)` — Returns `true` if the specified field has a non-empty string value (or non-empty array for `teamMembers`).

**Partialize:** Persist the full `profile` object and `hasProfile` flag. Action methods are not persisted (Zustand handles this automatically).

**Export:** `export const useBusinessMemory = create<BusinessMemoryState>()(persist(...))`

Also export a synchronous snapshot reader for use outside React:
```
export function getBusinessProfile(): BusinessProfile {
  return useBusinessMemory.getState().profile;
}
```

### 5.2 `src/lib/chiko/field-mapper.ts` — Cross-Tool Field Mapping

This module translates between the canonical Business Memory schema and each tool's specific field names. It contains no state — pure functions only.

**Exported functions:**

#### `mapProfileToSalesBookBranding(profile: BusinessProfile): Partial<CompanyBranding>`

Maps canonical fields to Sales Book's `CompanyBranding` schema:

| Canonical | Sales Book |
|---|---|
| `companyName` | `name` |
| `tagline` | `tagline` |
| `address` | `address` |
| `phone` | `phone` |
| `email` | `email` |
| `website` | `website` |
| `taxId` | `taxId` |
| `logoUrl` | `logoUrl` |
| `bankName` | `bankName` |
| `bankAccountName` | `bankAccountName` |
| `bankAccountNumber` | `bankAccount` |
| `bankBranch` | `bankBranch` |
| `bankBranchCode` | `bankBranchCode` |
| `bankSwiftBic` | `bankSwiftBic` |
| `bankIban` | `bankIban` |
| `bankSortCode` | `bankSortCode` |
| `bankReference` | `bankReference` |
| `bankCustomLabel` | `bankCustomLabel` |
| `bankCustomValue` | `bankCustomValue` |

Returns only populated fields (filters out empty strings). This way, calling `updateBranding(mapped)` only overwrites fields that Business Memory has data for.

#### `mapProfileToInvoiceBusinessInfo(profile: BusinessProfile): Partial<BusinessInfo>`

Maps to Invoice's `businessInfoSchema`:

| Canonical | Invoice |
|---|---|
| `companyName` | `name` |
| `address` | `address` |
| `email` | `email` |
| `phone` | `phone` |
| `website` | `website` |
| `taxId` | `taxId` |
| `logoUrl` | `logoUrl` |

#### `mapProfileToInvoicePaymentInfo(profile: BusinessProfile): Partial<PaymentInfo>`

Maps to Invoice's `paymentInfoSchema`:

| Canonical | Invoice |
|---|---|
| `bankName` | `bankName` |
| `bankAccountName` | `accountName` |
| `bankAccountNumber` | `accountNumber` |
| `bankSortCode` | `routingNumber` |
| `bankSwiftBic` | `swiftCode` |

#### `mapProfileToBusinessCardDetails(profile: BusinessProfile): Partial<UserDetails>`

Maps to Business Card Wizard's `UserDetails`:

| Canonical | Business Card |
|---|---|
| `personName` | `name` |
| `jobTitle` | `title` |
| `companyName` | `company` |
| `tagline` | `tagline` |
| `email` | `email` |
| `phone` | `phone` |
| `website` | `website` |
| `address` | `address` |
| `linkedin` | `linkedin` |
| `twitter` | `twitter` |
| `instagram` | `instagram` |

#### `mapProfileToResumeBasics(profile: BusinessProfile): Partial<ResumeBasics>`

Maps to Resume's `basics` schema:

| Canonical | Resume |
|---|---|
| `personName` | `name` |
| `jobTitle` | `headline` |
| `email` | `email` |
| `phone` | `phone` |
| `address` | `location` |
| `website` | `website.url` |
| `linkedin` | `linkedin` |

Note: `website` is a nested object in Resume (`{ url, label }`). The mapper sets `website: { url: profile.website, label: "Website" }` only when `website` is non-empty.

#### `mapDetectedFieldsToProfile(detected: DetectedBusinessFields): Partial<BusinessProfile>`

Maps the output of Layer 2's field detector to canonical profile fields:

| Detected Field | Canonical |
|---|---|
| `companyName` | `companyName` |
| `phone` | `phone` |
| `email` | `email` |
| `address` | `address` |
| `website` | `website` |
| `taxId` | `taxId` |
| `bankName` | `bankName` |
| `bankAccount` | `bankAccountNumber` |
| `bankBranch` | `bankBranch` |

All mapping functions follow the same pattern:
1. Build the output object.
2. Only include fields where the source value is a non-empty string.
3. Return `Partial<TargetType>` — never set fields to empty string.

#### `getPopulatedFieldCount(profile: BusinessProfile): number`

Returns the count of non-empty fields (excluding metadata). Used by Chiko to decide whether to offer pre-fill.

#### `describeProfileForAI(profile: BusinessProfile): string`

Returns a multi-line human-readable summary of the stored profile for injection into the system prompt. E.g.:
```
Company: Dramac Solutions
Tagline: AI-Powered Creative Studio
Address: Plot 42 Independence Ave, Lusaka
Phone: +260 977 123 456
Email: info@dramac.com
...
Banking: Zanaco Bank, Acc: 1234567890, Branch: Lusaka Main
```
Only includes populated fields. Returns `"No business profile saved yet."` if `hasProfile` is false.

### 5.3 `src/lib/chiko/manifests/business-memory.ts` — The Business Memory Manifest

This manifest is **global** — unlike tool manifests that register/unregister with page navigation, the Business Memory manifest is always available whenever Chiko is open. It registers once from ChikoAssistant and never unregisters.

**Manifest structure:**

```
toolId: "business-memory"
toolName: "Business Memory"
```

**Actions (8):**

1. **`saveProfile`** — Save/update business profile fields
   - Parameters: All 30 canonical fields (all optional)
   - Calls `updateProfile(params)` on the store
   - Response: `"Saved! I'll remember [companyName] for future use."`

2. **`saveBanking`** — Save/update banking details
   - Parameters: 11 banking fields (all optional)
   - Calls `updateBanking(params)`
   - Response: `"Banking details saved."`

3. **`saveLogo`** — Store a logo in Business Memory
   - Parameters: `logoUrl` (string, data URI)
   - Calls `setLogo(params.logoUrl)`
   - Response: `"Logo saved to your business profile."`

4. **`readProfile`** — Read the stored business profile
   - Parameters: none
   - Returns: the full profile via `getState()`
   - This is a read-only action — no mutations

5. **`clearProfile`** — Erase the entire stored profile
   - Parameters: none
   - Calls `clearProfile()`
   - Marked as `destructive: true`
   - Response: `"Business profile cleared."`

6. **`prefillCurrentTool`** — Apply Business Memory to whichever tool is currently open
   - Parameters: none
   - Reads the current tool from `useChikoActionRegistry.getState().manifests` (iterates to find any registered tool manifest)
   - Uses the field-mapper to get the appropriate mapping for that tool
   - Executes the tool's `updateBranding` / `updateBusinessInfo` / equivalent action with the mapped fields
   - Response: `"Pre-filled [toolName] with your saved profile."`
   - If no tool is registered: `"No tool is open to pre-fill. Navigate to a workspace first."`

7. **`addTeamMember`** — Add a team member (name + title)
   - Parameters: `name` (required), `title` (optional)
   - Calls store's `addTeamMember({ name, title })`

8. **`removeTeamMember`** — Remove a team member by index
   - Parameters: `index` (required, number)
   - Calls store's `removeTeamMember(index)`
   - Marked as `destructive: true`

**`getState()` implementation:**

```
Returns: {
  hasProfile: boolean,
  profileName: string,
  populatedFieldCount: number,
  company: { companyName, personName, jobTitle, address, phone, email, website, taxId },
  hasLogo: boolean,
  hasBanking: boolean,
  teamMemberCount: number,
  designPreferences: { accent, font, currency, pageSize },
}
```

This is a **summary** — it does NOT return the full profile in getState (no raw logo data URIs, no full banking details in the tool state payload). The AI gets enough context to decide whether to offer pre-fill. When it needs full data, it calls `readProfile`.

### 5.4 `src/app/api/chiko/route.ts` — System Prompt Enhancement

**New section injected before the context section:**

After the base `CHIKO_SYSTEM_PROMPT` and before `## Current User Context`, add:

```
## User's Business Profile
{output of describeProfileForAI(profile)}

Instructions for Business Memory:
- When the user provides business info (name, phone, email, etc.), offer to save it: "Want me to remember this for future use?"
- When a user opens a design tool and their profile has data, proactively offer: "I remember [companyName] — want me to pre-fill your details?"
- NEVER auto-fill without asking — always get confirmation first
- When file extraction (Layer 2) detects business fields, compare with stored profile and offer to update any new/different values
- The user can say "forget my info" or "clear my profile" to erase stored data
- Business profile is stored locally on this device only — reassure users about privacy
- If the user asks "what do you know about me/my business?" — read and present the stored profile
```

**Implementation detail:**

The `businessProfile` summary string is sent from the client (ChikoAssistant) in the request body. The server does NOT read localStorage (it has no access). The client reads `describeProfileForAI()` and includes it in the POST payload.

**Request body addition:**
```
{ messages, context, actions, toolState, fileContext, businessProfile?: string }
```

The API route appends the profile section only when `businessProfile` is a non-empty string.

### 5.5 `src/components/Chiko/ChikoAssistant.tsx` — Client Integration

**Changes:**

1. **Import** `useBusinessMemory` from `@/stores/business-memory` and `describeProfileForAI` from `@/lib/chiko/field-mapper`.

2. **Import** `createBusinessMemoryManifest` from `@/lib/chiko/manifests`.

3. **Register the Business Memory manifest globally.** Add a `useEffect` that registers the manifest on mount and never unregisters (it is always available). This is different from tool manifests which come and go. Place it near the top of the component, after existing store subscriptions.

   ```
   useEffect(() => {
     const registry = useChikoActionRegistry.getState();
     registry.register(createBusinessMemoryManifest());
     // intentionally no cleanup — business memory is always available
   }, []);
   ```

4. **In `sendMessage()`**, add the business profile summary to the API payload:
   - Read `useBusinessMemory.getState()` to get the profile.
   - Call `describeProfileForAI(profile)` to get the summary string.
   - Include `businessProfile: summary` in the request body (only when non-empty).

5. **No UI changes to ChikoAssistant itself** — all interaction happens via natural language and Chiko's existing action execution pipeline. The user says "remember my company" → Chiko calls `saveProfile` → confirmation shown via the standard action result flow.

### 5.6 `src/lib/chiko/manifests/index.ts` — Barrel Export Update

Add:
```
export { createBusinessMemoryManifest } from "./business-memory";
```

### 5.7 `src/lib/chiko/manifests/sales-book.ts` — Add prefillFromMemory Action

Add one new action to the existing manifest's `actions` array:

```
{
  name: "prefillFromMemory",
  description: "Pre-fill the Sales Book with the user's saved business profile (company name, address, phone, email, banking details, logo). Only call this after the user confirms they want to pre-fill.",
  parameters: { type: "object", properties: {} },
  category: "Branding",
}
```

In `executeAction`, add the case:
```
case "prefillFromMemory": {
  const memory = useBusinessMemory.getState();
  if (!memory.hasProfile) {
    return { success: false, message: "No business profile saved yet." };
  }
  const mapped = mapProfileToSalesBookBranding(memory.profile);
  if (Object.keys(mapped).length === 0) {
    return { success: false, message: "Business profile has no fields to pre-fill." };
  }
  store.updateBranding(mapped);
  return { success: true, message: `Pre-filled branding with ${Object.keys(mapped).length} fields from Business Memory.` };
}
```

**Import additions:** `useBusinessMemory` from store, `mapProfileToSalesBookBranding` from field-mapper.

### 5.8 `src/lib/chiko/manifests/invoice.ts` — Add prefillFromMemory Action

Same pattern as Sales Book but maps to both `businessInfo` and `paymentInfo`:

```
{
  name: "prefillFromMemory",
  description: "Pre-fill the Invoice with the user's saved business profile (company info, banking/payment details, logo). Only call this after the user confirms.",
  parameters: { type: "object", properties: {} },
  category: "Business Info",
}
```

In `executeAction`:
```
case "prefillFromMemory": {
  const memory = useBusinessMemory.getState();
  if (!memory.hasProfile) {
    return { success: false, message: "No business profile saved yet." };
  }
  const bizMapped = mapProfileToInvoiceBusinessInfo(memory.profile);
  const payMapped = mapProfileToInvoicePaymentInfo(memory.profile);
  let count = 0;
  if (Object.keys(bizMapped).length > 0) {
    store.updateBusinessInfo(bizMapped);
    count += Object.keys(bizMapped).length;
  }
  if (Object.keys(payMapped).length > 0) {
    store.updatePaymentInfo(payMapped);
    count += Object.keys(payMapped).length;
  }
  if (count === 0) {
    return { success: false, message: "Business profile has no fields to pre-fill." };
  }
  return { success: true, message: `Pre-filled ${count} fields from Business Memory.` };
}
```

**Import additions:** `useBusinessMemory`, `mapProfileToInvoiceBusinessInfo`, `mapProfileToInvoicePaymentInfo`.

---

## 6. Data Flows

### 6.1 Save — User Provides Business Info via Conversation

```
User: "My company is Dramac Solutions, phone +260 977 123 456, email info@dramac.com"

→ Chiko API recognizes business info
→ AI decides to call business_memory__saveProfile({ companyName: "Dramac Solutions", phone: "+260 977 123 456", email: "info@dramac.com" })
→ Stream sends __CHIKO_ACTION__ event
→ ChikoAssistant executes action
→ useBusinessMemory.updateProfile() called
→ Profile saved to localStorage
→ Chiko responds: "Saved! I'll remember Dramac Solutions for next time. ✨"
```

### 6.2 Pre-fill — User Opens a New Tool

```
User navigates to Sales Book workspace
→ Sales-book manifest registers (Layer 1)
→ Business Memory manifest already registered (global)
→ User types "fill in my company details" (or Chiko proactively offers)
→ AI sees business profile in system prompt (has companyName, phone, email, ...)
→ AI calls sales_book_editor__prefillFromMemory({})
→ Manifest reads useBusinessMemory → maps to CompanyBranding → calls store.updateBranding(mapped)
→ Sales Book form updates instantly
→ Chiko responds: "Done! Pre-filled 15 fields from your saved profile."
```

### 6.3 Save from File Upload (Layer 2 Integration)

```
User uploads a PDF with company letterhead
→ Layer 2 extracts text, field-detector finds: { companyName: "Dramac Solutions", email: "info@dramac.com", phone: "+260 977 123 456", bankName: "Zanaco" }
→ Chiko presents extracted info and says: "I found business details in your document. Want me to save these to your profile?"
→ User confirms
→ AI calls business_memory__saveProfile(mapped detected fields)
→ Store merges into existing profile (only new/different values overwrite)
→ Chiko confirms what was saved/updated
```

### 6.4 Read — User Asks About Their Profile

```
User: "What business info do you have saved?"

→ AI calls business_memory__readProfile({})
→ Manifest returns full profile data
→ AI formats and presents: "Here's what I have for Dramac Solutions: ..."
```

### 6.5 Clear — User Asks to Forget

```
User: "Forget my business info" or "Clear my profile"

→ AI calls business_memory__clearProfile({})
→ Action marked as destructive → ChikoAssistant shows confirmation dialog
→ User confirms → profile cleared
→ Chiko: "Done, I've forgotten your business details. Your data never left this device."
```

### 6.6 Update from Diff — File Upload Detects Changes

```
User already has a stored profile (companyName: "Dramac Solutions", phone: "+260 977 123 456")
User uploads a new document where phone is "+260 977 999 888"

→ Chiko sees the difference between stored profile and detected fields
→ "I notice the phone number in your document (+260 977 999 888) is different from what I have saved (+260 977 123 456). Want me to update it?"
→ User confirms → AI calls saveProfile({ phone: "+260 977 999 888" })
→ Only the changed field is updated
```

---

## 7. System Prompt Integration Details

### 7.1 Profile Injection

The client reads the profile and generates a summary string. This string is sent in the POST request alongside `messages`, `context`, `actions`, `toolState`, and `fileContext`.

On the server, the route appends:

```
\n\n## User's Business Profile
{businessProfile string}

Instructions for Business Memory:
- When the user mentions business details, offer to save them
- When a design tool is open and you have saved data, proactively offer to pre-fill
- NEVER auto-fill without explicit user confirmation
- Compare uploaded file fields with stored profile — offer to update differences
- Profile is local-only — reassure about privacy if asked
- Respond to "what do you know about me" with the stored profile
- If no profile: "I don't have any business details saved yet. Tell me about your business!"
```

### 7.2 Token Budget

The profile summary is compact — typically 200-400 characters for a fully populated profile. This adds negligible token cost (~50-100 tokens) to each API call.

The `getState()` summary for the AI tool state is even smaller — just boolean flags and counts, not raw data.

---

## 8. Edge Cases and Boundary Conditions

### 8.1 Empty Profile

- `hasProfile` is `false` → no profile section in system prompt
- `prefillFromMemory` on any tool → returns `{ success: false, message: "No business profile saved yet." }`
- `getProfileSummary()` → `""`
- `describeProfileForAI()` → `"No business profile saved yet."`

### 8.2 Partial Profile

- Only some fields populated (e.g., company name and email but no banking)
- Pre-fill only maps the fields that exist — others left unchanged in the target tool
- Summary shows only populated fields
- `getPopulatedFieldCount()` returns the actual count for Chiko to communicate

### 8.3 Logo Storage

- Logos are stored as base64 data URIs in localStorage
- Maximum recommended logo size: ~500KB encoded (this is already enforced by Layer 2's 2MB file cap + resize/thumbnail pipeline)
- The `setLogo()` action validates: must start with `data:image/` — reject anything else
- Logo from Business Memory uses the same data URI format as direct logo uploads

### 8.4 Multiple Profiles

- **V1 supports exactly 1 profile** — single-business users (95%+ of the target audience)
- Multi-profile is a future enhancement (beyond Layer 4 scope)
- `profileName` field exists for forward-compatibility — defaults to `companyName` if not explicitly set

### 8.5 localStorage Limits

- Typical browser localStorage limit: 5-10MB
- A fully populated profile with logo occupies ~100-500KB
- Well within limits — no special handling needed
- If `localStorage.setItem()` throws (quota exceeded), Zustand's persist middleware silently handles the error. The in-memory state still works; persistence will retry on next mutation.

### 8.6 Profile Conflicts

- User has stored "Dramac Solutions" but manually types "Dramac Ltd" into a Sales Book
- Business Memory does NOT auto-sync from tools → manual edits in a tool do not mutate the profile
- Only explicit "save" via Chiko or the manifest overwrites the profile
- This is intentional: users may have multiple businesses or work on client projects

---

## 9. Registration Strategy

### 9.1 Business Memory Manifest — Global, Always-On

Unlike tool manifests (which register on workspace mount / unregister on unmount), the Business Memory manifest is **always registered** while Chiko is mounted. This is because:

1. The user might want to save/read their profile from ANY page (dashboard, tool, etc.)
2. The profile data is used to inject context into every Chiko conversation
3. Pre-fill is triggered from the Business Memory manifest — it needs access to look up the current tool

**Registration point:** `ChikoAssistant.tsx` — single `useEffect` on mount, no cleanup.

### 9.2 Tool-Specific prefillFromMemory — Per-Workspace

Each tool manifest that supports pre-fill adds its own `prefillFromMemory` action. This is better than having a single global prefill because:

1. Each tool knows its own field names (no ambiguity)
2. The mapping logic is in field-mapper.ts but execution is in the tool manifest
3. The AI knows which tools support pre-fill by checking available actions
4. Future tools add their own mapping without touching the global manifest

---

## 10. What This Layer Does NOT Do

1. **No UI panel for Business Memory** — All interaction is through Chiko's natural language. A visual settings panel for the profile can be added later but is not part of this layer.
2. **No auto-detection prompting** — Chiko does not proactively scan the current tool's fields and compare with memory on page load. The AI uses the profile in system prompt context and offers pre-fill when contextually appropriate (user asks, new tool opened, etc.)
3. **No multi-profile support** — V1 is single-profile. The schema is ready for expansion (profileId, profileName) but the store holds exactly one profile.
4. **No cloud sync** — All data stays in localStorage. No server endpoints for profile storage.
5. **No schema migration** — localStorage version migration can be added later if the schema changes. For V1, the schema is stable.
6. **No Business Card / Resume workspace registration** — These workspaces currently do not register Chiko manifests at all. Adding manifest registration to them is a future task. The Business Memory system is ready for them (mappers exist) but won't physically pre-fill until those workspaces register their manifests.

---

## 11. Acceptance Criteria

### 11.1 Store

- [ ] `dmsuite-business-memory` appears in localStorage after first save
- [ ] `updateProfile({ companyName: "Test Co" })` persists across page refresh
- [ ] `clearProfile()` resets all fields and sets `hasProfile` to false
- [ ] `importFromFields()` correctly maps Layer 2 detected fields to canonical fields
- [ ] `getProfileSummary()` returns a readable one-liner for populated profiles
- [ ] `getProfileSummary()` returns empty string when no profile exists
- [ ] `setLogo()` rejects values that don't start with `data:image/`
- [ ] `addTeamMember` / `removeTeamMember` / `updateTeamMember` work correctly
- [ ] Store does not persist method functions (only data)

### 11.2 Field Mapper

- [ ] `mapProfileToSalesBookBranding()` produces correct field names (e.g., `bankAccount` not `bankAccountNumber`)
- [ ] `mapProfileToInvoiceBusinessInfo()` produces correct field names
- [ ] `mapProfileToInvoicePaymentInfo()` maps `bankSortCode` → `routingNumber` and `bankSwiftBic` → `swiftCode`
- [ ] `mapProfileToBusinessCardDetails()` maps `companyName` → `company` and `personName` → `name`
- [ ] `mapProfileToResumeBasics()` maps `address` → `location` and `website` → `{ url, label }`
- [ ] `mapDetectedFieldsToProfile()` maps `bankAccount` → `bankAccountNumber`
- [ ] All mappers exclude empty strings from output
- [ ] `describeProfileForAI()` returns `"No business profile saved yet."` for empty profiles
- [ ] `describeProfileForAI()` lists only populated fields

### 11.3 Manifest

- [ ] Business Memory manifest has toolId `"business-memory"`, toolName `"Business Memory"`
- [ ] `saveProfile` action updates the store and returns success message with company name
- [ ] `readProfile` action returns profile data without mutations
- [ ] `clearProfile` is marked `destructive: true`
- [ ] `prefillCurrentTool` finds the registered tool manifest and maps fields correctly
- [ ] `prefillCurrentTool` returns failure message when no tool is open
- [ ] `getState()` returns summary (booleans + counts), not raw data

### 11.4 API Integration

- [ ] Business profile summary appears in system prompt when profile is populated
- [ ] Business Memory instructions section is appended to system prompt
- [ ] Profile summary is NOT in system prompt when no profile exists
- [ ] `businessProfile` field is accepted in POST body
- [ ] No server-side localStorage access (summary comes from client)

### 11.5 Client Integration

- [ ] Business Memory manifest registers globally in ChikoAssistant on mount
- [ ] `businessProfile` summary is included in every API request
- [ ] All 8 manifest actions are executable via Chiko's action pipeline
- [ ] `clearProfile` triggers the destructive action confirmation dialog

### 11.6 Tool Pre-fill

- [ ] Sales Book `prefillFromMemory` maps and applies all 19 branding fields
- [ ] Invoice `prefillFromMemory` maps business info (7 fields) AND payment info (5 fields) in one action
- [ ] Pre-fill only overwrites fields that Business Memory has data for — others untouched
- [ ] Pre-fill returns the count of fields applied

### 11.7 Build

- [ ] `npx tsc --noEmit` — zero errors
- [ ] No circular imports between business-memory store, field-mapper, manifests
- [ ] All imports resolve correctly

---

## 12. Import Dependency Graph

```
src/stores/business-memory.ts
  └── (no imports from lib/chiko — standalone store)

src/lib/chiko/field-mapper.ts
  ├── src/stores/business-memory.ts (BusinessProfile type)
  ├── src/lib/sales-book/schema.ts (CompanyBranding type)
  ├── src/lib/invoice/schema.ts (BusinessInfo, PaymentInfo types)
  └── src/lib/chiko/extractors/field-detector.ts (DetectedBusinessFields type)

src/lib/chiko/manifests/business-memory.ts
  ├── src/stores/business-memory.ts (useBusinessMemory)
  ├── src/stores/chiko-actions.ts (ChikoActionManifest, ChikoActionResult, useChikoActionRegistry)
  └── src/lib/chiko/field-mapper.ts (describeProfileForAI, getPopulatedFieldCount, mapping functions)

src/lib/chiko/manifests/sales-book.ts (modified)
  ├── (existing imports)
  ├── src/stores/business-memory.ts (useBusinessMemory)
  └── src/lib/chiko/field-mapper.ts (mapProfileToSalesBookBranding)

src/lib/chiko/manifests/invoice.ts (modified)
  ├── (existing imports)
  ├── src/stores/business-memory.ts (useBusinessMemory)
  └── src/lib/chiko/field-mapper.ts (mapProfileToInvoiceBusinessInfo, mapProfileToInvoicePaymentInfo)

src/components/Chiko/ChikoAssistant.tsx (modified)
  ├── (existing imports)
  ├── src/stores/business-memory.ts (useBusinessMemory)
  ├── src/lib/chiko/field-mapper.ts (describeProfileForAI)
  └── src/lib/chiko/manifests (createBusinessMemoryManifest)

src/app/api/chiko/route.ts (modified)
  └── (no new imports — receives businessProfile as string in request body)
```

No circular dependencies. The store is at the bottom (no imports from chiko lib). The field-mapper reads types only. Manifests import the store and mapper. ChikoAssistant imports everything.

---

## 13. Risk Considerations

### 13.1 Logo Size in localStorage

Base64 data URIs for logos can be large (200-500KB). Combined with other stored data, this should stay well under the 5-10MB localStorage limit. If needed in the future, logos could be stored in IndexedDB instead, but this is out of scope for V1.

### 13.2 Privacy

All data is local. The profile is included in API calls only as a text summary (never raw logo data). The system prompt summary contains names and contact details but no sensitive financial data (no full bank account numbers in the AI context — the summary uses `"Acc: ****7890"` masking for bank account numbers).

Implementation detail for `describeProfileForAI()`: mask the last 4 digits of bank account numbers visible, mask the rest. E.g., `bankAccountNumber: "1234567890"` → display as `"Acc: ****7890"`. TPIN/tax ID similarly masked: `"TPIN: ****5678"`.

### 13.3 Stale Profile

User changes their phone number in real life but forgets to update Business Memory. Every pre-fill will use the old number. Mitigation: Chiko can spot differences when the user types new data into a tool ("I notice your phone here is different from what I have saved — want me to update my records?"). This is AI behavior driven by the system prompt instructions, not code logic.

### 13.4 sessionStorage Wizard Stores

Business Card and Resume wizard stores use sessionStorage (wiped on tab close). Business Memory uses localStorage (persistent). These are independent — Business Memory does NOT replace wizard stores. It supplements them by providing initial data that wizards can use.

---

## 14. Summary

| Aspect | Detail |
|---|---|
| **New files** | 3 (store, field-mapper, manifest) |
| **Modified files** | 5 (API route, ChikoAssistant, barrel export, 2 tool manifests) |
| **New dependencies** | 0 (uses only existing Zustand + persist) |
| **localStorage key** | `dmsuite-business-memory` |
| **Profile fields** | 30 canonical fields across 5 groups |
| **Manifest actions** | 8 (save, saveBanking, saveLogo, read, clear, prefillCurrentTool, addTeamMember, removeTeamMember) |
| **Tool pre-fill** | Sales Book (19 fields), Invoice (12 fields across 2 schemas) |
| **Mappers** | 6 functions — one per tool + detected fields + AI description |
| **AI integration** | Profile summary in system prompt + memory management instructions |
| **Privacy** | Local-only, masked sensitive data in AI context, confirmation required |
