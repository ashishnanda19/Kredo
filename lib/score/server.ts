/**
 * Server-only access to the score service. Every call is HMAC-signed with the BFF key; the secret never reaches the
 * browser. With SCORE_API_URL unset the app runs on the mock adapter instead (the current demo keeps working).
 */
import "server-only";
import { createHash, createHmac } from "node:crypto";
import { cookies } from "next/headers";

export const STUDENT_COOKIE = "kredo_uid";
const TIMEOUT_MS = 3000;

export const scoreApiConfigured = () => Boolean(process.env.SCORE_API_URL);

function signedHeaders(method: string, pathWithQuery: string, body: string): Record<string, string> {
  const keyId = process.env.SCORE_API_KEY_ID ?? "bff";
  const secret = process.env.SCORE_API_SECRET ?? "";
  const ts = Math.floor(Date.now() / 1000);
  const bodyHash = createHash("sha256").update(body).digest("hex");
  const signature = createHmac("sha256", secret).update(`${ts}\n${method}\n${pathWithQuery}\n${bodyHash}`).digest("hex");
  return { "x-kredo-key-id": keyId, "x-kredo-timestamp": String(ts), "x-kredo-signature": signature, "content-type": "application/json" };
}

export type ScoreCall<T> = { ok: true; data: T } | { ok: false; status: number };

/** A signed call that returns the status and JSON body as they came (status 0: unreachable or timed out). */
export async function scoreFetch(method: "GET" | "POST" | "PATCH", pathWithQuery: string, body?: unknown, headers: Record<string, string> = {}): Promise<{ status: number; data: unknown }> {
  const raw = body === undefined ? "" : JSON.stringify(body);
  try {
    const res = await fetch(`${process.env.SCORE_API_URL}${pathWithQuery}`, {
      method,
      headers: { ...signedHeaders(method, pathWithQuery, raw), ...headers },
      body: body === undefined ? undefined : raw,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { status: res.status, data: await res.json().catch(() => null) };
  } catch {
    return { status: 0, data: null };
  }
}

/** status 0 means the service could not be reached (down, timeout). */
export async function scoreApi<T>(method: "GET" | "POST", pathWithQuery: string, body?: unknown): Promise<ScoreCall<T>> {
  const res = await scoreFetch(method, pathWithQuery, body);
  return res.status >= 200 && res.status < 300 ? { ok: true, data: res.data as T } : { ok: false, status: res.status };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Which student is asking. DEMO ONLY: the web app has no real auth yet, so this reads the id the demo controls set
 * (an httpOnly cookie) or SCORE_DEMO_USER_ID. Real auth must replace this before any real student uses it.
 */
export async function currentStudent(): Promise<string | null> {
  const fromCookie = (await cookies()).get(STUDENT_COOKIE)?.value;
  const id = fromCookie ?? process.env.SCORE_DEMO_USER_ID ?? null;
  return id && UUID.test(id) ? id : null;
}

export const noStore = { "cache-control": "no-store" };
