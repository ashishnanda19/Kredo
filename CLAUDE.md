# Kredo: working notes for Claude Code

Read `AGENTS.md` first: this is a newer Next.js than most training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next code.

## What this is
A student pay-later web app for Indian campuses. Kredo is the **app and technology partner**; a licensed lending partner (an NBFC) does the credit assessment and **moves all the money**. Two codebases:
- the Next.js 16 front end in this folder (React 19, TypeScript strict, Tailwind v4, zustand, Framer Motion, Recharts, zod);
- a Python FastAPI score service in `services/score` (its own README and `RUNBOOK.md`).

The big feature is a **no-backend MVP demo world**: a deterministic, resettable, clearly labelled simulation of student-to-stall QR payment, loans, midnight settlement, repayment, the Aura engine, a two-phone Demo Stage and 11 scripted scenarios. The full spec is `docs/MVP_DEMO_PROMPT.md`. The README describes each part.

## Rules that must not be broken
1. **Money.** Coins are a display unit only (1 coin = Rs 1). Never build or word anything as a wallet, top-up, withdrawal, transfer or pooled money. Kredo never holds or moves money: the lender pays stalls, students repay the lender. Name things `availableLimit`, `vendorReceivable`. The lender port (`lib/api/nbfc-port.ts`) has only `submitSettlement` and `getRepaymentStatus`, and a test pins that.
2. **Everything simulated says so.** The label "Demo: simulated data, no real money" appears wherever money, stalls or students appear; the metrics screen says "Simulated" on every card. All seeded names are fictional. No real brands, banks, people or colleges.
3. **One engine, one number.** Aura is a display layer over one deterministic engine (`lib/aura/engine.ts`, KRS = 400 + 4 x Aura). Never compute a second score. Every Aura change has a plain-English reason. Never use college, gender, caste, religion or location as an input.
4. **Config, not hard-codes.** Every fee, rate, limit, window, threshold and cut-off lives in `lib/policy.ts` (validated, frozen). Interest 1.5% per 30 days, the flat Rs 5 fee and the fraud thresholds are placeholders until the lender sets them.
5. **Costs before consent**, **idempotent actions** (a repeated key never double-books), **simulated clock** (nothing waits for real time), **deterministic seed** (`lib/demo/seed.ts`, one-click Reset).
6. **Copy voice.** Slang only in headlines, empty states, tier names and success toasts. Money, fees, dates, consent, errors and legal text are plain and never shame a low score. All strings live in the copy files (`lib/copy*.ts`); `lib/copy-demo.test.ts` enforces this.
7. **Never store or send** ID photos, ID numbers or full account numbers. Keep only masked values (last four digits).
8. **Do not change** the original portal behaviour (FR-01 to FR-12), the Demo Controls or the disclaimers; extend them. The original portal screens still run for anyone not signed in to the demo world.
9. This is an unreleased, confidential project: keep real business details out of commits, issues, package metadata and public places.

## How the code is organised
- `lib/policy.ts` all numbers. `lib/domain/` pure immer reducers over one `WorldState` (ledger, pay gates, refunds, vendors, fraud flags, exposure). `lib/aura/` the engine. `lib/settlement*.ts`, `lib/reconcile.ts` the midnight job and reports. `lib/api/` adapters with mocks (a real backend replaces them). `lib/demo/` seed, scenarios, ledger, metrics, PDF, speech. `lib/store/` zustand stores (`world.ts` is the demo world).
- `app/` routes: `/start`, `/dashboard/*` (student), `/vendor/*`, `/ops/*`, `/demo` (Stage), `/demo/flow`, `/demo/metrics`. `components/` by area: `student/`, `vendor/`, `ops/`, `demo/`, plus shared `glass/`, `ui/`, `forms/`.
- Look and structure of every screen: `docs/UI.md` and the screenshots in `docs/screens/`.

## Commands
- `npm run typecheck` (runs `next typegen` first: needed after adding routes), `npm run lint`, `npm run test:unit` (Vitest and fast-check).
- `npm run test:e2e` builds then runs Playwright (mock server on 3211, live on 3212 against a fake score service on 4199). Needs `npx playwright install chromium` once. Env for a full run: `NEXT_PUBLIC_DEMO_CONTROLS=true NEXT_PUBLIC_PHASE2_CREDIT_PROFILE=true`.
- `npm run screens` regenerates `docs/screens/*.png` (build first).
- Quality gate for every change: type-check, lint, build and unit tests pass; run the Playwright specs for the area you touched.

## Working habits
- Next 16 specifics: error boundaries get a `retry` prop; run `next typegen` for route types.
- Tests that click right after load can be flaky: wait for a ready marker or retry the click (see `e2e/stage-mock.spec.ts`).
- Commit or push only when asked. Commit trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Dark theme is the default (the spec said light; the owner chose dark). No new colours: use the tokens in `app/globals.css`.
- Mobile first: every screen must work at 360px width with no sideways scroll.
