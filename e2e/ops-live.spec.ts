import { expect, test } from "@playwright/test";
import { OPS } from "./helpers";

// The ops BFF against the fake service, which checks the HMAC signature and the ops JWT like the real service.

const role = (r: string) => ({ "x-kredo-ops-role": r });

test("the ops BFF signs, mints a valid JWT per role, and passes the service's answers through", async ({ request }) => {
  const users = await request.get("/api/ops/risk/users", { headers: role("risk_analyst") });
  expect(users.status()).toBe(200); // the fake answers 401 to a bad signature or a bad token
  expect((await users.json()).rows.length).toBe(OPS.users.rows.length);
  const id = OPS.users.rows[0].user_id;
  expect((await request.get(`/api/ops/risk/users/${id}`, { headers: role("fraud") })).status()).toBe(200);
  expect((await request.get("/api/ops/risk/users", { headers: role("support") })).status()).toBe(403);
  expect((await request.get("/api/ops/risk/monitoring", { headers: role("support") })).status()).toBe(200);
});

test("the ops BFF refuses calls without a role and paths off the allowlist", async ({ request }) => {
  expect((await request.get("/api/ops/risk/users")).status()).toBe(401);
  expect((await request.get("/api/ops/risk/users", { headers: role("superuser") })).status()).toBe(401);
  expect((await request.get("/api/ops/risk/../events", { headers: role("risk_admin") })).status()).toBe(404);
  expect((await request.post("/api/ops/risk/users", { headers: role("risk_admin"), data: {} })).status()).toBe(404);
  expect((await request.patch("/api/ops/risk/overrides", { headers: role("risk_admin"), data: {} })).status()).toBe(404);
});

test("service error codes reach the console unchanged", async ({ request }) => {
  const r = await request.post("/api/ops/risk/overrides/0192f3c2-7d1e-7a4b-9c11-5e2f8a6b3d10/approve", { headers: role("risk_admin"), data: {} });
  expect(r.status()).toBe(403);
  expect((await r.json()).detail.code).toBe("MAKER_CANNOT_DECIDE");
});
