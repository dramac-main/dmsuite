"use client";

/* ─────────────────────────────────────────────────────────────
   Sketch Board Workspace  — V4 Complete Rewrite
   Excalidraw-quality infinite canvas whiteboard

   Key features:
   - Inline text editing (double-click to re-edit)
   - Manual polygon arrowheads (no SVG markers)
   - Smooth eraser with visual cursor
   - Undo/Redo bar at bottom-left (Excalidraw convention)
   - Marquee drag-select for multi-selection
   - Pointer capture for reliable drag
   - Clean SVG/PNG export (no foreignObject)
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
  IconCopy,
} from "@/components/icons";

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const TOOL_DEFS: { id: SketchTool; label: string; shortcut: string; icon: string }[] = [
  { id: "select", label: "Select", shortcut: "V", icon: "⇲" },
  { id: "hand", label: "Pan", shortcut: "H", icon: "✋" },
  { id: "draw", label: "Draw", shortcut: "P", icon: "✏️" },
  { id: "eraser", label: "Erase", shortcut: "E", icon: "🧹" },
  { id: "rectangle", label: "Rectangle", shortcut: "R", icon: "▭" },
  { id: "ellipse", label: "Ellipse", shortcut: "O", icon: "◯" },
  { id: "diamond", label: "Diamond", shortcut: "D", icon: "◇" },
  { id: "triangle", label: "Triangle", shortcut: "G", icon: "△" },
  { id: "line", label: "Line", shortcut: "L", icon: "╱" },
  { id: "arrow", label: "Arrow", shortcut: "A", icon: "→" },
  { id: "text", label: "Text", shortcut: "T", icon: "T" },
  { id: "sticky", label: "Sticky", shortcut: "S", icon: "📝" },
];

const MIN_SHAPE_SIZE = 4;

// ═══════════════════════════════════════════════════════════════
// Geometry helpers
// ═══════════════════════════════════════════════════════════════

/** Build smoothed SVG path from freehand points */
function drawPathD(pts: Point[]): string {
  if (!pts.length) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} l 0.1 0`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1],
      c = pts[i];
    const mx = (p.x + c.x) / 2,
      my = (p.y + c.y) / 2;
    d += ` Q ${p.x} ${p.y} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/** Manual arrowhead polygon (no SVG markers!) */
function arrowheadPts(from: Point, to: Point, size = 16): [Point, Point] {
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  return [
    { x: to.x - size * Math.cos(ang - Math.PI / 7), y: to.y - size * Math.sin(ang - Math.PI / 7) },
    { x: to.x - size * Math.cos(ang + Math.PI / 7), y: to.y - size * Math.sin(ang + Math.PI / 7) },
  ];
}

/** Get AABB for an element in canvas coords */
function aabb(el: SketchElement): { x1: number; y1: number; x2: number; y2: number } {
  if (el.type === "draw") {
    const d = el as DrawElement;
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const p of d.points) { x1 = Math.min(x1, p.x); y1 = Math.min(y1, p.y); x2 = Math.max(x2, p.x); y2 = Math.max(y2, p.y); }
    return { x1, y1, x2, y2 };
  }
  if (el.type === "line" || el.type === "arrow") {
    const l = el as LineElement;
    return { x1: Math.min(l.start.x, l.end.x), y1: Math.min(l.start.y, l.end.y), x2: Math.max(l.start.x, l.end.x), y2: Math.max(l.start.y, l.end.y) };
  }
  return { x1: el.x, y1: el.y, x2: el.x + el.width, y2: el.y + el.height };
}

/** AABB intersection test */
function rectsIntersect(
  a: { x1: number; y1: number; x2: number; y2: number },
  b: { x1: number; y1: number; x2: number; y2: number },
): boolean {
  return a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;
}

/** Point-to-element hit test (radius-based, for eraser & select) */
function hitTestPt(el: SketchElement, px: number, py: number, pad = 12): boolean {
  switch (el.type) {
    case "draw":
    case "eraser": {
      const d = el as DrawElement;
      for (let i = 1; i < d.points.length; i++) {
        const ax = d.points[i - 1].x, ay = d.points[i - 1].y;
        const bx = d.points[i].x, by = d.points[i].y;
        const dx = bx - ax, dy = by - ay;
        const len2 = dx * dx + dy * dy;
        const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
        if (Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) < pad + d.style.strokeWidth) return true;
      }
      return d.points.length === 1 && Math.hypot(px - d.points[0].x, py - d.points[0].y) < pad;
    }
    case "line":
    case "arrow": {
      const l = el as LineElement;
      const dx = l.end.x - l.start.x, dy = l.end.y - l.start.y;
      const len2 = dx * dx + dy * dy;
      const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - l.start.x) * dx + (py - l.start.y) * dy) / len2)) : 0;
      return Math.hypot(px - (l.start.x + t * dx), py - (l.start.y + t * dy)) < pad + l.style.strokeWidth;
    }
    default:
      return px >= el.x - pad && px <= el.x + el.width + pad && py >= el.y - pad && py <= el.y + el.height + pad;
  }
}

/** Font CSS from key */
function fontCss(f: string) {
  switch (f) {
    case "hand": return "'Segoe UI', system-ui, sans-serif";
    case "mono": return "'JetBrains Mono', monospace";
    case "serif": return "Georgia, serif";
    default: return "'Inter', sans-serif";
  }
}

