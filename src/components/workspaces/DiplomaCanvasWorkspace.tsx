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
  IconPlus,
  IconTrash,
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
import { useDiplomaCanvas } from "@/stores/diploma-canvas";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createDiplomaManifest } from "@/lib/chiko/manifests/diploma";

import {
  type DiplomaConfig,
  type DiplomaType,
  type DiplomaSize,
  type DiplomaStyle,
  type HonorsLevel,
  DIPLOMA_SIZES,
  DIPLOMA_COLOR_SCHEMES,
  DIPLOMA_TEMPLATE_PRESETS,
  HONORS_LEVELS,
  composeDiploma,
} from "@/lib/editor/diploma-composer";

/* ── Input class ────────────────────────────────────────── */
const inputCls =
  "w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all";
const selectCls = inputCls;
const labelCls = "text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block";

/* ── Component ─────────────────────────────────────────────── */

export default function DiplomaCanvasWorkspace() {
  const [loading, setLoading] = useState(false);
  const editorStore = useEditorStore();

  /* ── Diploma Config from Zustand Store ────────────── */
  const config = useDiplomaCanvas((s) => s.config);
  const activePresetId = useDiplomaCanvas((s) => s.activePresetId);
  const upd = useDiplomaCanvas((s) => s.updateConfig);

  /* ── Chiko Manifest Registration ────────────────────── */
  const exportPngRef = useRef<(() => void) | null>(null);
  const exportPdfRef = useRef<(() => void) | null>(null);
  const copyRef = useRef<(() => void) | null>(null);
  const manifestFactory = useCallback(
    () => createDiplomaManifest({ onExportPng: exportPngRef, onExportPdf: exportPdfRef, onCopy: copyRef }),
    [],
  );
  useChikoActions(manifestFactory);

  /* ── Compose on config change ────────────────────────── */
  useEffect(() => {
    const doc = composeDiploma({ config });
    editorStore.setDoc(doc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  /* ── Resolve current size ────────────────────────────── */
  const currentSize = useMemo(
    () => DIPLOMA_SIZES.find((s) => s.id === config.size) ?? DIPLOMA_SIZES[0],
    [config.size],
  );

  /* ── Template Previews for slider ────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () => DIPLOMA_TEMPLATE_PRESETS.map((preset) => ({
      id: preset.id,
      label: preset.label,
      render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const scheme = DIPLOMA_COLOR_SCHEMES.find((c) => c.id === preset.colorSchemeId) ?? DIPLOMA_COLOR_SCHEMES[0];
        ctx.fillStyle = scheme.bg;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = scheme.primary;
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, w - 8, h - 8);
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 8, w - 16, h - 16);
        ctx.fillStyle = scheme.primary;
        ctx.fillRect(w * 0.2, h * 0.12, w * 0.6, 2);
        ctx.fillStyle = scheme.text;
        ctx.font = `bold ${Math.round(h * 0.07)}px serif`;
        ctx.textAlign = "center";
        ctx.fillText("UNIVERSITY", w / 2, h * 0.25);
        ctx.font = `${Math.round(h * 0.06)}px serif`;
        ctx.fillText("DIPLOMA", w / 2, h * 0.38);
        ctx.fillStyle = scheme.accent;
        ctx.font = `italic ${Math.round(h * 0.07)}px serif`;
        ctx.fillText("Name", w / 2, h * 0.54);
        ctx.fillStyle = scheme.primary;
        ctx.fillRect(w * 0.3, h * 0.6, w * 0.4, 1);
        ctx.font = `${Math.round(h * 0.05)}px sans-serif`;
        ctx.fillStyle = scheme.text + "88";
        ctx.fillText("B.Sc. Field", w / 2, h * 0.72);
        if (preset.showSeal) {
          ctx.beginPath();
          ctx.arc(w / 2, h * 0.86, Math.min(w, h) * 0.06, 0, Math.PI * 2);
          ctx.fillStyle = scheme.accent + "33";
          ctx.fill();
          ctx.strokeStyle = scheme.accent;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      },
    })),
    [],
  );

  const [activePresetLocal, setActivePresetLocal] = useState(activePresetId);

  const handlePresetSelect = useCallback((presetId: string) => {
    const preset = DIPLOMA_TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetLocal(presetId);
    useDiplomaCanvas.getState().applyPreset(presetId);
  }, []);

  /* ── AI Generation ──────────────────────────────────────── */
  const [aiPrompt, setAiPrompt] = useState("");

  const generateAI = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are a professional diploma/accreditation document designer. Generate diploma text for a "${config.type}" diploma.

Programme description: "${aiPrompt}"
Institution based in Lusaka, Zambia.

Also recommend design settings.

Return ONLY valid JSON:
{
  "institutionName": "University Name",
  "institutionSubtitle": "School or Faculty",
  "institutionMotto": "Motto text",
  "recipientName": "Graduate Name",
  "degreeName": "Bachelor of Science",
  "fieldOfStudy": "Computer Science",
  "honors": "" | "cum-laude" | "magna-cum-laude" | "summa-cum-laude" | "distinction" | "high-distinction" | "first-class" | "merit",
  "conferralText": "The Board of Trustees...",
  "resolutionText": "By resolution of...",
  "style": "academic|modern|classic|ivy-league|executive|minimal",
  "colorSchemeId": "university-navy|ivy-crimson|academic-green|royal-purple|executive-black|medical-teal|classic-gold|vintage-sepia",
  "signatories": [{"name":"Prof. Name","title":"Vice-Chancellor","role":"chancellor"},{"name":"Dr. Name","title":"Registrar","role":"registrar"}]
}`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        const updates: Partial<DiplomaConfig> = {};
        if (data.institutionName) updates.institutionName = data.institutionName;
        if (data.institutionSubtitle) updates.institutionSubtitle = data.institutionSubtitle;
        if (data.institutionMotto) updates.institutionMotto = data.institutionMotto;
        if (data.recipientName) updates.recipientName = data.recipientName;
        if (data.degreeName) updates.degreeName = data.degreeName;
        if (data.fieldOfStudy) updates.fieldOfStudy = data.fieldOfStudy;
        if (data.conferralText) updates.conferralText = data.conferralText;
        if (data.resolutionText) updates.resolutionText = data.resolutionText;
        const validStyles: DiplomaStyle[] = ["academic", "modern", "classic", "ivy-league", "executive", "minimal"];
        if (data.style && validStyles.includes(data.style)) updates.style = data.style;
        if (data.colorSchemeId && DIPLOMA_COLOR_SCHEMES.some((s) => s.id === data.colorSchemeId)) {
          updates.colorSchemeId = data.colorSchemeId;
        }
        const validHonors: HonorsLevel[] = ["", "cum-laude", "magna-cum-laude", "summa-cum-laude", "distinction", "high-distinction", "first-class", "merit"];
        if (data.honors !== undefined && validHonors.includes(data.honors)) {
          updates.honors = data.honors;
        }
        if (Array.isArray(data.signatories) && data.signatories.length > 0) {
          updates.signatories = data.signatories.map((s: Record<string, string>) => ({
            name: s.name || "",
            title: s.title || "",
            role: s.role || "",
          }));
        }
        upd(updates);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [config.type, aiPrompt, upd]);

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
      a.download = `diploma-${config.type}-${Date.now()}.png`;
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
      fileName: `diploma-${config.type}`,
      author: "DMSuite",
    });
    downloadPdf(pdfBytes, `diploma-${config.type}-${Date.now()}.pdf`);
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

        {/* Institution */}
        <AccordionSection icon={<IconType className="size-3.5" />} label="Institution" id="institution">
          <div className="space-y-2">
            <input placeholder="Institution Name" value={config.institutionName} onChange={(e) => upd({ institutionName: e.target.value })}
              className={`${inputCls} h-10 text-sm`} />
            <input placeholder="Faculty / School / Department" value={config.institutionSubtitle} onChange={(e) => upd({ institutionSubtitle: e.target.value })}
              className={inputCls} />
            <input placeholder="Motto (e.g. Knowledge is Power)" value={config.institutionMotto} onChange={(e) => upd({ institutionMotto: e.target.value })}
              className={inputCls} />
          </div>
        </AccordionSection>

        {/* Recipient & Program */}
        <AccordionSection icon={<IconType className="size-3.5" />} label="Recipient & Program" id="recipient">
          <div className="space-y-2">
            <input placeholder="Recipient Name" value={config.recipientName} onChange={(e) => upd({ recipientName: e.target.value })}
              className={`${inputCls} h-10 text-sm font-semibold`} />
            <input placeholder="Student / Registration ID" value={config.recipientId} onChange={(e) => upd({ recipientId: e.target.value })}
              className={`${inputCls} font-mono`} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Diploma Type</label>
                <select value={config.type} onChange={(e) => useDiplomaCanvas.getState().setType(e.target.value as DiplomaType)}
                  className={selectCls}>
                  {(["bachelors", "masters", "doctorate", "professional-diploma", "honorary-doctorate", "vocational", "postgraduate", "accreditation"] as DiplomaType[]).map((t) => (
                    <option key={t} value={t}>{t.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Honors</label>
                <select value={config.honors} onChange={(e) => useDiplomaCanvas.getState().setHonors(e.target.value as HonorsLevel)}
                  className={selectCls}>
                  {HONORS_LEVELS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
                </select>
              </div>
            </div>
            <input placeholder="Degree / Program Name" value={config.degreeName} onChange={(e) => upd({ degreeName: e.target.value })}
              className={`${inputCls} font-semibold`} />
            <input placeholder="Field of Study" value={config.fieldOfStudy} onChange={(e) => upd({ fieldOfStudy: e.target.value })}
              className={inputCls} />
          </div>
        </AccordionSection>

        {/* Conferral */}
        <AccordionSection icon={<IconType className="size-3.5" />} label="Conferral Text" id="conferral">
          <div className="space-y-2">
            <textarea placeholder="Conferral text" value={config.conferralText} onChange={(e) => upd({ conferralText: e.target.value })} rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none" />
            <textarea placeholder="Resolution text" value={config.resolutionText} onChange={(e) => upd({ resolutionText: e.target.value })} rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none" />
            {config.type === "accreditation" && (
              <>
                <input placeholder="Accreditation Body" value={config.accreditationBody} onChange={(e) => upd({ accreditationBody: e.target.value })}
                  className={inputCls} />
                <input placeholder="Accreditation Number" value={config.accreditationNumber} onChange={(e) => upd({ accreditationNumber: e.target.value })}
                  className={`${inputCls} font-mono`} />
              </>
            )}
          </div>
        </AccordionSection>

        {/* Dates & Signatories */}
        <AccordionSection icon={<IconType className="size-3.5" />} label="Dates & Signatories" id="signatories">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Date Conferred</label>
                <input type="date" value={config.dateConferred} onChange={(e) => upd({ dateConferred: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Graduation Date</label>
                <input type="date" value={config.graduationDate} onChange={(e) => upd({ graduationDate: e.target.value })}
                  className={inputCls} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className={labelCls}>Signatories</span>
              <button onClick={() => useDiplomaCanvas.getState().addSignatory({ name: "", title: "", role: "" })}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[0.625rem] font-medium text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <IconPlus className="size-3" />Add
              </button>
            </div>
            {config.signatories.map((sig, i) => (
              <div key={i} className="flex gap-1.5 items-start">
                <div className="flex-1 space-y-1">
                  <input placeholder="Name" value={sig.name}
                    onChange={(e) => useDiplomaCanvas.getState().updateSignatory(i, { name: e.target.value })}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.6875rem] focus:outline-none focus:border-primary-500 transition-all" />
                  <div className="grid grid-cols-2 gap-1">
                    <input placeholder="Title" value={sig.title}
                      onChange={(e) => useDiplomaCanvas.getState().updateSignatory(i, { title: e.target.value })}
                      className="h-7 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500 transition-all" />
                    <input placeholder="Role" value={sig.role}
                      onChange={(e) => useDiplomaCanvas.getState().updateSignatory(i, { role: e.target.value })}
                      className="h-7 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500 transition-all" />
                  </div>
                </div>
                {config.signatories.length > 1 && (
                  <button onClick={() => useDiplomaCanvas.getState().removeSignatory(i)}
                    className="mt-1 p-1 rounded-lg text-gray-400 hover:text-error-400 hover:bg-error-500/10 transition-colors">
                    <IconTrash className="size-3" />
                  </button>
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className={labelCls}>Registration No.</label>
                <input placeholder="REG-2024-001" value={config.registrationNumber} onChange={(e) => upd({ registrationNumber: e.target.value })}
                  className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className={labelCls}>Serial</label>
                <div className="flex gap-1">
                  <input value={config.serialNumber} onChange={(e) => upd({ serialNumber: e.target.value })}
                    className={`flex-1 h-9 px-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:border-primary-500 transition-all`} />
                  <button onClick={() => useDiplomaCanvas.getState().regenerateSerial()} className="px-2 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-[0.625rem] font-medium text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">New</button>
                </div>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Style */}
        <AccordionSection icon={<IconDroplet className="size-3.5" />} label="Style" id="style">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Size</label>
                <select value={config.size} onChange={(e) => useDiplomaCanvas.getState().setSize(e.target.value as DiplomaSize)}
                  className={selectCls}>
                  {DIPLOMA_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Style</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["academic", "modern", "classic", "ivy-league", "executive", "minimal"] as DiplomaStyle[]).map((s) => (
                  <button key={s} onClick={() => useDiplomaCanvas.getState().setStyle(s)}
                    className={`px-2 py-1.5 rounded-xl border text-xs font-medium transition-all capitalize ${config.style === s ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <p className={labelCls}>Color Theme</p>
            <div className="grid grid-cols-4 gap-1.5">
              {DIPLOMA_COLOR_SCHEMES.map((scheme) => (
                <button key={scheme.id} onClick={() => useDiplomaCanvas.getState().setColorScheme(scheme.id)}
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
                <input type="checkbox" checked={config.showBorder} onChange={(e) => upd({ showBorder: e.target.checked })} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
                Border
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={config.showMotto} onChange={(e) => upd({ showMotto: e.target.checked })} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
                Motto
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
          <IconSparkles className="size-3.5" />AI Diploma Director
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3 py-2 text-xs text-gray-900 dark:text-white resize-none placeholder:text-gray-400 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20"
          rows={3} placeholder="Describe the programme (e.g., 'Bachelor of Science in Computer Science, University of Zambia, 4-year degree')..."
          value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
        />
        <button onClick={generateAI} disabled={loading || !aiPrompt.trim()}
          className="w-full mt-2 flex items-center justify-center gap-2 h-10 rounded-xl bg-secondary-500 text-white text-xs font-bold hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Diploma</>}
        </button>
        <p className="text-[0.5625rem] text-gray-400 text-center mt-1.5">AI suggests text, style, colors & signatories</p>
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
      label={`Diploma — ${currentSize.width}×${currentSize.height}px · ${currentSize.label}`}
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
