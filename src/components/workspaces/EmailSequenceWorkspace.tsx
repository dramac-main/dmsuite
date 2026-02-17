"use client";

import { useState, useCallback } from "react";
import {
  IconMail,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlus,
  IconTrash,
  IconCopy,
  IconCheck,
  IconSend,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type SequenceType = "welcome" | "nurture" | "sales" | "onboarding" | "re-engagement" | "abandoned-cart" | "launch";

interface Email {
  id: string;
  day: number;
  subject: string;
  previewText: string;
  body: string;
  cta: string;
  delay: number;
}

const SEQUENCE_TYPES: { id: SequenceType; label: string }[] = [
  { id: "welcome", label: "Welcome" },
  { id: "nurture", label: "Nurture" },
  { id: "sales", label: "Sales" },
  { id: "onboarding", label: "Onboarding" },
  { id: "re-engagement", label: "Re-engagement" },
  { id: "abandoned-cart", label: "Abandoned Cart" },
  { id: "launch", label: "Launch" },
];

const MERGE_FIELDS = ["{first_name}", "{company}", "{product_name}"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeEmail(day: number): Email {
  return { id: uid(), day, subject: "", previewText: "", body: "", cta: "", delay: 1 };
}

function makeEmailSequence(count: number): Email[] {
  return Array.from({ length: count }, (_, i) => {
    const day = i === 0 ? 0 : i * 2;
    return makeEmail(day);
  });
}

/* ── Component ─────────────────────────────────────────────── */

export default function EmailSequenceWorkspace() {
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [sequenceType, setSequenceType] = useState<SequenceType>("welcome");
  const [emailCount, setEmailCount] = useState(5);
  const [emails, setEmails] = useState<Email[]>(makeEmailSequence(5));
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  /* ── Email management ───────────────────────────────────── */
  const updateEmail = (id: string, field: keyof Omit<Email, "id">, value: string | number) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const addEmail = () => {
    const lastDay = emails.length > 0 ? emails[emails.length - 1].day + 2 : 0;
    setEmails((prev) => [...prev, makeEmail(lastDay)]);
    setEmailCount((c) => c + 1);
  };

  const removeEmail = (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    setEmailCount((c) => Math.max(1, c - 1));
  };

  const handleCountChange = (count: number) => {
    const clamped = Math.max(3, Math.min(10, count));
    setEmailCount(clamped);
    setEmails(makeEmailSequence(clamped));
  };

  const insertMergeField = (emailId: string, field: string) => {
    setEmails((prev) =>
      prev.map((e) =>
        e.id === emailId ? { ...e, body: e.body + field } : e
      )
    );
  };

  /* ── Simulated metrics ──────────────────────────────────── */
  const getOpenRate = (idx: number) => Math.max(15, 45 - idx * 5);
  const getClickRate = (idx: number) => Math.max(3, 12 - idx * 1.5);

  /* ── AI: Generate Full Sequence ─────────────────────────── */
  const generateFullSequence = async () => {
    setLoading(true);
    setLoadingAction("full");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a ${emailCount}-email ${sequenceType} email sequence. Return JSON: { "emails": [{ "day": 0, "subject": "...", "previewText": "...", "body": "...", "cta": "..." }] }. Use merge fields like {first_name}, {company}, {product_name} where appropriate. Make each email progressively more conversion-focused. Keep body to 3-5 sentences each.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.emails && Array.isArray(data.emails)) {
          setEmails(
            data.emails.map((e: Partial<Email>, i: number) => ({
              id: uid(),
              day: e.day ?? i * 2,
              subject: e.subject || "",
              previewText: e.previewText || "",
              body: e.body || "",
              cta: e.cta || "",
              delay: i === 0 ? 0 : 2,
            }))
          );
          setEmailCount(data.emails.length);
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── AI: Rewrite Single Email ───────────────────────────── */
  const rewriteEmail = async (emailId: string) => {
    const email = emails.find((e) => e.id === emailId);
    if (!email) return;
    setLoading(true);
    setLoadingAction(`rewrite-${emailId}`);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Rewrite this ${sequenceType} email (day ${email.day} of the sequence). Current subject: "${email.subject}". Make it more engaging and conversion-focused. Use merge fields {first_name}, {company} where natural. Return JSON: { "subject": "...", "previewText": "...", "body": "...", "cta": "..." }. Keep body to 3-5 sentences.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        setEmails((prev) =>
          prev.map((e) =>
            e.id === emailId
              ? {
                  ...e,
                  subject: data.subject || e.subject,
                  previewText: data.previewText || e.previewText,
                  body: data.body || e.body,
                  cta: data.cta || e.cta,
                }
              : e
          )
        );
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setLoadingAction(null);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportEmails = useCallback(
    (format: "text" | "html") => {
      if (format === "text") {
        let doc = `EMAIL SEQUENCE: ${sequenceType.toUpperCase()}\n${"=".repeat(50)}\n\n`;
        emails.forEach((e, i) => {
          doc += `EMAIL ${i + 1} — Day ${e.day}\n${"-".repeat(30)}\n`;
          doc += `Subject: ${e.subject}\nPreview: ${e.previewText}\nCTA: ${e.cta}\n\n${e.body}\n\n`;
        });
        const blob = new Blob([doc], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${sequenceType}-email-sequence.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${sequenceType} Email Sequence</title><style>body{font-family:system-ui;max-width:600px;margin:0 auto;padding:20px}.email{border:1px solid #ddd;border-radius:12px;padding:20px;margin-bottom:20px}.label{font-size:12px;color:#888}.subject{font-size:18px;font-weight:bold;margin:8px 0}</style></head><body>`;
        emails.forEach((e, i) => {
          html += `<div class="email"><p class="label">Email ${i + 1} — Day ${e.day}</p><p class="subject">${e.subject}</p><p>${e.body}</p>${e.cta ? `<p><strong>CTA:</strong> ${e.cta}</p>` : ""}</div>`;
        });
        html += `</body></html>`;
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${sequenceType}-email-sequence.html`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [emails, sequenceType]
  );

  const copyEmails = async () => {
    const text = emails.map((e, i) => `Email ${i + 1} (Day ${e.day})\nSubject: ${e.subject}\n${e.body}`).join("\n\n---\n\n");
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
          {/* Sequence Type */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconMail className="size-4 text-primary-500" />
              Sequence Type
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {SEQUENCE_TYPES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSequenceType(st.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${sequenceType === st.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email Count */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">
              Number of Emails: <span className="text-gray-900 dark:text-white font-semibold">{emailCount}</span>
            </label>
            <input
              type="range"
              min={3}
              max={10}
              step={1}
              value={emailCount}
              onChange={(e) => handleCountChange(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          {/* Merge Fields */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Merge Fields</h3>
            <div className="flex flex-wrap gap-1.5">
              {MERGE_FIELDS.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-500 text-xs font-mono cursor-default"
                >
                  {f}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">Click a merge field when editing an email body to insert it.</p>
          </div>

          {/* AI Actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              AI Tools
            </h3>
            <button
              onClick={generateFullSequence}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loadingAction === "full" ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loadingAction === "full" ? "Generating…" : "Generate Full Sequence"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button
              onClick={copyEmails}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <IconCheck className="size-4 text-success" /> : <IconCopy className="size-4" />}
              {copied ? "Copied!" : "Copy All Emails"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => exportEmails("text")}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <IconDownload className="size-3.5" />
                Export TXT
              </button>
              <button
                onClick={() => exportEmails("html")}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <IconDownload className="size-3.5" />
                Export HTML
              </button>
            </div>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Sequence Stats */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <span className="text-xs text-gray-400">
              Emails: <span className="text-gray-900 dark:text-white font-semibold">{emails.length}</span>
            </span>
            <span className="text-xs text-gray-400">
              Duration: <span className="text-gray-900 dark:text-white font-semibold">{emails.length > 0 ? emails[emails.length - 1].day : 0} days</span>
            </span>
            <span className="text-xs text-gray-400">
              Type: <span className="text-gray-900 dark:text-white font-semibold capitalize">{sequenceType}</span>
            </span>
            <button
              onClick={addEmail}
              className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <IconPlus className="size-3" />
              Add Email
            </button>
          </div>

          {/* Timeline & Emails */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-4">
              {emails.map((email, idx) => {
                const isExpanded = expandedEmail === email.id;
                const openRate = getOpenRate(idx);
                const clickRate = getClickRate(idx);

                return (
                  <div key={email.id} className="relative pl-12">
                    {/* Timeline node */}
                    <div className="absolute left-3 top-4 size-5 rounded-full bg-primary-500 border-2 border-white dark:border-gray-950 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-gray-950">{idx + 1}</span>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                      {/* Email Header */}
                      <button
                        onClick={() => setExpandedEmail(isExpanded ? null : email.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-primary-500">Day {email.day}</span>
                            {email.delay > 0 && idx > 0 && (
                              <span className="text-[10px] text-gray-400">+{email.delay}d delay</span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {email.subject || `Email ${idx + 1} — (No subject)`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-2 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400">Open</p>
                            <p className="text-xs font-semibold text-success">{openRate}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400">Click</p>
                            <p className="text-xs font-semibold text-secondary-500">{clickRate.toFixed(1)}%</p>
                          </div>
                          <span className="text-gray-400 text-xs">{isExpanded ? "▼" : "▶"}</span>
                        </div>
                      </button>

                      {/* Email Editor */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Day</label>
                              <input
                                type="number"
                                min={0}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                value={email.day}
                                onChange={(e) => updateEmail(email.id, "day", Number(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Delay (days)</label>
                              <input
                                type="number"
                                min={0}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                value={email.delay}
                                onChange={(e) => updateEmail(email.id, "delay", Number(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Subject Line</label>
                            <input
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                              placeholder="Email subject…"
                              value={email.subject}
                              onChange={(e) => updateEmail(email.id, "subject", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Preview Text</label>
                            <input
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                              placeholder="Preview text shown in inbox…"
                              value={email.previewText}
                              onChange={(e) => updateEmail(email.id, "previewText", e.target.value)}
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs text-gray-400">Body</label>
                              <div className="flex gap-1">
                                {MERGE_FIELDS.map((f) => (
                                  <button
                                    key={f}
                                    onClick={() => insertMergeField(email.id, f)}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 transition-colors"
                                  >
                                    {f}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <textarea
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                              rows={5}
                              placeholder="Email body…"
                              value={email.body}
                              onChange={(e) => updateEmail(email.id, "body", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Call to Action</label>
                            <input
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                              placeholder="Shop Now, Learn More, etc."
                              value={email.cta}
                              onChange={(e) => updateEmail(email.id, "cta", e.target.value)}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => rewriteEmail(email.id)}
                              disabled={loading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-medium hover:bg-primary-500/20 disabled:opacity-50 transition-colors"
                            >
                              {loadingAction === `rewrite-${email.id}` ? (
                                <IconLoader className="size-3 animate-spin" />
                              ) : (
                                <IconWand className="size-3" />
                              )}
                              AI Rewrite Email
                            </button>
                            <button
                              onClick={() => removeEmail(email.id)}
                              disabled={emails.length <= 1}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-error disabled:opacity-30 transition-colors"
                            >
                              <IconTrash className="size-3" />
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Empty State */}
          {emails.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconMail className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Build Your Email Sequence</h3>
              <p className="text-sm text-gray-400 max-w-md">
                Choose a sequence type and set the number of emails, then use AI to generate your full sequence or build each email manually.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
