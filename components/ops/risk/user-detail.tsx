"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { GlassButton } from "@/components/glass";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useRisk, useRiskAction } from "@/lib/ops-risk/api";
import { EVENT_LABEL, FACTOR_LABEL, FACTOR_ORDER, pct, rupees, RULE_LABEL, TIER_LABEL } from "@/lib/ops-risk/labels";
import type { SimResult, Snapshot, UserDetail } from "@/lib/ops-risk/types";
import { waterfallSteps } from "@/lib/ops-risk/waterfall";
import { fmtDT, OpsPage } from "../common";
import { BandPill, Id, Loaded, MockBanner, Pill, RevealToggle, Section, Spinner } from "./parts";

const PointsWaterfall = dynamic(() => import("./charts").then((m) => m.PointsWaterfall), { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> });

const ID_KEYS = /(_id|_ids|digest)$/;

function Payload({ payload }: { payload: Record<string, unknown> }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-2">
      {Object.entries(payload).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => (
        <span key={k}>
          {k}:{" "}
          {ID_KEYS.test(k) ? (Array.isArray(v) ? v.map((x) => <Id key={String(x)} value={String(x)} className="mr-1" />) : <Id value={String(v)} />)
            : k.endsWith("_paise") ? <span className="text-ink">{rupees(Number(v))}</span> : <span className="text-ink">{String(v)}</span>}
        </span>
      ))}
    </span>
  );
}

function Header({ d }: { d: UserDetail }) {
  const s = d.latest;
  const items = [
    ["KRS", <span key="k" className="text-3xl font-extrabold tabular-nums">{s.krs}</span>],
    ["PD", <span key="p" className="text-xl font-extrabold tabular-nums">{pct(s.pd, 2)}</span>],
    ["Band", <span key="b" className="text-xl"><BandPill band={s.band} /></span>],
    ["Aura", <span key="a" className="text-xl font-extrabold tabular-nums">{s.aura} <span className="text-sm font-bold text-ink-2">{TIER_LABEL[s.tier]}</span></span>],
  ] as const;
  return (
    <Section title="Latest score" desc={`Scored ${fmtDT(s.as_of)}${s.evaluated_at !== s.as_of ? `, frozen at ${fmtDT(s.evaluated_at)}` : ""}. Scorecard ${s.versions.scorecard}, policy ${s.versions.policy}, config ${s.versions.config_hash.slice(0, 10)}.`}>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="risk-user-header">
        {items.map(([label, value]) => <div key={label} className="rounded-2xl bg-ink/[0.06] p-3"><dt className="text-xs font-bold text-ink-2">{label}</dt><dd className="mt-1">{value}</dd></div>)}
      </dl>
      {d.knockouts.length > 0 && (
        <ul className="mt-3 space-y-2">
          {d.knockouts.map((k) => <li key={k.code} className="rounded-2xl bg-danger-soft px-4 py-2.5 text-sm"><span className="font-mono text-xs font-bold text-bad-text">{k.code}</span> {k.message} <span className="text-ink-2">Way out: {k.way_out}</span></li>)}
        </ul>
      )}
    </Section>
  );
}

