"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconBox,
} from "@/components/icons";
import { cleanAIText, hexToRgba, getContrastColor } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type PackageType = "box" | "bottle-label" | "can-wrap" | "pouch" | "bag";
type PackagingTemplate = "luxury" | "organic" | "tech" | "food" | "beverage" | "cosmetics";

interface PackagingConfig {
  packageType: PackageType;
  template: PackagingTemplate;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  productName: string;
  brandName: string;
  tagline: string;
  weight: string;
  ingredients: string;
  barcode: string;
  showFoldLines: boolean;
  showCutLines: boolean;
  showBarcodeZone: boolean;
  showNutritionZone: boolean;
  productDescription: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const PACKAGE_TYPES: { id: PackageType; label: string; w: number; h: number; desc: string }[] = [
  { id: "box", label: "Box (Die-cut)", w: 900, h: 700, desc: "Folding carton layout" },
  { id: "bottle-label", label: "Bottle Label", w: 700, h: 300, desc: "Wrap-around label" },
  { id: "can-wrap", label: "Can Wrap", w: 800, h: 350, desc: "Cylindrical wrap" },
  { id: "pouch", label: "Pouch", w: 500, h: 700, desc: "Stand-up pouch" },
  { id: "bag", label: "Bag", w: 600, h: 800, desc: "Retail bag layout" },
];

const TEMPLATES: { id: PackagingTemplate; label: string }[] = [
  { id: "luxury", label: "Luxury" },
  { id: "organic", label: "Organic" },
  { id: "tech", label: "Tech" },
  { id: "food", label: "Food" },
  { id: "beverage", label: "Beverage" },
  { id: "cosmetics", label: "Cosmetics" },
];

const COLOR_PRESETS = [
  "#1e293b", "#0f766e", "#7c2d12", "#1e3a5f",
  "#4a1d96", "#166534", "#991b1b", "#0284c7",
];

const TEMPLATE_COLORS: Record<PackagingTemplate, { primary: string; secondary: string; bg: string }> = {
  luxury: { primary: "#c09c2c", secondary: "#1a1a1a", bg: "#0a0a0a" },
  organic: { primary: "#16a34a", secondary: "#86efac", bg: "#f0fdf4" },
  tech: { primary: "#3b82f6", secondary: "#1e293b", bg: "#0f172a" },
  food: { primary: "#dc2626", secondary: "#fbbf24", bg: "#ffffff" },
  beverage: { primary: "#0891b2", secondary: "#06b6d4", bg: "#ecfeff" },
  cosmetics: { primary: "#a855f7", secondary: "#e9d5ff", bg: "#faf5ff" },
};

/* ── Word-wrap helper ──────────────────────────────────────── */

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line + (line ? " " : "") + w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ── Component ─────────────────────────────────────────────── */

export default function PackagingDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  const [config, setConfig] = useState<PackagingConfig>({
    packageType: "box",
    template: "food",
    primaryColor: "#dc2626",
    secondaryColor: "#fbbf24",
    bgColor: "#ffffff",
    productName: "Zambian Gold",
    brandName: "DMSuite Foods",
    tagline: "Naturally Delicious",
    weight: "500g",
    ingredients: "Maize, Sugar, Salt, Natural Flavours",
    barcode: "6009876543210",
    showFoldLines: true,
    showCutLines: true,
    showBarcodeZone: true,
    showNutritionZone: true,
    productDescription: "",
  });

  const pkg = PACKAGE_TYPES.find((p) => p.id === config.packageType)!;

