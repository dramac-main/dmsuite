/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Business Card Fabric.js Templates
 *
 *  8 fully-editable Fabric.js JSON templates for the Business Card Designer.
 *  Standard business card: 1050 × 600 px (3.5 × 2 in @ 300 DPI).
 *
 *  Every template uses named objects for quick-edit targeting:
 *    bc-name, bc-title, bc-company, bc-phone, bc-email, bc-website,
 *    bc-address, bc-logo-placeholder
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

// ── Helper: build a textbox object ──────────────────────────────────────────
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

function line(
  name: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "line",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    x1, y1, x2, y2,
    selectable: true,
    hasControls: true,
    ...opts,
  };
}

function tri(
  name: string,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "triangle",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    selectable: true,
    hasControls: true,
    ...opts,
  };
}

// ── Wrap objects into full Fabric JSON ──────────────────────────────────────
function buildJson(
  bg: string,
  objects: Record<string, unknown>[],
): string {
  return JSON.stringify({
    version: "5.3.0",
    objects,
    background: bg,
  });
}

// ── W / H ───────────────────────────────────────────────────────────────────
const W = 1050;
const H = 600;

// ═══════════════════════════════════════════════════════════════════════════
// 1. Modern Minimal
// ═══════════════════════════════════════════════════════════════════════════
const modernMinimal = buildJson("#ffffff", [
  // Accent strip left
  rect("accent-bar", {
    left: 0, top: 0, width: 8, height: H,
    fill: "#2563eb", stroke: "", strokeWidth: 0,
  }),
  // Name
  txt("bc-name", "Your Name", {
    left: 50, top: 60, width: 500, fontSize: 36, fontFamily: "Inter",
    fontWeight: 700, fill: "#111827",
  }),
  // Title
  txt("bc-title", "Job Title", {
    left: 50, top: 110, width: 500, fontSize: 18, fontFamily: "Inter",
    fontWeight: 400, fill: "#6b7280",
  }),
  // Separator
  line("divider", 50, 155, 250, 155, {
    stroke: "#2563eb", strokeWidth: 2,
    left: 50, top: 155,
  }),
  // Company
  txt("bc-company", "Company Name", {
    left: 50, top: 175, width: 500, fontSize: 16, fontFamily: "Inter",
    fontWeight: 600, fill: "#374151",
  }),
  // Phone
  txt("bc-phone", "+1 (555) 000-0000", {
    left: 50, top: 280, width: 400, fontSize: 14, fontFamily: "Inter",
    fontWeight: 400, fill: "#4b5563",
  }),
  // Email
  txt("bc-email", "name@company.com", {
    left: 50, top: 310, width: 400, fontSize: 14, fontFamily: "Inter",
    fontWeight: 400, fill: "#4b5563",
  }),
  // Website
  txt("bc-website", "www.company.com", {
    left: 50, top: 340, width: 400, fontSize: 14, fontFamily: "Inter",
    fontWeight: 400, fill: "#4b5563",
  }),
  // Address
  txt("bc-address", "123 Business St, City, State 12345", {
    left: 50, top: 370, width: 500, fontSize: 12, fontFamily: "Inter",
    fontWeight: 400, fill: "#9ca3af",
  }),
  // Logo placeholder
  rect("bc-logo-placeholder", {
    left: 780, top: 60, width: 200, height: 100,
    fill: "#f3f4f6", stroke: "#d1d5db", strokeWidth: 1, rx: 8, ry: 8,
    data: { quickEdit: "logo", hint: "Place your logo here" },
  }),
  txt("logo-hint", "LOGO", {
    left: 845, top: 95, width: 80, fontSize: 16, fontFamily: "Inter",
    fontWeight: 600, fill: "#9ca3af", textAlign: "center",
  }),
]);

