"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconUser,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconBriefcase,
  IconAward,
  IconBookOpen,
  IconTrash,
  IconPlus,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  summary: string;
}

interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  highlights: string[];
}

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  year: string;
}

interface SkillEntry {
  name: string;
  level: number; /* 0-100 */
}

interface ResumeConfig {
  description: string;
  template: ResumeTemplate;
  primaryColor: string;
  fontStyle: "modern" | "classic" | "minimal" | "bold";
  pageSize: PageSize;
}

type PageSize = "a4" | "letter" | "a5" | "legal";
type ResumeTemplate =
  | "clean"
  | "sidebar"
  | "executive"
  | "creative"
  | "compact"
  | "infographic";

const PAGE_SIZES: { id: PageSize; name: string; w: number; h: number }[] = [
  { id: "a4", name: "A4", w: 595, h: 842 },
  { id: "letter", name: "US Letter", w: 612, h: 792 },
  { id: "a5", name: "A5", w: 420, h: 595 },
  { id: "legal", name: "Legal", w: 612, h: 1008 },
];

const TEMPLATES: { id: ResumeTemplate; name: string; desc: string }[] = [
  { id: "clean", name: "Clean", desc: "Minimal & ATS-friendly" },
  { id: "sidebar", name: "Sidebar", desc: "Two-column with accent bar" },
  { id: "executive", name: "Executive", desc: "Senior-level professional" },
  { id: "creative", name: "Creative", desc: "Bold header + color accents" },
  { id: "compact", name: "Compact", desc: "Dense single-page" },
  { id: "infographic", name: "Infographic", desc: "Skill bars, charts, icons" },
];

const COLOR_PRESETS = [
  "#1e40af",
  "#0f766e",
  "#4338ca",
  "#b91c1c",
  "#c2410c",
  "#0e7490",
  "#4f46e5",
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
  const r = Math.min(
    255,
    ((num >> 16) & 0xff) + Math.round((255 * pct) / 100),
  );
  const g = Math.min(
    255,
    ((num >> 8) & 0xff) + Math.round((255 * pct) / 100),
  );
  const b = Math.min(255, (num & 0xff) + Math.round((255 * pct) / 100));
  return `rgb(${r},${g},${b})`;
}

/* ── Component ─────────────────────────────────────────────── */

