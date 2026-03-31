/**
 * Comprehensive e2e test — verify ALL major tool pages load after cache fix
 */
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:6006";

const TOOLS_TO_TEST = [
  { url: "/tools/documents/certificate", name: "Certificate Designer" },
  { url: "/tools/design/business-card", name: "Business Card" },
  { url: "/tools/design/poster", name: "Poster / Flyer" },
  { url: "/tools/documents/diploma-designer", name: "Diploma Designer" },
  { url: "/tools/documents/invoice-designer", name: "Invoice Designer" },
  { url: "/tools/documents/resume-cv", name: "Resume / CV" },
  { url: "/tools/design/brochure", name: "Brochure" },
  { url: "/tools/documents/cover-letter", name: "Cover Letter" },
  { url: "/tools/design/id-badge", name: "ID Badge" },
  { url: "/tools/design/menu-designer", name: "Menu Designer" },
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();

  // Suppress non-critical console noise
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));

  try {
    // Step 1: Log in
    console.log("=== Logging in... ===");
    await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle0", timeout: 60000 });
    await page.type("#email", "testbot@dmsuite-test.com");
    await page.type("#password", "TestBot2026!Secure");
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 });
    console.log("Logged in: " + page.url());

    // Dismiss tour
    await page.evaluate(() => {
      localStorage.setItem("dmsuite-chiko-tour-complete", "true");
    });

    // Step 2: Test each tool
    const results = [];
    for (const tool of TOOLS_TO_TEST) {
      console.log(`\nTesting: ${tool.name} (${tool.url})`);
      errors.length = 0;
      
      try {
        const response = await page.goto(`${BASE}${tool.url}`, { waitUntil: "networkidle0", timeout: 90000 });
        
        // Wait for client hydration
        await new Promise(r => setTimeout(r, 2000));

        const status = response.status();
        const diagnostics = await page.evaluate(() => ({
          hasCanvas: document.querySelectorAll("canvas").length,
          has404: document.body.innerText.includes("404") && document.body.innerText.includes("Page not found"),
          hasError: document.body.innerText.includes("hit a snag"),
          hasToolNotFound: document.body.innerText.includes("Tool Not Found"),
          hasSidebar: !!document.querySelector("aside") || !!document.querySelector("nav") || document.body.innerHTML.includes("Sidebar"),
          firstH1: document.querySelector("h1")?.textContent || "none",
          bodySnippet: document.body.innerText.substring(0, 300).replace(/\n/g, " "),
        }));

        const passed = status === 200 && !diagnostics.has404 && !diagnostics.hasError && !diagnostics.hasToolNotFound;
        results.push({
          name: tool.name,
          status,
          passed,
          canvas: diagnostics.hasCanvas,
          sidebar: diagnostics.hasSidebar,
          errors: errors.length,
        });

        const icon = passed ? "✅" : "❌";
        console.log(`  ${icon} HTTP=${status} Canvas=${diagnostics.hasCanvas} Sidebar=${diagnostics.hasSidebar} PageErrors=${errors.length}`);
        if (!passed) {
          console.log(`     Body: ${diagnostics.bodySnippet.substring(0, 200)}`);
        }

        // Take screenshot
        const filename = tool.url.split("/").pop();
        await page.screenshot({ path: `e2e-screenshots/full-${filename}.png` });

      } catch (err) {
        results.push({ name: tool.name, status: "TIMEOUT/ERROR", passed: false, canvas: 0, sidebar: false, errors: 1 });
        console.log(`  ❌ Error: ${err.message.substring(0, 100)}`);
      }
    }

    // Summary
    console.log("\n\n========== SUMMARY ==========");
    const passed = results.filter(r => r.passed).length;
    console.log(`${passed}/${results.length} tools passed`);
    console.log("─────────────────────────────");
    for (const r of results) {
      const icon = r.passed ? "✅" : "❌";
      console.log(`${icon} ${r.name.padEnd(25)} HTTP=${String(r.status).padEnd(4)} Canvas=${r.canvas} Errors=${r.errors}`);
    }

  } catch (err) {
    console.error("Fatal error:", err.message);
  } finally {
    await browser.close();
  }
}

main();
