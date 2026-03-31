// =============================================================================
// DMSuite — Summary Section Editor
// Professional summary / objective rich text editor.
// =============================================================================

"use client";

import React, { useCallback } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import {
  FormTextarea,
} from "@/components/workspaces/shared/WorkspaceUIKit";

export default function SummarySection() {
  const summary = useResumeEditor((s) => s.resume.sections.summary);
  const updateResume = useResumeEditor((s) => s.updateResume);

  const updateContent = useCallback(
    (value: string) => {
      updateResume((draft) => {
        draft.sections.summary.content = value;
      });
    },
    [updateResume]
  );

  return (
    <div className="pt-3">
      <FormTextarea
        label="Professional Summary"
        value={summary.content}
        onChange={(e) => updateContent(e.target.value)}
        placeholder="A brief 2-3 sentence summary highlighting your career objectives, key skills, and what you bring to potential employers..."
        rows={5}
      />
      <p className="text-[10px] text-gray-600 mt-1">
        Tip: Keep it concise — 2-3 sentences that highlight your strongest qualifications.
      </p>
    </div>
  );
}