function Points({ s }: { s: Snapshot }) {
  const [table, setTable] = useState(false);
  return (
    <Section title="Points breakdown" desc="From the base of 500, through each factor, to the final KRS." action={<button type="button" onClick={() => setTable(!table)} className="text-xs font-bold text-info-text">{table ? "Show chart" : "Show as table"}</button>}>
      {table ? (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-ink-2"><th className="py-1">Step</th><th>Bin</th><th className="text-right">Points</th></tr></thead>
          <tbody>
            {FACTOR_ORDER.map((f) => s.points.factors[f] && <tr key={f} className="border-t border-ink/10"><td className="py-1">{FACTOR_LABEL[f]}</td><td className="font-mono text-xs">{s.points.factors[f].bin}</td><td className="text-right tabular-nums">{s.points.factors[f].points}</td></tr>)}
            {waterfallSteps(s.points, s.krs).filter((x) => x.name === "Clamp to 0–1000" || x.name === "Velocity cap").map((x) => <tr key={x.name} className="border-t border-ink/10"><td className="py-1">{x.name}</td><td /><td className="text-right tabular-nums">{x.label}</td></tr>)}
            <tr className="border-t border-ink/10 font-bold"><td className="py-1">KRS</td><td /><td className="text-right tabular-nums">{s.krs}</td></tr>
          </tbody>
        </table>
      ) : (
        <PointsWaterfall points={s.points} krs={s.krs} />
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {s.reason_codes.map((r) => <Pill key={r.code} tone={r.direction === "down" ? "bad" : r.direction === "up" ? "ok" : "neutral"}>{r.code} {r.points !== undefined ? `(${r.points > 0 ? "+" : ""}${r.points})` : ""}</Pill>)}
      </div>
    </Section>
  );
}

function Limit({ d }: { d: UserDetail }) {
  const r = d.latest.limit_reco;
  const rows: [string, React.ReactNode][] = [
    ["Level", r.level ?? "none"],
    ["Recommended limit", rupees(r.amount_paise)],
    ["Eligible", r.eligible ? "yes" : "no"],
    ["Action", r.action ?? "—"],
    ["Outstanding", rupees(r.outstanding_paise)],
    ["Max ticket", rupees(r.max_ticket_paise)],
    ["Clean cycles at level", d.ladder?.clean_cycles_at_level ?? r.cycles_at_level ?? 0],
    ["Frozen", r.frozen ? "yes" : "no"],
    ["Next", r.next ? `${r.next.level} (${rupees(r.next.amount_paise)}): ${r.next.cycles_needed} cycles${r.next.blockers.length ? `, blocked by ${r.next.blockers.join(", ")}` : ""}` : "top level"],
  ];
  return (
    <Section title="Limit and ladder" desc="A recommendation; the lending partner decides.">
      <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-ink/5 py-1"><dt className="text-ink-2">{k}</dt><dd className="text-right font-bold">{v}</dd></div>)}
      </dl>
      {r.held_for_review && <p className="mt-2"><Pill tone="warn">Held for review by a fraud alert</Pill></p>}
      {(r.open_loans ?? []).length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {r.open_loans!.map((l) => <li key={l.loan_id} className="flex flex-wrap justify-between gap-2">Open loan <Id value={l.loan_id} /> <span>due {l.due_date}</span><span className="font-bold">{rupees(l.outstanding_paise)}</span>{l.dpd > 0 && <Pill tone="bad">{l.dpd} DPD</Pill>}</li>)}
        </ul>
      )}
    </Section>
  );
}

function Features({ s }: { s: Snapshot }) {
  return (
    <Section title="Feature values">
      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {Object.entries(s.features).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-ink/5 py-1"><dt className="font-mono text-xs">{k}</dt><dd className="tabular-nums">{typeof v === "number" ? Number(v.toFixed(3)) : String(v)}</dd></div>
        ))}
      </dl>
    </Section>
  );
}

type OpenLoan = NonNullable<Snapshot["limit_reco"]["open_loans"]>[number];

/** Repay the whole loan `offset` days from its due date (never in the past), projected to just after both. */
function repayWhatIf(loan: OpenLoan, offset: number) {
  const due = new Date(`${loan.due_date}T12:00:00+05:30`);
  const at = new Date(Math.max(due.getTime() + offset * 86_400_000, Date.now() + 5 * 60_000));
  const horizon = new Date(`${loan.due_date}T23:59:00+05:30`);
  horizon.setUTCDate(horizon.getUTCDate() + Math.max(2, offset + 1));
  return {
    horizon: horizon.toISOString(),
    events: [
      { type: "repayment_received", occurred_at: at.toISOString(), payload: { loan_id: loan.loan_id, amount_paise: loan.outstanding_paise, paid_at: at.toISOString(), rail: "upi" } },
      { type: "loan_closed", occurred_at: new Date(at.getTime() + 60_000).toISOString(), payload: { loan_id: loan.loan_id, closure_type: "repaid" } },
    ],
  };
}

function Simulate({ d, live }: { d: UserDetail; live: boolean }) {
  const loans = d.latest.limit_reco.open_loans ?? [];
  const [loanId, setLoanId] = useState(loans[0]?.loan_id ?? "");
  const [offset, setOffset] = useState(-2);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<SimResult | string | null>(null);
  const act = useRiskAction();
  const loan = loans.find((l) => l.loan_id === loanId);

  async function run() {
    if (!loan) return;
    setBusy(true);
    const r = await act("POST", `users/${d.user_id}/simulate`, repayWhatIf(loan, offset));
    setBusy(false);
    setRes(r.ok ? (r.data as SimResult) : r.mock ? "Needs the score service." : `Could not simulate (${r.code ?? r.status}).`);
  }

  return (
    <Section title="Simulate" desc="Repay an open coin spend on a chosen day and see the projected score. Nothing is saved.">
      {loans.length === 0 ? <p className="text-sm text-ink-2">No open coin spend to simulate.</p> : (
        <div className="space-y-3 text-sm">
          {loans.length > 1 && (
            <select aria-label="Loan" value={loanId} onChange={(e) => setLoanId(e.target.value)} className="glass glass-soft min-h-10 rounded-2xl px-3">
              {loans.map((l) => <option key={l.loan_id} value={l.loan_id}>{l.loan_id.slice(-4)} due {l.due_date}</option>)}
            </select>
          )}
          <p className="font-bold">Repay {rupees(loan?.outstanding_paise)} {offset === 0 ? "on the due date" : offset < 0 ? `${-offset} days before the due date` : `${offset} days after the due date`}</p>
          <Slider min={-5} max={20} step={1} value={[offset]} onValueChange={(v) => setOffset(v[0])} aria-label="Days relative to the due date" />
          <GlassButton size="sm" onClick={run} disabled={busy || !live}>{busy ? <Spinner /> : null} Run</GlassButton>
          {!live && <p className="text-xs text-ink-2">Needs the score service.</p>}
          {typeof res === "string" && <p role="alert">{res}</p>}
          {res && typeof res === "object" && (
            <p role="status" className="rounded-2xl bg-ink/[0.06] px-4 py-3">
              By {fmtDT(res.at)}: KRS <span className="font-bold tabular-nums">{res.current.krs} → {res.projected.krs}</span>, band {res.current.band} → {res.projected.band}, Aura {res.current.aura} → {res.projected.aura}.
            </p>
          )}
        </div>
      )}
    </Section>
  );
}

