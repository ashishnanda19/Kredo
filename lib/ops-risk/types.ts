/** Shapes returned by the score service's /v1/ops API (services/score/app/ops/risk.py, alerts.py, overrides.py). */

export type Band = "A" | "B" | "C" | "D" | "E";

export interface ReasonCode { code: string; direction: "up" | "down" | "neutral"; points?: number }

export interface FactorPoints { bin: string; codes: Record<string, number>; points: number }

export interface Snapshot {
  id: string;
  as_of: string;
  evaluated_at: string;
  krs: number;
  pd: number;
  band: Band;
  aura: number;
  tier: string;
  fresh_spawn: boolean;
  streak: number;
  reason_codes: ReasonCode[];
  knockouts: string[];
  limit_reco: {
    level?: string | null;
    amount_paise?: number;
    eligible?: boolean;
    action?: string;
    held_for_review?: boolean;
    outstanding_paise?: number;
    max_ticket_paise?: number;
    cycles_at_level?: number;
    frozen?: boolean;
    next?: { level: string; amount_paise: number; cycles_needed: number; blockers: string[] } | null;
    open_loans?: { loan_id: string; due_date: string; outstanding_paise: number; dpd: number }[];
    overrides?: { override_id: string; field: string; value: number; expires_at: string }[];
  };
  points: { base: number; factors: Record<string, FactorPoints>; raw_krs: number; velocity_cap: number };
  features: Record<string, number | string | boolean | null>;
  versions: { scorecard: string; policy: string; config_hash: string };
  trigger_event_id: string | null;
}

export interface UserRow {
  user_id: string;
  as_of: string;
  krs: number;
  pd: number;
  band: Band;
  aura: number;
  tier: string;
  knockouts: string[];
  level: string | null;
  eligible: boolean;
  held_for_review: boolean;
  open_alerts: number;
  synthetic: boolean;
}

export interface UserPage { total: number; rows: UserRow[]; limit?: number; offset?: number }

export interface SnapshotDiff {
  krs?: number;
  band?: [string, string];
  tier?: [string, string];
  level?: [string | null, string | null];
  knockouts?: { added: string[]; lifted: string[] };
  factors?: Record<string, [number, number]>;
}

export interface UserDetail {
  user_id: string;
  synthetic: boolean;
  latest: Snapshot;
  knockouts: { code: string; message: string; way_out: string }[];
  ladder: { level: number; clean_cycles_at_level: number; frozen: boolean; last_step_up_at: string | null; as_of: string | null } | null;
  snapshots: { id: string; as_of: string; krs: number; band: Band; aura: number; tier: string; level: string | null; knockouts: string[]; trigger_event_id: string | null; diff: SnapshotDiff }[];
  events: { event_id: string; type: string; occurred_at: string; source: string; synthetic: boolean; payload: Record<string, unknown> }[];
  alerts: Alert[];
  overrides: Override[];
}

export interface Monitoring {
  as_of: string;
  users: number;
  synthetic_users: number;
  bands: Record<Band, number>;
  aura_histogram: { from: number; to: number; count: number }[];
  tiers: Record<string, number>;
  knockouts: Record<string, number>;
  eligible_now: number;
  approval: { prechecks: number; precheck_eligible_rate: number | null; outcomes: number; approval_rate: number | null; agreement: Record<string, number> };
  dpd_roll: { matured_loans: number; stages: { from: string; to: string; base: number; reached: number; rate: number | null }[] };
  alerts: { open: number; open_by_rule: Record<string, number>; open_by_severity: Record<string, number>; confirm_rate_by_rule: Record<string, number> };
  freshness_minutes: number | null;
  v2_readiness: { labelled_loans: number; bad_loans: number; target_loans: number; target_bad: number };
  /** the label definition the numbers below use (bump the version when it changes) */
  labels: { version: number; window_days: number; bad_dpd: number };
  /** KRS population stability, month on month */
  drift: { points: { month: string; users: number; psi: number | null; reliable: boolean }[]; alert_above: number; min_users: number; latest_psi: number | null; alert: boolean };
  /** predicted PD against the bad rate actually observed, per band, on labelled loans */
  calibration: { band: Band; loans: number; bad: number; predicted_pd: number | null; observed_bad_rate: number | null; reliable: boolean }[];
  /** how well KRS separates good loans from bad ones */
  discrimination: { loans: number; bad: number; auc: number | null; gini: number | null; ks: number | null };
}

export type AlertStatus = "open" | "confirmed" | "dismissed" | "lift_pending" | "lifted";

export interface Alert {
  id: string;
  rule: string;
  severity: "low" | "medium" | "high";
  status: AlertStatus;
  user_id: string | null;
  vendor_id: string | null;
  hold: boolean;
  flag: string | null;
  instances: number;
  evidence: { instances: (Record<string, unknown> & { key: string; at: string; signal: string })[] };
  observed_at: string;
  last_seen_at: string;
  created_at: string | null;
  resolved_by: string | null;
  resolution_reason: string | null;
  resolved_at: string | null;
  lift_requested_by: string | null;
  lift_reason: string | null;
  lift_requested_at: string | null;
  lifted_by: string | null;
  lifted_at: string | null;
  synthetic: boolean;
}

export interface VendorSignals { vendor_id: string; students: number; open: number; by_rule: Record<string, number>; signals: Record<string, number>; alerts: Alert[] }

export interface Override {
  id: string;
  user_id: string;
  field: "ladder_level" | "limit_cap_paise" | "pause_new_loans";
  value: number;
  reason: string;
  maker_id: string;
  checker_id: string | null;
  status: "pending" | "approved" | "rejected" | "revoked";
  created_at: string | null;
  decided_at: string | null;
  expires_at: string;
}

export interface AuditEntry { id: string; actor_id: string; action: string; at: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null }

export interface ConfigView {
  active: { hash: string; scorecard_version: string; policy_version: string; scorecard_yaml: string; policy_yaml: string };
  history: { hash: string; scorecard_version: string; policy_version: string; first_seen_at: string }[];
}

export interface DryRun {
  active_hash: string;
  candidate: { hash: string; scorecard_version: string; policy_version: string };
  window_days: number;
  users_checked: number;
  band_changes: Record<string, number>;
  users_changing_band: number;
  level_changes: Record<string, number>;
  eligibility_changes: Record<string, number>;
  sample: { user: string; krs: [number, number]; band: [string, string]; level: [string | null, string | null] }[];
}

export interface SimResult {
  at: string;
  current: { krs: number; band: string; aura: number; tier: string; knockouts: string[] };
  projected: { krs: number; band: string; aura: number; tier: string; knockouts: string[] };
  aura_change: number;
}
