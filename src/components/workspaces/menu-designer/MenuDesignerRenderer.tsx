// =============================================================================
// DMSuite — Menu Designer Renderer
// Pure HTML/CSS renderer for professional menus. Outputs paginated, print-
// ready content with 12 templates, dietary tags, multiple price display
// styles, decorative dividers, and multi-column layouts.
// =============================================================================

"use client";

import { useEffect, useMemo } from "react";
import type {
  MenuDesignerFormData,
  MenuTemplate,
  MenuStyleConfig,
  MenuSection,
  MenuItem,
  DietaryTag,
  PriceDisplayStyle,
  DividerStyle,
  CurrencyConfig,
  ColumnLayout,
} from "@/stores/menu-designer-editor";
import {
  MENU_FONT_PAIRINGS,
  DIETARY_TAGS,
  formatPrice,
} from "@/stores/menu-designer-editor";
import {
  getAdvancedSettings,
  scaledFontSize,
} from "@/stores/advanced-helpers";

// ━━━ Page Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PAGE_PX: Record<string, { w: number; h: number }> = {
  a4: { w: 794, h: 1123 },
  letter: { w: 816, h: 1056 },
  a5: { w: 559, h: 794 },
  dl: { w: 374, h: 794 },
  square: { w: 794, h: 794 },
  tabloid: { w: 1056, h: 1632 },
  "a4-landscape": { w: 1123, h: 794 },
  "letter-landscape": { w: 1056, h: 816 },
  "a5-landscape": { w: 794, h: 559 },
  "dl-landscape": { w: 794, h: 374 },
  "square-landscape": { w: 794, h: 794 },
  "tabloid-landscape": { w: 1632, h: 1056 },
};

export const PAGE_GAP = 16;

// ━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getGoogleFontUrl(fontPairingId: string): string {
  const pair = MENU_FONT_PAIRINGS[fontPairingId];
  if (!pair) return "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Lato:wght@300;400;700&display=swap";
  return `https://fonts.googleapis.com/css2?family=${pair.google}&display=swap`;
}

function getFontFamily(fontPairingId: string, role: "heading" | "body"): string {
  const pair = MENU_FONT_PAIRINGS[fontPairingId];
  if (!pair) return role === "heading" ? '"Playfair Display", serif' : '"Lato", sans-serif';
  return role === "heading" ? `"${pair.heading}", serif` : `"${pair.body}", sans-serif`;
}

