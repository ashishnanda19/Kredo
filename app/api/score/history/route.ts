import type { NextRequest } from "next/server";
import { currentStudent, noStore, scoreApi, scoreApiConfigured } from "@/lib/score/server";
import type { HistoryRaw, HistoryResponse } from "@/lib/score/types";
import { toHistoryView } from "@/lib/score/view";

const RANGES = new Set([30, 90, 180]);

/** Daily Aura for the timeline: ?days=30|90|180. */
export async function GET(request: NextRequest) {
  if (!scoreApiConfigured()) return Response.json({ source: "mock" } satisfies HistoryResponse, { headers: noStore });
  const days = Number(request.nextUrl.searchParams.get("days") ?? 90);
  if (!RANGES.has(days)) return Response.json({ error: "days must be 30, 90 or 180" }, { status: 400, headers: noStore });
  const user = await currentStudent();
  if (!user) return Response.json({ source: "live", status: "no_score", history: null } satisfies HistoryResponse, { headers: noStore });

  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const ist = (d: Date) => new Date(d.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
  const res = await scoreApi<HistoryRaw>("GET", `/v1/users/${user}/score/history?from=${ist(from)}&to=${ist(to)}`);
  if (res.ok) return Response.json({ source: "live", status: "ok", history: toHistoryView(res.data) } satisfies HistoryResponse, { headers: noStore });
  if (res.status === 404) return Response.json({ source: "live", status: "no_score", history: null } satisfies HistoryResponse, { headers: noStore });
  return Response.json({ source: "live", status: "unavailable", history: null } satisfies HistoryResponse, { status: 503, headers: noStore });
}
