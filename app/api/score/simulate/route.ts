import { z } from "zod";
import { allow } from "@/lib/score/rate-limit";
import { currentStudent, noStore, scoreApi, scoreApiConfigured } from "@/lib/score/server";
import type { ScoreRaw, SimulateRaw, WhatIfResponse } from "@/lib/score/types";
import { toWhatIfView } from "@/lib/score/view";

const Body = z.object({ daysEarly: z.number().int().min(0).max(7) });
const IST_OFFSET = "+05:30";

/**
 * What-if: "if you repay your open loan N days before its due date". Amount and loan come from the service, never
 * from the browser. Every option is projected to the same moment (the end of the grace day after the due date), so
 * the slider compares like with like. Rate-limited per student. Nothing is saved.
 */
export async function POST(request: Request) {
  if (!scoreApiConfigured()) return Response.json({ source: "mock" } satisfies WhatIfResponse, { headers: noStore });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "daysEarly must be 0 to 7" }, { status: 400, headers: noStore });
  const user = await currentStudent();
  if (!user) return Response.json({ source: "live", status: "no_loan", whatIf: null } satisfies WhatIfResponse, { headers: noStore });
  if (!allow(`simulate:${user}`)) return Response.json({ source: "live", status: "busy", whatIf: null } satisfies WhatIfResponse, { status: 429, headers: noStore });

  const score = await scoreApi<ScoreRaw>("GET", `/v1/users/${user}/score`);
  if (!score.ok) return Response.json({ source: "live", status: "unavailable", whatIf: null } satisfies WhatIfResponse, { status: 503, headers: noStore });
  const loan = score.data.limit_reco?.open_loans?.find((l) => l.dpd === 0);
  if (!loan || score.data.knockouts.length) return Response.json({ source: "live", status: "no_loan", whatIf: null } satisfies WhatIfResponse, { headers: noStore });

  const { daysEarly } = parsed.data;
  const due = new Date(`${loan.due_date}T12:00:00${IST_OFFSET}`);
  const soonest = Date.now() + 5 * 60_000;
  const at = new Date(Math.max(due.getTime() - daysEarly * 86_400_000, soonest));
  const horizon = new Date(`${loan.due_date}T23:59:00${IST_OFFSET}`);
  horizon.setUTCDate(horizon.getUTCDate() + 2);
  const res = await scoreApi<SimulateRaw>("POST", "/v1/score/simulate", {
    user_id: user,
    horizon: horizon.toISOString(),
    events: [
      { type: "repayment_received", occurred_at: at.toISOString(), payload: { loan_id: loan.loan_id, amount_paise: loan.outstanding_paise, paid_at: at.toISOString(), rail: "upi" } },
      { type: "loan_closed", occurred_at: new Date(at.getTime() + 60_000).toISOString(), payload: { loan_id: loan.loan_id, closure_type: "repaid" } },
    ],
  });
  if (!res.ok) return Response.json({ source: "live", status: "unavailable", whatIf: null } satisfies WhatIfResponse, { status: 503, headers: noStore });
  const whatIf = toWhatIfView(res.data, daysEarly, loan.outstanding_paise, loan.due_date);
  return Response.json({ source: "live", status: "ok", whatIf } satisfies WhatIfResponse, { headers: noStore });
}
