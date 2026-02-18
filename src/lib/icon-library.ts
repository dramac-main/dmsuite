// =============================================================================
// DMSuite — Professional Canvas Icon Library (Asset Bank: Icons)
// =============================================================================
//
// A comprehensive, global, canvas-based icon library for all workspaces.
// Every icon is a pure function: (ctx, x, y, size, color, strokeWidth?) => void
// All icons are vector-drawn using Canvas2D path commands — infinitely scalable,
// fully colorable, and resolution-independent at any DPI.
//
// USAGE:
//   import { drawIcon, getIconsByCategory, ICON_CATEGORIES, ICON_REGISTRY } from "@/lib/icon-library";
//   drawIcon(ctx, "linkedin", x, y, 24, "#0a66c2");
//
// AI INTEGRATION:
//   The AI engines can reference any icon by string key.
//   Use getIconsByCategory() to list available icons per category.
//   Use ICON_REGISTRY for the full map of id → drawer function.
//   Use ICON_CATEGORIES for browsable category metadata.
//
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Signature for all icon drawing functions */
export type IconDrawFn = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  strokeWidth?: number
) => void;

/** Category metadata */
export interface IconCategory {
  id: string;
  label: string;
  description: string;
  count: number;
}

/** Full icon metadata */
export interface IconMeta {
  id: string;
  label: string;
  category: string;
  description: string;
  tags: string[];
  draw: IconDrawFn;
}

// ---------------------------------------------------------------------------
// Helper — setup & teardown for consistent rendering
// ---------------------------------------------------------------------------

function iconCtx(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  sw?: number
) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 24; // normalize: all icons designed on a 24×24 grid
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = sw ?? 1.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  return { s, restore: () => ctx.restore() };
}

// =============================================================================
//  SOCIAL MEDIA ICONS (20)
// =============================================================================

const drawLinkedin: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Rounded square
  ctx.beginPath();
  ctx.roundRect(-10, -10, 20, 20, 3);
  ctx.stroke();
  // L shape for "in"
  ctx.beginPath();
  ctx.moveTo(-6, -2); ctx.lineTo(-6, 7);
  ctx.stroke();
  // Dot
  ctx.beginPath();
  ctx.arc(-6, -5.5, 1.3, 0, Math.PI * 2);
  ctx.fill();
  // Person shape
  ctx.beginPath();
  ctx.moveTo(-1, 7); ctx.lineTo(-1, 1); ctx.quadraticCurveTo(-1, -2, 2, -2);
  ctx.quadraticCurveTo(5, -2, 5, 1); ctx.lineTo(5, 7);
  ctx.stroke();
  restore();
};

const drawTwitterX: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-7, -7); ctx.lineTo(7, 7);
  ctx.moveTo(7, -7); ctx.lineTo(-7, 7);
  ctx.stroke();
  restore();
};

const drawFacebook: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -10, 20, 20, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, 10); ctx.lineTo(1, 1); ctx.lineTo(5, 1);
  ctx.moveTo(-2, 1); ctx.lineTo(4, 1);
  ctx.moveTo(1, 1); ctx.quadraticCurveTo(1, -5, 5, -5); ctx.lineTo(6, -5);
  ctx.stroke();
  restore();
};

const drawInstagram: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -10, 20, 20, 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(6.5, -6.5, 1.2, 0, Math.PI * 2);
  ctx.fill();
  restore();
};

const drawYoutube: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -7, 20, 14, 4);
  ctx.stroke();
  // Play triangle
  ctx.beginPath();
  ctx.moveTo(-3, -4); ctx.lineTo(-3, 4); ctx.lineTo(5, 0); ctx.closePath();
  ctx.fill();
  restore();
};

const drawTiktok: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Musical note shape
  ctx.beginPath();
  ctx.moveTo(2, -9); ctx.lineTo(2, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-1, 5, 3.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, -9); ctx.quadraticCurveTo(6, -9, 7, -5);
  ctx.stroke();
  restore();
};

const drawPinterest: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.stroke();
  // P pin
  ctx.beginPath();
  ctx.moveTo(-2, 10); ctx.lineTo(0, 2);
  ctx.moveTo(0, 2); ctx.lineTo(0, -3);
  ctx.quadraticCurveTo(0, -7, 4, -7); ctx.quadraticCurveTo(7, -7, 7, -3);
  ctx.quadraticCurveTo(7, 1, 0, 2);
  ctx.stroke();
  restore();
};

const drawSnapchat: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Ghost shape
  ctx.beginPath();
  ctx.moveTo(-7, 3);
  ctx.quadraticCurveTo(-5, 1, -3, 2);
  ctx.quadraticCurveTo(-4, -3, -6, -6);
  ctx.quadraticCurveTo(-4, -10, 0, -10);
  ctx.quadraticCurveTo(4, -10, 6, -6);
  ctx.quadraticCurveTo(4, -3, 3, 2);
  ctx.quadraticCurveTo(5, 1, 7, 3);
  ctx.stroke();
  // Eyes
  ctx.beginPath();
  ctx.arc(-2.5, -4, 1, 0, Math.PI * 2);
  ctx.arc(2.5, -4, 1, 0, Math.PI * 2);
  ctx.fill();
  restore();
};

const drawWhatsapp: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, -1, 9, 0, Math.PI * 2);
  ctx.stroke();
  // Chat bubble tail
  ctx.beginPath();
  ctx.moveTo(-3, 8); ctx.lineTo(-7, 11); ctx.lineTo(-2, 8);
  ctx.stroke();
  // Phone handset
  ctx.beginPath();
  ctx.moveTo(-4, -3);
  ctx.quadraticCurveTo(-4, 1, -1, 3);
  ctx.quadraticCurveTo(2, 5, 4, 3);
  ctx.stroke();
  restore();
};

const drawTelegram: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Paper plane
  ctx.beginPath();
  ctx.moveTo(-10, 0); ctx.lineTo(10, -6); ctx.lineTo(2, 2); ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, 2); ctx.lineTo(0, 8); ctx.lineTo(-2, 2);
  ctx.stroke();
  restore();
};

const drawReddit: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, 1, 8, 0, Math.PI * 2);
  ctx.stroke();
  // Eyes
  ctx.beginPath();
  ctx.arc(-3, -1, 1.5, 0, Math.PI * 2);
  ctx.arc(3, -1, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Antenna
  ctx.beginPath();
  ctx.moveTo(2, -7); ctx.lineTo(5, -10);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(6, -10, 1.5, 0, Math.PI * 2);
  ctx.stroke();
  // Smile
  ctx.beginPath();
  ctx.arc(0, 2, 4, 0.2, Math.PI - 0.2);
  ctx.stroke();
  restore();
};

const drawDiscord: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Controller-like shape
  ctx.beginPath();
  ctx.moveTo(-8, -3);
  ctx.quadraticCurveTo(-8, -8, -4, -8); ctx.lineTo(4, -8);
  ctx.quadraticCurveTo(8, -8, 8, -3); ctx.lineTo(8, 3);
  ctx.quadraticCurveTo(8, 7, 5, 8); ctx.lineTo(3, 5);
  ctx.lineTo(-3, 5); ctx.lineTo(-5, 8);
  ctx.quadraticCurveTo(-8, 7, -8, 3);
  ctx.closePath();
  ctx.stroke();
  // Eyes
  ctx.beginPath();
  ctx.arc(-3, -1, 1.8, 0, Math.PI * 2);
  ctx.arc(3, -1, 1.8, 0, Math.PI * 2);
  ctx.fill();
  restore();
};

const drawGithub: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, -1, 9, 0, Math.PI * 2);
  ctx.stroke();
  // Octocat simplified
  ctx.beginPath();
  ctx.moveTo(-3, 8); ctx.quadraticCurveTo(-3, 4, -5, 3);
  ctx.moveTo(3, 8); ctx.quadraticCurveTo(3, 4, 5, 3);
  ctx.stroke();
  // Eyes
  ctx.beginPath();
  ctx.arc(-3, -3, 1.2, 0, Math.PI * 2);
  ctx.arc(3, -3, 1.2, 0, Math.PI * 2);
  ctx.fill();
  restore();
};

const drawDribbble: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.stroke();
  // Bounce lines
  ctx.beginPath();
  ctx.moveTo(-10, -2); ctx.quadraticCurveTo(0, -10, 10, -2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6, 8); ctx.quadraticCurveTo(0, 0, 8, 6);
  ctx.stroke();
  restore();
};

const drawBehance: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.lineWidth = 2;
  // B letter
  ctx.beginPath();
  ctx.moveTo(-9, -6); ctx.lineTo(-9, 6);
  ctx.moveTo(-9, -6); ctx.lineTo(-4, -6);
  ctx.quadraticCurveTo(-1, -6, -1, -3); ctx.quadraticCurveTo(-1, 0, -4, 0);
  ctx.moveTo(-9, 0); ctx.lineTo(-3, 0);
  ctx.quadraticCurveTo(0, 0, 0, 3); ctx.quadraticCurveTo(0, 6, -3, 6);
  ctx.lineTo(-9, 6);
  ctx.stroke();
  // e letter (right side)
  ctx.beginPath();
  ctx.moveTo(3, 0); ctx.lineTo(9, 0);
  ctx.moveTo(9, 0); ctx.quadraticCurveTo(9, -5, 6, -5);
  ctx.quadraticCurveTo(3, -5, 3, 0);
  ctx.quadraticCurveTo(3, 5, 6, 5); ctx.quadraticCurveTo(9, 5, 9, 2);
  ctx.stroke();
  // Top bar
  ctx.beginPath();
  ctx.moveTo(3, -8); ctx.lineTo(9, -8);
  ctx.stroke();
  restore();
};

const drawSpotify: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.stroke();
  // Sound waves
  ctx.beginPath();
  ctx.arc(0, 0, 7, -0.7, 0.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, -0.6, 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 2, -0.5, 0.5);
  ctx.stroke();
  restore();
};

const drawSlack: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Four dots + bars representing Slack hash
  const r = 2;
  const g = 3;
  ctx.beginPath(); ctx.arc(-g, -g, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(g, -g, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-g, g, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(g, g, r, 0, Math.PI * 2); ctx.fill();
  // Connecting lines
  ctx.beginPath();
  ctx.moveTo(-g, -g - r); ctx.lineTo(-g, -8);
  ctx.moveTo(g, -g - r); ctx.lineTo(g + 5, -g);
  ctx.moveTo(-g, g + r); ctx.lineTo(-g - 5, g);
  ctx.moveTo(g, g + r); ctx.lineTo(g, 8);
  ctx.stroke();
  restore();
};

const drawThreads: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // @ like shape
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0.3, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(1, -1, 4, 0, Math.PI * 2);
  ctx.stroke();
  restore();
};

const drawMastodon: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Elephant-like shape
  ctx.beginPath();
  ctx.roundRect(-8, -9, 16, 14, 4);
  ctx.stroke();
  // Trunk
  ctx.beginPath();
  ctx.moveTo(-4, 5); ctx.quadraticCurveTo(-4, 9, 0, 9);
  ctx.quadraticCurveTo(4, 9, 4, 5);
  ctx.stroke();
  // Eye
  ctx.beginPath();
  ctx.arc(0, -3, 1.3, 0, Math.PI * 2);
  ctx.fill();
  restore();
};

const drawBluesky: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Butterfly shape
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.quadraticCurveTo(-8, -10, -9, -2);
  ctx.quadraticCurveTo(-9, 4, 0, 5);
  ctx.quadraticCurveTo(9, 4, 9, -2);
  ctx.quadraticCurveTo(8, -10, 0, -3);
  ctx.stroke();
  // Stem
  ctx.beginPath();
  ctx.moveTo(0, 5); ctx.lineTo(0, 10);
  ctx.stroke();
  restore();
};

// =============================================================================
//  CONTACT & COMMUNICATION ICONS (15)
// =============================================================================

const drawPhone: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-7, 10);
  ctx.quadraticCurveTo(-10, 7, -6, 2);
  ctx.quadraticCurveTo(-2, -4, 2, -6);
  ctx.quadraticCurveTo(7, -10, 10, -7);
  ctx.quadraticCurveTo(10, -5, 7, -3);
  ctx.lineTo(4, -1);
  ctx.quadraticCurveTo(2, 0, 0, 0);
  ctx.quadraticCurveTo(0, 2, -1, 4);
  ctx.lineTo(-3, 7);
  ctx.quadraticCurveTo(-5, 10, -7, 10);
  ctx.stroke();
  restore();
};

const drawEmail: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Envelope
  ctx.beginPath();
  ctx.roundRect(-10, -6, 20, 13, 2);
  ctx.stroke();
  // Flap
  ctx.beginPath();
  ctx.moveTo(-10, -6); ctx.lineTo(0, 2); ctx.lineTo(10, -6);
  ctx.stroke();
  restore();
};

