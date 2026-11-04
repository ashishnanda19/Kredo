import type { OpsRole } from "./mock-ops";

/** Role-based UI rules for the internal tools. These drive what is enabled, hidden or restricted. */
export const CAN = {
  decideVerification: ["reviewer", "admin"],
  fraudPage: ["fraud", "admin"],
  loanActions: ["admin", "support"],
  reconFlag: ["admin", "fraud"],
  limitOverride: ["admin", "risk_admin"],
  settlementRetry: ["admin", "support"],
  refundDecide: ["admin", "support"],
  supportEdit: ["support", "admin"],
  seeSensitive: ["support", "admin"],
  export: ["admin", "reviewer", "fraud"],
  /* risk console: mirrors the score service's capabilities (services/score/app/api/ops_auth.py), which enforce them */
  riskView: ["risk_analyst", "risk_admin", "admin", "fraud"],
  monitoringView: ["reviewer", "fraud", "support", "admin", "risk_analyst", "risk_admin"],
  overridesView: ["risk_analyst", "risk_admin", "admin"],
  overridesCreate: ["risk_analyst", "risk_admin"],
  overridesDecide: ["risk_admin"],
  configView: ["risk_analyst", "risk_admin", "admin"],
  configDryRun: ["risk_analyst", "risk_admin"],
  alertsView: ["reviewer", "fraud", "support", "admin", "risk_analyst", "risk_admin"],
  alertsDecide: ["fraud", "risk_admin"],
  alertsLiftRequest: ["fraud", "risk_analyst", "risk_admin"],
  alertsLiftDecide: ["risk_admin"],
} as const satisfies Record<string, readonly OpsRole[]>;

export type Capability = keyof typeof CAN;

export const can = (role: OpsRole, cap: Capability) => (CAN[cap] as readonly OpsRole[]).includes(role);

export const ROLE_LABEL: Record<OpsRole, string> = { reviewer: "Verification reviewer", fraud: "Fraud analyst", support: "Support agent", admin: "Admin", risk_analyst: "Risk analyst", risk_admin: "Risk admin" };
