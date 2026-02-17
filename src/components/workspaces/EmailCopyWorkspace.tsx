"use client";

import { useState, useCallback, useRef } from "react";
import {
  IconMail,
  IconSparkles,
  IconWand,
  IconLoader,
  IconCopy,
  IconCheck,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type EmailType = "newsletter" | "promotional" | "welcome" | "follow-up" | "cold-outreach" | "thank-you" | "re-engagement";
type Tone = "formal" | "friendly" | "urgent" | "conversational";

interface EmailConfig {
  emailType: EmailType;
  subjectLine: string;
  preheader: string;
  fromName: string;
  replyTo: string;
  recipientSegment: string;
  body: string;
  tone: Tone;
  description: string;
}

interface ABVariant {
  id: string;
  label: string;
  subjectLine: string;
  body: string;
}

const EMAIL_TYPES: { id: EmailType; label: string }[] = [
  { id: "newsletter", label: "Newsletter" },
  { id: "promotional", label: "Promotional" },
  { id: "welcome", label: "Welcome" },
  { id: "follow-up", label: "Follow-up" },
  { id: "cold-outreach", label: "Cold Outreach" },
  { id: "thank-you", label: "Thank You" },
  { id: "re-engagement", label: "Re-engagement" },
];

const TONES: { id: Tone; label: string }[] = [
  { id: "formal", label: "Formal" },
  { id: "friendly", label: "Friendly" },
  { id: "urgent", label: "Urgent" },
  { id: "conversational", label: "Conversational" },
];

const PERSONALIZATION_TOKENS = [
  "{first_name}",
  "{company}",
  "{product}",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Simulated spam score (0-100, lower is better) */
function calcSpamScore(subject: string, body: string): number {
  let score = 0;
  const spamWords = ["free", "urgent", "act now", "limited time", "click here", "buy now", "winner", "congratulations", "discount", "offer"];
  const combined = (subject + " " + body).toLowerCase();
  for (const word of spamWords) {
    if (combined.includes(word)) score += 10;
  }
  if (subject === subject.toUpperCase() && subject.length > 3) score += 15;
  if ((combined.match(/!/g) || []).length > 3) score += 10;
  if ((combined.match(/\$/g) || []).length > 2) score += 10;
  return Math.min(100, score);
}

/* ── Component ─────────────────────────────────────────────── */

export default function EmailCopyWorkspace() {
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [config, setConfig] = useState<EmailConfig>({
    emailType: "newsletter",
    subjectLine: "",
    preheader: "",
    fromName: "DMSuite",
    replyTo: "",
    recipientSegment: "",
    body: "",
    tone: "friendly",
    description: "",
  });

  const [variants, setVariants] = useState<ABVariant[]>([]);
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  const spamScore = calcSpamScore(config.subjectLine, config.body);

  /* ── Insert personalization token ───────────────────────── */
  const insertToken = (token: string) => {
    const ta = bodyRef.current;
    if (!ta) {
      setConfig((p) => ({ ...p, body: p.body + token }));
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = config.body.slice(0, start);
    const after = config.body.slice(end);
    setConfig((p) => ({ ...p, body: before + token + after }));
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + token.length;
      ta.focus();
    }, 0);
  };

  /* ── AI: Suggest Subject Line ───────────────────────────── */
  const suggestSubject = async () => {
    setLoading(true);
    setLoadingAction("subject");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Suggest 1 compelling email subject line for a ${config.emailType} email. Context: "${config.description || config.body || "general business email"}". Tone: ${config.tone}. Return JSON: { "subjectLine": "Your subject here" }. Keep it under 60 characters. Make it attention-grabbing without being spammy.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.subjectLine) setConfig((p) => ({ ...p, subjectLine: data.subjectLine }));
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── AI: Generate Email Body ────────────────────────────── */
  const generateEmail = async () => {
    if (!config.description.trim()) return;
    setLoading(true);
    setLoadingAction("generate");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Write email copy for a ${config.emailType} email. Brief: "${config.description}". Tone: ${config.tone}. From: "${config.fromName}". Recipient segment: "${config.recipientSegment || "general audience"}". Include personalization tokens like {first_name} and {company} where appropriate. Return JSON: { "subjectLine": "", "preheader": "", "body": "" }. The body should be well-formatted plain text with paragraphs. Based in Lusaka, Zambia.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.subjectLine) setConfig((p) => ({ ...p, subjectLine: data.subjectLine }));
        if (data.preheader) setConfig((p) => ({ ...p, preheader: data.preheader }));
        if (data.body) setConfig((p) => ({ ...p, body: data.body }));
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── AI: A/B Variant Generator ──────────────────────────── */
  const generateVariants = async () => {
    if (!config.body.trim() && !config.description.trim()) return;
    setLoading(true);
    setLoadingAction("ab");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate 2 A/B test variants for this email. Original subject: "${config.subjectLine}". Original body: "${config.body || config.description}". Email type: ${config.emailType}. Tone: ${config.tone}. Return JSON: { "variants": [{ "subjectLine": "", "body": "" }, { "subjectLine": "", "body": "" }] }. Make each variant meaningfully different in approach while maintaining the same goal.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.variants) {
          setVariants(
            data.variants.map((v: { subjectLine: string; body: string }, i: number) => ({
              id: uid(),
              label: `Variant ${String.fromCharCode(65 + i)}`,
              subjectLine: v.subjectLine,
              body: v.body,
            }))
          );
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── Copy ───────────────────────────────────────────────── */
  const copyContent = async (type: "html" | "text") => {
    const body = activeVariant
      ? variants.find((v) => v.id === activeVariant)?.body || config.body
      : config.body;
    const subject = activeVariant
      ? variants.find((v) => v.id === activeVariant)?.subjectLine || config.subjectLine
      : config.subjectLine;

    let content: string;
    if (type === "html") {
      const paragraphs = body
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#333;">${l}</p>`)
        .join("\n");
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${subject}</title></head><body style="margin:0;padding:40px 20px;background:#f4f4f4;"><table width="600" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="padding:32px 40px;">\n${paragraphs}\n</td></tr></table></body></html>`;
    } else {
      content = `Subject: ${subject}\nPreheader: ${config.preheader}\n\n${body}`;
    }

    await navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
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
          {/* Email Type */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconMail className="size-4 text-primary-500" />
              Email Type
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {EMAIL_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setConfig((p) => ({ ...p, emailType: t.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.emailType === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sender Info */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">From Name</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              value={config.fromName}
              onChange={(e) => setConfig((p) => ({ ...p, fromName: e.target.value }))}
            />
            <label className="block text-xs text-gray-400">Reply-to Email</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="hello@example.com"
              value={config.replyTo}
              onChange={(e) => setConfig((p) => ({ ...p, replyTo: e.target.value }))}
            />
            <label className="block text-xs text-gray-400">Recipient Segment</label>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="e.g. Active subscribers, New customers…"
              value={config.recipientSegment}
              onChange={(e) => setConfig((p) => ({ ...p, recipientSegment: e.target.value }))}
            />
          </div>

          {/* Tone */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Tone</label>
            <div className="grid grid-cols-2 gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setConfig((p) => ({ ...p, tone: t.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.tone === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Personalization Tokens */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Personalization Tokens</label>
            <div className="flex flex-wrap gap-1.5">
              {PERSONALIZATION_TOKENS.map((token) => (
                <button
                  key={token}
                  onClick={() => insertToken(token)}
                  className="px-2.5 py-1 rounded-full bg-secondary-500/10 text-secondary-500 text-xs font-medium hover:bg-secondary-500/20 transition-colors"
                >
                  {token}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">Click to insert at cursor position in body.</p>
          </div>

          {/* AI Generation */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              AI Email Writer
            </h3>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              rows={3}
              placeholder="Describe what this email should communicate…"
              value={config.description}
              onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))}
            />
            <button
              onClick={generateEmail}
              disabled={loading || !config.description.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "generate" ? <IconLoader className="size-4 animate-spin" /> : <IconSparkles className="size-4" />}
              {loadingAction === "generate" ? "Generating…" : "Generate Email"}
            </button>
            <button
              onClick={generateVariants}
              disabled={loading || (!config.body.trim() && !config.description.trim())}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "ab" ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              Generate A/B Variants
            </button>
          </div>

          {/* Spam Score */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <label className="block text-xs text-gray-400">Spam Score (simulated)</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${spamScore < 30 ? "bg-green-500" : spamScore < 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${spamScore}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${spamScore < 30 ? "text-green-500" : spamScore < 60 ? "text-yellow-500" : "text-red-500"}`}>
                {spamScore}/100
              </span>
            </div>
            <p className="text-[10px] text-gray-400">
              {spamScore < 30 ? "✅ Low spam risk. Good to go!" : spamScore < 60 ? "⚠ Moderate spam risk. Review trigger words." : "🚨 High spam risk. Rewrite to avoid spam filters."}
            </p>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button
              onClick={() => copyContent("html")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copiedType === "html" ? <IconCheck className="size-4 text-success" /> : <IconCopy className="size-4" />}
              {copiedType === "html" ? "Copied!" : "Copy HTML"}
            </button>
            <button
              onClick={() => copyContent("text")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copiedType === "text" ? <IconCheck className="size-4 text-success" /> : <IconCopy className="size-4" />}
              {copiedType === "text" ? "Copied!" : "Copy Plain Text"}
            </button>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Subject Line */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900 dark:text-white">Subject Line</label>
              <button
                onClick={suggestSubject}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-medium hover:bg-primary-500/20 disabled:opacity-50 transition-colors"
              >
                {loadingAction === "subject" ? <IconLoader className="size-3 animate-spin" /> : <IconWand className="size-3" />}
                AI Suggest
              </button>
            </div>
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="Enter email subject line…"
              value={config.subjectLine}
              onChange={(e) => setConfig((p) => ({ ...p, subjectLine: e.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="Preview text / preheader…"
              value={config.preheader}
              onChange={(e) => setConfig((p) => ({ ...p, preheader: e.target.value }))}
            />
          </div>

          {/* A/B Variant Tabs */}
          {variants.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setActiveVariant(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeVariant === null ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
              >
                Original
              </button>
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVariant(v.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeVariant === v.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}

          {/* Email Body */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Email Body</h3>
            {activeVariant ? (
              <div>
                <p className="text-xs text-gray-400 mb-2">
                  Subject: <span className="text-gray-700 dark:text-gray-300">{variants.find((v) => v.id === activeVariant)?.subjectLine}</span>
                </p>
                <textarea
                  className="w-full min-h-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  value={variants.find((v) => v.id === activeVariant)?.body || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVariants((prev) => prev.map((v) => (v.id === activeVariant ? { ...v, body: val } : v)));
                  }}
                />
              </div>
            ) : (
              <textarea
                ref={bodyRef}
                className="w-full min-h-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="Write your email body here…"
                value={config.body}
                onChange={(e) => setConfig((p) => ({ ...p, body: e.target.value }))}
              />
            )}
          </div>

          {/* Empty State */}
          {!config.body && !config.subjectLine && variants.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconMail className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Compose Email Copy</h3>
              <p className="text-sm text-gray-400 max-w-md">
                Select an email type, describe your goal, and let AI generate compelling email copy with subject lines, personalization, and A/B testing variants.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
