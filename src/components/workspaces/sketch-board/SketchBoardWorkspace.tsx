"use client";

/* ─────────────────────────────────────────────────────────────
   Sketch Board Workspace — Infinite Canvas Whiteboard  (V2)
   Complete rewrite: proper export, real eraser, direction-aware
   lines/arrows, ref-based interaction state, hit-test eraser.
   ───────────────────────────────────────────────────────────── */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createSketchBoardManifest } from "@/lib/chiko/manifests/sketch-board";
import {
  useSketchBoardEditor,
  STROKE_COLORS,
  FILL_COLORS,
  STICKY_COLORS,
  BACKGROUND_PRESETS,
} from "@/stores/sketch-board-editor";
import type {
  SketchTool,
  SketchElement,
  Point,
  DrawElement,
  LineElement,
  ArrowElement,
  TextElement,
  StickyElement,
  ShapeElement,
} from "@/types/sketch-board";
import {
  IconDownload,
  IconPlus,
  IconTrash,
  IconUndo,
  IconRedo,
  IconZoomIn,
  IconZoomOut,
} from "@/components/icons";

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const TOOL_DEFS: { id: SketchTool; label: string; icon: string }[] = [
  { id: "select", label: "Select (V)", icon: "⇲" },
  { id: "hand", label: "Pan (H)", icon: "✋" },
  { id: "draw", label: "Draw (P)", icon: "✏️" },
  { id: "eraser", label: "Erase (E)", icon: "🧹" },
  { id: "rectangle", label: "Rectangle (R)", icon: "▭" },
  { id: "ellipse", label: "Ellipse (O)", icon: "◯" },
  { id: "diamond", label: "Diamond (D)", icon: "◇" },
  { id: "triangle", label: "Triangle", icon: "△" },
  { id: "line", label: "Line (L)", icon: "╱" },
  { id: "arrow", label: "Arrow (A)", icon: "→" },
  { id: "text", label: "Text (T)", icon: "T" },
  { id: "sticky", label: "Sticky (S)", icon: "📝" },
];

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/** Build quadratic-bezier smoothed SVG path from freehand points */
function getDrawPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} l 0.1 0`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const mx = (prev.x + curr.x) / 2;
    const my = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/** CSS font-family string for a font key */
function getFontCss(family: string): string {
  switch (family) {
    case "hand":
      return "'Segoe UI', system-ui, sans-serif";
    case "mono":
      return "'JetBrains Mono', monospace";
    case "serif":
      return "Georgia, serif";
    default:
      return "'Inter', sans-serif";
  }
}

/** XML-safe text */
function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** stroke-dasharray SVG attribute string */
function dashAttr(ds: string): string {
  if (ds === "dashed") return ' stroke-dasharray="8 4"';
  if (ds === "dotted") return ' stroke-dasharray="2 4"';
  return "";
}

// ═══════════════════════════════════════════════════════════════
// Hit-test (for eraser sweep)
// ═══════════════════════════════════════════════════════════════

/** Check if point (px,py) is close to an element */
function hitTestPoint(
  el: SketchElement,
  px: number,
  py: number,
  threshold = 14
): boolean {
  switch (el.type) {
    case "draw":
    case "eraser": {
      const d = el as DrawElement;
      // point-to-polyline-segment distance
      for (let i = 1; i < d.points.length; i++) {
        const ax = d.points[i - 1].x,
          ay = d.points[i - 1].y;
        const bx = d.points[i].x,
          by = d.points[i].y;
        const dx = bx - ax,
          dy = by - ay;
        const len2 = dx * dx + dy * dy;
        const t =
          len2 > 0
            ? Math.max(
                0,
                Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)
              )
            : 0;
        const dist = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
        if (dist < threshold + d.style.strokeWidth) return true;
      }
      if (
        d.points.length === 1 &&
        Math.hypot(px - d.points[0].x, py - d.points[0].y) < threshold
      )
        return true;
      return false;
    }
    case "line":
    case "arrow": {
      const l = el as LineElement;
      const dx = l.end.x - l.start.x,
        dy = l.end.y - l.start.y;
      const len2 = dx * dx + dy * dy;
      const t =
        len2 > 0
          ? Math.max(
              0,
              Math.min(
                1,
                ((px - l.start.x) * dx + (py - l.start.y) * dy) / len2
              )
            )
          : 0;
      return (
        Math.hypot(px - (l.start.x + t * dx), py - (l.start.y + t * dy)) <
        threshold + l.style.strokeWidth
      );
    }
    default: {
      // Bounding-box test for shapes, text, sticky
      return (
        px >= el.x - threshold &&
        px <= el.x + el.width + threshold &&
        py >= el.y - threshold &&
        py <= el.y + el.height + threshold
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Export helpers — build a CLEAN SVG from element data
// ═══════════════════════════════════════════════════════════════

function getContentBounds(elements: SketchElement[]): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  if (elements.length === 0) return { x: 0, y: 0, w: 800, h: 600 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const el of elements) {
    if (el.type === "draw") {
      const d = el as DrawElement;
      for (const p of d.points) {
        minX = Math.min(minX, p.x - d.style.strokeWidth);
        minY = Math.min(minY, p.y - d.style.strokeWidth);
        maxX = Math.max(maxX, p.x + d.style.strokeWidth);
        maxY = Math.max(maxY, p.y + d.style.strokeWidth);
      }
    } else if (el.type === "line" || el.type === "arrow") {
      const l = el as LineElement;
      minX = Math.min(minX, l.start.x, l.end.x);
      minY = Math.min(minY, l.start.y, l.end.y);
      maxX = Math.max(maxX, l.start.x, l.end.x);
      maxY = Math.max(maxY, l.start.y, l.end.y);
    } else {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    }
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Convert a single element to an SVG string (no camera, no selection) */
function elementToSVGStr(el: SketchElement): string {
  const da = dashAttr(el.style.dashStyle);
  const op = el.style.opacity !== 1 ? ` opacity="${el.style.opacity}"` : "";

  switch (el.type) {
    case "draw": {
      const d = el as DrawElement;
      return `<path d="${getDrawPath(d.points)}" fill="none" stroke="${d.style.strokeColor}" stroke-width="${d.style.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${da}${op}/>`;
    }
    case "eraser":
      return ""; // eraser strokes are not exported
    case "rectangle": {
      const tr = `translate(${el.x},${el.y}) rotate(${el.rotation} ${el.width / 2} ${el.height / 2})`;
      return `<g transform="${tr}"><rect width="${el.width}" height="${el.height}" fill="${el.style.fillColor}" stroke="${el.style.strokeColor}" stroke-width="${el.style.strokeWidth}"${da} rx="4"${op}/></g>`;
    }
    case "ellipse": {
      const tr = `translate(${el.x},${el.y}) rotate(${el.rotation} ${el.width / 2} ${el.height / 2})`;
      return `<g transform="${tr}"><ellipse cx="${el.width / 2}" cy="${el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${el.style.fillColor}" stroke="${el.style.strokeColor}" stroke-width="${el.style.strokeWidth}"${da}${op}/></g>`;
    }
    case "diamond": {
      const cx = el.width / 2,
        cy = el.height / 2;
      const tr = `translate(${el.x},${el.y}) rotate(${el.rotation} ${cx} ${cy})`;
      return `<g transform="${tr}"><polygon points="${cx},0 ${el.width},${cy} ${cx},${el.height} 0,${cy}" fill="${el.style.fillColor}" stroke="${el.style.strokeColor}" stroke-width="${el.style.strokeWidth}"${da}${op}/></g>`;
    }
    case "triangle": {
      const cx = el.width / 2;
      const tr = `translate(${el.x},${el.y}) rotate(${el.rotation} ${cx} ${el.height / 2})`;
      return `<g transform="${tr}"><polygon points="${cx},0 ${el.width},${el.height} 0,${el.height}" fill="${el.style.fillColor}" stroke="${el.style.strokeColor}" stroke-width="${el.style.strokeWidth}"${da}${op}/></g>`;
    }
    case "line": {
      const l = el as LineElement;
      return `<line x1="${l.start.x}" y1="${l.start.y}" x2="${l.end.x}" y2="${l.end.y}" stroke="${l.style.strokeColor}" stroke-width="${l.style.strokeWidth}" stroke-linecap="round"${da}${op}/>`;
    }
    case "arrow": {
      const a = el as ArrowElement;
      const mid = `arw_${a.id.replace(/[^a-zA-Z0-9]/g, "")}`;
      let svg = "";
      if (a.endHead !== "none") {
        svg += `<defs><marker id="${mid}" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 12 4 L 0 8 Z" fill="${a.style.strokeColor}"/></marker></defs>`;
      }
      svg += `<line x1="${a.start.x}" y1="${a.start.y}" x2="${a.end.x}" y2="${a.end.y}" stroke="${a.style.strokeColor}" stroke-width="${a.style.strokeWidth}" stroke-linecap="round"${da}${op}${a.endHead !== "none" ? ` marker-end="url(#${mid})"` : ""}/>`;
      return svg;
    }
    case "text": {
      const t = el as TextElement;
      const anchor =
        t.style.textAlign === "center"
          ? "middle"
          : t.style.textAlign === "right"
            ? "end"
            : "start";
      const tx =
        t.style.textAlign === "center"
          ? t.width / 2
          : t.style.textAlign === "right"
            ? t.width
            : 0;
      const tr = `translate(${t.x},${t.y}) rotate(${t.rotation} ${t.width / 2} ${t.height / 2})`;
      return `<g transform="${tr}"><text x="${tx}" y="${t.style.fontSize}" fill="${t.style.strokeColor}" font-size="${t.style.fontSize}" font-family="${getFontCss(t.style.fontFamily)}" text-anchor="${anchor}"${op}>${escXml(t.text)}</text></g>`;
    }
    case "sticky": {
      const st = el as StickyElement;
      const tr = `translate(${st.x},${st.y}) rotate(${st.rotation} ${st.width / 2} ${st.height / 2})`;
      // Word-wrap approximation using tspans
      const maxChars = Math.floor((st.width - 16) / (st.style.fontSize * 0.55));
      const words = st.text.split(" ");
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        if ((cur + " " + w).trim().length > maxChars && cur) {
          lines.push(cur);
          cur = w;
        } else {
          cur = cur ? cur + " " + w : w;
        }
      }
      if (cur) lines.push(cur);
      const tspans = lines
        .map(
          (line, i) =>
            `<tspan x="8" dy="${i === 0 ? 0 : st.style.fontSize + 2}">${escXml(line)}</tspan>`
        )
        .join("");
      return `<g transform="${tr}"><rect width="${st.width}" height="${st.height}" fill="${st.stickyColor}" rx="4"/><text x="8" y="${Math.min(24, st.style.fontSize + 8)}" fill="#1a1a1a" font-size="${st.style.fontSize}" font-family="'Inter', sans-serif">${tspans}</text></g>`;
    }
    default:
      return "";
  }
}