function History({ d }: { d: UserDetail }) {
  return (
    <Section title="Snapshot history" desc="Newest first, with what changed since the snapshot before.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="text-left text-xs text-ink-2"><th className="py-1.5">When</th><th>KRS</th><th>Band</th><th>Aura</th><th>Level</th><th>What changed</th></tr></thead>
          <tbody>
            {d.snapshots.map((s) => (
              <tr key={s.id} className="border-t border-ink/10 align-top">
                <td className="py-1.5 text-xs">{fmtDT(s.as_of)}</td>
                <td className="font-bold tabular-nums">{s.krs}{s.diff.krs ? <span className={s.diff.krs > 0 ? "ml-1 text-xs text-ok-text" : "ml-1 text-xs text-bad-text"}>{s.diff.krs > 0 ? "+" : ""}{s.diff.krs}</span> : null}</td>
                <td><BandPill band={s.band} /></td>
                <td className="tabular-nums">{s.aura}</td>
                <td>{s.level ?? "—"}</td>
                <td className="text-xs">
                  {s.diff.band && <div>band {s.diff.band.join(" → ")}</div>}
                  {s.diff.level && <div>level {s.diff.level.map((x) => x ?? "none").join(" → ")}</div>}
                  {s.diff.knockouts && <div>{s.diff.knockouts.added.map((k) => `+${k}`).concat(s.diff.knockouts.lifted.map((k) => `−${k}`)).join(", ")}</div>}
                  {s.diff.factors && Object.entries(s.diff.factors).map(([f, [a, b]]) => <div key={f}>{FACTOR_LABEL[f] ?? f}: {a} → {b}</div>)}
                  {Object.keys(s.diff).length === 0 && <span className="text-ink-2">first snapshot</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Timeline({ d }: { d: UserDetail }) {
  return (
    <Section title="Events" desc="Newest first. Identifiers masked unless shown.">
      <ol className="space-y-2 border-l border-ink/15 pl-4">
        {d.events.map((e) => (
          <li key={e.event_id} className="relative">
            <span aria-hidden className="absolute -left-[1.2rem] top-1.5 size-2 rounded-full bg-ink/40" />
            <p className="text-sm font-bold">{EVENT_LABEL(e.type)} <span className="text-xs font-normal text-ink-2">{fmtDT(e.occurred_at)} · {e.source}</span></p>
            <Payload payload={e.payload} />
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function RiskUserDetail({ id }: { id: string }) {
  const result = useRisk<UserDetail>(`users/${id}`);
  return (
    <OpsPage title="Student risk detail" desc="Everything behind this student's score." actions={<><RevealToggle /><GlassButton asChild variant="secondary" size="sm"><Link href="/ops/risk/users">All users</Link></GlassButton></>}>
      <MockBanner source={result.source} />
      <Loaded result={result} need="risk analysts, risk admins, admins and fraud analysts">
        {(d) => (
          <div className="space-y-4">
            <p className="text-sm">User <Id value={d.user_id} /> {d.synthetic && <Pill>fake</Pill>}</p>
            <Header d={d} />
            <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
              <Points s={d.latest} />
              <div className="space-y-4">
                <Limit d={d} />
                <Simulate d={d} live={result.source === "live"} />
              </div>
            </div>
            {(d.alerts.length > 0 || d.overrides.length > 0) && (
              <Section title="Alerts and overrides">
                <ul className="space-y-1.5 text-sm">
                  {d.alerts.map((a) => <li key={a.id}><Link href={`/ops/risk/alerts?user_id=${d.user_id}`} className="font-bold text-info-text">{RULE_LABEL[a.rule] ?? a.rule}</Link> <Pill tone={a.severity === "high" ? "bad" : "warn"}>{a.severity}</Pill> <Pill>{a.status}</Pill></li>)}
                  {d.overrides.map((o) => <li key={o.id}>Override <span className="font-mono text-xs">{o.field}={o.value}</span> <Pill>{o.status}</Pill> until {fmtDT(o.expires_at)}</li>)}
                </ul>
              </Section>
            )}
            <History d={d} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Features s={d.latest} />
              <Timeline d={d} />
            </div>
          </div>
        )}
      </Loaded>
    </OpsPage>
  );
}
