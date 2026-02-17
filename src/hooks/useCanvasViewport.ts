"use client";

import { useState, useCallback, useEffect, useRef, type WheelEvent } from "react";

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.1;

/**
 * Canvas viewport hook — zoom and pan controls.
 * Returns viewport state and handlers for wheel, keyboard, and touch events.
 */
export function useCanvasViewport(canvasWidth: number, canvasHeight: number) {
  const [viewport, setViewport] = useState<ViewportState>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);

  const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

  const zoomIn = useCallback(() => {
    setViewport((v) => ({ ...v, zoom: clampZoom(v.zoom + ZOOM_STEP) }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewport((v) => ({ ...v, zoom: clampZoom(v.zoom - ZOOM_STEP) }));
  }, []);

  const zoomTo100 = useCallback(() => {
    setViewport((v) => ({ ...v, zoom: 1 }));
  }, []);

  const zoomToFit = useCallback(
    (containerWidth: number, containerHeight: number) => {
      const fitZoom = Math.min(
        containerWidth / canvasWidth,
        containerHeight / canvasHeight,
        1
      );
      setViewport({ zoom: clampZoom(fitZoom), panX: 0, panY: 0 });
    },
    [canvasWidth, canvasHeight]
  );

  // Scroll wheel → zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setViewport((v) => ({ ...v, zoom: clampZoom(v.zoom + delta) }));
  }, []);

  // Space + drag → pan
  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanning.current = true;
    panStart.current = { x: clientX, y: clientY };
  }, []);

  const movePan = useCallback((clientX: number, clientY: number) => {
    if (!isPanning.current) return;
    const dx = clientX - panStart.current.x;
    const dy = clientY - panStart.current.y;
    panStart.current = { x: clientX, y: clientY };
    setViewport((v) => ({ ...v, panX: v.panX + dx, panY: v.panY + dy }));
  }, []);

  const endPan = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Pinch-to-zoom for touch
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / lastTouchDist.current;
      lastTouchDist.current = dist;
      setViewport((v) => ({ ...v, zoom: clampZoom(v.zoom * scale) }));
    }
  }, []);

  // Format zoom percentage for display
  const zoomLabel = `${Math.round(viewport.zoom * 100)}%`;

  return {
    viewport,
    setViewport,
    zoomIn,
    zoomOut,
    zoomTo100,
    zoomToFit,
    zoomLabel,
    handleWheel,
    startPan,
    movePan,
    endPan,
    handleTouchStart,
    handleTouchMove,
  };
}
