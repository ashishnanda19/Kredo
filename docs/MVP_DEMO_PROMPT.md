# Kredo MVP: Pitch-Ready Demo (Dummy Vendors, Dummy Students, End-to-End Payments)

> **How to use this file.** Save it as `docs/MVP_DEMO_PROMPT.md` in the Kredo repo (ProjectX). Then tell Claude Code:
> *"Read docs/MVP_DEMO_PROMPT.md fully. Build Milestone 1, run the checks, then stop for review. Continue milestone by milestone."*
>
> This file is **self-contained**. It replaces and merges the earlier two prompts (the Aura credit-score prompt and the coins/dashboards prompt) **for MVP scope only**. The bigger credit-score backend (FastAPI, Postgres, scorecard v1 with F1 to F12) stays as the post-MVP roadmap; this MVP ships a small, explainable scoring engine behind the same interface so the big one can replace it later.

---

## Part A: Context

### A1. Goal of this build

The founder (Ashish) must **pitch Kredo and show a live demo**. The demo must prove, with fake-but-realistic data, that the whole product loop works end to end:

> A verified **student** pays a verified **campus vendor** by scanning a QR code using **coins** (credit). That creates a loan. At midnight, the vendors' coins are **settled** (reported to the NBFC for payout). The student **repays** within 15 to 30 days. Paying on time raises the student's **Aura** score and credit limit. Defaulting lowers Aura, blocks new loans below a threshold, and caps the next loan. Side quests help a student recover.

"MVP" here means the **smallest version that is fully functional for this loop and convincing on stage**. It is **not** a production lending system. Nothing real moves: no real money, no real KYC, no real NBFC.

### A2. What Kredo is

- An Indian student micro-credit and pay-later app for campuses.
- A regulated **NBFC is the lender of record**; Kredo is the app and tech partner (lending service provider). Kredo never lends its own money and never holds, pools or moves money.
- The USP is the **two-sided campus network: students and vendors on one QR network**, with an internal, student-friendly score (**Aura**) that is **not a bureau score**.
- The repo today is a polished front-end demo (Next.js, mock zustand store, light theme, yellow accent `#F5D832` on ink `#0B0B0C`). This work turns it from "screens" into a **working simulation** of the full loop.

### A3. The coin model (decided; do not change)

- **1 coin = ₹1.** Coins are a **display unit only**.
- A student's coin balance is simply their **available credit limit** shown in coins (limit minus outstanding principal).
- A vendor's "coins received" is a **receivable**: what the NBFC will pay them.
- Real money would flow only: **NBFC → vendor bank account** (settlement) and **student → NBFC** (repayment). Kredo records, scores and reports. This is deliberate: a stored-value wallet or pooled collection would trigger RBI prepaid-instrument and payment-aggregator rules. (Not legal advice; a fintech lawyer must review before launch.)
- **Never** build: top-ups, withdrawals, student-to-student transfers, a "wallet" balance, or any pooled-money account. Name things `availableLimit` and `vendorReceivable`, never `wallet`.

### A4. Founder's product rules (stated in conversation)

1. Vendors and students have **separate onboarding** and **separate dashboards**, with a **Student | Vendor switch**.
2. Both must be **verified** in the app before any payment can happen.
3. Paying coins creates a **loan**: repay the same amount in rupees plus interest and fees within the repayment window (default 15 days, up to 30).
4. Default lowers Aura. **Below a threshold, no new loans.**
5. On-time repayment and side quests raise Aura; the limit climbs (for example ₹1,000, then ₹2,000, then ₹3,000, and so on).
6. Side quests let someone below the threshold rebuild, but **only quests that truly reduce risk** may raise Aura (otherwise people farm it).
7. **Remember the last default**: after a default, a large request is declined or capped.
8. **Midnight settlement**: at the end of each day Kredo totals each vendor's coins; the NBFC pays the vendor real money for that total.
9. Aura is the **friendly layer** (0 to 100, Gen Z tier names). Underneath it is a **bureau-grade-style risk score**. Slang never appears near money, fees, dates, consent, errors or legal text.
10. A student and a vendor are **separate accounts** (no one account is both), to block circular fraud. The switch is for someone who legitimately has both.

### A5. Existing codebase facts (ProjectX)

- Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui, Framer Motion, Recharts, zustand. **Read `node_modules/next/dist/docs/` before writing code**: this Next.js version has breaking changes (see `AGENTS.md`).
- State: `lib/store/store.ts`, `lib/store/types.ts` (persist key `kredo-demo-state`). Mock data: `lib/mock-data.ts`, `lib/mock-portal.ts`, `lib/mock-ops.ts`. Copy: `lib/copy*.ts`. Config: `lib/config.ts` (`PRICING.platformFee = 5`, `PRICING.dueInDays = 15`). Tokens: `lib/theme.ts`.
- Existing routes: landing, `/signup`, `/login`, `/verify*`, `/dashboard*` (pay, loans, activity, credit-profile, support, profile), `/ops*` (verifications, fraud, loans, support).
- A floating demo-controls panel exists (`NEXT_PUBLIC_DEMO_CONTROLS=true`). Extend it; do not build a second one.
- Reuse components in `components/*` before creating new ones. Keep the existing design language; add no new colours.

### A6. Open questions for the NBFC (do not block the build; make each one a config value in `lib/policy.ts`)

1. Who bears the credit risk on a vendor payment? Default assumption: the NBFC pays the vendor regardless of whether the student repays.
2. Settlement timing and cut-off: T+0 at midnight, or T+1? Default: midnight on the simulated clock.
3. Is there a merchant discount rate or fee on the vendor, or does the lender pay Kredo's fee? Default: 0 for the vendor.
4. Interest rate, fee structure and the required Key Fact Statement format.
5. Minimum and maximum limits, limit-increase rules, and the definition of default (default here: more than 30 days past due).
6. Who verifies the vendor's bank account: the NBFC, a penny-drop provider, or Kredo?
7. Will the NBFC use the Kredo score in its credit decision, and in what form (input only, cut-off, limit-setting)?

### A7. Regulatory notes (not legal advice; a fintech lawyer must review before launch)

- RBI Digital Lending Directions (2025): disbursal and repayment flow directly between borrower and regulated lender, with no pass-through or pool account in the LSP's name; the lender does the credit assessment; the lender pays LSP fees.
- A non-bank cannot load a prepaid payment instrument from a credit line, and collecting and paying out money for others looks like a payment aggregator (RBI authorisation and large net worth needed). This is why coins are display-only.
- Only licensed credit bureaus may share credit information, so the Kredo score is internal only and never presented as a bureau score.
- State money-lender laws and the DPDP Act (consent, retention) also apply.

---

## Part B: The build prompt

### B1. Role and rules

You are a senior full-stack engineer, product designer and demo producer. Build the **MVP demo** inside the existing repo.

**Rules (every milestone):**
1. **Everything is simulated, and says so.** Show a persistent "Demo: simulated data, no real money" label wherever money, vendors or students appear. All seeded names are fictional. Never use real brand names, real people or real college names.
2. **The full loop must work with no backend.** Run entirely in the browser on the zustand store with a clean **adapter layer** (`lib/api/*`) so a real backend can replace it later. Optional multi-device sync is a stretch goal (B13), not a requirement.
3. **Deterministic and resettable.** Seeded data comes from a seed function with a fixed random seed. One click **Reset demo** restores the exact starting state. Any bug that corrupts state must be fixable by Reset.
4. **A simulated clock** (B9). Nothing in the demo waits for real time. The presenter can jump to tomorrow, due date, 3 days late, and so on.
5. **Honest scoring.** Aura is a display layer over one deterministic engine (B8). Never compute two scores. Every Aura change has a plain-English reason.
6. **Config, not hard-codes.** All fees, interest, limits, windows, thresholds and cut-offs live in `lib/policy.ts`. The NBFC will override them later.
7. **Costs before consent.** Before any spend is confirmed, show principal, fee, interest, total repayable and due date.
8. **Idempotent actions.** A double tap on Pay, Repay or Settle never double-books.
9. **Mobile first.** Student and vendor screens must work at 360px width. Presenter screens may be wide.
10. **Copy voice.** Playful only in headlines, empty states and success toasts. Plain and formal for money, fees, dates, consent, errors and legal text. All strings go in the copy files.
11. **Quality gate every milestone:** type-check, lint, build and unit tests pass; the scripted demo scenarios (B11) pass as Playwright tests.

### B2. MVP scope

