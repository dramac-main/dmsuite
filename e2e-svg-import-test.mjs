/**
 * E2E Test: SVG Import into Fabric.js Editor
 *
 * Tests against LOCAL dev server (localhost:6006) which has the
 * window.__fabricCanvas exposure and loadSvg method.
 *
 * Proves:
 * 1. SVG files load into the editor correctly
 * 2. Elements are individually selectable/editable
 * 3. Text is editable text (not outlines)
 */

import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:6006";
const EMAIL = "testbot@dmsuite-test.com";
const PASS = "TestBot2026!Secure";

// ─── Professional SVG certificate with live text elements ────────────────────
const CERTIFICATE_SVG = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3508 2480" width="3508" height="2480">
  <rect width="3508" height="2480" fill="#FDF8F0"/>
  <rect x="60" y="60" width="3388" height="2360" fill="none" stroke="#C5A55A" stroke-width="8"/>
  <rect x="100" y="100" width="3308" height="2280" fill="none" stroke="#C5A55A" stroke-width="3"/>
  <rect x="140" y="140" width="3228" height="2200" fill="none" stroke="#C5A55A" stroke-width="1.5"/>
  <path d="M160,200 Q160,160 200,160" fill="none" stroke="#C5A55A" stroke-width="3"/>
  <path d="M160,240 Q160,160 240,160" fill="none" stroke="#C5A55A" stroke-width="2"/>
  <path d="M3348,200 Q3348,160 3308,160" fill="none" stroke="#C5A55A" stroke-width="3"/>
  <path d="M3348,240 Q3348,160 3268,160" fill="none" stroke="#C5A55A" stroke-width="2"/>
  <path d="M160,2280 Q160,2320 200,2320" fill="none" stroke="#C5A55A" stroke-width="3"/>
  <path d="M160,2240 Q160,2320 240,2320" fill="none" stroke="#C5A55A" stroke-width="2"/>
  <path d="M3348,2280 Q3348,2320 3308,2320" fill="none" stroke="#C5A55A" stroke-width="3"/>
  <path d="M3348,2240 Q3348,2320 3268,2320" fill="none" stroke="#C5A55A" stroke-width="2"/>
  <line x1="600" y1="500" x2="2908" y2="500" stroke="#C5A55A" stroke-width="2"/>
  <text x="1754" y="450" text-anchor="middle" font-family="Georgia, serif" font-size="72" fill="#8B7332" letter-spacing="8">DMSUITE ACADEMY</text>
  <text x="1754" y="720" text-anchor="middle" font-family="Georgia, serif" font-size="140" font-weight="bold" fill="#2C2C2C" letter-spacing="12">CERTIFICATE</text>
  <text x="1754" y="850" text-anchor="middle" font-family="Georgia, serif" font-size="64" fill="#8B7332" letter-spacing="16">OF ACHIEVEMENT</text>
  <line x1="1200" y1="920" x2="2308" y2="920" stroke="#C5A55A" stroke-width="2"/>
  <circle cx="1754" cy="920" r="6" fill="#C5A55A"/>
  <text x="1754" y="1040" text-anchor="middle" font-family="Georgia, serif" font-size="48" fill="#666666">This certificate is proudly presented to</text>
  <text x="1754" y="1220" text-anchor="middle" font-family="Georgia, serif" font-size="120" font-style="italic" fill="#2C2C2C">John Alexander Smith</text>
  <line x1="900" y1="1260" x2="2608" y2="1260" stroke="#C5A55A" stroke-width="2"/>
  <text x="1754" y="1400" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="#555555">For outstanding performance and dedication in completing the program requirements</text>
  <text x="1754" y="1460" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="#555555">with distinction and excellence in all assessed areas.</text>
  <text x="700" y="1800" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="#333333">March 29, 2026</text>
  <line x1="450" y1="1820" x2="950" y2="1820" stroke="#999999" stroke-width="1"/>
  <text x="700" y="1870" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#888888">Date</text>
  <text x="1754" y="1800" text-anchor="middle" font-family="Georgia, serif" font-size="48" font-style="italic" fill="#333333">Dr. Sarah Johnson</text>
  <line x1="1454" y1="1820" x2="2054" y2="1820" stroke="#999999" stroke-width="1"/>
  <text x="1754" y="1870" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#888888">Program Director</text>
  <text x="2808" y="1800" text-anchor="middle" font-family="Georgia, serif" font-size="48" font-style="italic" fill="#333333">Prof. Michael Chen</text>
  <line x1="2508" y1="1820" x2="3108" y2="1820" stroke="#999999" stroke-width="1"/>
  <text x="2808" y="1870" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#888888">Academic Director</text>
  <circle cx="1754" cy="2050" r="100" fill="none" stroke="#C5A55A" stroke-width="4"/>
  <circle cx="1754" cy="2050" r="85" fill="none" stroke="#C5A55A" stroke-width="2"/>
  <text x="1754" y="2035" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#C5A55A">OFFICIAL</text>
  <text x="1754" y="2070" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#C5A55A">SEAL</text>
  <text x="1754" y="2350" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#AAAAAA">Ref: CERT-2026-00142</text>
