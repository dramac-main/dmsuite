// =============================================================================
// DMSuite — Cover Letter Writer Action Manifest for Chiko
// Gives Chiko AI full control over letter content, targeting, styling, format.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useCoverLetterEditor } from "@/stores/cover-letter-editor";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";
import type {
  CoverLetterFormData,
  CoverLetterType,
  ToneStyle,
  SenderInfo,
  RecipientInfo,
  TargetJob,
  PersonalBackground,
  LetterContent,
  StyleConfig,
  PrintConfig,
} from "@/stores/cover-letter-editor";

// ── Options ──

export interface CoverLetterManifestOptions {
  onPrintRef?: React.RefObject<(() => void) | null>;
}

// ── Read state ──

function readState(): Record<string, unknown> {
  const { form } = useCoverLetterEditor.getState();
  return {
    letterType: form.letterType,
    tone: form.tone,
    date: form.date,
    sender: { ...form.sender },
    recipient: { ...form.recipient },
    target: { ...form.target },
    background: {
      ...form.background,
      keySkills: [...form.background.keySkills],
      achievements: [...form.background.achievements],
    },
    content: { ...form.content },
    style: { ...form.style },
    printConfig: { ...form.printConfig },
    variationNotes: form.variationNotes,
  };
}

// ── Validation ──

interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
}

function validateLetter(): { issues: ValidationIssue[]; ready: boolean } {
  const { form } = useCoverLetterEditor.getState();
  const issues: ValidationIssue[] = [];

  if (!form.sender.fullName.trim()) {
    issues.push({ severity: "warning", field: "sender.fullName", message: "Sender name is empty" });
  }
  if (!form.sender.email.trim()) {
    issues.push({ severity: "warning", field: "sender.email", message: "Sender email is empty" });
  }
  if (!form.content.openingHook.trim()) {
    issues.push({ severity: "warning", field: "content.openingHook", message: "Opening paragraph is empty" });
  }
  if (!form.content.bodyQualifications.trim()) {
    issues.push({ severity: "warning", field: "content.bodyQualifications", message: "Qualifications paragraph is empty" });
  }
  if (!form.content.closingCallToAction.trim()) {
    issues.push({ severity: "warning", field: "content.closingCallToAction", message: "Closing paragraph is empty" });
  }
  if (!form.recipient.companyName.trim() && !form.recipient.hiringManagerName.trim()) {
    issues.push({ severity: "warning", field: "recipient", message: "No recipient information provided" });
  }

  return { issues, ready: issues.filter((i) => i.severity === "error").length === 0 };
}

// ── Manifest Factory ──