/** Build a complete standalone SVG from document data */
function buildExportSVG(
  doc: { elements: SketchElement[]; background: string },
  title: string
): string {
  const visibleEls = doc.elements.filter((e) => e.type !== "eraser");
  const bounds = getContentBounds(visibleEls);
  const PAD = 50;
  const vx = bounds.x - PAD;
  const vy = bounds.y - PAD;
  const vw = Math.max(bounds.w + PAD * 2, 200);
  const vh = Math.max(bounds.h + PAD * 2, 200);
  const bg =
    BACKGROUND_PRESETS.find((b) => b.id === doc.background)?.value ?? "#ffffff";
  const sorted = [...visibleEls].sort((a, b) => a.zIndex - b.zIndex);
  const content = sorted
    .map((el) => elementToSVGStr(el))
    .filter(Boolean)
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="${vw}" height="${vh}">`,
    `<!-- ${escXml(title)} -->`,
    `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${bg}"/>`,
    content,
    `</svg>`,
  ].join("\n");
}

/** Trigger SVG download */
function doExportSVG(doc: ReturnType<typeof useSketchBoardEditor.getState>["doc"]) {
  const svgStr = buildExportSVG(doc, doc.title);
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${doc.title.replace(/[^a-zA-Z0-9 _-]/g, "_")}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
  window.dispatchEvent(new CustomEvent("workspace:save"));
  window.dispatchEvent(
    new CustomEvent("workspace:progress", {
      detail: { milestone: "exported" },
    })
  );
}

