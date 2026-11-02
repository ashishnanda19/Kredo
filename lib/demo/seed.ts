/**
 * The seeded demo world (docs/MVP_DEMO_PROMPT.md, B5): a fictional campus with 8 stalls, 12 students and about 100 days
 * of history. EVERYTHING HERE IS FICTIONAL: names, stalls, banks, phone numbers and IDs are invented, and no real brand,
 * person or college appears.
 *
 * How it is built: not by writing numbers into state, but by RUNNING the real domain functions (createLoan,
 * repayLoan, awardQuest, advanceTo) through a scripted history on the simulated clock, with a fixed random seed for the
 * background activity. So the ledger, the nightly settlements and every student's Aura come out of the same code the
 * live demo uses, the totals reconcile by construction, and the same seed always gives the same world.
 *
 * Each persona's Aura and limit are not stored: the engine derives them from the score events the script causes. The
 * script is tuned so the engine lands on the numbers in B5 (Diya 68, Rohan 82, Meera 58, Kabir 31, Ishita 15, Neel 24,
 * Sana 74, Aarav 50). tests/unit/seed.test.ts pins them.
 */
import { produce } from "immer";
import { awardQuest, advanceTo, createLoan, emptyWorld, repayLoan } from "../domain/world";
import { amountDue } from "../domain/selectors";
import { DAY, addDays, istDate, istStartOf } from "../domain/time";
import type { Account, StudentProfile, VendorProfile, WorldState } from "../domain/types";
import { markProcessing, applySettlementResult } from "../settlement";
import { mockReference } from "../api/nbfc-port";
import type { QuestId } from "../policy";
import { getPolicy } from "../policy";
import { COLLEGE, SEED, SEED_HISTORY_DAYS, SEED_NOW } from "./constants";

