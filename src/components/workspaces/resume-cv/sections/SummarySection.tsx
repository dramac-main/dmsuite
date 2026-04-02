// =============================================================================
// Resume & CV — Summary Section Editor (rich text content via TipTap)
// =============================================================================

"use client";

import React, { useCallback } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import RichInput from "../RichInput";

export default function SummarySection() {
  const summary = useResumeEditor((s) => s.resume?.summary);
  const updateSummary = useResumeEditor((s) => s.updateSummary);

  const onChange = useCallback(
    (html: string) => {
      updateSummary({ content: html });
    },
    [updateSummary],
  );

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium text-gray-400 mb-1">
        Professional Summary
      </label>
      <RichInput
        value={summary?.content ?? ""}
        onChange={onChange}
        placeholder="Write a brief summary of your professional background, key skills, and career objectives..."
      />
      <p className="text-[10px] text-gray-600">
        Tip: Keep it under 4 sentences. Focus on impact and relevance to the target role.
      </p>
    </div>
  );
}
