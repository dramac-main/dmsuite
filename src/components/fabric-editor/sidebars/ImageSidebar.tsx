/*  Image Sidebar — upload/add images */
"use client";

import { useRef } from "react";
import { useFabricEditor } from "../FabricEditor";

export function ImageSidebar() {
  const { editor, setActiveTool } = useFabricEditor();
  const inputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        editor.addImage(dataUrl);
        setActiveTool("select");
      }
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be uploaded again
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-600 p-6 text-sm text-gray-400 transition-colors hover:border-primary-500 hover:text-primary-400"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m17 8-5-5-5 5" />
          <path d="M12 3v12" />
        </svg>
        Upload Image
      </button>

      <p className="text-xs text-gray-500">
        Supports PNG, JPG, SVG, WebP. Images are embedded in your design.
      </p>
    </div>
  );
}