const drawGlobe: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  const r = 9;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.45, r, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, -r * 0.4); ctx.quadraticCurveTo(0, -r * 0.25, r * 0.85, -r * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, r * 0.4); ctx.quadraticCurveTo(0, r * 0.25, r * 0.85, r * 0.4);
  ctx.stroke();
  restore();
};

const drawMapPin: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.quadraticCurveTo(-10, -2, -8, -5);
  ctx.arc(0, -5, 8, Math.PI, 0);
  ctx.quadraticCurveTo(10, -2, 0, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -5, 3, 0, Math.PI * 2);
  ctx.stroke();
  restore();
};

const drawChat: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -8, 20, 14, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3, 6); ctx.lineTo(-6, 10); ctx.lineTo(0, 6);
  ctx.stroke();
  // Chat dots
  ctx.beginPath();
  ctx.arc(-4, -1, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -1, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.arc(4, -1, 1.2, 0, Math.PI * 2); ctx.fill();
  restore();
};

const drawVideoCall: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -6, 14, 12, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5, -4); ctx.lineTo(10, -7); ctx.lineTo(10, 7); ctx.lineTo(5, 4);
  ctx.stroke();
  restore();
};

const drawFax: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-9, -4, 18, 14, 2);
  ctx.stroke();
  // Paper coming out
  ctx.beginPath();
  ctx.moveTo(-5, -4); ctx.lineTo(-5, -9); ctx.lineTo(5, -9); ctx.lineTo(5, -4);
  ctx.stroke();
  // Buttons
  ctx.fillRect(-5, 2, 3, 2);
  ctx.fillRect(-1, 2, 3, 2);
  ctx.fillRect(3, 2, 3, 2);
  ctx.fillRect(-5, 6, 3, 2);
  ctx.fillRect(-1, 6, 3, 2);
  ctx.fillRect(3, 6, 3, 2);
  restore();
};

const drawMobile: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-6, -10, 12, 20, 2);
  ctx.stroke();
  // Screen
  ctx.beginPath();
  ctx.moveTo(-6, -6); ctx.lineTo(6, -6);
  ctx.moveTo(-6, 6); ctx.lineTo(6, 6);
  ctx.stroke();
  // Home button
  ctx.beginPath();
  ctx.arc(0, 8, 1.2, 0, Math.PI * 2);
  ctx.stroke();
  restore();
};

const drawAt: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0.3, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 0); ctx.lineTo(9, 0);
  ctx.stroke();
  restore();
};

const drawLink: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-2, 2); ctx.lineTo(2, -2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-7, 3); ctx.lineTo(-3, 7);
  ctx.arc(-5, 5, Math.SQRT2 * 2.8, Math.PI * 0.25, Math.PI * 1.25, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, -7); ctx.lineTo(7, -3);
  ctx.arc(5, -5, Math.SQRT2 * 2.8, Math.PI * 0.25, Math.PI * 1.25, true);
  ctx.stroke();
  restore();
};

const drawHeadphones: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, 0, 9, Math.PI, 0);
  ctx.stroke();
  // Left earphone
  ctx.beginPath();
  ctx.roundRect(-10, 0, 4, 8, 1.5);
  ctx.stroke();
  // Right earphone
  ctx.beginPath();
  ctx.roundRect(6, 0, 4, 8, 1.5);
  ctx.stroke();
  restore();
};

const drawMicrophone: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-3.5, -10, 7, 12, 3.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -2, 7, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 5); ctx.lineTo(0, 9);
  ctx.moveTo(-4, 9); ctx.lineTo(4, 9);
  ctx.stroke();
  restore();
};

const drawSend: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-8, -8); ctx.lineTo(10, 0); ctx.lineTo(-8, 8); ctx.lineTo(-4, 0); ctx.closePath();
  ctx.stroke();
  restore();
};

const drawInbox: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-10, 2); ctx.lineTo(-10, 8); ctx.lineTo(10, 8); ctx.lineTo(10, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, 2); ctx.lineTo(-5, 2); ctx.quadraticCurveTo(-3, 6, 0, 6);
  ctx.quadraticCurveTo(3, 6, 5, 2); ctx.lineTo(10, 2);
  ctx.stroke();
  // Arrow
  ctx.beginPath();
  ctx.moveTo(0, -9); ctx.lineTo(0, 0);
  ctx.moveTo(-3, -3); ctx.lineTo(0, 0); ctx.lineTo(3, -3);
  ctx.stroke();
  restore();
};

const drawQrCode: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Top-left square
  ctx.strokeRect(-10, -10, 8, 8);
  ctx.fillRect(-8, -8, 4, 4);
  // Top-right square
  ctx.strokeRect(2, -10, 8, 8);
  ctx.fillRect(4, -8, 4, 4);
  // Bottom-left square
  ctx.strokeRect(-10, 2, 8, 8);
  ctx.fillRect(-8, 4, 4, 4);
  // Data dots
  ctx.fillRect(3, 3, 3, 3);
  ctx.fillRect(7, 7, 3, 3);
  ctx.fillRect(3, 7, 3, 3);
  restore();
};

// =============================================================================
//  BUSINESS & PROFESSIONAL ICONS (20)
// =============================================================================

const drawBriefcase: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -4, 20, 14, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-4, -4); ctx.lineTo(-4, -8); ctx.lineTo(4, -8); ctx.lineTo(4, -4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, 2); ctx.lineTo(10, 2);
  ctx.stroke();
  restore();
};

const drawBuilding: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-7, 10); ctx.lineTo(-7, -8); ctx.lineTo(7, -8); ctx.lineTo(7, 10);
  ctx.stroke();
  // Windows
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      ctx.strokeRect(-5 + col * 6, -6 + row * 5, 4, 3);
    }
  }
  // Door
  ctx.beginPath();
  ctx.moveTo(-2, 10); ctx.lineTo(-2, 7); ctx.lineTo(2, 7); ctx.lineTo(2, 10);
  ctx.stroke();
  restore();
};

const drawCalendar: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -7, 20, 17, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, -2); ctx.lineTo(10, -2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5, -10); ctx.lineTo(-5, -5);
  ctx.moveTo(5, -10); ctx.lineTo(5, -5);
  ctx.stroke();
  // Date dots
  ctx.fillRect(-6, 1, 3, 2);
  ctx.fillRect(-1, 1, 3, 2);
  ctx.fillRect(4, 1, 3, 2);
  ctx.fillRect(-6, 5, 3, 2);
  ctx.fillRect(-1, 5, 3, 2);
  restore();
};

const drawClock: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, -6);
  ctx.moveTo(0, 0); ctx.lineTo(4, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  restore();
};

const drawDollar: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -7); ctx.lineTo(0, 7);
  ctx.stroke();
  ctx.lineWidth = sw ?? 1.8;
  ctx.beginPath();
  ctx.moveTo(3, -4); ctx.quadraticCurveTo(-5, -4, -3, 0);
  ctx.quadraticCurveTo(-1, 3, 3, 4); ctx.quadraticCurveTo(5, 5, -3, 4);
  ctx.stroke();
  restore();
};

const drawChartBar: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-10, 10); ctx.lineTo(10, 10);
  ctx.stroke();
  ctx.fillRect(-8, 2, 4, 8);
  ctx.fillRect(-2, -3, 4, 13);
  ctx.fillRect(4, -7, 4, 17);
  restore();
};

const drawChartLine: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-10, 10); ctx.lineTo(-10, -10);
  ctx.moveTo(-10, 10); ctx.lineTo(10, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-7, 5); ctx.lineTo(-2, -2); ctx.lineTo(3, 2); ctx.lineTo(8, -6);
  ctx.stroke();
  // Data points
  [[-7, 5], [-2, -2], [3, 2], [8, -6]].forEach(([px, py]) => {
    ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
  });
  restore();
};

const drawUsers: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Person 1
  ctx.beginPath();
  ctx.arc(-3, -5, 3.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-3, 8, 7, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
  // Person 2
  ctx.beginPath();
  ctx.arc(5, -5, 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(5, 8, 6, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
  restore();
};

const drawUser: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, -5, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 10, 9, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  restore();
};

const drawHandshake: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-10, 0); ctx.lineTo(-5, -4); ctx.lineTo(0, -1); ctx.lineTo(5, -4); ctx.lineTo(10, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5, -4); ctx.lineTo(-3, 3);
  ctx.moveTo(5, -4); ctx.lineTo(3, 3);
  ctx.moveTo(-3, 3); ctx.lineTo(3, 3);
  ctx.stroke();
  restore();
};

const drawAward: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, -3, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-4, 3); ctx.lineTo(-5, 10); ctx.lineTo(0, 7); ctx.lineTo(5, 10); ctx.lineTo(4, 3);
  ctx.stroke();
  restore();
};

const drawTarget: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
  restore();
};

const drawPresentation: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-10, -9); ctx.lineTo(10, -9);
  ctx.stroke();
  ctx.strokeRect(-10, -9, 20, 14);
  ctx.beginPath();
  ctx.moveTo(0, 5); ctx.lineTo(0, 10);
  ctx.moveTo(-4, 10); ctx.lineTo(4, 10);
  ctx.stroke();
  // Chart inside
  ctx.beginPath();
  ctx.moveTo(-5, 3); ctx.lineTo(-2, -2); ctx.lineTo(2, 0); ctx.lineTo(6, -5);
  ctx.stroke();
  restore();
};

const drawCertificate: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.strokeRect(-10, -8, 20, 16);
  // Lines
  ctx.beginPath();
  ctx.moveTo(-6, -4); ctx.lineTo(6, -4);
  ctx.moveTo(-6, -1); ctx.lineTo(6, -1);
  ctx.moveTo(-6, 2); ctx.lineTo(2, 2);
  ctx.stroke();
  // Seal
  ctx.beginPath();
  ctx.arc(5, 5, 3, 0, Math.PI * 2);
  ctx.stroke();
  restore();
};

const drawInvoice: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-7, -10); ctx.lineTo(-7, 10); ctx.lineTo(7, 10); ctx.lineTo(7, -6);
  ctx.lineTo(3, -10); ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, -10); ctx.lineTo(3, -6); ctx.lineTo(7, -6);
  ctx.stroke();
  // Lines
  ctx.beginPath();
  ctx.moveTo(-4, -4); ctx.lineTo(4, -4);
  ctx.moveTo(-4, -1); ctx.lineTo(4, -1);
  ctx.moveTo(-4, 2); ctx.lineTo(2, 2);
  ctx.moveTo(-4, 6); ctx.lineTo(4, 6);
  ctx.stroke();
  restore();
};

const drawContract: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.strokeRect(-8, -10, 16, 20);
  ctx.beginPath();
  ctx.moveTo(-5, -6); ctx.lineTo(5, -6);
  ctx.moveTo(-5, -3); ctx.lineTo(5, -3);
  ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
  ctx.moveTo(-5, 3); ctx.lineTo(3, 3);
  ctx.stroke();
  // Signature squiggle
  ctx.beginPath();
  ctx.moveTo(-3, 7); ctx.quadraticCurveTo(0, 5, 2, 7); ctx.quadraticCurveTo(4, 9, 5, 7);
  ctx.stroke();
  restore();
};

const drawLightbulb: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, -3, 7, Math.PI * 0.7, Math.PI * 0.3, true);
  ctx.quadraticCurveTo(5, 4, 3, 6);
  ctx.lineTo(-3, 6);
  ctx.quadraticCurveTo(-5, 4, -5.5, 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3, 6); ctx.lineTo(-3, 9); ctx.lineTo(3, 9); ctx.lineTo(3, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2, 9); ctx.lineTo(2, 9);
  ctx.stroke();
  restore();
};

const drawRocket: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.quadraticCurveTo(6, -6, 6, 2);
  ctx.lineTo(3, 6); ctx.lineTo(-3, 6); ctx.lineTo(-6, 2);
  ctx.quadraticCurveTo(-6, -6, 0, -10);
  ctx.stroke();
  // Window
  ctx.beginPath();
  ctx.arc(0, -2, 2, 0, Math.PI * 2);
  ctx.stroke();
  // Fins
  ctx.beginPath();
  ctx.moveTo(-6, 2); ctx.lineTo(-9, 6); ctx.lineTo(-3, 6);
  ctx.moveTo(6, 2); ctx.lineTo(9, 6); ctx.lineTo(3, 6);
  ctx.stroke();
  // Flame
  ctx.beginPath();
  ctx.moveTo(-2, 6); ctx.quadraticCurveTo(0, 10, 2, 6);
  ctx.stroke();
  restore();
};

