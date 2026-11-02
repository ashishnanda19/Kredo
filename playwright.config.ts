import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for Aura. Run `npm run test:e2e` (it builds first). Two app servers start from one build:
 * mock mode (SCORE_API_URL unset, the current demo) and live mode against a fake score service that checks
 * signatures and sends internal fields, so the tests can prove the BFF strips them.
 */
const MOCK = 3211;
const LIVE = 3212;
const FAKE = 4199;
const SECRET = "e2e-bff-secret-000000000000000000000";
const OPS_SECRET = "e2e-ops-jwt-secret-0000000000000000000";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { trace: "retain-on-failure" },
  projects: [
    { name: "mock", testMatch: /(aura|ops)-mock\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: `http://127.0.0.1:${MOCK}` } },
    { name: "copy", testMatch: /copy-rules\.spec\.ts/ },
    { name: "mock-phone", testMatch: /aura-mock\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: `http://127.0.0.1:${MOCK}` } },
    { name: "live", testMatch: /(bff|ops)-live\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: `http://127.0.0.1:${LIVE}` } },
  ],
  webServer: [
    { command: "node e2e/fake-score-service.mjs", port: FAKE, env: { FAKE_SCORE_PORT: String(FAKE), FAKE_SCORE_SECRET: SECRET, FAKE_OPS_JWT_SECRET: OPS_SECRET }, reuseExistingServer: false },
    { command: `npx next start -p ${MOCK}`, port: MOCK, env: { SCORE_API_URL: "" }, reuseExistingServer: false },
    {
      command: `npx next start -p ${LIVE}`,
      port: LIVE,
      env: { SCORE_API_URL: `http://127.0.0.1:${FAKE}`, SCORE_API_KEY_ID: "bff", SCORE_API_SECRET: SECRET, SCORE_OPS_JWT_SECRET: OPS_SECRET },
      reuseExistingServer: false,
    },
  ],
});