// ═══════════════════════════════════════════════════════════════════════════
// 2. Corporate Bold
// ═══════════════════════════════════════════════════════════════════════════
const corporateBold = buildJson("#1e293b", [
  // Left dark panel
  rect("bg-panel", {
    left: 0, top: 0, width: 380, height: H,
    fill: "#0f172a", stroke: "", strokeWidth: 0,
  }),
  // Gold accent stripe
  rect("gold-stripe", {
    left: 375, top: 0, width: 5, height: H,
    fill: "#d4a848", stroke: "", strokeWidth: 0,
  }),
  // Name (left panel)
  txt("bc-name", "Your Name", {
    left: 40, top: 100, width: 310, fontSize: 32, fontFamily: "Montserrat",
    fontWeight: 700, fill: "#ffffff", textAlign: "left",
  }),
  // Title
  txt("bc-title", "Senior Designer", {
    left: 40, top: 148, width: 310, fontSize: 16, fontFamily: "Montserrat",
    fontWeight: 400, fill: "#d4a848",
  }),
  // Company
  txt("bc-company", "COMPANY NAME", {
    left: 40, top: 195, width: 310, fontSize: 14, fontFamily: "Montserrat",
    fontWeight: 600, fill: "#94a3b8", charSpacing: 200,
  }),
  // Contact details (right panel)
  txt("bc-phone", "+1 (555) 000-0000", {
    left: 420, top: 180, width: 580, fontSize: 14, fontFamily: "Inter",
    fontWeight: 400, fill: "#cbd5e1",
  }),
  txt("bc-email", "name@company.com", {
    left: 420, top: 210, width: 580, fontSize: 14, fontFamily: "Inter",
    fontWeight: 400, fill: "#cbd5e1",
  }),
  txt("bc-website", "www.company.com", {
    left: 420, top: 240, width: 580, fontSize: 14, fontFamily: "Inter",
    fontWeight: 400, fill: "#cbd5e1",
  }),
  txt("bc-address", "123 Business St, City, State 12345", {
    left: 420, top: 280, width: 580, fontSize: 12, fontFamily: "Inter",
    fontWeight: 400, fill: "#64748b",
  }),
  // Logo placeholder
  rect("bc-logo-placeholder", {
    left: 420, top: 50, width: 180, height: 90,
    fill: "#1e3a5f", stroke: "#334155", strokeWidth: 1, rx: 6, ry: 6,
    data: { quickEdit: "logo" },
  }),
  txt("logo-hint", "LOGO", {
    left: 477, top: 80, width: 80, fontSize: 16, fontFamily: "Montserrat",
    fontWeight: 600, fill: "#475569", textAlign: "center",
  }),
]);

// ═══════════════════════════════════════════════════════════════════════════
// 3. Creative Gradient
// ═══════════════════════════════════════════════════════════════════════════
const creativeGradient = buildJson("#ffffff", [
  // Bottom gradient bar
  rect("gradient-bar", {
    left: 0, top: H - 100, width: W, height: 100,
    fill: "#7c3aed", stroke: "", strokeWidth: 0,
  }),
  // Overlay lighter bar
  rect("gradient-overlay", {
    left: 0, top: H - 100, width: W / 2, height: 100,
    fill: "#a855f7", stroke: "", strokeWidth: 0,
  }),
  // Name
  txt("bc-name", "Your Name", {
    left: 60, top: 60, width: 600, fontSize: 38, fontFamily: "Poppins",
    fontWeight: 700, fill: "#1e1b4b",
  }),
  // Title
  txt("bc-title", "Creative Director", {
    left: 60, top: 110, width: 600, fontSize: 18, fontFamily: "Poppins",
    fontWeight: 400, fill: "#7c3aed",
  }),
  // Company
  txt("bc-company", "Studio Name", {
    left: 60, top: 150, width: 400, fontSize: 16, fontFamily: "Poppins",
    fontWeight: 500, fill: "#374151",
  }),
  // Contact in gradient bar
  txt("bc-phone", "+1 (555) 000-0000", {
    left: 60, top: H - 85, width: 300, fontSize: 13, fontFamily: "Poppins",
    fontWeight: 400, fill: "#ffffff",
  }),
  txt("bc-email", "name@studio.com", {
    left: 60, top: H - 60, width: 300, fontSize: 13, fontFamily: "Poppins",
    fontWeight: 400, fill: "#ede9fe",
  }),
  txt("bc-website", "www.studio.com", {
    left: 400, top: H - 85, width: 300, fontSize: 13, fontFamily: "Poppins",
    fontWeight: 400, fill: "#ffffff",
  }),
  txt("bc-address", "123 Creative Ave, Design City", {
    left: 400, top: H - 60, width: 400, fontSize: 12, fontFamily: "Poppins",
    fontWeight: 400, fill: "#ede9fe",
  }),
  // Logo area
  rect("bc-logo-placeholder", {
    left: 800, top: 50, width: 180, height: 90,
    fill: "#f5f3ff", stroke: "#c4b5fd", strokeWidth: 1, rx: 12, ry: 12,
    data: { quickEdit: "logo" },
  }),
  txt("logo-hint", "LOGO", {
    left: 857, top: 80, width: 80, fontSize: 16, fontFamily: "Poppins",
    fontWeight: 600, fill: "#a78bfa", textAlign: "center",
  }),
]);

