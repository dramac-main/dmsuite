/*  Layers Sidebar — object list with reorder and visibility */
"use client";

import { useFabricEditor } from "../FabricEditor";
import { isTextType } from "@/lib/fabric-editor";

export function LayersSidebar() {
  const { editor } = useFabricEditor();
  if (!editor) return null;

  const objects = editor.canvas
    .getObjects()
    .filter((o) => o.name !== "clip")
    .reverse(); // Top layer first

  const selected = editor.selectedObjects;

  return (
    <div className="flex flex-col gap-1">
      {objects.length === 0 && (
        <p className="text-xs text-gray-500">No objects on canvas</p>
      )}

      {objects.map((obj, i) => {
        const isSelected = selected.includes(obj);
        const label = obj.name || `${obj.type}-${i}`;
        const preview = isTextType(obj.type)
          ? (obj as { text?: string }).text?.slice(0, 20) ?? ""
          : obj.type ?? "";

        return (
          <button
            key={`${label}-${i}`}
            onClick={() => {
              editor.canvas.setActiveObject(obj);
              editor.canvas.renderAll();
            }}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
              isSelected
                ? "bg-primary-500/20 text-primary-400"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
          >
            {/* Type icon */}
            <span className="w-4 text-center text-xs text-gray-500">
              {isTextType(obj.type) ? "T" : obj.type === "image" ? "🖼" : "■"}
            </span>

            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{label}</div>
              {preview && (
                <div className="truncate text-[10px] text-gray-500">{preview}</div>
              )}
            </div>

            {/* Visibility toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                obj.set({ visible: !obj.visible });
                editor.canvas.renderAll();
              }}
              className="text-gray-500 hover:text-gray-300"
              title={obj.visible ? "Hide" : "Show"}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                {obj.visible !== false ? (
                  <>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                ) : (
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" />
                )}
              </svg>
            </button>
          </button>
        );
      })}
    </div>
  );
}
