import { currentStudent, noStore, scoreApi, scoreApiConfigured } from "@/lib/score/server";
import type { MeResponse, ScoreRaw } from "@/lib/score/types";
import { toAuraView } from "@/lib/score/view";

/** The student's Aura, mapped to the student view (krs, pd, band and points never leave the server). */
export async function GET() {
  if (!scoreApiConfigured()) return Response.json({ source: "mock" } satisfies MeResponse, { headers: noStore });
  const user = await currentStudent();
  if (!user) return Response.json({ source: "live", status: "no_score", view: null } satisfies MeResponse, { headers: noStore });

  const res = await scoreApi<ScoreRaw>("GET", `/v1/users/${user}/score`);
  if (res.ok) return Response.json({ source: "live", status: "ok", view: toAuraView(res.data) } satisfies MeResponse, { headers: noStore });
  if (res.status === 404) return Response.json({ source: "live", status: "no_score", view: null } satisfies MeResponse, { headers: noStore });
  return Response.json({ source: "live", status: "unavailable", view: null } satisfies MeResponse, { status: 503, headers: noStore });
}