// ═══════════════════════════════════════════════════════════════════════════
// 4. Elegant Classic
// ═══════════════════════════════════════════════════════════════════════════
const elegantClassic = buildJson("#faf8f5", [
  // Top border
  rect("border-top", {
    left: 30, top: 25, width: W - 60, height: 2,
    fill: "#92733a", stroke: "", strokeWidth: 0,
  }),
  // Bottom border
  rect("border-bottom", {
    left: 30, top: H - 27, width: W - 60, height: 2,
    fill: "#92733a", stroke: "", strokeWidth: 0,
  }),
  // Name (centered)
  txt("bc-name", "Your Name", {
    left: 100, top: 80, width: W - 200, fontSize: 34, fontFamily: "Playfair Display",
    fontWeight: 700, fill: "#1a1a1a", textAlign: "center",
  }),
  // Ornament line
  line("ornament", W / 2 - 80, 135, W / 2 + 80, 135, {
    stroke: "#92733a", strokeWidth: 1.5,
    left: W / 2 - 80, top: 135,
  }),
  // Title
  txt("bc-title", "Managing Director", {
    left: 100, top: 155, width: W - 200, fontSize: 16, fontFamily: "Playfair Display",
    fontWeight: 400, fontStyle: "italic", fill: "#92733a", textAlign: "center",
  }),
  // Company
  txt("bc-company", "Company Name", {
    left: 100, top: 195, width: W - 200, fontSize: 15, fontFamily: "Playfair Display",
    fontWeight: 500, fill: "#444444", textAlign: "center", charSpacing: 150,
  }),
  // Contact details (centered block)
  txt("bc-phone", "+1 (555) 000-0000", {
    left: 100, top: 320, width: W - 200, fontSize: 13, fontFamily: "Georgia",
    fontWeight: 400, fill: "#555555", textAlign: "center",
  }),
  txt("bc-email", "name@company.com", {
    left: 100, top: 348, width: W - 200, fontSize: 13, fontFamily: "Georgia",
    fontWeight: 400, fill: "#555555", textAlign: "center",
  }),
  txt("bc-website", "www.company.com", {
    left: 100, top: 376, width: W - 200, fontSize: 13, fontFamily: "Georgia",
    fontWeight: 400, fill: "#555555", textAlign: "center",
  }),
  txt("bc-address", "123 Classic Boulevard, Suite 100, City 12345", {
    left: 100, top: 410, width: W - 200, fontSize: 11, fontFamily: "Georgia",
    fontWeight: 400, fill: "#888888", textAlign: "center",
  }),
  // Logo placeholder (centered at top-right area)
  circle("bc-logo-placeholder", {
    left: W - 140, top: 65, radius: 40,
    fill: "#f0ebe0", stroke: "#92733a", strokeWidth: 1,
    data: { quickEdit: "logo" },
  }),
]);

