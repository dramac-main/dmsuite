/*  Stroke Width Sidebar */
"use client";

import { useFabricEditor } from "../FabricEditor";

const DASH_PATTERNS = [
  { label: "Solid", value: [] as number[] },
  { label: "Dashed", value: [10, 5] },
  { label: "Dotted", value: [2, 4] },
  { label: "Dash-Dot", value: [10, 5, 2, 5] },
];

export function StrokeWidthSidebar() {
  const { editor } = useFabricEditor();
  if (!editor) return null;

  const currentWidth = editor.getActiveStrokeWidth();
  const currentDash = editor.getActiveStrokeDashArray();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-xs text-gray-400">
          Stroke Width: {currentWidth}px
        </label>
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={currentWidth}
          onChange={(e) => editor.changeStrokeWidth(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs text-gray-400">Dash Pattern</label>
        <div className="flex flex-col gap-1.5">
          {DASH_PATTERNS.map(({ label, value }) => {
            const isActive = JSON.stringify(currentDash) === JSON.stringify(value);
            return (
              <button
                key={label}
                onClick={() => editor.changeStrokeDashArray(value)}
                className={`flex h-9 items-center rounded-md px-3 transition-colors ${
                  isActive
                    ? "bg-primary-500/20 text-primary-400"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <svg className="h-2 w-full" viewBox="0 0 200 4">
                  <line
                    x1="0" y1="2" x2="200" y2="2"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeDasharray={value.length ? value.join(" ") : "none"}
                  />
                </svg>
                <span className="ml-2 shrink-0 text-xs">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
