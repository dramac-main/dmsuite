/*  Stroke Color Sidebar */
"use client";

import { useFabricEditor } from "../FabricEditor";

const PRESET_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#FFA500", "#FFFF00",
  "#00FF00", "#0000FF", "#4B0082", "#8B5CF6", "#EC4899",
  "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#6366F1",
  "#3B82F6", "#14B8A6", "#22C55E", "#84CC16", "#F97316",
  "transparent",
];

export function StrokeColorSidebar() {
  const { editor } = useFabricEditor();
  if (!editor) return null;

  const current = editor.getActiveStrokeColor();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-xs text-gray-400">Stroke Color</label>
        <input
          type="color"
          value={current === "transparent" ? "#000000" : current}
          onChange={(e) => editor.changeStrokeColor(e.target.value)}
          className="h-10 w-full cursor-pointer rounded-md border border-gray-700 bg-gray-800"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs text-gray-400">Presets</label>
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => editor.changeStrokeColor(color)}
              className={`h-8 w-8 rounded-md border transition-transform hover:scale-110 ${
                current === color
                  ? "border-primary-500 ring-1 ring-primary-500"
                  : "border-gray-700"
              }`}
              style={{ backgroundColor: color === "transparent" ? undefined : color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