**In scope (must work end to end):**
- Role chooser, separate student and vendor onboarding (simulated verification), role switcher.
- Seeded dummy campus: vendors, students at different credit stages, historical data.
- Vendor dashboard: QR, live payment feed, today's coins, settlement status, payments list, settlements list, insights, disputes/refunds (basic).
- Student dashboard: coin card (available limit), Scan & Pay, due soon, loans, repay, Aura card, quests, limit ladder, blocked and recovery states.
- Pay flow by QR (real QR rendering; scan simulated by a stall picker, with optional camera scan as a stretch).
- Loan lifecycle: create on pay, due date, reminders (simulated), repay (full and partial), late, overdue, default.
- Aura engine: simple, explainable, deterministic (B8), plus threshold gate, limit ladder, default memory, side quests.
- Midnight settlement job and settlement report (JSON and CSV) with a mock NBFC that pays or fails.
- Ops console basics: verifications queue (students and vendors), vendors, settlements and reconciliation, fraud flags, limit override with audit.
- **Presenter tools**: a split-screen **Demo Stage**, a **Demo Director** panel, a **Money-flow diagram**, an **Investor metrics** screen, and a **scripted scenario runner** (B10 to B12).

**Out of scope (do not build; mention in the roadmap slide only):**
- Real KYC, real bank penny-drop, real NBFC, real UPI, real push or SMS, real camera ID capture beyond the existing mock.
- ML model, bureau data pull, multi-campus rollout, auto-debit mandates, EMI, native apps.

### B3. Accounts, roles and the switcher

- Roles: `student`, `vendor`, `ops`.
- `/start` role chooser: **"I'm a student" / "I run a stall"**.
- **Switcher**: a segmented control `Student | Vendor` in the top bar of both dashboards. It changes the **active role session**. If the other account does not exist, it leads to that role's onboarding. It never silently creates an account.
- In demo mode, add a **Persona picker** (B10) that jumps straight into any seeded student or vendor without typing credentials.
- A real login/PIN screen is simulated: any seeded persona logs in with a demo PIN shown on screen in demo mode.
- Routes:
  - Student: existing `/dashboard/*`.
  - Vendor: `/vendor`, `/vendor/payments`, `/vendor/settlements`, `/vendor/qr`, `/vendor/disputes`, `/vendor/insights`, `/vendor/profile`, `/vendor/support`.
  - Vendor onboarding: `/vendor/onboarding` (details), `/vendor/onboarding/kyc`, `/vendor/onboarding/bank`, `/vendor/onboarding/status`.
  - Presenter: `/demo` (Demo Stage), `/demo/metrics`, `/demo/flow`.

### B4. Onboarding and verification (simulated but realistic)

**Student** (reuse the existing `/verify` wizard):
1. Phone OTP (demo OTP shown on screen: `123456`), college from the fictional list, ID details and photo placeholders, KYC step, consent (data use, NBFC credit assessment, Kredo as app provider, coin terms).
2. Outcome states already exist: `accepted`, `pending`, `rejected`, `resubmission`. Accepted students get the starting limit (L1) and a starter Aura of 50.
3. In demo mode, a **"Fast-forward verification"** control in the Demo Director accepts or rejects a pending application so the presenter does not wait.

**Vendor** (new):
1. Phone OTP, owner name.
2. Stall details: name, category (food, print and stationery, laundry, other), campus area label, hours, stall photo placeholder.
3. KYC: owner ID plus an optional business proof (allow "small stall, no registration" with a lower daily cap).
4. Bank account and IFSC with a simulated **penny-drop** (outcomes: success, name mismatch, provider error; the presenter can choose).
5. Vendor agreement: settlement terms, cut-off time, dispute rules.
6. Status: `pending`, `accepted`, `rejected`, `resubmission`, `suspended`. **The QR is generated only after `accepted` and bank verification.**

**Hard gates:** a payment requires both the student and the vendor to be `accepted`. A suspended or revoked vendor's QR shows "This stall isn't active right now."

### B5. Seeded demo world (fictional)

Build `lib/demo/seed.ts` (fixed seed). Campus: **"Demo University Campus"** (fictional).

