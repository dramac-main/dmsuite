// =============================================================================
// Resume & CV — Basics Section Editor
// Edits: name, headline, email, phone, location, website, photo
// =============================================================================

"use client";

import React, { useCallback, useRef } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import { FormInput } from "@/components/workspaces/shared/WorkspaceUIKit";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2 MB

export default function BasicsSection() {
  const basics = useResumeEditor((s) => s.resume?.basics);
  const picture = useResumeEditor((s) => s.resume?.picture);
  const updateBasics = useResumeEditor((s) => s.updateBasics);
  const updatePicture = useResumeEditor((s) => s.updatePicture);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fallbacks for hydration safety
  const b = basics ?? { name: "", headline: "", email: "", phone: "", location: "", website: { url: "", label: "" }, customFields: [] };
  const pic = picture ?? { hidden: true, url: "", size: 80, aspectRatio: 1, borderRadius: 0, borderColor: "rgba(0,0,0,0.5)", borderWidth: 0 };

  const onBasics = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      updateBasics({ [field]: e.target.value });
    },
    [updateBasics],
  );

  const onWebsite = useCallback(
    (field: "url" | "label") => (e: React.ChangeEvent<HTMLInputElement>) => {
      updateBasics({ website: { ...(basics?.website ?? { url: "", label: "" }), [field]: e.target.value } });
    },
    [updateBasics, basics?.website],
  );

  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > MAX_PHOTO_SIZE) {
        alert("Photo must be under 2 MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        updatePicture({ url: reader.result as string, hidden: false });
      };
      reader.readAsDataURL(file);
    },
    [updatePicture],
  );

  const removePhoto = useCallback(() => {
    updatePicture({ url: "", hidden: true });
    if (fileRef.current) fileRef.current.value = "";
  }, [updatePicture]);

  return (
    <div className="space-y-3">
      {/* Photo */}
      <div className="flex items-center gap-3">
        {pic.url && !pic.hidden ? (
          <div className="relative group">
            <div
              className="rounded-lg overflow-hidden border border-gray-700/60"
              style={{ width: 56, height: 56 * pic.aspectRatio }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pic.url} alt="Photo" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={removePhoto}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove photo"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-700 hover:border-primary-500/50 flex items-center justify-center text-gray-500 hover:text-primary-400 transition-colors text-xl"
          >
            +
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        <div className="flex-1 min-w-0">
          <FormInput label="Full Name" placeholder="John Doe" value={b.name} onChange={onBasics("name")} />
        </div>
      </div>

      <FormInput label="Headline / Title" placeholder="Senior Software Engineer" value={b.headline} onChange={onBasics("headline")} />

      <div className="grid grid-cols-2 gap-2">
        <FormInput label="Email" placeholder="john@example.com" type="email" value={b.email} onChange={onBasics("email")} />
        <FormInput label="Phone" placeholder="+1 (555) 123-4567" value={b.phone} onChange={onBasics("phone")} />
      </div>

      <FormInput label="Location" placeholder="San Francisco, CA" value={b.location} onChange={onBasics("location")} />

      <div className="grid grid-cols-2 gap-2">
        <FormInput label="Website URL" placeholder="https://..." value={b.website?.url ?? ""} onChange={onWebsite("url")} />
        <FormInput label="Website Label" placeholder="Portfolio" value={b.website?.label ?? ""} onChange={onWebsite("label")} />
      </div>

      {/* Photo controls (when photo exists) */}
      {pic.url && !pic.hidden && (
        <div className="space-y-2 pt-2 border-t border-gray-800/40">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Photo Settings</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Size</label>
              <input
                type="range" min={40} max={200} value={pic.size}
                onChange={(e) => updatePicture({ size: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Radius</label>
              <input
                type="range" min={0} max={50} value={pic.borderRadius}
                onChange={(e) => updatePicture({ borderRadius: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Border</label>
              <input
                type="range" min={0} max={6} value={pic.borderWidth}
                onChange={(e) => updatePicture({ borderWidth: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
