/*  Opacity Sidebar */
"use client";

import { useFabricEditor } from "../FabricEditor";

export function OpacitySidebar() {
  const { editor } = useFabricEditor();
  if (!editor) return null;

  const current = editor.getActiveOpacity();

  return (
    <div className="flex flex-col gap-4">
      <label className="text-xs text-gray-400">
        Opacity: {Math.round(current * 100)}%
      </label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={current}
        onChange={(e) => editor.changeOpacity(Number(e.target.value))}
        className="w-full accent-primary-500"
      />
    </div>
  );
}