**Vendors (8), all fictional:**
| Stall | Category | Notes |
| --- | --- | --- |
| Gupta Chai Tapri | food | high volume, small tickets (₹10 to ₹40) |
| Campus Print Hub | print | ₹5 to ₹150 |
| Hostel Mess Thali | food | ₹60 to ₹120 |
| QuickWash Laundry | laundry | ₹80 to ₹250 |
| Night Canteen | food | busiest after 9pm |
| Stationery Corner | stationery | ₹20 to ₹300 |
| Juice Junction | food | ₹30 to ₹80 |
| Book Barn | stationery | larger tickets, tests daily cap |

Include one vendor in `pending` verification (for the onboarding demo), one `suspended` (for the revoked-QR demo).

**Students (12), with named personas that cover every story:**
| Persona | Story | Aura / limit | State |
| --- | --- | --- | --- |
| Aarav (new) | just verified | 50 / ₹1,000 | no loans |
| Diya (steady) | 5 on-time repayments | 68 / ₹3,000 | one active loan |
| Rohan (streak) | 9 on-time, high tier | 82 / ₹7,500 | on a streak |
| Meera (late once) | paid 4 days late once | 58 / ₹2,000 | one overdue 2 days |
| Kabir (defaulter) | defaulted 40 days ago, cleared | 31 / ₹1,000 | **prior-default cap** active |
| Ishita (blocked) | overdue 35 days | 15 / ₹0 | **blocked**, recovery path |
| Neel (quest runner) | below threshold, doing quests | 24 / ₹1,000 | recovering |
| Sana (power user) | many small spends | 74 / ₹5,000 | frequent |
| plus 4 background students | mixed | mixed | for metrics |

Seed **history**: about 6 weeks of past payments, repayments, settlements and Aura events so the dashboards, charts and metrics look alive from the first screen. Totals must reconcile (sum of vendor receivables equals sum of student loan principal).

**Presenter users:** one `ops` user. Demo PIN for all personas: `1234`.

### B6. The money and coin flow

```
STUDENT (verified, has limit)           VENDOR (verified, has QR)
        |  1. scans vendor QR                    |
        |--------------------------------------->|
        |  2. confirms N coins (= ₹N); sees fee, |
        |     interest, total, due date          |
        |  3. pays                               |
   [Kredo records]  loan created for the student |
   [Kredo records]  vendor receivable +N coins   |
        |                                        |
        |           every night 00:00 (simulated)|
        |   Kredo builds the SETTLEMENT REPORT   |
        |                 |                      |
        |                 v                      |
        |   NBFC pays real ₹ to the vendor's bank (Kredo never touches money)
        |  4. student repays the NBFC (₹ + interest + fee) in 15 to 30 days
        |  5. on time: Aura and limit up.  Late or default: Aura down, limit down or blocked.
```

Definitions: **Available limit** = sanctioned limit minus outstanding principal. **Loan** = one record per spend. **Cut-off** = 00:00 on the simulated clock (config).

### B7. Student side

**Home:** top bar with logo and switcher; coin card (available coins, total limit, bar); a big **Scan & pay**; **Due soon** with Repay; **Aura card** (score, tier, streak, next best action); active quests; recent activity.

**Scan & pay (`/dashboard/pay`):**
1. Scanner screen: camera view placeholder plus **"Pick a stall (demo)"** that selects a vendor QR. Optional stretch: real camera scan with a QR library.
2. Server-style checks run in this order, each with a reason code and plain message: student verified; not blocked; Aura at or above threshold; no loan past grace; amount at or below available limit; amount at or below **post-default cap**; vendor verified, active, under daily cap; not a self-pay; velocity limits.
3. **Confirm sheet:** pay N coins (₹N) to the stall; fee (from `PRICING.platformFee`); interest (config); **total to repay and due date**; limit after this payment; consent line; PIN or OTP.
4. **Idempotent submit.** Result screen with receipt and due date, or a clear failure.
5. Preset chips (20, 50, 100, 200) and a custom amount.

**Loans and repay:** list of spends grouped by due date; detail with schedule, fees, statement; **Repay** (all due, one loan, or partial); simulated "payment to the lending partner" screen. Status chips: `upcoming`, `due today`, `overdue`, `paid`, `defaulted`.

**Limit screen:** current limit, ladder L1 to L6, what raised or lowered it, what the next step needs.

**Blocked and recovery:** calm explanation, what raises Aura, ordered steps (clear overdue, allowed quests, optional micro-spend), progress to threshold, honest time estimate. No countdown pressure, no shaming.

