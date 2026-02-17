"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload,
  IconDroplet, IconFileText, IconLayout,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawHeaderArea, generateColorPalette, getTypographicScale, exportHighRes, EXPORT_PRESETS, drawImagePlaceholder } from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";

/* ── Types ─────────────────────────────────────────────────── */

type GuideTemplate = "technical" | "modern" | "minimal" | "friendly" | "corporate" | "dark";

interface GuideStep {
  id: string;
  text: string;
}

interface GuideSection {
  id: string;
  title: string;
  steps: GuideStep[];
  tip: string;
  warning: string;
}

interface GuideConfig {
  template: GuideTemplate;
  primaryColor: string;
  title: string;
  subtitle: string;
  product: string;
  version: string;
  activePage: number;
  description: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const TEMPLATES: { id: GuideTemplate; name: string }[] = [
  { id: "technical", name: "Technical" },
  { id: "modern", name: "Modern" },
  { id: "minimal", name: "Minimal" },
  { id: "friendly", name: "Friendly" },
  { id: "corporate", name: "Corporate" },
  { id: "dark", name: "Dark" },
];

const PAGE_W = 595, PAGE_H = 842;

const COLOR_PRESETS = [
  "#1e3a5f", "#0f4c75", "#3c1361", "#0d7377", "#1a1a2e",
  "#2d3436", "#6c5ce7", "#00b894", "#e17055", "#2d1b69",
  "#8ae600", "#06b6d4",
];

const PAGES = [
  { id: "cover", name: "Cover" },
  { id: "toc", name: "Contents" },
  { id: "sec1", name: "Getting Started" },
  { id: "sec2", name: "Core Features" },
  { id: "sec3", name: "Advanced" },
  { id: "sec4", name: "Troubleshooting" },
];

/* ── Component ───────────────────────────────────────────── */

export default function UserGuideWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [config, setConfig] = useState<GuideConfig>({
    template: "technical",
    primaryColor: "#0f4c75",
    title: "Mobile Banking App",
    subtitle: "User Guide & Documentation",
    product: "ZamPay Digital Banking",
    version: "Version 3.1 — 2026",
    activePage: 0,
    description: "",
  });

  const [sections, setSections] = useState<GuideSection[]>([
    {
      id: uid(),
      title: "Getting Started",
      steps: [
        { id: uid(), text: "Download ZamPay from the App Store or Google Play" },
        { id: uid(), text: "Open the app and tap \"Create Account\"" },
        { id: uid(), text: "Enter your Zambian national registration card number" },
        { id: uid(), text: "Verify your mobile number via SMS code" },
        { id: uid(), text: "Set up your 6-digit security PIN" },
      ],
      tip: "Use a strong PIN that is different from your phone unlock code for maximum security.",
      warning: "Never share your PIN or OTP code with anyone, including bank staff.",
    },
    {
      id: uid(),
      title: "Core Features",
      steps: [
        { id: uid(), text: "View account balances and recent transactions on the Dashboard" },
        { id: uid(), text: "Transfer money to other ZamPay users or bank accounts" },
        { id: uid(), text: "Pay utility bills using the Bill Pay section" },
        { id: uid(), text: "Purchase airtime for any Zambian mobile network" },
        { id: uid(), text: "Set up recurring payments and standing orders" },
      ],
      tip: "Add frequently used accounts to Favorites for faster transactions.",
      warning: "Double-check the recipient account number before confirming any transfer.",
    },
    {
      id: uid(),
      title: "Advanced Features",
      steps: [
        { id: uid(), text: "Enable biometric login in Settings > Security" },
        { id: uid(), text: "Set up budget alerts and spending categories" },
        { id: uid(), text: "Export transaction history as CSV or PDF" },
        { id: uid(), text: "Link additional bank accounts for consolidated view" },
      ],
      tip: "Use the budgeting tools to track your monthly spending across categories.",
      warning: "Enabling biometric login stores fingerprint data on-device only — it is never uploaded.",
    },
    {
      id: uid(),
      title: "Troubleshooting",
      steps: [
        { id: uid(), text: "If the app crashes, clear cache in phone settings and reopen" },
        { id: uid(), text: "For failed transactions, check your internet connection first" },
        { id: uid(), text: "Reset your PIN by tapping \"Forgot PIN\" on the login screen" },
        { id: uid(), text: "Contact support at 8585 or via the in-app chat" },
      ],
      tip: "Keep the app updated to the latest version for bug fixes and new features.",
      warning: "If you suspect unauthorized access, freeze your account immediately from Settings > Security.",
    },
  ]);

