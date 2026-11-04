import { expect, test, type Page } from "@playwright/test";

// Milestone 6: the Demo Stage (two live-linked phone frames, the ledger strip, the money-flow diagram, presenter mode)
// and the 11 scripted scenarios. Scenarios are played in "fast" mode, which only shortens the pause between steps.

/** Waits until the stage is interactive (React has taken over the server-rendered page and the world is loaded). */
async function openStage(page: Page, query = "") {
  await page.goto(`/demo${query}`);
  await expect(page.locator('main[data-ready="true"]')).toBeVisible();
}

/** Picks a scenario, retrying if the click lands while the page is still settling after load. */
async function pickScenario(page: Page, n: number) {
  await expect(async () => {
    await page.getByTestId(`scenario-${n}`).click({ timeout: 1500 });
    await expect(page.getByTestId("step-next")).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
}

/** Presses "Next step" until the log has `count` steps. The panel grows after each step, so a click can land on a moving button. */
async function nextStep(page: Page, count: number) {
  const steps = page.getByTestId("scenario-step");
  await expect(async () => {
    if ((await steps.count()) < count) await page.getByTestId("step-next").click({ timeout: 1500 });
    await expect(steps).toHaveCount(count, { timeout: 2000 });
  }).toPass({ timeout: 20_000 });
}

async function playScenario(page: Page, n: number) {
  await openStage(page, `?scenario=${n}&auto=1&fast=1`);
  await expect(page.getByTestId("scenario-done")).toBeVisible({ timeout: 60_000 });
  return page.getByTestId("scenario-log");
}

test("the stage shows a student's phone and a stall's phone, each its own real screen", async ({ page }) => {
  await openStage(page);
  const student = page.frameLocator('[data-testid="student-frame"]');
  const vendor = page.frameLocator('[data-testid="vendor-frame"]');
  await expect(student.getByTestId("student-home")).toBeVisible({ timeout: 20_000 });
  await expect(vendor.getByTestId("received-today")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("demo-money-label").first()).toBeVisible();
  await expect(page.getByTestId("ledger-empty")).toBeVisible();
  await page.getByTestId("student-picker").selectOption("stu-meera");
  await expect(student.getByTestId("blocked-note")).toBeVisible({ timeout: 20_000 });
});

test("the two phones are live-linked: a payment on the left appears on the right, in the ledger and on the diagram", async ({ page }) => {
  await openStage(page);
  await pickScenario(page, 2);
  await nextStep(page, 1);
  await nextStep(page, 2);
  const vendor = page.frameLocator('[data-testid="vendor-frame"]');
  await expect(vendor.getByTestId("live-feed")).toContainText("Aarav", { timeout: 20_000 });
  await expect(page.getByTestId("ledger-strip")).toContainText("Aarav paid 40 coins to Gupta Chai Tapri");
  await expect(page.getByTestId("ledger-strip")).toContainText("Loan created for Aarav");
  await expect(page.getByTestId("money-flow")).toHaveAttribute("data-active", "pay");
  await expect(page.getByTestId("flow-pulse")).toContainText("40 coins");
});

test("presenter mode hides the pickers and enlarges the phones", async ({ page }) => {
  await openStage(page);
  const frame = page.getByTestId("student-frame");
  const normal = (await frame.boundingBox())!.height;
  await page.getByTestId("presenter-toggle").check();
  await expect(page.getByTestId("student-picker")).toHaveCount(0);
  expect((await frame.boundingBox())!.height).toBeGreaterThan(normal);
});

test("reset on the stage clears the ledger", async ({ page }) => {
  await playScenario(page, 2);
  await expect(page.getByTestId("ledger-item").first()).toBeVisible();
  await page.getByTestId("stage-reset").click();
  await expect(page.getByTestId("ledger-empty")).toBeVisible();
});

test("the money-flow diagram has four nodes, shows no arrow into Kredo, and previews each arrow", async ({ page }) => {
  await page.goto("/demo/flow");
  for (const n of ["student", "vendor", "kredo", "nbfc"]) await expect(page.getByTestId(`node-${n}`)).toBeVisible();
  await expect(page.getByTestId("flow-statement")).toContainText("Kredo only records, scores and reports");
  for (const k of ["pay", "settle", "repay"]) {
    await page.getByTestId(`preview-${k}`).click();
    await expect(page.getByTestId("money-flow")).toHaveAttribute("data-active", k);
  }
});

test("the 'Kredo does not touch money' overlay can be switched on from the Director over any screen", async ({ page }) => {
  await page.goto("/start");
  await page.getByTestId("persona-diya").click();
  await page.getByRole("button", { name: "Demo controls" }).click();
  await page.getByTestId("director-flow").check();
  await page.getByRole("button", { name: "Close demo controls" }).click();
  await expect(page.getByTestId("flow-overlay")).toBeVisible();
  await expect(page.getByTestId("flow-overlay").getByTestId("node-kredo")).toBeVisible();
});

test("the Director lists the scenarios and opens the stage on the chosen one", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("button", { name: "Demo controls" }).click();
  await page.getByTestId("director-scenario-7").click();
  await expect(page).toHaveURL(/\/demo\?scenario=7/);
  await expect(page.getByTestId("scenario-title")).toContainText("7. Prior default cap");
});

test("the stage does not scroll sideways", async ({ page }) => {
  await openStage(page);
  await expect(page.getByTestId("student-frame")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

const EXPECT: Record<number, (string | RegExp)[]> = {
  1: ["Bank check passed", "is live", "Limit 1000 coins (₹1000), Aura 50"],
  2: ["fee ₹5", "Aarav can still spend 960 coins"],
  3: ["The lending partner paid it. Reference UTR", "Kredo moved no money"],
  4: ["Aura 50 to 53", "Streak: 1"],
  5: ["-4: Repaid 6 days after the due date", "an older event passed 90 days"],
  6: ["Back above the minimum", "Paid ₹"],
  7: ["PRIOR_DEFAULT_CAP", "Allowed. Total to repay"],
  8: ["Limit 5000 to 7500 coins", "Your credit limit is now 7500 coins"],
  9: ["SELF_PAY", "This stall isn't active right now.", "open flag"],
  10: ["Same loan returned", "Loans for Aarav: 1"],
  11: ["-120", "Taken off the next payout"],
};

for (const n of Object.keys(EXPECT).map(Number)) {
  test(`scenario ${n} plays from a fresh demo and shows what the script says`, async ({ page }) => {
    const log = await playScenario(page, n);
    for (const text of EXPECT[n]) await expect(log).toContainText(text);
    await expect(page.getByTestId("scenario-panel")).toHaveAttribute("data-status", "done");
  });
}

test("scenario 3 offers the settlement report as a CSV download", async ({ page }) => {
  await playScenario(page, 3);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download the settlement report (CSV)" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^settlement-lines-\d{4}-\d{2}-\d{2}\.csv$/);
});

test("all 11 scenarios play in sequence from a fresh demo", async ({ page }) => {
  test.setTimeout(180_000);
  await openStage(page, "?fast=1");
  await page.getByTestId("play-all").click();
  await expect(page.getByTestId("scenario-panel")).toHaveAttribute("data-scenario", "11", { timeout: 150_000 });
  await expect(page.getByTestId("scenario-done")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("scenario-panel")).toHaveAttribute("data-status", "done");
  await expect(page.getByTestId("scenario-log")).toContainText("-120");
});
