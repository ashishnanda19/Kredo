"use client";

import { useMemo, useState } from "react";
import { GlassButton, GlassCard, GlassSegmented } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { ImageIcon } from "lucide-react";
import { MaskedValue } from "@/components/portal/mask";
import { CATEGORIES, decideVendor, regenerateQr, setVendorSuspended } from "@/lib/domain/vendors";
import { fmtDateTime } from "@/lib/domain/time";
import type { AccountStatus, VendorProfile } from "@/lib/domain/types";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { DomainError } from "@/lib/domain/world";
import { DataTable, Guarded, OpsPage, Toast, useRole, useToast, type Column } from "./common";

const FILTERS = [
  { value: "pending", label: "Needs review" },
  { value: "accepted", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

const TONE: Record<AccountStatus, "success" | "warning" | "danger" | "neutral"> = { accepted: "success", pending: "warning", resubmission: "warning", rejected: "danger", suspended: "danger", expired: "neutral", not_started: "neutral" };
const matches = (f: Filter, s: AccountStatus) => f === "all" || (f === "rejected" ? s === "rejected" || s === "resubmission" : s === f);

type Row = VendorProfile & { id: string };

/** Vendor verification review and stall management. Every action needs a reason where it matters and writes the audit log. */
export function VendorsOps() {
  const hydrated = useWorldHydrated();
  const world = useWorld((s) => s.world);
  const apply = useWorld((s) => s.apply);
  const { role, can } = useRole();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => Object.entries(world.vendors).map(([id, v]) => ({ id, ...v })).filter((v) => matches(filter, v.status)).sort((a, b) => a.stallName.localeCompare(b.stallName)), [world.vendors, filter]);
  const sel = openId ? world.vendors[openId] : undefined;
  const actor = `ops:${role}`;
  const allowed = can("decideVerification");

  function run(label: string, fn: () => void) {
    try {
      fn();
      setError(null);
      setReason("");
      toast.show(label);
    } catch (e) {
      setError(e instanceof DomainError ? e.message : "That didn't work. Try again.");
    }
  }

  const cols: Column<Row>[] = [
    { key: "n", header: "Stall", cell: (r) => <span className="font-semibold">{r.stallName}</span> },
    { key: "o", header: "Owner", cell: (r) => r.ownerName },
    { key: "c", header: "Category", cell: (r) => CATEGORIES.find((c) => c.value === r.category)?.label },
    { key: "s", header: "Status", cell: (r) => <Badge tone={TONE[r.status]}>{r.status.replace("_", " ")}</Badge> },
    { key: "b", header: "Bank check", cell: (r) => (r.bankVerified ? <span className="text-ok-text">Verified {r.bankMasked}</span> : <span className="text-warn-text">Not verified</span>) },
    { key: "cap", header: "Daily cap", cell: (r) => `${r.dailyCap} coins`, className: "tabular-nums" },
    { key: "a", header: "", cell: (r) => <GlassButton size="sm" variant="secondary" onClick={() => { setOpenId(r.id); setError(null); setReason(""); }} aria-label={`Review ${r.stallName}`}>Review</GlassButton> },
  ];

  if (!hydrated) return null;
  return (
    <OpsPage title="Vendors" desc="Review new stalls and manage active ones. Reasons are required for rejecting, suspending and revoking, and every action is written to the audit log.">
      <div className="mb-3">
        <GlassSegmented label="Filter vendors" options={FILTERS} value={filter} onChange={(v) => { setFilter(v); setOpenId(null); }} />
      </div>
      <DataTable caption="Vendors" columns={cols} rows={rows} rowKey={(r) => r.id} loadMs={0} empty={filter === "pending" ? "No stalls are waiting for review." : "No stalls match this filter."} />

      {sel && openId && (
        <GlassCard radius="lg" strength="strong" className="mt-4 space-y-4 p-5" role="region" aria-label={`Review ${sel.stallName}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">{sel.stallName}</h2>
              <p className="text-sm text-ink-2">{sel.ownerName} · {sel.campusArea} · {sel.hours}</p>
            </div>
            <Badge tone={TONE[sel.status]}>{sel.status.replace("_", " ")}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid min-h-24 place-items-center rounded-2xl border border-dashed border-hairline text-xs text-ink-2"><span className="flex items-center gap-1.5"><ImageIcon className="size-4" aria-hidden /> Stall photo (placeholder)</span></div>
            <dl className="space-y-1 text-sm sm:col-span-2">
              <div className="flex justify-between gap-3"><dt className="text-ink-2">Owner ID</dt><dd>{sel.onboarding?.idMasked ? <MaskedValue value={sel.onboarding.idMasked} label="Owner ID" /> : "Verified before the demo"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-2">Verification</dt><dd>{sel.verificationLevel === "full" ? "Registered business" : "Small stall, no registration"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-2">Bank check</dt><dd data-testid="ops-bank">{sel.bankVerified ? `Name matched, ${sel.bankMasked}` : sel.onboarding?.bank === "name_mismatch" ? `Name mismatch (bank shows ${sel.onboarding.bankHolderSeen ?? "another name"})` : "Not verified"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-2">Agreement</dt><dd>{sel.onboarding?.agreedAt ? fmtDateTime(sel.onboarding.agreedAt) : "Signed before the demo"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-2">Daily cap</dt><dd className="tabular-nums">{sel.dailyCap} coins</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-2">QR version</dt><dd>{sel.qrVersion}</dd></div>
              {sel.onboarding?.reason && <div className="flex justify-between gap-3"><dt className="text-ink-2">Last reason</dt><dd className="text-right">{sel.onboarding.reason}</dd></div>}
            </dl>
          </div>

          <div className="space-y-2">
            <label htmlFor="ops-reason" className="text-sm font-semibold">Reason (needed to reject, ask for changes, suspend or revoke)</label>
            <textarea id="ops-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full rounded-[14px] border border-hairline bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30" />
            {error && <p role="alert" className="text-sm font-medium text-bad-text">{error}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <Guarded allowed={allowed} why="Your role can't decide vendor reviews.">
              {sel.status === "pending" && (
                <>
                  <GlassButton size="sm" data-testid="ops-accept" disabled={!allowed || !sel.bankVerified} onClick={() => run("Stall accepted", () => apply((w) => decideVendor(w, openId, "accept", actor)))}>Accept</GlassButton>
                  <GlassButton size="sm" variant="outline" data-testid="ops-resubmit" disabled={!allowed} onClick={() => run("Asked to resubmit", () => apply((w) => decideVendor(w, openId, "resubmit", actor, reason)))}>Ask to resubmit</GlassButton>
                  <GlassButton size="sm" variant="outline" data-testid="ops-reject" disabled={!allowed} onClick={() => run("Stall rejected", () => apply((w) => decideVendor(w, openId, "reject", actor, reason)))}>Reject</GlassButton>
                </>
              )}
              {sel.status === "accepted" && (
                <>
                  <GlassButton size="sm" variant="outline" data-testid="ops-suspend" disabled={!allowed} onClick={() => run("Stall suspended", () => apply((w) => setVendorSuspended(w, openId, true, actor, reason)))}>Suspend</GlassButton>
                  <GlassButton size="sm" variant="outline" data-testid="ops-revoke-qr" disabled={!allowed} onClick={() => run("QR revoked and replaced", () => { if (!reason.trim()) throw new DomainError("REASON_REQUIRED", "Give a reason. It is written to the audit log."); apply((w) => regenerateQr(w, openId, actor)); })}>Revoke QR</GlassButton>
                </>
              )}
              {sel.status === "suspended" && <GlassButton size="sm" data-testid="ops-reinstate" disabled={!allowed} onClick={() => run("Stall reinstated", () => apply((w) => setVendorSuspended(w, openId, false, actor, reason)))}>Reinstate</GlassButton>}
            </Guarded>
          </div>
          {sel.status === "pending" && !sel.bankVerified && <p className="text-xs text-warn-text">The bank account is not verified, so this stall cannot be accepted yet.</p>}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2">Recent audit entries</h3>
            <ul className="mt-1 space-y-0.5 text-xs text-ink-2" data-testid="ops-audit">
              {world.audit.filter((a) => a.target === openId).slice(-5).reverse().map((a) => <li key={a.id}>{fmtDateTime(a.at)} · {a.actor} · {a.action}{a.details.reason ? ` · ${String(a.details.reason)}` : ""}</li>)}
            </ul>
          </div>
        </GlassCard>
      )}
      <Toast msg={toast.msg} />
    </OpsPage>
  );
}
