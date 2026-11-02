/**
 * The audit log is append-only: payments, refunds, overrides, role switches and settlements write an entry, and
 * nothing in the app edits or removes one. The only way to add is `appendAudit`; there is deliberately no remove.
 */
import type { WorldAuditEntry } from "./types";

export type AuditInput = Omit<WorldAuditEntry, "id">;

export function appendAudit(log: readonly WorldAuditEntry[], entry: AuditInput, seq: number): WorldAuditEntry[] {
  return [...log, { id: `A-${String(seq).padStart(6, "0")}`, ...entry }];
}
