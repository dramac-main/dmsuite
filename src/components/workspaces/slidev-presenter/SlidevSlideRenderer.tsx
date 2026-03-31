"use client";

// =============================================================================
// DMSuite — Slidev Slide Renderer
// Converts markdown → HTML with code highlighting, KaTeX, Mermaid, 17 layouts.
// Dynamically imports heavy libraries (highlight.js, katex, mermaid).
// =============================================================================

import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import type { SlidevSlide } from "@/lib/slidev/parser";
import type { SlidevTheme } from "@/lib/slidev/themes";

// ── Types ───────────────────────────────────────────────────────────────────

interface SlidevSlideRendererProps {
  slide: SlidevSlide;
  theme: SlidevTheme;
  scale?: number;
  clickStep?: number;
  isThumbnail?: boolean;
  className?: string;
  aspectRatio?: "16:9" | "4:3" | "16:10";
}

type HljsLike = {
  highlight: (
    code: string,
    opts: { language: string },
  ) => { value: string };
  getLanguage: (lang: string) => unknown;
};

// ── Lazy lib state ──────────────────────────────────────────────────────────

let _hljs: HljsLike | null = null;
let _hljsLoading = false;
const _hljsCallbacks: ((h: HljsLike) => void)[] = [];

function loadHljs(): Promise<HljsLike> {
  if (_hljs) return Promise.resolve(_hljs);
  return new Promise((resolve) => {
    _hljsCallbacks.push(resolve);
    if (_hljsLoading) return;
    _hljsLoading = true;
    import("highlight.js").then((mod) => {
      _hljs = mod.default as unknown as HljsLike;
      _hljsCallbacks.forEach((cb) => cb(_hljs!));
      _hljsCallbacks.length = 0;
    });
  });
}