/** Trigger PNG download via offscreen canvas */
function doExportPNG(doc: ReturnType<typeof useSketchBoardEditor.getState>["doc"]) {
  const svgStr = buildExportSVG(doc, doc.title);
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    // Render at 2x for quality (min 1920 wide)
    const scale = Math.max(2, 1920 / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d")!;

    // Fill background (in case SVG bg is transparent)
    const bg =
      BACKGROUND_PRESETS.find((b) => b.id === doc.background)?.value ??
      "#ffffff";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `${doc.title.replace(/[^a-zA-Z0-9 _-]/g, "_")}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        window.dispatchEvent(new CustomEvent("workspace:save"));
        window.dispatchEvent(
          new CustomEvent("workspace:progress", {
            detail: { milestone: "exported" },
          })
        );
      },
      "image/png",
      1.0
    );
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    console.error("PNG export failed — Image could not load SVG");
  };
  img.src = url;
}

// ═══════════════════════════════════════════════════════════════
// RenderElement — draw each element type in <svg>
// ═══════════════════════════════════════════════════════════════

function RenderElement({
  el,
  isSelected,
  isEraseTarget,
  onPointerDown,
}: {
  el: SketchElement;
  isSelected: boolean;
  isEraseTarget: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}) {
  const handlePD = useCallback(
    (e: React.PointerEvent) => onPointerDown(e, el.id),
    [onPointerDown, el.id]
  );

  const elStyle: React.CSSProperties = {
    cursor: el.locked ? "not-allowed" : "move",
    opacity: el.style.opacity,
  };

  const strokeDash =
    el.style.dashStyle === "dashed"
      ? "8 4"
      : el.style.dashStyle === "dotted"
        ? "2 4"
        : undefined;

  /** Selection indicator rect */
  const selRect = (x: number, y: number, w: number, h: number) =>
    isSelected ? (
      <rect
        x={x - 4}
        y={y - 4}
        width={w + 8}
        height={h + 8}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={1.5}
        strokeDasharray="6 3"
        rx={4}
        pointerEvents="none"
      />
    ) : null;

  /** Eraser highlight */
  const eraseHighlight = (x: number, y: number, w: number, h: number) =>
    isEraseTarget ? (
      <rect
        x={x - 3}
        y={y - 3}
        width={w + 6}
        height={h + 6}
        fill="rgba(239,68,68,0.12)"
        stroke="#ef4444"
        strokeWidth={2}
        strokeDasharray="4 3"
        rx={4}
        pointerEvents="none"
      />
    ) : null;

  switch (el.type) {
    case "draw": {
      const d = el as DrawElement;
      return (
        <g onPointerDown={handlePD} style={elStyle}>
          {/* Invisible fat hit-area path */}
          <path
            d={getDrawPath(d.points)}
            fill="none"
            stroke="transparent"
            strokeWidth={Math.max(d.style.strokeWidth + 12, 16)}
            strokeLinecap="round"
          />
          <path
            d={getDrawPath(d.points)}
            fill="none"
            stroke={d.style.strokeColor}
            strokeWidth={d.style.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={strokeDash}
          />
          {selRect(d.x, d.y, d.width, d.height)}
          {eraseHighlight(d.x, d.y, d.width, d.height)}
        </g>
      );
    }

    case "eraser":
      // Legacy eraser stroke elements are hidden
      return null;

    case "rectangle": {
      const s = el as ShapeElement;
      return (
        <g
          onPointerDown={handlePD}
          style={elStyle}
          transform={`translate(${s.x}, ${s.y}) rotate(${s.rotation} ${s.width / 2} ${s.height / 2})`}
        >
          <rect
            width={s.width}
            height={s.height}
            fill={s.style.fillColor}
            stroke={s.style.strokeColor}
            strokeWidth={s.style.strokeWidth}
            strokeDasharray={strokeDash}
            rx={4}
          />
          {selRect(0, 0, s.width, s.height)}
          {eraseHighlight(0, 0, s.width, s.height)}
        </g>
      );
    }

    case "ellipse": {
      const s = el as ShapeElement;
      return (
        <g
          onPointerDown={handlePD}
          style={elStyle}
          transform={`translate(${s.x}, ${s.y}) rotate(${s.rotation} ${s.width / 2} ${s.height / 2})`}
        >
          <ellipse
            cx={s.width / 2}
            cy={s.height / 2}
            rx={s.width / 2}
            ry={s.height / 2}
            fill={s.style.fillColor}
            stroke={s.style.strokeColor}
            strokeWidth={s.style.strokeWidth}
            strokeDasharray={strokeDash}
          />
          {selRect(0, 0, s.width, s.height)}
          {eraseHighlight(0, 0, s.width, s.height)}
        </g>
      );
    }

    case "diamond": {
      const s = el as ShapeElement;
      const cx = s.width / 2;
      const cy = s.height / 2;
      return (
        <g
          onPointerDown={handlePD}
          style={elStyle}
          transform={`translate(${s.x}, ${s.y}) rotate(${s.rotation} ${cx} ${cy})`}
        >
          <polygon
            points={`${cx},0 ${s.width},${cy} ${cx},${s.height} 0,${cy}`}
            fill={s.style.fillColor}
            stroke={s.style.strokeColor}
            strokeWidth={s.style.strokeWidth}
            strokeDasharray={strokeDash}
          />
          {selRect(0, 0, s.width, s.height)}
          {eraseHighlight(0, 0, s.width, s.height)}
        </g>
      );
    }

    case "triangle": {
      const s = el as ShapeElement;
      const cx = s.width / 2;
      return (
        <g
          onPointerDown={handlePD}
          style={elStyle}
          transform={`translate(${s.x}, ${s.y}) rotate(${s.rotation} ${cx} ${s.height / 2})`}
        >
          <polygon
            points={`${cx},0 ${s.width},${s.height} 0,${s.height}`}
            fill={s.style.fillColor}
            stroke={s.style.strokeColor}
            strokeWidth={s.style.strokeWidth}
            strokeDasharray={strokeDash}
          />
          {selRect(0, 0, s.width, s.height)}
          {eraseHighlight(0, 0, s.width, s.height)}
        </g>
      );
    }

    case "line": {
      const l = el as LineElement;
      return (
        <g onPointerDown={handlePD} style={elStyle}>
          {/* Fat invisible hit area */}
          <line
            x1={l.start.x}
            y1={l.start.y}
            x2={l.end.x}
            y2={l.end.y}
            stroke="transparent"
            strokeWidth={Math.max(l.style.strokeWidth + 12, 16)}
          />
          <line
            x1={l.start.x}
            y1={l.start.y}
            x2={l.end.x}
            y2={l.end.y}
            stroke={l.style.strokeColor}
            strokeWidth={l.style.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDash}
          />
          {selRect(l.x, l.y, l.width || 1, l.height || 1)}
          {eraseHighlight(l.x, l.y, l.width || 1, l.height || 1)}
        </g>
      );
    }

    case "arrow": {
      const a = el as ArrowElement;
      const mid = `arrowhead-${a.id}`;
      return (
        <g onPointerDown={handlePD} style={elStyle}>
          <defs>
            <marker
              id={mid}
              markerWidth="12"
              markerHeight="8"
              refX="10"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 12 4 L 0 8 Z" fill={a.style.strokeColor} />
            </marker>
          </defs>
          {/* Fat invisible hit area */}
          <line
            x1={a.start.x}
            y1={a.start.y}
            x2={a.end.x}
            y2={a.end.y}
            stroke="transparent"
            strokeWidth={Math.max(a.style.strokeWidth + 12, 16)}
          />
          <line
            x1={a.start.x}
            y1={a.start.y}
            x2={a.end.x}
            y2={a.end.y}
            stroke={a.style.strokeColor}
            strokeWidth={a.style.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDash}
            markerEnd={
              a.endHead !== "none" ? `url(#${mid})` : undefined
            }
          />
          {selRect(a.x, a.y, a.width || 1, a.height || 1)}
          {eraseHighlight(a.x, a.y, a.width || 1, a.height || 1)}
        </g>
      );
    }

    case "text": {
      const t = el as TextElement;
      return (
        <g
          onPointerDown={handlePD}
          style={elStyle}
          transform={`translate(${t.x}, ${t.y}) rotate(${t.rotation} ${t.width / 2} ${t.height / 2})`}
        >
          {/* Invisible hit area */}
          <rect
            width={t.width}
            height={t.height}
            fill="transparent"
            stroke="none"
          />
          <text
            x={
              t.style.textAlign === "center"
                ? t.width / 2
                : t.style.textAlign === "right"
                  ? t.width
                  : 0
            }
            y={t.style.fontSize}
            fill={t.style.strokeColor}
            fontSize={t.style.fontSize}
            fontFamily={getFontCss(t.style.fontFamily)}
            textAnchor={
              t.style.textAlign === "center"
                ? "middle"
                : t.style.textAlign === "right"
                  ? "end"
                  : "start"
            }
          >
            {t.text}
          </text>
          {selRect(0, 0, t.width, t.height)}
          {eraseHighlight(0, 0, t.width, t.height)}
        </g>
      );
    }

    case "sticky": {
      const st = el as StickyElement;
      return (
        <g
          onPointerDown={handlePD}
          style={elStyle}
          transform={`translate(${st.x}, ${st.y}) rotate(${st.rotation} ${st.width / 2} ${st.height / 2})`}
        >
          <rect
            width={st.width}
            height={st.height}
            fill={st.stickyColor}
            rx={4}
            filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.15))"
          />
          <foreignObject
            x={8}
            y={8}
            width={st.width - 16}
            height={st.height - 16}
          >
            <div
              style={{
                fontSize: st.style.fontSize,
                fontFamily: "'Inter', sans-serif",
                color: "#1a1a1a",
                wordWrap: "break-word",
                overflow: "hidden",
                height: "100%",
              }}
            >
              {st.text}
            </div>
          </foreignObject>
          {selRect(0, 0, st.width, st.height)}
          {eraseHighlight(0, 0, st.width, st.height)}
        </g>
      );
    }

    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Style Panel (right sidebar)
