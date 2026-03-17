// =============================================================================
// DMSuite — Sales Book Section: Style & Template
// Template selection with visual previews, accent colors, fonts, field & border styles.
// =============================================================================

"use client";

import { useSalesBookEditor } from "@/stores/sales-book-editor";
import {
  SALES_BOOK_TEMPLATES,
  ACCENT_COLORS,
  FONT_PAIRINGS,
  FIELD_STYLES,
  FIELD_STYLE_LABELS,
  BORDER_STYLES,
} from "@/lib/sales-book/schema";
import type { SalesBookTemplate } from "@/lib/sales-book/schema";

// ── Distinct mini template visual preview per template ──

function TemplateThumbnail({ template }: { template: SalesBookTemplate }) {
  const accent = template.accent;
  const accent2 = template.accentSecondary ?? accent;
  const border =
    template.borderStyle === "double"
      ? `3px double ${accent}`
      : template.borderStyle === "solid"
        ? `1px solid ${accent}`
        : "1px solid #e5e7eb";

  return (
    <div
      className="w-full aspect-3/4 rounded-sm overflow-hidden"
      style={{ border, backgroundColor: "#fff", padding: "3px", position: "relative" }}
    >
      {/* Page border overlay */}
      {template.pageBorderWeight !== "none" && (
        <div style={{ position: "absolute", inset: "1px", border: `${template.pageBorderWeight === "thick" ? "2px" : "1px"} solid ${accent}`, pointerEvents: "none", zIndex: 2, borderRadius: "1px" }} />
      )}

      {/* Watermark hint */}
      {template.watermark !== "none" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0 }}>
          {template.watermark === "logo" ? (
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: `1.5px solid ${accent}`, opacity: 0.12 }} />
          ) : (
            <div style={{ fontSize: "5px", fontWeight: 900, color: accent, opacity: 0.08, transform: "rotate(-25deg)", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {template.watermark === "text" ? "INVOICE" : "TITLE"}
            </div>
          )}
        </div>
      )}

      {/* Decorative overlay hints */}
      {template.decorative === "corner-gradient" && (
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", background: `linear-gradient(135deg, ${accent}40, ${accent2}30)`, borderRadius: "3px 0 0 0", pointerEvents: "none", zIndex: 1 }} />
      )}
      {template.decorative === "top-circles" && (
        <>
          <div style={{ position: "absolute", top: "-4px", left: "2px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: accent2, opacity: 0.15, pointerEvents: "none", zIndex: 1 }} />
          <div style={{ position: "absolute", top: "-3px", left: "6px", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: accent, opacity: 0.1, pointerEvents: "none", zIndex: 1 }} />
        </>
      )}

      {/* Header treatment varies by headerStyle */}
      {template.headerStyle === "banner" && (
        <>
          <div style={{ height: "8px", backgroundColor: accent, borderRadius: "1px", marginBottom: "2px", marginLeft: "-3px", marginRight: "-3px", marginTop: "-3px", background: template.headerGradient ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : accent }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <div style={{ height: "2px", width: "30%", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
            <div style={{ height: "2px", width: "20%", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
          </div>
        </>
      )}
      {template.headerStyle === "minimal" && (
        <>
          <div style={{ height: "2px", width: "35%", backgroundColor: accent, borderRadius: "1px", marginBottom: "2px" }} />
          <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
            <div style={{ flex: 1, height: "1.5px", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
            <div style={{ flex: 1, height: "1.5px", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
          </div>
          <div style={{ height: "1px", backgroundColor: accent, opacity: 0.3, marginBottom: "2px" }} />
        </>
      )}
      {template.headerStyle === "centered" && (
        <>
          <div style={{ textAlign: "center", marginBottom: "2px" }}>
            <div style={{ height: "2px", width: "40%", backgroundColor: accent, borderRadius: "1px", margin: "0 auto 2px" }} />
            <div style={{ height: "1.5px", width: "25%", backgroundColor: accent, opacity: 0.4, borderRadius: "1px", margin: "0 auto" }} />
          </div>
          <div style={{ height: "1px", borderBottom: `1px solid ${accent}30`, marginBottom: "2px" }} />
        </>
      )}
      {template.headerStyle === "left-heavy" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
            <div>
              <div style={{ height: "3px", width: "24px", backgroundColor: accent, borderRadius: "1px", marginBottom: "1px" }} />
              <div style={{ height: "1.5px", width: "18px", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
              {template.contactIcons && (
                <div style={{ display: "flex", gap: "1px", marginTop: "1px" }}>
                  <div style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: accent, opacity: 0.5 }} />
                  <div style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: accent, opacity: 0.5 }} />
                </div>
              )}
            </div>
            <div style={{ height: "3px", width: "16px", backgroundColor: accent, opacity: 0.5, borderRadius: "1px" }} />
          </div>
          <div style={{ height: "1.5px", backgroundColor: accent, marginBottom: "2px" }} />
        </>
      )}
      {template.headerStyle === "split" && (
        <>
          <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
            <div style={{ flex: 1, height: "3px", backgroundColor: accent, opacity: 0.7, borderRadius: "1px" }} />
            <div style={{ width: "1px", backgroundColor: "#d1d5db" }} />
            <div style={{ flex: 1, height: "3px", backgroundColor: accent, opacity: 0.3, borderRadius: "1px" }} />
          </div>
          <div style={{ height: "1px", backgroundColor: "#e5e7eb", marginBottom: "2px" }} />
        </>
      )}
      {template.headerStyle === "boxed" && (
        <>
          <div style={{ border: `1px solid ${accent}60`, padding: "1px", marginBottom: "2px", borderRadius: "1px" }}>
            <div style={{ height: "2px", width: "60%", backgroundColor: accent, borderRadius: "1px", marginBottom: "1px" }} />
            <div style={{ height: "1.5px", width: "40%", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
          </div>
        </>
      )}

      {/* Fields row */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
        <div style={{ flex: 1, height: "2px", backgroundColor: "#d1d5db", borderRadius: "1px", borderRight: template.fieldSeparators ? "0.5px solid #d1d5db" : "none" }} />
        <div style={{ flex: 1, height: "2px", backgroundColor: "#d1d5db", borderRadius: "1px" }} />
      </div>

      {/* Table header */}
      <div
        style={{
          height: "3px",
          backgroundColor: template.tableHeaderFill ? accent : "transparent",
          border: !template.tableHeaderFill ? `0.5px solid ${accent}60` : "none",
          borderRadius: "1px",
          marginBottom: "1px",
          opacity: template.tableHeaderFill ? 0.8 : 1,
        }}
      />

      {/* Table rows */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: "2px",
            backgroundColor: template.tableStyle === "striped" && i % 2 === 0 ? (template.accentSecondary ? `${template.accentSecondary}30` : "#f3f4f6") : "transparent",
            borderBottom: template.tableStyle === "bordered" ? `${template.tableBorderWeight === "heavy" ? "1px" : "0.5px"} solid #d1d5db` : template.tableStyle === "clean" ? "0.5px solid #f3f4f6" : "0.5px solid #e5e7eb",
            marginBottom: "1px",
          }}
        />
      ))}

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
        <div
          style={{
            width: "40%",
            height: "2.5px",
            backgroundColor: template.totalsStyle === "badge" ? accent : `${accent}40`,
            borderRadius: template.totalsStyle === "badge" ? "1px" : "0",
            borderTop: template.totalsBorder ? `1px solid ${accent}` : "none",
            ...(template.totalsStyle === "boxed" ? { border: `0.5px solid ${accent}60` } : {}),
          }}
        />
      </div>

      {/* Footer bar hint */}
      {template.footerStyle === "bar" && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", backgroundColor: accent, opacity: 0.7 }} />
      )}
      {template.footerStyle === "contact-bar" && (
        <div style={{ position: "absolute", bottom: "1px", left: "3px", right: "3px", height: "2px", borderTop: `0.5px solid ${accent}30`, display: "flex", gap: "2px", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: "2px", height: "2px", borderRadius: "50%", backgroundColor: accent, opacity: 0.4 }} />
          <div style={{ width: "2px", height: "2px", borderRadius: "50%", backgroundColor: accent, opacity: 0.4 }} />
        </div>
      )}
      {template.footerStyle === "line" && (
        <div style={{ position: "absolute", bottom: "2px", left: "3px", right: "3px", borderTop: `0.5px solid ${accent}20` }} />
      )}

      {/* Receipt sidebar hint */}
      {template.receiptSidebar && (
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "4px", backgroundColor: template.receiptSidebarColor ?? accent, opacity: 0.6 }} />
      )}
    </div>
  );
}

export default function SBSectionStyle() {
  const style = useSalesBookEditor((s) => s.form.style);
  const updateStyle = useSalesBookEditor((s) => s.updateStyle);

  return (
    <div className="space-y-4">
      {/* Template */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-500 mb-2">Template</h3>
        <div className="grid grid-cols-4 gap-1.5 max-h-72 overflow-y-auto pr-1">
          {SALES_BOOK_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => updateStyle({ template: tpl.id, accentColor: tpl.accent, borderStyle: tpl.borderStyle })}
              title={tpl.description}
              className={`rounded-lg border p-1.5 text-center transition-all ${
                style.template === tpl.id
                  ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <TemplateThumbnail template={tpl} />
              <span className="text-[9px] font-medium text-gray-300 mt-1 block truncate">{tpl.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-500 mb-2">Accent Color</h3>
        <div className="flex flex-wrap gap-1.5">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => updateStyle({ accentColor: color.hex })}
              title={color.label}
              className={`w-7 h-7 rounded-lg transition-all ${
                style.accentColor === color.hex ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-900 scale-110" : "hover:scale-105"
              }`}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      </div>

      {/* Font Pairing */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-500 mb-2">Font Pairing</h3>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {FONT_PAIRINGS.map((fp) => (
            <button
              key={fp.id}
              onClick={() => updateStyle({ fontPairing: fp.id })}
              className={`rounded-lg border p-2 text-left transition-all ${
                style.fontPairing === fp.id
                  ? "border-primary-500 bg-primary-500/10"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <span className="text-[11px] text-gray-200">{fp.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Field Style */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-500 mb-2">Blank Field Style</h3>
        <div className="grid grid-cols-3 gap-2">
          {FIELD_STYLES.map((fs) => (
            <button
              key={fs}
              onClick={() => updateStyle({ fieldStyle: fs })}
              className={`rounded-lg border p-2 text-center transition-all ${
                style.fieldStyle === fs
                  ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <div className="flex items-end justify-center h-5 mb-1">
                <div
                  className="w-12"
                  style={{
                    borderBottom: fs === "underline" ? "2px solid #9ca3af" : fs === "dotted" ? "2px dotted #9ca3af" : "none",
                    border: fs === "box" ? "1px solid #9ca3af" : undefined,
                    height: fs === "box" ? "14px" : "auto",
                    borderRadius: fs === "box" ? "2px" : 0,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-300">{FIELD_STYLE_LABELS[fs]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Border Style */}
      <div>
        <h3 className="text-[11px] font-medium text-gray-500 mb-2">Form Border</h3>
        <div className="grid grid-cols-3 gap-2">
          {BORDER_STYLES.map((bs) => (
            <button
              key={bs}
              onClick={() => updateStyle({ borderStyle: bs })}
              className={`rounded-lg border p-2 text-center transition-all ${
                style.borderStyle === bs
                  ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center justify-center h-5 mb-1">
                <div
                  className="w-8 h-5"
                  style={{
                    border:
                      bs === "solid" ? "2px solid #9ca3af" : bs === "double" ? "4px double #9ca3af" : "1px dashed #4b5563",
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-300 capitalize">{bs}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
