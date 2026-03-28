/*  Text Sidebar — add text elements */
"use client";

import { useFabricEditor } from "../FabricEditor";

export function TextSidebar() {
  const { editor, setActiveTool } = useFabricEditor();
  if (!editor) return null;

  const addPreset = (
    text: string,
    opts: { fontSize: number; fontWeight?: number; width?: number },
  ) => {
    editor.addText(text, opts);
    setActiveTool("select");
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => addPreset("Add a heading", { fontSize: 64, fontWeight: 700, width: 600 })}
        className="rounded-lg border border-gray-700 p-4 text-left text-2xl font-bold text-gray-200 transition-colors hover:border-primary-500/50 hover:bg-gray-800"
      >
        Add a heading
      </button>

      <button
        onClick={() => addPreset("Add a subheading", { fontSize: 40, fontWeight: 600, width: 500 })}
        className="rounded-lg border border-gray-700 p-3 text-left text-lg font-semibold text-gray-300 transition-colors hover:border-primary-500/50 hover:bg-gray-800"
      >
        Add a subheading
      </button>

      <button
        onClick={() => addPreset("Add body text", { fontSize: 24, width: 400 })}
        className="rounded-lg border border-gray-700 p-3 text-left text-sm text-gray-400 transition-colors hover:border-primary-500/50 hover:bg-gray-800"
      >
        Add body text
      </button>

      <button
        onClick={() => addPreset("Caption", { fontSize: 16, width: 300 })}
        className="rounded-lg border border-gray-700 p-2.5 text-left text-xs text-gray-500 transition-colors hover:border-primary-500/50 hover:bg-gray-800"
      >
        Add a caption
      </button>
    </div>
  );
}
