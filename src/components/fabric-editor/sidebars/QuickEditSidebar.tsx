/*  QuickEdit Sidebar — fast field-based editing for named canvas objects */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useFabricEditor } from "../FabricEditor";
import type { QuickEditField } from "@/lib/fabric-editor";
import { isTextType } from "@/lib/fabric-editor/utils";

export function QuickEditSidebar() {
  const { editor, config } = useFabricEditor();
  const fields = config.quickEditFields;
  const [values, setValues] = useState<Record<string, string>>({});

  // Sync field values from canvas objects on mount and after template load
  const syncFromCanvas = useCallback(() => {
    if (!editor || !fields) return;
    const next: Record<string, string> = {};
    for (const field of fields) {
      const obj = editor.canvas.getObjects().find((o) => o.name === field.targetLayer);
      if (obj && isTextType(obj.type)) {
        next[field.key] = (obj as fabric.Textbox).text || "";
      } else if (obj && field.type === "color") {
        next[field.key] = (typeof obj.fill === "string" ? obj.fill : "") || "";
      } else {
        next[field.key] = "";
      }
    }
    setValues(next);
  }, [editor, fields]);

  useEffect(() => {
    syncFromCanvas();
  }, [syncFromCanvas]);

  // Re-sync when canvas changes (e.g. after template load)
  useEffect(() => {
    if (!editor) return;
    let debounce: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(debounce);
      debounce = setTimeout(syncFromCanvas, 200);
    };
    editor.canvas.on("after:render", handler);
    // Initial sync after short delay to let canvas settle
    const timer = setTimeout(syncFromCanvas, 300);
    return () => {
      editor.canvas.off("after:render", handler);
      clearTimeout(timer);
      clearTimeout(debounce);
    };
  }, [editor, syncFromCanvas]);

  if (!editor || !fields || fields.length === 0) return null;

  const handleChange = (field: QuickEditField, value: string) => {
    setValues((prev) => ({ ...prev, [field.key]: value }));

    const obj = editor.canvas.getObjects().find((o) => o.name === field.targetLayer);
    if (!obj) return;

    if (field.type === "color") {
      obj.set({ fill: value });
    } else if (isTextType(obj.type)) {
      (obj as fabric.Textbox).set({ text: value });
    }
    editor.canvas.renderAll();
  };

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-400">
            {field.label}
          </label>
          {field.type === "textarea" ? (
            <textarea
              value={values[field.key] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
            />
          ) : field.type === "select" && field.options ? (
            <select
              value={values[field.key] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
              className="rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-sm text-gray-200 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === "color" ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={values[field.key] || "#000000"}
                onChange={(e) => handleChange(field, e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-gray-700"
              />
              <input
                type="text"
                value={values[field.key] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-200 focus:border-primary-500 focus:outline-none"
              />
            </div>
          ) : field.type === "number" ? (
            <input
              type="number"
              value={values[field.key] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
              placeholder={field.placeholder}
              className="rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
            />
          ) : (
            <input
              type="text"
              value={values[field.key] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
              placeholder={field.placeholder}
              className="rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
            />
          )}
        </div>
      ))}
    </div>
  );
}
