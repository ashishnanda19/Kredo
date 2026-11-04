/**
 * The pitch storyline: 11 repeatable scripts (docs/MVP_DEMO_PROMPT.md, B11). Each is a list of steps with a caption and
 * an action on the demo world. They are written against a small `ScenarioCtx` so the same script runs in the browser
 * (the Demo Stage) and in unit tests, with no screen.
 *
 * Every scenario starts from a fresh seed by default (the runner resets first), so each shows the seeded persona
 * exactly as described and no scenario depends on another. Nothing here moves money: payments and repayments go
 * through the same domain functions the app uses, and settlement is only an instruction to the (mock) lender.
 */
import type { NbfcScenario } from "../api/nbfc-port";
import { postDefaultCap } from "../aura/engine";
import { payByQr, precheckPay, quote } from "../domain/pay";
import { refundPayment } from "../domain/refunds";
import { ladderView } from "../domain/limit";
import { recoveryPlan } from "../domain/recovery";
import { amountDue, availableLimit, awaitingSettlement, blockedReason, isOpen, loansOfStudent, studentState } from "../domain/selectors";
import { DAY, HOUR, fmtDate, istStartOf } from "../domain/time";
import type { Loan, WorldState } from "../domain/types";
import { acceptAgreement, decideVendor, recordVendorBank, recordVendorKyc, saveStallDetails, submitVendor } from "../domain/vendors";
import { awardQuest, repayLoan } from "../domain/world";
import { getPolicy } from "../policy";
import { qrPayload } from "../qr";
import { downloadText, linesCsv, reportJson } from "../settlement-report";

export interface StepAction {
  label: string;
  run: () => void;
}

export interface ScenarioCtx {
  world(): WorldState;
  update(fn: (w: WorldState) => WorldState): void;
  /** Moves the simulated clock, runs the scheduled work, and lets the (mock) lender answer any settlement. */
  advanceTo(ms: number, label: string): Promise<void>;
  setLender(answer: NbfcScenario): void;
  /** What the two phone frames show. */
  student(studentId: string, path?: string): void;
  vendor(vendorId: string, path?: string): void;
  /** Opens an ops screen in a new tab, signed in as an ops admin. */
  ops(path: string): void;
  /** Values a scenario keeps between its own steps. */
  memo: Record<string, string>;
}

export interface ScenarioStep {
  caption: string;
  /** Does the step. The returned text is shown under the caption as what happened. */
  run: (ctx: ScenarioCtx) => Promise<string | void> | string | void;
  /** Extra buttons for the presenter after the step ran (for example, downloading the settlement report). */
  actions?: (ctx: ScenarioCtx) => StepAction[];
}

export interface Scenario {
  id: string;
  n: number;
  title: string;
  blurb: string;
  steps: ScenarioStep[];
}

// helpers ------------------------------------------------------------------------------------------------------------

const GUPTA = "ven-gupta-chai";
const PRINT = "ven-print-hub";
const key = (ctx: ScenarioCtx, tag: string) => `sc-${tag}-${ctx.world().seq}`;
const name = (ctx: ScenarioCtx, id: string) => ctx.world().students[id]?.firstName ?? id;
const stall = (ctx: ScenarioCtx, id: string) => ctx.world().vendors[id]?.stallName ?? id;
const qrOf = (ctx: ScenarioCtx, vendorId: string) => qrPayload(vendorId, ctx.world().vendors[vendorId].qrVersion);
const earliestOpen = (ctx: ScenarioCtx, studentId: string): Loan | undefined => loansOfStudent(ctx.world(), studentId).filter(isOpen).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id))[0];

function pay(ctx: ScenarioCtx, studentId: string, vendorId: string, coins: number, tag: string) {
  const r = payByQr(ctx.world(), { studentId, qr: qrOf(ctx, vendorId), coins, idempotencyKey: key(ctx, tag) });
  ctx.update(() => r.world);
  if (!r.ok) throw new Error(`${r.code}: ${r.message}`);
  return r;
}

/** Repays every open loan of the student in full, in due-date order. Returns what the Aura engine said. */
function repayAll(ctx: ScenarioCtx, studentId: string, only?: Loan) {
  const events: { explanation: string; delta: number }[] = [];
  let paid = 0;
  const loans = only ? [only] : loansOfStudent(ctx.world(), studentId).filter(isOpen).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  for (const l of loans) {
    const due = amountDue(ctx.world().loans[l.id]);
    if (due <= 0) continue;
    const r = repayLoan(ctx.world(), { loanId: l.id, amount: due, idempotencyKey: key(ctx, `repay-${l.id}`) });
    ctx.update(() => r.world);
    paid += due;
    for (const e of r.events) events.push({ explanation: e.explanation, delta: e.delta });
  }
  return { paid, events };
}