### B8. The Aura engine (MVP version)

Build `lib/aura/engine.ts` as a **pure, deterministic** TypeScript module behind a `ScoreProvider` interface. It is a simplified, explainable version of the full scorecard; the Python credit service from the roadmap will implement the same interface later.

**Mapping (same as the full design, so nothing changes later):**
- Internal **KRS** = `400 + 4 × Aura`, clamped 400 to 800 for MVP. Aura = `clamp(round((KRS − 400) / 4), 0, 100)`.
- Aura is a display layer; there is one number underneath.

**Events and base effects (all in `lib/policy.ts`):**
| Event | Aura effect | Reason code |
| --- | --- | --- |
| Repaid on or before due date | +3 (+1 bonus every 3rd consecutive on-time) | `ON_TIME` |
| Repaid within 1 day grace | 0 | `WITHIN_GRACE` |
| Repaid 2 to 7 days late | −4 | `LATE_1_7` |
| Repaid 8 to 30 days late | −10 | `LATE_8_30` |
| Default (more than 30 days past due) | −25, sets `hasPriorDefault` | `DEFAULT` |
| Partial payment before due date | +1 | `PARTIAL_PAID` |
| Early close of a loan | +1 (once per loan) | `EARLY_CLOSE` |
| Utilisation above 90% of limit at due time | −2 | `HIGH_UTIL` |
| Quest completed (risk-reducing only) | per quest table, capped | `QUEST_*` |

**Recency:** effects of events older than 90 days are halved in the displayed explanation (the engine stores raw events and recomputes; this keeps it auditable).

**Tiers** (display only): Fresh Spawn (new, fewer than 2 repayments), Reset Arc (0 to 29), Side Quest (30 to 49), Locked In (50 to 69), Main Character (70 to 84), Aura Farmer (85 to 100).

**Threshold gate:** if Aura is below `BLOCK_BELOW_AURA` (default 20) **or** any loan is past grace, new spends are blocked.

**Limit ladder (L1 to L6):** ₹1,000, ₹2,000, ₹3,000, ₹5,000, ₹7,500, ₹10,000. A step up needs N consecutive on-time repayments (default 2) and Aura at or above the step minimum (configured: 40, 50, 60, 70, 80). A drop happens on late 8 to 30 (one step) and default (to L1).

**Default memory:** a default sets `hasPriorDefault`, `lastDefaultAt`, `lastDefaultAmount`. Effects: limit to L1; per-spend cap `POST_DEFAULT_CAP` (default ₹500) until the defaulted amount is cleared **and** M on-time repayments follow (default 3); cooling-off of 14 days after clearing before any increase. A request above the cap is **declined with `PRIOR_DEFAULT_CAP`**, never silently reduced.

**Side quests (risk-reducing only):**
| Quest | Aura | Cap |
| --- | --- | --- |
| Verify phone, email and college ID | +2 | once |
| Verify the repayment bank account or UPI handle | +3 | once |
| Set repayment reminders and acknowledge the due date notice | +1 | once |
| Streak of 3 on-time repayments | +3 | per streak |
| "Proof of repayment" micro-spend (₹50, 7 day due date) repaid on time (only if policy allows) | +4 | once per recovery |

Not allowed: points for opening the app, watching content, referrals or any activity that does not change repayment risk. **Quest-sourced Aura is capped at +8 per 30 days and can never lift someone above the threshold while they have an overdue amount.** Quest effects are written as normal score events with reasons.

**Explainability:** the Aura screen shows the last 10 events, each with a plain-English reason and its effect. An "Aura Wrapped" style recap is a nice-to-have.

**Ethics:** never use college name, gender, caste, religion or location as an input. Reward repaying, never borrowing. Never shame a low score.

### B9. Simulated clock, reminders and the midnight job