  /* ── Box Die-cut Renderer ───────────────────────────────── */
  function renderBox(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const pc = config.primaryColor;
    const sc = config.secondaryColor;
    const bg = config.bgColor;
    const isLuxury = config.template === "luxury";
    const isOrganic = config.template === "organic";

    // Die-cut layout: front, side, back, side, top/bottom flaps
    const faceW = W * 0.3;
    const sideW = W * 0.15;
    const flapH = H * 0.12;

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ─── Main panels ────────────────────────────────────
    // Front panel
    const frontX = sideW;
    const frontY = flapH;
    const panelH = H - flapH * 2;

    // Front face background
    if (isLuxury) {
      const grad = ctx.createLinearGradient(frontX, frontY, frontX, frontY + panelH);
      grad.addColorStop(0, pc);
      grad.addColorStop(1, sc);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bg;
    }
    ctx.fillRect(frontX, frontY, faceW, panelH);

    // Front face content
    const fcx = frontX + faceW / 2;
    const textC = isLuxury ? getContrastColor(pc) : "#1e293b";

    // Brand name
    ctx.font = "600 10px Inter, sans-serif";
    ctx.fillStyle = hexToRgba(textC, 0.5);
    ctx.textAlign = "center";
    ctx.fillText(config.brandName.toUpperCase(), fcx, frontY + 35);

    // Product name
    ctx.font = isLuxury ? "700 26px Georgia, serif" : "800 24px Inter, sans-serif";
    ctx.fillStyle = isLuxury ? getContrastColor(pc) : pc;
    ctx.fillText(config.productName, fcx, frontY + panelH * 0.35, faceW - 30);

    // Tagline
    ctx.font = "italic 12px Georgia, serif";
    ctx.fillStyle = hexToRgba(textC, 0.7);
    ctx.fillText(config.tagline, fcx, frontY + panelH * 0.45);

    // Decorative element
    if (isOrganic) {
      // Leaf shape
      ctx.fillStyle = hexToRgba(pc, 0.15);
      ctx.beginPath();
      ctx.ellipse(fcx, frontY + panelH * 0.6, 30, 15, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = hexToRgba(sc, 0.3);
      ctx.fillRect(fcx - 30, frontY + panelH * 0.52, 60, 2);
    }

    // Weight badge
    ctx.fillStyle = pc;
    ctx.beginPath();
    ctx.arc(fcx, frontY + panelH * 0.75, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "700 12px Inter, sans-serif";
    ctx.fillStyle = getContrastColor(pc);
    ctx.fillText(config.weight, fcx, frontY + panelH * 0.75 + 5);

    // ─── Side panel (left) ───────────────────────────────
    ctx.fillStyle = hexToRgba(pc, 0.05);
    ctx.fillRect(0, frontY, sideW, panelH);
    ctx.save();
    ctx.translate(sideW / 2, frontY + panelH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "600 10px Inter, sans-serif";
    ctx.fillStyle = hexToRgba("#1e293b", 0.4);
    ctx.textAlign = "center";
    ctx.fillText(config.brandName + " — " + config.productName, 0, 0);
    ctx.restore();

    // ─── Back panel ──────────────────────────────────────
    const backX = frontX + faceW;
    ctx.fillStyle = hexToRgba(bg, 1);
    ctx.fillRect(backX, frontY, faceW, panelH);

    // Ingredients
    ctx.font = "700 9px Inter, sans-serif";
    ctx.fillStyle = "#374151";
    ctx.textAlign = "left";
    ctx.fillText("INGREDIENTS:", backX + 15, frontY + 30);
    ctx.font = "400 8px Inter, sans-serif";
    ctx.fillStyle = "#6b7280";
    const ingredLines = wrapText(ctx, config.ingredients, faceW - 30);
    ingredLines.forEach((line, i) => {
      ctx.fillText(line, backX + 15, frontY + 44 + i * 12);
    });

    // Nutrition Zone
    if (config.showNutritionZone) {
      const nzY = frontY + 100;
      const nzH = 140;
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.strokeRect(backX + 12, nzY, faceW - 24, nzH);

      ctx.font = "700 9px Inter, sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "left";
      ctx.fillText("Nutrition Facts", backX + 18, nzY + 16);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(backX + 18, nzY + 20);
      ctx.lineTo(backX + faceW - 18, nzY + 20);
      ctx.stroke();

      const nutrients = [
        ["Serving Size", config.weight],
        ["Calories", "250"],
        ["Total Fat", "8g"],
        ["Carbohydrates", "35g"],
        ["Protein", "12g"],
        ["Sodium", "180mg"],
      ];
      ctx.font = "400 8px Inter, sans-serif";
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "#e5e7eb";
      nutrients.forEach(([name, val], i) => {
        const ny = nzY + 34 + i * 16;
        ctx.fillStyle = "#374151";
        ctx.textAlign = "left";
        ctx.fillText(name, backX + 18, ny);
        ctx.textAlign = "right";
        ctx.fillText(val, backX + faceW - 18, ny);
        ctx.beginPath();
        ctx.moveTo(backX + 18, ny + 4);
        ctx.lineTo(backX + faceW - 18, ny + 4);
        ctx.stroke();
      });
    }

    // Barcode Zone
    if (config.showBarcodeZone) {
      const bzX = backX + faceW / 2 - 40;
      const bzY = frontY + panelH - 70;
      // Barcode bars
      ctx.fillStyle = "#000000";
      for (let i = 0; i < 30; i++) {
        const bw = (i % 3 === 0) ? 3 : (i % 2 === 0) ? 2 : 1;
        ctx.fillRect(bzX + i * 2.8, bzY, bw, 35);
      }
      ctx.font = "400 8px 'Courier New', monospace";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "center";
      ctx.fillText(config.barcode, backX + faceW / 2, bzY + 48);
    }

    // ─── Side panel (right) ──────────────────────────────
    const rsX = backX + faceW;
    ctx.fillStyle = hexToRgba(pc, 0.05);
    ctx.fillRect(rsX, frontY, sideW, panelH);
    ctx.save();
    ctx.translate(rsX + sideW / 2, frontY + panelH / 2);
    ctx.rotate(Math.PI / 2);
    ctx.font = "600 10px Inter, sans-serif";
    ctx.fillStyle = hexToRgba("#1e293b", 0.4);
    ctx.textAlign = "center";
    ctx.fillText("Made in Zambia — " + config.weight, 0, 0);
    ctx.restore();

    // ─── Top/Bottom flaps ────────────────────────────────
    ctx.fillStyle = hexToRgba(pc, 0.03);
    ctx.fillRect(frontX, 0, faceW, flapH); // top flap
    ctx.fillRect(frontX, H - flapH, faceW, flapH); // bottom flap
    ctx.font = "400 8px Inter, sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.fillText("TOP FLAP — GLUE AREA", frontX + faceW / 2, flapH / 2 + 3);
    ctx.fillText("BOTTOM FLAP — TUCK IN", frontX + faceW / 2, H - flapH / 2 + 3);

    // ─── Fold lines ──────────────────────────────────────
    if (config.showFoldLines) {
      ctx.save();
      ctx.setLineDash([8, 4]);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1;
      // Vertical folds
      [sideW, sideW + faceW, sideW + faceW * 2, sideW * 2 + faceW * 2].forEach((fx) => {
        if (fx < W) {
          ctx.beginPath();
          ctx.moveTo(fx, 0);
          ctx.lineTo(fx, H);
          ctx.stroke();
        }
      });
      // Horizontal folds
      [flapH, H - flapH].forEach((fy) => {
        ctx.beginPath();
        ctx.moveTo(0, fy);
        ctx.lineTo(W, fy);
        ctx.stroke();
      });
      ctx.restore();

      // Labels
      ctx.font = "600 7px Inter, sans-serif";
      ctx.fillStyle = "#3b82f6";
      ctx.textAlign = "center";
      ctx.fillText("FOLD", sideW, H - 5);
      ctx.fillText("FOLD", sideW + faceW, H - 5);
    }

    // ─── Cut lines ───────────────────────────────────────
    if (config.showCutLines) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(0, 0, W, H);
      ctx.restore();

      ctx.font = "600 7px Inter, sans-serif";
      ctx.fillStyle = "#ef4444";
      ctx.textAlign = "left";
      ctx.fillText("CUT LINE", 4, 10);
    }
  }

  /* ── Bottle Label Renderer ──────────────────────────────── */
  function renderBottleLabel(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const pc = config.primaryColor;
    const sc = config.secondaryColor;
    const bg = config.bgColor;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Top strip
    ctx.fillStyle = pc;
    ctx.fillRect(0, 0, W, 8);
    ctx.fillRect(0, H - 8, W, 8);

    // Brand
    ctx.font = "600 10px Inter, sans-serif";
    ctx.fillStyle = hexToRgba("#1e293b", 0.5);
    ctx.textAlign = "center";
    ctx.fillText(config.brandName.toUpperCase(), W / 2, 30);

    // Product name
    ctx.font = "800 32px Inter, sans-serif";
    ctx.fillStyle = pc;
    ctx.fillText(config.productName, W / 2, H / 2 - 10, W - 60);

    // Tagline
    ctx.font = "italic 13px Georgia, serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(config.tagline, W / 2, H / 2 + 18);

    // Divider
    ctx.fillStyle = hexToRgba(sc, 0.5);
    ctx.fillRect(W / 2 - 50, H / 2 + 30, 100, 1.5);

    // Weight
    ctx.font = "600 11px Inter, sans-serif";
    ctx.fillStyle = "#374151";
    ctx.fillText(config.weight, W / 2, H / 2 + 52);

    // Barcode
    if (config.showBarcodeZone) {
      const bx = W - 100;
      ctx.fillStyle = "#000";
      for (let i = 0; i < 20; i++) {
        const bw = (i % 3 === 0) ? 2.5 : (i % 2 === 0) ? 1.5 : 1;
        ctx.fillRect(bx + i * 3, H - 55, bw, 25);
      }
      ctx.font = "400 7px 'Courier New', monospace";
      ctx.fillStyle = "#374151";
      ctx.fillText(config.barcode, bx + 30, H - 23);
    }

    // Made in Zambia
    ctx.font = "400 8px Inter, sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "left";
    ctx.fillText("Made in Zambia", 15, H - 18);

    // Wrap indicator
    if (config.showFoldLines) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#3b82f680";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W, 0);
      ctx.lineTo(W, H);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ── Can Wrap Renderer ──────────────────────────────────── */
  function renderCanWrap(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const pc = config.primaryColor;
    const sc = config.secondaryColor;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, pc);
    grad.addColorStop(0.5, sc);
    grad.addColorStop(1, pc);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Product name (center)
    ctx.font = "900 40px Inter, sans-serif";
    ctx.fillStyle = getContrastColor(pc);
    ctx.textAlign = "center";
    ctx.fillText(config.productName.toUpperCase(), W / 2, H / 2 - 10, W - 80);

    // Tagline
    ctx.font = "400 14px Inter, sans-serif";
    ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.7);
    ctx.fillText(config.tagline, W / 2, H / 2 + 20);

    // Brand (top)
    ctx.font = "600 11px Inter, sans-serif";
    ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.5);
    ctx.fillText(config.brandName.toUpperCase(), W / 2, 30);

    // Weight (bottom)
    ctx.font = "600 12px Inter, sans-serif";
    ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.6);
    ctx.fillText(config.weight, W / 2, H - 20);

