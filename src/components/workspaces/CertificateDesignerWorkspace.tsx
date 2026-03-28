"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
  IconDroplet,
  IconType,
  IconLayout,
  IconPrinter,
} from "@/components/icons";
import { Accordion, AccordionSection } from "@/components/ui";
import { cleanAIText } from "@/lib/canvas-utils";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { CanvasEditor, EditorToolbar, LayersListPanel, LayerPropertiesPanel } from "@/components/editor";
import { useEditorStore } from "@/stores/editor";
import { renderToCanvas } from "@/lib/editor/renderer";
import { renderDocumentToPdf, downloadPdf } from "@/lib/editor/pdf-renderer";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useCertificateCanvas } from "@/stores/certificate-canvas";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createCertificateManifest } from "@/lib/chiko/manifests/certificate";

import {
  type CertificateConfig,
  type CertificateType,
  type CertificateSize,
  type CertStyle,
  CERT_SIZES,
  CERT_COLOR_SCHEMES,
  CERT_TEMPLATE_PRESETS,
  composeCertificate,
} from "@/lib/editor/certificate-composer";

/* ── Component ─────────────────────────────────────────────── */

export default function CertificateDesignerWorkspace() {
  const [loading, setLoading] = useState(false);
  const editorStore = useEditorStore();

  /* ── Certificate Config from Zustand Store ──────────── */
  const config = useCertificateCanvas((s) => s.config);
  const activePresetId = useCertificateCanvas((s) => s.activePresetId);
  const upd = useCertificateCanvas((s) => s.updateConfig);

  /* ── Chiko Manifest Registration ────────────────────── */
  const exportPngRef = useRef<(() => void) | null>(null);
  const exportPdfRef = useRef<(() => void) | null>(null);
  const copyRef = useRef<(() => void) | null>(null);
  const manifestFactory = useCallback(
    () => createCertificateManifest({ onExportPng: exportPngRef, onExportPdf: exportPdfRef, onCopy: copyRef }),
    [],
  );
  useChikoActions(manifestFactory);

  /* ── Compose on config change ────────────────────────── */
  useEffect(() => {
    const doc = composeCertificate({ config });
    editorStore.setDoc(doc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  /* ── Resolve current size ────────────────────────────── */
  const currentSize = useMemo(
    () => CERT_SIZES.find((s) => s.id === config.size) ?? CERT_SIZES[0],
    [config.size]
  );

  /* ── Template Previews for slider ────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () => CERT_TEMPLATE_PRESETS.map((preset) => ({
      id: preset.id,
      label: preset.label,
      render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const scheme = CERT_COLOR_SCHEMES.find((c) => c.id === preset.colorSchemeId) ?? CERT_COLOR_SCHEMES[0];
        ctx.fillStyle = scheme.bg;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = scheme.primary;
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, w - 8, h - 8);
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 8, w - 16, h - 16);
        ctx.fillStyle = scheme.primary;
        ctx.fillRect(w * 0.2, h * 0.15, w * 0.6, 3);
        ctx.fillStyle = scheme.text;
        ctx.font = `bold ${Math.round(h * 0.09)}px serif`;
        ctx.textAlign = "center";
        ctx.fillText("CERTIFICATE", w / 2, h * 0.32);
        ctx.fillStyle = scheme.accent;
        ctx.font = `italic ${Math.round(h * 0.08)}px serif`;
        ctx.fillText("Name", w / 2, h * 0.52);
        ctx.fillStyle = scheme.primary;
        ctx.fillRect(w * 0.3, h * 0.6, w * 0.4, 1);
        if (preset.showSeal) {
          ctx.beginPath();
          ctx.arc(w / 2, h * 0.78, Math.min(w, h) * 0.08, 0, Math.PI * 2);
          ctx.fillStyle = scheme.accent + "33";
          ctx.fill();
          ctx.strokeStyle = scheme.accent;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      },
    })),
    []
  );

  const [activePresetLocal, setActivePresetLocal] = useState(activePresetId);

  const handlePresetSelect = useCallback((presetId: string) => {
    const preset = CERT_TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetLocal(presetId);
    useCertificateCanvas.getState().applyPreset(presetId);
  }, []);

  /* ── AI Generation ──────────────────────────────────────── */
  const [eventPrompt, setEventPrompt] = useState("");

  const generateAI = useCallback(async () => {
    if (!eventPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are a professional certificate designer. Generate certificate text for a "${config.type}" certificate.

Event/Course: "${eventPrompt}"
Organization based in Lusaka, Zambia.

Also recommend design settings.

Return ONLY valid JSON:
{
  "title": "Certificate of ...",
  "subtitle": "This is proudly presented to",
  "recipientName": "Participant Name",
  "description": "For successfully completing... (2 sentences max)",
  "issuerName": "Director Name",
  "issuerTitle": "Position, Organization",
  "organizationName": "Organization — Lusaka, Zambia",
  "style": "classic|modern|elegant|bold|vintage|minimal",
  "colorSchemeId": "gold-classic|navy-formal|emerald-honor|royal-purple|crimson-prestige|silver-modern|bronze-vintage|midnight-luxury",
  "primaryColor": "#hex",
  "accentColor": "#hex"
}`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        const updates: Partial<CertificateConfig> = {};
        if (data.title) updates.title = data.title;
        if (data.subtitle) updates.subtitle = data.subtitle;
        if (data.recipientName) updates.recipientName = data.recipientName;
        if (data.description) updates.description = data.description;
        if (data.issuerName) updates.issuerName = data.issuerName;
        if (data.issuerTitle) updates.issuerTitle = data.issuerTitle;
        if (data.organizationName) updates.organizationName = data.organizationName;
        const validStyles: CertStyle[] = ["classic", "modern", "elegant", "bold", "vintage", "minimal"];
        if (data.style && validStyles.includes(data.style)) updates.style = data.style;
        if (data.colorSchemeId && CERT_COLOR_SCHEMES.some((s) => s.id === data.colorSchemeId)) {
          updates.colorSchemeId = data.colorSchemeId;
        }
        upd(updates);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [config.type, eventPrompt, upd]);

  /* ── Export Handlers ────────────────────────────────────── */
  const exportPNG = useCallback(() => {
    const doc = editorStore.doc;
    if (!doc) return;
    const canvas = renderToCanvas(doc, 2);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${config.type}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [editorStore.doc, config.type]);

  const handleCopy = useCallback(async () => {
    const doc = editorStore.doc;
    if (!doc) return;
    try {
      const canvas = renderToCanvas(doc, 2);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch { /* ignore */ }
  }, [editorStore.doc]);

  const handleExportPdf = useCallback(async () => {
    const doc = editorStore.doc;
    if (!doc) return;
    const pdfBytes = await renderDocumentToPdf(doc, {
      fileName: `certificate-${config.type}`,
      author: "DMSuite",
    });
    downloadPdf(pdfBytes, `certificate-${config.type}-${Date.now()}.pdf`);
  }, [editorStore.doc, config.type]);

  /* Wire export refs for Chiko manifest */
  exportPngRef.current = exportPNG;
  exportPdfRef.current = handleExportPdf;
  copyRef.current = handleCopy;

  /* ── Left Panel ─────────────────────────────────────────── */
  const leftPanel = (
    <div className="space-y-3">
      <Accordion defaultOpen="templates">
        {/* Template Slider */}
        <AccordionSection icon={<IconLayout className="size-3.5" />} label="Templates" id="templates">
          <TemplateSlider
            templates={templatePreviews}
            activeId={activePresetLocal}
            onSelect={handlePresetSelect}
            thumbWidth={140}
            thumbHeight={100}
            label=""
          />
        </AccordionSection>

        {/* Content */}
        <AccordionSection icon={<IconType className="size-3.5" />} label="Content" id="content">
          <div className="space-y-2">
            <input placeholder="Certificate Title" value={config.title} onChange={(e) => upd({ title: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <input placeholder="Subtitle" value={config.subtitle} onChange={(e) => upd({ subtitle: e.target.value })}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <input placeholder="Recipient Name" value={config.recipientName} onChange={(e) => upd({ recipientName: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all font-semibold" />
            <textarea placeholder="Description" value={config.description} onChange={(e) => upd({ description: e.target.value })} rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none" />
            <input placeholder="Date" value={config.date} onChange={(e) => upd({ date: e.target.value })}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Issuer Name" value={config.issuerName} onChange={(e) => upd({ issuerName: e.target.value })}
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
              <input placeholder="Issuer Title" value={config.issuerTitle} onChange={(e) => upd({ issuerTitle: e.target.value })}
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            </div>
            <input placeholder="Organization" value={config.organizationName} onChange={(e) => upd({ organizationName: e.target.value })}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <div className="flex gap-2 items-center">
              <input className="flex-1 h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs font-mono" placeholder="Serial" value={config.serialNumber} onChange={(e) => upd({ serialNumber: e.target.value })} />
              <button onClick={() => useCertificateCanvas.getState().regenerateSerial()} className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-[0.625rem] font-medium text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">New</button>
            </div>
          </div>
        </AccordionSection>

        {/* Style */}
        <AccordionSection icon={<IconDroplet className="size-3.5" />} label="Style" id="style">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Type</label>
                <select value={config.type} onChange={(e) => upd({ type: e.target.value as CertificateType })}
                  className="w-full h-9 px-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs">
                  {(["achievement", "completion", "award", "recognition", "participation", "training", "diploma", "accreditation"] as CertificateType[]).map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Size</label>
                <select value={config.size} onChange={(e) => upd({ size: e.target.value as CertificateSize })}
                  className="w-full h-9 px-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs">
                  {CERT_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Style</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["classic", "modern", "elegant", "bold", "vintage", "minimal"] as CertStyle[]).map((s) => (
                  <button key={s} onClick={() => upd({ style: s })}
                    className={`px-2 py-1.5 rounded-xl border text-xs font-medium transition-all capitalize ${config.style === s ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400">Color Theme</p>
            <div className="grid grid-cols-4 gap-1.5">
              {CERT_COLOR_SCHEMES.map((scheme) => (
                <button key={scheme.id} onClick={() => upd({ colorSchemeId: scheme.id })}
                  className={`p-1.5 rounded-lg border text-center transition-all ${config.colorSchemeId === scheme.id ? "border-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                  <div className="flex gap-0.5 justify-center mb-0.5">
                    <div className="size-3 rounded-full" style={{ backgroundColor: scheme.primary }} />
                    <div className="size-3 rounded-full" style={{ backgroundColor: scheme.accent }} />
                    <div className="size-3 rounded-full" style={{ backgroundColor: scheme.bg }} />
                  </div>
                  <span className="text-[0.5rem] text-gray-400 leading-none">{scheme.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={config.showSeal} onChange={(e) => upd({ showSeal: e.target.checked })} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
                Seal
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={config.showCorners} onChange={(e) => upd({ showCorners: e.target.checked })} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
                Corners
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={config.showRibbon} onChange={(e) => upd({ showRibbon: e.target.checked })} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
                Ribbon
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={config.showDivider} onChange={(e) => upd({ showDivider: e.target.checked })} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
                Divider
              </label>
            </div>
          </div>
        </AccordionSection>

        {/* Advanced Settings — Global */}
        <AdvancedSettingsPanel />
      </Accordion>

      {/* AI */}
      <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-2.5">
          <IconSparkles className="size-3.5" />AI Certificate Director
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3 py-2 text-xs text-gray-900 dark:text-white resize-none placeholder:text-gray-400 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20"
          rows={3} placeholder="Describe the event or course (e.g., 'Advanced Data Science Bootcamp, 3-month programme')..."
          value={eventPrompt} onChange={(e) => setEventPrompt(e.target.value)}
        />
        <button onClick={generateAI} disabled={loading || !eventPrompt.trim()}
          className="w-full mt-2 flex items-center justify-center gap-2 h-10 rounded-xl bg-secondary-500 text-white text-xs font-bold hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Certificate</>}
        </button>
        <p className="text-[0.5625rem] text-gray-400 text-center mt-1.5">AI suggests text, style, colors & layout</p>
      </div>
    </div>
  );

  /* ── Right Panel ────────────────────────────────────────── */
  const rightPanel = (
    <div className="space-y-3">
      <LayersListPanel />
      <LayerPropertiesPanel />
    </div>
  );

  /* ── Toolbar ────────────────────────────────────────────── */
  const toolbar = (
    <div className="flex items-center gap-2">
      <EditorToolbar />
      <span className="ml-auto text-xs font-semibold text-gray-400">{currentSize.label}</span>
      <span className="text-gray-600">·</span>
      <span className="text-xs text-gray-500">{currentSize.width}×{currentSize.height}</span>
    </div>
  );

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <StickyCanvasLayout
      canvasSlot={<CanvasEditor />}
      label={`Certificate — ${currentSize.width}×${currentSize.height}px · ${currentSize.label}`}
      mobileTabs={["Canvas", "Settings", "Layers"]}
      toolbar={toolbar}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      actionsBar={
        <div className="flex items-center gap-2">
          <button
            onClick={exportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors"
          >
            <IconDownload className="size-3" />
            PNG
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <IconPrinter className="size-3" />
            PDF
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <IconCopy className="size-3" />
            Copy
          </button>
        </div>
      }
    />
  );
}
