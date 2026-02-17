"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IconSparkles, IconWand, IconLoader, IconDownload, IconDroplet, IconFileText, IconType, IconBriefcase } from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, drawHeaderArea, generateColorPalette, exportHighRes, EXPORT_PRESETS, drawBadge } from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { Accordion, AccordionSection } from "@/components/ui";

/* ── Types ─────────────────────────────────────────────────── */

type JDTemplate = "corporate" | "modern" | "minimal" | "startup" | "creative" | "executive";

interface JDConfig {
  template: JDTemplate;
  primaryColor: string;
  companyName: string;
  companyTagline: string;
  jobTitle: string;
  department: string;
  location: string;
  employmentType: string;
  reportingTo: string;
  salary: string;
  aboutCompany: string;
  jobSummary: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  applicationDeadline: string;
  contactEmail: string;
  description: string;
}

const TEMPLATES: { id: JDTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" }, { id: "modern", name: "Modern" },
  { id: "minimal", name: "Minimal" }, { id: "startup", name: "Startup" },
  { id: "creative", name: "Creative" }, { id: "executive", name: "Executive" },
];

const COLOR_PRESETS = ["#1e3a5f", "#2d3436", "#0f4c75", "#3c1361", "#0d7377", "#6c5ce7", "#e74c3c", "#8ae600", "#06b6d4"];

/* ── Component ───────────────────────────────────────────── */

