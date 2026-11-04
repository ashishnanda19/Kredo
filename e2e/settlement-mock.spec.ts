import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Milestone 4: the 12-hour settlement, the mock lender's answers, retry, reports, refunds and reconciliation.
// Everything is simulated and fictional; no money moves.

async function jump(page: Page, persona: string) {
  await page.goto("/start");
  await page.getByTestId(`persona-${persona}`).click();
  await expect(page).toHaveURL(/\/(dashboard|vendor)/);
}

async function pay(page: Page, stall: string, coins: string) {
  await page.goto("/dashboard/pay");
  await page.getByTestId(`stall-${stall}`).click();
  await expect(page.getByTestId("scan-status")).toContainText("QR scanned");
  await page.getByLabel("Amount in coins").fill(coins);
  await page.getByTestId("review").click();
  await page.getByLabel("Enter your PIN").fill("1234");
  await page.getByTestId("pay-confirm").click();
  await expect(page.getByTestId("pay-success")).toBeVisible();
}

async function demo(page: Page, ...testIds: string[]) {
  await page.getByRole("button", { name: "Demo controls" }).click();
  for (const id of testIds) await page.getByTestId(id).click();
  await page.getByRole("button", { name: "Close demo controls" }).click();
}

/** Sign in as an ops admin through the demo panel (the world and the student's portal state stay as they are). */
async function opsAdmin(page: Page) {
  await page.getByRole("button", { name: "Demo controls" }).click();
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await page.getByRole("button", { name: "Close demo controls" }).click();
}

const awaiting = async (page: Page) => Number((await page.getByTestId("settle-awaiting").innerText()).replace(/\D/g, ""));

test("a payment is settled 12 hours later, the lender pays, and the vendor sees the reference", async ({ page }) => {
  await jump(page, "aarav");
  await pay(page, "ven-gupta-chai", "40");
  await page.goto("/start");
  await page.getByTestId("persona-v-gupta").click();
  await page.goto("/vendor/settlements");
  expect(await awaiting(page)).toBeGreaterThanOrEqual(40);
  await demo(page, "jump-12h");
  await expect(page.getByTestId("settle-awaiting")).toHaveText("₹0");
  const row = page.getByTestId("settlement-row").first();
  await expect(row).toHaveAttribute("data-status", "paid");
  await expect(row.getByTestId("settlement-detail")).toContainText("Reference UTR");
  await page.goto("/vendor");
  await expect(page.getByTestId("settlement-line")).toContainText("Settled on");
});

test("a failed settlement is shown plainly, then retried and paid by ops, and the day reconciles", async ({ page }) => {
  await jump(page, "aarav");
  await pay(page, "ven-gupta-chai", "40");
  await demo(page, "nbfc-failed", "jump-12h");
  await page.goto("/start");
  await page.getByTestId("persona-v-gupta").click();
  await page.goto("/vendor/settlements");
  const row = page.getByTestId("settlement-row").first();
  await expect(row).toHaveAttribute("data-status", "failed");
  await expect(row.getByTestId("settlement-detail")).toContainText("Not completed");

  await page.goto("/ops/settlements");
  await opsAdmin(page);
  await expect(page.getByTestId("recon-badge")).toHaveText("Reconciled");
  await expect(page.getByTestId("recon-outstanding")).not.toHaveText("₹0");
  await demo(page, "nbfc-paid");
  // each payment settles on its own, so the stall may have more than one failed settlement to retry
  const retries = page.getByRole("button", { name: /Retry SET-ven-gupta-chai/ });
  for (let n = await retries.count(); n > 0; n = await retries.count()) {
    await retries.first().click();
    await expect(retries).toHaveCount(n - 1);
  }
  await expect(page.getByTestId("recon-outstanding")).toHaveText("₹0");
  await expect(page.getByTestId("recon-paid")).toHaveText(await page.getByTestId("recon-instructed").innerText());
});