- A single `clock` in the store. All due dates, lateness, quests and settlements use it.
- **Demo Director controls:** `+1 hour`, `+1 day`, `+3 days`, `Jump to next midnight`, `Jump to due date`, `Jump 8 days past due`, `Jump 31 days past due`, `Reset clock`.
- Each jump runs the same scheduled work the real system would: loan status transitions, reminder events (3 days before, 1 day before, due date, after; shown as in-app notifications and a notification tray), Aura events, and, at midnight, **settlement**.
- **Settlement job (`lib/settlement.ts`):**
  1. Group `received` vendor payments since the last cut-off by vendor.
  2. Per vendor: total coins (= ₹), count, refunds netted, adjustments, final amount, masked bank account, idempotent `settlementId` (vendor + date).
  3. Produce a **settlement instruction** (JSON and downloadable CSV). A mock `NbfcPort` marks it `paid` with a reference after a short delay, or `failed`, or `on_hold` (selectable in the Demo Director).
  4. Update vendor payments to `settled`, the vendor dashboard and the ops reconciliation view.
  5. **Idempotent:** re-running a date creates nothing new. **No code path in the job moves money:** it only calls `NbfcPort.submitSettlement`. A unit test asserts this boundary.

### B10. The Demo Stage and Director (the pitch tools)

**Demo Stage (`/demo`)**: one screen that shows, side by side:
- **Left:** a **student phone frame** (any persona, with the Persona picker above it).
- **Right:** a **vendor phone frame** (any vendor).
- **Centre or bottom:** a **live ledger strip** ("what just happened") showing each event in plain English with a timestamp from the simulated clock: "Diya paid 40 coins to Gupta Chai Tapri", "Loan created, due 17 Nov", "Settlement scheduled 00:00".
- The two phones are **live-linked**: when the student pays on the left, the vendor feed on the right updates instantly with a sound and a highlight.
- A **Presenter mode** toggle that enlarges phones, hides dev chrome and increases font sizes for a projector.

**Demo Director panel** (extend the existing floating demo-controls panel, collapsible):
- Persona pickers for student and vendor; **Reset demo**; clock controls (B9).
- Scenario buttons (B11), each runnable manually or as a one-click auto-play with captions.
- Switches: verification outcome (accept, reject), penny-drop outcome, NBFC settlement outcome (paid, failed, on hold), network error injection on the next pay (to show the idempotent retry).
- A **"Kredo does not touch money"** toggle that overlays the money-flow diagram (below).

**Money-flow diagram (`/demo/flow` and as an overlay):** an animated diagram with four nodes: **Student, Kredo (app and score), NBFC (lender), Vendor**. Arrows animate on real events:
- Pay: Student → Vendor labelled "N coins", while **Kredo** shows "records + scores" and **no money arrow touches Kredo**.
- Midnight: **NBFC → Vendor** "₹ settlement".
- Repay: **Student → NBFC** "₹ + interest".
This diagram is the visual proof of the regulatory model; keep it clean and legible from the back of a room.

### B11. Scripted scenarios (the pitch storyline)

Each scenario is a **repeatable script** with captions, runnable from the Demo Director, and covered by a Playwright test. Target total pitch time of 6 to 8 minutes.

1. **Onboarding in 30 seconds.** A new vendor completes onboarding (penny-drop success), gets a QR. A new student is verified (Fast-forward) and sees L1, Aura 50.
2. **The happy path.** Aarav scans Gupta Chai Tapri's QR, pays 40 coins, sees fee and due date, confirms. The vendor feed pings. Ledger shows the loan. Money-flow diagram animates.
3. **Midnight.** Jump to next midnight. Settlement report appears (per vendor totals, CSV download); mock NBFC marks it paid; vendor sees "Settled, ref SET-…".
4. **Repay on time.** Jump to the due date. Aarav repays; Aura +3; streak shown; limit-ladder progress.
5. **Late payer.** Meera is 2 days overdue; jump to day 6; she repays late; Aura −4 with a plain reason. Show the calm "what happened" copy.
6. **Default and block.** Ishita at 35 days overdue: Aura 15, new spends blocked. Show the blocked screen, then the **recovery path**: clear overdue, complete quests (capped), micro-spend, back above the threshold.
7. **Prior default cap.** Kabir tries to spend ₹1,500: declined with `PRIOR_DEFAULT_CAP`. Spends ₹300: allowed. Show the explanation.
8. **Limit growth.** Rohan on a streak: limit increases from ₹5,000 to ₹7,500 with a notice.
9. **Fraud catch.** A student tries to pay a vendor linked to the same phone or device: blocked with a flag in the ops console. Also: a suspended vendor's QR is rejected.
10. **Idempotent retry.** Inject a network error on the next pay; the student retries; exactly one loan exists.
11. **Dispute and refund.** A vendor refunds a pre-settlement payment; the batch total changes; a post-settlement refund becomes a negative adjustment on the next batch.

