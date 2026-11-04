"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GlassButton, GlassCard } from "@/components/glass";
import { DEMO_ENABLED } from "@/components/portal/demo-controls";
import { PERSONAS } from "@/lib/demo/constants";
import { STAGE, FLOW } from "@/lib/copy-demo";
import { SCENARIOS } from "@/lib/demo/scenarios";
import { loansOfVendor } from "@/lib/domain/selectors";
import { useWorld, useWorldHydrated } from "@/lib/store/world";
import { cn } from "@/lib/utils";
import { DemoMoneyLabel } from "./demo-money-label";
import { LedgerStrip } from "./ledger-strip";
import { MoneyFlow } from "./money-flow";
import { PhoneFrame } from "./phone-frame";
import { speak, speechSupported, stopSpeaking } from "@/lib/demo/speech";
import { useScenarioRunner } from "./use-scenario-runner";

interface FrameTarget {
  id: string;
  path: string;
  n: number;
}

const frameSrc = (role: "student" | "vendor", f: FrameTarget) => `/demo/frame?role=${role}&${role}=${encodeURIComponent(f.id)}&path=${encodeURIComponent(f.path)}&n=${f.n}`;

/** A short two-tone chime for a new payment, so the room notices the stall's phone. Fails quietly where audio is blocked. */
function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new Ctx();
    const now = ac.currentTime;
    [880, 1320].forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.2, now + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.25);
      o.connect(g).connect(ac.destination);
      o.start(now + i * 0.12);
      o.stop(now + i * 0.12 + 0.3);
    });
    setTimeout(() => void ac.close(), 800);
  } catch {
    /* audio unavailable */
  }
}