const eventLine = (events: { explanation: string; delta: number }[]) => events.filter((e) => e.delta !== 0).map((e) => `${e.delta > 0 ? "+" : ""}${e.delta}: ${e.explanation}`).join(" ");
const settlementReportActions = (ctx: ScenarioCtx, vendorId: string): StepAction[] => {
  const w = ctx.world();
  const mine = Object.values(w.settlements).filter((s) => s.vendorId === vendorId).sort((a, b) => b.date.localeCompare(a.date));
  if (!mine.length) return [];
  const day = mine.filter((s) => s.date === mine[0].date);
  return [
    { label: "Download the settlement report (CSV)", run: () => downloadText(`settlement-lines-${mine[0].date}.csv`, linesCsv(w, day), "text/csv") },
    { label: "Download the instructions (JSON)", run: () => downloadText(`settlements-${mine[0].date}.json`, reportJson(w, day), "application/json") },
  ];
};

// the scenarios ------------------------------------------------------------------------------------------------------

export const SCENARIOS: Scenario[] = [
  {
    id: "onboarding",
    n: 1,
    title: "Onboarding in 30 seconds",
    blurb: "A new stall gets a verified QR. A new student starts at the first limit.",
    steps: [
      {
        caption: "Nisha runs a roll stall. She enters her details, an ID check, and a ₹1 bank check.",
        run: (ctx) => {
          const taken = Object.values(ctx.world().vendors).filter((v) => v.stallName.startsWith("Nisha's Rolls")).length;
          const stallName = taken ? `Nisha's Rolls ${taken + 1}` : "Nisha's Rolls";
          const made = saveStallDetails(ctx.world(), { details: { ownerName: "Nisha Rao", stallName, category: "food", campusArea: "Main gate", hours: "9am to 6pm" }, phoneMasked: "+91 98••• ••412", studentId: null });
          let w = recordVendorKyc(made.world, made.vendorId, { idLast4: "4821", hasBusinessProof: true, outcome: "verified" });
          w = recordVendorBank(w, made.vendorId, { accountLast4: "9034", ifsc: "DEMO0001234", outcome: "success", holderName: "Nisha Rao" });
          ctx.update(() => w);
          ctx.memo.vendorId = made.vendorId;
          ctx.vendor(made.vendorId, "/vendor/onboarding/status");
          return "ID confirmed. Bank check passed: the name on the account matched. Daily receiving limit: ₹20,000.";
        },
      },
      {
        caption: "She accepts the agreement and submits. Review is fast-forwarded: accepted. Her QR is generated only now.",
        run: (ctx) => {
          const id = ctx.memo.vendorId;
          let w = acceptAgreement(ctx.world(), id);
          w = submitVendor(w, id);
          w = decideVendor(w, id, "accept", "demo-director");
          ctx.update(() => w);
          ctx.vendor(id, "/vendor/qr");
          return `${stall(ctx, id)} is live. QR version ${ctx.world().vendors[id].qrVersion}, signed and versioned.`;
        },
      },
      {
        caption: "Aarav, a new student, is verified. He starts at the first limit with a starter Aura.",
        run: (ctx) => {
          ctx.student("stu-aarav", "/dashboard");
          const s = studentState(ctx.world(), "stu-aarav");
          return `Limit ${s.limit} coins (₹${s.limit}), Aura ${s.aura}.`;
        },
      },
    ],
  },
  {
    id: "happy-path",
    n: 2,
    title: "The happy path",
    blurb: "Aarav pays Gupta Chai Tapri 40 coins. The vendor's phone updates at once.",
    steps: [
      {
        caption: "Aarav scans Gupta Chai Tapri's QR.",
        run: (ctx) => {
          ctx.student("stu-aarav", "/dashboard/pay");
          ctx.vendor(GUPTA, "/vendor");
          return `Stall checked: ${stall(ctx, GUPTA)} is active and under its daily limit.`;
        },
      },
      {
        caption: "He pays 40 coins. Before confirming he sees the fee, the total and the due date.",
        run: (ctx) => {
          const q = quote(ctx.world(), "stu-aarav", 40);
          const r = pay(ctx, "stu-aarav", GUPTA, 40, "happy");
          ctx.student("stu-aarav", "/dashboard/loans");
          return `Amount ₹${q.coins}, fee ₹${q.fee}, interest ₹${q.interest}. Total to repay ₹${r.loan.totalRepayable} by ${fmtDate(r.loan.dueDate)}. The stall's feed just updated.`;
        },
      },
      {
        caption: "The ledger shows the loan. In the diagram, Kredo records and scores. No money touches Kredo.",
        run: (ctx) => `Aarav can still spend ${availableLimit(ctx.world(), "stu-aarav")} coins.`,
      },
    ],
  },
  {
    id: "midnight",
    n: 3,
    title: "Twelve hours later",
    blurb: "Twelve hours after each payment, the lending partner is told to pay the stall for it.",
    steps: [
      {
        caption: "A payment is made at Gupta Chai Tapri during the day.",
        run: (ctx) => {
          pay(ctx, "stu-aarav", GUPTA, 40, "midnight");
          ctx.vendor(GUPTA, "/vendor/settlements");
          ctx.student("stu-aarav", "/dashboard/loans");
          return `Awaiting settlement at ${stall(ctx, GUPTA)}: ₹${awaitingSettlement(ctx.world(), GUPTA)}.`;
        },
      },
      {
        caption: "Jump 12 hours ahead. The payment falls due and Kredo hands the lending partner an instruction for it.",
        run: async (ctx) => {
          ctx.setLender("paid");
          await ctx.advanceTo(ctx.world().clock.now + SETTLE_DELAY, "+12 hours");
          const s = lastSettlement(ctx, GUPTA);
          ctx.vendor(GUPTA, "/vendor/settlements");
          return `${stall(ctx, GUPTA)}: ₹${s.totalAmount} for that payment. The lending partner paid it. Reference ${s.reference}. Kredo moved no money.`;
        },
        actions: (ctx) => settlementReportActions(ctx, GUPTA),
      },
    ],
  },
  {
    id: "repay-on-time",
    n: 4,
    title: "Repay on time",
    blurb: "Aarav repays on the due date. His Aura goes up and he moves toward the next limit.",
    steps: [
      {
        caption: "Aarav paid 40 coins at Gupta Chai Tapri at the start of the demo.",
        run: (ctx) => {
          const r = pay(ctx, "stu-aarav", GUPTA, 40, "ontime");
          ctx.student("stu-aarav", "/dashboard/loans");
          return `Due ${fmtDate(r.loan.dueDate)}. Aura ${studentState(ctx.world(), "stu-aarav").aura}.`;
        },
      },
      {
        caption: "Jump to the due date. Reminders went out three days and one day before.",
        run: async (ctx) => {
          const l = earliestOpen(ctx, "stu-aarav")!;
          await ctx.advanceTo(istStartOf(l.dueDate, 9), "To due date");
          const n = ctx.world().notifications.filter((x) => x.accountId === ctx.world().students["stu-aarav"].accountId && x.kind === "reminder").length;
          return `${n} reminders in his notification tray. ₹${amountDue(ctx.world().loans[l.id])} is due today.`;
        },
      },
      {
        caption: "He repays. The Aura engine adds points and says why.",
        run: (ctx) => {
          const before = studentState(ctx.world(), "stu-aarav").aura;
          const r = repayAll(ctx, "stu-aarav");
          const s = studentState(ctx.world(), "stu-aarav");
          ctx.student("stu-aarav", "/dashboard/aura");
          return `Repaid ₹${r.paid}. Aura ${before} to ${s.aura}. ${eventLine(r.events)} Streak: ${s.consecutiveOnTime}. Next limit step: ${ladderView(ctx.world(), "stu-aarav").needs[0] ?? "nothing else needed"}.`;
        },
      },
    ],
  },
  {
    id: "late-payer",
    n: 5,
    title: "Late payer",
    blurb: "Meera repays 6 days late. Aura drops a little, with a plain reason.",
    steps: [
      {
        caption: "Meera has a payment 2 days overdue. New spends are paused until it's paid.",
        run: (ctx) => {
          ctx.student("stu-meera", "/dashboard");
          return `${blockedReason(ctx.world(), "stu-meera")?.message ?? "Not blocked."} Aura ${studentState(ctx.world(), "stu-meera").aura}.`;
        },
      },
      {
        caption: "Jump to 6 days past the due date.",
        run: async (ctx) => {
          const l = earliestOpen(ctx, "stu-meera")!;
          const before = studentState(ctx.world(), "stu-meera").aura;
          await ctx.advanceTo(istStartOf(l.dueDate, 9) + 6 * DAY + 3 * 3_600_000, "6 days past due");
          const after = studentState(ctx.world(), "stu-meera").aura;
          return `Reminders were sent after 1 and 3 days. ₹${amountDue(ctx.world().loans[l.id])} is still owed.${after !== before ? ` Her Aura moved ${before} to ${after} on its own: an older event passed 90 days and now counts for half.` : ""}`;
        },
      },
      {
        caption: "She repays. A late repayment costs a few Aura points, and the screen says exactly why, without blame.",
        run: (ctx) => {
          const before = studentState(ctx.world(), "stu-meera").aura;
          const r = repayAll(ctx, "stu-meera");
          const after = studentState(ctx.world(), "stu-meera").aura;
          ctx.student("stu-meera", "/dashboard/aura");
          return `Repaid ₹${r.paid}. Aura ${before} to ${after}. ${eventLine(r.events)} Paying promptly limits the effect, and it recovers with on-time repayments.`;
        },
      },
    ],
  },
  {
    id: "default-and-block",
    n: 6,
    title: "Default and block",
    blurb: "Ishita is 35 days overdue and blocked. The recovery path gets her back, one capped step at a time.",
    steps: [
      {
        caption: "Ishita is 35 days overdue. Her Aura is 15 and new spends are paused. The wording stays calm.",
        run: (ctx) => {
          ctx.student("stu-ishita", "/dashboard");
          const b = blockedReason(ctx.world(), "stu-ishita");
          return b ? `${b.message} Aura ${studentState(ctx.world(), "stu-ishita").aura}.` : "Ishita has already recovered in this demo. Reset the demo to play this one again.";
        },
      },
      {
        caption: "The way back is laid out in order, with an honest estimate and no countdown.",
        run: (ctx) => {
          ctx.student("stu-ishita", "/dashboard/recovery");
          const p = recoveryPlan(ctx.world(), "stu-ishita");
          return p.estimate;
        },
      },
      {
        caption: "Step 1: she pays what is overdue. Spending stays paused until her Aura is back at the minimum.",
        run: (ctx) => {
          const r = repayAll(ctx, "stu-ishita");
          return `Paid ₹${r.paid}. ${blockedReason(ctx.world(), "stu-ishita")?.message ?? "Spending is back."}`;
        },
      },
      {
        caption: "Step 2: quests that lower her risk. They're capped, and none are for opening the app.",
        run: (ctx) => {
          const before = studentState(ctx.world(), "stu-ishita").aura;
          for (const q of ["verify_identity", "verify_bank", "set_reminders"] as const) {
            if (!blockedReason(ctx.world(), "stu-ishita")) break;
            ctx.update((w) => awardQuest(w, "stu-ishita", q).world);
          }
          ctx.student("stu-ishita", "/dashboard/recovery");
          const after = studentState(ctx.world(), "stu-ishita").aura;
          return `Aura ${before} to ${after}. ${blockedReason(ctx.world(), "stu-ishita") ? "Still below the minimum: the optional ₹50 proof-of-repayment payment is the next step." : "Back above the minimum. Spending is back."}`;
        },
      },
    ],
  },
  {
    id: "prior-default-cap",
    n: 7,
    title: "Prior default cap",
    blurb: "Kabir cleared a default. Each payment is capped while he rebuilds.",
    steps: [
      {
        caption: "Kabir defaulted 40 days ago and has since paid it in full. A cap on each payment applies while he rebuilds.",
        run: (ctx) => {
          ctx.student("stu-kabir", "/dashboard/limit");
          const cap = postDefaultCap(studentState(ctx.world(), "stu-kabir"));
          return `Per-payment cap: ${cap} coins. Limit: ${studentState(ctx.world(), "stu-kabir").limit} coins.`;
        },
      },
      {
        caption: "He tries to pay ₹800. It's declined, with the reason and the code. It is never silently reduced.",
        run: (ctx) => {
          ctx.student("stu-kabir", "/dashboard/pay");
          const r = precheckPay(ctx.world(), { studentId: "stu-kabir", qr: qrOf(ctx, GUPTA), coins: 800 });
          return r.ok ? "Unexpectedly allowed." : `Declined (${r.code}): ${r.message}`;
        },
      },
      {
        caption: "He pays ₹300 instead. That is within the cap, so it goes through.",
        run: (ctx) => {
          const r = pay(ctx, "stu-kabir", GUPTA, 300, "cap");
          ctx.student("stu-kabir", "/dashboard/loans");
          return `Allowed. Total to repay ₹${r.loan.totalRepayable} by ${fmtDate(r.loan.dueDate)}.`;
        },
      },
    ],
  },
  {
    id: "limit-growth",
    n: 8,
    title: "Limit growth",
    blurb: "Rohan is one on-time repayment from the next step. His limit grows and he's told.",
    steps: [
      {
        caption: "Rohan has repaid on time for weeks. One more on-time repayment moves him up a step.",
        run: (ctx) => {
          ctx.student("stu-rohan", "/dashboard/limit");
          const v = ladderView(ctx.world(), "stu-rohan");
          return `Limit ${v.currentLimit} coins. Next step ${v.nextLimit} coins needs: ${v.needs.join("; ") || "nothing else"}.`;
        },
      },
      {
        caption: "Jump to the due date of the payment he has open.",
        run: async (ctx) => {
          const l = earliestOpen(ctx, "stu-rohan")!;
          await ctx.advanceTo(istStartOf(l.dueDate, 9), "To due date");
          return `₹${amountDue(ctx.world().loans[l.id])} is due today.`;
        },
      },
      {
        caption: "He repays on time. His limit goes up, with a notice.",
        run: (ctx) => {
          const before = studentState(ctx.world(), "stu-rohan").limit;
          const l = earliestOpen(ctx, "stu-rohan")!;
          const r = repayAll(ctx, "stu-rohan", l);
          const after = studentState(ctx.world(), "stu-rohan").limit;
          ctx.student("stu-rohan", "/dashboard/limit");
          const note = ctx.world().notifications.filter((n) => n.kind === "limit_up").at(-1)?.body ?? "";
          return `Repaid ₹${r.paid}. Limit ${before} to ${after} coins. Notice: "${note}"`;
        },
      },
    ],
  },
  {
    id: "fraud-catch",
    n: 9,
    title: "Fraud catch",
    blurb: "A student can't pay their own stall, and a suspended stall's QR is refused.",
    steps: [
      {
        caption: "Vikram is a student who also runs Stationery Corner. He tries to pay his own stall.",
        run: (ctx) => {
          ctx.student("stu-vikram", "/dashboard/pay");
          ctx.vendor("ven-stationery", "/vendor");
          const r = precheckPay(ctx.world(), { studentId: "stu-vikram", qr: qrOf(ctx, "ven-stationery"), coins: 50 });
          ctx.update(() => r.world);
          return r.ok ? "Unexpectedly allowed." : `Blocked (${r.code}): ${r.message} A fraud flag was raised for review.`;
        },
      },
      {
        caption: "Aarav scans the QR of a suspended stall. It's refused.",
        run: (ctx) => {
          ctx.student("stu-aarav", "/dashboard/pay");
          ctx.vendor("ven-night-canteen", "/vendor");
          const r = precheckPay(ctx.world(), { studentId: "stu-aarav", qr: qrOf(ctx, "ven-night-canteen"), coins: 40 });
          return r.ok ? "Unexpectedly allowed." : `Refused (${r.code}): ${r.message}`;
        },
      },
      {
        caption: "Ops sees the flag with who, which stall and why.",
        run: (ctx) => {
          const f = ctx.world().flags.filter((x) => x.status === "open");
          return `${f.length} open flag${f.length === 1 ? "" : "s"}: ${f.map((x) => `${name(ctx, x.studentId)} and ${stall(ctx, x.vendorId)} (${x.kind})`).join("; ")}.`;
        },
        actions: (ctx) => [{ label: "Open the payment flags in the ops console", run: () => ctx.ops("/ops/flags") }],
      },
    ],
  },
  {
    id: "idempotent-retry",
    n: 10,
    title: "Idempotent retry",
    blurb: "The connection drops mid-payment. Retrying can't charge twice.",
    steps: [
      {
        caption: "Aarav pays 60 coins. The server records it, but the connection drops before his phone hears back.",
        run: (ctx) => {
          ctx.student("stu-aarav", "/dashboard/pay");
          ctx.vendor(GUPTA, "/vendor");
          const r = payByQr(ctx.world(), { studentId: "stu-aarav", qr: qrOf(ctx, GUPTA), coins: 60, idempotencyKey: "sc-idempotent-retry" });
          ctx.update(() => r.world);
          if (!r.ok) throw new Error(r.message);
          return "Payment recorded on the server. His phone shows: 'We didn't hear back. Retrying is safe.'";
        },
      },
      {
        caption: "He taps Retry. The same request key is sent, so the server returns the same loan.",
        run: (ctx) => {
          const r = payByQr(ctx.world(), { studentId: "stu-aarav", qr: qrOf(ctx, GUPTA), coins: 60, idempotencyKey: "sc-idempotent-retry" });
          ctx.update(() => r.world);
          ctx.student("stu-aarav", "/dashboard/loans");
          const n = loansOfStudent(ctx.world(), "stu-aarav").length;
          return `${r.ok && r.duplicate ? "Same loan returned." : "A second loan was created."} Loans for Aarav: ${n}. Available: ${availableLimit(ctx.world(), "stu-aarav")} coins.`;
        },
      },
    ],
  },
  {
    id: "refund",
    n: 11,
    title: "Dispute and refund",
    blurb: "A refund within the 12 hours drops the payment from settlement. After settlement it becomes an adjustment.",
    steps: [
      {
        caption: "Diya pays Campus Print Hub 80 coins, and later 120 coins.",
        run: (ctx) => {
          ctx.vendor(PRINT, "/vendor/payments");
          ctx.student("stu-diya", "/dashboard/loans");
          const base = awaitingSettlement(ctx.world(), PRINT);
          pay(ctx, "stu-diya", PRINT, 80, "refund-a");
          pay(ctx, "stu-diya", PRINT, 120, "refund-b");
          ctx.memo.base = String(base);
          return `Awaiting settlement at ${stall(ctx, PRINT)}: ₹${base} to ₹${awaitingSettlement(ctx.world(), PRINT)}.`;
        },
      },
      {
        caption: "The stall refunds the 80 coin payment within the 12 hours. It simply never gets settled.",
        run: (ctx) => {
          const loan = Object.values(ctx.world().loans).find((l) => l.idempotencyKey.startsWith("sc-refund-a"))!;
          const r = refundPayment(ctx.world(), { loanId: loan.id, vendorId: PRINT, reason: "Wrong order", actor: PRINT });
          ctx.update(() => r.world);
          return `Awaiting settlement now ₹${awaitingSettlement(ctx.world(), PRINT)}. Diya no longer owes that payment, with its fee and interest, and was told.`;
        },
      },
      {
        caption: "Twelve hours on. Only the 120 coin payment is settled, and the lending partner is told just that.",
        run: async (ctx) => {
          await ctx.advanceTo(ctx.world().clock.now + SETTLE_DELAY, "+12 hours");
          const s = settlementOfPayment(ctx, "refund-b");
          ctx.vendor(PRINT, "/vendor/settlements");
          return `Settlement ₹${s.totalAmount} for the 120 coin payment. The refunded 80 was never reported.`;
        },
      },
      {
        caption: "Later the stall refunds the 120 coin payment. It was already settled, so it becomes a negative adjustment.",
        run: (ctx) => {
          const loan = Object.values(ctx.world().loans).find((l) => l.idempotencyKey.startsWith("sc-refund-b"))!;
          const r = refundPayment(ctx.world(), { loanId: loan.id, vendorId: PRINT, reason: "Cancelled order", actor: PRINT });
          ctx.update(() => r.world);
          return `${r.refund.mode === "post_settlement" ? "Taken off the next payout: -120." : "Unexpected mode."}`;
        },
      },
      {
        caption: "A new payment is made. Twelve hours later it is settled with the adjustment netted off.",
        run: async (ctx) => {
          pay(ctx, "stu-diya", PRINT, 200, "refund-c");
          await ctx.advanceTo(ctx.world().clock.now + SETTLE_DELAY, "+12 hours");
          const s = settlementOfPayment(ctx, "refund-c");
          return `Settlement ₹${s.totalAmount} = 200 payment - ${-s.adjustmentCoins} adjustment.`;
        },
        actions: (ctx) => settlementReportActions(ctx, PRINT),
      },
    ],
  },
];

const SETTLE_DELAY = getPolicy().settlement.delayHours * HOUR;

/** The newest settlement for a stall. */
function lastSettlement(ctx: ScenarioCtx, vendorId: string) {
  return Object.values(ctx.world().settlements).filter((x) => x.vendorId === vendorId).sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id))[0];
}

/** The settlement for the payment a scenario made with this key. */
function settlementOfPayment(ctx: ScenarioCtx, key: string) {
  const loan = Object.values(ctx.world().loans).find((l) => l.idempotencyKey.startsWith(`sc-${key}`))!;
  return ctx.world().settlements[loan.settlementId!];
}

export const scenarioByN = (n: number) => SCENARIOS.find((s) => s.n === n);
