"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { GlassSelect } from "@/components/forms/select";
import { refreshRisk, useRisk, useRiskAction } from "@/lib/ops-risk/api";
import { rupees, RULE_LABEL, SIGNAL_LABEL } from "@/lib/ops-risk/labels";
import type { Alert, AuditEntry, VendorSignals } from "@/lib/ops-risk/types";
import type { Capability } from "@/lib/ops-permissions";
import { fmtDT, Guarded, OpsPage, useRole } from "../common";
import { Id, Loaded, MockBanner, Pill, RevealToggle, Section, Spinner } from "./parts";

const ID_KEY = /(_id|^user|^key)$/;

/** Evidence is ids, amounts, times and counts: lists become small tables, ids stay masked. */
function Value({ k, v }: { k: string; v: unknown }) {
  if (v === null || v === undefined) return <>—</>;
  if (Array.isArray(v)) {
    if (v.length && typeof v[0] === "object") {
      const cols = Object.keys(v[0] as object);
      return (
        <table className="mt-1 w-full text-xs">
          <thead><tr className="text-left text-ink-2">{cols.map((c) => <th key={c} className="pr-3 font-semibold">{c.replace(/_paise$/, "").replaceAll("_", " ")}</th>)}</tr></thead>
          <tbody>{v.map((row, i) => <tr key={i} className="border-t border-ink/5">{cols.map((c) => <td key={c} className="pr-3 py-0.5"><Value k={c} v={(row as Record<string, unknown>)[c]} /></td>)}</tr>)}</tbody>
        </table>
      );
    }
    return <>{v.map((x, i) => <span key={i} className="mr-1.5">{k.includes("account") ? <Id value={String(x)} /> : String(x)}</span>)}</>;
  }
  if (typeof v === "object") return <span className="block pl-3">{Object.entries(v as object).map(([kk, vv]) => <span key={kk} className="mr-3">{kk.replace(/_paise$/, "").replaceAll("_", " ")}: <Value k={kk} v={vv} /></span>)}</span>;
  if (ID_KEY.test(k)) return <Id value={String(v)} />;
  if (k.endsWith("_paise")) return <span className="tabular-nums">{rupees(Number(v))}</span>;
  if (k === "at" || k.endsWith("_at")) return <>{fmtDT(String(v))}</>;
  return <>{String(v)}</>;
}

function Evidence({ a }: { a: Alert }) {
  return (
    <ul className="mt-3 space-y-2">
      {a.evidence.instances.map((i) => (
        <li key={i.key} className="rounded-2xl bg-ink/[0.05] p-3 text-xs">
          <p className="text-sm font-bold">{SIGNAL_LABEL[i.signal] ?? i.signal} <span className="font-normal text-ink-2">{fmtDT(i.at)}</span></p>
          <div className="mt-1 space-y-1">
            {Object.entries(i).filter(([k]) => !["key", "at", "signal"].includes(k)).map(([k, v]) => <div key={k}><span className="text-ink-2">{k.replace(/_paise$/, "").replaceAll("_", " ")}:</span> <Value k={k} v={v} /></div>)}
          </div>
        </li>
      ))}
    </ul>
  );
}

const ACTIONS: { action: string; label: string; status: Alert["status"]; cap: Capability; why: string; needsFlag?: boolean }[] = [
  { action: "confirm", label: "Confirm", status: "open", cap: "alertsDecide", why: "Fraud analysts and risk admins confirm alerts." },
  { action: "dismiss", label: "Dismiss", status: "open", cap: "alertsDecide", why: "Fraud analysts and risk admins dismiss alerts." },
  { action: "request_lift", label: "Ask to lift the knockout", status: "confirmed", cap: "alertsLiftRequest", why: "Fraud analysts and risk staff can ask for a lift.", needsFlag: true },
  { action: "approve_lift", label: "Approve lift", status: "lift_pending", cap: "alertsLiftDecide", why: "Only a risk admin, and never the person who asked, approves a lift." },
  { action: "reject_lift", label: "Reject lift", status: "lift_pending", cap: "alertsLiftDecide", why: "Only a risk admin, and never the person who asked, rejects a lift." },
];