const drawGem: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(0, 10); ctx.lineTo(-10, -2); ctx.lineTo(-6, -8);
  ctx.lineTo(6, -8); ctx.lineTo(10, -2); ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, -2); ctx.lineTo(10, -2);
  ctx.moveTo(-6, -8); ctx.lineTo(-2, -2); ctx.lineTo(0, 10);
  ctx.moveTo(6, -8); ctx.lineTo(2, -2); ctx.lineTo(0, 10);
  ctx.stroke();
  restore();
};

const drawShield: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(0, -10); ctx.lineTo(9, -5);
  ctx.quadraticCurveTo(9, 5, 0, 10);
  ctx.quadraticCurveTo(-9, 5, -9, -5);
  ctx.closePath();
  ctx.stroke();
  // Checkmark
  ctx.beginPath();
  ctx.moveTo(-3, 0); ctx.lineTo(-1, 3); ctx.lineTo(4, -3);
  ctx.stroke();
  restore();
};

// =============================================================================
//  CREATIVE & DESIGN ICONS (15)
// =============================================================================

const drawPalette: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-2, 10);
  ctx.quadraticCurveTo(-10, 8, -10, 0);
  ctx.quadraticCurveTo(-10, -10, 0, -10);
  ctx.quadraticCurveTo(10, -10, 10, -2);
  ctx.quadraticCurveTo(10, 2, 6, 2);
  ctx.quadraticCurveTo(3, 2, 3, 5);
  ctx.quadraticCurveTo(3, 8, -2, 10);
  ctx.stroke();
  // Paint blobs
  ctx.beginPath(); ctx.arc(-5, -4, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -6, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -4, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-4, 2, 1.5, 0, Math.PI * 2); ctx.fill();
  restore();
};

const drawPen: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(8, -8); ctx.lineTo(-6, 6); ctx.lineTo(-8, 10); ctx.lineTo(-4, 8); ctx.lineTo(10, -6); ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5, -5); ctx.lineTo(7, -3);
  ctx.stroke();
  restore();
};

const drawCamera: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -5, 20, 15, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-4, -5); ctx.lineTo(-2, -9); ctx.lineTo(2, -9); ctx.lineTo(4, -5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 2, 4.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 2, 2, 0, Math.PI * 2);
  ctx.stroke();
  restore();
};

const drawFilm: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.strokeRect(-10, -8, 20, 16);
  // Sprocket holes
  for (let i = -6; i <= 6; i += 4) {
    ctx.fillRect(-9, i - 1, 2, 2);
    ctx.fillRect(7, i - 1, 2, 2);
  }
  // Frame
  ctx.strokeRect(-5, -5, 10, 10);
  restore();
};

const drawMusic: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-4, 6); ctx.lineTo(-4, -8); ctx.lineTo(6, -10); ctx.lineTo(6, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-6, 6, 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(4, 4, 3, 0, Math.PI * 2);
  ctx.stroke();
  restore();
};

const drawBrush: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-2, 10); ctx.lineTo(-2, 2); ctx.lineTo(2, 2); ctx.lineTo(2, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3, 2); ctx.lineTo(-4, -4); ctx.quadraticCurveTo(-3, -10, 0, -10);
  ctx.quadraticCurveTo(3, -10, 4, -4); ctx.lineTo(3, 2);
  ctx.stroke();
  restore();
};

const drawLayers: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(0, -8); ctx.lineTo(10, -2); ctx.lineTo(0, 0); ctx.lineTo(-10, -2); ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, 2); ctx.lineTo(0, 4); ctx.lineTo(10, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, 6); ctx.lineTo(0, 8); ctx.lineTo(10, 6);
  ctx.stroke();
  restore();
};

const drawGrid: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.strokeRect(-10, -10, 20, 20);
  ctx.beginPath();
  ctx.moveTo(-10, -3); ctx.lineTo(10, -3);
  ctx.moveTo(-10, 4); ctx.lineTo(10, 4);
  ctx.moveTo(-3, -10); ctx.lineTo(-3, 10);
  ctx.moveTo(4, -10); ctx.lineTo(4, 10);
  ctx.stroke();
  restore();
};

const drawCrop: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-6, -10); ctx.lineTo(-6, 6); ctx.lineTo(10, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, -6); ctx.lineTo(6, -6); ctx.lineTo(6, 10);
  ctx.stroke();
  restore();
};

const drawWand: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-8, 8); ctx.lineTo(6, -6);
  ctx.stroke();
  // Sparkles
  const spark = (sx: number, sy: number, s: number) => {
    ctx.beginPath();
    ctx.moveTo(sx, sy - s); ctx.lineTo(sx, sy + s);
    ctx.moveTo(sx - s, sy); ctx.lineTo(sx + s, sy);
    ctx.stroke();
  };
  spark(7, -8, 2.5);
  spark(3, -2, 1.5);
  spark(9, -2, 1.5);
  restore();
};

const drawEye: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.quadraticCurveTo(-5, -7, 0, -7); ctx.quadraticCurveTo(5, -7, 10, 0);
  ctx.quadraticCurveTo(5, 7, 0, 7); ctx.quadraticCurveTo(-5, 7, -10, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
  ctx.fill();
  restore();
};

const drawDownload: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(0, -8); ctx.lineTo(0, 4);
  ctx.moveTo(-4, 0); ctx.lineTo(0, 4); ctx.lineTo(4, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8, 7); ctx.lineTo(-8, 10); ctx.lineTo(8, 10); ctx.lineTo(8, 7);
  ctx.stroke();
  restore();
};

const drawUpload: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(0, 4); ctx.lineTo(0, -8);
  ctx.moveTo(-4, -4); ctx.lineTo(0, -8); ctx.lineTo(4, -4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8, 7); ctx.lineTo(-8, 10); ctx.lineTo(8, 10); ctx.lineTo(8, 7);
  ctx.stroke();
  restore();
};

const drawPrint: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -3, 20, 12, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6, -3); ctx.lineTo(-6, -9); ctx.lineTo(6, -9); ctx.lineTo(6, -3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6, 4); ctx.lineTo(-6, 10); ctx.lineTo(6, 10); ctx.lineTo(6, 4);
  ctx.stroke();
  restore();
};

const drawColorSwatch: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -8, 8, 16, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-4, -8, 8, 16, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(2, -8, 8, 16, 4);
  ctx.stroke();
  restore();
};

// =============================================================================
//  TECHNOLOGY & WEB ICONS (15)
// =============================================================================

const drawCode: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-4, -6); ctx.lineTo(-9, 0); ctx.lineTo(-4, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -6); ctx.lineTo(9, 0); ctx.lineTo(4, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, -8); ctx.lineTo(-2, 8);
  ctx.stroke();
  restore();
};

const drawServer: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-9, -10, 18, 8, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-9, 1, 18, 8, 2);
  ctx.stroke();
  // Dots
  ctx.beginPath(); ctx.arc(-5, -6, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-5, 5, 1.2, 0, Math.PI * 2); ctx.fill();
  // Lines
  ctx.beginPath();
  ctx.moveTo(-1, -6); ctx.lineTo(6, -6);
  ctx.moveTo(-1, 5); ctx.lineTo(6, 5);
  ctx.stroke();
  restore();
};

const drawCloud: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(-3, 0, 6, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(2, -4, 5, Math.PI * 1.1, Math.PI * 0.1);
  ctx.arc(6, 0, 4, Math.PI * 1.5, Math.PI * 0.5);
  ctx.lineTo(-3, 6);
  ctx.closePath();
  ctx.stroke();
  restore();
};

const drawWifi: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath(); ctx.arc(0, 8, 10, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 8, 6, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 8, 2, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 6, 1.5, 0, Math.PI * 2); ctx.fill();
  restore();
};

const drawDatabase: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.ellipse(0, -7, 9, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-9, -7); ctx.lineTo(-9, 7);
  ctx.moveTo(9, -7); ctx.lineTo(9, 7);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 7, 9, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 3, 0, 0, Math.PI);
  ctx.stroke();
  restore();
};

const drawCpu: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.strokeRect(-7, -7, 14, 14);
  ctx.strokeRect(-4, -4, 8, 8);
  // Pins
  for (let i = -4; i <= 4; i += 4) {
    ctx.beginPath(); ctx.moveTo(i, -7); ctx.lineTo(i, -10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 7); ctx.lineTo(i, 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7, i); ctx.lineTo(-10, i); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, i); ctx.lineTo(10, i); ctx.stroke();
  }
  restore();
};

const drawLock: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-7, -2, 14, 12, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -2, 5, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 4, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 5.5); ctx.lineTo(0, 7);
  ctx.stroke();
  restore();
};

const drawSettings: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.stroke();
  // Gear teeth
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const ix = Math.cos(a) * 7;
    const iy = Math.sin(a) * 7;
    const ox = Math.cos(a) * 10;
    const oy = Math.sin(a) * 10;
    ctx.beginPath();
    ctx.moveTo(ix, iy); ctx.lineTo(ox, oy);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.stroke();
  restore();
};

const drawTerminal: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -7, 20, 14, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6, -3); ctx.lineTo(-2, 0); ctx.lineTo(-6, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 3); ctx.lineTo(5, 3);
  ctx.stroke();
  restore();
};

const drawApi: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Connected nodes
  ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(-8, -6, 2.5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(8, -6, 2.5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(-8, 6, 2.5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(8, 6, 2.5, 0, Math.PI * 2); ctx.stroke();
  // Lines
  ctx.beginPath();
  ctx.moveTo(-2, -2); ctx.lineTo(-6, -5);
  ctx.moveTo(2, -2); ctx.lineTo(6, -5);
  ctx.moveTo(-2, 2); ctx.lineTo(-6, 5);
  ctx.moveTo(2, 2); ctx.lineTo(6, 5);
  ctx.stroke();
  restore();
};

const drawBolt: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(2, -10); ctx.lineTo(-5, 1); ctx.lineTo(0, 1);
  ctx.lineTo(-2, 10); ctx.lineTo(5, -1); ctx.lineTo(0, -1);
  ctx.closePath();
  ctx.stroke();
  restore();
};

const drawAi: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Brain-like shape
  ctx.beginPath();
  ctx.arc(-2, -2, 8, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(2, -2, 8, Math.PI * 1.5, Math.PI * 0.5);
  ctx.stroke();
  // Neural connections
  ctx.beginPath();
  ctx.moveTo(-3, -6); ctx.quadraticCurveTo(0, -3, 3, -6);
  ctx.moveTo(-3, -1); ctx.quadraticCurveTo(0, 2, 3, -1);
  ctx.moveTo(-2, 4); ctx.quadraticCurveTo(0, 7, 2, 4);
  ctx.stroke();
  restore();
};

const drawRobot: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-8, -5, 16, 12, 3);
  ctx.stroke();
  // Antenna
  ctx.beginPath();
  ctx.moveTo(0, -5); ctx.lineTo(0, -9);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -9, 1.5, 0, Math.PI * 2); ctx.fill();
  // Eyes
  ctx.beginPath(); ctx.arc(-3, 0, 2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(3, 0, 2, 0, Math.PI * 2); ctx.stroke();
  // Mouth
  ctx.beginPath();
  ctx.moveTo(-3, 4); ctx.lineTo(3, 4);
  ctx.stroke();
  // Ears
  ctx.beginPath();
  ctx.moveTo(-8, -1); ctx.lineTo(-11, -1); ctx.lineTo(-11, 3); ctx.lineTo(-8, 3);
  ctx.moveTo(8, -1); ctx.lineTo(11, -1); ctx.lineTo(11, 3); ctx.lineTo(8, 3);
  ctx.stroke();
  restore();
};

const drawMagnet: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, -2, 8, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8, -2); ctx.lineTo(-8, 6);
  ctx.moveTo(-4, -2); ctx.lineTo(-4, 6);
  ctx.moveTo(4, -2); ctx.lineTo(4, 6);
  ctx.moveTo(8, -2); ctx.lineTo(8, 6);
  ctx.stroke();
  // Horizontal caps
  ctx.beginPath();
  ctx.moveTo(-8, 2); ctx.lineTo(-4, 2);
  ctx.moveTo(4, 2); ctx.lineTo(8, 2);
  ctx.stroke();
  restore();
};

const drawFingerprint: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath(); ctx.arc(0, 0, 9, 0.5, Math.PI * 2 - 0.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 6, 1, Math.PI * 2 - 0.3); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 3, 0.8, Math.PI * 2); ctx.stroke();
  restore();
};

// =============================================================================
//  NATURE & LIFESTYLE ICONS (10)
// =============================================================================

const drawHeart: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.quadraticCurveTo(-12, -2, -5, -8);
  ctx.quadraticCurveTo(0, -10, 0, -4);
  ctx.quadraticCurveTo(0, -10, 5, -8);
  ctx.quadraticCurveTo(12, -2, 0, 8);
  ctx.stroke();
  restore();
};