export function Stage() {
  const hydrated = useWorldHydrated();
  const params = useSearchParams();
  const world = useWorld((s) => s.world);
  const presenter = useWorld((s) => s.presenter);
  const setPresenter = useWorld((s) => s.setPresenter);
  const flowOn = useWorld((s) => s.flowOverlay);
  const setFlow = useWorld((s) => s.setFlowOverlay);
  const reset = useWorld((s) => s.resetKeepingUi);

  const fast = params.get("fast") === "1";
  const [fresh, setFresh] = useState(params.get("fresh") !== "0");
  const [sound, setSound] = useState(true);
  const [voice, setVoice] = useState(false);
  const canSpeak = useSyncExternalStore(() => () => {}, speechSupported, () => false);
  const [student, setStudent] = useState<FrameTarget>({ id: "stu-aarav", path: "/dashboard", n: 0 });
  const [vendor, setVendor] = useState<FrameTarget>({ id: "ven-gupta-chai", path: "/vendor", n: 0 });

  const runner = useScenarioRunner({
    onStudent: (id, path = "/dashboard") => setStudent((f) => ({ id, path, n: f.n + 1 })),
    onVendor: (id, path = "/vendor") => setVendor((f) => ({ id, path, n: f.n + 1 })),
    pauseMs: fast ? 250 : 4500,
  });

  // a new payment to the stall on the right: chime (the stall's feed flashes on its own)
  const latest = hydrated ? loansOfVendor(world, vendor.id).reduce<string>((m, l) => (l.id > m ? l.id : m), "") : "";
  const seenLatest = useRef<string | null>(null);
  useEffect(() => {
    if (seenLatest.current !== null && latest && latest !== seenLatest.current && sound) chime();
    seenLatest.current = latest;
  }, [latest, sound]);

  // voice-over: read the latest result and the next caption each time the script pauses, and stop when switched off
  const st0 = runner.state;
  const { scenario: spokenScenario, index: spokenIndex, status: spokenStatus, log: spokenLog } = st0;
  useEffect(() => {
    if (!voice || !spokenScenario) return stopSpeaking();
    if (spokenStatus !== "waiting" && spokenStatus !== "done") return;
    const last = spokenLog[spokenLog.length - 1];
    const next = spokenIndex < spokenScenario.steps.length ? spokenScenario.steps[spokenIndex].caption : "";
    speak([spokenIndex === 0 ? spokenScenario.title : "", last?.detail ?? "", next].filter(Boolean).join(". "));
    return () => stopSpeaking();
  }, [voice, spokenScenario, spokenIndex, spokenStatus, spokenLog]);

  // ?scenario=N starts one (and ?auto=1 plays it); started after paint so the world is loaded first
  const started = useRef(false);
  const { start, play } = runner;
  useEffect(() => {
    const n = Number(params.get("scenario"));
    if (!hydrated || started.current || !n) return;
    started.current = true;
    const id = setTimeout(() => {
      start(n, params.get("fresh") !== "0");
      if (params.get("auto") === "1") setTimeout(() => void play(), 200);
    }, 50);
    return () => clearTimeout(id);
  }, [hydrated, params, start, play]);

  if (!DEMO_ENABLED) return <main id="main" className="p-8 text-center text-ink-2">{STAGE.nothing}</main>;

  const st = runner.state;
  const sc = st.scenario;
  const nextCaption = sc && st.index < sc.steps.length ? sc.steps[st.index].caption : null;
  const students = Object.entries(world.students).map(([id, s]) => ({ id, label: `${s.firstName} ${s.lastInitial}.${PERSONAS.find((p) => p.studentId === id)?.label.match(/\(([^)]+)\)/)?.[1] ? ` (${PERSONAS.find((p) => p.studentId === id)!.label.match(/\(([^)]+)\)/)![1]})` : ""}` }));
  const vendors = Object.entries(world.vendors).map(([id, v]) => ({ id, label: `${v.stallName}${v.status === "accepted" ? "" : ` (${v.status})`}` }));

  return (
    <main id="main" data-ready={hydrated} data-presenter={presenter} className={cn("mx-auto w-full max-w-[1500px] space-y-4 px-4 py-4 sm:px-6", presenter && "text-[1.1rem]")}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{STAGE.title}</h1>
          {!presenter && <p className="text-sm text-ink-2">{STAGE.sub}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DemoMoneyLabel />
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" data-testid="presenter-toggle" className="size-4" checked={presenter} onChange={(e) => setPresenter(e.target.checked)} />{STAGE.presenter}</label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" data-testid="flow-toggle" className="size-4" checked={flowOn} onChange={(e) => setFlow(e.target.checked)} />{STAGE.flowOverlay}</label>
          {canSpeak && <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" data-testid="voice-toggle" className="size-4" checked={voice} onChange={(e) => setVoice(e.target.checked)} />{STAGE.voice}</label>}
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" className="size-4" checked={sound} onChange={(e) => setSound(e.target.checked)} />{STAGE.sound}</label>
          <GlassButton size="sm" variant="outline" data-testid="stage-reset" onClick={() => { runner.stop(); reset(); }}>{STAGE.reset}</GlassButton>
          <Link href="/demo/flow" className="text-sm font-semibold underline">Full-screen diagram</Link>
        </div>
      </header>

      {!presenter && (
        <div className="flex flex-wrap gap-4">
          <label className="text-sm font-semibold">{STAGE.student}
            <select data-testid="student-picker" value={student.id} onChange={(e) => setStudent((f) => ({ id: e.target.value, path: "/dashboard", n: f.n + 1 }))} className="ml-2 min-h-11 rounded-xl border border-hairline bg-card px-3 text-sm">
              {students.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">{STAGE.vendor}
            <select data-testid="vendor-picker" value={vendor.id} onChange={(e) => setVendor((f) => ({ id: e.target.value, path: "/vendor", n: f.n + 1 }))} className="ml-2 min-h-11 rounded-xl border border-hairline bg-card px-3 text-sm">
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </label>
        </div>
      )}

      <GlassCard radius="lg" className="space-y-3 p-4" data-testid="scenario-panel" data-status={st.status} data-scenario={sc?.n ?? ""}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-sm font-bold uppercase tracking-wider text-ink-2">{STAGE.scenarios}</h2>
          {SCENARIOS.map((s) => (
            <button key={s.n} type="button" data-testid={`scenario-${s.n}`} aria-pressed={sc?.n === s.n} title={s.title} onClick={() => runner.start(s.n, fresh)} className={cn("min-h-11 min-w-11 rounded-full border px-3 text-sm font-bold", sc?.n === s.n ? "border-transparent bg-accent text-accent-ink" : "border-hairline hover:bg-card")}>{s.n}</button>
          ))}
          {!presenter && <label className="ml-auto flex items-center gap-2 text-xs font-semibold" title={STAGE.freshNote}><input type="checkbox" data-testid="fresh-toggle" className="size-4" checked={fresh} onChange={(e) => setFresh(e.target.checked)} />{STAGE.fresh}</label>}
        </div>

        {sc ? (
          <div className="space-y-2">
            <p className="text-lg font-extrabold" data-testid="scenario-title">{sc.n}. {sc.title}</p>
            <ol className="space-y-2" data-testid="scenario-log">
              {st.log.map((l, i) => (
                <li key={i} data-testid="scenario-step" className="rounded-2xl bg-card p-3">
                  <p className="font-semibold">{l.caption}</p>
                  {l.detail && <p className="mt-1 text-ink-2" data-testid="step-detail">{l.detail}</p>}
                  {l.actions.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{l.actions.map((a) => <GlassButton key={a.label} size="sm" variant="secondary" onClick={a.run}>{a.label}</GlassButton>)}</div>}
                </li>
              ))}
              {nextCaption && <li className="rounded-2xl border border-dashed border-hairline p-3 font-semibold" data-testid="next-caption">{nextCaption}</li>}
            </ol>
            {st.status === "error" && <p role="alert" className="text-sm font-semibold text-bad-text">{STAGE.error} {st.error}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <GlassButton size="sm" data-testid="step-next" disabled={st.status !== "waiting"} onClick={() => void runner.step()}>{STAGE.next}</GlassButton>
              <GlassButton size="sm" variant="accent" data-testid="step-play" disabled={st.status !== "waiting"} onClick={() => void runner.play()}>{STAGE.play}</GlassButton>
              <GlassButton size="sm" variant="outline" data-testid="step-stop" onClick={runner.stop}>{STAGE.stop}</GlassButton>
              <span className="text-sm text-ink-2" data-testid="scenario-progress">{STAGE.step(Math.min(st.index + (st.status === "done" ? 0 : 1), sc.steps.length), sc.steps.length)}</span>
              {st.status === "done" && <span data-testid="scenario-done" className="text-sm font-bold text-ok-text">{STAGE.done}</span>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-2">{STAGE.pickScenario}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <GlassButton size="sm" variant="secondary" data-testid="play-all" onClick={() => void runner.playAll(fresh)}>{STAGE.playAll}</GlassButton>
        </div>
      </GlassCard>

      <div className="grid items-start gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <PhoneFrame title={STAGE.student} testId="student-frame" presenter={presenter} src={frameSrc("student", student)} />
        <div className="order-last space-y-4 lg:order-none">
          <GlassCard radius="lg" className="p-4"><h2 className="mb-1 text-center text-sm font-extrabold">{FLOW.title}</h2><MoneyFlow compact={!presenter} /></GlassCard>
          <LedgerStrip presenter={presenter} limit={presenter ? 6 : 10} />
        </div>
        <PhoneFrame title={STAGE.vendor} testId="vendor-frame" presenter={presenter} src={frameSrc("vendor", vendor)} />
      </div>
    </main>
  );
}
