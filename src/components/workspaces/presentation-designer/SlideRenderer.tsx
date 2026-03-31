"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * DMSuite — Presentation Designer: Slide Renderer
 *
 * Renders a single slide as styled HTML/CSS — used both for the main
 * preview and for the thumbnail strip. Inline-editable in the main view.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { type CSSProperties, useCallback, useRef, useEffect } from "react";
import type { Slide, PresentationTheme, AspectRatio } from "./types";

// ── Decorative Elements ─────────────────────────────────────────────────

function DecorShapes({ theme, layout }: { theme: PresentationTheme; layout: string }) {
  if (theme.decorShape === "none") return null;
  const c = theme.accent;
  const o = "0.08";

  if (theme.decorShape === "circles") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-[8%] -top-[15%] rounded-full"
          style={{ width: "35%", height: "55%", background: c, opacity: o }}
        />
        {layout === "title" && (
          <div
            className="absolute -bottom-[10%] -left-[6%] rounded-full"
            style={{ width: "25%", height: "40%", background: c, opacity: o }}
          />
        )}
      </div>
    );
  }

  if (theme.decorShape === "lines") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-1.5"
          style={{ width: "100%", background: c, opacity: "0.7" }}
        />
        <div
          className="absolute bottom-[8%] right-[6%] h-px"
          style={{ width: "35%", background: c, opacity: "0.25" }}
        />
      </div>
    );
  }

  if (theme.decorShape === "dots") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute right-[4%] top-[8%]" style={{ opacity: o }} width="80" height="80">
          {[0, 1, 2, 3, 4].map((r) =>
            [0, 1, 2, 3, 4].map((col) => (
              <circle key={`${r}-${col}`} cx={8 + col * 16} cy={8 + r * 16} r="2.5" fill={c} />
            )),
          )}
        </svg>
      </div>
    );
  }

  if (theme.decorShape === "waves") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute bottom-0 left-0 w-full" style={{ opacity: o }} viewBox="0 0 960 80" preserveAspectRatio="none">
          <path d="M0 60 Q240 20 480 60 T960 60 V80 H0Z" fill={c} />
        </svg>
      </div>
    );
  }

  return null;
}

// ── Accent bar (left border) for content slides ─────────────────────────

function AccentBar({ theme }: { theme: PresentationTheme }) {
  return (
    <div
      className="absolute left-0 top-[12%] h-[76%] w-1 rounded-r"
      style={{ background: theme.accent, opacity: 0.6 }}
    />
  );
}

// ── Editable text helper ────────────────────────────────────────────────

interface EditableProps {
  value: string;
  onCommit: (val: string) => void;
  editable: boolean;
  style?: CSSProperties;
  className?: string;
  tag?: "h1" | "h2" | "h3" | "p" | "span" | "blockquote";
  placeholder?: string;
}

function EditableText({
  value,
  onCommit,
  editable,
  style,
  className = "",
  tag: Tag = "p",
  placeholder,
}: EditableProps) {
  const ref = useRef<HTMLElement>(null);
  const committedRef = useRef(value);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
    committedRef.current = value;
  }, [value]);

  const handleBlur = useCallback(() => {
    const text = ref.current?.textContent ?? "";
    if (text !== committedRef.current) {
      onCommit(text);
      committedRef.current = text;
    }
  }, [onCommit]);

  return (
    <Tag
      ref={ref as never}
      contentEditable={editable}
      suppressContentEditableWarning
      onBlur={handleBlur}
      data-placeholder={placeholder}
      className={`outline-none focus:ring-1 focus:ring-white/20 focus:rounded ${
        !value && placeholder ? "empty:before:content-[attr(data-placeholder)] empty:before:opacity-30" : ""
      } ${className}`}
      style={{ ...style, wordBreak: "break-word" }}
    />
  );
}

// ── Layout Renderers ────────────────────────────────────────────────────

interface LayoutProps {
  slide: Slide;
  theme: PresentationTheme;
  editable: boolean;
  onUpdate: (patch: Partial<Slide>) => void;
}