const drawStar: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerA = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const innerA = outerA + Math.PI / 5;
    const ox = Math.cos(outerA) * 10;
    const oy = Math.sin(outerA) * 10;
    const ix = Math.cos(innerA) * 4.5;
    const iy = Math.sin(innerA) * 4.5;
    if (i === 0) { ctx.moveTo(ox, oy); } else { ctx.lineTo(ox, oy); }
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.stroke();
  restore();
};

const drawSun: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
    ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
    ctx.stroke();
  }
  restore();
};

const drawMoon: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0.5, Math.PI * 2 - 0.5);
  ctx.quadraticCurveTo(-4, 0, 0, 0);
  ctx.stroke();
  restore();
};

const drawLeaf: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-8, 8);
  ctx.quadraticCurveTo(-8, -4, 0, -8);
  ctx.quadraticCurveTo(8, -4, 8, 8);
  ctx.quadraticCurveTo(0, 4, -8, 8);
  ctx.stroke();
  // Vein
  ctx.beginPath();
  ctx.moveTo(0, -6); ctx.lineTo(0, 6);
  ctx.stroke();
  restore();
};

const drawTree: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Trunk
  ctx.beginPath();
  ctx.moveTo(-1.5, 4); ctx.lineTo(-1.5, 10);
  ctx.moveTo(1.5, 4); ctx.lineTo(1.5, 10);
  ctx.stroke();
  // Canopy
  ctx.beginPath();
  ctx.moveTo(0, -10); ctx.lineTo(7, -2); ctx.lineTo(4, -2);
  ctx.lineTo(9, 4); ctx.lineTo(-9, 4);
  ctx.lineTo(-4, -2); ctx.lineTo(-7, -2);
  ctx.closePath();
  ctx.stroke();
  restore();
};

const drawFlame: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.quadraticCurveTo(8, -4, 6, 3);
  ctx.quadraticCurveTo(5, 8, 0, 10);
  ctx.quadraticCurveTo(-5, 8, -6, 3);
  ctx.quadraticCurveTo(-8, -4, 0, -10);
  ctx.stroke();
  // Inner flame
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.quadraticCurveTo(3, 2, 2, 5);
  ctx.quadraticCurveTo(1, 8, 0, 10);
  ctx.quadraticCurveTo(-1, 8, -2, 5);
  ctx.quadraticCurveTo(-3, 2, 0, -2);
  ctx.stroke();
  restore();
};

const drawDrop: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.quadraticCurveTo(10, 2, 7, 6);
  ctx.arc(0, 4, 7, 0.3, Math.PI - 0.3);
  ctx.quadraticCurveTo(-10, 2, 0, -10);
  ctx.stroke();
  restore();
};

const drawCoffee: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-8, -3, 14, 13, 2);
  ctx.stroke();
  // Handle
  ctx.beginPath();
  ctx.arc(6, 3, 4, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // Steam
  ctx.beginPath();
  ctx.moveTo(-4, -3); ctx.quadraticCurveTo(-4, -7, -2, -7); ctx.quadraticCurveTo(0, -7, 0, -10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, -3); ctx.quadraticCurveTo(2, -6, 4, -6); ctx.quadraticCurveTo(6, -6, 6, -9);
  ctx.stroke();
  restore();
};

const drawGlasses: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(-5, 0, 4.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(5, 0, 4.5, 0, Math.PI * 2);
  ctx.stroke();
  // Bridge
  ctx.beginPath();
  ctx.moveTo(-0.5, 0); ctx.quadraticCurveTo(0, -2, 0.5, 0);
  ctx.stroke();
  // Arms
  ctx.beginPath();
  ctx.moveTo(-9.5, 0); ctx.lineTo(-11, -3);
  ctx.moveTo(9.5, 0); ctx.lineTo(11, -3);
  ctx.stroke();
  restore();
};

// =============================================================================
//  ARROWS & UI ICONS (10)
// =============================================================================

const drawArrowRight: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
  ctx.moveTo(4, -4); ctx.lineTo(8, 0); ctx.lineTo(4, 4);
  ctx.stroke();
  restore();
};

const drawArrowUp: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(0, 8); ctx.lineTo(0, -8);
  ctx.moveTo(-4, -4); ctx.lineTo(0, -8); ctx.lineTo(4, -4);
  ctx.stroke();
  restore();
};

const drawCheck: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-7, 0); ctx.lineTo(-2, 5); ctx.lineTo(7, -5);
  ctx.stroke();
  restore();
};

const drawClose: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-6, -6); ctx.lineTo(6, 6);
  ctx.moveTo(6, -6); ctx.lineTo(-6, 6);
  ctx.stroke();
  restore();
};

const drawPlus: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -7); ctx.lineTo(0, 7);
  ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
  ctx.stroke();
  restore();
};

const drawMinus: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
  ctx.stroke();
  restore();
};

const drawSearch: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(-2, -2, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 3); ctx.lineTo(9, 9);
  ctx.stroke();
  restore();
};

const drawMenu: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -5); ctx.lineTo(8, -5);
  ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
  ctx.moveTo(-8, 5); ctx.lineTo(8, 5);
  ctx.stroke();
  restore();
};

const drawRefresh: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0.5, Math.PI * 1.8);
  ctx.stroke();
  // Arrow tip
  ctx.beginPath();
  ctx.moveTo(5, -8); ctx.lineTo(7, -4); ctx.lineTo(3, -3);
  ctx.stroke();
  restore();
};

const drawExpand: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-9, -4); ctx.lineTo(-9, -9); ctx.lineTo(-4, -9);
  ctx.moveTo(4, -9); ctx.lineTo(9, -9); ctx.lineTo(9, -4);
  ctx.moveTo(9, 4); ctx.lineTo(9, 9); ctx.lineTo(4, 9);
  ctx.moveTo(-4, 9); ctx.lineTo(-9, 9); ctx.lineTo(-9, 4);
  ctx.stroke();
  restore();
};

// =============================================================================
//  COMMERCE & FINANCE ICONS (10)
// =============================================================================

const drawShoppingCart: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-10, -8); ctx.lineTo(-7, -8); ctx.lineTo(-4, 4); ctx.lineTo(7, 4);
  ctx.lineTo(9, -3); ctx.lineTo(-5, -3);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(-3, 8, 2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(6, 8, 2, 0, Math.PI * 2); ctx.stroke();
  restore();
};

const drawCreditCard: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -6, 20, 13, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, -2); ctx.lineTo(10, -2);
  ctx.stroke();
  ctx.fillRect(-7, 2, 5, 2);
  restore();
};

const drawWallet: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.roundRect(-10, -6, 20, 14, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(4, -1, 6, 5, 1);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(7, 1.5, 1, 0, Math.PI * 2); ctx.fill();
  restore();
};

const drawTag: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-10, 0); ctx.lineTo(-2, -8); ctx.lineTo(8, -8);
  ctx.lineTo(8, 2); ctx.lineTo(0, 10); ctx.closePath();
  ctx.stroke();
  ctx.beginPath(); ctx.arc(5, -5, 1.5, 0, Math.PI * 2); ctx.fill();
  restore();
};

const drawReceipt: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(-7, -10); ctx.lineTo(-7, 8);
  ctx.lineTo(-5, 6); ctx.lineTo(-3, 8); ctx.lineTo(-1, 6); ctx.lineTo(1, 8);
  ctx.lineTo(3, 6); ctx.lineTo(5, 8); ctx.lineTo(7, 6);
  ctx.lineTo(7, -10); ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-4, -5); ctx.lineTo(4, -5);
  ctx.moveTo(-4, -1); ctx.lineTo(4, -1);
  ctx.moveTo(-4, 3); ctx.lineTo(2, 3);
  ctx.stroke();
  restore();
};

const drawBank: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Roof
  ctx.beginPath();
  ctx.moveTo(0, -10); ctx.lineTo(10, -4); ctx.lineTo(-10, -4); ctx.closePath();
  ctx.stroke();
  // Pillars
  ctx.beginPath();
  ctx.moveTo(-6, -4); ctx.lineTo(-6, 5);
  ctx.moveTo(-2, -4); ctx.lineTo(-2, 5);
  ctx.moveTo(2, -4); ctx.lineTo(2, 5);
  ctx.moveTo(6, -4); ctx.lineTo(6, 5);
  ctx.stroke();
  // Base
  ctx.beginPath();
  ctx.moveTo(-10, 5); ctx.lineTo(10, 5);
  ctx.moveTo(-10, 8); ctx.lineTo(10, 8);
  ctx.stroke();
  restore();
};

const drawPiggyBank: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Ear
  ctx.beginPath();
  ctx.ellipse(-4, -6, 2.5, 2, -0.3, 0, Math.PI * 2);
  ctx.stroke();
  // Snout
  ctx.beginPath();
  ctx.ellipse(8, 0, 3, 2.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Eye
  ctx.beginPath(); ctx.arc(-2, -2, 1, 0, Math.PI * 2); ctx.fill();
  // Legs
  ctx.beginPath();
  ctx.moveTo(-4, 7); ctx.lineTo(-4, 10);
  ctx.moveTo(4, 7); ctx.lineTo(4, 10);
  ctx.stroke();
  // Coin slot
  ctx.beginPath();
  ctx.moveTo(-2, -7); ctx.lineTo(2, -7);
  ctx.stroke();
  restore();
};

const drawPercent: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.beginPath();
  ctx.moveTo(7, -8); ctx.lineTo(-7, 8);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(-5, -5, 3, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(5, 5, 3, 0, Math.PI * 2); ctx.stroke();
  restore();
};

const drawGift: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  ctx.strokeRect(-9, -3, 18, 13);
  ctx.strokeRect(-10, -6, 20, 5);
  ctx.beginPath();
  ctx.moveTo(0, -6); ctx.lineTo(0, 10);
  ctx.stroke();
  // Ribbon
  ctx.beginPath();
  ctx.moveTo(0, -6); ctx.quadraticCurveTo(-5, -10, -7, -6);
  ctx.moveTo(0, -6); ctx.quadraticCurveTo(5, -10, 7, -6);
  ctx.stroke();
  restore();
};