// ═══════════════════════════════════════════════════════════════════════════
// 5. Tech Startup
// ═══════════════════════════════════════════════════════════════════════════
const techStartup = buildJson("#0f0f0f", [
  // Grid dots decorative (4 dots)
  circle("dot-1", { left: W - 80, top: 40, radius: 4, fill: "#22d3ee", stroke: "", strokeWidth: 0 }),
  circle("dot-2", { left: W - 60, top: 40, radius: 4, fill: "#22d3ee", stroke: "", strokeWidth: 0 }),
  circle("dot-3", { left: W - 80, top: 60, radius: 4, fill: "#22d3ee", stroke: "", strokeWidth: 0 }),
  circle("dot-4", { left: W - 60, top: 60, radius: 4, fill: "#22d3ee", stroke: "", strokeWidth: 0 }),
  // Triangle accent
  tri("accent-triangle", {
    left: 0, top: H - 120, width: 120, height: 120,
    fill: "#0e7490", stroke: "", strokeWidth: 0, angle: 0,
  }),
  // Name
  txt("bc-name", "Your Name", {
    left: 60, top: 70, width: 500, fontSize: 34, fontFamily: "JetBrains Mono",
    fontWeight: 700, fill: "#f0f9ff",
  }),
  // Title
  txt("bc-title", "Full Stack Developer", {
    left: 60, top: 118, width: 500, fontSize: 16, fontFamily: "JetBrains Mono",
    fontWeight: 400, fill: "#22d3ee",
  }),
  // Company
  txt("bc-company", "startup_name", {
    left: 60, top: 155, width: 400, fontSize: 14, fontFamily: "JetBrains Mono",
    fontWeight: 500, fill: "#6b7280",
  }),
  // Contact
  txt("bc-phone", "+1 (555) 000-0000", {
    left: 60, top: 300, width: 400, fontSize: 13, fontFamily: "JetBrains Mono",
    fontWeight: 400, fill: "#9ca3af",
  }),
  txt("bc-email", "dev@startup.io", {
    left: 60, top: 328, width: 400, fontSize: 13, fontFamily: "JetBrains Mono",
    fontWeight: 400, fill: "#9ca3af",
  }),
  txt("bc-website", "startup.io", {
    left: 60, top: 356, width: 400, fontSize: 13, fontFamily: "JetBrains Mono",
    fontWeight: 400, fill: "#22d3ee",
  }),
  txt("bc-address", "Silicon Valley, CA", {
    left: 60, top: 390, width: 400, fontSize: 12, fontFamily: "JetBrains Mono",
    fontWeight: 400, fill: "#4b5563",
  }),
  // Logo placeholder
  rect("bc-logo-placeholder", {
    left: 800, top: 60, width: 180, height: 90,
    fill: "#1a1a2e", stroke: "#22d3ee", strokeWidth: 1, rx: 4, ry: 4,
    data: { quickEdit: "logo" },
  }),
  txt("logo-hint", "LOGO", {
    left: 857, top: 90, width: 80, fontSize: 14, fontFamily: "JetBrains Mono",
    fontWeight: 600, fill: "#374151", textAlign: "center",
  }),
]);

