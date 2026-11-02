"use client";

import { RotateCcw } from "lucide-react";
import { GlassButton } from "@/components/glass";
import type { Scenarios } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DIRECTOR } from "@/lib/copy-demo";
import { PERSONAS } from "@/lib/demo/constants";
import { DAY, HOUR, fmtDateTime } from "@/lib/domain/time";
import { useStore } from "@/lib/store/store";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { useJumpIn } from "./start-chooser";

function Chip({ onClick, children, testId }: { onClick: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button type="button" data-testid={testId} onClick={onClick} className="min-h-9 rounded-full border border-ink/20 px-3 text-xs font-semibold transition-colors hover:bg-ink/10">
      {children}
    </button>
  );
}

function OutcomeRow({ label, value, options, onPick, testId }: { label: string; value: string; options: [string, string][]; onPick: (v: string) => void; testId: string }) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-[11px] text-ink-2">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => (
          <button key={v} type="button" data-testid={`${testId}-${v}`} aria-pressed={value === v} onClick={() => onPick(v)} className={cn("min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors", value === v ? "border-transparent bg-accent text-accent-ink" : "border-ink/20 hover:bg-ink/10")}>
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** The "Demo world" group inside the existing demo-controls panel: reset, the simulated clock, and persona jump-in. */
export function DemoWorldControls() {
  const hydrated = useWorldHydrated();
  const now = useWorld((s) => s.world.clock.now);
  const scenarios = useWorld((s) => s.scenarios);
  const setScenario = useWorld((s) => s.setScenario);
  const t = DIRECTOR;
  const jump = useJumpIn();
  const w = useWorld.getState;
  if (!hydrated) return null;
  return (
    <section aria-label={t.group} className="space-y-3 rounded-2xl border border-ink/15 p-3">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-2">{t.group}</h3>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold">{t.clock}: <span data-testid="sim-clock" className="tabular-nums">{fmtDateTime(now)}</span></p>
        <div className="flex flex-wrap gap-1.5">
          <Chip testId="jump-hour" onClick={() => w().advanceBy(HOUR, t.jumps.hour)}>{t.jumps.hour}</Chip>
          <Chip testId="jump-day" onClick={() => w().advanceBy(DAY, t.jumps.day)}>{t.jumps.day}</Chip>
          <Chip testId="jump-days3" onClick={() => w().advanceBy(3 * DAY, t.jumps.days3)}>{t.jumps.days3}</Chip>
          <Chip testId="jump-midnight" onClick={() => w().toNextMidnight()}>{t.jumps.midnight}</Chip>
          <Chip testId="jump-due" onClick={() => w().toDueDate()}>{t.jumps.due}</Chip>
          <Chip testId="jump-late8" onClick={() => w().toPastDue(8)}>{t.jumps.late8}</Chip>
          <Chip testId="jump-late31" onClick={() => w().toPastDue(31)}>{t.jumps.late31}</Chip>
        </div>
        <p className="text-[11px] text-ink-2">{t.jumpHint}</p>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold">{t.outcomes}</p>
        <OutcomeRow label={t.nbfc.label} testId="nbfc" value={scenarios.nbfc} options={[["paid", t.nbfc.paid], ["failed", t.nbfc.failed], ["on_hold", t.nbfc.on_hold]]} onPick={(v) => setScenario("nbfc", v as Scenarios["nbfc"])} />
        <OutcomeRow label={t.pennyDrop.label} testId="penny" value={scenarios.pennyDrop} options={[["success", t.pennyDrop.success], ["name_mismatch", t.pennyDrop.name_mismatch], ["provider_error", t.pennyDrop.provider_error]]} onPick={(v) => setScenario("pennyDrop", v as Scenarios["pennyDrop"])} />
        <OutcomeRow label={t.kycOutcome.label} testId="kyc" value={scenarios.kyc} options={[["verified", t.kycOutcome.verified], ["needs_retry", t.kycOutcome.needs_retry], ["provider_error", t.kycOutcome.provider_error]]} onPick={(v) => setScenario("kyc", v as Scenarios["kyc"])} />
      </div>

      <Chip testId="send-queued" onClick={() => void w().runSettlements()}>{t.sendQueued}</Chip>

      <label className="flex items-center gap-2 text-xs font-semibold">
        <input type="checkbox" data-testid="fail-next-pay" className="size-4" checked={scenarios.failNextPay} onChange={(e) => setScenario("failNextPay", e.target.checked)} />
        {t.failNextPay}
      </label>

      <label className="block space-y-1.5 text-xs font-semibold">
        {t.persona}
        <select
          data-testid="persona-select"
          value=""
          onChange={(e) => {
            const p = PERSONAS.find((x) => x.id === e.target.value);
            if (p) jump(p);
          }}
          className="min-h-9 w-full rounded-xl border border-ink/20 bg-transparent px-2 text-xs"
        >
          <option value="">{t.none}</option>
          <optgroup label={t.studentPersona}>{PERSONAS.filter((p) => p.kind === "student").map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</optgroup>
          <optgroup label={t.vendorPersona}>{PERSONAS.filter((p) => p.kind === "vendor").map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</optgroup>
        </select>
      </label>

      <GlassButton
        data-testid="reset-demo"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          const wasOpen = useStore.getState().demo.open;
          useWorld.getState().reset();
          useStore.getState().resetAll();
          useStore.getState().setDemoOpen(wasOpen); // keep the panel where the presenter left it
        }}
      >
        <RotateCcw className="size-4" aria-hidden /> {t.reset}
      </GlassButton>
    </section>
  );
}
