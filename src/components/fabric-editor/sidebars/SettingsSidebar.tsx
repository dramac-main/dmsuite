/*  Settings Sidebar — canvas size and background */
"use client";

import { useState } from "react";
import { useFabricEditor } from "../FabricEditor";

const SIZE_PRESETS = [
  { label: "Business Card", w: 1050, h: 600 },
  { label: "Certificate (A4 Landscape)", w: 1123, h: 794 },
  { label: "Certificate (Letter Landscape)", w: 1056, h: 816 },
  { label: "Social Post (1080×1080)", w: 1080, h: 1080 },
  { label: "Instagram Story (1080×1920)", w: 1080, h: 1920 },
  { label: "Poster (A3 Portrait)", w: 794, h: 1123 },
  { label: "Badge (3.375×2.125 in)", w: 1013, h: 638 },
  { label: "Ticket (7×3 in)", w: 672, h: 288 },
  { label: "Menu (8.5×11 in)", w: 816, h: 1056 },
];

export function SettingsSidebar() {
  const { editor } = useFabricEditor();
  const [w, setW] = useState("");
  const [h, setH] = useState("");

  if (!editor) return null;

  const ws = editor.getWorkspace() as { width?: number; height?: number; fill?: unknown } | undefined;
  const currentW = ws?.width ?? 1200;
  const currentH = ws?.height ?? 900;
  const currentBg = typeof ws?.fill === "string" ? ws.fill : "white";

  const applyCustomSize = () => {
    const nw = parseInt(w) || currentW;
    const nh = parseInt(h) || currentH;
    editor.changeSize({ width: nw, height: nh });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Background */}
      <div>
        <label className="mb-2 block text-xs text-gray-400">Background</label>
        <input
          type="color"
          value={currentBg}
          onChange={(e) => editor.changeBackground(e.target.value)}
          className="h-10 w-full cursor-pointer rounded-md border border-gray-700 bg-gray-800"
        />
      </div>

      {/* Canvas Size */}
      <div>
        <label className="mb-2 block text-xs text-gray-400">
          Canvas Size ({currentW} × {currentH})
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder={String(currentW)}
            value={w}
            onChange={(e) => setW(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200"
          />
          <span className="self-center text-gray-500">×</span>
          <input
            type="number"
            placeholder={String(currentH)}
            value={h}
            onChange={(e) => setH(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200"
          />
        </div>
        <button
          onClick={applyCustomSize}
          className="mt-2 w-full rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-gray-700"
        >
          Apply
        </button>
      </div>

      {/* Presets */}
      <div>
        <label className="mb-2 block text-xs text-gray-400">Size Presets</label>
        <div className="flex flex-col gap-1">
          {SIZE_PRESETS.map(({ label, w: pw, h: ph }) => (
            <button
              key={label}
              onClick={() => editor.changeSize({ width: pw, height: ph })}
              className={`rounded-md px-3 py-2 text-left text-xs transition-colors ${
                currentW === pw && currentH === ph
                  ? "bg-primary-500/20 text-primary-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              {label}
              <span className="ml-1 text-gray-600">{pw}×{ph}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
