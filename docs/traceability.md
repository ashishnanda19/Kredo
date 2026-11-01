# Kredo redesign: traceability and placeholders

Maps every checklist item from the two briefs to the route and component that implements it:

- **F1–F14 and R1–R12** come from "Flighty + Ramp Inspired Redesign".
- **FR-01 to FR-12** come from "Verification, KYC, Loan Flow and Ops Dashboard".

Status key:

- **Built:** matches the brief.
- **Approximate:** the core intent is met, and the gap is stated.
- **Not built:** missing, with the reason.

The status reflects the code on `main` as of 31 Oct 2026, after build step 7.

Evidence from step 7 (production build):

- **Journey script:** the student journey passes end to end, covering login, verification, KYC, loan application, offer acceptance, repayment and the credit profile.
- **Ops script:** passes all checks for reason codes, the audit log and role restrictions.
- **Screens:** no horizontal overflow and no console errors at 360, 768, 1280 or 1920 px.
- **Lighthouse:** accessibility scores 100 on the landing, login and verify pages.

## Flighty items (F1–F14)

| Item | What the brief asks | Route | Component | Status | Notes |
|---|---|---|---|---|---|
| F1 | Indigo announcement bar with link and close X | all pages | `components/shared/announcement-bar.tsx`, `app/layout.tsx` | Built | Text: "Demo preview · no real money moves · Join early access". When closed, a "Demo · no real money" chip stays visible. The closed state is restored before paint. |
| F2 | Nav morphs from flat to floating pill, and inverts on dark sections | `/` | `components/landing/sections/morph-nav.tsx` | Built | The morph runs over the first 80px of scroll using a CSS variable, so it causes no React re-renders. Dark-section detection samples the element under the nav each frame instead of using an IntersectionObserver; the visible result is the same. |
| F3 | Big tight headline, grey paragraph, two badges | `/` | `components/landing/hero/hero-scene.tsx`, `lib/copy-landing.ts` | Built | The headline is "Pay at campus. Settle later." The badges have no laurels, because the brief rules out awards. |
| F4 | Photographic hand holding the phone, fingers over the bezel | `/` | `components/landing/hero/hand-phone.tsx`, `lib/hero-config.ts` | Approximate | A temporary SVG hand is used because `public/hero/hand-phone.png` hasn't been supplied. `PHONE_SCREEN` and the `?debug=1` overlay are ready, and swapping in the photo needs only `HERO_HAND_IMAGE` and calibration. |
| F5 | Two arcs of notification cards, half lit, lit set changing every 1–2 s | `/` | `components/landing/hero/notification-feed.tsx` | Approximate | Cards light in a seeded order as you scroll through each stage, rather than on a timer. There's no per-card parallax drift. Cards sit beside the phone, not tucked behind the hand. Below 1024px a single banner card shows. |
| F6 | Headline scrolls away, phone rises and pins, scene plays out | `/` | `hero-scene.tsx` (CSS sticky plus ScrollTrigger over Lenis) | Approximate | The pinned scene plays across four stages with pointer tilt. However, the headline swaps per stage instead of scrolling away. There's no 20vh rise, no snapping, and no slide-out after the last stage. |
| F7 | Sticky dark segmented control with icons, liquid yellow indicator, tracks scroll | `/` | `components/landing/hero/stage-segmented.tsx` | Approximate | Built: a real `tablist` with arrow-key, Home and End support; a stretch spring on the indicator; it tracks scroll; clicking scrolls to the stage. Gaps: no per-segment icons, and labels are always shown on mobile. |
| F8 | Phone screen changes per stage with an iOS push | `/` | `components/phone-screens/*`, `hero-scene.tsx` | Approximate | Built: verify (pending, then accepted, then limit), campus pay (sheet, then paid), dues list, then passport, then lock screen. Gaps: the push slides sideways rather than up, and stage 4 shows a lock screen instead of the phone leaving. |
| F9 | Background shifts to indigo with violet glow, nav inverts, ghost UI | `/` | `hero-scene.tsx` (`GhostFragments`) | Approximate | Built: indigo with violet glow, nav inversion, drifting ghost cards. The last stage settles to near-black and fades into the dark vendor wall. Gap: the ghosts aren't blurred (blur filters were kept off for speed). |
| F10 | 4×2 dark press-logo wall | `/` | `components/landing/sections/partners-wall.tsx`, `lib/partners.ts` | Approximate | Changed at your request to 12 photo tiles of Indian campus vendors. The names are fictional, each tile is tagged "Illustrative", the photos are CC-licensed from Wikimedia Commons, and credits are on the page. |
| F11 | Dark section with glow-border card and glass callout | `/#features` | `components/landing/sections/dark-features.tsx` | Built | "See where your money goes. Finally!" with the callout "Next due ₹1,150 · in 3 days". |
| F12 | Four tall mood cards with a product visual bleeding off the edge | `/#features` | `dark-features.tsx` | Approximate | Navy, sunset, ember and forest cards with phones (dues, offer, lock screen, receipt). There's no illustration on the sunset card, and no hand holding the lock-screen phone. |
| F13 | Light sections: chip marquee and passport "hall of fame" | `/#vendors`, `/` | `vendor-marquee.tsx`, `passport-hall.tsx` | Approximate | Built: two-way vendor chip marquee with open/closed dots, a "Become a partner" sheet, and a passport section with stats, stamps and the bureau disclaimer. Gaps: one passport phone instead of four; no centred glass vendor card; no tilted map phones or share cards. |
| F14 | "Have a nice …!" ending, device flat-lay, footer with location badges | `/#access` | `ending.tsx`, `curtain-footer.tsx` | Approximate | Built: "Have a nice semester!" with the email pill and a flat-lay of five phones, plus footer columns and city chips. Gaps: no laptop or tablet frames, and no social icons (no accounts exist). |

