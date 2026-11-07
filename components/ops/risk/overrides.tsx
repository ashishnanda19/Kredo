"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassButton, GlassCard } from "@/components/glass";
import { GlassSelect } from "@/components/forms/select";
import { refreshRisk, useRisk, useRiskAction } from "@/lib/ops-risk/api";
import { rupees } from "@/lib/ops-risk/labels";
import type { AuditEntry, Override } from "@/lib/ops-risk/types";
import { fmtDT, Guarded, OpsPage, useRole } from "../common";
import { Id, Loaded, MockBanner, Pill, RevealToggle, Section, Spinner } from "./parts";

const FIELD_LABEL: Record<Override["field"], string> = { ladder_level: "Set ladder level", limit_cap_paise: "Cap the limit", pause_new_loans: "Pause new loans" };
const ERRORS: Record<string, string> = {
  MAKER_CANNOT_DECIDE: "You proposed this override, so a different risk admin must decide it.",
  UNKNOWN_USER: "No student with that id.",
  BAD_EXPIRY: "Expiry must be in the future and at most 90 days away.",
  BAD_OVERRIDE_VALUE: "That value is not allowed for this field.",
  NOT_PENDING: "Already decided.",
  ALREADY_EXPIRED: "This override has already expired.",
};

const describe = (o: Pick<Override, "field" | "value">) =>
  o.field === "ladder_level" ? `Level L${o.value}` : o.field === "limit_cap_paise" ? `Cap at ${rupees(o.value)}` : "Pause new loans";

function Propose({ live }: { live: boolean }) {
  const { can } = useRole();
  const act = useRiskAction();
  const [form, setForm] = useState({ user_id: "", field: "limit_cap_paise" as Override["field"], value: "500", reason: "", days: 14 });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    const value = form.field === "pause_new_loans" ? 1 : form.field === "limit_cap_paise" ? Math.round(Number(form.value) * 100) : Number(form.value);
    const r = await act("POST", "overrides", {
      user_id: form.user_id.trim(), field: form.field, value, reason: form.reason.trim(),
      expires_at: new Date(Date.now() + form.days * 86_400_000).toISOString(),
    });
    setBusy(false);
    if (r.ok) {
      setMsg("Proposed. A different risk admin must approve it.");
      setForm({ ...form, user_id: "", reason: "" });
      refreshRisk();
    } else setMsg(r.mock ? "Actions need the score service." : ERRORS[r.code ?? ""] ?? `Not saved (${r.code ?? r.status}).`);
  }

  return (
    <Section title="Propose an override" desc="Changes only the limit recommendation, never KRS, band or Aura. Expires on its own.">
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <label className="text-xs font-bold">Student id
          <input required value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} pattern="[0-9a-fA-F-]{36}" className="glass glass-soft mt-1 block min-h-11 w-full rounded-2xl px-3 font-mono text-sm font-normal" />
        </label>
        <label className="text-xs font-bold">Change
          <GlassSelect value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value as Override["field"] })} className="mt-1 w-full">
            {Object.entries(FIELD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </GlassSelect>
        </label>
        {form.field !== "pause_new_loans" && (
          <label className="text-xs font-bold">{form.field === "ladder_level" ? "Level (0 to 6)" : "Cap (₹)"}
            <input required type="number" min={0} max={form.field === "ladder_level" ? 6 : 100000} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="glass glass-soft mt-1 block min-h-11 w-full rounded-2xl px-3 text-sm font-normal" />
          </label>
        )}
        <label className="text-xs font-bold">Expires in (days, at most 90)
          <input required type="number" min={1} max={90} value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} className="glass glass-soft mt-1 block min-h-11 w-full rounded-2xl px-3 text-sm font-normal" />
        </label>
        <label className="text-xs font-bold sm:col-span-2">Reason (at least 10 characters; no personal data)
          <textarea required minLength={10} maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="glass glass-soft mt-1 block min-h-20 w-full rounded-2xl p-3 text-sm font-normal" />
        </label>
        <div className="sm:col-span-2">
          <Guarded allowed={can("overridesCreate") && live} why={live ? "Risk analysts and risk admins propose overrides." : "Actions need the score service."}>
            <GlassButton type="submit" disabled={busy}>{busy && <Spinner />} Propose</GlassButton>
          </Guarded>
          {msg && <p role="status" className="mt-2 text-sm">{msg}</p>}
        </div>
      </form>
    </Section>
  );
}

