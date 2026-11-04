import { expect, test, type Page } from "@playwright/test";

// Milestone 5: the Aura screen, quests with caps, the limit ladder, and the blocked and recovery path.
// Seeded, fictional people. Calm wording is checked where it matters.

async function jump(page: Page, persona: string, path = "/dashboard") {
  await page.goto("/start");
  await page.getByTestId(`persona-${persona}`).click();
  await expect(page).toHaveURL(/\/dashboard/);
  if (path !== "/dashboard") await page.goto(path);
}

test("the Aura screen shows the score, the tier, the streak and the last events with their reasons", async ({ page }) => {
  await jump(page, "diya", "/dashboard/aura");
  await expect(page.getByTestId("aura-world")).toBeVisible();
  await expect(page.getByTestId("aura-number")).toHaveText("68");
  await expect(page.getByTestId("aura-tier-name")).toHaveText("Locked In");
  await expect(page.getByTestId("aura-streak")).toContainText("on-time repayments in a row");
  const events = page.getByTestId("aura-event");
  expect(await events.count()).toBeGreaterThan(0);
  expect(await events.count()).toBeLessThanOrEqual(10);
  await expect(events.first()).toContainText(/ON_TIME|EARLY_CLOSE|QUEST|LATE|HIGH_UTIL|WITHIN_GRACE/);
  await expect(page.getByTestId("next-best")).toBeVisible();
  await expect(page.getByText("never uses your college, gender, caste, religion or location")).toBeVisible();
});

test("a quest adds its Aura once, appears in the history, and cannot be repeated", async ({ page }) => {
  await jump(page, "aarav", "/dashboard/aura");
  await expect(page.getByTestId("aura-number")).toHaveText("50");
  await page.getByTestId("do-verify_identity").click();
  await expect(page.getByText("Done. +2 Aura.")).toBeVisible();
  await expect(page.getByTestId("aura-number")).toHaveText("52");
  await expect(page.getByTestId("quest-verify_identity")).toHaveAttribute("data-status", "done");
  await expect(page.getByTestId("do-verify_identity")).toHaveCount(0);
  await expect(page.getByTestId("aura-events").first()).toContainText("QUEST_VERIFY_IDENTITY");
  await page.getByTestId("do-verify_bank").click();
  await expect(page.getByTestId("aura-number")).toHaveText("55");
});

test("a failed identity check awards nothing and the quest stays open", async ({ page }) => {
  await jump(page, "aarav", "/dashboard/aura");
  await page.getByRole("button", { name: "Demo controls" }).click();
  await page.getByTestId("kyc-needs_retry").click();
  await page.getByRole("button", { name: "Close demo controls" }).click();
  await page.getByTestId("do-verify_identity").click();
  await expect(page.getByText("We couldn't confirm that. Try again.")).toBeVisible();
  await expect(page.getByTestId("aura-number")).toHaveText("50");
  await expect(page.getByTestId("quest-verify_identity")).toHaveAttribute("data-status", "available");
});

test("the limit ladder shows the current step, what the next needs and the post-default cap", async ({ page }) => {
  await jump(page, "rohan", "/dashboard/limit");
  await expect(page.getByTestId("ladder-4")).toHaveAttribute("data-status", "current");
  await expect(page.getByTestId("ladder-5")).toHaveAttribute("data-status", "next");
  await expect(page.getByTestId("needs")).toContainText("1 more on-time repayment (1 of 2 so far)");

  await jump(page, "kabir", "/dashboard/limit");
  await expect(page.getByTestId("cap-note")).toContainText("capped at 500 coins");
});

test("blocked, then the way back: clear what is overdue, do the quests, and spending returns", async ({ page }) => {
  await jump(page, "ishita");
  await expect(page.getByTestId("blocked-note")).toBeVisible();
  await page.getByTestId("recovery-cta").click();
  await expect(page.getByTestId("recovery-world")).toBeVisible();
  await expect(page.getByTestId("blocked-reason")).toContainText("past its due date");
  await expect(page.getByTestId("step-clear_overdue")).toHaveAttribute("data-state", "next");
  await expect(page.getByTestId("step-quests")).toHaveAttribute("data-state", "waiting");
  await expect(page.getByTestId("estimate")).toContainText("as soon as");

  await page.getByTestId("recovery-repay").click();
  await page.getByTestId("repay-confirm").click();
  await expect(page.getByTestId("repay-done")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByTestId("step-clear_overdue")).toHaveAttribute("data-state", "done");
  await expect(page.getByTestId("step-quests")).toHaveAttribute("data-state", "next");

  await page.getByTestId("do-verify_identity").click();
  await expect(page.getByTestId("recovery-progress")).toContainText("Aura 17");
  await page.getByTestId("do-verify_bank").click(); // 15 + 2 + 3 reaches the minimum of 20, so the pause lifts
  await expect(page.getByTestId("recovery-ok")).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByTestId("blocked-note")).toHaveCount(0);
  await expect(page.getByTestId("available-coins")).not.toContainText(/^0 /);
});

test("the small proof-of-repayment payment: fixed amount and window, only for someone rebuilding", async ({ page }) => {
  await jump(page, "kabir", "/dashboard/pay?micro=1");
  await expect(page.getByTestId("micro-banner")).toContainText("Proof-of-repayment");
  await expect(page.getByLabel("Amount in coins")).toHaveValue("50");
  await page.getByTestId("stall-ven-gupta-chai").click();
  await expect(page.getByTestId("scan-status")).toContainText("QR scanned");
  await page.getByTestId("review").click();
  await expect(page.getByTestId("quote")).toBeVisible();
  await page.getByLabel("Enter your PIN").fill("1234");
  await page.getByTestId("pay-confirm").click();
  await expect(page.getByTestId("pay-success")).toBeVisible();

  await jump(page, "diya", "/dashboard/pay?micro=1");
  await page.getByTestId("stall-ven-gupta-chai").click();
  await expect(page.getByTestId("scan-status")).toContainText("QR scanned");
  await page.getByTestId("review").click();
  await expect(page.getByTestId("declined-code")).toContainText("MICRO_NOT_AVAILABLE");
});

test("the Aura and recovery screens do not scroll sideways on a phone", async ({ page }) => {
  await jump(page, "ishita", "/dashboard/recovery");
  await expect(page.getByTestId("recovery-world")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await page.goto("/dashboard/aura");
  await expect(page.getByTestId("aura-world")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
