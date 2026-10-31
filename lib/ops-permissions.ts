import type { OpsRole } from "./mock-ops";

/** Role-based UI rules for the internal tools. These drive what is enabled, hidden or restricted. */
export const CAN = {
  decideVerification: ["reviewer", "admin"],
  fraudPage: ["fraud", "admin"],
  loanActions: ["admin", "support"],
  reconFlag: ["admin", "fraud"],
  supportEdit: ["support", "admin"],
  seeSensitive: ["support", "admin"],
  export: ["admin", "reviewer", "fraud"],
} as const satisfies Record<string, readonly OpsRole[]>;

export type Capability = keyof typeof CAN;

export const can = (role: OpsRole, cap: Capability) => (CAN[cap] as readonly OpsRole[]).includes(role);

export const ROLE_LABEL: Record<OpsRole, string> = { reviewer: "Verification reviewer", fraud: "Fraud analyst", support: "Support agent", admin: "Admin" };