function getPageKey(pageSize: string, orientation: string): string {
  if (orientation === "landscape") return `${pageSize}-landscape`;
  return pageSize;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const num = parseInt(cleaned, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function isLightColor(hex: string): boolean {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

// ━━━ Margin Mapping ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getMarginPx(margin: string): number {
  switch (margin) {
    case "narrow": return 32;
    case "wide": return 64;
    default: return 48;
  }
}

// ━━━ Divider SVGs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DividerElement({ style, accent, width }: { style: DividerStyle; accent: string; width: number }) {
  const w = Math.min(width, 500);

  switch (style) {
    case "thin-line":
      return <div style={{ width: w, height: 1, background: hexToRgba(accent, 0.3), margin: "0 auto" }} />;
    case "thick-rule":
      return <div style={{ width: w, height: 3, background: accent, margin: "0 auto", borderRadius: 2 }} />;
    case "dashed":
      return <div style={{ width: w, height: 0, borderTop: `2px dashed ${hexToRgba(accent, 0.4)}`, margin: "0 auto" }} />;
    case "ornamental":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: w, margin: "0 auto" }}>
          <div style={{ flex: 1, height: 1, background: hexToRgba(accent, 0.25) }} />
          <svg width="16" height="16" viewBox="0 0 16 16" fill={accent} opacity={0.6}>
            <path d="M8 0L10 6L16 8L10 10L8 16L6 10L0 8L6 6Z" />
          </svg>
          <div style={{ flex: 1, height: 1, background: hexToRgba(accent, 0.25) }} />
        </div>
      );
    case "dots-pattern":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, margin: "0 auto" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: hexToRgba(accent, 0.4) }} />
          ))}
        </div>
      );
    case "botanical":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: w, margin: "0 auto" }}>
          <div style={{ flex: 1, height: 1, background: hexToRgba(accent, 0.2) }} />
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke={accent} strokeWidth="1" opacity={0.5}>
            <path d="M2 10 C6 2, 10 2, 12 6 C14 2, 18 2, 22 10" />
            <path d="M12 6 L12 12" />
          </svg>
          <div style={{ flex: 1, height: 1, background: hexToRgba(accent, 0.2) }} />
        </div>
      );
    case "wave":
      return (
        <svg width={w} height="8" viewBox={`0 0 ${w} 8`} fill="none" style={{ display: "block", margin: "0 auto" }}>
          <path d={`M0 4 ${Array.from({ length: Math.floor(w / 20) }).map((_, i) => `Q${i * 20 + 10} ${i % 2 === 0 ? 0 : 8} ${(i + 1) * 20} 4`).join(" ")}`} stroke={hexToRgba(accent, 0.35)} strokeWidth="1.5" />
        </svg>
      );
    case "brush-stroke":
      return (
        <div style={{ width: w * 0.6, height: 2, margin: "0 auto", background: `linear-gradient(90deg, transparent 0%, ${accent} 20%, ${accent} 80%, transparent 100%)`, borderRadius: 1, opacity: 0.5 }} />
      );
    case "grape-vine":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: w, margin: "0 auto" }}>
          <div style={{ flex: 1, height: 1, background: hexToRgba(accent, 0.2) }} />
          <svg width="20" height="14" viewBox="0 0 20 14" fill={accent} opacity={0.4}>
            <circle cx="10" cy="4" r="3" /><circle cx="5" cy="7" r="2.5" /><circle cx="15" cy="7" r="2.5" />
            <rect x="9" y="7" width="2" height="7" rx="1" />
          </svg>
          <div style={{ flex: 1, height: 1, background: hexToRgba(accent, 0.2) }} />
        </div>
      );
    case "glow-line":
      return (
        <div style={{ width: w, height: 1, margin: "0 auto", background: accent, boxShadow: `0 0 8px ${hexToRgba(accent, 0.5)}, 0 0 2px ${accent}`, opacity: 0.7 }} />
      );
    default:
      return null;
  }
}

// ━━━ Dietary Tag Badge ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DietaryBadge({ tag, size = 14 }: { tag: DietaryTag; size?: number }) {
  const config = DIETARY_TAGS.find((d) => d.id === tag);
  if (!config) return null;
  return (
    <span
      title={config.label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size,
        fontSize: size * 0.55,
        fontWeight: 700,
        lineHeight: 1,
        color: "#fff",
        background: config.color,
        flexShrink: 0,
      }}
    >
      {tag}
    </span>
  );
}

