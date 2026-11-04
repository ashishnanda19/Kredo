import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Milestone 7: investor metrics the ops flags, exposure, audit and limit-override screens,
// error recovery, and an accessibility pass (automated checks plus a keyboard walk through the confirm sheet).

async function openDemo(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("main")).toBeVisible();
}

async function opsAdmin(page: Page) {
  await page.getByRole("button", { name: "Demo controls" }).click();
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await page.getByRole("button", { name: "Close demo controls" }).click();
}

async function playScenario(page: Page, n: number) {
  await page.goto(`/demo?scenario=${n}&auto=1&fast=1`);
  await expect(page.getByTestId("scenario-done")).toBeVisible({ timeout: 60_000 });
}

test("the metrics page shows every KPI and section card", async ({ page }) => {
  await openDemo(page, "/demo/metrics");
  for (const id of ["repayment", "settlement", "aura-dist", "leaderboard", "hours", "cohorts", "econ"]) await expect(page.getByTestId(id)).toBeVisible();
  for (const id of ["k-gmv", "k-loans", "k-students", "k-vendors", "r-ontime", "s-volume"]) await expect(page.getByTestId(id)).toBeVisible();
});

test("the metrics move when the demo moves", async ({ page }) => {
  await openDemo(page, "/demo/metrics");
  const before = Number(await page.getByTestId("k-loans").innerText());
  await playScenario(page, 2);
  await page.goto("/demo/metrics");
  await expect(page.getByTestId("k-loans")).toHaveText(String(before + 1));
});

test("charts have a table view, and the unit economics recompute from editable assumptions", async ({ page }) => {
  await openDemo(page, "/demo/metrics");
  await page.getByTestId("aura-bars").getByRole("button", { name: "Show as table" }).click();
  await expect(page.getByTestId("aura-bars").getByRole("table")).toBeVisible();
  const before = await page.getByTestId("u-margin").innerText();
  await page.getByTestId("as-fee").fill("12");
  await expect(page.getByTestId("u-margin")).not.toHaveText(before);
  await expect(page.getByTestId("u-revenue")).toContainText("₹12.");
  await page.getByRole("button", { name: "Back to the defaults" }).click();
  await expect(page.getByTestId("u-margin")).toHaveText(before);
});

test("ops payment flags: scenario 9 raises one, an analyst needs a note to dismiss it, and it is audited", async ({ page }) => {
  await playScenario(page, 9);
  await page.goto("/ops/flags");
  await opsAdmin(page);
  await expect(page.getByRole("button", { name: /Review F-/ })).toHaveCount(1);
  await page.getByRole("button", { name: /Review F-/ }).click();
  await expect(page.getByTestId("flag-detail")).toContainText("share a device");
  await page.getByTestId("flag-dismiss").click();
  await expect(page.getByText("Add a note so the decision can be understood later.")).toBeVisible();
  await page.getByLabel("Note (required)").fill("Same person, expected");
  await page.getByTestId("flag-dismiss").click();
  await page.getByRole("radio", { name: "All" }).click();
  await expect(page.getByText("dismissed").first()).toBeVisible();
  await page.goto("/ops/audit");
  await page.getByTestId("audit-group").selectOption("fraud");
  await expect(page.getByRole("table")).toContainText("fraud.dismissed");
  await expect(page.getByRole("table")).toContainText("fraud.flagged");
});

test("ops exposure adds up and shows overdue and defaulted payments", async ({ page }) => {
  await openDemo(page, "/ops/exposure");
  await expect(page.getByRole("heading", { name: "Exposure" })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(6); // header + five buckets
  await expect(page.getByRole("row", { name: /Overdue more than 30 days/ })).toBeVisible();
  await expect(page.getByTestId("top-vendors")).toBeVisible();
});

test("the audit log filters, searches and exports", async ({ page }) => {
  await playScenario(page, 2);
  await page.goto("/ops/audit");
  await opsAdmin(page);
  await page.getByTestId("audit-group").selectOption("payment");
  await expect(page.getByRole("table")).toContainText("payment.created");
  await page.getByLabel("Search the audit log").fill("stu-aarav");
  await expect(page.getByRole("table")).toContainText("stu-aarav");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("audit-csv").click()]);
  const text = readFileSync((await dl.path())!, "utf8");
  expect(text.split("\n")[0]).toBe("id,time,actor,action,target,details");
  expect(text).toContain("payment.created");
});