  const updateConfig = useCallback((partial: Partial<GuideConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  /* ── Canvas Render ───────────────────────────────────────── */

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = PAGE_W * 2;
    canvas.height = PAGE_H * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const { template, primaryColor, activePage } = config;
    const pal = generateColorPalette(primaryColor);
    const typo = getTypographicScale(PAGE_H);
    const m = 40;
    const cw = PAGE_W - m * 2;

    // Background
    const isDark = template === "dark";
    ctx.fillStyle = isDark ? "#1a1a2e" : "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    const textDark = isDark ? "#e2e8f0" : pal.textDark;
    const textMed = isDark ? "#94a3b8" : pal.textMedium;
    const textLight = isDark ? "#64748b" : pal.textLight;
    const cardBg = isDark ? "#16213e" : pal.offWhite;

    const page = PAGES[activePage]?.id || "cover";

    switch (page) {
      case "cover": {
        const headerH = PAGE_H * 0.5;
        const style = template === "modern" ? "wave" : template === "minimal" ? "minimal" : "gradient";
        drawHeaderArea(ctx, 0, 0, PAGE_W, headerH, primaryColor, style as "gradient" | "wave" | "minimal");

        // Pattern overlay
        if (template !== "minimal") {
          ctx.fillStyle = hexToRgba("#ffffff", 0.03);
          for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * PAGE_W, Math.random() * headerH, Math.random() * 35 + 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Product name badge
        ctx.fillStyle = hexToRgba("#ffffff", 0.15);
        ctx.font = getCanvasFont(600, 9, "modern");
        const prodText = config.product.toUpperCase();
        const badgeW = ctx.measureText(prodText).width + 24;
        roundRect(ctx, m, m + 10, badgeW, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(prodText, m + 12, m + 21);

        // Title
        drawProText(ctx, config.title, m, headerH * 0.45, {
          fontSize: typo.display + 4, fontWeight: 800, color: "#ffffff",
          maxWidth: cw, shadow: true,
        });

        // Subtitle
        drawProText(ctx, config.subtitle, m, headerH * 0.62, {
          fontSize: typo.h3, fontWeight: 400, color: hexToRgba("#ffffff", 0.85),
          maxWidth: cw,
        });

        // Accent line
        ctx.fillStyle = hexToRgba("#ffffff", 0.4);
        ctx.fillRect(m, headerH * 0.76, 60, 3);

        // Version info below header
        const infoY = headerH + 60;
        drawProText(ctx, config.version, m, infoY, {
          fontSize: typo.body, fontWeight: 500, color: isDark ? textMed : pal.textMedium,
        });

        // Screen placeholder
        drawImagePlaceholder(ctx, PAGE_W / 2 - 80, infoY + 30, 160, 220, primaryColor, "App Screen", 12);

        // Footer
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "toc": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 90, primaryColor, "gradient");
        drawProText(ctx, "TABLE OF CONTENTS", m, 20, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, config.title, m, 45, {
          fontSize: typo.h2, fontWeight: 800, color: "#ffffff",
        });

        let tocY = 120;
        sections.forEach((sec, i) => {
          ctx.fillStyle = i % 2 === 0 ? cardBg : (isDark ? "#1a1a2e" : "#ffffff");
          roundRect(ctx, m, tocY, cw, 55, 8);
          ctx.fill();

          // Section number
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(m + 22, tocY + 27, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = getCanvasFont(700, 11, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(i + 1), m + 22, tocY + 27);

          drawProText(ctx, sec.title, m + 48, tocY + 13, {
            fontSize: typo.body + 1, fontWeight: 700, color: textDark,
            maxWidth: cw - 100,
          });
          drawProText(ctx, `${sec.steps.length} steps`, m + 48, tocY + 33, {
            fontSize: typo.caption, fontWeight: 400, color: textMed,
          });

          drawProText(ctx, `p. ${i * 2 + 3}`, m + cw - 30, tocY + 22, {
            fontSize: typo.caption, fontWeight: 600, color: primaryColor, align: "right",
          });

          tocY += 66;
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      default: {
        const secIdx = ["sec1", "sec2", "sec3", "sec4"].indexOf(page);
        const section = sections[secIdx];
        if (!section) break;

        // Section header
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, `Section ${secIdx + 1}`, m, 18, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, section.title, m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
          maxWidth: cw,
        });

        let yPos = 120;

        // Numbered steps
        section.steps.forEach((step, i) => {
          const stepH = 38;
          ctx.fillStyle = i % 2 === 0 ? cardBg : (isDark ? "#1a1a2e" : "#ffffff");
          roundRect(ctx, m, yPos, cw, stepH, 6);
          ctx.fill();

          // Step number
          ctx.fillStyle = primaryColor;
          ctx.font = getCanvasFont(800, 14, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(i + 1), m + 20, yPos + stepH / 2);

          // Step text
          drawProText(ctx, step.text, m + 42, yPos + 12, {
            fontSize: typo.body, fontWeight: 500, color: textDark,
            maxWidth: cw - 60,
          });

          yPos += stepH + 6;
        });

        yPos += 16;

        // Tip box (green-tinted)
        if (section.tip) {
          const tipColor = "#00b894";
          ctx.fillStyle = hexToRgba(tipColor, isDark ? 0.12 : 0.06);
          const tipH = 60;
          roundRect(ctx, m, yPos, cw, tipH, 8);
          ctx.fill();
          ctx.fillStyle = tipColor;
          roundRect(ctx, m, yPos, 4, tipH, 4);
          ctx.fill();

          drawProText(ctx, "TIP", m + 16, yPos + 10, {
            fontSize: typo.label, fontWeight: 800, color: tipColor, uppercase: true,
          });

          ctx.font = getCanvasFont(400, typo.caption + 1, "modern");
          ctx.fillStyle = textDark;
          const tipLines = wrapCanvasText(ctx, section.tip, cw - 36);
          tipLines.forEach((line, i) => {
            ctx.fillText(line, m + 16, yPos + 30 + i * (typo.caption + 5));
          });

          yPos += tipH + 12;
        }

        // Warning box (orange-tinted)
        if (section.warning) {
          const warnColor = "#e17055";
          ctx.fillStyle = hexToRgba(warnColor, isDark ? 0.12 : 0.06);
          const warnH = 60;
          roundRect(ctx, m, yPos, cw, warnH, 8);
          ctx.fill();
          ctx.fillStyle = warnColor;
          roundRect(ctx, m, yPos, 4, warnH, 4);
          ctx.fill();

          drawProText(ctx, "WARNING", m + 16, yPos + 10, {
            fontSize: typo.label, fontWeight: 800, color: warnColor, uppercase: true,
          });

          ctx.font = getCanvasFont(400, typo.caption + 1, "modern");
          ctx.fillStyle = textDark;
          const warnLines = wrapCanvasText(ctx, section.warning, cw - 36);
          warnLines.forEach((line, i) => {
            ctx.fillText(line, m + 16, yPos + 30 + i * (typo.caption + 5));
          });

          yPos += warnH + 12;
        }

        // Footer
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }
    }

    // Page number
    ctx.fillStyle = isDark ? textLight : pal.textLight;
    ctx.font = getCanvasFont(500, 9, "modern");
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${activePage + 1} / ${PAGES.length}`, PAGE_W / 2, PAGE_H - 14);
  }, [config, sections]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  /* ── AI Generate ─────────────────────────────────────────── */

  const handleAIGenerate = useCallback(async () => {
    if (!config.description.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate a user guide outline for: "${config.description}".
Return JSON: { "title": "", "subtitle": "", "product": "", "sections": [{ "title": "", "steps": [{ "text": "" }], "tip": "helpful tip", "warning": "important warning" }] }
Generate exactly 4 sections: Getting Started, Core Features, Advanced Features, Troubleshooting. Each with 4-5 steps.`,
          }],
        }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      let text = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      const cleaned = cleanAIText(text);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        updateConfig({
          title: data.title || config.title,
          subtitle: data.subtitle || config.subtitle,
          product: data.product || config.product,
        });
        if (data.sections?.length) {
          setSections(data.sections.map((s: { title: string; steps: { text: string }[]; tip: string; warning: string }) => ({
            id: uid(),
            title: s.title,
            steps: (s.steps || []).map((st: { text: string }) => ({ id: uid(), text: st.text })),
            tip: s.tip || "",
            warning: s.warning || "",
          })));
        }
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config.description, isGenerating, updateConfig, config.title, config.subtitle, config.product]);