// ━━━ Price Row ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function PriceRow({
  item,
  currency,
  priceStyle,
  textColor,
  accent,
  bodyFont,
  headingFont,
  nameSize,
  descSize,
  priceSize,
  showDescription,
}: {
  item: MenuItem;
  currency: CurrencyConfig;
  priceStyle: PriceDisplayStyle;
  textColor: string;
  accent: string;
  bodyFont: string;
  headingFont: string;
  nameSize: number;
  descSize: number;
  priceSize: number;
  showDescription: boolean;
}) {
  const priceStr = formatPrice(item.price, currency);

  // Dots leader between name and price
  if (priceStyle === "dots") {
    return (
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span
            style={{
              fontFamily: headingFont,
              fontSize: nameSize,
              fontWeight: item.featured ? 700 : 600,
              color: item.featured ? accent : textColor,
              whiteSpace: "nowrap",
            }}
          >
            {item.name}
          </span>
          {item.dietary.length > 0 && (
            <span style={{ display: "inline-flex", gap: 2, flexShrink: 0 }}>
              {item.dietary.map((d) => <DietaryBadge key={d} tag={d} size={12} />)}
            </span>
          )}
          <span
            style={{
              flex: 1,
              borderBottom: `1px dotted ${hexToRgba(textColor, 0.2)}`,
              minWidth: 20,
              marginBottom: 3,
            }}
          />
          <span
            style={{
              fontFamily: bodyFont,
              fontSize: priceSize,
              fontWeight: 600,
              color: accent,
              whiteSpace: "nowrap",
            }}
          >
            {priceStr}
          </span>
        </div>
        {showDescription && item.description && (
          <p style={{ fontFamily: bodyFont, fontSize: descSize, color: hexToRgba(textColor, 0.6), margin: "2px 0 0", lineHeight: 1.4, fontStyle: "italic" }}>
            {item.description}
          </p>
        )}
      </div>
    );
  }

  // Right-aligned price
  if (priceStyle === "right-aligned") {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontFamily: headingFont,
                fontSize: nameSize,
                fontWeight: item.featured ? 700 : 600,
                color: item.featured ? accent : textColor,
              }}
            >
              {item.name}
            </span>
            {item.dietary.length > 0 && (
              <span style={{ display: "inline-flex", gap: 2, marginLeft: 6, verticalAlign: "middle" }}>
                {item.dietary.map((d) => <DietaryBadge key={d} tag={d} size={12} />)}
              </span>
            )}
          </div>
          <span
            style={{
              fontFamily: bodyFont,
              fontSize: priceSize,
              fontWeight: 700,
              color: accent,
              whiteSpace: "nowrap",
            }}
          >
            {priceStr}
          </span>
        </div>
        {showDescription && item.description && (
          <p style={{ fontFamily: bodyFont, fontSize: descSize, color: hexToRgba(textColor, 0.6), margin: "2px 0 0", lineHeight: 1.4 }}>
            {item.description}
          </p>
        )}
      </div>
    );
  }

  // Inline price (after name)
  if (priceStyle === "inline") {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: headingFont,
              fontSize: nameSize,
              fontWeight: item.featured ? 700 : 600,
              color: item.featured ? accent : textColor,
            }}
          >
            {item.name}
          </span>
          <span
            style={{
              fontFamily: bodyFont,
              fontSize: priceSize,
              fontWeight: 600,
              color: accent,
            }}
          >
            {priceStr}
          </span>
          {item.dietary.length > 0 && (
            <span style={{ display: "inline-flex", gap: 2 }}>
              {item.dietary.map((d) => <DietaryBadge key={d} tag={d} size={12} />)}
            </span>
          )}
        </div>
        {showDescription && item.description && (
          <p style={{ fontFamily: bodyFont, fontSize: descSize, color: hexToRgba(textColor, 0.6), margin: "2px 0 0", lineHeight: 1.4 }}>
            {item.description}
          </p>
        )}
      </div>
    );
  }

  // Centered (prix fixe style)
  if (priceStyle === "centered") {
    return (
      <div style={{ marginBottom: 10, textAlign: "center" }}>
        <div
          style={{
            fontFamily: headingFont,
            fontSize: nameSize,
            fontWeight: item.featured ? 700 : 600,
            color: item.featured ? accent : textColor,
          }}
        >
          {item.name}
          {item.dietary.length > 0 && (
            <span style={{ display: "inline-flex", gap: 2, marginLeft: 6, verticalAlign: "middle" }}>
              {item.dietary.map((d) => <DietaryBadge key={d} tag={d} size={12} />)}
            </span>
          )}
        </div>
        {showDescription && item.description && (
          <p style={{ fontFamily: bodyFont, fontSize: descSize, color: hexToRgba(textColor, 0.6), margin: "3px 0", lineHeight: 1.4, fontStyle: "italic" }}>
            {item.description}
          </p>
        )}
        <span style={{ fontFamily: bodyFont, fontSize: priceSize, fontWeight: 600, color: accent }}>
          {priceStr}
        </span>
      </div>
    );
  }

  // Parentheses
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: headingFont,
            fontSize: nameSize,
            fontWeight: item.featured ? 700 : 600,
            color: item.featured ? accent : textColor,
          }}
        >
          {item.name}
        </span>
        <span style={{ fontFamily: bodyFont, fontSize: priceSize, color: hexToRgba(accent, 0.8) }}>
          ({priceStr})
        </span>
        {item.dietary.length > 0 && (
          <span style={{ display: "inline-flex", gap: 2 }}>
            {item.dietary.map((d) => <DietaryBadge key={d} tag={d} size={12} />)}
          </span>
        )}
      </div>
      {showDescription && item.description && (
        <p style={{ fontFamily: bodyFont, fontSize: descSize, color: hexToRgba(textColor, 0.6), margin: "2px 0 0", lineHeight: 1.4 }}>
          {item.description}
        </p>
      )}
    </div>
  );
}