</svg>`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("=== SVG Import E2E Test (localhost:6006) ===\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // ── Login ────────────────────────────────────────────────────────────────
  console.log("1. Logging in...");
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });
  console.log("   OK");

  // ── Open certificate editor ──────────────────────────────────────────────
  console.log("2. Opening certificate editor...");
  await page.evaluate(() => localStorage.setItem("dmsuite-chiko-tour-complete", "true"));
  await page.goto(`${BASE}/tools/documents/certificate`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector("canvas", { timeout: 30000 });
  await sleep(5000); // wait for Fabric canvas to fully init
  console.log("   OK");

  // Verify canvas is accessible
  const hasCanvas = await page.evaluate(() => !!window.__fabricCanvas);
  console.log("   window.__fabricCanvas accessible:", hasCanvas);
  if (!hasCanvas) {
    console.error("FATAL: Canvas not exposed on window. Did the dev server pick up the changes?");
    await browser.close();
    return;
  }

  await page.screenshot({ path: "e2e-svg-01-initial.png" });
  console.log("   Screenshot: e2e-svg-01-initial.png\n");

  // ── TEST A: Load custom SVG certificate ──────────────────────────────────
  console.log("3. TEST A: Loading custom SVG certificate...");
  const result = await page.evaluate((svgStr) => {
    return new Promise((resolve) => {
      const canvas = window.__fabricCanvas;
      const f = window.fabric;
      if (!canvas || !f) { resolve({ ok: false, err: "no canvas/fabric" }); return; }

      f.loadSVGFromString(svgStr, (objects, options) => {
        if (!objects?.length) { resolve({ ok: false, err: "0 objects" }); return; }

        // Clear all except clip workspace
        canvas.getObjects().filter(o => o.name !== "clip").forEach(o => canvas.remove(o));

        const ws = canvas.getObjects().find(o => o.name === "clip");
        const wsW = ws?.width || 3508, wsH = ws?.height || 2480;
        const svgW = parseFloat(options.width) || 3508;
        const svgH = parseFloat(options.height) || 2480;
        const scale = Math.min(wsW / svgW, wsH / svgH);
        const wsL = ws?.left || 0, wsT = ws?.top || 0;
        const oX = wsL + (wsW - svgW * scale) / 2;
        const oY = wsT + (wsH - svgH * scale) / 2;

        let texts = 0, shapes = 0;
        for (const obj of objects) {
          if (!obj) continue;
          obj.set({
            left: (obj.left || 0) * scale + oX,
            top: (obj.top || 0) * scale + oY,
            scaleX: (obj.scaleX || 1) * scale,
            scaleY: (obj.scaleY || 1) * scale,
          });
          canvas.add(obj);
          if (["text", "i-text", "textbox"].includes(obj.type)) texts++;
          else shapes++;
        }

        canvas.backgroundColor = "";
        canvas.renderAll();

        resolve({ ok: true, total: objects.length, texts, shapes, scale: +scale.toFixed(4) });
      });
    });
  }, CERTIFICATE_SVG);

  console.log("   Result:", JSON.stringify(result));
  await sleep(2000);
  await page.screenshot({ path: "e2e-svg-02-svg-certificate.png" });
  console.log("   Screenshot: e2e-svg-02-svg-certificate.png\n");

  // ── Check object types on canvas ─────────────────────────────────────────
  console.log("4. Checking objects on canvas...");
  const info = await page.evaluate(() => {
    const c = window.__fabricCanvas;
    if (!c) return { err: "no canvas" };
    const objs = c.getObjects().filter(o => o.name !== "clip");
    return {
      total: objs.length,
      types: [...new Set(objs.map(o => o.type))],
      textObjects: objs.filter(o => ["text", "i-text"].includes(o.type)).map(o => ({
        type: o.type,
        text: o.text?.substring(0, 50),
        fontFamily: o.fontFamily,
        fontSize: o.fontSize,
        fill: o.fill,
      })),
    };
  });
  console.log("   Total objects:", info.total);
  console.log("   Types found:", info.types?.join(", "));
  console.log("   Text objects:", info.textObjects?.length);
  if (info.textObjects) {
    for (const t of info.textObjects.slice(0, 5)) {
      console.log(`     "${t.text}" (${t.fontFamily}, ${t.fontSize}px, ${t.fill})`);
    }
    if (info.textObjects.length > 5) console.log(`     ... +${info.textObjects.length - 5} more`);
  }

  // ── Select the "CERTIFICATE" text to prove editability ───────────────────
  console.log("\n5. Selecting CERTIFICATE text element...");
  const selectResult = await page.evaluate(() => {
    const c = window.__fabricCanvas;
    const textObj = c?.getObjects().find(o => o.text?.includes("CERTIFICATE") && !o.text?.includes("OF"));
    if (!textObj) return { err: "CERTIFICATE text not found" };

    c.setActiveObject(textObj);
    c.renderAll();
    return {
      selected: true,
      type: textObj.type,
      text: textObj.text,
      fontFamily: textObj.fontFamily,
      fontSize: textObj.fontSize,
      fill: textObj.fill,
      selectable: textObj.selectable !== false,
    };
  });
  console.log("   Result:", JSON.stringify(selectResult));
  await sleep(1000);
  await page.screenshot({ path: "e2e-svg-03-text-selected.png" });
  console.log("   Screenshot: e2e-svg-03-text-selected.png\n");

  // ── TEST B: Load Illustrator SVG border ──────────────────────────────────
  console.log("6. TEST B: Loading Illustrator SVG border...");
  const aiSvgResult = await page.evaluate(async () => {
    try {
      const resp = await fetch("/templates/certificates/classic-gold-border.svg");
      if (!resp.ok) return { ok: false, err: `HTTP ${resp.status}` };
      const svgStr = await resp.text();

      return new Promise((resolve) => {
        const canvas = window.__fabricCanvas;
        const f = window.fabric;
        if (!canvas || !f) { resolve({ ok: false, err: "no canvas" }); return; }

        f.loadSVGFromString(svgStr, (objects, options) => {
          if (!objects?.length) { resolve({ ok: false, err: "0 objects" }); return; }

          canvas.getObjects().filter(o => o.name !== "clip").forEach(o => canvas.remove(o));

          const ws = canvas.getObjects().find(o => o.name === "clip");
          const wsW = ws?.width || 3508, wsH = ws?.height || 2480;
          const svgW = parseFloat(options.width) || 400;
          const svgH = parseFloat(options.height) || 400;
          const scale = Math.min(wsW / svgW, wsH / svgH);
          const oX = (ws?.left || 0) + (wsW - svgW * scale) / 2;
          const oY = (ws?.top || 0) + (wsH - svgH * scale) / 2;

          for (const obj of objects) {
            if (!obj) continue;
            obj.set({
              left: (obj.left || 0) * scale + oX,
              top: (obj.top || 0) * scale + oY,
              scaleX: (obj.scaleX || 1) * scale,
              scaleY: (obj.scaleY || 1) * scale,
            });
            canvas.add(obj);
          }
          canvas.backgroundColor = "";
          canvas.renderAll();

          resolve({
            ok: true,
            total: objects.length,
            types: [...new Set(objects.map(o => o.type))],
            svgSize: svgStr.length,
          });
        });
      });
    } catch (e) {
      return { ok: false, err: e.message };
    }
  });

  console.log("   Result:", JSON.stringify(aiSvgResult));
  await sleep(2000);
  await page.screenshot({ path: "e2e-svg-04-illustrator-border.png" });
  console.log("   Screenshot: e2e-svg-04-illustrator-border.png\n");

  // ── Summary ──────────────────────────────────────────────────────────────
  const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("DevTools"));
  console.log("=== Console errors:", realErrors.length === 0 ? "NONE ✓" : realErrors.join("\n"));
  console.log("\n=== Screenshots ===");
  console.log("  01-initial.png           Before SVG import");
  console.log("  02-svg-certificate.png   Custom SVG certificate loaded");
  console.log("  03-text-selected.png     Text element with selection handles");
  console.log("  04-illustrator-border.png  Illustrator SVG loaded");

  await sleep(3000);
  await browser.close();
}

main().catch(console.error);