const drawTruck: IconDrawFn = (ctx, x, y, size, color, sw) => {
  const { restore } = iconCtx(ctx, x, y, size, color, sw);
  // Cargo box
  ctx.strokeRect(-10, -5, 12, 10);
  // Cabin
  ctx.beginPath();
  ctx.moveTo(2, -2); ctx.lineTo(9, -2); ctx.lineTo(9, 5); ctx.lineTo(2, 5); ctx.closePath();
  ctx.stroke();
  // Wheels
  ctx.beginPath(); ctx.arc(-5, 6, 2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(6, 6, 2, 0, Math.PI * 2); ctx.stroke();
  // Ground line
  ctx.beginPath();
  ctx.moveTo(-10, 8); ctx.lineTo(10, 8);
  ctx.stroke();
  restore();
};

// =============================================================================
//  ICON REGISTRY — The Master Map
// =============================================================================

/** Full metadata registry for all icons */
export const ICON_BANK: IconMeta[] = [
  // =========================================================================
  //  SOCIAL MEDIA (20)
  // =========================================================================
  { id: "linkedin", label: "LinkedIn", category: "social-media",
    description: "Professional networking platform logo — rounded square with stylized 'in' lettermark. Use for professional profiles, career pages, B2B marketing, job listings, corporate contact cards, and networking materials.",
    tags: ["social", "professional", "network", "job", "career", "hiring", "recruitment", "corporate", "b2b", "resume", "business-card", "connect", "profile", "work", "employment"],
    draw: drawLinkedin },
  { id: "twitter-x", label: "X (Twitter)", category: "social-media",
    description: "X (formerly Twitter) logo — bold intersecting diagonal lines forming an X. Use for social media handles, tweet embeds, news feeds, microblog references, real-time updates, and public announcements.",
    tags: ["social", "microblog", "tweet", "x", "news", "feed", "post", "handle", "hashtag", "trending", "viral", "follow", "retweet", "timeline", "update"],
    draw: drawTwitterX },
  { id: "facebook", label: "Facebook", category: "social-media",
    description: "Facebook/Meta logo — rounded square with lowercase 'f' lettermark. Use for social sharing buttons, community pages, event promotion, marketplace links, group references, and social login.",
    tags: ["social", "network", "meta", "community", "group", "page", "share", "like", "event", "marketplace", "friends", "post", "feed", "login", "connect"],
    draw: drawFacebook },
  { id: "instagram", label: "Instagram", category: "social-media",
    description: "Instagram logo — rounded square with camera lens circle and viewfinder dot. Use for photo galleries, visual portfolios, influencer content, stories, reels, fashion, food photography, and lifestyle brands.",
    tags: ["social", "photo", "stories", "reels", "camera", "filter", "visual", "influencer", "fashion", "lifestyle", "photography", "gallery", "feed", "explore", "grid"],
    draw: drawInstagram },
  { id: "youtube", label: "YouTube", category: "social-media",
    description: "YouTube logo — rounded rectangle with centered play triangle button. Use for video content, tutorials, channels, streaming, vlogs, entertainment, education, and embedded video links.",
    tags: ["video", "streaming", "content", "channel", "tutorial", "vlog", "subscribe", "play", "watch", "creator", "entertainment", "education", "live", "broadcast", "media"],
    draw: drawYoutube },
  { id: "tiktok", label: "TikTok", category: "social-media",
    description: "TikTok logo — musical note with distinctive offset styling. Use for short-form video, viral content, trends, dance, entertainment, Gen-Z marketing, and creative video campaigns.",
    tags: ["video", "short", "viral", "trend", "dance", "music", "entertainment", "genz", "creator", "challenge", "duet", "sound", "reel", "clip", "fyp"],
    draw: drawTiktok },
  { id: "pinterest", label: "Pinterest", category: "social-media",
    description: "Pinterest logo — circle with pin/P lettermark inside. Use for inspiration boards, mood boards, visual bookmarking, DIY projects, recipes, home decor, fashion ideas, and wedding planning.",
    tags: ["inspiration", "boards", "visual", "pin", "mood", "diy", "recipe", "decor", "fashion", "wedding", "craft", "bookmark", "idea", "collection", "aesthetic"],
    draw: drawPinterest },
  { id: "snapchat", label: "Snapchat", category: "social-media",
    description: "Snapchat logo — friendly ghost outline. Use for ephemeral messaging, AR filters, stories, youth marketing, casual communication, and disappearing content.",
    tags: ["messaging", "stories", "ephemeral", "ghost", "filter", "ar", "snap", "youth", "casual", "disappearing", "selfie", "lens", "streak", "friends", "chat"],
    draw: drawSnapchat },
  { id: "whatsapp", label: "WhatsApp", category: "social-media",
    description: "WhatsApp logo — speech bubble circle with phone handset inside. Use for messaging, customer support chat, group communication, voice calls, international contact, and business messaging.",
    tags: ["messaging", "chat", "communication", "phone", "call", "group", "support", "customer", "international", "business", "text", "voice", "contact", "number", "green"],
    draw: drawWhatsapp },
  { id: "telegram", label: "Telegram", category: "social-media",
    description: "Telegram logo — paper airplane in flight. Use for secure messaging, channels, groups, bots, privacy-focused communication, broadcast messages, and tech communities.",
    tags: ["messaging", "chat", "privacy", "secure", "channel", "group", "bot", "broadcast", "encrypted", "fast", "cloud", "file", "airplane", "paper", "tech"],
    draw: drawTelegram },
  { id: "reddit", label: "Reddit", category: "social-media",
    description: "Reddit logo — alien snoo face with antenna in a circle. Use for community forums, discussion threads, subreddits, AMAs, upvotes, user-generated content, and niche communities.",
    tags: ["forum", "community", "discussion", "subreddit", "upvote", "thread", "ama", "meme", "niche", "comment", "karma", "post", "question", "answer", "vote"],
    draw: drawReddit },
  { id: "discord", label: "Discord", category: "social-media",
    description: "Discord logo — gamepad-shaped face with round eyes. Use for gaming communities, voice chat servers, team communication, developer communities, and real-time group collaboration.",
    tags: ["gaming", "community", "voice", "server", "chat", "team", "developer", "gamer", "channel", "bot", "stream", "call", "group", "mod", "role"],
    draw: drawDiscord },
  { id: "github", label: "GitHub", category: "social-media",
    description: "GitHub logo — octocat face in a circle. Use for code repositories, open source projects, developer profiles, version control, pull requests, and software collaboration.",
    tags: ["code", "developer", "repository", "opensource", "git", "pull-request", "commit", "branch", "software", "project", "collaboration", "programming", "fork", "issue", "devops"],
    draw: drawGithub },
  { id: "dribbble", label: "Dribbble", category: "social-media",
    description: "Dribbble logo — basketball circle with curved seam lines. Use for design portfolios, creative showcases, UI/UX design sharing, designer profiles, and visual inspiration.",
    tags: ["design", "portfolio", "creative", "ui", "ux", "showcase", "designer", "visual", "shot", "illustration", "graphic", "art", "mockup", "pixel", "craft"],
    draw: drawDribbble },
  { id: "behance", label: "Behance", category: "social-media",
    description: "Behance logo — bold 'Be' letterform. Use for creative portfolios, Adobe ecosystem, design projects, photography showcases, and professional creative networking.",
    tags: ["design", "portfolio", "adobe", "creative", "project", "showcase", "photography", "illustration", "graphic", "professional", "gallery", "art", "branding", "visual", "network"],
    draw: drawBehance },
  { id: "spotify", label: "Spotify", category: "social-media",
    description: "Spotify logo — circle with three curved sound wave bars. Use for music streaming, playlists, podcasts, audio content, artist profiles, and entertainment branding.",
    tags: ["music", "streaming", "audio", "playlist", "podcast", "song", "artist", "album", "listen", "radio", "sound", "track", "entertainment", "discover", "genre"],
    draw: drawSpotify },
  { id: "slack", label: "Slack", category: "social-media",
    description: "Slack logo — four colored dots with extending bars forming a hash pattern. Use for team messaging, workplace communication, channel organization, integrations, and business collaboration.",
    tags: ["team", "communication", "work", "channel", "message", "workplace", "collaboration", "integration", "notification", "business", "productivity", "remote", "office", "thread", "huddle"],
    draw: drawSlack },
  { id: "threads", label: "Threads", category: "social-media",
    description: "Threads logo — at-sign-like spiral letterform. Use for text-based social posts, Meta ecosystem, public conversations, and microblogging content.",
    tags: ["social", "text", "meta", "microblog", "post", "conversation", "public", "follow", "reply", "feed", "trending", "community", "share", "instagram", "thread"],
    draw: drawThreads },
  { id: "mastodon", label: "Mastodon", category: "social-media",
    description: "Mastodon logo — friendly elephant-like rounded shape with trunk. Use for decentralized social media, fediverse content, open-source social networking, and privacy-first platforms.",
    tags: ["social", "fediverse", "decentralized", "opensource", "privacy", "elephant", "toot", "instance", "federation", "microblog", "alternative", "community", "free", "server", "indie"],
    draw: drawMastodon },
  { id: "bluesky", label: "Bluesky", category: "social-media",
    description: "Bluesky logo — butterfly silhouette with stem. Use for decentralized social media, AT protocol, open social web, microblogging, and alternative social platforms.",
    tags: ["social", "microblog", "decentralized", "butterfly", "at-protocol", "open", "post", "feed", "follow", "alternative", "sky", "community", "free", "web", "indie"],
    draw: drawBluesky },

  // =========================================================================
  //  CONTACT & COMMUNICATION (15)
  // =========================================================================
  { id: "phone", label: "Phone", category: "contact",
    description: "Classic telephone handset in a curved receiver shape. Use for phone numbers, call-to-action buttons, customer service, hotlines, contact information, support lines, and business cards.",
    tags: ["call", "telephone", "dial", "ring", "mobile", "cell", "contact", "support", "hotline", "customer-service", "number", "receiver", "landline", "voicemail", "business-card"],
    draw: drawPhone },
  { id: "email", label: "Email", category: "contact",
    description: "Envelope with a V-shaped flap — the universal email symbol. Use for email addresses, newsletter signups, inbox notifications, contact forms, mailing lists, and correspondence.",
    tags: ["mail", "envelope", "message", "inbox", "newsletter", "contact", "address", "correspondence", "notification", "subscribe", "compose", "send", "receive", "letter", "business-card"],
    draw: drawEmail },
  { id: "globe", label: "Globe/Web", category: "contact",
    description: "Earth globe with latitude/longitude grid lines — represents worldwide web and internet. Use for website URLs, international business, global reach, world map, travel, and web addresses on business cards.",
    tags: ["website", "world", "internet", "url", "web", "global", "international", "earth", "map", "worldwide", "domain", "online", "address", "http", "business-card"],
    draw: drawGlobe },
  { id: "map-pin", label: "Location", category: "contact",
    description: "Map location pin/marker with inner circle — classic GPS-style marker. Use for physical addresses, store locations, navigation, directions, venue info, maps, and office addresses on business cards.",
    tags: ["address", "pin", "gps", "place", "location", "map", "navigation", "directions", "venue", "store", "office", "marker", "geographic", "find-us", "business-card"],
    draw: drawMapPin },
  { id: "chat", label: "Chat", category: "contact",
    description: "Speech bubble with three dots inside and a tail. Use for live chat, customer support, messaging features, chatbots, comments, discussions, and real-time communication.",
    tags: ["message", "bubble", "conversation", "support", "live-chat", "chatbot", "comment", "discuss", "real-time", "customer", "help", "dialog", "feedback", "sms", "text"],
    draw: drawChat },
  { id: "video-call", label: "Video Call", category: "contact",
    description: "Video camera/camcorder with playback screen — represents video conferencing. Use for Zoom/Teams/Meet meetings, virtual consultations, webinars, remote work, and video-based communication.",
    tags: ["meeting", "zoom", "camera", "conference", "teams", "meet", "webinar", "remote", "virtual", "consultation", "screen", "video", "face-to-face", "online", "call"],
    draw: drawVideoCall },
  { id: "fax", label: "Fax", category: "contact",
    description: "Fax machine with paper output and button grid. Use for fax numbers, legacy communication, medical offices, legal documents, government forms, and traditional business contact info.",
    tags: ["document", "legacy", "machine", "paper", "office", "medical", "legal", "government", "traditional", "number", "transmission", "print", "scan", "formal", "business-card"],
    draw: drawFax },
  { id: "mobile", label: "Mobile", category: "contact",
    description: "Smartphone with screen and home button outline. Use for mobile phone numbers, app references, responsive design, mobile-first content, and cellphone contact information.",
    tags: ["smartphone", "cell", "device", "mobile-phone", "app", "screen", "touchscreen", "cellular", "portable", "handheld", "ios", "android", "responsive", "number", "business-card"],
    draw: drawMobile },
  { id: "at", label: "At Symbol", category: "contact",
    description: "The @ at-sign symbol — universal email and social media handle indicator. Use for email addresses, social handles, mentions, usernames, and digital contact information.",
    tags: ["email", "mention", "handle", "username", "symbol", "digital", "social", "address", "at-sign", "identifier", "account", "profile", "tag", "domain", "contact"],
    draw: drawAt },
  { id: "link", label: "Link", category: "contact",
    description: "Two interlocking chain links — represents hyperlinks and connections. Use for URLs, hyperlinks, website references, external links, resource connections, and sharing.",
    tags: ["url", "chain", "connection", "hyperlink", "external", "reference", "share", "attach", "web", "anchor", "redirect", "shortlink", "qr", "click", "navigate"],
    draw: drawLink },
  { id: "headphones", label: "Headphones", category: "contact",
    description: "Over-ear headphones with headband arc and ear cups. Use for audio support, podcast listening, music, customer service helplines, call center, and audio-related services.",
    tags: ["audio", "listen", "support", "podcast", "music", "call-center", "helpline", "customer-service", "sound", "stereo", "ear", "dj", "studio", "radio", "streaming"],
    draw: drawHeadphones },
  { id: "microphone", label: "Microphone", category: "contact",
    description: "Studio condenser microphone on a stand with base. Use for podcasts, voice recording, audio content, radio, karaoke, speeches, voiceovers, and sound production.",
    tags: ["audio", "voice", "podcast", "record", "radio", "speech", "karaoke", "voiceover", "studio", "sound", "broadcast", "sing", "talk", "narration", "production"],
    draw: drawMicrophone },
  { id: "send", label: "Send", category: "contact",
    description: "Paper airplane / send arrow pointing right. Use for send buttons, submit actions, email sending, message dispatch, form submission, and share functionality.",
    tags: ["paper", "plane", "submit", "dispatch", "forward", "share", "mail", "message", "action", "button", "arrow", "deliver", "post", "publish", "notify"],
    draw: drawSend },
  { id: "inbox", label: "Inbox", category: "contact",
    description: "Inbox tray with down arrow showing incoming messages. Use for email inboxes, notifications, received messages, mail collection, and incoming correspondence.",
    tags: ["mail", "receive", "tray", "notification", "incoming", "collect", "unread", "new", "download", "archive", "storage", "pending", "queue", "messages", "box"],
    draw: drawInbox },
  { id: "qr-code", label: "QR Code", category: "contact",
    description: "Scannable QR code with three finder pattern squares and data dots. Use for quick links, contactless sharing, digital business cards, payment codes, URLs, and scan-to-connect.",
    tags: ["scan", "barcode", "digital", "contactless", "link", "payment", "url", "vcard", "nfc", "code", "matrix", "quick-response", "mobile", "share", "business-card"],
    draw: drawQrCode },

  // =========================================================================
  //  BUSINESS & PROFESSIONAL (20)
  // =========================================================================
  { id: "briefcase", label: "Briefcase", category: "business",
    description: "Professional briefcase with handle and clasp line. Use for business services, corporate identity, career pages, job listings, professional portfolios, and work-related content.",
    tags: ["work", "job", "portfolio", "case", "career", "corporate", "professional", "office", "executive", "business", "employment", "consultant", "formal", "services", "enterprise"],
    draw: drawBriefcase },
  { id: "building", label: "Building", category: "business",
    description: "Multi-story office building with windows and entrance door. Use for corporate headquarters, real estate, company profiles, office locations, commercial property, and business addresses.",
    tags: ["office", "company", "corporate", "hq", "headquarters", "real-estate", "commercial", "tower", "skyscraper", "property", "workplace", "enterprise", "address", "city", "urban"],
    draw: drawBuilding },
  { id: "calendar", label: "Calendar", category: "business",
    description: "Calendar page with date grid, binding rings, and numbered days. Use for scheduling, events, appointments, deadlines, date pickers, planners, and time management.",
    tags: ["date", "schedule", "event", "planner", "appointment", "deadline", "booking", "agenda", "month", "week", "reminder", "organize", "time", "meeting", "reservation"],
    draw: drawCalendar },
  { id: "clock", label: "Clock", category: "business",
    description: "Analog clock face with hour and minute hands showing time. Use for time management, deadlines, hours of operation, scheduling, countdowns, and time-sensitive content.",
    tags: ["time", "hour", "schedule", "deadline", "watch", "timer", "countdown", "business-hours", "opening", "closing", "punctual", "duration", "minute", "alarm", "timezone"],
    draw: drawClock },
  { id: "dollar", label: "Dollar", category: "business",
    description: "Dollar sign ($) inside a circle — currency and money symbol. Use for pricing, financial services, revenue, budgets, cost displays, payment amounts, and money-related content.",
    tags: ["money", "currency", "finance", "payment", "price", "cost", "revenue", "budget", "income", "profit", "salary", "fee", "rate", "billing", "economic"],
    draw: drawDollar },
  { id: "chart-bar", label: "Bar Chart", category: "business",
    description: "Three vertical bars of increasing height on a baseline — bar graph visualization. Use for sales data, analytics dashboards, performance metrics, comparisons, and statistical reports.",
    tags: ["analytics", "data", "graph", "metrics", "statistics", "performance", "sales", "comparison", "dashboard", "report", "kpi", "revenue", "growth", "quarterly", "visual"],
    draw: drawChartBar },
  { id: "chart-line", label: "Line Chart", category: "business",
    description: "Upward-trending line graph with data points on X-Y axes. Use for growth trends, stock prices, progress tracking, time-series data, performance over time, and analytics.",
    tags: ["analytics", "data", "trend", "growth", "stock", "progress", "timeline", "increase", "tracking", "performance", "forecast", "upward", "line-graph", "roi", "trajectory"],
    draw: drawChartLine },
  { id: "users", label: "Users/Team", category: "business",
    description: "Two overlapping person silhouettes representing a group or team. Use for team pages, group features, collaboration, community, HR, audience segments, and user management.",
    tags: ["people", "group", "team", "collaboration", "community", "hr", "audience", "members", "staff", "employees", "department", "organization", "crowd", "social", "collective"],
    draw: drawUsers },
  { id: "user", label: "User", category: "business",
    description: "Single person silhouette with head circle and shoulder arc. Use for user profiles, account settings, personal information, contact person, author credits, and individual identity.",
    tags: ["person", "profile", "account", "individual", "avatar", "identity", "member", "contact", "author", "customer", "client", "admin", "login", "personal", "bio"],
    draw: drawUser },
  { id: "handshake", label: "Handshake", category: "business",
    description: "Two hands clasping in a handshake gesture. Use for partnerships, deals, agreements, collaboration, B2B relationships, trust, and successful negotiations.",
    tags: ["deal", "agreement", "partnership", "trust", "collaboration", "b2b", "negotiation", "alliance", "cooperation", "contract", "relationship", "merge", "welcome", "onboard", "mutual"],
    draw: drawHandshake },
  { id: "award", label: "Award", category: "business",
    description: "Medal/ribbon award with circle medallion and two ribbon tails. Use for achievements, certifications, prizes, recognition, quality badges, excellence, and competition winners.",
    tags: ["medal", "trophy", "achievement", "badge", "prize", "recognition", "excellence", "winner", "champion", "quality", "certified", "honor", "first-place", "competition", "reward"],
    draw: drawAward },
  { id: "target", label: "Target", category: "business",
    description: "Concentric circles with filled bullseye center — target/crosshair. Use for goals, objectives, KPIs, marketing targets, focus areas, accuracy, and strategic planning.",
    tags: ["goal", "bullseye", "aim", "focus", "objective", "kpi", "strategy", "mission", "accuracy", "precision", "marketing", "plan", "milestone", "hit", "center"],
    draw: drawTarget },
  { id: "presentation", label: "Presentation", category: "business",
    description: "Presentation screen on stand with chart inside. Use for slideshows, pitches, meetings, boardroom presentations, keynotes, webinars, and business demos.",
    tags: ["slides", "pitch", "screen", "projector", "keynote", "meeting", "boardroom", "demo", "webinar", "powerpoint", "lecture", "training", "speaker", "visual", "deck"],
    draw: drawPresentation },
  { id: "certificate", label: "Certificate", category: "business",
    description: "Document with text lines and an official seal/stamp in corner. Use for certifications, diplomas, licenses, credentials, compliance badges, and official documents.",
    tags: ["diploma", "license", "credential", "seal", "official", "compliance", "accreditation", "stamp", "verified", "document", "qualification", "training", "completion", "authority", "education"],
    draw: drawCertificate },
  { id: "invoice", label: "Invoice", category: "business",
    description: "Document with folded corner, text lines, and billing details. Use for invoices, bills, purchase orders, financial documents, billing, and accounting records.",
    tags: ["bill", "document", "receipt", "payment", "accounting", "purchase-order", "billing", "financial", "statement", "charge", "due", "payable", "itemized", "ledger", "tax"],
    draw: drawInvoice },
  { id: "contract", label: "Contract", category: "business",
    description: "Document with multiple text lines and a signature squiggle at the bottom. Use for contracts, legal agreements, terms of service, NDAs, and formal documentation.",
    tags: ["document", "signature", "agreement", "legal", "nda", "terms", "binding", "formal", "sign", "clause", "policy", "compliance", "notary", "witness", "execute"],
    draw: drawContract },
  { id: "lightbulb", label: "Lightbulb", category: "business",
    description: "Incandescent light bulb with filament area and screw base. Use for ideas, innovation, creativity, tips, insights, brainstorming, solutions, and inspiration moments.",
    tags: ["idea", "innovation", "creative", "concept", "tip", "insight", "brainstorm", "solution", "inspiration", "think", "bright", "eureka", "strategy", "invention", "suggestion"],
    draw: drawLightbulb },
  { id: "rocket", label: "Rocket", category: "business",
    description: "Rocket ship with pointed nose, window, side fins, and flame trail. Use for product launches, startup branding, rapid growth, space tech, acceleration, and ambitious projects.",
    tags: ["launch", "startup", "growth", "speed", "space", "boost", "accelerate", "scale", "ambition", "moonshot", "blast-off", "fast", "propel", "mission", "venture"],
    draw: drawRocket },
  { id: "gem", label: "Gem", category: "business",
    description: "Faceted diamond/gem with top crown and pavilion facet lines. Use for premium features, luxury branding, valuable content, VIP access, pricing tiers, and high-quality offerings.",
    tags: ["diamond", "value", "premium", "luxury", "vip", "exclusive", "precious", "quality", "rare", "tier", "elite", "jewel", "brilliant", "crystal", "treasure"],
    draw: drawGem },
  { id: "shield", label: "Shield", category: "business",
    description: "Shield/badge shape with a checkmark inside — security verified. Use for security features, trust badges, protection guarantees, SSL, privacy policies, and verification marks.",
    tags: ["security", "protection", "trust", "verified", "safe", "guarantee", "ssl", "privacy", "defense", "guard", "insurance", "warranty", "antivirus", "firewall", "badge"],
    draw: drawShield },

  // =========================================================================
  //  CREATIVE & DESIGN (15)
  // =========================================================================
  { id: "palette", label: "Palette", category: "creative",
    description: "Artist's paint palette with thumb hole and paint blob dots. Use for art, color customization, design tools, creative studios, branding, and color picker features.",
    tags: ["art", "color", "paint", "design", "creative", "studio", "artist", "branding", "customize", "theme", "hue", "pigment", "canvas", "illustration", "picker"],
    draw: drawPalette },
  { id: "pen", label: "Pen", category: "creative",
    description: "Angled pen/pencil tool with nib and edit line. Use for writing, editing, drawing, annotation, signatures, content creation, blogging, and text editing.",
    tags: ["write", "edit", "draw", "sketch", "pencil", "annotation", "signature", "create", "compose", "blog", "author", "draft", "note", "scribble", "calligraphy"],
    draw: drawPen },
  { id: "camera", label: "Camera", category: "creative",
    description: "DSLR-style camera body with lens, viewfinder hump, and inner lens circles. Use for photography, photo shoots, image capture, portfolio sections, and visual content creation.",
    tags: ["photo", "photography", "capture", "image", "shot", "picture", "lens", "dslr", "portrait", "landscape", "snap", "shutter", "focus", "gallery", "visual"],
    draw: drawCamera },
  { id: "film", label: "Film", category: "creative",
    description: "Film strip frame with sprocket holes on both sides. Use for cinema, movies, video production, entertainment, film festivals, and media projects.",
    tags: ["movie", "cinema", "video", "reel", "strip", "frame", "production", "director", "theater", "entertainment", "hollywood", "documentary", "short-film", "premiere", "festival"],
    draw: drawFilm },
  { id: "music", label: "Music", category: "creative",
    description: "Two connected musical notes (beamed eighth notes). Use for music players, audio content, playlists, concert promotions, band pages, and sound-related features.",
    tags: ["note", "audio", "song", "melody", "tune", "rhythm", "beat", "concert", "band", "instrument", "harmony", "compose", "playlist", "dj", "soundtrack"],
    draw: drawMusic },
  { id: "brush", label: "Brush", category: "creative",
    description: "Paint brush with bristle head and handle. Use for art tools, painting, creative expression, design studios, makeup, and artistic content.",
    tags: ["paint", "art", "stroke", "creative", "bristle", "watercolor", "acrylic", "canvas", "artistic", "studio", "texture", "coat", "finish", "makeover", "tool"],
    draw: drawBrush },
  { id: "layers", label: "Layers", category: "creative",
    description: "Three stacked diamond/rhombus layers representing depth. Use for layer management, design software, compositing, depth, multi-level content, and design hierarchy.",
    tags: ["stack", "design", "depth", "compose", "level", "overlay", "blend", "arrange", "z-index", "tier", "flatten", "group", "merge", "hierarchy", "structure"],
    draw: drawLayers },
  { id: "grid", label: "Grid", category: "creative",
    description: "3x3 grid of evenly spaced lines forming nine cells. Use for layout systems, galleries, photo grids, spreadsheets, dashboards, and structured arrangements.",
    tags: ["layout", "table", "structure", "matrix", "gallery", "spreadsheet", "column", "row", "cell", "organize", "dashboard", "responsive", "framework", "alignment", "template"],
    draw: drawGrid },
  { id: "crop", label: "Crop", category: "creative",
    description: "Two overlapping L-shaped crop brackets. Use for image cropping, photo editing, aspect ratio adjustment, framing, and composition tools.",
    tags: ["resize", "trim", "frame", "cut", "aspect-ratio", "composition", "edit", "photo", "adjust", "reframe", "selection", "boundary", "proportion", "dimension", "tool"],
    draw: drawCrop },
  { id: "wand", label: "Magic Wand", category: "creative",
    description: "Diagonal wand with three sparkle/star bursts at the tip. Use for auto-enhance, magic selection, AI-powered features, transformations, and one-click improvements.",
    tags: ["magic", "sparkle", "auto", "enhance", "ai", "transform", "one-click", "improve", "effect", "filter", "smart", "instant", "wizard", "automate", "boost"],
    draw: drawWand },
  { id: "eye", label: "Eye", category: "creative",
    description: "Human eye with eyelid outline, iris circle, and pupil dot. Use for visibility toggles, preview modes, view counts, show/hide, privacy, and attention/focus.",
    tags: ["view", "visible", "preview", "watch", "visibility", "show", "hide", "look", "observe", "inspect", "iris", "pupil", "attention", "focus", "toggle"],
    draw: drawEye },
  { id: "download", label: "Download", category: "creative",
    description: "Downward arrow into a tray/surface. Use for file downloads, export actions, save to device, resource downloads, and asset acquisition.",
    tags: ["save", "export", "arrow", "get", "file", "resource", "acquire", "fetch", "grab", "install", "store", "offline", "backup", "archive", "pdf"],
    draw: drawDownload },
  { id: "upload", label: "Upload", category: "creative",
    description: "Upward arrow from a tray/surface. Use for file uploads, import actions, cloud sync, media publishing, and content submission.",
    tags: ["import", "send", "arrow", "push", "file", "cloud", "sync", "publish", "submit", "attach", "transfer", "share", "deploy", "post", "media"],
    draw: drawUpload },
  { id: "print", label: "Print", category: "creative",
    description: "Desktop printer with paper input tray above and output tray below. Use for printing, hard copies, physical output, print-ready content, and document production.",
    tags: ["printer", "paper", "output", "hard-copy", "document", "physical", "press", "copy", "publish", "offset", "inkjet", "laser", "page", "cmyk", "production"],
    draw: drawPrint },
  { id: "color-swatch", label: "Color Swatch", category: "creative",
    description: "Three side-by-side vertical color swatches/strips. Use for color themes, palette selection, brand colors, design systems, and color scheme presentation.",
    tags: ["palette", "theme", "scheme", "picker", "swatch", "brand-color", "design-system", "tone", "shade", "tint", "pantone", "hex", "rgb", "sample", "selection"],
    draw: drawColorSwatch },

  // =========================================================================
  //  TECHNOLOGY & WEB (15)
  // =========================================================================
  { id: "code", label: "Code", category: "technology",
    description: "Angle brackets (< />) with a forward slash — code/HTML symbol. Use for programming, web development, software engineering, tech blogs, API docs, and developer content.",
    tags: ["programming", "developer", "html", "brackets", "web", "software", "engineering", "frontend", "backend", "syntax", "script", "coding", "markup", "tags", "dev"],
    draw: drawCode },
  { id: "server", label: "Server", category: "technology",
    description: "Two stacked server rack units with status LEDs and drive lines. Use for web hosting, data centers, infrastructure, backend services, and cloud computing.",
    tags: ["hosting", "data", "rack", "infrastructure", "datacenter", "backend", "cloud", "compute", "uptime", "deployment", "virtual", "instance", "node", "cluster", "hardware"],
    draw: drawServer },
  { id: "cloud", label: "Cloud", category: "technology",
    description: "Fluffy cumulus cloud shape with rounded bumps. Use for cloud computing, SaaS products, online storage, weather, cloud sync, and internet-based services.",
    tags: ["storage", "hosting", "saas", "sync", "computing", "online", "aws", "azure", "digital", "virtual", "platform", "weather", "upload", "backup", "service"],
    draw: drawCloud },
  { id: "wifi", label: "WiFi", category: "technology",
    description: "Three concentric WiFi signal arcs above a dot — wireless connectivity symbol. Use for internet access, wireless networks, connectivity, hotspots, and network status.",
    tags: ["wireless", "internet", "signal", "connectivity", "hotspot", "network", "broadband", "access", "router", "connected", "online", "bars", "speed", "coverage", "available"],
    draw: drawWifi },
  { id: "database", label: "Database", category: "technology",
    description: "Cylinder stack with horizontal slice lines — database/storage icon. Use for data storage, SQL databases, records, backend systems, and data management.",
    tags: ["storage", "sql", "records", "data", "table", "query", "nosql", "schema", "repository", "warehouse", "backup", "migration", "crud", "relational", "persistent"],
    draw: drawDatabase },
  { id: "cpu", label: "CPU/Chip", category: "technology",
    description: "Microprocessor chip with inner die and pin connectors on all four sides. Use for computing power, hardware, processors, tech specs, and performance benchmarks.",
    tags: ["processor", "hardware", "computing", "chip", "silicon", "performance", "benchmark", "core", "thread", "architecture", "semiconductor", "gpu", "embedded", "circuit", "spec"],
    draw: drawCpu },
  { id: "lock", label: "Lock", category: "technology",
    description: "Padlock with shackle arc, body, and keyhole. Use for security, passwords, encryption, locked content, authentication, and access control.",
    tags: ["security", "password", "privacy", "encrypt", "padlock", "authentication", "access", "protected", "secure", "login", "credential", "two-factor", "vault", "restricted", "ssl"],
    draw: drawLock },
  { id: "settings", label: "Settings", category: "technology",
    description: "Gear/cog wheel with inner circle and radiating teeth. Use for settings menus, configuration, preferences, admin panels, system options, and customization.",
    tags: ["gear", "config", "options", "preferences", "admin", "customize", "control", "panel", "system", "manage", "tune", "adjust", "setup", "wrench", "cog"],
    draw: drawSettings },
  { id: "terminal", label: "Terminal", category: "technology",
    description: "Terminal/console window with prompt chevron and cursor line. Use for command line, developer tools, coding environments, shell access, and technical documentation.",
    tags: ["console", "command", "cli", "shell", "prompt", "bash", "powershell", "developer", "devops", "script", "execute", "debug", "output", "log", "terminal-window"],
    draw: drawTerminal },
  { id: "api", label: "API/Network", category: "technology",
    description: "Central node connected to four surrounding nodes — network/API topology. Use for API endpoints, microservices, network diagrams, integrations, and system architecture.",
    tags: ["endpoint", "connection", "node", "graph", "microservice", "integration", "rest", "graphql", "webhook", "architecture", "topology", "mesh", "gateway", "connector", "hub"],
    draw: drawApi },
  { id: "bolt", label: "Lightning", category: "technology",
    description: "Lightning bolt / thunderbolt zigzag shape. Use for power, speed, electrical, flash sales, quick actions, energy, charging, and high-performance features.",
    tags: ["power", "fast", "electric", "energy", "thunder", "flash", "quick", "instant", "charge", "voltage", "speed", "rapid", "turbo", "performance", "zap"],
    draw: drawBolt },
  { id: "ai", label: "AI/Brain", category: "technology",
    description: "Brain outline with internal neural connection curves — artificial intelligence symbol. Use for AI features, machine learning, neural networks, smart automation, and intelligent systems.",
    tags: ["artificial", "intelligence", "neural", "ml", "brain", "smart", "automation", "deep-learning", "cognitive", "algorithm", "model", "predict", "generative", "assistant", "thinking"],
    draw: drawAi },
  { id: "robot", label: "Robot", category: "technology",
    description: "Friendly robot face with antenna, square head, round eyes, and side ears. Use for chatbots, automation, robotics, AI assistants, tech mascots, and machine interfaces.",
    tags: ["bot", "automation", "android", "machine", "chatbot", "assistant", "mechanical", "mascot", "cyborg", "humanoid", "automated", "digital-worker", "ai", "tech", "smart"],
    draw: drawRobot },
  { id: "magnet", label: "Magnet", category: "technology",
    description: "U-shaped horseshoe magnet with pole markings. Use for lead magnets, attraction marketing, retention, magnetic content, pull strategies, and engagement.",
    tags: ["attract", "pull", "retention", "lead", "engagement", "magnetic", "horseshoe", "force", "sticky", "grab", "interest", "convert", "funnel", "inbound", "draw-in"],
    draw: drawMagnet },
  { id: "fingerprint", label: "Fingerprint", category: "technology",
    description: "Concentric fingerprint ridges forming a biometric pattern. Use for biometric auth, identity verification, security, unique identification, and personalization.",
    tags: ["biometric", "identity", "auth", "secure", "unique", "verification", "scan", "touch-id", "personal", "forensic", "pattern", "sensor", "recognition", "unlock", "privacy"],
    draw: drawFingerprint },

  // =========================================================================
  //  NATURE & LIFESTYLE (10)
  // =========================================================================
  { id: "heart", label: "Heart", category: "lifestyle",
    description: "Classic heart shape with two curved lobes meeting at a point. Use for love, favorites, likes, health/wellness, charity, romance, and emotional content.",
    tags: ["love", "like", "health", "favorite", "wellness", "romance", "charity", "care", "passion", "emotion", "valentine", "dating", "affection", "wish", "donate"],
    draw: drawHeart },
  { id: "star", label: "Star", category: "lifestyle",
    description: "Five-pointed star with alternating outer and inner vertices. Use for ratings, reviews, favorites, featured content, quality marks, rewards, and excellence.",
    tags: ["rating", "favorite", "featured", "quality", "review", "five-star", "top", "best", "premium", "highlight", "bookmark", "excellent", "gold", "rank", "recommend"],
    draw: drawStar },
  { id: "sun", label: "Sun", category: "lifestyle",
    description: "Circle with radiating ray lines — bright sun symbol. Use for daytime, brightness, summer, outdoor activities, solar energy, light mode, and positive vibes.",
    tags: ["day", "light", "bright", "weather", "summer", "outdoor", "solar", "energy", "warm", "morning", "sunshine", "tropical", "positive", "vitamin-d", "beach"],
    draw: drawSun },
  { id: "moon", label: "Moon", category: "lifestyle",
    description: "Crescent moon shape — nighttime/dark mode symbol. Use for night, dark mode toggle, sleep, dreams, nightlife, astronomy, and evening content.",
    tags: ["night", "dark", "sleep", "theme", "crescent", "dream", "evening", "lunar", "astronomy", "nightlife", "dark-mode", "rest", "calm", "twilight", "stargazing"],
    draw: drawMoon },
  { id: "leaf", label: "Leaf", category: "lifestyle",
    description: "Single leaf with pointed tip and center vein line. Use for eco-friendly, organic products, sustainability, nature, green initiatives, and environmental content.",
    tags: ["nature", "eco", "green", "organic", "sustainable", "environment", "plant", "garden", "vegan", "natural", "renewable", "fresh", "herbal", "botanical", "earth"],
    draw: drawLeaf },
  { id: "tree", label: "Tree", category: "lifestyle",
    description: "Evergreen/pine tree with layered triangular canopy and trunk. Use for nature, forestry, growth, family trees, environmental campaigns, and woodland themes.",
    tags: ["nature", "forest", "growth", "environment", "pine", "evergreen", "woodland", "park", "timber", "family-tree", "roots", "canopy", "planting", "conservation", "camping"],
    draw: drawTree },
  { id: "flame", label: "Flame", category: "lifestyle",
    description: "Fire flame with outer and inner flame layers. Use for hot deals, trending content, fire sales, energy, passion, spicy food, and popular/viral items.",
    tags: ["fire", "hot", "trending", "popular", "viral", "heat", "spicy", "sale", "passion", "energy", "burning", "ignite", "blaze", "warmth", "bbq"],
    draw: drawFlame },
  { id: "drop", label: "Water Drop", category: "lifestyle",
    description: "Water droplet with pointed top and rounded bottom. Use for water, rain, hydration, beverages, cleaning, plumbing, tears, and liquid-related content.",
    tags: ["water", "liquid", "rain", "hydration", "beverage", "clean", "pure", "splash", "droplet", "tear", "moisture", "dew", "aqua", "plumbing", "fountain"],
    draw: drawDrop },
  { id: "coffee", label: "Coffee", category: "lifestyle",
    description: "Coffee mug with handle and two steam wisps rising from top. Use for coffee shops, cafes, morning routines, beverages, meetings over coffee, and break time.",
    tags: ["cafe", "drink", "morning", "beverage", "cup", "tea", "latte", "espresso", "hot", "break", "meeting", "barista", "shop", "brew", "relaxation"],
    draw: drawCoffee },
  { id: "glasses", label: "Glasses", category: "lifestyle",
    description: "Pair of eyeglasses with two circular lenses, bridge, and temple arms. Use for reading, vision, smart/intellectual branding, fashion accessories, and optical services.",
    tags: ["vision", "smart", "reading", "fashion", "optical", "intellectual", "nerd", "geek", "spectacles", "eyewear", "lens", "frame", "style", "academic", "see"],
    draw: drawGlasses },

  // =========================================================================
  //  ARROWS & UI (10)
  // =========================================================================
  { id: "arrow-right", label: "Arrow Right", category: "arrows-ui",
    description: "Horizontal arrow pointing right with arrowhead. Use for next/forward navigation, continue buttons, progress indicators, and directional cues.",
    tags: ["next", "forward", "direction", "continue", "proceed", "go", "right", "navigate", "progress", "advance", "following", "step", "flow", "move", "action"],
    draw: drawArrowRight },
  { id: "arrow-up", label: "Arrow Up", category: "arrows-ui",
    description: "Vertical arrow pointing upward with arrowhead. Use for increase, improvement, upload, scroll-to-top, upvote, and ascending actions.",
    tags: ["top", "increase", "up", "improve", "rise", "scroll", "upvote", "ascending", "higher", "boost", "elevate", "climb", "upgrade", "above", "raise"],
    draw: drawArrowUp },
  { id: "check", label: "Checkmark", category: "arrows-ui",
    description: "Bold checkmark/tick mark — universal symbol for completion and approval. Use for completed tasks, success states, verified items, form validation, and approval indicators.",
    tags: ["done", "success", "complete", "verified", "approved", "correct", "valid", "confirm", "accept", "pass", "tick", "yes", "finished", "ok", "good"],
    draw: drawCheck },
  { id: "close", label: "Close/X", category: "arrows-ui",
    description: "Bold X mark — cross/close symbol. Use for close buttons, dismiss actions, cancel operations, error states, remove items, and clear/reset actions.",
    tags: ["cancel", "delete", "remove", "dismiss", "exit", "clear", "stop", "reject", "wrong", "error", "no", "x-mark", "terminate", "abort", "reset"],
    draw: drawClose },
  { id: "plus", label: "Plus", category: "arrows-ui",
    description: "Bold plus sign (+) — addition/create symbol. Use for add buttons, create new items, expand sections, zoom in, and positive actions.",
    tags: ["add", "new", "create", "expand", "more", "increase", "positive", "append", "insert", "grow", "additional", "extra", "open", "include", "zoom-in"],
    draw: drawPlus },
  { id: "minus", label: "Minus", category: "arrows-ui",
    description: "Bold minus/dash sign — subtraction/remove symbol. Use for remove buttons, decrease quantities, collapse sections, zoom out, and negative actions.",
    tags: ["remove", "subtract", "collapse", "decrease", "less", "reduce", "shrink", "hide", "minimize", "negative", "exclude", "delete", "fold", "close", "zoom-out"],
    draw: drawMinus },
  { id: "search", label: "Search", category: "arrows-ui",
    description: "Magnifying glass with circular lens and angled handle. Use for search bars, find features, lookup functionality, explore sections, and discovery.",
    tags: ["find", "magnify", "lookup", "query", "explore", "discover", "filter", "browse", "seek", "inspect", "investigate", "scan", "hunt", "locate", "lens"],
    draw: drawSearch },
  { id: "menu", label: "Menu", category: "arrows-ui",
    description: "Three horizontal parallel lines — hamburger menu icon. Use for navigation menus, mobile menus, sidebar toggles, and menu dropdowns.",
    tags: ["hamburger", "navigation", "list", "sidebar", "toggle", "drawer", "nav", "mobile", "dropdown", "options", "three-lines", "panel", "collapse", "open", "responsive"],
    draw: drawMenu },
  { id: "refresh", label: "Refresh", category: "arrows-ui",
    description: "Circular arrow forming a partial loop with arrowhead tip. Use for refresh/reload actions, sync operations, retry, update content, and redo actions.",
    tags: ["reload", "sync", "update", "retry", "redo", "loop", "circular", "repeat", "renew", "restart", "regenerate", "cycle", "again", "recalculate", "live"],
    draw: drawRefresh },
  { id: "expand", label: "Expand", category: "arrows-ui",
    description: "Four outward-pointing corner arrows — fullscreen/expand symbol. Use for fullscreen toggle, maximize, expand content, enlarge view, and resize actions.",
    tags: ["fullscreen", "maximize", "resize", "enlarge", "zoom", "bigger", "stretch", "widen", "grow", "scale-up", "fit", "fill", "viewport", "immersive", "theater"],
    draw: drawExpand },

  // =========================================================================
  //  COMMERCE & FINANCE (10)
  // =========================================================================
  { id: "shopping-cart", label: "Shopping Cart", category: "commerce",
    description: "Shopping cart with basket body and two wheels. Use for e-commerce, buy buttons, product pages, checkout, add-to-cart actions, and online stores.",
    tags: ["buy", "shop", "ecommerce", "basket", "cart", "checkout", "purchase", "store", "retail", "online", "add-to-cart", "product", "order", "marketplace", "consumer"],
    draw: drawShoppingCart },
  { id: "credit-card", label: "Credit Card", category: "commerce",
    description: "Payment card with magnetic stripe and chip area. Use for payment methods, checkout, billing, subscriptions, card-on-file, and accepted payment icons.",
    tags: ["payment", "visa", "mastercard", "charge", "billing", "stripe", "chip", "debit", "swipe", "tap", "contactless", "subscription", "checkout", "transaction", "bank-card"],
    draw: drawCreditCard },
  { id: "wallet", label: "Wallet", category: "commerce",
    description: "Wallet/billfold with card slot and clasp dot. Use for digital wallets, payment apps, stored payment methods, funds balance, and personal finance.",
    tags: ["money", "payment", "digital", "funds", "balance", "billfold", "apple-pay", "google-pay", "stored-value", "purse", "cash", "pocket", "personal-finance", "ewallet", "crypto"],
    draw: drawWallet },
  { id: "tag", label: "Price Tag", category: "commerce",
    description: "Price tag with angled shape, string hole dot, and pointed end. Use for pricing, discounts, labels, sale events, product tags, and promotional offers.",
    tags: ["label", "price", "sale", "discount", "offer", "promo", "deal", "markdown", "clearance", "coupon", "value", "cost", "retail", "wholesale", "bargain"],
    draw: drawTag },
  { id: "receipt", label: "Receipt", category: "commerce",
    description: "Receipt/till slip with zigzag torn bottom edge and printed text lines. Use for transaction records, purchase confirmation, expense tracking, and proof of payment.",
    tags: ["invoice", "bill", "transaction", "proof", "purchase", "expense", "record", "confirmation", "till", "pos", "total", "subtotal", "tax", "register", "slip"],
    draw: drawReceipt },
  { id: "bank", label: "Bank", category: "commerce",
    description: "Classical bank building with triangular pediment roof, four pillars, and stepped base. Use for banking services, financial institutions, loans, mortgages, and monetary systems.",
    tags: ["finance", "institution", "savings", "loan", "mortgage", "deposit", "withdraw", "interest", "federal", "reserve", "treasury", "vault", "branch", "checking", "capital"],
    draw: drawBank },
  { id: "piggy-bank", label: "Piggy Bank", category: "commerce",
    description: "Cute piggy bank with coin slot, legs, ear, snout, and eye. Use for savings, investment, budgeting, financial planning, kids finance, and money-saving tips.",
    tags: ["savings", "money", "invest", "accumulate", "budget", "financial-planning", "kids", "coins", "frugal", "save-up", "nest-egg", "rainy-day", "deposit", "goal", "thrift"],
    draw: drawPiggyBank },
  { id: "percent", label: "Percent", category: "commerce",
    description: "Percent sign (%) with two circles and diagonal slash. Use for discounts, interest rates, statistics, probability, tax rates, and percentage-based content.",
    tags: ["discount", "rate", "off", "deal", "interest", "statistics", "probability", "tax", "commission", "markup", "margin", "yield", "apr", "percentage", "ratio"],
    draw: drawPercent },
  { id: "gift", label: "Gift", category: "commerce",
    description: "Wrapped gift box with ribbon bow on top and cross ribbon. Use for gifts, rewards, promotions, loyalty programs, birthday celebrations, and special offers.",
    tags: ["present", "reward", "bonus", "surprise", "birthday", "holiday", "celebration", "loyalty", "promotion", "offer", "wrap", "ribbon", "box", "giveaway", "voucher"],
    draw: drawGift },
  { id: "truck", label: "Truck", category: "commerce",
    description: "Delivery truck with cargo box, cab, and wheels on ground line. Use for shipping, delivery services, logistics, fleet management, moving, and freight.",
    tags: ["delivery", "shipping", "logistics", "transport", "freight", "fleet", "moving", "courier", "package", "express", "overnight", "carrier", "dispatch", "supply-chain", "last-mile"],
    draw: drawTruck },
];

// ---------------------------------------------------------------------------
// ICON REGISTRY — fast O(1) lookup by id
// ---------------------------------------------------------------------------

export const ICON_REGISTRY: Record<string, IconDrawFn> = {};
for (const meta of ICON_BANK) {
  ICON_REGISTRY[meta.id] = meta.draw;
}

// ---------------------------------------------------------------------------
// ICON CATEGORIES — browsable metadata
// ---------------------------------------------------------------------------

export const ICON_CATEGORIES: IconCategory[] = [
  { id: "social-media", label: "Social Media",         description: "Social networks, messaging, and platform icons",          count: 20 },
  { id: "contact",      label: "Contact & Communication", description: "Phone, email, chat, and messaging icons",            count: 15 },
  { id: "business",     label: "Business & Professional", description: "Corporate, finance, analytics, and workplace icons",  count: 20 },
  { id: "creative",     label: "Creative & Design",    description: "Art, photography, media, and design tool icons",          count: 15 },
  { id: "technology",   label: "Technology & Web",      description: "Development, servers, AI, and digital infrastructure",    count: 15 },
  { id: "lifestyle",    label: "Nature & Lifestyle",    description: "Nature, wellness, daily life, and decorative icons",      count: 10 },
  { id: "arrows-ui",    label: "Arrows & UI",           description: "Navigation, actions, and interface control icons",        count: 10 },
  { id: "commerce",     label: "Commerce & Finance",    description: "Shopping, payment, delivery, and financial icons",        count: 10 },
];

// ---------------------------------------------------------------------------
// PUBLIC API — Primary functions for consuming icons
// ---------------------------------------------------------------------------

/**
 * Draw any icon by string ID. The primary entry point for all workspaces.
 * Falls back to a simple circle if the icon ID is unknown.
 */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  iconId: string,
  x: number,
  y: number,
  size: number,
  color: string,
  strokeWidth?: number
): void {
  const fn = ICON_REGISTRY[iconId];
  if (fn) {
    fn(ctx, x, y, size, color, strokeWidth);
  } else {
    // Fallback: simple filled circle
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Get all icons in a specific category */
export function getIconsByCategory(categoryId: string): IconMeta[] {
  return ICON_BANK.filter(i => i.category === categoryId);
}

/** Search icons by query — searches id, label, tags, AND description for maximum recall */
export function searchIcons(query: string): IconMeta[] {
  const q = query.toLowerCase().trim();
  if (!q) return ICON_BANK;
  const words = q.split(/\s+/);
  return ICON_BANK.filter(i => {
    const haystack = `${i.id} ${i.label} ${i.description} ${i.tags.join(" ")}`.toLowerCase();
    return words.every(w => haystack.includes(w));
  });
}

/**
 * Match icons that are contextually relevant to a user's design request.
 * Scores icons by how many query words appear in their metadata and returns
 * top N matches sorted by relevance.
 */
export function matchIconsForContext(
  userText: string,
  maxResults = 8,
): IconMeta[] {
  const words = userText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (!words.length) return [];

  const scored = ICON_BANK.map(icon => {
    const haystack = `${icon.id} ${icon.label} ${icon.description} ${icon.tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (haystack.includes(w)) score++;
    }
    return { icon, score };
  })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults).map(s => s.icon);
}

/** Get all icon IDs as a flat array (for AI prompt injection) */
export function getAllIconIds(): string[] {
  return ICON_BANK.map(i => i.id);
}

/**
 * Get a formatted icon catalog for AI prompt context.
 * Includes descriptions so the AI understands what each icon looks like
 * and when to use it.
 */
export function getIconListForAI(): string {
  return ICON_CATEGORIES.map(cat => {
    const icons = getIconsByCategory(cat.id);
    const lines = icons.map(i => `  • ${i.id}: ${i.description}`);
    return `## ${cat.label} (${icons.length})\n${lines.join("\n")}`;
  }).join("\n\n");
}

/**
 * Compact version of icon list for token-constrained prompts.
 * Lists IDs with short labels only.
 */
export function getIconListForAICompact(): string {
  return ICON_CATEGORIES.map(cat => {
    const icons = getIconsByCategory(cat.id);
    return `${cat.label} (${icons.length}): ${icons.map(i => `${i.id} (${i.label})`).join(", ")}`;
  }).join("\n");
}

// ---------------------------------------------------------------------------
// AI ICON PLACEMENT — types & rendering for AI-driven icon placement
// ---------------------------------------------------------------------------

/** Describes where the AI wants to place an icon on the canvas */
export interface AIIconPlacement {
  iconId: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

/**
 * Render an array of AI-specified icon placements onto a canvas.
 * Silently skips unknown icon IDs (falls back to drawIcon's circle).
 */
export function drawIconPlacements(
  ctx: CanvasRenderingContext2D,
  placements: AIIconPlacement[],
): void {
  for (const p of placements) {
    drawIcon(ctx, p.iconId, p.x, p.y, p.size, p.color);
  }
}

/** Total icon count */
export const ICON_COUNT = ICON_BANK.length;
