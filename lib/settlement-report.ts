/**
 * The settlement report: what Kredo sends the lender, as JSON, and as CSV for finance. Reports only; nothing here
 * moves money. Student names are the vendor-facing form (first name, last initial, last four of the ID).
 */
import { vendorFacingStudent } from "./domain/selectors";
import { fmtDateTime } from "./domain/time";
import { toInstruction } from "./settlement";
import type { Settlement, WorldState } from "./domain/types";

export const csvCell = (v: string | number): string => {
  const s = String(v);
  // a leading = + - @ can be read as a formula by a spreadsheet, so it is defused
  const safe = /^[=+\-@]/.test(s) && typeof v === "string" ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};
const row = (cells: (string | number)[]) => cells.map(csvCell).join(",");

/** The instructions as the lender receives them, plus the status Kredo holds for each. */
export function reportJson(w: WorldState, settlements: Settlement[]): string {
  return JSON.stringify(
    {
      generatedAt: new Date(w.clock.now).toISOString(),
      simulated: true,
      note: "Instructions to the lending partner. Kredo does not move this money.",
      settlements: settlements.map((s) => ({ ...toInstruction(s), status: s.status, reference: s.reference ?? null, failureReason: s.failureReason ?? null, refundCoins: s.refundCoins, adjustmentCoins: s.adjustmentCoins })),
    },
    null,
    2,
  );
}

/** One line per settlement. */
export function summaryCsv(w: WorldState, settlements: Settlement[]): string {
  const head = ["settlement_id", "business_date", "vendor", "payments", "gross_rupees", "refunds_rupees", "adjustments_rupees", "total_rupees", "bank_account", "status", "reference", "failure_reason"];
  const lines = settlements.map((s) => row([s.id, s.date, w.vendors[s.vendorId]?.stallName ?? s.vendorId, s.count, s.grossCoins, s.refundCoins, s.adjustmentCoins, s.totalAmount, s.bankMasked, s.status, s.reference ?? "", s.failureReason ?? ""]));
  return [row(head), ...lines].join("\n") + "\n";
}

/** One line per payment inside the settlements, then one per adjustment. */
export function linesCsv(w: WorldState, settlements: Settlement[]): string {
  const head = ["settlement_id", "business_date", "vendor", "type", "payment_id", "time", "student", "rupees"];
  const lines: string[] = [];
  for (const s of settlements) {
    const vendor = w.vendors[s.vendorId]?.stallName ?? s.vendorId;
    for (const id of s.loanIds) {
      const l = w.loans[id];
      if (l) lines.push(row([s.id, s.date, vendor, "payment", l.id, fmtDateTime(l.createdAt), vendorFacingStudent(w, l.studentId), l.coins]));
    }
    for (const id of s.adjustmentIds) {
      const a = w.adjustments.find((x) => x.id === id);
      if (a) lines.push(row([s.id, s.date, vendor, "adjustment", a.id, fmtDateTime(a.createdAt), a.reason, a.coins]));
    }
  }
  return [row(head), ...lines].join("\n") + "\n";
}

/** Browser download of a text file. */
export function downloadText(filename: string, text: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
