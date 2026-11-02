/**
 * Server-only: who the ops caller is, and the short-lived JWT the score service expects on ops calls (HS256, the
 * claims in services/score/app/api/ops_auth.py). The JWT secret never reaches the browser.
 *
 * DEMO ONLY: the role comes from the demo role switcher (a request header) and each role is one fake person, so a
 * risk analyst and a risk admin are different actors and maker-checker can be shown. Real ops sign-in (SSO) must
 * replace this before anyone real uses the console.
 */
import "server-only";
import { createHash, createHmac } from "node:crypto";
import { OPS_ROLES, type OpsRole } from "@/lib/mock-ops";

export const ROLE_HEADER = "x-kredo-ops-role";

export function opsRole(request: Request): OpsRole | null {
  const role = request.headers.get(ROLE_HEADER);
  return OPS_ROLES.some((r) => r.id === role) ? (role as OpsRole) : null;
}

/** A stable fake actor id per demo role (UUID-shaped, from a hash). */
export function demoActor(role: OpsRole): string {
  const h = createHash("sha256").update(`kredo-demo-ops-actor:${role}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const b64url = (data: string | Buffer) => Buffer.from(data).toString("base64url");

export function opsToken(role: OpsRole, ttlSeconds = 120): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ sub: demoActor(role), role, iat: now, exp: now + ttlSeconds, iss: "kredo-bff", aud: "kredo-score" }));
  const sig = createHmac("sha256", process.env.SCORE_OPS_JWT_SECRET ?? "").update(`${header}.${claims}`).digest("base64url");
  return `${header}.${claims}.${sig}`;
}
