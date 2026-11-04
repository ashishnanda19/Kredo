import { expect, test, type Page } from "@playwright/test";

// Milestone 3: the student pay flow on the demo world. Seeded, fictional people. The original portal screens are
// covered by the earlier specs and are untouched.

async function jump(page: Page, persona: string) {
  await page.goto("/start");
  await page.getByTestId(`persona-${persona}`).click();
  await expect(page).toHaveURL(/\/(dashboard|vendor)/);
}

async function startPay(page: Page, stall: string, coins: string) {
  await page.goto("/dashboard/pay");
  await page.getByTestId(`stall-${stall}`).click();
  await expect(page.getByTestId("scan-status")).toContainText("QR scanned");
  await page.getByLabel("Amount in coins").fill(coins);
}

test("a new student pays a stall: costs shown first, PIN checked, receipt shown, and the stall sees it", async ({ page }) => {
  await jump(page, "aarav");
  await expect(page.getByTestId("available-coins")).toContainText("1000");
  await expect(page.getByTestId("limit-total")).toContainText("1000");
  await page.getByTestId("scan-pay").click();
  await page.getByTestId("stall-ven-gupta-chai").click();
  await expect(page.getByTestId("scan-status")).toContainText("QR scanned: Gupta Chai Tapri");
  await page.getByLabel("Amount in coins").fill("40");
  await page.getByTestId("review").click();

  await expect(page.getByTestId("q-fee")).toHaveText("₹5");
  await expect(page.getByTestId("q-total")).toContainText("₹");
  await expect(page.getByTestId("q-after")).toHaveText("960 coins");
  await expect(page.getByTestId("q-due")).toBeVisible();
  await page.getByLabel("Enter your PIN").fill("0000");
  await page.getByTestId("pay-confirm").click();
  await expect(page.getByText("That PIN didn't match. Try again.")).toBeVisible();
  await page.getByLabel("Enter your PIN").fill("1234");
  await page.getByTestId("pay-confirm").click();

  await expect(page.getByTestId("pay-success")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Paid 40 coins" })).toBeVisible();
  await expect(page.getByTestId("receipt-id")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByTestId("available-coins")).toContainText("960");

  await page.goto("/start");
  await page.getByTestId("persona-v-gupta").click();
  await expect(page.getByTestId("live-feed")).toContainText("Aarav");
});

test("a dropped connection followed by a retry creates exactly one payment", async ({ page }) => {
  await jump(page, "aarav");
  await page.getByRole("button", { name: "Demo controls" }).click();
  await page.getByTestId("fail-next-pay").check();
  await page.getByRole("button", { name: "Close demo controls" }).click();
  await startPay(page, "ven-gupta-chai", "60");
  await page.getByTestId("review").click();
  await page.getByLabel("Enter your PIN").fill("1234");
  await page.getByTestId("pay-confirm").click();
  await expect(page.getByTestId("network-error")).toBeVisible();
  await page.getByTestId("retry").click();
  await expect(page.getByTestId("pay-success")).toBeVisible();
  await page.goto("/dashboard/loans");
  await expect(page.getByTestId("loan-row")).toHaveCount(1);
  await page.goto("/dashboard");
  await expect(page.getByTestId("available-coins")).toContainText("940");
});

test("after a default, a request over the cap is declined with its code and a smaller one goes through", async ({ page }) => {
  await jump(page, "kabir");
  await startPay(page, "ven-gupta-chai", "800");
  await page.getByTestId("review").click();
  await expect(page.getByTestId("declined-code")).toContainText("PRIOR_DEFAULT_CAP");
  await expect(page.getByTestId("declined")).toContainText("capped at 500 coins");
  await page.getByLabel("Amount in coins").fill("300");
  await page.getByTestId("review").click();
  await expect(page.getByTestId("q-total")).toBeVisible();
});

test("a blocked student sees a calm explanation on home and a reason code when paying", async ({ page }) => {
  await jump(page, "ishita");
  await expect(page.getByTestId("blocked-note")).toContainText("Spends are paused");
  await expect(page.getByTestId("available-coins")).toContainText("0");
  await startPay(page, "ven-gupta-chai", "50");
  await page.getByTestId("review").click();
  await expect(page.getByTestId("declined-code")).toContainText("LOW_AURA");
});

test("a suspended stall's QR is rejected, and paying your own stall is blocked", async ({ page }) => {
  await jump(page, "aarav");
  await page.goto("/dashboard/pay");
  await page.getByTestId("stall-ven-night-canteen").click();
  await expect(page.getByTestId("scan-error")).toHaveText("This stall isn't active right now.");

  await jump(page, "vikram");
  await startPay(page, "ven-stationery", "50");
  await page.getByTestId("review").click();
  await expect(page.getByTestId("declined-code")).toContainText("SELF_PAY");
  await expect(page.getByTestId("declined")).toContainText("linked to your own account");
});

test("repaying: a part payment, then the rest, with the statement and the Aura effect", async ({ page }) => {
  await jump(page, "diya");
  await page.goto("/dashboard/loans");
  const first = page.getByTestId("loan-row").first();
  await first.click();
  const owed = Number((await page.getByTestId("still-owed").innerText()).replace(/\D/g, ""));
  expect(owed).toBeGreaterThan(10);
  await page.getByTestId("repay-loan").click();
  await page.getByRole("radio", { name: "Part payment" }).click();
  await page.getByLabel("Amount in rupees").fill("10");
  await page.getByTestId("repay-confirm").click();
  await expect(page.getByTestId("repay-done")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByTestId("still-owed")).toHaveText(`₹${owed - 10}`);
  await expect(page.getByTestId("statement")).toContainText("Repayment of ₹10");

  await page.getByTestId("repay-loan").click();
  await page.getByRole("radio", { name: "This payment" }).click();
  await page.getByTestId("repay-confirm").click();
  await expect(page.getByTestId("repay-done")).toBeVisible();
  await expect(page.getByTestId("repay-aura")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByTestId("still-owed")).toHaveText("₹0");
});

test("the clock jump brings reminders into the tray, and opening it clears the dot", async ({ page }) => {
  await jump(page, "diya");
  await page.getByRole("button", { name: "Demo controls" }).click();
  await page.getByTestId("jump-due").click();
  await page.getByRole("button", { name: "Close demo controls" }).click();
  await expect(page.getByTestId("bell")).toHaveAttribute("aria-label", /new/);
  await page.getByTestId("bell").click();
  await expect(page.getByTestId("notes-list")).toContainText("due");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("bell")).toHaveAttribute("aria-label", "Notifications");
});

test("the demo-world home does not scroll sideways on a phone", async ({ page }) => {
  await jump(page, "rohan");
  await expect(page.getByTestId("student-home")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the demo student's activity and profile are their own, and the home shows streak and quests", async ({ page }) => {
  await jump(page, "diya");
  await expect(page.getByTestId("home-streak")).toContainText("on-time repayments in a row");
  await expect(page.getByTestId("home-quests")).toBeVisible();
  await page.goto("/dashboard/activity");
  await expect(page.getByTestId("activity-item").first()).toBeVisible();
  await expect(page.getByTestId("activity-world")).toContainText(/Paid \d+ coins to|Repaid ₹/);
  await page.goto("/dashboard/profile");
  await expect(page.getByTestId("profile-world")).toContainText("Diya");
  await expect(page.getByTestId("profile-world")).toContainText("••••");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/start/);
});