## Ramp items (R1–R12)

| Item | What the brief asks | Route | Component | Status | Notes |
|---|---|---|---|---|---|
| R1 | Black announcement bar | all pages | `announcement-bar.tsx` | Built | Merged into the single F1 bar, as the brief's mapping section asks. |
| R2 | Nav with dropdowns, Sign in, two buttons, blur | `/` | `morph-nav.tsx` | Approximate | Frosted pill with one accent CTA. There are no dropdowns, and "Log in" appears only in the mobile menu. |
| R3 | Faint dotted grid hero with an email-capture pill | `/` | `components/landing/sections/email-pill.tsx` | Approximate | The pill and its consent line appear in hero stage 4, the ending and the mobile nav menu. There's no dotted grid behind the hero, and no pill under the verify panel. |
| R4 | Animated document panel, selection frames, callouts, scripted cursor | `/` | `components/landing/sections/verify-panel.tsx` | Approximate | A GSAP-timeline cursor boxes a sample ID. Callouts appear: MATCHED · College ID, MATCHED · Name, then NEEDS REVIEW resolving to MATCHED, then LIMIT SET. The cursor doesn't drag front and back files in, and the frame has no corner dots. NEEDS REVIEW is amber, not red, because status colours carry meaning. |
| R5 | Ticker strip with counters ticking up | `/` | `components/landing/sections/live-ticker.tsx` | Built | Counts only, labelled "sample data". It pauses when off screen and stays static under reduced motion. |
| R6 | Logo grid with "+" marks and a dark stat tile | none | none | Not built | Left out because the vendor wall (F10) covers the same ground. The copy (`LANDING.logoGrid`) is in place if you want it. |
| R7 | Two-tone headlines | `/` | `components/landing/sections/two-tone.tsx` | Built | Used in the verify panel, bento, vendors, passport, trust and voices sections. The grey half meets AA contrast. |
| R8 | Bento: 2 large + 3 small cards, ↗ buttons, dotted pattern | `/` | `components/landing/sections/bento.tsx` | Approximate | Built: the layout, two-tone card heads and five product visuals (receipt toast, due card, score ring, limit bars, privacy toggles). Gaps: no ↗ buttons, no dotted pattern, and the Repay card shows a due card rather than a form window. |
| R9 | Chaos collage joined by dotted curved arrows, with parallax | `/` | `components/landing/sections/chaos-calm.tsx` | Approximate | The pinned, scroll-scrubbed fragments collapse to the centre. There are no dotted connector arrows. |
| R10 | Resolves to one calm checklist card | `/` | `chaos-calm.tsx` | Built | The headline swaps to "Now it all lives in one place." and the checklist ticks off. Reduced motion shows a static before and after. |
| R11 | Testimonial marquee | `/` | `components/landing/sections/voices.tsx` | Built | Placeholder only. Every card is tagged "Sample", with no names or avatars, and the section says the quotes are to be replaced with real survey answers. |
| R12 | Rounded CTA panel lifting off a black footer, with a second email capture | `/` | `curtain-footer.tsx`, `ending.tsx`, `.curtain` in `app/globals.css` | Approximate | The curtain only applies on screens at least 768px wide and 780px tall, where the whole footer fits. The footer CTA links to `#access` instead of a second email field. |

