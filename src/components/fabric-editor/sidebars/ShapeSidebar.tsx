/*  Shape Sidebar — add shapes to canvas */
"use client";

import { useFabricEditor } from "../FabricEditor";

const SHAPES = [
  {
    label: "Rectangle",
    action: "addRectangle" as const,
    svg: (
      <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="6" y="10" width="36" height="28" rx="2" />
      </svg>
    ),
  },
  {
    label: "Rounded Rect",
    action: "addSoftRectangle" as const,
    svg: (
      <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="6" y="10" width="36" height="28" rx="10" />
      </svg>
    ),
  },
  {
    label: "Circle",
    action: "addCircle" as const,
    svg: (
      <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="24" cy="24" r="16" />
      </svg>
    ),
  },
  {
    label: "Triangle",
    action: "addTriangle" as const,
    svg: (
      <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2}>
        <polygon points="24,8 42,40 6,40" />
      </svg>
    ),
  },
  {
    label: "Inv. Triangle",
    action: "addInverseTriangle" as const,
    svg: (
      <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2}>
        <polygon points="6,8 42,8 24,40" />
      </svg>
    ),
  },
  {
    label: "Diamond",
    action: "addDiamond" as const,
    svg: (
      <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2}>
        <polygon points="24,4 44,24 24,44 4,24" />
      </svg>
    ),
  },
];

export function ShapeSidebar() {
  const { editor, setActiveTool } = useFabricEditor();
  if (!editor) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {SHAPES.map(({ label, action, svg }) => (
        <button
          key={action}
          onClick={() => {
            editor[action]();
            setActiveTool("select");
          }}
          className="flex flex-col items-center gap-1.5 rounded-lg p-3 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          title={label}
        >
          {svg}
          <span className="text-[10px]">{label}</span>
        </button>
      ))}
    </div>
  );
}
