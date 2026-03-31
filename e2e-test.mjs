/**
 * DMSuite E2E Visual Test — Login + Open Design Tools + Screenshot
 * Uses puppeteer-core with system Chrome.
 */
import puppeteer from "puppeteer-core";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, "e2e-screenshots");
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const BASE = "http://localhost:6006";
const TEST_EMAIL = "testbot@dmsuite-test.com";
const TEST_PASSWORD = "TestBot2026!Secure";

// Tools to test (covering different workspace types)
const TOOLS_TO_TEST = [
  { path: "/tools/documents/certificate", name: "certificate" },
  { path: "/tools/design/business-card", name: "business-card" },
  { path: "/tools/design/poster", name: "poster" },
  { path: "/tools/documents/diploma-designer", name: "diploma" },
  { path: "/tools/documents/invoice-designer", name: "invoice" },
  { path: "/tools/documents/resume-cv", name: "resume" },
];

async function run() {
  console.log("🚀 Starting E2E test...");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1440,900",
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // Collect console errors
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(`[PAGE ERROR] ${err.message}`);
  });

  try {
    // ── Step 1: Login ──
    console.log("\n📋 Step 1: Navigate to login page...");
    await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "01-login-page.png"), fullPage: false });
    console.log("  Screenshot: 01-login-page.png");

    // Fill login form
    console.log("  Filling email and password...");
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');

    if (!emailInput || !passwordInput) {
      // Try by placeholder or label
      const allInputs = await page.$$("input");
      console.log(`  Found ${allInputs.length} input elements`);
      for (const input of allInputs) {
        const type = await input.evaluate((el) => el.type);
        const name = await input.evaluate((el) => el.name);
        const placeholder = await input.evaluate((el) => el.placeholder);
        console.log(`    Input: type=${type}, name=${name}, placeholder=${placeholder}`);
      }
    }

    if (emailInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(TEST_EMAIL, { delay: 30 });
    }
    if (passwordInput) {
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(TEST_PASSWORD, { delay: 30 });
    }

    await page.screenshot({ path: join(SCREENSHOTS_DIR, "02-login-filled.png"), fullPage: false });
    console.log("  Screenshot: 02-login-filled.png");

    // Click login button
    console.log("  Clicking login button...");
    const loginBtn = await page.$('button[type="submit"]');
    if (loginBtn) {
      await loginBtn.click();
    } else {
      // Try to find button by text
      const buttons = await page.$$("button");
      for (const btn of buttons) {
        const text = await btn.evaluate((el) => el.textContent?.trim());
        if (text?.toLowerCase().includes("sign in") || text?.toLowerCase().includes("log in") || text?.toLowerCase().includes("login")) {
          await btn.click();
          break;
        }
      }
    }

    // Wait for navigation after login
    console.log("  Waiting for redirect after login...");
    try {
      await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 });
    } catch {
      console.log("  (Navigation wait timed out — checking current URL)");
    }
    const postLoginUrl = page.url();
    console.log(`  Current URL after login: ${postLoginUrl}`);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "03-after-login.png"), fullPage: false });
    console.log("  Screenshot: 03-after-login.png");

    if (postLoginUrl.includes("/auth/login")) {
      console.log("  ⚠️  Still on login page — login may have failed");
      // Check for error messages
      const errorMsg = await page.$eval(
        '[role="alert"], .text-red-500, .text-error, .error-message',
        (el) => el.textContent?.trim()
      ).catch(() => "No error message found");
      console.log(`  Error message: ${errorMsg}`);
    }

    // ── Step 2: Dashboard ──
    console.log("\n📋 Step 2: Check dashboard...");
    if (!postLoginUrl.includes("/dashboard")) {
      await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0", timeout: 30000 });
    }
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "04-dashboard.png"), fullPage: false });
    console.log("  Screenshot: 04-dashboard.png");

    // ── Dismiss Chiko tour BEFORE navigating to tools ──
    console.log("\n📋 Pre-setting tour completion flags...");
    await page.evaluate(() => {
      localStorage.setItem("dmsuite-chiko-tour-complete", "true");
    });
    console.log("  Set dmsuite-chiko-tour-complete = true");

    // ── Step 3: Test each tool ──
    for (let i = 0; i < TOOLS_TO_TEST.length; i++) {
      const tool = TOOLS_TO_TEST[i];
      const num = String(i + 5).padStart(2, "0");
      console.log(`\n📋 Step ${i + 3}: Opening ${tool.name}...`);

      await page.goto(`${BASE}${tool.path}`, { waitUntil: "networkidle0", timeout: 30000 });

      // Wait for client-side rendering / project loading
      await new Promise((r) => setTimeout(r, 8000));

      // Check if there's still a loading spinner and wait more if needed
      const stillLoading = await page.evaluate(() => {
        const spinner = document.querySelector(".animate-spin");
        const loadingText = document.body.innerText;
        return {
          hasSpinner: !!spinner,
          hasLoadingText: loadingText.includes("Loading project") || loadingText.includes("Syncing projects") || loadingText.includes("Preparing workspace"),
          bodyTextExcerpt: loadingText.substring(0, 300),
        };
      });
      if (stillLoading.hasSpinner || stillLoading.hasLoadingText) {
        console.log("  ⚠️  Still loading — waiting 10 more seconds...");
        console.log(`  Loading text: ${stillLoading.bodyTextExcerpt.replace(/\n/g, " | ").substring(0, 200)}`);
        await new Promise((r) => setTimeout(r, 10000));
      }

      const toolUrl = page.url();
      console.log(`  URL: ${toolUrl}`);

      // Check for loading spinner
      const hasSpinner = await page.$(".animate-spin").then((el) => !!el).catch(() => false);
      if (hasSpinner) {
        console.log("  ⚠️  Loading spinner still visible — waiting more...");
        await new Promise((r) => setTimeout(r, 8000));
      }

      // Check if canvas exists
      const canvasCount = await page.$$eval("canvas", (els) => els.length).catch(() => 0);
      console.log(`  Canvas elements: ${canvasCount}`);

      // Check canvas dimensions
      if (canvasCount > 0) {
        const canvasInfo = await page.$$eval("canvas", (els) =>
          els.map((c) => ({
            width: c.width,
            height: c.height,
            style: c.style.cssText,
            parentHeight: c.parentElement?.offsetHeight || 0,
            parentWidth: c.parentElement?.offsetWidth || 0,
          }))
        );
        console.log(`  Canvas info:`, JSON.stringify(canvasInfo, null, 2));

        // Check Fabric.js state — does the canvas have objects?
        const fabricState = await page.evaluate(() => {
          // @ts-ignore - access fabric canvas instance from the DOM
          const canvasEls = document.querySelectorAll("canvas.upper-canvas, canvas.lower-canvas");
          const upperCanvas = document.querySelector("canvas.upper-canvas");
          if (upperCanvas) {
            // Fabric.js creates upper-canvas for interaction layer
            return { hasFabric: true, canvasClasses: [...canvasEls].map(c => c.className) };
          }
          // Check if any canvas sibling has the fabric wrapper
          const wrapper = document.querySelector(".canvas-container");
          return {
            hasFabric: !!wrapper,
            wrapperFound: !!wrapper,
            wrapperSize: wrapper ? { w: wrapper.offsetWidth, h: wrapper.offsetHeight } : null,
          };
        });
        console.log(`  Fabric state:`, JSON.stringify(fabricState));
      }

      // Check for loading text
      const pageText = await page.evaluate(() => {
        const main = document.querySelector("main") || document.body;
        return main.innerText?.substring(0, 500);
      });
      if (pageText?.includes("Loading project") || pageText?.includes("Syncing projects") || pageText?.includes("Preparing workspace")) {
        console.log(`  ⚠️  Still showing loading state: "${pageText.match(/(Loading|Syncing|Preparing)[^.]+/)?.[0]}"`);
      }

      // Check for error boundary or error messages
      const hasError = await page.$eval(
        '[data-error], .error-boundary, [role="alert"]',
        (el) => el.textContent?.trim()
      ).catch(() => null);
      if (hasError) {
        console.log(`  ❌ Error on page: ${hasError}`);
      }

      // Check for "Coming Soon" text
      const hasComingSoon = await page.evaluate(
        () => document.body.innerText.includes("Coming Soon")
      );
      if (hasComingSoon) {
        console.log(`  ⚠️  "Coming Soon" placeholder detected`);
      }

      // Check for "Tool Not Found"
      const hasNotFound = await page.evaluate(
        () => document.body.innerText.includes("Tool Not Found")
      );
      if (hasNotFound) {
        console.log(`  ❌ "Tool Not Found" detected`);
      }

      await page.screenshot({ path: join(SCREENSHOTS_DIR, `${num}-${tool.name}.png`), fullPage: false });
      console.log(`  Screenshot: ${num}-${tool.name}.png`);
    }

    // ── Summary ──
    console.log("\n═══════════════════════════════════════");
    console.log("📊 Test Summary");
    console.log("═══════════════════════════════════════");
    console.log(`Console errors: ${consoleErrors.length}`);
    for (const err of consoleErrors.slice(0, 20)) {
      console.log(`  ${err}`);
    }
    console.log(`Page errors: ${pageErrors.length}`);
    for (const err of pageErrors.slice(0, 20)) {
      console.log(`  ${err}`);
    }
    console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);

  } catch (err) {
    console.error("❌ Test failed:", err.message);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "error.png"), fullPage: false }).catch(() => {});
  } finally {
    await browser.close();
    console.log("\n✅ Browser closed. Test complete.");
  }
}

run().catch(console.error);
