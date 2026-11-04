import { expect, test, type Page } from "@playwright/test";
import { asOps } from "./helpers";

// Milestone 2: vendor onboarding (with penny-drop outcomes), the QR, the dashboard and the ops review.
// Everything is fictional. The full account number is typed into a form field but never kept.

async function fillDetails(page: Page, stall = "Nisha's Rolls") {
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("One-time code").fill("123456");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByLabel("Owner's name").fill("Nisha Rao");
  await page.getByLabel("Stall name").fill(stall);
  await page.getByLabel("Where on campus?").fill("Main gate");
  await page.getByLabel("Opening hours").fill("9am to 6pm");
  await page.getByRole("button", { name: "Save and continue" }).click();
}

async function kyc(page: Page, registered: boolean) {
  await expect(page).toHaveURL(/onboarding\/kyc/);
  await page.getByLabel("Last 4 digits of your ID").fill("4821");
  await page.getByRole("radio", { name: registered ? /I have a business registration/ : /Small stall, no registration/ }).click();
  await page.getByRole("button", { name: "Check my ID" }).click();
}

async function bank(page: Page) {
  await expect(page).toHaveURL(/onboarding\/bank/);
  await page.getByLabel("Account number").fill("123456789034");
  await page.getByLabel("IFSC code").fill("DEMO0001234");
  await page.getByRole("button", { name: "Verify with ₹1" }).click();
}

async function agreeAndSubmit(page: Page) {
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/onboarding\/agreement/);
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Tick the box to continue.")).toBeVisible();
  await page.getByLabel("I have read and agree to the vendor agreement").check();
  await page.getByRole("button", { name: "Submit for review" }).click();
}

test("a new stall is onboarded, accepted, gets a QR, and can replace it", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("link", { name: "Set up my stall" }).click();
  await fillDetails(page);
  await kyc(page, true);
  await bank(page);
  await expect(page.getByTestId("bank-result")).toContainText("verified");
  await agreeAndSubmit(page);

  await expect(page.getByTestId("onboarding-status")).toHaveAttribute("data-status", "pending");
  await expect(page.getByRole("heading", { name: "We're checking your stall" })).toBeVisible();
  // while pending, the dashboard stays behind its guard
  await page.goto("/vendor");
  await expect(page.getByRole("heading", { name: "Your stall is being verified" })).toBeVisible();

  await page.goto("/vendor/onboarding/status");
  await page.getByTestId("fast-accept").click();
  await expect(page.getByRole("heading", { name: "You're in. Your stall is live." })).toBeVisible();

  await page.getByRole("link", { name: "See my QR" }).click();
  const qr = page.getByTestId("stall-qr");
  await expect(qr.locator("svg")).toBeVisible();
  await expect(qr).toHaveAttribute("data-version", "1");
  await page.getByText("Demo: the code inside this QR").click();
  await expect(page.getByTestId("qr-payload")).toContainText("kredo://pay/");

  await page.getByRole("button", { name: "Make a new QR" }).click();
  await page.getByTestId("confirm-regen").click();
  await expect(qr).toHaveAttribute("data-version", "2");
  await expect(page.getByText("New QR ready. The old one no longer works.")).toBeVisible();

  await page.goto("/vendor");
  await expect(page.getByText("Nisha's Rolls")).toBeVisible();
  await expect(page.getByTestId("feed-empty")).toBeVisible();
});

