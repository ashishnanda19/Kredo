import { expect, test } from "@playwright/test";
import { asOps, OPS } from "./helpers";

// The ops risk console with SCORE_API_URL unset: read-only sample data from the engine's fake demo students.

const STUDENT = OPS.users.rows.find((r) => r.band === "B")!.user_id;

for (const [path, heading] of [["/ops/risk", "Risk overview"], ["/ops/risk/users", "Risk users"], ["/ops/risk/alerts", "Fraud alerts"], ["/ops/risk/overrides", "Overrides"], ["/ops/risk/config", "Scorecard and policy"]]) {
  test(`${path} renders for a risk admin, with the sample-data note`, async ({ page }) => {
    await asOps(page, "risk_admin");
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(page.getByTestId("risk-mock")).toBeVisible();
  });
}

test("the overview shows bands, roll rates and the v2 readiness counter", async ({ page }) => {
  await asOps(page, "risk_analyst");
  await page.goto("/ops/risk");
  await expect(page.getByRole("img", { name: /Users by band/ })).toBeVisible();
  await expect(page.getByText("Current → 1-7 DPD")).toBeVisible();
  await expect(page.getByTestId("v2-readiness")).toContainText("of 1,500 labelled coin spends");
  await page.getByRole("button", { name: "Show as table" }).click();
  await expect(page.getByRole("table").first()).toContainText("Band");
});

test("the overview shows model health, and a handful of students never raises a drift alarm", async ({ page }) => {
  await asOps(page, "risk_analyst");
  await page.goto("/ops/risk");
  const health = page.getByTestId("model-health");
  await expect(health).toContainText("KRS drift");
  await expect(health.getByTestId("calibration")).toContainText("Predicted");
  await expect(health.getByTestId("separation")).toContainText("Gini");
  await expect(health).toContainText(/under \d+ students/); // too few students for a PSI
  await expect(page.getByText("The latest PSI is above the alert level")).toHaveCount(0);
});

test("users are riskiest first, masked by default, and revealable", async ({ page }) => {
  await asOps(page, "risk_admin");
  await page.goto("/ops/risk/users");
  const first = OPS.users.rows[0].user_id;
  const firstLink = page.getByRole("link", { name: `${first.slice(0, 4)}…${first.slice(-4)}` });
  await expect(firstLink).toBeVisible();
  await expect(page.getByText(first)).toHaveCount(0);
  await page.getByRole("button", { name: "Show identifiers" }).click();
  await expect(page.getByText(first)).toBeVisible();
  await page.getByLabel("Band").selectOption("B");
  await expect(page.locator("tbody tr")).toHaveCount(OPS.users.rows.filter((r) => r.band === "B").length);
});

test("user detail: KRS, waterfall, history with diffs, events", async ({ page }) => {
  await asOps(page, "fraud");
  await page.goto(`/ops/risk/users/${STUDENT}`);
  await expect(page.getByTestId("risk-user-header")).toContainText("KRS");
  await expect(page.getByRole("img", { name: /Points from 500 to KRS/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Snapshot history" })).toContainText("F1 On-time rate");
  await expect(page.getByRole("region", { name: "Events" })).toContainText("Loan disbursed");
  await expect(page.getByRole("button", { name: "Run" })).toBeDisabled(); // simulate needs the service
});

test("roles: support and reviewers cannot open per-student views", async ({ page }) => {
  await asOps(page, "support");
  await page.goto("/ops/risk/users");
  await expect(page.getByRole("heading", { name: "Access restricted" })).toBeVisible();
  await page.goto("/ops/risk");
  await expect(page.getByRole("heading", { name: "Risk overview" })).toBeVisible(); // aggregates only
  await expect(page.getByRole("img", { name: /Users by band/ })).toBeVisible();
});

test("alerts show evidence with masked ids, and actions need the service", async ({ page }) => {
  await asOps(page, "fraud");
  await page.goto("/ops/risk/alerts");
  const collusion = page.getByTestId("risk-alert").filter({ hasText: "Collusion cash-out" });
  await expect(collusion).toContainText("Near-same spends at one vendor");
  await expect(collusion).toContainText("Refund soon after a spend");
  await expect(collusion.getByLabel("Actions need the score service.").first()).toBeVisible();
  await collusion.getByRole("button", { name: /…/ }).first().click(); // the vendor id opens the vendor view
  await expect(page.getByTestId("vendor-view")).toContainText("1 students");
});
