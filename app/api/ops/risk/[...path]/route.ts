import type { NextRequest } from "next/server";
import { opsRole, opsToken } from "@/lib/score/ops-server";
import { noStore, scoreApiConfigured, scoreFetch } from "@/lib/score/server";

/**
 * The ops risk console's BFF: forwards an allowlisted set of calls to the score service's /v1/ops API, signed, with
 * a short-lived ops JWT for the caller's role. The service enforces every role rule; this only refuses anything not
 * on the list. With SCORE_API_URL unset it answers {source: "mock"} and the console reads its fixtures.
 */
const ID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const ALLOWED: Record<"GET" | "POST" | "PATCH", RegExp[]> = {
  GET: [/^users$/, new RegExp(`^users/${ID}$`), /^monitoring$/, /^overrides$/, /^fraud-alerts$/, new RegExp(`^fraud-alerts/${ID}$`), new RegExp(`^vendors/${ID}/fraud-signals$`), /^config$/, /^audit$/],
  POST: [/^overrides$/, new RegExp(`^overrides/${ID}/(approve|reject|revoke)$`), /^config\/dry-run$/, new RegExp(`^users/${ID}/simulate$`)],
  PATCH: [new RegExp(`^fraud-alerts/${ID}$`)],
};

async function forward(request: NextRequest, ctx: RouteContext<"/api/ops/risk/[...path]">, method: "GET" | "POST" | "PATCH") {
  if (!scoreApiConfigured()) return Response.json({ source: "mock" }, { headers: noStore });
  const role = opsRole(request);
  if (!role) return Response.json({ detail: { code: "NO_OPS_ROLE" } }, { status: 401, headers: noStore });
  const rest = (await ctx.params).path.join("/");
  if (!ALLOWED[method].some((re) => re.test(rest))) return Response.json({ detail: { code: "NOT_ALLOWED" } }, { status: 404, headers: noStore });

  const query = request.nextUrl.search;
  const body = method === "GET" ? undefined : await request.json().catch(() => ({}));
  const res = await scoreFetch(method, `/v1/ops/${rest}${query}`, body, { authorization: `Bearer ${opsToken(role)}` });
  if (res.status === 0) return Response.json({ detail: { code: "SERVICE_UNAVAILABLE" } }, { status: 503, headers: noStore });
  return Response.json(res.data, { status: res.status, headers: noStore });
}

export const GET = (r: NextRequest, c: RouteContext<"/api/ops/risk/[...path]">) => forward(r, c, "GET");
export const POST = (r: NextRequest, c: RouteContext<"/api/ops/risk/[...path]">) => forward(r, c, "POST");
export const PATCH = (r: NextRequest, c: RouteContext<"/api/ops/risk/[...path]">) => forward(r, c, "PATCH");
