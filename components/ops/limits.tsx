"use client";

import { useState } from "react";
import { GlassButton, GlassCard } from "@/components/glass";
import { ladderView } from "@/lib/domain/limit";
import { fmtDateTime } from "@/lib/domain/time";
import { studentState } from "@/lib/domain/selectors";
import { DomainError, overrideLimit } from "@/lib/domain/world";
import { getPolicy } from "@/lib/policy";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { Guarded, OpsPage, Toast, useRole, useToast } from "./common";

/** Set a student's limit step by hand. A reason is required, the student is told, and the audit log records who did it. */
export function LimitsOps() {
  const hydrated = useWorldHydrated();
  const world = useWorld((s) => s.world);
  const apply = useWorld((s) => s.apply);
  const { role, can } = useRole();
  const toast = useToast();
  const [studentId, setStudentId] = useState("stu-aarav");
  const [level, setLevel] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) return null;
  const levels = getPolicy().ladder.levels;
  const st = studentState(world, studentId);
  const view = ladderView(world, studentId);
  const target = level ?? Math.min(levels.length, st.level + 1);
  const recent = world.audit.filter((a) => a.action === "limit.override").slice(-5).reverse();

  function submit() {
    try {
      apply((w) => overrideLimit(w, studentId, target, `ops:${role}`, reason));
      setError(null);
      setReason("");
      setLevel(null);
      toast.show("Limit step changed. The student has been told.");
    } catch (e) {
      setError(e instanceof DomainError ? e.message : "That didn't work. Try again.");
    }
  }

  return (
    <OpsPage title="Limit overrides" desc="Change a student's limit step by hand. This only changes the step. Aura, streak and default history are untouched.">
      <GlassCard radius="lg" className="space-y-4 p-5">
        <label className="block text-sm font-semibold">Student
          <select data-testid="limit-student" value={studentId} onChange={(e) => { setStudentId(e.target.value); setLevel(null); }} className="ml-2 min-h-11 rounded-xl border border-hairline bg-card px-3 text-sm">
            {Object.entries(world.students).map(([id, s]) => <option key={id} value={id}>{s.firstName} {s.lastInitial}. ({s.idMasked})</option>)}
          </select>
        </label>
        <p className="text-sm" data-testid="limit-current">Now: step {st.level}, {st.limit} coins. Aura {st.aura}.{view.postDefaultCap !== null ? ` Per-payment cap ${view.postDefaultCap} coins while rebuilding.` : ""}</p>
        <label className="block text-sm font-semibold">New step
          <select data-testid="limit-level" value={target} onChange={(e) => setLevel(Number(e.target.value))} className="ml-2 min-h-11 rounded-xl border border-hairline bg-card px-3 text-sm">
            {levels.map((l, i) => <option key={i} value={i + 1}>Step {i + 1}: {l.limit} coins</option>)}
          </select>
        </label>
        <div>
          <label htmlFor="limit-reason" className="block text-sm font-semibold">Reason (required, written to the audit log)</label>
          <textarea id="limit-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-[14px] border border-hairline bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30" />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-bad-text">{error}</p>}
        <Guarded allowed={can("limitOverride")} why="Your role can't override limits.">
          <GlassButton data-testid="limit-apply" disabled={!can("limitOverride")} onClick={submit}>Change limit step</GlassButton>
        </Guarded>
      </GlassCard>
      <GlassCard radius="lg" className="mt-4 p-5">
        <h2 className="text-base font-bold">Recent overrides</h2>
        {recent.length === 0 ? <p className="py-3 text-sm text-ink-2">None yet.</p> : (
          <ul className="mt-2 divide-y divide-hairline text-sm" data-testid="recent-overrides">
            {recent.map((a) => <li key={a.id} className="py-2">{fmtDateTime(a.at)} · {a.actor} · {world.students[a.target]?.firstName ?? a.target}: step {String(a.details.fromLevel)} to {String(a.details.toLevel)} · {String(a.details.reason)}</li>)}
          </ul>
        )}
      </GlassCard>
      <Toast msg={toast.msg} />
    </OpsPage>
  );
}
