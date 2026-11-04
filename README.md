# Kredo (placeholder name): student pay-later web experience

**Demo preview, no real money.** The web app has no auth or payments. Aura (the student view of the in-app score)
comes from the score service in [`services/score`](services/score/README.md) when `SCORE_API_URL` is set; otherwise
the app keeps running on mock data, as before.
Neon-violet "nightclub meets iOS glass" visuals, scroll-driven landing page with a persistent 3D card.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

| Route | What |
|---|---|
| `/` | Landing: pinned scroll scenes, persistent 3D card, 3D score gauge, horizontal vendor strip |
| `/verify` | 4-step verification in a glass sheet (any 6-digit OTP works), coin rain on unlock |
| `/dashboard` | Home: 3D tilt card, 3D score gauge, neon charts. `?demo=error` / `?demo=empty` preview states |
| `/dashboard/pay` · `/activity` · `/profile` | Secondary screens |

## Where things live
- `lib/theme.ts` + `app/globals.css`: colours, blur levels, glow, easing, springs (single source of truth)
- `lib/copy.ts`: ALL copy (Gen Z voice; slang stays out of money, fees, dates, consent, errors and legal text)
- `lib/config.ts`: brand name and pricing constants. `lib/mock-data.ts`: mock data
- `components/glass/`: GlassCard, GlassNav, GlassButton, GlassSheet, GlassInput, GlassSegmented
- `components/three/`: R3F (client only): card mesh, neon lighting, 3D gauge, coin shower
- `components/landing/scenes/`: GSAP ScrollTrigger scenes + the "card rig" (one pose object the scroll timeline writes and renderers read)
- `lib/quality.tsx`: adaptive tiers (high / mid / low) from cores, memory, screen, reduced motion and detect-gpu

## Rules of the house
- GSAP animates scroll scenes and the card rig. Framer Motion animates UI micro-interactions. Never both on one element.
- 3D never blocks first paint: WebGL mounts after load + idle (high tier) or first interaction (others).
- Low tier or no WebGL: CSS 3D card, CSS confetti, lighter blur. Reduced motion: no pinning, scrubbing, parallax or idle motion.

All names, colleges, vendors, amounts, fees and contact details are placeholders.

## Portal, KYC, loans and internal ops (frontend mock)
Everything below is mock state in a thin zustand store (`lib/store`), persisted as status flags only. ID photos and identity numbers are never stored or sent.

| Area | Routes |
|---|---|
| Auth (FR-01) | `/login`, `/signup`, `/recover`, `/dashboard/profile`, `/dashboard/profile/privacy` |
| Verification and KYC (FR-02/03) | `/verify`, `/verify/status`, `/verify/kyc` |
| Loans (FR-04/05) | `/dashboard/loan/apply`, `/dashboard/loans`, `/dashboard/loans/[id]`, `/dashboard/loans/[id]/statement`, `/dashboard/receipts/[paymentId]` |
| Aura (FR-06, flag; replaces the credit profile) | `/dashboard/aura`, `/history`, `/level-up`, `/wrapped`, `/about`; `/dashboard/credit-profile` redirects here |
| Support (FR-07) | `/dashboard/support`, `/dashboard/support/[ticketId]` |
| Internal ops (FR-08 to 12) | `/ops`, `/ops/verifications[/id]`, `/ops/fraud`, `/ops/loans`, `/ops/support[/id]` |
| Ops risk console | `/ops/risk` (overview), `/ops/risk/users[/id]`, `/ops/risk/alerts`, `/ops/risk/overrides`, `/ops/risk/config` |

Env flags (`.env.local`, see `.env.example`): `NEXT_PUBLIC_DEMO_CONTROLS=true` shows the floating Demo Controls panel (every state, presets, ops role, reset). `NEXT_PUBLIC_PHASE2_CREDIT_PROFILE=true` enables the credit profile. Demo Controls are development only and must be removed for production.
Tip: Demo Controls > "Verified + active loan" jumps straight to a populated dashboard.

