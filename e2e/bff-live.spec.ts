import { expect, test } from "@playwright/test";
import { asStudent, DOWN_USER, FIXTURES, INTERNAL_KEYS, keysOf } from "./helpers";

// SCORE_API_URL points at e2e/fake-score-service.mjs, which rejects bad signatures and sends internal fields.

const LOCKED_IN = FIXTURES.locked_in_streak.score.user_id;

async function as(page: import("@playwright/test").Page, user: string | null, baseURL: string) {
  await page.context().clearCookies();
  if (user) await page.context().addCookies([{ name: "kredo_uid", value: user, url: baseURL }]);
}

test("the BFF signs its calls and strips krs, pd, band and points", async ({ page, baseURL }) => {
  await as(page, LOCKED_IN, baseURL!);
  for (const url of ["/api/score/me", "/api/score/history?days=90"]) {
    const res = await page.request.get(url);
    expect(res.status()).toBe(200); // the fake service answers 401 to a bad signature
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(keysOf(body).filter((k) => INTERNAL_KEYS.includes(k))).toEqual([]);
  }
  for (const f of Object.values(FIXTURES)) {
    await as(page, f.score.user_id, baseURL!);
    expect(await (await page.request.get("/api/score/me")).text()).not.toMatch(/"(krs|pd|band|points)"/); // not even as a value
  }
  await as(page, LOCKED_IN, baseURL!);
  const me = await (await page.request.get("/api/score/me")).json();
  expect(me.view.aura).toBe(FIXTURES.locked_in_streak.score.aura);

  const sim = await page.request.post("/api/score/simulate", { data: { daysEarly: 2 } });
  expect(sim.status()).toBe(200);
  const simBody = await sim.json();
  expect(simBody.status).toBe("ok");
  expect(keysOf(simBody).filter((k) => INTERNAL_KEYS.includes(k))).toEqual([]);
});

test("no student yet, unknown student, and a service outage", async ({ page, baseURL }) => {
  await as(page, null, baseURL!);
  expect((await (await page.request.get("/api/score/me")).json()).status).toBe("no_score");
  await as(page, "00000000-0000-4000-8000-000000000404", baseURL!);
  expect((await (await page.request.get("/api/score/me")).json()).status).toBe("no_score");
  await as(page, DOWN_USER, baseURL!);
  const down = await page.request.get("/api/score/me");
  expect(down.status()).toBe(503);
  expect((await down.json()).status).toBe("unavailable");
});

test("the simulate endpoint validates input and is rate-limited per student", async ({ page, baseURL }) => {
  await as(page, FIXTURES.collusion_alert.score.user_id, baseURL!);
  expect((await page.request.post("/api/score/simulate", { data: { daysEarly: 30 } })).status()).toBe(400);
  const codes: number[] = [];
  for (let i = 0; i < 12; i++) codes.push((await page.request.post("/api/score/simulate", { data: { daysEarly: 1 } })).status());
  expect(codes.slice(0, 10).every((c) => c === 200)).toBe(true);
  expect(codes.at(-1)).toBe(429);
});

test("a demo preset makes the new fake student 'you'", async ({ page, baseURL }) => {
  await as(page, null, baseURL!);
  const res = await page.request.post("/api/score/demo", { data: { preset: "knockout_overdue_35" } });
  expect(res.status()).toBe(200);
  const me = await (await page.request.get("/api/score/me")).json();
  expect(me.view.state).toBe("knockout");
  expect((await page.request.post("/api/score/demo", { data: { preset: "drop_tables" } })).status()).toBe(400);
});

test("live screens: no score yet, then the last known Aura when the service is down", async ({ page, baseURL }) => {
  await asStudent(page);
  await as(page, null, baseURL!);
  await page.goto("/dashboard/aura");
  await expect(page.getByTestId("aura-no-score")).toBeVisible();

  await as(page, LOCKED_IN, baseURL!);
  await page.goto("/dashboard/aura");
  await expect(page.getByTestId("aura-state-normal")).toBeVisible();
  await expect(page.getByText("Showing sample Aura data")).toHaveCount(0);

  await as(page, DOWN_USER, baseURL!);
  await page.goto("/dashboard/aura");
  await expect(page.getByTestId("aura-unavailable")).toContainText("This is your last known Aura, from");
  await expect(page.getByTestId("aura-number")).toHaveText(String(FIXTURES.locked_in_streak.score.aura));
  await expect(page.getByTestId("aura-disclaimer")).toBeVisible();
});
