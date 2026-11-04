/**
 * PDF downloads: a stall's settlement report and a student's statement. Browser-side, no server. Every page is marked
 * as simulated. The built-in PDF fonts have no rupee sign or bullet, so amounts read "Rs" and masked values use "*".
 */
import { amountDue } from "../domain/selectors";
import { fmtDate, fmtDateTime } from "../domain/time";
import type { Settlement, WorldState } from "../domain/types";

const ascii = (s: string) => s.replaceAll("₹", "Rs ").replaceAll("•", "*").replace(/[^\x20-\x7E]/g, "?");

type Doc = import("jspdf").jsPDF;

/** A tiny line-by-line writer with page breaks and the simulated mark on every page. */
class Writer {
  y = 56;
  constructor(private doc: Doc, private title: string) {
    this.header();
  }
  private header() {
    this.doc.setFont("helvetica", "bold").setFontSize(15).text(ascii(this.title), 40, 40);
    this.y = 64;
  }
  line(text: string, opts: { bold?: boolean; size?: number; gap?: number } = {}) {
    const size = opts.size ?? 10;
    if (this.y > 800) {
      this.doc.addPage();
      this.header();
    }
    this.doc.setFont("helvetica", opts.bold ? "bold" : "normal").setFontSize(size);
    for (const part of this.doc.splitTextToSize(ascii(text), 515) as string[]) {
      this.doc.text(part, 40, this.y);
      this.y += size + 4;
    }
    this.y += opts.gap ?? 0;
  }
}

async function newDoc(): Promise<Doc> {
  const { jsPDF } = await import("jspdf");
  return new jsPDF({ unit: "pt", format: "a4" });
}

/** The nightly settlement report for one stall: instruction totals, status, and every payment and adjustment in it. */
export async function settlementPdf(w: WorldState, settlements: Settlement[]): Promise<Doc> {
  const doc = await newDoc();
  const wr = new Writer(doc, "Settlement report");
  wr.line("Instructions reported to the lending partner. Kredo does not hold or move this money.", { gap: 6 });
  for (const s of settlements) {
    const vendor = w.vendors[s.vendorId]?.stallName ?? s.vendorId;
    wr.line(`${vendor}: ${fmtDate(s.date)}`, { bold: true, size: 12 });
    wr.line(`Settlement ${s.id}. Status: ${s.status}${s.reference ? `. Reference ${s.reference}` : ""}${s.failureReason ? `. ${s.failureReason}` : ""}`);
    wr.line(`Payments ${s.count}. Gross Rs ${s.grossCoins}. Refunds Rs ${s.refundCoins}. Adjustments Rs ${s.adjustmentCoins}. Total Rs ${s.totalAmount}. Bank account ${s.bankMasked}.`, { bold: true, gap: 4 });
    for (const id of s.loanIds) {
      const l = w.loans[id];
      const who = l ? w.students[l.studentId] : undefined;
      if (l) wr.line(`${fmtDateTime(l.createdAt)}   ${l.id}   ${who ? `${who.firstName} ${who.lastInitial}. (${who.idMasked.slice(-4)})` : "Student"}   Rs ${l.coins}`);
    }
    for (const id of s.adjustmentIds) {
      const a = w.adjustments.find((x) => x.id === id);
      if (a) wr.line(`${fmtDateTime(a.createdAt)}   Adjustment ${a.id}   ${a.reason}   Rs ${a.coins}`);
    }
    wr.line("", { gap: 6 });
  }
  return doc;
}

/** A student's statement: each payment with its costs and due date, then the repayments. */
export async function statementPdf(w: WorldState, studentId: string): Promise<Doc> {
  const doc = await newDoc();
  const s = w.students[studentId];
  const wr = new Writer(doc, "Statement");
  wr.line(`${s ? `${s.firstName} ${s.lastInitial}.` : "Student"}   Generated ${fmtDateTime(w.clock.now)} (simulated clock)`, { bold: true, gap: 4 });
  wr.line("Coins are a display unit: 1 coin is Rs 1. You repay the lending partner directly.", { gap: 6 });
  const loans = Object.values(w.loans).filter((l) => l.studentId === studentId).sort((a, b) => b.createdAt - a.createdAt);
  wr.line("Payments", { bold: true, size: 12 });
  if (!loans.length) wr.line("No payments yet.");
  for (const l of loans) {
    wr.line(`${fmtDateTime(l.createdAt)}   ${l.id}   ${w.vendors[l.vendorId]?.stallName ?? "Stall"}`, { bold: true });
    wr.line(`Amount Rs ${l.coins}, fee Rs ${l.fee}, interest Rs ${l.interest}, total Rs ${l.totalRepayable}. Repay by ${fmtDate(l.dueDate)}. Repaid Rs ${l.repaid}. Still to repay Rs ${amountDue(l)}. Status ${l.status}.`, { gap: 2 });
  }
  wr.line("", { gap: 4 });
  wr.line("Repayments", { bold: true, size: 12 });
  const reps = w.repayments.filter((r) => r.studentId === studentId).sort((a, b) => b.at - a.at);
  if (!reps.length) wr.line("No repayments yet.");
  for (const r of reps) wr.line(`${fmtDateTime(r.at)}   ${r.loanId}   Rs ${r.amount}   (fee ${r.applied.fee}, interest ${r.applied.interest}, amount ${r.applied.principal})`);
  return doc;
}

/** Browser download of a finished PDF. */
export function downloadPdf(filename: string, doc: Doc): void {
  doc.save(filename);
}