function escXml(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function dashAttr(ds: string) { return ds === "dashed" ? ' stroke-dasharray="8 4"' : ds === "dotted" ? ' stroke-dasharray="2 4"' : ""; }
function dashVal(ds: string) { return ds === "dashed" ? "8 4" : ds === "dotted" ? "2 4" : undefined; }

// ═══════════════════════════════════════════════════════════════
// SVG Export helpers (clean, no foreignObject)
// ═══════════════════════════════════════════════════════════════

function contentBounds(elems: SketchElement[]) {
  if (!elems.length) return { x: 0, y: 0, w: 800, h: 600 };
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const el of elems) {
    const b = aabb(el);
    x1 = Math.min(x1, b.x1); y1 = Math.min(y1, b.y1);
    x2 = Math.max(x2, b.x2); y2 = Math.max(y2, b.y2);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function elToSVG(el: SketchElement): string {
  const da = dashAttr(el.style.dashStyle);
  const op = el.style.opacity !== 1 ? ` opacity="${el.style.opacity}"` : "";
  switch (el.type) {
    case "draw": {
      const d = el as DrawElement;
      return `<path d="${drawPathD(d.points)}" fill="none" stroke="${d.style.strokeColor}" stroke-width="${d.style.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${da}${op}/>`;
    }
    case "eraser": return "";
    case "rectangle": {
      const tr = `translate(${el.x},${el.y}) rotate(${el.rotation} ${el.width / 2} ${el.height / 2})`;
      return `<g transform="${tr}"><rect width="${el.width}" height="${el.height}" fill="${el.style.fillColor}" stroke="${el.style.strokeColor}" stroke-width="${el.style.strokeWidth}"${da} rx="4"${op}/></g>`;
    }
    case "ellipse": {
      const tr = `translate(${el.x},${el.y}) rotate(${el.rotation} ${el.width / 2} ${el.height / 2})`;
      return `<g transform="${tr}"><ellipse cx="${el.width / 2}" cy="${el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${el.style.fillColor}" stroke="${el.style.strokeColor}" stroke-width="${el.style.strokeWidth}"${da}${op}/></g>`;
    }
    case "diamond": {
      const cx = el.width / 2, cy = el.height / 2;
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
      let s = `<line x1="${a.start.x}" y1="${a.start.y}" x2="${a.end.x}" y2="${a.end.y}" stroke="${a.style.strokeColor}" stroke-width="${a.style.strokeWidth}" stroke-linecap="round"${da}${op}/>`;
      if (a.endHead !== "none") {
        const headSize = Math.max(14, a.style.strokeWidth * 3.5);
        const [p1, p2] = arrowheadPts(a.start, a.end, headSize);
        s += `<polygon points="${a.end.x},${a.end.y} ${p1.x},${p1.y} ${p2.x},${p2.y}" fill="${a.style.strokeColor}"${op}/>`;
      }
      return s;
    }
    case "text": {
      const t = el as TextElement;
      const anc = t.style.textAlign === "center" ? "middle" : t.style.textAlign === "right" ? "end" : "start";
      const tx = t.style.textAlign === "center" ? t.width / 2 : t.style.textAlign === "right" ? t.width : 4;
      const tr = `translate(${t.x},${t.y}) rotate(${t.rotation} ${t.width / 2} ${t.height / 2})`;
      const lines = t.text.split("\n");
      const tspans = lines.map((line, i) =>
        `<tspan x="${tx}" dy="${i === 0 ? t.style.fontSize : t.style.fontSize + 2}">${escXml(line)}</tspan>`
      ).join("");
      return `<g transform="${tr}"><text fill="${t.style.strokeColor}" font-size="${t.style.fontSize}" font-family="${fontCss(t.style.fontFamily)}" text-anchor="${anc}"${op}>${tspans}</text></g>`;
    }
    case "sticky": {
      const st = el as StickyElement;
      const tr = `translate(${st.x},${st.y}) rotate(${st.rotation} ${st.width / 2} ${st.height / 2})`;
      const lines = st.text.split("\n");
      const fs = Math.min(st.style.fontSize, 16);
      const tspans = lines.map((line, i) =>
        `<tspan x="10" dy="${i === 0 ? fs + 4 : fs + 2}">${escXml(line)}</tspan>`
      ).join("");
      return `<g transform="${tr}"><rect width="${st.width}" height="${st.height}" fill="${st.stickyColor}" rx="4"/><text fill="#1a1a1a" font-size="${fs}" font-family="'Inter',sans-serif">${tspans}</text></g>`;
    }
    default: return "";
  }
}

function buildExportSVG(doc: { elements: SketchElement[]; background: string; title: string }) {
  const vis = doc.elements.filter(e => e.type !== "eraser");
  const bnd = contentBounds(vis);
  const PAD = 50;
  const vx = bnd.x - PAD, vy = bnd.y - PAD;
  const vw = Math.max(bnd.w + PAD * 2, 200), vh = Math.max(bnd.h + PAD * 2, 200);
  const bg = BACKGROUND_PRESETS.find(b => b.id === doc.background)?.value ?? "#ffffff";
  const sorted = [...vis].sort((a, b) => a.zIndex - b.zIndex);
  const body = sorted.map(el => elToSVG(el)).filter(Boolean).join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="${vw}" height="${vh}">\n  <!-- ${escXml(doc.title)} -->\n  <rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${bg}"/>\n  ${body}\n</svg>`;
}

function exportSVG() {
  const doc = useSketchBoardEditor.getState().doc;
  const blob = new Blob([buildExportSVG(doc)], { type: "image/svg+xml;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${doc.title.replace(/[^a-zA-Z0-9 _-]/g, "_")}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
  fireEvent("workspace:save");
  fireEvent("workspace:progress", { milestone: "exported" });
}

function exportPNG() {
  const doc = useSketchBoardEditor.getState().doc;
  const svgStr = buildExportSVG(doc);
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const scale = Math.max(2, 1920 / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d")!;
    const bg = BACKGROUND_PRESETS.find(b => b.id === doc.background)?.value ?? "#ffffff";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(b => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `${doc.title.replace(/[^a-zA-Z0-9 _-]/g, "_")}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      fireEvent("workspace:save");
      fireEvent("workspace:progress", { milestone: "exported" });
    }, "image/png", 1.0);
    URL.revokeObjectURL(url);
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

function fireEvent(name: string, detail?: Record<string, unknown>) {
  window.dispatchEvent(detail ? new CustomEvent(name, { detail }) : new CustomEvent(name));
}

// ═══════════════════════════════════════════════════════════════
// RenderElement — SVG rendering per element type
// ═══════════════════════════════════════════════════════════════

const RenderElement = React.memo(function RenderElement({
  el, isSelected, isEraseTarget, onPointerDown, onDoubleClick,
}: {
  el: SketchElement;
  isSelected: boolean;
  isEraseTarget: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onDoubleClick: (e: React.MouseEvent, id: string) => void;
}) {
  const handlePD = useCallback((e: React.PointerEvent) => { onPointerDown(e, el.id); }, [onPointerDown, el.id]);
  const handleDC = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onDoubleClick(e, el.id); }, [onDoubleClick, el.id]);

  const sd = dashVal(el.style.dashStyle);
  const elOp = el.style.opacity;

  /* Selection / erase visual overlays */
  const selBorder = (x: number, y: number, w: number, h: number) =>
    isSelected ? <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="6 3" rx={4} pointerEvents="none" /> : null;
  const eraseHL = (x: number, y: number, w: number, h: number) =>
    isEraseTarget ? <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 3" rx={4} pointerEvents="none" /> : null;

  switch (el.type) {
    case "draw": {
      const d = el as DrawElement;
      return (
        <g onPointerDown={handlePD} onDoubleClick={handleDC} style={{ cursor: "move", opacity: elOp }}>
          <path d={drawPathD(d.points)} fill="none" stroke="transparent" strokeWidth={Math.max(d.style.strokeWidth + 14, 18)} strokeLinecap="round" />
          <path d={drawPathD(d.points)} fill="none" stroke={d.style.strokeColor} strokeWidth={d.style.strokeWidth} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={sd} />
          {selBorder(d.x, d.y, d.width, d.height)}
          {eraseHL(d.x, d.y, d.width, d.height)}
        </g>
      );
    }
    case "eraser": return null;
    case "rectangle": {
      const s = el as ShapeElement;
      return (
        <g onPointerDown={handlePD} onDoubleClick={handleDC} style={{ cursor: "move", opacity: elOp }} transform={`translate(${s.x},${s.y}) rotate(${s.rotation} ${s.width / 2} ${s.height / 2})`}>
          <rect width={s.width} height={s.height} fill={s.style.fillColor} stroke={s.style.strokeColor} strokeWidth={s.style.strokeWidth} strokeDasharray={sd} rx={4} />
          {selBorder(0, 0, s.width, s.height)}
          {eraseHL(0, 0, s.width, s.height)}
        </g>
      );
    }
    case "ellipse": {
      const s = el as ShapeElement;
      return (
        <g onPointerDown={handlePD} onDoubleClick={handleDC} style={{ cursor: "move", opacity: elOp }} transform={`translate(${s.x},${s.y}) rotate(${s.rotation} ${s.width / 2} ${s.height / 2})`}>
          <ellipse cx={s.width / 2} cy={s.height / 2} rx={s.width / 2} ry={s.height / 2} fill={s.style.fillColor} stroke={s.style.strokeColor} strokeWidth={s.style.strokeWidth} strokeDasharray={sd} />
          {selBorder(0, 0, s.width, s.height)}
          {eraseHL(0, 0, s.width, s.height)}
        </g>
      );
    }
    case "diamond": {
      const s = el as ShapeElement;
      const cx = s.width / 2, cy = s.height / 2;
      return (
        <g onPointerDown={handlePD} onDoubleClick={handleDC} style={{ cursor: "move", opacity: elOp }} transform={`translate(${s.x},${s.y}) rotate(${s.rotation} ${cx} ${cy})`}>
          <polygon points={`${cx},0 ${s.width},${cy} ${cx},${s.height} 0,${cy}`} fill={s.style.fillColor} stroke={s.style.strokeColor} strokeWidth={s.style.strokeWidth} strokeDasharray={sd} />
          {selBorder(0, 0, s.width, s.height)}
          {eraseHL(0, 0, s.width, s.height)}
        </g>
      );
    }
    case "triangle": {
      const s = el as ShapeElement;
      const cx = s.width / 2;
      return (
        <g onPointerDown={handlePD} onDoubleClick={handleDC} style={{ cursor: "move", opacity: elOp }} transform={`translate(${s.x},${s.y}) rotate(${s.rotation} ${cx} ${s.height / 2})`}>
          <polygon points={`${cx},0 ${s.width},${s.height} 0,${s.height}`} fill={s.style.fillColor} stroke={s.style.strokeColor} strokeWidth={s.style.strokeWidth} strokeDasharray={sd} />
          {selBorder(0, 0, s.width, s.height)}
          {eraseHL(0, 0, s.width, s.height)}
        </g>
      );
    }
    case "line": {
      const l = el as LineElement;
      return (
        <g onPointerDown={handlePD} onDoubleClick={handleDC} style={{ cursor: "move", opacity: elOp }}>
          <line x1={l.start.x} y1={l.start.y} x2={l.end.x} y2={l.end.y} stroke="transparent" strokeWidth={Math.max(l.style.strokeWidth + 14, 18)} />
          <line x1={l.start.x} y1={l.start.y} x2={l.end.x} y2={l.end.y} stroke={l.style.strokeColor} strokeWidth={l.style.strokeWidth} strokeLinecap="round" strokeDasharray={sd} />
          {selBorder(l.x, l.y, l.width || 1, l.height || 1)}
          {eraseHL(l.x, l.y, l.width || 1, l.height || 1)}
        </g>
      );
    }
    case "arrow": {
      const a = el as ArrowElement;
      const headSize = Math.max(14, a.style.strokeWidth * 3.5);
      const [hp1, hp2] = arrowheadPts(a.start, a.end, headSize);
      return (
        <g onPointerDown={handlePD} onDoubleClick={handleDC} style={{ cursor: "move", opacity: elOp }}>
          <line x1={a.start.x} y1={a.start.y} x2={a.end.x} y2={a.end.y} stroke="transparent" strokeWidth={Math.max(a.style.strokeWidth + 14, 18)} />
          <line x1={a.start.x} y1={a.start.y} x2={a.end.x} y2={a.end.y} stroke={a.style.strokeColor} strokeWidth={a.style.strokeWidth} strokeLinecap="round" strokeDasharray={sd} />
          {a.endHead !== "none" && <polygon points={`${a.end.x},${a.end.y} ${hp1.x},${hp1.y} ${hp2.x},${hp2.y}`} fill={a.style.strokeColor} />}
          {selBorder(a.x, a.y, a.width || 1, a.height || 1)}
          {eraseHL(a.x, a.y, a.width || 1, a.height || 1)}
        </g>
      );
    }
    case "text": {
      const t = el as TextElement;
      const anc = t.style.textAlign === "center" ? "middle" : t.style.textAlign === "right" ? "end" : "start";
      const tx = t.style.textAlign === "center" ? t.width / 2 : t.style.textAlign === "right" ? t.width : 4;
      const lines = t.text.split("\n");
      return (
        <g onPointerDown={handlePD} onDoubleClick={handleDC} style={{ cursor: "move", opacity: elOp }} transform={`translate(${t.x},${t.y}) rotate(${t.rotation} ${t.width / 2} ${t.height / 2})`}>
          <rect width={t.width} height={t.height} fill="transparent" stroke="none" />
          <text x={tx} fill={t.style.strokeColor} fontSize={t.style.fontSize} fontFamily={fontCss(t.style.fontFamily)} textAnchor={anc}>
            {lines.map((line, i) => (
              <tspan key={i} x={tx} dy={i === 0 ? t.style.fontSize : t.style.fontSize + 2}>{line || "\u00A0"}</tspan>
            ))}
          </text>
          {selBorder(0, 0, t.width, t.height)}
          {eraseHL(0, 0, t.width, t.height)}
        </g>
      );
    }
    case "sticky": {
      const st = el as StickyElement;
      const lines = st.text.split("\n");
      const fs = Math.min(st.style.fontSize, 16);
      return (
        <g onPointerDown={handlePD} onDoubleClick={handleDC} style={{ cursor: "move", opacity: elOp }} transform={`translate(${st.x},${st.y}) rotate(${st.rotation} ${st.width / 2} ${st.height / 2})`}>
          <rect width={st.width} height={st.height} fill={st.stickyColor} rx={4} filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.15))" />
          <text x={10} fill="#1a1a1a" fontSize={fs} fontFamily="'Inter',sans-serif">
            {lines.map((line, i) => (
              <tspan key={i} x={10} dy={i === 0 ? fs + 4 : fs + 2}>{line || "\u00A0"}</tspan>
            ))}
          </text>
          {selBorder(0, 0, st.width, st.height)}
          {eraseHL(0, 0, st.width, st.height)}
        </g>
      );
    }
    default: return null;
  }
});

// ═══════════════════════════════════════════════════════════════
// Inline Text Editor overlay (HTML on top of SVG canvas)
// ═══════════════════════════════════════════════════════════════

function InlineTextEditor({
  elementId, camera, onDone,
}: {
  elementId: string;
  camera: { x: number; y: number; zoom: number };
  onDone: () => void;
}) {
  const el = useSketchBoardEditor(s => s.doc.elements.find(e => e.id === elementId)) as TextElement | StickyElement | undefined;
  const updateText = useSketchBoardEditor(s => s.updateText);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, []);

  if (!el || !("text" in el)) { onDone(); return null; }

  const screenX = el.x * camera.zoom + camera.x;
  const screenY = el.y * camera.zoom + camera.y;
  const screenW = el.width * camera.zoom;
  const screenH = el.height * camera.zoom;
  const fontSize = (el.type === "sticky" ? Math.min(el.style.fontSize, 16) : el.style.fontSize) * camera.zoom;
  const isSticky = el.type === "sticky";

  return (
    <textarea
      ref={ref}
      defaultValue={el.text}
      onBlur={(e) => {
        const val = e.currentTarget.value.trim();
        if (val) {
          updateText(elementId, val);
          fireEvent("workspace:dirty");
        }
        onDone();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") { onDone(); return; }
        if (e.key === "Enter" && !e.shiftKey) { e.currentTarget.blur(); }
      }}
      className="absolute z-50 resize-none border-2 border-primary-500 rounded outline-none p-1"
      style={{
        left: screenX,
        top: screenY,
        width: Math.max(screenW, 100),
        minHeight: Math.max(screenH, 30),
        fontSize: Math.max(fontSize, 10),
        fontFamily: fontCss(el.style.fontFamily),
        color: isSticky ? "#1a1a1a" : el.style.strokeColor,
        backgroundColor: isSticky ? (el as StickyElement).stickyColor : "rgba(255,255,255,0.95)",
        textAlign: el.style.textAlign as React.CSSProperties["textAlign"],
        lineHeight: 1.3,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// Style Panel (right sidebar)
// ═══════════════════════════════════════════════════════════════

function StylePanel() {
  const style = useSketchBoardEditor(s => s.currentStyle);
  const setStyle = useSketchBoardEditor(s => s.setCurrentStyle);
  const selectedIds = useSketchBoardEditor(s => s.selectedIds);
  const setElStyle = useSketchBoardEditor(s => s.setElementStyle);

  const apply = useCallback((patch: Partial<typeof style>) => {
    setStyle(patch);
    for (const id of selectedIds) setElStyle(id, patch);
  }, [setStyle, selectedIds, setElStyle]);

  return (
    <div className="flex flex-col gap-3 p-3 w-52 shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto text-xs">
      <h3 className="font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Style</h3>

      {/* Stroke */}
      <div>
        <p className="text-gray-500 dark:text-gray-400 mb-1">Stroke</p>
        <div className="flex flex-wrap gap-1">
          {STROKE_COLORS.map(c => (
            <button key={c} onClick={() => apply({ strokeColor: c })} className={`w-5 h-5 rounded-full border-2 transition-transform ${style.strokeColor === c ? "border-primary-500 scale-125" : "border-gray-300 dark:border-gray-600"}`} style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
      </div>

      {/* Fill */}
      <div>
        <p className="text-gray-500 dark:text-gray-400 mb-1">Fill</p>
        <div className="flex flex-wrap gap-1">
          {FILL_COLORS.map(c => (
            <button key={c} onClick={() => apply({ fillColor: c })} className={`w-5 h-5 rounded-full border-2 transition-transform ${style.fillColor === c ? "border-primary-500 scale-125" : "border-gray-300 dark:border-gray-600"} ${c === "transparent" ? "bg-gray-100 dark:bg-gray-800" : ""}`} style={c !== "transparent" ? { backgroundColor: c } : undefined} title={c === "transparent" ? "None" : c}>
              {c === "transparent" && <span className="text-[8px] text-gray-400 flex items-center justify-center h-full">∅</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke width */}
      <div>
        <p className="text-gray-500 dark:text-gray-400 mb-1">Width: {style.strokeWidth}px</p>
        <input type="range" min={1} max={12} value={style.strokeWidth} onChange={e => apply({ strokeWidth: +e.target.value })} className="w-full accent-primary-500 h-1.5" />
      </div>

      {/* Dash */}
      <div>
        <p className="text-gray-500 dark:text-gray-400 mb-1">Dash</p>
        <div className="flex gap-1">
          {(["solid", "dashed", "dotted"] as const).map(ds => (
            <button key={ds} onClick={() => apply({ dashStyle: ds })} className={`px-2 py-0.5 rounded ${style.dashStyle === ds ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>{ds}</button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <p className="text-gray-500 dark:text-gray-400 mb-1">Opacity: {Math.round(style.opacity * 100)}%</p>
        <input type="range" min={10} max={100} value={style.opacity * 100} onChange={e => apply({ opacity: +e.target.value / 100 })} className="w-full accent-primary-500 h-1.5" />
      </div>

      {/* Font size */}
      <div>
        <p className="text-gray-500 dark:text-gray-400 mb-1">Font: {style.fontSize}px</p>
        <input type="range" min={12} max={72} value={style.fontSize} onChange={e => apply({ fontSize: +e.target.value })} className="w-full accent-primary-500 h-1.5" />
      </div>

      {/* Font family */}
      <div>
        <p className="text-gray-500 dark:text-gray-400 mb-1">Font Family</p>
        <div className="flex flex-wrap gap-1">
          {(["hand", "sans", "serif", "mono"] as const).map(ff => (
            <button key={ff} onClick={() => apply({ fontFamily: ff })} className={`px-2 py-0.5 rounded ${style.fontFamily === ff ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>{ff}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SketchCanvas — the infinite canvas (V4)
// ═══════════════════════════════════════════════════════════════

function SketchCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Reactive state for rendering */
  const doc = useSketchBoardEditor(s => s.doc);
  const camera = useSketchBoardEditor(s => s.camera);
  const grid = useSketchBoardEditor(s => s.grid);
  const activeTool = useSketchBoardEditor(s => s.activeTool);
  const selectedIds = useSketchBoardEditor(s => s.selectedIds);

  /* Store actions (stable refs) */
  const setCamera = useSketchBoardEditor(s => s.setCamera);
  const setSelectedIds = useSketchBoardEditor(s => s.setSelectedIds);
  const deselectAll = useSketchBoardEditor(s => s.deselectAll);
  const addFreehand = useSketchBoardEditor(s => s.addFreehand);
  const addRectangle = useSketchBoardEditor(s => s.addRectangle);
  const addEllipse = useSketchBoardEditor(s => s.addEllipse);
  const addDiamond = useSketchBoardEditor(s => s.addDiamond);
  const addTriangle = useSketchBoardEditor(s => s.addTriangle);
  const addLine = useSketchBoardEditor(s => s.addLine);
  const addArrow = useSketchBoardEditor(s => s.addArrow);
  const addText = useSketchBoardEditor(s => s.addText);
  const addSticky = useSketchBoardEditor(s => s.addSticky);
  const moveElement = useSketchBoardEditor(s => s.moveElement);
  const removeElements = useSketchBoardEditor(s => s.removeElements);
  const setActiveTool = useSketchBoardEditor(s => s.setActiveTool);

  /* Interaction state (refs for zero-rerender perf) */
  const activeRef = useRef(false);                    // any interaction happening
  const modeRef = useRef<"none" | "draw" | "shape" | "drag" | "pan" | "eraser" | "marquee">("none");
  const drawPtsRef = useRef<Point[]>([]);             // freehand points
  const shapeOriginRef = useRef<Point | null>(null);  // shape/line/arrow start
  const dragRef = useRef<{ id: string; px: number; py: number } | null>(null);
  const panRef = useRef<{ cx: number; cy: number; mx: number; my: number } | null>(null);
  const eraserHitRef = useRef<Set<string>>(new Set());
  const marqueeRef = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);

  /* Preview state (triggers React re-render for visual feedback) */
  const [drawPreview, setDrawPreview] = useState<Point[]>([]);
  const [shapePreview, setShapePreview] = useState<{ type: string; x: number; y: number; w: number; h: number; s: Point; e: Point } | null>(null);
  const [eraserPreviewIds, setEraserPreviewIds] = useState<Set<string>>(() => new Set());
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);

  /* Inline text editor */
  const [editingId, setEditingId] = useState<string | null>(null);

  const bgColor = useMemo(() => BACKGROUND_PRESETS.find(b => b.id === doc.background)?.value ?? "#ffffff", [doc.background]);

  /** screen → canvas */
  const s2c = useCallback((cx: number, cy: number): Point => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: cx, y: cy };
    const cam = useSketchBoardEditor.getState().camera;
    return { x: (cx - r.left - cam.x) / cam.zoom, y: (cy - r.top - cam.y) / cam.zoom };
  }, []);

  // ─── Pointer Down ──────────────────────────────────────────

  const onPD = useCallback((e: React.PointerEvent) => {
    if (e.button === 1) {
      // Middle mouse → pan
      e.preventDefault();
      const cam = useSketchBoardEditor.getState().camera;
      panRef.current = { cx: cam.x, cy: cam.y, mx: e.clientX, my: e.clientY };
      modeRef.current = "pan"; activeRef.current = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      return;
    }
    if (e.button !== 0) return;

    const tool = useSketchBoardEditor.getState().activeTool;
    const pt = s2c(e.clientX, e.clientY);
    (e.target as Element).setPointerCapture?.(e.pointerId);

    if (tool === "hand") {
      const cam = useSketchBoardEditor.getState().camera;
      panRef.current = { cx: cam.x, cy: cam.y, mx: e.clientX, my: e.clientY };
      modeRef.current = "pan"; activeRef.current = true;
      return;
    }

    if (tool === "eraser") {
      eraserHitRef.current = new Set();
      modeRef.current = "eraser"; activeRef.current = true;
      const elems = useSketchBoardEditor.getState().doc.elements;
      for (const el of elems) { if (!el.locked && hitTestPt(el, pt.x, pt.y)) eraserHitRef.current.add(el.id); }
      setEraserPreviewIds(new Set(eraserHitRef.current));
      return;
    }

    if (tool === "draw") {
      drawPtsRef.current = [pt];
      setDrawPreview([pt]);
      modeRef.current = "draw"; activeRef.current = true;
      return;
    }

    if (["rectangle", "ellipse", "diamond", "triangle", "line", "arrow"].includes(tool)) {
      shapeOriginRef.current = pt;
      modeRef.current = "shape"; activeRef.current = true;
      return;
    }

    if (tool === "text") {
      const id = addText(pt.x, pt.y, "Text");
      setActiveTool("select");
      setSelectedIds([id]);
      setEditingId(id);
      fireEvent("workspace:dirty");
      return;
    }

    if (tool === "sticky") {
      const id = addSticky(pt.x, pt.y, "Note");
      setActiveTool("select");
      setSelectedIds([id]);
      setEditingId(id);
      fireEvent("workspace:dirty");
      return;
    }

    if (tool === "select") {
      // Start marquee selection on empty canvas
      deselectAll();
      marqueeRef.current = { sx: pt.x, sy: pt.y, cx: pt.x, cy: pt.y };
      modeRef.current = "marquee"; activeRef.current = true;
      return;
    }
  }, [s2c, deselectAll, addText, addSticky, setActiveTool, setSelectedIds]);

  // ─── Pointer Move ──────────────────────────────────────────

  const onPM = useCallback((e: React.PointerEvent) => {
    const tool = useSketchBoardEditor.getState().activeTool;

    // Always track eraser cursor position
    if (tool === "eraser") {
      const r = svgRef.current?.getBoundingClientRect();
      if (r) setEraserPos({ x: e.clientX - r.left, y: e.clientY - r.top });
    }

    if (!activeRef.current) return;

    // Pan
    if (modeRef.current === "pan" && panRef.current) {
      const cam = useSketchBoardEditor.getState().camera;
      setCamera({
        x: panRef.current.cx + (e.clientX - panRef.current.mx),
        y: panRef.current.cy + (e.clientY - panRef.current.my),
        zoom: cam.zoom,
      });
      return;
    }

    const pt = s2c(e.clientX, e.clientY);

    // Eraser sweep
    if (modeRef.current === "eraser") {
      const elems = useSketchBoardEditor.getState().doc.elements;
      for (const el of elems) { if (!el.locked && hitTestPt(el, pt.x, pt.y)) eraserHitRef.current.add(el.id); }
      setEraserPreviewIds(new Set(eraserHitRef.current));
      return;
    }

    // Freehand draw
    if (modeRef.current === "draw") {
      drawPtsRef.current.push(pt);
      setDrawPreview([...drawPtsRef.current]);
      return;
    }

    // Shape / line / arrow preview
    if (modeRef.current === "shape" && shapeOriginRef.current) {
      const o = shapeOriginRef.current;
      setShapePreview({
        type: tool,
        x: Math.min(o.x, pt.x), y: Math.min(o.y, pt.y),
        w: Math.abs(pt.x - o.x), h: Math.abs(pt.y - o.y),
        s: o, e: pt,
      });
      return;
    }

    // Drag element
    if (modeRef.current === "drag" && dragRef.current) {
      const dx = pt.x - dragRef.current.px;
      const dy = pt.y - dragRef.current.py;
      moveElement(dragRef.current.id, dx, dy);
      dragRef.current.px = pt.x;
      dragRef.current.py = pt.y;
      return;
    }

    // Marquee
    if (modeRef.current === "marquee" && marqueeRef.current) {
      marqueeRef.current.cx = pt.x;
      marqueeRef.current.cy = pt.y;
      const m = marqueeRef.current;
      setMarqueeRect({
        x: Math.min(m.sx, m.cx), y: Math.min(m.sy, m.cy),
        w: Math.abs(m.cx - m.sx), h: Math.abs(m.cy - m.sy),
      });
      return;
    }
  }, [s2c, setCamera, moveElement]);

  // ─── Pointer Up ────────────────────────────────────────────

  const onPU = useCallback((e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    if (!activeRef.current) return;
    const mode = modeRef.current;

    if (mode === "pan") { panRef.current = null; }

    if (mode === "eraser") {
      if (eraserHitRef.current.size > 0) {
        removeElements(Array.from(eraserHitRef.current));
        fireEvent("workspace:dirty");
      }
      eraserHitRef.current = new Set();
      setEraserPreviewIds(new Set());
    }

    if (mode === "draw") {
      if (drawPtsRef.current.length > 1) {
        addFreehand(drawPtsRef.current);
        fireEvent("workspace:dirty");
      }
      drawPtsRef.current = [];
      setDrawPreview([]);
    }

    if (mode === "shape" && shapePreview) {
      const tool = useSketchBoardEditor.getState().activeTool;
      const { x, y, w, h, s: sp, e: ep } = shapePreview;
      if (w > MIN_SHAPE_SIZE || h > MIN_SHAPE_SIZE) {
        const mw = Math.max(w, 1), mh = Math.max(h, 1);
        let createdId: string | undefined;
        switch (tool) {
          case "rectangle": createdId = addRectangle(x, y, mw, mh); break;
          case "ellipse": createdId = addEllipse(x, y, mw, mh); break;
          case "diamond": createdId = addDiamond(x, y, mw, mh); break;
          case "triangle": createdId = addTriangle(x, y, mw, mh); break;
          case "line": createdId = addLine(sp.x, sp.y, ep.x, ep.y); break;
          case "arrow": createdId = addArrow(sp.x, sp.y, ep.x, ep.y); break;
        }
        if (createdId) {
          setSelectedIds([createdId]);
          setActiveTool("select");
        }
        fireEvent("workspace:dirty");
      }
      shapeOriginRef.current = null;
      setShapePreview(null);
    }

    if (mode === "drag") {
      dragRef.current = null;
      fireEvent("workspace:dirty");
    }

    if (mode === "marquee" && marqueeRef.current) {
      const m = marqueeRef.current;
      const box = { x1: Math.min(m.sx, m.cx), y1: Math.min(m.sy, m.cy), x2: Math.max(m.sx, m.cx), y2: Math.max(m.sy, m.cy) };
      if (box.x2 - box.x1 > 3 || box.y2 - box.y1 > 3) {
        const elems = useSketchBoardEditor.getState().doc.elements;
        const hits = elems.filter(el => !el.locked && rectsIntersect(aabb(el), box)).map(el => el.id);
        if (hits.length > 0) setSelectedIds(hits);
      }
      marqueeRef.current = null;
      setMarqueeRect(null);
    }

    modeRef.current = "none";
    activeRef.current = false;
  }, [shapePreview, removeElements, addFreehand, addRectangle, addEllipse, addDiamond, addTriangle, addLine, addArrow, setSelectedIds, setActiveTool]);

  // ─── Element pointer-down (select / drag / eraser click) ───

  const onElPD = useCallback((e: React.PointerEvent, id: string) => {
    const tool = useSketchBoardEditor.getState().activeTool;

    // Only intercept for select & eraser — all other tools should pass
    // through to the canvas so users can draw/create on top of elements
    if (tool !== "select" && tool !== "eraser") return;

    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);

    if (tool === "eraser") {
      removeElements([id]);
      fireEvent("workspace:dirty");
      return;
    }

    // Selection logic (Shift for toggle)
    const current = useSketchBoardEditor.getState().selectedIds;
    if (e.shiftKey) {
      setSelectedIds(current.includes(id) ? current.filter(s => s !== id) : [...current, id]);
    } else if (!current.includes(id)) {
      setSelectedIds([id]);
    }

    const pt = s2c(e.clientX, e.clientY);
    dragRef.current = { id, px: pt.x, py: pt.y };
    modeRef.current = "drag"; activeRef.current = true;
  }, [s2c, setSelectedIds, removeElements]);

  // ─── Double-click: edit text/sticky inline ─────────────────

  const onElDC = useCallback((_e: React.MouseEvent, id: string) => {
    const el = useSketchBoardEditor.getState().doc.elements.find(e => e.id === id);
    if (el && (el.type === "text" || el.type === "sticky")) {
      setEditingId(id);
    }
  }, []);

  // ─── Wheel zoom (toward cursor) ───────────────────────────

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const cam = useSketchBoardEditor.getState().camera;
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const nz = Math.max(0.1, Math.min(8, cam.zoom * factor));
    const r = svgRef.current?.getBoundingClientRect();
    if (r) {
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      setCamera({ x: mx - (mx - cam.x) * (nz / cam.zoom), y: my - (my - cam.y) * (nz / cam.zoom), zoom: nz });
    } else {
      setCamera({ ...cam, zoom: nz });
    }
  }, [setCamera]);

  // ─── Computed values ───────────────────────────────────────

  const sortedEls = useMemo(() => [...doc.elements].sort((a, b) => a.zIndex - b.zIndex), [doc.elements]);
  const gridPx = grid.size * camera.zoom;

  const cursor = useMemo(() => {
    switch (activeTool) {
      case "hand": return "grab";
      case "draw": return "crosshair";
      case "eraser": return "none"; // we draw a custom cursor
      case "text": return "text";
      case "select": return "default";
      default: return "crosshair";
    }
  }, [activeTool]);

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden" style={{ backgroundColor: bgColor }}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        onPointerDown={onPD}
        onPointerMove={onPM}
        onPointerUp={onPU}
        onPointerLeave={onPU}
        onWheel={onWheel}
        style={{ cursor, touchAction: "none" }}
      >
        {/* Grid dots */}
        {grid.enabled && gridPx > 4 && (
          <>
            <defs>
              <pattern id="sk-grid" width={gridPx} height={gridPx} patternUnits="userSpaceOnUse" x={camera.x % gridPx} y={camera.y % gridPx}>
                <circle cx={gridPx / 2} cy={gridPx / 2} r={1} fill="#9ca3af" fillOpacity={0.3} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sk-grid)" />
          </>
        )}

        {/* Canvas transform */}
        <g transform={`translate(${camera.x},${camera.y}) scale(${camera.zoom})`}>
          {sortedEls.map(el => (
            <RenderElement
              key={el.id}
              el={el}
              isSelected={selectedIds.includes(el.id)}
              isEraseTarget={eraserPreviewIds.has(el.id)}
              onPointerDown={onElPD}
              onDoubleClick={onElDC}
            />
          ))}

          {/* Live freehand preview */}
          {drawPreview.length > 1 && (() => {
            const cs = useSketchBoardEditor.getState().currentStyle;
            return (
              <path
                d={drawPathD(drawPreview)}
                fill="none"
                stroke={cs.strokeColor}
                strokeWidth={cs.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={dashVal(cs.dashStyle)}
                opacity={0.6}
                pointerEvents="none"
              />
            );
          })()}

          {/* Shape preview */}
          {shapePreview && (
            <>
              {shapePreview.type === "rectangle" && (
                <rect x={shapePreview.x} y={shapePreview.y} width={shapePreview.w} height={shapePreview.h} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" rx={4} pointerEvents="none" />
              )}
              {shapePreview.type === "ellipse" && (
                <ellipse cx={shapePreview.x + shapePreview.w / 2} cy={shapePreview.y + shapePreview.h / 2} rx={shapePreview.w / 2} ry={shapePreview.h / 2} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" pointerEvents="none" />
              )}
              {shapePreview.type === "diamond" && (
                <polygon points={`${shapePreview.x + shapePreview.w / 2},${shapePreview.y} ${shapePreview.x + shapePreview.w},${shapePreview.y + shapePreview.h / 2} ${shapePreview.x + shapePreview.w / 2},${shapePreview.y + shapePreview.h} ${shapePreview.x},${shapePreview.y + shapePreview.h / 2}`} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" pointerEvents="none" />
              )}
              {shapePreview.type === "triangle" && (
                <polygon points={`${shapePreview.x + shapePreview.w / 2},${shapePreview.y} ${shapePreview.x + shapePreview.w},${shapePreview.y + shapePreview.h} ${shapePreview.x},${shapePreview.y + shapePreview.h}`} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" pointerEvents="none" />
              )}
              {(shapePreview.type === "line" || shapePreview.type === "arrow") && (
                <>
                  <line x1={shapePreview.s.x} y1={shapePreview.s.y} x2={shapePreview.e.x} y2={shapePreview.e.y} stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" pointerEvents="none" />
                  {shapePreview.type === "arrow" && (() => {
                    const sw = useSketchBoardEditor.getState().currentStyle.strokeWidth;
                    const hs = Math.max(14, sw * 3.5);
                    const [p1, p2] = arrowheadPts(shapePreview.s, shapePreview.e, hs);
                    return <polygon points={`${shapePreview.e.x},${shapePreview.e.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`} fill="#3b82f6" pointerEvents="none" />;
                  })()}
                </>
              )}
            </>
          )}

          {/* Marquee selection rectangle */}
          {marqueeRect && (
            <rect x={marqueeRect.x} y={marqueeRect.y} width={marqueeRect.w} height={marqueeRect.h} fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 3" pointerEvents="none" />
          )}
        </g>
      </svg>

      {/* Eraser cursor (custom circle, follows mouse) */}
      {activeTool === "eraser" && eraserPos && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-red-400 bg-red-400/10"
          style={{ width: 24, height: 24, left: eraserPos.x - 12, top: eraserPos.y - 12 }}
        />
      )}

      {/* Inline text editor */}
      {editingId && (
        <InlineTextEditor elementId={editingId} camera={camera} onDone={() => setEditingId(null)} />
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 select-none">
        {Math.round(camera.zoom * 100)}%
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Floating Toolbar (top center, Excalidraw style)
// ═══════════════════════════════════════════════════════════════

function FloatingToolbar() {
  const activeTool = useSketchBoardEditor(s => s.activeTool);
  const setActiveTool = useSketchBoardEditor(s => s.setActiveTool);
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-1.5 py-1 shadow-lg">
      {TOOL_DEFS.map(t => (
        <button key={t.id} onClick={() => setActiveTool(t.id)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${activeTool === t.id ? "bg-primary-500 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`} title={`${t.label} (${t.shortcut})`}>
          {t.icon}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Undo/Redo Bar (bottom-left, Excalidraw convention)
// ═══════════════════════════════════════════════════════════════

function UndoRedoBar() {
  const handleUndo = useCallback(() => { useSketchBoardEditor.temporal.getState().undo(); }, []);
  const handleRedo = useCallback(() => { useSketchBoardEditor.temporal.getState().redo(); }, []);
  return (
    <div className="absolute bottom-3 left-3 z-50 flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl px-1.5 py-1.5 pointer-events-auto">
      <button onClick={handleUndo} className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Undo (Ctrl+Z)">
        <IconUndo className="w-5 h-5" />
      </button>
      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
      <button onClick={handleRedo} className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Redo (Ctrl+Y)">
        <IconRedo className="w-5 h-5" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Top Bar (title + zoom + export + selection actions)
// ═══════════════════════════════════════════════════════════════

function TopBar() {
  const title = useSketchBoardEditor(s => s.doc.title);
  const setTitle = useSketchBoardEditor(s => s.setTitle);
  const doc = useSketchBoardEditor(s => s.doc);
  const camera = useSketchBoardEditor(s => s.camera);
  const grid = useSketchBoardEditor(s => s.grid);
  const selectedIds = useSketchBoardEditor(s => s.selectedIds);
  const removeElements = useSketchBoardEditor(s => s.removeElements);
  const zoomIn = useSketchBoardEditor(s => s.zoomIn);
  const zoomOut = useSketchBoardEditor(s => s.zoomOut);
  const resetZoom = useSketchBoardEditor(s => s.resetZoom);
  const toggleGrid = useSketchBoardEditor(s => s.toggleGrid);
  const fitToContent = useSketchBoardEditor(s => s.fitToContent);
  const setBackground = useSketchBoardEditor(s => s.setBackground);
  const bringToFront = useSketchBoardEditor(s => s.bringToFront);
  const sendToBack = useSketchBoardEditor(s => s.sendToBack);
  const duplicateSelected = useSketchBoardEditor(s => s.duplicateSelected);

  const [showBg, setShowBg] = useState(false);

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 gap-2 shrink-0 z-30">
      {/* Left: Title */}
      <input
        type="text"
        value={title}
        onChange={e => { setTitle(e.target.value); fireEvent("workspace:dirty"); }}
        className="bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 border-none outline-none w-48 truncate"
        placeholder="Board title..."
      />

      {/* Center: Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Zoom controls */}
        <button onClick={zoomOut} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Zoom out"><IconZoomOut className="w-4 h-4" /></button>
        <button onClick={resetZoom} className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Reset zoom">{Math.round(camera.zoom * 100)}%</button>
        <button onClick={zoomIn} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Zoom in"><IconZoomIn className="w-4 h-4" /></button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Grid / Fit */}
        <button onClick={toggleGrid} className={`px-2 py-1 text-xs rounded-lg transition-colors ${grid.enabled ? "bg-primary-500/20 text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`} title="Toggle grid">Grid</button>
        <button onClick={fitToContent} className="px-2 py-1 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Fit to content">Fit</button>

        {/* Background */}
        <div className="relative">
          <button onClick={() => setShowBg(!showBg)} className="px-2 py-1 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Background">BG</button>
          {showBg && (
            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50 flex flex-col gap-1 min-w-28">
              {BACKGROUND_PRESETS.map(bp => (
                <button key={bp.id} onClick={() => { setBackground(bp.id); setShowBg(false); fireEvent("workspace:dirty"); }} className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${doc.background === bp.id ? "bg-primary-500/20 text-primary-600" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                  <span className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 shrink-0" style={{ backgroundColor: bp.value }} />
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
            <button onClick={() => duplicateSelected()} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Duplicate (Ctrl+D)"><IconCopy className="w-4 h-4" /></button>
            <button onClick={() => { if (selectedIds[0]) bringToFront(selectedIds[0]); }} className="px-1 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Bring to front">↑</button>
            <button onClick={() => { if (selectedIds[0]) sendToBack(selectedIds[0]); }} className="px-1 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Send to back">↓</button>
            <button onClick={() => { removeElements(selectedIds); fireEvent("workspace:dirty"); }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete (Del)"><IconTrash className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
          </>
        )}

        {/* Export */}
        <button onClick={exportPNG} className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-primary-500 text-white hover:bg-primary-600 shadow-sm" title="Export PNG"><IconDownload className="w-3.5 h-3.5" />PNG</button>
        <button onClick={exportSVG} className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600" title="Export SVG"><IconDownload className="w-3.5 h-3.5" />SVG</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Workspace
// ═══════════════════════════════════════════════════════════════

export default function SketchBoardWorkspace() {
  /* Chiko integration */
  useChikoActions(useCallback(() => createSketchBoardManifest(useSketchBoardEditor), []));

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable) return;

      const state = useSketchBoardEditor.getState();

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); useSketchBoardEditor.temporal.getState().undo(); return; }
      // Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); useSketchBoardEditor.temporal.getState().redo(); return; }
      // Delete
      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedIds.length > 0) { e.preventDefault(); state.removeElements(state.selectedIds); fireEvent("workspace:dirty"); return; }
      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") { e.preventDefault(); state.selectAll(); return; }
      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && state.selectedIds.length > 0) { e.preventDefault(); state.duplicateSelected(); return; }
      // Copy (puts selected IDs in localStorage for simple paste)
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && state.selectedIds.length > 0) {
        try { localStorage.setItem("dmsuite-sb-clipboard", JSON.stringify(state.selectedIds)); } catch { /* ignore */ }
        return;
      }
      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        try {
          const ids = JSON.parse(localStorage.getItem("dmsuite-sb-clipboard") || "[]") as string[];
          if (ids.length > 0) { state.setSelectedIds(ids); state.duplicateSelected(); fireEvent("workspace:dirty"); }
        } catch { /* ignore */ }
        return;
      }
      // Escape
      if (e.key === "Escape") { state.deselectAll(); state.setActiveTool("select"); return; }

      // Tool shortcuts (single key, no modifiers)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const map: Record<string, SketchTool> = { v: "select", h: "hand", p: "draw", e: "eraser", r: "rectangle", o: "ellipse", d: "diamond", g: "triangle", t: "text", l: "line", a: "arrow", s: "sticky" };
        if (map[e.key]) { state.setActiveTool(map[e.key]); return; }
        // Space held → hand tool (temporary)
        if (e.key === " " && !e.repeat) { e.preventDefault(); state.setActiveTool("hand"); }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " && useSketchBoardEditor.getState().activeTool === "hand") {
        useSketchBoardEditor.getState().setActiveTool("select");
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp); };
  }, []);

  /* Fire initial progress if board has content */
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    if (useSketchBoardEditor.getState().doc.elements.length > 0) {
      fireEvent("workspace:progress", { progress: 50, milestone: "content" });
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <div className="flex flex-1 min-h-0 relative">
        <SketchCanvas />
        <StylePanel />
        <FloatingToolbar />
        <UndoRedoBar />
      </div>
    </div>
  );
}