// ═══════════════════════════════════════════════════════════════════════════
// 6. Nature Organic
// ═══════════════════════════════════════════════════════════════════════════
const natureOrganic = buildJson("#f0fdf4", [
  // Curved accent (circle peeking from top-right)
  circle("organic-shape", {
    left: W - 200, top: -100, radius: 200,
    fill: "#bbf7d0", stroke: "", strokeWidth: 0, opacity: 0.5,
  }),
  // Small leaf circle
  circle("leaf-accent", {
    left: 40, top: H - 80, radius: 30,
    fill: "#86efac", stroke: "", strokeWidth: 0, opacity: 0.4,
  }),
  // Name
  txt("bc-name", "Your Name", {
    left: 60, top: 70, width: 500, fontSize: 34, fontFamily: "Merriweather",
    fontWeight: 700, fill: "#14532d",
  }),
  // Title
  txt("bc-title", "Sustainability Advisor", {
    left: 60, top: 120, width: 500, fontSize: 16, fontFamily: "Lato",
    fontWeight: 400, fill: "#166534",
  }),
  // Company
  txt("bc-company", "Green Solutions Co.", {
    left: 60, top: 155, width: 400, fontSize: 15, fontFamily: "Lato",
    fontWeight: 600, fill: "#374151",
  }),
  // Contact
  txt("bc-phone", "+1 (555) 000-0000", {
    left: 60, top: 300, width: 400, fontSize: 13, fontFamily: "Lato",
    fontWeight: 400, fill: "#4b5563",
  }),
  txt("bc-email", "name@greensolutions.com", {
    left: 60, top: 328, width: 400, fontSize: 13, fontFamily: "Lato",
    fontWeight: 400, fill: "#4b5563",
  }),
  txt("bc-website", "www.greensolutions.com", {
    left: 60, top: 356, width: 400, fontSize: 13, fontFamily: "Lato",
    fontWeight: 400, fill: "#16a34a",
  }),
  txt("bc-address", "123 Eco Lane, Green City 54321", {
    left: 60, top: 390, width: 400, fontSize: 12, fontFamily: "Lato",
    fontWeight: 400, fill: "#9ca3af",
  }),
  // Logo placeholder
  rect("bc-logo-placeholder", {
    left: 790, top: 260, width: 190, height: 95,
    fill: "#dcfce7", stroke: "#86efac", strokeWidth: 1, rx: 16, ry: 16,
    data: { quickEdit: "logo" },
  }),
  txt("logo-hint", "LOGO", {
    left: 852, top: 292, width: 80, fontSize: 16, fontFamily: "Lato",
    fontWeight: 600, fill: "#86efac", textAlign: "center",
  }),
]);

// ═══════════════════════════════════════════════════════════════════════════
// 7. Executive Premium
// ═══════════════════════════════════════════════════════════════════════════
const executivePremium = buildJson("#1a1a1a", [
  // Gold top line
  rect("gold-top", {
    left: 0, top: 0, width: W, height: 4,
    fill: "#c9a84c", stroke: "", strokeWidth: 0,
  }),
  // Gold bottom line
  rect("gold-bottom", {
    left: 0, top: H - 4, width: W, height: 4,
    fill: "#c9a84c", stroke: "", strokeWidth: 0,
  }),
  // Name
  txt("bc-name", "Your Name", {
    left: 80, top: 80, width: 550, fontSize: 36, fontFamily: "Cinzel",
    fontWeight: 700, fill: "#c9a84c",
  }),
  // Title
  txt("bc-title", "Chief Executive Officer", {
    left: 80, top: 130, width: 550, fontSize: 16, fontFamily: "Cinzel",
    fontWeight: 400, fill: "#a3a3a3",
  }),
  // Thin gold line
  line("gold-divider", 80, 170, 350, 170, {
    stroke: "#c9a84c", strokeWidth: 1,
    left: 80, top: 170,
  }),
  // Company
  txt("bc-company", "PREMIUM CORP", {
    left: 80, top: 185, width: 550, fontSize: 14, fontFamily: "Cinzel",
    fontWeight: 600, fill: "#d4d4d4", charSpacing: 300,
  }),
  // Contact
  txt("bc-phone", "+1 (555) 000-0000", {
    left: 80, top: 320, width: 400, fontSize: 13, fontFamily: "Inter",
    fontWeight: 300, fill: "#a3a3a3",
  }),
  txt("bc-email", "ceo@premiumcorp.com", {
    left: 80, top: 348, width: 400, fontSize: 13, fontFamily: "Inter",
    fontWeight: 300, fill: "#a3a3a3",
  }),
  txt("bc-website", "www.premiumcorp.com", {
    left: 80, top: 376, width: 400, fontSize: 13, fontFamily: "Inter",
    fontWeight: 300, fill: "#c9a84c",
  }),
  txt("bc-address", "One Executive Plaza, Suite 4000", {
    left: 80, top: 410, width: 500, fontSize: 12, fontFamily: "Inter",
    fontWeight: 300, fill: "#737373",
  }),
  // Logo placeholder
  rect("bc-logo-placeholder", {
    left: 790, top: 70, width: 180, height: 90,
    fill: "#262626", stroke: "#c9a84c", strokeWidth: 1, rx: 4, ry: 4,
    data: { quickEdit: "logo" },
  }),
  txt("logo-hint", "LOGO", {
    left: 847, top: 100, width: 80, fontSize: 16, fontFamily: "Cinzel",
    fontWeight: 600, fill: "#525252", textAlign: "center",
  }),
]);