export default function JobDescriptionWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [config, setConfig] = useState<JDConfig>({
    template: "modern", primaryColor: "#1e3a5f",
    companyName: "Zambia National Bank", companyTagline: "Building Zambia's Financial Future",
    jobTitle: "Senior Software Developer", department: "Information Technology",
    location: "Lusaka, Zambia", employmentType: "Full-Time",
    reportingTo: "Head of IT", salary: "ZMW 35,000 – 50,000 per month",
    aboutCompany: "Zambia National Bank is a leading financial institution serving over 2 million customers across all 10 provinces. We are committed to digital innovation and financial inclusion.",
    jobSummary: "We are seeking an experienced Software Developer to lead our digital banking transformation. The ideal candidate will design and implement scalable solutions that serve millions of customers.",
    responsibilities: [
      "Lead development of core banking applications using modern technologies",
      "Design and implement RESTful APIs and microservices architecture",
      "Mentor junior developers and conduct code reviews",
      "Collaborate with product managers to translate business requirements into technical solutions",
      "Ensure application security, performance, and scalability",
      "Participate in agile ceremonies and contribute to continuous improvement",
    ],
    requirements: [
      "BSc in Computer Science or related field",
      "5+ years of professional software development experience",
      "Proficiency in TypeScript, Python, or Java",
      "Experience with cloud platforms (AWS, Azure, or GCP)",
      "Strong understanding of database design and SQL",
      "Excellent communication and teamwork skills",
    ],
    benefits: [
      "Competitive salary with performance bonuses",
      "Medical aid for employee and family",
      "Pension contribution (employer matches 10%)",
      "24 days annual leave",
      "Professional development allowance",
      "Flexible working arrangements",
    ],
    applicationDeadline: "31 January 2026",
    contactEmail: "careers@znb.co.zm",
    description: "",
  });

  const updateConfig = useCallback((p: Partial<JDConfig>) => setConfig((prev) => ({ ...prev, ...p })), []);

  const PAGE_W = 595, PAGE_H = 842;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = PAGE_W * 2; canvas.height = PAGE_H * 2;
    ctx.scale(2, 2); ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const { primaryColor, template } = config;
    const pal = generateColorPalette(primaryColor);
    const m = 40;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Header
    const hdrH = template === "executive" ? 100 : template === "startup" ? 80 : 70;
    if (template === "creative") {
      // Diagonal header
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(PAGE_W, 0); ctx.lineTo(PAGE_W, hdrH - 20); ctx.lineTo(0, hdrH + 10);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, PAGE_W, hdrH);
    }

    // Company name
    ctx.fillStyle = "#ffffff";
    ctx.font = getCanvasFont(700, template === "executive" ? 20 : 16, "modern");
    ctx.textAlign = "left";
    ctx.fillText(config.companyName, m, hdrH * 0.4);

    ctx.fillStyle = hexToRgba("#ffffff", 0.7);
    ctx.font = getCanvasFont(400, 8, "modern");
    ctx.fillText(config.companyTagline, m, hdrH * 0.4 + 18);

    // Job title (large, right side or centered)
    ctx.fillStyle = "#ffffff";
    ctx.font = getCanvasFont(800, 14, "modern");
    ctx.textAlign = "right";
    ctx.fillText(config.jobTitle, PAGE_W - m, hdrH * 0.4);

    // Employment type badge
    ctx.fillStyle = hexToRgba("#ffffff", 0.2);
    const badgeW = ctx.measureText(config.employmentType).width + 16;
    roundRect(ctx, PAGE_W - m - badgeW, hdrH * 0.4 + 6, badgeW, 18, 9);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = getCanvasFont(600, 8, "modern");
    ctx.textAlign = "center";
    ctx.fillText(config.employmentType, PAGE_W - m - badgeW / 2, hdrH * 0.4 + 18);

    // Info strip
    let y = hdrH + 15;
    ctx.fillStyle = hexToRgba(primaryColor, 0.06);
    roundRect(ctx, m, y, PAGE_W - 2 * m, 36, 4);
    ctx.fill();

    ctx.textAlign = "left";
    const infoItems = [
      { label: "Department", value: config.department },
      { label: "Location", value: config.location },
      { label: "Reports To", value: config.reportingTo },
    ];
    const infoW = (PAGE_W - 2 * m) / 3;
    infoItems.forEach((item, i) => {
      const ix = m + i * infoW + 12;
      ctx.fillStyle = hexToRgba(primaryColor, 0.5);
      ctx.font = getCanvasFont(600, 7, "modern");
      ctx.fillText(item.label.toUpperCase(), ix, y + 14);
      ctx.fillStyle = "#1a1a2e";
      ctx.font = getCanvasFont(500, 9, "modern");
      ctx.fillText(item.value, ix, y + 27);
    });

    y += 50;

    // Salary
    ctx.fillStyle = primaryColor;
    ctx.font = getCanvasFont(700, 11, "modern");
    ctx.textAlign = "left";
    ctx.fillText("Salary: " + config.salary, m, y);
    y += 20;

    // About / Job Summary
    ctx.fillStyle = primaryColor;
    ctx.font = getCanvasFont(700, 11, "modern");
    ctx.fillText("About the Role", m, y);
    drawProDivider(ctx, m, y + 4, 60, primaryColor, "gradient", 1.5);
    y += 16;

    ctx.fillStyle = "#444";
    ctx.font = getCanvasFont(400, 9, "modern");
    const summaryLines = wrapCanvasText(ctx, config.jobSummary, PAGE_W - 2 * m);
    summaryLines.slice(0, 4).forEach((l, i) => { ctx.fillText(l, m, y + i * 13); });
    y += Math.min(summaryLines.length, 4) * 13 + 15;

    // Responsibilities
    ctx.fillStyle = primaryColor;
    ctx.font = getCanvasFont(700, 11, "modern");
    ctx.fillText("Key Responsibilities", m, y);
    drawProDivider(ctx, m, y + 4, 80, primaryColor, "gradient", 1.5);
    y += 16;

    ctx.fillStyle = "#333";
    ctx.font = getCanvasFont(400, 8.5, "modern");
    config.responsibilities.slice(0, 6).forEach((r) => {
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(m + 4, y - 2.5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#333";
      const rLines = wrapCanvasText(ctx, r, PAGE_W - 2 * m - 16);
      rLines.forEach((l, li) => ctx.fillText(l, m + 14, y + li * 12));
      y += rLines.length * 12 + 4;
    });
    y += 8;

    // Requirements
    ctx.fillStyle = primaryColor;
    ctx.font = getCanvasFont(700, 11, "modern");
    ctx.fillText("Requirements", m, y);
    drawProDivider(ctx, m, y + 4, 60, primaryColor, "gradient", 1.5);
    y += 16;

    ctx.fillStyle = "#333";
    ctx.font = getCanvasFont(400, 8.5, "modern");
    config.requirements.slice(0, 6).forEach((r) => {
      ctx.fillStyle = primaryColor;
      ctx.font = getCanvasFont(400, 8, "modern");
      ctx.fillText("✓", m + 2, y);
      ctx.fillStyle = "#333";
      ctx.font = getCanvasFont(400, 8.5, "modern");
      ctx.fillText(r, m + 14, y);
      y += 14;
    });
    y += 8;

    // Benefits (if space)
    if (y < PAGE_H - 120) {
      ctx.fillStyle = primaryColor;
      ctx.font = getCanvasFont(700, 11, "modern");
      ctx.fillText("What We Offer", m, y);
      drawProDivider(ctx, m, y + 4, 60, primaryColor, "gradient", 1.5);
      y += 16;

      ctx.fillStyle = "#333";
      ctx.font = getCanvasFont(400, 8.5, "modern");
      config.benefits.slice(0, 6).forEach((b) => {
        ctx.fillStyle = pal.primaryLight || primaryColor;
        ctx.fillText("★", m + 2, y);
        ctx.fillStyle = "#333";
        ctx.fillText(b, m + 14, y);
        y += 14;
      });
    }

    // Footer
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, PAGE_H - 40, PAGE_W, 40);
    ctx.fillStyle = "#ffffff";
    ctx.font = getCanvasFont(600, 9, "modern");
    ctx.textAlign = "center";
    ctx.fillText(`Apply by ${config.applicationDeadline} — ${config.contactEmail}`, PAGE_W / 2, PAGE_H - 20);
  }, [config, PAGE_W, PAGE_H]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  const handleAIGenerate = useCallback(async () => {
    if (!config.description.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Generate a professional job description for: "${config.description}". Return JSON: { "companyName": "", "jobTitle": "", "department": "", "location": "", "employmentType": "", "salary": "", "jobSummary": "", "responsibilities": [""], "requirements": [""], "benefits": [""] }. Make it professional, detailed, and relevant to the Zambian job market.` }] }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      let text = "";
      const decoder = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }); }
      const cleaned = cleanAIText(text);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) { const data = JSON.parse(jsonMatch[0]); updateConfig(data); }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config.description, isGenerating, updateConfig]);

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], "job-description");
  }, []);

  const updateListItem = useCallback((field: "responsibilities" | "requirements" | "benefits", i: number, value: string) => {
    const list = [...config[field]];
    list[i] = value;
    updateConfig({ [field]: list });
  }, [config, updateConfig]);

  const addListItem = useCallback((field: "responsibilities" | "requirements" | "benefits") => {
    updateConfig({ [field]: [...config[field], ""] });
  }, [config, updateConfig]);

  const removeListItem = useCallback((field: "responsibilities" | "requirements" | "benefits", i: number) => {
    updateConfig({ [field]: config[field].filter((_, idx) => idx !== i) });
  }, [config, updateConfig]);

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id, label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = config.primaryColor;
      if (t.id === "creative") {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h * 0.12); ctx.lineTo(0, h * 0.16); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillRect(0, 0, w, h * 0.14);
      }
      ctx.fillStyle = hexToRgba(config.primaryColor, 0.08);
      ctx.fillRect(w * 0.08, h * 0.2, w * 0.84, h * 0.06);
    },
  }));

  const renderListSection = (label: string, field: "responsibilities" | "requirements" | "benefits") => (
    <div className="space-y-1.5 max-h-36 overflow-y-auto">
      {config[field].map((item, i) => (
        <div key={i} className="flex gap-1">
          <input type="text" value={item} onChange={(e) => updateListItem(field, i, e.target.value)}
            className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-[10px] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
          <button onClick={() => removeListItem(field, i)} className="text-red-400 hover:text-red-300 text-xs px-1">×</button>
        </div>
      ))}
      <button onClick={() => addListItem(field)} className="w-full py-1 rounded border border-dashed border-gray-300 dark:border-gray-700 text-[10px] text-gray-500 hover:text-primary-500 transition-colors">+ Add</button>
    </div>
  );

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea value={config.description} onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe the position… e.g., 'Marketing Manager at a fintech company in Lusaka'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" rows={3} />
        <button onClick={handleAIGenerate} disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate</>}
        </button>
      </AccordionSection>

      <AccordionSection id="company" icon={<IconBriefcase className="size-3.5" />} label="Company">
        <div className="space-y-2">
          {(["companyName", "companyTagline", "contactEmail"] as const).map((f) => (
            <div key={f}><label className="text-[10px] font-semibold text-gray-500 uppercase">{f.replace(/([A-Z])/g, " $1")}</label>
              <input type="text" value={config[f]} onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="position" icon={<IconType className="size-3.5" />} label="Position Details">
        <div className="space-y-2">
          {(["jobTitle", "department", "location", "employmentType", "reportingTo", "salary", "applicationDeadline"] as const).map((f) => (
            <div key={f}><label className="text-[10px] font-semibold text-gray-500 uppercase">{f.replace(/([A-Z])/g, " $1")}</label>
              <input type="text" value={config[f]} onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="summary" icon={<IconFileText className="size-3.5" />} label="Job Summary">
        <textarea value={config.jobSummary} onChange={(e) => updateConfig({ jobSummary: e.target.value })}
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" rows={3} />
      </AccordionSection>

      <AccordionSection id="responsibilities" icon={<IconFileText className="size-3.5" />} label={`Responsibilities (${config.responsibilities.length})`}>
        {renderListSection("Responsibilities", "responsibilities")}
      </AccordionSection>

      <AccordionSection id="requirements" icon={<IconFileText className="size-3.5" />} label={`Requirements (${config.requirements.length})`}>
        {renderListSection("Requirements", "requirements")}
      </AccordionSection>

      <AccordionSection id="benefits" icon={<IconFileText className="size-3.5" />} label={`Benefits (${config.benefits.length})`}>
        {renderListSection("Benefits", "benefits")}
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style">
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((c) => (<button key={c} onClick={() => updateConfig({ primaryColor: c })}
            className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />))}
        </div>
      </AccordionSection>

      <AccordionSection id="export" icon={<IconDownload className="size-3.5" />} label="Export">
        <div className="space-y-1.5">
          {[{ id: "web-standard", label: "Web PNG (2×)" }, { id: "print-standard", label: "Print 300 DPI" }, { id: "print-ultra", label: "Ultra 600 DPI" }].map((p) => (
            <button key={p.id} onClick={() => handleExport(p.id)}
              className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors">{p.label}</button>
          ))}
        </div>
      </AccordionSection>
    </Accordion>
  );

  return (
    <StickyCanvasLayout canvasRef={canvasRef} displayWidth={340} displayHeight={480}
      leftPanel={leftPanel} rightPanel={<TemplateSlider templates={templatePreviews} activeId={config.template} onSelect={(id) => updateConfig({ template: id as JDTemplate })} />}
      zoom={zoom} onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))} onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))} onZoomFit={() => setZoom(1)}
      label="Job Description — A4 Portrait (595×842)" />
  );
}
