"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconReceipt,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlus,
  IconTrash,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceConfig {
  businessName: string;
  businessAddress: string;
  businessEmail: string;
  businessPhone: string;
  businessWebsite: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  taxLabel: string;
  notes: string;
  template: InvoiceTemplate;
  primaryColor: string;
  pageSize: PageSize;
  description: string;
}

type PageSize = "a4" | "letter" | "legal";
type InvoiceTemplate =
  | "modern"
  | "classic"
  | "minimal"
  | "bold"
  | "elegant"
  | "corporate";

const PAGE_SIZES: { id: PageSize; name: string; w: number; h: number }[] = [
  { id: "a4", name: "A4", w: 595, h: 842 },
  { id: "letter", name: "Letter", w: 612, h: 792 },
  { id: "legal", name: "Legal", w: 612, h: 1008 },
];

const TEMPLATES: { id: InvoiceTemplate; name: string; desc: string }[] = [
  { id: "modern", name: "Modern", desc: "Clean gradient header" },
  { id: "classic", name: "Classic", desc: "Traditional & formal" },
  { id: "minimal", name: "Minimal", desc: "Whitespace-focused" },
  { id: "bold", name: "Bold", desc: "Strong color blocks" },
  { id: "elegant", name: "Elegant", desc: "Thin lines, serif feel" },
  { id: "corporate", name: "Corporate", desc: "Enterprise-ready" },
];

const CURRENCIES: { code: string; symbol: string; name: string }[] = [
  { code: "ZMW", symbol: "K", name: "Zambian Kwacha" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "\u00A3", name: "British Pound" },
  { code: "EUR", symbol: "\u20AC", name: "Euro" },
  { code: "ZAR", symbol: "R", name: "SA Rand" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "NGN", symbol: "\u20A6", name: "Nigerian Naira" },
];

const COLOR_PRESETS = [
  "#1e40af",
  "#0f766e",
  "#4338ca",
  "#b91c1c",
  "#c2410c",
  "#0e7490",
  "#0f172a",
  "#7c3aed",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Canvas Helpers ────────────────────────────────────────── */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lighten(hex: string, pct: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round((255 * pct) / 100));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round((255 * pct) / 100));
  const b = Math.min(255, (num & 0xff) + Math.round((255 * pct) / 100));
  return `rgb(${r},${g},${b})`;
}