// ═══════════════════════════════════════════════════════════════

function StylePanel() {
  const currentStyle = useSketchBoardEditor((s) => s.currentStyle);
  const setCurrentStyle = useSketchBoardEditor((s) => s.setCurrentStyle);
  const selectedIds = useSketchBoardEditor((s) => s.selectedIds);
  const setElementStyle = useSketchBoardEditor((s) => s.setElementStyle);

  const updateStyle = useCallback(
    (patch: Partial<typeof currentStyle>) => {
      setCurrentStyle(patch);
      for (const id of selectedIds) {
        setElementStyle(id, patch);
      }
    },
    [setCurrentStyle, selectedIds, setElementStyle]
  );

  return (
    <div className="flex flex-col gap-3 p-3 w-56 shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
        Style
      </h3>

      {/* Stroke color */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Stroke</p>
        <div className="flex flex-wrap gap-1">
          {STROKE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => updateStyle({ strokeColor: c })}
              className={`w-6 h-6 rounded-full border-2 ${
                currentStyle.strokeColor === c
                  ? "border-primary-500"
                  : "border-gray-200 dark:border-gray-600"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Fill color */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fill</p>
        <div className="flex flex-wrap gap-1">
          {FILL_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => updateStyle({ fillColor: c })}
              className={`w-6 h-6 rounded-full border-2 ${
                currentStyle.fillColor === c
                  ? "border-primary-500"
                  : "border-gray-200 dark:border-gray-600"
              } ${c === "transparent" ? "bg-gray-100 dark:bg-gray-800" : ""}`}
              style={c !== "transparent" ? { backgroundColor: c } : undefined}
              title={c === "transparent" ? "No fill" : c}
            >
              {c === "transparent" && (
                <span className="text-xs text-gray-400">∅</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke width */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          Stroke Width: {currentStyle.strokeWidth}px
        </p>
        <input
          type="range"
          min={1}
          max={12}
          value={currentStyle.strokeWidth}
          onChange={(e) =>
            updateStyle({ strokeWidth: Number(e.target.value) })
          }
          className="w-full accent-primary-500"
        />
      </div>

      {/* Dash style */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Dash</p>
        <div className="flex gap-1">
          {(["solid", "dashed", "dotted"] as const).map((ds) => (
            <button
              key={ds}
              onClick={() => updateStyle({ dashStyle: ds })}
              className={`px-2 py-1 text-xs rounded ${
                currentStyle.dashStyle === ds
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {ds}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          Opacity: {Math.round(currentStyle.opacity * 100)}%
        </p>
        <input
          type="range"
          min={10}
          max={100}
          value={currentStyle.opacity * 100}
          onChange={(e) =>
            updateStyle({ opacity: Number(e.target.value) / 100 })
          }
          className="w-full accent-primary-500"
        />
      </div>

      {/* Font size */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          Font Size: {currentStyle.fontSize}px
        </p>
        <input
          type="range"
          min={12}
          max={72}
          value={currentStyle.fontSize}
          onChange={(e) =>
            updateStyle({ fontSize: Number(e.target.value) })
          }
          className="w-full accent-primary-500"
        />
      </div>

      {/* Font family */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Font</p>
        <div className="flex flex-wrap gap-1">
          {(["hand", "sans", "serif", "mono"] as const).map((ff) => (
            <button
              key={ff}
              onClick={() => updateStyle({ fontFamily: ff })}
              className={`px-2 py-1 text-xs rounded ${
                currentStyle.fontFamily === ff
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {ff}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SketchCanvas — main infinite canvas (V2 with ref-based state)
// ═══════════════════════════════════════════════════════════════

function SketchCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);

  // Read reactive state for rendering
  const doc = useSketchBoardEditor((s) => s.doc);
  const activeTool = useSketchBoardEditor((s) => s.activeTool);
  const selectedIds = useSketchBoardEditor((s) => s.selectedIds);

  // Store actions (stable references)
  const setCamera = useSketchBoardEditor((s) => s.setCamera);
  const setSelectedIds = useSketchBoardEditor((s) => s.setSelectedIds);
  const deselectAll = useSketchBoardEditor((s) => s.deselectAll);
  const addFreehand = useSketchBoardEditor((s) => s.addFreehand);
  const addRectangle = useSketchBoardEditor((s) => s.addRectangle);
  const addEllipse = useSketchBoardEditor((s) => s.addEllipse);
  const addDiamond = useSketchBoardEditor((s) => s.addDiamond);
  const addTriangle = useSketchBoardEditor((s) => s.addTriangle);
  const addLine = useSketchBoardEditor((s) => s.addLine);
  const addArrow = useSketchBoardEditor((s) => s.addArrow);
  const addText = useSketchBoardEditor((s) => s.addText);
  const addSticky = useSketchBoardEditor((s) => s.addSticky);
  const moveElement = useSketchBoardEditor((s) => s.moveElement);
  const removeElements = useSketchBoardEditor((s) => s.removeElements);
  const setActiveTool = useSketchBoardEditor((s) => s.setActiveTool);

  // ── Interaction refs (avoid stale closures) ──
  const isDrawingRef = useRef(false);
  const drawPointsRef = useRef<Point[]>([]);
  const shapeStartRef = useRef<Point | null>(null);
  const shapeEndRef = useRef<Point | null>(null);
  const dragRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const panRef = useRef<{
    cx: number;
    cy: number;
    mx: number;
    my: number;
  } | null>(null);
  const eraserIdsRef = useRef<Set<string>>(new Set());

  // ── Preview state (for rendering) ──
  const [drawPreview, setDrawPreview] = useState<Point[]>([]);
  const [previewShape, setPreviewShape] = useState<{
    type: string;
    x: number;
    y: number;
    w: number;
    h: number;
    startPt: Point;
    endPt: Point;
  } | null>(null);
  const [eraserPreviewIds, setEraserPreviewIds] = useState<Set<string>>(
    () => new Set()
  );

  const bgColor = useMemo(() => {
    const preset = BACKGROUND_PRESETS.find((b) => b.id === doc.background);
    return preset?.value ?? "#ffffff";
  }, [doc.background]);

  /** Convert screen coordinates to canvas coordinates */
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: clientX, y: clientY };
      const cam = useSketchBoardEditor.getState().doc.camera;
      return {
        x: (clientX - rect.left - cam.x) / cam.zoom,
        y: (clientY - rect.top - cam.y) / cam.zoom,
      };
    },
    []
  );

  // ── Pointer Handlers (read store directly -> no stale closures) ──

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const tool = useSketchBoardEditor.getState().activeTool;
      const pt = screenToCanvas(e.clientX, e.clientY);

      // Pan / Hand tool
      if (tool === "hand") {
        const cam = useSketchBoardEditor.getState().doc.camera;
        panRef.current = { cx: cam.x, cy: cam.y, mx: e.clientX, my: e.clientY };
        isDrawingRef.current = true;
        return;
      }

      // Select tool — click on blank = deselect
      if (tool === "select") {
        deselectAll();
        return;
      }

      // Eraser — start eraser sweep
      if (tool === "eraser") {
        eraserIdsRef.current = new Set();
        isDrawingRef.current = true;
        // Check initial hit
        const elements = useSketchBoardEditor.getState().doc.elements;
        for (const el of elements) {
          if (!el.locked && hitTestPoint(el, pt.x, pt.y)) {
            eraserIdsRef.current.add(el.id);
          }
        }
        setEraserPreviewIds(new Set(eraserIdsRef.current));
        return;
      }

      // Draw tool
      if (tool === "draw") {
        drawPointsRef.current = [pt];
        setDrawPreview([pt]);
        isDrawingRef.current = true;
        return;
      }

      // Shape / Line / Arrow tools
      if (
        [
          "rectangle",
          "ellipse",
          "diamond",
          "triangle",
          "line",
          "arrow",
        ].includes(tool)
      ) {
        shapeStartRef.current = pt;
        shapeEndRef.current = pt;
        isDrawingRef.current = true;
        return;
      }

      // Text tool — single click creates text
      if (tool === "text") {
        addText(pt.x, pt.y, "Text");
        setActiveTool("select");
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
        return;
      }

      // Sticky note tool
      if (tool === "sticky") {
        addSticky(pt.x, pt.y, "Note");
        setActiveTool("select");
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
        return;
      }
    },
    [screenToCanvas, deselectAll, addText, addSticky, setActiveTool]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current) return;
      const tool = useSketchBoardEditor.getState().activeTool;

      // Pan
      if (tool === "hand" && panRef.current) {
        const cam = useSketchBoardEditor.getState().doc.camera;
        const dx = e.clientX - panRef.current.mx;
        const dy = e.clientY - panRef.current.my;
        setCamera({
          x: panRef.current.cx + dx,
          y: panRef.current.cy + dy,
          zoom: cam.zoom,
        });
        return;
      }

      const pt = screenToCanvas(e.clientX, e.clientY);

      // Eraser sweep — detect elements under cursor
      if (tool === "eraser") {
        const elements = useSketchBoardEditor.getState().doc.elements;
        for (const el of elements) {
          if (!el.locked && hitTestPoint(el, pt.x, pt.y)) {
            eraserIdsRef.current.add(el.id);
          }
        }
        setEraserPreviewIds(new Set(eraserIdsRef.current));
        return;
      }

      // Freehand draw
      if (tool === "draw") {
        drawPointsRef.current.push(pt);
        setDrawPreview([...drawPointsRef.current]);
        return;
      }

      // Shape / line / arrow preview
      if (shapeStartRef.current) {
        const sx = shapeStartRef.current.x;
        const sy = shapeStartRef.current.y;
        shapeEndRef.current = pt;
        setPreviewShape({
          type: tool,
          x: Math.min(sx, pt.x),
          y: Math.min(sy, pt.y),
          w: Math.abs(pt.x - sx),
          h: Math.abs(pt.y - sy),
          startPt: { x: sx, y: sy },
          endPt: { x: pt.x, y: pt.y },
        });
        return;
      }

      // Drag element
      if (dragRef.current) {
        const dx = pt.x - dragRef.current.x;
        const dy = pt.y - dragRef.current.y;
        moveElement(dragRef.current.id, dx, dy);
        dragRef.current.x = pt.x;
        dragRef.current.y = pt.y;
      }
    },
    [screenToCanvas, setCamera, moveElement]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current && !dragRef.current) return;
    const tool = useSketchBoardEditor.getState().activeTool;

    // Pan end
    if (tool === "hand") {
      panRef.current = null;
      isDrawingRef.current = false;
      return;
    }

    // Eraser — delete everything swept over
    if (tool === "eraser") {
      if (eraserIdsRef.current.size > 0) {
        removeElements(Array.from(eraserIdsRef.current));
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
      }
      eraserIdsRef.current = new Set();
      setEraserPreviewIds(new Set());
      isDrawingRef.current = false;
      return;
    }

    // Freehand draw end
    if (tool === "draw") {
      if (drawPointsRef.current.length > 1) {
        addFreehand(drawPointsRef.current);
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
      }
      drawPointsRef.current = [];
      setDrawPreview([]);
      isDrawingRef.current = false;
      return;
    }

    // Shape creation
    if (shapeStartRef.current && previewShape && (previewShape.w > 3 || previewShape.h > 3)) {
      const { x, y, w, h, startPt, endPt } = previewShape;
      switch (tool) {
        case "rectangle":
          addRectangle(x, y, w, h);
          break;
        case "ellipse":
          addEllipse(x, y, w, h);
          break;
        case "diamond":
          addDiamond(x, y, w, h);
          break;
        case "triangle":
          addTriangle(x, y, w, h);
          break;
        case "line":
          addLine(startPt.x, startPt.y, endPt.x, endPt.y);
          break;
        case "arrow":
          addArrow(startPt.x, startPt.y, endPt.x, endPt.y);
          break;
      }
      window.dispatchEvent(new CustomEvent("workspace:dirty"));
    }

    shapeStartRef.current = null;
    shapeEndRef.current = null;
    setPreviewShape(null);
    dragRef.current = null;
    isDrawingRef.current = false;
  }, [
    previewShape,
    removeElements,
    addFreehand,
    addRectangle,
    addEllipse,
    addDiamond,
    addTriangle,
    addLine,
    addArrow,
  ]);

  /** Element pointer-down: select + drag / eraser click */
  const handleElementPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.stopPropagation();
      const tool = useSketchBoardEditor.getState().activeTool;

      // Eraser click-on-element → instant delete
      if (tool === "eraser") {
        removeElements([id]);
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
        return;
      }

      if (tool !== "select") return;

      const currentSelected = useSketchBoardEditor.getState().selectedIds;
      if (e.shiftKey) {
        // Multi-select toggle
        setSelectedIds(
          currentSelected.includes(id)
            ? currentSelected.filter((s) => s !== id)
            : [...currentSelected, id]
        );
      } else {
        setSelectedIds([id]);
      }

      // Start drag
      const pt = screenToCanvas(e.clientX, e.clientY);
      dragRef.current = { id, x: pt.x, y: pt.y };
      isDrawingRef.current = true;
    },
    [screenToCanvas, setSelectedIds, removeElements]
  );

  // ── Mouse wheel zoom (toward cursor) ──
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const cam = useSketchBoardEditor.getState().doc.camera;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(8, cam.zoom * factor));
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        setCamera({
          x: mx - (mx - cam.x) * (newZoom / cam.zoom),
          y: my - (my - cam.y) * (newZoom / cam.zoom),
          zoom: newZoom,
        });
      } else {
        setCamera({ ...cam, zoom: newZoom });
      }
    },
    [setCamera]
  );

  // Sort elements by z-index for rendering
  const sortedElements = useMemo(
    () => [...doc.elements].sort((a, b) => a.zIndex - b.zIndex),
    [doc.elements]
  );

  const gridSize = doc.grid.size * doc.camera.zoom;

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{
          cursor:
            activeTool === "hand"
              ? isDrawingRef.current
                ? "grabbing"
                : "grab"
              : activeTool === "draw" || activeTool === "eraser"
                ? "crosshair"
                : activeTool === "text"
                  ? "text"
                  : activeTool === "select"
                    ? "default"
                    : "crosshair",
          touchAction: "none",
        }}
      >
        {/* Grid dots */}
        {doc.grid.enabled && gridSize > 4 && (
          <>
            <defs>
              <pattern
                id="grid-pattern"
                width={gridSize}
                height={gridSize}
                patternUnits="userSpaceOnUse"
                x={doc.camera.x % gridSize}
                y={doc.camera.y % gridSize}
              >
                <circle
                  cx={gridSize / 2}
                  cy={gridSize / 2}
                  r={1}
                  fill="#9ca3af"
                  fillOpacity={0.3}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </>
        )}

        {/* Canvas transform group */}
        <g
          transform={`translate(${doc.camera.x}, ${doc.camera.y}) scale(${doc.camera.zoom})`}
        >
          {/* Rendered elements */}
          {sortedElements.map((el) => (
            <RenderElement
              key={el.id}
              el={el}
              isSelected={selectedIds.includes(el.id)}
              isEraseTarget={eraserPreviewIds.has(el.id)}
              onPointerDown={handleElementPointerDown}
            />
          ))}

          {/* Live freehand preview */}
          {drawPreview.length > 1 && (
            <path
              d={getDrawPath(drawPreview)}
              fill="none"
              stroke={
                useSketchBoardEditor.getState().currentStyle.strokeColor
              }
              strokeWidth={
                useSketchBoardEditor.getState().currentStyle.strokeWidth
              }
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.6}
              pointerEvents="none"
            />
          )}

          {/* Shape preview */}
          {previewShape && (
            <>
              {previewShape.type === "rectangle" && (
                <rect
                  x={previewShape.x}
                  y={previewShape.y}
                  width={previewShape.w}
                  height={previewShape.h}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  rx={4}
                  pointerEvents="none"
                />
              )}
              {previewShape.type === "ellipse" && (
                <ellipse
                  cx={previewShape.x + previewShape.w / 2}
                  cy={previewShape.y + previewShape.h / 2}
                  rx={previewShape.w / 2}
                  ry={previewShape.h / 2}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  pointerEvents="none"
                />
              )}
              {previewShape.type === "diamond" && (
                <polygon
                  points={`${previewShape.x + previewShape.w / 2},${previewShape.y} ${previewShape.x + previewShape.w},${previewShape.y + previewShape.h / 2} ${previewShape.x + previewShape.w / 2},${previewShape.y + previewShape.h} ${previewShape.x},${previewShape.y + previewShape.h / 2}`}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  pointerEvents="none"
                />
              )}
              {previewShape.type === "triangle" && (
                <polygon
                  points={`${previewShape.x + previewShape.w / 2},${previewShape.y} ${previewShape.x + previewShape.w},${previewShape.y + previewShape.h} ${previewShape.x},${previewShape.y + previewShape.h}`}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  pointerEvents="none"
                />
              )}
              {(previewShape.type === "line" ||
                previewShape.type === "arrow") && (
                <line
                  x1={previewShape.startPt.x}
                  y1={previewShape.startPt.y}
                  x2={previewShape.endPt.x}
                  y2={previewShape.endPt.y}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  pointerEvents="none"
                />
              )}
            </>
          )}
        </g>
      </svg>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 select-none">
        {Math.round(doc.camera.zoom * 100)}%
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Toolbar (tool picker in top bar)
// ═══════════════════════════════════════════════════════════════

function Toolbar() {
  const activeTool = useSketchBoardEditor((s) => s.activeTool);
  const setActiveTool = useSketchBoardEditor((s) => s.setActiveTool);

  return (
    <div className="flex items-center gap-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-1 py-1 shadow-lg">
      {TOOL_DEFS.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTool(t.id)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
            activeTool === t.id
              ? "bg-primary-500 text-white"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Top Bar (title, toolbar, actions, export)
// ═══════════════════════════════════════════════════════════════

function TopBar() {
  const title = useSketchBoardEditor((s) => s.doc.title);
  const setTitle = useSketchBoardEditor((s) => s.setTitle);
  const doc = useSketchBoardEditor((s) => s.doc);
  const selectedIds = useSketchBoardEditor((s) => s.selectedIds);
  const removeElements = useSketchBoardEditor((s) => s.removeElements);
  const zoomIn = useSketchBoardEditor((s) => s.zoomIn);
  const zoomOut = useSketchBoardEditor((s) => s.zoomOut);
  const resetZoom = useSketchBoardEditor((s) => s.resetZoom);
  const toggleGrid = useSketchBoardEditor((s) => s.toggleGrid);
  const fitToContent = useSketchBoardEditor((s) => s.fitToContent);
  const setBackground = useSketchBoardEditor((s) => s.setBackground);
  const bringToFront = useSketchBoardEditor((s) => s.bringToFront);
  const sendToBack = useSketchBoardEditor((s) => s.sendToBack);
  const duplicateSelected = useSketchBoardEditor((s) => s.duplicateSelected);

  const [showBg, setShowBg] = useState(false);

  const handleExportPNG = useCallback(() => {
    doExportPNG(useSketchBoardEditor.getState().doc);
  }, []);

  const handleExportSVG = useCallback(() => {
    doExportSVG(useSketchBoardEditor.getState().doc);
  }, []);

  const handleUndo = useCallback(() => {
    useSketchBoardEditor.temporal.getState().undo();
  }, []);

  const handleRedo = useCallback(() => {
    useSketchBoardEditor.temporal.getState().redo();
  }, []);

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 gap-2 shrink-0">
      {/* Left: Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          window.dispatchEvent(new CustomEvent("workspace:dirty"));
        }}
        className="bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 border-none outline-none w-48 truncate"
        placeholder="Board title..."
      />

      {/* Center: Toolbar */}
      <Toolbar />

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Undo / Redo */}
        <button
          onClick={handleUndo}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Undo (Ctrl+Z)"
        >
          <IconUndo className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Redo (Ctrl+Y)"
        >
          <IconRedo className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Zoom */}
        <button
          onClick={zoomOut}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Zoom out"
        >
          <IconZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetZoom}
          className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          title="Reset zoom"
        >
          {Math.round(doc.camera.zoom * 100)}%
        </button>
        <button
          onClick={zoomIn}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Zoom in"
        >
          <IconZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Grid */}
        <button
          onClick={toggleGrid}
          className={`px-2 py-1 text-xs rounded-lg ${
            doc.grid.enabled
              ? "bg-primary-500/20 text-primary-600 dark:text-primary-400"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title="Toggle grid"
        >
          Grid
        </button>

        {/* Fit */}
        <button
          onClick={fitToContent}
          className="px-2 py-1 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Fit to content"
        >
          Fit
        </button>

        {/* Background */}
        <div className="relative">
          <button
            onClick={() => setShowBg(!showBg)}
            className="px-2 py-1 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Background"
          >
            BG
          </button>
          {showBg && (
            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50 flex flex-col gap-1 min-w-28">
              {BACKGROUND_PRESETS.map((bp) => (
                <button
                  key={bp.id}
                  onClick={() => {
                    setBackground(bp.id);
                    setShowBg(false);
                    window.dispatchEvent(new CustomEvent("workspace:dirty"));
                  }}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-xs text-left ${
                    doc.background === bp.id
                      ? "bg-primary-500/20 text-primary-600"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 shrink-0"
                    style={{ backgroundColor: bp.value }}
                  />
                  {bp.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Selection actions */}
        {selectedIds.length > 0 && (
          <>
            <button
              onClick={() => duplicateSelected()}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Duplicate"
            >
              <IconPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (selectedIds[0]) bringToFront(selectedIds[0]);
              }}
              className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Bring to front"
            >
              ↑
            </button>
            <button
              onClick={() => {
                if (selectedIds[0]) sendToBack(selectedIds[0]);
              }}
              className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Send to back"
            >
              ↓
            </button>
            <button
              onClick={() => {
                removeElements(selectedIds);
                window.dispatchEvent(new CustomEvent("workspace:dirty"));
              }}
              className="p-1.5 rounded-lg text-error hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete selected"
            >
              <IconTrash className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
          </>
        )}

        {/* Export */}
        <button
          onClick={handleExportPNG}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-primary-500 text-white hover:bg-primary-600"
          title="Export PNG"
        >
          <IconDownload className="w-3.5 h-3.5" />
          PNG
        </button>
        <button
          onClick={handleExportSVG}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          title="Export SVG"
        >
          <IconDownload className="w-3.5 h-3.5" />
          SVG
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Workspace
// ═══════════════════════════════════════════════════════════════

export default function SketchBoardWorkspace() {
  // ── Chiko Integration ──
  useChikoActions(
    useCallback(() => createSketchBoardManifest(useSketchBoardEditor), [])
  );

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const state = useSketchBoardEditor.getState();

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useSketchBoardEditor.temporal.getState().undo();
        return;
      }
      // Redo
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        useSketchBoardEditor.temporal.getState().redo();
        return;
      }
      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedIds.length > 0) {
          e.preventDefault();
          state.removeElements(state.selectedIds);
          window.dispatchEvent(new CustomEvent("workspace:dirty"));
        }
        return;
      }
      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        state.selectAll();
        return;
      }
      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        if (state.selectedIds.length > 0) {
          e.preventDefault();
          state.duplicateSelected();
        }
        return;
      }
      // Escape
      if (e.key === "Escape") {
        state.deselectAll();
        state.setActiveTool("select");
        return;
      }
      // Tool shortcuts
      const toolMap: Record<string, SketchTool> = {
        v: "select",
        h: "hand",
        p: "draw",
        e: "eraser",
        r: "rectangle",
        o: "ellipse",
        d: "diamond",
        t: "text",
        l: "line",
        a: "arrow",
        s: "sticky",
      };
      if (!e.ctrlKey && !e.metaKey && !e.altKey && toolMap[e.key]) {
        state.setActiveTool(toolMap[e.key]);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Fire initial workspace progress if board has content ──
  const hasDispatchedRef = useRef(false);
  useEffect(() => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;
    const state = useSketchBoardEditor.getState();
    if (state.doc.elements.length > 0) {
      window.dispatchEvent(
        new CustomEvent("workspace:progress", {
          detail: { progress: 50, milestone: "content" },
        })
      );
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <SketchCanvas />
        <StylePanel />
      </div>
    </div>
  );
}
