"use client";

import { useState, useCallback } from "react";
import {
  IconHash,
  IconSparkles,
  IconWand,
  IconLoader,
  IconCopy,
  IconCheck,
  IconTrash,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type Platform = "facebook" | "instagram" | "twitter" | "linkedin" | "tiktok" | "whatsapp";
type Tone = "fun" | "professional" | "urgent" | "inspirational" | "educational" | "provocative";
type EmojiDensity = "none" | "subtle" | "moderate" | "heavy";
type CTA = "learn-more" | "shop-now" | "sign-up" | "contact-us" | "book-now" | "visit";

interface GeneratedPost {
  id: string;
  platform: Platform;
  content: string;
  hashtags: string[];
  createdAt: string;
}

const PLATFORMS: { id: Platform; label: string; maxChars: number; color: string }[] = [
  { id: "facebook", label: "Facebook", maxChars: 63206, color: "bg-blue-600" },
  { id: "instagram", label: "Instagram", maxChars: 2200, color: "bg-pink-600" },
  { id: "twitter", label: "Twitter/X", maxChars: 280, color: "bg-gray-800" },
  { id: "linkedin", label: "LinkedIn", maxChars: 3000, color: "bg-blue-700" },
  { id: "tiktok", label: "TikTok", maxChars: 2200, color: "bg-gray-900" },
  { id: "whatsapp", label: "WhatsApp", maxChars: 65536, color: "bg-green-600" },
];

const TONES: { id: Tone; label: string }[] = [
  { id: "fun", label: "Fun" },
  { id: "professional", label: "Professional" },
  { id: "urgent", label: "Urgent" },
  { id: "inspirational", label: "Inspirational" },
  { id: "educational", label: "Educational" },
  { id: "provocative", label: "Provocative" },
];

const CTAS: { id: CTA; label: string }[] = [
  { id: "learn-more", label: "Learn More" },
  { id: "shop-now", label: "Shop Now" },
  { id: "sign-up", label: "Sign Up" },
  { id: "contact-us", label: "Contact Us" },
  { id: "book-now", label: "Book Now" },
  { id: "visit", label: "Visit" },
];

const EMOJI_OPTIONS: { id: EmojiDensity; label: string }[] = [
  { id: "none", label: "None" },
  { id: "subtle", label: "Subtle" },
  { id: "moderate", label: "Moderate" },
  { id: "heavy", label: "Heavy" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Component ─────────────────────────────────────────────── */

export default function SocialCopyWorkspace() {
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tone, setTone] = useState<Tone>("fun");
  const [emojiDensity, setEmojiDensity] = useState<EmojiDensity>("subtle");
  const [cta, setCta] = useState<CTA>("learn-more");
  const [prompt, setPrompt] = useState("");
  const [carouselMode, setCarouselMode] = useState(false);
  const [carouselCount, setCarouselCount] = useState(3);

  const [currentContent, setCurrentContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [postHistory, setPostHistory] = useState<GeneratedPost[]>([]);

  const currentPlatform = PLATFORMS.find((p) => p.id === platform)!;
  const charCount = currentContent.length;
  const overLimit = charCount > currentPlatform.maxChars;

  /* ── AI: Generate Post ──────────────────────────────────── */
  const generatePost = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const carouselInstruction = carouselMode
        ? `Generate a ${carouselCount}-part carousel/thread. Separate each post with "---".`
        : "Generate a single post.";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Write social media copy for ${currentPlatform.label}. Topic: "${prompt}". Tone: ${tone}. Emoji density: ${emojiDensity}. CTA: "${CTAS.find((c) => c.id === cta)?.label}". Character limit: ${currentPlatform.maxChars}. ${carouselInstruction} Return JSON: { "content": "post text", "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"] }. Make hashtags relevant and trending. Do not include # prefix in hashtag array values.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.content) setCurrentContent(data.content);
        if (data.hashtags) setHashtags(data.hashtags.map((h: string) => h.replace(/^#/, "")));
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [prompt, platform, tone, emojiDensity, cta, carouselMode, carouselCount, currentPlatform]);

  /* ── AI: Suggest Hashtags ───────────────────────────────── */
  const suggestHashtags = async () => {
    if (!prompt.trim() && !currentContent.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Suggest 10 trending and relevant hashtags for ${currentPlatform.label} about: "${prompt || currentContent}". Return JSON: { "hashtags": ["tag1", "tag2"] }. Do not include # prefix.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.hashtags) setHashtags(data.hashtags.map((h: string) => h.replace(/^#/, "")));
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  /* ── Save to history ────────────────────────────────────── */
  const saveToHistory = () => {
    if (!currentContent.trim()) return;
    const post: GeneratedPost = {
      id: uid(),
      platform,
      content: currentContent + (hashtags.length ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : ""),
      hashtags,
      createdAt: new Date().toISOString(),
    };
    setPostHistory((prev) => [post, ...prev]);
  };

  /* ── Copy ───────────────────────────────────────────────── */
  const copyPost = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
          {/* Platform */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconHash className="size-4 text-primary-500" />
              Platform
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${platform === p.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">
              Character limit: <span className="font-semibold text-gray-600 dark:text-gray-300">{currentPlatform.maxChars.toLocaleString()}</span>
            </p>
          </div>

          {/* Prompt */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Topic / Prompt</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              rows={3}
              placeholder="What do you want to post about?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Tone */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Tone</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${tone === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji & CTA */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Emoji Density</label>
            <div className="grid grid-cols-4 gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEmojiDensity(e.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${emojiDensity === e.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {e.label}
                </button>
              ))}
            </div>

            <label className="block text-xs text-gray-400 mt-2">Call to Action</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CTAS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCta(c.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${cta === c.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Carousel / Thread */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Carousel / Thread Mode</label>
              <button
                onClick={() => setCarouselMode((p) => !p)}
                className={`relative w-10 h-5 rounded-full transition-colors ${carouselMode ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform ${carouselMode ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
            {carouselMode && (
              <>
                <label className="block text-xs text-gray-400">
                  Number of posts: <span className="font-semibold text-gray-900 dark:text-white">{carouselCount}</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={carouselCount}
                  onChange={(e) => setCarouselCount(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
              </>
            )}
          </div>

          {/* Generate */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <button
              onClick={generatePost}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconSparkles className="size-4" />}
              {loading ? "Generating…" : "Generate Copy"}
            </button>
            <button
              onClick={suggestHashtags}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <IconWand className="size-4" />
              Suggest Hashtags
            </button>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Editor */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{currentPlatform.label} Post</h3>
              <span className={`text-xs font-mono ${overLimit ? "text-red-500 font-bold" : "text-gray-400"}`}>
                {charCount} / {currentPlatform.maxChars.toLocaleString()}
              </span>
            </div>
            <textarea
              className="w-full min-h-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder={`Write your ${currentPlatform.label} post…`}
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
            />
            {overLimit && (
              <p className="text-xs text-red-500">⚠ Content exceeds the {currentPlatform.maxChars.toLocaleString()} character limit for {currentPlatform.label}.</p>
            )}
          </div>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Hashtags</h3>
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-500 text-xs cursor-pointer hover:bg-primary-500/20 transition-colors"
                    onClick={() => {
                      setCurrentContent((prev) => prev + (prev ? " " : "") + `#${h}`);
                    }}
                  >
                    #{h}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-gray-400">Click a hashtag to add it to your post.</p>
            </div>
          )}

          {/* Actions */}
          {currentContent && (
            <div className="flex gap-2">
              <button
                onClick={() => copyPost(currentContent + (hashtags.length ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : ""), "current")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {copiedId === "current" ? <IconCheck className="size-4 text-success" /> : <IconCopy className="size-4" />}
                {copiedId === "current" ? "Copied!" : "Copy Post"}
              </button>
              <button
                onClick={saveToHistory}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Save to History
              </button>
            </div>
          )}

          {/* Post History */}
          {postHistory.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Post History</h3>
              {postHistory.map((post) => (
                <div key={post.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-500 uppercase">{post.platform}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                      <button
                        onClick={() => copyPost(post.content, post.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {copiedId === post.id ? <IconCheck className="size-3.5 text-success" /> : <IconCopy className="size-3.5" />}
                      </button>
                      <button
                        onClick={() => setPostHistory((prev) => prev.filter((p) => p.id !== post.id))}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <IconTrash className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!currentContent && postHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconHash className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Create Social Copy</h3>
              <p className="text-sm text-gray-400 max-w-md">
                Select a platform, enter your topic, and let AI generate engaging social media copy with hashtags tailored to your audience.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