### B12. Investor metrics (`/demo/metrics`)

A clean read-only dashboard, **clearly labelled "Simulated data"**, computed from the seeded and live state:
- Total spends (GMV in coins), number of loans, active students, active vendors.
- Repayment rate (on time, late, default), average days to repay, 30+ day delinquency.
- Settlement volume and success rate.
- Aura distribution histogram, tier counts, limit ladder distribution.
- Vendor leaderboard and busiest hours.
- Cohort-style view of on-time repayment by week.
- A "unit economics" card with **editable assumptions** (fee, interest, cost of funds, default loss, CAC) that recomputes margin per loan. Defaults must be labelled "illustrative assumptions", never presented as results.

**Honesty rule:** every number on this screen carries the "Simulated" label. The presenter must never be able to mistake the seed for real traction.

### B13. Stretch goals (only after all milestones pass)

- **Two-device live mode**: sync the store across browser windows with `BroadcastChannel`; optionally across real phones with a tiny shared backend (for example a Next.js route handler plus a hosted database) so the vendor's real phone pings when a student pays on another phone.
- Real camera QR scanning.
- A downloadable PDF of the settlement report and of a student's statement.
- Voice-over friendly captions for scenario auto-play.

### B14. Ops console (MVP)

- **Verifications queue** with a type filter (Student | Vendor); vendor review shows stall photo placeholder and bank match.
- **Vendors**: status, daily cap, suspend or reinstate, QR revoke.
- **Settlements**: daily batches, per vendor status, failure reasons, retry, **reconciliation** (instruction total versus paid total versus sum of payments; any mismatch flagged).
- **Exposure**: outstanding principal, awaiting settlement, by due-date bucket.
- **Fraud flags**: self-pay attempts, velocity breaches, round-amount clustering before cut-off, vendor-student concentration, shared device.
- **Limit override**: reason required, audit entry written, role-gated (reuse `lib/ops-permissions.ts`).
- **Append-only audit log** of payments, refunds, overrides, role switches and settlements.

### B15. Data model (guidance; match repo style)

Add to `lib/store/types.ts`:
- `Account { id, role, phone, status, verification, deviceLinkId? }`
- `StudentProfile { accountId, college, idMasked, limit, availableLimit, aura, tier, hasPriorDefault, lastDefaultAt?, lastDefaultAmount?, blockedReason? }`
- `VendorProfile { accountId, stallName, category, campusArea, hours, bankMasked, bankVerified, dailyCap, qrVersion, status }`
- `Loan { id, studentId, vendorId, coins, fee, interest, totalRepayable, dueDate, status, idempotencyKey, createdAt }`
- `Repayment { id, loanId, amount, at, kind }`
- `VendorReceivable { vendorId, date, totalCoins, status, settlementId? }`
- `Settlement { id, vendorId, date, totalAmount, paymentIds, status, reference?, failureReason? }`
- `ScoreEvent { id, studentId, at, kind, delta, reasonCode, explanation }`
- `Quest { id, title, aura, cap, riskReducing: true, status }`
- `AuditEntry` (reuse existing).
- `DemoClock { now, history[] }`

Adapters (interface plus mock implementation each): `ScoreProvider`, `NbfcPort` (`submitSettlement`, `getRepaymentStatus`), `VerificationProvider` (KYC, penny-drop), `NotificationPort`. Never persist ID numbers or photos (existing rule).

QR payload: a signed, short-lived token with `vendorId`, `qrVersion` and optional fixed amount; no personal data. Render real QR images with a QR library (for example `qrcode`) so the vendor screen shows a scannable code.

### B16. Fraud and abuse (minimum viable, but present)

1. **Self-pay / circular-flow block**: same phone, device group, ID, or bank-account holder between student and vendor is blocked and flagged.
2. **Velocity limits** per student per hour and day, per vendor per hour.
3. **Round-amount clustering** before cut-off and **vendor-student concentration** flagged (rules, not ML).
4. **QR safety**: signed and versioned; regenerate revokes the old QR.
5. **Refund abuse caps** per vendor; large refunds need ops.
6. **Role-switch re-auth** after a timeout.

### B17. Milestones (stop for review after each)

