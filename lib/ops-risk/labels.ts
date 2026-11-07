/** Readable names for the risk console (internal ops copy; plain English, no slang). */
import { formatINR } from "@/lib/format";

export const FACTOR_LABEL: Record<string, string> = {
  f1_ontime_rate: "F1 On-time rate",
  f2_worst_lateness: "F2 Worst lateness",
  f3_current_overdue: "F3 Current overdue",
  f4_payment_failures: "F4 Payment failures",
  f5_rollover: "F5 Rollover",
  f6_stacking: "F6 Stacking",
  f7_utilisation: "F7 Utilisation",
  f8_closure_quality: "F8 Closure quality",
  f9_track_record: "F9 Track record",
  f10_identity: "F10 Identity strength",
  f11_credit_hunger: "F11 Credit hunger",
  f12_bureau: "F12 Bureau",
};
export const FACTOR_ORDER = Object.keys(FACTOR_LABEL);

export const TIER_LABEL: Record<string, string> = {
  reset_arc: "Reset Arc",
  side_quest: "Side Quest",
  locked_in: "Locked In",
  main_character: "Main Character",
  aura_farmer: "Aura Farmer",
};

export const RULE_LABEL: Record<string, string> = {
  FARMING: "Score farming",
  COLLUSION: "Collusion cash-out",
  VENDOR_ANOMALY: "Vendor anomaly",
  VELOCITY: "Velocity",
  RING: "Identity ring",
  ROLLOVER: "Rollover chain",
};

export const SIGNAL_LABEL: Record<string, string> = {
  quick_repayments: "Coin spends repaid within 3 days",
  rollover_chain: "Coin spends reopened right after repaying",
  same_amount_spends: "Near-same spends at one vendor",
  spends_just_under_limit: "Spends just under the remaining limit",
  refund_soon_after_spend: "Refund soon after a spend",
  vendor_concentration: "One vendor takes most of the spend",
  vendor_volume_surge: "Vendor volume jumped week on week",
  spend_burst: "Many spends in minutes",
  many_campuses_one_day: "Spends on several campuses in a day",
  shared_identifier: "Identifier shared with other accounts",
};

export const KNOCKOUT_CODES = ["KO_OVERDUE_30", "KO_DPD90_12M", "KO_WRITTEN_OFF", "KO_FRAUD", "KO_KYC", "KO_DUPLICATE", "KO_CONSENT"];

export const EVENT_LABEL = (type: string) => type.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());

export const rupees = (paise: number | null | undefined) => (paise === null || paise === undefined ? "—" : formatINR(paise / 100));
export const pct = (x: number | null | undefined, digits = 1) => (x === null || x === undefined ? "—" : `${(x * 100).toFixed(digits)}%`);

/** Identifiers are masked by default in ops views. */
export const mask = (id: string | null | undefined) => (id ? `${id.slice(0, 4)}…${id.slice(-4)}` : "—");