    // Barcode area
    if (config.showBarcodeZone) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(W - 110, H - 70, 90, 50);
      ctx.fillStyle = "#000";
      for (let i = 0; i < 18; i++) {
        const bw = (i % 3 === 0) ? 2 : 1;
        ctx.fillRect(W - 100 + i * 3.5, H - 60, bw, 25);
      }
      ctx.font = "400 6px 'Courier New', monospace";
      ctx.fillStyle = "#374151";
      ctx.textAlign = "center";
      ctx.fillText(config.barcode, W - 62, H - 27);
    }

    // Overlap indicator
    if (config.showFoldLines) {
      ctx.save();
      ctx.setLineDash([6, 3]);
      ctx.strokeStyle = "#ffffff40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.05, 0);
      ctx.lineTo(W * 0.05, H);
      ctx.stroke();
      ctx.restore();
      ctx.font = "500 7px Inter, sans-serif";
      ctx.fillStyle = "#ffffff60";
      ctx.textAlign = "left";
      ctx.fillText("OVERLAP", W * 0.05 + 4, 15);
    }
  }

  /* ── Pouch Renderer ─────────────────────────────────────── */
  function renderPouch(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const pc = config.primaryColor;
    const bg = config.bgColor;
    const isFoodBev = config.template === "food" || config.template === "beverage";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Pouch shape outline
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(40, 80);
    ctx.lineTo(W - 40, 80);
    ctx.lineTo(W - 20, H - 60);
    ctx.quadraticCurveTo(W / 2, H - 30, 20, H - 60);
    ctx.closePath();
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.clip();

    // Pouch fill
    if (isFoodBev) {
      const grad = ctx.createLinearGradient(0, 80, 0, H);
      grad.addColorStop(0, bg);
      grad.addColorStop(0.6, hexToRgba(pc, 0.05));
      grad.addColorStop(1, hexToRgba(pc, 0.15));
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Top seal area
    ctx.fillStyle = hexToRgba(pc, 0.1);
    ctx.fillRect(30, 60, W - 60, 30);
    ctx.font = "400 7px Inter, sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.fillText("SEAL AREA", W / 2, 78);

    // Brand
    ctx.font = "600 11px Inter, sans-serif";
    ctx.fillStyle = hexToRgba("#1e293b", 0.5);
    ctx.fillText(config.brandName.toUpperCase(), W / 2, 130);

    // Product name
    ctx.font = "800 28px Inter, sans-serif";
    ctx.fillStyle = pc;
    ctx.fillText(config.productName, W / 2, H * 0.35, W - 80);

    // Tagline
    ctx.font = "italic 12px Georgia, serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(config.tagline, W / 2, H * 0.35 + 25);

    // Weight
    ctx.fillStyle = pc;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.55, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "700 10px Inter, sans-serif";
    ctx.fillStyle = getContrastColor(pc);
    ctx.fillText(config.weight, W / 2, H * 0.55 + 4);

    // Bottom - Made in
    ctx.font = "400 8px Inter, sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("Made in Zambia", W / 2, H - 80);

    if (config.showBarcodeZone) {
      ctx.fillStyle = "#000";
      const bx = W / 2 - 30;
      for (let i = 0; i < 15; i++) {
        ctx.fillRect(bx + i * 4, H - 120, (i % 3 === 0) ? 2.5 : 1, 22);
      }
    }
  }

  /* ── Bag Renderer ───────────────────────────────────────── */
  function renderBag(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const pc = config.primaryColor;
    const sc = config.secondaryColor;
    const bg = config.bgColor;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Handle area
    ctx.fillStyle = hexToRgba(pc, 0.05);
    ctx.fillRect(W * 0.3, 0, W * 0.4, 60);
    ctx.font = "400 7px Inter, sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.fillText("HANDLE CUTOUT", W / 2, 35);

    // Top color band
    ctx.fillStyle = pc;
    ctx.fillRect(0, 60, W, 40);
    ctx.font = "600 10px Inter, sans-serif";
    ctx.fillStyle = getContrastColor(pc);
    ctx.fillText(config.brandName.toUpperCase(), W / 2, 84);

    // Main content area
    ctx.font = "800 30px Inter, sans-serif";
    ctx.fillStyle = pc;
    ctx.fillText(config.productName, W / 2, H * 0.35, W - 60);

    ctx.font = "italic 13px Georgia, serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(config.tagline, W / 2, H * 0.35 + 28);

    // Decorative
    ctx.fillStyle = hexToRgba(sc, 0.2);
    ctx.fillRect(W / 2 - 40, H * 0.45, 80, 2);

    // Weight
    ctx.font = "600 13px Inter, sans-serif";
    ctx.fillStyle = "#374151";
    ctx.fillText(config.weight, W / 2, H * 0.55);

    // Bottom fold
    ctx.fillStyle = hexToRgba(pc, 0.03);
    ctx.fillRect(0, H - 100, W, 100);
    ctx.font = "400 7px Inter, sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("BOTTOM GUSSET — FOLD LINE", W / 2, H - 50);

    if (config.showBarcodeZone) {
      ctx.fillStyle = "#000";
      const bx = W / 2 - 30;
      for (let i = 0; i < 16; i++) {
        ctx.fillRect(bx + i * 4, H - 160, (i % 3 === 0) ? 2.5 : 1, 25);
      }
      ctx.font = "400 7px 'Courier New', monospace";
      ctx.fillStyle = "#374151";
      ctx.fillText(config.barcode, W / 2, H - 128);
    }

    // Cut line
    if (config.showCutLines) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#ef444480";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(0, 0, W, H);
      ctx.restore();
    }
  }

  /* ── Main Render ────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = pkg.w;
    const H = pkg.h;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    switch (config.packageType) {
      case "box": renderBox(ctx, W, H); break;
      case "bottle-label": renderBottleLabel(ctx, W, H); break;
      case "can-wrap": renderCanWrap(ctx, W, H); break;
      case "pouch": renderPouch(ctx, W, H); break;
      case "bag": renderBag(ctx, W, H); break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, pkg]);

  useEffect(() => { render(); }, [render]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = async () => {
    if (!config.productDescription.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate packaging design text for a product: "${config.productDescription}". Package type: ${config.packageType}. Made in Zambia. Return JSON only: { "productName": "...", "brandName": "...", "tagline": "... (short catchy phrase)", "weight": "e.g. 500g", "ingredients": "comma-separated list", "template": "luxury|organic|tech|food|beverage|cosmetics" }. Keep it professional and market-ready.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        const tmpl = (data.template as PackagingTemplate) || config.template;
        const tc = TEMPLATE_COLORS[tmpl] || TEMPLATE_COLORS[config.template];
        setConfig((p) => ({
          ...p,
          productName: data.productName || p.productName,
          brandName: data.brandName || p.brandName,
          tagline: data.tagline || p.tagline,
          weight: data.weight || p.weight,
          ingredients: data.ingredients || p.ingredients,
          template: tmpl,
          primaryColor: tc.primary,
          secondaryColor: tc.secondary,
          bgColor: tc.bg,
        }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `packaging-${config.packageType}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const upd = (patch: Partial<PackagingConfig>) => setConfig((p) => ({ ...p, ...patch }));

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["canvas", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconBox className="size-4 text-primary-500" />Packaging Settings</h3>

            <label className="block text-xs text-gray-400">Package Type</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.packageType} onChange={(e) => upd({ packageType: e.target.value as PackageType })}>
              {PACKAGE_TYPES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <p className="text-[10px] text-gray-500">{pkg.desc} — {pkg.w}×{pkg.h}px</p>

            <label className="block text-xs text-gray-400">Template</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => { const tc = TEMPLATE_COLORS[t.id]; upd({ template: t.id, primaryColor: tc.primary, secondaryColor: tc.secondary, bgColor: tc.bg }); }} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.template === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{t.label}</button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Colors</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => upd({ primaryColor: c })} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">Primary</label><input type="color" value={config.primaryColor} onChange={(e) => upd({ primaryColor: e.target.value })} className="w-full h-7 rounded cursor-pointer" /></div>
              <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">Secondary</label><input type="color" value={config.secondaryColor} onChange={(e) => upd({ secondaryColor: e.target.value })} className="w-full h-7 rounded cursor-pointer" /></div>
              <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">BG</label><input type="color" value={config.bgColor} onChange={(e) => upd({ bgColor: e.target.value })} className="w-full h-7 rounded cursor-pointer" /></div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer"><input type="checkbox" checked={config.showFoldLines} onChange={(e) => upd({ showFoldLines: e.target.checked })} className="accent-primary-500" />Fold Lines</label>
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer"><input type="checkbox" checked={config.showCutLines} onChange={(e) => upd({ showCutLines: e.target.checked })} className="accent-primary-500" />Cut Lines</label>
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer"><input type="checkbox" checked={config.showBarcodeZone} onChange={(e) => upd({ showBarcodeZone: e.target.checked })} className="accent-primary-500" />Barcode</label>
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer"><input type="checkbox" checked={config.showNutritionZone} onChange={(e) => upd({ showNutritionZone: e.target.checked })} className="accent-primary-500" />Nutrition</label>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Product Details</h3>
            <label className="block text-xs text-gray-400">Product Name</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.productName} onChange={(e) => upd({ productName: e.target.value })} />
            <label className="block text-xs text-gray-400">Brand Name</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.brandName} onChange={(e) => upd({ brandName: e.target.value })} />
            <label className="block text-xs text-gray-400">Tagline</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.tagline} onChange={(e) => upd({ tagline: e.target.value })} />
            <label className="block text-xs text-gray-400">Weight / Volume</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.weight} onChange={(e) => upd({ weight: e.target.value })} />
            <label className="block text-xs text-gray-400">Ingredients</label>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} value={config.ingredients} onChange={(e) => upd({ ingredients: e.target.value })} />
            <label className="block text-xs text-gray-400">Barcode Number</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white font-mono" value={config.barcode} onChange={(e) => upd({ barcode: e.target.value })} />
          </div>

          {/* AI */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Packaging Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the product (e.g., 'Organic honey from rural Zambia, premium gift packaging')..." value={config.productDescription} onChange={(e) => upd({ productDescription: e.target.value })} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Packaging Design"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button onClick={exportPNG} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><IconDownload className="size-4" />Export PNG</button>
          </div>
        </div>

        {/* Canvas */}
        <div className={`flex-1 min-w-0 ${mobileTab !== "canvas" ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 overflow-auto">
            <canvas ref={canvasRef} style={{ width: Math.min(pkg.w, 700), height: Math.min(pkg.w, 700) * (pkg.h / pkg.w) }} className="rounded-lg shadow-lg" />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">{pkg.label} — {config.template} — {pkg.w}×{pkg.h}px</p>
        </div>
      </div>
    </div>
  );
}
