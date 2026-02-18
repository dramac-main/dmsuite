"use client";

import { useCallback } from "react";
import {
  IconSettings,
  IconType,
  IconDroplet,
  IconLayout,
  IconMaximize,
  IconImage,
  IconPrinter,
  IconRefresh,
} from "@/components/icons";
import {
  useAdvancedSettingsStore,
  type AdvancedDesignSettings,
} from "@/stores/advanced-settings";
import { Accordion, AccordionSection } from "@/components/ui";

// =============================================================================
// DMSuite — Global Advanced Settings Panel
// Drop-in shared component for ALL canvas/document/print workspaces.
// Reads and writes to the global Zustand advanced-settings store.
// Every slider is fully wired — changes persist across tools and sessions.
//
// Usage in any workspace:
//   import AdvancedSettingsPanel from "@/components/workspaces/AdvancedSettingsPanel";
//   // Inside leftPanel JSX:
//   <AdvancedSettingsPanel />
// =============================================================================

/* ── Slider helper ───────────────────────────────────────── */

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  decimals?: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, step, unit = "", decimals = 0, onChange }: SliderRowProps) {
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[0.5625rem] text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-[0.5625rem] font-mono text-primary-500">
          {display}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-primary-500 cursor-pointer"
      />
    </div>
  );
}

/* ── Toggle helper ───────────────────────────────────────── */

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox" checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30"
      />
      <span className="text-[0.5625rem] text-gray-500 dark:text-gray-400">{label}</span>
    </label>
  );
}

/* ── Select helper ───────────────────────────────────────── */

interface SelectRowProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

function SelectRow({ label, value, options, onChange }: SelectRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.5625rem] text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-7 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.5625rem] focus:outline-none focus:border-primary-500 transition-all"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Section Header (mini) ───────────────────────────────── */

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <span className="text-primary-500">{icon}</span>
      <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
    </div>
  );
}

/* ── Reset button per section ────────────────────────────── */

function SectionReset({ section }: { section: keyof AdvancedDesignSettings }) {
  const resetSection = useAdvancedSettingsStore((s) => s.resetSection);
  return (
    <button
      onClick={() => resetSection(section)}
      className="text-[0.5rem] text-gray-500 hover:text-primary-500 transition-colors uppercase tracking-wider font-semibold"
    >
      Reset
    </button>
  );
}

/* ── Main Panel Component ────────────────────────────────── */

interface AdvancedSettingsPanelProps {
  /** Optional: only show certain sections */
  sections?: (keyof AdvancedDesignSettings)[];
  /** Whether to wrap in its own Accordion or assume parent Accordion */
  standalone?: boolean;
  className?: string;
}

