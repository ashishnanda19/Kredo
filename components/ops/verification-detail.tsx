"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { Field } from "@/components/forms/field";
import { GlassSelect, GlassTextarea } from "@/components/forms/select";
import { GlassButton, GlassCard, GlassSheet, GlassSheetContent, GlassSheetDescription, GlassSheetTitle } from "@/components/glass";
import { MaskedValue } from "@/components/portal/mask";
import { StatusPill } from "@/components/portal/status-chip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { QUEUE, REJECTION, REVIEW_REASON_CODES } from "@/lib/mock-data";
import { useStore } from "@/lib/store/store";
import { cn } from "@/lib/utils";
import { Guarded, Toast, fmtDT, useRole, useToast } from "./common";
import { effectiveStatus } from "./ops-data";

type Action = "info_requested" | "escalated" | "approved" | "rejected";
const LABEL: Record<Action, string> = { info_requested: "Request additional information", escalated: "Escalate", approved: "Approve", rejected: "Reject" };

const TEMPLATE = (name: string, code: string) =>
  code === "V-BLUR"
    ? `Hi ${name}, we could not read your ID photo. Please retake it in good light with all four corners visible, then resubmit.`
    : code === "V-NAME"
      ? `Hi ${name}, the name you entered does not match your ID. Please check the spelling and resubmit.`
      : code === "V-EXP"
        ? `Hi ${name}, your ID card looks expired. Please upload a current ID or a bonafide certificate.`
        : `Hi ${name}, we need a little more information to finish your verification. Please check the item listed in your status page and resubmit.`;

function Evidence({ side }: { side: "Front" | "Back" }) {
  return (
    <figure className="m-0">
      <div role="img" aria-label={`Placeholder ${side.toLowerCase()} of ID, watermarked Demo`} className="relative aspect-[1.586/1] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#312e81,#6d28d9)]">
        <div aria-hidden className="absolute inset-3 rounded-xl border border-white/20">
          <div className="m-3 h-6 w-16 rounded bg-white/25" />
          <div className="m-3 mt-5 space-y-2">
            {[70, 50, 60].map((w) => (
              <div key={w} className="h-2 rounded bg-white/20" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        <div aria-hidden className="absolute inset-0 grid -rotate-12 grid-cols-3 place-items-center gap-4 text-2xl font-extrabold tracking-widest text-white/25">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i}>DEMO</span>
          ))}
        </div>
      </div>
      <figcaption className="mt-1 text-xs text-muted">{side} (placeholder image, not a real document)</figcaption>
    </figure>
  );
}