/** Small, fast, deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// people ----------------------------------------------------------------------------------------------------------

const STUDENTS: { id: string; first: string; last: string; persona?: string; device?: string }[] = [
  { id: "stu-aarav", first: "Aarav", last: "S", persona: "aarav" },
  { id: "stu-diya", first: "Diya", last: "P", persona: "diya" },
  { id: "stu-rohan", first: "Rohan", last: "M", persona: "rohan" },
  { id: "stu-meera", first: "Meera", last: "K", persona: "meera" },
  { id: "stu-kabir", first: "Kabir", last: "R", persona: "kabir" },
  { id: "stu-ishita", first: "Ishita", last: "B", persona: "ishita" },
  { id: "stu-neel", first: "Neel", last: "D", persona: "neel" },
  { id: "stu-sana", first: "Sana", last: "V", persona: "sana" },
  { id: "stu-tanvi", first: "Tanvi", last: "G", persona: "tanvi" },
  { id: "stu-vikram", first: "Vikram", last: "J", persona: "vikram", device: "dev-vikram" },
  { id: "stu-zoya", first: "Zoya", last: "H", persona: "zoya" },
  { id: "stu-arjun", first: "Arjun", last: "T", persona: "arjun" },
];

type VendorSeed = Omit<VendorProfile, "accountId" | "dailyCap" | "qrVersion" | "bankVerified"> & { id: string; device?: string; verified?: boolean };

const VENDORS: VendorSeed[] = [
  { id: "ven-gupta-chai", stallName: "Gupta Chai Tapri", ownerName: "R. Gupta", category: "food", campusArea: "Main gate", hours: "7am to 10pm", bankMasked: "•••• 4821", verificationLevel: "light", status: "accepted" },
  { id: "ven-print-hub", stallName: "Campus Print Hub", ownerName: "A. Nair", category: "print", campusArea: "Library lane", hours: "9am to 8pm", bankMasked: "•••• 1190", verificationLevel: "full", status: "accepted" },
  { id: "ven-mess-thali", stallName: "Hostel Mess Thali", ownerName: "S. Yadav", category: "food", campusArea: "Hostel block A", hours: "11am to 3pm, 7pm to 10pm", bankMasked: "•••• 7302", verificationLevel: "full", status: "accepted" },
  { id: "ven-quickwash", stallName: "QuickWash Laundry", ownerName: "M. Iyer", category: "laundry", campusArea: "Hostel block B", hours: "8am to 7pm", bankMasked: "•••• 5566", verificationLevel: "full", status: "accepted" },
  { id: "ven-night-canteen", stallName: "Night Canteen", ownerName: "K. Das", category: "food", campusArea: "Sports ground", hours: "6pm to 2am", bankMasked: "•••• 9034", verificationLevel: "full", status: "suspended" },
  { id: "ven-stationery", stallName: "Stationery Corner", ownerName: "Vikram J", category: "stationery", campusArea: "Academic block", hours: "9am to 6pm", bankMasked: "•••• 2248", verificationLevel: "full", status: "accepted", device: "dev-vikram" },
  { id: "ven-juice", stallName: "Juice Junction", ownerName: "P. Menon", category: "food", campusArea: "Canteen court", hours: "10am to 7pm", bankMasked: "•••• 6615", verificationLevel: "light", status: "pending", verified: false },
  { id: "ven-book-barn", stallName: "Book Barn", ownerName: "T. Bose", category: "stationery", campusArea: "Library lane", hours: "10am to 7pm", bankMasked: "•••• 3377", verificationLevel: "light", status: "accepted" },
];

function addPeople(w: WorldState): WorldState {
  const p = getPolicy();
  return produce(w, (d) => {
    STUDENTS.forEach((s, i) => {
      const accountId = `acct-${s.id}`;
      const account: Account = { id: accountId, role: "student", displayName: `${s.first} ${s.last}.`, phoneMasked: `+91 9${i + 1}••• ••${200 + i}`, status: "accepted", ...(s.device ? { deviceLinkId: s.device } : {}), createdAt: d.clock.startedAt };
      const profile: StudentProfile = { accountId, firstName: s.first, lastInitial: s.last, college: COLLEGE, idMasked: `••••${String(2041 + i * 37).slice(-4)}`, verification: "accepted", ...(s.persona ? { persona: s.persona } : {}) };
      d.accounts[accountId] = account;
      d.students[s.id] = profile;
    });
    VENDORS.forEach((v, i) => {
      const accountId = `acct-${v.id}`;
      const verified = v.verified !== false;
      d.accounts[accountId] = { id: accountId, role: "vendor", displayName: v.stallName, phoneMasked: `+91 8${i + 1}••• ••${300 + i}`, status: v.status, ...(v.device ? { deviceLinkId: v.device } : {}), createdAt: d.clock.startedAt };
      d.vendors[v.id] = {
        accountId, stallName: v.stallName, ownerName: v.ownerName, category: v.category, campusArea: v.campusArea, hours: v.hours, bankMasked: v.bankMasked, bankVerified: verified,
        verificationLevel: v.verificationLevel, dailyCap: v.verificationLevel === "full" ? p.vendor.dailyCapCoins.full : p.vendor.dailyCapCoins.light, qrVersion: 1, status: v.status,
      };
    });
  });
}

// the script ------------------------------------------------------------------------------------------------------

type Run = (w: WorldState, refs: Map<string, string>) => WorldState;
interface Op {
  at: number;
  n: number;
  run: Run;
}

const V = { chai: "ven-gupta-chai", print: "ven-print-hub", mess: "ven-mess-thali", wash: "ven-quickwash", night: "ven-night-canteen", stat: "ven-stationery", book: "ven-book-barn" } as const;

class Script {
  ops: Op[] = [];
  private n = 0;
  constructor(private now: number) {}

  /** An instant `day` days from now (negative is the past) at `hour` India time. */
  at(day: number, hour: number): number {
    return istStartOf(addDays(istDate(this.now), day), hour);
  }

  private add(at: number, run: Run) {
    this.ops.push({ at, n: this.n++, run });
  }

  spend(ref: string, studentId: string, vendorId: string, coins: number, day: number, hour: number, term = 15, microSpend = false) {
    this.add(this.at(day, hour), (w, refs) => {
      const r = createLoan(w, { studentId, vendorId, coins, idempotencyKey: `seed:${ref}`, at: this.at(day, hour), termDays: term, microSpend });
      refs.set(ref, r.loan.id);
      return r.world;
    });
  }

  repay(ref: string, day: number, hour: number) {
    this.add(this.at(day, hour), (w, refs) => {
      const loan = w.loans[refs.get(ref)!];
      if (!loan) throw new Error(`seed: no loan for ${ref}`);
      return repayLoan(w, { loanId: loan.id, amount: amountDue(loan), at: this.at(day, hour), idempotencyKey: `seed:r:${ref}` }).world;
    });
  }

  quest(studentId: string, quest: QuestId, day: number, hour: number) {
    this.add(this.at(day, hour), (w) => {
      const r = awardQuest(w, studentId, quest, this.at(day, hour));
      if (!r.result.draft) throw new Error(`seed: quest ${quest} for ${studentId} was rejected (${r.result.rejected})`);
      return r.world;
    });
  }

  /** A 15-day loan repaid the day before it falls due: on time. */
  onTime(ref: string, studentId: string, vendorId: string, coins: number, repayDay: number, hour = 12) {
    this.spend(ref, studentId, vendorId, coins, repayDay - 14, 10);
    this.repay(ref, repayDay, hour);
  }

  /** A loan repaid on a chosen day, whatever that does to its timing. */
  paid(ref: string, studentId: string, vendorId: string, coins: number, spendDay: number, repayDay: number, hour = 12) {
    this.spend(ref, studentId, vendorId, coins, spendDay, 10);
    this.repay(ref, repayDay, hour);
  }
}