function fmtMoney(amount: number, sym: string): string {
  return `${sym}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ── Component ─────────────────────────────────────────────── */

export default function InvoiceDesignerWorkspace() {
  const [items, setItems] = useState<LineItem[]>([
    { id: uid(), description: "", quantity: 1, rate: 0 },
  ]);

  const [config, setConfig] = useState<InvoiceConfig>({
    businessName: "",
    businessAddress: "",
    businessEmail: "",
    businessPhone: "",
    businessWebsite: "",
    clientName: "",
    clientAddress: "",
    clientEmail: "",
    invoiceNumber: "INV-001",
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    currency: "ZMW",
    currencySymbol: "K",
    taxRate: 16,
    taxLabel: "VAT",
    notes: "",
    template: "modern",
    primaryColor: "#1e40af",
    pageSize: "a4",
    description: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "business" | "client" | "items" | "details"
  >("business");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const updateConfig = useCallback((upd: Partial<InvoiceConfig>) => {
    setConfig((p) => ({ ...p, ...upd }));
  }, []);

  const pageDims = useMemo(() => {
    const ps = PAGE_SIZES.find((p) => p.id === config.pageSize) || PAGE_SIZES[0];
    return { w: ps.w, h: ps.h };
  }, [config.pageSize]);

  const subtotal = items.reduce((s, it) => s + it.quantity * it.rate, 0);
  const taxAmount = subtotal * (config.taxRate / 100);
  const total = subtotal + taxAmount;
  const sym = config.currencySymbol;

  /* ── Canvas Render ──────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const W = pageDims.w;
    const H = pageDims.h;
    canvas.width = W;
    canvas.height = H;

    const primary = config.primaryColor;
    const font = "'Inter', 'Segoe UI', sans-serif";
    const M = 40; /* margin */
    const CW = W - M * 2;
    const maxY = H - M;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    function safeText(text: string, x: number, y: number, mw: number) {
      if (y > maxY - 4) return;
      ctx.fillText(text, x, y, mw);
    }

    function wrapClip(text: string, x: number, y: number, mw: number, lh: number): number {
      const words = text.split(" ");
      let line = "";
      let cy = y;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > mw && line) {
          if (cy > maxY - 4) return cy;
          ctx.fillText(line.trim(), x, cy, mw);
          line = word + " ";
          cy += lh;
        } else {
          line = test;
        }
      }
      if (cy <= maxY - 4) ctx.fillText(line.trim(), x, cy, mw);
      return cy + lh;
    }

    /* ─── Table renderer (shared across templates) ─── */
    function drawItemTable(startY: number, colX: number, tableW: number): number {
      let y = startY;
      if (y > maxY - 40) return y;

      const descW = tableW * 0.48;
      const qtyW = tableW * 0.12;
      const rateW = tableW * 0.2;
      const amtW = tableW * 0.2;
      const cols = [colX, colX + descW, colX + descW + qtyW, colX + descW + qtyW + rateW];

      /* Header */
      ctx.fillStyle = primary + "10";
      ctx.fillRect(colX, y - 10, tableW, 18);
      ctx.fillStyle = primary;
      ctx.font = `600 7.5px ${font}`;
      ctx.textAlign = "left";
      safeText("DESCRIPTION", cols[0] + 4, y, descW);
      ctx.textAlign = "center";
      safeText("QTY", cols[1] + qtyW / 2, y, qtyW);
      safeText("RATE", cols[2] + rateW / 2, y, rateW);
      ctx.textAlign = "right";
      safeText("AMOUNT", colX + tableW - 4, y, amtW);
      y += 14;

      /* Divider line */
      ctx.strokeStyle = primary + "22";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(colX, y);
      ctx.lineTo(colX + tableW, y);
      ctx.stroke();
      y += 8;

      /* Rows */
      ctx.textAlign = "left";
      items.forEach((item, idx) => {
        if (y > maxY - 30) return;
        const amt = item.quantity * item.rate;
        /* Zebra stripe */
        if (idx % 2 === 1) {
          ctx.fillStyle = "#f8f9fa";
          ctx.fillRect(colX, y - 9, tableW, 16);
        }
        ctx.fillStyle = "#333333";
        ctx.font = `400 8px ${font}`;
        safeText(item.description || "Item", cols[0] + 4, y, descW - 8);
        ctx.textAlign = "center";
        safeText(String(item.quantity), cols[1] + qtyW / 2, y, qtyW);
        safeText(fmtMoney(item.rate, sym), cols[2] + rateW / 2, y, rateW);
        ctx.textAlign = "right";
        ctx.fillStyle = "#111111";
        ctx.font = `500 8px ${font}`;
        safeText(fmtMoney(amt, sym), colX + tableW - 4, y, amtW);
        ctx.textAlign = "left";
        y += 16;
      });

      /* Totals area */
      y += 6;
      ctx.strokeStyle = primary + "22";
      ctx.beginPath();
      ctx.moveTo(colX + tableW * 0.55, y);
      ctx.lineTo(colX + tableW, y);
      ctx.stroke();
      y += 14;

      const totX = colX + tableW * 0.6;
      const totValX = colX + tableW - 4;

      ctx.font = `400 8px ${font}`;
      ctx.fillStyle = "#555555";
      ctx.textAlign = "left";
      safeText("Subtotal", totX, y, 80);
      ctx.textAlign = "right";
      safeText(fmtMoney(subtotal, sym), totValX, y, 100);
      y += 14;

      ctx.textAlign = "left";
      safeText(`${config.taxLabel} (${config.taxRate}%)`, totX, y, 80);
      ctx.textAlign = "right";
      safeText(fmtMoney(taxAmount, sym), totValX, y, 100);
      y += 16;

      /* Grand total */
      ctx.fillStyle = primary + "10";
      roundRect(ctx, totX - 8, y - 10, colX + tableW - totX + 12, 22, 4);
      ctx.fill();
      ctx.font = `700 10px ${font}`;
      ctx.fillStyle = primary;
      ctx.textAlign = "left";
      safeText("TOTAL", totX, y + 2, 60);
      ctx.textAlign = "right";
      safeText(fmtMoney(total, sym), totValX, y + 2, 120);
      ctx.textAlign = "left";
      y += 30;

      return y;
    }

    /* ─── Draw business & client info ─── */
    function drawAddresses(startY: number): number {
      let y = startY;
      const halfW = CW / 2 - 10;

      /* Business (left) */
      ctx.font = `700 10px ${font}`;
      ctx.fillStyle = "#111111";
      safeText(config.businessName || "Your Business", M, y, halfW);
      y += 14;
      ctx.font = `400 7.5px ${font}`;
      ctx.fillStyle = "#555555";
      if (config.businessAddress) {
        y = wrapClip(config.businessAddress, M, y, halfW, 11);
      }
      if (config.businessEmail) {
        safeText(config.businessEmail, M, y, halfW);
        y += 11;
      }
      if (config.businessPhone) {
        safeText(config.businessPhone, M, y, halfW);
        y += 11;
      }

      /* Client (right) */
      const rightX = M + CW / 2 + 10;
      let ry = startY;
      ctx.fillStyle = "#999999";
      ctx.font = `600 7px ${font}`;
      safeText("BILL TO", rightX, ry, halfW);
      ry += 14;
      ctx.fillStyle = "#111111";
      ctx.font = `700 9px ${font}`;
      safeText(config.clientName || "Client Name", rightX, ry, halfW);
      ry += 13;
      ctx.font = `400 7.5px ${font}`;
      ctx.fillStyle = "#555555";
      if (config.clientAddress) {
        ry = wrapClip(config.clientAddress, rightX, ry, halfW, 11);
      }
      if (config.clientEmail) {
        safeText(config.clientEmail, rightX, ry, halfW);
        ry += 11;
      }

      return Math.max(y, ry) + 10;
    }

    /* ─── Invoice details row ─── */
    function drawInvoiceMeta(startY: number): number {
      const y = startY;
      ctx.font = `400 7px ${font}`;
      ctx.fillStyle = "#999999";
      const items2 = [
        { label: "INVOICE #", val: config.invoiceNumber },
        { label: "DATE", val: config.invoiceDate },
        { label: "DUE DATE", val: config.dueDate || "On receipt" },
        { label: "CURRENCY", val: config.currency },
      ];
      const colW = CW / items2.length;
      items2.forEach((item, i) => {
        const x = M + i * colW;
        ctx.fillStyle = "#999999";
        ctx.font = `600 6.5px ${font}`;
        safeText(item.label, x, y, colW);
        ctx.fillStyle = "#111111";
        ctx.font = `500 8px ${font}`;
        safeText(item.val, x, y + 12, colW);
      });
      return y + 30;
    }

    let y = M;

    /* ═══════════════════════════════════════════════════════ */
    /* TEMPLATE: Modern                                       */
    /* ═══════════════════════════════════════════════════════ */
    if (config.template === "modern") {
      /* Gradient header */
      const hdrH = 80;
      const grad = ctx.createLinearGradient(0, 0, W, hdrH);
      grad.addColorStop(0, primary);
      grad.addColorStop(1, lighten(primary, 20));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, hdrH);

      /* Decorative circle */
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(W - 60, 40, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#ffffff";
      ctx.font = `800 20px ${font}`;
      ctx.textAlign = "left";
      safeText("INVOICE", M, 40, CW);
      ctx.font = `300 9px ${font}`;
      ctx.fillStyle = "#ffffffcc";
      safeText(config.businessName || "Your Business", M, 56, CW);

      y = hdrH + 20;
      y = drawInvoiceMeta(y);
      y = drawAddresses(y);
      y = drawItemTable(y, M, CW);

      /* Notes */
      if (config.notes && y < maxY - 30) {
        y += 8;
        ctx.fillStyle = "#999999";
        ctx.font = `600 7px ${font}`;
        safeText("NOTES", M, y, CW);
        y += 12;
        ctx.fillStyle = "#555555";
        ctx.font = `400 7.5px ${font}`;
        y = wrapClip(config.notes, M, y, CW, 11);
      }

      /* Footer line */
      ctx.fillStyle = primary;
      ctx.fillRect(0, H - 4, W, 4);

    /* ═══════════════════════════════════════════════════════ */
    /* TEMPLATE: Classic                                      */
    /* ═══════════════════════════════════════════════════════ */
    } else if (config.template === "classic") {
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, 3);

      ctx.textAlign = "center";
      ctx.fillStyle = "#111111";
      ctx.font = `700 18px ${font}`;
      safeText(config.businessName || "Your Business", W / 2, y + 28, CW);
      ctx.font = `400 8px ${font}`;
      ctx.fillStyle = "#777777";
      safeText(
        [config.businessAddress, config.businessPhone, config.businessEmail]
          .filter(Boolean)
          .join("  |  "),
        W / 2,
        y + 42,
        CW,
      );
      ctx.textAlign = "left";

      /* INVOICE title */
      y += 64;
      ctx.fillStyle = primary;
      ctx.font = `700 14px ${font}`;
      safeText("INVOICE", M, y, CW);
      y += 8;
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(M, y);
      ctx.lineTo(W - M, y);
      ctx.stroke();
      y += 16;

      y = drawInvoiceMeta(y);
      y = drawAddresses(y);
      y = drawItemTable(y, M, CW);

      if (config.notes && y < maxY - 30) {
        y += 8;
        ctx.fillStyle = "#999999";
        ctx.font = `600 7px ${font}`;
        safeText("NOTES", M, y, CW);
        y += 12;
        ctx.fillStyle = "#555555";
        ctx.font = `400 7.5px ${font}`;
        y = wrapClip(config.notes, M, y, CW, 11);
      }

      ctx.fillStyle = primary;
      ctx.fillRect(0, H - 3, W, 3);

    /* ═══════════════════════════════════════════════════════ */
    /* TEMPLATE: Minimal                                      */
    /* ═══════════════════════════════════════════════════════ */
    } else if (config.template === "minimal") {
      ctx.font = `300 24px ${font}`;
      ctx.fillStyle = "#111111";
      safeText("Invoice", M, y + 30, CW);
      ctx.font = `400 8px ${font}`;
      ctx.fillStyle = "#aaaaaa";
      safeText(config.invoiceNumber, M, y + 44, CW);
      y += 60;

      y = drawAddresses(y);
      y = drawInvoiceMeta(y);
      y += 6;
      y = drawItemTable(y, M, CW);

      if (config.notes && y < maxY - 30) {
        y += 8;
        ctx.fillStyle = "#aaaaaa";
        ctx.font = `400 7px ${font}`;
        y = wrapClip(config.notes, M, y, CW, 11);
      }

    /* ═══════════════════════════════════════════════════════ */
    /* TEMPLATE: Bold                                         */
    /* ═══════════════════════════════════════════════════════ */
    } else if (config.template === "bold") {
      /* Full colored left strip */
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, 60, H);

      /* Rotated "INVOICE" on strip */
      ctx.save();
      ctx.translate(34, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 14px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("INVOICE", 0, 0);
      ctx.restore();
      ctx.textAlign = "left";

      const bM = 76;
      const bCW = W - bM - M;

      y = M;
      ctx.fillStyle = "#111111";
      ctx.font = `700 16px ${font}`;
      safeText(config.businessName || "Your Business", bM, y + 14, bCW);
      ctx.font = `400 8px ${font}`;
      ctx.fillStyle = "#777777";
      safeText(
        [config.businessEmail, config.businessPhone].filter(Boolean).join(" | "),
        bM,
        y + 28,
        bCW,
      );
      y += 50;

      /* Invoice meta */
      ctx.font = `400 7px ${font}`;
      const meta = [
        { l: "Invoice", v: config.invoiceNumber },
        { l: "Date", v: config.invoiceDate },
        { l: "Due", v: config.dueDate || "On receipt" },
      ];
      meta.forEach((m) => {
        ctx.fillStyle = "#999999";
        ctx.font = `600 6.5px ${font}`;
        safeText(m.l.toUpperCase(), bM, y, 60);
        ctx.fillStyle = "#111111";
        ctx.font = `500 8px ${font}`;
        safeText(m.v, bM + 62, y, bCW - 62);
        y += 14;
      });
      y += 10;

      /* Client */
      ctx.fillStyle = "#999999";
      ctx.font = `600 6.5px ${font}`;
      safeText("BILL TO", bM, y, bCW);
      y += 12;
      ctx.fillStyle = "#111111";
      ctx.font = `700 9px ${font}`;
      safeText(config.clientName || "Client Name", bM, y, bCW);
      y += 12;
      ctx.fillStyle = "#555555";
      ctx.font = `400 7.5px ${font}`;
      if (config.clientAddress) y = wrapClip(config.clientAddress, bM, y, bCW, 11);
      if (config.clientEmail) { safeText(config.clientEmail, bM, y, bCW); y += 11; }
      y += 10;

      y = drawItemTable(y, bM, bCW);

      if (config.notes && y < maxY - 30) {
        y += 8;
        ctx.fillStyle = "#999999";
        ctx.font = `600 7px ${font}`;
        safeText("NOTES", bM, y, bCW);
        y += 12;
        ctx.fillStyle = "#555555";
        ctx.font = `400 7.5px ${font}`;
        y = wrapClip(config.notes, bM, y, bCW, 11);
      }

    /* ═══════════════════════════════════════════════════════ */
    /* TEMPLATE: Elegant                                      */
    /* ═══════════════════════════════════════════════════════ */
    } else if (config.template === "elegant") {
      /* Thin top & bottom border */
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1;
      ctx.strokeRect(M - 8, M - 8, W - 2 * (M - 8), H - 2 * (M - 8));

      ctx.textAlign = "right";
      ctx.fillStyle = primary;
      ctx.font = `300 22px Georgia, serif`;
      safeText("INVOICE", W - M, y + 26, CW);
      ctx.font = `400 8px Georgia, serif`;
      ctx.fillStyle = "#aaaaaa";
      safeText(config.invoiceNumber, W - M, y + 40, CW);
      ctx.textAlign = "left";

      ctx.fillStyle = "#111111";
      ctx.font = `700 10px Georgia, serif`;
      safeText(config.businessName || "Your Business", M, y + 26, CW / 2);
      ctx.font = `400 7.5px Georgia, serif`;
      ctx.fillStyle = "#777777";
      let ey = y + 40;
      if (config.businessAddress) { safeText(config.businessAddress, M, ey, CW / 2); ey += 11; }
      if (config.businessEmail) { safeText(config.businessEmail, M, ey, CW / 2); ey += 11; }

      y = Math.max(ey, y + 56) + 10;

      /* Elegant divider */
      ctx.strokeStyle = primary + "33";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(M, y);
      ctx.lineTo(W - M, y);
      ctx.stroke();
      y += 16;

      y = drawInvoiceMeta(y);
      y = drawAddresses(y);
      y = drawItemTable(y, M, CW);

      if (config.notes && y < maxY - 30) {
        y += 8;
        ctx.fillStyle = "#aaaaaa";
        ctx.font = `italic 400 7.5px Georgia, serif`;
        y = wrapClip(config.notes, M, y, CW, 11);
      }

    /* ═══════════════════════════════════════════════════════ */
    /* TEMPLATE: Corporate                                    */
    /* ═══════════════════════════════════════════════════════ */
    } else {
      /* Header bar */
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, 50);

      /* Dot grid decoration */
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#ffffff";
      for (let gx = W - 100; gx < W; gx += 10) {
        for (let gy = 5; gy < 45; gy += 10) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#ffffff";
      ctx.font = `700 14px ${font}`;
      safeText(config.businessName || "Your Business", M, 32, CW * 0.6);
      ctx.font = `400 8px ${font}`;
      ctx.fillStyle = "#ffffffaa";
      ctx.textAlign = "right";
      safeText("INVOICE " + config.invoiceNumber, W - M, 32, CW * 0.3);
      ctx.textAlign = "left";

      y = 66;
      y = drawInvoiceMeta(y);
      y = drawAddresses(y);
      y = drawItemTable(y, M, CW);

      if (config.notes && y < maxY - 30) {
        y += 8;
        ctx.fillStyle = "#999999";
        ctx.font = `600 7px ${font}`;
        safeText("NOTES / TERMS", M, y, CW);
        y += 12;
        ctx.fillStyle = "#555555";
        ctx.font = `400 7.5px ${font}`;
        y = wrapClip(config.notes, M, y, CW, 11);
      }

      /* Footer */
      ctx.fillStyle = primary;
      ctx.fillRect(0, H - 24, W, 24);
      ctx.fillStyle = "#ffffffcc";
      ctx.font = `400 7px ${font}`;
      ctx.textAlign = "center";
      safeText("Thank you for your business", W / 2, H - 10, CW);
      ctx.textAlign = "left";
    }
  }, [config, items, subtotal, taxAmount, total, sym, pageDims]);

  /* ── AI Generation ──────────────────────────────────────── */
  const generateInvoice = useCallback(async () => {
    if (!config.description.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `You are a professional invoice creator. Generate invoice details.

DESCRIPTION: "${config.description}"
LOCALE: Zambia (default currency ZMW, Zambian Kwacha, symbol K)
TEMPLATE: ${config.template}

Return ONLY a JSON object (no markdown, no backticks):
{
  "businessName": "Company Name Ltd",
  "businessAddress": "Plot 123, Cairo Road, Lusaka, Zambia",
  "businessEmail": "info@company.co.zm",
  "businessPhone": "+260 211 XXX XXX",
  "clientName": "Client Company",
  "clientAddress": "123 Independence Ave, Lusaka",
  "clientEmail": "client@email.com",
  "invoiceNumber": "INV-2025-001",
  "dueDate": "2025-02-28",
  "notes": "Payment terms: Net 30. Bank: Zanaco, Acc: XXXXXX",
  "items": [
    { "description": "Service description", "quantity": 1, "rate": 5000 }
  ],
  "color": "#hex"
}

Rules:
- 3-6 realistic line items relevant to the described service/business
- Use Zambian business context (addresses, phone format +260, etc.)
- Professional payment terms in notes
- Rates should be in Zambian Kwacha amounts (realistic ZMW values)`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      if (!response.ok) throw new Error("Failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      let fullText = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        updateConfig({
          businessName: cleanAIText(data.businessName || ""),
          businessAddress: cleanAIText(data.businessAddress || ""),
          businessEmail: cleanAIText(data.businessEmail || ""),
          businessPhone: cleanAIText(data.businessPhone || ""),
          clientName: cleanAIText(data.clientName || ""),
          clientAddress: cleanAIText(data.clientAddress || ""),
          clientEmail: cleanAIText(data.clientEmail || ""),
          invoiceNumber: cleanAIText(data.invoiceNumber || config.invoiceNumber),
          dueDate: cleanAIText(data.dueDate || ""),
          notes: cleanAIText(data.notes || ""),
          ...(data.color ? { primaryColor: data.color } : {}),
        });
        if (data.items?.length) {
          setItems(
            data.items.map((it: Record<string, unknown>) => ({
              id: uid(),
              description: cleanAIText((it.description as string) || ""),
              quantity: (it.quantity as number) || 1,
              rate: (it.rate as number) || 0,
            })),
          );
        }
      }
    } catch {
      /* silent */
    } finally {
      setIsGenerating(false);
    }
  }, [config, updateConfig]);

  /* ── Export ──────────────────────────────────────────────── */
  const exportInvoice = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${config.invoiceNumber || "invoice"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [config.invoiceNumber]);

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* ── Left Panel ── */}
      <div className="w-72 shrink-0 overflow-y-auto space-y-3 pr-1">
        {/* AI Director */}
        <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
          <label className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-secondary-500 mb-2">
            <IconSparkles className="size-3" />
            AI Invoice Director
          </label>
          <textarea
            rows={3}
            placeholder="Describe the invoice: services provided, client industry, payment terms..."
            value={config.description}
            onChange={(e) => updateConfig({ description: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-secondary-500/20 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-secondary-500/50 focus:ring-2 focus:ring-secondary-500/20 transition-all resize-none mb-2"
          />
          <button
            onClick={generateInvoice}
            disabled={!config.description.trim() || isGenerating}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-linear-to-r from-secondary-500 to-primary-500 text-white text-[0.625rem] font-bold hover:from-secondary-400 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <IconLoader className="size-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <IconWand className="size-3" /> Generate Invoice
              </>
            )}
          </button>
        </div>

        {/* Page Size */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Page Size
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {PAGE_SIZES.map((ps) => (
              <button
                key={ps.id}
                onClick={() => updateConfig({ pageSize: ps.id })}
                className={`py-1.5 rounded-lg text-[0.625rem] font-semibold transition-all ${config.pageSize === ps.id ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                {ps.name}
              </button>
            ))}
          </div>
        </div>

        {/* Template */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Template
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => updateConfig({ template: t.id })}
                className={`flex flex-col items-start p-2 rounded-lg text-left transition-all ${config.template === t.id ? "ring-2 ring-primary-500 bg-primary-500/10" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                <span className="text-[0.625rem] font-semibold text-gray-700 dark:text-gray-300">
                  {t.name}
                </span>
                <span className="text-[0.5rem] text-gray-400">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Accent Color
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => updateConfig({ primaryColor: c })}
                className={`size-6 rounded-full transition-all ${config.primaryColor === c ? "ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-gray-900" : "hover:scale-110"}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={config.primaryColor}
              onChange={(e) => updateConfig({ primaryColor: e.target.value })}
              className="size-6 rounded-full cursor-pointer border-0"
            />
          </div>
        </div>

        {/* Currency */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Currency
          </label>
          <div className="grid grid-cols-2 gap-1">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() =>
                  updateConfig({ currency: c.code, currencySymbol: c.symbol })
                }
                className={`py-1.5 px-2 rounded-lg text-left transition-all ${config.currency === c.code ? "ring-2 ring-primary-500 bg-primary-500/10" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                <span className="text-[0.625rem] font-semibold text-gray-700 dark:text-gray-300">
                  {c.symbol} {c.code}
                </span>
                <span className="block text-[0.5rem] text-gray-400">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3">
          <button
            onClick={exportInvoice}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-linear-to-r from-primary-500 to-secondary-500 text-white text-[0.625rem] font-bold hover:from-primary-400 hover:to-secondary-400 transition-colors"
          >
            <IconDownload className="size-3" /> Export Invoice (PNG)
          </button>
        </div>
      </div>

      {/* ── Center: Canvas ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-950/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-auto p-4">
        <canvas
          ref={canvasRef}
          className="shadow-2xl rounded-sm bg-white"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
          }}
        />
      </div>

      {/* ── Right Panel ── */}
      <div className="w-80 shrink-0 overflow-y-auto space-y-3 pl-1">
        {/* Tabs */}
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {(
            [
              { id: "business" as const, label: "Business" },
              { id: "client" as const, label: "Client" },
              { id: "items" as const, label: "Items" },
              { id: "details" as const, label: "Details" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-[0.5625rem] font-semibold transition-all ${activeTab === tab.id ? "bg-primary-500/10 text-primary-500" : "bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Business */}
        {activeTab === "business" && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
            <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
              Your Business
            </label>
            {(
              [
                {
                  key: "businessName",
                  label: "Business Name",
                  ph: "Acme Ltd",
                },
                {
                  key: "businessAddress",
                  label: "Address",
                  ph: "Plot 123, Cairo Road, Lusaka",
                },
                {
                  key: "businessEmail",
                  label: "Email",
                  ph: "info@acme.co.zm",
                },
                {
                  key: "businessPhone",
                  label: "Phone",
                  ph: "+260 211 123 456",
                },
                {
                  key: "businessWebsite",
                  label: "Website",
                  ph: "www.acme.co.zm",
                },
              ] as const
            ).map(({ key, label, ph }) => (
              <div key={key}>
                <label className="text-[0.5625rem] text-gray-500">
                  {label}
                </label>
                <input
                  type="text"
                  value={config[key]}
                  onChange={(e) => updateConfig({ [key]: e.target.value })}
                  placeholder={ph}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
            ))}
          </div>
        )}

        {/* Client */}
        {activeTab === "client" && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
            <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
              Bill To
            </label>
            {(
              [
                { key: "clientName", label: "Client Name", ph: "Client Co." },
                {
                  key: "clientAddress",
                  label: "Address",
                  ph: "456 Independence Ave, Lusaka",
                },
                {
                  key: "clientEmail",
                  label: "Email",
                  ph: "client@email.com",
                },
              ] as const
            ).map(({ key, label, ph }) => (
              <div key={key}>
                <label className="text-[0.5625rem] text-gray-500">
                  {label}
                </label>
                <input
                  type="text"
                  value={config[key]}
                  onChange={(e) => updateConfig({ [key]: e.target.value })}
                  placeholder={ph}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
            ))}
          </div>
        )}

        {/* Line Items */}
        {activeTab === "items" && (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <label className="text-[0.625rem] font-semibold text-gray-500">
                    Item {i + 1}
                  </label>
                  <button
                    onClick={() =>
                      setItems((p) => p.filter((_, j) => j !== i))
                    }
                    disabled={items.length <= 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <IconTrash className="size-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    setItems((p) =>
                      p.map((x, j) =>
                        j === i
                          ? { ...x, description: e.target.value }
                          : x,
                      ),
                    )
                  }
                  placeholder="Description"
                  className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50"
                />
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <label className="text-[0.5rem] text-gray-400">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        setItems((p) =>
                          p.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  quantity: parseInt(e.target.value) || 1,
                                }
                              : x,
                          ),
                        )
                      }
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[0.5rem] text-gray-400">
                      Rate ({sym})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.rate}
                      onChange={(e) =>
                        setItems((p) =>
                          p.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  rate: parseFloat(e.target.value) || 0,
                                }
                              : x,
                          ),
                        )
                      }
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[0.5rem] text-gray-400">
                      Amount
                    </label>
                    <div className="px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 text-[0.625rem] font-semibold text-gray-700 dark:text-gray-300">
                      {fmtMoney(item.quantity * item.rate, sym)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() =>
                setItems((p) => [
                  ...p,
                  { id: uid(), description: "", quantity: 1, rate: 0 },
                ])
              }
              className="w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-[0.625rem] text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
            >
              <IconPlus className="size-3 inline mr-1" /> Add Item
            </button>

            {/* Totals summary */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span>{fmtMoney(subtotal, sym)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {config.taxLabel} ({config.taxRate}%)
                </span>
                <span>{fmtMoney(taxAmount, sym)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 flex justify-between text-sm font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>
                  {fmtMoney(total, sym)} {config.currency}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        {activeTab === "details" && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
            <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
              Invoice Details
            </label>
            <div>
              <label className="text-[0.5625rem] text-gray-500">
                Invoice #
              </label>
              <input
                type="text"
                value={config.invoiceNumber}
                onChange={(e) =>
                  updateConfig({ invoiceNumber: e.target.value })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[0.5625rem] text-gray-500">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={config.invoiceDate}
                  onChange={(e) =>
                    updateConfig({ invoiceDate: e.target.value })
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="text-[0.5625rem] text-gray-500">
                  Due Date
                </label>
                <input
                  type="date"
                  value={config.dueDate}
                  onChange={(e) =>
                    updateConfig({ dueDate: e.target.value })
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[0.5625rem] text-gray-500">
                  Tax Label
                </label>
                <input
                  type="text"
                  value={config.taxLabel}
                  onChange={(e) =>
                    updateConfig({ taxLabel: e.target.value })
                  }
                  placeholder="VAT"
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="text-[0.5625rem] text-gray-500">
                  Tax Rate %
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={config.taxRate}
                  onChange={(e) =>
                    updateConfig({
                      taxRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-[0.5625rem] text-gray-500">
                Notes / Terms
              </label>
              <textarea
                rows={3}
                value={config.notes}
                onChange={(e) => updateConfig({ notes: e.target.value })}
                placeholder="Payment terms, bank details, thank you note..."
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
