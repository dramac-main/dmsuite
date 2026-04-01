// =============================================================================
// Resume & CV — Summary Section Editor (rich text content)
// =============================================================================

"use client";

import React, { useCallback } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import { FormTextarea } from "@/components/workspaces/shared/WorkspaceUIKit";

export default function SummarySection() {
  const summary = useResumeEditor((s) => s.resume.summary);
  const updateSummary = useResumeEditor((s) => s.updateSummary);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateSummary({ content: e.target.value });
    },
    [updateSummary],
  );

  return (
    <div className="space-y-2">
      <FormTextarea
        label="Professional Summary"
        placeholder="Write a brief summary of your professional background, key skills, and career objectives..."
        value={summary.content}
        onChange={onChange}
        rows={6}
      />
      <p className="text-[10px] text-gray-600">
        Tip: Keep it under 4 sentences. Focus on impact and relevance to the target role.
        HTML is supported for basic formatting.
      </p>
    </div>
  );
}
