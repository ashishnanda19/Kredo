"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GlassButton } from "@/components/glass";
import { GlassSelect } from "@/components/forms/select";
import { useRisk } from "@/lib/ops-risk/api";
import { KNOCKOUT_CODES, pct, TIER_LABEL } from "@/lib/ops-risk/labels";
import type { UserPage } from "@/lib/ops-risk/types";
import { OpsPage } from "../common";
import { BandPill, Id, Loaded, MockBanner, Pill, RevealToggle } from "./parts";

const PAGE = 25;

export function RiskUsers() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState(params.get("q") ?? "");
  const offset = Number(params.get("offset") ?? 0);

  const query = new URLSearchParams();
  for (const k of ["band", "tier", "knockout", "q", "sort"]) if (params.get(k)) query.set(k, params.get(k)!);
  query.set("limit", String(PAGE));
  query.set("offset", String(offset));
  const result = useRisk<UserPage>(`users?${query}`);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("offset");
    router.replace(`${path}?${next}`);
  }

  return (
    <OpsPage title="Risk users" desc="Latest score per student, riskiest first." actions={<RevealToggle />}>
      <MockBanner source={result.source} />
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-xs font-bold">Band
          <GlassSelect aria-label="Band" value={params.get("band") ?? ""} onChange={(e) => setParam("band", e.target.value)} className="mt-1 min-w-24">
            <option value="">All</option>{["A", "B", "C", "D", "E"].map((b) => <option key={b}>{b}</option>)}
          </GlassSelect>
        </label>
        <label className="text-xs font-bold">Tier
          <GlassSelect aria-label="Tier" value={params.get("tier") ?? ""} onChange={(e) => setParam("tier", e.target.value)} className="mt-1 min-w-36">
            <option value="">All</option>{Object.entries(TIER_LABEL).map(([id, n]) => <option key={id} value={id}>{n}</option>)}
          </GlassSelect>
        </label>
        <label className="text-xs font-bold">Knockout
          <GlassSelect aria-label="Knockout" value={params.get("knockout") ?? ""} onChange={(e) => setParam("knockout", e.target.value)} className="mt-1 min-w-40">
            <option value="">Any</option>{KNOCKOUT_CODES.map((k) => <option key={k}>{k}</option>)}
          </GlassSelect>
        </label>
        <label className="text-xs font-bold">Sort
          <GlassSelect aria-label="Sort" value={params.get("sort") ?? "riskiest"} onChange={(e) => setParam("sort", e.target.value === "riskiest" ? "" : e.target.value)} className="mt-1 min-w-32">
            <option value="riskiest">Riskiest first</option><option value="recent">Recently scored</option>
          </GlassSelect>
        </label>
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); setParam("q", q.trim().toLowerCase()); }}>
          <label className="text-xs font-bold">User id (part)
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 3d10" pattern="[0-9a-fA-F-]{4,36}" className="glass glass-soft mt-1 block min-h-11 w-40 rounded-2xl px-3 text-sm font-normal" />
          </label>
          <GlassButton type="submit" variant="secondary">Search</GlassButton>
        </form>
      </div>

      <Loaded result={result} need="risk analysts, risk admins, admins and fraud analysts">
        {(page) => (
          <>
            <div className="glass overflow-x-auto rounded-[20px]">
              <table className="w-full min-w-[760px] text-sm">
                <caption className="sr-only">Students by risk</caption>
                <thead>
                  <tr className="text-left text-xs text-ink-2">
                    {["User", "KRS", "PD", "Band", "Aura", "Tier", "Level", "Knockouts", "Alerts", "Scored"].map((h) => <th key={h} scope="col" className="px-3 py-2.5 font-bold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {page.rows.length === 0 && <tr><td colSpan={10} className="px-3 py-6 text-center text-ink-2">No students match these filters.</td></tr>}
                  {page.rows.map((r) => (
                    <tr key={r.user_id} className="border-t border-ink/10 hover:bg-ink/[0.04]">
                      <td className="px-3 py-2"><Link href={`/ops/risk/users/${r.user_id}`} className="text-info-text underline-offset-4 hover:underline"><Id value={r.user_id} /></Link>{r.synthetic && <span className="ml-1.5"><Pill>fake</Pill></span>}</td>
                      <td className="px-3 py-2 font-bold tabular-nums">{r.krs}</td>
                      <td className="px-3 py-2 tabular-nums">{pct(r.pd, 2)}</td>
                      <td className="px-3 py-2"><BandPill band={r.band} /></td>
                      <td className="px-3 py-2 tabular-nums">{r.aura}</td>
                      <td className="px-3 py-2">{TIER_LABEL[r.tier] ?? r.tier}</td>
                      <td className="px-3 py-2">{r.level ?? "—"}{r.held_for_review && <span className="ml-1"><Pill tone="warn">held</Pill></span>}</td>
                      <td className="px-3 py-2">{r.knockouts.length ? r.knockouts.map((k) => <Pill key={k} tone="bad">{k}</Pill>) : "—"}</td>
                      <td className="px-3 py-2 tabular-nums">{r.open_alerts ? <Pill tone="warn">{r.open_alerts} open</Pill> : "—"}</td>
                      <td className="px-3 py-2 text-xs text-ink-2">{new Date(r.as_of).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-ink-2 tabular-nums">{page.total === 0 ? "0" : `${offset + 1}–${Math.min(offset + PAGE, page.total)}`} of {page.total}</span>
              <div className="flex gap-2">
                <GlassButton variant="secondary" size="sm" disabled={offset === 0} onClick={() => setParam("offset", String(Math.max(0, offset - PAGE)))}>Previous</GlassButton>
                <GlassButton variant="secondary" size="sm" disabled={offset + PAGE >= page.total} onClick={() => { const n = new URLSearchParams(params); n.set("offset", String(offset + PAGE)); router.replace(`${path}?${n}`); }}>Next</GlassButton>
              </div>
            </div>
          </>
        )}
      </Loaded>
    </OpsPage>
  );
}