  /* ── Export ──────────────────────────────────────────────── */

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const settings = EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"];
    exportHighRes(canvas, settings, `user-guide-${PAGES[config.activePage]?.id || "page"}`);
  }, [config.activePage]);

  /* ── Template Previews ──────────────────────────────────── */

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const hStyle = t.id === "modern" ? "gradient" : t.id === "minimal" ? "minimal" : t.id === "corporate" ? "bar" : t.id === "dark" ? "gradient" : "centered";
      drawDocumentThumbnail(ctx, w, h, {
        primaryColor: t.id === "dark" ? "#1a1a2e" : config.primaryColor,
        headerStyle: hStyle as "bar" | "gradient" | "centered" | "minimal",
        showSections: 4,
      });
    },
  }));

  const displayW = 380;
  const displayH = Math.round(displayW * (PAGE_H / PAGE_W));

  /* ── Left Panel ──────────────────────────────────────────── */

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea
          value={config.description}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe your user guide… e.g., 'User guide for a mobile banking app used in Zambia'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Guide</>}
        </button>
      </AccordionSection>

      <AccordionSection id="details" icon={<IconFileText className="size-3.5" />} label="Guide Details">
        <div className="space-y-2">
          {(["title", "subtitle", "product", "version"] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{field.replace(/([A-Z])/g, " $1")}</label>
              <input
                type="text"
                value={config[field]}
                onChange={(e) => updateConfig({ [field]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="sections" icon={<IconLayout className="size-3.5" />} label="Sections">
        <div className="space-y-3">
          {sections.map((sec, i) => (
            <div key={sec.id} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 space-y-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase">Section {i + 1}</label>
              <input
                type="text"
                value={sec.title}
                onChange={(e) => {
                  const updated = [...sections];
                  updated[i] = { ...sec, title: e.target.value };
                  setSections(updated);
                }}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <textarea
                value={sec.tip}
                onChange={(e) => {
                  const updated = [...sections];
                  updated[i] = { ...sec, tip: e.target.value };
                  setSections(updated);
                }}
                placeholder="Tip…"
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={2}
              />
              <textarea
                value={sec.warning}
                onChange={(e) => {
                  const updated = [...sections];
                  updated[i] = { ...sec, warning: e.target.value };
                  setSections(updated);
                }}
                placeholder="Warning…"
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={2}
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style & Colors">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-gray-500 uppercase">Primary Color</label>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => updateConfig({ primaryColor: c })}
                className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            type="color"
            value={config.primaryColor}
            onChange={(e) => updateConfig({ primaryColor: e.target.value })}
            className="w-full h-8 rounded-lg cursor-pointer"
          />
        </div>
      </AccordionSection>

      <AccordionSection id="export" icon={<IconDownload className="size-3.5" />} label="Export">
        <div className="space-y-1.5">
          {[
            { id: "web-standard", label: "Web (PNG 2×)", desc: "150 DPI" },
            { id: "print-standard", label: "Print (PDF 300 DPI)", desc: "With crop marks" },
            { id: "print-ultra", label: "Ultra Print (600 DPI)", desc: "Maximum quality" },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleExport(preset.id)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              <span>{preset.label}</span>
              <span className="text-[10px] text-gray-400">{preset.desc}</span>
            </button>
          ))}
        </div>
      </AccordionSection>
    </Accordion>
  );

  /* ── Toolbar ─────────────────────────────────────────────── */

  const toolbar = (
    <div className="flex items-center gap-1.5">
      {PAGES.map((p, i) => (
        <button
          key={p.id}
          onClick={() => updateConfig({ activePage: i })}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            config.activePage === i
              ? "bg-primary-500 text-gray-950"
              : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );

  /* ── Right Panel ─────────────────────────────────────────── */

  const rightPanel = (
    <div className="space-y-4">
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => updateConfig({ template: id as GuideTemplate })}
        thumbWidth={120}
        thumbHeight={170}
      />
    </div>
  );

  return (
    <StickyCanvasLayout
      canvasRef={canvasRef}
      displayWidth={displayW}
      displayHeight={displayH}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      toolbar={toolbar}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
      onZoomFit={() => setZoom(1)}
      label={`User Guide — A4 (${PAGE_W}×${PAGE_H}) — Page ${config.activePage + 1}/${PAGES.length}`}
    />
  );
}
