"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconMail,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlus,
  IconTrash,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

interface ContentBlock {
  id: string;
  type: "heading" | "text" | "button" | "divider" | "image" | "spacer";
  content: string;
  align?: "left" | "center" | "right";
}

interface EmailConfig {
  preheader: string;
  headerText: string;
  footerText: string;
  template: EmailTemplate;
  theme: EmailTheme;
  primaryColor: string;
  width: number;
  description: string;
}

type EmailTemplate =
  | "newsletter"
  | "promotional"
  | "transactional"
  | "welcome"
  | "announcement"
  | "minimal";

type EmailTheme = "light" | "dark" | "branded" | "elegant" | "modern" | "bold";

const TEMPLATES: { id: EmailTemplate; name: string; desc: string }[] = [
  { id: "newsletter", name: "Newsletter", desc: "Multi-section content" },
  { id: "promotional", name: "Promo", desc: "Hero + CTA focused" },
  { id: "transactional", name: "Transact", desc: "Receipts & confirmations" },
  { id: "welcome", name: "Welcome", desc: "Onboarding flow" },
  { id: "announcement", name: "Announce", desc: "Product updates" },
  { id: "minimal", name: "Minimal", desc: "Clean & simple" },
];

const THEMES: { id: EmailTheme; name: string }[] = [
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
  { id: "branded", name: "Branded" },
  { id: "elegant", name: "Elegant" },
  { id: "modern", name: "Modern" },
  { id: "bold", name: "Bold" },
];

const COLOR_PRESETS = [
  "#1e40af",
  "#0f766e",
  "#4338ca",
  "#b91c1c",
  "#c2410c",
  "#0e7490",
  "#7c3aed",
  "#0f172a",
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

function darken(hex: string, pct: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round((255 * pct) / 100));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round((255 * pct) / 100));
  const b = Math.max(0, (num & 0xff) - Math.round((255 * pct) / 100));
  return `rgb(${r},${g},${b})`;
}

/* ── Component ─────────────────────────────────────────────── */

