/*  Fill Sidebar — color picker for fill */
"use client";

import { useFabricEditor } from "../FabricEditor";

const PRESET_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#FFA500", "#FFFF00",
  "#00FF00", "#0000FF", "#4B0082", "#8B5CF6", "#EC4899",
  "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#6366F1", "#3B82F6", "#14B8A6", "#22C55E", "#84CC16",
  "#F97316", "#E11D48", "#A855F7", "#2563EB", "#0EA5E9",
  "transparent",
];

export function FillSidebar() {
  const { editor } = useFabricEditor();
  if (!editor) return null;

  const currentFill = editor.getActiveFillColor();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-xs text-gray-400">Fill Color</label>
        <input
          type="color"
          value={currentFill === "transparent" ? "#000000" : currentFill}
          onChange={(e) => editor.changeFillColor(e.target.value)}
          className="h-10 w-full cursor-pointer rounded-md border border-gray-700 bg-gray-800"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs text-gray-400">Presets</label>
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => editor.changeFillColor(color)}
              className={`h-8 w-8 rounded-md border transition-transform hover:scale-110 ${
                currentFill === color
                  ? "border-primary-500 ring-1 ring-primary-500"
                  : "border-gray-700"
              }`}
              style={{
                backgroundColor: color === "transparent" ? undefined : color,
                backgroundImage: color === "transparent"
                  ? "linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%), linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%)"
                  : undefined,
                backgroundSize: color === "transparent" ? "8px 8px" : undefined,
                backgroundPosition: color === "transparent" ? "0 0, 4px 4px" : undefined,
              }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs text-gray-400">Hex</label>
        <input
          type="text"
          value={currentFill}
          onChange={(e) => editor.changeFillColor(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-primary-500 focus:outline-none"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
