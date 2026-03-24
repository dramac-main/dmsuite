// Check GoTrue admin config endpoint
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iY2VobW9mYWhybnNjZnBuZGt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE4ODQ5NywiZXhwIjoyMDg5NzY0NDk3fQ.ulgkfHHNdrzPyedcbb1vPgyMZCzx4CZMFrP00p5mnO0";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iY2VobW9mYWhybnNjZnBuZGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODg0OTcsImV4cCI6MjA4OTc2NDQ5N30.CRW7hJeWO6ZXoU8O433jtDa5ZTh5QjIlx1-pkbMV-xM";

async function check() {
  // Try admin/config
  console.log("=== Trying /auth/v1/admin/config ===");
  try {
    const r1 = await fetch("https://mbcehmofahrnscfpndkz.supabase.co/auth/v1/admin/config", {
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: anonKey }
    });
    console.log("Status:", r1.status);
    if (r1.ok) {
      const json = await r1.json();
      console.log("site_url:", json.site_url || json.SITE_URL || "not found in response");
      console.log("Keys:", Object.keys(json).join(", "));
    } else {
      console.log("Body:", await r1.text());
    }
  } catch (e) {
    console.log("Error:", e.message);
  }

  // Try regular /settings
  console.log("\n=== Trying /auth/v1/settings ===");
  try {
    const r2 = await fetch("https://mbcehmofahrnscfpndkz.supabase.co/auth/v1/settings", {
      headers: { apikey: anonKey }
    });
    console.log("Status:", r2.status);
    if (r2.ok) {
      const json = await r2.json();
      console.log("Keys:", Object.keys(json).join(", "));
    }
  } catch (e) {
    console.log("Error:", e.message);
  }

  // Try the Management API with the service role key (will likely fail, but let's check)
  console.log("\n=== Trying Management API ===");
  try {
    const r3 = await fetch("https://api.supabase.com/v1/projects/mbcehmofahrnscfpndkz/config/auth", {
      headers: { Authorization: `Bearer ${serviceKey}` }
    });
    console.log("Status:", r3.status);
    if (r3.ok) {
      const json = await r3.json();
      console.log("SITE_URL:", json.SITE_URL);
    } else {
      console.log("Body:", (await r3.text()).substring(0, 200));
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

check();