function TitleLayout({ slide, theme, editable, onUpdate }: LayoutProps) {
  const useGradient = true;
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-[12%] text-center"
      style={{ background: useGradient ? theme.bgGradient : theme.bgPrimary }}
    >
      <DecorShapes theme={theme} layout="title" />
      <EditableText
        tag="h1"
        value={slide.title}
        onCommit={(v) => onUpdate({ title: v })}
        editable={editable}
        placeholder="Presentation Title"
        style={{
          color: theme.textOnAccent,
          fontFamily: theme.headingFont,
          fontSize: "clamp(1.6rem, 4.5vw, 2.8rem)",
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      />
      {(slide.subtitle || editable) && (
        <EditableText
          tag="h2"
          value={slide.subtitle}
          onCommit={(v) => onUpdate({ subtitle: v })}
          editable={editable}
          placeholder="Subtitle"
          className="mt-4"
          style={{
            color: theme.textOnAccent,
            opacity: 0.75,
            fontFamily: theme.bodyFont,
            fontSize: "clamp(0.8rem, 2vw, 1.15rem)",
            fontWeight: 400,
          }}
        />
      )}
    </div>
  );
}

function SectionLayout({ slide, theme, editable, onUpdate }: LayoutProps) {
  return (
    <div
      className="flex h-full flex-col items-start justify-center px-[10%]"
      style={{ background: theme.bgGradient }}
    >
      <DecorShapes theme={theme} layout="section" />
      {(slide.sectionNumber || editable) && (
        <EditableText
          tag="span"
          value={slide.sectionNumber}
          onCommit={(v) => onUpdate({ sectionNumber: v })}
          editable={editable}
          placeholder="01"
          style={{
            color: theme.accent,
            fontFamily: theme.headingFont,
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            fontWeight: 800,
            opacity: 0.35,
            lineHeight: 1,
          }}
        />
      )}
      <EditableText
        tag="h1"
        value={slide.title}
        onCommit={(v) => onUpdate({ title: v })}
        editable={editable}
        placeholder="Section Title"
        className="mt-2"
        style={{
          color: theme.textOnAccent,
          fontFamily: theme.headingFont,
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      />
    </div>
  );
}

function ContentLayout({ slide, theme, editable, onUpdate }: LayoutProps) {
  return (
    <div className="relative flex h-full flex-col px-[8%] py-[7%]" style={{ background: theme.bgSecondary }}>
      <AccentBar theme={theme} />
      <DecorShapes theme={theme} layout="content" />
      <EditableText
        tag="h2"
        value={slide.title}
        onCommit={(v) => onUpdate({ title: v })}
        editable={editable}
        placeholder="Slide Title"
        style={{
          color: theme.textPrimary,
          fontFamily: theme.headingFont,
          fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      />
      <div className="mt-auto" />
      <EditableText
        tag="p"
        value={slide.body}
        onCommit={(v) => onUpdate({ body: v })}
        editable={editable}
        placeholder="Enter your content here..."
        className="mt-4 flex-1"
        style={{
          color: theme.textSecondary,
          fontFamily: theme.bodyFont,
          fontSize: "clamp(0.7rem, 1.6vw, 1rem)",
          lineHeight: 1.7,
        }}
      />
    </div>
  );
}

function BulletsLayout({ slide, theme, editable, onUpdate }: LayoutProps) {
  const bullets = slide.bullets.length > 0 ? slide.bullets : (editable ? [""] : []);

  const handleBulletCommit = (idx: number, val: string) => {
    const next = [...slide.bullets];
    // Remove empty trailing bullets
    if (!val && idx === next.length - 1 && idx > 0) {
      next.splice(idx, 1);
    } else {
      next[idx] = val;
    }
    onUpdate({ bullets: next });
  };

  const addBullet = () => {
    onUpdate({ bullets: [...slide.bullets, ""] });
  };

  return (
    <div className="relative flex h-full flex-col px-[8%] py-[7%]" style={{ background: theme.bgSecondary }}>
      <AccentBar theme={theme} />
      <DecorShapes theme={theme} layout="bullets" />
      <EditableText
        tag="h2"
        value={slide.title}
        onCommit={(v) => onUpdate({ title: v })}
        editable={editable}
        placeholder="Slide Title"
        style={{
          color: theme.textPrimary,
          fontFamily: theme.headingFont,
          fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
          fontWeight: 700,
        }}
      />
      <ul className="mt-5 flex-1 space-y-2.5 pl-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="mt-[0.45em] h-2 w-2 shrink-0 rounded-full"
              style={{ background: theme.accent }}
            />
            <EditableText
              value={b}
              onCommit={(v) => handleBulletCommit(i, v)}
              editable={editable}
              placeholder={`Point ${i + 1}`}
              style={{
                color: theme.textSecondary,
                fontFamily: theme.bodyFont,
                fontSize: "clamp(0.7rem, 1.5vw, 0.95rem)",
                lineHeight: 1.6,
              }}
            />
          </li>
        ))}
      </ul>
      {editable && (
        <button
          onClick={addBullet}
          className="mt-2 self-start rounded px-2 py-1 text-xs transition-colors"
          style={{ color: theme.accent, background: theme.accentSoft }}
        >
          + Add point
        </button>
      )}
    </div>
  );
}

function TwoColumnLayout({ slide, theme, editable, onUpdate }: LayoutProps) {
  return (
    <div className="relative flex h-full flex-col px-[8%] py-[7%]" style={{ background: theme.bgSecondary }}>
      <DecorShapes theme={theme} layout="two-column" />
      <EditableText
        tag="h2"
        value={slide.title}
        onCommit={(v) => onUpdate({ title: v })}
        editable={editable}
        placeholder="Slide Title"
        style={{
          color: theme.textPrimary,
          fontFamily: theme.headingFont,
          fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
          fontWeight: 700,
        }}
      />
      <div className="mt-5 grid flex-1 grid-cols-2 gap-[5%]">
        <div>
          <EditableText
            tag="h3"
            value={slide.leftHeading}
            onCommit={(v) => onUpdate({ leftHeading: v })}
            editable={editable}
            placeholder="Left Heading"
            style={{
              color: theme.accent,
              fontFamily: theme.headingFont,
              fontSize: "clamp(0.8rem, 1.8vw, 1.1rem)",
              fontWeight: 600,
            }}
          />
          <EditableText
            tag="p"
            value={slide.leftBody}
            onCommit={(v) => onUpdate({ leftBody: v })}
            editable={editable}
            placeholder="Left column content..."
            className="mt-2"
            style={{
              color: theme.textSecondary,
              fontFamily: theme.bodyFont,
              fontSize: "clamp(0.65rem, 1.3vw, 0.85rem)",
              lineHeight: 1.65,
            }}
          />
        </div>
        <div>
          <EditableText
            tag="h3"
            value={slide.rightHeading}
            onCommit={(v) => onUpdate({ rightHeading: v })}
            editable={editable}
            placeholder="Right Heading"
            style={{
              color: theme.accent,
              fontFamily: theme.headingFont,
              fontSize: "clamp(0.8rem, 1.8vw, 1.1rem)",
              fontWeight: 600,
            }}
          />
          <EditableText
            tag="p"
            value={slide.rightBody}
            onCommit={(v) => onUpdate({ rightBody: v })}
            editable={editable}
            placeholder="Right column content..."
            className="mt-2"
            style={{
              color: theme.textSecondary,
              fontFamily: theme.bodyFont,
              fontSize: "clamp(0.65rem, 1.3vw, 0.85rem)",
              lineHeight: 1.65,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function QuoteLayout({ slide, theme, editable, onUpdate }: LayoutProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-[14%] text-center"
      style={{ background: theme.bgPrimary }}
    >
      <DecorShapes theme={theme} layout="quote" />
      {/* Opening quote mark */}
      <span
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "clamp(3rem, 8vw, 6rem)",
          lineHeight: 0.7,
          color: theme.accent,
          opacity: 0.3,
        }}
      >
        &ldquo;
      </span>
      <EditableText
        tag="blockquote"
        value={slide.quoteText}
        onCommit={(v) => onUpdate({ quoteText: v })}
        editable={editable}
        placeholder="Your quote here..."
        className="mt-2"
        style={{
          color: theme.textPrimary,
          fontFamily: theme.headingFont,
          fontSize: "clamp(1rem, 2.5vw, 1.6rem)",
          fontWeight: 500,
          fontStyle: "italic",
          lineHeight: 1.5,
        }}
      />
      <div className="mt-4 flex items-center gap-3">
        <div className="h-px w-8" style={{ background: theme.accent, opacity: 0.5 }} />
        <EditableText
          value={slide.quoteAuthor}
          onCommit={(v) => onUpdate({ quoteAuthor: v })}
          editable={editable}
          placeholder="Author Name"
          style={{
            color: theme.textSecondary,
            fontFamily: theme.bodyFont,
            fontSize: "clamp(0.7rem, 1.4vw, 0.9rem)",
            fontWeight: 500,
          }}
        />
      </div>
    </div>
  );
}

function BigNumberLayout({ slide, theme, editable, onUpdate }: LayoutProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-[12%] text-center"
      style={{ background: theme.bgSecondary }}
    >
      <DecorShapes theme={theme} layout="big-number" />
      {(slide.title || editable) && (
        <EditableText
          tag="h2"
          value={slide.title}
          onCommit={(v) => onUpdate({ title: v })}
          editable={editable}
          placeholder="Context Title"
          style={{
            color: theme.textSecondary,
            fontFamily: theme.bodyFont,
            fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        />
      )}
      <EditableText
        tag="h1"
        value={slide.bigNumber}
        onCommit={(v) => onUpdate({ bigNumber: v })}
        editable={editable}
        placeholder="42%"
        className="mt-3"
        style={{
          color: theme.accent,
          fontFamily: theme.headingFont,
          fontSize: "clamp(3rem, 9vw, 6rem)",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.03em",
        }}
      />
      <EditableText
        value={slide.bigNumberLabel}
        onCommit={(v) => onUpdate({ bigNumberLabel: v })}
        editable={editable}
        placeholder="Description of this number"
        className="mt-3"
        style={{
          color: theme.textSecondary,
          fontFamily: theme.bodyFont,
          fontSize: "clamp(0.75rem, 1.6vw, 1rem)",
          lineHeight: 1.5,
          maxWidth: "80%",
        }}
      />
    </div>
  );
}

function ImageTextLayout({ slide, theme, editable, onUpdate }: LayoutProps) {
  return (
    <div className="relative flex h-full" style={{ background: theme.bgSecondary }}>
      <DecorShapes theme={theme} layout="image-text" />
      {/* Image area */}
      <div
        className="flex w-[45%] shrink-0 items-center justify-center"
        style={{ background: theme.accentSoft }}
      >
        {slide.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <svg
              className="h-12 w-12"
              style={{ color: theme.accent, opacity: 0.4 }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span style={{ color: theme.textSecondary, fontSize: "0.7rem", opacity: 0.5 }}>
              Image placeholder
            </span>
          </div>
        )}
      </div>
      {/* Text area */}
      <div className="flex flex-1 flex-col justify-center px-[6%] py-[5%]">
        <EditableText
          tag="h2"
          value={slide.title}
          onCommit={(v) => onUpdate({ title: v })}
          editable={editable}
          placeholder="Slide Title"
          style={{
            color: theme.textPrimary,
            fontFamily: theme.headingFont,
            fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
            fontWeight: 700,
          }}
        />
        <EditableText
          tag="p"
          value={slide.body}
          onCommit={(v) => onUpdate({ body: v })}
          editable={editable}
          placeholder="Supporting text..."
          className="mt-3"
          style={{
            color: theme.textSecondary,
            fontFamily: theme.bodyFont,
            fontSize: "clamp(0.65rem, 1.3vw, 0.85rem)",
            lineHeight: 1.65,
          }}
        />
      </div>
    </div>
  );
}

function BlankLayout({ slide, theme, editable, onUpdate }: LayoutProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-[10%]"
      style={{ background: theme.bgSecondary }}>
      {(slide.title || editable) && (
        <EditableText
          tag="h2"
          value={slide.title}
          onCommit={(v) => onUpdate({ title: v })}
          editable={editable}
          placeholder="Click to add text..."
          style={{
            color: theme.textPrimary,
            fontFamily: theme.headingFont,
            fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
            fontWeight: 600,
          }}
        />
      )}
    </div>
  );
}

// ── Layout Dispatcher ───────────────────────────────────────────────────

const LAYOUT_MAP: Record<string, React.FC<LayoutProps>> = {
  title: TitleLayout,
  section: SectionLayout,
  content: ContentLayout,
  bullets: BulletsLayout,
  "two-column": TwoColumnLayout,
  quote: QuoteLayout,
  "image-text": ImageTextLayout,
  "big-number": BigNumberLayout,
  blank: BlankLayout,
};

// ═══════════════════════════════════════════════════════════════════════════
// SlideRenderer — public component
// ═══════════════════════════════════════════════════════════════════════════

interface SlideRendererProps {
  slide: Slide;
  theme: PresentationTheme;
  aspectRatio: AspectRatio;
  /** Allow inline editing (true for main view, false for thumbnails) */
  editable?: boolean;
  onUpdate?: (patch: Partial<Slide>) => void;
  /** Apply a CSS scale via container width */
  className?: string;
  style?: CSSProperties;
}

export default function SlideRenderer({
  slide,
  theme,
  aspectRatio,
  editable = false,
  onUpdate,
  className = "",
  style,
}: SlideRendererProps) {
  const LayoutComponent = LAYOUT_MAP[slide.layout] ?? BlankLayout;
  const isWide = aspectRatio === "16:9";

  const handleUpdate = useCallback(
    (patch: Partial<Slide>) => {
      onUpdate?.(patch);
    },
    [onUpdate],
  );

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: isWide ? "16/9" : "4/3",
        fontFamily: theme.bodyFont,
        ...style,
      }}
    >
      <LayoutComponent
        slide={slide}
        theme={theme}
        editable={editable}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
