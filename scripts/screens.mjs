// Takes a screenshot of every key demo-world screen into docs/screens/, on a phone and (for some) a desktop.
// Usage: npm run build && npm run screens        (set SCREENS_URL to use a server that is already running)
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const PORT = 3299;
const URL_BASE = process.env.SCREENS_URL ?? `http://127.0.0.1:${PORT}`;
const OUT = "docs/screens";

/** [file name, who to sign in as (a persona id from /start, or null), path, element that shows the screen is ready, also on desktop] */
const SHOTS = [
  ["start-chooser", null, "/start", "main", true],
  ["student-home-diya", "diya", "/dashboard", '[data-testid="student-home"]', true],
  ["student-home-blocked-ishita", "ishita", "/dashboard", '[data-testid="blocked-note"]', false],
  ["student-pay", "aarav", "/dashboard/pay", '[data-testid="pay-world"]', true],
  ["student-loans", "diya", "/dashboard/loans", '[data-testid="loans-world"]', false],
  ["student-aura", "diya", "/dashboard/aura", '[data-testid="aura-world"]', true],
  ["student-limit-ladder", "rohan", "/dashboard/limit", '[data-testid="limit-world"]', false],
  ["student-recovery", "ishita", "/dashboard/recovery", '[data-testid="recovery-world"]', false],
  ["vendor-home", "v-gupta", "/vendor", '[data-testid="received-today"]', true],
  ["vendor-payments", "v-gupta", "/vendor/payments", '[data-testid="payments-total"]', false],
  ["vendor-settlements", "v-gupta", "/vendor/settlements", '[data-testid="settle-awaiting"]', false],
  ["vendor-qr", "v-gupta", "/vendor/qr", '[data-testid="stall-qr"] svg', false],
  ["vendor-refunds", "v-gupta", "/vendor/disputes", '[data-testid="refund-cap"]', false],
  ["vendor-onboarding", null, "/vendor/onboarding", "main", false],
  ["demo-stage", null, "/demo", '[data-testid="student-frame"]', true],
  ["demo-money-flow", null, "/demo/flow", '[data-testid="money-flow"]', true],
  ["demo-metrics", null, "/demo/metrics", '[data-testid="sim-banner"]', true],
  ["ops-vendors", null, "/ops/vendors", "h1", true],
  ["ops-settlements", null, "/ops/settlements", "h1", false],
  ["ops-flags", null, "/ops/flags", "h1", false],
  ["ops-exposure", null, "/ops/exposure", "h1", false],
  ["ops-audit", null, "/ops/audit", "h1", false],
  ["ops-limits", null, "/ops/limits", "h1", false],
];

const SIZES = { phone: { width: 360, height: 740 }, desktop: { width: 1280, height: 800 } };

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(URL_BASE)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("server did not start");
}

const server = process.env.SCREENS_URL ? null : spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "ignore", env: { ...process.env, NEXT_PUBLIC_DEMO_CONTROLS: "true" } });
try {
  await waitForServer();
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const [name, persona, path, ready, desktop] of SHOTS) {
    for (const [kind, size] of Object.entries(SIZES)) {
      if (kind === "desktop" && !desktop) continue;
      const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 1, colorScheme: "dark" });
      const page = await ctx.newPage();
      if (persona) {
        await page.goto(`${URL_BASE}/start`);
        await page.getByTestId(`persona-${persona}`).click();
        await page.waitForURL(/\/(dashboard|vendor)/);
      }
      await page.goto(`${URL_BASE}${path}`);
      await page.locator(ready).first().waitFor({ timeout: 20000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/${name}.${kind}.png`, fullPage: false });
      console.log("saved", `${name}.${kind}.png`);
      await ctx.close();
    }
  }
  await browser.close();
} finally {
  server?.kill();
}