// ═══════════════════════════════════════════════════════════════════════════
// 8. Vibrant Pop
// ═══════════════════════════════════════════════════════════════════════════
const vibrantPop = buildJson("#fef3c7", [
  // Big colored block (top-left)
  rect("pop-block-1", {
    left: 0, top: 0, width: 450, height: 250,
    fill: "#f97316", stroke: "", strokeWidth: 0,
  }),
  // Small accent block
  rect("pop-block-2", {
    left: 450, top: 0, width: 600, height: 60,
    fill: "#fb923c", stroke: "", strokeWidth: 0,
  }),
  // Name (over orange block)
  txt("bc-name", "Your Name", {
    left: 40, top: 50, width: 400, fontSize: 38, fontFamily: "Poppins",
    fontWeight: 800, fill: "#ffffff",
  }),
  // Title
  txt("bc-title", "Marketing Lead", {
    left: 40, top: 105, width: 400, fontSize: 18, fontFamily: "Poppins",
    fontWeight: 400, fill: "#fff7ed",
  }),
  // Company
  txt("bc-company", "Pop Agency", {
    left: 40, top: 150, width: 400, fontSize: 16, fontFamily: "Poppins",
    fontWeight: 600, fill: "#fdba74",
  }),
  // Contact (below blocks)
  txt("bc-phone", "+1 (555) 000-0000", {
    left: 40, top: 300, width: 400, fontSize: 14, fontFamily: "Poppins",
    fontWeight: 500, fill: "#92400e",
  }),
  txt("bc-email", "name@popagency.com", {
    left: 40, top: 330, width: 400, fontSize: 14, fontFamily: "Poppins",
    fontWeight: 500, fill: "#92400e",
  }),
  txt("bc-website", "popagency.com", {
    left: 40, top: 360, width: 400, fontSize: 14, fontFamily: "Poppins",
    fontWeight: 500, fill: "#f97316",
  }),
  txt("bc-address", "Creative District, Design City", {
    left: 40, top: 395, width: 400, fontSize: 12, fontFamily: "Poppins",
    fontWeight: 400, fill: "#b45309",
  }),
  // Logo placeholder
  rect("bc-logo-placeholder", {
    left: 780, top: 300, width: 200, height: 100,
    fill: "#fff7ed", stroke: "#f97316", strokeWidth: 2, rx: 12, ry: 12,
    data: { quickEdit: "logo" },
  }),
  txt("logo-hint", "LOGO", {
    left: 847, top: 335, width: 80, fontSize: 16, fontFamily: "Poppins",
    fontWeight: 700, fill: "#fdba74", textAlign: "center",
  }),
]);

// ── Export all templates ────────────────────────────────────────────────────

export const BUSINESS_CARD_TEMPLATES: FabricTemplate[] = [
  {
    id: "bc-modern-minimal",
    name: "Modern Minimal",
    category: "Professional",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: modernMinimal,
  },
  {
    id: "bc-corporate-bold",
    name: "Corporate Bold",
    category: "Professional",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: corporateBold,
  },
  {
    id: "bc-creative-gradient",
    name: "Creative Gradient",
    category: "Creative",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: creativeGradient,
  },
  {
    id: "bc-elegant-classic",
    name: "Elegant Classic",
    category: "Classic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: elegantClassic,
  },
  {
    id: "bc-tech-startup",
    name: "Tech Startup",
    category: "Tech",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: techStartup,
  },
  {
    id: "bc-nature-organic",
    name: "Nature Organic",
    category: "Lifestyle",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: natureOrganic,
  },
  {
    id: "bc-executive-premium",
    name: "Executive Premium",
    category: "Luxury",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: executivePremium,
    isPro: true,
  },
  {
    id: "bc-vibrant-pop",
    name: "Vibrant Pop",
    category: "Creative",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: vibrantPop,
  },
];
