// A stand-in for services/score in the end-to-end tests. It checks the BFF's HMAC signature exactly like the real
// service (a wrong signature is a 401) and answers from lib/score/fixtures.json, adding back the internal fields the
// real service sends (krs, pd, band, reason-code points) so the tests can prove the BFF strips them.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const PORT = Number(process.env.FAKE_SCORE_PORT ?? 4199);
const SECRET = process.env.FAKE_SCORE_SECRET ?? "e2e-bff-secret-000000000000000000000";
const fixtures = JSON.parse(readFileSync(new URL("../lib/score/fixtures.json", import.meta.url), "utf8")).presets;
const ops = JSON.parse(readFileSync(new URL("../lib/score/ops-fixtures.json", import.meta.url), "utf8"));
const OPS_SECRET = process.env.FAKE_OPS_JWT_SECRET ?? "e2e-ops-jwt-secret-0000000000000000000";
const RISK_ROLES = new Set(["risk_analyst", "risk_admin", "admin", "fraud"]);

/** The ops JWT exactly as the real service checks it: HS256, issuer, audience, expiry, role. */
function opsActor(req) {
  const token = String(req.headers.authorization ?? "").replace(/^Bearer /, "");
  const [h, c, sig] = token.split(".");
  if (!sig) return null;
  const want = createHmac("sha256", OPS_SECRET).update(`${h}.${c}`).digest("base64url");
  if (want !== sig) return null;
  const claims = JSON.parse(Buffer.from(c, "base64url").toString());
  if (claims.iss !== "kredo-bff" || claims.aud !== "kredo-score" || claims.exp < Date.now() / 1000 || !claims.sub) return null;
  return claims;
}

export const DOWN_USER = "00000000-0000-4000-8000-00000000dead";
const byUser = new Map(Object.entries(fixtures).map(([name, f]) => [f.score.user_id, { name, ...f }]));

const withInternals = (view) => ({
  ...view,
  krs: 400 + view.aura * 4,
  pd: 0.02,
  band: "C",
  reason_codes: view.reason_codes.map((r) => ({ ...r, points: r.direction === "down" ? -20 : 20 })),
});

function signedOk(req, body) {
  const ts = Number(req.headers["x-kredo-timestamp"]);
  const given = String(req.headers["x-kredo-signature"] ?? "");
  if (req.headers["x-kredo-key-id"] !== "bff" || !ts || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const hash = createHash("sha256").update(body).digest("hex");
  const want = createHmac("sha256", SECRET).update(`${ts}\n${req.method}\n${req.url}\n${hash}`).digest("hex");
  return given.length === want.length && timingSafeEqual(Buffer.from(given), Buffer.from(want));
}

function send(res, status, data) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (!signedOk(req, body)) return send(res, 401, { detail: { code: "BAD_SIGNATURE" } });
    const url = new URL(req.url, "http://x");
    if (url.pathname.startsWith("/v1/ops/")) {
      const actor = opsActor(req);
      if (!actor) return send(res, 401, { detail: { code: "BAD_OPS_TOKEN" } });
      const rest = url.pathname.slice("/v1/ops/".length);
      if (rest === "monitoring") return send(res, 200, ops.monitoring);
      if (!RISK_ROLES.has(actor.role)) return send(res, 403, { detail: { code: "ROLE_NOT_ALLOWED" } });
      if (rest === "users") return send(res, 200, ops.users);
      const detail = rest.match(/^users\/([0-9a-f-]{36})$/)?.[1];
      if (detail) return ops.details[detail] ? send(res, 200, ops.details[detail]) : send(res, 404, { detail: { code: "NO_SCORE" } });
      if (rest.startsWith("overrides/") && rest.endsWith("/approve")) return send(res, 403, { detail: { code: "MAKER_CANNOT_DECIDE" } });
      return send(res, 404, { detail: "not found" });
    }
    const user = url.pathname.match(/^\/v1\/users\/([^/]+)\/score/)?.[1];
    if (user === DOWN_USER) return send(res, 500, { detail: "down" });

    if (req.method === "GET" && user && url.pathname.endsWith("/score")) {
      const f = byUser.get(user);
      return f ? send(res, 200, withInternals(f.score)) : send(res, 404, { detail: { code: "NO_SCORE" } });
    }
    if (req.method === "GET" && user && url.pathname.endsWith("/score/history")) {
      const f = byUser.get(user);
      return f ? send(res, 200, f.history) : send(res, 404, { detail: { code: "NO_SCORE" } });
    }
    if (req.method === "POST" && url.pathname === "/v1/score/simulate") {
      const { user_id } = JSON.parse(body);
      const sim = byUser.get(user_id)?.what_ifs[0]?.result;
      if (!sim) return send(res, 422, { detail: { code: "NOT_AN_OPEN_LOAN" } });
      return send(res, 200, { ...sim, current: { ...sim.current, krs: 600, band: "B" }, projected: { ...sim.projected, krs: 640, band: "B" } });
    }
    const preset = url.pathname.match(/^\/v1\/demo\/presets\/(\w+)$/)?.[1];
    if (req.method === "POST" && preset && fixtures[preset]) {
      return send(res, 201, { preset, user_id: fixtures[preset].score.user_id, events: 5 });
    }
    send(res, 404, { detail: "not found" });
  });
}).listen(PORT, "127.0.0.1");