// ━━━ Section Renderer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MenuSectionBlock({
  section,
  style,
  currency,
  headingFont,
  bodyFont,
  sectionTitleSize,
  sectionSubSize,
  nameSize,
  descSize,
  priceSize,
  contentWidth,
}: {
  section: MenuSection;
  style: MenuStyleConfig;
  currency: CurrencyConfig;
  headingFont: string;
  bodyFont: string;
  sectionTitleSize: number;
  sectionSubSize: number;
  nameSize: number;
  descSize: number;
  priceSize: number;
  contentWidth: number;
}) {
  if (!section.visible) return null;

  const itemSpacingPx = style.itemSpacing === "tight" ? 4 : style.itemSpacing === "relaxed" ? 14 : 8;
  const textAlign = style.headerStyle === "centered" ? "center" as const : "left" as const;

  return (
    <div data-md-section={`section-${section.id}`} style={{ marginBottom: 20 }}>
      {/* Section title */}
      <div style={{ textAlign, marginBottom: 8 }}>
        <h3
          style={{
            fontFamily: headingFont,
            fontSize: sectionTitleSize,
            fontWeight: 700,
            color: style.accentColor,
            textTransform: "uppercase",
            letterSpacing: 2,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {section.title}
        </h3>
        {style.showSectionSubtitles && section.subtitle && (
          <p
            style={{
              fontFamily: bodyFont,
              fontSize: sectionSubSize,
              color: hexToRgba(style.textColor, 0.5),
              fontStyle: "italic",
              margin: "2px 0 0",
              lineHeight: 1.4,
            }}
          >
            {section.subtitle}
          </p>
        )}
      </div>

      {/* Divider after title */}
      <div style={{ margin: "6px 0 12px" }}>
        <DividerElement style={style.dividerStyle} accent={style.accentColor} width={contentWidth} />
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: itemSpacingPx }}>
        {section.items.map((item) => (
          <PriceRow
            key={item.id}
            item={item}
            currency={currency}
            priceStyle={style.priceStyle}
            textColor={style.textColor}
            accent={style.accentColor}
            bodyFont={bodyFont}
            headingFont={headingFont}
            nameSize={nameSize}
            descSize={descSize}
            priceSize={priceSize}
            showDescription={style.showItemDescriptions}
          />
        ))}
      </div>
    </div>
  );
}

// ━━━ Dietary Legend ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DietaryLegend({ usedTags, bodyFont, textColor }: { usedTags: DietaryTag[]; bodyFont: string; textColor: string }) {
  if (usedTags.length === 0) return null;
  return (
    <div data-md-section="dietary-legend" style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", padding: "8px 0" }}>
      {usedTags.map((tag) => {
        const config = DIETARY_TAGS.find((d) => d.id === tag);
        if (!config) return null;
        return (
          <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: bodyFont, fontSize: 9, color: hexToRgba(textColor, 0.5) }}>
            <DietaryBadge tag={tag} size={12} />
            {config.label}
          </span>
        );
      })}
    </div>
  );
}