test("a name mismatch on the ₹1 bank check blocks the next step until it succeeds", async ({ page }) => {
  await page.goto("/vendor/onboarding");
  await fillDetails(page, "Mismatch Stall");
  await kyc(page, false);
  await page.getByRole("button", { name: "Demo controls" }).click();
  await page.getByTestId("penny-name_mismatch").click();
  await page.getByRole("button", { name: "Close demo controls" }).click();
  await bank(page);
  await expect(page.getByTestId("bank-result")).toContainText("doesn't match");
  await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);
  await page.goto("/vendor/onboarding/agreement");
  await expect(page).toHaveURL(/onboarding\/bank/); // out-of-order steps are sent back

  await page.getByRole("button", { name: "Demo controls" }).click();
  await page.getByTestId("penny-success").click();
  await page.getByRole("button", { name: "Close demo controls" }).click();
  await page.getByLabel("Account number").fill("123456789034");
  await page.getByLabel("IFSC code").fill("DEMO0001234");
  await page.getByRole("button", { name: "Verify with ₹1" }).click();
  await expect(page.getByTestId("bank-result")).toContainText("verified");
});

test("a small stall with no registration is shown the lower daily limit", async ({ page }) => {
  await page.goto("/vendor/onboarding");
  await fillDetails(page);
  await expect(page).toHaveURL(/onboarding\/kyc/);
  await page.getByRole("radio", { name: /Small stall, no registration/ }).click();
  await expect(page.getByTestId("cap-line")).toContainText("5000 coins");
  await page.getByRole("radio", { name: /I have a business registration/ }).click();
  await expect(page.getByTestId("cap-line")).toContainText("20000 coins");
});

test("a seeded stall shows its ledger, and an old QR version stops working after ops revokes it", async ({ page }) => {
  await asOps(page, "admin");
  await page.goto("/start");
  await page.getByTestId("persona-v-gupta").click();
  await expect(page.getByText("Gupta Chai Tapri")).toBeVisible();
  await expect(page.getByTestId("live-feed").getByTestId("payment-row").first()).toBeVisible();
  await page.goto("/vendor/payments");
  await expect(page.getByTestId("payments-total")).toContainText("payments");
  await page.getByRole("radio", { name: "Settled" }).click();
  await expect(page.getByTestId("payment-row").first()).toBeVisible();

  await page.goto("/vendor/qr");
  await expect(page.getByTestId("stall-qr")).toHaveAttribute("data-version", "1");
  await page.goto("/ops/vendors");
  await page.getByRole("radio", { name: "Active" }).click();
  await page.getByRole("button", { name: "Review Gupta Chai Tapri" }).click();
  await page.getByTestId("ops-revoke-qr").click();
  await expect(page.getByText("Give a reason. It is written to the audit log.")).toBeVisible();
  await page.getByLabel(/Reason/).fill("Photo of QR posted online");
  await page.getByTestId("ops-revoke-qr").click();
  await expect(page.getByTestId("ops-audit")).toContainText("vendor.qr_regenerated");
  await page.goto("/vendor/qr");
  await expect(page.getByTestId("stall-qr")).toHaveAttribute("data-version", "2");
});

test("ops can review a pending stall, and suspending a stall shows its owner the right screen", async ({ page }) => {
  await asOps(page, "reviewer");
  await page.goto("/ops/vendors");
  // the seeded pending stall has an unverified bank account, so it cannot be accepted
  await page.getByRole("button", { name: "Review Juice Junction" }).click();
  await expect(page.getByTestId("ops-bank")).toContainText("Not verified");
  await expect(page.getByTestId("ops-accept")).toBeDisabled();
  await page.getByLabel(/Reason/).fill("Bank details missing");
  await page.getByTestId("ops-resubmit").click();
  await expect(page.getByTestId("ops-audit")).toContainText("vendor.resubmission_requested");

  await page.getByRole("radio", { name: "Active" }).click();
  await page.getByRole("button", { name: "Review Campus Print Hub" }).click();
  await page.getByLabel(/Reason/).fill("Complaint under review");
  await page.getByTestId("ops-suspend").click();
  await expect(page.getByTestId("ops-audit")).toContainText("vendor.suspended");

  await page.goto("/start");
  await page.getByTestId("persona-v-print").click();
  await expect(page.getByRole("heading", { name: "This stall isn't active right now" })).toBeVisible();
});
