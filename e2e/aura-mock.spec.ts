import { expect, test } from "@playwright/test";
import { asStudent, FIXTURES } from "./helpers";

// SCORE_API_URL is unset on this server: the current demo, answered by the mock adapter from the engine's fixtures.

const STATES: [string, string][] = [
  ["fresh_spawn", "fresh_spawn"],
  ["locked_in_streak", "normal"],
  ["late_payer_recovering", "normal"],
  ["knockout_overdue_35", "knockout"],
  ["collusion_alert", "fresh_spawn"],
  ["held_for_review", "held"],
  ["consent_frozen", "consent_frozen"],
  ["unavailable", "unavailable"],
];

for (const [preset, state] of STATES) {
  test(`renders the ${preset} state with the disclaimer`, async ({ page }) => {
    await asStudent(page, preset);
    await page.goto("/dashboard/aura");
    await expect(page.getByTestId(`aura-state-${state}`)).toBeVisible();
    await expect(page.getByTestId("aura-disclaimer")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("KRS");
  });
}

for (const path of ["/dashboard/aura", "/dashboard/aura/history", "/dashboard/aura/level-up", "/dashboard/aura/wrapped", "/dashboard/aura/about"]) {
  test(`${path} always shows the bureau disclaimer`, async ({ page }) => {
    await asStudent(page, "locked_in_streak");
    await page.goto(path);
    await expect(page.getByTestId("aura-disclaimer")).toHaveText(/Not a credit bureau score and does not change your CIBIL/);
  });
}

test("a knockout is calm and plain: the amount and one action, no number or tier slang", async ({ page }) => {
  await asStudent(page, "knockout_overdue_35");
  await page.goto("/dashboard/aura");
  const notice = page.getByTestId("aura-notice");
  await expect(notice).toContainText("New coin spends are paused because ₹1,000 is overdue. Paying it lifts the pause.");
  await expect(notice.getByRole("link", { name: "Pay now" })).toBeVisible();
  await expect(page.getByTestId("aura-hero")).toHaveCount(0);
  for (const tier of ["Reset Arc", "Side Quest", "Locked In", "Main Character", "Aura Farmer"]) await expect(page.getByText(tier)).toHaveCount(0);
});

test("reduced motion shows the final Aura at once", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await asStudent(page, "locked_in_streak");
  await page.goto("/dashboard/aura");
  await expect(page.getByTestId("aura-number")).toHaveText(String(FIXTURES.locked_in_streak.score.aura), { timeout: 1500 });
  await ctx.close();
});

test("shows a loading skeleton until the Aura arrives", async ({ page }) => {
  await asStudent(page, "fresh_spawn");
  await page.route("**/api/score/me", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page.goto("/dashboard/aura");
  await expect(page.getByTestId("aura-loading")).toBeVisible();
  await expect(page.getByTestId("aura-state-fresh_spawn")).toBeVisible();
});

test("the dashboard widget shows Aura, tier and the disclaimer, and links to the Aura page", async ({ page }) => {
  await asStudent(page, "locked_in_streak");
  await page.goto("/dashboard");
  const widget = page.getByTestId("aura-widget");
  await expect(widget).toContainText("Locked In");
  await expect(widget).toContainText("2-cycle streak");
  await expect(widget.getByTestId("aura-disclaimer")).toBeVisible();
  await widget.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/dashboard\/aura$/);
});

test("the old credit profile route now opens Aura", async ({ page }) => {
  await asStudent(page);
  await page.goto("/dashboard/credit-profile");
  await expect(page).toHaveURL(/\/dashboard\/aura$/);
});

test("level up: ladder, and a what-if labelled as an estimate", async ({ page }) => {
  await asStudent(page, "locked_in_streak");
  await page.goto("/dashboard/aura/level-up");
  await expect(page.getByTestId("aura-ladder")).toContainText("more clean cycles to ₹3,000");
  await expect(page.getByTestId("aura-ladder")).toContainText("decided by the lending partner and are not guaranteed");
  const whatIf = page.getByTestId("aura-what-if");
  await expect(whatIf.getByText("Estimate, not a promise").first()).toBeVisible();
  await expect(whatIf).toContainText(/Estimated Aura by .+: \d+/);
});

test("history: tapping a moment shows what happened", async ({ page }) => {
  await asStudent(page, "late_payer_recovering");
  await page.goto("/dashboard/aura/history");
  await page.getByRole("radio", { name: "6 months" }).click();
  await page.getByRole("button", { name: /Repaid late/ }).click();
  await expect(page.getByRole("status")).toContainText("came in after the due date");
});

test("the Wrapped share card shows tier and streak only", async ({ page }) => {
  await asStudent(page, "locked_in_streak");
  await page.goto("/dashboard/aura/wrapped");
  const next = page.getByRole("button", { name: "Next card" });
  while (await next.isEnabled()) await next.click();
  const card = page.locator("[aria-roledescription=slide]");
  await expect(card).toContainText("Locked In");
  await expect(card).toContainText("2-cycle streak");
  await expect(card).not.toContainText("₹");
});

test("demo controls switch the Aura preset", async ({ page }) => {
  await asStudent(page, "fresh_spawn");
  await page.goto("/dashboard/aura");
  await expect(page.getByTestId("aura-state-fresh_spawn")).toBeVisible();
  await page.getByRole("button", { name: "Demo controls" }).click();
  await page.getByRole("button", { name: "Knockout: overdue 35 days" }).click();
  await expect(page.getByTestId("aura-state-knockout")).toBeVisible();
});