const ERRORS: Record<string, string> = {
  MAKER_CANNOT_DECIDE: "The person who asked for the lift cannot decide it. A different risk admin must.",
  ROLE_NOT_ALLOWED: "Your role cannot do this.",
  NOTHING_TO_LIFT: "This alert set no knockout, so there is nothing to lift.",
};

function Actions({ a, live }: { a: Alert; live: boolean }) {
  const { can } = useRole();
  const act = useRiskAction();
  const [open, setOpen] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const options = ACTIONS.filter((x) => x.status === a.status && (!x.needsFlag || a.flag));
  if (!options.length) return null;

  async function submit() {
    setBusy(true);
    const r = await act("PATCH", `fraud-alerts/${a.id}`, { action: open, reason: reason.trim() });
    setBusy(false);
    if (r.ok) {
      setOpen(null);
      setReason("");
      setMsg(null);
      refreshRisk();
    } else setMsg(r.mock ? "Actions need the score service." : ERRORS[r.code ?? ""] ?? `Not done (${r.code ?? r.status}).`);
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {options.map((x) => (
          <Guarded key={x.action} allowed={can(x.cap) && live} why={live ? x.why : "Actions need the score service."}>
            <GlassButton size="sm" variant={x.action === "confirm" || x.action === "approve_lift" ? "default" : "secondary"} onClick={() => { setOpen(x.action); setMsg(null); }}>{x.label}</GlassButton>
          </Guarded>
        ))}
      </div>
      {open && (
        <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <label className="block text-xs font-bold" htmlFor={`reason-${a.id}`}>Reason (kept in the audit log; no personal data)</label>
          <textarea id={`reason-${a.id}`} value={reason} onChange={(e) => setReason(e.target.value)} minLength={10} maxLength={500} required className="glass glass-soft min-h-20 w-full rounded-2xl p-3 text-sm" />
          <div className="flex gap-2">
            <GlassButton size="sm" type="submit" disabled={busy || reason.trim().length < 10}>{busy && <Spinner />} {ACTIONS.find((x) => x.action === open)?.label}</GlassButton>
            <GlassButton size="sm" variant="secondary" type="button" onClick={() => setOpen(null)}>Cancel</GlassButton>
          </div>
        </form>
      )}
      {msg && <p role="alert" className="mt-2 text-sm text-bad-text">{msg}</p>}
    </div>
  );
}

function Trail({ id }: { id: string }) {
  const r = useRisk<AuditEntry[]>(`audit?target=fraud_alert:${id}`);
  if (!r.data) return null;
  if (!r.data.length) return <p className="mt-2 text-xs text-ink-2">No actions yet.</p>;
  return (
    <ol className="mt-2 space-y-1 text-xs">
      {r.data.map((e) => <li key={e.id}><span className="font-bold">{e.action}</span> by <Id value={e.actor_id} /> {fmtDT(e.at)}{typeof e.after?.note === "string" && <span className="text-ink-2">: {e.after.note}</span>}</li>)}
    </ol>
  );
}

function AlertCard({ a, live, onVendor }: { a: Alert; live: boolean; onVendor: (id: string) => void }) {
  const [trail, setTrail] = useState(false);
  return (
    <GlassCard radius="lg" className="p-4" data-testid="risk-alert">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-extrabold">{RULE_LABEL[a.rule] ?? a.rule}</h3>
        <Pill tone={a.severity === "high" ? "bad" : a.severity === "medium" ? "warn" : "neutral"}>{a.severity}</Pill>
        <Pill tone={a.status === "open" ? "warn" : a.status === "dismissed" ? "neutral" : "bad"}>{a.status.replace("_", " ")}</Pill>
        {a.hold && a.status === "open" && <Pill tone="warn">new coin spends held</Pill>}
        {a.flag && <Pill tone="bad">{a.flag}</Pill>}
        <span className="ml-auto text-xs text-ink-2">{a.instances} {a.instances === 1 ? "instance" : "instances"} · last {fmtDT(a.last_seen_at)}</span>
      </div>
      <p className="mt-1 text-sm">
        {a.user_id && <>Student <Link href={`/ops/risk/users/${a.user_id}`} className="text-info-text"><Id value={a.user_id} /></Link> </>}
        {a.vendor_id && <>Vendor <button type="button" onClick={() => onVendor(a.vendor_id!)} className="text-info-text underline-offset-4 hover:underline"><Id value={a.vendor_id} /></button></>}
      </p>
      <Evidence a={a} />
      {a.resolution_reason && <p className="mt-2 text-xs"><span className="font-bold">Resolution:</span> {a.resolution_reason}</p>}
      {a.lift_reason && <p className="mt-1 text-xs"><span className="font-bold">Lift asked:</span> {a.lift_reason}</p>}
      <Actions a={a} live={live} />
      <button type="button" onClick={() => setTrail(!trail)} className="mt-3 text-xs font-bold text-info-text">{trail ? "Hide audit trail" : "Audit trail"}</button>
      {trail && <Trail id={a.id} />}
    </GlassCard>
  );
}

function VendorPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const r = useRisk<VendorSignals>(`vendors/${id}/fraud-signals`);
  return (
    <Section title="Vendor view" desc="Signals naming this vendor, across students." action={<button type="button" aria-label="Close vendor view" onClick={onClose}><X className="size-4" /></button>}>
      <p className="mb-2 text-sm">Vendor <Id value={id} /></p>
      {r.data && (
        <div className="space-y-2 text-sm" data-testid="vendor-view">
          <p><span className="font-bold tabular-nums">{r.data.students}</span> students · <span className="font-bold tabular-nums">{r.data.open}</span> open alerts</p>
          <ul className="space-y-1">{Object.entries(r.data.signals).map(([s, n]) => <li key={s} className="flex justify-between"><span>{SIGNAL_LABEL[s] ?? s}</span><span className="font-bold tabular-nums">{n}</span></li>)}</ul>
          <ul className="space-y-1 text-xs">{r.data.alerts.map((a) => <li key={a.id}>{RULE_LABEL[a.rule]} · <Pill>{a.status}</Pill> {a.user_id && <>student <Id value={a.user_id} /></>}</li>)}</ul>
        </div>
      )}
    </Section>
  );
}

export function RiskAlerts() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [vendor, setVendor] = useState<string | null>(null);
  const query = new URLSearchParams();
  for (const k of ["status", "rule", "severity", "user_id", "vendor_id"]) if (params.get(k)) query.set(k, params.get(k)!);
  query.set("limit", "100");
  const result = useRisk<Alert[]>(`fraud-alerts?${query}`);

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v);
    else n.delete(k);
    router.replace(`${path}?${n}`);
  };

  return (
    <OpsPage title="Fraud alerts" desc="Most severe first. Confirm or dismiss with a written reason; only a confirmed alert can become a knockout." actions={<RevealToggle />}>
      <MockBanner source={result.source} />
      <div className="mb-4 flex flex-wrap gap-2">
        <GlassSelect aria-label="Status" className="w-auto min-w-40" value={params.get("status") ?? ""} onChange={(e) => set("status", e.target.value)}>
          <option value="">Any status</option>{["open", "confirmed", "dismissed", "lift_pending", "lifted"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </GlassSelect>
        <GlassSelect aria-label="Rule" className="w-auto min-w-40" value={params.get("rule") ?? ""} onChange={(e) => set("rule", e.target.value)}>
          <option value="">Any rule</option>{Object.entries(RULE_LABEL).map(([id, n]) => <option key={id} value={id}>{n}</option>)}
        </GlassSelect>
        <GlassSelect aria-label="Severity" className="w-auto min-w-40" value={params.get("severity") ?? ""} onChange={(e) => set("severity", e.target.value)}>
          <option value="">Any severity</option>{["high", "medium", "low"].map((s) => <option key={s}>{s}</option>)}
        </GlassSelect>
        {(params.get("user_id") || params.get("vendor_id")) && <GlassButton size="sm" variant="secondary" onClick={() => router.replace(path)}>Clear filters</GlassButton>}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Loaded result={result} need="ops roles">
          {(alerts) => alerts.length === 0 ? <GlassCard radius="lg" className="p-6 text-sm text-ink-2">No alerts match.</GlassCard> : (
            <div className="space-y-3">{alerts.map((a) => <AlertCard key={a.id} a={a} live={result.source === "live"} onVendor={setVendor} />)}</div>
          )}
        </Loaded>
        {vendor && <div><VendorPanel id={vendor} onClose={() => setVendor(null)} /></div>}
      </div>
    </OpsPage>
  );
}