// ━━━ Border Overlay ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function BorderOverlay({ borderStyle, accent, w, h }: { borderStyle: string; accent: string; w: number; h: number }) {
  const base: React.CSSProperties = { position: "absolute", top: 0, left: 0, width: w, height: h, pointerEvents: "none" };

  switch (borderStyle) {
    case "thin":
      return <div style={{ ...base, border: `1px solid ${hexToRgba(accent, 0.3)}` }} />;
    case "double":
      return <div style={{ ...base, border: `3px double ${hexToRgba(accent, 0.4)}` }} />;
    case "ornate":
      return (
        <div style={{ ...base, border: `2px solid ${accent}`, outline: `1px solid ${adjustColor(accent, 30)}`, outlineOffset: 4, boxShadow: `inset 0 0 0 6px ${hexToRgba(accent, 0.05)}` }} />
      );
    case "accent-edge":
      return (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, width: w, height: 4, background: accent, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: w, height: 4, background: accent, pointerEvents: "none" }} />
        </>
      );
    default:
      return null;
  }
}

// ━━━ Template Background ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getTemplateBackground(template: MenuTemplate, bgColor: string, accent: string): React.CSSProperties {
  switch (template) {
    case "elegant-serif":
      return { background: `linear-gradient(180deg, ${bgColor} 0%, ${adjustColor(bgColor, -8)} 100%)` };
    case "cocktail-bar":
      return { background: `radial-gradient(ellipse at 50% 0%, ${adjustColor(bgColor, 15)} 0%, ${bgColor} 70%)` };
    case "rustic-kraft":
      return { background: `linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -10)} 50%, ${bgColor} 100%)` };
    case "steakhouse-bold":
      return { background: `linear-gradient(180deg, ${bgColor} 0%, ${adjustColor(bgColor, 8)} 50%, ${bgColor} 100%)` };
    case "farm-to-table":
      return { background: `linear-gradient(180deg, ${bgColor} 0%, ${adjustColor(bgColor, -5)} 100%)` };
    case "prix-fixe-luxury":
      return { background: `radial-gradient(ellipse at 50% 30%, ${bgColor} 0%, ${adjustColor(bgColor, -6)} 100%)` };
    default:
      return { background: bgColor };
  }
}

// ━━━ Pagination ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface PageContent {
  headerOnPage: boolean;
  sections: { section: MenuSection; startIdx: number; endIdx: number }[];
  footerOnPage: boolean;
  legendOnPage: boolean;
}

function paginateMenu(
  data: MenuDesignerFormData,
  pageH: number,
  margin: number,
  headerHeight: number,
  sectionTitleHeight: number,
  itemHeight: number,
  footerHeight: number,
  legendHeight: number,
): PageContent[] {
  const usableH = pageH - margin * 2;
  const pages: PageContent[] = [];
  let remainingH = usableH;
  let currentPage: PageContent = { headerOnPage: true, sections: [], footerOnPage: false, legendOnPage: false };

  // Reserve header space on first page
  remainingH -= headerHeight;

  const visibleSections = data.sections.filter((s) => s.visible);

  for (const section of visibleSections) {
    const sectionHeaderH = sectionTitleHeight;
    const itemsCount = section.items.length;

    if (remainingH < sectionHeaderH + itemHeight) {
      // Start new page
      pages.push(currentPage);
      currentPage = { headerOnPage: false, sections: [], footerOnPage: false, legendOnPage: false };
      remainingH = usableH;
    }

    remainingH -= sectionHeaderH;
    let startIdx = 0;

    for (let i = 0; i < itemsCount; i++) {
      if (remainingH < itemHeight) {
        // Push partial section
        if (i > startIdx) {
          currentPage.sections.push({ section, startIdx, endIdx: i });
        }
        pages.push(currentPage);
        currentPage = { headerOnPage: false, sections: [], footerOnPage: false, legendOnPage: false };
        remainingH = usableH;
        startIdx = i;

        // Re-add section header for continuation
        remainingH -= sectionHeaderH;
      }
      remainingH -= itemHeight;
    }

    // Push remaining items of this section
    if (startIdx < itemsCount) {
      currentPage.sections.push({ section, startIdx, endIdx: itemsCount });
    }
  }

  // Add footer and legend to last page if they fit
  const totalFooterH = footerHeight + legendHeight;
  if (remainingH >= totalFooterH) {
    currentPage.footerOnPage = true;
    currentPage.legendOnPage = data.style.showDietaryLegend;
  } else if (remainingH >= footerHeight) {
    currentPage.footerOnPage = true;
  }

  pages.push(currentPage);
  return pages;
}

