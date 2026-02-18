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
  // Social Media
  { id: "linkedin",    label: "LinkedIn",     category: "social-media",   tags: ["social", "professional", "network", "job"], draw: drawLinkedin },
  { id: "twitter-x",   label: "X (Twitter)",  category: "social-media",   tags: ["social", "microblog", "tweet"], draw: drawTwitterX },
  { id: "facebook",    label: "Facebook",     category: "social-media",   tags: ["social", "network", "meta"], draw: drawFacebook },
  { id: "instagram",   label: "Instagram",    category: "social-media",   tags: ["social", "photo", "stories", "reels"], draw: drawInstagram },
  { id: "youtube",     label: "YouTube",      category: "social-media",   tags: ["video", "streaming", "content"], draw: drawYoutube },
  { id: "tiktok",      label: "TikTok",       category: "social-media",   tags: ["video", "short", "viral"], draw: drawTiktok },
  { id: "pinterest",   label: "Pinterest",    category: "social-media",   tags: ["inspiration", "boards", "visual"], draw: drawPinterest },
  { id: "snapchat",    label: "Snapchat",     category: "social-media",   tags: ["messaging", "stories", "ephemeral"], draw: drawSnapchat },
  { id: "whatsapp",    label: "WhatsApp",     category: "social-media",   tags: ["messaging", "chat", "communication"], draw: drawWhatsapp },
  { id: "telegram",    label: "Telegram",     category: "social-media",   tags: ["messaging", "chat", "privacy"], draw: drawTelegram },
  { id: "reddit",      label: "Reddit",       category: "social-media",   tags: ["forum", "community", "discussion"], draw: drawReddit },
  { id: "discord",     label: "Discord",      category: "social-media",   tags: ["gaming", "community", "voice"], draw: drawDiscord },
  { id: "github",      label: "GitHub",       category: "social-media",   tags: ["code", "developer", "repository"], draw: drawGithub },
  { id: "dribbble",    label: "Dribbble",     category: "social-media",   tags: ["design", "portfolio", "creative"], draw: drawDribbble },
  { id: "behance",     label: "Behance",      category: "social-media",   tags: ["design", "portfolio", "adobe"], draw: drawBehance },
  { id: "spotify",     label: "Spotify",      category: "social-media",   tags: ["music", "streaming", "audio"], draw: drawSpotify },
  { id: "slack",       label: "Slack",        category: "social-media",   tags: ["team", "communication", "work"], draw: drawSlack },
  { id: "threads",     label: "Threads",      category: "social-media",   tags: ["social", "text", "meta"], draw: drawThreads },
  { id: "mastodon",    label: "Mastodon",     category: "social-media",   tags: ["social", "fediverse", "decentralized"], draw: drawMastodon },
  { id: "bluesky",     label: "Bluesky",      category: "social-media",   tags: ["social", "microblog", "decentralized"], draw: drawBluesky },

  // Contact & Communication
  { id: "phone",       label: "Phone",        category: "contact",        tags: ["call", "telephone", "dial"], draw: drawPhone },
  { id: "email",       label: "Email",        category: "contact",        tags: ["mail", "envelope", "message"], draw: drawEmail },
  { id: "globe",       label: "Globe/Web",    category: "contact",        tags: ["website", "world", "internet", "url"], draw: drawGlobe },
  { id: "map-pin",     label: "Location",     category: "contact",        tags: ["address", "pin", "gps", "place"], draw: drawMapPin },
  { id: "chat",        label: "Chat",         category: "contact",        tags: ["message", "bubble", "conversation"], draw: drawChat },
  { id: "video-call",  label: "Video Call",   category: "contact",        tags: ["meeting", "zoom", "camera"], draw: drawVideoCall },
  { id: "fax",         label: "Fax",          category: "contact",        tags: ["document", "legacy", "machine"], draw: drawFax },
  { id: "mobile",      label: "Mobile",       category: "contact",        tags: ["smartphone", "cell", "device"], draw: drawMobile },
  { id: "at",          label: "At Symbol",    category: "contact",        tags: ["email", "mention", "handle"], draw: drawAt },
  { id: "link",        label: "Link",         category: "contact",        tags: ["url", "chain", "connection"], draw: drawLink },
  { id: "headphones",  label: "Headphones",   category: "contact",        tags: ["audio", "listen", "support"], draw: drawHeadphones },
  { id: "microphone",  label: "Microphone",   category: "contact",        tags: ["audio", "voice", "podcast", "record"], draw: drawMicrophone },
  { id: "send",        label: "Send",         category: "contact",        tags: ["paper", "plane", "submit"], draw: drawSend },
  { id: "inbox",       label: "Inbox",        category: "contact",        tags: ["mail", "receive", "tray"], draw: drawInbox },
  { id: "qr-code",     label: "QR Code",      category: "contact",        tags: ["scan", "barcode", "digital"], draw: drawQrCode },

  // Business & Professional
  { id: "briefcase",     label: "Briefcase",     category: "business",     tags: ["work", "job", "portfolio", "case"], draw: drawBriefcase },
  { id: "building",      label: "Building",      category: "business",     tags: ["office", "company", "corporate", "hq"], draw: drawBuilding },
  { id: "calendar",      label: "Calendar",      category: "business",     tags: ["date", "schedule", "event", "planner"], draw: drawCalendar },
  { id: "clock",         label: "Clock",         category: "business",     tags: ["time", "hour", "schedule", "deadline"], draw: drawClock },
  { id: "dollar",        label: "Dollar",        category: "business",     tags: ["money", "currency", "finance", "payment"], draw: drawDollar },
  { id: "chart-bar",     label: "Bar Chart",     category: "business",     tags: ["analytics", "data", "graph", "metrics"], draw: drawChartBar },
  { id: "chart-line",    label: "Line Chart",    category: "business",     tags: ["analytics", "data", "trend", "growth"], draw: drawChartLine },
  { id: "users",         label: "Users/Team",    category: "business",     tags: ["people", "group", "team", "collaboration"], draw: drawUsers },
  { id: "user",          label: "User",          category: "business",     tags: ["person", "profile", "account"], draw: drawUser },
  { id: "handshake",     label: "Handshake",     category: "business",     tags: ["deal", "agreement", "partnership"], draw: drawHandshake },
  { id: "award",         label: "Award",         category: "business",     tags: ["medal", "trophy", "achievement", "badge"], draw: drawAward },
  { id: "target",        label: "Target",        category: "business",     tags: ["goal", "bullseye", "aim", "focus"], draw: drawTarget },
  { id: "presentation",  label: "Presentation",  category: "business",     tags: ["slides", "pitch", "screen", "projector"], draw: drawPresentation },
  { id: "certificate",   label: "Certificate",   category: "business",     tags: ["diploma", "license", "credential"], draw: drawCertificate },
  { id: "invoice",       label: "Invoice",       category: "business",     tags: ["bill", "document", "receipt", "payment"], draw: drawInvoice },
  { id: "contract",      label: "Contract",      category: "business",     tags: ["document", "signature", "agreement", "legal"], draw: drawContract },
  { id: "lightbulb",     label: "Lightbulb",     category: "business",     tags: ["idea", "innovation", "creative", "concept"], draw: drawLightbulb },
  { id: "rocket",        label: "Rocket",        category: "business",     tags: ["launch", "startup", "growth", "speed"], draw: drawRocket },
  { id: "gem",           label: "Gem",           category: "business",     tags: ["diamond", "value", "premium", "luxury"], draw: drawGem },
  { id: "shield",        label: "Shield",        category: "business",     tags: ["security", "protection", "trust", "verified"], draw: drawShield },

  // Creative & Design
  { id: "palette",       label: "Palette",       category: "creative",     tags: ["art", "color", "paint", "design"], draw: drawPalette },
  { id: "pen",           label: "Pen",           category: "creative",     tags: ["write", "edit", "draw", "sketch"], draw: drawPen },
  { id: "camera",        label: "Camera",        category: "creative",     tags: ["photo", "photography", "capture"], draw: drawCamera },
  { id: "film",          label: "Film",          category: "creative",     tags: ["movie", "cinema", "video", "reel"], draw: drawFilm },
  { id: "music",         label: "Music",         category: "creative",     tags: ["note", "audio", "song", "melody"], draw: drawMusic },
  { id: "brush",         label: "Brush",         category: "creative",     tags: ["paint", "art", "stroke", "creative"], draw: drawBrush },
  { id: "layers",        label: "Layers",        category: "creative",     tags: ["stack", "design", "depth", "compose"], draw: drawLayers },
  { id: "grid",          label: "Grid",          category: "creative",     tags: ["layout", "table", "structure", "matrix"], draw: drawGrid },
  { id: "crop",          label: "Crop",          category: "creative",     tags: ["resize", "trim", "frame", "cut"], draw: drawCrop },
  { id: "wand",          label: "Magic Wand",    category: "creative",     tags: ["magic", "sparkle", "auto", "enhance"], draw: drawWand },
  { id: "eye",           label: "Eye",           category: "creative",     tags: ["view", "visible", "preview", "watch"], draw: drawEye },
  { id: "download",      label: "Download",      category: "creative",     tags: ["save", "export", "arrow", "get"], draw: drawDownload },
  { id: "upload",        label: "Upload",        category: "creative",     tags: ["import", "send", "arrow", "push"], draw: drawUpload },
  { id: "print",         label: "Print",         category: "creative",     tags: ["printer", "paper", "output", "hard copy"], draw: drawPrint },
  { id: "color-swatch",  label: "Color Swatch",  category: "creative",     tags: ["palette", "theme", "scheme", "picker"], draw: drawColorSwatch },

  // Technology & Web
  { id: "code",          label: "Code",          category: "technology",   tags: ["programming", "developer", "html", "brackets"], draw: drawCode },
  { id: "server",        label: "Server",        category: "technology",   tags: ["hosting", "data", "rack", "infrastructure"], draw: drawServer },
  { id: "cloud",         label: "Cloud",         category: "technology",   tags: ["storage", "hosting", "saas", "sync"], draw: drawCloud },
  { id: "wifi",          label: "WiFi",          category: "technology",   tags: ["wireless", "internet", "signal", "connectivity"], draw: drawWifi },
  { id: "database",      label: "Database",      category: "technology",   tags: ["storage", "sql", "records", "data"], draw: drawDatabase },
  { id: "cpu",           label: "CPU/Chip",      category: "technology",   tags: ["processor", "hardware", "computing", "chip"], draw: drawCpu },
  { id: "lock",          label: "Lock",          category: "technology",   tags: ["security", "password", "privacy", "encrypt"], draw: drawLock },
  { id: "settings",      label: "Settings",      category: "technology",   tags: ["gear", "config", "options", "preferences"], draw: drawSettings },
  { id: "terminal",      label: "Terminal",      category: "technology",   tags: ["console", "command", "cli", "shell"], draw: drawTerminal },
  { id: "api",           label: "API/Network",   category: "technology",   tags: ["endpoint", "connection", "node", "graph"], draw: drawApi },
  { id: "bolt",          label: "Lightning",     category: "technology",   tags: ["power", "fast", "electric", "energy"], draw: drawBolt },
  { id: "ai",            label: "AI/Brain",      category: "technology",   tags: ["artificial", "intelligence", "neural", "ml"], draw: drawAi },
  { id: "robot",         label: "Robot",         category: "technology",   tags: ["bot", "automation", "android", "machine"], draw: drawRobot },
  { id: "magnet",        label: "Magnet",        category: "technology",   tags: ["attract", "pull", "retention", "lead"], draw: drawMagnet },
  { id: "fingerprint",   label: "Fingerprint",   category: "technology",   tags: ["biometric", "identity", "auth", "secure"], draw: drawFingerprint },

  // Nature & Lifestyle
  { id: "heart",        label: "Heart",        category: "lifestyle",     tags: ["love", "like", "health", "favorite"], draw: drawHeart },
  { id: "star",         label: "Star",         category: "lifestyle",     tags: ["rating", "favorite", "featured", "quality"], draw: drawStar },
  { id: "sun",          label: "Sun",          category: "lifestyle",     tags: ["day", "light", "bright", "weather"], draw: drawSun },
  { id: "moon",         label: "Moon",         category: "lifestyle",     tags: ["night", "dark", "sleep", "theme"], draw: drawMoon },
  { id: "leaf",         label: "Leaf",         category: "lifestyle",     tags: ["nature", "eco", "green", "organic"], draw: drawLeaf },
  { id: "tree",         label: "Tree",         category: "lifestyle",     tags: ["nature", "forest", "growth", "environment"], draw: drawTree },
  { id: "flame",        label: "Flame",        category: "lifestyle",     tags: ["fire", "hot", "trending", "popular"], draw: drawFlame },
  { id: "drop",         label: "Water Drop",   category: "lifestyle",     tags: ["water", "liquid", "rain", "hydration"], draw: drawDrop },
  { id: "coffee",       label: "Coffee",       category: "lifestyle",     tags: ["cafe", "drink", "morning", "beverage"], draw: drawCoffee },
  { id: "glasses",      label: "Glasses",      category: "lifestyle",     tags: ["vision", "smart", "reading", "fashion"], draw: drawGlasses },

  // Arrows & UI
  { id: "arrow-right",  label: "Arrow Right",  category: "arrows-ui",     tags: ["next", "forward", "direction"], draw: drawArrowRight },
  { id: "arrow-up",     label: "Arrow Up",     category: "arrows-ui",     tags: ["top", "increase", "up"], draw: drawArrowUp },
  { id: "check",        label: "Checkmark",    category: "arrows-ui",     tags: ["done", "success", "complete", "verified"], draw: drawCheck },
  { id: "close",        label: "Close/X",      category: "arrows-ui",     tags: ["cancel", "delete", "remove", "dismiss"], draw: drawClose },
  { id: "plus",         label: "Plus",         category: "arrows-ui",     tags: ["add", "new", "create", "expand"], draw: drawPlus },
  { id: "minus",        label: "Minus",        category: "arrows-ui",     tags: ["remove", "subtract", "collapse"], draw: drawMinus },
  { id: "search",       label: "Search",       category: "arrows-ui",     tags: ["find", "magnify", "lookup", "query"], draw: drawSearch },
  { id: "menu",         label: "Menu",         category: "arrows-ui",     tags: ["hamburger", "navigation", "list"], draw: drawMenu },
  { id: "refresh",      label: "Refresh",      category: "arrows-ui",     tags: ["reload", "sync", "update", "retry"], draw: drawRefresh },
  { id: "expand",       label: "Expand",       category: "arrows-ui",     tags: ["fullscreen", "maximize", "resize"], draw: drawExpand },

  // Commerce & Finance
  { id: "shopping-cart", label: "Shopping Cart", category: "commerce",     tags: ["buy", "shop", "ecommerce", "basket"], draw: drawShoppingCart },
  { id: "credit-card",  label: "Credit Card",  category: "commerce",      tags: ["payment", "visa", "mastercard", "charge"], draw: drawCreditCard },
  { id: "wallet",       label: "Wallet",       category: "commerce",      tags: ["money", "payment", "digital", "funds"], draw: drawWallet },
  { id: "tag",          label: "Price Tag",    category: "commerce",      tags: ["label", "price", "sale", "discount"], draw: drawTag },
  { id: "receipt",      label: "Receipt",      category: "commerce",      tags: ["invoice", "bill", "transaction", "proof"], draw: drawReceipt },
  { id: "bank",         label: "Bank",         category: "commerce",      tags: ["finance", "institution", "savings", "loan"], draw: drawBank },
  { id: "piggy-bank",   label: "Piggy Bank",   category: "commerce",      tags: ["savings", "money", "invest", "accumulate"], draw: drawPiggyBank },
  { id: "percent",      label: "Percent",      category: "commerce",      tags: ["discount", "rate", "off", "deal"], draw: drawPercent },
  { id: "gift",         label: "Gift",         category: "commerce",      tags: ["present", "reward", "bonus", "surprise"], draw: drawGift },
  { id: "truck",        label: "Truck",        category: "commerce",      tags: ["delivery", "shipping", "logistics", "transport"], draw: drawTruck },
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

/** Search icons by tag keyword (fuzzy) */
export function searchIcons(query: string): IconMeta[] {
  const q = query.toLowerCase().trim();
  if (!q) return ICON_BANK;
  return ICON_BANK.filter(
    i => i.id.includes(q) || i.label.toLowerCase().includes(q) || i.tags.some(t => t.includes(q))
  );
}

/** Get all icon IDs as a flat array (for AI prompt injection) */
export function getAllIconIds(): string[] {
  return ICON_BANK.map(i => i.id);
}

/** Get a formatted list for AI prompt context */
export function getIconListForAI(): string {
  return ICON_CATEGORIES.map(cat => {
    const icons = getIconsByCategory(cat.id);
    return `${cat.label} (${icons.length}): ${icons.map(i => i.id).join(", ")}`;
  }).join("\n");
}

/** Total icon count */
export const ICON_COUNT = ICON_BANK.length;