function personaScripts(s: Script) {
  // Aarav: just verified, nothing yet.

  // Diya: five on-time repayments (four earn points, the fifth falls inside the weekly window), one active loan.
  s.quest("stu-diya", "verify_identity", -85, 11);
  s.onTime("diya1", "stu-diya", V.print, 150, -69);
  s.onTime("diya2", "stu-diya", V.mess, 200, -61);
  s.onTime("diya3", "stu-diya", V.night, 120, -53);
  s.onTime("diya4", "stu-diya", V.stat, 250, -45);
  s.onTime("diya5", "stu-diya", V.chai, 90, -41);
  s.spend("diya-active", "stu-diya", V.mess, 140, -4, 13);

  // Rohan: seven scored on-time repayments in a row and the quests that go with them; the next on-time one steps the limit up.
  s.quest("stu-rohan", "verify_identity", -88, 11);
  s.quest("stu-rohan", "verify_bank", -72, 11);
  s.quest("stu-rohan", "set_reminders", -55, 11);
  [-84, -76, -68, -60, -52, -44, -36].forEach((day, i) => s.onTime(`rohan${i + 1}`, "stu-rohan", [V.wash, V.stat, V.mess, V.print, V.book, V.night, V.wash][i], 250 + (i % 3) * 50, day));
  s.spend("rohan-active-1", "stu-rohan", V.stat, 300, -6, 12);
  s.spend("rohan-active-2", "stu-rohan", V.mess, 220, -2, 20);

  // Meera: two scored on-time repayments, one repaid 4 days late, and one loan now 2 days overdue.
  s.quest("stu-meera", "verify_identity", -88, 11);
  s.quest("stu-meera", "verify_bank", -86, 11);
  s.quest("stu-meera", "set_reminders", -84, 11);
  s.onTime("meera1", "stu-meera", V.print, 200, -82);
  s.onTime("meera2", "stu-meera", V.mess, 250, -74);
  s.onTime("meera3", "stu-meera", V.chai, 80, -72);
  s.paid("meera-late", "stu-meera", V.wash, 220, -55, -36);
  s.spend("meera-overdue", "stu-meera", V.stat, 260, -17, 14);

  // Kabir: one on-time repayment, then a loan that was never paid and defaulted 40 days ago; cleared 35 days ago.
  s.onTime("kabir1", "stu-kabir", V.print, 300, -87);
  s.quest("stu-kabir", "verify_bank", -86, 10);
  s.spend("kabir-default", "stu-kabir", V.mess, 400, -86, 14);
  s.repay("kabir-default", -35, 12);

  // Ishita: a loan repaid 15 days late, then one for ₹900 that is now 35 days past due (defaulted 4 days ago).
  s.paid("ishita1", "stu-ishita", V.mess, 300, -80, -50, 11);
  s.spend("ishita-overdue", "stu-ishita", V.wash, 900, -50, 14);

  // Neel: a late repayment, a default (cleared), then capped quests and one small on-time repayment on the way back.
  s.paid("neel1", "stu-neel", V.print, 300, -90, -60, 11);
  s.spend("neel-default", "stu-neel", V.wash, 400, -65, 12);
  s.repay("neel-default", -15, 12);
  s.quest("stu-neel", "verify_identity", -14, 11);
  s.quest("stu-neel", "verify_bank", -10, 11);
  s.quest("stu-neel", "set_reminders", -6, 8);
  s.onTime("neel2", "stu-neel", V.chai, 50, -6, 11);

  // Sana: many small spends. Six repayments earn points (at most one a week); a pile of ten loans falls due together while
  // her limit is still ₹1,000, so it costs a little Aura (HIGH_UTIL) and is repaid a day late; her recent small spends are open.
  s.quest("stu-sana", "verify_identity", -60, 11);
  s.quest("stu-sana", "set_reminders", -55, 11);
  const sana = [[-54, 120, V.print], [-37, 140, V.mess], [-30, 100, V.stat], [-23, 160, V.wash], [-16, 110, V.book], [-9, 130, V.mess]] as const;
  sana.forEach(([day, coins, vendor], i) => {
    s.spend(`sana${i + 1}`, "stu-sana", vendor, coins, day - 15, 10);
    s.repay(`sana${i + 1}`, day, 12);
    if (i > 0) s.onTime(`sana-x${i + 1}`, "stu-sana", V.chai, 40, day + 1); // (none for the first: it would fall due while the pile is open)
  });
  for (let k = 0; k < 10; k++) {
    s.spend(`sana-pile${k}`, "stu-sana", [V.print, V.chai, V.mess, V.stat, V.book][k % 5], 95, -53, 10 + k);
    s.repay(`sana-pile${k}`, -37, 8);
  }
  [[-14, 8], [-13, 19], [-11, 9], [-9, 20], [-8, 13], [-6, 11], [-4, 18], [-3, 10], [-2, 12], [-1, 17], [0, 8]].forEach(([day, hour], i) =>
    s.spend(`sana-open${i}`, "stu-sana", [V.chai, V.print, V.mess, V.chai, V.stat][i % 5], 30 + (i % 4) * 15, day, hour),
  );
}