export default function ResumeCVWorkspace() {
  const [personal, setPersonal] = useState<PersonalInfo>({
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    summary: "",
  });

  const [experience, setExperience] = useState<ExperienceEntry[]>([
    {
      id: uid(),
      company: "",
      role: "",
      startDate: "",
      endDate: "Present",
      highlights: [""],
    },
  ]);

  const [education, setEducation] = useState<EducationEntry[]>([
    { id: uid(), institution: "", degree: "", field: "", year: "" },
  ]);

  const [skills, setSkills] = useState<SkillEntry[]>([{ name: "", level: 80 }]);

  const [config, setConfig] = useState<ResumeConfig>({
    description: "",
    template: "clean",
    primaryColor: "#1e40af",
    fontStyle: "modern",
    pageSize: "a4",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [revisionRequest, setRevisionRequest] = useState("");
  const [activeSection, setActiveSection] = useState<
    "personal" | "experience" | "education" | "skills"
  >("personal");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const updateConfig = useCallback((upd: Partial<ResumeConfig>) => {
    setConfig((p) => ({ ...p, ...upd }));
  }, []);

  const hasContent = Boolean(
    personal.fullName ||
      personal.summary ||
      experience.some((e) => e.company),
  );

  const pageDims = useMemo(() => {
    const ps = PAGE_SIZES.find((p) => p.id === config.pageSize) || PAGE_SIZES[0];
    return { w: ps.w, h: ps.h };
  }, [config.pageSize]);

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
    const fontBase =
      config.fontStyle === "classic"
        ? "Georgia, serif"
        : config.fontStyle === "bold"
          ? "'Arial Black', sans-serif"
          : config.fontStyle === "minimal"
            ? "'Helvetica Neue', Helvetica, sans-serif"
            : "'Inter', 'Segoe UI', sans-serif";

    const M = 36; /* margin */
    const CW = W - M * 2; /* content width */
    const maxY = H - M; /* absolute bottom boundary */

    /* White background */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    /* ─── Utility: safe text (never exceeds right edge) ─── */
    function safeText(text: string, x: number, y: number, maxWidth: number) {
      if (y > maxY - 4) return;
      ctx.fillText(text, x, y, maxWidth);
    }

    /* ─── Utility: word-wrap with page-clipping ─── */
    function wrapClip(
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lh: number,
    ): number {
      const words = text.split(" ");
      let line = "";
      let cy = y;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > maxWidth && line) {
          if (cy > maxY - 4) return cy;
          ctx.fillText(line.trim(), x, cy, maxWidth);
          line = word + " ";
          cy += lh;
        } else {
          line = test;
        }
      }
      if (cy <= maxY - 4) ctx.fillText(line.trim(), x, cy, maxWidth);
      return cy + lh;
    }

    /* ─── Utility: section header ─── */
    function sectionHeader(
      label: string,
      x: number,
      y: number,
      w: number,
      compact = false,
    ): number {
      if (y > maxY - 20) return y;
      ctx.fillStyle = primary;
      ctx.font = `700 ${compact ? 9 : 10}px ${fontBase}`;
      ctx.textAlign = "left";
      safeText(label.toUpperCase(), x, y, w);
      const underY = y + 4;
      ctx.fillStyle = primary + "33";
      ctx.fillRect(x, underY, Math.min(40, w), 1.5);
      return underY + (compact ? 10 : 13);
    }

    /* ─── Utility: draw skill bar ─── */
    function drawSkillBar(
      name: string,
      level: number,
      x: number,
      y: number,
      barW: number,
    ): number {
      if (y > maxY - 10) return y + 18;
      ctx.fillStyle = "#333333";
      ctx.font = `400 8px ${fontBase}`;
      safeText(name, x, y, barW * 0.5);
      ctx.fillStyle = "#999999";
      ctx.font = `400 7px ${fontBase}`;
      ctx.textAlign = "right";
      safeText(`${level}%`, x + barW, y, 40);
      ctx.textAlign = "left";
      const barY = y + 4;
      const bH = 4;
      ctx.fillStyle = "#eeeeee";
      roundRect(ctx, x, barY, barW, bH, 2);
      ctx.fill();
      ctx.fillStyle = primary;
      roundRect(ctx, x, barY, barW * (level / 100), bH, 2);
      ctx.fill();
      return barY + bH + 10;
    }

    /* ─── Utility: draw circular skill indicator ─── */
    function drawSkillCircle(
      name: string,
      level: number,
      cx: number,
      cy: number,
      r: number,
    ) {
      if (cy > maxY - r * 2) return;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#f0f0f0";
      ctx.fill();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (Math.PI * 2 * level) / 100;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = primary + "cc";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.fillStyle = "#333333";
      ctx.font = `700 ${Math.round(r * 0.5)}px ${fontBase}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      safeText(`${level}%`, cx, cy, r * 2);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = "#555555";
      ctx.font = `400 7px ${fontBase}`;
      ctx.textAlign = "center";
      safeText(name, cx, cy + r + 10, r * 3);
      ctx.textAlign = "left";
    }

    /* ─── Utility: decorative shapes ─── */
    function drawAccentShapes() {
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.arc(W + 20, -20, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-30, H + 30, 80, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.arc(W - 60 + i * 8, H - 60 + j * 8, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    /* ─── Utility: render experience entries ─── */
    function renderExperience(
      exps: ExperienceEntry[],
      x: number,
      startY: number,
      w: number,
      maxBottom: number,
      font: string,
      compact = false,
    ): number {
      let ey = startY;
      exps
        .filter((e) => e.company)
        .forEach((exp) => {
          if (ey > maxBottom - 16) return;
          ctx.fillStyle = "#111111";
          ctx.font = `700 ${compact ? 8 : 9}px ${font}`;
          safeText(exp.role || "Role", x, ey, w);
          ey += compact ? 10 : 12;
          ctx.fillStyle = "#888888";
          ctx.font = `400 ${compact ? 7 : 7.5}px ${font}`;
          safeText(
            `${exp.company}  |  ${exp.startDate} - ${exp.endDate}`,
            x,
            ey,
            w,
          );
          ey += compact ? 10 : 12;
          ctx.fillStyle = "#444444";
          ctx.font = `400 ${compact ? 7 : 7.5}px ${font}`;
          exp.highlights
            .filter((h) => h.trim())
            .forEach((hl) => {
              if (ey > maxBottom - 8) return;
              safeText("\u2022 " + hl, x + 4, ey, w - 8);
              ey += compact ? 10 : 11;
            });
          ey += compact ? 4 : 8;
        });
      return ey;
    }

    /* ─── Utility: render education entries ─── */
    function renderEducation(
      edus: EducationEntry[],
      x: number,
      startY: number,
      w: number,
      maxBottom: number,
      compact = false,
    ): number {
      let ey = startY;
      edus
        .filter((e) => e.institution)
        .forEach((edu) => {
          if (ey > maxBottom - 14) return;
          ctx.fillStyle = "#111111";
          ctx.font = `700 ${compact ? 7.5 : 8.5}px ${fontBase}`;
          safeText(
            `${edu.degree} ${edu.field}`.trim() || "Degree",
            x,
            ey,
            w,
          );
          ey += compact ? 10 : 12;
          ctx.fillStyle = "#777777";
          ctx.font = `400 ${compact ? 7 : 7.5}px ${fontBase}`;
          safeText(
            `${edu.institution}${edu.year ? ` \u2014 ${edu.year}` : ""}`,
            x,
            ey,
            w,
          );
          ey += compact ? 14 : 16;
        });
      return ey;
    }

    let y = M;

    /* ═══════════════════════════════════════════════════════ */
    /* TEMPLATE: Infographic                                  */
    /* ═══════════════════════════════════════════════════════ */
    if (config.template === "infographic") {
      const sideW = Math.round(W * 0.35);
      const mainX = sideW + 20;
      const mainW = W - mainX - M;

      /* Sidebar background */
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, sideW, H);

      /* Decorative circles on sidebar */
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(sideW - 20, H - 40, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20, H * 0.6, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      /* Photo placeholder circle */
      const photoR = 36;
      const photoCx = sideW / 2;
      const photoCy = M + photoR;
      ctx.beginPath();
      ctx.arc(photoCx, photoCy, photoR, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff22";
      ctx.fill();
      ctx.fillStyle = "#ffffffaa";
      ctx.font = `400 9px ${fontBase}`;
      ctx.textAlign = "center";
      safeText("PHOTO", photoCx, photoCy + 3, 60);
      ctx.textAlign = "left";

      let sy = photoCy + photoR + 20;
      /* Name */
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 14px ${fontBase}`;
      ctx.textAlign = "center";
      safeText(personal.fullName || "Your Name", photoCx, sy, sideW - 20);
      sy += 18;
      ctx.font = `400 9px ${fontBase}`;
      ctx.fillStyle = "#ffffffbb";
      safeText(personal.jobTitle || "Job Title", photoCx, sy, sideW - 20);
      ctx.textAlign = "left";
      sy += 24;

      /* Contact items */
      ctx.fillStyle = "#ffffffaa";
      ctx.font = `400 8px ${fontBase}`;
      const contacts = [
        { icon: "\u2709", val: personal.email },
        { icon: "\u260E", val: personal.phone },
        { icon: "\u25C9", val: personal.location },
        { icon: "\u2605", val: personal.website },
      ].filter((c) => c.val);
      contacts.forEach((c) => {
        if (sy > maxY - 10) return;
        safeText(`${c.icon}  ${c.val}`, 16, sy, sideW - 28);
        sy += 14;
      });
      sy += 12;

      /* Skill bars in sidebar */
      if (skills.some((s) => s.name.trim())) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `700 9px ${fontBase}`;
        safeText("SKILLS", 16, sy, sideW - 28);
        sy += 16;
        const barW = sideW - 32;
        skills
          .filter((s) => s.name.trim())
          .forEach((sk) => {
            if (sy > maxY - 14) return;
            ctx.fillStyle = "#ffffffcc";
            ctx.font = `400 7px ${fontBase}`;
            safeText(sk.name, 16, sy, barW);
            sy += 10;
            ctx.fillStyle = "#ffffff22";
            roundRect(ctx, 16, sy, barW, 4, 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            roundRect(ctx, 16, sy, barW * (sk.level / 100), 4, 2);
            ctx.fill();
            sy += 14;
          });
      }

      /* Main content */
      let my = M;

      if (personal.summary) {
        my = sectionHeader("PROFILE", mainX, my, mainW);
        ctx.fillStyle = "#333333";
        ctx.font = `400 8px ${fontBase}`;
        my = wrapClip(personal.summary, mainX, my, mainW, 12);
        my += 10;
      }

      /* Timeline experience */
      if (experience.some((e) => e.company)) {
        my = sectionHeader("EXPERIENCE", mainX, my, mainW);
        experience
          .filter((e) => e.company)
          .forEach((exp) => {
            if (my > maxY - 20) return;
            /* Timeline dot */
            ctx.fillStyle = primary;
            ctx.beginPath();
            ctx.arc(mainX + 4, my - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = primary + "22";
            ctx.fillRect(mainX + 3, my + 4, 1.5, 30);

            ctx.fillStyle = "#111111";
            ctx.font = `700 9px ${fontBase}`;
            safeText(exp.role || "Role", mainX + 14, my, mainW - 14);
            my += 12;
            ctx.fillStyle = "#888888";
            ctx.font = `400 7px ${fontBase}`;
            safeText(
              `${exp.company} | ${exp.startDate} - ${exp.endDate}`,
              mainX + 14,
              my,
              mainW - 14,
            );
            my += 12;
            ctx.fillStyle = "#444444";
            ctx.font = `400 7.5px ${fontBase}`;
            exp.highlights
              .filter((h) => h.trim())
              .forEach((hl) => {
                if (my > maxY - 8) return;
                safeText("\u2022 " + hl, mainX + 14, my, mainW - 20);
                my += 11;
              });
            my += 8;
          });
      }

      /* Education */
      if (education.some((e) => e.institution)) {
        my = sectionHeader("EDUCATION", mainX, my, mainW);
        my = renderEducation(education, mainX, my, mainW, maxY);
      }

      /* Skill circles at bottom if room */
      const filledSkills = skills.filter((s) => s.name.trim());
      if (filledSkills.length > 0 && my < maxY - 80) {
        my = sectionHeader("PROFICIENCY", mainX, my + 6, mainW);
        my += 6;
        const circleR = 20;
        const maxCircles = Math.min(
          filledSkills.length,
          Math.floor(mainW / (circleR * 2 + 16)),
        );
        const totalCircleW = maxCircles * (circleR * 2 + 12) - 12;
        let cx = mainX + (mainW - totalCircleW) / 2 + circleR;
        filledSkills.slice(0, maxCircles).forEach((sk) => {
          if (my + circleR * 2 + 20 > maxY) return;
          drawSkillCircle(sk.name, sk.level, cx, my + circleR, circleR);
          cx += circleR * 2 + 12;
        });
      }

      /* ═══════════════════════════════════════════════════════ */
      /* TEMPLATE: Sidebar                                      */
      /* ═══════════════════════════════════════════════════════ */
    } else if (config.template === "sidebar") {
      const sideW = Math.round(W * 0.32);
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, sideW, H);

      /* Subtle dot pattern */
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = "#ffffff";
      for (let dy = 0; dy < H; dy += 20) {
        for (let dx = 0; dx < sideW; dx += 20) {
          ctx.fillRect(dx, dy, 1, 1);
        }
      }
      ctx.globalAlpha = 1;

      let sy = M;
      ctx.textAlign = "left";

      /* Name */
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 15px ${fontBase}`;
      sy = wrapClip(personal.fullName || "Your Name", 16, sy, sideW - 28, 18);
      sy += 4;
      ctx.font = `400 9px ${fontBase}`;
      ctx.fillStyle = "#ffffffcc";
      safeText(personal.jobTitle || "Job Title", 16, sy, sideW - 28);
      sy += 24;

      /* Contact */
      ctx.fillStyle = "#ffffffaa";
      ctx.font = `400 7.5px ${fontBase}`;
      [personal.email, personal.phone, personal.location, personal.website]
        .filter(Boolean)
        .forEach((item) => {
          if (sy > maxY - 10) return;
          safeText(item, 16, sy, sideW - 28);
          sy += 13;
        });
      sy += 14;

      /* Skills with bars */
      if (skills.some((s) => s.name.trim())) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `700 9px ${fontBase}`;
        safeText("SKILLS", 16, sy, sideW - 28);
        sy += 14;
        const barW = sideW - 32;
        skills
          .filter((s) => s.name.trim())
          .forEach((sk) => {
            if (sy > maxY - 14) return;
            ctx.fillStyle = "#ffffffcc";
            ctx.font = `400 7px ${fontBase}`;
            safeText(sk.name, 16, sy, barW * 0.65);
            ctx.textAlign = "right";
            ctx.fillStyle = "#ffffff88";
            ctx.font = `400 6px ${fontBase}`;
            safeText(`${sk.level}%`, 16 + barW, sy, 30);
            ctx.textAlign = "left";
            sy += 9;
            ctx.fillStyle = "#ffffff22";
            roundRect(ctx, 16, sy, barW, 3, 1.5);
            ctx.fill();
            ctx.fillStyle = "#ffffffdd";
            roundRect(ctx, 16, sy, barW * (sk.level / 100), 3, 1.5);
            ctx.fill();
            sy += 12;
          });
      }

      /* Main content */
      const mainX = sideW + 24;
      const mainW = W - mainX - M;
      let my = M;

      if (personal.summary) {
        my = sectionHeader("PROFILE", mainX, my, mainW);
        ctx.fillStyle = "#333333";
        ctx.font = `400 8px ${fontBase}`;
        my = wrapClip(personal.summary, mainX, my, mainW, 12);
        my += 10;
      }

      if (experience.some((e) => e.company)) {
        my = sectionHeader("EXPERIENCE", mainX, my, mainW);
        my = renderExperience(experience, mainX, my, mainW, maxY, fontBase);
        my += 6;
      }

      if (education.some((e) => e.institution)) {
        my = sectionHeader("EDUCATION", mainX, my, mainW);
        my = renderEducation(education, mainX, my, mainW, maxY);
      }

      /* ═══════════════════════════════════════════════════════ */
      /* TEMPLATE: Creative                                     */
      /* ═══════════════════════════════════════════════════════ */
    } else if (config.template === "creative") {
      drawAccentShapes();

      /* Full-width gradient header */
      const hdrH = Math.round(H * 0.13);
      const grad = ctx.createLinearGradient(0, 0, W, hdrH);
      grad.addColorStop(0, primary);
      grad.addColorStop(1, lighten(primary, 25));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, hdrH);

      /* Diagonal cut */
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, hdrH - 16);
      ctx.lineTo(W, hdrH);
      ctx.lineTo(W, hdrH + 2);
      ctx.lineTo(0, hdrH + 2);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 22px ${fontBase}`;
      safeText(personal.fullName || "Your Name", M, hdrH * 0.45, CW);
      ctx.font = `300 11px ${fontBase}`;
      ctx.fillStyle = "#ffffffcc";
      safeText(
        personal.jobTitle || "Job Title",
        M,
        hdrH * 0.45 + 20,
        CW,
      );

      /* Contact row */
      ctx.fillStyle = "#ffffffaa";
      ctx.font = `400 7.5px ${fontBase}`;
      const cStrCreative = [personal.email, personal.phone, personal.location]
        .filter(Boolean)
        .join("  |  ");
      safeText(cStrCreative, M, hdrH * 0.45 + 36, CW);

      y = hdrH + 16;

      if (personal.summary) {
        y = sectionHeader("PROFILE", M, y, CW);
        ctx.fillStyle = "#333333";
        ctx.font = `400 8.5px ${fontBase}`;
        y = wrapClip(personal.summary, M, y, CW, 13);
        y += 12;
      }

      /* Two-column layout */
      const col1W = Math.round(CW * 0.62);
      const col2X = M + col1W + 20;
      const col2W = CW - col1W - 20;

      let ly = y;
      let ry = y;

      if (experience.some((e) => e.company)) {
        ly = sectionHeader("EXPERIENCE", M, ly, col1W);
        ly = renderExperience(experience, M, ly, col1W, maxY, fontBase);
        ly += 6;
      }

      if (education.some((e) => e.institution)) {
        ly = sectionHeader("EDUCATION", M, ly, col1W);
        ly = renderEducation(education, M, ly, col1W, maxY);
      }

      /* Skills column */
      if (skills.some((s) => s.name.trim())) {
        ry = sectionHeader("SKILLS", col2X, ry, col2W);
        skills
          .filter((s) => s.name.trim())
          .forEach((sk) => {
            ry = drawSkillBar(sk.name, sk.level, col2X, ry, col2W);
          });
      }

      /* ═══════════════════════════════════════════════════════ */
      /* TEMPLATE: Executive                                    */
      /* ═══════════════════════════════════════════════════════ */
    } else if (config.template === "executive") {
      /* Top accent line */
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, 4);

      ctx.textAlign = "center";
      ctx.fillStyle = "#111111";
      ctx.font = `700 22px ${fontBase}`;
      safeText(personal.fullName || "Your Name", W / 2, y + 28, CW);
      ctx.font = `300 11px ${fontBase}`;
      ctx.fillStyle = primary;
      safeText(personal.jobTitle || "Job Title", W / 2, y + 44, CW);

      /* Divider */
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(M, y + 56);
      ctx.lineTo(W - M, y + 56);
      ctx.stroke();

      ctx.font = `400 7.5px ${fontBase}`;
      ctx.fillStyle = "#777777";
      const cStrExec = [
        personal.email,
        personal.phone,
        personal.location,
        personal.website,
      ]
        .filter(Boolean)
        .join("  |  ");
      safeText(cStrExec, W / 2, y + 70, CW);
      ctx.textAlign = "left";
      y += 88;

      if (personal.summary) {
        y = sectionHeader("EXECUTIVE SUMMARY", M, y, CW);
        ctx.fillStyle = "#333333";
        ctx.font = `400 8.5px ${fontBase}`;
        y = wrapClip(personal.summary, M, y, CW, 13);
        y += 12;
      }

      if (experience.some((e) => e.company)) {
        y = sectionHeader("PROFESSIONAL EXPERIENCE", M, y, CW);
        y = renderExperience(experience, M, y, CW, maxY, fontBase);
        y += 6;
      }

      if (education.some((e) => e.institution)) {
        y = sectionHeader("EDUCATION", M, y, CW);
        y = renderEducation(education, M, y, CW, maxY);
        y += 6;
      }

      if (skills.some((s) => s.name.trim())) {
        y = sectionHeader("CORE COMPETENCIES", M, y, CW);
        /* Skill chips in a row */
        ctx.font = `400 7.5px ${fontBase}`;
        let sx = M;
        skills
          .filter((s) => s.name.trim())
          .forEach((sk) => {
            const tw = ctx.measureText(sk.name).width + 16;
            if (sx + tw > W - M) {
              sx = M;
              y += 18;
            }
            if (y > maxY - 14) return;
            ctx.fillStyle = primary + "12";
            roundRect(ctx, sx, y - 8, tw, 16, 8);
            ctx.fill();
            ctx.fillStyle = primary;
            safeText(sk.name, sx + 8, y + 1, tw);
            sx += tw + 6;
          });
      }

      /* ═══════════════════════════════════════════════════════ */
      /* TEMPLATE: Compact                                      */
      /* ═══════════════════════════════════════════════════════ */
    } else if (config.template === "compact") {
      ctx.textAlign = "left";
      ctx.fillStyle = "#111111";
      ctx.font = `700 16px ${fontBase}`;
      safeText(personal.fullName || "Your Name", M, y + 14, CW);
      ctx.font = `400 8px ${fontBase}`;
      ctx.fillStyle = "#555555";
      const cStrCompact = [
        personal.jobTitle,
        personal.email,
        personal.phone,
        personal.location,
      ]
        .filter(Boolean)
        .join(" | ");
      safeText(cStrCompact, M, y + 28, CW);

      ctx.strokeStyle = "#dddddd";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(M, y + 36);
      ctx.lineTo(W - M, y + 36);
      ctx.stroke();
      y += 44;

      if (personal.summary) {
        y = sectionHeader("SUMMARY", M, y, CW, true);
        ctx.fillStyle = "#333333";
        ctx.font = `400 7.5px ${fontBase}`;
        y = wrapClip(personal.summary, M, y, CW, 11);
        y += 8;
      }

      if (experience.some((e) => e.company)) {
        y = sectionHeader("EXPERIENCE", M, y, CW, true);
        y = renderExperience(experience, M, y, CW, maxY, fontBase, true);
        y += 4;
      }

      if (education.some((e) => e.institution)) {
        y = sectionHeader("EDUCATION", M, y, CW, true);
        y = renderEducation(education, M, y, CW, maxY, true);
        y += 4;
      }

      if (skills.some((s) => s.name.trim())) {
        y = sectionHeader("SKILLS", M, y, CW, true);
        ctx.fillStyle = "#333333";
        ctx.font = `400 7px ${fontBase}`;
        safeText(
          skills
            .filter((s) => s.name.trim())
            .map((s) => s.name)
            .join("  |  "),
          M,
          y,
          CW,
        );
      }

      /* ═══════════════════════════════════════════════════════ */
      /* TEMPLATE: Clean (default)                              */
      /* ═══════════════════════════════════════════════════════ */
    } else {
      ctx.textAlign = "left";
      ctx.fillStyle = primary;
      ctx.font = `700 22px ${fontBase}`;
      safeText(personal.fullName || "Your Name", M, y + 22, CW);
      ctx.font = `400 10px ${fontBase}`;
      ctx.fillStyle = "#555555";
      safeText(personal.jobTitle || "Job Title", M, y + 38, CW);

      ctx.font = `400 7.5px ${fontBase}`;
      ctx.fillStyle = "#777777";
      const cStrClean = [
        personal.email,
        personal.phone,
        personal.location,
        personal.website,
      ]
        .filter(Boolean)
        .join("  |  ");
      safeText(cStrClean, M, y + 52, CW);

      /* Primary underline */
      ctx.fillStyle = primary;
      ctx.fillRect(M, y + 60, CW, 2);
      y += 76;

      if (personal.summary) {
        y = sectionHeader("PROFESSIONAL SUMMARY", M, y, CW);
        ctx.fillStyle = "#333333";
        ctx.font = `400 8.5px ${fontBase}`;
        y = wrapClip(personal.summary, M, y, CW, 13);
        y += 12;
      }

      if (experience.some((e) => e.company)) {
        y = sectionHeader("EXPERIENCE", M, y, CW);
        y = renderExperience(experience, M, y, CW, maxY, fontBase);
        y += 6;
      }

      if (education.some((e) => e.institution)) {
        y = sectionHeader("EDUCATION", M, y, CW);
        y = renderEducation(education, M, y, CW, maxY);
        y += 6;
      }

      if (skills.some((s) => s.name.trim())) {
        y = sectionHeader("SKILLS", M, y, CW);
        skills
          .filter((s) => s.name.trim())
          .forEach((sk) => {
            y = drawSkillBar(sk.name, sk.level, M, y, CW);
          });
      }
    }
  }, [personal, experience, education, skills, config, pageDims]);

  /* ── AI Generation ──────────────────────────────────────── */
  const generateResume = useCallback(
    async (mode: "fresh" | "revise" = "fresh") => {
      if (!config.description.trim()) return;
      setIsGenerating(true);
      try {
        const revisionCtx =
          mode === "revise" && revisionRequest.trim()
            ? `\n\nCURRENT RESUME:\nName: ${personal.fullName}\nTitle: ${personal.jobTitle}\nSummary: ${personal.summary}\nExperience: ${experience.map((e) => `${e.role} at ${e.company}`).join("; ")}\n\nCLIENT REVISION: "${revisionRequest.trim()}"\nOnly change what was requested.`
            : "";

        const prompt = `You are an elite resume writer. Create a professional resume.

DESCRIPTION: "${config.description}"
TEMPLATE: ${config.template}
LOCALE: Zambia (use Zambian context where appropriate)
${revisionCtx}

Return ONLY a JSON object (no markdown, no backticks):
{
  "personal": {
    "fullName": "Full Name",
    "jobTitle": "Professional Title",
    "email": "email@example.com",
    "phone": "+260 97 XXX XXXX",
    "location": "Lusaka, Zambia",
    "website": "portfolio.com",
    "linkedin": "linkedin.com/in/name",
    "summary": "2-3 sentence professional summary"
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "startDate": "Jan 2022",
      "endDate": "Present",
      "highlights": ["Achievement with metrics", "Led team of X"]
    }
  ],
  "education": [
    { "institution": "University of Zambia", "degree": "Bachelor of Science", "field": "Computer Science", "year": "2020" }
  ],
  "skills": [
    { "name": "Project Management", "level": 90 },
    { "name": "Data Analysis", "level": 85 },
    { "name": "Leadership", "level": 88 }
  ],
  "color": "#hex"
}

Rules:
- 2-4 experience entries with 2-4 quantified highlights each
- 8-12 skills with proficiency levels (60-95 range)
- ATS-friendly language, action verbs, metrics`;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
          }),
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
          if (data.personal) {
            setPersonal({
              fullName: cleanAIText(data.personal.fullName || ""),
              jobTitle: cleanAIText(data.personal.jobTitle || ""),
              email: cleanAIText(data.personal.email || ""),
              phone: cleanAIText(data.personal.phone || ""),
              location: cleanAIText(data.personal.location || ""),
              website: cleanAIText(data.personal.website || ""),
              linkedin: cleanAIText(data.personal.linkedin || ""),
              summary: cleanAIText(data.personal.summary || ""),
            });
          }
          if (data.experience?.length) {
            setExperience(
              data.experience.map((e: Record<string, unknown>) => ({
                id: uid(),
                company: cleanAIText((e.company as string) || ""),
                role: cleanAIText((e.role as string) || ""),
                startDate: cleanAIText((e.startDate as string) || ""),
                endDate: cleanAIText((e.endDate as string) || ""),
                highlights: ((e.highlights as string[]) || []).map(
                  (h: string) => cleanAIText(h),
                ),
              })),
            );
          }
          if (data.education?.length) {
            setEducation(
              data.education.map((e: Record<string, unknown>) => ({
                id: uid(),
                institution: cleanAIText((e.institution as string) || ""),
                degree: cleanAIText((e.degree as string) || ""),
                field: cleanAIText((e.field as string) || ""),
                year: cleanAIText((e.year as string) || ""),
              })),
            );
          }
          if (data.skills?.length) {
            setSkills(
              data.skills.map((s: string | Record<string, unknown>) => {
                if (typeof s === "string")
                  return { name: cleanAIText(s), level: 80 };
                return {
                  name: cleanAIText((s.name as string) || ""),
                  level: (s.level as number) || 80,
                };
              }),
            );
          }
          if (data.color) updateConfig({ primaryColor: data.color });
          if (mode === "revise") setRevisionRequest("");
        }
      } catch {
        /* silent */
      } finally {
        setIsGenerating(false);
      }
    },
    [config, personal, experience, revisionRequest, updateConfig],
  );

  /* ── Export ──────────────────────────────────────────────── */
  const exportResume = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${personal.fullName || "resume"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [personal.fullName]);

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* ── Left Panel ── */}
      <div className="w-72 shrink-0 overflow-y-auto space-y-3 pr-1">
        {/* AI Director */}
        <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
          <label className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-secondary-500 mb-2">
            <IconSparkles className="size-3" />
            AI Resume Director
          </label>
          <textarea
            rows={3}
            placeholder="Describe the role you're applying for, your experience level, industry..."
            value={config.description}
            onChange={(e) => updateConfig({ description: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-secondary-500/20 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-secondary-500/50 focus:ring-2 focus:ring-secondary-500/20 transition-all resize-none mb-2"
          />
          <button
            onClick={() => generateResume("fresh")}
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
                <IconWand className="size-3" />
                {hasContent ? "Regenerate" : "Generate Resume"}
              </>
            )}
          </button>
          {hasContent && (
            <div className="mt-2 space-y-1.5">
              <input
                type="text"
                placeholder="e.g. Add more metrics, emphasize leadership..."
                value={revisionRequest}
                onChange={(e) => setRevisionRequest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && revisionRequest.trim())
                    generateResume("revise");
                }}
                className="w-full px-3 py-1.5 rounded-lg border border-secondary-500/20 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-secondary-500/50 focus:ring-2 focus:ring-secondary-500/20 transition-all"
              />
              <button
                onClick={() => generateResume("revise")}
                disabled={!revisionRequest.trim() || isGenerating}
                className="w-full flex items-center justify-center gap-2 h-8 rounded-lg border border-secondary-500/30 text-secondary-400 text-[0.625rem] font-semibold hover:bg-secondary-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <IconWand className="size-3" /> Revise
              </button>
            </div>
          )}
        </div>

        {/* Page Size */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Page Size
          </label>
          <div className="grid grid-cols-4 gap-1.5">
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

        {/* Color + Font */}
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
          <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500 pt-1">
            Font
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(["modern", "classic", "minimal", "bold"] as const).map((fs) => (
              <button
                key={fs}
                onClick={() => updateConfig({ fontStyle: fs })}
                className={`py-1 rounded-lg text-[0.5625rem] font-semibold capitalize transition-all ${config.fontStyle === fs ? "bg-primary-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
              >
                {fs}
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3">
          <button
            onClick={exportResume}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-linear-to-r from-primary-500 to-secondary-500 text-white text-[0.625rem] font-bold hover:from-primary-400 hover:to-secondary-400 transition-colors"
          >
            <IconDownload className="size-3" /> Export Resume (PNG)
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

      {/* ── Right Panel: Content Editor ── */}
      <div className="w-80 shrink-0 overflow-y-auto space-y-3 pl-1">
        {/* Section Tabs */}
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {(
            [
              { id: "personal" as const, label: "Personal", Icon: IconUser },
              { id: "experience" as const, label: "Work", Icon: IconBriefcase },
              { id: "education" as const, label: "Education", Icon: IconBookOpen },
              { id: "skills" as const, label: "Skills", Icon: IconAward },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[0.5625rem] transition-all ${activeSection === tab.id ? "bg-primary-500/10 text-primary-500 font-semibold" : "bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >
              <tab.Icon className="size-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Personal */}
        {activeSection === "personal" && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
            <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
              Personal Information
            </label>
            {(
              [
                { key: "fullName", label: "Full Name", ph: "John Mwanza" },
                {
                  key: "jobTitle",
                  label: "Job Title",
                  ph: "Senior Software Engineer",
                },
                { key: "email", label: "Email", ph: "john@example.com" },
                { key: "phone", label: "Phone", ph: "+260 97 123 4567" },
                { key: "location", label: "Location", ph: "Lusaka, Zambia" },
                { key: "website", label: "Website", ph: "portfolio.com" },
                {
                  key: "linkedin",
                  label: "LinkedIn",
                  ph: "linkedin.com/in/name",
                },
              ] as const
            ).map(({ key, label, ph }) => (
              <div key={key}>
                <label className="text-[0.5625rem] text-gray-500">
                  {label}
                </label>
                <input
                  type="text"
                  value={personal[key]}
                  onChange={(e) =>
                    setPersonal((p) => ({ ...p, [key]: e.target.value }))
                  }
                  placeholder={ph}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all"
                />
              </div>
            ))}
            <div>
              <label className="text-[0.5625rem] text-gray-500">
                Professional Summary
              </label>
              <textarea
                rows={3}
                value={personal.summary}
                onChange={(e) =>
                  setPersonal((p) => ({ ...p, summary: e.target.value }))
                }
                placeholder="Brief professional summary..."
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50 transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Experience */}
        {activeSection === "experience" && (
          <div className="space-y-2">
            {experience.map((exp, i) => (
              <div
                key={exp.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <label className="text-[0.625rem] font-semibold text-gray-500">
                    Experience {i + 1}
                  </label>
                  <button
                    onClick={() =>
                      setExperience((p) => p.filter((_, j) => j !== i))
                    }
                    disabled={experience.length <= 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <IconTrash className="size-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) =>
                    setExperience((p) =>
                      p.map((x, j) =>
                        j === i ? { ...x, role: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="Job Title"
                  className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50"
                />
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) =>
                    setExperience((p) =>
                      p.map((x, j) =>
                        j === i ? { ...x, company: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="Company"
                  className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50"
                />
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={exp.startDate}
                    onChange={(e) =>
                      setExperience((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, startDate: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Start"
                    className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50"
                  />
                  <input
                    type="text"
                    value={exp.endDate}
                    onChange={(e) =>
                      setExperience((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, endDate: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="End"
                    className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50"
                  />
                </div>
                <label className="text-[0.5rem] text-gray-400">
                  Highlights
                </label>
                {exp.highlights.map((hl, hi) => (
                  <div key={hi} className="flex gap-1">
                    <input
                      type="text"
                      value={hl}
                      onChange={(e) => {
                        const newH = [...exp.highlights];
                        newH[hi] = e.target.value;
                        setExperience((p) =>
                          p.map((x, j) =>
                            j === i ? { ...x, highlights: newH } : x,
                          ),
                        );
                      }}
                      placeholder="Achievement..."
                      className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50"
                    />
                    <button
                      onClick={() => {
                        const newH = exp.highlights.filter(
                          (_, k) => k !== hi,
                        );
                        setExperience((p) =>
                          p.map((x, j) =>
                            j === i
                              ? { ...x, highlights: newH.length ? newH : [""] }
                              : x,
                          ),
                        );
                      }}
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      x
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newH = [...exp.highlights, ""];
                    setExperience((p) =>
                      p.map((x, j) =>
                        j === i ? { ...x, highlights: newH } : x,
                      ),
                    );
                  }}
                  className="w-full py-0.5 text-[0.5rem] text-gray-400 hover:text-primary-500"
                >
                  + Highlight
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setExperience((p) => [
                  ...p,
                  {
                    id: uid(),
                    company: "",
                    role: "",
                    startDate: "",
                    endDate: "",
                    highlights: [""],
                  },
                ])
              }
              className="w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-[0.625rem] text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
            >
              <IconPlus className="size-3 inline mr-1" /> Add Experience
            </button>
          </div>
        )}

        {/* Education */}
        {activeSection === "education" && (
          <div className="space-y-2">
            {education.map((edu, i) => (
              <div
                key={edu.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <label className="text-[0.625rem] font-semibold text-gray-500">
                    Education {i + 1}
                  </label>
                  <button
                    onClick={() =>
                      setEducation((p) => p.filter((_, j) => j !== i))
                    }
                    disabled={education.length <= 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <IconTrash className="size-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) =>
                    setEducation((p) =>
                      p.map((x, j) =>
                        j === i ? { ...x, institution: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="University / Institution"
                  className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500/50"
                />
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) =>
                      setEducation((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, degree: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Degree"
                    className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50"
                  />
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) =>
                      setEducation((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, field: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Field"
                    className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50"
                  />
                </div>
                <input
                  type="text"
                  value={edu.year}
                  onChange={(e) =>
                    setEducation((p) =>
                      p.map((x, j) =>
                        j === i ? { ...x, year: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="Year"
                  className="w-full px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50"
                />
              </div>
            ))}
            <button
              onClick={() =>
                setEducation((p) => [
                  ...p,
                  {
                    id: uid(),
                    institution: "",
                    degree: "",
                    field: "",
                    year: "",
                  },
                ])
              }
              className="w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-[0.625rem] text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
            >
              <IconPlus className="size-3 inline mr-1" /> Add Education
            </button>
          </div>
        )}

        {/* Skills with levels */}
        {activeSection === "skills" && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 space-y-2">
            <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
              Skills & Proficiency
            </label>
            {skills.map((sk, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={sk.name}
                  onChange={(e) =>
                    setSkills((p) =>
                      p.map((s, j) =>
                        j === i ? { ...s, name: e.target.value } : s,
                      ),
                    )
                  }
                  placeholder="Skill name"
                  className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] focus:outline-none focus:border-primary-500/50"
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sk.level}
                  onChange={(e) =>
                    setSkills((p) =>
                      p.map((s, j) =>
                        j === i
                          ? { ...s, level: parseInt(e.target.value) }
                          : s,
                      ),
                    )
                  }
                  className="w-16 h-1 accent-primary-500"
                />
                <span className="text-[0.5rem] text-gray-400 w-7 text-right">
                  {sk.level}%
                </span>
                <button
                  onClick={() =>
                    setSkills((p) => p.filter((_, j) => j !== i))
                  }
                  className="text-gray-400 hover:text-red-500 text-xs"
                >
                  x
                </button>
              </div>
            ))}
            <button
              onClick={() => setSkills((p) => [...p, { name: "", level: 75 }])}
              className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-[0.5625rem] text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
            >
              <IconPlus className="size-3 inline mr-1" /> Add Skill
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
