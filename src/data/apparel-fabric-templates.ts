/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — T-Shirt & Apparel Designer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Apparel Designer.
 *  Default canvas: 500 × 600 px (T-shirt print area).
 *
 *  Named objects for quick-edit targeting:
 *    apr-design-text, apr-sub-text
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 500;
const H = 600;

// ── Helpers ─────────────────────────────────────────────────────────────────

function txt(
  name: string,
  text: string,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "textbox",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    text,
    styles: [],
    selectable: true,
    hasControls: true,
    editable: true,
    ...opts,
  };
}

function rect(
  name: string,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    selectable: true,
    hasControls: true,
    ...opts,
  };
}

function circle(
  name: string,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "circle",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    selectable: true,
    hasControls: true,
    ...opts,
  };
}

function buildJson(bg: string, objects: Record<string, unknown>[]): string {
  return JSON.stringify({ version: "5.3.0", objects, background: bg });
}

// ── Print zone outline (guides) ─────────────────────────────────────────────

const PZ_LEFT = 110;
const PZ_TOP = 125;
const PZ_W = 280;
const PZ_H = 350;

// ── Template builder ────────────────────────────────────────────────────────

function buildApparel(opts: {
  garmentBg: string;
  designColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  style: "typography" | "graphic" | "minimal" | "vintage" | "sporty" | "artistic";
}): string {
  const { garmentBg, designColor, textColor, headingFont, bodyFont, style } = opts;

  const objects: Record<string, unknown>[] = [
    // Print zone guide (dashed)
    rect("apr-print-zone", {
      left: PZ_LEFT, top: PZ_TOP, width: PZ_W, height: PZ_H,
      fill: "transparent", stroke: "#94a3b8", strokeWidth: 1,
      strokeDashArray: [6, 4], opacity: 0.3, selectable: false,
    }),
  ];

  const cx = PZ_LEFT + PZ_W / 2;
  const cy = PZ_TOP + PZ_H / 2;

  if (style === "typography") {
    objects.push(
      txt("apr-design-text", "DMSuite", {
        left: PZ_LEFT + 10, top: cy - 30, width: PZ_W - 20, fontSize: 42,
        fontFamily: headingFont, fontWeight: "800", fill: designColor,
        textAlign: "center",
      }),
      txt("apr-sub-text", "Design Excellence", {
        left: PZ_LEFT + 10, top: cy + 30, width: PZ_W - 20, fontSize: 16,
        fontFamily: bodyFont, fontWeight: "400", fill: textColor,
        textAlign: "center", opacity: 0.7,
      }),
    );
  } else if (style === "graphic") {
    objects.push(
      circle("apr-graphic-circle", {
        left: cx - 60, top: cy - 90, radius: 60,
        fill: designColor, opacity: 0.2,
      }),
      txt("apr-design-text", "DMSuite", {
        left: PZ_LEFT + 10, top: cy + 10, width: PZ_W - 20, fontSize: 28,
        fontFamily: headingFont, fontWeight: "700", fill: designColor,
        textAlign: "center",
      }),
      txt("apr-sub-text", "Design Excellence", {
        left: PZ_LEFT + 10, top: cy + 50, width: PZ_W - 20, fontSize: 14,
        fontFamily: bodyFont, fontWeight: "400", fill: textColor,
        textAlign: "center", opacity: 0.6,
      }),
    );
  } else if (style === "minimal") {
    objects.push(
      txt("apr-design-text", "DMSuite", {
        left: PZ_LEFT + 10, top: cy - 15, width: PZ_W - 20, fontSize: 24,
        fontFamily: headingFont, fontWeight: "300", fill: textColor,
        textAlign: "center",
      }),
      txt("apr-sub-text", "Design Excellence", {
        left: PZ_LEFT + 10, top: cy + 20, width: PZ_W - 20, fontSize: 12,
        fontFamily: bodyFont, fontWeight: "300", fill: textColor,
        textAlign: "center", opacity: 0.5,
      }),
    );
  } else if (style === "vintage") {
    objects.push(
      rect("apr-border", {
        left: PZ_LEFT + 20, top: PZ_TOP + 20, width: PZ_W - 40, height: PZ_H - 40,
        fill: "transparent", stroke: designColor, strokeWidth: 2,
      }),
      txt("apr-design-text", "DMSuite", {
        left: PZ_LEFT + 10, top: cy - 20, width: PZ_W - 20, fontSize: 30,
        fontFamily: "Georgia", fontWeight: "700", fill: designColor,
        textAlign: "center",
      }),
      txt("apr-sub-text", "Design Excellence", {
        left: PZ_LEFT + 10, top: cy + 20, width: PZ_W - 20, fontSize: 14,
        fontFamily: "Georgia", fontWeight: "400", fill: designColor,
        textAlign: "center", fontStyle: "italic",
      }),
    );
  } else if (style === "sporty") {
    objects.push(
      txt("apr-design-text", "DMSuite", {
        left: PZ_LEFT + 10, top: cy - 30, width: PZ_W - 20, fontSize: 48,
        fontFamily: headingFont, fontWeight: "900", fill: designColor,
        textAlign: "center", fontStyle: "italic",
      }),
      rect("apr-accent-bar", {
        left: PZ_LEFT + 60, top: cy + 30, width: PZ_W - 120, height: 4,
        fill: designColor, opacity: 0.3,
      }),
      txt("apr-sub-text", "Design Excellence", {
        left: PZ_LEFT + 10, top: cy + 45, width: PZ_W - 20, fontSize: 14,
        fontFamily: bodyFont, fontWeight: "400", fill: textColor,
        textAlign: "center", opacity: 0.6,
      }),
    );
  } else {
    // artistic
    objects.push(
      txt("apr-design-text", "DMSuite", {
        left: PZ_LEFT + 10, top: cy - 20, width: PZ_W - 20, fontSize: 36,
        fontFamily: headingFont, fontWeight: "800", fill: designColor,
        textAlign: "center", angle: -5,
      }),
      txt("apr-sub-text", "Design Excellence", {
        left: PZ_LEFT + 10, top: cy + 30, width: PZ_W - 20, fontSize: 14,
        fontFamily: bodyFont, fontWeight: "400", fill: textColor,
        textAlign: "center", opacity: 0.6,
      }),
    );
  }

  return buildJson(garmentBg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const APPAREL_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "apparel-typography-white",
    name: "Typography White",
    category: "tshirt-merch",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildApparel({
      garmentBg: "#ffffff",
      designColor: "#1e40af",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
      style: "typography",
    }),
  },
  {
    id: "apparel-typography-black",
    name: "Typography Black",
    category: "tshirt-merch",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildApparel({
      garmentBg: "#000000",
      designColor: "#ffffff",
      textColor: "#e2e8f0",
      headingFont: "Inter",
      bodyFont: "Inter",
      style: "typography",
    }),
  },
  {
    id: "apparel-graphic-navy",
    name: "Graphic Navy",
    category: "tshirt-merch",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildApparel({
      garmentBg: "#1e3a5f",
      designColor: "#fbbf24",
      textColor: "#e2e8f0",
      headingFont: "Inter",
      bodyFont: "Inter",
      style: "graphic",
    }),
  },
  {
    id: "apparel-minimal-gray",
    name: "Minimal Gray",
    category: "tshirt-merch",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildApparel({
      garmentBg: "#6b7280",
      designColor: "#ffffff",
      textColor: "#e2e8f0",
      headingFont: "Inter",
      bodyFont: "Inter",
      style: "minimal",
    }),
  },
  {
    id: "apparel-vintage-red",
    name: "Vintage Red",
    category: "tshirt-merch",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildApparel({
      garmentBg: "#dc2626",
      designColor: "#ffffff",
      textColor: "#fef2f2",
      headingFont: "Georgia",
      bodyFont: "Georgia",
      style: "vintage",
    }),
  },
  {
    id: "apparel-sporty-lime",
    name: "Sporty Lime",
    category: "tshirt-merch",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildApparel({
      garmentBg: "#000000",
      designColor: "#84cc16",
      textColor: "#e2e8f0",
      headingFont: "Inter",
      bodyFont: "Inter",
      style: "sporty",
    }),
  },
  {
    id: "apparel-artistic-purple",
    name: "Artistic Purple",
    category: "tshirt-merch",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildApparel({
      garmentBg: "#7c3aed",
      designColor: "#ffffff",
      textColor: "#e2e8f0",
      headingFont: "Inter",
      bodyFont: "Inter",
      style: "artistic",
    }),
  },
  {
    id: "apparel-graphic-teal",
    name: "Graphic Teal",
    category: "tshirt-merch",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildApparel({
      garmentBg: "#ffffff",
      designColor: "#0f766e",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
      style: "graphic",
    }),
  },
  {
    id: "apparel-sporty-orange",
    name: "Sporty Orange",
    category: "tshirt-merch",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildApparel({
      garmentBg: "#1e293b",
      designColor: "#ea580c",
      textColor: "#e2e8f0",
      headingFont: "Inter",
      bodyFont: "Inter",
      style: "sporty",
    }),
  },
  {
    id: "apparel-vintage-emerald",
    name: "Vintage Emerald",
    category: "tshirt-merch",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildApparel({
      garmentBg: "#059669",
      designColor: "#ffffff",
      textColor: "#ecfdf5",
      headingFont: "Georgia",
      bodyFont: "Georgia",
      style: "vintage",
    }),
  },
];