const TICKET: Record<string, [number, number]> = { [V.chai]: [10, 40], [V.print]: [5, 150], [V.mess]: [60, 120], [V.wash]: [80, 250], [V.night]: [40, 150], [V.stat]: [20, 300], [V.book]: [100, 400] };
const HOURS: Record<string, [number, number]> = { [V.chai]: [7, 21], [V.print]: [9, 19], [V.mess]: [12, 14], [V.wash]: [9, 18], [V.night]: [21, 23.5], [V.stat]: [10, 17], [V.book]: [10, 18] };

/** Background students: a spend every few days, repaid on time with a per-student chance, otherwise a few days late. */
function backgroundScripts(s: Script, seed: number) {
  const profiles = [
    { id: "stu-tanvi", pOnTime: 0.93, every: 3.5, lateMax: 4 },
    { id: "stu-vikram", pOnTime: 0.85, every: 4.5, lateMax: 6 },
    { id: "stu-zoya", pOnTime: 0.7, every: 4, lateMax: 8 },
    { id: "stu-arjun", pOnTime: 0.55, every: 5, lateMax: 11 },
  ];
  const vendors = [V.chai, V.chai, V.chai, V.print, V.mess, V.wash, V.night, V.stat, V.book];
  profiles.forEach((p, pi) => {
    const r = rng(seed + 101 * (pi + 1));
    let day = -75 + r() * 3;
    let k = 0;
    while (day < 0) {
      const vendor = vendors[Math.floor(r() * vendors.length)];
      const [lo, hi] = TICKET[vendor];
      const coins = Math.round((lo + r() * (hi - lo)) / 5) * 5 || lo;
      const [h0, h1] = HOURS[vendor];
      const hour = h0 + r() * (h1 - h0);
      const spendDay = Math.floor(day);
      const ref = `bg:${p.id}:${k++}`;
      s.spend(ref, p.id, vendor, coins, spendDay, hour);
      const dueDay = spendDay + 15;
      const onTime = r() < p.pOnTime;
      const repayDay = onTime ? dueDay - Math.floor(r() * 2) : dueDay + 2 + Math.floor(r() * (p.lateMax - 1));
      if (repayDay <= 0) s.repay(ref, repayDay, Math.min(21, Math.max(8, hour)));
      day += p.every * (0.6 + r() * 0.8);
    }
  });
}

// run -------------------------------------------------------------------------------------------------------------

/** The seed completes every settlement the instant it is created: history is already paid. */
function settleScheduled(w: WorldState): WorldState {
  if (!Object.values(w.settlements).some((s) => s.status === "scheduled")) return w;
  return produce(w, (d) => {
    for (const s of Object.values(d.settlements).filter((x) => x.status === "scheduled").sort((a, b) => a.id.localeCompare(b.id))) {
      markProcessing(d, s.id, d.clock.now);
      applySettlementResult(d, s.id, { status: "paid", reference: mockReference(s.id) }, d.clock.now);
    }
  });
}

/** Builds the starting world. Deterministic: the same arguments always give the same world. */
export function buildSeedWorld(seed: number = SEED, now: number = SEED_NOW): WorldState {
  let w = emptyWorld(seed, now - SEED_HISTORY_DAYS * DAY + 6 * 3_600_000);
  w = addPeople(w);

  const script = new Script(now);
  personaScripts(script);
  backgroundScripts(script, seed);
  const refs = new Map<string, string>();
  // anything scripted after "now" belongs to the live demo, not the history
  for (const op of script.ops.filter((o) => o.at <= now).sort((a, b) => a.at - b.at || a.n - b.n)) {
    w = advanceTo(w, op.at);
    w = settleScheduled(w);
    w = op.run(w, refs);
  }
  w = advanceTo(w, now);
  w = settleScheduled(w);

  return produce(w, (d) => {
    // the live demo starts here: keep the last two weeks of notices, and a clock history of its own
    d.notifications = d.notifications.filter((n) => n.at >= now - 14 * DAY);
    d.clock.startedAt = now;
    d.clock.history = [];
  });
}
