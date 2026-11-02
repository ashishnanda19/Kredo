import { expect, test, type Page } from "@playwright/test";

// Milestone 1: the role chooser, the Student | Vendor switcher, the vendor route guard and the Demo world controls.
// Runs on desktop and on a 360px-class phone. Everything is fictional seeded data.

async function jump(page: Page, persona: string) {
  await page.goto("/start");
  await page.getByTestId(`persona-${persona}`).click();
}

test("the chooser offers both roles and carries the demo label", async ({ page }) => {
  await page.goto("/start");
  await expect(page.getByRole("heading", { name: "Who are you here as?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue as a student" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Set up my stall" })).toBeVisible();
  await expect(page.getByTestId("demo-money-label")).toContainText("no real money");
});

test("a signed-in stall opens its dashboard from the seeded ledger", async ({ page }) => {
  await jump(page, "v-gupta");
  await expect(page).toHaveURL(/\/vendor$/);
  await expect(page.getByText("Gupta Chai Tapri")).toBeVisible();
  await expect(page.getByTestId("received-today")).toBeVisible();
  await expect(page.getByTestId("demo-money-label")).toBeVisible();
});

test("the vendor area is guarded: nobody signed in, pending and suspended stalls each get a clear screen", async ({ page }) => {
  await page.goto("/vendor");
  await expect(page.getByRole("heading", { name: "Sign in to open your stall dashboard." })).toBeVisible();

  await jump(page, "v-juice");
  await expect(page.getByRole("heading", { name: "Your stall is being verified" })).toBeVisible();

  await jump(page, "v-night");
  await expect(page.getByRole("heading", { name: "This stall isn't active right now" })).toBeVisible();
});

test("a student with no stall is sent to vendor onboarding, not given a merged account", async ({ page }) => {
  await jump(page, "diya");
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("radio", { name: "Vendor" }).click();
  await expect(page).toHaveURL(/\/vendor\/onboarding$/);
});

test("a person with both accounts switches after confirming their PIN", async ({ page }) => {
  await jump(page, "vikram");
  await expect(page).toHaveURL(/\/dashboard/);
  // make the last confirmation old, as if ten minutes had passed
  await page.evaluate(() => {
    const raw = localStorage.getItem("kredo-demo-world");
    if (!raw) throw new Error("world not saved");
    const j = JSON.parse(raw);
    j.state.session.confirmedAt = 0;
    localStorage.setItem("kredo-demo-world", JSON.stringify(j));
  });
  await page.reload();
  await page.getByRole("radio", { name: "Vendor" }).click();
  const sheet = page.getByRole("dialog", { name: "Confirm it's you" });
  await expect(sheet).toBeVisible();
  await sheet.getByLabel("PIN").fill("0000");
  await sheet.getByRole("button", { name: "Confirm" }).click();
  await expect(sheet.getByText("That PIN didn't match. Try again.")).toBeVisible();
  await sheet.getByLabel("PIN").fill("1234");
  await sheet.getByRole("button", { name: "Confirm" }).click();
  await expect(page).toHaveURL(/\/vendor$/);
  await expect(page.getByText("Stationery Corner")).toBeVisible();
});

test("the Demo world controls move the clock and Reset restores the starting state", async ({ page }) => {
  await jump(page, "v-gupta");
  await page.getByRole("button", { name: "Demo controls" }).click();
  const clock = page.getByTestId("sim-clock");
  const start = await clock.innerText();
  await page.getByTestId("jump-day").click();
  await expect(clock).not.toHaveText(start);
  await page.getByTestId("reset-demo").click();
  await expect(clock).toHaveText(start);
});

test("the vendor shell does not scroll sideways on a phone", async ({ page }) => {
  await jump(page, "v-gupta");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