## Cross-cutting redesign requirements

| Requirement | Status | Where or why |
|---|---|---|
| One accent (`#F5D832`), no neon, rainbow gradients or serif | Built | Tokens are in `app/globals.css` and `lib/theme.ts`. A codemod replaced 590 legacy tokens, and a hex audit removed the neon. |
| Reusable 390×844 phone screens | Built | `components/phone-screens/` is used in the hero, feature cards, passport and flat-lay. |
| WebGL only for the limit-unlock coin burst | Built | `components/three/coin-rain.tsx`, `coin-shower.tsx` and `studio-env.tsx`. The hero has no WebGL. |
| Optional tilting 3D card on `/dashboard/pay` | Not built | Optional in the brief. Left out to keep WebGL to one use. |
| View Transitions with a shared card element | Not built | Would need Next's experimental view-transition support. |
| Masked line-by-line headline reveals | Not built | Headlines use a fade-and-rise instead. |
| Reduced motion: static hero stages | Approximate | The hero drops the pin and the tabs switch stages in place. Marquees stop and chaos-to-calm goes static. The brief asked for four stacked static blocks. |
| `prefers-reduced-transparency` | Built | `app/globals.css` |
| Dashboard Flighty rows ("3d / DUE IN") | Approximate | That row style is in the phone screens. The real dashboard keeps its existing due and loan cards, restyled. |
| Verify: thin yellow progress line, corner-bracket upload | Approximate | The FR wizard was restyled with the new tokens; it wasn't rebuilt to the iOS sheet layout. |
| AA contrast, focus rings, aria, tablist keyboard support | Built | Lighthouse accessibility is 100 on the landing, login and verify pages. |
| Lighthouse mobile performance 90+ on non-WebGL pages | Approximate | Simulated: landing 86, verify 89, login 92. Observed throttling: landing 98, with LCP 1.8s. The simulated landing score is limited by DOM size. |

## FR-01 to FR-12

All twelve behaviours are unchanged by the redesign; only presentation changed. Two visual substitutions follow the approved redesign plan and are noted below.

| FR | Requirement | Routes | Components | Status | Notes |
|---|---|---|---|---|---|
| FR-01 | Auth and account: OTP sign up and log in, resend timer, attempt limit, session timeout ("Stay signed in"), recovery, profile with locked fields, expired, locked and new-device states | `/login`, `/signup`, `/recover`, `/dashboard/profile` | `portal/auth-flow.tsx`, `forms/otp-input.tsx`, `portal/session-overlays.tsx`, `dashboard/profile-view.tsx`, `portal/demo-controls.tsx` | Built | |
| FR-02 | Verification wizard, ID upload, consent, status screen with every state, dashboard gating | `/verify`, `/verify/status`, `/dashboard` | `portal/verify-wizard.tsx`, `forms/combobox.tsx`, `forms/file-drop.tsx`, `portal/verify-status.tsx`, `portal/dashboard-gate.tsx` | Built | Covers college search with "not listed"; JPG, PNG and HEIC up to 5 MB with camera capture; resubmit with data kept; attempt count; confetti and coin rain on acceptance. |
| FR-03 | KYC and consent: purpose-specific toggles, provider handoff, status card, error, retry and manual review, data rights, masked IDs | `/verify/kyc`, `/dashboard/profile/privacy` | `portal/kyc-flow.tsx`, `portal/consent-toggles.tsx`, `portal/data-rights.tsx`, `portal/mask.tsx` | Built | Consent switches are ink-on when enabled, for contrast. |
| FR-04 | Loan application: products with eligibility, ₹1,000–₹10,000 in steps of 500, creditworthiness form, status tracker, itemised offer, recorded acceptance | `/dashboard/loan/apply`, `/legal/terms`, `/legal/key-facts` | `loans/loan-apply.tsx`, `loans/eligibility.ts`, `loans/offer-view.tsx` | Built | |
| FR-05 | Loans and repayment: separate outstanding lines, schedule, repay sheet, payment states, receipts and statements, disputes, reconciliation indicator | `/dashboard`, `/dashboard/loans`, `/dashboard/loans/[id]`, `/dashboard/loans/[id]/statement`, `/dashboard/receipts/[paymentId]` | `loans/loans-overview.tsx`, `loans/loan-detail.tsx`, `loans/outstanding-card.tsx`, `loans/schedule-table.tsx`, `loans/repay-sheet.tsx`, `loans/payment-list.tsx`, `loans/dispute-sheet.tsx`, `loans/print-docs.tsx` | Built | The "3D tilting virtual card" is now a CSS tilting card (`dashboard/virtual-card.tsx`), with the same flip and show/hide details, per the redesign plan. |
| FR-06 | Credit profile (Phase 2 flag): score or "not available", bureau notice, ranked factors, history, correction request | `/dashboard/credit-profile` | `dashboard/credit-profile.tsx`, `shared/score-gauge.tsx` | Built | The 3D gauge is now a flat ring labelled "Kredo internal score", per the redesign plan. The flag is `NEXT_PUBLIC_PHASE2_CREDIT_PROFILE`. |
| FR-07 | Support: ticket list, new ticket with attachments, detail timeline, statuses, grievance and lender contact card | `/dashboard/support`, `/dashboard/support/[ticketId]` | `support/support-list.tsx`, `support/ticket-form.tsx`, `support/ticket-detail.tsx`, `support/grievance-card.tsx` | Built | |
| FR-08 | Ops overview: KPI tiles, two charts, date range, role-gated CSV export, banner, audit drawer | `/ops` | `ops/overview.tsx`, `ops/ops-shell.tsx`, `ops/audit-drawer.tsx` | Built | Each chart is a single colour. |
| FR-09 | Verification queue: masked search, filters, evidence viewer, reason-coded decisions, KYC result locked | `/ops/verifications`, `/ops/verifications/[id]` | `ops/verifications.tsx`, `ops/verification-detail.tsx` | Built | A reason code is required for every decision, the evidence carries a "Demo" watermark, and the KYC control is disabled with a tooltip. |
| FR-10 | Fraud monitoring: alerts with indicators, no rules shown, analyst actions, false-positive marking, role restriction | `/ops/fraud` | `ops/fraud.tsx`, `ops/common.tsx` | Built | The Support role sees "Access restricted". |
| FR-11 | Loan monitoring: status list, failed events, escalate discrepancy, reconciliation view | `/ops/loans` | `ops/loans.tsx` | Built | |
| FR-12 | Support management: queue with assignment, priority and deadlines, internal-notes split, role-based hiding, history | `/ops/support`, `/ops/support/[ticketId]` | `ops/support.tsx` | Built | |

