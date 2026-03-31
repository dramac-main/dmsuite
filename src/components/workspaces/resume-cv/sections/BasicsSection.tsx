// =============================================================================
// DMSuite — Basics Section Editor
// Name, headline, photo, email, phone, location, website, LinkedIn
// =============================================================================

"use client";

import React, { useCallback, useRef, useState } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import {
  FormInput,
  FormTextarea,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

export default function BasicsSection() {
  const basics = useResumeEditor((s) => s.resume.basics);
  const updateResume = useResumeEditor((s) => s.updateResume);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (field: string, value: string) => {
      updateResume((draft) => {
        (draft.basics as Record<string, unknown>)[field] = value;
      });
    },
    [updateResume]
  );

  const updateWebsite = useCallback(
    (field: "url" | "label", value: string) => {
      updateResume((draft) => {
        draft.basics.website[field] = value;
      });
    },
    [updateResume]
  );

  // ── Photo upload (base64, client-side only) ──
  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) return; // 2MB limit
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        updateResume((draft) => {
          draft.basics.photo = result;
        });
      };
      reader.readAsDataURL(file);
      if (photoInputRef.current) photoInputRef.current.value = "";
    },
    [updateResume]
  );

  const removePhoto = useCallback(() => {
    updateResume((draft) => {
      draft.basics.photo = "";
    });
  }, [updateResume]);

  return (
    <div className="pt-3 space-y-3">
      {/* Photo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => photoInputRef.current?.click()}
          className="relative w-16 h-16 rounded-full bg-gray-700/40 border border-gray-600/30 overflow-hidden hover:border-primary-500/40 transition-colors group shrink-0"
        >
          {basics.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={basics.photo}
              alt="Photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <SIcon
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                className="w-5 h-5 text-gray-500"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <SIcon d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" className="w-4 h-4 text-white" />
          </div>
        </button>
        <div className="flex-1 space-y-1">
          <p className="text-[11px] text-gray-500">Photo (optional)</p>
          {basics.photo && (
            <button
              onClick={removePhoto}
              className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
      </div>

      {/* Name & Headline */}
      <div className="grid grid-cols-2 gap-2">
        <FormInput
          label="Full Name"
          value={basics.name}
          onChange={(v) => update("name", v)}
          placeholder="John Doe"
        />
        <FormInput
          label="Headline"
          value={basics.headline}
          onChange={(v) => update("headline", v)}
          placeholder="Senior Software Engineer"
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-2">
        <FormInput
          label="Email"
          value={basics.email}
          onChange={(v) => update("email", v)}
          placeholder="john@example.com"
        />
        <FormInput
          label="Phone"
          value={basics.phone}
          onChange={(v) => update("phone", v)}
          placeholder="+1 234 567 890"
        />
      </div>

      {/* Location */}
      <FormInput
        label="Location"
        value={basics.location}
        onChange={(v) => update("location", v)}
        placeholder="City, Country"
      />

      {/* Website */}
      <div className="grid grid-cols-2 gap-2">
        <FormInput
          label="Website URL"
          value={basics.website.url}
          onChange={(v) => updateWebsite("url", v)}
          placeholder="https://johndoe.com"
        />
        <FormInput
          label="Website Label"
          value={basics.website.label}
          onChange={(v) => updateWebsite("label", v)}
          placeholder="Portfolio"
        />
      </div>

      {/* LinkedIn */}
      <FormInput
        label="LinkedIn"
        value={basics.linkedin}
        onChange={(v) => update("linkedin", v)}
        placeholder="https://linkedin.com/in/johndoe"
      />
    </div>
  );
}