export function VerificationDetail({ id }: { id: string }) {
  const { role, can, label } = useRole();
  const item = QUEUE.find((q) => q.id === id);
  const decisions = useStore((s) => s.ops.decisions);
  const decide = useStore((s) => s.decide);
  const toast = useToast();
  const [action, setAction] = useState<Action | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (!item)
    return (
      <GlassCard radius="lg" className="p-6 text-center">
        No application with that ID. <Link href="/ops/verifications" className="font-bold text-neon-blue">Back to the queue</Link>
      </GlassCard>
    );

  const status = effectiveStatus(item, decisions);
  const d = decisions[id];
  const allowed = can("decideVerification");
  const why = "Only Verification reviewers and Admins can make verification decisions.";
  const rows: [string, string, string][] = [
    ["Full name", item.entered.name, item.onId.name],
    ["College", item.entered.college, item.onId.college],
    ["Course and year", item.entered.course, item.onId.course],
    ["Date of birth", item.entered.dob, item.onId.dob],
  ];

  function open(a: Action) {
    setAction(a);
    setCode(a === "approved" ? "V-OK" : "");
    setMsg(a === "info_requested" ? TEMPLATE(item!.entered.name.split(" ")[0], "") : "");
    setNote("");
    setErr(null);
  }
  function confirm() {
    if (!code) return setErr("Choose a reason code. It is required for every decision.");
    if (!action) return;
    decide(id, { status: action, code, note: action === "info_requested" ? msg : note });
    setAction(null);
    toast.show(`${LABEL[action]}: recorded in the audit log`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/ops/verifications" className="text-sm font-bold text-neon-blue">← Queue</Link>
          <h1 className="text-2xl font-extrabold tracking-tight"><span className="font-mono">{item.id}</span></h1>
          <p className="text-sm text-muted">
            <MaskedValue value={item.mobile} label="Mobile" /> · <MaskedValue value={item.idMasked} label="College ID" /> · attempt {item.attempts} · submitted {fmtDT(item.submitted)}
          </p>
        </div>
        <StatusPill kind="queue" value={status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard radius="lg" className="space-y-3 p-4" role="region" aria-label="Verification result summary">
          <h2 className="text-sm font-bold">Result summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted">Student verification</dt><dd><StatusPill kind="queue" value={status} /></dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Reason</dt><dd className="text-right font-semibold">{item.reason ? REJECTION[item.reason].label : "None recorded"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Assignee</dt><dd className="font-semibold">{item.assignee ?? "Unassigned"}</dd></div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">KYC result (from provider)</dt>
              <dd className="flex items-center gap-2">
                <StatusPill kind="kyc" value={item.kycStatus} />
                {/* Authoritative KYC cannot be edited by ANY role, including Admin. */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} aria-label="KYC results come from the verification provider and cannot be edited here." className="inline-flex cursor-not-allowed items-center gap-1 rounded-full border border-foreground/20 px-3 py-1.5 text-xs font-bold opacity-60">
                      <Lock className="size-3" aria-hidden /> Edit KYC
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>KYC results come from the verification provider and cannot be edited here.</TooltipContent>
                </Tooltip>
              </dd>
            </div>
          </dl>
          {d && (
            <p className="rounded-2xl bg-success-soft px-3 py-2 text-sm">
              <CheckCircle2 className="mr-1 inline size-4 text-success" aria-hidden />
              <span className="font-bold">{LABEL[d.status]}</span> · code {d.code} · {d.by} · {fmtDT(d.at)}
            </p>
          )}
        </GlassCard>

        <GlassCard radius="lg" className="p-4" role="region" aria-label="Submitted details compared with ID data">
          <h2 className="mb-2 text-sm font-bold">Submitted vs ID data</h2>
          <table className="w-full text-left text-[13px]">
            <caption className="sr-only">Submitted details beside the data read from the ID</caption>
            <thead className="text-[11px] uppercase tracking-wider text-muted"><tr><th scope="col" className="py-1.5">Field</th><th scope="col">Submitted</th><th scope="col">On ID</th></tr></thead>
            <tbody className="divide-y divide-foreground/10">
              {rows.map(([k, a, b]) => {
                const bad = a !== b;
                return (
                  <tr key={k} className={cn(bad && "bg-danger-soft")}>
                    <th scope="row" className="py-2 pr-2 font-semibold">{k}</th>
                    <td className="pr-2">{a}</td>
                    <td className="font-semibold">{b} {bad && <AlertTriangle className="ml-1 inline size-3.5 text-danger" aria-label="Does not match" />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassCard>
      </div>

      <GlassCard radius="lg" className="p-4" role="region" aria-label="Evidence viewer">
        <h2 className="mb-2 text-sm font-bold">Evidence (placeholder images)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Evidence side="Front" />
          <Evidence side="Back" />
        </div>
      </GlassCard>

      <GlassCard radius="lg" className="p-4" role="region" aria-label="Review actions">
        <h2 className="mb-1 text-sm font-bold">Review actions</h2>
        <p className="mb-3 text-xs text-muted">Each action needs a reason code and is recorded with a timestamp and your name. You are acting as {label}.</p>
        <div className="flex flex-wrap gap-2">
          <Guarded allowed={allowed} why={why}><GlassButton variant="secondary" size="sm" onClick={() => open("info_requested")} disabled={!allowed}>{LABEL.info_requested}</GlassButton></Guarded>
          <Guarded allowed={allowed} why={why}><GlassButton variant="secondary" size="sm" onClick={() => open("escalated")} disabled={!allowed}>{LABEL.escalated}</GlassButton></Guarded>
          <Guarded allowed={allowed} why={why}><GlassButton size="sm" onClick={() => open("approved")} disabled={!allowed}>{LABEL.approved}</GlassButton></Guarded>
          <Guarded allowed={allowed} why={why}><GlassButton variant="warning" size="sm" onClick={() => open("rejected")} disabled={!allowed}>{LABEL.rejected}</GlassButton></Guarded>
        </div>
      </GlassCard>

      <GlassSheet open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <GlassSheetContent>
          {action && (
            <div className="space-y-4">
              <GlassSheetTitle className="text-xl font-extrabold">{LABEL[action]}</GlassSheetTitle>
              <GlassSheetDescription className="text-sm text-muted">{item.id}. This will be written to the audit log.</GlassSheetDescription>
              <Field id="code" label="Reason code (required)" error={err}>
                <GlassSelect id="code" value={code} onChange={(e) => { setCode(e.target.value); setErr(null); if (action === "info_requested") setMsg(TEMPLATE(item.entered.name.split(" ")[0], e.target.value)); }} invalid={!!err} aria-describedby="code-err">
                  <option value="">Choose a code</option>
                  {REVIEW_REASON_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code}: {c.label}</option>
                  ))}
                </GlassSelect>
              </Field>
              {action === "info_requested" ? (
                <Field id="msg" label="Message to the student (template, editable)">
                  <GlassTextarea id="msg" value={msg} onChange={(e) => setMsg(e.target.value)} />
                </Field>
              ) : (
                <Field id="note" label="Note (optional)">
                  <GlassTextarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" />
                </Field>
              )}
              <GlassButton size="lg" className="w-full" onClick={confirm}>Confirm {LABEL[action].toLowerCase()}</GlassButton>
            </div>
          )}
        </GlassSheetContent>
      </GlassSheet>
      <Toast msg={toast.msg} />
      <span className="sr-only">Role: {role}</span>
    </div>
  );
}
