import { cookies } from "next/headers";
import { z } from "zod";
import { DEMO_ENABLED } from "@/lib/demo-flag";
import { noStore, scoreApi, scoreApiConfigured, STUDENT_COOKIE } from "@/lib/score/server";

const PRESETS = ["fresh_spawn", "locked_in_streak", "late_payer_recovering", "knockout_overdue_35", "collusion_alert", "held_for_review", "consent_frozen"] as const;
const Body = z.object({ preset: z.enum(PRESETS) });

/**
 * Demo controls only: asks the score service for a new fake student with this preset's history, then makes it "you"
 * (an httpOnly cookie). Off in a production build unless NEXT_PUBLIC_DEMO_CONTROLS=true. In mock mode the browser switches fixtures instead.
 */
export async function POST(request: Request) {
  if (!DEMO_ENABLED) return new Response(null, { status: 404 });
  if (!scoreApiConfigured()) return Response.json({ source: "mock" }, { headers: noStore });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "unknown preset" }, { status: 400, headers: noStore });

  const res = await scoreApi<{ user_id: string }>("POST", `/v1/demo/presets/${parsed.data.preset}`, {});
  if (!res.ok) return Response.json({ source: "live", ok: false }, { status: 503, headers: noStore });
  (await cookies()).set(STUDENT_COOKIE, res.data.user_id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return Response.json({ source: "live", ok: true }, { headers: noStore });
}
