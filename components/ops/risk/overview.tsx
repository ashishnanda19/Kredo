"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useRisk } from "@/lib/ops-risk/api";
import { pct, RULE_LABEL, TIER_LABEL } from "@/lib/ops-risk/labels";
import type { Band, Monitoring } from "@/lib/ops-risk/types";
import { cn } from "@/lib/utils";
import { Kpi, OpsPage } from "../common";
import { BandPill, Loaded, MockBanner, Pill, Section } from "./parts";

const AuraHistogram = dynamic(() => import("./charts").then((m) => m.AuraHistogram), { ssr: false, loading: () => <Skeleton className="h-48 w-full" /> });

const BANDS: Band[] = ["A", "B", "C", "D", "E"];

const ago = (min: number | null) => (min === null ? "—" : min < 90 ? `${Math.round(min)} min` : min < 60 * 48 ? `${Math.round(min / 60)} h` : `${Math.round(min / 1440)} days`);

/** One 100% bar, a segment per band (2px gaps), labelled where it fits; hover or focus shows the exact numbers. */
function BandBar({ bands, total }: { bands: Record<Band, number>; total: number }) {
  const [hover, setHover] = useState<Band | null>(null);
  const [table, setTable] = useState(false);
  const share = (b: Band) => (total ? bands[b] / total : 0);
  return (
    <div>
      <p className="mb-2 h-5 text-sm" aria-live="polite">
        {hover ? <><span className="font-bold">Band {hover}</span>: {bands[hover]} users ({pct(share(hover), 0)})</> : <span className="text-ink-2">Hover a band for its count.</span>}
      </p>
      <div role="img" aria-label={`Users by band: ${BANDS.map((b) => `${b} ${bands[b]}`).join(", ")}`} className="flex h-10 w-full gap-[2px] overflow-hidden rounded-[4px]">
        {BANDS.filter((b) => bands[b] > 0).map((b) => (
          <button
            key={b}
            type="button"
            aria-label={`Band ${b}: ${bands[b]} users`}
            onMouseEnter={() => setHover(b)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(b)}
            onBlur={() => setHover(null)}
            className="grid h-full min-w-[22px] place-items-center text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            style={{ width: `${share(b) * 100}%`, background: `var(--band-${b.toLowerCase()})`, color: b <= "C" ? "var(--band-e)" : "var(--band-a)" }}
          >
            {share(b) >= 0.06 ? b : ""}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {BANDS.map((b) => (
          <span key={b} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: `var(--band-${b.toLowerCase()})` }} />
            <span className="font-bold">{b}</span> <span className="text-ink-2 tabular-nums">{bands[b]}</span>
          </span>
        ))}
        <button type="button" onClick={() => setTable(!table)} className="ml-auto text-xs font-bold text-info-text underline-offset-4 hover:underline">{table ? "Hide table" : "Show as table"}</button>
      </div>
      {table && (
        <table className="mt-3 w-full text-sm">
          <thead><tr className="text-left text-xs text-ink-2"><th className="py-1">Band</th><th>Users</th><th>Share</th></tr></thead>
          <tbody>{BANDS.map((b) => <tr key={b} className="border-t border-ink/10"><td className="py-1 font-bold">{b}</td><td className="tabular-nums">{bands[b]}</td><td className="tabular-nums">{pct(share(b), 0)}</td></tr>)}</tbody>
        </table>
      )}
    </div>
  );
}

function Roll({ m }: { m: Monitoring }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-3">
      {m.dpd_roll.stages.map((s) => (
        <li key={s.to} className="rounded-2xl bg-ink/[0.06] p-3">
          <p className="text-xs font-bold text-ink-2">{s.from === "current" ? "Current" : `${s.from} DPD`} → {s.to} DPD</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{pct(s.rate)}</p>
          <p className="text-xs text-ink-2 tabular-nums">{s.reached} of {s.base} loans</p>
        </li>
      ))}
    </ol>
  );
}

const num = (x: number | null, d = 2) => (x === null ? "n/a" : x.toFixed(d));

/** PSI under 0.1 is stable, up to the alert level some shift, above it an alert (words, not colour alone). */
function psiTone(psi: number | null, alert: number): { word: string; tone: "ok" | "warn" | "bad" | "neutral" } {
  if (psi === null) return { word: "n/a", tone: "neutral" };
  return psi > alert ? { word: "alert", tone: "bad" } : psi > 0.1 ? { word: "some shift", tone: "warn" } : { word: "stable", tone: "ok" };
}