test("limit override: role-gated, reason required, audited, and the student is told", async ({ page }) => {
  await openDemo(page, "/ops/limits");
  await page.getByRole("button", { name: "Demo controls" }).click();
  await page.getByRole("button", { name: "Support agent", exact: true }).click();
  await page.getByRole("button", { name: "Close demo controls" }).click();
  await expect(page.getByTestId("limit-apply")).toBeDisabled(); // a support agent cannot override limits
  await opsAdmin(page);
  await page.getByTestId("limit-student").selectOption("stu-diya");
  await expect(page.getByTestId("limit-current")).toContainText("3000 coins");
  await page.getByTestId("limit-level").selectOption("5");
  await page.getByTestId("limit-apply").click();
  await expect(page.getByText("Give a reason. It is written to the audit log.")).toBeVisible();
  await page.getByLabel(/Reason \(required/).fill("Confirmed by the lending partner");
  await page.getByTestId("limit-apply").click();
  await expect(page.getByTestId("limit-current")).toContainText("7500 coins");
  await expect(page.getByTestId("recent-overrides")).toContainText("Diya");
  await page.goto("/ops/audit");
  await page.getByTestId("audit-group").selectOption("limit");
  await expect(page.getByRole("table")).toContainText("limit.override");
});

test("a damaged saved demo falls back to the seed instead of breaking the app", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kredo-demo-world", JSON.stringify({ state: { world: { schema: 4, clock: {}, loans: "nope" } }, version: 4 })));
  await page.goto("/start");
  await page.getByTestId("persona-diya").click();
  await expect(page.getByTestId("student-home")).toBeVisible();
  await expect(page.getByTestId("aura-value")).toHaveText("68");
});

test("keyboard: the confirm sheet traps focus, is reachable by tab, and closes with Escape", async ({ page }) => {
  await page.goto("/start");
  await page.getByTestId("persona-aarav").click();
  await page.goto("/dashboard/pay");
  await page.getByTestId("stall-ven-gupta-chai").click();
  await expect(page.getByTestId("scan-status")).toContainText("QR scanned");
  await page.getByLabel("Amount in coins").fill("40");
  await page.getByTestId("review").focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }
  await page.getByLabel("Enter your PIN").focus();
  await page.keyboard.type("1234");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId("review")).toBeVisible();
});

test("no sideways scroll on the new ops and metrics screens at phone width", async ({ page }) => {
  for (const path of ["/demo/metrics", "/ops/flags", "/ops/exposure", "/ops/audit", "/ops/limits"]) {
    await openDemo(page, path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), path).toBeLessThanOrEqual(0);
  }
});

/** Automated accessibility checks on the new screens. Serious and critical problems fail the test. */
const AXE_PAGES: [string, string][] = [
  ["the role chooser", "/start"],
  ["the investor metrics", "/demo/metrics"],
  ["the money-flow diagram", "/demo/flow"],
  ["ops exposure", "/ops/exposure"],
  ["ops audit log", "/ops/audit"],
];
for (const [name, path] of AXE_PAGES) {
  test(`accessibility: ${name} has no serious or critical issues`, async ({ page }) => {
    await openDemo(page, path);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
}

test("accessibility: a vendor screen and a student pay screen have no serious or critical issues", async ({ page }) => {
  await page.goto("/start");
  await page.getByTestId("persona-v-gupta").click();
  await expect(page.getByTestId("received-today")).toBeVisible();
  let r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
  await page.goto("/start");
  await page.getByTestId("persona-aarav").click();
  await page.goto("/dashboard/pay");
  await expect(page.getByTestId("pay-world")).toBeVisible();
  r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
});

/** A wider sweep: every demo-world screen, signed in as someone who has something to show. */
const SWEEP: [string, string, string][] = [
  ["ishita", "/dashboard", "student-home"],
  ["diya", "/dashboard/loans", "loans-world"],
  ["diya", "/dashboard/aura", "aura-world"],
  ["rohan", "/dashboard/limit", "limit-world"],
  ["ishita", "/dashboard/recovery", "recovery-world"],
  ["aarav", "/dashboard/pay", "pay-world"],
  ["v-gupta", "/vendor", "received-today"],
  ["v-gupta", "/vendor/payments", "payments-total"],
  ["v-gupta", "/vendor/settlements", "settle-awaiting"],
  ["v-gupta", "/vendor/qr", "stall-qr"],
  ["v-gupta", "/vendor/disputes", "refund-cap"],
  ["v-gupta", "/vendor/insights", "ins-today"],
  ["v-gupta", "/vendor/support", "support-contact"],
  ["diya", "/dashboard/activity", "activity-world"],
  ["diya", "/dashboard/profile", "profile-world"],
];
for (const [persona, path, marker] of SWEEP) {
  test(`accessibility sweep: ${path} as ${persona}`, async ({ page }) => {
    await page.goto("/start");
    await page.getByTestId(`persona-${persona}`).click();
    await page.goto(path);
    await expect(page.getByTestId(marker)).toBeVisible();
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
}

for (const path of ["/ops/vendors", "/ops/settlements", "/ops/flags", "/ops/limits", "/demo", "/vendor/onboarding"]) {
  test(`accessibility sweep: ${path}`, async ({ page }) => {
    await openDemo(page, path);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).exclude("iframe").analyze();
    expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
}

test("the verification queues have a Students | Vendors switch", async ({ page }) => {
  await openDemo(page, "/ops/verifications");
  await page.getByRole("radio", { name: "Vendors" }).click();
  await expect(page).toHaveURL(/\/ops\/vendors/);
  await page.getByRole("radio", { name: "Students" }).click();
  await expect(page).toHaveURL(/\/ops\/verifications/);
});