test("an on-hold settlement is shown as held, not failed", async ({ page }) => {
  await jump(page, "aarav");
  await pay(page, "ven-gupta-chai", "40");
  await demo(page, "nbfc-on_hold", "jump-12h");
  await page.goto("/start");
  await page.getByTestId("persona-v-gupta").click();
  await page.goto("/vendor/settlements");
  await expect(page.getByTestId("settlement-row").first()).toHaveAttribute("data-status", "on_hold");
  await expect(page.getByTestId("settlement-detail").first()).toContainText("On hold");
});

test("the settlement report downloads as CSV and JSON, with the vendor's payments", async ({ page }) => {
  await jump(page, "aarav");
  await pay(page, "ven-gupta-chai", "40");
  await demo(page, "jump-12h");
  await page.goto("/ops/settlements");
  await opsAdmin(page);
  const [csv] = await Promise.all([page.waitForEvent("download"), page.getByTestId("dl-summary").click()]);
  expect(csv.suggestedFilename()).toBe("settlements-2026-10-30.csv");
  const text = readFileSync((await csv.path())!, "utf8");
  expect(text.split("\n")[0]).toContain("settlement_id,business_date,vendor");
  expect(text).toContain("Gupta Chai Tapri");
  const [json] = await Promise.all([page.waitForEvent("download"), page.getByTestId("dl-json-day").click()]);
  const parsed = JSON.parse(readFileSync((await json.path())!, "utf8"));
  expect(parsed.simulated).toBe(true);
  expect(parsed.settlements.length).toBeGreaterThan(0);
});

test("a refund before settlement leaves the payment out; after settlement it is taken off the next payout", async ({ page }) => {
  await jump(page, "aarav");
  await pay(page, "ven-gupta-chai", "40");
  await page.goto("/start");
  await page.getByTestId("persona-v-gupta").click();
  await page.goto("/vendor/settlements");
  const before = await awaiting(page);
  await page.goto("/vendor/payments");
  await page.getByTestId("refund-open").first().click();
  await page.getByTestId("refund-confirm").click();
  await expect(page.getByText("Give a reason for the refund.")).toBeVisible();
  await page.getByLabel("Reason").fill("Wrong order");
  await page.getByTestId("refund-confirm").click();
  await expect(page.getByTestId("refund-done")).toBeVisible();
  await page.getByRole("button", { name: "OK" }).click();
  await page.goto("/vendor/settlements");
  expect(await awaiting(page)).toBe(before - 40);

  // a payment that has already been settled
  await demo(page, "jump-12h");
  await page.goto("/vendor/payments");
  await page.getByRole("radio", { name: "Settled" }).click();
  await page.getByTestId("refund-open").first().click();
  await page.getByLabel("Reason").fill("Cancelled order");
  await page.getByTestId("refund-confirm").click();
  await expect(page.getByTestId("refund-done")).toBeVisible();
  await page.getByRole("button", { name: "OK" }).click();
  await page.goto("/vendor/settlements");
  await expect(page.getByTestId("carry")).toContainText("will be taken off your next payout");
});

test("a large refund waits for ops, who approve it", async ({ page }) => {
  await jump(page, "sana");
  await pay(page, "ven-gupta-chai", "600");
  await page.goto("/start");
  await page.getByTestId("persona-v-gupta").click();
  await page.goto("/vendor/payments");
  await page.getByTestId("refund-open").first().click();
  await expect(page.getByText("Refunds above 500 coins are reviewed by our team")).toBeVisible();
  await page.getByLabel("Reason").fill("Order cancelled");
  await page.getByTestId("refund-confirm").click();
  await expect(page.getByTestId("refund-done")).toContainText("sent for review");
  await page.getByRole("button", { name: "OK" }).click();
  await page.goto("/vendor/disputes");
  await expect(page.getByTestId("refund-row").first()).toHaveAttribute("data-status", "pending_ops");

  await page.goto("/ops/settlements");
  await opsAdmin(page);
  await page.locator('[data-testid^="approve-"]').first().click();
  await page.goto("/vendor/disputes");
  await expect(page.getByTestId("refund-row").first()).toHaveAttribute("data-status", "done");
});
