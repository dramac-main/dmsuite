/*  Filter Sidebar — image filters */
"use client";

import { useFabricEditor } from "../FabricEditor";
import { FILTERS } from "@/lib/fabric-editor";

export function FilterSidebar() {
  const { editor } = useFabricEditor();
  if (!editor) return null;

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-2 text-xs text-gray-500">
        Select an image, then apply a filter.
      </p>
      {FILTERS.map((filter) => (
        <button
          key={filter}
          onClick={() => editor.changeImageFilter(filter)}
          className="rounded-md px-3 py-2 text-left text-sm text-gray-400 capitalize transition-colors hover:bg-gray-800 hover:text-gray-200"
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