export default function EmailTemplateWorkspace() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([
    { id: uid(), type: "heading", content: "", align: "center" },
    { id: uid(), type: "text", content: "", align: "left" },
    { id: uid(), type: "button", content: "", align: "center" },
  ]);

  const [config, setConfig] = useState<EmailConfig>({
    preheader: "",
    headerText: "",
    footerText: "",
    template: "newsletter",
    theme: "light",
    primaryColor: "#1e40af",
    width: 600,
    description: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const updateConfig = useCallback((upd: Partial<EmailConfig>) => {
    setConfig((p) => ({ ...p, ...upd }));
  }, []);

  /* ── Canvas Render ──────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const W = config.width;
    const font = "'Inter', 'Segoe UI', sans-serif";
    const primary = config.primaryColor;
    const P = 28; /* inner padding */
    const contentW = W - P * 2;

    /* Theme colors */
    let bgColor = "#f4f4f7";
    let cardBg = "#ffffff";
    let textColor = "#333333";
    let mutedColor = "#888888";
    let borderColor = "#e5e7eb";

    if (config.theme === "dark") {
      bgColor = "#1a1a2e";
      cardBg = "#16213e";
      textColor = "#e0e0e0";
      mutedColor = "#9a9ab0";
      borderColor = "#2a2a4a";
    } else if (config.theme === "branded") {
      bgColor = primary + "08";
      cardBg = "#ffffff";
      textColor = "#1a1a1a";
      mutedColor = "#666666";
      borderColor = primary + "22";
    } else if (config.theme === "elegant") {
      bgColor = "#faf9f6";
      cardBg = "#ffffff";
      textColor = "#2c2c2c";
      mutedColor = "#8a8a8a";
      borderColor = "#e8e4de";
    } else if (config.theme === "modern") {
      bgColor = "#f0f4f8";
      cardBg = "#ffffff";
      textColor = "#1e293b";
      mutedColor = "#64748b";
      borderColor = "#e2e8f0";
    } else if (config.theme === "bold") {
      bgColor = primary;
      cardBg = "#ffffff";
      textColor = "#111111";
      mutedColor = "#555555";
      borderColor = "#dddddd";
    }

    /* First pass: calculate total height */
    const headerH = config.template === "promotional" ? 120 : 60;
    const footerH = 60;
    let estimatedH = 24 + headerH + 20; /* top padding + header + gap */

    blocks.forEach((block) => {
      switch (block.type) {
        case "heading":
          estimatedH += 36;
          break;
        case "text": {
          const words = (block.content || "Preview text goes here").split(" ");
          const lines = Math.ceil(
            words.length / (contentW / 40 > 0 ? contentW / 40 : 8),
          );
          estimatedH += Math.max(lines * 16, 20) + 12;
          break;
        }
        case "button":
          estimatedH += 50;
          break;
        case "divider":
          estimatedH += 24;
          break;
        case "image":
          estimatedH += 140;
          break;
        case "spacer":
          estimatedH += 24;
          break;
      }
    });

    estimatedH += footerH + 24; /* footer + bottom padding */
    const H = Math.max(estimatedH, 400);
    canvas.width = W;
    canvas.height = H;

    /* Background */
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    let y = 12;

    /* ─── Header ─── */
    if (
      config.template === "promotional" ||
      config.template === "welcome" ||
      config.template === "announcement"
    ) {
      /* Hero header */
      const hH = 120;
      const grad = ctx.createLinearGradient(0, y, 0, y + hH);
      grad.addColorStop(0, primary);
      grad.addColorStop(1, darken(primary, 15));
      ctx.fillStyle = grad;
      roundRect(ctx, 0, y, W, hH, 0);
      ctx.fill();

      /* Decorative elements */
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(W - 40, y + 30, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(40, y + hH - 20, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#ffffff";
      ctx.font = `700 18px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(
        config.headerText || "Your Brand",
        W / 2,
        y + hH / 2 - 6,
        contentW,
      );
      ctx.font = `300 10px ${font}`;
      ctx.fillStyle = "#ffffffbb";
      ctx.fillText(
        config.preheader || "Preview text here",
        W / 2,
        y + hH / 2 + 14,
        contentW,
      );
      ctx.textAlign = "left";
      y += hH + 12;
    } else {
      /* Simple header */
      ctx.fillStyle = cardBg;
      roundRect(ctx, 0, y, W, 50, 0);
      ctx.fill();

      /* Bottom border */
      ctx.fillStyle = primary;
      ctx.fillRect(0, y + 48, W, 2);

      ctx.fillStyle = textColor;
      ctx.font = `700 13px ${font}`;
      ctx.textAlign =
        config.template === "minimal" ? "left" : "center";
      const headerX = config.template === "minimal" ? P : W / 2;
      ctx.fillText(
        config.headerText || "Your Brand",
        headerX,
        y + 30,
        contentW,
      );
      ctx.textAlign = "left";
      y += 62;
    }

    /* ─── Card body ─── */
    const cardStartY = y;
    const cardPadTop = 20;
    y += cardPadTop;

    /* Render blocks */
    blocks.forEach((block) => {
      const align = block.align || "left";

      switch (block.type) {
        case "heading": {
          ctx.fillStyle = textColor;
          ctx.font = `700 16px ${font}`;
          ctx.textAlign = align;
          const hx =
            align === "center" ? W / 2 : align === "right" ? W - P : P;
          ctx.fillText(
            block.content || "Heading",
            hx,
            y + 14,
            contentW,
          );
          ctx.textAlign = "left";
          y += 36;
          break;
        }
        case "text": {
          ctx.fillStyle = textColor;
          ctx.font = `400 10px ${font}`;
          ctx.textAlign = align;
          const tx =
            align === "center" ? W / 2 : align === "right" ? W - P : P;
          const text = block.content || "Your email body text goes here. Add compelling content to engage your readers.";
          /* Word wrap */
          const words = text.split(" ");
          let line = "";
          const lh = 16;
          for (const word of words) {
            const test = line + word + " ";
            if (ctx.measureText(test).width > contentW && line) {
              ctx.fillText(line.trim(), tx, y, contentW);
              line = word + " ";
              y += lh;
            } else {
              line = test;
            }
          }
          ctx.fillText(line.trim(), tx, y, contentW);
          ctx.textAlign = "left";
          y += lh + 12;
          break;
        }
        case "button": {
          const label = block.content || "Call to Action";
          const btnW = Math.min(
            ctx.measureText(label).width + 48,
            contentW * 0.7,
          );
          ctx.font = `600 10px ${font}`;
          const realBtnW = Math.max(
            btnW,
            ctx.measureText(label).width + 48,
          );
          let bx = P;
          if (align === "center") bx = (W - realBtnW) / 2;
          else if (align === "right") bx = W - P - realBtnW;

          /* Button shadow */
          ctx.fillStyle = primary + "22";
          roundRect(ctx, bx, y + 4, realBtnW, 34, 6);
          ctx.fill();
          /* Button */
          ctx.fillStyle = primary;
          roundRect(ctx, bx, y, realBtnW, 34, 6);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = `600 10px ${font}`;
          ctx.textAlign = "center";
          ctx.fillText(label, bx + realBtnW / 2, y + 20, realBtnW - 16);
          ctx.textAlign = "left";
          y += 50;
          break;
        }
        case "divider": {
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(P, y + 12);
          ctx.lineTo(W - P, y + 12);
          ctx.stroke();
          y += 24;
          break;
        }
        case "image": {
          /* Image placeholder */
          ctx.fillStyle =
            config.theme === "dark" ? "#2a2a4a" : "#f0f0f0";
          roundRect(ctx, P, y, contentW, 120, 6);
          ctx.fill();
          ctx.fillStyle = mutedColor;
          ctx.font = `400 10px ${font}`;
          ctx.textAlign = "center";
          ctx.fillText(
            block.content || "Image Placeholder",
            W / 2,
            y + 65,
            contentW,
          );
          /* Camera icon placeholder */
          ctx.font = `400 24px ${font}`;
          ctx.fillText("\uD83D\uDDBC", W / 2, y + 45, contentW);
          ctx.textAlign = "left";
          y += 132;
          break;
        }
        case "spacer":
          y += 24;
          break;
      }
    });

    y += 12; /* bottom card padding */

    /* Draw card background behind content */
    const cardH = y - cardStartY;
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = cardBg;
    if (config.theme === "bold") {
      /* For bold theme, card has rounded corners */
      roundRect(ctx, 16, cardStartY, W - 32, cardH, 8);
    } else {
      ctx.fillRect(0, cardStartY, W, cardH);
    }
    ctx.fill();
    ctx.restore();

    /* ─── Footer ─── */
    y += 8;
    ctx.fillStyle = mutedColor;
    ctx.font = `400 8px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(
      config.footerText ||
        "© 2025 Your Company | Lusaka, Zambia",
      W / 2,
      y + 14,
      contentW,
    );
    ctx.font = `400 7px ${font}`;
    ctx.fillStyle = primary;
    ctx.fillText("Unsubscribe | Preferences | View in Browser", W / 2, y + 30, contentW);
    ctx.textAlign = "left";

    /* Resize canvas to actual content height */
    const finalH = y + 50;
    if (finalH !== H) {
      canvas.height = finalH;
      /* Re-trigger render by invalidating - but we just set it, so just re-draw bg */
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, finalH);
      /* Note: React will re-render due to height change */
    }
  }, [blocks, config]);

  /* ── AI Generation ──────────────────────────────────────── */
  const generateEmail = useCallback(async () => {
    if (!config.description.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `You are an expert email marketing designer. Create an email template.

DESCRIPTION: "${config.description}"
TEMPLATE TYPE: ${config.template}
THEME: ${config.theme}
LOCALE: Zambia

Return ONLY a JSON object (no markdown, no backticks):
{
  "headerText": "Brand / Company Name",
  "preheader": "Short preview text seen in inbox",
  "footerText": "© 2025 Company Name | Lusaka, Zambia",
  "blocks": [
    { "type": "heading", "content": "Main Headline", "align": "center" },
    { "type": "text", "content": "Engaging paragraph text...", "align": "left" },
    { "type": "image", "content": "Hero product image", "align": "center" },
    { "type": "text", "content": "More body text...", "align": "left" },
    { "type": "button", "content": "Shop Now", "align": "center" },
    { "type": "divider", "content": "", "align": "center" },
    { "type": "text", "content": "Footer message...", "align": "center" }
  ],
  "color": "#hex"
}

Block types: heading, text, button, divider, image, spacer
Align options: left, center, right

Rules:
- 5-8 content blocks for a complete email layout
- Compelling headlines and clear CTAs
- Professional copy appropriate for ${config.template} type
- Include image placeholders where appropriate
- Use Zambian business context`;

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
        if (data.headerText)
          updateConfig({ headerText: cleanAIText(data.headerText) });
        if (data.preheader)
          updateConfig({ preheader: cleanAIText(data.preheader) });
        if (data.footerText)
          updateConfig({ footerText: cleanAIText(data.footerText) });
        if (data.color) updateConfig({ primaryColor: data.color });
        if (data.blocks?.length) {
          setBlocks(
            data.blocks.map(
              (b: { type?: string; content?: string; align?: string }) => ({
                id: uid(),
                type: b.type || "text",
                content: cleanAIText(b.content || ""),
                align: b.align || "left",
              }),
            ),
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
  const exportEmail = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "email-template.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* ── Left Panel ── */}
      <div className="w-72 shrink-0 overflow-y-auto space-y-3 pr-1">
        {/* AI Director */}
        <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
          <label className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-secondary-500 mb-2">
            <IconSparkles className="size-3" />
            AI Email Director
          </label>
          <textarea
            rows={3}
            placeholder="Describe your email: purpose, audience, key message, CTA..."
            value={config.description}
            onChange={(e) => updateConfig({ description: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-secondary-500/20 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-secondary-500/50 focus:ring-2 focus:ring-secondary-500/20 transition-all resize-none mb-2"
          />
          <button
            onClick={generateEmail}
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
                <IconWand className="size-3" /> Generate Email
              </>
            )}
          </button>
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

        {/* Theme */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-1">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => updateConfig({ theme: t.id })}
                className={`py-1.5 rounded-lg text-[0.625rem] font-semibold transition-all ${config.theme === t.id ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Brand Color
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

        {/* Width */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Width: {config.width}px
          </label>
          <input
            type="range"
            min={400}
            max={700}
            value={config.width}
            onChange={(e) =>
              updateConfig({ width: parseInt(e.target.value) })
            }
            className="w-full h-1 accent-primary-500"
          />
        </div>

        {/* Header/Footer */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Header & Footer
          </label>
          <div>
            <label className="text-[0.5625rem] text-gray-500">
              Header / Brand Name
            </label>
            <input
              type="text"
              value={config.headerText}
              onChange={(e) => updateConfig({ headerText: e.target.value })}
              placeholder="Your Brand"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[0.5625rem] text-gray-500">
              Preheader Text
            </label>
            <input
              type="text"
              value={config.preheader}
              onChange={(e) => updateConfig({ preheader: e.target.value })}
              placeholder="Preview text in inbox..."
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[0.5625rem] text-gray-500">
              Footer Text
            </label>
            <input
              type="text"
              value={config.footerText}
              onChange={(e) => updateConfig({ footerText: e.target.value })}
              placeholder="\u00A9 2025 Company | Lusaka, Zambia"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
            />
          </div>
        </div>

        {/* Export */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3">
          <button
            onClick={exportEmail}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-linear-to-r from-primary-500 to-secondary-500 text-white text-[0.625rem] font-bold hover:from-primary-400 hover:to-secondary-400 transition-colors"
          >
            <IconDownload className="size-3" /> Export Template (PNG)
          </button>
        </div>
      </div>

      {/* ── Center: Canvas ── */}
      <div className="flex-1 flex items-start justify-center bg-gray-100 dark:bg-gray-950/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-auto p-4">
        <canvas
          ref={canvasRef}
          className="shadow-2xl rounded-lg"
          style={{ maxWidth: "100%", width: config.width }}
        />
      </div>

      {/* ── Right Panel: Content Blocks ── */}
      <div className="w-80 shrink-0 overflow-y-auto space-y-3 pl-1">
        <div className="flex items-center justify-between px-1">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            <IconMail className="size-3 inline mr-1" />
            Content Blocks
          </label>
          <span className="text-[0.5rem] text-gray-400">
            {blocks.length} blocks
          </span>
        </div>

        {blocks.map((block, i) => (
          <div
            key={block.id}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[0.5rem] font-semibold text-gray-400 uppercase">
                  {block.type}
                </span>
                <select
                  value={block.type}
                  onChange={(e) =>
                    setBlocks((p) =>
                      p.map((b, j) =>
                        j === i
                          ? {
                              ...b,
                              type: e.target.value as ContentBlock["type"],
                            }
                          : b,
                      ),
                    )
                  }
                  className="text-[0.5625rem] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 text-gray-600 dark:text-gray-400"
                >
                  <option value="heading">Heading</option>
                  <option value="text">Text</option>
                  <option value="button">Button</option>
                  <option value="divider">Divider</option>
                  <option value="image">Image</option>
                  <option value="spacer">Spacer</option>
                </select>
              </div>
              <button
                onClick={() =>
                  setBlocks((p) => p.filter((_, j) => j !== i))
                }
                disabled={blocks.length <= 1}
                className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
              >
                <IconTrash className="size-3" />
              </button>
            </div>

            {block.type !== "divider" && block.type !== "spacer" && (
              <>
                {block.type === "text" || block.type === "heading" ? (
                  <textarea
                    rows={block.type === "heading" ? 2 : 3}
                    value={block.content}
                    onChange={(e) =>
                      setBlocks((p) =>
                        p.map((b, j) =>
                          j === i
                            ? { ...b, content: e.target.value }
                            : b,
                        ),
                      )
                    }
                    placeholder={
                      block.type === "heading"
                        ? "Heading text..."
                        : "Body text..."
                    }
                    className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) =>
                      setBlocks((p) =>
                        p.map((b, j) =>
                          j === i
                            ? { ...b, content: e.target.value }
                            : b,
                        ),
                      )
                    }
                    placeholder={
                      block.type === "button"
                        ? "Button label..."
                        : "Image URL or description..."
                    }
                    className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50"
                  />
                )}
                {/* Alignment */}
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() =>
                        setBlocks((p) =>
                          p.map((b, j) =>
                            j === i ? { ...b, align: a } : b,
                          ),
                        )
                      }
                      className={`flex-1 py-0.5 rounded text-[0.5rem] font-semibold capitalize transition-all ${block.align === a ? "bg-primary-500/10 text-primary-500" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add block */}
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              "heading",
              "text",
              "button",
              "divider",
              "image",
              "spacer",
            ] as const
          ).map((type) => (
            <button
              key={type}
              onClick={() =>
                setBlocks((p) => [
                  ...p,
                  { id: uid(), type, content: "", align: "center" },
                ])
              }
              className="py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-[0.5625rem] text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors capitalize"
            >
              + {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
