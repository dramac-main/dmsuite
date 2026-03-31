// Quick validation: Can we build the template JSON and parse it?
// This must be run after tsx compilation, so let's manually build what the template produces.

const W = 3508;
const H = 2480;
const MARGIN = 200;

function txt(name, text, opts) {
  return {
    type: "textbox", version: "5.3.0", originX: "left", originY: "top",
    name, text, styles: [], selectable: true, hasControls: true, editable: true,
    ...opts,
  };
}

function rect(name, opts) {
  return {
    type: "rect", version: "5.3.0", originX: "left", originY: "top",
    name, selectable: true, hasControls: true, ...opts,
  };
}

function circle(name, opts) {
  return {
    type: "circle", version: "5.3.0", originX: "left", originY: "top",
    name, selectable: true, hasControls: true, ...opts,
  };
}

function line(name, x1, y1, x2, y2, opts) {
  return {
    type: "line", version: "5.3.0", originX: "left", originY: "top",
    name, x1, y1, x2, y2, width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) || 0,
    selectable: true, hasControls: true, ...opts,
  };
}

function buildJson(bg, objects) {
  return JSON.stringify({ version: "5.3.0", objects, background: bg });
}

// Build the Classic Gold template
const cx = W / 2;
const objects = [
  rect("border-outer", { left: 60, top: 60, width: W - 120, height: H - 120, fill: "transparent", stroke: "#d4af37", strokeWidth: 8 }),
  rect("border-inner", { left: 90, top: 90, width: W - 180, height: H - 180, fill: "transparent", stroke: "#b8860b", strokeWidth: 3 }),
  txt("cert-org", "Organization Name", { left: MARGIN, top: 350, width: W - MARGIN * 2, fontSize: 48, fontFamily: "Lato", fontWeight: 600, fill: "#b8860b", textAlign: "center", charSpacing: 150 }),
  txt("cert-title", "CERTIFICATE OF ACHIEVEMENT", { left: MARGIN, top: 500, width: W - MARGIN * 2, fontSize: 140, fontFamily: "Playfair Display", fontWeight: 700, fill: "#b8860b", textAlign: "center" }),
  line("cert-divider", cx - 400, 720, cx + 400, 720, { stroke: "#d4af37", strokeWidth: 3, left: cx - 400, top: 720 }),
  txt("cert-recipient", "Recipient Name", { left: MARGIN, top: 880, width: W - MARGIN * 2, fontSize: 120, fontFamily: "Great Vibes", fontWeight: 400, fill: "#b8860b", textAlign: "center" }),
  line("cert-sig-line-0", cx - 1325, 1800, cx - 675, 1800, { stroke: "#d4af37", strokeWidth: 3, left: cx - 1325, top: 1800 }),
  txt("cert-signatory-0-name", "Signatory Name", { left: cx - 1325, top: 1815, width: 650, fontSize: 48, fontFamily: "Lato", fontWeight: 600, fill: "#2c1810", textAlign: "center" }),
  circle("cert-seal-outer", { left: cx + 700 - 140, top: H - 500 - 140, radius: 140, fill: "#d4a843", stroke: "", strokeWidth: 0 }),
  circle("cert-seal-inner", { left: cx + 700 - 115, top: H - 500 - 115, radius: 115, fill: "#b8860b", stroke: "#d4a843", strokeWidth: 4 }),
  txt("cert-seal-text", "CERTIFIED", { left: cx + 700 - 110, top: H - 500 - 30, width: 220, fontSize: 36, fontFamily: "Inter", fontWeight: 700, fill: "#ffffff", textAlign: "center", charSpacing: 200 }),
];

const json = buildJson("#faf6e8", objects);

// Validate
try {
  const parsed = JSON.parse(json);
  console.log("✅ JSON is valid");
  console.log(`   Version: ${parsed.version}`);
  console.log(`   Background: ${parsed.background}`);
  console.log(`   Objects: ${parsed.objects.length}`);
  
  // Check object types
  const types = {};
  for (const obj of parsed.objects) {
    types[obj.type] = (types[obj.type] || 0) + 1;
  }
  console.log("   Types:", JSON.stringify(types));
  
  // Check for any undefined values
  for (const obj of parsed.objects) {
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) {
        console.log(`   ⚠ ${obj.name}.${k} is undefined`);
      }
    }
  }
  
  console.log(`   JSON length: ${json.length} chars`);
  console.log("\nFirst object:", JSON.stringify(parsed.objects[0], null, 2).substring(0, 300));
} catch (e) {
  console.error("❌ JSON parse failed:", e.message);
}