## Placeholders to replace before launch

Assets:

- `public/hero/hand-phone.png`: the licensed photographic hand-and-phone image. A temporary SVG hand is used until it's supplied. After adding it, set `HERO_HAND_IMAGE` and calibrate `PHONE_SCREEN` in `lib/hero-config.ts` using `/?debug=1`.
- Vendor wall photos and names in `lib/partners.ts` and `public/partners/`: fictional names on CC-licensed photos. Replace them with real partners only with their permission, then drop the "Illustrative" tag and note.

Brand and contacts:

- Brand name "Kredo" (`BRAND.name` in `lib/config.ts`).
- `help@kredo.example` and `campus@kredo.example`.
- Grievance officer and `grievance@kredo.example`.
- Lender "Placeholder Finance Ltd".
- `grievance@lender.example` and `+91 00000 00000`.
- The regulator escalation path text.

Timelines: verification "1 to 2 working days", support replies within 2 working days with acknowledgement in 24 hours, grievance within 7 working days, reversal "5 to 7 working days", and "a short while" for assessment.

Pricing and limits: platform fee ₹5, a 15-day due date, loan charge and processing percentages, and limits of ₹1,000 to ₹10,000. All are mock maths.

Legal content: the privacy notice, terms and key facts pages each say they are placeholders.

Landing sample content:

- **Hero:** the "Sample data" line and the notification feed, including "Riya joined… (sample notification)".
- **Ticker:** the counts.
- **Bento:** score 72 and the limit bars.
- **Passport:** stats and stamp dates.
- **Vendors:** open or closed at 7:30 pm.
- **Voices:** the quotes.
- **Chaos to calm:** invented fragments.
- **Footer:** city list; About, Careers and Press items.
- **FAQ:** the "Is my data safe?" answer.

App mock data:

- The student (Aarav Sharma) and the fictional college list.
- The in-app vendors (Campus Cafe and others).
- UPI and netbanking options.
- The guardian or reference contact field.
- Ops staff (Asha, Ravi and Meera, each marked placeholder), the "Call student" template, and "Not reported to bureaus".
- Every figure in `lib/mock-*.ts`.

Demo scaffolding to remove for production: the announcement-bar demo text and chip, the `DemoTag`, Demo Controls (`NEXT_PUBLIC_DEMO_CONTROLS`), and the "Internal, demo only" ops banner.
