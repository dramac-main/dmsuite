/*  Template Sidebar — loads pre-built Fabric.js JSON templates */
"use client";

import { useState } from "react";
import { useFabricEditor } from "../FabricEditor";

export function TemplateSidebar() {
  const { editor, config } = useFabricEditor();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  if (!editor) return null;

  const templates = config.templates;

  if (!templates.length) {
    return (
      <p className="text-sm text-gray-500">
        No templates available for this tool yet.
      </p>
    );
  }

  const handleLoad = async (tpl: typeof templates[number]) => {
    if (tpl.svg) {
      editor.loadSvg(tpl.svg);
    } else if (tpl.svgUrl) {
      try {
        setLoadingId(tpl.id);
        const res = await fetch(tpl.svgUrl);
        if (!res.ok) throw new Error(`Failed to fetch SVG: ${res.status}`);
        const svgString = await res.text();
        editor.loadSvg(svgString);
      } catch (err) {
        console.error("[TemplateSidebar] SVG fetch error:", err);
      } finally {
        setLoadingId(null);
      }
    } else {
      editor.loadJson(tpl.json);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {templates.map((tpl) => (
        <button
          key={tpl.id}
          onClick={() => handleLoad(tpl)}
          disabled={loadingId === tpl.id}
          className="group relative overflow-hidden rounded-lg border border-gray-700 transition-colors hover:border-primary-500/50 disabled:opacity-60"
        >
          {tpl.thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={tpl.thumbnailUrl}
              alt={tpl.name}
              className="aspect-4/3 w-full object-cover"
            />
          ) : (
            <div className="flex aspect-4/3 items-center justify-center bg-gray-800 text-xs text-gray-500">
              {tpl.name}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2">
            <span className="text-xs font-medium text-white">{tpl.name}</span>
            {tpl.isPro && (
              <span className="ml-1 rounded bg-primary-500 px-1 py-0.5 text-[9px] font-bold text-black">
                PRO
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
