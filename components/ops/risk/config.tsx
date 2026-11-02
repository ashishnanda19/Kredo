"use client";

import { useState } from "react";
import { GlassButton } from "@/components/glass";
import { GlassSegmented } from "@/components/glass/glass-segmented";
import { useRisk, useRiskAction } from "@/lib/ops-risk/api";
import type { ConfigView, DryRun } from "@/lib/ops-risk/types";
import { fmtDT, Guarded, OpsPage, useRole } from "../common";
import { Loaded, MockBanner, Section, Spinner } from "./parts";

type Which = "policy" | "scorecard";

function DryRunPanel({ active, live }: { active: ConfigView["active"]; live: boolean }) {
  const { can } = useRole();
  const act = useRiskAction();
  const [which, setWhich] = useState<Which>("policy");
  const [text, setText] = useState(active.policy_yaml);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<DryRun | null>(null);
  const [errors, setErrors] = useState<string[] | null>(null);

  async function run() {
    setBusy(true);
    setErrors(null);
    const r = await act("POST", "config/dry-run", { [`${which}_yaml`]: text });
    setBusy(false);
    if (r.ok) setOut(r.data as DryRun);
    else if (r.mock) setErrors(["Dry-runs need the score service."]);
    else {
      const d = (r.data as { detail?: { code?: string; errors?: { at: string; error: string }[] } } | null)?.detail;
      setErrors(d?.errors?.map((e) => `${e.at}: ${e.error}`) ?? [d?.code === "BAD_YAML" ? "That is not valid YAML." : `Not run (${r.code ?? r.status}).`]);
      setOut(null);
    }
  }

  return (
    <Section title="Dry-run a change" desc="Edit or upload a YAML file. It is checked against the safety rails and run over the last 90 days of students. Nothing goes live; that needs a reviewed change and a deploy.">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <GlassSegmented label="File" value={which} onChange={(v) => { setWhich(v); setText(v === "policy" ? active.policy_yaml : active.scorecard_yaml); setOut(null); }} options={[{ value: "policy", label: "Policy" }, { value: "scorecard", label: "Scorecard" }]} />
        <label className="glass glass-soft inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 text-sm font-bold">
          Upload YAML
          <input type="file" accept=".yaml,.yml,text/yaml" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} />
        </label>
      </div>
      <textarea aria-label={`${which} YAML`} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} className="glass glass-soft h-72 w-full rounded-2xl p-3 font-mono text-xs" />
      <div className="mt-3">
        <Guarded allowed={can("configDryRun") && live} why={live ? "Risk analysts and risk admins run dry-runs." : "Dry-runs need the score service."}>
          <GlassButton onClick={run} disabled={busy}>{busy && <Spinner />} Run dry-run</GlassButton>
        </Guarded>
      </div>
      {errors && <ul role="alert" className="mt-3 space-y-1 rounded-2xl bg-danger-soft p-3 text-sm text-bad-text">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      {out && (
        <div role="status" className="mt-4 space-y-3 text-sm" data-testid="dry-run-result">
          <p><span className="text-2xl font-extrabold tabular-nums">{out.users_changing_band}</span> of {out.users_checked} students would change band <span className="text-ink-2">(candidate {out.candidate.policy_version} / {out.candidate.scorecard_version}, {out.candidate.hash.slice(0, 10)})</span></p>
          {[["Band changes", out.band_changes], ["Level changes", out.level_changes], ["Eligibility", out.eligibility_changes]].map(([title, m]) => (
            <div key={title as string}>
              <p className="text-xs font-bold text-ink-2">{title as string}</p>
              {Object.keys(m as object).length === 0 ? <p className="text-xs">None</p> : <ul className="text-xs">{Object.entries(m as Record<string, number>).map(([k, n]) => <li key={k} className="tabular-nums">{k.replaceAll("_", " ")}: {n}</li>)}</ul>}
            </div>
          ))}
          {out.sample.length > 0 && (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-ink-2"><th>Student</th><th>KRS</th><th>Band</th><th>Level</th></tr></thead>
              <tbody>{out.sample.map((s) => <tr key={s.user} className="border-t border-ink/10"><td className="font-mono">{s.user}</td><td className="tabular-nums">{s.krs.join(" → ")}</td><td>{s.band.join(" → ")}</td><td>{s.level.map((x) => x ?? "none").join(" → ")}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      )}
    </Section>
  );
}

export function RiskConfig() {
  const result = useRisk<ConfigView>("config");
  const [which, setWhich] = useState<Which>("policy");
  return (
    <OpsPage title="Scorecard and policy" desc="Read-only view of what is live. Changes are YAML edits, checked here first.">
      <MockBanner source={result.source} />
      <Loaded result={result} need="risk analysts, risk admins and admins">
        {(c) => (
          <div className="space-y-4">
            <Section title="Active config" desc={`Scorecard ${c.active.scorecard_version}, policy ${c.active.policy_version}, hash ${c.active.hash.slice(0, 12)}.`}>
              <GlassSegmented label="File" value={which} onChange={setWhich} options={[{ value: "policy", label: "Policy" }, { value: "scorecard", label: "Scorecard" }]} className="mb-3" />
              <pre data-testid="config-yaml" className="max-h-96 overflow-auto rounded-2xl bg-ink/[0.05] p-3 font-mono text-xs leading-relaxed">{which === "policy" ? c.active.policy_yaml : c.active.scorecard_yaml}</pre>
            </Section>
            <Section title="Version history" desc="Every config that has scored a student, by hash. Old snapshots replay with the config they were built with.">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-ink-2"><th className="py-1">First seen</th><th>Scorecard</th><th>Policy</th><th>Hash</th></tr></thead>
                <tbody>{c.history.map((h) => <tr key={h.hash} className="border-t border-ink/10"><td className="py-1">{fmtDT(h.first_seen_at)}</td><td>{h.scorecard_version}</td><td>{h.policy_version}</td><td className="font-mono text-xs">{h.hash.slice(0, 12)}{h.hash === c.active.hash && " (active)"}</td></tr>)}</tbody>
              </table>
            </Section>
            <DryRunPanel active={c.active} live={result.source === "live"} />
          </div>
        )}
      </Loaded>
    </OpsPage>
  );
}
