"use client";

import { useState, useCallback } from "react";
import {
  IconStar,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlus,
  IconTrash,
  IconCopy,
  IconCheck,
  IconMail,
  IconUser,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type MagnetType = "ebook" | "checklist" | "template" | "cheat-sheet" | "quiz" | "free-tool" | "mini-course" | "swipe-file";
type DesignStyle = "professional" | "creative" | "minimal" | "bold";

interface OutlineItem {
  id: string;
  text: string;
}

const MAGNET_TYPES: { id: MagnetType; label: string }[] = [
  { id: "ebook", label: "eBook" },
  { id: "checklist", label: "Checklist" },
  { id: "template", label: "Template" },
  { id: "cheat-sheet", label: "Cheat Sheet" },
  { id: "quiz", label: "Quiz" },
  { id: "free-tool", label: "Free Tool" },
  { id: "mini-course", label: "Mini Course" },
  { id: "swipe-file", label: "Swipe File" },
];

const DESIGN_STYLES: { id: DesignStyle; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "creative", label: "Creative" },
  { id: "minimal", label: "Minimal" },
  { id: "bold", label: "Bold" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Component ─────────────────────────────────────────────── */

export default function LeadMagnetWorkspace() {
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [magnetType, setMagnetType] = useState<MagnetType>("ebook");
  const [designStyle, setDesignStyle] = useState<DesignStyle>("professional");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [audience, setAudience] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [landingCopy, setLandingCopy] = useState("");
  const [emailFollowUp, setEmailFollowUp] = useState("");

  /* ── Outline management ─────────────────────────────────── */
  const addOutlineItem = () => {
    setOutline((prev) => [...prev, { id: uid(), text: "" }]);
  };

  const removeOutlineItem = (id: string) => {
    setOutline((prev) => prev.filter((item) => item.id !== id));
  };

  const updateOutlineItem = (id: string, text: string) => {
    setOutline((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  /* ── AI: Generate Content ───────────────────────────────── */
  const generateContent = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setLoadingAction("content");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Create a ${magnetType} lead magnet outline. Title: "${title}". Subtitle: "${subtitle}". Target audience: "${audience}". Problem: "${problem}". Solution: "${solution}". Design style: ${designStyle}. Return JSON: { "outline": ["Item 1", "Item 2", ...], "landingCopy": "...", "emailFollowUp": "..." }. The outline should have 6-10 items. Landing copy should be a short paragraph for the opt-in page. Email follow-up should be 3-5 email subjects for a nurture sequence.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.outline && Array.isArray(data.outline)) {
          setOutline(data.outline.map((t: string) => ({ id: uid(), text: t })));
        }
        if (data.landingCopy) setLandingCopy(data.landingCopy);
        if (data.emailFollowUp) setEmailFollowUp(data.emailFollowUp);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── AI: Generate Landing Copy Only ─────────────────────── */
  const generateLandingCopy = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setLoadingAction("landing");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Write compelling landing page copy for a lead magnet: "${title}" (${magnetType}). Target audience: "${audience}". Problem: "${problem}". Solution: "${solution}". Write a headline, 2-3 benefit bullet points, and a call to action. Return plain text only.`,
            },
          ],
        }),
      });
      const text = await res.text();
      setLandingCopy(cleanAIText(text));
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── AI: Generate Email Follow-Up ───────────────────────── */
  const generateEmailSequence = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setLoadingAction("email");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Suggest a 5-email follow-up sequence for people who downloaded a "${magnetType}" lead magnet titled "${title}". Target audience: "${audience}". Provide email subject lines and a 1-sentence description of each email. Return plain text.`,
            },
          ],
        }),
      });
      const text = await res.text();
      setEmailFollowUp(cleanAIText(text));
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportDocument = useCallback(() => {
    let doc = `LEAD MAGNET: ${title}\n`;
    doc += `Type: ${magnetType} | Style: ${designStyle}\n`;
    doc += `${"=".repeat(50)}\n\n`;
    if (subtitle) doc += `Subtitle: ${subtitle}\n\n`;
    if (audience) doc += `Target Audience: ${audience}\n\n`;
    if (problem) doc += `Problem: ${problem}\n\n`;
    if (solution) doc += `Solution: ${solution}\n\n`;
    if (outline.length > 0) {
      doc += `CONTENT OUTLINE\n${"-".repeat(30)}\n`;
      outline.forEach((item, i) => {
        doc += `${i + 1}. ${item.text}\n`;
      });
      doc += "\n";
    }
    if (landingCopy) doc += `LANDING PAGE COPY\n${"-".repeat(30)}\n${landingCopy}\n\n`;
    if (emailFollowUp) doc += `EMAIL FOLLOW-UP SEQUENCE\n${"-".repeat(30)}\n${emailFollowUp}\n`;
    const blob = new Blob([doc], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "lead-magnet").replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [title, subtitle, magnetType, designStyle, audience, problem, solution, outline, landingCopy, emailFollowUp]);

  const copyAll = async () => {
    const text = `${title}\n${subtitle}\n\nOutline:\n${outline.map((o, i) => `${i + 1}. ${o.text}`).join("\n")}\n\n${landingCopy}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 lg:hidden">
        {(["content", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Settings Panel ──────────────────────────────── */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto ${mobileTab !== "settings" ? "hidden lg:block" : ""}`}>
          {/* Magnet Type */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconStar className="size-4 text-primary-500" />
              Magnet Type
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {MAGNET_TYPES.map((mt) => (
                <button
                  key={mt.id}
                  onClick={() => setMagnetType(mt.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${magnetType === mt.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {mt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Title</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="Lead magnet title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="block text-xs text-gray-400">Subtitle</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="Supporting subtitle…"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

          {/* Target Audience */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Target Audience</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              rows={2}
              placeholder="Who is this for?"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </div>

          {/* Problem / Solution */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Problem</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              rows={2}
              placeholder="What problem does it solve?"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            />
            <label className="block text-xs text-gray-400">Solution</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              rows={2}
              placeholder="How does it solve it?"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
            />
          </div>

          {/* Design Style */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Design Style</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {DESIGN_STYLES.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => setDesignStyle(ds.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${designStyle === ds.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {ds.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              AI Tools
            </h3>
            <button
              onClick={generateContent}
              disabled={loading || !title.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "content" ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loadingAction === "content" ? "Generating…" : "Generate Content"}
            </button>
            <button
              onClick={generateLandingCopy}
              disabled={loading || !title.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "landing" ? <IconLoader className="size-4 animate-spin" /> : <IconSparkles className="size-4" />}
              Generate Landing Copy
            </button>
            <button
              onClick={generateEmailSequence}
              disabled={loading || !title.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "email" ? <IconLoader className="size-4 animate-spin" /> : <IconMail className="size-4" />}
              Generate Email Sequence
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button
              onClick={exportDocument}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors"
            >
              <IconDownload className="size-4" />
              Export Document
            </button>
            <button
              onClick={copyAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <IconCheck className="size-4 text-success" /> : <IconCopy className="size-4" />}
              {copied ? "Copied!" : "Copy All"}
            </button>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Content Outline */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Content Outline</h3>
              <button
                onClick={addOutlineItem}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <IconPlus className="size-3" />
                Add Item
              </button>
            </div>
            {outline.length > 0 ? (
              <div className="space-y-2">
                {outline.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="flex items-center justify-center size-6 rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-bold shrink-0">{idx + 1}</span>
                    <input
                      className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      placeholder={`Item ${idx + 1}…`}
                      value={item.text}
                      onChange={(e) => updateOutlineItem(item.id, e.target.value)}
                    />
                    <button onClick={() => removeOutlineItem(item.id)} className="p-1 rounded text-gray-400 hover:text-error transition-colors">
                      <IconTrash className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No outline items yet. Add items or use AI to generate.</p>
            )}
          </div>

          {/* Opt-in Form Preview */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Opt-in Form Preview</h3>
            <div className="max-w-sm mx-auto space-y-3">
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{title || "Your Lead Magnet Title"}</p>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5">
                <IconUser className="size-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-400">Full Name</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5">
                <IconMail className="size-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-400">Email Address</span>
              </div>
              <div className="rounded-lg bg-primary-500 text-gray-950 text-center py-2.5 text-sm font-semibold">
                Download Free {MAGNET_TYPES.find((m) => m.id === magnetType)?.label || "Resource"}
              </div>
              <p className="text-[10px] text-gray-400 text-center">We respect your privacy. Unsubscribe at any time.</p>
            </div>
          </div>

          {/* Landing Page Copy */}
          {landingCopy && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Landing Page Copy</h3>
              <textarea
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                rows={6}
                value={landingCopy}
                onChange={(e) => setLandingCopy(e.target.value)}
              />
            </div>
          )}

          {/* Email Follow-Up */}
          {emailFollowUp && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <IconMail className="size-4 text-primary-500" />
                Email Follow-Up Sequence
              </h3>
              <textarea
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                rows={6}
                value={emailFollowUp}
                onChange={(e) => setEmailFollowUp(e.target.value)}
              />
            </div>
          )}

          {/* Empty State */}
          {outline.length === 0 && !landingCopy && !emailFollowUp && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconStar className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Create Your Lead Magnet</h3>
              <p className="text-sm text-gray-400 max-w-md">
                Fill in the details in the settings panel, then use AI to generate your content outline, landing page copy, and email sequence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
