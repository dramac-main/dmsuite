/*  Template Sidebar — loads pre-built Fabric.js JSON templates */
"use client";

import { useState } from "react";
import { useFabricEditor } from "../FabricEditor";

export function TemplateSidebar() {
  const { editor, config } = useFabricEditor();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
    console.log("[TemplateSidebar] handleLoad called:", tpl.id, { hasSvg: !!tpl.svg, hasSvgUrl: !!tpl.svgUrl, jsonLength: tpl.json?.length ?? 0 });
    if (tpl.svg) {
      console.log("[TemplateSidebar] loading inline SVG, length:", tpl.svg.length);
      editor.loadSvg(tpl.svg);
    } else if (tpl.svgUrl) {
      console.log("[TemplateSidebar] fetching SVG from:", tpl.svgUrl);
      const res = await fetch(tpl.svgUrl);
      if (!res.ok) throw new Error(`Failed to fetch SVG: ${res.status}`);
      const svgString = await res.text();
      console.log("[TemplateSidebar] SVG fetched, length:", svgString.length);
      editor.loadSvg(svgString);
    } else if (tpl.json) {
      console.log("[TemplateSidebar] loading JSON template, length:", tpl.json.length);
      editor.loadJson(tpl.json);
    } else {
      console.warn("[TemplateSidebar] template has no json, svg, or svgUrl:", tpl.id);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {loadingId && (
        <div className="rounded-lg bg-primary-500/10 border border-primary-500/30 px-3 py-2 text-xs text-primary-400">
          Loading template...
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-xs text-error">
          {errorMsg}
        </div>
      )}
      {templates.map((tpl) => (
        <button
          key={tpl.id}
          onClick={() => {
            setLoadingId(tpl.id);
            setErrorMsg(null);
            setTimeout(() => {
              handleLoad(tpl)
                .catch((err) => {
                  console.error("[TemplateSidebar] handleLoad error:", err);
                  setErrorMsg(String(err?.message || err));
                })
                .finally(() => setLoadingId(null));
            }, 50);
          }}
          disabled={!!loadingId}
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