export default function AdvancedSettingsPanel({
  sections,
  standalone = true,
  className = "",
}: AdvancedSettingsPanelProps) {
  const { settings, update, resetAll, hasCustomSettings } = useAdvancedSettingsStore();
  const { typography: t, colorEffects: ce, spacing: sp, iconGraphic: ig, borderDivider: bd, exportQuality: eq } = settings;

  const ut = useCallback((p: Record<string, unknown>) => update("typography", p), [update]);
  const uc = useCallback((p: Record<string, unknown>) => update("colorEffects", p), [update]);
  const us = useCallback((p: Record<string, unknown>) => update("spacing", p), [update]);
  const ui = useCallback((p: Record<string, unknown>) => update("iconGraphic", p), [update]);
  const ub = useCallback((p: Record<string, unknown>) => update("borderDivider", p), [update]);
  const ue = useCallback((p: Record<string, unknown>) => update("exportQuality", p), [update]);

  const show = (key: keyof AdvancedDesignSettings) => !sections || sections.includes(key);

  const content = (
    <div className={`space-y-1 ${className}`}>

      {/* ── Typography ─────────────────────────────────────── */}
      {show("typography") && (
        <AccordionSection
          icon={<IconType className="size-3.5" />}
          label="Typography"
          id="adv-typo"
          badge={<SectionReset section="typography" />}
        >
          <div className="space-y-3">
            <SliderRow label="Heading / Name Size" value={t.headingScale * 100} min={50} max={200} step={5} unit="%" onChange={(v) => ut({ headingScale: v / 100 })} />
            <SliderRow label="Body / Contact Size" value={t.bodyScale * 100} min={50} max={180} step={5} unit="%" onChange={(v) => ut({ bodyScale: v / 100 })} />
            <SliderRow label="Label / Caption Size" value={t.labelScale * 100} min={50} max={160} step={5} unit="%" onChange={(v) => ut({ labelScale: v / 100 })} />
            <SliderRow label="Letter Spacing" value={t.letterSpacingOffset} min={-2} max={6} step={0.5} unit="px" decimals={1} onChange={(v) => ut({ letterSpacingOffset: v })} />
            <SliderRow label="Line Height" value={t.lineHeightMultiplier * 100} min={80} max={250} step={5} unit="%" onChange={(v) => ut({ lineHeightMultiplier: v / 100 })} />
            <SliderRow label="Paragraph Spacing" value={t.paragraphSpacing * 100} min={50} max={300} step={10} unit="%" onChange={(v) => ut({ paragraphSpacing: v / 100 })} />
            <SliderRow label="Word Spacing" value={t.wordSpacing} min={-2} max={8} step={0.5} unit="px" decimals={1} onChange={(v) => ut({ wordSpacing: v })} />
            <SelectRow label="Rendering" value={t.textRendering} options={[
              { value: "auto", label: "Auto" },
              { value: "sharp", label: "Sharp (Pixel)" },
              { value: "smooth", label: "Smooth (AA)" },
            ]} onChange={(v) => ut({ textRendering: v })} />
          </div>
        </AccordionSection>
      )}

      {/* ── Colors & Effects ───────────────────────────────── */}
      {show("colorEffects") && (
        <AccordionSection
          icon={<IconDroplet className="size-3.5" />}
          label="Colors & Effects"
          id="adv-colors"
          badge={<SectionReset section="colorEffects" />}
        >
          <div className="space-y-3">
            <SliderRow label="Pattern Overlay" value={ce.patternOpacity * 100} min={10} max={200} step={5} unit="%" onChange={(v) => uc({ patternOpacity: v / 100 })} />
            <SliderRow label="Decorative Opacity" value={ce.decorativeOpacity * 100} min={10} max={100} step={5} unit="%" onChange={(v) => uc({ decorativeOpacity: v / 100 })} />
            <SliderRow label="Divider Opacity" value={ce.dividerOpacity * 100} min={10} max={100} step={5} unit="%" onChange={(v) => uc({ dividerOpacity: v / 100 })} />
            <SliderRow label="Text Shadow" value={ce.textShadowIntensity * 100} min={0} max={100} step={5} unit="%" onChange={(v) => uc({ textShadowIntensity: v / 100 })} />
            <SliderRow label="Border Opacity" value={ce.borderOpacity * 100} min={10} max={100} step={5} unit="%" onChange={(v) => uc({ borderOpacity: v / 100 })} />
            <SliderRow label="Gradient Intensity" value={ce.gradientIntensity * 100} min={50} max={150} step={5} unit="%" onChange={(v) => uc({ gradientIntensity: v / 100 })} />
            <SliderRow label="BG Overlay" value={ce.bgOverlayIntensity * 100} min={0} max={100} step={5} unit="%" onChange={(v) => uc({ bgOverlayIntensity: v / 100 })} />
            <SliderRow label="Accent Brightness" value={ce.accentBrightness * 100} min={-30} max={30} step={5} unit="%" onChange={(v) => uc({ accentBrightness: v / 100 })} />
          </div>
        </AccordionSection>
      )}

      {/* ── Spacing & Layout ───────────────────────────────── */}
      {show("spacing") && (
        <AccordionSection
          icon={<IconLayout className="size-3.5" />}
          label="Spacing & Layout"
          id="adv-spacing"
          badge={<SectionReset section="spacing" />}
        >
          <div className="space-y-3">
            <SliderRow label="Horizontal Margins" value={sp.marginHorizontal * 100} min={30} max={200} step={5} unit="%" onChange={(v) => us({ marginHorizontal: v / 100 })} />
            <SliderRow label="Vertical Margins" value={sp.marginVertical * 100} min={30} max={200} step={5} unit="%" onChange={(v) => us({ marginVertical: v / 100 })} />
            <SliderRow label="Inner Padding" value={sp.paddingMultiplier * 100} min={30} max={200} step={5} unit="%" onChange={(v) => us({ paddingMultiplier: v / 100 })} />
            <SliderRow label="Section Gap" value={sp.sectionGap * 100} min={50} max={300} step={10} unit="%" onChange={(v) => us({ sectionGap: v / 100 })} />
            <SliderRow label="Element Gap" value={sp.elementGap * 100} min={50} max={250} step={5} unit="%" onChange={(v) => us({ elementGap: v / 100 })} />
            <SliderRow label="Content X Offset" value={sp.contentOffsetX} min={-50} max={50} step={1} unit="px" onChange={(v) => us({ contentOffsetX: v })} />
            <SliderRow label="Content Y Offset" value={sp.contentOffsetY} min={-50} max={50} step={1} unit="px" onChange={(v) => us({ contentOffsetY: v })} />
          </div>
        </AccordionSection>
      )}

      {/* ── Icons & Graphics ───────────────────────────────── */}
      {show("iconGraphic") && (
        <AccordionSection
          icon={<IconImage className="size-3.5" />}
          label="Icons & Graphics"
          id="adv-icons"
          badge={<SectionReset section="iconGraphic" />}
        >
          <div className="space-y-3">
            <SliderRow label="Icon Size" value={ig.iconSizeScale * 100} min={40} max={200} step={5} unit="%" onChange={(v) => ui({ iconSizeScale: v / 100 })} />
            <SliderRow label="Icon Stroke Weight" value={ig.iconStrokeScale * 100} min={50} max={200} step={5} unit="%" onChange={(v) => ui({ iconStrokeScale: v / 100 })} />
            <SliderRow label="Icon-to-Text Gap" value={ig.iconGapScale * 100} min={30} max={300} step={10} unit="%" onChange={(v) => ui({ iconGapScale: v / 100 })} />
            <SliderRow label="Logo Size" value={ig.logoScale * 100} min={30} max={200} step={5} unit="%" onChange={(v) => ui({ logoScale: v / 100 })} />
            <SliderRow label="QR Code Size" value={ig.qrScale * 100} min={50} max={200} step={5} unit="%" onChange={(v) => ui({ qrScale: v / 100 })} />
            <SliderRow label="Seal / Stamp Size" value={ig.sealScale * 100} min={50} max={200} step={5} unit="%" onChange={(v) => ui({ sealScale: v / 100 })} />
            <SliderRow label="Decorative Shapes" value={ig.shapeScale * 100} min={30} max={200} step={5} unit="%" onChange={(v) => ui({ shapeScale: v / 100 })} />
          </div>
        </AccordionSection>
      )}

      {/* ── Borders & Dividers ─────────────────────────────── */}
      {show("borderDivider") && (
        <AccordionSection
          icon={<IconMaximize className="size-3.5" />}
          label="Borders & Dividers"
          id="adv-borders"
          badge={<SectionReset section="borderDivider" />}
        >
          <div className="space-y-3">
            <SliderRow label="Border Width" value={bd.borderWidthScale * 100} min={0} max={300} step={10} unit="%" onChange={(v) => ub({ borderWidthScale: v / 100 })} />
            <SliderRow label="Border Radius" value={bd.borderRadiusScale * 100} min={0} max={300} step={10} unit="%" onChange={(v) => ub({ borderRadiusScale: v / 100 })} />
            <SliderRow label="Divider Thickness" value={bd.dividerThicknessScale * 100} min={30} max={300} step={10} unit="%" onChange={(v) => ub({ dividerThicknessScale: v / 100 })} />
            <SliderRow label="Divider Length" value={bd.dividerLengthScale * 100} min={30} max={200} step={5} unit="%" onChange={(v) => ub({ dividerLengthScale: v / 100 })} />
            <SliderRow label="Corner Ornaments" value={bd.cornerOrnamentScale * 100} min={0} max={200} step={10} unit="%" onChange={(v) => ub({ cornerOrnamentScale: v / 100 })} />
          </div>
        </AccordionSection>
      )}

      {/* ── Export & Quality ───────────────────────────────── */}
      {show("exportQuality") && (
        <AccordionSection
          icon={<IconPrinter className="size-3.5" />}
          label="Export & Quality"
          id="adv-export"
          badge={<SectionReset section="exportQuality" />}
        >
          <div className="space-y-3">
            <SelectRow label="Export DPI" value={String(eq.exportScale)} options={[
              { value: "1", label: "300 DPI (Standard)" },
              { value: "2", label: "600 DPI (High)" },
              { value: "3", label: "900 DPI (Ultra)" },
            ]} onChange={(v) => ue({ exportScale: Number(v) })} />
            <SliderRow label="JPEG Quality" value={eq.jpegQuality * 100} min={70} max={100} step={1} unit="%" onChange={(v) => ue({ jpegQuality: v / 100 })} />
            <SliderRow label="PDF Margin" value={eq.pdfMarginMm} min={0} max={20} step={1} unit="mm" onChange={(v) => ue({ pdfMarginMm: v })} />
            <ToggleRow label="Include bleed area in exports" checked={eq.includeBleed} onChange={(v) => ue({ includeBleed: v })} />
            <ToggleRow label="Include crop marks in PDF" checked={eq.includeCropMarks} onChange={(v) => ue({ includeCropMarks: v })} />
          </div>
        </AccordionSection>
      )}

      {/* ── Master Reset ─────────────────────────────────── */}
      <div className="pt-1 space-y-2">
        <button
          onClick={resetAll}
          disabled={!hasCustomSettings()}
          className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 text-[0.625rem] font-semibold uppercase tracking-wider hover:text-gray-200 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <IconRefresh className="size-3" />
          Reset All to Defaults
        </button>
        {hasCustomSettings() && (
          <p className="text-[0.5rem] text-primary-500/60 text-center">
            ⚡ Custom settings active — applies to all document tools
          </p>
        )}
      </div>
    </div>
  );

  if (standalone) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <IconSettings className="size-3.5 text-primary-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Advanced Settings
          </h3>
          <span className="ml-auto text-[0.5rem] text-gray-500 dark:text-gray-500 uppercase tracking-wider">
            Global
          </span>
        </div>
        <Accordion>
          {content}
        </Accordion>
      </div>
    );
  }

  return content;
}
