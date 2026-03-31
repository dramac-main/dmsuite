/**
 * E2E Test: Click a JSON template in certificate designer and check if it loads.
 */
import puppeteer from "puppeteer";

const BASE = "http://localhost:6006";

async function run() {
  const browser = await puppeteer.launch({ headless: false, args: ["--window-size=1400,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const logs = [];
  const errors = [];
  page.on("console", (msg) => {
    const txt = `[${msg.type()}] ${msg.text()}`;
    logs.push(txt);
    if (msg.type() === "error" || msg.type() === "warning") errors.push(txt);
  });
  page.on("pageerror", (err) => errors.push(`[PAGE ERROR] ${err.message}`));

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("dmsuite-chiko-tour-complete", "true");
  });

  console.log("1. Navigating to certificate designer...");
  await page.goto(`${BASE}/tools/documents/certificate`, { waitUntil: "networkidle2", timeout: 60000 });
  
  await page.waitForSelector("canvas", { timeout: 15000 });
  console.log("2. Canvas found. Waiting 3s...");
  await new Promise(r => setTimeout(r, 3000));

  const hasEditor = await page.evaluate(() => !!window.__fabricCanvas);
  console.log(`3. __fabricCanvas exists: ${hasEditor}`);

  if (hasEditor) {
    const objCount = await page.evaluate(() => window.__fabricCanvas?.getObjects()?.length ?? 0);
    console.log(`4. Canvas objects: ${objCount}`);
    const objNames = await page.evaluate(() => window.__fabricCanvas?.getObjects()?.map(o => o.name) ?? []);
    console.log(`   Names: ${JSON.stringify(objNames)}`);
  }

  // Find template thumbnails
  const templateImgs = await page.$$("button img");
  console.log(`5. Found ${templateImgs.length} template image buttons`);
  
  if (templateImgs.length > 0) {
    // Print alt texts
    for (let i = 0; i < templateImgs.length; i++) {
      const alt = await templateImgs[i].evaluate(el => el.alt);
      console.log(`   [${i}] alt="${alt}"`);
    }
    
    console.log("\n6. Clicking first template...");
    const firstBtn = await templateImgs[0].evaluateHandle(el => el.closest("button"));
    await firstBtn.asElement().click();
    
    await new Promise(r => setTimeout(r, 3000));
    
    const afterCount = await page.evaluate(() => window.__fabricCanvas?.getObjects()?.length ?? 0);
    const afterNames = await page.evaluate(() => window.__fabricCanvas?.getObjects()?.map(o => o.name) ?? []);
    console.log(`7. After click - objects: ${afterCount}`);
    console.log(`   Names: ${JSON.stringify(afterNames)}`);
    
    if (afterCount <= 1) {
      console.log("   ❌ TEMPLATE DID NOT LOAD");
    } else {
      console.log(`   ✅ Template loaded with ${afterCount} objects`);
    }
    
    await page.screenshot({ path: "e2e-after-click.png" });
  }
  
  if (errors.length > 0) {
    console.log("\n=== ERRORS ===");
    for (const e of errors) console.log(e);
  }
  
  console.log("\n=== FABRIC LOGS ===");
  for (const l of logs) {
    if (l.toLowerCase().includes("fabric") || l.toLowerCase().includes("template") || l.toLowerCase().includes("load") || l.toLowerCase().includes("svg") || l.toLowerCase().includes("json") || l.toLowerCase().includes("clip")) {
      console.log(l);
    }
  }

  await browser.close();
}

run().catch(console.error);