## MVP demo world (no backend)
A deterministic, resettable, clearly-labelled simulation of student-to-vendor QR payment with coins, loans, midnight
settlement and repayment. Spec and milestones: `docs/MVP_DEMO_PROMPT.md`. Built so far: Milestone 1 (foundations and seed) Milestone 2 (vendor side), Milestone 3 (student pay flow) Milestone 4 (settlement and reconciliation) Milestone 5 (Aura screens), Milestone 6 (Demo Stage and Director) Milestone 7 (metrics, fraud and ops polish) and Milestone 8 (stretch: PDFs, camera scan, spoken captions), plus the final gaps closed (vendor insights and support, the demo student's own activity and profile).

- **Money rule**: coins are a display unit (1 coin = Rs 1), never a wallet. Kredo holds and moves no money: the lender
  pays vendors, students repay the lender. `NbfcPort` has only `submitSettlement` and `getRepaymentStatus`, and a unit
  test pins that. Every screen carries "Demo: simulated data, no real money".
- **One place for numbers**: every threshold, fee, limit, window and cut-off is in `lib/policy.ts` (validated, frozen).
- **Domain** (`lib/domain/`): pure immer reducers over one `WorldState` (`world.ts`), IST time helpers (`time.ts`),
  selectors, role switching rules (`roles.ts`). `lib/aura/engine.ts` derives Aura, tier, ladder level and quest state
  from raw score events only. `lib/settlement.ts` builds the idempotent midnight settlement.
- **Seed** (`lib/demo/seed.ts`): built by running the real reducers over about 110 days of scripted history (fixed seed,
  clock at 30 Oct 2026 09:00 IST), so the ledger reconciles by construction. All names are fictional.
- **Try it**: open `/start`, or Demo controls > Demo world (Reset, clock jumps, jump in as a seeded person). The demo PIN
  is shown on screen. The world is saved in localStorage (`kredo-demo-world`) and Reset rebuilds it.
- **Vendor side** (`/vendor/*`): a five-step onboarding wizard (details with phone code, ID check, bank check with a
  simulated Rs 1 penny-drop, agreement, status), then home with a live feed, payments, QR and profile. Domain rules are
  in `lib/domain/vendors.ts`; the QR payload is signed and versioned in `lib/qr.ts` (the signature is a demo checksum;
  a real build signs on the server). The QR works only for an accepted stall with a verified bank account, and a new
  QR revokes the old one. Ops review is at `/ops/vendors`. Demo controls choose the ID-check and penny-drop outcomes.
- **Student pay flow** (`/dashboard`, `/dashboard/pay`, `/dashboard/loans`): when a demo-world student is signed in
  these routes show the world-backed screens (`components/student/`); with nobody signed in to the world they show the
  original portal screens, unchanged. `lib/domain/pay.ts` holds the gate checks in a fixed order, each with a reason
  code (`LOW_AURA`, `PAST_DUE`, `OVER_LIMIT`, `PRIOR_DEFAULT_CAP`, `SELF_PAY`, velocity and so on), the quote shown before
  consent, and the idempotent submit. Blocked self-pay and velocity breaches leave a fraud flag in the world.
  Repaying (all due, one loan, or a part payment) goes through a simulated hand-off to the lending partner.
- **Settlement** (`lib/settlement.ts`, `lib/reconcile.ts`, `lib/settlement-report.ts`): at each simulated midnight the
  job groups each vendor's payments into one idempotent instruction (`SET-{vendor}-{date}`) and hands it to the mock
  lender, which pays, fails or holds (chosen in Demo controls). Only a paid answer marks payments settled; ops can retry a
  failed or held one. `/ops/settlements` reconciles instructed, paid and ledger totals per business date, flags any
  mismatch, and downloads the report as CSV and JSON. Refunds (`lib/domain/refunds.ts`) are whole-payment: before
  settlement the payment is left out of the batch; after, a negative adjustment is netted into the next one and carries
  forward until a batch can absorb it. Large refunds wait for ops. Vendors see all of this at `/vendor/settlements`
  and `/vendor/disputes`.
- **Aura, limit and recovery** (`/dashboard/aura`, `/dashboard/limit`, `/dashboard/recovery`): the engine in
  `lib/aura/engine.ts` is answered through a `ScoreProvider` (`lib/aura/provider.ts`). The Aura screen shows the score,
  tier, streak, a best next step, the quests with what each adds today (capped at +8 per 30 days, never lifting
  someone above the minimum while something is overdue) and the last ten events with plain reasons. The limit screen
  (`lib/domain/limit.ts`) shows the ladder, what the next step still needs, the post-default cap and what moved the
  limit before. The recovery screen (`lib/domain/recovery.ts`) orders the way back: pay what is overdue, do the
  quests, then an optional small proof-of-repayment payment that is the one spend a low Aura may make.
- **Demo Stage and Director** (`/demo`, `/demo/flow`): a student's phone and a stall's phone side by side, each a real
  page of this app in an iframe (`/demo/frame` signs the frame in as the chosen person). The shared world lives in
  localStorage and windows hear about changes through the `storage` event; each frame keeps its own signed-in person in
  `window.name` (sessionStorage is shared by same-origin frames, so it can't). The ledger strip (`lib/demo/ledger.ts`)
  is rebuilt from the audit log and score events. The money-flow diagram animates on real events and shows no arrow into
  Kredo. The 11 scripted scenarios (`lib/demo/scenarios.ts`) run step by step or by auto-play, each from a fresh seed by
  default, and are unit-tested without a screen. Presenter mode enlarges the phones and hides the pickers.
- **Metrics, fraud and ops** (`/demo/metrics`, `/ops/flags`, `/ops/exposure`, `/ops/limits`, `/ops/audit`): the investor
  metrics (`lib/demo/metrics.ts`) are computed from the world and every card says "Simulated"; the unit-economics
  assumptions are editable, labelled illustrative, and never presented as results. Fraud rules (`lib/domain/flags.ts`,
  thresholds in `lib/policy.ts`) raise flags: self-pay and velocity at pay time, round-number clustering before the
  cut-off, one-student concentration and shared devices at night. They run only for the live demo, not the seed history,
  and never block a payment or move money. Ops can confirm or dismiss a flag with a note, set a limit step by hand
  (reason required, audited, role-gated), see exposure by due-date bucket, and search and export the audit log. Each
  demo-world area has an error screen with "Reset the demo", and a damaged saved world falls back to the seed.
- **Accessibility**: `e2e/insights-mock.spec.ts` runs automated checks (axe, WCAG A and AA, serious and critical fail) over
  every demo-world screen and walks the confirm sheet by keyboard; `lib/a11y.test.ts` checks the colour tokens for contrast.
- **Stretch** (Milestone 8): settlement reports and student statements download as PDFs (`lib/demo/pdf.ts`, jsPDF, built in the
  browser, every page marked simulated); the pay screen can scan a stall QR with the camera (`lib/qr-scan.ts`, jsQR; frames
  are decoded on the device and never stored, and the result goes through the same `checkQr` as a picked stall); scenario
  captions can be read aloud with the browser's speech synthesis (`lib/demo/speech.ts`). Windows on one browser already
  stay live-linked through the `storage` event; syncing across separate phones would need a small shared backend, which
  is not built.
- **Adapters** (`lib/api/`): NbfcPort, ScoreProvider, VerificationProvider, NotificationPort, all with mocks.
- **Tests**: `npm run test:unit` (Vitest, fast-check), `npm run test:e2e` (adds `e2e/world-mock.spec.ts`).

## Aura and the score service
Quick start for the full stack: in `services/score`, `docker compose up -d --build --wait` then `make seed` (600 simulated
students, about 90 s); in the web app set `SCORE_API_URL` (see `.env.example`). The service's README has the
architecture, performance numbers and known gaps; `services/score/RUNBOOK.md` is the operations guide.

- **BFF** (`app/api/score/*`): `me`, `history`, `simulate` (rate-limited per student) and `demo` (demo controls only).
  They sign every call to the service (HMAC, `lib/score/server.ts`) and map responses to the student view
  (`lib/score/view.ts`), which never contains KRS, PD, band or factor points.
- **Mock mode** (`SCORE_API_URL` unset): `lib/score/mock.ts` picks a fixture from the demo state. The fixtures
  (`lib/score/fixtures.json`) are generated by the real engine (`make fixtures` in `services/score`), and go through
  the same mapping as live data.
- **Live mode**: set `SCORE_API_URL`, `SCORE_API_KEY_ID` and `SCORE_API_SECRET` in `.env.local` (see `.env.example`).
  Demo Controls > Aura presets then create a fake student in the service and make it "you" (an httpOnly cookie;
  demo only, real auth must replace it).
- **Copy**: all Aura text is in `lib/copy-aura.ts`. Slang only in tiers, chips, quests and toasts; anything about money,
  overdue amounts, consent or errors stays plain.
- **Types**: `lib/score/api-types.ts` is generated from the service's OpenAPI schema (`make openapi` in services/score).
- **Ops risk console** (`/ops/risk/*`, `components/ops/risk/`; the overview includes model health: KRS drift, calibration, Gini and KS): one BFF route (`app/api/ops/risk/[...path]`) forwards
  an allowlisted set of `/v1/ops` calls, signed, with a short-lived ops JWT for the caller's role
  (`lib/score/ops-server.ts`). The service enforces every role rule. DEMO ONLY: the role comes from the Demo Controls
  role switcher and each role is one fake person; real ops sign-in must replace it. Identifiers are masked unless
  "Show identifiers" is on (logged to the ops audit drawer). Without `SCORE_API_URL` the console is read-only, from
  `lib/score/ops-fixtures.json` (generated by `make fixtures`, loaded only on `/ops/risk`).
- **Tests**: `npm run test:e2e` builds, then runs Playwright against a mock-mode server and a live-mode server backed
  by a fake score service (`e2e/fake-score-service.mjs`) that checks signatures and sends internal fields, so the tests
  prove the BFF strips them.
# Kredo