function Trail({ id }: { id: string }) {
  const r = useRisk<AuditEntry[]>(`audit?target=override:${id}`);
  if (!r.data) return null;
  return (
    <ol className="mt-2 space-y-1 text-xs">
      {r.data.map((e) => <li key={e.id}><span className="font-bold">{e.action}</span> by <Id value={e.actor_id} /> {fmtDT(e.at)}</li>)}
    </ol>
  );
}

function Row({ o, live }: { o: Override; live: boolean }) {
  const { can } = useRole();
  const act = useRiskAction();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [trail, setTrail] = useState(false);

  async function decide(action: "approve" | "reject" | "revoke") {
    setBusy(true);
    const r = await act("POST", `overrides/${o.id}/${action}`, {});
    setBusy(false);
    if (r.ok) refreshRisk();
    else setMsg(r.mock ? "Actions need the score service." : ERRORS[r.code ?? ""] ?? `Not done (${r.code ?? r.status}).`);
  }
  const why = live ? "Only a risk admin decides, and never the person who proposed it." : "Actions need the score service.";

  return (
    <GlassCard radius="lg" className="p-4" data-testid="risk-override">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-extrabold">{describe(o)}</span>
        <Pill tone={o.status === "pending" ? "warn" : o.status === "approved" ? "ok" : "neutral"}>{o.status}</Pill>
        <span className="text-xs text-ink-2">for <Link href={`/ops/risk/users/${o.user_id}`} className="text-info-text"><Id value={o.user_id} /></Link> · expires {fmtDT(o.expires_at)}</span>
      </div>
      <p className="mt-1 text-sm">{o.reason}</p>
      <p className="mt-1 text-xs text-ink-2">Proposed by <Id value={o.maker_id} />{o.created_at && ` on ${fmtDT(o.created_at)}`}{o.checker_id && <> · decided by <Id value={o.checker_id} /></>}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {o.status === "pending" && (["approve", "reject"] as const).map((a) => (
          <Guarded key={a} allowed={can("overridesDecide") && live} why={why}>
            <GlassButton size="sm" variant={a === "approve" ? "default" : "secondary"} disabled={busy} onClick={() => decide(a)}>{a === "approve" ? "Approve" : "Reject"}</GlassButton>
          </Guarded>
        ))}
        {o.status === "approved" && (
          <Guarded allowed={can("overridesDecide") && live} why={live ? "Only a risk admin revokes." : "Actions need the score service."}>
            <GlassButton size="sm" variant="secondary" disabled={busy} onClick={() => decide("revoke")}>Revoke</GlassButton>
          </Guarded>
        )}
        <button type="button" onClick={() => setTrail(!trail)} className="text-xs font-bold text-info-text">{trail ? "Hide audit trail" : "Audit trail"}</button>
      </div>
      {msg && <p role="alert" className="mt-2 text-sm text-bad-text">{msg}</p>}
      {trail && <Trail id={o.id} />}
    </GlassCard>
  );
}

export function RiskOverrides() {
  const [status, setStatus] = useState("pending");
  const result = useRisk<Override[]>(`overrides${status ? `?status=${status}` : ""}`);
  const live = result.source === "live";
  return (
    <OpsPage title="Overrides" desc="Maker-checker: a risk analyst proposes, a different risk admin approves." actions={<RevealToggle />}>
      <MockBanner source={result.source} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div>
          <GlassSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="mb-3 w-auto min-w-40">
            <option value="">All</option>{["pending", "approved", "rejected", "revoked"].map((s) => <option key={s} value={s}>{s}</option>)}
          </GlassSelect>
          <Loaded result={result} need="risk analysts, risk admins and admins">
            {(rows) => rows.length === 0 ? <GlassCard radius="lg" className="p-6 text-sm text-ink-2">No {status || ""} overrides.</GlassCard> : (
              <div className="space-y-3">{rows.map((o) => <Row key={o.id} o={o} live={live} />)}</div>
            )}
          </Loaded>
        </div>
        <Propose live={live} />
      </div>
    </OpsPage>
  );
}