// ── Markdown → HTML (lightweight, no deps for thumbnails) ───────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Simple markdown → HTML suitable for thumbnails and fast previews. */
function basicMarkdownToHtml(md: string): string {
  let html = md;

  // Fenced code blocks (```lang ... ```)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_m, lang: string, code: string) => {
      const cls = lang ? ` class="language-${lang}"` : "";
      return `<pre class="code-block"><code${cls}>${escapeHtml(code.trimEnd())}</code></pre>`;
    },
  );

  // Block math ($$...$$)
  html = html.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (_m, tex: string) =>
      `<div class="katex-block" data-tex="${encodeURIComponent(tex.trim())}">${escapeHtml(tex.trim())}</div>`,
  );

  // Inline math ($...$) — careful not to match $$
  html = html.replace(
    /(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g,
    (_m, tex: string) =>
      `<span class="katex-inline" data-tex="${encodeURIComponent(tex.trim())}">${escapeHtml(tex.trim())}</span>`,
  );

  // Headings
  html = html.replace(
    /^######\s+(.+)$/gm,
    '<h6 class="slide-h6">$1</h6>',
  );
  html = html.replace(
    /^#####\s+(.+)$/gm,
    '<h5 class="slide-h5">$1</h5>',
  );
  html = html.replace(
    /^####\s+(.+)$/gm,
    '<h4 class="slide-h4">$1</h4>',
  );
  html = html.replace(
    /^###\s+(.+)$/gm,
    '<h3 class="slide-h3">$1</h3>',
  );
  html = html.replace(
    /^##\s+(.+)$/gm,
    '<h2 class="slide-h2">$1</h2>',
  );
  html = html.replace(
    /^#\s+(.+)$/gm,
    '<h1 class="slide-h1">$1</h1>',
  );

  // Bold, italic, inline code, strikethrough
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="slide-img" />',
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" class="slide-link">$1</a>',
  );

  // Blockquotes (multi-line)
  html = html.replace(
    /(?:^>\s?(.*)$\n?)+/gm,
    (match) => {
      const lines = match
        .split("\n")
        .map((l) => l.replace(/^>\s?/, "").trim())
        .filter(Boolean);
      return `<blockquote class="slide-quote">${lines.map((l) => `<p>${l}</p>`).join("")}</blockquote>`;
    },
  );

  // Unordered lists
  html = html.replace(
    /(?:^[-*]\s+.+$\n?)+/gm,
    (match) => {
      const items = match
        .trim()
        .split("\n")
        .map((l) => l.replace(/^[-*]\s+/, "").trim());
      return `<ul class="slide-ul">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
    },
  );

  // Ordered lists
  html = html.replace(
    /(?:^\d+\.\s+.+$\n?)+/gm,
    (match) => {
      const items = match
        .trim()
        .split("\n")
        .map((l) => l.replace(/^\d+\.\s+/, "").trim());
      return `<ol class="slide-ol">${items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
    },
  );

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr class="slide-hr" />');

  // v-click markers → wrapped divs
  html = html.replace(
    /<!--\s*v-click\s*-->/g,
    '</div><div class="v-click-item">',
  );

  // Paragraphs (remaining lines)
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<div") ||
        trimmed.startsWith("</div") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("<img")
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

/** Enhanced markdown → HTML with highlight.js for code blocks. */
function enhancedMarkdownToHtml(md: string, hljs: HljsLike): string {
  let html = md;

  // Fenced code blocks with highlighting
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_m, lang: string, code: string) => {
      if (lang === "mermaid") {
        return `<div class="mermaid-block" data-mermaid="${encodeURIComponent(code.trim())}">[Mermaid Diagram]</div>`;
      }
      const language =
        lang && hljs.getLanguage(lang) ? lang : "plaintext";
      const highlighted = hljs.highlight(code.trimEnd(), { language }).value;
      return `<pre class="code-block"><code class="hljs language-${language}">${highlighted}</code></pre>`;
    },
  );

  // Block math
  html = html.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (_m, tex: string) =>
      `<div class="katex-block" data-tex="${encodeURIComponent(tex.trim())}">${escapeHtml(tex.trim())}</div>`,
  );

  // Inline math
  html = html.replace(
    /(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g,
    (_m, tex: string) =>
      `<span class="katex-inline" data-tex="${encodeURIComponent(tex.trim())}">${escapeHtml(tex.trim())}</span>`,
  );

  // Headings
  html = html.replace(
    /^######\s+(.+)$/gm,
    '<h6 class="slide-h6">$1</h6>',
  );
  html = html.replace(
    /^#####\s+(.+)$/gm,
    '<h5 class="slide-h5">$1</h5>',
  );
  html = html.replace(
    /^####\s+(.+)$/gm,
    '<h4 class="slide-h4">$1</h4>',
  );
  html = html.replace(
    /^###\s+(.+)$/gm,
    '<h3 class="slide-h3">$1</h3>',
  );
  html = html.replace(
    /^##\s+(.+)$/gm,
    '<h2 class="slide-h2">$1</h2>',
  );
  html = html.replace(
    /^#\s+(.+)$/gm,
    '<h1 class="slide-h1">$1</h1>',
  );

  // Bold, italic, inline code, strikethrough
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="slide-img" />',
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" class="slide-link">$1</a>',
  );

  // Blockquotes
  html = html.replace(
    /(?:^>\s?(.*)$\n?)+/gm,
    (match) => {
      const lines = match
        .split("\n")
        .map((l) => l.replace(/^>\s?/, "").trim())
        .filter(Boolean);
      return `<blockquote class="slide-quote">${lines.map((l) => `<p>${l}</p>`).join("")}</blockquote>`;
    },
  );

  // Unordered lists
  html = html.replace(
    /(?:^[-*]\s+.+$\n?)+/gm,
    (match) => {
      const items = match
        .trim()
        .split("\n")
        .map((l) => l.replace(/^[-*]\s+/, "").trim());
      return `<ul class="slide-ul">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
    },
  );

  // Ordered lists
  html = html.replace(
    /(?:^\d+\.\s+.+$\n?)+/gm,
    (match) => {
      const items = match
        .trim()
        .split("\n")
        .map((l) => l.replace(/^\d+\.\s+/, "").trim());
      return `<ol class="slide-ol">${items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
    },
  );

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr class="slide-hr" />');

  // v-click markers
  html = html.replace(
    /<!--\s*v-click\s*-->/g,
    '</div><div class="v-click-item">',
  );

  // Paragraphs
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<div") ||
        trimmed.startsWith("</div") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("<img")
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

// ── Two-col split helper ────────────────────────────────────────────────────

function splitTwoCols(content: string): { left: string; right: string } {
  const parts = content.split(/::right::/i);
  return {
    left: parts[0]?.trim() || "",
    right: parts[1]?.trim() || "",
  };
}

// ── Aspect ratio dimensions ─────────────────────────────────────────────────

function getSlideSize(ratio: "16:9" | "4:3" | "16:10") {
  switch (ratio) {
    case "4:3":
      return { w: 960, h: 720 };
    case "16:10":
      return { w: 960, h: 600 };
    default:
      return { w: 960, h: 540 };
  }
}

// ── Layout CSS classes ──────────────────────────────────────────────────────

function getLayoutStyle(
  layout: string,
  theme: SlidevTheme,
): React.CSSProperties {
  const base: React.CSSProperties = {
    width: "100%",
    height: "100%",
    padding: "3rem 4rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    fontFamily: theme.bodyFont,
    color: theme.textPrimary,
    background: theme.bg,
    overflow: "hidden",
    position: "relative",
  };

  switch (layout) {
    case "center":
    case "statement":
    case "fact":
      return {
        ...base,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      };
    case "cover":
    case "intro":
      return {
        ...base,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.bgSecondary} 100%)`,
      };
    case "end":
      return {
        ...base,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        background: theme.bgSecondary,
      };
    case "section":
      return {
        ...base,
        justifyContent: "center",
        padding: "3rem 5rem",
      };
    case "quote":
      return {
        ...base,
        justifyContent: "center",
        alignItems: "center",
        padding: "3rem 6rem",
      };
    case "two-cols":
      return {
        ...base,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "2rem",
      };
    case "two-cols-header":
      return {
        ...base,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "auto 1fr",
        gap: "1.5rem",
      };
    case "image":
      return {
        ...base,
        padding: 0,
        justifyContent: "flex-end",
        alignItems: "flex-start",
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    case "image-left":
      return {
        ...base,
        display: "grid",
        gridTemplateColumns: "45% 1fr",
        padding: 0,
        gap: 0,
      };
    case "image-right":
      return {
        ...base,
        display: "grid",
        gridTemplateColumns: "1fr 45%",
        padding: 0,
        gap: 0,
      };
    case "full":
      return { ...base, padding: 0 };
    case "iframe":
      return { ...base, padding: 0 };
    case "none":
      return {
        width: "100%",
        height: "100%",
        background: theme.bg,
        color: theme.textPrimary,
        fontFamily: theme.bodyFont,
        overflow: "hidden",
        position: "relative",
      };
    default:
      return base;
  }
}

// ── Slide CSS for rich content ──────────────────────────────────────────────

function getSlideCSS(theme: SlidevTheme): string {
  return `
    .slide-h1 { font-size: 2.5em; font-weight: 700; line-height: 1.2; margin: 0.3em 0; font-family: ${theme.headingFont}; color: ${theme.textPrimary}; }
    .slide-h2 { font-size: 1.8em; font-weight: 600; line-height: 1.25; margin: 0.3em 0; font-family: ${theme.headingFont}; color: ${theme.textPrimary}; }
    .slide-h3 { font-size: 1.4em; font-weight: 600; line-height: 1.3; margin: 0.25em 0; font-family: ${theme.headingFont}; color: ${theme.textPrimary}; }
    .slide-h4 { font-size: 1.15em; font-weight: 600; margin: 0.2em 0; font-family: ${theme.headingFont}; }
    .slide-h5 { font-size: 1em; font-weight: 600; margin: 0.2em 0; font-family: ${theme.headingFont}; }
    .slide-h6 { font-size: 0.9em; font-weight: 600; margin: 0.2em 0; font-family: ${theme.headingFont}; }

    p { margin: 0.4em 0; line-height: 1.65; color: ${theme.textSecondary}; }
    strong { color: ${theme.textPrimary}; font-weight: 600; }
    em { font-style: italic; }
    del { text-decoration: line-through; opacity: 0.6; }

    .slide-ul, .slide-ol { margin: 0.5em 0; padding-left: 1.5em; }
    .slide-ul li, .slide-ol li { margin: 0.25em 0; line-height: 1.6; color: ${theme.textSecondary}; }
    .slide-ul li::marker { color: ${theme.accent}; }
    .slide-ol li::marker { color: ${theme.accent}; font-weight: 600; }

    .slide-quote { border-left: 4px solid ${theme.accent}; padding: 0.8em 1.5em; margin: 0.8em 0; background: ${theme.accentSoft}; border-radius: 0 8px 8px 0; }
    .slide-quote p { font-size: 1.3em; font-style: italic; color: ${theme.textPrimary}; margin: 0.3em 0; }

    .code-block { background: ${theme.bgCode}; border-radius: 8px; padding: 1em 1.2em; margin: 0.6em 0; overflow-x: auto; font-size: 0.85em; line-height: 1.6; }
    .code-block code { font-family: ${theme.monoFont}; color: ${theme.textCode}; }
    .inline-code { background: ${theme.bgCode}; padding: 0.15em 0.4em; border-radius: 4px; font-family: ${theme.monoFont}; font-size: 0.88em; color: ${theme.accent}; }

    .slide-link { color: ${theme.accent}; text-decoration: underline; text-underline-offset: 2px; }
    .slide-img { max-width: 100%; max-height: 60%; border-radius: 8px; object-fit: contain; }

    .katex-block { margin: 0.8em 0; text-align: center; font-size: 1.3em; }
    .katex-inline { }

    .mermaid-block { margin: 0.8em auto; text-align: center; min-height: 80px; display: flex; align-items: center; justify-content: center; background: ${theme.bgSecondary}; border-radius: 8px; padding: 1em; }

    .slide-hr { border: none; border-top: 1px solid ${theme.accentSoft}; margin: 1em 0; }

    .v-click-item { transition: opacity 0.3s ease, transform 0.3s ease; }
    .v-click-hidden { opacity: 0; transform: translateY(8px); pointer-events: none; }
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function SlidevSlideRenderer({
  slide,
  theme,
  scale = 1,
  clickStep = 999,
  isThumbnail = false,
  className = "",
  aspectRatio = "16:9",
}: SlidevSlideRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hljs, setHljs] = useState<HljsLike | null>(_hljs);
  const size = getSlideSize(aspectRatio);

  // Load highlight.js (once, shared across instances)
  useEffect(() => {
    if (!isThumbnail && !_hljs) {
      loadHljs().then(setHljs);
    }
  }, [isThumbnail]);

  // Process two-cols split
  const isTwoCol =
    slide.layout === "two-cols" || slide.layout === "two-cols-header";
  const twoCols = isTwoCol ? splitTwoCols(slide.content) : null;

  // Render markdown → HTML
  const renderMd = useCallback(
    (md: string) => {
      return hljs && !isThumbnail
        ? enhancedMarkdownToHtml(md, hljs)
        : basicMarkdownToHtml(md);
    },
    [hljs, isThumbnail],
  );

  const contentHtml = useMemo(() => {
    if (isTwoCol && twoCols) return null; // rendered separately
    return renderMd(slide.content);
  }, [slide.content, isTwoCol, twoCols, renderMd]);

  const leftHtml = useMemo(
    () => (twoCols ? renderMd(twoCols.left) : ""),
    [twoCols, renderMd],
  );
  const rightHtml = useMemo(
    () => (twoCols ? renderMd(twoCols.right) : ""),
    [twoCols, renderMd],
  );

  // Post-process: KaTeX rendering
  useEffect(() => {
    if (isThumbnail || !containerRef.current) return;
    const container = containerRef.current;

    // KaTeX
    const katexEls = container.querySelectorAll(
      ".katex-block, .katex-inline",
    );
    if (katexEls.length > 0) {
      import("katex").then((katexMod) => {
        const katex = katexMod.default;
        katexEls.forEach((el) => {
          const tex = decodeURIComponent(
            (el as HTMLElement).dataset.tex || "",
          );
          if (!tex) return;
          try {
            el.innerHTML = katex.renderToString(tex, {
              throwOnError: false,
              displayMode: el.classList.contains("katex-block"),
            });
          } catch {
            // Keep fallback text
          }
        });
      });
    }

    // Mermaid
    const mermaidEls = container.querySelectorAll(".mermaid-block");
    if (mermaidEls.length > 0) {
      import("mermaid").then((mermaidMod) => {
        const mermaid = mermaidMod.default;
        mermaid.initialize({
          startOnLoad: false,
          theme: theme.isDark ? "dark" : "default",
          fontFamily: theme.bodyFont,
        });
        mermaidEls.forEach(async (el, idx) => {
          const code = decodeURIComponent(
            (el as HTMLElement).dataset.mermaid || "",
          );
          if (!code) return;
          try {
            const id = `mermaid-${slide.id}-${idx}`;
            const { svg } = await mermaid.render(id, code);
            el.innerHTML = svg;
          } catch {
            el.textContent = "[Diagram error]";
          }
        });
      });
    }
  }, [contentHtml, leftHtml, rightHtml, isThumbnail, theme, slide.id]);

  // v-click visibility
  useEffect(() => {
    if (isThumbnail || !containerRef.current) return;
    const items = containerRef.current.querySelectorAll(".v-click-item");
    items.forEach((el, i) => {
      if (i < clickStep) {
        el.classList.remove("v-click-hidden");
      } else {
        el.classList.add("v-click-hidden");
      }
    });
  }, [clickStep, contentHtml, isThumbnail]);

  // Background
  const bgImage = slide.frontmatter.background || slide.frontmatter.image;
  const bgStyle: React.CSSProperties = bgImage
    ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  const layoutStyle = getLayoutStyle(slide.layout, theme);

  return (
    <div
      className={`slidev-slide-wrapper ${className}`}
      style={{
        width: size.w,
        height: size.h,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        overflow: "hidden",
        borderRadius: isThumbnail ? 4 : 0,
        flexShrink: 0,
      }}
    >
      <style>{getSlideCSS(theme)}</style>
      <div
        ref={containerRef}
        className="slidev-slide-content"
        style={{ ...layoutStyle, ...bgStyle }}
      >
        {/* Two-column layouts */}
        {isTwoCol && twoCols ? (
          <>
            {slide.layout === "two-cols-header" && (
              <div
                style={{ gridColumn: "1 / -1" }}
                dangerouslySetInnerHTML={{
                  __html: renderMd(
                    twoCols.left
                      .split("\n")
                      .find((l) => l.startsWith("#")) || "",
                  ),
                }}
              />
            )}
            <div dangerouslySetInnerHTML={{ __html: leftHtml }} />
            <div dangerouslySetInnerHTML={{ __html: rightHtml }} />
          </>
        ) : slide.layout === "iframe" && slide.frontmatter.url ? (
          <iframe
            src={slide.frontmatter.url as string}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            sandbox="allow-scripts allow-same-origin"
            title="Embedded content"
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: contentHtml || "" }} />
        )}

        {/* Accent decorative line */}
        {(slide.layout === "cover" || slide.layout === "intro") && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: theme.accent,
            }}
          />
        )}
      </div>
    </div>
  );
}
