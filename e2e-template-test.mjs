/**
 * Test template selection in the Certificate Designer.
 * Uses known selectors: button[title="Templates"], .w-72 panel, template buttons.
 */
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:6006";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "warning") consoleErrors.push(`[${msg.type()}] ${msg.text()}`); });
  page.on("pageerror", (err) => consoleErrors.push(`[pageerror] ${err.message}\n${err.stack}`));

  try {
    // 1. Login
    console.log("=== Step 1: Login ===");
    await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.type("#email", "testbot@dmsuite-test.com");
    await page.type("#password", "TestBot2026!Secure");
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 });
    await page.evaluate(() => localStorage.setItem("dmsuite-chiko-tour-complete", "true"));
    console.log("Logged in.");

    // 2. Open Certificate Designer — wait for canvas to fully render
    console.log("\n=== Step 2: Open Certificate Designer ===");
    await page.goto(`${BASE}/tools/documents/certificate`, { waitUntil: "networkidle0", timeout: 120000 });
    // Wait for canvas element to appear
    await page.waitForSelector("canvas", { timeout: 30000 });
    // Extra wait for Fabric.js init
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: "e2e-screenshots/cert-01-blank.png" });
    console.log("Screenshot: cert-01-blank.png");

    // 3. Click the Templates button (title="Templates" on an h-11 w-11 button)
    console.log("\n=== Step 3: Click Templates sidebar button ===");
    const templateBtn = await page.$('button[title="Templates"]');
    if (!templateBtn) {
      // Fallback: list all titled buttons for debugging
      const allTitles = await page.evaluate(() =>
        Array.from(document.querySelectorAll("button[title]")).map(b => ({
          title: b.title,
          x: Math.round(b.getBoundingClientRect().x),
          y: Math.round(b.getBoundingClientRect().y),
        }))
      );
      console.log("No button[title='Templates'] found. All titled buttons:", JSON.stringify(allTitles, null, 2));
      throw new Error("Templates button not found");
    }
    await templateBtn.click();
    console.log("Clicked Templates button.");

    // 4. Wait for the flyout panel (w-72, bg-gray-900)
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: "e2e-screenshots/cert-02-templates-panel.png" });
    console.log("Screenshot: cert-02-templates-panel.png");

    // 5. Inspect the template list
    console.log("\n=== Step 5: Inspect template list ===");
    const templateInfo = await page.evaluate(() => {
      // The flyout panel is .w-72 and contains template buttons
      const panel = document.querySelector(".w-72");
      if (!panel) return { panelFound: false };
      
      const buttons = Array.from(panel.querySelectorAll("button"));
      // Skip the close (X) button — template buttons are bigger
      const tplButtons = buttons.filter(b => {
        const rect = b.getBoundingClientRect();
        return rect.width > 80 && rect.height > 50;
      });

      return {
        panelFound: true,
        panelText: panel.textContent?.substring(0, 200),
        totalButtons: buttons.length,
        templateButtons: tplButtons.map(b => ({
          text: b.textContent?.trim().substring(0, 60),
          hasImg: !!b.querySelector("img"),
          imgSrc: b.querySelector("img")?.src?.substring(0, 120) || "",
          w: Math.round(b.getBoundingClientRect().width),
          h: Math.round(b.getBoundingClientRect().height),
        })),
      };
    });
    console.log("Template panel info:", JSON.stringify(templateInfo, null, 2));

    // 6. Click the first template
    console.log("\n=== Step 6: Click first template ===");
    const firstTplClicked = await page.evaluate(() => {
      const panel = document.querySelector(".w-72");
      if (!panel) return { error: "no panel" };
      const buttons = Array.from(panel.querySelectorAll("button"));
      const tplButtons = buttons.filter(b => {
        const rect = b.getBoundingClientRect();
        return rect.width > 80 && rect.height > 50;
      });
      if (tplButtons.length === 0) return { error: "no template buttons", totalBtns: buttons.length };
      const btn = tplButtons[0];
      const info = {
        text: btn.textContent?.trim().substring(0, 60),
        hasImg: !!btn.querySelector("img"),
      };
      btn.click();
      return info;
    });
    console.log("Clicked first template:", JSON.stringify(firstTplClicked));

    // Wait for template to load on canvas (JSON parse + render + fonts)
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: "e2e-screenshots/cert-03-template-loaded.png" });
    console.log("Screenshot: cert-03-template-loaded.png (full page)");

    // 7. Canvas-only screenshot
    const canvasEl = await page.$("canvas");
    if (canvasEl) {
      await canvasEl.screenshot({ path: "e2e-screenshots/cert-04-canvas-only.png" });
      console.log("Screenshot: cert-04-canvas-only.png");
    }

    // 8. Check canvas object count (are Fabric objects present?)
    const canvasState = await page.evaluate(() => {
      // Access Fabric canvas instance through the DOM
      const canvases = document.querySelectorAll("canvas");
      return {
        canvasCount: canvases.length,
        dims: Array.from(canvases).map(c => `${c.width}x${c.height}`),
      };
    });
    console.log("Canvas state:", JSON.stringify(canvasState));

    // 9. Click second template for comparison
    console.log("\n=== Step 9: Click second template ===");
    const secondTplClicked = await page.evaluate(() => {
      const panel = document.querySelector(".w-72");
      if (!panel) return { error: "no panel" };
      const buttons = Array.from(panel.querySelectorAll("button"));
      const tplButtons = buttons.filter(b => {
        const rect = b.getBoundingClientRect();
        return rect.width > 80 && rect.height > 50;
      });
      if (tplButtons.length < 2) return { error: "less than 2 templates", count: tplButtons.length };
      tplButtons[1].click();
      return { text: tplButtons[1].textContent?.trim().substring(0, 60), count: tplButtons.length };
    });
    console.log("Clicked second template:", JSON.stringify(secondTplClicked));
    
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: "e2e-screenshots/cert-05-template2-loaded.png" });
    console.log("Screenshot: cert-05-template2-loaded.png");

    // Click third template (different style)
    const thirdTplClicked = await page.evaluate(() => {
      const panel = document.querySelector(".w-72");
      if (!panel) return { error: "no panel" };
      const buttons = Array.from(panel.querySelectorAll("button"));
      const tplButtons = buttons.filter(b => {
        const rect = b.getBoundingClientRect();
        return rect.width > 80 && rect.height > 50;
      });
      if (tplButtons.length < 3) return { error: "less than 3 templates" };
      tplButtons[2].click();
      return { text: tplButtons[2].textContent?.trim().substring(0, 60) };
    });
    console.log("Clicked third template:", JSON.stringify(thirdTplClicked));
    
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: "e2e-screenshots/cert-06-template3-loaded.png" });
    console.log("Screenshot: cert-06-template3-loaded.png");

    // Print console errors
    if (consoleErrors.length > 0) {
      console.log("\n=== Console Errors/Warnings ===");
      for (const e of consoleErrors.slice(0, 30)) {
        console.log(e);
      }
    } else {
      console.log("\n=== No console errors ===");
    }

  } catch (err) {
    console.error("Error:", err.message);
    await page.screenshot({ path: "e2e-screenshots/cert-ERROR.png" }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();
