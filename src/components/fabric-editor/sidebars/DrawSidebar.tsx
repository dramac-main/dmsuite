/*  Draw Sidebar — freehand drawing controls */
"use client";

import { useState } from "react";
import { useFabricEditor } from "../FabricEditor";

const BRUSH_SIZES = [2, 4, 8, 12, 20];

export function DrawSidebar() {
  const { editor, setActiveTool } = useFabricEditor();
  const [active, setActive] = useState(false);

  if (!editor) return null;

  const toggle = () => {
    if (active) {
      editor.disableDrawingMode();
      setActive(false);
    } else {
      editor.enableDrawingMode();
      setActive(true);
    }
  };

  const stopDrawing = () => {
    editor.disableDrawingMode();
    setActive(false);
    setActiveTool("select");
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={toggle}
        className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
          active
            ? "bg-primary-600 text-white"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
        }`}
      >
        {active ? "Drawing…" : "Start Drawing"}
      </button>

      {active && (
        <>
          <div>
            <label className="mb-2 block text-xs text-gray-400">Brush Size</label>
            <div className="flex gap-2">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    editor.canvas.freeDrawingBrush.width = size;
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  title={`${size}px`}
                >
                  <div
                    className="rounded-full bg-gray-300"
                    style={{ width: Math.min(size, 20), height: Math.min(size, 20) }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-gray-400">Brush Color</label>
            <input
              type="color"
              defaultValue="#000000"
              onChange={(e) => {
                editor.canvas.freeDrawingBrush.color = e.target.value;
              }}
              className="h-8 w-full cursor-pointer rounded-md border border-gray-700 bg-gray-800"
            />
          </div>

          <button
            onClick={stopDrawing}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200"
          >
            Done Drawing
          </button>
        </>
      )}
    </div>
  );
}