// ━━━ Renderer Props ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface MenuDesignerRendererProps {
  data: MenuDesignerFormData;
  onPageCount?: (count: number) => void;
  pageGap?: number;
}

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function MenuDesignerRenderer({ data, onPageCount, pageGap = PAGE_GAP }: MenuDesignerRendererProps) {
  const adv = getAdvancedSettings();
  const { style, format, currency } = data;

  const pageKey = getPageKey(format.pageSize, format.orientation);
  const pageDims = PAGE_PX[pageKey] ?? PAGE_PX.a4;
  const marginPx = getMarginPx(format.margins);

  const headingFont = getFontFamily(style.fontPairing, "heading");
  const bodyFont = getFontFamily(style.fontPairing, "body");

  // Scaled font sizes
  const restaurantNameSize = scaledFontSize(Math.round(28 * style.fontScale), "heading", adv);
  const taglineSize = scaledFontSize(Math.round(13 * style.fontScale), "body", adv);
  const sectionTitleSize = scaledFontSize(Math.round(16 * style.fontScale), "heading", adv);
  const sectionSubSize = scaledFontSize(Math.round(10 * style.fontScale), "body", adv);
  const itemNameSize = scaledFontSize(Math.round(12 * style.fontScale), "body", adv);
  const descriptionSize = scaledFontSize(Math.round(9 * style.fontScale), "body", adv);
  const priceTextSize = scaledFontSize(Math.round(11 * style.fontScale), "body", adv);
  const footerSize = scaledFontSize(Math.round(9 * style.fontScale), "label", adv);

  const contentWidth = pageDims.w - marginPx * 2;

  // Collect all used dietary tags
  const usedTags = useMemo(() => {
    const tags = new Set<DietaryTag>();
    data.sections.forEach((s) => s.items.forEach((item) => item.dietary.forEach((d) => tags.add(d))));
    return Array.from(tags);
  }, [data.sections]);

  // Estimate heights for pagination
  const headerHeight = 80;
  const sectionTitleH = 55;
  const itemH = style.showItemDescriptions ? 42 : 26;
  const footerH = data.footerNote ? 40 : 0;
  const legendH = style.showDietaryLegend && usedTags.length > 0 ? 35 : 0;

  const pages = useMemo(
    () => paginateMenu(data, pageDims.h, marginPx, headerHeight, sectionTitleH, itemH, footerH, legendH),
    [data, pageDims.h, marginPx, itemH, footerH, legendH],
  );

  useEffect(() => {
    onPageCount?.(pages.length);
  }, [pages.length, onPageCount]);

  const fontUrl = getGoogleFontUrl(style.fontPairing);
  const bgStyle = getTemplateBackground(style.template, style.bgColor, style.accentColor);
  const textAlign = style.headerStyle === "centered" ? "center" as const : "left" as const;

  // Column rendering helper
  const renderSectionsInColumns = (
    sections: { section: MenuSection; startIdx: number; endIdx: number }[],
  ) => {
    const cols = style.columnLayout === "three-column" ? 3 : style.columnLayout === "two-column" ? 2 : 1;

    if (cols === 1) {
      return (
        <div>
          {sections.map(({ section, startIdx, endIdx }) => {
            const slicedSection = { ...section, items: section.items.slice(startIdx, endIdx) };
            return (
              <MenuSectionBlock
                key={`${section.id}-${startIdx}`}
                section={slicedSection}
                style={style}
                currency={currency}
                headingFont={headingFont}
                bodyFont={bodyFont}
                sectionTitleSize={sectionTitleSize}
                sectionSubSize={sectionSubSize}
                nameSize={itemNameSize}
                descSize={descriptionSize}
                priceSize={priceTextSize}
                contentWidth={contentWidth}
              />
            );
          })}
        </div>
      );
    }

    // Multi-column: distribute sections across columns
    const colWidth = Math.floor((contentWidth - (cols - 1) * 20) / cols);
    const columns: { section: MenuSection; startIdx: number; endIdx: number }[][] = Array.from({ length: cols }, () => []);
    sections.forEach((s, i) => {
      columns[i % cols].push(s);
    });

    return (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {columns.map((col, ci) => (
          <div key={ci} style={{ flex: 1, minWidth: 0 }}>
            {col.map(({ section, startIdx, endIdx }) => {
              const slicedSection = { ...section, items: section.items.slice(startIdx, endIdx) };
              return (
                <MenuSectionBlock
                  key={`${section.id}-${startIdx}`}
                  section={slicedSection}
                  style={style}
                  currency={currency}
                  headingFont={headingFont}
                  bodyFont={bodyFont}
                  sectionTitleSize={sectionTitleSize}
                  sectionSubSize={sectionSubSize}
                  nameSize={itemNameSize}
                  descSize={descriptionSize}
                  priceSize={priceTextSize}
                  contentWidth={colWidth}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <link rel="stylesheet" href={fontUrl} />

      <div className="flex flex-col items-center" style={{ gap: pageGap }}>
        {pages.map((page, pageIdx) => (
          <div
            key={pageIdx}
            data-md-page={pageIdx + 1}
            className="shadow-2xl shadow-black/20"
            style={{
              width: pageDims.w,
              height: pageDims.h,
              overflow: "hidden",
              position: "relative",
              ...bgStyle,
            }}
          >
            {/* Border overlay */}
            <BorderOverlay borderStyle={style.borderStyle} accent={style.accentColor} w={pageDims.w} h={pageDims.h} />

            {/* Page content */}
            <div
              style={{
                position: "relative",
                padding: marginPx,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                fontFamily: bodyFont,
                color: style.textColor,
              }}
            >
              {/* Header — only on first page */}
              {page.headerOnPage && (
                <div data-md-section="header" style={{ textAlign, marginBottom: 20, flexShrink: 0 }}>
                  <h1
                    style={{
                      fontFamily: headingFont,
                      fontSize: restaurantNameSize,
                      fontWeight: 800,
                      color: style.accentColor,
                      margin: 0,
                      lineHeight: 1.2,
                      letterSpacing: 1,
                    }}
                  >
                    {data.restaurantName || "Restaurant Name"}
                  </h1>
                  {data.tagline && (
                    <p
                      style={{
                        fontFamily: bodyFont,
                        fontSize: taglineSize,
                        color: hexToRgba(style.textColor, 0.6),
                        margin: "4px 0 0",
                        fontStyle: "italic",
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {data.tagline}
                    </p>
                  )}
                  {data.headerNote && (
                    <p
                      style={{
                        fontFamily: bodyFont,
                        fontSize: footerSize,
                        color: hexToRgba(style.textColor, 0.5),
                        margin: "6px 0 0",
                        lineHeight: 1.4,
                      }}
                    >
                      {data.headerNote}
                    </p>
                  )}
                  <div style={{ margin: "12px 0 0" }}>
                    <DividerElement style={style.dividerStyle} accent={style.accentColor} width={contentWidth} />
                  </div>
                </div>
              )}

              {/* Sections content area */}
              <div data-md-section="menu-content" style={{ flex: 1, overflow: "hidden" }}>
                {renderSectionsInColumns(page.sections)}
              </div>

              {/* Footer */}
              {page.footerOnPage && data.footerNote && (
                <div data-md-section="footer" style={{ textAlign: "center", marginTop: "auto", paddingTop: 12, flexShrink: 0 }}>
                  <DividerElement style={style.dividerStyle} accent={style.accentColor} width={contentWidth * 0.5} />
                  <p
                    style={{
                      fontFamily: bodyFont,
                      fontSize: footerSize,
                      color: hexToRgba(style.textColor, 0.45),
                      margin: "8px 0 0",
                      lineHeight: 1.4,
                      fontStyle: "italic",
                    }}
                  >
                    {data.footerNote}
                  </p>
                </div>
              )}

              {/* Dietary legend */}
              {page.legendOnPage && usedTags.length > 0 && (
                <DietaryLegend usedTags={usedTags} bodyFont={bodyFont} textColor={style.textColor} />
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