function ModelHealth({ m }: { m: Monitoring }) {
  const d = m.drift;
  const x = m.discrimination;
  return (
    <div className="grid gap-4 xl:grid-cols-3" data-testid="model-health">
      <Section title="KRS drift" desc={`Population stability index, month on month. Alert above ${d.alert_above}; needs ${d.min_users}+ students in both months.`}>
        {d.alert && <p role="alert" className="mb-2 rounded-xl bg-danger-soft px-3 py-2 text-sm font-bold text-bad-text">The latest PSI is above the alert level: the students being scored have changed. Review before trusting the bands.</p>}
        {d.points.length === 0 ? <p className="text-sm text-ink-2">Needs two months of scores.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-ink-2"><th className="py-1">Month</th><th>Students</th><th>PSI</th><th /></tr></thead>
            <tbody>
              {d.points.map((p) => {
                const t = psiTone(p.psi, d.alert_above);
                return <tr key={p.month} className="border-t border-ink/10"><td className="py-1">{p.month}</td><td className="tabular-nums">{p.users}</td><td className="font-bold tabular-nums">{num(p.psi, 3)}</td><td>{p.reliable ? <Pill tone={t.tone}>{t.word}</Pill> : <span className="text-[11px] text-ink-2">under {d.min_users} students</span>}</td></tr>;
              })}
            </tbody>
          </table>
        )}
      </Section>
      <Section title="Calibration" desc={`Predicted PD against the observed bad rate, by band at decision (label v${m.labels.version}: ${m.labels.bad_dpd}+ DPD within ${m.labels.window_days} days of the due date).`}>
        <table className="w-full text-sm" data-testid="calibration">
          <thead><tr className="text-left text-xs text-ink-2"><th className="py-1">Band</th><th>Loans</th><th>Predicted</th><th>Observed</th></tr></thead>
          <tbody>
            {m.calibration.map((c) => (
              <tr key={c.band} className={cn("border-t border-ink/10", !c.reliable && "text-ink-2")}>
                <td className="py-1"><BandPill band={c.band} /></td>
                <td className="tabular-nums">{c.loans}</td>
                <td className="tabular-nums">{pct(c.predicted_pd, 2)}</td>
                <td className="font-bold tabular-nums">{pct(c.observed_bad_rate)}{c.loans > 0 && !c.reliable && <span className="ml-1 text-[11px] font-normal">too few</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Separation" desc="How well KRS ranks good loans above bad ones, on labelled loans.">
        <dl className="space-y-2 text-sm" data-testid="separation">
          <div className="flex justify-between"><dt>Gini</dt><dd className="font-bold tabular-nums">{num(x.gini)}</dd></div>
          <div className="flex justify-between"><dt>KS</dt><dd className="font-bold tabular-nums">{num(x.ks)}</dd></div>
          <div className="flex justify-between"><dt>AUC</dt><dd className="font-bold tabular-nums">{num(x.auc)}</dd></div>
          <div className="flex justify-between text-xs text-ink-2"><dt>Labelled loans</dt><dd className="tabular-nums">{x.loans} ({x.bad} bad)</dd></div>
        </dl>
        <p className="mt-2 text-xs text-ink-2">0 means the score tells good from bad no better than chance, 1 means perfectly. Read it with the number of bad loans, which is small early on.</p>
      </Section>
    </div>
  );
}

function Readiness({ m }: { m: Monitoring }) {
  const v = m.v2_readiness;
  return (
    <div className="space-y-3" data-testid="v2-readiness">
      <div>
        <p className="text-sm"><span className="text-2xl font-extrabold tabular-nums">{v.labelled_loans.toLocaleString("en-IN")}</span> of {v.target_loans.toLocaleString("en-IN")} labelled loans</p>
        <Progress value={(v.labelled_loans / v.target_loans) * 100} label="Labelled loans toward the v2 target" className="mt-1.5" />
      </div>
      <div>
        <p className="text-sm"><span className="font-extrabold tabular-nums">{v.bad_loans}</span> of {v.target_bad} bad loans</p>
        <Progress value={(v.bad_loans / v.target_bad) * 100} label="Bad loans toward the v2 target" className="mt-1.5" />
      </div>
      <p className="text-xs text-ink-2">A loan is labelled 60 days after its due date: bad if it reached 30+ DPD or was settled, restructured or written off. v2 trains only after both targets are met; v1 is recalibrated quarterly until then.</p>
    </div>
  );
}

export function RiskOverview() {
  const result = useRisk<Monitoring>("monitoring");
  return (
    <OpsPage title="Risk overview" desc="Score health across every student with a score.">
      <MockBanner source={result.source} />
      <Loaded result={result} need="ops roles">
        {(m) => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Students scored" value={m.users.toLocaleString("en-IN")} hint={m.synthetic_users ? `${m.synthetic_users} synthetic` : undefined} />
              <Kpi label="Eligible now" value={pct(m.users ? m.eligible_now / m.users : null, 0)} hint={`${m.eligible_now} students`} />
              <Kpi label="Open fraud alerts" value={m.alerts.open} tone={m.alerts.open ? "warn" : undefined} />
              <Kpi label="Data freshness" value={ago(m.freshness_minutes)} hint="since the last event" tone={m.freshness_minutes !== null && m.freshness_minutes > 60 * 24 ? "warn" : undefined} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Band distribution" desc="Latest score per student.">
                <BandBar bands={m.bands} total={m.users} />
              </Section>
              <Section title="Aura histogram" desc="Students per 10-point Aura range.">
                <AuraHistogram data={m.aura_histogram} />
              </Section>
            </div>

            <ModelHealth m={m} />

            <Section title="DPD roll rates" desc="Of loans past their due date, the share that rolled from each bucket into the next.">
              <Roll m={m} />
            </Section>

            <div className="grid gap-4 lg:grid-cols-3">
              <Section title="Approval" desc="Prechecks and the partner's decisions.">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt>Prechecks eligible</dt><dd className="font-bold tabular-nums">{pct(m.approval.precheck_eligible_rate)} <span className="font-normal text-ink-2">of {m.approval.prechecks}</span></dd></div>
                  <div className="flex justify-between"><dt>Partner approved</dt><dd className="font-bold tabular-nums">{pct(m.approval.approval_rate)} <span className="font-normal text-ink-2">of {m.approval.outcomes}</span></dd></div>
                  {Object.entries(m.approval.agreement).map(([k, n]) => (
                    <div key={k} className="flex justify-between text-xs text-ink-2"><dt>{k.replaceAll("_", " ")}</dt><dd className="tabular-nums">{n}</dd></div>
                  ))}
                </dl>
              </Section>
              <Section title="Open alerts" action={<Link href="/ops/risk/alerts" className="inline-flex items-center gap-1 text-xs font-bold text-info-text">Queue <ArrowRight className="size-3.5" aria-hidden /></Link>}>
                {m.alerts.open === 0 ? <p className="text-sm text-ink-2">No open alerts.</p> : (
                  <ul className="space-y-1.5 text-sm">
                    {Object.entries(m.alerts.open_by_rule).map(([rule, n]) => (
                      <li key={rule} className="flex justify-between"><span>{RULE_LABEL[rule] ?? rule}</span><span className="font-bold tabular-nums">{n}</span></li>
                    ))}
                  </ul>
                )}
              </Section>
              <Section title="v2 readiness">
                <Readiness m={m} />
              </Section>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Tiers">
                <ul className="grid grid-cols-2 gap-1.5 text-sm">
                  {Object.entries(TIER_LABEL).map(([id, name]) => <li key={id} className="flex justify-between gap-2 rounded-xl bg-ink/[0.05] px-3 py-1.5"><span>{name}</span><span className="font-bold tabular-nums">{m.tiers[id] ?? 0}</span></li>)}
                </ul>
              </Section>
              <Section title="Knockouts">
                {Object.keys(m.knockouts).length === 0 ? <p className="text-sm text-ink-2">None.</p> : (
                  <ul className="space-y-1.5 text-sm">
                    {Object.entries(m.knockouts).map(([code, n]) => (
                      <li key={code} className="flex justify-between"><Link href={`/ops/risk/users?knockout=${code}`} className={cn("font-mono text-xs font-bold text-info-text")}>{code}</Link><span className="font-bold tabular-nums">{n}</span></li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </div>
        )}
      </Loaded>
    </OpsPage>
  );
}