export function createCoverLetterManifest(options?: CoverLetterManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "cover-letter",
    toolName: "Cover Letter Writer",
    actions: [
      {
        name: "readCurrentState",
        description: "Read the current state of the cover letter for analysis or suggestions.",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },
      {
        name: "updateSender",
        description: "Update sender info: fullName, jobTitle, email, phone, location, linkedIn, website.",
        parameters: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            jobTitle: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            location: { type: "string" },
            linkedIn: { type: "string" },
            website: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "updateRecipient",
        description: "Update recipient info: hiringManagerName, hiringManagerTitle, companyName, companyAddress, department.",
        parameters: {
          type: "object",
          properties: {
            hiringManagerName: { type: "string" },
            hiringManagerTitle: { type: "string" },
            companyName: { type: "string" },
            companyAddress: { type: "string" },
            department: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "updateTarget",
        description: "Update job target: jobTitle, jobDescription, keyRequirements, industry, companyMission, whyThisCompany.",
        parameters: {
          type: "object",
          properties: {
            jobTitle: { type: "string" },
            jobDescription: { type: "string" },
            keyRequirements: { type: "string" },
            industry: { type: "string" },
            companyMission: { type: "string" },
            whyThisCompany: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "updateBackground",
        description: "Update personal background: currentRole, yearsOfExperience, keySkills (array), achievements (array), careerHighlights, educationSummary, relevantCertifications.",
        parameters: {
          type: "object",
          properties: {
            currentRole: { type: "string" },
            yearsOfExperience: { type: "string" },
            keySkills: { type: "array", items: { type: "string" } },
            achievements: { type: "array", items: { type: "string" } },
            careerHighlights: { type: "string" },
            educationSummary: { type: "string" },
            relevantCertifications: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "updateContent",
        description: "Update letter content: salutation, openingHook, bodyQualifications, bodyCompanyFit, closingCallToAction, signOff, postScript.",
        parameters: {
          type: "object",
          properties: {
            salutation: { type: "string" },
            openingHook: { type: "string" },
            bodyQualifications: { type: "string" },
            bodyCompanyFit: { type: "string" },
            closingCallToAction: { type: "string" },
            signOff: { type: "string" },
            postScript: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "setLetterType",
        description: "Set cover letter type: job-application, internship, career-change, speculative, academic, executive, creative, entry-level, internal-transfer, referral, networking, freelance-pitch.",
        parameters: {
          type: "object",
          properties: {
            letterType: { type: "string" },
          },
          required: ["letterType"],
        },
        category: "Content",
      },
      {
        name: "setTone",
        description: "Set letter tone: formal-corporate, warm-conversational, bold-confident, creative-expressive, academic-scholarly, executive-authoritative.",
        parameters: {
          type: "object",
          properties: {
            tone: { type: "string" },
          },
          required: ["tone"],
        },
        category: "Content",
      },
      {
        name: "updateStyle",
        description: "Update visual style: template (classic/modern/executive/creative/minimal/bold/elegant/professional), accentColor (hex), fontPairing, headerStyle (standard/sidebar/banner/minimal/boxed), showRecipientAddress (bool), showDate (bool), showSubjectLine (bool), subjectLine (string), showPageBorder (bool), showLetterheadBar (bool).",
        parameters: {
          type: "object",
          properties: {
            template: { type: "string" },
            accentColor: { type: "string" },
            fontPairing: { type: "string" },
            headerStyle: { type: "string" },
            showRecipientAddress: { type: "boolean" },
            showDate: { type: "boolean" },
            showSubjectLine: { type: "boolean" },
            subjectLine: { type: "string" },
            showPageBorder: { type: "boolean" },
            showLetterheadBar: { type: "boolean" },
          },
        },
        category: "Style",
      },
      {
        name: "updateFormat",
        description: "Update format/print settings: pageSize (a4/letter/a5), margins (narrow/standard/wide), lineSpacing (tight/normal/loose), sectionSpacing (number).",
        parameters: {
          type: "object",
          properties: {
            pageSize: { type: "string" },
            margins: { type: "string" },
            lineSpacing: { type: "string" },
            sectionSpacing: { type: "number" },
          },
        },
        category: "Format",
      },
      {
        name: "prefillFromMemory",
        description: "Pre-fill sender info from the user's saved business memory (company, email, phone, etc.).",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },
      {
        name: "exportPrint",
        description: "Export the cover letter as a PDF (triggers browser print dialog).",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
      {
        name: "validateBeforeExport",
        description: "Validate the cover letter for completeness before exporting.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
      {
        name: "resetForm",
        description: "Reset the cover letter to defaults.",
        parameters: { type: "object", properties: {} },
        category: "Content",
        destructive: true,
      },
    ],

    getState: readState,

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      try {
        const store = useCoverLetterEditor.getState();

        switch (actionName) {
          case "readCurrentState":
            return { success: true, message: "Current state read successfully", newState: readState() as unknown as Record<string, unknown> };

          case "updateSender":
            store.updateSender(params as Partial<SenderInfo>);
            return { success: true, message: "Updated sender info" };

          case "updateRecipient":
            store.updateRecipient(params as Partial<RecipientInfo>);
            return { success: true, message: "Updated recipient info" };

          case "updateTarget":
            store.updateTarget(params as Partial<TargetJob>);
            return { success: true, message: "Updated job target" };

          case "updateBackground": {
            const bgPatch: Partial<PersonalBackground> = {};
            if (params.currentRole !== undefined) bgPatch.currentRole = params.currentRole as string;
            if (params.yearsOfExperience !== undefined) bgPatch.yearsOfExperience = params.yearsOfExperience as string;
            if (params.careerHighlights !== undefined) bgPatch.careerHighlights = params.careerHighlights as string;
            if (params.educationSummary !== undefined) bgPatch.educationSummary = params.educationSummary as string;
            if (params.relevantCertifications !== undefined) bgPatch.relevantCertifications = params.relevantCertifications as string;
            if (Object.keys(bgPatch).length > 0) store.updateBackground(bgPatch);

            // Handle array fields
            if (Array.isArray(params.keySkills)) {
              // Clear existing and add new
              const currentSkills = store.form.background.keySkills;
              for (let i = currentSkills.length - 1; i >= 0; i--) store.removeSkill(i);
              for (const s of params.keySkills as string[]) store.addSkill(s);
            }
            if (Array.isArray(params.achievements)) {
              const currentAch = store.form.background.achievements;
              for (let i = currentAch.length - 1; i >= 0; i--) store.removeAchievement(i);
              for (const a of params.achievements as string[]) store.addAchievement(a);
            }
            return { success: true, message: "Updated personal background" };
          }

          case "updateContent":
            store.updateContent(params as Partial<LetterContent>);
            return { success: true, message: "Updated letter content" };

          case "setLetterType":
            store.setLetterType(params.letterType as CoverLetterType);
            return { success: true, message: `Letter type set to ${params.letterType}` };

          case "setTone":
            store.setTone(params.tone as ToneStyle);
            return { success: true, message: `Tone set to ${params.tone}` };

          case "updateStyle": {
            if (params.template !== undefined) store.setTemplate(params.template as StyleConfig["template"]);
            const stylePatch: Record<string, unknown> = {};
            for (const key of ["accentColor", "fontPairing", "headerStyle", "showRecipientAddress", "showDate", "showSubjectLine", "subjectLine", "showPageBorder", "showLetterheadBar"]) {
              if (params[key] !== undefined) stylePatch[key] = params[key];
            }
            if (Object.keys(stylePatch).length > 0) {
              store.updateStyle(stylePatch as Partial<StyleConfig>);
            }
            return { success: true, message: "Updated cover letter style" };
          }

          case "updateFormat":
            store.updatePrint(params as Partial<PrintConfig>);
            return { success: true, message: "Updated format/print settings" };

          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) {
              return { success: false, message: "No business profile saved. Ask the user to set up Business Memory first." };
            }
            const p = memory.profile;
            const senderPatch: Partial<SenderInfo> = {};
            if (p.companyName) {
              // For sender, use name from profile if available
            }
            if (p.email) senderPatch.email = p.email;
            if (p.phone) senderPatch.phone = p.phone;
            if (p.website) senderPatch.website = p.website;
            if (Object.keys(senderPatch).length > 0) store.updateSender(senderPatch);
            return { success: true, message: "Pre-filled sender info from Business Memory" };
          }

          case "exportPrint":
            options?.onPrintRef?.current?.();
            return { success: true, message: "Export triggered" };

          case "validateBeforeExport": {
            const result = validateLetter();
            return {
              success: true,
              message: result.ready
                ? `Cover letter is ready to export (${result.issues.length} minor warnings)`
                : `Cover letter has ${result.issues.length} issue(s)`,
              newState: result as unknown as Record<string, unknown>,
            };
          }

          case "resetForm":
            store.resetForm();
            return { success: true, message: "Cover letter reset to defaults" };

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Error: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useCoverLetterEditor.getState().form,
    (snapshot) => useCoverLetterEditor.getState().setForm(snapshot as CoverLetterFormData),
  );
}
