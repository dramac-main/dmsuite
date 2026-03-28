/*  Font Sidebar — font family picker */
"use client";

import { useFabricEditor } from "../FabricEditor";
import { FONTS } from "@/lib/fabric-editor";

export function FontSidebar() {
  const { editor } = useFabricEditor();
  if (!editor) return null;

  const current = editor.getActiveFontFamily();

  return (
    <div className="flex flex-col gap-1">
      {FONTS.map((font) => (
        <button
          key={font}
          onClick={() => editor.changeFontFamily(font)}
          className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
            current === font
              ? "bg-primary-500/20 text-primary-400"
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          }`}
          style={{ fontFamily: font }}
        >
          {font}
        </button>
      ))}
    </div>
  );
}