**M1: Foundations and seed.** `lib/policy.ts`, types, adapters with mocks, seed data and Reset, the simulated clock, role chooser, switcher shell, route groups and guards. Unit tests for policy, clock, seed reconciliation.

**M2: Vendor side.** Onboarding wizard (including penny-drop outcomes), QR generation and QR page, vendor home with live feed, payments, profile. Ops vendor verification review.

**M3: Student pay flow.** Scan and pay (stall picker), all gate checks with reason codes, confirm sheet, idempotent submit, receipts, loans and repay (full, partial), notifications tray.

**M4: Settlement and reconciliation.** Midnight job, instructions (JSON and CSV), mock NBFC outcomes, vendor settlements page, ops reconciliation, demo controls.

**M5: Aura engine.** Engine, tiers, threshold gate, limit ladder, default memory, quests with caps, Aura screen with explanations, blocked and recovery screens.

**M6: Demo Stage and Director.** Split-screen stage with live-linked phones, ledger strip, persona pickers, scenario runner (B11), money-flow diagram, presenter mode.

**M7: Metrics, fraud, ops polish.** Investor metrics screen with "Simulated" labels, fraud rules and ops views, audit log, accessibility pass, empty and error states, copy review.

**M8: Stretch (optional).** B13.

**After each milestone:** summarise what changed, what is mocked, what is left, and run the quality gate (B1.11).

### B18. Tests and "done when"

**Unit:** pay-gate order, post-default cap, ladder steps, quest caps, Aura events and recency, settlement grouping and idempotency, refund netting, self-pay block, clock jumps, seed reconciliation.

**Property:** the sum of settled payments equals the sum of settlement instructions; a repeated idempotency key never creates two loans; Aura stays within 0 to 100.

**E2E (Playwright), one per scenario in B11**, plus a full-run test that plays scenarios 1 to 11 in sequence from a fresh Reset.

**Accessibility:** keyboard flow through the confirm sheet; contrast of the yellow accent; 360px layout.

**Done when:**
- From a fresh **Reset demo**, the presenter can run all 11 scenarios in 6 to 8 minutes without touching code or a database.
- A student can pay a vendor by QR, and the vendor's phone frame updates live; the loan, due date, settlement and repayment all reconcile.
- Defaults lower Aura, block new loans below the threshold, cap the next request, and the recovery path restores access using capped, risk-reducing quests.
- The money-flow diagram shows no money touching Kredo.
- Every screen with money shows the demo label; the metrics screen shows "Simulated".
- Type-check, lint, build and tests pass; the app runs with no backend and no environment secrets.

---

## Part C: Pitch pointers (for the founder, not engineering)

1. **Open with the problem** (students run out of money mid-month; no credit file), then go straight to the Demo Stage. Run scenarios 2, 3, 4 first (the loop), then 6 and 7 (what happens when things go wrong), then 9 (fraud), then the money-flow diagram, then metrics.
2. **Say it is a simulation.** Investors respect a clearly labelled demo; they punish fake traction. Pair the demo with a pilot plan: "500 loans in the first 1 to 1.5 quarters on one campus."
3. **Have answers ready** for: Who is the lender? (the NBFC). Who bears the loss on vendor payments? (decide with the NBFC). What stops people gaming Aura? (risk-only quests, caps, collusion rules). Why not a wallet? (regulation). What is the unit economics? (editable assumptions, honestly labelled).
4. **Before any real launch:** fintech lawyer review of the coin model and LSP role; NBFC written approval of how the score is used; RBI Digital Lending Directions compliance (Key Fact Statement, grievance, consent logs); DPDP Act consent; trademark search for "Kredo" in class 36; vendor agreement (non-payment risk, fees, disputes).

## Part D: Post-MVP roadmap (do not build now)

1. Replace `lib/aura/engine.ts` with the FastAPI credit service (scorecard v1, KRS 0 to 1000, odds doubling every 40 points, DPD buckets, anti-gaming, velocity cap) via the same `ScoreProvider` interface.
2. Real KYC and penny-drop providers; real NBFC integration for disbursal-to-vendor and repayment collection; UPI AutoPay or e-NACH behind a flag.
3. Real push, SMS and WhatsApp reminders.
4. Statistical model v2 at about 1,500 to 2,000 labelled loans.
5. Multi-campus rollout, vendor onboarding at scale, collections playbook.
